import { useCallback, useEffect, useState } from 'react';
import { SHOWROOM_ID } from '../catalogue/showroom';
import { Viewport } from '../scene/Viewport';
import { findElement } from '../state/apartmentEdits';
import { useApartmentStore } from '../state/apartmentStore';
import { useViewerStore } from '../state/viewerStore';
import { CameraToolbar } from './CameraToolbar';
import { Compass } from './Compass';
import { ConfigPanel } from './ConfigPanel';
import { HelpPanel } from './HelpPanel';
import { FloorSwitcher } from './FloorSwitcher';
import { ProjectBar } from './ProjectBar';
import { ProjectPicker } from './ProjectPicker';
import { SunClock } from './SunClock';
import { parseApartmentFile, type LoadResult } from './projects';
import { useFileDrop } from './useFileDrop';
import { useProject } from './useProject';
import { useProjectRoute } from './useProjectRoute';

interface OpenedFile {
  name: string;
  result: LoadResult;
}

export function App() {
  const { projectId, variantId, openProject: navigate, openVariant } = useProjectRoute();
  const [file, setFile] = useState<OpenedFile>();
  const project = useProject(file ? undefined : projectId);
  const load = useApartmentStore((state) => state.load);
  const base = useApartmentStore((state) => state.base);
  const setVariant = useApartmentStore((state) => state.setVariant);
  const select = useApartmentStore((state) => state.select);
  const panelOpen = useApartmentStore(
    (state) =>
      state.apartment !== undefined &&
      state.selectedId !== undefined &&
      findElement(state.apartment, state.selectedId) !== undefined,
  );

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
      if (apartment.id === SHOWROOM_ID) {
        useViewerStore.getState().setShowLabels(true);
      }
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

  useEffect(() => {
    if (base) {
      setVariant(variantId);
    }
  }, [base, variantId, setVariant]);

  const showViewer = apartment !== undefined && base === apartment;
  const showPicker = !apartment && !projectId && !errors;

  return (
    <div className="app">
      {showPicker && <ProjectPicker onOpen={openProject} onOpenFile={openFile} />}
      {showViewer && (
        <>
          <Viewport />
          <div className="top-left">
            <ProjectBar
              origin={file?.name}
              onBack={() => openProject(undefined)}
              onVariant={openVariant}
            />
            <FloorSwitcher />
          </div>
          <CameraToolbar />
          <div className={panelOpen ? 'top-right with-panel' : 'top-right'}>
            <SunClock />
            <Compass />
          </div>
          <div className="side-column">
            <ConfigPanel />
            <HelpPanel />
          </div>
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
