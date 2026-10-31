import { useApartmentStore } from '../state/apartmentStore';
import { downloadApartment } from '../state/serializeApartment';

export function ProjectBar() {
  const apartment = useApartmentStore((state) => state.apartment);
  const source = useApartmentStore((state) => state.source);

  if (!apartment) {
    return null;
  }

  const modified = apartment !== source;

  return (
    <div className="project-bar">
      <span className="project-name">{apartment.name}</span>
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
