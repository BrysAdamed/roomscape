import { create } from 'zustand';
import type { Apartment } from '../schema/apartment';
import {
  setFurnitureMaterial,
  setFurnitureParam,
  setRoomFloorMaterial,
  setOpeningMaterial,
  setRailingMaterial,
  setRoofWindowMaterial,
  setStairsMaterial,
  setWallMaterial,
  type OpeningPart,
  type WallSide,
} from './apartmentEdits';
import { applyVariant } from './variants';

interface ApartmentState {
  /** The apartment as loaded, with its variants. */
  base: Apartment | undefined;
  variantId: string | undefined;
  /** The base with the active variant applied: what the viewer shows before the user's edits. */
  source: Apartment | undefined;
  apartment: Apartment | undefined;
  selectedId: string | undefined;
  hoveredId: string | undefined;
  activeFloorId: string | undefined;
  load: (apartment: Apartment, variantId?: string) => void;
  setVariant: (variantId: string | undefined) => void;
  select: (id: string | undefined) => void;
  hover: (id: string | undefined) => void;
  setActiveFloor: (floorId: string) => void;
  setWallMaterial: (wallId: string, side: WallSide, ref: string) => void;
  setRoomFloorMaterial: (roomId: string, ref: string) => void;
  setFurnitureMaterial: (itemId: string, slot: string, ref: string) => void;
  setFurnitureParam: (itemId: string, param: string, value: number) => void;
  setStairsMaterial: (stairsId: string, ref: string) => void;
  setOpeningMaterial: (openingId: string, part: OpeningPart, ref: string) => void;
  setRailingMaterial: (railingId: string, ref: string) => void;
  setRoofWindowMaterial: (windowId: string, ref: string) => void;
}

export const useApartmentStore = create<ApartmentState>((set) => {
  const edit = (change: (apartment: Apartment) => Apartment) =>
    set((state) => (state.apartment ? { apartment: change(state.apartment) } : state));

  return {
    source: undefined,
    apartment: undefined,
    selectedId: undefined,
    hoveredId: undefined,
    activeFloorId: undefined,
    base: undefined,
    variantId: undefined,
    load: (base, variantId) => {
      const shown = applyVariant(base, variantId).apartment;
      set({
        base,
        variantId: shown === base ? undefined : variantId,
        source: shown,
        apartment: shown,
        selectedId: undefined,
        hoveredId: undefined,
        activeFloorId: shown.floors[0]?.id,
      });
    },
    setVariant: (variantId) =>
      set((state) => {
        if (!state.base) {
          return state;
        }
        const shown = applyVariant(state.base, variantId).apartment;
        const floorKept = shown.floors.some((floor) => floor.id === state.activeFloorId);
        return {
          variantId: shown === state.base ? undefined : variantId,
          source: shown,
          apartment: shown,
          selectedId: undefined,
          hoveredId: undefined,
          activeFloorId: floorKept ? state.activeFloorId : shown.floors[0]?.id,
        };
      }),
    select: (selectedId) => set({ selectedId }),
    hover: (hoveredId) => set({ hoveredId }),
    setActiveFloor: (activeFloorId) =>
      set({ activeFloorId, selectedId: undefined, hoveredId: undefined }),
    setWallMaterial: (wallId, side, ref) =>
      edit((apartment) => setWallMaterial(apartment, wallId, side, ref)),
    setRoomFloorMaterial: (roomId, ref) =>
      edit((apartment) => setRoomFloorMaterial(apartment, roomId, ref)),
    setFurnitureMaterial: (itemId, slot, ref) =>
      edit((apartment) => setFurnitureMaterial(apartment, itemId, slot, ref)),
    setFurnitureParam: (itemId, param, value) =>
      edit((apartment) => setFurnitureParam(apartment, itemId, param, value)),
    setStairsMaterial: (stairsId, ref) =>
      edit((apartment) => setStairsMaterial(apartment, stairsId, ref)),
    setOpeningMaterial: (openingId, part, ref) =>
      edit((apartment) => setOpeningMaterial(apartment, openingId, part, ref)),
    setRailingMaterial: (railingId, ref) =>
      edit((apartment) => setRailingMaterial(apartment, railingId, ref)),
    setRoofWindowMaterial: (windowId, ref) =>
      edit((apartment) => setRoofWindowMaterial(apartment, windowId, ref)),
  };
});
