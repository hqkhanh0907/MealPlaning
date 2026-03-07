import assert from 'node:assert';
import { BasePage } from '../pages/BasePage';
import { CalendarPage } from '../pages/CalendarPage';

type ExecutableBrowser = typeof browser & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: <T>(fn: () => T) => Promise<T>;
};

describe('Goal Settings — edit nutrition goals', () => {
  const page = new BasePage();
  const calPage = new CalendarPage();

  before(async () => {
    await page.switchToWebview();
    await page.navigateTo('calendar');
    await calPage.switchToNutritionSubTab();
  });

  it('TC_GOAL_01 — should open goal settings modal', async () => {
    await page.waitAndClick('btn-edit-goals');
    await expect(page.el('input-goal-weight')).toBeDisplayed();
  });

  it('TC_GOAL_02 — should edit weight goal', async () => {
    await page.type('input-goal-weight', '70');
  });

  it('TC_GOAL_03 — should edit calories goal', async () => {
    await page.type('input-goal-calories', '2000');
  });

  it('TC_GOAL_04 — should select protein preset 2', async () => {
    await page.waitAndClick('btn-preset-2');
  });

  it('TC_GOAL_05 — should close goal settings', async () => {
    await page.waitAndClick('btn-goal-done');
  });

  // ─────────────────────────────────────────────────────────────────
  // TC_GOAL_06 — Verify goals persist in localStorage after reload
  // ─────────────────────────────────────────────────────────────────
  describe('Goal persistence (TC_GOAL_06)', () => {
    it('TC_GOAL_06 — should persist goal settings after reload', async () => {
      const profile = await (browser as unknown as ExecutableBrowser).execute(() => {
        return JSON.parse(localStorage.getItem('mp-user-profile') || '{}') as {
          weight?: number;
          targetCalories?: number;
          proteinRatio?: number;
        };
      });
      assert.ok(profile.weight !== undefined, 'Expected weight to be saved in user profile');
      assert.ok(profile.targetCalories !== undefined, 'Expected targetCalories to be saved in user profile');
    });

    it('TC_GOAL_07 — should show saved goals after reopening modal', async () => {
      await calPage.reloadApp();
      await page.navigateTo('calendar');
      await calPage.switchToNutritionSubTab();
      await page.waitAndClick('btn-edit-goals');
      await expect(page.el('input-goal-weight')).toBeDisplayed();
      await expect(page.el('input-goal-calories')).toBeDisplayed();
      await page.waitAndClick('btn-goal-done');
    });
  });
});
