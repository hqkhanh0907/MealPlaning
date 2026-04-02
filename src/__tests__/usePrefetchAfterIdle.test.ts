import { act, renderHook } from '@testing-library/react';

import { usePrefetchAfterIdle } from '../hooks/usePrefetchAfterIdle';

describe('usePrefetchAfterIdle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls preload functions after the specified delay', () => {
    const fn1 = vi.fn().mockResolvedValue(undefined);
    const fn2 = vi.fn().mockResolvedValue(undefined);
    const preloadFns = [fn1, fn2];

    renderHook(() => usePrefetchAfterIdle(preloadFns, 1000));

    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('does not call preload before delay', () => {
    const fn = vi.fn().mockResolvedValue(undefined);

    renderHook(() => usePrefetchAfterIdle([fn], 2000));

    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(fn).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(101);
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('only prefetches once even if re-rendered', () => {
    const fn = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook(() => usePrefetchAfterIdle([fn], 500));

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(fn).toHaveBeenCalledTimes(1);

    rerender();
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cleans up timeout on unmount', () => {
    const fn = vi.fn().mockResolvedValue(undefined);

    const { unmount } = renderHook(() => usePrefetchAfterIdle([fn], 1000));

    unmount();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(fn).not.toHaveBeenCalled();
  });

  it('uses requestIdleCallback when available', () => {
    const mockRIC = vi.fn((cb: IdleRequestCallback) => {
      cb({} as IdleDeadline);
      return 1;
    });
    vi.stubGlobal('requestIdleCallback', mockRIC);

    const fn = vi.fn().mockResolvedValue(undefined);
    renderHook(() => usePrefetchAfterIdle([fn], 100));

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockRIC).toHaveBeenCalled();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it('uses default delay of 2000ms', () => {
    const fn = vi.fn().mockResolvedValue(undefined);

    renderHook(() => usePrefetchAfterIdle([fn]));

    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(fn).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(101);
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
