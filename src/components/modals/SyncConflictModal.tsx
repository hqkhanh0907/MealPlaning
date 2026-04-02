import { AlertTriangle, Cloud, Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SyncConflictModalProps {
  localTime: string;
  remoteTime: string;
  onResolve: (choice: 'local' | 'cloud') => void;
  onClose: () => void;
}

export const SyncConflictModal = ({ localTime, remoteTime, onResolve, onClose }: SyncConflictModalProps) => {
  const { t } = useTranslation();

  const formatTime = (iso: string) => new Date(iso).toLocaleString();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      data-testid="sync-conflict-modal"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-800">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('syncConflict.title')}</h3>
        </div>

        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{t('syncConflict.description')}</p>

        <div className="mb-5 space-y-2">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-700">
            <Monitor className="h-4 w-4 shrink-0 text-blue-500" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{t('syncConflict.localData')}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{formatTime(localTime)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-700">
            <Cloud className="h-4 w-4 shrink-0 text-emerald-500" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{t('syncConflict.cloudData')}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{formatTime(remoteTime)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <button
            data-testid="btn-keep-local"
            onClick={() => onResolve('local')}
            className="w-full rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
          >
            {t('syncConflict.keepLocal')}
          </button>
          <button
            data-testid="btn-use-cloud"
            onClick={() => onResolve('cloud')}
            className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            {t('syncConflict.useCloud')}
          </button>
          <button
            data-testid="btn-cancel-sync"
            onClick={onClose}
            className="w-full px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
