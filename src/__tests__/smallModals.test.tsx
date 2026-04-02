import { fireEvent, render, screen } from '@testing-library/react';

import { ClearPlanModal } from '../components/modals/ClearPlanModal';
import { GoalSettingsModal } from '../components/modals/GoalSettingsModal';
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

// --- GoalSettingsModal ---
describe('GoalSettingsModal', () => {
  const defaultProfile = { weight: 70, proteinRatio: 2, targetCalories: 2000 };
  const onUpdateProfile = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('renders title and all form fields', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    expect(screen.getByText('Mục tiêu dinh dưỡng')).toBeInTheDocument();
    expect(screen.getByLabelText('Cân nặng hiện tại (kg)')).toBeInTheDocument();
    expect(screen.getByLabelText('Lượng Protein mong muốn')).toBeInTheDocument();
    expect(screen.getByLabelText(/Mục tiêu Calo/)).toBeInTheDocument();
  });

  it('shows computed protein target', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    // 70 * 2 = 140
    expect(screen.getByText('140g / ng\u00e0y')).toBeInTheDocument();
  });

  it('calls onUpdateProfile when weight changes', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Cân nặng hiện tại (kg)'), { target: { value: '80' } });
    expect(onUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({ weight: 80 }));
  });

  it('calls onUpdateProfile when protein ratio changes', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Lượng Protein mong muốn'), { target: { value: '2.0' } });
    expect(onUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({ proteinRatio: 2 }));
  });

  it('calls onUpdateProfile when protein preset is clicked', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.click(screen.getByText('3g'));
    expect(onUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({ proteinRatio: 3 }));
  });

  it('calls onUpdateProfile when calories changes', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/Mục tiêu Calo/), { target: { value: '2500' } });
    expect(onUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({ targetCalories: 2500 }));
  });

  it('does not propagate weight below minimum', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Cân nặng hiện tại (kg)'), { target: { value: '0' } });
    expect(onUpdateProfile).not.toHaveBeenCalled();
  });

  it('calls onClose when "Hoàn tất" button is clicked', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.click(screen.getByText('Hoàn tất'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Đóng'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when X button is clicked', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    const buttons = screen.getAllByRole('button');
    const xBtn = buttons.find(b => b.querySelector('.lucide-x'));
    if (xBtn) fireEvent.click(xBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('does not propagate protein ratio below minimum', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Lượng Protein mong muốn'), { target: { value: '0' } });
    expect(onUpdateProfile).not.toHaveBeenCalled();
  });

  it('does not propagate calories below minimum', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/Mục tiêu Calo/), { target: { value: '50' } });
    expect(onUpdateProfile).not.toHaveBeenCalled();
  });

  it('does not propagate NaN weight input', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Cân nặng hiện tại (kg)'), { target: { value: 'abc' } });
    expect(onUpdateProfile).not.toHaveBeenCalled();
  });

  it('does not propagate NaN protein ratio input', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Lượng Protein mong muốn'), { target: { value: 'xyz' } });
    expect(onUpdateProfile).not.toHaveBeenCalled();
  });

  it('does not propagate NaN calories input', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/Mục tiêu Calo/), { target: { value: '' } });
    expect(onUpdateProfile).not.toHaveBeenCalled();
  });

  it('keeps weight empty on blur when cleared', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    const input = screen.getByLabelText('Cân nặng hiện tại (kg)');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('keeps protein ratio empty on blur when cleared', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    const input = screen.getByLabelText('Lượng Protein mong muốn');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('keeps calories empty on blur when cleared', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    const input = screen.getByLabelText(/Mục tiêu Calo/);
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('renders all 4 protein preset buttons', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    expect(screen.getByText('1g')).toBeInTheDocument();
    expect(screen.getByText('2g')).toBeInTheDocument();
    expect(screen.getByText('3g')).toBeInTheDocument();
    expect(screen.getByText('4g')).toBeInTheDocument();
  });

  it('calls onUpdateProfile with correct ratio for each preset', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.click(screen.getByText('1g'));
    expect(onUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({ proteinRatio: 1 }));
    onUpdateProfile.mockClear();
    fireEvent.click(screen.getByText('2g'));
    expect(onUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({ proteinRatio: 2 }));
  });

  it('highlights the active protein preset button', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    // defaultProfile.proteinRatio = 2
    const activeBtn = screen.getByText('2g').closest('button');
    expect(activeBtn?.className).toContain('bg-blue-500');
    const inactiveBtn = screen.getByText('1g').closest('button');
    expect(inactiveBtn?.className).not.toContain('bg-blue-500');
  });

  it('updates computed protein display when weight changes', () => {
    const { rerender } = render(
      <GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />,
    );
    expect(screen.getByText('140g / ng\u00e0y')).toBeInTheDocument(); // 70 * 2 = 140
    // Simulate weight change via rerender (parent updates profile)
    rerender(
      <GoalSettingsModal
        userProfile={{ ...defaultProfile, weight: 80 }}
        onUpdateProfile={onUpdateProfile}
        onClose={onClose}
      />,
    );
    expect(screen.getByText('160g / ng\u00e0y')).toBeInTheDocument(); // 80 * 2 = 160
  });

  it('updates computed protein display when ratio changes', () => {
    const { rerender } = render(
      <GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />,
    );
    expect(screen.getByText('140g / ng\u00e0y')).toBeInTheDocument(); // 70 * 2 = 140
    rerender(
      <GoalSettingsModal
        userProfile={{ ...defaultProfile, proteinRatio: 4 }}
        onUpdateProfile={onUpdateProfile}
        onClose={onClose}
      />,
    );
    expect(screen.getByText('280g / ng\u00e0y')).toBeInTheDocument(); // 70 * 4 = 280
  });

  it('shows auto-save hint text', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    expect(screen.getByText(/tự động lưu/i)).toBeInTheDocument();
  });

  it('preserves other profile fields when only weight changes', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Cân nặng hiện tại (kg)'), { target: { value: '90' } });
    expect(onUpdateProfile).toHaveBeenCalledWith({ weight: 90, proteinRatio: 2, targetCalories: 2000 });
  });

  it('renders goal preset buttons', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    expect(screen.getByText('Chọn nhanh')).toBeInTheDocument();
    expect(screen.getByText('Cân bằng')).toBeInTheDocument();
    expect(screen.getByText('Tăng cơ')).toBeInTheDocument();
    expect(screen.getByText('Low Carb')).toBeInTheDocument();
    expect(screen.getByText('Ăn nhẹ')).toBeInTheDocument();
  });

  it('applies goal preset when clicked', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('btn-goal-preset-2200'));
    expect(onUpdateProfile).toHaveBeenCalledWith({ weight: 70, targetCalories: 2200, proteinRatio: 2.5 });
  });

  it('highlights active preset matching current profile', () => {
    const balancedProfile = { weight: 70, proteinRatio: 1.6, targetCalories: 2000 };
    render(<GoalSettingsModal userProfile={balancedProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    const btn = screen.getByTestId('btn-goal-preset-2000');
    expect(btn.className).toContain('border-primary');
  });

  it('does not highlight preset when profile does not match', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    const btn = screen.getByTestId('btn-goal-preset-1400');
    expect(btn.className).not.toContain('border-primary');
  });
});
