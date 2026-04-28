/**
 * Legacy sql.js localStorage → Native SQLite migrator
 *
 * One-shot, idempotent, non-destructive import used ONLY on native platforms
 * when the fresh native SQLite DB is empty and a pre-existing sql.js blob
 * from the previous Web-only build is found in localStorage.
 *
 * Design choices:
 *  - Read-only: never writes back to localStorage; old key is preserved as
 *    fallback until the team is confident to drop it in a future release.
 *  - Scope: imports only `user_profile` (singleton). Other tables are seeds
 *    (ingredient/exercise etc.) and will be rebuilt from schema fixtures.
 *  - Timeout: wrapped by caller so startup cannot block indefinitely.
 */
import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import { Database } from './database';
import { UserProfile } from '../../models/user-profile.model';

/** Known legacy localStorage keys from the Web-only build. */
const LEGACY_KEYS = ['sqljs_healthmate.db', 'sqljs_healthmate_dev.db'] as const;

export interface LegacyMigrationResult {
  readonly attempted: boolean;
  readonly imported: boolean;
  readonly reason?: string;
  readonly sourceKey?: string;
}

export class LegacySqlJsMigrator {
  constructor(private readonly db: Database) {}

  /**
   * Import legacy user_profile into native DB if and only if:
   *  - a legacy localStorage key exists, AND
   *  - native DB has no user_profile row yet.
   *
   * Never throws — returns a structured result and logs failures.
   */
  async migrate(): Promise<LegacyMigrationResult> {
    const legacyBlob = this.readLegacyBlob();
    if (!legacyBlob) return { attempted: false, imported: false, reason: 'no-legacy-key' };

    try {
      const existing = await this.db.getOne<{ c: number }>(
        'SELECT COUNT(*) as c FROM user_profile',
      );
      if ((existing?.c ?? 0) > 0) {
        return { attempted: false, imported: false, reason: 'native-already-populated' };
      }

      const profile = await this.extractProfile(legacyBlob.buffer);
      if (!profile) {
        return {
          attempted: true,
          imported: false,
          reason: 'no-profile-in-legacy',
          sourceKey: legacyBlob.key,
        };
      }

      await this.insertProfile(profile);
      // eslint-disable-next-line no-console
      console.info(`[LegacyMigrator] imported user_profile from ${legacyBlob.key} → native SQLite`);
      return { attempted: true, imported: true, sourceKey: legacyBlob.key };
    } catch (err) {
      console.warn('[LegacyMigrator] import failed, continuing with empty native DB', err);
      return {
        attempted: true,
        imported: false,
        reason: err instanceof Error ? err.message : 'unknown',
        sourceKey: legacyBlob.key,
      };
    }
  }

  private readLegacyBlob(): { key: string; buffer: Uint8Array } | null {
    if (typeof localStorage === 'undefined') return null;
    for (const key of LEGACY_KEYS) {
      const base64 = localStorage.getItem(key);
      if (!base64) continue;
      try {
        const buffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        return { key, buffer };
      } catch {
        continue;
      }
    }
    return null;
  }

  private async extractProfile(buffer: Uint8Array): Promise<UserProfile | null> {
    let legacyDb: SqlJsDatabase | null = null;
    try {
      const SQL = await initSqlJs({ locateFile: (f: string) => `assets/sql.js/${f}` });
      legacyDb = new SQL.Database(buffer);
      const res = legacyDb.exec('SELECT * FROM user_profile LIMIT 1');
      if (res.length === 0 || res[0].values.length === 0) return null;
      const cols = res[0].columns;
      const row = res[0].values[0];
      const obj: Record<string, unknown> = {};
      cols.forEach((col, i) => (obj[col] = row[i]));
      return obj as unknown as UserProfile;
    } finally {
      legacyDb?.close();
    }
  }

  private async insertProfile(p: UserProfile): Promise<void> {
    await this.db.execute(
      `INSERT INTO user_profile (
        id, height_cm, weight_kg, age, gender, goal, fitness_level,
        activity_factor, bmr, tdee, target_calories, target_protein,
        target_carbs, target_fat, theme,
        notif_morning, notif_lunch, notif_evening, notif_weekly,
        onboarding_completed, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id,
        p.height_cm,
        p.weight_kg,
        p.age,
        p.gender,
        p.goal,
        p.fitness_level,
        p.activity_factor,
        p.bmr,
        p.tdee,
        p.target_calories,
        p.target_protein,
        p.target_carbs,
        p.target_fat,
        p.theme,
        p.notif_morning,
        p.notif_lunch,
        p.notif_evening,
        p.notif_weekly,
        p.onboarding_completed,
        p.created_at ?? new Date().toISOString(),
        p.updated_at ?? null,
      ],
    );
  }
}
