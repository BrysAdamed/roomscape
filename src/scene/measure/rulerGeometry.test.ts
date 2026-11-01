import { describe, expect, it } from 'vitest';
import { measuredSegment } from './rulerGeometry';

describe('measuredSegment', () => {
  it('measures the straight line between two points', () => {
    // Act
    const segment = measuredSegment([0, 0, 0], [3, 4, 0], false, 0);

    // Assert
    expect(segment.distance).toBeCloseTo(5);
    expect(segment.end).toEqual([3, 4, 0]);
  });

  it('drops both points to the floor and measures horizontally in floor-only mode', () => {
    // Act
    const segment = measuredSegment([0, 0.75, 0], [3, 2, 4], true, 2.9);

    // Assert
    expect(segment.distance).toBeCloseTo(5);
    expect(segment.start[1]).toBeCloseTo(2.91);
    expect(segment.end).toEqual([3, segment.start[1], 4]);
  });
});
