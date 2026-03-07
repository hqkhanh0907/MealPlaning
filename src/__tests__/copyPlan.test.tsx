import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, render, screen, fireEvent } from '@testing-library/react';
import { useCopyPlan } from '../hooks/useCopyPlan';
import { CopyPlanModal } from '../components/modals/CopyPlanModal';
import { DayPlan } from '../types';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi' },
  }),
}));

// Mock ModalBackdrop to render children directly
vi.mock('../components/shared/ModalBackdrop', () => ({
  ModalBackdrop: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock useModalBackHandler
vi.mock('../hooks/useModalBackHandler', () => ({
  useModalBackHandler: vi.fn(),
}));

const makePlan = (date: string, ids: string[] = ['d1']): DayPlan => ({
  date,
  breakfastDishIds: ids,
  lunchDishIds: ['d2'],
  dinnerDishIds: ['d3'],
});

describe('useCopyPlan', () => {
  it('copies source plan to target dates', () => {
    const plans = [makePlan('2025-01-01')];
    const setPlans = vi.fn();
    const { result } = renderHook(() => useCopyPlan(plans, setPlans));

    act(() => result.current.copyPlan('2025-01-01', ['2025-01-02', '2025-01-03']));

    expect(setPlans).toHaveBeenCalledTimes(1);
    const updater = setPlans.mock.calls[0][0];
    const updated = updater(plans);
    expect(updated).toHaveLength(3);
    expect(updated[1].date).toBe('2025-01-02');
    expect(updated[1].breakfastDishIds).toEqual(['d1']);
    expect(updated[2].date).toBe('2025-01-03');
  });

  it('handles non-existent source date', () => {
    const plans: DayPlan[] = [];
    const setPlans = vi.fn();
    const { result } = renderHook(() => useCopyPlan(plans, setPlans));

    act(() => result.current.copyPlan('2025-01-01', ['2025-01-02']));

    expect(setPlans).not.toHaveBeenCalled();
  });

  it('overwrites existing plan on target date', () => {
    const plans = [
      makePlan('2025-01-01', ['new1']),
      makePlan('2025-01-02', ['old1']),
    ];
    const setPlans = vi.fn();
    const { result } = renderHook(() => useCopyPlan(plans, setPlans));

    act(() => result.current.copyPlan('2025-01-01', ['2025-01-02']));

    const updater = setPlans.mock.calls[0][0];
    const updated = updater(plans);
    expect(updated).toHaveLength(2);
    expect(updated[1].breakfastDishIds).toEqual(['new1']);
  });
});

describe('CopyPlanModal', () => {
  const defaultProps = {
    sourceDate: '2025-01-15',
    onCopy: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with source date info', () => {
    render(<CopyPlanModal {...defaultProps} />);
    expect(screen.getByTestId('copy-plan-modal')).toBeInTheDocument();
    expect(screen.getByText('copyPlan.title')).toBeInTheDocument();
  });

  it('"Ngày mai" button selects next day', () => {
    render(<CopyPlanModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-copy-tomorrow'));

    // Should show 1 selected date (tomorrow = 2025-01-16)
    expect(screen.queryByText('copyPlan.noSelection')).not.toBeInTheDocument();
  });

  it('"Cả tuần" selects next 6 days', () => {
    render(<CopyPlanModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-copy-week'));

    // Should not show "no selection" message
    expect(screen.queryByText('copyPlan.noSelection')).not.toBeInTheDocument();
  });

  it('calls onCopy with selected dates', () => {
    render(<CopyPlanModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-copy-tomorrow'));
    fireEvent.click(screen.getByTestId('btn-copy-confirm'));

    expect(defaultProps.onCopy).toHaveBeenCalledWith(['2025-01-16']);
  });

  it('calls onClose when close button clicked', () => {
    render(<CopyPlanModal {...defaultProps} />);
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn => btn.querySelector('.lucide-x'));
    if (closeButton) fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('confirm button is disabled with no selection', () => {
    render(<CopyPlanModal {...defaultProps} />);
    const confirmBtn = screen.getByTestId('btn-copy-confirm');
    expect(confirmBtn).toBeDisabled();
  });

  it('custom date input adds a date', () => {
    render(<CopyPlanModal {...defaultProps} />);
    // Click custom button
    fireEvent.click(screen.getByText('copyPlan.custom'));
    // Should show date input
    const dateInput = screen.getByDisplayValue('');
    expect(dateInput).toBeInTheDocument();

    // Add a custom date
    fireEvent.change(dateInput, { target: { value: '2025-02-01' } });
    // No selection message should disappear
    expect(screen.queryByText('copyPlan.noSelection')).not.toBeInTheDocument();
  });

  it('removes a selected date', () => {
    render(<CopyPlanModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-copy-tomorrow'));

    // Should have 1 date listed; find and click remove button
    const removeButtons = screen.getAllByRole('button').filter(btn => btn.querySelector('.lucide-trash-2'));
    expect(removeButtons.length).toBeGreaterThan(0);
    fireEvent.click(removeButtons[0]);

    // Should show no selection
    expect(screen.getByText('copyPlan.noSelection')).toBeInTheDocument();
  });

  it('does not add duplicate or source date', () => {
    render(<CopyPlanModal {...defaultProps} />);
    fireEvent.click(screen.getByText('copyPlan.custom'));
    const dateInput = screen.getByDisplayValue('');

    // Try adding source date itself
    fireEvent.change(dateInput, { target: { value: '2025-01-15' } });
    expect(screen.getByText('copyPlan.noSelection')).toBeInTheDocument();
  });
});
