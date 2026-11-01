import { useMemo } from 'react';
import type { Apartment } from '../schema/apartment';
import { useApartmentStore } from '../state/apartmentStore';
import { visibleFloors } from '../state/floors';
import { useViewerStore } from '../state/viewerStore';
import { FloorView } from './FloorView';

export function ApartmentView({ apartment }: { apartment: Apartment }) {
  const activeFloorId = useApartmentStore((state) => state.activeFloorId);
  const showLowerFloors = useViewerStore((state) => state.showLowerFloors);
  const floors = useMemo(
    () => visibleFloors(apartment, activeFloorId, showLowerFloors),
    [apartment, activeFloorId, showLowerFloors],
  );

  return (
    <group>
      {floors.map(({ floor, ghost }) => (
        <FloorView key={floor.id} floor={floor} ghost={ghost} />
      ))}
    </group>
  );
}
