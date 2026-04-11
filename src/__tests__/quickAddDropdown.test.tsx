import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MealsSubTab, MealsSubTabProps } from '../components/schedule/MealsSubTab';
import type { DayNutritionSummary, Dish, SlotInfo } from '../types';

vi.mock('@/components/ui/dropdown-menu', () => {
  return {
    DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-root">{children}</div>,
    DropdownMenuTrigger: ({ children, ...props }: Record<string, unknown>) => (
      <button {...props}>{children as React.ReactNode}</button>
    ),
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="more-actions-menu" role="menu">
        {children}
      </div>
    ),
    DropdownMenuItem: ({
      children,
      onClick,
      disabled,
      variant,
      ...props
    }: {
      children: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
      variant?: string;
      [key: string]: unknown;
    }) => (
      <button
        role="menuitem"
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        data-variant={variant}
        {...props}
      >
        {children}
      </button>
    ),
    DropdownMenuSeparator: () => <hr data-testid="menu-separator" role="separator" />,
  };
});

vi.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: () => ({ isDark: false, theme: 'light', cycleTheme: vi.fn(), setTheme: vi.fn() }),
}));

const makeSlot = (dishIds: string[], cal = 0, pro = 0): SlotInfo => ({
  dishIds,
  calories: cal,
  protein: pro,
  carbs: 0,
  fat: 0,
  fiber: 0,
});

const dishes: Dish[] = [
  { id: 'd1', name: { vi: 'Trứng chiên' }, ingredients: [], tags: ['breakfast'] },
  { id: 'd2', name: { vi: 'Cơm gà' }, ingredients: [], tags: ['lunch'] },
  { id: 'd3', name: { vi: 'Canh rau' }, ingredients: [], tags: ['dinner'] },
  { id: 'd4', name: { vi: 'Phở bò' }, ingredients: [], tags: ['breakfast'] },
];

const makeBaseProps = (overrides?: Partial<MealsSubTabProps>): MealsSubTabProps => ({
  dayNutrition: {
    breakfast: makeSlot(['d1'], 400, 20),
    lunch: makeSlot(['d2'], 600, 30),
    dinner: makeSlot(['d3'], 500, 25),
  },
  dishes,
  targetCalories: 2000,
  targetProtein: 140,
  isSuggesting: false,
  onPlanMeal: vi.fn(),
  onOpenTypeSelection: vi.fn(),
  onSuggestMealPlan: vi.fn(),
  onOpenClearPlan: vi.fn(),
  onSwitchToNutrition: vi.fn(),
  ...overrides,
});

describe('QuickAddDropdown', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hides recent dishes section when 0 empty slots', () => {
    const onQuickAdd = vi.fn();
    render(<MealsSubTab {...makeBaseProps({ recentDishIds: ['d4'], onQuickAdd })} />);
    expect(screen.queryByTestId('recent-dishes-section')).not.toBeInTheDocument();
  });

  it('instant adds to the only empty slot when 1 empty slot', () => {
    const onQuickAdd = vi.fn();
    const nutrition: DayNutritionSummary = {
      breakfast: makeSlot(['d1'], 400, 20),
      lunch: makeSlot(['d2'], 600, 30),
      dinner: makeSlot([]),
    };
    render(<MealsSubTab {...makeBaseProps({ dayNutrition: nutrition, recentDishIds: ['d4'], onQuickAdd })} />);
    fireEvent.click(screen.getByTestId('btn-recent-d4'));
    expect(onQuickAdd).toHaveBeenCalledWith('dinner', 'd4');
  });

  it('shows dropdown with 2 options when 2 empty slots', () => {
    const onQuickAdd = vi.fn();
    const nutrition: DayNutritionSummary = {
      breakfast: makeSlot(['d1'], 400, 20),
      lunch: makeSlot([]),
      dinner: makeSlot([]),
    };
    render(<MealsSubTab {...makeBaseProps({ dayNutrition: nutrition, recentDishIds: ['d4'], onQuickAdd })} />);
    fireEvent.click(screen.getByTestId('btn-recent-d4'));
    expect(screen.getByTestId('btn-quick-add-lunch-d4')).toBeInTheDocument();
    expect(screen.getByTestId('btn-quick-add-dinner-d4')).toBeInTheDocument();
    expect(screen.queryByTestId('btn-quick-add-breakfast-d4')).not.toBeInTheDocument();
  });

  it('shows dropdown with 3 options when 3 empty slots', () => {
    const onQuickAdd = vi.fn();
    const nutrition: DayNutritionSummary = {
      breakfast: makeSlot([]),
      lunch: makeSlot([]),
      dinner: makeSlot([]),
    };
    render(<MealsSubTab {...makeBaseProps({ dayNutrition: nutrition, recentDishIds: ['d4'], onQuickAdd })} />);
    fireEvent.click(screen.getByTestId('btn-recent-d4'));
    expect(screen.getByTestId('btn-quick-add-breakfast-d4')).toBeInTheDocument();
    expect(screen.getByTestId('btn-quick-add-lunch-d4')).toBeInTheDocument();
    expect(screen.getByTestId('btn-quick-add-dinner-d4')).toBeInTheDocument();
  });

  it('fires onQuickAdd and closes dropdown on option click', () => {
    const onQuickAdd = vi.fn();
    const nutrition: DayNutritionSummary = {
      breakfast: makeSlot([]),
      lunch: makeSlot([]),
      dinner: makeSlot(['d3'], 500, 25),
    };
    render(<MealsSubTab {...makeBaseProps({ dayNutrition: nutrition, recentDishIds: ['d4'], onQuickAdd })} />);
    fireEvent.click(screen.getByTestId('btn-recent-d4'));
    expect(screen.getByTestId('btn-quick-add-breakfast-d4')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('btn-quick-add-lunch-d4'));
    expect(onQuickAdd).toHaveBeenCalledWith('lunch', 'd4');
    expect(screen.queryByTestId('btn-quick-add-breakfast-d4')).not.toBeInTheDocument();
  });

  it('closes dropdown on click outside', () => {
    const onQuickAdd = vi.fn();
    const nutrition: DayNutritionSummary = {
      breakfast: makeSlot([]),
      lunch: makeSlot([]),
      dinner: makeSlot(['d3'], 500, 25),
    };
    render(<MealsSubTab {...makeBaseProps({ dayNutrition: nutrition, recentDishIds: ['d4'], onQuickAdd })} />);
    fireEvent.click(screen.getByTestId('btn-recent-d4'));
    expect(screen.getByTestId('btn-quick-add-breakfast-d4')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId('btn-quick-add-breakfast-d4')).not.toBeInTheDocument();
  });

  it('closes dropdown on Escape key', () => {
    const onQuickAdd = vi.fn();
    const nutrition: DayNutritionSummary = {
      breakfast: makeSlot([]),
      lunch: makeSlot([]),
      dinner: makeSlot(['d3'], 500, 25),
    };
    render(<MealsSubTab {...makeBaseProps({ dayNutrition: nutrition, recentDishIds: ['d4'], onQuickAdd })} />);
    fireEvent.click(screen.getByTestId('btn-recent-d4'));
    expect(screen.getByTestId('btn-quick-add-breakfast-d4')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('btn-quick-add-breakfast-d4')).not.toBeInTheDocument();
  });

  it('debounces chip for 300ms after tap', () => {
    vi.useFakeTimers();
    const onQuickAdd = vi.fn();
    const nutrition: DayNutritionSummary = {
      breakfast: makeSlot(['d1'], 400, 20),
      lunch: makeSlot(['d2'], 600, 30),
      dinner: makeSlot([]),
    };
    render(<MealsSubTab {...makeBaseProps({ dayNutrition: nutrition, recentDishIds: ['d4'], onQuickAdd })} />);
    const chip = screen.getByTestId('btn-recent-d4');

    fireEvent.click(chip);
    expect(onQuickAdd).toHaveBeenCalledTimes(1);
    expect(chip).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(chip).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(chip).not.toBeDisabled();

    vi.useRealTimers();
  });

  it('shows section header "GẦN ĐÂY"', () => {
    const onQuickAdd = vi.fn();
    const nutrition: DayNutritionSummary = {
      breakfast: makeSlot([]),
      lunch: makeSlot([]),
      dinner: makeSlot([]),
    };
    render(<MealsSubTab {...makeBaseProps({ dayNutrition: nutrition, recentDishIds: ['d4'], onQuickAdd })} />);
    expect(screen.getByText('GẦN ĐÂY')).toBeInTheDocument();
  });

  it('does not show recent section when onQuickAdd not provided', () => {
    const nutrition: DayNutritionSummary = {
      breakfast: makeSlot([]),
      lunch: makeSlot([]),
      dinner: makeSlot([]),
    };
    render(<MealsSubTab {...makeBaseProps({ dayNutrition: nutrition, recentDishIds: ['d4'] })} />);
    expect(screen.queryByTestId('recent-dishes-section')).not.toBeInTheDocument();
  });

  it('toggles dropdown off when clicking same dish again', () => {
    const onQuickAdd = vi.fn();
    const nutrition: DayNutritionSummary = {
      breakfast: makeSlot([]),
      lunch: makeSlot([]),
      dinner: makeSlot(['d3'], 500, 25),
    };
    render(<MealsSubTab {...makeBaseProps({ dayNutrition: nutrition, recentDishIds: ['d4'], onQuickAdd })} />);
    fireEvent.click(screen.getByTestId('btn-recent-d4'));
    expect(screen.getByTestId('btn-quick-add-breakfast-d4')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('btn-recent-d4'));
    expect(screen.queryByTestId('btn-quick-add-breakfast-d4')).not.toBeInTheDocument();
  });
});
