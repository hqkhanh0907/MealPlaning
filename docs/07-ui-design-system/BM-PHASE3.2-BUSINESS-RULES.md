# Phase 3.2: Calendar + Meals — Business Rules & User Stories

> **Version**: 1.0  
> **Date**: 2026-07-18  
> **Author**: BM Agent  
> **Status**: REVIEW_READY  
> **Input**: CEO-PHASE3.2-CALENDAR-ANALYSIS.md  
> **Code Verification**: All 7 source files inspected + dayPlanStore + uiStore + constants

---

## Code Verification Summary

Before writing stories, the following CEO claims were verified against source code:

| CEO Claim                                                   | Source                      | Verified                                           |
| ----------------------------------------------------------- | --------------------------- | -------------------------------------------------- |
| MAX_VISIBLE_DISHES = 2                                      | MealSlot.tsx:18             | ✅ Confirmed                                       |
| Empty slot uses `bg-muted` (no dashed border)               | MealSlot.tsx:61             | ✅ Confirmed                                       |
| All 3 MealSlots identical styling                           | MealSlot.tsx:86             | ✅ Confirmed — no type-specific border color       |
| DateSelector defaults calendar ≥640px                       | DateSelector.tsx:106-108    | ✅ Confirmed                                       |
| `dayPlans.find()` in render loop                            | DateSelector.tsx:274,349    | ✅ Confirmed — O(n) per day                        |
| `activeSubTab` = `useState('meals')`, not persisted         | CalendarTab.tsx:71          | ✅ Confirmed                                       |
| MealActionBar 3 visible buttons + overflow                  | MealActionBar.tsx:98-131    | ✅ Confirmed — "Thêm món" + AI + Grocery + ⋮       |
| Overflow visible when `!allEmpty` (clear/copy/save guarded) | MealActionBar.tsx:56-95     | ✅ But TemplateManager always pushed (line 86)     |
| NutritionSubTab 4 stacked cards                             | NutritionSubTab.tsx:155-179 | ✅ Confirmed                                       |
| EnergyBalanceCard conditional on `caloriesOut != null`      | NutritionSubTab.tsx:156     | ✅ Confirmed                                       |
| MiniNutritionBar `lg:hidden`                                | MiniNutritionBar.tsx:61     | ✅ Confirmed                                       |
| `restoreDayPlans` exists in dayPlanStore                    | dayPlanStore.ts:74,112-117  | ✅ Confirmed — merges snapshot with existing plans |
| `UNDO_TOAST_DURATION_MS = 6000`                             | constants.ts:60             | ✅ Confirmed — 6 seconds                           |
| uiStore exists but no calendar subtab                       | uiStore.ts:13-21            | ✅ Confirmed — only `ManagementSubTab`             |
| Quick-add partially implemented                             | MealsSubTab.tsx:186-230     | ✅ Recent chips + dropdown for multi-slot          |
| recentDishIds: last 14 days, max 8                          | CalendarTab.tsx:78-92       | ✅ Confirmed                                       |

### Discrepancy Found

**Color token mismatch**: CEO says MealSlot borders should use "breakfast=energy, lunch=macro-carbs, dinner=ai" (DateSelector dot colors). But `MEAL_TYPE_ICON_COLORS` uses separate tokens: `text-meal-breakfast` (amber-500), `text-meal-lunch` (emerald-500), `text-meal-dinner` (violet-500). DateSelector dots use `bg-energy` (yellow-green), `bg-macro-carbs` (emerald), `bg-ai` (violet). **Breakfast colors differ**: amber vs yellow-green. See **OQ-01** in Open Questions.

---

## Traceability Matrix

| REQ                             | Priority | User Stories         | Business Rules      | Edge Cases          |
| ------------------------------- | -------- | -------------------- | ------------------- | ------------------- |
| REQ-01 Quick-Add                | P0       | US-3.2-01, US-3.2-02 | BR-01, BR-02, BR-03 | EC-01 through EC-07 |
| REQ-02 Nutrition Consolidation  | P0       | US-3.2-03, US-3.2-04 | BR-04, BR-05        | EC-08 through EC-12 |
| REQ-03 Inline Nutrition         | P0       | US-3.2-05, US-3.2-06 | BR-06, BR-07        | EC-13 through EC-16 |
| REQ-04 Week-First Default       | P1       | US-3.2-07            | BR-08, BR-09        | EC-17 through EC-20 |
| REQ-05 MealSlot Differentiation | P1       | US-3.2-08, US-3.2-09 | BR-10, BR-11, BR-12 | EC-21 through EC-24 |
| REQ-06 Skeleton Loading         | P1       | US-3.2-10            | BR-13, BR-14        | EC-25 through EC-28 |
| REQ-07 Setup State              | P1       | US-3.2-11            | BR-15, BR-16        | EC-29 through EC-31 |
| REQ-08 Subtab Persistence       | P1       | US-3.2-12            | BR-17               | EC-32, EC-33        |
| REQ-09 ActionBar Simplification | P2       | US-3.2-13            | BR-18, BR-19        | EC-34 through EC-36 |
| REQ-10 Swipe-to-Clear           | P2       | US-3.2-14            | BR-20, BR-21        | EC-37 through EC-41 |
| REQ-11 Undo Mechanism           | P2       | US-3.2-15, US-3.2-16 | BR-22, BR-23, BR-24 | EC-42 through EC-47 |

---

## User Stories

### P0 Stories

---

#### US-3.2-01: Quick-Add Single Empty Slot

**As a** daily meal planner,  
**I want to** tap a recent dish chip and have it instantly added to the only empty meal slot,  
**so that** I can log meals in 2 taps instead of 5.

**Acceptance Criteria:**

- GIVEN the Meals subtab is visible AND exactly 1 meal slot is empty AND recent dishes section is visible  
  WHEN the user taps a recent dish chip  
  THEN the dish is added to the single empty slot within ≤200ms response time, AND a success toast "Đã thêm {dishName} vào {mealType}" is shown, AND the MealSlot updates to filled state immediately (optimistic update)

- GIVEN the Meals subtab is visible AND exactly 1 meal slot is empty  
  WHEN the user taps a recent dish chip  
  THEN an undo toast appears for `UNDO_TOAST_DURATION_MS` (6000ms) with "Hoàn tác" action

- GIVEN a quick-add has just completed  
  WHEN the user taps "Hoàn tác" on the undo toast  
  THEN the dish is removed from the slot, restoring previous state

**Edge Cases:**

- EC-01: User taps the same dish chip twice in rapid succession (<300ms) → Only 1 add should occur. Debounce/disable chip during add.
- EC-02: Quick-add triggers while offline SQLite write is pending → Optimistic update succeeds; DB write queued via `persistToDb`.
- EC-03: Dish has been deleted from dish library after appearing in recent chips → Chip should not render. Guard: filter `recentDishIds` against `dishes` map (already done in MealsSubTab.tsx:86-88).

**Impact:** High  
**Traces to:** REQ-01  
**Priority:** P0

---

#### US-3.2-02: Quick-Add Multiple Empty Slots

**As a** daily meal planner,  
**I want to** see a lightweight meal-type picker when I tap a recent dish chip and multiple slots are empty,  
**so that** I can choose which meal to add to without opening the full planner modal.

**Acceptance Criteria:**

- GIVEN the Meals subtab is visible AND 2+ meal slots are empty AND recent dishes section is visible  
  WHEN the user taps a recent dish chip  
  THEN a dropdown menu appears directly below the chip showing only the empty meal types (e.g., "Bữa Sáng", "Bữa Trưa") — NOT a bottom sheet, NOT the full MealPlannerModal

- GIVEN the dropdown is visible  
  WHEN the user taps a meal type option  
  THEN the dish is added to that slot within ≤200ms, the dropdown closes, and a success toast with undo is shown

- GIVEN the dropdown is visible  
  WHEN the user taps outside the dropdown  
  THEN the dropdown closes without adding anything

**Edge Cases:**

- EC-04: All 3 slots empty → Dropdown shows 3 options (Bữa Sáng / Bữa Trưa / Bữa Tối)
- EC-05: User quick-adds dish A to breakfast, then immediately taps dish B → Now only 2 empty slots remain. Dropdown recalculates correctly.
- EC-06: Recent dishes list has 0 items (new user, no history) → Entire recent dishes section is hidden. Quick-add unavailable. User must use "Thêm món" button.
- EC-07: Screen width 320px → Dropdown must not overflow viewport. Position: left-aligned to chip, clamp right edge to viewport - 16px.

**Impact:** High  
**Traces to:** REQ-01  
**Priority:** P0

---

#### US-3.2-03: Consolidated Nutrition Overview Card

**As a** nutrition-conscious user,  
**I want to** see my daily nutrition summary in 2 focused cards instead of 4 redundant ones,  
**so that** I can scan my nutrition status faster with less scrolling.

**Acceptance Criteria:**

- GIVEN the user views the Nutrition subtab  
  WHEN the tab renders  
  THEN exactly 2 card components are rendered: **NutritionOverview** and **NutritionDetails**

- GIVEN the NutritionOverview card renders  
  THEN it displays: (a) calories in/out progress bar, (b) protein progress bar, (c) macro percentage pills (P/F/C) — incorporating the donut chart data inline, (d) remaining calorie/protein budget text

- GIVEN the NutritionDetails card renders  
  THEN it displays: (a) expandable per-meal breakdown table (from current Summary), (b) dynamic nutrition tips (from current RecommendationPanel)

- GIVEN the user expands/collapses the NutritionDetails per-meal table  
  WHEN the user navigates away and returns within the same session  
  THEN the expanded/collapsed state is preserved (memory-only, not persisted)

- GIVEN the NutritionSubTab in the new consolidated layout  
  WHEN measuring total vertical scroll distance  
  THEN it is ≥40% less than the current 4-card layout for the same data

**Edge Cases:**

- EC-08: `caloriesOut` is null (no exercise logged) → NutritionOverview shows calories in + protein only, WITHOUT the "calories out / net" section. NOT hidden entirely — always render the card.
- EC-09: All meals empty → NutritionOverview shows 0/target with empty progress bars. NutritionDetails shows "no data" with CTA to switch to meals tab.
- EC-10: Desktop layout (≥1024px) uses NutritionSubTab in side-by-side mode → Verify consolidated cards render correctly in 1/3 column width.

**Impact:** High  
**Traces to:** REQ-02  
**Priority:** P0

---

#### US-3.2-04: Eliminate Nutrition Data Duplication

**As a** user reading my nutrition data,  
**I want** each piece of nutrition information displayed exactly once,  
**so that** I don't waste time cross-referencing redundant cards.

**Acceptance Criteria:**

- GIVEN the consolidated NutritionSubTab  
  WHEN inspecting rendered content  
  THEN total calories appears in exactly 1 location (NutritionOverview), total protein appears in exactly 1 location (NutritionOverview), P/F/C percentages appear in exactly 1 location (NutritionOverview macro pills), per-meal breakdown appears in exactly 1 location (NutritionDetails)

- GIVEN the old standalone `MacroChart` and `Summary` components  
  WHEN the Phase 3.2 implementation is complete  
  THEN these components are either removed or refactored into the new cards — no dead component files remain

**Edge Cases:**

- EC-11: Existing test assertions reference `Summary` or `MacroChart` by component name → All affected test files must be updated BEFORE removing old components.
- EC-12: Phase 1 surface state contracts (`calendar.nutrition:empty`, `calendar.nutrition:success`, etc.) → Must be preserved in new consolidated components. Verify each contract still fires.

**Impact:** Medium  
**Traces to:** REQ-02  
**Priority:** P0

---

#### US-3.2-05: Inline Nutrition on Meals Tab — Per-Meal Calories

**As a** user viewing my planned meals,  
**I want** to see per-meal calorie and protein totals directly on each MealSlot header,  
**so that** I can track nutrition without switching to the Nutrition tab.

**Acceptance Criteria:**

- GIVEN a MealSlot has dishes planned  
  WHEN the MealSlot renders  
  THEN the header row displays: meal type icon + label + **total calories** + **total protein** + edit button (left to right)

- GIVEN a MealSlot is empty  
  WHEN the MealSlot renders  
  THEN no nutrition data is shown in the header (only meal type icon + label + "Thêm" button)

**Edge Cases:**

- EC-13: Slot has 1 dish with 0 calories (e.g., water, tea) → Show "0 kcal" explicitly. Do NOT hide the nutrition display.
- EC-14: 360px viewport with long dish names → Nutrition data in header must not wrap to second line. Use truncation on meal label if needed. Nutrition always visible.

**Impact:** High  
**Traces to:** REQ-03  
**Priority:** P0

---

#### US-3.2-06: Daily Budget Strip on Meals Tab

**As a** calorie-tracking user,  
**I want** a persistent daily budget summary strip below the meal slots,  
**so that** I always know how much I've eaten vs. my target without switching tabs.

**Acceptance Criteria:**

- GIVEN the Meals subtab is visible AND user has configured nutrition targets (targetCalories > 0)  
  WHEN the page renders  
  THEN a "Daily Budget Strip" is visible below the meal slots showing: `eaten/target kcal` + `protein eaten/target g` + mini progress bar

- GIVEN the user quick-adds a dish  
  WHEN the dish is added  
  THEN the budget strip updates optimistically within the same render cycle

- GIVEN the user has NOT configured nutrition targets (targetCalories ≤ 0)  
  WHEN the Meals subtab renders  
  THEN the budget strip shows a setup prompt instead of 0/0 bars (see US-3.2-11)

**Edge Cases:**

- EC-15: User exceeds target → Budget strip shows negative remaining in `text-destructive` color: "Vượt: X kcal" (existing pattern from MiniNutritionBar.tsx:85-86).
- EC-16: MiniNutritionBar (existing component) overlap — If budget strip replaces MiniNutritionBar's role, ensure MiniNutritionBar is either removed or its CTA behavior ("tap to switch to nutrition") is preserved on the budget strip.

**Impact:** High  
**Traces to:** REQ-03  
**Priority:** P0

---

### P1 Stories

---

#### US-3.2-07: Week-First Default on Mobile

**As a** mobile user,  
**I want** the DateSelector to default to week view on all Capacitor viewports,  
**so that** I see more meal content above the fold.

**Acceptance Criteria:**

- GIVEN the app is running on a Capacitor platform (Android/iOS)  
  WHEN the DateSelector initializes for the first time  
  THEN view mode defaults to `week` regardless of screen width

- GIVEN the app is running on web (non-Capacitor)  
  WHEN the DateSelector initializes  
  THEN the existing logic applies: `week` for <640px, `calendar` for ≥640px

- GIVEN the user manually switches to `calendar` view mode  
  WHEN the user navigates away and returns to the Calendar tab  
  THEN the view mode preference is restored (persisted via `appSettings`)

- GIVEN the week view is active  
  WHEN measuring DateSelector height  
  THEN it is ≤80px (vs current ~280px calendar mode), reclaiming ≥200px for meal content

**Edge Cases:**

- EC-17: First-time user on 768px Capacitor device → Previously would get calendar mode. Now gets week mode. "Today" button and swipe gesture must work identically.
- EC-18: User clears app data (`pm clear`) → View preference lost, defaults to week mode again.
- EC-19: `getSetting(db, 'view_mode')` returns null/undefined (first use) → Treat as "week" on Capacitor, apply existing logic on web.
- EC-20: User is on web at 800px (calendar default), switches to week, then resizes to 400px → Week mode persists. No auto-switch on resize.

**Impact:** Medium  
**Traces to:** REQ-04  
**Priority:** P1

---

#### US-3.2-08: MealSlot Visual Differentiation

**As a** user scanning my daily meal plan,  
**I want** each meal slot to have a visually distinct color accent,  
**so that** I can instantly identify breakfast vs. lunch vs. dinner at a glance.

**Acceptance Criteria:**

- GIVEN a filled MealSlot renders  
  THEN it has a 3px left-border in its meal type color: breakfast = `meal-breakfast` (amber), lunch = `meal-lunch` (emerald), dinner = `meal-dinner` (violet)

- GIVEN an empty MealSlot renders  
  THEN it uses `border-dashed border-border` treatment with centered CTA text and icon — matching Phase 2 EmptyState pattern. No `bg-muted` fill.

- GIVEN meal type color tokens  
  WHEN rendered in both light and dark mode  
  THEN left-border colors pass WCAG 2.1 AA non-text contrast ratio (≥3:1) against the card background

**Edge Cases:**

- EC-21: Dark mode: `meal-breakfast` (amber-500) on dark card background → Verify contrast. Amber-500 typically passes on dark backgrounds.
- EC-22: Empty slot dashed border on very small screen (320px) → Dashed border must remain visible (minimum 1px dash).

**Impact:** Medium  
**Traces to:** REQ-05  
**Priority:** P1

---

#### US-3.2-09: Expanded Dish Visibility

**As a** user who plans 3-4 dishes per meal,  
**I want** to see up to 4 dishes without tapping "expand",  
**so that** I can review my full meal plan at a glance.

**Acceptance Criteria:**

- GIVEN a MealSlot has N dishes planned  
  WHEN N ≤ 4  
  THEN all N dishes are visible without "+X more" indicator

- GIVEN a MealSlot has N > 4 dishes planned  
  WHEN the MealSlot renders  
  THEN 4 dishes are visible AND a "+{N-4} more" indicator is shown

**Edge Cases:**

- EC-23: User has exactly 5 dishes → Shows 4 + "+1 thêm". Not "+1 more" — verify i18n key `quickPreview.more` handles count=1 correctly.
- EC-24: 360px viewport with 4 visible dishes + servings steppers → Total MealSlot height may push other slots below fold. Verify all 3 filled slots fit in a single scroll on 640px viewport.

**Impact:** Medium  
**Traces to:** REQ-05  
**Priority:** P1

---

#### US-3.2-10: Skeleton Loading States

**As a** user opening the Calendar tab,  
**I want** to see skeleton placeholders during data loading,  
**so that** I perceive the app as fast and don't see jarring empty→filled transitions.

**Acceptance Criteria:**

- GIVEN the app is hydrating dayPlans from SQLite (initial load)  
  WHEN MealsSubTab would render  
  THEN 3 MealSlotSkeleton components render, matching the dimensions of filled MealSlots

- GIVEN the app is hydrating nutrition data  
  WHEN NutritionSubTab would render  
  THEN NutritionSkeleton components render matching the consolidated NutritionOverview + NutritionDetails dimensions

- GIVEN hydration completes in <100ms (fast device)  
  THEN skeletons still display for a minimum of 200ms to prevent flash

- GIVEN skeletons are visible  
  THEN they use the Phase 3.0 `animate-shimmer` CSS animation pattern (note: this animation class does not yet exist — must be created)

**Edge Cases:**

- EC-25: SQLite hydration takes >2000ms (cold start with large dataset) → Skeleton remains until data loads. No timeout-to-error transition needed for <5s.
- EC-26: SQLite hydration fails (corrupt DB) → Skeleton should transition to error state, not remain indefinitely. Timeout after 5000ms → show error with retry CTA.
- EC-27: User switches between calendar↔library tabs rapidly → Skeleton should not re-appear if data is already hydrated (check store state, not loading flag).
- EC-28: `animate-shimmer` keyframe must be defined — it does not currently exist in the codebase. Phase 3.0 dependency.

**Impact:** Medium  
**Traces to:** REQ-06  
**Priority:** P1

---

#### US-3.2-11: Setup State for Unconfigured Nutrition

**As a** new user who hasn't set nutrition goals,  
**I want** to see a clear setup prompt instead of confusing 0/0 progress bars,  
**so that** I understand I need to configure my goals before tracking nutrition.

**Acceptance Criteria:**

- GIVEN `targetCalories ≤ 0` (unconfigured)  
  WHEN the NutritionSubTab renders  
  THEN it renders a setup EmptyState with surface contract `calendar.nutrition:setup`, title "Thiết lập mục tiêu dinh dưỡng", and CTA button

- GIVEN the setup EmptyState is visible  
  WHEN the user taps the CTA button  
  THEN the app navigates to Settings > Goal page (via `pushPage` to GoalDetailPage)

- GIVEN `targetCalories ≤ 0`  
  WHEN MiniNutritionBar (or its replacement Daily Budget Strip) renders  
  THEN it also shows a setup prompt instead of 0/0 progress bars

- GIVEN the user sets `targetCalories > 0` and returns to Calendar  
  THEN the setup state is replaced by actual nutrition progress display

**Edge Cases:**

- EC-29: `targetCalories = 0` vs `targetCalories = -1` vs `targetCalories = NaN` → All treated as "unconfigured". Rule: `!Number.isFinite(targetCalories) || targetCalories <= 0` → setup state.
- EC-30: User configures `targetCalories = 500` but `targetProtein = 0` → Show nutrition display for calories, but protein section shows "Chưa thiết lập" or target 0g. Do NOT show full setup state — partial configuration is valid.
- EC-31: Settings > Goal page uses `pushPage()` → Verify CalendarTab is NOT unmounted (it's in the tab background, not replaced). State should survive navigation.

**Impact:** Medium  
**Traces to:** REQ-07  
**Priority:** P1

---

#### US-3.2-12: Subtab State Persistence

**As a** user who frequently switches between Calendar and other tabs,  
**I want** my last-viewed subtab (Meals or Nutrition) to be remembered,  
**so that** I don't have to re-navigate every time I return to Calendar.

**Acceptance Criteria:**

- GIVEN the user is on the Calendar Nutrition subtab  
  WHEN the user navigates to another tab (e.g., Library) and returns to Calendar  
  THEN the Nutrition subtab is still active

- GIVEN a fresh app start (cold launch)  
  WHEN the Calendar tab loads for the first time  
  THEN the default subtab is 'meals'

- GIVEN the desktop layout (≥1024px, side-by-side)  
  WHEN subtab persistence is active  
  THEN it has no effect — desktop shows both panels simultaneously

**Edge Cases:**

- EC-32: User is on Nutrition subtab → force-stop app → relaunch → subtab resets to 'meals' (uiStore is memory-only, expected behavior).
- EC-33: User reduces browser from desktop (1200px) to mobile (500px) → Layout switches to tabbed mode. Which subtab shows? Use persisted value from uiStore if exists, else 'meals'.

**Impact:** Low  
**Traces to:** REQ-08  
**Priority:** P1

---

### P2 Stories

---

#### US-3.2-13: MealActionBar Simplification

**As a** user planning meals,  
**I want** a cleaner action bar with only the primary action prominently visible,  
**so that** I'm not overwhelmed by too many buttons.

**Acceptance Criteria:**

- GIVEN `allEmpty = true` (no meals planned)  
  WHEN MealActionBar renders  
  THEN only 1 primary button "Thêm món" is visible. No overflow menu button rendered.

- GIVEN `allEmpty = false` (at least 1 meal planned)  
  WHEN MealActionBar renders  
  THEN 2 elements visible: (A) Primary "Thêm món" button, (B) "⋮" overflow menu

- GIVEN the overflow menu is open  
  THEN items ordered by frequency: AI suggest → Grocery list → Copy plan → Save template → Manage templates → Clear plan (destructive last)

**Edge Cases:**

- EC-34: AI suggest is loading (`isSuggesting = true`) → Show loading spinner on the AI menu item, not the primary button. Primary button remains interactive.
- EC-35: User has no copy/save/template handlers passed (optional props) → Those menu items simply don't render. Menu adapts.
- EC-36: First-time user sees AI suggest in menu → Consider a feature highlight dot (visual hint) on the "⋮" button to indicate new items inside. Implementation deferred if complex.

**Impact:** Low  
**Traces to:** REQ-09  
**Priority:** P2

---

#### US-3.2-14: Swipe-to-Clear MealSlot

**As a** user who wants to quickly remove a planned meal,  
**I want** to swipe left on a filled meal slot to reveal a delete action,  
**so that** I can clear a meal without opening menus.

**Acceptance Criteria:**

- GIVEN a filled MealSlot (hasDishes = true)  
  WHEN the user swipes left ≥80px  
  THEN a destructive "Xóa" button (80px width, bg-destructive, white text) is revealed behind the card

- GIVEN the destructive zone is revealed  
  WHEN the user swipes right or taps elsewhere  
  THEN the zone hides (card slides back to original position)

- GIVEN the destructive zone is revealed  
  WHEN the user taps "Xóa"  
  THEN a ConfirmationModal appears: "Xóa bữa {mealType}?" with Confirm/Cancel

- GIVEN the user confirms deletion  
  THEN all dishes are removed from that meal slot, undo toast shown for 6000ms

- GIVEN an empty MealSlot  
  WHEN the user attempts to swipe  
  THEN nothing happens (swipe gesture disabled on empty slots)

**Edge Cases:**

- EC-37: User swipes on MealSlot while DateSelector week-view swipe is also active → Scope touch handlers to MealSlot card bounds. If touch starts within MealSlot, it's a MealSlot swipe. If touch starts within DateSelector, it's a navigation swipe. Use `event.stopPropagation()` if within MealSlot.
- EC-38: User swipes diagonally (45° angle) → Only trigger horizontal swipe if `|diffX| > |diffY|` AND `|diffX| > 50px` (same logic as DateSelector.tsx:200).
- EC-39: Swipe on very narrow screen (320px) → 80px reveal zone = 25% of screen. Card shifts left by 80px. Verify card content doesn't get clipped beyond viewport.
- EC-40: User swipes to reveal "Xóa", then scrolls the page → "Xóa" zone should auto-close on scroll start.
- EC-41: Multiple MealSlots have swipe zones open simultaneously → Only 1 zone open at a time. Opening a new one closes the previous.

**Impact:** Low  
**Traces to:** REQ-10  
**Priority:** P2

---

#### US-3.2-15: Undo for Meal Plan Changes

**As a** user who accidentally modified my meal plan,  
**I want** to undo the last change within a brief window,  
**so that** I can recover from mistakes without re-planning.

**Acceptance Criteria:**

- GIVEN the user performs any meal plan modification (quick-add, MealPlannerModal confirm, clear plan, swipe-to-clear)  
  WHEN the modification is committed to dayPlanStore  
  THEN: (a) dayPlanStore captures a snapshot of the affected date's plan BEFORE the modification, (b) an undo toast appears with "Hoàn tác" action button, (c) toast auto-dismisses after `UNDO_TOAST_DURATION_MS` (6000ms)

- GIVEN the undo toast is visible  
  WHEN the user taps "Hoàn tác"  
  THEN `restoreDayPlans(snapshot)` is called, reverting the change, and a confirmation toast "Đã hoàn tác" appears

- GIVEN the undo toast is visible  
  WHEN the toast auto-dismisses (timeout)  
  THEN the snapshot is discarded, the change is finalized

**Edge Cases:**

- EC-42: User makes change A → undo toast shows → user makes change B within 6s → Change A's undo is LOST. Only change B can be undone. Single-level undo only.
- EC-43: User taps undo → `restoreDayPlans` called → but the restored plan references a dish that was deleted between change and undo → DayPlan restored with orphan dishId. MealSlot handles gracefully: `resolvedDishes` filters out unresolved IDs (MealSlot.tsx:42).
- EC-44: App backgrounded during undo window → Toast timer continues. If user returns after 6s, toast is gone, change is finalized.

**Impact:** Low  
**Traces to:** REQ-11  
**Priority:** P2

---

#### US-3.2-16: Undo State Management

**As a** developer implementing undo,  
**I want** clear state management rules for the undo snapshot,  
**so that** memory usage is bounded and behavior is predictable.

**Acceptance Criteria:**

- GIVEN the undo mechanism is active  
  THEN only 1 undo level exists (no undo stack, no redo)

- GIVEN a snapshot is captured  
  THEN it contains only the affected date's DayPlan (not the entire dayPlans array)

- GIVEN the undo window expires  
  THEN the snapshot reference is set to null (eligible for garbage collection)

**Edge Cases:**

- EC-45: User changes date while undo toast is active → Undo should still work. The snapshot references a specific date, not the "currently viewed" date.
- EC-46: User changes settings (weight, goal) while undo toast is active → Undo only reverts the meal plan change, NOT the settings change.
- EC-47: `restoreDayPlans` merges snapshot with existing plans (dayPlanStore.ts:113-114) → If another date's plan was modified during the undo window, that modification is preserved.

**Impact:** Low  
**Traces to:** REQ-11  
**Priority:** P2

---

## Business Rules

### Quick-Add Rules (REQ-01)

```
BR-3.2-01: Quick-Add Target Slot Selection
Rule: When quick-add is triggered and exactly 1 empty meal slot exists,
      the dish is auto-assigned to that slot without user selection.
      When 2+ empty slots exist, a dropdown appears with only the empty
      slot options. When 0 empty slots exist, quick-add is unavailable
      (recent dishes section hidden).
Applies to: MealsSubTab recent dishes chips
Validation: Count empty slots = MEAL_TYPES.filter(t => dayNutrition[t].dishIds.length === 0)
Traces to: REQ-01
```

```
BR-3.2-02: Recent Dishes Source & Limits
Rule: Recent dishes are sourced from dayPlans within the last 14 days
      relative to selectedDate, max 8 unique dish IDs, ordered by most
      recent usage. Only dishes that still exist in the dish library
      are shown (filter against `dishes` Map).
Applies to: CalendarTab recentDishIds computation
Validation: CalendarTab.tsx lines 78-92 (already implemented)
Traces to: REQ-01
```

```
BR-3.2-03: Quick-Add Optimistic Update
Rule: Quick-add writes to dayPlanStore immediately (optimistic). UI updates
      in the same render cycle. SQLite persistence happens async via
      persistToDb. Failure is logged but does NOT rollback the UI change
      (offline-first pattern).
Applies to: dayPlanStore.updatePlan, MealsSubTab
Validation: Verify updatePlan calls set() before DB write
Traces to: REQ-01
```

### Nutrition Consolidation Rules (REQ-02)

```
BR-3.2-04: Nutrition Card Count
Rule: NutritionSubTab renders exactly 2 card components. No data point
      appears in more than 1 card. The 2 cards are:
      (A) NutritionOverview: calories in/out, protein, macro % pills, budget
      (B) NutritionDetails: per-meal breakdown table (expandable), tips
Applies to: NutritionSubTab
Validation: DOM inspection shows exactly 2 direct card children.
            No duplicate data-testid for nutrition values.
Traces to: REQ-02
```

```
BR-3.2-05: Surface State Contract Preservation
Rule: All Phase 1 surface state contracts for calendar.nutrition must be
      maintained in the new consolidated components:
      - calendar.nutrition:empty
      - calendar.nutrition:setup (new — REQ-07)
      - calendar.nutrition:partial
      - calendar.nutrition:success
Applies to: NutritionOverview, NutritionDetails
Validation: Each contract fires at the correct state transition
Traces to: REQ-02, REQ-07
```

### Inline Nutrition Rules (REQ-03)

```
BR-3.2-06: MealSlot Header Nutrition Display
Rule: Filled MealSlots display total calories and total protein in the
      header row, positioned after the meal label and before the edit button.
      Format: "{calories} kcal · {protein}g" in text-muted-foreground, text-xs.
      Empty MealSlots do NOT show nutrition in header.
Applies to: MealSlot component (filled state only)
Validation: Header contains calories + protein text nodes. Empty slot has no
            nutrition text.
Traces to: REQ-03
```

```
BR-3.2-07: Daily Budget Strip Behavior
Rule: A persistent budget strip below meal slots shows:
      - Eaten: totalCal/targetCal kcal + progress bar
      - Protein: totalPro/targetPro g + progress bar
      - Updates optimistically on any meal change
      - Shows "setup" prompt when targetCalories ≤ 0 (see BR-3.2-15)
      - Visible on mobile only (replaces or enhances MiniNutritionBar)
Applies to: MealsSubTab layout (new component or enhanced MiniNutritionBar)
Validation: Budget strip values match dayNutrition totals. Updates after quick-add.
Traces to: REQ-03
```

### DateSelector Rules (REQ-04)

```
BR-3.2-08: Default View Mode Selection
Rule: On Capacitor platforms (detected via Capacitor.isNativePlatform()),
      the default view mode is always 'week'. On web, the existing logic
      applies (week for <640px, calendar for ≥640px). If user has a
      persisted preference (appSettings key 'calendar_view_mode'), use that
      preference regardless of platform or screen width.
Applies to: DateSelector initialization
Validation: Capacitor device always starts in week mode. Persisted preference
            overrides default.
Traces to: REQ-04
```

```
BR-3.2-09: View Mode Persistence
Rule: When user manually toggles view mode, persist the choice via
      setSetting(db, 'calendar_view_mode', mode). On subsequent loads,
      read via getSetting(db, 'calendar_view_mode'). Null/undefined =
      apply default rule (BR-3.2-08).
Applies to: DateSelector toggle button handler
Validation: Toggle → navigate away → return → same view mode active
Traces to: REQ-04
```

### MealSlot Differentiation Rules (REQ-05)

```
BR-3.2-10: Meal Type Color Mapping
Rule: Each meal type maps to a semantic color for left-border accent:
      - breakfast → border-meal-breakfast (amber-500)
      - lunch → border-meal-lunch (emerald-500)
      - dinner → border-meal-dinner (violet-500)
      These tokens already exist in index.css (--meal-breakfast, --meal-lunch,
      --meal-dinner). Use these, NOT the DateSelector dot colors (bg-energy,
      bg-macro-carbs, bg-ai) which have different hues for breakfast.
Applies to: MealSlot filled state, left border
Validation: Visual inspection in light + dark mode. WCAG 3:1 non-text contrast.
Traces to: REQ-05
```

```
BR-3.2-11: MAX_VISIBLE_DISHES Constant
Rule: MAX_VISIBLE_DISHES = 4 (increased from 2). The "+X more" indicator
      only shows when a meal has ≥5 dishes. The i18n key quickPreview.more
      must handle count=1 correctly (Vietnamese has no singular/plural
      distinction, but verify the key exists).
Applies to: MealSlot component
Validation: Slot with 4 dishes → all visible, no "+X". Slot with 5 → 4 + "+1".
Traces to: REQ-05
```

```
BR-3.2-12: Empty MealSlot Pattern
Rule: Empty MealSlot uses border-dashed border-border treatment (not
      bg-muted). Centered layout with meal icon + "Chưa có món" + "Thêm"
      CTA. Consistent with Phase 2 EmptyState component pattern.
Applies to: MealSlot empty state
Validation: DOM has border-dashed class, no bg-muted on empty slot container.
Traces to: REQ-05
```

### Skeleton Rules (REQ-06)

```
BR-3.2-13: Skeleton Display Condition
Rule: Skeletons display when dayPlanStore data has NOT been hydrated from
      SQLite (initial load). Once loadAll() completes, skeletons transition
      to real content. If hydration is <100ms, enforce minimum display time
      of 200ms (setTimeout) to prevent flash.
Applies to: MealsSubTab, NutritionSubTab
Validation: Track loading state in store or context. Skeleton→content transition
            is smooth (no layout shift).
Traces to: REQ-06
```

```
BR-3.2-14: Skeleton Dimensions
Rule: MealSlotSkeleton matches filled MealSlot height (approximately 120px
      per slot with 2-dish content). NutritionSkeleton matches consolidated
      NutritionOverview height. Skeletons use same border-radius (rounded-2xl)
      and card structure as real components.
Applies to: MealSlotSkeleton, NutritionSkeleton
Validation: Visual comparison — skeleton and real content same bounding box.
Traces to: REQ-06
```

### Setup State Rules (REQ-07)

```
BR-3.2-15: Unconfigured Detection Logic
Rule: Nutrition is considered "unconfigured" when:
      !Number.isFinite(targetCalories) || targetCalories <= 0
      This catches: 0, negative, NaN, Infinity, undefined (coerced).
      When unconfigured, ALL nutrition displays show setup state (Nutrition
      subtab, Daily Budget Strip, MiniNutritionBar).
Applies to: NutritionSubTab, MiniNutritionBar/BudgetStrip
Validation: targetCalories=0 → setup. targetCalories=-1 → setup. targetCalories=NaN → setup.
            targetCalories=500 → normal display.
Traces to: REQ-07
```

```
BR-3.2-16: Setup CTA Navigation
Rule: Setup state CTA navigates to Settings > Goal section, NOT to the
      onboarding flow. Use pushPage() with GoalDetailPage. CalendarTab
      must NOT unmount during this navigation.
Applies to: Setup EmptyState CTA button
Validation: Tap CTA → GoalDetailPage renders on page stack → Back returns to Calendar
Traces to: REQ-07
```

### Subtab Persistence Rules (REQ-08)

```
BR-3.2-17: Calendar Subtab State Storage
Rule: Add `activeCalendarSubTab: 'meals' | 'nutrition'` to uiStore (memory-only).
      CalendarTab reads/writes this state instead of local useState.
      Default: 'meals'. Desktop layout (isDesktop=true) ignores this value.
      On app restart, resets to 'meals' (memory-only store, not persisted).
Applies to: uiStore, CalendarTab
Validation: Switch to nutrition → navigate to Library → return → nutrition still active.
            Fresh app start → meals active.
Traces to: REQ-08
```

### ActionBar Rules (REQ-09)

```
BR-3.2-18: ActionBar Element Visibility
Rule: When allEmpty=true: only primary "Thêm món" button visible.
      When allEmpty=false: primary "Thêm món" + "⋮" overflow visible.
      Standalone AI suggest and Grocery buttons are removed from top-level.
Applies to: MealActionBar
Validation: allEmpty=true → 1 button. allEmpty=false → 2 buttons.
Traces to: REQ-09
```

```
BR-3.2-19: Overflow Menu Item Order
Rule: Menu items ordered by usage frequency (top to bottom):
      1. AI suggest (Sparkles icon)
      2. Grocery list (ShoppingCart icon)
      3. Copy plan (Copy icon) — only when !allEmpty
      4. Save as template (Save icon) — only when !allEmpty
      5. Manage templates (BookTemplate icon) — always
      6. Clear plan (Trash2 icon, text-destructive) — only when !allEmpty, ALWAYS LAST
Applies to: MealActionBar overflow menu
Validation: Menu item order matches spec. Destructive action is last.
Traces to: REQ-09
```

### Swipe-to-Clear Rules (REQ-10)

```
BR-3.2-20: Swipe Gesture Parameters
Rule: Swipe detection on filled MealSlot only. Minimum horizontal distance:
      50px. Must satisfy |diffX| > |diffY| (not diagonal). Left swipe reveals
      80px destructive zone. Right swipe or tap-outside dismisses zone.
      Touch handlers scoped to MealSlot card — do NOT capture events that
      start outside the card.
Applies to: MealSlot (filled state)
Validation: Swipe on DateSelector still works (not captured by MealSlot).
            Swipe on empty MealSlot does nothing.
Traces to: REQ-10
```

```
BR-3.2-21: Single Active Swipe Zone
Rule: At most 1 MealSlot can have its destructive zone revealed at any time.
      Opening a new zone auto-closes any previously open zone. Scrolling the
      page auto-closes any open zone.
Applies to: MealsSubTab swipe state management
Validation: Swipe breakfast open → swipe lunch → breakfast zone closes.
Traces to: REQ-10
```

### Undo Rules (REQ-11)

```
BR-3.2-22: Snapshot Capture Timing
Rule: Before ANY meal plan modification (quick-add, modal confirm, clear,
      swipe-clear), capture the current DayPlan for the affected date:
      snapshot = dayPlans.find(p => p.date === selectedDate) ?? null.
      Store snapshot in a ref or state outside dayPlanStore.
Applies to: CalendarTab / MealsSubTab modification handlers
Validation: After modification, snapshot !== current dayPlan state for that date.
Traces to: REQ-11
```

```
BR-3.2-23: Undo Window Behavior
Rule: Undo toast duration = UNDO_TOAST_DURATION_MS (6000ms). During this
      window, tapping "Hoàn tác" calls restoreDayPlans([snapshot]).
      After timeout, snapshot is set to null. Only 1 undo level — new
      modification during window replaces the snapshot.
Applies to: Undo toast lifecycle
Validation: Undo within 6s → reverts. After 6s → no undo available.
Traces to: REQ-11
```

```
BR-3.2-24: Undo Scope Isolation
Rule: Undo operates on a specific date's DayPlan only. It does NOT affect:
      - Other dates' plans
      - Settings changes (weight, goals)
      - Dish library changes
      restoreDayPlans merges the snapshot with existing plans — it replaces
      only the snapshot date, preserving all other dates.
Applies to: dayPlanStore.restoreDayPlans
Validation: dayPlanStore.ts:112-116 already implements this merge logic correctly.
Traces to: REQ-11
```

---

## Edge Case Register

| EC-ID | Story     | Description                              | Expected Behavior                                                        | Severity |
| ----- | --------- | ---------------------------------------- | ------------------------------------------------------------------------ | -------- |
| EC-01 | US-3.2-01 | Double-tap on chip within 300ms          | Only 1 dish added. Debounce click handler.                               | Medium   |
| EC-02 | US-3.2-01 | Quick-add during offline DB write        | Optimistic update succeeds; DB write queued.                             | Low      |
| EC-03 | US-3.2-01 | Deleted dish in recent chips             | Chip not rendered. Filter against dishes Map.                            | Medium   |
| EC-04 | US-3.2-02 | All 3 slots empty                        | Dropdown shows 3 options.                                                | Low      |
| EC-05 | US-3.2-02 | Sequential quick-adds                    | Dropdown recalculates empty slots dynamically.                           | Medium   |
| EC-06 | US-3.2-02 | 0 recent dishes (new user)               | Recent section hidden. Only "Thêm món" available.                        | Low      |
| EC-07 | US-3.2-02 | 320px viewport dropdown overflow         | Clamp dropdown right edge to viewport - 16px.                            | Medium   |
| EC-08 | US-3.2-03 | caloriesOut is null (no exercise)        | NutritionOverview renders without energy out section. Always shows card. | Medium   |
| EC-09 | US-3.2-03 | All meals empty                          | NutritionOverview shows 0/target. NutritionDetails shows "no data" CTA.  | Low      |
| EC-10 | US-3.2-03 | Desktop 1/3 column width                 | Verify consolidated cards don't overflow in narrow column.               | Medium   |
| EC-11 | US-3.2-04 | Test assertions reference old components | Update ALL test files before removing Summary/MacroChart.                | High     |
| EC-12 | US-3.2-04 | Surface state contracts lost             | Verify each calendar.nutrition:\* contract fires in new components.      | High     |
| EC-13 | US-3.2-05 | Dish with 0 calories                     | Show "0 kcal" explicitly. Don't hide.                                    | Low      |
| EC-14 | US-3.2-05 | 360px viewport + long dish name          | Truncate meal label. Nutrition always visible.                           | Medium   |
| EC-15 | US-3.2-06 | User exceeds calorie target              | Show negative remaining in text-destructive. "Vượt: X kcal".             | Low      |
| EC-16 | US-3.2-06 | MiniNutritionBar + BudgetStrip overlap   | Define clear relationship: replace, enhance, or keep both.               | High     |
| EC-17 | US-3.2-07 | 768px Capacitor device                   | Week mode default (not calendar). Swipe + Today work.                    | Low      |
| EC-18 | US-3.2-07 | pm clear → view preference lost          | Defaults to week on Capacitor.                                           | Low      |
| EC-19 | US-3.2-07 | First-use getSetting returns null        | Treat as default (week on Capacitor, existing logic on web).             | Low      |
| EC-20 | US-3.2-07 | Resize browser after mode switch         | Persisted preference holds. No auto-switch.                              | Low      |
| EC-21 | US-3.2-08 | Dark mode meal-breakfast contrast        | Verify amber-500 on dark card ≥ 3:1 contrast.                            | Medium   |
| EC-22 | US-3.2-08 | 320px dashed border visibility           | Minimum 1px dash visible.                                                | Low      |
| EC-23 | US-3.2-09 | Exactly 5 dishes per meal                | Shows 4 + "+1 thêm". Verify i18n count=1.                                | Low      |
| EC-24 | US-3.2-09 | 3 filled slots × 4 dishes on 640px       | Verify all content fits with reasonable scroll.                          | Medium   |
| EC-25 | US-3.2-10 | Hydration >2000ms (cold start)           | Skeleton persists until data loads.                                      | Low      |
| EC-26 | US-3.2-10 | Hydration fails (corrupt DB)             | Skeleton → error state after 5000ms. Retry CTA.                          | High     |
| EC-27 | US-3.2-10 | Rapid tab switching                      | Skeleton only on first hydration. Re-entering shows cached data.         | Medium   |
| EC-28 | US-3.2-10 | animate-shimmer missing                  | Must create CSS animation class as Phase 3.0 dependency.                 | High     |
| EC-29 | US-3.2-11 | targetCalories = NaN                     | Treated as unconfigured. Show setup state.                               | Medium   |
| EC-30 | US-3.2-11 | targetCalories > 0 but targetProtein = 0 | Partial config valid. Show calories, show "Chưa thiết lập" for protein.  | Medium   |
| EC-31 | US-3.2-11 | pushPage to GoalDetail                   | CalendarTab not unmounted. State survives navigation.                    | Low      |
| EC-32 | US-3.2-12 | Force-stop → relaunch                    | Subtab resets to 'meals' (memory-only store). Expected.                  | Low      |
| EC-33 | US-3.2-12 | Desktop→mobile resize                    | Use persisted uiStore value, else 'meals'.                               | Low      |
| EC-34 | US-3.2-13 | AI suggest loading state                 | Spinner on menu item, not primary button.                                | Low      |
| EC-35 | US-3.2-13 | Optional handlers not passed             | Menu items gracefully omit.                                              | Low      |
| EC-36 | US-3.2-13 | First-time AI highlight                  | Deferred if complex.                                                     | Low      |
| EC-37 | US-3.2-14 | Swipe conflict with DateSelector         | Scope to MealSlot bounds. stopPropagation if within card.                | High     |
| EC-38 | US-3.2-14 | 45° diagonal swipe                       | Only horizontal: \|diffX\| > \|diffY\| AND > 50px.                       | Low      |
| EC-39 | US-3.2-14 | 320px + 80px reveal zone                 | 25% screen used. Verify card not clipped.                                | Medium   |
| EC-40 | US-3.2-14 | Page scroll while zone open              | Auto-close zone on scroll start.                                         | Medium   |
| EC-41 | US-3.2-14 | Multiple zones open                      | Max 1 at a time. New open → old auto-closes.                             | Medium   |
| EC-42 | US-3.2-15 | Second change during undo window         | First undo lost. Only latest change undoable.                            | Medium   |
| EC-43 | US-3.2-15 | Undo references deleted dish             | MealSlot filters orphans via resolvedDishes (already handles).           | Low      |
| EC-44 | US-3.2-15 | App backgrounded during undo             | Timer continues. Return after 6s → no undo.                              | Low      |
| EC-45 | US-3.2-16 | Date change during undo window           | Undo still works. Snapshot tied to date, not view.                       | Medium   |
| EC-46 | US-3.2-16 | Settings change during undo window       | Undo reverts meal plan only. Settings untouched.                         | Low      |
| EC-47 | US-3.2-16 | restoreDayPlans merge behavior           | Only snapshot date replaced. Other dates preserved.                      | Low      |

---

## Open Questions (for CEO/User)

### OQ-01: Meal Type Color Token — Which System?

**Context:** CEO specifies MealSlot borders should use "breakfast=energy, lunch=macro-carbs, dinner=ai" (DateSelector dot colors). However, `MEAL_TYPE_ICON_COLORS` uses `text-meal-breakfast` (amber-500), `text-meal-lunch` (emerald-500), `text-meal-dinner` (violet-500) — a **different token family** with different hues for breakfast (amber vs yellow-green).

**Options:**

- (A) Use `meal-*` tokens (amber/emerald/violet) — consistent with MealSlot icons
- (B) Use `energy/macro-carbs/ai` tokens — consistent with DateSelector dots
- (C) Unify both systems to use `meal-*` tokens everywhere (including DateSelector dots)

**Recommendation:** Option A — use `meal-*` tokens for MealSlot borders. These are purpose-built for meal type identification. DateSelector dots are a different visual context.

**Impact:** Affects BR-3.2-10 and REQ-05 implementation.

### OQ-02: MiniNutritionBar vs Daily Budget Strip — Replace or Coexist?

**Context:** REQ-03 introduces a "Daily Budget Strip" below meal slots. MiniNutritionBar already exists at the bottom of MealsSubTab with similar data (cal+protein progress, macro pills, nudge text).

**Options:**

- (A) Replace MiniNutritionBar with Budget Strip (same position, enhanced content)
- (B) Keep MiniNutritionBar + add Budget Strip above it (redundant)
- (C) Evolve MiniNutritionBar into the Budget Strip (rename + enhance)

**Recommendation:** Option C — evolve MiniNutritionBar. It already has 80% of the required functionality. Add remaining budget text and setup state detection.

**Impact:** Affects US-3.2-06, BR-3.2-07, and EC-16.

### OQ-03: animate-shimmer Dependency

**Context:** REQ-06 specifies skeleton loading uses "Phase 3.0 `animate-shimmer` pattern", but this CSS class does not exist anywhere in the codebase. Is this a blocking dependency that must be created first, or can we use a simple `animate-pulse` (Tailwind built-in) as fallback?

**Recommendation:** Use Tailwind `animate-pulse` as initial implementation. If Phase 3.0 later provides `animate-shimmer`, migrate.

**Impact:** Affects US-3.2-10, BR-3.2-13, EC-28.

### OQ-04: EnergyBalanceCard — Always Visible or Conditional?

**Context:** Currently EnergyBalanceCard is hidden when `caloriesOut == null` (NutritionSubTab.tsx:156). CEO Assumption #6 says "show even when caloriesOut=0". Clarification needed:

- Show the card with "Tiêu hao: 0 kcal" when exercise not logged?
- Or only show when caloriesOut is explicitly 0 (not null)?

**Recommendation:** Show when `caloriesOut != null` (keep current logic). `null` means "no exercise tracking", `0` means "tracked but zero". This distinction matters.

**Impact:** Affects EC-08 and NutritionOverview component design.

### OQ-05: Snack Slot in Quick-Add

**Context:** CEO notes vi.json has `meal.snack` and `meal.snackFull` keys but no snack slot in DayPlan. If snack support is added in a future phase, will the quick-add dropdown need to include it? Should the current implementation use `MEAL_TYPES` constant (which only has 3) or be designed for extensibility?

**Recommendation:** Use `MEAL_TYPES` constant. When/if snack is added, adding to the constant auto-extends quick-add. No over-engineering now.

**Impact:** Affects BR-3.2-01 implementation.

### OQ-06: Partial Nutrition Configuration (targetProtein = 0)

**Context:** EC-30 identifies a case where calories are configured but protein is not. Current UI shows 0/0 protein bar. Should we:

- (A) Show protein as "Chưa thiết lập" label (no bar)
- (B) Show 0g target with normal bar (current behavior)
- (C) Hide protein section entirely

**Recommendation:** Option A — show "Chưa thiết lập" label for unconfigured individual metrics. This is consistent with the "not configured ≠ zero" principle from REQ-07.

**Impact:** Affects BR-3.2-15 and US-3.2-11.

---

## Self-Critique (Round 1)

### Coverage Check

✅ All 11 REQs covered by at least 1 user story (16 stories total)  
✅ REQ-01: 2 stories (single-slot + multi-slot)  
✅ REQ-02: 2 stories (consolidation + deduplication)  
✅ REQ-03: 2 stories (per-meal inline + budget strip)  
✅ REQ-04: 1 story  
✅ REQ-05: 2 stories (differentiation + visibility)  
✅ REQ-06: 1 story  
✅ REQ-07: 1 story  
✅ REQ-08: 1 story  
✅ REQ-09: 1 story  
✅ REQ-10: 1 story  
✅ REQ-11: 2 stories (user-facing + state management)

### AC Quality Check

✅ All ACs use GIVEN/WHEN/THEN format  
✅ All ACs have measurable outcomes (pixel values, ms timing, component counts)  
⚠️ US-3.2-03 AC for "≥40% less scroll" is difficult to automate — but can be measured manually

### Edge Case Quality Check

✅ 47 edge cases across 16 stories (≥2 per story)  
✅ Edge cases are specific (not generic "what if error")  
✅ Each EC has an expected behavior, not just "TBD"  
✅ Severity assigned to all edge cases

### Business Rule Precision Check

✅ 24 business rules, each with: rule statement, applies-to, validation method  
✅ Rules are specific enough for developers to implement without asking questions  
⚠️ BR-3.2-10 depends on OQ-01 resolution (color token choice)

### Contradiction Check

✅ No contradictions between stories  
⚠️ EC-16 identifies a potential overlap (MiniNutritionBar vs BudgetStrip) → resolved by OQ-02  
⚠️ CEO says use DateSelector dot colors for borders, but code uses different tokens → flagged in OQ-01

### Missing Items

- ⚠️ Accessibility: ARIA roles for swipe gesture (REQ-10) not specified. Should add `aria-label` to reveal zone.
- ⚠️ Animation timing for swipe (REQ-10) not specified. Suggest 200ms ease-out for card slide.
- ⚠️ No story for performance optimization (DateSelector `dayPlans.find()` → Map). CEO mentions it but doesn't create a REQ. Left as implementation detail.

---

## Self-Critique (Round 2)

### Revisiting OQ-01 Impact

If Option A (meal-\* tokens) is chosen, the DateSelector dots and MealSlot borders will use **different color systems**. This could confuse users: "Why is the breakfast dot yellow-green but the breakfast card amber?"

**Resolution:** This is acceptable because they serve different purposes. Dots = compact indicator (3 small circles), borders = card emphasis. Users don't cross-reference these. CEO concern was about consistency within MealSlots, which Option A achieves.

### Revisiting EC-26 (Hydration Failure)

The current app has NO error state for hydration failure. If we add one for skeleton timeout, we need to define the error state contract. Adding:

```
Surface: calendar.meals
State: error
Title: "Không thể tải dữ liệu"
Reason: "Có lỗi khi đọc dữ liệu bữa ăn"
NextStep: "Thử lại"
CTA: Retry loadAll()
```

This is a P1 addition that piggybacks on REQ-06 (skeleton states).

### Revisiting BR-3.2-02 (Recent Dishes Source)

The current implementation (CalendarTab.tsx:78-92) uses `dayPlans.filter(p => p.date <= today).sort().slice(0, 14)`. This means it scans ALL dayPlans every render. For users with 365+ days of plans, this could be O(n log n) per render. Should be noted as a performance consideration for Tech Leader.

---

## Self-Critique (Round 3 — Final)

### Completeness Validation

- All 11 REQs → ✅ covered
- All CEO pain points (P-DATE-01 through P-EMPTY-03) → ✅ addressed by corresponding REQs
- All CEO assumptions (1-8) → ✅ either confirmed or flagged in OQ
- All CEO risks (R1-R9) → ✅ mitigated by edge cases or business rules
- CEO scope boundaries (IN/OUT/DEFERRED) → ✅ stories stay within scope

### Document Readiness

This document is ready for Tech Leader decomposition. Each story has sufficient detail for task breakdown without additional BM consultation. Open Questions require CEO/User input before implementation begins.
