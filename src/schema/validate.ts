import type { z } from 'zod';
import { materials } from '../catalogue/materials';
import { apartmentSchema, type Apartment, type Floor, type PlanPoint } from './apartment';

export type ValidationResult =
  { success: true; apartment: Apartment } | { success: false; errors: string[] };

export interface ValidationContext {
  materialIds: ReadonlySet<string>;
}

const defaultContext: ValidationContext = {
  materialIds: new Set(materials.map((material) => material.id)),
};

export function validateApartment(
  input: unknown,
  context: ValidationContext = defaultContext,
): ValidationResult {
  const parsed = apartmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map(formatIssue) };
  }

  const errors = checkReferences(parsed.data, context);
  return errors.length > 0 ? { success: false, errors } : { success: true, apartment: parsed.data };
}

export function wallLength(start: PlanPoint, end: PlanPoint): number {
  return Math.hypot(end[0] - start[0], end[1] - start[1]);
}

function formatIssue(issue: z.core.$ZodIssue): string {
  const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
  return `${path}: ${issue.message}`;
}

function checkReferences(apartment: Apartment, context: ValidationContext): string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  const claimId = (elementId: string, path: string) => {
    if (seenIds.has(elementId)) {
      errors.push(`${path}: duplicate id '${elementId}'`);
    }
    seenIds.add(elementId);
  };

  const checkMaterial = (materialId: string, path: string) => {
    if (!context.materialIds.has(materialId)) {
      errors.push(`${path}: unknown material '${materialId}'`);
    }
  };

  claimId(apartment.id, 'id');
  apartment.floors.forEach((floor, floorIndex) => {
    const floorPath = `floors.${floorIndex}`;
    claimId(floor.id, `${floorPath}.id`);
    checkFloor(floor, floorPath, claimId, checkMaterial, errors);
  });

  return errors;
}

function checkFloor(
  floor: Floor,
  floorPath: string,
  claimId: (elementId: string, path: string) => void,
  checkMaterial: (materialId: string, path: string) => void,
  errors: string[],
) {
  const wallsById = new Map(floor.walls.map((wall) => [wall.id, wall]));

  floor.walls.forEach((wall, index) => {
    const path = `${floorPath}.walls.${index}`;
    claimId(wall.id, `${path}.id`);
    if (wallLength(wall.start, wall.end) === 0) {
      errors.push(`${path}: wall '${wall.id}' has zero length`);
    }
    if (wall.height !== undefined && wall.height > floor.height) {
      errors.push(`${path}: wall '${wall.id}' is taller than its floor`);
    }
    checkMaterial(wall.materials.left, `${path}.materials.left`);
    checkMaterial(wall.materials.right, `${path}.materials.right`);
  });

  floor.openings.forEach((opening, index) => {
    const path = `${floorPath}.openings.${index}`;
    claimId(opening.id, `${path}.id`);
    const wall = wallsById.get(opening.wallId);
    if (!wall) {
      errors.push(`${path}: opening '${opening.id}' references unknown wall '${opening.wallId}'`);
      return;
    }
    if (opening.offset + opening.width > wallLength(wall.start, wall.end) + 1e-6) {
      errors.push(`${path}: opening '${opening.id}' extends past the end of wall '${wall.id}'`);
    }
    if (opening.sillHeight + opening.height > (wall.height ?? floor.height) + 1e-6) {
      errors.push(`${path}: opening '${opening.id}' is taller than wall '${wall.id}'`);
    }
    if (opening.kind === 'window' && opening.door) {
      errors.push(`${path}: window '${opening.id}' cannot have door settings`);
    }
    if (opening.door?.material) {
      checkMaterial(opening.door.material, `${path}.door.material`);
    }
  });

  floor.rooms.forEach((room, index) => {
    const path = `${floorPath}.rooms.${index}`;
    claimId(room.id, `${path}.id`);
    checkMaterial(room.floorMaterial, `${path}.floorMaterial`);
  });

  floor.furniture.forEach((item, index) => {
    const path = `${floorPath}.furniture.${index}`;
    claimId(item.id, `${path}.id`);
    for (const [slot, materialId] of Object.entries(item.materials)) {
      checkMaterial(materialId, `${path}.materials.${slot}`);
    }
  });
}
