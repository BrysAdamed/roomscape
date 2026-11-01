import { useEffect, useState } from 'react';
import type { Apartment } from '../schema/apartment';
import { fetchApartment } from './projects';

export type ProjectState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; errors: string[] }
  | { status: 'ready'; apartment: Apartment };

export function useProject(projectId: string | undefined): ProjectState {
  const [state, setState] = useState<{ id: string; result: ProjectState }>();

  useEffect(() => {
    if (!projectId) {
      return;
    }
    const controller = new AbortController();
    fetchApartment(projectId, controller.signal)
      .then((result) =>
        setState({
          id: projectId,
          result: result.success
            ? { status: 'ready', apartment: result.apartment }
            : { status: 'error', errors: result.errors },
        }),
      )
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setState({ id: projectId, result: { status: 'error', errors: [String(error)] } });
        }
      });
    return () => controller.abort();
  }, [projectId]);

  if (!projectId) {
    return { status: 'idle' };
  }
  return state?.id === projectId ? state.result : { status: 'loading' };
}
