import type { ExerciseGuideText } from './exercise-guide.types';
import { vietnameseGuideTexts } from './exercise-guides/index';

export const guidedExerciseIds: readonly string[] = Object.keys(vietnameseGuideTexts);

export function exerciseGuideText(exerciseId: string): ExerciseGuideText | undefined {
  return Object.hasOwn(vietnameseGuideTexts, exerciseId)
    ? vietnameseGuideTexts[exerciseId]
    : undefined;
}
