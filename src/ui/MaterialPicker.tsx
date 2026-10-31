import { useId } from 'react';
import { materialsInCategories, type MaterialCategory } from '../catalogue/materials';
import { CUSTOM_COLOR_PATTERN } from '../schema/apartment';

interface MaterialPickerProps {
  label: string;
  value: string;
  categories: readonly MaterialCategory[];
  onChange: (ref: string) => void;
}

const DEFAULT_CUSTOM_COLOR = '#d9c9b0';

export function MaterialPicker({ label, value, categories, onChange }: MaterialPickerProps) {
  const colorInputId = useId();
  const options = materialsInCategories(categories);
  const isCustom = CUSTOM_COLOR_PATTERN.test(value);
  const current = isCustom ? 'Custom colour' : options.find((option) => option.id === value)?.name;

  return (
    <fieldset className="material-picker">
      <legend>
        {label}
        <span className="material-current">{current ?? value}</span>
      </legend>
      <div className="swatches">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className="swatch"
            title={option.name}
            aria-label={option.name}
            aria-pressed={option.id === value}
            style={{ background: option.color }}
            onClick={() => onChange(option.id)}
          />
        ))}
      </div>
      <label className="custom-color" htmlFor={colorInputId}>
        <input
          id={colorInputId}
          type="color"
          value={isCustom ? value : DEFAULT_CUSTOM_COLOR}
          onChange={(event) => onChange(event.target.value.toLowerCase())}
        />
        Custom colour
      </label>
    </fieldset>
  );
}
