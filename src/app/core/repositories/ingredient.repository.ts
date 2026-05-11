import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import type { IngredientModel } from '../models/management.model';
import type { IngredientSource } from '../models/management.types';
import { Database } from '../services/database/database';
import { normalize as normalizeForMatch } from '../utils/fuzzy-match';

/**
 * Ingredient repository — gram-only revision (schema v6).
 *
 * Tất cả nutrition lưu per-100g. Không còn unit/ingredient_unit JOIN.
 * Form/UI luôn nhập gram trực tiếp.
 */

export type IngredientListItem = IngredientModel;

export interface CreateIngredientInput {
  name: string;
  category: string;
  /** kcal per 100 g */
  calories: number;
  /** g per 100 g */
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  source: IngredientSource;
}

export type UpdateIngredientInput = Partial<CreateIngredientInput>;

type IngredientRow = IngredientModel;
type IngredientUpdateColumn = Exclude<keyof CreateIngredientInput, 'source'>;

const INGREDIENT_UPDATE_COLUMNS = new Set<string>([
  'name',
  'category',
  'calories',
  'protein',
  'carbs',
  'fat',
  'fiber',
]);

@Injectable({ providedIn: 'root' })
export class IngredientRepository {
  private readonly db = inject(Database);

  async list(): Promise<IngredientListItem[]> {
    return this.db.query<IngredientRow>(
      'SELECT * FROM ingredient ORDER BY name COLLATE NOCASE ASC',
    );
  }

  async searchByName(query: string): Promise<IngredientListItem[]> {
    return this.db.query<IngredientRow>(
      'SELECT * FROM ingredient WHERE name LIKE ? ORDER BY name COLLATE NOCASE ASC',
      [`%${query}%`],
    );
  }

  /**
   * Returns ingredients ordered by most recent dish usage (MRU).
   * Used by the ingredient picker in dish-edit to surface "Gần đây".
   */
  async findRecentlyUsed(limit: number): Promise<IngredientListItem[]> {
    return this.db.query<IngredientRow>(
      `SELECT i.*
       FROM ingredient i
       INNER JOIN (
         SELECT di.ingredient_id,
                MAX(COALESCE(d.updated_at, d.created_at)) AS last_used
           FROM dish_ingredient di
           INNER JOIN dish d ON d.id = di.dish_id
         GROUP BY di.ingredient_id
       ) recent ON recent.ingredient_id = i.id
       ORDER BY recent.last_used DESC
       LIMIT ?`,
      [limit],
    );
  }

  async getById(id: string): Promise<IngredientListItem | null> {
    const ingredient = await this.db.getOne<IngredientRow>(
      'SELECT * FROM ingredient WHERE id = ?',
      [id],
    );
    return ingredient ?? null;
  }

  /**
   * Batch-fetch ingredients theo list `id`. Trả về array đúng thứ tự `ids`
   * truyền vào (dropping rows không tồn tại). Dùng cho F-02 sau khi commit
   * AI autofill transaction để bulk-merge cache.
   */
  async findByIds(ids: readonly string[]): Promise<IngredientListItem[]> {
    if (ids.length === 0) {
      return [];
    }
    const placeholders = ids.map(() => '?').join(',');
    const rows = await this.db.query<IngredientRow>(
      `SELECT * FROM ingredient WHERE id IN (${placeholders})`,
      [...ids],
    );
    const byId = new Map(rows.map((row) => [row.id, row]));
    const ordered: IngredientListItem[] = [];
    for (const id of ids) {
      const row = byId.get(id);
      if (row) ordered.push(row);
    }
    return ordered;
  }

  /**
   * Tìm ingredient có tên trùng (case-insensitive + bỏ dấu) với `name`.
   * Dùng cho F-02 trước khi insert ingredient mới từ AI để tránh duplicate.
   *
   * Implementation: load list của tất cả ingredient + so sánh normalized
   * client-side (SQLite không có hàm Vietnamese-aware built-in). Volume
   * thực tế ~vài trăm row, cost negligible. Stop ở match đầu tiên.
   */
  async findByExactName(name: string): Promise<IngredientListItem | null> {
    const normalizedTarget = normalizeForMatch(name);
    if (normalizedTarget === '') {
      return null;
    }
    const all = await this.db.query<IngredientRow>('SELECT * FROM ingredient');
    for (const row of all) {
      if (normalizeForMatch(row.name) === normalizedTarget) {
        return row;
      }
    }
    return null;
  }

  async insert(data: CreateIngredientInput): Promise<IngredientListItem> {
    const id = uuidv4();
    await this.db.execute(
      `INSERT INTO ingredient (
        id, name, category, calories, protein, carbs, fat, fiber, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.category,
        data.calories,
        data.protein,
        data.carbs,
        data.fat,
        data.fiber,
        data.source,
      ],
    );

    return (await this.getById(id)) as IngredientListItem;
  }

  async update(id: string, data: UpdateIngredientInput): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Ingredient '${id}' not found.`);
    }

    const fields: [IngredientUpdateColumn | 'source', unknown][] = [];
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) {
        continue;
      }
      if (key === 'source') {
        continue;
      }
      if (!INGREDIENT_UPDATE_COLUMNS.has(key)) {
        throw new Error(`IngredientRepository: update field '${key}' is not allowed.`);
      }
      fields.push([key as IngredientUpdateColumn, value]);
    }
    fields.push(['source', 'manual']);

    if (fields.length === 0) {
      return;
    }

    const setClause = fields.map(([key]) => `${key} = ?`).join(', ');
    const values = fields.map(([, value]) => value);
    await this.db.execute(
      `UPDATE ingredient SET ${setClause}, updated_at = datetime('now') WHERE id = ?`,
      [...values, id],
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM ingredient WHERE id = ?', [id]);
  }

  async countDishReferences(id: string): Promise<number> {
    const row = await this.db.getOne<{ ref_count: number }>(
      'SELECT COUNT(*) AS ref_count FROM dish_ingredient WHERE ingredient_id = ?',
      [id],
    );
    return row?.ref_count ?? 0;
  }
}
