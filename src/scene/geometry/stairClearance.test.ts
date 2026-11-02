import { describe, expect, it } from 'vitest';
import type { Stairs } from '../../schema/apartment';
import { capUnderStairs } from './stairClearance';
import { TREAD_THICKNESS } from './stairsGeometry';

/** Two 1 m treads along +x from x = 1, between y = 0 and y = 1, with 1 m risers. */
const stairs: Stairs = {
  id: 's',
  riserHeight: 1,
  material: 'wood-oak-natural',
  steps: [1, 2].map((x) => [
    [x, 0],
    [x + 1, 0],
    [x + 1, 1],
    [x, 1],
  ]),
};

describe('capUnderStairs', () => {
  it('steps a wall down to the underside of each tread it runs under, a little past each riser', () => {
    // Act
    const top = capUnderStairs(
      [
        [0, 2.6],
        [4, 2.6],
      ],
      [stairs],
      [0, 0.5],
      [4, 0.5],
      0.1,
    );

    // Assert
    const under = (step: number) => step - TREAD_THICKNESS;
    expect(top.map(([x, height]) => [+x.toFixed(6), +height.toFixed(6)])).toEqual([
      [0, 2.6],
      [0.98, 2.6],
      [0.98, under(1)],
      [2.02, under(1)],
      [2.02, under(2)],
      [3.02, under(2)],
      [3.02, 2.6],
      [4, 2.6],
    ]);
  });

  it('keeps a wall along a riser below the lower of the two treads it spans', () => {
    // Act
    const top = capUnderStairs(
      [
        [0, 2.6],
        [1, 2.6],
      ],
      [stairs],
      [2.03, 0],
      [2.03, 1],
      0.1,
    );

    // Assert
    expect(top.map(([x, height]) => [+x.toFixed(6), +height.toFixed(6)])).toEqual([
      [0, 1 - TREAD_THICKNESS],
      [1, 1 - TREAD_THICKNESS],
    ]);
  });

  it('keeps a wall that only touches the edge of the stairs at full height', () => {
    // Act
    const top = capUnderStairs(
      [
        [0, 2.6],
        [4, 2.6],
      ],
      [stairs],
      [0, 1.05],
      [4, 1.05],
      0.1,
    );

    // Assert
    expect(top.every(([, height]) => height === 2.6)).toBe(true);
  });
});
