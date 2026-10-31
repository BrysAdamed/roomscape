import { Canvas } from '@react-three/fiber';
import { Grid, OrbitControls } from '@react-three/drei';
import type { Apartment } from '../schema/apartment';
import { ApartmentView } from './ApartmentView';

export function Viewport({ apartment }: { apartment?: Apartment }) {
  return (
    <Canvas camera={{ position: [7, 8, 9], fov: 50 }} shadows>
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
      <OrbitControls makeDefault target={[2.9, 0, 1.2]} maxPolarAngle={Math.PI / 2 - 0.05} />
    </Canvas>
  );
}
