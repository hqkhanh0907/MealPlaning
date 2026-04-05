import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('useTabHistoryBackHandler', () => {
  const mockNavigateTabBack = vi.fn();
  const mockPushBackEntry = vi.fn();
  let mockActiveTab = 'calendar';
  let mockTabHistory: string[] = [];
  const mockGetState = vi.fn(() => ({
    tabHistory: mockTabHistory,
    navigateTabBack: mockNavigateTabBack,
  }));
  const mockSetState = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockActiveTab = 'calendar';
    mockTabHistory = [];
  });

  async function importHook() {
    vi.doMock('../services/backNavigationService', () => ({
      pushBackEntry: mockPushBackEntry,
    }));
    vi.doMock('../store/navigationStore', () => ({
      useNavigationStore: Object.assign(
        (selector: (s: Record<string, unknown>) => unknown) => {
          const state = { activeTab: mockActiveTab };
          return selector(state);
        },
        {
          getState: () => mockGetState(),
          setState: (...args: unknown[]) => mockSetState(...args),
        },
      ),
    }));
    const mod = await import('../hooks/useTabHistoryBackHandler');
    return mod.useTabHistoryBackHandler;
  }

  it('does not push back entry on initial render when tab unchanged', async () => {
    const useTabHistoryBackHandler = await importHook();
    renderHook(() => useTabHistoryBackHandler());

    expect(mockPushBackEntry).not.toHaveBeenCalled();
  });

  it('pushes back entry when activeTab changes', async () => {
    const useTabHistoryBackHandler = await importHook();
    const { rerender } = renderHook(() => useTabHistoryBackHandler());

    mockActiveTab = 'library';
    rerender();

    expect(mockPushBackEntry).toHaveBeenCalledTimes(1);
    expect(mockPushBackEntry).toHaveBeenCalledWith(expect.any(Function));
  });

  it('back handler navigates to previous tab when tabHistory is non-empty', async () => {
    let capturedHandler: (() => void) | null = null;
    mockPushBackEntry.mockImplementation((handler: () => void) => {
      capturedHandler = handler;
    });

    const useTabHistoryBackHandler = await importHook();
    const { rerender } = renderHook(() => useTabHistoryBackHandler());

    mockActiveTab = 'library';
    rerender();

    expect(capturedHandler).not.toBeNull();

    mockTabHistory = ['calendar'];
    act(() => capturedHandler!());

    expect(mockSetState).toHaveBeenCalledWith({ tabHistory: [] });
    expect(mockNavigateTabBack).toHaveBeenCalledWith('calendar');
  });

  it('back handler does nothing when tabHistory is empty', async () => {
    let capturedHandler: (() => void) | null = null;
    mockPushBackEntry.mockImplementation((handler: () => void) => {
      capturedHandler = handler;
    });

    const useTabHistoryBackHandler = await importHook();
    const { rerender } = renderHook(() => useTabHistoryBackHandler());

    mockActiveTab = 'fitness';
    rerender();

    mockTabHistory = [];
    act(() => capturedHandler!());

    expect(mockSetState).not.toHaveBeenCalled();
    expect(mockNavigateTabBack).not.toHaveBeenCalled();
  });

  it('skips push and resets flag when back-navigating', async () => {
    let capturedHandler: (() => void) | null = null;
    mockPushBackEntry.mockImplementation((handler: () => void) => {
      capturedHandler = handler;
    });

    const useTabHistoryBackHandler = await importHook();
    const { rerender } = renderHook(() => useTabHistoryBackHandler());

    // Tab changes → push back entry
    mockActiveTab = 'library';
    rerender();
    expect(mockPushBackEntry).toHaveBeenCalledTimes(1);

    // Simulate back navigation: handler sets isBackNavigatingRef=true
    mockTabHistory = ['calendar'];
    act(() => capturedHandler!());

    vi.clearAllMocks();

    // activeTab changes due to navigateTabBack (simulated)
    mockActiveTab = 'calendar';
    rerender();

    // Should NOT push a new back entry (isBackNavigatingRef was true)
    expect(mockPushBackEntry).not.toHaveBeenCalled();

    // Next tab change should work normally (flag was reset)
    mockActiveTab = 'fitness';
    rerender();
    expect(mockPushBackEntry).toHaveBeenCalledTimes(1);
  });

  it('back handler pops the last entry from multi-entry tabHistory', async () => {
    let capturedHandler: (() => void) | null = null;
    mockPushBackEntry.mockImplementation((handler: () => void) => {
      capturedHandler = handler;
    });

    const useTabHistoryBackHandler = await importHook();
    const { rerender } = renderHook(() => useTabHistoryBackHandler());

    mockActiveTab = 'fitness';
    rerender();

    mockTabHistory = ['calendar', 'library'];
    act(() => capturedHandler!());

    expect(mockNavigateTabBack).toHaveBeenCalledWith('library');
    expect(mockSetState).toHaveBeenCalledWith({ tabHistory: ['calendar'] });
  });
});

describe('navigationStore tabHistory', () => {
  beforeEach(async () => {
    vi.doUnmock('../store/navigationStore');
    vi.doUnmock('../services/backNavigationService');
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
