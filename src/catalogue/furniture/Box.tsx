import type { Material } from 'three';

interface BoxProps {
  size: [number, number, number];
  position: [number, number, number];
  material: Material;
}

export function Box({ size, position, material }: BoxProps) {
  return (
    <mesh position={position} material={material} castShadow receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}
