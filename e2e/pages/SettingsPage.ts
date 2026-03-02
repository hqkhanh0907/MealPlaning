import { BasePage } from './BasePage';

export class SettingsPage extends BasePage {
  async switchLang(code: 'vi' | 'en') {
    await this.waitAndClick(`btn-lang-${code}`);
  }

  async switchTheme(value: 'light' | 'dark' | 'system') {
    await this.waitAndClick(`btn-theme-${value}`);
  }

  async tapExport() {
    await this.waitAndClick('btn-export');
  }

  async tapImport() {
    await this.waitAndClick('btn-import');
  }
}
