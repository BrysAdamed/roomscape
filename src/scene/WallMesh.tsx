import { useEffect, useMemo } from 'react';
import type { Material } from 'three';
import type { Opening } from '../schema/apartment';
import { buildWallGeometry } from './geometry/wallGeometry';
import type { WallSpan } from './geometry/wallLayout';
import { meshMaterial } from './materials';

const EDGE_MATERIAL = 'paint-white';

interface WallMeshProps {
  span: WallSpan;
  height: number;
  openings: readonly Opening[];
  override?: Material;
}

export function WallMesh({ span, height, openings, override }: WallMeshProps) {
  const geometry = useMemo(
    () => buildWallGeometry(span, height, openings),
    [span, height, openings],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  const { left, right } = span.wall.materials;
  const materials = useMemo(
    () => [meshMaterial(left), meshMaterial(right), meshMaterial(EDGE_MATERIAL)],
    [left, right],
  );

  return (
    <mesh
      geometry={geometry}
      material={override ?? materials}
      castShadow={!override}
      receiveShadow={!override}
    />
  );
}
