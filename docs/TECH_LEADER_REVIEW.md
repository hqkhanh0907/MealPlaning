# Tech Leader Review — Audit Toàn Project MealPlaning

> **Author**: Tech Leader
> **Date**: 2025-07-17
> **Source**: BM Task Breakdown (`docs/BM_TASK_BREAKDOWN.md`) + Independent Architecture Scan
> **Scope**: 13 BM issues + 7 newly discovered issues

---

## 1. BM Plan Review

### 1.1 Wave 1 Status: ✅ ALREADY LANDED

All 4 Wave 1 tasks were committed to `main` in `726ae02`:

| Task | BM Issue | Current Code Status |
|------|----------|-------------------|
| NaN guards in `nutrition.ts` | M2 | ✅ Line 44: `if (!Number.isFinite(amount) \|\| amount < 0)`, Line 93: `Number.isFinite(raw)` |
| Template save error notification | M4 | ✅ Line 185: `notify.error(t('fitness.templateGallery.saveError'))` |
| Download concurrency guard | H2 | ✅ Lines 55,71: both check `isDownloadingRef.current \|\| isUploadingRef.current` |
| useEffect dependency arrays | H1a,H1b | ✅ Both have `[saveRef, handleSave]` |

**Conclusion**: Wave 1 is complete. Dev should skip to Wave 2.

---

### 1.2 Approved Tasks (no changes needed)

| Issue | Verdict | Reason |
|-------|---------|--------|
| **[H4]** Console violations | ✅ Approved | 2 files (`geminiService.ts:78,80`, `WorkoutLogger.tsx:382`) confirmed. Replace with `logger.warn`/`logger.error`. |
| **[H6]** Dead branch in `usePageStackBackHandler` | ✅ Approved | Line 34 `if (delta > 0)` is indeed always true. Remove wrapping conditional. |
| **[M3]** Migration v5 not in transaction | ✅ Approved | Low priority but correct — wrap for consistency with v6 migration pattern. |
| **[M7]** Hardcoded Vietnamese in `useDailyScore` | ✅ Approved | Lines 38-42 return raw strings. Move to i18n. |
| **[L1]** Unused `gender_other` key | ✅ Approved | No callers found. Remove. |
| **[M8]** TrainingProfileDetailPage coverage | ✅ Approved | Parent tests mock this component; branches are untested. |
| **[H7]** Branch coverage gaps | ✅ Approved | 6 worst-offender files identified correctly. Priority order is reasonable. |

---

### 1.3 Modified Tasks (better approach recommended)

#### [C3] GroceryList — O(n²) `.find()` Lookups

**BM fix is correct but INCOMPLETE.** BM identified `buildGroceryList` (line 117) but the approach must also cover `collectDishIngredients` (line 99-106) which has the SAME `.find()` in loop pattern.

**Recommended approach** — fix BOTH functions in one pass:
```typescript
// collectDishIngredients — line 97
const collectDishIngredients = (dishIds: string[], allDishes: Dish[], lang: SupportedLang) => {
  const dishMap = new Map(allDishes.map(d => [d.id, d])); // O(m) once
  const result: IngredientWithSource[] = [];
  for (const dishId of dishIds) {
    const dish = dishMap.get(dishId); // O(1) per lookup
    if (dish) { /* ... */ }
  }
  return result;
};

// buildGroceryList — line 111
const buildGroceryList = (dishIngredients: IngredientWithSource[], allIngredients: Ingredient[], lang: SupportedLang) => {
  const ingredientMap = new Map(allIngredients.map(i => [i.id, i])); // O(q) once
  const map: Record<string, GroceryItemWithCategory> = {};
  for (const di of dishIngredients) {
    const ing = ingredientMap.get(di.ingredientId); // O(1) per lookup
    if (!ing) continue;
    /* ... existing aggregation logic ... */
  }
  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
};
```

**Additional note**: `usedInDishes.find()` on line 122 is also O(n) inside the loop, but max dishes per ingredient is typically ≤3 so not worth optimizing.

---

#### [H5] Zustand Selector Duplication — Naming Convention

BM fix is correct (extract shared selectors). **Additional recommendation**: Follow a naming convention for ALL shared selectors, not just `selectActivePlan`:

```typescript
// src/store/selectors/fitnessSelectors.ts
export const selectActivePlan = (s: FitnessState) =>
  s.trainingPlans.find(p => p.status === 'active');

export const selectActivePlanDays = (s: FitnessState) =>
  s.trainingPlanDays.filter(d => {
    const plan = s.trainingPlans.find(p => p.status === 'active');
    return plan && d.planId === plan.id;
  });

// src/store/selectors/dayPlanSelectors.ts
export const selectTodayDayPlan = (today: string) =>
  (s: DayPlanState) => s.dayPlans.find(dp => dp.date === today);
```

**Risk note**: Ensure `.find()` inside selectors is not called with `useShallow` — `.find()` returns the same reference if item hasn't changed, so `Object.is` comparison already works correctly.

---

#### [M1] Silent `.catch(() => {})` — Exclude 1 Occurrence

BM says 12 occurrences. **Correction**: Keep `DatabaseContext.tsx:70` (`.close()`) AND `migrationService.ts:338` (`PRAGMA foreign_keys`) silent — these are legitimate fire-and-forget patterns where logging adds noise. That leaves **10 occurrences** to add `logger.warn`.

| # | File | Line | Action |
|---|------|------|--------|
| 1 | `AuthContext.tsx` | 25 | → `logger.warn` |
| 2 | `AuthContext.tsx` | 27 | → `logger.warn` |
| 3 | `useDarkMode.ts` | 43 | → `logger.warn` |
| 4 | `useDarkMode.ts` | 49 | → `logger.warn` |
| 5 | `useAutoSync.ts` | 46 | → `logger.warn` |
| 6 | `useAutoSync.ts` | 51 | → `logger.warn` |
| 7 | `GoogleDriveSync.tsx` | 32 | → `logger.warn` |
| 8 | `GoogleDriveSync.tsx` | 49 | → `logger.warn` |
| 9 | `GoogleDriveSync.tsx` | 56 | → `logger.warn` |
| 10 | `DataBackup.tsx` | 140 | → `logger.warn` |

**Excluded (stay silent)**:
- `DatabaseContext.tsx:70` — cleanup `.close()` → silent is correct
- `migrationService.ts:338` — `PRAGMA foreign_keys` → platform limitation, not actionable

---

### 1.4 Rejected Tasks

> None. All BM-confirmed issues are valid and worth fixing.

---

## 2. Additional Issues Discovered

### [NEW-1] fitnessStore — Fire-and-Forget DB Transactions (No Rollback)

- **Severity**: ⚠️ MEDIUM (architectural consistency risk)
- **Files**: `src/store/fitnessStore.ts` — lines 422, 807-818, 920-936, 972-984, 1328-1341
- **Root Cause**: 5+ store actions update state via `set()` immediately, then fire `db.transaction(async () => {...}).catch(e => logger.error(...))` without `await`. If the DB transaction fails:
  - In-memory state already changed ✅
  - DB write lost ❌
  - No user notification ❌
  - No rollback mechanism ❌
- **Affected operations**:
  - `removePlanDaySession` — deletes training plan day
  - `updateTrainingDays` — changes training schedule
  - `autoAssignWorkouts` — bulk assign workouts to days
  - `restoreOriginalSchedule` — reset to original plan
  - `applyTemplate` — apply template to training plan
- **Risk assessment**: Higher risk for destructive operations (`removePlanDaySession`, `restoreOriginalSchedule`) where silent DB failure means data appears deleted in UI but persists in DB after restart.
- **Recommended fix**: For destructive operations, either:
  1. **Await the transaction** before updating state (safest, slight UX delay)
  2. **Queue writes via `dbWriteQueue`** (already exists in codebase — `src/store/helpers/dbWriteQueue.ts`) with retry
  3. **Add user-facing error toast** on `.catch()` so users know to retry
- **Tests needed**: Mock DB transaction failure → verify state rollback or error notification

---

### [NEW-2] dishStore — `persistDish()` Fire-and-Forget

- **Severity**: ⚠️ MEDIUM (same pattern as NEW-1)
- **File**: `src/store/dishStore.ts:26-44`
- **Root Cause**: `persistDish()` is a `void` function that calls `db.transaction()` without `await`. Callers `addDish` and `updateDish` fire-and-forget.
- **Note**: `deleteDish` uses separate `persistToDb()` calls, not `persistDish()` — but is also non-awaited.
- **Risk**: A dish edit that fails to persist silently reverts after app restart.
- **Recommended fix**: Same approach as NEW-1 — queue via `dbWriteQueue` or add error toast on `.catch()`.

---

### [NEW-3] fitnessStore — Unsafe Type Casting from DB Rows (50+ assertions)

- **Severity**: ⚠️ MEDIUM (fragile, works today but breaks on schema changes)
- **File**: `src/store/fitnessStore.ts:1047-1120`
- **Root Cause**: `initializeFromSQLite()` queries DB with `Record<string, unknown>` and casts every field:
  ```typescript
  const plans = await db.query<Record<string, unknown>>('SELECT * FROM training_plans ...');
  trainingPlans: plans.map(p => ({
    id: p.id as string,               // unsafe
    name: p.name as string,            // unsafe
    status: (p.status as TrainingPlan['status']) ?? 'active',  // unsafe
    splitType: p.splitType as SplitType,  // unsafe
    // ... 10+ more casts per entity type
  }));
  ```
  This pattern repeats for: training plans (14 casts), plan days (12 casts), workouts (8 casts), workout sets (14 casts), weight entries (4 casts).
- **Risk**: If a migration adds/removes/renames a column, all casts silently produce `undefined` instead of failing at compile time. This defeated the purpose of TypeScript.
- **Recommended fix** (medium-term): Create typed row interfaces per table:
  ```typescript
  interface TrainingPlanRow {
    id: string;
    name: string;
    status: string;
    split_type: string;
    // ... all snake_case DB columns
  }
  const plans = await db.query<TrainingPlanRow>('SELECT * FROM training_plans ...');
  // Now TypeScript catches missing fields at compile time
  ```
  The project already uses this pattern in other stores (e.g., `dishStore`, `ingredientStore`).
- **Tests needed**: None (refactor, not behavior change)

---

### [NEW-4] `syncOnLaunch()` — Silent Failure Hides Sync Issues

- **Severity**: 🟡 LOW-MEDIUM
- **File**: `src/hooks/useAutoSync.ts:93-109`
- **Root Cause**: `syncOnLaunch()` has a bare `catch {}` that silently swallows all errors. If Google Drive download fails (network error, token expiry, corrupt backup), the user has no indication their data is stale.
- **Current behavior**: Line 105-107: `catch { // Silently fail sync-on-launch }`
- **Recommended fix**: Add `logger.warn` in the catch block. Optionally show a subtle toast after 3 failed retries.

---

### [NEW-5] `as unknown as` Form Resolver Pattern (9 instances)

- **Severity**: 🟢 LOW (known React Hook Form / Zod integration quirk)
- **Files**: 9 form components use `zodResolver(schema) as unknown as Resolver<FormData>`
- **Root Cause**: Type mismatch between `@hookform/resolvers/zod` output type and React Hook Form's `Resolver` type. This is a widely-known issue ([GitHub issue](https://github.com/react-hook-form/resolvers/issues/624)).
- **Verdict**: **No action needed now.** Will be resolved when `@hookform/resolvers` publishes type-safe Zod integration. Monitor upstream.

---

### [NEW-6] Large Component Files (11 files > 300 lines)

- **Severity**: 🟢 LOW (maintainability, not a bug)
- **Worst offenders**:

| File | Lines | Recommendation |
|------|-------|---------------|
| `TrainingPlanView.tsx` | 800 | Extract `DaySelector`, `SessionDisplay`, `ScheduleEditor` |
| `WorkoutLogger.tsx` | 692 | Extract `SetEditor`, `ExerciseSelector` sub-components |
| `PlanDayEditor.tsx` | 502 | Extract form sections |
| `HealthProfileForm.tsx` | 498 | Extract health/nutrition sub-forms |
| `ProgressDashboard.tsx` | 496 | Extract chart components |

- **Verdict**: Track as tech debt. Refactor when touching these files for features/bugs.

---

### [NEW-7] `useTabHistoryBackHandler` — Direct `setState` Outside Action

- **Severity**: 🟢 LOW
- **File**: `src/hooks/useTabHistoryBackHandler.ts:30`
- **Code**: `useNavigationStore.setState({ tabHistory: history.slice(0, -1) })`
- **Root Cause**: Bypasses store action to directly mutate state. While functionally fine (Zustand allows this), it violates the convention of using store-defined actions.
- **Verdict**: Low priority. Refactor to use a store action when touching this file.

---

## 3. Wave Execution Guidance

### Wave 2: Coverage Gaps (6-8 hours)

**Execution order** (dependency-aware):

| Order | Task | Issue | Rationale |
|-------|------|-------|-----------|
| 1 | `databaseService.ts` tests | H7 | Foundation — other tests may need DB mocks |
| 2 | `backNavigationService.ts` tests | H7 | Used by multiple pages |
| 3 | `SettingsDetailLayout.tsx` tests | H7 | Prerequisite for training/health detail pages |
| 4 | `TrainingProfileDetailPage.tsx` tests | M8 | Depends on layout tests |
| 5 | `GoalDetailPage.tsx` tests | H7 | Complex multi-step flow |
| 6 | `HealthConfirmStep.tsx` tests | H7 | Onboarding step |
| 7 | `TrainingConfirmStep.tsx` tests | H7 | Onboarding step |
| 8 | Remove dead branch in `usePageStackBackHandler` | H6 | Quick cleanup |

**Key risks**:
- `databaseService.ts` (65.2% → 90%+): Heavy mocking needed for native vs web paths. Risk of flaky tests if mocking `@capacitor-community/sqlite`.
- `GoalDetailPage.tsx` (17.9% → 80%+): Component has deep prop drilling + multi-step form. May need to refactor before testing.

**Test patterns to use**:
- **Component tests**: `render()` + `screen.getByTestId()` + `fireEvent`/`userEvent`. Mock stores via `useXxxStore.setState()`.
- **Service tests**: Direct function calls. Mock `DatabaseService` interface.
- **Hook tests**: `renderHook()` from `@testing-library/react-hooks`. Mock Zustand stores.

**Merge conflict risk**: LOW — Wave 2 only adds test files, doesn't modify production code (except H6 which touches 2 lines).

---

### Wave 3: Performance (1 hour)

**Execution**:
1. Refactor `collectDishIngredients` — add `dishMap`
2. Refactor `buildGroceryList` — add `ingredientMap`
3. Run existing `GroceryList` tests to verify no regression
4. Add benchmark test with 500+ ingredients to prove improvement

**Key risks**:
- LOW merge conflict risk (single file)
- LOW regression risk — Map lookup is semantically identical to `.find()`
- Test should verify: same output for same input (snapshot test or deep equality)

---

### Wave 4: Code Quality Polish (2-3 hours)

**Execution order** (risk-ordered):

| Order | Task | Issue | Risk |
|-------|------|-------|------|
| 1 | Replace console with logger (2 files) | H4 | Lowest risk, quick win |
| 2 | Move greeting strings to i18n | M7 | Low risk, need 3 i18n keys |
| 3 | Remove `gender_other` key | L1 | Trivial |
| 4 | Replace 10 silent `.catch()` with `logger.warn` | M1 | Low risk but many files |
| 5 | Wrap migration v5 in transaction | M3 | Medium risk (DB migration) |
| 6 | Extract shared fitness selectors | H5 | Medium risk (8 consumer files) |

**Key risks**:
- **[H5] Selector extraction**: Touches 8 consumer files across features. Risk of import errors or selector signature mismatch. Run full test suite after this change.
- **[M3] Migration transaction**: Test with BOTH fresh DB and existing DB at version 4. Ensure idempotent behavior is preserved.
- **[M1] Silent catch replacement**: Verify test mocks — some tests may mock `console.warn` and need to switch to mocking `logger.warn`.

**Merge conflict risk**:
- `vi.json` (L1 + M7): Both modify the same file. Do L1 and M7 in same commit.
- `schema.ts` (M3): Low risk — migration section rarely changes.

---

## 4. Architecture Recommendations

### Short-term (this sprint)

1. **Adopt `dbWriteQueue` universally** [NEW-1, NEW-2]
   - The project already has `src/store/helpers/dbWriteQueue.ts` for queued DB writes.
   - `fitnessStore` and `dishStore` bypass it for transaction-based operations.
   - Standardize: ALL store → DB writes should go through `dbWriteQueue` or `persistToDb()`.
   - This gives retry capability and consistent error surfacing.

2. **Add typed row interfaces for `fitnessStore`** [NEW-3]
   - Create `src/store/types/fitnessRows.ts` with `TrainingPlanRow`, `WorkoutRow`, `WorkoutSetRow`, `TrainingPlanDayRow`, `WeightEntryRow`.
   - Replace `Record<string, unknown>` queries with typed queries.
   - This prevents silent type mismatches after schema migrations.

3. **Add `logger.warn` to `syncOnLaunch`** [NEW-4]
   - Replace bare `catch {}` with `catch(e) { logger.warn({component: 'useAutoSync', action: 'syncOnLaunch'}, e) }`.

### Medium-term (next sprint)

4. **Refactor large components** [NEW-6]
   - Priority: `TrainingPlanView.tsx` (800 lines) and `WorkoutLogger.tsx` (692 lines).
   - Extract reusable sub-components following feature-based structure.

5. **Create shared selector library** [H5]
   - `src/store/selectors/` directory with per-store selector files.
   - Convention: `select{Entity}{Condition}` (e.g., `selectActivePlan`, `selectTodayDayPlan`).
   - Re-export from barrel `src/store/selectors/index.ts`.

6. **Evaluate Zod validation at DB boundary** [NEW-3]
   - Instead of `as X` casts, parse DB rows through Zod schemas.
   - This catches corrupt/missing data at load time rather than at render time.
   - Start with `fitnessStore` as pilot, then extend to other stores.

---

## 5. Summary: Revised Wave Plan

| Wave | Tasks | Status | Est. Hours |
|------|-------|--------|-----------|
| **Wave 1** | M2, M4, H2, H1a, H1b | ✅ **DONE** (commit `726ae02`) | 0 |
| **Wave 2** | H7 (6 files), M8, H6 | 🔲 Ready | 6-8 |
| **Wave 3** | C3 (both functions) | 🔲 Ready | 1 |
| **Wave 4** | H4, M7, L1, M1, M3, H5 | 🔲 Ready | 2-3 |
| **Wave 5** *(NEW)* | NEW-1, NEW-2, NEW-3, NEW-4 | 🔲 Planned | 3-4 |

**Wave 5 (NEW — Architectural Hardening)**:

| # | Task | Issue | File(s) | Complexity |
|---|------|-------|---------|------------|
| 5.1 | Add `logger.warn` to `syncOnLaunch` catch | NEW-4 | `useAutoSync.ts:105` | Small |
| 5.2 | Migrate `fitnessStore` fire-and-forget → `dbWriteQueue` | NEW-1 | `fitnessStore.ts` (5 locations) | Medium |
| 5.3 | Migrate `dishStore` fire-and-forget → error toast | NEW-2 | `dishStore.ts:26-44` | Small |
| 5.4 | Create typed row interfaces for `fitnessStore` | NEW-3 | New: `store/types/fitnessRows.ts` + `fitnessStore.ts` | Medium |

---

## 6. Risk Matrix (All Issues)

| Severity | Issues | Category |
|----------|--------|----------|
| 🔴 HIGH | H7 (coverage gaps) | Quality — 50% of files below 100% branch coverage |
| 🟡 MEDIUM | NEW-1 (fire-and-forget fitness), NEW-2 (fire-and-forget dish), NEW-3 (unsafe casts), C3 (O(n²)), M1 (silent catch), M8 (coverage) | Architecture + Quality |
| 🟢 LOW | H4, H5, H6, M3, M7, L1, NEW-4, NEW-5, NEW-6, NEW-7 | Code quality polish |

---

## 7. False Positive Confirmation

All 9 BM false positives are **confirmed correct**:

| Issue | BM Verdict | Tech Leader Verdict |
|-------|------------|-------------------|
| C1 (migration flag timing) | ✅ FP — flag set after `await` | Confirmed |
| C2 (missing manualChunks) | ✅ FP — config exists | Confirmed |
| H1c (GoalPhaseSelector deps) | ✅ FP — already correct | Confirmed |
| H3 (onboarding store reload) | ✅ FP — localStorage, not SQLite | Confirmed |
| M5 (virtualization needed) | ✅ FP — datasets too small | Confirmed |
| M6 (filter/sort unoptimized) | ✅ FP — already in useMemo | Confirmed |
| L2 (scroll position dead code) | ✅ FP — tested feature code | Confirmed |
| L3 (barrel file 0% coverage) | ✅ FP — industry standard | Confirmed |
| NEW-5 (form resolver casts) | ✅ Known upstream issue | No action needed |

---

## 8. Codebase Health Summary

### ✅ Excellent
- **Memory management**: All 20+ addEventListener/setInterval/setTimeout patterns have proper cleanup
- **Error boundaries**: All 5 main tabs + onboarding wrapped
- **Context providers**: All values memoized, no inline object creation
- **No circular dependencies** between stores
- **No conditional hooks** violations
- **React 19 compatible**: No deprecated lifecycle methods

### ⚠️ Needs Improvement
- **Branch coverage**: 50% of files below 100% (114/228)
- **Fire-and-forget DB writes**: 5+ locations in `fitnessStore`, `dishStore`
- **Type safety at DB boundary**: 50+ unsafe `as X` casts in `fitnessStore`
- **Component sizes**: 11 files > 300 lines (max: 800)

### ✅ Good Practices Found
- Consistent `useCallback`/`useMemo` usage for performance
- Proper abort controllers for async operations
- Reference-counted modal backdrop escape handling
- `dbWriteQueue` exists but is underutilized
- Clean separation: stores → hooks → components
