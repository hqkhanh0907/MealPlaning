import { Activity, Dumbbell, type LucideIcon, Plus, Scale, TrendingUp } from 'lucide-react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

import { type ActionType, type QuickAction, useQuickActions } from '../hooks/useQuickActions';

const ACTION_ICON_MAP: Record<ActionType, LucideIcon> = {
  'log-weight': Scale,
  'log-breakfast': Plus,
  'log-lunch': Plus,
  'log-dinner': Plus,
  'log-meal': Plus,
  'log-snack': Plus,
  'start-workout': Dumbbell,
  'log-cardio': Activity,
  'view-results': TrendingUp,
};

interface ActionButtonProps {
  action: QuickAction;
  onPress: (action: QuickAction) => void;
}

const ActionButton = React.memo(function ActionButton({ action, onPress }: ActionButtonProps) {
  const { t } = useTranslation();
  const Icon = ACTION_ICON_MAP[action.id];

  const handleClick = useCallback(() => {
    onPress(action);
  }, [onPress, action]);

  if (action.isPrimary) {
    return (
      <Button
        variant="default"
        onClick={handleClick}
        className="bg-primary text-primary-foreground hover:bg-primary flex h-14 min-w-[100px] flex-col items-center justify-center gap-1 rounded-full px-4"
        style={{
          boxShadow: 'var(--shadow-glow)',
        }}
        aria-label={t(action.label)}
        data-testid={`quick-action-${action.id}`}
      >
        <Icon className="h-6 w-6" aria-hidden="true" />
        <span className="text-xs leading-tight font-medium">{t(action.label)}</span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      className="bg-card text-primary border-border flex h-12 min-w-[100px] flex-col items-center justify-center gap-1 rounded-full px-4"
      aria-label={t(action.label)}
      data-testid={`quick-action-${action.id}`}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="text-xs leading-tight font-medium">{t(action.label)}</span>
    </Button>
  );
});

function QuickActionsBarInner({
  onLogWeight,
}: Readonly<{
  onLogWeight?: () => void;
}>): React.ReactElement {
  const { t } = useTranslation();
  const { actions, handleAction } = useQuickActions({ onLogWeight });
  const [left, center, right] = actions;

  return (
    <nav
      className="flex items-end justify-center gap-3 px-4 py-3"
      aria-label={t('quickActions.ariaLabel')}
      data-testid="quick-actions-bar"
    >
      <ActionButton action={left} onPress={handleAction} />
      <ActionButton action={center} onPress={handleAction} />
      <ActionButton action={right} onPress={handleAction} />
    </nav>
  );
}

export const QuickActionsBar = React.memo(QuickActionsBarInner);
