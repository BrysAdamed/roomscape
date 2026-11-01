import { findFurnitureType } from '../../catalogue/furniture/registry';
import { resolveParams } from '../../catalogue/furniture/resolve';
import type { Apartment, Floor, FurnitureItem, Room, Stairs, Wall } from '../../schema/apartment';
import { wallLength } from '../../schema/validate';
import { findElement } from '../../state/apartmentEdits';

export type Vec3 = [number, number, number];

/** A measured segment in world coordinates (metres, Y up). */
export interface DimensionLine {
  start: Vec3;
  end: Vec3;
  value: number;
}

const OFFSET = 0.06;
const ABOVE_WALL = 0.08;
const ABOVE_FLOOR = 0.02;

export function elementDimensions(apartment: Apartment, id: string): DimensionLine[] {
  const element = findElement(apartment, id);
  if (!element) {
    return [];
  }
  switch (element.kind) {
    case 'wall':
      return wallDimensions(element.wall, element.floor);
    case 'room':
      return roomDimensions(element.room, element.floor);
    case 'furniture':
      return furnitureDimensions(element.item, element.floor);
    case 'stairs':
      return stairsDimensions(element.stairs, element.floor);
  }
}

export function wallLengthLine(wall: Wall, floor: Floor): DimensionLine {
  const y = floor.elevation + (wall.height ?? floor.height) + ABOVE_WALL;
  return {
    start: [wall.start[0], y, wall.start[1]],
    end: [wall.end[0], y, wall.end[1]],
    value: wallLength(wall.start, wall.end),
  };
}

export function wallDimensions(wall: Wall, floor: Floor): DimensionLine[] {
  const height = wall.height ?? floor.height;
  const [x, z] = wall.start;
  return [
    wallLengthLine(wall, floor),
    { start: [x, floor.elevation, z], end: [x, floor.elevation + height, z], value: height },
  ];
}

export function roomDimensions(room: Room, floor: Floor): DimensionLine[] {
  const y = floor.elevation + ABOVE_FLOOR;
  return room.polygon.map((point, index) => {
    const next = room.polygon[(index + 1) % room.polygon.length]!;
    return {
      start: [point[0], y, point[1]],
      end: [next[0], y, next[1]],
      value: wallLength(point, next),
    };
  });
}

export function furnitureDimensions(item: FurnitureItem, floor: Floor): DimensionLine[] {
  const type = findFurnitureType(item.type);
  if (!type) {
    return [];
  }
  const [width, depth, height] = type.size(resolveParams(type, item));
  const angle = (item.rotation * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const base = floor.elevation + (item.elevation ?? 0);
  const place = ([x, y, z]: Vec3): Vec3 => [
    item.position[0] + x * cos + z * sin,
    base + y,
    item.position[1] - x * sin + z * cos,
  ];
  const right = width / 2 + OFFSET;
  const front = depth / 2 + OFFSET;
  const line = (start: Vec3, end: Vec3, value: number): DimensionLine => ({
    start: place(start),
    end: place(end),
    value,
  });

  return [
    line([-width / 2, height, front], [width / 2, height, front], width),
    line([right, height, -depth / 2], [right, height, depth / 2], depth),
    line([right, 0, front], [right, height, front], height),
  ];
}

export function stairsDimensions(stairs: Stairs, floor: Floor): DimensionLine[] {
  const [x, z] = stairs.steps[0]![0]!;
  const rise = stairs.riserHeight * (stairs.steps.length + 1);
  return [{ start: [x, floor.elevation, z], end: [x, floor.elevation + rise, z], value: rise }];
}
