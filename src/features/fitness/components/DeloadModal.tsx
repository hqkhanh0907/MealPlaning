import { useTranslation } from 'react-i18next';
import { ModalBackdrop } from '../../../components/shared/ModalBackdrop';

interface DeloadModalProps {
  isOpen: boolean;
  reason: string;
  onAccept: () => void;
  onOverride: () => void;
}

export function DeloadModal({
  isOpen,
  reason,
  onAccept,
  onOverride,
}: DeloadModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onAccept}>
      <div
        className="rounded-2xl bg-white p-6 dark:bg-slate-800"
        data-testid="deload-modal"
      >
        <h3 className="text-lg font-bold text-amber-600">
          🔄 {t('fitness.deload.title')}
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t('fitness.deload.explanation')}
        </p>
        <p className="mt-1 text-xs text-slate-400">{reason}</p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={onAccept}
            className="flex-1 rounded-lg bg-amber-500 py-2 text-white"
            data-testid="deload-accept"
          >
            {t('fitness.deload.accept')}
          </button>
          <button
            onClick={onOverride}
            className="flex-1 rounded-lg border py-2 text-slate-600"
            data-testid="deload-override"
          >
            {t('fitness.deload.override')}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
