import type { z } from 'zod';
import { furnitureTypes } from '../catalogue/furniture/registry';
import type { FurnitureType } from '../catalogue/furniture/types';
import { materials } from '../catalogue/materials';
import {
  apartmentSchema,
  CUSTOM_COLOR_PATTERN,
  type Apartment,
  type Floor,
  type PlanPoint,
} from './apartment';

export type ValidationResult =
  { success: true; apartment: Apartment } | { success: false; errors: string[] };

export interface ValidationContext {
  materialIds: ReadonlySet<string>;
  furnitureTypes: ReadonlyMap<string, Pick<FurnitureType, 'params' | 'slots'>>;
}

const defaultContext: ValidationContext = {
  materialIds: new Set(materials.map((material) => material.id)),
  furnitureTypes: new Map(furnitureTypes.map((type) => [type.id, type])),
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

function isTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
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
    if (!CUSTOM_COLOR_PATTERN.test(materialId) && !context.materialIds.has(materialId)) {
      errors.push(`${path}: unknown material '${materialId}'`);
    }
  };

  claimId(apartment.id, 'id');
  const timeZone = apartment.location?.timeZone;
  if (timeZone && !isTimeZone(timeZone)) {
    errors.push(`location.timeZone: unknown time zone '${timeZone}'`);
  }
  apartment.floors.forEach((floor, floorIndex) => {
    const floorPath = `floors.${floorIndex}`;
    claimId(floor.id, `${floorPath}.id`);
    checkFloor(floor, floorPath, { claimId, checkMaterial, errors, context });
  });

  return errors;
}

interface FloorChecks {
  claimId: (elementId: string, path: string) => void;
  checkMaterial: (materialId: string, path: string) => void;
  errors: string[];
  context: ValidationContext;
}

function checkFloor(floor: Floor, floorPath: string, checks: FloorChecks) {
  const { claimId, checkMaterial, errors, context } = checks;
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
    if (opening.frameMaterial) {
      checkMaterial(opening.frameMaterial, `${path}.frameMaterial`);
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
    const type = context.furnitureTypes.get(item.type);
    if (!type) {
      errors.push(`${path}: unknown furniture type '${item.type}'`);
    }
    for (const [name, value] of Object.entries(item.params)) {
      if (type && !(name in type.params)) {
        errors.push(`${path}.params.${name}: '${item.type}' has no parameter '${name}'`);
      } else if (type && typeof value !== 'number') {
        errors.push(`${path}.params.${name}: must be a number`);
      }
    }
    for (const [slot, materialId] of Object.entries(item.materials)) {
      if (type && !(slot in type.slots)) {
        errors.push(`${path}.materials.${slot}: '${item.type}' has no material slot '${slot}'`);
      }
      checkMaterial(materialId, `${path}.materials.${slot}`);
    }
  });

  floor.stairs?.forEach((stairs, index) => {
    const path = `${floorPath}.stairs.${index}`;
    claimId(stairs.id, `${path}.id`);
    checkMaterial(stairs.material, `${path}.material`);
    if (stairs.steps.length * stairs.riserHeight > floor.height + 1) {
      errors.push(`${path}: stairs rise higher than the storey above`);
    }
  });

  floor.railings?.forEach((railing, index) => {
    const path = `${floorPath}.railings.${index}`;
    claimId(railing.id, `${path}.id`);
    if (railing.material) {
      checkMaterial(railing.material, `${path}.material`);
    }
  });
}
