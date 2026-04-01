import { useTranslation } from 'react-i18next';
import { AlertTriangle, Monitor, Cloud } from 'lucide-react';

interface SyncConflictModalProps {
  localTime: string;
  remoteTime: string;
  onResolve: (choice: 'local' | 'cloud') => void;
  onClose: () => void;
}

export const SyncConflictModal = ({
  localTime,
  remoteTime,
  onResolve,
  onClose,
}: SyncConflictModalProps) => {
  const { t } = useTranslation();

  const formatTime = (iso: string) => new Date(iso).toLocaleString();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" data-testid="sync-conflict-modal">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('syncConflict.title')}</h3>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{t('syncConflict.description')}</p>

        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
            <Monitor className="w-4 h-4 text-blue-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{t('syncConflict.localData')}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{formatTime(localTime)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
            <Cloud className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{t('syncConflict.cloudData')}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{formatTime(remoteTime)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <button
            data-testid="btn-keep-local"
            onClick={() => onResolve('local')}
            className="w-full px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            {t('syncConflict.keepLocal')}
          </button>
          <button
            data-testid="btn-use-cloud"
            onClick={() => onResolve('cloud')}
            className="w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            {t('syncConflict.useCloud')}
          </button>
          <button
            data-testid="btn-cancel-sync"
            onClick={onClose}
            className="w-full px-4 py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-medium transition-colors"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
