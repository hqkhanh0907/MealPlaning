import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// --- Types ---

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  onClick?: () => void;
  duration?: number;
}

export interface NotifyAPI {
  success: (title: string, message?: string, options?: { onClick?: () => void; duration?: number }) => void;
  error: (title: string, message?: string, options?: { duration?: number }) => void;
  warning: (title: string, message?: string, options?: { duration?: number }) => void;
  info: (title: string, message?: string, options?: { onClick?: () => void; duration?: number }) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// --- Styles ---

const TOAST_STYLES: Record<NotificationType, { border: string; iconBg: string; title: string; message: string; icon: React.ReactNode; progressBar: string }> = {
  success: { border: 'border-emerald-200', iconBg: 'bg-emerald-50 text-emerald-600', title: 'text-emerald-800', message: 'text-emerald-600', icon: <CheckCircle2 className="w-5 h-5" />, progressBar: 'bg-emerald-500' },
  error: { border: 'border-rose-200', iconBg: 'bg-rose-50 text-rose-600', title: 'text-rose-800', message: 'text-rose-600', icon: <XCircle className="w-5 h-5" />, progressBar: 'bg-rose-500' },
  warning: { border: 'border-amber-200', iconBg: 'bg-amber-50 text-amber-600', title: 'text-amber-800', message: 'text-amber-600', icon: <AlertTriangle className="w-5 h-5" />, progressBar: 'bg-amber-500' },
  info: { border: 'border-sky-200', iconBg: 'bg-sky-50 text-sky-600', title: 'text-sky-800', message: 'text-sky-600', icon: <Info className="w-5 h-5" />, progressBar: 'bg-sky-500' },
};

const DEFAULT_DURATION: Record<NotificationType, number> = {
  success: 15000,
  error: 10000,
  warning: 5000,
  info: 4000,
};

// --- Context ---

const NotificationContext = createContext<NotifyAPI | null>(null);

export const useNotification = (): NotifyAPI => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within <NotificationProvider>');
  return ctx;
};

// --- Toast Component ---

const Toast: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const styles = TOAST_STYLES[toast.type];
  const duration = toast.duration ?? DEFAULT_DURATION[toast.type];
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    timerRef.current = setTimeout(handleDismiss, duration);
    return () => clearTimeout(timerRef.current);
  }, [duration, handleDismiss]);

  const handleClick = () => {
    if (toast.onClick) {
      toast.onClick();
      handleDismiss();
    }
  };

  return (
    <button
      type="button"
      className={`
        bg-white rounded-2xl shadow-lg border ${styles.border}
        px-4 py-3 flex items-start gap-3 w-full max-w-sm text-left
        transition-all duration-300 ease-out
        ${isExiting ? 'opacity-0 translate-x-full sm:translate-x-full' : 'opacity-100 translate-x-0'}
        ${toast.onClick ? 'cursor-pointer hover:shadow-xl active:scale-[0.98]' : ''}
      `}
      onClick={toast.onClick ? handleClick : undefined}
      onMouseEnter={() => clearTimeout(timerRef.current)}
      onMouseLeave={() => { timerRef.current = setTimeout(handleDismiss, 2000); }}
    >
      <div className={`p-2 rounded-xl shrink-0 ${styles.iconBg}`}>{styles.icon}</div>
      <div className="flex-1 min-w-0 py-0.5">
        <p className={`font-semibold text-sm leading-tight ${styles.title}`}>{toast.title}</p>
        {toast.message && <p className={`text-xs mt-0.5 leading-snug ${styles.message}`}>{toast.message}</p>}
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
        className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </button>
  );
};

// --- Provider ---

const MAX_TOASTS = 5;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: NotificationType, title: string, message = '', options?: { onClick?: () => void; duration?: number }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = { id, type, title, message, onClick: options?.onClick, duration: options?.duration };
    setToasts(prev => [...prev.slice(-(MAX_TOASTS - 1)), newToast]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => setToasts([]), []);

  const api: NotifyAPI = React.useMemo(() => ({
    success: (title, message, options) => addToast('success', title, message, options),
    error: (title, message, options) => addToast('error', title, message, options),
    warning: (title, message, options) => addToast('warning', title, message, options),
    info: (title, message, options) => addToast('info', title, message, options),
    dismiss,
    dismissAll,
  }), [addToast, dismiss, dismissAll]);

  return (
    <NotificationContext.Provider value={api}>
      {children}

      {/* Toast Container — top on mobile, bottom-right on desktop */}
      <div
        aria-live="polite"
        className="fixed top-[env(safe-area-inset-top)] right-0 left-0 sm:left-auto sm:top-auto sm:bottom-6 sm:right-6 z-9999 flex flex-col gap-2 p-3 sm:p-0 pointer-events-none"
      >
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

