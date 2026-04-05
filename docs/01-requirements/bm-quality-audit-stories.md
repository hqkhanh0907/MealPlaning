# 📋 BM Deliverable: Quality Audit — User Stories, Business Rules & Edge Cases

> **Project**: MealPlaning  
> **Sprint**: Quality Audit Sprint  
> **BM**: Business Manager  
> **Status**: LOGIC*NGHIỆP_VỤ*ĐÃ_CHỐT  
> **Date**: 2025-07-14

---

## 📊 CEO FINDINGS VERIFICATION — Discrepancies Detected

| CEO Claim                                        | BM Verification                                                            | Status       |
| ------------------------------------------------ | -------------------------------------------------------------------------- | ------------ |
| `usePageStackBackHandler.ts` — 47.36% stmts      | **WRONG FILE NAME** → Actual: `useTabHistoryBackHandler.ts` — 47.37% stmts | ⚠️ Corrected |
| `DishEditModal.tsx` — 55.86% stmts               | **STALE DATA** → Current: **98.59%** stmts (already improved)              | ⚠️ Corrected |
| `PlanSubstitutionSubTab.tsx` — 65.21% stmts      | **FILE DOES NOT EXIST** → Closest: `NutritionSubTab.tsx` at 100%           | ❌ Removed   |
| `OnboardingGoalStep.tsx` — 81.39% stmts          | **WRONG FILE NAME** → Actual: `NutritionGoalStep.tsx` — 81.40% stmts       | ⚠️ Corrected |
| `PlanTemplateGallery.tsx` — 85.26% stmts         | ✅ Confirmed: 85.26% stmts, 76.47% branch                                  | ✅ Verified  |
| `App.tsx` — 91.97% stmts                         | ✅ Confirmed: 91.97% stmts, 82.10% branch                                  | ✅ Verified  |
| `DatabaseContext.tsx` — 88.63% stmts             | ✅ Confirmed: 88.64% stmts, 77.27% branch                                  | ✅ Verified  |
| Zustand .filter() without useShallow — 3 getters | **NOT CONFIRMED** → All .filter() selectors use useShallow correctly       | ❌ Removed   |
| i18n hardcoded Vietnamese in GroceryList.tsx     | ✅ Confirmed + **BM FOUND 3 MORE FILES** with 60+ hardcoded strings        | ⚠️ Expanded  |
| Build chunk 501kB > 500kB limit                  | ✅ Confirmed: index chunk = 501.15kB                                       | ✅ Verified  |
| fitnessStore.ts 1,418 lines monolith             | ✅ Confirmed: exactly 1,418 lines                                          | ✅ Verified  |
| tsconfig.json missing coverage/ exclude          | ✅ Confirmed: exclude only has `["e2e"]`                                   | ✅ Verified  |
| Dynamic/static import conflicts — 5 files        | ✅ Confirmed: DatabaseContext, databaseService, AuthContext, haptics.ts    | ✅ Verified  |

### BM-Discovered Issues (NOT in CEO report)

| Issue                                                                      | Severity    | Details                                                                                                                                              |
| -------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **useTabHistoryBackHandler.ts** at 47.37%                                  | P0-CRITICAL | CEO confused with usePageStackBackHandler (already 100%)                                                                                             |
| **8 additional files below 97%** coverage                                  | P1-HIGH     | CycleWeeksStep, PeriodizationStep, TrainingDetailSteps, SplitChanger, ExerciseAssignmentSheet, useNutritionTargets, WorkoutLogger, HealthProfileForm |
| **60+ hardcoded Vietnamese strings** in useInsightEngine.ts + constants.ts | P1-HIGH     | 20 TIPS_POOL + 20 DAILY_TIPS_VI + insight messages                                                                                                   |
| **PlanTemplateGallery.tsx** hardcoded SPLIT_GROUP_LABELS                   | P1-HIGH     | 5 Vietnamese labels not in i18n                                                                                                                      |
| **2 unhandled async errors** in AuthContext.tsx                            | P2-MEDIUM   | `void loadGISScript()` and `void init()` lines 200, 204                                                                                              |
| **2 react-hooks/exhaustive-deps** warnings                                 | P2-MEDIUM   | HealthProfileForm.tsx handleSave not wrapped in useCallback                                                                                          |
| **6 react-refresh warnings**                                               | P3-LOW      | Files export both components and constants                                                                                                           |

---

## 🎯 USER STORIES

### WAVE 1: Fix Quality Gate (P0 — CRITICAL)

---

#### US-01: Fix TypeScript Lint Gate Breakage

**As a** developer  
**I want** `npm run lint` to produce 0 errors  
**So that** the quality gate is not falsely broken by phantom errors

**Priority**: P0-CRITICAL | **Impact**: HIGH  
**Effort**: XS (1 line change)

**Acceptance Criteria (MEASURABLE)**:
| # | Criterion | Measurement |
|---|-----------|-------------|
| AC-01.1 | `tsc --noEmit` returns exit code 0 | 0 errors (currently 3) |
| AC-01.2 | `coverage/` directory excluded from TS compilation | `tsconfig.json` → `exclude: ["e2e", "coverage"]` |
| AC-01.3 | No regression — existing type checks still pass | All src/ files compile cleanly |

**Business Rules**:

- BR-01: tsconfig.json `exclude` MUST include all non-source directories that contain .js files
- BR-02: Quality gate (`npm run lint`) MUST return exit code 0 at all times

**Edge Cases**:

- EC-01.1: `dist/` directory also has JS files — verify it's excluded by default (it is, via `rootDir`)
- EC-01.2: Adding `coverage/` to exclude must NOT exclude `src/__tests__/` coverage utilities
- EC-01.3: If vitest generates coverage to a different path (e.g., `coverage-report/`), the exclude must handle that too

**Backward Trace**: CEO P0 Finding #2 → tsconfig.json missing coverage/ in exclude

---

### WAVE 2: Coverage Critical Files — Below 90% (P0 — CRITICAL)

---

#### US-02: Bring useTabHistoryBackHandler.ts to 100% Coverage

**As a** developer  
**I want** `useTabHistoryBackHandler.ts` to have 100% statement + branch + function coverage  
**So that** the back navigation logic on Android is verified and regression-proof

**Priority**: P0-CRITICAL | **Impact**: HIGH  
**Effort**: M (hook with 19 statements, 6 branches)

**Current State**:
| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Statements | 47.37% (9/19) | 100% | 10 uncovered |
| Branches | 50.00% (3/6) | 100% | 3 uncovered |
| Functions | 75.00% | 100% | 1 uncovered |
| Lines | 44.44% | 100% | ~10 uncovered |

**Acceptance Criteria**:
| # | Criterion | Measurement |
|---|-----------|-------------|
| AC-02.1 | Statement coverage = 100% | 19/19 statements |
| AC-02.2 | Branch coverage = 100% | 6/6 branches |
| AC-02.3 | Function coverage = 100% | All functions |
| AC-02.4 | Tests cover: initial subscription, back event handling, cleanup on unmount | 3+ test cases |
| AC-02.5 | No regression in existing tests | `npm run test` = 0 failures |

**Edge Cases**:

- EC-02.1: Back handler called when page stack is empty — should not crash
- EC-02.2: Multiple rapid back presses — debounce/ignore behavior
- EC-02.3: Back handler during navigation transition — race condition

**Backward Trace**: CEO P0 Finding #1 (corrected file name)

---

#### US-03: Bring NutritionGoalStep.tsx to 100% Coverage

**As a** developer  
**I want** `NutritionGoalStep.tsx` (onboarding goal selection) to have 100% coverage  
**So that** all goal selection paths and edge cases are verified

**Priority**: P0-CRITICAL | **Impact**: HIGH  
**Effort**: M (43 statements, 34 branches)

**Current State**:
| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Statements | 81.40% (35/43) | 100% | 8 uncovered |
| Branches | 67.65% (23/34) | 100% | 11 uncovered |

**Acceptance Criteria**:
| # | Criterion | Measurement |
|---|-----------|-------------|
| AC-03.1 | Statement coverage = 100% | 43/43 |
| AC-03.2 | Branch coverage = 100% | 34/34 |
| AC-03.3 | Tests cover all 3 goal types: cut, maintain, bulk | 3 test scenarios |
| AC-03.4 | Tests cover all rate options per goal type | conservative/moderate/aggressive |
| AC-03.5 | Tests cover auto-select default rate behavior | Verify moderate is default |

**Edge Cases**:

- EC-03.1: Switching goal type resets rate selection — verify UI updates
- EC-03.2: "Maintain" goal has no rate sub-options — verify rate UI hidden
- EC-03.3: Invalid combination (e.g., maintain + aggressive) — impossible but test guard

**Backward Trace**: CEO P0 Finding #1 (corrected file name from OnboardingGoalStep)

---

#### US-04: Bring PlanTemplateGallery.tsx to 100% Coverage

**As a** developer  
**I want** `PlanTemplateGallery.tsx` to have 100% coverage  
**So that** training plan template browsing and selection is fully tested

**Priority**: P0-CRITICAL | **Impact**: HIGH  
**Effort**: L (95 statements, 34 branches, 23 functions)

**Current State**:
| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Statements | 85.26% (81/95) | 100% | 14 uncovered |
| Branches | 76.47% (26/34) | 100% | 8 uncovered |
| Functions | 86.95% (20/23) | 100% | 3 uncovered |

**Acceptance Criteria**:
| # | Criterion | Measurement |
|---|-----------|-------------|
| AC-04.1 | Statement coverage = 100% | 95/95 |
| AC-04.2 | Branch coverage = 100% | 34/34 |
| AC-04.3 | Function coverage = 100% | 23/23 |
| AC-04.4 | Tests cover all split types (full_body, upper_lower, ppl, bro_split, custom) | 5 template renders |
| AC-04.5 | Tests cover template selection and preview | User interaction flow |

**Edge Cases**:

- EC-04.1: Empty template gallery (0 templates) — verify empty state
- EC-04.2: Template with missing/null fields — defensive rendering
- EC-04.3: Template selection while another is loading — race condition

**Backward Trace**: CEO P0 Finding #1

---

#### US-05: Bring DatabaseContext.tsx to 100% Coverage

**As a** developer  
**I want** `DatabaseContext.tsx` to have 100% coverage  
**So that** database initialization, migration, and error handling paths are verified

**Priority**: P0-CRITICAL | **Impact**: HIGH  
**Effort**: M (44 statements, 22 branches)

**Current State**:
| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Statements | 88.64% (39/44) | 100% | 5 uncovered |
| Branches | 77.27% (17/22) | 100% | 5 uncovered |
| Functions | 85.71% | 100% | 1 uncovered |

**Acceptance Criteria**:
| # | Criterion | Measurement |
|---|-----------|-------------|
| AC-05.1 | Statement coverage = 100% | 44/44 |
| AC-05.2 | Branch coverage = 100% | 22/22 |
| AC-05.3 | Tests cover: init success, init failure, migration success, migration failure | 4+ test cases |
| AC-05.4 | Tests cover: native vs web platform detection | 2 platform scenarios |
| AC-05.5 | Tests cover: dynamic import paths (static+dynamic conflict resolution) | Import failure path |

**Edge Cases**:

- EC-05.1: Database init fails (WASM load failure) — verify error state shown to user
- EC-05.2: Schema migration partially succeeds then fails — transaction rollback
- EC-05.3: Multiple simultaneous init calls — singleton guard
- EC-05.4: Dynamic import of schema module fails — graceful degradation

**Backward Trace**: CEO P0 Finding #1

---

#### US-06: Bring App.tsx to 100% Coverage

**As a** developer  
**I want** `App.tsx` to have 100% statement and branch coverage  
**So that** the root component's conditional rendering and provider wiring is fully tested

**Priority**: P1-HIGH | **Impact**: MEDIUM  
**Effort**: M (complex component, 735 lines)

**Current State**:
| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Statements | 91.97% | 100% | ~6 uncovered |
| Branches | 82.10% | 100% | ~14 uncovered |
| Functions | 88.23% | 100% | ~2 uncovered |

**Acceptance Criteria**:
| # | Criterion | Measurement |
|---|-----------|-------------|
| AC-06.1 | Statement coverage = 100% | All statements |
| AC-06.2 | Branch coverage = 100% | All branches (lines 130, 134, 406, 442) |
| AC-06.3 | Tests cover: onboarding vs main app conditional | 2 render paths |
| AC-06.4 | Tests cover: page stack overlay rendering | pushPage/popPage |
| AC-06.5 | Tests cover: tab navigation (5 tabs) | Tab switching |

**Edge Cases**:

- EC-06.1: App renders with no database context — loading/error state
- EC-06.2: Page stack overflow (depth > 2) — max depth guard
- EC-06.3: Rapid tab switching — no double render

**Backward Trace**: CEO P0 Finding #1

---

### WAVE 3: Coverage Secondary Files — 85-97% → 100% (P1 — HIGH)

---

#### US-07: Bring Remaining Sub-100% Files to 100%

**As a** developer  
**I want** ALL files to reach 100% statement + branch coverage  
**So that** the project maintains its 100% coverage target with zero gaps

**Priority**: P1-HIGH | **Impact**: MEDIUM  
**Effort**: XL (multiple files, ~30+ uncovered branches total)

**Files Requiring Coverage Improvement** (sorted by gap size):

| File                        | Stmts   | Branch  | Funcs   | Gap Analysis                 |
| --------------------------- | ------- | ------- | ------- | ---------------------------- |
| CycleWeeksStep.tsx          | 85.71%  | 100%    | 75%     | 1 stmt, 1 func uncovered     |
| PeriodizationStep.tsx       | 85.71%  | 100%    | 75%     | 1 stmt, 1 func uncovered     |
| TrainingDetailSteps.tsx     | 89.47%  | 86.36%  | 100%    | 2 stmts, 3 branches          |
| ExerciseAssignmentSheet.tsx | 92.59%  | 88.23%  | 85.71%  | 4 stmts, 4 branches, 1 func  |
| SplitChanger.tsx            | 93.88%  | 91.67%  | 86.66%  | 3 stmts, 3 branches, 2 funcs |
| useNutritionTargets.ts      | 96.00%  | 73.68%  | 100%    | 1 stmt, **10 branches**      |
| WorkoutLogger.tsx           | 97.22%  | 85.29%  | 97.40%  | 6 stmts, **20 branches**     |
| HealthProfileForm.tsx       | 96.42%  | 88.09%  | 100%    | 2 stmts, 10 branches         |
| DishEditModal.tsx           | 98.59%  | 88.68%  | 98.24%  | 3 stmts, 18 branches         |
| Additional files 97-99%     | Various | Various | Various | See vitest output            |

**Acceptance Criteria**:
| # | Criterion | Measurement |
|---|-----------|-------------|
| AC-07.1 | ALL files in coverage report = 100% statements | `npx vitest run --coverage` |
| AC-07.2 | ALL files in coverage report = 100% branches | Including all conditional paths |
| AC-07.3 | ALL files in coverage report = 100% functions | No uncovered functions |
| AC-07.4 | Zero new test failures | Existing tests pass |
| AC-07.5 | Tests are meaningful (not just coverage padding) | Review for assert quality |

**Edge Cases**:

- EC-07.1: Some branches are platform-specific (Capacitor native) — may need mocking strategy
- EC-07.2: Error paths in WorkoutLogger (save failure) — need mock error injection
- EC-07.3: useNutritionTargets branch gaps (73.68%) — likely NaN/edge-case guards, must test stale data scenarios
- EC-07.4: Adding tests may reveal actual bugs — if so, log as separate bugs, fix, then continue

**Backward Trace**: CEO P0 Finding #1 + P2 Finding #6

---

### WAVE 4: Performance & Code Quality (P1-P2)

---

#### US-08: Reduce Main Chunk Below 500kB

**As a** developer  
**I want** the main index chunk to be under 500kB  
**So that** Vite build produces zero warnings and initial load is optimized

**Priority**: P1-HIGH | **Impact**: MEDIUM  
**Effort**: M

**Current State**: `index-zvuCj5d_.js` = 501.15 kB (1.15kB over limit)

**Acceptance Criteria**:
| # | Criterion | Measurement |
|---|-----------|-------------|
| AC-08.1 | `npm run build` produces 0 warnings about chunk size | Build output clean |
| AC-08.2 | Main chunk ≤ 500kB after minification | Verify with `ls -la dist/assets/index-*.js` |
| AC-08.3 | No new chunks created that are >500kB | All chunks under limit |
| AC-08.4 | Existing lazy loading still works | Tab navigation, modals |

**Proposed Solutions** (BM ranked):

1. **Extract heavy components to lazy chunks** — Move GroceryList, DishManager (both 500+ lines) to dynamic imports
2. **Adjust manualChunks** — Add another vendor chunk for @capacitor modules
3. **Raise chunkSizeWarningLimit** — Last resort, not recommended

**Edge Cases**:

- EC-08.1: Code splitting may break existing React.lazy patterns — verify all lazy boundaries
- EC-08.2: New chunk may be loaded on critical path — measure actual load time impact
- EC-08.3: Tree shaking may not work if new chunks import large transitive deps

**Backward Trace**: CEO P1 Finding #3

---

#### US-09: Extract i18n Hardcoded Vietnamese Strings

**As a** developer  
**I want** all user-facing Vietnamese strings to use the i18n `t()` function  
**So that** the app is i18n-ready and consistent with the localization architecture

**Priority**: P1-HIGH | **Impact**: MEDIUM  
**Effort**: L (60+ strings across 4 files)

**Current Hardcoded Strings Inventory**:

| File                                                  | Count    | Type                                                                           |
| ----------------------------------------------------- | -------- | ------------------------------------------------------------------------------ |
| `features/dashboard/hooks/useInsightEngine.ts`        | ~30      | TIPS_POOL titles/messages + insight titles/messages/actionLabels               |
| `features/dashboard/constants.ts`                     | 20       | DAILY_TIPS_VI array                                                            |
| `features/fitness/components/PlanTemplateGallery.tsx` | 5        | SPLIT_GROUP_LABELS record                                                      |
| `components/GroceryList.tsx`                          | 4 arrays | PROTEIN_KEYWORDS_VI, DAIRY_KEYWORDS_VI, GRAIN_KEYWORDS_VI, PRODUCE_KEYWORDS_VI |
| `App.tsx`                                             | 1        | `aria-label="Cài đặt"`                                                         |
| `features/dashboard/components/ProteinProgress.tsx`   | 1        | aria-label with Vietnamese "trên"                                              |

**Total**: ~60+ hardcoded Vietnamese strings

**Acceptance Criteria**:
| # | Criterion | Measurement |
|---|-----------|-------------|
| AC-09.1 | All TIPS_POOL entries use `t()` keys | grep for quoted Vietnamese in useInsightEngine.ts = 0 |
| AC-09.2 | All DAILY_TIPS_VI entries use `t()` keys | grep for quoted Vietnamese in constants.ts = 0 |
| AC-09.3 | SPLIT_GROUP_LABELS use `t()` keys | 5 new i18n keys in vi.json |
| AC-09.4 | GroceryList keyword arrays extracted to constants | No inline Vietnamese strings |
| AC-09.5 | All aria-labels use `t()` | Accessibility labels localized |
| AC-09.6 | All new keys exist in `src/locales/vi.json` | Keys verified |
| AC-09.7 | No functional regression | All existing tests pass |

**Edge Cases**:

- EC-09.1: Template literal strings with variable interpolation (useInsightEngine) — need i18n interpolation syntax `t('key', { var })`
- EC-09.2: Keyword arrays (GroceryList) used for matching logic, not display — moving to i18n may break categorization if translation changes
- EC-09.3: Dynamic i18n keys (e.g., `t(\`tip.${index}\`)`) — ensure ALL index values have entries in vi.json

**Backward Trace**: CEO P2 Finding #7 (BM expanded scope)

---

#### US-10: Fix ESLint Warnings to Zero

**As a** developer  
**I want** `npx eslint src/` to produce 0 warnings  
**So that** the codebase is completely clean and developer experience is optimal

**Priority**: P2-MEDIUM | **Impact**: LOW  
**Effort**: S (8 warnings)

**Current Warnings**:
| # | File | Warning | Fix |
|---|------|---------|-----|
| 1-6 | Various | `react-refresh/only-export-components` | Extract constants to separate files |
| 7 | HealthProfileForm.tsx:131 | `react-hooks/exhaustive-deps` — handleSave | Wrap in useCallback |
| 8 | HealthProfileForm.tsx:212 | `react-hooks/exhaustive-deps` — handleSave | Wrap in useCallback |

**Acceptance Criteria**:
| # | Criterion | Measurement |
|---|-----------|-------------|
| AC-10.1 | `npx eslint src/` = 0 warnings, 0 errors | Exit code 0, "0 problems" |
| AC-10.2 | No `eslint-disable` added | grep eslint-disable src/ = 0 |
| AC-10.3 | No behavioral regression | All tests pass |

**Edge Cases**:

- EC-10.1: Moving constants to separate files may change import paths — verify no broken imports
- EC-10.2: Wrapping handleSave in useCallback may change dependency behavior — test thoroughly
- EC-10.3: useCallback with stale closure — ensure all dependencies are in dep array

**Backward Trace**: BM-discovered (ESLint warnings)

---

#### US-11: Resolve Dynamic/Static Import Conflicts

**As a** developer  
**I want** each module to use EITHER static OR dynamic import consistently  
**So that** Vite bundling is predictable and no duplicate module instances exist

**Priority**: P2-MEDIUM | **Impact**: MEDIUM  
**Effort**: M

**Conflicting Files**:
| File | Static Import | Dynamic Import | Resolution |
|------|---------------|----------------|------------|
| DatabaseContext.tsx | `import { createSchema }` | `await import('../services/schema')` | Consolidate to static |
| databaseService.ts | N/A | `await import('./schema')` | OK (intentional lazy) |
| AuthContext.tsx | `import { Capacitor }` | `await import('@capgo/capacitor-social-login')` | OK (conditional native) |
| haptics.ts | `import type { ImpactStyle }` | `await import('@capacitor/haptics')` | Consolidate — type import + dynamic is problematic |

**Acceptance Criteria**:
| # | Criterion | Measurement |
|---|-----------|-------------|
| AC-11.1 | DatabaseContext.tsx uses only static imports for schema | No `await import('./schema')` |
| AC-11.2 | haptics.ts uses consistent import strategy | Either all static or all dynamic |
| AC-11.3 | `npm run build` shows no duplicate chunk warnings | Clean build output |
| AC-11.4 | Bundle size does not increase > 5kB | Compare before/after |

**Edge Cases**:

- EC-11.1: Changing dynamic → static may pull module into main chunk, increasing size
- EC-11.2: haptics.ts dynamic import is intentional (Capacitor not available on web) — need platform check
- EC-11.3: AuthContext social login import MUST stay dynamic (native-only module)

**Backward Trace**: CEO P1 Finding #3

---

### WAVE 5: Validation & Quality Gate Enforcement

---

#### US-12: SonarQube Clean Scan

**As a** developer  
**I want** SonarQube scan to produce 0 issues (bugs, vulnerabilities, code smells)  
**So that** the codebase meets enterprise quality standards

**Priority**: P1-HIGH | **Impact**: HIGH  
**Effort**: Variable (depends on issues found)

**Acceptance Criteria**:
| # | Criterion | Measurement |
|---|-----------|-------------|
| AC-12.1 | `npm run sonar` completes successfully | Exit code 0 |
| AC-12.2 | SonarQube dashboard: 0 Bugs | API: `types=BUG&resolved=false` → total=0 |
| AC-12.3 | SonarQube dashboard: 0 Vulnerabilities | API: `types=VULNERABILITY&resolved=false` → total=0 |
| AC-12.4 | SonarQube dashboard: 0 Code Smells | API: `types=CODE_SMELL&resolved=false` → total=0 |
| AC-12.5 | Coverage report uploaded to SonarQube | lcov.info parsed correctly |

**Edge Cases**:

- EC-12.1: SonarQube may flag issues in generated/third-party code — configure exclusions
- EC-12.2: Some "code smells" may be false positives (e.g., cognitive complexity in data files) — use `sonar.issue.ignore`
- EC-12.3: fitnessStore.ts (1,418 lines) will likely trigger cognitive complexity — mark as known, fix in refactor sprint

**Backward Trace**: Mandatory process rule (QUY TẮC #2)

---

## 📏 BUSINESS RULES

### Quality Gate Rules

| ID           | Rule                                                  | Enforcement      | Violation Response |
| ------------ | ----------------------------------------------------- | ---------------- | ------------------ |
| **BR-QG-01** | `npm run lint` MUST return 0 errors AND 0 warnings    | Pre-commit hook  | Block commit       |
| **BR-QG-02** | `npm run test` MUST return 0 failures                 | Pre-commit hook  | Block commit       |
| **BR-QG-03** | Coverage MUST be 100% for ALL files in coverage scope | CI check         | Block merge        |
| **BR-QG-04** | `npm run build` MUST produce 0 warnings               | CI check         | Block merge        |
| **BR-QG-05** | `npm run sonar` MUST produce 0 issues                 | Pre-commit check | Block commit       |
| **BR-QG-06** | NO `eslint-disable` comments allowed                  | ESLint rule      | Lint failure       |
| **BR-QG-07** | NO `@ts-ignore` or `@ts-expect-error` allowed         | grep check       | Block merge        |

### Coverage Rules

| ID            | Rule                                                               | Measurement          |
| ------------- | ------------------------------------------------------------------ | -------------------- |
| **BR-COV-01** | New code MUST have 100% statement coverage                         | vitest --coverage    |
| **BR-COV-02** | New code MUST have 100% branch coverage                            | vitest --coverage    |
| **BR-COV-03** | New code MUST have 100% function coverage                          | vitest --coverage    |
| **BR-COV-04** | Coverage gaps found during audit MUST be filled before next sprint | Coverage report diff |
| **BR-COV-05** | Tests MUST be meaningful (assert behavior, not just execute lines) | Code review          |

### i18n Rules

| ID             | Rule                                                                         | Measurement                     |
| -------------- | ---------------------------------------------------------------------------- | ------------------------------- |
| **BR-I18N-01** | ALL user-facing strings MUST use `t()` function                              | grep for Vietnamese outside t() |
| **BR-I18N-02** | ALL `t()` keys MUST have entry in vi.json                                    | Script validation               |
| **BR-I18N-03** | Dynamic keys `t(\`prefix.${var}\`)` MUST have ALL possible values in vi.json | Exhaustive check                |
| **BR-I18N-04** | aria-labels MUST be localized                                                | Accessibility audit             |

### Code Quality Rules

| ID           | Rule                                                             | Measurement           |
| ------------ | ---------------------------------------------------------------- | --------------------- |
| **BR-CQ-01** | No file > 500 lines (except data files like exerciseDatabase.ts) | wc -l check           |
| **BR-CQ-02** | No monolithic store > 800 lines                                  | wc -l check on stores |
| **BR-CQ-03** | Async functions MUST handle errors (try/catch or .catch())       | grep + review         |
| **BR-CQ-04** | No `void promise()` without error handling                       | ESLint rule           |

---

## 📋 EXECUTION WAVES — Revised Order

| Wave       | Stories                    | Effort | Dependencies | Quality Gate                               |
| ---------- | -------------------------- | ------ | ------------ | ------------------------------------------ |
| **Wave 1** | US-01 (tsconfig fix)       | XS     | None         | `tsc --noEmit` = 0 errors                  |
| **Wave 2** | US-02, US-03, US-04, US-05 | L      | Wave 1       | All 4 files = 100% coverage                |
| **Wave 3** | US-06, US-07               | XL     | Wave 2       | ALL files = 100% coverage                  |
| **Wave 4** | US-08, US-09, US-10, US-11 | L      | Wave 3       | Build clean, i18n clean, ESLint 0 warnings |
| **Wave 5** | US-12                      | M      | Wave 4       | SonarQube 0 issues                         |

### Wave Acceptance Gates

| Wave | Gate               | Exact Command                      | Expected Output       |
| ---- | ------------------ | ---------------------------------- | --------------------- |
| 1    | TSC Clean          | `npx tsc --noEmit`                 | Exit 0, 0 errors      |
| 2    | Critical Coverage  | `npx vitest run --coverage`        | 4 target files = 100% |
| 3    | Full Coverage      | `npx vitest run --coverage`        | ALL files = 100%      |
| 4    | Build + Lint Clean | `npm run build && npx eslint src/` | 0 warnings each       |
| 5    | Sonar Clean        | `npm run sonar` → API check        | 0 issues              |

---

## ⚠️ RISK ASSESSMENT

| Risk                                          | Probability | Impact | Mitigation                                                   |
| --------------------------------------------- | ----------- | ------ | ------------------------------------------------------------ |
| Adding tests reveals actual bugs              | HIGH        | HIGH   | Log as separate bugs, fix in same wave, re-test              |
| Branch coverage tests require complex mocking | MEDIUM      | MEDIUM | Use existing test patterns, check **tests**/ for examples    |
| i18n extraction breaks interpolation          | LOW         | HIGH   | Test each string individually before bulk merge              |
| Chunk splitting changes load order            | LOW         | MEDIUM | Profile before/after with build analyze                      |
| SonarQube false positives in fitnessStore.ts  | HIGH        | LOW    | Use sonar.issue.ignore, document exclusion rationale         |
| Coverage tests slow down test suite           | MEDIUM      | LOW    | Measure test runtime before/after, optimize if >10% increase |

---

## 📊 METRICS DASHBOARD

### Current State (Baseline — 2025-07-14)

| Metric               | Current  | Target | Gap                            |
| -------------------- | -------- | ------ | ------------------------------ |
| TSC Errors           | 3        | 0      | -3                             |
| ESLint Errors        | 0        | 0      | ✅                             |
| ESLint Warnings      | 8        | 0      | -8                             |
| Files < 100% Stmts   | ~40      | 0      | -40                            |
| Files < 100% Branch  | ~60      | 0      | -60                            |
| Build Warnings       | 1        | 0      | -1                             |
| Main Chunk Size      | 501.15kB | <500kB | -1.15kB                        |
| Hardcoded Vietnamese | ~60      | 0      | -60                            |
| SonarQube Issues     | TBD      | 0      | TBD                            |
| fitnessStore.ts LOC  | 1,418    | <800   | Not in scope (refactor sprint) |

### Target State (Post-Audit)

| Metric               | Target |
| -------------------- | ------ |
| TSC Errors           | 0      |
| ESLint Warnings      | 0      |
| ALL Coverage Metrics | 100%   |
| Build Warnings       | 0      |
| Hardcoded Vietnamese | 0      |
| SonarQube Issues     | 0      |

---

**Status: LOGIC*NGHIỆP_VỤ*ĐÃ_CHỐT** ✅

> BM has verified all CEO findings, corrected 3 file name errors, removed 2 non-existent files,
> expanded i18n scope from 1 file to 6 files (~60 strings), and removed false Zustand .filter()
> finding. 12 User Stories defined with measurable acceptance criteria, business rules, and edge cases.
> Ready for Designer/Tech Leader phase.
