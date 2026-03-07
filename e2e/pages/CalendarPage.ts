import { BasePage } from './BasePage';

type ExecutableBrowser = typeof browser & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: <T>(fn: () => T) => Promise<T>;
};

// reusable union for meal type names used in tests
export type MealTypeName = 'breakfast' | 'lunch' | 'dinner';

export class CalendarPage extends BasePage {
  /** Tap the Plan Meal button — tries section header first, then empty state. */
  async tapPlanMeal() {
    const sectionBtn = await this.isDisplayed('btn-plan-meal-section');
    if (sectionBtn) {
      await this.waitAndClick('btn-plan-meal-section');
    } else {
      await this.waitAndClick('btn-plan-meal-empty');
    }
  }

  /** After opening TypeSelectionModal, choose a meal type by name. */
  async selectMealType(type: MealTypeName) {
    await this.waitAndClick(`btn-type-${type}`);
  }

  /** Convenience: open planning UI for a given type (defaults to breakfast). */
  async openPlanning(type: MealTypeName = 'breakfast') {
    await this.tapPlanMeal();
    await browser.pause(300);
    await this.selectMealType(type);
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
    return this.el(`meal-card-${type}`);
  }

  async searchPlan(query: string) {
    await this.type('input-search-plan', query);
  }

  async confirmPlan() {
    await this.waitAndClick('btn-confirm-plan');
  }

  /** Tap "Clear Plan" button (now inline, not in a dropdown). */
  async tapClearPlan() {
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
    const elem = this.el('summary-total-calories');
    await elem.waitForDisplayed({ timeout: 5_000 });
    return elem.getText();
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
