import type { TrainingExperience } from '@/features/fitness/types';

/**
 * Single source of truth for training detail step count.
 * Must stay in sync with the switch cases inside TrainingDetailSteps.
 * Beginner: Duration → Equipment → Cardio → Confirm = 4
 * Non-beginner adds Periodization before Confirm = 5
 */
export function getTrainingDetailStepCount(experience: TrainingExperience): number {
  return experience === 'beginner' ? 4 : 5;
}
