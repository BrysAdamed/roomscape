import type { Camera } from 'three';
import { Vector3 } from 'three';

const forward = new Vector3();
const up = new Vector3();

/**
 * Direction of the top of the screen on the ground, in degrees clockwise from plan up (world -Z).
 * Uses forward plus up so it stays defined when looking straight down.
 */
export function cameraHeading(camera: Camera): number {
  camera.getWorldDirection(forward);
  up.set(0, 1, 0).applyQuaternion(camera.quaternion);
  const x = forward.x + up.x;
  const z = forward.z + up.z;
  return normalizeDegrees((Math.atan2(x, -z) * 180) / Math.PI);
}

/** Screen rotation of a compass needle pointing north, clockwise in degrees. */
export function needleRotation(north: number, heading: number): number {
  return normalizeDegrees(north - heading);
}

export function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}
