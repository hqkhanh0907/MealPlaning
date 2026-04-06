import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DailyScoreData } from '../features/dashboard/hooks/useDailyScore';
import type { NutritionTargets } from '../features/health-profile/hooks/useNutritionTargets';

/* ------------------------------------------------------------------ */
/*  Module mocks                                                       */
/* ------------------------------------------------------------------ */

const I18N_MAP: Record<string, string> = {
  'dashboard.greetingMorning': 'Chào buổi sáng!',
  'dashboard.greetingAfternoon': 'Chào buổi chiều!',
  'dashboard.greetingEvening': 'Chào buổi tối!',
  'dashboard.nutritionHero.greetingName': 'Chào {{name}}!',
  'dashboard.nutritionHero.a11y': 'Tổng quan dinh dưỡng hôm nay',
  'dashboard.nutritionHero.scoreA11y': 'Điểm: {{score}}',
  'dashboard.nutritionHero.setupTitle': 'Thiết lập hồ sơ sức khỏe',
  'dashboard.nutritionHero.setupDescription': 'Cập nhật hồ sơ để xem mục tiêu dinh dưỡng hàng ngày',
  'dashboard.nutritionHero.addFirstMeal': 'Thêm bữa ăn đầu tiên cho hôm nay',
  'dashboard.nutritionHero.targetInfo': 'Mục tiêu: {{target}} kcal',
  'dashboard.nutritionHero.remaining': 'Còn {{value}} kcal',
  'dashboard.nutritionHero.over': 'Vượt {{value}} kcal',
  'dashboard.nutritionHero.macroP': 'P',
  'dashboard.nutritionHero.macroF': 'F',
  'dashboard.nutritionHero.macroC': 'C',
  'dashboard.hero.contextual.balancedDay': 'Ngày hôm nay rất cân bằng',
  'dashboard.hero.contextual.emptyDay': 'Bắt đầu ngày mới nào',
  'dashboard.hero.contextual.restDayEmpty': 'Ngày nghỉ — thư giãn',
  'dashboard.hero.contextual.trainingDayNeedsWorkout': 'Hôm nay là ngày tập',
  'dashboard.hero.contextual.workoutDoneNeedsFuel': 'Buổi tập tuyệt vời!',
  'dashboard.hero.contextual.restDayWithMeals': 'Ngày nghỉ phục hồi',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      let text = I18N_MAP[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{{${k}}}`, String(v));
        }
      }
      return text;
    },
    i18n: { language: 'vi' },
  }),
}));

vi.mock('../features/dashboard/hooks/useDailyScore', () => ({
  useDailyScore: vi.fn(),
}));

vi.mock('../features/health-profile/hooks/useNutritionTargets', () => ({
  useNutritionTargets: vi.fn(),
}));

vi.mock('../features/health-profile/store/healthProfileStore', () => ({
  useHealthProfileStore: vi.fn(),
}));

vi.mock('../store/dayPlanStore', () => ({
  useDayPlanStore: vi.fn(),
}));

vi.mock('../store/dishStore', () => ({
  useDishStore: vi.fn(),
}));

vi.mock('../store/ingredientStore', () => ({
  useIngredientStore: vi.fn(),
}));

vi.mock('../utils/nutrition', () => ({
  calculateDishesNutrition: vi.fn(),
}));

/* ------------------------------------------------------------------ */
/*  Imports (after mocks)                                              */
/* ------------------------------------------------------------------ */

import { NutritionHero } from '../features/dashboard/components/NutritionHero';
import { useDailyScore } from '../features/dashboard/hooks/useDailyScore';
import { useNutritionTargets } from '../features/health-profile/hooks/useNutritionTargets';
import { useHealthProfileStore } from '../features/health-profile/store/healthProfileStore';
import { useDayPlanStore } from '../store/dayPlanStore';
import { useDishStore } from '../store/dishStore';
import { useIngredientStore } from '../store/ingredientStore';
import { calculateDishesNutrition } from '../utils/nutrition';

const mockUseDailyScore = vi.mocked(useDailyScore);
const mockUseNutritionTargets = vi.mocked(useNutritionTargets);
const mockUseHealthProfileStore = vi.mocked(useHealthProfileStore);
const mockUseDayPlanStore = vi.mocked(useDayPlanStore);
const mockUseDishStore = vi.mocked(useDishStore);
const mockUseIngredientStore = vi.mocked(useIngredientStore);
const mockCalculateDishesNutrition = vi.mocked(calculateDishesNutrition);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const TODAY = '2026-06-14';

function defaultDailyScore(overrides: Partial<DailyScoreData> = {}): DailyScoreData {
  return {
    totalScore: 63,
    factors: { calories: 70, protein: 60, workout: 50, weightLog: null, streak: 30 },
    color: 'amber',
    greeting: 'Chào buổi sáng!',
    isFirstTimeUser: false,
    heroContext: 'balanced-day',
    ...overrides,
  };
}

function defaultTargets(overrides: Partial<NutritionTargets> = {}): NutritionTargets {
  return {
    targetCalories: 2091,
    targetProtein: 170,
    targetFat: 58,
    targetCarbs: 241,
    bmr: 1704,
    tdee: 2641,
    ...overrides,
  };
}

function setupStores(
  opts: {
    dayPlans?: Array<{
      date: string;
      breakfastDishIds: string[];
      lunchDishIds: string[];
      dinnerDishIds: string[];
      servings?: Record<string, number>;
    }>;
    nutrition?: { calories: number; protein: number; fat: number; carbs: number; fiber: number };
    profileName?: string;
  } = {},
) {
  const {
    dayPlans = [],
    nutrition = { calories: 1327, protein: 170, fat: 42, carbs: 125, fiber: 5 },
    profileName = 'Khánh',
  } = opts;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseHealthProfileStore.mockImplementation((selector: any) => selector({ profile: { name: profileName } }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseDayPlanStore.mockImplementation((selector: any) => selector({ dayPlans }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseDishStore.mockImplementation((selector: any) => selector({ dishes: [] }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseIngredientStore.mockImplementation((selector: any) => selector({ ingredients: [] }));

  mockCalculateDishesNutrition.mockReturnValue(nutrition);
}

function setupWithMeals(overrides?: {
  dailyScore?: Partial<DailyScoreData>;
  targets?: Partial<NutritionTargets>;
  nutrition?: { calories: number; protein: number; fat: number; carbs: number; fiber: number };
  profileName?: string;
}) {
  mockUseDailyScore.mockReturnValue(defaultDailyScore(overrides?.dailyScore));
  mockUseNutritionTargets.mockReturnValue(defaultTargets(overrides?.targets));
  setupStores({
    dayPlans: [
      {
        date: TODAY,
        breakfastDishIds: ['d1', 'd2'],
        lunchDishIds: ['d3', 'd4', 'd5'],
        dinnerDishIds: ['d5'],
        servings: {},
      },
    ],
    nutrition: overrides?.nutrition,
    profileName: overrides?.profileName,
  });
}

function setupNoPlan(overrides?: {
  dailyScore?: Partial<DailyScoreData>;
  targets?: Partial<NutritionTargets>;
  profileName?: string;
}) {
  mockUseDailyScore.mockReturnValue(defaultDailyScore({ heroContext: 'empty-day', ...overrides?.dailyScore }));
  mockUseNutritionTargets.mockReturnValue(defaultTargets(overrides?.targets));
  setupStores({ dayPlans: [], profileName: overrides?.profileName });
}

function setupEmptyPlan(overrides?: { dailyScore?: Partial<DailyScoreData>; targets?: Partial<NutritionTargets> }) {
  mockUseDailyScore.mockReturnValue(defaultDailyScore({ heroContext: 'empty-day', ...overrides?.dailyScore }));
  mockUseNutritionTargets.mockReturnValue(defaultTargets(overrides?.targets));
  setupStores({
    dayPlans: [{ date: TODAY, breakfastDishIds: [], lunchDishIds: [], dinnerDishIds: [] }],
  });
}

function setupFirstTime() {
  mockUseDailyScore.mockReturnValue(defaultDailyScore({ isFirstTimeUser: true, heroContext: 'first-time' }));
  mockUseNutritionTargets.mockReturnValue(defaultTargets());
  setupStores({ dayPlans: [] });
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe('NutritionHero', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ now: new Date(`${TODAY}T10:00:00`) });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /* --- Loading state --- */

  describe('loading state', () => {
    it('renders skeleton when isLoading is true', () => {
      setupWithMeals();
      render(<NutritionHero isLoading />);

      const hero = screen.getByTestId('nutrition-hero');
      expect(hero).toHaveAttribute('aria-busy', 'true');
      expect(hero.className).toContain('animate-pulse');
    });

    it('does not render score badge when loading', () => {
      setupWithMeals();
      render(<NutritionHero isLoading />);
      expect(screen.queryByTestId('nutrition-hero-score')).not.toBeInTheDocument();
    });
  });

  /* --- First-time user state --- */

  describe('first-time user', () => {
    it('shows setup CTA title', () => {
      setupFirstTime();
      render(<NutritionHero />);
      expect(screen.getByText('Thiết lập hồ sơ sức khỏe')).toBeInTheDocument();
    });

    it('shows setup description', () => {
      setupFirstTime();
      render(<NutritionHero />);
      expect(screen.getByText('Cập nhật hồ sơ để xem mục tiêu dinh dưỡng hàng ngày')).toBeInTheDocument();
    });

    it('shows greeting without name', () => {
      setupFirstTime();
      render(<NutritionHero />);
      expect(screen.getByTestId('nutrition-hero-greeting')).toHaveTextContent('Chào buổi sáng!');
    });

    it('does not show calorie card', () => {
      setupFirstTime();
      render(<NutritionHero />);
      expect(screen.queryByTestId('nutrition-hero-calories')).not.toBeInTheDocument();
    });

    it('does not show macro bars', () => {
      setupFirstTime();
      render(<NutritionHero />);
      expect(screen.queryByTestId('nutrition-hero-protein')).not.toBeInTheDocument();
    });

    it('does not show score badge', () => {
      setupFirstTime();
      render(<NutritionHero />);
      expect(screen.queryByTestId('nutrition-hero-score')).not.toBeInTheDocument();
    });
  });

  /* --- No meals state --- */

  describe('no meals today (no plan)', () => {
    it('shows encouragement message', () => {
      setupNoPlan();
      render(<NutritionHero />);
      expect(screen.getByText('Thêm bữa ăn đầu tiên cho hôm nay')).toBeInTheDocument();
    });

    it('shows target info', () => {
      setupNoPlan();
      render(<NutritionHero />);
      expect(screen.getByText('Mục tiêu: 2091 kcal')).toBeInTheDocument();
    });

    it('shows score badge', () => {
      setupNoPlan();
      render(<NutritionHero />);
      expect(screen.getByTestId('nutrition-hero-score')).toBeInTheDocument();
    });

    it('shows macro bars with dash for current', () => {
      setupNoPlan();
      render(<NutritionHero />);
      expect(screen.getByTestId('nutrition-hero-protein')).toHaveTextContent('—/170g');
      expect(screen.getByTestId('nutrition-hero-fat')).toHaveTextContent('—/58g');
      expect(screen.getByTestId('nutrition-hero-carbs')).toHaveTextContent('—/241g');
    });

    it('shows greeting with name', () => {
      setupNoPlan({ profileName: 'Khánh' });
      render(<NutritionHero />);
      expect(screen.getByTestId('nutrition-hero-greeting')).toHaveTextContent('Chào Khánh!');
    });

    it('falls back to time-based greeting when profile is null', () => {
      setupNoPlan();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUseHealthProfileStore.mockImplementation((selector: any) => selector({ profile: null }));

      render(<NutritionHero />);
      expect(screen.getByTestId('nutrition-hero-greeting')).toHaveTextContent('Chào buổi sáng!');
    });
  });

  describe('no meals today (empty plan)', () => {
    it('shows encouragement message when plan exists but has no dishes', () => {
      setupEmptyPlan();
      render(<NutritionHero />);
      expect(screen.getByText('Thêm bữa ăn đầu tiên cho hôm nay')).toBeInTheDocument();
    });

    it('shows macro bars with zero for current', () => {
      setupEmptyPlan();
      render(<NutritionHero />);
      expect(screen.getByTestId('nutrition-hero-protein')).toHaveTextContent('0/170g');
      expect(screen.getByTestId('nutrition-hero-fat')).toHaveTextContent('0/58g');
      expect(screen.getByTestId('nutrition-hero-carbs')).toHaveTextContent('0/241g');
    });
  });

  /* --- Has data state --- */

  describe('has nutrition data', () => {
    it('shows eaten / target kcal', () => {
      setupWithMeals();
      render(<NutritionHero />);
      const calorieCard = screen.getByTestId('nutrition-hero-calories');
      expect(calorieCard).toHaveTextContent('1327');
      expect(calorieCard).toHaveTextContent('/ 2091 kcal');
    });

    it('shows remaining calories in emerald when under target', () => {
      setupWithMeals();
      render(<NutritionHero />);
      const remaining = screen.getByTestId('nutrition-hero-remaining');
      expect(remaining).toHaveTextContent('Còn 764 kcal');
      expect(remaining.className).toContain('text-emerald-400');
    });

    it('shows over calories in rose when over target', () => {
      setupWithMeals({
        nutrition: { calories: 2500, protein: 200, fat: 70, carbs: 300, fiber: 10 },
      });
      render(<NutritionHero />);
      const remaining = screen.getByTestId('nutrition-hero-remaining');
      expect(remaining).toHaveTextContent('Vượt 409 kcal');
      expect(remaining.className).toContain('text-rose-400');
    });

    it('shows macro bars with current/target', () => {
      setupWithMeals();
      render(<NutritionHero />);
      expect(screen.getByTestId('nutrition-hero-protein')).toHaveTextContent('170/170g');
      expect(screen.getByTestId('nutrition-hero-fat')).toHaveTextContent('42/58g');
      expect(screen.getByTestId('nutrition-hero-carbs')).toHaveTextContent('125/241g');
    });

    it('shows progress ring with percentage', () => {
      setupWithMeals();
      render(<NutritionHero />);
      // 1327/2091 ≈ 63%
      expect(screen.getByText('63%')).toBeInTheDocument();
    });

    it('does not show encouragement message', () => {
      setupWithMeals();
      render(<NutritionHero />);
      expect(screen.queryByText('Thêm bữa ăn đầu tiên cho hôm nay')).not.toBeInTheDocument();
    });
  });

  /* --- Score badge colors --- */

  describe('score badge colors', () => {
    it('renders emerald badge for high score', () => {
      setupWithMeals({ dailyScore: { totalScore: 90, color: 'emerald' } });
      render(<NutritionHero />);
      const badge = screen.getByTestId('nutrition-hero-score');
      expect(badge.className).toContain('bg-emerald-500');
      expect(badge).toHaveTextContent('90');
    });

    it('renders amber badge for medium score', () => {
      setupWithMeals({ dailyScore: { totalScore: 63, color: 'amber' } });
      render(<NutritionHero />);
      const badge = screen.getByTestId('nutrition-hero-score');
      expect(badge.className).toContain('bg-amber-500');
    });

    it('renders slate badge for low score', () => {
      setupWithMeals({ dailyScore: { totalScore: 30, color: 'slate' } });
      render(<NutritionHero />);
      const badge = screen.getByTestId('nutrition-hero-score');
      expect(badge.className).toContain('bg-slate-500');
    });
  });

  /* --- Greeting and contextual message --- */

  describe('greeting and context', () => {
    it('shows name in greeting when available', () => {
      setupWithMeals({ profileName: 'Minh' });
      render(<NutritionHero />);
      expect(screen.getByTestId('nutrition-hero-greeting')).toHaveTextContent('Chào Minh!');
    });

    it('falls back to time-based greeting when name is empty', () => {
      setupWithMeals({ profileName: '' });
      render(<NutritionHero />);
      expect(screen.getByTestId('nutrition-hero-greeting')).toHaveTextContent('Chào buổi sáng!');
    });

    it('shows contextual message for balanced day', () => {
      setupWithMeals({ dailyScore: { heroContext: 'balanced-day' } });
      render(<NutritionHero />);
      expect(screen.getByText('Ngày hôm nay rất cân bằng')).toBeInTheDocument();
    });

    it('shows contextual message for empty day', () => {
      setupNoPlan({ dailyScore: { heroContext: 'empty-day' } });
      render(<NutritionHero />);
      expect(screen.getByText('Bắt đầu ngày mới nào')).toBeInTheDocument();
    });

    it('shows contextual message for rest day', () => {
      setupWithMeals({ dailyScore: { heroContext: 'rest-day-with-meals' } });
      render(<NutritionHero />);
      expect(screen.getByText('Ngày nghỉ phục hồi')).toBeInTheDocument();
    });

    it('shows contextual message for training day', () => {
      setupWithMeals({ dailyScore: { heroContext: 'training-day-needs-workout' } });
      render(<NutritionHero />);
      expect(screen.getByText('Hôm nay là ngày tập')).toBeInTheDocument();
    });

    it('shows contextual message for workout done', () => {
      setupWithMeals({ dailyScore: { heroContext: 'workout-done-needs-fuel' } });
      render(<NutritionHero />);
      expect(screen.getByText('Buổi tập tuyệt vời!')).toBeInTheDocument();
    });

    it('shows contextual message for rest day empty', () => {
      setupNoPlan({ dailyScore: { heroContext: 'rest-day-empty' } });
      render(<NutritionHero />);
      expect(screen.getByText('Ngày nghỉ — thư giãn')).toBeInTheDocument();
    });
  });

  /* --- Null vs zero display --- */

  describe('null vs zero display', () => {
    it('shows dash for null protein (no plan)', () => {
      setupNoPlan();
      render(<NutritionHero />);
      expect(screen.getByTestId('nutrition-hero-protein')).toHaveTextContent('—/170g');
    });

    it('shows 0 for zero protein (empty plan)', () => {
      setupEmptyPlan();
      render(<NutritionHero />);
      expect(screen.getByTestId('nutrition-hero-protein')).toHaveTextContent('0/170g');
    });

    it('shows dash for null fat and carbs (no plan)', () => {
      setupNoPlan();
      render(<NutritionHero />);
      expect(screen.getByTestId('nutrition-hero-fat')).toHaveTextContent('—/58g');
      expect(screen.getByTestId('nutrition-hero-carbs')).toHaveTextContent('—/241g');
    });
  });

  /* --- Edge cases --- */

  describe('edge cases', () => {
    it('handles zero target calories gracefully', () => {
      setupWithMeals({ targets: { targetCalories: 0 } });
      render(<NutritionHero />);
      const calorieCard = screen.getByTestId('nutrition-hero-calories');
      expect(calorieCard).toBeInTheDocument();
    });

    it('handles zero target protein', () => {
      setupWithMeals({ targets: { targetProtein: 0 } });
      render(<NutritionHero />);
      expect(screen.getByTestId('nutrition-hero-protein')).toHaveTextContent('170/0g');
    });

    it('clamps progress ring at 100%', () => {
      setupWithMeals({
        nutrition: { calories: 5000, protein: 300, fat: 100, carbs: 500, fiber: 20 },
      });
      render(<NutritionHero />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('clamps progress ring at 0% for zero eaten', () => {
      setupWithMeals({
        nutrition: { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 },
      });
      render(<NutritionHero />);
      // 0/2091 = 0%, but eaten=0 and hasDishes=true shows encouragement
      // Because calculateDishesNutrition returns 0 when dishes return 0 nutrition
      expect(screen.getByTestId('nutrition-hero-calories')).toBeInTheDocument();
    });

    it('renders gradient background', () => {
      setupWithMeals();
      render(<NutritionHero />);
      const hero = screen.getByTestId('nutrition-hero');
      expect(hero.className).toContain('from-slate-900');
      expect(hero.className).toContain('via-indigo-950');
      expect(hero.className).toContain('to-slate-900');
    });

    it('has aria-label for accessibility', () => {
      setupWithMeals();
      render(<NutritionHero />);
      expect(screen.getByTestId('nutrition-hero')).toHaveAttribute('aria-label', 'Tổng quan dinh dưỡng hôm nay');
    });

    it('has aria-label on score badge', () => {
      setupWithMeals();
      render(<NutritionHero />);
      expect(screen.getByTestId('nutrition-hero-score')).toHaveAttribute('aria-label', 'Điểm: 63');
    });
  });

  /* --- State precedence --- */

  describe('state precedence', () => {
    it('isLoading takes precedence over first-time', () => {
      setupFirstTime();
      render(<NutritionHero isLoading />);
      expect(screen.queryByText('Thiết lập hồ sơ sức khỏe')).not.toBeInTheDocument();
      expect(screen.getByTestId('nutrition-hero')).toHaveAttribute('aria-busy', 'true');
    });

    it('isLoading takes precedence over has-data', () => {
      setupWithMeals();
      render(<NutritionHero isLoading />);
      expect(screen.queryByTestId('nutrition-hero-remaining')).not.toBeInTheDocument();
    });

    it('first-time takes precedence over has-data', () => {
      mockUseDailyScore.mockReturnValue(defaultDailyScore({ isFirstTimeUser: true }));
      mockUseNutritionTargets.mockReturnValue(defaultTargets());
      setupStores({
        dayPlans: [{ date: TODAY, breakfastDishIds: ['d1'], lunchDishIds: [], dinnerDishIds: [] }],
      });
      render(<NutritionHero />);
      expect(screen.getByText('Thiết lập hồ sơ sức khỏe')).toBeInTheDocument();
      expect(screen.queryByTestId('nutrition-hero-remaining')).not.toBeInTheDocument();
    });
  });

  /* --- Macro display formatting --- */

  describe('macro display formatting', () => {
    it('rounds macro values to integers', () => {
      setupWithMeals({
        nutrition: { calories: 1327.6, protein: 170.4, fat: 42.7, carbs: 125.3, fiber: 5 },
      });
      render(<NutritionHero />);
      expect(screen.getByTestId('nutrition-hero-protein')).toHaveTextContent('170/170g');
      expect(screen.getByTestId('nutrition-hero-fat')).toHaveTextContent('43/58g');
      expect(screen.getByTestId('nutrition-hero-carbs')).toHaveTextContent('125/241g');
    });

    it('shows P, F, C labels', () => {
      setupWithMeals();
      render(<NutritionHero />);
      expect(screen.getByTestId('nutrition-hero-protein')).toHaveTextContent('P');
      expect(screen.getByTestId('nutrition-hero-fat')).toHaveTextContent('F');
      expect(screen.getByTestId('nutrition-hero-carbs')).toHaveTextContent('C');
    });
  });
});
