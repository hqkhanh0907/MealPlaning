import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebounceAction } from '../hooks/useDebounceAction';

describe('useDebounceAction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('executes first call immediately', () => {
    const action = vi.fn();
    const { result } = renderHook(() => useDebounceAction(action, 200));

    act(() => {
      result.current();
    });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('ignores subsequent calls within delay window', () => {
    const action = vi.fn();
    const { result } = renderHook(() => useDebounceAction(action, 200));

    act(() => {
      result.current();
      result.current();
      result.current();
    });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('allows new call after delay window expires', () => {
    const action = vi.fn();
    const { result } = renderHook(() => useDebounceAction(action, 200));

    act(() => {
      result.current();
    });
    expect(action).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      result.current();
    });
    expect(action).toHaveBeenCalledTimes(2);
  });

  it('does not execute after component unmount', () => {
    const action = vi.fn();
    const { result, unmount } = renderHook(() => useDebounceAction(action, 200));

    unmount();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Calling after unmount should not execute
    result.current();
    expect(action).toHaveBeenCalledTimes(0);
  });

  it('uses default delay of 200ms', () => {
    const action = vi.fn();
    const { result } = renderHook(() => useDebounceAction(action));

    act(() => {
      result.current();
    });
    expect(action).toHaveBeenCalledTimes(1);

    // Call within default 200ms window
    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current();
    });
    expect(action).toHaveBeenCalledTimes(1);

    // After 200ms total
    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current();
    });
    expect(action).toHaveBeenCalledTimes(2);
  });

  it('uses latest action reference on subsequent calls', () => {
    const action1 = vi.fn();
    const action2 = vi.fn();

    const { result, rerender } = renderHook(({ action }) => useDebounceAction(action, 200), {
      initialProps: { action: action1 },
    });

    act(() => {
      result.current();
    });
    expect(action1).toHaveBeenCalledTimes(1);

    // Update action ref
    rerender({ action: action2 });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      result.current();
    });
    expect(action2).toHaveBeenCalledTimes(1);
    expect(action1).toHaveBeenCalledTimes(1);
  });

  it('returns stable function reference across renders', () => {
    const action = vi.fn();
    const { result, rerender } = renderHook(() => useDebounceAction(action, 200));

    const fn1 = result.current;
    rerender();
    const fn2 = result.current;

    expect(fn1).toBe(fn2);
  });

  it('handles rapid fire calls correctly', () => {
    const action = vi.fn();
    const { result } = renderHook(() => useDebounceAction(action, 100));

    // First call at t=0
    act(() => {
      result.current();
    });
    expect(action).toHaveBeenCalledTimes(1);

    // Call at t=50 — ignored
    act(() => {
      vi.advanceTimersByTime(50);
    });
    act(() => {
      result.current();
    });
    expect(action).toHaveBeenCalledTimes(1);

    // Call at t=99 — still ignored
    act(() => {
      vi.advanceTimersByTime(49);
    });
    act(() => {
      result.current();
    });
    expect(action).toHaveBeenCalledTimes(1);

    // Call at t=100 — allowed
    act(() => {
      vi.advanceTimersByTime(1);
    });
    act(() => {
      result.current();
    });
    expect(action).toHaveBeenCalledTimes(2);
  });
});
