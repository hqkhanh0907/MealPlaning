import { beforeEach, describe, expect, it } from 'vitest';

import type { PageEntry } from '../store/navigationStore';
import { useNavigationStore } from '../store/navigationStore';

const initialState = () => ({
  activeTab: 'calendar' as const,
  pageStack: [] as PageEntry[],
  showBottomNav: true,
  tabScrollPositions: {} as Record<string, number>,
});

function resetStore() {
  useNavigationStore.setState({
    ...initialState(),
  });
}

describe('navigationStore', () => {
  beforeEach(() => {
    resetStore();
  });

  // 1. Initial state
  describe('initial state', () => {
    it('has activeTab set to calendar', () => {
      const state = useNavigationStore.getState();
      expect(state.activeTab).toBe('calendar');
    });

    it('has empty pageStack', () => {
      const state = useNavigationStore.getState();
      expect(state.pageStack).toEqual([]);
    });

    it('has showBottomNav set to true', () => {
      const state = useNavigationStore.getState();
      expect(state.showBottomNav).toBe(true);
    });

    it('has empty tabScrollPositions', () => {
      const state = useNavigationStore.getState();
      expect(state.tabScrollPositions).toEqual({});
    });
  });

  // 2-4. navigateTab
  describe('navigateTab', () => {
    it('switches tab correctly', () => {
      const { navigateTab } = useNavigationStore.getState();
      navigateTab('library');
      expect(useNavigationStore.getState().activeTab).toBe('library');
    });

    it('switches to all available tabs', () => {
      const { navigateTab } = useNavigationStore.getState();
      const tabs = ['calendar', 'library', 'ai-analysis', 'fitness', 'dashboard'] as const;
      for (const tab of tabs) {
        navigateTab(tab);
        expect(useNavigationStore.getState().activeTab).toBe(tab);
      }
    });

    it('clears pageStack when switching tabs', () => {
      const { pushPage, navigateTab } = useNavigationStore.getState();
      pushPage({ id: 'page-1', component: 'Page1' });
      expect(useNavigationStore.getState().pageStack).toHaveLength(1);

      navigateTab('fitness');
      expect(useNavigationStore.getState().pageStack).toEqual([]);
    });

    it('shows bottom nav when switching tabs', () => {
      const { pushPage, navigateTab } = useNavigationStore.getState();
      pushPage({ id: 'page-1', component: 'Page1' });
      expect(useNavigationStore.getState().showBottomNav).toBe(false);

      navigateTab('dashboard');
      expect(useNavigationStore.getState().showBottomNav).toBe(true);
    });
  });

  // 5-7. pushPage
  describe('pushPage', () => {
    it('adds page to stack', () => {
      const { pushPage } = useNavigationStore.getState();
      const page: PageEntry = { id: 'workout-logger', component: 'WorkoutLogger' };
      pushPage(page);

      const state = useNavigationStore.getState();
      expect(state.pageStack).toHaveLength(1);
      expect(state.pageStack[0]).toEqual(page);
    });

    it('preserves props on pushed page', () => {
      const { pushPage } = useNavigationStore.getState();
      const page: PageEntry = { id: 'detail', component: 'Detail', props: { itemId: 42 } };
      pushPage(page);

      expect(useNavigationStore.getState().pageStack[0].props).toEqual({ itemId: 42 });
    });

    it('hides bottom nav', () => {
      const { pushPage } = useNavigationStore.getState();
      pushPage({ id: 'page-1', component: 'Page1' });
      expect(useNavigationStore.getState().showBottomNav).toBe(false);
    });

    it('allows pushing up to 2 pages', () => {
      const { pushPage } = useNavigationStore.getState();
      pushPage({ id: 'page-1', component: 'Page1' });
      pushPage({ id: 'page-2', component: 'Page2' });

      const state = useNavigationStore.getState();
      expect(state.pageStack).toHaveLength(2);
      expect(state.pageStack[0].id).toBe('page-1');
      expect(state.pageStack[1].id).toBe('page-2');
    });

    it('replaces top page when at max depth of 2', () => {
      const { pushPage } = useNavigationStore.getState();
      pushPage({ id: 'page-1', component: 'Page1' });
      pushPage({ id: 'page-2', component: 'Page2' });
      pushPage({ id: 'page-3', component: 'Page3' });

      const state = useNavigationStore.getState();
      expect(state.pageStack).toHaveLength(2);
      expect(state.pageStack[0].id).toBe('page-1');
      expect(state.pageStack[1].id).toBe('page-3');
    });

    it('keeps bottom nav hidden after replacing top page', () => {
      const { pushPage } = useNavigationStore.getState();
      pushPage({ id: 'page-1', component: 'Page1' });
      pushPage({ id: 'page-2', component: 'Page2' });
      pushPage({ id: 'page-3', component: 'Page3' });

      expect(useNavigationStore.getState().showBottomNav).toBe(false);
    });
  });

  // 8-10. popPage
  describe('popPage', () => {
    it('removes top page from stack', () => {
      const { pushPage, popPage } = useNavigationStore.getState();
      pushPage({ id: 'page-1', component: 'Page1' });
      pushPage({ id: 'page-2', component: 'Page2' });
      popPage();

      const state = useNavigationStore.getState();
      expect(state.pageStack).toHaveLength(1);
      expect(state.pageStack[0].id).toBe('page-1');
    });

    it('shows bottom nav when stack becomes empty', () => {
      const { pushPage, popPage } = useNavigationStore.getState();
      pushPage({ id: 'page-1', component: 'Page1' });
      expect(useNavigationStore.getState().showBottomNav).toBe(false);

      popPage();
      expect(useNavigationStore.getState().showBottomNav).toBe(true);
      expect(useNavigationStore.getState().pageStack).toEqual([]);
    });

    it('keeps bottom nav hidden when stack is not empty after pop', () => {
      const { pushPage, popPage } = useNavigationStore.getState();
      pushPage({ id: 'page-1', component: 'Page1' });
      pushPage({ id: 'page-2', component: 'Page2' });
      popPage();

      expect(useNavigationStore.getState().showBottomNav).toBe(false);
      expect(useNavigationStore.getState().pageStack).toHaveLength(1);
    });

    it('does nothing on empty stack', () => {
      const stateBefore = useNavigationStore.getState();
      stateBefore.popPage();
      const stateAfter = useNavigationStore.getState();

      expect(stateAfter.activeTab).toBe(stateBefore.activeTab);
      expect(stateAfter.pageStack).toEqual([]);
      expect(stateAfter.showBottomNav).toBe(true);
    });
  });

  // 11-12. canGoBack
  describe('canGoBack', () => {
    it('returns true when pages are in stack', () => {
      const { pushPage } = useNavigationStore.getState();
      pushPage({ id: 'page-1', component: 'Page1' });
      expect(useNavigationStore.getState().canGoBack()).toBe(true);
    });

    it('returns false when stack is empty', () => {
      expect(useNavigationStore.getState().canGoBack()).toBe(false);
    });

    it('returns false after popping all pages', () => {
      const { pushPage, popPage } = useNavigationStore.getState();
      pushPage({ id: 'page-1', component: 'Page1' });
      popPage();
      expect(useNavigationStore.getState().canGoBack()).toBe(false);
    });
  });

  // 13-15. scroll positions
  describe('scroll positions', () => {
    it('stores scroll position for a tab', () => {
      const { setScrollPosition } = useNavigationStore.getState();
      setScrollPosition('calendar', 250);
      expect(useNavigationStore.getState().tabScrollPositions['calendar']).toBe(250);
    });

    it('retrieves stored scroll position', () => {
      const { setScrollPosition } = useNavigationStore.getState();
      setScrollPosition('library', 500);
      expect(useNavigationStore.getState().getScrollPosition('library')).toBe(500);
    });

    it('returns 0 for unset tab', () => {
      expect(useNavigationStore.getState().getScrollPosition('fitness')).toBe(0);
    });

    it('overwrites previous scroll position', () => {
      const { setScrollPosition } = useNavigationStore.getState();
      setScrollPosition('calendar', 100);
      setScrollPosition('calendar', 300);
      expect(useNavigationStore.getState().getScrollPosition('calendar')).toBe(300);
    });

    it('stores positions for multiple tabs independently', () => {
      const { setScrollPosition } = useNavigationStore.getState();
      setScrollPosition('calendar', 100);
      setScrollPosition('library', 200);
      setScrollPosition('fitness', 300);

      const state = useNavigationStore.getState();
      expect(state.getScrollPosition('calendar')).toBe(100);
      expect(state.getScrollPosition('library')).toBe(200);
      expect(state.getScrollPosition('fitness')).toBe(300);
    });
  });

  // 16. Full workflow
  describe('full workflow', () => {
    it('tab → push → push (replace) → pop → pop → bottom nav shows', () => {
      const store = useNavigationStore.getState();

      // Start at calendar
      expect(store.activeTab).toBe('calendar');
      expect(store.showBottomNav).toBe(true);

      // Navigate to library tab
      store.navigateTab('library');
      let state = useNavigationStore.getState();
      expect(state.activeTab).toBe('library');
      expect(state.showBottomNav).toBe(true);
      expect(state.pageStack).toEqual([]);

      // Push first page
      state.pushPage({ id: 'workout-logger', component: 'WorkoutLogger' });
      state = useNavigationStore.getState();
      expect(state.pageStack).toHaveLength(1);
      expect(state.showBottomNav).toBe(false);
      expect(state.canGoBack()).toBe(true);

      // Push second page (at depth 2)
      state.pushPage({ id: 'cardio-logger', component: 'CardioLogger' });
      state = useNavigationStore.getState();
      expect(state.pageStack).toHaveLength(2);
      expect(state.showBottomNav).toBe(false);

      // Push third page — should replace top (still depth 2)
      state.pushPage({ id: 'settings-detail', component: 'SettingsDetail' });
      state = useNavigationStore.getState();
      expect(state.pageStack).toHaveLength(2);
      expect(state.pageStack[1].id).toBe('settings-detail');
      expect(state.showBottomNav).toBe(false);

      // Pop — back to 1 page
      state.popPage();
      state = useNavigationStore.getState();
      expect(state.pageStack).toHaveLength(1);
      expect(state.pageStack[0].id).toBe('workout-logger');
      expect(state.showBottomNav).toBe(false);
      expect(state.canGoBack()).toBe(true);

      // Pop — stack empty, bottom nav returns
      state.popPage();
      state = useNavigationStore.getState();
      expect(state.pageStack).toEqual([]);
      expect(state.showBottomNav).toBe(true);
      expect(state.canGoBack()).toBe(false);
      expect(state.activeTab).toBe('library');
    });

    it('scroll positions persist across tab switches', () => {
      const store = useNavigationStore.getState();

      store.setScrollPosition('calendar', 150);
      store.navigateTab('library');
      store.setScrollPosition('library', 300);
      store.navigateTab('calendar');

      const state = useNavigationStore.getState();
      expect(state.getScrollPosition('calendar')).toBe(150);
      expect(state.getScrollPosition('library')).toBe(300);
    });
  });
});
