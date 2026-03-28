// Personal nutrition target calculations (BMR, TDEE, Macros)
// Pure functions — no side effects, no database access
// Boundary: nutrition.ts = "what's in the food", nutritionEngine.ts = "what the user needs"

export type Gender = 'male' | 'female';
export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'extra_active';
export type RateOfChange = 'conservative' | 'moderate' | 'aggressive';
export type GoalType = 'cut' | 'bulk' | 'maintain';

export interface MacroSplit {
  proteinG: number;
  fatG: number;
  carbsG: number;
  proteinCal: number;
  fatCal: number;
  carbsCal: number;
  isOverallocated: boolean;
}

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  extra_active: 1.9,
};

/** Mifflin-St Jeor BMR formula */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
  bmrOverride?: number,
): number {
  if (bmrOverride) return bmrOverride;
  const s = gender === 'male' ? 5 : -161;
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + s);
}

/** TDEE = BMR × activity multiplier */
export function calculateTDEE(
  bmr: number,
  activityLevel: ActivityLevel,
): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

/** Map weekly training sessions to an ActivityLevel */
export function sessionsToLevel(sessions: number): ActivityLevel {
  if (sessions <= 0) return 'sedentary';
  if (sessions <= 2) return 'light';
  if (sessions <= 4) return 'moderate';
  if (sessions <= 6) return 'active';
  return 'extra_active';
}

/** Blend 70% auto-detected level + 30% user-selected base level */
export function getAutoAdjustedMultiplier(
  baseLevel: ActivityLevel,
  sessionsPerWeek: number,
): number {
  const autoLevel = sessionsToLevel(sessionsPerWeek);
  const base = ACTIVITY_MULTIPLIERS[baseLevel];
  const auto = ACTIVITY_MULTIPLIERS[autoLevel];
  return auto * 0.7 + base * 0.3;
}

/** Caloric target = TDEE + offset (cut < 0, bulk > 0, maintain = 0) */
export function calculateTarget(
  tdee: number,
  calorieOffset: number,
): number {
  return Math.round(Number(tdee) + Number(calorieOffset));
}

/** Priority-based macro split: Protein → Fat → Carbs (remainder) */
export function calculateMacros(
  targetCal: number,
  weightKg: number,
  proteinRatio: number,
  fatPct: number,
  bodyFatPct?: number,
): MacroSplit {
  // Priority 1: Protein (use LBM if bodyFatPct available)
  const effectiveWeight =
    bodyFatPct == null ? weightKg : weightKg * (1 - bodyFatPct);
  const proteinG = Math.round(effectiveWeight * proteinRatio);
  const proteinCal = proteinG * 4;

  // Priority 2: Fat
  const fatCal = Math.round(targetCal * fatPct);
  const fatG = Math.round(fatCal / 9);

  // Priority 3: Carbs (remainder)
  const carbsCal = Math.max(0, targetCal - proteinCal - fatCal);
  const carbsG = Math.round(carbsCal / 4);

  const isOverallocated = proteinCal + fatCal > targetCal;
  return {
    proteinG,
    fatG,
    carbsG,
    proteinCal,
    fatCal,
    carbsCal,
    isOverallocated,
  };
}

/** Get calorie offset for a given goal and rate of change */
export function getCalorieOffset(
  goalType: GoalType,
  rate: RateOfChange,
): number {
  if (goalType === 'maintain') return 0;
  const offsets: Record<RateOfChange, number> = {
    conservative: 275,
    moderate: 550,
    aggressive: 1100,
  };
  return goalType === 'cut' ? -offsets[rate] : offsets[rate];
}
