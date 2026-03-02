import { SettingsPage } from '../pages/SettingsPage';

describe('Data Backup — export and import', () => {
  const page = new SettingsPage();

  before(async () => {
    await page.switchToWebview();
    await page.navigateTo('settings');
  });

  it('should tap export data button', async () => {
    await page.tapExport();
    await expect(page.el('btn-export')).toBeDisplayed();
  });

  it('should display import button', async () => {
    await expect(page.el('btn-import')).toBeDisplayed();
  });
});
