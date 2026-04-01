import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RestTimerProps {
  durationSeconds: number;
  onComplete: () => void;
  onSkip: () => void;
  onAddTime?: (seconds: number) => void;
  isVisible?: boolean;
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ADD_SECONDS = 30;

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const RestTimer = React.memo(function RestTimer({
  durationSeconds,
  onComplete,
  onSkip,
  onAddTime,
  isVisible = true,
}: RestTimerProps) {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(durationSeconds);
  const [totalDuration, setTotalDuration] = useState(durationSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isVisible) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [clearTimer, isVisible]);

  useEffect(() => {
    if (remaining === 0) {
      clearTimer();
      onComplete();
    }
  }, [remaining, clearTimer, onComplete]);

  const handleAddTime = useCallback(() => {
    setRemaining((prev) => prev + ADD_SECONDS);
    setTotalDuration((prev) => prev + ADD_SECONDS);
    onAddTime?.(ADD_SECONDS);
  }, [onAddTime]);

  const handleSkip = useCallback(() => {
    clearTimer();
    onSkip();
  }, [clearTimer, onSkip]);

  if (!isVisible) return null;

  const progress = totalDuration > 0 ? remaining / totalDuration : 0;
  const dashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
      aria-label={t('fitness.timer.rest')}
      data-testid="rest-timer-overlay"
    >
      <div className="flex flex-col items-center rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-800">
        <div className="mb-4 flex items-center gap-2">
          <Timer
            className="h-4 w-4 text-slate-500 dark:text-slate-400"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {t('fitness.timer.rest')}
          </p>
        </div>

        <div className="relative mb-6 flex items-center justify-center">
          <progress
            data-testid="progress-ring"
            className="sr-only"
            value={Math.round(progress * 100)}
            max={100}
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('fitness.timer.rest')}
          />
          <svg
            className="h-32 w-32 -rotate-90 transform"
            width="128"
            height="128"
            viewBox="0 0 128 128"
            aria-hidden="true"
          >
            <circle
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-200 dark:text-slate-700"
            />
            <circle
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashoffset}
              className="text-emerald-500"
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
                transition: 'stroke-dashoffset 0.3s ease',
              }}
              data-testid="progress-circle"
            />
          </svg>
          <span
            className="absolute text-2xl font-bold tabular-nums text-slate-800 dark:text-slate-100"
            data-testid="timer-display"
          >
            {formatTime(remaining)}
          </span>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="default"
            className="min-h-11"
            onClick={handleAddTime}
            aria-label={t('fitness.timer.addTime')}
            data-testid="add-time-button"
          >
            {t('fitness.timer.addTime')}
          </Button>
          <Button
            variant="default"
            size="default"
            className="min-h-11"
            onClick={handleSkip}
            aria-label={t('fitness.timer.skip')}
            data-testid="skip-button"
          >
            {t('fitness.timer.skip')}
          </Button>
        </div>
      </div>
    </div>
  );
});
