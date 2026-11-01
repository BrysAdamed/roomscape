export type FlyAction =
  | 'forward'
  | 'back'
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'turnLeft'
  | 'turnRight'
  | 'lookUp'
  | 'lookDown'
  | 'sprint';

/** Keyboard codes (`KeyboardEvent.code`) for each fly-mode action. */
export const FLY_BINDINGS: Record<FlyAction, readonly string[]> = {
  forward: ['KeyW'],
  back: ['KeyS'],
  left: ['KeyA'],
  right: ['KeyD'],
  up: ['KeyR'],
  down: ['KeyF'],
  turnLeft: ['KeyQ', 'ArrowLeft'],
  turnRight: ['KeyE', 'ArrowRight'],
  lookUp: ['KeyT', 'ArrowUp'],
  lookDown: ['KeyG', 'ArrowDown'],
  sprint: ['ShiftLeft', 'ShiftRight'],
};

const ACTION_BY_CODE = new Map<string, FlyAction>(
  Object.entries(FLY_BINDINGS).flatMap(([action, codes]) =>
    codes.map((code) => [code, action as FlyAction] as const),
  ),
);

export function flyActionFor(code: string): FlyAction | undefined {
  return ACTION_BY_CODE.get(code);
}

const KEY_NAMES: Record<string, string> = {
  ArrowLeft: '←',
  ArrowRight: '→',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ShiftLeft: 'Shift',
  ShiftRight: 'Shift',
};

/** Human-readable key name for a keyboard code, e.g. `KeyW` → `W`. */
export function keyName(code: string): string {
  return KEY_NAMES[code] ?? code.replace(/^Key|^Digit/, '');
}
