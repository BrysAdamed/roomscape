import { MeshStandardMaterial } from 'three';
import { findMaterial } from '../catalogue/materials';

const FALLBACK_COLOR = '#ff00ff';
const cache = new Map<string, MeshStandardMaterial>();

export function meshMaterial(ref: string): MeshStandardMaterial {
  let material = cache.get(ref);
  if (!material) {
    material = createMaterial(ref);
    cache.set(ref, material);
  }
  return material;
}

function createMaterial(ref: string): MeshStandardMaterial {
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
  });
}
