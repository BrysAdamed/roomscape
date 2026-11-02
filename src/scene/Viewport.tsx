import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { useApartmentStore } from '../state/apartmentStore';
import { ApartmentView } from './ApartmentView';
import { CameraRig } from './camera/CameraRig';
import { HeadingTracker } from './camera/HeadingTracker';
import { frameApartment } from './camera/framing';
import { AmbientOcclusion } from './lighting/AmbientOcclusion';
import { Lighting } from './lighting/Lighting';
import { DimensionOverlay } from './measure/DimensionOverlay';
import { FurnitureLabels } from './measure/FurnitureLabels';
import { Ruler } from './measure/Ruler';
import { SelectionHighlight } from './selection/SelectionHighlight';

export function Viewport() {
  const apartment = useApartmentStore((state) => state.apartment);
  const select = useApartmentStore((state) => state.select);
  const base = useApartmentStore((state) => state.base);
  const framing = useMemo(() => frameApartment(base), [base]);

  return (
    <Canvas
      camera={{ position: framing.position, fov: 50, near: 0.05 }}
      shadows="percentage"
      onPointerMissed={(event) => {
        if (event.type === 'click') {
          select(undefined);
        }
      }}
    >
      <Lighting />
      {apartment && <ApartmentView apartment={apartment} />}
      <SelectionHighlight />
      <DimensionOverlay />
      <FurnitureLabels />
      <Ruler />
      <CameraRig framing={framing} />
      <HeadingTracker />
      <AmbientOcclusion />
    </Canvas>
  );
}
