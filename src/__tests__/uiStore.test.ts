import { beforeEach, describe, expect, it } from 'vitest';

import { useUIStore } from '../store/uiStore';

function resetStore() {
  useUIStore.setState({
    hasNewAIResult: false,
    activeManagementSubTab: 'dishes',
    selectedDate: '2025-01-01',
  });
}

describe('uiStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('setHasNewAIResult', () => {
    it('sets hasNewAIResult to true', () => {
      useUIStore.getState().setHasNewAIResult(true);
      expect(useUIStore.getState().hasNewAIResult).toBe(true);
    });

    it('sets hasNewAIResult to false', () => {
      useUIStore.setState({ hasNewAIResult: true });
      useUIStore.getState().setHasNewAIResult(false);
      expect(useUIStore.getState().hasNewAIResult).toBe(false);
    });
  });

  describe('setActiveManagementSubTab', () => {
    it('sets tab to ingredients', () => {
      useUIStore.getState().setActiveManagementSubTab('ingredients');
      expect(useUIStore.getState().activeManagementSubTab).toBe('ingredients');
    });

    it('sets tab to dishes', () => {
      useUIStore.setState({ activeManagementSubTab: 'ingredients' });
      useUIStore.getState().setActiveManagementSubTab('dishes');
      expect(useUIStore.getState().activeManagementSubTab).toBe('dishes');
    });
  });

  describe('setSelectedDate', () => {
    it('sets a custom date string', () => {
      useUIStore.getState().setSelectedDate('2025-12-25');
      expect(useUIStore.getState().selectedDate).toBe('2025-12-25');
    });
  });

  describe('hydrate', () => {
    it('resets state to defaults', () => {
      useUIStore.setState({
        hasNewAIResult: true,
        activeManagementSubTab: 'ingredients',
        selectedDate: '1999-12-31',
      });

      useUIStore.getState().hydrate();

      const state = useUIStore.getState();
      expect(state.hasNewAIResult).toBe(false);
      expect(state.activeManagementSubTab).toBe('dishes');
      expect(state.selectedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
