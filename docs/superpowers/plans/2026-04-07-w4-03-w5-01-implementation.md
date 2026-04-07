# W4-03 CloseButton + W5-01 Dashboard GP2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize 18 close buttons across the app via shared CloseButton component, then refactor Dashboard to merge NutritionHero + WeeklySnapshot into a unified CombinedHero.

**Architecture:** Three-phase approach — (0) extend ErrorBoundary with `fallback` ReactNode support, (1) upgrade CloseButton API then replace all 18 inline close patterns, (2) create CombinedHero orchestrator + NutritionSection + WeeklyStatsRow sub-components, rewire DashboardTab, delete old files.

**Tech Stack:** React 19, TypeScript, Tailwind v4, Zustand, i18next, Vitest + RTL

**Spec:** `docs/superpowers/specs/2026-07-27-w4-03-w5-01-design.md`

**Commit Rule (Memory #40):** Sub-agents CANNOT git add/commit/push. Only orchestrator commits after full quality gate passes. Verify changes by USAGE (grep imports) not EXISTENCE (file exists).

---

## File Map

### Step 0 — ErrorBoundary Extension

| Action | File                                   | Responsibility                         |
| ------ | -------------------------------------- | -------------------------------------- |
| Modify | `src/components/ErrorBoundary.tsx`     | Add `fallback?: React.ReactNode` prop  |
| Modify | `src/__tests__/ErrorBoundary.test.tsx` | Add test for custom fallback ReactNode |

### Step 1 — W4-03 CloseButton

| Action  | File                                                   | Responsibility                                   |
| ------- | ------------------------------------------------------ | ------------------------------------------------ |
| Modify  | `src/components/shared/CloseButton.tsx`                | Add `ariaLabel`, `variant` props, `rounded-full` |
| Rewrite | `src/__tests__/CloseButton.test.tsx`                   | Test new props + backward compat                 |
| Modify  | 11 modal files (12 targets) in `src/components/`       | Replace inline close → `<CloseButton>`           |
| Modify  | `src/features/dashboard/components/WeightQuickLog.tsx` | Replace inline close                             |
| Modify  | `src/features/fitness/components/SetEditor.tsx`        | Replace inline close                             |
| Modify  | `src/components/DishManager.tsx`                       | Replace compare close                            |
| Modify  | `src/components/CalendarTab.tsx`                       | Replace grocery sidebar close                    |
| Modify  | `src/components/shared/DetailModal.tsx`                | Replace detail close                             |
| Modify  | `src/components/ImageCapture.tsx`                      | Replace camera close (overlay variant)           |

### Step 2 — W5-01 Dashboard GP2

| Action  | File                                                                               | Responsibility                                                    |
| ------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Create  | `src/features/dashboard/components/CombinedHero.tsx`                               | Orchestrator (~80 LOC)                                            |
| Create  | `src/features/dashboard/components/NutritionSection.tsx`                           | Extracted from NutritionHero (~280 LOC)                           |
| Create  | `src/features/dashboard/components/WeeklyStatsRow.tsx`                             | Extracted from WeeklySnapshot (~80 LOC)                           |
| Modify  | `src/features/dashboard/components/DashboardTab.tsx`                               | Import CombinedHero, remove old imports                           |
| Delete  | `src/features/dashboard/components/NutritionHero.tsx`                              | Replaced by NutritionSection + CombinedHero                       |
| Delete  | `src/features/dashboard/components/WeeklySnapshot.tsx`                             | Replaced by WeeklyStatsRow                                        |
| Create  | `src/__tests__/CombinedHero.test.tsx`                                              | New orchestrator tests (~120 LOC)                                 |
| Rewrite | `src/__tests__/NutritionHero.test.tsx` → `src/__tests__/NutritionSection.test.tsx` | Props interface change                                            |
| Rewrite | `src/__tests__/WeeklySnapshot.test.tsx` → `src/__tests__/WeeklyStatsRow.test.tsx`  | Styling + grid changes                                            |
| Modify  | `src/__tests__/DashboardTab.test.tsx`                                              | Mock changes (CombinedHero replaces NutritionHero+WeeklySnapshot) |
| Verify  | `src/__tests__/integration/dashboardEdgeCases.test.ts`                             | No module-path mocks to change, but verify pass                   |

---

## Task 0: Extend ErrorBoundary (Prerequisite)

**Files:**

- Modify: `src/components/ErrorBoundary.tsx:7-10,42-80`
- Modify: `src/__tests__/ErrorBoundary.test.tsx`

- [ ] **Step 0.1: Write failing test for `fallback` prop**

In `src/__tests__/ErrorBoundary.test.tsx`, add:

```tsx
it('renders custom fallback ReactNode when provided', () => {
  const ThrowError = () => {
    throw new Error('test');
  };
  const customFallback = <div data-testid="custom-fallback">Custom Error UI</div>;

  render(
    <ErrorBoundary fallback={customFallback}>
      <ThrowError />
    </ErrorBoundary>,
  );

  expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
  // Default fallback elements should NOT render
  expect(screen.queryByText(/thử lại/i)).not.toBeInTheDocument();
});

it('still renders fallbackTitle when fallback prop is not provided', () => {
  const ThrowError = () => {
    throw new Error('test');
  };

  render(
    <ErrorBoundary fallbackTitle="Custom Title">
      <ThrowError />
    </ErrorBoundary>,
  );

  expect(screen.getByText('Custom Title')).toBeInTheDocument();
});
```

- [ ] **Step 0.2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/ErrorBoundary.test.tsx -t "renders custom fallback"
```

Expected: FAIL — `fallback` prop not accepted by interface.

- [ ] **Step 0.3: Implement fallback prop**

In `src/components/ErrorBoundary.tsx`:

1. Update interface (line 7-10):

```tsx
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallback?: React.ReactNode;
}
```

2. Update render method (line 42-43):

```tsx
render() {
  if (this.state.hasError) {
    // Custom fallback ReactNode takes priority
    if (this.props.fallback) {
      return this.props.fallback;
    }
    // Default fallback with title (existing behavior, backward compatible)
    return (
      // ... existing JSX unchanged ...
    );
  }
  return this.props.children;
}
```

- [ ] **Step 0.4: Run ALL ErrorBoundary tests**

```bash
npx vitest run src/__tests__/ErrorBoundary.test.tsx
```

Expected: ALL PASS (new tests + existing backward compat tests).

- [ ] **Step 0.5: Run lint**

```bash
npm run lint
```

Expected: 0 errors.

---

## Task 1: Upgrade CloseButton Component

**Files:**

- Modify: `src/components/shared/CloseButton.tsx`
- Rewrite: `src/__tests__/CloseButton.test.tsx`

- [ ] **Step 1.1: Write failing tests for new props**

Rewrite `src/__tests__/CloseButton.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CloseButton } from '@/components/shared/CloseButton';

describe('CloseButton', () => {
  it('renders with default aria-label "Đóng hộp thoại"', () => {
    render(<CloseButton onClick={vi.fn()} />);
    expect(screen.getByLabelText('Đóng hộp thoại')).toBeInTheDocument();
  });

  it('renders with rounded-full shape', () => {
    render(<CloseButton onClick={vi.fn()} />);
    const btn = screen.getByLabelText('Đóng hộp thoại');
    expect(btn.className).toContain('rounded-full');
    expect(btn.className).not.toContain('rounded-lg');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<CloseButton onClick={handleClick} />);
    await user.click(screen.getByLabelText('Đóng hộp thoại'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('renders with custom data-testid', () => {
    render(<CloseButton onClick={vi.fn()} data-testid="btn-close-dish" />);
    expect(screen.getByTestId('btn-close-dish')).toBeInTheDocument();
  });

  it('renders with custom ariaLabel override', () => {
    render(<CloseButton onClick={vi.fn()} ariaLabel="Đóng" />);
    expect(screen.getByLabelText('Đóng')).toBeInTheDocument();
    expect(screen.queryByLabelText('Đóng hộp thoại')).not.toBeInTheDocument();
  });

  it('renders default variant styling', () => {
    render(<CloseButton onClick={vi.fn()} />);
    const btn = screen.getByLabelText('Đóng hộp thoại');
    expect(btn.className).toContain('text-muted-foreground');
    expect(btn.className).not.toContain('backdrop-blur');
  });

  it('renders overlay variant styling', () => {
    render(<CloseButton onClick={vi.fn()} variant="overlay" />);
    const btn = screen.getByLabelText('Đóng hộp thoại');
    expect(btn.className).toContain('text-white');
    expect(btn.className).toContain('backdrop-blur');
  });

  it('has accessible focus ring', () => {
    render(<CloseButton onClick={vi.fn()} />);
    const btn = screen.getByLabelText('Đóng hộp thoại');
    expect(btn.className).toContain('focus-visible:ring-2');
  });

  it('has min 44px touch target', () => {
    render(<CloseButton onClick={vi.fn()} />);
    const btn = screen.getByLabelText('Đóng hộp thoại');
    expect(btn.className).toContain('min-h-11');
    expect(btn.className).toContain('min-w-11');
  });
});
```

- [ ] **Step 1.2: Run tests to verify failures**

```bash
npx vitest run src/__tests__/CloseButton.test.tsx
```

Expected: Multiple failures (`ariaLabel` prop not accepted, `rounded-lg` found, `variant` not accepted).

- [ ] **Step 1.3: Implement CloseButton upgrade**

Replace `src/components/shared/CloseButton.tsx` content with spec §1.2:

```tsx
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CloseButtonProps {
  onClick: () => void;
  'data-testid'?: string;
  /** Resolved aria-label string. Caller passes t('...') result. Default: t('common.closeDialog') computed internally. */
  ariaLabel?: string;
  /** Visual variant. 'default' = card/modal surface. 'overlay' = dark/video surface (white icon, backdrop-blur). */
  variant?: 'default' | 'overlay';
}

const VARIANT_STYLES = {
  default: 'text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring',
  overlay: 'text-white bg-card/20 hover:bg-card/30 backdrop-blur focus-visible:ring-ring',
} as const;

/**
 * Standardized close button for modals, sheets, and overlays.
 * Provides consistent 44px touch target, focus ring, and aria-label.
 */
export const CloseButton = ({
  onClick,
  'data-testid': testId,
  ariaLabel,
  variant = 'default',
}: Readonly<CloseButtonProps>) => {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      aria-label={ariaLabel ?? t('common.closeDialog')}
      className={`flex min-h-11 min-w-11 items-center justify-center rounded-full transition-all focus-visible:ring-2 focus-visible:outline-none ${VARIANT_STYLES[variant]}`}
    >
      <X className="h-5 w-5" />
    </button>
  );
};
```

- [ ] **Step 1.4: Run tests to verify pass**

```bash
npx vitest run src/__tests__/CloseButton.test.tsx
```

Expected: ALL PASS.

- [ ] **Step 1.5: Run lint**

```bash
npm run lint
```

Expected: 0 errors.

---

## Task 2: Replace Close Buttons — Modal Group (12 targets in 11 files)

**Files:** All `src/components/modals/*.tsx` per spec §1.3 rows 1-12.

Each replacement follows the same pattern:

**Before** (inline button):

```tsx
import { X } from 'lucide-react';
// ...
<button onClick={onClose} aria-label={t('common.closeDialog')} className="...">
  <X className="h-6 w-6" />
</button>;
```

**After** (shared component):

```tsx
import { CloseButton } from '@/components/shared/CloseButton';
// Remove: import { X } from 'lucide-react'; (if only used for close)
// ...
<CloseButton onClick={onClose} data-testid="btn-close-xxx" />;
```

- [ ] **Step 2.1: Replace 5 modals WITHOUT existing testids (rows 1-5)**

Files + testids to ADD:

1. `ClearPlanModal.tsx:121` → `data-testid="btn-close-clear-plan"`
2. `CopyPlanModal.tsx:127` → `data-testid="btn-close-copy-plan"`
3. `TemplateManager.tsx:101` → `data-testid="btn-close-template-manager"`
4. `SaveTemplateModal.tsx:169` → `data-testid="btn-close-save-template"`
5. `MealPlannerModal.tsx:207` → `data-testid="btn-close-meal-planner"`

For each: add `import { CloseButton } from '@/components/shared/CloseButton';`, replace inline `<button>...<X />...</button>` with `<CloseButton onClick={onClose} data-testid="..." />`, remove `X` import if no longer used.

⚠️ **TemplateManager.tsx** and **SaveTemplateModal.tsx** use `X` for BOTH close button AND tag remove / cancel rename (see spec §1.5). Do NOT remove the `X` import — only replace the close button instance.

- [ ] **Step 2.2: Replace 4 modals WITH existing testids (rows 6-9)**

Files + testids to PRESERVE: 6. `DishEditModal.tsx:373` → preserve `data-testid="btn-close-dish"` 7. `IngredientEditModal.tsx:226` → preserve `data-testid="btn-close-ingredient"` 8. `QuickAddIngredientForm.tsx:183` → add `data-testid="btn-close-quick-add"` 9. `AISuggestionPreviewModal.tsx:156` → add `data-testid="btn-close-ai-suggestion"`

- [ ] **Step 2.3: Replace AISuggestIngredientsPreview (2 instances, rows 10-11)**

File: `AISuggestIngredientsPreview.tsx` — lines 99 AND 129. Both preserve `data-testid="btn-ai-suggest-close"`.

- [ ] **Step 2.4: Replace SaveAnalyzedDishModal (row 12)**

File: `SaveAnalyzedDishModal.tsx:152` → add `data-testid="btn-close-save-analyzed"`

- [ ] **Step 2.5: Run all modal-related tests**

```bash
npx vitest run src/__tests__/managers.test.tsx src/__tests__/aiSuggestIngredientsPreview.test.tsx
```

Expected: ALL PASS (testids preserved, default aria-label unchanged).

- [ ] **Step 2.6: Run lint**

```bash
npm run lint
```

---

## Task 3: Replace Close Buttons — Non-Modal Group (6 targets in 6 files)

**Files:** Spec §1.3 rows 13-14 + §1.4 rows 15-18.

- [ ] **Step 3.1: WeightQuickLog (row 13) — needs ariaLabel override**

File: `src/features/dashboard/components/WeightQuickLog.tsx:267`

- Preserve: `data-testid="close-btn"`
- Override: `ariaLabel={t('common.close')}`

```tsx
<CloseButton onClick={onClose} data-testid="close-btn" ariaLabel={t('common.close')} />
```

- [ ] **Step 3.2: SetEditor (row 14) — needs ariaLabel override**

File: `src/features/fitness/components/SetEditor.tsx:140`

- Preserve: `data-testid="editor-close-button"`
- Override: `ariaLabel={t('common.close')}`

- [ ] **Step 3.3: DishManager (row 15) — compare close, needs ariaLabel override**

File: `src/components/DishManager.tsx:788`

- Add: `data-testid="btn-close-compare"`
- Override: `ariaLabel={t('common.close')}`

- [ ] **Step 3.4: CalendarTab (row 16) — grocery sidebar, needs ariaLabel override**

File: `src/components/CalendarTab.tsx:243`

- Preserve: `data-testid="btn-close-grocery"`
- Override: `ariaLabel={t('common.close')}`

- [ ] **Step 3.5: DetailModal (row 17) — uses default ariaLabel**

File: `src/components/shared/DetailModal.tsx:42`

- Preserve: `data-testid="btn-detail-close"`
- No ariaLabel override needed (uses default `common.closeDialog`).

- [ ] **Step 3.6: ImageCapture (row 18) — overlay variant + special ariaLabel**

File: `src/components/ImageCapture.tsx:175`

- Add: `data-testid="btn-close-camera"`
- Override: `ariaLabel={t('imageCapture.closeCamera')}`
- Variant: `variant="overlay"`

```tsx
<CloseButton
  onClick={stopCamera}
  data-testid="btn-close-camera"
  ariaLabel={t('imageCapture.closeCamera')}
  variant="overlay"
/>
```

- [ ] **Step 3.7: Run affected tests**

```bash
npx vitest run src/__tests__/WeightQuickLog.test.tsx src/__tests__/SetEditor.test.tsx src/__tests__/calendarAndDate.test.tsx src/__tests__/accessibility.test.tsx src/__tests__/imageCapture.test.tsx
```

Expected: ALL PASS. `imageCapture.test.tsx` specifically validates `aria-label="Đóng camera"` (lines 111, 145, 147) — this is the only `variant="overlay"` regression test.

- [ ] **Step 3.8: Verify all 18 replacements by grep**

```bash
# Should find 18 imports of CloseButton (17 files, 1 file=AISuggestIngredientsPreview uses it twice but imports once)
grep -rl "CloseButton" src/ --include='*.tsx' | grep -v '__tests__' | grep -v 'node_modules' | wc -l
# Expected: 18 (17 consumer files + 1 component definition)

# Verify all replaced files now import CloseButton (structural check)
for f in src/components/modals/ClearPlanModal.tsx src/components/modals/CopyPlanModal.tsx src/components/modals/TemplateManager.tsx src/components/modals/SaveTemplateModal.tsx src/components/modals/MealPlannerModal.tsx src/components/modals/QuickAddIngredientForm.tsx src/components/modals/AISuggestionPreviewModal.tsx src/components/modals/AISuggestIngredientsPreview.tsx src/components/modals/SaveAnalyzedDishModal.tsx src/components/modals/DishEditModal.tsx src/components/modals/IngredientEditModal.tsx src/features/dashboard/components/WeightQuickLog.tsx src/features/fitness/components/SetEditor.tsx src/components/DishManager.tsx src/components/CalendarTab.tsx src/components/shared/DetailModal.tsx src/components/ImageCapture.tsx; do
  grep -q 'CloseButton' "$f" && echo "✅ $f" || echo "❌ MISSING: $f"
done
# Expected: ALL ✅ (17 files)
```

- [ ] **Step 3.9: Run full lint + test**

```bash
npm run lint && npm run test
```

Expected: 0 errors, 0 failures.

---

## Task 4: Create CombinedHero Orchestrator

**Files:**

- Create: `src/features/dashboard/components/CombinedHero.tsx`
- Create: `src/__tests__/CombinedHero.test.tsx`

- [ ] **Step 4.1: Write CombinedHero tests first**

Create `src/__tests__/CombinedHero.test.tsx` (~120 LOC):

Key test cases:

1. Renders `NutritionSection` + `WeeklyStatsRow` together when `isFirstTimeUser=false`
2. Hides `WeeklyStatsRow` + divider when `isFirstTimeUser=true`
3. `ErrorBoundary` catches `WeeklyStatsRow` failure → shows fallback, NutritionSection unaffected
4. `isLoading=true` → `aria-busy` on outer section
5. Correct `aria-label` with interpolated score + label
6. Props from `useDailyScore()` passed correctly to `NutritionSection`

Mock setup:

- Mock `useDailyScore` hook
- Mock `NutritionSection` and `WeeklyStatsRow` as simple divs with testids (unit test CombinedHero in isolation)
- Mock `ErrorBoundary` to use real implementation (need fault isolation test)

- [ ] **Step 4.2: Run tests — verify they fail**

```bash
npx vitest run src/__tests__/CombinedHero.test.tsx
```

Expected: FAIL — `CombinedHero` module not found.

- [ ] **Step 4.3: Implement CombinedHero**

Create `src/features/dashboard/components/CombinedHero.tsx` per spec §2.4. Key details:

1. Import `useDailyScore` from `@/features/dashboard/hooks/useDailyScore`
2. Import `ScoreColor` from `@/features/dashboard/types`
3. Import `ErrorBoundary` from `@/components/ErrorBoundary`
4. Import `NutritionSection` from `./NutritionSection`
5. Import `WeeklyStatsRow` from `./WeeklyStatsRow`
6. Derive `scoreLabel` from `SCORE_COLOR_TO_LABEL[color]`
7. `WeeklyStatsRowFallback` = inline 3-col grid with "—" placeholders

- [ ] **Step 4.4: Run CombinedHero tests**

```bash
npx vitest run src/__tests__/CombinedHero.test.tsx
```

Expected: Some may still fail (NutritionSection/WeeklyStatsRow don't exist yet). Tests mocking those as modules should pass.

---

## Task 5: Extract NutritionSection from NutritionHero

**Files:**

- Create: `src/features/dashboard/components/NutritionSection.tsx`
- Rewrite: `src/__tests__/NutritionHero.test.tsx` → `src/__tests__/NutritionSection.test.tsx`

- [ ] **Step 5.1: Create NutritionSection.tsx**

Extract from `NutritionHero.tsx` (369 LOC → ~280 LOC):

Key changes from NutritionHero:

1. Component name: `NutritionHero` → `NutritionSection`
2. **Remove** `useDailyScore()` call — receive as props instead
3. Props interface: `{ isLoading, isFirstTimeUser, greeting, heroContext, totalScore, scoreColor }`
4. **Remove** outer `<section>` with gradient — that's now CombinedHero's job
5. **Keep** inner `<div data-testid="nutrition-hero" aria-label={t('dashboard.nutritionHero.a11y')} aria-busy={isLoading}>`
6. **Keep** ALL internal hooks: `useNutritionTargets()`, `useHealthProfileStore()`, `useDayPlanStore()`, `useDishStore()`, `useIngredientStore()`
7. **Keep** ALL internal JSX: greeting row, calorie ring, macro bars, first-time setup prompt
8. **Keep** constants: `HERO_CONTEXT_I18N`, `SCORE_BADGE_BG`, `RING_*`, `GRADIENT_CLASS` (if still used internally)
9. **Move** `SCORE_COLOR_TO_LABEL` to CombinedHero (it's used for aria-label there)

⚠️ **Critical**: The `GRADIENT_CLASS` might be used for the first-time-user variant background. Check `NutritionHero.tsx` lines 260-290 for conditional rendering.

- [ ] **Step 5.2: Write NutritionSection tests**

Rewrite `src/__tests__/NutritionHero.test.tsx` → `src/__tests__/NutritionSection.test.tsx` (~550 LOC):

Key changes:

1. Component import: `NutritionSection` (not `NutritionHero`)
2. **Remove** all `useDailyScore` mocking — pass as props instead
3. All renders become: `<NutritionSection isFirstTimeUser={false} greeting="Xin chào" heroContext="balanced-day" totalScore={85} scoreColor="emerald" />`
4. **Preserve** ALL `data-testid="nutrition-hero"` assertions (40+)
5. **Preserve** ALL `aria-busy` assertions
6. **Preserve** ALL `aria-label` assertions for `dashboard.nutritionHero.a11y`
7. **Remove** assertions about outer `<section>` gradient (moved to CombinedHero)

- [ ] **Step 5.3: Run NutritionSection tests**

```bash
npx vitest run src/__tests__/NutritionSection.test.tsx
```

Expected: ALL PASS.

- [ ] **Step 5.4: Delete old NutritionHero.test.tsx**

```bash
rm src/__tests__/NutritionHero.test.tsx
```

---

## Task 6: Extract WeeklyStatsRow from WeeklySnapshot

**Files:**

- Create: `src/features/dashboard/components/WeeklyStatsRow.tsx`
- Rewrite: `src/__tests__/WeeklySnapshot.test.tsx` → `src/__tests__/WeeklyStatsRow.test.tsx`

- [ ] **Step 6.1: Create WeeklyStatsRow.tsx**

Extract from `WeeklySnapshot.tsx` (192 LOC → ~80 LOC):

Key changes from WeeklySnapshot:

1. Component name: `WeeklySnapshot` → `WeeklyStatsRow`
2. **Remove** outer card wrapper (standalone card → inline row)
3. **Keep** `<div data-testid="weekly-snapshot" aria-label={...}>` wrapper
4. **Keep** ALL hooks: `useFitnessStore(selectActivePlan)`, `useFitnessStore(useShallow(...))` for `weightEntries, workouts, trainingPlanDays`
5. **Keep** computed values: `scheduledDays`, `latestWeight`, `weeklyChange`, `streakInfo`, `adherence`
6. **Change** text colors: `text-foreground` → `text-primary-foreground` (inside hero gradient)
7. **Change** dividers: standalone card dividers → `border-r border-primary-foreground/10`
8. **Keep** 3-col grid layout: Weight | Streak | Adherence

- [ ] **Step 6.2: Write WeeklyStatsRow tests**

Rewrite `src/__tests__/WeeklySnapshot.test.tsx` → `src/__tests__/WeeklyStatsRow.test.tsx` (~400 LOC):

Key changes:

1. Component import: `WeeklyStatsRow` (not `WeeklySnapshot`)
2. **Preserve** `data-testid="weekly-snapshot"` assertions
3. **Preserve** `aria-label` assertions with `streakInfo.currentStreak` + adherence formatting
4. **Update** text color assertions to `text-primary-foreground`
5. **Update** divider assertions
6. **Keep** all paused-plan / multi-plan test cases

- [ ] **Step 6.3: Run WeeklyStatsRow tests**

```bash
npx vitest run src/__tests__/WeeklyStatsRow.test.tsx
```

Expected: ALL PASS.

- [ ] **Step 6.4: Delete old WeeklySnapshot.test.tsx**

```bash
rm src/__tests__/WeeklySnapshot.test.tsx
```

---

## Task 7: Rewire DashboardTab + Delete Old Files

**Files:**

- Modify: `src/features/dashboard/components/DashboardTab.tsx`
- Modify: `src/__tests__/DashboardTab.test.tsx`
- Delete: `src/features/dashboard/components/NutritionHero.tsx`
- Delete: `src/features/dashboard/components/WeeklySnapshot.tsx`

- [ ] **Step 7.1: Update DashboardTab.tsx**

1. Replace imports:

```tsx
// REMOVE:
import { NutritionHero } from './NutritionHero';
import { WeeklySnapshot } from './WeeklySnapshot';
// ADD:
import { CombinedHero } from './CombinedHero';
```

2. Replace JSX:

- Replace `<NutritionHero />` with `<CombinedHero />`
- Remove `<WeeklySnapshot />` from Tier 3
- `QuickActionsBar` stays in lower tiers

- [ ] **Step 7.2: Update DashboardTab.test.tsx**

1. Line 15: Mock `CombinedHero` instead of `NutritionHero`
2. Line 27: Remove `WeeklySnapshot` mock entirely
3. **CombinedHero mock MUST render the testids its children own:**
   ```tsx
   vi.mock('../features/dashboard/components/CombinedHero', () => ({
     CombinedHero: () => (
       <div>
         <div data-testid="nutrition-hero">NutritionSection mock</div>
         <div data-testid="weekly-snapshot">WeeklyStatsRow mock</div>
       </div>
     ),
   }));
   ```
   This ensures `data-testid="nutrition-hero"` assertions (40+) continue to pass.
4. Line 149: Remove `weekly-snapshot` from tier-3 assertion (now inside CombinedHero, not a separate tier-3 item)
5. Remove any tier-3 placeholder/lazy assertions for WeeklySnapshot

- [ ] **Step 7.3: Delete old source files**

```bash
rm src/features/dashboard/components/NutritionHero.tsx
rm src/features/dashboard/components/WeeklySnapshot.tsx
```

- [ ] **Step 7.4: Run DashboardTab tests**

```bash
npx vitest run src/__tests__/DashboardTab.test.tsx
```

Expected: ALL PASS.

- [ ] **Step 7.5: Run integration edge case tests**

```bash
npx vitest run src/__tests__/integration/dashboardEdgeCases.test.ts
```

Expected: ALL PASS (no module-path mocks for NutritionHero/WeeklySnapshot).

- [ ] **Step 7.6: Verify no dangling imports**

```bash
# No file should import NutritionHero or WeeklySnapshot anymore
grep -r "NutritionHero\|WeeklySnapshot" src/ --include='*.ts' --include='*.tsx' | grep -v '__tests__' | grep -v 'node_modules'
# Expected: 0 results (or only type references if any)

# Test files should not import deleted modules
grep -r "from.*NutritionHero\|from.*WeeklySnapshot" src/__tests__/ --include='*.ts' --include='*.tsx'
# Expected: 0 results
```

---

## Task 8: Quality Gate

- [ ] **Step 8.1: Full lint**

```bash
npm run lint
```

Expected: 0 errors, 0 `eslint-disable`.

- [ ] **Step 8.2: Full test suite**

```bash
npm run test
```

Expected: 0 failures.

- [ ] **Step 8.3: Coverage check**

```bash
npm run test:coverage
```

Expected: 100% coverage for all new/modified code.

- [ ] **Step 8.4: Production build**

```bash
npm run build
```

Expected: Clean build, no warnings.

- [ ] **Step 8.5: SonarQube scan**

```bash
npm run test:coverage && npm run sonar
```

Expected: 0 issues (Bug, Vulnerability, Code Smell).

If issues found → fix → restart from Step 8.1.

- [ ] **Step 8.6: Build APK + install on emulator**

```bash
npx cap sync android
cd android && ./gradlew assembleDebug
adb -s emulator-5556 install -r app/build/outputs/apk/debug/app-debug.apk
```

- [ ] **Step 8.7: Emulator verification via CDP**

Verify on emulator:

1. Dashboard loads with CombinedHero (4 sections, not 5)
2. Weekly stats visible inside hero card (below macros)
3. 3-col grid: weight | streak | adherence
4. Greeting + score badge at top
5. Close buttons in modals work (test 2-3 modals)
6. Screenshot evidence saved

- [ ] **Step 8.8: Single commit**

```bash
git add -A
git commit -m "feat(ui): W4-03 CloseButton standardization + W5-01 Dashboard GP2 refactor

- Upgrade CloseButton with ariaLabel, variant props (17 files, 18 targets)
- Extend ErrorBoundary with fallback ReactNode prop
- Create CombinedHero: merge NutritionHero + WeeklySnapshot
- Extract NutritionSection (280 LOC) + WeeklyStatsRow (80 LOC)
- Delete NutritionHero.tsx + WeeklySnapshot.tsx
- Dashboard: 5 sections → 4 sections (GP2 approach)
- WeeklyStatsRow wrapped in ErrorBoundary for fault isolation
- All existing data-testid values preserved (zero breaking changes)
- 100% test coverage for new code

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Parallelization Guide

Tasks that CAN run in parallel (for fleet dispatch):

| Group | Tasks           | Reason                                                        |
| ----- | --------------- | ------------------------------------------------------------- |
| A     | Task 0 + Task 1 | ErrorBoundary and CloseButton are independent files           |
| B     | Task 2 + Task 3 | Modal group + non-modal group touch different files           |
| C     | Task 5 + Task 6 | NutritionSection + WeeklyStatsRow are independent extractions |

Tasks that MUST be sequential:

- Task 0 → Task 4 (CombinedHero needs ErrorBoundary `fallback` prop)
- Task 1 → Task 2 + 3 (replacements need upgraded CloseButton)
- Task 5 + 6 → Task 7 (DashboardTab needs new components to exist)
- Task 7 → Task 8 (quality gate after all changes)

**Recommended wave structure:**

```
Wave 1: Task 0 (ErrorBoundary) + Task 1 (CloseButton upgrade)     [parallel]
Wave 2: Task 2 (modal close) + Task 3 (non-modal close)           [parallel]
Wave 3: Task 4 (CombinedHero) + Task 5 (NutritionSection) + Task 6 (WeeklyStatsRow)  [parallel]
Wave 4: Task 7 (DashboardTab rewire + delete old)                  [sequential]
Wave 5: Task 8 (Quality gate — orchestrator only)                  [sequential]
```
