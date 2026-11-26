import { normalize } from '../utils/fuzzy-match';
import { catalogEntry, catalogReviewedFacts, catalogSearchNames } from './exercise-catalog';
import { equipmentLabels } from './exercise-catalog-review.data';
import type { CatalogDiscoveryMuscle } from './exercise-catalog.types';
import { muscleLabels, type Exercise } from './fitness.types';

export const discoveryMuscleLabels: Readonly<Record<CatalogDiscoveryMuscle, string>> = {
  ...muscleLabels,
  adductors: 'Đùi trong',
  neck: 'Cổ',
  'hip-flexors': 'Cơ gập hông',
};

const genericEquipment: Readonly<Record<string, string>> = {
  'no-equipment': 'Không cần dụng cụ',
  machine: 'Máy sức mạnh',
  'cardio-machine': 'Máy cardio',
};

const equipmentAlsoProvides = [
  ['dual-cable', 'cable'],
  ['cable-handle-pair', 'cable-single-handle'],
  ['incline-treadmill', 'treadmill'],
  ['muscle-up-bar', 'pull-up-bar'],
  ['hex-dumbbell', 'dumbbell'],
];

function expandEquipment(keys: readonly string[]): Set<string> {
  const equipment = new Set(keys);
  for (const [specific, standard] of equipmentAlsoProvides) {
    if (equipment.has(specific)) equipment.add(standard);
  }
  return equipment;
}

export const inventoryChoices = Object.entries(equipmentLabels).sort(([, a], [, b]) =>
  a.localeCompare(b, 'vi'),
);
export const equipmentFilterChoices = [
  ['no-equipment', genericEquipment['no-equipment']],
  ['dumbbell', equipmentLabels['dumbbell']],
  ['barbell', equipmentLabels['barbell']],
  ['pull-up-bar', equipmentLabels['pull-up-bar']],
  ['machine', genericEquipment['machine']],
  ['cardio-machine', genericEquipment['cardio-machine']],
  ...inventoryChoices.filter(([key]) => !['dumbbell', 'barbell', 'pull-up-bar'].includes(key)),
];

const legacyEquipment = new Map<string, string>([
  ...inventoryChoices.map(([key, label]): [string, string] => [normalize(label), key]),
  ...inventoryChoices.map(([key]): [string, string] => [normalize(key), key]),
  ['bodyweight', 'no-equipment'],
  ['dumbbells', 'dumbbell'],
  ['pull-up bar', 'pull-up-bar'],
  ['cable machine', 'cable'],
  ['machine', 'machine'],
]);

export interface ExerciseDiscoveryEntry {
  exercise: Exercise;
  primary: readonly CatalogDiscoveryMuscle[];
  secondary: readonly CatalogDiscoveryMuscle[];
  required: readonly string[] | null;
  equipment: readonly string[];
  searchTerms: readonly string[];
}

export interface ExerciseDiscoveryFilters {
  query: string;
  muscle: CatalogDiscoveryMuscle | null;
  equipment: string | null;
  available: readonly string[] | null;
}

export interface ExerciseDiscoveryResult extends ExerciseDiscoveryEntry {
  muscleMatch: 'primary' | 'secondary' | null;
}

export function exerciseEquipmentLabel(key: string): string {
  return equipmentLabels[key] ?? genericEquipment[key] ?? key;
}

export function indexExercise(exercise: Exercise): ExerciseDiscoveryEntry {
  const entry = exercise.source === 'db' ? catalogEntry(exercise.id) : undefined;
  const reviewed = entry && catalogReviewedFacts(entry);
  const primary = reviewed?.primary ?? [];
  const original = entry?.equipment ?? [];
  const required = reviewed?.required ?? null;
  const legacy = !entry && exercise.equipment && legacyEquipment.get(normalize(exercise.equipment));
  const equipment = expandEquipment(required ?? original);
  if (legacy) equipment.add(legacy);
  if (required?.length === 0) equipment.add('no-equipment');
  for (const key of ['machine', 'cardio-machine', 'cable']) {
    if (original.includes(key)) equipment.add(key);
  }

  return {
    exercise,
    primary: primary.length ? primary : [exercise.muscle_group],
    secondary: reviewed?.secondary ?? [],
    required,
    equipment: [...equipment],
    searchTerms: [
      exercise.name,
      exercise.name_vi,
      exercise.equipment,
      ...(entry ? catalogSearchNames(entry.id) : []),
    ]
      .filter((term): term is string => !!term)
      .map(normalize),
  };
}

export function filterExerciseIndex(
  index: readonly ExerciseDiscoveryEntry[],
  filters: ExerciseDiscoveryFilters,
): ExerciseDiscoveryResult[] {
  const query = normalize(filters.query);
  const available = filters.available && expandEquipment(filters.available);
  const first: ExerciseDiscoveryResult[] = [];
  const supporting: ExerciseDiscoveryResult[] = [];
  const included = new Set<string>();

  for (const entry of index) {
    if (included.has(entry.exercise.id)) continue;
    if (query && !entry.searchTerms.some((term) => term.includes(query))) continue;
    if (filters.equipment && !entry.equipment.includes(filters.equipment)) continue;
    if (
      available &&
      (entry.required === null || !entry.required.every((key) => available.has(key)))
    )
      continue;

    const muscle = filters.muscle;
    const primary = muscle && entry.primary.includes(muscle);
    if (muscle && !primary && !entry.secondary.includes(muscle)) continue;

    included.add(entry.exercise.id);
    if (muscle && !primary) supporting.push({ ...entry, muscleMatch: 'secondary' });
    else first.push({ ...entry, muscleMatch: muscle ? 'primary' : null });
  }

  return first.concat(supporting);
}
