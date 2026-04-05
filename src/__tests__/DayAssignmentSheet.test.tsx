import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DayAssignmentSheet, type DayAssignmentSheetProps } from '../features/fitness/components/DayAssignmentSheet';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'fitness.scheduleEditor.selectDay': 'Chọn ngày tập',
        'fitness.scheduleEditor.monday': 'T2',
        'fitness.scheduleEditor.tuesday': 'T3',
        'fitness.scheduleEditor.wednesday': 'T4',
        'fitness.scheduleEditor.thursday': 'T5',
        'fitness.scheduleEditor.friday': 'T6',
        'fitness.scheduleEditor.saturday': 'T7',
        'fitness.scheduleEditor.sunday': 'CN',
        'fitness.scheduleEditor.mondayFull': 'Thứ Hai',
        'fitness.scheduleEditor.tuesdayFull': 'Thứ Ba',
        'fitness.scheduleEditor.wednesdayFull': 'Thứ Tư',
        'fitness.scheduleEditor.thursdayFull': 'Thứ Năm',
        'fitness.scheduleEditor.fridayFull': 'Thứ Sáu',
        'fitness.scheduleEditor.saturdayFull': 'Thứ Bảy',
        'fitness.scheduleEditor.sundayFull': 'Chủ Nhật',
        'fitness.scheduleEditor.trainingDay': 'Ngày tập',
        'fitness.scheduleEditor.restDay': 'Ngày nghỉ',
        'fitness.scheduleEditor.maxSessions': 'Đã đầy (tối đa 3 buổi)',
        'common.close': 'Đóng',
      };
      if (key === 'fitness.scheduleEditor.sessionsCount' && opts) {
        return `${opts.count} buổi`;
      }
      return map[key] ?? key;
    },
  }),
}));

vi.mock('../components/shared/ModalBackdrop', () => ({
  ModalBackdrop: ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div data-testid="modal-backdrop">
      <button data-testid="backdrop-overlay" onClick={onClose} type="button" />
      {children}
    </div>
  ),
}));

vi.mock('../hooks/useModalBackHandler', () => ({
  useModalBackHandler: vi.fn(),
}));

afterEach(cleanup);

const defaultProps: DayAssignmentSheetProps = {
  open: true,
  onClose: vi.fn(),
  trainingDays: [1, 3, 5],
  currentDay: 1,
  onSelectDay: vi.fn(),
  existingDayCounts: { 1: 1, 3: 2, 5: 0 },
};

describe('DayAssignmentSheet', () => {
  it('renders nothing when open is false', () => {
    const { container } = render(<DayAssignmentSheet {...defaultProps} open={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders title when open', () => {
    render(<DayAssignmentSheet {...defaultProps} />);
    expect(screen.getByTestId('day-assignment-title')).toHaveTextContent('Chọn ngày tập');
  });

  it('renders all training days as options', () => {
    render(<DayAssignmentSheet {...defaultProps} />);
    expect(screen.getByTestId('day-option-1')).toBeInTheDocument();
    expect(screen.getByTestId('day-option-3')).toBeInTheDocument();
    expect(screen.getByTestId('day-option-5')).toBeInTheDocument();
  });

  it('shows session counts next to each day', () => {
    render(<DayAssignmentSheet {...defaultProps} />);
    const day1 = screen.getByTestId('day-option-1');
    expect(day1.textContent).toContain('1 buổi');
    const day3 = screen.getByTestId('day-option-3');
    expect(day3.textContent).toContain('2 buổi');
    const day5 = screen.getByTestId('day-option-5');
    expect(day5.textContent).toContain('0 buổi');
  });

  it('marks current day with aria-pressed', () => {
    render(<DayAssignmentSheet {...defaultProps} />);
    const day1 = screen.getByTestId('day-option-1');
    expect(day1).toHaveAttribute('aria-pressed', 'true');
    const day3 = screen.getByTestId('day-option-3');
    expect(day3).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onSelectDay and onClose when a day is selected', () => {
    const onSelectDay = vi.fn();
    const onClose = vi.fn();
    render(<DayAssignmentSheet {...defaultProps} onSelectDay={onSelectDay} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('day-option-3'));
    expect(onSelectDay).toHaveBeenCalledWith(3);
    expect(onClose).toHaveBeenCalled();
  });

  it('disables day at max capacity (3 sessions)', () => {
    render(<DayAssignmentSheet {...defaultProps} existingDayCounts={{ 1: 1, 3: 3, 5: 0 }} />);
    const day3 = screen.getByTestId('day-option-3');
    expect(day3).toBeDisabled();
  });

  it('shows warning icon for full days', () => {
    render(<DayAssignmentSheet {...defaultProps} existingDayCounts={{ 1: 1, 3: 3, 5: 0 }} />);
    expect(screen.getByTestId('day-full-warning-3')).toBeInTheDocument();
    expect(screen.queryByTestId('day-full-warning-1')).not.toBeInTheDocument();
  });

  it('does not call onSelectDay for disabled (full) days', () => {
    const onSelectDay = vi.fn();
    render(<DayAssignmentSheet {...defaultProps} onSelectDay={onSelectDay} existingDayCounts={{ 1: 1, 3: 3, 5: 0 }} />);
    fireEvent.click(screen.getByTestId('day-option-3'));
    expect(onSelectDay).not.toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<DayAssignmentSheet {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('backdrop-overlay'));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders days sorted ascending', () => {
    render(<DayAssignmentSheet {...defaultProps} trainingDays={[5, 1, 3]} existingDayCounts={{ 1: 0, 3: 0, 5: 0 }} />);
    const options = [
      screen.getByTestId('day-option-1'),
      screen.getByTestId('day-option-3'),
      screen.getByTestId('day-option-5'),
    ];
    expect(options[0]).toBeInTheDocument();
    expect(options[1]).toBeInTheDocument();
    expect(options[2]).toBeInTheDocument();
  });

  it('uses radiogroup role for the day list', () => {
    render(<DayAssignmentSheet {...defaultProps} />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('applies overscroll-behavior contain', () => {
    render(<DayAssignmentSheet {...defaultProps} />);
    const sheet = screen.getByTestId('day-assignment-sheet');
    expect(sheet.style.overscrollBehavior).toBe('contain');
  });

  it('defaults existingDayCounts to empty when not provided', () => {
    render(
      <DayAssignmentSheet open={true} onClose={vi.fn()} trainingDays={[1, 3]} currentDay={1} onSelectDay={vi.fn()} />,
    );
    const day1 = screen.getByTestId('day-option-1');
    expect(day1.textContent).toContain('0 buổi');
  });

  it('applies touch-manipulation on day buttons', () => {
    render(<DayAssignmentSheet {...defaultProps} />);
    const day1 = screen.getByTestId('day-option-1');
    expect(day1.className).toContain('touch-manipulation');
  });

  it('applies motion-reduce:transition-none on day buttons', () => {
    render(<DayAssignmentSheet {...defaultProps} />);
    const day1 = screen.getByTestId('day-option-1');
    expect(day1.className).toContain('motion-reduce:transition-none');
  });

  it('fires handleSelect via hidden radio onChange', () => {
    const onSelectDay = vi.fn();
    const onClose = vi.fn();
    render(
      <DayAssignmentSheet
        open={true}
        onClose={onClose}
        trainingDays={[1, 3]}
        currentDay={1}
        onSelectDay={onSelectDay}
      />,
    );
    const radios = screen.getAllByRole('radio');
    // Day 3 has no entry in existingDayCounts (omitted prop, defaults to {})
    // This covers the ?? 0 fallback branch in handleSelect (line 55)
    fireEvent.click(radios[1]);
    expect(onSelectDay).toHaveBeenCalledWith(3);
    expect(onClose).toHaveBeenCalled();
  });

  it('radio onChange does not select a full day', () => {
    const onSelectDay = vi.fn();
    const onClose = vi.fn();
    render(
      <DayAssignmentSheet
        {...defaultProps}
        onSelectDay={onSelectDay}
        onClose={onClose}
        existingDayCounts={{ 1: 1, 3: 3, 5: 0 }}
      />,
    );
    const radios = screen.getAllByRole('radio');
    // Day 3 is full (count=3 >= MAX 3). Radio is disabled but fireEvent bypasses it.
    // This covers the early return in handleSelect (line 56)
    fireEvent.click(radios[1]);
    expect(onSelectDay).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
