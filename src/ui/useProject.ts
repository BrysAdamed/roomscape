import { useEffect, useState } from 'react';
import type { Apartment } from '../schema/apartment';
import { validateApartment } from '../schema/validate';

export type ProjectState =
  | { status: 'loading' }
  | { status: 'error'; errors: string[] }
  | { status: 'ready'; apartment: Apartment };

export function useProject(projectId: string): ProjectState {
  const [state, setState] = useState<ProjectState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    loadProject(projectId, controller.signal)
      .then(setState)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setState({ status: 'error', errors: [String(error)] });
        }
      });
    return () => controller.abort();
  }, [projectId]);

  return state;
}

async function loadProject(projectId: string, signal: AbortSignal): Promise<ProjectState> {
  const response = await fetch(`projects/${projectId}.json`, { signal });
  if (!response.ok) {
    return {
      status: 'error',
      errors: [`Could not load project '${projectId}' (${response.status})`],
    };
  }
  const result = validateApartment(await response.json());
  return result.success
    ? { status: 'ready', apartment: result.apartment }
    : { status: 'error', errors: result.errors };
}
