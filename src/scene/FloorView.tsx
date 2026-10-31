import { useMemo } from 'react';
import type { Floor, Opening } from '../schema/apartment';
import { layoutWalls } from './geometry/wallLayout';
import { OpeningMesh } from './OpeningMesh';
import { RoomFloor } from './RoomFloor';
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
        <RoomFloor key={room.id} room={room} />
      ))}
      {spans.map((span) => (
        <WallMesh
          key={span.wall.id}
          span={span}
          height={span.wall.height ?? floor.height}
          openings={openingsByWall.get(span.wall.id) ?? NO_OPENINGS}
        />
      ))}
      {spans.flatMap((span) =>
        (openingsByWall.get(span.wall.id) ?? NO_OPENINGS).map((opening) => (
          <OpeningMesh key={opening.id} opening={opening} wall={span.wall} />
        )),
      )}
    </group>
  );
}
