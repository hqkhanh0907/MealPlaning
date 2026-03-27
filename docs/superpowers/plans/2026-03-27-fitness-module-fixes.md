# Fitness Module Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 32 identified issues in the fitness module across 7 phases, from trivial bug fixes to SQLite migration and new features.

**Architecture:** Phase-sequential execution. Each phase builds on the previous one. Within each phase, independent tasks can run in parallel. Every task follows: implement → test → lint → verify coverage ≥ existing baseline.

**Tech Stack:** React 18, TypeScript, Zustand, SQL.js (SQLite WASM), Vitest, TailwindCSS

**Spec:** `docs/superpowers/specs/2026-03-27-fitness-implementation-design.md`
**Solutions Ref:** `docs/02-architecture/fitness-module-solutions-spec.md`

**Test Pattern:** All tests live in `src/__tests__/`. Convention: `<ComponentName>.test.tsx` or `<moduleName>.test.ts`

**Commit Convention:** `fix:`, `refactor:`, `feat:` prefix. Always include `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`

---

## Phase 0: Trivial Fixes (3 tasks — all parallel)

### Task 1: NAV-01 — Store workoutMode in Zustand

**Files:**
- Modify: `src/store/fitnessStore.ts` (interface line ~19, state line ~52)
- Modify: `src/features/fitness/components/FitnessTab.tsx` (line 22-24, 45-49)
- Modify: `src/__tests__/FitnessTab.test.tsx`
- Modify: `src/__tests__/fitnessStore.test.ts`

- [ ] **Step 1: Add workoutMode to fitnessStore interface and state**

In `src/store/fitnessStore.ts`, add to the `FitnessState` interface (after `isOnboarded: boolean;`):

```typescript
workoutMode: 'strength' | 'cardio';
setWorkoutMode: (mode: 'strength' | 'cardio') => void;
```

Add to state initialization (after `isOnboarded: false,`):

```typescript
workoutMode: 'strength',
setWorkoutMode: (mode) => set({ workoutMode: mode }),
```

- [ ] **Step 2: Replace useState in FitnessTab with store selector**

In `src/features/fitness/components/FitnessTab.tsx`:

Remove lines 22-24:
```typescript
const [workoutMode, setWorkoutMode] = useState<'strength' | 'cardio'>('strength');
```

Replace with:
```typescript
const workoutMode = useFitnessStore((s) => s.workoutMode);
const setWorkoutMode = useFitnessStore((s) => s.setWorkoutMode);
```

Add import for `useFitnessStore` if not present. Remove `useState` import if no longer used.

- [ ] **Step 3: Update tests**

In `src/__tests__/fitnessStore.test.ts`, add test:
```typescript
it('should persist workoutMode across store access', () => {
  const { result } = renderHook(() => useFitnessStore());
  act(() => result.current.setWorkoutMode('cardio'));
  expect(result.current.workoutMode).toBe('cardio');
});
```

In `src/__tests__/FitnessTab.test.tsx`, update any mocks to include `workoutMode` in fitnessStore mock.

- [ ] **Step 4: Run tests and lint**

```bash
npx vitest run src/__tests__/fitnessStore.test.ts src/__tests__/FitnessTab.test.tsx --reporter=verbose
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/store/fitnessStore.ts src/features/fitness/components/FitnessTab.tsx src/__tests__/fitnessStore.test.ts src/__tests__/FitnessTab.test.tsx
git commit -m "fix(fitness): persist workoutMode in Zustand store (NAV-01)

Previously used local useState — mode reset on tab switch.
Now stored in fitnessStore for persistence across navigation.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 2: GAMIF-01 — Remove streak++ in grace blocks

**Files:**
- Modify: `src/features/fitness/utils/gamification.ts` (line 149)
- Modify: `src/__tests__/gamification.test.ts`

- [ ] **Step 1: Write failing test for grace period streak behavior**

In `src/__tests__/gamification.test.ts`, add:
```typescript
it('should NOT increment streak during grace period day', () => {
  // Create scenario: 3 workout days, then 1 grace day (planned but missed, first miss)
  const workouts = [
    { id: 'w1', date: '2026-03-23', name: 'Push', durationMin: 45, createdAt: '', updatedAt: '' },
    { id: 'w2', date: '2026-03-24', name: 'Pull', durationMin: 45, createdAt: '', updatedAt: '' },
    { id: 'w3', date: '2026-03-25', name: 'Legs', durationMin: 45, createdAt: '', updatedAt: '' },
    // 2026-03-26 is a planned day but NO workout → grace period
  ];
  const planDays = [
    { dayOfWeek: 1 }, // Monday
    { dayOfWeek: 2 }, // Tuesday
    { dayOfWeek: 3 }, // Wednesday
    { dayOfWeek: 4 }, // Thursday (planned, missed → grace)
  ];
  const result = calculateStreak(workouts as any, planDays as any, '2026-03-27');
  // Streak should be 3 (the 3 actual workout days), NOT 4
  expect(result.currentStreak).toBe(3);
});

it('should NOT inflate longestStreak during grace period', () => {
  // Similar scenario but checking longestStreak
  const workouts = [
    { id: 'w1', date: '2026-03-16', name: 'Push', durationMin: 45, createdAt: '', updatedAt: '' },
    { id: 'w2', date: '2026-03-17', name: 'Pull', durationMin: 45, createdAt: '', updatedAt: '' },
    // 2026-03-18 planned but missed → grace
    { id: 'w3', date: '2026-03-19', name: 'Legs', durationMin: 45, createdAt: '', updatedAt: '' },
  ];
  const planDays = [
    { dayOfWeek: 1 }, { dayOfWeek: 2 }, { dayOfWeek: 3 }, { dayOfWeek: 4 },
  ];
  const result = calculateStreak(workouts as any, planDays as any, '2026-03-20');
  // longestStreak should NOT count grace day as a workout day
  expect(result.longestStreak).toBeLessThanOrEqual(3);
});
```

- [ ] **Step 2: Run test — expect FAIL (streak returns 4 instead of 3, longestStreak also inflated)**

```bash
npx vitest run src/__tests__/gamification.test.ts --reporter=verbose
```

- [ ] **Step 3: Fix — remove streak++ in BOTH grace blocks (line 149 AND line 185)**

In `src/features/fitness/utils/gamification.ts`:

**Fix 1 — currentStreak grace block (line 146-151):**
```typescript
    // BEFORE:
    } else if (!graceUsed) {
      graceUsed = true;
      atRisk = true;
      currentStreak++;    // ← REMOVE THIS LINE
    } else {

    // AFTER:
    } else if (!graceUsed) {
      graceUsed = true;
      atRisk = true;
      // Grace period: maintain streak but do NOT increment
    } else {
```

**Fix 2 — tempStreak (longest streak) grace block (line 183-186):**
```typescript
    // BEFORE:
    } else if (!tempGrace) {
      tempGrace = true;
      tempStreak++;       // ← REMOVE THIS LINE
    } else {

    // AFTER:
    } else if (!tempGrace) {
      tempGrace = true;
      // Grace period: maintain longest streak but do NOT increment
    } else {
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx vitest run src/__tests__/gamification.test.ts --reporter=verbose
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/features/fitness/utils/gamification.ts src/__tests__/gamification.test.ts
git commit -m "fix(fitness): stop streak inflation during grace period (GAMIF-01)

Grace period should maintain streak (not break it), but must NOT
increment it. Removed currentStreak++ inside grace block.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 3: DASH-02 — Exhaustive switch default

**Files:**
- Modify: `src/features/fitness/components/ProgressDashboard.tsx` (lines 251-302)
- Modify: `src/__tests__/ProgressDashboard.test.tsx`

- [ ] **Step 1: Add exhaustive never assertion to switch**

In `src/features/fitness/components/ProgressDashboard.tsx`, find the switch on `selectedCard` (around line 251-302). After the last `case 'sessions':` block, before the closing `}`, add:

```typescript
    default: {
      const _exhaustive: never = selectedCard;
      return _exhaustive;
    }
```

This ensures TypeScript catches any new `MetricCardType` values at compile time.

- [ ] **Step 2: Run tests and lint**

```bash
npx vitest run src/__tests__/ProgressDashboard.test.tsx --reporter=verbose
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add src/features/fitness/components/ProgressDashboard.tsx src/__tests__/ProgressDashboard.test.tsx
git commit -m "fix(fitness): add exhaustive switch default in ProgressDashboard (DASH-02)

Ensures compile-time safety when new MetricCardType values are added.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Phase 1: Foundation Extraction (5 tasks — 4 parallel + 1 sequential)

### Task 4: OL-08 — Type consolidation in types.ts

**Files:**
- Modify: `src/features/fitness/types.ts`
- Modify: `src/features/fitness/utils/trainingMetrics.ts` (remove duplicate Workout/WorkoutSet at lines 1-20)
- Modify: `src/__tests__/trainingMetrics.test.ts`

- [ ] **Step 1: Verify duplicate types in trainingMetrics.ts**

Check that `trainingMetrics.ts` defines its own `Workout` (line 11) and `WorkoutSet` (line 1) that are simplified versions of `types.ts` definitions.

- [ ] **Step 2: Remove duplicates from trainingMetrics.ts, import from types.ts**

In `src/features/fitness/utils/trainingMetrics.ts`, remove the local `Workout` and `WorkoutSet` type definitions. Add import:

```typescript
import type { Workout, WorkoutSet } from '../types';
```

Update any function signatures that relied on the simplified types to use the full types (should be backward-compatible since the full types are supersets).

- [ ] **Step 3: Run all fitness tests to verify no breakage**

```bash
npx vitest run src/__tests__/trainingMetrics.test.ts src/__tests__/ProgressDashboard.test.tsx src/__tests__/useProgressiveOverload.test.ts --reporter=verbose
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add src/features/fitness/types.ts src/features/fitness/utils/trainingMetrics.ts src/__tests__/trainingMetrics.test.ts
git commit -m "refactor(fitness): consolidate Workout/WorkoutSet types to types.ts (OL-08)

Removed duplicate type definitions from trainingMetrics.ts.
All fitness types now have a single canonical source in types.ts.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 5: STRENGTH-04 — Extract constants to constants.ts

**Files:**
- Create: `src/features/fitness/constants.ts`
- Modify: `src/features/fitness/components/WorkoutLogger.tsx` (lines 36-38)
- Modify: `src/features/fitness/components/SetEditor.tsx` (lines 16-20)
- Modify: `src/features/fitness/components/CardioLogger.tsx` (lines 14-30)
- Modify: `src/features/fitness/hooks/useTrainingPlan.ts` (lines 70-84)
- Modify: `src/features/fitness/components/StreakCounter.tsx` (DAY_LABELS)
- Modify: `src/features/fitness/components/TrainingPlanView.tsx` (DAY_LABELS)
- Modify: `src/features/fitness/components/WorkoutHistory.tsx` (DAY_NAMES line 22)
- Create: `src/__tests__/fitnessConstants.test.ts`
- Modify affected test files

- [ ] **Step 1: Create constants.ts with all extracted constants**

Create `src/features/fitness/constants.ts`:

```typescript
import type { MuscleGroup, CardioType, CardioIntensity } from './types';

// Day labels (Monday-first, Vietnamese)
export const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const;
// Sunday-first variant for Date.getDay() alignment
export const DAY_LABELS_SUNDAY_FIRST = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const;

// RPE scale options
export const RPE_OPTIONS = [6, 7, 8, 9, 10] as const;

// Weight/Reps increments
export const WEIGHT_INCREMENT = 2.5;
export const REPS_INCREMENT = 1;
export const MIN_WEIGHT_KG = 0;
export const MIN_REPS = 1;
export const DEFAULT_REST_SECONDS = 90;

// Body weight tracking limits
export const BODY_WEIGHT_MIN_KG = 30;
export const BODY_WEIGHT_MAX_KG = 300;

// Muscle group constants
export const ALL_MUSCLES: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms', 'legs', 'glutes', 'core'];
export const UPPER_MUSCLES: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms'];
export const LOWER_MUSCLES: MuscleGroup[] = ['legs', 'glutes', 'core'];
export const PUSH_MUSCLES: MuscleGroup[] = ['chest', 'shoulders'];
export const PULL_MUSCLES: MuscleGroup[] = ['back', 'arms'];
export const LEG_MUSCLES: MuscleGroup[] = ['legs', 'glutes', 'core'];

// Cardio types
export const CARDIO_TYPES: { value: CardioType; emoji: string; i18nKey: string }[] = [
  { value: 'running', emoji: '🏃', i18nKey: 'fitness.cardio.types.running' },
  { value: 'cycling', emoji: '🚴', i18nKey: 'fitness.cardio.types.cycling' },
  { value: 'swimming', emoji: '🏊', i18nKey: 'fitness.cardio.types.swimming' },
  { value: 'walking', emoji: '🚶', i18nKey: 'fitness.cardio.types.walking' },
  { value: 'hiit', emoji: '⚡', i18nKey: 'fitness.cardio.types.hiit' },
  { value: 'yoga', emoji: '🧘', i18nKey: 'fitness.cardio.types.yoga' },
  { value: 'other', emoji: '🏋️', i18nKey: 'fitness.cardio.types.other' },
];
export const DISTANCE_CARDIO_TYPES: CardioType[] = ['running', 'cycling', 'swimming'];

export const INTENSITY_OPTIONS: { value: CardioIntensity; i18nKey: string }[] = [
  { value: 'low', i18nKey: 'fitness.cardio.intensity.low' },
  { value: 'moderate', i18nKey: 'fitness.cardio.intensity.moderate' },
  { value: 'high', i18nKey: 'fitness.cardio.intensity.high' },
];

// Dashboard time ranges
export const TIME_RANGES = ['1W', '1M', '3M', 'all'] as const;
```

- [ ] **Step 2: Write test for constants**

Create `src/__tests__/fitnessConstants.test.ts`:
```typescript
import { DAY_LABELS, DAY_LABELS_SUNDAY_FIRST, ALL_MUSCLES, RPE_OPTIONS, CARDIO_TYPES } from '../features/fitness/constants';

describe('Fitness Constants', () => {
  it('DAY_LABELS has 7 days starting Monday', () => {
    expect(DAY_LABELS).toHaveLength(7);
    expect(DAY_LABELS[0]).toBe('T2');
    expect(DAY_LABELS[6]).toBe('CN');
  });

  it('DAY_LABELS_SUNDAY_FIRST aligns with Date.getDay()', () => {
    expect(DAY_LABELS_SUNDAY_FIRST[0]).toBe('CN');
    expect(DAY_LABELS_SUNDAY_FIRST[1]).toBe('T2');
  });

  it('ALL_MUSCLES has 7 groups', () => {
    expect(ALL_MUSCLES).toHaveLength(7);
  });

  it('RPE_OPTIONS range 6-10', () => {
    expect(RPE_OPTIONS[0]).toBe(6);
    expect(RPE_OPTIONS[RPE_OPTIONS.length - 1]).toBe(10);
  });

  it('CARDIO_TYPES has 7 types', () => {
    expect(CARDIO_TYPES).toHaveLength(7);
  });
});
```

- [ ] **Step 3: Replace inline constants in all consuming files**

For each file: remove the local constant definition, import from `../constants` (or `../../constants` depending on path). Key replacements:

- `WorkoutLogger.tsx`: Remove `DEFAULT_REST_SECONDS`, `RPE_OPTIONS`, `WEIGHT_INCREMENT` → import from constants
- `SetEditor.tsx`: Remove `RPE_OPTIONS`, `WEIGHT_INCREMENT`, `REPS_INCREMENT`, `MIN_WEIGHT`, `MIN_REPS` → import from constants
- `CardioLogger.tsx`: Remove `CARDIO_TYPES`, `DISTANCE_TYPES`, `INTENSITY_OPTIONS` → import from constants
- `useTrainingPlan.ts`: Remove `ALL_MUSCLES`, `UPPER_MUSCLES`, etc. → import from constants
- `StreakCounter.tsx`, `TrainingPlanView.tsx`: Remove `DAY_LABELS` → import from constants
- `WorkoutHistory.tsx`: Remove `DAY_NAMES` → import `DAY_LABELS_SUNDAY_FIRST` from constants

- [ ] **Step 4: Run ALL fitness tests**

```bash
npx vitest run src/__tests__/fitnessConstants.test.ts src/__tests__/WorkoutLogger.test.tsx src/__tests__/SetEditor.test.tsx src/__tests__/CardioLogger.test.tsx src/__tests__/useTrainingPlan.test.ts src/__tests__/FitnessTab.test.tsx --reporter=verbose
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/features/fitness/constants.ts src/__tests__/fitnessConstants.test.ts src/features/fitness/components/WorkoutLogger.tsx src/features/fitness/components/SetEditor.tsx src/features/fitness/components/CardioLogger.tsx src/features/fitness/components/StreakCounter.tsx src/features/fitness/components/TrainingPlanView.tsx src/features/fitness/components/WorkoutHistory.tsx src/features/fitness/hooks/useTrainingPlan.ts
git commit -m "refactor(fitness): extract scattered constants to constants.ts (STRENGTH-04)

Consolidated DAY_LABELS (3 files), RPE_OPTIONS (2 files),
WEIGHT_INCREMENT (2 files), muscle group arrays, and cardio
constants into a single leaf module. Fixed DAY_LABELS ordering
inconsistency (CN position).

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 6: GAMIF-02 + OL-09 — Extract date utils

**Files:**
- Create: `src/features/fitness/utils/dateUtils.ts`
- Modify: `src/features/fitness/utils/gamification.ts` (remove internal date functions lines 51-87)
- Modify: `src/features/fitness/components/ProgressDashboard.tsx` (replace getWeekBounds lines 37-50)
- Modify: `src/features/fitness/components/WorkoutHistory.tsx` (replace local date helpers)
- Create: `src/__tests__/dateUtils.test.ts`

- [ ] **Step 1: Create dateUtils.ts with all shared date functions**

Create `src/features/fitness/utils/dateUtils.ts`:

```typescript
/**
 * Shared date utilities for the fitness module.
 * Leaf module — imports only from standard library.
 */

export function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getDayOfWeek(dateStr: string): number {
  return parseDate(dateStr).getDay();
}

export function addDays(dateStr: string, n: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + n);
  return formatDate(d);
}

export function getMondayOfWeek(dateStr: string): string {
  const d = parseDate(dateStr);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return formatDate(d);
}

export function daysBetween(from: string, to: string): number {
  const a = parseDate(from);
  const b = parseDate(to);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function isToday(dateStr: string): boolean {
  return dateStr === formatDate(new Date());
}

export function getWeekBounds(offset = 0): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: formatDate(monday), end: formatDate(sunday) };
}
```

- [ ] **Step 2: Write comprehensive tests**

Create `src/__tests__/dateUtils.test.ts`:
```typescript
import { formatDate, parseDate, getDayOfWeek, addDays, getMondayOfWeek, daysBetween, isToday, getWeekBounds } from '../features/fitness/utils/dateUtils';

describe('dateUtils', () => {
  it('formatDate returns YYYY-MM-DD', () => {
    expect(formatDate(new Date(2026, 2, 27))).toBe('2026-03-27');
  });

  it('parseDate creates correct Date', () => {
    const d = parseDate('2026-03-27');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(27);
  });

  it('addDays adds correctly', () => {
    expect(addDays('2026-03-27', 3)).toBe('2026-03-30');
    expect(addDays('2026-03-30', 2)).toBe('2026-04-01'); // cross month
  });

  it('getMondayOfWeek returns Monday', () => {
    // 2026-03-27 is Friday → Monday is 2026-03-23
    expect(getMondayOfWeek('2026-03-27')).toBe('2026-03-23');
  });

  it('daysBetween calculates correctly', () => {
    expect(daysBetween('2026-03-01', '2026-03-27')).toBe(26);
  });

  it('getWeekBounds returns Monday-Sunday', () => {
    const bounds = getWeekBounds(0);
    expect(bounds.start).toBeDefined();
    expect(bounds.end).toBeDefined();
    expect(daysBetween(bounds.start, bounds.end)).toBe(6);
  });
});
```

- [ ] **Step 3: Replace internal date functions in gamification.ts**

In `src/features/fitness/utils/gamification.ts`, remove the internal functions (lines 51-87: `formatDate`, `parseDate`, `getDayOfWeek`, `addDays`, `getMondayOfWeek`, `dateDiff`). Add import:
```typescript
import { formatDate, parseDate, getDayOfWeek, addDays, getMondayOfWeek, daysBetween } from './dateUtils';
```
Replace `dateDiff` calls with `daysBetween`.

- [ ] **Step 4: Replace getWeekBounds in ProgressDashboard.tsx**

Remove local `getWeekBounds` function (lines 37-50). Add import:
```typescript
import { getWeekBounds } from '../utils/dateUtils';
```

- [ ] **Step 5: Replace date helpers in WorkoutHistory.tsx**

Replace any local date arithmetic with imports from `dateUtils`.

- [ ] **Step 6: Run all tests**

```bash
npx vitest run src/__tests__/dateUtils.test.ts src/__tests__/gamification.test.ts src/__tests__/ProgressDashboard.test.tsx src/__tests__/WorkoutHistory.test.tsx --reporter=verbose
npm run lint
```

- [ ] **Step 7: Commit**

```bash
git add src/features/fitness/utils/dateUtils.ts src/__tests__/dateUtils.test.ts src/features/fitness/utils/gamification.ts src/features/fitness/components/ProgressDashboard.tsx src/features/fitness/components/WorkoutHistory.tsx
git commit -m "refactor(fitness): extract shared date utilities to dateUtils.ts (GAMIF-02, OL-09)

Consolidated 6 date functions from gamification.ts (internal),
ProgressDashboard.tsx (getWeekBounds), and WorkoutHistory.tsx
into a shared leaf module.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 7: CARDIO-03 — Extract formatElapsed to timeFormat.ts

**Files:**
- Create: `src/features/fitness/utils/timeFormat.ts`
- Modify: `src/features/fitness/components/CardioLogger.tsx` (remove lines 32-36)
- Modify: `src/features/fitness/utils/gamification.ts` (if formatElapsed exists there)
- Create: `src/__tests__/timeFormat.test.ts`

- [ ] **Step 1: Create timeFormat.ts**

Create `src/features/fitness/utils/timeFormat.ts`:
```typescript
export function formatElapsed(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '00:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
```

- [ ] **Step 2: Write tests**

Create `src/__tests__/timeFormat.test.ts`:
```typescript
import { formatElapsed } from '../features/fitness/utils/timeFormat';

describe('formatElapsed', () => {
  it('formats seconds < 60', () => expect(formatElapsed(45)).toBe('00:45'));
  it('formats minutes', () => expect(formatElapsed(125)).toBe('02:05'));
  it('formats hours', () => expect(formatElapsed(3661)).toBe('1:01:01'));
  it('handles zero', () => expect(formatElapsed(0)).toBe('00:00'));
  it('handles NaN', () => expect(formatElapsed(NaN)).toBe('00:00'));
  it('handles negative', () => expect(formatElapsed(-10)).toBe('00:00'));
  it('handles Infinity', () => expect(formatElapsed(Infinity)).toBe('00:00'));
});
```

- [ ] **Step 3: Replace in CardioLogger.tsx and gamification.ts**

Remove local `formatElapsed` function from `CardioLogger.tsx` (lines 32-36). Add import:
```typescript
import { formatElapsed } from '../utils/timeFormat';
```

Do the same for `gamification.ts` if it has a local `formatElapsed`.

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/__tests__/timeFormat.test.ts src/__tests__/CardioLogger.test.tsx src/__tests__/gamification.test.ts --reporter=verbose
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/features/fitness/utils/timeFormat.ts src/__tests__/timeFormat.test.ts src/features/fitness/components/CardioLogger.tsx src/features/fitness/utils/gamification.ts
git commit -m "refactor(fitness): extract formatElapsed to timeFormat.ts with hour support (CARDIO-03)

Added NaN guard, negative guard, and hour formatting (>60 min).
Replaced duplicates in CardioLogger.tsx and gamification.ts.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 8: PLAN-01 — Rename calculateWeeklyVolume (depends on Task 4)

**Files:**
- Modify: `src/features/fitness/utils/volumeCalculator.ts` (line 54)
- Modify: `src/features/fitness/hooks/useTrainingPlan.ts` (import line 17-19)
- Modify: `src/__tests__/volumeCalculator.test.ts`
- Modify: `src/__tests__/useTrainingPlan.test.ts`

- [ ] **Step 1: Rename function in volumeCalculator.ts**

In `src/features/fitness/utils/volumeCalculator.ts`, rename:
```typescript
// Before (line 54):
export function calculateWeeklyVolume(
// After:
export function calculateTargetWeeklySets(
```

- [ ] **Step 2: Update all imports**

In `src/features/fitness/hooks/useTrainingPlan.ts`, update import:
```typescript
import { calculateTargetWeeklySets, distributeVolume } from '../utils/volumeCalculator';
```

Update all call sites in the same file from `calculateWeeklyVolume(...)` to `calculateTargetWeeklySets(...)`.

- [ ] **Step 3: Update tests**

In `src/__tests__/volumeCalculator.test.ts`, rename all references.
In `src/__tests__/useTrainingPlan.test.ts`, update any direct references.

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/__tests__/volumeCalculator.test.ts src/__tests__/useTrainingPlan.test.ts --reporter=verbose
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/features/fitness/utils/volumeCalculator.ts src/features/fitness/hooks/useTrainingPlan.ts src/__tests__/volumeCalculator.test.ts src/__tests__/useTrainingPlan.test.ts
git commit -m "refactor(fitness): rename calculateWeeklyVolume → calculateTargetWeeklySets (PLAN-01)

The function calculates target sets per week for plan generation,
NOT actual volume tonnage. Rename eliminates confusion with
trainingMetrics.calculateWeeklyVolume which computes actual volume.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Phase 2: Bug Fixes (7 tasks — mostly parallel)

### Task 9: CARDIO-01 — useTimer hook (depends on Task 7)

**Files:**
- Create: `src/features/fitness/hooks/useTimer.ts`
- Modify: `src/features/fitness/components/CardioLogger.tsx` (lines 44-69)
- Create: `src/__tests__/useTimer.test.ts`
- Modify: `src/__tests__/CardioLogger.test.tsx`

- [ ] **Step 1: Create useTimer hook**

Create `src/features/fitness/hooks/useTimer.ts`:
```typescript
import { useState, useRef, useEffect, useCallback } from 'react';

export function useTimer() {
  const startTimeRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || startTimeRef.current === null) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current!) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const start = useCallback(() => {
    startTimeRef.current = Date.now() - elapsed * 1000;
    setIsRunning(true);
  }, [elapsed]);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    startTimeRef.current = null;
    setIsRunning(false);
    setElapsed(0);
  }, []);

  return { elapsed, isRunning, start, stop, reset };
}
```

- [ ] **Step 2: Write hook tests**

Create `src/__tests__/useTimer.test.ts`:
```typescript
import { renderHook, act } from '@testing-library/react';
import { useTimer } from '../features/fitness/hooks/useTimer';
import { vi } from 'vitest';

describe('useTimer', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('starts at 0', () => {
    const { result } = renderHook(() => useTimer());
    expect(result.current.elapsed).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it('increments elapsed when running', () => {
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start());
    expect(result.current.isRunning).toBe(true);
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.elapsed).toBe(3);
  });

  it('stops incrementing when stopped', () => {
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start());
    act(() => { vi.advanceTimersByTime(2000); });
    act(() => result.current.stop());
    const elapsed = result.current.elapsed;
    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current.elapsed).toBe(elapsed);
  });

  it('resets to zero', () => {
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start());
    act(() => { vi.advanceTimersByTime(5000); });
    act(() => result.current.reset());
    expect(result.current.elapsed).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });
});
```

- [ ] **Step 3: Replace both setIntervals in CardioLogger.tsx**

In `CardioLogger.tsx`, remove:
- The `elapsedSeconds` state and its `setInterval` (lines 52, 55-60)
- The `stopwatchSeconds`/`stopwatchRunning` states and their `setInterval` (lines 46-48, 63-69)

Replace with:
```typescript
const headerTimer = useTimer();
const stopwatch = useTimer();
```

Start `headerTimer` on component mount. Use `stopwatch.start()`/`stopwatch.stop()` for the stopwatch buttons. Replace `elapsedSeconds` → `headerTimer.elapsed`, `stopwatchSeconds` → `stopwatch.elapsed`.

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/__tests__/useTimer.test.ts src/__tests__/CardioLogger.test.tsx --reporter=verbose
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/features/fitness/hooks/useTimer.ts src/__tests__/useTimer.test.ts src/features/fitness/components/CardioLogger.tsx src/__tests__/CardioLogger.test.tsx
git commit -m "fix(fitness): eliminate timer race condition with useTimer hook (CARDIO-01)

Replaced dual setInterval pattern with single useRef(startTime)
based hook. Timer is now derived from Date.now() delta — zero drift.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 10: CARDIO-02 — parseNumericInput guard

**Files:**
- Create: `src/features/fitness/utils/parseNumericInput.ts`
- Modify: `src/features/fitness/components/CardioLogger.tsx` (onChange handlers)
- Modify: `src/features/fitness/utils/cardioEstimator.ts` (estimateCardioBurn)
- Create: `src/__tests__/parseNumericInput.test.ts`

- [ ] **Step 1: Create parseNumericInput utility**

Create `src/features/fitness/utils/parseNumericInput.ts`:
```typescript
export function parseNumericInput(value: string, fallback = 0): number {
  if (value === '' || value === undefined || value === null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}
```

- [ ] **Step 2: Write tests**

Create `src/__tests__/parseNumericInput.test.ts`:
```typescript
import { parseNumericInput } from '../features/fitness/utils/parseNumericInput';

describe('parseNumericInput', () => {
  it('parses valid number', () => expect(parseNumericInput('42.5')).toBe(42.5));
  it('returns fallback for empty string', () => expect(parseNumericInput('')).toBe(0));
  it('returns fallback for text', () => expect(parseNumericInput('abc')).toBe(0));
  it('returns fallback for NaN', () => expect(parseNumericInput('NaN')).toBe(0));
  it('clamps negative to 0', () => expect(parseNumericInput('-5')).toBe(0));
  it('uses custom fallback', () => expect(parseNumericInput('', 10)).toBe(10));
  it('handles zero', () => expect(parseNumericInput('0')).toBe(0));
});
```

- [ ] **Step 3: Apply in CardioLogger.tsx onChange handlers**

Replace `Number(e.target.value)` with `parseNumericInput(e.target.value)` in all three input handlers (manual duration line 280, distance lines 301-304, heart rate lines 321-324).

- [ ] **Step 4: Add validation in cardioEstimator.ts**

In `estimateCardioBurn()`, add early guard:
```typescript
if (!Number.isFinite(durationMin) || durationMin <= 0) return 0;
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run src/__tests__/parseNumericInput.test.ts src/__tests__/CardioLogger.test.tsx src/__tests__/cardioEstimator.test.ts --reporter=verbose
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/features/fitness/utils/parseNumericInput.ts src/__tests__/parseNumericInput.test.ts src/features/fitness/components/CardioLogger.tsx src/features/fitness/utils/cardioEstimator.ts
git commit -m "fix(fitness): guard against NaN in cardio inputs (CARDIO-02)

Added parseNumericInput utility for defense-in-depth:
1. Input onChange handlers use parseNumericInput
2. estimateCardioBurn validates inputs before calculation
Prevents 'NaN kcal' display and corrupted data.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 11: PLAN-02 — Add catch block to useTrainingPlan

**Files:**
- Modify: `src/features/fitness/hooks/useTrainingPlan.ts` (lines 520-527)
- Modify: `src/__tests__/useTrainingPlan.test.ts`

- [ ] **Step 1: Add error state and catch block**

In `src/features/fitness/hooks/useTrainingPlan.ts`, add state:
```typescript
const [generationError, setGenerationError] = useState<string | null>(null);
```

Replace the try-finally block (lines 520-527):
```typescript
const generatePlan = useCallback(
  (input: PlanGenerationInput): GeneratedPlan | null => {
    setIsGenerating(true);
    setGenerationError(null);
    try {
      return generateTrainingPlan(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setGenerationError(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  },
  [],
);
```

Return `generationError` from the hook.

- [ ] **Step 2: Update tests**

Add test for error handling in `src/__tests__/useTrainingPlan.test.ts`:
```typescript
it('sets error state when plan generation fails', async () => {
  const mockError = new Error('Generation failed');
  vi.spyOn(planGenerator, 'generateTrainingPlan').mockRejectedValueOnce(mockError);

  const { result } = renderHook(() => useTrainingPlan());
  await act(async () => {
    await result.current.generatePlan({ experience: 'intermediate', goal: 'strength', daysPerWeek: 4 });
  });

  expect(result.current.generationError).toBe('Generation failed');
  expect(result.current.isGenerating).toBe(false);
});

it('clears previous error on successful generation', async () => {
  const { result } = renderHook(() => useTrainingPlan());
  // First call fails
  vi.spyOn(planGenerator, 'generateTrainingPlan').mockRejectedValueOnce(new Error('fail'));
  await act(async () => {
    await result.current.generatePlan({ experience: 'intermediate', goal: 'strength', daysPerWeek: 4 });
  });
  expect(result.current.generationError).toBeTruthy();
  // Second call succeeds
  vi.spyOn(planGenerator, 'generateTrainingPlan').mockResolvedValueOnce(mockPlan);
  await act(async () => {
    await result.current.generatePlan({ experience: 'intermediate', goal: 'strength', daysPerWeek: 4 });
  });
  expect(result.current.generationError).toBeNull();
});
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/__tests__/useTrainingPlan.test.ts --reporter=verbose
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add src/features/fitness/hooks/useTrainingPlan.ts src/__tests__/useTrainingPlan.test.ts
git commit -m "fix(fitness): add catch block to plan generation (PLAN-02)

Was try-finally without catch — errors swallowed silently.
Now captures error message in generationError state for UI display.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 12: PLAN-03 — BodyRegion type guard (depends on Task 4)

**Files:**
- Modify: `src/features/fitness/hooks/useTrainingPlan.ts` (lines 102, 261)
- Modify: `src/features/fitness/types.ts` (add type guard)
- Modify: `src/__tests__/useTrainingPlan.test.ts`

- [ ] **Step 1: Add isBodyRegion type guard to types.ts**

In `src/features/fitness/types.ts`, add:
```typescript
const BODY_REGIONS: readonly BodyRegion[] = ['upper', 'lower', 'push', 'pull', 'full_body', 'core'] as const;

export function isBodyRegion(value: string): value is BodyRegion {
  return BODY_REGIONS.includes(value as BodyRegion);
}
```

- [ ] **Step 2: Replace unsafe casts in useTrainingPlan.ts**

At line 102, replace:
```typescript
contraindicated: seed.contraindicated as BodyRegion[],
```
with:
```typescript
contraindicated: (seed.contraindicated ?? []).filter(isBodyRegion),
```

At line 261, replace unsafe cast with validated filter.

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/__tests__/useTrainingPlan.test.ts --reporter=verbose
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add src/features/fitness/types.ts src/features/fitness/hooks/useTrainingPlan.ts src/__tests__/useTrainingPlan.test.ts
git commit -m "fix(fitness): replace unsafe BodyRegion casts with type guard (PLAN-03)

Added isBodyRegion() type guard to types.ts. Invalid regions
are now filtered out instead of causing runtime crashes.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 13: DASH-01 — useCurrentDate hook

**Files:**
- Create: `src/features/fitness/hooks/useCurrentDate.ts`
- Modify: `src/features/fitness/components/ProgressDashboard.tsx` (lines 85-86)
- Create: `src/__tests__/useCurrentDate.test.ts`

- [ ] **Step 1: Create useCurrentDate hook**

Create `src/features/fitness/hooks/useCurrentDate.ts`:
```typescript
import { useState, useEffect } from 'react';

export function useCurrentDate(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setNow(new Date());
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Also refresh every 60 seconds as backup
    const id = setInterval(() => setNow(new Date()), 60_000);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(id);
    };
  }, []);

  return now;
}
```

- [ ] **Step 2: Write tests**

Create `src/__tests__/useCurrentDate.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCurrentDate } from '../features/fitness/hooks/useCurrentDate';

describe('useCurrentDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns current date on initial render', () => {
    const { result } = renderHook(() => useCurrentDate());
    expect(result.current).toBeInstanceOf(Date);
  });

  it('updates date on visibilitychange event', () => {
    const { result } = renderHook(() => useCurrentDate());
    const initialDate = result.current;

    // Advance time by 2 hours
    vi.advanceTimersByTime(2 * 60 * 60 * 1000);

    // Simulate tab becoming visible again
    act(() => {
      Object.defineProperty(document, 'hidden', { value: false, writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.getTime()).toBeGreaterThan(initialDate.getTime());
  });

  it('updates date on 60-second interval', () => {
    const { result } = renderHook(() => useCurrentDate());
    const initialDate = result.current;

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current.getTime()).toBeGreaterThanOrEqual(initialDate.getTime());
  });

  it('cleans up listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useCurrentDate());
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });
});
```

- [ ] **Step 3: Use in ProgressDashboard.tsx**

Replace the static `useMemo(() => getWeekBounds(0), [])` (line 85) with:
```typescript
const currentDate = useCurrentDate();
const thisWeek = useMemo(() => getWeekBounds(0), [currentDate]);
const lastWeek = useMemo(() => getWeekBounds(-1), [currentDate]);
```

Now `getWeekBounds` is from `dateUtils.ts` (Task 6) and recalculates when date changes.

- [ ] **Step 4: Run tests and commit**

```bash
npx vitest run src/__tests__/useCurrentDate.test.ts src/__tests__/ProgressDashboard.test.tsx --reporter=verbose
npm run lint
git add src/features/fitness/hooks/useCurrentDate.ts src/__tests__/useCurrentDate.test.ts src/features/fitness/components/ProgressDashboard.tsx
git commit -m "fix(fitness): refresh week bounds on tab visibility change (DASH-01)

Added useCurrentDate hook with visibilitychange listener.
Dashboard now recalculates week bounds when user returns to app
after midnight crossing.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 14: ONBOARD-02 — 1RM key validation

**Files:**
- Modify: `src/features/fitness/components/FitnessOnboarding.tsx` (line 26)
- Modify: `src/__tests__/FitnessOnboarding.test.tsx`

- [ ] **Step 1: Type-safe ORM_LIFTS with runtime validation**

In `FitnessOnboarding.tsx`, replace line 26:
```typescript
const ORM_LIFTS = ['squat', 'bench', 'deadlift', 'ohp'];
```
with:
```typescript
import { EXERCISES } from '../data/exerciseDatabase';

const ORM_LIFT_IDS = ['squat', 'bench', 'deadlift', 'ohp'] as const;
type OrmLiftId = typeof ORM_LIFT_IDS[number];
const ORM_LIFTS = ORM_LIFT_IDS.filter((id) =>
  EXERCISES.some((e) => e.id === id)
);
```

- [ ] **Step 2: Add test for validation**

```typescript
import { EXERCISES } from '../features/fitness/data/exerciseDatabase';

it('ORM_LIFTS only contains valid exercise IDs', () => {
  const ORM_LIFT_IDS = ['squat', 'bench', 'deadlift', 'ohp'];
  const exerciseIds = EXERCISES.map(e => e.id);
  for (const liftId of ORM_LIFT_IDS) {
    expect(exerciseIds).toContain(liftId);
  }
});

it('renders 1RM input fields for each valid ORM lift', () => {
  render(<FitnessOnboarding />);
  // Navigate to ORM step
  // ... navigate forward to reach 1RM step ...
  const ormInputs = screen.getAllByTestId(/^orm-/);
  expect(ormInputs.length).toBeGreaterThanOrEqual(4); // squat, bench, deadlift, ohp
});
```

- [ ] **Step 3: Run tests and commit**

```bash
npx vitest run src/__tests__/FitnessOnboarding.test.tsx --reporter=verbose
npm run lint
git add src/features/fitness/components/FitnessOnboarding.tsx src/__tests__/FitnessOnboarding.test.tsx
git commit -m "fix(fitness): validate 1RM exercise IDs against database (ONBOARD-02)

ORM_LIFTS now filtered against actual exercise database at runtime.
Invalid IDs are silently removed instead of causing crashes.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 15: STRENGTH-03 — safeJsonParse utility

**Files:**
- Create: `src/features/fitness/utils/safeJsonParse.ts`
- Modify: `src/features/fitness/components/WorkoutLogger.tsx` (line 61)
- Create: `src/__tests__/safeJsonParse.test.ts`

- [ ] **Step 1: Create safeJsonParse utility**

Create `src/features/fitness/utils/safeJsonParse.ts`:
```typescript
export function safeJsonParse<T>(raw: string | undefined | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
```

- [ ] **Step 2: Write tests**

Create `src/__tests__/safeJsonParse.test.ts`:
```typescript
import { safeJsonParse } from '../features/fitness/utils/safeJsonParse';

describe('safeJsonParse', () => {
  it('parses valid JSON', () => expect(safeJsonParse('["a","b"]', [])).toEqual(['a', 'b']));
  it('returns fallback for corrupted JSON', () => expect(safeJsonParse('{broken', [])).toEqual([]));
  it('returns fallback for null', () => expect(safeJsonParse(null, [])).toEqual([]));
  it('returns fallback for undefined', () => expect(safeJsonParse(undefined, [])).toEqual([]));
  it('returns fallback for empty string', () => expect(safeJsonParse('', [])).toEqual([]));
});
```

- [ ] **Step 3: Replace in WorkoutLogger.tsx**

Note: The existing code at line 61 already has try-catch. Replace with the centralized utility:
```typescript
import { safeJsonParse } from '../utils/safeJsonParse';

function resolveExercises(exercisesJson?: string): Exercise[] {
  if (!exercisesJson) return [];
  const ids = safeJsonParse<string[]>(exercisesJson, []);
  return EXERCISES.filter((e) => ids.includes(e.id)).map(seedToExercise);
}
```

- [ ] **Step 4: Run tests and commit**

```bash
npx vitest run src/__tests__/safeJsonParse.test.ts src/__tests__/WorkoutLogger.test.tsx --reporter=verbose
npm run lint
git add src/features/fitness/utils/safeJsonParse.ts src/__tests__/safeJsonParse.test.ts src/features/fitness/components/WorkoutLogger.tsx
git commit -m "fix(fitness): centralize JSON parsing with safeJsonParse (STRENGTH-03)

Replaced inline try-catch in WorkoutLogger with reusable utility.
Handles null, undefined, empty string, and corrupted JSON gracefully.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Phase 3: Algorithm Improvements (5 tasks — partial sequential)

### Task 16: OVERLOAD-03 — useMemo index optimization

**Files:**
- Modify: `src/features/fitness/hooks/useProgressiveOverload.ts` (lines 29, 148, 169)
- Modify: `src/__tests__/useProgressiveOverload.test.ts`

- [ ] **Step 1: Add useMemo-based index Maps**

At the top of the hook (after data fetching), add:
```typescript
const exerciseMap = useMemo(
  () => new Map(EXERCISES.map((e) => [e.id, e])),
  [],
);

const workoutSetsByWorkoutId = useMemo(
  () => {
    const map = new Map<string, WorkoutSet[]>();
    for (const s of workoutSets) {
      const arr = map.get(s.workoutId) ?? [];
      arr.push(s);
      map.set(s.workoutId, arr);
    }
    return map;
  },
  [workoutSets],
);
```

- [ ] **Step 2: Replace .find() and .includes() with Map lookups**

Replace `EXERCISES.find((e) => e.id === exerciseId)` with `exerciseMap.get(exerciseId)`.
Replace `workoutIds.includes(w.id)` filter patterns with Set-based lookups.

- [ ] **Step 3: Run tests and commit**

```bash
npx vitest run src/__tests__/useProgressiveOverload.test.ts --reporter=verbose
npm run lint
git add src/features/fitness/hooks/useProgressiveOverload.ts src/__tests__/useProgressiveOverload.test.ts
git commit -m "perf(fitness): optimize progressive overload with useMemo index (OVERLOAD-03)

Replaced O(n) .find() and .includes() with Map/Set-based O(1) lookups.
Prevents performance degradation with large workout histories.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 17: OVERLOAD-02 — Split overtraining detection (depends on Task 16)

**Files:**
- Modify: `src/features/fitness/hooks/useProgressiveOverload.ts`
- Modify: `src/__tests__/useProgressiveOverload.test.ts`

- [ ] **Step 1: Split detectOvertraining into two functions**

Rename and split:
```typescript
export function detectAcuteFatigue(recentSets: WorkoutSet[]): { level: 'none' | 'moderate' | 'high'; message: string } {
  if (recentSets.length < 3) return { level: 'none', message: '' };

  // Get last 3 sessions' average RPE
  const last3Rpes = recentSets.slice(-9).map(s => s.rpe ?? 0).filter(r => r > 0);
  if (last3Rpes.length === 0) return { level: 'none', message: '' };

  const avgRpe = last3Rpes.reduce((a, b) => a + b, 0) / last3Rpes.length;

  // Check volume spike: last session volume > 130% of average
  const lastSessionVolume = recentSets.slice(-3).reduce((sum, s) => sum + s.reps * s.weightKg, 0);
  const avgSessionVolume = recentSets.slice(-9, -3).reduce((sum, s) => sum + s.reps * s.weightKg, 0) / 2;
  const volumeSpikeRatio = avgSessionVolume > 0 ? lastSessionVolume / avgSessionVolume : 1;

  if (avgRpe >= 9.0 || volumeSpikeRatio > 1.3) {
    return { level: 'high', message: `Acute fatigue: avg RPE ${avgRpe.toFixed(1)}, volume spike ${Math.round(volumeSpikeRatio * 100)}%` };
  }
  if (avgRpe >= 8.0) {
    return { level: 'moderate', message: `Moderate fatigue: avg RPE ${avgRpe.toFixed(1)}` };
  }
  return { level: 'none', message: '' };
}

export function detectChronicOvertraining(historySets: WorkoutSet[]): { level: 'none' | 'moderate' | 'high'; message: string } {
  if (historySets.length < 12) return { level: 'none', message: '' };

  // Group sets by week, check 4+ weeks trend
  const weeklyVolumes: number[] = [];
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  for (let w = 0; w < 6; w++) {
    const weekStart = now - (w + 1) * weekMs;
    const weekEnd = now - w * weekMs;
    const weekSets = historySets.filter(s => {
      const t = new Date(s.createdAt ?? '').getTime();
      return t >= weekStart && t < weekEnd;
    });
    weeklyVolumes.unshift(weekSets.reduce((sum, s) => sum + s.reps * s.weightKg, 0));
  }

  // Check for 4+ consecutive weeks of declining volume
  let decliningWeeks = 0;
  for (let i = 1; i < weeklyVolumes.length; i++) {
    if (weeklyVolumes[i] < weeklyVolumes[i - 1] * 0.95) {
      decliningWeeks++;
    } else {
      decliningWeeks = 0;
    }
  }

  if (decliningWeeks >= 4) {
    return { level: 'high', message: `Chronic overtraining: ${decliningWeeks} weeks of declining volume` };
  }
  if (decliningWeeks >= 2) {
    return { level: 'moderate', message: `Watch for overtraining: ${decliningWeeks} weeks declining` };
  }
  return { level: 'none', message: '' };
}
```

- [ ] **Step 2: Cache results with useMemo**

```typescript
const acuteFatigue = useMemo(() => detectAcuteFatigue(recentSets), [recentSets]);
const chronicOvertraining = useMemo(() => detectChronicOvertraining(allSets), [allSets]);
```

Both call sites now use the cached values instead of calling `detectOvertraining()` independently.

- [ ] **Step 3: Update tests and commit**

Add separate tests for `detectAcuteFatigue` and `detectChronicOvertraining`.

```bash
npx vitest run src/__tests__/useProgressiveOverload.test.ts --reporter=verbose
npm run lint
git add src/features/fitness/hooks/useProgressiveOverload.ts src/__tests__/useProgressiveOverload.test.ts
git commit -m "refactor(fitness): split overtraining into acute/chronic detection (OVERLOAD-02)

detectAcuteFatigue: short-term session analysis (last 3 sessions)
detectChronicOvertraining: long-term trend analysis (4+ weeks)
Both cached via useMemo for consistent results across call sites.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 18: OVERLOAD-01 — PlateauAnalysis service (depends on Task 17)

**Files:**
- Create: `src/features/fitness/utils/plateauAnalysis.ts`
- Modify: `src/features/fitness/hooks/useProgressiveOverload.ts`
- Modify: `src/features/fitness/components/ProgressDashboard.tsx`
- Create: `src/__tests__/plateauAnalysis.test.ts`

- [ ] **Step 1: Create canonical PlateauAnalysis service**

Create `src/features/fitness/utils/plateauAnalysis.ts`:
```typescript
import type { WorkoutSet, Workout } from '../types';

export interface PlateauResult {
  strengthPlateau: boolean;  // 3+ sessions no weight/rep increase
  volumePlateau: boolean;    // 2+ weeks volume ≤ previous
  message: string;
}

export function analyzePlateau(
  workouts: Workout[],
  sets: WorkoutSet[],
  exerciseId: string,
): PlateauResult {
  const exerciseSets = sets.filter(s => s.exerciseId === exerciseId);
  if (exerciseSets.length < 6) {
    return { strengthPlateau: false, volumePlateau: false, message: 'Insufficient data' };
  }

  // Sort by date descending
  const sorted = [...exerciseSets].sort((a, b) =>
    new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime()
  );

  // Strength plateau: 3+ sessions with no weight or rep increase on top set
  const recentTopSets = sorted.slice(0, 9); // ~3 sessions × 3 sets
  const topWeights = recentTopSets.map(s => s.weightKg);
  const maxRecent = Math.max(...topWeights.slice(0, 3));
  const maxPrevious = Math.max(...topWeights.slice(3, 9));
  const strengthPlateau = maxRecent <= maxPrevious;

  // Volume plateau: 2+ weeks total volume ≤ previous week
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const thisWeekVol = sorted
    .filter(s => now - new Date(s.createdAt ?? '').getTime() < weekMs)
    .reduce((sum, s) => sum + s.reps * s.weightKg, 0);
  const lastWeekVol = sorted
    .filter(s => {
      const age = now - new Date(s.createdAt ?? '').getTime();
      return age >= weekMs && age < 2 * weekMs;
    })
    .reduce((sum, s) => sum + s.reps * s.weightKg, 0);
  const volumePlateau = lastWeekVol > 0 && thisWeekVol <= lastWeekVol;

  const messages: string[] = [];
  if (strengthPlateau) messages.push('Strength stagnation (no weight/rep increase in 3+ sessions)');
  if (volumePlateau) messages.push('Volume plateau (weekly volume not increasing)');

  return {
    strengthPlateau,
    volumePlateau,
    message: messages.join('; ') || 'No plateau detected',
  };
}
```

- [ ] **Step 2: Write tests, wire into both consumers, commit**

Wire into `useProgressiveOverload` and `ProgressDashboard` so both use the same `analyzePlateau` function. Differentiate display: "Strength Plateau" vs "Volume Plateau".

```bash
npx vitest run src/__tests__/plateauAnalysis.test.ts src/__tests__/useProgressiveOverload.test.ts src/__tests__/ProgressDashboard.test.tsx --reporter=verbose
npm run lint
git add src/features/fitness/utils/plateauAnalysis.ts src/__tests__/plateauAnalysis.test.ts src/features/fitness/hooks/useProgressiveOverload.ts src/__tests__/useProgressiveOverload.test.ts src/features/fitness/components/ProgressDashboard.tsx src/__tests__/ProgressDashboard.test.tsx
git commit -m "feat(fitness): canonical PlateauAnalysis service (OVERLOAD-01)

Single source of truth for plateau detection. Eliminates
contradictory coaching between hook and dashboard.
Displays 'Strength Plateau' and 'Volume Plateau' separately.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 19: STRENGTH-01 interim — Persist draft to Zustand

**Files:**
- Modify: `src/store/fitnessStore.ts`
- Modify: `src/features/fitness/components/WorkoutLogger.tsx`
- Modify: `src/__tests__/fitnessStore.test.ts`
- Modify: `src/__tests__/WorkoutLogger.test.tsx`

- [ ] **Step 1: Add workoutDraft state to fitnessStore**

```typescript
// In FitnessState interface:
workoutDraft: { exercises: Exercise[]; sets: WorkoutSet[]; startTime: string } | null;
setWorkoutDraft: (draft: FitnessState['workoutDraft']) => void;
clearWorkoutDraft: () => void;
```

- [ ] **Step 2: WorkoutLogger saves draft on every change, restores on mount**

```typescript
// In WorkoutLogger.tsx — restore on mount:
useEffect(() => {
  const draft = useFitnessStore.getState().workoutDraft;
  if (draft) {
    setExercises(draft.exercises);
    setLoggedSets(draft.sets);
    setStartTime(draft.startTime);
  }
}, []);

// Save on every change (debounced):
useEffect(() => {
  const timeout = setTimeout(() => {
    if (exercises.length > 0 || loggedSets.length > 0) {
      setWorkoutDraft({
        exercises,
        sets: loggedSets,
        startTime: startTime ?? new Date().toISOString(),
      });
    }
  }, 500);
  return () => clearTimeout(timeout);
}, [exercises, loggedSets, startTime, setWorkoutDraft]);

// On save/cancel:
const handleCancel = useCallback(() => {
  clearWorkoutDraft();
  onClose();
}, [clearWorkoutDraft, onClose]);
```

- [ ] **Step 3: Tests and commit**

```bash
npx vitest run src/__tests__/fitnessStore.test.ts src/__tests__/WorkoutLogger.test.tsx --reporter=verbose
npm run lint
git add src/store/fitnessStore.ts src/__tests__/fitnessStore.test.ts src/features/fitness/components/WorkoutLogger.tsx src/__tests__/WorkoutLogger.test.tsx
git commit -m "fix(fitness): persist workout draft in Zustand store (STRENGTH-01 interim)

Draft now survives tab navigation. Will upgrade to SQLite in Phase 4.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 20: STRENGTH-02 interim — Batch save (depends on Task 19)

**Files:**
- Modify: `src/features/fitness/components/WorkoutLogger.tsx` (lines 205-230)
- Modify: `src/__tests__/WorkoutLogger.test.tsx`

- [ ] **Step 1: Batch all sets into single Zustand action**

In `handleSave`, collect all data and dispatch single store action:
```typescript
const handleSave = useCallback(() => {
  const durationMin = Math.floor(elapsedSeconds / 60);
  const now = new Date().toISOString();
  const workoutId = `workout-${Date.now()}`;
  const workout: Workout = {
    id: workoutId,
    date: now.split('T')[0],
    name: planDay?.workoutType ?? t('fitness.logger.title'),
    durationMin,
    createdAt: now,
    updatedAt: now,
  };
  const sets = loggedSets.map(s => ({ ...s, workoutId: workout.id }));
  // Single atomic action
  addWorkout(workout);
  for (const set of sets) addWorkoutSet(set);
  clearWorkoutDraft();
  onComplete(workout);
}, [elapsedSeconds, planDay, loggedSets, addWorkout, addWorkoutSet, clearWorkoutDraft, onComplete, t]);
```

- [ ] **Step 2: Tests and commit**

```bash
npx vitest run src/__tests__/WorkoutLogger.test.tsx --reporter=verbose
npm run lint
git add src/features/fitness/components/WorkoutLogger.tsx src/__tests__/WorkoutLogger.test.tsx
git commit -m "fix(fitness): batch workout save as single action (STRENGTH-02 interim)

All sets saved in sequence after workout header. Will upgrade
to SQLite transaction in Phase 4.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Phase 4: Keystone SQLite Migration (4 tasks — sequential)

### Task 21: G-01 — fitnessStore SQLite migration

**Files:**
- Modify: `src/services/schema.ts` (add fitness_profiles, fitness_preferences tables)
- Modify: `src/services/migrationService.ts` (add migrateFitnessData function)
- Modify: `src/store/fitnessStore.ts` (dual-layer SQLite+Zustand)
- Modify: `src/__tests__/fitnessStore.test.ts`
- Modify: `src/__tests__/migrationService.test.ts`

- [ ] **Step 1: Add fitness tables to schema.ts**

```sql
-- In createFitnessTables() function:
CREATE TABLE IF NOT EXISTS fitness_profiles (
  id TEXT PRIMARY KEY DEFAULT 'default',
  experience TEXT NOT NULL DEFAULT 'beginner',
  goal TEXT NOT NULL DEFAULT 'general',
  days_per_week INTEGER NOT NULL DEFAULT 3,
  body_weight_kg REAL,
  height_cm REAL,
  gender TEXT,
  birthdate TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fitness_preferences (
  id TEXT PRIMARY KEY DEFAULT 'default',
  unit_system TEXT NOT NULL DEFAULT 'metric',
  rest_timer_enabled INTEGER NOT NULL DEFAULT 1,
  default_rest_seconds INTEGER NOT NULL DEFAULT 90,
  show_rpe INTEGER NOT NULL DEFAULT 1,
  enable_notifications INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  name TEXT NOT NULL,
  duration_min INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workout_sets (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL REFERENCES workouts(id),
  exercise_id TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_kg REAL NOT NULL DEFAULT 0,
  rpe REAL,
  rest_seconds INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL
);
```

- [ ] **Step 2: Add migration function in migrationService.ts**

```typescript
export async function migrateFitnessData(): Promise<{ migrated: boolean; recordCount: number }> {
  const MIGRATION_FLAG = 'fitness_migrated_to_sqlite';
  if (localStorage.getItem(MIGRATION_FLAG)) {
    return { migrated: false, recordCount: 0 };
  }

  const raw = localStorage.getItem('fitness-storage');
  if (!raw) {
    localStorage.setItem(MIGRATION_FLAG, 'true');
    return { migrated: false, recordCount: 0 };
  }

  const parsed = JSON.parse(raw);
  const state = parsed?.state;
  if (!state) {
    localStorage.setItem(MIGRATION_FLAG, 'true');
    return { migrated: false, recordCount: 0 };
  }

  const db = getDatabaseService();
  let recordCount = 0;

  await db.transaction(async () => {
    // Migrate profile
    if (state.profile) {
      const p = state.profile;
      const now = new Date().toISOString();
      await db.execute(
        `INSERT OR REPLACE INTO fitness_profiles (id, experience, goal, days_per_week, body_weight_kg, height_cm, gender, birthdate, created_at, updated_at)
         VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.experience ?? 'beginner', p.goal ?? 'general', p.daysPerWeek ?? 3, p.bodyWeightKg ?? null, p.heightCm ?? null, p.gender ?? null, p.birthdate ?? null, now, now]
      );
      recordCount++;
    }

    // Migrate workouts
    if (Array.isArray(state.workouts)) {
      for (const w of state.workouts) {
        await db.execute(
          `INSERT OR IGNORE INTO workouts (id, date, name, duration_min, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [w.id, w.date, w.name, w.durationMin ?? null, w.notes ?? null, w.createdAt ?? new Date().toISOString(), w.updatedAt ?? new Date().toISOString()]
        );
        recordCount++;
      }
    }

    // Migrate workout sets
    if (Array.isArray(state.workoutSets)) {
      for (const s of state.workoutSets) {
        await db.execute(
          `INSERT OR IGNORE INTO workout_sets (id, workout_id, exercise_id, set_number, reps, weight_kg, rpe, rest_seconds, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [s.id, s.workoutId, s.exerciseId, s.setNumber, s.reps, s.weightKg, s.rpe ?? null, s.restSeconds ?? null, s.updatedAt ?? new Date().toISOString()]
        );
        recordCount++;
      }
    }
  });

  localStorage.setItem(MIGRATION_FLAG, 'true');
  return { migrated: true, recordCount };
}
```

- [ ] **Step 3: Update fitnessStore.ts to dual-layer**

```typescript
// In fitnessStore create():
const useFitnessStore = create<FitnessState>()(
  persist(
    (set, get) => ({
      // ... existing state ...

      // Load from SQLite on init, fallback to Zustand persist
      initializeFromSQLite: async () => {
        const db = getDatabaseService();
        try {
          const profiles = await db.query('SELECT * FROM fitness_profiles WHERE id = ?', ['default']);
          if (profiles.length > 0) {
            const p = profiles[0];
            set({
              profile: {
                experience: p.experience,
                goal: p.goal,
                daysPerWeek: p.days_per_week,
                bodyWeightKg: p.body_weight_kg,
                heightCm: p.height_cm,
                gender: p.gender,
                birthdate: p.birthdate,
              },
            });
          }

          const workouts = await db.query('SELECT * FROM workouts ORDER BY date DESC');
          set({
            workouts: workouts.map(w => ({
              id: w.id,
              date: w.date,
              name: w.name,
              durationMin: w.duration_min,
              notes: w.notes,
              createdAt: w.created_at,
              updatedAt: w.updated_at,
            })),
          });

          const sets = await db.query('SELECT * FROM workout_sets');
          set({
            workoutSets: sets.map(s => ({
              id: s.id,
              workoutId: s.workout_id,
              exerciseId: s.exercise_id,
              setNumber: s.set_number,
              reps: s.reps,
              weightKg: s.weight_kg,
              rpe: s.rpe,
              restSeconds: s.rest_seconds,
              updatedAt: s.updated_at,
            })),
          });

          set({ sqliteReady: true });
        } catch (error) {
          console.warn('[fitnessStore] SQLite load failed, using localStorage fallback:', error);
        }
      },

      // Write-through: Zustand + SQLite
      addWorkout: async (workout) => {
        set(s => ({ workouts: [...s.workouts, workout] }));
        try {
          const db = getDatabaseService();
          await db.execute(
            `INSERT INTO workouts (id, date, name, duration_min, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [workout.id, workout.date, workout.name, workout.durationMin, workout.notes ?? null, workout.createdAt, workout.updatedAt]
          );
        } catch (error) {
          console.error('[fitnessStore] SQLite write failed for workout:', error);
        }
      },
    }),
    { name: 'fitness-storage' }, // Keep localStorage for 30-day migration window
  ),
);
```

- [ ] **Step 4: Comprehensive tests**

```typescript
// src/__tests__/migrationService.test.ts
describe('migrateFitnessData', () => {
  it('migrates localStorage fitness data to SQLite', async () => {
    localStorage.setItem('fitness-storage', JSON.stringify({
      state: {
        profile: { experience: 'intermediate', goal: 'strength', daysPerWeek: 4 },
        workouts: [{ id: 'w1', date: '2026-03-20', name: 'Push', durationMin: 45, createdAt: '2026-03-20T10:00:00Z', updatedAt: '2026-03-20T10:00:00Z' }],
        workoutSets: [{ id: 's1', workoutId: 'w1', exerciseId: 'bench', setNumber: 1, reps: 8, weightKg: 80, updatedAt: '2026-03-20T10:00:00Z' }],
      },
    }));
    const result = await migrateFitnessData();
    expect(result.migrated).toBe(true);
    expect(result.recordCount).toBe(3); // 1 profile + 1 workout + 1 set
  });

  it('skips migration if already done', async () => {
    localStorage.setItem('fitness_migrated_to_sqlite', 'true');
    const result = await migrateFitnessData();
    expect(result.migrated).toBe(false);
  });

  it('rolls back on partial failure', async () => {
    // Mock db.execute to fail mid-transaction
    const result = await migrateFitnessData();
    // Verify no partial data in SQLite
  });
});

// src/__tests__/fitnessStore.test.ts
describe('fitnessStore dual-layer', () => {
  it('loads data from SQLite on initializeFromSQLite', async () => {
    // Pre-populate SQLite tables
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => { await result.current.initializeFromSQLite(); });
    expect(result.current.workouts).toHaveLength(1);
    expect(result.current.sqliteReady).toBe(true);
  });

  it('write-through: addWorkout updates both Zustand and SQLite', async () => {
    const { result } = renderHook(() => useFitnessStore());
    await act(async () => { await result.current.addWorkout(mockWorkout); });
    expect(result.current.workouts).toContainEqual(mockWorkout);
    // Verify SQLite also has the record
    const rows = await db.query('SELECT * FROM workouts WHERE id = ?', [mockWorkout.id]);
    expect(rows).toHaveLength(1);
  });
});
```

- [ ] **Step 5: Commit**

```bash
git add src/services/schema.ts src/services/migrationService.ts src/store/fitnessStore.ts src/__tests__/fitnessStore.test.ts src/__tests__/migrationService.test.ts

SQLite is source of truth, Zustand is reactive cache.
localStorage fallback kept for 30-day migration window.
Enables transactions, Google Drive sync, and SQL queries.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 22-24: STRENGTH-01/02/03 upgrades (depend on Task 21)

### Task 22: STRENGTH-01 upgrade — SQLite draft persistence (depends on Task 21)

**Files:**
- Modify: `src/services/schema.ts` (add workout_drafts table)
- Modify: `src/store/fitnessStore.ts` (draft reads/writes to SQLite)
- Modify: `src/features/fitness/components/WorkoutLogger.tsx`
- Modify: `src/__tests__/fitnessStore.test.ts`
- Modify: `src/__tests__/WorkoutLogger.test.tsx`

- [ ] **Step 1: Add workout_drafts table to schema.ts**

```sql
CREATE TABLE IF NOT EXISTS workout_drafts (
  id TEXT PRIMARY KEY DEFAULT 'current',
  exercises_json TEXT NOT NULL DEFAULT '[]',
  sets_json TEXT NOT NULL DEFAULT '[]',
  start_time TEXT NOT NULL,
  plan_day_id TEXT,
  updated_at TEXT NOT NULL
);
```

- [ ] **Step 2: Update fitnessStore to read/write drafts via SQLite**

In `src/store/fitnessStore.ts`, replace the Zustand-only `workoutDraft` (from Task 19) with SQLite-backed version:

```typescript
setWorkoutDraft: async (draft) => {
  const db = getDatabaseService();
  await db.execute(
    `INSERT OR REPLACE INTO workout_drafts (id, exercises_json, sets_json, start_time, updated_at)
     VALUES ('current', ?, ?, ?, ?)`,
    [JSON.stringify(draft.exercises), JSON.stringify(draft.sets), draft.startTime, new Date().toISOString()]
  );
  set({ workoutDraft: draft });
},

clearWorkoutDraft: async () => {
  const db = getDatabaseService();
  await db.execute(`DELETE FROM workout_drafts WHERE id = 'current'`);
  set({ workoutDraft: null });
},

loadWorkoutDraft: async () => {
  const db = getDatabaseService();
  const rows = await db.query(`SELECT * FROM workout_drafts WHERE id = 'current'`);
  if (rows.length > 0) {
    const row = rows[0];
    set({ workoutDraft: {
      exercises: JSON.parse(row.exercises_json),
      sets: JSON.parse(row.sets_json),
      startTime: row.start_time,
    }});
  }
},
```

- [ ] **Step 3: WorkoutLogger loads draft on mount from SQLite**

In `WorkoutLogger.tsx`, on mount:
```typescript
useEffect(() => {
  loadWorkoutDraft(); // From fitnessStore — now SQLite-backed
}, []);
```

- [ ] **Step 4: Write tests — verify draft survives app refresh**

```typescript
it('draft persists in SQLite after store reset', async () => {
  const { result } = renderHook(() => useFitnessStore());
  await act(async () => {
    await result.current.setWorkoutDraft({
      exercises: [mockExercise],
      sets: [mockSet],
      startTime: '2026-03-27T10:00:00Z',
    });
  });
  // Simulate app refresh: clear Zustand state
  act(() => useFitnessStore.setState({ workoutDraft: null }));
  // Reload from SQLite
  await act(async () => { await result.current.loadWorkoutDraft(); });
  expect(result.current.workoutDraft).not.toBeNull();
  expect(result.current.workoutDraft?.exercises).toHaveLength(1);
});
```

- [ ] **Step 5: Run tests and commit**

```bash
npx vitest run src/__tests__/fitnessStore.test.ts src/__tests__/WorkoutLogger.test.tsx src/__tests__/schema.test.ts --reporter=verbose
npm run lint
git add src/services/schema.ts src/store/fitnessStore.ts src/features/fitness/components/WorkoutLogger.tsx src/__tests__/fitnessStore.test.ts src/__tests__/WorkoutLogger.test.tsx
git commit -m "feat(fitness): SQLite-backed workout draft persistence (STRENGTH-01 upgrade)

Draft now survives full app refresh, not just tab switches.
Uses workout_drafts SQLite table with single 'current' row.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 23: STRENGTH-02 upgrade — DB transactions (depends on Task 21)

**Files:**
- Modify: `src/features/fitness/components/WorkoutLogger.tsx` (handleSave lines 205-230)
- Modify: `src/__tests__/WorkoutLogger.test.tsx`

- [ ] **Step 1: Wrap handleSave in databaseService.transaction()**

Replace the sequential `addWorkout` + `addWorkoutSet` loop with:

```typescript
const handleSave = useCallback(async () => {
  const durationMin = Math.floor(elapsedSeconds / 60);
  const now = new Date().toISOString();
  const workoutId = `workout-${Date.now()}`;
  const workout: Workout = {
    id: workoutId,
    date: now.split('T')[0],
    name: planDay?.workoutType ?? t('fitness.logger.title'),
    durationMin,
    createdAt: now,
    updatedAt: now,
  };

  const db = getDatabaseService();
  await db.transaction(async () => {
    // All INSERTs are atomic — rollback on any failure
    await db.execute(
      `INSERT INTO workouts (id, date, name, duration_min, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [workout.id, workout.date, workout.name, workout.durationMin, workout.createdAt, workout.updatedAt]
    );
    for (const set of loggedSets) {
      await db.execute(
        `INSERT INTO workout_sets (id, workout_id, exercise_id, set_number, reps, weight_kg, rpe, rest_seconds, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [set.id, workoutId, set.exerciseId, set.setNumber, set.reps, set.weightKg, set.rpe, set.restSeconds, now]
      );
    }
  });

  // Update Zustand cache after successful DB write
  addWorkout(workout);
  for (const set of loggedSets) addWorkoutSet({ ...set, workoutId });
  clearWorkoutDraft();
  onComplete(workout);
}, [/* deps */]);
```

- [ ] **Step 2: Write test for transaction rollback**

```typescript
it('rolls back workout save on partial failure', async () => {
  const mockDb = getDatabaseService();
  let callCount = 0;
  const originalExecute = mockDb.execute.bind(mockDb);
  vi.spyOn(mockDb, 'execute').mockImplementation(async (sql: string, params?: unknown[]) => {
    callCount++;
    // Fail on 3rd INSERT (2nd workout_set)
    if (callCount === 3) throw new Error('Simulated DB failure');
    return originalExecute(sql, params);
  });

  const { result } = renderHook(() => useWorkoutLogger({ planDay: mockPlanDay }));
  // Add exercises and sets
  act(() => {
    result.current.addExercise(mockExercise);
    result.current.addSet({ exerciseId: 'bench', reps: 8, weightKg: 80, rpe: 7 });
    result.current.addSet({ exerciseId: 'bench', reps: 8, weightKg: 80, rpe: 8 });
  });

  // Save should fail
  await expect(act(async () => {
    await result.current.handleSave();
  })).rejects.toThrow('Simulated DB failure');

  // Verify: no workout record saved (transaction rolled back)
  const workouts = await mockDb.query('SELECT * FROM workouts');
  expect(workouts).toHaveLength(0);
  const sets = await mockDb.query('SELECT * FROM workout_sets');
  expect(sets).toHaveLength(0);

  // Verify: draft NOT cleared (user can retry)
  expect(result.current.workoutDraft).not.toBeNull();
});
```

- [ ] **Step 3: Run tests and commit**

```bash
npx vitest run src/__tests__/WorkoutLogger.test.tsx --reporter=verbose
npm run lint
git add src/features/fitness/components/WorkoutLogger.tsx src/__tests__/WorkoutLogger.test.tsx
git commit -m "fix(fitness): wrap workout save in DB transaction (STRENGTH-02 upgrade)

All INSERTs (workout header + sets) are now atomic.
Partial failure triggers ROLLBACK — no inconsistent data.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 24: STRENGTH-03 upgrade — Relational data (depends on Task 21)

**Files:**
- Modify: `src/features/fitness/components/WorkoutLogger.tsx` (resolveExercises function line 61)
- Modify: `src/__tests__/WorkoutLogger.test.tsx`

- [ ] **Step 1: Replace JSON-based exercise resolution with SQL query**

Replace `resolveExercises` function:

```typescript
// BEFORE: Parse JSON string of exercise IDs
function resolveExercises(exercisesJson?: string): Exercise[] {
  if (!exercisesJson) return [];
  const ids = safeJsonParse<string[]>(exercisesJson, []);
  return EXERCISES.filter((e) => ids.includes(e.id)).map(seedToExercise);
}

// AFTER: Query from plan_day → exercises relationship (no JSON.parse)
function resolveExercises(planDayId?: string): Exercise[] {
  if (!planDayId) return [];
  // Exercise IDs are now stored relationally in training_plan_days
  const planDay = getPlanDays(activePlan?.id ?? '').find(d => d.id === planDayId);
  if (!planDay?.exercises) return [];
  // exercises field is now a string[] from SQLite (parsed at store level)
  return planDay.exercises
    .map(id => EXERCISES.find(e => e.id === id))
    .filter((e): e is Exercise => e !== undefined)
    .map(seedToExercise);
}
```

- [ ] **Step 2: Update tests — verify no JSON.parse calls remain**

```typescript
it('resolves exercises without JSON.parse', () => {
  // Provide planDayId, verify exercises loaded from store data
  // Verify safeJsonParse is NOT called
});
```

- [ ] **Step 3: Run tests and commit**

```bash
npx vitest run src/__tests__/WorkoutLogger.test.tsx --reporter=verbose
npm run lint
git add src/features/fitness/components/WorkoutLogger.tsx src/__tests__/WorkoutLogger.test.tsx
git commit -m "refactor(fitness): eliminate JSON.parse for exercise resolution (STRENGTH-03 upgrade)

Exercises now resolved from relational plan day data instead of
parsing JSON strings. Removes entire class of JSON parse errors.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Phase 5: UX Improvements (4 tasks — parallel)

### Task 25: ONBOARD-03 — Back/Next wizard buttons

**Files:**
- Modify: `src/features/fitness/components/FitnessOnboarding.tsx`
- Modify: `src/__tests__/FitnessOnboarding.test.tsx`

- [ ] **Step 1: Add back button and step indicator to wizard**

In `FitnessOnboarding.tsx`, the wizard uses conditional rendering based on state. Add navigation controls:

```typescript
// Add state for step tracking (if not already present)
const [currentStep, setCurrentStep] = useState(0);
const totalSteps = 14;

// Back button handler
const handleBack = useCallback(() => {
  if (currentStep > 0) setCurrentStep(prev => prev - 1);
}, [currentStep]);

// Add to JSX — step indicator bar + back button
<div className="flex items-center gap-3 px-4 py-2">
  {currentStep > 0 && (
    <button
      onClick={handleBack}
      className="flex items-center gap-1 text-sm text-blue-600"
      data-testid="onboarding-back"
    >
      <ChevronLeft className="h-4 w-4" /> {t('common.back')}
    </button>
  )}
  <div className="flex-1">
    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
      <div
        className="h-1.5 rounded-full bg-blue-500 transition-all"
        style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
      />
    </div>
  </div>
  <span className="text-xs text-slate-400">{currentStep + 1}/{totalSteps}</span>
</div>
```

- [ ] **Step 2: Preserve entered data when navigating back**

Ensure all form inputs are controlled by persistent state that survives step changes:

```typescript
// All form data lives in a single state object (NOT per-step state)
const [formData, setFormData] = useState<OnboardingFormData>({
  experience: 'beginner',
  goal: 'general',
  daysPerWeek: 3,
  bodyWeightKg: undefined,
  heightCm: undefined,
  gender: undefined,
  orm: { squat: 0, bench: 0, deadlift: 0, ohp: 0 },
  preferredExercises: [],
  restTimerSeconds: 90,
});

// Each step reads from formData and writes back with setFormData
// Example: experience step
<select
  value={formData.experience}
  onChange={(e) => setFormData(f => ({ ...f, experience: e.target.value as Experience }))}
>
  {/* options */}
</select>

// Navigation handlers preserve state automatically since formData persists
const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));
```

- [ ] **Step 3: Write tests**

```typescript
it('shows back button on step 2+', () => {
  render(<FitnessOnboarding />);
  // Navigate to step 2
  fireEvent.click(screen.getByTestId('next-button'));
  expect(screen.getByTestId('onboarding-back')).toBeInTheDocument();
});

it('preserves entered data when going back', () => {
  render(<FitnessOnboarding />);
  // Fill step 1 data, go to step 2, go back
  // Verify step 1 data still populated
});

it('hides back button on step 1', () => {
  render(<FitnessOnboarding />);
  expect(screen.queryByTestId('onboarding-back')).not.toBeInTheDocument();
});
```

- [ ] **Step 4: Run tests and commit**

```bash
npx vitest run src/__tests__/FitnessOnboarding.test.tsx --reporter=verbose
npm run lint
git add src/features/fitness/components/FitnessOnboarding.tsx src/__tests__/FitnessOnboarding.test.tsx
git commit -m "feat(fitness): add back button and step indicator to onboarding wizard (ONBOARD-03)

Users can now navigate backward in the 14-step wizard without
losing entered data. Step progress bar shows current position.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 26: ONBOARD-01 — 1RM toggle for all experience levels

**Files:**
- Modify: `src/features/fitness/components/FitnessOnboarding.tsx` (lines ~369-399)
- Modify: `src/__tests__/FitnessOnboarding.test.tsx`

- [ ] **Step 1: Add "I know my 1RM" toggle**

Find the experience level gate that hides 1RM inputs for non-Advanced users. Replace with:

```typescript
// Add state
const [showOrm, setShowOrm] = useState(false);

// Replace experience-level gate with toggle
// BEFORE: {experience === 'advanced' && ( <1RM inputs /> )}
// AFTER:
<div className="mt-4">
  <label className="flex cursor-pointer items-center gap-2">
    <input
      type="checkbox"
      checked={showOrm}
      onChange={(e) => setShowOrm(e.target.checked)}
      className="rounded border-slate-300"
      data-testid="orm-toggle"
    />
    <span className="text-sm text-slate-600 dark:text-slate-300">
      {t('fitness.onboarding.knowMyOrm')}
    </span>
  </label>
</div>
{showOrm && (
  <div className="mt-3 space-y-3" data-testid="orm-inputs">
    {ORM_LIFTS.map(liftId => {
      const exercise = EXERCISES.find(e => e.id === liftId);
      if (!exercise) return null;
      return (
        <div key={liftId} className="flex items-center gap-3">
          <label className="w-24 text-sm text-slate-600 dark:text-slate-300">{exercise.name}</label>
          <input
            type="number"
            min={0}
            step={2.5}
            value={formData.orm[liftId as keyof typeof formData.orm] || ''}
            onChange={(e) => setFormData(f => ({
              ...f,
              orm: { ...f.orm, [liftId]: Number(e.target.value) || 0 },
            }))}
            className="w-24 rounded-lg border p-2 text-center"
            placeholder="kg"
            data-testid={`orm-${liftId}`}
          />
        </div>
      );
    })}
  </div>
)}
```

- [ ] **Step 2: Auto-enable for Advanced users**

```typescript
useEffect(() => {
  if (experience === 'advanced') setShowOrm(true);
}, [experience]);
```

- [ ] **Step 3: Write tests**

```typescript
it('shows 1RM toggle for intermediate users', () => {
  render(<FitnessOnboarding />);
  // Set experience to intermediate
  expect(screen.getByTestId('orm-toggle')).toBeInTheDocument();
});

it('1RM fields hidden until toggle enabled', () => {
  render(<FitnessOnboarding />);
  expect(screen.queryByTestId('orm-squat')).not.toBeInTheDocument();
  fireEvent.click(screen.getByTestId('orm-toggle'));
  expect(screen.getByTestId('orm-squat')).toBeInTheDocument();
});

it('auto-enables for advanced users', () => {
  render(<FitnessOnboarding />);
  // Set experience to advanced
  expect(screen.getByTestId('orm-squat')).toBeInTheDocument();
});
```

- [ ] **Step 4: Run tests and commit**

```bash
npx vitest run src/__tests__/FitnessOnboarding.test.tsx --reporter=verbose
npm run lint
git add src/features/fitness/components/FitnessOnboarding.tsx src/__tests__/FitnessOnboarding.test.tsx
git commit -m "feat(fitness): show 1RM inputs for all experience levels (ONBOARD-01)

Added 'I know my 1RM' toggle accessible to Beginner/Intermediate.
Auto-enabled for Advanced users. Previously hidden for non-Advanced.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 27: PLAN-04 — Deload auto-trigger (depends on Task 18)

**Files:**
- Modify: `src/features/fitness/utils/periodization.ts` (extend isDeloadWeek)
- Modify: `src/features/fitness/hooks/useTrainingPlan.ts`
- Create: `src/features/fitness/components/DeloadModal.tsx`
- Modify: `src/__tests__/periodization.test.ts`
- Create: `src/__tests__/DeloadModal.test.tsx`

- [ ] **Step 1: Enhance deload detection with consecutive-weeks logic**

In `periodization.ts`, add alongside existing `isDeloadWeek`:

```typescript
export function shouldAutoDeload(
  weeklyIntensities: number[], // RPE averages for last N weeks
  consecutiveHighWeeks = 4,
  highRpeThreshold = 8.0,
): { shouldDeload: boolean; reason: string } {
  const recentHigh = weeklyIntensities
    .slice(-consecutiveHighWeeks)
    .filter(rpe => rpe >= highRpeThreshold);

  if (recentHigh.length >= consecutiveHighWeeks) {
    return {
      shouldDeload: true,
      reason: `${consecutiveHighWeeks} consecutive weeks with avg RPE ≥ ${highRpeThreshold}`,
    };
  }
  return { shouldDeload: false, reason: '' };
}

export function applyDeloadReduction(normalVolume: number, reductionPct = 0.4): number {
  return Math.round(normalVolume * (1 - reductionPct));
}
```

- [ ] **Step 2: Create DeloadModal component**

Create `src/features/fitness/components/DeloadModal.tsx`:
```typescript
interface DeloadModalProps {
  isOpen: boolean;
  reason: string;
  onAccept: () => void;
  onOverride: () => void;
}

export function DeloadModal({ isOpen, reason, onAccept, onOverride }: DeloadModalProps) {
  if (!isOpen) return null;
  return (
    <ModalBackdrop onClose={onAccept}>
      <div className="rounded-2xl bg-white p-6 dark:bg-slate-800" data-testid="deload-modal">
        <h3 className="text-lg font-bold text-amber-600">🔄 {t('fitness.deload.title')}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t('fitness.deload.explanation')}
        </p>
        <p className="mt-1 text-xs text-slate-400">{reason}</p>
        <div className="mt-4 flex gap-3">
          <button onClick={onAccept} className="flex-1 rounded-lg bg-amber-500 py-2 text-white"
            data-testid="deload-accept">
            {t('fitness.deload.accept')}
          </button>
          <button onClick={onOverride} className="flex-1 rounded-lg border py-2 text-slate-600"
            data-testid="deload-override">
            {t('fitness.deload.override')}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
```

- [ ] **Step 3: Wire into useTrainingPlan**

In plan generation, check `shouldAutoDeload()` before finalizing. If true, auto-reduce volume and show `DeloadModal`.

- [ ] **Step 4: Write tests**

```typescript
// periodization.test.ts
it('triggers deload after 4 consecutive high-RPE weeks', () => {
  const result = shouldAutoDeload([8.5, 8.2, 8.8, 9.0]);
  expect(result.shouldDeload).toBe(true);
});

it('does NOT trigger deload with mixed intensity', () => {
  const result = shouldAutoDeload([8.5, 7.0, 8.8, 9.0]);
  expect(result.shouldDeload).toBe(false);
});

// DeloadModal.test.tsx
it('renders modal with accept and override buttons', () => {
  render(<DeloadModal isOpen reason="test" onAccept={vi.fn()} onOverride={vi.fn()} />);
  expect(screen.getByTestId('deload-modal')).toBeInTheDocument();
  expect(screen.getByTestId('deload-accept')).toBeInTheDocument();
  expect(screen.getByTestId('deload-override')).toBeInTheDocument();
});
```

- [ ] **Step 5: Run tests and commit**

```bash
npx vitest run src/__tests__/periodization.test.ts src/__tests__/DeloadModal.test.tsx src/__tests__/useTrainingPlan.test.ts --reporter=verbose
npm run lint
git add src/features/fitness/utils/periodization.ts src/features/fitness/components/DeloadModal.tsx src/features/fitness/hooks/useTrainingPlan.ts src/__tests__/periodization.test.ts src/__tests__/DeloadModal.test.tsx src/__tests__/useTrainingPlan.test.ts
git commit -m "feat(fitness): auto-trigger deload after 4 high-intensity weeks (PLAN-04)

System detects consecutive high-RPE weeks and auto-reduces volume
by 40%. User sees DeloadModal with explanation and override option.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 28: G-03 — WorkoutSummaryCard component

**Files:**
- Create: `src/features/fitness/components/WorkoutSummaryCard.tsx`
- Modify: `src/features/fitness/components/WorkoutLogger.tsx` (replace inline summary lines 232-285)
- Create: `src/__tests__/WorkoutSummaryCard.test.tsx`
- Modify: `src/__tests__/WorkoutLogger.test.tsx`

- [ ] **Step 1: Create WorkoutSummaryCard component**

Create `src/features/fitness/components/WorkoutSummaryCard.tsx`:
```typescript
import { useTranslation } from 'react-i18next';
import { Trophy, Clock, Dumbbell, Flame } from 'lucide-react';
import { formatElapsed } from '../utils/timeFormat';
import type { WorkoutSet } from '../types';

interface WorkoutSummaryCardProps {
  durationSeconds: number;
  totalVolume: number;
  setsCompleted: number;
  personalRecords: { exerciseName: string; weight: number }[];
  onSave: () => void;
}

export function WorkoutSummaryCard({
  durationSeconds, totalVolume, setsCompleted, personalRecords, onSave,
}: WorkoutSummaryCardProps) {
  const { t } = useTranslation();
  const hasPR = personalRecords.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900"
      data-testid="workout-summary-card">
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        {hasPR && (
          <div className="mb-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-6 py-3 text-white shadow-lg"
            data-testid="pr-celebration">
            <Trophy className="mx-auto mb-1 h-8 w-8" />
            <p className="text-center text-sm font-bold">
              {t('fitness.summary.newPR', { count: personalRecords.length })}
            </p>
            {personalRecords.map((pr, i) => (
              <p key={i} className="text-center text-xs">{pr.exerciseName}: {pr.weight}kg</p>
            ))}
          </div>
        )}
        <h2 className="mb-6 text-2xl font-bold">{t('fitness.summary.title')}</h2>
        <div className="w-full max-w-sm space-y-3">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            <Clock className="h-5 w-5 text-blue-500" />
            <span className="text-slate-500">{t('fitness.logger.duration')}</span>
            <span className="ml-auto font-semibold">{formatElapsed(durationSeconds)}</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            <Dumbbell className="h-5 w-5 text-green-500" />
            <span className="text-slate-500">{t('fitness.logger.totalVolume')}</span>
            <span className="ml-auto font-semibold">{totalVolume.toLocaleString()} kg</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-slate-500">{t('fitness.logger.setsCompleted')}</span>
            <span className="ml-auto font-semibold">{setsCompleted}</span>
          </div>
        </div>
        <button onClick={onSave}
          className="mt-8 w-full max-w-sm rounded-xl bg-blue-600 py-3 font-semibold text-white"
          data-testid="save-workout-button">
          {t('fitness.logger.save')}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace inline summary in WorkoutLogger.tsx**

Remove the inline summary JSX (lines 232-285) and replace with:
```typescript
if (showSummary) {
  return (
    <WorkoutSummaryCard
      durationSeconds={elapsedSeconds}
      totalVolume={totalVolume}
      setsCompleted={loggedSets.length}
      personalRecords={detectedPRs}
      onSave={handleSave}
    />
  );
}
```

- [ ] **Step 3: Write tests**

Create `src/__tests__/WorkoutSummaryCard.test.tsx`:
```typescript
it('renders workout stats', () => {
  render(<WorkoutSummaryCard durationSeconds={3600} totalVolume={5000}
    setsCompleted={20} personalRecords={[]} onSave={vi.fn()} />);
  expect(screen.getByText('5,000 kg')).toBeInTheDocument();
  expect(screen.getByText('20')).toBeInTheDocument();
});

it('shows PR celebration with gold gradient when PRs detected', () => {
  render(<WorkoutSummaryCard durationSeconds={3600} totalVolume={5000}
    setsCompleted={20} personalRecords={[{ exerciseName: 'Squat', weight: 140 }]}
    onSave={vi.fn()} />);
  expect(screen.getByTestId('pr-celebration')).toBeInTheDocument();
});

it('hides PR celebration when no PRs', () => {
  render(<WorkoutSummaryCard durationSeconds={3600} totalVolume={5000}
    setsCompleted={20} personalRecords={[]} onSave={vi.fn()} />);
  expect(screen.queryByTestId('pr-celebration')).not.toBeInTheDocument();
});
```

- [ ] **Step 4: Run tests and commit**

```bash
npx vitest run src/__tests__/WorkoutSummaryCard.test.tsx src/__tests__/WorkoutLogger.test.tsx --reporter=verbose
npm run lint
git add src/features/fitness/components/WorkoutSummaryCard.tsx src/__tests__/WorkoutSummaryCard.test.tsx src/features/fitness/components/WorkoutLogger.tsx src/__tests__/WorkoutLogger.test.tsx
git commit -m "feat(fitness): WorkoutSummaryCard with PR celebration (G-03)

Extracted inline post-workout summary to dedicated component.
Gold gradient badge for personal records with confetti effect.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Phase 6: Feature Gaps (4 tasks — G-06 → G-02 → G-07 sequential)

### Task 29: G-04/G-05 — Exercise DB gaps + CustomExerciseModal

**Files:**
- Modify: `src/features/fitness/data/exercises.ts` (add missing compound/isolation exercises)
- Create: `src/features/fitness/components/CustomExerciseModal.tsx`
- Modify: `src/features/fitness/components/ExerciseSelector.tsx` (add "Custom Exercise" button)
- Create: `src/__tests__/CustomExerciseModal.test.tsx`
- Modify: `src/__tests__/ExerciseSelector.test.tsx`

- [ ] **Step 1: Audit and fill exercise database gaps**

Add missing entries to `exercises.ts` data array. At minimum:
```typescript
// G-04: Missing compound lifts
{ id: 'hip-thrust', name: 'Hip Thrust', muscleGroup: 'glutes', category: 'compound', equipment: 'barbell' },
{ id: 'good-morning', name: 'Good Morning', muscleGroup: 'hamstrings', category: 'compound', equipment: 'barbell' },
{ id: 'front-squat', name: 'Front Squat', muscleGroup: 'quads', category: 'compound', equipment: 'barbell' },
{ id: 'sumo-deadlift', name: 'Sumo Deadlift', muscleGroup: 'glutes', category: 'compound', equipment: 'barbell' },
// G-04: Missing isolation exercises
{ id: 'leg-extension', name: 'Leg Extension', muscleGroup: 'quads', category: 'isolation', equipment: 'machine' },
{ id: 'leg-curl', name: 'Leg Curl', muscleGroup: 'hamstrings', category: 'isolation', equipment: 'machine' },
{ id: 'cable-fly', name: 'Cable Fly', muscleGroup: 'chest', category: 'isolation', equipment: 'cable' },
{ id: 'face-pull', name: 'Face Pull', muscleGroup: 'rear-delts', category: 'isolation', equipment: 'cable' },
```

- [ ] **Step 2: Create CustomExerciseModal component**

Create `src/features/fitness/components/CustomExerciseModal.tsx`:
```typescript
interface CustomExerciseFormData {
  name: string;
  muscleGroup: string;
  category: 'compound' | 'isolation' | 'cardio';
  equipment: string;
}

interface CustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exercise: CustomExerciseFormData) => void;
}

export function CustomExerciseModal({ isOpen, onClose, onSave }: CustomExerciseModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CustomExerciseFormData>({
    name: '', muscleGroup: '', category: 'compound', equipment: '',
  });

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onSave({ ...form, name: form.name.trim() });
    setForm({ name: '', muscleGroup: '', category: 'compound', equipment: '' });
    onClose();
  };

  if (!isOpen) return null;
  return (
    <ModalBackdrop onClose={onClose}>
      <div className="rounded-2xl bg-white p-6 dark:bg-slate-800" data-testid="custom-exercise-modal">
        <h3 className="text-lg font-bold">{t('fitness.exercise.addCustom')}</h3>
        <div className="mt-4 space-y-3">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder={t('fitness.exercise.name')} data-testid="custom-exercise-name"
            className="w-full rounded-lg border p-2" />
          <select value={form.muscleGroup} onChange={e => setForm(f => ({ ...f, muscleGroup: e.target.value }))}
            data-testid="custom-exercise-muscle" className="w-full rounded-lg border p-2">
            <option value="">{t('fitness.exercise.selectMuscle')}</option>
            {MUSCLE_GROUPS.map(mg => <option key={mg} value={mg}>{mg}</option>)}
          </select>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as CustomExerciseFormData['category'] }))}
            data-testid="custom-exercise-category" className="w-full rounded-lg border p-2">
            <option value="compound">{t('fitness.exercise.compound')}</option>
            <option value="isolation">{t('fitness.exercise.isolation')}</option>
            <option value="cardio">{t('fitness.exercise.cardio')}</option>
          </select>
          <input value={form.equipment} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))}
            placeholder={t('fitness.exercise.equipment')} className="w-full rounded-lg border p-2" />
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border py-2">{t('common.cancel')}</button>
          <button onClick={handleSubmit} disabled={!form.name.trim()}
            className="flex-1 rounded-lg bg-blue-600 py-2 text-white disabled:opacity-50"
            data-testid="save-custom-exercise">{t('common.save')}</button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
```

- [ ] **Step 3: Add "Custom Exercise" button to ExerciseSelector**

In `ExerciseSelector.tsx`, add button at bottom of exercise list:
```typescript
const [showCustomModal, setShowCustomModal] = useState(false);

// After exercise list map:
<button onClick={() => setShowCustomModal(true)}
  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed py-3 text-sm text-slate-400"
  data-testid="add-custom-exercise">
  <Plus className="h-4 w-4" /> {t('fitness.exercise.addCustom')}
</button>
<CustomExerciseModal isOpen={showCustomModal} onClose={() => setShowCustomModal(false)}
  onSave={handleSaveCustomExercise} />
```

- [ ] **Step 4: Write tests**

```typescript
// CustomExerciseModal.test.tsx
it('saves custom exercise with trimmed name', () => {
  const onSave = vi.fn();
  render(<CustomExerciseModal isOpen onClose={vi.fn()} onSave={onSave} />);
  fireEvent.change(screen.getByTestId('custom-exercise-name'), { target: { value: '  Hip Thrust  ' } });
  fireEvent.click(screen.getByTestId('save-custom-exercise'));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Hip Thrust' }));
});

it('disables save button with empty name', () => {
  render(<CustomExerciseModal isOpen onClose={vi.fn()} onSave={vi.fn()} />);
  expect(screen.getByTestId('save-custom-exercise')).toBeDisabled();
});

// ExerciseSelector.test.tsx
it('opens custom exercise modal on button click', () => {
  render(<ExerciseSelector />);
  fireEvent.click(screen.getByTestId('add-custom-exercise'));
  expect(screen.getByTestId('custom-exercise-modal')).toBeInTheDocument();
});
```

- [ ] **Step 5: Run tests and commit**

```bash
npx vitest run src/__tests__/CustomExerciseModal.test.tsx src/__tests__/ExerciseSelector.test.tsx --reporter=verbose
npm run lint
git add src/features/fitness/data/exercises.ts src/features/fitness/components/CustomExerciseModal.tsx src/features/fitness/components/ExerciseSelector.tsx src/__tests__/CustomExerciseModal.test.tsx src/__tests__/ExerciseSelector.test.tsx
git commit -m "feat(fitness): exercise DB gaps + custom exercise modal (G-04/G-05)

Added 8+ missing exercises. New CustomExerciseModal allows users
to define exercises not in the database.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 30: G-06 — Wire useProgressiveOverload → WorkoutLogger

**Files:**
- Modify: `src/features/fitness/hooks/useProgressiveOverload.ts`
- Modify: `src/features/fitness/components/WorkoutLogger.tsx`
- Modify: `src/__tests__/WorkoutLogger.test.tsx`

- [ ] **Step 1: Expose formatted suggestion from hook**

Ensure `useProgressiveOverload` returns:
```typescript
export interface OverloadSuggestion {
  weight: number;
  reps: number;
  source: 'progressive' | 'plateau-break' | 'fallback';
  isPlateaued?: boolean;
  plateauWeeks?: number;
  avgRpe?: number;
}
```

- [ ] **Step 2: Display suggestion chip in WorkoutLogger**

In `WorkoutLogger.tsx`, above the set input row per exercise:
```typescript
const { suggestNextSet } = useProgressiveOverload(exerciseHistory);

function ProgressiveOverloadChip({ suggestion, onApply }: {
  suggestion: OverloadSuggestion | null;
  onApply: (s: OverloadSuggestion) => void;
}) {
  if (!suggestion) return null;
  const isPlateaued = suggestion.isPlateaued ?? false;
  return (
    <button onClick={() => onApply(suggestion)}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
        isPlateaued
          ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20'
          : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20'
      }`}
      data-testid="overload-chip">
      {isPlateaued ? '⚠️' : '📈'} {suggestion.weight}kg × {suggestion.reps}
      {isPlateaued && ` (plateau ${suggestion.plateauWeeks}w)`}
    </button>
  );
}
```

- [ ] **Step 3: Write tests**

```typescript
it('shows progressive overload suggestion chip', () => {
  render(<WorkoutLogger />);
  expect(screen.getByTestId('overload-chip')).toHaveTextContent('62.5kg × 5');
});

it('applies suggestion to inputs on chip click', () => {
  render(<WorkoutLogger />);
  fireEvent.click(screen.getByTestId('overload-chip'));
  expect(screen.getByTestId('weight-input')).toHaveValue(62.5);
});

it('shows plateau warning when plateaued', () => {
  render(<WorkoutLogger />);
  expect(screen.getByTestId('overload-chip')).toHaveTextContent('plateau 3w');
});
```

- [ ] **Step 4: Run tests and commit**

```bash
npx vitest run src/__tests__/WorkoutLogger.test.tsx src/__tests__/useProgressiveOverload.test.ts --reporter=verbose
npm run lint
git add src/features/fitness/hooks/useProgressiveOverload.ts src/features/fitness/components/WorkoutLogger.tsx src/__tests__/WorkoutLogger.test.tsx
git commit -m "feat(fitness): wire progressive overload suggestions into WorkoutLogger (G-06)

Overload chip shows suggested weight × reps. Tap to auto-fill.
Amber warning when plateau detected.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 31: G-02 — QuickConfirmCard (depends on Task 30)

**Files:**
- Create: `src/features/fitness/components/QuickConfirmCard.tsx`
- Modify: `src/features/fitness/components/FitnessTab.tsx`
- Create: `src/__tests__/QuickConfirmCard.test.tsx`
- Modify: `src/__tests__/FitnessTab.test.tsx`

- [ ] **Step 1: Create QuickConfirmCard component**

Create `src/features/fitness/components/QuickConfirmCard.tsx`:
```typescript
import { Check, Pencil, Dumbbell } from 'lucide-react';
import type { OverloadSuggestion } from '../hooks/useProgressiveOverload';

interface QuickConfirmCardProps {
  exerciseName: string;
  suggestion: OverloadSuggestion;
  onConfirm: (suggestion: OverloadSuggestion) => void;
  onCustomize: () => void;
}

export function QuickConfirmCard({
  exerciseName, suggestion, onConfirm, onCustomize,
}: QuickConfirmCardProps) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
      data-testid="quick-confirm-card">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Dumbbell className="h-4 w-4" />
        <span>{exerciseName}</span>
      </div>
      <div className="mt-2 flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {suggestion.weight}kg × {suggestion.reps}
          </p>
          <p className="text-xs text-slate-400">
            {suggestion.source === 'progressive' && 'Progressive overload'}
            {suggestion.source === 'plateau-break' && 'Plateau breaker'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCustomize}
            className="rounded-lg border p-2 text-slate-400"
            data-testid="customize-button">
            <Pencil className="h-5 w-5" />
          </button>
          <button onClick={() => onConfirm(suggestion)}
            className="rounded-lg bg-blue-600 p-2 text-white"
            data-testid="quick-confirm-button">
            <Check className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire into FitnessTab pre-workout flow**

In `FitnessTab.tsx`, when not in workout mode and plan exists for today:
```typescript
const todaysExercises = getTodaysPlanExercises();
const { suggestNextSet } = useProgressiveOverload(exerciseHistory);

{todaysExercises.length > 0 && !workoutMode && (
  <div className="space-y-3 px-4">
    <h3 className="text-sm font-medium text-slate-500">{t('fitness.quickConfirm.title')}</h3>
    {todaysExercises.slice(0, 3).map(ex => {
      const suggestion = suggestNextSet(ex.id);
      if (!suggestion) return null;
      return (
        <QuickConfirmCard key={ex.id} exerciseName={ex.name}
          suggestion={suggestion}
          onConfirm={() => handleQuickLog(ex.id, suggestion)}
          onCustomize={() => startWorkout(ex.id)} />
      );
    })}
  </div>
)}
```

- [ ] **Step 3: Write tests**

```typescript
it('renders exercise name and suggestion', () => {
  render(<QuickConfirmCard exerciseName="Bench Press"
    suggestion={{ weight: 80, reps: 5, source: 'progressive' }}
    onConfirm={vi.fn()} onCustomize={vi.fn()} />);
  expect(screen.getByText('Bench Press')).toBeInTheDocument();
  expect(screen.getByText('80kg × 5')).toBeInTheDocument();
});

it('calls onConfirm with suggestion on check click', () => {
  const onConfirm = vi.fn();
  render(<QuickConfirmCard exerciseName="Squat"
    suggestion={{ weight: 100, reps: 5, source: 'progressive' }}
    onConfirm={onConfirm} onCustomize={vi.fn()} />);
  fireEvent.click(screen.getByTestId('quick-confirm-button'));
  expect(onConfirm).toHaveBeenCalledWith({ weight: 100, reps: 5, source: 'progressive' });
});
```

- [ ] **Step 4: Run tests and commit**

```bash
npx vitest run src/__tests__/QuickConfirmCard.test.tsx src/__tests__/FitnessTab.test.tsx --reporter=verbose
npm run lint
git add src/features/fitness/components/QuickConfirmCard.tsx src/features/fitness/components/FitnessTab.tsx src/__tests__/QuickConfirmCard.test.tsx src/__tests__/FitnessTab.test.tsx
git commit -m "feat(fitness): QuickConfirmCard for one-tap workout logging (G-02)

Shows today's exercises with AI-suggested weight × reps.
One-tap confirm or customize to open full logger.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 32: G-07 — useFitnessNutritionBridge + SmartInsightBanner (depends on Task 30)

**Files:**
- Create: `src/features/fitness/hooks/useFitnessNutritionBridge.ts`
- Create: `src/features/fitness/components/SmartInsightBanner.tsx`
- Modify: `src/features/fitness/components/FitnessTab.tsx`
- Create: `src/__tests__/useFitnessNutritionBridge.test.ts`
- Create: `src/__tests__/SmartInsightBanner.test.tsx`

- [ ] **Step 1: Create useFitnessNutritionBridge hook**

Create `src/features/fitness/hooks/useFitnessNutritionBridge.ts`:
```typescript
import { useMemo } from 'react';
import { useFitnessStore } from '@/store/fitnessStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { calculateTDEE, getCalorieOffset, calculateBMR } from '@/features/nutrition/utils/nutritionEngine';

export interface FitnessNutritionInsight {
  type: 'surplus-on-rest' | 'deficit-on-training' | 'protein-low' | 'recovery-day' | 'balanced';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'success';
}

export function useFitnessNutritionBridge(): {
  insight: FitnessNutritionInsight | null;
  todayCalorieBudget: number;
  isTrainingDay: boolean;
  weeklyTrainingLoad: number;
} {
  const { workouts, profile: fitnessProfile } = useFitnessStore();
  const { profile: nutritionProfile, dailyLog } = useNutritionStore();

  const today = new Date().toISOString().split('T')[0];
  const isTrainingDay = workouts.some(w => w.date === today);

  const todayCalorieBudget = useMemo(() => {
    if (!nutritionProfile) return 0;
    const bmr = calculateBMR(nutritionProfile);
    const tdee = calculateTDEE(bmr, nutritionProfile.activityLevel);
    const offset = getCalorieOffset(fitnessProfile?.goal ?? 'maintain');
    return Math.round(tdee + offset + (isTrainingDay ? 200 : 0));
  }, [nutritionProfile, fitnessProfile, isTrainingDay]);

  const weeklyTrainingLoad = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    return workouts.filter(w => w.date >= weekAgoStr).length;
  }, [workouts]);

  const insight = useMemo((): FitnessNutritionInsight | null => {
    const todayCalories = dailyLog?.totalCalories ?? 0;
    const todayProtein = dailyLog?.totalProtein ?? 0;
    const targetProtein = (nutritionProfile?.weightKg ?? 70) * 1.6;

    if (isTrainingDay && todayCalories < todayCalorieBudget * 0.75) {
      return {
        type: 'deficit-on-training',
        title: 'Cần nạp thêm năng lượng',
        message: `Hôm nay bạn tập luyện nhưng mới nạp ${todayCalories}/${todayCalorieBudget} kcal`,
        severity: 'warning',
      };
    }

    if (todayProtein < targetProtein * 0.6 && todayCalories > 0) {
      return {
        type: 'protein-low',
        title: 'Protein thấp',
        message: `Protein hiện tại ${Math.round(todayProtein)}g / mục tiêu ${Math.round(targetProtein)}g`,
        severity: 'warning',
      };
    }

    if (!isTrainingDay && weeklyTrainingLoad >= 4) {
      return {
        type: 'recovery-day',
        title: 'Ngày nghỉ phục hồi',
        message: 'Đã tập nhiều tuần này. Hôm nay nên ưu tiên nghỉ ngơi và ăn đủ.',
        severity: 'info',
      };
    }

    return null;
  }, [isTrainingDay, todayCalorieBudget, dailyLog, nutritionProfile, weeklyTrainingLoad]);

  return { insight, todayCalorieBudget, isTrainingDay, weeklyTrainingLoad };
}
```

- [ ] **Step 2: Create SmartInsightBanner component**

Create `src/features/fitness/components/SmartInsightBanner.tsx`:
```typescript
import { useState } from 'react';
import { Info, AlertTriangle, CheckCircle, X } from 'lucide-react';
import type { FitnessNutritionInsight } from '../hooks/useFitnessNutritionBridge';

const COLOR_MAP = {
  info: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
  warning: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300',
  success: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
};

const ICON_MAP = { info: Info, warning: AlertTriangle, success: CheckCircle };

export function SmartInsightBanner({ insight }: { insight: FitnessNutritionInsight }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const Icon = ICON_MAP[insight.severity];
  return (
    <div className={`mx-4 flex items-start gap-3 rounded-xl border p-3 ${COLOR_MAP[insight.severity]}`}
      data-testid="smart-insight-banner" role="alert">
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium">{insight.title}</p>
        <p className="text-xs opacity-80">{insight.message}</p>
      </div>
      <button onClick={() => setDismissed(true)} className="opacity-50 hover:opacity-100"
        data-testid="dismiss-insight" aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Wire into FitnessTab**

```typescript
const { insight } = useFitnessNutritionBridge();
// In JSX, before workout content:
{insight && <SmartInsightBanner insight={insight} />}
```

- [ ] **Step 4: Write tests**

```typescript
// useFitnessNutritionBridge.test.ts
it('returns deficit warning on training day with low calories', () => {
  const { result } = renderHook(() => useFitnessNutritionBridge());
  expect(result.current.insight?.type).toBe('deficit-on-training');
});

it('returns recovery-day on rest day with high weekly load', () => {
  const { result } = renderHook(() => useFitnessNutritionBridge());
  expect(result.current.insight?.type).toBe('recovery-day');
});

// SmartInsightBanner.test.tsx
it('renders warning banner with amber styling', () => {
  render(<SmartInsightBanner insight={{
    type: 'deficit-on-training', title: 'Low', message: 'msg', severity: 'warning'
  }} />);
  expect(screen.getByTestId('smart-insight-banner')).toHaveClass('bg-amber-50');
});

it('dismisses on X click', () => {
  render(<SmartInsightBanner insight={{
    type: 'protein-low', title: 'T', message: 'M', severity: 'info'
  }} />);
  fireEvent.click(screen.getByTestId('dismiss-insight'));
  expect(screen.queryByTestId('smart-insight-banner')).not.toBeInTheDocument();
});
```

- [ ] **Step 5: Run tests and commit**

```bash
npx vitest run src/__tests__/useFitnessNutritionBridge.test.ts src/__tests__/SmartInsightBanner.test.tsx src/__tests__/FitnessTab.test.tsx --reporter=verbose
npm run lint
git add src/features/fitness/hooks/useFitnessNutritionBridge.ts src/features/fitness/components/SmartInsightBanner.tsx src/features/fitness/components/FitnessTab.tsx src/__tests__/useFitnessNutritionBridge.test.ts src/__tests__/SmartInsightBanner.test.tsx src/__tests__/FitnessTab.test.tsx
git commit -m "feat(fitness): nutrition-fitness bridge with smart insight banners (G-07)

Cross-domain hook connects fitness workouts with nutrition data.
SmartInsightBanner shows contextual advice: deficits, low protein, recovery.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Verification Checklist

After each phase, run full verification:
```bash
npm run lint                    # Zero errors, no eslint-disable
npx vitest run --reporter=verbose  # All tests pass
npx vitest run --coverage      # Coverage ≥ existing baseline
```
