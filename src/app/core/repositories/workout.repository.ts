import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../services/database/database';
import type {
  FitnessProgressSummary,
  MuscleGroup,
  StrengthPoint,
  WeeklyVolumePoint,
  WorkoutEffort,
  WorkoutExerciseDetail,
  WorkoutMode,
  WorkoutSessionDetail,
  WorkoutSet,
} from '../models/fitness.types';

export interface WorkoutSetInput {
  weightKg: number;
  reps: number;
  restSeconds: number;
  effort: WorkoutEffort | null;
  notes: string | null;
}

interface SessionRow {
  id: string;
  date: string;
  training_plan_day_id: string | null;
  training_day_name: string | null;
  mode: WorkoutMode;
  total_volume: number;
  duration_minutes: number | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Ngực',
  back: 'Lưng',
  shoulders: 'Vai',
  biceps: 'Tay trước',
  triceps: 'Tay sau',
  quads: 'Đùi trước',
  hamstrings: 'Đùi sau',
  glutes: 'Mông',
  calves: 'Bắp chân',
  abs: 'Core',
  forearms: 'Cẳng tay',
  full_body: 'Toàn thân',
};

@Injectable({ providedIn: 'root' })
export class WorkoutRepository {
  private readonly db = inject(Database);

  async getActiveSession(): Promise<WorkoutSessionDetail | null> {
    const row = await this.db.getOne<SessionRow>(
      `SELECT id, date, training_plan_day_id, training_day_name, mode, total_volume,
              duration_minutes, started_at, completed_at, created_at
         FROM workout_session
        WHERE completed_at IS NULL
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
    await this.db.execute(
      `INSERT INTO workout_session (
         id, date, training_plan_day_id, training_day_name, mode, started_at
       ) VALUES (?, ?, ?, ?, 'guided', ?)`,
      [sessionId, toIsoDate(now), trainingPlanDayId, day.name, now.toISOString()],
    );

    const planned = await this.db.query<{ exercise_id: string; sort_order: number }>(
      `SELECT exercise_id, sort_order
         FROM planned_exercise
        WHERE training_plan_day_id = ?
        ORDER BY sort_order ASC`,
      [trainingPlanDayId],
    );
    for (const item of planned) {
      await this.addExerciseToSession(sessionId, item.exercise_id, item.sort_order);
    }

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
       ) VALUES (?, ?, NULL, 'Free Workout', 'free', ?)`,
      [sessionId, toIsoDate(now), now.toISOString()],
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

  async addSet(workoutExerciseId: string, input: WorkoutSetInput): Promise<WorkoutSet> {
    validateSetInput(input);
    const row = await this.db.getOne<{ workout_session_id: string; set_number: number }>(
      `SELECT
         we.workout_session_id,
         COALESCE(MAX(ws.set_number), 0) + 1 AS set_number
       FROM workout_exercise we
       LEFT JOIN workout_set ws ON ws.workout_exercise_id = we.id
       WHERE we.id = ?
       GROUP BY we.id`,
      [workoutExerciseId],
    );
    if (!row) {
      throw new Error(`WorkoutRepository: workout exercise '${workoutExerciseId}' not found.`);
    }

    const id = uuidv4();
    await this.db.withTransaction(async () => {
      await this.db.execute(
        `INSERT INTO workout_set (
           id, workout_exercise_id, set_number, weight_kg, reps, rest_seconds, effort, notes
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          workoutExerciseId,
          row.set_number,
          input.weightKg,
          input.reps,
          input.restSeconds,
          input.effort,
          input.notes,
        ],
      );
      await this.syncTotals(row.workout_session_id);
    });

    const created = await this.db.getOne<WorkoutSet>(
      `SELECT id, workout_exercise_id, set_number, weight_kg, reps, rest_seconds,
              effort, notes, created_at
         FROM workout_set
        WHERE id = ?`,
      [id],
    );
    if (!created) {
      throw new Error('WorkoutRepository: failed to insert workout set.');
    }
    return created;
  }

  async completeSession(sessionId: string, now: Date = new Date()): Promise<void> {
    const session = await this.db.getOne<{ started_at: string }>(
      `SELECT started_at FROM workout_session WHERE id = ? AND completed_at IS NULL`,
      [sessionId],
    );
    if (!session) {
      throw new Error(`WorkoutRepository: active session '${sessionId}' not found.`);
    }

    const durationMinutes = Math.max(
      1,
      Math.round((now.getTime() - new Date(session.started_at).getTime()) / 60_000),
    );
    await this.db.withTransaction(async () => {
      await this.syncTotals(sessionId);
      await this.db.execute(
        `UPDATE workout_session
            SET completed_at = ?, duration_minutes = ?
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
   * Hard-cancel an in-progress session: deletes the session row and cascades to exercises + sets.
   * Use when user wants to abort/discard a workout (e.g. started by mistake). Throws if session is
   * already completed — that branch must use a separate "delete completed workout" path (not yet
   * implemented; out of scope for cancel).
   */
  async cancelSession(sessionId: string): Promise<void> {
    const session = await this.db.getOne<{ completed_at: string | null }>(
      `SELECT completed_at FROM workout_session WHERE id = ?`,
      [sessionId],
    );
    if (!session) return;
    if (session.completed_at !== null) {
      throw new Error(
        'WorkoutRepository: session already completed; cancel is only valid for in-progress sessions.',
      );
    }

    await this.db.withTransaction(async () => {
      await this.db.execute(
        `DELETE FROM workout_set
          WHERE workout_exercise_id IN (
            SELECT id FROM workout_exercise WHERE workout_session_id = ?
          )`,
        [sessionId],
      );
      await this.db.execute(`DELETE FROM workout_exercise WHERE workout_session_id = ?`, [
        sessionId,
      ]);
      await this.db.execute(`DELETE FROM workout_session WHERE id = ?`, [sessionId]);
    });
  }

  async getSession(sessionId: string): Promise<WorkoutSessionDetail | null> {
    const row = await this.db.getOne<SessionRow>(
      `SELECT id, date, training_plan_day_id, training_day_name, mode, total_volume,
              duration_minutes, started_at, completed_at, created_at
         FROM workout_session
        WHERE id = ?`,
      [sessionId],
    );
    return row ? this.hydrateSession(row) : null;
  }

  async recentSessions(limit = 5): Promise<WorkoutSessionDetail[]> {
    const rows = await this.db.query<SessionRow>(
      `SELECT id, date, training_plan_day_id, training_day_name, mode, total_volume,
              duration_minutes, started_at, completed_at, created_at
         FROM workout_session
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
    const currentWeekStart = startOfWeekIso(now);
    const previousWeekStart = shiftIsoDate(currentWeekStart, -7);
    const currentWeekEnd = shiftIsoDate(currentWeekStart, 6);
    const previousWeekEnd = shiftIsoDate(previousWeekStart, 6);
    const strengthStart = shiftIsoDate(currentWeekStart, -77);
    const weightStart = shiftIsoDate(toIsoDate(now), -6);

    const [currentWeekVolume, previousWeekVolume, volumeByMuscle, strength, streak, weight] =
      await Promise.all([
        this.volumeBetween(currentWeekStart, currentWeekEnd),
        this.volumeBetween(previousWeekStart, previousWeekEnd),
        this.volumeByMuscle(currentWeekStart, currentWeekEnd),
        this.strengthSummary(strengthStart, currentWeekEnd),
        this.workoutStreakWeeks(currentWeekStart),
        this.weeklyAverageWeight(weightStart, toIsoDate(now)),
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
      `SELECT
         we.id,
         we.workout_session_id,
         we.exercise_id,
         e.name AS exercise_name,
         e.name_vi AS exercise_name_vi,
         e.muscle_group,
         e.category,
         we.sort_order,
         we.total_volume
       FROM workout_exercise we
       INNER JOIN exercise e ON e.id = we.exercise_id
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
      `SELECT
         we.id,
         we.workout_session_id,
         we.exercise_id,
         e.name AS exercise_name,
         e.name_vi AS exercise_name_vi,
         e.muscle_group,
         e.category,
         we.sort_order,
         we.total_volume
       FROM workout_exercise we
       INNER JOIN exercise e ON e.id = we.exercise_id
       WHERE we.id = ?`,
      [id],
    );
    return row ? { ...row, sets: await this.getSets(row.id) } : null;
  }

  private async getSets(workoutExerciseId: string): Promise<WorkoutSet[]> {
    return this.db.query<WorkoutSet>(
      `SELECT id, workout_exercise_id, set_number, weight_kg, reps, rest_seconds,
              effort, notes, created_at
         FROM workout_set
        WHERE workout_exercise_id = ?
        ORDER BY set_number ASC`,
      [workoutExerciseId],
    );
  }

  private async syncTotals(sessionId: string): Promise<void> {
    await this.db.execute(
      `UPDATE workout_exercise
          SET total_volume = (
            SELECT COALESCE(SUM(weight_kg * reps), 0)
              FROM workout_set
             WHERE workout_set.workout_exercise_id = workout_exercise.id
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
      `SELECT COALESCE(SUM(ws.weight_kg * ws.reps), 0) AS volume
         FROM workout_session session
         INNER JOIN workout_exercise we ON we.workout_session_id = session.id
         INNER JOIN workout_set ws ON ws.workout_exercise_id = we.id
        WHERE session.completed_at IS NOT NULL
          AND session.date BETWEEN ? AND ?`,
      [start, end],
    );
    return Math.round(row?.volume ?? 0);
  }

  private async volumeByMuscle(start: string, end: string): Promise<WeeklyVolumePoint[]> {
    const rows = await this.db.query<{ muscle_group: MuscleGroup; volume: number | null }>(
      `SELECT e.muscle_group, COALESCE(SUM(ws.weight_kg * ws.reps), 0) AS volume
         FROM workout_session session
         INNER JOIN workout_exercise we ON we.workout_session_id = session.id
         INNER JOIN workout_set ws ON ws.workout_exercise_id = we.id
         INNER JOIN exercise e ON e.id = we.exercise_id
        WHERE session.completed_at IS NOT NULL
          AND session.date BETWEEN ? AND ?
        GROUP BY e.muscle_group
        ORDER BY volume DESC
        LIMIT 6`,
      [start, end],
    );
    return rows.map((row) => ({
      muscle_group: row.muscle_group,
      label: MUSCLE_LABELS[row.muscle_group],
      volume: Math.round(row.volume ?? 0),
    }));
  }

  private async strengthSummary(start: string, end: string): Promise<StrengthPoint[]> {
    const rows = await this.db.query<StrengthPoint>(
      `SELECT
         e.id AS exercise_id,
         e.name AS exercise_name,
         e.name_vi AS exercise_name_vi,
         MAX(ws.weight_kg * (1 + ws.reps / 30.0)) AS estimated_1rm
       FROM workout_session session
       INNER JOIN workout_exercise we ON we.workout_session_id = session.id
       INNER JOIN workout_set ws ON ws.workout_exercise_id = we.id
       INNER JOIN exercise e ON e.id = we.exercise_id
       WHERE session.completed_at IS NOT NULL
         AND session.date BETWEEN ? AND ?
         AND e.category = 'compound'
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

function validateSetInput(input: WorkoutSetInput): void {
  if (!isFiniteWithin(input.weightKg, 0, 500)) {
    throw new Error('WorkoutRepository: weight must be between 0 and 500kg.');
  }
  if (!Number.isInteger(input.reps) || input.reps < 1 || input.reps > 100) {
    throw new Error('WorkoutRepository: reps must be an integer between 1 and 100.');
  }
  if (!Number.isInteger(input.restSeconds) || input.restSeconds < 0 || input.restSeconds > 600) {
    throw new Error('WorkoutRepository: rest_seconds must be between 0 and 600.');
  }
}

function isFiniteWithin(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfWeekIso(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return toIsoDate(d);
}

function shiftIsoDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
