import { AlertTriangle, Trash2 } from 'lucide-react';
import React, { useId } from 'react';
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
    iconBg: 'bg-destructive/10',
    iconText: 'text-destructive',
    btnBg: 'bg-destructive',
    btnHover: 'hover:bg-destructive/90',
    btnShadow: 'shadow-destructive/20',
  },
  warning: {
    iconBg: 'bg-warning/10',
    iconText: 'text-warning',
    btnBg: 'bg-warning',
    btnHover: 'hover:bg-warning/90',
    btnShadow: 'shadow-status-warning/20',
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
}: Readonly<ConfirmationModalProps>) => {
  const { t } = useTranslation();
  const titleId = useId();
  const descriptionId = useId();
  useModalBackHandler(isOpen, onCancel);

  if (!isOpen) return null;

  const styles = VARIANT_STYLES[variant];
  const defaultIcon = variant === 'danger' ? <Trash2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />;

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
        <div className="p-6 text-center">
          <div
            className={`h-16 w-16 ${styles.iconBg} ${styles.iconText} mx-auto mb-4 flex items-center justify-center rounded-full`}
            aria-hidden="true"
          >
            {icon || defaultIcon}
          </div>
          <h4 id={titleId} className="text-foreground mb-2 text-xl leading-tight font-semibold break-words">
            {title}
          </h4>
          <div id={descriptionId} className="text-foreground-secondary mb-6 text-sm leading-6 break-words">
            {message}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <button
              type="button"
              data-testid="btn-cancel-action"
              onClick={onCancel}
              autoFocus
              className="text-foreground-secondary hover:bg-accent active:bg-muted min-h-12 flex-1 rounded-xl px-4 py-3 text-center font-semibold break-words whitespace-normal transition-all"
            >
              {cancelLabel ?? t('common.cancel')}
            </button>
            <button
              type="button"
              data-testid="btn-confirm-action"
              onClick={onConfirm}
              className={`flex-1 ${styles.btnBg} text-primary-foreground rounded-xl px-4 py-3 text-center font-semibold break-words whitespace-normal shadow-sm ${styles.btnShadow} ${styles.btnHover} min-h-12 transition-all active:scale-[0.98]`}
            >
              {confirmLabel ?? t('common.confirm')}
            </button>
          </div>
        </div>
      </section>
    </ModalBackdrop>
  );
};
