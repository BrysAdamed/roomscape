import { useViewerStore, type CameraMode } from '../state/viewerStore';

const MODES: { mode: CameraMode; label: string }[] = [
  { mode: 'orbit', label: 'Orbit' },
  { mode: 'fly', label: 'Fly' },
];

const HINTS: Record<CameraMode, string> = {
  orbit: 'Drag to rotate · right-drag to pan · scroll to zoom',
  fly: 'Drag to look · WASD to move · Q/E down/up · Shift to speed up',
};

const RULER_HINT = 'Click two points to measure · Esc clears';

export function CameraToolbar() {
  const mode = useViewerStore((state) => state.cameraMode);
  const setMode = useViewerStore((state) => state.setCameraMode);
  const requestReset = useViewerStore((state) => state.requestCameraReset);
  const tool = useViewerStore((state) => state.tool);
  const setTool = useViewerStore((state) => state.setTool);
  const showWallLengths = useViewerStore((state) => state.showWallLengths);
  const toggleWallLengths = useViewerStore((state) => state.toggleWallLengths);
  const hasMeasurements = useViewerStore(
    (state) => state.measurements.length > 0 || state.pendingPoint !== undefined,
  );
  const clearMeasurements = useViewerStore((state) => state.clearMeasurements);

  return (
    <div className="toolbar">
      <div className="segmented" role="group" aria-label="Camera mode">
        {MODES.map((option) => (
          <button
            key={option.mode}
            type="button"
            aria-pressed={mode === option.mode}
            onClick={() => setMode(option.mode)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <button type="button" onClick={requestReset}>
        Reset view
      </button>
      <button
        type="button"
        aria-pressed={tool === 'ruler'}
        onClick={() => setTool(tool === 'ruler' ? 'select' : 'ruler')}
        title="Measure the distance between two points"
      >
        Ruler
      </button>
      {hasMeasurements && (
        <button type="button" onClick={clearMeasurements}>
          Clear measurements
        </button>
      )}
      <button
        type="button"
        aria-pressed={showWallLengths}
        onClick={toggleWallLengths}
        title="Show the length of every wall"
      >
        Wall lengths
      </button>
      <span className="hint">{tool === 'ruler' ? RULER_HINT : HINTS[mode]}</span>
    </div>
  );
}
