import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MealPlannerModal } from '../components/modals/MealPlannerModal';
import type { Dish, Ingredient, DayPlan } from '../types';

vi.mock('../hooks/useModalBackHandler', () => ({ useModalBackHandler: vi.fn() }));

const ingredients: Ingredient[] = [
  { id: 'i1', name: { vi: 'Ức gà', en: 'Ức gà' }, caloriesPer100: 165, proteinPer100: 31, carbsPer100: 0, fatPer100: 3.6, fiberPer100: 0, unit: { vi: 'g', en: 'g' } },
  { id: 'i2', name: { vi: 'Cơm trắng', en: 'Cơm trắng' }, caloriesPer100: 130, proteinPer100: 2.7, carbsPer100: 28, fatPer100: 0.3, fiberPer100: 0.4, unit: { vi: 'g', en: 'g' } },
];

const dishes: Dish[] = [
  { id: 'd1', name: { vi: 'Gà nướng', en: 'Grilled chicken' }, ingredients: [{ ingredientId: 'i1', amount: 200 }], tags: ['lunch', 'dinner'] },
  { id: 'd2', name: { vi: 'Cơm gà', en: 'Chicken rice' }, ingredients: [{ ingredientId: 'i1', amount: 100 }, { ingredientId: 'i2', amount: 200 }], tags: ['lunch'] },
  { id: 'd3', name: { vi: 'Cháo gà', en: 'Chicken porridge' }, ingredients: [{ ingredientId: 'i1', amount: 50 }], tags: ['breakfast'] },
];

const emptyPlan: DayPlan = {
  date: '2024-01-15',
  breakfastDishIds: [],
  lunchDishIds: [],
  dinnerDishIds: [],
};

const populatedPlan: DayPlan = {
  date: '2024-01-15',
  breakfastDishIds: ['d3'],
  lunchDishIds: ['d1'],
  dinnerDishIds: [],
};

describe('MealPlannerModal', () => {
  const defaultProps = {
    dishes,
    ingredients,
    currentPlan: emptyPlan,
    selectedDate: '2024-01-15',
    initialTab: 'lunch' as const,
    onConfirm: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders header with plan title and selected date', () => {
    render(<MealPlannerModal {...defaultProps} />);
    expect(screen.getByText(/Kế hoạch bữa ăn/)).toBeInTheDocument();
    expect(screen.getByText(/2024-01-15/)).toBeInTheDocument();
  });

  it('renders 3 meal tabs', () => {
    render(<MealPlannerModal {...defaultProps} />);
    expect(screen.getByText('Bữa Sáng')).toBeInTheDocument();
    expect(screen.getByText('Bữa Trưa')).toBeInTheDocument();
    expect(screen.getByText('Bữa Tối')).toBeInTheDocument();
  });

  it('filters dishes by active tab tag', () => {
    render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
    expect(screen.getByText('Gà nướng')).toBeInTheDocument();
    expect(screen.getByText('Cơm gà')).toBeInTheDocument();
    expect(screen.queryByText('Cháo gà')).not.toBeInTheDocument();
  });

  it('switches tab and shows correct dishes', () => {
    render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
    fireEvent.click(screen.getByText('Bữa Sáng'));
    expect(screen.getByText('Cháo gà')).toBeInTheDocument();
    expect(screen.queryByText('Cơm gà')).not.toBeInTheDocument();
  });

  it('resets search when switching tabs', () => {
    render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
    const search = screen.getByTestId('input-search-plan');
    fireEvent.change(search, { target: { value: 'Cơm' } });
    expect(screen.queryByText('Gà nướng')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Bữa Sáng'));
    expect(screen.getByText('Cháo gà')).toBeInTheDocument();
  });

  it('toggles dish selection on click', () => {
    render(<MealPlannerModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Gà nướng'));
    const footer = screen.getByTestId('btn-confirm-plan').closest('div')?.parentElement;
    expect(footer?.textContent).toContain('1');
    fireEvent.click(screen.getByText('Gà nướng'));
    expect(footer?.textContent).toContain('0');
  });

  it('shows pre-selected dishes from currentPlan', () => {
    render(<MealPlannerModal {...defaultProps} currentPlan={populatedPlan} initialTab="lunch" />);
    const footer = screen.getByTestId('btn-confirm-plan').closest('div')?.parentElement;
    expect(footer?.textContent).toContain('1');
  });

  it('calls onConfirm with only changed tabs', () => {
    render(<MealPlannerModal {...defaultProps} currentPlan={emptyPlan} initialTab="lunch" />);
    fireEvent.click(screen.getByText('Gà nướng'));
    fireEvent.click(screen.getByTestId('btn-confirm-plan'));
    expect(defaultProps.onConfirm).toHaveBeenCalledWith({ lunch: ['d1'] });
  });

  it('calls onConfirm with changes from multiple tabs', () => {
    render(<MealPlannerModal {...defaultProps} currentPlan={emptyPlan} initialTab="lunch" />);
    fireEvent.click(screen.getByText('Gà nướng'));
    fireEvent.click(screen.getByText('Bữa Sáng'));
    fireEvent.click(screen.getByText('Cháo gà'));
    fireEvent.click(screen.getByTestId('btn-confirm-plan'));
    expect(defaultProps.onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ lunch: ['d1'], breakfast: ['d3'] })
    );
  });

  it('shows "Lưu tất cả" when multiple tabs changed', () => {
    render(<MealPlannerModal {...defaultProps} currentPlan={emptyPlan} initialTab="lunch" />);
    fireEvent.click(screen.getByText('Gà nướng'));
    fireEvent.click(screen.getByText('Bữa Sáng'));
    fireEvent.click(screen.getByText('Cháo gà'));
    expect(screen.getByText(/Lưu tất cả/)).toBeInTheDocument();
  });

  it('shows single-tab confirm label when only 1 tab changed', () => {
    render(<MealPlannerModal {...defaultProps} currentPlan={emptyPlan} initialTab="lunch" />);
    fireEvent.click(screen.getByText('Gà nướng'));
    expect(screen.getByText(/Xác nhận \(1\)/)).toBeInTheDocument();
  });

  it('calls onConfirm with empty object when nothing changed', () => {
    render(<MealPlannerModal {...defaultProps} currentPlan={emptyPlan} />);
    fireEvent.click(screen.getByTestId('btn-confirm-plan'));
    expect(defaultProps.onConfirm).toHaveBeenCalledWith({});
  });

  it('calls onClose when X button is clicked', () => {
    render(<MealPlannerModal {...defaultProps} />);
    const closeBtn = screen.getAllByRole('button').find(b => b.querySelector('.lucide-x'));
    if (closeBtn) fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('filters dishes by search query', () => {
    render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
    const search = screen.getByTestId('input-search-plan');
    fireEvent.change(search, { target: { value: 'Cơm' } });
    expect(screen.getByText('Cơm gà')).toBeInTheDocument();
    expect(screen.queryByText('Gà nướng')).not.toBeInTheDocument();
  });

  it('shows empty state when no dishes match', () => {
    render(<MealPlannerModal {...defaultProps} dishes={[]} />);
    expect(screen.getByText(/Chưa có món ăn phù hợp/)).toBeInTheDocument();
  });

  it('shows nutrition pills on dish cards', () => {
    render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
    expect(screen.getAllByText(/kcal/).length).toBeGreaterThan(0);
  });

  it('shows total day summary in footer', () => {
    render(<MealPlannerModal {...defaultProps} currentPlan={populatedPlan} initialTab="lunch" />);
    expect(screen.getByText(/Tổng ngày/)).toBeInTheDocument();
  });

  it('shows tab badge count for pre-selected dishes', () => {
    render(<MealPlannerModal {...defaultProps} currentPlan={populatedPlan} initialTab="lunch" />);
    const breakfastTab = screen.getByText('Bữa Sáng').closest('button');
    expect(breakfastTab?.textContent).toContain('1');
  });

  it('shows change indicator dot when tab has unsaved changes', () => {
    render(<MealPlannerModal {...defaultProps} currentPlan={emptyPlan} initialTab="lunch" />);
    fireEvent.click(screen.getByText('Gà nướng'));
    const lunchTab = screen.getByText('Bữa Trưa').closest('button');
    const dot = lunchTab?.querySelector('.rounded-full.w-2');
    expect(dot).toBeTruthy();
  });

  it('changes sort order', () => {
    render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
    const select = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(select, { target: { value: 'name-desc' } });
    expect(screen.getByText('Gà nướng')).toBeInTheDocument();
    expect(screen.getByText('Cơm gà')).toBeInTheDocument();
  });

  it('sorts dishes by calories ascending', () => {
    render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
    const select = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(select, { target: { value: 'cal-asc' } });
    const calMatches = screen.getAllByText(/kcal/);
    expect(calMatches[0].textContent).toContain('330');
  });

  it('sorts dishes by calories descending', () => {
    render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
    const select = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(select, { target: { value: 'cal-desc' } });
    const calMatches = screen.getAllByText(/kcal/);
    expect(calMatches[0].textContent).toContain('425');
  });

  it('sorts dishes by protein ascending', () => {
    render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
    const select = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(select, { target: { value: 'pro-asc' } });
    const dishNames = screen.getAllByText(/gà/i);
    expect(dishNames[0].textContent).toContain('Cơm gà');
  });

  it('sorts dishes by protein descending', () => {
    render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
    const select = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(select, { target: { value: 'pro-desc' } });
    const dishNames = screen.getAllByText(/gà/i);
    expect(dishNames[0].textContent).toContain('Gà nướng');
  });

  it('shows search empty state when no matches found', () => {
    render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
    const search = screen.getByTestId('input-search-plan');
    fireEvent.change(search, { target: { value: 'không tồn tại xyz' } });
    expect(screen.queryByText('Gà nướng')).not.toBeInTheDocument();
    expect(screen.queryByText('Cơm gà')).not.toBeInTheDocument();
  });

  it('combines search filter with sort order', () => {
    render(<MealPlannerModal {...defaultProps} initialTab="lunch" />);
    const search = screen.getByTestId('input-search-plan');
    fireEvent.change(search, { target: { value: 'gà' } });
    const select = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(select, { target: { value: 'cal-desc' } });
    expect(screen.getByText('Gà nướng')).toBeInTheDocument();
    expect(screen.getByText('Cơm gà')).toBeInTheDocument();
  });

  it('shows selected nutrition summary for active tab', () => {
    render(<MealPlannerModal {...defaultProps} currentPlan={populatedPlan} initialTab="lunch" />);
    const calMatches = screen.getAllByText(/330/);
    expect(calMatches.length).toBeGreaterThan(0);
  });

  it('shows accurate total nutrition for multiple selected dishes', () => {
    render(<MealPlannerModal {...defaultProps} currentPlan={{ ...emptyPlan, lunchDishIds: ['d1', 'd2'] }} initialTab="lunch" />);
    const footer = screen.getByTestId('btn-confirm-plan').closest('div')?.parentElement;
    expect(footer?.textContent).toContain('2');
    const calMatches = screen.getAllByText(/755/);
    expect(calMatches.length).toBeGreaterThan(0);
  });

  it('defaults to breakfast tab when no initialTab specified', () => {
    render(<MealPlannerModal {...defaultProps} initialTab={undefined} />);
    expect(screen.getByText('Cháo gà')).toBeInTheDocument();
  });
});
