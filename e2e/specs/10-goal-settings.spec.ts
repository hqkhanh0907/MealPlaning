import { BasePage } from '../pages/BasePage';

describe('Goal Settings — edit nutrition goals', () => {
  const page = new BasePage();

  before(async () => {
    await page.switchToWebview();
    await page.navigateTo('calendar');
  });

  it('should open goal settings modal', async () => {
    await page.waitAndClick('btn-edit-goals');
    await expect(page.el('input-goal-weight')).toBeDisplayed();
  });

  it('should edit weight goal', async () => {
    await page.type('input-goal-weight', '70');
  });

  it('should edit calories goal', async () => {
    await page.type('input-goal-calories', '2000');
  });

  it('should select protein preset 2', async () => {
    await page.waitAndClick('btn-preset-2');
  });

  it('should close goal settings', async () => {
    await page.waitAndClick('btn-goal-done');
  });
});
