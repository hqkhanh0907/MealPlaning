import { signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CalendarStore } from './calendar.store';
import { DashboardStore } from './dashboard.store';
import { NutritionStore } from './nutrition.store';
import { ProfileStore } from './profile.store';
import {
  UserProfileRepository,
  type WeightLogEntry,
} from '../repositories/user-profile.repository';
import { WorkoutRepository } from '../repositories/workout.repository';
import { DayPlanRepository } from '../repositories/day-plan.repository';
import { PhotoMealRepository } from '../repositories/photo-meal.repository';
import type { MealSlotWithDishes, PlannedDishWithEffective } from '../models/meal-plan.types';
import { buildDailyInsightPrompt } from '../services/ai/prompts/daily-insight.prompt';
import { buildTrainingPlanPrompt } from '../services/ai/prompts/training-plan.prompt';
import type { FitnessProgressSummary, WorkoutSessionDetail } from '../models/fitness.types';
import {
  NutritionQuery,
  type DayTotals,
  type NutritionTotals,
} from '../services/nutrition/nutrition-query';
import type { UserProfile } from '../models/user-profile.model';
import { FoodImageAi } from '../services/ai/food-image-ai';
import { InsightAi } from '../services/ai/insight-ai';
import { CameraCapture } from '../services/camera/camera-capture';
import type { KeyMetric } from '../utils/key-metric-router';
import { NetworkStore } from './network.store';

const ZERO_TOTALS: NutritionTotals = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
};

const PROFILE: UserProfile = {
  id: 'profile-1',
  height_cm: 170,
  weight_kg: 65,
  birth_date: `${new Date().getFullYear() - 30}-01-01`,
  gender: 'male',
  goal: 'maintain',
  fitness_level: 'beginner',
  activity_factor: 1.55,
  bmr: 1600,
  tdee: 2400,
  target_calories: 2000,
  target_protein: 120,
  target_carbs: null,
  target_fat: null,
  theme: 'light',
  notif_morning: 1,
  notif_lunch: 1,
  notif_evening: 1,
  notif_weekly: 1,
  onboarding_completed: 1,
  created_at: '2026-05-01T00:00:00',
  updated_at: null,
};

describe('DashboardStore', () => {
  let store: DashboardStore;
  let query: jasmine.SpyObj<NutritionQuery>;
  let dayPlanRepo: jasmine.SpyObj<DayPlanRepository>;
  let profileRepo: jasmine.SpyObj<UserProfileRepository>;
  let workoutRepo: jasmine.SpyObj<WorkoutRepository>;
  let insightAi: jasmine.SpyObj<InsightAi>;
  let foodImageAi: jasmine.SpyObj<FoodImageAi>;
  let cameraCapture: jasmine.SpyObj<CameraCapture>;
  let photoMeals: jasmine.SpyObj<PhotoMealRepository>;
  let onlineSignal: WritableSignal<boolean>;
  let profileSignal: WritableSignal<UserProfile | null>;
  let targetsSignal: WritableSignal<NutritionTotals>;
  let invalidationTick: WritableSignal<number>;

  beforeEach(async () => {
    profileSignal = signal<UserProfile | null>(PROFILE);
    targetsSignal = signal<NutritionTotals>({
      calories: 2000,
      protein: 120,
      carbs: 0,
      fat: 0,
      fiber: 25,
    });
    invalidationTick = signal(0);

    query = jasmine.createSpyObj<NutritionQuery>('NutritionQuery', [
      'dailyTotals',
      'loggedTotalsForDates',
    ]);
    query.dailyTotals.and.resolveTo({ ...ZERO_TOTALS });
    query.loggedTotalsForDates.and.resolveTo([]);
    dayPlanRepo = jasmine.createSpyObj<DayPlanRepository>('DayPlanRepository', ['findByDate']);
    dayPlanRepo.findByDate.and.resolveTo(null);

    profileRepo = jasmine.createSpyObj<UserProfileRepository>('UserProfileRepository', [
      'getLatestWeightLog',
      'getPreviousWeightLog',
    ]);
    profileRepo.getLatestWeightLog.and.resolveTo(null);
    profileRepo.getPreviousWeightLog.and.resolveTo(null);

    workoutRepo = jasmine.createSpyObj<WorkoutRepository>('WorkoutRepository', [
      'progressSummary',
      'recentSessions',
    ]);
    workoutRepo.progressSummary.and.resolveTo(progressSummary());
    workoutRepo.recentSessions.and.resolveTo([]);

    insightAi = jasmine.createSpyObj<InsightAi>('InsightAi', ['generateDailyInsight']);
    insightAi.generateDailyInsight.and.resolveTo({
      tone: 'success',
      title: 'Đúng nhịp',
      body: 'Protein và tập luyện đang ổn.',
      action: 'Giữ bữa tối nhẹ.',
    });
    foodImageAi = jasmine.createSpyObj<FoodImageAi>('FoodImageAi', ['analyzeMealPhoto']);
    foodImageAi.analyzeMealPhoto.and.resolveTo({
      overallConfidence: 'medium',
      imageQualityWarning: null,
      items: [
        {
          name: 'Cơm gà',
          estimatedGrams: 350,
          calories: 520,
          protein: 35,
          carbs: 62,
          fat: 14,
          fiber: 4,
          confidence: 'medium',
          warning: null,
        },
      ],
    });
    photoMeals = jasmine.createSpyObj<PhotoMealRepository>('PhotoMealRepository', ['save']);
    cameraCapture = jasmine.createSpyObj<CameraCapture>('CameraCapture', ['captureMealPhoto']);
    cameraCapture.captureMealPhoto.and.resolveTo({
      data: 'base64',
      mimeType: 'image/jpeg',
    });
    onlineSignal = signal(true);

    TestBed.configureTestingModule({
      providers: [
        DashboardStore,
        { provide: CalendarStore, useValue: { invalidationTick } },
        {
          provide: NutritionStore,
          useValue: { targets: targetsSignal, keyMetric: signal<KeyMetric>('calories') },
        },
        { provide: ProfileStore, useValue: { profile: profileSignal } },
        { provide: NetworkStore, useValue: { online: onlineSignal } },
        { provide: NutritionQuery, useValue: query },
        { provide: DayPlanRepository, useValue: dayPlanRepo },
        { provide: UserProfileRepository, useValue: profileRepo },
        { provide: WorkoutRepository, useValue: workoutRepo },
        { provide: InsightAi, useValue: insightAi },
        { provide: FoodImageAi, useValue: foodImageAi },
        { provide: CameraCapture, useValue: cameraCapture },
        { provide: PhotoMealRepository, useValue: photoMeals },
      ],
    });

    store = TestBed.inject(DashboardStore);
    TestBed.flushEffects();
    await settle();
    query.dailyTotals.calls.reset();
    query.loggedTotalsForDates.calls.reset();
    profileRepo.getLatestWeightLog.calls.reset();
    profileRepo.getPreviousWeightLog.calls.reset();
    workoutRepo.progressSummary.calls.reset();
    workoutRepo.recentSessions.calls.reset();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('refreshes real today and renders safe labels when targets are missing', async () => {
    targetsSignal.set({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
    query.dailyTotals.and.resolveTo({
      calories: 600,
      protein: 35,
      carbs: 70,
      fat: 16,
      fiber: 8,
    });

    await store.refresh(new Date('2026-05-10T08:00:00'));

    expect(query.dailyTotals).toHaveBeenCalledOnceWith('2026-05-10');
    expect(store.todayIso()).toBe('2026-05-10');
    expect(store.caloriePercent()).toBeNull();
    expect(store.caloriePercentLabel()).toBe('—');
    expect(store.macroRows().every((row) => row.percent === null)).toBeTrue();
    expect(store.macroRows().every((row) => row.percentLabel === '—')).toBeTrue();
  });

  it('computes nutrition streak from prior logged-only days, not today', async () => {
    query.loggedTotalsForDates.and.resolveTo([
      loggedDay('2026-05-09', 1600),
      loggedDay('2026-05-08', 2400),
      loggedDay('2026-05-07', 2600),
    ]);

    await store.refresh(new Date('2026-05-10T08:00:00'));

    const requestedDates = query.loggedTotalsForDates.calls.mostRecent().args[0];
    expect(requestedDates[0]).toBe('2026-05-09');
    expect(requestedDates).not.toContain('2026-05-10');
    expect(store.nutritionStreakDays()).toBe(2);
  });

  it('targets the first still-unlogged dish from today’s plan', async () => {
    const date = '2026-05-10';
    const now = new Date(`${date}T19:00:00`);
    const dish: PlannedDishWithEffective = {
      id: 'dish',
      meal_slot_id: 'lunch',
      dish_id: 'recipe',
      servings: 1,
      sort_order: 0,
      is_completed: 0,
      completed_at: null,
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
      fiber: null,
      created_at: date,
      dish_name: 'Cơm gà',
      effective_calories: 500,
      effective_protein: 30,
      effective_carbs: 60,
      effective_fat: 16,
      effective_fiber: 3,
    };
    const lunch: MealSlotWithDishes = {
      id: 'lunch',
      day_plan_id: 'plan',
      meal_type: 'lunch',
      position: 1,
      created_at: date,
      planned_dishes: [dish, { ...dish, id: 'soup', sort_order: 1 }],
    };
    dayPlanRepo.findByDate.and.resolveTo({
      id: 'plan',
      date,
      target_calories: 2000,
      target_protein: 120,
      created_at: date,
      updated_at: null,
      meal_slots: [
        {
          ...lunch,
          id: 'breakfast',
          meal_type: 'breakfast',
          position: 0,
          planned_dishes: [
            {
              ...dish,
              id: 'logged',
              meal_slot_id: 'breakfast',
              is_completed: 1,
              completed_at: date,
            },
          ],
        },
        lunch,
      ],
    });

    await store.refresh(now);
    expect(dayPlanRepo.findByDate).toHaveBeenCalledWith(date);
    expect(store.pendingMeal()).toEqual({ date, mealType: 'lunch', plannedDishId: dish.id });

    dayPlanRepo.findByDate.and.resolveTo(null);
    await store.refresh(now);
    expect(store.pendingMeal()).toBeNull();
  });

  it('clears loading after a failed refresh and recovers on retry', async () => {
    query.dailyTotals.and.rejectWith(new Error('Read failed'));

    await expectAsync(store.refresh()).toBeResolved();
    expect(store.loading()).toBeFalse();
    expect(store.refreshFailed()).toBeTrue();

    query.dailyTotals.and.resolveTo({ calories: 500, protein: 30, carbs: 40, fat: 15, fiber: 5 });
    await store.refresh();

    expect(store.refreshFailed()).toBeFalse();
    expect(store.roundedCalories()).toBe(500);
  });

  it('falls back to profile weight when weight_log is empty', async () => {
    profileRepo.getLatestWeightLog.and.resolveTo(null);

    await store.refresh(new Date('2026-05-10T08:00:00'));

    expect(store.weightSummary()).toEqual({
      currentKg: 65,
      source: 'profile',
      date: null,
      deltaKg: null,
    });
    expect(store.weightDisplay()).toBe('65 kg');
    expect(store.weightMeta()).toBe('Dữ liệu từ hồ sơ cá nhân');
  });

  it('uses latest and previous weight_log rows for weight delta', async () => {
    const latest: WeightLogEntry = {
      id: 'w2',
      weight_kg: 64.4,
      date: '2026-05-10',
      notes: null,
      created_at: '2026-05-10T06:00:00',
    };
    const previous: WeightLogEntry = {
      id: 'w1',
      weight_kg: 65.1,
      date: '2026-05-03',
      notes: null,
      created_at: '2026-05-03T06:00:00',
    };
    profileRepo.getLatestWeightLog.and.resolveTo(latest);
    profileRepo.getPreviousWeightLog.and.resolveTo(previous);

    await store.refresh(new Date('2026-05-10T08:00:00'));

    expect(profileRepo.getPreviousWeightLog).toHaveBeenCalledOnceWith('2026-05-10');
    expect(store.weightSummary()).toEqual({
      currentKg: 64.4,
      source: 'weight_log',
      date: '2026-05-10',
      deltaKg: -0.7,
    });
    expect(store.weightMeta()).toBe('-0,7 kg so với lần cân trước');
  });

  it('refreshes when calendar invalidation changes', async () => {
    invalidationTick.update((n) => n + 1);
    TestBed.flushEffects();
    await settle();

    expect(query.dailyTotals).toHaveBeenCalled();
  });

  it('shows an actionable warning insight when forecast calories exceed target', async () => {
    query.dailyTotals.and.resolveTo({
      calories: 2500,
      protein: 125,
      carbs: 300,
      fat: 80,
      fiber: 20,
    });

    await store.refresh(new Date('2026-05-10T08:00:00'));

    expect(store.insight()).toEqual(
      jasmine.objectContaining({
        tone: 'warning',
        title: 'Kế hoạch calo đang vượt mục tiêu',
        body: 'Các món theo lịch cả ngày tương ứng 125% mục tiêu kcal.',
        ctaRoute: '/tabs/calendar',
      }),
    );
  });

  it('renders real workout progress without placeholder copy', async () => {
    workoutRepo.progressSummary.and.resolveTo(
      progressSummary({
        currentWeekVolume: 5200,
        previousWeekVolume: 4500,
        workoutStreakWeeks: 3,
      }),
    );
    workoutRepo.recentSessions.and.resolveTo([
      workoutSession({
        date: '2026-05-09',
        total_volume: 5200,
      }),
    ]);

    await store.refresh(new Date('2026-05-10T08:00:00'));

    expect(workoutRepo.progressSummary).toHaveBeenCalledOnceWith(new Date('2026-05-10T08:00:00'));
    expect(store.workoutTitle()).toBe('Tuần này 5.200 kg khối lượng');
    expect(store.workoutBody()).toContain('Tăng 700 kg khối lượng');
    expect(store.workoutStreakDisplay()).toBe('3 tuần');
  });

  it('generates daily AI insight from dashboard state', async () => {
    query.dailyTotals.and.resolveTo({
      calories: 1600,
      protein: 100,
      carbs: 180,
      fat: 48,
      fiber: 18,
    });
    workoutRepo.progressSummary.and.resolveTo(
      progressSummary({ currentWeekVolume: 3200, workoutStreakWeeks: 2 }),
    );
    await store.refresh(new Date('2026-05-10T08:00:00'));

    await store.generateDailyAiInsight();

    expect(insightAi.generateDailyInsight).toHaveBeenCalledWith({
      date: '2026-05-10',
      level: 'beginner',
      totals: store.totals(),
      logged: store.loggedTotals(),
      targets: targetsSignal(),
      workoutVolumeKg: 3200,
      workoutStreakWeeks: 2,
    });
    expect(store.dailyAiInsight()?.title).toBe('Đúng nhịp');
  });

  it('discards a late insight when the logged meal changes, and expires a displayed insight', async () => {
    await store.refresh(new Date('2026-05-10T08:00:00'));
    await store.generateDailyAiInsight();
    store.loggedTotals.update((totals) => ({ ...totals, calories: 150 }));
    expect(store.dailyAiInsight()).toBeNull();
    const pending = store.generateDailyAiInsight();
    store.todayIso.set('2026-05-11');
    await pending;
    expect(store.dailyAiInsight()).toBeNull();
  });

  it('preserves fractional volume across weekly totals, last session and both AI prompts', async () => {
    workoutRepo.progressSummary.and.resolveTo(
      progressSummary({
        currentWeekVolume: 642.5,
        previousWeekVolume: 400,
        workoutStreakWeeks: 1,
      }),
    );
    workoutRepo.recentSessions.and.resolveTo([workoutSession({ total_volume: 642.5 })]);
    await store.refresh(new Date('2026-11-24T08:00:00'));
    expect(store.workoutTitle()).toContain('642,5 kg');
    expect(store.workoutBody()).toContain('242,5 kg');
    expect(store.workoutSummary().lastSessionLabel).toContain('642,5 kg');
    await store.generateDailyAiInsight();
    const input = insightAi.generateDailyInsight.calls.mostRecent().args[0];
    expect(input.workoutVolumeKg).toBe(642.5);
    expect(buildDailyInsightPrompt(input)).toContain('642,5 kg');
    expect(
      buildTrainingPlanPrompt({
        fitnessLevel: 'beginner',
        goal: 'maintain',
        exercises: [],
        weeklyVolumeKg: store.workoutSummary().currentWeekVolume,
        workoutStreakWeeks: 1,
      }),
    ).toContain('642,5 kg');
  });

  it('recognizes a completed workout with zero external volume this week', async () => {
    workoutRepo.progressSummary.and.resolveTo(
      progressSummary({ currentWeekVolume: 0, workoutStreakWeeks: 1 }),
    );
    workoutRepo.recentSessions.and.resolveTo([workoutSession({ total_volume: 0 })]);
    await store.refresh(new Date('2026-11-24T08:00:00'));
    expect(store.workoutTitle()).toBe('Đã tập trong tuần này');
  });

  it('captures and analyzes a meal photo only when online', async () => {
    const result = await store.analyzeMealPhoto();

    expect(cameraCapture.captureMealPhoto).toHaveBeenCalled();
    expect(foodImageAi.analyzeMealPhoto).toHaveBeenCalledWith(
      { data: 'base64', mimeType: 'image/jpeg' },
      'bữa ăn hôm nay',
    );
    expect(result.items[0].name).toBe('Cơm gà');

    onlineSignal.set(false);
    await expectAsync(store.analyzeMealPhoto()).toBeRejectedWithError(
      'DashboardStore: food image analysis requires network connection.',
    );
  });

  it('discards an edited portion without writing or refreshing the journal', async () => {
    await store.analyzeMealPhoto();
    store.setPhotoGrams(0, 100);
    store.discardPhoto();
    expect(store.photoDraft()).toBeNull();
    expect(await store.savePhoto()).toBeFalse();
    expect(photoMeals.save).not.toHaveBeenCalled();
    expect(invalidationTick()).toBe(0);
  });

  it('retains edits on failure, allows offline saving and ignores a repeated save', async () => {
    await store.analyzeMealPhoto();
    const captureId = store.photoDraft()!.captureId;
    onlineSignal.set(false);
    store.setPhotoGrams(0, NaN);
    expect(await store.savePhoto()).toBeFalse();
    store.setPhotoGrams(0, 100);
    store.setPhotoMealType('snack');
    photoMeals.save.and.rejectWith(new Error('disk full'));
    await expectAsync(store.savePhoto()).toBeRejected();
    expect(store.photoDraft()?.portions[0].grams).toBe(100);
    photoMeals.save.and.resolveTo();
    const saving = store.savePhoto();
    expect(await store.savePhoto()).toBeFalse();
    expect(await saving).toBeTrue();
    const [, mealType, portions, savedId] = photoMeals.save.calls.mostRecent().args;
    expect([mealType, portions[0].grams, savedId]).toEqual(['snack', 100, captureId]);
    expect(photoMeals.save).toHaveBeenCalledTimes(2);
    expect(invalidationTick()).toBe(1);
    expect(store.photoDraft()).toBeNull();
  });
});

function loggedDay(date: string, calories: number): DayTotals {
  return {
    date,
    calories,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  };
}

function progressSummary(overrides: Partial<FitnessProgressSummary> = {}): FitnessProgressSummary {
  return {
    currentWeekVolume: 0,
    previousWeekVolume: 0,
    workoutStreakWeeks: 0,
    weeklyAvgWeightKg: null,
    weightSource: null,
    volumeByMuscle: [],
    strength: [],
    ...overrides,
  };
}

function workoutSession(overrides: Partial<WorkoutSessionDetail> = {}): WorkoutSessionDetail {
  return {
    id: 'session-1',
    date: '2026-05-10',
    training_plan_day_id: null,
    training_day_name: 'Full Body',
    mode: 'guided',
    total_volume: 0,
    duration_minutes: 45,
    started_at: '2026-05-10T07:00:00',
    completed_at: '2026-05-10T07:45:00',
    created_at: '2026-05-10T07:00:00',
    exercises: [],
    ...overrides,
  };
}

async function settle(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
