import { Fragment, Suspense, useMemo, type ReactNode } from 'react';
import type { Floor, Opening } from '../schema/apartment';
import { useViewerStore } from '../state/viewerStore';
import { FurnitureMesh } from './FurnitureMesh';
import { layoutWalls } from './geometry/wallLayout';
import { ghostMaterial } from './materials';
import { OpeningMesh } from './OpeningMesh';
import { PlanOverlay } from './PlanOverlay';
import { RoomFloor } from './RoomFloor';
import { Selectable } from './selection/Selectable';
import { StairsMesh } from './StairsMesh';
import { WallMesh } from './WallMesh';

const NO_OPENINGS: readonly Opening[] = [];

/** Renders one storey; a ghost floor is translucent context that cannot be selected. */
export function FloorView({ floor, ghost = false }: { floor: Floor; ghost?: boolean }) {
  const spans = useMemo(() => layoutWalls(floor.walls), [floor.walls]);
  const openingsByWall = useMemo(() => {
    const grouped = new Map<string, Opening[]>();
    for (const opening of floor.openings) {
      grouped.set(opening.wallId, [...(grouped.get(opening.wallId) ?? []), opening]);
    }
    return grouped;
  }, [floor.openings]);
  const override = ghost ? ghostMaterial : undefined;
  const showPlan = useViewerStore((state) => state.showPlan);
  const Wrap = ghost ? Passive : Selectable;

  return (
    <group position={[0, floor.elevation, 0]}>
      {floor.rooms.map((room) => (
        <Wrap key={room.id} id={room.id}>
          <RoomFloor room={room} override={override} />
        </Wrap>
      ))}
      {spans.map((span) => (
        <Wrap key={span.wall.id} id={span.wall.id}>
          <WallMesh
            span={span}
            height={span.wall.height ?? floor.height}
            openings={openingsByWall.get(span.wall.id) ?? NO_OPENINGS}
            override={override}
          />
        </Wrap>
      ))}
      {!ghost &&
        spans.flatMap((span) =>
          (openingsByWall.get(span.wall.id) ?? NO_OPENINGS).map((opening) => (
            <OpeningMesh key={opening.id} opening={opening} wall={span.wall} />
          )),
        )}
      {showPlan && !ghost && floor.planImage && (
        <Suspense fallback={null}>
          <PlanOverlay image={floor.planImage} />
        </Suspense>
      )}
      {floor.stairs?.map((stairs) => (
        <Wrap key={stairs.id} id={stairs.id}>
          <StairsMesh stairs={stairs} override={override} />
        </Wrap>
      ))}
      {floor.furniture.map((item) => (
        <Wrap key={item.id} id={item.id}>
          <FurnitureMesh item={item} override={override} />
        </Wrap>
      ))}
    </group>
  );
}

function Passive({ children }: { id: string; children: ReactNode }) {
  return <Fragment>{children}</Fragment>;
}
