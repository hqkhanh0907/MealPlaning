import type { TFunction } from 'i18next';

export function translateWorkoutType(t: TFunction, workoutType: string): string {
  const exact = t(`fitness.workoutType.${workoutType}`, { defaultValue: '' });
  if (exact) return exact;
  const match = /^(.+?)\s+(\d+)$/.exec(workoutType);
  if (match) {
    const base = t(`fitness.workoutType.${match[1]}`, { defaultValue: '' });
    if (base) return `${base} ${match[2]}`;
  }
  return workoutType;
}
