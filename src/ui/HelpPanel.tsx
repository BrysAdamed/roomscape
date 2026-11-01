import { useState } from 'react';
import { FLY_BINDINGS, keyName, type FlyAction } from '../scene/camera/flyBindings';
import { useViewerStore, type CameraMode } from '../state/viewerStore';

interface Control {
  keys: readonly string[];
  action: string;
}

const flyKeys = (...actions: FlyAction[]) => [
  ...new Set(actions.flatMap((action) => FLY_BINDINGS[action].map(keyName))),
];

const CAMERA_CONTROLS: Record<CameraMode, readonly Control[]> = {
  orbit: [
    { keys: ['Drag'], action: 'Rotate' },
    { keys: ['Right-drag'], action: 'Pan' },
    { keys: ['Scroll'], action: 'Zoom' },
  ],
  fly: [
    { keys: ['Drag'], action: 'Look around' },
    { keys: flyKeys('forward', 'left', 'back', 'right'), action: 'Move' },
    { keys: flyKeys('turnLeft', 'turnRight'), action: 'Turn' },
    { keys: flyKeys('lookUp', 'lookDown'), action: 'Look up / down' },
    { keys: flyKeys('up', 'down'), action: 'Fly up / down' },
    { keys: flyKeys('sprint'), action: 'Move faster' },
  ],
};

const SELECT_CONTROLS: readonly Control[] = [
  { keys: ['Click'], action: 'Select a wall, room or piece' },
  { keys: ['Esc'], action: 'Deselect' },
];

const RULER_CONTROLS: readonly Control[] = [
  { keys: ['Click'], action: 'Place a point (two per measurement)' },
  { keys: ['Esc'], action: 'Clear measurements' },
];

export function HelpPanel() {
  const [open, setOpen] = useState(true);
  const mode = useViewerStore((state) => state.cameraMode);
  const tool = useViewerStore((state) => state.tool);
  const controls = [
    ...CAMERA_CONTROLS[mode],
    ...(tool === 'ruler' ? RULER_CONTROLS : SELECT_CONTROLS),
  ];

  return (
    <section className="help-panel" aria-label="Controls">
      <button
        type="button"
        className="help-toggle"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        Controls <span aria-hidden>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <dl>
          {controls.map((control) => (
            <div key={control.action} className="help-row">
              <dt>
                {control.keys.map((key) => (
                  <kbd key={key}>{key}</kbd>
                ))}
              </dt>
              <dd>{control.action}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
