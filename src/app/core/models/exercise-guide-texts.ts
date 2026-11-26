import { exerciseCatalogCorrection } from './exercise-catalog-review.data';
import type { ExerciseGuideText } from './exercise-guide.types';
import { vietnameseGuideTexts } from './exercise-guides/index';

export const guidedExerciseIds: readonly string[] = Object.keys(vietnameseGuideTexts);

export function exerciseGuideText(exerciseId: string): ExerciseGuideText | undefined {
  if (!Object.hasOwn(vietnameseGuideTexts, exerciseId)) return undefined;
  const base = vietnameseGuideTexts[exerciseId];
  const correction = exerciseCatalogCorrection(exerciseId)?.guide;
  return correction ? { ...base, ...correction.after } : base;
}
