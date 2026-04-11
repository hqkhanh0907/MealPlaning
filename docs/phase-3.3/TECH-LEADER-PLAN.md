# Phase 3.3 Technical Implementation Plan

**Status**: KẾ*HOẠCH*ĐÃ_CHỐT
**Created**: 2025-07-17
**Inputs**: BM-BUSINESS-LOGIC.md (32 US, 48 BR, 87 EC) + DESIGNER-UI-SPEC.md (1863 lines)

---

## 1. Architecture Review

### 1.1 Current State Analysis

| Metric                   | Value                | Target                   |
| ------------------------ | -------------------- | ------------------------ |
| TrainingPlanView.tsx     | 1,093 LOC            | ≤250 LOC                 |
| Total fitness components | 36 files, ~7,876 LOC | ~45 files                |
| Hooks                    | 6 files, 1,091 LOC   | ~8 files                 |
| Utils                    | 17 files, 1,352 LOC  | No change                |
| Test files               | 20 files             | ~30 files                |
| fitnessStore.ts          | 1,538 LOC            | No change (out of scope) |

### 1.2 Key Technical Decisions

| Decision                                     | Rationale                                                                                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **D1: Extract-then-enhance**                 | Wave 1 decomposes TrainingPlanView into 6 sub-components with ZERO visual changes. Waves 2-5 enhance individual components. This avoids big-bang rewrites and enables parallel work. |
| **D2: No store changes**                     | fitnessStore.ts (1,538 LOC) is out of scope. All new logic lives in hooks or utils. Store selectors may be added to `src/store/selectors/fitnessSelectors.ts`.                       |
| **D3: Shared EmptyState reuse**              | BM §US-06 + Design §3.6 mandate reusing `src/components/shared/EmptyState.tsx` (3 variants: hero/standard/compact). No new empty state component.                                    |
| **D4: Pure CSS charts**                      | Design §6.1 specifies CSS flexbox bars for VolumeTrendChart. No chart library (Recharts, Victory) — keeps bundle unchanged per BR-48.                                                |
| **D5: StepperInput is new shared component** | Used by WorkoutLogger (Wave 3) AND PlanDayEditor (existing). Place in `src/features/fitness/components/` since only fitness consumes it.                                             |
| **D6: Animation via Tailwind keyframes**     | Design §1.4 defines `animate-slide-up`, `animate-fade-in`, `animate-scale-in` with stagger classes. Add to `src/index.css` `@theme` block.                                           |
| **D7: React Compiler active**                | NO manual useCallback/useMemo. Only `useShallow` for Zustand `.filter()` selectors. All new components use `React.memo()` wrapper.                                                   |

### 1.3 Risk Areas

| Risk                                                                    | Impact | Mitigation                                                                                                            |
| ----------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| TrainingPlanView decomposition breaks 20+ existing tests                | High   | Wave 1 tasks include test migration as acceptance criteria                                                            |
| ProgressDashboard (518 LOC) has interleaved chart + PR logic            | Medium | Wave 4 extracts VolumeTrendChart + PersonalRecords, leaving shell                                                     |
| WorkoutLogger (681 LOC) has rest timer + set editor inline              | Medium | Wave 3 enhances RestTimer (already extracted) + creates StepperInput                                                  |
| WeeklyCalendarStrip (107 LOC) has different props interface than spec   | Low    | Wave 1 extracts new WeekCalendarStrip from TPV inline code; existing WeeklyCalendarStrip stays for PlanScheduleEditor |
| 108 i18n t() calls in TrainingPlanView will scatter across 6 components | Medium | Each Wave 1 task must move relevant i18n keys with the extracted code                                                 |

---

## 2. Wave Plan

### Wave 1: Foundation & Decomposition (6 parallel tasks)

**Goal**: Extract 6 new components from TrainingPlanView.tsx (1,093 → ≤250 LOC). ZERO visual changes. All existing tests must pass after migration.

**Dependency**: None — this is the foundation wave.

---

#### TASK-W1-01: TodayWorkoutCard Extraction

- **User Stories**: US-01
- **Design Spec**: §3.1
- **Business Rules**: BR-13 (max 3 sessions/day), BR-37 (touch targets)
- **Description**: Extract the "today's workout" section from TrainingPlanView (lines ~580-730) into a standalone `TodayWorkoutCard` component. This includes:
  - Today's workout display with exercise list
  - "Bắt đầu tập" CTA button
  - "Chuyển thành ngày nghỉ" context option
  - "Sửa bài tập" pencil icon
  - Session tabs (delegate to existing `SessionTabs.tsx`)
  - Props interface per Design §3.1
- **Owned Files (EXCLUSIVE)**:
  - CREATE: `src/features/fitness/components/TodayWorkoutCard.tsx`
  - CREATE: `src/__tests__/TodayWorkoutCard.test.tsx`
- **Effort**: M
- **Acceptance Criteria**:
  1. Component renders today's workout with exercise list, CTA, and action buttons
  2. Props interface matches Design §3.1 `TodayWorkoutCardProps` exactly
  3. All states covered: empty exercises, single session, multi-session, all completed
  4. Touch targets ≥48dp on all interactive elements (`min-h-12 min-w-12`)
  5. `active:scale-[0.98] motion-reduce:transform-none` on all buttons
  6. `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` on all interactive
  7. 100% test coverage for new file
  8. ≤250 LOC
- **QA Focus**: Multi-session tab switching, empty exercise list rendering, CTA click handlers

---

#### TASK-W1-02: TodayRestCard Extraction

- **User Stories**: US-02
- **Design Spec**: §3.2
- **Business Rules**: BR-09 (week dot statuses), BR-37 (touch targets)
- **Description**: Extract the "rest day" rendering from TrainingPlanView into `TodayRestCard`. This includes:
  - Rest day message with Moon icon
  - Tomorrow's preview (next workout day)
  - Quick action buttons: "Ghi cân nặng", "Cardio nhanh", "Chuyển thành ngày tập"
  - Props interface per Design §3.2
- **Owned Files (EXCLUSIVE)**:
  - CREATE: `src/features/fitness/components/TodayRestCard.tsx`
  - CREATE: `src/__tests__/TodayRestCard.test.tsx`
- **Effort**: S
- **Acceptance Criteria**:
  1. Renders rest day message, tomorrow preview, 3 quick action buttons
  2. Props interface matches Design §3.2 `TodayRestCardProps`
  3. Handles `tomorrowPlanDay === undefined` gracefully (no tomorrow preview)
  4. All buttons have `min-h-12` touch target
  5. 100% test coverage
  6. ≤150 LOC
- **QA Focus**: Tomorrow preview with undefined data, button callbacks fire correctly

---

#### TASK-W1-03: WeekCalendarStrip Extraction

- **User Stories**: US-03
- **Design Spec**: §3.3
- **Business Rules**: BR-09 (7 day statuses), BR-37 (touch targets)
- **Description**: Extract the inline calendar strip from TrainingPlanView (lines ~433-470) into a new `WeekCalendarStrip` component. NOTE: This is DIFFERENT from the existing `WeeklyCalendarStrip.tsx` (which is used by PlanScheduleEditor with toggle semantics). The new component has day-select semantics with status icons.
  - 7 day pills with status icons (Check, Dumbbell, Moon, X, upcoming)
  - Today ring highlight
  - Day selection callback
  - Props interface per Design §3.3
- **Owned Files (EXCLUSIVE)**:
  - CREATE: `src/features/fitness/components/WeekCalendarStrip.tsx`
  - CREATE: `src/__tests__/WeekCalendarStrip.test.tsx`
- **Effort**: M
- **Acceptance Criteria**:
  1. Renders 7 day pills with correct status icons per BR-09
  2. Props interface matches Design §3.3 `WeekCalendarStripProps`
  3. Today highlighted with `ring-2 ring-primary`
  4. Status colors: completed=`bg-success/10 text-success`, workout=`bg-primary/10 text-primary`, rest=`bg-muted text-info`, missed=`bg-error/10 text-error`
  5. Each pill: `min-h-11 flex-1 rounded-xl`
  6. Day click calls `onDaySelect(dayNumber)`
  7. 100% test coverage
  8. ≤200 LOC
- **QA Focus**: All 7 status states, today ring on each day position, no horizontal overflow on 360px

---

#### TASK-W1-04: PlanDayAccordion Extraction

- **User Stories**: US-04
- **Design Spec**: §3.4
- **Business Rules**: BR-35 (long-press context menu), BR-37 (touch targets)
- **Description**: Extract the non-today day accordion sections from TrainingPlanView into `PlanDayAccordion`. This includes:
  - Collapsible header with chevron rotation
  - Exercise list when expanded
  - "Bắt đầu tập" and "Sửa bài tập" buttons when expanded
  - Completed state with green check overlay
  - Props interface per Design §3.4
- **Owned Files (EXCLUSIVE)**:
  - CREATE: `src/features/fitness/components/PlanDayAccordion.tsx`
  - CREATE: `src/__tests__/PlanDayAccordion.test.tsx`
- **Effort**: M
- **Acceptance Criteria**:
  1. Collapsed: shows header with day name, workout type, chevron down
  2. Expanded: shows exercise list + action buttons, chevron rotates
  3. Completed: green check badge overlay
  4. Empty exercises: inline "Chưa có bài tập" + "Thêm" CTA (uses `variant="compact"` EmptyState)
  5. Header: `active:scale-[0.98]`, `focus-visible:ring-2`
  6. Chevron transition: `transition-transform`
  7. 100% test coverage
  8. ≤250 LOC
- **QA Focus**: Expand/collapse animation, completed overlay, empty exercises state

---

#### TASK-W1-05: PlanActionBar Extraction

- **User Stories**: US-05
- **Design Spec**: §3.5
- **Business Rules**: BR-37 (touch targets), BR-42 (press feedback)
- **Description**: Extract the plan action buttons row from TrainingPlanView (lines ~474-520) into `PlanActionBar`. Three actions: edit schedule, change split, browse templates.
  - Props interface per Design §3.5
  - Each button with icon + label
  - Disabled state support
- **Owned Files (EXCLUSIVE)**:
  - CREATE: `src/features/fitness/components/PlanActionBar.tsx`
  - CREATE: `src/__tests__/PlanActionBar.test.tsx`
- **Effort**: S
- **Acceptance Criteria**:
  1. Renders 3 action buttons in a row: CalendarCog + "Lịch tập", ArrowRightLeft + "Đổi split", BookOpen + "Mẫu"
  2. Props interface matches Design §3.5 `PlanActionBarProps`
  3. `isDisabled` prop disables all buttons with `disabled:opacity-50`
  4. Each button: `min-h-12`, `active:scale-[0.98]`, `focus-visible:ring-2`
  5. 100% test coverage
  6. ≤200 LOC
- **QA Focus**: Disabled state, button text truncation on 360px width

---

#### TASK-W1-06: PlanEmptyState + TrainingPlanView Rewire

- **User Stories**: US-06, US-07
- **Design Spec**: §3.6, §3.7
- **Business Rules**: BR-39 (shared EmptyState), BR-38 (hero card styling)
- **Description**: This is the INTEGRATION task. It:
  1. Creates `PlanEmptyState` wrapper that maps 4 empty contexts to shared `<EmptyState>` props (hero/standard/compact variants per Design §3.6)
  2. **Rewires TrainingPlanView.tsx** to import and render the 5 extracted components (W1-01 through W1-05) instead of inline code
  3. TrainingPlanView becomes a thin orchestrator (≤250 LOC) that manages state and passes props down
  4. Migrates existing `TrainingPlanView.test.tsx` to work with new component structure

  **CRITICAL**: This task MUST run AFTER W1-01 through W1-05 complete. It is the only task that modifies TrainingPlanView.tsx.

- **Owned Files (EXCLUSIVE)**:
  - CREATE: `src/features/fitness/components/PlanEmptyState.tsx`
  - CREATE: `src/__tests__/PlanEmptyState.test.tsx`
  - MODIFY: `src/features/fitness/components/TrainingPlanView.tsx` ← **SOLE MODIFIER**
  - MODIFY: `src/__tests__/TrainingPlanView.test.tsx` ← **SOLE MODIFIER**
- **Effort**: L
- **Acceptance Criteria**:
  1. TrainingPlanView.tsx ≤250 LOC after rewire
  2. TrainingPlanView imports and renders: TodayWorkoutCard, TodayRestCard, WeekCalendarStrip, PlanDayAccordion, PlanActionBar, PlanEmptyState
  3. PlanEmptyState maps 4 contexts: no-plan (hero), expired-plan (hero), manual-no-exercises (standard), empty-day (compact)
  4. ALL existing TrainingPlanView tests pass (migrated to test through child components)
  5. Zero visual regression — UI looks identical before and after
  6. `npm run lint` → 0 errors
  7. `npm run test` → 0 failures
  8. 100% coverage for PlanEmptyState.tsx
- **QA Focus**: Visual regression (screenshot comparison), all navigation flows still work, context menu still works

---

### Wave 2: Today-First Layout + Visual Enhancements (3 parallel tasks)

**Goal**: Redesign hero card, week strip, and empty states with new visual design from §4.

**Dependency**: Wave 1 complete (components extracted).

---

#### TASK-W2-01: Hero Card Redesign (TodayWorkoutCard)

- **User Stories**: US-08
- **Design Spec**: §4.1
- **Business Rules**: BR-38 (hero card styling), BR-13 (max 3 sessions), BR-42 (press feedback)
- **Description**: Enhance TodayWorkoutCard (created in W1-01) with the redesigned hero layout from §4.1:
  - Gradient background: `bg-gradient-to-br from-primary-subtle to-card`
  - `rounded-2xl border border-border/60 p-5 shadow-sm`
  - Session tabs with completion indicators (pill badges)
  - Exercise list with set/rep/rest info in compact layout
  - Estimated duration display
  - Primary CTA: `min-h-12 rounded-xl bg-primary text-lg font-semibold shadow-sm`
  - Secondary actions: convert to rest, edit exercises
  - `animate-slide-up` entrance animation
- **Owned Files (EXCLUSIVE)**:
  - MODIFY: `src/features/fitness/components/TodayWorkoutCard.tsx`
  - MODIFY: `src/__tests__/TodayWorkoutCard.test.tsx`
- **Effort**: M
- **Acceptance Criteria**:
  1. Gradient hero card with exact Tailwind classes from §4.1
  2. Session tabs show completion status (checkmark badge on completed sessions)
  3. Exercise list shows: name, sets × reps, rest seconds
  4. Estimated duration from `estimateDuration()` utility
  5. Primary CTA `min-h-12` with `active:scale-[0.98]`
  6. `animate-slide-up` on mount
  7. All states from §4.1: empty, single-session, multi-session, all-completed
  8. Tests updated for new visual structure
- **QA Focus**: Gradient rendering on mobile WebView, session tab switching, duration calculation accuracy

---

#### TASK-W2-02: Week Overview Strip Redesign (WeekCalendarStrip)

- **User Stories**: US-09
- **Design Spec**: §4.2
- **Business Rules**: BR-09 (7 statuses), BR-37 (touch targets), BR-40 (reduced motion)
- **Description**: Enhance WeekCalendarStrip (created in W1-03) with the visual redesign from §4.2:
  - Day pills with Lucide icons inside (Check, Dumbbell, Moon, X)
  - Color-coded backgrounds per status
  - Today ring highlight `ring-2 ring-primary`
  - Day name abbreviation (T2-CN) + date number below
  - `animate-slide-up animate-stagger-2` entrance
  - Selected day expanded preview (workout name + exercise count inline below strip)
- **Owned Files (EXCLUSIVE)**:
  - MODIFY: `src/features/fitness/components/WeekCalendarStrip.tsx`
  - MODIFY: `src/__tests__/WeekCalendarStrip.test.tsx`
- **Effort**: M
- **Acceptance Criteria**:
  1. 7 pills with icons matching Design §4.2 status → icon → color mapping
  2. Selected day shows inline preview below strip (workout name + exercise count)
  3. `flex-1` layout — no horizontal overflow at 360px
  4. `animate-slide-up animate-stagger-2` entrance
  5. `motion-reduce:transform-none` on animations
  6. Tests updated for icon + preview rendering
- **QA Focus**: 360px layout (7 pills must fit), icon visibility, preview toggle

---

#### TASK-W2-03: Compelling Empty States

- **User Stories**: US-10
- **Design Spec**: §4.3
- **Business Rules**: BR-39 (shared EmptyState), BR-40 (reduced motion)
- **Description**: Enhance PlanEmptyState (created in W1-06) with compelling visuals:
  - Hero variant: `animate-fade-in` entrance, large icon, motivational text, primary CTA
  - Standard variant: medium icon, descriptive text, secondary CTA
  - Compact variant: small inline message with link-style CTA
  - All 5 empty contexts from Design §4.3 (no plan, no history, no progress, empty plan day, search no results)
  - Add new i18n keys per Design §8.6
- **Owned Files (EXCLUSIVE)**:
  - MODIFY: `src/features/fitness/components/PlanEmptyState.tsx`
  - MODIFY: `src/__tests__/PlanEmptyState.test.tsx`
  - MODIFY: `src/locales/vi.json` (fitness.emptyState.\* keys ONLY)
- **Effort**: S
- **Acceptance Criteria**:
  1. 5 empty state contexts render with correct variant, icon, title, description, CTA
  2. Hero variant has `animate-fade-in` entrance
  3. All text via `t()` with new i18n keys
  4. CTA buttons have `min-h-12` touch targets
  5. Tests cover all 5 contexts
- **QA Focus**: Empty state rendering for each context, CTA navigation targets

---

### Wave 3: Workout Logger Speed (5 parallel tasks)

**Goal**: Enhance workout logging UX with stepper buttons, copy set, progressive overload chip, rest timer animation, and completion celebration.

**Dependency**: Wave 1 complete (for component structure awareness). Does NOT depend on Wave 2.

---

#### TASK-W3-01: StepperInput Component

- **User Stories**: US-11
- **Design Spec**: §5.1
- **Business Rules**: BR-14 (0.5kg step), BR-15 (1 rep step), BR-37 (48dp touch), BR-42 (press feedback)
- **Description**: Create new `StepperInput` component for weight/reps input:
  - ± buttons with long-press rapid increment (150ms interval after 500ms hold)
  - Numeric input field with manual editing
  - Warning state for high values (>300kg per BR-14)
  - Compact size variant for inline use
  - Props interface per Design §5.1 `StepperInputProps`
  - Tailwind classes from Design §5.1
- **Owned Files (EXCLUSIVE)**:
  - CREATE: `src/features/fitness/components/StepperInput.tsx`
  - CREATE: `src/__tests__/StepperInput.test.tsx`
- **Effort**: M
- **Acceptance Criteria**:
  1. Tap ± changes value by `step` amount
  2. Long-press (≥500ms) triggers rapid increment at 150ms intervals
  3. Manual input in center field, validated on blur
  4. `min` boundary: minus button disabled at min value (`disabled:opacity-50`)
  5. `max` boundary: plus button disabled at max (if provided)
  6. Warning shown when value > `warningThreshold`
  7. Buttons: `min-h-12 min-w-12 rounded-xl active:scale-[0.95]`
  8. Input: `h-12 w-20 rounded-lg bg-muted text-center text-lg font-semibold tabular-nums`
  9. `motion-reduce:transform-none` on scale animation
  10. 100% test coverage including long-press behavior (fake timers)
  11. ≤150 LOC
- **QA Focus**: Long-press timing accuracy, boundary conditions (min=0, max=300), NaN prevention, rapid increment speed

---

#### TASK-W3-02: Copy Previous Set + Progressive Overload Chip

- **User Stories**: US-12, US-13
- **Design Spec**: §5.2, §5.3
- **Business Rules**: BR-21 (copy from last set), BR-22 (overload logic), BR-23 (increment by experience), BR-24 (plateau detection)
- **Description**: Enhance `ExerciseWorkoutCard.tsx` with two new features:
  1. **Copy Previous Set button**: Copies weight/reps/RPE from last completed set of same exercise in current session. Disabled if no previous set exists.
  2. **Progressive Overload Chip**: Shows suggestion chip "↑ Xkg × Yrep" when overload conditions met. Uses `useProgressiveOverload` hook. Chip is tappable to auto-fill values.
  - Plateau indicator when detected (per BR-24)
  - Suggestion source label: "progressive_overload" | "rep_progression"
- **Owned Files (EXCLUSIVE)**:
  - MODIFY: `src/features/fitness/components/ExerciseWorkoutCard.tsx`
  - MODIFY: `src/__tests__/ExerciseWorkoutCard.test.tsx`
- **Effort**: M
- **Acceptance Criteria**:
  1. "Copy" button visible on set 2+ (hidden on set 1)
  2. Copy action fills weight + reps + RPE from previous set
  3. Overload chip shows when `getSuggestion()` returns non-null
  4. Tapping chip auto-fills suggested weight + reps
  5. Plateau badge shows when `detectPlateau().isPlateaued === true`
  6. All buttons `min-h-12`, `active:scale-[0.98]`
  7. Tests cover: copy first set (disabled), copy second set, overload suggestion, plateau state
- **QA Focus**: Copy with 0 previous sets, overload calculation accuracy, plateau detection edge case (exactly 3 weeks)

---

#### TASK-W3-03: Rest Timer Enhancement

- **User Stories**: US-14
- **Design Spec**: §5.4
- **Business Rules**: BR-17 (default 90s), BR-18 (+30s per tap), BR-40 (reduced motion)
- **Description**: Enhance existing `RestTimer.tsx` (175 LOC) with:
  - SVG ring countdown animation (circular progress)
  - `stroke-dashoffset` transition with `1s linear`
  - +30s button to extend timer
  - Skip button to dismiss
  - Pause/resume toggle
  - Auto-advance when timer completes
  - Visual states: running, paused, completed
  - `motion-reduce:[transition:none]` on ring
- **Owned Files (EXCLUSIVE)**:
  - MODIFY: `src/features/fitness/components/RestTimer.tsx`
  - CREATE: `src/__tests__/RestTimer.test.tsx`
- **Effort**: M
- **Acceptance Criteria**:
  1. SVG ring with `stroke-dashoffset` animated countdown
  2. Center display: remaining seconds in `text-4xl font-bold tabular-nums`
  3. +30s button extends timer (BR-18)
  4. Skip button dismisses timer and calls `onComplete`
  5. Pause/resume toggle button
  6. Ring color: `stroke-primary` (running), `stroke-muted` (paused)
  7. `motion-reduce:[transition:none]` on SVG circle
  8. Auto-advance to next exercise on timer complete
  9. 100% test coverage with fake timers
- **QA Focus**: Timer accuracy (1s tick), +30s during last 5 seconds, pause/resume state, reduced motion behavior

---

#### TASK-W3-04: Workout Completion Celebration

- **User Stories**: US-15
- **Design Spec**: §5.5
- **Business Rules**: BR-04 (streak milestones), BR-05 (session milestones), BR-06 (PR detection), BR-19 (atomic save)
- **Description**: Create `WorkoutCompletionCard` shown after "Hoàn thành" in WorkoutLogger:
  - Stats grid (2×2): duration, total volume, total sets, exercise count
  - PR list (if any detected) with energy-colored badges
  - Streak milestone celebration (7, 14, 30, 60, 90 days)
  - Session milestone (1st, 10th, 25th, 50th, 100th workout)
  - First workout special message
  - "Lưu & đóng" primary CTA + "Hủy" secondary
  - `animate-scale-in` entrance animation
  - Props interface per Design §5.5 `WorkoutCompletionCardProps`
- **Owned Files (EXCLUSIVE)**:
  - CREATE: `src/features/fitness/components/WorkoutCompletionCard.tsx`
  - CREATE: `src/__tests__/WorkoutCompletionCard.test.tsx`
- **Effort**: M
- **Acceptance Criteria**:
  1. Stats grid: `grid grid-cols-2 gap-3` with icon + value + label per cell
  2. PR section: list of exercises with new PRs, `text-energy` colored
  3. Streak milestone badge when `streakMilestone` provided
  4. Session milestone (1st workout) renders special congratulation
  5. Empty state: "Buổi tập trống" message + discard button only (no stats)
  6. `animate-scale-in` on mount
  7. "Lưu & đóng": `min-h-12 rounded-xl bg-primary text-lg font-semibold`
  8. 100% test coverage (including empty, with PRs, with milestone)
  9. ≤200 LOC
- **QA Focus**: Empty workout (0 sets), multiple PRs display, milestone + PR combined, save callback triggers atomic save

---

#### TASK-W3-05: WorkoutLogger Integration (Rewire)

- **User Stories**: US-11-15 integration
- **Design Spec**: §5.1-§5.5 integration
- **Business Rules**: BR-19 (atomic save), BR-20 (draft auto-save)
- **Description**: Rewire `WorkoutLogger.tsx` (681 LOC) to use the new components created in W3-01 through W3-04:
  1. Replace inline weight/reps inputs with `<StepperInput>`
  2. Replace inline summary with `<WorkoutCompletionCard>`
  3. Wire `CopySetButton` and `OverloadSuggestionChip` from enhanced `ExerciseWorkoutCard`
  4. Wire enhanced `RestTimer` with SVG ring
  5. Update WorkoutLogger tests for new component delegation

  **CRITICAL**: This task MUST run AFTER W3-01 through W3-04 complete.

- **Owned Files (EXCLUSIVE)**:
  - MODIFY: `src/features/fitness/components/WorkoutLogger.tsx`
  - MODIFY: `src/__tests__/WorkoutLogger.test.tsx`
- **Effort**: L
- **Acceptance Criteria**:
  1. StepperInput used for all weight/reps inputs
  2. WorkoutCompletionCard shown on "Hoàn thành"
  3. RestTimer with SVG ring shown between sets
  4. Copy + overload chips visible in ExerciseWorkoutCard
  5. Draft auto-save still works (BR-20)
  6. Atomic save still works (BR-19)
  7. All existing WorkoutLogger tests pass or migrated
  8. `npm run lint` → 0 errors
  9. `npm run test` → 0 failures
- **QA Focus**: Full workout flow (start → log sets → rest → complete → save), draft recovery, back button during workout

---

### Wave 4: Progress & History (4 parallel tasks)

**Goal**: Add volume trends, PR tracking, enhanced history with week grouping, and clone workout.

**Dependency**: Wave 1 complete. Does NOT depend on Wave 2 or 3.

---

#### TASK-W4-01: Volume Trend Chart

- **User Stories**: US-16
- **Design Spec**: §6.1
- **Business Rules**: BR-48 (no bundle increase — pure CSS)
- **Description**: Create `VolumeTrendChart` component using pure CSS flexbox bars (NO chart library):
  - 8-week rolling view with vertical bars
  - Bar height proportional to weekly volume (total kg lifted)
  - Current week highlighted with `bg-primary`, others `bg-primary/30`
  - Week labels below: "W1", "W2", etc.
  - Hover/tap shows tooltip with exact volume
  - Container: `h-40 flex items-end gap-1`
  - Empty state: "Chưa có dữ liệu" when no workouts in range
  - Props interface per Design §6.1
- **Owned Files (EXCLUSIVE)**:
  - CREATE: `src/features/fitness/components/VolumeTrendChart.tsx`
  - CREATE: `src/__tests__/VolumeTrendChart.test.tsx`
- **Effort**: M
- **Acceptance Criteria**:
  1. 8 bars rendered, heights proportional to volume
  2. Current week bar: `bg-primary rounded-t-md`; others: `bg-primary/30 rounded-t-md`
  3. Week labels: `text-[10px] tabular-nums text-muted-foreground`
  4. Bars use `flex-1` for equal width distribution
  5. Height transition: `transition-all duration-300`
  6. Empty state when `weeks.length === 0`
  7. 100% test coverage
  8. ≤200 LOC
- **QA Focus**: 0 volume week (bar height 0), single week data, all 8 weeks data, max volume scaling

---

#### TASK-W4-02: Personal Records Display

- **User Stories**: US-17
- **Design Spec**: §6.2
- **Business Rules**: BR-06 (PR detection rules)
- **Description**: Create `PersonalRecords` component:
  - List of exercises with PR achievements
  - Each item: exercise name, best weight × reps, date
  - Expandable to show PR history (last 5 entries)
  - Trophy icon for current PR
  - Energy-colored weight values
  - Props interface per Design §6.2
- **Owned Files (EXCLUSIVE)**:
  - CREATE: `src/features/fitness/components/PersonalRecords.tsx`
  - CREATE: `src/__tests__/PersonalRecords.test.tsx`
- **Effort**: M
- **Acceptance Criteria**:
  1. Renders list of exercises with best weight × reps + date
  2. Expandable history (collapsible per exercise)
  3. Trophy icon on current PR entry
  4. Energy-colored weight text (`text-energy`)
  5. Empty state: "Chưa có kỷ lục" with Dumbbell icon
  6. 100% test coverage
  7. ≤200 LOC
- **QA Focus**: No PRs state, multiple PRs per exercise, expand/collapse toggle, date formatting

---

#### TASK-W4-03: Workout History Week Grouping + Clone

- **User Stories**: US-18, US-19
- **Design Spec**: §6.3, §6.4
- **Business Rules**: BR-19 (atomic save for cloned workout)
- **Description**: Enhance existing `WorkoutHistory.tsx` (382 LOC) with:
  1. **Week grouping**: Group workouts by ISO week with sticky headers ("Tuần 28: 7/7 - 13/7")
  2. **PR badges**: Inline small badge on exercises where PR was set
  3. **Clone button**: Copy icon on each workout card. Tapping creates a draft with same exercises/sets and navigates to today's plan view
- **Owned Files (EXCLUSIVE)**:
  - MODIFY: `src/features/fitness/components/WorkoutHistory.tsx`
  - MODIFY: `src/__tests__/WorkoutHistory.test.tsx`
- **Effort**: M
- **Acceptance Criteria**:
  1. Workouts grouped under week headers with date range
  2. Week headers are sticky (`sticky top-0 z-10 bg-background`)
  3. PR badge shows on exercise cards where `isPR === true`
  4. Clone button (Copy icon) on each workout card
  5. Clone creates draft via `setWorkoutDraft()` and navigates to plan tab
  6. All existing WorkoutHistory tests pass
  7. New tests for: week grouping logic, PR badge rendering, clone action
- **QA Focus**: Week boundary (Sunday→Monday), empty week (should not show header), clone with 10+ exercises, clone navigation

---

#### TASK-W4-04: ProgressDashboard Integration

- **User Stories**: US-16, US-17 integration
- **Design Spec**: §6.1, §6.2 integration
- **Description**: Rewire `ProgressDashboard.tsx` (518 LOC) to use new VolumeTrendChart and PersonalRecords components:
  1. Replace inline chart code with `<VolumeTrendChart>`
  2. Add `<PersonalRecords>` section below chart
  3. Keep existing weight tracking and time range filter
  4. Compute `weeks` data from `workouts` + `workoutSets` for chart
  5. Compute `prs` data using gamification utility `detectPRs()`

  **CRITICAL**: Runs AFTER W4-01 and W4-02.

- **Owned Files (EXCLUSIVE)**:
  - MODIFY: `src/features/fitness/components/ProgressDashboard.tsx`
  - MODIFY (if exists or CREATE): `src/__tests__/ProgressDashboard.test.tsx`
- **Effort**: M
- **Acceptance Criteria**:
  1. VolumeTrendChart renders with computed weekly volumes
  2. PersonalRecords renders with detected PRs
  3. Time range filter still works for both chart and PRs
  4. Existing weight tracking unchanged
  5. `npm run test` → 0 failures
- **QA Focus**: Time range switching, empty workout history, data computation accuracy

---

### Wave 5: Polish & Integration (5 parallel tasks)

**Goal**: Streak redesign, exercise selector enhancement, touch target audit, stagger animations, and set editor modal.

**Dependency**: Wave 1 complete. Independent of Waves 2-4.

---

#### TASK-W5-01: Streak Counter Redesign

- **User Stories**: US-20
- **Design Spec**: §7.1
- **Business Rules**: BR-01-BR-12 (all streak rules)
- **Description**: Redesign existing `StreakCounter.tsx` (73 LOC) with state machine from §7.1:
  - State: hidden (streak=0), flame (1-6), trophy (7+), at-risk (warning badge)
  - Week dots: 7 status dots below counter
  - Milestone celebration on 7, 14, 30, 60, 90
  - `animate-scale-in` on first workout (0→1 transition)
  - Streak count with `text-2xl font-bold tabular-nums`
  - Longest streak display
- **Owned Files (EXCLUSIVE)**:
  - MODIFY: `src/features/fitness/components/StreakCounter.tsx`
  - CREATE: `src/__tests__/StreakCounter.test.tsx`
- **Effort**: M
- **Acceptance Criteria**:
  1. Hidden when streak=0 (no DOM)
  2. Flame icon + count for streak 1-6
  3. Trophy icon + count for streak 7+
  4. Warning badge overlay when `streakAtRisk`
  5. `animate-scale-in` on 0→1 transition
  6. Week dots with 7 statuses per BR-09
  7. Milestone text for 7, 14, 30, 60, 90 thresholds
  8. 100% test coverage
- **QA Focus**: Streak=0 hidden, streak=1 entrance animation, at-risk state, milestone at exactly 7/14/30

---

#### TASK-W5-02: Exercise Selector Enhancement

- **User Stories**: US-21
- **Design Spec**: §7.2
- **Business Rules**: BR-30 (equipment types), BR-29 (exercise categories)
- **Description**: Enhance `ExerciseSelector.tsx` (285 LOC) with:
  - "Recently used" section at top (last 5 exercises from workoutSets)
  - Category filter tabs: compound, isolation, cardio
  - Muscle group filter chips
  - Equipment filter chips
  - Search with Vietnamese text matching
  - `min-h-12` touch targets on all filter chips and exercise items
- **Owned Files (EXCLUSIVE)**:
  - MODIFY: `src/features/fitness/components/ExerciseSelector.tsx`
  - CREATE: `src/__tests__/ExerciseSelector.test.tsx`
- **Effort**: M
- **Acceptance Criteria**:
  1. "Gần đây" section shows last 5 unique exercises
  2. Category filter: 3 tabs (compound, isolation, cardio)
  3. Muscle group chips: all 7 groups
  4. Equipment chips: all 7 types
  5. Search filters Vietnamese names (`nameVi`)
  6. Empty search result: compact EmptyState with "Tạo bài tập mới" CTA
  7. All interactive elements: `min-h-12`, `active:scale-[0.98]`
  8. 100% test coverage
- **QA Focus**: Recently used with 0 history, filter combination (muscle + equipment), search with accented characters, empty results

---

#### TASK-W5-03: Touch Target Audit + Stagger Animations

- **User Stories**: US-22, US-24
- **Design Spec**: §7.3, §7.4
- **Business Rules**: BR-37 (≥48dp touch), BR-40 (reduced motion), BR-41 (30ms stagger, max 5 tiers)
- **Description**: Cross-cutting audit and enhancement:
  1. **Touch target audit**: Scan ALL fitness components for elements < 48dp. Add `min-h-12 min-w-12` where missing. Add `active:scale-[0.98] motion-reduce:transform-none` where missing.
  2. **Stagger animations**: Add `@keyframes` for `slide-up`, `fade-in`, `scale-in` in `src/index.css`. Create stagger utility classes `animate-stagger-{1-5}` with 30ms increments. Apply per Design §7.4 tier assignment.
  3. Add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` to any fitness interactive element missing it.

  Files to audit (READ-ONLY scan, MODIFY only those listed below):
  - All Wave 1-4 new components (already have correct classes from their tasks)
  - Existing components NOT touched by other tasks

- **Owned Files (EXCLUSIVE)**:
  - MODIFY: `src/index.css` (keyframes + stagger classes ONLY)
  - MODIFY: `src/features/fitness/components/SessionTabs.tsx`
  - MODIFY: `src/features/fitness/components/AddSessionModal.tsx`
  - MODIFY: `src/features/fitness/components/CustomExerciseModal.tsx`
  - MODIFY: `src/features/fitness/components/DayAssignmentSheet.tsx`
  - MODIFY: `src/features/fitness/components/SwapExerciseSheet.tsx`
  - MODIFY: `src/features/fitness/components/QuickConfirmCard.tsx`
  - MODIFY: `src/features/fitness/components/DeloadModal.tsx`
  - MODIFY: `src/features/fitness/components/SplitChangeConfirm.tsx`
- **Effort**: M
- **Acceptance Criteria**:
  1. `@keyframes slide-up`, `fade-in`, `scale-in` defined in index.css
  2. `.animate-stagger-{1-5}` classes with `animation-delay: {n*30}ms`
  3. All audited components: interactive elements have `min-h-12` (or `min-h-11` for pills)
  4. All audited components: `active:scale-[0.98] motion-reduce:transform-none`
  5. All audited components: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none`
  6. `npm run lint` → 0 errors
  7. `npm run test` → 0 failures (no behavioral changes)
- **QA Focus**: Animation timing (total ≤350ms), reduced motion disables all animations, focus ring visible on keyboard nav

---

#### TASK-W5-04: Set Editor Modal Redesign

- **User Stories**: US-28
- **Design Spec**: §7.6
- **Business Rules**: BR-16 (RPE options), BR-14 (weight 0.5kg step), BR-15 (reps 1 step)
- **Description**: Redesign `SetEditor.tsx` (277 LOC) as bottom sheet modal:
  - Use `ModalBackdrop` from shared components (not raw `<dialog>`)
  - Replace inline inputs with `<StepperInput>` for weight and reps
  - RPE selector: 5 radio buttons [6, 7, 8, 9, 10] with color coding
  - Rest seconds input with `<StepperInput>` (step=15, min=0)
  - "Lưu" primary CTA + "Hủy" secondary
  - Entrance: slide up from bottom (`animate-slide-up`)
- **Owned Files (EXCLUSIVE)**:
  - MODIFY: `src/features/fitness/components/SetEditor.tsx`
  - CREATE: `src/__tests__/SetEditor.test.tsx`
- **Effort**: M
- **Acceptance Criteria**:
  1. Renders as bottom sheet via `ModalBackdrop`
  2. Weight input: `<StepperInput step={0.5} min={0} warningThreshold={300} unit="kg">`
  3. Reps input: `<StepperInput step={1} min={1} unit="rep">`
  4. RPE: 5 radio buttons with color progression (green→yellow→red)
  5. Rest: `<StepperInput step={15} min={0} unit="s">`
  6. "Lưu" + "Hủy" buttons: `min-h-12`
  7. `animate-slide-up` entrance
  8. 100% test coverage
- **QA Focus**: StepperInput interaction within modal, RPE selection, save/cancel callbacks, modal backdrop dismiss

---

#### TASK-W5-05: Workout Draft Auto-Recovery + i18n Finalization

- **User Stories**: US-25
- **Design Spec**: §7.5, §8.6
- **Business Rules**: BR-20 (draft survives restart), BR-43 (all text via t())
- **Description**: Two related tasks combined to avoid vi.json conflict:
  1. **Draft auto-recovery**: On FitnessTab mount, check for existing draft via `loadWorkoutDraft()`. If found, show inline prompt: "Tiếp tục buổi tập?" with "Tiếp tục" + "Hủy" buttons. "Tiếp tục" opens WorkoutLogger with draft. "Hủy" calls `clearWorkoutDraft()`.
  2. **i18n finalization**: Add ALL remaining i18n keys from Design §8.6 to vi.json. Verify all `t()` calls in new/modified fitness components have corresponding keys.
- **Owned Files (EXCLUSIVE)**:
  - MODIFY: `src/features/fitness/components/FitnessTab.tsx`
  - MODIFY: `src/__tests__/FitnessTab.test.tsx`
  - MODIFY: `src/locales/vi.json` (ALL fitness.\* keys except those in W2-03)
- **Effort**: M
- **Acceptance Criteria**:
  1. Draft prompt shown when `workoutDraft !== null` on mount
  2. "Tiếp tục" opens WorkoutLogger with draft exercises + sets
  3. "Hủy" clears draft and dismisses prompt
  4. Prompt: `bg-warning/10 border border-warning/20 rounded-xl p-4`
  5. ALL fitness i18n keys from Design §8.6 present in vi.json
  6. `grep -r "t('" src/features/fitness/ | sort -u` — all keys exist in vi.json
  7. 100% test coverage for draft recovery
- **QA Focus**: App restart with draft (verify localStorage persistence), draft with expired plan day, i18n key completeness

---

## 3. File Ownership Matrix

### Wave 1 — Foundation (6 tasks, parallel)

| File                                                    | Task  | Action |
| ------------------------------------------------------- | ----- | ------ |
| `src/features/fitness/components/TodayWorkoutCard.tsx`  | W1-01 | CREATE |
| `src/__tests__/TodayWorkoutCard.test.tsx`               | W1-01 | CREATE |
| `src/features/fitness/components/TodayRestCard.tsx`     | W1-02 | CREATE |
| `src/__tests__/TodayRestCard.test.tsx`                  | W1-02 | CREATE |
| `src/features/fitness/components/WeekCalendarStrip.tsx` | W1-03 | CREATE |
| `src/__tests__/WeekCalendarStrip.test.tsx`              | W1-03 | CREATE |
| `src/features/fitness/components/PlanDayAccordion.tsx`  | W1-04 | CREATE |
| `src/__tests__/PlanDayAccordion.test.tsx`               | W1-04 | CREATE |
| `src/features/fitness/components/PlanActionBar.tsx`     | W1-05 | CREATE |
| `src/__tests__/PlanActionBar.test.tsx`                  | W1-05 | CREATE |
| `src/features/fitness/components/PlanEmptyState.tsx`    | W1-06 | CREATE |
| `src/__tests__/PlanEmptyState.test.tsx`                 | W1-06 | CREATE |
| `src/features/fitness/components/TrainingPlanView.tsx`  | W1-06 | MODIFY |
| `src/__tests__/TrainingPlanView.test.tsx`               | W1-06 | MODIFY |

### Wave 2 — Visual Enhancements (3 tasks, parallel)

| File                                                    | Task  | Action                              |
| ------------------------------------------------------- | ----- | ----------------------------------- |
| `src/features/fitness/components/TodayWorkoutCard.tsx`  | W2-01 | MODIFY                              |
| `src/__tests__/TodayWorkoutCard.test.tsx`               | W2-01 | MODIFY                              |
| `src/features/fitness/components/WeekCalendarStrip.tsx` | W2-02 | MODIFY                              |
| `src/__tests__/WeekCalendarStrip.test.tsx`              | W2-02 | MODIFY                              |
| `src/features/fitness/components/PlanEmptyState.tsx`    | W2-03 | MODIFY                              |
| `src/__tests__/PlanEmptyState.test.tsx`                 | W2-03 | MODIFY                              |
| `src/locales/vi.json`                                   | W2-03 | MODIFY (fitness.emptyState.\* ONLY) |

### Wave 3 — Logger Speed (5 tasks, 4 parallel + 1 sequential)

| File                                                        | Task  | Action |
| ----------------------------------------------------------- | ----- | ------ |
| `src/features/fitness/components/StepperInput.tsx`          | W3-01 | CREATE |
| `src/__tests__/StepperInput.test.tsx`                       | W3-01 | CREATE |
| `src/features/fitness/components/ExerciseWorkoutCard.tsx`   | W3-02 | MODIFY |
| `src/__tests__/ExerciseWorkoutCard.test.tsx`                | W3-02 | MODIFY |
| `src/features/fitness/components/RestTimer.tsx`             | W3-03 | MODIFY |
| `src/__tests__/RestTimer.test.tsx`                          | W3-03 | CREATE |
| `src/features/fitness/components/WorkoutCompletionCard.tsx` | W3-04 | CREATE |
| `src/__tests__/WorkoutCompletionCard.test.tsx`              | W3-04 | CREATE |
| `src/features/fitness/components/WorkoutLogger.tsx`         | W3-05 | MODIFY |
| `src/__tests__/WorkoutLogger.test.tsx`                      | W3-05 | MODIFY |

### Wave 4 — Progress & History (4 tasks, 3 parallel + 1 sequential)

| File                                                    | Task  | Action        |
| ------------------------------------------------------- | ----- | ------------- |
| `src/features/fitness/components/VolumeTrendChart.tsx`  | W4-01 | CREATE        |
| `src/__tests__/VolumeTrendChart.test.tsx`               | W4-01 | CREATE        |
| `src/features/fitness/components/PersonalRecords.tsx`   | W4-02 | CREATE        |
| `src/__tests__/PersonalRecords.test.tsx`                | W4-02 | CREATE        |
| `src/features/fitness/components/WorkoutHistory.tsx`    | W4-03 | MODIFY        |
| `src/__tests__/WorkoutHistory.test.tsx`                 | W4-03 | MODIFY        |
| `src/features/fitness/components/ProgressDashboard.tsx` | W4-04 | MODIFY        |
| `src/__tests__/ProgressDashboard.test.tsx`              | W4-04 | MODIFY/CREATE |

### Wave 5 — Polish (5 tasks, parallel)

| File                                                      | Task  | Action                                     |
| --------------------------------------------------------- | ----- | ------------------------------------------ |
| `src/features/fitness/components/StreakCounter.tsx`       | W5-01 | MODIFY                                     |
| `src/__tests__/StreakCounter.test.tsx`                    | W5-01 | CREATE                                     |
| `src/features/fitness/components/ExerciseSelector.tsx`    | W5-02 | MODIFY                                     |
| `src/__tests__/ExerciseSelector.test.tsx`                 | W5-02 | CREATE                                     |
| `src/index.css`                                           | W5-03 | MODIFY                                     |
| `src/features/fitness/components/SessionTabs.tsx`         | W5-03 | MODIFY                                     |
| `src/features/fitness/components/AddSessionModal.tsx`     | W5-03 | MODIFY                                     |
| `src/features/fitness/components/CustomExerciseModal.tsx` | W5-03 | MODIFY                                     |
| `src/features/fitness/components/DayAssignmentSheet.tsx`  | W5-03 | MODIFY                                     |
| `src/features/fitness/components/SwapExerciseSheet.tsx`   | W5-03 | MODIFY                                     |
| `src/features/fitness/components/QuickConfirmCard.tsx`    | W5-03 | MODIFY                                     |
| `src/features/fitness/components/DeloadModal.tsx`         | W5-03 | MODIFY                                     |
| `src/features/fitness/components/SplitChangeConfirm.tsx`  | W5-03 | MODIFY                                     |
| `src/features/fitness/components/SetEditor.tsx`           | W5-04 | MODIFY                                     |
| `src/__tests__/SetEditor.test.tsx`                        | W5-04 | CREATE                                     |
| `src/features/fitness/components/FitnessTab.tsx`          | W5-05 | MODIFY                                     |
| `src/__tests__/FitnessTab.test.tsx`                       | W5-05 | MODIFY                                     |
| `src/locales/vi.json`                                     | W5-05 | MODIFY (all fitness._ except emptyState._) |

---

## 4. Dependency Graph

```
Wave 1: W1-01 ∥ W1-02 ∥ W1-03 ∥ W1-04 ∥ W1-05  (5 parallel CREATE tasks)
         ↓ all complete
        W1-06                                      (sequential REWIRE task)
         ↓
Wave 2: W2-01 ∥ W2-02 ∥ W2-03                     (3 parallel ENHANCE tasks)

Wave 3: W3-01 ∥ W3-02 ∥ W3-03 ∥ W3-04            (4 parallel CREATE/ENHANCE)
         ↓ all complete
        W3-05                                      (sequential REWIRE task)

Wave 4: W4-01 ∥ W4-02 ∥ W4-03                     (3 parallel CREATE/ENHANCE)
         ↓ W4-01 + W4-02 complete
        W4-04                                      (sequential REWIRE task)

Wave 5: W5-01 ∥ W5-02 ∥ W5-03 ∥ W5-04 ∥ W5-05   (5 parallel — all independent)
```

**Execution order**: W1 → [W2, W3, W4, W5 can start in any order after W1]

W2, W3, W4, W5 are independent of each other but ALL depend on W1 completion. Within each wave, tasks are parallel EXCEPT the noted sequential rewire tasks.

**Recommended execution order for maximum parallelism**:

1. W1 (01-05 parallel → 06 sequential)
2. W3 (01-04 parallel → 05 sequential) + W4 (01-03 parallel → 04 sequential) + W5 (01-05 all parallel)
3. W2 (01-03 parallel) — last because it enhances W1 outputs

---

## 5. Conflict Verification

### Same-wave file conflicts: ZERO ✅

| Wave | Verification                                                                                                                                                                                      |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1   | Tasks 01-05: all CREATE new files. Task 06: sole modifier of TPV + TPV test. No overlap.                                                                                                          |
| W2   | Task 01→TodayWorkoutCard, 02→WeekCalendarStrip, 03→PlanEmptyState + vi.json(emptyState.\*). No overlap.                                                                                           |
| W3   | Task 01→StepperInput(new), 02→ExerciseWorkoutCard, 03→RestTimer, 04→WorkoutCompletionCard(new). Task 05→WorkoutLogger (after 01-04). No overlap.                                                  |
| W4   | Task 01→VolumeTrendChart(new), 02→PersonalRecords(new), 03→WorkoutHistory. Task 04→ProgressDashboard (after 01-02). No overlap.                                                                   |
| W5   | Task 01→StreakCounter, 02→ExerciseSelector, 03→index.css+SessionTabs+AddSession+Custom+DayAssign+Swap+Quick+Deload+SplitConfirm, 04→SetEditor, 05→FitnessTab+vi.json(non-emptyState). No overlap. |

### Cross-wave vi.json conflict resolution:

- W2-03 owns `fitness.emptyState.*` keys
- W5-05 owns ALL OTHER `fitness.*` keys
- Execution: W5 runs independently of W2. If both run in same session, vi.json edits are to DIFFERENT key namespaces → no conflict.

---

## 6. User Story → Task Traceability

| User Story | Wave | Task(s)      |
| ---------- | ---- | ------------ |
| US-01      | W1   | W1-01        |
| US-02      | W1   | W1-02        |
| US-03      | W1   | W1-03        |
| US-04      | W1   | W1-04        |
| US-05      | W1   | W1-05        |
| US-06      | W1   | W1-06        |
| US-07      | W1   | W1-06        |
| US-08      | W2   | W2-01        |
| US-09      | W2   | W2-02        |
| US-10      | W2   | W2-03        |
| US-11      | W3   | W3-01, W3-05 |
| US-12      | W3   | W3-02        |
| US-13      | W3   | W3-02        |
| US-14      | W3   | W3-03        |
| US-15      | W3   | W3-04, W3-05 |
| US-16      | W4   | W4-01, W4-04 |
| US-17      | W4   | W4-02, W4-04 |
| US-18      | W4   | W4-03        |
| US-19      | W4   | W4-03        |
| US-20      | W5   | W5-01        |
| US-21      | W5   | W5-02        |
| US-22      | W5   | W5-03        |
| US-24      | W5   | W5-03        |
| US-25      | W5   | W5-05        |
| US-28      | W5   | W5-04        |

### User Stories NOT in scope (deferred to Phase 3.4):

- US-23 (Horizontal Scroll Fix) — requires ProgressDashboard chart refactor already handled by W4
- US-26 (Session Timer) — minimal change, can be added after Wave 3
- US-27 (Progressive Overload Chip Redesign) — covered partially by W3-02
- US-29 (Profile Out-of-Sync Banner) — already exists, enhancement only
- US-30 (Workout Mode Toggle) — already exists
- US-31 (Coaching Hints) — low priority, text-only
- US-32 (Performance Budget) — validation task, not component work

---

## 7. Quality Gates Per Wave

Each wave commit MUST pass:

```bash
# 1. Lint
npm run lint                    # 0 errors, no eslint-disable

# 2. Tests
npm run test                    # 0 failures

# 3. Coverage
npm run test:coverage           # 100% for new/modified files

# 4. Build
npm run build                   # Clean production build

# 5. SonarQube
npm run sonar                   # 0 issues (Bug, Vulnerability, Code Smell)

# 6. Bundle size
# Verify main chunk ≤ current size (no increase per BR-48)
```

---

## 8. Effort Summary

| Wave      | Tasks  | Parallel      | Sequential | Est. Total |
| --------- | ------ | ------------- | ---------- | ---------- |
| W1        | 6      | 5 (S+S+M+M+S) | 1 (L)      | M          |
| W2        | 3      | 3 (M+M+S)     | 0          | M          |
| W3        | 5      | 4 (M+M+M+M)   | 1 (L)      | L          |
| W4        | 4      | 3 (M+M+M)     | 1 (M)      | M          |
| W5        | 5      | 5 (M+M+M+M+M) | 0          | M          |
| **Total** | **23** | **20**        | **3**      | **L**      |

New components: 9 (TodayWorkoutCard, TodayRestCard, WeekCalendarStrip, PlanDayAccordion, PlanActionBar, PlanEmptyState, StepperInput, WorkoutCompletionCard, VolumeTrendChart, PersonalRecords) — actually 10.

Enhanced components: 12 (TrainingPlanView, ExerciseWorkoutCard, RestTimer, WorkoutLogger, WorkoutHistory, ProgressDashboard, StreakCounter, ExerciseSelector, SetEditor, FitnessTab, + 8 small components in W5-03).

New test files: ~15.

---

**Status**: KẾ*HOẠCH*ĐÃ_CHỐT
