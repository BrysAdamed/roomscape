import { useCallback, useSyncExternalStore } from 'react';

const PARAM = 'project';

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
}

function currentProject(): string | undefined {
  return new URLSearchParams(window.location.search).get(PARAM) ?? undefined;
}

/** The project id in the URL (`?project=<id>`), so a project can be bookmarked. */
export function useProjectRoute(): [string | undefined, (projectId: string | undefined) => void] {
  const projectId = useSyncExternalStore(subscribe, currentProject);
  const navigate = useCallback((next: string | undefined) => {
    const url = new URL(window.location.href);
    if (next) {
      url.searchParams.set(PARAM, next);
    } else {
      url.searchParams.delete(PARAM);
    }
    window.history.pushState(null, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);
  return [projectId, navigate];
}
