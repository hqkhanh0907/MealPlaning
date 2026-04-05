import { Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { ModalBackdrop } from './ModalBackdrop';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export const UnsavedChangesDialog = ({ isOpen, onSave, onDiscard, onCancel }: UnsavedChangesDialogProps) => {
  const { t } = useTranslation();
  // Nested inside another modal — useModalBackHandler's programmaticBackCount
  // mechanism correctly handles stacked history entries on Android.
  useModalBackHandler(isOpen, onCancel);

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onCancel} zIndex="z-70">
      <div className="bg-card relative w-full overflow-hidden rounded-t-2xl shadow-xl sm:mx-4 sm:max-w-sm sm:rounded-2xl">
        <div className="p-6 text-center">
          <div className="bg-warning/10 text-warning mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Save className="h-6 w-6" />
          </div>
          <h4 className="text-foreground mb-2 text-xl font-bold">{t('unsavedChanges.title')}</h4>
          <p className="text-foreground-secondary mb-6">{t('unsavedChanges.description')}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={onSave}
              className="bg-primary text-primary-foreground hover:bg-primary min-h-12 w-full rounded-xl py-3 font-bold transition-all active:scale-[0.98]"
            >
              {t('unsavedChanges.saveAndBack')}
            </button>
            <button
              onClick={onDiscard}
              data-testid="btn-discard-unsaved"
              className="text-color-rose hover:bg-color-rose/10 min-h-12 w-full rounded-xl py-3 font-bold transition-all active:scale-[0.98]"
            >
              {t('unsavedChanges.discard')}
            </button>
            <button
              onClick={onCancel}
              className="text-muted-foreground hover:bg-accent min-h-12 w-full rounded-xl py-3 font-bold transition-all active:scale-[0.98]"
            >
              {t('unsavedChanges.stayEditing')}
            </button>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
};
