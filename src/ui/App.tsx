import { useCallback, useEffect, useState } from 'react';
import { Viewport } from '../scene/Viewport';
import { useApartmentStore } from '../state/apartmentStore';
import { useViewerStore } from '../state/viewerStore';
import { CameraToolbar } from './CameraToolbar';
import { ConfigPanel } from './ConfigPanel';
import { FloorSwitcher } from './FloorSwitcher';
import { ProjectBar } from './ProjectBar';
import { ProjectPicker } from './ProjectPicker';
import { parseApartmentFile, type LoadResult } from './projects';
import { useFileDrop } from './useFileDrop';
import { useProject } from './useProject';
import { useProjectRoute } from './useProjectRoute';

interface OpenedFile {
  name: string;
  result: LoadResult;
}

export function App() {
  const [projectId, navigate] = useProjectRoute();
  const [file, setFile] = useState<OpenedFile>();
  const project = useProject(file ? undefined : projectId);
  const load = useApartmentStore((state) => state.load);
  const source = useApartmentStore((state) => state.source);
  const select = useApartmentStore((state) => state.select);

  const openFile = useCallback(async (opened: File) => {
    setFile({ name: opened.name, result: parseApartmentFile(await opened.text()) });
  }, []);
  const openProject = useCallback(
    (id: string | undefined) => {
      setFile(undefined);
      navigate(id);
    },
    [navigate],
  );
  const dragging = useFileDrop(openFile);

  const apartment = file?.result.success
    ? file.result.apartment
    : project.status === 'ready'
      ? project.apartment
      : undefined;
  const errors =
    file && !file.result.success
      ? file.result.errors
      : project.status === 'error'
        ? project.errors
        : undefined;

  useEffect(() => {
    if (apartment) {
      load(apartment);
    }
  }, [apartment, load]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        select(undefined);
        useViewerStore.getState().clearMeasurements();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [select]);

  const showViewer = apartment !== undefined && source === apartment;
  const showPicker = !apartment && !projectId && !errors;

  return (
    <div className="app">
      {showPicker && <ProjectPicker onOpen={openProject} onOpenFile={openFile} />}
      {showViewer && (
        <>
          <Viewport />
          <ProjectBar origin={file?.name} onBack={() => openProject(undefined)} />
          <FloorSwitcher />
          <CameraToolbar />
          <ConfigPanel />
        </>
      )}
      {project.status === 'loading' && <div className="overlay">Loading…</div>}
      {errors && (
        <div className="overlay overlay-error" role="alert">
          <strong>{file ? `Could not open ${file.name}` : 'Could not open the project'}</strong>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
          <button type="button" onClick={() => openProject(undefined)}>
            Back to projects
          </button>
        </div>
      )}
      {dragging && <div className="drop-hint">Drop an exported apartment JSON to open it</div>}
    </div>
  );
}
