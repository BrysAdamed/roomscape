import type { FurnitureItem } from '../../schema/apartment';
import type { FurnitureType } from './types';

export function resolveParams(type: FurnitureType, item: FurnitureItem): Record<string, number> {
  const resolved: Record<string, number> = { ...type.params };
  for (const [name, value] of Object.entries(item.params)) {
    if (typeof value === 'number' && name in type.params) {
      resolved[name] = value;
    }
  }
  return resolved;
}

export function resolveMaterialRefs(
  type: FurnitureType,
  item: FurnitureItem,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(type.slots).map(([slot, definition]) => [
      slot,
      item.materials[slot] ?? definition.default,
    ]),
  );
}
