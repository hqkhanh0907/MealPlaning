import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ScoreBadgeProps {
  readonly score: number;
  readonly className?: string;
}

function getColorClasses(score: number): string {
  if (score >= 80) return 'bg-success-subtle text-success border border-success/20';
  if (score >= 50) return 'bg-warning-subtle text-warning border border-warning/20';
  return 'bg-muted text-muted-foreground border border-border';
}

function ScoreBadgeInner({ score, className }: ScoreBadgeProps) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  const safeScore = Number.isFinite(score) ? score : 0;
  const colorClasses = getColorClasses(safeScore);
  const animationClass = reducedMotion ? '' : ' score-badge-pulse';
  const extraClass = className ? ` ${className}` : '';
  const baseClass = `inline-flex items-center justify-center rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums ${colorClasses}${animationClass}${extraClass}`;

  return (
    <>
      {reducedMotion ? null : (
        <style>{`@keyframes score-pulse{0%{transform:scale(1)}50%{transform:scale(1.05)}100%{transform:scale(1)}}`}</style>
      )}
      <span
        data-testid="score-badge"
        aria-label={t('dashboard.score.a11y', { score: safeScore })}
        className={baseClass}
        style={reducedMotion ? undefined : { animation: 'score-pulse 400ms var(--ease-spring)' }}
      >
        {safeScore}
      </span>
    </>
  );
}

export const ScoreBadge = memo(ScoreBadgeInner);
