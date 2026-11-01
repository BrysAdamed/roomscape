import { Html, Line } from '@react-three/drei';
import type { DimensionLine, Vec3 } from './dimensions';
import { formatLength } from './format';

interface DimensionLinesProps {
  lines: readonly DimensionLine[];
  color?: string;
}

export function DimensionLines({ lines, color = '#2f80ed' }: DimensionLinesProps) {
  return (
    <>
      {lines.map((line, index) => (
        <group key={index}>
          <Line
            points={[line.start, line.end]}
            color={color}
            lineWidth={1.5}
            depthTest={false}
            renderOrder={10}
          />
          <MeasureLabel position={midpoint(line.start, line.end)} text={formatLength(line.value)} />
        </group>
      ))}
    </>
  );
}

export function MeasureLabel({ position, text }: { position: Vec3; text: string }) {
  return (
    <Html position={position} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <span className="dimension-label">{text}</span>
    </Html>
  );
}

function midpoint(a: Vec3, b: Vec3): Vec3 {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
}
