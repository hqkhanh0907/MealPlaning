# Phase 1 §5.2 — Vietnamese Core Seed Pipeline Implementation Plan

> **For Hermes:** Use `subagent-driven-development` skill (or execute solo) — task by task, TDD per data layer task, manual curation for data tasks.

**Goal:** Ship a fresh-install-ready Vietnamese seed dataset (20 dishes + ~50 ingredients) with a build script that compiles a curated source-of-truth into `src/assets/seed/{ingredients,dishes}.json`, and a runtime loader that bulk-inserts into SQLite on first run only.

**Architecture:**
1. **Source-of-truth** lives in human-editable TS files at `scripts/seed/data/` (ingredients + dishes), separate from generated artifacts.
2. **Build step** `scripts/seed/build-vietnamese-core.ts` validates the curated data (every ingredient appears in ≥1 dish unless staple, every unit factor present, macro basis = 100g/ml, etc.) and emits stable JSON with deterministic UUIDs.
3. **Runtime loader** `src/app/core/services/seed/seed-loader.service.ts` runs after migrations on app boot. If `ingredient` and `dish` tables are empty → bulk insert with `source = 'db'`. Otherwise no-op (NEVER overwrite user data).
4. **Repositories** — extend with bulk-insert helpers that bypass the `'manual'` default and use `source = 'db'`.

**Tech Stack:** Node TS build script (run via `tsx` or `ts-node`), Angular 20 service for runtime, sql.js + capacitor-sqlite via existing `DatabaseService` abstraction.

**Constraints:**
- No `any` (CLAUDE.md strict TS).
- Stable UUIDs across rebuilds (use deterministic UUID v5 from name, namespace constant) — so re-running the build doesn't churn JSON or break loader-skip logic.
- Composite ingredients allowed (e.g. `Nước dùng phở`) — treated as regular ingredients in DB.
- Curation rule enforced in build script: orphan ingredients only if in staple allowlist (`nước mắm`, `muối`, `đường`, `dầu ăn`, `hành`, `tỏi`).
- Seed loader must be idempotent: only inserts if both `ingredient` AND `dish` are empty.

---

## Task Index (v2 — post-audit)

0. **NEW: Migration V4 — add `dish.meal_tag` column** (breakfast/lunch/dinner). Required because schema V3 only has `dish.type ∈ {ingredient_based, ai_autofill}` — no meal grouping. Seed needs this column.
1. ADR-002 — document seed strategy & loader contract (docs only).
2. Ingredient curated source (TS data file, ~50 items).
3. Dish curated source (TS data file, 20 dishes with ingredient lines + `meal_tag`).
4. Build script `scripts/seed/build-vietnamese-core.ts` + validators.
5. Wire `npm run seed:build` into `package.json` and pre-build hook.
6. Repositories — `bulkInsertSeed()` on Ingredient + Dish only (units handled by migration).
7. `SeedLoaderService` + idempotency check + DI provider.
8. Wire loader into `app.component.ts` boot sequence (after migration runner).
9. Manual QA on emulator (fresh install → see seeded data in Management tab).
10. Commit + push.

Estimated total: ~3.5 hours focused work (Tasks 2 + 3 are bulk of it — manual curation; Task 0 adds ~30 min).

---

## Audit Notes (truths verified against current schema/code)

Things the build/loader **MUST honor** because they already exist in the codebase:

1. **Units are migration-seeded.** Migration V3 (`schema.ts:371-383`) `INSERT OR IGNORE` 12 global units: `g, kg, ml, l, tbsp, tsp, cup, piece, clove, bunch, slice, pinch`. Build script MUST NOT emit `units.json` and seed loader MUST NOT touch the `unit` table. If a curated ingredient needs a unit not in this list (e.g. `bowl-pho`, `loaf-banhmi`), add it to migration V3 (or a new migration), not to a JSON artifact.

2. **`piece` is a generic count unit with no global factor** (`base_factor_g=NULL, base_factor_ml=NULL, is_global=0`). Per-ingredient piece weight is encoded via `ingredient_unit.factor_to_basis` + `display_label`, e.g. for an egg:
   ```ts
   { unit_id: 'piece', factor_to_basis: 60, is_default: true, display_label: '1 quả (60g)' }
   ```
   This is the ONLY way to express "1 piece = X grams" — never invent unit ids like `piece-egg`.

3. **`unit_id` allowed values in `ingredient.units[]` and `dish.ingredients[*].unit_id`** are EXACTLY the 12 unit ids above. Build script validator must reject anything else.

4. **`dish_ingredient` schema has been migrated** (V3 `*_v3` tables RENAME, `schema.ts:493-523`). Final shape: `id, dish_id, ingredient_id, amount_value, unit_id NOT NULL REFERENCES unit(id), normalized_amount`. There is NO `amount_unit` column anymore. `dish-ingredient.repository.ts:60-71` is correct — reuse it.

5. **`resolveUnit()` already exists** at `src/app/core/services/unit-resolver.ts` with full 3-path conversion (`ingredient_unit` → `global` → `density`). Build script MUST `import { resolveUnit }` to compute `normalized_amount` for seed dishes — do NOT reimplement.

6. **`dish.type ∈ {ingredient_based, ai_autofill}`** is NOT meal grouping. Phase 1 needs a separate `meal_tag` column (added in Task 0).

7. **Idempotency check is correct as planned** — count `ingredient` AND `dish`, only seed when BOTH are 0.

8. **Source-flip on edit is already implemented in BOTH repos.**
   - `IngredientRepository.update` (`ingredient.repository.ts:119`) always sets `source='manual'` on edit.
   - `DishRepository.update` (`dish.repository.ts:91`) flips `db → custom` and preserves `custom`/`ai`.
   No boy-scout fix needed; the seed loader's `source = 'db'` will correctly transition to `'custom'` the moment a user saves a change to a seeded dish.

---

## Task 0: Migration V4 — `dish.meal_tag` column

**Objective:** Add nullable `meal_tag TEXT CHECK (meal_tag IN ('breakfast','lunch','dinner'))` column to `dish` so Phase 1 seed can group the 20 curated dishes by meal slot. Existing rows (none in fresh installs, but possible in dev DB) keep `meal_tag = NULL`.

**Files:**
- Modify: `src/app/core/services/database/schema.ts` — add migration V4 builder + bump `SCHEMA_VERSION` to 4
- Modify: `src/app/core/services/database/migrations.ts` — register `buildMealTagMigration()`
- Modify: `src/app/core/models/management.types.ts` — `export type MealTag = 'breakfast' | 'lunch' | 'dinner';`
- Modify: `src/app/core/models/management.model.ts` — add `meal_tag: MealTag | null;` to `DishModel`
- Modify: `src/app/core/repositories/dish.repository.ts` — include `meal_tag` in SELECT/INSERT/UPDATE
- Modify: `src/app/core/services/database/schema-compatibility.ts` + spec — add `meal_tag` to expected `dishColumns`
- Test: `src/app/core/services/database/migrations.spec.ts` — verify column exists + CHECK constraint works
- Update: `docs/3-design/data-model.md §4.2` — add `meal_tag` to `dish` table SQL block + note it's Phase 1 seed grouping

**Step 1: Write failing migration test**

```ts
it('V4 adds dish.meal_tag column with CHECK constraint', async () => {
  const db = await freshDb();
  await runner.run(db);
  const cols = await db.query<{ name: string }>("PRAGMA table_info('dish')");
  expect(cols.map(c => c.name)).toContain('meal_tag');
  // Insert with valid tag
  await db.execute("INSERT INTO dish(id,name,type,meal_tag) VALUES('d1','Test','ingredient_based','breakfast')");
  // Reject invalid
  await expectAsync(
    db.execute("INSERT INTO dish(id,name,type,meal_tag) VALUES('d2','X','ingredient_based','brunch')")
  ).toBeRejected();
});
```

**Step 2: Add migration**

```ts
// schema.ts
export const SCHEMA_VERSION = 4; // bumped from 3

export const buildMealTagMigration = (): Migration => ({
  version: 4,
  description: 'Add dish.meal_tag for Phase 1 seed grouping',
  statements: [
    `ALTER TABLE dish ADD COLUMN meal_tag TEXT CHECK (meal_tag IN ('breakfast','lunch','dinner'))`,
    `CREATE INDEX IF NOT EXISTS idx_dish_meal_tag ON dish(meal_tag)`,
  ],
});
```

Register in `migrations.ts` `MIGRATION_REGISTRY`.

**Step 3: Update model + types + repo**

- Add `MealTag` type union.
- Add `meal_tag: MealTag | null` to `DishModel`.
- Update `DishRepository.insert` signature to accept optional `meal_tag` and write it; `update` to allow patching it; `list` SELECT already covers via `*`.
- Update `CreateDishInput` / `UpdateDishInput` interfaces.

**Step 4: Update schema-compatibility expected columns**

Add `'meal_tag'` to the expected `dishColumns` array in both `.ts` and `.spec.ts`.

**Step 5: Run all tests**

```bash
npx ng test --watch=false --browsers=ChromeHeadless
```
Expected: all green, including new migration spec and updated compat specs.

**Step 6: Update data-model.md §4.2**

Add the column line + note: `meal_tag TEXT CHECK (...) NULL — Phase 1 seed grouping; nullable for user-created dishes`.

**Step 7: Commit**

```bash
git add src/ docs/3-design/data-model.md
git commit -m "feat(db): migration V4 — add dish.meal_tag for Phase 1 seed grouping"
```

---

## Task 1: ADR-002 — Seed Strategy

**Objective:** Pin down decisions in an architectural decision record so the curation rules and loader contract aren't re-litigated later.

**Files:**
- Create: `docs/4-architecture/adr/002-vietnamese-core-seed.md`

**Step 1: Write ADR**

Sections: Context (why we ship seed), Decision (USDA macro authority, 20 curated dishes, deterministic UUID v5, source='db', loader idempotent), Consequences (build script must run pre-bundle, tests must mock loader to avoid pollution), Alternatives Considered (online fetch on first launch — rejected, offline-first; user creates own — rejected, dead-on-arrival app).

**Step 2: Commit**

```bash
git add docs/4-architecture/adr/002-vietnamese-core-seed.md
git commit -m "docs(adr): 002 Vietnamese core seed strategy"
```

---

## Task 2: Ingredient Curated Source

**Objective:** Build a TS literal containing every ingredient needed by the 20 dishes, with USDA-derived canonical macros, units, and conversion factors.

**Files:**
- Create: `scripts/seed/data/ingredients.source.ts`

(NO `units.source.ts` — units already migration-seeded; see Audit Note 1.)

**Step 1: Define `RawIngredient` type**

```ts
import type { NutritionBasisUnit } from '../../../src/app/core/models/management.types';

// unit_id MUST be one of the 12 migration-seeded ids:
// 'g' | 'kg' | 'ml' | 'l' | 'tbsp' | 'tsp' | 'cup' | 'piece' | 'clove' | 'bunch' | 'slice' | 'pinch'
export type SeedUnitId =
  | 'g' | 'kg' | 'ml' | 'l' | 'tbsp' | 'tsp' | 'cup'
  | 'piece' | 'clove' | 'bunch' | 'slice' | 'pinch';

export interface RawIngredient {
  name: string;                  // canonical Vietnamese name, e.g. "Bánh phở khô"
  category: string;              // e.g. "Tinh bột"
  nutrition_basis_unit: NutritionBasisUnit;  // 'g' | 'ml'
  nutrition_basis_quantity: 100;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  density_g_per_ml?: number;     // for liquids that may also be measured by mass
  units: Array<{
    unit_id: SeedUnitId;
    factor_to_basis: number;     // grams (or ml) per 1 of this unit; for 'piece' this encodes per-ingredient piece weight (e.g. egg = 60)
    is_default?: true;           // exactly one per ingredient
    display_label?: string;      // e.g. "1 quả (60g)"
  }>;
  is_staple?: true;              // permits orphan (no dish reference)
}
```

**Step 2: Curate ~50 ingredients**

Group by category. Macro values must reference USDA FoodData Central — note source per ingredient in a leading comment block. Examples:

- Tinh bột: bánh phở khô, bún tươi, miến, gạo trắng, bánh mì baguette
- Đạm: thịt bò nạm, thịt bò thăn, ức gà, đùi gà, thịt heo nạc, thịt heo ba chỉ, cá basa, cá lóc, tôm tươi, đậu hũ, trứng gà
- Rau: hành lá, ngò, giá đỗ, rau sống, hành tây, cà chua, dưa leo, rau muống, cải ngọt, su hào, cà rốt
- Gia vị/staple: nước mắm, muối, đường, dầu ăn, hành tím, tỏi, gừng, sả, ớt, tiêu, hành khô
- Composite: nước dùng phở, nước chấm bún chả, base canh chua

For ingredients commonly counted (egg, garlic clove, baguette, tofu block):
```ts
// Trứng gà — 1 quả ≈ 60g
units: [
  { unit_id: 'g', factor_to_basis: 1 },
  { unit_id: 'piece', factor_to_basis: 60, is_default: true, display_label: '1 quả (60g)' },
]
```

**Step 3: Commit**

```bash
git add scripts/seed/data/
git commit -m "feat(seed): curated Vietnamese ingredient source"
```

---

## Task 3: Dish Curated Source

**Objective:** 20 dishes (6/7/7) with `meal_tag` and ingredient lines for `1 serving`.

**Files:**
- Create: `scripts/seed/data/dishes.source.ts`

**Step 1: Define type**

```ts
import type { MealTag } from '../../../src/app/core/models/management.types';
import type { SeedUnitId } from './ingredients.source';

export interface RawDish {
  name: string;
  description?: string;
  meal_tag: MealTag;             // 'breakfast' | 'lunch' | 'dinner' — written into dish.meal_tag column (V4)
  type: 'ingredient_based';      // Phase 1 seed is always ingredient_based; never 'ai_autofill'
  ingredients: Array<{
    ingredient_name: string;     // FK by name, resolved at build
    amount_value: number;
    unit_id: SeedUnitId;         // must exist in target ingredient's units[] OR be a global mass/volume unit
  }>;
}
```

**Step 2: Curate the 20 dishes**

Per spec:
- `meal_tag: 'breakfast'` (6): Phở bò, Phở gà, Bún thịt nướng, Bánh mì ốp la, Cháo gà, Miến gà
- `meal_tag: 'lunch'` (7): Cơm gà luộc, Cơm thịt kho trứng, Cơm cá kho tộ, Cơm bò xào rau củ, Cơm tôm rim, Cơm đậu hũ sốt cà chua, Cơm thịt heo luộc rau luộc
- `meal_tag: 'dinner'` (7): Bún chả, Cơm gà kho gừng, Cơm thịt heo nạc rang sả, Cơm canh chua cá, Cơm bò xào hành tây, Cơm tôm xào rau củ, Cơm đậu hũ thịt bằm

Each dish: 4-8 ingredient lines. Pho bò skeleton:

```ts
{
  name: 'Phở bò',
  description: 'Phở bò truyền thống miền Bắc',
  meal_tag: 'breakfast',
  type: 'ingredient_based',
  ingredients: [
    { ingredient_name: 'Nước dùng phở',  amount_value: 500, unit_id: 'ml' },
    { ingredient_name: 'Bánh phở tươi',  amount_value: 150, unit_id: 'g' },
    { ingredient_name: 'Thịt bò thăn',   amount_value: 80,  unit_id: 'g' },
    { ingredient_name: 'Hành lá',        amount_value: 10,  unit_id: 'g' },
    { ingredient_name: 'Ngò',            amount_value: 5,   unit_id: 'g' },
    { ingredient_name: 'Hành tây',       amount_value: 20,  unit_id: 'g' },
  ],
}
```

**Step 3: Commit**

```bash
git add scripts/seed/data/dishes.source.ts
git commit -m "feat(seed): curated 20 Vietnamese dishes with meal_tag"
```

---

## Task 4: Build Script

**Objective:** Compile sources → JSON, run validators, fail loud on rule violations.

**Files:**
- Create: `scripts/seed/build-vietnamese-core.ts`
- Create: `scripts/seed/validate.ts` (rule checks)
- Create: `scripts/seed/uuid.ts` (deterministic UUID v5 helper)

**Step 1: UUID helper**

```ts
import { v5 as uuidv5 } from 'uuid';
const NAMESPACE = '4f5e6d7a-1234-5678-9abc-def012345678'; // pinned constant
export const seedUuid = (kind: 'ingredient' | 'dish' | 'unit', name: string) =>
  uuidv5(`${kind}:${name}`, NAMESPACE);
```

**Step 2: Validators (each throws on first violation)**

- Every dish ingredient_name resolves to a known ingredient.
- Every ingredient appears in ≥1 dish OR has `is_staple: true`.
- Every ingredient has exactly 1 default unit and ≥1 unit total.
- Macro fields are numbers ≥ 0.
- Basis quantity = 100, basis unit ∈ {g, ml}.
- For `unit_id` not in {g, ml}: factor_to_basis must be > 0.
- Dish counts: 6 breakfast, 7 lunch, 7 dinner.

**Step 3: Build & emit**

Read sources → run validators → emit:
- `src/assets/seed/ingredients.json` (with `id`, `units[]` embedded — `unit_id` ∈ 12 migration-seeded ids)
- `src/assets/seed/dishes.json` (with `id`, `meal_tag`, `ingredients[]` resolved to `ingredient_id` + computed `normalized_amount`)

(NO `units.json` — units come from migration V3.)

`normalized_amount` MUST be computed by importing the canonical resolver:
```ts
import { resolveUnit } from '../../src/app/core/services/unit-resolver';
```
Do NOT reimplement the conversion logic — it lives in `src/app/core/services/unit-resolver.ts` (98 lines, 3-path: ingredient_unit → global → density). The build script and the runtime repo MUST use the same resolver to guarantee parity between seed-time and edit-time normalization.

Validator addition: dish-ingredient `unit_id` must satisfy ONE of:
- the target ingredient has a matching `ingredient_unit` row, OR
- the unit is a global mass/volume unit compatible with the ingredient's basis (e.g. `g` works with any `'g'`-basis ingredient).

If neither holds, build fails with a descriptive error pointing at the offending dish + line.

**Step 4: Commit**

```bash
git add scripts/seed/
git commit -m "feat(seed): build script + validators for Vietnamese core seed"
```

---

## Task 5: NPM Wiring

**Objective:** `npm run seed:build` and ensure built artifacts exist before bundle.

**Files:**
- Modify: `package.json`

**Step 1: Add scripts**

```json
"scripts": {
  "seed:build": "tsx scripts/seed/build-vietnamese-core.ts",
  "prebuild": "npm run check:form-pattern && npm run seed:build",
  "build": "ng build"
}
```
(If `tsx` not installed: `npm i -D tsx`. Already available transitively? check first.)

**Step 2: Run once and verify artifacts**

```bash
npm run seed:build
```
Expected: `src/assets/seed/{ingredients,dishes}.json` exist (NO `units.json` — see Audit Note 1), all validators pass.

**Step 3: Commit**

```bash
git add package.json package-lock.json src/assets/seed/
git commit -m "feat(seed): npm seed:build script + initial artifacts"
```

---

## Task 6: Repository Bulk Insert

**Objective:** Add `bulkInsertSeed()` to ingredient + dish repos that uses `source = 'db'` and is transactional.

**Files:**
- Modify: `src/app/core/repositories/ingredient.repository.ts`
- Modify: `src/app/core/repositories/dish.repository.ts`
- Test: `*.spec.ts` for each — TDD.
  (NOT `unit.repository.ts` — units are migration-seeded, see Audit Note 1.)

**Step 1: TDD — write failing test for `IngredientRepository.bulkInsertSeed`**

```ts
it('inserts seed ingredients with source=db and embedded units', async () => {
  await repo.bulkInsertSeed([{ id: 'fixed-uuid-1', name: 'Bánh phở khô', /* … */, units: [/* … */] }]);
  const got = await repo.getById('fixed-uuid-1');
  expect(got?.source).toBe('db');
  expect(got?.units?.length).toBe(2);
});
```

**Step 2: Implement** — bulk insert by chunked SQL or loop within transaction.

**Step 3: Repeat TDD for `DishRepository.bulkInsertSeed`** — must also insert `dish_ingredient` rows with `normalized_amount` from artifact.

**Step 4: REMOVED** — `UnitRepository.bulkInsertSeed` is NOT needed; units are seeded by migration V3 (Audit Note 1).

**Step 5: Source-flip parity check (verified — no action needed)**

Both `IngredientRepository.update` (`:119`) and `DishRepository.update` (`:91`) already implement the seed-→-user-edit source flip (`db→manual` and `db→custom` respectively). Add a regression spec in this task's test file to guard against future regressions:

```ts
it('Dish.update flips source from db to custom on user edit', async () => { /* … */ });
it('Ingredient.update flips source to manual on user edit', async () => { /* … */ });
```

**Step 6: Commit**

```bash
git add src/app/core/repositories/
git commit -m "feat(repos): bulkInsertSeed for ingredient + dish; dish source-flip on edit"
```

---

## Task 7: Seed Loader Service

**Objective:** Service that runs once on boot, after migrations, and conditionally loads.

**Files:**
- Create: `src/app/core/services/seed/seed-loader.service.ts`
- Test: `src/app/core/services/seed/seed-loader.service.spec.ts`

**Step 1: TDD — failing test**

```ts
describe('SeedLoaderService', () => {
  it('loads seed only when ingredient AND dish tables are empty', async () => {
    /* mock counts → 0/0 → expect bulkInsertSeed called once */
  });
  it('skips when ingredient or dish has rows', async () => {
    /* mock counts → 3/0 → expect bulkInsertSeed NOT called */
  });
});
```

**Step 2: Implement**

```ts
@Injectable({ providedIn: 'root' })
export class SeedLoaderService {
  async ensureSeeded(): Promise<void> {
    const ingredientCount = await this.db.getOne<{ c: number }>('SELECT COUNT(*) AS c FROM ingredient');
    const dishCount = await this.db.getOne<{ c: number }>('SELECT COUNT(*) AS c FROM dish');
    if ((ingredientCount?.c ?? 0) > 0 || (dishCount?.c ?? 0) > 0) return;
    const ingredients = await firstValueFrom(this.http.get<RawIngredient[]>('assets/seed/ingredients.json'));
    const dishes = await firstValueFrom(this.http.get<RawDish[]>('assets/seed/dishes.json'));
    await this.ingredientRepo.bulkInsertSeed(ingredients);
    await this.dishRepo.bulkInsertSeed(dishes);
  }
}
```

**Step 3: Commit**

```bash
git add src/app/core/services/seed/
git commit -m "feat(seed): SeedLoaderService with idempotent first-run logic"
```

---
## Task 8: Boot Wiring (APP_INITIALIZER, not ngOnInit)

**Objective:** Run `seedLoader.ensureSeeded()` after `db.initialize()` (which itself runs migrations) and after the legacy sql.js migration step, but BEFORE `profileStore.loadProfile()` returns. Wire it inside the existing `APP_INITIALIZER` factory in `database.provider.ts` — that's where boot lifecycle actually lives, NOT in `app.component.ts.ngOnInit`.

**Files:**
- Modify: `src/app/core/services/database/database.provider.ts` — inject `SeedLoaderService`, await `ensureSeeded()` between legacy-migrator and `loadProfile()`.

**Step 1: Locate the factory (already read; lines 27-56 today)**

Current order:
```
1. db.initialize()          // schema DDL + MIGRATION_REGISTRY (now includes V4)
2. LegacySqlJsMigrator      // native only, with timeout
3. profileStore.loadProfile()
```

**Step 2: Insert seed step (between #2 and #3)**

```ts
// inside the APP_INITIALIZER factory
const seedLoader = inject(SeedLoaderService);
// ... after legacy-migrator catch ...
await seedLoader.ensureSeeded().catch((err) =>
  console.warn('[DatabaseProvider] seed load skipped:', err),
);
await profileStore.loadProfile();
```

Rationale:
- After migrations: `meal_tag` column + units table present.
- Before `loadProfile()`: future profile-bound seed (none in Phase 1, but reserves ordering).
- Wrapped in `.catch` because a missing JSON or HTTP error must not brick startup — log + continue. (Reasonable for offline-first; the user just won't see seeded dishes — recoverable on next launch.)

**Step 3: Update the factory's docblock** (lines 17-26) to add step 3a "SeedLoaderService.ensureSeeded()".

**Step 4: Test ordering**

Existing `database.provider.spec.ts` (if any) — extend with a test that asserts `ensureSeeded` is called after `initialize` and before `loadProfile`. If no spec exists, create a minimal one with mocks.

**Step 5: Run all tests**

```bash
npx ng test --watch=false --browsers=ChromeHeadless
```

**Step 6: Commit**

```bash
git add src/app/core/services/database/database.provider.ts
git commit -m "feat(seed): wire SeedLoaderService into APP_INITIALIZER boot factory"
```

---

## Task 9: Manual QA on Emulator (mandatory per memory rule)

**Objective:** Verify fresh-install behavior end-to-end on Android emulator-5554.

**Steps:**

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
~/Library/Android/sdk/platform-tools/adb -s emulator-5554 shell pm clear com.healthmate.ai
~/Library/Android/sdk/platform-tools/adb -s emulator-5554 install -r app/build/outputs/apk/debug/app-debug.apk
~/Library/Android/sdk/platform-tools/adb -s emulator-5554 shell monkey -p com.healthmate.ai 1
```


> Note 2026-04-29: Management UX was later redesigned to dish-first. If this QA is run after the redesign, `Quản lý` should already open `Món ăn`; the ingredient segment label is `Thư viện nguyên liệu` rather than the older `Nguyên liệu` label.

Then:
1. Complete onboarding (one quick path).
2. Tap Quản lý tab.
3. Switch to "Món ăn" → expect to see 20 dishes.
4. Switch to "Nguyên liệu" → expect ~50 ingredients with units shown.
5. Tap into Phở bò → confirm ingredient breakdown is editable, totals visible.
6. Edit one seeded ingredient → verify `source` flips to `manual` (DevTools or repo unit test already covers this).
7. Force-close and relaunch → no duplicate inserts (count stays the same).

Capture 2 screenshots: management list (dish + ingredient) for visual verification.

---

## Task 10: Final Commit + Push

```bash
git push origin main
```

**Exit criteria (matches phase-1-management.md §5.2):** App fresh install → Management tab shows ingredient set tied to 20 Vietnamese dishes + 20 dish seeds usable as `1 serving` templates. ✅

---

## Risks & Pitfalls

- **Macro accuracy:** USDA values for raw cuts vary (lean vs untrimmed). Pick "raw, lean" variants and document choice.
- **Composite ingredients (`Nước dùng phở`)** — user editing total nutrition of broth shouldn't cascade weirdly because the dish references it as one ingredient. Phase 1 design accepts this.
- **HTTP fetch on Android:** `assets/` is bundled — `HttpClient.get('assets/seed/...')` works on Capacitor. No CORS issue, but add error handling for missing file.
- **Test pollution:** `WebDatabaseService` tests using fresh DB will trigger seed loader if wired through DI — make sure test bed provides a stub `SeedLoaderService`.
- **Hermes_tools read_file pitfall** (project memory): if writing scripts via `execute_code`, use plain `open()`, not `read_file`+`write_file`.

---

**End of plan.**
