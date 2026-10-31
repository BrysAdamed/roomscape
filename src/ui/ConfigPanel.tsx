import { findFurnitureType } from '../catalogue/furniture/registry';
import { resolveMaterialRefs } from '../catalogue/furniture/resolve';
import type { MaterialCategory } from '../catalogue/materials';
import { polygonArea } from '../scene/geometry/floorGeometry';
import type { FurnitureItem, Room, Wall } from '../schema/apartment';
import { wallLength } from '../schema/validate';
import { findElement, type WallSide } from '../state/apartmentEdits';
import { useApartmentStore } from '../state/apartmentStore';
import { MaterialPicker } from './MaterialPicker';
import { wallFaceDirection } from './wallFaces';

const WALL_CATEGORIES: readonly MaterialCategory[] = ['paint', 'tile', 'stone', 'wood'];
const FLOOR_CATEGORIES: readonly MaterialCategory[] = ['wood', 'tile', 'stone'];
const WALL_SIDES: readonly WallSide[] = ['left', 'right'];

export function ConfigPanel() {
  const apartment = useApartmentStore((state) => state.apartment);
  const selectedId = useApartmentStore((state) => state.selectedId);
  const select = useApartmentStore((state) => state.select);
  const element = apartment && selectedId ? findElement(apartment, selectedId) : undefined;

  if (!element) {
    return null;
  }

  return (
    <aside className="config-panel" aria-label="Element settings">
      <header>
        <div>
          <div className="config-kind">{element.floor.name}</div>
          <h2>{title(element)}</h2>
        </div>
        <button type="button" aria-label="Close" onClick={() => select(undefined)}>
          ✕
        </button>
      </header>
      {element.kind === 'wall' && <WallSettings wall={element.wall} />}
      {element.kind === 'room' && <RoomSettings room={element.room} />}
      {element.kind === 'furniture' && <FurnitureSettings item={element.item} />}
    </aside>
  );
}

function title(element: NonNullable<ReturnType<typeof findElement>>): string {
  switch (element.kind) {
    case 'wall':
      return `Wall ${element.wall.id}`;
    case 'room':
      return element.room.name;
    case 'furniture':
      return findFurnitureType(element.item.type)?.name ?? element.item.type;
  }
}

function WallSettings({ wall }: { wall: Wall }) {
  const setWallMaterial = useApartmentStore((state) => state.setWallMaterial);
  return (
    <>
      <p className="config-facts">
        {format(wallLength(wall.start, wall.end))} m long · {format(wall.thickness * 100, 0)} cm
        thick
      </p>
      {WALL_SIDES.map((side) => (
        <MaterialPicker
          key={side}
          label={`${wallFaceDirection(wall, side)} face`}
          value={wall.materials[side]}
          categories={WALL_CATEGORIES}
          onChange={(ref) => setWallMaterial(wall.id, side, ref)}
        />
      ))}
    </>
  );
}

function RoomSettings({ room }: { room: Room }) {
  const setRoomFloorMaterial = useApartmentStore((state) => state.setRoomFloorMaterial);
  return (
    <>
      <p className="config-facts">{format(polygonArea(room.polygon))} m²</p>
      <MaterialPicker
        label="Floor"
        value={room.floorMaterial}
        categories={FLOOR_CATEGORIES}
        onChange={(ref) => setRoomFloorMaterial(room.id, ref)}
      />
    </>
  );
}

function FurnitureSettings({ item }: { item: FurnitureItem }) {
  const setFurnitureMaterial = useApartmentStore((state) => state.setFurnitureMaterial);
  const type = findFurnitureType(item.type);
  if (!type) {
    return <p className="config-facts">Unknown furniture type '{item.type}'.</p>;
  }
  const refs = resolveMaterialRefs(type, item);
  return (
    <>
      {Object.entries(type.slots).map(([slot, definition]) => (
        <MaterialPicker
          key={slot}
          label={definition.label}
          value={refs[slot]!}
          categories={definition.categories}
          onChange={(ref) => setFurnitureMaterial(item.id, slot, ref)}
        />
      ))}
    </>
  );
}

function format(value: number, digits = 2): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
