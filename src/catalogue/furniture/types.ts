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

/** A parameter the side panel lets the user change, as a slider in metres. */
export interface ParamControl<P extends string = string> {
  param: P;
  label: string;
  min: number;
  max: (params: Readonly<Record<P, number>>) => number;
  step: number;
  /** Lets the user remove the fitting; a negative value means "none". */
  optional?: boolean;
}

export interface FurnitureType<P extends string = string, S extends string = string> {
  id: string;
  name: string;
  params: Readonly<Record<P, number>>;
  slots: Readonly<Record<S, MaterialSlot>>;
  controls?: readonly ParamControl<P>[];
  /** Overall size as [width (x), depth (z), height] in metres. */
  size: (params: Readonly<Record<P, number>>) => [number, number, number];
  Component: ComponentType<FurnitureRenderProps<P, S>>;
}

export function defineFurniture<P extends string, S extends string>(
  type: FurnitureType<P, S>,
): FurnitureType {
  return type as unknown as FurnitureType;
}
