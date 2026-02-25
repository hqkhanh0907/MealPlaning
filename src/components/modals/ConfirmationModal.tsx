import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

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
  danger: { iconBg: 'bg-rose-100', iconText: 'text-rose-500', btnBg: 'bg-rose-500', btnHover: 'hover:bg-rose-600', btnShadow: 'shadow-rose-200' },
  warning: { iconBg: 'bg-amber-100', iconText: 'text-amber-500', btnBg: 'bg-amber-500', btnHover: 'hover:bg-amber-600', btnShadow: 'shadow-amber-200' },
};

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  variant = 'danger',
  icon,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const styles = VARIANT_STYLES[variant];
  const defaultIcon = variant === 'danger' ? <Trash2 className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-70">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 w-full h-full cursor-default"
        onClick={onCancel}
        tabIndex={-1}
      />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-sm overflow-hidden sm:mx-4">
        <div className="p-6 text-center">
          <div className={`w-16 h-16 ${styles.iconBg} ${styles.iconText} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {icon || defaultIcon}
          </div>
          <h4 className="font-bold text-slate-800 text-xl mb-2">{title}</h4>
          <div className="text-slate-600 mb-6">{message}</div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-all min-h-12"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 ${styles.btnBg} text-white py-3 rounded-xl font-bold shadow-sm ${styles.btnShadow} ${styles.btnHover} active:scale-[0.98] transition-all min-h-12`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

