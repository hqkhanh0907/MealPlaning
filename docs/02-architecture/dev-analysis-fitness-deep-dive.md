# Dev Analysis: Fitness Code Deep-Dive

> **Date**: 2026-07-17  
> **Scope**: `src/store/fitnessStore.ts` (1268 lines), 6 hooks, 20+ utils  
> **Triggered by**: BM bug list (12 bugs) + Tech Leader architecture review

---

## 1. Bug Verification

### BUG-02: `updateWorkoutSet`/`removeWorkoutSet` không persist SQLite — ✅ CONFIRMED

- **File**: `src/store/fitnessStore.ts:492-500`
- **Evidence**:

  ```typescript
  // Line 492-495: updateWorkoutSet — ZUSTAND ONLY
  updateWorkoutSet: (id, updates) =>
    set(state => ({
      workoutSets: state.workoutSets.map(s => (s.id === id ? { ...s, ...updates } : s)),
    })),

  // Line 497-500: removeWorkoutSet — ZUSTAND ONLY
  removeWorkoutSet: id =>
    set(state => ({
      workoutSets: state.workoutSets.filter(s => s.id !== id),
    })),
  ```

- **Root Cause**: Không có `if (_db) { _db.execute(...) }` block sau khi `set()`. So sánh với `addWorkoutSet` (line 375-406) có đầy đủ INSERT → rõ ràng bị thiếu.
- **Impact**: User edit/remove set trong workout → nếu app chỉ restart nhẹ (không clear data), Zustand `persist` middleware giữ dữ liệu qua localStorage. Nhưng SQLite sẽ OUT OF SYNC. Khi `initializeFromSQLite` chạy, nó overwrite Zustand store từ SQLite → **mất thay đổi**. Nếu sync qua Google Drive, DB export sẽ thiếu data.
- **Thêm phát hiện**: `updateWorkout` (line 355-358), `addWeightEntry` (line 504-507), `updateWeightEntry` (line 509-512), `removeWeightEntry` (line 514-517) cũng KHÔNG persist. Tổng cộng **6 actions** thiếu DB persistence, không chỉ 2.

| Action              | Line    | Has DB Persist? |
| ------------------- | ------- | :-------------: |
| `addWorkoutSet`     | 375-406 |       ✅        |
| `updateWorkoutSet`  | 492-495 |       ❌        |
| `removeWorkoutSet`  | 497-500 |       ❌        |
| `updateWorkout`     | 355-358 |       ❌        |
| `addWeightEntry`    | 504-507 |       ❌        |
| `updateWeightEntry` | 509-512 |       ❌        |
| `removeWeightEntry` | 514-517 |       ❌        |

---

### BUG-03: `deleteWorkout` dùng 2 non-transactional DELETEs — ✅ CONFIRMED

- **File**: `src/store/fitnessStore.ts:360-373`
- **Evidence**:
  ```typescript
  deleteWorkout: async id => {
    set(state => ({
      workouts: state.workouts.filter(w => w.id !== id),
      workoutSets: state.workoutSets.filter(s => s.workoutId !== id),
    }));
    if (_db) {
      try {
        await _db.execute('DELETE FROM workout_sets WHERE workout_id = ?', [id]);
        await _db.execute('DELETE FROM workouts WHERE id = ?', [id]);
      } catch (error: unknown) {
        logger.error({...}, error);
      }
    }
  },
  ```
- **Root Cause**: Hai `execute` tuần tự, không wrap trong `_db.transaction()`. So sánh với `saveWorkoutAtomic` (line 413) — action DUY NHẤT dùng transaction.
- **Impact**: Nếu DELETE thứ 2 fail (sau khi sets đã bị xóa), workout record bị orphan trong DB. Zustand state đã optimistically remove cả hai → DB sẽ bị không nhất quán.
- **Note**: Schema có `workout_sets.workout_id REFERENCES workouts(id) ON DELETE CASCADE` (schema.ts:226) — nghĩa là nếu xóa workout trước, sets tự xóa theo CASCADE. Nhưng code xóa sets trước rồi mới xóa workout → CASCADE không cần thiết theo thứ tự này, nhưng nếu fail giữa chừng thì vẫn inconsistent.

---

### BUG-04: `changeSplitType` không atomic — ✅ CONFIRMED

- **File**: `src/store/fitnessStore.ts:877-1056`
- **Evidence** (regenerate mode, lines 927-963):

  ```typescript
  // Step 1: Zustand optimistic update — NO ROLLBACK
  set(state => ({
    trainingPlans: state.trainingPlans.map(p =>
      p.id === planId ? { ...p, splitType: newSplit, updatedAt: now } : p),
    trainingPlanDays: [...state.trainingPlanDays.filter(d => d.planId !== planId), ...newDays],
  }));

  // Step 2: 3 SEPARATE fire-and-forget DB ops
  if (_db) {
    _db.execute('UPDATE training_plans SET split_type = ?...', [...]).catch(...);  // ①
    _db.execute('DELETE FROM training_plan_days WHERE plan_id = ?', [...]).catch(...); // ②
    for (const day of newDays) {
      _db.execute('INSERT INTO training_plan_days ...', [...]).catch(...); // ③×N
    }
  }
  ```

- **Root Cause**: 3+ concurrent fire-and-forget promises, mỗi cái có `.catch()` riêng. Không có transaction. Không có ordering guarantee. Không có rollback.
- **Failure scenarios**:
  - ① UPDATE succeeds, ② DELETE fails → old days vẫn còn, split type đã đổi → inconsistent
  - ② DELETE succeeds, ③ INSERT fail ở day thứ 3/5 → chỉ có 2/5 days → plan bị hỏng
  - Zustand state đã update → user thấy plan mới, nhưng DB có plan cũ → restart = mất hết
- **Remap mode** (lines 1017-1054): cùng pattern, cùng risk.

---

### BUG-07: Nutrition bridge bỏ qua burned calories — ✅ CONFIRMED

- **File**: `src/features/fitness/hooks/useFitnessNutritionBridge.ts:85-118`
- **Evidence**:

  ```typescript
  export function useFitnessNutritionBridge(): FitnessNutritionBridgeResult {
    const workouts = useFitnessStore(s => s.workouts);
    const { eaten, protein } = useTodayNutrition();
    const { targetCalories, targetProtein } = useNutritionTargets();

    return useMemo(() => {
      const todayCalorieBudget = targetCalories;  // ← TDEE target, no burn adjustment
      const todayCaloriesConsumed = eaten;         // ← food only, no exercise offset

      const insight = deriveInsight(
        isTrainingDay, weeklyTrainingLoad,
        todayCalorieBudget,     // ← no burned calories added
        todayCaloriesConsumed,  // ← no burned calories subtracted
        todayProteinConsumed, targetProtein,
      );
      return { insight, todayCalorieBudget, isTrainingDay, weeklyTrainingLoad };
    }, [...]);
  }
  ```

- **Root Cause**: Hook chỉ lấy `targetCalories` (TDEE target từ health profile) và `eaten` (food consumed). **Không import** `calculateExerciseAdjustment` từ `activityMultiplier.ts`, không đọc `estimatedCalories` từ `workoutSets`, không tính burned.
- **Impact**: `deriveInsight()` so sánh `todayCaloriesConsumed < todayCalorieBudget * 0.75` nhưng KHÔNG cộng burned calories vào budget. User tập luyện nặng vẫn bị cảnh báo "deficit on training day" vì budget không tăng theo burn.
- **Note**: `calculateExerciseAdjustment()` (activityMultiplier.ts:106-129) tồn tại và tính đúng estimated calories — nhưng KHÔNG ĐƯỢC GỌI ở đây.

---

### BUG-08: Activity level chỉ suggest lên, không bao giờ suggest xuống — ❌ DENIED

- **File**: `src/features/fitness/utils/activityMultiplier.ts:35-51`
- **Evidence**:
  ```typescript
  export function mapToActivityLevel(
    strengthSessionsPerWeek: number,
    cardioMinutesPerWeek: number,
    totalVolumePerWeek: number,
  ): ActivityLevel {
    if (strengthSessionsPerWeek >= 6) return 'extra_active';
    if (cardioMinutesPerWeek > 150 && totalVolumePerWeek > 0) return 'extra_active';
    if (strengthSessionsPerWeek >= 5) return 'active';
    if (strengthSessionsPerWeek >= 4 && cardioMinutesPerWeek > 90) return 'active';
    if (strengthSessionsPerWeek >= 3 || cardioMinutesPerWeek >= 90) return 'moderate';
    if (strengthSessionsPerWeek >= 1 || cardioMinutesPerWeek >= 30) return 'light';
    return 'sedentary'; // ← CAN return lower level
  }
  ```
  ```typescript
  // activityMultiplier.ts:96
  needsAdjustment: suggestedLevel !== currentLevel, // ← CAN be downward
  ```
  ```typescript
  // useActivityMultiplier.ts:33
  activityLevel: analysis.suggestedLevel, // ← Applies whatever is suggested
  ```
- **Verdict**: Logic CÓ THỂ suggest giảm. Ví dụ: user set `extra_active` nhưng chỉ tập 1 session/tuần → suggest `light`. `needsAdjustment = true` vì `'light' !== 'extra_active'`. **BUG NÀY KHÔNG TỒN TẠI.**
- **Possible confusion**: Nếu user có `<= 2 weeks` data → `confidence='low'` → UI có thể KHÔNG hiển thị suggestion. Nhưng đó là design choice, không phải bug.

---

### BUG-09: Daily score phạt user không có plan — ⚠️ PARTIALLY CONFIRMED

- **File**: `src/features/dashboard/hooks/useDailyScore.ts:100-128`
- **Evidence**:

  ```typescript
  // Line 100
  const workoutCompleted = workouts.some(w => w.date === today);

  // Line 103-108
  let isRestDay = false;  // ← DEFAULT = false (training day!)
  if (activePlan) {
    const scheduledDays = trainingPlanDays.filter(...).map(d => d.dayOfWeek);
    isRestDay = !scheduledDays.includes(todayDayOfWeek);
  }
  // Nếu KHÔNG có activePlan: isRestDay = false
  ```

  ```typescript
  // scoreCalculator.ts:39-43 — workout score logic
  if (completed) return 100; // ← tập xong = 100
  if (isRestDay) return 100; // ← ngày nghỉ = 100
  if (isBeforeEvening) return 50; // ← chưa tối = 50
  return 0; // ← bỏ lỡ = 0 ← ĐÂY LÀ VẤN ĐỀ
  ```

- **Root Cause**: User không có plan → `isRestDay = false` → system coi HÔM NAY là ngày tập. Nếu user không tập (vì user KHÔNG CÓ plan để biết phải tập) → sau 20h → `workoutCompleted=false, isRestDay=false, isBeforeEvening=false` → **score = 0** cho workout factor.
- **Impact**: Workout weight = 0.25 (25%). Score 0 cho factor này kéo tổng điểm xuống đáng kể. User mới (chưa tạo plan) bị phạt vô lý.
- **Nuance**: Trước 20h thì score = 50 ("chưa tập"), sau 20h thì = 0 ("bỏ lỡ"). Nhưng CÓ penalize, dù không hoàn toàn "phạt" (vì weight-based average sẽ dilute).

---

### ⚠️ NEW BUG — Sunday Day-of-Week Mismatch in `useDailyScore` — FOUND DURING REVIEW

- **File**: `src/features/dashboard/hooks/useDailyScore.ts:102,106-107`
- **Evidence**:

  ```typescript
  // Line 102: uses JS Date.getDay() → 0=Sun, 1=Mon, ..., 6=Sat
  const todayDayOfWeek = now.getDay();

  // Line 106-107: compares with trainingPlanDays.dayOfWeek which uses ISO 1=Mon...7=Sun
  const scheduledDays = trainingPlanDays.filter(d => d.planId === activePlan.id).map(d => d.dayOfWeek);
  isRestDay = !scheduledDays.includes(todayDayOfWeek);
  ```

  ```typescript
  // dateUtils.ts:20-22 — the canonical conversion used everywhere ELSE
  export function getDayOfWeek(dateStr: string): number {
    const day = parseDate(dateStr).getDay();
    return day === 0 ? 7 : day; // ← converts to ISO weekday (Mon=1, Sun=7)
  }
  ```

- **Root Cause**: `useDailyScore` uses raw `getDay()` (0=Sunday) but plan days use ISO weekday (7=Sunday). On **Sunday**, `getDay()` returns `0`, but plan `dayOfWeek` for Sunday is `7`. So `scheduledDays.includes(0)` is always `false` → Sunday is ALWAYS treated as rest day.
- **Impact**: Sunday score is wrong — if user HAS training on Sunday, `isRestDay=true` → gets 100 workout score even if they didn't train. Conversely, if they train, they still get 100 (correct accidentally).
- **Fix**: Replace `now.getDay()` with ISO conversion: `const raw = now.getDay(); const todayDayOfWeek = raw === 0 ? 7 : raw;`

---

### ⚠️ NEW BUG — Training Plans NEVER persisted to SQLite — FOUND DURING REVIEW

- **File**: `src/store/fitnessStore.ts:182-201`
- **Evidence**:

  ```typescript
  // addTrainingPlan (line 182-187): ZUSTAND ONLY — NO DB
  addTrainingPlan: plan =>
    set(state => ({
      trainingPlans: [...state.trainingPlans, plan], ...
    })),

  // updateTrainingPlan (line 189-192): ZUSTAND ONLY — NO DB
  updateTrainingPlan: (id, updates) =>
    set(state => ({
      trainingPlans: state.trainingPlans.map(p => (p.id === id ? { ...p, ...updates } : p)),
    })),

  // setActivePlan (line 194-201): ZUSTAND ONLY — NO DB
  setActivePlan: planId =>
    set(state => ({
      trainingPlans: state.trainingPlans.map(p => { ... }),
    })),
  ```

  ```typescript
  // initializeFromSQLite (line 816-875): DOES NOT LOAD training_plans!
  // Only loads: workouts, workout_sets, weight_log
  ```

  ```bash
  # Verification: NO INSERT INTO training_plans in production code
  $ grep -rn "INSERT INTO training_plans" src/ --include="*.ts"
  # Only found in test files — ZERO production inserts
  ```

- **Root Cause**: `addTrainingPlan`, `updateTrainingPlan`, `setActivePlan`, `clearTrainingPlans` are all Zustand-only. `initializeFromSQLite` does NOT load `training_plans` or `training_plan_days` from SQLite. Training plans persist ONLY via Zustand `persist` middleware (localStorage).
- **Impact**: If localStorage is cleared or corrupted, ALL training plans are lost permanently. The `training_plans` and `training_plan_days` SQLite tables are written to (by `changeSplitType`, `applyTemplate`, etc.) but NEVER READ BACK on startup. This creates a massive inconsistency: some actions write to SQLite, but the data is never used.
- **Mitigating factor**: Zustand `persist` middleware does save to localStorage, so day-to-day usage survives. But `pm clear`, cache clearing, or storage limits will cause total plan data loss with no recovery path from SQLite.

---

## 2. Persistence Audit

### Tổng quan SQLite Writes trong fitnessStore.ts

| #   | Action                    | Type                   | Transaction? | Error Handling | Await? | Risk                         |
| --- | ------------------------- | ---------------------- | :----------: | -------------- | :----: | ---------------------------- |
| 1   | `addPlanDays`             | INSERT×N               |      ❌      | `.catch()` log |   ❌   | Silent loss                  |
| 2   | `updatePlanDayExercises`  | UPDATE                 |      ❌      | `.catch()` log |   ❌   | Silent loss                  |
| 3   | `restorePlanDayOriginal`  | UPDATE                 |      ❌      | `.catch()` log |   ❌   | Silent loss                  |
| 4   | `addPlanDaySession`       | INSERT                 |      ❌      | `.catch()` log |   ❌   | Silent loss                  |
| 5   | `removePlanDaySession`    | DELETE+UPDATE×N        |      ❌      | `.catch()` log |   ❌   | Race condition               |
| 6   | `addWorkout`              | INSERT                 |      ❌      | `.catch()` log |   ❌   | Silent loss                  |
| 7   | `updateWorkout`           | —                      |      —       | —              |   —    | **NO DB AT ALL**             |
| 7b  | `addTrainingPlan`         | —                      |      —       | —              |   —    | **NO DB AT ALL**             |
| 7c  | `updateTrainingPlan`      | —                      |      —       | —              |   —    | **NO DB AT ALL**             |
| 7d  | `setActivePlan`           | —                      |      —       | —              |   —    | **NO DB AT ALL**             |
| 7e  | `clearTrainingPlans`      | —                      |      —       | —              |   —    | **NO DB AT ALL**             |
| 8   | `deleteWorkout`           | DELETE×2               |      ❌      | `try/catch`    |   ✅   | Non-atomic                   |
| 9   | `addWorkoutSet`           | INSERT                 |      ❌      | `.catch()` log |   ❌   | Silent loss                  |
| 10  | **`saveWorkoutAtomic`**   | **INSERT×N**           |    **✅**    | **`throw`**    | **✅** | **Proper ✓**                 |
| 11  | `updateWorkoutSet`        | —                      |      —       | —              |   —    | **NO DB AT ALL**             |
| 12  | `removeWorkoutSet`        | —                      |      —       | —              |   —    | **NO DB AT ALL**             |
| 13  | `addWeightEntry`          | —                      |      —       | —              |   —    | **NO DB AT ALL**             |
| 14  | `updateWeightEntry`       | —                      |      —       | —              |   —    | **NO DB AT ALL**             |
| 15  | `removeWeightEntry`       | —                      |      —       | —              |   —    | **NO DB AT ALL**             |
| 16  | `setWorkoutDraft`         | INSERT/REPLACE         |      ❌      | `.catch()` log |   ❌   | Silent loss                  |
| 17  | `clearWorkoutDraft`       | DELETE                 |      ❌      | `.catch()` log |   ❌   | Silent loss                  |
| 18  | `updateTrainingDays`      | UPDATE+UPDATE×N        |      ❌      | `.catch()` log |   ❌   | Race condition               |
| 19  | `reassignWorkoutToDay`    | UPDATE                 |      ❌      | `.catch()` log |   ❌   | Silent loss                  |
| 20  | `autoAssignWorkouts`      | UPDATE×N               |      ❌      | `.catch()` log |   ❌   | Race condition               |
| 21  | `restoreOriginalSchedule` | UPDATE+UPDATE×N        |      ❌      | `.catch()` log |   ❌   | Race condition               |
| 22  | `changeSplitType`         | UPDATE+DELETE+INSERT×N |      ❌      | `.catch()` log |   ❌   | **CRITICAL: partial writes** |
| 23  | `applyTemplate`           | UPDATE+DELETE+INSERT×N |      ❌      | `.catch()` log |   ❌   | **CRITICAL: partial writes** |
| 24  | `saveCurrentAsTemplate`   | INSERT                 |      ❌      | `.catch()` log |   ❌   | Silent loss                  |

### Summary Statistics

- **Total DB write actions**: 24
- **Using transaction**: **1** (`saveWorkoutAtomic`)
- **No DB at all**: **10** (`addTrainingPlan`, `updateTrainingPlan`, `setActivePlan`, `clearTrainingPlans`, `updateWorkout`, `updateWorkoutSet`, `removeWorkoutSet`, `addWeightEntry`, `updateWeightEntry`, `removeWeightEntry`)
- **Not loaded from SQLite on startup**: `training_plans`, `training_plan_days` (only via Zustand persist/localStorage)
- **Fire-and-forget with `.catch()`**: **13**
- **`.catch()` instances** (total in file): **27**

### Missing FK CASCADE

| FK Column                    | Table                  | ON DELETE CASCADE? | Risk                                    |
| ---------------------------- | ---------------------- | ------------------ | --------------------------------------- |
| `training_plan_days.plan_id` | → `training_plans`     | ✅ Yes             | —                                       |
| `workout_sets.workout_id`    | → `workouts`           | ✅ Yes             | —                                       |
| `workout_sets.exercise_id`   | → `exercises`          | ❌ No CASCADE      | Orphan sets if exercise deleted         |
| `workouts.plan_day_id`       | → `training_plan_days` | ❌ **No CASCADE**  | **Orphan workouts if plan day deleted** |

---

## 3. Performance Issues

| #   | Location                            | Issue                                                                                        | Impact                                         | Fix                                             |
| --- | ----------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------- |
| P1  | `useProgressiveOverload.ts:178-186` | `workoutSetsByWorkoutId` Map rebuilt on every `workoutSets` change                           | O(n) Map creation, n = total sets ever         | Consider incremental update or stable reference |
| P2  | `useProgressiveOverload.ts:194-209` | `getLastSets` callback: 3 array iterations + Set creation per call                           | Repeated inside `suggestNextSetFn`             | Memoize per-exercise results                    |
| P3  | `useProgressiveOverload.ts:213-228` | `checkPlateauFn`: DUPLICATE logic of `getLastSets`                                           | Same filter→Set→filter→sort pattern            | Extract shared `getExerciseHistory(exerciseId)` |
| P4  | `useProgressiveOverload.ts:260`     | Inside `suggestNextSetFn`: `workoutSets.filter(s => s.exerciseId === exerciseId)` done AGAIN | 4th traversal of workoutSets for same exercise | Reuse `getLastSets` result                      |
| P5  | `useProgressiveOverload.ts:188,190` | `detectAcuteFatigue(workoutSets)` + `detectChronicOvertraining(workoutSets)` on ALL sets     | O(n) + 6-week windowed analysis every render   | ✅ memoized, acceptable                         |
| P6  | `useTrainingPlan.ts:279`            | `JSON.parse(d.exercises!)` inside `.map()` without memoization                               | Parse JSON per day per render                  | Cache parsed results                            |
| P7  | `useTrainingPlan.ts:342-350`        | Repeated filter/map/filter/sort chain for exercise splitting                                 | Multiple full array scans                      | Consolidate into single pass                    |
| P8  | `fitnessStore.ts:1066-1103`         | `getTemplates()` calls async DB query inside sync getter                                     | Returns stale data (promise not awaited)       | Convert to async or use cached value            |

### Note on `getTemplates()` (line 1066-1103)

```typescript
getTemplates: () => {
  const builtins = [...BUILTIN_TEMPLATES];
  if (!_db) return builtins;
  try {
    const rows: Record<string, unknown>[] = [];
    _db.query<...>('SELECT * FROM plan_templates WHERE is_builtin = 0')
      .then(result => { rows.push(...result); })  // ← ASYNC, never awaited!
      .catch(...);
    const userTemplates: PlanTemplate[] = rows.map(...); // ← rows ALWAYS EMPTY here
    return [...builtins, ...userTemplates]; // ← Always returns only builtins
  } catch { ... }
},
```

**Bug**: `rows` is always empty because `.then()` executes AFTER `rows.map()`. User-saved templates are NEVER returned.

---

## 4. Code Duplication

| Pattern                                                                                   |         Occurrences         | Files                                                                   | Lines                                            |
| ----------------------------------------------------------------------------------------- | :-------------------------: | ----------------------------------------------------------------------- | ------------------------------------------------ |
| `filter→Set→filter→sort` (exercise history)                                               |              3              | useProgressiveOverload.ts                                               | 194-209, 213-228, 243-248                        |
| `.map(x => x.id === id ? {...x, ...updates} : x)` (entity update by ID)                   |             10+             | fitnessStore.ts                                                         | 191, 236, 302, 357, 494, 511, 614, 673, 739, 784 |
| `if (_db) { _db.execute(...).catch(err => logger.error(...)) }` (fire-and-forget persist) |             17              | fitnessStore.ts                                                         | throughout                                       |
| `DELETE + loop INSERT` (replace plan days)                                                |              3              | fitnessStore.ts                                                         | 934-963, 1024-1054, 1159-1192                    |
| `JSON.stringify(exercises)` / `JSON.parse(day.exercises)`                                 |             15+             | fitnessStore.ts, useTrainingPlan.ts                                     | multiple                                         |
| `formatDate` / `toDateString` (date formatting)                                           | 3 different implementations | gamification.ts:2, useFitnessNutritionBridge.ts:16, useDailyScore.ts:31 | —                                                |

### Refactoring Opportunities

1. **Extract `persistAction(action, sql, params)` helper** → wraps `if (_db) { ... .catch() }` pattern, reduces 17 repetitions.
2. **Extract `getExerciseHistorySets(exerciseId, workoutSets, workouts)`** → eliminates 3× duplicate filter/Set/sort.
3. **Extract `replaceAllPlanDays(planId, newDays)`** → wraps DELETE + loop INSERT pattern used in 3 places.
4. **Unify date formatter** → single `formatLocalDate()` function.

---

## 5. Type Safety Issues

| #   | File:Line                            | Issue                                                                                | Risk                                 |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------ |
| T1  | `fitnessStore.ts:563-564`            | `JSON.parse(row.exercisesJson as string) as Exercise[]` — double cast, no validation | Crash on malformed JSON              |
| T2  | `fitnessStore.ts:822-867`            | 50+ `as string`, `as number` casts from DB query                                     | Silent wrong types if schema changes |
| T3  | `useTrainingPlan.ts:279,344,384,480` | `JSON.parse(d.exercises!) as SelectedExercise[]` — non-null assertion + cast         | Crash if exercises is null/invalid   |
| T4  | `CardioLogger.tsx`                   | `zodResolver(...) as unknown as Resolver<CardioLoggerFormData>`                      | Bypasses type checking entirely      |
| T5  | `CustomExerciseModal.tsx`            | Same `as unknown as Resolver<...>` pattern                                           | Same risk                            |
| T6  | `WorkoutLogger.tsx`                  | Same `as unknown as Resolver<...>` pattern                                           | Same risk                            |
| T7  | `fitnessStore.ts:1260`               | `persisted as Record<string, unknown>` in migrate                                    | Could lose type info                 |

### Note on `safeParseJsonArray` / `safeJsonParse`

Both utilities EXIST in `src/features/fitness/types.ts` and `src/features/fitness/utils/safeJsonParse.ts` but are **underused**. Multiple places do raw `JSON.parse(...)` that should use these safe wrappers instead.

---

## 6. Priority Fix List (ordered by severity × effort)

### 🔴 P0 — Critical (data loss / corruption)

| #   | Bug                                    | Effort | Description                                                                                                                                                                         |
| --- | -------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **NEW: Training plan persistence gap** | **L**  | Add SQLite persistence to `addTrainingPlan`, `updateTrainingPlan`, `setActivePlan`, `clearTrainingPlans`; add training_plans + training_plan_days loading to `initializeFromSQLite` |
| 2   | BUG-02 extended                        | **M**  | Add DB persistence to 6 missing actions: `updateWorkoutSet`, `removeWorkoutSet`, `updateWorkout`, `addWeightEntry`, `updateWeightEntry`, `removeWeightEntry`                        |
| 3   | BUG-04                                 | **M**  | Wrap `changeSplitType` in `_db.transaction()` — both regenerate and remap modes                                                                                                     |
| 4   | BUG-03                                 | **S**  | Wrap `deleteWorkout` in `_db.transaction()`                                                                                                                                         |

### 🟡 P1 — High (data integrity / correctness)

| #   | Bug                                  | Effort | Description                                                                                                                          |
| --- | ------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| 5   | **NEW: Sunday day-of-week mismatch** | **S**  | Fix `useDailyScore` to convert `getDay()` to ISO weekday (Sun=7 not 0)                                                               |
| 6   | P8: `getTemplates()` async bug       | **S**  | Fix async query never awaited — user templates never returned                                                                        |
| 7   | Fire-and-forget pattern              | **L**  | Convert 13+ fire-and-forget persists to awaited pattern with error propagation; or at minimum, ensure Zustand rollback on DB failure |
| 8   | Missing CASCADE                      | **S**  | Add `ON DELETE SET NULL` to `workouts.plan_day_id` FK                                                                                |
| 9   | `applyTemplate` atomicity            | **M**  | Wrap DELETE+INSERT×N in transaction (same pattern as BUG-04)                                                                         |

### 🟠 P2 — Medium (correctness / UX)

| #   | Bug         | Effort | Description                                                                                       |
| --- | ----------- | ------ | ------------------------------------------------------------------------------------------------- |
| 10  | BUG-07      | **M**  | Add burned calorie calculation to `useFitnessNutritionBridge` using `calculateExerciseAdjustment` |
| 11  | BUG-09      | **S**  | When no active plan, set `isRestDay = true` OR skip workout factor entirely                       |
| 12  | Type safety | **M**  | Replace raw `JSON.parse()` with `safeParseJsonArray` / `safeJsonParse` in 6+ locations            |

### 🔵 P3 — Low (performance / maintainability)

| #   | Bug            | Effort | Description                                                                    |
| --- | -------------- | ------ | ------------------------------------------------------------------------------ |
| 13  | P1-P4 perf     | **M**  | Extract `getExerciseHistorySets()` helper, eliminate duplicate filter/Set/sort |
| 14  | Duplication    | **M**  | Extract `persistAction()` and `replaceAllPlanDays()` helpers                   |
| 15  | P6             | **S**  | Cache `JSON.parse(exercises)` results in `useTrainingPlan`                     |
| 16  | Date utils     | **S**  | Unify 3 `formatDate` implementations                                           |
| 17  | Resolver casts | **S**  | Fix zod resolver types to eliminate `as unknown as`                            |

### Effort Legend

- **S** = Small (< 30 min, 1 file)
- **M** = Medium (1-2 hours, 2-5 files)
- **L** = Large (4+ hours, systemic change)

---

## 7. Architecture Observations

### Zustand-first, persist-second pattern

Toàn bộ store follow pattern:

```
1. set(state => { ... })   // Optimistic update (always succeeds)
2. if (_db) { ... }        // Fire-and-forget persist (may silently fail)
```

**Vấn đề**: Không có mechanism nào để rollback Zustand nếu DB fails. `saveWorkoutAtomic` là ngoại lệ duy nhất làm đúng: DB trước, Zustand sau.

### Recommendation: Adopt `saveWorkoutAtomic` pattern cho tất cả writes

```typescript
// BEFORE (current pattern — 17 actions)
someAction: (args) => {
  set(state => ({ ... }));
  if (_db) { _db.execute(...).catch(logger.error); }
},

// AFTER (atomic pattern)
someAction: async (args) => {
  if (_db) {
    await _db.transaction(async () => {
      await _db!.execute(...);
    });
  }
  set(state => ({ ... }));
},
```

Trade-off: UI sẽ chậm hơn vài ms (chờ DB), nhưng đảm bảo data integrity. Nên áp dụng cho critical writes (split change, template apply, workout CRUD) trước, để fire-and-forget cho low-risk writes (draft save, exercise reorder).
