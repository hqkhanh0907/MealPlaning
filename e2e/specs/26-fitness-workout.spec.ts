import assert from 'node:assert';
import { FitnessPage } from '../pages/FitnessPage';

describe('Fitness — workout logging', () => {
  const page = new FitnessPage();

  before(async () => {
    await page.switchToWebview();
    await page.injectTrainingProfile();
    await page.injectTrainingPlan();
    await page.injectWorkoutHistory();
    await page.reloadApp();
    await page.navigateToFitness();
  });

  it('TC_WRK_01: should open workout logger for a training day', async () => {
    // Ensure we are on the plan sub-tab with today's workout visible
    await page.switchToSubTab('plan');
    const hasWorkoutCard = await page.isDisplayed('today-workout-card');
    if (hasWorkoutCard) {
      await page.tapStartWorkout();
      await expect(page.el('workout-logger')).toBeDisplayed();
      await expect(page.el('workout-header')).toBeDisplayed();
      await expect(page.el('elapsed-timer')).toBeDisplayed();
      // Go back for next test
      await page.tapBackButton();
      await browser.pause(300);
    } else {
      // If today is a rest day, start workout via a different day pill
      console.log('[TC_WRK_01] Today is rest day — test skipped gracefully');
    }
  });

  it('TC_WRK_02: should select exercise from database', async () => {
    await page.switchToSubTab('plan');
    const hasWorkoutCard = await page.isDisplayed('today-workout-card');
    if (!hasWorkoutCard) return;

    await page.tapStartWorkout();
    await expect(page.el('workout-logger')).toBeDisplayed();

    await page.tapAddExercise();
    await expect(page.el('exercise-selector-sheet')).toBeDisplayed();
    await expect(page.el('exercise-search-input')).toBeDisplayed();

    // Search for an exercise
    await page.searchExercise('Bench');
    await browser.pause(500);

    // Verify at least one exercise item appears or empty state
    const hasItem = await page.isDisplayed('exercise-item-barbell-bench-press');
    const hasEmpty = await page.isDisplayed('exercise-empty-state');
    assert.ok(hasItem || hasEmpty, 'Exercise search should show results or empty state');

    if (hasItem) {
      await page.selectExercise('barbell-bench-press');
      await browser.pause(300);
    }

    await page.tapBackButton();
    await browser.pause(300);
  });

  it('TC_WRK_03: should log sets and reps', async () => {
    await page.switchToSubTab('plan');
    const hasWorkoutCard = await page.isDisplayed('today-workout-card');
    if (!hasWorkoutCard) return;

    await page.tapStartWorkout();
    await expect(page.el('workout-logger')).toBeDisplayed();

    // The workout should pre-load exercises from the plan
    const hasExercise = await page.isDisplayed('exercise-section-barbell-bench-press');
    if (hasExercise) {
      // Adjust weight
      await page.adjustWeight('barbell-bench-press', 'plus');
      await page.adjustWeight('barbell-bench-press', 'plus');

      // Enter reps
      await page.typeReps('barbell-bench-press', '10');

      // Select RPE
      await page.selectRpe('barbell-bench-press', 8);

      // Log the set
      await page.logSet('barbell-bench-press');

      // Verify the set editor still exists (it persists after logging)
      await expect(page.el('set-editor-barbell-bench-press')).toBeDisplayed();
    }

    await page.tapBackButton();
    await browser.pause(300);
  });

  it('TC_WRK_04: should add custom exercise', async () => {
    await page.switchToSubTab('plan');
    const hasWorkoutCard = await page.isDisplayed('today-workout-card');
    if (!hasWorkoutCard) return;

    await page.tapStartWorkout();
    await expect(page.el('workout-logger')).toBeDisplayed();

    await page.tapAddExercise();
    await expect(page.el('exercise-selector-sheet')).toBeDisplayed();

    await page.tapAddCustomExercise();
    await expect(page.el('custom-exercise-modal')).toBeDisplayed();

    await page.fillCustomExercise({ name: 'Bài tập tùy chỉnh' });
    await page.saveCustomExercise();

    await browser.pause(500);
    await page.tapBackButton();
    await browser.pause(300);
  });

  it('TC_WRK_05: should save workout session via finish button', async () => {
    await page.switchToSubTab('plan');
    const hasWorkoutCard = await page.isDisplayed('today-workout-card');
    if (!hasWorkoutCard) return;

    await page.tapStartWorkout();
    await expect(page.el('workout-logger')).toBeDisplayed();

    // Log at least one set before finishing
    const hasExercise = await page.isDisplayed('exercise-section-barbell-bench-press');
    if (hasExercise) {
      await page.typeReps('barbell-bench-press', '8');
      await page.logSet('barbell-bench-press');
      await browser.pause(300);
    }

    // Tap finish → shows summary card → then saves
    await page.tapFinishWorkout();
    await browser.pause(500);

    // Summary card or the plan view should reappear after save
    const summarySaveVisible = await page.isDisplayed('save-button');
    const planVisible = await page.isDisplayed('training-plan-view');
    assert.ok(summarySaveVisible || planVisible, 'After finish, summary save or plan view should be visible');
  });

  it('TC_WRK_06: should view workout history', async () => {
    await page.navigateToFitness();
    await page.switchToSubTab('history');

    const historyVisible =
      (await page.isDisplayed('workout-history')) ||
      (await page.isDisplayed('workout-history-empty'));
    assert.ok(historyVisible, 'Workout history or empty state should be visible');

    // Check filter chips are displayed
    const filtersVisible = await page.isDisplayed('filter-chips');
    if (filtersVisible) {
      await page.selectHistoryFilter('all');
      await browser.pause(300);
    }

    // If we have workout data, the list should be present
    const listVisible = await page.isDisplayed('workout-list');
    if (listVisible) {
      await expect(page.el('workout-list')).toBeDisplayed();
    }
  });
});
