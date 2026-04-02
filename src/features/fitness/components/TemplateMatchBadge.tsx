import React from 'react';
import { useTranslation } from 'react-i18next';

interface TemplateMatchBadgeProps {
  score: number;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40';
  if (score >= 60) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
}

function TemplateMatchBadgeInner({ score }: Readonly<TemplateMatchBadgeProps>): React.JSX.Element {
  const { t } = useTranslation();
  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  return (
    <span
      data-testid="template-match-badge"
      aria-label={t('fitness.templateGallery.matchScore', { score: String(clamped) })}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getScoreColor(clamped)}`}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {String(clamped)}%
    </span>
  );
}

export const TemplateMatchBadge = React.memo(TemplateMatchBadgeInner);
TemplateMatchBadge.displayName = 'TemplateMatchBadge';

export default TemplateMatchBadge;
