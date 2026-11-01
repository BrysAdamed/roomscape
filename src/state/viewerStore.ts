import { create } from 'zustand';

export type CameraMode = 'orbit' | 'fly';
export type Tool = 'select' | 'ruler';
export type Point3 = [number, number, number];

export interface Measurement {
  start: Point3;
  end: Point3;
  floorOnly: boolean;
}

interface ViewerState {
  cameraMode: CameraMode;
  resetRequest: number;
  showWallLengths: boolean;
  showLowerFloors: boolean;
  showPlan: boolean;
  cutaway: boolean;
  topViewRequest: number;
  tool: Tool;
  measurements: Measurement[];
  pendingPoint: Point3 | undefined;
  hoverPoint: Point3 | undefined;
  rulerFloorOnly: boolean;
  rulerModifierHeld: boolean;
  heading: number;
  sunDate: string;
  sunMinutes: number;
  setCameraMode: (mode: CameraMode) => void;
  requestCameraReset: () => void;
  toggleWallLengths: () => void;
  toggleLowerFloors: () => void;
  togglePlan: () => void;
  toggleCutaway: () => void;
  requestTopView: () => void;
  setTool: (tool: Tool) => void;
  addMeasurePoint: (point: Point3) => void;
  clearMeasurements: () => void;
  setHoverPoint: (point: Point3 | undefined) => void;
  toggleRulerFloorOnly: () => void;
  setRulerModifierHeld: (held: boolean) => void;
  setHeading: (heading: number) => void;
  setSunTime: (date: string, minutes: number) => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  cameraMode: 'orbit',
  resetRequest: 0,
  showWallLengths: false,
  showLowerFloors: true,
  showPlan: false,
  cutaway: false,
  topViewRequest: 0,
  tool: 'select',
  measurements: [],
  pendingPoint: undefined,
  hoverPoint: undefined,
  rulerFloorOnly: false,
  rulerModifierHeld: false,
  heading: 0,
  sunDate: localDate(new Date()),
  sunMinutes: 12 * 60,
  setCameraMode: (cameraMode) => set({ cameraMode }),
  requestCameraReset: () =>
    set((state) => ({ cameraMode: 'orbit', resetRequest: state.resetRequest + 1 })),
  toggleWallLengths: () => set((state) => ({ showWallLengths: !state.showWallLengths })),
  toggleLowerFloors: () => set((state) => ({ showLowerFloors: !state.showLowerFloors })),
  togglePlan: () => set((state) => ({ showPlan: !state.showPlan })),
  toggleCutaway: () => set((state) => ({ cutaway: !state.cutaway })),
  requestTopView: () =>
    set((state) => ({ cameraMode: 'orbit', topViewRequest: state.topViewRequest + 1 })),
  setTool: (tool) => set({ tool, pendingPoint: undefined, hoverPoint: undefined }),
  addMeasurePoint: (point) =>
    set((state) =>
      state.pendingPoint
        ? {
            measurements: [
              ...state.measurements,
              { start: state.pendingPoint, end: point, floorOnly: isFloorOnly(state) },
            ],
            pendingPoint: undefined,
          }
        : { pendingPoint: point },
    ),
  clearMeasurements: () => set({ measurements: [], pendingPoint: undefined }),
  setHoverPoint: (hoverPoint) => set({ hoverPoint }),
  toggleRulerFloorOnly: () => set((state) => ({ rulerFloorOnly: !state.rulerFloorOnly })),
  setRulerModifierHeld: (rulerModifierHeld) => set({ rulerModifierHeld }),
  setHeading: (heading) => set({ heading }),
  setSunTime: (sunDate, sunMinutes) => set({ sunDate, sunMinutes }),
}));

/** Floor-only measuring is the toolbar setting, inverted while the modifier key (Ctrl) is held. */
export function isFloorOnly(state: Pick<ViewerState, 'rulerFloorOnly' | 'rulerModifierHeld'>) {
  return state.rulerFloorOnly !== state.rulerModifierHeld;
}

/** `YYYY-MM-DD` of a date in the browser's time zone. */
export function localDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
