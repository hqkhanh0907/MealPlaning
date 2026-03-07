import assert from 'node:assert';
import { ManagementPage } from '../pages/ManagementPage';

type ExecutableBrowser = typeof browser & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: <T>(fn: (...args: any[]) => T, ...args: unknown[]) => Promise<T>;
};

describe('Detail Modal Views', () => {
  const page = new ManagementPage();

  before(async () => {
    await page.switchToWebview();
    await page.navigateTo('management');
    await browser.pause(500);

    // Inject test ingredient and dish
    await (browser as unknown as ExecutableBrowser).execute(() => {
      const ings = JSON.parse(localStorage.getItem('mp-ingredients') || '[]') as Array<{ id: string }>;
      if (!ings.some((i) => i.id === 'e2e-detail-ing')) {
        ings.push({
          id: 'e2e-detail-ing',
          name: { vi: 'NL Detail Test', en: 'Detail Ingredient' },
          caloriesPer100: 200,
          proteinPer100: 10,
          carbsPer100: 30,
          fatPer100: 5,
          fiberPer100: 2,
          unit: { vi: 'g', en: 'g' },
        });
        localStorage.setItem('mp-ingredients', JSON.stringify(ings));
      }

      const dishes = JSON.parse(localStorage.getItem('mp-dishes') || '[]') as Array<{ id: string }>;
      if (!dishes.some((d) => d.id === 'e2e-detail-dish')) {
        dishes.push({
          id: 'e2e-detail-dish',
          name: { vi: 'Món Detail Test', en: 'Detail Dish' },
          tags: ['lunch'],
          ingredients: [{ ingredientId: 'e2e-detail-ing', amount: 150 }],
        });
        localStorage.setItem('mp-dishes', JSON.stringify(dishes));
      }
    });

    // Reload to pick up injected data
    await (browser as unknown as ExecutableBrowser).execute(() => location.reload());
    await browser.pause(2000);
    await page.navigateTo('management');
    await browser.pause(500);
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_DET_01 — Click dish name opens detail modal
  // ─────────────────────────────────────────────────────────────────
  it('TC_DET_01 — clicking dish name should open detail modal', async () => {
    // Search for our test dish
    await page.searchDish('Detail');
    await browser.pause(500);

    // Click dish name to open detail view
    await (browser as unknown as ExecutableBrowser).execute(() => {
      const items = document.querySelectorAll('[class*="font-bold"]');
      for (const el of items) {
        if (el.textContent?.includes('Detail') && el.tagName === 'BUTTON') {
          (el as HTMLElement).click();
          return;
        }
      }
    });
    await browser.pause(500);

    // Verify detail modal is open (has detail-modal testid)
    await expect(page.el('detail-modal')).toBeDisplayed();
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_DET_02 — Detail modal shows nutrition info
  // ─────────────────────────────────────────────────────────────────
  it('TC_DET_02 — detail modal should show dish nutrition', async () => {
    const hasNutrition = await (browser as unknown as ExecutableBrowser).execute(() => {
      const modal = document.querySelector('[data-testid="detail-modal"]');
      return modal?.textContent?.includes('kcal') || modal?.textContent?.includes('cal') || false;
    });
    assert.ok(hasNutrition, 'Detail modal should display nutrition information');
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_DET_03 — Edit button in detail modal opens edit modal
  // ─────────────────────────────────────────────────────────────────
  it('TC_DET_03 — edit button should open edit modal', async () => {
    await page.waitAndClick('btn-detail-edit');
    await browser.pause(500);

    // Verify edit modal opened (dish name input visible)
    await expect(page.el('input-dish-name')).toBeDisplayed();

    // Close edit modal
    await page.closeDishModal();
    await browser.pause(300);
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_DET_04 — Close detail modal
  // ─────────────────────────────────────────────────────────────────
  it('TC_DET_04 — close button should dismiss detail modal', async () => {
    // Re-open detail modal
    await (browser as unknown as ExecutableBrowser).execute(() => {
      const items = document.querySelectorAll('[class*="font-bold"]');
      for (const el of items) {
        if (el.textContent?.includes('Detail') && el.tagName === 'BUTTON') {
          (el as HTMLElement).click();
          return;
        }
      }
    });
    await browser.pause(500);
    await expect(page.el('detail-modal')).toBeDisplayed();

    // Close it
    await page.waitAndClick('btn-detail-close');
    await browser.pause(500);

    // Verify modal is gone
    const stillOpen = await page.isDisplayed('detail-modal');
    assert.strictEqual(stillOpen, false, 'Detail modal should be closed');
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_DET_05 — Ingredient detail view
  // ─────────────────────────────────────────────────────────────────
  describe('Ingredient detail (TC_DET_05)', () => {
    before(async () => {
      await page.openIngredientsSubTab();
      await browser.pause(300);
      await page.searchIngredient('Detail');
      await browser.pause(500);
    });

    it('TC_DET_05 — clicking ingredient should open detail with nutrition per 100g', async () => {
      await (browser as unknown as ExecutableBrowser).execute(() => {
        const items = document.querySelectorAll('[class*="font-bold"]');
        for (const el of items) {
          if (el.textContent?.includes('Detail') && el.tagName === 'BUTTON') {
            (el as HTMLElement).click();
            return;
          }
        }
      });
      await browser.pause(500);

      const hasNutrition = await (browser as unknown as ExecutableBrowser).execute(() => {
        const modal = document.querySelector('[data-testid="detail-modal"]');
        return modal?.textContent?.includes('200') || false;
      });
      assert.ok(hasNutrition, 'Ingredient detail should show 200 calories');

      // Close
      await page.waitAndClick('btn-detail-close');
      await browser.pause(300);
    });
  });
});
