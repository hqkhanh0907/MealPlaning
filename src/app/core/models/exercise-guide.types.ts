import type { SourceFrame } from './exercise-catalog.types';

export interface ExerciseFrame {
  path: string;
  phase: SourceFrame;
  label: string;
}

export interface ExerciseIllustration {
  alt: string;
  frames: readonly ExerciseFrame[];
  stacked: boolean;
  note?: string;
}

export interface ExerciseGuideText {
  nameVi: string;
  equipment: string;
  purpose: string;
  startPosition: string;
  steps: readonly string[];
  source: string;
  sourceUrl: string;
  alt: string;
  measure: 'reps' | 'seconds';
  loadTotalOfTwo?: true;
}

export type ExerciseGuideTextSet = Readonly<Record<string, ExerciseGuideText>>;

export interface ExerciseGuide {
  equipment: string;
  purpose: string;
  startPosition: string;
  steps: readonly string[];
  source: string;
  sourceUrl: string;
  illustration: ExerciseIllustration;
  loadLabel?: string;
  perSide?: true;
  timed: boolean;
}

export const framePhaseLabels: Readonly<Record<SourceFrame, string>> = {
  start: 'Bắt đầu',
  mid: 'Giữa',
  end: 'Kết thúc',
  hold: 'Tư thế giữ',
};

export const movingSingleFrameLabel = 'Tư thế tập';
