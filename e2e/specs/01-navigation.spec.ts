import { BasePage } from '../pages/BasePage';

describe('Navigation — switch between tabs', () => {
  const page = new BasePage();

  before(async () => {
    await page.switchToWebview();
  });

  const tabs = ['calendar', 'management', 'ai-analysis', 'grocery', 'settings'];

  for (const tab of tabs) {
    it(`should navigate to ${tab} tab`, async () => {
      await page.navigateTo(tab);
      await expect(page.el(`nav-${tab}`)).toBeDisplayed();
    });
  }
});
