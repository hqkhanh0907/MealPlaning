import { GroceryPage } from '../pages/GroceryPage';

describe('Grocery List — scope switching and copy', () => {
  const page = new GroceryPage();

  before(async () => {
    await page.switchToWebview();
    await page.navigateTo('grocery');
  });

  it('should switch to day scope', async () => {
    await page.selectScope('day');
    await expect(page.el('tab-grocery-day')).toBeDisplayed();
  });

  it('should switch to week scope', async () => {
    await page.selectScope('week');
    await expect(page.el('tab-grocery-week')).toBeDisplayed();
  });

  it('should switch to custom scope', async () => {
    await page.selectScope('custom');
    await expect(page.el('tab-grocery-custom')).toBeDisplayed();
  });

  it('should tap copy button', async () => {
    await page.tapCopy();
  });
});
