import { renderHook } from '@testing-library/react';

import { useDailyScore } from '../features/dashboard/hooks/useDailyScore';
import { calculateDailyScore } from '../features/dashboard/utils/scoreCalculator';
import { calculateStreak } from '../features/fitness/utils/gamification';
import { useNutritionTargets } from '../features/health-profile/hooks/useNutritionTargets';
import { useHealthProfileStore } from '../features/health-profile/store/healthProfileStore';
import { DEFAULT_HEALTH_PROFILE } from '../features/health-profile/types';
import { useDayPlanStore } from '../store/dayPlanStore';
import { useDishStore } from '../store/dishStore';
import { useFitnessStore } from '../store/fitnessStore';
import { useIngredientStore } from '../store/ingredientStore';
import { calculateDishesNutrition } from '../utils/nutrition';

vi.mock('../store/fitnessStore', () => ({ useFitnessStore: vi.fn() }));
vi.mock('../store/dayPlanStore', () => ({ useDayPlanStore: vi.fn() }));
vi.mock('../store/dishStore', () => ({ useDishStore: vi.fn() }));
vi.mock('../store/ingredientStore', () => ({
  useIngredientStore: vi.fn(),
}));
vi.mock('../features/health-profile/store/healthProfileStore', () => ({
  useHealthProfileStore: vi.fn(),
}));
vi.mock('../features/health-profile/hooks/useNutritionTargets', () => ({
  useNutritionTargets: vi.fn(),
}));
vi.mock('../features/fitness/utils/gamification', () => ({
  calculateStreak: vi.fn(),
}));
vi.mock('../utils/nutrition', () => ({
  calculateDishesNutrition: vi.fn(),
}));
vi.mock('../features/dashboard/utils/scoreCalculator', () => ({
  calculateDailyScore: vi.fn(),
}));

const mockFitnessStore = vi.mocked(useFitnessStore);
const mockDayPlanStore = vi.mocked(useDayPlanStore);
const mockDishStore = vi.mocked(useDishStore);
const mockIngredientStore = vi.mocked(useIngredientStore);
const mockHealthProfileStore = vi.mocked(useHealthProfileStore);
const mockNutritionTargets = vi.mocked(useNutritionTargets);
const mockCalculateStreak = vi.mocked(calculateStreak);
const mockCalcNutrition = vi.mocked(calculateDishesNutrition);
const mockCalcDailyScore = vi.mocked(calculateDailyScore);

function setupFitnessStore(overrides: Record<string, unknown> = {}) {
  const state = {
    workouts: [],
    weightEntries: [],
    trainingPlans: [],
    trainingPlanDays: [],
    ...overrides,
  };
  mockFitnessStore.mockImplementation(((selector: (s: typeof state) => unknown) =>
    selector(state)) as typeof useFitnessStore);
}

function setupDayPlanStore(overrides: Record<string, unknown> = {}) {
  const state = { dayPlans: [], ...overrides };
  mockDayPlanStore.mockImplementation(((selector: (s: typeof state) => unknown) =>
    selector(state)) as typeof useDayPlanStore);
}

function setupDishStore(overrides: Record<string, unknown> = {}) {
  const state = { dishes: [], ...overrides };
  mockDishStore.mockImplementation(((selector: (s: typeof state) => unknown) =>
    selector(state)) as typeof useDishStore);
}

function setupIngredientStore(overrides: Record<string, unknown> = {}) {
  const state = { ingredients: [], ...overrides };
  mockIngredientStore.mockImplementation(((selector: (s: typeof state) => unknown) =>
    selector(state)) as typeof useIngredientStore);
}

function setupHealthProfileStore(overrides: Record<string, unknown> = {}) {
  const state = {
    profile: { ...DEFAULT_HEALTH_PROFILE },
    ...overrides,
  };
  mockHealthProfileStore.mockImplementation(((selector: (s: typeof state) => unknown) =>
    selector(state)) as typeof useHealthProfileStore);
}

const defaultScoreResult = {
  totalScore: 50,
  factors: {
    calories: null as number | null,
    protein: null as number | null,
    workout: null as number | null,
    weightLog: null as number | null,
    streak: null as number | null,
  },
  color: 'amber' as const,
  availableFactors: 0,
};

const defaultStreakInfo = {
  currentStreak: 0,
  longestStreak: 0,
  weekDots: [] as {
    day: number;
    status: 'completed' | 'rest' | 'missed' | 'today' | 'upcoming';
  }[],
  gracePeriodUsed: false,
  streakAtRisk: false,
};

function setupDefaultMocks() {
  setupFitnessStore();
  setupDayPlanStore();
  setupDishStore();
  setupIngredientStore();
  setupHealthProfileStore();
  mockNutritionTargets.mockReturnValue({
    targetCalories: 2000,
    targetProtein: 150,
    targetFat: 60,
    targetCarbs: 250,
    bmr: 1700,
    tdee: 2200,
  });
  mockCalculateStreak.mockReturnValue(defaultStreakInfo);
  mockCalcNutrition.mockReturnValue({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  });
  mockCalcDailyScore.mockReturnValue({ ...defaultScoreResult });
}

function todayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function yesterdayStr(): string {
  const now = new Date();
  const prev = new Date(now.getTime() - 86_400_000);
  const y = prev.getFullYear();
  const m = String(prev.getMonth() + 1).padStart(2, '0');
  const d = String(prev.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

describe('useDailyScore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T09:00:00'));
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('first-time user detection', () => {
    it('returns isFirstTimeUser true when profile is default', () => {
      setupHealthProfileStore({
        profile: { ...DEFAULT_HEALTH_PROFILE },
      });

      const { result } = renderHook(() => useDailyScore());
      expect(result.current.isFirstTimeUser).toBe(true);
    });

    it('returns isFirstTimeUser true when no meals logged ever', () => {
      setupHealthProfileStore({
        profile: {
          ...DEFAULT_HEALTH_PROFILE,
          id: 'custom-id',
          age: 25,
          weightKg: 80,
        },
      });
      setupDayPlanStore({ dayPlans: [] });

      const { result } = renderHook(() => useDailyScore());
      expect(result.current.isFirstTimeUser).toBe(true);
    });

    it('returns isFirstTimeUser false when profile configured and meals exist and workout logged', () => {
      setupHealthProfileStore({
        profile: {
          ...DEFAULT_HEALTH_PROFILE,
          id: 'custom-id',
          age: 25,
          weightKg: 80,
        },
      });
      setupDayPlanStore({
        dayPlans: [
          {
            date: '2025-01-14',
            breakfastDishIds: ['d1'],
            lunchDishIds: [],
            dinnerDishIds: [],
          },
        ],
      });
      setupFitnessStore({
        workouts: [
          {
            id: 'w1',
            date: '2025-01-14',
            name: 'Chest Day',
            createdAt: '',
            updatedAt: '',
          },
        ],
      });

      const { result } = renderHook(() => useDailyScore());
      expect(result.current.isFirstTimeUser).toBe(false);
    });

    it('returns isFirstTimeUser true when profile configured and meals exist but no workout logged', () => {
      setupHealthProfileStore({
        profile: {
          ...DEFAULT_HEALTH_PROFILE,
          id: 'custom-id',
          age: 25,
          weightKg: 80,
        },
      });
      setupDayPlanStore({
        dayPlans: [
          {
            date: '2025-01-14',
            breakfastDishIds: ['d1'],
            lunchDishIds: [],
            dinnerDishIds: [],
          },
        ],
      });
      setupFitnessStore({ workouts: [] });

      const { result } = renderHook(() => useDailyScore());
      expect(result.current.isFirstTimeUser).toBe(true);
    });

    it('hides checklist when all 3 setup steps are complete', () => {
      setupHealthProfileStore({
        profile: {
          ...DEFAULT_HEALTH_PROFILE,
          id: 'custom-id',
          dateOfBirth: '1996-05-15',
          age: 29,
          weightKg: 75,
          heightCm: 175,
        },
      });
      setupDayPlanStore({
        dayPlans: [
          {
            date: '2025-01-15',
            breakfastDishIds: ['d1'],
            lunchDishIds: ['d2'],
            dinnerDishIds: [],
          },
        ],
      });
      setupFitnessStore({
        workouts: [
          {
            id: 'w1',
            date: '2025-01-15',
            name: 'Push Day',
            createdAt: '',
            updatedAt: '',
          },
        ],
      });

      const { result } = renderHook(() => useDailyScore());
      expect(result.current.isFirstTimeUser).toBe(false);
      expect(result.current.heroContext).not.toBe('first-time');
    });
  });

  describe('greeting based on time of day', () => {
    it('returns morning greeting before 12:00', () => {
      vi.setSystemTime(new Date('2025-01-15T08:00:00'));

      const { result } = renderHook(() => useDailyScore());
      expect(result.current.greeting).toBe('Chào buổi sáng!');
    });

    it('returns afternoon greeting between 12:00 and 18:00', () => {
      vi.setSystemTime(new Date('2025-01-15T14:00:00'));

      const { result } = renderHook(() => useDailyScore());
      expect(result.current.greeting).toBe('Chào buổi chiều!');
    });

    it('returns evening greeting after 18:00', () => {
      vi.setSystemTime(new Date('2025-01-15T20:00:00'));

      const { result } = renderHook(() => useDailyScore());
      expect(result.current.greeting).toBe('Chào buổi tối!');
    });
  });

  describe('calorie data gathering from dayPlanStore', () => {
    it('computes nutrition from today dish IDs via calculateDishesNutrition', () => {
      const today = todayStr();
      setupDayPlanStore({
        dayPlans: [
          {
            date: today,
            breakfastDishIds: ['d1'],
            lunchDishIds: ['d2'],
            dinnerDishIds: ['d3'],
            servings: { d1: 2 },
          },
        ],
      });
      setupDishStore({ dishes: [{ id: 'd1' }, { id: 'd2' }, { id: 'd3' }] });
      setupIngredientStore({ ingredients: [{ id: 'i1' }] });
      mockCalcNutrition.mockReturnValue({
        calories: 1800,
        protein: 120,
        carbs: 200,
        fat: 50,
        fiber: 20,
      });

      renderHook(() => useDailyScore());

      expect(mockCalcNutrition).toHaveBeenCalledWith(
        ['d1', 'd2', 'd3'],
        [{ id: 'd1' }, { id: 'd2' }, { id: 'd3' }],
        [{ id: 'i1' }],
        { d1: 2 },
      );
      expect(mockCalcDailyScore).toHaveBeenCalledWith(
        expect.objectContaining({
          actualCalories: 1800,
          actualProteinG: 120,
        }),
      );
    });

    it('passes undefined calories when no day plan exists', () => {
      setupDayPlanStore({ dayPlans: [] });

      renderHook(() => useDailyScore());

      expect(mockCalcNutrition).not.toHaveBeenCalled();
      expect(mockCalcDailyScore).toHaveBeenCalledWith(
        expect.objectContaining({
          actualCalories: undefined,
          actualProteinG: undefined,
        }),
      );
    });

    it('passes undefined when day plan exists but has no dishes', () => {
      const today = todayStr();
      setupDayPlanStore({
        dayPlans: [
          {
            date: today,
            breakfastDishIds: [],
            lunchDishIds: [],
            dinnerDishIds: [],
          },
        ],
      });

      renderHook(() => useDailyScore());

      expect(mockCalcNutrition).not.toHaveBeenCalled();
      expect(mockCalcDailyScore).toHaveBeenCalledWith(
        expect.objectContaining({
          actualCalories: undefined,
          actualProteinG: undefined,
        }),
      );
    });
  });

  describe('workout data gathering from fitnessStore', () => {
    it('detects workout completed today', () => {
      const today = todayStr();
      setupFitnessStore({
        workouts: [
          {
            id: 'w1',
            date: today,
            name: 'Chest Day',
            createdAt: '',
            updatedAt: '',
          },
        ],
      });

      renderHook(() => useDailyScore());

      expect(mockCalcDailyScore).toHaveBeenCalledWith(expect.objectContaining({ workoutCompleted: true }));
    });

    it('detects no workout today', () => {
      setupFitnessStore({
        workouts: [
          {
            id: 'w1',
            date: '2025-01-10',
            name: 'Old',
            createdAt: '',
            updatedAt: '',
          },
        ],
      });

      renderHook(() => useDailyScore());

      expect(mockCalcDailyScore).toHaveBeenCalledWith(expect.objectContaining({ workoutCompleted: false }));
    });

    it('detects rest day when active plan has no scheduled day for today', () => {
      // Use ISO day-of-week (Mon=1..Sun=7)
      const jsDow = new Date().getDay();
      const todayIsoDow = jsDow === 0 ? 7 : jsDow;
      const otherDow = todayIsoDow === 7 ? 1 : todayIsoDow + 1;
      setupFitnessStore({
        trainingPlans: [{ id: 'p1', name: 'Plan', status: 'active' }],
        trainingPlanDays: [{ id: 'pd1', planId: 'p1', dayOfWeek: otherDow }],
      });

      renderHook(() => useDailyScore());

      expect(mockCalcDailyScore).toHaveBeenCalledWith(expect.objectContaining({ isRestDay: true }));
    });

    it('detects training day when active plan is scheduled for today', () => {
      // Use ISO day-of-week (Mon=1..Sun=7)
      const jsDow = new Date().getDay();
      const todayIsoDow = jsDow === 0 ? 7 : jsDow;
      setupFitnessStore({
        trainingPlans: [{ id: 'p1', name: 'Plan', status: 'active' }],
        trainingPlanDays: [{ id: 'pd1', planId: 'p1', dayOfWeek: todayIsoDow }],
      });

      renderHook(() => useDailyScore());

      expect(mockCalcDailyScore).toHaveBeenCalledWith(expect.objectContaining({ isRestDay: false }));
    });

    it('correctly maps Sunday to ISO dayOfWeek=7 (FIX-03)', () => {
      // Pin to a Sunday
      vi.setSystemTime(new Date('2025-01-19T10:00:00')); // Sunday
      setupFitnessStore({
        trainingPlans: [{ id: 'p1', name: 'Plan', status: 'active' }],
        trainingPlanDays: [{ id: 'pd1', planId: 'p1', dayOfWeek: 7 }],
      });

      renderHook(() => useDailyScore());

      // Sunday should match dayOfWeek=7, so NOT rest day
      expect(mockCalcDailyScore).toHaveBeenCalledWith(expect.objectContaining({ isRestDay: false }));
    });

    it('treats Sunday as rest day when not in plan schedule (FIX-03)', () => {
      vi.setSystemTime(new Date('2025-01-19T10:00:00')); // Sunday
      setupFitnessStore({
        trainingPlans: [{ id: 'p1', name: 'Plan', status: 'active' }],
        trainingPlanDays: [
          { id: 'pd1', planId: 'p1', dayOfWeek: 1 },
          { id: 'pd2', planId: 'p1', dayOfWeek: 3 },
          { id: 'pd3', planId: 'p1', dayOfWeek: 5 },
        ],
      });

      renderHook(() => useDailyScore());

      expect(mockCalcDailyScore).toHaveBeenCalledWith(expect.objectContaining({ isRestDay: true }));
    });

    it('passes isBeforeEvening true when hour < 20', () => {
      vi.setSystemTime(new Date('2025-01-15T19:00:00'));

      renderHook(() => useDailyScore());

      expect(mockCalcDailyScore).toHaveBeenCalledWith(expect.objectContaining({ isBeforeEvening: true }));
    });

    it('passes isBeforeEvening false when hour >= 20', () => {
      vi.setSystemTime(new Date('2025-01-15T21:00:00'));

      renderHook(() => useDailyScore());

      expect(mockCalcDailyScore).toHaveBeenCalledWith(expect.objectContaining({ isBeforeEvening: false }));
    });
  });

  describe('weight log data gathering from fitnessStore', () => {
    it('detects weight logged today', () => {
      const today = todayStr();
      setupFitnessStore({
        weightEntries: [
          {
            id: 'we1',
            date: today,
            weightKg: 75,
            createdAt: '',
            updatedAt: '',
          },
        ],
      });

      renderHook(() => useDailyScore());

      expect(mockCalcDailyScore).toHaveBeenCalledWith(
        expect.objectContaining({
          weightLoggedToday: true,
          weightLoggedYesterday: false,
        }),
      );
    });

    it('detects weight logged yesterday', () => {
      const yesterday = yesterdayStr();
      setupFitnessStore({
        weightEntries: [
          {
            id: 'we1',
            date: yesterday,
            weightKg: 75,
            createdAt: '',
            updatedAt: '',
          },
        ],
      });

      renderHook(() => useDailyScore());

      expect(mockCalcDailyScore).toHaveBeenCalledWith(
        expect.objectContaining({
          weightLoggedToday: false,
          weightLoggedYesterday: true,
        }),
      );
    });

    it('detects no weight log', () => {
      setupFitnessStore({ weightEntries: [] });

      renderHook(() => useDailyScore());

      expect(mockCalcDailyScore).toHaveBeenCalledWith(
        expect.objectContaining({
          weightLoggedToday: false,
          weightLoggedYesterday: false,
        }),
      );
    });
  });

  describe('streak calculation', () => {
    it('calls calculateStreak with workouts and plan days', () => {
      const today = todayStr();
      const workouts = [
        {
          id: 'w1',
          date: '2025-01-14',
          name: 'Back',
          createdAt: '',
          updatedAt: '',
        },
      ];
      setupFitnessStore({
        workouts,
        trainingPlans: [{ id: 'p1', name: 'Plan', status: 'active' }],
        trainingPlanDays: [
          { id: 'pd1', planId: 'p1', dayOfWeek: 1 },
          { id: 'pd2', planId: 'p1', dayOfWeek: 3 },
        ],
      });

      mockCalculateStreak.mockReturnValue({
        ...defaultStreakInfo,
        currentStreak: 5,
      });

      renderHook(() => useDailyScore());

      expect(mockCalculateStreak).toHaveBeenCalledWith(workouts, [1, 3], today);
      expect(mockCalcDailyScore).toHaveBeenCalledWith(expect.objectContaining({ streakDays: 5 }));
    });

    it('passes empty plan days when no active plan', () => {
      const today = todayStr();
      setupFitnessStore({
        trainingPlans: [],
        trainingPlanDays: [],
      });

      renderHook(() => useDailyScore());

      expect(mockCalculateStreak).toHaveBeenCalledWith([], [], today);
    });
  });

  describe('null/undefined values handling', () => {
    it('handles all empty stores gracefully', () => {
      setupDefaultMocks();

      const { result } = renderHook(() => useDailyScore());

      expect(result.current.totalScore).toBe(50);
      expect(result.current.factors).toEqual(defaultScoreResult.factors);
    });

    it('treats null profile as first-time user', () => {
      setupHealthProfileStore({ profile: null });

      const { result } = renderHook(() => useDailyScore());

      expect(result.current.isFirstTimeUser).toBe(true);
    });

    it('handles day plan without servings field', () => {
      const today = todayStr();
      setupDayPlanStore({
        dayPlans: [
          {
            date: today,
            breakfastDishIds: ['d1'],
            lunchDishIds: [],
            dinnerDishIds: [],
          },
        ],
      });
      mockCalcNutrition.mockReturnValue({
        calories: 500,
        protein: 30,
        carbs: 50,
        fat: 20,
        fiber: 5,
      });

      renderHook(() => useDailyScore());

      expect(mockCalcNutrition).toHaveBeenCalledWith(['d1'], [], [], undefined);
    });

    it('handles no active training plan for rest day and streak', () => {
      setupFitnessStore({
        trainingPlans: [{ id: 'p1', name: 'Plan', status: 'completed' }],
        trainingPlanDays: [{ id: 'pd1', planId: 'p1', dayOfWeek: 1 }],
      });

      renderHook(() => useDailyScore());

      expect(mockCalcDailyScore).toHaveBeenCalledWith(expect.objectContaining({ isRestDay: false }));
      expect(mockCalculateStreak).toHaveBeenCalledWith([], [], todayStr());
    });

    it('passes skipWorkoutFactor=true when no active plan (FIX-09)', () => {
      setupFitnessStore({
        trainingPlans: [],
        trainingPlanDays: [],
      });

      renderHook(() => useDailyScore());

      expect(mockCalcDailyScore).toHaveBeenCalledWith(expect.objectContaining({ skipWorkoutFactor: true }));
    });

    it('passes skipWorkoutFactor=false when active plan exists (FIX-09)', () => {
      setupFitnessStore({
        trainingPlans: [{ id: 'p1', name: 'Plan', status: 'active' }],
        trainingPlanDays: [{ id: 'pd1', planId: 'p1', dayOfWeek: 1 }],
      });

      renderHook(() => useDailyScore());

      expect(mockCalcDailyScore).toHaveBeenCalledWith(expect.objectContaining({ skipWorkoutFactor: false }));
    });

    it('passes skipWorkoutFactor=true when active plan has empty scheduledDays (FIX-09)', () => {
      setupFitnessStore({
        trainingPlans: [{ id: 'p1', name: 'Plan', status: 'active' }],
        trainingPlanDays: [], // plan exists but no days scheduled
      });

      renderHook(() => useDailyScore());

      expect(mockCalcDailyScore).toHaveBeenCalledWith(expect.objectContaining({ skipWorkoutFactor: true }));
    });
  });

  describe('color based on score', () => {
    it('returns emerald color from score result', () => {
      mockCalcDailyScore.mockReturnValue({
        ...defaultScoreResult,
        totalScore: 85,
        color: 'emerald',
      });

      const { result } = renderHook(() => useDailyScore());
      expect(result.current.color).toBe('emerald');
      expect(result.current.totalScore).toBe(85);
    });

    it('returns amber color from score result', () => {
      mockCalcDailyScore.mockReturnValue({
        ...defaultScoreResult,
        totalScore: 55,
        color: 'amber',
      });

      const { result } = renderHook(() => useDailyScore());
      expect(result.current.color).toBe('amber');
    });

    it('returns slate color from score result', () => {
      mockCalcDailyScore.mockReturnValue({
        ...defaultScoreResult,
        totalScore: 20,
        color: 'slate',
      });

      const { result } = renderHook(() => useDailyScore());
      expect(result.current.color).toBe('slate');
    });
  });

  describe('morning partial data', () => {
    it('handles morning with no meals and no workout yet', () => {
      vi.setSystemTime(new Date('2025-01-15T07:30:00'));
      setupDayPlanStore({ dayPlans: [] });
      setupFitnessStore({ workouts: [], weightEntries: [] });
      mockCalcDailyScore.mockReturnValue({
        ...defaultScoreResult,
        totalScore: 40,
        color: 'amber',
        factors: {
          calories: null,
          protein: null,
          workout: null,
          weightLog: 0,
          streak: 0,
        },
      });

      const { result } = renderHook(() => useDailyScore());

      expect(result.current.greeting).toBe('Chào buổi sáng!');
      expect(result.current.factors.calories).toBeNull();
      expect(result.current.factors.protein).toBeNull();
      expect(result.current.factors.workout).toBeNull();
      expect(mockCalcDailyScore).toHaveBeenCalledWith(
        expect.objectContaining({
          isBeforeEvening: true,
          workoutCompleted: false,
          actualCalories: undefined,
          actualProteinG: undefined,
        }),
      );
    });

    it('handles morning with breakfast logged only', () => {
      vi.setSystemTime(new Date('2025-01-15T08:30:00'));
      const today = todayStr();
      setupDayPlanStore({
        dayPlans: [
          {
            date: today,
            breakfastDishIds: ['d1'],
            lunchDishIds: [],
            dinnerDishIds: [],
          },
        ],
      });
      mockCalcNutrition.mockReturnValue({
        calories: 400,
        protein: 25,
        carbs: 50,
        fat: 15,
        fiber: 5,
      });
      mockCalcDailyScore.mockReturnValue({
        ...defaultScoreResult,
        totalScore: 35,
        color: 'slate',
        factors: {
          calories: 30,
          protein: 20,
          workout: null,
          weightLog: 0,
          streak: 0,
        },
      });

      const { result } = renderHook(() => useDailyScore());

      expect(result.current.greeting).toBe('Chào buổi sáng!');
      expect(result.current.totalScore).toBe(35);
      expect(mockCalcDailyScore).toHaveBeenCalledWith(
        expect.objectContaining({
          actualCalories: 400,
          actualProteinG: 25,
          targetCalories: 2000,
          targetProteinG: 150,
        }),
      );
    });
  });

  describe('nutrition targets passthrough', () => {
    it('passes nutrition targets from useNutritionTargets', () => {
      mockNutritionTargets.mockReturnValue({
        targetCalories: 2500,
        targetProtein: 180,
        targetFat: 80,
        targetCarbs: 300,
        bmr: 1800,
        tdee: 2500,
      });

      renderHook(() => useDailyScore());

      expect(mockCalcDailyScore).toHaveBeenCalledWith(
        expect.objectContaining({
          targetCalories: 2500,
          targetProteinG: 180,
        }),
      );
    });
  });

  describe('heroContext determination', () => {
    const today = '2025-01-15';

    function setupNotFirstTimeUser(
      overrides: {
        fitnessOverrides?: Record<string, unknown>;
        dayPlanOverrides?: Record<string, unknown>;
      } = {},
    ) {
      setupHealthProfileStore({
        profile: {
          ...DEFAULT_HEALTH_PROFILE,
          dateOfBirth: '1996-05-15',
        },
      });
      setupDayPlanStore({
        dayPlans: [
          {
            date: '2025-01-14',
            breakfastDishIds: ['d1'],
            lunchDishIds: [],
            dinnerDishIds: [],
          },
        ],
        ...overrides.dayPlanOverrides,
      });
      setupFitnessStore({
        workouts: [{ id: 'w-hist', date: '2025-01-14', name: 'Hist', createdAt: '', updatedAt: '' }],
        ...overrides.fitnessOverrides,
      });
    }

    it('returns first-time for default profile', () => {
      const { result } = renderHook(() => useDailyScore());
      expect(result.current.heroContext).toBe('first-time');
    });

    it('returns rest-day-with-meals when rest day and meals logged today', () => {
      setupNotFirstTimeUser({
        fitnessOverrides: {
          workouts: [{ id: 'w-hist', date: '2025-01-14', name: 'Hist', createdAt: '', updatedAt: '' }],
          trainingPlans: [{ id: 'p1', name: 'Plan', status: 'active' }],
          trainingPlanDays: [{ id: 'pd1', planId: 'p1', dayOfWeek: 1 }],
        },
        dayPlanOverrides: {
          dayPlans: [
            { date: '2025-01-14', breakfastDishIds: ['d1'], lunchDishIds: [], dinnerDishIds: [] },
            { date: today, breakfastDishIds: ['d2'], lunchDishIds: [], dinnerDishIds: [] },
          ],
        },
      });

      const { result } = renderHook(() => useDailyScore());
      expect(result.current.heroContext).toBe('rest-day-with-meals');
    });

    it('returns rest-day-empty when rest day and no meals today', () => {
      setupNotFirstTimeUser({
        fitnessOverrides: {
          workouts: [{ id: 'w-hist', date: '2025-01-14', name: 'Hist', createdAt: '', updatedAt: '' }],
          trainingPlans: [{ id: 'p1', name: 'Plan', status: 'active' }],
          trainingPlanDays: [{ id: 'pd1', planId: 'p1', dayOfWeek: 1 }],
        },
      });

      const { result } = renderHook(() => useDailyScore());
      expect(result.current.heroContext).toBe('rest-day-empty');
    });

    it('returns training-day-needs-workout when training day, no workout, has meals', () => {
      setupNotFirstTimeUser({
        fitnessOverrides: {
          workouts: [{ id: 'w-hist', date: '2025-01-14', name: 'Hist', createdAt: '', updatedAt: '' }],
          trainingPlans: [{ id: 'p1', name: 'Plan', status: 'active' }],
          trainingPlanDays: [{ id: 'pd1', planId: 'p1', dayOfWeek: 3 }],
        },
        dayPlanOverrides: {
          dayPlans: [
            { date: '2025-01-14', breakfastDishIds: ['d1'], lunchDishIds: [], dinnerDishIds: [] },
            { date: today, breakfastDishIds: ['d2'], lunchDishIds: [], dinnerDishIds: [] },
          ],
        },
      });

      const { result } = renderHook(() => useDailyScore());
      expect(result.current.heroContext).toBe('training-day-needs-workout');
    });

    it('returns workout-done-needs-fuel when workout done but no meals today', () => {
      setupNotFirstTimeUser({
        fitnessOverrides: {
          workouts: [
            { id: 'w-hist', date: '2025-01-14', name: 'Hist', createdAt: '', updatedAt: '' },
            { id: 'w-today', date: today, name: 'Push', createdAt: '', updatedAt: '' },
          ],
        },
      });

      const { result } = renderHook(() => useDailyScore());
      expect(result.current.heroContext).toBe('workout-done-needs-fuel');
    });

    it('returns balanced-day when workout done and meals logged', () => {
      setupNotFirstTimeUser({
        fitnessOverrides: {
          workouts: [
            { id: 'w-hist', date: '2025-01-14', name: 'Hist', createdAt: '', updatedAt: '' },
            { id: 'w-today', date: today, name: 'Push', createdAt: '', updatedAt: '' },
          ],
        },
        dayPlanOverrides: {
          dayPlans: [
            { date: '2025-01-14', breakfastDishIds: ['d1'], lunchDishIds: [], dinnerDishIds: [] },
            { date: today, breakfastDishIds: ['d2'], lunchDishIds: [], dinnerDishIds: [] },
          ],
        },
      });

      const { result } = renderHook(() => useDailyScore());
      expect(result.current.heroContext).toBe('balanced-day');
    });

    it('returns empty-day when no rest day, no workout, no meals', () => {
      setupNotFirstTimeUser();

      const { result } = renderHook(() => useDailyScore());
      expect(result.current.heroContext).toBe('empty-day');
    });
  });
});
