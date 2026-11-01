import { describe, expect, it } from 'vitest';
import type { Roof } from '../../schema/apartment';
import { buildCeilingGeometry } from './ceilingGeometry';

const roof: Roof = {
  slopes: [{ origin: [0, 0], uphill: [1, 0], height: 1, pitch: 45 }],
};

function ceilingArea(geometry: ReturnType<typeof buildCeilingGeometry>): number {
  const position = geometry.getAttribute('position');
  let total = 0;
  for (let index = 0; index < position.count; index += 3) {
    const [ax, az] = [position.getX(index), position.getZ(index)];
    const [bx, bz] = [position.getX(index + 1), position.getZ(index + 1)];
    const [cx, cz] = [position.getX(index + 2), position.getZ(index + 2)];
    total += Math.abs((bx - ax) * (cz - az) - (bz - az) * (cx - ax)) / 2;
  }
  return total;
}

describe('buildCeilingGeometry', () => {
  it('leaves openings out of a flat ceiling', () => {
    // Act
    const geometry = buildCeilingGeometry(
      undefined,
      2.6,
      [
        [
          [0, 0],
          [4, 0],
          [4, 3],
          [0, 3],
        ],
      ],
      [
        [
          [1, 1],
          [2, 1],
          [2, 2],
          [1, 2],
        ],
      ],
    );

    // Assert
    expect(ceilingArea(geometry)).toBeCloseTo(11);
  });

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
