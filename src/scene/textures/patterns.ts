import type { MaterialCategory } from '../../catalogue/materials';
import { fractalNoise, seededRandom } from './noise';

export type SurfaceUsage = 'floor' | 'surface';

/** A tileable surface pattern: `shade` returns brightness (multiplies the material colour) and height for bump. */
export interface Pattern {
  key: string;
  resolution: number;
  metres: number;
  bumpScale: number;
  shade: (u: number, v: number) => [brightness: number, height: number];
}

const fract = (value: number) => value - Math.floor(value);

function planks(): Pattern {
  const columns = 6;
  const offsets = Array.from({ length: columns }, seededRandom(11));
  const tones = seededRandom(12);
  const toneOf = new Map<string, number>();
  const grain = fractalNoise(13, 48, 3, 4);
  const knots = fractalNoise(14, 6, 2, 2);
  return {
    key: 'planks',
    resolution: 768,
    metres: 1.2,
    bumpScale: 1.2,
    shade: (u, v) => {
      const column = Math.floor(u * columns);
      const across = fract(u * columns);
      const along = v + (offsets[column] ?? 0);
      const id = `${column}:${Math.floor(along)}`;
      let tone = toneOf.get(id);
      if (tone === undefined) {
        tone = 0.88 + 0.12 * tones();
        toneOf.set(id, tone);
      }
      const joint = across < 0.012 || fract(along) < 0.004;
      if (joint) {
        return [0.5, 0];
      }
      const streaks = grain(u, v) * 0.75 + knots(u, v) * 0.25;
      return [tone * (0.74 + 0.32 * streaks), 0.8 + 0.2 * streaks];
    },
  };
}

function woodGrain(): Pattern {
  const grain = fractalNoise(21, 40, 3, 4);
  return {
    key: 'wood-grain',
    resolution: 512,
    metres: 0.8,
    bumpScale: 0.6,
    shade: (u, v) => {
      const streaks = grain(u, v);
      return [0.84 + 0.2 * streaks, streaks];
    },
  };
}

function tiles(): Pattern {
  const perSide = 2;
  const tone = seededRandom(31);
  const tones = Array.from({ length: perSide * perSide }, () => 0.94 + 0.06 * tone());
  const speckle = fractalNoise(32, 32, 32, 3);
  const grout = 0.004;
  return {
    key: 'tiles',
    resolution: 512,
    metres: 1.2,
    bumpScale: 1.5,
    shade: (u, v) => {
      const x = fract(u * perSide);
      const y = fract(v * perSide);
      if (x < grout || y < grout || x > 1 - grout || y > 1 - grout) {
        return [0.72, 0];
      }
      const index = Math.floor(v * perSide) * perSide + Math.floor(u * perSide);
      return [(tones[index] ?? 1) * (0.97 + 0.03 * speckle(u, v)), 1];
    },
  };
}

function marble(): Pattern {
  const warp = fractalNoise(41, 3, 3, 5);
  const cloud = fractalNoise(42, 4, 4, 4);
  return {
    key: 'marble',
    resolution: 512,
    metres: 1.5,
    bumpScale: 0.2,
    shade: (u, v) => {
      const vein = Math.abs(Math.sin((u * 2 + v + 2.5 * warp(u, v)) * Math.PI * 2));
      const brightness = 0.98 - 0.32 * (1 - vein) ** 10 - 0.06 * cloud(u, v);
      return [brightness, brightness];
    },
  };
}

function weave(): Pattern {
  const threads = 24;
  const fuzz = fractalNoise(51, 32, 32, 2);
  return {
    key: 'weave',
    resolution: 256,
    metres: 0.08,
    bumpScale: 1,
    shade: (u, v) => {
      const over = (Math.floor(u * threads) + Math.floor(v * threads)) % 2 === 0;
      const profile = Math.sin(fract(over ? v * threads : u * threads) * Math.PI);
      const height = 0.4 + 0.6 * profile;
      return [0.82 + 0.12 * profile + 0.06 * fuzz(u, v), height];
    },
  };
}

function plaster(): Pattern {
  const texture = fractalNoise(61, 16, 16, 5);
  return {
    key: 'plaster',
    resolution: 256,
    metres: 1,
    bumpScale: 0.35,
    shade: (u, v) => {
      const value = texture(u, v);
      return [0.97 + 0.03 * value, value];
    },
  };
}

function brushed(): Pattern {
  const streaks = fractalNoise(71, 2, 128, 3);
  return {
    key: 'brushed',
    resolution: 256,
    metres: 0.4,
    bumpScale: 0.2,
    shade: (u, v) => {
      const value = streaks(u, v);
      return [0.88 + 0.12 * value, value];
    },
  };
}

const PATTERNS: Partial<Record<MaterialCategory, () => Pattern>> = {
  paint: plaster,
  wood: woodGrain,
  tile: tiles,
  stone: marble,
  fabric: weave,
  metal: brushed,
};

export function patternFor(category: MaterialCategory, usage: SurfaceUsage): Pattern | undefined {
  if (category === 'wood' && usage === 'floor') {
    return planks();
  }
  return PATTERNS[category]?.();
}
