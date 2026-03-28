import assert from 'node:assert';
import { FitnessPage } from '../pages/FitnessPage';

describe('Fitness — cardio logging', () => {
  const page = new FitnessPage();

  before(async () => {
    await page.switchToWebview();
    await page.injectTrainingProfile();
    await page.injectTrainingPlan();
    await page.reloadApp();
    await page.navigateToFitness();
  });

  it('TC_CAR_01: should open cardio logger', async () => {
    await page.switchToSubTab('plan');

    // On a rest day or any day, the "quick-log-cardio" button appears
    const hasQuickCardio = await page.isDisplayed('quick-log-cardio');

    if (hasQuickCardio) {
      await page.tapQuickLogCardio();
    }

    await expect(page.el('cardio-logger')).toBeDisplayed();
    await expect(page.el('cardio-header')).toBeDisplayed();
    await expect(page.el('elapsed-timer')).toBeDisplayed();
    await expect(page.el('cardio-type-selector')).toBeDisplayed();
  });

  it('TC_CAR_02: should select cardio type', async () => {
    // Running should be the default, select cycling
    await page.selectCardioType('cycling');
    await browser.pause(300);

    // Distance section should appear for cycling (distance cardio type)
    await expect(page.el('distance-section')).toBeDisplayed();

    // Switch to HIIT (non-distance type)
    await page.selectCardioType('hiit');
    await browser.pause(300);

    // Distance section should not be visible for HIIT
    const distanceVisible = await page.isDisplayed('distance-section');
    assert.strictEqual(distanceVisible, false, 'Distance section should not be visible for HIIT');

    // Switch back to running for the rest of tests
    await page.selectCardioType('running');
    await browser.pause(300);
  });

  it('TC_CAR_03: should enter duration and distance', async () => {
    // Switch to manual mode for duration input
    await page.tapManualMode();
    await expect(page.el('manual-panel')).toBeDisplayed();

    // Enter duration in minutes
    await page.typeManualDuration('30');

    // Enter distance (running is a distance cardio type)
    const hasDistance = await page.isDisplayed('distance-section');
    if (hasDistance) {
      await page.typeDistance('5.5');
    }

    // Enter heart rate
    await page.typeHeartRate('145');

    // Select intensity
    await page.selectIntensity('moderate');
    await expect(page.el('intensity-selector')).toBeDisplayed();

    // Verify calorie preview updates
    await expect(page.el('calorie-preview')).toBeDisplayed();
    await expect(page.el('calorie-value')).toBeDisplayed();
  });

  it('TC_CAR_04: should save cardio session', async () => {
    // Tap save button at the bottom
    await page.tapSaveCardio();
    await browser.pause(500);

    // After saving, the logger should close and return to fitness tab
    const loggerGone = !(await page.isDisplayed('cardio-logger'));
    const fitnessVisible = await page.isDisplayed('fitness-tab');
    assert.ok(loggerGone || fitnessVisible, 'Cardio logger should close after saving');
  });
});
