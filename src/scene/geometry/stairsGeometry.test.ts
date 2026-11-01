import { describe, expect, it } from 'vitest';
import { buildStairsGeometry } from './stairsGeometry';

describe('buildStairsGeometry', () => {
  it('places one tread slab per step up to the full rise', () => {
    // Arrange
    const stairs = {
      id: 's',
      riserHeight: 0.2,
      material: 'wood-oak-natural',
      steps: [0, 1, 2].map(
        (i) =>
          [
            [i * 0.25, 0],
            [(i + 1) * 0.25, 0],
            [(i + 1) * 0.25, 1],
            [i * 0.25, 1],
          ] as [number, number][],
      ),
    };

    // Act
    const geometry = buildStairsGeometry(stairs);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;

    // Assert
    expect(box.max.y).toBeCloseTo(0.6);
    expect(box.min.y).toBeCloseTo(0.15);
    expect(box.max.x).toBeCloseTo(0.75);
    expect(box.max.z).toBeCloseTo(1);
    expect(box.min.z).toBeCloseTo(0);
  });

  it('closes the stairs down to a sloped soffit', () => {
    // Arrange
    const stairs = {
      id: 's',
      riserHeight: 0.2,
      material: 'wood-oak-natural',
      closed: true,
      steps: [0, 1, 2].map(
        (i) =>
          [
            [i * 0.25, 0],
            [(i + 1) * 0.25, 0],
            [(i + 1) * 0.25, 1],
            [i * 0.25, 1],
          ] as [number, number][],
      ),
    };

    // Act
    const geometry = buildStairsGeometry(stairs);
    geometry.computeBoundingBox();

    // Assert
    expect(geometry.boundingBox!.min.y).toBeCloseTo(0);
    const position = geometry.getAttribute('position');
    const soffitHeightsAtBack: number[] = [];
    for (let index = 0; index < position.count; index++) {
      if (Math.abs(position.getX(index) - 0.75) < 1e-6) {
        soffitHeightsAtBack.push(position.getY(index));
      }
    }
    expect(Math.min(...soffitHeightsAtBack)).toBeCloseTo(0.4);
  });
});
