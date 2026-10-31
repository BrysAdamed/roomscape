import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import { useApartmentStore } from '../state/apartmentStore';
import { ApartmentView } from './ApartmentView';
import { CameraRig } from './camera/CameraRig';
import { frameApartment } from './camera/framing';
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
      <hemisphereLight args={['#ffffff', '#8a8378', 0.9]} />
      <directionalLight
        position={[6, 12, 8]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0005}
      />
      <Grid
        position={[0, -0.002, 0]}
        args={[20, 20]}
        cellSize={0.5}
        sectionSize={1}
        cellColor="#9a958c"
        sectionColor="#6b665e"
        fadeDistance={30}
        infiniteGrid
      />
      {apartment && <ApartmentView apartment={apartment} />}
      <SelectionHighlight />
      <CameraRig framing={framing} />
    </Canvas>
  );
}
