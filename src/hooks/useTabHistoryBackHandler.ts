import { useEffect, useRef } from 'react';
import { useNavigationStore } from '../store/navigationStore';
import { pushBackEntry } from '../services/backNavigationService';

/**
 * Syncs tab changes with the centralized back navigation service.
 * When user switches tabs → pushes a back handler that navigates to previous tab.
 * When back-navigating → uses navigateTabBack to avoid re-pushing history.
 */
export function useTabHistoryBackHandler(): void {
  const activeTab = useNavigationStore(s => s.activeTab);
  const prevTabRef = useRef(activeTab);
  const isBackNavigatingRef = useRef(false);

  useEffect(() => {
    if (isBackNavigatingRef.current) {
      isBackNavigatingRef.current = false;
      prevTabRef.current = activeTab;
      return;
    }

    if (activeTab !== prevTabRef.current) {
      prevTabRef.current = activeTab;
      pushBackEntry(() => {
        const state = useNavigationStore.getState();
        const history = state.tabHistory;
        if (history.length > 0) {
          const prevTab = history[history.length - 1];
          useNavigationStore.setState({ tabHistory: history.slice(0, -1) });
          isBackNavigatingRef.current = true;
          state.navigateTabBack(prevTab);
        }
      });
    }
  }, [activeTab]);
}
