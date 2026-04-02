import { useEffect } from 'react';

import { initBackNavigation } from '../services/backNavigationService';

/**
 * Initialize centralized back navigation service.
 * Must be called ONCE at the root App component.
 * Registers the single popstate + Capacitor backButton listener.
 */
export function useAppBackHandler(): void {
  useEffect(() => {
    const cleanup = initBackNavigation();
    return cleanup;
  }, []);
}
