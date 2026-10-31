import { Box } from './Box';
import { defineFurniture, type FurnitureRenderProps } from './types';

type Params = 'width' | 'depth' | 'seatHeight' | 'height';
type Slots = 'seat' | 'frame';

const SEAT_THICKNESS = 0.06;
const BACK_THICKNESS = 0.04;
const LEG = 0.03;

function Chair({ params, materials }: FurnitureRenderProps<Params, Slots>) {
  const { width, depth, seatHeight, height } = params;
  const legHeight = seatHeight - SEAT_THICKNESS;
  const backHeight = height - seatHeight;
  const legX = width / 2 - LEG;
  const legZ = depth / 2 - LEG;
  const legs: [number, number][] = [
    [-legX, -legZ],
    [legX, -legZ],
    [-legX, legZ],
    [legX, legZ],
  ];

  return (
    <group>
      <Box
        size={[width, SEAT_THICKNESS, depth]}
        position={[0, seatHeight - SEAT_THICKNESS / 2, 0]}
        material={materials.seat}
      />
      <Box
        size={[width, backHeight, BACK_THICKNESS]}
        position={[0, seatHeight + backHeight / 2, -depth / 2 + BACK_THICKNESS / 2]}
        material={materials.seat}
      />
      {legs.map(([x, z]) => (
        <Box
          key={`${x}:${z}`}
          size={[LEG, legHeight, LEG]}
          position={[x, legHeight / 2, z]}
          material={materials.frame}
        />
      ))}
    </group>
  );
}

export const chair = defineFurniture<Params, Slots>({
  id: 'chair',
  name: 'Chair',
  params: { width: 0.45, depth: 0.5, seatHeight: 0.46, height: 0.85 },
  slots: {
    seat: { label: 'Seat', categories: ['fabric', 'wood'], default: 'fabric-charcoal' },
    frame: { label: 'Frame', categories: ['metal', 'wood'], default: 'metal-black' },
  },
  Component: Chair,
});
