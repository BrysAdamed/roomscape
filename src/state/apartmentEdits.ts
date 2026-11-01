import type { Apartment, Floor, Stairs } from '../schema/apartment';

export type WallSide = 'left' | 'right';

export type SelectableElement =
  | { kind: 'wall'; floor: Floor; wall: Floor['walls'][number] }
  | { kind: 'room'; floor: Floor; room: Floor['rooms'][number] }
  | { kind: 'furniture'; floor: Floor; item: Floor['furniture'][number] }
  | { kind: 'stairs'; floor: Floor; stairs: Stairs };

export function findElement(apartment: Apartment, id: string): SelectableElement | undefined {
  for (const floor of apartment.floors) {
    const wall = floor.walls.find((candidate) => candidate.id === id);
    if (wall) return { kind: 'wall', floor, wall };
    const room = floor.rooms.find((candidate) => candidate.id === id);
    if (room) return { kind: 'room', floor, room };
    const item = floor.furniture.find((candidate) => candidate.id === id);
    if (item) return { kind: 'furniture', floor, item };
    const stairs = floor.stairs?.find((candidate) => candidate.id === id);
    if (stairs) return { kind: 'stairs', floor, stairs };
  }
  return undefined;
}

export function setWallMaterial(
  apartment: Apartment,
  wallId: string,
  side: WallSide,
  ref: string,
): Apartment {
  return updateFloors(apartment, (floor) => {
    const walls = replaceById(floor.walls, wallId, (wall) => ({
      ...wall,
      materials: { ...wall.materials, [side]: ref },
    }));
    return walls === floor.walls ? floor : { ...floor, walls };
  });
}

export function setRoomFloorMaterial(apartment: Apartment, roomId: string, ref: string): Apartment {
  return updateFloors(apartment, (floor) => {
    const rooms = replaceById(floor.rooms, roomId, (room) => ({ ...room, floorMaterial: ref }));
    return rooms === floor.rooms ? floor : { ...floor, rooms };
  });
}

export function setFurnitureMaterial(
  apartment: Apartment,
  itemId: string,
  slot: string,
  ref: string,
): Apartment {
  return updateFloors(apartment, (floor) => {
    const furniture = replaceById(floor.furniture, itemId, (item) => ({
      ...item,
      materials: { ...item.materials, [slot]: ref },
    }));
    return furniture === floor.furniture ? floor : { ...floor, furniture };
  });
}

export function setStairsMaterial(apartment: Apartment, stairsId: string, ref: string): Apartment {
  return updateFloors(apartment, (floor) => {
    if (!floor.stairs) {
      return floor;
    }
    const stairs = replaceById(floor.stairs, stairsId, (item) => ({ ...item, material: ref }));
    return stairs === floor.stairs ? floor : { ...floor, stairs };
  });
}

function updateFloors(apartment: Apartment, update: (floor: Floor) => Floor): Apartment {
  const floors = apartment.floors.map(update);
  return floors.every((floor, index) => floor === apartment.floors[index])
    ? apartment
    : { ...apartment, floors };
}

function replaceById<T extends { id: string }>(
  items: T[],
  id: string,
  update: (item: T) => T,
): T[] {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) {
    return items;
  }
  const copy = [...items];
  copy[index] = update(items[index]!);
  return copy;
}
