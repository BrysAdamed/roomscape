import { describe, expect, it } from 'vitest';
import type { Apartment } from '../schema/apartment';
import { applyVariant } from './variants';

function apartment(): Apartment {
  return {
    schemaVersion: 1,
    id: 'flat',
    name: 'Flat',
    floors: [
      {
        id: 'ground',
        name: 'Ground floor',
        elevation: 0,
        height: 2.6,
        walls: [
          {
            id: 'w-1',
            start: [0, 0],
            end: [4, 0],
            thickness: 0.1,
            materials: { left: 'paint-white', right: 'paint-white' },
          },
        ],
        openings: [
          {
            id: 'door-1',
            wallId: 'w-1',
            kind: 'door',
            offset: 1,
            width: 0.9,
            height: 2,
            sillHeight: 0,
          },
        ],
        rooms: [
          {
            id: 'room-1',
            name: 'Room',
            polygon: [
              [0, 0],
              [4, 0],
              [4, 3],
            ],
            floorMaterial: 'wood-oak-natural',
          },
        ],
        furniture: [
          { id: 'desk-1', type: 'desk', position: [1, 1], rotation: 0, params: {}, materials: {} },
        ],
      },
    ],
    variants: [
      {
        id: 'guest',
        name: 'Guest room',
        changes: [
          { op: 'remove', id: 'w-1' },
          { op: 'remove', id: 'desk-1' },
          {
            op: 'add',
            floorId: 'ground',
            item: {
              id: 'bed-1',
              type: 'bed',
              position: [2, 2],
              rotation: 90,
              params: {},
              materials: {},
            },
          },
          { op: 'update', id: 'room-1', set: { floorMaterial: 'tile-white-matte' } },
        ],
      },
      { id: 'broken', name: 'Broken', changes: [{ op: 'remove', id: 'sofa-9' }] },
    ],
  };
}

describe('applyVariant', () => {
  it('returns the base for no variant', () => {
    // Arrange
    const base = apartment();

    // Act
    const { apartment: shown, errors } = applyVariant(base, undefined);

    // Assert
    expect(shown).toBe(base);
    expect(errors).toEqual([]);
  });

  it('removes walls with their openings, swaps furniture and changes finishes', () => {
    // Act
    const { apartment: shown, errors } = applyVariant(apartment(), 'guest');

    // Assert
    const floor = shown.floors[0]!;
    expect(errors).toEqual([]);
    expect(shown.name).toBe('Flat – Guest room');
    expect(shown.variants).toBeUndefined();
    expect(floor.walls).toEqual([]);
    expect(floor.openings).toEqual([]);
    expect(floor.furniture.map((item) => item.id)).toEqual(['bed-1']);
    expect(floor.rooms[0]!.floorMaterial).toBe('tile-white-matte');
  });

  it('reports changes that refer to unknown elements', () => {
    // Act
    const { errors } = applyVariant(apartment(), 'broken');

    // Assert
    expect(errors).toEqual(["variants.1.changes.0: remove refers to unknown 'sofa-9'"]);
  });
});
