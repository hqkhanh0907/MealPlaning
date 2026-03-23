import { BasePage } from './BasePage';

type ExecutableBrowser = typeof browser & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: <T>(fn: () => T) => Promise<T>;
};

// reusable union for meal type names used in tests
export type MealTypeName = 'breakfast' | 'lunch' | 'dinner';

export class CalendarPage extends BasePage {
  /** Switch to the "Bữa ăn" (meals) sub-tab on mobile. */
  async switchToMealsSubTab() {
    const visible = await this.isDisplayed('subtab-meals');
    if (visible) {
      await this.waitAndClick('subtab-meals');
      await browser.pause(300);
    }
  }

  /** Switch to the "Dinh dưỡng" (nutrition) sub-tab on mobile. */
  async switchToNutritionSubTab() {
    const visible = await this.isDisplayed('subtab-nutrition');
    if (visible) {
      await this.waitAndClick('subtab-nutrition');
      await browser.pause(300);
    }
  }

  /** Tap the Plan Meal button — tries section header first, then empty state. */
  async tapPlanMeal() {
    const sectionBtn = await this.isDisplayed('btn-plan-meal-section');
    if (sectionBtn) {
      await this.waitAndClick('btn-plan-meal-section');
    } else {
      await this.waitAndClick('btn-plan-meal-empty');
    }
  }

  /** After opening MealPlannerModal, the modal has internal tabs for meal types.
   *  These tabs don't have data-testid, so we can't click them via testid.
   *  The modal opens with the first empty slot selected. */
  async selectMealType(_type: MealTypeName) {
    // MealPlannerModal opens directly to the correct tab now.
    // No separate type selection step needed.
    await browser.pause(300);
  }

  /** Convenience: open planning UI (MealPlannerModal opens directly). */
  async openPlanning(_type: MealTypeName = 'breakfast') {
    await this.tapPlanMeal();
    await browser.pause(500);
  }

  async tapAISuggest() {
    await this.waitAndClick('btn-ai-suggest');
  }

  async tapToday() {
    await this.waitAndClick('btn-today');
  }

  async tapPrevDate() {
    await this.waitAndClick('btn-prev-date');
  }

  async tapNextDate() {
    await this.waitAndClick('btn-next-date');
  }

  getMealCard(type: 'breakfast' | 'lunch' | 'dinner') {
    return this.el(`meal-slot-${type}`);
  }

  async searchPlan(query: string) {
    await this.type('input-search-plan', query);
  }

  async confirmPlan() {
    await this.waitAndClick('btn-confirm-plan');
  }

  /** Open the "More Actions" dropdown menu. */
  async openMoreActions() {
    await this.waitAndClick('btn-more-actions');
  }

  /** Tap "Clear Plan" button (inside the More Actions dropdown). */
  async tapClearPlan() {
    await this.openMoreActions();
    await this.waitAndClick('btn-clear-plan');
  }

  /** In the ClearPlanModal, choose a scope to clear (day / week / month). */
  async tapClearScope(scope: 'day' | 'week' | 'month') {
    await this.waitAndClick(`btn-clear-scope-${scope}`);
  }

  /** Confirm a destructive action via the shared ConfirmationModal. */
  async confirmAction() {
    await this.waitAndClick('btn-confirm-action');
  }

  /** Return the displayed total calories from the Summary component. */
  async getTotalCalories(): Promise<string> {
    await this.switchToNutritionSubTab();
    const elem = this.el('summary-total-calories');
    await elem.waitForDisplayed({ timeout: 5_000 });
    const text = await elem.getText();
    await this.switchToMealsSubTab();
    return text;
  }

  /** Inject a day plan into localStorage for the given date key (YYYY-MM-DD).
   *  Adds to (or replaces in) the mp-day-plans array.
   *  Pass `ingredients` and `dishes` arrays to also seed the library.
   */
  async injectTestData(opts: {
    dateKey: string;
    mealSlot?: 'breakfast' | 'lunch' | 'dinner';
    dishId?: string;
    // optional: pre-seed library with known ingredient and dish
    ingredientPayload?: Record<string, unknown>;
    dishPayload?: Record<string, unknown>;
  }) {
    const { dateKey, mealSlot = 'breakfast', dishId, ingredientPayload, dishPayload } = opts;
    await (browser as unknown as ExecutableBrowser).execute(
      (dk: string, slot: string, did: string | undefined, ing: string | null, dish: string | null) => {
        // Seed ingredient if provided
        if (ing) {
          const ings = JSON.parse(localStorage.getItem('mp-ingredients') || '[]') as Array<{ id: string }>;
          const ingObj = JSON.parse(ing) as { id: string };
          if (!ings.some((i) => i.id === ingObj.id)) ings.push(ingObj);
          localStorage.setItem('mp-ingredients', JSON.stringify(ings));
        }
        // Seed dish if provided
        if (dish) {
          const dishes = JSON.parse(localStorage.getItem('mp-dishes') || '[]') as Array<{ id: string }>;
          const dishObj = JSON.parse(dish) as { id: string };
          if (!dishes.some((d) => d.id === dishObj.id)) dishes.push(dishObj);
          localStorage.setItem('mp-dishes', JSON.stringify(dishes));
        }
        // Set day plan
        const plans = JSON.parse(localStorage.getItem('mp-day-plans') || '[]') as Array<{ date: string; breakfastDishIds: string[]; lunchDishIds: string[]; dinnerDishIds: string[] }>;
        // Determine which slot key to use
        let slotKey: 'breakfastDishIds' | 'lunchDishIds' | 'dinnerDishIds';
        if (slot === 'lunch') slotKey = 'lunchDishIds';
        else if (slot === 'dinner') slotKey = 'dinnerDishIds';
        else slotKey = 'breakfastDishIds';
        const planEntry = {
          date: dk,
          breakfastDishIds: [] as string[],
          lunchDishIds: [] as string[],
          dinnerDishIds: [] as string[],
          [slotKey]: did ? [did] : ['placeholder-dish-id'],
        };
        const idx = plans.findIndex((p) => p.date === dk);
        if (idx === -1) plans.push(planEntry);
        else plans[idx] = planEntry;
        localStorage.setItem('mp-day-plans', JSON.stringify(plans));
      },
      dateKey as unknown as string,
      mealSlot as unknown as string,
      (dishId ?? null) as unknown as string,
      ingredientPayload ? JSON.stringify(ingredientPayload) as unknown as string : null,
      dishPayload ? JSON.stringify(dishPayload) as unknown as string : null,
    );
  }

  /** Reload app page and switch back to webview context. */
  async reloadApp() {
    await (browser as unknown as ExecutableBrowser).execute(() => { location.reload(); });
    await browser.pause(2_000);
    await this.switchToWebview();
  }
}
