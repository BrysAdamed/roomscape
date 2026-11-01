import type { Material } from 'three';
import { metricBoxGeometry } from './metricBox';

interface BoxProps {
  size: [number, number, number];
  position: [number, number, number];
  material: Material;
}

export function Box({ size, position, material }: BoxProps) {
  return (
    <mesh
      position={position}
      geometry={metricBoxGeometry(...size)}
      material={material}
      castShadow
      receiveShadow
    />
  );
}
