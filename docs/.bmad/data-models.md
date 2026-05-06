# Data Models — HealthMate AI

**Date:** 2026-05-06
**Source-of-truth canonical:** `docs/3-design/data-model.md` (rules + decisions). Code: `src/app/core/services/database/schema.ts`. File này là tóm tắt BMAD-friendly cho AI agent.

## 1. DB Engine

- **Local SQLite** — schema version 6.
- **18 tables** chia theo domain.
- **Dual implementation:** sql.js WASM (test/web) + @capacitor-community/sqlite (Android native).
- **Migration:** `core/services/database/migrations.ts` + `migration-runner.ts`.

## 2. Convention rules (canonical)

| Rule | Mô tả |
|---|---|
| **PK type** | `TEXT` UUID v4 (Zod v4 strict v1-8 — chú ý khi validate) |
| **Naming** | `snake_case` cho cột & bảng |
| **Nutrition basis** | 100g hoặc 100ml canonical (`nutrition_basis_unit` + `nutrition_basis_quantity`) |
| **Dish-first** | UI/UX ưu tiên dish; ingredient là building block |
| **Timestamps** | `created_at` (default `datetime('now')`), `updated_at` nullable text |
| **Booleans** | INTEGER 0/1 (SQLite không có bool) |
| **Enums** | `CHECK (col IN ('a','b','c'))` |
| **Idempotent DDL** | `CREATE TABLE IF NOT EXISTS` |

## 3. Tables (18) — domain summary

> Schema chi tiết: `src/app/core/services/database/schema.ts`. Decision/rationale: `docs/3-design/data-model.md`.

### 3.1 USER (2 tables)

| Table | Vai trò | Key columns |
|---|---|---|
| `user_profile` | Single row — user calo/macro targets, theme, notif prefs | `id PK`, `height_cm`, `weight_kg`, `age`, `gender`, `goal`, `fitness_level`, `bmr`, `tdee`, `target_calories`, `target_protein/carbs/fat`, `theme`, `notif_*`, `onboarding_completed` |
| `weight_log` | Lịch sử cân nặng | `id PK`, `weight_kg`, `date UNIQUE`, `notes` |

> ⚠️ **Decision:** `user_profile` **cố ý KHÔNG có `display_name`** — app offline single-user, UI dùng "bạn".

### 3.2 NUTRITION (6 tables)

| Table | Vai trò | Key columns |
|---|---|---|
| `ingredient` | Nguyên liệu cơ bản | `id PK`, `name`, `category` (11 enum), `nutrition_basis_unit/quantity`, `calories`, `protein`, `carbs`, `fat`, `fiber`, `default_entry_unit`, `grams_per_unit`, `ml_per_unit` |
| `dish` | Món ăn (composition của ingredients) | `id PK`, `name`, `description`, `serving_*`, computed nutrition |
| `dish_ingredient` | M:N giữa dish & ingredient | `dish_id FK`, `ingredient_id FK`, `quantity`, `unit` |
| `day_plan` | Kế hoạch ăn 1 ngày | `id PK`, `date UNIQUE`, calo/macro target snapshot |
| `meal_slot` | Bữa trong ngày (breakfast/lunch/dinner/snack) | `id PK`, `day_plan_id FK`, `slot_type` |
| `planned_dish` | Dish được plan vào meal slot | `id PK`, `meal_slot_id FK`, `dish_id FK`, `serving_count` |

### 3.3 FITNESS (7 tables)

| Table | Vai trò |
|---|---|
| `exercise` | Bài tập gốc |
| `training_plan` | Kế hoạch tập theo tuần |
| `training_plan_day` | 1 ngày trong plan |
| `planned_exercise` | Exercise được plan vào day |
| `workout_session` | 1 buổi tập thực tế (đã hoàn thành) |
| `workout_exercise` | Exercise trong session |
| `workout_set` | Set trong exercise (reps/weight/duration) |

### 3.4 AI & STREAK (2 tables)

| Table | Vai trò |
|---|---|
| `ai_chat_log` | Log Gemini request/response (debug + audit) |
| `streak_log` | Streak tracking (consecutive days) |

### 3.5 CONFIG (1 table)

| Table | Vai trò |
|---|---|
| `app_config` | Key/value store (Gemini API key obfuscated, app preferences runtime) |

## 4. Repository pattern

| Repository | Tables touched | File |
|---|---|---|
| `DishRepository` | `dish`, `dish_ingredient` | `core/repositories/dish.repository.ts` |
| `DishIngredientRepository` | `dish_ingredient` (cross-cutting queries) | `core/repositories/dish-ingredient.repository.ts` |
| `IngredientRepository` | `ingredient` | `core/repositories/ingredient.repository.ts` |
| `UserProfileRepository` | `user_profile`, `weight_log` | `core/repositories/user-profile.repository.ts` |

> Mỗi repo có spec đi cặp (`*.repository.spec.ts`) — 4 spec files.

> **Note:** Calendar/fitness/AI tables hiện chưa có repository riêng (các feature đó còn ở giai đoạn build-out). Khi cần thì tạo repository mới theo pattern hiện có.

## 5. Migration history (high-level)

> Chi tiết: `src/app/core/services/database/migrations.ts`.

- v1 → v6: schema evolution qua các phase.
- `legacy-sqljs-migrator.ts` xử lý migrate dữ liệu sql.js cũ qua native SQLite trên Android.
- `schema-compatibility.ts` runtime check để fail-fast nếu schema code mismatch DB hiện tại.

## 6. Validation layer (Zod)

- File schema: `src/app/shared/forms/schemas/`.
- **Pitfall Zod v4:** `.uuid()` strict v1-8. Project dùng UUID v4 → OK, nhưng nếu cần legacy UUID khác phải dùng `.string().regex(...)`.
- **Pitfall TS:** narrow fail trong arrow `.map((x) => ...)` khi `x` có discriminated union → dùng `if/else` thay vì ternary trong arrow.

## 7. Source files cần biết

| File | Vai trò |
|---|---|
| `src/app/core/services/database/schema.ts` | DDL canonical (single source) |
| `src/app/core/services/database/migrations.ts` | Migration list |
| `src/app/core/models/` | TypeScript interfaces tương ứng từng table |
| `src/app/shared/forms/schemas/` | Zod runtime validation |
| `docs/3-design/data-model.md` | Decision document (rationale, edge cases) |
