const DEG = Math.PI / 180;

/** Sun position in the sky: `azimuth` in degrees clockwise from geographic north, `elevation` above the horizon. */
export interface SunPosition {
  azimuth: number;
  elevation: number;
}

/**
 * Approximate solar position (low-precision almanac algorithm, accurate to about 0.5° between 1950 and 2050),
 * which is plenty for seeing where sunlight falls.
 */
export function sunPosition(utcMillis: number, latitude: number, longitude: number): SunPosition {
  const days = utcMillis / 86_400_000 + 2_440_587.5 - 2_451_545;
  const meanLongitude = mod(280.46 + 0.9856474 * days, 360);
  const meanAnomaly = mod(357.528 + 0.9856003 * days, 360) * DEG;
  const eclipticLongitude =
    (meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)) * DEG;
  const obliquity = (23.439 - 0.0000004 * days) * DEG;

  const rightAscension = Math.atan2(
    Math.cos(obliquity) * Math.sin(eclipticLongitude),
    Math.cos(eclipticLongitude),
  );
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude));
  const siderealDegrees = mod(18.697374558 + 24.06570982441908 * days, 24) * 15 + longitude;
  const hourAngle = siderealDegrees * DEG - rightAscension;
  const lat = latitude * DEG;

  const elevation = Math.asin(
    Math.sin(lat) * Math.sin(declination) +
      Math.cos(lat) * Math.cos(declination) * Math.cos(hourAngle),
  );
  const azimuth = Math.atan2(
    -Math.sin(hourAngle),
    Math.tan(declination) * Math.cos(lat) - Math.sin(lat) * Math.cos(hourAngle),
  );
  return { azimuth: mod(azimuth / DEG, 360), elevation: elevation / DEG };
}

/**
 * Unit vector towards the sun in world space (Y up, plan up is -Z), given the plan's north bearing
 * in degrees clockwise from plan up.
 */
export function sunDirection(sun: SunPosition, north: number): [number, number, number] {
  const bearing = (north + sun.azimuth) * DEG;
  const elevation = sun.elevation * DEG;
  return [
    Math.sin(bearing) * Math.cos(elevation),
    Math.sin(elevation),
    -Math.cos(bearing) * Math.cos(elevation),
  ];
}

/** UTC instant of a wall-clock date (`YYYY-MM-DD`) and minute of the day in an IANA time zone. */
export function zonedTimeToUtc(date: string, minutes: number, timeZone: string): number {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  const wallClock = Date.UTC(year, month - 1, day, 0, minutes);
  const first = wallClock - zoneOffset(wallClock, timeZone);
  return wallClock - zoneOffset(first, timeZone);
}

function zoneOffset(utcMillis: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(utcMillis);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((candidate) => candidate.type === type)?.value);
  const asUtc = Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour'),
    part('minute'),
  );
  return asUtc - Math.floor(utcMillis / 60_000) * 60_000;
}

const COMPASS_POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export function compassPoint(azimuth: number): string {
  return COMPASS_POINTS[Math.round(mod(azimuth, 360) / 45) % 8]!;
}

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
