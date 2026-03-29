import assert from 'node:assert';
import { ManagementPage } from '../pages/ManagementPage';

type ExecutableBrowser = typeof browser & {
  execute: <T>(fn: () => T) => Promise<T>;
};

describe('Ingredient CRUD', () => {
  const page = new ManagementPage();

  before(async () => {
    await page.switchToWebview();
    await page.navigateTo('library');
    await page.openIngredientsSubTab();
  });

  it('should open add ingredient modal', async () => {
    await page.tapAddIngredient();
    await expect(page.el('input-ing-name')).toBeDisplayed();
  });

  it('should fill ingredient name and unit', async () => {
    await page.fillIngName('Gạo test');
    await page.fillIngUnit('g');
  });

  it('should save new ingredient', async () => {
    await page.saveIngredient();
  });

  it('should search for the created ingredient', async () => {
    await page.searchIngredient('Gạo test');
  });

  describe('Validation', () => {
    before(async () => {
      await page.tapAddIngredient();
      await expect(page.el('input-ing-name')).toBeDisplayed();
    });

    after(async () => {
      // Close modal so subsequent describe blocks start with a clean UI.
      // Use JS click — WebDriver click may fail with "element not interactable"
      // on Chrome 91 if the button is partially obscured by soft keyboard.
      await (browser as unknown as ExecutableBrowser).execute(() => {
        const btn = document.querySelector('[data-testid="btn-close-ingredient"]') as HTMLElement | null;
        btn?.click();
      });
      await browser.pause(300);
      // Dismiss unsaved-changes dialog if it appears
      await (browser as unknown as ExecutableBrowser).execute(() => {
        const btn = document.querySelector('[data-testid="btn-discard-unsaved"]') as HTMLElement | null;
        btn?.click();
      });
      await browser.pause(300);
    });

    it('should show error when submitting with empty name', async () => {
      await page.saveIngredientWithoutWait();
      await expect(page.el('error-ing-name')).toBeDisplayed();
    });

    it('should show per-field error when calories field is cleared on submit', async () => {
      await page.fillIngName('Test vali');
      await page.fillIngUnit('g');
      await page.clearIngNutrition('calories');
      await page.saveIngredientWithoutWait();
      await expect(page.el('error-ing-calories')).toBeDisplayed();
    });

    it('should show per-field error when calories is negative on submit', async () => {
      await page.fillIngNutrition('calories', '-10');
      await page.saveIngredientWithoutWait();
      await expect(page.el('error-ing-calories')).toBeDisplayed();
    });

    it('should allow entering zero in nutrition field', async () => {
      await page.fillIngNutrition('calories', '0');
      await expect(page.el('input-ing-calories')).toBeDisplayed();
    });
  });

  /**
   * BUG-001 regression — scroll lock permanently applied after nested modal close.
   *
   * When IngredientEditModal (ModalBackdrop A) and UnsavedChangesDialog
   * (ModalBackdrop B) unmounted simultaneously, React's cleanup order caused
   * the inner backdrop to re-lock document.body after the outer backdrop had
   * already unlocked it.  Fixed with a module-level reference-counted lock.
   */
  describe('Scroll lock regression (nested modal close)', () => {
    before(async () => {
      await page.openIngredientsSubTab();
    });

    after(async () => {
      // Ensure ingredient modal is fully closed after this suite.
      await page.closeIngredientModal();
    });

    it('should not permanently lock body scroll after closing modal with unsaved changes via Discard', async () => {
      // Open modal and fill form so hasChanges() returns true.
      await page.tapAddIngredient();
      await expect(page.el('input-ing-name')).toBeDisplayed();
      await page.fillIngName('Scroll reg test');
      await page.fillIngUnit('g');

      // Closing with unsaved changes triggers UnsavedChangesDialog (nested ModalBackdrop).
      // closeIngredientModal() clicks ✕ then Discard — unmounts both backdrops simultaneously.
      await page.closeIngredientModal();

      // Assert document.body.style.position is '' (not 'fixed') — scroll is unlocked.
      const bodyPosition = await (browser as unknown as ExecutableBrowser).execute(
        () => document.body.style.position,
      );
      assert.strictEqual(bodyPosition, '', 'BUG-001 regression: body.style.position must be empty after nested modal close');

      // Assert document.body.style.overflow is '' (not 'hidden').
      const bodyOverflow = await (browser as unknown as ExecutableBrowser).execute(
        () => document.body.style.overflow,
      );
      assert.strictEqual(bodyOverflow, '', 'BUG-001 regression: body.style.overflow must be empty after nested modal close');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_LIB_02 — Edit ingredient  |  TC_LIB_03 — Delete ingredient
  // ─────────────────────────────────────────────────────────────────
  describe('Edit & Delete ingredient (TC_LIB_02, TC_LIB_03)', () => {
    let ingId: string | null = null;

    before(async () => {
      await page.openIngredientsSubTab();
      // Clear search so all ingredients are visible
      await page.searchIngredient('');
      await browser.pause(300);
      ingId = await page.getLastIngredientId();
    });

    it('TC_LIB_02 — should edit the last ingredient calories to 250', async () => {
      if (!ingId) { throw new Error('No ingredient found in localStorage to edit'); }
      await page.editIngredientById(ingId);
      await expect(page.el('input-ing-name')).toBeDisplayed();
      await page.fillIngNutrition('calories', '250');
      await page.saveIngredient();
    });

    it('TC_LIB_03 — should delete the last ingredient after confirmation', async () => {
      if (!ingId) { throw new Error('No ingredient found in localStorage to delete'); }
      await page.deleteIngredientById(ingId);
      await browser.pause(500);
      const stillExists = await page.isDisplayed(`btn-edit-ingredient-${ingId}`);
      assert.strictEqual(
        stillExists,
        false,
        `Ingredient ${ingId} should no longer appear in the list after deletion`,
      );
    });
  });
});
