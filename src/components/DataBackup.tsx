import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Download, Loader2, ShieldAlert, ShieldCheck, ShieldX, Upload } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useDatabase } from '../contexts/DatabaseContext';
import { useNotification } from '../contexts/NotificationContext';
import { getSetting, setSetting } from '../services/appSettings';
import { reloadAllStores } from '../services/storeLoader';
import { ConfirmationModal } from './modals/ConfirmationModal';

function useBackupHealthStatus(): { level: 'good' | 'warning' | 'critical'; daysSince: number | null } {
  const db = useDatabase();
  const [status, setStatus] = useState<{ level: 'good' | 'warning' | 'critical'; daysSince: number | null }>({
    level: 'critical',
    daysSince: null,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const cloudTime = await getSetting(db, 'last_sync_at');
        const localTime = await getSetting(db, 'last_local_backup_at');
        const timestamps = [cloudTime, localTime].filter(Boolean).map(t => new Date(t!).getTime());
        if (timestamps.length === 0) {
          setStatus({ level: 'critical', daysSince: null });
          return;
        }
        const latest = Math.max(...timestamps);
        const daysSince = Math.floor((Date.now() - latest) / (1000 * 60 * 60 * 24));
        if (daysSince <= 3) {
          setStatus({ level: 'good', daysSince });
          return;
        }
        if (daysSince <= 7) {
          setStatus({ level: 'warning', daysSince });
          return;
        }
        setStatus({ level: 'critical', daysSince });
      } catch {
        setStatus({ level: 'critical', daysSince: null });
      }
    };
    load();
  }, [db]);

  return status;
}

const exportFileName = () => `meal-planner-backup-${new Date().toISOString().split('T')[0]}.json`;

const HEALTH_STYLES = {
  good: {
    bg: 'bg-primary-subtle',
    border: 'border-primary/20',
    text: 'text-primary-emphasis',
    Icon: ShieldCheck,
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-400',
    Icon: ShieldAlert,
  },
  critical: {
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-200 dark:border-rose-800',
    text: 'text-rose-700 dark:text-rose-400',
    Icon: ShieldX,
  },
};

const BackupHealthIndicator = () => {
  const { t } = useTranslation();
  const { level, daysSince } = useBackupHealthStatus();
  const style = HEALTH_STYLES[level];
  const message = daysSince === null ? t('backup.neverBackedUp') : t('backup.lastBackupDays', { count: daysSince });

  return (
    <div
      data-testid="backup-health"
      className={`flex items-center gap-2 rounded-xl border p-3 ${style.bg} ${style.border} ${style.text} mb-3`}
    >
      <style.Icon className="h-4 w-4 shrink-0" />
      <span className="text-xs font-medium">{message}</span>
    </div>
  );
};

export const DataBackup = () => {
  const { t } = useTranslation();
  const notify = useNotification();
  const db = useDatabase();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pendingImport, setPendingImport] = useState<{ data: string; fileName: string } | null>(null);

  const exportWeb = (data: string, fileName: string) => {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportNative = async (data: string, fileName: string) => {
    const base64 = btoa(unescape(encodeURIComponent(data)));
    const result = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache,
    });

    await Share.share({
      title: t('backup.export'),
      url: result.uri,
    });
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = await db.exportToJSON();
      const fileName = exportFileName();

      if (Capacitor.isNativePlatform()) {
        await exportNative(data, fileName);
      } else {
        exportWeb(data, fileName);
      }

      notify.success(t('backup.exportSuccess'), '');
      setSetting(db, 'last_local_backup_at', new Date().toISOString()).catch(() => {});
    } catch {
      notify.error(t('backup.exportFailed'), '');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();

      // Validate JSON format
      try {
        JSON.parse(text);
      } catch {
        notify.error(t('backup.invalidFile'), '');
        return;
      }

      setPendingImport({ data: text, fileName: file.name });
    } catch {
      notify.error(t('backup.importFailed'), '');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmImport = async () => {
    if (pendingImport) {
      try {
        await db.importFromJSON(pendingImport.data);
        await reloadAllStores(db);
        notify.success(t('backup.importSuccess'), '');
      } catch {
        notify.error(t('backup.importFailed'), '');
      }
      setPendingImport(null);
    }
  };

  return (
    <div data-testid="data-backup">
      <BackupHealthIndicator />
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleExport}
          disabled={isExporting}
          data-testid="btn-export"
          className="bg-primary-subtle text-primary-emphasis hover:bg-primary/10 flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-bold transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {t('backup.export')}
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          data-testid="btn-import"
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 font-bold text-indigo-700 transition-all hover:bg-indigo-100 active:scale-[0.98] disabled:opacity-50 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
        >
          {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {t('backup.import')}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          accept=".json"
          aria-label={t('backup.import')}
          className="hidden"
        />
      </div>
      <ConfirmationModal
        isOpen={!!pendingImport}
        variant="warning"
        title={t('backup.import')}
        message={<p>{t('backup.importConfirmMsg', { summary: pendingImport?.fileName ?? '' })}</p>}
        confirmLabel={t('common.confirm')}
        onConfirm={confirmImport}
        onCancel={() => setPendingImport(null)}
      />
    </div>
  );
};
