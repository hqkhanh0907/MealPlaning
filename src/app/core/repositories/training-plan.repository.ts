import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../services/database/database';
import type {
  ActiveTrainingPlan,
  AiTrainingPlanDraft,
  PlannedExerciseWithExercise,
  TrainingPlanDayWithExercises,
  TrainingPlanSummary,
  TrainingPlanType,
} from '../models/fitness.types';
import { SEED_TRAINING_PLANS } from './fitness-seed';
import { ExerciseRepository } from './exercise.repository';

const AI_CUSTOM_PLAN_ID = 'plan_ai_custom_current';

@Injectable({ providedIn: 'root' })
export class TrainingPlanRepository {
  private readonly db = inject(Database);
  private readonly exerciseRepo = inject(ExerciseRepository);

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
           WHERE training_plan.source = 'preset'`,
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
               sort_order = excluded.sort_order`,
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
                 sort_order = excluded.sort_order`,
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

    const plans = await this.listPlans();
    if (!plans.some((plan) => plan.is_active === 1)) {
      await this.activatePlan('full_body');
      return this.listPlans();
    }
    return plans;
  }

  async listPlans(): Promise<TrainingPlanSummary[]> {
    return this.db.query<TrainingPlanSummary>(
      `SELECT
         tp.id,
         tp.name,
         tp.type,
         tp.frequency,
         tp.is_active,
         tp.description,
         tp.source,
         tp.created_at,
         tp.updated_at,
         COALESCE(COUNT(DISTINCT CASE WHEN tpd.is_rest_day = 0 THEN tpd.id END), 0)
           AS training_days,
         COALESCE(COUNT(DISTINCT pe.id), 0) AS planned_exercises
       FROM training_plan tp
       LEFT JOIN training_plan_day tpd ON tpd.training_plan_id = tp.id
       LEFT JOIN planned_exercise pe ON pe.training_plan_day_id = tpd.id
       WHERE tp.source IN ('preset', 'ai')
       GROUP BY tp.id
       ORDER BY CASE tp.source WHEN 'preset' THEN 0 ELSE 1 END, tp.frequency ASC`,
    );
  }

  async activatePlan(type: TrainingPlanType): Promise<void> {
    const activeSession = await this.db.getOne<{ id: string }>(
      `SELECT id FROM workout_session WHERE completed_at IS NULL LIMIT 1`,
    );
    if (activeSession) {
      throw new Error('TrainingPlanRepository: cannot switch plan while a workout is active.');
    }

    const target = await this.db.getOne<{ id: string }>(
      `SELECT id FROM training_plan
        WHERE type = ?
          AND source = CASE WHEN ? = 'ai_custom' THEN 'ai' ELSE 'preset' END
        LIMIT 1`,
      [type, type],
    );
    if (!target) {
      throw new Error(`TrainingPlanRepository: plan '${type}' not found.`);
    }

    await this.activatePlanById(target.id);
  }

  async createAiPlan(plan: AiTrainingPlanDraft): Promise<TrainingPlanSummary> {
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

    await this.db.withTransaction(async () => {
      await this.db.execute(
        `INSERT INTO training_plan (
           id, name, type, frequency, is_active, description, source, updated_at
         ) VALUES (?, ?, 'ai_custom', ?, 0, ?, 'ai', datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           frequency = excluded.frequency,
           description = excluded.description,
           source = 'ai',
           updated_at = datetime('now')`,
        [AI_CUSTOM_PLAN_ID, plan.name, plan.frequency, plan.description],
      );
      await this.db.execute(`DELETE FROM training_plan_day WHERE training_plan_id = ?`, [
        AI_CUSTOM_PLAN_ID,
      ]);

      for (const [dayIndex, day] of plan.days.entries()) {
        const dayId = uuidv4();
        await this.db.execute(
          `INSERT INTO training_plan_day (
             id, training_plan_id, day_of_week, name, is_rest_day, sort_order
           ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            dayId,
            AI_CUSTOM_PLAN_ID,
            normalizeDayOfWeek(day.dayOfWeek),
            day.name,
            day.isRestDay ? 1 : 0,
            dayIndex,
          ],
        );

        if (day.isRestDay) continue;
        for (const [exerciseIndex, exercise] of day.exercises.entries()) {
          if (!validExerciseIds.has(exercise.exerciseId)) continue;
          await this.db.execute(
            `INSERT INTO planned_exercise (
               id, training_plan_day_id, exercise_id, sets, reps_min, reps_max,
               rest_seconds, notes, sort_order
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              uuidv4(),
              dayId,
              exercise.exerciseId,
              clampInt(exercise.sets, 1, 10),
              clampInt(exercise.repsMin, 1, 50),
              clampInt(Math.max(exercise.repsMin, exercise.repsMax), 1, 50),
              clampInt(exercise.restSeconds, 30, 600),
              exercise.notes,
              exerciseIndex,
            ],
          );
        }
      }
      await this.db.execute(`UPDATE training_plan SET is_active = 0 WHERE is_active = 1`);
      await this.db.execute(
        `UPDATE training_plan SET is_active = 1, updated_at = datetime('now') WHERE id = ?`,
        [AI_CUSTOM_PLAN_ID],
      );
    });

    const created = await this.db.getOne<TrainingPlanSummary>(
      `SELECT
         tp.id,
         tp.name,
         tp.type,
         tp.frequency,
         tp.is_active,
         tp.description,
         tp.source,
         tp.created_at,
         tp.updated_at,
         COALESCE(COUNT(DISTINCT CASE WHEN tpd.is_rest_day = 0 THEN tpd.id END), 0)
           AS training_days,
         COALESCE(COUNT(DISTINCT pe.id), 0) AS planned_exercises
       FROM training_plan tp
       LEFT JOIN training_plan_day tpd ON tpd.training_plan_id = tp.id
       LEFT JOIN planned_exercise pe ON pe.training_plan_day_id = tpd.id
       WHERE tp.id = ?
       GROUP BY tp.id
       LIMIT 1`,
      [AI_CUSTOM_PLAN_ID],
    );
    if (!created) {
      throw new Error('TrainingPlanRepository: failed to create AI custom plan.');
    }
    return created;
  }

  private async assertNoActiveWorkout(): Promise<void> {
    const activeSession = await this.db.getOne<{ id: string }>(
      `SELECT id FROM workout_session WHERE completed_at IS NULL LIMIT 1`,
    );
    if (activeSession) {
      throw new Error('TrainingPlanRepository: cannot switch plan while a workout is active.');
    }
  }

  private async activatePlanById(planId: string): Promise<void> {
    await this.assertNoActiveWorkout();

    const target = await this.db.getOne<{ id: string }>(
      `SELECT id FROM training_plan WHERE id = ? LIMIT 1`,
      [planId],
    );
    if (!target) {
      throw new Error(`TrainingPlanRepository: plan '${planId}' not found.`);
    }

    await this.db.withTransaction(async () => {
      await this.db.execute(`UPDATE training_plan SET is_active = 0 WHERE is_active = 1`);
      await this.db.execute(
        `UPDATE training_plan SET is_active = 1, updated_at = datetime('now') WHERE id = ?`,
        [planId],
      );
    });
  }

  async getActivePlan(): Promise<ActiveTrainingPlan | null> {
    const active = await this.db.getOne<TrainingPlanSummary>(
      `SELECT
         tp.id,
         tp.name,
         tp.type,
         tp.frequency,
         tp.is_active,
         tp.description,
         tp.source,
         tp.created_at,
         tp.updated_at,
         COALESCE(COUNT(DISTINCT CASE WHEN tpd.is_rest_day = 0 THEN tpd.id END), 0)
           AS training_days,
         COALESCE(COUNT(DISTINCT pe.id), 0) AS planned_exercises
       FROM training_plan tp
       LEFT JOIN training_plan_day tpd ON tpd.training_plan_id = tp.id
       LEFT JOIN planned_exercise pe ON pe.training_plan_day_id = tpd.id
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

  private async getPlanDays(planId: string): Promise<TrainingPlanDayWithExercises[]> {
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
  const parsed = new Date(`${date}T00:00:00`);
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

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}
