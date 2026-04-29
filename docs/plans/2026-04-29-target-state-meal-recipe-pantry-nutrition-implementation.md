# Target-State Meal/Recipe/Pantry/Nutrition Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Implement the target-state Food Measurement & Nutrition Engine plus pantry, recipe, meal plan, food log and shopping foundation described in `docs/5-development/final-ux-data-model-meal-recipe-pantry-nutrition-2026-04-29.md`.

**Architecture:** Build from the data layer upward. First introduce schema/versioned migrations and strict TypeScript models, then a shared measurement/nutrition resolver, then repositories/stores, then feature pages. All quantity inputs must go through the same resolver and save original input plus snapshots.

**Tech Stack:** Angular 21, Ionic 8, Capacitor 8, strict TypeScript, Angular Signals, SQLite via `DatabaseService`, repository pattern, standalone components, external template/style files only.

**Important constraints:**
- Do not rename existing runtime `dish` to `recipe` in the first pass unless a dedicated migration is planned. UI may say “Món ăn/Công thức”, but runtime compatibility can keep `dish` while adding target-state fields.
- Do not use `any`.
- Do not create inline Angular templates/styles.
- Do not stage unrelated dirty runtime files.
- Keep original input quantity/unit and save conversion/nutrition snapshots for historical rows.
- No global conversion for `piece/quả/trái/củ/tép/cup-to-gram/serving/pack/bottle`.

---

## Source documents

Read before implementation:

- `docs/5-development/final-ux-data-model-meal-recipe-pantry-nutrition-2026-04-29.md`
- `docs/5-development/target-state-ux-data-architecture-pantry-recipe-nutrition-2026-04-29.md`
- `docs/4-architecture/coding-conventions.md`
- `docs/3-design/design-system.md`
- `docs/3-design/data-model.md`
- `docs/4-architecture/business-rules.md`
- `CLAUDE.md`

Current runtime anchors inspected:

- `src/app/core/services/database/schema.ts`
- `src/app/core/services/database/migrations.ts`
- `src/app/core/models/management.model.ts`
- `src/app/core/models/management.types.ts`
- `src/app/core/services/unit-resolver.ts`
- `src/app/core/repositories/dish-ingredient.repository.ts`
- `src/app/features/management/ingredient-edit/ingredient-edit.page.ts`
- `src/app/features/management/dish-edit/dish-edit.page.ts`

---

## Implementation phases

This plan is split by dependency, not by product marketing phase:

1. Schema and model foundation.
2. Measurement and nutrition engine.
3. Ingredient/product data repositories.
4. Pantry stock and stock movement.
5. Recipe/dish ingredient line snapshots.
6. Meal plan and food log.
7. Shopping list.
8. UI integration and verification.

---

## Task 0: Safety baseline and workspace guard

**Objective:** Prevent accidental staging or overwriting existing dirty files.

**Files:**
- No file changes.

**Steps:**
1. Run:
   ```bash
   git status --short
   ```
2. Save output in implementation notes before touching code.
3. Confirm which dirty files are pre-existing.
4. During commits, stage only files from the current task.

**Verification:**
- You can identify pre-existing dirty files.
- No unrelated file is staged.

---

## Task 1: Add target-state domain types

**Objective:** Define strict TypeScript types for target-state food, measurement, nutrition, pantry, recipe, meal, food log and shopping entities.

**Files:**
- Create: `src/app/core/models/food-measurement.types.ts`
- Create: `src/app/core/models/food-measurement.model.ts`
- Test: `src/app/core/models/food-measurement.model.spec.ts`

**Key types to include:**

```ts
export type FoodState =
  | 'raw'
  | 'cooked'
  | 'peeled'
  | 'chopped'
  | 'canned'
  | 'dried'
  | 'frozen'
  | 'drained'
  | 'boiled'
  | 'roasted'
  | 'fried';

export type FoodForm =
  | 'whole'
  | 'diced'
  | 'sliced'
  | 'minced'
  | 'powder'
  | 'liquid'
  | 'paste';

export type MeasurementSizeOption = 'small' | 'medium' | 'large' | 'custom' | 'not_applicable';
export type MeasurementAppliesTo = 'gross' | 'edible';
export type MeasurementConfidence = 'verified' | 'imported' | 'estimated' | 'ai_estimated' | 'user_custom';
export type NutritionBasisType = 'per_100g' | 'per_100ml' | 'per_piece' | 'per_serving';
export type ConversionStatus = 'resolved' | 'estimated' | 'missing' | 'user_override';
export type NutritionStatus = 'resolved' | 'incomplete' | 'not_applicable';
```

**Model interfaces to include:**
- `IngredientVariantModel`
- `IngredientMeasurementModel`
- `UserMeasurementOverrideModel`
- `NutritionProfileModel`
- `ProductModel`
- `BarcodeModel`
- `StorageLocationModel`
- `PantryItemModel`
- `StockMovementModel`
- `RecipeIngredientLineModel`
- `MealPlanModel`
- `MealPlanItemModel`
- `FoodLogModel`
- `FoodLogItemModel`
- `ShoppingListModel`
- `ShoppingListItemModel`
- `ConversionSnapshot`
- `NutritionSnapshot`

**Test requirements:**
- Compile-time only model imports should pass under strict TypeScript.
- Add one runtime helper such as `isResolvedConversionStatus(value: string): value is ConversionStatus` and test it.

**Commands:**
```bash
npm test -- --watch=false --include src/app/core/models/food-measurement.model.spec.ts
npm run build
```

**Expected:** PASS.

---

## Task 2: Add schema migration for source/unit/variant/measurement/nutrition/product

**Objective:** Add database schema foundation for target-state measurement and nutrition without breaking existing ingredient/dish flows.

**Files:**
- Modify: `src/app/core/services/database/schema.ts`
- Modify: `src/app/core/services/database/migrations.ts`
- Modify/Create tests: `src/app/core/services/database/migrations.spec.ts`
- Modify/Create tests: `src/app/core/services/database/schema.spec.ts`

**Schema additions:**
- `ingredient_category_v2` or adapt existing category strategy.
- `ingredient_alias`
- `ingredient_variant`
- `data_source`
- extend `unit` or add missing columns:
  - `dimension`
  - `global_to_base_factor`
  - `global_base_unit_id`
  - `requires_food_specific_conversion`
- `ingredient_measurement`
- `user_measurement_override`
- `nutrition_profile`
- `product`
- `barcode`

**Migration rule:**
- Increment `SCHEMA_VERSION` by 1.
- Add `buildTargetFoodMeasurementFoundationMigration()`.
- Register it in `MIGRATION_REGISTRY`.
- Use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`.
- Avoid destructive change to current `ingredient`, `ingredient_unit`, `dish`, `dish_ingredient` in this task.

**Indexes:**
- `idx_ingredient_variant_ingredient`
- `idx_ingredient_measurement_lookup` on `(ingredient_id, product_id, variant_id, unit_id, size_option)` if database supports expected form.
- `idx_nutrition_profile_food`
- `idx_barcode_value`
- `idx_product_name`

**Tests:**
1. Fresh schema contains all new tables.
2. Migration registry latest version equals `SCHEMA_VERSION`.
3. Existing base tables still exist.
4. `ingredient_measurement` rejects rows with both `ingredient_id` and `product_id` null.

**Commands:**
```bash
npm test -- --watch=false --include src/app/core/services/database/schema.spec.ts --include src/app/core/services/database/migrations.spec.ts
npm run build
```

**Expected:** PASS.

---

## Task 3: Seed canonical units and data sources

**Objective:** Provide base units and source rows required by resolver and UI.

**Files:**
- Modify: `src/app/core/services/seed/seed-loader.ts`
- Modify: `src/app/core/services/seed/seed-loader.spec.ts`
- Optional create: `src/assets/data/units.json`
- Optional create: `src/assets/data/data-sources.json`

**Seed units:**
- `g`, `kg`, `ml`, `l`
- `tsp`, `tbsp`, `cup`
- `piece`, `fruit`, `tuber`, `clove`
- `dozen`
- `pack`, `bottle`, `serving`

**Unit rules:**
- `g/kg/ml/l`: safe global factors.
- `tsp/tbsp/cup`: safe as volume only; food-specific when nutrition basis is gram.
- `piece/fruit/tuber/clove/pack/bottle/serving`: `requires_food_specific_conversion = 1` except `dozen` can map to count but still needs count-to-gram for nutrition.

**Seed data sources:**
- `manual_user`
- `curated_default`
- `open_food_facts`
- `usda_fdc`
- `ai_estimated`

**Tests:**
- Units are idempotent.
- `piece`, `cup`, `serving`, `pack`, `bottle` carry correct food-specific flags.
- Data sources are idempotent.

**Commands:**
```bash
npm test -- --watch=false --include src/app/core/services/seed/seed-loader.spec.ts
npm run build
```

**Expected:** PASS.

---

## Task 4: Implement measurement resolver core

**Objective:** Replace the old `factor_to_basis` mental model with a resolver that returns normalized gross/edible amount, conversion status, confidence and snapshot.

**Files:**
- Create: `src/app/core/services/measurement-resolver.ts`
- Create: `src/app/core/services/measurement-resolver.spec.ts`
- Keep existing: `src/app/core/services/unit-resolver.ts` as compatibility wrapper until migrated.

**API shape:**

```ts
export interface ResolveFoodAmountInput {
  inputQuantity: number;
  inputUnitId: string;
  ingredientId?: string;
  productId?: string;
  variantId?: string;
  sizeOption?: MeasurementSizeOption;
  unit: UnitModel;
  measurement?: IngredientMeasurementModel | null;
  userOverride?: UserMeasurementOverrideModel | null;
}

export interface ResolveFoodAmountResult {
  conversionStatus: ConversionStatus;
  normalizedMassG: number | null;
  normalizedVolumeMl: number | null;
  countQuantity: number | null;
  grossQuantity: number | null;
  edibleQuantity: number | null;
  edibleUnitId: 'g' | 'ml' | 'count' | null;
  confidence: MeasurementConfidence | 'missing';
  conversionSnapshot: ConversionSnapshot;
  issueCode?: 'missing_food_specific_conversion' | 'dimension_mismatch' | 'missing_density';
}
```

**Resolver rules:**
1. User override exact match wins.
2. Food/product measurement next.
3. Safe global mass/volume conversion next.
4. Density conversion only when explicit density exists.
5. Otherwise return `conversionStatus='missing'`, not throw for normal UX path.
6. Throw only for invalid input such as negative quantity.
7. If `applies_to='gross'`, compute edible using `edible_yield_ratio`.
8. Never assume `1g = 1ml`.

**Tests:**
- 2 medium tomatoes → 240g edible.
- 1 watermelon medium gross 5000g with yield 0.52 → 2600g edible.
- 1 cup flour → 120g edible using ingredient measurement.
- 1 cup milk → 240ml via volume unit if nutrition basis later uses ml.
- 1 bottle without product measurement → missing.
- Negative input throws validation error.

**Commands:**
```bash
npm test -- --watch=false --include src/app/core/services/measurement-resolver.spec.ts
npm run build
```

**Expected:** PASS.

---

## Task 5: Implement nutrition calculator

**Objective:** Calculate kcal/macros from resolved edible amount and nutrition profile basis.

**Files:**
- Create: `src/app/core/services/nutrition-calculator.ts`
- Create: `src/app/core/services/nutrition-calculator.spec.ts`

**API shape:**

```ts
export interface NutritionTotals {
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
}

export interface CalculateNutritionInput {
  resolvedAmount: ResolveFoodAmountResult;
  nutritionProfile: NutritionProfileModel;
  servingMeasurement?: IngredientMeasurementModel | null;
}

export interface CalculateNutritionResult {
  status: NutritionStatus;
  totals: NutritionTotals | null;
  nutritionSnapshot: NutritionSnapshot | null;
  issueCode?: 'missing_mass' | 'missing_volume' | 'missing_serving_size' | 'missing_piece_weight';
}
```

**Rules:**
- `per_100g`: use `normalizedMassG` or edible mass.
- `per_100ml`: use `normalizedVolumeMl` or edible volume.
- `per_piece`: use count if available, otherwise derive count from piece weight measurement.
- `per_serving`: use serving size/measurement.
- Dimension mismatch returns incomplete, not fake values.

**Tests:**
- Tomato 240g × 18 kcal/100g = 43.2 kcal.
- Milk 240ml × 61 kcal/100ml = 146.4 kcal.
- Egg 2 pieces × 72 kcal/piece = 144 kcal.
- Serving profile without serving size returns incomplete.
- per_100g with only ml and no density returns incomplete.

**Commands:**
```bash
npm test -- --watch=false --include src/app/core/services/nutrition-calculator.spec.ts
npm run build
```

**Expected:** PASS.

---

## Task 6: Add repositories for measurement, nutrition profile, product and barcode

**Objective:** Expose database access methods for target-state data.

**Files:**
- Create: `src/app/core/repositories/ingredient-measurement.repository.ts`
- Create: `src/app/core/repositories/ingredient-measurement.repository.spec.ts`
- Create: `src/app/core/repositories/nutrition-profile.repository.ts`
- Create: `src/app/core/repositories/nutrition-profile.repository.spec.ts`
- Create: `src/app/core/repositories/product.repository.ts`
- Create: `src/app/core/repositories/product.repository.spec.ts`

**Repository methods:**

`IngredientMeasurementRepository`:
- `findBestMeasurement(input)`
- `listByIngredient(ingredientId)`
- `listByProduct(productId)`
- `upsertUserOverride(input)`
- `insertMeasurement(input)`

`NutritionProfileRepository`:
- `findAuthoritativeForIngredient(ingredientId, variantId?)`
- `findAuthoritativeForProduct(productId)`
- `insertProfile(input)`
- `listByIngredient(ingredientId)`

`ProductRepository`:
- `findByBarcode(barcode)`
- `searchByName(query)`
- `insertProduct(input)`
- `linkBarcode(productId, barcode)`

**Tests:**
- Query exact measurement by ingredient/variant/unit/size.
- User override precedence can be retrieved.
- Product barcode lookup works.
- Nutrition authoritative profile lookup respects `is_authoritative` and latest version.

**Commands:**
```bash
npm test -- --watch=false --include src/app/core/repositories/ingredient-measurement.repository.spec.ts --include src/app/core/repositories/nutrition-profile.repository.spec.ts --include src/app/core/repositories/product.repository.spec.ts
npm run build
```

**Expected:** PASS.

---

## Task 7: Migrate dish ingredient insert to snapshot-aware resolver

**Objective:** Ensure recipe/dish ingredient lines store original input, normalized edible amount, conversion status and snapshots.

**Files:**
- Modify: `src/app/core/repositories/dish-ingredient.repository.ts`
- Modify: `src/app/core/repositories/dish-ingredient.repository.spec.ts`
- Modify: `src/app/core/models/management.model.ts`
- Modify: `src/app/core/models/management.types.ts`
- Modify schema/migration if `dish_ingredient` needs new columns.

**Columns to add to `dish_ingredient`:**
- `variant_id TEXT`
- `size_option TEXT`
- `normalized_mass_g REAL`
- `normalized_volume_ml REAL`
- `edible_mass_g REAL`
- `edible_volume_ml REAL`
- `conversion_status TEXT`
- `conversion_snapshot_json TEXT`
- `nutrition_snapshot_json TEXT`
- keep old `normalized_amount` during compatibility window if needed.

**Behavior:**
- Look up ingredient/product, unit, variant, measurement, nutrition profile.
- Call `measurement-resolver`.
- Call `nutrition-calculator` if conversion resolved/estimated/user_override.
- Save snapshots.
- Return incomplete status if conversion missing; do not crash normal flow.

**Tests:**
- Insert tomato line `2 piece medium` stores snapshot and `edible_mass_g=240`.
- Insert missing bottle conversion stores `conversion_status='missing'` and null nutrition snapshot.
- Existing dish total view either remains compatible or a new summary path is introduced.

**Commands:**
```bash
npm test -- --watch=false --include src/app/core/repositories/dish-ingredient.repository.spec.ts
npm run build
```

**Expected:** PASS.

---

## Task 8: Update recipe/dish total calculation path

**Objective:** Compute dish/recipe nutrition from line nutrition snapshots or normalized edible amounts without relying only on old `ingredient.calories × normalized_amount` view.

**Files:**
- Modify: `src/app/core/repositories/dish.repository.ts`
- Modify: `src/app/core/repositories/dish.repository.spec.ts`
- Modify: `src/app/core/stores/dish.store.ts`
- Modify: `src/app/core/stores/dish.store.spec.ts`
- Optional: add `recipe_nutrition_summary` repository if using cache.

**Approach options:**
1. Short-term: repository reads `dish_ingredient.nutrition_snapshot_json` and sums in TypeScript.
2. Medium-term: maintain `recipe_nutrition_summary` cache.

**Recommended first pass:** option 1 for correctness and fewer schema side effects.

**Tests:**
- Dish total sums two ingredient line nutrition snapshots.
- Incomplete line makes calculation status `partial` or `incomplete`.
- Per serving calculation divides by `dish.servings`.

**Commands:**
```bash
npm test -- --watch=false --include src/app/core/repositories/dish.repository.spec.ts --include src/app/core/stores/dish.store.spec.ts
npm run build
```

**Expected:** PASS.

---

## Task 9: Implement pantry schema, repository and store

**Objective:** Add pantry stock lot and stock movement foundation.

**Files:**
- Modify schema/migration: `src/app/core/services/database/schema.ts`
- Create: `src/app/core/repositories/pantry.repository.ts`
- Create: `src/app/core/repositories/pantry.repository.spec.ts`
- Create: `src/app/core/stores/pantry.store.ts`
- Create: `src/app/core/stores/pantry.store.spec.ts`

**Tables:**
- `storage_location`
- `pantry_item`
- `stock_movement`

**Repository methods:**
- `listAvailable()`
- `listExpiringSoon(days)`
- `listByLocation(locationId)`
- `insertStock(input)`
- `adjustStock(input)`
- `discardItem(id, reason)`
- `moveItem(id, locationId)`
- `listMovements(pantryItemId)`

**Resolver integration:**
- `insertStock` must call measurement resolver and nutrition calculator.
- Save conversion snapshot and optional nutrition snapshot.

**Tests:**
- Add tomato stock `3 pieces medium` stores `edible_mass_g=360`.
- Add watermelon gross stores gross and edible values.
- Discard creates stock movement and changes status.
- Move creates movement.

**Commands:**
```bash
npm test -- --watch=false --include src/app/core/repositories/pantry.repository.spec.ts --include src/app/core/stores/pantry.store.spec.ts
npm run build
```

**Expected:** PASS.

---

## Task 10: Build pantry UI entry points

**Objective:** Provide basic Pantry list and Add Stock UX using existing Ionic conventions and canonical input pattern.

**Files:**
- Create folder: `src/app/features/pantry/`
- Create: `src/app/features/pantry/pantry.routes.ts`
- Create: `src/app/features/pantry/pantry.page.ts`
- Create: `src/app/features/pantry/pantry.page.html`
- Create: `src/app/features/pantry/pantry.page.scss`
- Create: `src/app/features/pantry/add-stock/add-stock.page.ts`
- Create: `src/app/features/pantry/add-stock/add-stock.page.html`
- Create: `src/app/features/pantry/add-stock/add-stock.page.scss`
- Modify routing: `src/app/app.routes.ts` or `src/app/tabs/*` depending current tab setup.

**UI requirements:**
- Pantry list sections:
  - Sắp hết hạn
  - Sắp hết
  - Cần bổ sung quy đổi
  - Theo vị trí
- Add Stock form:
  - search ingredient/product
  - state/form
  - quantity/unit
  - size option
  - gross/edible resolver question when needed
  - location
  - expiry
  - nutrition preview card

**Form pattern:**
Use canonical floating label wrapper from `src/theme/form-field.scss`.

**Tests:**
- Component creates.
- Add Stock calls store with expected input.
- Conversion missing state shows resolver prompt.

**Commands:**
```bash
npm test -- --watch=false --include src/app/features/pantry/pantry.page.spec.ts --include src/app/features/pantry/add-stock/add-stock.page.spec.ts
npm run check:guards
npm run build
```

**Expected:** PASS.

---

## Task 11: Add Missing Conversion Resolver component

**Objective:** Reusable UI component that asks one concrete conversion question and returns snapshot-only or user override behavior.

**Files:**
- Create: `src/app/shared/components/missing-conversion-resolver/missing-conversion-resolver.ts`
- Create: `src/app/shared/components/missing-conversion-resolver/missing-conversion-resolver.html`
- Create: `src/app/shared/components/missing-conversion-resolver/missing-conversion-resolver.scss`
- Create: `src/app/shared/components/missing-conversion-resolver/missing-conversion-resolver.spec.ts`

**Inputs:**
- ingredient/product display name
- unit label
- variant/state
- suggested measurements
- asks gross vs edible if applicable

**Outputs:**
- one-time conversion
- save-as-user-override conversion
- save-incomplete

**UX copy examples:**
- “1 quả cà chua của bạn khoảng bao nhiêu gram?”
- “1 cup bột mì này khoảng bao nhiêu gram?”
- “Bạn đang nhập trọng lượng cả vỏ hay phần ăn được?”

**Tests:**
- Emits snapshot-only conversion.
- Emits user override conversion.
- Emits incomplete state.
- Does not ask multiple unrelated questions at once.

**Commands:**
```bash
npm test -- --watch=false --include src/app/shared/components/missing-conversion-resolver/missing-conversion-resolver.spec.ts
npm run check:guards
npm run build
```

**Expected:** PASS.

---

## Task 12: Integrate resolver into recipe/dish edit UI

**Objective:** Ensure recipe ingredient input previews resolved amount and nutrition before save.

**Files:**
- Modify: `src/app/features/management/dish-edit/dish-edit.page.ts`
- Modify: `src/app/features/management/dish-edit/dish-edit.page.html`
- Modify: `src/app/features/management/dish-edit/dish-edit.page.scss`
- Modify: `src/app/features/management/dish-edit/dish-edit.page.spec.ts`
- Possibly modify: `src/app/features/management/dish-edit/dish-edit.types.ts`

**UX requirements:**
- Ingredient line form shows:
  - variant/state
  - quantity/unit
  - size option when count-like unit
  - resolved amount preview
  - nutrition preview
  - confidence badge
- If conversion missing, open Missing Conversion Resolver.
- Save button can save incomplete only with visible warning.

**Tests:**
- Changing quantity updates preview.
- Missing conversion shows resolver.
- Saving line passes snapshot data to repository/store.

**Commands:**
```bash
npm test -- --watch=false --include src/app/features/management/dish-edit/dish-edit.page.spec.ts
npm run check:guards
npm run build
```

**Expected:** PASS.

---

## Task 13: Implement meal plan and food log repositories

**Objective:** Separate planned meal intent from actual consumed history.

**Files:**
- Create: `src/app/core/repositories/meal-plan.repository.ts`
- Create: `src/app/core/repositories/meal-plan.repository.spec.ts`
- Create: `src/app/core/repositories/food-log.repository.ts`
- Create: `src/app/core/repositories/food-log.repository.spec.ts`
- Create: `src/app/core/stores/meal-plan.store.ts`
- Create: `src/app/core/stores/meal-plan.store.spec.ts`
- Create: `src/app/core/stores/food-log.store.ts`
- Create: `src/app/core/stores/food-log.store.spec.ts`

**Repository behavior:**
- Meal plan item stores planned reference and nutrition preview.
- Food log item stores immutable conversion/nutrition snapshots.
- Editing food log should update explicitly, not recalculate silently from changed master data.

**Tests:**
- Add recipe to meal plan with preview.
- Convert planned item to food log item with snapshot.
- Food log remains unchanged after nutrition profile changes.

**Commands:**
```bash
npm test -- --watch=false --include src/app/core/repositories/meal-plan.repository.spec.ts --include src/app/core/repositories/food-log.repository.spec.ts --include src/app/core/stores/meal-plan.store.spec.ts --include src/app/core/stores/food-log.store.spec.ts
npm run build
```

**Expected:** PASS.

---

## Task 14: Implement meal/food log UI integration

**Objective:** Add user-facing flows for planned meals and actual logs.

**Files:**
- Modify or create feature pages under:
  - `src/app/features/calendar/`
  - `src/app/features/dashboard/`
- Optional create: `src/app/features/food-log/`
- Tests for changed pages.

**UX requirements:**
- Meal Plan:
  - date/meal period
  - add recipe/product/ingredient
  - preview kcal/macro
  - show missing pantry ingredients later
- Food Log:
  - actual logged time
  - meal period
  - item list
  - immutable snapshot display

**Tests:**
- Page creates.
- Add planned item calls store.
- Log consumed item calls food log store with snapshots.

**Commands:**
```bash
npm test -- --watch=false --include src/app/features/calendar/calendar.page.spec.ts --include src/app/features/dashboard/dashboard.page.spec.ts
npm run check:guards
npm run build
```

**Expected:** PASS.

---

## Task 15: Implement shopping list foundation

**Objective:** Support manual and generated shopping items with source tracking.

**Files:**
- Create: `src/app/core/repositories/shopping-list.repository.ts`
- Create: `src/app/core/repositories/shopping-list.repository.spec.ts`
- Create: `src/app/core/stores/shopping-list.store.ts`
- Create: `src/app/core/stores/shopping-list.store.spec.ts`
- Optional create feature folder: `src/app/features/shopping/`

**Repository methods:**
- `createList(name)`
- `addManualItem(input)`
- `addFromRecipe(recipeId)`
- `addFromMealPlan(mealPlanId)`
- `addLowStockItem(pantryItemId)`
- `markBought(itemId)`
- `skip(itemId)`

**Tests:**
- Manual item stores source `manual`.
- Recipe-generated item stores source `recipe` and `source_ref_id`.
- Mark bought updates status.

**Commands:**
```bash
npm test -- --watch=false --include src/app/core/repositories/shopping-list.repository.spec.ts --include src/app/core/stores/shopping-list.store.spec.ts
npm run build
```

**Expected:** PASS.

---

## Task 16: Add barcode/product import stub

**Objective:** Create product/barcode architecture without requiring live external integration yet.

**Files:**
- Create: `src/app/core/services/product-import.ts`
- Create: `src/app/core/services/product-import.spec.ts`
- Modify: `src/app/core/repositories/product.repository.ts`

**Behavior:**
- `findProductByBarcode(barcode)` searches local `barcode` table.
- External provider interface exists but default implementation returns not configured.
- Manual product creation remains available.

**Tests:**
- Local barcode hit returns product.
- Unknown barcode returns not found.
- External provider disabled path does not crash.

**Commands:**
```bash
npm test -- --watch=false --include src/app/core/services/product-import.spec.ts
npm run build
```

**Expected:** PASS.

---

## Task 17: Seed sample data for calculation examples

**Objective:** Add deterministic sample data for tomato, egg, watermelon, potato, flour and milk to support tests and demo flows.

**Files:**
- Modify/create seed assets under `src/assets/data/`
- Modify: `src/app/core/services/seed/seed-loader.ts`
- Modify: `src/app/core/services/seed/seed-loader.spec.ts`

**Sample data:**
- Cà chua raw/whole: per 100g, medium piece → 120g edible.
- Trứng gà raw/whole: per piece, large piece → 50g edible, dozen → 12 count.
- Dưa hấu raw/whole: per 100g, medium fruit → 5000g gross, yield 0.52.
- Khoai tây raw/whole: per 100g, medium tuber → 170g gross, yield 0.85 when peeled context applies.
- Bột mì dry/powder: per 100g, cup → 120g, tablespoon → 7.5g.
- Sữa liquid: per 100ml, cup → 240ml, sample bottle product → 1000ml.

**Tests:**
- Seed is idempotent.
- Resolver examples match report expected results.

**Commands:**
```bash
npm test -- --watch=false --include src/app/core/services/seed/seed-loader.spec.ts --include src/app/core/services/measurement-resolver.spec.ts --include src/app/core/services/nutrition-calculator.spec.ts
npm run build
```

**Expected:** PASS.

---

## Task 18: Add architecture guards for unsafe conversions

**Objective:** Prevent future regressions like global `piece = x g` or silent `1g = 1ml` fallback.

**Files:**
- Create: `scripts/check-food-measurement-rules.mjs`
- Modify: `package.json`
- Test manually with fixture or code scan.

**Guard rules:**
- Flag `piece`, `fruit`, `tuber`, `clove`, `serving`, `pack`, `bottle` rows if `requires_food_specific_conversion` is false.
- Flag code patterns that imply `1g = 1ml` fallback without explicit density.
- Flag direct use of old `factor_to_basis` in new resolver paths, except compatibility tests.

**Package script:**
```json
"check:food-measurement": "node scripts/check-food-measurement-rules.mjs"
```

Include in build if stable:
```json
"build": "npm run check:guards && npm run check:food-measurement && ng build"
```

**Commands:**
```bash
npm run check:food-measurement
npm run build
```

**Expected:** PASS.

---

## Task 19: Full technical verification

**Objective:** Prove implementation works across tests, guards and build.

**Commands:**
```bash
npm run check:guards
npm run check:food-measurement
npm run format:check
ng test --watch=false
npm run build
```

If Android verification is in scope for the implementation session:

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
npx cap sync android
cd android && ./gradlew assembleDebug
adb -s emulator-5554 install -r app/build/outputs/apk/debug/app-debug.apk
```

**Manual QA checklist:**
- Add 2 medium tomatoes to recipe: preview ≈240g edible and kcal correct.
- Add 1 watermelon medium to pantry: gross and edible shown separately.
- Add 1 cup flour: uses flour-specific gram conversion.
- Add 1 cup milk: uses ml conversion.
- Add 1 bottle unknown product: missing conversion resolver appears.
- Save food log and then edit ingredient measurement: historical log does not change.

---

## Acceptance criteria

Implementation is done only when:

- Schema has target-state tables for measurement, nutrition, pantry, recipe line snapshots, meal plan, food log and shopping list.
- Measurement resolver handles mass, volume, count, package, serving, gross/edible and missing conversion without silent guesses.
- Nutrition calculator supports per 100g, per 100ml, per piece and per serving.
- Recipe/dish lines save original input plus conversion/nutrition snapshots.
- Pantry items save original input, normalized quantity, location, expiry and stock movement history.
- Food log items save immutable nutrition snapshots.
- Missing conversion resolver gives a user-facing path to save one-time conversion, user override or incomplete item.
- Product/barcode foundation exists even if external API import is postponed.
- Tests and build pass.
- No unrelated dirty files are staged or committed.

---

## Suggested commit sequence

1. `feat: add food measurement domain models`
2. `feat: add food measurement schema migration`
3. `feat: seed canonical food units and sources`
4. `feat: add measurement resolver`
5. `feat: add nutrition calculator`
6. `feat: add measurement nutrition product repositories`
7. `feat: store dish ingredient nutrition snapshots`
8. `feat: add pantry stock repository and store`
9. `feat: add pantry add stock flow`
10. `feat: add missing conversion resolver component`
11. `feat: add meal plan and food log foundations`
12. `feat: add shopping list foundation`
13. `test: add target-state sample food data`
14. `chore: guard unsafe food measurement conversions`

---

## Risk notes

- Existing runtime uses `ingredient_unit.factor_to_basis`; migrate gradually to avoid breaking current dish edit flows.
- Existing `dish_with_totals` view computes from live ingredient nutrition. Snapshot-aware totals may need TypeScript aggregation first before replacing the SQL view.
- Product/barcode import should not block measurement correctness.
- Cooking yield/retention should remain advanced; base nutrition should work with edible amount and optional final yield.
- Do not attempt a large UI redesign in the same commit as schema/resolver foundations.
