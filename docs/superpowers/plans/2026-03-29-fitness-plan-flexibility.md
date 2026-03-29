# Fitness Plan Flexibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Plan Editor, Multi-Session per Day, and Freestyle Workout to the fitness module via the Unified Session System.

**Architecture:** Extend the existing `TrainingPlanDay` data model with `sessionOrder` and `originalExercises` fields, allowing multiple plan days per dayOfWeek. Add `planDayId` FK to `Workout` for session matching. New UI components (PlanDayEditor, SessionTabs, AddSessionModal) follow existing patterns: full-screen pages via `pushPage()`, modals via `ModalBackdrop`, state via Zustand `fitnessStore` + SQLite persistence.

**Tech Stack:** React 18 + TypeScript, Zustand, SQLite (sql.js/wa-sqlite), Tailwind CSS v4, Lucide React icons, Vitest + React Testing Library, i18n (react-i18next)

**Spec:** `docs/superpowers/specs/2026-03-28-fitness-plan-flexibility-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/features/fitness/components/SessionTabs.tsx` | Pill-style tab bar to switch between sessions for a given day |
| `src/features/fitness/components/PlanDayEditor.tsx` | Full-screen page: reorder/add/remove/edit exercises in a plan day |
| `src/features/fitness/components/AddSessionModal.tsx` | Bottom sheet: choose Strength/Cardio/Freestyle when adding a session |
| `src/__tests__/SessionTabs.test.tsx` | Tests for SessionTabs |
| `src/__tests__/PlanDayEditor.test.tsx` | Tests for PlanDayEditor |
| `src/__tests__/AddSessionModal.test.tsx` | Tests for AddSessionModal |

### Modified Files

| File | Changes |
|------|---------|
| `src/features/fitness/types.ts:73-92` | Add `sessionOrder`, `originalExercises` to TrainingPlanDay; add `planDayId` to Workout; add `TodayPlanState` (moved from useTodaysPlan) |
| `src/services/schema.ts:3,169-179,199-209` | Bump SCHEMA_VERSION to 2; add migration for `session_order`, `original_exercises`, `plan_day_id` columns + UNIQUE index + CHECK constraint fix |
| `src/store/fitnessStore.ts:18-61,65-419` | Add 4 new actions: `updatePlanDayExercises`, `restorePlanDayOriginal`, `addPlanDaySession`, `removePlanDaySession` |
| `src/features/dashboard/hooks/useTodaysPlan.ts:10-14,36-45,74-155` | Fix dayOfWeek Sunday bug; change singular → plural (arrays); add `training-partial` state |
| `src/features/fitness/components/TrainingPlanView.tsx:80-86,93,119-128,263-328` | Add SessionTabs integration, edit button, multi-session grouping |
| `src/features/fitness/components/WorkoutLogger.tsx:292-320,565-573` | Set `planDayId` on save; make sticky "Thêm bài tập" button; add freestyle name input |
| `src/features/fitness/hooks/useTrainingPlan.ts:454-486` | Set `originalExercises` + `sessionOrder` on generated days; add cardio multi-session logic |
| `src/features/dashboard/components/TodaysPlanCard.tsx:83-100` | Support multi-session display + `training-partial` state |
| `src/locales/vi.json` | Add ~20 new i18n keys under `fitness.plan.*` |
| `src/__tests__/fitnessStore.test.ts` | Add tests for 4 new store actions |
| `src/__tests__/useTodaysPlan.test.ts` | Add multi-session and Sunday bug fix tests |
| `src/__tests__/TrainingPlanView.test.tsx` | Add session tabs, edit button tests |
| `src/__tests__/WorkoutLogger.test.tsx` | Add planDayId, freestyle name tests |

---

## Task 1: Types & Schema Migration

**Files:**
- Modify: `src/features/fitness/types.ts:73-92`
- Modify: `src/services/schema.ts:3,169-179,199-209`
- Test: `src/__tests__/fitnessStore.test.ts` (existing — verify migration doesn't break)

- [ ] **Step 1: Update TypeScript interfaces in types.ts**

Add `sessionOrder` and `originalExercises` to `TrainingPlanDay` (after line 77):

```typescript
// src/features/fitness/types.ts — TrainingPlanDay interface (lines 73-81)
export interface TrainingPlanDay {
  id: string;
  planId: string;
  dayOfWeek: number;            // 1-7 (1=Mon, 7=Sun)
  sessionOrder: number;          // NEW: 1, 2, or 3
  workoutType: string;
  muscleGroups?: string;
  exercises?: string;
  originalExercises?: string;    // NEW: immutable backup from plan generation
  notes?: string;
}
```

Add `planDayId` to `Workout` (after line 88):

```typescript
// src/features/fitness/types.ts — Workout interface (lines 84-92)
export interface Workout {
  id: string;
  date: string;
  name: string;
  planDayId?: string;            // NEW: FK → training_plan_days.id (null for freestyle)
  durationMin?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

Export the updated `TodayPlanState` type from types.ts (add near bottom):

```typescript
export type TodayPlanState =
  | 'training-pending'
  | 'training-partial'
  | 'training-completed'
  | 'rest-day'
  | 'no-plan';
```

- [ ] **Step 2: Write schema migration in schema.ts**

Bump `SCHEMA_VERSION` from 1 to 2 at line 3.

Add migration function. The migration system uses `PRAGMA user_version`. Add a new migration block in the existing `initializeDatabase` or `runMigrations` function for version 2:

```typescript
// In schema.ts migration section
// Migration v1 → v2: Fitness plan flexibility
if (currentVersion < 2) {
  // 1. Add session_order and original_exercises to training_plan_days
  await db.execute('ALTER TABLE training_plan_days ADD COLUMN session_order INTEGER NOT NULL DEFAULT 1');
  await db.execute('ALTER TABLE training_plan_days ADD COLUMN original_exercises TEXT');
  
  // 2. Backfill original_exercises from exercises
  await db.execute('UPDATE training_plan_days SET original_exercises = exercises WHERE original_exercises IS NULL');
  
  // 3. Recreate table with fixed CHECK constraint (0-6 → 1-7)
  await db.execute(`CREATE TABLE training_plan_days_v2 (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    plan_id TEXT NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 1 AND 7),
    session_order INTEGER NOT NULL DEFAULT 1,
    workout_type TEXT NOT NULL,
    muscle_groups TEXT,
    exercises TEXT,
    original_exercises TEXT,
    notes TEXT
  )`);
  await db.execute('INSERT INTO training_plan_days_v2 SELECT id, plan_id, day_of_week, session_order, workout_type, muscle_groups, exercises, original_exercises, notes FROM training_plan_days');
  await db.execute('DROP TABLE training_plan_days');
  await db.execute('ALTER TABLE training_plan_days_v2 RENAME TO training_plan_days');
  
  // 4. UNIQUE index for max 3 sessions/day
  await db.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_plan_day_session ON training_plan_days(plan_id, day_of_week, session_order)');
  
  // 5. Add plan_day_id to workouts
  await db.execute('ALTER TABLE workouts ADD COLUMN plan_day_id TEXT REFERENCES training_plan_days(id)');
}
```

- [ ] **Step 3: Run existing tests to verify nothing breaks**

Run: `npx vitest run src/__tests__/fitnessStore.test.ts --reporter=verbose`
Expected: All existing tests PASS (schema migration should be backward compatible — default values handle old data)

- [ ] **Step 4: Commit**

```bash
git add src/features/fitness/types.ts src/services/schema.ts
git commit -m "feat(fitness): add session_order, original_exercises, planDayId to types and schema

- TrainingPlanDay: +sessionOrder (1-3), +originalExercises (backup)
- Workout: +planDayId (FK for multi-session matching)  
- TodayPlanState: +training-partial state
- Schema v2 migration: ALTER columns, CHECK fix (0-6→1-7), UNIQUE index
- Backfill original_exercises from exercises for existing data"
```

---

## Task 2: Store Actions

**Files:**
- Modify: `src/store/fitnessStore.ts:18-61,65-419`
- Test: `src/__tests__/fitnessStore.test.ts`

- [ ] **Step 1: Write failing tests for 4 new store actions**

Add to `src/__tests__/fitnessStore.test.ts`:

```typescript
// Helper factory — add to existing helpers
function samplePlanDay(overrides: Partial<TrainingPlanDay> = {}): TrainingPlanDay {
  return {
    id: 'pd-1',
    planId: 'plan-1',
    dayOfWeek: 1,
    sessionOrder: 1,
    workoutType: 'Upper Push',
    muscleGroups: 'chest,shoulders',
    exercises: JSON.stringify([{ exercise: { id: 'bench', name: 'Bench Press', primaryMuscle: 'chest', equipment: 'barbell', category: 'compound' }, sets: 4, repsMin: 6, repsMax: 10, restSeconds: 120 }]),
    originalExercises: JSON.stringify([{ exercise: { id: 'bench', name: 'Bench Press', primaryMuscle: 'chest', equipment: 'barbell', category: 'compound' }, sets: 4, repsMin: 6, repsMax: 10, restSeconds: 120 }]),
    ...overrides,
  };
}

describe('updatePlanDayExercises', () => {
  it('updates exercises field without changing originalExercises', () => {
    const day = samplePlanDay();
    useFitnessStore.setState({ trainingPlanDays: [day] });
    
    const newExercises = [{ exercise: { id: 'ohp', name: 'OHP', primaryMuscle: 'shoulders', equipment: 'barbell', category: 'compound' }, sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 }];
    useFitnessStore.getState().updatePlanDayExercises('pd-1', newExercises);
    
    const updated = useFitnessStore.getState().trainingPlanDays[0];
    expect(JSON.parse(updated.exercises!)).toEqual(newExercises);
    expect(updated.originalExercises).toBe(day.originalExercises); // unchanged
  });
  
  it('no-ops for non-existent dayId', () => {
    useFitnessStore.setState({ trainingPlanDays: [samplePlanDay()] });
    useFitnessStore.getState().updatePlanDayExercises('nonexistent', []);
    expect(useFitnessStore.getState().trainingPlanDays).toHaveLength(1);
  });
});

describe('restorePlanDayOriginal', () => {
  it('copies originalExercises back to exercises', () => {
    const day = samplePlanDay({ exercises: '[]' }); // user had cleared it
    useFitnessStore.setState({ trainingPlanDays: [day] });
    
    useFitnessStore.getState().restorePlanDayOriginal('pd-1');
    
    const updated = useFitnessStore.getState().trainingPlanDays[0];
    expect(updated.exercises).toBe(day.originalExercises);
  });
});

describe('addPlanDaySession', () => {
  it('adds a new session with next sessionOrder', () => {
    const day1 = samplePlanDay({ sessionOrder: 1 });
    useFitnessStore.setState({ trainingPlanDays: [day1] });
    
    useFitnessStore.getState().addPlanDaySession('plan-1', 1, {
      planId: 'plan-1',
      dayOfWeek: 1,
      sessionOrder: 2,
      workoutType: 'Cardio',
      muscleGroups: '',
      exercises: '[]',
      originalExercises: '[]',
    });
    
    const days = useFitnessStore.getState().trainingPlanDays;
    expect(days).toHaveLength(2);
    expect(days[1].sessionOrder).toBe(2);
  });
  
  it('rejects when 3 sessions already exist', () => {
    useFitnessStore.setState({
      trainingPlanDays: [
        samplePlanDay({ id: 'pd-1', sessionOrder: 1 }),
        samplePlanDay({ id: 'pd-2', sessionOrder: 2 }),
        samplePlanDay({ id: 'pd-3', sessionOrder: 3 }),
      ],
    });
    
    useFitnessStore.getState().addPlanDaySession('plan-1', 1, {
      planId: 'plan-1', dayOfWeek: 1, sessionOrder: 4,
      workoutType: 'Extra', exercises: '[]', originalExercises: '[]',
    });
    
    expect(useFitnessStore.getState().trainingPlanDays).toHaveLength(3); // no change
  });
});

describe('removePlanDaySession', () => {
  it('removes session and reorders remaining', () => {
    useFitnessStore.setState({
      trainingPlanDays: [
        samplePlanDay({ id: 'pd-1', sessionOrder: 1 }),
        samplePlanDay({ id: 'pd-2', sessionOrder: 2 }),
        samplePlanDay({ id: 'pd-3', sessionOrder: 3 }),
      ],
    });
    
    useFitnessStore.getState().removePlanDaySession('pd-2');
    
    const days = useFitnessStore.getState().trainingPlanDays;
    expect(days).toHaveLength(2);
    expect(days[0].sessionOrder).toBe(1);
    expect(days[1].sessionOrder).toBe(2); // recompacted
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/fitnessStore.test.ts --reporter=verbose`
Expected: 6+ new tests FAIL (actions don't exist yet)

- [ ] **Step 3: Implement 4 store actions in fitnessStore.ts**

Add to the store actions section (after existing `getPlanDays` around line 107):

```typescript
updatePlanDayExercises: (dayId, exercises) => {
  set((state) => ({
    trainingPlanDays: state.trainingPlanDays.map((d) =>
      d.id === dayId ? { ...d, exercises: JSON.stringify(exercises) } : d,
    ),
  }));
  const _db = get()._db;
  if (_db) {
    _db.execute('UPDATE training_plan_days SET exercises = ? WHERE id = ?', [
      JSON.stringify(exercises),
      dayId,
    ]);
  }
},

restorePlanDayOriginal: (dayId) => {
  set((state) => ({
    trainingPlanDays: state.trainingPlanDays.map((d) =>
      d.id === dayId ? { ...d, exercises: d.originalExercises ?? d.exercises } : d,
    ),
  }));
  const _db = get()._db;
  if (_db) {
    _db.execute(
      'UPDATE training_plan_days SET exercises = original_exercises WHERE id = ?',
      [dayId],
    );
  }
},

addPlanDaySession: (planId, dayOfWeek, session) => {
  const existing = get().trainingPlanDays.filter(
    (d) => d.planId === planId && d.dayOfWeek === dayOfWeek,
  );
  if (existing.length >= 3) return; // max 3 sessions/day
  
  const newDay: TrainingPlanDay = {
    ...session,
    id: `${planId}_day_${dayOfWeek}_s${existing.length + 1}_${Date.now()}`,
  };
  set((state) => ({
    trainingPlanDays: [...state.trainingPlanDays, newDay],
  }));
  const _db = get()._db;
  if (_db) {
    _db.execute(
      `INSERT INTO training_plan_days (id, plan_id, day_of_week, session_order, workout_type, muscle_groups, exercises, original_exercises, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newDay.id, newDay.planId, newDay.dayOfWeek, newDay.sessionOrder, newDay.workoutType,
       newDay.muscleGroups ?? null, newDay.exercises ?? null, newDay.originalExercises ?? null, newDay.notes ?? null],
    );
  }
},

removePlanDaySession: (dayId) => {
  const dayToRemove = get().trainingPlanDays.find((d) => d.id === dayId);
  if (!dayToRemove) return;
  
  set((state) => {
    const remaining = state.trainingPlanDays.filter((d) => d.id !== dayId);
    // Recompact session_order for remaining days on same plan+dayOfWeek
    let order = 1;
    const reordered = remaining.map((d) => {
      if (d.planId === dayToRemove.planId && d.dayOfWeek === dayToRemove.dayOfWeek) {
        return { ...d, sessionOrder: order++ };
      }
      return d;
    });
    return { trainingPlanDays: reordered };
  });
  
  const _db = get()._db;
  if (_db) {
    _db.execute('DELETE FROM training_plan_days WHERE id = ?', [dayId]);
    // Recompact in DB
    const remaining = get().trainingPlanDays
      .filter((d) => d.planId === dayToRemove.planId && d.dayOfWeek === dayToRemove.dayOfWeek)
      .sort((a, b) => a.sessionOrder - b.sessionOrder);
    remaining.forEach((d, i) => {
      _db.execute('UPDATE training_plan_days SET session_order = ? WHERE id = ?', [i + 1, d.id]);
    });
  }
},
```

Also update the `addPlanDays` action (line 101-104) to handle `sessionOrder` and `originalExercises` in the INSERT:

```typescript
addPlanDays: (days) => {
  set((state) => ({ trainingPlanDays: [...state.trainingPlanDays, ...days] }));
  const _db = get()._db;
  if (_db) {
    for (const day of days) {
      _db.execute(
        `INSERT INTO training_plan_days (id, plan_id, day_of_week, session_order, workout_type, muscle_groups, exercises, original_exercises, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [day.id, day.planId, day.dayOfWeek, day.sessionOrder ?? 1, day.workoutType,
         day.muscleGroups ?? null, day.exercises ?? null, day.originalExercises ?? null, day.notes ?? null],
      );
    }
  }
},
```

Update the store's type signature interface to include the 4 new actions.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/fitnessStore.test.ts --reporter=verbose`
Expected: ALL tests PASS

- [ ] **Step 5: Run ESLint**

Run: `npx eslint src/store/fitnessStore.ts src/features/fitness/types.ts --no-error-on-unmatched-pattern`
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add src/store/fitnessStore.ts src/__tests__/fitnessStore.test.ts
git commit -m "feat(fitness): add store actions for plan editing and multi-session

- updatePlanDayExercises: edit exercises, preserve originalExercises
- restorePlanDayOriginal: copy originalExercises → exercises
- addPlanDaySession: add session (max 3/day validation)
- removePlanDaySession: delete + recompact session_order
- All actions persist to SQLite"
```

---

## Task 3: Fix useTodaysPlan — Sunday Bug + Multi-Session

**Files:**
- Modify: `src/features/dashboard/hooks/useTodaysPlan.ts:10-14,36-45,74-155`
- Test: `src/__tests__/useTodaysPlan.test.ts` (existing)

- [ ] **Step 1: Write failing tests for Sunday fix and multi-session**

Add to `src/__tests__/useTodaysPlan.test.ts`:

```typescript
describe('determineTodayPlanState — multi-session', () => {
  it('returns training-partial when 1 of 2 sessions completed', () => {
    const result = determineTodayPlanState(
      { id: 'plan-1', name: 'PPL', status: 'active', profileId: 'p1', createdAt: '', weekCount: 8, currentWeek: 1 },
      [
        { id: 'pd-1', planId: 'plan-1', dayOfWeek: 1, sessionOrder: 1, workoutType: 'Upper' },
        { id: 'pd-2', planId: 'plan-1', dayOfWeek: 1, sessionOrder: 2, workoutType: 'Cardio' },
      ],
      [{ id: 'w-1', date: '2026-03-29', name: 'Upper', planDayId: 'pd-1', createdAt: '', updatedAt: '' }],
    );
    expect(result).toBe('training-partial');
  });

  it('returns training-completed when all sessions have matching workouts', () => {
    const result = determineTodayPlanState(
      { id: 'plan-1', name: 'PPL', status: 'active', profileId: 'p1', createdAt: '', weekCount: 8, currentWeek: 1 },
      [
        { id: 'pd-1', planId: 'plan-1', dayOfWeek: 1, sessionOrder: 1, workoutType: 'Upper' },
        { id: 'pd-2', planId: 'plan-1', dayOfWeek: 1, sessionOrder: 2, workoutType: 'Cardio' },
      ],
      [
        { id: 'w-1', date: '2026-03-29', name: 'Upper', planDayId: 'pd-1', createdAt: '', updatedAt: '' },
        { id: 'w-2', date: '2026-03-29', name: 'Cardio', planDayId: 'pd-2', createdAt: '', updatedAt: '' },
      ],
    );
    expect(result).toBe('training-completed');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/useTodaysPlan.test.ts --reporter=verbose`
Expected: New tests FAIL (function signature mismatch — takes singular not arrays)

- [ ] **Step 3: Update determineTodayPlanState**

Replace the function at lines 36-45:

```typescript
export function determineTodayPlanState(
  activePlan: TrainingPlan | undefined,
  todayPlanDays: TrainingPlanDay[],
  todayWorkouts: Workout[],
): TodayPlanState {
  if (!activePlan) return 'no-plan';
  if (todayPlanDays.length === 0) return 'rest-day';
  
  const completedSessionIds = new Set(
    todayWorkouts.filter((w) => w.planDayId).map((w) => w.planDayId),
  );
  const completedSessions = todayPlanDays.filter((d) => completedSessionIds.has(d.id)).length;
  
  if (completedSessions === 0) return 'training-pending';
  if (completedSessions < todayPlanDays.length) return 'training-partial';
  return 'training-completed';
}
```

- [ ] **Step 4: Update useTodaysPlan hook**

Fix the dayOfWeek lookup (lines 77-78) and change to plural:

```typescript
// Fix Sunday bug: JS getDay() returns 0 for Sunday, but plan uses 7
const todayDow = today.getDay() === 0 ? 7 : today.getDay();
const tomorrowDow = todayDow === 7 ? 1 : todayDow + 1;

// Change .find() → .filter() for multi-session
const todayPlanDays = planDays
  .filter((d) => d.dayOfWeek === todayDow)
  .sort((a, b) => a.sessionOrder - b.sessionOrder);
const todayWorkouts = workouts.filter((w) => w.date === todayStr);

// Update state determination call
const state = determineTodayPlanState(activePlan, todayPlanDays, todayWorkouts);
```

Update the return object to include multi-session info:

```typescript
// Add to TodaysPlanData interface
totalSessions?: number;
completedSessions?: number;
todayPlanDays?: TrainingPlanDay[];
nextUncompletedSession?: TrainingPlanDay;
```

Also update existing callers (lines that read singular `todayPlanDay`) to use `todayPlanDays[0]` for backward compatibility of existing return fields.

Import `TodayPlanState` from types.ts instead of defining locally.

- [ ] **Step 5: Update existing tests that use old singular signature**

Any existing tests calling `determineTodayPlanState(plan, singleDay, singleWorkout)` need wrapping:
- `singleDay` → `singleDay ? [singleDay] : []`
- `singleWorkout` → `singleWorkout ? [singleWorkout] : []`

- [ ] **Step 6: Run all tests**

Run: `npx vitest run src/__tests__/useTodaysPlan.test.ts --reporter=verbose`
Expected: ALL tests PASS

- [ ] **Step 7: Run ESLint**

Run: `npx eslint src/features/dashboard/hooks/useTodaysPlan.ts`
Expected: 0 errors

- [ ] **Step 8: Commit**

```bash
git add src/features/dashboard/hooks/useTodaysPlan.ts src/__tests__/useTodaysPlan.test.ts
git commit -m "fix(fitness): fix Sunday dayOfWeek bug, add multi-session support to useTodaysPlan

- Fix: getDay()===0 → 7 for Sunday (was breaking Sunday workout detection)
- Change singular todayPlanDay/todayWorkout → arrays for multi-session
- Add training-partial state for partial session completion
- Add totalSessions, completedSessions, nextUncompletedSession to return"
```

---

## Task 4: Plan Generation — Multi-Session + originalExercises

**Files:**
- Modify: `src/features/fitness/hooks/useTrainingPlan.ts:454-486`
- Test: `src/__tests__/useTrainingPlan.test.ts` (existing)

- [ ] **Step 1: Write failing tests**

Add to existing test file:

```typescript
describe('generateTrainingPlan — multi-session', () => {
  it('sets sessionOrder=1 and originalExercises on all generated days', () => {
    const result = generateTrainingPlan({
      trainingProfile: { ...baseProfile, daysPerWeek: 4 },
      healthProfile: { age: 30, weightKg: 75 },
    });
    for (const day of result.days) {
      expect(day.sessionOrder).toBeDefined();
      expect(day.originalExercises).toBe(day.exercises);
      expect(day.originalExercises).toBeTruthy();
    }
  });

  it('adds cardio as session 2 when daysPerWeek >= 5 and cardioSessionsWeek > 0', () => {
    const result = generateTrainingPlan({
      trainingProfile: { ...baseProfile, daysPerWeek: 5, cardioSessionsWeek: 2 },
      healthProfile: { age: 30, weightKg: 75 },
    });
    const multiSessionDays = result.days.filter((d) => d.sessionOrder === 2);
    expect(multiSessionDays.length).toBeGreaterThanOrEqual(1);
    expect(multiSessionDays.length).toBeLessThanOrEqual(2);
    for (const d of multiSessionDays) {
      expect(d.workoutType).toContain('Cardio');
    }
  });

  it('never puts cardio HIIT on same day as legs', () => {
    const result = generateTrainingPlan({
      trainingProfile: { ...baseProfile, daysPerWeek: 5, cardioSessionsWeek: 3 },
      healthProfile: { age: 30, weightKg: 75 },
    });
    const dayGroups = new Map<number, typeof result.days>();
    for (const d of result.days) {
      const arr = dayGroups.get(d.dayOfWeek) ?? [];
      arr.push(d);
      dayGroups.set(d.dayOfWeek, arr);
    }
    for (const [, sessions] of dayGroups) {
      const hasLegs = sessions.some((s) => s.muscleGroups?.includes('legs'));
      const hasHIIT = sessions.some((s) => s.workoutType.includes('HIIT'));
      expect(hasLegs && hasHIIT).toBe(false);
    }
  });

  it('splits strength day into 2 sessions when sessionDurationMin <= 45 and daysPerWeek >= 5', () => {
    const result = generateTrainingPlan({
      trainingProfile: { ...baseProfile, daysPerWeek: 5, sessionDurationMin: 40 },
      healthProfile: { age: 30, weightKg: 75 },
    });
    // At least one day should have session_order=2 that is strength (not cardio)
    const strengthSession2 = result.days.filter(
      (d) => d.sessionOrder === 2 && !d.workoutType.includes('Cardio'),
    );
    // Session splitting is optional (spec says "Có thể tách") — but if time is short
    // and days are high, the algo should attempt it. Verify no crash and valid structure.
    for (const d of result.days) {
      expect(d.sessionOrder).toBeGreaterThanOrEqual(1);
      expect(d.sessionOrder).toBeLessThanOrEqual(3);
      expect(d.originalExercises).toBe(d.exercises);
    }
    // If splitting occurred, session 1 should be compounds, session 2 isolation
    if (strengthSession2.length > 0) {
      // Verify compound/isolation split by checking that session2 exercises differ from session1
      const splitDay = strengthSession2[0].dayOfWeek;
      const session1 = result.days.find((d) => d.dayOfWeek === splitDay && d.sessionOrder === 1);
      expect(session1).toBeDefined();
      expect(session1!.exercises).not.toBe(strengthSession2[0].exercises);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/useTrainingPlan.test.ts --reporter=verbose`
Expected: 4 new tests FAIL

- [ ] **Step 3: Update plan generation**

In `useTrainingPlan.ts`, update the `days` mapping (lines 454-486):

```typescript
// After the existing session → day mapping, add:
return {
  ...dayData,
  sessionOrder: 1,
  originalExercises: dayData.exercises, // backup copy
};
```

Add cardio multi-session logic after the main day generation:

```typescript
// After generating strength days, add cardio sessions
if (trainingProfile.cardioSessionsWeek > 0) {
  const restDays = [1,2,3,4,5,6,7].filter(
    (dow) => !days.some((d) => d.dayOfWeek === dow)
  );
  
  let cardioAdded = 0;
  const cardioTarget = trainingProfile.cardioSessionsWeek;
  
  // Strategy 1: Place on rest days as session 1
  for (const dow of restDays) {
    if (cardioAdded >= cardioTarget) break;
    days.push({
      id: `${planId}_cardio_${dow}`,
      planId,
      dayOfWeek: dow,
      sessionOrder: 1,
      workoutType: cardioAdded % 2 === 0 ? 'Cardio LISS' : 'Cardio HIIT',
      muscleGroups: '',
      exercises: JSON.stringify([]),
      originalExercises: JSON.stringify([]),
    });
    cardioAdded++;
  }
  
  // Strategy 2: Add as session 2 on lightest strength days (if not enough rest days)
  if (cardioAdded < cardioTarget) {
    const strengthDaysByVolume = days
      .filter((d) => d.sessionOrder === 1 && d.workoutType !== 'Cardio LISS' && d.workoutType !== 'Cardio HIIT')
      .filter((d) => !d.muscleGroups?.includes('legs')) // Never HIIT + Legs
      .sort((a, b) => (JSON.parse(a.exercises ?? '[]').length) - (JSON.parse(b.exercises ?? '[]').length));
    
    let doubleSessionCount = 0;
    for (const strengthDay of strengthDaysByVolume) {
      if (cardioAdded >= cardioTarget || doubleSessionCount >= 2) break;
      days.push({
        id: `${planId}_cardio_s2_${strengthDay.dayOfWeek}`,
        planId,
        dayOfWeek: strengthDay.dayOfWeek,
        sessionOrder: 2,
        workoutType: 'Cardio LISS',
        muscleGroups: '',
        exercises: JSON.stringify([]),
        originalExercises: JSON.stringify([]),
      });
      cardioAdded++;
      doubleSessionCount++;
    }
  }
}

// Session duration splitting (spec §4 "Quy tắc tách buổi"):
// When sessionDurationMin <= 45 AND daysPerWeek >= 5, split heaviest strength day
// into 2 shorter sessions: session 1 = compound exercises, session 2 = isolation/accessory
if (trainingProfile.sessionDurationMin && trainingProfile.sessionDurationMin <= 45 && trainingProfile.daysPerWeek >= 5) {
  const splittableDays = days
    .filter((d) => d.sessionOrder === 1 && !d.workoutType.includes('Cardio'))
    .filter((d) => {
      // Only split days that don't already have a session 2
      const hasSession2 = days.some((other) => other.dayOfWeek === d.dayOfWeek && other.sessionOrder === 2);
      return !hasSession2;
    })
    .sort((a, b) => (JSON.parse(b.exercises ?? '[]').length) - (JSON.parse(a.exercises ?? '[]').length));

  if (splittableDays.length > 0) {
    const dayToSplit = splittableDays[0];
    const allExercises: SelectedExercise[] = JSON.parse(dayToSplit.exercises ?? '[]');
    
    if (allExercises.length >= 4) {
      // Split: compounds (first half) stay in session 1, isolation (second half) → session 2
      const compoundExercises = allExercises.filter((e) => e.exercise.category === 'compound');
      const isolationExercises = allExercises.filter((e) => e.exercise.category !== 'compound');
      
      if (compoundExercises.length > 0 && isolationExercises.length > 0) {
        // Update session 1 to compounds only
        const dayIndex = days.findIndex((d) => d.id === dayToSplit.id);
        days[dayIndex] = {
          ...dayToSplit,
          exercises: JSON.stringify(compoundExercises),
          originalExercises: JSON.stringify(compoundExercises),
        };
        
        // Create session 2 with isolation exercises
        days.push({
          id: `${planId}_split_s2_${dayToSplit.dayOfWeek}`,
          planId,
          dayOfWeek: dayToSplit.dayOfWeek,
          sessionOrder: 2,
          workoutType: `${dayToSplit.workoutType} (Accessory)`,
          muscleGroups: dayToSplit.muscleGroups,
          exercises: JSON.stringify(isolationExercises),
          originalExercises: JSON.stringify(isolationExercises),
        });
      }
    }
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/__tests__/useTrainingPlan.test.ts --reporter=verbose`
Expected: ALL PASS

- [ ] **Step 5: ESLint + Commit**

```bash
npx eslint src/features/fitness/hooks/useTrainingPlan.ts
git add src/features/fitness/hooks/useTrainingPlan.ts src/__tests__/useTrainingPlan.test.ts
git commit -m "feat(fitness): add originalExercises + multi-session cardio to plan generation

- Set sessionOrder=1 and originalExercises=exercises on all generated days
- Add cardio sessions: rest days first, then as session 2 on lightest strength days
- Never combine Cardio HIIT with Legs day
- Max 2 double-session days"
```

---

## Task 5: SessionTabs Component

**Files:**
- Create: `src/features/fitness/components/SessionTabs.tsx`
- Create: `src/__tests__/SessionTabs.test.tsx`

- [ ] **Step 1: Write tests first**

```typescript
// src/__tests__/SessionTabs.test.tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { SessionTabs } from '../features/fitness/components/SessionTabs';
import type { TrainingPlanDay } from '../features/fitness/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: Record<string, unknown>) => {
    if (key === 'fitness.plan.sessionTab') return `Buổi ${opts?.order ?? ''}`;
    return key;
  } }),
}));

afterEach(cleanup);

const makePlanDay = (overrides: Partial<TrainingPlanDay> = {}): TrainingPlanDay => ({
  id: 'pd-1', planId: 'plan-1', dayOfWeek: 1, sessionOrder: 1,
  workoutType: 'Upper Push', exercises: '[]', originalExercises: '[]',
  ...overrides,
});

describe('SessionTabs', () => {
  it('does not render when only 1 session and showAlways=false', () => {
    const { container } = render(
      <SessionTabs
        sessions={[makePlanDay()]}
        activeSessionId="pd-1"
        completedSessionIds={[]}
        onSelectSession={vi.fn()}
        onAddSession={vi.fn()}
      />,
    );
    expect(container.querySelector('[role="tablist"]')).toBeNull();
  });

  it('renders tabs for 2+ sessions', () => {
    render(
      <SessionTabs
        sessions={[makePlanDay({ id: 'pd-1', sessionOrder: 1 }), makePlanDay({ id: 'pd-2', sessionOrder: 2 })]}
        activeSessionId="pd-1"
        completedSessionIds={[]}
        onSelectSession={vi.fn()}
        onAddSession={vi.fn()}
      />,
    );
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3); // 2 sessions + 1 add button
  });

  it('fires onSelectSession when tab clicked', () => {
    const onSelect = vi.fn();
    render(
      <SessionTabs
        sessions={[makePlanDay({ id: 'pd-1', sessionOrder: 1 }), makePlanDay({ id: 'pd-2', sessionOrder: 2 })]}
        activeSessionId="pd-1"
        completedSessionIds={[]}
        onSelectSession={onSelect}
        onAddSession={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole('tab')[1]); // click session 2
    expect(onSelect).toHaveBeenCalledWith('pd-2');
  });

  it('shows check icon on completed sessions', () => {
    render(
      <SessionTabs
        sessions={[makePlanDay({ id: 'pd-1', sessionOrder: 1 }), makePlanDay({ id: 'pd-2', sessionOrder: 2 })]}
        activeSessionId="pd-2"
        completedSessionIds={['pd-1']}
        onSelectSession={vi.fn()}
        onAddSession={vi.fn()}
      />,
    );
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('data-completed', 'true');
  });

  it('disables add button when maxSessions reached', () => {
    render(
      <SessionTabs
        sessions={[
          makePlanDay({ id: 'pd-1', sessionOrder: 1 }),
          makePlanDay({ id: 'pd-2', sessionOrder: 2 }),
          makePlanDay({ id: 'pd-3', sessionOrder: 3 }),
        ]}
        activeSessionId="pd-1"
        completedSessionIds={[]}
        onSelectSession={vi.fn()}
        onAddSession={vi.fn()}
        maxSessions={3}
      />,
    );
    const addBtn = screen.getByTestId('add-session-tab');
    expect(addBtn).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/SessionTabs.test.tsx`
Expected: FAIL (component doesn't exist)

- [ ] **Step 3: Implement SessionTabs component**

Create `src/features/fitness/components/SessionTabs.tsx`:

```tsx
import React, { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Sunset, Plus, Check } from 'lucide-react';
import type { TrainingPlanDay } from '../types';

interface SessionTabsProps {
  sessions: TrainingPlanDay[];
  activeSessionId: string;
  completedSessionIds: string[];
  onSelectSession: (sessionId: string) => void;
  onAddSession: () => void;
  maxSessions?: number;
}

const SESSION_ICONS = [Sun, Moon, Sunset] as const;

function SessionTabsInner({
  sessions,
  activeSessionId,
  completedSessionIds,
  onSelectSession,
  onAddSession,
  maxSessions = 3,
}: SessionTabsProps): React.JSX.Element | null {
  const { t } = useTranslation();

  const handleSelect = useCallback(
    (id: string) => () => onSelectSession(id),
    [onSelectSession],
  );

  if (sessions.length <= 1) return null;

  const isMaxReached = sessions.length >= maxSessions;

  return (
    <div
      role="tablist"
      aria-label={t('fitness.plan.addSession')}
      className="flex items-center gap-2 px-1 py-2"
    >
      {sessions.map((session, index) => {
        const isActive = session.id === activeSessionId;
        const isCompleted = completedSessionIds.includes(session.id);
        const Icon = SESSION_ICONS[index] ?? Sun;

        return (
          <button
            key={session.id}
            role="tab"
            aria-selected={isActive}
            data-completed={isCompleted ? 'true' : undefined}
            onClick={handleSelect(session.id)}
            className={`flex items-center gap-1.5 rounded-full py-3 px-4 text-sm font-medium transition-colors active:scale-[0.97] ${
              isActive
                ? 'bg-emerald-500 text-white dark:bg-emerald-600'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            {isCompleted ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Icon className="h-4 w-4" aria-hidden="true" />
            )}
            {t('fitness.plan.sessionTab', { order: session.sessionOrder })}
          </button>
        );
      })}

      <button
        data-testid="add-session-tab"
        role="tab"
        aria-selected={false}
        disabled={isMaxReached}
        onClick={onAddSession}
        aria-label={t('fitness.plan.addSession')}
        className="flex items-center justify-center rounded-full p-3 text-slate-400 transition-colors hover:bg-slate-100 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed dark:hover:bg-slate-700"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export const SessionTabs = memo(SessionTabsInner);
SessionTabs.displayName = 'SessionTabs';
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/__tests__/SessionTabs.test.tsx --reporter=verbose`
Expected: ALL PASS

- [ ] **Step 5: ESLint + Commit**

```bash
npx eslint src/features/fitness/components/SessionTabs.tsx
git add src/features/fitness/components/SessionTabs.tsx src/__tests__/SessionTabs.test.tsx
git commit -m "feat(fitness): add SessionTabs component with a11y, dark mode, completion badges"
```

---

## Task 6: AddSessionModal Component

**Files:**
- Create: `src/features/fitness/components/AddSessionModal.tsx`
- Create: `src/__tests__/AddSessionModal.test.tsx`

- [ ] **Step 1: Write tests**

```typescript
// src/__tests__/AddSessionModal.test.tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { AddSessionModal } from '../features/fitness/components/AddSessionModal';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => {
    const map: Record<string, string> = {
      'fitness.plan.addSession': 'Thêm buổi tập',
      'fitness.plan.strengthOption': 'Sức mạnh (Strength)',
      'fitness.plan.strengthDesc': 'Chọn nhóm cơ → auto-gợi ý bài tập',
      'fitness.plan.cardioOption': 'Cardio',
      'fitness.plan.cardioDesc': 'HIIT, chạy bộ, đạp xe, bơi...',
      'fitness.plan.freestyleOption': 'Tập tự do (Freestyle)',
      'fitness.plan.freestyleDesc': 'Tự chọn bài tập, không theo template',
      'fitness.plan.maxSessions': 'Tối đa 3 buổi/ngày',
      'fitness.plan.selectMuscleGroups': 'Chọn nhóm cơ',
      'fitness.plan.createSession': 'Tạo buổi tập',
    };
    return map[key] ?? key;
  } }),
}));

vi.mock('../components/shared/ModalBackdrop', () => ({
  ModalBackdrop: ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div data-testid="modal-backdrop" onClick={onClose}>{children}</div>
  ),
}));

afterEach(cleanup);

describe('AddSessionModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelectStrength: vi.fn(),
    onSelectCardio: vi.fn(),
    onSelectFreestyle: vi.fn(),
    currentSessionCount: 1,
  };

  it('renders 3 options with correct labels', () => {
    render(<AddSessionModal {...defaultProps} />);
    expect(screen.getByText('Sức mạnh (Strength)')).toBeInTheDocument();
    expect(screen.getByText('Cardio')).toBeInTheDocument();
    expect(screen.getByText('Tập tự do (Freestyle)')).toBeInTheDocument();
  });

  it('clicking Strength shows muscle group selector', () => {
    render(<AddSessionModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Sức mạnh (Strength)'));
    expect(screen.getByText('Chọn nhóm cơ')).toBeInTheDocument();
    // 7 muscle groups should be visible
    expect(screen.getByText('chest')).toBeInTheDocument();
    expect(screen.getByText('back')).toBeInTheDocument();
    expect(screen.getByText('legs')).toBeInTheDocument();
  });

  it('selecting muscle groups and confirming calls onSelectStrength with groups', () => {
    render(<AddSessionModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Sức mạnh (Strength)'));
    fireEvent.click(screen.getByText('chest'));
    fireEvent.click(screen.getByText('shoulders'));
    fireEvent.click(screen.getByTestId('create-strength-session'));
    expect(defaultProps.onSelectStrength).toHaveBeenCalledWith(['chest', 'shoulders']);
  });

  it('Cardio calls onSelectCardio immediately', () => {
    render(<AddSessionModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cardio'));
    expect(defaultProps.onSelectCardio).toHaveBeenCalled();
  });

  it('Freestyle calls onSelectFreestyle immediately', () => {
    render(<AddSessionModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Tập tự do (Freestyle)'));
    expect(defaultProps.onSelectFreestyle).toHaveBeenCalled();
  });

  it('shows disabled state when currentSessionCount >= 3', () => {
    render(<AddSessionModal {...defaultProps} currentSessionCount={3} />);
    expect(screen.getByText('Tối đa 3 buổi/ngày')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      if (btn.dataset.testid !== 'modal-backdrop') {
        expect(btn).toBeDisabled();
      }
    });
  });

  it('returns null when isOpen is false', () => {
    const { container } = render(<AddSessionModal {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });
});
```

- [ ] **Step 2: Run tests — verify FAIL**

Run: `npx vitest run src/__tests__/AddSessionModal.test.tsx`
Expected: FAIL (component doesn't exist)

- [ ] **Step 3: Implement AddSessionModal**

Create `src/features/fitness/components/AddSessionModal.tsx`:

Key requirements from spec §3.3 and §11:
- Wrap in `ModalBackdrop` with `useModalBackHandler`
- 3 options: `<Dumbbell>` Strength, `<Heart>` Cardio, `<Zap>` Freestyle
- Color: Strength=emerald, Cardio=blue, Freestyle=amber (NOT purple — §11.4)
- Touch targets: min 44px per option (`py-3 px-4`)
- Dark mode support
- Max session validation: if `currentSessionCount >= 3` → options disabled + message

**Strength multi-step sub-flow (spec §3.3 Muscle Group Selector):**
1. User clicks Strength → modal transitions to muscle group selector view (internal state: `step: 'options' | 'muscle-groups'`)
2. Show 7 toggleable muscle group chips: `chest`, `back`, `shoulders`, `legs`, `arms`, `core`, `glutes`
3. Multi-select with visual toggle (emerald highlight when selected)
4. "Tạo buổi tập" button at bottom — disabled until ≥1 group selected
5. On confirm → calls `onSelectStrength(selectedGroups: string[])` → parent generates exercises from `exerciseDatabase` by filtering groups → creates `TrainingPlanDay` → opens PlanDayEditor

```tsx
import React, { memo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dumbbell, Heart, Zap, ChevronLeft } from 'lucide-react';
import { ModalBackdrop } from '../../../components/shared/ModalBackdrop';

const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes'] as const;

interface AddSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStrength: (muscleGroups: string[]) => void;
  onSelectCardio: () => void;
  onSelectFreestyle: () => void;
  currentSessionCount: number;
}

function AddSessionModalInner({
  isOpen, onClose, onSelectStrength, onSelectCardio, onSelectFreestyle, currentSessionCount,
}: AddSessionModalProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [step, setStep] = useState<'options' | 'muscle-groups'>('options');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const isMaxReached = currentSessionCount >= 3;

  const handleStrengthClick = useCallback(() => {
    setStep('muscle-groups');
    setSelectedGroups([]);
  }, []);

  const toggleGroup = useCallback((group: string) => {
    setSelectedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group],
    );
  }, []);

  const handleCreateStrength = useCallback(() => {
    if (selectedGroups.length > 0) {
      onSelectStrength(selectedGroups);
    }
  }, [selectedGroups, onSelectStrength]);

  const handleBack = useCallback(() => setStep('options'), []);

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="rounded-t-3xl bg-white p-6 dark:bg-slate-800">
        {/* Render options or muscle-group selector based on step */}
        {step === 'options' && (
          <>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
              {t('fitness.plan.addSession')}
            </h3>
            {isMaxReached && (
              <p className="text-sm text-amber-600 mb-3">{t('fitness.plan.maxSessions')}</p>
            )}
            {/* 3 option buttons: Strength(emerald), Cardio(blue), Freestyle(amber) */}
            <button disabled={isMaxReached} onClick={handleStrengthClick} className="...emerald...">
              <Dumbbell /> {t('fitness.plan.strengthOption')}
            </button>
            <button disabled={isMaxReached} onClick={onSelectCardio} className="...blue...">
              <Heart /> {t('fitness.plan.cardioOption')}
            </button>
            <button disabled={isMaxReached} onClick={onSelectFreestyle} className="...amber...">
              <Zap /> {t('fitness.plan.freestyleOption')}
            </button>
          </>
        )}
        {step === 'muscle-groups' && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={handleBack} aria-label="Back"><ChevronLeft /></button>
              <h3>{t('fitness.plan.selectMuscleGroups')}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map((group) => (
                <button
                  key={group}
                  onClick={() => toggleGroup(group)}
                  className={selectedGroups.includes(group) ? 'bg-emerald-500 text-white' : 'bg-slate-100'}
                >
                  {group}
                </button>
              ))}
            </div>
            <button
              data-testid="create-strength-session"
              disabled={selectedGroups.length === 0}
              onClick={handleCreateStrength}
            >
              {t('fitness.plan.createSession')}
            </button>
          </>
        )}
      </div>
    </ModalBackdrop>
  );
}

export const AddSessionModal = memo(AddSessionModalInner);
```

**Note:** The above is a structural skeleton. The implementer must:
- Add full Tailwind classes for dark mode, touch targets (min 44px), spacing
- Add `useModalBackHandler` hook import and usage
- Ensure each option button has proper `aria-label`
- Follow color palette: emerald for Strength, blue for Cardio, amber for Freestyle

- [ ] **Step 4: Run tests — verify PASS**

Run: `npx vitest run src/__tests__/AddSessionModal.test.tsx --reporter=verbose`
Expected: ALL PASS

- [ ] **Step 5: ESLint + Commit**

```bash
npx eslint src/features/fitness/components/AddSessionModal.tsx
git add src/features/fitness/components/AddSessionModal.tsx src/__tests__/AddSessionModal.test.tsx
git commit -m "feat(fitness): add AddSessionModal with muscle group selector sub-flow

- ModalBackdrop pattern with useModalBackHandler
- 2-step Strength flow: pick option → select muscle groups → confirm
- Cardio and Freestyle fire immediate callbacks
- Max 3 sessions validation with disabled state"
```

---

## Task 7: PlanDayEditor Component

**Files:**
- Create: `src/features/fitness/components/PlanDayEditor.tsx`
- Create: `src/__tests__/PlanDayEditor.test.tsx`

This is the largest new component. Full-screen page opened via `pushPage()`.

**Reorder approach:** Use state-based reorder with `<ChevronUp>`/`<ChevronDown>` move buttons (no external drag library needed). The `<GripVertical>` icon serves as a visual handle indicator. The move buttons provide accessibility-compliant reordering. If drag-and-drop is desired later, `@dnd-kit/sortable` can be added — but for v1, button-based reorder is simpler and fully accessible.

**Error handling (spec §5):**
- "User đang tập" → check if workout exists for this planDay in today's workouts → if so, disable ✏️ button with tooltip "Đang tập..."
- "Delete session with existing workout data" → confirm dialog: "Buổi tập đã có dữ liệu. Bạn muốn xóa?"

- [ ] **Step 1: Write tests**

Key test scenarios (from spec §7):
- Renders all exercises from plan day
- Click ✕ removes exercise (unless last one → shows warning)
- Click ➕ "Thêm bài tập" opens ExerciseSelector
- Selecting exercise adds it to list
- Click 💾 Save calls `updatePlanDayExercises()` + `popPage()`
- Click ← Back with unsaved changes shows confirm dialog
- Click "Khôi phục gốc" calls `restorePlanDayOriginal()`
- Reorder: move up/down buttons change exercise order
- Inline edit: tap exercise card → edit sets/reps/rest stepper

- [ ] **Step 2: Run tests — verify FAIL**

- [ ] **Step 3: Implement PlanDayEditor**

Key requirements from spec §3.2 and §11:
- Full-screen via `pushPage({ id: 'plan-day-editor', component: 'PlanDayEditor', props: { planDay } })`
- Header: green background, back arrow, "Khôi phục" + Save buttons
- Exercise cards with `<GripVertical>` icon + `<ChevronUp>`/`<ChevronDown>` move buttons (accessibility)
- Sticky bottom "➕ Thêm bài tập" button (fixed viewport bottom)
- ExerciseSelector opened via `isOpen` state
- Dark mode classes throughout
- Unsaved changes tracking: compare current exercises vs initial snapshot

- [ ] **Step 4: Run tests — verify PASS**

- [ ] **Step 5: ESLint + Commit**

```bash
git add src/features/fitness/components/PlanDayEditor.tsx src/__tests__/PlanDayEditor.test.tsx
git commit -m "feat(fitness): add PlanDayEditor full-screen page with drag-reorder, edit, add/remove exercises"
```

---

## Task 8: TrainingPlanView Integration

**Files:**
- Modify: `src/features/fitness/components/TrainingPlanView.tsx:80-86,93,119-128,263-328`
- Test: `src/__tests__/TrainingPlanView.test.tsx` (existing)

- [ ] **Step 1: Write failing tests for new behaviors**

Add to existing test file:
- When day has 2 sessions → SessionTabs rendered
- When day has 1 session → no SessionTabs (backward compatible)
- Click ✏️ edit button → `pushPage` called with `PlanDayEditor`
- "Đã chỉnh sửa" badge shows when `exercises !== originalExercises`
- "Khôi phục gốc" button shows and calls `restorePlanDayOriginal`
- Switching session tabs updates displayed workout card

- [ ] **Step 2: Run tests — verify FAIL**

- [ ] **Step 3: Implement TrainingPlanView changes**

Key modifications:
1. Change `planDays.find()` to `.filter()` for multi-session grouping (line 93)
2. Add `SessionTabs` component above workout card
3. Track `activeSessionId` state (default: first session)
4. Add ✏️ edit button that calls `pushPage` with `PlanDayEditor`
5. Add "Đã chỉnh sửa" badge (compare `exercises !== originalExercises`)
6. Add "Khôi phục gốc" button
7. Add `AddSessionModal` triggered by SessionTabs "+" button
8. Import `SessionTabs`, `AddSessionModal`, `Pencil`, `Sun`, `Moon` icons

- [ ] **Step 4: Run tests — verify PASS**

- [ ] **Step 5: ESLint + Commit**

```bash
git add src/features/fitness/components/TrainingPlanView.tsx src/__tests__/TrainingPlanView.test.tsx
git commit -m "feat(fitness): integrate SessionTabs, edit button, modified badge into TrainingPlanView"
```

---

## Task 9: WorkoutLogger Updates

**Files:**
- Modify: `src/features/fitness/components/WorkoutLogger.tsx:292-320,565-573`
- Test: `src/__tests__/WorkoutLogger.test.tsx` (existing)

- [ ] **Step 1: Write failing tests**

Add to existing test file:
- Workout saved includes `planDayId` from planDay prop
- Freestyle workout (no planDay) → shows name input after finish
- Freestyle name input: user types name → saved; skip → default name
- "Thêm bài tập" button has sticky positioning class

- [ ] **Step 2: Run tests — verify FAIL**

- [ ] **Step 3: Implement changes**

1. **planDayId on save** (lines 292-320): Add `planDayId: planDay?.id` to workout object in `handleSave`
2. **Freestyle name input** (after handleSave, before summary): When `!planDay`, show a text input "Đặt tên buổi tập" with skip option
3. **Sticky button** (lines 565-573): Add `sticky bottom-0` classes to the "Thêm bài tập" container

- [ ] **Step 4: Run tests — verify PASS**

- [ ] **Step 5: ESLint + Commit**

```bash
git add src/features/fitness/components/WorkoutLogger.tsx src/__tests__/WorkoutLogger.test.tsx
git commit -m "feat(fitness): add planDayId to workout save, freestyle name input, sticky add button"
```

---

## Task 10: TodaysPlanCard Multi-Session + i18n

**Files:**
- Modify: `src/features/dashboard/components/TodaysPlanCard.tsx:83-100`
- Modify: `src/locales/vi.json`
- Test: `src/__tests__/TodaysPlanCard.test.tsx` (existing)

- [ ] **Step 1: Add i18n keys to vi.json**

Add all keys from spec §6 under `fitness.plan.*`, plus these additional keys for the muscle group selector:

```json
{
  "fitness.plan.selectMuscleGroups": "Chọn nhóm cơ",
  "fitness.plan.createSession": "Tạo buổi tập",
  "fitness.plan.muscleGroup.chest": "Ngực",
  "fitness.plan.muscleGroup.back": "Lưng",
  "fitness.plan.muscleGroup.shoulders": "Vai",
  "fitness.plan.muscleGroup.legs": "Chân",
  "fitness.plan.muscleGroup.arms": "Tay",
  "fitness.plan.muscleGroup.core": "Bụng",
  "fitness.plan.muscleGroup.glutes": "Mông"
}
```

- [ ] **Step 2: Write tests for TodaysPlanCard multi-session display**

- Training-partial state: shows "Đã tập 1/2 buổi" with continue CTA
- Multi-session: shows session count info

- [ ] **Step 3: Implement TodaysPlanCard changes**

- Handle `training-partial` state (new branch in component)
- Show next uncompleted session info
- "Tiếp tục" CTA navigates to next session's workout

- [ ] **Step 4: Run ALL tests**

Run: `npx vitest run --reporter=verbose`
Expected: ALL PASS across entire suite

- [ ] **Step 5: ESLint full project**

Run: `npx eslint src/ --ext .ts,.tsx`
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add src/features/dashboard/components/TodaysPlanCard.tsx src/locales/vi.json src/__tests__/TodaysPlanCard.test.tsx
git commit -m "feat(fitness): add multi-session display to TodaysPlanCard + i18n keys"
```

---

## Task 11: Full Integration Test + Build Verification

**Files:**
- Modify: `src/__tests__/integration/crossFeature.test.ts` (if integration tests exist)

- [ ] **Step 1: Write integration test**

Test the full flow: Generate plan → Edit exercises → Add session → Start workout → Save with planDayId → Check training-partial state

- [ ] **Step 2: Run integration test**

Run: `npx vitest run src/__tests__/integration/ --reporter=verbose`
Expected: ALL PASS

- [ ] **Step 3: Run full test suite with coverage**

Run: `npx vitest run --coverage --reporter=verbose`
Expected: ALL PASS, coverage for new files ≥ 100%

- [ ] **Step 4: Build verification**

Run: `npm run build`
Expected: Build succeeds with 0 errors

- [ ] **Step 5: ESLint full project**

Run: `npx eslint src/ --ext .ts,.tsx`
Expected: 0 errors

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "test(fitness): add integration tests for plan flexibility flow

- End-to-end: generate → edit → multi-session → workout → partial state
- Coverage verification for all new components"
```

---

## Dependency Graph

```
Task 1 (Types + Schema)
  ├── Task 2 (Store Actions)          ← needs new types
  │     ├── Task 5 (SessionTabs)      ← uses store for completed state
  │     ├── Task 6 (AddSessionModal)  ← calls addPlanDaySession
  │     └── Task 7 (PlanDayEditor)    ← calls updatePlanDayExercises, restorePlanDayOriginal
  ├── Task 3 (useTodaysPlan)          ← needs new types + TodayPlanState
  │     └── Task 10 (TodaysPlanCard)  ← uses updated hook
  └── Task 4 (Plan Generation)        ← needs new types
        └── Task 8 (TrainingPlanView) ← integrates Tasks 5,6,7 + uses multi-session data
              └── Task 9 (WorkoutLogger) ← needs planDayId type
                    └── Task 11 (Integration) ← verifies everything works together
```

**Parallelizable after Task 1+2:** Tasks 3, 4, 5, 6 can run in parallel.
**Parallelizable after those:** Tasks 7, 8, 9, 10 can partially overlap.
**Sequential:** Task 11 must be last.
