import { describe, expect, it } from 'vitest';
import type { Apartment, Floor } from '../schema/apartment';
import { activeFloor, visibleFloors } from './floors';

const floor = (id: string, elevation: number): Floor => ({
  id,
  name: id,
  elevation,
  height: 2.6,
  walls: [],
  openings: [],
  rooms: [],
  furniture: [],
});

const apartment: Apartment = {
  schemaVersion: 1,
  id: 'a',
  name: 'A',
  floors: [floor('ground', 0), floor('first', 2.9), floor('attic', 5.8)],
};

describe('visibleFloors', () => {
  it('shows the active floor with lower floors as ghosts and hides upper floors', () => {
    const visible = visibleFloors(apartment, 'first', { showLower: true, walk: false });

    expect(visible.map(({ floor, ghost }) => [floor.id, ghost])).toEqual([
      ['ground', true],
      ['first', false],
    ]);
  });

  it('shows only the active floor when lower floors are off', () => {
    expect(
      visibleFloors(apartment, 'attic', { showLower: false, walk: false }).map(
        ({ floor }) => floor.id,
      ),
    ).toEqual(['attic']);
  });

  it('shows every floor solid while walking, with only the active one selectable', () => {
    const visible = visibleFloors(apartment, 'first', { showLower: false, walk: true });

    expect(visible.map(({ floor, ghost, interactive }) => [floor.id, ghost, interactive])).toEqual([
      ['ground', false, false],
      ['first', false, true],
      ['attic', false, false],
    ]);
  });
});

describe('activeFloor', () => {
  it('falls back to the first floor for an unknown id', () => {
    expect(activeFloor(apartment, 'missing')?.id).toBe('ground');
  });
});
