import { useEffect, useRef } from 'react';

/**
 * Prefetch lazy-loaded chunks after the browser has been idle for a specified delay.
 * Uses `requestIdleCallback` when available, falling back to `setTimeout`.
 */
export function usePrefetchAfterIdle(
  preloadFns: Array<() => Promise<unknown>>,
  delay = 2000,
): void {
  const prefetched = useRef(false);

  useEffect(() => {
    if (prefetched.current) return;

    const prefetch = () => {
      if (prefetched.current) return;
      prefetched.current = true;

      preloadFns.forEach((fn) => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => fn(), { timeout: 5000 });
        } else {
          setTimeout(fn, 100);
        }
      });
    };

    const timeoutId = setTimeout(prefetch, delay);
    return () => clearTimeout(timeoutId);
  }, [preloadFns, delay]);
}
