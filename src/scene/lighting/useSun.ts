import type { Location } from '../../schema/apartment';
import { useApartmentStore } from '../../state/apartmentStore';
import { useViewerStore } from '../../state/viewerStore';
import { seasonDate } from './seasons';
import { sunDirection, sunPosition, zonedTimeToUtc, type SunPosition } from './solar';

const DEFAULT_LOCATION: Required<Location> = {
  latitude: 52.23,
  longitude: 21.01,
  timeZone: 'Europe/Warsaw',
};

export interface SunState {
  position: SunPosition;
  /** Unit vector towards the sun in world space. */
  direction: [number, number, number];
  /** 0 at night, 1 in full daylight, blending through dawn and dusk. */
  daylight: number;
}

const NIGHT_ELEVATION = -4;
const DAY_ELEVATION = 8;

export function sunState(
  location: Location | undefined,
  north: number,
  date: string,
  minutes: number,
): SunState {
  const { latitude, longitude, timeZone } = { ...DEFAULT_LOCATION, ...location };
  const position = sunPosition(zonedTimeToUtc(date, minutes, timeZone), latitude, longitude);
  const t = (position.elevation - NIGHT_ELEVATION) / (DAY_ELEVATION - NIGHT_ELEVATION);
  const clamped = Math.min(1, Math.max(0, t));
  return {
    position,
    direction: sunDirection(position, north),
    daylight: clamped * clamped * (3 - 2 * clamped),
  };
}

export function useSun(): SunState {
  const location = useApartmentStore((state) => state.apartment?.location);
  const north = useApartmentStore((state) => state.apartment?.north ?? 0);
  const season = useViewerStore((state) => state.season);
  const date = seasonDate(season, new Date().getFullYear());
  const minutes = useViewerStore((state) => state.sunMinutes);
  return sunState(location, north, date, minutes);
}
