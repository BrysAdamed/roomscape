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
  frameMaterial: materialRef.optional(),
  door: doorSchema.optional(),
});

export const roomSchema = z.object({
  id,
  name: z.string().min(1),
  polygon: z.array(planPointSchema).min(3),
  floorMaterial: materialRef,
  outdoor: z.boolean().optional(),
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

const unitVector = z
  .tuple([z.number(), z.number()])
  .refine(([x, y]) => Math.abs(Math.hypot(x, y) - 1) < 1e-3, 'must be a unit vector');

export const roofSlopeSchema = z.object({
  origin: planPointSchema,
  uphill: unitVector,
  height: z.number(),
  pitch: z.number().gt(0).lt(90),
});

export const roofWindowSchema = z.object({
  id,
  position: planPointSchema,
  width: positive,
  length: positive,
  material: materialRef.optional(),
});

export const roofSchema = z.object({
  slopes: z.array(roofSlopeSchema).min(1),
  dormers: z.array(z.tuple([z.number(), z.number(), z.number(), z.number()])).optional(),
  windows: z.array(roofWindowSchema).optional(),
});

export const railingSchema = z.object({
  id,
  points: z.array(planPointSchema).min(2),
  height: positive.optional(),
  style: z.enum(['glass', 'bars']).optional(),
  material: materialRef.optional(),
});

export const planImageSchema = z.object({
  src: z.string().min(1),
  bounds: z.tuple([z.number(), z.number(), z.number(), z.number()]),
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
  railings: z.array(railingSchema).optional(),
  roof: roofSchema.optional(),
  planImage: planImageSchema.optional(),
});

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timeZone: z.string().min(1).optional(),
});

export const apartmentSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id,
  name: z.string().min(1),
  north: z.number().min(0).lt(360).optional(),
  location: locationSchema.optional(),
  floors: z.array(floorSchema).min(1),
});

export type PlanPoint = z.infer<typeof planPointSchema>;
export type Wall = z.infer<typeof wallSchema>;
export type Door = z.infer<typeof doorSchema>;
export type Opening = z.infer<typeof openingSchema>;
export type Room = z.infer<typeof roomSchema>;
export type FurnitureItem = z.infer<typeof furnitureSchema>;
export type Stairs = z.infer<typeof stairsSchema>;
export type Railing = z.infer<typeof railingSchema>;
export type Roof = z.infer<typeof roofSchema>;
export type RoofSlope = z.infer<typeof roofSlopeSchema>;
export type RoofWindow = z.infer<typeof roofWindowSchema>;
export type PlanImage = z.infer<typeof planImageSchema>;
export type Location = z.infer<typeof locationSchema>;
export type Floor = z.infer<typeof floorSchema>;
export type Apartment = z.infer<typeof apartmentSchema>;
