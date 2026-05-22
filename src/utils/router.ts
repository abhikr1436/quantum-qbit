import { useState, useEffect } from 'react';

// Custom event key for history pushState changes
export const NAVIGATE_EVENT = 'app-navigate';

/**
 * Programmatically navigate to a path without full page reload.
 * Triggers a custom event so usePath() hook reacts.
 */
export function navigate(path: string) {
  // Only push if path changes to prevent double-pushing same route
  if (window.location.pathname !== path) {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new Event(NAVIGATE_EVENT));
  }
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * React hook to subscribe to the window pathname.
 * Responds to browser back/forward buttons (popstate) and programmatic navigate calls.
 */
export function usePath(): string {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener(NAVIGATE_EVENT, handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener(NAVIGATE_EVENT, handleLocationChange);
    };
  }, []);

  return path;
}
