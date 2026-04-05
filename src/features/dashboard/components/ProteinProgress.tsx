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
  if (pct >= 80) return 'bg-primary';
  if (pct >= 50) return 'bg-warning';
  return 'bg-muted-foreground';
}

export const ProteinProgress = React.memo(function ProteinProgress({ current, target }: ProteinProgressProps) {
  const { t } = useTranslation();

  const roundedCurrent = Math.round(current);
  const roundedTarget = Number.isFinite(target) ? Math.round(target) : 0;
  const safeTarget = Number.isFinite(target) && target > 0 ? target : 1;
  const pct = Math.min(100, Math.max(0, Math.round((current / safeTarget) * 100)));
  const deficit = roundedTarget - roundedCurrent;

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

  return (
    <div className="space-y-1" style={{ minHeight: 48 }}>
      <progress
        data-testid="protein-progress"
        className="sr-only"
        style={{ minHeight: 48 }}
        value={roundedCurrent}
        max={roundedTarget}
        aria-valuenow={roundedCurrent}
        aria-valuemin={0}
        aria-valuemax={roundedTarget}
        aria-label={t('nutrition.proteinAriaLabel', { current: roundedCurrent, target: roundedTarget, suggestion })}
      >
        {t('nutrition.protein')}: {roundedCurrent}g / {roundedTarget}g. {suggestion}
      </progress>
      {/* Header: label + number */}
      <div className="flex items-center justify-between">
        <span className="text-foreground text-xs font-medium">{t('nutrition.protein')}</span>
        <span data-testid="protein-display" className="text-foreground text-xs font-semibold tabular-nums">
          {roundedCurrent}g / {roundedTarget}g
        </span>
      </div>

      {/* Progress bar */}
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div
          data-testid="protein-bar"
          className={`h-full rounded-full transition-all ${barColorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Suggestion text */}
      <p data-testid="protein-suggestion" className="text-muted-foreground text-xs">
        {suggestion}
      </p>
    </div>
  );
});

ProteinProgress.displayName = 'ProteinProgress';
