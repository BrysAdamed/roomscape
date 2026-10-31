import { Canvas } from '@react-three/fiber';
import { Grid, OrbitControls } from '@react-three/drei';

export function Viewport() {
  return (
    <Canvas camera={{ position: [6, 6, 6], fov: 50 }} shadows>
      <hemisphereLight args={['#ffffff', '#8a8378', 0.8]} />
      <directionalLight position={[5, 10, 4]} intensity={1.2} castShadow />
      <Grid
        args={[20, 20]}
        cellSize={0.5}
        sectionSize={1}
        cellColor="#9a958c"
        sectionColor="#6b665e"
        fadeDistance={30}
        infiniteGrid
      />
      <OrbitControls makeDefault maxPolarAngle={Math.PI / 2 - 0.05} />
    </Canvas>
  );
}
