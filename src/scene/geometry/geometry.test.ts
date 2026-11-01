import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import type { Opening, Wall } from '../../schema/apartment';
import { buildFloorGeometry, polygonArea } from './floorGeometry';
import { buildWallGeometry, WALL_GROUP } from './wallGeometry';
import { pointAlong, wallFrame } from './wallFrame';
import { layoutWalls } from './wallLayout';

function wall(id: string, start: [number, number], end: [number, number], thickness = 0.2): Wall {
  return { id, start, end, thickness, materials: { left: 'paint-white', right: 'paint-white' } };
}

function opening(overrides: Partial<Opening>): Opening {
  return {
    id: 'o-1',
    wallId: 'w-1',
    kind: 'window',
    offset: 1,
    width: 1,
    height: 1.2,
    sillHeight: 0.9,
    ...overrides,
  };
}

describe('wallFrame', () => {
  it('describes the wall direction, length and rotation', () => {
    // Arrange
    const frame = wallFrame(wall('w', [1, 1], [1, 4]));

    // Act
    const midpoint = pointAlong(frame, 1.5);

    // Assert
    expect(frame.length).toBe(3);
    expect(frame.direction).toEqual([0, 1]);
    expect(frame.angle).toBeCloseTo(-Math.PI / 2);
    expect(midpoint).toEqual([1, 2.5]);
  });
});

describe('layoutWalls', () => {
  it('extends the first wall and trims the second at a corner', () => {
    // Arrange
    const walls = [wall('a', [0, 0], [4, 0], 0.2), wall('b', [0, 0], [0, 3], 0.1)];

    // Act
    const [a, b] = layoutWalls(walls);

    // Assert
    expect(a).toMatchObject({ startExtension: 0.05, endExtension: 0 });
    expect(b).toMatchObject({ startExtension: -0.1, endExtension: 0 });
  });

  it('trims a wall ending in the middle of another wall', () => {
    // Arrange
    const walls = [wall('a', [0, 0], [4, 0], 0.24), wall('b', [2, 0], [2, 3], 0.1)];

    // Act
    const [a, b] = layoutWalls(walls);

    // Assert
    expect(a).toMatchObject({ startExtension: 0, endExtension: 0 });
    expect(b).toMatchObject({ startExtension: -0.12, endExtension: 0 });
  });

  it('leaves collinear walls untouched', () => {
    // Arrange
    const walls = [wall('a', [0, 0], [2, 0]), wall('b', [2, 0], [4, 0])];

    // Act
    const spans = layoutWalls(walls);

    // Assert
    expect(spans.map((span) => [span.startExtension, span.endExtension])).toEqual([
      [0, 0],
      [0, 0],
    ]);
  });
});

describe('buildWallGeometry', () => {
  it('spans the wall length including extensions, thickness and height', () => {
    // Arrange
    const span = {
      wall: wall('w-1', [0, 0], [4, 0], 0.2),
      startExtension: 0.1,
      endExtension: -0.1,
    };

    // Act
    const geometry = buildWallGeometry(span, 2.7, []);

    // Assert
    const box = geometry.boundingBox!;
    expect(box.min.toArray().map(round)).toEqual([-0.1, 0, -0.1]);
    expect(box.max.toArray().map(round)).toEqual([3.9, 2.7, 0.1]);
  });

  it('orients a wall along its plan direction', () => {
    // Arrange
    const span = { wall: wall('w-1', [1, 1], [1, 4], 0.2), startExtension: 0, endExtension: 0 };

    // Act
    const geometry = buildWallGeometry(span, 2.5, []);

    // Assert
    const box = geometry.boundingBox!;
    expect(box.min.toArray().map(round)).toEqual([0.9, 0, 1]);
    expect(box.max.toArray().map(round)).toEqual([1.1, 2.5, 4]);
  });

  it('groups faces into left side, right side and edges', () => {
    // Arrange
    const span = { wall: wall('w-1', [0, 0], [4, 0], 0.2), startExtension: 0, endExtension: 0 };

    // Act
    const geometry = buildWallGeometry(span, 2.7, []);

    // Assert
    expect(geometry.groups.map((group) => group.materialIndex)).toEqual([
      WALL_GROUP.left,
      WALL_GROUP.right,
      WALL_GROUP.edges,
    ]);
    const normal = geometry.getAttribute('normal');
    const leftNormal = new Vector3().fromBufferAttribute(normal, geometry.groups[0]!.start);
    const rightNormal = new Vector3().fromBufferAttribute(normal, geometry.groups[1]!.start);
    expect(leftNormal.toArray().map((v) => Math.round(v))).toEqual([0, 0, -1]);
    expect(rightNormal.toArray().map((v) => Math.round(v))).toEqual([0, 0, 1]);
  });

  it('cuts windows as holes and doors as notches', () => {
    // Arrange
    const span = { wall: wall('w-1', [0, 0], [4, 0], 0.2), startExtension: 0, endExtension: 0 };
    const solidArea = sideArea(buildWallGeometry(span, 2.7, []));

    // Act
    const withOpenings = buildWallGeometry(span, 2.7, [
      opening({ id: 'win', offset: 0.5, width: 1, height: 1.2, sillHeight: 0.9 }),
      opening({ id: 'door', kind: 'door', offset: 2.5, width: 0.9, height: 2, sillHeight: 0 }),
    ]);

    // Assert
    expect(sideArea(withOpenings)).toBeCloseTo(solidArea - 1.2 - 1.8, 6);
  });

  it('follows a sloped top profile and still cuts windows', () => {
    // Arrange
    const span = { wall: wall('w-1', [0, 0], [10, 0], 0.2), startExtension: 0, endExtension: 0 };
    const profile: [number, number][] = [
      [0, 1],
      [3, 2.5],
      [7, 2.5],
      [10, 1],
    ];

    // Act
    const sloped = buildWallGeometry(span, profile, [
      opening({ id: 'win', offset: 4, width: 1, height: 1, sillHeight: 1 }),
    ]);

    // Assert
    expect(sloped.boundingBox!.max.y).toBeCloseTo(2.5);
    expect(sideArea(sloped)).toBeCloseTo(20.5 - 1, 6);
  });

  it('splits a cut-down wall at doors and notches windows that reach the top', () => {
    // Arrange
    const span = { wall: wall('w-1', [0, 0], [4, 0], 0.2), startExtension: 0, endExtension: 0 };

    // Act
    const cut = buildWallGeometry(span, 1.2, [
      opening({ id: 'win', offset: 0.5, width: 1, height: 1.5, sillHeight: 0.9 }),
      opening({ id: 'door', kind: 'door', offset: 2.5, width: 0.9, height: 2.05, sillHeight: 0 }),
      opening({ id: 'high', offset: 3.6, width: 0.3, height: 0.4, sillHeight: 1.5 }),
    ]);

    // Assert
    expect(cut.boundingBox!.max.y).toBeCloseTo(1.2);
    expect(sideArea(cut)).toBeCloseTo(4 * 1.2 - 1 * 0.3 - 0.9 * 1.2, 6);
  });
});

describe('buildFloorGeometry', () => {
  it('lays the polygon flat on the floor facing up', () => {
    // Arrange
    const polygon: [number, number][] = [
      [0, 0],
      [3, 0],
      [3, 2],
      [0, 2],
    ];

    // Act
    const geometry = buildFloorGeometry(polygon);

    // Assert
    const box = geometry.boundingBox!;
    expect(box.min.toArray().map(round)).toEqual([0, 0, 0]);
    expect(box.max.toArray().map(round)).toEqual([3, 0, 2]);
    expect(geometry.getAttribute('normal').getY(0)).toBeCloseTo(1);
    expect(polygonArea(polygon)).toBe(6);
  });
});

function round(value: number): number {
  return +value.toFixed(6) + 0;
}

function sideArea(geometry: ReturnType<typeof buildWallGeometry>): number {
  const position = geometry.getAttribute('position');
  const group = geometry.groups[WALL_GROUP.left]!;
  let area = 0;
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  for (let index = group.start; index < group.start + group.count; index += 3) {
    a.fromBufferAttribute(position, index);
    b.fromBufferAttribute(position, index + 1);
    c.fromBufferAttribute(position, index + 2);
    area += b.sub(a).cross(c.sub(a)).length() / 2;
  }
  return area;
}
