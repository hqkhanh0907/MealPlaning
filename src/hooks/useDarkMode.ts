import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { getSetting, setSetting } from '../services/appSettings';

type Theme = 'light' | 'dark' | 'system' | 'schedule';

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
  const db = useDatabase();
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    getSetting(db, 'theme').then(v => {
      if (v === 'light' || v === 'dark' || v === 'system' || v === 'schedule') {
        setTheme(v);
        applyTheme(v);
      }
    }).catch(() => {});
  }, [db]);

  const persistTheme = useCallback((t: Theme) => {
    setTheme(t);
    setSetting(db, 'theme', t).catch(() => {});
    applyTheme(t);
  }, [db]);

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
