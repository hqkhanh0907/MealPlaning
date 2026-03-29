import { BasePage } from '../pages/BasePage';

describe('Navigation — switch between tabs', () => {
  const page = new BasePage();

  before(async () => {
    await page.switchToWebview();
  });

  const tabs = ['calendar', 'library', 'ai-analysis', 'fitness', 'dashboard'];

  for (const tab of tabs) {
    it(`should navigate to ${tab} tab`, async () => {
      await page.navigateTo(tab);
      await expect(page.el(`nav-${tab}`)).toBeDisplayed();
    });
  }
});
