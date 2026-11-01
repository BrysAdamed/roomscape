import type { Opening } from '../schema/apartment';

export const DEFAULT_OPENING_MATERIAL = 'wood-white-lacquer';

/** Whether the opening has anything to render; open doorways are just a gap in the wall. */
export function hasOpeningMesh(opening: Opening): boolean {
  return opening.kind === 'window' || opening.door !== undefined;
}
