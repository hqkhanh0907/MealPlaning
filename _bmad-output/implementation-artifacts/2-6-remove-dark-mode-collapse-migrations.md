# Story 2.6: Remove dark mode + collapse migrations (pre-release housekeeping)

Status: done

> **Backfill note (2026-05-08):** Story file này được backfill *sau khi* code đã ship (commits `c49f4b5`, `fcc7dd4`, `126b860`) để khôi phục traceability theo BMAD convention. Source-of-truth ban đầu là `_bmad-output/planning-artifacts/sprint-change-proposal-2026-05-08-remove-dark-mode.md`. Story này KHÔNG phải re-derived plan — chỉ là acceptance record cho audit.

## Story

As a **product team pre-release HealthMate AI v0.2.1**,
I want **xoá hoàn toàn dark mode + collapse 6 migrations về 1 canonical schema v1**,
so that **brand sage-on-cream được canonical hoá, schema housekeeping xong trước khi public, giảm maintenance cost SCSS dual-theme + migration registry**.

## Trigger & Rationale

- **Trigger:** Quyết định 2026-05-08 — bỏ dark mode khỏi MealPlaning vì (a) không phù hợp brand sage-on-cream, (b) thiếu QA bandwidth duy trì 2 theme, (c) maintenance cost 9 SCSS file dark variants.
- **Cùng sprint window:** collapse 6 migrations (`initial`, `nutrition-units`, `finalization`, `meal-tag`, `seed-artifact`, `gram-only`) về v1 single schema vì pre-release không có user data → migration evolution là noise.
- **Approach:** 1A + B per sprint-change-proposal-2026-05-08.

## Acceptance Criteria (13/13 PASS)

1. **AC1 — `_dark-mode.scss` deleted.** File `src/theme/_dark-mode.scss` không còn tồn tại. ✅
2. **AC2 — `@use './dark-mode'` imports stripped.** 0 hit `@use.*dark-mode` trong `src/**/*.scss`. ✅ (9 imports removed)
3. **AC3 — `@include dark-root` blocks stripped.** 0 hit trong toàn repo. ✅ (12 blocks removed)
4. **AC4 — `prefers-color-scheme` blocks stripped.** 0 hit trong `src/**/*.scss`. ✅ (2 blocks removed)
5. **AC5 — Settings GIAO DIỆN section removed.** `<ion-radio-group>` cho theme không còn trong `settings.page.html`; `setTheme()` handler removed khỏi `settings.page.ts`. ✅
6. **AC6 — `Theme` service deprecated no-op shim.** `theme-service.ts` giữ class export để preserve call sites nhưng `apply()` always-light, `ThemeMode = 'light'` literal. ✅
7. **AC7 — `UserProfile.theme` literal `'light'`.** Type narrowed; spec assert always-light. ✅
8. **AC8 — Schema CHECK constraint.** `users.theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light'))` trong `schema.ts`. ✅
9. **AC9 — Migrations collapsed to v1.** `MIGRATION_REGISTRY = [buildInitialSchemaMigration()]`, `SCHEMA_VERSION = 1`. 5 helper builders + 5 imports removed. ✅
10. **AC10 — Legacy sql.js migrator deleted.** `legacy-sqljs-migrator.ts` + `.spec.ts` removed; `database.provider.ts` drops `runWithFallback` block. ✅
11. **AC11 — Tests pass.** 418/418 PASS (426 baseline − 14 legacy migrator − 6 collapse intermediate-state + 12 new always-light/single-migration/absent-GIAO-DIỆN tests). ✅
12. **AC12 — Guards + build.** 6/6 CI guards PASS, `ng build` + `npx cap sync android` + `cd android && ./gradlew assembleDebug` produce APK. ✅
13. **AC13 — Force-night-mode QA.** APK install emulator-5554, `adb shell cmd uimode night yes` → app stays light (cream `#FBF7F0` background, sage `#7A9E7E` accents). 4 PNG evidence ở `.qa-evidence/2026-05-08-story-2.6/`. ✅

## Tasks / Subtasks (all done — see commits)

- [x] **Task 1 — Database collapse** (Phase 1-4) → commit `c49f4b5`
  - [x] Rewrite `schema.ts` thành single `buildInitialSchemaMigration()` chứa final schema từ 6 migrations cũ (gộp users + meals + dishes + seed_artifacts + nutrition_units + indexes/triggers).
  - [x] `migrations.ts`: registry = [initial only]; drop 5 imports.
  - [x] Delete `legacy-sqljs-migrator.{ts,spec.ts}`; strip `runWithFallback` ở `database.provider.ts`.
  - [x] Update specs `migrations.spec.ts`, `schema.spec.ts`, `schema-compatibility.spec.ts`, `database.provider.spec.ts`.
- [x] **Task 2 — Remove dark mode SCSS** (Phase 5) → commit `fcc7dd4`
  - [x] DELETE `src/theme/_dark-mode.scss`.
  - [x] Strip 9 `@use './dark-mode'` imports trong `variables.scss` + 5 partials + onboarding/bottom-sheet.
  - [x] Strip 12 `@include dark-root { ... }` blocks.
  - [x] Strip 2 `@media (prefers-color-scheme: dark)` blocks (`global.scss`, `bottom-sheet-picker.scss`).
- [x] **Task 3 — Remove dark mode TS/HTML** (Phase 6-7) → commit `fcc7dd4`
  - [x] `theme-service.ts`: `ThemeMode = 'light'`; `apply()` always light; mark `@deprecated` shim.
  - [x] `user-profile.model.ts`: narrow `theme: 'light'`.
  - [x] `settings.page.{html,ts}`: drop GIAO DIỆN radio group + `setTheme()`.
  - [x] Update specs.
- [x] **Task 4 — Version bump** (Phase 8) → commit `fcc7dd4`
  - [x] `package.json` 0.2.0 → 0.2.1; `android/app/build.gradle` versionCode 2 → 3.
- [x] **Task 5 — Docs sync** (Phase 9) → commit `126b860`
  - [x] Addendum banners cho 5 canonical docs (design-system, dev-plan, data-model, architecture, deferred-items) + 2 BMAD docs.
  - [x] Mark Story 2.3 superseded trong epic-2 revisionNote.
  - [x] Mark D1 done trong deferred-items.md.

> **Note (2026-05-08 retro per investigation report):** Addendum banner approach là patch triệu chứng — body docs vẫn dạy dark mode. Story G2 trong investigation plan sẽ rewrite body inline.

## Dev Notes

- **Pre-release wipe required:** sau pull v0.2.1, mọi dev/emulator phải `adb shell pm clear com.healthmate.ai` (DB schema không backwards-compat — gram-only revision, meal-tag finalization, etc. đã collapse).
- **No data loss risk:** confirmed pre-release, không có production user.
- **Theme service kept as shim:** quyết định không xoá class để tránh breaking changes ở call sites (template injection, page constructors). Sẽ removed hoàn toàn ở major refactor sau.

## Change Log

| Rev | Date | Note |
|---|---|---|
| 1.0 | 2026-05-08 | Backfill story file post-ship for BMAD traceability (commits `c49f4b5`, `fcc7dd4`, `126b860`, tag `v0.2.1`). |

## Dev Agent Record

- **Agent:** Amelia (dev) + Hermes Agent
- **Branch:** `main` (direct commits, pre-release housekeeping)
- **Commits:** `c49f4b5` (Phase 1-4 DB), `fcc7dd4` (Phase 5-9 SCSS/TS/HTML/version), `126b860` (Phase 9 docs)
- **Tag:** `v0.2.1` (pushed origin 2026-05-08)
- **Tests:** 418/418 PASS
- **Guards:** 6/6 PASS
- **QA Evidence:** `.qa-evidence/2026-05-08-story-2.6/0[1-4]-*.png` (4 PNG, force-night-mode confirms light-only)
