import assert from 'node:assert';
import { AIPage } from '../pages/AIPage';
import { ManagementPage } from '../pages/ManagementPage';

type ExecutableBrowser = typeof browser & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: <T>(fn: (...args: any[]) => T, ...args: unknown[]) => Promise<T>;
};

describe('AI Analysis Extended', () => {
  const ai = new AIPage();
  const mgmt = new ManagementPage();

  before(async () => {
    await ai.switchToWebview();
    await ai.navigateTo('ai-analysis');
    await browser.pause(500);
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_AI_EXT_01 — AI tab components present
  // ─────────────────────────────────────────────────────────────────
  it('TC_AI_EXT_01 — AI image analyzer component should be displayed', async () => {
    await expect(ai.el('ai-image-analyzer')).toBeDisplayed();
  });

  it('TC_AI_EXT_02 — image capture area should be displayed', async () => {
    await expect(ai.el('image-capture')).toBeDisplayed();
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_AI_EXT_03 — Mock AI analysis result
  // ─────────────────────────────────────────────────────────────────
  describe('AI analysis result (TC_AI_EXT_03-05)', () => {
    before(async () => {
      // Inject a mock analysis result into the app state via custom event.
      // Note: mp-last-analysis localStorage key is no longer used (removed
      // during SQLite migration). The app now handles analysis results
      // directly via event dispatch.
      await (browser as unknown as ExecutableBrowser).execute(() => {
        const mockResult = {
          name: { vi: 'Phở bò', en: 'Beef pho' },
          description: { vi: 'Phở bò truyền thống', en: 'Traditional beef pho' },
          calories: 450,
          protein: 25,
          carbs: 50,
          fat: 15,
          ingredients: [
            { name: { vi: 'Bánh phở', en: 'Rice noodles' }, amount: 200, unit: { vi: 'g', en: 'g' }, caloriesPer100: 110, proteinPer100: 3, carbsPer100: 25, fatPer100: 0.2, fiberPer100: 0.5 },
            { name: { vi: 'Thịt bò', en: 'Beef' }, amount: 150, unit: { vi: 'g', en: 'g' }, caloriesPer100: 250, proteinPer100: 26, carbsPer100: 0, fatPer100: 15, fiberPer100: 0 },
          ],
        };

        // Dispatch custom event to notify React
        window.dispatchEvent(new CustomEvent('mp-analysis-complete', { detail: mockResult }));
      });
      await browser.pause(500);
    });

    it('TC_AI_EXT_03 — AI tab should show analysis components', async () => {
      // At minimum, the AI analyzer and capture areas should be present
      const analyzerVisible = await ai.isDisplayed('ai-image-analyzer');
      assert.ok(analyzerVisible, 'AI image analyzer should be visible');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_AI_EXT_04 — AI suggest button on calendar
  // ─────────────────────────────────────────────────────────────────
  describe('AI suggest on calendar (TC_AI_EXT_04)', () => {
    it('TC_AI_EXT_04 — AI suggest button should be present on calendar', async () => {
      await ai.navigateTo('calendar');
      await browser.pause(500);
      await expect(ai.el('btn-ai-suggest')).toBeDisplayed();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_AI_EXT_05 — AI search for ingredient nutrition
  // ─────────────────────────────────────────────────────────────────
  describe('AI ingredient search (TC_AI_EXT_05)', () => {
    before(async () => {
      await mgmt.navigateTo('management');
      await browser.pause(300);
      await mgmt.openIngredientsSubTab();
      await browser.pause(300);
    });

    it('TC_AI_EXT_05 — AI search button should be enabled when name and unit filled', async () => {
      await mgmt.tapAddIngredient();
      await browser.pause(300);
      await mgmt.fillIngName('Thịt gà');
      await mgmt.fillIngUnit('g');
      await browser.pause(300);

      const isEnabled = await (browser as unknown as ExecutableBrowser).execute(() => {
        const btn = document.querySelector('[data-testid="btn-ai-search"]') as HTMLButtonElement;
        return btn ? !btn.disabled : false;
      });
      assert.ok(isEnabled, 'AI search button should be enabled when name and unit are filled');

      // Close modal
      await (browser as unknown as ExecutableBrowser).execute(() => {
        const btn = document.querySelector('[data-testid="btn-close-ingredient"]') as HTMLElement;
        btn?.click();
      });
      await browser.pause(300);
      await (browser as unknown as ExecutableBrowser).execute(() => {
        const btn = document.querySelector('[data-testid="btn-discard-unsaved"]') as HTMLElement;
        btn?.click();
      });
      await browser.pause(300);
    });

    it('TC_AI_EXT_06 — AI search button disabled without name', async () => {
      await mgmt.tapAddIngredient();
      await browser.pause(300);
      // Don't fill name, just unit
      await mgmt.fillIngUnit('g');
      await browser.pause(300);

      const isDisabled = await (browser as unknown as ExecutableBrowser).execute(() => {
        const btn = document.querySelector('[data-testid="btn-ai-search"]') as HTMLButtonElement;
        return btn ? btn.disabled : true;
      });
      assert.ok(isDisabled, 'AI search button should be disabled without ingredient name');

      // Close modal
      await (browser as unknown as ExecutableBrowser).execute(() => {
        const btn = document.querySelector('[data-testid="btn-close-ingredient"]') as HTMLElement;
        btn?.click();
      });
      await browser.pause(300);
      await (browser as unknown as ExecutableBrowser).execute(() => {
        const btn = document.querySelector('[data-testid="btn-discard-unsaved"]') as HTMLElement;
        btn?.click();
      });
      await browser.pause(300);
    });
  });
});
