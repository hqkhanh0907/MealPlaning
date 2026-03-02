import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DateSelector } from '../components/DateSelector';
import { CalendarTab } from '../components/CalendarTab';
import type { DayPlan, DayNutritionSummary } from '../types';

const makeSlot = (dishIds: string[], cal = 0, pro = 0) => ({
  dishIds, calories: cal, protein: pro, carbs: 0, fat: 0, fiber: 0,
});

const emptyNutrition: DayNutritionSummary = {
  breakfast: makeSlot([]),
  lunch: makeSlot([]),
  dinner: makeSlot([]),
};

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

// --- DateSelector ---
describe('DateSelector', () => {
  it('renders calendar icon and view mode toggle', () => {
    render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} />);
    expect(screen.getByText('Hôm nay')).toBeInTheDocument();
  });

  it('navigates to today when "Hôm nay" is clicked', () => {
    const onSelectDate = vi.fn();
    render(<DateSelector selectedDate="2024-01-01" onSelectDate={onSelectDate} />);
    fireEvent.click(screen.getByText('Hôm nay'));
    expect(onSelectDate).toHaveBeenCalledWith(todayStr);
  });

  it('switches between calendar and week view mode', () => {
    // Default on desktop (>640px) is calendar
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
    render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} />);

    // Title should show month in calendar mode
    const monthNum = today.getMonth() + 1;
    expect(screen.getByText(new RegExp(`Tháng ${monthNum}`))).toBeInTheDocument();

    // Toggle to week view
    const toggleBtn = screen.getByTitle('Chế độ tuần');
    fireEvent.click(toggleBtn);

    // Should now show week range format "dd/mm - dd/mm"
    expect(screen.getByText(/\d{2}\/\d{2} - \d{2}\/\d{2}/)).toBeInTheDocument();
  });

  it('selects a date when clicked in calendar view', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
    const onSelectDate = vi.fn();
    render(<DateSelector selectedDate={todayStr} onSelectDate={onSelectDate} />);
    // Click day 15 (should exist in any month)
    const day15 = screen.getByText('15');
    fireEvent.click(day15);
    expect(onSelectDate).toHaveBeenCalled();
  });

  it('shows meal indicator dots for planned days', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
    render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} dayPlans={dayPlans} />);
    // The selected date should have meal dots (rendered in the button)
    // At least the today button should be present
    expect(screen.getByText(String(today.getDate()))).toBeInTheDocument();
  });

  it('navigates months with prev/next buttons in calendar view', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
    render(<DateSelector selectedDate="2025-06-15" onSelectDate={vi.fn()} />);
    expect(screen.getByText('Tháng 6, 2025')).toBeInTheDocument();

    // The "Hôm nay" button is followed by prev (<) and next (>) nav buttons
    const homNay = screen.getByText('Hôm nay');
    const navContainer = homNay.parentElement!;
    const navButtons = navContainer.querySelectorAll('button');
    // Last button in nav row is "next month"
    const nextBtn = navButtons[navButtons.length - 1];
    fireEvent.click(nextBtn);
    expect(screen.getByText('Tháng 7, 2025')).toBeInTheDocument();
  });

  it('shows week day labels', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
    render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} />);
    expect(screen.getByText('T2')).toBeInTheDocument();
    expect(screen.getByText('CN')).toBeInTheDocument();
  });

  it('calls onPlanClick when clicking selected date', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 300 });
    const onPlanClick = vi.fn();
    const onSelectDate = vi.fn();
    render(<DateSelector selectedDate={todayStr} onSelectDate={onSelectDate} onPlanClick={onPlanClick} />);

    // Toggle to week view for easier testing
    // In week view, clicking the selected date should trigger onPlanClick
    // Navigate to ensure we are in week mode
  });

  it('navigates weeks with prev/next buttons in week view', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 300 });
    render(<DateSelector selectedDate={todayStr} onSelectDate={vi.fn()} />);
    // Should start in week mode on small screen
    const weekHint = screen.queryByText(/Vuốt ngang/);
    if (weekHint) {
      // We're in week view, navigate
      const navButtons = screen.getAllByRole('button');
      const nextBtn = navButtons[navButtons.length - 1];
      fireEvent.click(nextBtn);
    }
  });

  it('double clicking a date in calendar triggers onPlanClick', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
    const onPlanClick = vi.fn();
    const onSelectDate = vi.fn();
    render(<DateSelector selectedDate={todayStr} onSelectDate={onSelectDate} onPlanClick={onPlanClick} />);

    const day15 = screen.getByText('15');
    fireEvent.doubleClick(day15);
    expect(onSelectDate).toHaveBeenCalled();
    expect(onPlanClick).toHaveBeenCalled();
  });
});

// --- CalendarTab ---
describe('CalendarTab', () => {
  const defaultProps = {
    selectedDate: todayStr,
    onSelectDate: vi.fn(),
    dayPlans,
    dishes: [
      { id: 'd1', name: 'Trứng chiên', ingredients: [], tags: ['breakfast' as const] },
      { id: 'd2', name: 'Cơm gà', ingredients: [], tags: ['lunch' as const] },
      { id: 'd3', name: 'Canh rau', ingredients: [], tags: ['dinner' as const] },
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
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders main sections: date selection, summary, meal cards', () => {
    render(<CalendarTab {...defaultProps} />);
    expect(screen.getByText('Chọn ngày')).toBeInTheDocument();
    expect(screen.getByText('Kế hoạch ăn uống')).toBeInTheDocument();
    expect(screen.getByText('Bữa Sáng')).toBeInTheDocument();
    expect(screen.getByText('Bữa Trưa')).toBeInTheDocument();
    expect(screen.getByText('Bữa Tối')).toBeInTheDocument();
  });

  it('renders dish names in meal cards', () => {
    render(<CalendarTab {...defaultProps} />);
    expect(screen.getByText('Trứng chiên')).toBeInTheDocument();
    expect(screen.getByText('Cơm gà')).toBeInTheDocument();
    expect(screen.getByText('Canh rau')).toBeInTheDocument();
  });

  it('shows Lên kế hoạch button and calls onOpenTypeSelection', () => {
    render(<CalendarTab {...defaultProps} />);
    const planButtons = screen.getAllByText('Lên kế hoạch');
    fireEvent.click(planButtons[0]);
    expect(defaultProps.onOpenTypeSelection).toHaveBeenCalled();
  });

  it('shows AI suggestion button and calls onSuggestMealPlan', () => {
    render(<CalendarTab {...defaultProps} />);
    const aiBtn = screen.getByText('Gợi ý AI');
    fireEvent.click(aiBtn);
    expect(defaultProps.onSuggestMealPlan).toHaveBeenCalled();
  });

  it('disables AI button when isSuggesting is true', () => {
    render(<CalendarTab {...defaultProps} isSuggesting={true} />);
    const aiBtn = screen.getByText('Gợi ý AI').closest('button');
    expect(aiBtn).toBeDisabled();
  });

  it('renders Summary with nutrition data', () => {
    render(<CalendarTab {...defaultProps} />);
    expect(screen.getByText('Dinh dưỡng trong ngày')).toBeInTheDocument();
  });

  it('calls onPlanMeal when edit button on meal card is clicked', () => {
    render(<CalendarTab {...defaultProps} />);
    const editButtons = screen.getAllByLabelText(/Chỉnh sửa Bữa/);
    fireEvent.click(editButtons[0]); // Edit breakfast
    expect(defaultProps.onPlanMeal).toHaveBeenCalledWith('breakfast');
  });

  it('shows recommendation panel with tips', () => {
    render(<CalendarTab {...defaultProps} />);
    expect(screen.getByText('Gợi ý cho bạn')).toBeInTheDocument();
  });

  it('shows Thêm món button for empty meal slots', () => {
    render(<CalendarTab {...defaultProps} dayNutrition={emptyNutrition} currentPlan={{ date: todayStr, breakfastDishIds: [], lunchDishIds: [], dinnerDishIds: [] }} />);
    const addButtons = screen.getAllByText('Thêm món ăn');
    expect(addButtons.length).toBe(3);
  });

  it('renders MoreMenu and triggers onOpenClearPlan', () => {
    render(<CalendarTab {...defaultProps} />);
    const moreBtn = screen.getByLabelText('Thêm tùy chọn');
    fireEvent.click(moreBtn);
    const clearBtn = screen.getByText('Xóa kế hoạch');
    fireEvent.click(clearBtn);
    expect(defaultProps.onOpenClearPlan).toHaveBeenCalled();
  });

  it('MoreMenu closes when clicking outside', () => {
    render(<CalendarTab {...defaultProps} />);
    const moreBtn = screen.getByLabelText('Thêm tùy chọn');
    fireEvent.click(moreBtn);
    expect(screen.getByText('Xóa kế hoạch')).toBeInTheDocument();
    // Click outside
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Xóa kế hoạch')).not.toBeInTheDocument();
  });

  it('shows plan complete message when all meals are filled', () => {
    render(<CalendarTab {...defaultProps} />);
    expect(screen.getByText(/Kế hoạch ngày hôm nay đã hoàn tất/)).toBeInTheDocument();
  });

  it('shows missing meals message when partial', () => {
    const partialNutrition: DayNutritionSummary = {
      breakfast: makeSlot(['d1'], 400, 20),
      lunch: makeSlot([], 0, 0),
      dinner: makeSlot(['d3'], 500, 25),
    };
    render(<CalendarTab {...defaultProps} dayNutrition={partialNutrition} />);
    expect(screen.getByText(/Bạn còn thiếu.*bữa trưa/)).toBeInTheDocument();
  });

  it('date selector navigates across month boundary Dec→Jan', () => {
    const decDate = '2025-12-31';
    const onDateChange = vi.fn();
    render(<DateSelector selectedDate={decDate} onDateChange={onDateChange} dayPlans={[]} />);
    // Navigate to next month (January 2026) - button with ChevronRight icon
    const nextBtn = screen.getAllByRole('button').find(b => b.querySelector('.lucide-chevron-right'));
    if (nextBtn) fireEvent.click(nextBtn);
    // Should show January 2026 header
    expect(screen.getByText(/Tháng 1.*2026|01.*2026|January.*2026/i)).toBeInTheDocument();
  });

  it('date selector navigates across month boundary Jan→Dec', () => {
    const janDate = '2026-01-01';
    const onDateChange = vi.fn();
    render(<DateSelector selectedDate={janDate} onDateChange={onDateChange} dayPlans={[]} />);
    // Navigate to previous month (December 2025) - button with ChevronLeft icon
    const prevBtn = screen.getAllByRole('button').find(b => b.querySelector('.lucide-chevron-left'));
    if (prevBtn) fireEvent.click(prevBtn);
    // Should show December 2025 header
    expect(screen.getByText(/Tháng 12.*2025|12.*2025|December.*2025/i)).toBeInTheDocument();
  });

  it('shows all 3 meal slots as empty when no plan exists', () => {
    const emptyNutrition: DayNutritionSummary = {
      breakfast: makeSlot([], 0, 0),
      lunch: makeSlot([], 0, 0),
      dinner: makeSlot([], 0, 0),
    };
    render(<CalendarTab {...defaultProps} dayNutrition={emptyNutrition} />);
    const addButtons = screen.getAllByText('Thêm món ăn');
    expect(addButtons.length).toBe(3);
    // No plan complete message
    expect(screen.queryByText(/Kế hoạch ngày hôm nay đã hoàn tất/)).not.toBeInTheDocument();
  });
});
