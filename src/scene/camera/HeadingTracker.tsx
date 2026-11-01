import { useFrame } from '@react-three/fiber';
import { useViewerStore } from '../../state/viewerStore';
import { cameraHeading } from './heading';

const MIN_CHANGE = 0.5;

/** Publishes the camera heading for HTML overlays such as the compass. */
export function HeadingTracker() {
  useFrame(({ camera }) => {
    const heading = cameraHeading(camera);
    const { heading: current, setHeading } = useViewerStore.getState();
    const change = Math.abs(((heading - current + 540) % 360) - 180);
    if (change >= MIN_CHANGE) {
      setHeading(heading);
    }
  });
  return null;
}
