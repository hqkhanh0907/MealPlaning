import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WorkoutSummaryCard } from '../features/fitness/components/WorkoutSummaryCard';

afterEach(cleanup);

describe('WorkoutSummaryCard', () => {
  const defaultProps = {
    durationSeconds: 3600,
    totalVolume: 5000,
    setsCompleted: 20,
    personalRecords: [] as { exerciseName: string; weight: number }[],
    onSave: vi.fn(),
  };

  it('renders workout stats', () => {
    render(<WorkoutSummaryCard {...defaultProps} />);
    expect(screen.getByTestId('workout-summary-card')).toBeInTheDocument();
    expect(screen.getByText('Tổng kết buổi tập')).toBeInTheDocument();
    expect(screen.getByText(/5,000 kg/)).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('1:00:00')).toBeInTheDocument();
  });

  it('shows PR celebration with gold gradient when PRs detected', () => {
    render(<WorkoutSummaryCard {...defaultProps} personalRecords={[{ exerciseName: 'Squat', weight: 140 }]} />);
    const celebration = screen.getByTestId('pr-celebration');
    expect(celebration).toBeInTheDocument();
    expect(celebration.className).toContain('from-amber-400');
    expect(celebration.className).toContain('to-yellow-500');
    expect(screen.getByText(/Squat: 140kg/)).toBeInTheDocument();
  });

  it('hides PR celebration when no PRs', () => {
    render(<WorkoutSummaryCard {...defaultProps} />);
    expect(screen.queryByTestId('pr-celebration')).not.toBeInTheDocument();
  });

  it('renders save button and calls onSave on click', () => {
    const onSave = vi.fn();
    render(<WorkoutSummaryCard {...defaultProps} onSave={onSave} />);
    const saveBtn = screen.getByTestId('save-workout-button');
    expect(saveBtn).toBeInTheDocument();
    fireEvent.click(saveBtn);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('renders multiple personal records', () => {
    render(
      <WorkoutSummaryCard
        {...defaultProps}
        personalRecords={[
          { exerciseName: 'Squat', weight: 140 },
          { exerciseName: 'Bench Press', weight: 100 },
        ]}
      />,
    );
    expect(screen.getByText(/Squat: 140kg/)).toBeInTheDocument();
    expect(screen.getByText(/Bench Press: 100kg/)).toBeInTheDocument();
  });
});
