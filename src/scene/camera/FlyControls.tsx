import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Euler, Vector3 } from 'three';
import { useApartmentStore } from '../../state/apartmentStore';
import { useViewerStore } from '../../state/viewerStore';
import { flyActionFor, type FlyAction } from './flyBindings';
import { EYE_HEIGHT, walkSurface } from './walkSurface';

const LOOK_SENSITIVITY = 0.004;
const WALK_SPEED = 2.5;
const TURN_SPEED = 1.6;
const PITCH_SPEED = 1.2;
const SPRINT_MULTIPLIER = 3;
const MIN_HEIGHT = 0.2;
const MAX_PITCH = Math.PI / 2 - 0.01;
const STEP_EASING = 12;

const forward = new Vector3();
const right = new Vector3();
const move = new Vector3();

/** First-person controls; in walk mode the camera stays at eye height and follows floors and stairs. */
export function FlyControls({ walk = false }: { walk?: boolean }) {
  const camera = useThree((state) => state.camera);
  const domElement = useThree((state) => state.gl.domElement);
  const active = useRef(new Map<string, FlyAction>());
  const orientation = useRef(new Euler(0, 0, 0, 'YXZ'));
  const syncedJumps = useRef(cameraJumps());

  useEffect(() => {
    orientation.current.setFromQuaternion(camera.quaternion, 'YXZ');
    orientation.current.z = 0;
    let dragging = false;

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      domElement.setPointerCapture(event.pointerId);
    };
    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      domElement.releasePointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) {
        return;
      }
      rotate(
        orientation.current,
        -event.movementX * LOOK_SENSITIVITY,
        -event.movementY * LOOK_SENSITIVITY,
      );
      camera.quaternion.setFromEuler(orientation.current);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const action = flyActionFor(event.code);
      if (!action || isTyping(event) || event.ctrlKey || event.metaKey) {
        return;
      }
      event.preventDefault();
      active.current.set(event.code, action);
    };
    const onKeyUp = (event: KeyboardEvent) => active.current.delete(event.code);
    const onBlur = () => active.current.clear();

    domElement.addEventListener('pointerdown', onPointerDown);
    domElement.addEventListener('pointerup', onPointerUp);
    domElement.addEventListener('pointermove', onPointerMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      domElement.removeEventListener('pointerdown', onPointerDown);
      domElement.removeEventListener('pointerup', onPointerUp);
      domElement.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [camera, domElement]);

  useFrame((state, delta) => {
    const jumps = cameraJumps();
    if (jumps !== syncedJumps.current) {
      syncedJumps.current = jumps;
      orientation.current.setFromQuaternion(state.camera.quaternion, 'YXZ');
      orientation.current.z = 0;
    }
    const actions = new Set(active.current.values());
    const axis = (positive: FlyAction, negative: FlyAction) =>
      (actions.has(positive) ? 1 : 0) - (actions.has(negative) ? 1 : 0);
    const speed = actions.has('sprint') ? SPRINT_MULTIPLIER : 1;

    const turn = axis('turnLeft', 'turnRight');
    const pitch = axis('lookUp', 'lookDown');
    if (turn !== 0 || pitch !== 0) {
      rotate(orientation.current, turn * TURN_SPEED * delta, pitch * PITCH_SPEED * delta);
      state.camera.quaternion.setFromEuler(orientation.current);
    }

    const { position } = state.camera;
    move.set(axis('right', 'left'), walk ? 0 : axis('up', 'down'), axis('forward', 'back'));
    if (move.lengthSq() > 0) {
      const yaw = orientation.current.y;
      forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
      right.set(Math.cos(yaw), 0, -Math.sin(yaw));
      const step = WALK_SPEED * speed * delta;
      const { x, y, z } = move.normalize();
      position.addScaledVector(right, x * step).addScaledVector(forward, z * step);
      position.y = Math.max(MIN_HEIGHT, position.y + y * step);
    }
    if (walk) {
      followSurface(position, delta);
    }
  });

  return null;
}

/** Changes whenever something outside the fly controls turns the camera (top view, face north). */
function cameraJumps(): string {
  const { topViewRequest, faceNorthRequest } = useViewerStore.getState();
  return `${topViewRequest}:${faceNorthRequest}`;
}

/** Keeps a walker's eyes at eye height above the floor or stair tread under them, switching storeys on the stairs. */
function followSurface(position: Vector3, delta: number) {
  const { apartment, activeFloorId, setActiveFloor } = useApartmentStore.getState();
  if (!apartment) {
    return;
  }
  const surface = walkSurface(apartment, activeFloorId, [position.x, position.z]);
  if (surface.floorId !== activeFloorId) {
    setActiveFloor(surface.floorId);
  }
  const target = surface.height + EYE_HEIGHT;
  position.y += (target - position.y) * (1 - Math.exp(-delta * STEP_EASING));
}

function rotate(euler: Euler, yaw: number, pitch: number) {
  euler.y += yaw;
  euler.x = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, euler.x + pitch));
}

function isTyping(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  return !!target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName);
}
