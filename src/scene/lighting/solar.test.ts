import { describe, expect, it } from 'vitest';
import { compassPoint, sunDirection, sunPosition, zonedTimeToUtc } from './solar';

const WARSAW = { latitude: 52.23, longitude: 21.01 };

describe('sunPosition', () => {
  it('stands due south at about 90° - latitude + 23.4° at the June solstice solar noon', () => {
    // Act
    const sun = sunPosition(Date.UTC(2026, 5, 21, 10, 38), WARSAW.latitude, WARSAW.longitude);

    // Assert
    expect(sun.elevation).toBeCloseTo(61.2, 0);
    expect(sun.azimuth).toBeGreaterThan(178);
    expect(sun.azimuth).toBeLessThan(182);
  });

  it('rises in the north-east in summer and sets in the south-west in winter', () => {
    // Act
    const summerMorning = sunPosition(
      Date.UTC(2026, 5, 21, 2, 30),
      WARSAW.latitude,
      WARSAW.longitude,
    );
    const winterEvening = sunPosition(
      Date.UTC(2026, 11, 21, 14, 20),
      WARSAW.latitude,
      WARSAW.longitude,
    );

    // Assert
    expect(compassPoint(summerMorning.azimuth)).toBe('NE');
    expect(Math.abs(summerMorning.elevation)).toBeLessThan(5);
    expect(compassPoint(winterEvening.azimuth)).toBe('SW');
    expect(Math.abs(winterEvening.elevation)).toBeLessThan(5);
  });
});

describe('sunDirection', () => {
  it('points towards plan up for a sun in the north when north is plan up', () => {
    // Act
    const direction = sunDirection({ azimuth: 0, elevation: 0 }, 0);

    // Assert
    expect(direction.map((value) => +value.toFixed(6) + 0)).toEqual([0, 0, -1]);
  });

  it('rotates with the north bearing', () => {
    // Act
    const direction = sunDirection({ azimuth: 180, elevation: 30 }, 90);

    // Assert
    expect(direction[0]).toBeCloseTo(-Math.cos(Math.PI / 6));
    expect(direction[1]).toBeCloseTo(0.5);
    expect(direction[2]).toBeCloseTo(0);
  });
});

describe('zonedTimeToUtc', () => {
  it('applies summer and winter time offsets', () => {
    // Act
    const summer = zonedTimeToUtc('2026-07-01', 12 * 60, 'Europe/Warsaw');
    const winter = zonedTimeToUtc('2026-01-15', 8 * 60 + 30, 'Europe/Warsaw');

    // Assert
    expect(new Date(summer).toISOString()).toBe('2026-07-01T10:00:00.000Z');
    expect(new Date(winter).toISOString()).toBe('2026-01-15T07:30:00.000Z');
  });
});
