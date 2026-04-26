# Delta Checklist — Từ Schema Hiện Tại sang Hướng ADR Unit + Macro

**Status:** Reviewed / approved decisions applied
**Date:** 2026-04-25
**Mục tiêu:** Liệt kê chính xác cần sửa gì để chuyển từ model hiện tại (`amount_unit`, `default_entry_unit`, `grams_per_unit`, `ml_per_unit`) sang hướng mới:
- `unit`
- `ingredient_unit`
- `dish_ingredient.unit_id`
- `ingredient.density_g_per_ml` (optional)
- giữ macro canonical `/100g` hoặc `/100ml`

---

## 1. Tóm tắt delta kiến trúc

### Hiện tại

`ingredient` đang chứa:
- `nutrition_basis_unit`
- `nutrition_basis_quantity`
- `calories`, `protein`, `carbs`, `fat`, `fiber`
- `default_entry_unit`
- `grams_per_unit`
- `ml_per_unit`

`dish_ingredient` đang chứa:
- `amount_value`
- `amount_unit`
- `normalized_amount`
- `UNIQUE(dish_id, ingredient_id)`

### Mục tiêu mới

`ingredient` sẽ chứa:
- nutrition canonical như cũ
- thêm `density_g_per_ml` nullable
- bỏ `default_entry_unit`, `grams_per_unit`, `ml_per_unit`

Thêm mới:
- `unit`
- `ingredient_unit`

`dish_ingredient` sẽ đổi:
- `amount_unit` → `unit_id`
- giữ `amount_value`
- giữ `normalized_amount`
- giữ `UNIQUE(dish_id, ingredient_id)` theo quyết định hiện tại

---

## 2. File-level delta checklist

## A. Documentation — BẮT BUỘC sửa trước

### A1. `docs/3-design/data-model.md`

**Hiện có:**
- `ingredient` dùng `default_entry_unit`, `grams_per_unit`, `ml_per_unit`
- `dish_ingredient` dùng `amount_unit`

**Cần sửa:**
1. Thêm section mới trước `ingredient`:
   - `unit`
   - `ingredient_unit`
2. Sửa DDL `ingredient`:
   - giữ `nutrition_basis_unit`, `nutrition_basis_quantity`, macro fields
   - thêm `density_g_per_ml REAL`
   - bỏ:
     - `default_entry_unit`
     - `grams_per_unit`
     - `ml_per_unit`
3. Sửa DDL `dish_ingredient`:
   - bỏ `amount_unit`
   - thêm `unit_id TEXT NOT NULL REFERENCES unit(id)`
4. Viết lại phần normalization formula:
   - không còn `if amount_unit == 'piece'`
   - thay bằng `resolveUnit(ingredient_id, unit_id, amount_value)`
5. Thêm rule precedence:
   - curated `ingredient_unit.factor_to_basis`
   - fallback `density_g_per_ml`
   - reject nếu vẫn không convert được
6. Cập nhật examples:
   - trứng: `piece/quả`
   - tỏi: `clove/tép`
   - bơ: `tbsp`
   - tiêu: `pinch`

**Mức ưu tiên:** Critical

---

### A2. `docs/4-architecture/business-rules.md`

**Hiện có:**
- `amount_unit ∈ {'g','ml','piece'}`
- `'piece'` dùng `grams_per_unit | ml_per_unit`

**Cần sửa:**
1. Thay RULE-DI-NORM hiện tại bằng rule mới theo `unit_id`
2. Thêm rule mới:
   - `RULE-UNIT-RESOLVE-01`: cùng dimension → global factor
   - `RULE-UNIT-RESOLVE-02`: ingredient-specific unit → dùng `ingredient_unit.factor_to_basis`
   - `RULE-UNIT-RESOLVE-03`: cross-dimension → curated factor > density > reject
   - `RULE-UNIT-RESOLVE-04`: không silent convert
   - `RULE-UNIT-RESOLVE-05`: approximate units phải được flag
3. Giữ nguyên RULE-DISH-TOTAL vì engine derived total không đổi
4. Thêm note rõ:
   - `normalized_amount` phải cùng dimension với `nutrition_basis_unit`

**Mức ưu tiên:** Critical

---

### A3. `docs/2-requirements/prd.md`

**Cần sửa ở F-01 / F-02:**
1. Ingredient form không còn 1 `default_entry_unit` đơn lẻ
2. Thay bằng section “Danh sách đơn vị có thể nhập”
3. Dish edit form:
   - dropdown unit theo ingredient
   - không hard-code `g/ml/piece`
4. Error UX:
   - nếu unit không convert được → báo rõ lý do
5. Approximate unit:
   - hiển thị dấu `≈`

**Mức ưu tiên:** High

---

### A4. `docs/5-development/phase-1-management.md`

**Hiện có:** vẫn mô tả canonical model theo `default_entry_unit`, `grams_per_unit`, `ml_per_unit`.

**Cần sửa:**
1. Update §4.3 Nutrition Canonical Model + Unit Policy
2. Thay metadata ingredient list từ:
   - `default_entry_unit`
   - `grams_per_unit?`
   - `ml_per_unit?`
   sang:
   - `nutrition_basis_unit`
   - `density_g_per_ml?`
   - `ingredient_units[]`
3. Thêm task mới cho:
   - seed `unit`
   - seed `ingredient_unit`
   - resolver unit
4. Sửa acceptance criteria về unit conversion

**Mức ưu tiên:** High

---

### A5. `docs/5-ai/ai-strategy.md`

**Cần sửa:**
1. AI ingredient/dish output đổi từ `amount_unit` sang `unit_id`
2. AI ingredient creation không còn trả `default_entry_unit`, `grams_per_unit`, `ml_per_unit`
3. Thay bằng:
   - `nutrition_basis_unit`
   - optional `density_g_per_ml`
   - `ingredient_units[]`
4. Thêm strict validation:
   - AI trả `unit_id` lạ → reject
   - AI trả cross-dimension unit mà không có bridge → reject/fallback rule rõ ràng

**Mức ưu tiên:** High

---

## B. Database / Schema — phải sync ngay sau docs

### B1. `src/app/core/services/database/schema.ts`

**Current evidence:**
- `ingredient.default_entry_unit` ở line 81
- `ingredient.grams_per_unit` ở line 82
- `ingredient.ml_per_unit` ở line 83
- `dish_ingredient.amount_unit` ở line 115

**Cần sửa:**
1. Tạo table `unit`
2. Tạo table `ingredient_unit`
3. Sửa table `ingredient`:
   - thêm `density_g_per_ml REAL`
   - bỏ `default_entry_unit`
   - bỏ `grams_per_unit`
   - bỏ `ml_per_unit`
4. Sửa table `dish_ingredient`:
   - bỏ `amount_unit`
   - thêm `unit_id TEXT NOT NULL REFERENCES unit(id)`
5. Giữ `normalized_amount`
6. Giữ VIEW `dish_with_totals` nếu nutrient fields chưa đổi
7. Nếu muốn hỗ trợ sugar/sodium sau này:
   - tạm thời KHÔNG sửa ngay ở bước này, trừ khi product chốt thêm nutrient scope

**Mức ưu tiên:** Critical

---

### B2. Migration strategy

Nếu Phase 1 chưa phát hành cho user thật:
- có thể rewrite schema trực tiếp

Nếu đã có local data cần preserve:
- cần migration script/backfill:
  1. seed `unit`
  2. tạo `ingredient_unit` từ fields cũ
  3. map `dish_ingredient.amount_unit` → `unit_id`
  4. giữ `normalized_amount`

**Mức ưu tiên:** Critical nếu đã có persistent test data

---

## C. Domain / Service layer — cần tạo mới

### C1. New file: `src/app/core/services/unit-resolver.ts`

**Phải có:**
- hàm `resolveUnit(ingredient, unit, amountValue, ingredientUnit?)`
- trả về:
  - `normalizedAmount`
  - metadata nếu cần display

**Rule logic:**
1. same-dimension global unit → global factor
2. ingredient-specific unit → `ingredient_unit.factor_to_basis`
3. cross-dimension:
   - curated factor
   - else density
   - else throw error

**Mức ưu tiên:** Critical

---

### C2. New file: `src/app/core/errors/invalid-dish-ingredient-unit.error.ts`

**Phải có:**
- ingredient id/name
- unit id
- basis unit
- reason code:
  - `UNIT_NOT_ALLOWED`
  - `MISSING_CONVERSION`
  - `DIMENSION_MISMATCH`
  - `DENSITY_REQUIRED`

**Mức ưu tiên:** High

---

### C3. `computeDishTotalsPreview` helper

**Cần sửa hoặc tạo mới:**
- helper không được tự giả định `amount_unit in g/ml/piece`
- phải dùng cùng resolver logic như repository
- tránh 2 source of truth cho conversion

**Mức ưu tiên:** Critical

---

## D. Repository layer — hiện gần như chưa có cho ingredient/dish

### D1. New repositories cần có

Tạo mới dự kiến:
- `src/app/core/repositories/unit.repository.ts`
- `src/app/core/repositories/ingredient-unit.repository.ts`
- `src/app/core/repositories/ingredient.repository.ts`
- `src/app/core/repositories/dish.repository.ts`
- `src/app/core/repositories/dish-ingredient.repository.ts`

### D2. Quy tắc repository

- `dish-ingredient.repository` phải gọi `resolveUnit()` trước khi insert/update
- repository là nơi enforce validation cuối cùng
- UI không được là nơi authoritative cho conversion

**Mức ưu tiên:** High

---

## E. Frontend / UX delta

### E1. Ingredient edit UI

**Từ model cũ:**
- 1 dropdown `default_entry_unit`
- vài input `grams_per_unit/ml_per_unit`

**Sang model mới:**
- 1 section quản lý `ingredient_units[]`
- user có thể:
  - chọn unit allowed
  - set default unit
  - nhập factor cho từng unit
  - xem approximate marker

**Mức ưu tiên:** High

---

### E2. Dish edit UI

**Cần sửa:**
- dropdown unit không còn hard-code 3 giá trị
- phải load theo ingredient đang chọn
- nếu unit approximate → hiển thị `≈`
- nếu unit không convert được → disable hoặc báo lỗi sớm

**Mức ưu tiên:** High

---

### E3. Read/display UI

**Cần sửa:**
- display primary dùng `display_label` hoặc `unit.short_name_vi`
- optional secondary display:
  - `2 muỗng canh (≈ 28g)`
- không hiển thị internal `unit_id`

**Mức ưu tiên:** Medium

---

## F. Seed data delta

### F1. Script

File dự kiến liên quan:
- `scripts/seed/build-vietnamese-core.ts`

**Cần sửa:**
1. Generate `units.json`
2. Generate `ingredient_units.json`
3. `ingredients.json` không còn chứa:
   - `default_entry_unit`
   - `grams_per_unit`
   - `ml_per_unit`
4. Nếu ingredient có density đáng tin → thêm `density_g_per_ml`

**Mức ưu tiên:** Critical

---

### F2. Seed curation checklist

Mỗi ingredient seed cần được audit:
- basis là `g` hay `ml`
- allowed units là gì
- default unit là gì
- factor_to_basis cho từng unit
- approximate không
- density có đáng tin không

**Mức ưu tiên:** Critical

---

## G. Testing delta

### G1. Unit tests — resolver

Bắt buộc test các case:
1. `g` basis + `g`
2. `g` basis + `kg`
3. `ml` basis + `ml`
4. `ml` basis + `tbsp`
5. `g` basis + `piece`
6. `g` basis + `clove`
7. `g` basis + `tbsp` có curated factor
8. `g` basis + `tbsp` dùng density fallback
9. `g` basis + `tbsp` thiếu cả factor và density → reject
10. `ml` basis + `g` thiếu density → reject
11. approximate unit vẫn convert được nhưng có marker

**Mức ưu tiên:** Critical

---

### G2. Regression tests — macro consistency

Cần test:
- cùng dataset cũ, trước và sau redesign cho ra cùng total macro nếu input logic tương đương
- VIEW `dish_with_totals` không đổi kết quả với row đã normalized đúng

**Mức ưu tiên:** Critical

---

### G3. Migration tests

Nếu có migration/backfill:
- row cũ `amount_unit='g'/'ml'/'piece'` map đúng sang `unit_id`
- `normalized_amount` giữ nguyên
- total macro sau migration không đổi

**Mức ưu tiên:** High

---

## 3. 3 quyết định còn phải chốt trước khi code

### Q1. `density_g_per_ml` có được dùng làm fallback tự động không?
**Đã chốt:** Có. Thứ tự ưu tiên là `ingredient_unit.factor_to_basis` → `density_g_per_ml` → reject.

### Q2. Approximate unit (`pinch`, `bunch`) có cho phép trong Phase 1 không?
**Đã chốt:** Có. UI phải hiển thị `≈` / `ước lượng`.

### Q3. Có thêm sugar/sodium ngay trong redesign này không?
**Đã chốt:** Không. Đợt redesign này chỉ tập trung unit + macro hiện có (`calories`, `protein`, `carbs`, `fat`, `fiber`).

---

## 4. Thứ tự thực hiện khuyến nghị

1. ADR review & approve
2. Sửa docs:
   - `data-model.md`
   - `business-rules.md`
   - `prd.md`
   - `phase-1-management.md`
   - `ai-strategy.md`
3. Chốt seed unit registry + ingredient_units
4. Viết `unit-resolver.ts`
5. Viết tests cho resolver
6. Rewrite `schema.ts`
7. Viết repositories
8. Cập nhật UI
9. Chạy regression test macro

---

## 5. Kết luận ngắn

Nếu làm theo ADR mới, delta thực tế không nằm ở công thức macro mà nằm ở:
- layer resolve unit
- schema unit registry
- seed data curation
- validation và migration

Macro engine hiện tại có thể giữ nguyên, miễn là `normalized_amount` tiếp tục được đảm bảo đúng và cùng dimension với `nutrition_basis_unit`.
