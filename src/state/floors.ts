import type { Apartment, Floor } from '../schema/apartment';

export interface FloorVisibility {
  floor: Floor;
  ghost: boolean;
}

export function activeFloor(
  apartment: Apartment,
  activeFloorId: string | undefined,
): Floor | undefined {
  return apartment.floors.find((floor) => floor.id === activeFloorId) ?? apartment.floors[0];
}

/** The active floor, plus the floors below it as ghosts when `showLower` is set; floors above are hidden. */
export function visibleFloors(
  apartment: Apartment,
  activeFloorId: string | undefined,
  showLower: boolean,
): FloorVisibility[] {
  const active = activeFloor(apartment, activeFloorId);
  if (!active) {
    return [];
  }
  return apartment.floors
    .filter((floor) => floor === active || (showLower && floor.elevation < active.elevation))
    .map((floor) => ({ floor, ghost: floor !== active }));
}
