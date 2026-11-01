import { describe, expect, it } from 'vitest';
import { validateApartment } from '../schema/validate';
import { findFurnitureType, furnitureTypes } from './furniture/registry';
import { buildShowroom } from './showroom';

describe('buildShowroom', () => {
  it('is a valid apartment that shows every furniture type once', () => {
    // Act
    const showroom = buildShowroom();

    // Assert
    expect(validateApartment(showroom).success).toBe(true);
    const types = showroom.floors[0]!.furniture.map((item) => item.type);
    expect(types.sort()).toEqual(furnitureTypes.map((type) => type.id).sort());
  });

  it('keeps pieces in a row from overlapping', () => {
    // Act
    const items = buildShowroom().floors[0]!.furniture;

    // Assert
    const spans = items.map((item) => {
      const type = findFurnitureType(item.type)!;
      const [width] = type.size(type.params);
      return {
        y: item.position[1],
        left: item.position[0] - width / 2,
        right: item.position[0] + width / 2,
      };
    });
    for (const a of spans) {
      for (const b of spans) {
        if (a !== b && a.y === b.y) {
          expect(a.right <= b.left || b.right <= a.left).toBe(true);
        }
      }
    }
  });
});
