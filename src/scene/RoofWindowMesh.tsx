import { useMemo } from 'react';
import { Matrix4, Quaternion, Vector3 } from 'three';
import type { Roof, RoofWindow } from '../schema/apartment';
import { DEFAULT_ROOF_WINDOW_MATERIAL, slopeAt, slopeHeight } from './geometry/roof';
import { meshMaterial } from './materials';

const FRAME = 0.06;
const DEPTH = 0.2;
const INTO_ROOM = 0.02;
const GLASS_MATERIAL = 'glass-clear';
const DEG = Math.PI / 180;

interface RoofWindowMeshProps {
  roofWindow: RoofWindow;
  roof: Roof;
  height: number;
}

/** A window set into the roof slope above its plan position; `width` runs along the eaves, `length` up the slope. */
export function RoofWindowMesh({ roofWindow, roof, height }: RoofWindowMeshProps) {
  const placement = useMemo(() => {
    const slope = slopeAt(roof, height, roofWindow.position);
    if (!slope) {
      return undefined;
    }
    const [ux, uz] = slope.uphill;
    const pitch = slope.pitch * DEG;
    const along = new Vector3(-uz, 0, ux);
    const up = new Vector3(ux * Math.cos(pitch), Math.sin(pitch), uz * Math.cos(pitch));
    const normal = new Vector3().crossVectors(along, up);
    if (normal.y > 0) {
      along.negate();
      normal.negate();
    }
    const quaternion = new Quaternion().setFromRotationMatrix(
      new Matrix4().makeBasis(along, up, normal),
    );
    const center = new Vector3(
      roofWindow.position[0],
      slopeHeight(slope, roofWindow.position),
      roofWindow.position[1],
    ).addScaledVector(normal, INTO_ROOM - DEPTH / 2);
    return { quaternion, center };
  }, [roof, height, roofWindow.position]);

  if (!placement) {
    return null;
  }
  const { width, length } = roofWindow;
  const frame = meshMaterial(roofWindow.material ?? DEFAULT_ROOF_WINDOW_MATERIAL);
  const bars: [number, number, number, number][] = [
    [0, length / 2 - FRAME / 2, width, FRAME],
    [0, -length / 2 + FRAME / 2, width, FRAME],
    [-width / 2 + FRAME / 2, 0, FRAME, length],
    [width / 2 - FRAME / 2, 0, FRAME, length],
  ];

  return (
    <group position={placement.center} quaternion={placement.quaternion}>
      {bars.map(([x, y, barWidth, barLength], index) => (
        <mesh key={index} position={[x, y, 0]} material={frame} receiveShadow>
          <boxGeometry args={[barWidth, barLength, DEPTH]} />
        </mesh>
      ))}
      <mesh material={meshMaterial(GLASS_MATERIAL)}>
        <boxGeometry args={[width - 2 * FRAME, length - 2 * FRAME, 0.01]} />
      </mesh>
    </group>
  );
}
