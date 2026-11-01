import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Apartment } from '../src/schema/apartment';
import { validateApartment } from '../src/schema/validate';
import { setWallMaterial } from '../src/state/apartmentEdits';
import { serializeApartment } from '../src/state/serializeApartment';

const projectPath = join(import.meta.dirname, '..', 'public', 'projects', 'harmonia-ii-5-1-1.json');

function project(): Apartment {
  return JSON.parse(readFileSync(projectPath, 'utf8')) as Apartment;
}

describe('serializeApartment', () => {
  it('produces a valid apartment that round-trips unchanged', () => {
    // Arrange
    const source = project();

    // Act
    const json = serializeApartment(source);

    // Assert
    const parsed: unknown = JSON.parse(json);
    expect(parsed).toEqual(source);
    expect(validateApartment(parsed).success).toBe(true);
  });

  it('keeps plan points on one line', () => {
    // Act
    const json = serializeApartment(project());

    // Assert
    expect(json).toContain('"start": [0.195, 0.195]');
    expect(json).toContain('"end": [6.306, 0.195]');
    expect(json.endsWith('}\n')).toBe(true);
  });

  it('changes only the edited value', () => {
    // Arrange
    const source = project();
    const edited = setWallMaterial(source, 'parter-w-01', 'right', '#a8b5a0');

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
