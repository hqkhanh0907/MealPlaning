import { ChevronRight, Dumbbell, Scale, UtensilsCrossed } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface NextActionStripProps {
  readonly actionType: 'log-meal' | 'start-workout' | 'log-weight';
  readonly onAction: () => void;
}

const ACTION_CONFIG = {
  'log-meal': { icon: UtensilsCrossed, labelKey: 'dashboard.nextAction.logMeal' },
  'start-workout': { icon: Dumbbell, labelKey: 'dashboard.nextAction.startWorkout' },
  'log-weight': { icon: Scale, labelKey: 'dashboard.nextAction.logWeight' },
} as const;

function NextActionStripInner({ actionType, onAction }: NextActionStripProps): React.ReactElement {
  const { t } = useTranslation();
  const config = ACTION_CONFIG[actionType];
  const Icon = config.icon;
  const label = t(config.labelKey);

  return (
    <button
      type="button"
      data-testid="next-action-strip"
      aria-label={t('dashboard.nextAction.a11y', { action: label })}
      onClick={onAction}
      className="interactive bg-primary-subtle text-primary flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-3"
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="flex-1 text-left text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
    </button>
  );
}

export const NextActionStrip = React.memo(NextActionStripInner);
