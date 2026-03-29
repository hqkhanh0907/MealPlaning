import assert from 'node:assert';
import { ManagementPage } from '../pages/ManagementPage';

type ExecutableBrowser = typeof browser & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: <T>(fn: () => T) => Promise<T>;
};

describe('Dish CRUD', () => {
  const page = new ManagementPage();

  before(async () => {
    await page.switchToWebview();
    await page.navigateTo('library');
  });

  it('should open add dish modal', async () => {
    await page.tapAddDish();
    await expect(page.el('input-dish-name')).toBeDisplayed();
  });

  it('should fill dish name', async () => {
    await page.fillDishName('Phở bò test');
  });

  it('should toggle breakfast tag', async () => {
    await page.toggleTag('breakfast');
    await expect(page.el('tag-breakfast')).toBeDisplayed();
  });

  it('should save new dish', async () => {
    await page.saveDish();
  });

  it('should search for the created dish', async () => {
    await page.searchDish('Phở bò test');
  });

  describe('Validation', () => {
    before(async () => {
      // Close any stale dish modal (e.g. left open by a previous failed save) so we
      // start with a fresh, empty form. If the modal is NOT open this is a no-op.
      await page.closeDishModal();
      await page.tapAddDish();
      await expect(page.el('input-dish-name')).toBeDisplayed();
    });

    it('should show name error when submitting empty dish name', async () => {
      await page.saveDishWithoutWait();
      await expect(page.el('error-dish-name')).toBeDisplayed();
    });

    it('should show ingredients error when no ingredient selected on submit', async () => {
      await page.fillDishName('Dish val test');
      await page.toggleTag('lunch');
      await page.saveDishWithoutWait();
      await expect(page.el('error-dish-ingredients')).toBeDisplayed();
    });

    it('should clear name error when user starts typing', async () => {
      // Name error is visible; start typing to dismiss it
      await page.fillDishName('A');
      // After typing, the error element should no longer be in DOM
      await expect(page.el('error-dish-name')).not.toBeDisplayed();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_LIB_06 — Edit dish  |  TC_LIB_07 — Delete dish
  // ─────────────────────────────────────────────────────────────────
  describe('Edit & Delete dish (TC_LIB_06, TC_LIB_07)', () => {
    const TEST_DISH_ID = 'e2e-test-dish-lib';

    before(async () => {
      await page.closeDishModal();
      // Inject a known ingredient + dish directly into localStorage
      await (browser as unknown as ExecutableBrowser).execute(() => {
        const ings = JSON.parse(localStorage.getItem('mp-ingredients') || '[]') as Array<{ id: string }>;
        if (!ings.some((i) => i.id === 'e2e-test-ing-lib')) {
          ings.push({
            id: 'e2e-test-ing-lib',
            name: { vi: 'Nguyên liệu E2E', en: 'E2E Ingredient' },
            caloriesPer100: 100,
            proteinPer100: 2,
            carbsPer100: 20,
            fatPer100: 0.3,
            fiberPer100: 0.5,
            unit: { vi: 'g', en: 'g' },
          });
          localStorage.setItem('mp-ingredients', JSON.stringify(ings));
        }
        const dishes = JSON.parse(localStorage.getItem('mp-dishes') || '[]') as Array<{ id: string }>;
        if (!dishes.some((d) => d.id === 'e2e-test-dish-lib')) {
          dishes.push({
            id: 'e2e-test-dish-lib',
            name: { vi: 'Món E2E test', en: 'E2E Test Dish' },
            ingredients: [{ ingredientId: 'e2e-test-ing-lib', amount: 100 }],
            tags: ['breakfast'],
          });
          localStorage.setItem('mp-dishes', JSON.stringify(dishes));
        }
      });
      // Reload so localStorage data migrates to SQLite
      await page.reloadApp();
      await page.navigateTo('library');
      await page.openSubTab('dishes');
    });

    it('TC_LIB_06 — should edit a dish name', async () => {
      await page.searchDish('Món E2E test');
      await page.editDishById(TEST_DISH_ID);
      await expect(page.el('input-dish-name')).toBeDisplayed();
      await page.fillDishName('Món E2E test (edited)');
      await page.saveDish();
      await page.el('input-dish-name').waitForDisplayed({ reverse: true, timeout: 10_000 });
    });

    it('TC_LIB_07 — should delete the dish after confirmation', async () => {
      await page.searchDish('');
      await page.deleteDishById(TEST_DISH_ID);
      await browser.pause(500);
      const stillExists = await page.isDisplayed(`btn-edit-dish-${TEST_DISH_ID}`);
      assert.strictEqual(
        stillExists,
        false,
        `Dish ${TEST_DISH_ID} should no longer appear in the list after deletion`,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_LIB_08 — Dish live nutrition preview
  // ─────────────────────────────────────────────────────────────────
  describe('Dish live nutrition preview (TC_LIB_08)', () => {
    const ING_ID = 'e2e-test-ing-lib';

    before(async () => {
      await page.closeDishModal();
      // Ensure test ingredient exists
      await (browser as unknown as ExecutableBrowser).execute(() => {
        const ings = JSON.parse(localStorage.getItem('mp-ingredients') || '[]') as Array<{ id: string }>;
        if (!ings.some((i) => i.id === 'e2e-test-ing-lib')) {
          ings.push({
            id: 'e2e-test-ing-lib',
            name: { vi: 'Nguyên liệu E2E', en: 'E2E Ingredient' },
            caloriesPer100: 100,
            proteinPer100: 2,
            carbsPer100: 20,
            fatPer100: 0.3,
            fiberPer100: 0.5,
            unit: { vi: 'g', en: 'g' },
          });
          localStorage.setItem('mp-ingredients', JSON.stringify(ings));
        }
      });
      // Reload so localStorage data migrates to SQLite
      await page.reloadApp();
      await page.navigateTo('library');
      await page.openSubTab('dishes');
      // Open a fresh new dish modal
      await page.tapAddDish();
      await expect(page.el('input-dish-name')).toBeDisplayed();
      await page.fillDishName('Món test calories');
      await page.toggleTag('breakfast');
    });

    after(async () => {
      await page.closeDishModal();
    });

    it('TC_LIB_08 — should show live nutrition when an ingredient is added', async () => {
      await page.searchDishIngredient('E2E');
      await page.addIngredientToDish(ING_ID);
      const calories = await page.getDishTotalCalories();
      const calNum = Number.parseInt(calories, 10);
      assert.ok(calNum > 0, `Expected dish-total-calories > 0, but got: "${calories}"`);
    });
  });
});
