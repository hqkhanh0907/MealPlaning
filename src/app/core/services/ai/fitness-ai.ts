import { Injectable, inject } from '@angular/core';
import type {
  AiTrainingPlanDraft,
  Exercise,
  FitnessProgressSummary,
} from '../../models/fitness.types';
import { normalizeTrainingPrescription } from '../../models/fitness-prescription';
import type { UserProfile } from '../../models/user-profile.model';
import { catalogForPrompt } from './prompts/ai-catalog';
import { AiGeneration } from './ai-generation';
import {
  TRAINING_PLAN_SYSTEM_INSTRUCTION,
  aiTrainingPlanResponseSchema,
  buildTrainingPlanPrompt,
  type AiTrainingPlanResponse,
} from './prompts/training-plan.prompt';

export interface FitnessAiInput {
  readonly profile: UserProfile | null;
  readonly exercises: readonly Exercise[];
  readonly progress: FitnessProgressSummary | null;
}

@Injectable({ providedIn: 'root' })
export class FitnessAi {
  private readonly ai = inject(AiGeneration);

  async generateTrainingPlan(input: FitnessAiInput): Promise<AiTrainingPlanDraft> {
    const candidates = catalogForPrompt(input.exercises);
    const exerciseIds = new Set(candidates.map((exercise) => exercise.id));
    if (exerciseIds.size < 20) {
      throw new Error('FitnessAi: exercise database is too small for AI plan generation.');
    }

    const response = await this.ai.generateText<AiTrainingPlanResponse>(
      buildTrainingPlanPrompt({
        fitnessLevel: input.profile?.fitness_level ?? 'beginner',
        goal: input.profile?.goal ?? 'maintain',
        exercises: candidates,
        weeklyVolumeKg: input.progress?.currentWeekVolume ?? 0,
        workoutStreakWeeks: input.progress?.workoutStreakWeeks ?? 0,
      }),
      {
        feature: 'training_plan',
        systemInstruction: TRAINING_PLAN_SYSTEM_INSTRUCTION,
        schema: aiTrainingPlanResponseSchema,
        maxOutputTokens: 8192,
        timeoutMs: 60_000,
      },
    );

    const days = response.days.map((day) => ({
      dayOfWeek: clampInt(day.day_of_week, 0, 6),
      name: day.name.trim(),
      isRestDay: day.is_rest_day,
      exercises: day.exercises
        .filter((exercise) => exerciseIds.has(exercise.exercise_id))
        .slice(0, 8)
        .map((exercise) => ({
          exerciseId: exercise.exercise_id,
          ...normalizeTrainingPrescription({
            sets: exercise.sets,
            repsMin: exercise.reps_min,
            repsMax: exercise.reps_max,
            restSeconds: exercise.rest_seconds,
          }),
          notes: exercise.notes?.trim() || null,
        })),
    }));

    if (days.filter((day) => !day.isRestDay && day.exercises.length > 0).length < 2) {
      throw new Error('AI chưa tạo đủ hai ngày tập có bài hợp lệ.');
    }

    return {
      name: response.name.trim(),
      description: response.description.trim(),
      frequency: clampInt(response.frequency, 2, 6),
      rationale: response.rationale.trim(),
      days,
    };
  }
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}
