import { create } from 'zustand';
import type { DatabaseService } from '../../../services/databaseService';
import type { HealthProfile, Goal } from '../types';
import { DEFAULT_HEALTH_PROFILE } from '../types';

/* ------------------------------------------------------------------ */
/*  SQLite row types (snake_case)                                      */
/* ------------------------------------------------------------------ */
interface ProfileRow {
  id: string;
  gender: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity_level: string;
  body_fat_pct: number | null;
  bmr_override: number | null;
  protein_ratio: number;
  fat_pct: number;
  updated_at: string;
}

interface GoalRow {
  id: string;
  type: string;
  rate_of_change: string;
  target_weight_kg: number | null;
  calorie_offset: number;
  start_date: string;
  end_date: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/*  Row ↔ Type conversion helpers                                      */
/* ------------------------------------------------------------------ */
function rowToProfile(row: ProfileRow): HealthProfile {
  return {
    id: row.id,
    gender: row.gender as HealthProfile['gender'],
    age: row.age,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    activityLevel: row.activity_level as HealthProfile['activityLevel'],
    bodyFatPct: row.body_fat_pct ?? undefined,
    bmrOverride: row.bmr_override ?? undefined,
    proteinRatio: row.protein_ratio,
    fatPct: row.fat_pct,
    updatedAt: row.updated_at,
  };
}

function rowToGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    type: row.type as Goal['type'],
    rateOfChange: row.rate_of_change as Goal['rateOfChange'],
    targetWeightKg: row.target_weight_kg ?? undefined,
    calorieOffset: row.calorie_offset,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/* ------------------------------------------------------------------ */
/*  Store interface                                                     */
/* ------------------------------------------------------------------ */
export interface HealthProfileState {
  profile: HealthProfile;
  activeGoal: Goal | null;
  loading: boolean;

  loadProfile: (db: DatabaseService) => Promise<void>;
  saveProfile: (db: DatabaseService, profile: HealthProfile) => Promise<void>;

  loadActiveGoal: (db: DatabaseService) => Promise<void>;
  saveGoal: (db: DatabaseService, goal: Goal) => Promise<void>;
  deactivateAllGoals: (db: DatabaseService) => Promise<void>;
}

/* ------------------------------------------------------------------ */
/*  Store implementation                                                */
/* ------------------------------------------------------------------ */
export const useHealthProfileStore = create<HealthProfileState>((set) => ({
  profile: { ...DEFAULT_HEALTH_PROFILE },
  activeGoal: null,
  loading: false,

  loadProfile: async (db: DatabaseService) => {
    set({ loading: true });
    try {
      const row = await db.queryOne<ProfileRow>(
        "SELECT * FROM user_profile WHERE id = 'default'",
      );
      set({ profile: row ? rowToProfile(row) : { ...DEFAULT_HEALTH_PROFILE } });
    } finally {
      set({ loading: false });
    }
  },

  saveProfile: async (db: DatabaseService, profile: HealthProfile) => {
    const now = new Date().toISOString();
    const saved: HealthProfile = { ...profile, updatedAt: now };

    await db.execute(
      `INSERT OR REPLACE INTO user_profile
         (id, gender, age, height_cm, weight_kg, activity_level,
          body_fat_pct, bmr_override, protein_ratio, fat_pct, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        saved.id,
        saved.gender,
        saved.age,
        saved.heightCm,
        saved.weightKg,
        saved.activityLevel,
        saved.bodyFatPct ?? null,
        saved.bmrOverride ?? null,
        saved.proteinRatio,
        saved.fatPct,
        saved.updatedAt,
      ],
    );

    set({ profile: saved });
  },

  loadActiveGoal: async (db: DatabaseService) => {
    set({ loading: true });
    try {
      const row = await db.queryOne<GoalRow>(
        'SELECT * FROM goals WHERE is_active = 1 LIMIT 1',
      );
      set({ activeGoal: row ? rowToGoal(row) : null });
    } finally {
      set({ loading: false });
    }
  },

  saveGoal: async (db: DatabaseService, goal: Goal) => {
    const now = new Date().toISOString();

    await db.execute('UPDATE goals SET is_active = 0, updated_at = ? WHERE is_active = 1', [
      now,
    ]);

    const saved: Goal = { ...goal, isActive: true, updatedAt: now };

    await db.execute(
      `INSERT OR REPLACE INTO goals
         (id, type, rate_of_change, target_weight_kg, calorie_offset,
          start_date, end_date, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        saved.id,
        saved.type,
        saved.rateOfChange,
        saved.targetWeightKg ?? null,
        saved.calorieOffset,
        saved.startDate,
        saved.endDate ?? null,
        saved.isActive ? 1 : 0,
        saved.createdAt,
        saved.updatedAt,
      ],
    );

    set({ activeGoal: saved });
  },

  deactivateAllGoals: async (db: DatabaseService) => {
    const now = new Date().toISOString();
    await db.execute('UPDATE goals SET is_active = 0, updated_at = ? WHERE is_active = 1', [
      now,
    ]);
    set({ activeGoal: null });
  },
}));
