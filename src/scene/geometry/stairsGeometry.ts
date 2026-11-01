import { BufferGeometry, ExtrudeGeometry, Shape, Vector2 } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Stairs } from '../../schema/apartment';

const TREAD_THICKNESS = 0.05;

/** Open treads: step `k` (1-based) is a slab whose top is at `k × riserHeight`. */
export function buildStairsGeometry(stairs: Stairs): BufferGeometry {
  const blocks = stairs.steps.map((polygon, index) => {
    const shape = new Shape(polygon.map(([x, y]) => new Vector2(x, -y)));
    const top = stairs.riserHeight * (index + 1);
    const thickness = Math.min(TREAD_THICKNESS, top);
    const block = new ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
    block.rotateX(-Math.PI / 2);
    block.translate(0, top - thickness, 0);
    return block;
  });
  const merged = mergeGeometries(blocks) ?? new BufferGeometry();
  blocks.forEach((block) => block.dispose());
  return merged;
}
