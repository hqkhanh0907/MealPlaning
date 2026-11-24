import { defaultTrainingRange, normalizeTrainingPrescription } from './fitness-prescription';
import { workoutSetIssue, type WorkoutSetInput } from './fitness-workout-set';

describe('Training prescriptions', () => {
  it('rounds plan targets and keeps the upper bound at least as high as the lower bound', () => {
    expect(
      normalizeTrainingPrescription({ sets: 14, repsMin: 14.4, repsMax: 6, restSeconds: 2 }),
    ).toEqual({
      sets: 10,
      repsMin: 14,
      repsMax: 14,
      restSeconds: 30,
    });
  });

  it('uses timed ranges when replacing a repetition exercise with a plank', () => {
    expect(defaultTrainingRange('ex_back_squat')).toEqual({ repsMin: 8, repsMax: 12 });
    expect(defaultTrainingRange('ex_plank')).toEqual({ repsMin: 30, repsMax: 45 });
  });
});

describe('Workout set measurements', () => {
  const set: WorkoutSetInput = {
    weightKg: 500,
    reps: 100,
    restSeconds: 600,
    effort: null,
    notes: null,
  };

  it('accepts the recorded lifting limits and rejects a second unit on the same set', () => {
    expect(workoutSetIssue('ex_back_squat', set)).toBeNull();
    expect(workoutSetIssue('ex_back_squat', { ...set, durationSeconds: 10 })).toBe('reps');
    expect(workoutSetIssue('ex_back_squat', { ...set, weightKg: 500.01 })).toBe('weight');
    expect(workoutSetIssue('ex_back_squat', { ...set, restSeconds: -1 })).toBe('rest');
  });

  it('accepts timed holds up to a day and requires zero repetitions', () => {
    const timed = { ...set, weightKg: 0, reps: 0, durationSeconds: 86_400 };
    expect(workoutSetIssue('ex_plank', timed)).toBeNull();
    expect(workoutSetIssue('ex_plank', { ...timed, durationSeconds: 86_401 })).toBe('duration');
    expect(workoutSetIssue('ex_plank', { ...timed, reps: 1 })).toBe('duration');
  });
});
