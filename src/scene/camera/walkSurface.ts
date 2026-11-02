import type { Apartment, Floor, PlanPoint } from '../../schema/apartment';
import { polygonArea } from '../geometry/floorGeometry';
import { containsPoint } from '../geometry/polygonClip';

/** Eye height of a walker above the floor, in metres. */
export const EYE_HEIGHT = 1.7;

export interface WalkSurface {
  /** Height of whatever you stand on at the point: a floor or a stair tread. */
  height: number;
  /** The storey you are on; changes at the top or bottom of the stairs. */
  floorId: string;
}

/**
 * Where a walker standing at `point` on (or near) the active floor has their feet: on the floor, on a tread of the
 * stairs leading up from it, or on a tread of the stairs coming up from the floor below (the stairwell).
 */
export function walkSurface(
  apartment: Apartment,
  activeFloorId: string | undefined,
  point: PlanPoint,
): WalkSurface {
  const floors = [...apartment.floors].sort((a, b) => a.elevation - b.elevation);
  const index = Math.max(
    0,
    floors.findIndex((floor) => floor.id === activeFloorId),
  );
  const floor = floors[index]!;
  const above = floors[index + 1];
  const below = floors[index - 1];

  const up = treadAt(floor, point);
  if (up) {
    const height = floor.elevation + up.height;
    return { height, floorId: up.last && above ? above.id : floor.id };
  }
  const down = below && treadAt(below, point);
  if (below && down) {
    return { height: below.elevation + down.height, floorId: down.last ? floor.id : below.id };
  }
  return { height: floor.elevation, floorId: floor.id };
}

/** The tread under a point and whether it is the top one, where the storey above begins. */
function treadAt(floor: Floor, point: PlanPoint): { height: number; last: boolean } | undefined {
  for (const stairs of floor.stairs ?? []) {
    const step = stairs.steps.findIndex((tread) => containsPoint(tread, point));
    if (step >= 0) {
      return { height: stairs.riserHeight * (step + 1), last: step === stairs.steps.length - 1 };
    }
  }
  return undefined;
}

/** Where to put a walker who enters a floor from outside: the centre of its largest indoor room. */
export function walkStart(floor: Floor): PlanPoint | undefined {
  const rooms = floor.rooms.filter((room) => !room.outdoor);
  const largest = rooms.reduce<(typeof rooms)[number] | undefined>(
    (best, room) => (!best || polygonArea(room.polygon) > polygonArea(best.polygon) ? room : best),
    undefined,
  );
  if (!largest) {
    return undefined;
  }
  const centre = centroid(largest.polygon);
  return containsPoint(largest.polygon, centre) ? centre : largest.polygon[0];
}

function centroid(polygon: readonly PlanPoint[]): PlanPoint {
  let area = 0;
  let cx = 0;
  let cy = 0;
  polygon.forEach(([x0, y0], index) => {
    const [x1, y1] = polygon[(index + 1) % polygon.length]!;
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  });
  return [cx / (3 * area), cy / (3 * area)];
}
