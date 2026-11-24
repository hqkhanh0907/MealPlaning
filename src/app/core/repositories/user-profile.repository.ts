import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../services/database/database';
import { UserProfile } from '../models/user-profile.model';
import {
  updateMeasurementTargets,
  validateProfileChanges,
} from '../services/profile/profile-measurement-update';

type UserProfileUpdateColumn = Exclude<keyof UserProfile, 'id' | 'created_at' | 'updated_at'>;

export interface WeightLogEntry {
  id: string;
  weight_kg: number;
  date: string;
  notes: string | null;
  created_at: string;
}

const USER_PROFILE_UPDATE_COLUMNS = new Set<string>([
  'height_cm',
  'weight_kg',
  'age',
  'birth_date',
  'gender',
  'goal',
  'fitness_level',
  'activity_factor',
  'bmr',
  'tdee',
  'target_calories',
  'calorie_target_mode',
  'target_protein',
  'protein_target_mode',
  'target_carbs',
  'target_fat',
  'theme',
  'notif_morning',
  'notif_lunch',
  'notif_evening',
  'notif_weekly',
  'onboarding_completed',
]);

@Injectable({ providedIn: 'root' })
export class UserProfileRepository {
  private readonly db = inject(Database);

  async getProfile(): Promise<UserProfile | null> {
    return this.db.getOne<UserProfile>('SELECT * FROM user_profile LIMIT 1');
  }

  async getLatestWeightLog(): Promise<WeightLogEntry | null> {
    return this.db.getOne<WeightLogEntry>(
      `SELECT id, weight_kg, date, notes, created_at
         FROM weight_log
        ORDER BY date DESC
        LIMIT 1`,
    );
  }

  async getPreviousWeightLog(beforeDate: string): Promise<WeightLogEntry | null> {
    return this.db.getOne<WeightLogEntry>(
      `SELECT id, weight_kg, date, notes, created_at
         FROM weight_log
        WHERE date < ?
        ORDER BY date DESC
        LIMIT 1`,
      [beforeDate],
    );
  }

  /**
   * Insert the singleton user_profile row.
   *
   * Idempotent by design: if a profile already exists, the existing row is
   * returned unchanged. To replace profile values, call {@link update}.
   * This prevents duplicate rows when onboarding is accidentally re-run
   * (e.g. navigation race, WebView restore, or legacy migration edge cases).
   */
  async insert(
    input: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>,
    today = new Date(),
  ): Promise<UserProfile> {
    const existing = await this.getProfile();
    if (existing) {
      console.warn(
        '[UserProfileRepository] insert() called but profile already exists; returning existing row',
      );
      return existing;
    }

    validateProfileChanges(input, null, today);
    const initial = {
      ...input,
      calorie_target_mode: input.calorie_target_mode ?? 'manual',
      protein_target_mode: input.protein_target_mode ?? 'manual',
    };
    const data = { ...initial, ...updateMeasurementTargets(initial, { age: input.age }, today) };
    const id = uuidv4();
    await this.db.execute(
      `INSERT INTO user_profile (
        id, height_cm, weight_kg, age, gender, goal, fitness_level,
        activity_factor, bmr, tdee, target_calories, target_protein,
        target_carbs, target_fat, theme,
        notif_morning, notif_lunch, notif_evening, notif_weekly,
        onboarding_completed, calorie_target_mode, protein_target_mode, birth_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.height_cm,
        data.weight_kg,
        data.age,
        data.gender,
        data.goal,
        data.fitness_level,
        data.activity_factor,
        data.bmr,
        data.tdee,
        data.target_calories,
        data.target_protein,
        data.target_carbs,
        data.target_fat,
        data.theme,
        data.notif_morning,
        data.notif_lunch,
        data.notif_evening,
        data.notif_weekly,
        data.onboarding_completed,
        data.calorie_target_mode,
        data.protein_target_mode,
        data.birth_date ?? null,
      ],
    );
    return (await this.getProfile())!;
  }

  async update(data: Partial<UserProfile>, today = new Date()): Promise<void> {
    const fields: [UserProfileUpdateColumn, unknown][] = [];
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) {
        continue;
      }
      if (!USER_PROFILE_UPDATE_COLUMNS.has(key)) {
        throw new Error(`UserProfileRepository: update field '${key}' is not allowed.`);
      }
      fields.push([key as UserProfileUpdateColumn, value]);
    }
    if (fields.length === 0) return;

    const current = await this.getProfile();
    if (!current) return;
    const patch: Partial<UserProfile> = Object.fromEntries(fields);
    validateProfileChanges(patch, current, today);
    const changes = Object.entries(updateMeasurementTargets(current, patch, today));
    const setClauses = changes.map(([key]) => `${key} = ?`).join(', ');
    const values = changes.map(([, value]) => value);

    await this.db.execute(
      `UPDATE user_profile SET ${setClauses}, updated_at = datetime('now') WHERE id = ?`,
      [...values, current.id],
    );
  }
}
