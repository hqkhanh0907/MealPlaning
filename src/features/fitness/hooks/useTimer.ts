import { useCallback, useEffect, useRef, useState } from 'react';

export function useTimer(autoStart = false) {
  const startTimeRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    if (!isRunning) return;
    startTimeRef.current ??= Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current!) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const start = useCallback(() => {
    startTimeRef.current = Date.now() - elapsed * 1000;
    setIsRunning(true);
  }, [elapsed]);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    startTimeRef.current = null;
    setIsRunning(false);
    setElapsed(0);
  }, []);

  return { elapsed, isRunning, start, stop, reset };
}
