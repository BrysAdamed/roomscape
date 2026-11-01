import { BoxGeometry } from 'three';

const cache = new Map<string, BoxGeometry>();

/** Box geometry whose UVs are in metres, so textures keep their real-world scale on every face. */
export function metricBoxGeometry(width: number, height: number, depth: number): BoxGeometry {
  const key = `${width}|${height}|${depth}`;
  let geometry = cache.get(key);
  if (!geometry) {
    geometry = createGeometry(width, height, depth);
    cache.set(key, geometry);
  }
  return geometry;
}

function createGeometry(width: number, height: number, depth: number): BoxGeometry {
  const geometry = new BoxGeometry(width, height, depth);
  const faceSizes = [
    [depth, height],
    [depth, height],
    [width, depth],
    [width, depth],
    [width, height],
    [width, height],
  ] as const;
  const uv = geometry.getAttribute('uv');
  faceSizes.forEach(([u, v], face) => {
    for (let corner = 0; corner < 4; corner++) {
      const index = face * 4 + corner;
      uv.setXY(index, uv.getX(index) * u, uv.getY(index) * v);
    }
  });
  return geometry;
}
