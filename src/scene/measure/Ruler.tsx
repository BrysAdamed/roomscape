import { Line } from '@react-three/drei';
import { useViewerStore, type Point3 } from '../../state/viewerStore';
import { MeasureLabel } from './DimensionLines';
import { formatLength } from './format';

const COLOR = '#e8590c';
const MARKER_RADIUS = 0.025;

export function Ruler() {
  const measurements = useViewerStore((state) => state.measurements);
  const pendingPoint = useViewerStore((state) => state.pendingPoint);
  const hoverPoint = useViewerStore((state) => state.hoverPoint);
  const tool = useViewerStore((state) => state.tool);

  return (
    <>
      {measurements.map((measurement, index) => (
        <Measured key={index} start={measurement.start} end={measurement.end} />
      ))}
      {pendingPoint && <Marker point={pendingPoint} />}
      {pendingPoint && hoverPoint && tool === 'ruler' && (
        <Measured start={pendingPoint} end={hoverPoint} preview />
      )}
    </>
  );
}

function Measured({
  start,
  end,
  preview = false,
}: {
  start: Point3;
  end: Point3;
  preview?: boolean;
}) {
  const distance = Math.hypot(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
  const middle: Point3 = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2,
  ];
  return (
    <group>
      <Line
        points={[start, end]}
        color={COLOR}
        lineWidth={2}
        dashed={preview}
        dashSize={0.05}
        gapSize={0.03}
        depthTest={false}
        renderOrder={11}
      />
      <Marker point={start} />
      {!preview && <Marker point={end} />}
      <MeasureLabel position={middle} text={formatLength(distance)} />
    </group>
  );
}

function Marker({ point }: { point: Point3 }) {
  return (
    <mesh position={point} renderOrder={11} raycast={() => {}}>
      <sphereGeometry args={[MARKER_RADIUS, 16, 12]} />
      <meshBasicMaterial color={COLOR} depthTest={false} />
    </mesh>
  );
}
