import { useEffect, useLayoutEffect, useRef, type ComponentRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import { useApartmentStore } from '../../state/apartmentStore';
import { activeFloor } from '../../state/floors';
import { useViewerStore } from '../../state/viewerStore';
import type { CameraFraming } from './framing';
import { FlyControls } from './FlyControls';

const LOOK_AHEAD = 3;

export function CameraRig({ framing }: { framing: CameraFraming }) {
  const camera = useThree((state) => state.camera);
  const mode = useViewerStore((state) => state.cameraMode);
  const resetRequest = useViewerStore((state) => state.resetRequest);
  const orbit = useRef<ComponentRef<typeof OrbitControls>>(null);
  const orbitTarget = useRef(new Vector3(...framing.target));

  const elevation = useApartmentStore((state) =>
    state.apartment ? (activeFloor(state.apartment, state.activeFloorId)?.elevation ?? 0) : 0,
  );
  const shownElevation = useRef(0);

  useEffect(() => {
    const [x, y, z] = framing.position;
    const [tx, ty, tz] = framing.target;
    camera.position.set(x, y + shownElevation.current, z);
    orbitTarget.current.set(tx, ty + shownElevation.current, tz);
    camera.lookAt(orbitTarget.current);
    orbit.current?.target.copy(orbitTarget.current);
    orbit.current?.update();
  }, [camera, framing, resetRequest]);

  useEffect(() => {
    const delta = elevation - shownElevation.current;
    shownElevation.current = elevation;
    camera.position.setY(camera.position.y + delta);
    orbitTarget.current.setY(orbitTarget.current.y + delta);
    orbit.current?.target.copy(orbitTarget.current);
    orbit.current?.update();
  }, [camera, elevation]);

  useLayoutEffect(() => {
    if (mode !== 'orbit') {
      return;
    }
    orbitTarget.current.copy(
      pointInFront(camera.position, camera.getWorldDirection(new Vector3())),
    );
    orbit.current?.target.copy(orbitTarget.current);
    orbit.current?.update();
  }, [camera, mode]);

  return mode === 'orbit' ? (
    <OrbitControls
      ref={orbit}
      makeDefault
      enableDamping={false}
      maxPolarAngle={Math.PI / 2 - 0.05}
      minDistance={0.5}
      maxDistance={60}
    />
  ) : (
    <FlyControls />
  );
}

function pointInFront(position: Vector3, direction: Vector3): Vector3 {
  if (direction.y < -0.1) {
    const distance = -position.y / direction.y;
    return position.clone().addScaledVector(direction, Math.min(distance, 30));
  }
  return position.clone().addScaledVector(direction, LOOK_AHEAD);
}
