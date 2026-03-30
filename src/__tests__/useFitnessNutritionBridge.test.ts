import { deriveInsight } from '../features/fitness/hooks/useFitnessNutritionBridge';
import type { FitnessNutritionInsight } from '../features/fitness/hooks/useFitnessNutritionBridge';
import { useFitnessNutritionBridge } from '../features/fitness/hooks/useFitnessNutritionBridge';
import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';
import { useFitnessStore } from '../store/fitnessStore';
import { useHealthProfileStore } from '../features/health-profile/store/healthProfileStore';
import * as todayNutrition from '../hooks/useTodayNutrition';

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: vi.fn(),
}));

vi.mock('../features/health-profile/store/healthProfileStore', () => ({
  useHealthProfileStore: vi.fn(),
}));

vi.mock('../hooks/useTodayNutrition', () => ({
  useTodayNutrition: vi.fn(() => ({ eaten: 0, protein: 0 })),
}));

vi.mock('../services/nutritionEngine', () => ({
  calculateBMR: vi.fn(() => 1800),
  calculateTDEE: vi.fn(() => 2500),
}));

describe('deriveInsight', () => {
  it('returns deficit-on-training when calories < 75% budget on training day', () => {
    const result = deriveInsight(
      true,
      3,
      2500,
      1000,
      120,
      112,
    );
    expect(result).not.toBeNull();
    expect((result as FitnessNutritionInsight).type).toBe('deficit-on-training');
    expect((result as FitnessNutritionInsight).severity).toBe('warning');
    expect((result as FitnessNutritionInsight).title).toContain('Thiếu hụt');
  });

  it('returns null on training day when calories are adequate', () => {
    const result = deriveInsight(
      true,
      3,
      2500,
      2200,
      120,
      112,
    );
    expect(result).toBeNull();
  });

  it('returns protein-low when protein < 60% target', () => {
    const result = deriveInsight(
      false,
      2,
      2500,
      2200,
      30,
      112,
    );
    expect(result).not.toBeNull();
    expect((result as FitnessNutritionInsight).type).toBe('protein-low');
    expect((result as FitnessNutritionInsight).severity).toBe('warning');
    expect((result as FitnessNutritionInsight).message).toContain('30');
  });

  it('returns recovery-day on rest day with high weekly load', () => {
    const result = deriveInsight(
      false,
      5,
      2500,
      2200,
      120,
      112,
    );
    expect(result).not.toBeNull();
    expect((result as FitnessNutritionInsight).type).toBe('recovery-day');
    expect((result as FitnessNutritionInsight).severity).toBe('info');
    expect((result as FitnessNutritionInsight).message).toContain('5');
  });

  it('returns null when everything is balanced', () => {
    const result = deriveInsight(
      false,
      2,
      2500,
      2200,
      120,
      112,
    );
    expect(result).toBeNull();
  });

  it('returns null when protein target is zero', () => {
    const result = deriveInsight(
      false,
      2,
      2500,
      2200,
      0,
      0,
    );
    expect(result).toBeNull();
  });

  it('prioritizes deficit-on-training over protein-low', () => {
    const result = deriveInsight(
      true,
      5,
      2500,
      500,
      10,
      112,
    );
    expect(result).not.toBeNull();
    expect((result as FitnessNutritionInsight).type).toBe('deficit-on-training');
  });

  it('prioritizes protein-low over recovery-day', () => {
    const result = deriveInsight(
      false,
      5,
      2500,
      2200,
      10,
      112,
    );
    expect(result).not.toBeNull();
    expect((result as FitnessNutritionInsight).type).toBe('protein-low');
  });

  it('returns recovery-day with exactly 4 weekly workouts', () => {
    const result = deriveInsight(
      false,
      4,
      2500,
      2200,
      120,
      112,
    );
    expect(result).not.toBeNull();
    expect((result as FitnessNutritionInsight).type).toBe('recovery-day');
  });

  it('returns null on rest day with 3 weekly workouts (below threshold)', () => {
    const result = deriveInsight(
      false,
      3,
      2500,
      2200,
      120,
      112,
    );
    expect(result).toBeNull();
  });
});

/* ================================================================== */
/*  useFitnessNutritionBridge hook tests                                */
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
      (selector: (s: { workouts: unknown[] }) => unknown) =>
        selector({ workouts: [] }),
    );
    (useHealthProfileStore as unknown as Mock).mockImplementation(
      (selector: (s: { profile: typeof DEFAULT_PROFILE }) => unknown) =>
        selector({ profile: DEFAULT_PROFILE }),
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
  });

  it('identifies training day when workout matches today', () => {
    const today = formatDate(new Date());
    (useFitnessStore as unknown as Mock).mockImplementation(
      (selector: (s: { workouts: Array<{ date: string }> }) => unknown) =>
        selector({
          workouts: [{ date: today }],
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
      (selector: (s: { workouts: Array<{ date: string }> }) => unknown) =>
        selector({
          workouts: [{ date: d1 }, { date: d2 }],
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
      (selector: (s: { workouts: Array<{ date: string }> }) => unknown) =>
        selector({
          workouts: [{ date: oldDate }],
        }),
    );

    const { result } = renderHook(() => useFitnessNutritionBridge());
    expect(result.current.weeklyTrainingLoad).toBe(0);
    expect(result.current.isTrainingDay).toBe(false);
  });

  it('returns insight object from deriveInsight integration', () => {
    const today = formatDate(new Date());
    (useFitnessStore as unknown as Mock).mockImplementation(
      (selector: (s: { workouts: Array<{ date: string }> }) => unknown) =>
        selector({ workouts: [{ date: today }] }),
    );
    vi.mocked(todayNutrition.useTodayNutrition).mockReturnValue({
      eaten: 500,
      protein: 10,
    });

    const { result } = renderHook(() => useFitnessNutritionBridge());
    expect(result.current.insight).not.toBeNull();
    expect(result.current.insight?.type).toBe('deficit-on-training');
  });
});
