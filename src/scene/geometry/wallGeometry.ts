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
import { profileAt, profileFrom, type ProfilePoint } from './roof';
import { wallFrame } from './wallFrame';
import type { WallSpan } from './wallLayout';

export const WALL_GROUP = { left: 0, right: 1, edges: 2 } as const;

const EPSILON = 1e-6;

/** Wall top: a flat height, or a profile along the wall from `wallTopProfile`. */
export type WallTop = number | readonly ProfilePoint[];

export function buildWallGeometry(
  span: WallSpan,
  top: WallTop,
  openings: readonly Opening[],
): BufferGeometry {
  const { wall } = span;
  const frame = wallFrame(wall);
  const profile =
    typeof top === 'number'
      ? flatProfile(-span.startExtension, frame.length + span.endExtension, top)
      : top;
  const shapes = wallOutlines(span, frame.length, profile, openings);

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

function flatProfile(from: number, to: number, height: number): ProfilePoint[] {
  return [
    [from, height],
    [to, height],
  ];
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
  profile: readonly ProfilePoint[],
  openings: readonly Opening[],
): Shape[] {
  const peak = Math.max(...profile.map(([, height]) => height));
  const lowest = (start: number, end: number) =>
    Math.min(
      profileAt(profile, start),
      profileAt(profile, end),
      ...profile.filter(([x]) => x > start && x < end).map(([, height]) => height),
    );
  const gaps: Gap[] = openings
    .map((opening) => ({
      start: opening.offset,
      end: opening.offset + opening.width,
      bottom: opening.sillHeight,
      top: Math.min(opening.sillHeight + opening.height, peak),
    }))
    .filter((gap) => gap.bottom < lowest(gap.start, gap.end) - EPSILON)
    .sort((a, b) => a.start - b.start);
  const reachesFloor = (gap: Gap) => gap.bottom < EPSILON;
  const reachesTop = (gap: Gap) => gap.top > lowest(gap.start, gap.end) - EPSILON;
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
    shapes.push(piece(left, right, profile, inside, reachesFloor, reachesTop));
  }
  return shapes;
}

function piece(
  left: number,
  right: number,
  profile: readonly ProfilePoint[],
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
  for (const [x, y] of topEdge(left, right, profile, gaps.filter(reachesTop))) {
    shape.lineTo(x, y);
  }
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

/** Top edge from right to left, following the profile and dipping into notches for openings that reach the top. */
function topEdge(
  left: number,
  right: number,
  profile: readonly ProfilePoint[],
  notches: readonly Gap[],
): ProfilePoint[] {
  const inside = (x: number) =>
    notches.some((gap) => x > gap.start - EPSILON && x < gap.end + EPSILON);
  const vertices: ProfilePoint[] = [
    [right, profileFrom(profile, right, 'below')],
    ...profile.filter(([x]) => x > left + EPSILON && x < right - EPSILON).reverse(),
    [left, profileFrom(profile, left, 'above')],
  ];
  const pending = [...notches].sort((a, b) => b.start - a.start);
  const edge: ProfilePoint[] = [];
  for (const vertex of vertices) {
    while (pending.length > 0 && vertex[0] < pending[0]!.end + EPSILON) {
      const gap = pending.shift()!;
      edge.push(
        [gap.end, profileAt(profile, gap.end)],
        [gap.end, gap.bottom],
        [gap.start, gap.bottom],
        [gap.start, profileAt(profile, gap.start)],
      );
    }
    if (!inside(vertex[0])) {
      edge.push(vertex);
    }
  }
  return edge;
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
