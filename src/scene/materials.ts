import { MeshStandardMaterial } from 'three';
import { findMaterial } from '../catalogue/materials';
import { CUSTOM_COLOR_PATTERN } from '../schema/apartment';
import type { SurfaceUsage } from './textures/patterns';
import { surfaceTextures } from './textures/surfaceTextures';

const FALLBACK_COLOR = '#ff00ff';
const CUSTOM_COLOR_ROUGHNESS = 0.9;
const cache = new Map<string, MeshStandardMaterial>();

export const ghostMaterial = new MeshStandardMaterial({
  color: '#ffffff',
  roughness: 1,
  transparent: true,
  opacity: 0.22,
  depthWrite: false,
});

export function meshMaterial(ref: string, usage: SurfaceUsage = 'surface'): MeshStandardMaterial {
  const key = `${ref}|${usage}`;
  let material = cache.get(key);
  if (!material) {
    material = createMaterial(ref, usage);
    cache.set(key, material);
  }
  return material;
}

function createMaterial(ref: string, usage: SurfaceUsage): MeshStandardMaterial {
  if (CUSTOM_COLOR_PATTERN.test(ref)) {
    return new MeshStandardMaterial({
      color: ref,
      roughness: CUSTOM_COLOR_ROUGHNESS,
      ...surfaceTextures('paint', usage),
    });
  }
  const definition = findMaterial(ref);
  if (!definition) {
    return new MeshStandardMaterial({ color: FALLBACK_COLOR });
  }
  const opacity = definition.opacity ?? 1;
  return new MeshStandardMaterial({
    color: definition.color,
    roughness: definition.roughness,
    metalness: definition.metalness,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity === 1,
    emissive: definition.emissive ? definition.color : '#000000',
    emissiveIntensity: definition.emissive ?? 1,
    ...surfaceTextures(definition.category, usage),
  });
}
