import { useMemo } from 'react';
import type { Apartment } from '../schema/apartment';
import { useApartmentStore } from '../state/apartmentStore';
import { visibleFloors } from '../state/floors';
import { useViewerStore } from '../state/viewerStore';
import { FloorView } from './FloorView';

export function ApartmentView({ apartment }: { apartment: Apartment }) {
  const activeFloorId = useApartmentStore((state) => state.activeFloorId);
  const showLower = useViewerStore((state) => state.showLowerFloors);
  const walk = useViewerStore((state) => state.cameraMode === 'walk');
  const floors = useMemo(
    () => visibleFloors(apartment, activeFloorId, { showLower, walk }),
    [apartment, activeFloorId, showLower, walk],
  );

  return (
    <group>
      {floors.map(({ floor, ghost, interactive }) => (
        <FloorView key={floor.id} floor={floor} ghost={ghost} interactive={interactive} />
      ))}
    </group>
  );
}
