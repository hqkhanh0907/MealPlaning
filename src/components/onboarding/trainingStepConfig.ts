import type { TrainingExperience } from '@/features/fitness/types';

/**
 * Experience level numeric mapping for step visibility filtering.
 * Each step declares a minLevel; steps with minLevel <= user's level are shown.
 */
const EXPERIENCE_LEVEL: Record<TrainingExperience, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

export interface StepConfig {
  id: string;
  minLevel: number;
}

/**
 * Declarative step configuration — single source of truth.
 * Step order, count, and visibility all derived from this array.
 * Beginner (5): duration, equipment, injuries, cardio, confirm
 * Intermediate (8): + periodization, cycleWeeks, priorityMuscles
 * Advanced (9): + sleepHours
 */
export const TRAINING_STEPS: StepConfig[] = [
  { id: 'duration', minLevel: 0 },
  { id: 'equipment', minLevel: 0 },
  { id: 'injuries', minLevel: 0 },
  { id: 'cardio', minLevel: 0 },
  { id: 'periodization', minLevel: 1 },
  { id: 'cycleWeeks', minLevel: 1 },
  { id: 'priorityMuscles', minLevel: 1 },
  { id: 'sleepHours', minLevel: 2 },
  { id: 'confirm', minLevel: 0 },
];

export function getActiveSteps(experience: TrainingExperience): StepConfig[] {
  const level = EXPERIENCE_LEVEL[experience] ?? 0;
  return TRAINING_STEPS.filter(s => s.minLevel <= level);
}

export function getTrainingDetailStepCount(experience: TrainingExperience): number {
  return getActiveSteps(experience).length;
}
