import type { LucideIcon } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useReducedMotion } from '@/hooks/useReducedMotion';

/** Duration (ms) for the undo toast auto-dismiss timer. */
export const UNDO_TOAST_DURATION_MS = 6000;

export interface UndoToastProps {
  readonly message: string;
  readonly icon: LucideIcon;
  readonly duration?: number;
  readonly onUndo: () => void;
  readonly onDismiss: () => void;
}

type AnimationPhase = 'enter' | 'visible' | 'exit';

export const UndoToast = React.memo(function UndoToast({
  message,
  icon: Icon,
  duration = UNDO_TOAST_DURATION_MS,
  onUndo,
  onDismiss,
}: UndoToastProps) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<AnimationPhase>(reducedMotion ? 'visible' : 'enter');

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startDismiss = useCallback(() => {
    clearTimer();
    if (reducedMotion) {
      onDismiss();
      return;
    }
    setPhase('exit');
    timerRef.current = setTimeout(() => {
      onDismiss();
    }, 200);
  }, [clearTimer, onDismiss, reducedMotion]);

  // Auto-dismiss timer
  useEffect(() => {
    clearTimer();
    timerRef.current = setTimeout(startDismiss, duration);
    return clearTimer;
  }, [duration, message, clearTimer, startDismiss]);

  // Enter → visible transition via rAF (non-reduced-motion only)
  useEffect(() => {
    if (reducedMotion || phase !== 'enter') return;
    rafRef.current = requestAnimationFrame(() => {
      setPhase('visible');
      rafRef.current = null;
    });
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [phase, reducedMotion]);

  const handleUndo = useCallback(() => {
    clearTimer();
    onUndo();
  }, [clearTimer, onUndo]);

  const getPhaseStyle = (p: typeof phase): React.CSSProperties => {
    if (p === 'enter')
      return {
        transform: 'translateY(100%)',
        opacity: 0,
        transition: 'transform 250ms ease-out, opacity 250ms ease-out',
      };
    if (p === 'exit')
      return {
        transform: 'translateY(100%)',
        opacity: 0,
        transition: 'transform 200ms ease-out, opacity 200ms ease-out',
      };
    return { transform: 'translateY(0)', opacity: 1, transition: 'transform 250ms ease-out, opacity 250ms ease-out' };
  };

  const animationStyle = reducedMotion ? {} : getPhaseStyle(phase);

  return (
    <output
      data-testid="undo-toast"
      aria-live="polite"
      className="fixed right-4 bottom-20 left-4 z-[60]"
      style={animationStyle}
    >
      <div className="bg-foreground text-background flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg">
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 text-sm font-medium">{message}</span>
        <button
          type="button"
          data-testid="undo-toast-action"
          onClick={handleUndo}
          className="text-background/80 hover:text-background shrink-0 text-sm font-semibold"
        >
          {t('action.undo')}
        </button>
      </div>
      <div className="mt-1 overflow-hidden rounded-full">
        <div
          data-testid="undo-toast-progress"
          className="bg-background/30 h-0.5"
          style={{
            width: phase === 'visible' || phase === 'exit' ? '0%' : '100%',
            transition: phase === 'visible' ? `width ${duration}ms linear` : 'none',
          }}
        />
      </div>
    </output>
  );
});

UndoToast.displayName = 'UndoToast';
