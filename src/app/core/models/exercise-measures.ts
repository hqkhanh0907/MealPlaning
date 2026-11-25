import { exerciseGuideText } from './exercise-guide-texts';

export function isTimedExercise(exerciseId: string): boolean {
  return exerciseGuideText(exerciseId)?.measure === 'seconds';
}
