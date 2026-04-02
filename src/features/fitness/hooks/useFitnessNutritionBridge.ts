import { useMemo } from 'react';

import { useTodayNutrition } from '../../../hooks/useTodayNutrition';
import i18n from '../../../i18n';
import { calculateBMR, calculateTDEE } from '../../../services/nutritionEngine';
import { useFitnessStore } from '../../../store/fitnessStore';
import { useHealthProfileStore } from '../../health-profile/store/healthProfileStore';

export interface FitnessNutritionInsight {
  type: 'surplus-on-rest' | 'deficit-on-training' | 'protein-low' | 'recovery-day' | 'balanced';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'success';
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function deriveInsight(
  isTrainingDay: boolean,
  weeklyTrainingLoad: number,
  todayCalorieBudget: number,
  todayCaloriesConsumed: number,
  todayProteinConsumed: number,
  proteinTarget: number,
): FitnessNutritionInsight | null {
  if (isTrainingDay && todayCaloriesConsumed < todayCalorieBudget * 0.75) {
    return {
      type: 'deficit-on-training',
      title: i18n.t('fitness.insight.deficitTitle'),
      message: i18n.t('fitness.insight.deficitMessage', {
        consumed: Math.round(todayCaloriesConsumed),
        budget: Math.round(todayCalorieBudget),
      }),
      severity: 'warning',
    };
  }

  if (proteinTarget > 0 && todayProteinConsumed < proteinTarget * 0.6) {
    return {
      type: 'protein-low',
      title: i18n.t('fitness.insight.proteinTitle'),
      message: i18n.t('fitness.insight.proteinMessage', {
        consumed: Math.round(todayProteinConsumed),
        target: Math.round(proteinTarget),
      }),
      severity: 'warning',
    };
  }

  if (!isTrainingDay && weeklyTrainingLoad >= 4) {
    return {
      type: 'recovery-day',
      title: i18n.t('fitness.insight.recoveryTitle'),
      message: i18n.t('fitness.insight.recoveryMessage', {
        count: weeklyTrainingLoad,
      }),
      severity: 'info',
    };
  }

  return null;
}

export interface FitnessNutritionBridgeResult {
  insight: FitnessNutritionInsight | null;
  todayCalorieBudget: number;
  isTrainingDay: boolean;
  weeklyTrainingLoad: number;
}

export function useFitnessNutritionBridge(): FitnessNutritionBridgeResult {
  const workouts = useFitnessStore(s => s.workouts);
  const healthProfile = useHealthProfileStore(s => s.profile);
  const { eaten, protein } = useTodayNutrition();

  return useMemo(() => {
    const today = toDateString(new Date());
    const isTrainingDay = workouts.some(w => w.date === today);

    const weekStart = getWeekStart(new Date());
    const weekStartStr = toDateString(weekStart);
    const weeklyTrainingLoad = workouts.filter(w => w.date >= weekStartStr && w.date <= today).length;

    if (!healthProfile) {
      return { insight: null, todayCalorieBudget: 0, isTrainingDay, weeklyTrainingLoad };
    }

    const bmr = calculateBMR(
      healthProfile.weightKg,
      healthProfile.heightCm,
      healthProfile.age,
      healthProfile.gender,
      healthProfile.bmrOverride,
    );
    const tdee = calculateTDEE(bmr, healthProfile.activityLevel);
    const todayCalorieBudget = tdee;

    const todayCaloriesConsumed = eaten;

    const proteinTarget = healthProfile.weightKg * 1.6;
    const todayProteinConsumed = protein;

    const insight = deriveInsight(
      isTrainingDay,
      weeklyTrainingLoad,
      todayCalorieBudget,
      todayCaloriesConsumed,
      todayProteinConsumed,
      proteinTarget,
    );

    return { insight, todayCalorieBudget, isTrainingDay, weeklyTrainingLoad };
  }, [workouts, healthProfile, eaten, protein]);
}
