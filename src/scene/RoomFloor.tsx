import { useEffect, useMemo } from 'react';
import type { Material } from 'three';
import type { Room } from '../schema/apartment';
import { buildFloorGeometry } from './geometry/floorGeometry';
import { meshMaterial } from './materials';

export function RoomFloor({ room, override }: { room: Room; override?: Material }) {
  const geometry = useMemo(() => buildFloorGeometry(room.polygon), [room.polygon]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh
      geometry={geometry}
      material={override ?? meshMaterial(room.floorMaterial, 'floor')}
      receiveShadow={!override}
    />
  );
}
