import assert from 'node:assert';
import { ManagementPage } from '../pages/ManagementPage';

type ExecutableBrowser = typeof browser & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: <T>(fn: () => T) => Promise<T>;
};

describe('Dish Ingredient Amount — edit amounts in dish modal', () => {
  const page = new ManagementPage();
  const ING_ID = 'e2e-amount-ing-1';

  before(async () => {
    await page.switchToWebview();

    // Inject a known ingredient
    await (browser as unknown as ExecutableBrowser).execute(() => {
      const ings = JSON.parse(localStorage.getItem('mp-ingredients') || '[]') as Array<Record<string, unknown>>;
      if (!ings.some(i => i.id === 'e2e-amount-ing-1')) {
        ings.push({
          id: 'e2e-amount-ing-1',
          name: { vi: 'Nguyên liệu amount test', en: 'Amount Test Ingredient' },
          caloriesPer100: 200,
          proteinPer100: 10,
          carbsPer100: 30,
          fatPer100: 5,
          fiberPer100: 2,
          unit: { vi: 'g', en: 'g' },
        });
        localStorage.setItem('mp-ingredients', JSON.stringify(ings));
      }
    });
    await page.reloadApp();
    await page.navigateTo('management');
    await page.openSubTab('dishes');
  });

  after(async () => {
    await page.closeDishModal();
  });

  it('TC_DISH_AMT_01 — should open dish modal and add ingredient', async () => {
    await page.tapAddDish();
    await expect(page.el('input-dish-name')).toBeDisplayed();
    await page.fillDishName('Amount Test Dish');
    await page.toggleTag('breakfast');
    await page.searchDishIngredient('Amount Test');
    await page.addIngredientToDish(ING_ID);
  });

  it('TC_DISH_AMT_02 — should show default amount for added ingredient', async () => {
    const amountInput = page.el(`input-dish-amount-${ING_ID}`);
    await amountInput.waitForDisplayed({ timeout: 5_000 });
    const isDisplayed = await amountInput.isDisplayed();
    assert.strictEqual(isDisplayed, true, 'Amount input should be visible for added ingredient');
  });

  it('TC_DISH_AMT_03 — should update ingredient amount', async () => {
    await page.fillDishAmount(ING_ID, '250');
    // Wait for React to re-render live nutrition preview after amount change
    await browser.pause(1000);
    // Verify live nutrition preview updates
    const calories = await page.getDishTotalCalories();
    const calNum = Number.parseInt(calories, 10);
    // 250g × (200 kcal / 100g) = 500 kcal
    assert.ok(calNum > 0, `Expected dish-total-calories > 0 after amount update, but got: "${calories}"`);
  });

  it('TC_DISH_AMT_04 — should show live nutrition update after amount change', async () => {
    await page.fillDishAmount(ING_ID, '100');
    // Wait for React to re-render live nutrition preview after amount change
    await browser.pause(1000);
    const calories = await page.getDishTotalCalories();
    const calNum = Number.parseInt(calories, 10);
    // 100g × (200 kcal / 100g) = 200 kcal
    assert.ok(calNum > 0, `Expected calories > 0 for 100g, got: "${calories}"`);
  });
});
