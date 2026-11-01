import type { Floor } from '../schema/apartment';

const PADDING = 0.5;

export function PlanThumbnail({ floor }: { floor: Floor }) {
  const points = floor.walls.flatMap((wall) => [wall.start, wall.end]);
  if (points.length === 0) {
    return <div className="plan-thumbnail" />;
  }
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs) - PADDING;
  const minY = Math.min(...ys) - PADDING;
  const width = Math.max(...xs) - minX + PADDING;
  const height = Math.max(...ys) - minY + PADDING;

  return (
    <svg className="plan-thumbnail" viewBox={`${minX} ${minY} ${width} ${height}`} aria-hidden>
      {floor.rooms.map((room) => (
        <polygon key={room.id} points={room.polygon.map((p) => p.join(',')).join(' ')} />
      ))}
      {floor.walls.map((wall) => (
        <line
          key={wall.id}
          x1={wall.start[0]}
          y1={wall.start[1]}
          x2={wall.end[0]}
          y2={wall.end[1]}
          strokeWidth={wall.thickness}
        />
      ))}
    </svg>
  );
}
