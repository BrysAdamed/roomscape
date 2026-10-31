import { useViewerStore, type CameraMode } from '../state/viewerStore';

const MODES: { mode: CameraMode; label: string }[] = [
  { mode: 'orbit', label: 'Orbit' },
  { mode: 'fly', label: 'Fly' },
];

const HINTS: Record<CameraMode, string> = {
  orbit: 'Drag to rotate · right-drag to pan · scroll to zoom',
  fly: 'Drag to look · WASD to move · Q/E down/up · Shift to speed up',
};

export function CameraToolbar() {
  const mode = useViewerStore((state) => state.cameraMode);
  const setMode = useViewerStore((state) => state.setCameraMode);
  const requestReset = useViewerStore((state) => state.requestCameraReset);

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
      <span className="hint">{HINTS[mode]}</span>
    </div>
  );
}
