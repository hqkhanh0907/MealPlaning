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

## Task Index

1. ADR-002 — document seed strategy & loader contract (docs only).
2. Ingredient curated source (TS data file, ~50 items).
3. Dish curated source (TS data file, 20 dishes with ingredient lines).
4. Build script `scripts/seed/build-vietnamese-core.ts` + validators.
5. Wire `npm run seed:build` into `package.json` and pre-build hook.
6. Repositories — `bulkInsertSeed()` methods on Ingredient + Dish repos.
7. `SeedLoaderService` + idempotency check + DI provider.
8. Wire loader into `app.component.ts` boot sequence (after migration runner).
9. Manual QA on emulator (fresh install → see seeded data in Management tab).
10. Commit + push.

Estimated total: ~3 hours focused work (Tasks 2 + 3 are bulk of it — manual curation).

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
- Create: `scripts/seed/data/units.source.ts` (registry of allowed units — g, ml, tbsp, tsp, piece, slice, bowl, cup, etc.)

**Step 1: Define `RawIngredient` type**

```ts
export interface RawIngredient {
  name: string;                  // canonical Vietnamese name, e.g. "Bánh phở khô"
  category: string;              // e.g. "Tinh bột"
  nutrition_basis_unit: 'g' | 'ml';
  nutrition_basis_quantity: 100;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  density_g_per_ml?: number;     // for ml-basis or liquids that may also be measured by volume
  units: Array<{
    unit_id: string;             // 'g' | 'ml' | 'tbsp' | 'tsp' | 'piece-egg' | 'bowl-pho' | …
    factor_to_basis: number;     // e.g. tbsp = 15
    is_default?: true;
    display_label?: string;      // e.g. "1 quả (60g)"
  }>;
  is_staple?: true;              // permits orphan
}
```

**Step 2: Curate ~50 ingredients**

Group by category. Macro values must reference USDA FoodData Central — note source per ingredient in a leading comment block. Examples:

- Tinh bột: bánh phở khô, bún tươi, miến, gạo trắng, bánh mì baguette
- Đạm: thịt bò nạm, thịt bò thăn, ức gà, đùi gà, thịt heo nạc, thịt heo ba chỉ, cá basa, cá lóc, tôm tươi, đậu hũ, trứng gà
- Rau: hành lá, ngò, giá đỗ, rau sống, hành tây, cà chua, dưa leo, rau muống, cải ngọt, su hào, cà rốt
- Gia vị/staple: nước mắm, muối, đường, dầu ăn, hành tím, tỏi, gừng, sả, ớt, tiêu, hành khô
- Composite: nước dùng phở, nước chấm bún chả, base canh chua

**Step 3: Define units source**

```ts
export const UNITS: RawUnit[] = [
  { id: 'g', display_name_vi: 'gram', short_name_vi: 'g', unit_type: 'mass', is_global: 1, base_factor_g: 1, base_factor_ml: null, is_approximate: 0, display_order: 1 },
  { id: 'ml', display_name_vi: 'mililít', short_name_vi: 'ml', unit_type: 'volume', is_global: 1, base_factor_g: null, base_factor_ml: 1, is_approximate: 0, display_order: 2 },
  { id: 'tbsp', …, is_approximate: 1, … },
  …
];
```

**Step 4: Commit**

```bash
git add scripts/seed/data/
git commit -m "feat(seed): curated Vietnamese ingredient + unit source"
```

---

## Task 3: Dish Curated Source

**Objective:** 20 dishes (6/7/7) with ingredient lines for `1 serving`.

**Files:**
- Create: `scripts/seed/data/dishes.source.ts`

**Step 1: Define type**

```ts
export interface RawDish {
  name: string;
  description?: string;
  type: 'breakfast' | 'lunch' | 'dinner';
  ingredients: Array<{
    ingredient_name: string;     // FK by name (resolved at build)
    amount_value: number;
    unit_id: string;
  }>;
}
```

**Step 2: Curate the 20 dishes**

Per spec:
- Sáng (6): Phở bò, Phở gà, Bún thịt nướng, Bánh mì ốp la, Cháo gà, Miến gà
- Trưa (7): Cơm gà luộc, Cơm thịt kho trứng, Cơm cá kho tộ, Cơm bò xào rau củ, Cơm tôm rim, Cơm đậu hũ sốt cà chua, Cơm thịt heo luộc rau luộc
- Tối (7): Bún chả, Cơm gà kho gừng, Cơm thịt heo nạc rang sả, Cơm canh chua cá, Cơm bò xào hành tây, Cơm tôm xào rau củ, Cơm đậu hũ thịt bằm

Each dish: 4-8 ingredient lines. Pho bò example skeleton:
```ts
{ name: 'Phở bò', description: 'Phở bò truyền thống miền Bắc', type: 'breakfast', ingredients: [
  { ingredient_name: 'Nước dùng phở', amount_value: 500, unit_id: 'ml' },
  { ingredient_name: 'Bánh phở tươi', amount_value: 150, unit_id: 'g' },
  { ingredient_name: 'Thịt bò thăn', amount_value: 80, unit_id: 'g' },
  { ingredient_name: 'Hành lá', amount_value: 10, unit_id: 'g' },
  { ingredient_name: 'Ngò', amount_value: 5, unit_id: 'g' },
  { ingredient_name: 'Hành tây', amount_value: 20, unit_id: 'g' },
] }
```

**Step 3: Commit**

```bash
git add scripts/seed/data/dishes.source.ts
git commit -m "feat(seed): curated 20 Vietnamese dishes source"
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
- `src/assets/seed/ingredients.json` (with `id`, `units[]` embedded)
- `src/assets/seed/dishes.json` (with `id`, `ingredients[]` resolved to `ingredient_id` + computed `normalized_amount`)
- `src/assets/seed/units.json` (global unit registry rows)

`normalized_amount` computed via existing rule (factor_to_basis or density_g_per_ml fallback) — reuse existing resolver if exposed; else inline equivalent here and add a TODO to dedupe.

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
Expected: `src/assets/seed/{ingredients,dishes,units}.json` exist, all validators pass.

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
- Modify: `src/app/core/repositories/unit.repository.ts`
- Test: `*.spec.ts` for each — TDD.

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

**Step 4: Repeat for `UnitRepository.bulkInsertSeed`** if not already covered (units may already be migration-seeded — check; if so, skip this).

**Step 5: Commit**

```bash
git add src/app/core/repositories/
git commit -m "feat(repos): bulkInsertSeed for ingredient + dish + unit"
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

## Task 8: Boot Wiring

**Objective:** Run `seedLoader.ensureSeeded()` after `migrationRunner.run()` in `app.component.ts` (or wherever boot is wired).

**Files:**
- Modify: `src/app/app.component.ts` (or `database.provider.ts` if seed lives there)

**Step 1: Locate boot**

```bash
grep -nE "migration|MigrationRunner|ensureMigrated" src/app/app.component.ts src/app/core/services/database/database.provider.ts
```

**Step 2: Inject + call**

```ts
constructor(private readonly seed: SeedLoaderService /* … */) {}
async ngOnInit() {
  await this.migrationRunner.run();
  await this.seed.ensureSeeded();
}
```

**Step 3: Run unit tests**

```bash
npx ng test --watch=false --browsers=ChromeHeadless
```
Expected: All pass (including new seed tests). Mock `SeedLoaderService` in component spec to avoid HTTP fetch.

**Step 4: Commit**

```bash
git add src/app/app.component.ts
git commit -m "feat(seed): wire SeedLoaderService into app boot"
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
