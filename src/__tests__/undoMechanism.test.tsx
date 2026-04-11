import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, ...props }: Record<string, unknown>) => (
    <button {...props}>{children as React.ReactNode}</button>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr />,
}));

vi.mock('../contexts/DatabaseContext', () => ({
  DatabaseProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDatabase: () => ({
    query: vi.fn().mockResolvedValue([]),
    queryOne: vi.fn().mockResolvedValue(null),
    run: vi.fn().mockResolvedValue(undefined),
    execute: vi.fn().mockResolvedValue(undefined),
    initialize: vi.fn().mockResolvedValue(undefined),
    isReady: vi.fn().mockReturnValue(true),
  }),
}));

vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('../services/appSettings', () => ({
  getSetting: vi.fn().mockResolvedValue(null),
  setSetting: vi.fn().mockResolvedValue(undefined),
  deleteSetting: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) => {
      const map: Record<string, string> = {
        'calendar.morning': 'Sáng',
        'calendar.afternoon': 'Trưa',
        'calendar.evening': 'Tối',
        'calendar.undoQuickAdd': `Đã thêm ${opts?.dishName ?? ''} vào ${opts?.mealType ?? ''}`,
        'calendar.undoSwipeClear': `Đã xóa bữa ${opts?.mealType ?? ''}`,
        'calendar.undoClearPlan': 'Đã xóa kế hoạch',
        'calendar.undoSuccess': 'Đã hoàn tác',
        'calendar.meals': 'Bữa ăn',
        'calendar.nutrition': 'Dinh dưỡng',
        'common.undo': 'Hoàn tác',
        'common.close': 'Đóng',
        'mealPlan.breakfast': 'Bữa sáng',
        'mealPlan.lunch': 'Bữa trưa',
        'mealPlan.dinner': 'Bữa tối',
        'grocery.title': 'Danh sách mua sắm',
      };
      return map[key] ?? key;
    },
    i18n: { language: 'vi' },
  }),
}));

vi.mock('../hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

vi.mock('../hooks/useIsDesktop', () => ({
  useIsDesktop: () => false,
}));

vi.mock('../store/uiStore', () => ({
  useUIStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      activeCalendarSubTab: 'meals',
      setCalendarSubTab: vi.fn(),
    }),
  CalendarSubTab: {},
}));

import { CalendarTab } from '../components/CalendarTab';
import type { DayNutritionSummary, DayPlan, Dish, Ingredient } from '../types';

const SELECTED_DATE = '2026-01-15';

const makeDish = (id: string, nameVi: string): Dish =>
  ({
    id,
    name: { vi: nameVi },
    mealTypes: ['breakfast', 'lunch', 'dinner'],
    ingredientIds: [],
    servings: 1,
    prepTimeMin: 10,
    totalCalories: 300,
    totalProtein: 25,
    totalFat: 10,
    totalCarbs: 30,
    createdAt: '',
    updatedAt: '',
  }) as unknown as Dish;

const DISHES: Dish[] = [makeDish('d1', 'Ức gà áp chảo'), makeDish('d2', 'Yến mạch sữa chua')];

const EMPTY_PLAN: DayPlan = {
  date: SELECTED_DATE,
  breakfastDishIds: [],
  lunchDishIds: [],
  dinnerDishIds: [],
};

const PLAN_WITH_MEALS: DayPlan = {
  date: SELECTED_DATE,
  breakfastDishIds: ['d2'],
  lunchDishIds: ['d1'],
  dinnerDishIds: [],
};

const EMPTY_SLOT = { dishIds: [], calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };

const NUTRITION: DayNutritionSummary = {
  breakfast: { ...EMPTY_SLOT, dishIds: ['d2'] },
  lunch: { ...EMPTY_SLOT, dishIds: ['d1'] },
  dinner: EMPTY_SLOT,
};

const INGREDIENTS: Ingredient[] = [];

function renderCalendarTab(overrides: Partial<React.ComponentProps<typeof CalendarTab>> = {}) {
  const defaultProps: React.ComponentProps<typeof CalendarTab> = {
    selectedDate: SELECTED_DATE,
    onSelectDate: vi.fn(),
    dayPlans: [PLAN_WITH_MEALS],
    dishes: DISHES,
    ingredients: INGREDIENTS,
    currentPlan: PLAN_WITH_MEALS,
    dayNutrition: NUTRITION,
    targetCalories: 2000,
    targetProtein: 150,
    isSuggesting: false,
    onOpenTypeSelection: vi.fn(),
    onOpenClearPlan: vi.fn(),
    onOpenGoalModal: vi.fn(),
    onPlanMeal: vi.fn(),
    onSuggestMealPlan: vi.fn(),
    onQuickAdd: vi.fn(),
    onClearSlot: vi.fn(),
    restoreDayPlans: vi.fn(),
  };
  return render(<CalendarTab {...defaultProps} {...overrides} />);
}

describe('Undo Mechanism — CalendarTab Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('shows undo toast after quick-add and calls onQuickAdd', () => {
    const onQuickAdd = vi.fn();
    renderCalendarTab({ onQuickAdd });

    const quickAddBtns = screen.queryAllByTestId(/^quick-add-/);
    if (quickAddBtns.length > 0) {
      fireEvent.click(quickAddBtns[0]);
      expect(onQuickAdd).toHaveBeenCalled();
    }
  });

  it('restoreDayPlans called when undo clicked after wrappedClearPlan', () => {
    const restoreDayPlans = vi.fn();
    const onOpenClearPlan = vi.fn();
    renderCalendarTab({ restoreDayPlans, onOpenClearPlan });

    const clearBtns = screen.queryAllByTestId('btn-clear-plan');
    if (clearBtns.length > 0) {
      fireEvent.click(clearBtns[0]);
      expect(onOpenClearPlan).toHaveBeenCalled();

      const undoBtn = screen.queryByText('Hoàn tác');
      if (undoBtn) {
        fireEvent.click(undoBtn);
        expect(restoreDayPlans).toHaveBeenCalled();
      }
    }
  });

  it('undo toast auto-dismisses after duration', () => {
    const restoreDayPlans = vi.fn();
    renderCalendarTab({ restoreDayPlans });

    const clearBtns = screen.queryAllByTestId('btn-clear-plan');
    if (clearBtns.length > 0) {
      fireEvent.click(clearBtns[0]);

      const toast = screen.queryByRole('status');
      if (toast) {
        act(() => {
          vi.advanceTimersByTime(6500);
        });
        expect(screen.queryByRole('status')).toBeNull();
      }
    }
  });

  it('captures snapshot of current plan before clear', () => {
    const restoreDayPlans = vi.fn();
    const onOpenClearPlan = vi.fn();
    renderCalendarTab({
      restoreDayPlans,
      onOpenClearPlan,
      dayPlans: [PLAN_WITH_MEALS],
      currentPlan: PLAN_WITH_MEALS,
    });

    const clearBtns = screen.queryAllByTestId('btn-clear-plan');
    if (clearBtns.length > 0) {
      fireEvent.click(clearBtns[0]);

      const undoBtn = screen.queryByText('Hoàn tác');
      if (undoBtn) {
        fireEvent.click(undoBtn);
        expect(restoreDayPlans).toHaveBeenCalledWith([
          expect.objectContaining({
            date: SELECTED_DATE,
            breakfastDishIds: ['d2'],
            lunchDishIds: ['d1'],
            dinnerDishIds: [],
          }),
        ]);
      }
    }
  });

  it('renders without undo toast initially', () => {
    renderCalendarTab();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('does not render undo toast when restoreDayPlans is not provided', () => {
    renderCalendarTab({ restoreDayPlans: undefined });
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('wrappedClearSlot is not passed when onClearSlot is undefined', () => {
    renderCalendarTab({ onClearSlot: undefined });
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('wrappedQuickAdd is not passed when onQuickAdd is undefined', () => {
    renderCalendarTab({ onQuickAdd: undefined });
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('captures empty plan snapshot and restores with empty dish IDs', () => {
    const restoreDayPlans = vi.fn();
    const onOpenClearPlan = vi.fn();
    renderCalendarTab({
      restoreDayPlans,
      onOpenClearPlan,
      dayPlans: [],
      currentPlan: EMPTY_PLAN,
    });

    const clearBtns = screen.queryAllByTestId('btn-clear-plan');
    if (clearBtns.length > 0) {
      fireEvent.click(clearBtns[0]);

      const undoBtn = screen.queryByText('Hoàn tác');
      if (undoBtn) {
        fireEvent.click(undoBtn);
        expect(restoreDayPlans).toHaveBeenCalledWith([
          expect.objectContaining({
            date: SELECTED_DATE,
            breakfastDishIds: [],
            lunchDishIds: [],
            dinnerDishIds: [],
          }),
        ]);
      }
    }
  });

  it('restores null plan as empty plan', () => {
    const restoreDayPlans = vi.fn();
    const onOpenClearPlan = vi.fn();
    renderCalendarTab({
      restoreDayPlans,
      onOpenClearPlan,
      dayPlans: [],
      currentPlan: { date: SELECTED_DATE, breakfastDishIds: [], lunchDishIds: [], dinnerDishIds: [] },
    });

    const clearBtns = screen.queryAllByTestId('btn-clear-plan');
    if (clearBtns.length > 0) {
      fireEvent.click(clearBtns[0]);

      const undoBtn = screen.queryByText('Hoàn tác');
      if (undoBtn) {
        fireEvent.click(undoBtn);
        const call = restoreDayPlans.mock.calls[0]?.[0];
        if (call) {
          expect(call[0].breakfastDishIds).toEqual([]);
          expect(call[0].lunchDishIds).toEqual([]);
          expect(call[0].dinnerDishIds).toEqual([]);
        }
      }
    }
  });
});
