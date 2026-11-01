import type { PlanPoint, Roof, RoofSlope, RoofWindow } from '../../schema/apartment';
import { area, clipHalfPlane } from './polygonClip';

export const DEFAULT_ROOF_WINDOW_MATERIAL = 'wood-white-lacquer';
const EPSILON = 1e-6;
const DEG = Math.PI / 180;

/** Ceiling height of a slope at a plan point, unclamped. */
export function slopeHeight(slope: RoofSlope, point: PlanPoint): number {
  const along =
    (point[0] - slope.origin[0]) * slope.uphill[0] + (point[1] - slope.origin[1]) * slope.uphill[1];
  return slope.height + along * Math.tan(slope.pitch * DEG);
}

export function inDormer(roof: Roof, point: PlanPoint): boolean {
  return (roof.dormers ?? []).some(
    ([x0, y0, x1, y1]) =>
      point[0] > x0 + EPSILON &&
      point[0] < x1 - EPSILON &&
      point[1] > y0 + EPSILON &&
      point[1] < y1 - EPSILON,
  );
}

/** Ceiling height above the floor at a plan point: the lowest slope, capped at the storey height; dormers keep full height. */
export function ceilingAt(roof: Roof | undefined, height: number, point: PlanPoint): number {
  if (!roof || inDormer(roof, point)) {
    return height;
  }
  return Math.min(height, ...roof.slopes.map((slope) => slopeHeight(slope, point)));
}

/** The slope that forms the ceiling at a point, or undefined where the ceiling is flat. */
export function slopeAt(roof: Roof, height: number, point: PlanPoint): RoofSlope | undefined {
  if (inDormer(roof, point)) {
    return undefined;
  }
  let lowest: RoofSlope | undefined;
  let lowestHeight = height - EPSILON;
  for (const slope of roof.slopes) {
    const value = slopeHeight(slope, point);
    if (value < lowestHeight) {
      lowest = slope;
      lowestHeight = value;
    }
  }
  return lowest;
}

/** Plan outline of a roof window's opening: `width` along the eaves, `length` up the slope projected onto the floor. */
export function roofWindowFootprint(
  roofWindow: Pick<RoofWindow, 'position' | 'width' | 'length'>,
  slope: RoofSlope,
): PlanPoint[] {
  const [x, y] = roofWindow.position;
  const [ux, uy] = slope.uphill;
  const halfWidth = roofWindow.width / 2;
  const halfLength = (roofWindow.length * Math.cos(slope.pitch * DEG)) / 2;
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([along, up]): PlanPoint => [
    x - uy * halfWidth * along! + ux * halfLength * up!,
    y + ux * halfWidth * along! + uy * halfLength * up!,
  ]);
}

export type ProfilePoint = [x: number, height: number];

/**
 * Top edge of a wall in its own frame (x from `from` to `to` along the wall), following the ceiling. Both wall faces
 * are sampled and the higher one wins, so the wall meets the ceiling on its taller side. Vertical steps (dormer
 * edges) appear as two points with the same x.
 */
export function wallTopProfile(
  roof: Roof | undefined,
  height: number,
  start: PlanPoint,
  end: PlanPoint,
  thickness: number,
  from: number,
  to: number,
): ProfilePoint[] {
  if (!roof) {
    return [
      [from, height],
      [to, height],
    ];
  }
  const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
  const direction: PlanPoint = [(end[0] - start[0]) / length, (end[1] - start[1]) / length];
  const normal: PlanPoint = [-direction[1], direction[0]];
  const faces = [-thickness / 2, thickness / 2].map((offset): PlanPoint => [
    start[0] + normal[0] * offset,
    start[1] + normal[1] * offset,
  ]);
  const pointOn = (face: PlanPoint, x: number): PlanPoint => [
    face[0] + direction[0] * x,
    face[1] + direction[1] * x,
  ];
  const heightAt = (x: number) =>
    Math.max(...faces.map((face) => ceilingAt(roof, height, pointOn(face, x))));

  const breaks = new Set<number>([from, to]);
  for (const face of faces) {
    for (const x of breakpoints(roof, height, face, direction)) {
      if (x > from + EPSILON && x < to - EPSILON) {
        breaks.add(x);
      }
    }
  }
  const sorted = [...breaks].sort((a, b) => a - b);
  const profile: ProfilePoint[] = [];
  sorted.forEach((x, index) => {
    const left = index === 0 ? heightAt(x) : heightAt(x - EPSILON * 10);
    const right = index === sorted.length - 1 ? heightAt(x) : heightAt(x + EPSILON * 10);
    profile.push([x, left]);
    if (Math.abs(right - left) > 1e-4) {
      profile.push([x, right]);
    }
  });
  return simplify(profile);
}

/** Positions along a line where the ceiling may change slope or step: slope crossings, the cap, dormer edges. */
function breakpoints(
  roof: Roof,
  height: number,
  origin: PlanPoint,
  direction: PlanPoint,
): number[] {
  const lines = roof.slopes.map((slope) => {
    const rate =
      (direction[0] * slope.uphill[0] + direction[1] * slope.uphill[1]) *
      Math.tan(slope.pitch * DEG);
    return { base: slopeHeight(slope, origin), rate };
  });
  const result: number[] = [];
  const all = [...lines, { base: height, rate: 0 }];
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const rate = all[i]!.rate - all[j]!.rate;
      if (Math.abs(rate) > EPSILON) {
        result.push((all[j]!.base - all[i]!.base) / rate);
      }
    }
  }
  for (const [x0, y0, x1, y1] of roof.dormers ?? []) {
    if (Math.abs(direction[0]) > EPSILON) {
      result.push((x0 - origin[0]) / direction[0], (x1 - origin[0]) / direction[0]);
    }
    if (Math.abs(direction[1]) > EPSILON) {
      result.push((y0 - origin[1]) / direction[1], (y1 - origin[1]) / direction[1]);
    }
  }
  return result;
}

function simplify(profile: ProfilePoint[]): ProfilePoint[] {
  return profile.filter((point, index) => {
    const previous = profile[index - 1];
    const next = profile[index + 1];
    if (!previous || !next || previous[0] === point[0] || next[0] === point[0]) {
      return true;
    }
    const t = (point[0] - previous[0]) / (next[0] - previous[0]);
    return Math.abs(previous[1] + (next[1] - previous[1]) * t - point[1]) > 1e-5;
  });
}

/** Height of a profile at x (the lower value at a step). */
export function profileAt(profile: readonly ProfilePoint[], x: number): number {
  let result = Infinity;
  for (let index = 0; index < profile.length - 1; index++) {
    const [x0, h0] = profile[index]!;
    const [x1, h1] = profile[index + 1]!;
    if (x < x0 - EPSILON || x > x1 + EPSILON) {
      continue;
    }
    const value = x1 - x0 < EPSILON ? Math.min(h0, h1) : h0 + ((h1 - h0) * (x - x0)) / (x1 - x0);
    result = Math.min(result, value);
  }
  return Number.isFinite(result) ? result : (profile[profile.length - 1]?.[1] ?? 0);
}

/** Height of a profile at x approached from one side, which picks the matching value at a step. */
export function profileFrom(
  profile: readonly ProfilePoint[],
  x: number,
  side: 'below' | 'above',
): number {
  const segments = profile
    .slice(0, -1)
    .map((start, index) => [start, profile[index + 1]!] as const)
    .filter(([[x0], [x1]]) => x1 - x0 > EPSILON);
  const segment =
    side === 'below'
      ? (segments.find(([[x0], [x1]]) => x > x0 + EPSILON && x <= x1 + EPSILON) ?? segments[0])
      : (segments.find(([[x0], [x1]]) => x >= x0 - EPSILON && x < x1 - EPSILON) ?? segments.at(-1));
  if (!segment) {
    return profileAt(profile, x);
  }
  const [[x0, h0], [x1, h1]] = segment;
  return h0 + ((h1 - h0) * (x - x0)) / (x1 - x0);
}

export interface CeilingPiece {
  polygon: PlanPoint[];
  slope: RoofSlope | undefined;
}

/** Splits a room polygon into pieces that each lie under one slope or under the flat ceiling. */
export function ceilingPieces(
  roof: Roof,
  height: number,
  polygon: readonly PlanPoint[],
): CeilingPiece[] {
  const regions: PlanPoint[][] = [];
  let outside: PlanPoint[][] = [[...polygon]];
  for (const [x0, y0, x1, y1] of roof.dormers ?? []) {
    const next: PlanPoint[][] = [];
    for (const part of outside) {
      regions.push(...nonEmpty([clipRect(part, x0, y0, x1, y1)]));
      next.push(...nonEmpty(outsideRect(part, x0, y0, x1, y1)));
    }
    outside = next;
  }
  const pieces: CeilingPiece[] = regions.map((region) => ({ polygon: region, slope: undefined }));
  for (const part of outside) {
    roof.slopes.forEach((slope, index) => {
      let piece = clipHalfPlane(part, (point) => height - slopeHeight(slope, point));
      roof.slopes.forEach((other, otherIndex) => {
        if (otherIndex !== index) {
          piece = clipHalfPlane(
            piece,
            (point) =>
              slopeHeight(other, point) -
              slopeHeight(slope, point) -
              (otherIndex < index ? EPSILON : 0),
          );
        }
      });
      if (area(piece) > 1e-6) {
        pieces.push({ polygon: piece, slope });
      }
    });
    let flat: PlanPoint[] = part;
    for (const slope of roof.slopes) {
      flat = clipHalfPlane(flat, (point) => slopeHeight(slope, point) - height);
    }
    if (area(flat) > 1e-6) {
      pieces.push({ polygon: flat, slope: undefined });
    }
  }
  return pieces;
}

function nonEmpty(polygons: PlanPoint[][]): PlanPoint[][] {
  return polygons.filter((polygon) => area(polygon) > 1e-6);
}

function clipRect(polygon: PlanPoint[], x0: number, y0: number, x1: number, y1: number) {
  let result = clipHalfPlane(polygon, ([x]) => x - x0);
  result = clipHalfPlane(result, ([x]) => x1 - x);
  result = clipHalfPlane(result, ([, y]) => y - y0);
  return clipHalfPlane(result, ([, y]) => y1 - y);
}

function outsideRect(polygon: PlanPoint[], x0: number, y0: number, x1: number, y1: number) {
  const left = clipHalfPlane(polygon, ([x]) => x0 - x);
  const rest = clipHalfPlane(polygon, ([x]) => x - x0);
  const right = clipHalfPlane(rest, ([x]) => x - x1);
  const middle = clipHalfPlane(rest, ([x]) => x1 - x);
  const top = clipHalfPlane(middle, ([, y]) => y0 - y);
  const bottom = clipHalfPlane(middle, ([, y]) => y - y1);
  return [left, right, top, bottom];
}
