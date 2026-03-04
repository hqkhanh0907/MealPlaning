import { BasePage } from './BasePage';

export type ManagementSubTab = 'ingredients' | 'dishes';

export class ManagementPage extends BasePage {
  async openSubTab(tab: ManagementSubTab) {
    await this.waitAndClick(`tab-management-${tab}`);
  }

  async openIngredientsSubTab() {
    await this.openSubTab('ingredients');
  }

  // ----- Dish Management -----
  async searchDish(query: string) {
    await this.type('input-search-dish', query);
  }

  async tapAddDish() {
    await this.waitAndClick('btn-add-dish');
  }

  async fillDishName(name: string) {
    await this.type('input-dish-name', name);
  }

  async toggleTag(type: 'breakfast' | 'lunch' | 'dinner') {
    await this.waitAndClick(`tag-${type}`);
  }

  async saveDish() {
    await this.waitAndClick('btn-save-dish');
  }

  // ----- Ingredient Management -----
  async searchIngredient(query: string) {
    await this.type('input-search-ingredient', query);
  }

  async tapAddIngredient() {
    await this.waitAndClick('btn-add-ingredient');
  }

  async fillIngName(name: string) {
    await this.type('input-ing-name', name);
  }

  async fillIngUnit(unit: string) {
    await this.type('input-ing-unit', unit);
  }

  async fillIngNutrition(field: 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber', value: string) {
    await this.type(`input-ing-${field}`, value);
  }

  async clearIngNutrition(field: 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber') {
    // Use type() with empty string — triggers JS setValue which works in Capacitor webview
    await this.type(`input-ing-${field}`, '');
  }

  async saveIngredient() {
    await this.waitAndClick('btn-save-ingredient');
    // wait for modal to disappear by ensuring input-ing-name is no longer displayed
    const nameInput = this.el('input-ing-name');
    await nameInput.waitForDisplayed({ reverse: true, timeout: 10000 });
  }

  async saveIngredientWithoutWait() {
    await this.waitAndClick('btn-save-ingredient');
  }

  async getValidationError(testid: string): Promise<string> {
    const elem = this.el(testid);
    await elem.waitForDisplayed({ timeout: 5_000 });
    return elem.getText();
  }

  async isValidationErrorDisplayed(testid: string): Promise<boolean> {
    return this.isDisplayed(testid);
  }

  // ----- Dish amount helpers -----
  async fillDishAmount(ingredientId: string, value: string) {
    await this.type(`input-dish-amount-${ingredientId}`, value);
  }

  async saveDishWithoutWait() {
    await this.waitAndClick('btn-save-dish');
  }

  /** Close the dish edit modal if it is currently open (click X button).
   *  If the UnsavedChangesDialog pops up (because there were unsaved changes),
   *  click Discard so the modal fully closes and React state resets.
   */
  async closeDishModal() {
    const closeBtn = this.el('btn-close-dish');
    try {
      if (await closeBtn.isExisting() && await closeBtn.isDisplayed()) {
        await this.waitAndClick('btn-close-dish');
        // If there are unsaved changes an UnsavedChangesDialog will appear — click Discard
        await browser.pause(500);
        const discardBtn = this.el('btn-discard-unsaved');
        if (await discardBtn.isExisting() && await discardBtn.isDisplayed()) {
          await this.waitAndClick('btn-discard-unsaved');
        }
        // Wait for modal to fully disappear
        await (this.el('input-dish-name')).waitForDisplayed({ reverse: true, timeout: 5000 });
      }
    } catch {
      // Modal was not open — ignore
    }
  }

  /** Close the ingredient edit modal if it is currently open (click X button).
   *  Handles the UnsavedChangesDialog by clicking Discard when it appears.
   */
  async closeIngredientModal() {
    const closeBtn = this.el('btn-close-ingredient');
    try {
      if (await closeBtn.isExisting() && await closeBtn.isDisplayed()) {
        await this.waitAndClick('btn-close-ingredient');
        // If there are unsaved changes an UnsavedChangesDialog will appear — click Discard
        await browser.pause(500);
        const discardBtn = this.el('btn-discard-unsaved');
        if (await discardBtn.isExisting() && await discardBtn.isDisplayed()) {
          await this.waitAndClick('btn-discard-unsaved');
        }
        await (this.el('input-ing-name')).waitForDisplayed({ reverse: true, timeout: 5000 });
      }
    } catch {
      // Modal was not open — ignore
    }
  }
}
