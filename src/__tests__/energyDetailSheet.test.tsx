import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EnergyDetailSheet } from '@/components/nutrition/EnergyDetailSheet';

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
vi.mock('@/store/dayPlanStore');
vi.mock('@/store/dishStore');
vi.mock('@/store/ingredientStore');
vi.mock('@/utils/nutrition', () => ({
  calculateDishNutrition: vi.fn(),
}));

vi.mock('@/components/shared/ModalBackdrop', () => ({
  ModalBackdrop: ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div data-testid="modal-backdrop" onClick={onClose}>
      {children}
    </div>
  ),
}));
vi.mock('@/components/nutrition/MacroDonutChart', () => ({
  MacroDonutChart: ({
    proteinG,
    fatG,
    carbsG,
    size,
  }: {
    proteinG: number;
    fatG: number;
    carbsG: number;
    size?: number;
  }) => (
    <div data-testid="macro-donut-chart" data-protein={proteinG} data-fat={fatG} data-carbs={carbsG} data-size={size}>
      Donut
    </div>
  ),
}));

import { useNutritionTargets } from '@/features/health-profile/hooks/useNutritionTargets';
import { useModalBackHandler } from '@/hooks/useModalBackHandler';
import { useTodayCaloriesOut } from '@/hooks/useTodayCaloriesOut';
import { useTodayNutrition } from '@/hooks/useTodayNutrition';
import { useDayPlanStore } from '@/store/dayPlanStore';
import { useDishStore } from '@/store/dishStore';
import { useIngredientStore } from '@/store/ingredientStore';
import { calculateDishNutrition } from '@/utils/nutrition';

function setupDefaultMocks() {
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
  vi.mocked(useDayPlanStore).mockImplementation((selector: unknown) => {
    const state = { dayPlans: [] };
    return typeof selector === 'function' ? (selector as (s: typeof state) => unknown)(state) : state;
  });
  vi.mocked(useDishStore).mockImplementation((selector: unknown) => {
    const state = { dishes: [] };
    return typeof selector === 'function' ? (selector as (s: typeof state) => unknown)(state) : state;
  });
  vi.mocked(useIngredientStore).mockImplementation((selector: unknown) => {
    const state = { ingredients: [] };
    return typeof selector === 'function' ? (selector as (s: typeof state) => unknown)(state) : state;
  });
}

describe('EnergyDetailSheet', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });
  afterEach(cleanup);

  it('renders BMR, TDEE and Target values', () => {
    render(<EnergyDetailSheet onClose={mockOnClose} />);
    const breakdown = screen.getByTestId('energy-breakdown');
    expect(breakdown).toHaveTextContent('1650');
    expect(breakdown).toHaveTextContent('2500');
    expect(breakdown).toHaveTextContent('1950');
  });

  it('renders energy summary with correct values', () => {
    render(<EnergyDetailSheet onClose={mockOnClose} />);
    // eaten=1200, caloriesOut=350, net=1200-350=850, remaining=1950-850=1100
    expect(screen.getByText('1200 kcal')).toBeInTheDocument();
    expect(screen.getByText('-350 kcal')).toBeInTheDocument();
    expect(screen.getByText('850 kcal')).toBeInTheDocument();
    expect(screen.getByText('1100 kcal')).toBeInTheDocument();
  });

  it('renders MacroDonutChart', () => {
    render(<EnergyDetailSheet onClose={mockOnClose} />);
    expect(screen.getByTestId('macro-donut-chart')).toBeInTheDocument();
  });

  it('renders per-meal breakdown with three meals', () => {
    render(<EnergyDetailSheet onClose={mockOnClose} />);
    const breakdown = screen.getByTestId('per-meal-breakdown');
    expect(breakdown.children).toHaveLength(3);
  });

  it('calls onClose when close button is clicked', () => {
    render(<EnergyDetailSheet onClose={mockOnClose} />);
    fireEvent.click(screen.getByTestId('btn-close-energy-detail'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls useModalBackHandler with correct args', () => {
    render(<EnergyDetailSheet onClose={mockOnClose} />);
    expect(useModalBackHandler).toHaveBeenCalledWith(true, mockOnClose);
  });

  it('shows negative remaining with destructive style when over target', () => {
    vi.mocked(useTodayNutrition).mockReturnValue({ eaten: 2500, protein: 100 });
    vi.mocked(useTodayCaloriesOut).mockReturnValue(100);
    // net = 2500-100 = 2400, remaining = 1950-2400 = -450
    render(<EnergyDetailSheet onClose={mockOnClose} />);
    const remainingEl = screen.getByText('-450 kcal');
    expect(remainingEl).toBeInTheDocument();
    expect(remainingEl.className).toContain('text-destructive');
  });

  it('shows positive remaining with primary style when under target', () => {
    render(<EnergyDetailSheet onClose={mockOnClose} />);
    const remainingEl = screen.getByText('1100 kcal');
    expect(remainingEl.className).toContain('text-primary');
  });

  it('renders per-meal data from dayPlan store', () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    vi.mocked(useDayPlanStore).mockImplementation((selector: unknown) => {
      const state = {
        dayPlans: [
          {
            id: 'dp1',
            date: dateStr,
            breakfastDishIds: ['d1'],
            lunchDishIds: ['d2'],
            dinnerDishIds: ['d3'],
          },
        ],
      };
      return typeof selector === 'function' ? (selector as (s: typeof state) => unknown)(state) : state;
    });
    vi.mocked(useDishStore).mockImplementation((selector: unknown) => {
      const state = {
        dishes: [
          { id: 'd1', name: { vi: 'Phở' }, ingredients: [] },
          { id: 'd2', name: { vi: 'Cơm' }, ingredients: [] },
          { id: 'd3', name: { vi: 'Bún' }, ingredients: [] },
        ],
      };
      return typeof selector === 'function' ? (selector as (s: typeof state) => unknown)(state) : state;
    });
    vi.mocked(calculateDishNutrition).mockImplementation((dish: { id: string }) => {
      const data: Record<string, { calories: number; protein: number; carbs: number; fat: number; fiber: number }> = {
        d1: { calories: 400, protein: 20, carbs: 50, fat: 10, fiber: 2 },
        d2: { calories: 600, protein: 30, carbs: 70, fat: 15, fiber: 3 },
        d3: { calories: 500, protein: 25, carbs: 60, fat: 12, fiber: 2 },
      };
      return data[dish.id] ?? { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    });

    render(<EnergyDetailSheet onClose={mockOnClose} />);
    const donut = screen.getByTestId('macro-donut-chart');
    expect(donut).toHaveAttribute('data-protein', '75');
    expect(donut).toHaveAttribute('data-fat', '37');
    expect(donut).toHaveAttribute('data-carbs', '180');
  });

  it('handles missing dish gracefully', () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    vi.mocked(useDayPlanStore).mockImplementation((selector: unknown) => {
      const state = {
        dayPlans: [
          {
            id: 'dp1',
            date: dateStr,
            breakfastDishIds: ['nonexistent'],
            lunchDishIds: [],
            dinnerDishIds: [],
          },
        ],
      };
      return typeof selector === 'function' ? (selector as (s: typeof state) => unknown)(state) : state;
    });

    render(<EnergyDetailSheet onClose={mockOnClose} />);
    expect(screen.getByTestId('per-meal-breakdown')).toBeInTheDocument();
  });

  it('passes zero macros to MacroDonutChart when no day plan', () => {
    render(<EnergyDetailSheet onClose={mockOnClose} />);
    const donut = screen.getByTestId('macro-donut-chart');
    expect(donut).toHaveAttribute('data-protein', '0');
    expect(donut).toHaveAttribute('data-fat', '0');
    expect(donut).toHaveAttribute('data-carbs', '0');
  });
});
