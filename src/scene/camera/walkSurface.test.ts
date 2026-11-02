import { describe, expect, it } from 'vitest';
import type { Apartment, Floor } from '../../schema/apartment';
import { walkStart, walkSurface } from './walkSurface';

function floor(id: string, elevation: number, extra: Partial<Floor> = {}): Floor {
  return {
    id,
    name: id,
    elevation,
    height: 2.6,
    walls: [],
    openings: [],
    rooms: [],
    furniture: [],
    ...extra,
  };
}

/** Three treads of 1 m rising along +x from x = 0 with 1 m risers; the fourth riser reaches the first floor at 4 m. */
const apartment: Apartment = {
  schemaVersion: 1,
  id: 'flat',
  name: 'Flat',
  floors: [
    floor('ground', 0, {
      stairs: [
        {
          id: 's',
          riserHeight: 1,
          material: 'wood-oak-natural',
          steps: [0, 1, 2].map((i) => [
            [i, 0],
            [i + 1, 0],
            [i + 1, 1],
            [i, 1],
          ]),
        },
      ],
    }),
    floor('first', 4),
  ],
};

describe('walkSurface', () => {
  it('stands on the floor away from the stairs', () => {
    expect(walkSurface(apartment, 'ground', [5, 5])).toEqual({ height: 0, floorId: 'ground' });
  });

  it('climbs the treads and arrives on the floor above at the top', () => {
    // Act
    const steps = [
      [0.5, 0.5],
      [1.5, 0.5],
      [2.5, 0.5],
    ].map((point) => walkSurface(apartment, 'ground', point as [number, number]));

    // Assert
    expect(steps).toEqual([
      { height: 1, floorId: 'ground' },
      { height: 2, floorId: 'ground' },
      { height: 3, floorId: 'first' },
    ]);
    expect(walkSurface(apartment, 'first', [4, 0.5])).toEqual({ height: 4, floorId: 'first' });
  });

  it('walks back down into the stairwell from the floor above', () => {
    // Act
    const top = walkSurface(apartment, 'first', [2.5, 0.5]);
    const lower = walkSurface(apartment, 'first', [1.5, 0.5]);

    // Assert
    expect(top).toEqual({ height: 3, floorId: 'first' });
    expect(lower).toEqual({ height: 2, floorId: 'ground' });
  });
});

describe('walkStart', () => {
  it('starts in the middle of the largest indoor room', () => {
    // Arrange
    const square = (x: number, size: number): [number, number][] => [
      [x, 0],
      [x + size, 0],
      [x + size, size],
      [x, size],
    ];
    const ground = floor('ground', 0, {
      rooms: [
        { id: 'small', name: 'Small', polygon: square(0, 2), floorMaterial: 'wood-oak-natural' },
        { id: 'big', name: 'Big', polygon: square(5, 4), floorMaterial: 'wood-oak-natural' },
        {
          id: 'garden',
          name: 'Garden',
          polygon: square(20, 10),
          floorMaterial: 'wood-oak-natural',
          outdoor: true,
        },
      ],
    });

    // Act
    const start = walkStart(ground);

    // Assert
    expect(start).toEqual([7, 2]);
  });
});
