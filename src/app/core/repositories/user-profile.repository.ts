import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../services/database/database.service';
import { UserProfile } from '../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class UserProfileRepository {
  private readonly db = inject(DatabaseService);

  async getProfile(): Promise<UserProfile | null> {
    return this.db.getOne<UserProfile>('SELECT * FROM user_profile LIMIT 1');
  }

  /**
   * Insert the singleton user_profile row.
   *
   * Idempotent by design: if a profile already exists, the existing row is
   * returned unchanged. To replace profile values, call {@link update}.
   * This prevents duplicate rows when onboarding is accidentally re-run
   * (e.g. navigation race, WebView restore, or legacy migration edge cases).
   */
  async insert(data: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile> {
    const existing = await this.getProfile();
    if (existing) {
      console.warn(
        '[UserProfileRepository] insert() called but profile already exists; returning existing row',
      );
      return existing;
    }

    const id = uuidv4();
    await this.db.execute(
      `INSERT INTO user_profile (
        id, height_cm, weight_kg, age, gender, goal, fitness_level,
        activity_factor, bmr, tdee, target_calories, target_protein,
        target_carbs, target_fat, theme,
        notif_morning, notif_lunch, notif_evening, notif_weekly,
        onboarding_completed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      ],
    );
    return (await this.getProfile())!;
  }

  async update(data: Partial<UserProfile>): Promise<void> {
    const fields = Object.entries(data).filter(([key]) => key !== 'id' && key !== 'created_at');
    if (fields.length === 0) return;

    const setClauses = fields.map(([key]) => `${key} = ?`).join(', ');
    const values = fields.map(([, value]) => value);

    await this.db.execute(
      `UPDATE user_profile SET ${setClauses}, updated_at = datetime('now')`,
      values,
    );
  }
}
