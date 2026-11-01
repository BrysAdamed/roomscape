import { Box } from './Box';
import { defineFurniture, type FurnitureRenderProps } from './types';

type SofaParams = 'width' | 'depth' | 'height' | 'chaise';
type SofaSlots = 'upholstery' | 'legs';

const SEAT_HEIGHT = 0.42;
const BACK = 0.2;
const ARM = 0.16;
const LEG = 0.06;

/** Sofa with an optional chaise on the left: `chaise` is the chaise's total depth (0 for a straight sofa). */
function Sofa({ params, materials }: FurnitureRenderProps<SofaParams, SofaSlots>) {
  const { width, depth, height, chaise } = params;
  const seatDepth = depth - BACK;
  const chaiseDepth = Math.max(chaise, depth);
  const base = SEAT_HEIGHT - 0.12;
  const chaiseWidth = Math.min(0.9, width / 2);

  return (
    <group>
      <Box
        size={[width, base - LEG, depth]}
        position={[0, LEG + (base - LEG) / 2, 0]}
        material={materials.upholstery}
      />
      <Box
        size={[width - 2 * ARM, 0.12, seatDepth]}
        position={[0, base + 0.06, BACK / 2]}
        material={materials.upholstery}
      />
      <Box
        size={[width, height - LEG, BACK]}
        position={[0, LEG + (height - LEG) / 2, -depth / 2 + BACK / 2]}
        material={materials.upholstery}
      />
      <Box
        size={[ARM, 0.62 - LEG, depth]}
        position={[width / 2 - ARM / 2, LEG + (0.62 - LEG) / 2, 0]}
        material={materials.upholstery}
      />
      {chaise > depth ? (
        <Box
          size={[chaiseWidth, SEAT_HEIGHT - LEG, chaiseDepth - depth]}
          position={[
            -width / 2 + chaiseWidth / 2,
            LEG + (SEAT_HEIGHT - LEG) / 2,
            depth / 2 + (chaiseDepth - depth) / 2,
          ]}
          material={materials.upholstery}
        />
      ) : (
        <Box
          size={[ARM, 0.62 - LEG, depth]}
          position={[-width / 2 + ARM / 2, LEG + (0.62 - LEG) / 2, 0]}
          material={materials.upholstery}
        />
      )}
      {[-1, 1].map((side) => (
        <Box
          key={side}
          size={[width - 0.1, LEG, 0.04]}
          position={[0, LEG / 2, side * (depth / 2 - 0.08)]}
          material={materials.legs}
        />
      ))}
    </group>
  );
}

export const sofa = defineFurniture<SofaParams, SofaSlots>({
  id: 'sofa',
  name: 'Sofa',
  params: { width: 2.2, depth: 0.95, height: 0.8, chaise: 0 },
  slots: {
    upholstery: { label: 'Upholstery', categories: ['fabric'], default: 'fabric-charcoal' },
    legs: { label: 'Legs', categories: ['metal', 'wood'], default: 'metal-black' },
  },
  size: ({ width, depth, height, chaise }) => [width, Math.max(depth, chaise), height],
  Component: Sofa,
});

type TvParams = 'width' | 'depth' | 'height' | 'screen';
type TvSlots = 'body' | 'screen';

/** Low media cabinet with a TV of `screen` inches standing on it (0 for none). */
function TvUnit({ params, materials }: FurnitureRenderProps<TvParams, TvSlots>) {
  const { width, depth, height, screen } = params;
  const diagonal = screen * 0.0254;
  const screenWidth = diagonal * 0.87;
  const screenHeight = diagonal * 0.49;
  return (
    <group>
      <Box
        size={[width, height - 0.06, depth]}
        position={[0, 0.06 + (height - 0.06) / 2, 0]}
        material={materials.body}
      />
      {screen > 0 && (
        <>
          <Box
            size={[0.25, 0.02, 0.18]}
            position={[0, height + 0.01, -0.02]}
            material={materials.screen}
          />
          <Box
            size={[0.04, 0.12, 0.04]}
            position={[0, height + 0.07, -0.04]}
            material={materials.screen}
          />
          <Box
            size={[screenWidth, screenHeight, 0.03]}
            position={[0, height + 0.1 + screenHeight / 2, -0.04]}
            material={materials.screen}
          />
        </>
      )}
    </group>
  );
}

export const tvUnit = defineFurniture<TvParams, TvSlots>({
  id: 'tv-unit',
  name: 'TV unit',
  params: { width: 1.6, depth: 0.4, height: 0.45, screen: 55 },
  slots: {
    body: { label: 'Cabinet', categories: ['wood'], default: 'wood-walnut' },
    screen: { label: 'TV', categories: ['glass', 'metal'], default: 'glass-black' },
  },
  size: ({ width, depth, height, screen }) => [
    width,
    depth,
    height + (screen > 0 ? 0.1 + screen * 0.0254 * 0.49 : 0),
  ],
  Component: TvUnit,
});
