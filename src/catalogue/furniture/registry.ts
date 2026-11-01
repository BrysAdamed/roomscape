import { bathtub, shower, toilet, washbasin, washingMachine } from './bathroom';
import { bed } from './bed';
import { chair } from './chair';
import { desk, table } from './desk';
import { fridge, kitchenCounter } from './kitchen';
import { sofa, tvUnit } from './living';
import type { FurnitureType } from './types';
import { wardrobe } from './wardrobe';

export const furnitureTypes: readonly FurnitureType[] = [
  bathtub,
  bed,
  chair,
  desk,
  fridge,
  kitchenCounter,
  shower,
  sofa,
  table,
  toilet,
  tvUnit,
  wardrobe,
  washbasin,
  washingMachine,
];

const byId = new Map(furnitureTypes.map((type) => [type.id, type]));

export function findFurnitureType(id: string): FurnitureType | undefined {
  return byId.get(id);
}
