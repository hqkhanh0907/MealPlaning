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
  age: 30,
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
  let profileRepo: jasmine.SpyObj<UserProfileRepository>;
  let workoutRepo: jasmine.SpyObj<WorkoutRepository>;
  let insightAi: jasmine.SpyObj<InsightAi>;
  let foodImageAi: jasmine.SpyObj<FoodImageAi>;
  let cameraCapture: jasmine.SpyObj<CameraCapture>;
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
        { provide: UserProfileRepository, useValue: profileRepo },
        { provide: WorkoutRepository, useValue: workoutRepo },
        { provide: InsightAi, useValue: insightAi },
        { provide: FoodImageAi, useValue: foodImageAi },
        { provide: CameraCapture, useValue: cameraCapture },
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
    expect(store.workoutTitle()).toBe('Tuần này 5.200 kg volume');
    expect(store.workoutBody()).toContain('Tăng 700 kg volume');
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
      targets: targetsSignal(),
      workoutVolumeKg: 3200,
      workoutStreakWeeks: 2,
    });
    expect(store.dailyAiInsight()?.title).toBe('Đúng nhịp');
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
