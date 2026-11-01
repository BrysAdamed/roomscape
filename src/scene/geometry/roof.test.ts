import { describe, expect, it } from 'vitest';
import type { Roof } from '../../schema/apartment';
import { area } from './polygonClip';
import { ceilingAt, ceilingPieces, profileAt, wallTopProfile } from './roof';

const pitch = (Math.atan(0.5) * 180) / Math.PI;

/** Gable roof over a 10 m wide floor: 1 m high at both eaves (x = 0 and x = 10), capped at 2.5 m. */
const roof: Roof = {
  slopes: [
    { origin: [0, 0], uphill: [1, 0], height: 1, pitch },
    { origin: [10, 0], uphill: [-1, 0], height: 1, pitch },
  ],
  dormers: [[-1, 4, 2, 6]],
};

describe('ceilingAt', () => {
  it('follows the lowest slope, caps at the storey height and stays full height in dormers', () => {
    // Act
    const heights = [
      ceilingAt(roof, 2.5, [1, 0]),
      ceilingAt(roof, 2.5, [9, 0]),
      ceilingAt(roof, 2.5, [5, 0]),
      ceilingAt(roof, 2.5, [1, 5]),
      ceilingAt(undefined, 2.5, [1, 0]),
    ];

    // Assert
    expect(heights.map((value) => +value.toFixed(6))).toEqual([1.5, 1.5, 2.5, 2.5, 2.5]);
  });
});

describe('wallTopProfile', () => {
  it('rises along a wall across the slopes and flattens under the cap', () => {
    // Act
    const profile = wallTopProfile(roof, 2.5, [0, 0], [10, 0], 0, 0, 10);

    // Assert
    expect(profile.map(([x, h]) => [+x.toFixed(3), +h.toFixed(3)])).toEqual([
      [0, 1],
      [3, 2.5],
      [7, 2.5],
      [10, 1],
    ]);
    expect(profileAt(profile, 1.5)).toBeCloseTo(1.75);
  });

  it('steps up at a dormer', () => {
    // Act
    const profile = wallTopProfile(roof, 2.5, [1, 0], [1, 10], 0, 0, 10);

    // Assert
    expect(profile.map(([x, h]) => [+x.toFixed(3), +h.toFixed(3)])).toEqual([
      [0, 1.5],
      [4, 1.5],
      [4, 2.5],
      [6, 2.5],
      [6, 1.5],
      [10, 1.5],
    ]);
  });

  it('is flat without a roof', () => {
    // Act
    const profile = wallTopProfile(undefined, 2.6, [0, 0], [3, 0], 0.2, -0.1, 3.1);

    // Assert
    expect(profile).toEqual([
      [-0.1, 2.6],
      [3.1, 2.6],
    ]);
  });
});

describe('ceilingPieces', () => {
  it('splits a room into slope, flat and dormer pieces covering the whole room', () => {
    // Arrange
    const room: [number, number][] = [
      [0, 0],
      [10, 0],
      [10, 8],
      [0, 8],
    ];

    // Act
    const pieces = ceilingPieces(roof, 2.5, room);

    // Assert
    const total = pieces.reduce((sum, piece) => sum + area(piece.polygon), 0);
    expect(total).toBeCloseTo(80);
    expect(pieces.filter((piece) => piece.slope === roof.slopes[0]).length).toBeGreaterThan(0);
    expect(pieces.filter((piece) => piece.slope === undefined).length).toBeGreaterThan(1);
  });
});
