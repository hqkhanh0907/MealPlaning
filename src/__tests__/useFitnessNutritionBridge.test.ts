import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import type { FitnessNutritionInsight } from '../features/fitness/hooks/useFitnessNutritionBridge';
import { deriveInsight } from '../features/fitness/hooks/useFitnessNutritionBridge';
import { useFitnessNutritionBridge } from '../features/fitness/hooks/useFitnessNutritionBridge';
import { useNutritionTargets } from '../features/health-profile/hooks/useNutritionTargets';
import { useHealthProfileStore } from '../features/health-profile/store/healthProfileStore';
import * as todayNutrition from '../hooks/useTodayNutrition';
import { useFitnessStore } from '../store/fitnessStore';

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: vi.fn(),
}));

vi.mock('../features/health-profile/store/healthProfileStore', () => ({
  useHealthProfileStore: vi.fn(),
}));

vi.mock('../hooks/useTodayNutrition', () => ({
  useTodayNutrition: vi.fn(() => ({ eaten: 0, protein: 0 })),
}));

vi.mock('../features/health-profile/hooks/useNutritionTargets', () => ({
  useNutritionTargets: vi.fn(() => ({
    targetCalories: 2500,
    targetProtein: 140,
    targetFat: 69,
    targetCarbs: 309,
    bmr: 1800,
    tdee: 2500,
  })),
}));

describe('deriveInsight', () => {
  it('returns deficit-on-training when calories < 75% budget on training day', () => {
    const result = deriveInsight(true, 3, 2500, 1000, 120, 112);
    expect(result).not.toBeNull();
    expect((result as FitnessNutritionInsight).type).toBe('deficit-on-training');
    expect((result as FitnessNutritionInsight).severity).toBe('warning');
    expect((result as FitnessNutritionInsight).title).toContain('Thiếu hụt');
  });

  it('returns null on training day when calories are adequate', () => {
    const result = deriveInsight(true, 3, 2500, 2200, 120, 112);
    expect(result).toBeNull();
  });

  it('returns protein-low when protein < 60% target', () => {
    const result = deriveInsight(false, 2, 2500, 2200, 30, 112);
    expect(result).not.toBeNull();
    expect((result as FitnessNutritionInsight).type).toBe('protein-low');
    expect((result as FitnessNutritionInsight).severity).toBe('warning');
    expect((result as FitnessNutritionInsight).message).toContain('30');
  });

  it('returns recovery-day on rest day with high weekly load', () => {
    const result = deriveInsight(false, 5, 2500, 2200, 120, 112);
    expect(result).not.toBeNull();
    expect((result as FitnessNutritionInsight).type).toBe('recovery-day');
    expect((result as FitnessNutritionInsight).severity).toBe('info');
    expect((result as FitnessNutritionInsight).message).toContain('5');
  });

  it('returns null when everything is balanced', () => {
    const result = deriveInsight(false, 2, 2500, 2200, 120, 112);
    expect(result).toBeNull();
  });

  it('returns null when protein target is zero', () => {
    const result = deriveInsight(false, 2, 2500, 2200, 0, 0);
    expect(result).toBeNull();
  });

  it('prioritizes deficit-on-training over protein-low', () => {
    const result = deriveInsight(true, 5, 2500, 500, 10, 112);
    expect(result).not.toBeNull();
    expect((result as FitnessNutritionInsight).type).toBe('deficit-on-training');
  });

  it('prioritizes protein-low over recovery-day', () => {
    const result = deriveInsight(false, 5, 2500, 2200, 10, 112);
    expect(result).not.toBeNull();
    expect((result as FitnessNutritionInsight).type).toBe('protein-low');
  });

  it('returns recovery-day with exactly 4 weekly workouts', () => {
    const result = deriveInsight(false, 4, 2500, 2200, 120, 112);
    expect(result).not.toBeNull();
    expect((result as FitnessNutritionInsight).type).toBe('recovery-day');
  });

  it('returns null on rest day with 3 weekly workouts (below threshold)', () => {
    const result = deriveInsight(false, 3, 2500, 2200, 120, 112);
    expect(result).toBeNull();
  });
});

/* ================================================================== */
/* useFitnessNutritionBridge hook tests */
/* ================================================================== */

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const DEFAULT_PROFILE = {
  id: 'default',
  name: 'Test',
  gender: 'male' as const,
  age: 30,
  dateOfBirth: null,
  heightCm: 175,
  weightKg: 70,
  activityLevel: 'moderate' as const,
  proteinRatio: 2,
  fatPct: 0.25,
  targetCalories: 2000,
  updatedAt: '2024-01-01',
};

describe('useFitnessNutritionBridge hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useFitnessStore as unknown as Mock).mockImplementation(
      (selector: (s: { workouts: unknown[]; workoutSets: unknown[] }) => unknown) =>
        selector({ workouts: [], workoutSets: [] }),
    );
    (useHealthProfileStore as unknown as Mock).mockImplementation(
      (selector: (s: { profile: typeof DEFAULT_PROFILE }) => unknown) => selector({ profile: DEFAULT_PROFILE }),
    );
    vi.mocked(todayNutrition.useTodayNutrition).mockReturnValue({
      eaten: 2000,
      protein: 120,
    });
  });

  it('returns result with no workouts (rest day)', () => {
    const { result } = renderHook(() => useFitnessNutritionBridge());

    expect(result.current.isTrainingDay).toBe(false);
    expect(result.current.weeklyTrainingLoad).toBe(0);
    expect(result.current.todayCalorieBudget).toBe(2500);
    expect(result.current.todayBurned).toBe(0);
  });

  it('returns null insight and zero calorie budget when profile is null', () => {
    (useHealthProfileStore as unknown as Mock).mockImplementation((selector: (s: { profile: null }) => unknown) =>
      selector({ profile: null }),
    );

    const { result } = renderHook(() => useFitnessNutritionBridge());
    expect(result.current.insight).toBeNull();
    expect(result.current.todayCalorieBudget).toBe(0);
    expect(result.current.todayBurned).toBe(0);
    expect(result.current.isTrainingDay).toBe(false);
    expect(result.current.weeklyTrainingLoad).toBe(0);
  });

  it('identifies training day when workout matches today', () => {
    const today = formatDate(new Date());
    (useFitnessStore as unknown as Mock).mockImplementation(
      (selector: (s: { workouts: Array<{ date: string; id: string }>; workoutSets: unknown[] }) => unknown) =>
        selector({
          workouts: [{ date: today, id: 'w1' }],
          workoutSets: [],
        }),
    );

    const { result } = renderHook(() => useFitnessNutritionBridge());
    expect(result.current.isTrainingDay).toBe(true);
    expect(result.current.weeklyTrainingLoad).toBeGreaterThanOrEqual(1);
  });

  it('calculates weekly training load for current week', () => {
    // Pin to Wednesday so both today and yesterday are in the same ISO week
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T12:00:00')); // Wednesday

    const d1 = '2026-03-25'; // Wed
    const d2 = '2026-03-24'; // Tue (same week)

    (useFitnessStore as unknown as Mock).mockImplementation(
      (selector: (s: { workouts: Array<{ date: string; id: string }>; workoutSets: unknown[] }) => unknown) =>
        selector({
          workouts: [
            { date: d1, id: 'w1' },
            { date: d2, id: 'w2' },
          ],
          workoutSets: [],
        }),
    );

    const { result } = renderHook(() => useFitnessNutritionBridge());
    expect(result.current.weeklyTrainingLoad).toBe(2);

    vi.useRealTimers();
  });

  it('excludes workouts from previous weeks', () => {
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);
    const oldDate = formatDate(lastMonth);

    (useFitnessStore as unknown as Mock).mockImplementation(
      (selector: (s: { workouts: Array<{ date: string; id: string }>; workoutSets: unknown[] }) => unknown) =>
        selector({
          workouts: [{ date: oldDate, id: 'w1' }],
          workoutSets: [],
        }),
    );

    const { result } = renderHook(() => useFitnessNutritionBridge());
    expect(result.current.weeklyTrainingLoad).toBe(0);
    expect(result.current.isTrainingDay).toBe(false);
  });

  it('returns insight object from deriveInsight integration', () => {
    const today = formatDate(new Date());
    (useFitnessStore as unknown as Mock).mockImplementation(
      (selector: (s: { workouts: Array<{ date: string; id: string }>; workoutSets: unknown[] }) => unknown) =>
        selector({ workouts: [{ date: today, id: 'w1' }], workoutSets: [] }),
    );
    vi.mocked(todayNutrition.useTodayNutrition).mockReturnValue({
      eaten: 500,
      protein: 10,
    });

    const { result } = renderHook(() => useFitnessNutritionBridge());
    expect(result.current.insight).not.toBeNull();
    expect(result.current.insight?.type).toBe('deficit-on-training');
  });

  it('uses goal-adjusted target calories as budget', () => {
    vi.mocked(useNutritionTargets).mockReturnValue({
      targetCalories: 1950,
      targetProtein: 140,
      targetFat: 54,
      targetCarbs: 244,
      bmr: 1800,
      tdee: 2500,
    });

    const { result } = renderHook(() => useFitnessNutritionBridge());
    expect(result.current.todayCalorieBudget).toBe(1950);
  });

  it('uses correct protein target from useNutritionTargets', () => {
    const today = formatDate(new Date());
    (useFitnessStore as unknown as Mock).mockImplementation(
      (selector: (s: { workouts: Array<{ date: string; id: string }>; workoutSets: unknown[] }) => unknown) =>
        selector({ workouts: [{ date: today, id: 'w1' }], workoutSets: [] }),
    );
    vi.mocked(useNutritionTargets).mockReturnValue({
      targetCalories: 2500,
      targetProtein: 175,
      targetFat: 69,
      targetCarbs: 309,
      bmr: 1800,
      tdee: 2500,
    });
    vi.mocked(todayNutrition.useTodayNutrition).mockReturnValue({
      eaten: 2200,
      protein: 80,
    });

    const { result } = renderHook(() => useFitnessNutritionBridge());
    expect(result.current.insight).not.toBeNull();
    expect(result.current.insight?.type).toBe('protein-low');
  });

  it('includes burned calories in todayCalorieBudget (FIX-06)', () => {
    const today = formatDate(new Date());
    (useFitnessStore as unknown as Mock).mockImplementation(
      (
        selector: (s: {
          workouts: Array<{ date: string; id: string }>;
          workoutSets: Array<{ workoutId: string; estimatedCalories?: number }>;
        }) => unknown,
      ) =>
        selector({
          workouts: [{ date: today, id: 'w1' }],
          workoutSets: [
            { workoutId: 'w1', estimatedCalories: 300 },
            { workoutId: 'w1', estimatedCalories: 150 },
          ],
        }),
    );

    const { result } = renderHook(() => useFitnessNutritionBridge());
    // targetCalories=2500 + burned=450 = 2950
    expect(result.current.todayBurned).toBe(450);
    expect(result.current.todayCalorieBudget).toBe(2950);
  });

  it('handles workout sets with undefined estimatedCalories (FIX-06)', () => {
    const today = formatDate(new Date());
    (useFitnessStore as unknown as Mock).mockImplementation(
      (
        selector: (s: {
          workouts: Array<{ date: string; id: string }>;
          workoutSets: Array<{ workoutId: string; estimatedCalories?: number }>;
        }) => unknown,
      ) =>
        selector({
          workouts: [{ date: today, id: 'w1' }],
          workoutSets: [
            { workoutId: 'w1', estimatedCalories: 200 },
            { workoutId: 'w1', estimatedCalories: undefined },
          ],
        }),
    );

    const { result } = renderHook(() => useFitnessNutritionBridge());
    expect(result.current.todayBurned).toBe(200);
    expect(result.current.todayCalorieBudget).toBe(2700); // 2500 + 200
  });

  it('only counts workout sets from today workouts (FIX-06)', () => {
    const today = formatDate(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    (useFitnessStore as unknown as Mock).mockImplementation(
      (
        selector: (s: {
          workouts: Array<{ date: string; id: string }>;
          workoutSets: Array<{ workoutId: string; estimatedCalories?: number }>;
        }) => unknown,
      ) =>
        selector({
          workouts: [
            { date: today, id: 'w-today' },
            { date: yesterdayStr, id: 'w-yesterday' },
          ],
          workoutSets: [
            { workoutId: 'w-today', estimatedCalories: 100 },
            { workoutId: 'w-yesterday', estimatedCalories: 500 },
          ],
        }),
    );

    const { result } = renderHook(() => useFitnessNutritionBridge());
    // Only today's 100 should count, not yesterday's 500
    expect(result.current.todayBurned).toBe(100);
    expect(result.current.todayCalorieBudget).toBe(2600); // 2500 + 100
  });

  it('uses strength MET fallback for sets without estimatedCalories (FIX-06)', () => {
    const today = formatDate(new Date());
    (useFitnessStore as unknown as Mock).mockImplementation(
      (
        selector: (s: {
          workouts: Array<{
            date: string;
            id: string;
            durationMin?: number;
            name: string;
            createdAt: string;
            updatedAt: string;
          }>;
          workoutSets: Array<{
            id: string;
            workoutId: string;
            exerciseId: string;
            setNumber: number;
            weightKg: number;
            reps?: number;
            estimatedCalories?: number;
            updatedAt: string;
          }>;
        }) => unknown,
      ) =>
        selector({
          workouts: [{ date: today, id: 'w1', durationMin: 45, name: 'Strength', createdAt: today, updatedAt: today }],
          workoutSets: [
            // Strength set: has weightKg+reps but NO estimatedCalories → triggers MET fallback
            { id: 's1', workoutId: 'w1', exerciseId: 'e1', setNumber: 1, weightKg: 60, reps: 10, updatedAt: today },
          ],
        }),
    );

    const { result } = renderHook(() => useFitnessNutritionBridge());
    // STRENGTH_MET=5, userWeight=70kg, duration=45min → 5*70*45/60 = 262.5 → 263
    expect(result.current.todayBurned).toBe(263);
    expect(result.current.todayCalorieBudget).toBe(2500 + 263);
  });

  it('burned calories prevent false deficit warning (FIX-06)', () => {
    const today = formatDate(new Date());
    (useFitnessStore as unknown as Mock).mockImplementation(
      (
        selector: (s: {
          workouts: Array<{ date: string; id: string }>;
          workoutSets: Array<{ workoutId: string; estimatedCalories?: number }>;
        }) => unknown,
      ) =>
        selector({
          workouts: [{ date: today, id: 'w1' }],
          workoutSets: [{ workoutId: 'w1', estimatedCalories: 500 }],
        }),
    );
    // eaten=2000, target=2500, burned=500 → budget=3000 → 2000 < 3000*0.75=2250 → deficit warning
    // But without burned: budget=2500 → 2000 < 2500*0.75=1875? No (2000 > 1875) → no deficit
    // With burned: budget=3000 → 2000 < 3000*0.75=2250 → deficit warning
    vi.mocked(todayNutrition.useTodayNutrition).mockReturnValue({
      eaten: 2000,
      protein: 120,
    });

    const { result } = renderHook(() => useFitnessNutritionBridge());
    expect(result.current.todayCalorieBudget).toBe(3000);
    // 2000 < 3000*0.75(=2250) → deficit
    expect(result.current.insight?.type).toBe('deficit-on-training');
  });
});
