import { describe, expect, it } from 'vitest';
import type { FurnitureItem } from '../../schema/apartment';
import { findMaterial } from '../materials';
import { findFurnitureType, furnitureTypes } from './registry';
import { resolveMaterialRefs, resolveParams } from './resolve';

describe('furniture registry', () => {
  it.each(furnitureTypes.map((type) => [type.id, type] as const))(
    '%s has valid slot defaults',
    (_, type) => {
      for (const slot of Object.values(type.slots)) {
        const material = findMaterial(slot.default);
        expect(material, slot.default).toBeDefined();
        expect(slot.categories).toContain(material!.category);
      }
    },
  );

  it('has unique type ids', () => {
    const ids = furnitureTypes.map((type) => type.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('resolve', () => {
  const item: FurnitureItem = {
    id: 'bed-1',
    type: 'bed',
    position: [0, 0],
    rotation: 0,
    params: { width: 0.9, label: 'single' },
    materials: { bedding: 'fabric-navy' },
  };

  it('merges numeric params over the type defaults', () => {
    // Arrange
    const type = findFurnitureType('bed')!;

    // Act
    const params = resolveParams(type, item);

    // Assert
    expect(params).toEqual({ width: 0.9, length: 2.0, height: 0.5 });
  });

  it('fills missing material slots with defaults', () => {
    // Arrange
    const type = findFurnitureType('bed')!;

    // Act
    const refs = resolveMaterialRefs(type, item);

    // Assert
    expect(refs).toEqual({ frame: 'wood-oak-natural', bedding: 'fabric-navy' });
  });
});
