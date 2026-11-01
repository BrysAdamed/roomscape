import { useEffect, useMemo } from 'react';
import type { Material } from 'three';
import type { Stairs } from '../schema/apartment';
import { buildStairsGeometry } from './geometry/stairsGeometry';
import { meshMaterial } from './materials';

export function StairsMesh({ stairs, override }: { stairs: Stairs; override?: Material }) {
  const geometry = useMemo(() => buildStairsGeometry(stairs), [stairs]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh
      geometry={geometry}
      material={override ?? meshMaterial(stairs.material)}
      castShadow={!override}
      receiveShadow={!override}
    />
  );
}
