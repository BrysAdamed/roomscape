import type { PlanPoint, Wall } from '../../schema/apartment';
import { wallFrame } from './wallFrame';

const EPSILON = 1e-4;

export interface WallSpan {
  wall: Wall;
  startExtension: number;
  endExtension: number;
}

/**
 * Resolves how far each wall reaches past (positive) or stops short of (negative) its end points,
 * so walls meeting at corners and T-junctions close without gaps or overlapping faces.
 * At a corner the wall listed first is extended by half the other wall's thickness and the
 * later one is trimmed by half the first wall's thickness.
 */
export function layoutWalls(walls: readonly Wall[]): WallSpan[] {
  return walls.map((wall, index) => ({
    wall,
    startExtension: endAdjustment(walls, index, wall.start),
    endExtension: endAdjustment(walls, index, wall.end),
  }));
}

function endAdjustment(walls: readonly Wall[], index: number, point: PlanPoint): number {
  const wall = walls[index]!;
  let earlier = 0;
  let later = 0;
  let junction = 0;

  walls.forEach((other, otherIndex) => {
    if (otherIndex === index || areParallel(wall, other)) {
      return;
    }
    if (samePoint(point, other.start) || samePoint(point, other.end)) {
      if (otherIndex < index) {
        earlier = Math.max(earlier, other.thickness);
      } else {
        later = Math.max(later, other.thickness);
      }
    } else if (liesOnWall(point, other)) {
      junction = Math.max(junction, other.thickness);
    }
  });

  if (earlier > 0) {
    return -earlier / 2;
  }
  if (junction > 0) {
    return -junction / 2;
  }
  return later / 2;
}

function samePoint(a: PlanPoint, b: PlanPoint): boolean {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON;
}

function areParallel(a: Wall, b: Wall): boolean {
  const fa = wallFrame(a);
  const fb = wallFrame(b);
  const cross = fa.direction[0] * fb.direction[1] - fa.direction[1] * fb.direction[0];
  return Math.abs(cross) < EPSILON;
}

function liesOnWall(point: PlanPoint, wall: Wall): boolean {
  const frame = wallFrame(wall);
  const px = point[0] - frame.origin[0];
  const py = point[1] - frame.origin[1];
  const along = px * frame.direction[0] + py * frame.direction[1];
  const across = px * frame.direction[1] - py * frame.direction[0];
  return Math.abs(across) < EPSILON && along > EPSILON && along < frame.length - EPSILON;
}
