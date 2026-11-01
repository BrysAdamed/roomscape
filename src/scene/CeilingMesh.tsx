import { useEffect, useMemo } from 'react';
import type { Floor, PlanPoint } from '../schema/apartment';
import { buildCeilingGeometry } from './geometry/ceilingGeometry';
import { roofWindowFootprint, slopeAt } from './geometry/roof';
import { meshMaterial } from './materials';

const CEILING_MATERIAL = 'paint-white';

/**
 * Ceiling over the indoor rooms, sloped under a roof. One-sided, so it hides when seen from above; it still casts
 * shadows (three renders its back faces into the shadow map), so sunlight only gets in through the openings.
 */
/** Stairwells to the storey above and roof window openings. */
function ceilingOpenings(floor: Floor): PlanPoint[][] {
  const stairwells = (floor.stairs ?? []).flatMap((stairs) => stairs.steps);
  const roof = floor.roof;
  const windows = (roof?.windows ?? []).flatMap((roofWindow) => {
    const slope = roof && slopeAt(roof, floor.height, roofWindow.position);
    return slope ? [roofWindowFootprint(roofWindow, slope)] : [];
  });
  return [...stairwells, ...windows];
}

export function CeilingMesh({ floor }: { floor: Floor }) {
  const geometry = useMemo(
    () =>
      buildCeilingGeometry(
        floor.roof,
        floor.height,
        floor.rooms.filter((room) => !room.outdoor).map((room) => room.polygon),
        ceilingOpenings(floor),
      ),
    [floor],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh
      geometry={geometry}
      material={meshMaterial(CEILING_MATERIAL)}
      castShadow
      receiveShadow
      raycast={() => {}}
    />
  );
}
