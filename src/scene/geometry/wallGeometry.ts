import {
  BufferAttribute,
  BufferGeometry,
  ExtrudeGeometry,
  Matrix4,
  Path,
  Shape,
  Vector3,
} from 'three';
import type { Opening } from '../../schema/apartment';
import { wallFrame } from './wallFrame';
import type { WallSpan } from './wallLayout';

export const WALL_GROUP = { left: 0, right: 1, edges: 2 } as const;

const EPSILON = 1e-6;

export function buildWallGeometry(
  span: WallSpan,
  height: number,
  openings: readonly Opening[],
): BufferGeometry {
  const { wall } = span;
  const frame = wallFrame(wall);
  const shape = wallOutline(span, frame.length, height, openings);

  const extruded = new ExtrudeGeometry(shape, { depth: wall.thickness, bevelEnabled: false });
  const geometry = groupFacesBySide(extruded);
  extruded.dispose();

  const [dx, dz] = frame.direction;
  const toWorld = new Matrix4()
    .makeBasis(new Vector3(dx, 0, dz), new Vector3(0, 1, 0), new Vector3(-dz, 0, dx))
    .setPosition(wall.start[0], 0, wall.start[1])
    .multiply(new Matrix4().makeTranslation(0, 0, -wall.thickness / 2));
  geometry.applyMatrix4(toWorld);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function wallOutline(
  span: WallSpan,
  length: number,
  height: number,
  openings: readonly Opening[],
): Shape {
  const left = -span.startExtension;
  const right = length + span.endExtension;
  const sorted = [...openings].sort((a, b) => a.offset - b.offset);
  const floorLevel = sorted.filter((opening) => opening.sillHeight < EPSILON);
  const raised = sorted.filter((opening) => opening.sillHeight >= EPSILON);

  const shape = new Shape();
  shape.moveTo(left, 0);
  for (const opening of floorLevel) {
    const top = Math.min(opening.height, height);
    shape.lineTo(opening.offset, 0);
    shape.lineTo(opening.offset, top);
    shape.lineTo(opening.offset + opening.width, top);
    shape.lineTo(opening.offset + opening.width, 0);
  }
  shape.lineTo(right, 0);
  shape.lineTo(right, height);
  shape.lineTo(left, height);
  shape.lineTo(left, 0);

  for (const opening of raised) {
    const hole = new Path();
    const bottom = opening.sillHeight;
    const top = Math.min(opening.sillHeight + opening.height, height);
    hole.moveTo(opening.offset, bottom);
    hole.lineTo(opening.offset, top);
    hole.lineTo(opening.offset + opening.width, top);
    hole.lineTo(opening.offset + opening.width, bottom);
    hole.lineTo(opening.offset, bottom);
    shape.holes.push(hole);
  }

  return shape;
}

function groupFacesBySide(source: BufferGeometry): BufferGeometry {
  const position = source.getAttribute('position');
  const normal = source.getAttribute('normal');
  const uv = source.getAttribute('uv');
  const capsGroup = source.groups[0]!;

  const buckets: number[][] = [[], [], []];
  const triangleCount = position.count / 3;
  for (let triangle = 0; triangle < triangleCount; triangle++) {
    const firstVertex = triangle * 3;
    const isCap = firstVertex >= capsGroup.start && firstVertex < capsGroup.start + capsGroup.count;
    const bucket = !isCap
      ? WALL_GROUP.edges
      : normal.getZ(firstVertex) < 0
        ? WALL_GROUP.left
        : WALL_GROUP.right;
    buckets[bucket]!.push(firstVertex);
  }

  const order = buckets.flat();
  const result = new BufferGeometry();
  result.setAttribute('position', reorder(position, order));
  result.setAttribute('normal', reorder(normal, order));
  result.setAttribute('uv', reorder(uv, order));

  let start = 0;
  buckets.forEach((bucket, materialIndex) => {
    result.addGroup(start, bucket.length * 3, materialIndex);
    start += bucket.length * 3;
  });
  return result;
}

function reorder(
  attribute: BufferGeometry['attributes'][string],
  triangleStarts: readonly number[],
): BufferAttribute {
  const size = attribute.itemSize;
  const array = new Float32Array(triangleStarts.length * 3 * size);
  triangleStarts.forEach((firstVertex, index) => {
    for (let vertex = 0; vertex < 3; vertex++) {
      for (let component = 0; component < size; component++) {
        array[(index * 3 + vertex) * size + component] = attribute.getComponent(
          firstVertex + vertex,
          component,
        );
      }
    }
  });
  return new BufferAttribute(array, size);
}
