import { Viewport } from '../scene/Viewport';
import { useProject } from './useProject';

const DEFAULT_PROJECT = 'pilot-bedroom';

export function App() {
  const project = useProject(DEFAULT_PROJECT);

  return (
    <div className="app">
      <Viewport apartment={project.status === 'ready' ? project.apartment : undefined} />
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
