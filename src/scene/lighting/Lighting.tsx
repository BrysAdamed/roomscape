import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { Color, Object3D, type DirectionalLight, type HemisphereLight } from 'three';
import { useApartmentStore } from '../../state/apartmentStore';
import { frameApartment } from '../camera/framing';
import { useViewerStore } from '../../state/viewerStore';
import { dateOfDay, dayOfYear, seasonDate } from './seasons';
import { sunState } from './useSun';

const SKY = new Color('#dfe4e8');
const NIGHT_SKY = new Color('#1c2433');
const GROUND = '#c9c6bd';
const SUN = new Color('#fff1dc');
const LOW_SUN = new Color('#ffb070');
const SUN_DISTANCE = 30;
const SUN_INTENSITY = 1.7;
const WARM_BELOW_ELEVATION = 25;

const EASING = 6;
const MINUTE_SNAP = 0.05;
const DAY_SNAP = 0.5;

export function Lighting() {
  const source = useApartmentStore((state) => state.source);
  const location = useApartmentStore((state) => state.apartment?.location);
  const north = useApartmentStore((state) => state.apartment?.north ?? 0);
  const season = useViewerStore((state) => state.season);
  const minutes = useViewerStore((state) => state.sunMinutes);
  const center = useMemo(() => frameApartment(source).target, [source]);
  const target = useMemo(() => new Object3D(), []);
  const sun = useRef<DirectionalLight>(null);
  const hemisphere = useRef<HemisphereLight>(null);
  const shown = useRef<{ day: number; minutes: number } | undefined>(undefined);

  useFrame(({ scene }, delta) => {
    const year = new Date().getFullYear();
    const goal = { day: dayOfYear(seasonDate(season, year)), minutes };
    const current = shown.current ?? goal;
    const t = 1 - Math.exp(-delta * EASING);
    const next = {
      day: ease(current.day, goal.day, t, DAY_SNAP),
      minutes: ease(current.minutes, goal.minutes, t, MINUTE_SNAP),
    };
    shown.current = next;

    const state = sunState(location, north, dateOfDay(year, Math.round(next.day)), next.minutes);
    const warmth = 1 - Math.min(1, Math.max(0, state.position.elevation / WARM_BELOW_ELEVATION));
    if (sun.current) {
      const [dx, dy, dz] = state.direction;
      sun.current.position.set(
        center[0] + dx * SUN_DISTANCE,
        center[1] + dy * SUN_DISTANCE,
        center[2] + dz * SUN_DISTANCE,
      );
      sun.current.intensity = SUN_INTENSITY * state.daylight;
      sun.current.color.copy(SUN).lerp(LOW_SUN, warmth);
      sun.current.visible = state.daylight > 0;
    }
    if (hemisphere.current) {
      hemisphere.current.intensity = 0.05 + 0.15 * state.daylight;
    }
    if (scene.background instanceof Color) {
      scene.background.copy(NIGHT_SKY).lerp(SKY, state.daylight);
    }
    scene.environmentIntensity = 0.1 + 0.35 * state.daylight;
  });

  return (
    <>
      <color attach="background" args={[SKY]} />
      <Environment resolution={256} frames={1}>
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
      <hemisphereLight ref={hemisphere} args={['#ffffff', GROUND, 0.2]} />
      <primitive object={target} position={center} />
      <directionalLight
        ref={sun}
        target={target}
        intensity={SUN_INTENSITY}
        color={SUN}
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

/** Moves towards the goal by a fraction t, snapping once within `snap`. */
function ease(current: number, goal: number, t: number, snap: number): number {
  const next = current + (goal - current) * t;
  return Math.abs(goal - next) < snap ? goal : next;
}
