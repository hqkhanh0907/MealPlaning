import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Minus, Scale } from 'lucide-react';
import { COLORS } from '@/constant/colors';
import { useFitnessStore } from '../../../store/fitnessStore';
import { useHealthProfileStore } from '../../health-profile/store/healthProfileStore';
import type { WeightEntry } from '../../fitness/types';
import type { GoalType } from '../../health-profile/types';

interface TrendResult {
  color: 'green' | 'amber';
  icon: React.FC<{ className?: string; 'aria-hidden'?: boolean }>;
  text: string;
  weeklyChange: number;
}

function getLast7Weights(entries: WeightEntry[]): WeightEntry[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.slice(-7);
}

function computeWeeklyChange(entries: WeightEntry[]): number {
  if (entries.length < 2) return 0;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const oldest = sorted[0];
  const daysDiff = Math.max(
    1,
    (new Date(latest.date).getTime() - new Date(oldest.date).getTime()) /
      86_400_000,
  );
  return ((latest.weightKg - oldest.weightKg) / daysDiff) * 7;
}

function evaluateTrend(
  goalType: GoalType | null,
  weeklyChange: number,
  t: (key: string) => string,
): TrendResult {
  const absChange = Math.abs(weeklyChange);
  const gaining = weeklyChange > 0.05;
  const losing = weeklyChange < -0.05;

  if (goalType === 'cut') {
    if (losing) {
      return {
        color: 'green',
        icon: TrendingDown,
        text: t('dashboard.weightMini.onTrack'),
        weeklyChange,
      };
    }
    return {
      color: 'amber',
      icon: TrendingUp,
      text: t('dashboard.weightMini.needsAdjust'),
      weeklyChange,
    };
  }

  if (goalType === 'bulk') {
    if (gaining && absChange <= 0.5) {
      return {
        color: 'green',
        icon: TrendingUp,
        text: t('dashboard.weightMini.onTrack'),
        weeklyChange,
      };
    }
    if (gaining && absChange > 0.5) {
      return {
        color: 'amber',
        icon: TrendingUp,
        text: t('dashboard.weightMini.gainingFast'),
        weeklyChange,
      };
    }
    return {
      color: 'amber',
      icon: TrendingUp,
      text: t('dashboard.weightMini.needsAdjust'),
      weeklyChange,
    };
  }

  // maintain (default)
  if (absChange <= 0.3) {
    return {
      color: 'green',
      icon: Minus,
      text: t('dashboard.weightMini.stable'),
      weeklyChange,
    };
  }
  return {
    color: 'amber',
    icon: gaining ? TrendingUp : TrendingDown,
    text: t('dashboard.weightMini.needsAdjust'),
    weeklyChange,
  };
}

function buildSparklinePath(entries: WeightEntry[], width: number, height: number): string {
  if (entries.length < 2) return '';
  const weights = entries.map((e) => e.weightKg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;
  const padding = 2;
  const usableH = height - padding * 2;
  const stepX = width / (entries.length - 1);

  return entries
    .map((e, i) => {
      const x = i * stepX;
      const y = padding + usableH - ((e.weightKg - min) / range) * usableH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

interface WeightMiniProps {
  onTap?: () => void;
}

function WeightMiniInner({ onTap }: WeightMiniProps): React.ReactElement {
  const { t } = useTranslation();
  const weightEntries = useFitnessStore((s) => s.weightEntries);
  const activeGoal = useHealthProfileStore((s) => s.activeGoal);

  const latestWeight = useMemo(() => {
    if (weightEntries.length === 0) return null;
    return [...weightEntries].sort((a, b) =>
      b.date.localeCompare(a.date),
    )[0];
  }, [weightEntries]);

  const last7 = useMemo(() => getLast7Weights(weightEntries), [weightEntries]);

  const trend = useMemo(() => {
    const weeklyChange = computeWeeklyChange(last7);
    const goalType = activeGoal?.type ?? 'maintain';
    return evaluateTrend(goalType, weeklyChange, t);
  }, [last7, activeGoal, t]);

  const sparklinePath = useMemo(
    () => buildSparklinePath(last7, 80, 32),
    [last7],
  );

  const handleTap = useCallback(() => {
    onTap?.();
  }, [onTap]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onTap?.();
      }
    },
    [onTap],
  );

  if (!latestWeight) {
    return (
      <div
        data-testid="weight-mini-empty"
        role="button"
        tabIndex={0}
        aria-label={t('dashboard.weightMini.a11yEmpty')}
        onClick={handleTap}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50"
      >
        <Scale className="h-5 w-5 text-slate-400" aria-hidden={true} />
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {t('dashboard.weightMini.noData')}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t('dashboard.weightMini.logFirst')}
          </p>
        </div>
      </div>
    );
  }

  const TrendIcon = trend.icon;
  const colorClasses =
    trend.color === 'green'
      ? {
          bg: 'bg-emerald-50 dark:bg-emerald-900/15',
          icon: 'text-emerald-600 dark:text-emerald-400',
          text: 'text-emerald-700 dark:text-emerald-400',
          spark: COLORS.emerald500,
        }
      : {
          bg: 'bg-amber-50 dark:bg-amber-900/15',
          icon: 'text-amber-600 dark:text-amber-400',
          text: 'text-amber-700 dark:text-amber-400',
          spark: COLORS.amber500,
        };

  return (
    <div
      data-testid="weight-mini"
      role="button"
      tabIndex={0}
      aria-label={t('dashboard.weightMini.a11y', {
        weight: latestWeight.weightKg,
        trend: trend.text,
      })}
      onClick={handleTap}
      onKeyDown={handleKeyDown}
      className={`flex items-center gap-3 rounded-2xl ${colorClasses.bg} p-3 cursor-pointer transition-transform active:scale-[0.98]`}
    >
      <div className="flex-1 min-w-0">
        <span
          className="text-base font-bold text-slate-800 dark:text-slate-200"
          style={{ fontVariantNumeric: 'tabular-nums' }}
          data-testid="weight-value"
        >
          {latestWeight.weightKg}
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-0.5">
            {t('dashboard.weightMini.unit')}
          </span>
        </span>
        <div className="mt-1 flex items-center gap-1" data-testid="weight-trend">
          <TrendIcon
            className={`h-3.5 w-3.5 ${colorClasses.icon}`}
            aria-hidden={true}
          />
          <span className={`text-xs font-medium ${colorClasses.text}`}>
            {trend.text}
          </span>
        </div>
      </div>

      {last7.length >= 2 && (
        <svg
          width="80"
          height="32"
          viewBox="0 0 80 32"
          fill="none"
          aria-hidden="true"
          data-testid="weight-sparkline"
          className="flex-shrink-0"
        >
          <polyline
            points={sparklinePath}
            stroke={colorClasses.spark}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      )}
    </div>
  );
}

export const WeightMini = React.memo(WeightMiniInner);
