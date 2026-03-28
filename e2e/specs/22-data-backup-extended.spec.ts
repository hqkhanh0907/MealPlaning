import assert from 'node:assert';
import { SettingsPage } from '../pages/SettingsPage';
import { CalendarPage } from '../pages/CalendarPage';
import { localDateKey } from '../utils/dateKey';

type ExecutableBrowser = typeof browser & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: <T>(fn: (...args: any[]) => T, ...args: unknown[]) => Promise<T>;
};

describe('Data Backup Extended', () => {
  const page = new SettingsPage();
  const calPage = new CalendarPage();

  before(async () => {
    await page.switchToWebview();

    // Seed data so export tests have something to work with
    await calPage.injectTestData({
      dateKey: localDateKey(),
      mealSlot: 'breakfast',
      dishId: 'e2e-bak-ext-dish',
      ingredientPayload: {
        id: 'e2e-bak-ext-ing',
        name: { vi: 'NL Backup Ext', en: 'Backup Ext Ing' },
        caloriesPer100: 100,
        proteinPer100: 5,
        carbsPer100: 20,
        fatPer100: 1,
        fiberPer100: 0.5,
        unit: { vi: 'g', en: 'g' },
      },
      dishPayload: {
        id: 'e2e-bak-ext-dish',
        name: { vi: 'Món Backup Ext', en: 'Backup Ext Dish' },
        ingredients: [{ ingredientId: 'e2e-bak-ext-ing', amount: 150 }],
        tags: ['breakfast'],
      },
    });
    await calPage.reloadApp();
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
  // TC_BAK_EXT_03 — Data is available in SQLite for export
  // ─────────────────────────────────────────────────────────────────
  it('TC_BAK_EXT_03 — seeded data should be available for export', async () => {
    // Data is now in SQLite (not localStorage). Verify by checking
    // the management tab shows the seeded ingredient.
    await page.navigateTo('management');
    await browser.pause(500);
    const hasDish = await page.isDisplayed('btn-edit-dish-e2e-bak-ext-dish');
    await page.navigateTo('settings');
    assert.ok(hasDish, 'Seeded dish should be visible in management (SQLite has data for export)');
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_BAK_EXT_04 — Import flow: seeding data via localStorage migration
  // ─────────────────────────────────────────────────────────────────
  it('TC_BAK_EXT_04 — importing data via migration should make it accessible', async () => {
    // Simulate import by seeding localStorage and reloading (migration moves
    // data to SQLite). Direct file import is hard to automate in WebView.
    await (browser as unknown as ExecutableBrowser).execute(() => {
      const importIng = [{
        id: 'e2e-import-ing',
        name: { vi: 'NL Import', en: 'Import Ing' },
        caloriesPer100: 150,
        proteinPer100: 8,
        carbsPer100: 25,
        fatPer100: 3,
        fiberPer100: 1,
        unit: { vi: 'g', en: 'g' },
      }];
      localStorage.setItem('mp-ingredients', JSON.stringify(importIng));
      localStorage.setItem('mp-dishes', '[]');
      localStorage.setItem('mp-day-plans', '[]');
    });

    await page.reloadApp();
    await browser.pause(500);

    // Verify imported data is visible in management
    await page.navigateTo('management');
    await browser.pause(500);
    const found = await page.isDisplayed('btn-edit-ingredient-e2e-import-ing');
    await page.navigateTo('settings');
    assert.ok(found, 'Imported ingredient should be visible in management after migration');
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_BAK_EXT_05 — App handles empty database gracefully
  // ─────────────────────────────────────────────────────────────────
  it('TC_BAK_EXT_05 — app should handle empty database gracefully', async () => {
    // Clear all localStorage data and reload — the app should start
    // with an empty SQLite database and still render correctly.
    await (browser as unknown as ExecutableBrowser).execute(() => {
      localStorage.removeItem('mp-ingredients');
      localStorage.removeItem('mp-dishes');
      localStorage.removeItem('mp-day-plans');
    });

    await page.reloadApp();
    await browser.pause(500);

    // App should still render (navigation visible)
    const navVisible = await page.isDisplayed('nav-settings');
    assert.ok(navVisible, 'App should still be functional with empty database');
  });
});
