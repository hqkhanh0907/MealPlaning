import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('navigationStore tabHistory', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  it('navigateTab pushes current tab to tabHistory', async () => {
    const { useNavigationStore } = await import('../store/navigationStore');
    const store = useNavigationStore.getState();
    expect(store.activeTab).toBe('calendar');
    expect(store.tabHistory).toEqual([]);

    act(() => store.navigateTab('library'));

    const updated = useNavigationStore.getState();
    expect(updated.activeTab).toBe('library');
    expect(updated.tabHistory).toEqual(['calendar']);
  });

  it('navigateTabBack does NOT push to tabHistory', async () => {
    const { useNavigationStore } = await import('../store/navigationStore');
    act(() => useNavigationStore.getState().navigateTab('library'));
    act(() => useNavigationStore.getState().navigateTab('fitness'));

    const before = useNavigationStore.getState();
    expect(before.tabHistory).toEqual(['calendar', 'library']);

    act(() => before.navigateTabBack('library'));

    const after = useNavigationStore.getState();
    expect(after.activeTab).toBe('library');
    expect(after.tabHistory).toEqual(['calendar', 'library']);
  });

  it('navigateTab clears pageStack', async () => {
    const { useNavigationStore } = await import('../store/navigationStore');
    act(() => useNavigationStore.getState().pushPage({ id: 'test', component: 'Test' }));
    expect(useNavigationStore.getState().pageStack.length).toBe(1);

    act(() => useNavigationStore.getState().navigateTab('library'));
    expect(useNavigationStore.getState().pageStack.length).toBe(0);
  });

  it('navigateTabBack clears pageStack', async () => {
    const { useNavigationStore } = await import('../store/navigationStore');
    act(() => useNavigationStore.getState().navigateTab('library'));
    act(() => useNavigationStore.getState().pushPage({ id: 'test', component: 'Test' }));
    expect(useNavigationStore.getState().pageStack.length).toBe(1);

    act(() => useNavigationStore.getState().navigateTabBack('calendar'));
    expect(useNavigationStore.getState().pageStack.length).toBe(0);
  });

  it('tabHistory accumulates across multiple navigations', async () => {
    const { useNavigationStore } = await import('../store/navigationStore');
    act(() => useNavigationStore.getState().navigateTab('library'));
    act(() => useNavigationStore.getState().navigateTab('fitness'));
    act(() => useNavigationStore.getState().navigateTab('calendar'));

    const state = useNavigationStore.getState();
    expect(state.tabHistory).toEqual(['calendar', 'library', 'fitness']);
    expect(state.activeTab).toBe('calendar');
  });
});
