# [BM] Phase 3: Screen-by-Screen Redesign — User Stories, Business Rules & Edge Cases

> **Trạng thái: LOGIC*NGHIỆP_VỤ*ĐÃ_CHỐT**
> **Version**: 1.0
> **Date**: 2026-07-14
> **Author**: Business Manager (BM) Agent
> **Input**: CEO Phase 3 Analysis (7/7 questions resolved), Phase 0 Triage Matrix, Phase 1 Tokens, Phase 2 Components
> **Traces**: M001–M012 (Phase 0 defects)

---

## Table of Contents

- [Global Cross-Screen Consistency Rules](#global-cross-screen-consistency-rules)
- [3.1 Dashboard (M003)](#31-dashboard-m003)
- [3.2 Calendar + Meals (M007)](#32-calendar--meals-m007)
- [3.3 Library (M008)](#33-library-m008)
- [3.4 Onboarding (M006)](#34-onboarding-m006)
- [3.5 Settings (M004, M005)](#35-settings-m004-m005)
- [3.6 Fitness (M010)](#36-fitness-m010)
- [3.7 AI Analysis (M009)](#37-ai-analysis-m009)
- [3.8 Polish — Global Motion & Skeleton (M012)](#38-polish--global-motion--skeleton-m012)
- [Dependency Matrix](#dependency-matrix)
- [Risk Register](#risk-register)

---

## Global Cross-Screen Consistency Rules

> These rules apply to ALL screens (3.1–3.8). Individual screen rules inherit these.

### GCR-01: Card Spacing & Layout

- **Card internal padding**: `--spacing-card-padding` (12px)
- **Card-to-card gap**: `--spacing-card-gap` (16px)
- **Section-to-section gap**: `--spacing-section-gap` (24px)
- **Page breathing (top/bottom margin)**: `--spacing-breathing` (32px)
- **All cards** use `CardLayout` component with `bg-card`, `shadow-sm`, `border`, `rounded-2xl`

### GCR-02: Header Patterns

- **Tab-level header**: Tab name is implicit via bottom nav icon+label. NO additional header bar within tab content.
- **Full-screen page header**: `PageLayout.topBar` — sticky, `bg-card/95` backdrop-blur, back button (left), title (center), optional action (right). Height: 56px.
- **Section headers within tabs**: `text-section` token (18px), `font-semibold`, `mb-[--spacing-card-gap]`.

### GCR-03: CTA Placement

- **Primary CTA**: Bottom of visible viewport OR inline within relevant card. Never floating mid-screen.
- **Secondary CTA**: Adjacent to primary (row layout) or within card actions.
- **Destructive CTA**: Always requires `ConfirmationModal`. Never in primary position.

### GCR-04: Empty State Patterns

- **All empty states** use `EmptyState` component (Phase 2).
- **3 variants**: `compact` (inline within card), `standard` (section-level), `hero` (full-screen blocking).
- **Required elements**: Icon (muted, from Lucide), Title (1 line), Description (1–2 lines), CTA button (optional).
- **Tone**: Encouraging, never accusatory. Example: "Chưa có bữa ăn nào" ✅ / "Bạn chưa thêm gì" ❌

### GCR-05: Loading / Skeleton Patterns

- **All data-dependent sections** must show skeleton before data loads.
- **Skeleton**: Use `Skeleton` component (shadcn/ui) with `animate-pulse`.
- **Duration**: Skeleton visible for minimum 200ms (prevent flash). If data loads < 200ms, show skeleton anyway then fade to content.
- **Shape**: Skeleton matches final layout shape (rounded rects for cards, lines for text, circles for avatars/icons).

### GCR-06: Tap Targets

- **Minimum size**: 44×44px (WCAG 2.5.8 Target Size Level AAA).
- **Minimum spacing between targets**: 8px.
- **Touch feedback**: `active:scale-[0.97]` + `transition-transform duration-100` (moderate motion, per Q3=B).

### GCR-07: Error State Patterns

- **Inline error**: Red text below input, `text-destructive`, `text-sm`.
- **Toast error**: Top-center, auto-dismiss 5s, `bg-toast-error`.
- **Full-screen error**: ErrorBoundary fallback with retry CTA.
- **NaN/undefined guard**: ALL numeric displays must use `safeCal()` / `safePro()` helpers. Display `0` instead of `NaN`. (Traces R4)

### GCR-08: Transition & Animation (Moderate Motion — Q3=B)

- **Tab switch**: `opacity 0→1` + `translateY(8px→0)`, duration 200ms, `--ease-enter`.
- **Modal enter**: `opacity 0→1` + `scale(0.95→1)`, duration 200ms, `--ease-enter`.
- **Modal exit**: `opacity 1→0` + `scale(1→0.95)`, duration 150ms, `--ease-exit`.
- **Skeleton → content**: `opacity 0→1`, duration 300ms, `--ease-enter`.
- **Press feedback**: `active:scale-[0.97]`, duration 100ms.
- **Reduced motion**: All above collapse to instant (`duration: 0ms`) when `prefers-reduced-motion: reduce`.

### GCR-09: Typography Hierarchy

- **Stat number (big)**: `--text-stat-big` (32px) — hero metrics only.
- **Stat number (medium)**: `--text-stat-med` (24px) — card-level metrics.
- **Page title**: `--text-page` (24px) — full-screen page headers.
- **Section title**: `--text-section` (18px) — within-tab section titles.
- **Card title**: `--text-card-title` (16px) — card headers.
- **Body text**: 14px default.
- **Caption/label**: 12px, `text-muted-foreground`.

### GCR-10: Dark Mode

- All screens MUST render correctly in both light and dark mode.
- NO hardcoded colors (`#fff`, `rgb(0,0,0)`). Use semantic tokens exclusively.
- Validate: toggle dark mode → every element must remain readable (contrast ≥ 4.5:1 for text, ≥ 3:1 for large text/UI).

---

## 3.1 Dashboard (M003)

> **Defects addressed**: M003 (zero-state confusion + hierarchy unclear), M001 (color token adoption), M012 (animation gaps)
> **Dependencies**: None (first in chain)
> **Current state**: 8 components, 6 hooks, 3,282 LOC. CombinedHero with blocking/guided/passive orchestration. NutritionHeroSkeleton exists.

### User Stories

#### US-DASH-01: Hero Hierarchy Clarity

**As a** returning user,
**I want** the Dashboard hero to show my daily score, calorie progress, and macro breakdown in a clear visual hierarchy,
**so that** I can assess my day's status in < 3 seconds without scrolling.

| Acceptance Criteria                                                                            | Measurement                                     |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| AC-01: Daily score badge visible at top of hero, font size `--text-stat-big` (32px)            | Visual audit                                    |
| AC-02: Calorie ring (eaten/target) visible below score, ring diameter ≥ 120px                  | Screenshot measurement                          |
| AC-03: Macro bars (P/F/C) visible below ring, each bar labeled with current/target gram values | Unit test + visual                              |
| AC-04: Greeting text uses user's name from healthProfileStore                                  | Unit test: `expect(screen.getByText(/Tester/))` |
| AC-05: Score color follows thresholds: ≥80 emerald, ≥50 amber, <50 slate                       | Unit test with mock scores                      |
| AC-06: Information density = "Balanced" (Q2=B): key metrics visible, secondary expandable      | Visual audit against MyFitnessPal reference     |

**Impact**: H — Hero is first thing user sees on every app open.
**Traces**: M003, Q2=B, Q6

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | All nutrition values = 0 (no meals logged today) | Ring shows 0/target. Score factors nutrition=0. Text: "Chưa có bữa ăn nào hôm nay" |
| EC-02 | targetCalories = NaN/undefined (health profile partially configured) | Guard: display "—" for target, disable ring animation. Hero mode = `guided` with CTA to complete profile |
| EC-03 | eaten > target (overeating) | Ring fills to 100% + red overflow indicator. Text: "Vượt: X kcal" |
| EC-04 | First-ever app open (isFirstTimeUser=true, no profile) | Hero mode = `blocking`. Show EmptyState(hero) with CTA "Thiết lập hồ sơ" |

---

#### US-DASH-02: Zero-State Progressive Guidance

**As a** new user who just completed onboarding,
**I want** the Dashboard to guide me through my first actions (log a meal, start a workout),
**so that** I don't feel lost on an empty screen.

| Acceptance Criteria                                                                                                          | Measurement                          |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| AC-01: Blocking mode shows when ANY of: health profile missing, goal missing, training profile missing, fitness plan missing | Unit test: 4 separate conditions     |
| AC-02: Guided mode shows NextActionStrip with exactly 1 primary CTA at a time                                                | Unit test: only 1 CTA rendered       |
| AC-03: CTA button tap navigates to correct destination (Settings, Fitness tab, Meal planner)                                 | Integration test: click → navigation |
| AC-04: Transition from blocking → guided → passive is automatic as user completes each setup step                            | State machine test                   |
| AC-05: User can dismiss guided suggestions (no force)                                                                        | Unit test: dismiss callback exists   |

**Impact**: H — Determines new user retention.
**Traces**: M003, Q4=Hybrid

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | User skips training profile (only nutrition configured) | Hero mode = `blocking` for fitness plan. Nutrition section still renders with data. |
| EC-02 | User deletes their fitness plan mid-session | Hero transitions from `passive` → `blocking`. Dashboard re-evaluates orchestration. |
| EC-03 | All setup complete but 0 data logged today | Hero mode = `guided`. NextActionStrip: "Thêm bữa sáng" or "Bắt đầu tập luyện" (whichever is next chronologically) |

---

#### US-DASH-03: Skeleton Loading for All Dashboard Tiers

**As a** user opening the app,
**I want** to see skeleton placeholders instantly while data loads,
**so that** I perceive the app as fast and don't see blank screens.

| Acceptance Criteria                                                                                          | Measurement                                                    |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| AC-01: NutritionHeroSkeleton renders within 16ms of mount (1 frame)                                          | Performance trace                                              |
| AC-02: Skeleton shape matches final NutritionSection layout (ring placeholder, bar placeholders, text lines) | Visual audit                                                   |
| AC-03: TodaysPlanCard shows skeleton when plan data loading                                                  | Existing: verify or add                                        |
| AC-04: AiInsightCard shows skeleton (not empty div) when insight loading                                     | Currently shows `min-h-[56px]` empty — MUST change to Skeleton |
| AC-05: QuickActionsBar shows skeleton during initial load                                                    | Verify or add                                                  |
| AC-06: Skeleton visible minimum 200ms per GCR-05                                                             | Timing test                                                    |

**Impact**: M — Perceived performance, not functional.
**Traces**: M012, M002

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | Data loads in < 50ms (fast device, warm cache) | Skeleton still shows for 200ms minimum, then crossfade to content |
| EC-02 | Data load fails (SQLite error) | Skeleton transitions to ErrorBoundary fallback. Each tier independent — Tier 1 error doesn't block Tier 2. |
| EC-03 | Reduced motion preference enabled | Skeleton renders static (no pulse animation). Content replaces skeleton instantly (no crossfade). |

---

#### US-DASH-04: Hook Consolidation

**As a** developer maintaining Dashboard,
**I want** hooks to have clear, non-overlapping responsibilities,
**so that** I can reason about data flow without tracing 6+ hooks.

| Acceptance Criteria                                                    | Measurement                                                     |
| ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| AC-01: No two hooks return the same data field (deduplication)         | Code review: grep for duplicate field names across hook returns |
| AC-02: useTodayNutrition (legacy) either removed or clearly deprecated | Grep: 0 active imports OR JSDoc `@deprecated`                   |
| AC-03: Each hook's return type is exported and documented in types.ts  | TypeScript: all return types in `features/dashboard/types.ts`   |
| AC-04: No hook reads from more than 3 Zustand stores (cognitive limit) | Code review                                                     |

**Impact**: M — Developer experience, reduces bug surface.
**Traces**: M003 (hierarchy unclear → caused by tangled hooks)

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | Store emits during render cycle (Zustand batching) | useShallow prevents unnecessary re-renders. Verify with React DevTools Profiler. |
| EC-02 | Hook dependency cycle (hook A reads store X, which is updated by effect in hook B, which reads hook A's output) | Audit: no circular dependencies. Each hook reads only from stores, never from other dashboard hooks. |

---

#### US-DASH-05: TodaysPlanCard State Machine

**As a** user with an active fitness plan,
**I want** the TodaysPlanCard to clearly show my workout status (rest day, pending, partial, complete),
**so that** I know what action to take next.

| Acceptance Criteria                                                                                                         | Measurement                            |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| AC-01: 5 distinct visual states render correctly: no-plan, rest-day, training-pending, training-partial, training-completed | Unit test: 5 test cases with mock data |
| AC-02: Each state has unique icon + color + CTA                                                                             | Visual audit per state                 |
| AC-03: Meal slots show breakfast/lunch/dinner with dish count                                                               | Unit test: slot rendering              |
| AC-04: Card transitions between states animate (moderate motion)                                                            | Visual: opacity+translateY per GCR-08  |

**Impact**: H — Drives daily engagement loop (workout + meals).
**Traces**: M003, Q5 (fitness decomposition by state)

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | Workout exists but 0 sets logged (started then abandoned) | State = `training-partial`. CTA: "Tiếp tục tập luyện" |
| EC-02 | Rest day but user logged an ad-hoc workout | State = `training-completed` (trumps rest-day). Show completed badge. |
| EC-03 | Plan expired (end_date < today) | State = `no-plan`. Show EmptyState(compact) with CTA "Tạo kế hoạch mới" |

---

### Business Rules — Dashboard

| Rule       | Description                                                                                                                                                                | Traces                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| BR-DASH-01 | Hero mode priority: `blocking` > `guided` > `passive`. Blocking checks in order: health profile → goal → training profile → fitness plan. First missing = blocking reason. | M003                                        |
| BR-DASH-02 | Daily score = weighted average: calories 30%, protein 25%, workout 25%, weightLog 10%, streak 10%. Score range 0–100.                                                      | Q6                                          |
| BR-DASH-03 | Score colors: ≥80 = emerald, ≥50 = amber, <50 = slate. Colors use semantic tokens `--color-emerald-500`, `--color-amber-500`, `--color-slate-500`.                         | M001                                        |
| BR-DASH-04 | NutritionSection always shows `targetCalories` (TDEE + goal offset), NEVER raw TDEE. Target includes goal adjustment.                                                      | R4 (cross-store propagation bug from audit) |
| BR-DASH-05 | AiInsightCard shows max 1 insight at a time. Dismissed insights don't reappear for 24h.                                                                                    | Q6                                          |
| BR-DASH-06 | QuickActionsBar shows exactly 2 actions: "Cân nặng" + "Cardio". Actions navigate to their respective modals/loggers.                                                       | Q2=B                                        |
| BR-DASH-07 | Dashboard renders in 3 staggered tiers with RAF gating. Tier 1 (hero) immediate, Tier 2 (plan card + insight) 30ms stagger, Tier 3 (quick actions) RAF-gated.              | M002, M012                                  |
| BR-DASH-08 | WeeklyStatsRow hidden for first-time users (isFirstTimeUser=true). Shows for returning users in `guided` and `passive` modes only.                                         | Q4                                          |
| BR-DASH-09 | All numeric displays guard against NaN/undefined. Display `0` for NaN calories, `"—"` for unconfigured targets.                                                            | R4                                          |

### Interaction Rules — Dashboard

| Rule       | Description                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| IR-DASH-01 | Tap on calorie ring → opens EnergyDetailSheet (bottom sheet, contains BMR/TDEE/Target/Macros breakdown)                            |
| IR-DASH-02 | Tap on NextActionStrip CTA → navigates to destination (Settings, Fitness tab, or Meal Planner) via `navigateTab()` or `pushPage()` |
| IR-DASH-03 | Tap on TodaysPlanCard meal slot → opens MealPlannerModal for that meal type                                                        |
| IR-DASH-04 | Tap on TodaysPlanCard workout status → opens WorkoutLogger if training-pending/partial, or WorkoutHistory if completed             |
| IR-DASH-05 | Long-press on AiInsightCard → dismiss with haptic feedback (if available)                                                          |
| IR-DASH-06 | Pull-to-refresh → re-fetches all dashboard data (stores re-query). Show skeleton during refresh.                                   |

---

## 3.2 Calendar + Meals (M007)

> **Defects addressed**: M007 (meal card density + planning friction), M001 (color tokens), M012 (transitions)
> **Dependencies**: 3.1 (reuses Dashboard patterns: CardLayout, EmptyState, Skeleton)
> **Current state**: CalendarTab with Meals/Nutrition subtabs. MealSlot cards with servings control. MealPlannerModal with search+filter. Recently used dishes from 14-day history.

### User Stories

#### US-CAL-01: Balanced Meal Card Density

**As a** user viewing today's meals,
**I want** each meal slot to show dish names, calorie total, and protein at a glance,
**so that** I can assess my day's nutrition without tapping into each meal.

| Acceptance Criteria                                                                                 | Measurement                      |
| --------------------------------------------------------------------------------------------------- | -------------------------------- | ---- | ----- | --------- |
| AC-01: Each filled MealSlot shows: meal icon, meal label, dish count, total calories, total protein | Unit test                        |
| AC-02: Dish names visible (max 2 shown, "+X more" overflow)                                         | Unit test: 3+ dishes → "+1 more" |
| AC-03: Nutrition summary row at bottom of each slot: `X kcal                                        | P Xg                             | F Xg | C Xg` | Unit test |
| AC-04: Servings stepper (−/count/+) per dish, range 1–10                                            | Unit test: boundary 1 and 10     |
| AC-05: Empty slot clearly shows CTA "Thêm món" with dashed border                                   | Visual audit                     |
| AC-06: Data density = "Balanced" (Q2=B): visible calories+protein, expandable fat+carbs+fiber       | Visual audit                     |

**Impact**: H — Used daily for meal tracking.
**Traces**: M007, Q2=B

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | Dish has 0 calories (custom ingredient with missing nutrition) | Display "0 kcal". Warn icon next to dish name. |
| EC-02 | 10 dishes in one meal slot | Show first 2, "+8 more". Tap to expand full list in bottom sheet. |
| EC-03 | Servings set to 10 for a dish | "+" button disabled. Total calories = dish calories × 10. |
| EC-04 | User removes all dishes from a slot (clears to empty) | Slot transitions to empty state with dashed border + CTA. |

---

#### US-CAL-02: Reduced Planning Friction

**As a** user planning tomorrow's meals,
**I want** to quickly add recently used dishes with 1 tap,
**so that** I spend < 30 seconds planning a typical day.

| Acceptance Criteria                                                                                       | Measurement                  |
| --------------------------------------------------------------------------------------------------------- | ---------------------------- |
| AC-01: Recently used section shows top 8 dishes from last 14 days, sorted by recency                      | Unit test with mock dayPlans |
| AC-02: Each recent dish chip shows: dish name + calorie count                                             | Visual audit                 |
| AC-03: 1-tap quick-add: if only 1 empty slot → add immediately. If >1 empty slot → show meal type submenu | Unit test: both paths        |
| AC-04: Quick-add confirmation via optimistic UI update (no modal)                                         | Integration test             |
| AC-05: "Xem tất cả" link at end of recent section → opens MealPlannerModal                                | Unit test                    |
| AC-06: Recently used section hidden when all 3 slots filled                                               | Unit test                    |

**Impact**: H — Reduces daily friction from ~2min to <30s.
**Traces**: M007, Q7=Recent-first

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | First day — no recently used dishes (new user) | Section hidden. Show inline CTA "Thêm bữa ăn đầu tiên" |
| EC-02 | Dish in recently used was deleted from library | Dish excluded from recently used list (filter by existing dish IDs) |
| EC-03 | All 3 meal slots already filled | Recently used section hidden. Show "Kế hoạch đã hoàn tất ✓" banner |

---

#### US-CAL-03: Meal Planning Modal Efficiency

**As a** user opening the meal planner,
**I want** dishes filtered by meal type with search and nutrition filters,
**so that** I can find appropriate dishes quickly.

| Acceptance Criteria                                                                                  | Measurement        |
| ---------------------------------------------------------------------------------------------------- | ------------------ |
| AC-01: Modal opens with correct meal type tab pre-selected (breakfast/lunch/dinner based on context) | Unit test          |
| AC-02: Search input filters dishes by name (case-insensitive, debounced 200ms)                       | Unit test          |
| AC-03: Filter button opens FilterBottomSheet with: min protein, max calories, sort options           | Unit test          |
| AC-04: Only dishes tagged with active meal type shown (breakfast dishes in breakfast tab)            | Unit test          |
| AC-05: Selected dishes show checkmark + primary border. Toggle to deselect.                          | Visual + unit test |
| AC-06: Confirm button label shows change count: "Xác nhận (X món)"                                   | Unit test          |
| AC-07: Empty search result shows EmptyState(compact) with "Không tìm thấy. Thử điều chỉnh bộ lọc"    | Unit test          |

**Impact**: M — Improves meal selection efficiency.
**Traces**: M007

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | No dishes tagged for "breakfast" in library | EmptyState: "Chưa có món sáng. Thêm tag trong Thư viện" with CTA → Library tab |
| EC-02 | All dishes filtered out by strict filters (min protein 50g + max cal 200) | EmptyState with "Không có món nào phù hợp. Thử nới rộng bộ lọc" |
| EC-03 | User switches between meal tabs rapidly | Debounce tab switch. No flash of incorrect list. Previous tab's filter state preserved. |

---

#### US-CAL-04: Nutrition Subtab Visibility

**As a** user tracking macros,
**I want** the Nutrition subtab to show a clear breakdown of today's consumed vs target macros,
**so that** I can decide whether to adjust remaining meals.

| Acceptance Criteria                                                                              | Measurement            |
| ------------------------------------------------------------------------------------------------ | ---------------------- |
| AC-01: EnergyBalanceCard shows: Calories In / Calories Target / Protein Current / Protein Target | Unit test              |
| AC-02: Macro chart (donut) shows P/F/C split with percentage labels                              | Visual audit           |
| AC-03: RecommendationPanel shows dynamic tips based on current vs target (success/warning/info)  | Unit test: 3 tip types |
| AC-04: Missing meals list shown when plan incomplete                                             | Unit test              |
| AC-05: "Chỉnh mục tiêu" CTA navigates to Settings Goal page                                      | Integration test       |

**Impact**: M — Supports informed meal decisions.
**Traces**: M007, Q2=B

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | No meals logged (all slots empty) | Chart shows 100% remaining. Tip: "Chưa có bữa ăn hôm nay" |
| EC-02 | Protein exceeds target by 50%+ | Chart shows overflow. Tip type = warning: "Protein vượt mục tiêu. Cân nhắc giảm thịt/đạm." |
| EC-03 | Health profile not configured (targets = 0/NaN) | Show EmptyState: "Thiết lập hồ sơ để xem mục tiêu" with CTA → Settings |

---

### Business Rules — Calendar + Meals

| Rule      | Description                                                                                                                         | Traces       |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| BR-CAL-01 | Recently used dishes computed from last 14 days of dayPlans, deduplicated, max 8. Sorted by most-recent-use-date.                   | Q7           |
| BR-CAL-02 | Meal slots order: Breakfast (top) → Lunch (middle) → Dinner (bottom). Non-configurable.                                             | M007         |
| BR-CAL-03 | Servings range 1–10. Default = 1. Deletion at servings=1 removes dish from slot entirely.                                           | M007         |
| BR-CAL-04 | Nutrition values computed on-demand from ingredients × amount × servings. Not cached.                                               | Architecture |
| BR-CAL-05 | Meal progress bar: Yellow if 1–2/3 slots filled, Green if 3/3. Hidden if 0/3.                                                       | M007         |
| BR-CAL-06 | Quick-add from recently used: optimistic UI update → persist to dayPlanStore → auto-sync to SQLite.                                 | Architecture |
| BR-CAL-07 | Calendar date selection: tapping a date in calendar strip changes `selectedDate` in uiStore. All components re-render for new date. | Architecture |
| BR-CAL-08 | SubTabBar for Meals/Nutrition reuses `SubTabBar` (Phase 2 shared component).                                                        | Phase 2      |

### Interaction Rules — Calendar + Meals

| Rule      | Description                                                                                  |
| --------- | -------------------------------------------------------------------------------------------- |
| IR-CAL-01 | Tap empty MealSlot → opens MealPlannerModal with corresponding meal type                     |
| IR-CAL-02 | Tap filled MealSlot edit icon → opens MealPlannerModal in edit mode (pre-selected dishes)    |
| IR-CAL-03 | Tap recent dish chip → 1-tap add (if 1 empty slot) OR submenu (if >1)                        |
| IR-CAL-04 | Swipe left on filled MealSlot → reveal "Clear" action (destructive, requires confirmation)   |
| IR-CAL-05 | Tap "AI Suggest" → triggers meal suggestion. Show spinner on button. Results populate slots. |
| IR-CAL-06 | SubTab switch (Meals ↔ Nutrition) → crossfade animation per GCR-08                           |

---

## 3.3 Library (M008)

> **Defects addressed**: M008 (visual density + search/filter UX), M001 (color tokens)
> **Dependencies**: 3.1 (CardLayout, EmptyState, Skeleton patterns)
> **Current state**: DishManager (grid/list, search, sort, filter by meal type, compare mode). IngredientManager (grid/list, search, sort). DishEditModal + IngredientEditModal with AI suggest.

### User Stories

#### US-LIB-01: Recent-First Dish Ordering

**As a** user opening the Library,
**I want** my recently used dishes displayed at the top,
**so that** I can quickly find and edit the dishes I use most.

| Acceptance Criteria                                                                                 | Measurement |
| --------------------------------------------------------------------------------------------------- | ----------- |
| AC-01: "Gần đây" section at top of dish list, showing up to 8 recently used dishes                  | Unit test   |
| AC-02: Recently used computed from dayPlanStore (same algorithm as Calendar: 14 days, dedup, max 8) | Unit test   |
| AC-03: Full dish list below "Gần đây", with current sort/filter applied                             | Unit test   |
| AC-04: "Gần đây" section collapsible (tap header to toggle)                                         | Unit test   |
| AC-05: If no recently used dishes, "Gần đây" section hidden                                         | Unit test   |

**Impact**: M — Reduces search time for common dishes.
**Traces**: M008, Q7=Recent-first

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | User has 0 dayPlans (never used meal planner) | "Gần đây" section hidden. Full list shows all dishes. |
| EC-02 | User searches → should recent section also filter? | Yes. "Gần đây" section applies same search filter. If 0 matches, section hides. |
| EC-03 | Dish appears in both "Gần đây" and full list | Dish rendered in both places. "Gần đây" takes visual priority (top). No dedup from full list — consistency with MyFitnessPal pattern. |

---

#### US-LIB-02: Break DishManager Into Focused Components

**As a** developer,
**I want** DishManager split into smaller, focused components (DishGrid, DishList, DishCard, ComparePanel),
**so that** each component is < 200 LOC and independently testable.

| Acceptance Criteria                                                                 | Measurement                    |
| ----------------------------------------------------------------------------------- | ------------------------------ |
| AC-01: DishManager.tsx < 200 LOC (currently ~400 LOC including DishGridCard inline) | LOC count                      |
| AC-02: DishGridCard extracted to separate file with own test                        | File exists + test file exists |
| AC-03: DishListRow extracted to separate file with own test                         | File exists + test file exists |
| AC-04: ComparePanel extracted to separate file with own test                        | File exists + test file exists |
| AC-05: All existing DishManager tests still pass after extraction                   | `npm run test` 0 failures      |

**Impact**: M — Developer experience, maintainability.
**Traces**: M008

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | Component extraction breaks import paths | All imports updated. No runtime errors. |
| EC-02 | Inline state in DishManager needs lifting | State lifted to DishManager, passed as props to extracted components. |

---

#### US-LIB-03: Migrate Library Modals to Phase 2 Patterns

**As a** user editing a dish,
**I want** the edit modal to use the standardized ModalLayout with consistent close/save buttons,
**so that** the UI feels cohesive across the app.

| Acceptance Criteria                                                                          | Measurement  |
| -------------------------------------------------------------------------------------------- | ------------ |
| AC-01: DishEditModal uses `ModalLayout` (Phase 2) for container                              | Code review  |
| AC-02: Close button uses `CloseButton` (Phase 2 shared)                                      | Code review  |
| AC-03: Unsaved changes → `UnsavedChangesDialog` (Phase 2) with 3 options (save/discard/stay) | Unit test    |
| AC-04: IngredientEditModal uses same patterns                                                | Code review  |
| AC-05: Modal enter/exit animations per GCR-08                                                | Visual audit |

**Impact**: L — Consistency improvement.
**Traces**: M008, Phase 2 migration

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | User modifies form, taps backdrop to close | UnsavedChangesDialog appears. No data loss without explicit discard. |
| EC-02 | Modal opened via compare panel → edit | Modal stacks above compare panel. Z-index correct (modal > compare). |

---

#### US-LIB-04: Library Visual Density Improvement

**As a** user browsing ingredients,
**I want** the ingredient grid cards to show all 4 macro values (cal/pro/carbs/fat) in a compact layout,
**so that** I can compare ingredients without opening each one.

| Acceptance Criteria                                                                           | Measurement  |
| --------------------------------------------------------------------------------------------- | ------------ | --- | ----- | --- | -------- | --------- |
| AC-01: Ingredient grid card shows: name, unit, cal, protein, carbs, fat in 2×2 nutrition grid | Visual audit |
| AC-02: Card height consistent across all cards (CSS grid with min-height)                     | Visual audit |
| AC-03: "Used in: [dish name]" shown at bottom if ingredient used in any dish                  | Unit test    |
| AC-04: Delete button disabled + tooltip when ingredient used in dish                          | Unit test    |
| AC-05: List view shows all macros in table columns (name                                      | cal          | pro | carbs | fat | actions) | Unit test |

**Impact**: M — Ingredient management usability.
**Traces**: M008

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | Ingredient used in 5+ dishes | Show "Dùng trong 5 món" (count), not full list. Tap to expand. |
| EC-02 | All nutrition values = 0 (placeholder ingredient) | Display "0" for all. Warn badge: "Thiếu dữ liệu dinh dưỡng" |

---

### Business Rules — Library

| Rule      | Description                                                                                                | Traces         |
| --------- | ---------------------------------------------------------------------------------------------------------- | -------------- |
| BR-LIB-01 | Default sort: "Gần đây" section first, then alphabetical (name-asc). User can override sort for full list. | Q7             |
| BR-LIB-02 | Compare mode: max 3 dishes. Attempting 4th shows toast warning "Tối đa 3 món để so sánh".                  | M008           |
| BR-LIB-03 | Dish clone appends " (bản sao)" suffix + generates new UUID.                                               | Existing logic |
| BR-LIB-04 | Delete dish disabled when `isDishUsed(id)` returns true (dish in any dayPlan).                             | Existing logic |
| BR-LIB-05 | AI suggest ingredients available in DishEditModal. Results shown in preview before applying.               | M008           |
| BR-LIB-06 | Grid/List view toggle persists across sessions (stored in uiStore or localStorage).                        | M008           |
| BR-LIB-07 | Search debounced 200ms. Minimum query length: 1 character.                                                 | M008           |

### Interaction Rules — Library

| Rule      | Description                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------- |
| IR-LIB-01 | Tap dish grid card → opens DishEditModal in edit mode                                                   |
| IR-LIB-02 | Tap "+" button in ListToolbar → opens DishEditModal in create mode                                      |
| IR-LIB-03 | Tap compare toggle on card → adds to compare set. Tap again → removes.                                  |
| IR-LIB-04 | Tap clone icon on card → creates copy, shows toast "Đã sao chép [dish name]"                            |
| IR-LIB-05 | Tap delete icon → ConfirmationModal "Xóa [dish name]?" → confirm → delete + toast "Đã xóa"              |
| IR-LIB-06 | Tap meal type filter chip → filters dish list. Tap again → removes filter. Multiple filters = OR logic. |

---

## 3.4 Onboarding (M006)

> **Defects addressed**: M006 (abandonment risk — too long), M012 (transitions)
> **Dependencies**: TASK-08 (compact form archetype) BLOCKING
> **Current state**: 7 sections, 13–21 steps. Has tests (2,571 LOC unit + 530 LOC integration). Skip on welcome, back nav, progress indicator, resume. React Hook Form + Zod.
> **CEO decision**: Q4=Hybrid — short core (health basics + goal) + contextual in-app prompts.

### User Stories

#### US-ONB-01: Shortened Core Onboarding (Hybrid — Q4=B)

**As a** new user,
**I want** onboarding to take max 6 screens for essential setup (name, body stats, activity, goal),
**so that** I can start using the app in < 2 minutes.

| Acceptance Criteria                                                                                                | Measurement                                            |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| AC-01: Core onboarding = 6 screens max: Welcome(1) → HealthBasic(1) → Activity(1) → Goal(1) → Confirm(1) → Done(1) | Screen count                                           |
| AC-02: Training profile setup DEFERRED to contextual in-app prompt (not in core onboarding)                        | Code: training section skippable or deferred           |
| AC-03: Total core onboarding time < 2 minutes for average user (measured by user testing)                          | Timing study                                           |
| AC-04: Progress bar shows current/total (e.g., "2/6")                                                              | Visual audit                                           |
| AC-05: User can complete onboarding with only health basics + goal (training = default values)                     | Unit test: onboarding completes without training input |
| AC-06: "Bỏ qua" (skip) available on Welcome screen                                                                 | Existing: verify testid `onboarding-skip-btn`          |

**Impact**: H — User acquisition/retention. Industry benchmark: 3–5 steps.
**Traces**: M006, Q4=Hybrid

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | User kills app mid-onboarding (step 3 of 6) | Resume from last completed section on next open. `appOnboardingStore.resumeSection` preserves state. |
| EC-02 | User taps "Back" on first screen | Nothing happens (back button hidden on step 1). |
| EC-03 | User skips Welcome → arrives at HealthBasic with no context | HealthBasic has inline subtitle: "Thông tin cơ bản để tính mục tiêu dinh dưỡng" |

---

#### US-ONB-02: Contextual In-App Prompts for Deferred Setup

**As a** user who completed core onboarding,
**I want** the app to prompt me to set up training profile when I first visit the Fitness tab,
**so that** I complete setup at the relevant moment, not during initial flood.

| Acceptance Criteria                                                                                 | Measurement              |
| --------------------------------------------------------------------------------------------------- | ------------------------ |
| AC-01: First visit to Fitness tab → guided prompt: "Thiết lập hồ sơ tập luyện để nhận kế hoạch tập" | Unit test                |
| AC-02: Prompt uses EmptyState(hero) with CTA "Thiết lập ngay"                                       | Visual audit             |
| AC-03: Prompt shown max 3 times. After 3 dismissals, replaced with subtle "Thiết lập" link.         | Unit test: counter logic |
| AC-04: Training profile setup uses same form as Settings TrainingProfileForm (single source)        | Code: same component     |
| AC-05: After profile setup → auto-generate plan → same flow as current Section 5-7                  | Integration test         |

**Impact**: H — Reduces onboarding abandonment while ensuring fitness setup happens.
**Traces**: M006, Q4=Hybrid, Q5 (fitness empty state)

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | User navigates to Fitness tab before completing core onboarding | Core onboarding interceptor still blocks. Fitness prompt only shows AFTER core complete. |
| EC-02 | User sets up training profile via Settings instead of Fitness prompt | Prompt hidden (profile already exists). Normal Fitness tab renders. |
| EC-03 | User dismisses prompt 3 times, then wants to set up | Subtle "Thiết lập hồ sơ" link visible in Fitness tab header. Tapping opens TrainingProfileForm. |

---

#### US-ONB-03: Baseline Tests Before Redesign

**As a** developer about to modify onboarding,
**I want** comprehensive baseline tests covering all current flows,
**so that** I can refactor without breaking existing behavior.

| Acceptance Criteria                                                                                   | Measurement      |
| ----------------------------------------------------------------------------------------------------- | ---------------- |
| AC-01: Existing test suite (2,571 + 530 LOC) passes with 0 failures                                   | `npm run test`   |
| AC-02: Test coverage ≥ 80% statements for onboarding components                                       | Coverage report  |
| AC-03: Integration test covers: Welcome → HealthBasic → Activity → Goal → Confirm → Done (happy path) | Test case exists |
| AC-04: Integration test covers: back navigation across sections                                       | Test case exists |
| AC-05: Integration test covers: resume from saved section                                             | Test case exists |
| AC-06: Snapshot tests or visual regression for each step's layout                                     | Test files exist |

**Impact**: H — Prevents regression during redesign. R2 risk mitigation.
**Traces**: M006, R2

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | Test discovers untested branch in current code | Add test, document in bug report. Do NOT fix logic during baseline phase — test first. |
| EC-02 | Existing test relies on implementation detail (internal state) | Refactor test to test user-facing behavior (RTL queries). |

---

#### US-ONB-04: TASK-08 Compact Form Archetype

**As a** designer/developer,
**I want** a reusable compact form component pattern used across Onboarding and Settings,
**so that** form UX is consistent and maintainable.

| Acceptance Criteria                                                                                  | Measurement                     |
| ---------------------------------------------------------------------------------------------------- | ------------------------------- |
| AC-01: Compact form pattern defined: single-column, input labels above, spacing `--spacing-card-gap` | Design spec                     |
| AC-02: Form fields: text input, date input, number input, button group selector, multi-select chips  | Component inventory             |
| AC-03: Validation: inline error below field, red border on invalid, auto-scroll to first error       | Unit test                       |
| AC-04: Used by: HealthBasicStep, ActivityLevelStep, GoalStep, HealthProfileForm, TrainingProfileForm | Code: same component used       |
| AC-05: Supports both standalone (onboarding) and embedded (settings detail page) modes               | Unit test: 2 rendering contexts |

**Impact**: H — BLOCKING dependency for 3.4 and 3.5.
**Traces**: M006, M004, M005, TASK-08

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | Compact form in onboarding (full-screen) vs settings (embedded in detail page) | Padding/margin differs. Form accepts `className` prop for context-specific adjustments. |
| EC-02 | Form field with very long error message | Error text wraps. Max 2 lines. Truncate with "..." if longer. |

---

### Business Rules — Onboarding

| Rule      | Description                                                                                                                                                                          | Traces                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| BR-ONB-01 | Core onboarding = mandatory. Cannot access main app without completing: name, gender, DOB, height, weight, activity level, goal type, goal rate.                                     | M006                    |
| BR-ONB-02 | Training profile = deferred. Default values applied: beginner, general fitness, 3 days/week, 45 min. User prompted contextually in Fitness tab.                                      | Q4=Hybrid               |
| BR-ONB-03 | Progress indicator shows step X of N. N = total remaining steps (not total possible).                                                                                                | M006                    |
| BR-ONB-04 | Resume: if user exits mid-onboarding, next app open resumes from last completed section. Partially filled forms show saved values.                                                   | M006                    |
| BR-ONB-05 | HealthConfirmStep shows computed BMR + TDEE + Target. User must explicitly confirm ("Xác nhận") before proceeding.                                                                   | Existing                |
| BR-ONB-06 | Form validation per step. Cannot advance without all required fields valid. Multi-step trigger: `form.trigger([...STEP_FIELDS[currentStep]])` — NEVER `form.trigger()` without args. | Architecture convention |

### Interaction Rules — Onboarding

| Rule      | Description                                                                                                                |
| --------- | -------------------------------------------------------------------------------------------------------------------------- |
| IR-ONB-01 | Swipe left/right on Welcome slides (only)                                                                                  |
| IR-ONB-02 | "Tiếp tục" button at bottom of each step. Disabled until all required fields valid.                                        |
| IR-ONB-03 | Back button at top-left. Hidden on first step of onboarding.                                                               |
| IR-ONB-04 | Button group selectors (gender, activity, goal): tap to select, visual highlight with primary color.                       |
| IR-ONB-05 | Page transition between steps: `translateX(-100% → 0)` enter, `translateX(0 → 100%)` exit. Duration 250ms, `--ease-enter`. |

---

## 3.5 Settings (M004, M005)

> **Defects addressed**: M004 (separation of concerns), M005 (progressive disclosure missing)
> **Dependencies**: 3.4 (TASK-08 form archetype)
> **Current state**: SettingsMenu with 3 cards (Health, Goal, Training) + inline Theme/Cloud/Data. SettingsDetailLayout with view/edit modes. Progressive disclosure implemented for training. React Hook Form + Zod. Good test coverage.

### User Stories

#### US-SET-01: Clear Separation of Concerns

**As a** user managing my health settings,
**I want** Health Profile, Goal, and Training Profile to be clearly separated sections,
**so that** I know exactly where to find and change each setting.

| Acceptance Criteria                                                                                                     | Measurement  |
| ----------------------------------------------------------------------------------------------------------------------- | ------------ |
| AC-01: SettingsMenu shows 3 distinct cards: "Hồ sơ sức khỏe", "Mục tiêu", "Hồ sơ tập luyện"                             | Unit test    |
| AC-02: Each card shows: icon, title, current summary (1 line), status badge (Configured/Setup/Needs Attention)          | Unit test    |
| AC-03: Status badge colors: Configured = emerald, Needs Attention = amber, Setup = muted                                | Visual audit |
| AC-04: Card order fixed: Health → Goal → Training (matches data dependency: profile → goal calculation → training plan) | Unit test    |
| AC-05: Inline sections (Theme, Cloud, Data) visually separated from main 3 cards by section divider                     | Visual audit |

**Impact**: M — Settings navigation clarity.
**Traces**: M004

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | Health profile configured but goal not set | Health card: "Configured" (emerald). Goal card: "Chưa thiết lập" (muted) with CTA. |
| EC-02 | Training profile partially configured (some optional fields empty) | Card: "Configured" (emerald). Optional fields default values used. No "Needs Attention" for optional-only gaps. |

---

#### US-SET-02: Progressive Disclosure in Settings Detail Pages

**As a** beginner user viewing Training Profile,
**I want** advanced options (periodization, cycle weeks, priority muscles) hidden by default,
**so that** I'm not overwhelmed by settings I don't understand.

| Acceptance Criteria                                                                                  | Measurement                            |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------- |
| AC-01: Beginner: 5 visible fields (duration, equipment, injuries, cardio, confirm)                   | Unit test with experience=beginner     |
| AC-02: Intermediate: 8 visible fields (+ periodization, cycleWeeks, priorityMuscles)                 | Unit test with experience=intermediate |
| AC-03: Advanced: 9 visible fields (+ sleepHours)                                                     | Unit test with experience=advanced     |
| AC-04: Changing experience level dynamically shows/hides fields with animation (200ms, --ease-enter) | Visual audit                           |
| AC-05: Hidden fields retain their values when shown/hidden (no data loss on experience switch)       | Unit test                              |

**Impact**: M — Reduces cognitive load for beginners.
**Traces**: M005

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | User downgrades from Advanced → Beginner | Advanced-only fields (sleepHours) hidden but values retained in store. If user upgrades back → values restored. |
| EC-02 | User saves while intermediate → periodization field has validation error | Save blocked. Scroll to first error. Error visible even though field is in "advanced" section. |

---

#### US-SET-03: Reuse TASK-08 Form Archetype

**As a** developer,
**I want** Settings forms to use the same compact form archetype as Onboarding,
**so that** form UX is identical across both contexts.

| Acceptance Criteria                                                                        | Measurement         |
| ------------------------------------------------------------------------------------------ | ------------------- |
| AC-01: HealthProfileForm uses same input components as HealthBasicStep (TASK-08 archetype) | Code review         |
| AC-02: GoalDetailPage uses same button group selector as NutritionGoalStep                 | Code review         |
| AC-03: TrainingProfileForm uses same multi-select chips as TrainingDetailSteps             | Code review         |
| AC-04: Form validation messages identical between onboarding and settings for same fields  | i18n key comparison |
| AC-05: Spacing, typography, and interaction patterns identical (per TASK-08 spec)          | Visual comparison   |

**Impact**: M — Consistency + reduced maintenance.
**Traces**: M004, TASK-08

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | Onboarding adds a new field that Settings doesn't have yet | Shared form archetype includes field. Settings page passes `hideFields={['newField']}` to suppress. |
| EC-02 | Settings form embedded in detail page has less vertical space than onboarding full-screen | Form archetype respects container height. Scrollable within detail page. |

---

### Business Rules — Settings

| Rule      | Description                                                                                                                                                                  | Traces       |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| BR-SET-01 | Health profile changes propagate immediately: weight/height/age → BMR → TDEE → Target → Macros → Dashboard → Calendar → Fitness. Full chain.                                 | R4           |
| BR-SET-02 | Goal changes propagate: goal type + rate → offset → Target → Macros. BMR/TDEE unchanged.                                                                                     | R4           |
| BR-SET-03 | Saving settings = optimistic update to Zustand store + async persist to SQLite. If persist fails, toast error but store keeps new value (retry on next sync).                | Architecture |
| BR-SET-04 | Readiness badges recompute on every store change. Contract defined in `readiness.ts`.                                                                                        | M004         |
| BR-SET-05 | Settings detail page: "Chỉnh sửa" button toggles view → edit mode. "Lưu" persists. "Hủy" reverts to last saved values. UnsavedChangesDialog if navigating away with changes. | Existing     |
| BR-SET-06 | Theme selection: light/dark/system/schedule. Immediate preview. Persisted to localStorage.                                                                                   | Existing     |

### Interaction Rules — Settings

| Rule      | Description                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------- |
| IR-SET-01 | Tap settings card → navigates to detail page (pushPage)                                              |
| IR-SET-02 | Tap "Chỉnh sửa" in detail page → edit mode. Form fields become editable.                             |
| IR-SET-03 | Tap "Lưu" → validate form → if valid: save + return to view mode. If invalid: scroll to first error. |
| IR-SET-04 | Tap "Hủy" → if changes: UnsavedChangesDialog. If no changes: return to view mode.                    |
| IR-SET-05 | Tap back button in detail page → if changes: UnsavedChangesDialog. If no changes: pop page.          |
| IR-SET-06 | Settings menu: close button (top-right) returns to previous tab.                                     |

---

## 3.6 Fitness (M010)

> **Defects addressed**: M010 (empty state + massive complexity)
> **Dependencies**: 3.1–3.5 (all patterns feed in), TASK-09 (large workflow overlay) BLOCKING
> **Current state**: 36 components, ~8.7K LOC. 5 states: Empty → Plan creation → Active → Logging → History. Largest components: TrainingPlanView (1,093 LOC), WorkoutLogger (681 LOC), PlanDayEditor (543 LOC).
> **Risk**: R1 (scope explosion — 13.7K LOC total module)
> **CEO decision**: Q5=By state — decompose into 5 sub-phases.

### Sub-Phase Structure (CEO Q5)

| Sub-Phase | State              | Scope                                                     | Priority |
| --------- | ------------------ | --------------------------------------------------------- | -------- |
| 3.6.1     | Empty State        | FitnessEmptyState, TrainingProfileForm, contextual prompt | P1       |
| 3.6.2     | Plan Creation      | PlanTemplateGallery, AI generation, PlanScheduleEditor    | P1       |
| 3.6.3     | Active Plan        | TrainingPlanView, PlanDayEditor, day operations           | P1       |
| 3.6.4     | Workout Logging    | WorkoutLogger, CardioLogger, SetEditor, RestTimer         | P2       |
| 3.6.5     | Progress & History | ProgressDashboard, WorkoutHistory, milestones             | P2       |

### User Stories

#### US-FIT-01: Empty State → Clear Path to First Plan (Sub-Phase 3.6.1)

**As a** user opening Fitness tab for the first time,
**I want** a clear, encouraging empty state with 2 paths to create a plan (AI-generated or manual),
**so that** I start training within 2 minutes of first visit.

| Acceptance Criteria                                                                                                      | Measurement      |
| ------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| AC-01: Empty state shows when: no active training plan AND no training profile                                           | Unit test        |
| AC-02: EmptyState(hero) variant with Dumbbell icon, title "Bắt đầu hành trình tập luyện", description explaining 2 paths | Visual audit     |
| AC-03: CTA 1: "Tạo kế hoạch AI" → opens TrainingProfileForm → auto-generate plan                                         | Integration test |
| AC-04: CTA 2: "Tạo thủ công" → opens blank PlanDayEditor                                                                 | Integration test |
| AC-05: If training profile exists but no plan → show simplified empty state: "Tạo kế hoạch" only (skip profile step)     | Unit test        |
| AC-06: Contextual prompt (from US-ONB-02) shown max 3 times, then replaced with subtle link                              | Unit test        |

**Impact**: H — First impression of Fitness feature.
**Traces**: M010, Q5, Q4=Hybrid

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | User has archived plans but no active plan | Show empty state with "Tạo kế hoạch mới" + link "Xem lịch sử kế hoạch" |
| EC-02 | Plan generation fails (AI error) | Toast error "Không thể tạo kế hoạch. Thử lại hoặc tạo thủ công." CTAs remain accessible. |
| EC-03 | User creates profile via Settings → comes to Fitness | Empty state updates to show only plan creation CTAs (profile already done). |

---

#### US-FIT-02: Plan Template Gallery (Sub-Phase 3.6.2)

**As a** user creating a training plan,
**I want** to browse pre-built plan templates (PPL, Upper/Lower, Full Body),
**so that** I can start with a proven structure instead of building from scratch.

| Acceptance Criteria                                                                                       | Measurement      |
| --------------------------------------------------------------------------------------------------------- | ---------------- |
| AC-01: Gallery shows templates with: name, split type, days/week, difficulty badge, muscle group coverage | Unit test        |
| AC-02: Template cards sortable by: popularity, difficulty, days/week                                      | Unit test        |
| AC-03: Tap template → preview weekly schedule → "Áp dụng" CTA                                             | Integration test |
| AC-04: Applied template populates TrainingPlanView with exercises                                         | Integration test |
| AC-05: TemplateMatchBadge shows compatibility with user's profile (experience + available days)           | Unit test        |

**Impact**: M — Improves plan quality for non-expert users.
**Traces**: M010

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | No templates match user's available days (e.g., user has 2 days, templates need 3+) | Show all templates with mismatch warning: "Yêu cầu X ngày/tuần. Bạn có Y ngày." |
| EC-02 | User applies template then wants to undo | ConfirmationModal before applying: "Thay thế kế hoạch hiện tại?" with cancel option. |

---

#### US-FIT-03: Active Plan Weekly View (Sub-Phase 3.6.3)

**As a** user with an active training plan,
**I want** a clear weekly view showing each day's workout type, exercises, and completion status,
**so that** I know what to do today and can see my week at a glance.

| Acceptance Criteria                                                                                                    | Measurement         |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------- |
| AC-01: Weekly calendar strip at top shows 7 days (Mon–Sun) with workout type icons                                     | Visual audit        |
| AC-02: Today highlighted with primary border. Completed days show ✓ badge. Rest days show gray.                        | Unit test           |
| AC-03: Tap any day → scrolls to that day's exercise list below                                                         | Integration test    |
| AC-04: Each day card shows: workout type label, exercise count, estimated duration, muscle groups                      | Unit test           |
| AC-05: Today's card has primary CTA: "Bắt đầu tập" (if pending) or "Tiếp tục" (if partial) or "✓ Hoàn thành" (if done) | Unit test: 3 states |
| AC-06: TrainingPlanView < 500 LOC after refactoring (currently 1,093)                                                  | LOC count           |

**Impact**: H — Core fitness interaction.
**Traces**: M010, Q5

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | Today is a rest day | Card shows "Ngày nghỉ" with recovery tips. No "Bắt đầu tập" CTA. Option: "Chuyển thành ngày tập" |
| EC-02 | Plan expired (endDate < today) | Banner: "Kế hoạch đã kết thúc. Tạo mới hoặc gia hạn." CTAs: "Gia hạn" + "Tạo mới" |
| EC-03 | User on week 4 of 8-week plan | Week indicator: "Tuần 4/8". Progress bar 50%. |
| EC-04 | 2 sessions on same day (e.g., morning + evening) | SessionTabs render. Tab 1: "Buổi sáng", Tab 2: "Buổi tối". Each independently trackable. |

---

#### US-FIT-04: Workout Logging Flow (Sub-Phase 3.6.4)

**As a** user doing a workout,
**I want** to log each set (reps, weight, RPE) with minimal friction and automatic rest timer,
**so that** I can focus on training, not data entry.

| Acceptance Criteria                                                                          | Measurement      |
| -------------------------------------------------------------------------------------------- | ---------------- |
| AC-01: WorkoutLogger opens as full-screen overlay (via pushPage)                             | Integration test |
| AC-02: Current exercise shows: name, target sets/reps, previous best (from history)          | Unit test        |
| AC-03: Set entry: reps input + weight input + confirm button. Keyboard numeric.              | Visual audit     |
| AC-04: Rest timer auto-starts after confirming set. Default per exercise type. Customizable. | Unit test        |
| AC-05: PR detection: if weight × reps > previous best → PRToast notification                 | Unit test        |
| AC-06: Workout summary shown on completion: total volume, duration, exercises, PR count      | Unit test        |
| AC-07: WorkoutLogger < 400 LOC after refactoring (currently 681)                             | LOC count        |

**Impact**: H — Core fitness value prop.
**Traces**: M010

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | User enters 0 weight (bodyweight exercise) | Accept 0. Calculate volume as reps only. Label: "Bodyweight" |
| EC-02 | User wants to skip an exercise | "Bỏ qua" button. Exercise marked as skipped (not failed). Not counted in volume. |
| EC-03 | App backgrounded during workout | Timer pauses. On resume, show elapsed time. Warning if > 30min gap. |
| EC-04 | User navigates away without completing workout | UnsavedChangesDialog: "Lưu tiến trình" / "Hủy tập" / "Tiếp tục" |
| EC-05 | REST timer reaches 0 | Haptic vibration (if available) + sound notification. Auto-advance to next set entry. |

---

#### US-FIT-05: Progress Dashboard (Sub-Phase 3.6.5)

**As a** user training regularly,
**I want** a dashboard showing my weight trend, weekly volume, 1RM estimates, and training adherence,
**so that** I can track long-term progress and adjust my plan.

| Acceptance Criteria                                                                                         | Measurement |
| ----------------------------------------------------------------------------------------------------------- | ----------- |
| AC-01: Weight trend chart: line graph, 7/14/30/90 day ranges, current + target weight markers               | Unit test   |
| AC-02: Weekly volume chart: bar graph, last 4 weeks, total kg lifted                                        | Unit test   |
| AC-03: 1RM estimates: top 5 exercises, estimated max based on best set (Epley formula)                      | Unit test   |
| AC-04: Adherence metric: sessions completed / sessions planned × 100%                                       | Unit test   |
| AC-05: Plateau detection: if 1RM unchanged for 3+ weeks → alert banner "Có thể đang đình trệ. Xem đề xuất." | Unit test   |
| AC-06: Time range selector: 7d / 14d / 30d / 90d                                                            | Unit test   |

**Impact**: M — Long-term engagement and retention.
**Traces**: M010

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | < 7 days of data | Show partial chart with "Cần thêm X ngày dữ liệu" note. Disable 30d/90d ranges. |
| EC-02 | 0 weight entries | Weight chart shows EmptyState(compact): "Chưa có dữ liệu cân nặng. Ghi nhận lần đầu." |
| EC-03 | User has only cardio (no strength) | 1RM section hidden. Volume shows cardio metrics (distance, time) instead. |

---

### Business Rules — Fitness

| Rule      | Description                                                                                          | Traces       |
| --------- | ---------------------------------------------------------------------------------------------------- | ------------ |
| BR-FIT-01 | Only 1 active training plan at a time. Creating new plan archives current.                           | Existing     |
| BR-FIT-02 | Rest days show recovery-focused content (tips, stretch suggestions). No "Bắt đầu tập" CTA.           | Q5           |
| BR-FIT-03 | Workout data persists to SQLite via fitnessStore. Every set logged = immediate persist (no batch).   | Architecture |
| BR-FIT-04 | PR detection: compares current set (weight × reps) against all historical sets for same exercise.    | Existing     |
| BR-FIT-05 | Deload weeks: auto-suggested every 4th week (configurable). Volume reduced by 40%.                   | Existing     |
| BR-FIT-06 | Exercise database: 300+ built-in exercises. User can add custom. Custom exercises persist to SQLite. | Existing     |
| BR-FIT-07 | Plan cycle: durationWeeks configurable (4/6/8/12). Auto-repeats or ends based on setting.            | Existing     |
| BR-FIT-08 | Adherence threshold: < 60% for 2 consecutive weeks → prompt "Kế hoạch có phù hợp không? Điều chỉnh?" | New          |
| BR-FIT-09 | Fitness tab sub-tabs: Plan / Progress / History. Default: Plan tab.                                  | Existing     |

### Interaction Rules — Fitness

| Rule      | Description                                                       |
| --------- | ----------------------------------------------------------------- |
| IR-FIT-01 | Tap "Bắt đầu tập" on today's card → pushPage(WorkoutLogger)       |
| IR-FIT-02 | Tap day in weekly strip → scroll to day's exercise list           |
| IR-FIT-03 | Long-press exercise in plan → context menu: Swap / Remove / Notes |
| IR-FIT-04 | Drag exercise via GripVertical handle → reorder within day        |
| IR-FIT-05 | Tap "Thêm bài tập" → ExerciseSelector bottom sheet                |
| IR-FIT-06 | Tap completed workout in history → expands to show set details    |
| IR-FIT-07 | WorkoutLogger: swipe left on exercise → "Bỏ qua" quick action     |

---

## 3.7 AI Analysis (M009)

> **Defects addressed**: M009 (sparseness + trust deficit)
> **Dependencies**: 3.1–3.5 (UI patterns)
> **Current state**: 2 core components (AIImageAnalyzer 148 LOC + AnalysisResultView 227 LOC). Minimal trust cues (1 disclaimer). No confidence score, no error ranges, no verification loop.
> **CEO decision**: Trust cues + contextual first-use.

### User Stories

#### US-AI-01: Trust Cues for AI Results

**As a** user receiving AI nutrition analysis results,
**I want** to see confidence indicators, error ranges, and source attribution,
**so that** I can decide how much to trust the estimates before saving to my library.

| Acceptance Criteria                                                                                                   | Measurement  |
| --------------------------------------------------------------------------------------------------------------------- | ------------ |
| AC-01: Overall confidence badge (High/Medium/Low) displayed at top of results, with color coding (emerald/amber/rose) | Visual audit |
| AC-02: Each nutrition value shows error range: "400 ±60 kcal" format                                                  | Unit test    |
| AC-03: Per-ingredient confidence indicator: dot (green/amber/red) next to each ingredient row                         | Visual audit |
| AC-04: Source attribution: "Phân tích bởi Google Gemini" at bottom                                                    | Visual audit |
| AC-05: Expandable "Tại sao ước tính?" card explaining methodology (collapsible, default collapsed)                    | Unit test    |
| AC-06: Verification prompt: "Kết quả có đúng không?" with 👍/👎 buttons. Feedback stored.                             | Unit test    |

**Impact**: H — Trust determines whether users save AI results (feature adoption).
**Traces**: M009

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | AI returns low confidence (< 40%) | Badge = "Thấp" (rose color). Warning banner: "Kết quả có thể không chính xác. Nên kiểm tra lại." |
| EC-02 | AI cannot identify dish | EmptyState: "Không nhận diện được món ăn. Thử chụp ảnh rõ hơn hoặc gần hơn." |
| EC-03 | One ingredient has 0% confidence (completely guessed) | Ingredient row: red dot + strikethrough + "Không chắc chắn" label. Not included in total by default. |
| EC-04 | Network error during analysis | Toast error: "Lỗi kết nối. Kiểm tra mạng và thử lại." Retry button visible. |

---

#### US-AI-02: Contextual First-Use Experience

**As a** first-time visitor to AI Analysis tab,
**I want** a clear explanation of what the feature does and how to use it,
**so that** I understand the value before taking a photo.

| Acceptance Criteria                                                                          | Measurement      |
| -------------------------------------------------------------------------------------------- | ---------------- |
| AC-01: First visit shows 3-step visual guide: "Chụp ảnh → AI phân tích → Lưu món" with icons | Visual audit     |
| AC-02: Value proposition banner: explains quick calorie estimation in 1–2 sentences          | Visual audit     |
| AC-03: Example badges: "Phở · Cơm · Salad" (dishes it works well with)                       | Visual audit     |
| AC-04: "Thử ngay" CTA directly opens camera/upload                                           | Integration test |
| AC-05: After first successful analysis, first-use guide collapses to subtle "Tips" link      | Unit test        |
| AC-06: Best-practices tooltip: "Chụp từ trên xuống, đủ sáng, một món/ảnh"                    | Visual audit     |

**Impact**: M — Feature discoverability.
**Traces**: M009, Q4=Hybrid (contextual prompts)

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | User visits AI tab but never takes photo | Guide persists across visits until first successful analysis. |
| EC-02 | Camera permission denied | Fallback to file upload only. Message: "Cho phép camera để chụp trực tiếp, hoặc chọn ảnh từ thư viện." |

---

#### US-AI-03: Save to Library Integration

**As a** user satisfied with AI analysis results,
**I want** to save the analyzed dish directly to my Library with pre-filled nutrition data,
**so that** I can use it in meal planning immediately.

| Acceptance Criteria                                                                                          | Measurement      |
| ------------------------------------------------------------------------------------------------------------ | ---------------- |
| AC-01: "Lưu vào thư viện" button at bottom of results                                                        | Existing: verify |
| AC-02: Tapping save → opens DishEditModal pre-filled with: AI dish name, AI ingredients, AI nutrition values | Integration test |
| AC-03: User can edit any field before saving (name, ingredients, nutrition)                                  | Unit test        |
| AC-04: After save → toast "Đã lưu [dish name] vào thư viện" + navigate to Library tab                        | Integration test |
| AC-05: Saved dish tagged with "AI" badge in Library for provenance tracking                                  | Unit test        |

**Impact**: M — Connects AI feature to core meal planning loop.
**Traces**: M009

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | Dish name already exists in Library | Modal shows warning: "Tên món đã tồn tại. Đổi tên hoặc cập nhật món hiện có?" Options: rename / update / cancel |
| EC-02 | AI detected ingredient not in ingredient database | Auto-create ingredient with AI nutrition values. Tag with "AI" badge. |

---

### Business Rules — AI Analysis

| Rule     | Description                                                                                   | Traces   |
| -------- | --------------------------------------------------------------------------------------------- | -------- |
| BR-AI-01 | Confidence levels: High ≥ 70%, Medium 40–69%, Low < 40%. Colors: emerald/amber/rose.          | M009     |
| BR-AI-02 | Error range calculation: ±15% for High confidence, ±25% for Medium, ±40% for Low.             | M009     |
| BR-AI-03 | Feedback (👍/👎) stored locally per analysis. Used for future model improvement signal.       | M009     |
| BR-AI-04 | Analysis history: last 10 analyses stored with results. Accessible via "Lịch sử" sub-section. | M009     |
| BR-AI-05 | Image requirements: minimum 200×200px, max 10MB. JPEG/PNG/WebP accepted.                      | Existing |
| BR-AI-06 | Rate limiting: max 10 analyses per hour per device. Show count: "Còn X/10 lượt phân tích"     | New      |

### Interaction Rules — AI Analysis

| Rule     | Description                                                                                   |
| -------- | --------------------------------------------------------------------------------------------- |
| IR-AI-01 | Tap camera button → opens device camera (or file picker if no camera permission)              |
| IR-AI-02 | Tap "Phân tích món ăn" → show analyzing skeleton (3–8 seconds). Spinner + "Đang phân tích..." |
| IR-AI-03 | Tap confidence badge → expands explanation card                                               |
| IR-AI-04 | Tap 👍/👎 → feedback recorded, subtle "Cảm ơn!" acknowledgment                                |
| IR-AI-05 | Tap "Lưu vào thư viện" → opens DishEditModal pre-filled                                       |
| IR-AI-06 | Swipe image left/right → retake / upload new image                                            |

---

## 3.8 Polish — Global Motion & Skeleton (M012)

> **Defects addressed**: M012 (page transition abruptness + animation gaps), M002 (perceived latency)
> **Dependencies**: 3.1–3.7 (all screens must be stable before polish)
> **Current state**: motion v12 available. 4 easing tokens defined. Reduced motion support exists. PageStackOverlay uses CSS-only transitions. Skeleton component exists (shadcn/ui). Dashboard has NutritionHeroSkeleton.

### User Stories

#### US-POL-01: Global Page Transition System

**As a** user navigating between screens,
**I want** smooth, consistent page transitions (tabs + full-screen overlays),
**so that** the app feels polished and spatial navigation is intuitive.

| Acceptance Criteria                                                                              | Measurement                      |
| ------------------------------------------------------------------------------------------------ | -------------------------------- |
| AC-01: Tab switch: crossfade `opacity 0→1` + `translateY(8px→0)`, duration 200ms, `--ease-enter` | Visual audit                     |
| AC-02: Full-screen page enter (pushPage): `translateX(100%→0)`, duration 250ms, `--ease-enter`   | Visual audit                     |
| AC-03: Full-screen page exit (popPage): `translateX(0→100%)`, duration 200ms, `--ease-exit`      | Visual audit                     |
| AC-04: Modal enter: `opacity 0→1` + `scale(0.95→1)`, duration 200ms, `--ease-enter`              | Visual audit                     |
| AC-05: Modal exit: `opacity 1→0` + `scale(1→0.95)`, duration 150ms, `--ease-exit`                | Visual audit                     |
| AC-06: Bottom sheet enter: `translateY(100%→0)`, duration 250ms, `--ease-spring`                 | Visual audit                     |
| AC-07: All transitions respect `prefers-reduced-motion: reduce` → instant (0ms duration)         | Unit test: useReducedMotion mock |

**Impact**: M — Perceived quality.
**Traces**: M012, Q3=B (moderate motion)

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | User taps tab rapidly during transition | Transition cancels and jumps to new tab. No animation stacking. |
| EC-02 | Low-end Android device (< 4GB RAM) | Transitions use CSS transforms only (GPU-accelerated). No JavaScript animation. No layout thrashing. |
| EC-03 | Page stack depth = 2 (max) and user pushes again | Push blocked. Console warning. |

---

#### US-POL-02: Skeleton Screens for All Data Sections

**As a** user,
**I want** every data-dependent section to show a skeleton loader instead of blank space,
**so that** the app feels responsive even when data is loading.

| Acceptance Criteria                                                                      | Measurement                 |
| ---------------------------------------------------------------------------------------- | --------------------------- |
| AC-01: Dashboard: NutritionHeroSkeleton + TodaysPlanCardSkeleton + AiInsightCardSkeleton | Visual: 3 skeletons         |
| AC-02: Calendar MealsSubTab: MealSlotSkeleton × 3                                        | Visual: 3 skeletons         |
| AC-03: Calendar NutritionSubTab: EnergyBalanceCardSkeleton + ChartSkeleton               | Visual: 2 skeletons         |
| AC-04: Library: DishGridCardSkeleton × 6 (or DishListRowSkeleton × 10)                   | Visual: grid/list skeletons |
| AC-05: Fitness TrainingPlanView: WeeklyStripSkeleton + DayCardSkeleton × 7               | Visual: 8 skeletons         |
| AC-06: AI Analysis result: NutritionCardSkeleton × 4 + IngredientRowSkeleton × 5         | Visual: 9 skeletons         |
| AC-07: Settings: CardSkeleton × 3 for menu items                                         | Visual: 3 skeletons         |
| AC-08: All skeletons use `animate-pulse` and match final content dimensions within ±10%  | Measurement                 |

**Impact**: M — Perceived performance across all screens.
**Traces**: M012, M002

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | Data loads in 16ms (instant, single frame) | Skeleton still shows for 200ms minimum (GCR-05). Prevents layout shift. |
| EC-02 | Data load hangs (10+ seconds) | Skeleton persists. After 10s, show "Đang tải lâu hơn bình thường..." text below skeleton. |
| EC-03 | Reduced motion enabled | Skeleton renders as static gray blocks (no pulse animation). |

---

#### US-POL-03: Press Feedback & Micro-Interactions

**As a** user tapping buttons and cards,
**I want** immediate visual feedback on press,
**so that** I know my taps are registered.

| Acceptance Criteria                                                                                                  | Measurement  |
| -------------------------------------------------------------------------------------------------------------------- | ------------ |
| AC-01: All `<button>` elements: `active:scale-[0.97]` + `transition-transform duration-100`                          | CSS audit    |
| AC-02: All tappable cards (MealSlot, DishCard, SettingsCard): same press feedback                                    | CSS audit    |
| AC-03: Primary CTA buttons: `active:scale-[0.97]` + subtle shadow reduction                                          | Visual audit |
| AC-04: Toggle buttons (meal type filters, gender, activity): smooth color transition on state change, duration 150ms | Visual audit |
| AC-05: Disabled elements: NO press feedback. `disabled:opacity-50 disabled:pointer-events-none`.                     | Unit test    |

**Impact**: L — Polish detail.
**Traces**: M012, Q3=B

**Edge Cases**:
| # | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | User double-taps button rapidly | First tap registers. Second tap debounced (200ms). No double-action. |
| EC-02 | User taps and holds (long-press) | Press feedback shows immediately (100ms). Long-press action triggers at 500ms if applicable. |

---

### Business Rules — Polish

| Rule      | Description                                                                                                                    | Traces            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| BR-POL-01 | All animations use tokens: `--ease-enter`, `--ease-exit`, `--ease-spring`, `--ease-linear`. No hardcoded easing.               | M012              |
| BR-POL-02 | Animation durations: enter 200–250ms, exit 150–200ms. Never > 300ms for UI transitions.                                        | Q3=B              |
| BR-POL-03 | Skeleton minimum display: 200ms. Maximum before timeout message: 10s.                                                          | M002              |
| BR-POL-04 | GPU-only properties for transitions: `transform`, `opacity`. Never animate `width`, `height`, `top`, `left`.                   | R3 (WebView jank) |
| BR-POL-05 | `useReducedMotion` hook checked at top of every component that renders animation. If true: duration=0.                         | Accessibility     |
| BR-POL-06 | motion library (v12) used ONLY where CSS transitions insufficient (complex orchestration, spring physics). Default: CSS-first. | R3                |

---

## Dependency Matrix

```
                3.1   3.2   3.3   3.4   3.5   3.6   3.7   3.8
3.1 Dashboard    —    ←     ←     ←     ←     ←     ←     ←
3.2 Calendar    3.1    —
3.3 Library     3.1         —
3.4 Onboarding             T08    —
3.5 Settings               T08   3.4    —
3.6 Fitness     3.1  3.2  3.3  3.4  3.5    —   T09
3.7 AI Analysis 3.1  3.2  3.3  3.4  3.5          —
3.8 Polish      3.1  3.2  3.3  3.4  3.5  3.6  3.7   —

Legend: ← = "provides patterns to"
        T08 = TASK-08 compact form (BLOCKING)
        T09 = TASK-09 large workflow overlay (BLOCKING)
```

### Critical Path:

```
TASK-08 → 3.1 → 3.4 → 3.5 → 3.6.1 → 3.6.2 → 3.6.3 → 3.6.4 → 3.6.5 → 3.8
              ↘ 3.2
              ↘ 3.3
              ↘ 3.7
```

### Parallel Opportunities:

- **3.2 + 3.3 + 3.7** can run in parallel after 3.1 completes
- **3.4 + 3.1** can overlap (3.4 baseline tests while 3.1 implements)
- **3.6 sub-phases** are sequential (state dependencies)

---

## Risk Register

| ID  | Risk                                                              | Probability | Impact | Mitigation                                                                                                                                    | Owner       |
| --- | ----------------------------------------------------------------- | ----------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| R1  | Fitness scope explosion (13.7K LOC, 63 components)                | High        | High   | Decompose into 5 sub-phases (Q5). Max 1 sub-phase per sprint. Strict scope boundaries.                                                        | Tech Leader |
| R2  | Onboarding regression during redesign                             | Medium      | High   | Baseline tests FIRST (US-ONB-03). 100% coverage before any modification.                                                                      | QA          |
| R3  | WebView animation jank on low-end Android                         | Medium      | Medium | CSS-only transitions (GPU props: transform, opacity). Test on Pixel 3a emulator. Budget: 16ms/frame.                                          | Dev         |
| R4  | Cross-store propagation bugs (NaN/undefined)                      | Medium      | High   | Defense-in-depth: Number.isFinite() guard at hook output + display helpers + component guards. Existing pattern — extend to all new displays. | Dev         |
| R5  | TASK-08 compact form delays block 3.4 + 3.5                       | Low         | High   | Prioritize TASK-08 in first sprint. Fallback: implement forms without archetype, migrate later.                                               | Tech Leader |
| R6  | Designer/Dev interpretation gap on "Balanced density"             | Medium      | Medium | Reference screenshots: MyFitnessPal home screen. Concrete pixel specs in design handoff.                                                      | Designer    |
| R7  | Parallel work on 3.2 + 3.3 + 3.7 creates merge conflicts          | Medium      | Low    | Clear file ownership per screen group. No shared file modifications across parallel streams.                                                  | Tech Leader |
| R8  | AI Analysis trust cues require backend changes (confidence score) | Low         | Medium | Check if Google Gemini API returns confidence metadata. If not, estimate client-side based on ingredient count + image quality heuristics.    | Dev         |

---

## Appendix A: Traceability Matrix

| Defect ID | Screen Group | User Stories         | Business Rules             |
| --------- | ------------ | -------------------- | -------------------------- |
| M001      | ALL          | GCR-01–10            | All BR use semantic tokens |
| M002      | 3.8          | US-POL-01, US-POL-02 | BR-POL-03                  |
| M003      | 3.1          | US-DASH-01–05        | BR-DASH-01–09              |
| M004      | 3.5          | US-SET-01            | BR-SET-01–06               |
| M005      | 3.5          | US-SET-02            | BR-SET-05                  |
| M006      | 3.4          | US-ONB-01–04         | BR-ONB-01–06               |
| M007      | 3.2          | US-CAL-01–04         | BR-CAL-01–08               |
| M008      | 3.3          | US-LIB-01–04         | BR-LIB-01–07               |
| M009      | 3.7          | US-AI-01–03          | BR-AI-01–06                |
| M010      | 3.6          | US-FIT-01–05         | BR-FIT-01–09               |
| M012      | 3.8          | US-POL-01–03         | BR-POL-01–06               |

## Appendix B: Story Count & Impact Summary

| Screen Group    | Stories | High Impact | Medium Impact | Low Impact | Business Rules | Edge Cases |
| --------------- | ------- | ----------- | ------------- | ---------- | -------------- | ---------- |
| 3.1 Dashboard   | 5       | 3           | 2             | 0          | 9              | 13         |
| 3.2 Calendar    | 4       | 2           | 2             | 0          | 8              | 10         |
| 3.3 Library     | 4       | 0           | 3             | 1          | 7              | 8          |
| 3.4 Onboarding  | 4       | 3           | 1             | 0          | 6              | 8          |
| 3.5 Settings    | 3       | 0           | 3             | 0          | 6              | 4          |
| 3.6 Fitness     | 5       | 3           | 2             | 0          | 9              | 12         |
| 3.7 AI Analysis | 3       | 1           | 2             | 0          | 6              | 6          |
| 3.8 Polish      | 3       | 0           | 2             | 1          | 6              | 6          |
| **TOTAL**       | **31**  | **12**      | **17**        | **2**      | **57**         | **67**     |

---

**[BM] Trạng thái: LOGIC*NGHIỆP_VỤ*ĐÃ_CHỐT**

> 31 User Stories, 57 Business Rules, 67 Edge Cases, 10 Global Consistency Rules.
> Tất cả trace ngược về Phase 0 defects (M001–M012) và CEO decisions (Q1–Q7).
> Sẵn sàng chuyển cho Designer và Tech Leader.
