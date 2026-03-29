import assert from 'node:assert';
import { BasePage } from '../pages/BasePage';
import { ManagementPage } from '../pages/ManagementPage';

describe('AI Analysis — navigation and states', () => {
  const page = new BasePage();

  before(async () => {
    await page.switchToWebview();
  });

  it('TC_AI_01 — should navigate to AI analysis tab', async () => {
    await page.navigateTo('ai-analysis');
    await expect(page.el('nav-ai-analysis')).toBeDisplayed();
  });

  it('TC_AI_02 — should display AI image analyzer component', async () => {
    await expect(page.el('ai-image-analyzer')).toBeDisplayed();
  });

  it('TC_AI_03 — should display image capture component', async () => {
    await expect(page.el('image-capture')).toBeDisplayed();
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_AI_04 — btn-ai-search enabled when name + unit are filled
  // ─────────────────────────────────────────────────────────────────
  describe('AI ingredient lookup button (TC_AI_04)', () => {
    const mgmtPage = new ManagementPage();

    before(async () => {
      await mgmtPage.navigateTo('library');
      await mgmtPage.openIngredientsSubTab();
      await mgmtPage.tapAddIngredient();
      await expect(mgmtPage.el('input-ing-name')).toBeDisplayed();
    });

    after(async () => {
      await mgmtPage.closeIngredientModal();
    });

    it('TC_AI_04 — btn-ai-search should be enabled when name and unit are filled', async () => {
      await mgmtPage.fillIngName('Test AI ingredient');
      await mgmtPage.fillIngUnit('g');
      // After filling both name and unit, the AI search button should become enabled
      const aiBtn = mgmtPage.el('btn-ai-search');
      await aiBtn.waitForDisplayed({ timeout: 5_000 });
      const isEnabled = await aiBtn.isEnabled();
      assert.strictEqual(
        isEnabled,
        true,
        'btn-ai-search should be enabled when both name and unit are filled',
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_AI_05 — AI suggest button on calendar tab
  // ─────────────────────────────────────────────────────────────────
  describe('AI suggest button (TC_AI_05)', () => {
    before(async () => {
      await page.navigateTo('calendar');
    });

    it('TC_AI_05 — should display AI suggest button on calendar', async () => {
      const aiSuggestBtn = page.el('btn-ai-suggest');
      await aiSuggestBtn.waitForDisplayed({ timeout: 5_000 });
      const isDisplayed = await aiSuggestBtn.isDisplayed();
      assert.strictEqual(
        isDisplayed,
        true,
        'btn-ai-suggest should be visible on calendar tab',
      );
    });
  });
});
