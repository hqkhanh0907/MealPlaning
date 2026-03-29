import { renderHook } from '@testing-library/react';
import { useAppBackHandler } from '../hooks/useAppBackHandler';
import * as backService from '../services/backNavigationService';

vi.mock('../services/backNavigationService', () => ({
  initBackNavigation: vi.fn(() => vi.fn()),
  pushBackEntry: vi.fn(),
  removeTopBackEntry: vi.fn(),
  removeBackEntries: vi.fn(),
  getBackStackDepth: vi.fn(() => 0),
}));

describe('useAppBackHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls initBackNavigation on mount', () => {
    renderHook(() => useAppBackHandler());
    expect(backService.initBackNavigation).toHaveBeenCalledTimes(1);
  });

  it('calls cleanup function on unmount', () => {
    const cleanup = vi.fn();
    vi.mocked(backService.initBackNavigation).mockReturnValue(cleanup);

    const { unmount } = renderHook(() => useAppBackHandler());
    expect(cleanup).not.toHaveBeenCalled();

    unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('only initializes once across re-renders', () => {
    const { rerender } = renderHook(() => useAppBackHandler());
    rerender();
    rerender();
    expect(backService.initBackNavigation).toHaveBeenCalledTimes(1);
  });
});
