export type TrainingGoal = 'strength' | 'hypertrophy' | 'endurance' | 'general';
export type PeriodizationModel = 'linear' | 'undulating' | 'block';
export type TrainingExperience = 'beginner' | 'intermediate' | 'advanced';

export interface RepScheme {
  repsMin: number;
  repsMax: number;
  intensityPct: number;
  restSeconds: number;
}

export interface OverloadRate {
  upperBodyKg: number;
  lowerBodyKg: number;
  perWeeks: number;
}

export const GOAL_REP_SCHEMES: Record<TrainingGoal, RepScheme> = {
  strength: { repsMin: 3, repsMax: 5, intensityPct: 0.85, restSeconds: 240 },
  hypertrophy: { repsMin: 8, repsMax: 12, intensityPct: 0.72, restSeconds: 105 },
  endurance: { repsMin: 15, repsMax: 20, intensityPct: 0.57, restSeconds: 45 },
  general: { repsMin: 8, repsMax: 12, intensityPct: 0.72, restSeconds: 90 },
};

export const OVERLOAD_RATES: Record<TrainingExperience, OverloadRate> = {
  beginner: { upperBodyKg: 2.5, lowerBodyKg: 5, perWeeks: 1 },
  intermediate: { upperBodyKg: 1.25, lowerBodyKg: 2.5, perWeeks: 2 },
  advanced: { upperBodyKg: 1.25, lowerBodyKg: 2.5, perWeeks: 4 },
};

const UNDULATING_ROTATION: TrainingGoal[] = ['strength', 'hypertrophy', 'endurance'];
const BLOCK_PHASES: TrainingGoal[] = ['hypertrophy', 'strength', 'endurance'];
const BLOCK_LENGTH = 4;

export function getWeekRepScheme(
  model: PeriodizationModel,
  goal: TrainingGoal,
  weekNumber: number,
  sessionInWeek: number,
): RepScheme {
  switch (model) {
    case 'linear':
      return { ...GOAL_REP_SCHEMES[goal] };
    case 'undulating': {
      const index = (sessionInWeek - 1) % UNDULATING_ROTATION.length;
      return { ...GOAL_REP_SCHEMES[UNDULATING_ROTATION[index]] };
    }
    case 'block': {
      const phaseIndex = Math.floor((weekNumber - 1) / BLOCK_LENGTH) % BLOCK_PHASES.length;
      return { ...GOAL_REP_SCHEMES[BLOCK_PHASES[phaseIndex]] };
    }
  }
}

export function getOverloadIncrement(experience: TrainingExperience, isUpperBody: boolean): number {
  const rate = OVERLOAD_RATES[experience];
  return isUpperBody ? rate.upperBodyKg : rate.lowerBodyKg;
}

export function isDeloadWeek(weekNumber: number, planCycleWeeks: number): boolean {
  if (planCycleWeeks <= 0) return false;
  return weekNumber % planCycleWeeks === 0;
}

export function getDeloadScheme(normalScheme: RepScheme): RepScheme {
  return {
    repsMin: Math.round(normalScheme.repsMin * 0.6),
    repsMax: Math.round(normalScheme.repsMax * 0.6),
    intensityPct: Math.round(normalScheme.intensityPct * 0.9 * 1000) / 1000,
    restSeconds: normalScheme.restSeconds,
  };
}

export interface DeloadSuggestion {
  shouldDeload: boolean;
  reason: string;
}

export function shouldAutoDeload(
  weeklyIntensities: number[],
  consecutiveHighWeeks = 4,
  highRpeThreshold = 8,
): DeloadSuggestion {
  const recentHigh = weeklyIntensities.slice(-consecutiveHighWeeks).filter(rpe => rpe >= highRpeThreshold);

  if (recentHigh.length >= consecutiveHighWeeks) {
    return {
      shouldDeload: true,
      reason: `${consecutiveHighWeeks} consecutive weeks with avg RPE ≥ ${highRpeThreshold}`,
    };
  }
  return { shouldDeload: false, reason: '' };
}

export function applyDeloadReduction(normalVolume: number, reductionPct = 0.4): number {
  return Math.round(normalVolume * (1 - reductionPct));
}
