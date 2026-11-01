import { useApartmentStore } from '../state/apartmentStore';
import { activeFloor } from '../state/floors';
import { useViewerStore } from '../state/viewerStore';

export function FloorSwitcher() {
  const apartment = useApartmentStore((state) => state.apartment);
  const activeFloorId = useApartmentStore((state) => state.activeFloorId);
  const setActiveFloor = useApartmentStore((state) => state.setActiveFloor);
  const showLowerFloors = useViewerStore((state) => state.showLowerFloors);
  const toggleLowerFloors = useViewerStore((state) => state.toggleLowerFloors);

  if (!apartment || apartment.floors.length < 2) {
    return null;
  }
  const active = activeFloor(apartment, activeFloorId);
  const floors = [...apartment.floors].sort((a, b) => b.elevation - a.elevation);

  return (
    <div className="floor-switcher">
      <div className="segmented segmented-vertical" role="group" aria-label="Floor">
        {floors.map((floor) => (
          <button
            key={floor.id}
            type="button"
            aria-pressed={floor === active}
            onClick={() => setActiveFloor(floor.id)}
          >
            {floor.name}
          </button>
        ))}
      </div>
      <label className="checkbox">
        <input type="checkbox" checked={showLowerFloors} onChange={toggleLowerFloors} />
        Floors below
      </label>
    </div>
  );
}
