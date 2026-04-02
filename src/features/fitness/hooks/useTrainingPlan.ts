import { useCallback, useState } from 'react';

import { generateUUID } from '@/utils/helpers';
import { logger } from '@/utils/logger';

import { ALL_MUSCLES, LEG_MUSCLES, LOWER_MUSCLES, PULL_MUSCLES, PUSH_MUSCLES, UPPER_MUSCLES } from '../constants';
import type {
  CardioIntensity,
  CardioType,
  CardioTypePref,
  Exercise,
  MuscleGroup,
  SelectedExercise,
  TrainingPlan,
  TrainingPlanDay,
  TrainingProfile,
} from '../types';
import { normalizeSplitType } from '../types';
import { estimateCardioBurn } from '../utils/cardioEstimator';
import {
  applyRepScheme,
  calculateSetsPerSession,
  calculateVolume,
  getDefaultExercises,
  selectExercisesForMuscle,
} from '../utils/exerciseSelector';
import type { DeloadSuggestion } from '../utils/periodization';
import {
  applyDeloadReduction,
  getDeloadScheme,
  getWeekRepScheme,
  isDeloadWeek,
  shouldAutoDeload,
} from '../utils/periodization';

/* ------------------------------------------------------------------ */
/* Public types */
/* ------------------------------------------------------------------ */

export interface PlanGenerationInput {
  trainingProfile: TrainingProfile;
  healthProfile?: {
    age: number;
    weightKg: number;
    goalType?: 'cut' | 'bulk' | 'maintain';
  };
  exerciseDB?: Exercise[];
  weeklyIntensities?: number[];
  currentWeek?: number;
  planStartDate?: string;
}

export interface GeneratedPlan {
  plan: TrainingPlan;
  days: TrainingPlanDay[];
  deloadSuggestion?: DeloadSuggestion;
  warnings?: string[];
}

/* ------------------------------------------------------------------ */
/* Internal types */
/* ------------------------------------------------------------------ */

interface SessionTemplate {
  name: string;
  muscleGroups: MuscleGroup[];
}

interface CardioScheduleItem {
  dayOfWeek: number;
  type: CardioType;
  durationMin: number;
  intensity: CardioIntensity;
  estimatedCalories: number;
}

/* ------------------------------------------------------------------ */
/* Constants */
/* ------------------------------------------------------------------ */

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ */
/* Week computation */
/* ------------------------------------------------------------------ */

export function computeCurrentWeek(startDate: string): number {
  const elapsed = Date.now() - new Date(startDate).getTime();
  if (elapsed < 0) return 1;
  return Math.floor(elapsed / MS_PER_WEEK) + 1;
}

/* ------------------------------------------------------------------ */
/* Step 1 — Training split selection */
/* ------------------------------------------------------------------ */

function determineSplit(daysPerWeek: number): {
  splitType: string;
  sessions: SessionTemplate[];
} {
  if (daysPerWeek <= 3) {
    return {
      splitType: 'Full Body',
      sessions: Array.from({ length: Math.max(daysPerWeek, 1) }, (_, i) => ({
        name: i % 2 === 0 ? 'Full Body A' : 'Full Body B',
        muscleGroups: ALL_MUSCLES,
      })),
    };
  }

  if (daysPerWeek === 4) {
    return {
      splitType: 'Upper/Lower',
      sessions: [
        { name: 'Upper A', muscleGroups: UPPER_MUSCLES },
        { name: 'Lower A', muscleGroups: LOWER_MUSCLES },
        { name: 'Upper B', muscleGroups: UPPER_MUSCLES },
        { name: 'Lower B', muscleGroups: LOWER_MUSCLES },
      ],
    };
  }

  const basePPL: SessionTemplate[] = [
    { name: 'Push', muscleGroups: PUSH_MUSCLES },
    { name: 'Pull', muscleGroups: PULL_MUSCLES },
    { name: 'Legs', muscleGroups: LEG_MUSCLES },
  ];

  if (daysPerWeek >= 6) {
    return {
      splitType: 'Push/Pull/Legs',
      sessions: [
        ...basePPL,
        { name: 'Push B', muscleGroups: PUSH_MUSCLES },
        { name: 'Pull B', muscleGroups: PULL_MUSCLES },
        { name: 'Legs B', muscleGroups: LEG_MUSCLES },
      ].slice(0, daysPerWeek),
    };
  }

  return {
    splitType: 'Push/Pull/Legs',
    sessions: [
      ...basePPL,
      { name: 'Push B', muscleGroups: PUSH_MUSCLES },
      { name: 'Pull B', muscleGroups: PULL_MUSCLES },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Day-of-week assignment */
/* ------------------------------------------------------------------ */

function assignDaysOfWeek(sessionCount: number): number[] {
  switch (sessionCount) {
    case 1:
      return [1];
    case 2:
      return [1, 4];
    case 3:
      return [1, 3, 5];
    case 4:
      return [1, 2, 4, 5];
    case 5:
      return [1, 2, 3, 5, 6];
    default:
      return Array.from({ length: Math.min(sessionCount, 7) }, (_, i) => i + 1);
  }
}

/* ------------------------------------------------------------------ */
/* Step 5 — Cardio scheduling */
/* ------------------------------------------------------------------ */

function mapCardioPreference(pref: CardioTypePref): {
  type: CardioType;
  intensity: CardioIntensity;
} {
  switch (pref) {
    case 'liss':
      return { type: 'walking', intensity: 'low' };
    case 'hiit':
      return { type: 'hiit', intensity: 'high' };
    case 'mixed':
      return { type: 'cycling', intensity: 'moderate' };
  }
}

function scheduleCardio(profile: TrainingProfile, trainingDays: number[], weightKg: number): CardioScheduleItem[] {
  if (profile.cardioSessionsWeek <= 0) return [];

  const allDays = [1, 2, 3, 4, 5, 6, 7];
  const restDays = allDays.filter(d => !trainingDays.includes(d));
  const { type, intensity } = mapCardioPreference(profile.cardioTypePref);
  const sessions: CardioScheduleItem[] = [];
  let remaining = profile.cardioSessionsWeek;

  for (const day of restDays) {
    if (remaining <= 0) break;
    sessions.push({
      dayOfWeek: day,
      type,
      durationMin: profile.cardioDurationMin,
      intensity,
      estimatedCalories: estimateCardioBurn(type, profile.cardioDurationMin, intensity, weightKg),
    });
    remaining--;
  }

  for (const day of trainingDays) {
    if (remaining <= 0) break;
    sessions.push({
      dayOfWeek: day,
      type,
      durationMin: profile.cardioDurationMin,
      intensity,
      estimatedCalories: estimateCardioBurn(type, profile.cardioDurationMin, intensity, weightKg),
    });
    remaining--;
  }

  return sessions;
}

/* ------------------------------------------------------------------ */
/* Step 6 — Deload information */
/* ------------------------------------------------------------------ */

function buildDeloadNotes(profile: TrainingProfile): string | undefined {
  const { planCycleWeeks } = profile;
  if (planCycleWeeks <= 0) return undefined;

  const deloadWeeks: number[] = [];
  for (let week = 1; week <= planCycleWeeks; week++) {
    if (isDeloadWeek(week, planCycleWeeks)) {
      deloadWeeks.push(week);
    }
  }

  const baseScheme = getWeekRepScheme(profile.periodizationModel, profile.trainingGoal, 1, 1);
  const deload = getDeloadScheme(baseScheme);

  return `Deload week(s): ${deloadWeeks.join(', ')} — ${deload.repsMin}-${deload.repsMax} reps @ ${Math.round(deload.intensityPct * 100)}%`;
}

function formatCardioNote(cardio: CardioScheduleItem): string {
  return `Cardio: ${cardio.type} ${cardio.durationMin}min (~${cardio.estimatedCalories}kcal)`;
}

function assignMultiSessionCardio(cardioSchedule: CardioScheduleItem[], days: TrainingPlanDay[], planId: string): void {
  const overflowItems: CardioScheduleItem[] = [];

  for (const cardio of cardioSchedule) {
    const isOnTrainingDay = days.some(d => d.dayOfWeek === cardio.dayOfWeek && d.sessionOrder === 1);

    if (isOnTrainingDay) {
      overflowItems.push(cardio);
    } else {
      days.push({
        id: `${planId}_cardio_${cardio.dayOfWeek}`,
        planId,
        dayOfWeek: cardio.dayOfWeek,
        sessionOrder: 1,
        workoutType: 'Cardio',
        notes: formatCardioNote(cardio),
        isUserAssigned: false,
        originalDayOfWeek: cardio.dayOfWeek,
      });
    }
  }

  if (overflowItems.length === 0) return;

  const strengthDays = days
    .filter(d => d.sessionOrder === 1 && d.exercises)
    .map(d => {
      const exCount = (JSON.parse(d.exercises!) as SelectedExercise[]).length;
      return { day: d, exerciseCount: exCount };
    })
    .sort((a, b) => a.exerciseCount - b.exerciseCount);

  const MAX_DOUBLE_SESSIONS = 2;
  let doubleSessionCount = 0;

  for (const cardio of overflowItems) {
    if (doubleSessionCount >= MAX_DOUBLE_SESSIONS) break;

    const isHIIT = cardio.type === 'hiit';
    const target = strengthDays.find(sd => {
      const hasSession2 = days.some(d => d.dayOfWeek === sd.day.dayOfWeek && d.sessionOrder === 2);
      if (hasSession2) return false;
      if (isHIIT && sd.day.muscleGroups?.includes('legs')) return false;
      return true;
    });

    if (!target) continue;

    days.push({
      id: `${planId}_cardio_s2_${target.day.dayOfWeek}`,
      planId,
      dayOfWeek: target.day.dayOfWeek,
      sessionOrder: 2,
      workoutType: 'Cardio',
      notes: formatCardioNote(cardio),
      isUserAssigned: false,
      originalDayOfWeek: target.day.dayOfWeek,
    });
    doubleSessionCount++;
  }
}

function assignSingleSessionCardio(
  cardioSchedule: CardioScheduleItem[],
  days: TrainingPlanDay[],
  planId: string,
): void {
  for (const cardio of cardioSchedule) {
    const cardioNote = formatCardioNote(cardio);
    const existingDay = days.find(d => d.dayOfWeek === cardio.dayOfWeek);

    if (existingDay) {
      existingDay.notes = existingDay.notes ? `${existingDay.notes}; ${cardioNote}` : cardioNote;
    } else {
      days.push({
        id: `${planId}_cardio_${cardio.dayOfWeek}`,
        planId,
        dayOfWeek: cardio.dayOfWeek,
        sessionOrder: 1,
        workoutType: 'Cardio',
        notes: cardioNote,
        isUserAssigned: false,
        originalDayOfWeek: cardio.dayOfWeek,
      });
    }
  }
}

function applySessionSplitting(days: TrainingPlanDay[], planId: string): void {
  const splittable = days
    .filter(d => d.sessionOrder === 1 && d.exercises)
    .map(d => {
      const exs = JSON.parse(d.exercises!) as SelectedExercise[];
      const compounds = exs.filter(e => e.exercise.category === 'compound');
      const nonCompounds = exs.filter(e => e.exercise.category === 'isolation' || e.exercise.category === 'secondary');
      return { day: d, exercises: exs, compounds, nonCompounds };
    })
    .filter(s => s.exercises.length >= 4 && s.compounds.length > 0 && s.nonCompounds.length > 0)
    .sort((a, b) => b.exercises.length - a.exercises.length);

  if (splittable.length === 0) return;

  const heaviest = splittable[0];
  const hasSession2 = days.some(d => d.dayOfWeek === heaviest.day.dayOfWeek && d.sessionOrder === 2);

  if (hasSession2) return;

  heaviest.day.exercises = JSON.stringify(heaviest.compounds);
  heaviest.day.originalExercises = heaviest.day.exercises;

  const isoJson = JSON.stringify(heaviest.nonCompounds);
  days.push({
    id: `${heaviest.day.id}_s2`,
    planId,
    dayOfWeek: heaviest.day.dayOfWeek,
    sessionOrder: 2,
    workoutType: `${heaviest.day.workoutType} (Accessory)`,
    muscleGroups: heaviest.day.muscleGroups,
    exercises: isoJson,
    originalExercises: isoJson,
    isUserAssigned: false,
    originalDayOfWeek: heaviest.day.dayOfWeek,
  });
}

/* ------------------------------------------------------------------ */
/* Deload helper (extracted to reduce cognitive complexity) */
/* ------------------------------------------------------------------ */

function applyDeloadToDays(days: TrainingPlanDay[]): void {
  for (const day of days) {
    if (!day.exercises) continue;
    const parsed: SelectedExercise[] = JSON.parse(day.exercises);
    const reduced = parsed.map(ex => ({
      ...ex,
      sets: applyDeloadReduction(ex.sets),
    }));
    day.exercises = JSON.stringify(reduced);
  }
}

/* ------------------------------------------------------------------ */
/* Main generation function (pure, exported for testing) */
/* ------------------------------------------------------------------ */

export function generateTrainingPlan(input: PlanGenerationInput): GeneratedPlan {
  const { trainingProfile, healthProfile } = input;
  const exerciseDB = input.exerciseDB ?? getDefaultExercises();

  // Resolve the current week of the training cycle
  let resolvedWeek = 1;
  if (input.currentWeek != null && input.currentWeek >= 1) {
    resolvedWeek = input.currentWeek;
  } else if (input.planStartDate) {
    resolvedWeek = computeCurrentWeek(input.planStartDate);
  }

  // Step 1
  const { splitType, sessions } = determineSplit(trainingProfile.daysPerWeek);

  // Step 2
  const weeklyVolume = calculateVolume(trainingProfile, healthProfile);
  const setsPerSession = calculateSetsPerSession(weeklyVolume, sessions);

  // Day-of-week mapping
  const dayOfWeekAssignment = assignDaysOfWeek(sessions.length);

  const planId = generateUUID();
  const now = new Date().toISOString();

  // Step 6
  const deloadNote = buildDeloadNotes(trainingProfile);

  // Steps 3 + 4: build each day
  const warnings: string[] = [];
  const days: TrainingPlanDay[] = sessions.map((session, index) => {
    const sessionSets = setsPerSession[index];

    const rawExercises: SelectedExercise[] = [];
    for (const muscle of session.muscleGroups) {
      const sets = sessionSets[muscle];
      const selected = selectExercisesForMuscle(
        muscle,
        sets,
        trainingProfile.availableEquipment,
        trainingProfile.injuryRestrictions,
        exerciseDB,
      );
      if (selected.length === 0) {
        warnings.push(muscle);
      }
      rawExercises.push(...selected);
    }

    const finalExercises = applyRepScheme(rawExercises, trainingProfile, index, resolvedWeek);

    const exercisesJson = JSON.stringify(finalExercises);
    const dayOfWeek = dayOfWeekAssignment[index];
    return {
      id: `${planId}_day_${index + 1}`,
      planId,
      dayOfWeek,
      sessionOrder: 1,
      workoutType: session.name,
      muscleGroups: JSON.stringify(session.muscleGroups),
      exercises: exercisesJson,
      originalExercises: exercisesJson,
      notes: deloadNote,
      isUserAssigned: false,
      originalDayOfWeek: dayOfWeek,
    };
  });

  // Step 5: Cardio
  const weightKg = healthProfile?.weightKg ?? 70;
  const cardioSchedule = scheduleCardio(trainingProfile, dayOfWeekAssignment, weightKg);

  const useMultiSession = trainingProfile.daysPerWeek >= 5 && trainingProfile.cardioSessionsWeek > 0;

  if (useMultiSession) {
    assignMultiSessionCardio(cardioSchedule, days, planId);
  } else {
    assignSingleSessionCardio(cardioSchedule, days, planId);
  }

  // Step 5b: Session duration splitting
  if (trainingProfile.sessionDurationMin <= 45 && trainingProfile.daysPerWeek >= 5) {
    applySessionSplitting(days, planId);
  }

  days.sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  // Auto-deload check: detect consecutive high-RPE weeks
  const deloadSuggestion = input.weeklyIntensities ? shouldAutoDeload(input.weeklyIntensities) : undefined;

  // If deload is suggested, reduce volume across all days
  if (deloadSuggestion?.shouldDeload) {
    applyDeloadToDays(days);
  }

  const trainingDays = [...new Set(days.filter(d => d.sessionOrder === 1).map(d => d.dayOfWeek))].sort((a, b) => a - b);
  const restDays = [1, 2, 3, 4, 5, 6, 7].filter(d => !trainingDays.includes(d));

  const plan: TrainingPlan = {
    id: planId,
    name: `${splitType} - ${trainingProfile.trainingGoal}`,
    status: 'active',
    splitType: normalizeSplitType(splitType),
    durationWeeks: trainingProfile.planCycleWeeks,
    currentWeek: resolvedWeek,
    startDate: now,
    createdAt: now,
    updatedAt: now,
    trainingDays,
    restDays,
  };

  const uniqueWarnings = [...new Set(warnings)];
  return {
    plan,
    days,
    deloadSuggestion,
    ...(uniqueWarnings.length > 0 ? { warnings: uniqueWarnings } : {}),
  };
}

/* ------------------------------------------------------------------ */
/* Hook */
/* ------------------------------------------------------------------ */

export function useTrainingPlan(): {
  generatePlan: (input: PlanGenerationInput) => GeneratedPlan | null;
  isGenerating: boolean;
  generationError: string | null;
} {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const generatePlan = useCallback((input: PlanGenerationInput): GeneratedPlan | null => {
    setGenerationError(null);
    setIsGenerating(true);
    try {
      return generateTrainingPlan(input);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setGenerationError(message);
      logger.error({ component: 'useTrainingPlan', action: 'generate' }, err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generatePlan, isGenerating, generationError };
}
