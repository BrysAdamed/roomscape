import { Box } from './Box';
import { Cylinder } from './Cylinder';
import { Recess } from './Recess';
import { defineFurniture, type FurnitureRenderProps } from './types';

type ToiletSlots = 'ceramic';

function Toilet({ materials }: FurnitureRenderProps<never, ToiletSlots>) {
  return (
    <group>
      <Box size={[0.36, 0.38, 0.12]} position={[0, 0.6, -0.24]} material={materials.ceramic} />
      <Cylinder
        radius={0.17}
        height={0.38}
        position={[0, 0.19, 0.03]}
        scale={[1, 1.25]}
        material={materials.ceramic}
      />
      <Cylinder
        radius={0.18}
        height={0.02}
        position={[0, 0.39, 0.03]}
        scale={[1, 1.25]}
        material={materials.ceramic}
      />
    </group>
  );
}

export const toilet = defineFurniture<never, ToiletSlots>({
  id: 'toilet',
  name: 'Toilet',
  params: {},
  slots: { ceramic: { label: 'Ceramic', categories: ['ceramic'], default: 'ceramic-white' } },
  size: () => [0.38, 0.6, 0.8],
  Component: Toilet,
});

type BasinParams = 'width' | 'depth' | 'height';
type BasinSlots = 'cabinet' | 'basin' | 'tap';

function Washbasin({ params, materials }: FurnitureRenderProps<BasinParams, BasinSlots>) {
  const { width, depth, height } = params;
  const cabinetHeight = 0.5;
  return (
    <group>
      <Box
        size={[width, cabinetHeight, depth - 0.02]}
        position={[0, height - 0.12 - cabinetHeight / 2, -0.01]}
        material={materials.cabinet}
      />
      <Recess
        slab={[width, depth, 0.12]}
        opening={[width * 0.72, depth * 0.62]}
        offset={[0, depth * 0.08]}
        depth={0.11}
        shape="oval"
        position={[0, height, 0]}
        slabMaterial={materials.basin}
        bowlMaterial={materials.basin}
      />
      <Box
        size={[0.03, 0.18, 0.03]}
        position={[0, height + 0.09, -depth / 2 + 0.06]}
        material={materials.tap}
      />
      <Box
        size={[0.03, 0.03, 0.12]}
        position={[0, height + 0.17, -depth / 2 + 0.11]}
        material={materials.tap}
      />
    </group>
  );
}

export const washbasin = defineFurniture<BasinParams, BasinSlots>({
  id: 'washbasin',
  name: 'Washbasin',
  params: { width: 0.6, depth: 0.46, height: 0.85 },
  slots: {
    cabinet: { label: 'Cabinet', categories: ['wood'], default: 'wood-oak-natural' },
    basin: { label: 'Basin', categories: ['ceramic', 'stone'], default: 'ceramic-white' },
    tap: { label: 'Tap', categories: ['metal'], default: 'metal-brushed-steel' },
  },
  size: ({ width, depth, height }) => [width, depth, height + 0.2],
  Component: Washbasin,
});

type TubParams = 'width' | 'depth' | 'height';
type TubSlots = 'tub';

/** Bathtub; `width` is its length along x. */
function Bathtub({ params, materials }: FurnitureRenderProps<TubParams, TubSlots>) {
  const { width, depth, height } = params;
  const rim = 0.06;
  return (
    <group>
      <Box
        size={[width, height - 0.25, depth]}
        position={[0, (height - 0.25) / 2, 0]}
        material={materials.tub}
      />
      <Box
        size={[width, 0.25, rim]}
        position={[0, height - 0.125, depth / 2 - rim / 2]}
        material={materials.tub}
      />
      <Box
        size={[width, 0.25, rim]}
        position={[0, height - 0.125, -depth / 2 + rim / 2]}
        material={materials.tub}
      />
      <Box
        size={[rim, 0.25, depth - 2 * rim]}
        position={[width / 2 - rim / 2, height - 0.125, 0]}
        material={materials.tub}
      />
      <Box
        size={[rim, 0.25, depth - 2 * rim]}
        position={[-width / 2 + rim / 2, height - 0.125, 0]}
        material={materials.tub}
      />
    </group>
  );
}

export const bathtub = defineFurniture<TubParams, TubSlots>({
  id: 'bathtub',
  name: 'Bathtub',
  params: { width: 1.7, depth: 0.75, height: 0.58 },
  slots: { tub: { label: 'Tub', categories: ['ceramic'], default: 'ceramic-white' } },
  size: ({ width, depth, height }) => [width, depth, height],
  Component: Bathtub,
});

type ShowerParams = 'width' | 'depth' | 'height';
type ShowerSlots = 'tray' | 'glass' | 'frame';

function Shower({ params, materials }: FurnitureRenderProps<ShowerParams, ShowerSlots>) {
  const { width, depth, height } = params;
  const tray = 0.05;
  return (
    <group>
      <Box size={[width, tray, depth]} position={[0, tray / 2, 0]} material={materials.tray} />
      <Box
        size={[width, height - tray, 0.008]}
        position={[0, tray + (height - tray) / 2, depth / 2 - 0.004]}
        material={materials.glass}
      />
      <Box
        size={[width, 0.02, 0.02]}
        position={[0, height, depth / 2 - 0.01]}
        material={materials.frame}
      />
      <Box
        size={[0.025, 0.025, 0.025]}
        position={[0, height - 0.1, -depth / 2 + 0.05]}
        material={materials.frame}
      />
    </group>
  );
}

export const shower = defineFurniture<ShowerParams, ShowerSlots>({
  id: 'shower',
  name: 'Shower',
  params: { width: 0.9, depth: 0.9, height: 2.0 },
  slots: {
    tray: { label: 'Tray', categories: ['ceramic', 'stone'], default: 'ceramic-white' },
    glass: { label: 'Screen', categories: ['glass'], default: 'glass-clear' },
    frame: { label: 'Fittings', categories: ['metal'], default: 'metal-brushed-steel' },
  },
  size: ({ width, depth, height }) => [width, depth, height],
  Component: Shower,
});

type WasherSlots = 'body' | 'door';

function WashingMachine({ materials }: FurnitureRenderProps<never, WasherSlots>) {
  return (
    <group>
      <Box size={[0.6, 0.85, 0.58]} position={[0, 0.425, 0]} material={materials.body} />
      <mesh position={[0, 0.42, 0.291]} rotation-x={Math.PI / 2} material={materials.door}>
        <cylinderGeometry args={[0.16, 0.16, 0.01, 32]} />
      </mesh>
    </group>
  );
}

export const washingMachine = defineFurniture<never, WasherSlots>({
  id: 'washing-machine',
  name: 'Washing machine',
  params: {},
  slots: {
    body: { label: 'Body', categories: ['paint', 'metal'], default: 'paint-white' },
    door: { label: 'Door', categories: ['glass'], default: 'glass-black' },
  },
  size: () => [0.6, 0.58, 0.85],
  Component: WashingMachine,
});
