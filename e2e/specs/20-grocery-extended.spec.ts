import assert from 'node:assert';
import { GroceryPage } from '../pages/GroceryPage';

type ExecutableBrowser = typeof browser & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: <T>(fn: (...args: any[]) => T, ...args: unknown[]) => Promise<T>;
};

describe('Grocery Extended', () => {
  const page = new GroceryPage();
  const today = new Date().toISOString().split('T')[0];
  const ING_ID = 'e2e-gro-ext-ing';

  before(async () => {
    await page.switchToWebview();

    // Inject ingredient, dish and day plan
    await (browser as unknown as ExecutableBrowser).execute((ingId: string, dateKey: string) => {
      const ings = JSON.parse(localStorage.getItem('mp-ingredients') || '[]') as Array<{ id: string }>;
      if (!ings.some((i) => i.id === ingId)) {
        ings.push({
          id: ingId,
          name: { vi: 'NL Grocery Ext', en: 'Grocery Ext Ing' },
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
      if (!dishes.some((d) => d.id === 'e2e-gro-ext-dish')) {
        dishes.push({
          id: 'e2e-gro-ext-dish',
          name: { vi: 'Món Grocery Ext', en: 'Grocery Ext Dish' },
          tags: ['lunch'],
          ingredients: [{ ingredientId: ingId, amount: 200 }],
        });
        localStorage.setItem('mp-dishes', JSON.stringify(dishes));
      }

      const plans = JSON.parse(localStorage.getItem('mp-day-plans') || '[]') as Array<{ date: string }>;
      const existing = plans.find((p) => p.date === dateKey) as { meals: Record<string, string[]> } | undefined;
      if (existing) {
        if (!existing.meals.lunch) existing.meals.lunch = [];
        if (!existing.meals.lunch.includes('e2e-gro-ext-dish')) existing.meals.lunch.push('e2e-gro-ext-dish');
      } else {
        plans.push({ date: dateKey, meals: { breakfast: [], lunch: ['e2e-gro-ext-dish'], dinner: [] } });
      }
      localStorage.setItem('mp-day-plans', JSON.stringify(plans));

      // Clear grocery checked state
      localStorage.removeItem('mp-grocery-checked');
    }, ING_ID, today);

    await (browser as unknown as ExecutableBrowser).execute(() => location.reload());
    await browser.pause(2000);
    await page.switchToWebview();
    await page.navigateTo('grocery');
    await browser.waitUntil(
      async () => (await page.isDisplayed('grocery-empty-state')) || (await page.isDisplayed('tab-grocery-day')),
      { timeout: 10_000, interval: 500 }
    );
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_GRO_EXT_01 — Scope switching shows correct items
  // ─────────────────────────────────────────────────────────────────
  it('TC_GRO_EXT_01 — day scope should show today\'s grocery items', async () => {
    await page.selectScope('day');
    await browser.pause(500);

    const hasItem = await page.isDisplayed(`grocery-item-${ING_ID}`);
    assert.ok(hasItem, 'Day scope should show the grocery item');
  });

  it('TC_GRO_EXT_02 — week scope should also show the item', async () => {
    await page.selectScope('week');
    await browser.pause(500);

    const hasItem = await page.isDisplayed(`grocery-item-${ING_ID}`);
    assert.ok(hasItem, 'Week scope should show the grocery item');
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_GRO_EXT_03 — Check/uncheck grocery item
  // ─────────────────────────────────────────────────────────────────
  it('TC_GRO_EXT_03 — checking item should apply strikethrough style', async () => {
    await page.selectScope('day');
    await browser.pause(300);
    await page.tapGroceryItem(ING_ID);
    await browser.pause(500);

    const hasStrike = await (browser as unknown as ExecutableBrowser).execute((id: string) => {
      const btn = document.querySelector(`[data-testid="grocery-item-${id}"]`);
      if (!btn) return false;
      const spans = btn.querySelectorAll('span');
      for (const s of spans) {
        if (s.className.includes('line-through')) return true;
      }
      return false;
    }, ING_ID);
    assert.ok(hasStrike, 'Checked item should have strikethrough style');
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_GRO_EXT_04 — All bought celebration
  // ─────────────────────────────────────────────────────────────────
  it('TC_GRO_EXT_04 — all items checked should show celebration banner', async () => {
    // All items should already be checked from previous test (only 1 item)
    const hasCelebration = await page.isDisplayed('grocery-all-bought');
    assert.ok(hasCelebration, 'All-bought celebration banner should be visible');
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_GRO_EXT_05 — Uncheck item removes celebration
  // ─────────────────────────────────────────────────────────────────
  it('TC_GRO_EXT_05 — unchecking item should remove celebration', async () => {
    await page.tapGroceryItem(ING_ID);
    await browser.pause(500);

    const hasCelebration = await page.isDisplayed('grocery-all-bought');
    assert.strictEqual(hasCelebration, false, 'Celebration should disappear after unchecking');
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_GRO_EXT_06 — Copy button exists and is clickable
  // ─────────────────────────────────────────────────────────────────
  it('TC_GRO_EXT_06 — copy button should be visible', async () => {
    await expect(page.el('btn-grocery-copy')).toBeDisplayed();
  });
});
