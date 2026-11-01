import { useEffect, useMemo } from 'react';
import { BufferGeometry, ExtrudeGeometry, Path, Shape, SphereGeometry, type Material } from 'three';
import { Box } from './Box';

const WALL = 0.012;

interface RecessProps {
  /** Slab size [width (x), depth (z), thickness]; the slab's top is at `position`. */
  slab: [number, number, number];
  /** Opening size [width, depth] and its centre offset [x, z] within the slab. */
  opening: [number, number];
  offset?: [number, number];
  /** How deep the bowl goes below the slab top. */
  depth: number;
  shape: 'oval' | 'rect';
  position: [number, number, number];
  slabMaterial: Material;
  bowlMaterial: Material;
}

/** A slab with a sunken bowl: washbasin tops and kitchen sinks. */
export function Recess({
  slab,
  opening,
  offset = [0, 0],
  depth,
  shape,
  position,
  slabMaterial,
  bowlMaterial,
}: RecessProps) {
  const [width, slabDepth, thickness] = slab;
  const [openingWidth, openingDepth] = opening;
  const [ox, oz] = offset;
  const slabGeometry = useMemo(
    () => slabWithHole(width, slabDepth, thickness, openingWidth, openingDepth, ox, oz, shape),
    [width, slabDepth, thickness, openingWidth, openingDepth, ox, oz, shape],
  );
  const bowlGeometry = useMemo(() => (shape === 'oval' ? insideHemisphere() : undefined), [shape]);
  useEffect(() => () => slabGeometry.dispose(), [slabGeometry]);
  useEffect(() => () => bowlGeometry?.dispose(), [bowlGeometry]);

  const [x, y, z] = position;
  return (
    <group position={[x, y, z]}>
      <mesh geometry={slabGeometry} material={slabMaterial} castShadow receiveShadow />
      {bowlGeometry ? (
        <mesh
          geometry={bowlGeometry}
          position={[ox, 0, oz]}
          scale={[openingWidth / 2, depth, openingDepth / 2]}
          material={bowlMaterial}
          receiveShadow
        />
      ) : (
        <RectBowl
          width={openingWidth}
          depth={openingDepth}
          height={depth}
          offset={[ox, oz]}
          material={bowlMaterial}
        />
      )}
    </group>
  );
}

interface RectBowlProps {
  width: number;
  depth: number;
  height: number;
  offset: [number, number];
  material: Material;
}

function RectBowl({ width, depth, height, offset: [x, z], material }: RectBowlProps) {
  const y = -height / 2;
  return (
    <group position={[x, 0, z]}>
      <Box size={[width, WALL, depth]} position={[0, -height + WALL / 2, 0]} material={material} />
      <Box
        size={[WALL, height, depth]}
        position={[-width / 2 + WALL / 2, y, 0]}
        material={material}
      />
      <Box
        size={[WALL, height, depth]}
        position={[width / 2 - WALL / 2, y, 0]}
        material={material}
      />
      <Box
        size={[width, height, WALL]}
        position={[0, y, -depth / 2 + WALL / 2]}
        material={material}
      />
      <Box
        size={[width, height, WALL]}
        position={[0, y, depth / 2 - WALL / 2]}
        material={material}
      />
    </group>
  );
}

function slabWithHole(
  width: number,
  depth: number,
  thickness: number,
  holeWidth: number,
  holeDepth: number,
  holeX: number,
  holeZ: number,
  shape: 'oval' | 'rect',
): BufferGeometry {
  const outline = new Shape();
  outline.moveTo(-width / 2, -depth / 2);
  outline.lineTo(width / 2, -depth / 2);
  outline.lineTo(width / 2, depth / 2);
  outline.lineTo(-width / 2, depth / 2);
  outline.lineTo(-width / 2, -depth / 2);

  const hole = new Path();
  if (shape === 'oval') {
    hole.absellipse(holeX, -holeZ, holeWidth / 2, holeDepth / 2, 0, Math.PI * 2, true, 0);
  } else {
    hole.moveTo(holeX - holeWidth / 2, -holeZ - holeDepth / 2);
    hole.lineTo(holeX - holeWidth / 2, -holeZ + holeDepth / 2);
    hole.lineTo(holeX + holeWidth / 2, -holeZ + holeDepth / 2);
    hole.lineTo(holeX + holeWidth / 2, -holeZ - holeDepth / 2);
    hole.lineTo(holeX - holeWidth / 2, -holeZ - holeDepth / 2);
  }
  outline.holes.push(hole);

  const geometry = new ExtrudeGeometry(outline, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 32,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -thickness, 0);
  return geometry;
}

/** Unit lower hemisphere with its faces turned inwards, so the inside of a bowl is visible. */
function insideHemisphere(): BufferGeometry {
  const geometry = new SphereGeometry(1, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const index = geometry.getIndex()!;
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i + 1);
    index.setX(i + 1, index.getX(i + 2));
    index.setX(i + 2, a);
  }
  const normal = geometry.getAttribute('normal');
  for (let i = 0; i < normal.count; i++) {
    normal.setXYZ(i, -normal.getX(i), -normal.getY(i), -normal.getZ(i));
  }
  return geometry;
}
