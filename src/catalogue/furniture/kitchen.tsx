import { Box } from './Box';
import { Cylinder } from './Cylinder';
import { Recess } from './Recess';
import { defineFurniture, type FurnitureRenderProps } from './types';

type CounterParams = 'width' | 'depth' | 'height' | 'sinkOffset' | 'hobOffset';
type CounterSlots = 'body' | 'fronts' | 'top' | 'sink' | 'hob';

const TOP = 0.04;
const PLINTH = 0.1;
const FRONT = 0.02;
const GAP = 0.004;
const UNIT = 0.6;
const SINK = { width: 0.5, depth: 0.4, depth3d: 0.18 };
const HOB = { width: 0.58, depth: 0.5, zone: 0.09 };
const FITTING_MARGIN = 0.3;

/** Base cabinets with a worktop; `sinkOffset` / `hobOffset` are metres from the left end to the fitting's centre, negative for none. */
function KitchenCounter({ params, materials }: FurnitureRenderProps<CounterParams, CounterSlots>) {
  const { width, depth, height, sinkOffset, hobOffset } = params;
  const bodyHeight = height - TOP;
  const units = Math.max(1, Math.round(width / UNIT));
  const unitWidth = width / units;
  const frontZ = depth / 2 - FRONT / 2;
  const topDepth = depth + 0.02;
  const sinkX = -width / 2 + sinkOffset;
  const hobX = -width / 2 + hobOffset;

  return (
    <group>
      <Box
        size={[width, bodyHeight, depth - FRONT]}
        position={[0, bodyHeight / 2, -FRONT / 2]}
        material={materials.body}
      />
      {Array.from({ length: units }, (_, index) => (
        <Box
          key={index}
          size={[unitWidth - GAP, bodyHeight - PLINTH - GAP, FRONT]}
          position={[
            -width / 2 + unitWidth * (index + 0.5),
            PLINTH + (bodyHeight - PLINTH) / 2,
            frontZ,
          ]}
          material={materials.fronts}
        />
      ))}
      {sinkOffset >= 0 ? (
        <>
          <Recess
            slab={[width, topDepth, TOP]}
            opening={[SINK.width, SINK.depth]}
            offset={[sinkX, 0.01]}
            depth={SINK.depth3d}
            shape="rect"
            position={[0, height, 0.01]}
            slabMaterial={materials.top}
            bowlMaterial={materials.sink}
          />
          <Tap x={sinkX} z={-depth / 2 + 0.06} height={height} material={materials.sink} />
        </>
      ) : (
        <Box
          size={[width, TOP, topDepth]}
          position={[0, height - TOP / 2, 0.01]}
          material={materials.top}
        />
      )}
      {hobOffset >= 0 && (
        <group position={[hobX, height, 0.01]}>
          <Box
            size={[HOB.width, 0.006, HOB.depth]}
            position={[0, 0.003, 0]}
            material={materials.hob}
          />
          {[
            [-0.14, -0.11],
            [0.14, -0.11],
            [-0.14, 0.11],
            [0.14, 0.11],
          ].map(([x, z], index) => (
            <Cylinder
              key={index}
              radius={index === 1 ? HOB.zone * 1.25 : HOB.zone}
              height={0.002}
              position={[x!, 0.0065, z!]}
              material={materials.sink}
            />
          ))}
        </group>
      )}
    </group>
  );
}

function Tap({
  x,
  z,
  height,
  material,
}: {
  x: number;
  z: number;
  height: number;
  material: FurnitureRenderProps['materials'][string];
}) {
  return (
    <group position={[x, height, z]}>
      <Cylinder radius={0.02} height={0.06} position={[0, 0.03, 0]} material={material} />
      <Cylinder radius={0.012} height={0.3} position={[0, 0.2, 0]} material={material} />
      <Box size={[0.024, 0.024, 0.2]} position={[0, 0.35, 0.09]} material={material} />
    </group>
  );
}

const fittingRange = ({ width }: Readonly<Record<CounterParams, number>>) =>
  Math.max(FITTING_MARGIN, width - FITTING_MARGIN);

export const kitchenCounter = defineFurniture<CounterParams, CounterSlots>({
  id: 'kitchen-counter',
  name: 'Kitchen counter',
  params: { width: 1.8, depth: 0.6, height: 0.9, sinkOffset: -1, hobOffset: -1 },
  slots: {
    body: { label: 'Carcass', categories: ['wood'], default: 'wood-white-lacquer' },
    fronts: { label: 'Fronts', categories: ['wood', 'paint'], default: 'wood-white-lacquer' },
    top: { label: 'Worktop', categories: ['wood', 'stone', 'tile'], default: 'wood-oak-natural' },
    sink: {
      label: 'Sink and tap',
      categories: ['metal', 'ceramic'],
      default: 'metal-brushed-steel',
    },
    hob: { label: 'Hob', categories: ['glass'], default: 'glass-black' },
  },
  controls: [
    {
      param: 'sinkOffset',
      label: 'Sink',
      min: FITTING_MARGIN,
      max: fittingRange,
      step: 0.01,
      optional: true,
    },
    {
      param: 'hobOffset',
      label: 'Induction hob',
      min: FITTING_MARGIN,
      max: fittingRange,
      step: 0.01,
      optional: true,
    },
  ],
  size: ({ width, depth, height }) => [width, depth, height],
  Component: KitchenCounter,
});

type WallCabinetParams = 'width' | 'depth' | 'height';
type WallCabinetSlots = 'body' | 'fronts' | 'handles';

/** Suspended cabinets; place them with the item's `elevation` (bottom edge above the floor). */
function WallCabinet({
  params,
  materials,
}: FurnitureRenderProps<WallCabinetParams, WallCabinetSlots>) {
  const { width, depth, height } = params;
  const doors = Math.max(1, Math.round(width / 0.4));
  const doorWidth = width / doors;
  return (
    <group>
      <Box
        size={[width, height, depth - FRONT]}
        position={[0, height / 2, -FRONT / 2]}
        material={materials.body}
      />
      {Array.from({ length: doors }, (_, index) => {
        const x = -width / 2 + doorWidth * (index + 0.5);
        return (
          <group key={index}>
            <Box
              size={[doorWidth - GAP, height - GAP, FRONT]}
              position={[x, height / 2, depth / 2 - FRONT / 2]}
              material={materials.fronts}
            />
            <Box
              size={[0.12, 0.012, 0.02]}
              position={[x, 0.04, depth / 2 + 0.01]}
              material={materials.handles}
            />
          </group>
        );
      })}
    </group>
  );
}

export const wallCabinet = defineFurniture<WallCabinetParams, WallCabinetSlots>({
  id: 'wall-cabinet',
  name: 'Wall cabinet',
  params: { width: 0.8, depth: 0.35, height: 0.72 },
  slots: {
    body: { label: 'Carcass', categories: ['wood'], default: 'wood-white-lacquer' },
    fronts: {
      label: 'Fronts',
      categories: ['wood', 'paint', 'glass'],
      default: 'wood-white-lacquer',
    },
    handles: { label: 'Handles', categories: ['metal'], default: 'metal-brushed-steel' },
  },
  size: ({ width, depth, height }) => [width, depth, height],
  Component: WallCabinet,
});

type HoodParams = 'width' | 'depth' | 'chimney';
type HoodSlots = 'body';

const CANOPY = 0.08;

/** Chimney cooker hood; `elevation` is the canopy's bottom edge, `chimney` its height above the canopy. */
function CookerHood({ params, materials }: FurnitureRenderProps<HoodParams, HoodSlots>) {
  const { width, depth, chimney } = params;
  return (
    <group>
      <Box size={[width, CANOPY, depth]} position={[0, CANOPY / 2, 0]} material={materials.body} />
      <Box
        size={[0.26, chimney, 0.24]}
        position={[0, CANOPY + chimney / 2, -depth / 2 + 0.12]}
        material={materials.body}
      />
    </group>
  );
}

export const cookerHood = defineFurniture<HoodParams, HoodSlots>({
  id: 'cooker-hood',
  name: 'Cooker hood',
  params: { width: 0.6, depth: 0.5, chimney: 0.6 },
  slots: {
    body: {
      label: 'Body',
      categories: ['metal', 'glass', 'paint'],
      default: 'metal-brushed-steel',
    },
  },
  size: ({ width, depth, chimney }) => [width, depth, CANOPY + chimney],
  Component: CookerHood,
});

type FridgeParams = 'width' | 'depth' | 'height';
type FridgeSlots = 'body' | 'handle';

function Fridge({ params, materials }: FurnitureRenderProps<FridgeParams, FridgeSlots>) {
  const { width, depth, height } = params;
  const freezer = Math.min(0.7, height * 0.35);
  return (
    <group>
      <Box size={[width, height, depth]} position={[0, height / 2, 0]} material={materials.body} />
      <Box
        size={[width - 0.01, 0.006, 0.004]}
        position={[0, freezer, depth / 2 + 0.002]}
        material={materials.handle}
      />
      <Box
        size={[0.02, 0.3, 0.03]}
        position={[width / 2 - 0.06, freezer + 0.25, depth / 2 + 0.015]}
        material={materials.handle}
      />
      <Box
        size={[0.02, 0.2, 0.03]}
        position={[width / 2 - 0.06, freezer - 0.15, depth / 2 + 0.015]}
        material={materials.handle}
      />
    </group>
  );
}

export const fridge = defineFurniture<FridgeParams, FridgeSlots>({
  id: 'fridge',
  name: 'Fridge',
  params: { width: 0.6, depth: 0.65, height: 1.85 },
  slots: {
    body: { label: 'Body', categories: ['metal', 'paint', 'wood'], default: 'metal-brushed-steel' },
    handle: { label: 'Handles', categories: ['metal'], default: 'metal-black' },
  },
  size: ({ width, depth, height }) => [width, depth, height],
  Component: Fridge,
});
