import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CopyPlanModal } from '../components/modals/CopyPlanModal';
import { useCopyPlan } from '../hooks/useCopyPlan';
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
    const plans = [makePlan('2025-01-01', ['new1']), makePlan('2025-01-02', ['old1'])];
    const setPlans = vi.fn();
    const { result } = renderHook(() => useCopyPlan(plans, setPlans));

    act(() => result.current.copyPlan('2025-01-01', ['2025-01-02']));

    const updater = setPlans.mock.calls[0][0];
    const updated = updater(plans);
    expect(updated).toHaveLength(2);
    expect(updated[1].breakfastDishIds).toEqual(['new1']);
  });

  it('merges dishes into existing plan when mergeMode is true', () => {
    const plans = [
      makePlan('2025-01-01', ['new1']),
      { date: '2025-01-02', breakfastDishIds: ['old1'], lunchDishIds: ['d2'], dinnerDishIds: ['d4'] },
    ];
    const setPlans = vi.fn();
    const { result } = renderHook(() => useCopyPlan(plans, setPlans));

    act(() => result.current.copyPlan('2025-01-01', ['2025-01-02'], true));

    const updater = setPlans.mock.calls[0][0];
    const updated = updater(plans);
    expect(updated).toHaveLength(2);
    expect(updated[1].breakfastDishIds).toEqual(['old1', 'new1']);
    expect(updated[1].lunchDishIds).toEqual(['d2']);
    expect(updated[1].dinnerDishIds).toEqual(['d4', 'd3']);
  });

  it('merge mode does not add duplicate dish ids', () => {
    const plans = [makePlan('2025-01-01', ['d1']), makePlan('2025-01-02', ['d1'])];
    const setPlans = vi.fn();
    const { result } = renderHook(() => useCopyPlan(plans, setPlans));

    act(() => result.current.copyPlan('2025-01-01', ['2025-01-02'], true));

    const updater = setPlans.mock.calls[0][0];
    const updated = updater(plans);
    expect(updated[1].breakfastDishIds).toEqual(['d1']);
  });

  it('merge mode creates new plan when target does not exist', () => {
    const plans = [makePlan('2025-01-01', ['d1'])];
    const setPlans = vi.fn();
    const { result } = renderHook(() => useCopyPlan(plans, setPlans));

    act(() => result.current.copyPlan('2025-01-01', ['2025-01-05'], true));

    const updater = setPlans.mock.calls[0][0];
    const updated = updater(plans);
    expect(updated).toHaveLength(2);
    expect(updated[1].date).toBe('2025-01-05');
    expect(updated[1].breakfastDishIds).toEqual(['d1']);
  });
});

describe('CopyPlanModal', () => {
  const defaultProps = {
    sourceDate: '2025-01-15',
    sourcePlan: makePlan('2025-01-15'),
    dishes: [
      { id: 'd1', name: { vi: 'Món 1', en: 'Dish 1' }, ingredients: [], tags: [] },
      { id: 'd2', name: { vi: 'Món 2', en: 'Dish 2' }, ingredients: [], tags: [] },
      { id: 'd3', name: { vi: 'Món 3', en: 'Dish 3' }, ingredients: [], tags: [] },
    ] as import('../types').Dish[],
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

  it('calls onCopy with selected dates and default overwrite mode', () => {
    render(<CopyPlanModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-copy-tomorrow'));
    fireEvent.click(screen.getByTestId('btn-copy-confirm'));

    expect(defaultProps.onCopy).toHaveBeenCalledWith(['2025-01-16'], false);
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

  it('renders merge mode toggle', () => {
    render(<CopyPlanModal {...defaultProps} />);
    expect(screen.getByTestId('copy-mode-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('btn-mode-overwrite')).toBeInTheDocument();
    expect(screen.getByTestId('btn-mode-merge')).toBeInTheDocument();
  });

  it('calls onCopy with mergeMode true when merge is selected', () => {
    render(<CopyPlanModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-mode-merge'));
    fireEvent.click(screen.getByTestId('btn-copy-tomorrow'));
    fireEvent.click(screen.getByTestId('btn-copy-confirm'));

    expect(defaultProps.onCopy).toHaveBeenCalledWith(['2025-01-16'], true);
  });

  it('switches between overwrite and merge modes', () => {
    render(<CopyPlanModal {...defaultProps} />);
    const mergeBtn = screen.getByTestId('btn-mode-merge');
    const overwriteBtn = screen.getByTestId('btn-mode-overwrite');

    fireEvent.click(mergeBtn);
    expect(mergeBtn.className).toContain('text-primary-emphasis');

    fireEvent.click(overwriteBtn);
    expect(overwriteBtn.className).toContain('text-primary-emphasis');
  });
});
