import { useState, useEffect } from 'react';

const DESKTOP_BREAKPOINT = 1024;

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () => globalThis.matchMedia?.(`(min-width: ${DESKTOP_BREAKPOINT}px)`).matches ?? false
  );

  useEffect(() => {
    const mql = globalThis.matchMedia?.(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    if (!mql) return;
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isDesktop;
}
