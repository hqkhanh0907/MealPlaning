import { Edit3, X } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { ModalBackdrop } from './ModalBackdrop';

interface DetailModalProps {
  title: string;
  editLabel: string;
  onClose: () => void;
  onEdit: () => void;
  children: React.ReactNode;
}

export const DetailModal = ({ title, editLabel, onClose, onEdit, children }: DetailModalProps) => {
  const { t } = useTranslation();
  return (
    <ModalBackdrop onClose={onClose} zIndex="z-60">
      <div
        data-testid="detail-modal"
        className="bg-card relative max-h-[90dvh] w-full overflow-hidden overflow-y-auto rounded-t-2xl shadow-xl sm:mx-4 sm:max-w-md sm:rounded-2xl"
      >
        {/* Header */}
        <div className="border-border-subtle flex items-center justify-between border-b px-6 py-4">
          <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h4>
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              data-testid="btn-detail-edit"
              aria-label={t('common.edit')}
              className="hover:bg-primary-subtle rounded-full p-2 text-slate-400 transition-all hover:text-emerald-600 dark:text-slate-500 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400"
              title={t('common.edit')}
            >
              <Edit3 className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              data-testid="btn-detail-close"
              aria-label={t('common.closeDialog')}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-5 p-6">{children}</div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onEdit}
            className="bg-primary text-primary-foreground hover:bg-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold transition-all"
          >
            <Edit3 className="h-5 w-5" /> {editLabel}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};
