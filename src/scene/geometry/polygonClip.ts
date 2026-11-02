import type { PlanPoint } from '../../schema/apartment';

/** Keeps the part of the polygon where `side(point) >= 0`; `side` must be linear (Sutherland–Hodgman). */
export function clipHalfPlane(
  polygon: readonly PlanPoint[],
  side: (point: PlanPoint) => number,
): PlanPoint[] {
  const result: PlanPoint[] = [];
  polygon.forEach((current, index) => {
    const next = polygon[(index + 1) % polygon.length]!;
    const a = side(current);
    const b = side(next);
    if (a >= 0) {
      result.push(current);
    }
    if (a >= 0 !== b >= 0) {
      const t = a / (a - b);
      result.push([
        current[0] + (next[0] - current[0]) * t,
        current[1] + (next[1] - current[1]) * t,
      ]);
    }
  });
  return result;
}

/** The parts of a polygon outside a convex polygon, as pieces split along the convex polygon's edges. */
export function subtractConvex(
  polygon: readonly PlanPoint[],
  convex: readonly PlanPoint[],
): PlanPoint[][] {
  const orientation = signedArea(convex) > 0 ? 1 : -1;
  const pieces: PlanPoint[][] = [];
  let remaining: PlanPoint[] = [...polygon];
  convex.forEach((start, index) => {
    const end = convex[(index + 1) % convex.length]!;
    const inside = (point: PlanPoint) =>
      orientation *
      ((end[0] - start[0]) * (point[1] - start[1]) - (end[1] - start[1]) * (point[0] - start[0]));
    const outside = clipHalfPlane(remaining, (point) => -inside(point));
    if (area(outside) > 1e-9) {
      pieces.push(outside);
    }
    remaining = clipHalfPlane(remaining, inside);
  });
  return pieces;
}

/** Even-odd test; points exactly on an edge may land on either side. */
export function containsPoint(polygon: readonly PlanPoint[], [x, y]: PlanPoint): boolean {
  let inside = false;
  polygon.forEach(([x0, y0], index) => {
    const [x1, y1] = polygon[(index + 1) % polygon.length]!;
    if (y0 > y !== y1 > y && x < x0 + ((y - y0) * (x1 - x0)) / (y1 - y0)) {
      inside = !inside;
    }
  });
  return inside;
}

export function area(polygon: readonly PlanPoint[]): number {
  return Math.abs(signedArea(polygon));
}

function signedArea(polygon: readonly PlanPoint[]): number {
  let sum = 0;
  polygon.forEach((point, index) => {
    const next = polygon[(index + 1) % polygon.length]!;
    sum += point[0] * next[1] - next[0] * point[1];
  });
  return sum / 2;
}
