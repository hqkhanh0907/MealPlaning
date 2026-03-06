import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { ModalBackdrop } from '../shared/ModalBackdrop';

type ConfirmVariant = 'danger' | 'warning';

interface ConfirmationModalProps {
  isOpen: boolean;
  variant?: ConfirmVariant;
  icon?: React.ReactNode;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_STYLES: Record<ConfirmVariant, { iconBg: string; iconText: string; btnBg: string; btnHover: string; btnShadow: string }> = {
  danger: { iconBg: 'bg-rose-100 dark:bg-rose-900/30', iconText: 'text-rose-500 dark:text-rose-400', btnBg: 'bg-rose-500', btnHover: 'hover:bg-rose-600', btnShadow: 'shadow-rose-200' },
  warning: { iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconText: 'text-amber-500 dark:text-amber-400', btnBg: 'bg-amber-500', btnHover: 'hover:bg-amber-600', btnShadow: 'shadow-amber-200' },
};

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  variant = 'danger',
  icon,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();
  useModalBackHandler(isOpen, onCancel);

  if (!isOpen) return null;

  const styles = VARIANT_STYLES[variant];
  const defaultIcon = variant === 'danger' ? <Trash2 className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />;

  return (
    <ModalBackdrop onClose={onCancel} zIndex="z-70">
      <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-sm overflow-hidden sm:mx-4">
        <div className="p-6 text-center">
          <div className={`w-16 h-16 ${styles.iconBg} ${styles.iconText} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {icon || defaultIcon}
          </div>
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xl mb-2">{title}</h4>
          <div className="text-slate-600 dark:text-slate-400 mb-6">{message}</div>
          <div className="flex gap-3">
            <button
              data-testid="btn-cancel-action"
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 transition-all min-h-12"
            >
              {cancelLabel ?? t('common.cancel')}
            </button>
            <button
              data-testid="btn-confirm-action"
              onClick={onConfirm}
              className={`flex-1 ${styles.btnBg} text-white py-3 rounded-xl font-bold shadow-sm ${styles.btnShadow} ${styles.btnHover} active:scale-[0.98] transition-all min-h-12`}
            >
              {confirmLabel ?? t('common.confirm')}
            </button>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
};
