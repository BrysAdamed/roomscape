import { BufferGeometry, Float32BufferAttribute, ShapeUtils, Vector2 } from 'three';
import type { PlanPoint, Roof } from '../../schema/apartment';
import { ceilingPieces, slopeHeight } from './roof';

/** Downward-facing ceiling surfaces over the given room outlines, following the roof slopes. */
export function buildCeilingGeometry(
  roof: Roof,
  height: number,
  polygons: readonly (readonly PlanPoint[])[],
): BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  for (const polygon of polygons) {
    for (const piece of ceilingPieces(roof, height, polygon)) {
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
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}
