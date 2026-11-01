import type { Material } from 'three';

interface CylinderProps {
  radius: number;
  height: number;
  position: [number, number, number];
  material: Material;
  /** Horizontal scale of the cross-section, to make ovals (x, z). */
  scale?: [number, number];
}

export function Cylinder({ radius, height, position, material, scale = [1, 1] }: CylinderProps) {
  return (
    <mesh
      position={position}
      scale={[scale[0], 1, scale[1]]}
      material={material}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={[radius, radius, height, 32]} />
    </mesh>
  );
}
