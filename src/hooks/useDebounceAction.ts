import { useCallback, useEffect, useRef } from 'react';

const DEFAULT_DELAY = 200;

export function useDebounceAction(action: () => void, delay: number = DEFAULT_DELAY): () => void {
  const lastCallRef = useRef<number>(0);
  const actionRef = useRef(action);
  const mountedRef = useRef(true);

  useEffect(() => {
    actionRef.current = action;
  }, [action]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return useCallback(() => {
    if (!mountedRef.current) return;

    const now = Date.now();
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      actionRef.current();
    }
  }, [delay]);
}
