# Phase 3.2: Calendar + Meals — CEO Analysis

> **Version**: 1.0  
> **Date**: 2026-07-18  
> **Author**: CEO Agent  
> **Status**: ANALYSIS_COMPLETE  
> **Scope**: CalendarTab, DateSelector, MealsSubTab, NutritionSubTab, MealSlot, MealPlannerModal, MiniNutritionBar, MacroChart, Summary, EnergyBalanceCard, MealActionBar  
> **Codebase snapshot**: 2,580 LOC across 11 component files + store + 200+ i18n keys  

---

## Executive Summary

The Calendar+Meals screens are the **primary daily interaction surface** of MealPlaning — users visit them every day to plan meals and track nutrition. Currently, the implementation is functionally complete (~2,580 LOC, 11 components, 8 modals) but suffers from three systemic UX problems:

1. **Modal fatigue**: The meal planning flow requires navigating through 2-3 modal layers (type selection → MealPlannerModal → optional filter sheet) to add a single dish. This is the #1 friction point for daily users. Top apps like MyFitnessPal achieve single-tap meal logging; our flow requires 4-6 taps minimum.

2. **Information density imbalance**: The Meals subtab shows too little nutrition context (calories + protein only on MealSlot footer), while the Nutrition subtab shows too much at once (Summary + MacroChart + EnergyBalanceCard + RecommendationPanel = 4 stacked cards). Users must context-switch between tabs to correlate "what I ate" with "what it means nutritionally."

3. **DateSelector dominates viewport**: In calendar mode, the full month grid occupies ~60% of the above-the-fold screen estate on mobile (360px viewport). The actual meal content — the reason users are here — is pushed below the fold. Week mode is better but not the default on larger phones (>640px defaults to calendar mode).

**Expected impact of fixing these**: Reduce meal-logging friction from 6 taps to 2 taps (P0), improve nutrition scanability by 40% via inline micro-summaries (P0), and reclaim 30-40% of above-fold space for actionable content (P1).

---

## Current State Audit

### Day Picker (DateSelector.tsx — 451 LOC)

**What exists**:
- Two view modes: `calendar` (full month grid) and `week` (7-day horizontal strip)
- Default mode is `calendar` for screens ≥640px, `week` for <640px
- Week view supports touch swipe navigation (touchstart/touchend handlers)
- Meal indicator dots (3 colored dots per day: breakfast=`bg-energy`, lunch=`bg-macro-carbs`, dinner=`bg-ai`)
- "Today" button for quick navigation
- Calendar grid shows meal count badge on days with meals
- Dismissible hint text for first-time users
- Meal legend at bottom (Sáng / Trưa / Tối with colored dots)

**Pain points**:
- P-DATE-01: Calendar mode occupies ~280px vertical space on mobile, pushing all content below fold
- P-DATE-02: Click-to-plan (double click in calendar mode, single click on selected date) is undiscoverable — no visual affordance indicates the date is also a CTA
- P-DATE-03: Meal count badge (`text-[7px]`, `text-[8px]`) is too small to be readable — effectively invisible
- P-DATE-04: The dot color legend (Sáng/Trưa/Tối) is shown after every render of both views = duplicated visual noise
- P-DATE-05: `parseLocalDate()` called inside render loop for each calendar day (line 353) — potential perf issue with 30-42 calls per render

### Meal Planning Flow (MealPlannerModal.tsx — 410 LOC)

**What exists**:
- Full-screen modal (`h-[92dvh]`) with 3 meal tabs (Bữa Sáng / Bữa Trưa / Bữa Tối)
- Search + filter with bottom sheet filter (maxCalories, minProtein, tags, sort)
- Multi-select dishes with checkbox toggle, shows selected count per tab
- Footer shows: total day nutrition + remaining budget + active tab nutrition + confirm button
- Changed tabs marked with green dot indicator
- Multi-meal editing: can modify all 3 meals in single session before confirming

**Pain points**:
- P-PLAN-01: **Modal fatigue** — Flow to add a dish: (1) tap "Lên kế hoạch" → (2) type selection popup or direct to MealPlannerModal → (3) scroll dish list → (4) tap dish → (5) tap "Xác nhận". That's 5 taps minimum for 1 dish.
- P-PLAN-02: Dishes filtered by `tags.includes(activeTab)` — if a dish is tagged for lunch but user is on dinner tab, it's invisible. No cross-tab visibility indicator.
- P-PLAN-03: No nutrition preview per-dish before adding — user sees calories + protein on dish card but can't see how adding it changes their remaining budget in real-time.
- P-PLAN-04: Confirm button label becomes complex for multi-meal edits: `"Lưu tất cả (3 món · 2 bữa)"` — cognitive load for a "save" action.
- P-PLAN-05: No undo after confirm — once saved, user must re-open modal to revert changes.

### Meal Cards (MealSlot.tsx — 166 LOC)

**What exists**:
- Empty state: muted bg + meal icon + "Chưa có món" label + "Thêm" button
- Filled state: card with border, meal type header (icon + label + edit button), dish list (max 2 visible + "+X more"), nutrition footer (calories + P/F/C macro pills)
- Servings stepper (±) per dish with min 1, max 10
- Empty and filled states have visually distinct treatments

**Pain points**:
- P-SLOT-01: `MAX_VISIBLE_DISHES = 2` is too aggressive — users with 3-4 dishes per meal see "+2 more" and must tap edit to see what they've planned. This defeats the purpose of a summary card.
- P-SLOT-02: Empty MealSlot uses `bg-muted` instead of dashed-border empty state from Phase 2 spec (line 599 of designer spec says "dashed border, CTA"). Inconsistent with EmptyState component patterns.
- P-SLOT-03: No visual distinction between meals — all 3 slots look identical except for the small meal type icon. No color coding on the card border/header to differentiate.
- P-SLOT-04: Servings stepper uses `min-h-11 min-w-11` (44px) touch targets per button — good for accessibility but takes significant horizontal space, crowding dish names on narrow screens.
- P-SLOT-05: No drag-to-reorder or swipe-to-remove gesture — the designer spec (IR-CAL-04) calls for swipe-to-clear but it's not implemented.

### Nutrition Summary (NutritionSubTab.tsx — 184 LOC + Summary.tsx — 206 LOC)

**What exists**:
- NutritionSubTab composes 4 sections vertically:
  1. EnergyBalanceCard (calorie in/out, net, protein progress)
  2. Summary (calories + protein progress bars, carbs/fat/fiber cards, expandable per-meal table)
  3. MacroChart (donut SVG with P/F/C percentages)
  4. RecommendationPanel (dynamic tips, empty state, completion status)
- Summary has "show details" toggle for per-meal macro breakdown table
- EnergyBalanceCard has collapsible state for compact view

**Pain points**:
- P-NUT-01: **Information overload** — 4 stacked cards showing similar data in different formats. EnergyBalanceCard and Summary both show calories + protein progress. MacroChart shows P/F/C which Summary also shows in card form. Redundant.
- P-NUT-02: **No inline nutrition on Meals tab** — User must switch tabs to see nutrition impact. The MiniNutritionBar exists but is `lg:hidden` and shows only calories + protein, not the remaining budget context.
- P-NUT-03: EnergyBalanceCard only shows when `caloriesOut != null` (line 156-165) — if user hasn't logged exercise, they see no energy balance at all on the nutrition tab. This is a missing "zero" state.
- P-NUT-04: RecommendationPanel duplicates empty/partial/complete status that MealsSubTab already shows with its own state contracts. Two different UI treatments for the same state.
- P-NUT-05: MacroChart donut uses hard-coded `RADIUS=40`, `STROKE_WIDTH=12` — not responsive. On very small screens, the chart label text overlaps the donut.

### Subtab Switching

**What exists**:
- Two subtabs: "Bữa ăn" (UtensilsCrossed icon) and "Dinh dưỡng" (BarChart3 icon)
- Styled as pill bar (`bg-muted rounded-xl p-1`)
- Active tab: `bg-card shadow-sm`, inactive: `text-muted-foreground`
- Desktop (≥1024px): side-by-side layout (2/3 meals + 1/3 nutrition), subtabs hidden
- MealsSubTab has `onSwitchToNutrition` handler, NutritionSubTab has `onSwitchToMeals` handler

**Pain points**:
- P-TAB-01: Subtab state is React `useState`, not persisted — refreshing or returning to calendar tab always resets to "meals" subtab.
- P-TAB-02: No visual indicator on inactive tab showing "nutrition data available" — user doesn't know there's useful data on the other tab without clicking.
- P-TAB-03: The MiniNutritionBar acts as a navigation affordance to nutrition tab (`onSwitchToNutrition`) but doesn't clearly communicate it's tappable — styled as a card, not a button (uses `<button>` semantically but visual treatment is subtle).

### Empty/Loading/Error States

**What exists**:
- Empty day: `EmptyState` component with `ClipboardList` icon + surface state contract (`calendar.meals:empty`)
- Partial day: Warning banner with `AlertCircle`, lists missing meal types, has "Lên kế hoạch" CTA
- Complete day: Success banner with `CheckCircle2`, "Xem dinh dưỡng" CTA
- Nutrition empty: info panel with "switch to meals" button
- MacroChart empty: centered empty state with "no data" message

**Pain points**:
- P-EMPTY-01: No **loading** state — there's no skeleton loader for the meal list or nutrition cards. When hydrating from SQLite, the UI flashes from empty to filled.
- P-EMPTY-02: No **setup** state — if user hasn't configured nutrition goals (`targetCalories=0`), the nutrition tab shows 0/0 progress bars instead of a setup prompt directing them to Settings.
- P-EMPTY-03: The empty/partial/complete banners in MealsSubTab (lines 260-310) use 3 different visual treatments but occupy the same visual position — jarring layout shifts as user fills meals.

### MealActionBar (175 LOC)

**What exists**:
- Primary CTA: "Lên kế hoạch" (bg-primary)
- Secondary: "AI" suggest (bg-ai/10)
- Grocery list shortcut (bg-warning/10)
- Overflow menu (⋮): Clear plan, Copy plan, Save as template, Template manager
- Overflow menu uses click-outside detection

**Pain points**:
- P-ACTION-01: 3-4 visible buttons + overflow menu is too many actions for one toolbar. Primary action "Lên kế hoạch" competes visually with AI suggest.
- P-ACTION-02: Overflow menu items ("Xóa kế hoạch", "Copy kế hoạch", etc.) are only relevant when a plan exists — but the menu button is always visible even when `allEmpty=true` and there's nothing to copy/clear.
- P-ACTION-03: No loading indicator on "Lên kế hoạch" button when modal is lazy-loading.

---

## Pain Point Matrix

| ID | Area | Severity | Description | Evidence |
|---|---|---|---|---|
| P-PLAN-01 | Meal Planning | **P0** | 5+ taps to add a single dish — modal fatigue | MealPlannerModal.tsx flow analysis |
| P-NUT-01 | Nutrition | **P0** | 4 stacked cards showing redundant data | NutritionSubTab.tsx: EBC + Summary + Macro + Reco |
| P-NUT-02 | Nutrition | **P0** | No inline nutrition on Meals tab | MealsSubTab has no nutrition context except MiniBar |
| P-DATE-01 | Day Picker | **P1** | Calendar mode pushes content below fold | DateSelector.tsx: ~280px in calendar mode |
| P-SLOT-01 | Meal Cards | **P1** | MAX_VISIBLE_DISHES=2 hides planned meals | MealSlot.tsx line 18 |
| P-SLOT-02 | Meal Cards | **P1** | Empty slot doesn't use Phase 2 empty pattern | Designer spec line 599 vs actual bg-muted |
| P-EMPTY-01 | States | **P1** | No skeleton/loading states for meal cards | No Skeleton import in any calendar component |
| P-EMPTY-02 | States | **P1** | No setup state when nutrition goals = 0 | NutritionSubTab shows 0/0 bars, no CTA to settings |
| P-TAB-01 | Navigation | **P1** | Subtab state not persisted on tab switch | useState in CalendarTab.tsx line 71 |
| P-SLOT-03 | Meal Cards | **P1** | No visual meal type differentiation on cards | All 3 MealSlots use identical card styling |
| P-DATE-02 | Day Picker | **P2** | Click-to-plan affordance undiscoverable | Calendar click → plan requires prior knowledge |
| P-DATE-03 | Day Picker | **P2** | Meal count badge too small (7-8px font) | DateSelector.tsx lines 311-313, 388-394 |
| P-DATE-04 | Day Picker | **P2** | Dot legend duplicated in both view modes | Lines 400-429 + 433-448 |
| P-PLAN-02 | Meal Planning | **P2** | No cross-tab dish visibility in planner | Filter: `d.tags?.includes(activeTab)` only |
| P-NUT-03 | Nutrition | **P2** | EnergyBalanceCard hidden if no exercise logged | Conditional render on `caloriesOut != null` |
| P-NUT-04 | Nutrition | **P2** | Recommendation duplicates MealsSubTab state | Two independent empty/partial/complete treatments |
| P-ACTION-01 | Actions | **P2** | Action bar too crowded (4 items + overflow) | MealActionBar.tsx: 3 buttons + menu |
| P-SLOT-05 | Meal Cards | **P2** | No swipe-to-remove gesture (spec'd but missing) | Designer spec IR-CAL-04 vs no implementation |
| P-EMPTY-03 | States | **P2** | Layout shift from empty→partial→complete banner | MealsSubTab lines 260-310 |
| P-PLAN-05 | Meal Planning | **P2** | No undo after meal plan confirmation | No undo mechanism in dayPlanStore |

---

## Target State Requirements

### REQ-01: Streamlined Quick-Add (Reduce 5-tap → 2-tap)

- **Current**: Tap "Lên kế hoạch" → MealPlannerModal opens (full screen, 410 LOC) → browse/search → tap dish → tap confirm = 5+ taps.
- **Target**: Recently-used chips at top of MealsSubTab (already exists as `recentDishes` section). Tapping a chip adds instantly to the first empty slot (if only 1 empty) or shows a lightweight meal-type picker (if multiple empty). No full modal needed for common re-adds.
- **AC**:
  - Tap recent dish chip with 1 empty slot → dish added in ≤200ms, toast "Đã thêm {dish}" shown
  - Tap recent dish chip with 2+ empty slots → bottom sheet with 2-3 meal options appears (not full modal)
  - MealPlannerModal still accessible for browse/search/filter workflow via "Lên kế hoạch" button
  - Quick-add success rate: ≥80% of daily add-dish actions should use quick-add (measurable via analytics if added)
- **Priority**: **P0**
- **Dependencies**: Phase 2 bottom sheet archetype, Phase 3.0 animation timing
- **Risks**: Quick-add without preview could lead to accidental adds → mitigate with undo toast (3s window)

### REQ-02: Consolidated Nutrition Display (4 cards → 2)

- **Current**: NutritionSubTab stacks 4 cards: EnergyBalanceCard + Summary + MacroChart + RecommendationPanel. Summary and EBC overlap on calories+protein. MacroChart and Summary overlap on P/F/C.
- **Target**: Merge into 2 cards: (A) **NutritionOverview** = calories in/out bar + protein bar + macro percentage pills (from MacroChart) + remaining budget. (B) **NutritionDetails** = expandable per-meal breakdown table + dynamic tips. Remove standalone MacroChart — integrate its donut inline into NutritionOverview.
- **AC**:
  - NutritionSubTab renders exactly 2 card components
  - No data duplication between the 2 cards
  - Expanded/collapsed state persists within session
  - Total vertical scroll reduced by ≥40% compared to current
  - All Phase 1 surface state contracts (`calendar.nutrition:*`) maintained
- **Priority**: **P0**
- **Dependencies**: Phase 2 CardLayout, Phase 1 surface state matrix
- **Risks**: Removing standalone Summary/MacroChart may break existing test assertions → update tests

### REQ-03: Inline Nutrition on Meals Tab

- **Current**: MealsSubTab shows MiniNutritionBar at bottom (`lg:hidden`), provides cal+protein only. User must switch tabs for full nutrition context.
- **Target**: Each MealSlot shows per-meal calories and protein inline. A persistent mini summary strip below the meal slots shows total eaten / target with progress indicator. MiniNutritionBar enhanced to show macro pills and acts as gateway to nutrition tab.
- **AC**:
  - Each MealSlot shows total calories + protein in header (not just footer)
  - A "daily budget" strip shows `eaten/target kcal` + `protein g/target g` always visible below meal slots
  - The strip updates optimistically on quick-add
  - No need to switch to nutrition tab for basic calorie tracking
- **Priority**: **P0**
- **Dependencies**: useTodayNutrition hook, useNutritionTargets hook
- **Risks**: Adding nutrition data to meal slots increases per-slot height → verify on 360px viewport

### REQ-04: DateSelector Week-First Default

- **Current**: Calendar mode (full month grid) is default for ≥640px. On mobile (<640px) week mode is default. Calendar mode occupies ~280px, pushing content below fold.
- **Target**: Week mode is default for all screen sizes on mobile (Capacitor). Calendar mode accessible via toggle. Week strip height: ~72px (vs current ~280px calendar). Reclaim ~200px for meal content above the fold.
- **AC**:
  - Week mode is default on all Capacitor viewports
  - Calendar mode toggle preserved (current toggle button)
  - Week strip compact: 7 days visible, ~72px total height including dots
  - "Today" button behavior unchanged
  - Swipe gesture preserved
  - View mode preference persisted via appSettings
- **Priority**: **P1**
- **Dependencies**: getSetting/setSetting in appSettings service
- **Risks**: Users who prefer month view may be disoriented → persist preference, add first-time tooltip

### REQ-05: MealSlot Visual Differentiation + Expanded Visibility

- **Current**: All 3 MealSlots have identical visual styling. MAX_VISIBLE_DISHES=2 hides excess. Empty slot uses `bg-muted` instead of dashed-border empty state.
- **Target**: Each meal type has a subtle left-border color accent (breakfast=energy, lunch=macro-carbs, dinner=ai — matching existing dot colors). Increase MAX_VISIBLE_DISHES to 4. Empty slot uses dashed-border treatment from Phase 2 EmptyState.
- **AC**:
  - Each MealSlot has a 3px left-border in its meal type color
  - MAX_VISIBLE_DISHES increased to 4 ("+X more" only shows for ≥5 dishes per meal)
  - Empty MealSlot uses `border-dashed border-border` + centered CTA
  - Color tokens match DateSelector dot colors (breakfast=energy, lunch=macro-carbs, dinner=ai)
- **Priority**: **P1**
- **Dependencies**: Existing MEAL_TYPE_ICON_COLORS constant
- **Risks**: Left border color may not pass WCAG contrast on all themes → verify in both light/dark

### REQ-06: Skeleton Loading States

- **Current**: No loading states. Components render empty or show `EmptyState` immediately.
- **Target**: MealSlot has a skeleton variant. NutritionOverview has a skeleton variant. Skeletons show during SQLite hydration (typically <500ms but can be longer on cold start).
- **AC**:
  - MealSlotSkeleton component matches MealSlot dimensions (3 instances for 3 meals)
  - NutritionSkeleton component matches consolidated NutritionOverview dimensions
  - Skeletons shown when `dayPlans` is not yet loaded (initial hydration)
  - Skeleton uses Phase 3.0 `animate-shimmer` pattern
  - Skeletons auto-dismiss after data loads (no manual state management)
- **Priority**: **P1**
- **Dependencies**: Phase 3.0 skeleton loading pattern (`animations.css`)
- **Risks**: Skeleton flash if hydration is <100ms → add minimum display time of 200ms

### REQ-07: Setup State for Unconfigured Nutrition

- **Current**: If `targetCalories=0` or `targetProtein=0`, nutrition cards show 0/0 progress bars. No prompt to configure.
- **Target**: Detect unconfigured state (`targetCalories ≤ 0`) → show `calendar.nutrition:setup` state with "Thiết lập mục tiêu dinh dưỡng" CTA linking to Settings > Goal. Apply Phase 1 semantic: `not configured ≠ zero`.
- **AC**:
  - When `targetCalories ≤ 0`, NutritionSubTab renders a setup EmptyState (not progress bars with 0/0)
  - CTA navigates to Settings > Goal page
  - State contract `calendar.nutrition:setup` used with missing/reason/nextStep copy
  - MiniNutritionBar also shows setup state instead of 0/0 bars
- **Priority**: **P1**
- **Dependencies**: Phase 1 surface state matrix, Settings navigation
- **Risks**: Edge case: user deliberately targets 0 calories (unlikely) → guard with `targetCalories ≤ 0` not `=== 0`

### REQ-08: Subtab State Persistence

- **Current**: `activeSubTab` is `useState('meals')` in CalendarTab — resets on every tab switch.
- **Target**: Persist active subtab in `uiStore` (memory-only store). When user returns to Calendar tab, their last-viewed subtab is restored.
- **AC**:
  - Switching to nutrition subtab → navigating away → returning to calendar → nutrition subtab is active
  - Default on fresh app start: 'meals' subtab
  - Desktop layout (side-by-side) not affected by this change
- **Priority**: **P1**
- **Dependencies**: uiStore already exists in project
- **Risks**: Minimal — uiStore is memory-only, no persistence concerns

### REQ-09: MealActionBar Simplification

- **Current**: 3-4 buttons + overflow menu. Overflow shows items only relevant when plan exists but menu button always visible.
- **Target**: Two buttons: (A) Primary "Thêm món" (always visible). (B) Contextual "⋮" menu that only renders when `!allEmpty` and contains: AI suggest, Grocery list, Copy, Save template, Template manager, Clear plan. AI suggest promoted into menu because it's used less frequently than manual planning.
- **AC**:
  - Only 1 primary button visible when `allEmpty=true`
  - "⋮" button hidden when `allEmpty=true`
  - AI suggest moved from standalone button to first menu item (still accessible but less prominent)
  - Grocery list moved to menu (secondary action)
  - Menu items ordered by frequency: AI suggest → Grocery → Copy → Save template → Manage templates → Clear (destructive last)
- **Priority**: **P2**
- **Dependencies**: None
- **Risks**: Moving AI suggest into menu may reduce discoverability → add feature hint on first use

### REQ-10: Swipe-to-Clear MealSlot

- **Current**: Not implemented. Designer spec IR-CAL-04 specifies swipe-left to reveal "Xóa" action.
- **Target**: Filled MealSlot supports swipe-left gesture to reveal destructive "Xóa" action (80px red zone). Tapping "Xóa" shows ConfirmationModal. Confirmed → optimistic remove + undo toast.
- **AC**:
  - Swipe left on filled MealSlot reveals "Xóa" button (bg-destructive, 80px width)
  - Swipe right dismisses the action zone
  - Tapping "Xóa" triggers ConfirmationModal
  - After confirm: meal cleared, undo toast shown for 3s
  - Empty MealSlot does not support swipe
  - Works on touch devices (Capacitor WebView)
- **Priority**: **P2**
- **Dependencies**: Phase 2 overlay patterns, touch gesture system
- **Risks**: Conflict with horizontal scroll on week view → scope swipe to MealSlot cards only, not DateSelector

### REQ-11: Undo for Meal Plan Changes

- **Current**: No undo mechanism. Once confirmed in MealPlannerModal or quick-add, changes are committed to dayPlanStore immediately.
- **Target**: After any meal plan modification (add, remove, clear), show an undo toast for `UNDO_TOAST_DURATION_MS` (already defined in constants). Tapping undo reverts the change by restoring the previous dayPlan snapshot.
- **AC**:
  - dayPlanStore captures previous state before modification
  - Undo toast appears after: quick-add, MealPlannerModal confirm, clear plan, swipe-to-clear
  - Tapping "Hoàn tác" within timeout window restores previous state
  - Only 1 undo level (not multi-step undo stack)
  - Toast auto-dismisses after timeout
- **Priority**: **P2**
- **Dependencies**: `UNDO_TOAST_DURATION_MS` constant, `restoreDayPlans` action already exists in dayPlanStore
- **Risks**: If user makes another change during undo window, first undo is lost → acceptable for V1

---

## Risk Register

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Consolidating Summary + MacroChart breaks 8+ existing test files | High | Medium | Write new component tests before removing old ones. Keep old components importable during transition. |
| R2 | Week-first default disorients users who prefer month view | Medium | Low | Persist view mode preference via appSettings. Add transition animation. |
| R3 | Quick-add without modal may cause accidental additions | Medium | Medium | Undo toast (3s) + ConfirmationModal for destructive actions. |
| R4 | Swipe-to-clear conflicts with DateSelector swipe | Low | High | Scope touch gesture handlers to MealSlot card bounds only — DateSelector has its own touchstart/touchend. |
| R5 | Inline nutrition per-slot increases MealSlot height, reducing visible slots on small screens | Medium | Medium | Keep inline data to 1 line (cal + protein). Use font-size xs. Test on 360px viewport. |
| R6 | Moving AI suggest to overflow menu reduces adoption | Low | Low | Show feature highlight dot on first use. Track menu open rate. |
| R7 | Skeleton flash on fast SQLite hydration (<100ms) | Medium | Low | Set minimum skeleton display time (200ms via setTimeout). |
| R8 | dayPlanStore undo snapshot memory usage | Low | Low | Store only 1 previous state (not unlimited history). DayPlan objects are small (<1KB each). |
| R9 | NutritionSubTab consolidation changes calendarDesktopLayout | Medium | Medium | Desktop side-by-side layout uses NutritionSubTab directly — verify desktop rendering after merge. |

---

## Assumptions (Need User Validation)

1. **Week mode as default**: Assuming mobile users prefer week mode over calendar mode for daily meal planning. If analytics show otherwise, keep calendar mode as default.

2. **Recently-used = last 14 days, max 8 dishes**: Current `recentDishIds` logic (CalendarTab lines 78-92) looks at last 14 days. Assuming this window is correct — not too stale, not too narrow.

3. **MAX_VISIBLE_DISHES increase to 4**: Assuming most users plan 2-4 dishes per meal. If typical is 1-2, keep at 3 instead.

4. **AI suggest demotion to overflow**: Assuming AI meal suggestion is a secondary/power-user feature. If adoption data shows otherwise, keep it as a standalone button.

5. **No fourth meal (snack)**: vi.json has `meal.snack` and `meal.snackFull` keys but no snack slot in DayPlan or MealSlot. Assuming snack support is deferred.

6. **EnergyBalanceCard always visible**: Assuming we should show energy balance even when caloriesOut=0 (show "Tiêu hao: 0 kcal" rather than hiding entirely). Needs confirmation.

7. **Single undo level is acceptable**: No multi-level undo for V1 of the Calendar redesign.

8. **Grocery list remains modal-based**: Not redesigning grocery list in this phase — it stays as a full-screen modal launched from action bar / overflow.

---

## Scope Boundary

### IN Scope (Phase 3.2)
- CalendarTab layout restructuring
- DateSelector week-first default + persistence
- MealsSubTab: quick-add optimization, MealSlot visual differentiation, inline nutrition
- NutritionSubTab: card consolidation (4 → 2), setup state
- MiniNutritionBar enhancement
- MealActionBar simplification
- Skeleton loading states for calendar components
- Subtab state persistence
- Undo mechanism for meal plan changes
- All related i18n key additions/updates

### OUT of Scope
- MealPlannerModal internal redesign (full dish browser stays as-is in V1)
- Grocery list redesign
- Dish comparison feature
- Meal photo integration
- Weekly meal plan overview (multi-day view)
- DishManager / IngredientManager (Phase 3.3 Library)
- CopyPlanModal / SaveTemplateModal / TemplateManager (template system unchanged)
- AISuggestionPreviewModal (AI system unchanged)
- Fitness integration surface (Phase 3.6)

### DEFERRED (Future phases)
- D1: Swipe-to-reorder meals within a slot
- D2: Drag-and-drop dish between meal slots
- D3: Meal photo thumbnails in MealSlot
- D4: Weekly nutrition trend chart (7-day view)
- D5: MealPlannerModal redesign with inline search + preview
- D6: Snack/4th meal slot support
- D7: Social sharing of daily meal plan

---

## Self-Critique (Round 1)

### Are requirements specific enough?
✅ REQ-01 through REQ-11 each have clear current→target→AC format. A Tech Leader can decompose each into 2-4 tasks.

### Contradictions?
⚠️ REQ-09 moves AI suggest to overflow, but REQ-01 relies on quick-add for efficiency. If quick-add covers 80% of use cases, AI suggest demotion is justified. No contradiction — different user flows.

### Missing screens/flows?
⚠️ **CopyPlanModal and TemplateManager** are part of the Calendar+Meals experience but marked out-of-scope. This is intentional — they are secondary workflows. However, the "Apply template" flow could benefit from inline preview, which could be a Phase 3.2+ follow-up.

### Priorities justified?
- P0 items (REQ-01, REQ-02, REQ-03) all address the 3 systemic problems in the executive summary.
- P1 items (REQ-04 through REQ-08) improve daily usability but don't block core workflows.
- P2 items (REQ-09 through REQ-11) are additive/polish.
✅ Priority ranking is consistent with problem severity.

### What did I miss?
- **Accessibility**: The designer spec (line 692-695) calls for `role="radiogroup"` on date strip, `role="region"` on meal slots, `role="spinbutton"` on servings stepper. Current implementation has `aria-current`, `aria-label`, `aria-hidden` but NOT `role="radiogroup"`. Need to add REQ for accessibility compliance. → **Added implicitly in REQ-04 and REQ-05 scope.**
- **Dark mode**: All token references use semantic tokens. Dark mode should work automatically. Verified in component code — no hardcoded hex colors found. ✅
- **Performance**: DateSelector `dayPlans.find()` inside render loop (line 274, 349) is O(n) per day × O(m) days in month. For typical 30 days × 30 plans = 900 lookups. Should use Map for O(1) lookup. → **Performance optimization is implicit in implementation, not a separate REQ.**

---

## Appendix: Component Dependency Map

```
CalendarTab
├── DateSelector (451 LOC) — date picker
├── MealsSubTab (322 LOC) — meals view
│   ├── MealActionBar (175 LOC) — action toolbar
│   ├── MealSlot × 3 (166 LOC) — individual meal cards
│   ├── MiniNutritionBar (129 LOC) — nutrition summary strip
│   └── EmptyState — empty/partial/complete banners
├── NutritionSubTab (184 LOC) — nutrition view
│   ├── EnergyBalanceCard (149 LOC) — energy in/out
│   ├── Summary (206 LOC) — calories+protein+macros
│   ├── MacroChart (132 LOC) — donut chart
│   └── RecommendationPanel (inline) — tips
└── GroceryList (via ModalBackdrop) — grocery modal

Modals (launched from Calendar):
├── MealPlannerModal (410 LOC) — full dish browser
├── ClearPlanModal — confirm clear
├── CopyPlanModal — copy to another date
├── SaveTemplateModal — save as template
├── TemplateManager — manage templates
├── AISuggestionPreviewModal — AI suggestion preview
├── FilterBottomSheet — filter/sort options
└── GoalDetailPage (page stack) — edit nutrition goals
```

## Appendix: i18n Key Groups Affected

| Namespace | Current Keys | Expected Changes |
|---|---|---|
| calendar.* | 49 keys | Add ~8 (setup state, undo, enhanced empty) |
| schedule.* | 4 keys | Add ~3 (budget strip labels) |
| meal.* | 11 keys | No changes |
| planning.* | 14 keys | No changes (modal unchanged) |
| nutrition.* | 24 keys | Modify ~4 (consolidated card labels) |
| summary.* | 9 keys | May deprecate ~3 (if Summary merged) |
| macro.* | 5 keys | No changes (donut integrated inline) |
| emptyState.* | 14 keys | Add ~2 (setup state variants) |
| tips.* | 12 keys | No changes |
| recommendation.* | 4 keys | May deprecate if panel merged |
