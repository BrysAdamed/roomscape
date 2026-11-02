import { doubleSided } from '../../scene/materials';
import { Cylinder } from './Cylinder';
import { defineFurniture, type FurnitureRenderProps } from './types';

type LampParams = 'diameter' | 'shadeHeight' | 'drop';
type LampSlots = 'shade' | 'cord' | 'bulb';

const CORD = 0.006;
const CANOPY = { radius: 0.05, height: 0.03 };

/** Pendant lamp; `elevation` is the bottom of the shade, `drop` the cord length up to the ceiling. */
function PendantLamp({ params, materials }: FurnitureRenderProps<LampParams, LampSlots>) {
  const { diameter, shadeHeight, drop } = params;
  const radius = diameter / 2;
  return (
    <group>
      <mesh
        position={[0, shadeHeight / 2, 0]}
        material={doubleSided(materials.shade)}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[radius * 0.45, radius, shadeHeight, 32, 1, true]} />
      </mesh>
      <mesh position={[0, shadeHeight * 0.35, 0]} material={materials.bulb}>
        <sphereGeometry args={[Math.min(0.05, radius * 0.4), 16, 12]} />
      </mesh>
      <Cylinder
        radius={CORD}
        height={drop}
        position={[0, shadeHeight + drop / 2, 0]}
        material={materials.cord}
      />
      <Cylinder
        radius={CANOPY.radius}
        height={CANOPY.height}
        position={[0, shadeHeight + drop - CANOPY.height / 2, 0]}
        material={materials.cord}
      />
    </group>
  );
}

export const pendantLamp = defineFurniture<LampParams, LampSlots>({
  id: 'pendant-lamp',
  name: 'Pendant lamp',
  params: { diameter: 0.38, shadeHeight: 0.22, drop: 0.5 },
  slots: {
    shade: { label: 'Shade', categories: ['metal', 'fabric', 'paint'], default: 'metal-black' },
    cord: { label: 'Cord', categories: ['metal'], default: 'metal-black' },
    bulb: { label: 'Bulb', categories: ['glass'], default: 'glass-warm-light' },
  },
  size: ({ diameter, shadeHeight, drop }) => [diameter, diameter, shadeHeight + drop],
  Component: PendantLamp,
});
