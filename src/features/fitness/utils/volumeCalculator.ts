export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'legs' | 'arms' | 'core' | 'glutes';

export type TrainingExperience = 'beginner' | 'intermediate' | 'advanced';

export type GoalType = 'cut' | 'bulk' | 'maintain';

/** Volume Landmarks (sets/muscle/week) from Schoenfeld 2017 */
export const VOLUME_TABLE: Record<TrainingExperience, Record<MuscleGroup, number>> = {
  beginner: { chest: 10, back: 10, shoulders: 8, legs: 10, arms: 8, core: 6, glutes: 8 },
  intermediate: { chest: 14, back: 14, shoulders: 12, legs: 14, arms: 10, core: 8, glutes: 12 },
  advanced: { chest: 18, back: 18, shoulders: 16, legs: 18, arms: 14, core: 10, glutes: 16 },
};

/** Minimum Effective Volume */
export const MEV_TABLE: Record<MuscleGroup, number> = {
  chest: 6,
  back: 6,
  shoulders: 6,
  legs: 6,
  arms: 4,
  core: 4,
  glutes: 4,
};

/** Maximum Adaptive Volume */
export const MAV_TABLE: Record<MuscleGroup, number> = {
  chest: 18,
  back: 18,
  shoulders: 16,
  legs: 20,
  arms: 14,
  core: 10,
  glutes: 16,
};

/** Maximum Recoverable Volume */
export const MRV_TABLE: Record<MuscleGroup, number> = {
  chest: 24,
  back: 24,
  shoulders: 22,
  legs: 26,
  arms: 20,
  core: 14,
  glutes: 22,
};

export function calculateTargetWeeklySets(
  muscle: MuscleGroup,
  experience: TrainingExperience,
  goalType: GoalType,
  age: number,
  avgSleepHours?: number,
  priorityMuscles?: MuscleGroup[],
): number {
  let adjusted = VOLUME_TABLE[experience][muscle];

  if (goalType === 'cut') adjusted *= 0.8;
  if (goalType === 'bulk') adjusted *= 1.1;
  if (age > 40) adjusted *= 0.9;
  if (avgSleepHours != null && avgSleepHours < 7) adjusted *= 0.9;

  if (priorityMuscles?.includes(muscle)) {
    return Math.min(Math.round(adjusted), MAV_TABLE[muscle]);
  }
  return Math.max(Math.round(adjusted), MEV_TABLE[muscle]);
}

/** Distribute total sets across exercises, giving remainder to the first exercise */
export function distributeVolume(exerciseCount: number, totalSets: number): number[] {
  if (exerciseCount <= 0) return [];

  const base = Math.floor(totalSets / exerciseCount);
  const remainder = totalSets % exerciseCount;

  return Array.from({ length: exerciseCount }, (_, i) => (i < remainder ? base + 1 : base));
}

export function getVolumeLandmarks(muscle: MuscleGroup): {
  mev: number;
  mav: number;
  mrv: number;
} {
  return {
    mev: MEV_TABLE[muscle],
    mav: MAV_TABLE[muscle],
    mrv: MRV_TABLE[muscle],
  };
}
