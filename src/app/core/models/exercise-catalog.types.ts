import type { ExerciseGuideText } from './exercise-guide.types';
import type { MuscleGroup } from './fitness.types';

export type SourceFrame = 'start' | 'mid' | 'end' | 'hold';

export interface SourceCatalogVariant {
  id: string;
  name: string;
  difference?: string;
}

export interface SourceCatalogEntry {
  id: string;
  name: string;
  aliases: readonly string[];
  variants: readonly SourceCatalogVariant[];
  equipment: readonly string[];
  equipmentLabel: string | null;
  primaryMuscles: readonly string[];
  secondaryMuscles: readonly string[];
  movementPattern: string;
  category: string;
  unilateral: boolean;
  frames: readonly SourceFrame[];
  width: number;
  height: number;
}
export type CatalogDiscoveryMuscle = MuscleGroup | 'adductors' | 'neck' | 'hip-flexors';

interface ReviewChange<T> {
  before: T;
  after: T;
}

export interface ExerciseCatalogCorrection {
  primary?: ReviewChange<readonly CatalogDiscoveryMuscle[]>;
  secondary?: ReviewChange<readonly CatalogDiscoveryMuscle[]>;
  required?: ReviewChange<readonly string[] | null>;
  perSide?: ReviewChange<boolean>;
  movementPattern?: ReviewChange<string>;
  guide?: ReviewChange<
    Partial<
      Pick<
        ExerciseGuideText,
        'equipment' | 'startPosition' | 'steps' | 'purpose' | 'source' | 'sourceUrl' | 'alt'
      >
    >
  >;
  illustrationNote?: ReviewChange<string | null>;
  source: string;
  supportingSources?: readonly string[];
  reason: string;
}
