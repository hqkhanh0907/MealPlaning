import { ManagementPage } from '../pages/ManagementPage';

describe('Dish CRUD', () => {
  const page = new ManagementPage();

  before(async () => {
    await page.switchToWebview();
    await page.navigateTo('management');
  });

  it('should open add dish modal', async () => {
    await page.tapAddDish();
    await expect(page.el('input-dish-name')).toBeDisplayed();
  });

  it('should fill dish name', async () => {
    await page.fillDishName('Phở bò test');
  });

  it('should toggle breakfast tag', async () => {
    await page.toggleTag('breakfast');
    await expect(page.el('tag-breakfast')).toBeDisplayed();
  });

  it('should save new dish', async () => {
    await page.saveDish();
  });

  it('should search for the created dish', async () => {
    await page.searchDish('Phở bò test');
  });
});
