import { useApartmentStore } from '../state/apartmentStore';
import { downloadApartment } from '../state/serializeApartment';

interface ProjectBarProps {
  origin?: string;
  onBack: () => void;
  onVariant: (variantId: string | undefined) => void;
}

const BASE_LABEL = "Developer's plan";

export function ProjectBar({ origin, onBack, onVariant }: ProjectBarProps) {
  const apartment = useApartmentStore((state) => state.apartment);
  const source = useApartmentStore((state) => state.source);
  const base = useApartmentStore((state) => state.base);
  const variantId = useApartmentStore((state) => state.variantId);
  const variants = base?.variants ?? [];
  const activeVariant = variants.find((variant) => variant.id === variantId);

  if (!apartment) {
    return null;
  }

  const modified = apartment !== source;

  return (
    <div className="project-bar">
      <button type="button" onClick={onBack} aria-label="Back to projects" title="Back to projects">
        ←
      </button>
      <span className="project-name" title={origin ? `Opened from ${origin}` : undefined}>
        {base?.name ?? apartment.name}
        {origin && <span className="project-origin"> · {origin}</span>}
      </span>
      {variants.length > 0 && (
        <select
          className="variant-select"
          aria-label="Variant"
          title={activeVariant?.description ?? 'Compare versions of this apartment'}
          value={variantId ?? ''}
          onChange={(event) => onVariant(event.target.value || undefined)}
        >
          <option value="">{BASE_LABEL}</option>
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.name}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        onClick={() => downloadApartment(apartment)}
        title="Download the apartment with your changes as JSON"
      >
        Export JSON{modified && <span className="modified-dot" aria-label="(modified)" />}
      </button>
    </div>
  );
}
