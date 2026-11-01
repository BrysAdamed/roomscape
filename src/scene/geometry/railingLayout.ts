import type { PlanPoint, Railing } from '../../schema/apartment';

export const DEFAULT_RAILING_HEIGHT = 1.1;
export const DEFAULT_RAILING_MATERIAL = 'metal-black';
const MAX_POST_SPACING = 1.2;

export interface RailingSegment {
  start: PlanPoint;
  end: PlanPoint;
  length: number;
  /** Rotation about Y that turns +X onto the segment direction. */
  angle: number;
}

export interface RailingLayout {
  posts: PlanPoint[];
  segments: RailingSegment[];
}

/** Splits a railing polyline into segments and posts no further apart than 1.2 m. */
export function railingLayout(railing: Pick<Railing, 'points'>): RailingLayout {
  const posts: PlanPoint[] = [railing.points[0]!];
  const segments: RailingSegment[] = [];
  for (let index = 1; index < railing.points.length; index++) {
    const start = railing.points[index - 1]!;
    const end = railing.points[index]!;
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const length = Math.hypot(dx, dy);
    if (length < 1e-6) {
      continue;
    }
    segments.push({ start, end, length, angle: Math.atan2(-dy, dx) });
    const divisions = Math.ceil(length / MAX_POST_SPACING);
    for (let step = 1; step <= divisions; step++) {
      const t = step / divisions;
      posts.push([start[0] + dx * t, start[1] + dy * t]);
    }
  }
  return { posts, segments };
}

export function railingLength(railing: Pick<Railing, 'points'>): number {
  return railingLayout(railing).segments.reduce((total, segment) => total + segment.length, 0);
}
