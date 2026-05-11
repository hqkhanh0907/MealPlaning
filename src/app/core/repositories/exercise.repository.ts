import { inject, Injectable } from '@angular/core';
import { Database } from '../services/database/database';
import type { Exercise, MuscleGroup } from '../models/fitness.types';
import { FITNESS_SEED_VERSION, SEED_EXERCISES } from './fitness-seed';

export interface ExerciseFilter {
  query?: string;
  muscleGroup?: MuscleGroup;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ExerciseRepository {
  private readonly db = inject(Database);

  async ensureSeedExercises(): Promise<number> {
    const version = await this.db.getOne<{ value: string }>(
      `SELECT value FROM app_config WHERE key = 'fitness_seed_version'`,
    );
    if (version?.value === FITNESS_SEED_VERSION) {
      return this.count();
    }

    await this.db.withTransaction(async () => {
      for (const exercise of SEED_EXERCISES) {
        await this.db.execute(
          `INSERT INTO exercise (
             id, name, name_vi, muscle_group, category, equipment, instructions, source
           ) VALUES (?, ?, ?, ?, ?, ?, ?, 'db')
           ON CONFLICT(id) DO UPDATE SET
             name = excluded.name,
             name_vi = excluded.name_vi,
             muscle_group = excluded.muscle_group,
             category = excluded.category,
             equipment = excluded.equipment,
             instructions = excluded.instructions
           WHERE exercise.source = 'db'`,
          [
            exercise.id,
            exercise.name,
            exercise.name_vi,
            exercise.muscle_group,
            exercise.category,
            exercise.equipment,
            exercise.instructions,
          ],
        );
      }

      await this.db.execute(
        `INSERT INTO app_config (key, value, updated_at)
         VALUES ('fitness_seed_version', ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
        [FITNESS_SEED_VERSION],
      );
    });

    return this.count();
  }

  async count(): Promise<number> {
    const row = await this.db.getOne<{ count: number }>(`SELECT COUNT(*) AS count FROM exercise`);
    return row?.count ?? 0;
  }

  async list(filter: ExerciseFilter = {}): Promise<Exercise[]> {
    const clauses: string[] = [];
    const params: unknown[] = [];

    if (filter.muscleGroup) {
      clauses.push('muscle_group = ?');
      params.push(filter.muscleGroup);
    }

    const q = filter.query?.trim();
    if (q) {
      clauses.push('(name LIKE ? OR name_vi LIKE ? OR equipment LIKE ?)');
      const pattern = `%${q}%`;
      params.push(pattern, pattern, pattern);
    }

    const limit = Math.max(1, Math.min(filter.limit ?? 100, 200));
    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

    return this.db.query<Exercise>(
      `SELECT id, name, name_vi, muscle_group, category, equipment, instructions, source, created_at
         FROM exercise
         ${where}
        ORDER BY
          CASE category WHEN 'compound' THEN 0 WHEN 'isolation' THEN 1 ELSE 2 END,
          name_vi COLLATE NOCASE ASC
        LIMIT ?`,
      [...params, limit],
    );
  }
}
