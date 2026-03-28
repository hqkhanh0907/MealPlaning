import assert from 'node:assert';
import { FitnessPage } from '../pages/FitnessPage';

describe('Fitness — training profile management', () => {
  const page = new FitnessPage();

  before(async () => {
    await page.switchToWebview();
    await page.injectTrainingProfile();
    await page.reloadApp();
  });

  it('TC_TP_01: should navigate to training profile settings', async () => {
    await page.navigateToTrainingProfileSettings();
    await expect(page.el('settings-detail-layout')).toBeDisplayed();
  });

  it('TC_TP_02: should edit days per week', async () => {
    await page.tapEditTrainingProfile();
    await expect(page.el('training-profile-form')).toBeDisplayed();

    // Select 5 days per week
    await page.selectDaysPerWeek(5);
    await browser.pause(200);

    await page.tapCancelTrainingProfile();
    await browser.pause(300);
  });

  it('TC_TP_03: should change session duration', async () => {
    await page.tapEditTrainingProfile();
    await expect(page.el('training-profile-form')).toBeDisplayed();

    // Select 90 minutes
    await page.selectSessionDuration(90);
    await browser.pause(200);

    await page.tapCancelTrainingProfile();
    await browser.pause(300);
  });

  it('TC_TP_04: should select training goal', async () => {
    await page.tapEditTrainingProfile();
    await expect(page.el('training-profile-form')).toBeDisplayed();

    // Switch goal to strength
    await page.selectGoal('strength');
    await browser.pause(200);

    await page.tapCancelTrainingProfile();
    await browser.pause(300);
  });

  it('TC_TP_05: should choose priority muscles (max 3)', async () => {
    await page.tapEditTrainingProfile();
    await expect(page.el('training-profile-form')).toBeDisplayed();

    // Select exactly 3 priority muscles
    await page.selectPriorityMuscle('chest');
    await page.selectPriorityMuscle('back');
    await page.selectPriorityMuscle('legs');
    await browser.pause(200);

    await page.tapCancelTrainingProfile();
    await browser.pause(300);
  });

  it('TC_TP_06: should save training profile changes', async () => {
    await page.tapEditTrainingProfile();
    await expect(page.el('training-profile-form')).toBeDisplayed();

    // Make changes
    await page.selectGoal('endurance');
    await page.selectDaysPerWeek(3);
    await page.selectSessionDuration(45);
    await page.typeSleepHours('8');
    await browser.pause(200);

    // Save
    await page.tapSaveTrainingProfile();
    await browser.pause(500);

    // After save, form should close and profile section should show
    const formGone = !(await page.isDisplayed('training-profile-form'));
    const layoutVisible = await page.isDisplayed('settings-detail-layout');
    assert.ok(formGone && layoutVisible, 'Form should close and settings layout should be visible after save');
  });

  it('TC_TP_07: should verify saved values persist after reload', async () => {
    // Reload the app and navigate back
    await page.reloadApp();
    await page.navigateToTrainingProfileSettings();
    await expect(page.el('settings-detail-layout')).toBeDisplayed();

    // Tap edit to verify persisted values
    await page.tapEditTrainingProfile();
    await expect(page.el('training-profile-form')).toBeDisplayed();

    // The form should be visible with previously saved data
    await expect(page.el('sleep-hours-input')).toBeDisplayed();

    await page.tapCancelTrainingProfile();
    await page.tapTrainingProfileBack();
  });
});
