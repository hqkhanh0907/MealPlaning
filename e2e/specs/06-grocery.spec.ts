import assert from 'node:assert';
import { CalendarPage } from '../pages/CalendarPage';
import { GroceryPage } from '../pages/GroceryPage';
import { localDateKey } from '../utils/dateKey';

type ExecutableBrowser = typeof browser & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: <T>(fn: () => T) => Promise<T>;
};

describe('Grocery List — scope switching and copy', () => {
  const page = new GroceryPage();

  const hasEmptyState = async () => page.isDisplayed('grocery-empty-state');

  before(async () => {
    await page.switchToWebview();
    // navigate deterministically to avoid landing on a stale tab state
    await page.navigateTo('calendar');
    await page.openGrocery();

    await browser.waitUntil(
      async () => (await page.isDisplayed('grocery-empty-state')) || (await page.isDisplayed('tab-grocery-day')),
      {
        timeout: 10_000,
        interval: 500,
        timeoutMsg: 'Grocery tab did not become visible in time',
      }
    );
  });

  it('should show empty state or day scope tab', async () => {
    if (await hasEmptyState()) {
      await expect(page.el('grocery-empty-state')).toBeDisplayed();
      return;
    }

    await expect(page.el('tab-grocery-day')).toBeDisplayed();
  });

  it('should switch to day scope', async () => {
    if (await hasEmptyState()) return;

    await page.selectScope('day');
    await expect(page.el('tab-grocery-day')).toBeDisplayed();
  });

  it('should switch to week scope', async () => {
    if (await hasEmptyState()) return;

    await page.selectScope('week');
    await expect(page.el('tab-grocery-week')).toBeDisplayed();
  });

  it('should switch to custom scope', async () => {
    if (await hasEmptyState()) return;

    await page.selectScope('custom');
    await expect(page.el('tab-grocery-custom')).toBeDisplayed();
  });

  it('should tap copy button', async () => {
    if (await hasEmptyState()) return;

    await page.tapCopy();
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_SHOP_02 — Mark grocery item as checked
  // ─────────────────────────────────────────────────────────────────
  describe('Grocery item check (TC_SHOP_02)', () => {
    const calPage = new CalendarPage();
    const SHOP_ING_ID = 'e2e-shop-ing-1';
    const todayKey = localDateKey();

    before(async () => {
      // Inject ingredient + dish + day plan for today
      await calPage.injectTestData({
        dateKey: todayKey,
        mealSlot: 'breakfast',
        dishId: 'e2e-shop-dish-1',
        ingredientPayload: {
          id: SHOP_ING_ID,
          name: { vi: 'Thực phẩm test shop', en: 'Test Shop Food' },
          caloriesPer100: 50,
          proteinPer100: 1,
          carbsPer100: 10,
          fatPer100: 0.2,
          fiberPer100: 0.1,
          unit: { vi: 'g', en: 'g' },
        },
        dishPayload: {
          id: 'e2e-shop-dish-1',
          name: { vi: 'Món test shop', en: 'Test Shop Dish' },
          ingredients: [{ ingredientId: SHOP_ING_ID, amount: 150 }],
          tags: ['breakfast'],
        },
      });
      // Grocery checked state is now in SQLite — no need to clear
      // localStorage (fresh SQLite on reload has no checked items)
      // Reload so React sees the new data
      await calPage.reloadApp();
      await page.navigateTo('calendar');
      await page.openGrocery();
      await page.selectScope('day');
      // Wait for the injected item to render
      await page.el(`grocery-item-${SHOP_ING_ID}`).waitForDisplayed({ timeout: 10_000 });
    });

    it('TC_SHOP_02 — should mark a grocery item as checked', async () => {
      await page.tapGroceryItem(SHOP_ING_ID);
      await browser.pause(300);
      // Grocery checked state is now stored in SQLite (not localStorage).
      // Verify via UI: checked items get 'line-through' styling.
      const isChecked = await (browser as unknown as ExecutableBrowser).execute((ingId: string) => {
        const item = document.querySelector(`[data-testid="grocery-item-${ingId}"]`);
        if (!item) return false;
        return item.innerHTML.includes('line-through');
      }, SHOP_ING_ID);
      assert.ok(
        isChecked,
        `Expected grocery item ${SHOP_ING_ID} to show checked (line-through) state after tapping`,
      );
    });
  });
});
