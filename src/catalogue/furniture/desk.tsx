import { Box } from './Box';
import { defineFurniture, type FurnitureRenderProps } from './types';

type Params = 'width' | 'depth' | 'height';
type Slots = 'top' | 'legs';

const TOP_THICKNESS = 0.03;
const LEG = 0.04;
const LEG_INSET = 0.04;

function Desk({ params, materials }: FurnitureRenderProps<Params, Slots>) {
  const { width, depth, height } = params;
  const legHeight = height - TOP_THICKNESS;
  const legX = width / 2 - LEG_INSET - LEG / 2;
  const legZ = depth / 2 - LEG_INSET - LEG / 2;
  const legs: [number, number][] = [
    [-legX, -legZ],
    [legX, -legZ],
    [-legX, legZ],
    [legX, legZ],
  ];

  return (
    <group>
      <Box
        size={[width, TOP_THICKNESS, depth]}
        position={[0, height - TOP_THICKNESS / 2, 0]}
        material={materials.top}
      />
      {legs.map(([x, z]) => (
        <Box
          key={`${x}:${z}`}
          size={[LEG, legHeight, LEG]}
          position={[x, legHeight / 2, z]}
          material={materials.legs}
        />
      ))}
    </group>
  );
}

export const desk = defineFurniture<Params, Slots>({
  id: 'desk',
  name: 'Desk',
  params: { width: 1.2, depth: 0.6, height: 0.75 },
  slots: {
    top: { label: 'Top', categories: ['wood', 'stone'], default: 'wood-oak-light' },
    legs: { label: 'Legs', categories: ['metal', 'wood'], default: 'metal-black' },
  },
  size: ({ width, depth, height }) => [width, depth, height],
  Component: Desk,
});
