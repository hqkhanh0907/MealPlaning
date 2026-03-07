import assert from 'node:assert';
import { CalendarPage } from '../pages/CalendarPage';

describe('Calendar — date navigation', () => {
  const page = new CalendarPage();
  const todayKey = new Date().toISOString().split('T')[0];

  before(async () => {
    await page.switchToWebview();
    await page.navigateTo('calendar');
  });

  it('should tap today button', async () => {
    await page.tapToday();
    await expect(page.el('btn-today')).toBeDisplayed();
  });

  it('should navigate to previous date', async () => {
    await page.tapPrevDate();
    await expect(page.el('btn-prev-date')).toBeDisplayed();
  });

  it('should navigate to next date', async () => {
    await page.tapNextDate();
    await expect(page.el('btn-next-date')).toBeDisplayed();
  });

  it('should display meal cards when plan has data', async () => {
    // Inject data so meal cards render (empty state hides them)
    await page.injectTestData({
      dateKey: todayKey,
      mealSlot: 'breakfast',
      dishId: 'e2e-cal-mc-dish',
      ingredientPayload: {
        id: 'e2e-cal-mc-ing',
        name: { vi: 'Gạo MC', en: 'MC Rice' },
        caloriesPer100: 50, proteinPer100: 1, carbsPer100: 10,
        fatPer100: 0.1, fiberPer100: 0.1, unit: { vi: 'g', en: 'g' },
      },
      dishPayload: {
        id: 'e2e-cal-mc-dish',
        name: { vi: 'Món MC', en: 'MC Dish' },
        ingredients: [{ ingredientId: 'e2e-cal-mc-ing', amount: 100 }],
        tags: ['breakfast', 'lunch', 'dinner'],
      },
    });
    // Also inject lunch and dinner slots
    await page.injectTestData({ dateKey: todayKey, mealSlot: 'lunch', dishId: 'e2e-cal-mc-dish' });
    await page.injectTestData({ dateKey: todayKey, mealSlot: 'dinner', dishId: 'e2e-cal-mc-dish' });
    await page.reloadApp();
    await page.navigateTo('calendar');
    await page.tapToday();
    await expect(page.getMealCard('breakfast')).toBeDisplayed();
    await expect(page.getMealCard('lunch')).toBeDisplayed();
    await expect(page.getMealCard('dinner')).toBeDisplayed();
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_CAL_05 — Nutrition summary  |  TC_CAL_04 — Clear day plan
  // ─────────────────────────────────────────────────────────────────
  describe('Clear plan & nutrition summary (TC_CAL_04, TC_CAL_05)', () => {
    // Compute today's date key at test-execution time
    const todayKey = new Date().toISOString().split('T')[0];

    before(async () => {
      // Inject ingredient (100 cal/100g) + dish (200g serving) + today's day plan
      await page.injectTestData({
        dateKey: todayKey,
        mealSlot: 'breakfast',
        dishId: 'e2e-cal-dish-1',
        ingredientPayload: {
          id: 'e2e-cal-ing-1',
          name: { vi: 'Gạo cal test', en: 'Cal Test Rice' },
          caloriesPer100: 100,
          proteinPer100: 2,
          carbsPer100: 20,
          fatPer100: 0.3,
          fiberPer100: 0.5,
          unit: { vi: 'g', en: 'g' },
        },
        dishPayload: {
          id: 'e2e-cal-dish-1',
          name: { vi: 'Món calo test', en: 'Cal Test Dish' },
          ingredients: [{ ingredientId: 'e2e-cal-ing-1', amount: 200 }],
          tags: ['breakfast'],
        },
      });
      // Reload the app so React reads the injected data from localStorage
      await page.reloadApp();
      await page.navigateTo('calendar');
      // Ensure calendar is showing today
      await page.tapToday();
    });

    it('TC_CAL_05 — should display correct total calories in summary', async () => {
      const cal = await page.getTotalCalories();
      // 200g × (100 kcal / 100g) = 200 kcal
      assert.ok(
        Number.parseInt(cal, 10) > 0,
        `Expected summary-total-calories > 0, but got: "${cal}"`,
      );
    });

    it('TC_CAL_04 — should clear the day plan via clear button', async () => {
      await page.tapClearPlan();
      await page.tapClearScope('day');
      // After clearing the plan, summary should show 0 calories
      await browser.pause(500);
      const cal = await page.getTotalCalories();
      assert.strictEqual(
        Number.parseInt(cal, 10),
        0,
        `Expected summary-total-calories = 0 after clearing, but got: "${cal}"`,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_CAL_06 — Clear week plan  |  TC_CAL_07 — Clear month plan
  // ─────────────────────────────────────────────────────────────────
  describe('Clear plan scopes (TC_CAL_06, TC_CAL_07)', () => {
    before(async () => {
      // Inject data for today so we can test clearing
      const dk = new Date().toISOString().split('T')[0];
      await page.injectTestData({
        dateKey: dk,
        mealSlot: 'lunch',
        dishId: 'e2e-cal-dish-2',
        ingredientPayload: {
          id: 'e2e-cal-ing-2',
          name: { vi: 'Gạo clear test', en: 'Clear Test Rice' },
          caloriesPer100: 80,
          proteinPer100: 1,
          carbsPer100: 15,
          fatPer100: 0.2,
          fiberPer100: 0.3,
          unit: { vi: 'g', en: 'g' },
        },
        dishPayload: {
          id: 'e2e-cal-dish-2',
          name: { vi: 'Món clear test', en: 'Clear Test Dish' },
          ingredients: [{ ingredientId: 'e2e-cal-ing-2', amount: 100 }],
          tags: ['lunch'],
        },
      });
      await page.reloadApp();
      await page.navigateTo('calendar');
      await page.tapToday();
    });

    it('TC_CAL_06 — should clear the week plan', async () => {
      await page.tapClearPlan();
      await page.tapClearScope('week');
      await browser.pause(500);
      const cal = await page.getTotalCalories();
      assert.strictEqual(
        Number.parseInt(cal, 10),
        0,
        `Expected summary-total-calories = 0 after clearing week, but got: "${cal}"`,
      );
    });

    it('TC_CAL_07 — should clear the month plan', async () => {
      // Re-inject data for month clear test
      const dk = new Date().toISOString().split('T')[0];
      await page.injectTestData({
        dateKey: dk,
        mealSlot: 'dinner',
        dishId: 'e2e-cal-dish-2',
      });
      await page.reloadApp();
      await page.navigateTo('calendar');
      await page.tapToday();

      await page.tapClearPlan();
      await page.tapClearScope('month');
      await browser.pause(500);
      const cal = await page.getTotalCalories();
      assert.strictEqual(
        Number.parseInt(cal, 10),
        0,
        `Expected summary-total-calories = 0 after clearing month, but got: "${cal}"`,
      );
    });
  });
});
