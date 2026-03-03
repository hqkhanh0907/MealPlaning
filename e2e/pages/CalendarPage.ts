import { BasePage } from './BasePage';


// reusable union for meal type names used in tests
export type MealTypeName = 'breakfast' | 'lunch' | 'dinner';

export class CalendarPage extends BasePage {
  async tapPlanMeal() {
    await this.waitAndClick('btn-plan-meal');
  }

  /** After opening type selection modal, choose a meal type by name. */
  async selectMealType(type: MealTypeName) {
    await this.waitAndClick(`btn-type-${type}`);
  }

  /** Convenience: open planning UI for a given type (defaults to breakfast). */
  async openPlanning(type: MealTypeName = 'breakfast') {
    await this.tapPlanMeal();
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
}
