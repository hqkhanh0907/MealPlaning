import { useCallback, useEffect, useState } from 'react';

import { useDatabase } from '../contexts/DatabaseContext';
import { getSetting, setSetting } from '../services/appSettings';
import { logger } from '../utils/logger';

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
  const isDark = resolveIsDark(theme);
  document.documentElement.classList.toggle('dark', isDark);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', isDark ? '#0f172a' : '#10b981');
}

export function useDarkMode() {
  const db = useDatabase();
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    getSetting(db, 'theme')
      .then(v => {
        if (v === 'light' || v === 'dark' || v === 'system' || v === 'schedule') {
          setTheme(v);
          applyTheme(v);
        }
      })
      .catch(e => logger.warn({ component: 'useDarkMode', action: 'loadTheme' }, String(e)));
  }, [db]);

  const persistTheme = useCallback(
    (t: Theme) => {
      setTheme(t);
      setSetting(db, 'theme', t).catch(e =>
        logger.warn({ component: 'useDarkMode', action: 'persistTheme' }, String(e)),
      );
      applyTheme(t);
    },
    [db],
  );

  useEffect(() => {
    applyTheme(theme);
    const mq = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
    if (theme === 'system' && mq) {
      const handler = () => {
        applyTheme('system');
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
    if (theme === 'schedule') {
      const interval = setInterval(() => {
        applyTheme('schedule');
      }, 60_000);
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
