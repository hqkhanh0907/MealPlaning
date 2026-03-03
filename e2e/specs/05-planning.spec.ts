import { CalendarPage } from '../pages/CalendarPage';

describe('Planning — meal planning flow', () => {
  const page = new CalendarPage();

  before(async () => {
    await page.switchToWebview();
    await page.navigateTo('calendar');
  });

  it('should open planning modal', async () => {
    // the button opens a type-selection dialog first; choose breakfast by default
    await page.openPlanning('breakfast');
    await expect(page.el('input-search-plan')).toBeDisplayed();
  });

  it('should search for a dish in planning modal', async () => {
    await page.searchPlan('Test');
  });

  it('should confirm meal plan', async () => {
    await page.confirmPlan();
  });
});
