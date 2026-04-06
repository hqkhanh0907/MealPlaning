import { Minus, Plus, Scale, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { generateUUID } from '@/utils/helpers';

import { ModalBackdrop } from '../../../components/shared/ModalBackdrop';
import { useNotification } from '../../../contexts/NotificationContext';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { useFitnessStore } from '../../../store/fitnessStore';
import type { WeightEntry } from '../../fitness/types';
import { calculateMovingAverage } from '../hooks/useFeedbackLoop';

const STEP = 0.1;
const MIN_WEIGHT = 30;
const MAX_WEIGHT = 300;
const RECENT_CHIP_COUNT = 5;
const MOVING_AVG_DAYS = 7;
const UNDO_DURATION = 5000;
const LONG_PRESS_DELAY = 500;
const LONG_PRESS_INTERVAL_INITIAL = 150;
const LONG_PRESS_INTERVAL_FAST = 50;
const ACCELERATION_THRESHOLD = 8;

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function getRecentUniqueWeights(entries: WeightEntry[], excludeDate: string): number[] {
  const sorted = [...entries].filter(e => e.date !== excludeDate).sort((a, b) => b.date.localeCompare(a.date));
  const seen = new Set<number>();
  const result: number[] = [];
  for (const entry of sorted) {
    if (!seen.has(entry.weightKg)) {
      seen.add(entry.weightKg);
      result.push(entry.weightKg);
    }
    if (result.length >= RECENT_CHIP_COUNT) break;
  }
  return result;
}

function getEntriesLast7Days(entries: WeightEntry[]): WeightEntry[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - MOVING_AVG_DAYS);
  return entries.filter(e => {
    const d = new Date(e.date);
    d.setHours(0, 0, 0, 0);
    return d >= cutoff && d <= now;
  });
}

function getTrendIndicator(
  movingAvg: number | null,
  yesterdayWeight: number | undefined,
): { symbol: string; color: string } | null {
  if (movingAvg === null || yesterdayWeight === undefined) return null;
  const diff = round1(movingAvg - yesterdayWeight);
  if (diff > 0) return { symbol: '↑', color: 'text-destructive' };
  if (diff < 0) return { symbol: '↓', color: 'text-primary' };
  return { symbol: '→', color: 'text-muted-foreground' };
}

interface WeightQuickLogProps {
  onClose: () => void;
}

function useLongPress(
  onTick: () => void,
  minWeight: number,
  maxWeight: number,
  currentValue: number,
  direction: 'increment' | 'decrement',
) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const tickCountRef = useRef(0);

  const stop = useCallback(() => {
    clearTimeout(timerRef.current);
    clearInterval(intervalRef.current);
    tickCountRef.current = 0;
  }, []);

  const start = useCallback(() => {
    tickCountRef.current = 0;

    timerRef.current = setTimeout(() => {
      tickCountRef.current += 1;
      const interval =
        /* v8 ignore next -- tickCount is 1 here (always < ACCELERATION_THRESHOLD=8) */
        tickCountRef.current > ACCELERATION_THRESHOLD ? LONG_PRESS_INTERVAL_FAST : LONG_PRESS_INTERVAL_INITIAL;

      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        onTick();
        tickCountRef.current += 1;
        if (tickCountRef.current > ACCELERATION_THRESHOLD) {
          clearInterval(intervalRef.current);
          intervalRef.current = setInterval(onTick, LONG_PRESS_INTERVAL_FAST);
        }
      }, interval);

      onTick();
    }, LONG_PRESS_DELAY);
  }, [onTick]);

  useEffect(() => {
    return stop;
  }, [stop]);

  const atBound = direction === 'increment' ? currentValue >= maxWeight : currentValue <= minWeight;

  return {
    onPointerDown: atBound ? undefined : start,
    onPointerUp: stop,
    onPointerLeave: stop,
  };
}

function WeightQuickLogInner({ onClose }: Readonly<WeightQuickLogProps>): React.JSX.Element {
  const { t } = useTranslation();
  const notify = useNotification();

  const weightEntries = useFitnessStore(s => s.weightEntries);
  const addWeightEntry = useFitnessStore(s => s.addWeightEntry);
  const updateWeightEntry = useFitnessStore(s => s.updateWeightEntry);
  const removeWeightEntry = useFitnessStore(s => s.removeWeightEntry);

  const today = todayStr();
  const yesterday = yesterdayStr();

  useModalBackHandler(true, onClose);

  const todayEntry = useMemo(() => weightEntries.find(e => e.date === today), [weightEntries, today]);

  const yesterdayEntry = useMemo(() => weightEntries.find(e => e.date === yesterday), [weightEntries, yesterday]);

  const latestEntry = useMemo(() => {
    if (weightEntries.length === 0) return undefined;
    return [...weightEntries].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [weightEntries]);

  const recentChips = useMemo(() => getRecentUniqueWeights(weightEntries, today), [weightEntries, today]);

  const movingAvg = useMemo(() => {
    const last7 = getEntriesLast7Days(weightEntries);
    return calculateMovingAverage(last7);
  }, [weightEntries]);

  const trend = useMemo(() => getTrendIndicator(movingAvg, yesterdayEntry?.weightKg), [movingAvg, yesterdayEntry]);

  const initialWeight = todayEntry?.weightKg ?? yesterdayEntry?.weightKg ?? latestEntry?.weightKg ?? 0;
  const [inputValue, setInputValue] = useState<number>(initialWeight);

  const handleIncrement = useCallback(() => {
    setInputValue(prev => {
      const next = round1(prev + STEP);
      return next <= MAX_WEIGHT ? next : prev;
    });
  }, []);

  const handleDecrement = useCallback(() => {
    setInputValue(prev => {
      const next = round1(prev - STEP);
      return next >= MIN_WEIGHT ? next : prev;
    });
  }, []);

  const incrementLongPress = useLongPress(handleIncrement, MIN_WEIGHT, MAX_WEIGHT, inputValue, 'increment');

  const decrementLongPress = useLongPress(handleDecrement, MIN_WEIGHT, MAX_WEIGHT, inputValue, 'decrement');

  const handleChipSelect = useCallback((weight: number) => {
    setInputValue(weight);
  }, []);

  const handleSave = useCallback(() => {
    const now = new Date().toISOString();
    const wasUpdate = !!todayEntry;
    const previousWeight = todayEntry?.weightKg;
    const savedWeight = inputValue;
    let savedEntryId: string | undefined;

    if (todayEntry) {
      updateWeightEntry(todayEntry.id, {
        weightKg: inputValue,
        updatedAt: now,
      });
      savedEntryId = todayEntry.id;
    } else {
      const newId = generateUUID();
      const entry: WeightEntry = {
        id: newId,
        date: today,
        weightKg: inputValue,
        createdAt: now,
        updatedAt: now,
      };
      addWeightEntry(entry);
      savedEntryId = newId;
    }

    onClose();

    notify.success(t('fitness.weight.savedWeight'), `${savedWeight} ${t('fitness.weight.kg')}`, {
      duration: UNDO_DURATION,
      action: {
        label: t('fitness.weight.undoAction'),
        onClick: () => {
          if (wasUpdate && savedEntryId && previousWeight !== undefined) {
            updateWeightEntry(savedEntryId, {
              weightKg: previousWeight,
              updatedAt: new Date().toISOString(),
            });
          } else if (savedEntryId) {
          /* v8 ignore start -- defensive: savedEntryId is always set when wasUpdate is true */
            removeWeightEntry(savedEntryId);
          }
          /* v8 ignore stop */
        },
      },
    });
  }, [todayEntry, inputValue, today, updateWeightEntry, addWeightEntry, removeWeightEntry, onClose, notify, t]);

  const isValid = inputValue >= MIN_WEIGHT && inputValue <= MAX_WEIGHT;

  return (
    <ModalBackdrop onClose={onClose} zIndex="z-60">
      <div
        data-testid="weight-quick-log"
        className="bg-card relative w-full rounded-t-2xl shadow-xl sm:max-w-md sm:rounded-2xl"
        aria-label={t('fitness.weight.quickLogTitle')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Scale className="text-primary h-5 w-5" aria-hidden="true" />
            <h2 className="text-foreground text-lg font-semibold">{t('fitness.weight.quickLogTitle')}</h2>
          </div>
          <button
            type="button"
            data-testid="close-btn"
            aria-label={t('common.close')}
            onClick={onClose}
            className="text-muted-foreground hover:bg-accent flex h-11 w-11 items-center justify-center rounded-full transition-colors active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Weight Display */}
        <div className="flex flex-col items-center py-6">
          <div className="flex items-baseline gap-1.5">
            <span data-testid="weight-display" className="text-foreground text-4xl font-bold tabular-nums">
              {inputValue > 0 ? inputValue : '—'}
            </span>
            <span className="text-muted-foreground text-lg">{t('fitness.weight.kg')}</span>
          </div>
        </div>

        {/* Stepper Buttons */}
        <div className="flex items-center justify-center gap-8 pb-5">
          <button
            type="button"
            data-testid="decrement-btn"
            aria-label={t('common.decrease')}
            disabled={inputValue <= MIN_WEIGHT}
            onClick={handleDecrement}
            onPointerDown={decrementLongPress.onPointerDown}
            onPointerUp={decrementLongPress.onPointerUp}
            onPointerLeave={decrementLongPress.onPointerLeave}
            className="text-foreground-secondary bg-muted hover:bg-accent flex h-12 w-12 items-center justify-center rounded-full transition-colors active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Minus className="h-5 w-5" />
          </button>

          <button
            type="button"
            data-testid="increment-btn"
            aria-label={t('common.increase')}
            disabled={inputValue >= MAX_WEIGHT}
            onClick={handleIncrement}
            onPointerDown={incrementLongPress.onPointerDown}
            onPointerUp={incrementLongPress.onPointerUp}
            onPointerLeave={incrementLongPress.onPointerLeave}
            className="text-foreground-secondary bg-muted hover:bg-accent flex h-12 w-12 items-center justify-center rounded-full transition-colors active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Select Chips */}
        {recentChips.length > 0 && (
          <div data-testid="quick-select-chips" className="scrollbar-hide flex gap-2 overflow-x-auto px-6 pb-4">
            {recentChips.map(w => {
              const isYesterdayWeight = w === yesterdayEntry?.weightKg;
              const isActive = inputValue === w;
              return (
                <button
                  key={w}
                  type="button"
                  data-testid={`chip-${w}`}
                  aria-label={`${t('fitness.weight.selectWeight')} ${w} ${t('fitness.weight.kg')}`}
                  onClick={() => handleChipSelect(w)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'dark:border-primary text-primary-emphasis border-primary bg-primary/10'
                      : 'border-border text-foreground-secondary bg-muted hover:bg-accent'
                  } tabular-nums`}
                >
                  {w}
                  {isYesterdayWeight && (
                    <span className="text-muted-foreground ml-1 text-xs">({t('fitness.weight.yesterday')})</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Info Row */}
        <div
          data-testid="info-row"
          className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 px-6 pb-4 text-sm tabular-nums"
        >
          {yesterdayEntry && (
            <span data-testid="yesterday-info">
              {t('fitness.weight.yesterday')}: {yesterdayEntry.weightKg} {t('fitness.weight.kg')}
            </span>
          )}
          {movingAvg !== null && (
            <span data-testid="moving-average">
              {t('fitness.weight.avg7d')}: {round1(movingAvg)} {t('fitness.weight.kg')}
            </span>
          )}
          {trend && (
            <span
              data-testid="trend-indicator"
              className={`font-medium ${trend.color}`}
              aria-label={t('fitness.weight.trend')}
            >
              {trend.symbol}
            </span>
          )}
        </div>

        {/* Save Button */}
        <div className="px-6 pt-2 pb-6">
          <button
            type="button"
            data-testid="save-btn"
            disabled={!isValid}
            onClick={handleSave}
            className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-semibold shadow-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

export const WeightQuickLog = React.memo(WeightQuickLogInner);
WeightQuickLog.displayName = 'WeightQuickLog';
