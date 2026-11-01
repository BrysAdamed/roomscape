import { describe, expect, it } from 'vitest';
import type { Roof } from '../../schema/apartment';
import { buildCeilingGeometry } from './ceilingGeometry';

const roof: Roof = {
  slopes: [{ origin: [0, 0], uphill: [1, 0], height: 1, pitch: 45 }],
};

describe('buildCeilingGeometry', () => {
  it('builds a ceiling that faces down and follows the slope up to the cap', () => {
    // Act
    const geometry = buildCeilingGeometry(roof, 2.5, [
      [
        [0, 0],
        [4, 0],
        [4, 2],
        [0, 2],
      ],
    ]);

    // Assert
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.min.y).toBeCloseTo(1);
    expect(geometry.boundingBox!.max.y).toBeCloseTo(2.5);
    const normal = geometry.getAttribute('normal');
    for (let index = 0; index < normal.count; index++) {
      expect(normal.getY(index)).toBeLessThan(0);
    }
  });
});
