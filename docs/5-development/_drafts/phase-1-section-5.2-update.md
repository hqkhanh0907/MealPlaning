# Phase 1 §5.2 — Vietnamese Core Seed Pipeline (Draft Update v2)

**Status:** Draft v2 — incorporates 5 user decisions from discussion (2026-04-26).
**Author:** Hermes Agent
**Goal:** Final spec for §5.2 before starting implementation. Once you ✅, I replace §5.2 in `phase-1-management.md`.

---

## User decisions locked in (this revision)

| # | Question | Decision |
|---|----------|----------|
| Q1 | Ingredient count target? | **No limit** — cover all 20 dishes + Vietnamese kitchen staples. Final count emerges from recipes. |
| Q2 | USDA FDC API key handling? | **Skip USDA entirely.** Macro source = Vietnamese sources (Viện Dinh Dưỡng "Bảng thành phần dinh dưỡng thực phẩm Việt Nam" + Wikipedia VI as fallback + manual curation). |
| Q3 | Composite ingredients (nước dùng, nước chấm, base canh) macro? | **Sum from components** via nested recipe. Composites stored as a separate `composite_recipe` JSON, macro derived at build time. |
| Q4 | SeedLoader idempotency tracker? | **`seed_artifact` table** (V5 migration), key = artifact UUID + type. Loader skips any UUID it has previously inserted, even if user later deleted the row. |
| Q5 | Default favorites for 20 seed dishes? | **None.** All seed dishes ship with `is_favorite = false`. User adds their own. |

---

## Gaps in current §5.2 (what this draft fixes)

| # | Gap | Resolution |
|---|-----|------------|
| 1 | "build-vietnamese-core.ts" lumps ingredient + dish concerns | Split into `build-ingredients.ts` + `build-composites.ts` + `build-dishes.ts` |
| 2 | Macro source ambiguous (USDA? VN?) | Q2 → VN sources, no API calls, all data committed to repo |
| 3 | Composite macro derivation undefined | Q3 → nested recipe sum at build time |
| 4 | V4 `dish.meal_tag` not enforced for seeds | Schema requires `meal_tag`, build script fails if any seed missing it |
| 5 | "Don't re-add deleted seeds" lacks mechanism | Q4 → `seed_artifact` table, V5 migration |
| 6 | Loader idempotency untested | Tests in §5.2.7 cover fresh / re-run / user-delete / new-version cases |

---

## 5.2.1 Build pipeline architecture (no network, fully offline)

Since USDA is skipped (Q2), the build pipeline is **pure local data assembly** — no API key, no rate limit, no `.cache/`, no network in CI.

```
scripts/seed/
├── build-ingredients.ts      ← Step 1: emit ingredients.json from curated atomic list
├── build-composites.ts       ← Step 2: emit composites.json by summing component recipes
├── build-dishes.ts           ← Step 3: emit dishes.json (20 dishes, 6/7/7), validate refs
├── validate-seed.ts          ← Step 4: cross-ref + schema + meal_tag distribution checks
└── curated/
    ├── vi-ingredients.ts     ← Atomic ingredients (UUID + name_vi + macro per 100g + source citation)
    ├── vi-composites.ts      ← Composite recipes (UUID + components[] + final basis)
    ├── vi-dishes.ts          ← 20 dishes (UUID + meal_tag + ingredients[] with quantity)
    └── sources/
        ├── vien-dinh-duong.md   ← Citations to "Bảng thành phần dinh dưỡng thực phẩm Việt Nam"
        └── wikipedia-vi.md      ← Wikipedia VI fallback citations
```

**Single npm command:** `npm run seed:build` runs all 4 steps in order; fails fast on any validation error. CI runs the same command and `git diff --exit-code` to enforce determinism.

---

## 5.2.2 Atomic ingredient schema (Step 1)

**Output:** `src/assets/seed/ingredients.json`

```ts
interface IngredientSeed {
  id: string;                  // UUID v4, frozen in vi-ingredients.ts
  name_vi: string;             // "Ức gà"
  name_en: string;             // "Chicken breast, raw" (for searchability)
  category: IngredientCategory;
  // 'meat'|'seafood'|'vegetable'|'fruit'|'grain'|'dairy'|'egg'|'condiment'|'spice'|'staple'
  nutrition_basis_unit: 'g' | 'ml';
  nutrition_basis_quantity: 100;
  calories: number;            // kcal per 100 g/ml
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  density_g_per_ml: number | null;  // required if liquid + has volume units allowed
  default_unit_id: string;     // FK → unit table (g/ml/piece/...)
  source: 'vien-dinh-duong' | 'wikipedia-vi' | 'manual';
  source_citation: string;     // e.g. "VDDT 2017, p.42, item 0204" or URL
  is_approximate: boolean;
}
```

**Acceptance criteria (Step 1):**

| # | Criterion | Verification |
|---|-----------|--------------|
| AC1 | Every ingredient referenced by `vi-dishes.ts` or `vi-composites.ts` exists in `ingredients.json` | Cross-ref in `validate-seed.ts`, fail build on missing |
| AC2 | All Vietnamese kitchen staples included even if not in any seed dish: nước mắm, muối, đường, dầu ăn, hành tím, hành lá, tỏi, gừng, sả, ớt, tiêu, bột ngọt | Whitelist enforced in `validate-seed.ts` |
| AC3 | Every ingredient has `source_citation` non-empty (no orphan macros) | Schema validator |
| AC4 | Re-running `npm run seed:build` produces byte-identical `ingredients.json` | `git diff --exit-code` after re-run (in CI) |
| AC5 | Every ingredient has at least 1 row in derived `ingredient_unit[]` (default unit always present) | Schema validator |

No count target — set emerges from Q1 decision (cover 20 dishes + staples).

---

## 5.2.3 Composite ingredient schema (Step 2)

**Q3 decision applied.** Composites = nested recipes, macro derived at build time. Stored in DB as **regular ingredients** (so the user picks them as a single line in a dish), but with the recipe + derivation provenance preserved.

**Curated input:** `vi-composites.ts`

```ts
interface CompositeRecipe {
  id: string;                  // UUID v4 frozen
  name_vi: string;             // "Nước dùng phở"
  category: 'composite';
  final_basis_unit: 'g' | 'ml';
  final_basis_quantity: 100;   // macros are reported per 100 g/ml of finished composite
  yield_total_quantity: number;     // e.g. 3000 (ml of broth produced)
  yield_total_unit: 'g' | 'ml';
  density_g_per_ml: number | null;
  default_unit_id: string;
  components: Array<{
    ingredient_id: string;     // FK → ingredients.json (atomic)
    quantity: number;
    unit_id: string;
    // unit must convert to g via ingredient_unit table → enables macro sum
  }>;
  notes?: string;              // e.g. "Macro reflects strained broth, not bone discard"
}
```

**Build-time derivation** (`build-composites.ts`):

```
For each composite:
  totalMass_g  = Σ component.quantity → grams via ingredient_unit conversion
  totalKcal    = Σ component.grams × component.calories / 100
  totalProtein = Σ component.grams × component.protein  / 100
  ... (same for carbs, fat, fiber)
  yieldMass_g  = yield_total_quantity × (density if ml else 1)
  per100       = (totalKcal / yieldMass_g) × 100   // and same for each macro
  emit IngredientSeed with category='composite', nutrition values = per100,
       source='manual', source_citation='derived from vi-composites.ts#<id>'
```

**Output:** `src/assets/seed/composites.json` (same schema as `IngredientSeed`, with extra `derived_from: { component_ids: string[], yield_total_g: number }` field for audit).

At runtime SeedLoader treats `composites.json` exactly like `ingredients.json` — both flow into the `ingredient` table.

**Acceptance criteria (Step 2):**

| # | Criterion | Verification |
|---|-----------|--------------|
| AC6 | Composite list covers every "composite" referenced by a dish (typically: nước dùng phở, nước chấm bún chả, base canh chua, nước chấm gỏi cuốn) | Cross-ref check, fail build on missing |
| AC7 | Every composite component_id resolves in `ingredients.json` (atomic only — no nested composites in V1) | Validator rejects nested composites |
| AC8 | Derived per-100 macro is finite and ≥ 0 for all composites | Sanity check; loud failure on NaN/negative |
| AC9 | Composite yield mass conversion uses `ingredient_unit` table (single source of truth, not hardcoded) | Code review + unit test |

---

## 5.2.4 Dish schema + meal_tag enforcement (Step 3)

**Output:** `src/assets/seed/dishes.json`

```ts
interface DishSeed {
  id: string;                  // UUID v4 frozen
  name_vi: string;             // "Phở bò"
  meal_tag: 'breakfast' | 'lunch' | 'dinner';   // REQUIRED (V4)
  servings: 1;                 // seed templates always per-serving
  is_favorite: false;          // Q5 decision: no defaults
  ingredients: Array<{
    ingredient_id: string;     // FK → ingredients.json OR composites.json (both flow to `ingredient` table)
    quantity: number;
    unit_id: string;
  }>;
  source: 'curated';
  notes?: string;              // e.g. "Phở bò uses composite Nước dùng phở (200ml)"
}
```

**Acceptance criteria (Step 3):**

| # | Criterion | Verification |
|---|-----------|--------------|
| AC10 | Exactly 20 dishes, distribution `{breakfast: 6, lunch: 7, dinner: 7}` | Asserted in `validate-seed.ts` |
| AC11 | All 20 dish ids match the curated UUIDs (frozen, never regenerated) | `git diff` of `vi-dishes.ts` UUIDs in CI |
| AC12 | Every `ingredients[].ingredient_id` resolves in `ingredients.json` ∪ `composites.json` | Cross-ref check |
| AC13 | Every dish has `meal_tag` set to one of the 3 enum values | Schema validator (rejects null) |
| AC14 | Every dish has `is_favorite === false` (Q5 enforced) | Schema validator |
| AC15 | Computed dish-level macro per serving is finite and within ±5 % of typical published values for that dish (sanity, not strict) | Sanity test, warn-only on failure |

---

## 5.2.5 SeedLoaderService idempotency mechanism (Q4 — locked in)

**V5 migration scope (Task: "5.2.4 V5 migration"):**

```sql
CREATE TABLE seed_artifact (
  artifact_id      TEXT PRIMARY KEY,        -- UUID from seed JSON
  artifact_type    TEXT NOT NULL,           -- 'ingredient' | 'composite' | 'dish'
  seed_version     TEXT NOT NULL,           -- semver, e.g. "1.0.0"
  inserted_at      TEXT NOT NULL,           -- ISO 8601
  fingerprint_hash TEXT NOT NULL            -- sha256 of canonical JSON of the seed record
);
CREATE INDEX idx_seed_artifact_type ON seed_artifact(artifact_type);
```

**Loader algorithm (`SeedLoaderService.run()`):**

```
1. Read ingredients.json, composites.json, dishes.json from src/assets/seed/
2. For each seed record (in any of the 3 files):
     IF seed_artifact row exists with artifact_id = record.id:
       SKIP  (loader has seen this id before — even if user deleted from main table)
     ELSE:
       BEGIN TRANSACTION
         INSERT INTO ingredient/dish (record fields)
         INSERT INTO ingredient_unit (...) for each derived unit row
         INSERT INTO seed_artifact (record.id, type, version, now, sha256(record))
       COMMIT
3. Done. No UPDATE on existing rows ever.
```

**Properties:**
- Fresh install → all seeds inserted, all tracked.
- User deletes Phở bò → tracker keeps the UUID → loader never re-adds.
- Phase 1.5 ships new seeds → only new UUIDs (not in tracker) get inserted.
- User edits Cà chua macro → tracker has the row → loader skips, edit preserved.
- App reinstall after `pm clear` → tracker empty → behaves like fresh install (acceptable).

---

## 5.2.6 Source provenance & VN data references

Replaces the old §5.2.6 (USDA API key — deleted, no longer applies).

- Citations are committed under `scripts/seed/curated/sources/`:
  - `vien-dinh-duong.md` — primary source for VN-specific items (rau muống, ngò gai, mắm tôm, ...).
  - `wikipedia-vi.md` — fallback for items where VDDT lacks per-100g detail.
- Each `IngredientSeed.source_citation` is a free-text string pointing to the exact row/page/URL in those files.
- Manual values (`source: 'manual'`) require a `notes` field explaining why no public source.
- Composite citations point to the `vi-composites.ts` recipe id; the macro is reproducible by re-running `build-composites.ts`.

---

## 5.2.7 Test additions to §5.7

Add to §5.7 test plan:

**Build-script tests (Node, run by `npm run seed:build` in CI):**
- Schema validation passes for `ingredients.json`, `composites.json`, `dishes.json`.
- Cross-ref AC1, AC6, AC7, AC12 all pass.
- Determinism: `npm run seed:build` then `git diff --exit-code` clean.
- meal_tag distribution AC10 = 6/7/7.
- AC2 staple whitelist present.
- AC14 every dish `is_favorite === false`.

**SeedLoader unit tests (sql.js in-memory, run by `ng test`):**
- Fresh DB → loader inserts N ingredients + M composites + 20 dishes; `seed_artifact` count == N+M+20.
- Re-run on same DB → 0 new inserts, 0 errors, 0 duplicate-key exceptions.
- Delete one seed dish row → re-run → still 0 re-inserts (tracker prevents).
- Append a new ingredient UUID to `ingredients.json` → re-run → exactly 1 new insert.
- Composite macro derivation: feed mock atomic ingredients with known macros → assert composite per-100 values match hand-computed expected.

**Integration test (sql.js):**
- Run V5 migration on a V4 DB with no seed data → SeedLoader populates everything → query confirms 20 dishes split 6/7/7 by `meal_tag`.

---

## Updated §6 execution order (replace existing §6 entries for 5.2)

```
5.2.1  Curated data scaffolding (vi-ingredients.ts + vi-composites.ts + vi-dishes.ts stubs + sources/ folder)
5.2.2  build-ingredients.ts + JSON schema + AC1–AC5 tests
5.2.3  build-composites.ts (nested-recipe summation) + AC6–AC9 tests
5.2.4  build-dishes.ts + validate-seed.ts + AC10–AC15 tests
5.2.5  V5 migration: seed_artifact table
5.2.6  SeedLoaderService implementation + unit tests
5.2.7  App bootstrap integration (call loader once after migration on app start)
5.2.8  Emulator smoke test: fresh install → Quản lý tab shows 20 dishes + ingredients with macros
```

---

## What's NO LONGER in scope (removed by Q2/Q5 decisions)

- ❌ USDA FoodData Central API integration
- ❌ `.cache/usda/` directory
- ❌ `USDA_FDC_API_KEY` environment variable / README seeding section
- ❌ Rate limiting / exponential backoff / 429 retry logic
- ❌ Default favorites flag for any seed dish

---

When you ✅ this draft (or note edits), I'll merge into `docs/5-development/phase-1-management.md` §5.2 and start §5.2.1 (curated data scaffolding).
