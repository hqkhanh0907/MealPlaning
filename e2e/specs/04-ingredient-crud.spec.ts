import { ManagementPage } from '../pages/ManagementPage';

describe('Ingredient CRUD', () => {
  const page = new ManagementPage();

  before(async () => {
    await page.switchToWebview();
    await page.navigateTo('management');
  });

  it('should open add ingredient modal', async () => {
    await page.tapAddIngredient();
    await expect(page.el('input-ing-name')).toBeDisplayed();
  });

  it('should fill ingredient name and unit', async () => {
    await page.fillIngName('Gạo test');
    await page.fillIngUnit('g');
  });

  it('should save new ingredient', async () => {
    await page.saveIngredient();
  });

  it('should search for the created ingredient', async () => {
    await page.searchIngredient('Gạo test');
  });
});
