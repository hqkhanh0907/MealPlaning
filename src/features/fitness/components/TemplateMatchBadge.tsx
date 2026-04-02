import React from 'react';
import { useTranslation } from 'react-i18next';

interface TemplateMatchBadgeProps {
  score: number;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-primary/10 text-primary-emphasis';
  if (score >= 60) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
  return 'bg-muted text-foreground-secondary';
}

function TemplateMatchBadgeInner({ score }: Readonly<TemplateMatchBadgeProps>): React.JSX.Element {
  const { t } = useTranslation();
  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  return (
    <span
      data-testid="template-match-badge"
      aria-label={t('fitness.templateGallery.matchScore', { score: String(clamped) })}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${getScoreColor(clamped)}`}
    >
      {String(clamped)}%
    </span>
  );
}

export const TemplateMatchBadge = React.memo(TemplateMatchBadgeInner);
TemplateMatchBadge.displayName = 'TemplateMatchBadge';

export default TemplateMatchBadge;
