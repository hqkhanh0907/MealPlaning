CREATE TABLE profile_with_birth_date (
    id                TEXT PRIMARY KEY,
    height_cm         REAL NOT NULL,
    weight_kg         REAL NOT NULL,
    birth_date        TEXT CHECK (birth_date IS NULL OR (
      birth_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
      AND date(birth_date, '+0 days') IS birth_date)),
    gender            TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    goal              TEXT NOT NULL CHECK (goal IN ('lose_weight', 'gain_muscle', 'maintain', 'performance')),
    fitness_level     TEXT NOT NULL CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
    activity_factor   REAL NOT NULL DEFAULT 1.55,
    bmr               REAL NOT NULL,
    tdee              REAL NOT NULL,
    target_calories   REAL NOT NULL,
    target_protein    REAL NOT NULL,
    target_carbs      REAL,
    target_fat        REAL,
    theme             TEXT NOT NULL DEFAULT 'light' CHECK (theme = 'light'),
    notif_morning     INTEGER NOT NULL DEFAULT 1,
    notif_lunch       INTEGER NOT NULL DEFAULT 1,
    notif_evening     INTEGER NOT NULL DEFAULT 1,
    notif_weekly      INTEGER NOT NULL DEFAULT 1,
    onboarding_completed INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT,
    calorie_target_mode TEXT NOT NULL DEFAULT 'manual' CHECK (calorie_target_mode IN ('auto','manual')),
    protein_target_mode TEXT NOT NULL DEFAULT 'manual' CHECK (protein_target_mode IN ('auto','manual'))
  );

INSERT INTO profile_with_birth_date (id, height_cm, weight_kg, birth_date, gender, goal, fitness_level, activity_factor,
     bmr, tdee, target_calories, target_protein, target_carbs, target_fat, theme,
     notif_morning, notif_lunch, notif_evening, notif_weekly, onboarding_completed, created_at, updated_at, calorie_target_mode, protein_target_mode) SELECT id, height_cm, weight_kg, birth_date, gender, goal, fitness_level, activity_factor,
     bmr, tdee, target_calories, target_protein, target_carbs, target_fat, theme,
     notif_morning, notif_lunch, notif_evening, notif_weekly, onboarding_completed, created_at, updated_at, calorie_target_mode, protein_target_mode FROM user_profile;

DROP TABLE user_profile;

ALTER TABLE profile_with_birth_date RENAME TO user_profile;

CREATE TRIGGER require_new_profile_birth_date BEFORE INSERT ON user_profile
         WHEN NEW.birth_date IS NULL BEGIN SELECT RAISE(ABORT,'Birth date required'); END;

CREATE TRIGGER retain_profile_birth_date BEFORE UPDATE OF birth_date ON user_profile
         WHEN NEW.birth_date IS NULL AND OLD.birth_date IS NOT NULL
         BEGIN SELECT RAISE(ABORT,'Birth date required'); END;

CREATE TRIGGER IF NOT EXISTS log_profile_weight_change
    AFTER UPDATE OF weight_kg ON user_profile
    WHEN OLD.weight_kg IS NOT NEW.weight_kg
    BEGIN
      INSERT INTO weight_log (id, weight_kg, date)
      VALUES (lower(hex(randomblob(16))), NEW.weight_kg, date('now', 'localtime'))
      ON CONFLICT(date) DO UPDATE SET weight_kg = excluded.weight_kg;
    END;
