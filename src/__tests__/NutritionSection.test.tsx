import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  'dashboard.nutritionHero.targetLabel': 'Mục tiêu',
  'dashboard.nutritionHero.goalReached': 'mục tiêu đạt được',
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

import { NutritionSection } from '../features/dashboard/components/NutritionSection';
import { useNutritionTargets } from '../features/health-profile/hooks/useNutritionTargets';
import { useHealthProfileStore } from '../features/health-profile/store/healthProfileStore';
import { useDayPlanStore } from '../store/dayPlanStore';
import { useDishStore } from '../store/dishStore';
import { useIngredientStore } from '../store/ingredientStore';
import { calculateDishesNutrition } from '../utils/nutrition';

const mockUseNutritionTargets = vi.mocked(useNutritionTargets);
const mockUseHealthProfileStore = vi.mocked(useHealthProfileStore);
const mockUseDayPlanStore = vi.mocked(useDayPlanStore);
const mockUseDishStore = vi.mocked(useDishStore);
const mockUseIngredientStore = vi.mocked(useIngredientStore);
const mockCalculateDishesNutrition = vi.mocked(calculateDishesNutrition);

/* ------------------------------------------------------------------ */
/*  Default props                                                      */
/* ------------------------------------------------------------------ */

interface SectionProps {
  isLoading?: boolean;
  isFirstTimeUser: boolean;
  greeting: string;
  heroContext: string;
  totalScore: number;
  scoreColor: string;
}

function defaultProps(overrides: Partial<SectionProps> = {}): SectionProps {
  return {
    isFirstTimeUser: false,
    greeting: 'Chào buổi sáng!',
    heroContext: 'balanced-day',
    totalScore: 63,
    scoreColor: 'amber',
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const TODAY = '2026-06-14';

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
  props?: Partial<SectionProps>;
  targets?: Partial<NutritionTargets>;
  nutrition?: { calories: number; protein: number; fat: number; carbs: number; fiber: number };
  profileName?: string;
}) {
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
  props?: Partial<SectionProps>;
  targets?: Partial<NutritionTargets>;
  profileName?: string;
}) {
  mockUseNutritionTargets.mockReturnValue(defaultTargets(overrides?.targets));
  setupStores({ dayPlans: [], profileName: overrides?.profileName });
}

function setupEmptyPlan(overrides?: { props?: Partial<SectionProps>; targets?: Partial<NutritionTargets> }) {
  mockUseNutritionTargets.mockReturnValue(defaultTargets(overrides?.targets));
  setupStores({
    dayPlans: [{ date: TODAY, breakfastDishIds: [], lunchDishIds: [], dinnerDishIds: [] }],
  });
}

function setupFirstTime() {
  mockUseNutritionTargets.mockReturnValue(defaultTargets());
  setupStores({ dayPlans: [] });
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe('NutritionSection', () => {
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
      render(<NutritionSection {...defaultProps({ isLoading: true })} />);

      const hero = screen.getByTestId('nutrition-hero');
      expect(hero).toHaveAttribute('aria-busy', 'true');
      expect(hero.className).toContain('animate-pulse');
    });

    it('does not render score badge when loading', () => {
      setupWithMeals();
      render(<NutritionSection {...defaultProps({ isLoading: true })} />);
      expect(screen.queryByTestId('nutrition-hero-score')).not.toBeInTheDocument();
    });
  });

  /* --- First-time user state --- */

  describe('first-time user', () => {
    it('shows setup CTA title', () => {
      setupFirstTime();
      render(<NutritionSection {...defaultProps({ isFirstTimeUser: true, heroContext: 'first-time' })} />);
      expect(screen.getByText('Thiết lập hồ sơ sức khỏe')).toBeInTheDocument();
    });

    it('shows setup description', () => {
      setupFirstTime();
      render(<NutritionSection {...defaultProps({ isFirstTimeUser: true, heroContext: 'first-time' })} />);
      expect(screen.getByText('Cập nhật hồ sơ để xem mục tiêu dinh dưỡng hàng ngày')).toBeInTheDocument();
    });

    it('shows greeting without name', () => {
      setupFirstTime();
      render(<NutritionSection {...defaultProps({ isFirstTimeUser: true, heroContext: 'first-time' })} />);
      expect(screen.getByTestId('nutrition-hero-greeting')).toHaveTextContent('Chào buổi sáng!');
    });

    it('does not show calorie card', () => {
      setupFirstTime();
      render(<NutritionSection {...defaultProps({ isFirstTimeUser: true, heroContext: 'first-time' })} />);
      expect(screen.queryByTestId('nutrition-hero-calories')).not.toBeInTheDocument();
    });

    it('does not show macro bars', () => {
      setupFirstTime();
      render(<NutritionSection {...defaultProps({ isFirstTimeUser: true, heroContext: 'first-time' })} />);
      expect(screen.queryByTestId('nutrition-hero-protein')).not.toBeInTheDocument();
    });

    it('does not show score badge', () => {
      setupFirstTime();
      render(<NutritionSection {...defaultProps({ isFirstTimeUser: true, heroContext: 'first-time' })} />);
      expect(screen.queryByTestId('nutrition-hero-score')).not.toBeInTheDocument();
    });
  });

  /* --- No meals state --- */

  describe('no meals today (no plan)', () => {
    it('shows encouragement message', () => {
      setupNoPlan();
      render(<NutritionSection {...defaultProps({ heroContext: 'empty-day' })} />);
      expect(screen.getByText('Thêm bữa ăn đầu tiên cho hôm nay')).toBeInTheDocument();
    });

    it('shows target info', () => {
      setupNoPlan();
      render(<NutritionSection {...defaultProps({ heroContext: 'empty-day' })} />);
      expect(screen.getByText('Mục tiêu: 2091 kcal')).toBeInTheDocument();
    });

    it('shows score badge', () => {
      setupNoPlan();
      render(<NutritionSection {...defaultProps({ heroContext: 'empty-day' })} />);
      expect(screen.getByTestId('nutrition-hero-score')).toBeInTheDocument();
    });

    it('does not show macro bars when no plan', () => {
      setupNoPlan();
      render(<NutritionSection {...defaultProps({ heroContext: 'empty-day' })} />);
      expect(screen.queryByTestId('nutrition-hero-protein')).not.toBeInTheDocument();
    });

    it('shows greeting with name as prominent text', () => {
      setupNoPlan({ profileName: 'Khánh' });
      render(<NutritionSection {...defaultProps({ heroContext: 'empty-day' })} />);
      expect(screen.getByText('Khánh')).toBeInTheDocument();
    });

    it('falls back to time-based greeting when profile is null', () => {
      setupNoPlan();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUseHealthProfileStore.mockImplementation((selector: any) => selector({ profile: null }));

      render(<NutritionSection {...defaultProps({ heroContext: 'empty-day' })} />);
      expect(screen.getByTestId('nutrition-hero-greeting')).toHaveTextContent('Chào buổi sáng!');
    });
  });

  describe('no meals today (empty plan)', () => {
    it('shows encouragement message when plan exists but has no dishes', () => {
      setupEmptyPlan();
      render(<NutritionSection {...defaultProps({ heroContext: 'empty-day' })} />);
      expect(screen.getByText('Thêm bữa ăn đầu tiên cho hôm nay')).toBeInTheDocument();
    });

    it('does not show macro bars when plan has no dishes', () => {
      setupEmptyPlan();
      render(<NutritionSection {...defaultProps({ heroContext: 'empty-day' })} />);
      expect(screen.queryByTestId('nutrition-hero-protein')).not.toBeInTheDocument();
    });
  });

  /* --- Has data state --- */

  describe('has nutrition data', () => {
    it('shows eaten in progress ring and target in details', () => {
      setupWithMeals();
      render(<NutritionSection {...defaultProps()} />);
      const calorieCard = screen.getByTestId('nutrition-hero-calories');
      expect(calorieCard).toHaveTextContent('1327');
      expect(calorieCard).toHaveTextContent('2091');
      expect(calorieCard).toHaveTextContent('Mục tiêu');
    });

    it('shows remaining calories in emerald when under target', () => {
      setupWithMeals();
      render(<NutritionSection {...defaultProps()} />);
      const remaining = screen.getByTestId('nutrition-hero-remaining');
      expect(remaining).toHaveTextContent('Còn 764 kcal');
      expect(remaining.className).toContain('bg-success/10');
    });

    it('shows over calories in rose when over target', () => {
      setupWithMeals({
        nutrition: { calories: 2500, protein: 200, fat: 70, carbs: 300, fiber: 10 },
      });
      render(<NutritionSection {...defaultProps()} />);
      const remaining = screen.getByTestId('nutrition-hero-remaining');
      expect(remaining).toHaveTextContent('Vượt 409 kcal');
      expect(remaining.className).toContain('bg-rose/10');
    });

    it('shows macro bars with current/target', () => {
      setupWithMeals();
      render(<NutritionSection {...defaultProps()} />);
      expect(screen.getByTestId('nutrition-hero-protein')).toHaveTextContent('170/170g');
      expect(screen.getByTestId('nutrition-hero-fat')).toHaveTextContent('42/58g');
      expect(screen.getByTestId('nutrition-hero-carbs')).toHaveTextContent('125/241g');
    });

    it('shows progress ring with calorie number', () => {
      setupWithMeals();
      render(<NutritionSection {...defaultProps()} />);
      // Ring shows eaten calories (1327) + "kcal" text
      expect(screen.getByText('1327')).toBeInTheDocument();
      // "kcal" appears in both ring and target details — verify at least one exists
      expect(screen.getAllByText('kcal').length).toBeGreaterThanOrEqual(1);
    });

    it('does not show encouragement message', () => {
      setupWithMeals();
      render(<NutritionSection {...defaultProps()} />);
      expect(screen.queryByText('Thêm bữa ăn đầu tiên cho hôm nay')).not.toBeInTheDocument();
    });
  });

  /* --- Score badge colors --- */

  describe('score badge colors', () => {
    it('renders emerald badge for high score', () => {
      setupWithMeals();
      render(<NutritionSection {...defaultProps({ totalScore: 90, scoreColor: 'emerald' })} />);
      const badge = screen.getByTestId('nutrition-hero-score');
      expect(badge.className).toContain('border-success/30');
      expect(badge.className).toContain('bg-success/10');
      expect(badge).toHaveTextContent('90');
    });

    it('renders amber badge for medium score', () => {
      setupWithMeals();
      render(<NutritionSection {...defaultProps({ totalScore: 63, scoreColor: 'amber' })} />);
      const badge = screen.getByTestId('nutrition-hero-score');
      expect(badge.className).toContain('border-energy/30');
      expect(badge.className).toContain('bg-energy/10');
    });

    it('renders slate badge for low score', () => {
      setupWithMeals();
      render(<NutritionSection {...defaultProps({ totalScore: 30, scoreColor: 'slate' })} />);
      const badge = screen.getByTestId('nutrition-hero-score');
      expect(badge.className).toContain('border-muted-foreground/30');
      expect(badge.className).toContain('bg-muted');
    });
  });

  /* --- Greeting and contextual message --- */

  describe('greeting and context', () => {
    it('shows name prominently below greeting when available', () => {
      setupWithMeals({ profileName: 'Minh' });
      render(<NutritionSection {...defaultProps()} />);
      // Greeting is time-based, name is separate bold text
      expect(screen.getByTestId('nutrition-hero-greeting')).toHaveTextContent('Chào buổi sáng!');
      expect(screen.getByText('Minh')).toBeInTheDocument();
    });

    it('falls back to time-based greeting when name is empty', () => {
      setupWithMeals({ profileName: '' });
      render(<NutritionSection {...defaultProps()} />);
      expect(screen.getByTestId('nutrition-hero-greeting')).toHaveTextContent('Chào buổi sáng!');
    });

    it('shows contextual message when no profile name for balanced day', () => {
      setupWithMeals({ profileName: '' });
      render(<NutritionSection {...defaultProps({ heroContext: 'balanced-day' })} />);
      expect(screen.getByText('Ngày hôm nay rất cân bằng')).toBeInTheDocument();
    });

    it('shows contextual message when no profile name for empty day', () => {
      setupNoPlan({ profileName: '' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUseHealthProfileStore.mockImplementation((selector: any) => selector({ profile: { name: '' } }));
      render(<NutritionSection {...defaultProps({ heroContext: 'empty-day' })} />);
      expect(screen.getByText('Bắt đầu ngày mới nào')).toBeInTheDocument();
    });

    it('shows contextual message when no profile name for rest day', () => {
      setupWithMeals({ profileName: '' });
      render(<NutritionSection {...defaultProps({ heroContext: 'rest-day-with-meals' })} />);
      expect(screen.getByText('Ngày nghỉ phục hồi')).toBeInTheDocument();
    });

    it('shows contextual message when no profile name for training day', () => {
      setupWithMeals({ profileName: '' });
      render(<NutritionSection {...defaultProps({ heroContext: 'training-day-needs-workout' })} />);
      expect(screen.getByText('Hôm nay là ngày tập')).toBeInTheDocument();
    });

    it('shows contextual message when no profile name for workout done', () => {
      setupWithMeals({ profileName: '' });
      render(<NutritionSection {...defaultProps({ heroContext: 'workout-done-needs-fuel' })} />);
      expect(screen.getByText('Buổi tập tuyệt vời!')).toBeInTheDocument();
    });

    it('shows contextual message when no profile name for rest day empty', () => {
      setupNoPlan({ profileName: '' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUseHealthProfileStore.mockImplementation((selector: any) => selector({ profile: { name: '' } }));
      render(<NutritionSection {...defaultProps({ heroContext: 'rest-day-empty' })} />);
      expect(screen.getByText('Ngày nghỉ — thư giãn')).toBeInTheDocument();
    });

    it('hides contextual message when profile name is present', () => {
      setupWithMeals({ profileName: 'Khánh' });
      render(<NutritionSection {...defaultProps({ heroContext: 'balanced-day' })} />);
      expect(screen.queryByText('Ngày hôm nay rất cân bằng')).not.toBeInTheDocument();
    });
  });

  /* --- Null vs zero display --- */

  describe('null vs zero display', () => {
    it('does not show macros when no plan (macros inside card)', () => {
      setupNoPlan();
      render(<NutritionSection {...defaultProps({ heroContext: 'empty-day' })} />);
      expect(screen.queryByTestId('nutrition-hero-protein')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nutrition-hero-fat')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nutrition-hero-carbs')).not.toBeInTheDocument();
    });

    it('does not show macros when empty plan (macros inside card)', () => {
      setupEmptyPlan();
      render(<NutritionSection {...defaultProps({ heroContext: 'empty-day' })} />);
      expect(screen.queryByTestId('nutrition-hero-protein')).not.toBeInTheDocument();
    });
  });

  /* --- Edge cases --- */

  describe('edge cases', () => {
    it('handles zero target calories gracefully', () => {
      setupWithMeals({ targets: { targetCalories: 0 } });
      render(<NutritionSection {...defaultProps()} />);
      const calorieCard = screen.getByTestId('nutrition-hero-calories');
      expect(calorieCard).toBeInTheDocument();
    });

    it('handles zero target protein', () => {
      setupWithMeals({ targets: { targetProtein: 0 } });
      render(<NutritionSection {...defaultProps()} />);
      expect(screen.getByTestId('nutrition-hero-protein')).toHaveTextContent('170/0g');
    });

    it('shows full progress and goal text when at or over target', () => {
      setupWithMeals({
        nutrition: { calories: 5000, protein: 300, fat: 100, carbs: 500, fiber: 20 },
      });
      render(<NutritionSection {...defaultProps()} />);
      // Ring shows eaten calorie number
      expect(screen.getByText('5000')).toBeInTheDocument();
      // Percentage shows clamped at 100%
      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });

    it('shows zero eaten in ring for zero calories', () => {
      setupWithMeals({
        nutrition: { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 },
      });
      render(<NutritionSection {...defaultProps()} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('does not render gradient on wrapper (gradient is on parent)', () => {
      setupWithMeals();
      render(<NutritionSection {...defaultProps()} />);
      const hero = screen.getByTestId('nutrition-hero');
      expect(hero.className).not.toContain('from-slate-900');
      expect(hero.className).not.toContain('via-indigo-950');
      expect(hero.className).not.toContain('to-slate-900');
    });

    it('has aria-label for accessibility', () => {
      setupWithMeals();
      render(<NutritionSection {...defaultProps()} />);
      expect(screen.getByTestId('nutrition-hero')).toHaveAttribute('aria-label', 'Tổng quan dinh dưỡng hôm nay');
    });

    it('has aria-label on score badge', () => {
      setupWithMeals();
      render(<NutritionSection {...defaultProps()} />);
      expect(screen.getByTestId('nutrition-hero-score')).toHaveAttribute('aria-label', 'Điểm: 63');
    });
  });

  /* --- State precedence --- */

  describe('state precedence', () => {
    it('isLoading takes precedence over first-time', () => {
      setupFirstTime();
      render(
        <NutritionSection {...defaultProps({ isLoading: true, isFirstTimeUser: true, heroContext: 'first-time' })} />,
      );
      expect(screen.queryByText('Thiết lập hồ sơ sức khỏe')).not.toBeInTheDocument();
      expect(screen.getByTestId('nutrition-hero')).toHaveAttribute('aria-busy', 'true');
    });

    it('isLoading takes precedence over has-data', () => {
      setupWithMeals();
      render(<NutritionSection {...defaultProps({ isLoading: true })} />);
      expect(screen.queryByTestId('nutrition-hero-remaining')).not.toBeInTheDocument();
    });

    it('first-time takes precedence over has-data', () => {
      mockUseNutritionTargets.mockReturnValue(defaultTargets());
      setupStores({
        dayPlans: [{ date: TODAY, breakfastDishIds: ['d1'], lunchDishIds: [], dinnerDishIds: [] }],
      });
      render(<NutritionSection {...defaultProps({ isFirstTimeUser: true, heroContext: 'first-time' })} />);
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
      render(<NutritionSection {...defaultProps()} />);
      expect(screen.getByTestId('nutrition-hero-protein')).toHaveTextContent('170/170g');
      expect(screen.getByTestId('nutrition-hero-fat')).toHaveTextContent('43/58g');
      expect(screen.getByTestId('nutrition-hero-carbs')).toHaveTextContent('125/241g');
    });

    it('shows P, F, C labels', () => {
      setupWithMeals();
      render(<NutritionSection {...defaultProps()} />);
      expect(screen.getByTestId('nutrition-hero-protein')).toHaveTextContent('P');
      expect(screen.getByTestId('nutrition-hero-fat')).toHaveTextContent('F');
      expect(screen.getByTestId('nutrition-hero-carbs')).toHaveTextContent('C');
    });
  });
});
