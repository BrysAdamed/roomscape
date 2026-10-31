import { Shape, ShapeGeometry, Vector2, type BufferGeometry } from 'three';
import type { PlanPoint } from '../../schema/apartment';

export function buildFloorGeometry(polygon: readonly PlanPoint[]): BufferGeometry {
  const shape = new Shape(polygon.map(([x, y]) => new Vector2(x, -y)));
  const geometry = new ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2);
  geometry.computeBoundingBox();
  return geometry;
}

export function polygonArea(polygon: readonly PlanPoint[]): number {
  let twiceArea = 0;
  polygon.forEach(([x1, y1], index) => {
    const [x2, y2] = polygon[(index + 1) % polygon.length]!;
    twiceArea += x1 * y2 - x2 * y1;
  });
  return Math.abs(twiceArea) / 2;
}
