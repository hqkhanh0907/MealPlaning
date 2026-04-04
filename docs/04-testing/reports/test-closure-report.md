# Test Closure Report — BM Business Logic Audit

> **Report Date**: 2026-04-05
> **Audit Scope**: BM (Business Manager) deep-dive — business logic correctness, store persistence, edge cases
> **Fix Commit**: `c45b4af`
> **Status**: CLOSED — all critical/high bugs fixed, test suite green, quality gates pass

---

## 1. Executive Summary

The BM Business Logic Audit performed a deep-dive analysis of 6 business logic areas:

1. **Nutrition Engine** — BMR/TDEE/Target/Macro calculation formulas
2. **Store Persistence** — Zustand ↔ SQLite write-through consistency
3. **Schema Validation** — Zod form schemas for numeric fields
4. **Computed Hooks** — `useNutritionTargets`, `useTodayCaloriesOut` correctness
5. **Cross-Store Sync** — Cascade behavior on delete, propagation chains
6. **Edge Cases** — Negative targets, NaN propagation, duplicate prevention

### Findings Summary

| Severity      | Count  | Description                                                                      |
| ------------- | ------ | -------------------------------------------------------------------------------- |
| **HIGH**      | 1      | BM-BUG-01: 4 stores missing SQLite persistence → data loss on restart            |
| **MEDIUM**    | 1      | BM-BUG-02: `calculateTarget()` can return negative values                        |
| **LOW**       | 2      | BM-BUG-03: No input validation in `calculateBMR()`; BM-BUG-04: No delete cascade |
| **IMPORTANT** | 5      | Warnings: duplicate quick-add, hard-coded fallbacks, schema gaps                 |
| **MINOR**     | 3      | Info: rounding precision, duplicate name prevention, bodyFatPct docs             |
| **Total**     | **12** |                                                                                  |

**Critic review** validated all severities — BM-BUG-03 and BM-BUG-04 were originally CRITICAL but downgraded after confirming existing UI mitigations (form schemas validate inputs; DishManager disables delete for in-use dishes).

### Actions Taken This Cycle

- **BM-BUG-01 (HIGH)**: FIXED — Added `_db` module-level variable and `persistToDb` queue-based writes to `ingredientStore`, `dishStore`, `dayPlanStore`, and `mealTemplateStore`
- **BM-BUG-02 (MEDIUM)**: FIXED — Added `Math.max(0, ...)` floor to `calculateTarget()`
- **28 new tests** added covering persistence behavior, error paths, and corrupt JSON fallback
- **All quality gates pass**: 4661 tests, 0 lint errors, clean build

---

## 2. Test Environment

| Component           | Detail                                                                              |
| ------------------- | ----------------------------------------------------------------------------------- |
| Test Framework      | Vitest 3.x + React Testing Library + @testing-library/jest-dom                      |
| Runtime             | Node.js (macOS Darwin)                                                              |
| Build Tool          | Vite 6                                                                              |
| Linter              | ESLint + TypeScript type-check (`npm run lint`)                                     |
| Manual Verification | Chrome DevTools (Console, Network, Application tabs)                                |
| SQLite Mocking      | `vi.fn()` mocks for `DatabaseService` interface (`execute`, `query`, `transaction`) |
| Coverage Tool       | Vitest c8/istanbul (`npm run test:coverage`)                                        |
| CI Pipeline         | `npm run lint` → `npm run test` → `npm run build`                                   |

### SQLite Persistence Test Pattern

Store persistence tests use a mocked `DatabaseService`:

```typescript
const mockDb = {
  execute: vi.fn().mockResolvedValue(undefined),
  query: vi.fn().mockResolvedValue([]),
  transaction: vi.fn().mockImplementation(async fn =>
    fn({
      execute: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([]),
    }),
  ),
};
```

Each test verifies that store mutations trigger the correct SQL statements with expected parameters.

---

## 3. Test Execution Summary

| Metric          | Before Audit | After Fixes | Delta   |
| --------------- | ------------ | ----------- | ------- |
| Test Files      | 184          | 184         | —       |
| Total Tests     | 4633         | 4661        | **+28** |
| Pass Rate       | 100%         | 100%        | —       |
| Failed Tests    | 0            | 0           | —       |
| New Tests Added | —            | 28          | +28     |
| Lint Errors     | 0            | 0           | —       |
| Build Status    | Clean        | Clean       | —       |

### New Tests Breakdown (28 total)

| Test File                   | New Tests | Coverage Focus                                                                                  |
| --------------------------- | --------- | ----------------------------------------------------------------------------------------------- |
| `dayPlanStore.test.ts`      | 8         | `persistToDb` on updatePlan/updateServings, `syncAllToDb` transaction reconcile, error handling |
| `dishStore.test.ts`         | 8         | `persistToDb` on add/update/delete dish + ingredients, corrupt JSON fallback in `loadAll`       |
| `ingredientStore.test.ts`   | 6         | `persistToDb` on add/update/delete, `syncAllToDb` batch reconcile, DB error resilience          |
| `mealTemplateStore.test.ts` | 4         | Queue-based persist on save/delete/rename, DB error logging                                     |
| `nutritionEngine.test.ts`   | 2         | `calculateTarget()` floor at 0 for negative results                                             |

---

## 4. Bug Summary Table

| Bug ID        | Severity   | Description                                                                                                                    | Status                  | Fix Commit | Tests Added |
| ------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------- | ---------- | ----------- |
| **BM-BUG-01** | **HIGH**   | 4 stores (ingredient, dish, dayPlan, mealTemplate) missing SQLite persistence — mutations update Zustand but never write to DB | **FIXED** ✅            | `c45b4af`  | 26          |
| **BM-BUG-02** | **MEDIUM** | `calculateTarget()` returns negative when aggressive cut offset exceeds TDEE                                                   | **FIXED** ✅            | `c45b4af`  | 2           |
| BM-BUG-03     | LOW        | `calculateBMR()` accepts invalid inputs (weight=0, height=0, negative values)                                                  | OPEN (defense-in-depth) | —          | —           |
| BM-BUG-04     | LOW        | Delete dish does not cascade-remove from `dayPlanStore` dish ID arrays                                                         | OPEN (UI mitigated)     | —          | —           |

### BM-BUG-01 Fix Detail

**Root Cause**: Architecture originally used sql.js (in-memory, data lost on restart). After migrating to `NativeDatabaseService` (persistent on Android), these 4 stores were never updated to write back to SQLite.

**Fix Pattern** (applied to all 4 stores):

1. Added `_db` module-level variable set during `loadAll(db)` call
2. Added `persistToDb(db, sql, params, label)` — queue-based async write with error logging
3. Added `syncAllToDb(db)` — transaction-based full reconcile (DELETE all + re-INSERT) for batch setters like `setDishes()`, `setDayPlans()`
4. Every mutation action (`add`, `update`, `delete`) now calls `persistToDb` after `set()`

**Impact of fix**: Both local persistence (app restart) and cloud backup (Google Drive via `useAutoSync` → `db.exportToJSON()`) now reflect current data.

### BM-BUG-02 Fix Detail

**Root Cause**: `calculateTarget(tdee, offset)` returned `Math.round(tdee + offset)` without floor constraint.

**Fix**: Single-line change in `src/services/nutritionEngine.ts`:

```typescript
// Before
return Math.round(Number(tdee) + Number(calorieOffset));

// After
return Math.max(0, Math.round(Number(tdee) + Number(calorieOffset)));
```

---

## 5. Remaining Findings (Not Fixed This Cycle)

### LOW — Deferred to Next Sprint

| ID        | Description                                                                          | Mitigation                                                                                                     |
| --------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| BM-BUG-03 | `calculateBMR()` accepts weight=0, height=0, negative age — produces nonsensical BMR | Form schemas (healthProfileSchema, onboardingSchema) validate weight≥30, height≥100 before data reaches engine |
| BM-BUG-04 | Deleting a dish does not remove its ID from `dayPlanStore.dayPlans[*].*DishIds`      | DishManager UI disables delete buttons for dishes currently in any day plan                                    |

### IMPORTANT — Warnings (Backlog)

| ID         | Description                                                                                         | Impact                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| BM-WARN-01 | `handleQuickAdd` allows duplicate dish in same meal slot — no dedup check                           | User double-clicks → nutrition counted 2×                                         |
| BM-WARN-02 | `useTodayCaloriesOut` fallback uses flat 8 cal/set regardless of body weight                        | 50kg user: -35% under; 120kg user: -73% under                                     |
| BM-WARN-03 | `useTodayCaloriesOut` hard-codes 70kg fallback when health profile is null                          | Up to 42% calorie estimation error for non-average users                          |
| BM-WARN-04 | 3 Zod schemas use `z.coerce.number()` instead of `z.preprocess()` — empty string silently becomes 0 | cardioLoggerSchema, dishEditSchema, saveAnalyzedDishSchema mask validation errors |
| BM-WARN-05 | `workoutLoggerSchema` explicitly allows `z.nan()` for weight/reps — NaN may reach SQLite as NULL    | Downstream calorie calculations may break silently on reload                      |

### MINOR — Informational

| ID         | Description                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| BM-INFO-01 | `calculateIngredientNutrition` doesn't round intermediate results → floating-point display artifacts (e.g., "487.00000000001 kcal") |
| BM-INFO-02 | No duplicate name prevention for dishes/ingredients — user can create 2 dishes named "Phở"                                          |
| BM-INFO-03 | `bodyFatPct` storage format undocumented — code does `/100` (assumes integer percentage), but no type-level constraint ensures this |

---

## 6. Coverage Impact

### Per-File Coverage After Fixes

| File                   | Statements | Branches | Functions | Lines |
| ---------------------- | ---------- | -------- | --------- | ----- |
| `nutritionEngine.ts`   | 100%       | 100%     | 100%      | 100%  |
| `dayPlanStore.ts`      | 100%       | 93%      | 100%      | 100%  |
| `mealTemplateStore.ts` | 100%       | 100%     | 100%      | 100%  |
| `ingredientStore.ts`   | 97%        | —        | —         | —     |
| `dishStore.ts`         | 97%        | —        | —         | —     |

### Uncovered Code

The remaining uncovered lines (~3% in ingredientStore/dishStore) are exclusively `.catch()` error-logging blocks in transaction failure paths:

```typescript
persistToDb(db, sql, params, 'addDish').catch(e => console.error('[dishStore] persistToDb failed:', e));
```

These paths require injecting a `db.execute` rejection mid-transaction, which is an extreme edge case. The error-logging behavior is consistent across all stores and follows the `fitnessStore` pattern.

---

## 7. Risk Assessment

### BM-BUG-01 Impact Analysis (Highest Risk)

**Before fix**: ALL user data written through 4 core stores was ephemeral:

```
User adds ingredient → Zustand state updated ✅ → SQLite NOT updated ❌
User restarts app → loadAll(db) reads stale SQLite → User data GONE
```

**Cascade effects**:

- **Local persistence**: All custom ingredients, dishes, meal plans, and templates lost on app restart
- **Cloud backup (Google Drive)**: `useAutoSync` calls `db.exportToJSON()` which reads from SQLite → exported stale data, not current Zustand state
- **Data import**: Importing a backup would overwrite current (correct) data with stale SQLite data

**After fix**: Write-through architecture ensures SQLite always reflects Zustand state:

```
User adds ingredient → Zustand state updated ✅ → persistToDb() queues SQL ✅
User restarts app → loadAll(db) reads current SQLite → Data intact ✅
Cloud backup → exportToJSON() reads current SQLite → Backup accurate ✅
```

### BM-BUG-02 Risk (Medium)

Negative target calories only occur with aggressive cut offsets (-1100) on low-TDEE users. The `Math.max(0, ...)` floor prevents nonsensical negative values from reaching the macro calculator and dashboard displays.

### Open Items Risk

| Item       | Risk Level | Justification                                                                      |
| ---------- | ---------- | ---------------------------------------------------------------------------------- |
| BM-BUG-03  | Low        | Form schemas already validate inputs; only reachable via direct DB import bypass   |
| BM-BUG-04  | Low        | UI disables delete for in-use dishes; only reachable via programmatic store access |
| BM-WARN-01 | Medium     | Double-tap on quick-add is user-reachable in normal flow                           |
| BM-WARN-02 | Low        | Calorie burn estimation is inherently approximate                                  |
| BM-WARN-03 | Low        | Profile loads quickly on app init; 70kg fallback is brief                          |

---

## 8. Recommendations

### Next Sprint (Priority)

1. **Fix BM-BUG-03**: Add input validation guard to `calculateBMR()` — return 0 for invalid inputs as defense-in-depth
2. **Fix BM-BUG-04**: Add cascade delete from `dayPlanStore` when a dish is removed — store-level invariant should not depend on UI checks
3. **Fix BM-WARN-01**: Add dedup check in `handleQuickAdd` — prevent duplicate dish IDs in same meal slot

### Backlog

4. **BM-WARN-02/03**: Replace hard-coded calorie fallbacks with weight-aware calculations
5. **BM-WARN-04**: Migrate 3 Zod schemas from `z.coerce.number()` to `z.preprocess()` pattern
6. **BM-WARN-05**: Add NaN-to-0 conversion before `persistToDb` in workout logger flow
7. **BM-INFO-01**: Add `Math.round()` to `calculateIngredientNutrition` return values

### Process Improvements

8. **Integration test**: Add an end-to-end persistence test verifying the full cycle: `store.addX()` → SQLite written → `store.loadAll(db)` → data matches. Currently only unit-level persistence is tested.
9. **Persistence checklist**: For every new store action that mutates state, require a corresponding `persistToDb` call as part of the PR review checklist.
10. **Schema migration audit**: When database schema changes (current: v6), audit ALL stores to ensure their SQL statements match the new column names/types.

---

## 9. Files Changed

| File                                      | Changes | Purpose                                                                               |
| ----------------------------------------- | ------- | ------------------------------------------------------------------------------------- |
| `src/store/dayPlanStore.ts`               | +94 -6  | Added `_db`, `persistToDb` for UPSERT on mutations, `syncAllToDb` for batch reconcile |
| `src/store/dishStore.ts`                  | +107 -5 | Added persistence for dish + dish_ingredients table writes                            |
| `src/store/ingredientStore.ts`            | +78 -4  | Added persistence for ingredient CRUD operations                                      |
| `src/store/mealTemplateStore.ts`          | +34 -3  | Added queue-based persist for template save/delete/rename                             |
| `src/services/nutritionEngine.ts`         | +4 -1   | `Math.max(0, ...)` floor on `calculateTarget()`                                       |
| `src/__tests__/dayPlanStore.test.ts`      | +113    | 8 new persistence + error-handling tests                                              |
| `src/__tests__/dishStore.test.ts`         | +117    | 8 new persistence + corrupt JSON fallback tests                                       |
| `src/__tests__/ingredientStore.test.ts`   | +110    | 6 new persistence + batch reconcile tests                                             |
| `src/__tests__/mealTemplateStore.test.ts` | +82     | 4 new queue-based persistence tests                                                   |
| `src/__tests__/nutritionEngine.test.ts`   | +4      | 2 new negative-target floor tests                                                     |

**Total**: 675 insertions, 68 deletions across 10 files.

---

## 10. Verification Checklist

### Calculation Chain — Verified Correct

```
HealthProfile → getAge() ✅ → calculateBMR() ✅ → calculateTDEE() ✅
  → calculateTarget() ✅ (now with floor) → calculateMacros() ✅
  → useNutritionTargets ✅ (NaN guards present)
  → Dashboard / Calendar / Fitness consumers ✅
```

### fitnessStore Persistence — Verified Correct

All 24 mutating actions in `fitnessStore` have corresponding DB writes (verified in BM audit). The 4 non-DB actions (`setOnboarded`, `setWorkoutMode`, `setPlanStrategy`, `dismissPlanCelebration`) correctly use Zustand `persist` middleware (localStorage) as they are UI state only.

### Quality Gates — All Pass

```
✅ npm run lint        → 0 errors, 0 eslint-disable directives
✅ npm run test        → 4661 tests passed, 0 failures
✅ npm run build       → clean production build
```

---

## 11. Sign-off

| Item                                   | Status |
| -------------------------------------- | ------ |
| All CRITICAL/HIGH bugs fixed           | ✅     |
| All MEDIUM bugs fixed                  | ✅     |
| LOW bugs documented with mitigation    | ✅     |
| Warnings documented in backlog         | ✅     |
| Test suite 100% pass rate              | ✅     |
| 28 new tests with persistence coverage | ✅     |
| Lint: 0 errors                         | ✅     |
| Build: clean                           | ✅     |
| Audit report finalized                 | ✅     |

**Test Closure Date**: 2026-04-05

**References**:

- BM Business Logic Audit: [`docs/04-testing/reports/BM-business-logic-audit.md`](./BM-business-logic-audit.md)
- Fix Commit: [`c45b4af`](../../..) — `fix(stores): add SQLite persistence to ingredient/dish/dayPlan/template stores (BM-BUG-01)`
- Previous Audit: CEO Audit Q3 (architecture, coding guidelines, release process)
