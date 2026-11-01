import { useApartmentStore } from '../state/apartmentStore';
import { activeFloor } from '../state/floors';
import { useViewerStore, type CameraMode } from '../state/viewerStore';

const MODES: { mode: CameraMode; label: string }[] = [
  { mode: 'orbit', label: 'Orbit' },
  { mode: 'fly', label: 'Fly' },
];

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
  const requestTopView = useViewerStore((state) => state.requestTopView);
  const showPlan = useViewerStore((state) => state.showPlan);
  const togglePlan = useViewerStore((state) => state.togglePlan);
  const cutaway = useViewerStore((state) => state.cutaway);
  const toggleCutaway = useViewerStore((state) => state.toggleCutaway);
  const hasPlan = useApartmentStore(
    (state) =>
      state.apartment !== undefined &&
      activeFloor(state.apartment, state.activeFloorId)?.planImage !== undefined,
  );

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
      <button type="button" onClick={requestTopView} title="Look straight down at the floor">
        Top view
      </button>
      <button
        type="button"
        aria-pressed={cutaway}
        onClick={toggleCutaway}
        title="Cut the walls down to see into the rooms"
      >
        Cutaway
      </button>
      {hasPlan && (
        <button
          type="button"
          aria-pressed={showPlan}
          onClick={togglePlan}
          title="Show the source floor plan under the model"
        >
          Plan
        </button>
      )}
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
    </div>
  );
}
