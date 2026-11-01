import { useId } from 'react';
import { compassPoint } from '../scene/lighting/solar';
import { DEFAULT_LOCATION, useSun } from '../scene/lighting/useSun';
import { useApartmentStore } from '../state/apartmentStore';
import { localDate, useViewerStore } from '../state/viewerStore';

const STEP_MINUTES = 5;
const MINUTES_PER_DAY = 24 * 60;

export function SunClock() {
  const timeId = useId();
  const dateId = useId();
  const date = useViewerStore((state) => state.sunDate);
  const minutes = useViewerStore((state) => state.sunMinutes);
  const setSunTime = useViewerStore((state) => state.setSunTime);
  const timeZone = useApartmentStore(
    (state) => state.apartment?.location?.timeZone ?? DEFAULT_LOCATION.timeZone,
  );
  const { position } = useSun();

  const setNow = () => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(now);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((candidate) => candidate.type === type)?.value ?? '00';
    setSunTime(
      `${part('year')}-${part('month')}-${part('day')}`,
      Number(part('hour')) * 60 + Number(part('minute')),
    );
  };

  return (
    <section className="sun-clock" aria-label="Sun position">
      <div className="sun-clock-row">
        <label htmlFor={timeId} className="sun-clock-time">
          {formatTime(minutes)}
        </label>
        <span className="sun-clock-sky">
          {position.elevation > 0
            ? `Sun ${Math.round(position.elevation)}° high, from the ${compassPoint(position.azimuth)}`
            : 'Night'}
        </span>
      </div>
      <input
        id={timeId}
        type="range"
        min={0}
        max={MINUTES_PER_DAY - STEP_MINUTES}
        step={STEP_MINUTES}
        value={minutes}
        onChange={(event) => setSunTime(date, Number(event.target.value))}
      />
      <div className="sun-clock-row">
        <label htmlFor={dateId} className="visually-hidden">
          Date
        </label>
        <input
          id={dateId}
          type="date"
          value={date}
          onChange={(event) => setSunTime(event.target.value || localDate(new Date()), minutes)}
        />
        <button type="button" onClick={setNow}>
          Now
        </button>
      </div>
    </section>
  );
}

function formatTime(minutes: number): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}
