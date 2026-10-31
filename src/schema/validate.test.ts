import { describe, expect, it } from 'vitest';
import type { Apartment } from './apartment';
import { validateApartment, wallLength } from './validate';

function sampleApartment(): Apartment {
  return {
    schemaVersion: 1,
    id: 'sample',
    name: 'Sample',
    floors: [
      {
        id: 'ground',
        name: 'Ground floor',
        elevation: 0,
        height: 2.7,
        walls: [
          {
            id: 'w-south',
            start: [0, 0],
            end: [4, 0],
            thickness: 0.12,
            materials: { left: 'paint-white', right: 'paint-white' },
          },
        ],
        openings: [
          {
            id: 'door-1',
            wallId: 'w-south',
            kind: 'door',
            offset: 0.5,
            width: 0.9,
            height: 2.05,
            sillHeight: 0,
            door: { hinge: 'start', opensTo: 'left' },
          },
        ],
        rooms: [
          {
            id: 'room-1',
            name: 'Bedroom',
            polygon: [
              [0, 0],
              [4, 0],
              [4, 3],
              [0, 3],
            ],
            floorMaterial: 'wood-oak-natural',
          },
        ],
        furniture: [
          {
            id: 'bed-1',
            type: 'bed',
            position: [2, 1.5],
            rotation: 90,
            params: { width: 1.6, length: 2 },
            materials: { frame: 'wood-walnut', bedding: 'fabric-linen' },
          },
        ],
      },
    ],
  };
}

function expectErrors(input: unknown): string[] {
  const result = validateApartment(input);
  expect(result.success).toBe(false);
  return result.success ? [] : result.errors;
}

describe('validateApartment', () => {
  it('accepts a valid apartment', () => {
    // Arrange
    const input = sampleApartment();

    // Act
    const result = validateApartment(input);

    // Assert
    expect(result).toEqual({ success: true, apartment: input });
  });

  it('reports structural errors with their path', () => {
    // Arrange
    const input = sampleApartment() as unknown as { floors: { walls: { thickness: number }[] }[] };
    input.floors[0]!.walls[0]!.thickness = -1;

    // Act
    const errors = expectErrors(input);

    // Assert
    expect(errors).toEqual([expect.stringMatching(/^floors\.0\.walls\.0\.thickness:/)]);
  });

  it('rejects an unsupported schema version', () => {
    // Arrange
    const input = { ...sampleApartment(), schemaVersion: 2 };

    // Act
    const errors = expectErrors(input);

    // Assert
    expect(errors[0]).toMatch(/^schemaVersion:/);
  });

  it('rejects ids that are not kebab-case', () => {
    // Arrange
    const input = sampleApartment();
    input.floors[0]!.rooms[0]!.id = 'Room 1';

    // Act
    const errors = expectErrors(input);

    // Assert
    expect(errors[0]).toMatch(/^floors\.0\.rooms\.0\.id:/);
  });

  it('rejects duplicate ids across element kinds', () => {
    // Arrange
    const input = sampleApartment();
    input.floors[0]!.furniture[0]!.id = 'room-1';

    // Act
    const errors = expectErrors(input);

    // Assert
    expect(errors).toEqual(["floors.0.furniture.0.id: duplicate id 'room-1'"]);
  });

  it('rejects unknown materials', () => {
    // Arrange
    const input = sampleApartment();
    input.floors[0]!.walls[0]!.materials.right = 'paint-neon';
    input.floors[0]!.furniture[0]!.materials.frame = 'wood-unknown';

    // Act
    const errors = expectErrors(input);

    // Assert
    expect(errors).toEqual([
      "floors.0.walls.0.materials.right: unknown material 'paint-neon'",
      "floors.0.furniture.0.materials.frame: unknown material 'wood-unknown'",
    ]);
  });

  it('rejects openings on unknown walls', () => {
    // Arrange
    const input = sampleApartment();
    input.floors[0]!.openings[0]!.wallId = 'w-north';

    // Act
    const errors = expectErrors(input);

    // Assert
    expect(errors).toEqual([
      "floors.0.openings.0: opening 'door-1' references unknown wall 'w-north'",
    ]);
  });

  it('rejects openings that do not fit in their wall', () => {
    // Arrange
    const input = sampleApartment();
    input.floors[0]!.openings[0]!.offset = 3.5;
    input.floors[0]!.openings[0]!.height = 2.8;

    // Act
    const errors = expectErrors(input);

    // Assert
    expect(errors).toEqual([
      "floors.0.openings.0: opening 'door-1' extends past the end of wall 'w-south'",
      "floors.0.openings.0: opening 'door-1' is taller than wall 'w-south'",
    ]);
  });

  it('rejects zero-length walls and walls taller than the floor', () => {
    // Arrange
    const input = sampleApartment();
    const wall = input.floors[0]!.walls[0]!;
    wall.end = [...wall.start];
    wall.height = 3;
    input.floors[0]!.openings = [];

    // Act
    const errors = expectErrors(input);

    // Assert
    expect(errors).toEqual([
      "floors.0.walls.0: wall 'w-south' has zero length",
      "floors.0.walls.0: wall 'w-south' is taller than its floor",
    ]);
  });

  it('rejects door settings on windows', () => {
    // Arrange
    const input = sampleApartment();
    input.floors[0]!.openings[0]!.kind = 'window';

    // Act
    const errors = expectErrors(input);

    // Assert
    expect(errors).toEqual(["floors.0.openings.0: window 'door-1' cannot have door settings"]);
  });
});

describe('wallLength', () => {
  it('returns the euclidean distance between the wall ends', () => {
    expect(wallLength([1, 1], [4, 5])).toBe(5);
  });
});
