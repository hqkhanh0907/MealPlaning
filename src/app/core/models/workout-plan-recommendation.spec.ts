import { inventoryChoices } from './exercise-discovery';
import {
  recommendWorkout,
  workoutDraftIssue,
  type WorkoutPreferences,
} from './workout-plan-recommendation';

describe('workout plan recommendation', () => {
  const home: WorkoutPreferences = {
    age: 28,
    weekdays: [2, 5],
    minutes: 35,
    equipment: ['hex-dumbbell'],
    avoid: [],
    frequency: null,
    familiarVolume: false,
  };

  it('uses the two-day preset intact only when its reviewed equipment and duration fit', () => {
    const result = recommendWorkout(home);
    expect(result.plans.map((p) => p.sourceId)).toEqual(['plan_two_dumbbells_floor']);
    expect(result.plans[0].adjusted).toBeFalse();
    expect(result.plans[0].maxMinutes).toBe(30);
    expect(recommendWorkout({ ...home, equipment: ['dumbbell'] }).plans).toEqual([]);
  });

  it('previews the same exercises on Wednesday and Saturday without changing the seed', () => {
    const shifted = recommendWorkout({ ...home, weekdays: [3, 6] }).plans[0];
    expect(shifted.adjusted).toBeTrue();
    expect(shifted.days.filter((d) => !d.isRestDay).map((d) => d.dayOfWeek)).toEqual([3, 6]);
    expect(
      recommendWorkout(home)
        .plans[0].days.filter((d) => !d.isRestDay)
        .map((d) => d.dayOfWeek),
    ).toEqual([2, 5]);
  });

  it('offers a separate short session and an explicitly shortened weekly plan', () => {
    const result = recommendWorkout({ ...home, minutes: 25 });
    expect(result.plans).toEqual([]);
    expect(result.shortPlans[0].adjusted).toBeTrue();
    expect(result.shortPlans[0].maxMinutes).toBeLessThanOrEqual(25);
    expect(result.session.length).toBeGreaterThan(0);
    expect(result.sessionMinutes).toBeLessThanOrEqual(25);
  });

  it('treats an empty inventory as confirmed and filters exercises marked to avoid', () => {
    const body = recommendWorkout({ ...home, equipment: [], avoid: ['push-h'], minutes: 25 });
    expect(body.status).toBe('ready');
    expect(body.session.map((e) => e.exerciseId)).not.toContain('push-up');
    expect(body.session.map((e) => e.exerciseId)).not.toContain('renegade-row');
    expect(body.session.length).toBeGreaterThan(0);
    expect(recommendWorkout({ ...home, equipment: null }).status).toBe('incomplete');
    expect(recommendWorkout({ ...home, avoid: null }).status).toBe('incomplete');
  });

  it('gives no automatic choice for minors, unknown age or unclear restriction', () => {
    for (const p of [
      { ...home, age: 17 },
      { ...home, age: null },
      { ...home, avoid: 'unclear' as const },
    ]) {
      const r = recommendWorkout(p);
      expect(r.status).toBe('manual');
      expect(r.session).toEqual([]);
      expect(r.plans).toEqual([]);
    }
  });

  it('ranks exact frequency without hiding other feasible plans', () => {
    const r = recommendWorkout({
      ...home,
      equipment: inventoryChoices.map(([key]) => key),
      weekdays: [1, 2, 3, 4, 5, 6],
      minutes: 65,
      frequency: 4,
      familiarVolume: true,
    });
    expect(r.plans[0].sourceId).toBe('plan_upper_lower_4x');
    expect(r.plans.map((p) => p.sourceId)).toContain('plan_ppl_6x');
    expect(r.plans.length).toBe(4);
  });

  it('applies the same equipment, weekday, duration and motion constraints to external drafts', () => {
    const { days } = recommendWorkout(home).plans[0];
    expect(workoutDraftIssue(home, days)).toBeNull();
    for (const change of [
      { age: 17 },
      { age: null },
      { equipment: null },
      { equipment: ['dumbbell'] },
      { weekdays: [3, 6] },
      { minutes: 15 },
      { avoid: ['push-h'] },
      { frequency: 3 },
    ]) {
      expect(workoutDraftIssue({ ...home, ...change }, days)).not.toBeNull();
    }
  });
});
