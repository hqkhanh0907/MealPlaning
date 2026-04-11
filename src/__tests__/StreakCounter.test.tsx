import { cleanup, render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { StreakCounter } from '../features/fitness/components/StreakCounter';
import { useFitnessStore } from '../store/fitnessStore';

// --- Mocks ---

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'fitness.gamification.streak': 'Chuỗi ngày tập',
        'fitness.gamification.longestStreak': 'Chuỗi dài nhất',
        'fitness.gamification.streakAtRisk': 'Giữ chuỗi ngày tập nhé!',
        'fitness.streak.milestone': '🔥 Chuỗi {{count}} ngày liên tiếp!',
      };
      let template = translations[key] ?? key;
      if (opts && 'count' in opts) {
        template = template.replace('{{count}}', String(opts.count));
      }
      return template;
    },
    i18n: { language: 'vi' },
  }),
}));

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: vi.fn(),
}));

const mockStore = useFitnessStore as unknown as Mock;

// --- Fake timers: Fixed to Wednesday 2024-01-10 ---

const FIXED_DATE = new Date('2024-01-10T12:00:00.000Z');

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_DATE);
});
afterAll(() => vi.useRealTimers());
afterEach(cleanup);

// --- Helpers ---

interface WorkoutLike {
  id: string;
  date: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

function makeWorkout(id: string, date: string): WorkoutLike {
  return { id, date, name: 'W', createdAt: date, updatedAt: date };
}

function makePlan(dayOfWeeks: number[]) {
  return {
    trainingPlans: [{ id: 'p1', status: 'active' as const }],
    trainingPlanDays: dayOfWeeks.map((d, i) => ({
      id: `d${i}`,
      planId: 'p1',
      dayOfWeek: d,
    })),
  };
}

function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

function generateConsecutiveWorkouts(count: number, endDate = '2024-01-10'): WorkoutLike[] {
  return Array.from({ length: count }, (_, i) => {
    const date = addDaysToDate(endDate, -(count - 1 - i));
    return makeWorkout(`w${i + 1}`, date);
  });
}

function setupStore(overrides: Record<string, unknown> = {}) {
  const state = {
    workouts: [] as WorkoutLike[],
    trainingPlanDays: [] as { id: string; planId: string; dayOfWeek: number }[],
    trainingPlans: [] as { id: string; status: string }[],
    ...overrides,
  };
  mockStore.mockImplementation((selector: (s: typeof state) => unknown) => selector(state));
}

// === TESTS ===

describe('StreakCounter', () => {
  // ─── SC_W501_01: Hidden State (streak=0) ───

  describe('SC_W501_01 — Hidden State (streak=0)', () => {
    it('TC_W501_01: Returns null when no workouts exist (streak=0)', () => {
      setupStore({ workouts: [] });
      const { container } = render(<StreakCounter />);
      expect(screen.queryByTestId('streak-counter')).toBeNull();
      expect(container.innerHTML).toBe('');
    });

    it('TC_W501_02: Returns null when workouts exist but all are old (streak=0)', () => {
      setupStore({ workouts: [makeWorkout('w1', '2023-12-01')] });
      const { container } = render(<StreakCounter />);
      expect(screen.queryByTestId('streak-counter')).toBeNull();
      expect(container.innerHTML).toBe('');
    });
  });

  // ─── SC_W501_02: Flame State (streak 1-6) ───

  describe('SC_W501_02 — Flame State (streak 1-6)', () => {
    it('TC_W501_03: Shows Flame icon when streak=1 (single workout today)', () => {
      setupStore({ workouts: [makeWorkout('w1', '2024-01-10')] });
      render(<StreakCounter />);
      expect(screen.getByTestId('streak-counter')).toBeInTheDocument();
      expect(screen.getByTestId('streak-icon-flame')).toBeInTheDocument();
      expect(screen.queryByTestId('streak-icon-trophy')).toBeNull();
      expect(screen.getByTestId('streak-count')).toHaveTextContent('1');
    });

    it('TC_W501_04: Shows Flame icon when streak=3 (consecutive days)', () => {
      setupStore({
        workouts: [makeWorkout('w1', '2024-01-08'), makeWorkout('w2', '2024-01-09'), makeWorkout('w3', '2024-01-10')],
      });
      render(<StreakCounter />);
      expect(screen.getByTestId('streak-count')).toHaveTextContent('3');
      expect(screen.getByTestId('streak-icon-flame')).toBeInTheDocument();
      expect(screen.queryByTestId('streak-icon-trophy')).toBeNull();
    });

    it('TC_W501_05: Shows Flame icon at streak=6 (boundary — max flame)', () => {
      setupStore({ workouts: generateConsecutiveWorkouts(6) });
      render(<StreakCounter />);
      expect(screen.getByTestId('streak-count')).toHaveTextContent('6');
      expect(screen.getByTestId('streak-icon-flame')).toBeInTheDocument();
      expect(screen.queryByTestId('streak-icon-trophy')).toBeNull();
    });
  });

  // ─── SC_W501_03: Trophy State (streak ≥ 7) ───

  describe('SC_W501_03 — Trophy State (streak ≥ 7)', () => {
    it('TC_W501_06: Shows Trophy icon when streak=7 (exact threshold)', () => {
      setupStore({ workouts: generateConsecutiveWorkouts(7) });
      render(<StreakCounter />);
      expect(screen.getByTestId('streak-count')).toHaveTextContent('7');
      expect(screen.getByTestId('streak-icon-trophy')).toBeInTheDocument();
      expect(screen.queryByTestId('streak-icon-flame')).toBeNull();
    });

    it('TC_W501_07: Shows Trophy icon when streak=14', () => {
      setupStore({ workouts: generateConsecutiveWorkouts(14) });
      render(<StreakCounter />);
      expect(screen.getByTestId('streak-count')).toHaveTextContent('14');
      expect(screen.getByTestId('streak-icon-trophy')).toBeInTheDocument();
    });

    it('TC_W501_08: Shows Trophy with high streak=30', () => {
      setupStore({ workouts: generateConsecutiveWorkouts(30) });
      render(<StreakCounter />);
      expect(screen.getByTestId('streak-count')).toHaveTextContent('30');
      expect(screen.getByTestId('streak-icon-trophy')).toBeInTheDocument();
    });
  });

  // ─── SC_W501_04: At-Risk Badge ───

  describe('SC_W501_04 — At-Risk Badge', () => {
    it('TC_W501_09: Warning badge visible when streakAtRisk=true', () => {
      // Plan Mon/Wed/Fri → Fri 01-05 is planned but no workout → grace consumed
      setupStore({
        workouts: [makeWorkout('w1', '2024-01-08'), makeWorkout('w2', '2024-01-10')],
        ...makePlan([1, 3, 5]),
      });
      render(<StreakCounter />);
      expect(screen.getByTestId('streak-warning')).toBeInTheDocument();
      expect(screen.getByTestId('streak-warning')).toHaveTextContent('Giữ chuỗi ngày tập nhé!');
    });

    it('TC_W501_10: No warning badge when streak is healthy (no grace used)', () => {
      setupStore({
        workouts: [makeWorkout('w1', '2024-01-08'), makeWorkout('w2', '2024-01-09'), makeWorkout('w3', '2024-01-10')],
      });
      render(<StreakCounter />);
      expect(screen.queryByTestId('streak-warning')).toBeNull();
    });

    it('TC_W501_11: At-risk badge coexists with Flame icon (streak in 1-6, at-risk)', () => {
      // Plan Mon-Fri → Tue missed (grace consumed), streak ~4, atRisk=true
      setupStore({
        workouts: [makeWorkout('w1', '2024-01-08'), makeWorkout('w2', '2024-01-10')],
        ...makePlan([1, 2, 3, 4, 5]),
      });
      render(<StreakCounter />);
      expect(screen.getByTestId('streak-icon-flame')).toBeInTheDocument();
      expect(screen.getByTestId('streak-warning')).toBeInTheDocument();
    });
  });

  // ─── SC_W501_05: Entry Animation (0→1 Transition) ───

  describe('SC_W501_05 — Entry Animation (0→1)', () => {
    it('TC_W501_12: Container has animate-scale-in class on initial render with streak=1', () => {
      setupStore({ workouts: [makeWorkout('w1', '2024-01-10')] });
      render(<StreakCounter />);
      expect(screen.getByTestId('streak-counter').className).toContain('animate-scale-in');
    });

    it('TC_W501_13: No animate-scale-in when streak > 1 (not a 0→1 transition)', () => {
      setupStore({
        workouts: [makeWorkout('w1', '2024-01-08'), makeWorkout('w2', '2024-01-09'), makeWorkout('w3', '2024-01-10')],
      });
      render(<StreakCounter />);
      expect(screen.getByTestId('streak-counter').className).not.toContain('animate-scale-in');
    });

    it('TC_W501_14: No animation when streak=0 (component hidden)', () => {
      setupStore({ workouts: [] });
      render(<StreakCounter />);
      expect(screen.queryByTestId('streak-counter')).toBeNull();
    });
  });

  // ─── SC_W501_06: Week Dots (7 Statuses per BR-09) ───

  describe('SC_W501_06 — Week Dots', () => {
    it('TC_W501_15: Renders exactly 7 week dots', () => {
      setupStore({ workouts: [makeWorkout('w1', '2024-01-10')] });
      render(<StreakCounter />);
      const dots = screen.getByTestId('week-dots');
      expect(dots.children).toHaveLength(7);
      const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      labels.forEach(label => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    it('TC_W501_16: Completed dot for past day with workout', () => {
      // Workout on Mon (01-08) and today Wed (01-10)
      setupStore({
        workouts: [makeWorkout('w1', '2024-01-08'), makeWorkout('w2', '2024-01-10')],
      });
      render(<StreakCounter />);
      expect(screen.getByTestId('dot-completed')).toBeInTheDocument();
    });

    it('TC_W501_17: Rest dot for non-plan day', () => {
      // Plan Mon/Wed/Fri (1,3,5) → Tuesday (dow=2) is rest
      setupStore({
        workouts: [makeWorkout('w1', '2024-01-08')],
        ...makePlan([1, 3, 5]),
      });
      render(<StreakCounter />);
      expect(screen.getByTestId('dot-rest')).toBeInTheDocument();
    });

    it('TC_W501_18: Today dot for current day', () => {
      // Today = Wed 01-10
      setupStore({
        workouts: [makeWorkout('w1', '2024-01-08')],
        ...makePlan([1, 3, 5]),
      });
      render(<StreakCounter />);
      expect(screen.getByTestId('dot-today')).toBeInTheDocument();
    });

    it('TC_W501_19: Missed dot for planned day without workout', () => {
      // Plan Mon-Fri, workout only Mon → Tue is missed
      setupStore({
        workouts: [makeWorkout('w1', '2024-01-08')],
        ...makePlan([1, 2, 3, 4, 5]),
      });
      render(<StreakCounter />);
      expect(screen.getByTestId('dot-missed')).toBeInTheDocument();
    });

    it('TC_W501_20: Upcoming/future dots for days after today', () => {
      // Today=Wed (01-10), Thu-Sun are future
      setupStore({ workouts: [makeWorkout('w1', '2024-01-10')] });
      render(<StreakCounter />);
      const upcoming = screen.getAllByTestId('dot-upcoming');
      expect(upcoming).toHaveLength(4); // Thu, Fri, Sat, Sun
    });

    it('TC_W501_21: Mixed dot statuses in a realistic week', () => {
      // Plan Mon/Wed/Fri (1,3,5), workout Mon only, today=Wed
      setupStore({
        workouts: [makeWorkout('w1', '2024-01-08')],
        ...makePlan([1, 3, 5]),
      });
      render(<StreakCounter />);
      // Mon (01-08): completed
      expect(screen.getAllByTestId('dot-completed')).toHaveLength(1);
      // Tue (01-09): rest (not in plan)
      expect(screen.getAllByTestId('dot-rest')).toHaveLength(1);
      // Wed (01-10): today
      expect(screen.getAllByTestId('dot-today')).toHaveLength(1);
      // Thu-Sun: upcoming
      expect(screen.getAllByTestId('dot-upcoming')).toHaveLength(4);
      // Total: 1+1+1+4 = 7
    });
  });

  // ─── SC_W501_07: Milestone Text at Thresholds ───

  describe('SC_W501_07 — Milestone Text', () => {
    it('TC_W501_22: Milestone text displayed at streak=7', () => {
      setupStore({ workouts: generateConsecutiveWorkouts(7) });
      render(<StreakCounter />);
      const milestone = screen.getByTestId('streak-milestone');
      expect(milestone).toBeInTheDocument();
      expect(milestone).toHaveTextContent('🔥 Chuỗi 7 ngày liên tiếp!');
    });

    it('TC_W501_23: Milestone text displayed at streak=14', () => {
      setupStore({ workouts: generateConsecutiveWorkouts(14) });
      render(<StreakCounter />);
      expect(screen.getByTestId('streak-milestone')).toHaveTextContent('🔥 Chuỗi 14 ngày liên tiếp!');
    });

    it('TC_W501_24: Milestone text displayed at streak=30', () => {
      setupStore({ workouts: generateConsecutiveWorkouts(30) });
      render(<StreakCounter />);
      expect(screen.getByTestId('streak-milestone')).toHaveTextContent('🔥 Chuỗi 30 ngày liên tiếp!');
    });

    it('TC_W501_25: NO milestone text at streak=6 (between thresholds)', () => {
      setupStore({ workouts: generateConsecutiveWorkouts(6) });
      render(<StreakCounter />);
      expect(screen.queryByTestId('streak-milestone')).toBeNull();
    });

    it('TC_W501_26: NO milestone at streak=8 (past threshold, between 7 and 14)', () => {
      setupStore({ workouts: generateConsecutiveWorkouts(8) });
      render(<StreakCounter />);
      expect(screen.queryByTestId('streak-milestone')).toBeNull();
    });
  });

  // ─── SC_W501_08: Longest Streak Display ───

  describe('SC_W501_08 — Longest Streak', () => {
    it('TC_W501_27: Longest streak displays correctly', () => {
      setupStore({
        workouts: [makeWorkout('w1', '2024-01-08'), makeWorkout('w2', '2024-01-09'), makeWorkout('w3', '2024-01-10')],
      });
      render(<StreakCounter />);
      const record = screen.getByTestId('streak-record');
      expect(record).toHaveTextContent('Chuỗi dài nhất');
      expect(record).toHaveTextContent('3');
    });

    it('TC_W501_28: Longest streak can exceed current streak', () => {
      setupStore({
        workouts: [
          // Past streak of 5
          makeWorkout('w1', '2023-12-20'),
          makeWorkout('w2', '2023-12-21'),
          makeWorkout('w3', '2023-12-22'),
          makeWorkout('w4', '2023-12-23'),
          makeWorkout('w5', '2023-12-24'),
          // Gap (12/25 → 01/08)
          // Current streak of 2
          makeWorkout('w6', '2024-01-09'),
          makeWorkout('w7', '2024-01-10'),
        ],
      });
      render(<StreakCounter />);
      expect(screen.getByTestId('streak-count')).toHaveTextContent('2');
      expect(screen.getByTestId('streak-record')).toHaveTextContent('Chuỗi dài nhất: 5');
    });
  });

  // ─── SC_W501_09: State Transition Edge Cases ───

  describe('SC_W501_09 — State Transition Edge Cases', () => {
    it('TC_W501_29: Transition from flame(6) to trophy(7)', () => {
      // streak=6 → Flame
      setupStore({ workouts: generateConsecutiveWorkouts(6) });
      render(<StreakCounter />);
      expect(screen.getByTestId('streak-icon-flame')).toBeInTheDocument();
      expect(screen.queryByTestId('streak-icon-trophy')).toBeNull();
      cleanup();

      // streak=7 → Trophy
      setupStore({ workouts: generateConsecutiveWorkouts(7) });
      render(<StreakCounter />);
      expect(screen.getByTestId('streak-icon-trophy')).toBeInTheDocument();
      expect(screen.queryByTestId('streak-icon-flame')).toBeNull();
    });

    it('TC_W501_30: Milestone at exact boundary 7 coincides with trophy transition', () => {
      setupStore({ workouts: generateConsecutiveWorkouts(7) });
      render(<StreakCounter />);
      // Trophy icon at streak=7
      expect(screen.getByTestId('streak-icon-trophy')).toBeInTheDocument();
      // Milestone text also at streak=7
      expect(screen.getByTestId('streak-milestone')).toHaveTextContent('🔥 Chuỗi 7 ngày liên tiếp!');
    });
  });

  // ─── SC_W501_10: Typography & CSS Contracts ───

  describe('SC_W501_10 — Typography & CSS Contracts', () => {
    it('TC_W501_31: Streak count has correct typography classes', () => {
      setupStore({
        workouts: [makeWorkout('w1', '2024-01-08'), makeWorkout('w2', '2024-01-09'), makeWorkout('w3', '2024-01-10')],
      });
      render(<StreakCounter />);
      const countEl = screen.getByTestId('streak-count');
      expect(countEl.className).toContain('text-2xl');
      expect(countEl.className).toContain('font-bold');
      expect(countEl.className).toContain('tabular-nums');
    });
  });

  // ─── SC_W501_11: Accessibility ───

  describe('SC_W501_11 — Accessibility', () => {
    it('TC_W501_32: Icons have aria-hidden="true"', () => {
      setupStore({
        workouts: [makeWorkout('w1', '2024-01-08'), makeWorkout('w2', '2024-01-09'), makeWorkout('w3', '2024-01-10')],
      });
      render(<StreakCounter />);
      const counter = screen.getByTestId('streak-counter');
      const svgs = counter.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
      svgs.forEach(svg => {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('TC_W501_33: Component has meaningful accessible label', () => {
      setupStore({
        workouts: generateConsecutiveWorkouts(5),
      });
      render(<StreakCounter />);
      const counter = screen.getByTestId('streak-counter');
      expect(counter.tagName).toBe('OUTPUT');
      expect(counter).toHaveAttribute('aria-label', 'Chuỗi ngày tập');
    });
  });
});
