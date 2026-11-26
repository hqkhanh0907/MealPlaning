import { inject, Injectable } from '@angular/core';
import { Database } from '../services/database/database';

const configKey = 'fitness_exercise_places';
const configVersion = 1;

export interface ExercisePlace {
  id: string;
  name: string;
  equipment: readonly string[] | null;
}

export const defaultExercisePlaces: readonly ExercisePlace[] = [
  { id: 'b4e9c054-0537-43af-8985-2a8f71e1fbbf', name: 'Nhà', equipment: null },
  { id: 'ed35d641-b355-493a-ad5f-6e055a6d0708', name: 'Phòng gym', equipment: null },
  { id: '47229611-954e-4ec6-92c1-cd61176fc16c', name: 'Ngoài trời', equipment: null },
];

@Injectable({ providedIn: 'root' })
export class ExercisePlaceRepository {
  private readonly db = inject(Database);
  private pendingSave: Promise<void> = Promise.resolve();

  async list(): Promise<readonly ExercisePlace[]> {
    const row = await this.db.getOne<{ value: string }>(
      'SELECT value FROM app_config WHERE key = ?',
      [configKey],
    );

    const saved = new Map<string, ExercisePlace>();
    for (const item of readPlaces(row?.value)) {
      const place = readPlace(item);
      if (place) saved.set(place.id, place);
    }

    return defaultExercisePlaces.map((place) => saved.get(place.id) ?? { ...place });
  }

  async save(place: ExercisePlace): Promise<readonly ExercisePlace[]> {
    const next = readPlace(place);
    if (!next || !defaultExercisePlaces.some(({ id }) => id === next.id)) {
      throw new Error('Hồ sơ nơi tập không hợp lệ.');
    }

    const saved = this.pendingSave.then(async () => {
      const current = await this.list();
      const places = current.map((item) => (item.id === next.id ? next : item));
      await this.db.executeAtomically([
        {
          statement: `INSERT INTO app_config (key, value, updated_at) VALUES (?, ?, datetime('now'))
                      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
          values: [configKey, JSON.stringify({ version: configVersion, places })],
        },
      ]);
      return places;
    });

    this.pendingSave = saved.then(
      () => undefined,
      () => undefined,
    );
    return saved;
  }
}

function readPlaces(raw: string | undefined): readonly unknown[] {
  if (raw === undefined) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (
      value &&
      typeof value === 'object' &&
      'version' in value &&
      value.version === configVersion &&
      'places' in value &&
      Array.isArray(value.places)
    ) {
      return value.places;
    }
  } catch {
    return [];
  }
  return [];
}

function readPlace(value: unknown): ExercisePlace | null {
  if (!value || typeof value !== 'object') return null;
  const { id, name, equipment } = value as Record<string, unknown>;
  if (typeof id !== 'string' || typeof name !== 'string' || !name.trim()) return null;
  if (
    equipment !== null &&
    (!Array.isArray(equipment) || !equipment.every((key: unknown) => typeof key === 'string'))
  ) {
    return null;
  }
  return { id, name: name.trim(), equipment: equipment === null ? null : [...equipment] };
}
