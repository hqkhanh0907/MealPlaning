import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMinimumDelay } from '../hooks/useMinimumDelay';

describe('useMinimumDelay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true immediately when isLoading is true', () => {
    const { result } = renderHook(() => useMinimumDelay(true, 200));
    expect(result.current).toBe(true);
  });

  it('returns false when isLoading is false initially', () => {
    const { result } = renderHook(() => useMinimumDelay(false, 200));
    expect(result.current).toBe(false);
  });

  it('keeps skeleton visible for at least minDelay after loading ends', () => {
    const { result, rerender } = renderHook(({ loading }) => useMinimumDelay(loading, 200), {
      initialProps: { loading: true },
    });

    expect(result.current).toBe(true);

    // Loading ends after 50ms (less than 200ms minDelay)
    vi.advanceTimersByTime(50);
    rerender({ loading: false });

    // Should still show skeleton
    expect(result.current).toBe(true);

    // Advance remaining 150ms
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current).toBe(false);
  });

  it('hides skeleton immediately when loading took longer than minDelay', () => {
    const { result, rerender } = renderHook(({ loading }) => useMinimumDelay(loading, 200), {
      initialProps: { loading: true },
    });

    // Loading ends after 300ms (more than 200ms minDelay)
    vi.advanceTimersByTime(300);
    rerender({ loading: false });

    expect(result.current).toBe(false);
  });

  it('resets timer when isLoading goes true→false→true quickly', () => {
    const { result, rerender } = renderHook(({ loading }) => useMinimumDelay(loading, 200), {
      initialProps: { loading: true },
    });

    // Loading ends briefly
    vi.advanceTimersByTime(50);
    rerender({ loading: false });
    expect(result.current).toBe(true);

    // Loading starts again before timer fires
    vi.advanceTimersByTime(50);
    rerender({ loading: true });
    expect(result.current).toBe(true);

    // Loading ends again — timer should use NEW start time
    vi.advanceTimersByTime(50);
    rerender({ loading: false });
    expect(result.current).toBe(true);

    // Original 200ms from first start would be 150ms — but timer was reset
    // Need remaining from new start (200 - 50 = 150ms)
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current).toBe(false);
  });

  it('cleans up timer on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const { rerender, unmount } = renderHook(({ loading }) => useMinimumDelay(loading, 200), {
      initialProps: { loading: true },
    });

    vi.advanceTimersByTime(50);
    rerender({ loading: false });

    // Timer is pending — unmount should clear it via store.cleanup()
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('uses default minDelay of 200ms', () => {
    const { result, rerender } = renderHook(({ loading }) => useMinimumDelay(loading), {
      initialProps: { loading: true },
    });

    vi.advanceTimersByTime(50);
    rerender({ loading: false });
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current).toBe(false);
  });

  it('handles minDelay of 0', () => {
    const { result, rerender } = renderHook(({ loading }) => useMinimumDelay(loading, 0), {
      initialProps: { loading: true },
    });

    rerender({ loading: false });
    expect(result.current).toBe(false);
  });
});
