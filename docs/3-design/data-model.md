# Data Model — HealthMate AI

**Version:** 1.0  
**Date:** 2026-04-14  
**Status:** Active

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
  theme             TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
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

### 4.0a unit

Registry toàn cục cho các đơn vị mà hệ thống hiểu. Unit chỉ phục vụ nhập liệu / hiển thị / conversion, KHÔNG phải nutrition source of truth.

```sql
CREATE TABLE unit (
  id              TEXT PRIMARY KEY,                -- 'g', 'kg', 'ml', 'l', 'tbsp', 'tsp', 'cup', 'piece', 'clove', 'bunch', 'slice', 'pinch'
  display_name_vi TEXT NOT NULL,
  display_name_en TEXT NOT NULL,
  short_name_vi   TEXT NOT NULL,
  unit_type       TEXT NOT NULL CHECK (unit_type IN ('mass', 'volume', 'count', 'cooking')),
  is_global       INTEGER NOT NULL DEFAULT 1,     -- 1 = factor cố định toàn cục; 0 = phụ thuộc ingredient
  base_factor_g   REAL,                           -- chỉ dùng cho global mass unit
  base_factor_ml  REAL,                           -- chỉ dùng cho global volume unit
  is_approximate  INTEGER NOT NULL DEFAULT 0,     -- 1 = đơn vị mang tính ước lượng (VD `pinch`)
  display_order   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_unit_type ON unit(unit_type);
```

Rules:
- `g`, `kg` là global mass units.
- `ml`, `l`, `tbsp`, `tsp`, `cup` là global volume units khi dùng để quy đổi về `ml`.
- `tbsp`, `tsp`, `cup` **không** tự quy đổi sang `g` nếu ingredient nutrition basis là mass; cần `ingredient_unit.factor_to_basis`, `ingredient_measurement`, hoặc `density_g_per_ml` đáng tin.
- `piece`, `clove`, `bunch`, `slice`, `pinch`, `pack`, `bottle`, `serving` là ingredient/product-specific trong cách convert về basis.
- `is_approximate = 1` dùng cho unit ước lượng; UI phải hiển thị dấu `≈` hoặc nhãn `ước lượng`.
- Phase 1.5A target nên bổ sung `requires_food_specific_conversion` để guard các unit không được global-convert.

### 4.0b ingredient_unit

Bảng junction khai báo ingredient nào dùng được unit nào, với factor convert về basis canonical của ingredient đó.

```sql
CREATE TABLE ingredient_unit (
  ingredient_id   TEXT NOT NULL REFERENCES ingredient(id) ON DELETE CASCADE,
  unit_id         TEXT NOT NULL REFERENCES unit(id),
  factor_to_basis REAL NOT NULL,                  -- 1 unit = ? basis unit của ingredient
  is_default      INTEGER NOT NULL DEFAULT 0,
  display_label   TEXT,                           -- override label hiển thị, VD `quả`, `tép`, `củ`
  PRIMARY KEY (ingredient_id, unit_id)
);

CREATE INDEX idx_ingredient_unit_ingredient ON ingredient_unit(ingredient_id);
CREATE UNIQUE INDEX idx_ingredient_unit_default
  ON ingredient_unit(ingredient_id) WHERE is_default = 1;
```

Rules:
- Mỗi ingredient phải có ít nhất 1 row trong `ingredient_unit`.
- Mỗi ingredient chỉ được có đúng 1 unit `is_default = 1`.
- `factor_to_basis > 0`.
- `factor_to_basis` luôn được hiểu theo `nutrition_basis_unit` hiện tại của ingredient.
- `ingredient_unit` KHÔNG lưu nutrition snapshot theo unit.


#### 4.0c ingredient_measurement (Phase 1.5A target)

`ingredient_unit` đủ cho Phase 1, nhưng chưa đủ cho pantry/recipe/nutrition use case có size, gross/edible, source confidence và versioning. Phase 1.5A target thêm `ingredient_measurement` như measurement layer canonical; `ingredient_unit` có thể được giữ làm compatibility view hoặc migration source.

```sql
CREATE TABLE ingredient_measurement (
  id                  TEXT PRIMARY KEY,
  ingredient_id       TEXT NOT NULL REFERENCES ingredient(id) ON DELETE CASCADE,
  variant_id          TEXT REFERENCES ingredient_variant(id) ON DELETE CASCADE,
  unit_id             TEXT NOT NULL REFERENCES unit(id),          -- piece, cup, tbsp, tsp, pack, bottle, serving...
  display_label       TEXT,                                       -- "quả vừa", "cup bột mì", "chai 1 lít"
  size_option         TEXT CHECK (size_option IN ('small', 'medium', 'large', 'custom', 'not_applicable')),
  quantity_per_unit   REAL NOT NULL,                              -- 1 unit = ?
  quantity_unit_id    TEXT NOT NULL REFERENCES unit(id),           -- usually 'g' or 'ml'
  applies_to          TEXT NOT NULL CHECK (applies_to IN ('gross', 'edible')),
  edible_yield_ratio  REAL CHECK (edible_yield_ratio > 0 AND edible_yield_ratio <= 1),
  is_default          INTEGER NOT NULL DEFAULT 0,
  is_approximate      INTEGER NOT NULL DEFAULT 1,
  confidence          TEXT NOT NULL CHECK (confidence IN ('verified', 'estimated', 'user_custom')),
  data_source_id      TEXT REFERENCES data_source(id),
  version             INTEGER NOT NULL DEFAULT 1,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT
);

CREATE INDEX idx_ingredient_measurement_ingredient ON ingredient_measurement(ingredient_id);
CREATE INDEX idx_ingredient_measurement_variant ON ingredient_measurement(variant_id);
CREATE UNIQUE INDEX idx_ingredient_measurement_default
  ON ingredient_measurement(ingredient_id, COALESCE(variant_id, ''), unit_id, COALESCE(size_option, ''))
  WHERE is_default = 1;
```

Rules:
- `piece/quả/trái/củ/tép`, `pack`, `bottle`, `serving` không được global-convert; bắt buộc có measurement theo ingredient/product/state/size.
- `cup/tbsp/tsp` có thể global-convert sang `ml`; nếu cần sang `g` thì phải có measurement hoặc density đáng tin.
- Nếu `applies_to = 'gross'`, nutrition calculation phải nhân `edible_yield_ratio` trước khi tính macro.
- Mọi UI hiển thị measurement `is_approximate = 1` phải có dấu `≈` hoặc nhãn `ước lượng`.
- Khi measurement được dùng trong pantry/recipe/log, saved row phải lưu conversion snapshot gồm `measurement_id`, `version`, `quantity_per_unit`, `quantity_unit_id`, `applies_to`, `edible_yield_ratio`, `confidence`.

#### 4.0d ingredient_variant (Phase 1.5A target)

```sql
CREATE TABLE ingredient_variant (
  id                    TEXT PRIMARY KEY,
  ingredient_id          TEXT NOT NULL REFERENCES ingredient(id) ON DELETE CASCADE,
  state                 TEXT NOT NULL CHECK (state IN ('raw', 'cooked', 'peeled', 'chopped', 'canned', 'dried', 'frozen', 'drained', 'roasted', 'boiled')),
  form                  TEXT,                         -- whole, diced, sliced, minced, powder, liquid...
  preparation_note      TEXT,
  default_measurement_id TEXT REFERENCES ingredient_measurement(id),
  is_default            INTEGER NOT NULL DEFAULT 0,
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT
);

CREATE INDEX idx_ingredient_variant_ingredient ON ingredient_variant(ingredient_id);
CREATE UNIQUE INDEX idx_ingredient_variant_unique
  ON ingredient_variant(ingredient_id, state, COALESCE(form, ''));
```

Rules:
- Dùng variant khi raw/cooked/peeled/chopped/canned/dried có nutrition hoặc conversion khác nhau.
- SQLite không cho expression như `COALESCE(form, '')` trong table-level `UNIQUE(...)`; dùng unique expression index riêng như trên.
- MVP Phase 1.5A có thể seed default variant `raw/whole` cho ingredient hiện có rồi mở rộng dần.

#### 4.0e data_source (Phase 1.5A/2 target)

```sql
CREATE TABLE data_source (
  id              TEXT PRIMARY KEY,
  source_type     TEXT NOT NULL CHECK (source_type IN ('USDA', 'OpenFoodFacts', 'Nutritionix', 'AI', 'User', 'CuratedDB')),
  external_id     TEXT,
  source_url      TEXT,
  license         TEXT,
  fetched_at      TEXT,
  raw_payload_json TEXT
);
```

### 4.1 ingredient

Nguyên liệu với thông tin dinh dưỡng canonical theo `100g` hoặc `100ml` (F-01). Nutrition source of truth chỉ nằm ở `ingredient`; unit system chỉ convert về basis này. Phase 1 cho phép một số ingredient được curate dưới dạng **composite ingredient** cho broth/sauce/base để giữ seed dataset gọn.

```sql
CREATE TABLE ingredient (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,                -- "Ức gà"
  category          TEXT NOT NULL CHECK (category IN ('Thịt', 'Cá & Hải sản', 'Trứng & Sữa', 'Rau củ', 'Ngũ cốc & Tinh bột', 'Đậu & Hạt', 'Dầu & Mỡ', 'Gia vị', 'Nước dùng & Nước chấm', 'Trái cây', 'Khác')),
  
  -- Canonical nutrition basis (authoritative)
  nutrition_basis_unit TEXT NOT NULL CHECK (nutrition_basis_unit IN ('g', 'ml')),
  nutrition_basis_quantity REAL NOT NULL DEFAULT 100,

  -- Dinh dưỡng canonical (per 100g hoặc 100ml)
  calories          REAL NOT NULL,                -- kcal
  protein           REAL NOT NULL DEFAULT 0,      -- g
  carbs             REAL NOT NULL DEFAULT 0,      -- g
  fat               REAL NOT NULL DEFAULT 0,      -- g
  fiber             REAL NOT NULL DEFAULT 0,      -- g

  -- Optional bridge mass <-> volume. Chỉ dùng nếu có nguồn đáng tin.
  density_g_per_ml  REAL,
  
  -- Nguồn dữ liệu
  source            TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai', 'db')),
  
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT
);

CREATE INDEX idx_ingredient_name ON ingredient(name);
CREATE INDEX idx_ingredient_category ON ingredient(category);
```

Rules:
- Mỗi ingredient chỉ có đúng 1 nutrition basis authoritative: `100g` hoặc `100ml` trong Phase 1.
- `density_g_per_ml` là optional. Nếu có, chỉ dùng làm bridge khi cần convert khác dimension và không có curated `factor_to_basis` / `ingredient_measurement` phù hợp hơn.
- Scope nutrient của redesign này vẫn là `calories`, `protein`, `carbs`, `fat`, `fiber`. `sugar` / `sodium` chưa được thêm vào schema Phase 1 này.
- Phase 1.5A có thể thêm `nutrition_profile` để lưu raw source nutrition per `100g`, `100ml`, `piece`, hoặc `serving`, nhưng calculation vẫn phải normalize về `100g/100ml` khi có đủ conversion.

#### 4.1b nutrition_profile (Phase 1.5A/2 target)

Bảng này lưu provenance của nutrition source. Phase 1 vẫn dùng columns trực tiếp trên `ingredient`; Phase 1.5A/2 dùng `nutrition_profile` khi cần product/barcode, serving/package, hoặc nhiều source cho cùng ingredient variant.

```sql
CREATE TABLE nutrition_profile (
  id                       TEXT PRIMARY KEY,
  ingredient_variant_id    TEXT REFERENCES ingredient_variant(id) ON DELETE CASCADE,
  product_id               TEXT REFERENCES product(id) ON DELETE CASCADE,
  basis_type               TEXT NOT NULL CHECK (basis_type IN ('per_100g', 'per_100ml', 'per_piece', 'per_serving')),
  basis_quantity           REAL NOT NULL,
  basis_unit_id            TEXT NOT NULL REFERENCES unit(id),
  calories                 REAL NOT NULL,
  protein_g                REAL NOT NULL DEFAULT 0,
  carbs_g                  REAL NOT NULL DEFAULT 0,
  fat_g                    REAL NOT NULL DEFAULT 0,
  fiber_g                  REAL NOT NULL DEFAULT 0,
  sugar_g                  REAL,
  sodium_mg                REAL,
  normalized_basis_unit_id TEXT CHECK (normalized_basis_unit_id IN ('g', 'ml')),
  calories_per_100         REAL,
  protein_per_100          REAL,
  carbs_per_100            REAL,
  fat_per_100              REAL,
  fiber_per_100            REAL,
  serving_size_value       REAL,
  serving_size_unit_id     TEXT REFERENCES unit(id),
  serving_measurement_id   TEXT REFERENCES ingredient_measurement(id),
  data_source_id           TEXT REFERENCES data_source(id),
  confidence               TEXT NOT NULL CHECK (confidence IN ('verified', 'estimated', 'user_custom', 'ai_estimated')),
  is_default               INTEGER NOT NULL DEFAULT 0,
  created_at               TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at               TEXT,
  CHECK ((ingredient_variant_id IS NOT NULL) OR (product_id IS NOT NULL))
);
```

Rules:
- `per_piece` và `per_serving` chỉ được dùng cho precise calculation khi có serving/measurement convert được về `g/ml`.
- Product/barcode nutrition có thể lưu source values (`per_serving`) và normalized values (`*_per_100`) song song.

Rule provenance cho `ingredient`:
- Seed ingredient insert từ `ingredients.json` phải dùng `source = 'db'`
- User tạo ingredient thủ công mới dùng `source = 'manual'`
- Ingredient tạo từ AI lookup dùng `source = 'ai'`
- Nếu user sửa một seed ingredient gốc, record đó đổi `source` từ `db` sang `manual`
- Nếu user sửa một AI-lookup ingredient (`source = 'ai'`), record đó đổi `source` từ `ai` sang `manual`
- Trước khi insert AI-lookup ingredient: app kiểm tra tên trùng/gần giống trong DB → nếu trùng, cảnh báo user + cho chọn cập nhật record cũ hoặc tạo mới

### 4.2 dish

Món ăn — ingredient-based hoặc AI auto-fill (F-02). Total nutrition KHÔNG được persist trên `dish`; đọc từ VIEW `dish_with_totals` (xem 4.2b). Các seeded dishes của Phase 1 được lưu như dish rows bình thường và cho phép user sửa trực tiếp record gốc.

```sql
CREATE TABLE dish (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,                -- "Phở bò"
  description       TEXT,

  -- Loại món (Quick Add đã loại khỏi V1)
  type              TEXT NOT NULL CHECK (type IN ('ingredient_based', 'ai_autofill')),
  source            TEXT NOT NULL DEFAULT 'custom' CHECK (source IN ('db', 'custom', 'ai')),

  servings          REAL NOT NULL DEFAULT 1,      -- Số phần ăn
  image_url         TEXT,                         -- Ảnh (local path hoặc null)

  -- Phase 1 seed grouping (V4). NULL cho user-created/AI dishes; seeded
  -- Vietnamese dishes phân loại theo bữa (6 sáng / 7 trưa / 7 tối).
  meal_tag          TEXT CHECK (meal_tag IN ('breakfast', 'lunch', 'dinner')),

  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT
);

CREATE INDEX idx_dish_name ON dish(name);
CREATE INDEX idx_dish_meal_tag ON dish(meal_tag);
```

Rule provenance cho `dish`:
- Seed dish insert từ `dishes.json` phải dùng `source = 'db'`
- User tạo ingredient-based dish mới dùng `source = 'custom'`
- AI auto-fill saved dish dùng `source = 'ai'`
- Nếu user sửa một seed dish gốc, record đó đổi `source` từ `db` sang `custom`

**Total nutrition rule (RULE-DISH-TOTAL):**
- `total_calories / total_protein / total_carbs / total_fat / total_fiber` là **derived** — single source of truth là VIEW `dish_with_totals`.
- Repository **MUST** đọc total từ VIEW, không tự SUM trong code application layer.
- UI form (chưa save) có thể dùng helper `computeDishTotalsPreview()` để hiển thị realtime; preview này KHÔNG persist và KHÔNG được dùng làm authoritative source ở bất cứ nơi nào downstream.

### 4.2b dish_with_totals (VIEW)

VIEW SQL — single source of truth cho dish-level macros. JOIN `dish` ↔ `dish_ingredient` ↔ `ingredient`, nhân `normalized_amount / nutrition_basis_quantity`, SUM theo dish.

```sql
CREATE VIEW dish_with_totals AS
SELECT
  d.id, d.name, d.description, d.type, d.source, d.servings, d.image_url, d.meal_tag,
  d.created_at, d.updated_at,
  COALESCE(SUM(i.calories * di.normalized_amount / i.nutrition_basis_quantity), 0) AS total_calories,
  COALESCE(SUM(i.protein  * di.normalized_amount / i.nutrition_basis_quantity), 0) AS total_protein,
  COALESCE(SUM(i.carbs    * di.normalized_amount / i.nutrition_basis_quantity), 0) AS total_carbs,
  COALESCE(SUM(i.fat      * di.normalized_amount / i.nutrition_basis_quantity), 0) AS total_fat,
  COALESCE(SUM(i.fiber    * di.normalized_amount / i.nutrition_basis_quantity), 0) AS total_fiber
FROM dish d
LEFT JOIN dish_ingredient di ON di.dish_id = d.id
LEFT JOIN ingredient i ON i.id = di.ingredient_id
GROUP BY d.id;
```

Lưu ý:
- `LEFT JOIN` để dish chưa có ingredient nào vẫn xuất hiện với total = 0 (nhưng theo validation, dish bắt buộc ≥ 1 ingredient nên trạng thái này chỉ tồn tại transient trong form chưa save).
- Khi `ingredient` thay đổi nutrition (calories/protein/...), VIEW phản ánh ngay lập tức cho mọi dish sử dụng — đây là behavior **mong muốn** (đảm bảo zero drift).
- Nếu cần snapshot lịch sử (ví dụ planned_dish ăn ngày cũ giữ nguyên macro), snapshot ở tầng `planned_dish` chứ không phải `dish`.

### 4.3 dish_ingredient

Bảng trung gian: món ăn ↔ nguyên liệu (khối lượng). Lưu user input gốc (`amount_value` + `unit_id`) **và** `normalized_amount` (đã convert về basis unit của ingredient). Macro snapshot đã bị DROP — total nutrition được compute on-the-fly qua VIEW `dish_with_totals`.

```sql
CREATE TABLE dish_ingredient (
  id                TEXT PRIMARY KEY,
  dish_id           TEXT NOT NULL REFERENCES dish(id) ON DELETE CASCADE,
  ingredient_id     TEXT NOT NULL REFERENCES ingredient(id) ON DELETE RESTRICT,
  amount_value      REAL NOT NULL,                -- 150, 300, 2...
  unit_id           TEXT NOT NULL REFERENCES unit(id),
  normalized_amount REAL NOT NULL,                -- Đã convert về basis unit của ingredient (g hoặc ml)

  UNIQUE(dish_id, ingredient_id)
);

-- Phase 1.5A target extension:
-- measurement_id TEXT REFERENCES ingredient_measurement(id),
-- size_option TEXT,
-- conversion_snapshot_json TEXT,
-- normalized_unit_id TEXT CHECK (normalized_unit_id IN ('g', 'ml'))

CREATE INDEX idx_dish_ingredient_dish ON dish_ingredient(dish_id);
```

**Normalization formula (compute lúc insert/update):**
```
resolveUnit(ingredient_id, unit_id, amount_value):
  1. Lookup ingredient.nutrition_basis_unit
  2. Lookup unit registry + ingredient_unit (nếu có)
  3. Nếu unit cùng dimension với basis:
       - dùng global factor hoặc ingredient_unit.factor_to_basis phù hợp
  4. Nếu unit khác dimension với basis:
       - ưu tiên ingredient_unit.factor_to_basis
       - nếu không có thì dùng ingredient.density_g_per_ml
       - nếu vẫn không có thì REJECT
  5. Trả normalized_amount cùng dimension với nutrition_basis_unit
```

**Rules:**
- Lưu **cả** `amount_value + unit_id` (user input gốc) **và** `normalized_amount` (g/ml). KHÔNG lưu macro snapshot.
- `normalized_amount` luôn phải cùng dimension với `ingredient.nutrition_basis_unit`.
- Không được silent convert giữa `g` và `ml` nếu thiếu curated factor hoặc `density_g_per_ml`.
- Unit có `is_approximate = 1` (VD `pinch`) vẫn được phép dùng trong Phase 1, nhưng UI phải hiển thị dấu `≈` hoặc nhãn `ước lượng`.
- Khi ingredient nutrition thay đổi → total của dish **AUTO** cập nhật (vì derived qua VIEW). Đây là behavior cố ý — single source of truth.

### 4.4 day_plan

Kế hoạch ăn 1 ngày (F-03).

```sql
CREATE TABLE day_plan (
  id                TEXT PRIMARY KEY,
  date              TEXT NOT NULL,                -- "2026-04-14"
  
  -- Mục tiêu (snapshot từ user_profile tại thời điểm tạo)
  target_calories   REAL NOT NULL,
  target_protein    REAL NOT NULL,
  
  -- Tổng thực tế (auto-calculated từ meal_slot + planned_dish)
  total_calories    REAL NOT NULL DEFAULT 0,
  total_protein     REAL NOT NULL DEFAULT 0,
  total_carbs       REAL NOT NULL DEFAULT 0,
  total_fat         REAL NOT NULL DEFAULT 0,
  
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT,
  
  UNIQUE(date)
);

CREATE INDEX idx_day_plan_date ON day_plan(date);
```

### 4.5 meal_slot

Bữa ăn trong ngày: Sáng / Trưa / Tối / Phụ.

```sql
CREATE TABLE meal_slot (
  id                TEXT PRIMARY KEY,
  day_plan_id       TEXT NOT NULL REFERENCES day_plan(id) ON DELETE CASCADE,
  meal_type         TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  
  -- Tổng (auto-calculated)
  total_calories    REAL NOT NULL DEFAULT 0,
  total_protein     REAL NOT NULL DEFAULT 0,
  total_carbs       REAL NOT NULL DEFAULT 0,
  total_fat         REAL NOT NULL DEFAULT 0,
  
  UNIQUE(day_plan_id, meal_type)
);

CREATE INDEX idx_meal_slot_day ON meal_slot(day_plan_id);
```

### 4.6 planned_dish

Món ăn đã được thêm vào 1 bữa.

```sql
CREATE TABLE planned_dish (
  id                TEXT PRIMARY KEY,
  meal_slot_id      TEXT NOT NULL REFERENCES meal_slot(id) ON DELETE CASCADE,
  dish_id           TEXT NOT NULL REFERENCES dish(id) ON DELETE RESTRICT,
  servings          REAL NOT NULL DEFAULT 1,      -- 0.5, 1, 2...
  sort_order        INTEGER NOT NULL DEFAULT 0,   -- Thứ tự hiển thị
  is_completed      INTEGER NOT NULL DEFAULT 0,   -- Đã ăn chưa (0/1)
  completed_at      TEXT,                         -- Thời điểm user đánh dấu đã ăn (dùng cho streak + insights)
  
  -- Dinh dưỡng đã tính (dish.total × servings)
  calories          REAL NOT NULL,
  protein           REAL NOT NULL DEFAULT 0,
  carbs             REAL NOT NULL DEFAULT 0,
  fat               REAL NOT NULL DEFAULT 0,
  
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_planned_dish_slot ON planned_dish(meal_slot_id);
```


### 4.7 storage_location (Phase 1.5A target)

Vị trí lưu trữ nguyên liệu trong nhà.

```sql
CREATE TABLE storage_location (
  id              TEXT PRIMARY KEY,
  user_id         TEXT REFERENCES user_profile(id),
  name            TEXT NOT NULL,                 -- "Tủ lạnh", "Tủ đông", "Kệ bếp"
  type            TEXT NOT NULL CHECK (type IN ('fridge', 'freezer', 'pantry', 'spice_rack', 'custom')),
  display_order   INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT
);
```

### 4.8 pantry_item (Phase 1.5A target)

Stock/lot nguyên liệu user đang có. Không trộn hạn dùng/vị trí vào `ingredient` master.

```sql
CREATE TABLE pantry_item (
  id                         TEXT PRIMARY KEY,
  user_id                    TEXT NOT NULL REFERENCES user_profile(id),
  ingredient_id              TEXT REFERENCES ingredient(id),
  ingredient_variant_id      TEXT REFERENCES ingredient_variant(id),
  product_id                 TEXT REFERENCES product(id),
  storage_location_id        TEXT NOT NULL REFERENCES storage_location(id),
  input_quantity_value       REAL NOT NULL,
  input_unit_id              TEXT NOT NULL REFERENCES unit(id),
  measurement_id             TEXT REFERENCES ingredient_measurement(id),
  size_option                TEXT,
  gross_quantity             REAL,
  gross_unit_id              TEXT REFERENCES unit(id),
  edible_quantity            REAL,
  edible_unit_id             TEXT REFERENCES unit(id),
  remaining_edible_quantity  REAL,
  conversion_snapshot_json   TEXT NOT NULL,
  purchase_date              TEXT,
  opened_at                  TEXT,
  expiry_date                TEXT,
  status                     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'expired', 'discarded')),
  created_at                 TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at                 TEXT,
  CHECK ((ingredient_id IS NOT NULL) OR (ingredient_variant_id IS NOT NULL) OR (product_id IS NOT NULL))
);

CREATE INDEX idx_pantry_item_location ON pantry_item(storage_location_id);
CREATE INDEX idx_pantry_item_expiry ON pantry_item(expiry_date);
```

Rules:
- `input_quantity_value` + `input_unit_id` giữ nguyên cách user nhập.
- `edible_quantity` là amount dùng cho nutrition; `gross_quantity` dùng cho inventory nếu input có phần không ăn được.
- `conversion_snapshot_json` bắt buộc để biết conversion nào đã được dùng tại thời điểm nhập stock.
- Nhiều lot cùng ingredient nhưng khác expiry phải là nhiều `pantry_item`, không gộp mất hạn dùng.

### 4.9 product + barcode (Phase 2 target)

```sql
CREATE TABLE product (
  id                  TEXT PRIMARY KEY,
  ingredient_id       TEXT REFERENCES ingredient(id),
  name                TEXT NOT NULL,
  brand               TEXT,
  package_quantity    REAL,
  package_unit_id     TEXT REFERENCES unit(id),
  serving_size_text   TEXT,
  data_source_id      TEXT REFERENCES data_source(id),
  confidence          TEXT NOT NULL CHECK (confidence IN ('verified', 'estimated', 'user_custom')),
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT
);

CREATE TABLE barcode (
  id             TEXT PRIMARY KEY,
  product_id     TEXT NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  barcode_value  TEXT NOT NULL UNIQUE,
  barcode_type   TEXT CHECK (barcode_type IN ('EAN', 'UPC', 'QR', 'OTHER'))
);
```

Rules:
- Barcode/product scope để Phase 2 sau khi manual pantry + measurement ổn định.
- Product có thể có package quantity, serving size và nutrition profile riêng; không ép mọi product thành ingredient thuần.

---

---

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
| 3 | `ingredient` | Nutrition | Nguyên liệu + canonical nutrition + unit metadata | — |
| 4 | `dish` | Nutrition | Món ăn | — |
| 5 | `dish_ingredient` | Nutrition | Nguyên liệu trong món | dish, ingredient |
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

**Tổng: 18 tables**

---

## 9. Seed Data

### 9.1 Vietnamese Core Seed (Phase 1)

```sql
-- Phase 1 ship curated dataset cho 20 món Việt core:
--   6 món sáng / 7 món trưa / 7 món tối
--   không có snack
-- Ingredient seed = union ingredients từ 20 món trên + staple bắt buộc

INSERT INTO ingredient (
  id, name, category,
  nutrition_basis_unit, nutrition_basis_quantity,
  calories, protein, carbs, fat, fiber,
  default_entry_unit, grams_per_unit, ml_per_unit,
  source
) VALUES
  (uuid(), 'Ức gà', 'Thịt', 'g', 100, 165, 31, 0, 3.6, 0, 'g', NULL, NULL, 'db'),
  (uuid(), 'Trứng gà', 'Trứng & Sữa', 'g', 100, 155, 13, 1.1, 11, 0, 'piece', 50, NULL, 'db'),
  (uuid(), 'Sữa tươi không đường', 'Trứng & Sữa', 'ml', 100, 42, 3.4, 5, 1, 0, 'ml', NULL, NULL, 'db'),
  (uuid(), 'Nước mắm', 'Dầu & Gia vị', 'ml', 100, 35, 5.1, 3.6, 0, 0, 'ml', NULL, NULL, 'db');
```

### 9.2 Vietnamese Core Dishes (Phase 1)

```sql
-- Dish seed được build từ curated source, insert sau ingredient seed
INSERT INTO dish (id, name, description, type, total_calories, total_protein, total_carbs, total_fat, total_fiber, servings)
VALUES
  (uuid(), 'Phở bò', 'Seed món Việt core cho bữa sáng', 'ingredient_based', 420, 28, 45, 12, 2, 1);

INSERT INTO dish_ingredient (
  id, dish_id, ingredient_id,
  amount_value, amount_unit, normalized_amount,
  calories, protein, carbs, fat, fiber
) VALUES
  (uuid(), dish_uuid('pho-bo'), ingredient_uuid('Thịt bò nạc'), 100, 'g', 100, 250, 26, 0, 15, 0),
  (uuid(), dish_uuid('pho-bo'), ingredient_uuid('Phở tươi'), 200, 'g', 200, 218, 6.4, 48, 0.8, 0);
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
| ingredient | idx_ingredient_name | name | Tìm kiếm theo tên |
| ingredient | idx_ingredient_category | category | Filter theo nhóm |
| dish | idx_dish_name | name | Tìm kiếm theo tên |
| dish_ingredient | idx_dish_ingredient_dish | dish_id | Join nhanh |
| day_plan | idx_day_plan_date | date | Query theo ngày |
| meal_slot | idx_meal_slot_day | day_plan_id | Join nhanh |
| planned_dish | idx_planned_dish_slot | meal_slot_id | Join nhanh |
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
