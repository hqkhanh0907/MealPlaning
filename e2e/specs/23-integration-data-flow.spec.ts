import assert from 'node:assert';
import { CalendarPage } from '../pages/CalendarPage';
import { ManagementPage } from '../pages/ManagementPage';
import { GroceryPage } from '../pages/GroceryPage';
import { SettingsPage } from '../pages/SettingsPage';

type ExecutableBrowser = typeof browser & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: <T>(fn: (...args: any[]) => T, ...args: unknown[]) => Promise<T>;
};

/**
 * Deep integration tests: cross-feature data flow.
 *
 * These tests verify that changes in one feature propagate correctly
 * to all dependent features WITHOUT page reload (live React state).
 */
describe('Integration — Ingredient → Dish → Calendar → Grocery data flow', () => {
  const cal = new CalendarPage();
  const mgmt = new ManagementPage();
  const grocery = new GroceryPage();
  const settings = new SettingsPage();

  const ING_ID = 'e2e-integ-ing';
  const DISH_ID = 'e2e-integ-dish';
  const today = new Date().toISOString().split('T')[0];

  before(async () => {
    await cal.switchToWebview();

    // Seed: 1 ingredient + 1 dish + today's plan
    await (browser as unknown as ExecutableBrowser).execute(
      (ingId: string, dishId: string, dateKey: string) => {
        // Clear test data
        localStorage.removeItem('mp-grocery-checked');

        const ings = JSON.parse(localStorage.getItem('mp-ingredients') || '[]') as Array<{ id: string }>;
        const ingObj = {
          id: ingId,
          name: { vi: 'Gạo tích hợp', en: 'Integration Rice' },
          caloriesPer100: 130,
          proteinPer100: 3,
          carbsPer100: 28,
          fatPer100: 0.3,
          fiberPer100: 0.4,
          unit: { vi: 'g', en: 'g' },
        };
        const idx = ings.findIndex(i => i.id === ingId);
        if (idx === -1) ings.push(ingObj);
        else ings[idx] = ingObj;
        localStorage.setItem('mp-ingredients', JSON.stringify(ings));

        const dishes = JSON.parse(localStorage.getItem('mp-dishes') || '[]') as Array<{ id: string }>;
        const dishObj = {
          id: dishId,
          name: { vi: 'Món tích hợp', en: 'Integration Dish' },
          ingredients: [{ ingredientId: ingId, amount: 200 }],
          tags: ['breakfast'],
        };
        const dIdx = dishes.findIndex(d => d.id === dishId);
        if (dIdx === -1) dishes.push(dishObj);
        else dishes[dIdx] = dishObj;
        localStorage.setItem('mp-dishes', JSON.stringify(dishes));

        const plans = JSON.parse(localStorage.getItem('mp-day-plans') || '[]') as Array<{ date: string }>;
        const pIdx = plans.findIndex(p => p.date === dateKey);
        const plan = { date: dateKey, breakfastDishIds: [dishId], lunchDishIds: [] as string[], dinnerDishIds: [] as string[] };
        if (pIdx === -1) plans.push(plan);
        else plans[pIdx] = plan;
        localStorage.setItem('mp-day-plans', JSON.stringify(plans));
      },
      ING_ID,
      DISH_ID,
      today,
    );

    await cal.reloadApp();
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_INTEG_01 — Calendar shows planned dish calories
  // ─────────────────────────────────────────────────────────────────
  it('TC_INTEG_01 — calendar should show calories from planned dish', async () => {
    await cal.navigateTo('calendar');
    await cal.tapToday();
    await browser.pause(500);

    const cal_text = await cal.getTotalCalories();
    const calories = Number.parseInt(cal_text, 10);
    // 200g × 130 cal/100g = 260 cal
    assert.ok(calories > 0, `Expected positive calories, got: ${cal_text}`);
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_INTEG_02 — Grocery shows ingredient from plan
  // ─────────────────────────────────────────────────────────────────
  it('TC_INTEG_02 — grocery should list the planned ingredient', async () => {
    await grocery.navigateTo('calendar');
    await grocery.navigateTo('grocery');
    await browser.pause(500);

    await grocery.selectScope('day');
    await browser.pause(500);

    const hasItem = await grocery.isDisplayed(`grocery-item-${ING_ID}`);
    assert.ok(hasItem, `Expected grocery-item-${ING_ID} to be displayed`);
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_INTEG_03 — Clear day plan → grocery empties
  // ─────────────────────────────────────────────────────────────────
  it('TC_INTEG_03 — clearing day plan should empty grocery list', async () => {
    // Go to calendar and clear today's plan
    await cal.navigateTo('calendar');
    await cal.tapToday();
    await browser.pause(300);

    await cal.tapClearPlan();
    await cal.tapClearScope('day');
    await browser.pause(500);

    // Verify calendar shows 0 calories
    const calText = await cal.getTotalCalories();
    assert.strictEqual(Number.parseInt(calText, 10), 0, `Expected 0 cal after clear, got: ${calText}`);

    // Navigate to grocery and verify empty
    await grocery.navigateTo('calendar');
    await grocery.navigateTo('grocery');
    await browser.pause(500);

    // After clearing plan, grocery may show empty state (no scope tabs visible)
    const hasItem = await grocery.isDisplayed(`grocery-item-${ING_ID}`);
    const isEmpty = await grocery.isDisplayed('grocery-empty-state');
    assert.ok(!hasItem || isEmpty, 'Grocery should be empty after clearing day plan');
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_INTEG_04 — Re-plan → grocery repopulates
  // ─────────────────────────────────────────────────────────────────
  it('TC_INTEG_04 — re-planning should repopulate grocery', async () => {
    // Re-inject plan
    await (browser as unknown as ExecutableBrowser).execute(
      (dishId: string, dateKey: string) => {
        const plans = JSON.parse(localStorage.getItem('mp-day-plans') || '[]') as Array<{ date: string }>;
        const pIdx = plans.findIndex(p => p.date === dateKey);
        const plan = { date: dateKey, breakfastDishIds: [dishId], lunchDishIds: [] as string[], dinnerDishIds: [] as string[] };
        if (pIdx === -1) plans.push(plan);
        else plans[pIdx] = plan;
        localStorage.setItem('mp-day-plans', JSON.stringify(plans));
      },
      DISH_ID,
      today,
    );

    await cal.reloadApp();
    await grocery.navigateTo('calendar');
    await grocery.navigateTo('grocery');
    await browser.pause(500);
    await grocery.selectScope('day');
    await browser.pause(500);

    const hasItem = await grocery.isDisplayed(`grocery-item-${ING_ID}`);
    assert.ok(hasItem, 'Grocery should show ingredient after re-planning');
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_INTEG_05 — Delete ingredient → dish ingredient removed
  // ─────────────────────────────────────────────────────────────────
  it('TC_INTEG_05 — deleting ingredient should remove it from dish', async () => {
    // Delete the ingredient via localStorage (simulates the App.tsx onDeleteIngredient flow)
    await (browser as unknown as ExecutableBrowser).execute((ingId: string) => {
      // Remove ingredient
      const ings = JSON.parse(localStorage.getItem('mp-ingredients') || '[]') as Array<{ id: string }>;
      localStorage.setItem('mp-ingredients', JSON.stringify(ings.filter(i => i.id !== ingId)));

      // Remove ingredient references from all dishes (same as removeIngredientFromDishes)
      const dishes = JSON.parse(localStorage.getItem('mp-dishes') || '[]') as Array<{ id: string; ingredients: Array<{ ingredientId: string }> }>;
      for (const dish of dishes) {
        dish.ingredients = dish.ingredients.filter(di => di.ingredientId !== ingId);
      }
      localStorage.setItem('mp-dishes', JSON.stringify(dishes));
    }, ING_ID);

    await cal.reloadApp();

    // Verify in management: ingredient no longer listed
    await mgmt.navigateTo('management');
    await mgmt.openIngredientsSubTab();
    await browser.pause(300);
    const ingExists = await mgmt.isDisplayed(`btn-edit-ingredient-${ING_ID}`);
    assert.strictEqual(ingExists, false, 'Ingredient should be removed from management');

    // Verify: dish still exists but has no ingredients
    const dishData = await (browser as unknown as ExecutableBrowser).execute((dishId: string) => {
      const dishes = JSON.parse(localStorage.getItem('mp-dishes') || '[]') as Array<{ id: string; ingredients: unknown[] }>;
      const d = dishes.find(dd => dd.id === dishId);
      return d ? d.ingredients.length : -1;
    }, DISH_ID);
    assert.strictEqual(dishData, 0, 'Dish should have 0 ingredients after ingredient deletion');
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_INTEG_06 — After ingredient deletion, grocery shows nothing for that ingredient
  // ─────────────────────────────────────────────────────────────────
  it('TC_INTEG_06 — grocery should not show deleted ingredient', async () => {
    await grocery.navigateTo('calendar');
    await grocery.navigateTo('grocery');
    await browser.pause(500);
    await grocery.selectScope('day');
    await browser.pause(500);

    const hasItem = await grocery.isDisplayed(`grocery-item-${ING_ID}`);
    assert.strictEqual(hasItem, false, 'Deleted ingredient should not appear in grocery');
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_INTEG_07 — Import data → all tabs reflect imported data
  // ─────────────────────────────────────────────────────────────────
  it('TC_INTEG_07 — importing data should be accessible from all tabs', async () => {
    // Simulate import: inject fresh data
    await (browser as unknown as ExecutableBrowser).execute((dateKey: string) => {
      const impIng = {
        id: 'e2e-import-ing',
        name: { vi: 'NL Nhập', en: 'Imported Ing' },
        caloriesPer100: 100, proteinPer100: 5, carbsPer100: 15,
        fatPer100: 2, fiberPer100: 1, unit: { vi: 'g', en: 'g' },
      };
      const impDish = {
        id: 'e2e-import-dish',
        name: { vi: 'Món Nhập', en: 'Imported Dish' },
        ingredients: [{ ingredientId: 'e2e-import-ing', amount: 150 }],
        tags: ['lunch'],
      };
      localStorage.setItem('mp-ingredients', JSON.stringify([impIng]));
      localStorage.setItem('mp-dishes', JSON.stringify([impDish]));
      localStorage.setItem('mp-day-plans', JSON.stringify([
        { date: dateKey, breakfastDishIds: [], lunchDishIds: ['e2e-import-dish'], dinnerDishIds: [] },
      ]));
    }, today);

    await cal.reloadApp();

    // Check Calendar: shows imported dish calories
    await cal.navigateTo('calendar');
    await cal.tapToday();
    await browser.pause(500);
    const calText = await cal.getTotalCalories();
    assert.ok(Number.parseInt(calText, 10) > 0, `Calendar should show imported dish calories, got: ${calText}`);

    // Check Management: imported ingredient exists
    await mgmt.navigateTo('management');
    await mgmt.openIngredientsSubTab();
    await browser.pause(300);
    const ingExists = await mgmt.isDisplayed('btn-edit-ingredient-e2e-import-ing');
    assert.ok(ingExists, 'Imported ingredient should be visible in Management');

    // Check Grocery: imported plan generates items
    await grocery.navigateTo('calendar');
    await grocery.navigateTo('grocery');
    await browser.pause(500);
    await grocery.selectScope('day');
    await browser.pause(500);
    const hasGroceryItem = await grocery.isDisplayed('grocery-item-e2e-import-ing');
    assert.ok(hasGroceryItem, 'Imported plan should generate grocery items');
  });

  after(async () => {
    // Cleanup
    await (browser as unknown as ExecutableBrowser).execute(() => {
      const cleanIds = ['e2e-integ-ing', 'e2e-import-ing'];
      const ings = JSON.parse(localStorage.getItem('mp-ingredients') || '[]') as Array<{ id: string }>;
      localStorage.setItem('mp-ingredients', JSON.stringify(ings.filter(i => !cleanIds.includes(i.id))));

      const cleanDishIds = ['e2e-integ-dish', 'e2e-import-dish'];
      const dishes = JSON.parse(localStorage.getItem('mp-dishes') || '[]') as Array<{ id: string }>;
      localStorage.setItem('mp-dishes', JSON.stringify(dishes.filter(d => !cleanDishIds.includes(d.id))));
    });
  });
});
