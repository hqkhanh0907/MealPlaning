import type { TFunction } from 'i18next';

export function translateWorkoutType(t: TFunction, workoutType: string): string {
  const exact = t(`fitness.workoutType.${workoutType}`, { defaultValue: '' });
  if (exact) return exact;
  const lastSpace = workoutType.lastIndexOf(' ');
  const match =
    lastSpace > 0 && /^\d+$/.test(workoutType.slice(lastSpace + 1))
      ? [workoutType, workoutType.slice(0, lastSpace).trimEnd(), workoutType.slice(lastSpace + 1)]
      : null;
  if (match) {
    const base = t(`fitness.workoutType.${match[1]}`, { defaultValue: '' });
    if (base) return `${base} ${match[2]}`;
  }
  return workoutType;
}
