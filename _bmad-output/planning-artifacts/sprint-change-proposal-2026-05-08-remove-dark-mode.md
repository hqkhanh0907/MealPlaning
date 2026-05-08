# Sprint Change Proposal — Remove Dark Mode + Collapse Migrations (2026-05-08, rev 2)

- **Trigger:** Quyết định 2026-05-08 — bỏ dark mode khỏi MealPlaning. Light theme là canonical duy nhất. Đồng thời dùng dịp này collapse 6 migrations về 1 vì chưa public release.
- **Scope:** **Moderate** — code + design system + sprint history. **Pre-release**, không có user data → không cần migration evolution.
- **Approach:** **1A + B** = light-only + Story 2.6 hotfix v0.2.1 + collapse migrations về v1 final.
- **Mode:** Batch.
- **Owner:** Amelia (dev) + Paige (docs sync).

---

## 1. Issue Summary

- **Vấn đề 1 (dark mode):** Maintenance cost dark variants 9 SCSS file, không phù hợp brand sage-on-cream, thiếu QA bandwidth duy trì 2 theme.
- **Vấn đề 2 (migration debt):** 6 migrations (`initial`, `nutrition-units`, `finalization`, `meal-tag`, `seed-artifact`, `gram-only`) là evolution history nội bộ pre-release. Vì chưa có user public, mỗi migration chỉ chạy cho dev và emulator của team — vô nghĩa carry forward.

---

## 2. Impact Analysis

### Code

| Area | File | Action |
|---|---|---|
| Theme service | `src/app/core/services/theme/theme-service.ts` | `ThemeMode = 'light'` (deprecated). `apply()` always light. |
| Theme spec | `src/app/core/services/theme/theme-service.spec.ts` | Drop dark/system tests; keep 1 always-light. |
| User profile model | `src/app/core/models/user-profile.model.ts` | `theme: 'light'`. |
| Settings page HTML | `src/app/features/settings/settings.page.html` | Drop GIAO DIỆN `<ion-radio-group>`. |
| Settings page TS | `src/app/features/settings/settings.page.ts` | Drop `setTheme()` handler. |
| Settings spec | `src/app/features/settings/settings.page.spec.ts` | Drop 3 dark assertions; +1 absent-section test. |
| Global CSS | `src/global.scss` | Drop `@use './theme/dark-mode'`, `@include dark-root`, `prefers-color-scheme` block. |
| Variables | `src/theme/variables.scss` | Drop `@use './dark-mode'`, `@include dark-root` block. |
| 5 theme partials | `src/theme/{list-card,segment-control,form-modal,form-field,header-elevation}.scss` | Drop `@use './dark-mode'` + all `@include dark-root` blocks. |
| Onboarding | `src/app/features/onboarding/onboarding.page.scss` | Drop 3 dark blocks. |
| Bottom-sheet | `src/app/shared/components/bottom-sheet-picker/bottom-sheet-picker.scss` | Drop dark block + prefers-color-scheme. |
| Dark-mode mixin | `src/theme/_dark-mode.scss` | **DELETE FILE.** |

### Database — Collapse Migrations (B)

| File | Action |
|---|---|
| `src/app/core/services/database/schema.ts` | **Rewrite:** Keep only ONE `buildInitialSchemaMigration()` containing FINAL schema (gộp kết quả 6 migrations cũ). Drop `buildNutritionUnitsMigration`, `buildNutritionSchemaFinalizationMigration`, `buildMealTagMigration`, `buildSeedArtifactMigration`, `buildGramOnlyRevisionMigration`. `SCHEMA_VERSION = 1`. |
| `src/app/core/services/database/migrations.ts` | `MIGRATION_REGISTRY = [buildInitialSchemaMigration()]`. Drop 5 imports. |
| `src/app/core/services/database/migrations.spec.ts` | Rewrite: assert single migration v1; drop "ascending order" check (trivial 1 element). |
| `src/app/core/services/database/legacy-sqljs-migrator.ts` | **DELETE FILE.** Pre-release không có user pre-Phase-1. |
| `src/app/core/services/database/legacy-sqljs-migrator.spec.ts` | **DELETE FILE.** |
| `src/app/core/services/database/database.provider.ts` | Drop `LegacySqlJsMigrator` import + `runWithFallback` block (line 45-48). |
| `src/app/core/services/database/database.provider.spec.ts` | Drop legacy migration test if any. |
| `src/app/core/services/database/native-database.migration.spec.ts` | Verify still asserts schema apply OK với v1 only. |
| `src/app/core/services/database/schema.spec.ts` | Update assertions để chỉ check FINAL schema (drop intermediate state checks). |
| `src/app/core/services/database/schema-compatibility.spec.ts` | Update — `user_version=0 → migrate to 1`; drop multi-version case. |

**Final schema in `buildInitialSchemaMigration()`** chứa:
- `users` table (theme `CHECK (theme IN ('light'))` + DEFAULT `'light'`).
- `meals` final shape (post-meal-tag migration).
- `dishes` final (post-gram-only revision: 100g canonical, no per_serving columns).
- `seed_artifacts` (from seed-artifact migration).
- `nutrition_units` final (post-finalization).
- All indexes + triggers.

**Dev impact:**
- Mọi dev/emulator có DB cũ → **phải wipe** trước pull v0.2.1.
- Commit message + dev-checklist note: `adb shell pm clear com.healthmate.ai` hoặc `npm run db:reset` (nếu có).
- Document trong `docs/5-development/development-plan.md` Phase 2.1 row.

### Tests baseline

- Drop tests: ~6 dark + ~10-15 multi-migration (legacy + intermediate states).
- Add tests: 2-3 (always-light, single-migration, absent-GIAO-DIỆN).
- Target: 426 → ~410 PASS (giảm ~16, không regression).

### Docs (canonical)

| File | Action |
|---|---|
| `docs/3-design/design-system.md` | Drop §6 Dark Mode Elevation, §9.2 Dark Mode, §10.2 Dark Typo. Drop "Dark Mode" cột palette tables (4). Update §1 Principles (drop "Dark mode first"). Bump rev 1.5. |
| `docs/3-design/data-model.md` | `theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light'))`. Note "Phase 2.1: dark/system removed". |
| `docs/3-design/explorations/README.md` | Note dark sections legacy. |
| `docs/3-design/mockups/phase-0-onboarding.html` | Drop `setTheme('dark')` button. |
| `docs/5-development/development-plan.md` | Story 2.3 → ⚠️ REVERTED in 2.6. New row Phase 2.1 v0.2.1. Note "Migrations collapsed v1-v6 → v1 (pre-release housekeeping)". |
| `docs/5-development/deferred-items.md` | Dark mode → permanent N/A. |
| `docs/3-design/explorations/{typography,spacing,color-palette}.html` | Banner "ARCHIVED — dark mode removed 2026-05-08". |

### BMAD artifacts

| File | Action |
|---|---|
| `_bmad-output/planning-artifacts/epic-2-settings-polish.md` | Add 2026-05-08 Addendum: F-13.3 reduced to light-only + migration collapse note. |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | `2-3: ready-for-review-REVERTED`. New `2-6-remove-dark-mode-collapse-migrations: ready-for-dev`. |
| `_bmad-output/implementation-artifacts/2-6-remove-dark-mode.md` | **NEW** story spec (xem §4). |
| Existing 2-1 / settings-uiux-audit | Strike dark QA; no further changes. |

### Build / Release

- `package.json`: `0.2.0 → 0.2.1`.
- `android/app/build.gradle`: versionCode `2 → 3`, versionName `"0.2.1"`.
- 6 CI guards giữ nguyên.
- Postsync idempotent (không đổi).

---

## 3. Recommended Approach

**Light-only + collapse migrations** — single Story 2.6 ship v0.2.1.

- Effort: **0.75d dev + 0.25d docs**.
- Risk: **Low-Medium** (medium do collapse migration đụng schema; mitigate bằng dev-wipe checklist + spec test verify final schema khớp expected DDL).
- Net code reduction: ~700 LOC (5 migration helpers + legacy migrator + dark CSS blocks).

---

## 4. Story 2.6 Spec — Remove Dark Mode + Collapse Migrations

```
Story:   2.6 Remove dark mode + collapse migrations (Phase 2.1 hotfix)
Status:  ✅ DONE (2026-05-08, commits c49f4b5 + fcc7dd4)
Owner:   Amelia
Epic:    2 (Settings & Polish) — Addendum
Effort:  0.75d dev + 0.25d docs
Version: 0.2.0 → 0.2.1, schema_version 6 → 1 (collapsed)

Acceptance Criteria (13):
  AC1   Settings hub không còn section "GIAO DIỆN".
  AC2   ThemeService.apply() chỉ chấp nhận 'light'.
  AC3   schema.ts: SCHEMA_VERSION=1; chỉ còn buildInitialSchemaMigration().
  AC4   migrations.ts: MIGRATION_REGISTRY chỉ chứa 1 migration.
  AC5   legacy-sqljs-migrator.ts + spec đã xóa; database.provider không còn
        reference LegacySqlJsMigrator.
  AC6   Final schema in v1 chứa: users (theme CHECK 'light'), meals (post-tag),
        dishes (gram-only), seed_artifacts, nutrition_units (finalized), indexes.
  AC7   9 SCSS file không còn @include dark-root; _dark-mode.scss đã xóa.
  AC8   global.scss + bottom-sheet-picker.scss không còn prefers-color-scheme.
  AC9   Tests pass: ≥410 PASS (sau drop 16 + add 3).
  AC10  6 CI guards PASS.
  AC11  Build prod + cap sync + assembleDebug success.
  AC12  Emulator force OS dark mode (`adb shell cmd uimode night yes`) → app vẫn light.
  AC13  Docs canonical + 3 BMAD artifacts updated; commit message có dev-wipe note.

Out-of-scope:
  - Drop column users.theme (giữ column='light' for forward flex).
  - Xóa ThemeService toàn bộ (deprecate marker only).
  - Xóa exploration HTML dark sections (banner archived only).
```

---

## 5. Implementation Plan (10 phases — sequential, 1 commit / phase)

| # | Phase | File/action | Verify |
|---|---|---|---|
| 1 | **Schema collapse** | Rewrite `schema.ts`: keep only `buildInitialSchemaMigration()` containing final DDL (gộp 6 lần evolve). `SCHEMA_VERSION=1`. Update `users.theme` CHECK → 'light' only. | tsc clean |
| 2 | **Migrations registry collapse** | `migrations.ts`: registry = [buildInitialSchemaMigration()]. Update `migrations.spec.ts`. | `npm test -- migrations` |
| 3 | **Drop legacy migrator** | Delete `legacy-sqljs-migrator.ts` + spec. Update `database.provider.ts` + spec. | `npm test -- database.provider` |
| 4 | **Update schema specs** | `schema.spec.ts`, `schema-compatibility.spec.ts`, `native-database.migration.spec.ts` — assert v1 final state only. | `npm test -- database` |
| 5 | **TS narrow theme** | theme-service.ts narrow 'light'; user-profile.model 'light'; settings.page.ts drop setTheme. | tsc + theme spec PASS |
| 6 | **HTML strip + SCSS strip dark-root** | Drop GIAO DIỆN block + 9 SCSS `@include dark-root`. | grep `@include dark-root` = 0 |
| 7 | **SCSS strip prefers-color-scheme + delete _dark-mode.scss** | Clean global + bottom-sheet; delete file. | grep `prefers-color-scheme` = 0 |
| 8 | **Settings spec update** | settings.page.spec.ts drop dark; add absent-section test. Run full suite. | `npm test --watch=false` ≥410 PASS |
| 9 | **Guards + build + version + APK + emulator QA** | 6/6 guards, ng build, version bump, cap sync, install, screenshot 4 màn light, force-dark test. | All pass + 5 screenshots `docs/6-testing/screenshots/story-2.6/` |
| 10 | **Docs sync (Paige)** | Update 5 canonical docs + 3 BMAD artifacts. Final commit + tag v0.2.1. | manual review |

---

## 6. Critical Detail: Final Schema Content

`buildInitialSchemaMigration()` v1 phải chứa state CUỐI sau khi 6 migrations cũ chạy xong. Em sẽ:

1. Spin up clean DB (wipe), chạy 6 migrations cũ → dump schema.
2. Diff schema dump vs current `buildInitialSchemaMigration()` từ migration v1.
3. Merge tất cả delta vào single DDL block.
4. Add unit test: apply v1 → schema khớp expected (snapshot test).

Hoặc đơn giản hơn: dùng `sqlite3 emulator-db.sqlite ".schema"` từ máy emulator có app v0.2.0 đang chạy.

---

## 7. Open Questions (default vẫn giữ từ rev 1)

1. **PRD F-13.3:** addendum BMAD only (default). PRD chính thức chờ Phase 3 revision.
2. **HTML mockups exploration dark sections:** banner archived (default), không xóa.
3. **MỚI: ThemeService có nên xóa luôn?** Default: deprecate marker only — giữ vì có thể tương lai bật theme hệ thống lại (nhưng `ThemeMode = 'light'` chặn dark).

---

## 8. Implementation Handoff

- **Recipient:** Amelia (Phases 1-9), Paige (Phase 10).
- **Coordinator:** John (PM) verify version policy + changelog.
- **Success criteria:** 6 guards + ≥410 tests + APK v0.2.1 force-dark = light + 5 docs + 3 BMAD updated + tag v0.2.1.

---

**Ready for execution. Anh OK 3 default §7 thì em bật Amelia chạy Phase 1.**
