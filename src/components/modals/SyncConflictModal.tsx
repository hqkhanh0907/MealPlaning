import { AlertTriangle, Cloud, Monitor } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { ModalBackdrop } from '../shared/ModalBackdrop';

interface SyncConflictModalProps {
  localTime: string;
  remoteTime: string;
  onResolve: (choice: 'local' | 'cloud') => void;
  onClose: () => void;
}

export const SyncConflictModal = ({ localTime, remoteTime, onResolve, onClose }: Readonly<SyncConflictModalProps>) => {
  const { t } = useTranslation();
  const titleId = useId();
  const descriptionId = useId();
  useModalBackHandler(true, onClose);

  const formatTime = (iso: string) => new Date(iso).toLocaleString();

  return (
    <ModalBackdrop
      onClose={onClose}
      role="alertdialog"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
      closeOnBackdropClick={true}
      closeOnEscape={true}
      allowSwipeToDismiss={true}
      mobileLayout="center"
    >
      <section
        className="bg-card w-full max-w-[calc(100vw-1.5rem)] rounded-2xl p-5 shadow-xl sm:max-w-sm"
        data-testid="sync-conflict-modal"
      >
        <div className="mb-4 flex items-start gap-2">
          <AlertTriangle className="text-warning mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <h3 id={titleId} className="text-foreground font-semibold break-words">
              {t('syncConflict.title')}
            </h3>
            <p id={descriptionId} className="text-foreground-secondary mt-1 text-sm leading-6 break-words">
              {t('syncConflict.description')}
            </p>
          </div>
        </div>

        <div className="mb-5 space-y-2">
          <div className="bg-muted flex items-start gap-2 rounded-xl p-3">
            <Monitor className="text-info mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <p className="text-foreground text-xs font-semibold break-words">{t('syncConflict.localData')}</p>
              <p className="text-muted-foreground text-xs leading-5 break-words whitespace-normal">
                {formatTime(localTime)}
              </p>
            </div>
          </div>
          <div className="bg-muted flex items-start gap-2 rounded-xl p-3">
            <Cloud className="text-primary mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <p className="text-foreground text-xs font-semibold break-words">{t('syncConflict.cloudData')}</p>
              <p className="text-muted-foreground text-xs leading-5 break-words whitespace-normal">
                {formatTime(remoteTime)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            data-testid="btn-keep-local"
            onClick={() => onResolve('local')}
            className="bg-info hover:bg-info/90 text-primary-foreground min-h-12 w-full rounded-xl px-4 py-3 text-center text-sm font-semibold break-words whitespace-normal transition-colors"
          >
            {t('syncConflict.keepLocal')}
          </button>
          <button
            type="button"
            data-testid="btn-use-cloud"
            onClick={() => onResolve('cloud')}
            className="bg-primary text-primary-foreground hover:bg-primary min-h-12 w-full rounded-xl px-4 py-3 text-center text-sm font-semibold break-words whitespace-normal transition-colors"
          >
            {t('syncConflict.useCloud')}
          </button>
          <button
            type="button"
            data-testid="btn-cancel-sync"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-accent min-h-12 w-full rounded-xl px-4 py-3 text-center text-sm font-medium break-words whitespace-normal transition-colors"
          >
            {t('common.cancel')}
          </button>
        </div>
      </section>
    </ModalBackdrop>
  );
};
