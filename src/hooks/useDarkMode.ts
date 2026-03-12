import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system' | 'schedule';

const STORAGE_KEY = 'mp-theme';

function getSystemPrefersDark(): boolean {
  return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6;
}

function resolveIsDark(theme: Theme): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  if (theme === 'system') return getSystemPrefersDark();
  return isNightTime();
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', resolveIsDark(theme));
}

export function useDarkMode() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system' || stored === 'schedule') return stored;
    } catch { /* ignore */ }
    return 'light';
  });

  const persistTheme = useCallback((t: Theme) => {
    setTheme(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch { /* ignore */ }
    applyTheme(t);
  }, [setTheme]);

  useEffect(() => {
    applyTheme(theme);
    const mq = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
    if (theme === 'system' && mq) {
      const handler = () => { applyTheme('system'); };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
    if (theme === 'schedule') {
      const interval = setInterval(() => { applyTheme('schedule'); }, 60_000);
      return () => clearInterval(interval);
    }
  }, [theme]);

  const isDark = resolveIsDark(theme);

  const cycleTheme = useCallback(() => {
    const order: Theme[] = ['light', 'dark', 'system', 'schedule'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    persistTheme(next);
  }, [theme, persistTheme]);

  return { theme, isDark, setTheme: persistTheme, cycleTheme };
}
