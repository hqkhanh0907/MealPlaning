import { useId } from 'react';
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
  const titleId = useId();
  const descriptionId = useId();
  const reasonId = useId();

  if (!isOpen) return null;

  return (
    <ModalBackdrop
      onClose={() => undefined}
      role="alertdialog"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
      closeOnBackdropClick={false}
      closeOnEscape={false}
      allowSwipeToDismiss={false}
      mobileLayout="center"
    >
      <section
        className="bg-card w-full max-w-[calc(100vw-1.5rem)] rounded-2xl p-6 shadow-xl sm:max-w-sm"
        data-testid="deload-modal"
      >
        <h3 id={titleId} className="text-warning text-lg font-semibold break-words">
          🔄 {t('fitness.deload.title')}
        </h3>
        <p id={descriptionId} className="text-foreground-secondary mt-2 text-sm leading-6 break-words">
          {t('fitness.deload.explanation')}
        </p>
        <p id={reasonId} className="text-muted-foreground mt-2 text-xs leading-5 break-words whitespace-normal">
          {reason}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={onAccept}
            className="bg-warning hover:bg-warning/90 focus-visible:ring-warning text-foreground flex min-h-[44px] flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-center font-medium break-words whitespace-normal transition-colors focus-visible:ring-2 focus-visible:outline-none"
            data-testid="deload-accept"
          >
            {t('fitness.deload.accept')}
          </button>
          <button
            type="button"
            onClick={onOverride}
            className="text-foreground-secondary border-border hover:bg-accent focus-visible:ring-ring flex min-h-[44px] flex-1 items-center justify-center rounded-lg border px-4 py-2.5 text-center font-medium break-words whitespace-normal transition-colors focus-visible:ring-2 focus-visible:outline-none"
            data-testid="deload-override"
            aria-describedby={reasonId}
          >
            {t('fitness.deload.override')}
          </button>
        </div>
      </section>
    </ModalBackdrop>
  );
}
