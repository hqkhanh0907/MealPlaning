import { BasePage } from './BasePage';

type ExecutableBrowser = typeof browser & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: <T>(fn: (...args: any[]) => T, ...args: unknown[]) => Promise<T>;
};

export class FitnessPage extends BasePage {
  // ── Navigation ──────────────────────────────────────────────
  async navigateToFitness() {
    await this.navigateTo('fitness');
    await browser.pause(500);
  }

  // ── Sub-tabs (plan / history / progress) ────────────────────
  async switchToSubTab(tab: 'plan' | 'history' | 'progress') {
    await this.waitAndClick(`subtab-${tab}`);
    await browser.pause(300);
  }

  // ── Training Plan View ──────────────────────────────────────
  async selectDayPill(dayNum: number) {
    await this.waitAndClick(`day-pill-${dayNum}`);
    await browser.pause(300);
  }

  async tapStartWorkout() {
    await this.waitAndClick('start-workout-btn');
    await browser.pause(500);
  }

  async tapQuickLogCardio() {
    await this.waitAndClick('quick-log-cardio');
    await browser.pause(500);
  }

  async tapCreatePlan() {
    await this.waitAndClick('create-plan-btn');
    await browser.pause(500);
  }

  // ── Workout Logger ──────────────────────────────────────────
  async tapAddExercise() {
    await this.waitAndClick('add-exercise-button');
    await browser.pause(300);
  }

  async searchExercise(query: string) {
    await this.type('exercise-search-input', query);
    await browser.pause(300);
  }

  async selectExercise(exerciseId: string) {
    await this.waitAndClick(`exercise-item-${exerciseId}`);
    await browser.pause(300);
  }

  async tapAddCustomExercise() {
    await this.waitAndClick('add-custom-exercise');
    await browser.pause(300);
  }

  async fillCustomExercise(opts: { name: string; muscle?: string; category?: string }) {
    await this.type('custom-exercise-name', opts.name);
    if (opts.muscle) {
      await this.waitAndClick('custom-exercise-muscle');
      await browser.pause(200);
    }
    if (opts.category) {
      await this.waitAndClick('custom-exercise-category');
      await browser.pause(200);
    }
  }

  async saveCustomExercise() {
    await this.waitAndClick('save-custom-exercise');
    await browser.pause(300);
  }

  async adjustWeight(exerciseId: string, direction: 'plus' | 'minus') {
    await this.waitAndClick(`weight-${direction}-${exerciseId}`);
    await browser.pause(200);
  }

  async typeReps(exerciseId: string, reps: string) {
    await this.type(`reps-input-${exerciseId}`, reps);
  }

  async selectRpe(exerciseId: string, rpe: number) {
    await this.waitAndClick(`rpe-${rpe}-${exerciseId}`);
    await browser.pause(200);
  }

  async logSet(exerciseId: string) {
    await this.waitAndClick(`log-set-${exerciseId}`);
    await browser.pause(300);
  }

  async tapFinishWorkout() {
    await this.waitAndClick('finish-button');
    await browser.pause(300);
  }

  async tapBackButton() {
    await this.waitAndClick('back-button');
    await browser.pause(300);
  }

  // ── Cardio Logger ──────────────────────────────────────────
  async selectCardioType(type: string) {
    await this.waitAndClick(`cardio-type-${type}`);
    await browser.pause(200);
  }

  async tapManualMode() {
    await this.waitAndClick('manual-mode-button');
    await browser.pause(200);
  }

  async tapStopwatchMode() {
    await this.waitAndClick('stopwatch-mode-button');
    await browser.pause(200);
  }

  async typeManualDuration(minutes: string) {
    await this.type('manual-duration-input', minutes);
  }

  async typeDistance(km: string) {
    await this.type('distance-input', km);
  }

  async typeHeartRate(bpm: string) {
    await this.type('heart-rate-input', bpm);
  }

  async selectIntensity(level: 'low' | 'moderate' | 'high') {
    await this.waitAndClick(`intensity-${level}`);
    await browser.pause(200);
  }

  async tapSaveCardio() {
    await this.waitAndClick('save-button');
    await browser.pause(300);
  }

  async tapStartStopwatch() {
    await this.waitAndClick('start-button');
    await browser.pause(200);
  }

  async tapPauseStopwatch() {
    await this.waitAndClick('pause-button');
    await browser.pause(200);
  }

  async tapStopStopwatch() {
    await this.waitAndClick('stop-button');
    await browser.pause(200);
  }

  // ── Training Profile (Settings) ─────────────────────────────
  async navigateToTrainingProfileSettings() {
    await this.openSettings();
    await browser.pause(300);
    await this.waitAndClick('settings-nav-training-profile');
    await browser.pause(500);
  }

  async tapEditTrainingProfile() {
    await this.waitAndClick('settings-detail-edit');
    await browser.pause(300);
  }

  async tapSaveTrainingProfile() {
    await this.waitAndClick('settings-detail-save');
    await browser.pause(500);
  }

  async tapCancelTrainingProfile() {
    await this.waitAndClick('settings-detail-cancel');
    await browser.pause(300);
  }

  async tapTrainingProfileBack() {
    await this.waitAndClick('settings-detail-back');
    await browser.pause(300);
  }

  async selectGoal(goal: 'strength' | 'hypertrophy' | 'endurance' | 'general') {
    await this.waitAndClick(`goal-${goal}`);
    await browser.pause(200);
  }

  async selectDaysPerWeek(days: number) {
    await this.waitAndClick(`days-${days}`);
    await browser.pause(200);
  }

  async selectSessionDuration(minutes: number) {
    await this.waitAndClick(`duration-${minutes}`);
    await browser.pause(200);
  }

  async selectPriorityMuscle(muscle: string) {
    await this.waitAndClick(`priority-muscles-${muscle}`);
    await browser.pause(200);
  }

  async typeSleepHours(hours: string) {
    await this.type('sleep-hours-input', hours);
  }

  // ── Workout History ─────────────────────────────────────────
  async selectHistoryFilter(filter: 'all' | 'strength' | 'cardio') {
    await this.waitAndClick(`filter-${filter}`);
    await browser.pause(300);
  }

  // ── Data injection ──────────────────────────────────────────
  /** Inject a training profile into localStorage so the Fitness tab skips onboarding. */
  async injectTrainingProfile() {
    await (browser as unknown as ExecutableBrowser).execute(() => {
      const store = JSON.parse(localStorage.getItem('fitness-store') || '{}');
      store.state = store.state || {};
      store.state.isOnboarded = true;
      store.state.trainingProfile = {
        id: 'test-profile-1',
        trainingGoal: 'hypertrophy',
        trainingExperience: 'intermediate',
        daysPerWeek: 4,
        sessionDurationMin: 60,
        availableEquipment: ['barbell', 'dumbbell', 'machine'],
        injuryRestrictions: [],
        cardioSessionsWeek: 2,
        periodizationModel: 'undulating',
        planCycleWeeks: 8,
        priorityMuscles: ['chest', 'back'],
        avgSleepHours: 7,
        cardioTypePref: 'mixed',
        cardioDurationMin: 20,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('fitness-store', JSON.stringify(store));
    });
  }

  /** Inject a training plan so the Plan sub-tab shows calendar strip. */
  async injectTrainingPlan() {
    await (browser as unknown as ExecutableBrowser).execute(() => {
      const store = JSON.parse(localStorage.getItem('fitness-store') || '{}');
      store.state = store.state || {};
      const now = new Date();
      const planId = 'plan-test-1';
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 49);
      store.state.trainingPlans = [{
        id: planId,
        name: 'Test Plan',
        status: 'active',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        daysPerWeek: 4,
        periodizationModel: 'undulating',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }];
      const jsDay = now.getDay();
      const todayDow = jsDay === 0 ? 7 : jsDay;
      store.state.trainingPlanDays = [
        {
          id: 'day-1',
          planId,
          dayOfWeek: todayDow,
          workoutType: 'Upper Body',
          muscleGroups: 'chest,back,shoulders',
          exercises: JSON.stringify([
            { id: 'barbell-bench-press', sets: 4, repsMin: 8, repsMax: 12, restSeconds: 90 },
            { id: 'barbell-row', sets: 4, repsMin: 8, repsMax: 12, restSeconds: 90 },
          ]),
          updatedAt: now.toISOString(),
        },
        {
          id: 'day-2',
          planId,
          dayOfWeek: todayDow === 7 ? 1 : todayDow + 1,
          workoutType: 'Rest',
          muscleGroups: '',
          exercises: '',
          updatedAt: now.toISOString(),
        },
      ];
      localStorage.setItem('fitness-store', JSON.stringify(store));
    });
  }

  /** Inject a workout into history for testing the history view. */
  async injectWorkoutHistory() {
    await (browser as unknown as ExecutableBrowser).execute(() => {
      const store = JSON.parse(localStorage.getItem('fitness-store') || '{}');
      store.state = store.state || {};
      const today = new Date().toISOString().split('T')[0];
      const workoutId = 'workout-test-1';
      store.state.workouts = [{
        id: workoutId,
        date: today,
        name: 'Upper Body',
        durationMin: 45,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }];
      store.state.workoutSets = [{
        id: 'set-test-1',
        workoutId,
        exerciseId: 'barbell-bench-press',
        setNumber: 1,
        reps: 10,
        weightKg: 60,
        updatedAt: new Date().toISOString(),
      }];
      localStorage.setItem('fitness-store', JSON.stringify(store));
    });
  }

  /** Reload app and switch to webview context. */
  async reloadApp() {
    await (browser as unknown as ExecutableBrowser).execute(() => { location.reload(); });
    await browser.pause(2_000);
    await this.switchToWebview();
  }
}
