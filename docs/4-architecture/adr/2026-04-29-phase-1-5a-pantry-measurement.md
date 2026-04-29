# ADR 2026-04-29 — Phase 1.5A Pantry & Measurement Layer

Status: Accepted for documentation and implementation planning  
Date: 2026-04-29  
Scope: MealPlaning / HealthMate AI, docs + future implementation plan.  
Runtime code changed by this ADR: No.

---

## 1. Context

MealPlaning Phase 1 hiện là dish-first management:

- `ingredient` lưu identity + canonical nutrition per `100g` hoặc `100ml`.
- `ingredient_unit` hỗ trợ resolver cơ bản qua `factor_to_basis`.
- `dish_ingredient` lưu input amount/unit và `normalized_amount`.
- `dish_with_totals` là source of truth cho total nutrition của món.

Research ngày 2026-04-29 mở rộng scope sang pantry/stock, recipe/meal flow, barcode/product và nutrition profile. Các case user nêu cho thấy `ingredient_unit.factor_to_basis` chưa đủ để xử lý đúng:

- `1 quả cà chua` khác `1 quả trứng`, `1 trái dưa hấu`, `1 củ khoai tây`.
- `1 cup bột mì` khác `1 cup sữa` nếu cần convert sang gram.
- Dưa hấu/khoai tây/thịt/cá cần phân biệt gross amount và edible amount.
- Raw/cooked/peeled/chopped/canned/dried có thể có nutrition và conversion khác nhau.
- Pantry item cần quantity, expiry, storage location và conversion snapshot, không thể nhét vào `ingredient` master.

Source-of-truth hierarchy cho quyết định này:

1. `docs/4-architecture/business-rules.md`
2. `docs/2-requirements/prd.md`
3. `docs/3-design/data-model.md`
4. `docs/5-development/development-plan.md`
5. `docs/5-development/meal-recipe-pantry-nutrition-ux-data-model-research-2026-04-29.md`
6. `docs/3-design/mockups/phase-1-5-pantry-recipe-nutrition-wireflow.html`

---

## 2. Decision

### Decision 1 — Split Phase 1.5 into 1.5A and 1.5B

Accepted:

- Phase 1.5A = Pantry & Measurement.
- Phase 1.5B = AI Foundation.

Reason:

- Pantry/unit correctness is foundational data integrity.
- AI lookup/autofill should not be built on an insufficient measurement model.
- Manual pantry/measurement flow gives deterministic behavior before adding AI uncertainty.

Consequence:

- `docs/5-development/development-plan.md` now lists Phase 1.5A before Phase 1.5B.
- AI implementation remains deferred until after pantry/measurement contracts are stable.

---

### Decision 2 — Add `ingredient_measurement` instead of overloading global `unit`

Accepted:

- `unit` remains the global unit catalog.
- Global conversion is safe only for true mass/volume:
  - `g` / `kg` → mass.
  - `ml` / `l` → volume.
- Context-sensitive units require ingredient/product/state/size-specific measurement:
  - `piece`, `quả`, `trái`, `củ`, `tép`.
  - `cup`, `tbsp`, `tsp` when converting to mass.
  - `pack`, `bottle`, `serving`.

Target table:

- `ingredient_measurement`

Key fields:

- `ingredient_id`
- `variant_id`
- `unit_id`
- `display_label`
- `size_option`
- `quantity_per_unit`
- `quantity_unit_id`
- `applies_to`
- `edible_yield_ratio`
- `is_default`
- `is_approximate`
- `confidence`
- `data_source_id`
- `version`

Reason:

- Không thể có conversion global kiểu `1 piece = x gram`.
- Measurement cần version/confidence để trace và snapshot.
- Size option như small/medium/large/custom là property của measurement, không phải property của `unit`.

Consequence:

- `ingredient_unit` có thể giữ làm Phase 1 compatibility layer hoặc migration source.
- Future resolver phải ưu tiên `ingredient_measurement` trước `ingredient_unit` khi có cả hai.
- UI phải hiển thị marker `≈` hoặc nhãn `ước lượng` khi `is_approximate = 1`.

---

### Decision 3 — Add `ingredient_variant` for state/form-specific measurement and nutrition

Accepted:

- Add `ingredient_variant` to model state/form:
  - `raw`, `cooked`, `peeled`, `chopped`, `canned`, `dried`, `frozen`, etc.

Reason:

- Raw vs cooked/dried/canned can change both weight conversion and nutrition density.
- `1 cup chopped tomato` is not equivalent to `1 whole tomato`.
- Ingredient master should remain stable identity; variant captures preparation state.

Consequence:

- MVP Phase 1.5A may seed default variant `raw/whole` for current ingredients.
- More variants can be added incrementally.
- SQLite unique constraint for nullable `form` must use a unique expression index, not table-level `UNIQUE(... COALESCE(...))`.

---

### Decision 4 — Nutrition calculation always uses normalized edible amount

Accepted formula:

```text
nutrition = nutrition profile × normalized edible amount

normalized edible amount
= user input quantity
× ingredient/product-specific measurement
× edible_yield_ratio if input is gross
```

Accepted rules:

- If nutrition basis is `per_100g`, amount must resolve to edible grams.
- If nutrition basis is `per_100ml`, amount must resolve to edible milliliters.
- If nutrition source is `per_piece` or `per_serving`, it can be used precisely only when the serving/piece has a measurement or source basis that can be traced.
- Do not fallback `1g = 1ml`.

Reason:

- Nutrition databases commonly store per 100g/100ml.
- Pantry users often input real-world count/package/serving units.
- Gross weight includes inedible parts and must not inflate nutrition.

Consequence:

- Missing conversion must block authoritative save for pantry/recipe/meal lines until resolved.
- UI must ask one concrete question, e.g. “1 quả cà chua của bạn khoảng bao nhiêu gram?”
- User can choose “Chỉ lần này” or “Nhớ cho sau”.

---

### Decision 5 — Pantry is stock/lot, not ingredient master

Accepted:

- Add `storage_location` and `pantry_item`.
- `ingredient` stores identity/nutrition/measurement master data.
- `pantry_item` stores user-owned stock/lot data:
  - input quantity/unit.
  - normalized gross/edible amount.
  - remaining quantity.
  - location.
  - expiry/opened date.
  - conversion snapshot.

Reason:

- Same ingredient can exist in multiple lots with different expiry/location.
- Expiry and location are personal stock facts, not ingredient identity.

Consequence:

- Pantry list should display both user input and normalized amount, e.g. `4 quả ≈ 480g`.
- Auto-decrement stock is deferred unless implementation explicitly handles lot selection and gross/edible decrement rules.

---

### Decision 6 — Save conversion snapshots on usage rows

Accepted:

- Pantry item / dish ingredient line / future recipe line / meal log usage should save `conversion_snapshot_json` or equivalent structured columns.
- Historical meal/food logs should save `nutrition_snapshot_json` or equivalent columns.

Reason:

- Measurement and nutrition master data can be corrected later.
- Historical logs must remain explainable and not silently drift.
- Active dish/recipe can derive live, but historical consumed food should preserve what was logged.

Consequence:

- MVP Phase 1.5A should update the line models and repositories to preserve conversion snapshots before meal logging becomes more advanced.
- Snapshot should include at minimum:
  - `measurement_id`
  - `measurement_version`
  - `quantity_per_unit`
  - `quantity_unit_id`
  - `applies_to`
  - `edible_yield_ratio`
  - `confidence`
  - `is_approximate`
  - `normalized_edible_amount`

---

### Decision 7 — Product/barcode is modeled but deferred after manual pantry MVP

Accepted:

- Add target entities in docs:
  - `product`
  - `barcode`
  - `data_source`
  - `nutrition_profile`
- Do not implement barcode scan as part of the first Phase 1.5A MVP unless explicitly re-scoped.

Reason:

- Barcode/product import can expand scope significantly due to external data quality, serving sizes and package variants.
- Manual pantry + measurement resolver should work first.

Consequence:

- Schema can reserve a clean path for packaged foods.
- MVP remains focused: search/manual pantry, ingredient-specific conversion, nutrition preview.

---

## 3. Rejected alternatives

### Alternative A — Use global conversion for `piece/cup/serving`

Rejected.

Reason:

- `1 piece` has no universal weight.
- `1 cup` only globally converts to volume, not mass.
- `1 serving` depends on product/recipe/source.

Risk if accepted:

- Silent nutrition errors that look authoritative.

---

### Alternative B — Store pantry expiry/location directly on `ingredient`

Rejected.

Reason:

- Ingredient is master data; expiry/location is user stock/lot data.
- Multiple lots with different expiry would be impossible or incorrect.

---

### Alternative C — Store only normalized grams/ml and discard user input

Rejected.

Reason:

- User expects to see `4 quả`, `1 chai`, `1 cup` again.
- Debugging nutrition requires knowing the conversion used.
- Future edits need original input context.

---

### Alternative D — Implement AI lookup before measurement layer

Rejected for current plan.

Reason:

- AI output would still need deterministic conversion and missing-conversion UX.
- AI can produce plausible but untraceable unit conversions if schema does not constrain it.

---

## 4. Implementation implications

Implementation should follow:

- `docs/plans/2026-04-29-phase-1-5a-pantry-measurement-implementation.md`
- `docs/3-design/mockups/phase-1-5-pantry-recipe-nutrition-wireflow.html`
- `docs/4-architecture/business-rules.md`

Expected MVP implementation order:

1. Add TypeScript models for variant, measurement, pantry item, storage location and conversion snapshot.
2. Add SQLite migration for target Phase 1.5A tables.
3. Seed storage locations and minimal measurements for existing seed ingredients.
4. Implement measurement resolver with explicit resolved/unresolved result.
5. Update dish ingredient line flow to preserve conversion snapshot.
6. Build pantry list/add-stock flow.
7. Build missing conversion sheet.
8. Verify with tests, build, APK and emulator UI checks before claiming complete.

---

## 5. Verification already performed for docs

- Keyword consistency check: PASS.
- SQLite snippet compile check: PASS for target tables.
- Mockup static layout contract: PASS.
- Scoped docs-only verification: PASS with note that unrelated runtime/config dirty files already exist in workspace.

---

## 6. Open questions

These are intentionally not decided by this ADR:

1. Should runtime eventually rename `dish` to `recipe`, or keep `dish` internally and use “công thức/món ăn” in UI copy?
   - Current recommendation: keep `dish` for Phase 1.5A to avoid risky rename.
2. Should `ingredient_unit` become a compatibility view or remain as a physical table during migration?
   - Current recommendation: add `ingredient_measurement` side-by-side first.
3. Should pantry decrement happen automatically when a dish is cooked/logged?
   - Current recommendation: defer until meal logging/stock lot selection is explicit.
4. Which external data source should be primary for Vietnamese ingredient nutrition?
   - Current recommendation: curated seed data first; USDA/Open Food Facts later with provenance.

---

## 7. References

- `docs/5-development/meal-recipe-pantry-nutrition-ux-data-model-research-2026-04-29.md`
- `docs/3-design/audits/2026-04-29-pantry-recipe-nutrition-data-model-sync-audit.md`
- `docs/3-design/audits/2026-04-29-phase-1-5a-wireflow-visual-review.md`
- `docs/3-design/mockups/phase-1-5-pantry-recipe-nutrition-wireflow.html`
- `docs/plans/2026-04-29-phase-1-5a-pantry-measurement-implementation.md`
- `docs/2-requirements/prd.md`
- `docs/3-design/data-model.md`
- `docs/4-architecture/business-rules.md`
- `docs/5-development/development-plan.md`
