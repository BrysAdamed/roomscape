import { bathtub, shower, toilet, washbasin, washingMachine } from './bathroom';
import { bed } from './bed';
import { chair } from './chair';
import { desk, table } from './desk';
import { cookerHood, fridge, kitchenCounter, wallCabinet } from './kitchen';
import { pendantLamp } from './lamp';
import { sofa, tvUnit } from './living';
import type { FurnitureType } from './types';
import { wardrobe } from './wardrobe';

export interface FurnitureGroup {
  name: string;
  types: readonly FurnitureType[];
}

/** The catalogue grouped by the room it usually goes in; the furniture showroom lays it out this way. */
export const furnitureGroups: readonly FurnitureGroup[] = [
  { name: 'Living room', types: [sofa, tvUnit, table, chair, pendantLamp] },
  { name: 'Kitchen', types: [kitchenCounter, wallCabinet, cookerHood, fridge] },
  { name: 'Bedroom and study', types: [bed, wardrobe, desk] },
  { name: 'Bathroom', types: [bathtub, shower, toilet, washbasin, washingMachine] },
];

export const furnitureTypes: readonly FurnitureType[] = furnitureGroups.flatMap(
  (group) => group.types,
);

const byId = new Map(furnitureTypes.map((type) => [type.id, type]));

export function findFurnitureType(id: string): FurnitureType | undefined {
  return byId.get(id);
}
