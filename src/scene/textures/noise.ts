export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth lattice noise in [0, 1] that repeats every `periodX` × `periodY` units. */
export function valueNoise(
  seed: number,
  periodX: number,
  periodY = periodX,
): (x: number, y: number) => number {
  const random = seededRandom(seed);
  const lattice = Array.from({ length: periodX * periodY }, random);
  const wrap = (value: number, period: number) => ((value % period) + period) % period;
  const at = (x: number, y: number) => lattice[wrap(y, periodY) * periodX + wrap(x, periodX)] ?? 0;
  const smooth = (t: number) => t * t * (3 - 2 * t);

  return (x, y) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const tx = smooth(x - x0);
    const ty = smooth(y - y0);
    const top = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx;
    const bottom = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx;
    return top * (1 - ty) + bottom * ty;
  };
}

/** Tileable fractal noise in [0, 1]; `u`, `v` in [0, 1) cover one tile. */
export function fractalNoise(
  seed: number,
  periodX: number,
  periodY: number,
  octaves: number,
): (u: number, v: number) => number {
  const layers = Array.from({ length: octaves }, (_, octave) => {
    const px = periodX << octave;
    const py = periodY << octave;
    return { noise: valueNoise(seed + octave * 101, px, py), px, py, weight: 0.5 ** octave };
  });
  const total = layers.reduce((sum, layer) => sum + layer.weight, 0);
  return (u, v) =>
    layers.reduce((sum, layer) => sum + layer.noise(u * layer.px, v * layer.py) * layer.weight, 0) /
    total;
}
