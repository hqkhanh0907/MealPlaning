# Tech Leader Analysis: Fitness Module Architecture

> **Date:** 2025-07-18  
> **Scope:** 61 files, 12,739 LOC across `src/store/fitnessStore.ts` + `src/features/fitness/`  
> **Stack:** React 19 + Zustand 5 (persist v2) + sql.js WASM / @capacitor-community/sqlite

---

## 1. State Architecture

### 1.1 Store Shape (`fitnessStore` — 1,268 lines)

```
FitnessState
├── trainingProfile: TrainingProfile | null     ← 14-field user config
├── trainingPlans: TrainingPlan[]               ← multiple plans, 1 active
├── trainingPlanDays: TrainingPlanDay[]          ← daily sessions (JSON exercises)
├── workouts: Workout[]                          ← logged workouts
├── workoutSets: WorkoutSet[]                    ← per-set data (reps/weight/RPE)
├── weightEntries: WeightEntry[]                 ← daily weight log
├── isOnboarded: boolean
├── workoutMode: 'strength' | 'cardio'
├── workoutDraft: {                              ← crash-recovery draft
│   exercises: Exercise[], sets: WorkoutSet[],
│   elapsedSeconds: number, planDayId?: string
│ } | null
├── planStrategy: 'auto' | 'manual' | null
├── sqliteReady: boolean
├── showPlanCelebration: boolean
├── profileOutOfSync: boolean                    ← dirty flag for plan regen
└── profileChangedFields: string[]               ← which fields changed
```

### 1.2 Actions Summary (43 total)

| Category | Count | Examples |
|----------|-------|---------|
| Simple setters | 16 | `setPlanStrategy`, `setOnboarded`, `setWorkoutMode` |
| Pure selectors | 7 | `getPlanDays`, `getActivePlan`, `getLatestWeight` |
| Fire-and-forget DB sync | 13 | `addPlanDays`, `addWorkout`, `addWorkoutSet`, `setWorkoutDraft` |
| Awaited async DB | 5 | `deleteWorkout`, `initializeFromSQLite`, `loadWorkoutDraft` |
| Complex multi-field | 7 | `updateTrainingDays`, `autoAssignWorkouts`, `changeSplitType` |
| Transactional | 1 | `saveWorkoutAtomic` |

### 1.3 Persistence Configuration

```
Zustand persist middleware:
  name: 'fitness-storage'        → localStorage key
  version: 2                     → migration: v1→v2 adds planStrategy field
  
Dual-write pattern:
  Zustand (instant, optimistic) → SQLite (fire-and-forget .catch())
  Exception: saveWorkoutAtomic() → SQLite transaction FIRST, then Zustand
```

---

## 2. Data Flow Diagrams

### 2.1 Workout Logging (Critical Path)

```
┌─────────────────┐    ┌────────────────┐    ┌──────────────────┐    ┌──────────┐
│ WorkoutLogger    │───▶│ saveWorkout-   │───▶│ _db.transaction()│───▶│ SQLite   │
│ (component)      │    │ Atomic()       │    │   INSERT workout │    │ workouts │
│                  │    │ (store action) │    │   INSERT sets ×N │    │ sets     │
│ form + timer     │    │                │    │   UPSERT exercise│    │ exercises│
│ useForm/useState │    │                │    └──────────────────┘    └──────────┘
└─────────────────┘    │                │               │
                        │  On DB success │               ▼
                        │  ─────────────▶│    set(state => ({       
                        │                │      workouts: [..., w],  
                        │                │      workoutSets: [..., s]
                        └────────────────┘    }))                    
                                                                      
Note: Only saveWorkoutAtomic uses DB-first pattern.
All other writes use Zustand-first (optimistic).
```

### 2.2 Plan Generation

```
┌──────────────┐   ┌──────────────────┐   ┌─────────────────────────┐
│ FitnessTab   │──▶│ useTrainingPlan  │──▶│ generateTrainingPlan()  │
│              │   │ (hook)           │   │ 6-step pipeline:        │
│              │   │ isGenerating     │   │  1. Split determination │
│              │   │ generationError  │   │  2. Volume calculation  │
│              │   │                  │   │  3. Session distribution│
│              │   │                  │   │  4. Exercise selection  │◀── EXERCISES[]
│              │   │                  │   │  5. Rep scheme/cardio   │    (300+ items)
│              │   │                  │   │  6. Duration constraints│
│              │   │                  │   └─────────────────────────┘
│              │   │                  │              │
│              │   │                  │              ▼
│ addTraining- │◀──│                  │   GeneratedPlan {planDays[]}
│ Plan()       │   └──────────────────┘
│ addPlanDays()│──▶ SQLite (fire-and-forget ×N)
│ setActive()  │
└──────────────┘
```

### 2.3 Settings Propagation Chain

```
Health Profile change (weight/activity/goal)
  → setTrainingProfile()
    → profileOutOfSync = true
    → profileChangedFields = ['weight', ...]
      → SmartInsightBanner detects outOfSync
        → User clicks "Regenerate"
          → changeSplitType('regenerate')
            → DELETE old training_plan_days (SQLite)
            → INSERT new days (SQLite, fire-and-forget)
            → UPDATE Zustand state atomically
```

---

## 3. Database Schema (11 Tables)

### 3.1 Table Relationships

```
training_profile (1:1, singleton)
  
training_plans ─────── 1:N ──────▶ training_plan_days
  (id PK)               CASCADE     (plan_id FK)
                                      │
                                      │ exercises: JSON text
                                      │ (SelectedExercise[])
                                      │
workouts ──────────── 1:N ──────▶ workout_sets
  (id PK)               CASCADE     (workout_id FK)
  (plan_day_id FK) ─── NULLABLE ──▶ training_plan_days (NO CASCADE ⚠️)
                                    
workout_sets ────── N:1 ──────▶ exercises (NO CASCADE ⚠️)
  (exercise_id FK)                (id PK)

weight_log (standalone)
workout_drafts (standalone, singleton 'current')
fitness_profiles (legacy/parallel to training_profile ⚠️)
fitness_preferences (UI settings)
daily_log (nutrition-fitness bridge)
plan_templates (builtin + user-created)
```

### 3.2 JSON Serialization Fields (8 fields across 4 tables)

| Table | Column | Content |
|-------|--------|---------|
| `training_profile` | `available_equipment` | `["dumbbell","barbell","cable"]` |
| `training_profile` | `injury_restrictions` | `["shoulder","knee"]` |
| `training_profile` | `priority_muscles` | `["chest","back"]` |
| `training_plans` | `training_days` / `rest_days` | `[1,3,5]` / `[2,4,6,7]` |
| `training_plan_days` | `exercises` / `original_exercises` | `[{id,targetSets,targetReps,...}]` |
| `training_plan_days` | `muscle_groups` | `["chest","shoulders"]` |

**Trade-off Analysis:**

| Aspect | JSON (current) | Relational FK (alternative) |
|--------|---------------|---------------------------|
| Read perf | O(1) deserialize | O(N) JOINs per day |
| Write perf | O(1) serialize | O(N) INSERTs per exercise |
| Integrity | No FK validation | FK + CASCADE enforcement |
| Query flex | Must load all | Can filter/aggregate |
| Complexity | Low | 2+ additional tables needed |

**Verdict:** JSON is appropriate for `exercises` field given offline-first architecture and in-memory patterns. Exercises-per-day is small (5-8) and always loaded as a unit. Relational model adds complexity without meaningful query benefit.

### 3.3 Migration History (v1→v5)

| Version | Changes |
|---------|---------|
| v1→v2 | Multi-session/day support, exercises backup, day_of_week fix 0→1-based |
| v2→v3 | User profile expansion (name, DOB) |
| v3→v4 | Schedule editor (user_assigned, original_day, templates, days/restDays) |
| v4→v5 | Current week tracking for progression |

---

## 4. Persistence Analysis

### 4.1 Dual-Write Strategy

```
┌─────────────────────────────────────────────────────────┐
│              WRITE PATTERNS (3 types)                    │
├──────────────────┬──────────────────┬───────────────────┤
│ Fire-and-Forget  │ Awaited          │ Transactional     │
│ (40+ calls)      │ (5 calls)        │ (1 call)          │
├──────────────────┼──────────────────┼───────────────────┤
│ Zustand FIRST    │ Zustand FIRST    │ SQLite FIRST      │
│ SQLite .catch()  │ await SQLite     │ then Zustand      │
│                  │ then Zustand     │                   │
├──────────────────┼──────────────────┼───────────────────┤
│ addPlanDays      │ deleteWorkout    │ saveWorkoutAtomic │
│ addWorkout       │ initFromSQLite   │                   │
│ addWorkoutSet    │ loadWorkoutDraft │                   │
│ updatePlanDay*   │ getTemplates     │                   │
│ setWorkoutDraft  │ changeSplitType* │                   │
└──────────────────┴──────────────────┴───────────────────┘
```

### 4.2 Risks

| Risk | Severity | Scenario | Impact |
|------|----------|----------|--------|
| **Silent write failure** | HIGH | SQLite .catch() only logs, Zustand already committed | State diverges from DB; data lost on restart |
| **No retry mechanism** | HIGH | Transient SQLite error (WAL lock, disk full) | Single-attempt writes; no queue/retry |
| **Partial batch failure** | MEDIUM | `addPlanDays()` loops N inserts; if insert #3 fails, #1-2 persist, #4-N don't | Partial plan saved; inconsistent state |
| **Race on fast navigation** | LOW | User logs set → navigates away → async write interrupted | Set exists in Zustand (recovered from localStorage), absent from SQLite |
| **Zustand persist ↔ SQLite conflict** | MEDIUM | localStorage restored on cold start with stale data; SQLite has newer | `initializeFromSQLite()` overwrites Zustand arrays but not all fields |

### 4.3 Recovery Mechanisms

| Mechanism | Coverage |
|-----------|----------|
| `workoutDraft` (crash recovery) | ✅ Persisted to SQLite + Zustand; `loadWorkoutDraft()` on init |
| `initializeFromSQLite()` | ✅ Hydrates workouts/sets/weights from DB on startup |
| `saveWorkoutAtomic()` transaction | ✅ ACID guarantee for critical workout save |
| Google Drive sync | ✅ Full DB export/import (eventual, not real-time) |
| ❌ Write retry queue | MISSING |
| ❌ Conflict resolution | MISSING (last-write-wins) |
| ❌ Integrity check on startup | MISSING (no checksum/count validation) |

---

## 5. Code Quality Audit

### 5.1 Issues Table

| # | Issue | Severity | Location | Description |
|---|-------|----------|----------|-------------|
| CQ-01 | **Duplicate update patterns** | LOW | `updateWorkout`, `updateWorkoutSet`, `updateWeightEntry` | 3 methods with identical find-and-merge logic; could be generic `updateById<T>()` |
| CQ-02 | **Duplicate add patterns** | LOW | `addWorkout`, `addWorkoutSet` | Nearly identical: append + fire-and-forget SQLite; could share helper |
| CQ-03 | **O(n log n) selector** | MEDIUM | `getLatestWeight()` | Sorts entire weightEntries array on every call; should use `.reduce()` for O(n) |
| CQ-04 | **Non-memoized selectors** | MEDIUM | All 7 selector actions | Called as store methods `get.getPlanDays(id)`, re-execute every time; no caching |
| CQ-05 | **Missing await in getTemplates** | HIGH | `getTemplates()` line ~1072 | `_db.query()` result potentially unresolved; race condition |
| CQ-06 | **Heavy type casting** | LOW | `initializeFromSQLite()` | Uses `as` casts for DB rows; should use `rowToType<T>()` consistently |
| CQ-07 | **Inconsistent error handling** | MEDIUM | 40+ fire-and-forget writes | Some log via `logger.error`, some via `console.error`; no unified pattern |
| CQ-08 | **Magic numbers** | LOW | `addPlanDaySession` max=3, volume calc | Hardcoded limits should be constants |
| CQ-09 | **Expensive useMemo rebuild** | HIGH | `useProgressiveOverload` line 178 | `workoutSetsByWorkoutId` Map rebuilt on every set change O(n), n=100s-1000s |
| CQ-10 | **Render-path heavy computation** | HIGH | `useProgressiveOverload` line 188 | `detectChronicOvertraining` (6-week rolling) computed every render cycle |
| CQ-11 | **Unindexed exercise filter** | MEDIUM | `exerciseSelector.ts` line 114 | O(n) scan on 300-400 exercises, called 7× per plan; no pre-built index |
| CQ-12 | **Coarse store selector** | MEDIUM | `useFitnessNutritionBridge` | Subscribes to entire `workouts[]` array; re-renders on any workout change |
| CQ-13 | **No plan generation cache** | LOW | `useTrainingPlan` | Full plan regenerated even if inputs unchanged; should memoize by hash |
| CQ-14 | **Duplicate table** | LOW | `fitness_profiles` vs `training_profile` | Legacy parallel storage; `fitness_profiles` appears unused |
| CQ-15 | **52KB exercise DB in main bundle** | MEDIUM | `exerciseDatabase.ts` | ~30KB gzipped; not lazy-loaded or code-split |

### 5.2 Complexity Hot Spots

| Function | Lines | Cyclomatic Complexity | Risk |
|----------|-------|----------------------|------|
| `changeSplitType()` | ~180 | ~15 (regenerate + remap branches) | HIGH — dual-path logic |
| `autoAssignWorkouts()` | ~70 | ~10 (scoring + avoidance) | MEDIUM |
| `updateTrainingDays()` | ~60 | ~8 (validation + orphan reassign) | MEDIUM |
| `saveWorkoutAtomic()` | ~80 | ~8 (validation + loop + transaction) | MEDIUM |
| `generateTrainingPlan()` | ~300 | ~20 (6-step pipeline) | HIGH — should be broken into sub-functions |

---

## 6. Architecture Issues

| # | Issue | Impact | Recommendation |
|---|-------|--------|----------------|
| A-01 | **JSON exercises in training_plan_days** | No FK integrity; exercises can reference deleted exercise IDs | Acceptable trade-off (see §3.2); add validation on load |
| A-02 | **Stale plan_day_id in workouts** | Orphaned references when split changes | ✅ Already mitigated in `saveWorkoutAtomic()` with runtime validation |
| A-03 | **Fire-and-forget writes (40+)** | Silent data loss on SQLite failure | Add write queue with retry; or at minimum batch-validate on app pause |
| A-04 | **Missing CASCADE on workout_sets.exercise_id** | Orphaned sets if exercise deleted | Add `ON DELETE CASCADE` or `ON DELETE SET NULL` |
| A-05 | **Zustand persist vs SQLite source-of-truth** | Cold start: localStorage may have stale data | `initializeFromSQLite` should be authoritative; clear localStorage fitness arrays |
| A-06 | **No multi-device conflict handling** | Google Drive sync = last-write-wins | Acceptable for single-user offline-first; document limitation |
| A-07 | **workout_drafts singleton pattern** | Only 1 draft at a time; no multi-workout support | Acceptable for current UX; extend if needed |
| A-08 | **profileOutOfSync dirty flag** | Only tracks if profile changed, not which plan to regenerate | Works because only 1 active plan at a time |

---

## 7. Dependency Graph

### 7.1 Hook → Store → DB Chain

```
HOOKS                           STORES                    DB TABLES
─────                           ──────                    ─────────
useActivityMultiplier ─────────▶ fitnessStore ───────────▶ workouts
                      ─────────▶ healthProfileStore        workout_sets
                                                           weight_log
useProgressiveOverload ────────▶ fitnessStore              training_plan_days
                                  (workoutSets, workouts)
                                  
useFitnessNutritionBridge ─────▶ fitnessStore
                          ─────▶ healthProfileStore
                          ─────▶ useNutritionTargets ────▶ healthProfileStore
                          ─────▶ useTodayNutrition ──────▶ dayPlanStore

useTrainingPlan ───────────────▶ (pure function, no store)
                                  └── exerciseSelector
                                      └── EXERCISES[] (static 52KB)

useTimer ──────────────────────▶ (none, pure interval)
useCurrentDate ────────────────▶ (none, visibility API)
```

### 7.2 Cross-Feature Dependencies

```
INCOMING (other features → fitness):
  Dashboard:
    ├── useFeedbackLoop → useFitnessStore
    ├── useTodaysPlan → useFitnessStore  
    ├── useQuickActions → useFitnessStore
    ├── useDailyScore → useFitnessStore
    └── WeightMini, StreakMini → useFitnessStore

OUTGOING (fitness → other features):
  Fitness:
    ├── FitnessTab → useHealthProfileStore (weight/age)
    ├── CardioLogger → useHealthProfileStore (weight for MET)
    ├── useActivityMultiplier → useHealthProfileStore
    ├── useFitnessNutritionBridge → useHealthProfileStore, dayPlanStore
    └── Multiple components → useNavigationStore (page stack)

CIRCULAR DEPENDENCIES: ✅ NONE DETECTED
```

### 7.3 Component → Hook Map

```
FitnessTab
  ├── useFitnessNutritionBridge
  ├── useTrainingPlan
  └── 7× useFitnessStore selectors

WorkoutLogger
  ├── useProgressiveOverload
  ├── useTimer
  └── 4× useFitnessStore + 5× getState()

ProgressDashboard
  ├── 5× useFitnessStore selectors
  ├── 6× useMemo chains
  └── useCurrentDate

CardioLogger
  └── 1× useFitnessStore (saveWorkoutAtomic)

TrainingPlanView
  ├── useShallow(trainingPlans, trainingPlanDays)
  └── 6× getState() calls
```

---

## 8. Performance Analysis

### 8.1 Re-render Risks

| Component | Risk | Cause | Fix |
|-----------|------|-------|-----|
| **ProgressDashboard** | 🔴 HIGH | 5 separate array selectors (workouts, sets, weights) | Consolidate with `useShallow` |
| **FitnessTab** | 🔴 HIGH | 7 independent selectors; any change re-renders entire tab | Consolidate selectors; split into sub-components |
| **WorkoutHistory** | 🔴 HIGH | Multiple array subscriptions w/o shallow compare | Wrap with `useShallow` |
| **WorkoutLogger** | 🔴 HIGH | 4 selectors + 5 getState(); heavy form coupling | Extract draft logic to custom hook |
| **MilestonesList** | 🟡 MEDIUM | `useShallow` but still watches large arrays | Acceptable |
| **TrainingProfileSection** | 🟢 LOW | Single property selector | Good |
| **CardioLogger** | 🟢 LOW | Single action selector | Good |

### 8.2 Bundle Size

| Item | Raw | Gzipped (est.) | Impact |
|------|-----|----------------|--------|
| `exerciseDatabase.ts` | 52KB | ~30KB | Loaded in main bundle, not lazy |
| `fitnessStore.ts` | ~45KB | ~12KB | 1,268 lines of store logic |
| `useTrainingPlan.ts` | ~20KB | ~6KB | Plan generation pipeline |
| 16 utility files | ~55KB total | ~15KB | Pure functions, tree-shakeable |
| **Total fitness module** | ~172KB | ~63KB | ~12% of estimated app bundle |

### 8.3 Memory Usage

| Data Structure | Est. Items | Memory | Growth |
|----------------|-----------|--------|--------|
| `EXERCISES[]` static | 300-400 | ~200KB | Fixed (never freed) |
| `workoutSets[]` | 0 → 1000s | ~500KB at 1K | Linear with usage |
| `workouts[]` | 0 → 100s | ~50KB at 100 | Linear |
| `trainingPlanDays[]` | 3-14 | ~20KB | Fixed per plan |
| `weightEntries[]` | 0 → 365 | ~15KB at 365 | Linear |
| `workoutSetsByWorkoutId` Map | Rebuilt on change | Same as sets | ⚠️ Duplicate |

### 8.4 Critical Performance Bottlenecks

**🔴 P0 — useProgressiveOverload Map Rebuild**
```typescript
// Rebuilds O(n) Map on EVERY workoutSet change
const workoutSetsByWorkoutId = useMemo(() => {
  const map = new Map<string, WorkoutSet[]>();
  for (const s of workoutSets) { map.get(s.workoutId)... }
  return map;
}, [workoutSets]); // ← dependency = entire array
```
**Fix:** Move to store as derived state; only rebuild on workout deletion (not set additions).

**🔴 P0 — Chronic Overtraining in Render Path**
```typescript
// 6-week rolling window calculation on every render
const chronicOvertraining = useMemo(
  () => detectChronicOvertraining(workoutSets), // Expensive!
  [workoutSets]
);
```
**Fix:** Compute lazily on demand (e.g., when user opens progress tab), not during workout logging.

**🟡 P1 — Unindexed Exercise Selection**
```typescript
// O(400) filter called 7× during plan generation
const eligible = exerciseDB.filter(ex => ex.muscleGroup === target && ...);
```
**Fix:** Build `Map<MuscleGroup, Exercise[]>` index on app init. Reduces to O(1) lookup.

---

## 9. Type Safety Assessment

### 9.1 Zod Schema Coverage

| Domain | Schema | Status |
|--------|--------|--------|
| Training Profile | `trainingProfileSchema` | ✅ Complete (14 fields, all enums) |
| Workout Logger | `workoutLoggerSchema` | ✅ Complete (set validation) |
| Custom Exercise | `customExerciseSchema` | ⚠️ Loose (`z.string()` for muscleGroup, should be enum) |
| Cardio Logger | `cardioLoggerSchema` | ✅ Complete |
| Health Profile | `healthProfileSchema` | ✅ Complete |

### 9.2 Type-to-DB Alignment

- **Conversion:** `rowToType<T>()` / `typeToRow<T>()` handles snake_case ↔ camelCase
- **Alignment score:** ~95% — automatic conversion prevents mismatches
- **Risk:** JSON fields (`exercises`, `equipment`) parsed via `safeParseJsonArray()` with silent fallback to `[]`

### 9.3 Test Coverage

| Area | Files | Tests | Coverage |
|------|-------|-------|----------|
| Store actions | 2 test files | 70+ tests | ✅ Comprehensive |
| Type guards | 1 test file | 17 tests | ⚠️ `isSplitType()`, `normalizeSplitType()` untested |
| Schema validation | 2 test files | 21+ tests | ⚠️ Missing `cardioLoggerSchema.test`, `healthProfileSchema.test` |
| Utilities | 14+ test files | 100+ tests | ✅ Very good |
| Components | 11+ test files | 50+ tests | ✅ Good |

---

## 10. Recommendations (Prioritized by Technical Risk)

### 🔴 Critical (Fix now — data integrity / performance)

| # | Recommendation | Effort | Impact |
|---|---------------|--------|--------|
| R-01 | **Add write-ahead queue for SQLite** — Replace fire-and-forget `.catch()` with pending-writes queue; retry on failure; validate on app pause/background | L | Prevents silent data loss |
| R-02 | **Lazy-compute chronic overtraining** — Move `detectChronicOvertraining` out of render path; compute only when progress tab is active | S | Eliminates P0 jank during workout logging |
| R-03 | **Index exercise DB by muscle group** — Build `Map<MuscleGroup, Exercise[]>` on init | S | 7× faster plan generation |

### 🟡 Important (Fix soon — code quality / maintainability)

| # | Recommendation | Effort | Impact |
|---|---------------|--------|--------|
| R-04 | **Consolidate selectors with useShallow** — ProgressDashboard, FitnessTab, WorkoutHistory | S | Reduce unnecessary re-renders |
| R-05 | **Deduplicate store actions** — Extract generic `updateById<T>()`, `addWithSync<T>()` helpers | M | Reduce 200+ lines of duplicate code |
| R-06 | **Fix getTemplates() async bug** — Ensure `_db.query()` is properly awaited | S | Prevent race condition |
| R-07 | **Add missing FK CASCADE** — `workout_sets.exercise_id ON DELETE CASCADE` | S | Prevent orphaned records |
| R-08 | **Code-split exercise database** — Dynamic `import()` or lazy init | S | Save ~30KB from initial bundle |

### 🟢 Nice-to-have (Improve when time permits)

| # | Recommendation | Effort | Impact |
|---|---------------|--------|--------|
| R-09 | **Add startup integrity check** — Compare Zustand persist count vs SQLite count; reconcile on mismatch | M | Defense-in-depth for dual-write |
| R-10 | **Add Zod runtime validation** — Strengthen `customExerciseSchema` with proper enums | S | Catch invalid data at form boundary |
| R-11 | **Memoize plan generation** — Cache by `TrainingProfile` hash | S | Faster "Regenerate" if profile unchanged |
| R-12 | **Remove legacy fitness_profiles table** — Unused duplicate of training_profile | S | Schema cleanup |
| R-13 | **Extract useWorkoutDraft hook** — Move draft logic out of WorkoutLogger | M | Reduce component complexity |
| R-14 | **Break up changeSplitType()** — Split 180-line function into `regenerateSplit()` + `remapSplit()` | M | Reduce cyclomatic complexity |

---

## Appendix A: Store Action Classification

```
┌──────────────────────────────────────────────────────────────────┐
│                    43 STORE ACTIONS BY TYPE                       │
├──────────────┬───────────────────────────────────────────────────┤
│ SIMPLE (16)  │ setPlanStrategy, clearTrainingPlans,              │
│              │ updateTrainingPlan, setActivePlan,                │
│              │ updateWorkout, updateWorkoutSet,                  │
│              │ removeWorkoutSet, addWeightEntry,                 │
│              │ updateWeightEntry, removeWeightEntry,             │
│              │ setOnboarded, dismissPlanCelebration,             │
│              │ setWorkoutMode, addTrainingPlan,                  │
│              │ setWorkoutDraft (partial), clearWorkoutDraft      │
├──────────────┼───────────────────────────────────────────────────┤
│ SELECTOR (7) │ getPlanDays, getWorkoutSets, getActivePlan,       │
│              │ getLatestWeight, getWorkoutsByDateRange,          │
│              │ previewSplitChange, getRecommendedTemplates       │
├──────────────┼───────────────────────────────────────────────────┤
│ DB-SYNC (13) │ addPlanDays, updatePlanDayExercises,              │
│              │ restorePlanDayOriginal, addPlanDaySession,        │
│              │ removePlanDaySession, addWorkout,                 │
│              │ addWorkoutSet, reassignWorkoutToDay,              │
│              │ autoAssignWorkouts, applyTemplate,                │
│              │ saveCurrentAsTemplate, setWorkoutDraft,           │
│              │ clearWorkoutDraft                                 │
├──────────────┼───────────────────────────────────────────────────┤
│ ASYNC-DB (5) │ deleteWorkout, loadWorkoutDraft,                  │
│              │ initializeFromSQLite, getTemplates,               │
│              │ changeSplitType                                   │
├──────────────┼───────────────────────────────────────────────────┤
│ COMPLEX (7)  │ setTrainingProfile, updateTrainingDays,           │
│              │ autoAssignWorkouts, restoreOriginalSchedule,      │
│              │ changeSplitType, applyTemplate,                   │
│              │ saveWorkoutAtomic (only transaction)              │
└──────────────┴───────────────────────────────────────────────────┘
```

## Appendix B: Full SQLite Table Count

| # | Table | Purpose | FK |
|---|-------|---------|-----|
| 1 | `training_profile` | User fitness config (singleton) | — |
| 2 | `training_plans` | Workout programs | — |
| 3 | `training_plan_days` | Daily sessions per plan | → training_plans (CASCADE) |
| 4 | `exercises` | Exercise master data | — |
| 5 | `workouts` | Logged workout sessions | → training_plan_days (NO CASCADE ⚠️) |
| 6 | `workout_sets` | Individual sets per workout | → workouts (CASCADE), → exercises (NO CASCADE ⚠️) |
| 7 | `weight_log` | Daily body weight | — |
| 8 | `workout_drafts` | Crash recovery (singleton) | — |
| 9 | `fitness_profiles` | Legacy/unused ⚠️ | — |
| 10 | `fitness_preferences` | UI settings | — |
| 11 | `daily_log` | Nutrition-fitness bridge | — |
| (+) | `plan_templates` | Builtin + user templates | — |
