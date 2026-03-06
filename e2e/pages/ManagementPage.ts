import { BasePage } from './BasePage';

export type ManagementSubTab = 'ingredients' | 'dishes';

type ExecutableBrowser = typeof browser & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: <T>(fn: () => T) => Promise<T>;
};

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
    // UnitSelector renders the <select> with data-testid="input-ing-unit-select"
    await this.type('input-ing-unit-select', unit);
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

  // ----- Edit / Delete by ID -----

  /** Click the edit button for an ingredient identified by its data ID. */
  async editIngredientById(id: string) {
    await this.waitAndClick(`btn-edit-ingredient-${id}`);
  }

  /** Click the delete button for an ingredient and confirm the action. */
  async deleteIngredientById(id: string) {
    await this.waitAndClick(`btn-delete-ingredient-${id}`);
    await this.waitAndClick('btn-confirm-action');
  }

  /** Click the edit button for a dish identified by its data ID. */
  async editDishById(id: string) {
    await this.waitAndClick(`btn-edit-dish-${id}`);
  }

  /** Click the delete button for a dish and confirm the action. */
  async deleteDishById(id: string) {
    await this.waitAndClick(`btn-delete-dish-${id}`);
    await this.waitAndClick('btn-confirm-action');
  }

  /** Return the ID of the most recently created ingredient from localStorage. */
  async getLastIngredientId(): Promise<string | null> {
    return (browser as unknown as ExecutableBrowser).execute(() => {
      const items = JSON.parse(localStorage.getItem('mp-ingredients') || '[]') as Array<{ id: string }>;
      return items.length > 0 ? items[items.length - 1].id : null;
    });
  }

  /** Return the ID of the most recently created dish from localStorage. */
  async getLastDishId(): Promise<string | null> {
    return (browser as unknown as ExecutableBrowser).execute(() => {
      const items = JSON.parse(localStorage.getItem('mp-dishes') || '[]') as Array<{ id: string }>;
      return items.length > 0 ? items[items.length - 1].id : null;
    });
  }

  /** Return the displayed dish total calories value from the live nutrition preview.
   *  Uses JS innerText to avoid Chrome 91 WebDriver getText() returning empty.
   */
  async getDishTotalCalories(): Promise<string> {
    const elem = this.el('dish-total-calories');
    await elem.waitForDisplayed({ timeout: 5_000 });
    // Poll until React has rendered a non-empty value
    await browser.waitUntil(
      async () => {
        const text = await (browser as unknown as { execute: (fn: () => string) => Promise<string> }).execute(() => {
          const el = document.querySelector('[data-testid="dish-total-calories"]');
          return el?.textContent ?? '';
        });
        return text !== '' && text !== '0';
      },
      { timeout: 5_000, interval: 300, timeoutMsg: 'dish-total-calories never showed a non-empty value' },
    );
    return (browser as unknown as { execute: (fn: () => string) => Promise<string> }).execute(() => {
      const el = document.querySelector('[data-testid="dish-total-calories"]');
      return el?.textContent ?? '';
    });
  }

  /** Type in the ingredient search box inside the DishEditModal. */
  async searchDishIngredient(query: string) {
    await this.type('input-dish-ingredient-search', query);
    // Allow the filtered result list to re-render
    await browser.pause(400);
  }

  /** Click the "Add" button for the given ingredient ID in the dish ingredient picker. */
  async addIngredientToDish(ingId: string) {
    await this.waitAndClick(`btn-add-ing-${ingId}`);
  }
}
