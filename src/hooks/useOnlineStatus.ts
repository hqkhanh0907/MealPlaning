import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to detect online/offline status.
 * Returns current online state and provides a wrapper for async operations
 * that checks connectivity before execution.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof globalThis !== 'undefined' && 'onLine' in navigator ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    globalThis.addEventListener('online', handleOnline);
    globalThis.addEventListener('offline', handleOffline);

    return () => {
      globalThis.removeEventListener('online', handleOnline);
      globalThis.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Guard that throws a user-friendly error if offline.
   * Use before AI API calls.
   */
  const requireOnline = useCallback(() => {
    if (!navigator.onLine) {
      throw new Error('Không có kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.');
    }
  }, []);

  return { isOnline, requireOnline };
}

