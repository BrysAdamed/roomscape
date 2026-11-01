import { Box } from './Box';
import { defineFurniture, type FurnitureRenderProps } from './types';

type Params = 'width' | 'depth' | 'height' | 'doors';
type Slots = 'body' | 'doors' | 'handles';

const PLINTH = 0.08;
const DOOR_THICKNESS = 0.02;
const DOOR_GAP = 0.004;
const HANDLE = { width: 0.02, height: 0.3, depth: 0.025 };

function Wardrobe({ params, materials }: FurnitureRenderProps<Params, Slots>) {
  const { width, depth, height } = params;
  const doorCount = Math.max(1, Math.round(params.doors));
  const bodyDepth = depth - DOOR_THICKNESS;
  const doorWidth = width / doorCount;
  const doorHeight = height - PLINTH;
  const doorZ = depth / 2 - DOOR_THICKNESS / 2;

  return (
    <group>
      <Box
        size={[width, height, bodyDepth]}
        position={[0, height / 2, -DOOR_THICKNESS / 2]}
        material={materials.body}
      />
      {Array.from({ length: doorCount }, (_, index) => {
        const doorX = -width / 2 + doorWidth * (index + 0.5);
        const handleSide = index % 2 === 0 ? 1 : -1;
        return (
          <group key={index} position={[doorX, PLINTH + doorHeight / 2, doorZ]}>
            <Box
              size={[doorWidth - DOOR_GAP, doorHeight - DOOR_GAP, DOOR_THICKNESS]}
              position={[0, 0, 0]}
              material={materials.doors}
            />
            <Box
              size={[HANDLE.width, HANDLE.height, HANDLE.depth]}
              position={[
                handleSide * (doorWidth / 2 - 0.06),
                0,
                DOOR_THICKNESS / 2 + HANDLE.depth / 2,
              ]}
              material={materials.handles}
            />
          </group>
        );
      })}
    </group>
  );
}

export const wardrobe = defineFurniture<Params, Slots>({
  id: 'wardrobe',
  name: 'Wardrobe',
  params: { width: 1.5, depth: 0.6, height: 2.2, doors: 2 },
  slots: {
    body: { label: 'Body', categories: ['wood'], default: 'wood-white-lacquer' },
    doors: { label: 'Doors', categories: ['wood', 'glass'], default: 'wood-white-lacquer' },
    handles: { label: 'Handles', categories: ['metal'], default: 'metal-brushed-steel' },
  },
  size: ({ width, depth, height }) => [width, depth, height],
  Component: Wardrobe,
});
