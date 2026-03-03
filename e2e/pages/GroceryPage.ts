import { BasePage } from './BasePage';

export class GroceryPage extends BasePage {
  async selectScope(scope: 'day' | 'week' | 'custom') {
    await this.waitAndClick(`tab-grocery-${scope}`);
  }

  async tapCopy() {
    await this.waitAndClick('btn-grocery-copy');
  }
}
