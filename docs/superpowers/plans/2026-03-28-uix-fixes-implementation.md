# UI/UX Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all Critical + High priority UI/UX issues from the professional evaluation, raising the app quality score from 7.2 to ~8.0/10.

**Architecture:** Surgical Tailwind class fixes + small component additions. No new dependencies. All changes are CSS/className modifications except Task 3 (adding tab labels). Changes are grouped into 4 phases by dependency: Phase 1 (Critical a11y fixes — touch targets + contrast + CALO badge), Phase 2 (Layout improvements), Phase 3 (Polish), Phase 4 (Verification). **Tasks within each phase are parallel-safe — they do NOT share modified files.**

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4, Lucide React icons, Vitest

**Evaluation report:** `docs/superpowers/plans/2026-03-28-uix-professional-evaluation.md`

---

## File Structure

| File | Phase | Task | Changes |
|------|-------|------|---------|
| `src/components/schedule/MealSlot.tsx` | 1 | 1 | Fix serving button touch targets (20px→44px), fix text-slate-400 contrast, CALO badge color |
| `src/components/navigation/AppNavigation.tsx` | 2 | 3 | Add visible text labels to mobile bottom tab bar |
| `src/components/settings/SettingsMenu.tsx` | 2 | 4 | Remove duplicate "Cài đặt" heading |
| `src/components/DishManager.tsx` | 1 | 2 | Fix text-slate-400 contrast, CALO badge color |
| `src/components/IngredientManager.tsx` | 1 | 2 | Fix text-slate-400 contrast |
| `src/components/GroceryList.tsx` | 1 | 2 | Fix text-slate-400 contrast |
| `src/components/modals/*.tsx` | 1 | 2 | Fix text-slate-400 contrast (multiple modal files) |
| `src/features/fitness/components/*.tsx` | 1 | 2 | Fix text-slate-400 contrast |
| `src/App.tsx` | 3 | 5 | Add fadeIn animation on tab switch |
| `src/__tests__/scheduleComponents.test.tsx` | 1 | 1 | Add serving button touch target assertion |
| `src/__tests__/navigationIndex.test.ts` | 2 | 3 | Add visible label assertion |
| `src/__tests__/settingsTab.test.tsx` | 2 | 4 | Update heading assertion for removed duplicate |

**Key parallel safety note:** Task 1 modifies `MealSlot.tsx` and Task 2 modifies `DishManager.tsx` + other files. They do NOT overlap. Task 5 (CALO badge) is merged into Task 1 (for MealSlot) and Task 2 (for DishManager) to prevent file conflicts.

### Global contrast fix (Phase 1, Task 2)
~65 files have `text-slate-400` for visible label text. The fix is targeted: only change instances where `text-slate-400` is used for **readable label/description text** (not icon colors which are decorative). Key files:
- `src/components/DishManager.tsx` (line 212 — CALO badge label)
- `src/components/DishManager.tsx` (line 212)
- `src/components/IngredientManager.tsx`
- `src/components/settings/SettingsMenu.tsx` (line 144)
- And ~15 other files with visible label text

---

## Phase 1: Critical Accessibility Fixes (PARALLEL — no dependencies between tasks)

### Task 1: Fix MealSlot — Touch Targets + Contrast + CALO Badge [ID-04, A11Y-01, VD-01]

**Files:**
- Modify: `src/components/schedule/MealSlot.tsx` (lines 65, 89, 114, 118, 133-140)
- Test: `src/__tests__/scheduleComponents.test.tsx` (existing test file — add assertions)

**Issues (combined to avoid file conflicts):**
- Serving +/- buttons are `w-5 h-5` (20×20px) — violates WCAG 44px minimum
- `text-slate-400` on empty state label "Chưa có món" — fails contrast
- CALO badge uses gray `bg-slate-100` while PROTEIN uses colored `bg-blue-50`

- [ ] **Step 1: Add touch target assertion to existing test**

In `src/__tests__/scheduleComponents.test.tsx`, locate the existing test `'renders serving stepper when onUpdateServings is provided'` (around line 144). Add a new assertion after line 158:

```tsx
it('serving buttons meet WCAG 44px touch target minimum', () => {
  render(
    <MealSlot
      type="breakfast" slot={makeSlot([dish])} dishes={[dish]}
      onEdit={vi.fn()} servings={{}} onUpdateServings={vi.fn()}
    />,
  );
  const plusBtn = screen.getByTestId('btn-serving-plus-d1');
  const minusBtn = screen.getByTestId('btn-serving-minus-d1');
  expect(plusBtn.className).toContain('min-h-11');
  expect(plusBtn.className).toContain('min-w-11');
  expect(minusBtn.className).toContain('min-h-11');
  expect(minusBtn.className).toContain('min-w-11');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/scheduleComponents.test.tsx --reporter=verbose`
Expected: FAIL — current buttons use `w-5 h-5`, not `min-h-11 min-w-11`

- [ ] **Step 3: Fix all MealSlot issues in one pass**

In `src/components/schedule/MealSlot.tsx`:

**A) Fix serving buttons (lines ~114 and ~118) — touch targets:**

Before:
```tsx
className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-emerald-500 disabled:opacity-30 transition-all"
```

After (both buttons):
```tsx
className="min-h-11 min-w-11 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-30 transition-all active:scale-[0.98]"
```

Also change icon size from `w-3 h-3` to `w-4 h-4` inside both buttons.

**B) Fix empty state label contrast (line ~65):**

Before: `text-xs text-slate-400 dark:text-slate-500`
After: `text-xs text-slate-500 dark:text-slate-400`

**C) Fix meal type label contrast (line ~89):**

Before: `text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500`
After: `text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400`

**D) Fix CALO badge color (line ~135):**

Before: `bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300`
After: `bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400`

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/scheduleComponents.test.tsx --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Run ESLint on changed files**

Run: `npx eslint src/components/schedule/MealSlot.tsx --no-error-on-unmatched-pattern`
Expected: 0 errors, 0 warnings

- [ ] **Step 6: Commit**

```bash
git add src/components/schedule/MealSlot.tsx src/__tests__/scheduleComponents.test.tsx
git commit -m "fix(a11y): MealSlot touch targets, contrast, CALO badge [ID-04,A11Y-01,VD-01]

- Serving +/- buttons: w-5 h-5 (20px) → min-h-11 min-w-11 (44px)
- Empty state 'Chưa có món': text-slate-400 → text-slate-500
- CALO badge: bg-slate-100 (gray) → bg-emerald-50 (green) to match
  nutrition color system

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 2: Fix text-slate-400 Contrast + DishManager CALO Badge [A11Y-01, VD-01]

**Files:**
- Modify: `src/components/DishManager.tsx` (line 212 — contrast + CALO badge)
- Modify: `src/components/IngredientManager.tsx`
- Modify: `src/components/GroceryList.tsx`
- Modify: `src/components/AnalysisResultView.tsx`
- Modify: `src/components/settings/SettingsMenu.tsx` (line 144)
- Modify: `src/components/modals/DishEditModal.tsx`
- Modify: `src/components/modals/SaveAnalyzedDishModal.tsx`
- Modify: `src/components/modals/AISuggestionPreviewModal.tsx`
- Modify: `src/components/modals/TemplateManager.tsx`
- Modify: `src/components/modals/MealPlannerModal.tsx`
- Modify: `src/features/fitness/components/WorkoutHistory.tsx`
- Test: existing tests (className changes don't break functional tests)

**Does NOT modify:** `MealSlot.tsx` (handled by Task 1)

**Issue:** `text-slate-400` (#94A3B8) on white (#FFFFFF) = 3.5:1 contrast — fails WCAG AA (requires 4.5:1). Also DishManager CALO badge uses gray instead of emerald.

**Scope rule:** Only change `text-slate-400` when it styles **readable text** (labels, descriptions, counts, instructions). Do NOT change when it styles:
- Icon-only elements (decorative)
- Dark mode counterpart (`dark:text-slate-400` is fine since dark bg provides contrast)
- Disabled/placeholder states where low contrast is intentional

- [ ] **Step 1: Find all text-slate-400 instances used for visible label text**

Run a targeted search:
```bash
grep -rn 'text-slate-400' src/ --include='*.tsx' | grep -v 'dark:text-slate-400' | grep -v '__tests__' | grep -v 'node_modules' | head -60
```

Review each match. Focus on files where `text-slate-400` appears in a `<span>`, `<p>`, or text-containing element (not just icon wrappers).

- [ ] **Step 2: Fix DishManager.tsx — CALO label contrast + badge color**

**Line ~212 — CALO badge (contrast + color fix combined):**
```
Before: bg-slate-50 dark:bg-slate-700/50 ... text-[10px] text-slate-400 dark:text-slate-500 ... text-sm font-bold text-slate-700 dark:text-slate-300
After:  bg-emerald-50 dark:bg-emerald-900/30 ... text-[10px] text-emerald-600 dark:text-emerald-400 ... text-sm font-bold text-emerald-700 dark:text-emerald-300
```

Also fix any other `text-slate-400` visible labels in DishManager.tsx.

- [ ] **Step 3: Fix SettingsMenu.tsx — card summary text**

**Line ~144:**
```
Before: text-xs text-slate-500 dark:text-slate-400 truncate
After:  text-xs text-slate-600 dark:text-slate-400 truncate
```

Note: Settings summary text (like "BMR: 1618 • TDEE: 2508") is important enough to warrant `text-slate-600` for better readability.

- [ ] **Step 4: Batch fix remaining files**

Apply the same pattern to other files where `text-slate-400` is used for visible label text. Key targets:
- `src/components/IngredientManager.tsx`
- `src/components/GroceryList.tsx`
- `src/components/AnalysisResultView.tsx`
- `src/components/modals/DishEditModal.tsx`
- `src/components/modals/SaveAnalyzedDishModal.tsx`
- `src/components/modals/AISuggestionPreviewModal.tsx`
- `src/components/modals/TemplateManager.tsx`
- `src/components/modals/MealPlannerModal.tsx`
- `src/features/fitness/components/WorkoutHistory.tsx`

For each file: `text-slate-400` (visible labels) → `text-slate-500`

- [ ] **Step 5: Run ESLint on all changed files**

Run: `npx eslint src/components/DishManager.tsx src/components/IngredientManager.tsx src/components/GroceryList.tsx src/components/settings/SettingsMenu.tsx src/components/modals/ src/features/fitness/components/WorkoutHistory.tsx --no-error-on-unmatched-pattern`
Expected: 0 new errors

- [ ] **Step 6: Run full test suite**

Run: `npx vitest run --reporter=verbose`
Expected: All tests pass (className changes shouldn't break functionality tests)

- [ ] **Step 7: Commit**

```bash
git add src/components/DishManager.tsx src/components/IngredientManager.tsx src/components/GroceryList.tsx src/components/AnalysisResultView.tsx src/components/settings/SettingsMenu.tsx src/components/modals/ src/features/fitness/components/WorkoutHistory.tsx
git commit -m "fix(a11y): improve text contrast + CALO badge color across app [A11Y-01,VD-01]

- text-slate-400 visible labels → text-slate-500 (3.5:1 → 4.6:1)
- Settings summary text → text-slate-600 (6.7:1)
- DishManager CALO badge: bg-slate-50 → bg-emerald-50

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Phase 2: Layout Improvements (PARALLEL — no dependencies between tasks)

### Task 3: Add Visible Labels to Mobile Bottom Tab Bar [LA-01]

**Files:**
- Modify: `src/components/navigation/AppNavigation.tsx:28-59`
- Test: `src/__tests__/navigationIndex.test.ts` (existing — add assertion)

**Issue:** Bottom tab bar shows icons-only on mobile. Users can't identify the Dashboard (grid icon) tab without labels.

- [ ] **Step 1: Add visible label assertion to existing test**

In `src/__tests__/navigationIndex.test.ts`, add:

```tsx
import { render, screen } from '@testing-library/react';
// ... existing imports

it('mobile tab bar renders visible text labels', () => {
  render(<BottomNavBar activeTab="calendar" onTabChange={vi.fn()} />);
  const calendarTab = screen.getByTestId('nav-calendar');
  // Label should be visible text content, not just aria-label
  expect(calendarTab.textContent).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/navigationIndex.test.ts --reporter=verbose`
Expected: FAIL — buttons currently have no text content (icons render as SVG which has no textContent)

- [ ] **Step 3: Add visible labels below icons**

In `src/components/navigation/AppNavigation.tsx`, inside the mobile `<button>` (after the icon `<div>`), add a visible label:

**Before (around line 44-51):**
```tsx
<div className="relative">
  {mobileIcon}
  {tab === 'ai-analysis' && showAIBadge && (
    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />
  )}
</div>
{activeTab === tab && <div className="absolute -bottom-0.5 w-5 h-0.5 bg-emerald-500 rounded-full" />}
```

**After:**
```tsx
<div className="relative">
  {mobileIcon}
  {tab === 'ai-analysis' && showAIBadge && (
    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />
  )}
</div>
<span className="text-[10px] font-medium mt-0.5 leading-tight truncate max-w-[60px]">{label}</span>
{activeTab === tab && <div className="absolute -bottom-0.5 w-5 h-0.5 bg-emerald-500 rounded-full" />}
```

Also reduce button horizontal padding since labels provide discoverability: change `px-4` to `px-1` on the button className to prevent horizontal overflow with 5 tabs.

And reduce icon size from `w-6 h-6` to `w-5 h-5` in the `NAV_CONFIG` array to make room for labels.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/navigationIndex.test.ts --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Run ESLint**

Run: `npx eslint src/components/navigation/AppNavigation.tsx`
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add src/components/navigation/AppNavigation.tsx src/__tests__/navigationIndex.test.ts
git commit -m "feat(nav): add visible text labels to mobile bottom tab bar [LA-01]

Bottom tab bar previously showed icons-only on mobile, making the
Dashboard tab (grid icon) ambiguous. Added 10px truncated labels
below each icon for better discoverability.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 4: Remove Duplicate Settings Heading [LA-02]

**Files:**
- Modify: `src/components/settings/SettingsMenu.tsx:104-110`
- Test: `src/__tests__/settingsTab.test.tsx` (existing — line 81 asserts `getByText('Cài đặt')`)

**Issue:** Settings page shows "← Cài đặt" in the nav bar AND "⚙ Cài đặt" as a page heading. The page heading wastes ~60px of vertical space.

- [ ] **Step 1: Examine the current structure**

Read `src/components/settings/SettingsMenu.tsx` lines 100-115 to understand the heading structure. The parent `SettingsTab.tsx` already renders a back button with "Cài đặt" title.

- [ ] **Step 2: Remove the duplicate heading block**

In `SettingsMenu.tsx`, remove the heading section (lines ~106-110):

**Before:**
```tsx
<div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
  <SlidersHorizontal className="w-6 h-6 text-emerald-500" />
  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('settings.title')}</h2>
</div>
```

**After:** Remove this entire `<div>` block. The parent already provides the heading.

- [ ] **Step 3: Update the settings test**

In `src/__tests__/settingsTab.test.tsx`, line 81 asserts `expect(screen.getByText('Cài đặt')).toBeInTheDocument()`. After removing the duplicate heading, the text "Cài đặt" still exists in the parent's nav bar, so this test should still pass. **If the test uses `getAllByText` and checks count, update accordingly.**

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/__tests__/settingsTab.test.tsx --reporter=verbose`
Expected: PASS

- [ ] **Step 5: Run ESLint**

Run: `npx eslint src/components/settings/SettingsMenu.tsx`
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add src/components/settings/SettingsMenu.tsx src/__tests__/settingsTab.test.tsx
git commit -m "fix(settings): remove duplicate heading, save 60px vertical space [LA-02]

Settings page showed 'Cài đặt' twice — once in the nav bar from
SettingsTab parent and again as an inline heading in SettingsMenu.
Removed the redundant inline heading.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Phase 3: Visual Polish (PARALLEL — no dependencies between tasks)

### Task 5: Add Subtle Tab Switch Animation [CP-03]

**Files:**
- Modify: `src/App.tsx` (tab panel rendering)

**Issue:** Tab content switches instantly with no animation. A subtle 150ms fadeIn improves perceived smoothness.

**Note:** `animate-fade-in` class is already defined in `src/styles/animations.css` (line 40) with `prefers-reduced-motion` handling (line 77). No new CSS needed.

- [ ] **Step 1: Locate tab panel rendering in App.tsx**

Find the section where tab panels are rendered (around line 301+, where `role="tabpanel"` is used).

- [ ] **Step 2: Add animate-fade-in class with key**

Add `animate-fade-in` to the tab panel wrapper and use `key={activeTab}` to force React remount on tab switch:

**Before:**
```tsx
<div role="tabpanel" aria-label={...}>
  {/* tab content */}
</div>
```

**After:**
```tsx
<div role="tabpanel" aria-label={...} key={activeTab} className="animate-fade-in">
  {/* tab content */}
</div>
```

- [ ] **Step 3: Run ESLint and tests**

Run: `npx eslint src/App.tsx && npx vitest run --reporter=verbose`
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat(polish): add subtle fadeIn animation on tab switch [CP-03]

Tab content previously switched instantly. Added 150ms fadeIn
animation using existing animation system from src/styles/animations.css.
Respects prefers-reduced-motion. Uses key={activeTab} to trigger on switch.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Phase 4: Verification (SEQUENTIAL — depends on all previous phases)

### Task 6: ESLint + Build + Full Test Suite

**Files:** None (verification only)

- [ ] **Step 1: Run ESLint on entire project**

Run: `npx eslint src/ --ext .ts,.tsx --no-error-on-unmatched-pattern`
Expected: 0 errors, 0 new warnings

- [ ] **Step 2: Run Vite production build**

Run: `npx vite build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Run full test suite with coverage**

Run: `npx vitest run --coverage --reporter=verbose`
Expected: All tests pass, coverage >= previous baseline

- [ ] **Step 4: If any failures, fix them before proceeding**

If ESLint reports errors: fix the violations (do NOT use eslint-disable).
If build fails: fix TypeScript/import errors.
If tests fail: investigate and fix — likely className assertions need updating.

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve lint/build/test issues from UIX fixes

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 7: Chrome DevTools Manual Verification

**Files:** None (manual testing only)

**Prerequisites:** App running on localhost:3000

- [ ] **Step 1: Start dev server**

Run: `npm run dev` (if not already running on port 3000)

- [ ] **Step 2: Verify serving buttons (Task 1)**

Navigate to Calendar tab → Add a dish to any meal slot → Verify the +/- serving buttons are visibly larger with hover background. Check Chrome DevTools Elements panel: buttons should have `min-h-11 min-w-11` classes.

- [ ] **Step 3: Verify text contrast (Tasks 1+2)**

Navigate to Calendar tab → Check "Chưa có món" text is noticeably darker. Navigate to Settings → Check card summary text ("BMR: 1618 • TDEE: 2508") is readable.

- [ ] **Step 4: Verify tab bar labels (Task 3)**

Check the bottom tab bar shows text labels ("Lịch trình", "Thư viện", "AI Phân tích", "Tập luyện", "Tổng quan") below each icon.

- [ ] **Step 5: Verify Settings heading (Task 4)**

Navigate to Settings → Verify only one "Cài đặt" heading appears (in the nav bar, not duplicated inline).

- [ ] **Step 6: Verify CALO badge color (Tasks 1+2)**

Navigate to Library → Check dish cards → CALO badge should have green/emerald background (not gray). Navigate to Calendar → Add dish → Verify CALO badge in meal slot is also emerald.

- [ ] **Step 7: Verify tab animation (Task 5)**

Switch between tabs → Verify subtle fadeIn animation on content change.

- [ ] **Step 8: Check DevTools Console for errors**

Open Chrome DevTools Console tab → Verify NO JavaScript errors or React warnings after navigating through all tabs and features.

---

## Dependency Graph

```
Phase 1 (Critical A11Y): [Task 1] [Task 2]  ← PARALLEL, no shared files
Phase 2 (Layout):         [Task 3] [Task 4]  ← PARALLEL, no shared files
Phase 3 (Polish):         [Task 5]            ← Single task (App.tsx only)
Phase 4 (Verification):   [Task 6] → [Task 7] ← SEQUENTIAL, after all above
```

**Execution order:**
1. Tasks 1-2 can run in parallel (Task 1 touches MealSlot, Task 2 touches DishManager + others — no overlap)
2. Tasks 3-4 can run in parallel (Task 3 touches AppNavigation, Task 4 touches SettingsMenu — no overlap)
3. Task 5 modifies only App.tsx (independent)
4. **Phases 1-3 are all independent and could run simultaneously** if agents are available
5. Task 6 (verification) must wait for all implementation tasks
6. Task 7 (manual test) must wait for Task 6

**Note:** The original Task 5 (CALO badge) from v1 plan has been **merged into Task 1 (MealSlot) and Task 2 (DishManager)** to prevent file conflicts when running in parallel.

---

## Out of Scope (Tracked for Future)

These items from the evaluation are intentionally NOT in this plan:
- **[ID-01] Calendar empty state enhancement** — requires design decision on illustration + new component
- **[ID-06] Pull-to-refresh** — requires new gesture handler, separate plan
- **[LA-06] Dish card height reduction** — requires design decision on swipe-to-reveal or context menu
- **[VD-02] Dish checkbox purpose** — needs product decision on batch selection feature
- **[CP-01] Dark mode verification** — separate testing task
- **[LA-03] Calendar action button row** — requires design decision on FAB menu vs overflow
