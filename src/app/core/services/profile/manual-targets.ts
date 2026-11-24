export const manualTargetLimits = {
  calories: { min: 800, max: 6000 },
  protein: { min: 20, max: 400 },
  carbs: { min: 0, max: 1000 },
  fat: { min: 0, max: 1000 },
} as const;

export function validManualTarget(
  key: keyof typeof manualTargetLimits,
  value: number | null,
): boolean {
  const { min, max } = manualTargetLimits[key];
  return value === null || (Number.isFinite(value) && value >= min && value <= max);
}
