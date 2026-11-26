import { catalogEntry, catalogReviewedFacts } from './exercise-catalog';
import { exerciseCatalogCorrection } from './exercise-catalog-review.data';
import { exerciseGuideIllustrationNotes } from './exercise-guide-illustration-notes';
import {
  framePhaseLabels,
  movingSingleFrameLabel,
  type ExerciseGuide,
} from './exercise-guide.types';
import { exerciseGuideText } from './exercise-guide-texts';
import { isTimedExercise } from './exercise-measures';
import { muscleLabels, type PlannedExerciseWithExercise } from './fitness.types';

export type { ExerciseGuide } from './exercise-guide.types';
export { guidedExerciseIds } from './exercise-guide-texts';

export function exerciseGuide(exerciseId: string): ExerciseGuide | undefined {
  const entry = catalogEntry(exerciseId);
  const text = exerciseGuideText(exerciseId);
  if (!entry || !text) return undefined;
  const reviewed = catalogReviewedFacts(entry);
  const noteReview = exerciseCatalogCorrection(entry.id)?.illustrationNote;
  const illustrationNote = noteReview ? noteReview.after : exerciseGuideIllustrationNotes[entry.id];
  return {
    timed: text.measure === 'seconds',
    equipment: text.equipment,
    purpose: text.purpose,
    startPosition: text.startPosition,
    steps: text.steps,
    source: text.source,
    sourceUrl: text.sourceUrl,
    illustration: {
      alt: text.alt,
      frames: entry.frames.map((phase) => ({
        path: 'assets/fitness/exercises/' + entry.id + '/' + phase + '.webp',
        phase,
        label:
          phase === 'hold' && reviewed.movementPattern === 'cardio'
            ? movingSingleFrameLabel
            : framePhaseLabels[phase],
      })),
      stacked: entry.frames.length > 1 && entry.width > entry.height,
      ...(illustrationNote ? { note: illustrationNote } : {}),
    },
    ...(text.loadTotalOfTwo ? { loadLabel: 'Tổng hai tạ (kg)' } : {}),
    ...(reviewed.perSide ? { perSide: true as const } : {}),
  };
}

export function exerciseInstructions(exerciseId: string): string | undefined {
  const text = exerciseGuideText(exerciseId);
  return text && [text.startPosition, ...text.steps].join('\n');
}

export function exerciseUnitNote(exerciseId: string): string | null {
  const guide = exerciseGuide(exerciseId);
  if (!guide) return null;
  const perSide = guide.timed ? 'Số giây mỗi bên' : 'Số lần mỗi bên';
  const units = [guide.loadLabel, guide.perSide ? perSide : undefined].filter(Boolean);
  return units.length ? units.join(' · ') : null;
}

export function exerciseAmountLabel(exerciseId: string): string {
  const guide = exerciseGuide(exerciseId);
  if (guide?.timed) return guide.perSide ? 'Tập mỗi bên (giây)' : 'Tập (giây)';
  if (guide?.perSide) return 'Số lần mỗi bên';
  return isTimedExercise(exerciseId) ? 'Tập (giây)' : 'Số lần';
}

export function exercisePurpose(
  exercise: Pick<PlannedExerciseWithExercise, 'exercise_id' | 'muscle_group'>,
): string {
  return (
    exerciseGuideText(exercise.exercise_id)?.purpose ??
    'Nhóm tập chính trong lịch: ' + muscleLabels[exercise.muscle_group] + '.'
  );
}
