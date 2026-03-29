import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { StreakMini } from '../features/dashboard/components/StreakMini';
import { useFitnessStore } from '../store/fitnessStore';
import type { Mock } from 'vitest';
import type { Workout, TrainingPlan, TrainingPlanDay } from '../features/fitness/types';

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: vi.fn(),
}));

const mockFitnessStore = useFitnessStore as unknown as Mock;

const FIXED_DATE = new Date('2024-01-10T12:00:00.000Z');

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_DATE);
});

afterAll(() => {
  vi.useRealTimers();
});

afterEach(cleanup);

function makeWorkout(date: string, id?: string): Workout {
  return {
    id: id ?? `w-${date}`,
    date,
    name: 'Workout',
    createdAt: `${date}T10:00:00Z`,
    updatedAt: `${date}T10:00:00Z`,
  };
}

interface StoreData {
  workouts?: Workout[];
  trainingPlanDays?: TrainingPlanDay[];
  trainingPlans?: TrainingPlan[];
}

function setupStore(data: StoreData = {}) {
  const state = {
    workouts: data.workouts ?? [],
    trainingPlanDays: data.trainingPlanDays ?? [],
    trainingPlans: data.trainingPlans ?? [],
  };
  mockFitnessStore.mockImplementation(
    (selector: (s: typeof state) => unknown) => selector(state),
  );
}

function makePlan(): TrainingPlan {
  return {
    id: 'plan1',
    name: 'Test Plan',
    status: 'active',
    splitType: 'ppl',
    durationWeeks: 8,
    currentWeek: 1,
    startDate: '2024-01-01',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    trainingDays: [1, 3, 5],
    restDays: [2, 4, 6, 7],
  };
}

function makePlanDays(daysOfWeek: number[]): TrainingPlanDay[] {
  return daysOfWeek.map((d) => ({
    id: `pd-${d}`,
    planId: 'plan1',
    dayOfWeek: d,
    sessionOrder: 1,
    workoutType: 'strength',
    isUserAssigned: false,
    originalDayOfWeek: d,
  }));
}

describe('StreakMini', () => {
  // ===== Empty State =====

  it('renders empty state when no workouts', () => {
    setupStore();
    render(<StreakMini />);

    expect(screen.getByTestId('streak-mini-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('streak-mini')).not.toBeInTheDocument();
    expect(screen.getByText('Chưa có chuỗi tập')).toBeInTheDocument();
    expect(screen.getByText('Bắt đầu tập để tạo chuỗi')).toBeInTheDocument();
  });

  it('empty state has proper aria-label', () => {
    setupStore();
    render(<StreakMini />);

    expect(screen.getByTestId('streak-mini-empty')).toHaveAttribute(
      'aria-label',
      'Chưa có chuỗi tập luyện',
    );
  });

  // ===== Basic Display =====

  it('shows streak count with tabular-nums', () => {
    // Fixed date is 2024-01-10 (Wednesday)
    // Workouts on 2024-01-08 (Mon), 2024-01-09 (Tue), 2024-01-10 (Wed)
    const workouts = [
      makeWorkout('2024-01-08'),
      makeWorkout('2024-01-09'),
      makeWorkout('2024-01-10'),
    ];
    setupStore({ workouts });
    render(<StreakMini />);

    const count = screen.getByTestId('streak-count');
    expect(count).toBeInTheDocument();
    expect(count).toHaveTextContent('3 ngày');
    const bold = count.querySelector('[style]');
    expect(bold).toHaveStyle({ fontVariantNumeric: 'tabular-nums' });
  });

  it('shows personal record', () => {
    const workouts = [
      makeWorkout('2024-01-08'),
      makeWorkout('2024-01-09'),
      makeWorkout('2024-01-10'),
    ];
    setupStore({ workouts });
    render(<StreakMini />);

    const record = screen.getByTestId('streak-record');
    expect(record).toBeInTheDocument();
    expect(record).toHaveTextContent('Kỷ lục: 3 ngày');
    expect(record).toHaveStyle({ fontVariantNumeric: 'tabular-nums' });
  });

  // ===== Week Dots =====

  it('renders 7 week dots', () => {
    const workouts = [makeWorkout('2024-01-08')];
    setupStore({ workouts });
    render(<StreakMini />);

    const dotsContainer = screen.getByTestId('week-dots');
    expect(dotsContainer).toBeInTheDocument();
    for (let i = 1; i <= 7; i++) {
      expect(screen.getByTestId(`dot-${i}`)).toBeInTheDocument();
    }
  });

  it('completed dot has green color', () => {
    // 2024-01-08 is Monday (day 1), workout done
    const workouts = [makeWorkout('2024-01-08')];
    setupStore({ workouts });
    render(<StreakMini />);

    const dot = screen.getByTestId('dot-1');
    expect(dot).toHaveAttribute('data-status', 'completed');
    expect(dot.className).toContain('emerald');
  });

  it('rest day dot has blue color when plan exists', () => {
    // Plan has workouts on Mon(1), Wed(3), Fri(5)
    // Tue(2) is rest day
    const workouts = [makeWorkout('2024-01-08')];
    setupStore({
      workouts,
      trainingPlans: [makePlan()],
      trainingPlanDays: makePlanDays([1, 3, 5]),
    });
    render(<StreakMini />);

    // Tue (day 2) should be rest
    const dot2 = screen.getByTestId('dot-2');
    expect(dot2).toHaveAttribute('data-status', 'rest');
    expect(dot2.className).toContain('blue');
  });

  it('missed day dot has gray outline', () => {
    // Mon (day 1) workout done, Tue (day 2) missed (no plan, so just missed)
    const workouts = [makeWorkout('2024-01-08')];
    setupStore({ workouts });
    render(<StreakMini />);

    // Tue (day 2) — no plan, no workout, past → missed
    const dot2 = screen.getByTestId('dot-2');
    expect(dot2).toHaveAttribute('data-status', 'missed');
    expect(dot2.className).toContain('slate');
  });

  it('today dot has emerald ring', () => {
    // Fixed date 2024-01-10 = Wednesday = day 3
    const workouts = [makeWorkout('2024-01-08')];
    setupStore({ workouts });
    render(<StreakMini />);

    const dot3 = screen.getByTestId('dot-3');
    expect(dot3).toHaveAttribute('data-status', 'today');
    expect(dot3.className).toContain('emerald');
  });

  it('future dot has gray outline', () => {
    const workouts = [makeWorkout('2024-01-08')];
    setupStore({ workouts });
    render(<StreakMini />);

    // Thu (day 4) is upcoming
    const dot4 = screen.getByTestId('dot-4');
    expect(dot4).toHaveAttribute('data-status', 'upcoming');
    expect(dot4.className).toContain('slate');
  });

  // ===== Streak Calculation =====

  it('streak count matches calculated value', () => {
    // 3 consecutive days: Mon, Tue, Wed (today)
    const workouts = [
      makeWorkout('2024-01-08'),
      makeWorkout('2024-01-09'),
      makeWorkout('2024-01-10'),
    ];
    setupStore({ workouts });
    render(<StreakMini />);

    expect(screen.getByTestId('streak-count')).toHaveTextContent('3 ngày');
  });

  it('streak resets when gap exists', () => {
    // Only Wed (today)
    const workouts = [makeWorkout('2024-01-10')];
    setupStore({ workouts });
    render(<StreakMini />);

    expect(screen.getByTestId('streak-count')).toHaveTextContent('1 ngày');
  });

  // ===== Tap Handler =====

  it('fires onTap callback on click', () => {
    const workouts = [makeWorkout('2024-01-10')];
    setupStore({ workouts });
    const onTap = vi.fn();
    render(<StreakMini onTap={onTap} />);

    fireEvent.click(screen.getByTestId('streak-mini'));
    expect(onTap).toHaveBeenCalledOnce();
  });

  it('fires onTap on Enter key', () => {
    const workouts = [makeWorkout('2024-01-10')];
    setupStore({ workouts });
    const onTap = vi.fn();
    render(<StreakMini onTap={onTap} />);

    fireEvent.keyDown(screen.getByTestId('streak-mini'), { key: 'Enter' });
    expect(onTap).toHaveBeenCalledOnce();
  });

  it('fires onTap on Space key', () => {
    const workouts = [makeWorkout('2024-01-10')];
    setupStore({ workouts });
    const onTap = vi.fn();
    render(<StreakMini onTap={onTap} />);

    fireEvent.keyDown(screen.getByTestId('streak-mini'), { key: ' ' });
    expect(onTap).toHaveBeenCalledOnce();
  });

  it('fires onTap on empty state click', () => {
    setupStore();
    const onTap = vi.fn();
    render(<StreakMini onTap={onTap} />);

    fireEvent.click(screen.getByTestId('streak-mini-empty'));
    expect(onTap).toHaveBeenCalledOnce();
  });

  it('does not fire onTap on other keys', () => {
    const workouts = [makeWorkout('2024-01-10')];
    setupStore({ workouts });
    const onTap = vi.fn();
    render(<StreakMini onTap={onTap} />);

    fireEvent.keyDown(screen.getByTestId('streak-mini'), { key: 'Escape' });
    expect(onTap).not.toHaveBeenCalled();
  });

  // ===== Accessibility =====

  it('has proper aria-label with streak info', () => {
    const workouts = [
      makeWorkout('2024-01-08'),
      makeWorkout('2024-01-09'),
      makeWorkout('2024-01-10'),
    ];
    setupStore({ workouts });
    render(<StreakMini />);

    const mini = screen.getByTestId('streak-mini');
    expect(mini).toHaveAttribute(
      'aria-label',
      expect.stringContaining('3'),
    );
  });

  it('week-dots container has aria-hidden', () => {
    const workouts = [makeWorkout('2024-01-10')];
    setupStore({ workouts });
    render(<StreakMini />);

    expect(screen.getByTestId('week-dots')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  // ===== With Plan =====

  it('uses plan days for rest day detection', () => {
    // Plan on Mon(1), Wed(3), Fri(5)
    // Mon: completed, Tue: rest, Wed(today): today
    const workouts = [makeWorkout('2024-01-08')];
    setupStore({
      workouts,
      trainingPlans: [makePlan()],
      trainingPlanDays: makePlanDays([1, 3, 5]),
    });
    render(<StreakMini />);

    expect(screen.getByTestId('dot-1')).toHaveAttribute('data-status', 'completed');
    expect(screen.getByTestId('dot-2')).toHaveAttribute('data-status', 'rest');
    expect(screen.getByTestId('dot-3')).toHaveAttribute('data-status', 'today');
  });

  it('ignores paused plan', () => {
    const pausedPlan = { ...makePlan(), status: 'paused' as const };
    const workouts = [makeWorkout('2024-01-08')];
    setupStore({
      workouts,
      trainingPlans: [pausedPlan],
      trainingPlanDays: makePlanDays([1, 3, 5]),
    });
    render(<StreakMini />);

    // Without active plan, Tue should be "missed" not "rest"
    expect(screen.getByTestId('dot-2')).toHaveAttribute('data-status', 'missed');
  });
});
