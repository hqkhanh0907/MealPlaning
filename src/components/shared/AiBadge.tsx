import { Sparkles } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

export interface AiBadgeProps {
  className?: string;
}

/**
 * Visual badge for AI-suggested content.
 * Renders "✨ AI" chip with accent styling.
 *
 * Usage: Add to any component that displays AI-generated data.
 * Currently no data source exists on MealSlot to flag AI-suggested meals;
 * integrate with `useAISuggestion` when the data model supports per-item AI origin.
 */
export const AiBadge = React.memo(function AiBadge({ className = '' }: Readonly<AiBadgeProps>) {
  const { t } = useTranslation();

  return (
    <span
      data-testid="ai-badge"
      className={`border-ai/20 bg-ai-subtle text-ai inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      <Sparkles className="size-3" aria-hidden="true" />
      {t('common.aiBadge')}
    </span>
  );
});

AiBadge.displayName = 'AiBadge';
