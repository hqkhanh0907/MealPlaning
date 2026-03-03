import { BasePage } from './BasePage';

export class ManagementPage extends BasePage {
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

  async saveIngredient() {
    await this.waitAndClick('btn-save-ingredient');
  }
}
