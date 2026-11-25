import type { ExerciseGuideTextSet } from '../exercise-guide.types';
import { cardioGuides } from './cardio-guides';
import { carryGuides } from './carry-guides';
import { coreGuides } from './core-guides';
import { hingeGuides } from './hinge-guides';
import { isometricGuides } from './isometric-guides';
import { lungeGuides } from './lunge-guides';
import { mobilityGuides } from './mobility-guides';
import { plyoGuides } from './plyo-guides';
import { pullHGuides } from './pull-h-guides';
import { pullVGuides } from './pull-v-guides';
import { pushHGuides } from './push-h-guides';
import { pushVGuides } from './push-v-guides';
import { rotationGuides } from './rotation-guides';
import { squatGuides } from './squat-guides';
import { stretchGuides } from './stretch-guides';

export const vietnameseGuideTexts: ExerciseGuideTextSet = {
  ...cardioGuides,
  ...carryGuides,
  ...coreGuides,
  ...hingeGuides,
  ...isometricGuides,
  ...lungeGuides,
  ...mobilityGuides,
  ...plyoGuides,
  ...pullHGuides,
  ...pullVGuides,
  ...pushHGuides,
  ...pushVGuides,
  ...rotationGuides,
  ...squatGuides,
  ...stretchGuides,
};
