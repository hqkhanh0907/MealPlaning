import { Save } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { ModalBackdrop } from './ModalBackdrop';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export const UnsavedChangesDialog = ({ isOpen, onSave, onDiscard, onCancel }: Readonly<UnsavedChangesDialogProps>) => {
  const { t } = useTranslation();
  const titleId = useId();
  const descriptionId = useId();

  useModalBackHandler(isOpen, onCancel);

  if (!isOpen) return null;

  return (
    <ModalBackdrop
      onClose={onCancel}
      zIndex="z-70"
      role="alertdialog"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
      closeOnBackdropClick={true}
      closeOnEscape={true}
      allowSwipeToDismiss={true}
      mobileLayout="center"
    >
      <section className="bg-card relative w-full max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl shadow-xl sm:mx-4 sm:max-w-sm">
        <div className="p-5 sm:p-6">
          <div className="bg-warning/10 text-warning mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Save aria-hidden="true" className="h-6 w-6" />
          </div>
          <h4 id={titleId} className="text-foreground mb-2 text-center text-xl leading-tight font-semibold break-words">
            {t('unsavedChanges.title')}
          </h4>
          <p id={descriptionId} className="text-foreground-secondary mb-6 text-center text-sm leading-6 break-words">
            {t('unsavedChanges.description')}
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onSave}
              className="bg-primary text-primary-foreground hover:bg-primary min-h-12 w-full rounded-xl px-4 py-3 text-center font-semibold whitespace-normal transition-colors"
            >
              {t('unsavedChanges.saveAndBack')}
            </button>
            <button
              type="button"
              onClick={onDiscard}
              data-testid="btn-discard-unsaved"
              className="border-rose/20 text-rose hover:bg-rose/10 min-h-12 w-full rounded-xl border px-4 py-3 text-center font-semibold whitespace-normal transition-colors"
            >
              {t('unsavedChanges.discard')}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-muted-foreground hover:bg-accent min-h-12 w-full rounded-xl px-4 py-3 text-center font-semibold whitespace-normal transition-colors"
            >
              {t('unsavedChanges.stayEditing')}
            </button>
          </div>
        </div>
      </section>
    </ModalBackdrop>
  );
};
