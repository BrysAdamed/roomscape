import { Box } from './Box';
import { defineFurniture, type FurnitureRenderProps } from './types';

type Params = 'width' | 'length' | 'height';
type Slots = 'frame' | 'bedding';

const FRAME_HEIGHT = 0.25;
const HEADBOARD_THICKNESS = 0.06;
const HEADBOARD_HEIGHT = 0.9;

function Bed({ params, materials }: FurnitureRenderProps<Params, Slots>) {
  const { width, length, height } = params;
  const mattressHeight = height - FRAME_HEIGHT;
  const mattressLength = length - HEADBOARD_THICKNESS;
  const pillowDepth = Math.min(0.4, length * 0.2);
  const head = -length / 2 + HEADBOARD_THICKNESS;

  return (
    <group>
      <Box
        size={[width, FRAME_HEIGHT, length]}
        position={[0, FRAME_HEIGHT / 2, 0]}
        material={materials.frame}
      />
      <Box
        size={[width, HEADBOARD_HEIGHT, HEADBOARD_THICKNESS]}
        position={[0, HEADBOARD_HEIGHT / 2, -length / 2 + HEADBOARD_THICKNESS / 2]}
        material={materials.frame}
      />
      <Box
        size={[width - 0.04, mattressHeight, mattressLength - 0.02]}
        position={[0, FRAME_HEIGHT + mattressHeight / 2, head + mattressLength / 2]}
        material={materials.bedding}
      />
      <Box
        size={[width - 0.2, 0.1, pillowDepth - 0.08]}
        position={[0, height + 0.05, head + pillowDepth / 2]}
        material={materials.bedding}
      />
    </group>
  );
}

export const bed = defineFurniture<Params, Slots>({
  id: 'bed',
  name: 'Bed',
  params: { width: 1.6, length: 2.0, height: 0.5 },
  slots: {
    frame: { label: 'Frame', categories: ['wood', 'fabric', 'metal'], default: 'wood-oak-natural' },
    bedding: { label: 'Bedding', categories: ['fabric'], default: 'fabric-linen' },
  },
  size: ({ width, length, height }) => [width, length, Math.max(height + 0.1, HEADBOARD_HEIGHT)],
  Component: Bed,
});
