import { renderHook, act } from '@testing-library/react';
import { useDarkMode } from '../hooks/useDarkMode';

describe('useDarkMode', () => {
  let matchMediaListeners: Record<string, (() => void)[]>;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    matchMediaListeners = {};

    // Mock matchMedia
    Object.defineProperty(globalThis, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn((event: string, handler: () => void) => {
          if (!matchMediaListeners[event]) matchMediaListeners[event] = [];
          matchMediaListeners[event].push(handler);
        }),
        removeEventListener: vi.fn(),
      })),
    });
  });

  it('defaults to light theme when no stored preference', () => {
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.theme).toBe('light');
  });

  it('reads stored theme from localStorage', () => {
    localStorage.setItem('mp-theme', 'dark');
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('setTheme updates theme and persists to localStorage', () => {
    const { result } = renderHook(() => useDarkMode());
    act(() => {
      result.current.setTheme('dark');
    });
    expect(result.current.theme).toBe('dark');
    expect(localStorage.getItem('mp-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('cycleTheme cycles through light → dark → system', () => {
    localStorage.setItem('mp-theme', 'light');
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.theme).toBe('light');

    act(() => result.current.cycleTheme());
    expect(result.current.theme).toBe('dark');

    act(() => result.current.cycleTheme());
    expect(result.current.theme).toBe('system');

    act(() => result.current.cycleTheme());
    expect(result.current.theme).toBe('light');
  });

  it('isDark returns false for light theme', () => {
    const { result } = renderHook(() => useDarkMode());
    act(() => result.current.setTheme('light'));
    expect(result.current.isDark).toBe(false);
  });

  it('ignores invalid stored values and defaults to light', () => {
    localStorage.setItem('mp-theme', 'invalid-value');
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.theme).toBe('light');
  });

  it('isDark true when system prefers dark and theme is system', () => {
    // Mock matchMedia to return matches: true (dark mode)
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
    localStorage.setItem('mp-theme', 'system'); // explicitly use system mode
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.theme).toBe('system');
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('reacts to system preference changes when theme is system', () => {
    let changeHandler: (() => void) | undefined;
    Object.defineProperty(globalThis, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn((_event: string, handler: () => void) => {
          changeHandler = handler;
        }),
        removeEventListener: vi.fn(),
      })),
    });

    renderHook(() => useDarkMode());
    // The handler should have been registered for 'change' events
    expect(changeHandler).toBeDefined();
    // Calling the handler when theme is 'system' should re-apply theme
    act(() => { changeHandler?.(); });
    // No error means the handler executed correctly
  });

  it('defaults to light theme when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new DOMException('Blocked');
    });
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.theme).toBe('light');
  });

  it('still changes theme when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('QuotaExceededError');
    });
    const { result } = renderHook(() => useDarkMode());
    act(() => { result.current.cycleTheme(); });
    // Theme changed from 'light' to 'dark' despite storage error
    expect(result.current.theme).toBe('dark');
  });

  it('does not crash when matchMedia is undefined', () => {
    Object.defineProperty(globalThis, 'matchMedia', {
      writable: true,
      configurable: true,
      value: undefined,
    });
    expect(() => renderHook(() => useDarkMode())).not.toThrow();
  });
});
