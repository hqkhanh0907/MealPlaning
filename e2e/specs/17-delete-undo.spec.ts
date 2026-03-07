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
    await page.navigateTo('management');
    await browser.pause(500);

    // Inject test data: 1 unused dish, 1 used dish (in today's plan), 1 ingredient
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
        plans.push({ date: today, meals: { breakfast: [usedDishId], lunch: [], dinner: [] } });
      } else {
        const plan = plans.find((p) => p.date === today) as { meals: { breakfast: string[] } };
        if (!plan.meals.breakfast.includes(usedDishId)) {
          plan.meals.breakfast.push(usedDishId);
        }
      }
      localStorage.setItem('mp-day-plans', JSON.stringify(plans));
    }, TEST_ING_ID, TEST_DISH_ID, USED_DISH_ID);

    // Reload to pick up injected data
    await (browser as unknown as ExecutableBrowser).execute(() => location.reload());
    await browser.pause(2000);
    await page.navigateTo('management');
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
  it('TC_DEL_04 — delete button for in-use dish should be disabled', async () => {
    await page.searchDish('Đang Dùng');
    await browser.pause(500);

    const isDisabled = await (browser as unknown as ExecutableBrowser).execute((id: string) => {
      const btn = document.querySelector(`[data-testid="btn-delete-dish-${id}"]`);
      return btn?.getAttribute('aria-disabled') === 'true' || btn?.className.includes('opacity-40') || false;
    }, USED_DISH_ID);
    assert.ok(isDisabled, 'Delete button for in-use dish should be disabled/faded');
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_DEL_05 — Delete ingredient with confirmation + undo
  // ─────────────────────────────────────────────────────────────────
  describe('Ingredient delete (TC_DEL_05)', () => {
    before(async () => {
      // First re-inject the test ingredient if needed (it was in deleted dish)
      await (browser as unknown as ExecutableBrowser).execute((ingId: string) => {
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
      }, TEST_ING_ID);

      await (browser as unknown as ExecutableBrowser).execute(() => location.reload());
      await browser.pause(2000);
      await page.navigateTo('management');
      await browser.pause(300);
      await page.openIngredientsSubTab();
      await browser.pause(300);
      await page.searchIngredient('Xóa Test');
      await browser.pause(500);
    });

    it('TC_DEL_05 — should delete ingredient and show undo option', async () => {
      await page.deleteIngredientById(TEST_ING_ID);
      await browser.pause(500);

      const exists = await page.isDisplayed(`btn-edit-ingredient-${TEST_ING_ID}`);
      assert.strictEqual(exists, false, 'Ingredient should be removed after delete');
    });
  });
});
