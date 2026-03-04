import { ManagementPage } from '../pages/ManagementPage';

describe('Ingredient CRUD', () => {
  const page = new ManagementPage();

  before(async () => {
    await page.switchToWebview();
    await page.navigateTo('management');
    await page.openIngredientsSubTab();
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

  describe('Validation', () => {
    before(async () => {
      await page.tapAddIngredient();
      await expect(page.el('input-ing-name')).toBeDisplayed();
    });

    it('should show error when submitting with empty name', async () => {
      await page.saveIngredientWithoutWait();
      await expect(page.el('error-ing-name')).toBeDisplayed();
    });

    it('should show per-field error when calories field is cleared on submit', async () => {
      await page.fillIngName('Test vali');
      await page.fillIngUnit('g');
      await page.clearIngNutrition('calories');
      await page.saveIngredientWithoutWait();
      await expect(page.el('error-ing-calories')).toBeDisplayed();
    });

    it('should show per-field error when calories is negative on submit', async () => {
      await page.fillIngNutrition('calories', '-10');
      await page.saveIngredientWithoutWait();
      await expect(page.el('error-ing-calories')).toBeDisplayed();
    });

    it('should allow entering zero in nutrition field', async () => {
      await page.fillIngNutrition('calories', '0');
      await expect(page.el('input-ing-calories')).toBeDisplayed();
    });
  });
});
