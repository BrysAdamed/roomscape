import {
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Shape,
  ShapeUtils,
  Vector2,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { PlanPoint, Stairs } from '../../schema/apartment';

export const TREAD_THICKNESS = 0.05;
const SOFFIT_DEPTH = 0.2;

/**
 * Treads: step `k` (1-based) is a slab whose top is at `k × riserHeight`. Closed stairs also get risers, side
 * stringers and a sloped soffit underneath, running parallel to the line through the step nosings.
 */
export function buildStairsGeometry(stairs: Stairs): BufferGeometry {
  const blocks: BufferGeometry[] = stairs.steps.map((polygon, index) => {
    const shape = new Shape(polygon.map(([x, y]) => new Vector2(x, -y)));
    const top = stairs.riserHeight * (index + 1);
    const thickness = Math.min(TREAD_THICKNESS, top);
    const block = new ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
    block.rotateX(-Math.PI / 2);
    block.translate(0, top - thickness, 0);
    return block;
  });
  if (stairs.closed) {
    blocks.push(closedStairs(stairs));
  }
  const merged =
    mergeGeometries(blocks.map((block) => block.toNonIndexed())) ?? new BufferGeometry();
  blocks.forEach((block) => block.dispose());
  return merged;
}

function closedStairs(stairs: Stairs): BufferGeometry {
  const positions: number[] = [];
  const rise = stairs.riserHeight;
  const key = ([x, y]: PlanPoint) => `${x.toFixed(4)},${y.toFixed(4)}`;
  const vertexSets = stairs.steps.map((polygon) => new Set(polygon.map(key)));
  const face = (corners: [number, number, number][]) => {
    const [a, b, c, d] = corners;
    for (const triangle of [
      [a, b, c],
      [a, c, d],
      [a, c, b],
      [a, d, c],
    ]) {
      for (const corner of triangle) {
        positions.push(...corner!);
      }
    }
  };

  stairs.steps.forEach((polygon, index) => {
    const step = index + 1;
    const top = rise * step;
    const previous = vertexSets[index - 1];
    const next = vertexSets[index + 1];
    const soffit = (point: PlanPoint) => {
      const back = next?.has(key(point)) && !previous?.has(key(point));
      return Math.max(0, (back ? top + rise : top) - SOFFIT_DEPTH);
    };

    const contour = polygon.map(([x, y]) => new Vector2(x, y));
    for (const triangle of ShapeUtils.triangulateShape(contour, [])) {
      const [a, b, c] = triangle.map((corner) => polygon[corner]!) as [
        PlanPoint,
        PlanPoint,
        PlanPoint,
      ];
      const facingUp = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) < 0;
      for (const point of facingUp ? [a, c, b] : [a, b, c]) {
        positions.push(point[0], soffit(point), point[1]);
      }
    }

    polygon.forEach((start, corner) => {
      const end = polygon[(corner + 1) % polygon.length]!;
      const sharedWith = (set: Set<string> | undefined) =>
        !!set && set.has(key(start)) && set.has(key(end));
      if (sharedWith(previous)) {
        face([
          [start[0], top - rise, start[1]],
          [end[0], top - rise, end[1]],
          [end[0], top, end[1]],
          [start[0], top, start[1]],
        ]);
      } else if (!sharedWith(next)) {
        face([
          [start[0], soffit(start), start[1]],
          [end[0], soffit(end), end[1]],
          [end[0], top, end[1]],
          [start[0], top, start[1]],
        ]);
      }
    });
  });

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  const uvs: number[] = [];
  for (let index = 0; index < positions.length; index += 3) {
    uvs.push(positions[index]! + positions[index + 2]!, positions[index + 1]!);
  }
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}
