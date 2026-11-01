import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import type { MaterialCategory } from '../../catalogue/materials';
import { patternFor, type Pattern, type SurfaceUsage } from './patterns';

export interface SurfaceTextures {
  map: Texture;
  bumpMap: Texture;
  bumpScale: number;
}

const cache = new Map<string, SurfaceTextures | undefined>();

/** Procedural colour and bump textures for a material category; UVs are expected in metres. */
export function surfaceTextures(
  category: MaterialCategory,
  usage: SurfaceUsage,
): SurfaceTextures | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const pattern = patternFor(category, usage);
  if (!pattern) {
    return undefined;
  }
  if (!cache.has(pattern.key)) {
    cache.set(pattern.key, render(pattern));
  }
  return cache.get(pattern.key);
}

function render(pattern: Pattern): SurfaceTextures {
  const size = pattern.resolution;
  const colour = new ImageData(size, size);
  const height = new ImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [brightness, bump] = pattern.shade(x / size, y / size);
      const index = (y * size + x) * 4;
      const c = Math.round(Math.min(1, Math.max(0, brightness)) * 255);
      const h = Math.round(Math.min(1, Math.max(0, bump)) * 255);
      colour.data.set([c, c, c, 255], index);
      height.data.set([h, h, h, 255], index);
    }
  }
  const map = toTexture(colour, pattern.metres);
  map.colorSpace = SRGBColorSpace;
  return { map, bumpMap: toTexture(height, pattern.metres), bumpScale: pattern.bumpScale };
}

function toTexture(image: ImageData, metres: number): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  canvas.getContext('2d')?.putImageData(image, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1 / metres, 1 / metres);
  texture.anisotropy = 8;
  return texture;
}
