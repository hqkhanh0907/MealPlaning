import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { catalogEntry, catalogReviewedFacts } from '../models/exercise-catalog';
import { expandEquipment } from '../models/exercise-discovery';
import { ExercisePlaceRepository } from './exercise-place.repository';
import { Database } from '../services/database/database';
import { workoutSetIssue, type WorkoutSetInput } from '../models/fitness-workout-set';
import {
  progressionLoad,
  venueMovements,
  sameVenuePreview,
  type WorkoutVenuePreview,
  type WorkoutMovementSource,
  type LastWorkoutSet,
} from '../models/workout-coaching';
import { localIsoDate, mondayOfWeek, shiftIsoDate } from '../utils/local-date';
import { isTimedExercise, muscleLabels } from '../models/fitness.types';
import type {
  FitnessProgressSummary,
  TrainingPlanExerciseDraft,
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
         duration_minutes, started_at, completed_at, created_at, origin, place_id, source_session_id
    FROM workout_session`;
const EXERCISE_PROJECTION = `
  SELECT we.id, we.workout_session_id, we.exercise_id,
         e.name AS exercise_name, e.name_vi AS exercise_name_vi, e.muscle_group, e.category, e.equipment,
         we.original_exercise_id, we.use_at_place, we.next_weight_kg, we.planned_notes, we.completion_note,
         we.planned_sets, we.planned_min, we.planned_max, we.planned_rest, we.sort_order, we.total_volume
    FROM workout_exercise we
    INNER JOIN exercise e ON e.id = we.exercise_id`;

type SessionRow = Omit<WorkoutSessionDetail, 'exercises'>;
type SetMeasurements = Pick<WorkoutSetInput, 'weightKg' | 'reps' | 'durationSeconds'>;

type SetToAppend =
  | ({ status: 'logged' } & WorkoutSetInput)
  | { status: 'skipped'; weightKg: number; reps: number };

@Injectable({ providedIn: 'root' })
export class WorkoutRepository {
  private readonly db = inject(Database);
  private readonly places = inject(ExercisePlaceRepository);
  private pendingWrite: Promise<void> = Promise.resolve();

  private writeTransaction<T>(work: () => Promise<T>): Promise<T> {
    const next = this.pendingWrite.then(() => this.db.withTransaction(work));
    this.pendingWrite = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

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
    dayId: string,
    now = new Date(),
    placeId: string | null = null,
  ): Promise<WorkoutSessionDetail> {
    return this.startSession(placeId, async (id) => {
      const day = await this.db.getOne<{ name: string }>(
        'SELECT name FROM training_plan_day WHERE id = ? AND is_rest_day = 0',
        [dayId],
      );
      if (!day) throw new Error('Chọn một ngày có bài tập trong giáo án.');
      await this.db.execute(
        `INSERT INTO workout_session
        (id, date, training_plan_day_id, training_day_name, mode, origin, place_id, started_at)
        VALUES (?, ?, ?, ?, 'guided', 'plan_day', ?, ?)`,
        [id, localIsoDate(now), dayId, day.name, placeId, now.toISOString()],
      );
      await this.db.execute(
        `INSERT INTO workout_exercise
        (id, workout_session_id, exercise_id, sort_order, planned_sets, planned_min, planned_max, planned_rest, planned_notes)
        SELECT ? || ':' || id, ?, exercise_id, sort_order, sets, reps_min, reps_max, rest_seconds, notes
        FROM planned_exercise WHERE training_plan_day_id = ?`,
        [id, id, dayId],
      );
    });
  }

  async startFreeSession(
    now = new Date(),
    placeId: string | null = null,
  ): Promise<WorkoutSessionDetail> {
    return this.startSession(placeId, (id) =>
      this.insertIndependent(id, now, placeId, 'free', 'Tập tự do', null),
    );
  }

  async startComposedSession(
    exercises: readonly (TrainingPlanExerciseDraft | string)[],
    placeId: string | null,
    now = new Date(),
    preview?: WorkoutVenuePreview,
  ): Promise<WorkoutSessionDetail> {
    if (!exercises.length) throw new Error('Buổi gợi ý cần có ít nhất một bài.');
    return this.startSession(
      placeId,
      async (id) => {
        await this.insertIndependent(id, now, placeId, 'composed', 'Buổi gợi ý', null);
        for (const [index, exercise] of exercises.entries()) {
          const draft = typeof exercise === 'string' ? null : exercise;
          await this.db.execute(
            `INSERT INTO workout_exercise
          (id, workout_session_id, exercise_id, sort_order, planned_sets, planned_min, planned_max, planned_rest, planned_notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              uuidv4(),
              id,
              typeof exercise === 'string' ? exercise : exercise.exerciseId,
              index,
              draft?.sets ?? null,
              draft?.repsMin ?? null,
              draft?.repsMax ?? null,
              draft?.restSeconds ?? null,
              draft?.notes ?? null,
            ],
          );
        }
      },
      preview,
    );
  }

  async replaySession(
    sourceId: string,
    placeId: string | null,
    now = new Date(),
    preview?: WorkoutVenuePreview,
  ): Promise<WorkoutSessionDetail> {
    return this.startSession(
      placeId,
      async (id) => {
        const source = await this.db.getOne<{
          origin: 'free' | 'composed' | null;
          training_day_name: string | null;
        }>(
          `SELECT origin, training_day_name FROM workout_session WHERE id = ? AND mode = 'free' AND status = 'completed'`,
          [sourceId],
        );
        if (!source) throw new Error('Chọn buổi tự do hoặc buổi gợi ý đã hoàn thành để tập lại.');
        await this.insertIndependent(
          id,
          now,
          placeId,
          source.origin ?? 'free',
          source.training_day_name ?? 'Tập tự do',
          sourceId,
        );
        const rows = await this.db.query<{ id: string }>(
          'SELECT id FROM workout_exercise WHERE workout_session_id = ? ORDER BY sort_order, id',
          [sourceId],
        );
        for (const [index, row] of rows.entries()) {
          await this.db.execute(
            `INSERT INTO workout_exercise
          (id, workout_session_id, exercise_id, sort_order, planned_sets, planned_min, planned_max, planned_rest, planned_notes, original_exercise_id)
          SELECT ?, ?, exercise_id, ?, planned_sets, planned_min, planned_max, planned_rest, planned_notes, original_exercise_id
          FROM workout_exercise WHERE id = ?`,
            [uuidv4(), id, index, row.id],
          );
        }
      },
      preview,
    );
  }

  private async insertIndependent(
    id: string,
    now: Date,
    place: string | null,
    origin: 'free' | 'composed',
    name: string,
    sourceId: string | null,
  ): Promise<void> {
    await this.db.execute(
      `INSERT INTO workout_session
      (id, date, training_day_name, mode, origin, place_id, source_session_id, started_at)
      VALUES (?, ?, ?, 'free', ?, ?, ?, ?)`,
      [id, localIsoDate(now), name, origin, place, sourceId, now.toISOString()],
    );
  }

  private async startSession(
    placeId: string | null,
    create: (id: string) => Promise<void>,
    preview?: WorkoutVenuePreview,
  ): Promise<WorkoutSessionDetail> {
    const sessionId = await this.writeTransaction(async () => {
      const active = await this.db.getOne<{ id: string }>(
        "SELECT id FROM workout_session WHERE status = 'active' ORDER BY started_at DESC LIMIT 1",
      );
      if (active) {
        if (preview) throw new Error('Bạn đang có buổi tập khác. Hãy tiếp tục buổi đang tập.');
        return active.id;
      }
      const id = uuidv4();
      await create(id);
      if (placeId || preview) await this.applyPlaceReplacements(id, placeId, preview);
      return id;
    });
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Không đọc được buổi tập vừa mở.');
    return session;
  }

  async previewMovements(
    sources: readonly WorkoutMovementSource[],
    placeId: string | null,
  ): Promise<WorkoutVenuePreview> {
    const place = placeId ? (await this.places.list()).find((item) => item.id === placeId) : null;
    const equipment = place?.equipment ? [...new Set(place.equipment)].sort() : null;
    const available = equipment && expandEquipment(equipment);
    const rules = new Map<string, string>();
    const ids = [
      ...new Set(
        sources.flatMap((source) =>
          source.originalExerciseId
            ? [source.originalExerciseId, source.exerciseId]
            : [source.exerciseId],
        ),
      ),
    ];
    if (placeId && ids.length) {
      const rows = await this.db.query<{ original: string; replacement: string }>(
        `
        WITH rules AS (
          SELECT prior.original_exercise_id AS original, prior.exercise_id AS replacement,
            ROW_NUMBER() OVER (PARTITION BY prior.original_exercise_id ORDER BY s.started_at DESC, s.id DESC, prior.sort_order DESC, prior.id DESC) AS position
            FROM workout_exercise prior JOIN workout_session s ON s.id = prior.workout_session_id
           WHERE prior.use_at_place = 1 AND s.place_id = ? AND s.status = 'completed'
             AND prior.original_exercise_id IN (${ids.map(() => '?').join(',')})
        ) SELECT original,replacement FROM rules WHERE position = 1`,
        [placeId, ...ids],
      );
      for (const row of rows) {
        const entry = catalogEntry(row.replacement);
        const required = entry && catalogReviewedFacts(entry).required;
        if (!available || required?.every((key) => available.has(key)))
          rules.set(row.original, row.replacement);
      }
    }
    return {
      placeId,
      placeName: place?.name ?? null,
      equipment,
      prescriptionSnapshot: sources.some((source) => source.sets !== undefined)
        ? JSON.stringify(
            sources.map((source) => [
              source.sets,
              source.repsMin,
              source.repsMax,
              source.restSeconds,
              source.notes,
            ]),
          )
        : undefined,
      movements: venueMovements(sources, rules),
    };
  }

  private async applyPlaceReplacements(
    sessionId: string,
    placeId: string | null,
    expected?: WorkoutVenuePreview,
  ): Promise<void> {
    const rows = await this.db.query<{
      id: string;
      exerciseId: string;
      originalExerciseId: string | null;
    }>(
      `SELECT id, exercise_id AS exerciseId, original_exercise_id AS originalExerciseId,
           planned_sets AS sets, planned_min AS repsMin, planned_max AS repsMax, planned_rest AS restSeconds, planned_notes AS notes
        FROM workout_exercise WHERE workout_session_id = ? ORDER BY sort_order, id`,
      [sessionId],
    );
    const actual = await this.previewMovements(rows, placeId);
    if (expected && !sameVenuePreview(expected, actual))
      throw new Error('Nơi tập hoặc bài thay thế đã đổi. Hãy xem lại buổi tập.');
    for (const [i, movement] of actual.movements.entries()) {
      if (
        rows[i].exerciseId !== movement.exerciseId ||
        rows[i].originalExerciseId !== movement.originalExerciseId
      ) {
        await this.db.execute(
          'UPDATE workout_exercise SET exercise_id = ?,original_exercise_id = ? WHERE id = ?',
          [movement.exerciseId, movement.originalExerciseId ?? null, rows[i].id],
        );
      }
    }
  }

  async replaceMovement(
    id: string,
    replacement: string,
    atPlace: boolean,
  ): Promise<WorkoutSessionDetail> {
    const sessionId = await this.writeTransaction(async () => {
      const row = await this.db.getOne<{
        workout_session_id: string;
        exercise_id: string;
        original_exercise_id: string | null;
        place_id: string | null;
      }>(
        `
        SELECT we.workout_session_id, we.exercise_id, we.original_exercise_id, s.place_id FROM workout_exercise we
        JOIN workout_session s ON s.id = we.workout_session_id WHERE we.id = ? AND s.status = 'active'`,
        [id],
      );
      if (!row || replacement === row.exercise_id || (atPlace && !row.place_id))
        throw new Error('Kiểm tra bài và nơi tập trước khi đổi.');
      const duplicate = await this.db.getOne<{ id: string }>(
        'SELECT id FROM workout_exercise WHERE workout_session_id = ? AND exercise_id = ?',
        [row.workout_session_id, replacement],
      );
      if (duplicate) throw new Error('Buổi này đã có bài thay thế.');
      const count = await this.db.getOne<{ n: number }>(
        'SELECT COUNT(*) AS n FROM workout_set WHERE workout_exercise_id = ?',
        [id],
      );
      const original = row.original_exercise_id ?? row.exercise_id;
      if (count?.n) {
        await this.db.execute(
          `INSERT INTO workout_exercise (id,workout_session_id,exercise_id,sort_order,original_exercise_id,use_at_place,planned_sets,planned_min,planned_max,planned_rest)
          SELECT ?,workout_session_id,?,(SELECT MAX(sort_order)+1 FROM workout_exercise WHERE workout_session_id = ?),?,?,MAX(0, planned_sets - ?),planned_min,planned_max,planned_rest
          FROM workout_exercise WHERE id = ?`,
          [
            uuidv4(),
            replacement,
            row.workout_session_id,
            original,
            atPlace ? 1 : null,
            count.n,
            id,
          ],
        );
      } else {
        await this.db.execute(
          'UPDATE workout_exercise SET exercise_id = ?, original_exercise_id = ?, use_at_place = ? WHERE id = ?',
          [replacement, original, atPlace ? 1 : null, id],
        );
      }
      return row.workout_session_id;
    });
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Không đọc được buổi tập sau khi đổi bài.');
    return session;
  }

  async lastSets(placeId: string | null = null): Promise<LastWorkoutSet[]> {
    return this.db.query<LastWorkoutSet>(
      `
      WITH entries AS (
        SELECT we.exercise_id, s.place_id, s.date, ws.weight_kg, ws.reps, ws.duration_seconds, we.next_weight_kg,
          ROW_NUMBER() OVER (PARTITION BY we.exercise_id ORDER BY s.completed_at DESC, ws.set_number DESC, ws.id DESC) AS position
        FROM workout_set ws JOIN workout_exercise we ON we.id = ws.workout_exercise_id
        JOIN workout_session s ON s.id = we.workout_session_id JOIN exercise e ON e.id = we.exercise_id
        WHERE s.status = 'completed' AND ws.status = 'logged' AND ws.legacy_unit_unknown = 0
          AND (lower(coalesce(e.equipment,'')) NOT LIKE '%machine%' AND lower(coalesce(e.equipment,'')) NOT LIKE '%cable%' OR s.place_id = ?)
      ) SELECT exercise_id, place_id, date, weight_kg, reps, duration_seconds, next_weight_kg FROM entries WHERE position = 1`,
      [placeId],
    );
  }

  async recordCompletionNote(id: string, note: string): Promise<void> {
    const value = note.trim();
    if (!value || value.length > 300) throw new Error('Ghi lý do trong 300 ký tự.');
    await this.db.execute(
      `UPDATE workout_exercise SET completion_note = ? WHERE id = ?
      AND workout_session_id IN (SELECT id FROM workout_session WHERE status = 'completed')`,
      [value, id],
    );
  }

  async completionSummary(id: string): Promise<WorkoutSessionDetail | null> {
    const session = await this.getSession(id);
    if (!session?.place_id) return session;
    const eligible = session.exercises.filter((ex) => progressionLoad(ex) !== null);
    for (const ex of eligible) {
      const known = await this.db.getOne<{ kg: number | null }>(
        `
        SELECT MIN(ws.weight_kg) AS kg FROM workout_set ws JOIN workout_exercise we ON we.id = ws.workout_exercise_id
        JOIN workout_session s ON s.id = we.workout_session_id
        WHERE s.id <> ? AND s.status = 'completed' AND s.place_id = ? AND we.exercise_id = ?
          AND ws.status = 'logged' AND ws.legacy_unit_unknown = 0 AND ws.duration_seconds IS NULL AND ws.weight_kg > ?`,
        [id, session.place_id, ex.exercise_id, progressionLoad(ex)],
      );
      ex.known_heavier_kg = known?.kg ?? null;
    }
    return session;
  }

  async confirmNextLoad(id: string, kg: number | null): Promise<void> {
    await this.writeTransaction(async () => {
      const exercise = await this.getWorkoutExercise(id);
      const session =
        exercise &&
        (await this.db.getOne<{ status: string }>(
          'SELECT status FROM workout_session WHERE id = ?',
          [exercise.workout_session_id],
        ));
      const last = exercise && progressionLoad(exercise);
      if (
        session?.status !== 'completed' ||
        last == null ||
        (kg !== null && (!Number.isFinite(kg) || kg <= last || kg > 500))
      ) {
        throw new Error('Kiểm tra mức tăng và các hiệp đã ghi.');
      }
      await this.db.execute('UPDATE workout_exercise SET next_weight_kg = ? WHERE id = ?', [
        kg,
        id,
      ]);
    });
  }

  weeklyVolumes(since: string, through: string): Promise<{ week_start: string; volume: number }[]> {
    return this.db.query(
      `SELECT date(date, '-' || ((strftime('%w', date) + 6) % 7) || ' days') AS week_start,
      SUM(total_volume) AS volume FROM workout_session WHERE status = 'completed' AND date BETWEEN ? AND ?
      GROUP BY week_start ORDER BY week_start`,
      [since, through],
    );
  }

  async addExerciseToSession(
    sessionId: string,
    exerciseId: string,
    sortOrder?: number,
  ): Promise<WorkoutExerciseDetail> {
    const id = await this.writeTransaction(async () => {
      const active = await this.db.getOne<{ id: string }>(
        "SELECT id FROM workout_session WHERE id = ? AND status = 'active'",
        [sessionId],
      );
      if (!active) throw new Error('Buổi tập này đã kết thúc.');
      const existing = await this.db.getOne<{ id: string }>(
        `SELECT id FROM workout_exercise
        WHERE workout_session_id = ? AND exercise_id = ? LIMIT 1`,
        [sessionId, exerciseId],
      );
      if (existing) return existing.id;
      const newId = uuidv4();
      await this.db.execute(
        `INSERT INTO workout_exercise (id, workout_session_id, exercise_id, sort_order)
        SELECT ?, ?, ?, COALESCE(?, MAX(sort_order) + 1, 0) FROM workout_exercise WHERE workout_session_id = ?`,
        [newId, sessionId, exerciseId, sortOrder ?? null, sessionId],
      );
      return newId;
    });
    const created = await this.getWorkoutExercise(id);
    if (!created) {
      throw new Error('WorkoutRepository: failed to add exercise to workout.');
    }
    return created;
  }

  async addSet(
    workoutExerciseId: string,
    input: WorkoutSetInput,
    id = uuidv4(),
  ): Promise<{ set: WorkoutSet; session: WorkoutSessionDetail }> {
    return this.appendSet(workoutExerciseId, { ...input, status: 'logged' }, id);
  }

  async skipSet(
    workoutExerciseId: string,
    plannedWeightKg = 0,
    plannedReps = 0,
    id = uuidv4(),
  ): Promise<{ set: WorkoutSet; session: WorkoutSessionDetail }> {
    return this.appendSet(
      workoutExerciseId,
      {
        status: 'skipped',
        weightKg:
          Number.isFinite(plannedWeightKg) && plannedWeightKg >= 0 && plannedWeightKg <= 500
            ? plannedWeightKg
            : 0,
        reps:
          Number.isInteger(plannedReps) && plannedReps >= 0 && plannedReps <= 100 ? plannedReps : 0,
      },
      id,
    );
  }

  private async appendSet(
    workoutExerciseId: string,
    entry: SetToAppend,
    id: string,
  ): Promise<{ set: WorkoutSet; session: WorkoutSessionDetail }> {
    const sessionId = await this.writeTransaction(async () => {
      const exercise = await this.db.getOne<{ workout_session_id: string; exercise_id: string }>(
        `SELECT workout_session_id, exercise_id FROM workout_exercise WHERE id = ?`,
        [workoutExerciseId],
      );
      if (!exercise)
        throw new Error(`WorkoutRepository: workout exercise '${workoutExerciseId}' not found.`);
      const saved = await this.db.getOne<{ workout_exercise_id: string }>(
        'SELECT workout_exercise_id FROM workout_set WHERE id = ?',
        [id],
      );
      if (saved) {
        if (saved.workout_exercise_id !== workoutExerciseId)
          throw new Error('Hiệp đã thuộc bài tập khác.');
        return exercise.workout_session_id;
      }
      const active = await this.db.getOne<{ id: string }>(
        "SELECT id FROM workout_session WHERE id = ? AND status = 'active'",
        [exercise.workout_session_id],
      );
      if (!active) throw new Error('Buổi tập này đã kết thúc.');
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
    await this.writeTransaction(async () => {
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

    await this.writeTransaction(async () => {
      await this.db.execute(
        'UPDATE workout_exercise SET next_weight_kg = NULL WHERE id = ? AND next_weight_kg IS NOT NULL',
        [row.workout_exercise_id],
      );
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
    await this.writeTransaction(async () => {
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
      await this.db.execute(
        `UPDATE workout_exercise SET next_weight_kg = NULL WHERE id =
        (SELECT workout_exercise_id FROM workout_set WHERE id = ?) AND next_weight_kg IS NOT NULL`,
        [setId],
      );
      await this.syncTotals(row.workout_session_id);
    });
  }

  async reviseCompletedSet(
    sessionId: string,
    setId: string,
    input: SetMeasurements,
  ): Promise<WorkoutSessionDetail> {
    return this.writeTransaction(async () => {
      const row = await this.db.getOne<
        Pick<WorkoutSet, 'weight_kg' | 'reps' | 'duration_seconds'> & { exercise_id: string }
      >(
        `SELECT ws.weight_kg, ws.reps, ws.duration_seconds, we.exercise_id
           FROM workout_set ws
           JOIN workout_exercise we ON we.id = ws.workout_exercise_id
           JOIN workout_session session ON session.id = we.workout_session_id
          WHERE ws.id = ? AND session.id = ? AND session.status = 'completed'
            AND ws.status = 'logged' AND ws.legacy_unit_unknown = 0`,
        [setId, sessionId],
      );
      if (!row || isTimedExercise(row.exercise_id) !== (row.duration_seconds != null)) {
        throw new Error('WorkoutRepository: set is not editable in this finished workout.');
      }
      validateSetInput({ ...input, restSeconds: 0, effort: null, notes: null }, row.exercise_id);
      const duration = input.durationSeconds ?? null;
      if (
        row.weight_kg !== input.weightKg ||
        row.reps !== input.reps ||
        row.duration_seconds !== duration
      ) {
        await this.db.execute(
          `UPDATE workout_set
              SET weight_kg = ?, reps = ?, duration_seconds = ?, updated_at = ?
            WHERE id = ?`,
          [input.weightKg, input.reps, duration, new Date().toISOString(), setId],
        );
        await this.db.execute(
          `UPDATE workout_exercise SET next_weight_kg = NULL WHERE id =
          (SELECT workout_exercise_id FROM workout_set WHERE id = ?) AND next_weight_kg IS NOT NULL`,
          [setId],
        );
        await this.syncTotals(sessionId);
      }
      const session = await this.getSession(sessionId);
      if (!session) throw new Error('WorkoutRepository: finished workout no longer exists.');
      return session;
    });
  }

  async deleteCompletedSession(sessionId: string): Promise<void> {
    await this.writeTransaction(async () => {
      const session = await this.db.getOne<{ status: string }>(
        'SELECT status FROM workout_session WHERE id = ?',
        [sessionId],
      );
      if (!session) return;
      if (session.status !== 'completed') {
        throw new Error('WorkoutRepository: only a finished workout can be deleted here.');
      }
      await this.db.execute(
        `DELETE FROM workout_set WHERE workout_exercise_id IN (
          SELECT id FROM workout_exercise WHERE workout_session_id = ?
        )`,
        [sessionId],
      );
      await this.db.execute('DELETE FROM workout_exercise WHERE workout_session_id = ?', [
        sessionId,
      ]);
      await this.db.execute('DELETE FROM workout_session WHERE id = ?', [sessionId]);
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

    await this.writeTransaction(async () => {
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
   * can restore the session 1:1.
   *
   * Errors out for already-completed sessions.
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
       ORDER BY we.sort_order ASC, we.id ASC`,
      [row.id],
    );

    const sets = await this.db.query<WorkoutSet>(
      `
      SELECT ws.id, ws.workout_exercise_id, ws.set_number, ws.weight_kg, ws.reps, ws.rest_seconds,
             ws.duration_seconds, ws.legacy_unit_unknown, ws.effort, ws.notes, ws.status, ws.completed_at, ws.created_at
      FROM workout_set ws JOIN workout_exercise we ON we.id = ws.workout_exercise_id
      WHERE we.workout_session_id = ? ORDER BY we.sort_order, ws.set_number`,
      [row.id],
    );
    const byExercise = new Map<string, WorkoutSet[]>();
    for (const set of sets) {
      const list = byExercise.get(set.workout_exercise_id) ?? [];
      list.push(set);
      byExercise.set(set.workout_exercise_id, list);
    }
    return {
      ...row,
      exercises: exercises.map((ex) => ({ ...ex, sets: byExercise.get(ex.id) ?? [] })),
    };
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
