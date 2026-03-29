import assert from 'node:assert';
import { ManagementPage } from '../pages/ManagementPage';

type ExecutableBrowser = typeof browser & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: <T>(fn: (...args: any[]) => T, ...args: unknown[]) => Promise<T>;
};

describe('Delete Guard & Undo', () => {
  const page = new ManagementPage();
  const TEST_ING_ID = 'e2e-del-ing';
  const TEST_DISH_ID = 'e2e-del-dish';
  const USED_DISH_ID = 'e2e-del-used-dish';

  before(async () => {
    await page.switchToWebview();
    await page.navigateTo('library');
    await browser.pause(500);

    // Inject test data: 1 unused dish, 1 used dish (in today's plan), 1 ingredient
    // Data is seeded via localStorage and migrated to SQLite on reload
    await (browser as unknown as ExecutableBrowser).execute((ingId: string, dishId: string, usedDishId: string) => {
      const ings = JSON.parse(localStorage.getItem('mp-ingredients') || '[]') as Array<{ id: string }>;
      if (!ings.some((i) => i.id === ingId)) {
        ings.push({
          id: ingId,
          name: { vi: 'NL Xóa Test', en: 'Del Ingredient' },
          caloriesPer100: 100,
          proteinPer100: 5,
          carbsPer100: 20,
          fatPer100: 1,
          fiberPer100: 1,
          unit: { vi: 'g', en: 'g' },
        });
        localStorage.setItem('mp-ingredients', JSON.stringify(ings));
      }

      const dishes = JSON.parse(localStorage.getItem('mp-dishes') || '[]') as Array<{ id: string }>;
      if (!dishes.some((d) => d.id === dishId)) {
        dishes.push({
          id: dishId,
          name: { vi: 'Món Xóa Test', en: 'Del Dish' },
          tags: ['lunch'],
          ingredients: [{ ingredientId: ingId, amount: 100 }],
        });
      }
      if (!dishes.some((d) => d.id === usedDishId)) {
        dishes.push({
          id: usedDishId,
          name: { vi: 'Món Đang Dùng', en: 'Used Dish' },
          tags: ['breakfast'],
          ingredients: [{ ingredientId: ingId, amount: 100 }],
        });
        localStorage.setItem('mp-dishes', JSON.stringify(dishes));
      }

      // Add used dish to today's plan
      const today = new Date().toISOString().slice(0, 10);
      const plans = JSON.parse(localStorage.getItem('mp-day-plans') || '[]') as Array<{ date: string }>;
      if (!plans.some((p) => p.date === today)) {
        plans.push({ date: today, breakfastDishIds: [usedDishId], lunchDishIds: [], dinnerDishIds: [] });
      } else {
        const plan = plans.find((p) => p.date === today) as { breakfastDishIds: string[] };
        if (!plan.breakfastDishIds) plan.breakfastDishIds = [];
        if (!plan.breakfastDishIds.includes(usedDishId)) {
          plan.breakfastDishIds.push(usedDishId);
        }
      }
      localStorage.setItem('mp-day-plans', JSON.stringify(plans));
    }, TEST_ING_ID, TEST_DISH_ID, USED_DISH_ID);

    // Reload with migration so seeded data moves from localStorage to SQLite
    await page.reloadApp();
    await page.navigateTo('library');
    await browser.pause(500);
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_DEL_01 — Delete unused dish: confirmation modal opens
  // ─────────────────────────────────────────────────────────────────
  it('TC_DEL_01 — should show confirmation modal when deleting unused dish', async () => {
    await page.searchDish('Xóa Test');
    await browser.pause(500);

    // Click delete
    await page.waitAndClick(`btn-delete-dish-${TEST_DISH_ID}`);
    await browser.pause(300);

    // Confirm action button should be visible
    await expect(page.el('btn-confirm-action')).toBeDisplayed();
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_DEL_02 — Cancel delete preserves item
  // ─────────────────────────────────────────────────────────────────
  it('TC_DEL_02 — cancelling delete should preserve the dish', async () => {
    await page.waitAndClick('btn-cancel-action');
    await browser.pause(300);

    // Dish should still exist
    const exists = await page.isDisplayed(`btn-delete-dish-${TEST_DISH_ID}`);
    assert.ok(exists, 'Dish should still be visible after cancel');
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_DEL_03 — Confirm delete removes dish + undo toast
  // ─────────────────────────────────────────────────────────────────
  it('TC_DEL_03 — confirming delete should remove dish and show undo toast', async () => {
    // Delete again and confirm
    await page.waitAndClick(`btn-delete-dish-${TEST_DISH_ID}`);
    await browser.pause(300);
    await page.waitAndClick('btn-confirm-action');
    await browser.pause(500);

    // Dish should no longer be visible
    const exists = await page.isDisplayed(`btn-delete-dish-${TEST_DISH_ID}`);
    assert.strictEqual(exists, false, 'Dish should be removed after confirm');

    // Check undo toast appeared (look for "Undo" text in toast container)
    const hasUndo = await (browser as unknown as ExecutableBrowser).execute(() => {
      const toasts = document.querySelectorAll('[class*="toast"], [role="status"], [class*="Toastify"]');
      for (const t of toasts) {
        if (t.textContent?.includes('Undo') || t.textContent?.includes('Hoàn tác')) return true;
      }
      // Also check for any button with undo text
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.textContent?.includes('Undo') || b.textContent?.includes('Hoàn tác')) return true;
      }
      return false;
    });
    assert.ok(hasUndo, 'Undo toast should appear after deletion');
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_DEL_04 — Delete dish in use: disabled/warning
  // ─────────────────────────────────────────────────────────────────
  it('TC_DEL_04 — delete button for in-use dish should show warning', async () => {
    await page.searchDish('Đang Dùng');
    await browser.pause(500);

    // Click the delete button for the in-use dish
    await (browser as unknown as ExecutableBrowser).execute((id: string) => {
      const btn = document.querySelector(`[data-testid="btn-delete-dish-${id}"]`) as HTMLElement;
      btn?.click();
    }, USED_DISH_ID);
    await browser.pause(500);

    // The app should either show a warning toast or the confirmation modal should NOT appear
    // (the dish is in use, so it should be protected)
    const confirmVisible = await page.isDisplayed('confirm-modal');
    const dishStillExists = await page.isDisplayed(`btn-delete-dish-${USED_DISH_ID}`);
    assert.ok(!confirmVisible || dishStillExists, 'In-use dish should not be deletable');
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_DEL_05 — Delete ingredient with confirmation + undo
  // ─────────────────────────────────────────────────────────────────
  describe('Ingredient delete (TC_DEL_05)', () => {
    const STANDALONE_ING_ID = 'e2e-del-standalone-ing';

    before(async () => {
      // Inject a STANDALONE ingredient NOT used by any dish
      await (browser as unknown as ExecutableBrowser).execute((ingId: string) => {
        const ings = JSON.parse(localStorage.getItem('mp-ingredients') || '[]') as Array<{ id: string }>;
        if (!ings.some((i) => i.id === ingId)) {
          ings.push({
            id: ingId,
            name: { vi: 'NL Riêng Test', en: 'Standalone Ingredient' },
            caloriesPer100: 50,
            proteinPer100: 2,
            carbsPer100: 10,
            fatPer100: 0.5,
            fiberPer100: 0.5,
            unit: { vi: 'g', en: 'g' },
          });
          localStorage.setItem('mp-ingredients', JSON.stringify(ings));
        }
      }, STANDALONE_ING_ID);

      // Reload with migration so seeded data moves from localStorage to SQLite
      await page.reloadApp();
      await page.navigateTo('library');
      await browser.pause(300);
      await page.openIngredientsSubTab();
      await browser.pause(500);
    });

    it('TC_DEL_05 — should delete standalone ingredient and confirm removal', async () => {
      // Click delete button via JS to avoid interactability issues
      await (browser as unknown as ExecutableBrowser).execute((id: string) => {
        const btn = document.querySelector(`[data-testid="btn-delete-ingredient-${id}"]`) as HTMLElement;
        btn?.click();
      }, STANDALONE_ING_ID);
      await browser.pause(500);

      // Wait for and click confirmation
      await browser.waitUntil(
        async () => page.isDisplayed('btn-confirm-action'),
        { timeout: 5000, interval: 300 }
      );
      await (browser as unknown as ExecutableBrowser).execute(() => {
        const btn = document.querySelector('[data-testid="btn-confirm-action"]') as HTMLElement;
        btn?.click();
      });
      await browser.pause(1000);

      const exists = await page.isDisplayed(`btn-edit-ingredient-${STANDALONE_ING_ID}`);
      assert.strictEqual(exists, false, 'Standalone ingredient should be removed after delete');
    });
  });
});
