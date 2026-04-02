import { useTranslation } from 'react-i18next';

import { ModalBackdrop } from '../../../components/shared/ModalBackdrop';

interface DeloadModalProps {
  isOpen: boolean;
  reason: string;
  onAccept: () => void;
  onOverride: () => void;
}

export function DeloadModal({ isOpen, reason, onAccept, onOverride }: Readonly<DeloadModalProps>) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onAccept}>
      <div className="bg-card rounded-2xl p-6" data-testid="deload-modal">
        <h3 className="text-lg font-bold text-amber-600">🔄 {t('fitness.deload.title')}</h3>
        <p className="text-foreground-secondary mt-2 text-sm">{t('fitness.deload.explanation')}</p>
        <p className="text-muted-foreground mt-1 text-xs">{reason}</p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onAccept}
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-amber-500 py-2.5 font-medium text-amber-950 transition-colors hover:bg-amber-600 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            data-testid="deload-accept"
          >
            {t('fitness.deload.accept')}
          </button>
          <button
            type="button"
            onClick={onOverride}
            className="text-foreground-secondary border-border hover:bg-accent focus-visible:ring-ring flex min-h-[44px] flex-1 items-center justify-center rounded-lg border py-2.5 font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
            data-testid="deload-override"
          >
            {t('fitness.deload.override')}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
