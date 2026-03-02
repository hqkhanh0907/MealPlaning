import { SettingsPage } from '../pages/SettingsPage';

describe('Settings — language and theme', () => {
  const page = new SettingsPage();

  before(async () => {
    await page.switchToWebview();
    await page.navigateTo('settings');
  });

  it('should switch language to English', async () => {
    await page.switchLang('en');
    await expect(page.el('btn-lang-en')).toBeDisplayed();
  });

  it('should switch language back to Vietnamese', async () => {
    await page.switchLang('vi');
    await expect(page.el('btn-lang-vi')).toBeDisplayed();
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
