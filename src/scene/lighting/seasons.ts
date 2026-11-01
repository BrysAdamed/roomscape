export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export const SEASONS: readonly { season: Season; label: string; icon: string }[] = [
  { season: 'spring', label: 'Spring', icon: '🌱' },
  { season: 'summer', label: 'Summer', icon: '☀️' },
  { season: 'autumn', label: 'Autumn', icon: '🍂' },
  { season: 'winter', label: 'Winter', icon: '❄️' },
];

/** Equinox or solstice day (month, day) that stands for each season. */
const SEASON_DAYS: Record<Season, [number, number]> = {
  spring: [3, 20],
  summer: [6, 21],
  autumn: [9, 22],
  winter: [12, 21],
};

/** `YYYY-MM-DD` of the season's equinox or solstice in the given year. */
export function seasonDate(season: Season, year: number): string {
  const [month, day] = SEASON_DAYS[season];
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** The season a date falls in (meteorological seasons, northern hemisphere). */
export function seasonOf(date: Date): Season {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}
