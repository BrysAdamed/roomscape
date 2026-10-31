import type { ComponentType } from 'react';
import type { Material as ThreeMaterial } from 'three';
import type { MaterialCategory } from '../materials';

export interface MaterialSlot {
  label: string;
  categories: readonly MaterialCategory[];
  default: string;
}

export interface FurnitureRenderProps<P extends string = string, S extends string = string> {
  params: Readonly<Record<P, number>>;
  materials: Readonly<Record<S, ThreeMaterial>>;
}

export interface FurnitureType<P extends string = string, S extends string = string> {
  id: string;
  name: string;
  params: Readonly<Record<P, number>>;
  slots: Readonly<Record<S, MaterialSlot>>;
  Component: ComponentType<FurnitureRenderProps<P, S>>;
}

export function defineFurniture<P extends string, S extends string>(
  type: FurnitureType<P, S>,
): FurnitureType {
  return type as unknown as FurnitureType;
}
