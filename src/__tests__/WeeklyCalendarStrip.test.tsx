import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WeeklyCalendarStrip, type WeeklyCalendarStripProps } from '../features/fitness/components/WeeklyCalendarStrip';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'fitness.scheduleEditor.weeklyCalendar': 'Lịch tuần',
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
      };
      return map[key] ?? key;
    },
  }),
}));

afterEach(cleanup);

const defaultProps: WeeklyCalendarStripProps = {
  trainingDays: [1, 3, 5],
};

describe('WeeklyCalendarStrip', () => {
  it('renders 7 day buttons', () => {
    render(<WeeklyCalendarStrip {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(7);
  });

  it('renders correct Vietnamese day labels', () => {
    render(<WeeklyCalendarStrip {...defaultProps} />);
    expect(screen.getByText('T2')).toBeInTheDocument();
    expect(screen.getByText('T3')).toBeInTheDocument();
    expect(screen.getByText('T4')).toBeInTheDocument();
    expect(screen.getByText('T5')).toBeInTheDocument();
    expect(screen.getByText('T6')).toBeInTheDocument();
    expect(screen.getByText('T7')).toBeInTheDocument();
    expect(screen.getByText('CN')).toBeInTheDocument();
  });

  it('has role="group" with aria-label', () => {
    render(<WeeklyCalendarStrip {...defaultProps} />);
    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('aria-label', 'Lịch tuần');
  });

  it('renders training days with emerald styling', () => {
    render(<WeeklyCalendarStrip {...defaultProps} />);
    const day1 = screen.getByTestId('calendar-day-1');
    expect(day1.className).toContain('bg-primary');
    const day2 = screen.getByTestId('calendar-day-2');
    expect(day2.className).toContain('bg-muted');
  });

  it('renders today highlight with blue ring', () => {
    render(<WeeklyCalendarStrip {...defaultProps} todayDow={3} />);
    const day3 = screen.getByTestId('calendar-day-3');
    expect(day3.className).toContain('ring-status-info');
    const day1 = screen.getByTestId('calendar-day-1');
    expect(day1.className).not.toContain('ring-status-info');
  });

  it('renders selected day with bold border', () => {
    render(<WeeklyCalendarStrip {...defaultProps} selectedDay={5} />);
    const day5 = screen.getByTestId('calendar-day-5');
    expect(day5.className).toContain('border-2');
    const day1 = screen.getByTestId('calendar-day-1');
    expect(day1.className).not.toContain('border-2');
  });

  it('calls onDayToggle when interactive and clicked', () => {
    const onDayToggle = vi.fn();
    render(<WeeklyCalendarStrip {...defaultProps} interactive={true} onDayToggle={onDayToggle} />);
    fireEvent.click(screen.getByTestId('calendar-day-2'));
    expect(onDayToggle).toHaveBeenCalledWith(2);
  });

  it('calls onDaySelect when NOT interactive and clicked', () => {
    const onDaySelect = vi.fn();
    render(<WeeklyCalendarStrip {...defaultProps} interactive={false} onDaySelect={onDaySelect} />);
    fireEvent.click(screen.getByTestId('calendar-day-3'));
    expect(onDaySelect).toHaveBeenCalledWith(3);
  });

  it('does not call onDaySelect in interactive mode', () => {
    const onDaySelect = vi.fn();
    const onDayToggle = vi.fn();
    render(
      <WeeklyCalendarStrip {...defaultProps} interactive={true} onDayToggle={onDayToggle} onDaySelect={onDaySelect} />,
    );
    fireEvent.click(screen.getByTestId('calendar-day-1'));
    expect(onDayToggle).toHaveBeenCalledWith(1);
    expect(onDaySelect).not.toHaveBeenCalled();
  });

  it('does not call onDayToggle in read-only mode', () => {
    const onDayToggle = vi.fn();
    const onDaySelect = vi.fn();
    render(
      <WeeklyCalendarStrip {...defaultProps} interactive={false} onDayToggle={onDayToggle} onDaySelect={onDaySelect} />,
    );
    fireEvent.click(screen.getByTestId('calendar-day-1'));
    expect(onDaySelect).toHaveBeenCalledWith(1);
    expect(onDayToggle).not.toHaveBeenCalled();
  });

  it('sets aria-pressed on buttons in interactive mode', () => {
    render(<WeeklyCalendarStrip {...defaultProps} interactive={true} onDayToggle={vi.fn()} />);
    const day1 = screen.getByTestId('calendar-day-1');
    expect(day1).toHaveAttribute('aria-pressed', 'true');
    const day2 = screen.getByTestId('calendar-day-2');
    expect(day2).toHaveAttribute('aria-pressed', 'false');
  });

  it('does not set aria-pressed in read-only mode', () => {
    render(<WeeklyCalendarStrip {...defaultProps} />);
    const day1 = screen.getByTestId('calendar-day-1');
    expect(day1).not.toHaveAttribute('aria-pressed');
  });

  it('each button has an accessible aria-label with full day name and status', () => {
    render(<WeeklyCalendarStrip {...defaultProps} />);
    const day1 = screen.getByTestId('calendar-day-1');
    expect(day1).toHaveAttribute('aria-label', 'Thứ Hai — Ngày tập');
    const day2 = screen.getByTestId('calendar-day-2');
    expect(day2).toHaveAttribute('aria-label', 'Thứ Ba — Ngày nghỉ');
  });

  it('applies touch-manipulation class to all buttons', () => {
    render(<WeeklyCalendarStrip {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    for (const btn of buttons) {
      expect(btn.className).toContain('touch-manipulation');
    }
  });

  it('applies motion-reduce:transition-none class', () => {
    render(<WeeklyCalendarStrip {...defaultProps} />);
    const day1 = screen.getByTestId('calendar-day-1');
    expect(day1.className).toContain('motion-reduce:transition-none');
  });

  it('renders with empty training days (all rest)', () => {
    render(<WeeklyCalendarStrip trainingDays={[]} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(7);
    for (const btn of buttons) {
      expect(btn.className).toContain('bg-muted');
    }
  });

  it('handles no callbacks gracefully', () => {
    render(<WeeklyCalendarStrip trainingDays={[1, 3, 5]} interactive={true} />);
    expect(() => {
      fireEvent.click(screen.getByTestId('calendar-day-1'));
    }).not.toThrow();
  });

  it('handles no onDaySelect in read-only mode gracefully', () => {
    render(<WeeklyCalendarStrip trainingDays={[1, 3, 5]} interactive={false} />);
    expect(() => {
      fireEvent.click(screen.getByTestId('calendar-day-1'));
    }).not.toThrow();
  });
});
