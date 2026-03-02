import { useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';

/**
 * Drop-in replacement for useState that persists value to localStorage.
 * - Hydrates from localStorage on mount (sync, avoids flash)
 * - Writes to localStorage on every change via useEffect
 * - Falls back to initialValue if localStorage is empty or corrupted
 */
export function usePersistedState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        return JSON.parse(saved) as T;
      }
    } catch {
      // Corrupted data — ignore and use initial
      logger.warn({ component: 'usePersistedState', action: 'parse' }, `Failed to parse "${key}", using initial value.`);
    }
    return initialValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      logger.warn({ component: 'usePersistedState', action: 'save' }, `Failed to save "${key}" to localStorage.`);
    }
  }, [key, value]);

  const resetValue = useCallback(() => {
    setValue(initialValue);
    localStorage.removeItem(key);
  }, [key, initialValue]);

  return [value, setValue, resetValue] as const;
}

