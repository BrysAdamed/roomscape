import { describe, expect, it } from 'vitest';
import { parseApartmentFile } from './projects';

describe('parseApartmentFile', () => {
  it('reports malformed JSON instead of throwing', () => {
    const result = parseApartmentFile('{ not json');

    expect(result.success).toBe(false);
    expect(result.success ? [] : result.errors[0]).toMatch(/^Not a JSON file/);
  });

  it('reports schema errors', () => {
    const result = parseApartmentFile(
      JSON.stringify({ schemaVersion: 1, id: 'x', name: 'X', floors: [] }),
    );

    expect(result.success).toBe(false);
  });

  it('accepts a valid apartment', () => {
    const apartment = {
      schemaVersion: 1,
      id: 'x',
      name: 'X',
      floors: [
        {
          id: 'f',
          name: 'F',
          elevation: 0,
          height: 2.6,
          walls: [],
          openings: [],
          rooms: [],
          furniture: [],
        },
      ],
    };

    expect(parseApartmentFile(JSON.stringify(apartment)).success).toBe(true);
  });
});
