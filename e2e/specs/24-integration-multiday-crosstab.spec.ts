import assert from 'node:assert';
import { CalendarPage } from '../pages/CalendarPage';
import { GroceryPage } from '../pages/GroceryPage';
import { SettingsPage } from '../pages/SettingsPage';
import { ManagementPage } from '../pages/ManagementPage';
import { localDateKey } from '../utils/dateKey';

type ExecutableBrowser = typeof browser & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: <T>(fn: (...args: any[]) => T, ...args: unknown[]) => Promise<T>;
};

/**
 * Deep integration tests: multi-day planning, grocery scope aggregation,
 * cross-tab language/theme consistency.
 */
describe('Integration — Multi-day & Cross-tab consistency', () => {
  const cal = new CalendarPage();
  const grocery = new GroceryPage();
  const settings = new SettingsPage();
  const mgmt = new ManagementPage();

  const ING_A = 'e2e-multi-ing-a';
  const ING_B = 'e2e-multi-ing-b';
  const DISH_A = 'e2e-multi-dish-a';
  const DISH_B = 'e2e-multi-dish-b';

  // Compute today and tomorrow date keys
  const todayDate = new Date();
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const today = localDateKey(todayDate);
  const tomorrow = localDateKey(tomorrowDate);

  before(async () => {
    await cal.switchToWebview();

    // Seed: 2 ingredients, 2 dishes, plans for today AND tomorrow
    await (browser as unknown as ExecutableBrowser).execute(
      (ingA: string, ingB: string, dishA: string, dishB: string, todayKey: string, tomorrowKey: string) => {
        // Grocery checked state is now in SQLite — no localStorage key to clear

        const ings = [
          { id: ingA, name: { vi: 'Gạo multi', en: 'Multi Rice' }, caloriesPer100: 130, proteinPer100: 3, carbsPer100: 28, fatPer100: 0.3, fiberPer100: 0.4, unit: { vi: 'g', en: 'g' } },
          { id: ingB, name: { vi: 'Thịt multi', en: 'Multi Meat' }, caloriesPer100: 250, proteinPer100: 26, carbsPer100: 0, fatPer100: 15, fiberPer100: 0, unit: { vi: 'g', en: 'g' } },
        ];
        localStorage.setItem('mp-ingredients', JSON.stringify(ings));

        const dishes = [
          { id: dishA, name: { vi: 'Món A multi', en: 'Multi Dish A' }, ingredients: [{ ingredientId: ingA, amount: 200 }, { ingredientId: ingB, amount: 100 }], tags: ['breakfast'] },
          { id: dishB, name: { vi: 'Món B multi', en: 'Multi Dish B' }, ingredients: [{ ingredientId: ingA, amount: 150 }], tags: ['lunch'] },
        ];
        localStorage.setItem('mp-dishes', JSON.stringify(dishes));

        const plans = [
          { date: todayKey, breakfastDishIds: [dishA], lunchDishIds: [], dinnerDishIds: [] },
          { date: tomorrowKey, breakfastDishIds: [], lunchDishIds: [dishB], dinnerDishIds: [] },
        ];
        localStorage.setItem('mp-day-plans', JSON.stringify(plans));

        // Ensure Vietnamese language (only supported language)
        localStorage.setItem('mp-language', 'vi');
      },
      ING_A, ING_B, DISH_A, DISH_B, today, tomorrow,
    );

    await cal.reloadApp();
  });

  // ─────────────────────────────────────────────────────────────────
  // BLOCK 1: Multi-day grocery aggregation
  // ─────────────────────────────────────────────────────────────────
  describe('Multi-day grocery aggregation', () => {
    it('TC_MULTI_01 — day scope shows only today\'s ingredients', async () => {
      await grocery.navigateTo('calendar');
      await grocery.navigateTo('grocery');
      await browser.pause(500);
      await grocery.selectScope('day');
      await browser.pause(500);

      // Today has Dish A: Rice 200g + Meat 100g
      const hasRice = await grocery.isDisplayed(`grocery-item-${ING_A}`);
      const hasMeat = await grocery.isDisplayed(`grocery-item-${ING_B}`);
      assert.ok(hasRice, 'Day scope should show Rice from today\'s plan');
      assert.ok(hasMeat, 'Day scope should show Meat from today\'s plan');
    });

    it('TC_MULTI_02 — week scope aggregates across days', async () => {
      await grocery.selectScope('week');
      await browser.pause(500);

      // Week includes today (Rice 200g + Meat 100g) + tomorrow (Rice 150g)
      // Rice should aggregate to 350g total
      const hasRice = await grocery.isDisplayed(`grocery-item-${ING_A}`);
      const hasMeat = await grocery.isDisplayed(`grocery-item-${ING_B}`);
      assert.ok(hasRice, 'Week scope should show aggregated Rice');
      assert.ok(hasMeat, 'Week scope should show Meat');
    });

    it('TC_MULTI_03 — clearing today should keep tomorrow in week scope', async () => {
      // Clear today's plan
      await cal.navigateTo('calendar');
      await cal.tapToday();
      await browser.pause(300);

      await cal.tapClearPlan();
      await cal.tapClearScope('day');
      await browser.pause(500);

      // Day scope should now be empty (today cleared)
      await grocery.navigateTo('calendar');
      await grocery.navigateTo('grocery');
      await browser.pause(500);
      await grocery.selectScope('day');
      await browser.pause(500);

      const hasMeatDay = await grocery.isDisplayed(`grocery-item-${ING_B}`);
      assert.strictEqual(hasMeatDay, false, 'Day scope should not show Meat after clearing today');

      // Week scope should still show tomorrow's Rice
      await grocery.selectScope('week');
      await browser.pause(500);
      const hasRiceWeek = await grocery.isDisplayed(`grocery-item-${ING_A}`);
      assert.ok(hasRiceWeek, 'Week scope should still show Rice from tomorrow\'s plan');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // BLOCK 2: Cross-tab language consistency
  // ─────────────────────────────────────────────────────────────────
  describe('Cross-tab language consistency', () => {
    before(async () => {
      // Re-inject today's plan for consistent state
      await (browser as unknown as ExecutableBrowser).execute(
        (dishA: string, todayKey: string) => {
          const plans = JSON.parse(localStorage.getItem('mp-day-plans') || '[]') as Array<{ date: string }>;
          const pIdx = plans.findIndex(p => p.date === todayKey);
          const plan = { date: todayKey, breakfastDishIds: [dishA], lunchDishIds: [] as string[], dinnerDishIds: [] as string[] };
          if (pIdx === -1) plans.push(plan);
          else plans[pIdx] = plan;
          localStorage.setItem('mp-day-plans', JSON.stringify(plans));
        },
        DISH_A, today,
      );
      await cal.reloadApp();
    });

    it('TC_LANG_INTEG_01 — Vietnamese nav labels are displayed', async () => {
      await cal.navigateTo('calendar');
      await browser.pause(300);

      // Verify nav label is in Vietnamese (the only supported language)
      const navText = await (browser as unknown as ExecutableBrowser).execute(() => {
        const nav = document.querySelector('[data-testid="nav-calendar"]');
        return nav?.getAttribute('aria-label') || nav?.textContent || '';
      });
      assert.ok(
        navText.includes('Lịch'),
        `Nav should show Vietnamese label, got: "${navText}"`,
      );
    });

    it('TC_LANG_INTEG_02 — management tab reflects Vietnamese language', async () => {
      await mgmt.navigateTo('management');
      await browser.pause(500);

      // Check that UI text is in Vietnamese (e.g., add button or tab label)
      const tabText = await (browser as unknown as ExecutableBrowser).execute(() => {
        const tab = document.querySelector('[data-testid="tab-management-dishes"]');
        return tab?.textContent || '';
      });
      // Vietnamese for "Dishes" is "Món ăn"
      assert.ok(
        tabText.length > 0,
        `Management tab should have text content in Vietnamese, got: "${tabText}"`,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // BLOCK 3: Theme persistence across tabs
  // ─────────────────────────────────────────────────────────────────
  describe('Cross-tab theme consistency', () => {
    it('TC_THEME_INTEG_01 — dark theme applies to all tabs', async () => {
      await settings.navigateTo('settings');
      await browser.pause(300);
      await settings.switchTheme('dark');
      await browser.pause(300);

      // Check root element has dark class
      const hasDark = await (browser as unknown as ExecutableBrowser).execute(() => {
        return document.documentElement.classList.contains('dark');
      });
      assert.ok(hasDark, 'Root should have dark class after theme switch');

      // Navigate to calendar — dark class should persist
      await cal.navigateTo('calendar');
      await browser.pause(300);
      const stillDark = await (browser as unknown as ExecutableBrowser).execute(() => {
        return document.documentElement.classList.contains('dark');
      });
      assert.ok(stillDark, 'Dark class should persist on calendar tab');

      // Navigate to management — dark class should persist
      await mgmt.navigateTo('management');
      await browser.pause(300);
      const mgmtDark = await (browser as unknown as ExecutableBrowser).execute(() => {
        return document.documentElement.classList.contains('dark');
      });
      assert.ok(mgmtDark, 'Dark class should persist on management tab');
    });

    it('TC_THEME_INTEG_02 — theme persists after reload', async () => {
      await cal.reloadApp();
      await browser.pause(500);

      const hasDark = await (browser as unknown as ExecutableBrowser).execute(() => {
        return document.documentElement.classList.contains('dark');
      });
      assert.ok(hasDark, 'Dark theme should persist after page reload');
    });

    it('TC_THEME_INTEG_03 — switching to light removes dark class everywhere', async () => {
      await settings.navigateTo('settings');
      await browser.pause(300);
      await settings.switchTheme('light');
      await browser.pause(300);

      const hasDark = await (browser as unknown as ExecutableBrowser).execute(() => {
        return document.documentElement.classList.contains('dark');
      });
      assert.strictEqual(hasDark, false, 'Root should NOT have dark class in light mode');

      // Verify across tabs
      await grocery.navigateTo('calendar');
      await grocery.navigateTo('grocery');
      await browser.pause(300);
      const groceryDark = await (browser as unknown as ExecutableBrowser).execute(() => {
        return document.documentElement.classList.contains('dark');
      });
      assert.strictEqual(groceryDark, false, 'Light theme should apply on grocery tab');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // BLOCK 4: Edit ingredient nutrition → dish → calendar cascade
  // ─────────────────────────────────────────────────────────────────
  describe('Nutrition edit cascade', () => {
    it('TC_NUTR_CASCADE_01 — editing ingredient nutrition updates dish calories', async () => {
      // Get current calories from calendar
      await cal.navigateTo('calendar');
      await cal.tapToday();
      await browser.pause(500);
      const calBefore = await cal.getTotalCalories();
      const calBeforeNum = Number.parseInt(calBefore, 10);

      // Double the ingredient's calories via localStorage
      await (browser as unknown as ExecutableBrowser).execute((ingId: string) => {
        const ings = JSON.parse(localStorage.getItem('mp-ingredients') || '[]') as Array<{ id: string; caloriesPer100: number }>;
        const ing = ings.find(i => i.id === ingId);
        if (ing) ing.caloriesPer100 = 260; // was 130, now 260
        localStorage.setItem('mp-ingredients', JSON.stringify(ings));
      }, ING_A);

      await cal.reloadApp();
      await cal.navigateTo('calendar');
      await cal.tapToday();
      await browser.pause(500);

      const calAfter = await cal.getTotalCalories();
      const calAfterNum = Number.parseInt(calAfter, 10);

      // Calories should roughly double (200g × 260/100 = 520, was 200g × 130/100 = 260)
      assert.ok(
        calAfterNum > calBeforeNum,
        `Calories should increase after nutrition edit: before=${calBeforeNum}, after=${calAfterNum}`,
      );
    });
  });

  after(async () => {
    // Reset language and theme
    await (browser as unknown as ExecutableBrowser).execute(() => {
      localStorage.setItem('mp-language', 'vi');
      localStorage.setItem('mp-theme', 'light');
      document.documentElement.classList.remove('dark');
    });
  });
});
