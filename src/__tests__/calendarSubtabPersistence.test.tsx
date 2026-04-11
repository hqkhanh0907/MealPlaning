import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import { CalendarTab } from '../components/CalendarTab';
import { useUIStore } from '../store/uiStore';
import type { DayNutritionSummary, DayPlan } from '../types';

const makeSlot = (dishIds: string[], cal = 0, pro = 0) => ({
  dishIds,
  calories: cal,
  protein: pro,
  carbs: 0,
  fat: 0,
  fiber: 0,
});

const filledNutrition: DayNutritionSummary = {
  breakfast: makeSlot(['d1'], 400, 20),
  lunch: makeSlot(['d2'], 600, 30),
  dinner: makeSlot(['d3'], 500, 25),
};

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

const dayPlans: DayPlan[] = [{ date: todayStr, breakfastDishIds: ['d1'], lunchDishIds: ['d2'], dinnerDishIds: ['d3'] }];

const defaultProps = {
  selectedDate: todayStr,
  onSelectDate: vi.fn(),
  dayPlans,
  dishes: [
    { id: 'd1', name: { vi: 'Trứng chiên', en: 'Trứng chiên' }, ingredients: [], tags: ['breakfast' as const] },
    { id: 'd2', name: { vi: 'Cơm gà', en: 'Cơm gà' }, ingredients: [], tags: ['lunch' as const] },
    { id: 'd3', name: { vi: 'Canh rau', en: 'Canh rau' }, ingredients: [], tags: ['dinner' as const] },
  ],
  ingredients: [],
  currentPlan: dayPlans[0],
  dayNutrition: filledNutrition,
  targetCalories: 2000,
  targetProtein: 140,
  isSuggesting: false,
  onOpenTypeSelection: vi.fn(),
  onOpenClearPlan: vi.fn(),
  onOpenGoalModal: vi.fn(),
  onPlanMeal: vi.fn(),
  onSuggestMealPlan: vi.fn(),
};

describe('Calendar subtab persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.setState({ activeCalendarSubTab: 'meals' });
  });

  it('defaults to meals subtab on cold start', () => {
    expect(useUIStore.getState().activeCalendarSubTab).toBe('meals');
    render(<CalendarTab {...defaultProps} />);
    expect(screen.getByTestId('meals-subtab')).toBeInTheDocument();
  });

  it('persists nutrition subtab selection in uiStore', () => {
    render(<CalendarTab {...defaultProps} />);
    fireEvent.click(screen.getByTestId('subtab-nutrition'));
    expect(useUIStore.getState().activeCalendarSubTab).toBe('nutrition');
  });

  it('restores nutrition subtab after remount (simulates tab navigation)', () => {
    useUIStore.setState({ activeCalendarSubTab: 'nutrition' });
    render(<CalendarTab {...defaultProps} />);
    expect(screen.getByTestId('nutrition-subtab')).toBeInTheDocument();
  });

  it('survives unmount/remount cycle preserving subtab state', () => {
    const { unmount } = render(<CalendarTab {...defaultProps} />);
    fireEvent.click(screen.getByTestId('subtab-nutrition'));
    expect(useUIStore.getState().activeCalendarSubTab).toBe('nutrition');

    unmount();

    render(<CalendarTab {...defaultProps} />);
    expect(screen.getByTestId('nutrition-subtab')).toBeInTheDocument();
  });

  it('resets to meals on hydrate (cold start behavior)', () => {
    useUIStore.setState({ activeCalendarSubTab: 'nutrition' });
    useUIStore.getState().hydrate();
    expect(useUIStore.getState().activeCalendarSubTab).toBe('meals');
  });

  it('desktop layout renders both panels regardless of stored subtab', () => {
    const origMediaQuery = globalThis.matchMedia;
    globalThis.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('min-width'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    useUIStore.setState({ activeCalendarSubTab: 'nutrition' });

    render(<CalendarTab {...defaultProps} />);

    expect(screen.getByTestId('meals-subtab')).toBeInTheDocument();
    expect(screen.getByTestId('nutrition-subtab')).toBeInTheDocument();

    globalThis.matchMedia = origMediaQuery;
  });

  it('switching back to meals persists in store', () => {
    useUIStore.setState({ activeCalendarSubTab: 'nutrition' });
    render(<CalendarTab {...defaultProps} />);

    fireEvent.click(screen.getByTestId('subtab-meals'));
    expect(useUIStore.getState().activeCalendarSubTab).toBe('meals');
  });
});
