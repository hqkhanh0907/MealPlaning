import { SettingsPage } from '../pages/SettingsPage';

describe('Settings — theme switching', () => {
  const page = new SettingsPage();

  before(async () => {
    await page.switchToWebview();
    await page.openSettings();
  });

  it('should display settings page with search field', async () => {
    await expect(page.el('settings-search')).toBeDisplayed();
  });

  it('should switch theme to dark', async () => {
    await page.switchTheme('dark');
    await expect(page.el('btn-theme-dark')).toBeDisplayed();
  });

  it('should switch theme to light', async () => {
    await page.switchTheme('light');
    await expect(page.el('btn-theme-light')).toBeDisplayed();
  });

  it('should switch theme to system', async () => {
    await page.switchTheme('system');
    await expect(page.el('btn-theme-system')).toBeDisplayed();
  });
});
