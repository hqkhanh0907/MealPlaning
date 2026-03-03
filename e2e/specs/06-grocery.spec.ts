import { GroceryPage } from '../pages/GroceryPage';

describe('Grocery List — scope switching and copy', () => {
  const page = new GroceryPage();

  const hasEmptyState = async () => page.isDisplayed('grocery-empty-state');

  before(async () => {
    await page.switchToWebview();
    await page.navigateTo('grocery');
  });

  it('should show empty state or day scope tab', async () => {
    if (await hasEmptyState()) {
      await expect(page.el('grocery-empty-state')).toBeDisplayed();
      return;
    }

    await expect(page.el('tab-grocery-day')).toBeDisplayed();
  });

  it('should switch to day scope', async () => {
    if (await hasEmptyState()) return;

    await page.selectScope('day');
    await expect(page.el('tab-grocery-day')).toBeDisplayed();
  });

  it('should switch to week scope', async () => {
    if (await hasEmptyState()) return;

    await page.selectScope('week');
    await expect(page.el('tab-grocery-week')).toBeDisplayed();
  });

  it('should switch to custom scope', async () => {
    if (await hasEmptyState()) return;

    await page.selectScope('custom');
    await expect(page.el('tab-grocery-custom')).toBeDisplayed();
  });

  it('should tap copy button', async () => {
    if (await hasEmptyState()) return;

    await page.tapCopy();
  });
});
