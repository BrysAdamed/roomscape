import type { Wall } from '../schema/apartment';
import type { WallSide } from '../state/apartmentEdits';

export type Compass = 'North' | 'East' | 'South' | 'West';

export function wallFaceDirection(wall: Pick<Wall, 'start' | 'end'>, side: WallSide): Compass {
  const dx = wall.end[0] - wall.start[0];
  const dy = wall.end[1] - wall.start[1];
  const [nx, ny] = side === 'left' ? [dy, -dx] : [-dy, dx];
  if (Math.abs(nx) >= Math.abs(ny)) {
    return nx > 0 ? 'East' : 'West';
  }
  return ny > 0 ? 'South' : 'North';
}
