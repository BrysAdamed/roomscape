import { findFurnitureType } from '../../catalogue/furniture/registry';
import { resolveParams } from '../../catalogue/furniture/resolve';
import { useApartmentStore } from '../../state/apartmentStore';
import { activeFloor } from '../../state/floors';
import { useViewerStore } from '../../state/viewerStore';
import { MeasureLabel } from './DimensionLines';

const ABOVE = 0.15;

/** Name and type id above every piece of furniture on the active floor. */
export function FurnitureLabels() {
  const showLabels = useViewerStore((state) => state.showLabels);
  const floor = useApartmentStore((state) =>
    state.apartment ? activeFloor(state.apartment, state.activeFloorId) : undefined,
  );
  if (!showLabels || !floor) {
    return null;
  }

  return floor.furniture.map((item) => {
    const type = findFurnitureType(item.type);
    if (!type) {
      return null;
    }
    const [, , height] = type.size(resolveParams(type, item));
    return (
      <MeasureLabel
        key={item.id}
        position={[
          item.position[0],
          floor.elevation + (item.elevation ?? 0) + height + ABOVE,
          item.position[1],
        ]}
        text={`${type.name} · ${type.id}`}
      />
    );
  });
}
