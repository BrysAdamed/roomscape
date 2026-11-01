import { describe, expect, it } from 'vitest';
import { railingLayout, railingLength } from './railingLayout';

describe('railingLayout', () => {
  it('places posts at corners and at most 1.2 m apart', () => {
    // Arrange
    const railing = {
      points: [
        [0, 0],
        [0, -1],
        [2.8, -1],
      ] as [number, number][],
    };

    // Act
    const { posts, segments } = railingLayout(railing);

    // Assert
    expect(segments.map((segment) => segment.length)).toEqual([1, 2.8]);
    expect(posts.map(([x, y]) => [+x.toFixed(3), +y.toFixed(3)])).toEqual([
      [0, 0],
      [0, -1],
      [0.933, -1],
      [1.867, -1],
      [2.8, -1],
    ]);
    expect(railingLength(railing)).toBeCloseTo(3.8);
  });
});
