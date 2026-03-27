import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Scale,
  Plus,
  Dumbbell,
  Activity,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { useQuickActions, type QuickAction, type ActionType } from '../hooks/useQuickActions';

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

const ActionButton = React.memo(function ActionButton({
  action,
  onPress,
}: ActionButtonProps) {
  const { t } = useTranslation();
  const Icon = ACTION_ICON_MAP[action.id];

  const handleClick = useCallback(() => {
    onPress(action);
  }, [onPress, action]);

  if (action.isPrimary) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex min-w-[100px] flex-col items-center justify-center gap-1 rounded-full bg-emerald-500 px-4 text-white"
        style={{
          height: 56,
          boxShadow: 'var(--shadow-glow)',
        }}
        aria-label={t(action.label)}
        data-testid={`quick-action-${action.id}`}
      >
        <Icon size={24} aria-hidden="true" />
        <span className="text-[10px] font-medium leading-tight">
          {t(action.label)}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex min-w-[100px] flex-col items-center justify-center gap-1 rounded-full border border-gray-200 bg-white px-4 text-emerald-600 dark:border-slate-600 dark:bg-slate-800 dark:text-emerald-400"
      style={{ height: 48 }}
      aria-label={t(action.label)}
      data-testid={`quick-action-${action.id}`}
    >
      <Icon size={20} aria-hidden="true" />
      <span className="text-[10px] font-medium leading-tight">
        {t(action.label)}
      </span>
    </button>
  );
});

function QuickActionsBarInner({
  onLogWeight,
}: {
  onLogWeight?: () => void;
}): React.ReactElement {
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
