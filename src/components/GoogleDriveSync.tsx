import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, Upload, Download, LogOut, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../contexts/NotificationContext';
import { SyncConflictModal } from './modals/SyncConflictModal';
import * as driveService from '../services/googleDriveService';
import type { SyncStatus } from '../types';

const EXPORT_KEYS = ['mp-ingredients', 'mp-dishes', 'mp-day-plans', 'mp-user-profile', 'meal-templates'];
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

interface GoogleDriveSyncProps {
  onImportData: (data: Record<string, unknown>) => void;
}

export const GoogleDriveSync: React.FC<GoogleDriveSyncProps> = ({ onImportData }) => {
  const { t } = useTranslation();
  const { user, accessToken, isLoading: authLoading, signIn, signOut } = useAuth();
  const notify = useNotification();

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(() =>
    localStorage.getItem(LAST_SYNC_KEY),
  );
  const [conflictData, setConflictData] = useState<{
    local: Record<string, unknown>;
    remote: Record<string, unknown>;
    remoteModifiedTime: string;
  } | null>(null);

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
    localStorage.removeItem(LAST_SYNC_KEY);
    notify.success(t('cloudSync.signOutSuccess'));
  }, [signOut, notify, t]);

  const updateLastSync = useCallback((timestamp: string) => {
    setLastSyncAt(timestamp);
    localStorage.setItem(LAST_SYNC_KEY, timestamp);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!accessToken) return;
    setSyncStatus('uploading');
    try {
      const data = buildExportData();
      const result = await driveService.uploadBackup(accessToken, data);
      updateLastSync(result.modifiedTime);
      setSyncStatus('idle');
      notify.success(t('cloudSync.uploadSuccess'));
    } catch {
      setSyncStatus('error');
      notify.error(t('cloudSync.uploadError'));
    }
  }, [accessToken, notify, t, updateLastSync]);

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
      const storedSyncTime = localStorage.getItem(LAST_SYNC_KEY);
      const remoteSyncTime = result.file.modifiedTime;

      if (storedSyncTime && remoteSyncTime < storedSyncTime) {
        const localData = buildExportData();
        setConflictData({
          local: localData,
          remote: result.data,
          remoteModifiedTime: remoteSyncTime,
        });
        setSyncStatus('idle');
        return;
      }

      onImportData(result.data);
      updateLastSync(remoteSyncTime);
      setSyncStatus('idle');
      notify.success(t('cloudSync.downloadSuccess'));
    } catch {
      setSyncStatus('error');
      notify.error(t('cloudSync.downloadError'));
    }
  }, [accessToken, onImportData, notify, t, updateLastSync]);

  const handleConflictResolve = useCallback((choice: 'local' | 'cloud') => {
    if (choice === 'cloud' && conflictData) {
      onImportData(conflictData.remote);
      updateLastSync(conflictData.remoteModifiedTime);
      notify.success(t('cloudSync.downloadSuccess'));
    }
    setConflictData(null);
  }, [conflictData, onImportData, notify, t, updateLastSync]);

  const statusIcon = useMemo(() => {
    if (syncStatus === 'uploading' || syncStatus === 'downloading') {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    }
    if (syncStatus === 'error') {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    if (lastSyncAt) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return null;
  }, [syncStatus, lastSyncAt]);

  const formattedSyncTime = useMemo(() => {
    if (!lastSyncAt) return null;
    return new Date(lastSyncAt).toLocaleString();
  }, [lastSyncAt]);

  if (!user) {
    return (
      <div data-testid="cloud-sync-signed-out" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 sm:p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('cloudSync.title')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('cloudSync.description')}</p>
          </div>
        </div>
        <button
          data-testid="btn-google-sign-in"
          onClick={handleSignIn}
          disabled={authLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all disabled:opacity-50"
        >
          {authLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          )}
          {t('cloudSync.signInWithGoogle')}
        </button>
      </div>
    );
  }

  return (
    <div data-testid="cloud-sync-signed-in" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 sm:p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
          <Cloud className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('cloudSync.title')}</h3>
          <div className="flex items-center gap-2 mt-1">
            {user.photoUrl && (
              <img src={user.photoUrl} alt="" className="w-5 h-5 rounded-full" />
            )}
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <button
          data-testid="btn-upload-drive"
          onClick={handleUpload}
          disabled={isSyncing}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
        >
          {syncStatus === 'uploading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {t('cloudSync.uploadToDrive')}
        </button>

        <button
          data-testid="btn-download-drive"
          onClick={handleDownload}
          disabled={isSyncing}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
        >
          {syncStatus === 'downloading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {t('cloudSync.downloadFromDrive')}
        </button>
      </div>

      {(formattedSyncTime || syncStatus === 'error') && (
        <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
          {statusIcon}
          {syncStatus === 'error' ? (
            <span className="text-red-500">{t('cloudSync.syncError')}</span>
          ) : (
            <span>{t('cloudSync.lastSync')}: {formattedSyncTime}</span>
          )}
        </div>
      )}

      <button
        data-testid="btn-google-sign-out"
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 mt-3 px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
      >
        <LogOut className="w-3.5 h-3.5" />
        {t('cloudSync.signOut')}
      </button>

      {conflictData && (
        <SyncConflictModal
          localTime={(conflictData.local._syncedAt as string) ?? new Date().toISOString()}
          remoteTime={conflictData.remoteModifiedTime}
          onResolve={handleConflictResolve}
          onClose={() => setConflictData(null)}
        />
      )}
    </div>
  );
};
