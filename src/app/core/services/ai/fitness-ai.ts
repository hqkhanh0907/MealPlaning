import { Injectable, inject } from '@angular/core';
import type {
  AiTrainingPlanDraft,
  Exercise,
  FitnessProgressSummary,
} from '../../models/fitness.types';
import type { UserProfile } from '../../models/user-profile.model';
import { GeminiClient } from './gemini-client';
import {
  TRAINING_PLAN_SYSTEM_INSTRUCTION,
  aiTrainingPlanGeminiSchema,
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
  private readonly gemini = inject(GeminiClient);

  async generateTrainingPlan(input: FitnessAiInput): Promise<AiTrainingPlanDraft> {
    const exerciseIds = new Set(input.exercises.map((exercise) => exercise.id));
    if (exerciseIds.size < 20) {
      throw new Error('FitnessAi: exercise database is too small for AI plan generation.');
    }

    const response = await this.gemini.generateContent<AiTrainingPlanResponse>(
      buildTrainingPlanPrompt({
        fitnessLevel: input.profile?.fitness_level ?? 'beginner',
        goal: input.profile?.goal ?? 'maintain',
        exercises: input.exercises,
        weeklyVolumeKg: input.progress?.currentWeekVolume ?? 0,
        workoutStreakWeeks: input.progress?.workoutStreakWeeks ?? 0,
      }),
      {
        feature: 'training_plan',
        systemInstruction: TRAINING_PLAN_SYSTEM_INSTRUCTION,
        responseSchema: aiTrainingPlanGeminiSchema,
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
          sets: clampInt(exercise.sets, 1, 10),
          repsMin: clampInt(exercise.reps_min, 1, 50),
          repsMax: clampInt(Math.max(exercise.reps_min, exercise.reps_max), 1, 50),
          restSeconds: clampInt(exercise.rest_seconds, 30, 600),
          notes: cleanOptional(exercise.notes),
        })),
    }));

    if (days.filter((day) => !day.isRestDay && day.exercises.length > 0).length < 2) {
      throw new Error('FitnessAi: Gemini returned too few valid training days.');
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

function cleanOptional(value: string | null): string | null {
  const clean = value?.trim();
  return clean ? clean : null;
}
