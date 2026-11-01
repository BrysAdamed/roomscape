import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { PointLight } from 'three';
import { findFurnitureType } from '../../catalogue/furniture/registry';
import { resolveParams } from '../../catalogue/furniture/resolve';
import type { FurnitureItem } from '../../schema/apartment';
import { shownDaylight } from './daylight';

const LAMP_TYPE = 'pendant-lamp';
const COLOR = '#ffd9a0';
const INTENSITY = 4;
const DISTANCE = 7;

/** Warm lights for the pendant lamps of a floor, fading in as daylight fades. */
export function LampLights({ furniture }: { furniture: readonly FurnitureItem[] }) {
  const lamps = furniture.filter((item) => item.type === LAMP_TYPE);
  return lamps.map((lamp) => <LampLight key={lamp.id} lamp={lamp} />);
}

function LampLight({ lamp }: { lamp: FurnitureItem }) {
  const light = useRef<PointLight>(null);
  const type = findFurnitureType(LAMP_TYPE)!;
  const { shadeHeight } = resolveParams(type, lamp);
  useFrame(() => {
    if (light.current) {
      const night = 1 - shownDaylight.value;
      light.current.intensity = INTENSITY * night;
      light.current.visible = night > 0.01;
    }
  });

  return (
    <pointLight
      ref={light}
      position={[lamp.position[0], (lamp.elevation ?? 0) + shadeHeight! * 0.3, lamp.position[1]]}
      color={COLOR}
      distance={DISTANCE}
      decay={2}
      intensity={0}
    />
  );
}
