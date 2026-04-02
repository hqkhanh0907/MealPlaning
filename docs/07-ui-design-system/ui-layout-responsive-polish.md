# Layout, Responsive & Polish Audit

> **Project**: MealPlaning — React 19 + Tailwind CSS v4 + shadcn/ui + Capacitor 8
> **Date**: Auto-generated audit
> **Scope**: All `.tsx` files in `src/`
> **Mode**: Analysis only — no code was modified

---

## Layout Patterns Found

### Page Layout

**Root Container** (`src/App.tsx`):

```
min-h-dvh bg-slate-50 dark:bg-slate-950
```

- Uses `min-h-dvh` (dynamic viewport height) — correct for mobile ✅
- Background: `bg-slate-50` light / `bg-slate-950` dark

**Header** (`src/App.tsx`):

```
pt-safe sticky top-0 z-20 border-b border-slate-200
  └─ mx-auto max-w-5xl flex items-center justify-between px-4 py-2 sm:px-6 sm:py-4
```

- `pt-safe` handles status bar / notch inset ✅
- Sticky with `z-20` ✅
- Responsive padding: `px-4 py-2` → `sm:px-6 sm:py-4` ✅

**Main Content Area** (`src/App.tsx`):

```
mx-auto max-w-5xl px-4 py-6 pb-28 sm:px-6 sm:py-8 sm:pb-8
```

- `pb-28` (7rem) on mobile accounts for bottom navigation height ✅
- `sm:pb-8` on desktop where bottom nav is hidden ✅
- `max-w-5xl` constrains width for large screens ✅

**Bottom Navigation** (`src/components/navigation/AppNavigation.tsx`):

```
fixed inset-x-0 bottom-0 z-30 border-t sm:hidden
  └─ flex items-center justify-around px-2 py-1
  └─ buttons: min-h-12 flex-col items-center justify-center rounded-xl px-1 py-2.5
  └─ <div className="pb-safe" />   // bottom safe area spacer
```

- `min-h-12` (48px) meets touch target ✅
- `sm:hidden` hides on desktop ✅
- `pb-safe` spacer for home indicator ✅
- `z-30` below modals ✅

**Desktop Navigation** (`src/components/navigation/AppNavigation.tsx:93-111`):

```
hidden sm:flex rounded-xl bg-slate-100 p-1
  └─ buttons: px-4 py-2 gap-2 rounded-lg
```

- Pill-tab style, only visible ≥640px ✅

**Full-Screen Page Stack** (`src/App.tsx:134-148`):

```
pt-safe fixed inset-0 z-50 overflow-y-auto bg-slate-50 dark:bg-slate-950
```

- Covers entire viewport including safe areas ✅
- `z-50` above bottom nav (z-30) and settings (z-40) ✅

**Settings Overlay** (`src/App.tsx`):

```
fixed inset-0 z-40 overflow-y-auto bg-slate-50
  └─ pt-safe sticky top-0 z-10 border-b
```

**Safe Area CSS** (`src/index.css:9-11, 86-92`):

```css
:root {
  --sat: env(safe-area-inset-top, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
}
.pt-safe {
  padding-top: var(--sat);
}
.pb-safe {
  padding-bottom: var(--sab);
}
```

**Z-Index Scale** (documented from grep):
| Value | Usage |
|-------|-------|
| `z-10` | Relative positioning inside cards |
| `z-20` | Sticky header |
| `z-30` | Bottom navigation |
| `z-40` | Settings overlay, floating buttons |
| `z-50` | Page stack overlays, context menus |
| `z-[60]` | Fitness modals (RestTimer, PlanScheduleEditor) |
| `z-80` | GoalSettingsModal (via ModalBackdrop) |
| `z-[80]` | Toast notifications |

---

### Card Layout

**shadcn/ui Card** (`src/components/ui/card.tsx`):

```
Card: flex flex-col gap-4 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10
  └─ CardHeader: grid auto-rows-min items-start gap-1 px-4
  └─ CardContent: px-4
  └─ CardFooter: border-t p-4 bg-muted/50 rounded-b-xl
```

Size variants: `default` (gap-4 py-4 px-4) | `sm` (gap-3 py-3 px-3)

**Custom Card Patterns** (non-shadcn — majority of the app):

| Component                | Styling                                                      | Notes                      |
| ------------------------ | ------------------------------------------------------------ | -------------------------- |
| `TodaysPlanCard.tsx`     | `bg-white rounded-2xl shadow-md border border-slate-100 p-4` | Custom, not shadcn Card    |
| `AnalysisResultView.tsx` | `rounded-xl border border-slate-100 bg-white p-4 shadow-sm`  | Grid of 2-col macro cards  |
| `GoalSettingsModal.tsx`  | `border-2 p-3 rounded-xl`                                    | Button-cards in 2-col grid |
| `ProgressDashboard.tsx`  | `min-w-[140px] rounded-xl bg-white p-4 shadow-sm`            | Horizontal scroll cards    |
| `GroceryList.tsx`        | `border border-slate-100 bg-white shadow-sm`                 | List item cards            |

**Card Grid Patterns**:

- `grid grid-cols-2 gap-4` — Macro summary cards (AnalysisResultView)
- `grid grid-cols-2 gap-2` — Goal presets (GoalSettingsModal)
- `grid grid-cols-2 gap-3` — Dashboard metrics (DashboardTab)
- `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3` — Dish/Ingredient lists ✅ responsive

---

### Form Layout

**Standard Form Pattern** (IngredientEditModal, GoalSettingsModal, DishEditModal):

```
Container: space-y-6 overflow-y-auto p-6
  └─ Label: mb-2 block text-sm font-bold
  └─ Input: w-full (always full-width)
  └─ Error: mt-1 text-xs text-red-500
  └─ Footer: flex shrink-0 justify-end gap-3 border-t bg-slate-50 p-4 sm:p-6
```

**Input Width**: Always `w-full` inside modals ✅
**Label Position**: Always above input with `mb-2` gap ✅
**Error Position**: Below input with `mt-1` ✅
**Button Placement**: Right-aligned via `justify-end` in footer ✅

**Numeric Input with Unit Suffix** (GoalSettingsModal):

```
relative container
  └─ Input: pr-12 pl-4  (right padding for unit overlay)
  └─ Unit: absolute top-1/2 right-4 -translate-y-1/2
```

**Multi-Step Forms**: Use React Hook Form + Zod with step-based field validation.

**Quick Select Chips**: `flex flex-wrap gap-2` with ChipSelect component using `min-h-[44px] min-w-[44px]` ✅

---

## Responsive Issues

### ✅ FIXED: `grid-cols-4` without mobile breakpoint

- **Files**: `src/components/AnalysisResultView.tsx:120`
- **Was**: `grid grid-cols-4 gap-2` → **Now**: `grid grid-cols-2 gap-2 sm:grid-cols-4`
- **Status**: Fixed — stacks to 2 columns on mobile

### ✅ FIXED: `grid-cols-3` without responsive fallback (5 locations)

| File                          | Line | Was                 | Now                                | Status        |
| ----------------------------- | ---- | ------------------- | ---------------------------------- | ------------- |
| `GoalPhaseSelector.tsx`       | 229  | `grid-cols-3 gap-3` | `grid-cols-1 sm:grid-cols-3 gap-3` | ✅ Fixed      |
| `GoalPhaseSelector.tsx`       | 257  | `grid-cols-3 gap-2` | `grid-cols-1 sm:grid-cols-3 gap-2` | ✅ Fixed      |
| `HealthProfileForm.tsx`       | 396  | `grid-cols-3 gap-2` | `grid-cols-2 sm:grid-cols-3 gap-2` | ✅ Fixed      |
| `HealthProfileDetailPage.tsx` | 108  | `grid-cols-3 gap-2` | `grid-cols-2 sm:grid-cols-3 gap-2` | ✅ Fixed      |
| `PlanPreviewScreen.tsx`       | 52   | `grid-cols-3 gap-3` | `grid-cols-2 sm:grid-cols-3 gap-3` | ✅ Fixed      |
| `CalendarTab.tsx`             | 189  | `grid-cols-3 gap-8` | Unchanged — inside desktop dialog  | ⚠️ Acceptable |

**Note**: `Summary.tsx:124` (`grid-cols-3`) and `QuickAddIngredientForm.tsx:230` (`grid-cols-3 sm:grid-cols-5`) are already handled or contextually acceptable.

### ✅ FIXED: `max-h-[*vh]` instead of `dvh` (5 files)

| File                        | Was            | Now             | Status   |
| --------------------------- | -------------- | --------------- | -------- |
| `DetailModal.tsx:21`        | `max-h-[90vh]` | `max-h-[90dvh]` | ✅ Fixed |
| `CalendarTab.tsx:228`       | `max-h-[90vh]` | `max-h-[90dvh]` | ✅ Fixed |
| `ExerciseSelector.tsx:156`  | `max-h-[85vh]` | `max-h-[85dvh]` | ✅ Fixed |
| `SwapExerciseSheet.tsx:100` | `max-h-[85vh]` | `max-h-[85dvh]` | ✅ Fixed |
| `DishManager.tsx:749`       | `max-h-[80vh]` | `max-h-[80dvh]` | ✅ Fixed |

### ✅ FIXED: `min-h-screen` instead of `min-h-dvh` (1 file)

- `PlanScheduleEditor.tsx:147,182` — `min-h-screen` → `min-h-dvh`

### ✅ FIXED: `z-9999` toast z-index (1 file)

- `NotificationContext.tsx:241` — `z-9999` → `z-[80]` (per z-index scale)

### ✅ FIXED: `rounded-3xl` → `rounded-2xl` (25 files)

All 27 instances of banned `rounded-3xl` normalized to `rounded-2xl` per design system rules.

### MEDIUM: Fixed `min-w-[200px]` on narrow containers

- **Files**: `src/components/Summary.tsx:59,93`
- **Current**: `min-w-[200px] flex-1 space-y-2` on macro progress sections
- **Fix**: Remove `min-w-[200px]` or use `min-w-0` with `flex-1` to allow natural shrinking
- **Impact**: Forces horizontal scroll on screens <400px when two sections are side-by-side

### MEDIUM: Fixed `min-w-[100px]` on QuickActions buttons

- **Files**: `src/features/dashboard/components/QuickActionsBar.tsx:39,56`
- **Current**: `min-w-[100px]` on action buttons
- **Fix**: Use `flex-1 min-w-0` or `min-w-[80px]` for tighter screens
- **Impact**: 5 buttons × 100px = 500px minimum; overflows on 320px screens

### MEDIUM: Fixed `min-w-[140px]` on horizontal scroll cards

- **Files**: `src/features/fitness/components/ProgressDashboard.tsx:339,366,380,392`
- **Current**: `min-w-[140px]` on scroll cards
- **Fix**: Acceptable for horizontal scroll containers, but `min-w-[120px]` would show more cards
- **Impact**: Minor — horizontal scroll is intentional design

### MEDIUM: Fixed menu widths

| File                                                       | Current         | Fix                                      |
| ---------------------------------------------------------- | --------------- | ---------------------------------------- |
| `src/features/fitness/components/TrainingPlanView.tsx:472` | `min-w-[180px]` | `min-w-[160px] max-w-[calc(100vw-2rem)]` |
| `src/components/schedule/MealActionBar.tsx:142`            | `min-w-[200px]` | `min-w-[180px] max-w-[calc(100vw-2rem)]` |

### LOW: Navigation label truncation

- **Files**: `src/components/navigation/AppNavigation.tsx`
- **Current**: `max-w-[60px] truncate text-[10px]` for tab labels
- **Fix**: Consider `max-w-[72px] text-[11px]` or dynamic label hiding for long translations

---

## Responsive: Font Size Concern

### WIDESPREAD: `text-[10px]` usage (52+ instances across 19 files)

| File                                                      | Count | Context                                  |
| --------------------------------------------------------- | ----- | ---------------------------------------- |
| `src/components/IngredientManager.tsx`                    | 9     | Macro info labels                        |
| `src/components/DishManager.tsx`                          | 8     | Macro info labels, ingredient counts     |
| `src/components/modals/SaveAnalyzedDishModal.tsx`         | 5     | Macro labels                             |
| `src/components/AnalysisResultView.tsx`                   | 4     | Macro category labels (Cal/Pro/Carb/Fat) |
| `src/components/onboarding/PlanPreviewScreen.tsx`         | 4     | Preview details                          |
| `src/components/schedule/MealSlot.tsx`                    | 3     | Meal type labels, macro badges           |
| `src/components/nutrition/EnergyBalanceMini.tsx`          | 3     | Energy balance labels                    |
| `src/components/GroceryList.tsx`                          | 2     | Category counts                          |
| `src/components/schedule/MiniNutritionBar.tsx`            | 2     | Nutrition labels                         |
| `src/features/dashboard/components/QuickActionsBar.tsx`   | 2     | Button labels                            |
| `src/features/dashboard/components/AdjustmentHistory.tsx` | 2     | Date/type badges                         |
| `src/components/modals/DishEditModal.tsx`                 | 2     | Macro labels                             |
| `src/components/navigation/AppNavigation.tsx`             | 1     | Nav label — barely readable              |
| `src/components/DateSelector.tsx`                         | 1     | Weekday labels                           |
| `src/components/nutrition/EnergyBalanceCard.tsx`          | 1     | Label                                    |
| `src/features/dashboard/components/ProteinProgress.tsx`   | 1     | Suggestion text                          |
| `src/components/modals/GoalSettingsModal.tsx`             | 1     | Helper text                              |
| `src/components/modals/SaveTemplateModal.tsx`             | 1     | Template hint                            |
| `src/components/modals/TemplateManager.tsx`               | 1     | Template info                            |

**Recommendation**: 10px is below WCAG AA readability threshold (12px minimum recommended for body text). Reserve `text-[10px]` strictly for decorative badges. Use `text-xs` (12px) as minimum for informational labels.

---

## Polish Issues (micro-details)

### Icon Sizing Inconsistency

| File                                                      | Sizes Found           | Issue                                                                        |
| --------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------- |
| `src/features/dashboard/components/AdjustmentHistory.tsx` | `h-3.5`, `h-4`, `h-6` | Check/X icons h-3.5, ChevronDown h-4, badge bg h-6 — mixed in same component |
| `src/features/fitness/components/WorkoutHistory.tsx`      | `h-3`, `h-4`          | Clock/StickyNote h-3 but ChevronUp/Down h-4 in same collapsible              |
| `src/features/fitness/components/MilestonesList.tsx`      | `h-3.5`, `h-5`        | CheckCircle h-3.5 but ChevronDown h-5                                        |
| `src/features/dashboard/components/AiInsightCard.tsx`     | `h-3`, `h-5`          | Main icon h-5, ChevronRight h-3 (should be h-4)                              |
| `src/contexts/NotificationContext.tsx`                    | `h-4`, `h-5`          | Close button icon h-4, notification icon h-5                                 |

**Recommended Standard**:

- Hero/section icons: `h-6 w-6`
- List item / button icons: `h-5 w-5`
- Inline secondary icons: `h-4 w-4`
- Badge/indicator icons: `h-3 w-3`

---

### Spacing Inconsistency

**Card padding varies across same-level dashboard components**:
| Component | Padding | Expected |
|-----------|---------|----------|
| `StreakMini.tsx` | `p-3` | — |
| `WeightMini.tsx` | `p-3` | — |
| `AiInsightCard.tsx` | `p-3` | — |
| `AutoAdjustBanner.tsx` | `p-4` | Should be `p-3` for consistency |
| `TodaysPlanCard.tsx` | `p-4` | Should be `p-3` or all cards should be `p-4` |

**Grid gap varies for similar list contexts**:
| Component | Gap | Context |
|-----------|-----|---------|
| `DashboardTab.tsx:73` | `gap-3` | Main section container |
| `DashboardTab.tsx:101` | `gap-3` | Weight/Streak grid |
| `TodaysPlanCard.tsx:153,202,242,288` | `gap-4` | Meal summary grids |
| `ExerciseSelector.tsx` chip grid | `gap-2` | Muscle group chips |

**Fix**: Standardize card padding to `p-4` (section cards) or `p-3` (compact cards). Standardize list gaps to `gap-3` (standard) or `gap-2` (compact).

---

### Border & Shadow Inconsistency

| Component                                | Border                    | Shadow      | Issue                             |
| ---------------------------------------- | ------------------------- | ----------- | --------------------------------- |
| Dashboard cards (StreakMini, WeightMini) | `border border-slate-100` | `shadow-sm` | Standard ✅                       |
| `TodaysPlanCard.tsx`                     | `border border-slate-100` | `shadow-md` | Shadow-md instead of shadow-sm ❌ |
| `SetEditor.tsx` dialog                   | None                      | `shadow-xl` | Missing border on modal ❌        |
| `AdjustmentHistory.tsx` header           | `border border-slate-200` | None        | Missing shadow ❌                 |

**Fix**: Standardize cards to `border border-slate-200 dark:border-slate-700 shadow-sm`. Modals use `shadow-xl` + border.

---

### Missing Loading States

| File                                                    | Data Source         | Loading UI | Issue                                                       |
| ------------------------------------------------------- | ------------------- | ---------- | ----------------------------------------------------------- |
| `src/components/GroceryList.tsx`                        | Computed from store | ❌ None    | Grocery calculation has no skeleton during recompute        |
| `src/features/fitness/components/WorkoutHistory.tsx`    | Store filter        | ❌ None    | Filtered workout list shows no placeholder during recompute |
| `src/features/fitness/components/ProgressDashboard.tsx` | Computed metrics    | ❌ None    | Chart/metrics have no skeleton during computation           |

**Components WITH proper loading states** (good examples to follow):

- `PlanTemplateGallery.tsx` — uses `LoadingSkeleton` component ✅
- `AIImageAnalyzer.tsx` — uses `Loader2` with `animate-spin` ✅

---

### Missing Empty States

| File                                                       | Map Operation    | Empty Check                                      | Issue               |
| ---------------------------------------------------------- | ---------------- | ------------------------------------------------ | ------------------- |
| `src/features/fitness/components/ExerciseSelector.tsx:216` | `.map(exercise)` | ✅ Has `filteredExercises.length === 0` check    | Actually handled ✅ |
| `src/features/fitness/components/WorkoutHistory.tsx`       | Filtered list    | ✅ Has `workouts.length === 0` check at line 196 | Handled ✅          |
| `src/components/GroceryList.tsx:440`                       | groceryItems     | ✅ Has `groceryItems.length === 0` check         | Handled ✅          |

**After thorough review**: Most list components DO have empty state handling. The app is well-covered. Minor gap: `WorkoutHistory` filtered results (after category filter applied) could show "no results for this filter" instead of just an empty list area.

---

### Abrupt Show/Hide (Missing Transitions)

| File                                                     | Element                  | Current                                           | Fix                               |
| -------------------------------------------------------- | ------------------------ | ------------------------------------------------- | --------------------------------- |
| `src/components/GroceryList.tsx:344`                     | Checked items section    | `{hasDishes && (` — instant mount                 | Add `transition-all duration-200` |
| `src/components/GroceryList.tsx:356`                     | Expanded grocery content | `{isExpanded && hasDishes &&`                     | Add slide-down animation          |
| `src/components/GroceryList.tsx:452`                     | Checked count info       | `{checkedCount > 0 && (` — pops in                | Add `animate-fade-in`             |
| `src/components/GroceryList.tsx:532`                     | "All bought" message     | Appears instantly                                 | Add fade-in transition            |
| `src/features/fitness/components/SetEditor.tsx:120`      | Dialog                   | `if (!isVisible) return null` — no exit animation | Wrap in transition                |
| `src/features/fitness/components/PlanDayEditor.tsx:~465` | SwapExerciseSheet        | Sheet appears instantly                           | Add slide-up animation            |

**Components WITH proper transitions** (good examples):

- `NotificationContext.tsx` — `transition-all duration-300 ease-out` ✅
- `AppNavigation.tsx` — `transition-colors` on buttons ✅

---

### Button Visual Weight Inconsistency

**Custom `bg-emerald-500` buttons instead of shadcn Button component**:

| File                                                      | Line     | Usage              | Issue                                       |
| --------------------------------------------------------- | -------- | ------------------ | ------------------------------------------- |
| `src/components/ErrorBoundary.tsx`                        | 58       | Retry button       | Uses `bg-emerald-500` instead of `<Button>` |
| `src/components/onboarding/WelcomeSlides.tsx`             | 88       | Next/Start button  | Custom emerald styling                      |
| `src/components/AIImageAnalyzer.tsx`                      | 101+     | Analyze button     | Custom `bg-emerald-500`                     |
| `src/features/fitness/components/PlanTemplateGallery.tsx` | 245      | Retry button       | Custom `bg-emerald-500`                     |
| `src/features/dashboard/components/WeightQuickLog.tsx`    | 137      | Log weight button  | Custom `bg-emerald-500`                     |
| `src/components/form/ChipSelect.tsx`                      | 62       | Selected chip      | Custom emerald styling                      |
| `src/features/fitness/components/CardioLogger.tsx`        | multiple | Save/Start buttons | Custom emerald styling                      |

**Fix**: Replace custom `bg-emerald-500` with `<Button variant="default">` for consistency and automatic dark mode support.

---

### Color Palette Inconsistency

| Pattern                              | Files                                                                 | Issue                                                                     |
| ------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `text-zinc-*`                        | `StreakCounter.tsx` (5 instances), `MilestonesList.tsx` (4 instances) | Uses zinc instead of project-standard slate                               |
| `text-slate-400` vs `text-slate-500` | Multiple components                                                   | Inconsistent secondary text shade                                         |
| `text-muted-foreground`              | Only in `src/components/ui/`                                          | Feature components use `text-slate-*` directly instead of semantic tokens |
| `border-gray-200`                    | `QuickActionsBar.tsx:56`                                              | Single instance of gray (rest of app uses slate)                          |

**Fix**: Replace all `text-zinc-*` with `text-slate-*`. Replace `border-gray-200` with `border-slate-200`. Consider migrating to `text-muted-foreground` for semantic theming.

---

### Touch Target Concerns

| File                   | Element                     | Size    | Status                             |
| ---------------------- | --------------------------- | ------- | ---------------------------------- |
| Bottom nav buttons     | `min-h-12` (48px)           | ✅ Pass |                                    |
| Fitness action buttons | `min-h-[44px] min-w-[44px]` | ✅ Pass | Consistently applied               |
| Session tab buttons    | `min-h-[44px] min-w-[44px]` | ✅ Pass |                                    |
| ChipSelect options     | `min-h-[44px] min-w-[44px]` | ✅ Pass |                                    |
| MealSlot add button    | `min-h-11 min-w-11` (44px)  | ✅ Pass |                                    |
| `ui/badge.tsx`         | `h-5` (20px)                | ⚠️      | Non-interactive display badge — OK |
| Nav label text         | `text-[10px]`               | ⚠️      | Readable but borderline            |

**Overall**: Touch targets are well-implemented across the app. ✅

---

## Recommendations Summary

### 🔴 Priority 1 — Critical (Layout Breaking)

1. **`AnalysisResultView.tsx:120`** — Change `grid-cols-4` → `grid-cols-2 sm:grid-cols-4`. Macro cards overflow on mobile.

2. **6 × `grid-cols-3` without responsive fallback** — Add `grid-cols-1 sm:grid-cols-3` or `grid-cols-2 sm:grid-cols-3` to:
   - `GoalPhaseSelector.tsx:229,257`
   - `HealthProfileForm.tsx:396`
   - `HealthProfileDetailPage.tsx:108`
   - `PlanPreviewScreen.tsx:52`

3. **`DetailModal.tsx:21` and `CalendarTab.tsx:228`** — Change `max-h-[90vh]` → `max-h-[90dvh]` to fix mobile address bar overlap.

### 🟠 Priority 2 — High (UX Degradation)

4. **52+ instances of `text-[10px]`** — Audit each and upgrade to `text-xs` (12px) where the text is informational (not decorative). Highest impact files: `AnalysisResultView.tsx`, `AppNavigation.tsx`, `MealSlot.tsx`.

5. **`Summary.tsx:59,93`** — Remove `min-w-[200px]` to prevent horizontal overflow on small screens.

6. **6 missing transitions in `GroceryList.tsx`** — Add `transition-all duration-200` or `animate-fade-in` to conditional sections.

7. **`SetEditor.tsx`** — Add entry/exit animation to dialog (currently instant mount/unmount).

### 🟡 Priority 3 — Medium (Consistency)

8. **Replace `text-zinc-*` with `text-slate-*`** in `StreakCounter.tsx` (5) and `MilestonesList.tsx` (4). Replace `border-gray-200` in `QuickActionsBar.tsx`.

9. **Standardize card padding**: Choose either `p-3` or `p-4` for dashboard-level cards. Currently mixed between `AutoAdjustBanner` (p-4) and `StreakMini`/`WeightMini` (p-3).

10. **Standardize button styling**: Replace 7+ custom `bg-emerald-500` buttons with `<Button variant="default">` component for consistent theming.

11. **Standardize icon sizes**: Apply consistent sizing rules (h-4 inline, h-5 list, h-6 hero) across `AdjustmentHistory`, `WorkoutHistory`, `MilestonesList`, `AiInsightCard`.

### 🟢 Priority 4 — Low (Polish)

12. **Add loading skeletons** to `GroceryList.tsx` and `WorkoutHistory.tsx` for computed/filtered data.

13. **Fixed menu widths** (`TrainingPlanView:472` min-w-[180px], `MealActionBar:142` min-w-[200px]) — Add `max-w-[calc(100vw-2rem)]` safety.

14. **Shadow consistency** — Standardize cards to `shadow-sm`, modals to `shadow-xl`. Fix `TodaysPlanCard` using `shadow-md`.

15. **Document z-index scale** — The current scale (z-10 → z-9999) works but should be documented in a design tokens file or CSS comment.

---

## Appendix: Verified Safe Area Coverage

| Component                      | `pt-safe` | `pb-safe` | Status  |
| ------------------------------ | --------- | --------- | ------- |
| `App.tsx` header               | ✅        | —         | Correct |
| `AppNavigation.tsx` bottom nav | —         | ✅        | Correct |
| `PlanDayEditor.tsx`            | ✅        | ✅        | Correct |
| `WorkoutLogger.tsx`            | ✅        | ✅        | Correct |
| `CardioLogger.tsx`             | ✅        | ✅        | Correct |
| `NotificationContext.tsx`      | ✅ (env)  | —         | Correct |
| Settings overlay               | ✅        | —         | Correct |
| Page stack overlay             | ✅        | —         | Correct |

**Verdict**: Safe area handling is comprehensive and consistent across the app. ✅
