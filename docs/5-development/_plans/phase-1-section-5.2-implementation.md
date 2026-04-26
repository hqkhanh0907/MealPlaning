# Phase 1 §5.2 Implementation Plan — Vietnamese Core Seed Pipeline

**Owner:** Hermes Agent + Khanh
**Branch:** main (commits per sub-step, conventional commits)
**Spec source:** `docs/5-development/phase-1-management.md` §5.2 v2 + `_drafts/phase-1-section-5.2-update.md`
**Started:** 2026-04-26

---

## Overall strategy

- 8 sub-steps (5.2.1 → 5.2.8). Each = 1 commit, tests live with code (TDD where it makes sense).
- Each sub-step has clear exit criteria + verification (build + test + APK + emulator for the final 5.2.8).
- Boy-scout: any pre-existing breakage encountered → fix in-flight, document in commit body.
- Determinism is non-negotiable — every JSON emit must be byte-identical on re-run (sorted keys, frozen UUIDs, normalized number precision).

## Curation approach (Q2 → no USDA, VN sources)

Since we cannot fetch from USDA, ingredient macro values come from one of three lanes:

| Lane | When to use | Source field | Citation requirement |
|------|-------------|--------------|----------------------|
| `vien-dinh-duong` | First choice. Bảng thành phần dinh dưỡng thực phẩm Việt Nam (Viện Dinh Dưỡng, NXB Y Học) | `source: 'vien-dinh-duong'` | Page + item code in `sources/vien-dinh-duong.md` |
| `wikipedia-vi` | When VDDT lacks per-100g detail OR item is a composite imported good | `source: 'wikipedia-vi'` | URL + revision id in `sources/wikipedia-vi.md` |
| `manual` | When no public source has it (regional dishes, branded products, rough estimates) | `source: 'manual'` | Free-text `notes` field explaining derivation; `is_approximate = true` recommended |

**Practical execution:** I'll start with what I can derive from common knowledge of VN cuisine + verifiable open sources. Every value gets a citation. If I hit a value I'm uncertain about, I'll mark `is_approximate=true` and flag it in PR description for your review. This is faster than blocking on book scans you may need to physically check.

## Sub-step plan

### 5.2.1 Curated scaffolding (this step) — small, structural

**Goal:** Land the file skeleton + TypeScript shapes so 5.2.2-5.2.4 can plug into a stable interface. **No heavy curation yet.**

Deliverables:
- `scripts/seed/types.ts` — shared `IngredientSeed`, `CompositeRecipe`, `DishSeed` interfaces
- `scripts/seed/curated/vi-ingredients.ts` — empty/sample atomic ingredient entries (3-5 demo for shape)
- `scripts/seed/curated/vi-composites.ts` — empty/sample composite (1 demo: Nước dùng phở)
- `scripts/seed/curated/vi-dishes.ts` — empty/sample dish (1 demo: Phở bò)
- `scripts/seed/curated/sources/vien-dinh-duong.md` — empty citation file with format example
- `scripts/seed/curated/sources/wikipedia-vi.md` — same
- `scripts/seed/.gitkeep` if needed
- `package.json` add `seed:build` script stub (echoes "not yet implemented")
- `tsconfig.seed.json` — Node TS config so we can `tsx scripts/seed/...`
- Add `tsx` to devDependencies (or use existing `ts-node` if installed)
- README addendum: brief `## Seeding` section pointing to docs

Verification:
- `tsc --noEmit -p tsconfig.seed.json` passes
- `npm run seed:build` exits 0 with stub message
- `ng build` + `ng test` still green (no app code touched)

Commit: `chore(seed): §5.2.1 scaffold curated data files + build pipeline skeleton`

### 5.2.2 build-ingredients.ts

Goal: First real script. Reads `vi-ingredients.ts`, validates with zod, sorts deterministically, writes `src/assets/seed/ingredients.json`.
- Curate **all** atomic ingredients needed by 20 dishes + Vietnamese kitchen staples
- Each entry has source_citation
- AC1–AC5 enforced
- Tests: `scripts/seed/__tests__/build-ingredients.spec.ts` — schema validation + determinism
- Commit: `feat(seed): §5.2.2 build-ingredients.ts + curated atomic VN ingredients`

### 5.2.3 build-composites.ts

Goal: Sum nested recipes → composites.json with derived per-100 macro.
- Curate composite recipes: Nước dùng phở, Nước dùng phở gà, Nước chấm bún chả, Base canh chua (cá), and any others 20 dishes need
- Build script does conversion via `ingredient_unit` lookup
- AC6–AC9 enforced
- Tests: macro derivation correctness with mock data
- Commit: `feat(seed): §5.2.3 build-composites.ts with nested-recipe macro derivation`

### 5.2.4 build-dishes.ts + validate-seed.ts

Goal: 20 dishes (6/7/7) with `meal_tag` + `is_favorite=false`. validate-seed.ts cross-references everything.
- Curate `vi-dishes.ts` with all 20 món
- AC10–AC15 enforced
- Tests: distribution check, cross-ref check, schema check
- Commit: `feat(seed): §5.2.4 build-dishes.ts + validate-seed.ts (20 món, 6/7/7)`

### 5.2.5 V5 migration: seed_artifact table

Goal: Add migration `v5_seed_artifact.sql` + bump runner to V5.
- SQL: `CREATE TABLE seed_artifact ...` + index
- Update `app_config.db_version` to 5 on apply
- Test: V4→V5 upgrade preserves data; fresh install lands at V5 directly
- Commit: `feat(db): §5.2.5 V5 migration adds seed_artifact tracker table`

### 5.2.6 SeedLoaderService + unit tests

Goal: Service that reads 3 JSONs from assets, applies idempotent insert algorithm.
- File: `src/app/core/services/seed/seed-loader.service.ts`
- Pure DB operations via existing repositories (or direct SQL if simpler)
- Tests (sql.js):
  - Fresh DB → all seeds inserted, tracker populated
  - Re-run → 0 changes
  - Delete dish → re-run → not re-added
  - Add new UUID to JSON → re-run → exactly 1 new insert
- Commit: `feat(seed): §5.2.6 SeedLoaderService with idempotent algorithm`

### 5.2.7 App bootstrap integration

Goal: Call SeedLoader after migration on app start. Don't block UI.
- Hook into existing init sequence (probably `WebDatabaseService.initialize()` or app initializer)
- Test: existing init tests still pass, plus a new one verifying loader runs once
- Commit: `feat(app): §5.2.7 wire SeedLoaderService into app bootstrap`

### 5.2.8 Emulator smoke test

Goal: Real device verification per user preference (UI tap, not just DB query).
- `pm clear` package
- Build APK, install, launch
- Navigate to Quản lý tab
- Screencap + verify 20 dishes visible (or appropriate UI for first list)
- Check meal_tag distribution by tapping filter (if exists) or by inspecting DB
- Verify tracker via `adb exec-out run-as ... cat .../healthmateSQLite.db`
- Document result in `docs/5-development/phase-1-management.md` §8 Retro
- Commit: `chore(qa): §5.2.8 emulator smoke verification for seed loader`

## Risk / open items

- **VN macro accuracy:** without the physical Viện Dinh Dưỡng book, some values will be `is_approximate=true`. PR description for 5.2.2 will list which entries you may want to double-check.
- **`ingredient_unit` table (V?):** §5.2.3 needs unit conversion rows. If V1 doesn't seed any units, we'll need a baby seed step or extend V1. **Action: check current schema before 5.2.3.**
- **Existing `dish.is_favorite` column:** verify it exists in V4 schema. If not, add in V5 alongside `seed_artifact`.
- **Determinism trap:** JSON `Object.keys` order is insertion-order in Node — must explicitly sort before stringify.
- **Tests config:** new `scripts/seed/__tests__/` folder needs a runner. Use existing `ng test` config OR add a separate `vitest`/`jest` for Node-only scripts. Decide at 5.2.2.

## Success = 5.2.8 done

When all 8 sub-steps green AND emulator smoke passes AND `phase-1-management.md` updated with retro, §5.2 is complete and Phase 1 moves to §5.3 Repositories.
