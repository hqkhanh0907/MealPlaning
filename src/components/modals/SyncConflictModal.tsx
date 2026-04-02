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
      <div className="bg-card w-full max-w-sm rounded-2xl p-5 shadow-xl">
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
              <p className="text-muted-foreground truncate text-xs">{formatTime(localTime)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-700">
            <Cloud className="text-primary h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{t('syncConflict.cloudData')}</p>
              <p className="text-muted-foreground truncate text-xs">{formatTime(remoteTime)}</p>
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
            className="bg-primary text-primary-foreground hover:bg-primary w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            {t('syncConflict.useCloud')}
          </button>
          <button
            data-testid="btn-cancel-sync"
            onClick={onClose}
            className="text-muted-foreground w-full px-4 py-2.5 text-sm font-medium transition-colors hover:text-slate-700 dark:hover:text-slate-200"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
