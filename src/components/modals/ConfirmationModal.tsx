import { AlertTriangle, Trash2 } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

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

const VARIANT_STYLES: Record<
  ConfirmVariant,
  { iconBg: string; iconText: string; btnBg: string; btnHover: string; btnShadow: string }
> = {
  danger: {
    iconBg: 'bg-rose-100 dark:bg-rose-900/30',
    iconText: 'text-rose-500 dark:text-rose-400',
    btnBg: 'bg-rose-500',
    btnHover: 'hover:bg-rose-600',
    btnShadow: 'shadow-rose-200',
  },
  warning: {
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconText: 'text-amber-500 dark:text-amber-400',
    btnBg: 'bg-amber-500',
    btnHover: 'hover:bg-amber-600',
    btnShadow: 'shadow-amber-200',
  },
};

export const ConfirmationModal = ({
  isOpen,
  variant = 'danger',
  icon,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) => {
  const { t } = useTranslation();
  useModalBackHandler(isOpen, onCancel);

  if (!isOpen) return null;

  const styles = VARIANT_STYLES[variant];
  const defaultIcon = variant === 'danger' ? <Trash2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />;

  return (
    <ModalBackdrop onClose={onCancel} zIndex="z-70">
      <div className="bg-card relative w-full overflow-hidden rounded-t-2xl shadow-xl sm:mx-4 sm:max-w-sm sm:rounded-2xl">
        <div className="p-6 text-center">
          <div
            className={`h-16 w-16 ${styles.iconBg} ${styles.iconText} mx-auto mb-4 flex items-center justify-center rounded-full`}
            aria-hidden="true"
          >
            {icon || defaultIcon}
          </div>
          <h4 className="text-foreground mb-2 text-xl font-bold">{title}</h4>
          <div className="text-foreground-secondary mb-6">{message}</div>
          <div className="flex gap-3">
            <button
              data-testid="btn-cancel-action"
              onClick={onCancel}
              className="text-foreground-secondary hover:bg-accent active:bg-muted min-h-12 flex-1 rounded-xl py-3 font-bold transition-all"
            >
              {cancelLabel ?? t('common.cancel')}
            </button>
            <button
              data-testid="btn-confirm-action"
              onClick={onConfirm}
              className={`flex-1 ${styles.btnBg} rounded-xl py-3 font-bold text-white shadow-sm ${styles.btnShadow} ${styles.btnHover} min-h-12 transition-all active:scale-[0.98]`}
            >
              {confirmLabel ?? t('common.confirm')}
            </button>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
};
