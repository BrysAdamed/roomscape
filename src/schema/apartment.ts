import { z } from 'zod';

export const SCHEMA_VERSION = 1;

const id = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'ids use lower-case letters, digits and dashes');

export const CUSTOM_COLOR_PATTERN = /^#[0-9a-f]{6}$/;

const materialRef = z.union([
  id,
  z.string().regex(CUSTOM_COLOR_PATTERN, 'custom colours use the #rrggbb format'),
]);

const positive = z.number().positive();
const nonNegative = z.number().nonnegative();

export const planPointSchema = z.tuple([z.number(), z.number()]);

export const wallSchema = z.object({
  id,
  start: planPointSchema,
  end: planPointSchema,
  thickness: positive,
  height: positive.optional(),
  materials: z.object({
    left: materialRef,
    right: materialRef,
  }),
});

export const doorSchema = z.object({
  hinge: z.enum(['start', 'end']),
  opensTo: z.enum(['left', 'right']),
  material: materialRef.optional(),
});

export const openingSchema = z.object({
  id,
  wallId: id,
  kind: z.enum(['door', 'window']),
  offset: nonNegative,
  width: positive,
  height: positive,
  sillHeight: nonNegative,
  door: doorSchema.optional(),
});

export const roomSchema = z.object({
  id,
  name: z.string().min(1),
  polygon: z.array(planPointSchema).min(3),
  floorMaterial: materialRef,
});

export const furnitureSchema = z.object({
  id,
  type: id,
  position: planPointSchema,
  elevation: nonNegative.optional(),
  rotation: z.number(),
  params: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])),
  materials: z.record(z.string(), materialRef),
});

export const stairsSchema = z.object({
  id,
  riserHeight: positive,
  steps: z.array(z.array(planPointSchema).min(3)).min(1),
  material: materialRef,
});

export const floorSchema = z.object({
  id,
  name: z.string().min(1),
  elevation: z.number(),
  height: positive,
  walls: z.array(wallSchema),
  openings: z.array(openingSchema),
  rooms: z.array(roomSchema),
  furniture: z.array(furnitureSchema),
  stairs: z.array(stairsSchema).optional(),
});

export const apartmentSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id,
  name: z.string().min(1),
  floors: z.array(floorSchema).min(1),
});

export type PlanPoint = z.infer<typeof planPointSchema>;
export type Wall = z.infer<typeof wallSchema>;
export type Door = z.infer<typeof doorSchema>;
export type Opening = z.infer<typeof openingSchema>;
export type Room = z.infer<typeof roomSchema>;
export type FurnitureItem = z.infer<typeof furnitureSchema>;
export type Stairs = z.infer<typeof stairsSchema>;
export type Floor = z.infer<typeof floorSchema>;
export type Apartment = z.infer<typeof apartmentSchema>;
