import { Environment, Lightformer } from '@react-three/drei';

const SKY = '#dfe4e8';
const GROUND = '#c9c6bd';
const SUN = '#fff1dc';

export function Lighting() {
  return (
    <>
      <color attach="background" args={[SKY]} />
      <Environment resolution={256} frames={1} environmentIntensity={0.45}>
        <Lightformer
          form="rect"
          intensity={1.6}
          color="#ffffff"
          scale={[40, 40, 1]}
          position={[0, 20, 0]}
          rotation-x={Math.PI / 2}
        />
        <Lightformer
          form="rect"
          intensity={0.8}
          color="#fff4e6"
          scale={[30, 8, 1]}
          position={[0, 4, -20]}
        />
        <Lightformer
          form="rect"
          intensity={0.6}
          color="#e8f0ff"
          scale={[30, 8, 1]}
          position={[0, 4, 20]}
          rotation-y={Math.PI}
        />
        <Lightformer
          form="rect"
          intensity={0.5}
          color={GROUND}
          scale={[40, 40, 1]}
          position={[0, -5, 0]}
          rotation-x={-Math.PI / 2}
        />
      </Environment>
      <hemisphereLight args={['#ffffff', GROUND, 0.2]} />
      <directionalLight
        position={[-6, 12, -8]}
        intensity={1.7}
        color={SUN}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-far={50}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-radius={5}
        shadow-blurSamples={16}
      />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.005, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={GROUND} roughness={1} />
      </mesh>
    </>
  );
}
