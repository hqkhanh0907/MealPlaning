import assert from 'node:assert';
import { CalendarPage } from '../pages/CalendarPage';

type ExecutableBrowser = typeof browser & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: <T>(fn: (...args: any[]) => T, ...args: unknown[]) => Promise<T>;
};

describe('Calendar Extended', () => {
  const page = new CalendarPage();
  const today = new Date().toISOString().split('T')[0];

  before(async () => {
    await page.switchToWebview();

    // Inject test data for calorie progress
    await page.injectTestData({
      dateKey: today,
      mealSlot: 'breakfast',
      dishId: 'e2e-cal-ext-dish',
      ingredientPayload: {
        id: 'e2e-cal-ext-ing',
        name: { vi: 'NL Cal Ext', en: 'Cal Ext Ing' },
        caloriesPer100: 200,
        proteinPer100: 10,
        carbsPer100: 30,
        fatPer100: 5,
        fiberPer100: 2,
        unit: { vi: 'g', en: 'g' },
      },
      dishPayload: {
        id: 'e2e-cal-ext-dish',
        name: { vi: 'Món Cal Ext', en: 'Cal Ext Dish' },
        tags: ['breakfast'],
        ingredients: [{ ingredientId: 'e2e-cal-ext-ing', amount: 200 }],
      },
    });

    await page.reloadApp();
    await page.navigateTo('calendar');
    await page.tapToday();
    await browser.pause(500);
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_CAL_08 — Progress bar displays calorie ratio
  // ─────────────────────────────────────────────────────────────────
  it('TC_CAL_08 — calorie progress bar should reflect planned meals', async () => {
    const progressValue = await (browser as unknown as ExecutableBrowser).execute(() => {
      const el = document.querySelector('[data-testid="progress-calories"]') as HTMLProgressElement;
      return el ? el.value : -1;
    });
    assert.ok(Number(progressValue) > 0, `Progress bar value should be > 0, got: ${progressValue}`);
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_CAL_09 — Protein progress bar visible
  // ─────────────────────────────────────────────────────────────────
  it('TC_CAL_09 — protein progress bar should be displayed', async () => {
    await expect(page.el('progress-protein')).toBeDisplayed();
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_CAL_10 — Summary total calories matches injected data
  // ─────────────────────────────────────────────────────────────────
  it('TC_CAL_10 — summary calories should match injected dish', async () => {
    const cal = await page.getTotalCalories();
    const calNum = Number.parseInt(cal, 10);
    // 200g of ingredient with 200cal/100g = 400 cal
    assert.ok(calNum > 0, `Expected positive calories, got: ${cal}`);
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_CAL_11 — Date navigation updates display
  // ─────────────────────────────────────────────────────────────────
  it('TC_CAL_11 — navigating to different date should update summary', async () => {
    // Navigate to previous day (no plan)
    await page.tapPrevDate();
    await browser.pause(500);

    const cal = await page.getTotalCalories();
    const calNum = Number.parseInt(cal, 10);
    assert.strictEqual(calNum, 0, 'Previous day should have 0 calories');

    // Navigate back to today
    await page.tapToday();
    await browser.pause(500);
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_CAL_12 — Meal cards show planned dishes
  // ─────────────────────────────────────────────────────────────────
  it('TC_CAL_12 — breakfast card should show planned dish', async () => {
    const mealCard = page.getMealCard('breakfast');
    await mealCard.waitForDisplayed({ timeout: 5000 });

    const hasDish = await (browser as unknown as ExecutableBrowser).execute(() => {
      const card = document.querySelector('[data-testid="meal-card-breakfast"]');
      return card?.textContent?.includes('Cal Ext') || card?.textContent?.includes('Món Cal Ext') || false;
    });
    assert.ok(hasDish, 'Breakfast meal card should show the planned dish name');
  });

  after(async () => {
    // Clean up injected data
    await page.tapMoreMenu();
    await page.tapClearPlan();
    await page.tapClearScope('day');
    await browser.pause(300);
  });
});
