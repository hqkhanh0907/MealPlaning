import assert from 'node:assert';
import { FitnessPage } from '../pages/FitnessPage';

describe('Fitness — basic navigation and sub-tabs', () => {
  const page = new FitnessPage();

  before(async () => {
    await page.switchToWebview();
    // Seed fitness store so the tab skips onboarding
    await page.injectTrainingProfile();
    await page.injectTrainingPlan();
    await page.reloadApp();
  });

  it('TC_FIT_01: should navigate to Fitness tab', async () => {
    await page.navigateToFitness();
    await expect(page.el('fitness-tab')).toBeDisplayed();
  });

  it('TC_FIT_02: should show training plan for current day', async () => {
    await page.navigateToFitness();
    await expect(page.el('training-plan-view')).toBeDisplayed();
    await expect(page.el('calendar-strip')).toBeDisplayed();
    // The today workout card or rest-day card should be visible
    const hasWorkout = await page.isDisplayed('today-workout-card');
    const hasRest = await page.isDisplayed('rest-day-card');
    assert.ok(hasWorkout || hasRest, 'Expected today-workout-card or rest-day-card to be visible');
  });

  it('TC_FIT_03: should switch between sub-tabs', async () => {
    await page.navigateToFitness();

    // Switch to Tiến trình (Progress)
    await page.switchToSubTab('progress');
    const progressVisible =
      (await page.isDisplayed('progress-subtab-content')) ||
      (await page.isDisplayed('progress-dashboard')) ||
      (await page.isDisplayed('progress-empty-state'));
    assert.ok(progressVisible, 'Progress sub-tab content should be visible');

    // Switch to Buổi tập (History)
    await page.switchToSubTab('history');
    const historyVisible =
      (await page.isDisplayed('history-subtab-content')) ||
      (await page.isDisplayed('workout-history')) ||
      (await page.isDisplayed('workout-history-empty'));
    assert.ok(historyVisible, 'History sub-tab content should be visible');

    // Switch back to Kế hoạch (Plan)
    await page.switchToSubTab('plan');
    await expect(page.el('plan-subtab-content')).toBeDisplayed();
  });

  it('TC_FIT_04: should display training profile section in settings', async () => {
    await page.navigateToTrainingProfileSettings();
    const displayed = await page.isDisplayed('settings-detail-layout');
    assert.ok(displayed, 'Settings detail layout should be visible for training profile');
    await page.tapTrainingProfileBack();
  });

  it('TC_FIT_05: should open training profile edit form', async () => {
    await page.navigateToTrainingProfileSettings();
    await page.tapEditTrainingProfile();
    await expect(page.el('training-profile-form')).toBeDisplayed();
    await page.tapCancelTrainingProfile();
    await page.tapTrainingProfileBack();
  });
});
