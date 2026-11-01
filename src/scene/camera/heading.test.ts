import { describe, expect, it } from 'vitest';
import { PerspectiveCamera } from 'three';
import { cameraHeading, needleRotation } from './heading';

function cameraLookingAt(position: [number, number, number], target: [number, number, number]) {
  const camera = new PerspectiveCamera();
  camera.position.set(...position);
  camera.lookAt(...target);
  camera.updateMatrixWorld();
  return camera;
}

describe('cameraHeading', () => {
  it('is 0 when looking towards plan up and 90 when looking towards plan right', () => {
    // Act
    const headings = [
      cameraLookingAt([0, 5, 5], [0, 0, 0]),
      cameraLookingAt([-5, 5, 0], [0, 0, 0]),
    ].map(cameraHeading);

    // Assert
    expect(headings[0]).toBeCloseTo(0);
    expect(headings[1]).toBeCloseTo(90);
  });

  it('stays defined when looking straight down', () => {
    // Arrange
    const camera = new PerspectiveCamera();
    camera.position.set(0, 10, 0);
    camera.up.set(0, 0, -1);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    // Act
    const heading = cameraHeading(camera);

    // Assert
    expect(heading).toBeCloseTo(0);
  });
});

describe('needleRotation', () => {
  it('turns the needle against the camera heading', () => {
    // Act
    const rotations = [needleRotation(96, 0), needleRotation(13.5, 90), needleRotation(0, 270)];

    // Assert
    expect(rotations).toEqual([96, 283.5, 90]);
  });
});
