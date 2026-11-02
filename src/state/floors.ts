import type { Apartment, Floor } from '../schema/apartment';

export interface FloorVisibility {
  floor: Floor;
  /** Drawn translucent. */
  ghost: boolean;
  /** Its walls, rooms and furniture can be selected; only the active floor is. */
  interactive: boolean;
}

export interface FloorVisibilityOptions {
  /** Show the floors below the active one as ghosts. */
  showLower: boolean;
  /** Show every floor solid, so a walker sees the storeys above and below through the stairwell. */
  walk: boolean;
}

export function activeFloor(
  apartment: Apartment,
  activeFloorId: string | undefined,
): Floor | undefined {
  return apartment.floors.find((floor) => floor.id === activeFloorId) ?? apartment.floors[0];
}

/** The active floor, plus the floors below it as ghosts when `showLower` is set; floors above are hidden unless walking. */
export function visibleFloors(
  apartment: Apartment,
  activeFloorId: string | undefined,
  { showLower, walk }: FloorVisibilityOptions,
): FloorVisibility[] {
  const active = activeFloor(apartment, activeFloorId);
  if (!active) {
    return [];
  }
  if (walk) {
    return apartment.floors.map((floor) => ({
      floor,
      ghost: false,
      interactive: floor === active,
    }));
  }
  return apartment.floors
    .filter((floor) => floor === active || (showLower && floor.elevation < active.elevation))
    .map((floor) => ({ floor, ghost: floor !== active, interactive: floor === active }));
}
