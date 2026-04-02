import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { generateUUID } from '@/utils/helpers';

// --- Types ---

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  onClick?: () => void;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface NotifyAPI {
  success: (
    title: string,
    message?: string,
    options?: { onClick?: () => void; duration?: number; action?: { label: string; onClick: () => void } },
  ) => void;
  error: (title: string, message?: string, options?: { duration?: number }) => void;
  warning: (title: string, message?: string, options?: { duration?: number }) => void;
  info: (
    title: string,
    message?: string,
    options?: { onClick?: () => void; duration?: number; action?: { label: string; onClick: () => void } },
  ) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// --- Styles ---

const TOAST_STYLES: Record<
  NotificationType,
  { border: string; iconBg: string; title: string; message: string; icon: React.ReactNode; progressBar: string }
> = {
  success: {
    border: 'border-emerald-200 dark:border-emerald-800',
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    title: 'text-emerald-800',
    message: 'text-primary',
    icon: <CheckCircle2 className="h-5 w-5" />,
    progressBar: 'bg-primary',
  },
  error: {
    border: 'border-rose-200 dark:border-rose-800',
    iconBg: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
    title: 'text-rose-800 dark:text-rose-300',
    message: 'text-rose-600 dark:text-rose-400',
    icon: <XCircle className="h-5 w-5" />,
    progressBar: 'bg-rose-500',
  },
  warning: {
    border: 'border-amber-200 dark:border-amber-800',
    iconBg: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    title: 'text-amber-800 dark:text-amber-300',
    message: 'text-amber-600 dark:text-amber-400',
    icon: <AlertTriangle className="h-5 w-5" />,
    progressBar: 'bg-amber-500',
  },
  info: {
    border: 'border-sky-200 dark:border-sky-800',
    iconBg: 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',
    title: 'text-sky-800 dark:text-sky-300',
    message: 'text-sky-600 dark:text-sky-400',
    icon: <Info className="h-5 w-5" />,
    progressBar: 'bg-sky-500',
  },
};

const DEFAULT_DURATION: Record<NotificationType, number> = {
  success: 3000,
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

const Toast = ({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) => {
  const styles = TOAST_STYLES[toast.type];
  const duration = toast.duration ?? DEFAULT_DURATION[toast.type];
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    exitTimerRef.current = setTimeout(() => onDismiss(toast.id), 300);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    timerRef.current = setTimeout(handleDismiss, duration);
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(exitTimerRef.current);
    };
  }, [duration, handleDismiss]);

  // Pause/resume auto-dismiss on hover via native DOM listeners
  useEffect(() => {
    const el = containerRef.current;
    const pause = () => clearTimeout(timerRef.current);
    const resume = () => {
      timerRef.current = setTimeout(handleDismiss, 2000);
    };
    el?.addEventListener('mouseenter', pause);
    el?.addEventListener('mouseleave', resume);
    return () => {
      el?.removeEventListener('mouseenter', pause);
      el?.removeEventListener('mouseleave', resume);
    };
  }, [handleDismiss]);

  const handleClick = () => {
    if (toast.onClick) {
      toast.onClick();
      handleDismiss();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`bg-card relative rounded-2xl border shadow-lg ${styles.border} flex w-full max-w-sm items-start gap-3 px-4 py-3 text-left transition-all duration-300 ease-out ${isExiting ? 'translate-x-full opacity-0 sm:translate-x-full' : 'translate-x-0 opacity-100'} ${toast.onClick ? 'cursor-pointer hover:shadow-xl active:scale-[0.98]' : ''} `}
    >
      {toast.onClick && (
        <button
          type="button"
          onClick={handleClick}
          className="absolute inset-0 h-full w-full cursor-pointer"
          aria-label={toast.title}
        />
      )}
      <div className={`relative z-10 shrink-0 rounded-xl p-2 ${styles.iconBg}`}>{styles.icon}</div>
      <div className="relative z-10 min-w-0 flex-1 py-0.5">
        <p className={`text-sm leading-tight font-semibold ${styles.title}`}>{toast.title}</p>
        {toast.message && <p className={`mt-0.5 text-xs leading-snug ${styles.message}`}>{toast.message}</p>}
        {toast.action && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              toast.action?.onClick();
              handleDismiss();
            }}
            className="focus-visible:ring-ring text-primary mt-1.5 flex min-h-10 items-center rounded text-xs font-bold underline underline-offset-2 transition-colors hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-offset-2 active:text-emerald-800"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          handleDismiss();
        }}
        className="focus-visible:ring-ring relative z-10 flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-offset-2 dark:text-slate-500 dark:hover:bg-slate-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// --- Provider ---

const MAX_TOASTS = 5;

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (
      type: NotificationType,
      title: string,
      message = '',
      options?: { onClick?: () => void; duration?: number; action?: { label: string; onClick: () => void } },
    ) => {
      const id = generateUUID();
      const newToast: ToastItem = {
        id,
        type,
        title,
        message,
        onClick: options?.onClick,
        duration: options?.duration,
        action: options?.action,
      };
      setToasts(prev => [...prev.slice(-(MAX_TOASTS - 1)), newToast]);
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => setToasts([]), []);

  const api: NotifyAPI = React.useMemo(
    () => ({
      success: (title, message, options) => addToast('success', title, message, options),
      error: (title, message, options) => addToast('error', title, message, options),
      warning: (title, message, options) => addToast('warning', title, message, options),
      info: (title, message, options) => addToast('info', title, message, options),
      dismiss,
      dismissAll,
    }),
    [addToast, dismiss, dismissAll],
  );

  return (
    <NotificationContext.Provider value={api}>
      {children}

      {/* Toast Container — top on mobile, bottom-right on desktop */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed top-[env(safe-area-inset-top)] right-0 left-0 z-[80] flex flex-col gap-2 p-3 sm:top-auto sm:right-6 sm:bottom-6 sm:left-auto sm:p-0"
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
