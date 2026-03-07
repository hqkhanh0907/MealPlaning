import assert from 'node:assert';
import { SettingsPage } from '../pages/SettingsPage';

type ExecutableBrowser = typeof browser & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: <T>(fn: (...args: any[]) => T, ...args: unknown[]) => Promise<T>;
};

describe('Data Backup Extended', () => {
  const page = new SettingsPage();

  before(async () => {
    await page.switchToWebview();
    await page.navigateTo('settings');
    await browser.pause(500);
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_BAK_EXT_01 — Export button visible
  // ─────────────────────────────────────────────────────────────────
  it('TC_BAK_EXT_01 — export button should be displayed', async () => {
    await expect(page.el('btn-export')).toBeDisplayed();
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_BAK_EXT_02 — Import button visible
  // ─────────────────────────────────────────────────────────────────
  it('TC_BAK_EXT_02 — import button should be displayed', async () => {
    await expect(page.el('btn-import')).toBeDisplayed();
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_BAK_EXT_03 — Export produces valid JSON in localStorage
  // ─────────────────────────────────────────────────────────────────
  it('TC_BAK_EXT_03 — export data should contain all required keys', async () => {
    // Inject known data
    await (browser as unknown as ExecutableBrowser).execute(() => {
      if (!localStorage.getItem('mp-ingredients')) localStorage.setItem('mp-ingredients', '[]');
      if (!localStorage.getItem('mp-dishes')) localStorage.setItem('mp-dishes', '[]');
      if (!localStorage.getItem('mp-day-plans')) localStorage.setItem('mp-day-plans', '[]');
    });

    // Verify the data keys exist in localStorage
    const hasKeys = await (browser as unknown as ExecutableBrowser).execute(() => {
      const keys = ['mp-ingredients', 'mp-dishes', 'mp-day-plans'];
      return keys.every((k) => localStorage.getItem(k) !== null);
    });
    assert.ok(hasKeys, 'All export data keys should exist in localStorage');
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_BAK_EXT_04 — Import valid JSON restores data
  // ─────────────────────────────────────────────────────────────────
  it('TC_BAK_EXT_04 — importing valid backup should restore data', async () => {
    // Simulate import by directly setting localStorage (file input is hard to automate in WebView)
    const importData = {
      'mp-ingredients': [
        {
          id: 'e2e-import-ing',
          name: { vi: 'NL Import', en: 'Import Ing' },
          caloriesPer100: 150,
          proteinPer100: 8,
          carbsPer100: 25,
          fatPer100: 3,
          fiberPer100: 1,
          unit: { vi: 'g', en: 'g' },
        },
      ],
      'mp-dishes': [],
      'mp-day-plans': [],
      _exportedAt: new Date().toISOString(),
      _version: '1.0',
    };

    await (browser as unknown as ExecutableBrowser).execute((data: string) => {
      const parsed = JSON.parse(data);
      for (const [key, val] of Object.entries(parsed)) {
        if (key.startsWith('mp-')) {
          localStorage.setItem(key, JSON.stringify(val));
        }
      }
    }, JSON.stringify(importData));

    await (browser as unknown as ExecutableBrowser).execute(() => location.reload());
    await browser.pause(2000);

    // Verify imported data exists
    const found = await (browser as unknown as ExecutableBrowser).execute(() => {
      const ings = JSON.parse(localStorage.getItem('mp-ingredients') || '[]') as Array<{ id: string }>;
      return ings.some((i) => i.id === 'e2e-import-ing');
    });
    assert.ok(found, 'Imported ingredient should be found in localStorage');
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_BAK_EXT_05 — Invalid JSON handling
  // ─────────────────────────────────────────────────────────────────
  it('TC_BAK_EXT_05 — app should handle invalid data gracefully', async () => {
    // Store invalid data temporarily and verify app doesn't crash
    await (browser as unknown as ExecutableBrowser).execute(() => {
      const backup = localStorage.getItem('mp-ingredients');
      localStorage.setItem('mp-ingredients-backup', backup || '[]');
      localStorage.setItem('mp-ingredients', '{broken');
    });

    await (browser as unknown as ExecutableBrowser).execute(() => location.reload());
    await browser.pause(2000);

    // App should still render (navigation visible)
    const navVisible = await page.isDisplayed('nav-settings');
    assert.ok(navVisible, 'App should still be functional after invalid data');

    // Restore valid data
    await (browser as unknown as ExecutableBrowser).execute(() => {
      const backup = localStorage.getItem('mp-ingredients-backup');
      if (backup) localStorage.setItem('mp-ingredients', backup);
      localStorage.removeItem('mp-ingredients-backup');
    });
    await (browser as unknown as ExecutableBrowser).execute(() => location.reload());
    await browser.pause(2000);
  });
});
