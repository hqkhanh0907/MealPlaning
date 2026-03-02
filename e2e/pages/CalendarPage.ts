import { BasePage } from './BasePage';

export class CalendarPage extends BasePage {
  async tapPlanMeal() {
    await this.waitAndClick('btn-plan-meal');
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
