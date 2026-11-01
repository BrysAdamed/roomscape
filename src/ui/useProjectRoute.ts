import { useCallback, useSyncExternalStore } from 'react';

const PROJECT = 'project';
const VARIANT = 'variant';

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
}

function param(name: string): string | undefined {
  return new URLSearchParams(window.location.search).get(name) ?? undefined;
}

function navigate(change: (params: URLSearchParams) => void) {
  const url = new URL(window.location.href);
  change(url.searchParams);
  window.history.pushState(null, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function setParam(params: URLSearchParams, name: string, value: string | undefined) {
  if (value) {
    params.set(name, value);
  } else {
    params.delete(name);
  }
}

export interface ProjectRoute {
  projectId: string | undefined;
  variantId: string | undefined;
  openProject: (projectId: string | undefined) => void;
  openVariant: (variantId: string | undefined) => void;
}

/** The project and variant in the URL (`?project=<id>&variant=<id>`), so a view can be bookmarked. */
export function useProjectRoute(): ProjectRoute {
  const projectId = useSyncExternalStore(subscribe, () => param(PROJECT));
  const variantId = useSyncExternalStore(subscribe, () => param(VARIANT));
  const openProject = useCallback(
    (next: string | undefined) =>
      navigate((params) => {
        setParam(params, PROJECT, next);
        params.delete(VARIANT);
      }),
    [],
  );
  const openVariant = useCallback(
    (next: string | undefined) => navigate((params) => setParam(params, VARIANT, next)),
    [],
  );
  return { projectId, variantId, openProject, openVariant };
}
