import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import * as driveService from '../services/googleDriveService';
import type { SyncStatus } from '../types';

const EXPORT_KEYS = ['mp-ingredients', 'mp-dishes', 'mp-day-plans', 'mp-user-profile'];
const DEBOUNCE_DELAY_MS = 3000;
const LAST_SYNC_KEY = 'mp-last-sync-at';

const buildExportData = (): Record<string, unknown> => {
  const data: Record<string, unknown> = {};
  for (const key of EXPORT_KEYS) {
    const value = localStorage.getItem(key);
    if (value) data[key] = JSON.parse(value);
  }
  data._syncedAt = new Date().toISOString();
  data._version = '1.0';
  return data;
};

interface UseAutoSyncOptions {
  ingredients: unknown[];
  dishes: unknown[];
  dayPlans: unknown[];
  userProfile: unknown;
  onImportData: (data: Record<string, unknown>) => void;
}

interface UseAutoSyncReturn {
  syncStatus: SyncStatus;
  lastSyncAt: string | null;
  triggerUpload: () => Promise<void>;
  triggerDownload: () => Promise<void>;
}

export const useAutoSync = (options: UseAutoSyncOptions): UseAutoSyncReturn => {
  const { accessToken, user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(() =>
    localStorage.getItem(LAST_SYNC_KEY),
  );

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUploadingRef = useRef(false);
  const initializedRef = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const updateLastSync = useCallback((timestamp: string) => {
    setLastSyncAt(timestamp);
    localStorage.setItem(LAST_SYNC_KEY, timestamp);
  }, []);

  const triggerUpload = useCallback(async () => {
    if (!accessToken || isUploadingRef.current) return;
    isUploadingRef.current = true;
    setSyncStatus('uploading');
    try {
      const data = buildExportData();
      await driveService.uploadBackup(accessToken, data);
      const now = new Date().toISOString();
      updateLastSync(now);
      setSyncStatus('idle');
    } catch {
      setSyncStatus('error');
    } finally {
      isUploadingRef.current = false;
    }
  }, [accessToken, updateLastSync]);

  const triggerDownload = useCallback(async () => {
    if (!accessToken) return;
    setSyncStatus('downloading');
    try {
      const result = await driveService.downloadLatestBackup(accessToken);
      if (result) {
        optionsRef.current.onImportData(result.data);
        updateLastSync(new Date().toISOString());
      }
      setSyncStatus('idle');
    } catch {
      setSyncStatus('error');
    }
  }, [accessToken, updateLastSync]);

  // Sync on launch when authenticated
  useEffect(() => {
    if (!user || !accessToken || initializedRef.current) return;
    initializedRef.current = true;

    const syncOnLaunch = async () => {
      try {
        const result = await driveService.downloadLatestBackup(accessToken);
        if (result) {
          const remoteSyncTime = result.file.modifiedTime;
          const localSyncTime = localStorage.getItem(LAST_SYNC_KEY);
          if (!localSyncTime || remoteSyncTime > localSyncTime) {
            optionsRef.current.onImportData(result.data);
            updateLastSync(new Date().toISOString());
          }
        }
      } catch {
        // Silently fail sync-on-launch
      }
    };
    syncOnLaunch();
  }, [user, accessToken, updateLastSync]);

  // Auto-sync when data changes (debounced)
  useEffect(() => {
    if (!user || !accessToken || !initializedRef.current) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      triggerUpload();
    }, DEBOUNCE_DELAY_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    user,
    accessToken,
    options.ingredients,
    options.dishes,
    options.dayPlans,
    options.userProfile,
    triggerUpload,
  ]);

  // Reset when user signs out
  useEffect(() => {
    if (!user) {
      initializedRef.current = false;
      setLastSyncAt(null);
      setSyncStatus('idle');
    }
  }, [user]);

  return { syncStatus, lastSyncAt, triggerUpload, triggerDownload };
};
