import { Timer } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isVisible || isPaused) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [clearTimer, isVisible, isPaused]);

  useEffect(() => {
    if (remaining === 0) {
      clearTimer();
      onComplete();
    }
  }, [remaining, clearTimer, onComplete]);

  const handleAddTime = useCallback(() => {
    setRemaining(prev => prev + ADD_SECONDS);
    setTotalDuration(prev => prev + ADD_SECONDS);
    onAddTime?.(ADD_SECONDS);
  }, [onAddTime]);

  const handleSkip = useCallback(() => {
    clearTimer();
    onSkip();
  }, [clearTimer, onSkip]);

  const handlePauseToggle = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

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
      <div className="bg-card flex flex-col items-center rounded-2xl p-8 shadow-xl">
        <div className="mb-4 flex items-center gap-2">
          <Timer className="text-muted-foreground h-4 w-4" aria-hidden="true" />
          <p className="text-muted-foreground text-sm font-medium">{t('fitness.timer.rest')}</p>
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
              className="text-muted"
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
              className={`${isPaused ? 'text-muted' : 'text-primary'} motion-reduce:[transition:none]`}
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
                transition: 'stroke-dashoffset 1s linear',
              }}
              data-testid="progress-circle"
            />
          </svg>
          <span className="text-foreground absolute text-4xl font-bold tabular-nums" data-testid="timer-display">
            {formatTime(remaining)}
          </span>
        </div>

        <div className="flex w-full gap-3">
          <Button
            variant="outline"
            size="default"
            className="min-h-12 flex-1 rounded-xl"
            onClick={handleAddTime}
            aria-label={t('fitness.timer.addTime')}
            data-testid="add-time-button"
          >
            {t('fitness.timer.addTime')}
          </Button>
          <Button
            variant="outline"
            size="default"
            className="min-h-12 flex-1 rounded-xl"
            onClick={handlePauseToggle}
            aria-label={isPaused ? t('fitness.timer.resume') : t('fitness.timer.pause')}
            data-testid="pause-button"
          >
            {isPaused ? t('fitness.timer.resume') : t('fitness.timer.pause')}
          </Button>
          <Button
            variant="default"
            size="default"
            className="min-h-12 flex-1 rounded-xl"
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
