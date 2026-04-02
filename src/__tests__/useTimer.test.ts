import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useTimer } from '../features/fitness/hooks/useTimer';

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts at 0', () => {
    const { result } = renderHook(() => useTimer());
    expect(result.current.elapsed).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it('increments elapsed when running', () => {
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start());
    expect(result.current.isRunning).toBe(true);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.elapsed).toBe(3);
  });

  it('stops incrementing when stopped', () => {
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    act(() => result.current.stop());
    const elapsed = result.current.elapsed;
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.elapsed).toBe(elapsed);
  });

  it('resets to zero', () => {
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    act(() => result.current.reset());
    expect(result.current.elapsed).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it('resumes from paused elapsed time', () => {
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    act(() => result.current.stop());
    expect(result.current.elapsed).toBe(3);

    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.elapsed).toBe(5);
  });

  it('auto-starts when autoStart is true', () => {
    const { result } = renderHook(() => useTimer(true));
    expect(result.current.isRunning).toBe(true);
    expect(result.current.elapsed).toBe(0);

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current.elapsed).toBe(4);
  });

  it('cleans up interval on unmount', () => {
    const { result, unmount } = renderHook(() => useTimer());
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.elapsed).toBe(2);

    unmount();
    expect(() => {
      vi.advanceTimersByTime(3000);
    }).not.toThrow();
  });
});
