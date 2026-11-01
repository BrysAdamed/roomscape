import { useEffect } from 'react';
import { Line } from '@react-three/drei';
import { useApartmentStore } from '../../state/apartmentStore';
import { activeFloor } from '../../state/floors';
import { isFloorOnly, useViewerStore, type Point3 } from '../../state/viewerStore';
import { MeasureLabel } from './DimensionLines';
import { formatLength } from './format';
import { measuredSegment } from './rulerGeometry';

const COLOR = '#e8590c';
const MARKER_RADIUS = 0.025;

export function Ruler() {
  const measurements = useViewerStore((state) => state.measurements);
  const pendingPoint = useViewerStore((state) => state.pendingPoint);
  const hoverPoint = useViewerStore((state) => state.hoverPoint);
  const tool = useViewerStore((state) => state.tool);
  const previewFloorOnly = useViewerStore(isFloorOnly);
  const floorElevation = useApartmentStore((state) =>
    state.apartment ? (activeFloor(state.apartment, state.activeFloorId)?.elevation ?? 0) : 0,
  );
  useModifierKey();

  return (
    <>
      {measurements.map((measurement, index) => (
        <Measured key={index} {...measurement} floorElevation={floorElevation} />
      ))}
      {pendingPoint && <Marker point={pendingPoint} />}
      {pendingPoint && hoverPoint && tool === 'ruler' && (
        <Measured
          start={pendingPoint}
          end={hoverPoint}
          floorOnly={previewFloorOnly}
          floorElevation={floorElevation}
          preview
        />
      )}
    </>
  );
}

function useModifierKey() {
  const setHeld = useViewerStore((state) => state.setRulerModifierHeld);
  useEffect(() => {
    const update = (event: KeyboardEvent) => setHeld(event.ctrlKey || event.metaKey);
    const release = () => setHeld(false);
    window.addEventListener('keydown', update);
    window.addEventListener('keyup', update);
    window.addEventListener('blur', release);
    return () => {
      window.removeEventListener('keydown', update);
      window.removeEventListener('keyup', update);
      window.removeEventListener('blur', release);
    };
  }, [setHeld]);
}

interface MeasuredProps {
  start: Point3;
  end: Point3;
  floorOnly: boolean;
  floorElevation: number;
  preview?: boolean;
}

function Measured({ start, end, floorOnly, floorElevation, preview = false }: MeasuredProps) {
  const segment = measuredSegment(start, end, floorOnly, floorElevation);
  const middle: Point3 = [
    (segment.start[0] + segment.end[0]) / 2,
    (segment.start[1] + segment.end[1]) / 2,
    (segment.start[2] + segment.end[2]) / 2,
  ];
  const label = `${floorOnly ? 'Floor ' : ''}${formatLength(segment.distance)}`;
  return (
    <group>
      <Line
        points={[segment.start, segment.end]}
        color={COLOR}
        lineWidth={2}
        dashed={preview}
        dashSize={0.05}
        gapSize={0.03}
        depthTest={false}
        renderOrder={11}
      />
      {floorOnly && <Drop from={start} to={segment.start} />}
      {floorOnly && !preview && <Drop from={end} to={segment.end} />}
      <Marker point={start} />
      {!preview && <Marker point={end} />}
      <MeasureLabel position={middle} text={label} />
    </group>
  );
}

function Drop({ from, to }: { from: Point3; to: Point3 }) {
  return (
    <Line
      points={[from, to]}
      color={COLOR}
      lineWidth={1}
      dashed
      dashSize={0.03}
      gapSize={0.03}
      depthTest={false}
      renderOrder={11}
    />
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
