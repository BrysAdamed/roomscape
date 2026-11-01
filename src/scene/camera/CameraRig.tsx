import { useEffect, useLayoutEffect, useRef, type ComponentRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Quaternion, Vector3 } from 'three';
import { useApartmentStore } from '../../state/apartmentStore';
import { activeFloor } from '../../state/floors';
import { useViewerStore } from '../../state/viewerStore';
import type { CameraFraming } from './framing';
import { FlyControls } from './FlyControls';
import { cameraHeading } from './heading';

const LOOK_AHEAD = 3;
const UP = new Vector3(0, 1, 0);

export function CameraRig({ framing }: { framing: CameraFraming }) {
  const camera = useThree((state) => state.camera);
  const mode = useViewerStore((state) => state.cameraMode);
  const resetRequest = useViewerStore((state) => state.resetRequest);
  const orbit = useRef<ComponentRef<typeof OrbitControls>>(null);
  const orbitTarget = useRef(new Vector3(...framing.target));

  const elevation = useApartmentStore((state) =>
    state.apartment ? (activeFloor(state.apartment, state.activeFloorId)?.elevation ?? 0) : 0,
  );
  const activeElevation = useRef(elevation);
  useEffect(() => {
    activeElevation.current = elevation;
  }, [elevation]);

  useEffect(() => {
    const [x, y, z] = framing.position;
    const [tx, ty, tz] = framing.target;
    camera.position.set(x, y + activeElevation.current, z);
    orbitTarget.current.set(tx, ty + activeElevation.current, tz);
    camera.lookAt(orbitTarget.current);
    orbit.current?.target.copy(orbitTarget.current);
    orbit.current?.update();
  }, [camera, framing, resetRequest]);

  const topViewRequest = useViewerStore((state) => state.topViewRequest);
  useEffect(() => {
    if (topViewRequest === 0) {
      return;
    }
    const [tx, ty, tz] = framing.target;
    const distance = new Vector3(...framing.position).distanceTo(new Vector3(...framing.target));
    orbitTarget.current.set(tx, ty + activeElevation.current, tz);
    camera.position.set(tx, ty + activeElevation.current + distance, tz + 0.001);
    camera.lookAt(orbitTarget.current);
    orbit.current?.target.copy(orbitTarget.current);
    orbit.current?.update();
  }, [camera, framing, topViewRequest]);

  const faceNorthRequest = useViewerStore((state) => state.faceNorthRequest);
  useEffect(() => {
    if (faceNorthRequest === 0) {
      return;
    }
    const north = useApartmentStore.getState().apartment?.north ?? 0;
    const angle = (-(north - cameraHeading(camera)) * Math.PI) / 180;
    if (orbit.current) {
      const offset = camera.position.clone().sub(orbitTarget.current).applyAxisAngle(UP, angle);
      camera.position.copy(orbitTarget.current).add(offset);
      camera.lookAt(orbitTarget.current);
      orbit.current.update();
    } else {
      camera.quaternion.premultiply(new Quaternion().setFromAxisAngle(UP, angle));
    }
  }, [camera, faceNorthRequest]);

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
