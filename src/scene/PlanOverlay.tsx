import { useLoader } from '@react-three/fiber';
import { SRGBColorSpace, TextureLoader } from 'three';
import type { PlanImage } from '../schema/apartment';

const LIFT = 0.006;

/** The source floor plan laid on the floor, for checking the model against the drawing. */
export function PlanOverlay({ image }: { image: PlanImage }) {
  const texture = useLoader(TextureLoader, image.src);
  const [x0, y0, x1, y1] = image.bounds;

  return (
    <mesh
      position={[(x0 + x1) / 2, LIFT, (y0 + y1) / 2]}
      rotation-x={-Math.PI / 2}
      raycast={() => {}}
    >
      <planeGeometry args={[x1 - x0, y1 - y0]} />
      <meshBasicMaterial
        map={texture}
        map-colorSpace={SRGBColorSpace}
        transparent
        opacity={0.9}
        toneMapped={false}
      />
    </mesh>
  );
}
