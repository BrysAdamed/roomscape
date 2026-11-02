import type { PlanPoint, Stairs } from '../../schema/apartment';
import { containsPoint } from './polygonClip';
import { profileAt, simplify, type ProfilePoint } from './roof';
import { TREAD_THICKNESS } from './stairsGeometry';

const EPSILON = 1e-6;
const NUDGE = 1e-4;
const RISER_MARGIN = 0.02;
const SIDE_INSET = 0.002;

/**
 * Lowers a wall's top profile (x along the wall from `start`) where the wall runs under stair treads, so it stops at
 * the underside of the lowest tread over either face, a little past each riser, instead of poking through the stairs. A
 * wall only partly under the stairs keeps its height elsewhere, and one that only touches the side of the stairs keeps
 * it everywhere.
 */
export function capUnderStairs(
  profile: readonly ProfilePoint[],
  stairs: readonly Stairs[],
  start: PlanPoint,
  end: PlanPoint,
  thickness: number,
): ProfilePoint[] {
  if (stairs.length === 0 || profile.length === 0) {
    return [...profile];
  }
  const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
  const direction: PlanPoint = [(end[0] - start[0]) / length, (end[1] - start[1]) / length];
  const normal: PlanPoint = [-direction[1], direction[0]];
  const faces = [SIDE_INSET - thickness / 2, thickness / 2 - SIDE_INSET].map(
    (offset): PlanPoint => [start[0] + normal[0] * offset, start[1] + normal[1] * offset],
  );
  const pointOn = (face: PlanPoint, x: number): PlanPoint => [
    face[0] + direction[0] * x,
    face[1] + direction[1] * x,
  ];
  const heightAt = (x: number) =>
    Math.min(
      profileAt(profile, x),
      ...faces.flatMap((face) =>
        [x - RISER_MARGIN, x, x + RISER_MARGIN].map((at) => undersideAt(stairs, pointOn(face, at))),
      ),
    );

  const from = profile[0]![0];
  const to = profile[profile.length - 1]![0];
  const breaks = new Set(profile.map(([x]) => x));
  for (const face of faces) {
    for (const crossing of treadEdgeCrossings(stairs, face, direction)) {
      for (const x of [crossing - RISER_MARGIN, crossing, crossing + RISER_MARGIN]) {
        if (x > from + EPSILON && x < to - EPSILON) {
          breaks.add(x);
        }
      }
    }
  }
  const capped: ProfilePoint[] = [];
  [...breaks]
    .sort((a, b) => a - b)
    .forEach((x, index, sorted) => {
      const left = heightAt(index === 0 ? x + NUDGE : x - NUDGE);
      const right = heightAt(index === sorted.length - 1 ? x - NUDGE : x + NUDGE);
      capped.push([x, left]);
      if (Math.abs(right - left) > 1e-4) {
        capped.push([x, right]);
      }
    });
  return simplify(capped);
}

/** Height of the underside of the tread above a plan point, or infinity where no tread is. */
function undersideAt(stairs: readonly Stairs[], point: PlanPoint): number {
  let lowest = Infinity;
  for (const flight of stairs) {
    flight.steps.forEach((tread, index) => {
      if (containsPoint(tread, point)) {
        lowest = Math.min(lowest, flight.riserHeight * (index + 1) - TREAD_THICKNESS);
      }
    });
  }
  return lowest;
}

/** Distances along the line `origin + x × direction` at which it crosses a tread edge. */
function treadEdgeCrossings(
  stairs: readonly Stairs[],
  origin: PlanPoint,
  direction: PlanPoint,
): number[] {
  const result: number[] = [];
  for (const tread of stairs.flatMap((flight) => flight.steps)) {
    tread.forEach((a, index) => {
      const b = tread[(index + 1) % tread.length]!;
      const edge: PlanPoint = [b[0] - a[0], b[1] - a[1]];
      const denominator = direction[0] * edge[1] - direction[1] * edge[0];
      if (Math.abs(denominator) < EPSILON) {
        return;
      }
      const offset: PlanPoint = [a[0] - origin[0], a[1] - origin[1]];
      const t = (offset[0] * edge[1] - offset[1] * edge[0]) / denominator;
      const s = (offset[0] * direction[1] - offset[1] * direction[0]) / denominator;
      if (s >= -EPSILON && s <= 1 + EPSILON) {
        result.push(t);
      }
    });
  }
  return result;
}
