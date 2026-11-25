import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../services/database/database';
import { workoutSetIssue, type WorkoutSetInput } from '../models/fitness-workout-set';
import { localIsoDate, mondayOfWeek, shiftIsoDate } from '../utils/local-date';
import { muscleLabels } from '../models/fitness.types';
import type {
  FitnessProgressSummary,
  MuscleGroup,
  StrengthPoint,
  WeeklyVolumePoint,
  WorkoutExerciseDetail,
  WorkoutSessionDetail,
  WorkoutSet,
} from '../models/fitness.types';

export type { WorkoutSetInput } from '../models/fitness-workout-set';

const LOGGED_REPETITION_SET =
  "ws.status = 'logged' AND ws.duration_seconds IS NULL AND ws.legacy_unit_unknown = 0";
const TOTAL_REPETITION_VOLUME = 'COALESCE(SUM(ws.weight_kg * ws.reps), 0)';

const SESSION_PROJECTION = `
  SELECT id, date, training_plan_day_id, training_day_name, mode, total_volume,
         duration_minutes, started_at, completed_at, created_at
    FROM workout_session`;
const EXERCISE_PROJECTION = `
  SELECT we.id, we.workout_session_id, we.exercise_id,
         e.name AS exercise_name, e.name_vi AS exercise_name_vi, e.muscle_group, e.category, e.equipment,
         we.planned_sets, we.planned_min, we.planned_max, we.planned_rest, we.sort_order, we.total_volume
    FROM workout_exercise we
    INNER JOIN exercise e ON e.id = we.exercise_id`;

type SessionRow = Omit<WorkoutSessionDetail, 'exercises'>;

type SetToAppend =
  | ({ status: 'logged' } & WorkoutSetInput)
  | { status: 'skipped'; weightKg: number; reps: number };

@Injectable({ providedIn: 'root' })
export class WorkoutRepository {
  private readonly db = inject(Database);

  async getActiveSession(): Promise<WorkoutSessionDetail | null> {
    const row = await this.db.getOne<SessionRow>(
      `${SESSION_PROJECTION}
        WHERE status = 'active'
        ORDER BY started_at DESC
        LIMIT 1`,
    );
    return row ? this.hydrateSession(row) : null;
  }

  async startGuidedSession(
    trainingPlanDayId: string,
    now: Date = new Date(),
  ): Promise<WorkoutSessionDetail> {
    const active = await this.getActiveSession();
    if (active) return active;

    const day = await this.db.getOne<{ id: string; name: string }>(
      `SELECT id, name FROM training_plan_day WHERE id = ? AND is_rest_day = 0 LIMIT 1`,
      [trainingPlanDayId],
    );
    if (!day) {
      throw new Error('WorkoutRepository: guided session requires a non-rest training day.');
    }

    const sessionId = uuidv4();
    await this.db.withTransaction(async () => {
      await this.db.execute(
        `INSERT INTO workout_session (
         id, date, training_plan_day_id, training_day_name, mode, started_at
       ) VALUES (?, ?, ?, ?, 'guided', ?)`,
        [sessionId, localIsoDate(now), trainingPlanDayId, day.name, now.toISOString()],
      );

      await this.db.execute(
        `INSERT INTO workout_exercise
          (id, workout_session_id, exercise_id, sort_order, planned_sets, planned_min, planned_max, planned_rest)
          SELECT ? || ':' || id, ?, exercise_id, sort_order, sets, reps_min, reps_max, rest_seconds
          FROM planned_exercise WHERE training_plan_day_id = ?`,
        [sessionId, sessionId, trainingPlanDayId],
      );
    });

    const created = await this.getSession(sessionId);
    if (!created) {
      throw new Error('WorkoutRepository: failed to create guided session.');
    }
    return created;
  }

  async startFreeSession(now: Date = new Date()): Promise<WorkoutSessionDetail> {
    const active = await this.getActiveSession();
    if (active) return active;

    const sessionId = uuidv4();
    await this.db.execute(
      `INSERT INTO workout_session (
         id, date, training_plan_day_id, training_day_name, mode, started_at
       ) VALUES (?, ?, NULL, 'Tập tự do', 'free', ?)`,
      [sessionId, localIsoDate(now), now.toISOString()],
    );

    const created = await this.getSession(sessionId);
    if (!created) {
      throw new Error('WorkoutRepository: failed to create free session.');
    }
    return created;
  }

  async addExerciseToSession(
    sessionId: string,
    exerciseId: string,
    sortOrder?: number,
  ): Promise<WorkoutExerciseDetail> {
    const existing = await this.db.getOne<{ id: string }>(
      `SELECT id FROM workout_exercise
        WHERE workout_session_id = ? AND exercise_id = ?
        LIMIT 1`,
      [sessionId, exerciseId],
    );
    if (existing) {
      const hydrated = await this.getWorkoutExercise(existing.id);
      if (!hydrated) {
        throw new Error('WorkoutRepository: failed to hydrate existing workout exercise.');
      }
      return hydrated;
    }

    const nextSort =
      sortOrder ??
      (
        await this.db.getOne<{ next_sort: number }>(
          `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort
             FROM workout_exercise
            WHERE workout_session_id = ?`,
          [sessionId],
        )
      )?.next_sort ??
      0;
    const id = uuidv4();
    await this.db.execute(
      `INSERT INTO workout_exercise (
         id, workout_session_id, exercise_id, sort_order
       ) VALUES (?, ?, ?, ?)`,
      [id, sessionId, exerciseId, nextSort],
    );

    const created = await this.getWorkoutExercise(id);
    if (!created) {
      throw new Error('WorkoutRepository: failed to add exercise to workout.');
    }
    return created;
  }

  async addSet(
    workoutExerciseId: string,
    input: WorkoutSetInput,
  ): Promise<{ set: WorkoutSet; session: WorkoutSessionDetail }> {
    return this.appendSet(workoutExerciseId, { ...input, status: 'logged' });
  }

  async skipSet(
    workoutExerciseId: string,
    plannedWeightKg = 0,
    plannedReps = 0,
  ): Promise<{ set: WorkoutSet; session: WorkoutSessionDetail }> {
    return this.appendSet(workoutExerciseId, {
      status: 'skipped',
      weightKg: plannedWeightKg,
      reps: plannedReps,
    });
  }

  private async appendSet(
    workoutExerciseId: string,
    entry: SetToAppend,
  ): Promise<{ set: WorkoutSet; session: WorkoutSessionDetail }> {
    const id = uuidv4();
    const sessionId = await this.db.withTransaction(async () => {
      const exercise = await this.db.getOne<{ workout_session_id: string; exercise_id: string }>(
        `SELECT workout_session_id, exercise_id FROM workout_exercise WHERE id = ?`,
        [workoutExerciseId],
      );
      if (!exercise)
        throw new Error(`WorkoutRepository: workout exercise '${workoutExerciseId}' not found.`);
      const logged = entry.status === 'logged' ? entry : null;
      if (logged) validateSetInput(logged, exercise.exercise_id);
      await this.db.execute(
        `INSERT INTO workout_set (
           id, workout_exercise_id, set_number, weight_kg, reps, rest_seconds, effort, notes,
           status, completed_at, duration_seconds
         )
         SELECT ?, ?, COALESCE(MAX(set_number), 0) + 1, ?, ?, ?, ?, ?, ?, ?, ?
           FROM workout_set WHERE workout_exercise_id = ?`,
        [
          id,
          workoutExerciseId,
          entry.weightKg,
          entry.reps,
          logged?.restSeconds ?? null,
          logged?.effort ?? null,
          logged?.notes ?? null,
          entry.status,
          logged ? new Date().toISOString() : null,
          logged?.durationSeconds ?? null,
          workoutExerciseId,
        ],
      );
      await this.syncTotals(exercise.workout_session_id);
      return exercise.workout_session_id;
    });
    const session = await this.getSession(sessionId);
    const set = session?.exercises
      .find((exercise) => exercise.id === workoutExerciseId)
      ?.sets.find((item) => item.id === id);
    if (!session || !set)
      throw new Error('WorkoutRepository: failed to read the recorded workout set.');
    return { set, session };
  }

  async completeSession(sessionId: string, now: Date = new Date()): Promise<void> {
    await this.db.withTransaction(async () => {
      const session = await this.db.getOne<{ started_at: string }>(
        `SELECT started_at FROM workout_session WHERE id = ? AND status = 'active'`,
        [sessionId],
      );
      if (!session) {
        throw new Error(`WorkoutRepository: active session '${sessionId}' not found.`);
      }
      const loggedSet = await this.db.getOne<{ id: string }>(
        `SELECT ws.id FROM workout_set ws
          INNER JOIN workout_exercise we ON we.id = ws.workout_exercise_id
          WHERE we.workout_session_id = ? AND ws.status = 'logged' LIMIT 1`,
        [sessionId],
      );
      if (!loggedSet) {
        throw new Error('WorkoutRepository: at least one logged set is required.');
      }
      const durationMinutes = Math.max(
        1,
        Math.round((now.getTime() - new Date(session.started_at).getTime()) / 60_000),
      );
      await this.syncTotals(sessionId);
      await this.db.execute(
        `UPDATE workout_session
            SET completed_at = ?, duration_minutes = ?, status = 'completed'
          WHERE id = ?`,
        [now.toISOString(), durationMinutes, sessionId],
      );
    });
  }

  /**
   * Delete a single logged set + re-number remaining sets in that exercise + sync session totals.
   * No-op if set doesn't exist (idempotent — UI may double-tap).
   */
  async deleteSet(setId: string): Promise<void> {
    const row = await this.db.getOne<{ workout_exercise_id: string; workout_session_id: string }>(
      `SELECT ws.workout_exercise_id, we.workout_session_id
         FROM workout_set ws
         JOIN workout_exercise we ON we.id = ws.workout_exercise_id
        WHERE ws.id = ?`,
      [setId],
    );
    if (!row) return;

    await this.db.withTransaction(async () => {
      await this.db.execute(`DELETE FROM workout_set WHERE id = ?`, [setId]);
      // Re-number remaining sets to keep set_number contiguous (1..N).
      const remaining = await this.db.query<{ id: string }>(
        `SELECT id FROM workout_set
          WHERE workout_exercise_id = ?
          ORDER BY set_number ASC, created_at ASC`,
        [row.workout_exercise_id],
      );
      for (let i = 0; i < remaining.length; i++) {
        await this.db.execute(`UPDATE workout_set SET set_number = ? WHERE id = ?`, [
          i + 1,
          remaining[i].id,
        ]);
      }
      await this.syncTotals(row.workout_session_id);
    });
  }

  /**
   * Update a logged set with full field round-trip (weight, reps, rest, effort, notes).
   * F-004 (Turn 9): widened from (setId, weightKg, reps) to (setId, input). Wrapped in
   * a transaction with syncTotals so total_volume cannot diverge from the row.
   */
  async updateSet(setId: string, input: WorkoutSetInput): Promise<void> {
    const row = await this.db.getOne<{ workout_session_id: string; exercise_id: string }>(
      `SELECT we.workout_session_id, we.exercise_id
         FROM workout_set ws
         INNER JOIN workout_exercise we ON we.id = ws.workout_exercise_id
        WHERE ws.id = ?`,
      [setId],
    );
    if (!row) {
      throw new Error(`WorkoutRepository: set '${setId}' not found.`);
    }
    validateSetInput(input, row.exercise_id);
    await this.db.withTransaction(async () => {
      await this.db.execute(
        `UPDATE workout_set
            SET weight_kg = ?, reps = ?, rest_seconds = ?, effort = ?, notes = ?, updated_at = ?,
                duration_seconds = ?, legacy_unit_unknown = 0
          WHERE id = ?`,
        [
          input.weightKg,
          input.reps,
          input.restSeconds,
          input.effort,
          input.notes,
          new Date().toISOString(),
          input.durationSeconds ?? null,
          setId,
        ],
      );
      await this.syncTotals(row.workout_session_id);
    });
  }

  /**
   * Remove an exercise (and all its logged sets, via FK ON DELETE CASCADE) from an active session.
   * Re-syncs session totals. Idempotent on missing exercise id.
   */
  async removeExerciseFromSession(workoutExerciseId: string): Promise<void> {
    const row = await this.db.getOne<{ workout_session_id: string }>(
      `SELECT workout_session_id FROM workout_exercise WHERE id = ?`,
      [workoutExerciseId],
    );
    if (!row) return;

    await this.db.withTransaction(async () => {
      await this.db.execute(`DELETE FROM workout_set WHERE workout_exercise_id = ?`, [
        workoutExerciseId,
      ]);
      await this.db.execute(`DELETE FROM workout_exercise WHERE id = ?`, [workoutExerciseId]);
      await this.syncTotals(row.workout_session_id);
    });
  }

  /**
   * Soft-cancel a session: flip status to 'cancelled' and record cancelled_at.
   *
   * Child rows (workout_exercise, workout_set) are preserved so {@link undoCancel}
   * can restore the session 1:1. Hard delete is reserved for explicit user
   * "Xóa buổi tập" actions (not implemented yet).
   *
   * Errors out for already-completed sessions — those need a separate
   * delete-completed-workout path (out of scope for cancel).
   */
  async cancelSession(sessionId: string, now: Date = new Date()): Promise<void> {
    const session = await this.db.getOne<{ status: string }>(
      `SELECT status FROM workout_session WHERE id = ?`,
      [sessionId],
    );
    if (!session) return;
    if (session.status === 'completed') {
      throw new Error(
        'WorkoutRepository: session already completed; cancel is only valid for in-progress sessions.',
      );
    }
    if (session.status === 'cancelled') return; // idempotent

    await this.db.execute(
      `UPDATE workout_session
          SET status = 'cancelled', cancelled_at = ?
        WHERE id = ?`,
      [now.toISOString(), sessionId],
    );
  }

  /**
   * Undo a soft-cancel within the active session window. Flips status back to
   * 'active' and clears cancelled_at. No-op if the session is missing or
   * already in another terminal state.
   *
   * Safety: refuses to undo if there is already a different active session
   * (would violate the single-active-session invariant enforced by
   * {@link getActiveSession}). Caller must clean that up first.
   */
  async undoCancel(sessionId: string): Promise<void> {
    const session = await this.db.getOne<{ status: string }>(
      `SELECT status FROM workout_session WHERE id = ?`,
      [sessionId],
    );
    if (!session) return;
    if (session.status !== 'cancelled') return;

    const existingActive = await this.db.getOne<{ id: string }>(
      `SELECT id FROM workout_session WHERE status = 'active' AND id <> ? LIMIT 1`,
      [sessionId],
    );
    if (existingActive) {
      throw new Error('WorkoutRepository: cannot undo cancel — another active session exists.');
    }

    await this.db.execute(
      `UPDATE workout_session
          SET status = 'active', cancelled_at = NULL
        WHERE id = ?`,
      [sessionId],
    );
  }

  async getSession(sessionId: string): Promise<WorkoutSessionDetail | null> {
    const row = await this.db.getOne<SessionRow>(
      `${SESSION_PROJECTION}
        WHERE id = ?`,
      [sessionId],
    );
    return row ? this.hydrateSession(row) : null;
  }

  async recentSessions(limit = 5): Promise<WorkoutSessionDetail[]> {
    const rows = await this.db.query<SessionRow>(
      `${SESSION_PROJECTION}
        WHERE completed_at IS NOT NULL
        ORDER BY date DESC, completed_at DESC
        LIMIT ?`,
      [Math.max(1, Math.min(limit, 20))],
    );

    const sessions: WorkoutSessionDetail[] = [];
    for (const row of rows) {
      sessions.push(await this.hydrateSession(row));
    }
    return sessions;
  }

  async progressSummary(now: Date = new Date()): Promise<FitnessProgressSummary> {
    const currentWeekStart = localIsoDate(mondayOfWeek(now));
    const previousWeekStart = shiftIsoDate(currentWeekStart, -7);
    const currentWeekEnd = shiftIsoDate(currentWeekStart, 6);
    const previousWeekEnd = shiftIsoDate(previousWeekStart, 6);
    const strengthStart = shiftIsoDate(currentWeekStart, -77);
    const weightStart = shiftIsoDate(localIsoDate(now), -6);

    const [currentWeekVolume, previousWeekVolume, volumeByMuscle, strength, streak, weight] =
      await Promise.all([
        this.volumeBetween(currentWeekStart, currentWeekEnd),
        this.volumeBetween(previousWeekStart, previousWeekEnd),
        this.volumeByMuscle(currentWeekStart, currentWeekEnd),
        this.strengthSummary(strengthStart, currentWeekEnd),
        this.workoutStreakWeeks(currentWeekStart),
        this.weeklyAverageWeight(weightStart, localIsoDate(now)),
      ]);

    return {
      currentWeekVolume,
      previousWeekVolume,
      workoutStreakWeeks: streak,
      weeklyAvgWeightKg: weight.value,
      weightSource: weight.source,
      volumeByMuscle,
      strength,
    };
  }

  private async hydrateSession(row: SessionRow): Promise<WorkoutSessionDetail> {
    const exercises = await this.db.query<Omit<WorkoutExerciseDetail, 'sets'>>(
      `${EXERCISE_PROJECTION}
       WHERE we.workout_session_id = ?
       ORDER BY we.sort_order ASC`,
      [row.id],
    );

    const hydrated: WorkoutExerciseDetail[] = [];
    for (const exercise of exercises) {
      hydrated.push({ ...exercise, sets: await this.getSets(exercise.id) });
    }
    return { ...row, exercises: hydrated };
  }

  private async getWorkoutExercise(id: string): Promise<WorkoutExerciseDetail | null> {
    const row = await this.db.getOne<Omit<WorkoutExerciseDetail, 'sets'>>(
      `${EXERCISE_PROJECTION}
       WHERE we.id = ?`,
      [id],
    );
    return row ? { ...row, sets: await this.getSets(row.id) } : null;
  }

  private async getSets(workoutExerciseId: string): Promise<WorkoutSet[]> {
    return this.db.query<WorkoutSet>(
      `SELECT id, workout_exercise_id, set_number, weight_kg, reps, rest_seconds,
              duration_seconds, legacy_unit_unknown, effort, notes, status, completed_at, created_at
         FROM workout_set
        WHERE workout_exercise_id = ?
        ORDER BY set_number ASC`,
      [workoutExerciseId],
    );
  }

  private async syncTotals(sessionId: string): Promise<void> {
    // Only 'logged' sets contribute to total_volume — skipped placeholders
    // must not inflate the session/exercise summary.
    await this.db.execute(
      `UPDATE workout_exercise
          SET total_volume = (
            SELECT ${TOTAL_REPETITION_VOLUME}
              FROM workout_set ws
             WHERE ws.workout_exercise_id = workout_exercise.id
               AND ${LOGGED_REPETITION_SET}
          )
        WHERE workout_session_id = ?`,
      [sessionId],
    );

    await this.db.execute(
      `UPDATE workout_session
          SET total_volume = (
            SELECT COALESCE(SUM(total_volume), 0)
              FROM workout_exercise
             WHERE workout_exercise.workout_session_id = workout_session.id
          )
        WHERE id = ?`,
      [sessionId],
    );
  }

  private async volumeBetween(start: string, end: string): Promise<number> {
    const row = await this.db.getOne<{ volume: number | null }>(
      `SELECT ${TOTAL_REPETITION_VOLUME} AS volume
         FROM workout_session session
         INNER JOIN workout_exercise we ON we.workout_session_id = session.id
         INNER JOIN workout_set ws ON ws.workout_exercise_id = we.id
        WHERE session.completed_at IS NOT NULL
          AND ${LOGGED_REPETITION_SET}
          AND session.date BETWEEN ? AND ?`,
      [start, end],
    );
    return row?.volume ?? 0;
  }

  private async volumeByMuscle(start: string, end: string): Promise<WeeklyVolumePoint[]> {
    const rows = await this.db.query<{ muscle_group: MuscleGroup; volume: number | null }>(
      `SELECT e.muscle_group, ${TOTAL_REPETITION_VOLUME} AS volume
         FROM workout_session session
         INNER JOIN workout_exercise we ON we.workout_session_id = session.id
         INNER JOIN workout_set ws ON ws.workout_exercise_id = we.id
         INNER JOIN exercise e ON e.id = we.exercise_id
        WHERE session.completed_at IS NOT NULL
          AND ${LOGGED_REPETITION_SET}
          AND session.date BETWEEN ? AND ?
        GROUP BY e.muscle_group
        ORDER BY volume DESC
        LIMIT 6`,
      [start, end],
    );
    return rows.map((row) => ({
      muscle_group: row.muscle_group,
      label: muscleLabels[row.muscle_group],
      volume: row.volume ?? 0,
    }));
  }

  private async strengthSummary(start: string, end: string): Promise<StrengthPoint[]> {
    const rows = await this.db.query<StrengthPoint>(
      `SELECT
         e.id AS exercise_id,
         e.name AS exercise_name,
         e.name_vi AS exercise_name_vi,
         MAX(CASE WHEN ws.reps = 1 THEN ws.weight_kg
             ELSE ws.weight_kg * (1 + ws.reps / 30.0) END) AS estimated_1rm
       FROM workout_session session
       INNER JOIN workout_exercise we ON we.workout_session_id = session.id
       INNER JOIN workout_set ws ON ws.workout_exercise_id = we.id
       INNER JOIN exercise e ON e.id = we.exercise_id
       WHERE session.completed_at IS NOT NULL
         AND ${LOGGED_REPETITION_SET}
         AND session.date BETWEEN ? AND ?
         AND e.id IN ('bench-press', 'squat', 'deadlift')
         AND ws.weight_kg > 0 AND ws.effort = 'maxed'
         AND ws.reps BETWEEN 1 AND 10
       GROUP BY e.id
       ORDER BY estimated_1rm DESC
       LIMIT 5`,
      [start, end],
    );
    return rows.map((row) => ({
      ...row,
      estimated_1rm: Math.round(row.estimated_1rm),
    }));
  }

  private async workoutStreakWeeks(currentWeekStart: string): Promise<number> {
    const weeks = Array.from({ length: 12 }, (_, i) => shiftIsoDate(currentWeekStart, i * -7));
    const placeholders = weeks.map(() => '?').join(', ');
    const rows = await this.db.query<{ week_start: string; count: number }>(
      `SELECT date(ws.date, '-' || ((strftime('%w', ws.date) + 6) % 7) || ' days') AS week_start,
              COUNT(*) AS count
         FROM workout_session ws
        WHERE ws.completed_at IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM workout_exercise we
            INNER JOIN workout_set actual ON actual.workout_exercise_id = we.id
            WHERE we.workout_session_id = ws.id AND actual.status = 'logged'
          )
          AND date(ws.date, '-' || ((strftime('%w', ws.date) + 6) % 7) || ' days')
              IN (${placeholders})
        GROUP BY week_start`,
      weeks,
    );
    const byWeek = new Map(rows.map((row) => [row.week_start, row.count]));
    let streak = 0;
    for (const week of weeks) {
      if ((byWeek.get(week) ?? 0) <= 0) break;
      streak += 1;
    }
    return streak;
  }

  private async weeklyAverageWeight(
    start: string,
    end: string,
  ): Promise<{ value: number | null; source: 'weight_log' | 'profile' | null }> {
    const row = await this.db.getOne<{ avg_weight: number | null }>(
      `SELECT AVG(weight_kg) AS avg_weight
         FROM weight_log
        WHERE date BETWEEN ? AND ?`,
      [start, end],
    );
    if (row?.avg_weight != null) {
      return { value: roundOneDecimal(row.avg_weight), source: 'weight_log' };
    }

    const profile = await this.db.getOne<{ weight_kg: number }>(
      `SELECT weight_kg FROM user_profile LIMIT 1`,
    );
    return {
      value: profile ? roundOneDecimal(profile.weight_kg) : null,
      source: profile ? 'profile' : null,
    };
  }
}

function validateSetInput(input: WorkoutSetInput, exerciseId: string): void {
  const issue = workoutSetIssue(exerciseId, input);
  if (issue) {
    const messages = {
      weight: 'WorkoutRepository: weight must be between 0 and 500kg.',
      duration: 'Nhập thời gian tập từ 1 đến 86.400 giây.',
      reps: 'WorkoutRepository: reps must be an integer between 1 and 100.',
      rest: 'WorkoutRepository: rest_seconds must be between 0 and 600.',
    };
    throw new Error(messages[issue]);
  }
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
