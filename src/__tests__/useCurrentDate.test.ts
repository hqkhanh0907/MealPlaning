import { renderHook, act } from '@testing-library/react';
import { useCurrentDate } from '../features/fitness/hooks/useCurrentDate';

describe('useCurrentDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns current date on initial render', () => {
    const { result } = renderHook(() => useCurrentDate());
    expect(result.current).toBeInstanceOf(Date);
  });

  it('updates date on visibilitychange event', () => {
    const { result } = renderHook(() => useCurrentDate());
    const initialDate = result.current;

    // Advance time by 2 hours
    vi.advanceTimersByTime(2 * 60 * 60 * 1000);

    // Simulate tab becoming visible again
    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.getTime()).toBeGreaterThan(initialDate.getTime());
  });

  it('updates date on 60-second interval', () => {
    const { result } = renderHook(() => useCurrentDate());
    const initialDate = result.current;

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current.getTime()).toBeGreaterThanOrEqual(initialDate.getTime());
  });

  it('cleans up listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useCurrentDate());
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });
});
