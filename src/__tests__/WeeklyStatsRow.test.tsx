import { cleanup, render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { WeeklyStatsRow } from '../features/dashboard/components/WeeklyStatsRow';
import type { TrainingPlan, TrainingPlanDay, WeightEntry, Workout } from '../features/fitness/types';
import { useFitnessStore } from '../store/fitnessStore';

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: vi.fn(),
}));

const mockFitnessStore = useFitnessStore as unknown as Mock;

// Fixed to Wednesday 2024-01-10 — Mon=2024-01-08
const FIXED_DATE = new Date('2024-01-10T12:00:00.000Z');

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_DATE);
});

afterAll(() => {
  vi.useRealTimers();
});

afterEach(cleanup);

// ===== Helpers =====

function makeWorkout(date: string, id?: string): Workout {
  return {
    id: id ?? `w-${date}`,
    date,
    name: 'Workout',
    createdAt: `${date}T10:00:00Z`,
    updatedAt: `${date}T10:00:00Z`,
  };
}

function makeWeightEntry(date: string, weightKg: number, id?: string): WeightEntry {
  return {
    id: id ?? `we-${date}`,
    date,
    weightKg,
    createdAt: `${date}T08:00:00Z`,
    updatedAt: `${date}T08:00:00Z`,
  };
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
  return daysOfWeek.map(d => ({
    id: `pd-${d}`,
    planId: 'plan1',
    dayOfWeek: d,
    sessionOrder: 1,
    workoutType: 'strength',
    isUserAssigned: false,
    originalDayOfWeek: d,
  }));
}

interface StoreData {
  workouts?: Workout[];
  weightEntries?: WeightEntry[];
  trainingPlanDays?: TrainingPlanDay[];
  trainingPlans?: TrainingPlan[];
}

function setupStore(data: StoreData = {}) {
  const state = {
    workouts: data.workouts ?? [],
    weightEntries: data.weightEntries ?? [],
    trainingPlanDays: data.trainingPlanDays ?? [],
    trainingPlans: data.trainingPlans ?? [],
  };
  mockFitnessStore.mockImplementation((selector: (s: typeof state) => unknown) => selector(state));
}

// ===== Tests =====

describe('WeeklyStatsRow', () => {
  // ===== Container =====

  it('renders container with correct testid and aria-label', () => {
    setupStore();
    render(<WeeklyStatsRow />);

    const container = screen.getByTestId('weekly-snapshot');
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute('aria-label');
  });

  // ===== Weight Column — No Data =====

  describe('Weight column', () => {
    it('shows dash and "Ghi cân nặng" when no weight data', () => {
      setupStore();
      render(<WeeklyStatsRow />);

      const col = screen.getByTestId('weekly-weight');
      expect(col).toBeInTheDocument();
      expect(col).toHaveTextContent('—');
      expect(col).toHaveTextContent('Ghi cân nặng');
    });

    it('shows latest weight with unit', () => {
      const weightEntries = [makeWeightEntry('2024-01-09', 74.5), makeWeightEntry('2024-01-10', 74.5)];
      setupStore({ weightEntries });
      render(<WeeklyStatsRow />);

      const col = screen.getByTestId('weekly-weight');
      expect(col).toHaveTextContent('74.5');
      expect(col).toHaveTextContent('kg');
    });

    it('shows down arrow (emerald) when weight decreased', () => {
      // 7 day span: 75→74 = -1 per week exactly
      const weightEntries = [makeWeightEntry('2024-01-03', 75), makeWeightEntry('2024-01-10', 74)];
      setupStore({ weightEntries });
      render(<WeeklyStatsRow />);

      const change = screen.getByTestId('weekly-weight-change');
      expect(change).toBeInTheDocument();
      expect(change).toHaveTextContent('↓');
      expect(change.className).toContain('text-success');
    });

    it('shows up arrow (amber) when weight increased', () => {
      // 7 day span: 74→75 = +1 per week
      const weightEntries = [makeWeightEntry('2024-01-03', 74), makeWeightEntry('2024-01-10', 75)];
      setupStore({ weightEntries });
      render(<WeeklyStatsRow />);

      const change = screen.getByTestId('weekly-weight-change');
      expect(change).toBeInTheDocument();
      expect(change).toHaveTextContent('↑');
      expect(change.className).toContain('text-energy');
    });

    it('shows stable text when weight unchanged', () => {
      const weightEntries = [makeWeightEntry('2024-01-03', 74.5), makeWeightEntry('2024-01-10', 74.5)];
      setupStore({ weightEntries });
      render(<WeeklyStatsRow />);

      const change = screen.getByTestId('weekly-weight-change');
      expect(change).toHaveTextContent('ổn định');
      expect(change.className).toContain('text-muted-foreground');
    });

    it('does not show change when only 1 entry', () => {
      const weightEntries = [makeWeightEntry('2024-01-10', 74.5)];
      setupStore({ weightEntries });
      render(<WeeklyStatsRow />);

      expect(screen.queryByTestId('weekly-weight-change')).not.toBeInTheDocument();
      expect(screen.getByTestId('weekly-weight')).toHaveTextContent('74.5');
    });
  });

  // ===== Streak Column =====

  describe('Streak column', () => {
    it('shows 0 ngày when no workouts', () => {
      setupStore();
      render(<WeeklyStatsRow />);

      const col = screen.getByTestId('weekly-streak');
      expect(col).toHaveTextContent('0 ngày');
      expect(col).toHaveTextContent('streak');
    });

    it('shows active streak count', () => {
      const workouts = [makeWorkout('2024-01-08'), makeWorkout('2024-01-09'), makeWorkout('2024-01-10')];
      setupStore({ workouts });
      render(<WeeklyStatsRow />);

      const col = screen.getByTestId('weekly-streak');
      expect(col).toHaveTextContent('3 ngày');
    });

    it('shows 1 ngày for single workout today', () => {
      const workouts = [makeWorkout('2024-01-10')];
      setupStore({ workouts });
      render(<WeeklyStatsRow />);

      expect(screen.getByTestId('weekly-streak')).toHaveTextContent('1 ngày');
    });

    it('renders 7 dots', () => {
      const workouts = [makeWorkout('2024-01-08')];
      setupStore({ workouts });
      render(<WeeklyStatsRow />);

      const dots = screen.getByTestId('weekly-streak-dots');
      expect(dots).toBeInTheDocument();
      expect(dots).toHaveAttribute('aria-hidden', 'true');
      for (let i = 1; i <= 7; i++) {
        expect(screen.getByTestId(`weekly-dot-${i}`)).toBeInTheDocument();
      }
    });

    it('completed dot has emerald color', () => {
      // Mon (day 1) has workout
      const workouts = [makeWorkout('2024-01-08')];
      setupStore({ workouts });
      render(<WeeklyStatsRow />);

      const dot = screen.getByTestId('weekly-dot-1');
      expect(dot).toHaveAttribute('data-status', 'completed');
      expect(dot.className).toContain('bg-success');
    });

    it('today dot has special styling', () => {
      // Wed (day 3) = today
      const workouts = [makeWorkout('2024-01-08')];
      setupStore({ workouts });
      render(<WeeklyStatsRow />);

      const dot = screen.getByTestId('weekly-dot-3');
      expect(dot).toHaveAttribute('data-status', 'today');
    });

    it('upcoming dots are empty', () => {
      const workouts = [makeWorkout('2024-01-08')];
      setupStore({ workouts });
      render(<WeeklyStatsRow />);

      // Thu (day 4) is upcoming
      const dot = screen.getByTestId('weekly-dot-4');
      expect(dot).toHaveAttribute('data-status', 'upcoming');
    });

    it('rest day dots show when plan exists', () => {
      // Plan on Mon(1), Wed(3), Fri(5). Tue(2) = rest
      const workouts = [makeWorkout('2024-01-08')];
      setupStore({
        workouts,
        trainingPlans: [makePlan()],
        trainingPlanDays: makePlanDays([1, 3, 5]),
      });
      render(<WeeklyStatsRow />);

      const dot2 = screen.getByTestId('weekly-dot-2');
      expect(dot2).toHaveAttribute('data-status', 'rest');
      expect(dot2.className).toContain('bg-info');
    });

    it('all dots empty when no workouts (no plan)', () => {
      setupStore();
      render(<WeeklyStatsRow />);

      // Mon+Tue = missed, Wed = today, Thu-Sun = upcoming
      expect(screen.getByTestId('weekly-dot-1')).toHaveAttribute('data-status', 'missed');
      expect(screen.getByTestId('weekly-dot-2')).toHaveAttribute('data-status', 'missed');
      expect(screen.getByTestId('weekly-dot-3')).toHaveAttribute('data-status', 'today');
      expect(screen.getByTestId('weekly-dot-4')).toHaveAttribute('data-status', 'upcoming');
    });
  });

  // ===== Adherence Column =====

  describe('Adherence column', () => {
    it('shows dash when no plan', () => {
      setupStore({ workouts: [makeWorkout('2024-01-10')] });
      render(<WeeklyStatsRow />);

      const col = screen.getByTestId('weekly-adherence');
      expect(col).toHaveTextContent('—');
      expect(col).toHaveTextContent('tuân thủ');
      expect(screen.queryByTestId('weekly-adherence-bar')).not.toBeInTheDocument();
    });

    it('shows 0% when planned days completed none', () => {
      // Plan on Mon(1), Wed(3), Fri(5). Today=Wed. Mon+Wed planned, 0 completed
      setupStore({
        workouts: [],
        trainingPlans: [makePlan()],
        trainingPlanDays: makePlanDays([1, 3, 5]),
      });
      render(<WeeklyStatsRow />);

      // Mon+Wed are planned so far (Wed is today so counted). No workouts = 0%
      expect(screen.getByTestId('weekly-adherence')).toHaveTextContent('0%');
    });

    it('shows 100% when all planned days completed', () => {
      // Plan on Mon(1), Wed(3). Today=Wed. Both done
      setupStore({
        workouts: [makeWorkout('2024-01-08'), makeWorkout('2024-01-10')],
        trainingPlans: [makePlan()],
        trainingPlanDays: makePlanDays([1, 3, 5]),
      });
      render(<WeeklyStatsRow />);

      expect(screen.getByTestId('weekly-adherence')).toHaveTextContent('100%');
    });

    it('shows 50% when half planned days completed', () => {
      // Plan on Mon(1), Wed(3). Today=Wed. Only Mon done = 1/2 = 50%
      setupStore({
        workouts: [makeWorkout('2024-01-08')],
        trainingPlans: [makePlan()],
        trainingPlanDays: makePlanDays([1, 3, 5]),
      });
      render(<WeeklyStatsRow />);

      expect(screen.getByTestId('weekly-adherence')).toHaveTextContent('50%');
    });

    it('renders progress bar with correct aria attributes', () => {
      setupStore({
        workouts: [makeWorkout('2024-01-08')],
        trainingPlans: [makePlan()],
        trainingPlanDays: makePlanDays([1, 3, 5]),
      });
      render(<WeeklyStatsRow />);

      const bar = screen.getByTestId('weekly-adherence-bar');
      expect(bar).toBeInTheDocument();
      expect(bar.tagName).toBe('PROGRESS');
      expect(bar).toHaveAttribute('value', '50');
      expect(bar).toHaveAttribute('max', '100');
    });

    it('progress bar value matches adherence percentage', () => {
      setupStore({
        workouts: [makeWorkout('2024-01-08')],
        trainingPlans: [makePlan()],
        trainingPlanDays: makePlanDays([1, 3, 5]),
      });
      render(<WeeklyStatsRow />);

      const bar = screen.getByTestId('weekly-adherence-bar');
      expect(bar).toHaveAttribute('value', '50');
    });

    it('ignores paused plan (shows dash)', () => {
      const pausedPlan = { ...makePlan(), status: 'paused' as const };
      setupStore({
        workouts: [makeWorkout('2024-01-08')],
        trainingPlans: [pausedPlan],
        trainingPlanDays: makePlanDays([1, 3, 5]),
      });
      render(<WeeklyStatsRow />);

      // No active plan → adherence = —
      expect(screen.getByTestId('weekly-adherence')).toHaveTextContent('—');
    });

    it('does not count future planned days', () => {
      // Plan on Mon(1),Wed(3),Fri(5). Today=Wed. Fri is future → only Mon+Wed counted
      // Mon done, Wed not done = 1/2 = 50%
      setupStore({
        workouts: [makeWorkout('2024-01-08')],
        trainingPlans: [makePlan()],
        trainingPlanDays: makePlanDays([1, 3, 5]),
      });
      render(<WeeklyStatsRow />);

      expect(screen.getByTestId('weekly-adherence')).toHaveTextContent('50%');
    });

    it('shows dash when active plan has only future planned days', () => {
      // Plan on Fri(5),Sat(6),Sun(7). Today=Wed(3). All planned days are after today.
      // Loop processes Mon-Wed but none match [5,6,7] → plannedCount=0 → null
      setupStore({
        workouts: [],
        trainingPlans: [makePlan()],
        trainingPlanDays: makePlanDays([5, 6, 7]),
      });
      render(<WeeklyStatsRow />);

      expect(screen.getByTestId('weekly-adherence')).toHaveTextContent('—');
      expect(screen.queryByTestId('weekly-adherence-bar')).not.toBeInTheDocument();
    });
  });

  // ===== Combined states =====

  describe('Combined states', () => {
    it('renders all 3 columns with data', () => {
      setupStore({
        weightEntries: [makeWeightEntry('2024-01-03', 75), makeWeightEntry('2024-01-10', 74.5)],
        workouts: [makeWorkout('2024-01-08'), makeWorkout('2024-01-09'), makeWorkout('2024-01-10')],
        trainingPlans: [makePlan()],
        trainingPlanDays: makePlanDays([1, 3, 5]),
      });
      render(<WeeklyStatsRow />);

      // Weight
      expect(screen.getByTestId('weekly-weight')).toHaveTextContent('74.5');
      expect(screen.getByTestId('weekly-weight-change')).toHaveTextContent('↓');

      // Streak: with plan on [1,3,5], rest days count → Mon(w)+Tue(rest)+Wed(w)+Thu(rest)+Fri(rest)+Sat(rest)=6
      expect(screen.getByTestId('weekly-streak')).toHaveTextContent('6 ngày');

      // Adherence: Mon done, Wed done = 2/2 = 100%
      expect(screen.getByTestId('weekly-adherence')).toHaveTextContent('100%');
    });

    it('renders all 3 columns empty gracefully', () => {
      setupStore();
      render(<WeeklyStatsRow />);

      expect(screen.getByTestId('weekly-weight')).toHaveTextContent('—');
      expect(screen.getByTestId('weekly-streak')).toHaveTextContent('0 ngày');
      expect(screen.getByTestId('weekly-adherence')).toHaveTextContent('—');
    });
  });

  // ===== Styling =====

  describe('Styling', () => {
    it('container has grid layout with gap and children have card styling', () => {
      setupStore();
      render(<WeeklyStatsRow />);

      const container = screen.getByTestId('weekly-snapshot');
      expect(container.className).toContain('grid-cols-3');
      expect(container.className).toContain('gap-2');
      // Children have card styling
      const weightCol = screen.getByTestId('weekly-weight');
      expect(weightCol.className).toContain('bg-card');
      expect(weightCol.className).toContain('rounded-xl');
    });
  });
});
