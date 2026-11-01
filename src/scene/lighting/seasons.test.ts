import { describe, expect, it } from 'vitest';
import { seasonDate, seasonOf } from './seasons';

describe('seasons', () => {
  it('maps seasons to their equinox or solstice', () => {
    // Act
    const dates = (['spring', 'summer', 'autumn', 'winter'] as const).map((season) =>
      seasonDate(season, 2026),
    );

    // Assert
    expect(dates).toEqual(['2026-03-20', '2026-06-21', '2026-09-22', '2026-12-21']);
  });

  it('finds the season of a date', () => {
    // Act
    const seasons = [new Date(2026, 0, 5), new Date(2026, 3, 1), new Date(2026, 10, 1)].map(
      seasonOf,
    );

    // Assert
    expect(seasons).toEqual(['winter', 'spring', 'autumn']);
  });
});
