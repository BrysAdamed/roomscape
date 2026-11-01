import type { Apartment } from '../../schema/apartment';

export interface CameraFraming {
  target: [number, number, number];
  position: [number, number, number];
}

const FALLBACK: CameraFraming = { target: [0, 0, 0], position: [6, 6, 6] };

export function frameApartment(apartment: Apartment | undefined): CameraFraming {
  const points = apartment?.floors.flatMap((floor) => [
    ...floor.walls.flatMap((wall) => [wall.start, wall.end]),
    ...floor.rooms.flatMap((room) => room.polygon),
  ]);
  if (!points || points.length === 0) {
    return FALLBACK;
  }

  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const radius = Math.max(maxX - minX, maxY - minY, 2);

  return {
    target: [centerX, 0, centerY],
    position: [centerX + radius * 0.2, radius * 1.7, centerY + radius * 0.55],
  };
}
