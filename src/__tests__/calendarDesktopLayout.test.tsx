import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarTab } from '../components/CalendarTab';
import type { DayPlan, DayNutritionSummary } from '../types';
import { useIsDesktop } from '../hooks/useIsDesktop';

vi.mock('../hooks/useIsDesktop', () => ({
  useIsDesktop: vi.fn(() => true),
}));

const makeSlot = (dishIds: string[], cal = 0, pro = 0) => ({
  dishIds, calories: cal, protein: pro, carbs: 0, fat: 0, fiber: 0,
});

const filledNutrition: DayNutritionSummary = {
  breakfast: makeSlot(['d1'], 400, 20),
  lunch: makeSlot(['d2'], 600, 30),
  dinner: makeSlot(['d3'], 500, 25),
};

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

const dayPlans: DayPlan[] = [
  { date: todayStr, breakfastDishIds: ['d1'], lunchDishIds: ['d2'], dinnerDishIds: ['d3'] },
];

const defaultProps = {
  selectedDate: todayStr,
  onSelectDate: vi.fn(),
  dayPlans,
  dishes: [
    { id: 'd1', name: { vi: 'Trứng chiên', en: 'Fried Egg' }, ingredients: [], tags: ['breakfast' as const] },
    { id: 'd2', name: { vi: 'Cơm gà', en: 'Chicken Rice' }, ingredients: [], tags: ['lunch' as const] },
    { id: 'd3', name: { vi: 'Canh rau', en: 'Veggie Soup' }, ingredients: [], tags: ['dinner' as const] },
  ],
  ingredients: [],
  currentPlan: dayPlans[0],
  dayNutrition: filledNutrition,
  userWeight: 70,
  targetCalories: 2000,
  targetProtein: 140,
  isSuggesting: false,
  onOpenTypeSelection: vi.fn(),
  onOpenClearPlan: vi.fn(),
  onOpenGoalModal: vi.fn(),
  onPlanMeal: vi.fn(),
  onSuggestMealPlan: vi.fn(),
  onCopyPlan: vi.fn(),
  onSaveTemplate: vi.fn(),
  onOpenTemplateManager: vi.fn(),
};

describe('CalendarTab – desktop layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIsDesktop).mockReturnValue(true);
  });

  it('renders side-by-side MealsSubTab and NutritionSubTab', () => {
    render(<CalendarTab {...defaultProps} />);
    expect(screen.getByTestId('meals-subtab')).toBeInTheDocument();
    expect(screen.getByTestId('nutrition-subtab')).toBeInTheDocument();
    expect(screen.queryByTestId('schedule-subtabs')).not.toBeInTheDocument();
  });

  it('renders dish names in desktop layout', () => {
    render(<CalendarTab {...defaultProps} />);
    expect(screen.getByText('Trứng chiên')).toBeInTheDocument();
    expect(screen.getByText('Cơm gà')).toBeInTheDocument();
    expect(screen.getByText('Canh rau')).toBeInTheDocument();
  });

  it('shows plan complete message in desktop layout', () => {
    render(<CalendarTab {...defaultProps} />);
    const completeMessages = screen.getAllByText(/Kế hoạch ngày hôm nay đã hoàn tất/);
    expect(completeMessages.length).toBeGreaterThanOrEqual(1);
  });

  it('renders recommendation panel in desktop layout', () => {
    render(<CalendarTab {...defaultProps} />);
    expect(screen.getByText('Gợi ý cho bạn')).toBeInTheDocument();
  });

  it('does not render switch-to-meals button in desktop NutritionSubTab', () => {
    render(<CalendarTab {...defaultProps} />);
    expect(screen.queryByTestId('btn-switch-to-meals')).not.toBeInTheDocument();
  });

  it('renders mobile layout when isDesktop returns false', () => {
    vi.mocked(useIsDesktop).mockReturnValue(false);
    render(<CalendarTab {...defaultProps} />);
    expect(screen.getByTestId('schedule-subtabs')).toBeInTheDocument();
    expect(screen.queryByTestId('nutrition-subtab')).not.toBeInTheDocument();
  });

  it('switches desktop MealsSubTab onSwitchToNutrition via MiniNutritionBar', () => {
    render(<CalendarTab {...defaultProps} />);
    fireEvent.click(screen.getByTestId('mini-nutrition-bar'));
    expect(screen.getByTestId('meals-subtab')).toBeInTheDocument();
  });
});
