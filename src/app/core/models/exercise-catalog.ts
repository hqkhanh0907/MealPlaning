import { sourceCatalogEntries } from './exercise-catalog.generated';
import type { SourceCatalogEntry } from './exercise-catalog.types';
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

export function catalogCategory(entry: SourceCatalogEntry): ExerciseCategory {
  if (entry.movementPattern === 'cardio') return 'cardio';
  return categories[entry.category] ?? 'isolation';
}

export function catalogEquipment(entry: SourceCatalogEntry): string {
  return entry.equipmentLabel ?? 'Bodyweight';
}

export function catalogSearchNames(exerciseId: string): readonly string[] {
  const entry = entriesById.get(exerciseId);
  return entry ? [...entry.aliases, ...entry.variants.map((variant) => variant.name)] : [];
}
