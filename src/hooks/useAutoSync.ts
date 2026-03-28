import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { useDatabase } from '../contexts/DatabaseContext';
import * as driveService from '../services/googleDriveService';
import { getSetting, setSetting } from '../services/appSettings';
import { reloadAllStores } from '../services/storeLoader';
import { useIngredientStore } from '../store/ingredientStore';
import { useDishStore } from '../store/dishStore';
import { useDayPlanStore } from '../store/dayPlanStore';
import { useMealTemplateStore } from '../store/mealTemplateStore';
import type { SyncStatus } from '../types';

const DEBOUNCE_DELAY_MS = 3000;

interface UseAutoSyncReturn {
  syncStatus: SyncStatus;
  lastSyncAt: string | null;
  triggerUpload: () => Promise<void>;
  triggerDownload: () => Promise<void>;
}

export const useAutoSync = (): UseAutoSyncReturn => {
  const { accessToken, user } = useAuth();
  const db = useDatabase();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUploadingRef = useRef(false);
  const initializedRef = useRef(false);
  const dbRef = useRef(db);
  dbRef.current = db;

  const ingredients = useIngredientStore(s => s.ingredients);
  const dishes = useDishStore(s => s.dishes);
  const dayPlans = useDayPlanStore(s => s.dayPlans);
  const templates = useMealTemplateStore(s => s.templates);

  useEffect(() => {
    getSetting(db, 'last_sync_at').then(v => { setLastSyncAt(v); }).catch(() => {});
  }, [db]);

  const updateLastSync = useCallback(async (timestamp: string) => {
    setLastSyncAt(timestamp);
    await setSetting(dbRef.current, 'last_sync_at', timestamp).catch(() => {});
  }, []);

  const triggerUpload = useCallback(async () => {
    if (!accessToken || isUploadingRef.current) return;
    isUploadingRef.current = true;
    setSyncStatus('uploading');
    try {
      const data = dbRef.current.exportBinary();
      const result = await driveService.uploadBackup(accessToken, data);
      await updateLastSync(result.modifiedTime);
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
        await dbRef.current.importBinary(result.data);
        await reloadAllStores(dbRef.current);
        await updateLastSync(result.file.modifiedTime);
      }
      setSyncStatus('idle');
    } catch {
      setSyncStatus('error');
    }
  }, [accessToken, updateLastSync]);

  useEffect(() => {
    if (!user || !accessToken || initializedRef.current) return;
    initializedRef.current = true;

    const syncOnLaunch = async () => {
      try {
        const result = await driveService.downloadLatestBackup(accessToken);
        if (result) {
          const remoteSyncTime = result.file.modifiedTime;
          const localSyncTime = await getSetting(dbRef.current, 'last_sync_at');
          if (!localSyncTime || remoteSyncTime > localSyncTime) {
            await dbRef.current.importBinary(result.data);
            await reloadAllStores(dbRef.current);
            await updateLastSync(remoteSyncTime);
          }
        }
      } catch {
        // Silently fail sync-on-launch
      }
    };
    syncOnLaunch();
  }, [user, accessToken, updateLastSync]);

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
    ingredients,
    dishes,
    dayPlans,
    templates,
    triggerUpload,
  ]);

  useEffect(() => {
    if (!user) {
      initializedRef.current = false;
      setLastSyncAt(null);
      setSyncStatus('idle');
    }
  }, [user]);

  return { syncStatus, lastSyncAt, triggerUpload, triggerDownload };
};
