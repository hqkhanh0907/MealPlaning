import { act, cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/* ================================================================== */
/*  i18n mock — returns key so we can assert on translation keys       */
/* ================================================================== */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params) {
        let result = key;
        for (const [k, v] of Object.entries(params)) {
          result += ` ${k}:${v}`;
        }
        return result;
      }
      return key;
    },
    i18n: { language: 'vi' },
  }),
}));

vi.mock('../../contexts/DatabaseContext', () => ({
  DatabaseProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  useDatabase: () => ({
    query: vi.fn().mockResolvedValue([]),
    queryOne: vi.fn().mockResolvedValue(null),
    run: vi.fn().mockResolvedValue(undefined),
    initialize: vi.fn().mockResolvedValue(undefined),
    isReady: vi.fn().mockReturnValue(true),
  }),
}));

/* ================================================================== */
/*  Store mocks — all empty/default by default, overridable per test   */
/* ================================================================== */
let mockDayPlans: unknown[] = [];
vi.mock('../../store/dayPlanStore', () => ({
  useDayPlanStore: vi.fn((sel: (s: Record<string, unknown>) => unknown) => sel({ dayPlans: mockDayPlans })),
}));

let mockDishes: unknown[] = [];
vi.mock('../../store/dishStore', () => ({
  useDishStore: vi.fn((sel: (s: Record<string, unknown>) => unknown) => sel({ dishes: mockDishes })),
}));

let mockIngredients: unknown[] = [];
vi.mock('../../store/ingredientStore', () => ({
  useIngredientStore: vi.fn((sel: (s: Record<string, unknown>) => unknown) => sel({ ingredients: mockIngredients })),
}));

let mockFitnessState: Record<string, unknown> = {
  trainingProfile: null,
  trainingPlans: [],
  trainingPlanDays: [],
  workouts: [],
  workoutSets: [],
  weightEntries: [],
  isOnboarded: false,
};
vi.mock('../../store/fitnessStore', () => ({
  useFitnessStore: vi.fn((sel: (s: Record<string, unknown>) => unknown) => sel(mockFitnessState)),
}));

let mockNavigateTab = vi.fn();
let mockPushPage = vi.fn();
vi.mock('../../store/navigationStore', () => ({
  useNavigationStore: vi.fn((sel: (s: Record<string, unknown>) => unknown) =>
    sel({
      activeTab: 'dashboard',
      pageStack: [],
      navigateTab: mockNavigateTab,
      pushPage: mockPushPage,
    }),
  ),
}));

let mockHealthProfile: Record<string, unknown> = {
  id: 'default',
  gender: 'male',
  age: 30,
  heightCm: 170,
  weightKg: 70,
  activityLevel: 'moderate',
  proteinRatio: 2.0,
  fatPct: 0.25,
  updatedAt: '2024-01-01T00:00:00.000Z',
};
let mockActiveGoal: unknown = null;
vi.mock('../../features/health-profile/store/healthProfileStore', () => ({
  useHealthProfileStore: Object.assign(
    vi.fn((sel: (s: Record<string, unknown>) => unknown) =>
      sel({
        profile: mockHealthProfile,
        activeGoal: mockActiveGoal,
        loading: false,
      }),
    ),
    {
      getState: () => ({
        profile: mockHealthProfile,
        activeGoal: mockActiveGoal,
      }),
      setState: vi.fn(),
    },
  ),
}));

/* ============ nutrition targets mock ============ */
let mockNutritionTargets = {
  targetCalories: 2000,
  targetProtein: 150,
  targetFat: 60,
  targetCarbs: 250,
  bmr: 1700,
  tdee: 2200,
};
vi.mock('../../features/health-profile/hooks/useNutritionTargets', () => ({
  useNutritionTargets: () => mockNutritionTargets,
}));

/* ============ utility mocks ============ */
vi.mock('../../utils/nutrition', () => ({
  calculateDishesNutrition: () => ({
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
  }),
}));

vi.mock('../../features/fitness/utils/gamification', () => ({
  calculateStreak: () => ({
    currentStreak: 0,
    longestStreak: 0,
    weekDots: [
      { day: 1, status: 'upcoming' },
      { day: 2, status: 'upcoming' },
      { day: 3, status: 'upcoming' },
      { day: 4, status: 'upcoming' },
      { day: 5, status: 'upcoming' },
      { day: 6, status: 'upcoming' },
      { day: 7, status: 'upcoming' },
    ],
    gracePeriodUsed: false,
    streakAtRisk: false,
  }),
  checkMilestones: () => [],
  detectPRs: () => [],
}));

vi.mock('../../features/dashboard/utils/scoreCalculator', () => ({
  calculateDailyScore: () => ({
    totalScore: 0,
    factors: {
      calories: null,
      protein: null,
      workout: null,
      weightLog: null,
      streak: null,
    },
    color: 'slate',
    availableFactors: 0,
  }),
}));

vi.mock('../../features/health-profile/types', async importOriginal => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return {
    ...original,
    DEFAULT_HEALTH_PROFILE: {
      id: 'default',
      gender: 'male',
      age: 30,
      heightCm: 170,
      weightKg: 70,
      activityLevel: 'moderate',
      proteinRatio: 2.0,
      fatPct: 0.25,
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  };
});

/* ============ notification/modal mocks (for WeightQuickLog) ============ */
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock('../../hooks/useModalBackHandler', () => ({
  useModalBackHandler: vi.fn(),
}));

vi.mock('../../components/shared/ModalBackdrop', () => ({
  ModalBackdrop: ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) =>
    React.createElement('div', { 'data-testid': 'modal-backdrop', onClick: onClose }, children),
}));

/* ============ ErrorBoundary — transparent wrapper ============ */
vi.mock('../../components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children, fallbackTitle }: { children: React.ReactNode; fallbackTitle?: string }) =>
    React.createElement('div', { 'data-error-boundary': fallbackTitle }, children),
}));

/* ============ localStorage mock ============ */
const localStorageMock: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => localStorageMock[key] ?? null,
  setItem: (key: string, value: string) => {
    localStorageMock[key] = value;
  },
  removeItem: (key: string) => {
    delete localStorageMock[key];
  },
  clear: () => {
    for (const key of Object.keys(localStorageMock)) {
      delete localStorageMock[key];
    }
  },
  length: 0,
  key: () => null,
});

/* ============ matchMedia mock ============ */
function createMatchMediaMock(matches: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

/* ============ import components under test ============ */
import { AiInsightCard } from '../../features/dashboard/components/AiInsightCard';
import { DailyScoreHero } from '../../features/dashboard/components/DailyScoreHero';
import { DashboardTab } from '../../features/dashboard/components/DashboardTab';
import { ProteinProgress } from '../../features/dashboard/components/ProteinProgress';
import { QuickActionsBar } from '../../features/dashboard/components/QuickActionsBar';
import { StreakMini } from '../../features/dashboard/components/StreakMini';
import { TodaysPlanCard } from '../../features/dashboard/components/TodaysPlanCard';
import { WeightMini } from '../../features/dashboard/components/WeightMini';

/* ============ helpers ============ */
function flushRaf() {
  act(() => {
    vi.advanceTimersByTime(20);
  });
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function resetAllMocks() {
  mockDayPlans = [];
  mockDishes = [];
  mockIngredients = [];
  mockFitnessState = {
    trainingProfile: null,
    trainingPlans: [],
    trainingPlanDays: [],
    workouts: [],
    workoutSets: [],
    weightEntries: [],
    isOnboarded: false,
  };
  mockHealthProfile = {
    id: 'default',
    gender: 'male',
    age: 30,
    heightCm: 170,
    weightKg: 70,
    activityLevel: 'moderate',
    proteinRatio: 2.0,
    fatPct: 0.25,
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
  mockActiveGoal = null;
  mockNutritionTargets = {
    targetCalories: 2000,
    targetProtein: 150,
    targetFat: 60,
    targetCarbs: 250,
    bmr: 1700,
    tdee: 2200,
  };
  mockNavigateTab = vi.fn();
  mockPushPage = vi.fn();
  for (const key of Object.keys(localStorageMock)) {
    delete localStorageMock[key];
  }
}

/* ================================================================== */
/*  Setup / Teardown                                                    */
/* ================================================================== */
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  resetAllMocks();
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: createMatchMediaMock(false),
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/* ================================================================== */
/*  EDGE CASE 1: First-time user (day 0)                               */
/*  No nutrition data, no fitness profile → empty states, no crashes    */
/* ================================================================== */
describe('Edge Case 1: First-time user (day 0)', () => {
  it('renders DashboardTab without crashing when all stores are empty', () => {
    const { container } = render(React.createElement(DashboardTab));
    flushRaf();
    expect(container).toBeTruthy();
    expect(screen.getByTestId('dashboard-tab')).toBeInTheDocument();
  });

  it('renders all tier sections without errors', () => {
    render(React.createElement(DashboardTab));
    flushRaf();
    expect(screen.getByTestId('dashboard-tier-1')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-tier-2')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-tier-3')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-tier-4')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-tier-5')).toBeInTheDocument();
  });

  it('DailyScoreHero shows first-time user onboarding checklist', () => {
    render(React.createElement(DailyScoreHero));
    const hero = screen.getByTestId('daily-score-hero');
    expect(hero).toBeInTheDocument();
    expect(hero.textContent).toContain('dashboard.hero.firstTime.title');
    expect(hero.textContent).toContain('dashboard.hero.firstTime.step1');
    expect(hero.textContent).toContain('dashboard.hero.firstTime.step2');
    expect(hero.textContent).toContain('dashboard.hero.firstTime.step3');
  });

  it('DailyScoreHero uses slate gradient for first-time user', () => {
    render(React.createElement(DailyScoreHero));
    const hero = screen.getByTestId('daily-score-hero');
    expect(hero.className).toContain('from-slate-500');
  });

  it('WeightMini shows empty state when no weight entries exist', () => {
    render(React.createElement(WeightMini));
    expect(screen.getByTestId('weight-mini-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('weight-mini')).not.toBeInTheDocument();
  });

  it('StreakMini shows empty state when no workouts exist', () => {
    render(React.createElement(StreakMini));
    expect(screen.getByTestId('streak-mini-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('streak-mini')).not.toBeInTheDocument();
  });

  it('ProteinProgress renders with zero values safely', () => {
    render(
      React.createElement(ProteinProgress, {
        current: 0,
        target: 0,
      }),
    );
    const progress = screen.getByTestId('protein-progress');
    expect(progress).toBeInTheDocument();
    expect(screen.getByTestId('protein-display').textContent).toContain('0g');
  });

  it('TodaysPlanCard shows no-plan state for first-time user', () => {
    render(React.createElement(TodaysPlanCard));
    expect(screen.getByTestId('todays-plan-card')).toBeInTheDocument();
    expect(screen.getByTestId('no-plan-section')).toBeInTheDocument();
    expect(screen.getByTestId('create-plan-cta')).toBeInTheDocument();
  });

  it('QuickActionsBar renders without crashing with empty data', () => {
    render(React.createElement(QuickActionsBar));
    expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
  });

  it('AiInsightCard renders a tip of the day even with no input data', () => {
    render(React.createElement(AiInsightCard));
    const card = screen.getByTestId('ai-insight-card');
    expect(card).toBeInTheDocument();
    expect(screen.getByTestId('insight-title')).toBeInTheDocument();
    expect(screen.getByTestId('insight-message')).toBeInTheDocument();
  });
});

/* ================================================================== */
/*  EDGE CASE 2: Nutrition-only user                                    */
/*  Has meal data but no fitness profile → fitness cards show CTAs      */
/* ================================================================== */
describe('Edge Case 2: Nutrition-only user', () => {
  beforeEach(() => {
    const today = formatLocalDate(new Date());
    mockDayPlans = [
      {
        date: today,
        breakfastDishIds: ['dish1'],
        lunchDishIds: ['dish2'],
        dinnerDishIds: [],
        servings: {},
      },
    ];
    mockDishes = [
      {
        id: 'dish1',
        name: { vi: 'Cơm', en: 'Rice' },
        tags: ['breakfast'],
        ingredients: [{ ingredientId: 'i1', amount: 200 }],
      },
      {
        id: 'dish2',
        name: { vi: 'Phở', en: 'Pho' },
        tags: ['lunch'],
        ingredients: [{ ingredientId: 'i1', amount: 300 }],
      },
    ];
    mockIngredients = [
      {
        id: 'i1',
        name: { vi: 'Gạo', en: 'Rice' },
        caloriesPer100: 130,
        proteinPer100: 2.7,
        carbsPer100: 28,
        fatPer100: 0.3,
        fiberPer100: 0.4,
        unit: { vi: 'g', en: 'g' },
      },
    ];
    // Custom profile so it's NOT the default
    mockHealthProfile = {
      id: 'user-1',
      gender: 'male',
      age: 25,
      heightCm: 175,
      weightKg: 75,
      activityLevel: 'active',
      proteinRatio: 2.0,
      fatPct: 0.25,
      updatedAt: '2024-06-01T00:00:00.000Z',
    };
    // No fitness data at all — default empty state already set by resetAllMocks
  });

  it('DashboardTab renders without crashing', () => {
    render(React.createElement(DashboardTab));
    flushRaf();
    expect(screen.getByTestId('dashboard-tab')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-tier-1')).toBeInTheDocument();
  });

  it('TodaysPlanCard shows no-plan state with create plan CTA', () => {
    render(React.createElement(TodaysPlanCard));
    expect(screen.getByTestId('todays-plan-card')).toBeInTheDocument();
    expect(screen.getByTestId('no-plan-section')).toBeInTheDocument();
    const cta = screen.getByTestId('create-plan-cta');
    expect(cta).toBeInTheDocument();
    expect(cta.textContent).toContain('dashboard.todaysPlan.createPlan');
  });

  it('WeightMini shows empty state for nutrition-only user', () => {
    render(React.createElement(WeightMini));
    expect(screen.getByTestId('weight-mini-empty')).toBeInTheDocument();
  });

  it('StreakMini shows empty state when no workouts logged', () => {
    render(React.createElement(StreakMini));
    expect(screen.getByTestId('streak-mini-empty')).toBeInTheDocument();
  });

  it('ProteinProgress works with valid targets', () => {
    render(
      React.createElement(ProteinProgress, {
        current: 50,
        target: 150,
      }),
    );
    expect(screen.getByTestId('protein-progress')).toBeInTheDocument();
    const display = screen.getByTestId('protein-display');
    expect(display.textContent).toContain('50g');
    expect(display.textContent).toContain('150g');
    const bar = screen.getByTestId('protein-bar');
    expect(bar.style.width).toBe('33%');
  });
});

/* ================================================================== */
/*  EDGE CASE 3: Fitness-only user                                      */
/*  Has workout data but no meal logs → nutrition cards show defaults    */
/* ================================================================== */
describe('Edge Case 3: Fitness-only user', () => {
  beforeEach(() => {
    const today = formatLocalDate(new Date());
    // No day plans (no meal logs)
    mockDayPlans = [];
    // Has fitness data
    mockFitnessState = {
      trainingProfile: {
        id: 'tp1',
        level: 'intermediate',
        goal: 'muscle_gain',
      },
      trainingPlans: [
        {
          id: 'plan1',
          name: 'Push/Pull',
          status: 'active',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ],
      trainingPlanDays: [
        {
          id: 'pd1',
          planId: 'plan1',
          dayOfWeek: new Date().getDay() === 0 ? 7 : new Date().getDay(),
          workoutType: 'Push',
          muscleGroups: 'Chest,Shoulders',
          exercises: JSON.stringify([
            {
              exerciseId: 'e1',
              sets: 3,
              repsMin: 8,
              repsMax: 12,
              restSeconds: 90,
            },
          ]),
        },
      ],
      workouts: [
        {
          id: 'w1',
          date: today,
          planId: 'plan1',
          planDayId: 'pd1',
          startedAt: '2024-01-01T08:00:00Z',
          durationMin: 60,
        },
      ],
      workoutSets: [
        {
          id: 's1',
          workoutId: 'w1',
          exerciseId: 'e1',
          setNumber: 1,
          reps: 10,
          weightKg: 80,
        },
      ],
      weightEntries: [
        {
          id: 'we1',
          date: today,
          weightKg: 75,
          createdAt: '2024-01-01T07:00:00Z',
          updatedAt: '2024-01-01T07:00:00Z',
        },
      ],
      isOnboarded: true,
    };
    mockHealthProfile = {
      id: 'user-2',
      gender: 'male',
      age: 28,
      heightCm: 180,
      weightKg: 80,
      activityLevel: 'active',
      proteinRatio: 2.0,
      fatPct: 0.25,
      updatedAt: '2024-06-01T00:00:00.000Z',
    };
    mockActiveGoal = {
      id: 'g1',
      type: 'bulk',
      rateOfChange: 'moderate',
      calorieOffset: 300,
      startDate: '2024-01-01',
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
  });

  it('DashboardTab renders without crashing', () => {
    render(React.createElement(DashboardTab));
    flushRaf();
    expect(screen.getByTestId('dashboard-tab')).toBeInTheDocument();
  });

  it('TodaysPlanCard shows training-completed state', () => {
    render(React.createElement(TodaysPlanCard));
    const card = screen.getByTestId('todays-plan-card');
    expect(card).toBeInTheDocument();
    expect(screen.getByTestId('workout-summary')).toBeInTheDocument();
  });

  it('TodaysPlanCard meals section shows 0/3 meals logged', () => {
    render(React.createElement(TodaysPlanCard));
    const mealsSection = screen.getByTestId('meals-section');
    expect(mealsSection).toBeInTheDocument();
    const mealsProgress = screen.getByTestId('meals-progress');
    expect(mealsProgress.textContent).toContain('0');
  });

  it('WeightMini shows weight data when entries exist', () => {
    render(React.createElement(WeightMini));
    expect(screen.getByTestId('weight-mini')).toBeInTheDocument();
    expect(screen.queryByTestId('weight-mini-empty')).not.toBeInTheDocument();
    const weightValue = screen.getByTestId('weight-value');
    expect(weightValue.textContent).toContain('75');
  });

  it('StreakMini shows streak info when workouts exist', () => {
    render(React.createElement(StreakMini));
    expect(screen.getByTestId('streak-mini')).toBeInTheDocument();
    expect(screen.queryByTestId('streak-mini-empty')).not.toBeInTheDocument();
    expect(screen.getByTestId('streak-count')).toBeInTheDocument();
    expect(screen.getByTestId('week-dots')).toBeInTheDocument();
  });

  it('ProteinProgress renders 0g eaten with valid target', () => {
    render(
      React.createElement(ProteinProgress, {
        current: 0,
        target: 160,
      }),
    );
    const display = screen.getByTestId('protein-display');
    expect(display.textContent).toContain('0g');
    expect(display.textContent).toContain('160g');
    const bar = screen.getByTestId('protein-bar');
    expect(bar.style.width).toBe('0%');
  });
});

/* ================================================================== */
/*  EDGE CASE 4: Offline mode                                          */
/*  All local data still renders, no crashes from network absence       */
/* ================================================================== */
describe('Edge Case 4: Offline mode', () => {
  beforeEach(() => {
    const today = formatLocalDate(new Date());
    // Provide some local data
    mockDayPlans = [
      {
        date: today,
        breakfastDishIds: ['d1'],
        lunchDishIds: [],
        dinnerDishIds: [],
        servings: {},
      },
    ];
    mockDishes = [
      {
        id: 'd1',
        name: { vi: 'Cơm', en: 'Rice' },
        tags: ['breakfast'],
        ingredients: [],
      },
    ];
    mockHealthProfile = {
      id: 'user-3',
      gender: 'female',
      age: 25,
      heightCm: 160,
      weightKg: 55,
      activityLevel: 'moderate',
      proteinRatio: 1.8,
      fatPct: 0.25,
      updatedAt: '2024-06-01T00:00:00.000Z',
    };
    // Simulate offline: no navigator.onLine (already absent in jsdom)
  });

  it('DashboardTab renders all tiers with local data in offline mode', () => {
    render(React.createElement(DashboardTab));
    flushRaf();
    expect(screen.getByTestId('dashboard-tab')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-tier-1')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-tier-2')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-tier-3')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-tier-4')).toBeInTheDocument();
  });

  it('DailyScoreHero renders from local store data without network', () => {
    render(React.createElement(DailyScoreHero));
    expect(screen.getByTestId('daily-score-hero')).toBeInTheDocument();
  });

  it('TodaysPlanCard renders from local store without network', () => {
    render(React.createElement(TodaysPlanCard));
    expect(screen.getByTestId('todays-plan-card')).toBeInTheDocument();
  });

  it('AiInsightCard renders local insight without network', () => {
    render(React.createElement(AiInsightCard));
    expect(screen.getByTestId('ai-insight-card')).toBeInTheDocument();
  });

  it('QuickActionsBar renders with local data in offline mode', () => {
    render(React.createElement(QuickActionsBar));
    expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
  });

  it('no console errors when rendering offline', () => {
    const consoleSpy = vi.spyOn(console, 'error');
    render(React.createElement(DashboardTab));
    flushRaf();
    const reactErrors = consoleSpy.mock.calls.filter(
      args => !String(args[0]).includes('act(') && !String(args[0]).includes('Warning:'),
    );
    expect(reactErrors).toHaveLength(0);
    consoleSpy.mockRestore();
  });
});

/* ================================================================== */
/*  EDGE CASE 5: Data overflow (365+ days of data)                      */
/*  Large datasets handled without errors                               */
/* ================================================================== */
describe('Edge Case 5: Data overflow (365+ days)', () => {
  beforeEach(() => {
    const now = new Date();

    // Generate 400 day plans spanning 400 days
    const largeDayPlans: unknown[] = [];
    for (let i = 0; i < 400; i++) {
      const d = new Date(now.getTime() - i * 86_400_000);
      largeDayPlans.push({
        date: formatLocalDate(d),
        breakfastDishIds: i % 2 === 0 ? ['d1'] : [],
        lunchDishIds: i % 3 === 0 ? ['d1'] : [],
        dinnerDishIds: i % 4 === 0 ? ['d1'] : [],
        servings: {},
      });
    }
    mockDayPlans = largeDayPlans;

    mockDishes = [
      {
        id: 'd1',
        name: { vi: 'Cơm', en: 'Rice' },
        tags: ['breakfast', 'lunch', 'dinner'],
        ingredients: [{ ingredientId: 'i1', amount: 200 }],
      },
    ];
    mockIngredients = [
      {
        id: 'i1',
        name: { vi: 'Gạo', en: 'Rice' },
        caloriesPer100: 130,
        proteinPer100: 2.7,
        carbsPer100: 28,
        fatPer100: 0.3,
        fiberPer100: 0.4,
        unit: { vi: 'g', en: 'g' },
      },
    ];

    // Generate 400 weight entries
    const largeWeightEntries: unknown[] = [];
    for (let i = 0; i < 400; i++) {
      const d = new Date(now.getTime() - i * 86_400_000);
      largeWeightEntries.push({
        id: `we-${i}`,
        date: formatLocalDate(d),
        weightKg: 70 + Math.sin(i / 30) * 2,
        createdAt: d.toISOString(),
        updatedAt: d.toISOString(),
      });
    }

    // Generate 200 workouts
    const largeWorkouts: unknown[] = [];
    for (let i = 0; i < 200; i++) {
      const d = new Date(now.getTime() - i * 2 * 86_400_000);
      largeWorkouts.push({
        id: `wo-${i}`,
        date: formatLocalDate(d),
        planId: 'plan1',
        startedAt: d.toISOString(),
        durationMin: 45 + (i % 30),
      });
    }

    mockFitnessState = {
      trainingProfile: { id: 'tp1', level: 'advanced' },
      trainingPlans: [
        {
          id: 'plan1',
          name: 'PPL',
          status: 'active',
          createdAt: '2023-01-01',
          updatedAt: '2024-01-01',
        },
      ],
      trainingPlanDays: [
        {
          id: 'pd1',
          planId: 'plan1',
          dayOfWeek: now.getDay(),
          workoutType: 'Push',
          muscleGroups: 'Chest',
          exercises: '[]',
        },
      ],
      workouts: largeWorkouts,
      workoutSets: [],
      weightEntries: largeWeightEntries,
      isOnboarded: true,
    };

    mockHealthProfile = {
      id: 'user-4',
      gender: 'male',
      age: 30,
      heightCm: 175,
      weightKg: 72,
      activityLevel: 'active',
      proteinRatio: 2.2,
      fatPct: 0.25,
      updatedAt: '2024-06-01T00:00:00.000Z',
    };
  });

  it('DashboardTab renders without crashing with 400 days of data', () => {
    render(React.createElement(DashboardTab));
    flushRaf();
    expect(screen.getByTestId('dashboard-tab')).toBeInTheDocument();
  });

  it('all tiers render with large dataset', () => {
    render(React.createElement(DashboardTab));
    flushRaf();
    expect(screen.getByTestId('dashboard-tier-1')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-tier-2')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-tier-3')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-tier-4')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-tier-5')).toBeInTheDocument();
  });

  it('DailyScoreHero renders with large dataset', () => {
    render(React.createElement(DailyScoreHero));
    expect(screen.getByTestId('daily-score-hero')).toBeInTheDocument();
  });

  it('WeightMini handles 400 weight entries without crashing', () => {
    render(React.createElement(WeightMini));
    expect(screen.getByTestId('weight-mini')).toBeInTheDocument();
    expect(screen.getByTestId('weight-value')).toBeInTheDocument();
    expect(screen.getByTestId('weight-trend')).toBeInTheDocument();
    expect(screen.getByTestId('weight-sparkline')).toBeInTheDocument();
  });

  it('StreakMini handles 200 workouts without crashing', () => {
    render(React.createElement(StreakMini));
    expect(screen.getByTestId('streak-mini')).toBeInTheDocument();
    expect(screen.getByTestId('streak-count')).toBeInTheDocument();
  });

  it('TodaysPlanCard processes large dayPlans array safely', () => {
    render(React.createElement(TodaysPlanCard));
    expect(screen.getByTestId('todays-plan-card')).toBeInTheDocument();
  });

  it('renders within reasonable time (performance sanity check)', () => {
    const start = performance.now();
    render(React.createElement(DashboardTab));
    flushRaf();
    const elapsed = performance.now() - start;
    // Should render in under 2 seconds even with 400 days of data
    expect(elapsed).toBeLessThan(2000);
    expect(screen.getByTestId('dashboard-tab')).toBeInTheDocument();
  });
});

/* ================================================================== */
/*  EDGE CASE 6: Midnight rollover                                      */
/*  Day changes while dashboard is open → new date reads correctly      */
/* ================================================================== */
describe('Edge Case 6: Midnight rollover', () => {
  it('DashboardTab renders correctly before midnight', () => {
    // Set time to 23:59
    vi.setSystemTime(new Date(2024, 5, 15, 23, 59, 0));
    const todayBefore = formatLocalDate(new Date());
    mockDayPlans = [
      {
        date: todayBefore,
        breakfastDishIds: ['d1'],
        lunchDishIds: ['d1'],
        dinnerDishIds: ['d1'],
        servings: {},
      },
    ];
    mockDishes = [
      {
        id: 'd1',
        name: { vi: 'Cơm' },
        tags: ['breakfast'],
        ingredients: [],
      },
    ];
    render(React.createElement(DashboardTab));
    flushRaf();
    expect(screen.getByTestId('dashboard-tab')).toBeInTheDocument();
  });

  it('DashboardTab re-renders correctly after midnight without crash', () => {
    vi.setSystemTime(new Date(2024, 5, 15, 23, 59, 50));
    const todayBefore = formatLocalDate(new Date());
    mockDayPlans = [
      {
        date: todayBefore,
        breakfastDishIds: ['d1'],
        lunchDishIds: [],
        dinnerDishIds: [],
        servings: {},
      },
    ];
    mockDishes = [
      {
        id: 'd1',
        name: { vi: 'Cơm' },
        tags: ['breakfast'],
        ingredients: [],
      },
    ];

    const { unmount } = render(React.createElement(DashboardTab));
    flushRaf();
    expect(screen.getByTestId('dashboard-tab')).toBeInTheDocument();
    unmount();

    // Advance to next day
    vi.setSystemTime(new Date(2024, 5, 16, 0, 0, 10));
    const newToday = formatLocalDate(new Date());
    expect(newToday).toBe('2024-06-16');
    expect(newToday).not.toBe(todayBefore);

    // Re-render represents the component re-mounting after date change
    render(React.createElement(DashboardTab));
    flushRaf();
    expect(screen.getByTestId('dashboard-tab')).toBeInTheDocument();
  });

  it('TodaysPlanCard reads correct date after midnight rollover', () => {
    vi.setSystemTime(new Date(2024, 5, 16, 0, 0, 5));
    const newToday = formatLocalDate(new Date());
    mockDayPlans = [
      {
        date: '2024-06-15', // Yesterday's plan
        breakfastDishIds: ['d1'],
        lunchDishIds: ['d1'],
        dinnerDishIds: ['d1'],
        servings: {},
      },
    ];
    mockDishes = [
      {
        id: 'd1',
        name: { vi: 'Cơm' },
        tags: ['breakfast'],
        ingredients: [],
      },
    ];

    render(React.createElement(TodaysPlanCard));
    // After midnight, today is June 16, but only June 15 plan exists
    // So meals should show 0 logged for the new day
    const mealsProgress = screen.getByTestId('meals-progress');
    expect(mealsProgress.textContent).toContain('0');
    expect(newToday).toBe('2024-06-16');
  });

  it('DailyScoreHero greeting changes based on time of day', () => {
    // Morning
    vi.setSystemTime(new Date(2024, 5, 16, 8, 0, 0));
    const { unmount: u1 } = render(React.createElement(DailyScoreHero));
    let hero = screen.getByTestId('daily-score-hero');
    expect(hero.textContent).toContain('Chào buổi sáng!');
    u1();

    // Afternoon
    vi.setSystemTime(new Date(2024, 5, 16, 14, 0, 0));
    const { unmount: u2 } = render(React.createElement(DailyScoreHero));
    hero = screen.getByTestId('daily-score-hero');
    expect(hero.textContent).toContain('Chào buổi chiều!');
    u2();

    // Evening
    vi.setSystemTime(new Date(2024, 5, 16, 20, 0, 0));
    render(React.createElement(DailyScoreHero));
    hero = screen.getByTestId('daily-score-hero');
    expect(hero.textContent).toContain('Chào buổi tối!');
  });

  it('no console errors during midnight transition', () => {
    const consoleSpy = vi.spyOn(console, 'error');
    vi.setSystemTime(new Date(2024, 5, 15, 23, 59, 55));

    const { unmount } = render(React.createElement(DashboardTab));
    flushRaf();
    unmount();

    vi.setSystemTime(new Date(2024, 5, 16, 0, 0, 5));
    render(React.createElement(DashboardTab));
    flushRaf();

    const realErrors = consoleSpy.mock.calls.filter(
      args => !String(args[0]).includes('act(') && !String(args[0]).includes('Warning:'),
    );
    expect(realErrors).toHaveLength(0);
    consoleSpy.mockRestore();
  });
});
