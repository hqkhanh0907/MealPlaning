import { AlertCircle, CheckCircle, Cloud, Download, Loader2, LogOut, Upload } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useDatabase } from '../contexts/DatabaseContext';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../hooks/useAuth';
import { deleteSetting, getSetting, setSetting } from '../services/appSettings';
import * as driveService from '../services/googleDriveService';
import { reloadAllStores } from '../services/storeLoader';
import type { SyncStatus } from '../types';
import { SyncConflictModal } from './modals/SyncConflictModal';

export const GoogleDriveSync = () => {
  const { t } = useTranslation();
  const { user, accessToken, isLoading: authLoading, signIn, signOut } = useAuth();
  const notify = useNotification();
  const db = useDatabase();

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [conflictData, setConflictData] = useState<{
    remoteData: Uint8Array;
    remoteModifiedTime: string;
  } | null>(null);

  useEffect(() => {
    getSetting(db, 'last_sync_at')
      .then(v => {
        setLastSyncAt(v);
      })
      .catch(() => {});
  }, [db]);

  const isSyncing = syncStatus === 'uploading' || syncStatus === 'downloading';

  const handleSignIn = useCallback(async () => {
    try {
      await signIn();
      notify.success(t('cloudSync.signInSuccess'));
    } catch {
      notify.error(t('cloudSync.signInError'));
    }
  }, [signIn, notify, t]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setLastSyncAt(null);
    deleteSetting(db, 'last_sync_at').catch(() => {});
    notify.success(t('cloudSync.signOutSuccess'));
  }, [signOut, notify, t, db]);

  const updateLastSync = useCallback(
    (timestamp: string) => {
      setLastSyncAt(timestamp);
      setSetting(db, 'last_sync_at', timestamp).catch(() => {});
    },
    [db],
  );

  const handleUpload = useCallback(async () => {
    if (!accessToken) return;
    setSyncStatus('uploading');
    try {
      const data = db.exportBinary();
      const result = await driveService.uploadBackup(accessToken, data);
      updateLastSync(result.modifiedTime);
      setSyncStatus('idle');
      notify.success(t('cloudSync.uploadSuccess'));
    } catch {
      setSyncStatus('error');
      notify.error(t('cloudSync.uploadError'));
    }
  }, [accessToken, db, notify, t, updateLastSync]);

  const handleDownload = useCallback(async () => {
    if (!accessToken) return;
    setSyncStatus('downloading');
    try {
      const result = await driveService.downloadLatestBackup(accessToken);
      if (!result) {
        setSyncStatus('idle');
        notify.warning(t('cloudSync.noBackupFound'));
        return;
      }
      const storedSyncTime = await getSetting(db, 'last_sync_at');
      const remoteSyncTime = result.file.modifiedTime;

      if (storedSyncTime && remoteSyncTime < storedSyncTime) {
        setConflictData({
          remoteData: result.data,
          remoteModifiedTime: remoteSyncTime,
        });
        setSyncStatus('idle');
        return;
      }

      await db.importBinary(result.data);
      await reloadAllStores(db);
      updateLastSync(remoteSyncTime);
      setSyncStatus('idle');
      notify.success(t('cloudSync.downloadSuccess'));
    } catch {
      setSyncStatus('error');
      notify.error(t('cloudSync.downloadError'));
    }
  }, [accessToken, db, notify, t, updateLastSync]);

  const handleConflictResolve = useCallback(
    async (choice: 'local' | 'cloud') => {
      if (choice === 'cloud' && conflictData) {
        try {
          await db.importBinary(conflictData.remoteData);
          await reloadAllStores(db);
          updateLastSync(conflictData.remoteModifiedTime);
          notify.success(t('cloudSync.downloadSuccess'));
        } catch {
          notify.error(t('cloudSync.downloadError'));
        }
      }
      setConflictData(null);
    },
    [conflictData, db, notify, t, updateLastSync],
  );

  const statusIcon = useMemo(() => {
    if (syncStatus === 'uploading' || syncStatus === 'downloading') {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (syncStatus === 'error') {
      return <AlertCircle className="text-destructive h-4 w-4" />;
    }
    if (lastSyncAt) {
      return <CheckCircle className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />;
    }
    return null;
  }, [syncStatus, lastSyncAt]);

  const formattedSyncTime = useMemo(() => {
    if (!lastSyncAt) return null;
    return new Date(lastSyncAt).toLocaleString();
  }, [lastSyncAt]);

  if (!user) {
    return (
      <div
        data-testid="cloud-sync-signed-out"
        className="bg-card rounded-2xl border border-slate-100 p-4 shadow-sm sm:p-5 dark:border-slate-700"
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-900/30">
            <Cloud className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('cloudSync.title')}</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t('cloudSync.description')}</p>
          </div>
        </div>
        <button
          data-testid="btn-google-sign-in"
          onClick={handleSignIn}
          disabled={authLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-blue-400 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-blue-500"
        >
          {authLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          {t('cloudSync.signInWithGoogle')}
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="cloud-sync-signed-in"
      className="bg-card rounded-2xl border border-slate-100 p-4 shadow-sm sm:p-5 dark:border-slate-700"
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-900/30">
          <Cloud className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('cloudSync.title')}</h3>
          <div className="mt-1 flex items-center gap-2">
            {user.photoUrl && <img src={user.photoUrl} alt="" className="h-5 w-5 rounded-full" />}
            <span className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <button
          data-testid="btn-upload-drive"
          onClick={handleUpload}
          disabled={isSyncing}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-600 disabled:opacity-50"
        >
          {syncStatus === 'uploading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {t('cloudSync.uploadToDrive')}
        </button>

        <button
          data-testid="btn-download-drive"
          onClick={handleDownload}
          disabled={isSyncing}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
        >
          {syncStatus === 'downloading' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {t('cloudSync.downloadFromDrive')}
        </button>
      </div>

      {(formattedSyncTime || syncStatus === 'error') && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {statusIcon}
          {syncStatus === 'error' ? (
            <span className="text-destructive">{t('cloudSync.syncError')}</span>
          ) : (
            <span>
              {t('cloudSync.lastSync')}: {formattedSyncTime}
            </span>
          )}
        </div>
      )}

      <button
        data-testid="btn-google-sign-out"
        onClick={handleSignOut}
        className="hover:text-destructive mt-3 flex w-full items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-500 transition-colors dark:text-slate-400"
      >
        <LogOut className="h-3.5 w-3.5" />
        {t('cloudSync.signOut')}
      </button>

      {conflictData && (
        <SyncConflictModal
          localTime={lastSyncAt ?? new Date().toISOString()}
          remoteTime={conflictData.remoteModifiedTime}
          onResolve={handleConflictResolve}
          onClose={() => setConflictData(null)}
        />
      )}
    </div>
  );
};
