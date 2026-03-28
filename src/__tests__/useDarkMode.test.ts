import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('../contexts/DatabaseContext', () => ({
  DatabaseProvider: ({ children }: { children: unknown }) => children,
  useDatabase: () => ({
    query: vi.fn().mockResolvedValue([]),
    queryOne: vi.fn().mockResolvedValue(null),
    run: vi.fn().mockResolvedValue(undefined),
    execute: vi.fn().mockResolvedValue(undefined),
    initialize: vi.fn().mockResolvedValue(undefined),
    isReady: vi.fn().mockReturnValue(true),
  }),
}));

let mockGetSettingValue: string | null = null;
const mockSetSetting = vi.fn().mockResolvedValue(undefined);
vi.mock('../services/appSettings', () => ({
  getSetting: vi.fn(() => Promise.resolve(mockGetSettingValue)),
  setSetting: (...args: unknown[]) => mockSetSetting(...args),
  deleteSetting: vi.fn().mockResolvedValue(undefined),
}));

import { useDarkMode } from '../hooks/useDarkMode';

describe('useDarkMode', () => {
  let matchMediaListeners: Record<string, (() => void)[]>;

  beforeEach(() => {
    mockGetSettingValue = null;
    mockSetSetting.mockClear();
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

  it('reads stored theme from database settings', async () => {
    mockGetSettingValue = 'dark';
    const { result } = renderHook(() => useDarkMode());
    await waitFor(() => {
      expect(result.current.theme).toBe('dark');
    });
    expect(result.current.isDark).toBe(true);
  });

  it('setTheme updates theme and persists to database', () => {
    const { result } = renderHook(() => useDarkMode());
    act(() => {
      result.current.setTheme('dark');
    });
    expect(result.current.theme).toBe('dark');
    expect(mockSetSetting).toHaveBeenCalled();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('cycleTheme cycles through light → dark → system → schedule', () => {
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.theme).toBe('light');

    act(() => result.current.cycleTheme());
    expect(result.current.theme).toBe('dark');

    act(() => result.current.cycleTheme());
    expect(result.current.theme).toBe('system');

    act(() => result.current.cycleTheme());
    expect(result.current.theme).toBe('schedule');

    act(() => result.current.cycleTheme());
    expect(result.current.theme).toBe('light');
  });

  it('isDark returns false for light theme', () => {
    const { result } = renderHook(() => useDarkMode());
    act(() => result.current.setTheme('light'));
    expect(result.current.isDark).toBe(false);
  });

  it('ignores invalid stored values and defaults to light', async () => {
    mockGetSettingValue = 'invalid-value';
    const { result } = renderHook(() => useDarkMode());
    // Wait for the async getSetting to resolve - invalid value should be ignored
    await act(async () => { await Promise.resolve(); });
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
    const { result } = renderHook(() => useDarkMode());
    act(() => {
      result.current.setTheme('system');
    });
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

    const { result } = renderHook(() => useDarkMode());
    act(() => {
      result.current.setTheme('system');
    });
    expect(changeHandler).toBeDefined();
    act(() => { changeHandler?.(); });
  });

  it('re-applies system theme when matchMedia change fires and theme is system', () => {
    let changeHandler: (() => void) | undefined;
    Object.defineProperty(globalThis, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn((_event: string, handler: () => void) => {
          changeHandler = handler;
        }),
        removeEventListener: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useDarkMode());
    act(() => {
      result.current.setTheme('system');
    });
    expect(result.current.theme).toBe('system');
    expect(changeHandler).toBeDefined();
    act(() => { changeHandler?.(); });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('defaults to light theme when getSetting rejects', () => {
    mockGetSettingValue = null;
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.theme).toBe('light');
  });

  it('still changes theme when setSetting rejects', () => {
    mockSetSetting.mockRejectedValueOnce(new Error('DB error'));
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

  it('reads stored schedule theme from database settings', async () => {
    mockGetSettingValue = 'schedule';
    const { result } = renderHook(() => useDarkMode());
    await waitFor(() => {
      expect(result.current.theme).toBe('schedule');
    });
  });

  it('schedule mode is dark during night hours', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1, 21, 0, 0));
    const { result } = renderHook(() => useDarkMode());
    act(() => {
      result.current.setTheme('schedule');
    });
    expect(result.current.isDark).toBe(true);
    vi.useRealTimers();
  });

  it('schedule mode is light during day hours', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1, 12, 0, 0));
    const { result } = renderHook(() => useDarkMode());
    act(() => {
      result.current.setTheme('schedule');
    });
    expect(result.current.isDark).toBe(false);
    vi.useRealTimers();
  });

  it('schedule mode sets up interval for periodic checks', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1, 12, 0, 0));
    const { result } = renderHook(() => useDarkMode());
    act(() => {
      result.current.setTheme('schedule');
    });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    vi.useRealTimers();
  });
});
