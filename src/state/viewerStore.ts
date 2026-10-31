import { create } from 'zustand';

export type CameraMode = 'orbit' | 'fly';

interface ViewerState {
  cameraMode: CameraMode;
  resetRequest: number;
  setCameraMode: (mode: CameraMode) => void;
  requestCameraReset: () => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  cameraMode: 'orbit',
  resetRequest: 0,
  setCameraMode: (cameraMode) => set({ cameraMode }),
  requestCameraReset: () =>
    set((state) => ({ cameraMode: 'orbit', resetRequest: state.resetRequest + 1 })),
}));
