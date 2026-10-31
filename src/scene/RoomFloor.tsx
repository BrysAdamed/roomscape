import { useEffect, useMemo } from 'react';
import type { Room } from '../schema/apartment';
import { buildFloorGeometry } from './geometry/floorGeometry';
import { meshMaterial } from './materials';

export function RoomFloor({ room }: { room: Room }) {
  const geometry = useMemo(() => buildFloorGeometry(room.polygon), [room.polygon]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return <mesh geometry={geometry} material={meshMaterial(room.floorMaterial)} receiveShadow />;
}
