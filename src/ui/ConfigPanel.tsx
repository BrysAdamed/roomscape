import { Fragment } from 'react';
import { findFurnitureType } from '../catalogue/furniture/registry';
import { resolveMaterialRefs, resolveParams } from '../catalogue/furniture/resolve';
import type { MaterialCategory } from '../catalogue/materials';
import { polygonArea } from '../scene/geometry/floorGeometry';
import { formatLength } from '../scene/measure/format';
import { DEFAULT_OPENING_MATERIAL } from '../scene/openings';
import type { FurnitureItem, Opening, PlanPoint, Room, Stairs, Wall } from '../schema/apartment';
import { wallLength } from '../schema/validate';
import { findElement, type WallSide } from '../state/apartmentEdits';
import { useApartmentStore } from '../state/apartmentStore';
import { MaterialPicker } from './MaterialPicker';
import { wallFaceDirection } from './wallFaces';

const WALL_CATEGORIES: readonly MaterialCategory[] = ['paint', 'tile', 'stone', 'wood'];
const FLOOR_CATEGORIES: readonly MaterialCategory[] = ['wood', 'tile', 'stone'];
const WALL_SIDES: readonly WallSide[] = ['left', 'right'];
const STAIRS_CATEGORIES: readonly MaterialCategory[] = ['wood', 'stone', 'tile'];
const OPENING_CATEGORIES: readonly MaterialCategory[] = ['wood', 'paint', 'metal'];

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
      {element.kind === 'wall' && (
        <WallSettings wall={element.wall} height={element.wall.height ?? element.floor.height} />
      )}
      {element.kind === 'room' && <RoomSettings room={element.room} />}
      {element.kind === 'furniture' && <FurnitureSettings item={element.item} />}
      {element.kind === 'stairs' && <StairsSettings stairs={element.stairs} />}
      {element.kind === 'opening' && <OpeningSettings opening={element.opening} />}
    </aside>
  );
}

function title(element: NonNullable<ReturnType<typeof findElement>>): string {
  switch (element.kind) {
    case 'wall':
      return `Wall ${element.wall.id}`;
    case 'room':
      return element.room.name;
    case 'stairs':
      return 'Stairs';
    case 'opening':
      return element.opening.kind === 'door' ? 'Door' : 'Window';
    case 'furniture':
      return findFurnitureType(element.item.type)?.name ?? element.item.type;
  }
}

function WallSettings({ wall, height }: { wall: Wall; height: number }) {
  const setWallMaterial = useApartmentStore((state) => state.setWallMaterial);
  return (
    <>
      <Facts
        rows={[
          ['Length (axis)', formatLength(wallLength(wall.start, wall.end))],
          ['Thickness', formatLength(wall.thickness)],
          ['Height', formatLength(height)],
        ]}
      />
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
      <Facts
        rows={[
          ['Area', `${format(polygonArea(room.polygon))} m²`],
          ['Extent', extent(room.polygon)],
        ]}
      />
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
  const [width, depth, height] = type.size(resolveParams(type, item));
  return (
    <>
      <Facts
        rows={[
          ['Width', formatLength(width)],
          ['Depth', formatLength(depth)],
          ['Height', formatLength(height)],
        ]}
      />
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

function StairsSettings({ stairs }: { stairs: Stairs }) {
  const setStairsMaterial = useApartmentStore((state) => state.setStairsMaterial);
  return (
    <>
      <Facts
        rows={[
          ['Risers', String(stairs.steps.length + 1)],
          ['Riser height', formatLength(stairs.riserHeight)],
          ['Total rise', formatLength(stairs.riserHeight * (stairs.steps.length + 1))],
        ]}
      />
      <MaterialPicker
        label="Treads"
        value={stairs.material}
        categories={STAIRS_CATEGORIES}
        onChange={(ref) => setStairsMaterial(stairs.id, ref)}
      />
    </>
  );
}

function OpeningSettings({ opening }: { opening: Opening }) {
  const setOpeningMaterial = useApartmentStore((state) => state.setOpeningMaterial);
  const rows: [string, string][] = [
    ['Width', formatLength(opening.width)],
    ['Height', formatLength(opening.height)],
  ];
  if (opening.kind === 'window') {
    rows.push(['Sill height', formatLength(opening.sillHeight)]);
  }
  return (
    <>
      <Facts rows={rows} />
      {opening.door && (
        <MaterialPicker
          label="Leaf"
          value={opening.door.material ?? DEFAULT_OPENING_MATERIAL}
          categories={OPENING_CATEGORIES}
          onChange={(ref) => setOpeningMaterial(opening.id, 'leaf', ref)}
        />
      )}
      <MaterialPicker
        label="Frame"
        value={opening.frameMaterial ?? DEFAULT_OPENING_MATERIAL}
        categories={OPENING_CATEGORIES}
        onChange={(ref) => setOpeningMaterial(opening.id, 'frame', ref)}
      />
    </>
  );
}

function format(value: number, digits = 2): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="config-dimensions">
      {rows.map(([label, value]) => (
        <Fragment key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

function extent(polygon: readonly PlanPoint[]): string {
  const xs = polygon.map(([x]) => x);
  const ys = polygon.map(([, y]) => y);
  const width = Math.max(...xs) - Math.min(...xs);
  const depth = Math.max(...ys) - Math.min(...ys);
  return `${formatLength(width)} × ${formatLength(depth)}`;
}
