import type { Apartment, Floor, VariantChange } from '../schema/apartment';

export interface AppliedVariant {
  apartment: Apartment;
  /** Changes that could not be applied, e.g. ones referencing an id the base no longer has. */
  errors: string[];
}

/**
 * The apartment as a variant shows it: the base with the variant's changes applied, named after the variant and
 * without the variant list. Without a variant id (or for an unknown one) the base is returned unchanged.
 */
export function applyVariant(apartment: Apartment, variantId: string | undefined): AppliedVariant {
  const index = apartment.variants?.findIndex((candidate) => candidate.id === variantId) ?? -1;
  const variant = apartment.variants?.[index];
  if (!variant) {
    return { apartment, errors: [] };
  }
  const errors: string[] = [];
  let floors = apartment.floors;
  variant.changes.forEach((change, changeIndex) => {
    const next = applyChange(floors, change);
    if (next) {
      floors = next;
    } else {
      const target = change.op === 'add' ? `floor '${change.floorId}'` : `'${change.id}'`;
      errors.push(
        `variants.${index}.changes.${changeIndex}: ${change.op} refers to unknown ${target}`,
      );
    }
  });
  const name = `${apartment.name} – ${variant.name}`;
  return { apartment: { ...apartment, name, floors, variants: undefined }, errors };
}

function applyChange(floors: Floor[], change: VariantChange): Floor[] | undefined {
  if (change.op === 'add') {
    const found = floors.some((floor) => floor.id === change.floorId);
    return found
      ? floors.map((floor) =>
          floor.id === change.floorId
            ? { ...floor, furniture: [...floor.furniture, change.item] }
            : floor,
        )
      : undefined;
  }
  let found = false;
  const next = floors.map((floor) => {
    const updated = change.op === 'remove' ? removeFrom(floor, change.id) : updateIn(floor, change);
    found ||= updated !== floor;
    return updated;
  });
  return found ? next : undefined;
}

function removeFrom(floor: Floor, id: string): Floor {
  const keep = <T extends { id: string }>(items: T[]) => items.filter((item) => item.id !== id);
  if (floor.walls.some((wall) => wall.id === id)) {
    return {
      ...floor,
      walls: keep(floor.walls),
      openings: floor.openings.filter((opening) => opening.wallId !== id),
    };
  }
  const lists = ['openings', 'rooms', 'furniture', 'railings', 'stairs'] as const;
  for (const list of lists) {
    const items = floor[list] as { id: string }[] | undefined;
    if (items?.some((item) => item.id === id)) {
      return { ...floor, [list]: keep(items) };
    }
  }
  return floor;
}

function updateIn(floor: Floor, change: Extract<VariantChange, { op: 'update' }>): Floor {
  const { params, materials, floorMaterial, ...placement } = change.set;
  if (floor.furniture.some((item) => item.id === change.id)) {
    return {
      ...floor,
      furniture: floor.furniture.map((item) =>
        item.id === change.id
          ? {
              ...item,
              ...placement,
              params: { ...item.params, ...params },
              materials: { ...item.materials, ...materials },
            }
          : item,
      ),
    };
  }
  if (floor.rooms.some((room) => room.id === change.id) && floorMaterial) {
    return {
      ...floor,
      rooms: floor.rooms.map((room) => (room.id === change.id ? { ...room, floorMaterial } : room)),
    };
  }
  if (floor.walls.some((wall) => wall.id === change.id) && materials) {
    return {
      ...floor,
      walls: floor.walls.map((wall) =>
        wall.id === change.id ? { ...wall, materials: { ...wall.materials, ...materials } } : wall,
      ),
    };
  }
  return floor;
}
