import { create } from 'zustand';
import type { Apartment } from '../schema/apartment';
import {
  setFurnitureMaterial,
  setRoomFloorMaterial,
  setWallMaterial,
  type WallSide,
} from './apartmentEdits';

interface ApartmentState {
  source: Apartment | undefined;
  apartment: Apartment | undefined;
  selectedId: string | undefined;
  hoveredId: string | undefined;
  load: (apartment: Apartment) => void;
  select: (id: string | undefined) => void;
  hover: (id: string | undefined) => void;
  setWallMaterial: (wallId: string, side: WallSide, ref: string) => void;
  setRoomFloorMaterial: (roomId: string, ref: string) => void;
  setFurnitureMaterial: (itemId: string, slot: string, ref: string) => void;
}

export const useApartmentStore = create<ApartmentState>((set) => {
  const edit = (change: (apartment: Apartment) => Apartment) =>
    set((state) => (state.apartment ? { apartment: change(state.apartment) } : state));

  return {
    source: undefined,
    apartment: undefined,
    selectedId: undefined,
    hoveredId: undefined,
    load: (apartment) =>
      set({ source: apartment, apartment, selectedId: undefined, hoveredId: undefined }),
    select: (selectedId) => set({ selectedId }),
    hover: (hoveredId) => set({ hoveredId }),
    setWallMaterial: (wallId, side, ref) =>
      edit((apartment) => setWallMaterial(apartment, wallId, side, ref)),
    setRoomFloorMaterial: (roomId, ref) =>
      edit((apartment) => setRoomFloorMaterial(apartment, roomId, ref)),
    setFurnitureMaterial: (itemId, slot, ref) =>
      edit((apartment) => setFurnitureMaterial(apartment, itemId, slot, ref)),
  };
});
