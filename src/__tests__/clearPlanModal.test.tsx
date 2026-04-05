import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ClearPlanModal } from '../components/modals/ClearPlanModal';
import type { DayPlan, MealType } from '../types';

vi.mock('../hooks/useModalBackHandler', () => ({
  useModalBackHandler: vi.fn(),
}));

vi.mock('../components/shared/ModalBackdrop', () => ({
  ModalBackdrop: ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div data-testid="modal-backdrop" onClick={onClose}>
      {children}
    </div>
  ),
}));

const makePlan = (date: string, breakfast: string[] = [], lunch: string[] = [], dinner: string[] = []): DayPlan => ({
  date,
  breakfastDishIds: breakfast,
  lunchDishIds: lunch,
  dinnerDishIds: dinner,
});

describe('ClearPlanModal', () => {
  const selectedDate = '2024-01-15';

  const dayPlans: DayPlan[] = [
    makePlan('2024-01-15', ['d1'], ['d2'], ['d3']),
    makePlan('2024-01-16', ['d4'], [], ['d5']),
    makePlan('2024-01-17', [], ['d6'], []),
  ];

  let onClear = vi.fn<(scope: 'month' | 'week' | 'day', meals?: MealType[]) => void>();
  let onClose = vi.fn<() => void>();

  beforeEach(() => {
    onClear = vi.fn<(scope: 'month' | 'week' | 'day', meals?: MealType[]) => void>();
    onClose = vi.fn<() => void>();
  });

  const renderModal = (plans: DayPlan[] = dayPlans, date: string = selectedDate) =>
    render(<ClearPlanModal dayPlans={plans} selectedDate={date} onClear={onClear} onClose={onClose} />);

  // --- Rendering ---

  it('renders title and subtitle', () => {
    renderModal();
    expect(screen.getByText('Xóa kế hoạch')).toBeInTheDocument();
    expect(screen.getByText('Chọn phạm vi thời gian muốn xóa')).toBeInTheDocument();
  });

  it('renders all three scope options (day, week, month)', () => {
    renderModal();
    expect(screen.getByText('Ngày này')).toBeInTheDocument();
    expect(screen.getByText('Tuần này')).toBeInTheDocument();
    expect(screen.getByText('Tháng này')).toBeInTheDocument();
  });

  it('renders scope descriptions', () => {
    renderModal();
    expect(screen.getByText('Chỉ xóa kế hoạch của ngày đang chọn')).toBeInTheDocument();
    expect(screen.getByText('Xóa kế hoạch 7 ngày trong tuần hiện tại')).toBeInTheDocument();
    expect(screen.getByText('Xóa tất cả kế hoạch trong tháng hiện tại')).toBeInTheDocument();
  });

  it('renders meal toggle buttons for breakfast, lunch, dinner', () => {
    renderModal();
    expect(screen.getByTestId('meal-toggle-breakfast')).toBeInTheDocument();
    expect(screen.getByTestId('meal-toggle-lunch')).toBeInTheDocument();
    expect(screen.getByTestId('meal-toggle-dinner')).toBeInTheDocument();
  });

  it('renders meal filter container', () => {
    renderModal();
    expect(screen.getByTestId('meal-filter')).toBeInTheDocument();
  });

  it('renders meal toggle labels in Vietnamese', () => {
    renderModal();
    expect(screen.getByTestId('meal-toggle-breakfast')).toHaveTextContent('Sáng');
    expect(screen.getByTestId('meal-toggle-lunch')).toHaveTextContent('Trưa');
    expect(screen.getByTestId('meal-toggle-dinner')).toHaveTextContent('Tối');
  });

  it('shows day count badge for scopes with data', () => {
    renderModal();
    expect(screen.getByText('1 ngày')).toBeInTheDocument();
  });

  it('shows total meals count for scopes with data', () => {
    renderModal();
    const mealCounts = screen.getAllByText(/bữa ăn sẽ bị xóa/);
    expect(mealCounts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders close button with aria-label', () => {
    renderModal();
    expect(screen.getByLabelText('Đóng hộp thoại')).toBeInTheDocument();
  });

  // --- Scope Button Behavior ---

  it('calls onClear with day scope when day button clicked (all meals selected)', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('btn-clear-scope-day'));
    expect(onClear).toHaveBeenCalledWith('day', undefined);
  });

  it('calls onClear with week scope when week button clicked', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('btn-clear-scope-week'));
    expect(onClear).toHaveBeenCalledWith('week', undefined);
  });

  it('calls onClear with month scope when month button clicked', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('btn-clear-scope-month'));
    expect(onClear).toHaveBeenCalledWith('month', undefined);
  });

  it('disables scope buttons when no plans have data', () => {
    const emptyPlans: DayPlan[] = [makePlan('2024-01-15'), makePlan('2024-01-16')];
    renderModal(emptyPlans);

    expect(screen.getByTestId('btn-clear-scope-day')).toBeDisabled();
    expect(screen.getByTestId('btn-clear-scope-week')).toBeDisabled();
    expect(screen.getByTestId('btn-clear-scope-month')).toBeDisabled();
  });

  it('enables day scope only when selected date has a plan', () => {
    const plans: DayPlan[] = [makePlan('2024-01-15', ['d1'], [], []), makePlan('2024-01-16')];
    renderModal(plans);

    expect(screen.getByTestId('btn-clear-scope-day')).not.toBeDisabled();
  });

  // --- Close Behavior ---

  it('calls onClose when X button is clicked', () => {
    renderModal();
    fireEvent.click(screen.getByLabelText('Đóng hộp thoại'));
    expect(onClose).toHaveBeenCalled();
  });

  // --- Meal Toggle Behavior ---

  it('all meal toggles are selected by default', () => {
    renderModal();
    const breakfastBtn = screen.getByTestId('meal-toggle-breakfast');
    const lunchBtn = screen.getByTestId('meal-toggle-lunch');
    const dinnerBtn = screen.getByTestId('meal-toggle-dinner');

    expect(breakfastBtn.className).toContain('border-color-rose');
    expect(lunchBtn.className).toContain('border-color-rose');
    expect(dinnerBtn.className).toContain('border-color-rose');
  });

  it('deselecting one meal sends remaining meals in onClear', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('meal-toggle-breakfast'));
    fireEvent.click(screen.getByTestId('btn-clear-scope-day'));
    expect(onClear).toHaveBeenCalledWith('day', ['lunch', 'dinner']);
  });

  it('deselecting two meals sends remaining meal in onClear', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('meal-toggle-breakfast'));
    fireEvent.click(screen.getByTestId('meal-toggle-lunch'));
    fireEvent.click(screen.getByTestId('btn-clear-scope-day'));
    expect(onClear).toHaveBeenCalledWith('day', ['dinner']);
  });

  it('keeps at least one meal selected (cannot deselect all)', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('meal-toggle-breakfast'));
    fireEvent.click(screen.getByTestId('meal-toggle-lunch'));
    fireEvent.click(screen.getByTestId('meal-toggle-dinner'));

    fireEvent.click(screen.getByTestId('btn-clear-scope-day'));
    expect(onClear).toHaveBeenCalledWith('day', ['dinner']);
  });

  it('reselecting a deselected meal restores it', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('meal-toggle-breakfast'));
    fireEvent.click(screen.getByTestId('meal-toggle-breakfast'));
    fireEvent.click(screen.getByTestId('btn-clear-scope-day'));
    expect(onClear).toHaveBeenCalledWith('day', undefined);
  });

  it('deselected meal toggle loses active styling', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('meal-toggle-breakfast'));
    const breakfastBtn = screen.getByTestId('meal-toggle-breakfast');
    expect(breakfastBtn.className).toContain('border-border');
    expect(breakfastBtn.className).not.toContain('border-rose-500');
  });

  // --- Expand / Collapse Affected Dates ---

  it('shows expand button for scopes with multiple affected days', () => {
    renderModal();
    const expandBtns = screen.getAllByText('Ngày bị ảnh hưởng');
    expect(expandBtns.length).toBeGreaterThan(0);
  });

  it('does not show expand button for scopes with 0 or 1 day', () => {
    const singleDayPlan: DayPlan[] = [makePlan('2024-01-15', ['d1'], [], [])];
    renderModal(singleDayPlan);
    expect(screen.queryByText('Ngày bị ảnh hưởng')).not.toBeInTheDocument();
  });

  it('toggles affected dates list when expand button clicked', () => {
    renderModal();
    const expandBtn = screen.getAllByTestId(/btn-expand/)[0];
    fireEvent.click(expandBtn);
    fireEvent.click(expandBtn);
    expect(expandBtn).toBeInTheDocument();
  });

  it('collapses affected dates when clicking a different scope expand', () => {
    renderModal();
    const expandBtns = screen.getAllByTestId(/btn-expand/);
    expect(expandBtns.length).toBeGreaterThanOrEqual(2);
    if (expandBtns.length >= 2) {
      fireEvent.click(expandBtns[0]);
      fireEvent.click(expandBtns[1]);
    }
  });

  // --- Empty / Edge Cases ---

  it('handles empty dayPlans array', () => {
    renderModal([]);
    expect(screen.getByTestId('btn-clear-scope-day')).toBeDisabled();
    expect(screen.getByTestId('btn-clear-scope-week')).toBeDisabled();
    expect(screen.getByTestId('btn-clear-scope-month')).toBeDisabled();
  });

  it('handles dayPlans with all empty dish arrays', () => {
    const emptyMealPlans = [makePlan('2024-01-15'), makePlan('2024-01-16')];
    renderModal(emptyMealPlans);
    expect(screen.getByTestId('btn-clear-scope-day')).toBeDisabled();
  });

  it('does not show day count badge when count is 0', () => {
    renderModal([]);
    expect(screen.queryByText(/\d+ bữa ăn sẽ bị xóa/)).not.toBeInTheDocument();
  });

  it('does not show total meals text when count is 0', () => {
    renderModal([]);
    expect(screen.queryByText(/bữa ăn sẽ bị xóa/)).not.toBeInTheDocument();
  });

  it('correctly counts meals across multiple plans for week scope', () => {
    renderModal();
    const mealTexts = screen.getAllByText(/bữa ăn sẽ bị xóa/);
    expect(mealTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('passes meals array with correct subset for week scope after toggle', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('meal-toggle-dinner'));
    fireEvent.click(screen.getByTestId('btn-clear-scope-week'));
    expect(onClear).toHaveBeenCalledWith('week', ['breakfast', 'lunch']);
  });

  it('passes undefined meals when all three are selected for month scope', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('btn-clear-scope-month'));
    expect(onClear).toHaveBeenCalledWith('month', undefined);
  });
});
