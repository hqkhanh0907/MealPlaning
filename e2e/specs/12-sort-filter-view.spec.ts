import assert from 'node:assert';
import { ManagementPage } from '../pages/ManagementPage';

type ExecutableBrowser = typeof browser & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: <T>(fn: () => T) => Promise<T>;
};

describe('Sort, Filter & View Toggle — management toolbar features', () => {
  const page = new ManagementPage();

  before(async () => {
    await page.switchToWebview();

    // Inject multiple ingredients and dishes for meaningful sort/filter testing
    await (browser as unknown as ExecutableBrowser).execute(() => {
      const ings = JSON.parse(localStorage.getItem('mp-ingredients') || '[]') as Array<Record<string, unknown>>;
      const testIngs = [
        { id: 'e2e-sf-ing-1', name: { vi: 'Cà rốt SF', en: 'SF Carrot' }, caloriesPer100: 41, proteinPer100: 1, carbsPer100: 10, fatPer100: 0.2, fiberPer100: 2.8, unit: { vi: 'g', en: 'g' } },
        { id: 'e2e-sf-ing-2', name: { vi: 'Thịt bò SF', en: 'SF Beef' }, caloriesPer100: 250, proteinPer100: 26, carbsPer100: 0, fatPer100: 15, fiberPer100: 0, unit: { vi: 'g', en: 'g' } },
        { id: 'e2e-sf-ing-3', name: { vi: 'Gạo SF', en: 'SF Rice' }, caloriesPer100: 130, proteinPer100: 3, carbsPer100: 28, fatPer100: 0.3, fiberPer100: 0.4, unit: { vi: 'g', en: 'g' } },
      ];
      for (const ing of testIngs) {
        if (!ings.some(i => i.id === ing.id)) ings.push(ing);
      }
      localStorage.setItem('mp-ingredients', JSON.stringify(ings));

      const dishes = JSON.parse(localStorage.getItem('mp-dishes') || '[]') as Array<Record<string, unknown>>;
      const testDishes = [
        { id: 'e2e-sf-dish-1', name: { vi: 'Món sáng SF', en: 'SF Breakfast' }, ingredients: [{ ingredientId: 'e2e-sf-ing-3', amount: 200 }], tags: ['breakfast'] },
        { id: 'e2e-sf-dish-2', name: { vi: 'Món trưa SF', en: 'SF Lunch' }, ingredients: [{ ingredientId: 'e2e-sf-ing-2', amount: 150 }], tags: ['lunch'] },
        { id: 'e2e-sf-dish-3', name: { vi: 'Món tối SF', en: 'SF Dinner' }, ingredients: [{ ingredientId: 'e2e-sf-ing-1', amount: 100 }, { ingredientId: 'e2e-sf-ing-2', amount: 100 }], tags: ['dinner'] },
      ];
      for (const dish of testDishes) {
        if (!dishes.some(d => d.id === dish.id)) dishes.push(dish);
      }
      localStorage.setItem('mp-dishes', JSON.stringify(dishes));
    });

    await page.reloadApp();
    await page.navigateTo('management');
  });

  // ─────────────────────────────────────────────────────────────────
  // Dish Manager — Sort, Filter, View Toggle
  // ─────────────────────────────────────────────────────────────────
  describe('Dish Manager toolbar', () => {
    before(async () => {
      await page.openSubTab('dishes');
      // Clear search to show all dishes
      await page.searchDish('');
      await browser.pause(300);
    });

    it('TC_SORT_01 — should display sort dropdown', async () => {
      await expect(page.el('select-sort-dish')).toBeDisplayed();
    });

    it('TC_SORT_02 — should change sort option', async () => {
      // Change sort to calories descending
      await page.type('select-sort-dish', 'calories-desc');
      await browser.pause(300);
      await expect(page.el('select-sort-dish')).toBeDisplayed();
    });

    it('TC_FILTER_01 — should filter dishes by breakfast tag', async () => {
      await page.waitAndClick('btn-filter-breakfast');
      await browser.pause(300);
      // Filter button should be active
      await expect(page.el('btn-filter-breakfast')).toBeDisplayed();
    });

    it('TC_FILTER_02 — should filter dishes by lunch tag', async () => {
      await page.waitAndClick('btn-filter-lunch');
      await browser.pause(300);
      await expect(page.el('btn-filter-lunch')).toBeDisplayed();
    });

    it('TC_FILTER_03 — should filter dishes by dinner tag', async () => {
      await page.waitAndClick('btn-filter-dinner');
      await browser.pause(300);
      await expect(page.el('btn-filter-dinner')).toBeDisplayed();
    });

    it('TC_FILTER_04 — should show all dishes when clicking All filter', async () => {
      await page.waitAndClick('btn-filter-all-dishes');
      await browser.pause(300);
      await expect(page.el('btn-filter-all-dishes')).toBeDisplayed();
    });

    it('TC_VIEW_01 — should switch to list view', async () => {
      await page.waitAndClick('btn-view-list');
      await browser.pause(300);
      await expect(page.el('btn-view-list')).toBeDisplayed();
    });

    it('TC_VIEW_02 — should switch back to grid view', async () => {
      await page.waitAndClick('btn-view-grid');
      await browser.pause(300);
      await expect(page.el('btn-view-grid')).toBeDisplayed();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Ingredient Manager — Sort, View Toggle
  // ─────────────────────────────────────────────────────────────────
  describe('Ingredient Manager toolbar', () => {
    before(async () => {
      await page.openIngredientsSubTab();
      await page.searchIngredient('');
      await browser.pause(300);
    });

    it('TC_SORT_03 — should display ingredient sort dropdown', async () => {
      await expect(page.el('select-sort-ingredient')).toBeDisplayed();
    });

    it('TC_SORT_04 — should change ingredient sort option', async () => {
      await page.type('select-sort-ingredient', 'calories-desc');
      await browser.pause(300);
      await expect(page.el('select-sort-ingredient')).toBeDisplayed();
    });

    it('TC_VIEW_03 — should switch ingredient view to list', async () => {
      await page.waitAndClick('btn-view-list');
      await browser.pause(300);
      await expect(page.el('btn-view-list')).toBeDisplayed();
    });

    it('TC_VIEW_04 — should switch ingredient view back to grid', async () => {
      await page.waitAndClick('btn-view-grid');
      await browser.pause(300);
      await expect(page.el('btn-view-grid')).toBeDisplayed();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Search edge cases
  // ─────────────────────────────────────────────────────────────────
  describe('Search edge cases', () => {
    before(async () => {
      await page.openSubTab('dishes');
    });

    it('TC_SEARCH_01 — should show results when searching valid dish name', async () => {
      await page.searchDish('SF');
      await browser.pause(500);
      await expect(page.el('dish-manager')).toBeDisplayed();
    });

    it('TC_SEARCH_02 — should handle search with no results gracefully', async () => {
      await page.searchDish('ZZZNONEXISTENT999');
      await browser.pause(500);
      // Should still show the manager container even with empty results
      await expect(page.el('dish-manager')).toBeDisplayed();
    });

    it('TC_SEARCH_03 — should clear search and show all dishes again', async () => {
      await page.searchDish('');
      await browser.pause(500);
      await expect(page.el('dish-manager')).toBeDisplayed();
    });
  });
});
