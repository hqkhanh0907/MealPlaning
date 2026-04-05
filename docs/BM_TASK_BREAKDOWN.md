# BM Task Breakdown — Audit Toàn Project MealPlaning

> **Author**: BM (Business Manager)
> **Date**: 2025-07-17
> **CEO Source**: 22 Issues (3 Critical, 7 High, 8 Medium, 4 Low)
> **BM Result**: 13 Confirmed, 9 False Positives
> **Critic Review**: Applied — H3 downgraded to FP, M3 downgraded to Low, H5 reclassified as DRY-only, M8 reopened

---

## Verified Issues (14 Confirmed)

---

### [C3] GroceryList — O(n²) `.find()` Lookups in `buildGroceryList`

- **File**: `src/components/GroceryList.tsx:97-141`
- **Root Cause**: `buildGroceryList()` (line 117-127) iterates over `dishIngredients` and calls `allIngredients.find()` inside the loop — O(p × q). Similarly `collectDishIngredients()` (line 99-106) calls `allDishes.find()` inside loop — O(n × m).
- **Impact**: CodeSmell/Performance — Severity: **High**
  - Typical: 42 dish slots × 500 ingredients = 21,000 comparisons per build
  - Worst: 84 slots × 500 = 42,000 comparisons
- **Proposed Fix**: Pre-build `Map` lookups before the loops:

  ```typescript
  // In collectDishIngredients — line 99
  const dishMap = new Map(allDishes.map(d => [d.id, d]));
  for (const dishId of dishIds) {
    const dish = dishMap.get(dishId); // O(1) instead of O(m)
    ...
  }

  // In buildGroceryList — line 117
  const ingredientMap = new Map(allIngredients.map(i => [i.id, i]));
  for (const di of dishIngredients) {
    const ing = ingredientMap.get(di.ingredientId); // O(1) instead of O(q)
    ...
  }
  ```

- **Tests Needed**: `src/__tests__/groceryList.test.ts` — verify correctness with Map refactor, add perf benchmark with 500+ ingredients
- **Estimated Complexity**: Small (10-15 lines changed)

---

### [H1a] HealthProfileForm — Stale Closure (Missing useEffect Dependencies)

- **File**: `src/features/health-profile/components/HealthProfileForm.tsx:220-224`
- **Root Cause**: `useEffect` assigns `saveRef.current = handleSave` but has **no dependency array** — runs every render, violating React Hook best practices. While functionally it works (runs every render = always latest), it's wasteful and inconsistent with GoalPhaseSelector which does it correctly.
- **Impact**: CodeSmell — Severity: **Medium**
- **Proposed Fix**: Add dependency array `[saveRef, handleSave]` to match GoalPhaseSelector pattern (line 211):
  ```typescript
  useEffect(() => {
    if (saveRef) {
      saveRef.current = handleSave;
    }
  }, [saveRef, handleSave]); // ← ADD dependencies
  ```
- **Tests Needed**: Existing tests should continue passing. No new test needed.
- **Estimated Complexity**: Small (1 line)

---

### [H1b] TrainingProfileForm — Stale Closure (Missing useEffect Dependencies)

- **File**: `src/features/fitness/components/TrainingProfileForm.tsx:139-143`
- **Root Cause**: Same pattern as H1a — `useEffect` without dependency array.
- **Impact**: CodeSmell — Severity: **Medium**
- **Proposed Fix**: Add `[saveRef, handleSave]` dependency array.
- **Tests Needed**: Existing tests should continue passing.
- **Estimated Complexity**: Small (1 line)

---

### [H2] useAutoSync — Download Has No Concurrent Guard

- **File**: `src/hooks/useAutoSync.ts:69-83`
- **Root Cause**: `triggerUpload` has `isUploadingRef.current` guard (line 54), but `triggerDownload` has **no** `isDownloadingRef` guard. Multiple concurrent downloads are theoretically possible. More importantly, upload can proceed while download is in progress (different refs).
- **Impact**: Flow Issue — Severity: **Medium**
  - Mitigated by: `syncStatus` state prevents typical UI re-triggers
  - Risk: Programmatic calls or rapid button clicks could trigger overlapping operations
- **Proposed Fix**: Add `isDownloadingRef` guard to `triggerDownload`, and add cross-check in both:

  ```typescript
  const isDownloadingRef = useRef(false);

  const triggerDownload = useCallback(async () => {
    if (!accessToken || isDownloadingRef.current || isUploadingRef.current) return;
    isDownloadingRef.current = true;
    // ... existing code ...
    finally { isDownloadingRef.current = false; }
  }, [...]);

  // Also add to triggerUpload:
  if (!accessToken || isUploadingRef.current || isDownloadingRef.current) return;
  ```

- **Tests Needed**: `src/__tests__/useAutoSync.test.ts` — test concurrent download prevention, test upload blocked during download
- **Estimated Complexity**: Small (5-8 lines)

---

### ~~[H3] storeLoader — appOnboardingStore Not Reloaded After Backup Download~~

> **DOWNGRADED TO FALSE POSITIVE after Critic Review**
>
> `appOnboardingStore` uses `zustand/persist` (localStorage), NOT SQLite. Backup export/import (`exportToJSON`/`importFromJSON`) only serializes SQLite tables. Therefore `reloadAllStores()` correctly only reloads SQLite-backed stores. Onboarding state is preserved locally via localStorage — this is **expected behavior**, not a bug.

---

### [H4] Console Outside Logger — 3 Violations

- **File 1**: `src/features/fitness/components/WorkoutLogger.tsx:382`
  - Code: `console.error('[WorkoutLogger] Save failed, draft preserved:', error);`
  - Fix: Replace with `logger.error('[WorkoutLogger] Save failed, draft preserved:', error);`
- **File 2**: `src/services/geminiService.ts:78,80`
  - Code: `console.warn(\`[GeminiService] ${label} FAILED — elapsed: ${elapsed}ms\`);`
  - Code: `console.warn(\`[GeminiService] ${label} slow call: ${elapsed}ms\`);`
  - Fix: Replace with `logger.warn(...)` — import logger from `@/utils/logger`
- **Root Cause**: Dev oversight — these files didn't import the project logger utility.
- **Impact**: CodeSmell — Severity: **Low** (violates convention, no functional impact)
- **Proposed Fix**: Replace `console.error/warn` with `logger.error/warn` in both files.
- **Tests Needed**: Update any test mocking `console.error/warn` to mock `logger` instead.
- **Estimated Complexity**: Small (3 lines changed + 1 import per file)

---

### [H5] Zustand Selector Duplication — 8 Identical `.find()` Selectors _(Reclassified: DRY issue, NOT perf)_

- **Files & Lines**:
  1. `src/components/nutrition/EnergyDetailSheet.tsx:35` — `useDayPlanStore(s => s.dayPlans.find(...))`
  2. `src/features/fitness/components/PlanGeneratedCard.tsx:10` — `useFitnessStore(s => s.trainingPlans.find(...))`
  3. `src/features/dashboard/hooks/useTodaysPlan.ts:127` — `useFitnessStore(s => s.trainingPlans.find(...))`
  4. `src/features/dashboard/hooks/useDailyScore.ts:64` — `useFitnessStore(s => s.trainingPlans.find(...))`
  5. `src/features/dashboard/components/StreakMini.tsx:23` — `useFitnessStore(s => s.trainingPlans.find(...))`
  6. `src/features/fitness/components/StreakCounter.tsx:27` — `useFitnessStore(s => s.trainingPlans.find(...))`
  7. `src/features/fitness/components/MilestonesList.tsx:12` — `useFitnessStore(s => s.trainingPlans.find(...))`
  8. `src/features/fitness/components/PlanScheduleEditor.tsx:27` — `useFitnessStore(useCallback(s => s.trainingPlans.find(...), [planId]))`
- **Root Cause**: 6 of 8 use the **identical** selector `s.trainingPlans.find(p => p.status === 'active')` — copy-pasted logic across files.
- **Impact**: CodeSmell (DRY violation) — Severity: **Low**
  - **NOT a perf issue**: `.find()` returns the same object reference if the found item hasn't changed, so Zustand's `Object.is` comparison works correctly. No unnecessary re-renders.
  - The real issue is **maintenance burden**: changing the active plan criteria requires updating 6 files.
- **Proposed Fix**: Create shared selectors in `src/store/selectors/fitnessSelectors.ts`:
  ```typescript
  export const selectActivePlan = (s: FitnessState) => s.trainingPlans.find(p => p.status === 'active');
  // Usage: const activePlan = useFitnessStore(selectActivePlan);
  ```
- **Tests Needed**: No new tests — behavior unchanged, just DRY refactor.
- **Estimated Complexity**: Medium (create selector file + update 8 files)

---

### [H6] usePageStackBackHandler — Branch Coverage Gap (Misreported)

- **File**: `src/hooks/usePageStackBackHandler.ts:34`
- **Root Cause**: CEO reported 47% coverage — **actual is 87.5%** (7/8 branches). The uncovered branch is `if (delta > 0)` false path at line 34, which is **logically unreachable** given the guards `curr < prev && pushedCountRef.current > 0` guarantee `delta > 0`.
- **Impact**: CodeSmell — Severity: **Low** (dead code path, not a coverage gap)
- **Proposed Fix**: Simplify by removing the redundant `if (delta > 0)` guard since it's always true:
  ```typescript
  } else if (curr < prev && pushedCountRef.current > 0) {
    const delta = Math.min(prev - curr, pushedCountRef.current);
    // delta is guaranteed > 0 by guards above
    pushedCountRef.current -= delta;
    removeBackEntries(delta);
  }
  ```
- **Tests Needed**: Existing tests sufficient. Branch coverage becomes 100% after removing dead condition.
- **Estimated Complexity**: Small (remove 2 lines of wrapping)

---

### [M1] Silent `.catch(() => {})` — 12 Occurrences

- **Files & Lines** (12 total, excluding test files):
  1. `src/services/migrationService.ts:67` — PRAGMA foreign_keys
  2. `src/contexts/AuthContext.tsx:25` — setSetting auth
  3. `src/contexts/AuthContext.tsx:27` — deleteSetting auth
  4. `src/contexts/DatabaseContext.tsx:70` — service.close()
  5. `src/hooks/useDarkMode.ts:43` — getSetting theme
  6. `src/hooks/useDarkMode.ts:49` — setSetting theme
  7. `src/hooks/useAutoSync.ts:45` — getSetting last_sync_at
  8. `src/hooks/useAutoSync.ts:50` — setSetting last_sync_at
  9. `src/components/GoogleDriveSync.tsx:32` — getSetting last_sync_at
  10. `src/components/GoogleDriveSync.tsx:49` — deleteSetting
  11. `src/components/GoogleDriveSync.tsx:56` — setSetting last_sync_at
  12. `src/components/DataBackup.tsx:140` — setSetting last_local_backup_at
- **Root Cause**: Settings operations (non-critical) intentionally swallow errors to avoid crashing the app. But NO logging means failures are completely invisible.
- **Impact**: CodeSmell — Severity: **Medium**
  - No user-facing bug, but debugging issues becomes impossible
  - Pattern: all 12 are `appSettings` persistence — non-critical but important for UX consistency
- **Proposed Fix**: Replace `.catch(() => {})` with `.catch(e => logger.warn('...', e))` in all 12 locations. Except `DatabaseContext.tsx:70` (`.close()`) which can stay silent as it's cleanup.
- **Tests Needed**: Update mocks to verify `logger.warn` called on rejection.
- **Estimated Complexity**: Small (12 one-line changes)

---

### [M2] nutrition.ts — NaN Guard Missing for amount/multiplier

- **File**: `src/utils/nutrition.ts:43-57,90`
- **Root Cause**:
  - Line 43: `calculateIngredientNutrition(ingredient, amount)` — if `amount` is `NaN`, `undefined`, or negative, all output becomes `NaN`.
  - Line 90: `const multiplier = servings?.[dishId] ?? 1` — if servings value is `NaN`, it bypasses `?? 1` (NaN is not nullish) and corrupts totals.
- **Impact**: Bug (User-Facing) — Severity: **High**
  - NaN silently propagates through entire nutrition calculation chain
  - Dashboard, Calendar, Fitness all display "NaN" or blank values
- **Proposed Fix**:

  ```typescript
  // Line 43: Guard at function entry
  export const calculateIngredientNutrition = (ingredient: Ingredient, amount: number): NutritionInfo => {
    if (!Number.isFinite(amount) || amount < 0) return { ...ZERO_NUTRITION };
    // ... existing code
  };

  // Line 90: Guard multiplier
  const multiplier = Number.isFinite(servings?.[dishId]) ? servings![dishId] : 1;
  ```

- **Tests Needed**: `src/__tests__/nutrition.test.ts` — add cases: amount=NaN, amount=undefined, amount=-1, multiplier=NaN
- **Estimated Complexity**: Small (4-6 lines)

---

### [M3] schema.ts — Migration v5 Not Wrapped in Transaction _(Downgraded after Critic Review)_

- **File**: `src/services/schema.ts:501-507`
- **Root Cause**: Migration v4→v5 runs statements without transaction. However, the migration is **self-healing**: the `PRAGMA table_info` + `if (!cols.some(...))` check makes the `ALTER TABLE` idempotent. If a crash happens between `ALTER TABLE` and `PRAGMA user_version = 5`, next startup detects the column exists, skips the ADD, and sets version to 5. **No data corruption occurs.**
- **Impact**: CodeSmell — Severity: **Low** _(downgraded from Critical)_
  - Compare: v5→v6 migration correctly uses `db.transaction()` — inconsistent patterns
  - Self-healing behavior means this is a code quality issue, not a data integrity risk
- **Proposed Fix**: Wrap in transaction for consistency with v6 migration pattern (best practice, but not urgent):
  ```typescript
  if (currentVersion < 5) {
    await db.transaction(async () => {
      const cols = await db.query<{ name: string }>("PRAGMA table_info('training_plans')");
      if (!cols.some(c => c.name === 'current_week')) {
        await db.execute('ALTER TABLE training_plans ADD COLUMN current_week INTEGER DEFAULT 1');
      }
      await db.execute('PRAGMA user_version = 5');
    });
  }
  ```
- **Tests Needed**: `src/__tests__/schema.test.ts` — test migration when column already exists (version 4, column present → runs → version becomes 5, no error)
- **Estimated Complexity**: Small (wrap 5 lines in transaction)

---

### [M4] PlanTemplateGallery — Template Save Fail Shows No Feedback

- **File**: `src/features/fitness/components/PlanTemplateGallery.tsx:175-187`
- **Root Cause**: `handleConfirmSave()` has empty `catch {}` block (lines 182-184). When save fails, spinner stops, dialog stays open, but user gets **no error notification**. User may think save succeeded.
- **Impact**: Bug (User-Facing) — Severity: **High**
  - Silent data loss: user's template name entered but not saved
  - Inconsistent with rest of codebase (GoogleDriveSync shows toast on error)
- **Proposed Fix**:
  ```typescript
  } catch {
    showNotification(t('fitness.templateGallery.saveError'), 'error');
  }
  ```
  Add i18n key: `fitness.templateGallery.saveError: "Lưu template thất bại. Vui lòng thử lại."`
- **Tests Needed**: `src/__tests__/planTemplateGallery.test.ts` — test error path shows notification
- **Estimated Complexity**: Small (2-3 lines + 1 i18n key)

---

### [M7] useDailyScore — Hardcoded Vietnamese Strings

- **File**: `src/features/dashboard/hooks/useDailyScore.ts:38-42`
- **Root Cause**: `getGreeting(hour)` function returns hardcoded Vietnamese:
  ```typescript
  if (hour < 12) return 'Chào buổi sáng!';
  if (hour < 18) return 'Chào buổi chiều!';
  return 'Chào buổi tối!';
  ```
  Project convention requires all UI text to use `t('key')` from i18next.
- **Impact**: CodeSmell — Severity: **Medium** (violates i18n convention)
- **Proposed Fix**: Add keys to `vi.json` and use `t()`:
  ```json
  "dashboard.greetingMorning": "Chào buổi sáng!",
  "dashboard.greetingAfternoon": "Chào buổi chiều!",
  "dashboard.greetingEvening": "Chào buổi tối!"
  ```
  Refactor: pass `t` function or return key instead of string.
- **Tests Needed**: `src/__tests__/useDailyScore.test.ts` — verify greeting keys returned correctly
- **Estimated Complexity**: Small (6-8 lines + 3 i18n keys)

---

### [H7] Multiple Files — Branch Coverage <100%

- **Scope**: 114 of 228 files (50%) have incomplete branch coverage
- **Worst offenders**:
  | File | Branch % | Branches |
  |------|----------|----------|
  | `src/pages/GoalDetailPage.tsx` | 17.9% | 5/28 |
  | `src/features/goal/TrainingConfirmStep.tsx` | 50.0% | 12/24 |
  | `src/components/SettingsDetailLayout.tsx` | 50.0% | 5/10 |
  | `src/services/backNavigationService.ts` | 55.6% | 10/18 |
  | `src/features/goal/HealthConfirmStep.tsx` | 57.9% | 22/38 |
  | `src/services/databaseService.ts` | 65.2% | 43/66 |
- **Impact**: Quality Gap — Severity: **High** (project requires 100% coverage)
- **Proposed Fix**: Write tests for uncovered branches in priority order: databaseService → backNavigationService → GoalDetailPage → SettingsDetailLayout
- **Tests Needed**: Multiple test files — see Wave 2 execution plan below
- **Estimated Complexity**: Large (100+ lines of tests across multiple files)

---

### [L1] Unused `gender_other` Key in vi.json

- **File**: `src/locales/vi.json:1397`
- **Root Cause**: Key `"gender_other": "Khác"` exists but no `t('gender', { count })` or `t('gender_other')` call found in codebase. The `lastBackupDays_*` plural keys ARE used correctly.
- **Impact**: CodeSmell — Severity: **Low**
- **Proposed Fix**: Remove `gender_other` key from vi.json, or wire it up if third gender option is planned.
- **Tests Needed**: None.
- **Estimated Complexity**: Small (delete 1 line)

---

### [M8] TrainingProfileDetailPage — Low Branch Coverage _(Reopened after Critic Review)_

- **File**: `src/components/settings/TrainingProfileDetailPage.tsx` (59 lines)
- **Root Cause**: Component has 6 distinct code paths (edit/view × 3 states: has-profile, no-profile, saving). Parent `SettingsTab` tests **mock** this component rather than exercising it, so branches are not actually tested.
- **Impact**: Quality Gap — Severity: **Medium**
  - Untested paths: edit mode toggle, empty state rendering, save callback execution, cancel callback
- **Proposed Fix**: Write dedicated unit test for the component's branches.
- **Tests Needed**: `src/__tests__/trainingProfileDetailPage.test.ts` — test edit/view toggle, empty state, save success/failure
- **Estimated Complexity**: Medium (30-50 lines of tests)

---

## False Positives (9 — CEO Nhầm hoặc BM Đánh Giá Lại)

---

### [C1] migrationService.ts:212 — Migration Flag Set Before Transaction

**Reason**: Flag is set on line 212 which is **AFTER** `await db.transaction(...)` completes on line 210. The transaction is fully awaited before the flag is set. This is the **correct** pattern. CEO likely misread the code structure.

### [C2] vite.config.ts — Missing manualChunks

**Reason**: `manualChunks` IS properly configured at `vite.config.ts:38-55`. Four chunk groups defined: `vendor-react` (188KB), `vendor-ui` (147KB), `vendor-i18n` (47KB), `onboarding-advanced` (175KB). Main bundle at 489KB is reasonable for app complexity. CEO likely checked an older version of the config.

### [H1c] GoalPhaseSelector — Stale Closure

**Reason**: GoalPhaseSelector.tsx **already has correct dependencies** at line 211: `useEffect(() => { saveRef.current = handleSave; }, [saveRef, handleSave])`. CEO grouped 3 files but only 2 have the issue (HealthProfileForm + TrainingProfileForm). GoalPhaseSelector is already fixed.

### [H3] storeLoader — appOnboardingStore Not Reloaded _(Downgraded from Confirmed)_

**Reason**: `appOnboardingStore` uses `zustand/persist` (localStorage), NOT SQLite. Backup export/import (`exportToJSON`/`importFromJSON` in `databaseService.ts`) only serializes SQLite tables. Therefore `reloadAllStores()` correctly only reloads SQLite-backed stores. Onboarding state is preserved locally — this is expected behavior, not a bug.

### [M5] GroceryList/DishManager/IngredientManager — No Virtualization

**Reason**: Dataset sizes are well below virtualization threshold:

- Grocery list: 20-80 items per view
- Dish library: 100-300 personal dishes max
- Ingredient list: filtered/searched, typically <50 visible
  Virtualization adds complexity (react-window/react-virtuoso dependency, accessibility issues, scroll behavior changes) without measurable benefit at these scales. Would be premature optimization.

### [M6] DishEditModal.tsx:126-137 — 4 filter + 1 sort Unoptimized

**Reason**: All filter and sort operations are **already wrapped in `useMemo()`** at line 126. They only recompute when `allIngredients`, `selectedIngredientIds`, `ingredientSearch`, `lang`, or `ingredientFrequency` change. CEO likely missed the `useMemo` wrapper.

### [L2] Scroll Position Dead Code in navigationStore

**Reason**: `setScrollPosition` and `getScrollPosition` exist in the store AND have dedicated tests in `navigationStore.test.ts` and `crossFeature.test.ts`. They are tested, maintained feature code — likely for upcoming scroll restoration feature. Not dead code.

### [L3] Barrel File 0% Coverage

**Reason**: Barrel files (`index.ts`) are pure re-exports with no executable logic. `vitest.config.ts` explicitly excludes `src/components/navigation/index.ts`. 0% coverage on barrel files is industry-standard and expected. No action needed.

---

## Wave Execution Plan

---

### Wave 1: High Priority — User-Facing Bugs & Data Safety

> **Goal**: Fix issues that cause user-visible errors or silent data loss
> **Estimated effort**: 1-2 hours

| #   | Task                                    | Issue   | File                                                       | Complexity |
| --- | --------------------------------------- | ------- | ---------------------------------------------------------- | ---------- |
| 1.1 | Add NaN guards to nutrition.ts          | M2      | `nutrition.ts:43-57,90`                                    | Small      |
| 1.2 | Add error notification to template save | M4      | `PlanTemplateGallery.tsx:175-187`                          | Small      |
| 1.3 | Add download concurrency guard          | H2      | `useAutoSync.ts:69-83`                                     | Small      |
| 1.4 | Add useEffect dependencies (2 files)    | H1a,H1b | `HealthProfileForm.tsx:220`, `TrainingProfileForm.tsx:139` | Small      |

**Quality Gates**:

- `npm run lint` → 0 errors
- `npm run test` → 0 failures, 100% coverage for changed files
- `npm run build` → clean build

---

### Wave 2: Coverage Gaps — Improve Branch Coverage

> **Goal**: Close the top branch coverage gaps (target: all files ≥80% branches)
> **Estimated effort**: 6-8 hours (coverage work is time-intensive)

| #   | Task                            | Issue | File                            | Current → Target |
| --- | ------------------------------- | ----- | ------------------------------- | ---------------- |
| 2.1 | GoalDetailPage tests            | H7    | `GoalDetailPage.tsx`            | 17.9% → 80%+     |
| 2.2 | backNavigationService tests     | H7    | `backNavigationService.ts`      | 55.6% → 90%+     |
| 2.3 | databaseService tests           | H7    | `databaseService.ts`            | 65.2% → 90%+     |
| 2.4 | SettingsDetailLayout tests      | H7    | `SettingsDetailLayout.tsx`      | 50.0% → 90%+     |
| 2.5 | HealthConfirmStep tests         | H7    | `HealthConfirmStep.tsx`         | 57.9% → 90%+     |
| 2.6 | TrainingConfirmStep tests       | H7    | `TrainingConfirmStep.tsx`       | 50.0% → 90%+     |
| 2.7 | TrainingProfileDetailPage tests | M8    | `TrainingProfileDetailPage.tsx` | ~45% → 90%+      |
| 2.8 | Remove dead branch in hook      | H6    | `usePageStackBackHandler.ts:34` | 87.5% → 100%     |

**Quality Gates**: Same as Wave 1 + coverage report shows improvement

---

### Wave 3: Performance

> **Goal**: Eliminate O(n²) lookups
> **Estimated effort**: 1 hour

| #   | Task                                    | Issue | File(s)                  | Complexity |
| --- | --------------------------------------- | ----- | ------------------------ | ---------- |
| 3.1 | Refactor GroceryList to use Map lookups | C3    | `GroceryList.tsx:97-141` | Small      |

**Quality Gates**: Same as Wave 1 + verify no behavior change in UI

---

### Wave 4: Code Quality Polish

> **Goal**: Fix convention violations, clean up warnings, improve observability
> **Estimated effort**: 2-3 hours

| #   | Task                                           | Issue | File(s)                                                       | Complexity |
| --- | ---------------------------------------------- | ----- | ------------------------------------------------------------- | ---------- |
| 4.1 | Replace 11 silent `.catch()` with logger.warn  | M1    | 6 files (12 occurrences)                                      | Small      |
| 4.2 | Replace console.error/warn with logger         | H4    | `WorkoutLogger.tsx:382`, `geminiService.ts:78,80`             | Small      |
| 4.3 | Move hardcoded Vietnamese to i18n              | M7    | `useDailyScore.ts:38-42` + `vi.json`                          | Small      |
| 4.4 | Remove unused `gender_other` key               | L1    | `vi.json:1397`                                                | Small      |
| 4.5 | Wrap migration v5 in transaction (consistency) | M3    | `schema.ts:501-507`                                           | Small      |
| 4.6 | Extract shared fitness selectors (DRY)         | H5    | New: `store/selectors/fitnessSelectors.ts` + 8 consumer files | Medium     |

**Quality Gates**: Same as Wave 1 + `npm run lint` verifies no-console rule

---

## Summary Statistics

| Category  | CEO Reported | BM Confirmed                              | False Positives                 |
| --------- | ------------ | ----------------------------------------- | ------------------------------- |
| Critical  | 3            | 1 (C3)                                    | 2 (C1, C2)                      |
| High      | 7            | 5 (H1a, H1b, H2, H4, H7) + H6 misreported | 2 (H1c, H3)                     |
| Medium    | 8            | 5 (M1, M2, M3↓Low, M4, M7) + M8 reopened  | 3 (M5, M6)                      |
| Low       | 4            | 1 (L1)                                    | 3 (L2, L3)                      |
| **Total** | **22**       | **13**                                    | **9 (41% false positive rate)** |

> **Critic corrections applied**: H3 → FP (localStorage not in backup), M3 severity Critical → Low (self-healing migration), H5 perf → DRY-only, M8 reopened (mock ≠ coverage)

### Risk Priority Matrix

| Severity  | Issues                                 | Risk                               |
| --------- | -------------------------------------- | ---------------------------------- |
| 🔴 High   | M2 (NaN), M4 (silent fail), C3 (O(n²)) | User-facing bugs, perf degradation |
| 🟡 Medium | H1a/b, H2, M1, M7, M8, H7              | Code quality, convention, coverage |
| 🟢 Low    | H4, H5, H6, M3, L1                     | Minor polish, DRY cleanup          |
