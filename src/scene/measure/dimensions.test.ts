import { describe, expect, it } from 'vitest';
import type { Floor } from '../../schema/apartment';
import { furnitureDimensions, roomDimensions, wallDimensions } from './dimensions';
import { formatLength } from './format';

const floor: Floor = {
  id: 'f',
  name: 'Floor',
  elevation: 3,
  height: 2.5,
  walls: [],
  openings: [],
  rooms: [],
  furniture: [],
};

const round = (values: number[]) => values.map((v) => +v.toFixed(6) + 0);

describe('furnitureDimensions', () => {
  it('measures width, depth and height of a rotated piece in world space', () => {
    // Arrange
    const desk = {
      id: 'd',
      type: 'desk',
      position: [2, 1] as [number, number],
      rotation: 90,
      params: {},
      materials: {},
    };

    // Act
    const [width, depth, height] = furnitureDimensions(desk, floor);

    // Assert
    expect([width!.value, depth!.value, height!.value]).toEqual([1.2, 0.6, 0.75]);
    expect(round(width!.start)).toEqual([2.36, 3.75, 1.6]);
    expect(round(width!.end)).toEqual([2.36, 3.75, 0.4]);
    expect(height!.end[1] - height!.start[1]).toBeCloseTo(0.75);
  });

  it('returns nothing for unknown types', () => {
    const item = {
      id: 'x',
      type: 'sofa',
      position: [0, 0] as [number, number],
      rotation: 0,
      params: {},
      materials: {},
    };
    expect(furnitureDimensions(item, floor)).toEqual([]);
  });
});

describe('wallDimensions', () => {
  it('gives the centre-line length above the wall and its height', () => {
    const wall = {
      id: 'w',
      start: [0, 0] as [number, number],
      end: [3, 4] as [number, number],
      thickness: 0.1,
      materials: { left: 'paint-white', right: 'paint-white' },
    };

    const [length, height] = wallDimensions(wall, floor);

    expect(length!.value).toBe(5);
    expect(length!.start[1]).toBeCloseTo(5.58);
    expect(height!.value).toBe(2.5);
  });
});

describe('roomDimensions', () => {
  it('measures every polygon edge', () => {
    const room = {
      id: 'r',
      name: 'Room',
      floorMaterial: 'wood-oak-natural',
      polygon: [
        [0, 0],
        [4, 0],
        [4, 3],
        [0, 3],
      ] as [number, number][],
    };

    expect(roomDimensions(room, floor).map((line) => line.value)).toEqual([4, 3, 4, 3]);
  });
});

describe('formatLength', () => {
  it('uses centimetres below a metre', () => {
    expect(formatLength(0.456)).toBe('46 cm');
    expect(formatLength(2.4)).toBe('2.40 m');
  });
});
