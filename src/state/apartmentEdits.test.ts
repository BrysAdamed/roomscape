import { describe, expect, it } from 'vitest';
import type { Apartment } from '../schema/apartment';
import {
  findElement,
  setFurnitureMaterial,
  setRoomFloorMaterial,
  setWallMaterial,
} from './apartmentEdits';

function apartment(): Apartment {
  return {
    schemaVersion: 1,
    id: 'flat',
    name: 'Flat',
    floors: [
      {
        id: 'ground',
        name: 'Ground',
        elevation: 0,
        height: 2.6,
        walls: [
          {
            id: 'w-1',
            start: [0, 0],
            end: [3, 0],
            thickness: 0.1,
            materials: { left: 'paint-white', right: 'paint-white' },
          },
          {
            id: 'w-2',
            start: [3, 0],
            end: [3, 3],
            thickness: 0.1,
            materials: { left: 'paint-white', right: 'paint-white' },
          },
        ],
        openings: [],
        rooms: [
          {
            id: 'room-1',
            name: 'Room',
            polygon: [
              [0, 0],
              [3, 0],
              [3, 3],
            ],
            floorMaterial: 'wood-oak-natural',
          },
        ],
        furniture: [
          {
            id: 'bed-1',
            type: 'bed',
            position: [1, 1],
            rotation: 0,
            params: {},
            materials: {},
          },
        ],
      },
      {
        id: 'first',
        name: 'First',
        elevation: 2.9,
        height: 2.6,
        walls: [],
        openings: [],
        rooms: [],
        furniture: [],
      },
    ],
  };
}

describe('findElement', () => {
  it('finds walls, rooms and furniture by id', () => {
    // Arrange
    const flat = apartment();

    // Act
    const found = ['w-2', 'room-1', 'bed-1', 'missing'].map((id) => findElement(flat, id)?.kind);

    // Assert
    expect(found).toEqual(['wall', 'room', 'furniture', undefined]);
  });
});

describe('edits', () => {
  it('changes one wall side and keeps everything else by reference', () => {
    // Arrange
    const flat = apartment();

    // Act
    const edited = setWallMaterial(flat, 'w-1', 'right', '#336699');

    // Assert
    const [ground, first] = edited.floors;
    expect(ground!.walls[0]!.materials).toEqual({ left: 'paint-white', right: '#336699' });
    expect(ground!.walls[0]!.start).toBe(flat.floors[0]!.walls[0]!.start);
    expect(ground!.walls[1]).toBe(flat.floors[0]!.walls[1]);
    expect(ground!.rooms).toBe(flat.floors[0]!.rooms);
    expect(first).toBe(flat.floors[1]);
  });

  it('changes a room floor material', () => {
    // Act
    const edited = setRoomFloorMaterial(apartment(), 'room-1', 'tile-white-matte');

    // Assert
    expect(edited.floors[0]!.rooms[0]!.floorMaterial).toBe('tile-white-matte');
  });

  it('sets a furniture material slot', () => {
    // Act
    const edited = setFurnitureMaterial(apartment(), 'bed-1', 'bedding', 'fabric-navy');

    // Assert
    expect(edited.floors[0]!.furniture[0]!.materials).toEqual({ bedding: 'fabric-navy' });
  });

  it('returns the same apartment when the id does not exist', () => {
    // Arrange
    const flat = apartment();

    // Act
    const edited = setWallMaterial(flat, 'nope', 'left', 'paint-sage');

    // Assert
    expect(edited).toBe(flat);
  });
});
