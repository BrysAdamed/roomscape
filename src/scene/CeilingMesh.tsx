import { useEffect, useMemo } from 'react';
import type { Floor, Roof } from '../schema/apartment';
import { buildCeilingGeometry } from './geometry/ceilingGeometry';
import { meshMaterial } from './materials';

const CEILING_MATERIAL = 'paint-white';

/** Sloped attic ceiling over the indoor rooms; one-sided, so it hides when seen from above. */
export function CeilingMesh({ floor, roof }: { floor: Floor; roof: Roof }) {
  const geometry = useMemo(
    () =>
      buildCeilingGeometry(
        roof,
        floor.height,
        floor.rooms.filter((room) => !room.outdoor).map((room) => room.polygon),
      ),
    [roof, floor.height, floor.rooms],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh
      geometry={geometry}
      material={meshMaterial(CEILING_MATERIAL)}
      receiveShadow
      raycast={() => {}}
    />
  );
}
