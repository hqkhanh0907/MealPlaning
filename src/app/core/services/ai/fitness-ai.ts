import { Injectable, inject } from '@angular/core';
import type {
  AiTrainingPlanDraft,
  Exercise,
  FitnessProgressSummary,
} from '../../models/fitness.types';
import { expandEquipment } from '../../models/exercise-discovery';
import {
  workoutDraftIssue,
  workoutExerciseUsable,
  type WorkoutPreferences,
} from '../../models/workout-plan-recommendation';
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
  readonly preferences?: WorkoutPreferences;
}

@Injectable({ providedIn: 'root' })
export class FitnessAi {
  private readonly ai = inject(AiGeneration);

  async generateTrainingPlan(input: FitnessAiInput): Promise<AiTrainingPlanDraft> {
    const prefs = input.preferences;
    if (
      prefs &&
      (prefs.age === null ||
        prefs.age < 18 ||
        prefs.equipment === null ||
        !Array.isArray(prefs.avoid) ||
        prefs.weekdays.length < 2)
    ) {
      throw new Error('Chọn điều kiện tập và ít nhất hai ngày để soạn giáo án tuần.');
    }
    const available = expandEquipment(prefs?.equipment ?? []);
    const avoid = new Set<string>(Array.isArray(prefs?.avoid) ? prefs.avoid : []);
    const candidates = catalogForPrompt(
      prefs
        ? input.exercises.filter((exercise) => workoutExerciseUsable(exercise.id, available, avoid))
        : input.exercises,
    );
    const exerciseIds = new Set(candidates.map((exercise) => exercise.id));
    if (exerciseIds.size === 0) {
      throw new Error('Chưa tìm thấy bài phù hợp để gửi yêu cầu soạn giáo án.');
    }

    const response = await this.ai.generateText<AiTrainingPlanResponse>(
      buildTrainingPlanPrompt({
        fitnessLevel: input.profile?.fitness_level ?? 'beginner',
        schedule: prefs && {
          weekdays: prefs.weekdays,
          minutes: prefs.minutes,
          frequency: prefs.frequency,
        },
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

    if (
      prefs &&
      response.days.some((day) =>
        day.exercises.some((exercise) => !exerciseIds.has(exercise.exercise_id)),
      )
    ) {
      throw new Error(
        'Bản nháp có bài nằm ngoài danh sách phù hợp. Hãy soạn lại hoặc chọn giáo án mẫu.',
      );
    }
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

    const frequency = days.filter((day) => !day.isRestDay && day.exercises.length).length;
    if (
      new Set(days.map((day) => day.dayOfWeek)).size !== 7 ||
      days.some(
        (day) =>
          day.isRestDay !== (day.exercises.length === 0) ||
          new Set(day.exercises.map((ex) => ex.exerciseId)).size !== day.exercises.length,
      )
    ) {
      throw new Error('Bản nháp có ngày hoặc bài trùng. Hãy soạn lại hoặc chọn giáo án mẫu.');
    }
    if (prefs) {
      const issue = workoutDraftIssue(prefs, days);
      if (issue) throw new Error(issue);
    }
    return {
      name: response.name.trim(),
      description: response.description.trim(),
      frequency,
      rationale: response.rationale.trim(),
      days,
    };
  }
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}
