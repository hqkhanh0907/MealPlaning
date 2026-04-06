import { useCallback, useMemo } from 'react';

import { useNavigationStore } from '../../../store/navigationStore';

export type ActionType = 'log-weight' | 'log-cardio';

export interface QuickAction {
  id: ActionType;
  label: string;
}

function makeAction(id: ActionType, label: string): QuickAction {
  return { id, label };
}

export function determineQuickActions(): [QuickAction, QuickAction] {
  return [makeAction('log-weight', 'quickActions.logWeight'), makeAction('log-cardio', 'quickActions.logCardio')];
}

export function useQuickActions(options?: { onLogWeight?: () => void }): {
  actions: [QuickAction, QuickAction];
  handleAction: (action: QuickAction) => void;
} {
  const navigateTab = useNavigationStore(s => s.navigateTab);

  const actions = useMemo(() => determineQuickActions(), []);

  const handleAction = useCallback(
    (action: QuickAction) => {
      switch (action.id) {
        case 'log-weight':
          if (options?.onLogWeight) {
            options.onLogWeight();
          } else {
            navigateTab('fitness');
          }
          break;
        case 'log-cardio':
          navigateTab('fitness');
          break;
      }
    },
    [navigateTab, options],
  );

  return { actions, handleAction };
}
