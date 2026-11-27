import { TestBed } from '@angular/core/testing';
import type { WorkoutSessionDetail } from '../models/fitness.types';
import {
  createTestDatabase,
  teardownTestDatabase,
} from '../services/database/__test__/create-test-database';
import { Database } from '../services/database/database';
import { addCalendarDays } from '../utils/local-date';
import { WorkoutRepository } from './workout.repository';

describe('Recorded workout progress', () => {
  const monday = new Date(2026, 10, 23, 8);
  let db: Database;
  let workouts: WorkoutRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    TestBed.configureTestingModule({ providers: [{ provide: Database, useValue: db }] });
    workouts = TestBed.inject(WorkoutRepository);
    await db.execute(`INSERT INTO exercise (id,name,muscle_group,category,equipment,source)
      VALUES ('dumbbell-floor-press','Floor press','chest','compound','Dumbbell','db')`);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    teardownTestDatabase();
  });

  async function recordPress(
    date: Date,
    place: string | null,
    kg: number,
  ): Promise<WorkoutSessionDetail> {
    const session = await workouts.startComposedSession(
      [
        {
          exerciseId: 'dumbbell-floor-press',
          sets: 1,
          repsMin: 8,
          repsMax: 12,
          restSeconds: 90,
          notes: null,
        },
      ],
      place,
      date,
    );
    await workouts.addSet(session.exercises[0].id, {
      weightKg: kg,
      reps: 12,
      effort: 'easy',
      restSeconds: 90,
      notes: null,
    });
    await workouts.completeSession(session.id, date);
    return session;
  }

  it('suggests the nearest higher load previously logged at the same place and accepts an edit', async () => {
    await recordPress(addCalendarDays(monday, -3), 'home', 28);
    await recordPress(addCalendarDays(monday, -2), 'home', 24);
    await recordPress(addCalendarDays(monday, -1), 'gym', 22);
    const session = await recordPress(monday, 'home', 20);
    const summary = await workouts.completionSummary(session.id);
    expect(summary?.exercises[0].known_heavier_kg).toBe(24);
    await workouts.confirmNextLoad(session.exercises[0].id, 26);
    expect((await workouts.lastSets('home'))[0].next_weight_kg).toBe(26);
  });

  it('averages recorded weights inside the trailing seven calendar days', async () => {
    await db.execute(`INSERT INTO weight_log (id, date, weight_kg) VALUES
      ('before', '2026-11-16', 99), ('first', '2026-11-17', 70),
      ('middle', '2026-11-21', 67), ('today', '2026-11-23', 69), ('after', '2026-11-24', 96)`);
    const progress = await workouts.progressSummary(monday);
    expect(progress.weeklyAvgWeightKg).toBe(68.7);
    expect(progress.weightSource).toBe('weight_log');
  });

  it('caps thirteen consecutive recorded weeks at twelve and breaks the streak on a missing week', async () => {
    for (let weeksAgo = 12; weeksAgo >= 0; weeksAgo--) {
      await recordPress(addCalendarDays(monday, -7 * weeksAgo), null, 20);
    }
    expect((await workouts.progressSummary(monday)).workoutStreakWeeks).toBe(12);
    expect((await workouts.progressSummary(addCalendarDays(monday, 7))).workoutStreakWeeks).toBe(0);
  });
});
