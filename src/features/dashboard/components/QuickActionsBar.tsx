import { Activity, type LucideIcon, Scale } from 'lucide-react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

import { type ActionType, type QuickAction, useQuickActions } from '../hooks/useQuickActions';

const ACTION_ICON_MAP: Record<ActionType, LucideIcon> = {
  'log-weight': Scale,
  'log-cardio': Activity,
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

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      className="bg-muted text-foreground flex h-10 flex-1 items-center justify-center gap-2 rounded-full shadow-sm"
      aria-label={t(action.label)}
      data-testid={`quick-action-${action.id}`}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="text-sm font-medium">{t(action.label)}</span>
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
  const [left, right] = actions;

  return (
    <nav className="flex gap-2 px-4 py-3" aria-label={t('quickActions.ariaLabel')} data-testid="quick-actions-bar">
      <ActionButton action={left} onPress={handleAction} />
      <ActionButton action={right} onPress={handleAction} />
    </nav>
  );
}

export const QuickActionsBar = React.memo(QuickActionsBarInner);
