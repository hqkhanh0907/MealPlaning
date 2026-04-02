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
      <div className="relative w-full overflow-hidden rounded-t-3xl bg-white shadow-xl sm:mx-4 sm:max-w-sm sm:rounded-3xl dark:bg-slate-800">
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-500 dark:bg-amber-900/30">
            <Save className="h-8 w-8" />
          </div>
          <h4 className="mb-2 text-xl font-bold text-slate-800 dark:text-slate-100">{t('unsavedChanges.title')}</h4>
          <p className="mb-6 text-slate-600 dark:text-slate-400">{t('unsavedChanges.description')}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={onSave}
              className="min-h-12 w-full rounded-xl bg-emerald-500 py-3 font-bold text-white transition-all hover:bg-emerald-600 active:scale-[0.98]"
            >
              {t('unsavedChanges.saveAndBack')}
            </button>
            <button
              onClick={onDiscard}
              data-testid="btn-discard-unsaved"
              className="min-h-12 w-full rounded-xl py-3 font-bold text-rose-600 transition-all hover:bg-rose-50 active:scale-[0.98] dark:hover:bg-rose-900/20"
            >
              {t('unsavedChanges.discard')}
            </button>
            <button
              onClick={onCancel}
              className="min-h-12 w-full rounded-xl py-3 font-bold text-slate-500 transition-all hover:bg-slate-100 active:scale-[0.98] dark:text-slate-400 dark:hover:bg-slate-700"
            >
              {t('unsavedChanges.stayEditing')}
            </button>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
};
