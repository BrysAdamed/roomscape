import { bathtub, shower, toilet, washbasin, washingMachine } from './bathroom';
import { bed } from './bed';
import { chair } from './chair';
import { desk, table } from './desk';
import { cookerHood, fridge, kitchenCounter, wallCabinet } from './kitchen';
import { sofa, tvUnit } from './living';
import type { FurnitureType } from './types';
import { wardrobe } from './wardrobe';

export const furnitureTypes: readonly FurnitureType[] = [
  bathtub,
  bed,
  chair,
  cookerHood,
  desk,
  fridge,
  kitchenCounter,
  shower,
  sofa,
  table,
  toilet,
  tvUnit,
  wallCabinet,
  wardrobe,
  washbasin,
  washingMachine,
];

const byId = new Map(furnitureTypes.map((type) => [type.id, type]));

export function findFurnitureType(id: string): FurnitureType | undefined {
  return byId.get(id);
}
