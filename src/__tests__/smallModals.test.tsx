import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TypeSelectionModal } from '../components/modals/TypeSelectionModal';
import { ClearPlanModal } from '../components/modals/ClearPlanModal';
import { GoalSettingsModal } from '../components/modals/GoalSettingsModal';
import type { DayPlan, UserProfile } from '../types';

vi.mock('../hooks/useModalBackHandler', () => ({
  useModalBackHandler: vi.fn(),
}));

// --- TypeSelectionModal ---
describe('TypeSelectionModal', () => {
  const defaultPlan: DayPlan = {
    date: '2024-01-15',
    breakfastDishIds: ['d1'],
    lunchDishIds: [],
    dinnerDishIds: ['d2', 'd3'],
  };
  const onSelectType = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('renders title and 3 meal options', () => {
    render(<TypeSelectionModal currentPlan={defaultPlan} onSelectType={onSelectType} onClose={onClose} />);
    expect(screen.getByText('Lên kế hoạch')).toBeInTheDocument();
    expect(screen.getByText('Bữa Sáng')).toBeInTheDocument();
    expect(screen.getByText('Bữa Trưa')).toBeInTheDocument();
    expect(screen.getByText('Bữa Tối')).toBeInTheDocument();
  });

  it('shows dish count badge for planned meals', () => {
    render(<TypeSelectionModal currentPlan={defaultPlan} onSelectType={onSelectType} onClose={onClose} />);
    expect(screen.getByText('1 món')).toBeInTheDocument(); // breakfast
    expect(screen.getByText('2 món')).toBeInTheDocument(); // dinner
  });

  it('calls onSelectType when a meal is clicked', () => {
    render(<TypeSelectionModal currentPlan={defaultPlan} onSelectType={onSelectType} onClose={onClose} />);
    fireEvent.click(screen.getByText('Bữa Trưa'));
    expect(onSelectType).toHaveBeenCalledWith('lunch');
  });

  it('calls onClose when X button is clicked', () => {
    render(<TypeSelectionModal currentPlan={defaultPlan} onSelectType={onSelectType} onClose={onClose} />);
    const xButton = screen.getByLabelText('Đóng');
    fireEvent.click(xButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    render(<TypeSelectionModal currentPlan={defaultPlan} onSelectType={onSelectType} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Đóng'));
    expect(onClose).toHaveBeenCalled();
  });
});

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
    expect(onClear).toHaveBeenCalledWith('day');
  });

  it('disables button when count is 0', () => {
    const emptyPlans: DayPlan[] = [
      { date: '2024-01-15', breakfastDishIds: [], lunchDishIds: [], dinnerDishIds: [] },
    ];
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
});

// --- GoalSettingsModal ---
describe('GoalSettingsModal', () => {
  const defaultProfile: UserProfile = { weight: 70, proteinRatio: 1.6, targetCalories: 2000 };
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
    // 70 * 1.6 = 112
    expect(screen.getByText('112g / ngày')).toBeInTheDocument();
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
    fireEvent.click(screen.getByText('2.2g'));
    expect(onUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({ proteinRatio: 2.2 }));
  });

  it('calls onUpdateProfile when calories changes', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/Mục tiêu Calo/), { target: { value: '2500' } });
    expect(onUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({ targetCalories: 2500 }));
  });

  it('enforces minimum weight of 1', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Cân nặng hiện tại (kg)'), { target: { value: '0' } });
    expect(onUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({ weight: 1 }));
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

  it('enforces minimum protein ratio of 0.1', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Lượng Protein mong muốn'), { target: { value: '0' } });
    expect(onUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({ proteinRatio: 0.1 }));
  });

  it('enforces minimum calories of 100', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/Mục tiêu Calo/), { target: { value: '50' } });
    expect(onUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({ targetCalories: 100 }));
  });

  it('handles NaN weight input by defaulting to minimum', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Cân nặng hiện tại (kg)'), { target: { value: 'abc' } });
    expect(onUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({ weight: 1 }));
  });

  it('handles NaN protein ratio input by defaulting to minimum', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Lượng Protein mong muốn'), { target: { value: 'xyz' } });
    expect(onUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({ proteinRatio: 0.1 }));
  });

  it('handles NaN calories input by defaulting to minimum', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/Mục tiêu Calo/), { target: { value: '' } });
    expect(onUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({ targetCalories: 100 }));
  });

  it('renders all 4 protein preset buttons', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    expect(screen.getByText('1.2g')).toBeInTheDocument();
    expect(screen.getByText('1.6g')).toBeInTheDocument();
    expect(screen.getByText('2g')).toBeInTheDocument();
    expect(screen.getByText('2.2g')).toBeInTheDocument();
  });

  it('calls onUpdateProfile with correct ratio for each preset', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.click(screen.getByText('1.2g'));
    expect(onUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({ proteinRatio: 1.2 }));
    onUpdateProfile.mockClear();
    fireEvent.click(screen.getByText('2g'));
    expect(onUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({ proteinRatio: 2 }));
  });

  it('highlights the active protein preset button', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    // defaultProfile.proteinRatio = 1.6
    const activeBtn = screen.getByText('1.6g').closest('button');
    expect(activeBtn?.className).toContain('bg-blue-500');
    const inactiveBtn = screen.getByText('1.2g').closest('button');
    expect(inactiveBtn?.className).not.toContain('bg-blue-500');
  });

  it('updates computed protein display when weight changes', () => {
    const { rerender } = render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    expect(screen.getByText('112g / ngày')).toBeInTheDocument(); // 70 * 1.6 = 112
    // Simulate weight change via rerender (parent updates profile)
    rerender(<GoalSettingsModal userProfile={{ ...defaultProfile, weight: 80 }} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    expect(screen.getByText('128g / ngày')).toBeInTheDocument(); // 80 * 1.6 = 128
  });

  it('updates computed protein display when ratio changes', () => {
    const { rerender } = render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    expect(screen.getByText('112g / ngày')).toBeInTheDocument(); // 70 * 1.6 = 112
    rerender(<GoalSettingsModal userProfile={{ ...defaultProfile, proteinRatio: 2.2 }} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    expect(screen.getByText('154g / ngày')).toBeInTheDocument(); // 70 * 2.2 = 154
  });

  it('shows auto-save hint text', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    expect(screen.getByText(/tự động lưu/i)).toBeInTheDocument();
  });

  it('preserves other profile fields when only weight changes', () => {
    render(<GoalSettingsModal userProfile={defaultProfile} onUpdateProfile={onUpdateProfile} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Cân nặng hiện tại (kg)'), { target: { value: '90' } });
    expect(onUpdateProfile).toHaveBeenCalledWith({ weight: 90, proteinRatio: 1.6, targetCalories: 2000 });
  });
});
