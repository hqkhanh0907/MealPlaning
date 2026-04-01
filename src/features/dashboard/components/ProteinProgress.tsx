import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export interface ProteinProgressProps {
  current: number;
  target: number;
}

const SUGGESTION_COUNT = 5;

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getBarColorClass(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-gray-400';
}

export const ProteinProgress: React.FC<ProteinProgressProps> = React.memo(
  ({ current, target }) => {
    const { t } = useTranslation();

    const safeTarget = target > 0 ? target : 1;
    const pct = Math.min(
      100,
      Math.max(0, Math.round((current / safeTarget) * 100)),
    );
    const deficit = target - current;

    const barColorClass = getBarColorClass(pct);

    const suggestion = useMemo(() => {
      if (deficit <= 0) return t('nutrition.proteinGoalMet');
      if (deficit <= 20) return t('nutrition.proteinNearGoal');
      if (deficit <= 50) {
        const dayIndex = getDayOfYear() % SUGGESTION_COUNT;
        return t(`nutrition.proteinSuggestion${dayIndex}`);
      }
      return t('nutrition.proteinNeedSignificant');
    }, [deficit, t]);

    const roundedCurrent = Math.round(current);
    const roundedTarget = Math.round(target);

    return (
      <div
        className="space-y-1"
        style={{ minHeight: 48 }}
        >
        <progress
          data-testid="protein-progress"
          className="sr-only"
          style={{ minHeight: 48 }}
          value={roundedCurrent}
          max={roundedTarget}
          role="progressbar"
          aria-valuenow={roundedCurrent}
          aria-valuemin={0}
          aria-valuemax={roundedTarget}
          aria-label={`Protein: ${roundedCurrent}g trên ${roundedTarget}g. ${suggestion}`}
        >
          {t('nutrition.protein')}: {roundedCurrent}g / {roundedTarget}g. {suggestion}
        </progress>
        {/* Header: label + number */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {t('nutrition.protein')}
          </span>
          <span
            data-testid="protein-display"
            className="text-xs font-semibold text-slate-800 dark:text-slate-100"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {roundedCurrent}g / {roundedTarget}g
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
          <div
            data-testid="protein-bar"
            className={`h-full rounded-full transition-all ${barColorClass}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Suggestion text */}
        <p
          data-testid="protein-suggestion"
          className="text-[10px] text-slate-500 dark:text-slate-400"
        >
          {suggestion}
        </p>
      </div>
    );
  },
);

ProteinProgress.displayName = 'ProteinProgress';
