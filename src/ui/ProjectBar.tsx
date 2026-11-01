import { useApartmentStore } from '../state/apartmentStore';
import { downloadApartment } from '../state/serializeApartment';

interface ProjectBarProps {
  origin?: string;
  onBack: () => void;
}

export function ProjectBar({ origin, onBack }: ProjectBarProps) {
  const apartment = useApartmentStore((state) => state.apartment);
  const source = useApartmentStore((state) => state.source);

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
        {apartment.name}
        {origin && <span className="project-origin"> · {origin}</span>}
      </span>
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
