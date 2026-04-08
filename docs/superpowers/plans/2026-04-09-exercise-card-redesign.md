# ExerciseWorkoutCard Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign ExerciseWorkoutCard from grid-table layout to card-based layout matching reference mockup — inline completed sets, dark active set card with large steppers, and ✓ confirm button replacing footer "Ghi nhận set".

**Architecture:** The card component gains one new prop (`onLogSet`) and gets a full visual restructure. The parent WorkoutLogger removes its footer log-set button and passes the handler down. All existing data-testid selectors are preserved to minimize test breakage.

**Tech Stack:** React 19, Tailwind CSS v4, shadcn/ui Button, Lucide icons, i18next

**Reference mockup:** `docs/mockup-exercise-card-redesign.html`

---

## File Structure

| File                                                      | Action     | Responsibility                                                |
| --------------------------------------------------------- | ---------- | ------------------------------------------------------------- |
| `src/features/fitness/components/ExerciseWorkoutCard.tsx` | **Modify** | Full visual restructure — header, completed sets, active card |
| `src/features/fitness/components/WorkoutLogger.tsx`       | **Modify** | Pass `onLogSet` prop, remove footer log-set button            |
| `src/locales/vi.json`                                     | **Modify** | Add 3 new i18n keys                                           |
| `src/__tests__/ExerciseWorkoutCard.test.tsx`              | **Modify** | Add `onLogSet` prop to defaults, add test for confirm button  |
| `src/__tests__/WorkoutLogger.test.tsx`                    | **Modify** | Change `log-set-bottom-btn` → `confirm-set-btn` references    |

---

### Task 1: Add i18n keys

**Files:**

- Modify: `src/locales/vi.json`

- [ ] **Step 1: Add new keys under `fitness.logger`**

```json
"activeSet": "Đang tập",
"weightUnit": "kg",
"repsUnit": "reps"
```

These go in the existing `fitness.logger` namespace. The `exerciseProgress` key already exists with format `"Bài tập {{current}}/{{total}}"` — keep it.

- [ ] **Step 2: Verify no duplicate keys**

Run: `grep -n 'activeSet\|weightUnit\|repsUnit' src/locales/vi.json`
Expected: Only the 3 new lines.

---

### Task 2: Redesign ExerciseWorkoutCard — Header

**Files:**

- Modify: `src/features/fitness/components/ExerciseWorkoutCard.tsx` (lines 68-84)

- [ ] **Step 1: Replace header layout**

Current header: `[Dumbbell icon + name + muscles] [progress text]`
New header: `[Badge "BÀI X/Y" + large name] [muscle label + names right-aligned]`

```tsx
{
  /* Header */
}
<div className="mb-4 flex items-start justify-between">
  <div>
    <span className="text-muted-foreground mb-1 text-xs font-bold tracking-wide" data-testid="exercise-progress">
      {t('fitness.logger.exerciseProgress', { current: exerciseIndex + 1, total: totalExercises })}
    </span>
    <h3 className="text-foreground text-xl font-extrabold tracking-tight">{meta.exercise.nameVi}</h3>
  </div>
  <div className="text-right">
    <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
      {t('fitness.logger.muscleGroup')}
    </p>
    <p className="text-muted-foreground text-sm font-medium" data-testid="muscle-groups">
      {muscleGroups}
    </p>
  </div>
</div>;
```

Remove `Dumbbell` icon import (no longer used in header).

- [ ] **Step 2: Run test to verify header testids still work**

Run: `npx vitest run src/__tests__/ExerciseWorkoutCard.test.tsx -t "renders exercise name" --no-color`
Expected: PASS (name + muscle-groups testids preserved)

---

### Task 3: Redesign completed sets — inline format

**Files:**

- Modify: `src/features/fitness/components/ExerciseWorkoutCard.tsx` (lines 108-155)

- [ ] **Step 1: Remove table header row** (lines 111-117)

Delete the entire grid header div with "Set/Cân nặng/Lần/RPE" labels.

- [ ] **Step 2: Replace completed set grid with inline flex layout**

```tsx
{
  /* Completed Sets */
}
{
  loggedSets.map(set => (
    <div
      key={set.id}
      className="border-border-subtle flex items-center border-b py-3"
      data-testid={`logged-set-${set.id}`}
    >
      <span className="bg-muted text-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm font-bold">
        {set.setNumber}
      </span>
      <div className="ml-3 flex flex-1 items-baseline gap-1.5">
        <span className="text-foreground text-xl font-bold">{set.weightKg}</span>
        <span className="text-muted-foreground text-xs font-medium uppercase">{t('fitness.logger.weightUnit')}</span>
        <span className="text-muted-foreground mx-1 text-sm">×</span>
        <span className="text-foreground text-xl font-bold">{set.reps ?? 0}</span>
        <span className="text-muted-foreground text-xs font-medium uppercase">{t('fitness.logger.repsUnit')}</span>
        {set.rpe != null && (
          <span className="bg-muted text-muted-foreground ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium">
            RPE {set.rpe}
          </span>
        )}
      </div>
      <div className="flex shrink-0 gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEditSet(set)}
          data-testid={`edit-set-${set.id}`}
          aria-label={t('fitness.logger.editSet')}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive h-8 w-8"
          onClick={() => onDeleteSet(set.id)}
          data-testid={`delete-set-${set.id}`}
          aria-label={t('fitness.logger.deleteSet')}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  ));
}
```

- [ ] **Step 3: Run existing tests**

Run: `npx vitest run src/__tests__/ExerciseWorkoutCard.test.tsx --no-color`
Expected: PASS — testids `logged-set-set-1`, `edit-set-set-1`, `delete-set-set-1` preserved. Test "renders completed sets in table" uses `toHaveTextContent('80')` + `toHaveTextContent('10')` which still works with inline layout.

---

### Task 4: Redesign active set — dark card with large steppers + ✓ button

**Files:**

- Modify: `src/features/fitness/components/ExerciseWorkoutCard.tsx` (lines 157-244)
- Modify: `src/features/fitness/components/ExerciseWorkoutCard.tsx` (interface, lines 22-39)

- [ ] **Step 1: Add `onLogSet` prop to interface**

```tsx
interface ExerciseWorkoutCardProps {
  // ... existing props ...
  onLogSet: () => void;
}
```

Add to destructured params too.

- [ ] **Step 2: Replace active input row with dark card**

```tsx
{
  /* Active Set Card */
}
<div className="bg-foreground text-background mt-3 rounded-xl p-4" data-testid="active-set-card">
  {/* Active header: set number + badge */}
  <div className="mb-4 flex items-center gap-2">
    <span className="border-muted-foreground flex h-7 w-7 items-center justify-center rounded-md border text-sm font-bold">
      {nextSetNumber}
    </span>
    <span className="border-muted-foreground rounded border px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase">
      {t('fitness.logger.activeSet')}
    </span>
  </div>

  {/* Stepper groups */}
  <div className="mb-3 grid grid-cols-2 gap-3">
    {/* Weight stepper */}
    <div>
      <p className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-wide uppercase">
        {t('fitness.logger.weight')} ({t('fitness.logger.weightUnit')})
      </p>
      <div className="border-muted-foreground/30 flex items-center overflow-hidden rounded-lg border">
        <Button
          variant="ghost"
          size="icon"
          className="text-background hover:bg-muted-foreground/20 h-[52px] w-11 shrink-0 rounded-none text-xl"
          onClick={() => onWeightChange(-WEIGHT_INCREMENT)}
          data-testid="weight-minus"
          aria-label={t('fitness.logger.decreaseWeight')}
        >
          −
        </Button>
        <input
          type="text"
          inputMode="decimal"
          value={Number.isNaN(currentInput.weight) ? '' : String(currentInput.weight)}
          onChange={e => onWeightInput(e.target.value)}
          className="border-muted-foreground/30 text-background h-[52px] min-w-0 flex-1 border-x bg-transparent text-center text-2xl font-bold outline-none"
          data-testid="weight-input"
        />
        <Button
          variant="ghost"
          size="icon"
          className="text-background hover:bg-muted-foreground/20 h-[52px] w-11 shrink-0 rounded-none text-xl"
          onClick={() => onWeightChange(WEIGHT_INCREMENT)}
          data-testid="weight-plus"
          aria-label={t('fitness.logger.increaseWeight')}
        >
          +
        </Button>
      </div>
    </div>

    {/* Reps stepper */}
    <div>
      <p className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-wide uppercase">
        {t('fitness.logger.reps')}
      </p>
      <div className="border-muted-foreground/30 flex items-center overflow-hidden rounded-lg border">
        <Button
          variant="ghost"
          size="icon"
          className="text-background hover:bg-muted-foreground/20 h-[52px] w-11 shrink-0 rounded-none text-xl"
          onClick={() => onRepsChange(-REPS_INCREMENT)}
          data-testid="reps-minus"
          aria-label={t('fitness.logger.decreaseReps')}
        >
          −
        </Button>
        <input
          type="text"
          inputMode="numeric"
          value={Number.isNaN(currentInput.reps) ? '' : String(currentInput.reps)}
          onChange={e => onRepsInput(e.target.value)}
          className="border-muted-foreground/30 text-background h-[52px] min-w-0 flex-1 border-x bg-transparent text-center text-2xl font-bold outline-none"
          data-testid="reps-input"
        />
        <Button
          variant="ghost"
          size="icon"
          className="text-background hover:bg-muted-foreground/20 h-[52px] w-11 shrink-0 rounded-none text-xl"
          onClick={() => onRepsChange(REPS_INCREMENT)}
          data-testid="reps-plus"
          aria-label={t('fitness.logger.increaseReps')}
        >
          +
        </Button>
      </div>
    </div>
  </div>

  {/* Bottom: RPE + Confirm */}
  <div className="flex items-center gap-3">
    <div className="border-muted-foreground/30 flex flex-1 items-center rounded-lg border px-3 py-2.5">
      <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">RPE</span>
      <div className="ml-auto">
        <select
          value={currentInput.rpe ?? ''}
          onChange={e => {
            const val = e.target.value;
            if (val) onRpeSelect(Number(val));
          }}
          className="text-background bg-transparent text-lg font-bold outline-none"
          data-testid="rpe-select"
        >
          <option value="" className="text-foreground bg-background">
            —
          </option>
          {RPE_OPTIONS.map(rpe => (
            <option key={rpe} value={rpe} className="text-foreground bg-background">
              {rpe}
            </option>
          ))}
        </select>
      </div>
    </div>
    <Button
      variant="secondary"
      size="icon"
      className="bg-background text-foreground hover:bg-background/90 h-12 w-14 shrink-0 rounded-lg"
      onClick={onLogSet}
      data-testid="confirm-set-btn"
      aria-label={t('fitness.logger.logSet')}
    >
      <Check className="h-6 w-6" aria-hidden="true" />
    </Button>
  </div>
</div>;
```

- [ ] **Step 3: Update imports**

Remove `Dumbbell` if no longer used. Add `Check` from lucide-react.

```tsx
import { AlertTriangle, ArrowRightLeft, Check, Copy, Pencil, Trash2, TrendingUp } from 'lucide-react';
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/__tests__/ExerciseWorkoutCard.test.tsx --no-color`
Expected: FAIL on tests missing `onLogSet` prop. Fix in Task 5.

---

### Task 5: Update ExerciseWorkoutCard tests

**Files:**

- Modify: `src/__tests__/ExerciseWorkoutCard.test.tsx`

- [ ] **Step 1: Add `onLogSet` to default props**

```tsx
const defaultProps = {
  // ... existing ...
  onLogSet: vi.fn(),
};
```

- [ ] **Step 2: Add test for confirm button**

```tsx
it('calls onLogSet when confirm button clicked', () => {
  const onLogSet = vi.fn();
  render(<ExerciseWorkoutCard {...defaultProps} onLogSet={onLogSet} />);
  fireEvent.click(screen.getByTestId('confirm-set-btn'));
  expect(onLogSet).toHaveBeenCalledTimes(1);
});

it('renders active set card with set number', () => {
  render(<ExerciseWorkoutCard {...defaultProps} loggedSets={[mockSet1, mockSet2]} />);
  const activeCard = screen.getByTestId('active-set-card');
  expect(activeCard).toBeInTheDocument();
  // Next set is 3 (after 2 logged sets)
  expect(activeCard).toHaveTextContent('3');
});
```

- [ ] **Step 3: Update completed set test assertion**

Test "renders completed sets in table" — rename to "renders completed sets inline" (just description change, assertions still work with `toHaveTextContent`).

- [ ] **Step 4: Run all ExerciseWorkoutCard tests**

Run: `npx vitest run src/__tests__/ExerciseWorkoutCard.test.tsx --no-color`
Expected: ALL PASS (16 existing + 2 new = 18)

---

### Task 6: Wire up WorkoutLogger — pass onLogSet, remove footer button

**Files:**

- Modify: `src/features/fitness/components/WorkoutLogger.tsx` (lines ~505 where ExerciseWorkoutCard is rendered, lines ~625-637 footer)

- [ ] **Step 1: Pass `onLogSet` to ExerciseWorkoutCard**

Find where `<ExerciseWorkoutCard` is rendered and add:

```tsx
onLogSet={() => handleLogSet(currentMeta.exercise.id)}
```

- [ ] **Step 2: Remove "Ghi nhận set" button from footer**

In the bottom bar (line ~629-637), remove the button with `data-testid="log-set-bottom-btn"`. Keep the "Thêm bài tập" button.

The footer becomes just the add-exercise button:

```tsx
<div
  className="pb-safe border-border-subtle bg-card/95 sticky bottom-0 flex gap-2 border-t p-4 backdrop-blur-sm"
  data-testid="bottom-bar"
>
  <button
    type="button"
    onClick={() => setShowExerciseSelector(true)}
    className="text-muted-foreground hover:border-primary hover:text-primary border-border inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-3 text-sm"
    data-testid="add-exercise-bottom-btn"
  >
    <Plus className="h-5 w-5" aria-hidden="true" />
    {t('fitness.logger.addExercise')}
  </button>
</div>
```

- [ ] **Step 3: Run WorkoutLogger tests to see breakage**

Run: `npx vitest run src/__tests__/WorkoutLogger.test.tsx --no-color`
Expected: FAIL on tests referencing `log-set-bottom-btn`

---

### Task 7: Update WorkoutLogger tests

**Files:**

- Modify: `src/__tests__/WorkoutLogger.test.tsx`

- [ ] **Step 1: Replace all `log-set-bottom-btn` → `confirm-set-btn`**

The `logSetAndDismissRest` helper (line ~271-284) clicks `log-set-bottom-btn`. Change to `confirm-set-btn`:

```tsx
function logSetAndDismissRest(weight: string, reps: string, rpe?: number) {
  // ... fill inputs ...
  fireEvent.click(screen.getByTestId('confirm-set-btn'));
  // ... dismiss rest timer ...
}
```

Also update all standalone `fireEvent.click(screen.getByTestId('log-set-bottom-btn'))` calls.

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run src/__tests__/WorkoutLogger.test.tsx --no-color`
Expected: ALL PASS

---

### Task 8: Quality gates + commit

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: 0 errors

- [ ] **Step 2: Full test suite**

Run: `npm run test`
Expected: 0 failures

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: Clean build

- [ ] **Step 4: Visual verification**

Navigate to workout logger in Chrome DevTools, take screenshot, compare with mockup.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(fitness): redesign ExerciseWorkoutCard — dark active card + inline sets

- Header: badge + large name + muscle groups right-aligned
- Completed sets: inline format (weight × reps) with large typography
- Active set: dark card (bg-foreground) with large steppers + labels
- ✓ confirm button replaces footer 'Ghi nhận set' button
- RPE select integrated into active card bottom row
- All existing functionality preserved (copy, swap, overload, edit, delete)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Risk Assessment

| Risk                                                            | Mitigation                                                                                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| WorkoutLogger tests break (many reference `log-set-bottom-btn`) | Task 7 — systematic find-replace, ~20 occurrences                                                                         |
| Dark card colors wrong in dark mode                             | `bg-foreground`/`text-background` auto-inverts — light mode: dark card, dark mode: light card. May need explicit override |
| Stepper too wide on small screens                               | `grid-cols-2 gap-3` + `min-w-0 flex-1` ensures even split                                                                 |
| RPE select dropdown unreadable on dark bg                       | Option elements get explicit `bg-background text-foreground` class                                                        |
