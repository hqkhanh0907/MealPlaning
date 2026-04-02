import { act, renderHook } from '@testing-library/react';

import { useIsDesktop } from '../hooks/useIsDesktop';

describe('useIsDesktop', () => {
  const originalMatchMedia = globalThis.matchMedia;

  afterEach(() => {
    Object.defineProperty(globalThis, 'matchMedia', {
      writable: true,
      configurable: true,
      value: originalMatchMedia,
    });
  });

  it('returns false when matchMedia is undefined', () => {
    Object.defineProperty(globalThis, 'matchMedia', {
      writable: true,
      configurable: true,
      value: undefined,
    });
    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(false);
  });

  it('returns true when viewport matches desktop breakpoint', () => {
    Object.defineProperty(globalThis, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(true);
  });

  it('returns false when viewport does not match desktop breakpoint', () => {
    Object.defineProperty(globalThis, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(false);
  });

  it('registers a change event listener and cleans up on unmount', () => {
    const addListener = vi.fn();
    const removeListener = vi.fn();
    Object.defineProperty(globalThis, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: addListener,
        removeEventListener: removeListener,
      })),
    });

    const { unmount } = renderHook(() => useIsDesktop());
    expect(addListener).toHaveBeenCalledWith('change', expect.any(Function));

    unmount();
    expect(removeListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('updates state when change event fires', () => {
    let changeHandler: ((e: { matches: boolean }) => void) | undefined;
    Object.defineProperty(globalThis, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn((_event: string, handler: (e: { matches: boolean }) => void) => {
          changeHandler = handler;
        }),
        removeEventListener: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(false);

    act(() => {
      changeHandler?.({ matches: true });
    });
    expect(result.current).toBe(true);

    act(() => {
      changeHandler?.({ matches: false });
    });
    expect(result.current).toBe(false);
  });

  it('skips listener setup when matchMedia is undefined', () => {
    Object.defineProperty(globalThis, 'matchMedia', {
      writable: true,
      configurable: true,
      value: undefined,
    });
    const { unmount } = renderHook(() => useIsDesktop());
    // Should not throw during unmount even without matchMedia
    expect(() => unmount()).not.toThrow();
  });
});
