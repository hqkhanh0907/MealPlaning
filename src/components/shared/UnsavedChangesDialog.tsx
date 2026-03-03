import React from 'react';
import { useTranslation } from 'react-i18next';
import { Save } from 'lucide-react';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { ModalBackdrop } from './ModalBackdrop';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({ isOpen, onSave, onDiscard, onCancel }) => {
  const { t } = useTranslation();
  useModalBackHandler(isOpen, onCancel);

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onCancel} zIndex="z-70">
      <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-sm overflow-hidden sm:mx-4">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Save className="w-8 h-8" />
          </div>
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xl mb-2">{t('unsavedChanges.title')}</h4>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{t('unsavedChanges.description')}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={onSave}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all min-h-12"
            >
              {t('unsavedChanges.saveAndBack')}
            </button>
            <button
              onClick={onDiscard}
              className="w-full py-3 rounded-xl font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 active:scale-[0.98] transition-all min-h-12"
            >
              {t('unsavedChanges.discard')}
            </button>
            <button
              onClick={onCancel}
              className="w-full py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-[0.98] transition-all min-h-12"
            >
              {t('unsavedChanges.stayEditing')}
            </button>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
};

