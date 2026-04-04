# BM Analysis: Fitness Module — Business Logic & Rules

> **Version**: 1.0
> **Date**: 2025-07-14
> **Scope**: Complete business logic analysis for 16 flows, 10 entities, 5 cross-feature bridges
> **Method**: Static code analysis of `src/store/fitnessStore.ts`, `src/features/fitness/`, `src/hooks/`, `src/services/`

---

## Table of Contents

1. [Entity Relationship Map](#1-entity-relationship-map)
2. [Flow-by-Flow Business Rules](#2-flow-by-flow-business-rules)
3. [Cross-Feature Business Rules Matrix](#3-cross-feature-business-rules-matrix)
4. [Business Logic Issues Summary](#4-business-logic-issues-summary)
5. [Recommendations](#5-recommendations)

---

## 1. Entity Relationship Map

```
TrainingProfile (singleton, id='default')
  │
  ├──generates──▶ TrainingPlan (1:N, status: active|paused|completed)
  │                   │
  │                   ├──has──▶ TrainingPlanDay (1:N, max 3 sessions/day)
  │                   │             │
  │                   │             ├──contains──▶ SelectedExercise[] (JSON blob)
  │                   │             │
  │                   │             └──referenced by──▶ Workout.planDayId (optional FK)
  │                   │
  │                   └──references──▶ PlanTemplate (optional, via templateId)
  │
  └──drives──▶ Activity Level Suggestion ──▶ HealthProfile.activityLevel

Workout (standalone, date-indexed)
  │
  └──has──▶ WorkoutSet (1:N, unique per workout+exercise+setNumber)
                │
                ├── Strength fields: reps, weightKg, rpe, restSeconds
                └── Cardio fields: durationMin, distanceKm, avgHeartRate, intensity, estimatedCalories

WeightEntry (standalone, one per date)

WorkoutDraft (singleton, id='current', auto-persisted to SQLite)

PlanTemplate (builtin + user-created, matched via scoring algorithm)
```

**Persistence Model**:
| Entity | Zustand (localStorage) | SQLite | Notes |
|--------|----------------------|--------|-------|
| TrainingProfile | ✅ (via persist) | ✅ training_profile | Dual persistence |
| TrainingPlan | ✅ | ✅ training_plans | Dual persistence |
| TrainingPlanDay | ✅ | ✅ training_plan_days | Dual, fire-and-forget writes |
| Workout | ✅ | ✅ workouts | Dual, `saveWorkoutAtomic` uses transaction |
| WorkoutSet | ✅ | ✅ workout_sets | Dual, atomic with workout |
| WeightEntry | ✅ | ✅ weight_log | Dual persistence |
| WorkoutDraft | ✅ | ✅ workout_drafts | Singleton 'current' |
| PlanTemplate | ❌ (queried) | ✅ plan_templates | Builtin in code, user-created in DB |

---

## 2. Flow-by-Flow Business Rules

### Flow 1: Tạo kế hoạch tập (Training Plan Generation)

- **Trigger**: User completes onboarding training profile OR manually creates plan
- **Pre-conditions**: `TrainingProfile` must be populated with valid data
- **Business Rules**:
  - **BR-01** (Split Selection): `1-3 days → full_body`, `4 days → upper_lower`, `5+ days → ppl`
  - **BR-02** (Volume Calculation): Base sets from Schoenfeld 2017 VOLUME_TABLE, adjusted by:
    - Goal: cut ×0.8, bulk ×1.1
    - Age >40: ×0.9
    - Sleep <7h: ×0.9
    - Duration factor: ×(0.3 + sessionMin/60 × 0.7), clamped [0.5, 1.3]
    - Priority muscles clamped to [MEV, MAV]; others clamped to [MEV, ∞]
  - **BR-03** (Exercise Selection): Filter by primary muscle → equipment → injuries → sort compound→isolation → select ceil(setsNeeded/3) exercises
  - **BR-04** (Deload): Week `n % planCycleWeeks === 0` is deload: reps ×0.6, intensity ×0.9
  - **BR-05** (Cardio Scheduling): Rest days first → overflow to training days (max 2 double sessions); HIIT never on leg days
  - **BR-06** (Duration Constraint): If estimated > sessionDurationMin: remove exercises from end, then reduce sets
  - **BR-07** (Session Splitting): If sessionDurationMin ≤ 45 AND day has 4+ exercises → split into 2 sessions (compounds + isolations)
  - **BR-08** (Mutual Exclusivity): `setActivePlan()` pauses all other active plans
- **State Transitions**:
  ```
  no-profile → profile-set → plan-generating → plan-created → active-plan
  ```
- **Edge Cases**:
  - EC-01: No exercises match equipment + injury filters → empty exercise list in plan day, no warning to user
  - EC-02: `daysPerWeek=2` with PPL split → impossible to distribute 3 muscle groups across 2 days
  - EC-03: Concurrent plan creation → both become active (race condition in `setActivePlan`)
- **Issues Found**:
  - **BUG-01**: `addTrainingPlan()` has no duplicate ID check — calling with same ID silently creates duplicates in Zustand array
  - **IMPROVEMENT-01**: Plan generation doesn't validate that enough exercises exist for required volume; should warn when fallback to bodyweight occurs

---

### Flow 2: Ghi nhận buổi tập sức mạnh (Strength Workout Logging)

- **Trigger**: User clicks "Start Workout" from plan day or free session
- **Pre-conditions**: Exercises loaded (from plan day or manual selection)
- **Business Rules**:
  - **BR-09** (Atomic Save): `saveWorkoutAtomic()` wraps in SQLite transaction — all-or-nothing
  - **BR-10** (FK Validation): `planDayId` validated inside transaction via SELECT on `training_plan_days`
  - **BR-11** (Exercise Registration): Each exercise INSERT OR IGNORE'd into `exercises` table with full metadata from EXERCISES database
  - **BR-12** (Draft Recovery): Draft auto-saved to SQLite (`id='current'`) during session; loaded on app restart
  - **BR-13** (Set Uniqueness): DB constraint `UNIQUE(workout_id, exercise_id, set_number)` prevents duplicate sets
- **State Transitions**:
  ```
  idle → draft-active (exercises selected) → logging-sets → saving → completed
  ```
- **Edge Cases**:
  - EC-04: App crash during logging → draft recovery via `loadWorkoutDraft()`, but `elapsedSeconds` reset to 0
  - EC-05: Exercise not in EXERCISES database (custom exercise) → set logged anyway, exercise not registered
  - EC-06: `planDayId` deleted between session start and save → `validatedPlanDayId` set to null (graceful degradation)
- **Issues Found**:
  - **BUG-02**: `updateWorkoutSet()` and `removeWorkoutSet()` do NOT write to SQLite — only update Zustand state. If user edits/removes a set after initial save and app restarts, changes are lost
  - **BUG-03**: `deleteWorkout()` performs 2 separate DELETE queries without transaction — if first succeeds and second fails, orphaned workout_sets remain in DB

---

### Flow 3: Ghi nhận buổi tập cardio (Cardio Workout Logging)

- **Trigger**: User switches to cardio mode and logs session
- **Pre-conditions**: `workoutMode === 'cardio'`
- **Business Rules**:
  - **BR-14** (Calorie Estimation): Formula `(durationMin × MET × weightKg) / 60`, MET values per cardio type × intensity:
    ```
    running:    7.0 / 9.8 / 12.8
    cycling:    4.0 / 6.8 / 10.0
    swimming:   4.8 / 7.0 / 9.8
    hiit:       6.0 / 8.0 / 12.0
    walking:    2.5 / 3.5 / 5.0
    elliptical: 4.0 / 5.0 / 7.5
    rowing:     4.8 / 7.0 / 10.5
    ```
  - **BR-15** (Cardio Type Mapping): `CARDIO_TYPE_TO_EXERCISE_ID` maps UI type to exercise record
  - **BR-16** (Validation): Zod schema enforces heart rate 30-250, duration ≥0, distance ≥0
  - **BR-17**: Uses same `saveWorkoutAtomic()` as strength — same atomicity guarantees
- **State Transitions**:
  ```
  idle → cardio-mode → type-selected → logging → saving → completed
  ```
- **Edge Cases**:
  - EC-07: Weight=0 (no health profile) → calories calculated as 0 (division not involved, multiplication by 0)
  - EC-08: Stopwatch mode vs manual duration — stopwatch accumulates real-time, manual allows arbitrary input
- **Issues Found**:
  - **IMPROVEMENT-02**: Cardio calories not consumed anywhere downstream (see Flow 9 — orphaned hook)

---

### Flow 4: Chỉnh sửa bài tập trong ngày (Edit Day Exercises)

- **Trigger**: User opens PlanDayEditor from plan view
- **Pre-conditions**: Active plan with ≥1 plan day
- **Business Rules**:
  - **BR-18** (Exercises Serialization): Exercises stored as JSON string in `training_plan_days.exercises`
  - **BR-19** (Original Preservation): `originalExercises` field preserves template exercises for "Restore Original" undo
  - **BR-20** (Unsaved Changes Dialog): Tracks dirty state; on back navigation offers "Save & Go Back", "Discard Changes", "Stay Editing"
- **State Transitions**:
  ```
  viewing → editing → dirty → save|discard|cancel → viewing
  ```
- **Edge Cases**:
  - EC-09: Both `originalExercises` and `exercises` null → `restorePlanDayOriginal` restores null (no-op)
  - EC-10: JSON circular reference during stringify → runtime error (no catch)
- **Issues Found**:
  - **IMPROVEMENT-03**: `updatePlanDayExercises()` silently succeeds for non-existent `dayId` — should warn

---

### Flow 5: Thay đổi Split Type

- **Trigger**: User changes split type in plan settings
- **Pre-conditions**: Active plan exists
- **Business Rules**:
  - **BR-21** (Two Modes):
    - `regenerate`: Deletes all days, generates fresh from new split + profile
    - `remap`: Keeps session count, reassigns muscle groups to new split positions
  - **BR-22** (Preview): `previewSplitChange()` returns mapped/suggested/unmapped days before applying
  - **BR-23** (Destructive): Both modes DELETE all existing plan days and INSERT new ones
- **State Transitions**:
  ```
  current-split → preview → confirm-mode → regenerate|remap → new-split
  ```
- **Edge Cases**:
  - EC-11: No `trainingProfile` → regenerate creates days with empty exercises (`'[]'`)
  - EC-12: SQLite fails mid-operation (after DELETE, before all INSERTs) → state has new days but DB has partial
  - EC-13: Changing to same split type → still regenerates/remaps (unnecessary work)
- **Issues Found**:
  - **BUG-04**: Split change is NOT atomic — DELETE and INSERT are separate operations. If INSERTs fail, plan days are lost with no recovery
  - **IMPROVEMENT-04**: Should use SQLite transaction for split change operations

---

### Flow 6: Progressive Overload

- **Trigger**: Automatic suggestion when logging sets
- **Pre-conditions**: ≥1 previous set for the exercise
- **Business Rules**:
  - **BR-24** (Weight Increase Logic):
    ```
    IF lastReps >= targetRepsMax:
      → Increase weight by experience-based increment, reset reps to targetRepsMin
    ELSE:
      → Increase reps by 1, keep weight same
    ```
  - **BR-25** (Overload Rates):
    - Beginner: 2.5kg upper / 5kg lower per week
    - Intermediate: 1.25kg upper / 2.5kg lower per 2 weeks
    - Advanced: 1.25kg upper / 2.5kg lower per 4 weeks
  - **BR-26** (Rep Scheme by Periodization):
    - LINEAR: Same scheme every session
    - UNDULATING: Rotates [strength, hypertrophy, endurance] per session
    - BLOCK: 4-week phases cycling [hypertrophy, strength, endurance]
- **State Transitions**: Stateless — computes suggestion each time from history
- **Edge Cases**:
  - EC-14: Empty history → returns `{ weight: 0, reps: targetRepsMin, source: 'manual' }`
  - EC-15: User never reaches targetRepsMax → weight never increases (stuck in rep progression)
- **Issues Found**:
  - **IMPROVEMENT-05**: No mechanism for user to override suggested weight increment (always uses experience-based defaults)

---

### Flow 7: Plateau Detection

- **Trigger**: Checked during workout logging (per exercise)
- **Pre-conditions**: ≥3 workout sessions with data for the exercise
- **Business Rules**:
  - **BR-27** (Strength Plateau): Max weight from last 3 attempts ≤ max weight from attempts 4-9, with ±2% tolerance
  - **BR-28** (Volume Plateau): This week's total volume ≤ last week's volume (sum of reps × weight)
  - **BR-29** (Tolerance Formula): `|a-b| / max(|a|, |b|) <= 0.02`
- **State Transitions**: Stateless — returns `{ isPlateaued: boolean, weeks: number }`
- **Edge Cases**:
  - EC-16: < 3 previous sessions → no plateau detection (returns false)
  - EC-17: Very light weights (1-2kg) → 2% tolerance is only 0.02-0.04kg, practically useless
  - EC-18: Inconsistent set counts between sessions → volume comparison may be misleading
- **Issues Found**:
  - **IMPROVEMENT-06**: Plateau detection doesn't consider RPE — user might be handling same weight at lower RPE (positive adaptation, not plateau)

---

### Flow 8: Auto-Deload

- **Trigger**: Checked weekly during plan progression
- **Pre-conditions**: ≥4 weeks of RPE data
- **Business Rules**:
  - **BR-30** (Trigger): 4 consecutive weeks with average RPE ≥ 8
  - **BR-31** (Deload Prescription): Volume ×0.6 (40% reduction), Intensity ×0.9
  - **BR-32** (Periodic Deload): `weekNumber % planCycleWeeks === 0` → auto deload week
- **State Transitions**:
  ```
  normal → fatigued (RPE≥8 for 4 weeks) → deload-suggested → deload-active → normal
  ```
- **Edge Cases**:
  - EC-19: User doesn't log RPE → no data for detection → deload never triggers
  - EC-20: Mixed strength+cardio weeks → cardio sets don't have RPE
- **Issues Found**:
  - **BUG-05**: Periodic deload (`isDeloadWeek`) checks `weekNumber % planCycleWeeks === 0`, but `weekNumber` starts at 1 → week 0 is never reached. For cycle=8: week 8 is deload but also the LAST week, potentially wasting the deload benefit

---

### Flow 9: Tính calories đốt (Calories Burned Calculation)

- **Trigger**: After workout completion
- **Pre-conditions**: Completed workout with sets
- **Business Rules**:
  - **BR-33** (Cardio Burn): `(durationMin × MET × weightKg) / 60` — per MET table (see BR-14)
  - **BR-34** (Strength Burn): `(STRENGTH_MET × weightKg × durationMin) / 60` where `STRENGTH_MET=5`
  - **BR-35** (Fallback): If no duration data → 8 cal/set flat rate
- **State Transitions**: Stateless calculation
- **Edge Cases**:
  - EC-21: No body weight in profile → weightKg=0 → calories=0
  - EC-22: Strength workout without timer → falls back to 8 cal/set
- **Issues Found**:
  - **INFO-06**: `useTodayCaloriesOut` IS used in `App.tsx`, `DashboardTab.tsx`, and `EnergyDetailSheet.tsx` — it feeds the net calorie calculation (`eaten - caloriesOut`). However, the **nutrition bridge** (`useFitnessNutritionBridge`) does NOT consume it (see BUG-07).

---

### Flow 10: Cầu nối Nutrition (Fitness↔Nutrition Bridge)

- **Trigger**: Computed reactively when fitness or nutrition data changes
- **Pre-conditions**: Active workout history + nutrition targets set
- **Business Rules**:
  - **BR-36** (Insight Generation):
    - `'deficit-on-training'`: Training day AND eaten < 75% target → WARNING
    - `'protein-low'`: Protein consumed < 60% target → WARNING
    - `'recovery-day'`: Rest day AND ≥4 weekly sessions → INFO
    - `'balanced'`: Default success state
  - **BR-37** (Training Day Detection): Checks if today has a workout logged (by date match)
- **State Transitions**: Reactive — recomputes on store changes
- **Edge Cases**:
  - EC-23: Timezone boundary — workout logged at 23:59, nutrition logged at 00:01 → different "today"
  - EC-24: Multiple workouts on same date → counts as training day (correct)
  - EC-25: Nutrition data stale (meal logged after bridge renders) → insight not refreshed until next render
- **Issues Found**:
  - **BUG-07**: Bridge doesn't consume `useTodayCaloriesOut` for burned calories → insights only consider consumed vs target, ignoring exercise energy expenditure. A user who burned 500cal should get different insight than one who burned 0.

---

### Flow 11: Điều chỉnh Activity Level (Activity Level Suggestion)

- **Trigger**: Periodic analysis of 4 weeks of workout data
- **Pre-conditions**: ≥2 weeks of workout history
- **Business Rules**:
  - **BR-38** (Mapping Thresholds):
    ```
    extra_active:  6+ sessions/week OR (>150min cardio AND volume>0)
    active:        5+ sessions OR (4+ sessions AND >90min cardio)
    moderate:      3-4 sessions OR ≥90min cardio
    light:         1-2 sessions OR ≥30min cardio
    sedentary:     else
    ```
  - **BR-39** (Confidence): `low` (<2 weeks data), `medium` (2-3 weeks), `high` (4+ weeks)
  - **BR-40** (Apply Action): Updates `healthProfile.activityLevel` → triggers TDEE recalculation → nutrition targets update
- **State Transitions**:
  ```
  analyzing → suggestion-ready → user-apply|user-dismiss → updated|dismissed
  ```
- **Edge Cases**:
  - EC-26: Pure cardio user with zero strength volume → volume=0 → might not qualify for `extra_active` even at 7 sessions/week (fixed by OR condition on sessions count)
  - EC-27: 2-4 week lag before suggestion changes (feature, not bug)
  - EC-28: Low-confidence suggestion applied → inaccurate TDEE for up to 4 weeks
- **Issues Found**:
  - **BUG-08**: Activity level suggestion only suggests UPWARD adjustments. If user reduces training (injury, break), system never suggests decreasing activity level → TDEE stays inflated → user unknowingly overeats
  - **IMPROVEMENT-07**: Confidence level should block apply action when `low` — currently just informational

---

### Flow 12: Gamification (XP, Milestones, PRs)

- **Trigger**: After each workout completion
- **Pre-conditions**: ≥1 completed workout
- **Business Rules**:
  - **BR-41** (Milestones): Threshold-based achievements:
    - Sessions: 1, 10, 25, 50, 100
    - Streaks: 7, 14, 30, 60, 90 days
  - **BR-42** (PR Detection):
    - Per exercise, per rep count
    - Current weight > max historical weight at same reps
    - Deduplicated per exercise (1 PR per exercise per session)
  - **BR-43** (1RM Estimation): Brzycki formula `weight / (1.0278 - 0.0278 × reps)`
    - Edge: reps=0 → returns 0; reps=1 → returns weight directly
- **State Transitions**: Stateless — computed from workout history
- **Edge Cases**:
  - EC-29: User logs same exercise at different rep counts → PR for each rep count independently
  - EC-30: First ever set for an exercise → no PR (no baseline to beat)
  - EC-31: Weight regression (injury) → PR system only tracks max, never resets baseline
- **Issues Found**:
  - **IMPROVEMENT-08**: No XP/leveling system despite gamification infrastructure — only milestones and PRs exist

---

### Flow 13: Daily Score

- **Trigger**: Dashboard render
- **Pre-conditions**: At least nutrition targets configured
- **Business Rules**:
  - **BR-44** (5-Factor Weighted Score):
    ```
    CALORIES  (weight=0.30): 100pts (±50cal of target) → 20pts (±500cal)
    PROTEIN   (weight=0.30): Ratio-based, 100pts at ≥100% target
    WORKOUT   (weight=0.25): 100pts (completed), 40pts (before 8pm), 20pts (after 8pm)
    WEIGHT_LOG(weight=0.05): 100pts (today), 50pts (yesterday), 0pts (stale)
    STREAK    (weight=0.10): +1pt/day, capped at +30
    ```
  - **BR-45** (Color Coding): emerald ≥70, amber ≥40, slate <40
  - **BR-46** (Rest Day Handling): If planned rest day → workout score = 100 (not penalized)
- **State Transitions**: Reactive — recomputes each render
- **Edge Cases**:
  - EC-32: No active plan → ALL days treated as "missed training" → workout score always 0 or 20/40
  - EC-33: `hour < 20` check for partial workout uses local time — DST transition could shift by 1 hour
  - EC-34: Editing a meal retroactively changes historical daily scores (no snapshot)
- **Issues Found**:
  - **BUG-09**: Rest day detection fails when no active plan exists. Users without a plan always get penalized on workout score, pushing daily score artificially low
  - **IMPROVEMENT-09**: Daily score should snapshot when day ends, not recompute from current state

---

### Flow 14: Draft Recovery

- **Trigger**: App launch after incomplete workout session
- **Pre-conditions**: `workout_drafts` table has `id='current'` row
- **Business Rules**:
  - **BR-47** (Singleton Draft): Only 1 draft at a time, keyed by `id='current'`
  - **BR-48** (Auto-Save): Draft persisted to SQLite on each update during logging
  - **BR-49** (Timer Reset): On recovery, `elapsedSeconds` reset to 0 (no time preservation)
  - **BR-50** (Clear on Complete): Draft deleted when workout is saved successfully
- **State Transitions**:
  ```
  app-launch → check-draft → draft-found → offer-recovery → resume|discard → logging|idle
  ```
- **Edge Cases**:
  - EC-35: Corrupt JSON in draft → warning logged, draft treated as empty (graceful)
  - EC-36: Draft references deleted planDay → recovery succeeds but planDayId invalid
  - EC-37: Multiple rapid saves → last-write-wins (INSERT OR REPLACE)
- **Issues Found**:
  - **IMPROVEMENT-10**: Timer not preserved means user loses session duration data on crash recovery

---

### Flow 15: Multi-session/day

- **Trigger**: Plan with >1 session scheduled on same day
- **Pre-conditions**: Plan day has `sessionOrder > 1`
- **Business Rules**:
  - **BR-51** (Max 3 Sessions/Day): Hard limit enforced in `addPlanDaySession()` and unique DB index
  - **BR-52** (Session Ordering): `sessionOrder` recalculated when sessions removed (sequential from 1)
  - **BR-53** (Cardio Double-Session): Cardio overflow from rest days placed as session 2 on training days (max 2)
  - **BR-54** (Short Session Splitting): If `sessionDurationMin ≤ 45` and day has 4+ exercises → auto-split
- **State Transitions**:
  ```
  single-session → session-added (up to 3) → session-removed → reorder
  ```
- **Edge Cases**:
  - EC-38: Race condition — 2 concurrent `addPlanDaySession` calls both see 2 sessions, both try to add 3rd → DB unique index prevents duplicate, but Zustand may have 4 sessions
  - EC-39: Removing session 1 of 3 → reorder: session 2→1, session 3→2 (correct)
  - EC-40: Dashboard `useTodaysPlan` only shows PRIMARY plan day (session 1) — sessions 2-3 invisible
- **Issues Found**:
  - **BUG-10**: `useTodaysPlan` shows only the first plan day for today, ignoring multi-session days. User sees "training pending" even after completing session 1 if session 2 exists
  - **BUG-11**: Race condition in `addPlanDaySession` — Zustand count check (line 266) isn't atomic with state update

---

### Flow 16: Template System

- **Trigger**: User browsing templates or saving current plan as template
- **Pre-conditions**: For save: active plan with ≥1 day
- **Business Rules**:
  - **BR-55** (Template Scoring):
    ```
    Days match    (30%): exact=1.0, ±1=0.5, else=0
    Goal match    (25%): exact=1.0, 'general'=0.5, else=0
    Experience    (20%): 'all' or exact=1.0, adjacent=0.5, else=0
    Equipment     (15%): intersection/union ratio
    Popularity    (10%): score/100, clamped [0,1]
    ```
  - **BR-56** (Builtin Always Available): Hard-coded in `builtinTemplates.ts`, always returned
  - **BR-57** (Template Application Destructive): Deletes all existing plan days, creates new from template
  - **BR-58** (Day Adjustment): If template requires fewer sessions than plan's `daysPerWeek`, adjusts `trainingDays` array
- **State Transitions**:
  ```
  browsing → template-selected → preview → apply → plan-updated
  ```
- **Edge Cases**:
  - EC-41: `getTemplates()` returns immediately with builtins, loads user templates ASYNC → `getRecommendedTemplates()` may miss user templates on first call
  - EC-42: Template with equipment user doesn't have → applied anyway (no validation)
  - EC-43: Saving template from plan with modified exercises preserves modifications (feature)
- **Issues Found**:
  - **BUG-12**: `getTemplates()` has a race condition — user templates loaded via `.then()` callback, not awaited. `getRecommendedTemplates()` immediately calls `getTemplates()` and only gets builtin templates. User templates never appear in recommendations unless called again after async resolves.
  - **IMPROVEMENT-11**: Template application should validate equipment compatibility before applying

---

## 3. Cross-Feature Business Rules Matrix

| Source → Target                 | Rule                                        | Enforcement                                       | Issues                                                 |
| ------------------------------- | ------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| **Fitness → Nutrition Display** | Burned calories adjust "net calories"       | `useTodayCaloriesOut` hook                        | ✅ Used in Dashboard + EnergyDetailSheet               |
| **Fitness → Dashboard Score**   | Workout completion = 25% of daily score     | `useDailyScore` weighted average                  | ⚠️ No-plan penalty (BUG-09)                            |
| **Fitness → Dashboard Plan**    | Today's workout status shown on dashboard   | `useTodaysPlan` state machine                     | ⚠️ Multi-session blind (BUG-10)                        |
| **Fitness → Nutrition Insight** | Training day + low intake = warning         | `useFitnessNutritionBridge`                       | ⚠️ Ignores burned calories (BUG-07)                    |
| **Fitness → Activity Level**    | 4-week analysis suggests level change       | `useActivityMultiplier`                           | ⚠️ Only upward (BUG-08)                                |
| **Onboarding → Fitness**        | Profile drives initial plan generation      | `setTrainingProfile()` + `generateTrainingPlan()` | ⚠️ No validation of contradictions (beginner + 6 days) |
| **Health Profile → Fitness**    | Weight used in calorie burn calculation     | `estimateCardioBurn(weightKg)`                    | ⚠️ Weight=0 → calories=0                               |
| **Fitness → Health Profile**    | Weight entries update health profile weight | Through `WeightEntry` → HealthProfile bridge      | ⚠️ Not automatic — user must apply                     |
| **Fitness → Calendar**          | Workout dots on calendar days               | Calendar reads `workouts` by date                 | ✅ Consistent (date string match)                      |
| **Feedback Loop → Fitness**     | Weight trend adjusts calorie offset         | `useFeedbackLoop` → `calorieOffset`               | ⚠️ Ignores training load entirely                      |

---

## 4. Business Logic Issues Summary

| #          | Type                | Severity | Description                                                                                              | Affected Flows |
| ---------- | ------------------- | -------- | -------------------------------------------------------------------------------------------------------- | -------------- |
| BUG-01     | Data Integrity      | LOW      | `addTrainingPlan()` allows duplicate IDs in Zustand array                                                | Flow 1         |
| BUG-02     | Data Loss           | MEDIUM   | `updateWorkoutSet()` / `removeWorkoutSet()` don't write to SQLite — changes lost on restart              | Flow 2         |
| BUG-03     | Data Integrity      | MEDIUM   | `deleteWorkout()` uses 2 non-transactional DELETE queries — orphaned sets possible                       | Flow 2         |
| BUG-04     | Data Loss           | HIGH     | Split change (Flow 5) DELETE + INSERT not atomic — plan days lost if INSERT fails                        | Flow 5         |
| BUG-05     | Logic Error         | LOW      | Periodic deload at `weekNumber % cycle === 0` but weekNumber starts at 1 → cycle boundary off-by-one     | Flow 8         |
| **BUG-06** | **Corrected**       | **LOW**  | **`useTodayCaloriesOut` IS used in Dashboard/EnergySheet for net calc; but nutrition bridge ignores it** | **Flow 9, 10** |
| BUG-07     | Missing Integration | HIGH     | Nutrition bridge ignores burned calories — insights don't account for exercise energy expenditure        | Flow 10        |
| BUG-08     | Logic Gap           | MEDIUM   | Activity level suggestion only suggests upward — never suggests decreasing level                         | Flow 11        |
| BUG-09     | Logic Error         | HIGH     | Daily score penalizes workout factor when no plan exists (rest days undetectable)                        | Flow 13        |
| BUG-10     | Missing Feature     | MEDIUM   | `useTodaysPlan` shows only session 1 — multi-session days partially invisible                            | Flow 15        |
| BUG-11     | Race Condition      | LOW      | `addPlanDaySession` count check not atomic with state update                                             | Flow 15        |
| BUG-12     | Race Condition      | MEDIUM   | `getTemplates()` returns before async user templates load → recommendations miss user templates          | Flow 16        |
| IMP-01     | UX                  | LOW      | No warning when exercise selection falls back to bodyweight                                              | Flow 1         |
| IMP-02     | Dead Feature        | LOW      | Cardio calories calculated but never consumed                                                            | Flow 3, 9      |
| IMP-03     | Silent Failure      | LOW      | `updatePlanDayExercises()` silently succeeds for non-existent dayId                                      | Flow 4         |
| IMP-04     | Data Safety         | HIGH     | Split change should use SQLite transaction                                                               | Flow 5         |
| IMP-05     | UX                  | LOW      | No user override for weight increment in progressive overload                                            | Flow 6         |
| IMP-06     | Accuracy            | LOW      | Plateau detection doesn't consider RPE — same weight at lower RPE ≠ plateau                              | Flow 7         |
| IMP-07     | Safety              | LOW      | Low-confidence activity suggestion should be blocked, not just informational                             | Flow 11        |
| IMP-08     | Missing Feature     | LOW      | Gamification has milestones/PRs but no XP/leveling system                                                | Flow 12        |
| IMP-09     | Accuracy            | MEDIUM   | Daily score recomputes from live data, not snapshotted — historical scores mutable                       | Flow 13        |
| IMP-10     | UX                  | LOW      | Draft recovery resets timer to 0 — session duration lost                                                 | Flow 14        |
| IMP-11     | Validation          | LOW      | Template application doesn't validate equipment compatibility                                            | Flow 16        |

### Systemic Issues

| #      | Category                    | Description                                                                                                                                        | Impact              |
| ------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| SYS-01 | **Zustand ↔ SQLite Desync** | 20+ actions update Zustand optimistically but write to SQLite via fire-and-forget. If DB write fails, state diverges silently. No retry mechanism. | All persisted flows |
| SYS-02 | **Silent Failures**         | ~20 actions exit silently when preconditions fail (no console error, no user notification). Makes debugging extremely difficult.                   | All flows           |
| SYS-03 | **No Locking**              | No optimistic locking or mutex on concurrent store actions. `autoAssignWorkouts`, `changeSplitType`, `addPlanDaySession` can race.                 | Flows 1, 5, 15      |
| SYS-04 | **Type Unsafety**           | Heavy `as` casting in `initializeFromSQLite()` without runtime validation. Corrupted DB data silently becomes incorrect TypeScript objects.        | Initialization      |

---

## 5. Recommendations

### Priority 1: Critical (Blocks core functionality)

1. **Make split change atomic** (BUG-04 + IMP-04): Wrap `changeSplitType()` DELETE + INSERT operations in a SQLite transaction. Currently, a failed INSERT after successful DELETE leaves the user with 0 plan days.

2. **Fix daily score for planless users** (BUG-09): When no active plan exists, treat all days as neutral for workout score (50pts) instead of penalizing (0pts). Alternatively, adjust weight distribution when plan isn't available.

3. **Integrate burned calories into nutrition bridge** (BUG-07): `useFitnessNutritionBridge` should consider exercise energy expenditure from `useTodayCaloriesOut` when generating deficit/surplus insights. Currently, a user who burned 500cal gets same warning as one who burned 0.

### Priority 2: High (Data integrity risks)

4. **Add SQLite writes to `updateWorkoutSet` / `removeWorkoutSet`** (BUG-02): Currently these only update Zustand state. Add corresponding UPDATE/DELETE SQL operations to prevent data loss on restart.

5. **Transaction for `deleteWorkout`** (BUG-03): Wrap the 2 DELETE operations in a single transaction to prevent orphaned workout_sets.

6. **Add bidirectional activity level suggestion** (BUG-08): Implement downward adjustment when training volume decreases. This prevents TDEE inflation for users who reduce training.

7. **Fix multi-session visibility in `useTodaysPlan`** (BUG-10): Show all sessions for today, not just session 1. Display completion status per session.

### Priority 3: Medium (Quality improvements)

8. **Add retry/reconciliation for failed SQLite writes** (SYS-01): Implement a write queue or retry mechanism for fire-and-forget DB operations. Log failures prominently.

9. **Fix template recommendation race** (BUG-12): Make `getTemplates()` properly await user template loading, or cache results after first successful load.

10. **Add silent failure logging** (SYS-02): At minimum, console.warn when preconditions fail silently.

### Priority 4: Low (Polish & completeness)

11. **Add RPE to plateau detection** (IMP-06): Same weight at lower RPE is progress, not plateau.
12. **Snapshot daily scores** (IMP-09): Freeze score at end of day to prevent historical mutation.
13. **Preserve timer in draft recovery** (IMP-10): Save `elapsedSeconds` to draft, restore on recovery.
14. **Validate contradictions in onboarding** (beginner + 6 days, endurance goal + 2 days, etc.)
15. **Add silent failure logging** (SYS-02): At minimum, console.warn when preconditions fail silently.
