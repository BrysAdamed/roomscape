import { useEffect, useState } from 'react';
import { SHOWROOM_DESCRIPTION, SHOWROOM_ID } from '../catalogue/showroom';
import type { Apartment } from '../schema/apartment';
import { PlanThumbnail } from './PlanThumbnail';
import { fetchApartment, fetchProjectIndex } from './projects';

interface Entry {
  id: string;
  description?: string;
  apartment?: Apartment;
}

type PickerState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; entries: Entry[] };

interface ProjectPickerProps {
  onOpen: (projectId: string) => void;
  onOpenFile: (file: File) => void;
}

export function ProjectPicker({ onOpen, onOpenFile }: ProjectPickerProps) {
  const [state, setState] = useState<PickerState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    fetchProjectIndex(controller.signal)
      .then((index) =>
        Promise.all(
          [...index.projects, { id: SHOWROOM_ID, description: SHOWROOM_DESCRIPTION }].map(
            async (project) => {
              const result = await fetchApartment(project.id, controller.signal);
              return { ...project, apartment: result.success ? result.apartment : undefined };
            },
          ),
        ),
      )
      .then((entries) => setState({ status: 'ready', entries }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setState({ status: 'error', message: String(error) });
        }
      });
    return () => controller.abort();
  }, []);

  return (
    <main className="picker">
      <header className="picker-header">
        <h1>Roomscape</h1>
        <label className="button">
          Open exported JSON…
          <input
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onOpenFile(file);
              }
            }}
          />
        </label>
      </header>
      <p className="hint picker-hint">Pick an apartment, or drop an exported JSON file anywhere.</p>
      {state.status === 'loading' && <p>Loading projects…</p>}
      {state.status === 'error' && <p className="overlay-error">{state.message}</p>}
      {state.status === 'ready' && (
        <ul className="picker-grid">
          {state.entries.map((entry) => (
            <li key={entry.id}>
              <button type="button" className="picker-card" onClick={() => onOpen(entry.id)}>
                {entry.apartment?.floors[0] && <PlanThumbnail floor={entry.apartment.floors[0]} />}
                <strong>{entry.apartment?.name ?? entry.id}</strong>
                {entry.description && <span>{entry.description}</span>}
                {entry.apartment && (
                  <span className="picker-meta">
                    {entry.apartment.floors.map((floor) => floor.name).join(' · ')}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
