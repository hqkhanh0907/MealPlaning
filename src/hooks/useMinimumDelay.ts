import { useEffect, useState, useSyncExternalStore } from 'react';

const DEFAULT_MIN_DELAY = 200;

interface MinDelayStore {
  subscribe: (cb: () => void) => () => void;
  getSnapshot: () => boolean;
  startLoading: () => void;
  stopLoading: (minDelay: number) => void;
  cleanup: () => void;
}

function createMinDelayStore(): MinDelayStore {
  let showSkeleton = false;
  let loadStart = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();

  function notify() {
    for (const cb of listeners) cb();
  }

  return {
    subscribe(cb: () => void) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },

    getSnapshot() {
      return showSkeleton;
    },

    startLoading() {
      loadStart = Date.now();
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      if (!showSkeleton) {
        showSkeleton = true;
        notify();
      }
    },

    stopLoading(minDelay: number) {
      if (loadStart <= 0) return;

      const elapsed = Date.now() - loadStart;
      const remaining = Math.max(0, minDelay - elapsed);
      loadStart = 0;

      if (remaining > 0) {
        timer = setTimeout(() => {
          showSkeleton = false;
          timer = null;
          notify();
        }, remaining);
      } else if (showSkeleton) /* v8 ignore next -- defensive: showSkeleton always true when loadStart > 0 */ {
        showSkeleton = false;
        notify();
      }
    },

    cleanup() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      listeners.clear();
    },
  };
}

export function useMinimumDelay(isLoading: boolean, minDelay: number = DEFAULT_MIN_DELAY): boolean {
  const [store] = useState(createMinDelayStore);

  useEffect(() => {
    if (isLoading) {
      store.startLoading();
    } else {
      store.stopLoading(minDelay);
    }
  }, [isLoading, minDelay, store]);

  useEffect(() => () => store.cleanup(), [store]);

  const graceActive = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return isLoading || graceActive;
}
