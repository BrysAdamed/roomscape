import { describe, expect, it } from 'vitest';
import type { Apartment } from '../../schema/apartment';
import { frameApartment } from './framing';

describe('frameApartment', () => {
  it('targets the centre of the walls and looks from above the front', () => {
    // Arrange
    const apartment = {
      floors: [
        {
          walls: [
            { start: [0, 0], end: [6, 0] },
            { start: [6, 0], end: [6, 4] },
          ],
        },
      ],
    } as unknown as Apartment;

    // Act
    const framing = frameApartment(apartment);

    // Assert
    expect(framing.target).toEqual([3, 0, 2]);
    expect(framing.position[1]).toBeGreaterThan(0);
    expect(framing.position[2]).toBeGreaterThan(2);
  });

  it('falls back to a default view without walls', () => {
    expect(frameApartment(undefined).target).toEqual([0, 0, 0]);
  });
});
