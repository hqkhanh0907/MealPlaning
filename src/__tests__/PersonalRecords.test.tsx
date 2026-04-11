import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { PersonalRecord } from '@/features/fitness/components/PersonalRecords';
import PersonalRecords from '@/features/fitness/components/PersonalRecords';

const BENCH_PRESS_PR: PersonalRecord = {
  exerciseId: 'bench-press',
  exerciseName: 'Bench Press',
  bestWeight: 100,
  bestReps: 5,
  date: '2026-07-10',
  history: [
    { weight: 95, reps: 5, date: '2026-07-03' },
    { weight: 90, reps: 5, date: '2026-06-26' },
    { weight: 85, reps: 5, date: '2026-06-19' },
  ],
};

const SQUAT_PR: PersonalRecord = {
  exerciseId: 'barbell-squat',
  exerciseName: 'Barbell Squat',
  bestWeight: 140,
  bestReps: 3,
  date: '2026-07-12',
  history: [
    { weight: 135, reps: 3, date: '2026-07-05' },
    { weight: 130, reps: 3, date: '2026-06-28' },
  ],
};

const DEADLIFT_PR: PersonalRecord = {
  exerciseId: 'deadlift',
  exerciseName: 'Deadlift',
  bestWeight: 180,
  bestReps: 1,
  date: '2026-07-14',
};

describe('PersonalRecords', () => {
  // TC_W402_01: Empty state
  it('shows empty state with Dumbbell icon when records=[]', () => {
    render(<PersonalRecords records={[]} />);
    const empty = screen.getByTestId('pr-empty-state');
    expect(empty).toBeInTheDocument();
    expect(empty).toHaveTextContent('Chưa có kỷ lục');
    expect(empty).toHaveTextContent('Hoàn thành buổi tập để thiết lập kỷ lục đầu tiên');
    // Dumbbell icon present (svg inside empty state)
    const svg = empty.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  // TC_W402_02: Loading state shows skeleton, hides records
  it('shows loading skeleton and hides records when isLoading=true', () => {
    render(<PersonalRecords records={[BENCH_PRESS_PR]} isLoading={true} />);
    expect(screen.getByTestId('pr-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('pr-empty-state')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pr-item-bench-press')).not.toBeInTheDocument();
  });

  // TC_W402_03: Loading=false shows PR list
  it('shows PR list when isLoading is false', () => {
    render(<PersonalRecords records={[BENCH_PRESS_PR]} isLoading={false} />);
    expect(screen.queryByTestId('pr-loading')).not.toBeInTheDocument();
    expect(screen.getByTestId('pr-item-bench-press')).toBeInTheDocument();
  });

  // TC_W402_04: Single PR displays all elements
  it('displays trophy, name, weight, reps, and date for a single PR', () => {
    render(<PersonalRecords records={[BENCH_PRESS_PR]} />);

    const item = screen.getByTestId('pr-item-bench-press');
    expect(item).toHaveTextContent('Bench Press');

    // Trophy
    const trophy = screen.getByTestId('pr-trophy-bench-press');
    expect(trophy).toBeInTheDocument();

    // Weight
    const weight = screen.getByTestId('pr-weight-bench-press');
    expect(weight).toHaveTextContent('100kg');

    // Reps
    const reps = screen.getByTestId('pr-reps-bench-press');
    expect(reps).toHaveTextContent('×5');

    // Date formatted DD/MM/YYYY
    const date = screen.getByTestId('pr-date-bench-press');
    expect(date).toHaveTextContent('10/07/2026');
  });

  // TC_W402_05: Multiple PRs with unique testids
  it('renders multiple PRs with unique testids', () => {
    render(<PersonalRecords records={[BENCH_PRESS_PR, SQUAT_PR, DEADLIFT_PR]} />);
    expect(screen.getByTestId('pr-item-bench-press')).toBeInTheDocument();
    expect(screen.getByTestId('pr-item-barbell-squat')).toBeInTheDocument();
    expect(screen.getByTestId('pr-item-deadlift')).toBeInTheDocument();
  });

  // TC_W402_06: Expand toggle shows history
  it('expands history on toggle click', () => {
    render(<PersonalRecords records={[BENCH_PRESS_PR]} />);
    const toggle = screen.getByTestId('pr-toggle-bench-press');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('pr-history-bench-press')).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('pr-history-bench-press')).toBeInTheDocument();
  });

  // TC_W402_07: Collapse hides history
  it('collapses history on second toggle click', () => {
    render(<PersonalRecords records={[BENCH_PRESS_PR]} />);
    const toggle = screen.getByTestId('pr-toggle-bench-press');

    fireEvent.click(toggle);
    expect(screen.getByTestId('pr-history-bench-press')).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByTestId('pr-history-bench-press')).not.toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  // TC_W402_08: History shows max 5 entries
  it('limits history to 5 entries even if more exist', () => {
    const manyHistory: PersonalRecord = {
      exerciseId: 'ohp',
      exerciseName: 'Overhead Press',
      bestWeight: 60,
      bestReps: 5,
      date: '2026-07-15',
      history: [
        { weight: 57.5, reps: 5, date: '2026-07-08' },
        { weight: 55, reps: 5, date: '2026-07-01' },
        { weight: 52.5, reps: 5, date: '2026-06-24' },
        { weight: 50, reps: 5, date: '2026-06-17' },
        { weight: 47.5, reps: 5, date: '2026-06-10' },
        { weight: 45, reps: 5, date: '2026-06-03' },
        { weight: 42.5, reps: 5, date: '2026-05-27' },
      ],
    };
    render(<PersonalRecords records={[manyHistory]} />);
    fireEvent.click(screen.getByTestId('pr-toggle-ohp'));
    const history = screen.getByTestId('pr-history-ohp');
    const entries = within(history).getAllByTestId(/^pr-history-entry-/);
    expect(entries).toHaveLength(5);
  });

  // TC_W402_09: No history → no toggle button
  it('does not show toggle button when record has no history', () => {
    render(<PersonalRecords records={[DEADLIFT_PR]} />);
    expect(screen.getByTestId('pr-item-deadlift')).toBeInTheDocument();
    expect(screen.queryByTestId('pr-toggle-deadlift')).not.toBeInTheDocument();
  });

  // TC_W402_10: Weight values have text-energy class
  it('applies text-energy class to weight values', () => {
    render(<PersonalRecords records={[BENCH_PRESS_PR, SQUAT_PR]} />);
    expect(screen.getByTestId('pr-weight-bench-press')).toHaveClass('text-energy');
    expect(screen.getByTestId('pr-weight-barbell-squat')).toHaveClass('text-energy');
  });

  // TC_W402_11: Trophy has text-energy and aria-hidden
  it('renders trophy with text-energy and aria-hidden', () => {
    render(<PersonalRecords records={[BENCH_PRESS_PR]} />);
    const trophy = screen.getByTestId('pr-trophy-bench-press');
    expect(trophy).toHaveClass('text-energy');
    expect(trophy).toHaveAttribute('aria-hidden', 'true');
  });

  // TC_W402_12: Date format DD/MM/YYYY
  it('formats date as DD/MM/YYYY', () => {
    render(<PersonalRecords records={[BENCH_PRESS_PR, SQUAT_PR]} />);
    expect(screen.getByTestId('pr-date-bench-press')).toHaveTextContent('10/07/2026');
    expect(screen.getByTestId('pr-date-barbell-squat')).toHaveTextContent('12/07/2026');
  });

  // TC_W402_13: Decimal weights
  it('handles decimal weights correctly', () => {
    const decimalPR: PersonalRecord = {
      exerciseId: 'curl',
      exerciseName: 'Bicep Curl',
      bestWeight: 67.5,
      bestReps: 8,
      date: '2026-07-11',
    };
    render(<PersonalRecords records={[decimalPR]} />);
    expect(screen.getByTestId('pr-weight-curl')).toHaveTextContent('67.5kg');
  });

  // TC_W402_14: Each record toggles independently
  it('toggles each record independently', () => {
    render(<PersonalRecords records={[BENCH_PRESS_PR, SQUAT_PR]} />);

    const toggleBench = screen.getByTestId('pr-toggle-bench-press');
    const toggleSquat = screen.getByTestId('pr-toggle-barbell-squat');

    // Expand bench only
    fireEvent.click(toggleBench);
    expect(toggleBench).toHaveAttribute('aria-expanded', 'true');
    expect(toggleSquat).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('pr-history-bench-press')).toBeInTheDocument();
    expect(screen.queryByTestId('pr-history-barbell-squat')).not.toBeInTheDocument();

    // Expand squat too
    fireEvent.click(toggleSquat);
    expect(toggleBench).toHaveAttribute('aria-expanded', 'true');
    expect(toggleSquat).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('pr-history-bench-press')).toBeInTheDocument();
    expect(screen.getByTestId('pr-history-barbell-squat')).toBeInTheDocument();

    // Collapse bench only
    fireEvent.click(toggleBench);
    expect(toggleBench).toHaveAttribute('aria-expanded', 'false');
    expect(toggleSquat).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByTestId('pr-history-bench-press')).not.toBeInTheDocument();
    expect(screen.getByTestId('pr-history-barbell-squat')).toBeInTheDocument();
  });

  // TC_W402_15: React.memo + displayName
  it('has displayName set to PersonalRecords', () => {
    expect(PersonalRecords.displayName).toBe('PersonalRecords');
  });

  // Additional coverage: title renders
  it('renders the title from i18n', () => {
    render(<PersonalRecords records={[]} />);
    expect(screen.getByTestId('pr-title')).toHaveTextContent('Kỷ lục cá nhân');
  });

  // Additional: root testid present
  it('has personal-records root testid', () => {
    render(<PersonalRecords records={[]} />);
    expect(screen.getByTestId('personal-records')).toBeInTheDocument();
  });

  // Additional: loading state hides empty state too
  it('hides empty state when loading with empty records', () => {
    render(<PersonalRecords records={[]} isLoading={true} />);
    expect(screen.getByTestId('pr-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('pr-empty-state')).not.toBeInTheDocument();
  });

  // Additional: empty history array → no toggle
  it('does not show toggle when history is empty array', () => {
    const emptyHistoryPR: PersonalRecord = {
      exerciseId: 'row',
      exerciseName: 'Barbell Row',
      bestWeight: 80,
      bestReps: 5,
      date: '2026-07-13',
      history: [],
    };
    render(<PersonalRecords records={[emptyHistoryPR]} />);
    expect(screen.queryByTestId('pr-toggle-row')).not.toBeInTheDocument();
  });

  // Additional: history entries show correct data
  it('displays history entry data correctly', () => {
    render(<PersonalRecords records={[BENCH_PRESS_PR]} />);
    fireEvent.click(screen.getByTestId('pr-toggle-bench-press'));

    const entry0 = screen.getByTestId('pr-history-entry-0');
    expect(entry0).toHaveTextContent('95kg');
    expect(entry0).toHaveTextContent('×5');
    expect(entry0).toHaveTextContent('03/07/2026');

    const entry2 = screen.getByTestId('pr-history-entry-2');
    expect(entry2).toHaveTextContent('85kg');
    expect(entry2).toHaveTextContent('19/06/2026');
  });

  // Additional: history date format in entries
  it('formats history entry dates as DD/MM/YYYY', () => {
    render(<PersonalRecords records={[SQUAT_PR]} />);
    fireEvent.click(screen.getByTestId('pr-toggle-barbell-squat'));

    const entry0 = screen.getByTestId('pr-history-entry-0');
    expect(entry0).toHaveTextContent('05/07/2026');

    const entry1 = screen.getByTestId('pr-history-entry-1');
    expect(entry1).toHaveTextContent('28/06/2026');
  });

  // Additional: default isLoading (undefined) shows records
  it('shows records when isLoading is undefined', () => {
    render(<PersonalRecords records={[DEADLIFT_PR]} />);
    expect(screen.queryByTestId('pr-loading')).not.toBeInTheDocument();
    expect(screen.getByTestId('pr-item-deadlift')).toBeInTheDocument();
  });

  // Additional: skeleton count
  it('renders 3 skeleton placeholders in loading state', () => {
    render(<PersonalRecords records={[]} isLoading={true} />);
    const loadingDiv = screen.getByTestId('pr-loading');
    const skeletons = loadingDiv.children;
    expect(skeletons).toHaveLength(3);
  });

  // Additional: Deadlift date
  it('formats deadlift date correctly', () => {
    render(<PersonalRecords records={[DEADLIFT_PR]} />);
    expect(screen.getByTestId('pr-date-deadlift')).toHaveTextContent('14/07/2026');
  });
});
