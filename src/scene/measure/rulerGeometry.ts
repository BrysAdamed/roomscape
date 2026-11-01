import type { Point3 } from '../../state/viewerStore';

const FLOOR_LIFT = 0.01;

export interface MeasuredSegment {
  start: Point3;
  end: Point3;
  distance: number;
}

/**
 * The segment a ruler measurement draws and its length: the straight 3D line, or in floor-only mode
 * both points dropped onto the floor at `floorElevation` and measured horizontally.
 */
export function measuredSegment(
  start: Point3,
  end: Point3,
  floorOnly: boolean,
  floorElevation: number,
): MeasuredSegment {
  if (!floorOnly) {
    return {
      start,
      end,
      distance: Math.hypot(end[0] - start[0], end[1] - start[1], end[2] - start[2]),
    };
  }
  const y = floorElevation + FLOOR_LIFT;
  return {
    start: [start[0], y, start[2]],
    end: [end[0], y, end[2]],
    distance: Math.hypot(end[0] - start[0], end[2] - start[2]),
  };
}
