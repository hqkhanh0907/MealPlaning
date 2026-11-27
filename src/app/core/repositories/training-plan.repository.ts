import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../services/database/database';
import type {
  ActiveTrainingPlan,
  AiTrainingPlanDraft,
  PersonalTrainingPlanDraft,
  PlannedExerciseWithExercise,
  TrainingPlanDayWithExercises,
  TrainingPlanExerciseDraft,
  TrainingPlanSummary,
  TrainingPlanType,
} from '../models/fitness.types';
import { SEED_TRAINING_PLANS } from './fitness-seed';
import { ExerciseRepository } from './exercise.repository';
import { parseLocalDate } from '../utils/local-date';
import { normalizeTrainingPrescription } from '../models/fitness-prescription';

const PLAN_SUMMARY = `
  SELECT tp.id, tp.name, tp.type, tp.frequency, tp.is_active, tp.description, tp.source,
         tp.created_at, tp.updated_at,
         COUNT(DISTINCT CASE WHEN tpd.is_rest_day = 0 THEN tpd.id END) AS training_days,
         COUNT(DISTINCT pe.id) AS planned_exercises
    FROM training_plan tp
    LEFT JOIN training_plan_day tpd ON tpd.training_plan_id = tp.id
    LEFT JOIN planned_exercise pe ON pe.training_plan_day_id = tpd.id`;

@Injectable({ providedIn: 'root' })
export class TrainingPlanRepository {
  private readonly db = inject(Database);
  private readonly exerciseRepo = inject(ExerciseRepository);

  async getFinderSchedule(): Promise<{ weekdays: number[]; minutes: number } | null> {
    const row = await this.db.getOne<{ value: string }>(
      "SELECT value FROM workout_preference WHERE key = 'fitness_finder_schedule'",
    );
    if (!row) return null;
    try {
      const value: unknown = JSON.parse(row.value);
      if (!value || typeof value !== 'object' || !('weekdays' in value) || !('minutes' in value))
        return null;
      const { weekdays, minutes } = value;
      if (
        !Array.isArray(weekdays) ||
        !weekdays.length ||
        !weekdays.every(
          (d: unknown) => typeof d === 'number' && Number.isInteger(d) && d >= 0 && d <= 6,
        ) ||
        typeof minutes !== 'number' ||
        !Number.isInteger(minutes) ||
        minutes <= 0
      )
        return null;
      return { weekdays: [...new Set<number>(weekdays)], minutes };
    } catch {
      return null;
    }
  }

  async saveFinderSchedule(weekdays: readonly number[], minutes: number): Promise<void> {
    await this.db.execute(
      `INSERT INTO workout_preference (key, value, updated_at) VALUES ('fitness_finder_schedule', ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
       WHERE workout_preference.value IS NOT excluded.value`,
      [JSON.stringify({ weekdays, minutes })],
    );
  }

  async ensurePresetPlans(): Promise<TrainingPlanSummary[]> {
    await this.exerciseRepo.ensureSeedExercises();

    await this.db.withTransaction(async () => {
      for (const plan of SEED_TRAINING_PLANS) {
        await this.db.execute(
          `INSERT INTO training_plan (
             id, name, type, frequency, is_active, description, source, updated_at
           ) VALUES (?, ?, ?, ?, 0, ?, 'preset', datetime('now'))
           ON CONFLICT(id) DO UPDATE SET
             name = excluded.name,
             type = excluded.type,
             frequency = excluded.frequency,
             description = excluded.description,
             updated_at = datetime('now')
           WHERE training_plan.source = 'preset'
             AND (
               training_plan.name IS NOT excluded.name
               OR training_plan.type IS NOT excluded.type
               OR training_plan.frequency IS NOT excluded.frequency
               OR training_plan.description IS NOT excluded.description
             )`,
          [plan.id, plan.name, plan.type, plan.frequency, plan.description],
        );

        for (const [index, day] of plan.days.entries()) {
          const dayId = `${plan.id}_day_${day.dayOfWeek}`;
          await this.db.execute(
            `INSERT INTO training_plan_day (
               id, training_plan_id, day_of_week, name, is_rest_day, sort_order
             ) VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(training_plan_id, day_of_week) DO UPDATE SET
               name = excluded.name,
               is_rest_day = excluded.is_rest_day,
               sort_order = excluded.sort_order
             WHERE training_plan_day.name IS NOT excluded.name
               OR training_plan_day.is_rest_day IS NOT excluded.is_rest_day
               OR training_plan_day.sort_order IS NOT excluded.sort_order`,
            [dayId, plan.id, day.dayOfWeek, day.name, day.isRestDay ? 1 : 0, index],
          );

          for (const [exerciseIndex, exercise] of day.exercises.entries()) {
            await this.db.execute(
              `INSERT INTO planned_exercise (
                 id, training_plan_day_id, exercise_id, sets, reps_min, reps_max,
                 rest_seconds, notes, sort_order
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(training_plan_day_id, exercise_id) DO UPDATE SET
                 sets = excluded.sets,
                 reps_min = excluded.reps_min,
                 reps_max = excluded.reps_max,
                 rest_seconds = excluded.rest_seconds,
                 notes = excluded.notes,
                 sort_order = excluded.sort_order
               WHERE planned_exercise.sets IS NOT excluded.sets
                 OR planned_exercise.reps_min IS NOT excluded.reps_min
                 OR planned_exercise.reps_max IS NOT excluded.reps_max
                 OR planned_exercise.rest_seconds IS NOT excluded.rest_seconds
                 OR planned_exercise.notes IS NOT excluded.notes
                 OR planned_exercise.sort_order IS NOT excluded.sort_order`,
              [
                `${dayId}_${exercise.exerciseId}`,
                dayId,
                exercise.exerciseId,
                exercise.sets,
                exercise.repsMin,
                exercise.repsMax,
                exercise.restSeconds,
                exercise.notes,
                exerciseIndex,
              ],
            );
          }
        }
      }
    });

    return this.listPlans();
  }

  async listPlans(): Promise<TrainingPlanSummary[]> {
    return this.db.query<TrainingPlanSummary>(
      `${PLAN_SUMMARY}
       GROUP BY tp.id
       ORDER BY CASE tp.source WHEN 'preset' THEN 0 WHEN 'custom' THEN 1 ELSE 2 END,
         tp.frequency ASC, tp.name ASC`,
    );
  }

  async activatePlan(type: TrainingPlanType): Promise<void> {
    const target = await this.db.getOne<{ id: string }>(
      `SELECT id FROM training_plan
        WHERE type = ?
          AND source = CASE WHEN ? = 'ai_custom' THEN 'ai' ELSE 'preset' END
        ORDER BY CASE WHEN id = 'plan_full_body_3x' THEN 0 ELSE 1 END,
          CASE WHEN source = 'ai' THEN is_active ELSE 0 END DESC, created_at DESC, id
        LIMIT 1`,
      [type, type],
    );
    if (!target) {
      throw new Error(`TrainingPlanRepository: plan '${type}' not found.`);
    }

    await this.activatePlanById(target.id);
  }

  async savePersonalPlan(sourcePlanId: string, draft: PersonalTrainingPlanDraft): Promise<string> {
    return this.persistPersonalPlan(sourcePlanId, draft);
  }

  async savePresetPreview(
    sourcePlanId: string,
    draft: PersonalTrainingPlanDraft,
    expectedActiveId: string | null,
  ): Promise<string> {
    return this.persistPersonalPlan(sourcePlanId, draft, expectedActiveId);
  }

  private async persistPersonalPlan(
    sourcePlanId: string,
    draft: PersonalTrainingPlanDraft,
    expectedActiveId?: string | null,
  ): Promise<string> {
    const name = draft.name.trim();
    if (!name || name.length > 80) {
      throw new Error('Nhập tên giáo án từ 1 đến 80 ký tự.');
    }
    const days = draft.days;
    const weekdays = new Set(days.map((day) => day.dayOfWeek));
    const trainingDays = days.filter((day) => !day.isRestDay);
    if (
      days.length !== 7 ||
      weekdays.size !== 7 ||
      days.some(
        (day) => !Number.isInteger(day.dayOfWeek) || day.dayOfWeek < 0 || day.dayOfWeek > 6,
      ) ||
      trainingDays.length === 0 ||
      trainingDays.some((day) => day.exercises.length === 0)
    ) {
      throw new Error('Giáo án cần đủ bảy ngày và ít nhất một buổi có bài tập.');
    }
    if (
      trainingDays.some(
        (day) =>
          new Set(day.exercises.map((item) => item.exerciseId)).size !== day.exercises.length,
      )
    ) {
      throw new Error('Mỗi bài chỉ xuất hiện một lần trong một buổi tập.');
    }

    return this.db.withTransaction(async () => {
      await this.assertNoActiveWorkout();
      await this.checkActiveSelection(expectedActiveId);
      const source = await this.db.getOne<Pick<TrainingPlanSummary, 'id' | 'type' | 'source'>>(
        `SELECT id, type, source FROM training_plan WHERE id = ?
         AND ${expectedActiveId === undefined ? 'is_active = 1' : "source = 'preset'"}`,
        [sourcePlanId],
      );
      if (!source) {
        throw new Error('Giáo án đã thay đổi. Mở lại giáo án đang dùng để chỉnh sửa.');
      }

      const planId = source.source === 'custom' ? source.id : uuidv4();
      await this.db.execute(
        `INSERT INTO training_plan (id, name, type, frequency, source, updated_at)
         VALUES (?, ?, ?, ?, 'custom', datetime('now'))
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, frequency = excluded.frequency,
           updated_at = excluded.updated_at`,
        [planId, name, source.type, trainingDays.length],
      );
      const existingDays = await this.db.query<{ id: string; day_of_week: number }>(
        `SELECT id, day_of_week FROM training_plan_day WHERE training_plan_id = ?`,
        [planId],
      );
      const existingIds = new Map(existingDays.map((day) => [day.day_of_week, day.id]));
      for (const [index, day] of days.entries()) {
        const dayId = existingIds.get(day.dayOfWeek) ?? uuidv4();
        await this.db.execute(
          `INSERT INTO training_plan_day (id, training_plan_id, day_of_week, name, is_rest_day, sort_order)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(training_plan_id, day_of_week) DO UPDATE SET name = excluded.name,
             is_rest_day = excluded.is_rest_day, sort_order = excluded.sort_order`,
          [dayId, planId, day.dayOfWeek, day.name, day.isRestDay ? 1 : 0, index],
        );
        await this.db.execute(`DELETE FROM planned_exercise WHERE training_plan_day_id = ?`, [
          dayId,
        ]);
        if (day.isRestDay) continue;
        for (const [exerciseIndex, exercise] of day.exercises.entries()) {
          await this.insertPlanExercise(dayId, exercise, exerciseIndex);
        }
      }
      await this.setActivePlan(planId);
      return planId;
    });
  }

  async createAiPlan(
    plan: AiTrainingPlanDraft,
    expectedActiveId?: string | null,
  ): Promise<TrainingPlanSummary> {
    await this.exerciseRepo.ensureSeedExercises();
    await this.assertNoActiveWorkout();
    const validExerciseIds = new Set(
      (await this.db.query<{ id: string }>(`SELECT id FROM exercise`)).map((row) => row.id),
    );
    const trainingDays = plan.days.filter(
      (day) =>
        !day.isRestDay &&
        day.exercises.some((exercise) => validExerciseIds.has(exercise.exerciseId)),
    );
    if (trainingDays.length < 2) {
      throw new Error('TrainingPlanRepository: AI plan must contain at least 2 training days.');
    }

    const planId = uuidv4();
    await this.db.withTransaction(async () => {
      await this.assertNoActiveWorkout();
      await this.checkActiveSelection(expectedActiveId);
      await this.db.execute(
        `INSERT INTO training_plan (
           id, name, type, frequency, is_active, description, source, updated_at
         ) VALUES (?, ?, 'ai_custom', ?, 0, ?, 'ai', datetime('now'))`,
        [planId, plan.name, trainingDays.length, plan.description],
      );

      for (const [dayIndex, day] of plan.days.entries()) {
        const dayId = uuidv4();
        await this.db.execute(
          `INSERT INTO training_plan_day (
             id, training_plan_id, day_of_week, name, is_rest_day, sort_order
           ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            dayId,
            planId,
            normalizeDayOfWeek(day.dayOfWeek),
            day.name,
            day.isRestDay ? 1 : 0,
            dayIndex,
          ],
        );

        if (day.isRestDay) continue;
        for (const [exerciseIndex, exercise] of day.exercises.entries()) {
          if (!validExerciseIds.has(exercise.exerciseId)) continue;
          await this.insertPlanExercise(dayId, exercise, exerciseIndex);
        }
      }
      await this.setActivePlan(planId);
    });

    const created = await this.db.getOne<TrainingPlanSummary>(
      `${PLAN_SUMMARY}
       WHERE tp.id = ?
       GROUP BY tp.id
       LIMIT 1`,
      [planId],
    );
    if (!created) {
      throw new Error('TrainingPlanRepository: failed to create AI custom plan.');
    }
    return created;
  }

  private async assertNoActiveWorkout(): Promise<void> {
    const activeSession = await this.db.getOne<{ id: string }>(
      `SELECT id FROM workout_session WHERE status = 'active' LIMIT 1`,
    );
    if (activeSession) {
      throw new Error('TrainingPlanRepository: cannot switch plan while a workout is active.');
    }
  }

  private async checkActiveSelection(expectedId: string | null | undefined): Promise<void> {
    if (expectedId === undefined) return;
    const active = await this.db.getOne<{ id: string }>(
      'SELECT id FROM training_plan WHERE is_active = 1 LIMIT 1',
    );
    if ((active?.id ?? null) !== expectedId) {
      throw new Error('Giáo án đang dùng đã thay đổi. Hãy mở lại bản xem trước.');
    }
  }

  async activatePlanById(planId: string, expectedActiveId?: string | null): Promise<void> {
    await this.db.withTransaction(async () => {
      await this.assertNoActiveWorkout();
      await this.checkActiveSelection(expectedActiveId);
      const target = await this.db.getOne<{ id: string }>(
        `SELECT id FROM training_plan WHERE id = ? LIMIT 1`,
        [planId],
      );
      if (!target) {
        throw new Error(`TrainingPlanRepository: plan '${planId}' not found.`);
      }
      await this.setActivePlan(planId);
    });
  }

  private async setActivePlan(planId: string): Promise<void> {
    await this.db.execute(
      `UPDATE training_plan
          SET is_active = CASE WHEN id = ? THEN 1 ELSE 0 END,
              updated_at = CASE WHEN id = ? THEN datetime('now') ELSE updated_at END
        WHERE id = ? OR is_active = 1`,
      [planId, planId, planId],
    );
  }

  private async insertPlanExercise(
    dayId: string,
    exercise: TrainingPlanExerciseDraft,
    index: number,
  ): Promise<void> {
    const prescription = normalizeTrainingPrescription(exercise);
    await this.db.execute(
      `INSERT INTO planned_exercise (id, training_plan_day_id, exercise_id, sets, reps_min, reps_max,
         rest_seconds, notes, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        dayId,
        exercise.exerciseId,
        prescription.sets,
        prescription.repsMin,
        prescription.repsMax,
        prescription.restSeconds,
        exercise.notes,
        index,
      ],
    );
  }

  async getActivePlan(): Promise<ActiveTrainingPlan | null> {
    const active = await this.db.getOne<TrainingPlanSummary>(
      `${PLAN_SUMMARY}
       WHERE tp.is_active = 1
       GROUP BY tp.id
       LIMIT 1`,
    );
    if (!active) return null;

    const days = await this.getPlanDays(active.id);
    return { ...active, days };
  }

  async getTodayTrainingDay(date: string): Promise<TrainingPlanDayWithExercises | null> {
    const active = await this.db.getOne<{ id: string }>(
      `SELECT id FROM training_plan WHERE is_active = 1 LIMIT 1`,
    );
    if (!active) return null;

    const dayOfWeek = dayOfWeekFromIso(date);
    const day = await this.db.getOne<TrainingPlanDayWithExercises>(
      `SELECT id, training_plan_id, day_of_week, name, is_rest_day, sort_order
         FROM training_plan_day
        WHERE training_plan_id = ? AND day_of_week = ?
        LIMIT 1`,
      [active.id, dayOfWeek],
    );
    if (!day) return null;

    return { ...day, exercises: await this.getDayExercises(day.id) };
  }

  async getPlanDays(planId: string): Promise<TrainingPlanDayWithExercises[]> {
    const days = await this.db.query<Omit<TrainingPlanDayWithExercises, 'exercises'>>(
      `SELECT id, training_plan_id, day_of_week, name, is_rest_day, sort_order
         FROM training_plan_day
        WHERE training_plan_id = ?
        ORDER BY sort_order ASC`,
      [planId],
    );

    const withExercises: TrainingPlanDayWithExercises[] = [];
    for (const day of days) {
      withExercises.push({ ...day, exercises: await this.getDayExercises(day.id) });
    }
    return withExercises;
  }

  private async getDayExercises(dayId: string): Promise<PlannedExerciseWithExercise[]> {
    return this.db.query<PlannedExerciseWithExercise>(
      `SELECT
         pe.id,
         pe.training_plan_day_id,
         pe.exercise_id,
         e.name AS exercise_name,
         e.name_vi AS exercise_name_vi,
         e.muscle_group,
         e.category,
         e.equipment,
         pe.sets,
         pe.reps_min,
         pe.reps_max,
         pe.rest_seconds,
         pe.notes,
         pe.sort_order
       FROM planned_exercise pe
       INNER JOIN exercise e ON e.id = pe.exercise_id
       WHERE pe.training_plan_day_id = ?
       ORDER BY pe.sort_order ASC`,
      [dayId],
    );
  }
}

function dayOfWeekFromIso(date: string): number {
  const parsed = parseLocalDate(date);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().getDay();
  }
  return parsed.getDay();
}

function normalizeDayOfWeek(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const normalized = Math.round(value) % 7;
  return normalized < 0 ? normalized + 7 : normalized;
}
