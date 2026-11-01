import { create } from 'zustand';

export type CameraMode = 'orbit' | 'fly';
export type Tool = 'select' | 'ruler';
export type Point3 = [number, number, number];

export interface Measurement {
  start: Point3;
  end: Point3;
}

interface ViewerState {
  cameraMode: CameraMode;
  resetRequest: number;
  showWallLengths: boolean;
  showLowerFloors: boolean;
  tool: Tool;
  measurements: Measurement[];
  pendingPoint: Point3 | undefined;
  hoverPoint: Point3 | undefined;
  setCameraMode: (mode: CameraMode) => void;
  requestCameraReset: () => void;
  toggleWallLengths: () => void;
  toggleLowerFloors: () => void;
  setTool: (tool: Tool) => void;
  addMeasurePoint: (point: Point3) => void;
  clearMeasurements: () => void;
  setHoverPoint: (point: Point3 | undefined) => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  cameraMode: 'orbit',
  resetRequest: 0,
  showWallLengths: false,
  showLowerFloors: true,
  tool: 'select',
  measurements: [],
  pendingPoint: undefined,
  hoverPoint: undefined,
  setCameraMode: (cameraMode) => set({ cameraMode }),
  requestCameraReset: () =>
    set((state) => ({ cameraMode: 'orbit', resetRequest: state.resetRequest + 1 })),
  toggleWallLengths: () => set((state) => ({ showWallLengths: !state.showWallLengths })),
  toggleLowerFloors: () => set((state) => ({ showLowerFloors: !state.showLowerFloors })),
  setTool: (tool) => set({ tool, pendingPoint: undefined, hoverPoint: undefined }),
  addMeasurePoint: (point) =>
    set((state) =>
      state.pendingPoint
        ? {
            measurements: [...state.measurements, { start: state.pendingPoint, end: point }],
            pendingPoint: undefined,
          }
        : { pendingPoint: point },
    ),
  clearMeasurements: () => set({ measurements: [], pendingPoint: undefined }),
  setHoverPoint: (hoverPoint) => set({ hoverPoint }),
}));
