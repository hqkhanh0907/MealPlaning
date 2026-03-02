import { BasePage } from './BasePage';

export class AIPage extends BasePage {
  async tapConfirmSaveAnalyzed() {
    await this.waitAndClick('btn-confirm-save-analyzed');
  }
}
