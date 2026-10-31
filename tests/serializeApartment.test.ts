import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Apartment } from '../src/schema/apartment';
import { validateApartment } from '../src/schema/validate';
import { setWallMaterial } from '../src/state/apartmentEdits';
import { serializeApartment } from '../src/state/serializeApartment';

const pilotPath = join(import.meta.dirname, '..', 'public', 'projects', 'pilot-bedroom.json');

function pilot(): Apartment {
  return JSON.parse(readFileSync(pilotPath, 'utf8')) as Apartment;
}

describe('serializeApartment', () => {
  it('produces a valid apartment that round-trips unchanged', () => {
    // Arrange
    const source = pilot();

    // Act
    const json = serializeApartment(source);

    // Assert
    const parsed: unknown = JSON.parse(json);
    expect(parsed).toEqual(source);
    expect(validateApartment(parsed).success).toBe(true);
  });

  it('keeps plan points on one line', () => {
    // Act
    const json = serializeApartment(pilot());

    // Assert
    expect(json).toContain('"start": [-0.1925, -0.1925]');
    expect(json).toContain('[5.73, 2.4]');
    expect(json.endsWith('}\n')).toBe(true);
  });

  it('changes only the edited value', () => {
    // Arrange
    const source = pilot();
    const edited = setWallMaterial(source, 'w-north', 'right', '#a8b5a0');

    // Act
    const before = serializeApartment(source).split('\n');
    const after = serializeApartment(edited).split('\n');

    // Assert
    const changed = after.filter((line, index) => line !== before[index]);
    expect(after).toHaveLength(before.length);
    expect(changed).toHaveLength(1);
    expect(changed[0]!.trim()).toBe('"right": "#a8b5a0"');
  });
});
