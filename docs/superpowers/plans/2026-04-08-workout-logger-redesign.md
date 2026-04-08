# WorkoutLogger Redesign — Focused Single-Exercise View

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign WorkoutLogger from "all exercises visible simultaneously" to a focused single-exercise view with set table, inline inputs, and "next exercise" navigation — matching the approved mockup at `docs/mockup-workout-logger.html`.

**Architecture:** Introduce `ExerciseSessionMeta` to carry per-exercise plan info (sets/repsMin/repsMax/rest) through the session. Extract `ExerciseWorkoutCard` (presentational) and `NextExercisePreview` from the monolithic render. Add `currentExerciseIndex` state to WorkoutLogger with clamp-on-mutation guards. Reuse `SwapExerciseSheet` for exercise swap. Keep all other sub-components (RestTimer, ExerciseSelector, SetEditor, WorkoutSummaryCard) unchanged.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4 (monochrome tokens), Zustand, React Hook Form + Zod, Lucide icons, Vitest + RTL.

---

## File Structure

### New Files

| File                                                      | Responsibility                                                                |
| --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/features/fitness/components/ExerciseWorkoutCard.tsx` | Single focused exercise: header + set table + action buttons (presentational) |
| `src/features/fitness/components/NextExercisePreview.tsx` | "Bài tập tiếp theo" card at bottom                                            |
| `src/__tests__/ExerciseWorkoutCard.test.tsx`              | Tests for the new card component                                              |
| `src/__tests__/NextExercisePreview.test.tsx`              | Tests for next exercise preview                                               |

### Modified Files

| File                                                | Changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/fitness/components/WorkoutLogger.tsx` | (1) Change `parseExercisesFromPlan` to return `ExerciseSessionMeta[]` preserving sets/reps/rest. (2) Add `currentExerciseIndex` state + clamp-on-mutation effect. (3) Remove inline exercise rendering (lines 511-721) → render `ExerciseWorkoutCard` + `NextExercisePreview`. (4) Update header to monochrome. (5) Wire `SwapExerciseSheet` with proper state + data cleanup on swap. (6) Add sticky bottom "Ghi nhận Set" button. (7) Add "copy last set" button in card. |
| `src/__tests__/WorkoutLogger.test.tsx`              | Update tests: single exercise view, navigation, swap flow, add/remove mid-session, index clamping, last-exercise hides preview                                                                                                                                                                                                                                                                                                                                              |
| `src/locales/vi.json`                               | Add new i18n keys for workout logger redesign                                                                                                                                                                                                                                                                                                                                                                                                                               |

### Unchanged Files (reused as-is)

- `SetEditor.tsx` — Still used for editing completed sets (tap row → modal)
- `RestTimer.tsx` — Still triggered after logging a set
- `ExerciseSelector.tsx` — Still used for "Thêm bài tập"
- `WorkoutSummaryCard.tsx` — Still shown on finish
- `SwapExerciseSheet.tsx` — Reused for "Thay bài tập" action (already exists, just needs state wiring)
- `workoutLoggerSchema.ts` — No schema changes needed
- `useProgressiveOverload.ts` — No changes

---

## Task 1: Add i18n keys + ExerciseSessionMeta type

**Files:**

- Modify: `src/locales/vi.json:759-788` (fitness.logger section)
- Modify: `src/features/fitness/components/WorkoutLogger.tsx:98-109` (parseExercisesFromPlan)

### Part A: i18n keys

- [ ] **Step 1: Add new keys to vi.json**

Add after `"copyLastSet"` (line 787):

```json
"swapExercise": "Thay bài tập",
"nextExercise": "Bài tập tiếp theo",
"exerciseProgress": "Bài tập {{current}}/{{total}}",
"addSet": "Thêm set",
"kg": "KG",
"rpeLabel": "RPE",
"nextExerciseDetail": "{{sets}} hiệp • {{repsMin}}-{{repsMax}} lần",
"prevExercise": "Bài tập trước"
```

- [ ] **Step 2: Verify no duplicate keys**

Run: `grep -c "swapExercise\|nextExercise\|exerciseProgress\|addSet\|nextExerciseDetail\|prevExercise" src/locales/vi.json`
Expected: 6 (6 new keys added)

### Part B: ExerciseSessionMeta type

The current `parseExercisesFromPlan()` (line 98-109) drops `SelectedExercise.sets/repsMin/repsMax/restSeconds`. We need this metadata for the set table and next-exercise preview.

- [ ] **Step 3: Add ExerciseSessionMeta interface**

Add at the top of `WorkoutLogger.tsx` (after imports, before `seedToExercise`):

```tsx
/** Exercise + session-level plan metadata (sets/reps/rest from the training plan) */
export interface ExerciseSessionMeta {
  exercise: Exercise;
  plannedSets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
}
```

- [ ] **Step 4: Update parseExercisesFromPlan to return ExerciseSessionMeta[]**

Replace lines 98-109:

```tsx
function parseExercisesFromPlan(exercisesJson?: string): ExerciseSessionMeta[] {
  const selected = safeParseJsonArray<SelectedExercise>(exercisesJson);
  if (selected.length === 0) return [];
  return selected
    .map(se => {
      const exerciseId = se.exercise?.id;
      if (!exerciseId) return null;
      const seed = EXERCISES.find(e => e.id === exerciseId);
      if (!seed) return null;
      return {
        exercise: seedToExercise(seed),
        plannedSets: se.sets ?? 3,
        repsMin: se.repsMin ?? seed.defaultRepsMin,
        repsMax: se.repsMax ?? seed.defaultRepsMax,
        restSeconds: se.restSeconds ?? DEFAULT_REST_SECONDS,
      } satisfies ExerciseSessionMeta;
    })
    .filter((e): e is ExerciseSessionMeta => e !== null);
}
```

- [ ] **Step 5: Update state type from Exercise[] to ExerciseSessionMeta[]**

Change `currentExercises` state (line 159):

```tsx
const [currentExercises, setCurrentExercises] = useState<ExerciseSessionMeta[]>(() => {
  const draft = useFitnessStore.getState().workoutDraft;
  const draftMatchesPlan = draft && (!planDay?.id || draft.planDayId === planDay.id);
  if (draftMatchesPlan && draft.exerciseMetas) {
    // Prefer saved ExerciseSessionMeta[] (preserves plan metadata)
    return draft.exerciseMetas;
  }
  if (draftMatchesPlan && draft.exercises) {
    // Backward compat: wrap legacy Exercise[] draft in meta with defaults
    return draft.exercises.map(ex => ({
      exercise: ex,
      plannedSets: 3,
      repsMin: ex.defaultRepsMin ?? 8,
      repsMax: ex.defaultRepsMax ?? 12,
      restSeconds: DEFAULT_REST_SECONDS,
    }));
  }
  return parseExercisesFromPlan(planDay?.exercises);
});
```

**IMPORTANT**: Also update the `WorkoutDraft` type in `fitnessStore` to include `exerciseMetas`:

```tsx
// In src/store/fitnessStore.ts (or types.ts):
interface WorkoutDraft {
  exercises: Exercise[]; // kept for backward compat
  exerciseMetas?: ExerciseSessionMeta[]; // NEW — preserves plan metadata
  sets: WorkoutSet[];
  elapsedSeconds: number;
  planDayId?: string;
}
```

Update all references from `exercise.id` → `meta.exercise.id`, `exercise.nameVi` → `meta.exercise.nameVi`, etc. throughout WorkoutLogger.

**IMPORTANT — Exercise ID keying assumption**: Local state (`setInputs`, `loggedSets`) is keyed by `exercise.id`. This is safe because `excludeIds` in both SwapExerciseSheet and ExerciseSelector prevents duplicate exercises within the same session. If future requirements allow duplicate exercises (e.g., same exercise in different supersets), a per-slot `sessionExerciseId` would be needed. For now, `exercise.id` uniqueness is enforced at the add/swap boundary.

**IMPORTANT — Draft restore timing**: The `useState` initializer reads `workoutDraft` synchronously from `useFitnessStore.getState()`. This works because:

- Web (sql.js): Zustand `persist` middleware hydrates from localStorage synchronously before React renders
- Native (SQLite): `loadWorkoutDraft()` is called in `useEffect` during app init, which runs before WorkoutLogger mounts (user must navigate to fitness tab first)
- If draft is not yet loaded when WorkoutLogger mounts (edge case), the fallback `parseExercisesFromPlan(planDay?.exercises)` correctly initializes from the plan. The draft will be lost in this case, but this is acceptable because it only happens on cold start before the user has logged any sets.

- [ ] **Step 6: Lint check**

Run: `npm run lint`
Expected: 0 errors (type changes may cause temporary errors — fix all before proceeding)

- [ ] **Step 7: Test check**

Run: `npm run test`
Expected: Some tests may fail due to type change — fix test mocks to use `ExerciseSessionMeta`

- [ ] **Step 8: Commit**

```bash
git add src/locales/vi.json src/features/fitness/components/WorkoutLogger.tsx src/__tests__/WorkoutLogger.test.tsx
git commit -m "feat(fitness): add i18n keys + ExerciseSessionMeta type

- Add 6 new i18n keys for workout logger redesign
- Introduce ExerciseSessionMeta to preserve planned sets/reps/rest
- Update parseExercisesFromPlan to return metadata
- Update state type from Exercise[] to ExerciseSessionMeta[]

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 2: Create NextExercisePreview component

**Files:**

- Create: `src/features/fitness/components/NextExercisePreview.tsx`
- Create: `src/__tests__/NextExercisePreview.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// src/__tests__/NextExercisePreview.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NextExercisePreview } from '../features/fitness/components/NextExercisePreview';
import type { ExerciseSessionMeta } from '../features/fitness/components/WorkoutLogger';

const mockMeta: ExerciseSessionMeta = {
  exercise: {
    id: 'incline-db-press',
    nameVi: 'Đẩy tạ tay nghiêng',
    nameEn: 'Incline DB Press',
    muscleGroup: 'chest',
    secondaryMuscles: ['shoulders', 'arms'],
    category: 'compound',
    equipment: ['dumbbell'],
    contraindicated: [],
    exerciseType: 'strength',
    defaultRepsMin: 10,
    defaultRepsMax: 12,
    isCustom: false,
    updatedAt: '2026-01-01',
  },
  plannedSets: 4,
  repsMin: 10,
  repsMax: 12,
  restSeconds: 90,
};

describe('NextExercisePreview', () => {
  it('renders null when meta is null', () => {
    const { container } = render(<NextExercisePreview meta={null} onNavigate={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders exercise name', () => {
    render(<NextExercisePreview meta={mockMeta} onNavigate={vi.fn()} />);
    expect(screen.getByText('Đẩy tạ tay nghiêng')).toBeInTheDocument();
  });

  it('renders planned sets and rep range from meta', () => {
    render(<NextExercisePreview meta={mockMeta} onNavigate={vi.fn()} />);
    // Uses i18n key: fitness.logger.nextExerciseDetail → "4 hiệp • 10-12 lần"
    expect(screen.getByText(/4 hiệp/)).toBeInTheDocument();
    expect(screen.getByText(/10-12 lần/)).toBeInTheDocument();
  });

  it('renders section heading', () => {
    render(<NextExercisePreview meta={mockMeta} onNavigate={vi.fn()} />);
    // Uses i18n key: fitness.logger.nextExercise
    expect(screen.getByText(/tiếp theo/i)).toBeInTheDocument();
  });

  it('calls onNavigate when card clicked', () => {
    const onNavigate = vi.fn();
    render(<NextExercisePreview meta={mockMeta} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByTestId('next-exercise-card'));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('does not render Dumbbell icon to screen reader', () => {
    render(<NextExercisePreview meta={mockMeta} onNavigate={vi.fn()} />);
    // Icon has aria-hidden="true"
    const card = screen.getByTestId('next-exercise-card');
    expect(card.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/NextExercisePreview.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement NextExercisePreview**

```tsx
// src/features/fitness/components/NextExercisePreview.tsx
import { ChevronRight, Dumbbell } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type { ExerciseSessionMeta } from './WorkoutLogger';

interface NextExercisePreviewProps {
  meta: ExerciseSessionMeta | null;
  onNavigate: () => void;
}

export const NextExercisePreview = React.memo(function NextExercisePreview({
  meta,
  onNavigate,
}: Readonly<NextExercisePreviewProps>) {
  const { t } = useTranslation();

  if (!meta) return null;

  return (
    <div className="mt-4">
      <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
        {t('fitness.logger.nextExercise')}
      </p>
      <button
        type="button"
        onClick={onNavigate}
        data-testid="next-exercise-card"
        className="bg-card border-border hover:bg-accent flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors"
      >
        <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <Dumbbell className="text-muted-foreground h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-semibold">{meta.exercise.nameVi}</p>
          <p className="text-muted-foreground text-xs">
            {t('fitness.logger.nextExerciseDetail', {
              sets: meta.plannedSets,
              repsMin: meta.repsMin,
              repsMax: meta.repsMax,
            })}
          </p>
        </div>
        <ChevronRight className="text-muted-foreground h-5 w-5 shrink-0" aria-hidden="true" />
      </button>
    </div>
  );
});
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/__tests__/NextExercisePreview.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/fitness/components/NextExercisePreview.tsx src/__tests__/NextExercisePreview.test.tsx
git commit -m "feat(fitness): add NextExercisePreview component

Uses ExerciseSessionMeta for accurate planned sets/reps display.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 3: Create ExerciseWorkoutCard component

This is the core new component. It replaces the inline exercise rendering (WorkoutLogger lines 511-721) with a focused card featuring:

- Exercise header (icon + name + muscles + progress indicator + menu)
- Progressive overload chip
- Set table (completed rows + active input row)
- "Copy last set" button (explicitly kept from current design)
- "Thay bài tập" action button
- **NOTE**: "Ghi nhận Set" button is NOT in this component — it lives in the sticky bottom bar (WorkoutLogger). This avoids duplicate CTAs.
- **NOTE**: "Ghi chú" (notes) is OUT OF SCOPE for this plan — user confirmed "không cần".

**Files:**

- Create: `src/features/fitness/components/ExerciseWorkoutCard.tsx`
- Create: `src/__tests__/ExerciseWorkoutCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Key test cases (all required for 100% coverage):

1. Renders exercise name and muscle groups
2. Displays completed sets in table format with correct values (weight, reps, RPE)
3. Shows active input row with weight/reps fields and RPE `<select>`
4. Calls onDeleteSet when delete icon on completed set clicked
5. Calls onEditSet when completed set row clicked
6. Shows progressive overload chip when suggestion available
7. Hides progressive overload chip when suggestion is null
8. Shows "Thay bài tập" action button
9. Calls onSwapExercise when swap button clicked
10. Shows exercise progress indicator "Bài tập 2/6"
11. Renders empty table (0 completed sets) with just the active input row
12. Calls onCopyLastSet when copy button clicked
13. Calls onApplyOverload when overload chip clicked
14. RPE `<select>` calls onRpeSelect with correct value
15. Weight input calls onWeightInput with string value
16. Reps input calls onRepsInput with string value

**NOTE**: No `onLogSet` test — that action lives in the sticky bottom bar (WorkoutLogger), not here.

```tsx
// src/__tests__/ExerciseWorkoutCard.test.tsx — abbreviated structure
describe('ExerciseWorkoutCard', () => {
  const mockExercise: Exercise = {
    /* full shape */
  };
  const mockMeta: ExerciseSessionMeta = {
    exercise: mockExercise,
    plannedSets: 4,
    repsMin: 8,
    repsMax: 12,
    restSeconds: 90,
  };
  const defaultProps = {
    meta: mockMeta,
    exerciseIndex: 1,
    totalExercises: 6,
    loggedSets: [],
    currentInput: { weight: 0, reps: 0 },
    overloadSuggestion: null,
    onWeightChange: vi.fn(),
    onRepsChange: vi.fn(),
    onRpeSelect: vi.fn(),
    onWeightInput: vi.fn(),
    onRepsInput: vi.fn(),
    onDeleteSet: vi.fn(),
    onEditSet: vi.fn(),
    onCopyLastSet: vi.fn(),
    onApplyOverload: vi.fn(),
    onSwapExercise: vi.fn(),
  };

  it('renders exercise name and muscles', () => {
    /* ... */
  });
  it('shows progress indicator', () => {
    /* check "Bài tập 2/6" */
  });
  it('renders empty table with active input', () => {
    /* ... */
  });
  it('renders completed sets in table', () => {
    /* with 2 mock sets */
  });
  it('calls onEditSet when set row clicked', () => {
    /* ... */
  });
  it('calls onDeleteSet', () => {
    /* ... */
  });
  it('calls onCopyLastSet', () => {
    /* ... */
  });
  it('shows overload chip when available', () => {
    /* with suggestion */
  });
  it('hides overload chip when null', () => {
    /* ... */
  });
  it('calls onApplyOverload', () => {
    /* ... */
  });
  it('RPE select calls onRpeSelect', () => {
    /* ... */
  });
  it('weight input calls onWeightInput', () => {
    /* ... */
  });
  it('reps input calls onRepsInput', () => {
    /* ... */
  });
  it('renders swap button', () => {
    /* ... */
  });
  it('calls onSwapExercise', () => {
    /* ... */
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/ExerciseWorkoutCard.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement ExerciseWorkoutCard**

Props interface (grouped for clarity — NO onLogSet, it's in sticky bottom bar):

```tsx
interface ExerciseWorkoutCardProps {
  // Exercise identity
  meta: ExerciseSessionMeta;
  exerciseIndex: number;
  totalExercises: number;
  // Logged data
  loggedSets: WorkoutSet[];
  currentInput: SetInputData;
  overloadSuggestion: OverloadSuggestion | null;
  // Input handlers
  onWeightChange: (delta: number) => void;
  onRepsChange: (delta: number) => void;
  onRpeSelect: (rpe: number) => void;
  onWeightInput: (value: string) => void;
  onRepsInput: (value: string) => void;
  // Set actions (except log — that's in the sticky bottom bar)
  onDeleteSet: (setId: string) => void;
  onEditSet: (set: WorkoutSet) => void;
  onCopyLastSet: () => void;
  onApplyOverload: (suggestion: OverloadSuggestion) => void;
  // Exercise actions
  onSwapExercise: () => void;
}
```

Component layout (matching mockup):

```
┌──────────────────────────────────┐
│ 🏋️ Bench Press          (2/6)   │ ← header: icon + name + progress
│    Ngực • Vai • Tay sau          │ ← muscle groups
├──────────────────────────────────┤
│ ⬆ Đề xuất: 82.5kg × 8 reps     │ ← overload chip (conditional)
├──────────────────────────────────┤
│ SET │  KG  │ REPS │  RPE  │     │ ← table header (CSS grid)
│──── │──────│──────│───────│─────│
│ ▎ 1 │  80  │  10  │  8    │ 🗑  │ ← completed row (tap to edit)
│ ▎ 2 │  80  │   8  │  9    │ 🗑  │ ← completed row
│   3 │ [80] │ [--] │ [▼8 ] │     │ ← active input row (select for RPE)
├──────────────────────────────────┤
│  📋 Sao chép set trước          │ ← copy last set button
├──────────────────────────────────┤
│ [🔄 Thay bài tập]               │ ← swap action button (no "Ghi chú" — out of scope)
└──────────────────────────────────┘
│      (sticky bottom bar)         │
│ ┌────────────────────────────┐   │ ← "Ghi nhận Set" button (in WorkoutLogger, NOT here)
│ └────────────────────────────┘   │
```

Key implementation details:

- Set table uses CSS Grid: `grid grid-cols-[auto_1fr_1fr_auto_auto]`
- RPE input: `<select>` dropdown with RPE_OPTIONS (6-10) — not toggle buttons
- Completed row: clickable (onEditSet), delete icon visible
- Active input row: inline `<input type="text">` for weight/reps
- Copy last set: only visible when loggedSets.length > 0
- Action buttons: icon + text, `bg-muted` style

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/__tests__/ExerciseWorkoutCard.test.tsx`
Expected: PASS

- [ ] **Step 5: Lint check**

Run: `npm run lint`
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add src/features/fitness/components/ExerciseWorkoutCard.tsx src/__tests__/ExerciseWorkoutCard.test.tsx
git commit -m "feat(fitness): add ExerciseWorkoutCard with set table layout

Focused single-exercise view with:
- Exercise header (icon + name + muscles + progress indicator)
- CSS Grid set table (completed rows + active input row)
- RPE dropdown select (replacing toggle buttons)
- Progressive overload chip
- Copy last set button
- Swap exercise + Add note action buttons

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 4: Refactor WorkoutLogger to use new components

This is the integration task. Replace the monolithic exercise rendering with:

1. `currentExerciseIndex` state with clamp-on-mutation effect
2. `ExerciseWorkoutCard` for the focused exercise
3. `NextExercisePreview` at the bottom (hidden on last exercise)
4. Updated header: monochrome + timer pill + **swipe/prev indicator**
5. Sticky bottom "Ghi nhận Set" button
6. `SwapExerciseSheet` wired with proper state + data cleanup on swap
7. Navigation logic with bounds checking

**Files:**

- Modify: `src/features/fitness/components/WorkoutLogger.tsx`
- Modify: `src/__tests__/WorkoutLogger.test.tsx`

- [ ] **Step 1: Add currentExerciseIndex state + clamp effect**

After line 173 (other useState declarations), add:

```tsx
const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
const [showSwapSheet, setShowSwapSheet] = useState(false);
```

Add clamp effect to prevent index out of bounds when exercises are removed:

```tsx
useEffect(() => {
  if (currentExercises.length === 0) {
    setCurrentExerciseIndex(0);
  } else if (currentExerciseIndex >= currentExercises.length) {
    setCurrentExerciseIndex(currentExercises.length - 1);
  }
}, [currentExercises.length, currentExerciseIndex]);
```

Add derived values:

```tsx
const currentMeta = currentExercises[currentExerciseIndex] ?? null;
const nextMeta = currentExercises[currentExerciseIndex + 1] ?? null;
const isLastExercise = currentExerciseIndex >= currentExercises.length - 1;
const isFirstExercise = currentExerciseIndex === 0;
```

Add navigation handlers:

```tsx
const handleNavigateNext = useCallback(() => {
  if (!isLastExercise) {
    setCurrentExerciseIndex(prev => prev + 1);
  }
}, [isLastExercise]);

const handleNavigatePrev = useCallback(() => {
  if (!isFirstExercise) {
    setCurrentExerciseIndex(prev => prev - 1);
  }
}, [isFirstExercise]);
```

- [ ] **Step 2: Wire SwapExerciseSheet**

Import SwapExerciseSheet (already exists at `../SwapExerciseSheet`):

```tsx
import { SwapExerciseSheet } from './SwapExerciseSheet';
```

Add swap handler — replaces exercise in-place, **preserves slot's rep range**, AND cleans up old exercise's form inputs:

```tsx
const handleSwapExercise = useCallback(
  (newExercise: Exercise) => {
    setCurrentExercises(prev => {
      const oldExerciseId = prev[currentExerciseIndex]?.exercise.id;
      const updated = [...prev];
      updated[currentExerciseIndex] = {
        exercise: newExercise,
        // PRESERVE slot prescription (the slot has a programmed volume)
        plannedSets: prev[currentExerciseIndex]?.plannedSets ?? 3,
        repsMin: prev[currentExerciseIndex]?.repsMin ?? newExercise.defaultRepsMin ?? 8,
        repsMax: prev[currentExerciseIndex]?.repsMax ?? newExercise.defaultRepsMax ?? 12,
        restSeconds: prev[currentExerciseIndex]?.restSeconds ?? DEFAULT_REST_SECONDS,
      };
      // Clean up old exercise's logged sets (they belong to the swapped-out exercise)
      if (oldExerciseId) {
        setLoggedSets(sets => sets.filter(s => s.exerciseId !== oldExerciseId));
        // Reset form input for old exercise
        setValue(`setInputs.${oldExerciseId}`, undefined as unknown as SetInputData);
      }
      return updated;
    });
    setShowSwapSheet(false);
  },
  [currentExerciseIndex, setValue],
);
```

**Duplicate prevention**: Pass `excludeIds` to SwapExerciseSheet to filter out exercises already in the session:

```tsx
{
  showSwapSheet && currentMeta && (
    <SwapExerciseSheet
      isOpen={showSwapSheet}
      currentExercise={currentMeta.exercise}
      excludeIds={currentExercises.map(m => m.exercise.id)}
      onSelect={handleSwapExercise}
      onClose={() => setShowSwapSheet(false)}
    />
  );
}
```

**Note**: `SwapExerciseSheet` needs a minor update to accept and use `excludeIds` prop — filter out exercises whose `id` is in the set. Similarly, `ExerciseSelector` (used for "add exercise") should exclude already-present IDs.

````

- [ ] **Step 3: Update header to monochrome with navigation**

Replace the existing header (lines 478-503):
```tsx
<header className="pt-safe bg-card border-border sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3">
  <button
    type="button"
    onClick={handleBack}
    className="text-foreground flex items-center gap-1 text-sm"
    data-testid="back-button"
  >
    <ArrowLeft className="h-5 w-5" aria-hidden="true" />
    <span>{t('fitness.logger.back')}</span>
  </button>

  <div className="bg-muted flex items-center gap-1.5 rounded-full px-3 py-1" data-testid="elapsed-timer-pill">
    <Clock className="text-muted-foreground h-3.5 w-3.5" aria-hidden="true" />
    <TimerDisplay startSeconds={initialElapsed} elapsedRef={elapsedRef} isRunning={timerRunning} />
  </div>

  <button
    type="button"
    onClick={handleFinish}
    className="bg-foreground text-background flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold"
    data-testid="finish-button"
  >
    <Check className="h-4 w-4" aria-hidden="true" />
    <span>{t('fitness.logger.finish')}</span>
  </button>
</header>
````

Add `Check, Clock` to imports from lucide-react.

- [ ] **Step 4: Replace exercise list with single card + navigation**

Replace the `.map()` over all exercises (lines 511-721) with:

```tsx
{
  currentMeta ? (
    <>
      {/* Exercise navigation (prev/next swipe hints — optional visual) */}
      {!isFirstExercise && (
        <button
          type="button"
          onClick={handleNavigatePrev}
          className="text-muted-foreground mb-2 flex items-center gap-1 text-xs"
          data-testid="prev-exercise-btn"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t('fitness.logger.prevExercise')}
        </button>
      )}

      <ExerciseWorkoutCard
        meta={currentMeta}
        exerciseIndex={currentExerciseIndex}
        totalExercises={currentExercises.length}
        loggedSets={loggedSets.filter(s => s.exerciseId === currentMeta.exercise.id)}
        currentInput={watch(`setInputs.${currentMeta.exercise.id}`) ?? setInputDefaults}
        overloadSuggestion={(() => {
          const s = getOverloadSuggestion(currentMeta.exercise.id, currentMeta.repsMin, currentMeta.repsMax);
          return s.weight > 0 ? s : null;
        })()}
        onWeightChange={delta => handleWeightChange(currentMeta.exercise.id, delta)}
        onRepsChange={delta => handleRepsChange(currentMeta.exercise.id, delta)}
        onRpeSelect={rpe => handleRpeSelect(currentMeta.exercise.id, rpe)}
        onWeightInput={val => setValue(`setInputs.${currentMeta.exercise.id}.weight`, Number(val) || 0)}
        onRepsInput={val => setValue(`setInputs.${currentMeta.exercise.id}.reps`, Number(val) || 0)}
        // NOTE: onLogSet is NOT passed here — it's handled by the sticky bottom bar
        onDeleteSet={handleDeleteSet}
        onEditSet={set => setEditingSet(set)}
        onCopyLastSet={() => handleCopyLastSet(currentMeta.exercise.id)}
        onApplyOverload={s => handleApplySuggestion(currentMeta.exercise.id, s)}
        onSwapExercise={() => setShowSwapSheet(true)}
      />

      {/* Next exercise preview — hidden on last exercise */}
      {!isLastExercise && <NextExercisePreview meta={nextMeta} onNavigate={handleNavigateNext} />}
    </>
  ) : (
    <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-state">
      <p className="text-muted-foreground">{t('fitness.logger.noExercises')}</p>
    </div>
  );
}
```

- [ ] **Step 5: Add sticky bottom bar**

Replace the old "add exercise" bar (lines 724-737) with:

```tsx
<div className="pb-safe bg-card/95 sticky bottom-0 border-t p-4 backdrop-blur-sm">
  {currentMeta ? (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => handleLogSet(currentMeta.exercise.id)}
        className="bg-foreground text-background flex-1 rounded-xl py-3.5 text-[15px] font-bold active:opacity-90"
        data-testid="log-set-bottom-btn"
      >
        {t('fitness.logger.logSet')}
      </button>
      <button
        type="button"
        onClick={() => setShowExerciseSelector(true)}
        className="border-border text-muted-foreground rounded-xl border px-3 py-3.5 active:opacity-90"
        data-testid="add-exercise-bottom-btn"
        aria-label={t('fitness.logger.addExercise')}
      >
        <Plus className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setShowExerciseSelector(true)}
      className="border-border text-muted-foreground flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed py-3 text-sm"
      data-testid="add-exercise-bottom-btn"
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
      {t('fitness.logger.addExercise')}
    </button>
  )}
</div>
```

**Key**: The "+" button is ALWAYS available — when exercises exist, it appears as a compact icon button next to "Ghi nhận Set". When no exercises exist, it's the full-width dashed button. This preserves the ability to add exercises mid-session.

- [ ] **Step 6: Update handleSelectExercise to auto-focus new exercise**

```tsx
const handleSelectExercise = useCallback(
  (exercise: Exercise) => {
    const newMeta: ExerciseSessionMeta = {
      exercise,
      plannedSets: 3,
      repsMin: exercise.defaultRepsMin ?? 8,
      repsMax: exercise.defaultRepsMax ?? 12,
      restSeconds: DEFAULT_REST_SECONDS,
    };
    setCurrentExercises(prev => {
      const next = [...prev, newMeta];
      setCurrentExerciseIndex(next.length - 1); // focus newly added
      return next;
    });
    setShowExerciseSelector(false);
    if (!timerRunning) setTimerRunning(true);
  },
  [timerRunning],
);
```

- [ ] **Step 7: Update draft auto-save to persist ExerciseSessionMeta**

The draft format in fitnessStore now stores BOTH `exercises` (backward compat) AND `exerciseMetas` (full metadata). Update the save effect:

```tsx
setWorkoutDraft({
  exercises: currentExercises.map(m => m.exercise), // backward compat
  exerciseMetas: currentExercises, // NEW — preserves plan metadata on resume
  sets: loggedSets,
  elapsedSeconds: elapsedRef.current,
  planDayId: planDay?.id,
});
```

This ensures that when user resumes a draft, `ExerciseSessionMeta` is preserved — no metadata loss.

- [ ] **Step 8: Thread per-exercise restSeconds into RestTimer**

Currently (line 740), RestTimer hardcodes `DEFAULT_REST_SECONDS`:

```tsx
// BEFORE (hardcoded):
<RestTimer durationSeconds={DEFAULT_REST_SECONDS} onComplete={handleRestComplete} onSkip={handleRestSkip} />

// AFTER (per-exercise rest from plan metadata):
<RestTimer
  durationSeconds={currentMeta?.restSeconds ?? DEFAULT_REST_SECONDS}
  onComplete={handleRestComplete}
  onSkip={handleRestSkip}
/>
```

This makes the rest timer respect each exercise's planned rest period (e.g., compound lifts 120s, isolation 60s).

- [ ] **Step 9: Update tests**

Key test changes in `WorkoutLogger.test.tsx`:

- Tests for single exercise view (only 1 exercise card visible at a time)
- Test: exercise progress shows "1/2" when 2 exercises
- Test: navigate to next exercise via NextExercisePreview click
- Test: navigate to previous exercise via prev button
- Test: prev button hidden on first exercise
- Test: NextExercisePreview hidden on last exercise
- Test: after adding exercise via selector, it becomes focused (index = length-1)
- Test: after swapping exercise, card shows new exercise name
- Test: swap cleans up old exercise's logged sets
- Test: index clamps when exercises removed below current index
- Test: sticky bottom "Ghi nhận Set" button calls handleLogSet for current exercise
- Test: add exercise button visible even when exercises exist (secondary icon button)
- Test: empty state when 0 exercises (shows full-width add button in bottom bar)
- Test: monochrome header (no bg-primary)
- Test: RestTimer uses currentMeta.restSeconds instead of DEFAULT_REST_SECONDS

- [ ] **Step 10: Run full test suite**

Run: `npm run test`
Expected: 0 failures

- [ ] **Step 11: Run lint**

Run: `npm run lint`
Expected: 0 errors

- [ ] **Step 12: Build check**

Run: `npm run build`
Expected: Clean build

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat(fitness): redesign WorkoutLogger to focused single-exercise view

- Added currentExerciseIndex state with clamp-on-mutation effect
- Replaced inline rendering with ExerciseWorkoutCard component
- Added NextExercisePreview (hidden on last exercise)
- Wired SwapExerciseSheet with data cleanup on swap
- Added prev-exercise navigation button
- Updated header to monochrome (removed bg-primary)
- Added sticky 'Ghi nhận Set' bottom button with add-exercise icon
- Auto-focus new exercises when added via selector
- RestTimer now uses per-exercise restSeconds from plan metadata
- Draft auto-save persists ExerciseSessionMeta[] for metadata preservation

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 5: Quality Gates & Emulator Verification

**Files:** None (verification only — modify any files that fail quality checks)

- [ ] **Step 1: Full lint check**

Run: `npm run lint`
Expected: 0 errors

- [ ] **Step 2: Full test suite + coverage**

Run: `npm run test:coverage`
Expected: 0 failures, coverage = 100% for new files

**Critical test scenarios that MUST be covered** (from rubber-duck critique):

| #   | Scenario                               | Component           | Expected behavior                                              |
| --- | -------------------------------------- | ------------------- | -------------------------------------------------------------- |
| 1   | Copy last set (loggedSets empty)       | ExerciseWorkoutCard | Button hidden or disabled                                      |
| 2   | Copy last set (loggedSets has data)    | ExerciseWorkoutCard | Populates input with last set's weight/reps                    |
| 3   | Overload applied                       | ExerciseWorkoutCard | Calls onApplyOverload, chip disappears                         |
| 4   | No overload (null suggestion)          | ExerciseWorkoutCard | Chip not rendered                                              |
| 5   | Last exercise                          | WorkoutLogger       | NextExercisePreview hidden                                     |
| 6   | First exercise                         | WorkoutLogger       | prev-exercise-btn hidden                                       |
| 7   | Swap exercise                          | WorkoutLogger       | Old sets removed, new exercise shown                           |
| 8   | Add exercise mid-session               | WorkoutLogger       | Index jumps to new exercise, "+" button always visible         |
| 9   | Index clamp on swap (exercises shrink) | WorkoutLogger       | When viewing last exercise and it's swapped, index stays valid |
| 10  | RPE select                             | ExerciseWorkoutCard | Calls onRpeSelect with numeric value                           |
| 11  | Empty exercise list                    | WorkoutLogger       | Empty state + full-width "add" button in bottom bar            |
| 12  | Draft auto-save                        | WorkoutLogger       | Persists ExerciseSessionMeta[] for metadata preservation       |
| 13  | NextExercisePreview null meta          | NextExercisePreview | Renders null                                                   |
| 14  | RestTimer per-exercise rest            | WorkoutLogger       | Uses currentMeta.restSeconds instead of DEFAULT                |

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: Clean build, no warnings

- [ ] **Step 4: SonarQube scan**

Run: `npm run test:coverage && npm run sonar`
Expected: 0 issues (Bug, Vulnerability, Code Smell)

If issues found → fix → re-run from Step 1 → loop until 0

- [ ] **Step 5: Build APK + install**

```bash
npx cap sync android
cd android && ./gradlew assembleDebug
adb -s emulator-5556 install -r app/build/outputs/apk/debug/app-debug.apk
```

- [ ] **Step 6: Emulator verification (CDP)**

Test scenarios on real device:

1. Open workout logger → verify single exercise card visible (not all)
2. Log a set → set appears in table, RestTimer shows
3. Navigate to next exercise via NextExercisePreview → card changes
4. Navigate back via prev button → previous exercise shown
5. Tap "Thay bài tập" → SwapExerciseSheet opens → select new → card updates
6. Verify old exercise's sets removed after swap
7. Finish workout → workout saved successfully
8. Monochrome styling verified (no primary colors)
9. Dark mode renders correctly
10. Screenshot each state for evidence

- [ ] **Step 7: Screenshot evidence**

```bash
mkdir -p screenshots/workout-logger-redesign
adb -s emulator-5556 exec-out screencap -p > screenshots/workout-logger-redesign/01-single-card.png
# ... additional screenshots per verification step
```

- [ ] **Step 8: Final commit (if any hotfixes needed)**

```bash
git add -A
git commit -m "fix(fitness): WorkoutLogger quality gate fixes

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Key Design Decisions

| Decision                      | Choice                                                                       | Rationale                                                               |
| ----------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Component extraction          | Extract `ExerciseWorkoutCard` + `NextExercisePreview` from monolithic render | Testability, reusability, single responsibility                         |
| State management              | `currentExerciseIndex` in local state (not store)                            | Navigation is ephemeral, doesn't need persistence                       |
| Input approach                | Inline table inputs (direct in row)                                          | Matches reference design, fewer taps than ± buttons                     |
| RPE input                     | Dropdown `<select>` (not toggle buttons)                                     | Takes less space, monochrome-friendly                                   |
| Set table                     | CSS Grid (not HTML `<table>`)                                                | Better responsive control, Tailwind-friendly                            |
| Exercise swap                 | Reuse existing `SwapExerciseSheet` + data cleanup                            | No new component needed, already functional                             |
| Copy last set                 | Button in ExerciseWorkoutCard (visible when loggedSets > 0)                  | Explicitly kept from current design per user feedback                   |
| Back navigation               | Small text button with ChevronLeft (prev exercise) + ArrowLeft (exit logger) | Clear affordance for both navigation types                              |
| Auto-advance                  | After all planned sets → no auto-advance, user taps next                     | User might want extra sets beyond plan                                  |
| Draft format                  | Save BOTH `exercises` (backward compat) AND `exerciseMetas` (full metadata)  | Preserves plan metadata on resume, no data loss                         |
| Index clamping                | `useEffect` clamps `currentExerciseIndex` when exercises shrink              | Prevents out-of-bounds after remove/swap-and-reduce                     |
| RestTimer                     | Uses `currentMeta.restSeconds` instead of hardcoded `DEFAULT_REST_SECONDS`   | Per-exercise rest from plan (compound 120s, isolation 60s)              |
| Add exercise mid-session      | "+" icon button always visible next to "Ghi nhận Set" in bottom bar          | Preserves existing functionality, doesn't hide affordance               |
| "Ghi chú" (notes)             | OUT OF SCOPE — user confirmed "không cần"                                    | Reduces ambiguity, can add in future plan                               |
| Duplicate exercise prevention | `excludeIds` prop on SwapExerciseSheet + ExerciseSelector                    | Prevents collision where two slots share logged sets by same exerciseId |

## Risk Assessment

| Risk                                     | Mitigation                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------ |
| Breaking existing tests (1495 lines)     | Update tests incrementally, keep test structure                          |
| Missing edge cases                       | 13 critical scenarios documented in Task 5 Step 2                        |
| Performance (re-renders on input change) | `React.memo` on both new components                                      |
| Draft auto-save compatibility            | Save `exerciseMetas` alongside `exercises`, restore with fallback chain  |
| SwapExerciseSheet data leak              | Explicit cleanup: remove old exercise's loggedSets + form inputs on swap |
| Duplicate exercise collision             | `excludeIds` filtering in swap/add selectors                             |
| Index out-of-bounds                      | useEffect clamp + derived `currentMeta` with nullish coalescing          |
| RestTimer ignoring plan rest             | Thread `currentMeta.restSeconds` to RestTimer prop                       |
