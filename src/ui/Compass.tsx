import { needleRotation } from '../scene/camera/heading';
import { useApartmentStore } from '../state/apartmentStore';
import { useViewerStore } from '../state/viewerStore';

export function Compass() {
  const north = useApartmentStore((state) => state.apartment?.north);
  const heading = useViewerStore((state) => state.heading);
  const requestFaceNorth = useViewerStore((state) => state.requestFaceNorth);
  if (north === undefined) {
    return null;
  }
  const rotation = needleRotation(north, heading);

  return (
    <button
      type="button"
      className="compass"
      title="Turn the view so north is up"
      aria-label={`Face north (north is ${Math.round(rotation)}° clockwise)`}
      onClick={requestFaceNorth}
    >
      <svg viewBox="-50 -50 100 100" style={{ transform: `rotate(${rotation}deg)` }}>
        <circle r="46" className="compass-ring" />
        <polygon points="0,-38 9,0 -9,0" className="compass-north" />
        <polygon points="0,38 9,0 -9,0" className="compass-south" />
        <text y="-13" className="compass-label" transform={`rotate(${-rotation} 0 -13)`}>
          N
        </text>
      </svg>
    </button>
  );
}
