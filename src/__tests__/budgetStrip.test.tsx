import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MiniNutritionBar } from '../components/schedule/MiniNutritionBar';
import type { DayNutritionSummary, SlotInfo } from '../types';

const makeSlot = (dishIds: string[], cal = 0, pro = 0, carbs = 0, fat = 0): SlotInfo => ({
  dishIds,
  calories: cal,
  protein: pro,
  carbs,
  fat,
  fiber: 0,
});

const emptyNutrition: DayNutritionSummary = {
  breakfast: makeSlot([]),
  lunch: makeSlot([]),
  dinner: makeSlot([]),
};

const filledNutrition: DayNutritionSummary = {
  breakfast: makeSlot(['d1'], 400, 20, 40, 10),
  lunch: makeSlot(['d2'], 600, 30, 60, 15),
  dinner: makeSlot(['d3'], 500, 25, 50, 12),
};

describe('BudgetStrip (MiniNutritionBar)', () => {
  it('renders normal state with progress bars and remaining text', () => {
    render(
      <MiniNutritionBar
        dayNutrition={filledNutrition}
        targetCalories={2000}
        targetProtein={140}
        onSwitchToNutrition={vi.fn()}
      />,
    );
    expect(screen.getByTestId('mini-nutrition-bar')).toBeInTheDocument();
    expect(screen.getByTestId('mini-cal-bar')).toBeInTheDocument();
    expect(screen.getByTestId('mini-pro-bar')).toBeInTheDocument();
    expect(screen.getByText('1500/2000 kcal')).toBeInTheDocument();
    expect(screen.getByText('75/140g Pro')).toBeInTheDocument();
    expect(screen.getByTestId('mini-remaining-cal')).toHaveTextContent('Còn: 500 kcal');
    expect(screen.getByTestId('mini-remaining-pro')).toHaveTextContent('Còn: 65 g');
  });

  it('renders setup state when targetCalories is 0', () => {
    render(
      <MiniNutritionBar
        dayNutrition={emptyNutrition}
        targetCalories={0}
        targetProtein={0}
        onSwitchToNutrition={vi.fn()}
      />,
    );
    expect(screen.getByTestId('budget-setup-label')).toHaveTextContent('Chưa thiết lập mục tiêu');
    expect(screen.getByText('Thiết lập')).toBeInTheDocument();
    expect(screen.queryByTestId('mini-cal-bar')).not.toBeInTheDocument();
  });

  it('renders setup state when targetCalories is negative', () => {
    render(
      <MiniNutritionBar
        dayNutrition={emptyNutrition}
        targetCalories={-100}
        targetProtein={0}
        onSwitchToNutrition={vi.fn()}
      />,
    );
    expect(screen.getByTestId('budget-setup-label')).toBeInTheDocument();
  });

  it('renders overflow state when eaten exceeds target', () => {
    const overNutrition: DayNutritionSummary = {
      breakfast: makeSlot(['d1'], 1000, 80, 50, 15),
      lunch: makeSlot(['d2'], 800, 60, 70, 20),
      dinner: makeSlot(['d3'], 500, 40, 60, 18),
    };
    render(
      <MiniNutritionBar
        dayNutrition={overNutrition}
        targetCalories={2000}
        targetProtein={140}
        onSwitchToNutrition={vi.fn()}
      />,
    );
    expect(screen.getByTestId('mini-remaining-cal')).toHaveTextContent('Vượt: 300 kcal');
    expect(screen.getByTestId('mini-remaining-pro')).toHaveTextContent('Vượt: 40 g');
  });

  it('renders complete state when goal reached', () => {
    const completedNutrition: DayNutritionSummary = {
      breakfast: makeSlot(['d1'], 800, 50, 80, 20),
      lunch: makeSlot(['d2'], 700, 45, 70, 18),
      dinner: makeSlot(['d3'], 600, 40, 60, 15),
    };
    render(
      <MiniNutritionBar
        dayNutrition={completedNutrition}
        targetCalories={2000}
        targetProtein={140}
        onSwitchToNutrition={vi.fn()}
      />,
    );
    expect(screen.getByText('Đã đạt mục tiêu! 🎉')).toBeInTheDocument();
    const container = screen.getByTestId('mini-nutrition-bar');
    expect(container.className).toContain('bg-success');
    expect(container.className).toContain('border-success');
  });

  it('shows macro pills when macros > 0', () => {
    render(
      <MiniNutritionBar
        dayNutrition={filledNutrition}
        targetCalories={2000}
        targetProtein={140}
        onSwitchToNutrition={vi.fn()}
      />,
    );
    const pills = screen.getByTestId('mini-macro-pills');
    expect(pills).toBeInTheDocument();
    expect(pills).toHaveTextContent('P 75g');
    expect(pills).toHaveTextContent('F 37g');
    expect(pills).toHaveTextContent('C 150g');
  });

  it('hides macro pills when all macros are zero', () => {
    render(
      <MiniNutritionBar
        dayNutrition={emptyNutrition}
        targetCalories={2000}
        targetProtein={140}
        onSwitchToNutrition={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('mini-macro-pills')).not.toBeInTheDocument();
  });

  it('calls onSwitchToNutrition on tap', () => {
    const onSwitch = vi.fn();
    render(
      <MiniNutritionBar
        dayNutrition={filledNutrition}
        targetCalories={2000}
        targetProtein={140}
        onSwitchToNutrition={onSwitch}
      />,
    );
    fireEvent.click(screen.getByTestId('mini-nutrition-bar'));
    expect(onSwitch).toHaveBeenCalledTimes(1);
  });

  it('calls onSwitchToNutrition on setup state tap', () => {
    const onSwitch = vi.fn();
    render(
      <MiniNutritionBar
        dayNutrition={emptyNutrition}
        targetCalories={0}
        targetProtein={0}
        onSwitchToNutrition={onSwitch}
      />,
    );
    fireEvent.click(screen.getByTestId('mini-nutrition-bar'));
    expect(onSwitch).toHaveBeenCalledTimes(1);
  });

  it('has data-budget-strip attribute', () => {
    render(
      <MiniNutritionBar
        dayNutrition={filledNutrition}
        targetCalories={2000}
        targetProtein={140}
        onSwitchToNutrition={vi.fn()}
      />,
    );
    expect(screen.getByTestId('mini-nutrition-bar')).toHaveAttribute('data-budget-strip');
  });

  it('has data-budget-strip attribute in setup state', () => {
    render(
      <MiniNutritionBar
        dayNutrition={emptyNutrition}
        targetCalories={0}
        targetProtein={0}
        onSwitchToNutrition={vi.fn()}
      />,
    );
    expect(screen.getByTestId('mini-nutrition-bar')).toHaveAttribute('data-budget-strip');
  });

  it('shows budget strip title with emoji in normal state', () => {
    render(
      <MiniNutritionBar
        dayNutrition={filledNutrition}
        targetCalories={2000}
        targetProtein={140}
        onSwitchToNutrition={vi.fn()}
      />,
    );
    expect(screen.getByText(/📊/)).toBeInTheDocument();
    expect(screen.getByText(/Dinh dưỡng hôm nay/)).toBeInTheDocument();
  });

  it('handles NaN/Infinity target gracefully', () => {
    render(
      <MiniNutritionBar
        dayNutrition={filledNutrition}
        targetCalories={NaN}
        targetProtein={Infinity}
        onSwitchToNutrition={vi.fn()}
      />,
    );
    expect(screen.getByTestId('budget-setup-label')).toBeInTheDocument();
  });

  it('does not show nudge text in complete state', () => {
    const completedNutrition: DayNutritionSummary = {
      breakfast: makeSlot(['d1'], 800, 50, 80, 20),
      lunch: makeSlot(['d2'], 700, 45, 70, 18),
      dinner: makeSlot(['d3'], 600, 40, 60, 15),
    };
    render(
      <MiniNutritionBar
        dayNutrition={completedNutrition}
        targetCalories={2000}
        targetProtein={140}
        onSwitchToNutrition={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('mini-nutrition-nudge')).not.toBeInTheDocument();
  });

  it('shows no nudge when both remaining protein and calories are low', () => {
    const almostDone: DayNutritionSummary = {
      breakfast: makeSlot(['d1'], 700, 45, 70, 18),
      lunch: makeSlot(['d2'], 650, 40, 65, 16),
      dinner: makeSlot(['d3'], 500, 30, 50, 14),
    };
    render(
      <MiniNutritionBar
        dayNutrition={almostDone}
        targetCalories={2000}
        targetProtein={140}
        onSwitchToNutrition={vi.fn()}
      />,
    );
    // remainingCal=150 (<=200), remainingPro=25 (<=30) → nudge=null
    expect(screen.queryByTestId('mini-nutrition-nudge')).not.toBeInTheDocument();
  });

  it('shows correct remaining when protein remaining exactly 0', () => {
    const exactNutrition: DayNutritionSummary = {
      breakfast: makeSlot(['d1'], 400, 70, 40, 10),
      lunch: makeSlot(['d2'], 400, 70, 60, 15),
      dinner: makeSlot([], 0, 0, 0, 0),
    };
    render(
      <MiniNutritionBar
        dayNutrition={exactNutrition}
        targetCalories={2000}
        targetProtein={140}
        onSwitchToNutrition={vi.fn()}
      />,
    );
    expect(screen.getByTestId('mini-remaining-pro')).toHaveTextContent('Còn: 0 g');
  });
});
