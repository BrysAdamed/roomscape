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
  const shapes = wallOutlines(span, frame.length, height, openings);

  const extruded = new ExtrudeGeometry(shapes, { depth: wall.thickness, bevelEnabled: false });
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

interface Gap {
  start: number;
  end: number;
  bottom: number;
  top: number;
}

/**
 * Wall elevation outlines (x along the wall, y up). Openings reaching the floor or the wall top become notches,
 * openings spanning the full height split the wall into separate pieces, the rest are holes.
 */
function wallOutlines(
  span: WallSpan,
  length: number,
  height: number,
  openings: readonly Opening[],
): Shape[] {
  const gaps: Gap[] = openings
    .map((opening) => ({
      start: opening.offset,
      end: opening.offset + opening.width,
      bottom: opening.sillHeight,
      top: Math.min(opening.sillHeight + opening.height, height),
    }))
    .filter((gap) => gap.bottom < height - EPSILON)
    .sort((a, b) => a.start - b.start);
  const reachesFloor = (gap: Gap) => gap.bottom < EPSILON;
  const reachesTop = (gap: Gap) => gap.top > height - EPSILON;
  const cuts = gaps.filter((gap) => reachesFloor(gap) && reachesTop(gap));

  const bounds = [
    -span.startExtension,
    ...cuts.flatMap((cut) => [cut.start, cut.end]),
    length + span.endExtension,
  ];
  const shapes: Shape[] = [];
  for (let index = 0; index < bounds.length; index += 2) {
    const left = bounds[index]!;
    const right = bounds[index + 1]!;
    if (right - left < EPSILON) {
      continue;
    }
    const inside = gaps.filter(
      (gap) => !cuts.includes(gap) && gap.start >= left - EPSILON && gap.end <= right + EPSILON,
    );
    shapes.push(piece(left, right, height, inside, reachesFloor, reachesTop));
  }
  return shapes;
}

function piece(
  left: number,
  right: number,
  height: number,
  gaps: readonly Gap[],
  reachesFloor: (gap: Gap) => boolean,
  reachesTop: (gap: Gap) => boolean,
): Shape {
  const shape = new Shape();
  shape.moveTo(left, 0);
  for (const gap of gaps.filter(reachesFloor)) {
    shape.lineTo(gap.start, 0);
    shape.lineTo(gap.start, gap.top);
    shape.lineTo(gap.end, gap.top);
    shape.lineTo(gap.end, 0);
  }
  shape.lineTo(right, 0);
  shape.lineTo(right, height);
  for (const gap of gaps.filter(reachesTop).reverse()) {
    shape.lineTo(gap.end, height);
    shape.lineTo(gap.end, gap.bottom);
    shape.lineTo(gap.start, gap.bottom);
    shape.lineTo(gap.start, height);
  }
  shape.lineTo(left, height);
  shape.lineTo(left, 0);

  for (const gap of gaps.filter((gap) => !reachesFloor(gap) && !reachesTop(gap))) {
    const hole = new Path();
    hole.moveTo(gap.start, gap.bottom);
    hole.lineTo(gap.start, gap.top);
    hole.lineTo(gap.end, gap.top);
    hole.lineTo(gap.end, gap.bottom);
    hole.lineTo(gap.start, gap.bottom);
    shape.holes.push(hole);
  }
  return shape;
}

function groupFacesBySide(source: BufferGeometry): BufferGeometry {
  const position = source.getAttribute('position');
  const normal = source.getAttribute('normal');
  const uv = source.getAttribute('uv');
  const caps = source.groups.filter((group) => group.materialIndex === 0);

  const buckets: number[][] = [[], [], []];
  const triangleCount = position.count / 3;
  for (let triangle = 0; triangle < triangleCount; triangle++) {
    const firstVertex = triangle * 3;
    const isCap = caps.some(
      (group) => firstVertex >= group.start && firstVertex < group.start + group.count,
    );
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
