import assert from 'node:assert';
import { SettingsPage } from '../pages/SettingsPage';
import { CalendarPage } from '../pages/CalendarPage';
import { localDateKey } from '../utils/dateKey';

describe('Data Backup — export and import', () => {
  const page = new SettingsPage();
  const calPage = new CalendarPage();

  before(async () => {
    await page.switchToWebview();

    // Inject known data so export has something meaningful
    await calPage.injectTestData({
      dateKey: localDateKey(),
      mealSlot: 'breakfast',
      dishId: 'e2e-backup-dish-1',
      ingredientPayload: {
        id: 'e2e-backup-ing-1',
        name: { vi: 'Nguyên liệu backup', en: 'Backup Ingredient' },
        caloriesPer100: 120,
        proteinPer100: 5,
        carbsPer100: 20,
        fatPer100: 1,
        fiberPer100: 0.5,
        unit: { vi: 'g', en: 'g' },
      },
      dishPayload: {
        id: 'e2e-backup-dish-1',
        name: { vi: 'Món backup test', en: 'Backup Test Dish' },
        ingredients: [{ ingredientId: 'e2e-backup-ing-1', amount: 150 }],
        tags: ['breakfast'],
      },
    });
    await calPage.reloadApp();
    await page.navigateTo('settings');
  });

  it('TC_BACKUP_01 — should display export button', async () => {
    await expect(page.el('btn-export')).toBeDisplayed();
  });

  it('TC_BACKUP_02 — should tap export data button', async () => {
    await page.tapExport();
    await expect(page.el('btn-export')).toBeDisplayed();
  });

  it('TC_BACKUP_03 — should display import button', async () => {
    await expect(page.el('btn-import')).toBeDisplayed();
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_BACKUP_04 — Verify data exists before export
  // ─────────────────────────────────────────────────────────────────
  describe('Data integrity check (TC_BACKUP_04)', () => {
    it('TC_BACKUP_04 — should have data available for export', async () => {
      // Data is now in SQLite (not localStorage). Verify by navigating to
      // management and checking that the seeded ingredient/dish are visible.
      await page.navigateTo('management');
      await browser.pause(500);
      const hasDish = await page.isDisplayed('btn-edit-dish-e2e-backup-dish-1');
      await page.navigateTo('settings');
      assert.strictEqual(hasDish, true, 'Expected seeded dish to be visible in management before export');
    });

    it('TC_BACKUP_05 — should have data-backup section visible', async () => {
      await expect(page.el('data-backup')).toBeDisplayed();
    });
  });
});
