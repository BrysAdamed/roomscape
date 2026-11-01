import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { useApartmentStore } from '../state/apartmentStore';
import { ApartmentView } from './ApartmentView';
import { CameraRig } from './camera/CameraRig';
import { frameApartment } from './camera/framing';
import { AmbientOcclusion } from './lighting/AmbientOcclusion';
import { Lighting } from './lighting/Lighting';
import { DimensionOverlay } from './measure/DimensionOverlay';
import { Ruler } from './measure/Ruler';
import { SelectionHighlight } from './selection/SelectionHighlight';

export function Viewport() {
  const apartment = useApartmentStore((state) => state.apartment);
  const select = useApartmentStore((state) => state.select);
  const source = useApartmentStore((state) => state.source);
  const framing = useMemo(() => frameApartment(source), [source]);

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
      <Ruler />
      <CameraRig framing={framing} />
      <AmbientOcclusion />
    </Canvas>
  );
}
