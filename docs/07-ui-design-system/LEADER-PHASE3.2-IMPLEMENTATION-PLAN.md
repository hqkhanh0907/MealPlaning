# LEADER — Phase 3.2: Calendar + Meals — Implementation Plan

> **Status**: KẾ*HOẠCH_KỸ_THUẬT*ĐÃ_CHỐT
> **Author**: Tech Leader Agent
> **Date**: 2026-07-22
> **Upstream**:
>
> - CEO-PHASE3.2-CALENDAR-ANALYSIS.md (11 REQs, 9 risks)
> - BM-PHASE3.2-BUSINESS-RULES.md (16 User Stories, 24 Business Rules, 47 Edge Cases, 6 Open Questions)
> - DESIGNER-PHASE3.2-CALENDAR-SPECS.md (11 Component Specs CS-01→CS-11, Animation Choreography, Accessibility Matrix)
>   **Phase 3.0 Dependencies**: ✅ ALL resolved — `useMinimumDelay`, `useDebounceAction`, `useReducedMotion`, `CompactForm`, `ButtonGroupSelector`, `surfaceState.ts` already exist in `src/hooks/` and `src/components/shared/`.

---

## TABLE OF CONTENTS

1. [Architecture Analysis](#1-architecture-analysis)
2. [Open Question Resolutions](#2-open-question-resolutions)
3. [Task Breakdown](#3-task-breakdown)
4. [Wave Structure](#4-wave-structure)
5. [File Ownership Matrix](#5-file-ownership-matrix)
6. [Risk Assessment](#6-risk-assessment)
7. [i18n Key Manifest](#7-i18n-key-manifest)
8. [Test Coverage Impact](#8-test-coverage-impact)
9. [Dependency Graph](#9-dependency-graph)
10. [Self-Critique](#10-self-critique)

---

## 1. ARCHITECTURE ANALYSIS

### 1.1 Current Component Hierarchy

```
CalendarTab.tsx (256 LOC) — Parent orchestrator
├── DateSelector.tsx (451 LOC) — Week/calendar modes, swipe, meal dots
├── SubTab pills — inline in CalendarTab (useState 'meals'|'nutrition')
├── MealsSubTab.tsx (322 LOC) — Meals view
│   ├── MealActionBar.tsx (175 LOC) — 3 buttons + overflow
│   ├── Recent Dishes chips — inline in MealsSubTab
│   ├── MealSlot.tsx × 3 (166 LOC) — Empty/filled meal cards
│   ├── Status banners (empty/partial/complete) — inline
│   └── MiniNutritionBar.tsx (129 LOC) — Compact cal/pro bars (lg:hidden)
├── NutritionSubTab.tsx (184 LOC) — Nutrition view
│   ├── EnergyBalanceCard.tsx (149 LOC) — Cal in/out, protein, collapsible
│   ├── Summary.tsx (206 LOC) — Cal/pro progress, macro cards, per-meal table
│   ├── MacroChart.tsx (132 LOC) — SVG donut P/F/C
│   └── RecommendationPanel — inline in NutritionSubTab
└── GroceryList modal — via ModalBackdrop
```

**Total LOC**: ~2,170 across 10 component files.

### 1.2 Target Component Hierarchy (Post Phase 3.2)

```
CalendarTab.tsx — Orchestrator (subtab from uiStore, undo snapshot)
├── DateSelector.tsx — Week-first default (Capacitor), persistence
├── SubTab pills — reads/writes uiStore.activeCalendarSubTab
├── MealsSubTab.tsx — Enhanced quick-add + budget strip
│   ├── MealActionBar.tsx — Simplified: 1 primary + overflow
│   ├── Recent Dishes + Quick-Add Dropdown — enhanced inline
│   ├── MealSlot.tsx × 3 — Redesigned: left border, MAX_VISIBLE=4, inline nutrition, swipe
│   ├── Status banners — unchanged
│   └── BudgetStrip (evolved MiniNutritionBar.tsx) — Cal/pro bars + macro pills + setup state
├── NutritionSubTab.tsx — Rewired to 2 cards + setup state
│   ├── NutritionOverview.tsx ← NEW (replaces EnergyBalanceCard + Summary budget + MacroChart)
│   └── NutritionDetails.tsx ← NEW (replaces Summary per-meal table + RecommendationPanel)
├── Skeletons — NEW: MealSlotSkeleton, NutritionOverviewSkeleton, NutritionDetailsSkeleton
├── UndoToast.tsx ← NEW (fixed toast with progress bar)
└── GroceryList modal — unchanged
```

### 1.3 Store Changes

| Store     | Change                                                                     | Persistence |
| --------- | -------------------------------------------------------------------------- | ----------- |
| `uiStore` | Add `activeCalendarSubTab: 'meals' \| 'nutrition'` + `setCalendarSubTab()` | Memory-only |

**dayPlanStore**: NO changes. `restoreDayPlans()` already exists (line 112). Undo snapshot managed in CalendarTab via `useRef`, NOT in store.

### 1.4 Phase 3.0 Dependencies (All Resolved ✅)

| Foundation Item          | Location                                | Status                                       |
| ------------------------ | --------------------------------------- | -------------------------------------------- |
| `useMinimumDelay`        | `src/hooks/useMinimumDelay.ts`          | ✅ Exists                                    |
| `useDebounceAction`      | `src/hooks/useDebounceAction.ts`        | ✅ Exists                                    |
| `useReducedMotion`       | `src/hooks/useReducedMotion.ts`         | ✅ Exists                                    |
| `surfaceState.ts`        | `src/components/shared/surfaceState.ts` | ✅ Exists                                    |
| `EmptyState`             | `src/components/shared/EmptyState.tsx`  | ✅ Exists                                    |
| `SubTabBar`              | `src/components/shared/SubTabBar.tsx`   | ✅ Exists                                    |
| `getSetting/setSetting`  | `src/services/appSettings.ts`           | ✅ Exists (already imported by DateSelector) |
| `UNDO_TOAST_DURATION_MS` | `src/data/constants.ts:60`              | ✅ Exists (= 6000ms)                         |
| Meal type tokens         | `src/index.css` (--meal-breakfast, etc) | ✅ Exists                                    |

---

## 2. OPEN QUESTION RESOLUTIONS

These were raised by BM and Designer. Resolutions based on architectural analysis:

| OQ    | Question                                                  | Resolution                                                                                                             |
| ----- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| OQ-01 | Meal type color tokens (meal-\* vs energy/macro-carbs/ai) | **Option A**: Use `meal-*` tokens (amber/emerald/violet) for MealSlot borders AND DateSelector dots. Unify in TASK-02. |
| OQ-02 | MiniNutritionBar vs Budget Strip                          | **Option C**: Evolve MiniNutritionBar in-place (rename internal, keep file). Add budget text + setup state.            |
| OQ-03 | animate-shimmer dependency                                | **Fallback**: Use Tailwind `animate-pulse` (built-in). No blocking dependency.                                         |
| OQ-04 | EnergyBalanceCard visibility when caloriesOut=null        | **Keep current**: `caloriesOut != null` → show section. `null` = no tracking, not "zero exercise".                     |
| OQ-05 | Snack slot in Quick-Add                                   | **Use MEAL_TYPES constant**. Extensible without over-engineering. Currently 3 types.                                   |
| OQ-06 | Partial config (targetProtein=0)                          | **Option A**: Show "Chưa thiết lập" label for unconfigured metrics. Not zero = not configured.                         |

---

## 3. TASK BREAKDOWN

### TASK-P3.2-01: Subtab State Persistence

**REQ**: REQ-08
**Component Specs**: CS-01
**Effort**: S (<1h)
**Priority**: P1 — Foundational, unblocks testing

**Files to MODIFY:**

- `src/store/uiStore.ts` — Add `activeCalendarSubTab` field + `setCalendarSubTab` action
- `src/components/CalendarTab.tsx` — Replace `useState('meals')` (line 71) with `uiStore.activeCalendarSubTab`

**Files to CREATE:**

- `src/__tests__/calendarSubtabPersistence.test.tsx` — Test subtab survives tab navigation

**Files to DELETE:** None

**Acceptance Criteria:**

- [ ] AC1: `uiStore.activeCalendarSubTab` defaults to `'meals'`
- [ ] AC2: CalendarTab reads/writes subtab state from uiStore, NOT local useState
- [ ] AC3: Switch to Nutrition → navigate to Library → return to Calendar → Nutrition still active
- [ ] AC4: Desktop layout (isDesktop=true) ignores subtab state (shows both panels)
- [ ] AC5: Cold start → subtab is 'meals' (memory-only store)
- [ ] AC6: 100% test coverage for new code

**Business Rules**: BR-3.2-17
**Edge Cases**: EC-32 (force-stop resets), EC-33 (desktop→mobile resize)
**User Stories**: US-3.2-12

---

### TASK-P3.2-02: DateSelector Week-First Default + Dot Unification

**REQ**: REQ-04
**Component Specs**: CS-02
**Effort**: M (1-3h)
**Priority**: P1

**Files to MODIFY:**

- `src/components/DateSelector.tsx` — Default view mode logic, persist preference, unify meal dot tokens

**Files to CREATE:**

- `src/__tests__/dateSelector-weekFirst.test.tsx` — Test default mode logic + persistence

**Files to DELETE:** None

**Detailed Changes:**

1. **Default mode** (line 106-108): Replace current `useState('week')` with:
   ```typescript
   function getDefaultViewMode(db, isNative): 'week' | 'calendar' {
     const persisted = getSetting(db, 'calendar_view_mode');
     if (persisted === 'week' || persisted === 'calendar') return persisted;
     if (isNative) return 'week'; // Capacitor always week
     return window.innerWidth < 640 ? 'week' : 'calendar';
   }
   ```
2. **Persistence**: On mode toggle, call `setSetting(db, 'calendar_view_mode', newMode)` (already imported).
3. **Dot token unification** (lines 303-308): Change dots from `bg-energy`/`bg-macro-carbs`/`bg-ai` to `bg-meal-breakfast`/`bg-meal-lunch`/`bg-meal-dinner` per OQ-01 resolution.

**Acceptance Criteria:**

- [ ] AC1: Capacitor devices default to 'week' mode on first load
- [ ] AC2: Web devices <640px default to 'week', ≥640px to 'calendar'
- [ ] AC3: Persisted preference via `getSetting`/`setSetting` overrides defaults
- [ ] AC4: `pm clear` → preference lost → defaults apply (EC-18)
- [ ] AC5: Meal dots use `bg-meal-breakfast` (amber), `bg-meal-lunch` (emerald), `bg-meal-dinner` (violet)
- [ ] AC6: 100% test coverage

**Business Rules**: BR-3.2-08, BR-3.2-09
**Edge Cases**: EC-17 (768px Capacitor), EC-18 (pm clear), EC-19 (null getSetting), EC-20 (resize)
**User Stories**: US-3.2-07

---

### TASK-P3.2-03: MealSlot Visual Redesign

**REQ**: REQ-03 (inline nutrition), REQ-05 (differentiation)
**Component Specs**: CS-03
**Effort**: M (1-3h)
**Priority**: P1

**Files to MODIFY:**

- `src/components/schedule/MealSlot.tsx` — Left border accent, MAX_VISIBLE=4, dashed empty, inline nutrition header, macro footer

**Files to CREATE:** None (modify existing)

**Detailed Changes:**

1. **Left border accent**: Add `border-l-[3px] border-l-meal-{type}` to BOTH filled and empty containers.
2. **MAX_VISIBLE_DISHES**: Change from 2 (line 18) to 4. Add "+{N-4} thêm" link when >4 dishes.
3. **Empty state**: Change `bg-muted` to `border-dashed border-border`. Layout: icon + label + "Chưa có món" + "+ Thêm" CTA.
4. **Inline nutrition header**: Filled state shows `{calories} kcal · {protein}g` after meal label, before edit button.
5. **Macro footer**: Add `border-t` section with P/F/C pills below dish list.
6. **Token alignment**: Update all classes per CS-03 token reference table.

**Acceptance Criteria:**

- [ ] AC1: Each meal type has distinct left border color (amber/emerald/violet)
- [ ] AC2: Filled slot shows total calories + protein in header row (BR-3.2-06)
- [ ] AC3: 4 dishes visible without "+X" indicator. 5+ shows "+{N-4} thêm" (BR-3.2-11)
- [ ] AC4: Empty slot uses `border-dashed` (not `bg-muted`) (BR-3.2-12)
- [ ] AC5: Macro footer shows P/F/C pills with `bg-macro-{type}/10` background
- [ ] AC6: 0 kcal dish shows "0 kcal" explicitly (EC-13)
- [ ] AC7: 360px viewport: meal label truncates, nutrition always visible (EC-14)
- [ ] AC8: `role="region" aria-label="{type}: {count} món, {cal} kcal"` on container
- [ ] AC9: 100% test coverage

**Business Rules**: BR-3.2-06, BR-3.2-10, BR-3.2-11, BR-3.2-12
**Edge Cases**: EC-13, EC-14, EC-21 (dark mode contrast), EC-22 (320px dashed border), EC-23 (exactly 5 dishes), EC-24 (3×4 dishes on 640px)
**User Stories**: US-3.2-05, US-3.2-08, US-3.2-09

---

### TASK-P3.2-04: MealActionBar Simplification

**REQ**: REQ-09
**Component Specs**: CS-07
**Effort**: S (<1h)
**Priority**: P2

**Files to MODIFY:**

- `src/components/schedule/MealActionBar.tsx` — Reduce to 1 primary + overflow menu

**Files to CREATE:** None

**Detailed Changes:**

1. **allEmpty=true**: Render only 1 primary "Thêm món" button (full width). NO overflow.
2. **allEmpty=false**: Primary "Thêm món" + "⋮" overflow button (ml-auto).
3. **Overflow menu**: Ordered by frequency, destructive last (BR-3.2-19):
   AI gợi ý → Danh sách mua sắm → Sao chép → Lưu mẫu → Quản lý mẫu → Xóa kế hoạch
4. **Remove**: Standalone AI suggest button, standalone Grocery button.
5. **AI loading**: Spinner on menu item, not primary button (EC-34).

**Acceptance Criteria:**

- [ ] AC1: allEmpty=true → exactly 1 button visible, no overflow menu
- [ ] AC2: allEmpty=false → 2 elements: primary + overflow toggle
- [ ] AC3: Menu items ordered per BR-3.2-19, destructive "Xóa" always last
- [ ] AC4: Optional handlers not passed → those menu items simply don't render (EC-35)
- [ ] AC5: AI suggest loading → spinner on Sparkles icon (EC-34)
- [ ] AC6: 100% test coverage

**Business Rules**: BR-3.2-18, BR-3.2-19
**Edge Cases**: EC-34, EC-35, EC-36 (deferred)
**User Stories**: US-3.2-13

---

### TASK-P3.2-05: NutritionOverview Component

**REQ**: REQ-02 (consolidation)
**Component Specs**: CS-05
**Effort**: L (3-8h)
**Priority**: P0

**Files to CREATE:**

- `src/components/schedule/NutritionOverview.tsx` — Consolidated card: calorie budget + protein + inline donut + macros
- `src/__tests__/NutritionOverview.test.tsx`

**Files to MODIFY:** None (new component — rewiring in TASK-09)

**Architecture:**

Replaces: `EnergyBalanceCard` (calorie in/out) + `Summary` (calorie/protein progress) + `MacroChart` (donut).

Structure: 3 sections within 1 card:

- Section A: Calorie budget — progress bar (`bg-energy`), eaten/target, remaining
- Section B: Protein progress — progress bar (`bg-macro-protein`), eaten/target, remaining
- Section C: Macro percentages — inline 48×48 SVG donut + text legend

**Props Interface:**

```typescript
interface NutritionOverviewProps {
  eaten: number;
  target: number;
  protein: number;
  targetProtein: number;
  fat: number;
  carbs: number;
  caloriesOut?: number | null;
  isSetup: boolean;
  onSetup: () => void;
}
```

**Acceptance Criteria:**

- [ ] AC1: Renders as single card with `bg-card rounded-2xl border p-6 shadow-sm`
- [ ] AC2: Section A: calorie progress bar (`bg-energy`), eaten/target text, remaining in `text-primary` (positive) or `text-destructive` (overflow)
- [ ] AC3: Section B: protein progress bar (`bg-macro-protein`), eaten/target text
- [ ] AC4: Section C: inline SVG donut (48×48px, viewBox 0 0 100 100, r=35, strokeWidth=14) + P/F/C legend
- [ ] AC5: caloriesOut != null → show "Tiêu hao" + "Ròng" rows below Section A (EC-08)
- [ ] AC6: caloriesOut == null → hide energy-out section entirely
- [ ] AC7: isSetup=true → render setup EmptyState variant instead of normal content (CS-09)
- [ ] AC8: Partial config (EC-30): if `targetProtein ≤ 0`, Section B shows "Chưa thiết lập" instead of bar
- [ ] AC9: `role="region" aria-label="Tổng quan dinh dưỡng"`, `role="meter"` on progress bars
- [ ] AC10: 100% test coverage

**Business Rules**: BR-3.2-04, BR-3.2-05
**Edge Cases**: EC-08 (caloriesOut null), EC-09 (all empty), EC-10 (desktop column), EC-30 (partial config)
**User Stories**: US-3.2-03, US-3.2-04

---

### TASK-P3.2-06: NutritionDetails Component

**REQ**: REQ-02 (consolidation)
**Component Specs**: CS-06
**Effort**: M (1-3h)
**Priority**: P0

**Files to CREATE:**

- `src/components/schedule/NutritionDetails.tsx` — Expandable per-meal breakdown + dynamic tips
- `src/__tests__/NutritionDetails.test.tsx`

**Files to MODIFY:** None (new component — rewiring in TASK-09)

**Architecture:**

Replaces: `Summary` per-meal table + `RecommendationPanel` tips section.

Structure: Collapsible card (collapsed by default):

- Header: "📋 Chi tiết theo bữa" + chevron toggle
- Expanded content: Per-meal table (breakfast/lunch/dinner/total) + tips section + CTA

**Props Interface:**

```typescript
interface NutritionDetailsProps {
  dayNutrition: DayNutrition;
  targetCalories: number;
  targetProtein: number;
  isSetup: boolean;
  onSwitchToMeals: () => void;
  onEditGoal: () => void;
}
```

**Acceptance Criteria:**

- [ ] AC1: Card with `bg-card rounded-2xl border p-6 shadow-sm`
- [ ] AC2: Default collapsed — only header + chevron visible
- [ ] AC3: Tap header → expand with `animate-accordion-down` (200ms ease-enter)
- [ ] AC4: Per-meal table: 3 rows (breakfast/lunch/dinner) with icon + cal + P/F/C + total row with border-t
- [ ] AC5: Per-meal row icons use `text-meal-{type}` tokens, border-l-2 accent
- [ ] AC6: Tips section: success (green) when protein ≥ target, warning (amber) when deficit > 300kcal
- [ ] AC7: CTA: "Chỉnh mục tiêu →" links to GoalDetailPage via `pushPage()`
- [ ] AC8: isSetup=true → hidden entirely (NutritionOverview shows setup state)
- [ ] AC9: All meals empty → "Chưa có bữa ăn" + CTA to switch to meals tab
- [ ] AC10: 100% test coverage

**Business Rules**: BR-3.2-04, BR-3.2-05
**Edge Cases**: EC-09 (all empty → zero state), EC-12 (surface state contracts)
**User Stories**: US-3.2-03, US-3.2-04

---

### TASK-P3.2-07: Skeleton Variants

**REQ**: REQ-06
**Component Specs**: CS-08
**Effort**: S (<1h)
**Priority**: P1

**Files to CREATE:**

- `src/components/schedule/MealSlotSkeleton.tsx` — Shape-matched skeleton for MealSlot (~120px)
- `src/components/schedule/NutritionOverviewSkeleton.tsx` — Skeleton for NutritionOverview (~200px)
- `src/components/schedule/NutritionDetailsSkeleton.tsx` — Collapsed skeleton for NutritionDetails (~56px)
- `src/__tests__/calendarSkeletons.test.tsx`

**Files to MODIFY:** None

**Acceptance Criteria:**

- [ ] AC1: MealSlotSkeleton uses `animate-pulse`, `bg-card rounded-xl border p-4`, ~120px height
- [ ] AC2: NutritionOverviewSkeleton: 2 progress bar rows + donut placeholder, ~200px height
- [ ] AC3: NutritionDetailsSkeleton: collapsed header only, ~56px height
- [ ] AC4: All skeletons use `bg-muted rounded` for placeholder shapes
- [ ] AC5: `aria-hidden="true" role="presentation"` on all skeletons
- [ ] AC6: Integrate with `useMinimumDelay` — 200ms minimum display (BR-3.2-13)
- [ ] AC7: 100% test coverage

**Business Rules**: BR-3.2-13, BR-3.2-14
**Edge Cases**: EC-25 (cold start >2s), EC-28 (animate-pulse fallback)
**User Stories**: US-3.2-10

---

### TASK-P3.2-08: Quick-Add Enhancement + Budget Strip Evolution

**REQ**: REQ-01 (quick-add), REQ-03 (budget strip)
**Component Specs**: CS-04 (MealsSubTab layout), CS-04 §② (quick-add), CS-04 §⑤ (budget strip)
**Effort**: L (3-8h)
**Priority**: P0

**Files to MODIFY:**

- `src/components/schedule/MealsSubTab.tsx` — Quick-add dropdown logic, layout restructuring
- `src/components/schedule/MiniNutritionBar.tsx` — Evolve into Budget Strip (setup state, enhanced display, tap-to-switch)

**Files to CREATE:**

- `src/__tests__/quickAddDropdown.test.tsx`
- `src/__tests__/budgetStrip.test.tsx`

**Detailed Changes — MealsSubTab:**

1. **Quick-add behavior** (BR-3.2-01):
   - 0 empty slots → hide recent dishes section entirely
   - 1 empty slot → instant add (no dropdown), undo toast
   - 2-3 empty slots → dropdown below chip with slot options
2. **Dropdown** (CS-04 §②): `bg-card border rounded-xl shadow-lg`, positioned absolute below chip, min-w-28, options are "Bữa Sáng"/"Bữa Trưa"/"Bữa Tối" (only empty slots).
3. **Debounce**: Disable chip for 300ms after tap (EC-01, use `useDebounceAction`).
4. **Section header**: "GẦN ĐÂY" in `text-muted-foreground text-xs font-semibold uppercase tracking-wider`.

**Detailed Changes — MiniNutritionBar (→ Budget Strip):**

1. **Container**: `bg-primary/5 border-primary/20 border rounded-2xl p-4 role="button"` — tap switches to nutrition tab.
2. **Header**: "📊 Dinh dưỡng hôm nay" in `text-primary text-xs font-semibold`.
3. **Layout**: 2-column (calories + protein) with progress bars + remaining text.
4. **Macro pills row**: P/F/C pills below (reuse macro pill styles from MealSlot).
5. **Nudge text**: Conditional, kept from existing MiniNutritionBar.
6. **Setup state** (BR-3.2-15): When `isNutritionUnconfigured` → show "Chưa thiết lập mục tiêu" + CTA.
7. **Overflow handling** (EC-15): `text-destructive` for "Vượt: X kcal" when eaten > target.
8. **Complete state**: `bg-success-subtle border-success/20`, header "Đã đạt mục tiêu! 🎉".
9. **Partial config** (EC-30): Calories normal, protein shows "Chưa thiết lập".
10. **data-testid**: Keep `mini-nutrition-bar` + add `budget-strip` alias.

**Acceptance Criteria:**

- [ ] AC1: 0 empty slots → recent dishes section hidden (BR-3.2-01)
- [ ] AC2: 1 empty slot → instant add to that slot on chip tap + undo toast
- [ ] AC3: 2+ empty slots → dropdown with only empty slot options
- [ ] AC4: Dropdown dismisses on: tap outside, tap option, Escape key
- [ ] AC5: Dropdown clamps right edge to viewport - 16px (EC-07)
- [ ] AC6: Chip disabled 300ms after tap (EC-01, debounce)
- [ ] AC7: Budget Strip shows cal + protein progress bars with remaining text
- [ ] AC8: Budget Strip setup state when `targetCalories ≤ 0` (BR-3.2-15)
- [ ] AC9: Budget Strip tap → switch to nutrition subtab
- [ ] AC10: Budget Strip overflow: "Vượt: X kcal" in `text-destructive` (EC-15)
- [ ] AC11: Recent dishes filtered against existing dish library (EC-03)
- [ ] AC12: 100% test coverage

**Business Rules**: BR-3.2-01, BR-3.2-02, BR-3.2-03, BR-3.2-06, BR-3.2-07, BR-3.2-15
**Edge Cases**: EC-01 (double-tap), EC-02 (offline), EC-03 (deleted dish), EC-04 (3 empty), EC-05 (sequential adds), EC-06 (0 recent), EC-07 (320px overflow), EC-15, EC-16, EC-30
**User Stories**: US-3.2-01, US-3.2-02, US-3.2-06

---

### TASK-P3.2-09: NutritionSubTab Rewiring + Setup States

**REQ**: REQ-02 (consolidation), REQ-07 (setup states)
**Component Specs**: CS-01 (layout), CS-05 + CS-06 (new components), CS-09 (setup states)
**Effort**: M (1-3h)
**Priority**: P0

**Files to MODIFY:**

- `src/components/schedule/NutritionSubTab.tsx` — Replace 4 components with 2, add skeleton + setup state

**Files to DELETE (after rewiring):**

- `src/components/nutrition/EnergyBalanceCard.tsx` — Absorbed into NutritionOverview
- `src/components/Summary.tsx` — Split into NutritionOverview + NutritionDetails
- `src/components/schedule/MacroChart.tsx` — Absorbed into NutritionOverview inline donut

**Dependencies**: TASK-05 (NutritionOverview), TASK-06 (NutritionDetails), TASK-07 (skeletons)

**Detailed Changes:**

1. **Replace imports**: Remove EnergyBalanceCard, Summary, MacroChart, RecommendationPanel. Import NutritionOverview, NutritionDetails, skeletons.
2. **Setup state detection**: `const isSetup = !Number.isFinite(targetCalories) || targetCalories <= 0;` (BR-3.2-15)
3. **Skeleton integration**: Use `useMinimumDelay(isHydrating)` to show skeletons during initial load.
4. **Surface state contracts**: Maintain all 4 contracts: `calendar.nutrition:empty`, `calendar.nutrition:setup` (NEW), `calendar.nutrition:partial`, `calendar.nutrition:success` (BR-3.2-05).
5. **Layout**: `isSetup` → render setup EmptyState (CS-09). Otherwise → NutritionOverview + NutritionDetails.
6. **Error timeout**: After 5000ms without data → show error state with "Thử lại" CTA (EC-26).
7. **aria-live region**: Wrap content in `aria-live="polite"`, announce "Đang tải dữ liệu" → "Đã tải xong".

**Acceptance Criteria:**

- [ ] AC1: NutritionSubTab renders exactly 2 card children (NutritionOverview + NutritionDetails) when not setup/loading
- [ ] AC2: No data point duplicated between the 2 cards (BR-3.2-04)
- [ ] AC3: isSetup → EmptyState with "Thiết lập mục tiêu dinh dưỡng" + CTA → GoalDetailPage (BR-3.2-16)
- [ ] AC4: CTA uses `pushPage()` → CalendarTab NOT unmounted (EC-31)
- [ ] AC5: Skeleton → content transition: `opacity 0→1, 300ms, --ease-enter`
- [ ] AC6: Rapid tab switching: no re-show skeleton if already hydrated (EC-27)
- [ ] AC7: Surface state contracts: all 4 states fire correctly
- [ ] AC8: EnergyBalanceCard.tsx, Summary.tsx, MacroChart.tsx deleted from codebase
- [ ] AC9: 100% test coverage for NutritionSubTab (test files updated)

**Business Rules**: BR-3.2-04, BR-3.2-05, BR-3.2-13, BR-3.2-14, BR-3.2-15, BR-3.2-16
**Edge Cases**: EC-08, EC-09, EC-10, EC-11 (test file updates!), EC-12 (contracts), EC-25, EC-26, EC-27, EC-29, EC-30, EC-31
**User Stories**: US-3.2-03, US-3.2-04, US-3.2-10, US-3.2-11

---

### TASK-P3.2-10: Swipe-to-Clear Gesture

**REQ**: REQ-10
**Component Specs**: CS-10
**Effort**: M (1-3h)
**Priority**: P2

**Files to MODIFY:**

- `src/components/schedule/MealSlot.tsx` — Add touch gesture layer (filled state only)
- `src/components/schedule/MealsSubTab.tsx` — Single active swipe zone state management

**Dependencies**: TASK-03 (MealSlot redesign must be complete first)

**Detailed Changes — MealSlot:**

1. **Gesture detection**: `onTouchStart`/`onTouchMove`/`onTouchEnd` on filled MealSlot container.
2. **Direction check**: `|diffX| > |diffY|` AND `|diffX| > 50px` for horizontal swipe (BR-3.2-20).
3. **Drag follow**: `style.transform = translateX(-${dx}px)` via `useRef` (NO React state during drag for perf).
4. **Snap reveal**: Release at ≥50px → snap to `-80px` (200ms, `--ease-spring`).
5. **Snap close**: Release at <50px OR tap outside OR scroll → snap to 0 (200ms, `--ease-exit`).
6. **Destructive zone**: 80px wide, `bg-destructive text-destructive-foreground`, contains Trash2 icon + "Xóa" text.
7. **Confirm**: Tap "Xóa" → ConfirmationModal: "Xóa bữa {mealType}?" → confirm removes all dishes + undo toast.
8. **Empty slot**: Gesture disabled (touch handlers not attached).
9. **Event isolation**: `event.stopPropagation()` on `touchstart` within MealSlot (EC-37).

**Detailed Changes — MealsSubTab:**

1. **Single zone state**: `const [activeSwipeSlot, setActiveSwipeSlot] = useState<MealType | null>(null)`.
2. **Open new → close old**: Opening new zone sets `activeSwipeSlot`, triggers close callback on previous.
3. **Scroll listener**: `scroll` event on container → set `activeSwipeSlot = null` (EC-40).

**Acceptance Criteria:**

- [ ] AC1: Left swipe ≥50px on filled MealSlot → destructive zone revealed (80px)
- [ ] AC2: Right swipe / tap outside / scroll → zone closes
- [ ] AC3: Tap "Xóa" → ConfirmationModal with "Xóa bữa {type}?" (BR-3.2-20)
- [ ] AC4: Confirm → dishes removed + undo toast
- [ ] AC5: Empty MealSlot: no swipe response
- [ ] AC6: DateSelector swipe unaffected (EC-37, scoped touch handlers)
- [ ] AC7: Diagonal swipe ignored (`|diffX| <= |diffY|`) (EC-38)
- [ ] AC8: Max 1 zone open at a time (BR-3.2-21)
- [ ] AC9: 320px viewport: verify card not clipped beyond viewport (EC-39)
- [ ] AC10: `prefers-reduced-motion`: instant snap, no animation
- [ ] AC11: 100% test coverage

**Business Rules**: BR-3.2-20, BR-3.2-21
**Edge Cases**: EC-37, EC-38, EC-39, EC-40, EC-41
**User Stories**: US-3.2-14

---

### TASK-P3.2-11: Undo Mechanism + Integration

**REQ**: REQ-11
**Component Specs**: CS-11
**Effort**: L (3-8h)
**Priority**: P2

**Files to CREATE:**

- `src/components/schedule/UndoToast.tsx` — Fixed bottom toast with progress bar + "Hoàn tác" CTA
- `src/__tests__/UndoToast.test.tsx`
- `src/__tests__/undoMechanism.test.tsx` — Integration test for snapshot + restore cycle

**Files to MODIFY:**

- `src/components/CalendarTab.tsx` — Add snapshot ref + wrap modification handlers
- `src/components/schedule/MealsSubTab.tsx` — Pass undo callbacks to quick-add + action bar handlers

**Dependencies**: TASK-08 (quick-add handlers), TASK-10 (swipe-clear handler)

**Architecture:**

Snapshot is managed via `useRef<{date: string; plan: DayPlan | null} | null>` in CalendarTab. NOT in Zustand store (avoids unnecessary re-renders).

Flow:

1. Before any modification → `snapshot.current = { date: selectedDate, plan: dayPlans.find(p => p.date === selectedDate) ?? null }`
2. Execute modification → show UndoToast
3. User taps "Hoàn tác" → `restoreDayPlans([snapshot.current.plan])` → show "Đã hoàn tác" confirmation
4. Timeout 6000ms → `snapshot.current = null` (GC eligible)
5. New modification during window → replace snapshot (EC-42)

**UndoToast Component:**

```typescript
interface UndoToastProps {
  message: string;
  icon: LucideIcon;
  duration: number; // UNDO_TOAST_DURATION_MS
  onUndo: () => void;
  onDismiss: () => void;
}
```

- Position: `fixed bottom-20 left-4 right-4 z-[60]`
- Style: `bg-foreground text-background rounded-xl shadow-lg px-4 py-3`
- Progress bar: `h-0.5 bg-background/30`, width 100%→0% over duration
- Enter: `translateY(100%→0) + opacity 0→1`, 250ms, `--ease-spring`
- Exit: `translateY(0→100%) + opacity 1→0`, 200ms, `--ease-exit`

**Acceptance Criteria:**

- [ ] AC1: Quick-add triggers undo toast with "Đã thêm {dishName} vào {mealType}" (CS-11 table)
- [ ] AC2: Modal confirm triggers undo toast with "Đã cập nhật {count} bữa ăn"
- [ ] AC3: Clear plan triggers undo toast with "Đã xóa kế hoạch"
- [ ] AC4: Swipe clear triggers undo toast with "Đã xóa bữa {mealType}"
- [ ] AC5: Tap "Hoàn tác" within 6s → `restoreDayPlans` called → "Đã hoàn tác" shown (BR-3.2-23)
- [ ] AC6: After 6s → snapshot = null, no undo available
- [ ] AC7: New change during window → old undo lost, new snapshot captured (EC-42)
- [ ] AC8: Undo only reverts affected date's plan, not other dates (BR-3.2-24, EC-45, EC-46, EC-47)
- [ ] AC9: Progress bar width transitions 100%→0% over 6000ms
- [ ] AC10: z-index = 60 (above overflow menu at z-50)
- [ ] AC11: `prefers-reduced-motion`: instant show/hide, no slide animation
- [ ] AC12: 100% test coverage

**Business Rules**: BR-3.2-22, BR-3.2-23, BR-3.2-24
**Edge Cases**: EC-42 (second change), EC-43 (deleted dish reference), EC-44 (backgrounded), EC-45 (date change), EC-46 (settings change), EC-47 (merge behavior)
**User Stories**: US-3.2-15, US-3.2-16

---

## 4. WAVE STRUCTURE

```
Wave 1: Foundation (4 parallel tasks — ALL different files)
├── TASK-P3.2-01: Subtab persistence    → uiStore.ts + CalendarTab.tsx
├── TASK-P3.2-02: Week-first default    → DateSelector.tsx
├── TASK-P3.2-03: MealSlot redesign     → MealSlot.tsx
└── TASK-P3.2-04: ActionBar simplify    → MealActionBar.tsx

Wave 2: New Components (4 parallel tasks — NEW files or non-conflicting)
├── TASK-P3.2-05: NutritionOverview     → NEW NutritionOverview.tsx
├── TASK-P3.2-06: NutritionDetails      → NEW NutritionDetails.tsx
├── TASK-P3.2-07: Skeleton variants     → NEW 3 skeleton files
└── TASK-P3.2-08: Quick-Add + Budget    → MealsSubTab.tsx + MiniNutritionBar.tsx

Wave 3: Rewiring + Gesture (2 parallel tasks — different files)
├── TASK-P3.2-09: NutritionSubTab rewire → NutritionSubTab.tsx [depends 05, 06, 07]
└── TASK-P3.2-10: Swipe-to-Clear        → MealSlot.tsx + MealsSubTab.tsx [depends 03]

Wave 4: Integration (1 task — cross-cutting)
└── TASK-P3.2-11: Undo mechanism        → UndoToast.tsx (NEW) + CalendarTab.tsx + MealsSubTab.tsx [depends 08, 09, 10]
```

### Effort & Timeline Estimate

| Wave      | Tasks  | Parallel Agents | Est. Effort (each) | Calendar Time |
| --------- | ------ | --------------- | ------------------ | ------------- |
| W1        | 4      | 4               | S–M (0.5–3h)       | ~3h           |
| W2        | 4      | 4               | S–L (0.5–8h)       | ~8h           |
| W3        | 2      | 2               | M (1–3h)           | ~3h           |
| W4        | 1      | 1               | L (3–8h)           | ~8h           |
| **Total** | **11** | —               | —                  | **~22h**      |

### Quality Gate Per Wave

After EACH wave commit:

```
1. npm run lint          → 0 errors (NO eslint-disable)
2. npm run test          → 0 failures, 100% coverage for new code
3. npm run build         → clean production build
4. npm run test:coverage && npm run sonar → 0 SonarQube issues
5. APK build → emulator verify → screenshot evidence
```

---

## 5. FILE OWNERSHIP MATRIX

### Wave 1 — File Ownership (No Conflicts ✅)

| File                                        | TASK-01  | TASK-02  | TASK-03  | TASK-04  |
| ------------------------------------------- | -------- | -------- | -------- | -------- |
| `src/store/uiStore.ts`                      | ✏️ WRITE |          |          |          |
| `src/components/CalendarTab.tsx`            | ✏️ WRITE |          |          |          |
| `src/components/DateSelector.tsx`           |          | ✏️ WRITE |          |          |
| `src/components/schedule/MealSlot.tsx`      |          |          | ✏️ WRITE |          |
| `src/components/schedule/MealActionBar.tsx` |          |          |          | ✏️ WRITE |

### Wave 2 — File Ownership (No Conflicts ✅)

| File                                                    | TASK-05   | TASK-06   | TASK-07   | TASK-08  |
| ------------------------------------------------------- | --------- | --------- | --------- | -------- |
| `src/components/schedule/NutritionOverview.tsx`         | 🆕 CREATE |           |           |          |
| `src/components/schedule/NutritionDetails.tsx`          |           | 🆕 CREATE |           |          |
| `src/components/schedule/MealSlotSkeleton.tsx`          |           |           | 🆕 CREATE |          |
| `src/components/schedule/NutritionOverviewSkeleton.tsx` |           |           | 🆕 CREATE |          |
| `src/components/schedule/NutritionDetailsSkeleton.tsx`  |           |           | 🆕 CREATE |          |
| `src/components/schedule/MealsSubTab.tsx`               |           |           |           | ✏️ WRITE |
| `src/components/schedule/MiniNutritionBar.tsx`          |           |           |           | ✏️ WRITE |

### Wave 3 — File Ownership (No Conflicts ✅)

| File                                             | TASK-09   | TASK-10  |
| ------------------------------------------------ | --------- | -------- |
| `src/components/schedule/NutritionSubTab.tsx`    | ✏️ WRITE  |          |
| `src/components/nutrition/EnergyBalanceCard.tsx` | 🗑️ DELETE |          |
| `src/components/Summary.tsx`                     | 🗑️ DELETE |          |
| `src/components/schedule/MacroChart.tsx`         | 🗑️ DELETE |          |
| `src/components/schedule/MealSlot.tsx`           |           | ✏️ WRITE |
| `src/components/schedule/MealsSubTab.tsx`        |           | ✏️ WRITE |

**⚠️ Note**: TASK-10 modifies MealsSubTab.tsx (swipe state). TASK-09 does NOT modify MealsSubTab.tsx (only NutritionSubTab.tsx). No conflict.

### Wave 4 — File Ownership (Single Task)

| File                                      | TASK-11   |
| ----------------------------------------- | --------- |
| `src/components/schedule/UndoToast.tsx`   | 🆕 CREATE |
| `src/components/CalendarTab.tsx`          | ✏️ WRITE  |
| `src/components/schedule/MealsSubTab.tsx` | ✏️ WRITE  |

### Conflict Verification Summary

| Wave Pair | Potential Conflicts              | Resolution                                                                 |
| --------- | -------------------------------- | -------------------------------------------------------------------------- |
| W1 ↔ W1   | None                             | All 4 tasks touch different files                                          |
| W2 ↔ W2   | None                             | Tasks 05/06/07 create NEW files; Task 08 modifies different existing files |
| W3 ↔ W3   | ⚠️ MealsSubTab.tsx               | Only TASK-10 touches it (TASK-09 does not). No conflict.                   |
| W3 ↔ W2   | MealsSubTab.tsx                  | Sequential waves — W3 runs AFTER W2. No conflict.                          |
| W4 ↔ W3   | MealsSubTab.tsx, CalendarTab.tsx | Sequential — W4 runs AFTER W3. No conflict.                                |

**Result**: ✅ ZERO file conflicts within any wave. All intra-wave tasks are fully parallelizable.

---

## 6. RISK ASSESSMENT

| #   | Risk                                                               | Prob   | Impact | Tasks Affected   | Mitigation                                                                                                                          |
| --- | ------------------------------------------------------------------ | ------ | ------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| R1  | NutritionSubTab consolidation breaks 8+ existing test files        | High   | Medium | TASK-09          | Write NutritionOverview/Details tests FIRST (Wave 2). Update existing tests in TASK-09 before deleting old components.              |
| R2  | Swipe gesture conflicts with DateSelector week-view swipe          | Low    | High   | TASK-10          | `event.stopPropagation()` on MealSlot `touchstart`. Scope handler via `event.currentTarget`. Verify both gestures in emulator test. |
| R3  | Quick-add dropdown overflow on 320px viewport                      | Medium | Medium | TASK-08          | Clamp right edge: `Math.min(chipRect.left, viewportWidth - dropdownWidth - 16)`. Test on 320px viewport.                            |
| R4  | Budget Strip + old MiniNutritionBar testids break emulator tests   | Medium | Low    | TASK-08          | Keep `data-testid="mini-nutrition-bar"` as primary, add `budget-strip` as alias. Update CDP test scripts.                           |
| R5  | Desktop side-by-side layout breaks after NutritionSubTab rewire    | Medium | Medium | TASK-09          | CalendarTab desktop layout renders NutritionSubTab directly. Verify desktop after TASK-09 with `isDesktop=true` path.               |
| R6  | Undo snapshot reference stale dish (deleted between change & undo) | Low    | Low    | TASK-11          | MealSlot.resolvedDishes already filters orphan dishIds (existing behavior). No new code needed.                                     |
| R7  | Skeleton flash on fast hydration (<100ms)                          | Medium | Low    | TASK-07, TASK-09 | `useMinimumDelay(isLoading, 200)` enforces 200ms minimum display.                                                                   |
| R8  | DateSelector `getSetting` async delays initial render              | Medium | Low    | TASK-02          | Show week mode immediately as default. If persisted preference loads as 'calendar', switch after. Avoids layout shift.              |
| R9  | Memory leak in undo toast timer                                    | Low    | Low    | TASK-11          | Clear timeout in `useEffect` cleanup. Set snapshot.current = null on unmount.                                                       |

---

## 7. i18n KEY MANIFEST

### New Keys to Add

```jsonc
// vi.json additions organized by namespace

{
  // === CS-09: Setup States ===
  "calendar.nutritionSetupTitle": "Thiết lập mục tiêu dinh dưỡng",
  "calendar.nutritionSetupDesc": "Thiết lập hồ sơ sức khỏe và mục tiêu để theo dõi dinh dưỡng",
  "calendar.nutritionSetupAction": "Thiết lập ngay",
  "calendar.nutritionProteinNotConfigured": "Chưa thiết lập",

  // === CS-04: Budget Strip ===
  "calendar.budgetStripTitle": "Dinh dưỡng hôm nay",
  "calendar.budgetSetupLabel": "Chưa thiết lập mục tiêu",
  "calendar.budgetSetupCta": "Thiết lập",
  "calendar.budgetGoalReached": "Đã đạt mục tiêu! 🎉",
  "calendar.budgetOverflow": "Vượt: {{value}} {{unit}}",
  "calendar.budgetRemaining": "Còn: {{value}} {{unit}}",

  // === CS-04: Quick-Add ===
  "calendar.recentDishesLabel": "GẦN ĐÂY",

  // === CS-03: MealSlot ===
  "calendar.mealSlotEmpty": "Chưa có món",
  "calendar.mealSlotAdd": "Thêm",
  "calendar.mealSlotMore": "+{{count}} thêm",

  // === CS-06: NutritionDetails ===
  "calendar.nutritionDetailsHeader": "Chi tiết theo bữa",
  "calendar.nutritionDetailsTotalLabel": "Tổng",
  "calendar.nutritionDetailsNoMeals": "Chưa có bữa ăn",
  "calendar.nutritionDetailsGoalCta": "Chỉnh mục tiêu",
  "calendar.nutritionDetailsSwitch": "Xem bữa ăn",

  // === CS-10: Swipe-to-Clear ===
  "calendar.swipeClearConfirmTitle": "Xóa bữa {{mealType}}?",
  "calendar.swipeClearConfirmDesc": "Tất cả {{count}} món sẽ bị xóa",
  "calendar.swipeClearBtn": "Xóa",

  // === CS-11: Undo Toast ===
  "calendar.undoAction": "Hoàn tác",
  "calendar.undoQuickAdd": "Đã thêm {{dishName}} vào {{mealType}}",
  "calendar.undoModalConfirm": "Đã cập nhật {{count}} bữa ăn",
  "calendar.undoClearPlan": "Đã xóa kế hoạch",
  "calendar.undoSwipeClear": "Đã xóa bữa {{mealType}}",
  "calendar.undoSuccess": "Đã hoàn tác",

  // === CS-08: Skeleton ===
  "calendar.skeletonLoading": "Đang tải dữ liệu",
  "calendar.skeletonDone": "Đã tải xong",
  "calendar.skeletonError": "Không thể tải dữ liệu",
  "calendar.skeletonRetry": "Thử lại",

  // === CS-05: NutritionOverview ===
  "calendar.nutritionOverviewLabel": "Tổng quan dinh dưỡng",
  "calendar.nutritionCalorieLabel": "Năng lượng",
  "calendar.nutritionProteinLabel": "Protein",
  "calendar.nutritionCaloriesOut": "Tiêu hao",
  "calendar.nutritionNet": "Ròng",

  // === CS-07: MealActionBar ===
  "calendar.actionAddMeal": "Thêm món",
}
```

**Total new keys**: ~35

### Keys to Deprecate (After TASK-09 Completes)

| Key                         | Reason                                       | Task    |
| --------------------------- | -------------------------------------------- | ------- |
| `summary.calorieLabel`      | Absorbed into NutritionOverview              | TASK-09 |
| `summary.proteinLabel`      | Absorbed into NutritionOverview              | TASK-09 |
| `summary.macroTitle`        | Absorbed into NutritionOverview inline donut | TASK-09 |
| `recommendation.tipPrefix`  | Absorbed into NutritionDetails tips section  | TASK-09 |
| `recommendation.emptyLabel` | Replaced by NutritionDetails zero state      | TASK-09 |

**Do NOT delete** until all import references are removed and tests pass.

### Keys to Verify Exist (Already Present — Confirm Before Coding)

| Key                     | Expected Location | Used By              |
| ----------------------- | ----------------- | -------------------- |
| `meal.breakfast`        | `vi.json`         | MealSlot, Dropdown   |
| `meal.lunch`            | `vi.json`         | MealSlot, Dropdown   |
| `meal.dinner`           | `vi.json`         | MealSlot, Dropdown   |
| `meal.breakfastFull`    | `vi.json`         | Quick-add labels     |
| `schedule.mealProgress` | `vi.json`         | MealsSubTab progress |
| `common.close`          | `vi.json`         | Modal/Dialog close   |
| `common.cancel`         | `vi.json`         | ConfirmationModal    |

---

## 8. TEST COVERAGE IMPACT

### Existing Test Files Affected

| Test File                                      | Affected By | Action Needed                                                     |
| ---------------------------------------------- | ----------- | ----------------------------------------------------------------- |
| `src/__tests__/MealSlot.test.tsx`              | TASK-03, 10 | Update: left border, MAX_VISIBLE=4, inline nutrition, swipe tests |
| `src/__tests__/calendarAndDate.test.tsx`       | TASK-02     | Update: week-first default, persistence                           |
| `src/__tests__/MiniNutritionBar.test.tsx`      | TASK-08     | Update: Budget Strip states, setup state, overflow                |
| `src/__tests__/NutritionSection.test.tsx`      | TASK-09     | Possible impact if it imports Summary/MacroChart — verify         |
| `src/__tests__/scheduleComponents.test.tsx`    | TASK-04, 08 | Update: ActionBar simplified, MealsSubTab quick-add               |
| `src/__tests__/EnergyBalanceCard.test.tsx`     | TASK-09     | DELETE after component removed                                    |
| `src/__tests__/calendarDesktopLayout.test.tsx` | TASK-09     | Verify desktop rendering with new NutritionSubTab                 |

### New Test Files to Create

| Test File                                          | Task    | Coverage Target |
| -------------------------------------------------- | ------- | --------------- |
| `src/__tests__/calendarSubtabPersistence.test.tsx` | TASK-01 | 100%            |
| `src/__tests__/dateSelector-weekFirst.test.tsx`    | TASK-02 | 100%            |
| `src/__tests__/NutritionOverview.test.tsx`         | TASK-05 | 100%            |
| `src/__tests__/NutritionDetails.test.tsx`          | TASK-06 | 100%            |
| `src/__tests__/calendarSkeletons.test.tsx`         | TASK-07 | 100%            |
| `src/__tests__/quickAddDropdown.test.tsx`          | TASK-08 | 100%            |
| `src/__tests__/budgetStrip.test.tsx`               | TASK-08 | 100%            |
| `src/__tests__/UndoToast.test.tsx`                 | TASK-11 | 100%            |
| `src/__tests__/undoMechanism.test.tsx`             | TASK-11 | 100%            |

### Test File Deletion Schedule

| Test File                                  | Delete When   | Reason                                        |
| ------------------------------------------ | ------------- | --------------------------------------------- |
| `src/__tests__/EnergyBalanceCard.test.tsx` | After TASK-09 | Component deleted, tests in NutritionOverview |

---

## 9. DEPENDENCY GRAPH

```
TASK-01 ──────────────────────────────────────┐
TASK-02 ──────────────────────────────────────┤
TASK-03 ──────────────────────────┐           │
TASK-04 ──────────────────────────┤           │
                                  │           │
                                  ▼           │
                          [Wave 1 Done]       │
                                  │           │
TASK-05 ←─────────────────────────┤           │
TASK-06 ←─────────────────────────┤           │
TASK-07 ←─────────────────────────┤           │
TASK-08 ←─────────────────────────┤           │
                                  │           │
                                  ▼           │
                          [Wave 2 Done]       │
                                  │           │
TASK-09 ←─── needs 05, 06, 07 ───┤           │
TASK-10 ←─── needs 03 ───────────┤           │
                                  │           │
                                  ▼           │
                          [Wave 3 Done]       │
                                  │           │
TASK-11 ←─── needs 08, 09, 10 ───┘───────────┘
                                  │
                                  ▼
                          [Wave 4 Done]
                                  │
                                  ▼
                     [Phase 3.2 COMPLETE]
```

### Critical Path

```
TASK-03 → TASK-10 → TASK-11 (MealSlot → Swipe → Undo)
TASK-05 → TASK-09 → TASK-11 (NutritionOverview → Rewire → Undo)
```

Longest path: Wave 1 (3h) → Wave 2 (8h) → Wave 3 (3h) → Wave 4 (8h) = **~22h calendar time**.

---

## 10. SELF-CRITIQUE

### Round 1: REQ Coverage Verification

| REQ    | Description              | Tasks           | BRs Covered         | ECs Covered  | ✅  |
| ------ | ------------------------ | --------------- | ------------------- | ------------ | --- |
| REQ-01 | Quick-Add                | TASK-08         | BR-01, BR-02, BR-03 | EC-01→EC-07  | ✅  |
| REQ-02 | Nutrition Consolidation  | TASK-05, 06, 09 | BR-04, BR-05        | EC-08→EC-12  | ✅  |
| REQ-03 | Inline Nutrition         | TASK-03, 08     | BR-06, BR-07        | EC-13→EC-16  | ✅  |
| REQ-04 | Week-First Default       | TASK-02         | BR-08, BR-09        | EC-17→EC-20  | ✅  |
| REQ-05 | MealSlot Differentiation | TASK-03         | BR-10, BR-11, BR-12 | EC-21→EC-24  | ✅  |
| REQ-06 | Skeleton Loading         | TASK-07, 09     | BR-13, BR-14        | EC-25→EC-28  | ✅  |
| REQ-07 | Setup States             | TASK-08, 09     | BR-15, BR-16        | EC-29→EC-31  | ✅  |
| REQ-08 | Subtab Persistence       | TASK-01         | BR-17               | EC-32, EC-33 | ✅  |
| REQ-09 | ActionBar Simplification | TASK-04         | BR-18, BR-19        | EC-34→EC-36  | ✅  |
| REQ-10 | Swipe-to-Clear           | TASK-10         | BR-20, BR-21        | EC-37→EC-41  | ✅  |
| REQ-11 | Undo Mechanism           | TASK-11         | BR-22, BR-23, BR-24 | EC-42→EC-47  | ✅  |

**Result**: 11/11 REQs covered. 24/24 BRs mapped. 47/47 ECs addressed. ✅

### Round 2: File Conflict Audit

| Wave | Files Modified/Created                                                                          | Conflict Check                                                                                                             |
| ---- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| W1   | uiStore, CalendarTab, DateSelector, MealSlot, MealActionBar                                     | 5 unique files, 0 overlaps ✅                                                                                              |
| W2   | 3 NEW skeletons, NutritionOverview (NEW), NutritionDetails (NEW), MealsSubTab, MiniNutritionBar | 7 unique targets, 0 overlaps ✅                                                                                            |
| W3   | NutritionSubTab, MealSlot, MealsSubTab + 3 DELETEs                                              | NutritionSubTab ≠ MealSlot ≠ MealsSubTab. TASK-10 touches MealSlot+MealsSubTab but TASK-09 only touches NutritionSubTab ✅ |
| W4   | UndoToast (NEW), CalendarTab, MealsSubTab                                                       | Single task, no parallel conflict ✅                                                                                       |

**Result**: Zero intra-wave file conflicts. ✅

### Round 2: Missing Items Check

1. **Animation choreography**: All 18 animations from Designer spec are covered in task ACs. ✅
2. **Accessibility**: ARIA roles specified in TASK-03 (MealSlot), TASK-05 (NutritionOverview), TASK-07 (skeletons). ✅
3. **Dark mode**: All tokens are semantic. No hardcoded hex values. ✅
4. **Reduced motion**: Referenced in TASK-10 (swipe instant snap) and TASK-11 (toast instant show/hide). ✅
5. **Desktop layout**: CalendarTab desktop side-by-side verified in TASK-09 AC. ✅
6. **Performance**: DateSelector `dayPlans.find()` in render loop noted but NOT in scope (implicit optimization, not a REQ). ⚠️ Flag as tech debt.
7. **Surface state contracts**: Maintained in TASK-09 AC7. ✅
8. **testid continuity**: Budget Strip keeps `mini-nutrition-bar` testid (TASK-08). ✅

### Round 2: What Could Go Wrong

1. **TASK-09 is the riskiest task**: Deletes 3 files + rewires NutritionSubTab + updates 2+ test files. Mitigation: Wave 2 creates all replacement components first. TASK-09 only wires + deletes.
2. **TASK-10 + TASK-11 cross-dependency on MealsSubTab**: Both modify MealsSubTab but in different waves (W3 then W4). Sequential — no conflict. But TASK-11 must account for swipe-clear handler added by TASK-10.
3. **i18n key count (~35 new)**: Large batch. Risk of typos. Mitigation: Dev agents MUST verify every `t()` call has a matching `vi.json` entry. Lint should catch missing keys if i18next plugin is configured.

**All issues resolved or mitigated. Plan is APPROVED for execution.** ✅

---

## APPENDIX A: Component Spec → Task Mapping

| CS    | Component Spec                 | Primary Task | Secondary Tasks |
| ----- | ------------------------------ | ------------ | --------------- |
| CS-01 | CalendarTab Layout             | TASK-01      | TASK-09, 11     |
| CS-02 | DateSelector (Week-First)      | TASK-02      | —               |
| CS-03 | MealSlot (Redesigned)          | TASK-03      | TASK-10         |
| CS-04 | MealsSubTab (Quick-Add+Budget) | TASK-08      | TASK-10         |
| CS-05 | NutritionOverview              | TASK-05      | —               |
| CS-06 | NutritionDetails               | TASK-06      | —               |
| CS-07 | MealActionBar (Simplified)     | TASK-04      | —               |
| CS-08 | Skeleton Variants              | TASK-07      | TASK-09         |
| CS-09 | Setup States                   | TASK-08, 09  | —               |
| CS-10 | Swipe-to-Clear Gesture         | TASK-10      | —               |
| CS-11 | Undo Toast                     | TASK-11      | —               |

## APPENDIX B: User Story → Task Mapping

| US        | Story                     | Task(s)         |
| --------- | ------------------------- | --------------- |
| US-3.2-01 | Quick-add single slot     | TASK-08         |
| US-3.2-02 | Quick-add multi slot      | TASK-08         |
| US-3.2-03 | Nutrition consolidation   | TASK-05, 06, 09 |
| US-3.2-04 | Data deduplication        | TASK-05, 06, 09 |
| US-3.2-05 | Inline nutrition per-slot | TASK-03         |
| US-3.2-06 | Budget strip              | TASK-08         |
| US-3.2-07 | Week-first default        | TASK-02         |
| US-3.2-08 | Visual differentiation    | TASK-03         |
| US-3.2-09 | Expanded visibility       | TASK-03         |
| US-3.2-10 | Skeleton loading          | TASK-07, 09     |
| US-3.2-11 | Setup state               | TASK-08, 09     |
| US-3.2-12 | Subtab persistence        | TASK-01         |
| US-3.2-13 | ActionBar simplification  | TASK-04         |
| US-3.2-14 | Swipe-to-clear            | TASK-10         |
| US-3.2-15 | Undo mechanism            | TASK-11         |
| US-3.2-16 | Undo state management     | TASK-11         |

## APPENDIX C: Sub-Agent Prompt Constraints

Every sub-agent dispatched for Phase 3.2 MUST include these constraints in its prompt:

```
⛔ KHÔNG ĐƯỢC chạy: git add, git commit, git push
⛔ KHÔNG ĐƯỢC chạy: npm run build, npx cap sync, gradle
⛔ Tối đa 3 rubber-duck critique rounds
✅ CHỈ ĐƯỢC: sửa code, chạy lint (npm run lint), chạy test (npm run test)
✅ Sau khi xong: báo cáo danh sách files đã thay đổi
✅ Mọi t('key') call PHẢI có entry tương ứng trong vi.json
✅ KHÔNG dùng eslint-disable
✅ Coverage 100% cho code mới
```
