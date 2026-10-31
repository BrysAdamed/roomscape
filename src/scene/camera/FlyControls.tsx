import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Euler, Vector3 } from 'three';

const LOOK_SENSITIVITY = 0.004;
const WALK_SPEED = 2.5;
const SPRINT_MULTIPLIER = 3;
const MIN_HEIGHT = 0.2;
const MAX_PITCH = Math.PI / 2 - 0.01;

const forward = new Vector3();
const right = new Vector3();
const move = new Vector3();

const MOVE_KEYS: Record<string, [number, number, number]> = {
  KeyW: [0, 0, 1],
  ArrowUp: [0, 0, 1],
  KeyS: [0, 0, -1],
  ArrowDown: [0, 0, -1],
  KeyA: [-1, 0, 0],
  ArrowLeft: [-1, 0, 0],
  KeyD: [1, 0, 0],
  ArrowRight: [1, 0, 0],
  KeyE: [0, 1, 0],
  KeyQ: [0, -1, 0],
};

export function FlyControls() {
  const camera = useThree((state) => state.camera);
  const domElement = useThree((state) => state.gl.domElement);
  const pressed = useRef(new Set<string>());
  const orientation = useRef(new Euler(0, 0, 0, 'YXZ'));

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
      const euler = orientation.current;
      euler.y -= event.movementX * LOOK_SENSITIVITY;
      euler.x = Math.max(
        -MAX_PITCH,
        Math.min(MAX_PITCH, euler.x - event.movementY * LOOK_SENSITIVITY),
      );
      camera.quaternion.setFromEuler(euler);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTyping(event)) {
        pressed.current.add(event.code);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => pressed.current.delete(event.code);
    const onBlur = () => pressed.current.clear();

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
    move.set(0, 0, 0);
    for (const code of pressed.current) {
      const direction = MOVE_KEYS[code];
      if (direction) {
        move.x += direction[0];
        move.y += direction[1];
        move.z += direction[2];
      }
    }
    if (move.lengthSq() === 0) {
      return;
    }

    const yaw = orientation.current.y;
    forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    right.set(Math.cos(yaw), 0, -Math.sin(yaw));
    const sprint = pressed.current.has('ShiftLeft') || pressed.current.has('ShiftRight');
    const step = WALK_SPEED * (sprint ? SPRINT_MULTIPLIER : 1) * delta;
    const { x, y, z } = move.normalize();

    const { position } = state.camera;
    position.addScaledVector(right, x * step).addScaledVector(forward, z * step);
    position.y = Math.max(MIN_HEIGHT, position.y + y * step);
  });

  return null;
}

function isTyping(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  return !!target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName);
}
