import { useId, useState } from 'react';
import { SEASONS } from '../scene/lighting/seasons';
import { compassPoint } from '../scene/lighting/solar';
import { useSun } from '../scene/lighting/useSun';
import { useViewerStore } from '../state/viewerStore';

const STEP_MINUTES = 5;
const MINUTES_PER_DAY = 24 * 60;
const NIGHT_ICON = '🌙';

/** Time of day and season for the sun; a compact button that expands into the slider. */
export function SunClock() {
  const [open, setOpen] = useState(false);
  const timeId = useId();
  const season = useViewerStore((state) => state.season);
  const minutes = useViewerStore((state) => state.sunMinutes);
  const setSeason = useViewerStore((state) => state.setSeason);
  const setSunMinutes = useViewerStore((state) => state.setSunMinutes);
  const { position } = useSun();
  const current = SEASONS.find((option) => option.season === season)!;
  const icon = position.elevation > 0 ? current.icon : NIGHT_ICON;

  return (
    <section className={open ? 'sun-clock sun-clock-open' : 'sun-clock'} aria-label="Sun">
      <button
        type="button"
        className="sun-clock-summary"
        aria-expanded={open}
        title={open ? 'Hide the sun settings' : 'Change the time of day and season'}
        onClick={() => setOpen(!open)}
      >
        <span aria-hidden>{icon}</span>
        <span className="sun-clock-time">{formatTime(minutes)}</span>
        {open && (
          <span className="sun-clock-sky">
            {position.elevation > 0
              ? `${Math.round(position.elevation)}° from the ${compassPoint(position.azimuth)}`
              : 'Night'}
          </span>
        )}
      </button>
      {open && (
        <>
          <label htmlFor={timeId} className="visually-hidden">
            Time of day
          </label>
          <input
            id={timeId}
            type="range"
            min={0}
            max={MINUTES_PER_DAY - STEP_MINUTES}
            step={STEP_MINUTES}
            value={minutes}
            onChange={(event) => setSunMinutes(Number(event.target.value))}
          />
          <div className="segmented sun-clock-seasons" role="group" aria-label="Season">
            {SEASONS.map((option) => (
              <button
                key={option.season}
                type="button"
                aria-pressed={option.season === season}
                title={option.label}
                onClick={() => setSeason(option.season)}
              >
                <span aria-hidden>{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function formatTime(minutes: number): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}
