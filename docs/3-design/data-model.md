# Data Model — HealthMate AI

**Version:** 1.1 (gram-only revision)  
**Date:** 2026-04-30  
**Status:** Active

> **Revision 1.1 (2026-04-30) — Gram-only absolute.** Section 4 (Nutrition) đã rewrite hoàn toàn. Đã xoá 9 table (`unit`, `ingredient_unit`, `ingredient_measurement`, `ingredient_variant`, `data_source`, `nutrition_profile`, `storage_location`, `pantry_item`, `product`+`barcode`) và mọi cột liên quan unit/measurement/density/snapshot/edible-yield/pantry. Schema còn lại: 4.1–4.6 (ingredient · dish · dish_with_totals VIEW · dish_ingredient · day_plan · meal_slot · planned_dish). **Tổng số table Phase 1 = 18** (Nhóm Nutrition: 6, Fitness: 7, User: 2, AI/Streak: 2, Config: 1). Xem PRD §F-01 và §"Triết lý gram-only" để biết lý do.

---

## 1. Tổng quan

### Database

- **Engine:** SQLite (local-first)
- **Dual Implementation:** sql.js WASM (web/tests) + @capacitor-community/sqlite (Android native)
- **Primary Key:** UUID v4 (string) — chuẩn bị cho sync/backup sau này
- **Timestamps:** ISO 8601 string ("2026-04-14T10:30:00.000Z")
- **Naming:** snake_case cho tables và columns

### Quy ước chung

| Quy ước | Chi tiết |
|---------|---------|
| PK | `id TEXT PRIMARY KEY` (UUID v4) |
| Timestamps | `created_at TEXT NOT NULL DEFAULT (datetime('now'))`, `updated_at TEXT` |
| Soft delete | Không dùng — hard delete + confirm dialog |
| Foreign key | `REFERENCES table(id) ON DELETE CASCADE` hoặc `ON DELETE RESTRICT` tùy ngữ cảnh |
| Boolean | `INTEGER` (0/1) — SQLite không có kiểu BOOLEAN |
| Enum | `TEXT` với `CHECK()` constraint |

---

## 2. Entity Relationship Diagram (ERD)

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│ user_profile │     │   ingredient     │     │   exercise   │
│ (singleton)  │     │                  │     │              │
└──────┬───────┘     └────────┬─────────┘     └──────┬───────┘
       │                      │                      │
       │              ┌───────┴────────┐             │
       │              │ dish_ingredient │             │
       │              └───────┬────────┘             │
       │                      │                      │
       │               ┌──────┴───────┐      ┌──────┴─────────┐
       │               │     dish     │      │ training_plan  │
       │               └──────┬───────┘      └──────┬─────────┘
       │                      │                     │
       │              ┌───────┴────────┐    ┌───────┴──────────┐
       │              │  planned_dish  │    │ training_plan_day│
       │              └───────┬────────┘    └───────┬──────────┘
       │                      │                     │
       │               ┌──────┴───────┐    ┌────────┴──────────┐
       │               │  meal_slot   │    │planned_exercise   │
       │               └──────┬───────┘    └───────────────────┘
       │                      │
       │               ┌──────┴───────┐    ┌───────────────────┐
       │               │   day_plan   │    │ workout_session   │
       │               └──────────────┘    └───────┬───────────┘
       │                                           │
       │                                   ┌───────┴───────────┐
       │                                   │workout_exercise   │
       │                                   └───────┬───────────┘
       │                                           │
       │                                   ┌───────┴───────────┐
       │                                   │  workout_set      │
       │                                   └───────────────────┘
       │
       │         ┌─────────────┐    ┌──────────────┐
       └────────→│ weight_log  │    │ ai_chat_log  │
                 └─────────────┘    └──────────────┘
```

---

## 3. Tables — Nhóm User

### 3.1 user_profile

Singleton — chỉ có 1 row. Lưu thông tin user từ Onboarding + Settings.

> **Quyết định thiết kế: KHÔNG thu thập tên người dùng.** App là offline-first, single-user, chạy local trên thiết bị; không có auth, không có sync, không có multi-profile. Vì vậy `user_profile` cố ý không có cột `display_name` / `nickname` / `full_name`. Mọi copy UI (greeting Dashboard, notification, summary) dùng đại từ trung tính **"bạn"** thay vì gọi tên. Nếu sau này thêm multi-profile / family mode / cloud sync, mới mở lại quyết định này (sẽ cần migration thêm cột `display_name TEXT` + step Onboarding tương ứng).

```sql
CREATE TABLE user_profile (
  id                TEXT PRIMARY KEY,
  
  -- Thông tin cơ bản (Onboarding Bước 2)
  height_cm         REAL NOT NULL,                -- Chiều cao (cm)
  weight_kg         REAL NOT NULL,                -- Cân nặng (kg)
  age               INTEGER NOT NULL,             -- Tuổi
  gender            TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  
  -- Mục tiêu (Onboarding Bước 1)
  goal              TEXT NOT NULL CHECK (goal IN ('lose_weight', 'gain_muscle', 'maintain', 'performance')),
  
  -- Level (auto-detect từ Onboarding)
  fitness_level     TEXT NOT NULL CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  
  -- TDEE & Targets (auto-calculated, user có thể override)
  activity_factor   REAL NOT NULL DEFAULT 1.55,   -- 1.2 / 1.375 / 1.55 / 1.725
  bmr               REAL NOT NULL,                -- Auto-calculated (Mifflin-St Jeor)
  tdee              REAL NOT NULL,                -- BMR × activity_factor
  target_calories   REAL NOT NULL,                -- TDEE ± deficit/surplus
  target_protein    REAL NOT NULL,                -- g/ngày
  target_carbs      REAL,                         -- g/ngày (optional)
  target_fat        REAL,                         -- g/ngày (optional)
  
  -- Settings
  theme             TEXT NOT NULL DEFAULT 'light' CHECK (theme = 'light'),  -- Story 2.6 (2026-05-08): light-only; column kept for compat, locked by CHECK
  notif_morning     INTEGER NOT NULL DEFAULT 1,   -- 7:30 Plan hôm nay
  notif_lunch       INTEGER NOT NULL DEFAULT 1,   -- 12:30 Nhắc log
  notif_evening     INTEGER NOT NULL DEFAULT 1,   -- 21:00 Tổng kết
  notif_weekly      INTEGER NOT NULL DEFAULT 1,   -- Chủ nhật review
  
  -- Onboarding
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT
);
```

### 3.2 weight_log

Lịch sử cân nặng — dùng tính weekly average cho Progress Charts (F-10).

```sql
CREATE TABLE weight_log (
  id                TEXT PRIMARY KEY,
  weight_kg         REAL NOT NULL,
  date              TEXT NOT NULL,                -- "2026-04-14" (1 entry/ngày)
  notes             TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  
  UNIQUE(date)                                    -- Chỉ 1 lần cân/ngày
);
```

---

## 4. Tables — Nhóm Nutrition (F-01, F-02, F-03, F-04)

> **Gram-only revision (2026-04-30).** Toàn bộ Section 4 đã được rewrite theo triết lý gram-only absolute.
> **Đã bỏ:** `unit`, `ingredient_unit`, `ingredient_measurement`, `ingredient_variant`, `data_source`, `nutrition_profile`, `storage_location`, `pantry_item`, `product`, `barcode`. Cũng bỏ các cột `density_g_per_ml`, `nutrition_basis_unit`, `amount_value`, `unit_id`, `normalized_amount`, `normalized_unit`, `conversion_snapshot_json`, `edible_yield_ratio`, `applies_to`, `gross_quantity`, `edible_quantity`.
> **Triết lý:** mọi lượng = gram. Mọi nutrition theo `100g`. Không modifier, không edible yield, không snapshot, không pantry. Tính realtime từ `ingredient.calories × dish_ingredient.gram_weight / 100`.

### 4.1 ingredient

Thư viện nguyên liệu — single source of truth cho dinh dưỡng.

```sql
CREATE TABLE ingredient (
  id              TEXT PRIMARY KEY,                                      -- UUID v4
  name            TEXT NOT NULL,                                         -- "Ức gà"
  category        TEXT NOT NULL,                                         -- enum (xem PRD F-01)
  calories        REAL NOT NULL CHECK (calories >= 0 AND calories <= 2000), -- kcal per 100g
  protein         REAL NOT NULL DEFAULT 0 CHECK (protein BETWEEN 0 AND 100), -- g per 100g
  carbs           REAL NOT NULL DEFAULT 0 CHECK (carbs   BETWEEN 0 AND 100), -- g per 100g
  fat             REAL NOT NULL DEFAULT 0 CHECK (fat     BETWEEN 0 AND 100), -- g per 100g
  fiber           REAL NOT NULL DEFAULT 0 CHECK (fiber   BETWEEN 0 AND 100), -- g per 100g
  source          TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','ai','db')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT                                                   -- soft-delete
);

CREATE INDEX idx_ingredient_name     ON ingredient(name COLLATE NOCASE);
CREATE INDEX idx_ingredient_category ON ingredient(category);
CREATE UNIQUE INDEX uq_ingredient_name_active
  ON ingredient(LOWER(name)) WHERE deleted_at IS NULL;
```

**Ràng buộc & quy ước:**
- `calories/protein/carbs/fat/fiber` luôn theo per **100 gram**. Không có basis nào khác.
- Liquid (sữa, dầu, nước chấm) cũng tính per 100g. User tự cân; cho nước, 1ml ≈ 1g là thông dụng.
- `source` đổi từ `db`/`ai` sang `manual` khi user sửa.
- Soft-delete: set `deleted_at`, không hard-delete để tránh broken FK với dish_ingredient (xem RULE-INGREDIENT-DELETE).

---

### 4.2 dish

Món ăn — chứa danh sách nguyên liệu với gram_weight.

```sql
CREATE TABLE dish (
  id              TEXT PRIMARY KEY,                                      -- UUID v4
  name            TEXT NOT NULL,
  description     TEXT,
  type            TEXT NOT NULL CHECK (type IN ('ingredient_based','ai_autofill')),
  source          TEXT NOT NULL DEFAULT 'custom' CHECK (source IN ('db','custom','ai')),
  servings        REAL NOT NULL DEFAULT 1 CHECK (servings BETWEEN 0.5 AND 20),
  image_url       TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT
);

CREATE INDEX idx_dish_name   ON dish(name COLLATE NOCASE);
CREATE INDEX idx_dish_source ON dish(source);
```

**Ràng buộc:**
- Total nutrition (calories/protein/...) **KHÔNG được lưu trên dish**. Đọc từ VIEW `dish_with_totals`.
- Mọi dish phải có ≥ 1 dish_ingredient (kiểm tra ở app layer khi save; xem RULE-DISH-INGREDIENT-MIN).

---

### 4.2b dish_with_totals (VIEW)

Single source of truth cho tổng dinh dưỡng món ăn — tính realtime.

```sql
CREATE VIEW dish_with_totals AS
SELECT
  d.id,
  d.name,
  d.servings,
  d.type,
  d.source,
  d.image_url,
  d.created_at,
  d.updated_at,
  d.deleted_at,
  COALESCE(SUM(di.gram_weight * i.calories / 100.0), 0) AS total_calories,
  COALESCE(SUM(di.gram_weight * i.protein  / 100.0), 0) AS total_protein,
  COALESCE(SUM(di.gram_weight * i.carbs    / 100.0), 0) AS total_carbs,
  COALESCE(SUM(di.gram_weight * i.fat      / 100.0), 0) AS total_fat,
  COALESCE(SUM(di.gram_weight * i.fiber    / 100.0), 0) AS total_fiber,
  COALESCE(SUM(di.gram_weight), 0)                      AS total_gram_weight
FROM dish d
LEFT JOIN dish_ingredient di ON di.dish_id = d.id
LEFT JOIN ingredient i       ON i.id = di.ingredient_id AND i.deleted_at IS NULL
WHERE d.deleted_at IS NULL
GROUP BY d.id;
```

**Ghi chú:**
- VIEW dùng `LEFT JOIN` để dish không có ingredient (edge case) vẫn ra row với totals = 0.
- Filter `deleted_at IS NULL` cho ingredient để tránh tính ingredient đã soft-delete.
- Tính realtime: nếu user sửa `ingredient.calories`, mọi dish dùng ingredient đó sẽ cập nhật ngay khi query VIEW.

---

### 4.3 dish_ingredient

Bảng trung gian dish ↔ ingredient. **Schema phẳng nhất có thể: chỉ 1 trường định lượng.**

```sql
CREATE TABLE dish_ingredient (
  id              TEXT PRIMARY KEY,                                      -- UUID v4
  dish_id         TEXT NOT NULL REFERENCES dish(id)       ON DELETE CASCADE,
  ingredient_id   TEXT NOT NULL REFERENCES ingredient(id) ON DELETE RESTRICT,
  gram_weight     REAL NOT NULL CHECK (gram_weight > 0 AND gram_weight <= 10000),
  position        INTEGER NOT NULL DEFAULT 0,                            -- thứ tự hiển thị
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (dish_id, ingredient_id)                                        -- không cho double-add cùng ingredient
);

CREATE INDEX idx_dish_ingredient_dish       ON dish_ingredient(dish_id);
CREATE INDEX idx_dish_ingredient_ingredient ON dish_ingredient(ingredient_id);
```

**Ràng buộc:**
- `gram_weight`: 0.1 → 10000 (1 chữ số thập phân ở UI).
- `ON DELETE CASCADE` từ dish: xoá dish → xoá dish_ingredient.
- `ON DELETE RESTRICT` từ ingredient: chặn hard-delete ingredient nếu còn dish reference. Soft-delete OK.
- `UNIQUE (dish_id, ingredient_id)`: một ingredient chỉ xuất hiện 1 lần trong 1 dish (nếu user muốn 2 đợt thì cộng gram lại).

---

### 4.4 day_plan

Kế hoạch ăn 1 ngày.

```sql
CREATE TABLE day_plan (
  id                TEXT PRIMARY KEY,                                    -- UUID v4
  date              TEXT NOT NULL UNIQUE,                                -- "2026-04-13"
  target_calories   REAL,                                                -- snapshot từ user_profile, có thể null
  target_protein    REAL,
  notes             TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_day_plan_date ON day_plan(date);
```

**Ghi chú:** `target_calories/target_protein` snapshot tại thời điểm tạo day_plan (vì user_profile có thể đổi target). Đây là **outlier khỏi triết lý "no snapshot"** — chỉ snapshot **mục tiêu** (target) chứ không snapshot **thực tế ăn** (totals luôn realtime).

---

### 4.5 meal_slot

4 bữa trong 1 ngày (sáng/trưa/tối/phụ).

```sql
CREATE TABLE meal_slot (
  id              TEXT PRIMARY KEY,                                      -- UUID v4
  day_plan_id     TEXT NOT NULL REFERENCES day_plan(id) ON DELETE CASCADE,
  meal_type       TEXT NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  position        INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (day_plan_id, meal_type)
);

CREATE INDEX idx_meal_slot_day_plan ON meal_slot(day_plan_id);
```

---

### 4.6 planned_dish

Món ăn đã thêm vào meal_slot (= meal log entry). **Ngoại lệ duy nhất giữ nutrition snapshot** so với dish_ingredient (xem `business-rules.md` § RULE-PLANNED-DISH-SNAPSHOT).

```sql
CREATE TABLE planned_dish (
  id              TEXT PRIMARY KEY,                                      -- UUID v4
  meal_slot_id    TEXT NOT NULL REFERENCES meal_slot(id) ON DELETE CASCADE,
  dish_id         TEXT NOT NULL REFERENCES dish(id)      ON DELETE RESTRICT,
  servings        REAL NOT NULL DEFAULT 1 CHECK (servings BETWEEN 0.1 AND 20),
  is_completed    INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0,1)),
  sort_order      INTEGER NOT NULL DEFAULT 0,
  -- Snapshot nutrition tại thời điểm log/plan (immutable history)
  -- Tính = dish_with_totals.total_* * servings; không recompute khi dish_ingredient đổi
  calories        REAL NOT NULL,
  protein         REAL NOT NULL DEFAULT 0,
  carbs           REAL NOT NULL DEFAULT 0,
  fat             REAL NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at    TEXT
);

CREATE INDEX idx_planned_dish_meal_slot ON planned_dish(meal_slot_id);
CREATE INDEX idx_planned_dish_dish      ON planned_dish(dish_id);
```

> **Tại sao snapshot ở `planned_dish` (mâu thuẫn với gram-only realtime)?**
> `dish_ingredient` = công thức (mô tả) → realtime, sửa recipe thì dish total cập nhật ngay.
> `planned_dish` = nhật ký bữa ăn → bằng chứng lịch sử, phải bất biến để report tuần/tháng đúng kể cả khi recipe đã đổi sau đó.

**Ràng buộc:**
- `is_completed` flag để mark "Đã ăn".
- Không snapshot nutrition. Khi user xem dashboard "tuần trước ăn ?kcal", app tính realtime: SUM(dish_with_totals.total_calories × planned_dish.servings) WHERE is_completed=1.
- Trade-off: nếu user sửa nutrition của ingredient/dish thì lịch sử cập nhật theo. Đây là chấp nhận được vì sửa nutrition là hành động hiếm.

---

<!-- ============================================================ -->
<!-- Các table sau ĐÃ BỊ XOÁ trong gram-only revision (2026-04-30): -->
<!--   4.0a unit, 4.0b ingredient_unit, 4.0c ingredient_measurement, -->
<!--   4.0d ingredient_variant, 4.0e data_source,                   -->
<!--   4.1b nutrition_profile, 4.7 storage_location,                -->
<!--   4.8 pantry_item, 4.9 product + barcode.                      -->
<!-- Lý do: gram-only absolute → không cần unit table, không cần   -->
<!--   measurement, không cần pantry/barcode/product. Tab Quản lý  -->
<!--   chỉ là catalog (ingredient + dish).                          -->
<!-- ============================================================ -->

## 5. Tables — Nhóm Fitness (F-08, F-09, F-10, F-11)

### 5.1 exercise

Database bài tập (≥ 50 bài tập phổ biến).

```sql
CREATE TABLE exercise (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,                -- "Bench Press"
  name_vi           TEXT,                         -- "Đẩy ngực ngang"
  muscle_group      TEXT NOT NULL CHECK (muscle_group IN (
                      'chest', 'back', 'shoulders', 'biceps', 'triceps',
                      'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'forearms', 'full_body'
                    )),
  category          TEXT NOT NULL CHECK (category IN ('compound', 'isolation', 'cardio')),
  equipment         TEXT,                         -- "Barbell", "Dumbbell", "Machine", "Bodyweight"
  instructions      TEXT,                         -- Hướng dẫn ngắn
  source            TEXT NOT NULL DEFAULT 'db' CHECK (source IN ('db', 'custom', 'ai')),
  
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_exercise_muscle ON exercise(muscle_group);
CREATE INDEX idx_exercise_name ON exercise(name);
```

### 5.2 training_plan

Kế hoạch tập luyện (F-08): Full Body / Upper-Lower / PPL / AI Custom.

```sql
CREATE TABLE training_plan (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,                -- "PPL 6 ngày", "Full Body 3 ngày"
  type              TEXT NOT NULL CHECK (type IN ('full_body', 'upper_lower', 'ppl', 'ai_custom')),
  frequency         INTEGER NOT NULL,             -- Số ngày tập/tuần (3-6)
  is_active         INTEGER NOT NULL DEFAULT 0,   -- Plan đang dùng (chỉ 1 active)
  description       TEXT,
  source            TEXT NOT NULL DEFAULT 'preset' CHECK (source IN ('preset', 'ai', 'custom')),
  
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT
);
```

### 5.3 training_plan_day

Ngày tập trong plan (VD: Push Day, Pull Day...).

```sql
CREATE TABLE training_plan_day (
  id                TEXT PRIMARY KEY,
  training_plan_id  TEXT NOT NULL REFERENCES training_plan(id) ON DELETE CASCADE,
  day_of_week       INTEGER NOT NULL,             -- 0=CN, 1=T2, 2=T3... 6=T7
  name              TEXT NOT NULL,                -- "Push Day", "Upper Body", "Rest Day"
  is_rest_day       INTEGER NOT NULL DEFAULT 0,   -- Ngày nghỉ
  sort_order        INTEGER NOT NULL DEFAULT 0,
  
  UNIQUE(training_plan_id, day_of_week)
);

CREATE INDEX idx_tpd_plan ON training_plan_day(training_plan_id);
```

### 5.4 planned_exercise

Bài tập trong 1 ngày tập (kế hoạch — chưa tập).

```sql
CREATE TABLE planned_exercise (
  id                TEXT PRIMARY KEY,
  training_plan_day_id TEXT NOT NULL REFERENCES training_plan_day(id) ON DELETE CASCADE,
  exercise_id       TEXT NOT NULL REFERENCES exercise(id) ON DELETE RESTRICT,
  sets              INTEGER NOT NULL,             -- Số set kế hoạch (3-5)
  reps_min          INTEGER NOT NULL,             -- Rep tối thiểu (8)
  reps_max          INTEGER NOT NULL,             -- Rep tối đa (12)
  rest_seconds      INTEGER NOT NULL DEFAULT 90,  -- Nghỉ giữa set (giây)
  notes             TEXT,                         -- "Tăng 2.5kg mỗi tuần"
  sort_order        INTEGER NOT NULL DEFAULT 0,
  
  UNIQUE(training_plan_day_id, exercise_id)
);

CREATE INDEX idx_pe_day ON planned_exercise(training_plan_day_id);
```

### 5.5 workout_session

Buổi tập thực tế đã hoàn thành (F-09).

```sql
CREATE TABLE workout_session (
  id                TEXT PRIMARY KEY,
  date              TEXT NOT NULL,                -- "2026-04-14"
  training_plan_day_id TEXT REFERENCES training_plan_day(id) ON DELETE SET NULL,
  training_day_name TEXT,                         -- "Push Day" (snapshot, phòng khi plan bị xóa)
  mode              TEXT NOT NULL CHECK (mode IN ('guided', 'free')),
  
  -- Tổng kết
  total_volume      REAL NOT NULL DEFAULT 0,      -- Σ(weight × reps) kg
  duration_minutes  INTEGER,                      -- Thời gian tập (phút)
  
  started_at        TEXT NOT NULL,
  completed_at      TEXT,
  
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_ws_date ON workout_session(date);
```

### 5.6 workout_exercise

Bài tập trong buổi tập thực tế.

```sql
CREATE TABLE workout_exercise (
  id                TEXT PRIMARY KEY,
  workout_session_id TEXT NOT NULL REFERENCES workout_session(id) ON DELETE CASCADE,
  exercise_id       TEXT NOT NULL REFERENCES exercise(id) ON DELETE RESTRICT,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  
  -- Tổng volume bài tập này
  total_volume      REAL NOT NULL DEFAULT 0
);

CREATE INDEX idx_we_session ON workout_exercise(workout_session_id);
```

### 5.7 workout_set

Từng set trong bài tập thực tế.

```sql
CREATE TABLE workout_set (
  id                TEXT PRIMARY KEY,
  workout_exercise_id TEXT NOT NULL REFERENCES workout_exercise(id) ON DELETE CASCADE,
  set_number        INTEGER NOT NULL,             -- 1, 2, 3, 4...
  weight_kg         REAL NOT NULL,                -- Trọng lượng (kg)
  reps              INTEGER NOT NULL,             -- Số rep thực tế
  rest_seconds      INTEGER,                      -- Thời gian nghỉ thực tế
  
  -- Effort emoji (optional) — simplified RPE/RIR
  effort            TEXT CHECK (effort IN ('easy', 'just_right', 'hard', 'maxed')),
  -- easy = 😊 RIR 4+, just_right = 💪 RIR 2-3, hard = 😤 RIR 1, maxed = 🔥 RIR 0
  
  notes             TEXT,                         -- "Đau vai", "Form tốt"...
  
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_ws_exercise ON workout_set(workout_exercise_id);
```

---

## 6. Tables — Nhóm AI & Streak

### 6.1 ai_chat_log

Lịch sử tương tác AI — dùng cho AI Insights, debugging, và context.

```sql
CREATE TABLE ai_chat_log (
  id                TEXT PRIMARY KEY,
  feature           TEXT NOT NULL CHECK (feature IN (
                      'image_analysis', 'menu_suggestion', 'meal_plan_day',
                      'meal_plan_week', 'daily_insight', 'weekly_review',
                      'training_plan', 'dish_autofill', 'ingredient_lookup'
                    )),
  prompt            TEXT NOT NULL,                -- Prompt gửi Gemini
  response          TEXT NOT NULL,                -- Response từ Gemini
  model             TEXT,                         -- "gemini-2.0-flash"
  tokens_used       INTEGER,                      -- Token sử dụng (cost tracking)
  
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_ai_log_feature ON ai_chat_log(feature);
CREATE INDEX idx_ai_log_date ON ai_chat_log(created_at);
```

### 6.2 streak_log

Tracking streak hàng ngày (Nutrition + Workout).

```sql
CREATE TABLE streak_log (
  id                TEXT PRIMARY KEY,
  date              TEXT NOT NULL,                -- "2026-04-14"
  
  -- Nutrition streak: đạt mục tiêu calo ±10%
  nutrition_hit     INTEGER NOT NULL DEFAULT 0,   -- 0/1
  
  -- Workout streak: hoàn thành buổi tập theo plan
  workout_hit       INTEGER NOT NULL DEFAULT 0,   -- 0/1
  
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  
  UNIQUE(date)
);

CREATE INDEX idx_streak_date ON streak_log(date);
```

---

## 7. Tables — Nhóm App Config

### 7.1 app_config

Key-value store cho các config linh tinh.

```sql
CREATE TABLE app_config (
  key               TEXT PRIMARY KEY,
  value             TEXT NOT NULL,
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ví dụ rows:
-- ('db_version', '1')
-- ('last_ai_sync', '2026-04-14T10:00:00.000Z')
-- Note: active training plan được track qua `training_plan.is_active` column (không dùng app_config để tránh duplicate source of truth)
```

---

## 8. Tổng kết Tables

| # | Table | Nhóm | Mô tả | FK đến |
|---|-------|------|-------|--------|
| 1 | `user_profile` | User | Singleton — profile + settings + targets | — |
| 2 | `weight_log` | User | Lịch sử cân nặng | — |
| 3 | `ingredient` | Nutrition | Nguyên liệu + nutrition per 100g | — |
| 4 | `dish` | Nutrition | Món ăn (totals tính từ VIEW `dish_with_totals`) | — |
| 5 | `dish_ingredient` | Nutrition | Nguyên liệu trong món (chỉ `gram_weight`) | dish, ingredient |
| 6 | `day_plan` | Nutrition | Kế hoạch ăn 1 ngày | — |
| 7 | `meal_slot` | Nutrition | Bữa ăn (sáng/trưa/tối/phụ) | day_plan |
| 8 | `planned_dish` | Nutrition | Món đã thêm vào bữa | meal_slot, dish |
| 9 | `exercise` | Fitness | Database bài tập | — |
| 10 | `training_plan` | Fitness | Kế hoạch tập (PPL/UL/FB/AI) | — |
| 11 | `training_plan_day` | Fitness | Ngày tập trong plan | training_plan |
| 12 | `planned_exercise` | Fitness | Bài tập kế hoạch | training_plan_day, exercise |
| 13 | `workout_session` | Fitness | Buổi tập thực tế | training_plan_day |
| 14 | `workout_exercise` | Fitness | Bài tập trong buổi tập | workout_session, exercise |
| 15 | `workout_set` | Fitness | Từng set thực tế | workout_exercise |
| 16 | `ai_chat_log` | AI | Lịch sử AI interactions | — |
| 17 | `streak_log` | Streak | Streak hàng ngày | — |
| 18 | `app_config` | Config | Key-value config | — |

**Tổng: 18 tables.** Lưu ý: gram-only revision đã loại 6 table (`unit`, `ingredient_unit`, `ingredient_measurement`, `ingredient_variant`, `data_source`, `nutrition_profile`) khỏi Phase 1.5A roadmap, và `storage_location` + `pantry_item` + `product` + `barcode` không còn được lên lịch nữa. Số table thực tế trong Phase 1 schema = **18** (đã liệt kê trong bảng — không có table bị loại nào tính trong số này).

---

## 9. Seed Data

### 9.1 Vietnamese Core Seed (Phase 1)

```sql
-- Phase 1 ship curated dataset cho 20 món Việt core:
--   6 món sáng / 7 món trưa / 7 món tối
--   không có snack
-- Ingredient seed = union ingredients từ 20 món trên + staple bắt buộc
-- Lưu ý (gram-only revision): mọi nutrition đều theo per 100g.
--   Liquid (sữa/nước mắm) cũng quy về per 100g, dùng quy ước 1 ml ≈ 1 g cho nước.

INSERT INTO ingredient (
  id, name, category,
  calories, protein, carbs, fat, fiber,
  source
) VALUES
  (uuid(), 'Ức gà',                'Thịt',         165, 31,   0,   3.6, 0,   'db'),
  (uuid(), 'Trứng gà',             'Trứng & Sữa', 155, 13,   1.1, 11,  0,   'db'),
  (uuid(), 'Sữa tươi không đường', 'Trứng & Sữa',  42,  3.4, 5,   1,   0,   'db'),
  (uuid(), 'Nước mắm',             'Dầu & Gia vị', 35,  5.1, 3.6, 0,   0,   'db');
```

### 9.2 Vietnamese Core Dishes (Phase 1)

```sql
-- Dish seed được build từ curated source, insert sau ingredient seed.
-- Lưu ý (gram-only revision): dish KHÔNG còn cột total_*. Totals đọc từ VIEW dish_with_totals.
INSERT INTO dish (id, name, description, type, source, servings)
VALUES
  (uuid(), 'Phở bò', 'Seed món Việt core cho bữa sáng', 'ingredient_based', 'db', 1);

-- dish_ingredient chỉ còn 1 trường định lượng: gram_weight.
INSERT INTO dish_ingredient (
  id, dish_id, ingredient_id, gram_weight, position
) VALUES
  (uuid(), dish_uuid('pho-bo'), ingredient_uuid('Thịt bò nạc'), 100, 0),
  (uuid(), dish_uuid('pho-bo'), ingredient_uuid('Phở tươi'),    200, 1);
```

### 9.3 Exercise Database (≥ 50)

```sql
-- Push
INSERT INTO exercise (id, name, name_vi, muscle_group, category, equipment, source) VALUES
  (uuid(), 'Bench Press', 'Đẩy ngực ngang', 'chest', 'compound', 'Barbell', 'db'),
  (uuid(), 'Incline Bench Press', 'Đẩy ngực trên', 'chest', 'compound', 'Barbell', 'db'),
  (uuid(), 'Dumbbell Fly', 'Bay tạ đôi', 'chest', 'isolation', 'Dumbbell', 'db'),
  (uuid(), 'Overhead Press', 'Đẩy vai', 'shoulders', 'compound', 'Barbell', 'db'),
  (uuid(), 'Lateral Raise', 'Nâng tạ ngang', 'shoulders', 'isolation', 'Dumbbell', 'db'),
  (uuid(), 'Tricep Pushdown', 'Đẩy tricep', 'triceps', 'isolation', 'Cable', 'db'),
  (uuid(), 'Close Grip Bench', 'Đẩy ngực hẹp', 'triceps', 'compound', 'Barbell', 'db'),
  -- ... thêm ~8 bài push

-- Pull
  (uuid(), 'Deadlift', 'Kéo nặng', 'back', 'compound', 'Barbell', 'db'),
  (uuid(), 'Barbell Row', 'Chèo tạ', 'back', 'compound', 'Barbell', 'db'),
  (uuid(), 'Lat Pulldown', 'Kéo xô', 'back', 'compound', 'Cable', 'db'),
  (uuid(), 'Pull Up', 'Hít xà', 'back', 'compound', 'Bodyweight', 'db'),
  (uuid(), 'Barbell Curl', 'Cuốn tạ', 'biceps', 'isolation', 'Barbell', 'db'),
  (uuid(), 'Hammer Curl', 'Cuốn búa', 'biceps', 'isolation', 'Dumbbell', 'db'),
  (uuid(), 'Face Pull', 'Kéo mặt', 'shoulders', 'isolation', 'Cable', 'db'),
  -- ... thêm ~8 bài pull

-- Legs
  (uuid(), 'Squat', 'Gánh tạ', 'quads', 'compound', 'Barbell', 'db'),
  (uuid(), 'Leg Press', 'Đạp đùi', 'quads', 'compound', 'Machine', 'db'),
  (uuid(), 'Romanian Deadlift', 'Kéo nặng Romania', 'hamstrings', 'compound', 'Barbell', 'db'),
  (uuid(), 'Leg Curl', 'Cuốn đùi sau', 'hamstrings', 'isolation', 'Machine', 'db'),
  (uuid(), 'Leg Extension', 'Duỗi đùi trước', 'quads', 'isolation', 'Machine', 'db'),
  (uuid(), 'Calf Raise', 'Nâng bắp chân', 'calves', 'isolation', 'Machine', 'db'),
  (uuid(), 'Hip Thrust', 'Đẩy hông', 'glutes', 'compound', 'Barbell', 'db'),
  (uuid(), 'Lunge', 'Bước sập', 'quads', 'compound', 'Dumbbell', 'db'),
  -- ... thêm ~8 bài legs

-- Abs
  (uuid(), 'Plank', 'Tấm ván', 'abs', 'isolation', 'Bodyweight', 'db'),
  (uuid(), 'Crunch', 'Gập bụng', 'abs', 'isolation', 'Bodyweight', 'db'),
  (uuid(), 'Hanging Leg Raise', 'Nâng chân treo', 'abs', 'compound', 'Bodyweight', 'db'),
  -- ... thêm ~5 bài abs
```

### 9.4 Preset Training Plans

```sql
-- Full Body (Beginner) — 3 ngày/tuần
INSERT INTO training_plan (id, name, type, frequency, is_active, source) VALUES
  (uuid(), 'Full Body — Cơ bản (3 ngày)', 'full_body', 3, 0, 'preset');

-- Upper/Lower (Intermediate) — 4 ngày/tuần
INSERT INTO training_plan (id, name, type, frequency, is_active, source) VALUES
  (uuid(), 'Upper/Lower — Trung cấp (4 ngày)', 'upper_lower', 4, 0, 'preset');

-- PPL (Advanced) — 6 ngày/tuần
INSERT INTO training_plan (id, name, type, frequency, is_active, source) VALUES
  (uuid(), 'Push/Pull/Legs — Nâng cao (6 ngày)', 'ppl', 6, 0, 'preset');

-- Mỗi plan có training_plan_day + planned_exercise tương ứng
-- (Chi tiết exercises cho mỗi ngày sẽ trong file seed riêng)
```

---

## 10. Migration Strategy

### Versioning

```sql
-- app_config table stores current version
-- ('db_version', '1')

-- Migration naming: V{version}_{description}.sql
-- V1_initial_schema.sql    — Tạo tất cả tables
-- V2_add_fiber_column.sql  — Ví dụ migration tương lai
```

### Migration Flow

```
App khởi động
  → Đọc db_version từ app_config (nếu app_config chưa tồn tại thì xem là 0)
  → So sánh với LATEST_VERSION trong code
  → Nếu cần upgrade → chạy migration scripts tuần tự
  → Update db_version
  → Sau khi migration xong mới chạy seed loader cho fresh DB
  → Existing DB: không overwrite seeded records đã tồn tại
  → Existing DB: không tự thêm lại seed đã bị xóa hoặc seed mới của version sau
```

### Backup Strategy (V2 — hoãn theo Decision D5)

> **V1 không có backup/export.** User reinstall app = mất data. Onboarding + Settings sẽ communicate rõ.

**V2 kế hoạch:**
- **Export:** Dump toàn bộ SQLite database → file .db hoặc JSON
- **Import:** Replace database file → restart app
- **Vị trí:** Capacitor Filesystem API → Android Downloads folder

---

## 11. Indexes Summary

| Table | Index | Columns | Mục đích |
|-------|-------|---------|---------|
| ingredient | idx_ingredient_name | name (NOCASE) | Tìm kiếm theo tên |
| ingredient | idx_ingredient_category | category | Filter theo nhóm |
| ingredient | uq_ingredient_name_active | LOWER(name) WHERE deleted_at IS NULL | Chống trùng tên (active) |
| dish | idx_dish_name | name (NOCASE) | Tìm kiếm theo tên |
| dish | idx_dish_source | source | Filter db/custom/ai |
| dish_ingredient | idx_dish_ingredient_dish | dish_id | Join nhanh khi query món |
| dish_ingredient | idx_dish_ingredient_ingredient | ingredient_id | Reverse lookup (ingredient này dùng ở dish nào) |
| day_plan | idx_day_plan_date | date | Query theo ngày |
| meal_slot | idx_meal_slot_day_plan | day_plan_id | Join nhanh |
| planned_dish | idx_planned_dish_meal_slot | meal_slot_id | Join nhanh |
| planned_dish | idx_planned_dish_dish | dish_id | Reverse lookup |
| exercise | idx_exercise_muscle | muscle_group | Filter theo nhóm cơ |
| exercise | idx_exercise_name | name | Tìm kiếm |
| training_plan_day | idx_tpd_plan | training_plan_id | Join nhanh |
| planned_exercise | idx_pe_day | training_plan_day_id | Join nhanh |
| workout_session | idx_ws_date | date | Query theo ngày |
| workout_exercise | idx_we_session | workout_session_id | Join nhanh |
| workout_set | idx_ws_exercise | workout_exercise_id | Join nhanh |
| ai_chat_log | idx_ai_log_feature | feature | Filter theo feature |
| ai_chat_log | idx_ai_log_date | created_at | Query theo thời gian |
| streak_log | idx_streak_date | date | Query streak |
