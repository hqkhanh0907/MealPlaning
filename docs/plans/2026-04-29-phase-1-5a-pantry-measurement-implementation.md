# Phase 1.5A Pantry & Measurement Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build Phase 1.5A without changing the Phase 1 dish-first contract: add pantry stock, ingredient-specific measurement, missing-conversion UX, gross/edible handling, and conversion snapshots.

**Architecture:** Keep Phase 1 `ingredient`, `unit`, `ingredient_unit`, `dish`, `dish_ingredient`, and `dish_with_totals` behavior stable. Add Phase 1.5A tables and services beside the existing model, then migrate UI flows gradually. `dish` remains the runtime entity name; “công thức/recipe” is UX copy until a later product rename decision.

**Tech Stack:** Angular 21 standalone components, Ionic 8, Angular Signals, SQLite via existing `DatabaseService`, strict TypeScript, Style 2025 naming, external template/style files only.

**Source docs:**
- `docs/2-requirements/prd.md` §F-02.5
- `docs/3-design/data-model.md` §4.0c–4.0e, §4.7–4.9
- `docs/4-architecture/business-rules.md` measurement/pantry rules
- `docs/3-design/mockups/phase-1-5-pantry-recipe-nutrition-wireflow.html`
- `docs/3-design/audits/2026-04-29-pantry-recipe-nutrition-data-model-sync-audit.md`

---

## Non-goals

- Do not implement barcode scan in Phase 1.5A; model can reserve `product`/`barcode` for Phase 2.
- Do not rename runtime `dish` to `recipe`.
- Do not replace all Phase 1 `ingredient_unit` usage at once.
- Do not introduce Quick Add/manual total.
- Do not store manual total nutrition on `dish` or `dish_ingredient`.

---

## Acceptance Criteria

- [ ] Existing Phase 1 tests still pass.
- [ ] `ingredient_measurement`, `ingredient_variant`, `storage_location`, `pantry_item`, and `data_source` tables exist after migration.
- [ ] Existing ingredients can be treated as default variant `raw/whole` when no explicit variant exists.
- [ ] Unit resolver can return either resolved result or `needs_conversion` without silent fallback.
- [ ] Pantry item stores input quantity/unit, location, expiry, normalized edible quantity, and `conversion_snapshot_json`.
- [ ] Missing conversion UX asks one concrete question and supports “Chỉ lần này” vs “Nhớ cho sau”.
- [ ] Recipe/dish ingredient preview shows normalized amount and approximate marker `≈` when relevant.
- [ ] No runtime code uses `any`.
- [ ] Build, tests, Android sync/APK, emulator install, and manual UI checks pass before claiming done.

---

## Task 1: Add Phase 1.5A model types

**Objective:** Define strict TypeScript types for measurement, variant, pantry item, location, data source, and resolver snapshots.

**Files:**
- Modify: `src/app/core/models/management.types.ts`
- Modify: `src/app/core/models/management.model.ts`

**Steps:**
1. Add enum/string-union types:
   - `IngredientState`
   - `IngredientForm`
   - `MeasurementSizeOption`
   - `MeasurementAppliesTo`
   - `MeasurementConfidence`
   - `StorageLocationType`
   - `PantryItemStatus`
   - `DataSourceType`
2. Add interfaces:
   - `IngredientVariantModel`
   - `IngredientMeasurementModel`
   - `DataSourceModel`
   - `StorageLocationModel`
   - `PantryItemModel`
   - `ConversionSnapshotModel`
   - `NutritionSnapshotModel`
3. Keep existing `IngredientUnitModel` unchanged for compatibility.
4. Run TypeScript typecheck/build guard.

**Verification:**

```bash
npm run build
```

Expected: build still passes.

---

## Task 2: Add migration for Phase 1.5A tables

**Objective:** Add SQLite migration creating new tables without changing existing Phase 1 data.

**Files:**
- Modify: `src/app/core/services/database/migrations.ts`
- Modify: `src/app/core/services/database/migrations.spec.ts`
- Modify if needed: `src/app/core/services/database/schema-compatibility.ts`

**Steps:**
1. Inspect current highest migration version in `migrations.ts`.
2. Add next migration version with:
   - `data_source`
   - `ingredient_variant`
   - `ingredient_measurement`
   - `storage_location`
   - `pantry_item`
3. Add indexes:
   - `idx_ingredient_variant_ingredient`
   - `idx_ingredient_measurement_ingredient`
   - `idx_ingredient_measurement_variant`
   - `idx_pantry_item_location`
   - `idx_pantry_item_expiry`
4. Add compatibility test that all tables exist after migrations run.
5. Do not drop or rename `ingredient_unit`.

**Verification:**

```bash
npm test -- --watch=false --include='src/app/core/services/database/migrations.spec.ts'
npm run build
```

Expected: migration tests and build pass.

---

## Task 3: Seed default storage locations

**Objective:** Provide default storage locations: Tủ lạnh, Tủ đông, Kệ bếp, Gia vị.

**Files:**
- Modify or create: `src/app/core/services/seed/seed-loader.ts`
- Modify or create test: `src/app/core/services/seed/seed-loader.spec.ts`

**Steps:**
1. Add idempotent insert for default `storage_location` rows.
2. Ensure repeated seed loader run does not duplicate rows.
3. Keep labels Vietnamese.

**Verification:**

```bash
npm test -- --watch=false --include='src/app/core/services/seed/seed-loader.spec.ts'
```

Expected: seed loader remains idempotent.

---

## Task 4: Seed compatibility default ingredient variants

**Objective:** Allow existing Phase 1 ingredients to work with Phase 1.5A measurement flows via a default variant.

**Files:**
- Modify: `src/app/core/services/seed/seed-loader.ts`
- Test: `src/app/core/services/seed/seed-loader.spec.ts`

**Steps:**
1. For each ingredient without a variant, create one default variant:
   - `state = 'raw'`
   - `form = 'whole'` unless ingredient category suggests liquid/powder; keep MVP simple if no source.
2. Do not mutate existing ingredient nutrition.
3. Add test for idempotency.

**Verification:**

```bash
npm test -- --watch=false --include='src/app/core/services/seed/seed-loader.spec.ts'
```

---

## Task 5: Add repository layer for storage locations

**Objective:** CRUD/read default storage locations through repository pattern.

**Files:**
- Create: `src/app/core/repositories/storage-location.repository.ts`
- Create: `src/app/core/repositories/storage-location.repository.spec.ts`

**Steps:**
1. Implement `findAll()`, `findById(id)`, `create(input)`, `update(id, patch)`.
2. Sort by `display_order`, then name.
3. Tests cover empty list, seeded locations, update name/order.

**Verification:**

```bash
npm test -- --watch=false --include='src/app/core/repositories/storage-location.repository.spec.ts'
```

---

## Task 6: Add repository layer for ingredient measurements

**Objective:** Read/create/update ingredient-specific conversions.

**Files:**
- Create: `src/app/core/repositories/ingredient-measurement.repository.ts`
- Create: `src/app/core/repositories/ingredient-measurement.repository.spec.ts`

**Steps:**
1. Implement `findByIngredient(ingredientId)`, `findByVariant(variantId)`, `findDefaultForUnit(...)`, `create(input)`, `update(id, patch)`.
2. Enforce no `any` in JSON serialization.
3. Tests cover:
   - tomato medium piece 120g edible.
   - watermelon piece 5000g gross + 0.6 yield.
   - flour cup 120g edible.

**Verification:**

```bash
npm test -- --watch=false --include='src/app/core/repositories/ingredient-measurement.repository.spec.ts'
```

---

## Task 7: Add pantry repository

**Objective:** Persist stock/lot data with conversion snapshot.

**Files:**
- Create: `src/app/core/repositories/pantry.repository.ts`
- Create: `src/app/core/repositories/pantry.repository.spec.ts`

**Steps:**
1. Implement `findActive()`, `findByLocation(locationId)`, `findExpiringWithin(days)`, `create(input)`, `updateRemaining(id, amount)`, `markConsumed(id)`, `markDiscarded(id)`.
2. Store `conversion_snapshot_json` as stringified `ConversionSnapshotModel`.
3. Parse JSON safely when reading; on invalid JSON, return a typed error or fallback null with logged warning.
4. Tests cover multiple lots same ingredient but different expiry.

**Verification:**

```bash
npm test -- --watch=false --include='src/app/core/repositories/pantry.repository.spec.ts'
```

---

## Task 8: Upgrade unit resolver to support `needs_conversion`

**Objective:** Avoid throwing immediately for missing conversion in UI flows; return a typed unresolved result where appropriate.

**Files:**
- Modify: `src/app/core/services/unit-resolver.ts`
- Modify: `src/app/core/services/unit-resolver.spec.ts`

**Steps:**
1. Keep existing `resolveUnit()` behavior for repository authoritative insert if needed.
2. Add new function `tryResolveMeasurementUnit(input)` returning discriminated union:
   - `{ status: 'resolved', ... }`
   - `{ status: 'needs_conversion', reason, prompt, suggestedUnits }`
3. Add support for `ingredient_measurement` preferred over legacy `ingredient_unit`.
4. Ensure `g ↔ ml` still never silently falls back.
5. Tests cover missing `piece`, missing cup-to-gram, density fallback, ingredient measurement success, gross→edible yield.

**Verification:**

```bash
npm test -- --watch=false --include='src/app/core/services/unit-resolver.spec.ts'
```

---

## Task 9: Add pantry store with Angular Signals

**Objective:** Provide UI-ready state for pantry list/add flows.

**Files:**
- Create: `src/app/core/stores/pantry.store.ts`
- Create: `src/app/core/stores/pantry.store.spec.ts`

**Steps:**
1. Signals:
   - `items`
   - `locations`
   - `selectedLocationId`
   - `expiringSoonItems`
   - `loading`
   - `error`
2. Actions:
   - `load()`, `addItem(input)`, `filterByLocation(locationId)`, `markConsumed(id)`.
3. Tests cover computed filters and expiring soon.

**Verification:**

```bash
npm test -- --watch=false --include='src/app/core/stores/pantry.store.spec.ts'
```

---

## Task 10: Add route and shell for Pantry page

**Objective:** Add pantry page under Management without disrupting current dish-first default.

**Files:**
- Modify: `src/app/features/management/management.routes.ts`
- Create: `src/app/features/management/pantry/pantry.page.ts`
- Create: `src/app/features/management/pantry/pantry.page.html`
- Create: `src/app/features/management/pantry/pantry.page.scss`
- Create: `src/app/features/management/pantry/pantry.page.spec.ts`

**Steps:**
1. Add lazy route for pantry page.
2. Keep Management tab default `Món ăn`.
3. Add entry point from management UI only after product decision; if not decided, keep route internal and linked from prototype/dev only.
4. Template follows canonical form/input pattern where inputs exist.

**Verification:**

```bash
npm test -- --watch=false --include='src/app/features/management/pantry/pantry.page.spec.ts'
npm run check:guards
npm run build
```

---

## Task 11: Implement pantry list UI

**Objective:** Match mockup screen 01: stock cards, location chips, expiry alerts.

**Files:**
- Modify: `src/app/features/management/pantry/pantry.page.html`
- Modify: `src/app/features/management/pantry/pantry.page.scss`

**Steps:**
1. Show search/scan placeholder but barcode action disabled/future-labeled.
2. Show location chips: all/fridge/freezer/pantry/spice.
3. Show cards with:
   - item name
   - input display (`4 quả ≈ 480g`)
   - location
   - expiry status
   - data confidence/approximate marker.
4. Verify content insets: no content flush against screen edge unless intentionally full-bleed with inset wrapper.

**Verification:**

```bash
npm run build
```

Manual emulator/browser check later.

---

## Task 12: Implement Add Pantry Item guided page/sheet

**Objective:** Match mockup screen 02: search/select, quantity/unit/location/expiry, preview.

**Files:**
- Create: `src/app/features/management/pantry-add/pantry-add.page.ts`
- Create: `src/app/features/management/pantry-add/pantry-add.page.html`
- Create: `src/app/features/management/pantry-add/pantry-add.page.scss`
- Create: `src/app/features/management/pantry-add/pantry-add.page.spec.ts`

**Steps:**
1. Search ingredients via existing `IngredientStore`/repository.
2. User selects ingredient/variant.
3. User enters quantity/unit/location/expiry using canonical floating-label input wrapper.
4. Call `tryResolveMeasurementUnit()`.
5. If resolved, show normalized edible amount + nutrition preview.
6. If unresolved, open missing conversion state.
7. Save pantry item with `conversion_snapshot_json`.

**Verification:**

```bash
npm test -- --watch=false --include='src/app/features/management/pantry-add/pantry-add.page.spec.ts'
npm run check:form-pattern
npm run build
```

---

## Task 13: Implement Ingredient Measurement editor

**Objective:** Let user create/update measurement like `1 quả vừa ≈ 120g edible`.

**Files:**
- Create: `src/app/features/management/ingredient-measurement-edit/ingredient-measurement-edit.page.ts`
- Create: `src/app/features/management/ingredient-measurement-edit/ingredient-measurement-edit.page.html`
- Create: `src/app/features/management/ingredient-measurement-edit/ingredient-measurement-edit.page.scss`
- Create: `src/app/features/management/ingredient-measurement-edit/ingredient-measurement-edit.page.spec.ts`

**Steps:**
1. Show ingredient/context name.
2. Select unit, size option, quantity per unit, quantity unit, applies to gross/edible, optional yield, confidence.
3. Preview conversion in user language.
4. Save measurement.
5. Do not expose technical column names in visible UI.

**Verification:**

```bash
npm test -- --watch=false --include='src/app/features/management/ingredient-measurement-edit/ingredient-measurement-edit.page.spec.ts'
npm run check:guards
npm run build
```

---

## Task 14: Implement missing conversion sheet

**Objective:** Ask one clear question when conversion is missing.

**Files:**
- Create: `src/app/features/management/components/missing-conversion-sheet/missing-conversion-sheet.ts`
- Create: `src/app/features/management/components/missing-conversion-sheet/missing-conversion-sheet.html`
- Create: `src/app/features/management/components/missing-conversion-sheet/missing-conversion-sheet.scss`
- Create: `src/app/features/management/components/missing-conversion-sheet/missing-conversion-sheet.spec.ts`

**Steps:**
1. Inputs: ingredient name, unit, basis, suggested sizes.
2. Outputs:
   - one-time conversion snapshot.
   - reusable measurement create request.
   - cancel.
3. Copy examples:
   - “1 quả cà chua của bạn khoảng bao nhiêu gram?”
   - “1 cup bột mì này khoảng bao nhiêu gram?”
4. Provide `Nhỏ / Vừa / Lớn / Tự nhập` where applicable.
5. Use canonical form input pattern for custom value.

**Verification:**

```bash
npm test -- --watch=false --include='src/app/features/management/components/missing-conversion-sheet/missing-conversion-sheet.spec.ts'
npm run check:form-pattern
```

---

## Task 15: Add conversion snapshot to dish ingredient flow

**Objective:** Prepare recipe/dish ingredient line for measurement snapshot without changing dish total source of truth.

**Files:**
- Modify: `src/app/core/models/management.model.ts`
- Modify: `src/app/core/repositories/dish-ingredient.repository.ts`
- Modify: `src/app/core/repositories/dish-ingredient.repository.spec.ts`
- Modify: `src/app/features/management/dish-edit/dish-edit.page.ts`

**Steps:**
1. Add optional `conversion_snapshot_json` and `measurement_id` to model/insert type if migration has columns.
2. Existing Phase 1 rows can have null snapshot.
3. Dish total still uses `normalized_amount` and `dish_with_totals`.
4. UI preview can display snapshot phrase if present.

**Verification:**

```bash
npm test -- --watch=false --include='src/app/core/repositories/dish-ingredient.repository.spec.ts'
npm test -- --watch=false --include='src/app/features/management/dish-edit/dish-edit.page.spec.ts'
npm run build
```

---

## Task 16: Add example measurements for six canonical ingredients

**Objective:** Seed examples needed to verify core unit cases.

**Files:**
- Modify seed data location used by `SeedLoader`
- Modify tests: `src/app/core/services/seed/seed-loader.spec.ts`

**Examples:**
- Cà chua: `1 quả vừa ≈ 120g edible`.
- Trứng gà: small/medium/large pieces: 38g/44g/50g edible.
- Dưa hấu: `1 trái vừa ≈ 5000g gross`, `edible_yield_ratio = 0.6`.
- Khoai tây: small/medium/large tubers, gross + yield 0.9.
- Bột mì: `1 cup ≈ 120g`, `1 tbsp ≈ 7.5g`.
- Sữa: `1 cup = 240ml`, `1 bottle = 1000ml`.

**Verification:**

```bash
npm test -- --watch=false --include='src/app/core/services/seed/seed-loader.spec.ts'
```

---

## Task 17: Add visual QA checklist and screenshots

**Objective:** Verify actual UI alignment on Android emulator before claiming done.

**Files:**
- Create: `docs/3-design/audits/phase-1-5a-pantry-measurement-emulator-qa.md`

**Steps:**
1. Build web and Android.
2. Sync Capacitor.
3. Build APK.
4. Install on emulator.
5. Check screens:
   - pantry list
   - add pantry item resolved
   - missing conversion sheet
   - measurement editor
   - dish ingredient preview with snapshot
6. Explicitly check full-bleed/content inset: content must not touch screen edge unless designed as full-bleed and inner content has inset.

**Commands:**

```bash
npm run build
npx cap sync android
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
cd android && ./gradlew assembleDebug
adb -s emulator-5554 install -r app/build/outputs/apk/debug/app-debug.apk
```

**Verification:**
- Screenshots saved to audit folder.
- No console/runtime errors.
- User-like flow completes.

---

## Task 18: Full verification gate

**Objective:** Complete quality gates before final claim.

**Commands:**

```bash
npm run format:check
npm run check:guards
npm run build
ng test --watch=false
npx cap sync android
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
cd android && ./gradlew assembleDebug
```

**Expected:** all pass.

**Manual:** install on emulator and run the Phase 1.5A pantry/measurement flow end-to-end.

---

## Rollback strategy

- Migration adds new tables/columns; avoid destructive changes.
- Keep `ingredient_unit` and existing dish resolver behavior until Phase 1.5A is fully verified.
- If pantry UI is not ready, route can remain hidden/internal while schema/services are safe.
- If measurement resolver has issues, fall back to existing `resolveUnit()` for dish save and keep missing-conversion flow disabled.

---

## Implementation order summary

1. Types.
2. Migrations.
3. Seed defaults.
4. Repositories.
5. Resolver upgrade.
6. Stores.
7. Pantry UI.
8. Measurement editor.
9. Missing conversion sheet.
10. Dish ingredient snapshot integration.
11. Example measurements.
12. Full verification/APK/emulator QA.

---

## Open decisions before coding

1. Should pantry be visible as a third segment under `Quản lý`, or entered from a card/action only?
2. Should `ingredient_measurement` replace `ingredient_unit` immediately, or run side-by-side for one phase?
3. Should Phase 1.5A include product/barcode tables as inactive schema now, or defer entirely to Phase 2?

Recommended default:

- Show pantry as a secondary entry/card, not primary segment, until Phase 1 dish-first is stable.
- Run `ingredient_measurement` side-by-side with `ingredient_unit` first.
- Add `product/barcode` schema only if migration cost is low; keep UI/scan deferred.
