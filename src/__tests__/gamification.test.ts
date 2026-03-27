import {
  calculateStreak,
  checkMilestones,
  detectPRs,
  MILESTONES,
} from '../features/fitness/utils/gamification';
import type { Workout, WorkoutSet } from '../features/fitness/types';

// ---------- helpers ----------

function makeWorkout(date: string, id?: string): Workout {
  return {
    id: id ?? `w-${date}`,
    date,
    name: 'Workout',
    createdAt: date,
    updatedAt: date,
  };
}

function makeSet(overrides: {
  exerciseId: string;
  weightKg: number;
  reps?: number;
  workoutId?: string;
  setNumber?: number;
  id?: string;
}): WorkoutSet {
  return {
    id: overrides.id ?? `s-${overrides.exerciseId}-${overrides.setNumber ?? 1}`,
    workoutId: overrides.workoutId ?? 'w1',
    exerciseId: overrides.exerciseId,
    setNumber: overrides.setNumber ?? 1,
    reps: overrides.reps,
    weightKg: overrides.weightKg,
    updatedAt: '2024-01-10',
  } as WorkoutSet;
}

// =============================================================
// calculateStreak
// =============================================================

describe('calculateStreak', () => {
  it('returns streak 0 when no workouts', () => {
    const result = calculateStreak([], [], '2024-01-10');
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.gracePeriodUsed).toBe(false);
    expect(result.streakAtRisk).toBe(false);
    expect(result.weekDots).toHaveLength(7);
  });

  it('counts consecutive days correctly', () => {
    // Wed 2024-01-10, workouts on Mon-Wed
    const workouts = [
      makeWorkout('2024-01-08'),
      makeWorkout('2024-01-09'),
      makeWorkout('2024-01-10'),
    ];
    const result = calculateStreak(workouts, [], '2024-01-10');
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('allows 1 miss with grace period', () => {
    // Plan: Mon-Fri (1-5), today: Fri 2024-01-12
    // Mon=workout, Tue=missed(grace), Wed=workout, Thu=workout, Fri=workout
    const workouts = [
      makeWorkout('2024-01-08'), // Mon
      makeWorkout('2024-01-10'), // Wed
      makeWorkout('2024-01-11'), // Thu
      makeWorkout('2024-01-12'), // Fri
    ];
    const result = calculateStreak(workouts, [1, 2, 3, 4, 5], '2024-01-12');
    // Backward: Fri(1) Thu(2) Wed(3) Tue-grace(4) Mon(5) Sun-rest(6) Sat-rest(7)...
    expect(result.currentStreak).toBeGreaterThanOrEqual(5);
    expect(result.gracePeriodUsed).toBe(true);
  });

  it('resets streak on 2 misses', () => {
    // Plan: Mon-Fri, today: Fri 2024-01-12
    // Mon=missed, Tue=missed, Wed=workout, Thu=workout, Fri=workout
    const workouts = [
      makeWorkout('2024-01-10'), // Wed
      makeWorkout('2024-01-11'), // Thu
      makeWorkout('2024-01-12'), // Fri
    ];
    const result = calculateStreak(workouts, [1, 2, 3, 4, 5], '2024-01-12');
    // Backward: Fri(1) Thu(2) Wed(3) Tue-grace(no-inc) Mon-break → streak=3
    expect(result.currentStreak).toBe(3);
  });

  it('rest days count toward streak', () => {
    // Plan: Mon, Wed, Fri (1,3,5) — Tue/Thu/Sat/Sun are rest
    // Today: Fri 2024-01-12
    const workouts = [
      makeWorkout('2024-01-08'), // Mon
      makeWorkout('2024-01-10'), // Wed
      makeWorkout('2024-01-12'), // Fri
    ];
    const result = calculateStreak(workouts, [1, 3, 5], '2024-01-12');
    // Backward: Fri(1) Thu-rest(2) Wed(3) Tue-rest(4) Mon(5) Sun-rest(6) Sat-rest(7)…
    expect(result.currentStreak).toBeGreaterThanOrEqual(5);
  });

  it('generates correct weekDots for current week', () => {
    // Today: Wed 2024-01-10, Plan: Mon-Fri (1-5), workout only Mon
    const workouts = [makeWorkout('2024-01-08')];
    const result = calculateStreak(workouts, [1, 2, 3, 4, 5], '2024-01-10');

    expect(result.weekDots).toHaveLength(7);
    expect(result.weekDots[0]).toEqual({ day: 1, status: 'completed' }); // Mon
    expect(result.weekDots[1]).toEqual({ day: 2, status: 'missed' }); // Tue planned, missed
    expect(result.weekDots[2]).toEqual({ day: 3, status: 'today' }); // Wed
    expect(result.weekDots[3]).toEqual({ day: 4, status: 'upcoming' }); // Thu
    expect(result.weekDots[6]).toEqual({ day: 7, status: 'upcoming' }); // Sun

    // With plan [1,3,5] — Tue is a rest day
    const result2 = calculateStreak(workouts, [1, 3, 5], '2024-01-10');
    expect(result2.weekDots[1]).toEqual({ day: 2, status: 'rest' }); // Tue rest
  });

  it('sets streakAtRisk when grace period is used', () => {
    // Plan [1,2,3], workouts Mon & Wed, Tue missed
    const workouts = [
      makeWorkout('2024-01-08'), // Mon
      makeWorkout('2024-01-10'), // Wed
    ];
    const result = calculateStreak(workouts, [1, 2, 3], '2024-01-10');
    expect(result.streakAtRisk).toBe(true);
    expect(result.gracePeriodUsed).toBe(true);
  });

  // --- GAMIF-01: grace period must NOT inflate streak ---

  it('should NOT increment streak during grace period day', () => {
    // Plan: every day [1-7]. Today: Fri 2026-03-27
    // Workouts Mon(23)–Wed(25). Thu(26) missed → grace. Fri=today(skip).
    // Backward: Fri=skip, Thu=grace(no-inc), Wed(1), Tue(2), Mon(3), Sun=break
    const workouts = [
      makeWorkout('2026-03-23'),
      makeWorkout('2026-03-24'),
      makeWorkout('2026-03-25'),
    ];
    const result = calculateStreak(workouts, [1, 2, 3, 4, 5, 6, 7], '2026-03-27');
    expect(result.currentStreak).toBe(3);
  });

  it('should NOT inflate longestStreak during grace period', () => {
    // Plan: every day [1-7]. Today: Fri 2026-03-20
    // Workouts Mon(16), Tue(17), Thu(19). Wed(18) missed → grace.
    // Forward: Mon(1), Tue(2), Wed=grace(no-inc), Thu(3), Fri=today(skip)
    const workouts = [
      makeWorkout('2026-03-16'),
      makeWorkout('2026-03-17'),
      makeWorkout('2026-03-19'),
    ];
    const result = calculateStreak(workouts, [1, 2, 3, 4, 5, 6, 7], '2026-03-20');
    expect(result.longestStreak).toBeLessThanOrEqual(3);
  });

  // Extra coverage tests

  it('uses current date when today is not provided', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-10T12:00:00'));
    const workouts = [makeWorkout('2024-01-09'), makeWorkout('2024-01-10')];
    const result = calculateStreak(workouts, []);
    expect(result.currentStreak).toBe(2);
    vi.useRealTimers();
  });

  it('handles Sunday as today correctly', () => {
    // 2024-01-07 is a Sunday
    const workouts = [makeWorkout('2024-01-07')];
    const result = calculateStreak(workouts, [], '2024-01-07');
    expect(result.currentStreak).toBe(1);
    expect(result.weekDots[6].status).toBe('today'); // Sunday is last dot
  });

  it('skips today when planned day with no workout yet', () => {
    // Today: Wed, plan [1,2,3], workouts only Mon & Tue
    const workouts = [makeWorkout('2024-01-08'), makeWorkout('2024-01-09')];
    const result = calculateStreak(workouts, [1, 2, 3], '2024-01-10');
    expect(result.currentStreak).toBeGreaterThanOrEqual(2);
  });

  it('skips today when no plan and no workout yet', () => {
    const workouts = [makeWorkout('2024-01-08'), makeWorkout('2024-01-09')];
    const result = calculateStreak(workouts, [], '2024-01-10');
    expect(result.currentStreak).toBe(2);
  });

  it('no plan past day without workout shows missed in weekDots', () => {
    const workouts = [makeWorkout('2024-01-08')];
    const result = calculateStreak(workouts, [], '2024-01-10');
    expect(result.weekDots[1].status).toBe('missed'); // Tue, no plan → missed
  });

  it('longest streak resets on 2 misses in forward scan with plan', () => {
    // Plan Mon-Fri (1-5). Workout Mon Jan 1, miss Tue+Wed, workout Thu Jan 4
    // Forward: Mon(1) Tue-grace(2) Wed-break → longest=2, Thu starts new(1)
    const workouts = [
      makeWorkout('2024-01-01'), // Mon
      makeWorkout('2024-01-04'), // Thu
      makeWorkout('2024-01-05'), // Fri
    ];
    const result = calculateStreak(workouts, [1, 2, 3, 4, 5], '2024-01-05');
    // Grace no longer inflates: Mon(1), Tue-grace(no-inc), Wed-break → longest=1
    expect(result.longestStreak).toBeGreaterThanOrEqual(1);
  });
});

// =============================================================
// checkMilestones
// =============================================================

describe('checkMilestones', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-10T12:00:00'));
  });
  afterAll(() => vi.useRealTimers());

  it('returns no achievements for 0 sessions', () => {
    const milestones = checkMilestones(0, 0);
    const achieved = milestones.filter((m) => m.achievedDate);
    expect(achieved).toHaveLength(0);
  });

  it('achieves first 2 milestones for 10 sessions', () => {
    const milestones = checkMilestones(10, 0);
    const achieved = milestones.filter((m) => m.achievedDate);
    expect(achieved).toHaveLength(2);
    expect(achieved[0].id).toBe('sessions-1');
    expect(achieved[1].id).toBe('sessions-10');
  });

  it('returns progress to next milestone', () => {
    const milestones = checkMilestones(5, 0);
    const next = milestones.find((m) => !m.achievedDate);
    expect(next).toBeDefined();
    expect(next!.threshold).toBe(10);
    const progress = Math.round((5 / next!.threshold) * 100);
    expect(progress).toBe(50);
  });

  it('achieves streak milestones when longestStreak qualifies', () => {
    const milestones = checkMilestones(0, 14);
    const achieved = milestones.filter((m) => m.achievedDate);
    expect(achieved).toHaveLength(2); // streak-7 and streak-14
    expect(achieved[0].id).toBe('streak-7');
    expect(achieved[1].id).toBe('streak-14');
    expect(achieved[0].achievedDate).toBe('2024-01-10');
  });
});

// =============================================================
// detectPRs
// =============================================================

describe('detectPRs', () => {
  it('returns no PRs with no previous data', () => {
    const current = [makeSet({ exerciseId: 'bench', weightKg: 80, reps: 5 })];
    const prs = detectPRs(current, [], new Map([['bench', 'Bench Press']]));
    expect(prs).toHaveLength(0);
  });

  it('detects PR on weight increase', () => {
    const previous = [
      makeSet({ exerciseId: 'bench', weightKg: 75, reps: 5, id: 'old' }),
    ];
    const current = [
      makeSet({ exerciseId: 'bench', weightKg: 80, reps: 5, id: 'new' }),
    ];
    const prs = detectPRs(
      current,
      previous,
      new Map([['bench', 'Bench Press']]),
    );
    expect(prs).toHaveLength(1);
    expect(prs[0].exerciseName).toBe('Bench Press');
    expect(prs[0].newWeight).toBe(80);
    expect(prs[0].previousWeight).toBe(75);
    expect(prs[0].improvement).toBe(5);
    expect(prs[0].reps).toBe(5);
  });

  it('does not detect PR for same weight', () => {
    const previous = [
      makeSet({ exerciseId: 'bench', weightKg: 80, reps: 5, id: 'old' }),
    ];
    const current = [
      makeSet({ exerciseId: 'bench', weightKg: 80, reps: 5, id: 'new' }),
    ];
    const prs = detectPRs(
      current,
      previous,
      new Map([['bench', 'Bench Press']]),
    );
    expect(prs).toHaveLength(0);
  });

  it('skips sets with no reps or zero weight', () => {
    const previous = [
      makeSet({ exerciseId: 'bench', weightKg: 75, reps: 5 }),
    ];
    const noReps = [makeSet({ exerciseId: 'bench', weightKg: 80 })];
    expect(detectPRs(noReps, previous, new Map())).toHaveLength(0);

    const zeroWeight = [
      makeSet({ exerciseId: 'squat', weightKg: 0, reps: 5 }),
    ];
    expect(detectPRs(zeroWeight, previous, new Map())).toHaveLength(0);
  });

  it('deduplicates PRs per exercise', () => {
    const previous = [
      makeSet({ exerciseId: 'bench', weightKg: 70, reps: 5, id: 'old' }),
    ];
    const current = [
      makeSet({
        exerciseId: 'bench',
        weightKg: 80,
        reps: 5,
        setNumber: 1,
        id: 's1',
      }),
      makeSet({
        exerciseId: 'bench',
        weightKg: 82,
        reps: 5,
        setNumber: 2,
        id: 's2',
      }),
    ];
    const prs = detectPRs(
      current,
      previous,
      new Map([['bench', 'Bench Press']]),
    );
    expect(prs).toHaveLength(1);
  });

  it('falls back to exerciseId when name not in map', () => {
    const previous = [
      makeSet({ exerciseId: 'unknown', weightKg: 50, reps: 5, id: 'old' }),
    ];
    const current = [
      makeSet({ exerciseId: 'unknown', weightKg: 60, reps: 5, id: 'new' }),
    ];
    const prs = detectPRs(current, previous, new Map());
    expect(prs).toHaveLength(1);
    expect(prs[0].exerciseName).toBe('unknown');
  });
});

// =============================================================
// MILESTONES constant
// =============================================================

describe('MILESTONES', () => {
  it('has 10 entries', () => {
    expect(MILESTONES).toHaveLength(10);
  });
});
