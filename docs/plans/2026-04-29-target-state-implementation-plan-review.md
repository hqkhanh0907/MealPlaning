# Review Report — Target-State Implementation Plan

**Reviewed file:** `docs/plans/2026-04-29-target-state-meal-recipe-pantry-nutrition-implementation.md` (964 dòng, 20 task)
**Reviewer:** Hermes Agent
**Ngày:** 2026-04-29
**Phạm vi:** Đối soát plan với runtime hiện tại (`src/app/core/services/database/schema.ts`, `migrations.ts`, `unit-resolver.ts`, `tabs.routes.ts`, `dish.repository.ts`), không chạy code.

---

## 1. Tóm tắt

| Hạng mục | Trạng thái |
|---|---|
| Cấu trúc plan (20 task, dependency layer) | OK |
| Coverage 9 đầu ra của report | OK |
| Acceptance criteria cuối plan | OK nhưng còn chung chung |
| Liên kết với runtime thực tế | **Cần chỉnh** — bỏ qua một số ràng buộc đang chạy |
| Commit boundary | OK ở Task 0, nhưng commit sequence chưa map 1-1 với task |
| Edge case nhân quả schema legacy | **Thiếu** |
| Phương án migration backward-compatible | **Thiếu chi tiết** |

Tổng đánh giá: plan **đủ tốt để bắt đầu**, nhưng cần bổ sung 7 nhóm điều chỉnh trước khi code, để tránh va chạm với schema/VIEW đang phục vụ flow dish hiện hữu.

---

## 2. Phát hiện đối soát runtime

### 2.1 SCHEMA_VERSION hiện tại = 5 (không phải 0)

Bằng chứng: `src/app/core/services/database/schema.ts:15` → `export const SCHEMA_VERSION = 5;` và `MIGRATION_REGISTRY[4].version === SCHEMA_VERSION` trong `migrations.spec.ts:28`.

Tác động: Task 2 nói "Increment SCHEMA_VERSION by 1" — đúng về cú pháp, nhưng plan tổng có 4–5 đợt schema (Task 2 foundation + Task 7 dish_ingredient + Task 9 pantry + Task 13 meal/log + Task 15 shopping). Phải chốt:

- **Phương án A (khuyến nghị):** mỗi task có schema riêng → 5 phiên bản V6, V7, V8, V9, V10. Mỗi commit độc lập, dễ rollback.
- **Phương án B:** gộp 1 mega-migration V6. Dễ hỏng, khó debug, không nên.

Plan chưa khai báo rõ ràng. Cần chốt phương án A trong header.

### 2.2 `dish_with_totals` là VIEW dựa trên công thức cũ

Bằng chứng: `schema.ts:126`:
```sql
CREATE VIEW IF NOT EXISTS dish_with_totals AS
  SELECT ...
    SUM(i.calories * di.normalized_amount / i.nutrition_basis_quantity) AS total_calories,
    ...
  FROM dish d
  LEFT JOIN dish_ingredient di
  LEFT JOIN ingredient i
```

Repository `dish.repository.ts` đang đọc trực tiếp từ VIEW này (`SELECT * FROM dish_with_totals ...` ở line 40, 46, 52, 152).

Tác động Task 7 + Task 8:

- Khi `dish_ingredient` có thêm cột `nutrition_snapshot_json`, nếu **không** rebuild VIEW thì Task 8 phương án 1 (đọc snapshot trong TS) phải **bỏ qua VIEW** → repo phải refactor 4 callsite trên.
- Plan Task 8 nói "option 1: short-term repository reads `dish_ingredient.nutrition_snapshot_json` and sums in TypeScript" — đúng, nhưng cần ghi rõ: **VIEW vẫn phải tồn tại để fallback** cho ingredient line cũ chưa có snapshot, hoặc plan phải có bước backfill.

**Đề xuất bổ sung Task 8 sub-step:**
1. Repository `getDish*()` ưu tiên `nutrition_snapshot_json` per line.
2. Nếu line nào null snapshot (legacy), fallback công thức cũ `calories × normalized_amount / nutrition_basis_quantity`.
3. Sau khi backfill xong, drop VIEW ở migration sau.

### 2.3 `dish_ingredient.amount_unit` đang CHECK enum `('g','ml','piece')`

Bằng chứng: `schema.ts:115` → `amount_unit TEXT NOT NULL CHECK (amount_unit IN ('g', 'ml', 'piece'))`.

Tác động Task 7: muốn lưu `cup`, `tbsp`, `fruit`, `tuber`, `clove`, `bottle`, `serving` vào `dish_ingredient` thì **không thể chỉ ADD COLUMN** — phải drop CHECK constraint hoặc tạo bảng `dish_ingredient_v2` rồi copy dữ liệu (giống cách `ingredient_unit_v3` đang làm ở line 482).

Plan Task 7 chỉ nói "Modify schema/migration if dish_ingredient needs new columns" — chưa nêu pattern recreate-table. Cần bổ sung.

### 2.4 `ingredient.default_entry_unit` cũng CHECK enum cũ

Bằng chứng: `schema.ts:81` → `default_entry_unit TEXT NOT NULL CHECK (default_entry_unit IN ('g', 'ml', 'piece'))`.

Tác động: Task 1 thêm `FoodForm` và `FoodState`, nhưng để bind vào ingredient master, nếu muốn `default_entry_unit` = `cup`, `tbsp`... thì phải mở rộng enum hoặc bỏ. Plan **không đề cập**. Đây là gốc gây silent fail khi UI nhập unit mới mà DB từ chối.

**Đề xuất:** Task 2 phải có sub-step "Drop CHECK on `ingredient.default_entry_unit`, thay bằng FK soft đến `unit.code`" hoặc chuyển hẳn sang `default_entry_unit_id REFERENCES unit(id)`.

### 2.5 `ingredient_unit_v3` đã có và đang dùng `factor_to_basis`

Bằng chứng: `schema.ts:482` `CREATE TABLE ingredient_unit_v3` với cùng `factor_to_basis` column, đã được migration copy từ bảng cũ rồi DROP bảng cũ.

Tác động Task 4 (measurement-resolver): plan nói "Replace the old `factor_to_basis` mental model" và "keep existing `unit-resolver.ts` as compatibility wrapper" — tốt. Nhưng phải làm rõ:

- Resolver mới đọc `ingredient_measurement` (mới) **trước**, fallback sang `ingredient_unit_v3.factor_to_basis` (cũ) **sau**.
- Migration data từ `ingredient_unit_v3` sang `ingredient_measurement` có hay không? Nếu không, dữ liệu hiện tại của user **biến mất** khỏi flow mới.

**Đề xuất:** Task 6 hoặc Task 17 phải có "data backfill migration: convert each `ingredient_unit_v3` row → `ingredient_measurement` row với `applies_to='gross'`, `confidence='imported'`, `source='legacy_factor'`". Nếu không backfill, mọi dish hiện tại của user sẽ thành `conversion_status='missing'` sau khi giải pháp mới online.

### 2.6 4-tab layout đã đầy: dashboard / calendar / management / fitness

Bằng chứng: `src/app/tabs/tabs.routes.ts` chỉ có 4 children.

Tác động Task 10 (pantry UI): không có chỗ cho Pantry tab thứ 5 nếu giữ nguyên IA. Plan nói "Modify routing: app.routes.ts or tabs/* depending current tab setup" — quá chung chung.

**Cần quyết định trước khi code:**
1. Pantry là sub-route của `management` (Quản lý → Tủ lạnh / Nguyên liệu / Món ăn)?
2. Hay là tab thứ 5 (sửa BottomNav)?
3. Hay thay tab `fitness`?

Tương tự Task 14 (food log): hiện chỉ có `calendar` (kế hoạch). Food log đặt trong `calendar` hay `dashboard` hay tab mới? Plan chưa chốt.

### 2.7 `day_plan / meal_slot / planned_dish` đã tồn tại

Bằng chứng: `schema.ts:146-188` có 3 bảng meal-plan kiểu cũ, có cột `total_calories/protein/carbs/fat` denormalized.

Tác động Task 13: plan tạo `meal_plan` + `meal_plan_item` mới, nhưng KHÔNG nói gì về 3 bảng cũ. Hai khả năng:

- **(A) Coexist:** giữ 3 bảng cũ, thêm 2 bảng mới song song. → schema double, dễ lệch dữ liệu.
- **(B) Replace:** migrate `day_plan + meal_slot + planned_dish` → `meal_plan + meal_plan_item`, drop bảng cũ.

Plan phải chọn B (giảm nợ kỹ thuật) hoặc A nhưng có deprecation timeline rõ ràng.

**Đề xuất:** Task 13 thêm sub-step "Migration plan từ planned_dish sang meal_plan_item: copy mỗi planned_dish row → meal_plan_item với `kind='recipe'`, `ref_id=dish_id`, `nutrition_preview_json` từ snapshot calories/protein/carbs/fat hiện có".

---

## 3. Edge case còn thiếu trong plan

### 3.1 Resolver

| Edge case | Đã có trong Task 4? | Đề xuất |
|---|---|---|
| User nhập unit count nhưng `size_option` không có measurement (ví dụ "1 quả ớt size large" mà DB chỉ có medium) | Không | Resolver fallback medium + flag `confidence='estimated'`, hoặc trả `missing` tùy policy. Phải chốt. |
| Variant chuyển trạng thái: input `cooked` nhưng nutrition profile chỉ có `raw` | Không | Resolver phải biết apply cooking yield ratio nếu có `recipe_step`/`variant_link`, hoặc trả `incomplete` với issueCode='state_mismatch'. |
| Density cho `ml ↔ g` trong cùng ingredient (sữa đặc) | Một phần | Test case mới: 100ml sữa đặc ≠ 100g. Plan phải có `density_g_per_ml` trong `ingredient_measurement` hoặc `nutrition_profile`. |
| Conversion cycle: cup → ml → g (cup chuối nghiền) | Không | Cần rule "tối đa 2 hop conversion". Tránh vòng lặp. |
| `dozen → piece → g` cho trứng | Một phần | Test case explicit: `unit=dozen, quantity=2` → 24 quả → 24×50g=1200g. Bảo đảm `dozen` không bị treat là volume. |
| Negative `edible_yield_ratio` hoặc > 1 | Không | Validation tại insert thời điểm `ingredient_measurement` (CHECK 0 < ratio ≤ 1). |

### 3.2 Schema integrity

| Edge case | Trong plan? | Đề xuất |
|---|---|---|
| Xóa ingredient có pantry_item / food_log / recipe_line | Không | Task 7/9/13 phải định ON DELETE cho mọi FK. Food log nên RESTRICT (bảo toàn lịch sử), pantry có thể CASCADE (tùy nghiệp vụ). |
| Unit bị rename/xóa (đổi `cup` thành `cup_us`) | Không | `ingredient_measurement.unit_id` phải RESTRICT, cấm xóa unit còn dùng. |
| Nutrition profile có nhiều version cho cùng ingredient (USDA + user_custom) | Có (`is_authoritative`) | Cần thêm rule: chỉ 1 row `is_authoritative=1` per `(ingredient_id, variant_id)`. UNIQUE partial index. |
| Snapshot JSON phình to | Không | Khuyến nghị giới hạn snapshot < 4KB/row, tách `recipe_nutrition_summary` cho aggregate. |

### 3.3 UI/UX

| Edge case | Trong plan? | Đề xuất |
|---|---|---|
| User thay đổi `ingredient_measurement` sau khi đã log food | Có (Task 13 — food log immutable) | Cần test case explicit Task 19: log 1 quả trứng @ 50g, đổi measurement thành 60g, food log cũ vẫn 50g. |
| User nhập 0 quantity hoặc số âm | Một phần (Task 4 throws on negative) | Form-level: hiển thị message validation, không gọi resolver. |
| Conversion missing nhưng user save anyway | Có (Task 12 "Save button can save incomplete only with visible warning") | Định nghĩa rõ: khi nào dish total = "đang thiếu", hiển thị placeholder ra sao trên dashboard. |
| Offline: barcode scan không có internet (Task 16) | Không | Plan cần quyết định: lưu barcode vào queue retry, hay thông báo immediate not_found. |

---

## 4. Acceptance criteria cần làm sắc nét

Plan hiện viết kiểu "Schema has target-state tables", "Tests and build pass". Đề xuất bổ sung **chỉ tiêu đo được**:

1. **Coverage:** mỗi resolver/calculator có ≥ 8 unit test, mỗi repository có ≥ 5 spec test.
2. **Schema integrity:** 1 spec test "fresh DB v6+ contains all 25 target tables, view, indexes". 1 spec test "upgrade từ v5 → v(latest) không mất dữ liệu của bảng `ingredient`, `dish`, `dish_ingredient`".
3. **Backward compat:** 1 e2e test "dish được tạo trên schema cũ vẫn hiển thị đúng totals sau khi schema mới online" (legacy fallback path).
4. **Resolver determinism:** snapshot cùng input × 100 lần ra cùng kết quả; không phụ thuộc system locale, timezone.
5. **No silent failure:** zero `console.error` nội bộ trong test suite — mọi missing conversion phải đi qua return value, không ném exception.
6. **Guard pass:** `check:guards`, `check:food-measurement`, `check:form-pattern`, `check:pc1-external-templates`, `check:style-2025-naming` đều xanh.

---

## 5. Commit boundary cần chuẩn hóa

Plan gợi 14 commit (line 941–954). Map lại theo task để 1 task ↔ 1 commit, dễ revert:

| Commit | Task |
|---|---|
| 1 | Task 1 |
| 2 | Task 2 |
| 3 | Task 3 |
| 4 | Task 4 |
| 5 | Task 5 |
| 6 | Task 6 |
| 7 | Task 7 + Task 8 (cùng đụng dish flow) |
| 8 | Task 9 |
| 9 | Task 10 |
| 10 | Task 11 |
| 11 | Task 12 |
| 12 | Task 13 + migration day_plan/meal_slot/planned_dish |
| 13 | Task 14 |
| 14 | Task 15 |
| 15 | Task 16 |
| 16 | Task 17 |
| 17 | Task 18 |
| 18 | Task 19 (release tag/ documentation only) |

Mỗi commit phải có `npm run build && ng test --watch=false` xanh trước khi push. Không stage 13 file `dish-edit/ingredient-edit/management/*` đang dirty trừ khi task chỉ định.

---

## 6. Đề xuất bổ sung 3 task mới

### Task 1.5 — Compatibility shim layer cho unit/ingredient

**Mục tiêu:** Trước khi đổi schema CHECK enum, viết shim cho `dish.repository`/`dish-ingredient.repository` để các unit mới (`cup`, `tbsp`...) không bị reject.

**Lý do:** Tránh tình huống Task 7 phải đụng cùng lúc cả model + schema + repo trong 1 commit.

### Task 6.5 — Backfill migration `ingredient_unit_v3` → `ingredient_measurement`

**Mục tiêu:** Mỗi row `ingredient_unit_v3` với `factor_to_basis ≠ 1` được sao chép thành `ingredient_measurement` row, đánh dấu `confidence='imported'`, `source='legacy_factor'`.

**Lý do:** Tránh mất dữ liệu user hiện tại khi resolver mới online.

### Task 13.5 — Migration `day_plan/meal_slot/planned_dish` → `meal_plan/meal_plan_item`

**Mục tiêu:** Copy dữ liệu kế hoạch ăn cũ sang bảng mới, drop hoặc deprecate bảng cũ.

**Lý do:** Tránh schema double, lệch dữ liệu.

---

## 7. Risk note bổ sung

Ngoài 5 risk đã có ở plan (line 958–964), thêm:

- **R6:** Snapshot JSON migration không có schema versioning. Nếu sau này đổi shape `ConversionSnapshot`, các row cũ phải migrate. Đề xuất thêm field `snapshot_version: number` ngay từ Task 1.
- **R7:** Trên Android native SQLite, một số CHECK constraint phức tạp có thể không tương thích. Test trên emulator-5554 trước khi tag release.
- **R8:** sql.js (web) và `@capacitor-community/sqlite` (native) có thể behave khác với `CREATE VIEW` phụ thuộc subquery aggregate. Phải test cả 2 backend.
- **R9:** User đang có data ở runtime hiện tại (sau giai đoạn dev đã khá lâu). Mọi migration **không được mất** ingredient/dish/day_plan đang có.

---

## 8. Gating checklist trước khi vào code

- [ ] Quyết định IA: Pantry là tab 5, sub-route management, hay thay tab fitness?
- [ ] Quyết định coexist hay migrate cho `day_plan/meal_slot/planned_dish`?
- [ ] Quyết định giữ hay drop `dish_with_totals` VIEW?
- [ ] Quyết định data backfill `ingredient_unit_v3` → `ingredient_measurement` (Y/N)?
- [ ] Chốt rule: missing conversion → block save hay save với warning?
- [ ] Chốt rule: ai có quyền tạo `nutrition_profile is_authoritative=1`?
- [ ] Chốt format `snapshot_version` field từ ngày đầu.
- [ ] Confirm: không scope barcode external API cho V6 (theo Task 16 stub).

Khi 8 quyết định trên rõ ràng, plan có thể chuyển sang trạng thái "ready to implement".

---

## 9. Đánh giá tổng thể

**Điểm mạnh:**
- Phân tách 20 task theo dependency layer hợp lý.
- Resolver/calculator API shape rõ, test case đủ tiêu biểu.
- Bảo vệ tính bất biến của food log từ đầu.
- Có guard chống regression (`check:food-measurement`).

**Điểm yếu (cần fix):**
- Bỏ qua schema legacy đang chạy (CHECK enum, VIEW, ingredient_unit_v3, day_plan).
- IA cho Pantry/Food Log chưa chốt.
- Acceptance criteria chưa định lượng.
- Không có data backfill plan → mất dữ liệu user hiện tại.
- Snapshot versioning chưa có.

**Khuyến nghị:**
1. Bổ sung mục "Pre-flight decisions" với 8 checkbox ở §8 trên vào header plan.
2. Thêm 3 task 1.5 / 6.5 / 13.5.
3. Chỉnh Task 2 và Task 7 để xử lý CHECK enum legacy.
4. Chỉnh Task 8 để xử lý VIEW fallback.
5. Định lượng hóa acceptance criteria.

Sau khi cập nhật, plan sẵn sàng để bắt đầu Task 1.
