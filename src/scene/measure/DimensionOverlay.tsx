import { useMemo } from 'react';
import { useApartmentStore } from '../../state/apartmentStore';
import { activeFloor } from '../../state/floors';
import { useViewerStore } from '../../state/viewerStore';
import { DimensionLines } from './DimensionLines';
import { elementDimensions, wallLengthLine } from './dimensions';

const WALL_LENGTH_COLOR = '#6b665e';

export function DimensionOverlay() {
  const apartment = useApartmentStore((state) => state.apartment);
  const selectedId = useApartmentStore((state) => state.selectedId);
  const showWallLengths = useViewerStore((state) => state.showWallLengths);
  const activeFloorId = useApartmentStore((state) => state.activeFloorId);

  const selected = useMemo(
    () => (apartment && selectedId ? elementDimensions(apartment, selectedId) : []),
    [apartment, selectedId],
  );
  const wallLengths = useMemo(() => {
    const floor = apartment && showWallLengths ? activeFloor(apartment, activeFloorId) : undefined;
    return (floor?.walls ?? [])
      .filter((wall) => wall.id !== selectedId)
      .map((wall) => wallLengthLine(wall, floor!));
  }, [apartment, showWallLengths, selectedId, activeFloorId]);

  return (
    <>
      <DimensionLines lines={wallLengths} color={WALL_LENGTH_COLOR} />
      <DimensionLines lines={selected} />
    </>
  );
}
