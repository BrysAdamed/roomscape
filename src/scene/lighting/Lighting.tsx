import { useMemo } from 'react';
import { Environment, Lightformer } from '@react-three/drei';
import { Color, Object3D } from 'three';
import { useApartmentStore } from '../../state/apartmentStore';
import { frameApartment } from '../camera/framing';
import { useSun } from './useSun';

const SKY = new Color('#dfe4e8');
const NIGHT_SKY = new Color('#1c2433');
const GROUND = '#c9c6bd';
const SUN = new Color('#fff1dc');
const LOW_SUN = new Color('#ffb070');
const SUN_DISTANCE = 30;
const SUN_INTENSITY = 1.7;
const WARM_BELOW_ELEVATION = 25;

export function Lighting() {
  const source = useApartmentStore((state) => state.source);
  const center = useMemo(() => frameApartment(source).target, [source]);
  const target = useMemo(() => new Object3D(), []);
  const { direction, daylight, position } = useSun();

  const warmth = 1 - Math.min(1, Math.max(0, position.elevation / WARM_BELOW_ELEVATION));
  const sunColor = SUN.clone().lerp(LOW_SUN, warmth);
  const sky = NIGHT_SKY.clone().lerp(SKY, daylight);
  const sunPosition: [number, number, number] = [
    center[0] + direction[0] * SUN_DISTANCE,
    center[1] + direction[1] * SUN_DISTANCE,
    center[2] + direction[2] * SUN_DISTANCE,
  ];

  return (
    <>
      <color attach="background" args={[sky]} />
      <Environment resolution={256} frames={1} environmentIntensity={0.1 + 0.35 * daylight}>
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
      <hemisphereLight args={['#ffffff', GROUND, 0.05 + 0.15 * daylight]} />
      <primitive object={target} position={center} />
      <directionalLight
        position={sunPosition}
        target={target}
        intensity={SUN_INTENSITY * daylight}
        color={sunColor}
        visible={daylight > 0}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-far={SUN_DISTANCE * 2}
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
