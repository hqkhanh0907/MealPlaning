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

  describe('Validation', () => {
    before(async () => {
      // Close any stale dish modal (e.g. left open by a previous failed save) so we
      // start with a fresh, empty form. If the modal is NOT open this is a no-op.
      await page.closeDishModal();
      await page.tapAddDish();
      await expect(page.el('input-dish-name')).toBeDisplayed();
    });

    it('should show name error when submitting empty dish name', async () => {
      await page.saveDishWithoutWait();
      await expect(page.el('error-dish-name')).toBeDisplayed();
    });

    it('should show ingredients error when no ingredient selected on submit', async () => {
      await page.fillDishName('Dish val test');
      await page.toggleTag('lunch');
      await page.saveDishWithoutWait();
      await expect(page.el('error-dish-ingredients')).toBeDisplayed();
    });

    it('should clear name error when user starts typing', async () => {
      // Name error is visible; start typing to dismiss it
      await page.fillDishName('A');
      // After typing, the error element should no longer be in DOM
      await expect(page.el('error-dish-name')).not.toBeDisplayed();
    });
  });
});
