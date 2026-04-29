# Phase 1.5A — Pantry & Measurement

Status: Ready for implementation planning / not implemented  
Date: 2026-04-29  
Runtime code changed by this doc: No

---

## 1. Goal

Phase 1.5A bổ sung nền tảng quản lý **kho nguyên liệu hằng ngày** và **quy đổi đơn vị theo từng nguyên liệu/product/state/size** trước khi triển khai AI nâng cao.

Mục tiêu user-facing:

1. User biết trong nhà đang có nguyên liệu gì.
2. User thêm stock bằng ngôn ngữ đời thường như `4 quả cà chua`, `1 trái dưa hấu`, `1 cup bột mì`, `1 chai sữa`.
3. App tính dinh dưỡng dựa trên **normalized edible amount** thay vì đoán conversion.
4. App cảnh báo/đặt câu hỏi khi thiếu conversion, không silent fallback.
5. Recipe/dish line và pantry item lưu conversion snapshot để không drift dữ liệu lịch sử.

---

## 2. Source-of-truth

Thứ tự ưu tiên khi docs mâu thuẫn:

1. `docs/4-architecture/business-rules.md`
2. `docs/2-requirements/prd.md` §F-02.5
3. `docs/3-design/data-model.md` §4.0c–4.0e, §4.7–4.9
4. `docs/4-architecture/adr/2026-04-29-phase-1-5a-pantry-measurement.md`
5. `docs/3-design/mockups/phase-1-5-pantry-recipe-nutrition-wireflow.html`
6. `docs/plans/2026-04-29-phase-1-5a-pantry-measurement-implementation.md`
7. Research background: `docs/5-development/meal-recipe-pantry-nutrition-ux-data-model-research-2026-04-29.md`

---

## 3. Scope

### In scope

| Area | Included |
|---|---|
| Pantry list | List stock/lot theo vị trí, hạn dùng, trạng thái còn/hết/hỏng. |
| Add stock | Search ingredient trước, chọn ingredient/product/manual fallback, nhập quantity/unit/location/expiry. |
| Storage location | Seed `Tủ lạnh`, `Tủ đông`, `Kệ bếp`; cho phép custom sau. |
| Ingredient variant | Model state/form như raw/whole, peeled, chopped, cooked, canned, dried. |
| Ingredient measurement | Conversion theo ingredient/product/state/size/unit. |
| Gross vs edible | Tách gross quantity và edible quantity khi có vỏ/xương/hao hụt. |
| Missing conversion UX | Bottom sheet hỏi đúng một câu; user chọn “Chỉ lần này” hoặc “Nhớ cho sau”. |
| Nutrition preview | Preview kcal/protein/carbs/fat/fiber sau khi resolve conversion. |
| Conversion snapshot | Lưu snapshot ở pantry item và recipe/dish ingredient usage. |
| Compatibility | Giữ `ingredient_unit` cho Phase 1; thêm `ingredient_measurement` side-by-side. |

### Out of scope

| Area | Reason |
|---|---|
| Barcode scan runtime | Product/barcode model được chuẩn bị nhưng scan/import để Phase 2. |
| OCR nhãn dinh dưỡng | Scope lớn, phụ thuộc camera/AI. |
| Rename runtime `dish` → `recipe` | Rủi ro lớn, không cần cho Phase 1.5A. UI có thể dùng “món ăn/công thức”. |
| Quick Add/manual total | Bị loại khỏi V1; nutrition phải derive từ ingredient line. |
| Auto-decrement pantry khi nấu/log món | Cần quyết định lot selection và decrement gross/edible; defer. |
| AI Lookup / AI Auto-fill | Thuộc Phase 1.5B. |

---

## 4. Product UX flow

### 4.1 Pantry list flow

```text
Quản lý → Kho nguyên liệu
  → Search/filter theo tên, vị trí, sắp hết hạn
  → Pantry card hiển thị:
      - tên nguyên liệu/product
      - vị trí: Tủ lạnh / Tủ đông / Kệ bếp
      - input user thấy: 4 quả
      - normalized amount: ≈480g edible
      - hạn dùng / opened date
      - confidence marker: verified / estimated / user custom
```

Rules:

- Pantry là stock/lot, không phải ingredient master.
- Nhiều lot cùng nguyên liệu nhưng khác hạn dùng/vị trí phải là nhiều `pantry_item`.
- UI không hiển thị technical field như `factor_to_basis` trên màn chính.

### 4.2 Add stock flow

```text
Tap “Thêm vào kho”
  → Search ingredient/product trước
  → Chọn result hoặc manual fallback
  → Nhập số lượng + unit
  → Chọn vị trí lưu trữ
  → Nhập hạn dùng / opened date nếu có
  → Resolver kiểm tra conversion
      ├─ Resolved → preview dinh dưỡng → save
      └─ Needs conversion → mở missing conversion sheet
```

Required preview before save:

- Input: `4 quả cà chua`
- Conversion: `1 quả vừa ≈ 120g edible`
- Normalized: `≈480g edible`
- Nutrition preview: kcal/protein/carbs/fat/fiber nếu dùng hết
- Snapshot marker: `estimated · version 3`

### 4.3 Missing conversion flow

```text
User nhập unit chưa resolve được
  → App không lưu authoritative line
  → App hỏi một câu cụ thể:
      “1 quả cà chua của bạn khoảng bao nhiêu gram?”
      “1 trái dưa hấu này nặng khoảng bao nhiêu kg?”
      “1 cup bột mì này khoảng bao nhiêu gram?”
  → Options: Nhỏ / Vừa / Lớn / Tự nhập
  → Nếu có gross: hỏi edible yield ratio
  → User chọn:
      - Chỉ lần này: lưu snapshot only
      - Nhớ cho sau: tạo/update ingredient_measurement
```

Rules:

- Không fallback `1g = 1ml`.
- Không dùng global `1 piece = x gram`.
- Không dùng global `1 cup = x gram`; `cup` chỉ global về `ml`, còn sang `g` cần measurement/density đáng tin.

### 4.4 Recipe/dish line flow

```text
Tạo/sửa món ăn
  → Thêm ingredient line
  → Nhập amount + unit
  → Resolver trả normalized edible amount
  → UI preview nutrition line
  → Save line gồm input + normalized amount + conversion snapshot
  → dish_with_totals tiếp tục derive tổng từ ingredient/line
```

Phase 1.5A không rename runtime `dish`; copy UI có thể dùng “món ăn/công thức”.

---

## 5. Data model target

### 5.1 Tables added or extended

| Entity | Purpose | Phase 1.5A rule |
|---|---|---|
| `ingredient_variant` | State/form của ingredient | Seed default `raw/whole` khi cần. |
| `ingredient_measurement` | Ingredient/product-specific conversion | Bắt buộc cho count/package/serving/cup-to-gram. |
| `data_source` | Provenance cho curated/user/external data | Optional in MVP, useful for confidence/source. |
| `storage_location` | Vị trí lưu trữ | Seed `Tủ lạnh`, `Tủ đông`, `Kệ bếp`. |
| `pantry_item` | Stock/lot user đang có | Lưu input, location, expiry, edible quantity, snapshot. |
| `nutrition_profile` | Multi-source nutrition provenance | Target Phase 1.5A/2, implement only if needed for product/serving. |
| `product` / `barcode` | Packaged food | Model target; runtime barcode scan deferred. |
| `dish_ingredient` | Existing line table | Add optional measurement/snapshot fields, no manual macro snapshot. |

### 5.2 Compatibility policy

- Keep `ingredient_unit` during Phase 1.5A.
- Add `ingredient_measurement` side-by-side.
- Resolver priority:

```text
1. Exact ingredient_measurement by ingredient/product + variant/state + unit + size
2. Existing ingredient_unit.factor_to_basis for Phase 1 compatibility
3. density_g_per_ml only when source is trustworthy and dimension bridge is valid
4. needs_conversion state
```

### 5.3 Snapshot minimum fields

`conversion_snapshot_json` should include:

```json
{
  "measurement_id": "tomato_piece_medium_v3",
  "measurement_version": 3,
  "quantity_per_unit": 120,
  "quantity_unit_id": "g",
  "applies_to": "edible",
  "edible_yield_ratio": 1,
  "confidence": "estimated",
  "is_approximate": true,
  "normalized_edible_amount": 480
}
```

Historical meal/food log should later store `nutrition_snapshot_json` or equivalent columns.

---

## 6. Calculation rules

### 6.1 Canonical formula

```text
normalized edible amount
= input quantity
× measurement quantity_per_unit
× edible_yield_ratio when applies_to = gross

nutrition
= nutrition per canonical basis
× normalized edible amount / basis quantity
```

### 6.2 Case table

| Case | Required conversion | Example |
|---|---|---|
| Nutrition per 100g, input gram | direct mass conversion | `200g cà chua` → 200g edible. |
| Nutrition per 100ml, input ml/l | direct volume conversion | `1l sữa` → 1000ml. |
| Input piece/count | ingredient-specific measurement | `2 quả trứng lớn × 50g`. |
| Input cup/tbsp/tsp to gram | ingredient-specific measurement or density | `1 cup bột mì ≈120g`. |
| Input cup/tbsp/tsp to ml | global volume conversion allowed | `1 cup sữa = 240ml`. |
| Gross input with peel/bone | edible_yield_ratio required | `5kg dưa hấu gross × 60% = 3kg edible`. |
| Serving/package | product-specific measurement | `1 serving cereal = 30g`. |

---

## 7. Example fixtures for implementation QA

| Ingredient | Input | Measurement | Expected normalized edible amount |
|---|---:|---|---:|
| Cà chua raw | 4 quả vừa | 1 quả vừa ≈ 120g edible | 480g |
| Trứng gà raw | 2 quả lớn | 1 quả lớn ≈ 50g edible | 100g |
| Dưa hấu whole | 1 trái vừa | 5kg gross × 60% edible yield | 3000g |
| Khoai tây raw | 3 củ vừa | 1 củ vừa ≈ 170g gross × 85% yield | 433.5g |
| Bột mì | 1 cup | 1 cup ≈ 120g | 120g |
| Sữa tươi | 1 chai | 1 chai = 1000ml | 1000ml |

---

## 8. Implementation slices

Implementation detail plan lives at:

`docs/plans/2026-04-29-phase-1-5a-pantry-measurement-implementation.md`

Recommended execution slices:

1. Models and strict TypeScript types.
2. SQLite migration and compatibility tests.
3. Storage location + measurement seed fixtures.
4. Measurement resolver with resolved/needs-conversion result.
5. Pantry repositories and store.
6. Dish ingredient line snapshot integration.
7. Pantry list/add stock UI.
8. Missing conversion sheet UI.
9. Verification: unit tests, build, Android sync/APK, emulator UI check.

---

## 9. Acceptance criteria

### Functional

- [ ] User can list pantry items by location and expiry.
- [ ] User can add stock by selecting existing ingredient.
- [ ] User can enter `g/kg/ml/l` with safe global conversion.
- [ ] User can enter count/package/cooking units only when measurement exists or after resolving missing conversion.
- [ ] User sees nutrition preview before saving stock or line.
- [ ] Missing conversion sheet asks one concrete question.
- [ ] User can save conversion only for this time or remember it for future.
- [ ] Pantry item stores input quantity/unit, normalized edible quantity and conversion snapshot.
- [ ] Dish ingredient line can store conversion snapshot without breaking `dish_with_totals`.

### Data integrity

- [ ] No global `piece = x gram` or global `serving = x gram` exists.
- [ ] `cup/tbsp/tsp` are not converted to gram without ingredient-specific measurement or trusted density.
- [ ] Gross amount is not used directly for nutrition when edible yield is required.
- [ ] Existing Phase 1 ingredient/dish flows remain compatible.
- [ ] No manual total nutrition is stored on `dish` or `dish_ingredient`.

### UX and visual

- [ ] Main UI uses plain Vietnamese copy, not internal field names.
- [ ] Approximate values show `≈` or `ước lượng`.
- [ ] Full-bleed/content inset rule is respected.
- [ ] Floating Action Button (nút hành động nổi) does not cover final content.

### Verification before claim done

- [ ] `npm run build`
- [ ] Targeted unit tests for resolver/repositories/migration.
- [ ] Full relevant test suite if feasible.
- [ ] Android sync and APK build.
- [ ] Install on emulator/device and run user-like UI checks.

---

## 10. Risks and guardrails

| Risk | Guardrail |
|---|---|
| Scope creep into barcode/OCR/AI | Keep barcode/product import out of Phase 1.5A runtime. |
| Breaking existing dish-first Phase 1 | Keep `dish`, `ingredient_unit`, `dish_with_totals` compatibility. |
| Wrong nutrition due to guessed conversion | Resolver must return `needs_conversion`, not guess. |
| Data drift after measurement edit | Save conversion snapshot at usage time. |
| User confusion from technical fields | Technical mapping stays in spec notes; UI asks plain-language questions. |
| Inconsistent phase naming | Use Phase 1.5A for pantry/measurement; Phase 1.5B for AI Foundation. |

---

## 11. Open decisions before or during implementation

1. Should `ingredient_measurement` be populated from `ingredient_unit` automatically during migration, or lazily when resolver first sees an ingredient?
   - Current recommendation: seed minimal explicit measurements for known fixtures and fallback to `ingredient_unit` for compatibility.
2. Should `pantry_item` require `ingredient_variant_id`, or allow ingredient-only for MVP?
   - Current recommendation: allow ingredient-only, derive default variant in resolver/store.
3. Should “Nhớ cho sau” create a new measurement row or update an existing default?
   - Current recommendation: create a new user_custom measurement unless user explicitly edits an existing one.
4. Should pantry decrement happen when user marks a meal as eaten?
   - Current recommendation: defer.

---

## 12. Done definition for Phase 1.5A

Phase 1.5A is done only when:

1. User can manage pantry stock manually.
2. Measurement resolver handles resolved and missing-conversion states deterministically.
3. Nutrition preview is based on normalized edible amount.
4. Conversion snapshot is persisted for pantry/usage rows.
5. Existing Phase 1 dish-first behavior remains intact.
6. Build/test/APK/emulator verification is completed and documented.
