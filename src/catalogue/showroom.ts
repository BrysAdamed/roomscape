import type { Apartment, FurnitureItem, Room } from '../schema/apartment';
import { furnitureGroups } from './furniture/registry';

export const SHOWROOM_ID = 'showroom';
export const SHOWROOM_DESCRIPTION =
  'Every furniture type in the catalogue, side by side; select a piece to see its type id';

const GAP = 0.6;
const ROW_GAP = 1.2;
const MARGIN = 0.5;
const HEIGHT = 2.6;
const FLOOR_MATERIALS = ['wood-oak-natural', 'tile-grey-concrete'];

/** Height above the floor for pieces that hang or sit on the wall. */
const DISPLAY_ELEVATION: Record<string, number> = {
  'wall-cabinet': 1.45,
  'cooker-hood': 1.55,
  'pendant-lamp': 1.9,
};

/** A wall-less apartment showing the whole furniture catalogue, one row per group; built from the registry so new types appear on their own. */
export function buildShowroom(): Apartment {
  const rooms: Room[] = [];
  const furniture: FurnitureItem[] = [];
  let y = 0;
  furnitureGroups.forEach((group, groupIndex) => {
    const sizes = group.types.map((type) => type.size(type.params));
    const depth = Math.max(...sizes.map(([, d]) => d));
    let x = MARGIN;
    group.types.forEach((type, index) => {
      const [width] = sizes[index]!;
      furniture.push({
        id: `showroom-${type.id}`,
        type: type.id,
        position: [round(x + width / 2), round(y + MARGIN + depth / 2)],
        ...(DISPLAY_ELEVATION[type.id] ? { elevation: DISPLAY_ELEVATION[type.id] } : {}),
        rotation: 0,
        params: {},
        materials: {},
      });
      x += width + GAP;
    });
    const right = round(x - GAP + MARGIN);
    const bottom = round(y + depth + 2 * MARGIN);
    rooms.push({
      id: `showroom-${slug(group.name)}`,
      name: group.name,
      polygon: [
        [0, round(y)],
        [right, round(y)],
        [right, bottom],
        [0, bottom],
      ],
      floorMaterial: FLOOR_MATERIALS[groupIndex % FLOOR_MATERIALS.length]!,
    });
    y = bottom + ROW_GAP;
  });

  return {
    schemaVersion: 1,
    id: SHOWROOM_ID,
    name: 'Furniture showroom',
    floors: [
      {
        id: 'showroom-floor',
        name: 'Showroom',
        elevation: 0,
        height: HEIGHT,
        walls: [],
        openings: [],
        rooms,
        furniture,
      },
    ],
  };
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
