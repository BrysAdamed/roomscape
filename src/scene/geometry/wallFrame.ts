import type { PlanPoint, Wall } from '../../schema/apartment';

export interface WallFrame {
  origin: PlanPoint;
  direction: PlanPoint;
  length: number;
  angle: number;
}

export function wallFrame(wall: Pick<Wall, 'start' | 'end'>): WallFrame {
  const dx = wall.end[0] - wall.start[0];
  const dy = wall.end[1] - wall.start[1];
  const length = Math.hypot(dx, dy);
  return {
    origin: wall.start,
    direction: [dx / length, dy / length],
    length,
    angle: Math.atan2(-dy, dx),
  };
}

export function pointAlong(frame: WallFrame, distance: number): PlanPoint {
  return [
    frame.origin[0] + frame.direction[0] * distance,
    frame.origin[1] + frame.direction[1] * distance,
  ];
}
