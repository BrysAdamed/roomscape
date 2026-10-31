import { useMemo } from 'react';
import type { Floor, Opening } from '../schema/apartment';
import { FurnitureMesh } from './FurnitureMesh';
import { layoutWalls } from './geometry/wallLayout';
import { OpeningMesh } from './OpeningMesh';
import { RoomFloor } from './RoomFloor';
import { Selectable } from './selection/Selectable';
import { WallMesh } from './WallMesh';

const NO_OPENINGS: readonly Opening[] = [];

export function FloorView({ floor }: { floor: Floor }) {
  const spans = useMemo(() => layoutWalls(floor.walls), [floor.walls]);
  const openingsByWall = useMemo(() => {
    const grouped = new Map<string, Opening[]>();
    for (const opening of floor.openings) {
      grouped.set(opening.wallId, [...(grouped.get(opening.wallId) ?? []), opening]);
    }
    return grouped;
  }, [floor.openings]);

  return (
    <group position={[0, floor.elevation, 0]}>
      {floor.rooms.map((room) => (
        <Selectable key={room.id} id={room.id}>
          <RoomFloor room={room} />
        </Selectable>
      ))}
      {spans.map((span) => (
        <Selectable key={span.wall.id} id={span.wall.id}>
          <WallMesh
            span={span}
            height={span.wall.height ?? floor.height}
            openings={openingsByWall.get(span.wall.id) ?? NO_OPENINGS}
          />
        </Selectable>
      ))}
      {spans.flatMap((span) =>
        (openingsByWall.get(span.wall.id) ?? NO_OPENINGS).map((opening) => (
          <OpeningMesh key={opening.id} opening={opening} wall={span.wall} />
        )),
      )}
      {floor.furniture.map((item) => (
        <Selectable key={item.id} id={item.id}>
          <FurnitureMesh item={item} />
        </Selectable>
      ))}
    </group>
  );
}
