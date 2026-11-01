import { describe, expect, it } from 'vitest';
import { area, subtractConvex } from './polygonClip';

describe('subtractConvex', () => {
  it('cuts a convex hole out of a polygon and keeps the rest', () => {
    // Arrange
    const room: [number, number][] = [
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
    ];
    const hole: [number, number][] = [
      [1, 1],
      [1, 2],
      [3, 2],
      [3, 1],
    ];

    // Act
    const pieces = subtractConvex(room, hole);

    // Assert
    expect(pieces.reduce((sum, piece) => sum + area(piece), 0)).toBeCloseTo(16 - 2);
  });

  it('returns the whole polygon when the hole is elsewhere', () => {
    // Act
    const pieces = subtractConvex(
      [
        [0, 0],
        [1, 0],
        [1, 1],
      ],
      [
        [5, 5],
        [6, 5],
        [6, 6],
      ],
    );

    // Assert
    expect(pieces.reduce((sum, piece) => sum + area(piece), 0)).toBeCloseTo(0.5);
  });
});
