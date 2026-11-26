import { sourceCatalogEntries } from './exercise-catalog.generated';
import {
  equipmentLabels,
  equipmentReviews,
  exerciseCatalogCorrection,
} from './exercise-catalog-review.data';
import type { CatalogDiscoveryMuscle, SourceCatalogEntry } from './exercise-catalog.types';
import type { ExerciseCategory, MuscleGroup } from './fitness.types';

const entriesById = new Map(sourceCatalogEntries.map((entry) => [entry.id, entry]));

const muscleGroups: Readonly<Record<string, MuscleGroup>> = {
  chest: 'chest',
  back: 'back',
  lats: 'back',
  lower_back: 'back',
  traps: 'back',
  shoulders: 'shoulders',
  neck: 'shoulders',
  biceps: 'biceps',
  triceps: 'triceps',
  quads: 'quads',
  hamstrings: 'hamstrings',
  glutes: 'glutes',
  calves: 'calves',
  tibialis: 'calves',
  core: 'abs',
  obliques: 'abs',
  forearms: 'forearms',
};

const categories: Readonly<Record<string, ExerciseCategory>> = {
  compound: 'compound',
  isolation: 'isolation',
  conditioning: 'compound',
  stretch: 'isolation',
  mobility: 'isolation',
};

export function catalogEntry(exerciseId: string): SourceCatalogEntry | undefined {
  return entriesById.get(exerciseId);
}

export function catalogMuscleGroup(entry: SourceCatalogEntry): MuscleGroup {
  return muscleGroups[entry.primaryMuscles[0]] ?? 'full_body';
}

function discoveryMuscles(tags: readonly string[]): CatalogDiscoveryMuscle[] {
  return [...new Set(tags.map((tag) => muscleGroups[tag]).filter(Boolean))];
}

export function catalogReviewedFacts(entry: SourceCatalogEntry): {
  primary: readonly CatalogDiscoveryMuscle[];
  secondary: readonly CatalogDiscoveryMuscle[];
  required: readonly string[] | null;
  movementPattern: string;
  perSide: boolean;
} {
  const review = exerciseCatalogCorrection(entry.id);
  const gear = equipmentReviews[entry.id];
  const originalGear = entry.equipment;
  const primary = review?.primary?.after ?? discoveryMuscles(entry.primaryMuscles);
  const secondary = review?.secondary?.after ?? discoveryMuscles(entry.secondaryMuscles);
  const required = review?.required
    ? review.required.after
    : gear
      ? gear.required
      : originalGear.every((key) => Object.hasOwn(equipmentLabels, key)) &&
          (originalGear.length || entry.equipmentLabel === 'Bodyweight')
        ? originalGear
        : null;
  return {
    primary,
    secondary: secondary.filter((group) => !primary.includes(group)),
    required,
    movementPattern: review?.movementPattern?.after ?? entry.movementPattern,
    perSide: review?.perSide?.after ?? entry.unilateral,
  };
}

export function catalogCategory(entry: SourceCatalogEntry): ExerciseCategory {
  if (catalogReviewedFacts(entry).movementPattern === 'cardio') return 'cardio';
  return categories[entry.category] ?? 'isolation';
}

export function catalogEquipment(entry: SourceCatalogEntry): string {
  return entry.equipmentLabel ?? 'Bodyweight';
}

export function catalogSearchNames(exerciseId: string): readonly string[] {
  const entry = entriesById.get(exerciseId);
  return entry ? [...entry.aliases, ...entry.variants.map((variant) => variant.name)] : [];
}
