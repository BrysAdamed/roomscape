import { needleRotation } from '../scene/camera/heading';
import { useApartmentStore } from '../state/apartmentStore';
import { useViewerStore } from '../state/viewerStore';

export function Compass() {
  const north = useApartmentStore((state) => state.apartment?.north);
  const heading = useViewerStore((state) => state.heading);
  if (north === undefined) {
    return null;
  }
  const rotation = needleRotation(north, heading);

  return (
    <div className="compass" role="img" aria-label={`North is ${Math.round(rotation)}° clockwise`}>
      <svg viewBox="-50 -50 100 100" style={{ transform: `rotate(${rotation}deg)` }}>
        <circle r="46" className="compass-ring" />
        <polygon points="0,-38 9,0 -9,0" className="compass-north" />
        <polygon points="0,38 9,0 -9,0" className="compass-south" />
        <text y="-13" className="compass-label" transform={`rotate(${-rotation} 0 -13)`}>
          N
        </text>
      </svg>
    </div>
  );
}
