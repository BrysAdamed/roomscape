import { Box } from './Box';
import { defineFurniture, type FurnitureRenderProps } from './types';

type CounterParams = 'width' | 'depth' | 'height' | 'sinkOffset' | 'hobOffset';
type CounterSlots = 'body' | 'fronts' | 'top' | 'sink' | 'hob';

const TOP = 0.04;
const PLINTH = 0.1;
const FRONT = 0.02;
const GAP = 0.004;
const UNIT = 0.6;
const SINK = { width: 0.5, depth: 0.4 };
const HOB = { width: 0.58, depth: 0.5 };

/** Base cabinets with a worktop; `sinkOffset` / `hobOffset` are metres from the left end to the fitting's centre, negative for none. */
function KitchenCounter({ params, materials }: FurnitureRenderProps<CounterParams, CounterSlots>) {
  const { width, depth, height, sinkOffset, hobOffset } = params;
  const bodyHeight = height - TOP;
  const units = Math.max(1, Math.round(width / UNIT));
  const unitWidth = width / units;
  const frontZ = depth / 2 - FRONT / 2;

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
      <Box
        size={[width, TOP, depth + 0.02]}
        position={[0, height - TOP / 2, 0.01]}
        material={materials.top}
      />
      {sinkOffset >= 0 && (
        <Box
          size={[SINK.width, 0.005, SINK.depth]}
          position={[-width / 2 + sinkOffset, height + 0.001, 0]}
          material={materials.sink}
        />
      )}
      {hobOffset >= 0 && (
        <Box
          size={[HOB.width, 0.006, HOB.depth]}
          position={[-width / 2 + hobOffset, height + 0.002, 0]}
          material={materials.hob}
        />
      )}
    </group>
  );
}

export const kitchenCounter = defineFurniture<CounterParams, CounterSlots>({
  id: 'kitchen-counter',
  name: 'Kitchen counter',
  params: { width: 1.8, depth: 0.6, height: 0.9, sinkOffset: -1, hobOffset: -1 },
  slots: {
    body: { label: 'Carcass', categories: ['wood'], default: 'wood-white-lacquer' },
    fronts: { label: 'Fronts', categories: ['wood', 'paint'], default: 'wood-white-lacquer' },
    top: { label: 'Worktop', categories: ['wood', 'stone', 'tile'], default: 'wood-oak-natural' },
    sink: { label: 'Sink', categories: ['metal', 'ceramic'], default: 'metal-brushed-steel' },
    hob: { label: 'Hob', categories: ['glass'], default: 'glass-black' },
  },
  size: ({ width, depth, height }) => [width, depth, height],
  Component: KitchenCounter,
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
