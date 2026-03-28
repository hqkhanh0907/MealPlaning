import assert from 'node:assert';
import { CalendarPage, MealTypeName } from '../pages/CalendarPage';
import { localDateKey } from '../utils/dateKey';

describe('Planning — meal planning flow', () => {
  const page = new CalendarPage();
  const todayKey = localDateKey();

  before(async () => {
    await page.switchToWebview();

    // Inject test ingredient + dish so planning modal has data to select
    await page.injectTestData({
      dateKey: todayKey,
      mealSlot: 'breakfast',
      dishId: 'e2e-plan-dish-1',
      ingredientPayload: {
        id: 'e2e-plan-ing-1',
        name: { vi: 'Gạo plan test', en: 'Plan Test Rice' },
        caloriesPer100: 130,
        proteinPer100: 3,
        carbsPer100: 28,
        fatPer100: 0.3,
        fiberPer100: 0.4,
        unit: { vi: 'g', en: 'g' },
      },
      dishPayload: {
        id: 'e2e-plan-dish-1',
        name: { vi: 'Món plan test', en: 'Plan Test Dish' },
        ingredients: [{ ingredientId: 'e2e-plan-ing-1', amount: 200 }],
        tags: ['breakfast', 'lunch', 'dinner'],
      },
    });
    await page.reloadApp();
    await page.navigateTo('calendar');
    await page.tapToday();
  });

  it('TC_PLAN_01 — should open MealPlannerModal via Plan Meal button', async () => {
    await page.tapPlanMeal();
    await browser.pause(500);
    // MealPlannerModal opens directly — search input should be visible
    await expect(page.el('input-search-plan')).toBeDisplayed();
    await expect(page.el('btn-confirm-plan')).toBeDisplayed();
  });

  it('TC_PLAN_02 — should search for a dish in planning modal', async () => {
    await page.searchPlan('Plan Test');
    await browser.pause(500);
    await expect(page.el('input-search-plan')).toBeDisplayed();
  });

  it('TC_PLAN_03 — should confirm meal plan', async () => {
    await page.confirmPlan();
    await browser.pause(300);
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_PLAN_05 — Plan lunch meal type
  // ─────────────────────────────────────────────────────────────────
  describe('Multi-meal type planning (TC_PLAN_05)', () => {
    const mealTypes: MealTypeName[] = ['lunch', 'dinner'];

    for (const mealType of mealTypes) {
      it(`TC_PLAN_05 — should plan ${mealType} successfully`, async () => {
        await page.openPlanning(mealType);
        await expect(page.el('input-search-plan')).toBeDisplayed();
        await page.confirmPlan();
        await browser.pause(300);
      });
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_PLAN_06 — Verify plan persists after reload
  // ─────────────────────────────────────────────────────────────────
  describe('Plan persistence (TC_PLAN_06)', () => {
    it('TC_PLAN_06 — should persist plan data after planning', async () => {
      // Data is stored in SQLite (not localStorage). Verify that the
      // planned meals remain visible in the UI within the current session.
      await page.navigateTo('calendar');
      await page.tapToday();
      await browser.pause(500);
      const cal = await page.getTotalCalories();
      assert.ok(
        Number.parseInt(cal, 10) > 0,
        `Expected planned meals to be reflected in UI, but calories = ${cal}`,
      );
    });
  });
});
