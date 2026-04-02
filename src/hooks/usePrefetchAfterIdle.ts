import { useEffect, useRef } from 'react';

/**
 * Schedule a single preload function using requestIdleCallback (with fallback to setTimeout).
 */
const schedulePreload = (fn: () => Promise<unknown>): void => {
  if ('requestIdleCallback' in globalThis) {
    requestIdleCallback(
      () => {
        void fn();
      },
      { timeout: 5000 },
    );
  } else {
    setTimeout(() => {
      void fn();
    }, 100);
  }
};

/**
 * Prefetch lazy-loaded chunks after the browser has been idle for a specified delay.
 * Uses `requestIdleCallback` when available, falling back to `setTimeout`.
 */
export function usePrefetchAfterIdle(preloadFns: Array<() => Promise<unknown>>, delay = 2000): void {
  const prefetched = useRef(false);

  useEffect(() => {
    if (prefetched.current) return;

    const prefetch = () => {
      if (prefetched.current) return;
      prefetched.current = true;
      preloadFns.forEach(schedulePreload);
    };

    const timeoutId = setTimeout(prefetch, delay);
    return () => clearTimeout(timeoutId);
  }, [preloadFns, delay]);
}
