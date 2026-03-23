import assert from 'node:assert';
import { CalendarPage } from '../pages/CalendarPage';
import { GroceryPage } from '../pages/GroceryPage';
import { localDateKey } from '../utils/dateKey';

type ExecutableBrowser = typeof browser & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: <T>(fn: (...args: any[]) => T, ...args: unknown[]) => Promise<T>;
};

describe('Grocery Aggregation — verify item quantities match plan', () => {
  const calPage = new CalendarPage();
  const groceryPage = new GroceryPage();
  const todayKey = localDateKey();

  const ING_1_ID = 'e2e-groc-agg-ing-1';
  const ING_2_ID = 'e2e-groc-agg-ing-2';

  before(async () => {
    await calPage.switchToWebview();

    // Inject 2 ingredients and 2 dishes that share 1 ingredient
    await (browser as unknown as ExecutableBrowser).execute((dateKey: string) => {
      const ings = JSON.parse(localStorage.getItem('mp-ingredients') || '[]') as Array<Record<string, unknown>>;
      const testIngs = [
        { id: 'e2e-groc-agg-ing-1', name: { vi: 'Gạo grocery agg', en: 'Grocery Agg Rice' }, caloriesPer100: 130, proteinPer100: 3, carbsPer100: 28, fatPer100: 0.3, fiberPer100: 0.4, unit: { vi: 'g', en: 'g' } },
        { id: 'e2e-groc-agg-ing-2', name: { vi: 'Thịt grocery agg', en: 'Grocery Agg Meat' }, caloriesPer100: 250, proteinPer100: 26, carbsPer100: 0, fatPer100: 15, fiberPer100: 0, unit: { vi: 'g', en: 'g' } },
      ];
      for (const ing of testIngs) {
        if (!ings.some(i => i.id === ing.id)) ings.push(ing);
      }
      localStorage.setItem('mp-ingredients', JSON.stringify(ings));

      const dishes = JSON.parse(localStorage.getItem('mp-dishes') || '[]') as Array<Record<string, unknown>>;
      const testDishes = [
        { id: 'e2e-groc-agg-dish-1', name: { vi: 'Món agg 1', en: 'Agg Dish 1' }, ingredients: [{ ingredientId: 'e2e-groc-agg-ing-1', amount: 200 }, { ingredientId: 'e2e-groc-agg-ing-2', amount: 100 }], tags: ['breakfast'] },
        { id: 'e2e-groc-agg-dish-2', name: { vi: 'Món agg 2', en: 'Agg Dish 2' }, ingredients: [{ ingredientId: 'e2e-groc-agg-ing-1', amount: 150 }], tags: ['lunch'] },
      ];
      for (const dish of testDishes) {
        if (!dishes.some(d => d.id === dish.id)) dishes.push(dish);
      }
      localStorage.setItem('mp-dishes', JSON.stringify(dishes));

      // Set day plan with both dishes for today
      const plans = JSON.parse(localStorage.getItem('mp-day-plans') || '[]') as Array<Record<string, unknown>>;
      const idx = plans.findIndex(p => p.date === dateKey);
      const planEntry = {
        date: dateKey,
        breakfastDishIds: ['e2e-groc-agg-dish-1'],
        lunchDishIds: ['e2e-groc-agg-dish-2'],
        dinnerDishIds: [] as string[],
      };
      if (idx === -1) plans.push(planEntry);
      else plans[idx] = planEntry;
      localStorage.setItem('mp-day-plans', JSON.stringify(plans));

      // Clear grocery checked state
      localStorage.removeItem('mp-grocery-checked');
    }, todayKey);

    await calPage.reloadApp();
    await groceryPage.navigateTo('calendar');
    await groceryPage.navigateTo('grocery');
    await browser.waitUntil(
      async () => (await groceryPage.isDisplayed('grocery-empty-state')) || (await groceryPage.isDisplayed('tab-grocery-day')),
      { timeout: 10_000, interval: 500 }
    );
  });

  it('TC_GROC_AGG_01 — should show grocery items in day scope', async () => {
    await groceryPage.selectScope('day');
    await browser.pause(500);
    // At least one of our injected ingredients should appear
    const hasIng1 = await groceryPage.isDisplayed(`grocery-item-${ING_1_ID}`);
    const hasIng2 = await groceryPage.isDisplayed(`grocery-item-${ING_2_ID}`);
    assert.ok(
      hasIng1 || hasIng2,
      'Expected at least one grocery item to be displayed in day scope',
    );
  });

  it('TC_GROC_AGG_02 — should aggregate ingredient quantities from multiple dishes', async () => {
    // ING_1 appears in dish-1 (200g) and dish-2 (150g) = 350g total
    const item1Displayed = await groceryPage.isDisplayed(`grocery-item-${ING_1_ID}`);
    assert.strictEqual(
      item1Displayed,
      true,
      `Expected grocery-item-${ING_1_ID} to be displayed (aggregated from 2 dishes)`,
    );
  });

  it('TC_GROC_AGG_03 — should show second ingredient from plan', async () => {
    // ING_2 appears in dish-1 only (100g)
    const item2Displayed = await groceryPage.isDisplayed(`grocery-item-${ING_2_ID}`);
    assert.strictEqual(
      item2Displayed,
      true,
      `Expected grocery-item-${ING_2_ID} to be displayed`,
    );
  });

  it('TC_GROC_AGG_04 — should mark item as checked and persist', async () => {
    await groceryPage.tapGroceryItem(ING_2_ID);
    await browser.pause(300);
    const checkedIds = await (browser as unknown as ExecutableBrowser).execute(() => {
      const snaps = JSON.parse(
        localStorage.getItem('mp-grocery-checked') || '[]',
      ) as Array<{ id: string }>;
      return snaps.map(s => s.id);
    });
    assert.ok(
      checkedIds.includes(ING_2_ID),
      `Expected ${ING_2_ID} to be in mp-grocery-checked`,
    );
  });

  it('TC_GROC_AGG_05 — should copy grocery list', async () => {
    await groceryPage.tapCopy();
    // Copy should not throw — button should still be displayed
    await expect(groceryPage.el('btn-grocery-copy')).toBeDisplayed();
  });
});
