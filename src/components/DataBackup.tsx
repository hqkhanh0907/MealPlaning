import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload, Loader2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { useNotification } from '../contexts/NotificationContext';
import { ConfirmationModal } from './modals/ConfirmationModal';

interface DataBackupProps {
  onImport: (data: Record<string, unknown>) => void;
}

const EXPORT_KEYS = ['mp-ingredients', 'mp-dishes', 'mp-day-plans', 'mp-user-profile'];

const buildExportData = (): Record<string, unknown> => {
  const data: Record<string, unknown> = {};
  for (const key of EXPORT_KEYS) {
    const value = localStorage.getItem(key);
    if (value) {
      data[key] = JSON.parse(value);
    }
  }
  data._exportedAt = new Date().toISOString();
  data._version = '1.0';
  return data;
};

const exportFileName = () =>
  `meal-planner-backup-${new Date().toISOString().split('T')[0]}.json`;

export const DataBackup: React.FC<DataBackupProps> = ({ onImport }) => {
  const { t } = useTranslation();
  const notify = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pendingImport, setPendingImport] = useState<{ data: Record<string, unknown>; summary: string } | null>(null);

  const exportWeb = (data: Record<string, unknown>, fileName: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportNative = async (data: Record<string, unknown>, fileName: string) => {
    const result = await Filesystem.writeFile({
      path: fileName,
      data: JSON.stringify(data, null, 2),
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });

    await Share.share({
      title: t('backup.export'),
      url: result.uri,
    });
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = buildExportData();
      const fileName = exportFileName();

      if (Capacitor.isNativePlatform()) {
        await exportNative(data, fileName);
      } else {
        exportWeb(data, fileName);
      }

      notify.success(t('backup.exportSuccess'), '');
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
      const data = JSON.parse(text) as Record<string, unknown>;

      const hasValidKeys = EXPORT_KEYS.some(key => key in data);
      if (!hasValidKeys) {
        notify.error(t('backup.invalidFile'), '');
        return;
      }

      const counts: string[] = [];
      if (Array.isArray(data['mp-ingredients'])) counts.push(`${(data['mp-ingredients'] as unknown[]).length} ${t('ingredient.ingredients').toLowerCase()}`);
      if (Array.isArray(data['mp-dishes'])) counts.push(`${(data['mp-dishes'] as unknown[]).length} ${t('dish.dishes').toLowerCase()}`);
      if (Array.isArray(data['mp-day-plans'])) counts.push(`${(data['mp-day-plans'] as unknown[]).length} ${t('calendar.mealPlan').toLowerCase()}`);
      const summary = counts.join(', ');
      setPendingImport({ data, summary });
    } catch {
      notify.error(t('backup.importFailed'), '');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmImport = () => {
    if (pendingImport) {
      onImport(pendingImport.data);
      setPendingImport(null);
    }
  };

  return (
    <div data-testid="data-backup">
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleExport}
          disabled={isExporting}
          data-testid="btn-export"
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 active:scale-[0.98] transition-all disabled:opacity-50 min-h-11"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {t('backup.export')}
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          data-testid="btn-import"
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 active:scale-[0.98] transition-all disabled:opacity-50 min-h-11"
        >
          {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {t('backup.import')}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          accept=".json"
          className="hidden"
        />
      </div>
      <ConfirmationModal
        isOpen={!!pendingImport}
        variant="warning"
        title={t('backup.import')}
        message={<p>{t('backup.importConfirmMsg', { summary: pendingImport?.summary ?? '' })}</p>}
        confirmLabel={t('common.confirm')}
        onConfirm={confirmImport}
        onCancel={() => setPendingImport(null)}
      />
    </div>
  );
};
