import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EnergyDetailSheet } from '@/components/nutrition/EnergyDetailSheet';
import { useNutritionTargets } from '@/features/health-profile/hooks/useNutritionTargets';
import { useModalBackHandler } from '@/hooks/useModalBackHandler';
import { useTodayCaloriesOut } from '@/hooks/useTodayCaloriesOut';
import { useTodayNutrition } from '@/hooks/useTodayNutrition';
import { useDayPlanStore } from '@/store/dayPlanStore';
import { useDishStore } from '@/store/dishStore';
import { useIngredientStore } from '@/store/ingredientStore';

vi.mock('@/store/dayPlanStore', () => ({ useDayPlanStore: vi.fn() }));
vi.mock('@/store/dishStore', () => ({ useDishStore: vi.fn() }));
vi.mock('@/store/ingredientStore', () => ({ useIngredientStore: vi.fn() }));

vi.mock('@/features/health-profile/hooks/useNutritionTargets', () => ({
  useNutritionTargets: vi.fn(),
}));
vi.mock('@/hooks/useTodayCaloriesOut', () => ({
  useTodayCaloriesOut: vi.fn(),
}));
vi.mock('@/hooks/useTodayNutrition', () => ({
  useTodayNutrition: vi.fn(),
}));
vi.mock('@/hooks/useModalBackHandler', () => ({
  useModalBackHandler: vi.fn(),
}));

vi.mock('@/components/shared/ModalBackdrop', () => ({
  ModalBackdrop: ({ children }: { children: ReactNode }) => <div data-testid="modal-backdrop">{children}</div>,
}));
vi.mock('@/components/nutrition/MacroDonutChart', () => ({
  MacroDonutChart: ({ proteinG, fatG, carbsG }: { proteinG: number; fatG: number; carbsG: number; size?: number }) => (
    <div data-testid="macro-donut-chart">
      {proteinG}p/{fatG}f/{carbsG}c
    </div>
  ),
}));

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function mockStore(hook: unknown, state: Record<string, unknown>) {
  vi.mocked(hook as (...args: unknown[]) => unknown).mockImplementation((selector: unknown) =>
    typeof selector === 'function' ? (selector as (s: Record<string, unknown>) => unknown)(state) : state,
  );
}

describe('EnergyDetailSheet', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useNutritionTargets).mockReturnValue({
      bmr: 1650,
      tdee: 2500,
      targetCalories: 1950,
      targetProtein: 130,
      targetFat: 65,
      targetCarbs: 244,
    });
    vi.mocked(useTodayNutrition).mockReturnValue({ eaten: 1200, protein: 80 });
    vi.mocked(useTodayCaloriesOut).mockReturnValue(350);

    mockStore(useDayPlanStore, { dayPlans: [] });
    mockStore(useDishStore, { dishes: [] });
    mockStore(useIngredientStore, { ingredients: [] });
  });

  afterEach(cleanup);

  it('renders BMR/TDEE/Target values', () => {
    render(<EnergyDetailSheet onClose={onClose} />);

    expect(screen.getByTestId('bmr-value')).toHaveTextContent('1650');
    expect(screen.getByTestId('tdee-value')).toHaveTextContent('2500');
    expect(screen.getByTestId('target-value')).toHaveTextContent('1950');
  });

  it('renders energy summary with correct calculations', () => {
    render(<EnergyDetailSheet onClose={onClose} />);

    // eaten=1200, caloriesOut=350, net=1200-350=850, remaining=1950-850=1100
    expect(screen.getByText('1200 kcal')).toBeInTheDocument();
    expect(screen.getByText('-350 kcal')).toBeInTheDocument();
    expect(screen.getByText('850 kcal')).toBeInTheDocument();
    expect(screen.getByText('1100 kcal')).toBeInTheDocument();
  });

  it('renders MacroDonutChart with zero macros when no day plan', () => {
    render(<EnergyDetailSheet onClose={onClose} />);

    const chart = screen.getByTestId('macro-donut-chart');
    expect(chart).toBeInTheDocument();
    expect(chart).toHaveTextContent('0p/0f/0c');
  });

  it('renders per-meal breakdown with 3 meals', () => {
    render(<EnergyDetailSheet onClose={onClose} />);

    const mealBreakdown = screen.getByTestId('per-meal-breakdown');
    expect(mealBreakdown).toBeInTheDocument();
    expect(mealBreakdown.children).toHaveLength(3);
    expect(mealBreakdown).toHaveTextContent('Bữa Sáng');
    expect(mealBreakdown).toHaveTextContent('Bữa Trưa');
    expect(mealBreakdown).toHaveTextContent('Bữa Tối');
  });

  it('close button calls onClose', () => {
    render(<EnergyDetailSheet onClose={onClose} />);

    fireEvent.click(screen.getByTestId('btn-close-energy-detail'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls useModalBackHandler with correct arguments', () => {
    render(<EnergyDetailSheet onClose={onClose} />);

    expect(useModalBackHandler).toHaveBeenCalledWith(true, onClose);
  });

  it('calculates per-meal calories with day plan data', () => {
    const today = todayStr();

    const ingredients = [
      {
        id: 'ing1',
        name: { vi: 'Gà' },
        caloriesPer100: 200,
        proteinPer100: 25,
        carbsPer100: 0,
        fatPer100: 10,
        fiberPer100: 0,
        unit: { vi: 'g' },
      },
      {
        id: 'ing2',
        name: { vi: 'Cơm' },
        caloriesPer100: 130,
        proteinPer100: 3,
        carbsPer100: 28,
        fatPer100: 0.5,
        fiberPer100: 0.4,
        unit: { vi: 'g' },
      },
    ];

    const dishes = [
      {
        id: 'dish1',
        name: { vi: 'Gà nướng' },
        ingredients: [{ ingredientId: 'ing1', amount: 100 }],
        tags: [],
      },
      {
        id: 'dish2',
        name: { vi: 'Cơm trắng' },
        ingredients: [{ ingredientId: 'ing2', amount: 200 }],
        tags: [],
      },
    ];

    mockStore(useDayPlanStore, {
      dayPlans: [{ date: today, breakfastDishIds: ['dish1'], lunchDishIds: ['dish2'], dinnerDishIds: [] }],
    });
    mockStore(useDishStore, { dishes });
    mockStore(useIngredientStore, { ingredients });

    render(<EnergyDetailSheet onClose={onClose} />);

    const rows = screen.getByTestId('per-meal-breakdown').children;
    // Breakfast: dish1 (100g × 200kcal/100g) = 200 kcal
    expect(rows[0]).toHaveTextContent('200 kcal');
    // Lunch: dish2 (200g × 130kcal/100g) = 260 kcal
    expect(rows[1]).toHaveTextContent('260 kcal');
    // Dinner: no dishes → 0 kcal
    expect(rows[2]).toHaveTextContent('0 kcal');

    // Aggregated macros: protein=25+6=31, fat=10+1=11, carbs=0+56=56
    expect(screen.getByTestId('macro-donut-chart')).toHaveTextContent('31p/11f/56c');
  });

  it('shows negative remaining with destructive class when eaten exceeds target', () => {
    vi.mocked(useTodayNutrition).mockReturnValue({ eaten: 2500, protein: 150 });
    vi.mocked(useTodayCaloriesOut).mockReturnValue(200);

    render(<EnergyDetailSheet onClose={onClose} />);

    // net = 2500-200 = 2300, remaining = 1950-2300 = -350
    const remainingEl = screen.getByText('-350 kcal');
    expect(remainingEl).toBeInTheDocument();
    expect(remainingEl).toHaveClass('text-destructive');
  });

  it('shows positive remaining with primary class when under target', () => {
    render(<EnergyDetailSheet onClose={onClose} />);

    const remainingEl = screen.getByText('1100 kcal');
    expect(remainingEl).toHaveClass('text-primary');
  });

  it('handles missing dish in day plan gracefully', () => {
    const today = todayStr();

    mockStore(useDayPlanStore, {
      dayPlans: [{ date: today, breakfastDishIds: ['nonexistent'], lunchDishIds: [], dinnerDishIds: [] }],
    });

    render(<EnergyDetailSheet onClose={onClose} />);

    const rows = screen.getByTestId('per-meal-breakdown').children;
    expect(rows[0]).toHaveTextContent('0 kcal');
  });
});
