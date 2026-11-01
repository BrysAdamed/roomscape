import { BufferGeometry, ExtrudeGeometry, Shape, Vector2 } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Stairs } from '../../schema/apartment';

/** One solid block per tread, step `k` (1-based) topping out at `k × riserHeight`. */
export function buildStairsGeometry(stairs: Stairs): BufferGeometry {
  const blocks = stairs.steps.map((polygon, index) => {
    const shape = new Shape(polygon.map(([x, y]) => new Vector2(x, -y)));
    const block = new ExtrudeGeometry(shape, {
      depth: stairs.riserHeight * (index + 1),
      bevelEnabled: false,
    });
    block.rotateX(-Math.PI / 2);
    return block;
  });
  const merged = mergeGeometries(blocks) ?? new BufferGeometry();
  blocks.forEach((block) => block.dispose());
  return merged;
}
