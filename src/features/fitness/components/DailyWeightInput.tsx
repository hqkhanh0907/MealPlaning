import { Check, Minus, Plus, Scale } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { generateUUID } from '@/utils/helpers';

import { useNotification } from '../../../contexts/NotificationContext';
import { useFitnessStore } from '../../../store/fitnessStore';
import { calculateMovingAverage } from '../../dashboard/hooks/useFeedbackLoop';
import type { WeightEntry } from '../types';

const STEP = 0.5;
const MIN_WEIGHT = 30;
const MAX_WEIGHT = 300;
const RECENT_CHIP_COUNT = 5;
const MOVING_AVG_DAYS = 7;
const UNDO_DURATION = 5000;

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
  return { symbol: '→', color: 'text-slate-400 dark:text-slate-500' };
}

function DailyWeightInputInner(): React.JSX.Element {
  const { t } = useTranslation();
  const notify = useNotification();

  const weightEntries = useFitnessStore(s => s.weightEntries);
  const addWeightEntry = useFitnessStore(s => s.addWeightEntry);
  const updateWeightEntry = useFitnessStore(s => s.updateWeightEntry);
  const removeWeightEntry = useFitnessStore(s => s.removeWeightEntry);

  const today = todayStr();
  const yesterday = yesterdayStr();

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

  const initialWeight = todayEntry?.weightKg ?? latestEntry?.weightKg ?? 0;
  const [displayValue, setDisplayValue] = useState<string>(initialWeight > 0 ? String(initialWeight) : '');
  const [numericValue, setNumericValue] = useState<number>(initialWeight);
  const [isSaved, setIsSaved] = useState<boolean>(!!todayEntry);

  const isValid =
    displayValue !== '' &&
    !Number.isNaN(Number.parseFloat(displayValue)) &&
    numericValue >= MIN_WEIGHT &&
    numericValue <= MAX_WEIGHT;

  const delta = useMemo(() => {
    if (!yesterdayEntry || numericValue <= 0) return null;
    return round1(numericValue - yesterdayEntry.weightKg);
  }, [yesterdayEntry, numericValue]);

  const handleIncrement = useCallback(() => {
    setNumericValue(prev => {
      const next = round1(prev + STEP);
      if (next <= MAX_WEIGHT) {
        setDisplayValue(String(next));
        return next;
      }
      return prev;
    });
    setIsSaved(false);
  }, []);

  const handleDecrement = useCallback(() => {
    setNumericValue(prev => {
      const next = round1(prev - STEP);
      if (next >= MIN_WEIGHT) {
        setDisplayValue(String(next));
        return next;
      }
      return prev;
    });
    setIsSaved(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(raw);
    if (raw !== '') {
      const num = Number.parseFloat(raw);
      if (!Number.isNaN(num)) {
        setNumericValue(num);
      }
    }
    setIsSaved(false);
  }, []);

  const handleInputBlur = useCallback(() => {
    if (displayValue !== '' && !Number.isNaN(Number.parseFloat(displayValue))) {
      const num = Number.parseFloat(displayValue);
      setNumericValue(num);
      setDisplayValue(String(num));
    }
  }, [displayValue]);

  const handleChipSelect = useCallback((weight: number) => {
    setNumericValue(weight);
    setDisplayValue(String(weight));
    setIsSaved(false);
  }, []);

  const handleSave = useCallback(() => {
    const now = new Date().toISOString();
    const wasUpdate = !!todayEntry;
    const previousWeight = todayEntry?.weightKg;

    if (todayEntry) {
      updateWeightEntry(todayEntry.id, {
        weightKg: numericValue,
        updatedAt: now,
      });
    } else {
      const entry: WeightEntry = {
        id: generateUUID(),
        date: today,
        weightKg: numericValue,
        createdAt: now,
        updatedAt: now,
      };
      addWeightEntry(entry);
    }
    setIsSaved(true);

    const savedWeight = numericValue;
    notify.success(t('fitness.weight.saved'), `${savedWeight} ${t('fitness.weight.kg')}`, {
      duration: UNDO_DURATION,
      action: {
        label: t('common.undo'),
        onClick: () => {
          if (wasUpdate && todayEntry && previousWeight !== undefined) {
            updateWeightEntry(todayEntry.id, {
              weightKg: previousWeight,
              updatedAt: new Date().toISOString(),
            });
            setNumericValue(previousWeight);
            setDisplayValue(String(previousWeight));
          } else {
            const entries = useFitnessStore.getState().weightEntries;
            const created = entries.find(e => e.date === today);
            if (created) {
              removeWeightEntry(created.id);
            }
            setNumericValue(savedWeight);
            setDisplayValue(String(savedWeight));
          }
          setIsSaved(false);
        },
      },
    });
  }, [todayEntry, numericValue, today, updateWeightEntry, addWeightEntry, removeWeightEntry, notify, t]);

  const barClass = isSaved
    ? 'border-emerald-400 bg-primary-subtle dark:bg-emerald-950/30 dark:border-primary'
    : 'border-slate-300 bg-card dark:border-slate-600';

  return (
    <div
      data-testid="daily-weight-input"
      className={`flex flex-col gap-1 rounded-xl border px-3 py-2 transition-colors ${barClass}`}
    >
      <div className="flex items-center gap-2">
        <Scale className="text-primary h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {t('fitness.weight.todayWeight')}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label={t('common.decrease')}
            onClick={handleDecrement}
            className="text-foreground-secondary flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 transition-colors hover:bg-slate-200 active:scale-95 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <Minus className="h-4 w-4" />
          </button>

          <Input
            type="number"
            data-testid="weight-input"
            aria-label={t('fitness.weight.todayWeight')}
            min={MIN_WEIGHT}
            max={MAX_WEIGHT}
            step={STEP}
            value={displayValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="w-16 text-center text-lg font-bold text-slate-800 tabular-nums"
          />

          <span className="text-muted-foreground text-xs">{t('fitness.weight.kg')}</span>

          <button
            type="button"
            aria-label={t('common.increase')}
            onClick={handleIncrement}
            className="text-foreground-secondary flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 transition-colors hover:bg-slate-200 active:scale-95 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <Plus className="h-4 w-4" />
          </button>

          <button
            type="button"
            data-testid="save-weight-btn"
            aria-label={isSaved ? t('fitness.weight.saved') : t('common.save')}
            disabled={!isValid}
            onClick={handleSave}
            className={`ml-1 flex h-11 w-11 items-center justify-center rounded-lg transition-colors active:scale-95 disabled:opacity-50 ${
              isSaved
                ? 'bg-primary text-primary-foreground'
                : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-800/50'
            }`}
          >
            <Check className="h-4 w-4" />
          </button>
        </div>
      </div>

      {recentChips.length > 0 && (
        <div data-testid="quick-select-chips" className="ml-6 flex flex-wrap gap-1">
          {recentChips.map(w => (
            <button
              key={w}
              type="button"
              aria-label={`${t('fitness.weight.selectWeight')} ${w} ${t('fitness.weight.kg')}`}
              onClick={() => handleChipSelect(w)}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                numericValue === w
                  ? 'dark:border-primary text-primary-emphasis border-emerald-400 bg-emerald-100 dark:bg-emerald-900/40'
                  : 'border-border text-foreground-secondary bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600'
              } tabular-nums`}
            >
              {w}
            </button>
          ))}
        </div>
      )}

      <div className="text-muted-foreground ml-6 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
        {yesterdayEntry && (
          <span data-testid="yesterday-info">
            {t('fitness.weight.yesterday')}: {yesterdayEntry.weightKg} {t('fitness.weight.kg')}
            {delta !== null && (
              <span
                data-testid="weight-delta"
                className={`ml-1 font-medium ${(() => {
                  if (delta < 0) return 'text-primary';
                  if (delta > 0) return 'text-destructive';
                  return 'text-slate-400 dark:text-slate-500';
                })()}`}
              >
                ({delta > 0 ? '+' : ''}
                {delta})
              </span>
            )}
          </span>
        )}

        {movingAvg !== null && (
          <span data-testid="moving-average" className="tabular-nums">
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
    </div>
  );
}

export const DailyWeightInput = React.memo(DailyWeightInputInner);
DailyWeightInput.displayName = 'DailyWeightInput';
