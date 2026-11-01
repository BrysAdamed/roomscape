import { BufferGeometry, Float32BufferAttribute, ShapeUtils, Vector2 } from 'three';
import type { PlanPoint, Roof } from '../../schema/apartment';
import { subtractConvex } from './polygonClip';
import { ceilingAt, ceilingPieces, slopeHeight } from './roof';

/**
 * Downward-facing ceiling surfaces over the given room outlines, following the roof slopes when there is a roof.
 * `holes` are convex openings (stairwells, roof windows) left out of the ceiling.
 */
export function buildCeilingGeometry(
  roof: Roof | undefined,
  height: number,
  polygons: readonly (readonly PlanPoint[])[],
  holes: readonly (readonly PlanPoint[])[] = [],
): BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  for (const polygon of polygons) {
    const pieces = (
      roof ? ceilingPieces(roof, height, polygon) : [{ polygon: [...polygon], slope: undefined }]
    ).flatMap((piece) =>
      holes
        .reduce(
          (parts, hole) => parts.flatMap((part) => subtractConvex(part, hole)),
          [piece.polygon],
        )
        .map((part) => ({ polygon: part, slope: piece.slope })),
    );
    for (const piece of pieces) {
      const heightAt = (point: PlanPoint) =>
        piece.slope ? Math.min(height, slopeHeight(piece.slope, point)) : height;
      const contour = piece.polygon.map(([x, y]) => new Vector2(x, y));
      for (const triangle of ShapeUtils.triangulateShape(contour, [])) {
        const corners = triangle.map((index) => piece.polygon[index]!);
        const [a, b, c] = corners as [PlanPoint, PlanPoint, PlanPoint];
        const facingUp = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) < 0;
        const ordered = facingUp ? [a, c, b] : [a, b, c];
        for (const point of ordered) {
          positions.push(point[0], heightAt(point), point[1]);
          uvs.push(point[0], point[1]);
        }
      }
    }
  }
  if (roof) {
    for (const [a, b, bottomA, bottomB] of dormerCheeks(roof, height, polygons)) {
      const quad: [PlanPoint, number][] = [
        [a, bottomA],
        [b, bottomB],
        [b, height],
        [a, height],
      ];
      for (const [i, j, k] of [
        [0, 1, 2],
        [0, 2, 3],
        [0, 2, 1],
        [0, 3, 2],
      ] as const) {
        for (const corner of [i, j, k]) {
          const [point, y] = quad[corner]!;
          positions.push(point[0], y, point[1]);
          uvs.push(point[0] + point[1], y);
        }
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

const CHEEK_STEP = 0.05;
const OUTSIDE = 1e-3;

/**
 * Vertical faces closing the step between a slope and a full-height dormer, along the dormer edges inside the
 * rooms, as segments [start, end, slope height at start, slope height at end].
 */
function dormerCheeks(
  roof: Roof,
  height: number,
  polygons: readonly (readonly PlanPoint[])[],
): [PlanPoint, PlanPoint, number, number][] {
  const cheeks: [PlanPoint, PlanPoint, number, number][] = [];
  for (const [x0, y0, x1, y1] of roof.dormers ?? []) {
    const edges: [PlanPoint, PlanPoint, PlanPoint][] = [
      [
        [x0, y0],
        [x1, y0],
        [0, -OUTSIDE],
      ],
      [
        [x1, y0],
        [x1, y1],
        [OUTSIDE, 0],
      ],
      [
        [x1, y1],
        [x0, y1],
        [0, OUTSIDE],
      ],
      [
        [x0, y1],
        [x0, y0],
        [-OUTSIDE, 0],
      ],
    ];
    for (const [start, end, outward] of edges) {
      const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
      const steps = Math.max(1, Math.ceil(length / CHEEK_STEP));
      const at = (t: number): PlanPoint => [
        start[0] + ((end[0] - start[0]) * t) / steps,
        start[1] + ((end[1] - start[1]) * t) / steps,
      ];
      for (let step = 0; step < steps; step++) {
        const a = at(step);
        const b = at(step + 1);
        const middle: PlanPoint = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        if (!polygons.some((polygon) => contains(polygon, middle))) {
          continue;
        }
        const below = (point: PlanPoint) =>
          ceilingAt(roof, height, [point[0] + outward[0], point[1] + outward[1]]);
        const [bottomA, bottomB] = [below(a), below(b)];
        if (Math.min(bottomA, bottomB) < height - 1e-3) {
          cheeks.push([a, b, bottomA, bottomB]);
        }
      }
    }
  }
  return cheeks;
}

function contains(polygon: readonly PlanPoint[], [x, y]: PlanPoint): boolean {
  let inside = false;
  polygon.forEach(([x0, y0], index) => {
    const [x1, y1] = polygon[(index + 1) % polygon.length]!;
    if (y0 > y !== y1 > y && x < x0 + ((y - y0) * (x1 - x0)) / (y1 - y0)) {
      inside = !inside;
    }
  });
  return inside;
}
