import { bed } from './bed';
import { chair } from './chair';
import { desk } from './desk';
import type { FurnitureType } from './types';
import { wardrobe } from './wardrobe';

export const furnitureTypes: readonly FurnitureType[] = [bed, chair, desk, wardrobe];

const byId = new Map(furnitureTypes.map((type) => [type.id, type]));

export function findFurnitureType(id: string): FurnitureType | undefined {
  return byId.get(id);
}
