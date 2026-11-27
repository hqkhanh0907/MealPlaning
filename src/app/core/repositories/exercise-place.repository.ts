import { inject, Injectable } from '@angular/core';
import { Database } from '../services/database/database';

const placePrefix = 'fitness_exercise_place:';
const defaultKey = 'fitness_default_place';

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

  async getDefaultId(): Promise<string | null> {
    const row = await this.db.getOne<{ value: string }>(
      'SELECT value FROM workout_preference WHERE key = ?',
      [defaultKey],
    );
    if (!row) return null;
    return defaultExercisePlaces.some((place) => place.id === row.value) ? row.value : null;
  }

  async setDefaultId(id: string): Promise<void> {
    if (!defaultExercisePlaces.some((place) => place.id === id))
      throw new Error('Nơi tập không hợp lệ.');
    await this.db.execute(
      `INSERT INTO workout_preference (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
       WHERE workout_preference.value IS NOT excluded.value`,
      [defaultKey, id],
    );
  }

  async list(): Promise<readonly ExercisePlace[]> {
    const rows = await this.db.query<{ key: string; value: string }>(
      'SELECT key, value FROM workout_preference WHERE key GLOB ?',
      [placePrefix + '*'],
    );
    const saved = new Map<string, ExercisePlace>();
    for (const row of rows) {
      try {
        const place = readPlace(JSON.parse(row.value));
        if (place && row.key === placePrefix + place.id) saved.set(place.id, place);
      } catch {
        continue;
      }
    }

    return defaultExercisePlaces.map((place) => saved.get(place.id) ?? { ...place });
  }

  async save(place: ExercisePlace): Promise<readonly ExercisePlace[]> {
    const next = readPlace(place);
    if (!next || !defaultExercisePlaces.some(({ id }) => id === next.id)) {
      throw new Error('Hồ sơ nơi tập không hợp lệ.');
    }

    const saved = this.pendingSave.then(async () => {
      await this.db.executeAtomically([
        {
          statement: `INSERT INTO workout_preference (key, value, updated_at) VALUES (?, ?, datetime('now'))
                      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
                      WHERE workout_preference.value IS NOT excluded.value`,
          values: [placePrefix + next.id, JSON.stringify(next)],
        },
      ]);
      return this.list();
    });

    this.pendingSave = saved.then(
      () => undefined,
      () => undefined,
    );
    return saved;
  }
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
