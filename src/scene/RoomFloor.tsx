import { useEffect, useMemo } from 'react';
import type { Material } from 'three';
import type { Room } from '../schema/apartment';
import { buildFloorGeometry } from './geometry/floorGeometry';
import { backSided, meshMaterial } from './materials';

const UNDERSIDE_MATERIAL = 'paint-white';

interface RoomFloorProps {
  room: Room;
  override?: Material;
  /** Draw a painted underside, for floors seen from below: upper storeys and balconies. */
  underside?: boolean;
}

export function RoomFloor({ room, override, underside = false }: RoomFloorProps) {
  const geometry = useMemo(() => buildFloorGeometry(room.polygon), [room.polygon]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <>
      <mesh
        geometry={geometry}
        material={override ?? meshMaterial(room.floorMaterial, 'floor')}
        receiveShadow={!override}
      />
      {underside && !override && (
        <mesh
          geometry={geometry}
          material={backSided(meshMaterial(UNDERSIDE_MATERIAL))}
          castShadow
          receiveShadow
        />
      )}
    </>
  );
}
