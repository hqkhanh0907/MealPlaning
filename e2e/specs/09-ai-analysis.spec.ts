import assert from 'node:assert';
import { BasePage } from '../pages/BasePage';
import { ManagementPage } from '../pages/ManagementPage';

describe('AI Analysis — navigation (placeholder)', () => {
  const page = new BasePage();

  before(async () => {
    await page.switchToWebview();
  });

  it('should navigate to AI analysis tab', async () => {
    await page.navigateTo('ai-analysis');
    await expect(page.el('nav-ai-analysis')).toBeDisplayed();
  });

  // Note: Full AI analysis E2E tests require mocking the Gemini API
  // or providing a test image. These are placeholder tests for now.

  // ─────────────────────────────────────────────────────────────────
  // TC_AI_04 — btn-ai-search enabled when name + unit are filled
  // ─────────────────────────────────────────────────────────────────
  describe('AI ingredient lookup button (TC_AI_04)', () => {
    const mgmtPage = new ManagementPage();

    before(async () => {
      await mgmtPage.navigateTo('management');
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
});
