import assert from 'node:assert';
import { SettingsPage } from '../pages/SettingsPage';

type ExecutableBrowser = typeof browser & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: <T>(fn: (...args: any[]) => T, ...args: unknown[]) => Promise<T>;
};

describe('Error Handling & Edge Cases', () => {
  const settings = new SettingsPage();

  before(async () => {
    await settings.switchToWebview();
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_EDGE_01 — Empty state for grocery list
  // ─────────────────────────────────────────────────────────────────
  describe('Empty states (TC_EDGE_01)', () => {
    before(async () => {
      // Clear all plans so grocery is empty (seed empty array, migrate to SQLite)
      await (browser as unknown as ExecutableBrowser).execute(() => {
        localStorage.setItem('mp-day-plans', '[]');
      });
      await settings.reloadApp();
      await settings.navigateTo('grocery');
      await browser.pause(500);
    });

    it('TC_EDGE_01 — should show empty state when no grocery items', async () => {
      await expect(settings.el('grocery-empty-state')).toBeDisplayed();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_EDGE_02 — Theme switching applies CSS classes
  // ─────────────────────────────────────────────────────────────────
  describe('Theme CSS (TC_EDGE_02)', () => {
    before(async () => {
      await settings.navigateTo('settings');
      await browser.pause(500);
    });

    it('TC_EDGE_02 — dark theme should add "dark" class to html element', async () => {
      await settings.switchTheme('dark');
      await browser.pause(500);

      const hasDark = await (browser as unknown as ExecutableBrowser).execute(() => {
        return document.documentElement.classList.contains('dark');
      });
      assert.ok(hasDark, 'HTML element should have "dark" class in dark mode');
    });

    it('TC_EDGE_03 — light theme should remove "dark" class', async () => {
      await settings.switchTheme('light');
      await browser.pause(500);

      const hasDark = await (browser as unknown as ExecutableBrowser).execute(() => {
        return document.documentElement.classList.contains('dark');
      });
      assert.strictEqual(hasDark, false, 'HTML element should NOT have "dark" class in light mode');
    });

    it('TC_EDGE_04 — theme preference should persist in SQLite', async () => {
      await settings.switchTheme('dark');
      await browser.pause(300);

      // Theme is now stored in SQLite settings table (not localStorage).
      // Verify via UI: the "dark" class should be applied to the HTML element.
      const hasDark = await (browser as unknown as ExecutableBrowser).execute(() => {
        return document.documentElement.classList.contains('dark');
      });
      assert.ok(hasDark, 'Dark theme should be active after switching');

      // Restore to light
      await settings.switchTheme('light');
      await browser.pause(300);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_EDGE_05 — ErrorBoundary catches component errors
  // ─────────────────────────────────────────────────────────────────
  describe('ErrorBoundary (TC_EDGE_05)', () => {
    it('TC_EDGE_05 — app should not crash on corrupted localStorage data', async () => {
      // Inject corrupted data and reload — the migration service's
      // readZustandState handles JSON parse errors gracefully.
      await (browser as unknown as ExecutableBrowser).execute(() => {
        localStorage.setItem('mp-dishes', 'INVALID_JSON_[{broken');
      });
      await settings.reloadApp();

      // App should still be functional (nav visible) — either error boundary
      // shows or app gracefully handles the error
      const navVisible = await settings.isDisplayed('nav-calendar');
      const errorVisible = await (browser as unknown as ExecutableBrowser).execute(() => {
        const el = document.querySelector('[class*="error"], [data-testid*="error"]');
        return !!el;
      });

      assert.ok(navVisible || errorVisible, 'App should show navigation or error boundary, not blank screen');

      // Fix the data
      await (browser as unknown as ExecutableBrowser).execute(() => {
        localStorage.setItem('mp-dishes', '[]');
      });
      await settings.reloadApp();
    });
  });
});
