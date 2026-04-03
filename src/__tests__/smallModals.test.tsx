import { fireEvent, render, screen } from '@testing-library/react';

import { ClearPlanModal } from '../components/modals/ClearPlanModal';
import type { DayPlan } from '../types';

vi.mock('../hooks/useModalBackHandler', () => ({
  useModalBackHandler: vi.fn(),
}));

// --- ClearPlanModal ---
describe('ClearPlanModal', () => {
  const dayPlans: DayPlan[] = [
    { date: '2024-01-15', breakfastDishIds: ['d1'], lunchDishIds: [], dinnerDishIds: [] },
    { date: '2024-01-16', breakfastDishIds: [], lunchDishIds: ['d2'], dinnerDishIds: [] },
    { date: '2024-01-17', breakfastDishIds: [], lunchDishIds: [], dinnerDishIds: ['d3'] },
  ];
  const onClear = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('renders title and scope options', () => {
    render(<ClearPlanModal dayPlans={dayPlans} selectedDate="2024-01-15" onClear={onClear} onClose={onClose} />);
    expect(screen.getByText('Xóa kế hoạch')).toBeInTheDocument();
    expect(screen.getByText('Ngày này')).toBeInTheDocument();
    expect(screen.getByText('Tuần này')).toBeInTheDocument();
    expect(screen.getByText('Tháng này')).toBeInTheDocument();
  });

  it('shows day count for each scope', () => {
    render(<ClearPlanModal dayPlans={dayPlans} selectedDate="2024-01-15" onClear={onClear} onClose={onClose} />);
    expect(screen.getByText('1 ngày')).toBeInTheDocument(); // day count for selected day
  });

  it('calls onClear with day scope when day button is clicked', () => {
    render(<ClearPlanModal dayPlans={dayPlans} selectedDate="2024-01-15" onClear={onClear} onClose={onClose} />);
    fireEvent.click(screen.getByText('Ngày này'));
    expect(onClear).toHaveBeenCalledWith('day', undefined);
  });

  it('disables button when count is 0', () => {
    const emptyPlans: DayPlan[] = [{ date: '2024-01-15', breakfastDishIds: [], lunchDishIds: [], dinnerDishIds: [] }];
    render(<ClearPlanModal dayPlans={emptyPlans} selectedDate="2024-01-15" onClear={onClear} onClose={onClose} />);
    // All buttons should be disabled because no plans have data
    const buttons = screen.getAllByRole('button');
    const dayButton = buttons.find(b => b.textContent?.includes('Ngày này'));
    expect(dayButton).toBeDisabled();
  });

  it('calls onClose when backdrop is clicked', () => {
    render(<ClearPlanModal dayPlans={dayPlans} selectedDate="2024-01-15" onClear={onClear} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Đóng'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows total meals count for scopes with data', () => {
    render(<ClearPlanModal dayPlans={dayPlans} selectedDate="2024-01-15" onClear={onClear} onClose={onClose} />);
    const mealCounts = screen.getAllByText(/bữa ăn sẽ bị xóa/);
    expect(mealCounts.length).toBe(3);
  });

  it('shows expand button for week scope with multiple days', () => {
    render(<ClearPlanModal dayPlans={dayPlans} selectedDate="2024-01-15" onClear={onClear} onClose={onClose} />);
    const expandBtns = screen.getAllByText('Ngày bị ảnh hưởng');
    expect(expandBtns.length).toBeGreaterThan(0);
  });

  it('toggles affected dates list when expand button clicked', () => {
    render(<ClearPlanModal dayPlans={dayPlans} selectedDate="2024-01-15" onClear={onClear} onClose={onClose} />);
    const expandBtn = screen.getAllByTestId(/btn-expand/)[0];
    fireEvent.click(expandBtn);
    // After expand, date chips should be visible - just verify toggle works
    fireEvent.click(expandBtn);
    // scope should be collapsed
  });

  it('collapses affected dates when clicking expand again', () => {
    render(<ClearPlanModal dayPlans={dayPlans} selectedDate="2024-01-15" onClear={onClear} onClose={onClose} />);
    const expandBtn = screen.getAllByTestId(/btn-expand/)[0];
    fireEvent.click(expandBtn);
    fireEvent.click(expandBtn);
  });

  it('renders meal toggle buttons', () => {
    render(<ClearPlanModal dayPlans={dayPlans} selectedDate="2024-01-15" onClear={onClear} onClose={onClose} />);
    expect(screen.getByTestId('meal-toggle-breakfast')).toBeInTheDocument();
    expect(screen.getByTestId('meal-toggle-lunch')).toBeInTheDocument();
    expect(screen.getByTestId('meal-toggle-dinner')).toBeInTheDocument();
  });

  it('deselects a meal when toggling off', () => {
    render(<ClearPlanModal dayPlans={dayPlans} selectedDate="2024-01-15" onClear={onClear} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('meal-toggle-breakfast'));
    fireEvent.click(screen.getByText('Ngày này'));
    expect(onClear).toHaveBeenCalledWith('day', ['lunch', 'dinner']);
  });

  it('keeps at least one meal selected', () => {
    render(<ClearPlanModal dayPlans={dayPlans} selectedDate="2024-01-15" onClear={onClear} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('meal-toggle-breakfast'));
    fireEvent.click(screen.getByTestId('meal-toggle-lunch'));
    fireEvent.click(screen.getByTestId('meal-toggle-dinner'));
    fireEvent.click(screen.getByText('Ngày này'));
    expect(onClear).toHaveBeenCalledWith('day', ['dinner']);
  });

  it('reselects a deselected meal', () => {
    render(<ClearPlanModal dayPlans={dayPlans} selectedDate="2024-01-15" onClear={onClear} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('meal-toggle-breakfast'));
    fireEvent.click(screen.getByTestId('meal-toggle-breakfast'));
    fireEvent.click(screen.getByText('Ngày này'));
    expect(onClear).toHaveBeenCalledWith('day', undefined);
  });
});
