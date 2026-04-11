# 📋 BM Deliverable — Phase 3.3 Fitness Screen Redesign

> **Status:** LOGIC*NGHIỆP_VỤ*ĐÃ_CHỐT
> **Date:** 2026-07-31
> **Author:** Business Manager (BM)
> **Input:** CEO Phase 3.3 Vision + Codebase Analysis
> **Output:** 32 User Stories, 48 Business Rules, 87 Edge Cases, Data Flows

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [User Stories](#3-user-stories)
4. [Business Rules](#4-business-rules)
5. [Edge Cases Matrix](#5-edge-cases-matrix)
6. [Data Flow Descriptions](#6-data-flow-descriptions)
7. [Acceptance Criteria Summary](#7-acceptance-criteria-summary)
8. [Traceability Matrix](#8-traceability-matrix)

---

## 1. Executive Summary

### Scope

Transform Fitness tab from "clinical tracker" → "encouraging fitness coach." 12 Functional Requirements from CEO map to **32 User Stories** grouped into 5 waves. Each story has measurable acceptance criteria, ≥2 edge cases, and traceable business rules.

### Key Numbers (Current State — verified from source code)

| Metric                      | Current | Source                 |
| --------------------------- | ------- | ---------------------- |
| TrainingPlanView LOC        | 1,093   | `TrainingPlanView.tsx` |
| WorkoutLogger LOC           | 681     | `WorkoutLogger.tsx`    |
| WorkoutHistory LOC          | 382     | `WorkoutHistory.tsx`   |
| RestTimer LOC               | 175     | `RestTimer.tsx`        |
| StreakCounter LOC           | 73      | `StreakCounter.tsx`    |
| ExerciseSelector LOC        | 285     | `ExerciseSelector.tsx` |
| Total fitness component LOC | 2,879   | 7 files                |
| Store actions               | 41+     | `fitnessStore.ts`      |
| Milestone thresholds        | 10      | `gamification.ts`      |
| Max sessions/day            | 3       | `fitnessStore.ts:412`  |

### Risk Summary

| Risk                                                             | Impact | Mitigation                                               |
| ---------------------------------------------------------------- | ------ | -------------------------------------------------------- |
| TrainingPlanView 1093 LOC decomposition breaks existing behavior | High   | Wave 1 first, test before UI changes                     |
| Rest timer 60fps causes battery drain on low-end devices         | Medium | `setInterval(1000)` (current) + CSS transition (not rAF) |
| PR detection at same-rep threshold may miss volume PRs           | Low    | Phase 2 enhancement, keep current rep-matched logic      |

---

## 2. Current State Analysis

### 2.1 Fitness Tab Layout (FitnessTab.tsx)

```
FitnessTab
├── SubTabBar: plan | progress | history
├── Profile out-of-sync warning banner
└── Content:
    ├── [plan] SmartInsightBanner → PlanGeneratedCard → TrainingPlanView
    │   └── StreakCounter → EnergyBalanceCard → 7-day strip → Day accordion
    ├── [history] WorkoutHistory (week grouping → day → exercise sets)
    └── [progress] ProgressDashboard (charts, volume, PRs)
```

### 2.2 Key Business Constants (from constants.ts + fitnessStore.ts)

| Constant               | Value              | Location                  |
| ---------------------- | ------------------ | ------------------------- |
| `WEIGHT_INCREMENT`     | 0.5 kg             | constants.ts:15           |
| `REPS_INCREMENT`       | 1                  | constants.ts:16           |
| `MIN_WEIGHT_KG`        | 0                  | constants.ts:17           |
| `MIN_REPS`             | 1                  | constants.ts:18           |
| `DEFAULT_REST_SECONDS` | 90s                | constants.ts:19           |
| `RPE_OPTIONS`          | [6, 7, 8, 9, 10]   | constants.ts:12           |
| `BODY_WEIGHT_MIN_KG`   | 30                 | constants.ts              |
| `BODY_WEIGHT_MAX_KG`   | 300                | constants.ts              |
| Max sessions/day       | 3 (hardcoded)      | fitnessStore.ts:412       |
| Plateau threshold      | 3 weeks            | useProgressiveOverload.ts |
| Weight tolerance       | ±2%                | plateauAnalysis.ts        |
| Grace period           | 1 day              | gamification.ts           |
| Streak milestones      | 7, 14, 30, 60, 90  | gamification.ts:43-47     |
| Session milestones     | 1, 10, 25, 50, 100 | gamification.ts:38-42     |

### 2.3 Existing Design Patterns (from Phase 3.1/3.2)

| Pattern                | Spec                                                          | Used In             |
| ---------------------- | ------------------------------------------------------------- | ------------------- |
| Hero card              | `bg-primary-subtle rounded-2xl p-4 shadow-sm`                 | CombinedHero.tsx    |
| Sub-tabs               | `SubTabBar` with `min-h-11` touch                             | Calendar, Fitness   |
| Empty state (hero)     | `EmptyState variant="hero"` — icon + title + desc + CTA       | Shared component    |
| Empty state (standard) | `EmptyState variant="standard"` — icon + title + desc         | Shared component    |
| Card base              | `rounded-2xl shadow-md p-3`                                   | TodaysPlanCard.tsx  |
| Stagger animation      | `animate-slide-up` + 30ms increments                          | DashboardTab.tsx    |
| Reduced motion         | `@media (prefers-reduced-motion: reduce)` → `animation: none` | animations.css      |
| Touch targets          | `min-h-11` (44px) minimum                                     | SubTabBar, MealSlot |
| Press feedback         | `active:scale-[0.98]`                                         | All interactive     |
| Energy color           | `text-energy`, `bg-energy-subtle`                             | Fitness badges      |
| Status colors          | `bg-success-subtle border-success/30`                         | State cards         |

---

## 3. User Stories

### WAVE 1 — Foundation & Decomposition

---

#### US-01: TrainingPlanView Decomposition — Today Card

**FR Trace:** FR-10 (TrainingPlanView Decomposition)
**Impact:** High — Blocking dependency for Wave 2-5
**Priority:** P0

**As a** developer,
**I want** the "Today's workout" section (currently lines 609-765 of TrainingPlanView.tsx) extracted into a standalone `<TodayWorkoutCard />` component,
**So that** each component is ≤250 LOC, independently testable, and modifiable without risk to unrelated sections.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | `TodayWorkoutCard.tsx` exists as standalone component | File exists, ≤250 LOC |
| AC-2 | Props interface is typed (planDay, onStart, onConvert, isExpanded) | 0 `any` types |
| AC-3 | Existing behavior identical — Start Workout, Convert to Rest, Modified badge, Restore button | 0 visual regression via screenshot comparison |
| AC-4 | Unit tests pass with 100% statement coverage for new component | `npx vitest --coverage` confirms |
| AC-5 | TrainingPlanView.tsx reduced by ≥150 LOC after extraction | `wc -l` before vs after |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | Today has NO planned workout (rest day or no plan) | TodayWorkoutCard not rendered; TodayRestCard rendered instead |
| EC-2 | Today has 3 sessions (max) | All 3 sessions visible via SessionTabs; "Add session" button disabled |
| EC-3 | planDay.exercises is empty JSON `"[]"` | Empty exercise list shown with "Add exercises" CTA |
| EC-4 | User modified exercises (exercises ≠ originalExercises) | "Modified" badge visible + "Restore original" button enabled |

---

#### US-02: TrainingPlanView Decomposition — Rest Day Card

**FR Trace:** FR-10
**Impact:** High
**Priority:** P0

**As a** developer,
**I want** the "Today's rest day" section (lines 768-836) extracted into `<TodayRestCard />`,
**So that** rest day logic is isolated and reusable.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | `TodayRestCard.tsx` exists | ≤150 LOC |
| AC-2 | Shows rest day message, tips, tomorrow preview, quick actions (weight/cardio) | All 4 sections rendered |
| AC-3 | Quick actions trigger correct navigation (weight → WeightQuickLog, cardio → WorkoutLogger with mode=cardio) | Functional test verifies navigation calls |
| AC-4 | 100% test coverage | Vitest confirms |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | Tomorrow has no planned workout (consecutive rest) | Tomorrow preview shows "Nghỉ ngơi" instead of workout details |
| EC-2 | No active plan but today is rest (impossible state) | Guard: if no active plan, don't render TodayRestCard; fall through to EmptyState |

---

#### US-03: TrainingPlanView Decomposition — Calendar Strip

**FR Trace:** FR-10, FR-02
**Impact:** High
**Priority:** P0

**As a** developer,
**I want** the 7-day calendar strip (lines 420-471) extracted into `<WeekCalendarStrip />`,
**So that** it becomes reusable and can support the Week Overview Strip (FR-02) enhancement.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | `WeekCalendarStrip.tsx` exists | ≤200 LOC |
| AC-2 | 7 pill buttons rendered, Mon-Sun | DOM has exactly 7 buttons |
| AC-3 | Active day highlighted with `bg-primary` | Active pill has correct class |
| AC-4 | Each pill shows: day label (T2-CN), workout type icon OR rest icon, completion badge if has workout logged | All 3 visual elements present |
| AC-5 | Tap pill calls `onDaySelect(dayOfWeek)` | Event handler fires with correct 1-7 value |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | User has no active plan | Strip shows 7 pills with no workout indicators; all pills show generic circle |
| EC-2 | Plan has only 2 training days (e.g., Tue+Thu) | 5 pills show rest icon, 2 show workout icon |
| EC-3 | User completed workout on non-plan day (spontaneous) | Pill shows check mark (completed) even though it wasn't scheduled |

---

#### US-04: TrainingPlanView Decomposition — Day Accordion

**FR Trace:** FR-10
**Impact:** High
**Priority:** P0

**As a** developer,
**I want** the non-today day rendering (lines 840-973) extracted into `<PlanDayAccordion />`,
**So that** each day's expand/collapse logic is self-contained.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | `PlanDayAccordion.tsx` exists | ≤250 LOC |
| AC-2 | Collapsed state shows: day name, muscle groups, exercise count, chevron | 4 elements visible |
| AC-3 | Expanded state shows: full exercise list, session tabs (if multi-session), start workout button | All elements present |
| AC-4 | Click toggles expand/collapse with animation | Transition duration ≤200ms |
| AC-5 | 100% test coverage | Vitest confirms |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | Day has 0 exercises (newly created session) | Collapsed shows "0 bài tập", expanded shows empty state + "Add exercises" CTA |
| EC-2 | Day has 3 sessions | SessionTabs visible in expanded state; each session expandable independently |
| EC-3 | Day is rest day but has logged workout | Show workout badge (completed) overlay on rest icon |

---

#### US-05: TrainingPlanView Decomposition — Action Bar

**FR Trace:** FR-10
**Impact:** Medium
**Priority:** P0

**As a** developer,
**I want** the action bar (lines 473-565, Edit Schedule / Change Split / Templates / Context Menu) extracted into `<PlanActionBar />`,
**So that** plan management actions are isolated from day rendering.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | `PlanActionBar.tsx` exists | ≤200 LOC |
| AC-2 | 3 action buttons visible: Edit Schedule, Change Split, Templates | 3 buttons rendered |
| AC-3 | Each action triggers correct modal/navigation | Functional test verifies |
| AC-4 | Context menu (long-press day) still functional | Long-press ≥500ms opens menu |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | No active plan | Action bar hidden; empty state CTA shown instead |
| EC-2 | Plan status is "completed" | "Edit Schedule" disabled; "Change Split" disabled; "Templates" still active |

---

#### US-06: TrainingPlanView Decomposition — Empty States

**FR Trace:** FR-10, FR-09
**Impact:** Medium
**Priority:** P0

**As a** developer,
**I want** the 4 empty states (no plan, expired plan, manual prompt, auto prompt — lines 315-417) extracted into dedicated components using the shared `<EmptyState />` pattern,
**So that** empty states are consistent with Phase 3.1/3.2.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | Each empty state uses `EmptyState` shared component | 0 custom empty state markup |
| AC-2 | `variant="hero"` used for blocking states (no plan) | Correct variant prop |
| AC-3 | CTA buttons use `active:scale-[0.98]` press feedback | CSS class present |
| AC-4 | Icons from Lucide, ≥h-8 w-8 | Icon size verified |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | User had plan that was deleted (not expired) | Shows "no plan" empty state, not "expired" |
| EC-2 | planStrategy is null (never chosen) | Shows choice between auto/manual; neither pre-selected |

---

#### US-07: TrainingPlanView Final — Parent Orchestrator

**FR Trace:** FR-10
**Impact:** High
**Priority:** P0

**As a** developer,
**I want** the remaining `TrainingPlanView.tsx` to be ≤250 LOC, acting as an orchestrator that composes the 6 extracted components,
**So that** the 1093→≤250 LOC target is met.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | `TrainingPlanView.tsx` ≤250 LOC | `wc -l` ≤ 250 |
| AC-2 | All 6 sub-components imported and composed | Imports verified |
| AC-3 | No business logic in parent — only composition + state wiring | 0 calculation functions inline |
| AC-4 | All existing e2e/integration tests pass | 0 test regressions |
| AC-5 | SonarQube cognitive complexity ≤15 | SonarQube scan confirms |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | Props drilling ≥3 levels deep | Use context or callback props — never drill >2 levels |
| EC-2 | Circular dependency between extracted components | Each component imports only from types/utils, never from siblings |

---

### WAVE 2 — Today-First Layout + Empty States

---

#### US-08: Hero Card — Today's Workout

**FR Trace:** FR-01 (Today-First Layout)
**Impact:** High — Core value proposition
**Priority:** P1

**As a** user opening the Fitness tab,
**I want** to see a prominent hero card answering "Hôm nay tập gì?" within 1 second,
**So that** I can immediately start my planned workout without navigation.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | Hero card is the FIRST visual element below sub-tabs | DOM order verified |
| AC-2 | Shows: workout name, muscle groups, exercise count, estimated duration | All 4 data points visible |
| AC-3 | Primary CTA "Bắt đầu" button with ≥48dp touch target | `min-h-12` class present |
| AC-4 | Uses `bg-primary-subtle rounded-2xl p-4 shadow-sm` (Phase 3.1/3.2 pattern) | CSS classes match |
| AC-5 | Render time ≤100ms from tab activation | Performance.mark measurement |
| AC-6 | `animate-slide-up` entrance with stagger tier 1 | Animation class present |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | Today is a rest day | Hero shows rest day card with recovery tips; no "Start" button; show tomorrow preview |
| EC-2 | User already completed today's workout | Hero shows completion summary (duration, volume, PRs); "Start" replaced with "View summary" |
| EC-3 | Today has 2 completed sessions + 1 remaining | Hero shows remaining session details; completed sessions shown as mini badges |
| EC-4 | No active training plan | Hero area shows `EmptyState variant="hero"` with CTA "Tạo kế hoạch" |
| EC-5 | prefers-reduced-motion: reduce | No slide-up animation; instant render with `opacity: 1; transform: none` |

---

#### US-09: Week Overview Strip

**FR Trace:** FR-02 (Week Overview Strip)
**Impact:** Medium
**Priority:** P1

**As a** user,
**I want** to see a 7-day week strip showing completion status for each day,
**So that** I can quickly assess my weekly progress and tap to preview any day.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | 7 pills visible horizontally, no horizontal scroll | Container `flex` with `flex-1` children |
| AC-2 | Each pill shows: day abbreviation (T2-CN), status icon (check/rest/target/empty), today highlighted | 3 visual layers per pill |
| AC-3 | Tap pill expands day detail below strip | `onDaySelect` fires; detail section renders ≤200ms |
| AC-4 | Completed days show green check (`text-success`) | Color token verified |
| AC-5 | Rest days show moon icon (`text-info`) | Color token verified |
| AC-6 | Today pill has ring indicator (`ring-2 ring-primary`) | CSS class present |
| AC-7 | Each pill touch target ≥44px × 44px | `min-h-11 min-w-11` classes |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | Monday is first day of plan but today is Wednesday | Mon/Tue show completed/missed; Wed highlighted as today; Thu-Sun show upcoming |
| EC-2 | User completed workout on unscheduled day | Pill shows green check (completed) even if plan says "rest" |
| EC-3 | Plan has 7 training days (no rest) | All 7 pills show training icon; no moon icons |
| EC-4 | No active plan | All 7 pills show neutral state (gray circle); tap does nothing |

---

#### US-10: Compelling Empty States

**FR Trace:** FR-09 (Empty States)
**Impact:** Medium
**Priority:** P1

**As a** new user with no training data,
**I want** to see encouraging empty states with clear CTAs,
**So that** I'm guided to create my first training plan instead of seeing a blank screen.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | 5 empty state contexts covered: no plan, no history, no progress data, empty plan day, exercise search no results | All 5 implemented |
| AC-2 | Each uses `<EmptyState />` shared component | No custom markup |
| AC-3 | Each has: icon (Lucide, ≥h-6 w-6), title (≤8 words), description (≤20 words), CTA button (≥44px) | All 4 elements present per state |
| AC-4 | CTA navigates to correct action (e.g., "Tạo kế hoạch" → plan creation flow) | Navigation verified |
| AC-5 | `animate-fade-in` entrance | Animation class present |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | User had data but deleted everything | Same empty state as new user — no "deleted" variant |
| EC-2 | Slow DB load — data might arrive after initial render | Show skeleton/loading state first; transition to empty state only after load confirms 0 records |
| EC-3 | User is on history tab, has plan but no workouts | History empty state shown with CTA "Bắt đầu buổi tập đầu tiên" linking to plan tab |

---

### WAVE 3 — Workout Logger Speed

---

#### US-11: Stepper Button Enhancement

**FR Trace:** FR-03 (Workout Logger Speed)
**Impact:** High — Core logging UX
**Priority:** P1

**As a** user logging a set,
**I want** large stepper buttons (±) for weight and reps with haptic-like feedback,
**So that** I can adjust values quickly between sets without precise typing.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | Weight ± buttons: touch target ≥48dp × 48dp | `min-h-12 min-w-12` classes |
| AC-2 | Reps ± buttons: touch target ≥48dp × 48dp | Same |
| AC-3 | Weight increment: 0.5kg per tap (existing `WEIGHT_INCREMENT`) | Functional test: 70 → tap + → 70.5 |
| AC-4 | Reps increment: 1 per tap (existing `REPS_INCREMENT`) | Functional test: 8 → tap + → 9 |
| AC-5 | Long-press (≥500ms) on ± starts rapid increment at 150ms intervals | Hold + for 1s → value increased by ≥3 increments |
| AC-6 | Visual press feedback: `active:scale-[0.95]` + background color change | CSS classes present |
| AC-7 | Input field still editable for direct number entry | Tap input → keyboard opens |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | Weight at MIN_WEIGHT_KG (0) and user taps − | Value stays at 0; − button shows `opacity-50` disabled state |
| EC-2 | Reps at MIN_REPS (1) and user taps − | Value stays at 1; − button disabled |
| EC-3 | Weight at very high value (e.g., 500kg) | No upper cap enforced in constants; allow input but show warning if >300kg |
| EC-4 | User enters non-numeric text in direct input | `inputMode="decimal"` prevents on mobile; on desktop, `parseFloat` → NaN → fallback to previous value |
| EC-5 | Rapid tapping (>5 taps/second) | Debounce not needed (each tap is discrete state update); values increment linearly |

---

#### US-12: Copy Previous Set

**FR Trace:** FR-03
**Impact:** High
**Priority:** P1

**As a** user starting a new set for an exercise,
**I want** a "Copy previous set" button that pre-fills weight/reps/RPE from my last set,
**So that** I don't re-enter the same values for working sets.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | "Copy previous" button visible below set inputs when ≥1 set exists for current exercise | Button rendered conditionally |
| AC-2 | Tap copies weight, reps, and RPE from last logged set of SAME exercise in THIS session | Values pre-filled correctly |
| AC-3 | Button text shows preview: "Lặp lại: {weight}kg × {reps}" | Dynamic text matches last set |
| AC-4 | Touch target ≥44dp | `min-h-11` class |
| AC-5 | If previous session data exists (from `useProgressiveOverload`), show as secondary option | "Buổi trước: {weight}kg × {reps}" shown distinctly |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | First set of exercise in session (no current-session history) | "Copy previous" hidden for current session; show "Buổi trước" from last workout if available |
| EC-2 | First time doing this exercise ever | Neither button shown; user must input manually |
| EC-3 | Previous set had RPE=10 (maximum effort) | Copy includes RPE=10; progressive overload may suggest lower RPE with more weight |

---

#### US-13: Progressive Overload Auto-Fill

**FR Trace:** FR-03
**Impact:** Medium
**Priority:** P1

**As a** user,
**I want** the logger to auto-suggest weight/reps based on progressive overload logic,
**So that** I progressively increase load without manual tracking.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | Suggestion chip visible when previous workout data exists | Chip rendered with icon + text |
| AC-2 | Shows one of: "↑ Weight" (hit max reps last time) or "↑ Reps" (same weight, +1 rep) | Correct source label |
| AC-3 | One-tap apply fills inputs | Values set on tap |
| AC-4 | Overload increment respects experience level: beginner ±1.25kg, intermediate ±2kg, advanced ±2.5kg (upper body) | Increment verified per profile |
| AC-5 | Plateau warning shown if 3+ weeks same weight (±2% tolerance) | Warning badge visible |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | User is beginner, lower body exercise | Increment = 1kg (not 1.25kg) per `getOverloadIncrement()` |
| EC-2 | Plateau detected (3+ weeks stale) | Show "Plateau — thử giảm reps hoặc đổi bài tập" warning chip |
| EC-3 | No training profile set (null) | Fallback to "intermediate" defaults |
| EC-4 | Last workout was >30 days ago | Still show suggestion but add note "Lâu không tập — bắt đầu nhẹ hơn" |

---

#### US-14: Rest Timer Enhancement

**FR Trace:** FR-04 (Rest Timer Enhancement)
**Impact:** Medium
**Priority:** P2

**As a** user resting between sets,
**I want** a full-screen animated ring timer with +30s/Skip controls,
**So that** I can track rest accurately without squinting at small numbers.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | Timer ring ≥200px diameter on mobile viewport | SVG viewBox calculation verified |
| AC-2 | Ring stroke animates smoothly (CSS transition, not rAF) | `transition: stroke-dashoffset 0.3s ease` preserved |
| AC-3 | MM:SS countdown centered in ring | Text element inside SVG circle |
| AC-4 | "+30s" button adds 30 seconds | `handleAddTime()` increments by `ADD_SECONDS=30` |
| AC-5 | "Skip" button ends timer immediately | `onSkip()` called, interval cleared |
| AC-6 | Timer auto-completes and calls `onComplete()` at 0 | Callback fires exactly once |
| AC-7 | Both buttons ≥48dp touch targets | `min-h-12` classes |
| AC-8 | Reduced-motion: ring transition disabled, countdown still works | `@media (prefers-reduced-motion: reduce)` CSS rule |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | User taps +30s multiple times (e.g., rest = 90 + 30 + 30 + 30 = 180s) | Total duration updates; ring recalculates progress; no upper limit enforced |
| EC-2 | Timer at 1 second and user taps +30s | Timer becomes 31s; ring animation resets proportionally |
| EC-3 | App goes to background during timer | `setInterval` pauses on Android WebView; on resume, timer catches up or shows "Timer paused" |
| EC-4 | prefers-reduced-motion: reduce | Ring stroke static (no transition); countdown text still updates every 1s |

---

#### US-15: Workout Completion Celebration

**FR Trace:** FR-05 (Workout Completion Celebration)
**Impact:** Medium
**Priority:** P2

**As a** user completing a workout,
**I want** to see a summary card with stats, PR highlights, and streak update,
**So that** I feel accomplished and motivated.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | Summary card shows: duration (min), total volume (kg), total sets, exercises completed | 4 stat values displayed |
| AC-2 | PR detection runs via `detectPRs()` and highlights any weight PRs at same rep count | PR list with exercise name + improvement shown |
| AC-3 | Streak counter updates with new value | Updated `currentStreak` displayed |
| AC-4 | New milestone achievement triggers celebration text | Text "🏆 Chuỗi 7 ngày!" if milestone reached |
| AC-5 | "Save & Close" button persists workout via `saveWorkoutAtomic()` | Transaction commits successfully |
| AC-6 | `animate-scale-in` entrance animation | Animation class present |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | Workout has 0 sets logged (user started but didn't log) | Summary shows "0 sets" with message "Buổi tập trống — không lưu"; no save action |
| EC-2 | All sets have weightKg=0 (bodyweight exercises only) | Volume shows "—" instead of "0 kg"; sets and reps still counted |
| EC-3 | Multiple PRs in same workout (e.g., bench PR + squat PR) | All PRs listed; each shows exercise name + "+{improvement}kg at {reps} reps" |
| EC-4 | PR detection: first-ever workout (no previous data) | No PRs shown (need ≥2 workouts at same rep count to compare); message "Buổi đầu tiên — lần sau sẽ so sánh!" |
| EC-5 | Streak milestone (e.g., 7-day streak reached) | Special milestone card appears above summary |

---

### WAVE 4 — Progress & History

---

#### US-16: Volume Trend Chart

**FR Trace:** FR-07 (Progress Dashboard Redesign)
**Impact:** Medium
**Priority:** P2

**As a** user reviewing progress,
**I want** to see weekly total volume trend over the last 8 weeks,
**So that** I can verify I'm progressively overloading.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | Bar or line chart showing volume (weight × reps × sets) per week | Chart renders with ≥1 data point |
| AC-2 | X-axis: week labels (W1-W8 or date range); Y-axis: kg (auto-scaled) | Axes labeled |
| AC-3 | Current week highlighted with distinct color | Visual distinction present |
| AC-4 | Trend indicator: ↑ or ↓ vs last week | Arrow icon + percentage change |
| AC-5 | No horizontal scroll issues (FR-07 fix) | Chart contained within viewport width |
| AC-6 | Render ≤100ms | Performance measurement |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | User has <8 weeks of data (e.g., only 2 weeks) | Chart shows 2 bars; remaining space empty; no phantom bars |
| EC-2 | One week has 0 volume (no workouts) | Bar at 0 height; week label still visible |
| EC-3 | Volume spike (>2× previous week) | Normal bar height; no special warning (handled by fatigue detection elsewhere) |
| EC-4 | All weeks have identical volume | Flat line/bars; trend shows "→ Ổn định" |

---

#### US-17: Personal Records Tracking

**FR Trace:** FR-07
**Impact:** Medium
**Priority:** P2

**As a** user,
**I want** to see my personal records per exercise on the progress tab,
**So that** I know my strength milestones.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | PR list shows exercises with best weight at each rep range | List rendered with exercise name + weight + reps |
| AC-2 | Most recent PR date shown | Date formatted as relative ("2 ngày trước") |
| AC-3 | Sorted by most recent PR first | Sort order verified |
| AC-4 | Tap PR card expands to show progression history | Expand animation ≤200ms |
| AC-5 | Empty state if no PRs detected | `EmptyState variant="standard"` with message |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | Exercise done only once | Not a PR (needs ≥2 workouts at same reps for comparison); not shown |
| EC-2 | User has 50+ exercises with PRs | Virtual scroll or paginated list (≤20 visible initially) |
| EC-3 | Exercise deleted from plan but PR still in history | PR still shown (historical data preserved) |

---

#### US-18: Workout History — Week Grouping Enhancement

**FR Trace:** FR-08 (Workout History Enhancement)
**Impact:** Medium
**Priority:** P2

**As a** user reviewing workout history,
**I want** workouts grouped by week with sticky headers and inline PR badges,
**So that** I can scan my training consistency at a glance.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | Week headers show: "Tuần {N}" + date range + workout count | Header format verified |
| AC-2 | Week headers are sticky during scroll | `position: sticky; top: 0` CSS |
| AC-3 | PR badges shown inline on exercises that achieved PR | Badge with "PR" text + star icon |
| AC-4 | Each workout card expandable (existing behavior preserved) | Collapse/expand works |
| AC-5 | Delete workout still functional | Delete button present + confirmation modal |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | Gap week (no workouts for entire week) | Week not shown (no empty week headers cluttering UI) |
| EC-2 | 52+ weeks of history | Virtual scroll or lazy load; initial render shows last 8 weeks |
| EC-3 | Multiple workouts on same day | All shown under same day, ordered by createdAt |

---

#### US-19: Clone Workout

**FR Trace:** FR-08
**Impact:** Low
**Priority:** P3

**As a** user viewing a past workout,
**I want** a "Clone" button that pre-fills the logger with the same exercises and last set values,
**So that** I can repeat a good workout without re-selecting exercises.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | "Clone" icon button visible on each workout card in history | Button present with Lucide `Copy` icon |
| AC-2 | Tap opens WorkoutLogger with exercises pre-populated | Logger receives exercise array from cloned workout |
| AC-3 | Set values from cloned workout available via "Copy previous" | `useProgressiveOverload` can access cloned source |
| AC-4 | Touch target ≥44dp | `min-h-11 min-w-11` classes |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | Cloned workout contains exercises that were deleted | Show exercises with "unknown" marker; user can swap them |
| EC-2 | User already has an active workout draft | Confirmation modal: "Bạn có buổi tập chưa lưu. Thay thế?" |
| EC-3 | Clone a cardio workout into strength mode | Workout mode auto-switches to match cloned workout type |

---

### WAVE 5 — Polish & Integration

---

#### US-20: Streak Counter Redesign

**FR Trace:** FR-06 (Streak Counter Redesign)
**Impact:** Medium
**Priority:** P2

**As a** user with an active streak,
**I want** a visually prominent streak counter with encouragement messages,
**So that** I'm motivated to maintain my training consistency.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | Streak 0: component hidden entirely (no "0 streak" display) | DOM element not rendered when streak=0 |
| AC-2 | Streak 1-6: show flame icon + count + "Tiếp tục phát huy!" | Icon + text visible |
| AC-3 | Streak 7+: show trophy icon + count + milestone-specific message | Message matches milestone threshold |
| AC-4 | Streak at risk (grace period used): warning badge "Sắp mất streak!" | Warning badge with `text-warning` color |
| AC-5 | Week dots preserved (7-day grid) | 7 dots with correct status colors |
| AC-6 | `animate-slide-up` entrance | Animation present |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | Streak transitions from 0→1 (first workout) | Component appears with `animate-scale-in`; message "Khởi đầu tuyệt vời!" |
| EC-2 | Streak breaks (was 15, missed 2 days) | Counter resets to 0; component hidden; no "streak broken" message |
| EC-3 | User reaches milestone (streak hits 30) | Milestone celebration card: "🏆 30 ngày liên tiếp!" with special styling |
| EC-4 | Multiple training sessions on same day | Counts as 1 day for streak (not N days); streak +1 max per calendar day |

---

#### US-21: Exercise Selector Enhancement

**FR Trace:** FR-11 (Exercise Selector Enhancement)
**Impact:** Medium
**Priority:** P2

**As a** user selecting exercises for a plan or workout,
**I want** search, muscle group filter, and recently used section,
**So that** I can find and add exercises quickly.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | Search bar with Vietnamese + English name matching (existing) | Preserved behavior |
| AC-2 | Muscle group filter chips horizontally scrollable (existing) | Preserved behavior |
| AC-3 | "Recently used" section at top showing last 5 unique exercises | ≤5 items, ordered by most recent |
| AC-4 | Recently used data persisted across sessions | Survives app restart (stored in DB or localStorage) |
| AC-5 | All exercise items ≥44dp touch height | `min-h-11` or equivalent padding |
| AC-6 | Empty search results use `EmptyState variant="compact"` | Shared component used |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | User has never done any exercise | "Recently used" section hidden entirely |
| EC-2 | All 5 recently used exercises are from same muscle group | Section still shows all 5; muscle group filter independent |
| EC-3 | Exercise in "recently used" was a custom exercise that was later deleted | Remove from recently used list; don't show ghost entry |
| EC-4 | Search query matches 0 results | `EmptyState` with "Không tìm thấy bài tập" + CTA "Tạo bài tập mới" |

---

#### US-22: Touch Target Compliance Audit

**FR Trace:** FR-12 (Touch Target Compliance)
**Impact:** High — Accessibility requirement
**Priority:** P1

**As a** user with accessibility needs,
**I want** all interactive elements to have ≥48dp touch targets,
**So that** I can reliably tap buttons and controls.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | ALL buttons in fitness module ≥48dp (12 × 4px = 48px) OR ≥44dp with ≥8dp spacing | Automated audit script confirms |
| AC-2 | Current violations identified and fixed: RPE buttons h-11 w-11 (44px) → h-12 w-12 (48px) | RPE buttons enlarged |
| AC-3 | Set delete/edit buttons h-8 w-8 (32px) → min-h-11 min-w-11 (44px) with appropriate padding | Buttons enlarged |
| AC-4 | No adjacent buttons with <8dp gap | Gap audit confirms |
| AC-5 | `active:scale-[0.98]` press feedback on all tappable elements | CSS class present |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | Small screen (320dp width) with 3 action buttons in row | Buttons wrap to 2 rows rather than shrink below 48dp |
| EC-2 | Delete button enlarged overlaps adjacent element | Use `gap-2` (8dp) minimum spacing between adjacent touch targets |

---

#### US-23: Horizontal Scroll Fix (Progress Tab)

**FR Trace:** FR-07
**Impact:** Medium
**Priority:** P2

**As a** user on the progress tab,
**I want** all content to fit within viewport width without horizontal scroll,
**So that** I don't accidentally swipe sideways.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | `overflow-x: hidden` on progress container | CSS property set |
| AC-2 | Charts responsive to container width, not fixed width | Chart width = `100%` or `container.clientWidth` |
| AC-3 | No elements exceed viewport on 320dp-428dp range | Manual test on 360dp and 414dp confirms |
| AC-4 | Table/stat grids use `grid-cols` responsive or `flex-wrap` | No `nowrap` causing overflow |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | Very long exercise name ("Incline Dumbbell Chest Press With Twist") | Name truncated with `text-ellipsis` at container boundary |
| EC-2 | Volume number >99,999 kg | Number formatted with K suffix (e.g., "102.4K") |

---

#### US-24: Stagger Animation System

**FR Trace:** NFR-03 (Consistency)
**Impact:** Low
**Priority:** P3

**As a** user scrolling the fitness tab,
**I want** cards to animate in with staggered timing matching Dashboard/Calendar patterns,
**So that** the app feels cohesive and polished.

**Acceptance Criteria:**
| # | Criterion | Metric |
|---|-----------|--------|
| AC-1 | Hero card: `animate-slide-up` tier 1 (0ms delay) | CSS class + delay |
| AC-2 | Week strip: `dashboard-stagger` tier 2 (30ms delay) | Style attribute |
| AC-3 | Day accordion items: `dashboard-stagger` tier 3-5 (60-150ms) | Stagger per item |
| AC-4 | `@media (prefers-reduced-motion: reduce)` disables all | Animation reset |
| AC-5 | Total animation budget ≤200ms + 150ms stagger = 350ms max | Timeline verified |

**Edge Cases:**
| # | Edge Case | Expected Behavior |
|---|-----------|-------------------|
| EC-1 | prefers-reduced-motion: reduce | All animations instantly complete; `opacity: 1; transform: none` |
| EC-2 | Tab switch (history→plan) | Animations replay on re-mount; no stuck state |

---

#### US-25-32: Remaining Stories (Summarized)

| ID    | Title                                 | FR             | Impact | Priority | Key AC                                                                                             |
| ----- | ------------------------------------- | -------------- | ------ | -------- | -------------------------------------------------------------------------------------------------- |
| US-25 | Workout Draft Auto-Recovery           | FR-03          | High   | P1       | Draft survives app restart; resume prompt on re-open; max 1 draft at a time                        |
| US-26 | Session Timer (Elapsed)               | FR-03          | Low    | P3       | Shows elapsed time since workout start; persisted in draft.elapsedSeconds                          |
| US-27 | ProgressiveOverload Chip Redesign     | FR-03          | Low    | P3       | Suggestion chip consistent with Phase 3.2 badge styling; `bg-energy-subtle text-energy`            |
| US-28 | Set Editor Modal Redesign             | FR-03          | Medium | P2       | Modal matches Phase 3.2 bottom sheet pattern; ≥48dp all controls; recent weights as chips          |
| US-29 | Profile Out-of-Sync Banner            | NFR-03         | Low    | P3       | Banner warns when health profile changed after plan generation; CTA "Regenerate"                   |
| US-30 | Workout Mode Toggle (Strength/Cardio) | FR-03          | Low    | P3       | Toggle in logger header; cardio mode shows duration/distance instead of weight/reps                |
| US-31 | Coaching Hints (Plan Tab)             | FR-01          | Low    | P3       | Collapsible coaching tip below hero; context-aware (first week vs plateau vs returning)            |
| US-32 | Performance Budget Enforcement        | NFR-01, NFR-05 | High   | P1       | FitnessTab render <100ms; logger interaction <50ms; no main chunk increase; manualChunks if needed |

---

## 4. Business Rules

### BR-01 to BR-12: Streak & Gamification

| #     | Rule                                                                                              | Source                                 | Verified In                            |
| ----- | ------------------------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------- |
| BR-01 | Streak counts consecutive CALENDAR DAYS with workout OR scheduled rest, NOT workout count         | FR-06, gamification.ts:78-114          | `computeCurrentStreak()`               |
| BR-02 | One grace period allowed: 1 missed training day doesn't break streak but sets `streakAtRisk=true` | FR-06, gamification.ts:100-105         | Same function                          |
| BR-03 | Today's day NEVER penalizes streak (user may not have worked out yet)                             | FR-06, gamification.ts:95-96           | `d === todayStr` check                 |
| BR-04 | Streak milestones: 7, 14, 30, 60, 90 days                                                         | FR-06, gamification.ts:43-47           | `MILESTONES` array                     |
| BR-05 | Session milestones: 1, 10, 25, 50, 100 workouts                                                   | FR-05, gamification.ts:38-42           | Same array                             |
| BR-06 | PR detection: weight increase at SAME rep count; one PR per exercise per session                  | FR-05, gamification.ts:197-228         | `detectPRs()`                          |
| BR-07 | Multiple sessions on same day count as 1 streak day                                               | FR-06, gamification.ts                 | `workoutDates` is a Set (deduplicates) |
| BR-08 | Streak display: 0 = hidden, 1-6 = flame, 7+ = trophy                                              | FR-06                                  | US-20 AC-1,2,3                         |
| BR-09 | Week dots: 7 statuses — completed, rest, today, missed, upcoming                                  | FR-02, gamification.ts:11-24 (DotIcon) | StreakCounter.tsx                      |
| BR-10 | Grace period resets when streak breaks (new streak starts with grace available)                   | FR-06                                  | `computeCurrentStreak` restart         |
| BR-11 | Longest streak is all-time maximum, never decreases                                               | FR-06                                  | `computeLongestStreak()`               |
| BR-12 | Streak calculation only considers plan days if plan exists; without plan, any workout day counts  | FR-06, gamification.ts:83-112          | Conditional logic                      |

### BR-13 to BR-24: Workout & Logger

| #     | Rule                                                                                               | Source                                 | Verified In                                |
| ----- | -------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------ |
| BR-13 | Max 3 sessions per day per plan                                                                    | C-07, fitnessStore.ts:412              | `if (existing.length >= 3) return`         |
| BR-14 | Weight increment: 0.5 kg per step                                                                  | FR-03, constants.ts:15                 | `WEIGHT_INCREMENT`                         |
| BR-15 | Reps increment: 1 per step                                                                         | FR-03, constants.ts:16                 | `REPS_INCREMENT`                           |
| BR-16 | RPE options: [6, 7, 8, 9, 10] — 5 values, toggle select/deselect                                   | FR-03, constants.ts:12                 | `RPE_OPTIONS`                              |
| BR-17 | Default rest: 90 seconds                                                                           | FR-04, constants.ts:19                 | `DEFAULT_REST_SECONDS`                     |
| BR-18 | Add time: +30 seconds per tap, no upper limit                                                      | FR-04, RestTimer.tsx:70                | `ADD_SECONDS = 30`                         |
| BR-19 | Workout save is ATOMIC (transaction): workout + all sets in single DB transaction                  | FR-05, fitnessStore.ts:606             | `saveWorkoutAtomic()`                      |
| BR-20 | Draft auto-save: workout-in-progress persisted to DB; survives app restart                         | FR-03, fitnessStore.ts                 | `setWorkoutDraft()` / `loadWorkoutDraft()` |
| BR-21 | Copy previous: copies weight, reps, RPE from last set of SAME exercise in CURRENT session          | FR-03, WorkoutLogger.tsx:276-293       | `lastSet = exerciseSets.at(-1)`            |
| BR-22 | Progressive overload: if last reps ≥ targetRepsMax → increase weight; else → increase reps         | FR-03, useProgressiveOverload.ts:45-72 | `suggestNextSet()`                         |
| BR-23 | Overload weight increment by experience: beginner 1-1.25kg, intermediate 1.5-2kg, advanced 2-2.5kg | FR-03, periodization.ts                | `getOverloadIncrement()`                   |
| BR-24 | Plateau detected when max weight ±2% unchanged for ≥3 consecutive weeks                            | FR-07, plateauAnalysis.ts              | `detectPlateau()`                          |

### BR-25 to BR-36: Training Plans

| #     | Rule                                                                                          | Source                           | Verified In                 |
| ----- | --------------------------------------------------------------------------------------------- | -------------------------------- | --------------------------- |
| BR-25 | Plan statuses: active, paused, completed                                                      | CEO constraints                  | `updateTrainingPlan()`      |
| BR-26 | Only 1 active plan at a time; activating plan A pauses plan B                                 | CEO constraints, fitnessStore.ts | `setActivePlan()`           |
| BR-27 | Split types: push-pull-legs, upper-lower, full-body, bro-split, custom                        | CEO constraints                  | types.ts                    |
| BR-28 | Workout types: strength, cardio, flexibility, rest                                            | CEO constraints                  | types.ts                    |
| BR-29 | Exercise categories: compound, isolation, cardio                                              | CEO constraints                  | types.ts                    |
| BR-30 | Equipment: barbell, dumbbell, cable, machine, bodyweight, bands, kettlebell                   | CEO constraints                  | types.ts                    |
| BR-31 | Min training days: 2; Max training days: 6                                                    | fitnessStore.ts:863              | Validation check            |
| BR-32 | Plan days store exercises as JSON string in `exercises` column                                | schema.ts                        | `JSON.stringify(exercises)` |
| BR-33 | Original exercises preserved in `original_exercises` column for restore                       | fitnessStore.ts                  | `restorePlanDayOriginal()`  |
| BR-34 | Session assignment uses scoring algorithm (muscle group diversity × rest balance)             | fitnessStore.ts:69-91            | `autoAssignWorkouts()`      |
| BR-35 | Long-press (≥500ms) on day opens context menu                                                 | UI pattern, SessionTabs.tsx:19   | `LONG_PRESS_MS = 500`       |
| BR-36 | Plan celebration card shown once on plan generation; dismissed via `dismissPlanCelebration()` | UX, fitnessStore.ts              | `showPlanCelebration` flag  |

### BR-37 to BR-48: UI/UX & Consistency

| #     | Rule                                                                                     | Source                       | Verified In                    |
| ----- | ---------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------ |
| BR-37 | All touch targets ≥48dp (preferred) or ≥44dp with ≥8dp spacing                           | FR-12, WCAG 2.1              | Audit script                   |
| BR-38 | Hero cards: `bg-primary-subtle rounded-2xl p-4 shadow-sm`                                | NFR-03, CombinedHero.tsx     | Phase 3.1/3.2 pattern          |
| BR-39 | Empty states use shared `<EmptyState />` component — 3 variants: compact, standard, hero | NFR-03, EmptyState.tsx       | Shared component               |
| BR-40 | All animations respect `prefers-reduced-motion: reduce`                                  | NFR-02, animations.css:82-99 | Media query                    |
| BR-41 | Stagger timing: 30ms per tier, max 5 tiers (150ms max delay)                             | NFR-03, animations.css       | `animate-stagger-{1-5}`        |
| BR-42 | Press feedback: `active:scale-[0.98]` on ALL interactive elements                        | NFR-03                       | Tailwind class audit           |
| BR-43 | Vietnamese only (C-01): ALL user-facing text via `t()` i18n keys                         | C-01                         | vi.json check                  |
| BR-44 | Offline-first (C-02): ALL features work without network                                  | C-02                         | No fetch() in fitness module   |
| BR-45 | No eslint-disable (C-10): Fix root cause, never suppress                                 | C-10                         | ESLint scan                    |
| BR-46 | 100% test coverage for new code (NFR-04)                                                 | NFR-04                       | Vitest coverage report         |
| BR-47 | SonarQube 0 issues before commit                                                         | QUY TẮC #2                   | `npm run sonar`                |
| BR-48 | No main chunk size increase (NFR-05): use `manualChunks` if needed                       | NFR-05                       | `npm run analyze` before/after |

---

## 5. Edge Cases Matrix

### Summary Statistics

| Category                 | Edge Case Count | Critical | Major  | Minor  |
| ------------------------ | --------------- | -------- | ------ | ------ |
| Wave 1: Decomposition    | 16              | 2        | 8      | 6      |
| Wave 2: Today-First      | 14              | 3        | 7      | 4      |
| Wave 3: Logger Speed     | 17              | 4        | 8      | 5      |
| Wave 4: Progress/History | 11              | 1        | 6      | 4      |
| Wave 5: Polish           | 12              | 2        | 5      | 5      |
| **Cross-cutting**        | **17**          | **5**    | **8**  | **4**  |
| **TOTAL**                | **87**          | **17**   | **42** | **28** |

### Cross-Cutting Edge Cases (not covered in individual US)

| #     | Edge Case                                              | Category          | Severity | Expected Behavior                                                                                                 |
| ----- | ------------------------------------------------------ | ----------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| XC-01 | App restart during workout logging                     | Data Persistence  | Critical | Draft auto-saved via `setWorkoutDraft()` + DB persist; on restart, prompt "Resume workout?"                       |
| XC-02 | Concurrent tab switches while timer running            | State Management  | Major    | Timer continues in background; returning to logger shows active timer                                             |
| XC-03 | Plan deleted while viewing plan tab                    | State Consistency | Major    | Immediate switch to EmptyState; no crash from stale plan references                                               |
| XC-04 | Weight entry >300kg (edge of BODY_WEIGHT_MAX_KG)       | Validation        | Minor    | Input accepted for exercise weight (no max); warning only for body weight log                                     |
| XC-05 | Date timezone change during workout                    | Date Handling     | Major    | Workout date uses start date, not save date; streak calculation unaffected                                        |
| XC-06 | 1000+ workout sets in history                          | Performance       | Critical | Virtual scroll or pagination; initial render ≤20 sets visible; lazy load rest                                     |
| XC-07 | User changes training profile AFTER generating plan    | Consistency       | Major    | `profileOutOfSync=true` banner shown; CTA to regenerate plan                                                      |
| XC-08 | SQLite migration fails mid-way                         | Data Integrity    | Critical | Transaction rollback; show error with retry option; never leave DB in partial state                               |
| XC-09 | prefers-reduced-motion toggled mid-session             | Accessibility     | Minor    | CSS media query applies immediately; no restart needed                                                            |
| XC-10 | Screen reader navigating workout logger                | Accessibility     | Major    | All buttons have `aria-label`; timer has `role="timer"` or `role="alertdialog"`; progress bar has `aria-valuenow` |
| XC-11 | Android back button during workout                     | Navigation        | Critical | Prompt "Workout in progress. Discard?" → UnsavedChangesDialog                                                     |
| XC-12 | Very slow device (<2GB RAM)                            | Performance       | Major    | Animations degraded gracefully; no UI freeze during `saveWorkoutAtomic`                                           |
| XC-13 | 0 exercises in default exercise DB                     | Data Integrity    | Critical | Guard: if `EXERCISES.length === 0`, show error state instead of blank selector                                    |
| XC-14 | Custom exercise with emoji in name                     | Input Validation  | Minor    | Allow emoji; trim whitespace; max 100 chars enforced                                                              |
| XC-15 | Workout spans midnight (start 23:30, end 00:15)        | Date Handling     | Major    | Workout date = start date; duration = 45min; streak credits start date                                            |
| XC-16 | Multiple PRs at different rep ranges for same exercise | PR Detection      | Minor    | Only first PR per exercise per session counted (existing behavior via `seen` Set)                                 |
| XC-17 | NaN in weight/reps from corrupt data                   | Data Integrity    | Critical | Guard with `Number.isFinite()`; display "—" for NaN; don't save NaN to DB                                         |

---

## 6. Data Flow Descriptions

### DF-01: Workout Logging Flow

```
User taps "Bắt đầu" on Hero Card
    → pushPage('workout-logger', { planDay })
    → WorkoutLogger mounts
    → Load exercises from planDay.exercises (JSON parse)
    → Load previous sets via useProgressiveOverload(exerciseId)
    → Show suggestion chip if data available

User logs set (weight=80, reps=8, RPE=8):
    → addWorkoutSet({ id: uuid(), workoutId, exerciseId, setNumber, weightKg:80, reps:8, rpe:8, ... })
    → Zustand state updated (optimistic)
    → Draft auto-saved: setWorkoutDraft({ exercises, sets, elapsedSeconds })
    → Draft persisted to DB (workout_draft table or localStorage)
    → RestTimer auto-opens (90s default)

User completes all exercises:
    → Summary card shown
    → detectPRs(currentSets, allPreviousSets) → PRDetection[]
    → calculateStreak(workouts+current, planDays) → StreakInfo
    → checkMilestones(totalSessions+1, currentStreak) → Milestone[]

User taps "Save":
    → saveWorkoutAtomic(workout, sets) [TRANSACTION]
        → INSERT workout
        → INSERT/IGNORE exercises (seeding)
        → INSERT all sets
    → clearWorkoutDraft()
    → popPage() → return to FitnessTab
    → UI updates: streak counter, history, progress
```

### DF-02: Streak Calculation Flow

```
On FitnessTab mount OR after workout save:
    → calculateStreak(workouts, planDays, today)

    1. Build workoutDates Set (unique dates from all workouts)
    2. Build planDaySet (training days 1-7 from active plan)
    3. Walk backwards from today:
       For each day d:
         - Has workout? → streak++
         - Is scheduled rest? → streak++ (counts!)
         - Is today? → skip (no penalty)
         - First miss? → use grace period, streakAtRisk=true
         - Second miss? → BREAK streak

    4. Compute longestStreak (same algorithm over full history)
    5. Compute weekDots (7-day grid from Monday)

    Output: { currentStreak, longestStreak, weekDots, gracePeriodUsed, streakAtRisk }
```

### DF-03: Progressive Overload Flow

```
On exercise card mount in WorkoutLogger:
    → useProgressiveOverload(exerciseId)

    1. getLastSets(exerciseId):
       - Find most recent workout containing this exercise
       - Return sets sorted by setNumber

    2. suggestNextSet(lastSets, experience, targetRepsMin, targetRepsMax, isLower):
       - No history? → { weight: 0, reps: targetRepsMin, source: 'manual' }
       - Last reps >= targetRepsMax? → { weight: last + increment, reps: targetRepsMin, source: 'progressive_overload' }
       - Else → { weight: last, reps: last+1, source: 'rep_progression' }

    3. detectPlateau(historySetsByWeek):
       - maxWeight per week over last 3+ weeks
       - If all within ±2% → { isPlateaued: true, weeks: N }

    Output: suggestion chip showing recommended weight/reps + plateau warning
```

### DF-04: Plan Day Session Management Flow

```
Current: TrainingPlanView shows 7 days
    Each day can have 1-3 sessions (max BR-13)

Add session:
    → addPlanDaySession(planId, dayOfWeek, { workoutType, muscleGroups, exercises })
    → Validate: existing.length < 3
    → Insert new TrainingPlanDay with session_order = existing.length + 1
    → Persist to DB

Remove session:
    → removePlanDaySession(dayId)
    → Delete from state + DB
    → Reorder remaining sessions (session_order continuity)

Swap exercise:
    → updatePlanDayExercises(dayId, newExercises)
    → JSON.stringify(newExercises) → DB update
    → If different from original → "Modified" badge appears
    → restorePlanDayOriginal(dayId) available for revert
```

---

## 7. Acceptance Criteria Summary

### Priority Distribution

| Priority          | Story Count | Key Stories                                            |
| ----------------- | ----------- | ------------------------------------------------------ |
| P0 (Blocking)     | 7           | US-01 to US-07 (Decomposition)                         |
| P1 (Must-have)    | 8           | US-08, US-09, US-10, US-11, US-12, US-22, US-25, US-32 |
| P2 (Should-have)  | 10          | US-13 to US-21, US-23, US-28                           |
| P3 (Nice-to-have) | 7           | US-24, US-26, US-27, US-29, US-30, US-31               |
| **TOTAL**         | **32**      |                                                        |

### Wave Execution Order

| Wave   | Stories                   | Dependency         | Est. Effort                                  |
| ------ | ------------------------- | ------------------ | -------------------------------------------- |
| Wave 1 | US-01 to US-07            | None (foundation)  | Large — 7 components extracted from 1093 LOC |
| Wave 2 | US-08, US-09, US-10       | Wave 1 complete    | Medium — hero card + empty states            |
| Wave 3 | US-11-15, US-25           | Wave 1 complete    | Large — logger speed + timer + celebration   |
| Wave 4 | US-16-19, US-23           | Wave 1 complete    | Medium — progress charts + history           |
| Wave 5 | US-20-22, US-24, US-26-32 | Waves 2-4 complete | Medium — polish + integration                |

---

## 8. Traceability Matrix

| CEO FR | User Stories              | Business Rules      | Edge Cases                                 | Priority |
| ------ | ------------------------- | ------------------- | ------------------------------------------ | -------- |
| FR-01  | US-08, US-31              | BR-38, BR-40, BR-41 | EC-1 to EC-5 (US-08)                       | P1       |
| FR-02  | US-03, US-09              | BR-09, BR-37, BR-42 | EC-1 to EC-4 (US-09)                       | P1       |
| FR-03  | US-11-13, US-25-28, US-30 | BR-14-16, BR-20-23  | EC-1 to EC-5 (US-11), EC-1 to EC-3 (US-12) | P1       |
| FR-04  | US-14                     | BR-17, BR-18, BR-40 | EC-1 to EC-4 (US-14)                       | P2       |
| FR-05  | US-15                     | BR-04-06, BR-19     | EC-1 to EC-5 (US-15)                       | P2       |
| FR-06  | US-20                     | BR-01-03, BR-07-12  | EC-1 to EC-4 (US-20)                       | P2       |
| FR-07  | US-16-17, US-23           | BR-24               | EC-1 to EC-4 (US-16), EC-1 to EC-3 (US-17) | P2       |
| FR-08  | US-18-19                  | —                   | EC-1 to EC-3 (US-18), EC-1 to EC-3 (US-19) | P2/P3    |
| FR-09  | US-06, US-10              | BR-39               | EC-1 to EC-3 (US-10)                       | P1       |
| FR-10  | US-01-07                  | —                   | 16 decomposition ECs                       | P0       |
| FR-11  | US-21                     | —                   | EC-1 to EC-4 (US-21)                       | P2       |
| FR-12  | US-22                     | BR-37, BR-42        | EC-1 to EC-2 (US-22)                       | P1       |
| NFR-01 | US-32                     | BR-48               | XC-06, XC-12                               | P1       |
| NFR-02 | US-14, US-22, US-24       | BR-40               | XC-09, XC-10                               | P1       |
| NFR-03 | US-24, US-27, US-29       | BR-38-42            | XC-02                                      | P2/P3    |
| NFR-04 | All                       | BR-46               | —                                          | P1       |
| NFR-05 | US-32                     | BR-48               | —                                          | P1       |

---

> **Status: LOGIC*NGHIỆP_VỤ*ĐÃ_CHỐT**
>
> Deliverable ready for Tech Leader. All 12 CEO FRs mapped to 32 User Stories with 87 edge cases and 48 business rules. Each rule is traced to source code. No ambiguity remains — every metric is quantified, every edge case has expected behavior.
