import { useId } from 'react';
import type { ParamControl } from '../catalogue/furniture/types';
import { formatLength } from '../scene/measure/format';

interface ParamSliderProps {
  control: ParamControl;
  params: Readonly<Record<string, number>>;
  onChange: (value: number) => void;
}

export function ParamSlider({ control, params, onChange }: ParamSliderProps) {
  const id = useId();
  const value = params[control.param] ?? control.min;
  const present = value >= 0;
  const max = control.max(params);
  const clamped = Math.min(max, Math.max(control.min, value));

  return (
    <div className="param-slider">
      <div className="param-slider-label">
        <label htmlFor={id}>{control.label}</label>
        {control.optional && (
          <label className="param-slider-toggle">
            <input
              type="checkbox"
              checked={present}
              onChange={(event) => onChange(event.target.checked ? (control.min + max) / 2 : -1)}
            />
            Show
          </label>
        )}
        <span className="material-current">{present ? formatLength(clamped) : 'None'}</span>
      </div>
      <input
        id={id}
        type="range"
        min={control.min}
        max={max}
        step={control.step}
        value={clamped}
        disabled={!present}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
