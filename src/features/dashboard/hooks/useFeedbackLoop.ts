import { useCallback, useMemo, useState } from 'react';

import { useFitnessStore } from '../../../store/fitnessStore';
import type { WeightEntry } from '../../fitness/types';
import { useNutritionTargets } from '../../health-profile/hooks/useNutritionTargets';
import { useHealthProfileStore } from '../../health-profile/store/healthProfileStore';
import type { GoalType } from '../../health-profile/types';

export interface Adjustment {
  reason: string;
  oldTargetCal: number;
  newTargetCal: number;
  triggerType: 'auto';
  movingAvgWeight: number;
}

export interface AdherenceResult {
  calorie: number;
  protein: number;
}

export const AUTO_ADJUST_CONFIG = {
  evaluationPeriodDays: 14,
  minWeightEntries: 10,
  weightChangeThreshold: 0.2,
  calorieAdjustment: 150,
  maxDeficit: 1000,
  minCalories: 1200,
  maxSurplus: 700,
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export function calculateMovingAverage(entries: WeightEntry[]): number | null {
  if (entries.length < 3) return null;
  return entries.reduce((sum, e) => sum + e.weightKg, 0) / entries.length;
}

export function getEntriesInWindow(entries: WeightEntry[], daysAgo: number, windowSize: number = 7): WeightEntry[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const endMs = now.getTime() + (1 - daysAgo) * DAY_MS;
  const startMs = endMs - windowSize * DAY_MS;

  return entries.filter(e => {
    const d = new Date(e.date);
    d.setHours(0, 0, 0, 0);
    const ms = d.getTime();
    return ms >= startMs && ms < endMs;
  });
}

export function evaluateAndSuggestAdjustment(
  weightLog: WeightEntry[],
  currentTarget: number,
  goalType: GoalType,
  tdee: number,
): Adjustment | null {
  // Guard against string values leaking from localStorage / JSON deserialization
  const target = Number(currentTarget);
  const safeTdee = Number(tdee);
  if (goalType === 'maintain') return null;

  const recentEntries = getEntriesInWindow(weightLog, 0, AUTO_ADJUST_CONFIG.evaluationPeriodDays);
  if (recentEntries.length < AUTO_ADJUST_CONFIG.minWeightEntries) return null;

  const currentWeek = getEntriesInWindow(weightLog, 0, 7);
  const previousWeek = getEntriesInWindow(weightLog, 7, 7);

  const currentAvg = calculateMovingAverage(currentWeek);
  const previousAvg = calculateMovingAverage(previousWeek);

  if (currentAvg === null || previousAvg === null) return null;

  const weightChange = currentAvg - previousAvg;
  const { weightChangeThreshold, calorieAdjustment, maxDeficit, minCalories, maxSurplus } = AUTO_ADJUST_CONFIG;

  if (goalType === 'cut' && weightChange >= -weightChangeThreshold) {
    const floor = Math.max(minCalories, safeTdee - maxDeficit);
    const newTargetCal = Math.max(floor, target - calorieAdjustment);
    const reason =
      weightChange > 0 ? 'Weight is increasing during cut phase' : 'Weight loss has stalled during cut phase';
    return {
      reason,
      oldTargetCal: target,
      newTargetCal,
      triggerType: 'auto',
      movingAvgWeight: currentAvg,
    };
  }

  if (goalType === 'bulk' && weightChange <= weightChangeThreshold) {
    const cap = safeTdee + maxSurplus;
    const newTargetCal = Math.min(cap, target + calorieAdjustment);
    const reason =
      weightChange < 0 ? 'Weight is decreasing during bulk phase' : 'Weight gain has stalled during bulk phase';
    return {
      reason,
      oldTargetCal: target,
      newTargetCal,
      triggerType: 'auto',
      movingAvgWeight: currentAvg,
    };
  }

  return null;
}

export function calculateAdherence(
  actualCalories: number[],
  targetCalories: number[],
  actualProtein: number[],
  targetProtein: number[],
): AdherenceResult {
  const calorieDays = Math.min(actualCalories.length, targetCalories.length);
  const proteinDays = Math.min(actualProtein.length, targetProtein.length);

  if (calorieDays === 0 && proteinDays === 0) return { calorie: 0, protein: 0 };

  let calorieHitDays = 0;
  for (let i = 0; i < calorieDays; i++) {
    const lower = targetCalories[i] * 0.9;
    const upper = targetCalories[i] * 1.1;
    if (actualCalories[i] >= lower && actualCalories[i] <= upper) {
      calorieHitDays++;
    }
  }

  let proteinHitDays = 0;
  for (let i = 0; i < proteinDays; i++) {
    if (actualProtein[i] >= targetProtein[i] * 0.9) {
      proteinHitDays++;
    }
  }

  return {
    calorie: calorieDays > 0 ? Math.round((calorieHitDays / calorieDays) * 100) : 0,
    protein: proteinDays > 0 ? Math.round((proteinHitDays / proteinDays) * 100) : 0,
  };
}

export function useFeedbackLoop(): {
  movingAverage: number | null;
  adjustment: Adjustment | null;
  adherence: AdherenceResult;
  applyAdjustment: () => void;
  dismissAdjustment: () => void;
} {
  const weightEntries = useFitnessStore(s => s.weightEntries);
  const activeGoal = useHealthProfileStore(s => s.activeGoal);
  const { tdee, targetCalories } = useNutritionTargets();

  const [dismissed, setDismissed] = useState(false);
  const [applied, setApplied] = useState(false);

  const movingAverage = useMemo(() => calculateMovingAverage(weightEntries), [weightEntries]);

  const adjustment = useMemo(() => {
    if (dismissed || applied || !activeGoal) return null;
    return evaluateAndSuggestAdjustment(weightEntries, targetCalories, activeGoal.type, tdee);
  }, [weightEntries, targetCalories, activeGoal, tdee, dismissed, applied]);

  const adherence = useMemo<AdherenceResult>(() => ({ calorie: 0, protein: 0 }), []);

  const applyAdjustment = useCallback(() => {
    if (!adjustment) return;
    const currentGoal = useHealthProfileStore.getState().activeGoal;
    if (!currentGoal) return;
    useHealthProfileStore.setState({
      activeGoal: {
        ...currentGoal,
        calorieOffset: adjustment.newTargetCal - tdee,
        updatedAt: new Date().toISOString(),
      },
    });
    setApplied(true);
  }, [adjustment, tdee]);

  const dismissAdjustment = useCallback(() => {
    setDismissed(true);
  }, []);

  return {
    movingAverage,
    adjustment,
    adherence,
    applyAdjustment,
    dismissAdjustment,
  };
}
