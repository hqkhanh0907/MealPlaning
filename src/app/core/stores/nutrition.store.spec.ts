import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NutritionStore } from './nutrition.store';
import { NutritionQuery } from '../services/nutrition/nutrition-query';
import { CalendarStore } from './calendar.store';
import { ProfileStore } from './profile.store';
import type { UserProfile } from '../models/user-profile.model';

describe('NutritionStore', () => {
  let currentDate: ReturnType<typeof signal<string>>;
  let invalidationTick: ReturnType<typeof signal<number>>;
  let profile: ReturnType<typeof signal<UserProfile | null>>;
  let dailyTotalsSpy: jasmine.Spy;
  let trendSpy: jasmine.Spy;

  function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
    return {
      id: 'p1',
      height_cm: 170,
      weight_kg: 70,
      age: 30,
      gender: 'male',
      goal: 'gain_muscle',
      fitness_level: 'intermediate',
      activity_factor: 1.55,
      bmr: 1700,
      tdee: 2635,
      target_calories: 2200,
      target_protein: 140,
      target_carbs: 250,
      target_fat: 70,
      theme: 'light',
      notif_morning: 1,
      notif_lunch: 1,
      notif_evening: 1,
      notif_weekly: 1,
      onboarding_completed: 1,
      created_at: '2026-01-01',
      updated_at: null,
      ...overrides,
    };
  }

  beforeEach(() => {
    currentDate = signal('2026-05-10');
    invalidationTick = signal(0);
    profile = signal<UserProfile | null>(null);

    dailyTotalsSpy = jasmine.createSpy('dailyTotals').and.callFake((d: string) =>
      Promise.resolve({
        calories: d === '2026-05-10' ? 1000 : 500,
        protein: 60,
        carbs: 100,
        fat: 30,
        fiber: 12,
      }),
    );
    trendSpy = jasmine.createSpy('trend').and.callFake((s: string, e: string, _m: string) =>
      Promise.resolve([
        { date: s, value: 999 },
        { date: e, value: 111 },
      ]),
    );

    TestBed.configureTestingModule({
      providers: [
        {
          provide: CalendarStore,
          useValue: { currentDate, invalidationTick },
        },
        {
          provide: ProfileStore,
          useValue: { profile },
        },
        {
          provide: NutritionQuery,
          useValue: {
            dailyTotals: dailyTotalsSpy,
            trend: trendSpy,
            weekTotals: () => Promise.resolve([]),
          },
        },
      ],
    });
  });

  // ─── reactive today reload ────────────────────────────────────────────

  it('reloads today on construction (currentDate=2026-05-10)', async () => {
    const store = TestBed.inject(NutritionStore);
    TestBed.flushEffects();
    await Promise.resolve();
    await Promise.resolve();
    expect(dailyTotalsSpy).toHaveBeenCalledWith('2026-05-10');
    expect(store.today().calories).toBe(1000);
  });

  it('reloads today when invalidationTick changes', async () => {
    TestBed.inject(NutritionStore);
    TestBed.flushEffects();
    await Promise.resolve();
    await Promise.resolve();
    dailyTotalsSpy.calls.reset();
    invalidationTick.update((n) => n + 1);
    TestBed.flushEffects();
    await Promise.resolve();
    expect(dailyTotalsSpy).toHaveBeenCalledWith('2026-05-10');
  });

  it('reloads today when currentDate changes', async () => {
    TestBed.inject(NutritionStore);
    TestBed.flushEffects();
    await Promise.resolve();
    await Promise.resolve();
    dailyTotalsSpy.calls.reset();
    currentDate.set('2026-05-11');
    TestBed.flushEffects();
    await Promise.resolve();
    await Promise.resolve();
    expect(dailyTotalsSpy).toHaveBeenCalledWith('2026-05-11');
  });

  // ─── derived targets / keyMetric ──────────────────────────────────────

  it('targets pull from ProfileStore when profile is set', () => {
    profile.set(makeProfile({ target_calories: 2500, target_protein: 180 }));
    const store = TestBed.inject(NutritionStore);
    expect(store.targets()).toEqual({
      calories: 2500,
      protein: 180,
      carbs: 250,
      fat: 70,
      fiber: 25,
    });
  });

  it('targets default to zeros when profile is null', () => {
    const store = TestBed.inject(NutritionStore);
    expect(store.targets()).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 25 });
  });

  it('keyMetric reflects router output (gain_muscle → protein)', () => {
    profile.set(makeProfile({ fitness_level: 'intermediate', goal: 'gain_muscle' }));
    const store = TestBed.inject(NutritionStore);
    expect(store.keyMetric()).toBe('protein');
    expect(store.keyMetricVariant()).toBe('gain');
  });

  it('keyMetric falls back to calories (beginner) when profile null', () => {
    const store = TestBed.inject(NutritionStore);
    expect(store.keyMetric()).toBe('calories');
    expect(store.keyMetricVariant()).toBe('beginner');
  });

  // ─── trend cache ──────────────────────────────────────────────────────

  describe('loadTrend (in-memory cache)', () => {
    it('hits cache on second call with same key (single fetch)', async () => {
      const store = TestBed.inject(NutritionStore);
      const a = await store.loadTrend('2026-05-01', '2026-05-07', 'calories');
      const b = await store.loadTrend('2026-05-01', '2026-05-07', 'calories');
      expect(trendSpy).toHaveBeenCalledTimes(1);
      expect(a).toBe(b);
    });

    it('different metric → cache miss → second fetch', async () => {
      const store = TestBed.inject(NutritionStore);
      await store.loadTrend('2026-05-01', '2026-05-07', 'calories');
      await store.loadTrend('2026-05-01', '2026-05-07', 'protein');
      expect(trendSpy).toHaveBeenCalledTimes(2);
    });

    it('invalidationTick change clears trend cache', async () => {
      const store = TestBed.inject(NutritionStore);
      TestBed.flushEffects(); // initial effect uses tick=0
      await store.loadTrend('2026-05-01', '2026-05-07', 'calories');
      expect(trendSpy).toHaveBeenCalledTimes(1);

      invalidationTick.update((n) => n + 1);
      TestBed.flushEffects();
      await Promise.resolve();

      // Same args → must re-fetch because cache was cleared.
      await store.loadTrend('2026-05-01', '2026-05-07', 'calories');
      expect(trendSpy).toHaveBeenCalledTimes(2);
    });
  });
});
