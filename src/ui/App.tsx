import { useEffect } from 'react';
import { Viewport } from '../scene/Viewport';
import { useApartmentStore } from '../state/apartmentStore';
import { CameraToolbar } from './CameraToolbar';
import { ConfigPanel } from './ConfigPanel';
import { ProjectBar } from './ProjectBar';
import { useProject } from './useProject';

const DEFAULT_PROJECT = 'pilot-bedroom';
const projectId = new URLSearchParams(window.location.search).get('project') ?? DEFAULT_PROJECT;

export function App() {
  const project = useProject(projectId);
  const load = useApartmentStore((state) => state.load);
  const select = useApartmentStore((state) => state.select);

  useEffect(() => {
    if (project.status === 'ready') {
      load(project.apartment);
    }
  }, [project, load]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        select(undefined);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [select]);

  return (
    <div className="app">
      <Viewport />
      <ProjectBar />
      <CameraToolbar />
      <ConfigPanel />
      {project.status === 'loading' && <div className="overlay">Loading…</div>}
      {project.status === 'error' && (
        <div className="overlay overlay-error">
          <strong>Could not open the project</strong>
          <ul>
            {project.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
