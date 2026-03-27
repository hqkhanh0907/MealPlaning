import { useState, useCallback } from 'react';
import type {
  TrainingProfile,
  TrainingPlan,
  TrainingPlanDay,
  Exercise,
  MuscleGroup,
  EquipmentType,
  BodyRegion,
  ExerciseCategory,
  SelectedExercise,
  CardioType,
  CardioTypePref,
  CardioIntensity,
} from '../types';
import { isBodyRegion } from '../types';
import {
  calculateTargetWeeklySets,
  distributeVolume,
} from '../utils/volumeCalculator';
import type { GoalType } from '../utils/volumeCalculator';
import {
  getWeekRepScheme,
  isDeloadWeek,
  getDeloadScheme,
} from '../utils/periodization';
import { estimateCardioBurn } from '../utils/cardioEstimator';
import { EXERCISES as EXERCISE_SEEDS } from '../data/exerciseDatabase';
import type { ExerciseSeed } from '../data/exerciseDatabase';
import {
  ALL_MUSCLES,
  UPPER_MUSCLES,
  LOWER_MUSCLES,
  PUSH_MUSCLES,
  PULL_MUSCLES,
  LEG_MUSCLES,
} from '../constants';

/* ------------------------------------------------------------------ */
/*  Public types                                                        */
/* ------------------------------------------------------------------ */

export interface PlanGenerationInput {
  trainingProfile: TrainingProfile;
  healthProfile?: {
    age: number;
    weightKg: number;
    goalType?: 'cut' | 'bulk' | 'maintain';
  };
  exerciseDB?: Exercise[];
}

export interface GeneratedPlan {
  plan: TrainingPlan;
  days: TrainingPlanDay[];
}

/* ------------------------------------------------------------------ */
/*  Internal types                                                      */
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
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const CATEGORY_ORDER: Record<ExerciseCategory, number> = {
  compound: 0,
  secondary: 1,
  isolation: 2,
};

/* ------------------------------------------------------------------ */
/*  Seed → Exercise conversion                                          */
/* ------------------------------------------------------------------ */

function seedToExercise(seed: ExerciseSeed): Exercise {
  return {
    ...seed,
    muscleGroup: seed.muscleGroup as MuscleGroup,
    secondaryMuscles: seed.secondaryMuscles as MuscleGroup[],
    equipment: seed.equipment as EquipmentType[],
    contraindicated: seed.contraindicated.filter(isBodyRegion),
    updatedAt: '',
  };
}

function getDefaultExercises(): Exercise[] {
  return EXERCISE_SEEDS.map(seedToExercise);
}

/* ------------------------------------------------------------------ */
/*  Step 1 — Training split selection                                   */
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
/*  Day-of-week assignment                                              */
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
      return Array.from(
        { length: Math.min(sessionCount, 7) },
        (_, i) => i + 1,
      );
  }
}

/* ------------------------------------------------------------------ */
/*  Step 2 — Weekly volume calculation                                  */
/* ------------------------------------------------------------------ */

function calculateVolume(
  profile: TrainingProfile,
  healthProfile?: PlanGenerationInput['healthProfile'],
): Record<MuscleGroup, number> {
  const goalType: GoalType = healthProfile?.goalType ?? 'maintain';
  const age = healthProfile?.age ?? 30;

  const result = {} as Record<MuscleGroup, number>;
  for (const muscle of ALL_MUSCLES) {
    result[muscle] = calculateTargetWeeklySets(
      muscle,
      profile.trainingExperience,
      goalType,
      age,
      profile.avgSleepHours,
      profile.priorityMuscles,
    );
  }
  return result;
}

/* ------------------------------------------------------------------ */
/*  Step 2b — Distribute volume across sessions                         */
/* ------------------------------------------------------------------ */

function calculateSetsPerSession(
  weeklyVolume: Record<MuscleGroup, number>,
  sessions: SessionTemplate[],
): Record<MuscleGroup, number>[] {
  const muscleFrequency = {} as Record<MuscleGroup, number>;
  for (const session of sessions) {
    for (const muscle of session.muscleGroups) {
      muscleFrequency[muscle] = (muscleFrequency[muscle] ?? 0) + 1;
    }
  }

  return sessions.map((session) => {
    const sets = {} as Record<MuscleGroup, number>;
    for (const muscle of session.muscleGroups) {
      const freq = muscleFrequency[muscle];
      sets[muscle] = Math.max(1, Math.round(weeklyVolume[muscle] / freq));
    }
    return sets;
  });
}

/* ------------------------------------------------------------------ */
/*  Step 3 — Exercise selection                                         */
/* ------------------------------------------------------------------ */

function selectExercisesForMuscle(
  muscleGroup: MuscleGroup,
  setsNeeded: number,
  availableEquipment: EquipmentType[],
  injuries: BodyRegion[],
  exerciseDB: Exercise[],
): SelectedExercise[] {
  const eligible = exerciseDB.filter(
    (ex) =>
      ex.muscleGroup === muscleGroup &&
      ex.exerciseType === 'strength' &&
      ex.equipment.some((eq) =>
        availableEquipment.includes(eq as EquipmentType),
      ) &&
      !ex.contraindicated.some((ci) => injuries.includes(ci)),
  );

  if (eligible.length === 0) return [];

  const sorted = [...eligible].sort(
    (a, b) => CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category],
  );

  const maxExercises = Math.min(
    sorted.length,
    Math.max(1, Math.ceil(setsNeeded / 3)),
  );
  const selected = sorted.slice(0, maxExercises);
  const distribution = distributeVolume(selected.length, setsNeeded);

  return selected.map((ex, i) => ({
    exercise: ex,
    sets: distribution[i],
    repsMin: ex.defaultRepsMin,
    repsMax: ex.defaultRepsMax,
    restSeconds: 90,
  }));
}

/* ------------------------------------------------------------------ */
/*  Step 4 — Rep range assignment via periodization                     */
/* ------------------------------------------------------------------ */

function applyRepScheme(
  exercises: SelectedExercise[],
  profile: TrainingProfile,
  sessionIndex: number,
): SelectedExercise[] {
  const scheme = getWeekRepScheme(
    profile.periodizationModel,
    profile.trainingGoal,
    1,
    sessionIndex + 1,
  );

  return exercises.map((ex) => ({
    ...ex,
    repsMin: scheme.repsMin,
    repsMax: scheme.repsMax,
    restSeconds: scheme.restSeconds,
  }));
}

/* ------------------------------------------------------------------ */
/*  Step 5 — Cardio scheduling                                          */
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

function scheduleCardio(
  profile: TrainingProfile,
  trainingDays: number[],
  weightKg: number,
): CardioScheduleItem[] {
  if (profile.cardioSessionsWeek <= 0) return [];

  const allDays = [1, 2, 3, 4, 5, 6, 7];
  const restDays = allDays.filter((d) => !trainingDays.includes(d));
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
      estimatedCalories: estimateCardioBurn(
        type,
        profile.cardioDurationMin,
        intensity,
        weightKg,
      ),
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
      estimatedCalories: estimateCardioBurn(
        type,
        profile.cardioDurationMin,
        intensity,
        weightKg,
      ),
    });
    remaining--;
  }

  return sessions;
}

/* ------------------------------------------------------------------ */
/*  Step 6 — Deload information                                         */
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

  const baseScheme = getWeekRepScheme(
    profile.periodizationModel,
    profile.trainingGoal,
    1,
    1,
  );
  const deload = getDeloadScheme(baseScheme);

  return `Deload week(s): ${deloadWeeks.join(', ')} — ${deload.repsMin}-${deload.repsMax} reps @ ${Math.round(deload.intensityPct * 100)}%`;
}

/* ------------------------------------------------------------------ */
/*  Main generation function (pure, exported for testing)               */
/* ------------------------------------------------------------------ */

export function generateTrainingPlan(
  input: PlanGenerationInput,
): GeneratedPlan {
  const { trainingProfile, healthProfile } = input;
  const exerciseDB = input.exerciseDB ?? getDefaultExercises();

  // Step 1
  const { splitType, sessions } = determineSplit(
    trainingProfile.daysPerWeek,
  );

  // Step 2
  const weeklyVolume = calculateVolume(trainingProfile, healthProfile);
  const setsPerSession = calculateSetsPerSession(weeklyVolume, sessions);

  // Day-of-week mapping
  const dayOfWeekAssignment = assignDaysOfWeek(sessions.length);

  const planId = `plan_${Date.now()}`;
  const now = new Date().toISOString();

  // Step 6
  const deloadNote = buildDeloadNotes(trainingProfile);

  // Steps 3 + 4: build each day
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
      rawExercises.push(...selected);
    }

    const finalExercises = applyRepScheme(
      rawExercises,
      trainingProfile,
      index,
    );

    return {
      id: `${planId}_day_${index + 1}`,
      planId,
      dayOfWeek: dayOfWeekAssignment[index],
      workoutType: session.name,
      muscleGroups: session.muscleGroups.join(','),
      exercises: JSON.stringify(finalExercises),
      notes: deloadNote,
    };
  });

  // Step 5: Cardio
  const weightKg = healthProfile?.weightKg ?? 70;
  const cardioSchedule = scheduleCardio(
    trainingProfile,
    dayOfWeekAssignment,
    weightKg,
  );

  for (const cardio of cardioSchedule) {
    const cardioNote = `Cardio: ${cardio.type} ${cardio.durationMin}min (~${cardio.estimatedCalories}kcal)`;
    const existingDay = days.find((d) => d.dayOfWeek === cardio.dayOfWeek);

    if (existingDay) {
      existingDay.notes = existingDay.notes
        ? `${existingDay.notes}; ${cardioNote}`
        : cardioNote;
    } else {
      days.push({
        id: `${planId}_cardio_${cardio.dayOfWeek}`,
        planId,
        dayOfWeek: cardio.dayOfWeek,
        workoutType: 'Cardio',
        notes: cardioNote,
      });
    }
  }

  days.sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  const plan: TrainingPlan = {
    id: planId,
    name: `${splitType} - ${trainingProfile.trainingGoal}`,
    status: 'active',
    splitType,
    durationWeeks: trainingProfile.planCycleWeeks,
    startDate: now,
    createdAt: now,
    updatedAt: now,
  };

  return { plan, days };
}

/* ------------------------------------------------------------------ */
/*  Hook                                                                */
/* ------------------------------------------------------------------ */

export function useTrainingPlan(): {
  generatePlan: (input: PlanGenerationInput) => GeneratedPlan | null;
  isGenerating: boolean;
  generationError: string | null;
} {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const generatePlan = useCallback(
    (input: PlanGenerationInput): GeneratedPlan | null => {
      setGenerationError(null);
      setIsGenerating(true);
      try {
        return generateTrainingPlan(input);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : String(err);
        setGenerationError(message);
        console.error('[useTrainingPlan] Generation failed:', err);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [],
  );

  return { generatePlan, isGenerating, generationError };
}
