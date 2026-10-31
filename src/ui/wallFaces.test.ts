import { describe, expect, it } from 'vitest';
import { wallFaceDirection } from './wallFaces';

describe('wallFaceDirection', () => {
  it.each([
    [[0, 0], [4, 0], 'North', 'South'],
    [[4, 0], [4, 3], 'East', 'West'],
    [[4, 3], [0, 3], 'South', 'North'],
    [[0, 3], [0, 0], 'West', 'East'],
  ] as const)(
    'wall %j → %j faces %s on the left and %s on the right',
    (start, end, left, right) => {
      const wall = { start: [...start] as [number, number], end: [...end] as [number, number] };
      expect(wallFaceDirection(wall, 'left')).toBe(left);
      expect(wallFaceDirection(wall, 'right')).toBe(right);
    },
  );
});
