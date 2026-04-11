# 🎨 Phase 3.3 — Fitness Tab UI/UX Design Specification

> **Version**: 1.0
> **Author**: Designer Agent
> **Date**: 2025-07-14
> **Status**: DESIGN_READY
> **Scope**: 32 User Stories across 5 Waves (US-01 → US-32)

---

## Table of Contents

1. [Design Principles & Constraints](#1-design-principles--constraints)
2. [Design System Reference](#2-design-system-reference)
3. [Wave 1 — Foundation & Decomposition](#3-wave-1--foundation--decomposition)
4. [Wave 2 — Today-First Layout](#4-wave-2--today-first-layout)
5. [Wave 3 — Workout Logger Speed](#5-wave-3--workout-logger-speed)
6. [Wave 4 — Progress & History](#6-wave-4--progress--history)
7. [Wave 5 — Polish & Integration](#7-wave-5--polish--integration)
8. [Cross-Cutting Concerns](#8-cross-cutting-concerns)
9. [Component Inventory](#9-component-inventory)

---

## 1. Design Principles & Constraints

### 1.1 Mobile-First Viewport

| Property          | Value                                      |
| ----------------- | ------------------------------------------ |
| Min width         | 360px                                      |
| Max width         | 428px (sm breakpoint scales beyond)        |
| Safe area top     | `pt-safe` = `env(safe-area-inset-top)`     |
| Safe area bottom  | `pb-safe` = `env(safe-area-inset-bottom)`  |
| Bottom nav height | 48px + pb-safe (main content uses `pb-24`) |
| Max content width | `max-w-5xl` (1024px) with `px-4 sm:px-6`   |

### 1.2 Touch Target Rules

| Rule                  | Spec                  | Tailwind                                           |
| --------------------- | --------------------- | -------------------------------------------------- |
| Primary interactive   | ≥48dp (48×48px)       | `min-h-12 min-w-12`                                |
| Secondary interactive | ≥44dp + 8dp spacing   | `min-h-11 min-w-11` with `gap-2`                   |
| Inline text action    | ≥44dp height          | `min-h-11`                                         |
| Press feedback        | ALL tappable elements | `active:scale-[0.98] motion-reduce:transform-none` |

### 1.3 Component Reuse Priority

1. **Shared components** (`src/components/shared/`): EmptyState, ModalBackdrop, SubTabBar, CloseButton, StatusTag
2. **shadcn/ui** (`src/components/ui/`): Button, Card, Sheet, Progress, Badge, Tabs, ScrollArea
3. **Phase 3.1/3.2 patterns**: Hero gradient cards, MacroBar, MiniNutritionBar, stagger animations
4. **New components**: Only when no existing component matches

### 1.4 Animation Budget

| Tier      | Delay                                   | Use                                       |
| --------- | --------------------------------------- | ----------------------------------------- |
| 1         | 0ms                                     | Hero card, primary content                |
| 2         | 30ms                                    | Secondary cards (week strip)              |
| 3         | 60ms                                    | Tertiary content (streak)                 |
| 4         | 90ms                                    | Supporting content (accordion first item) |
| 5         | 120ms                                   | Additional items                          |
| Max total | 150ms stagger + 200ms animation = 350ms | Hard limit                                |

All animations: `@media (prefers-reduced-motion: reduce) { animation: none; }`.

---

## 2. Design System Reference

### 2.1 Semantic Color Tokens (USE ONLY THESE)

**Backgrounds**:

- `bg-card` — Card/panel surface
- `bg-muted` — Inactive/disabled surface
- `bg-primary-subtle` — Hero/accent surface (light primary tint)
- `bg-accent` — Hover state
- `bg-accent-highlight` — Active chip/selection
- `bg-energy-subtle` — Energy/calorie accent surface
- `bg-rose-50` — Fitness/workout subtle surface
- `bg-success/10`, `bg-warning/10`, `bg-error/10`, `bg-info/10` — Status surfaces

**Text**:

- `text-foreground` — Primary text
- `text-foreground-secondary` — Secondary text
- `text-muted-foreground` — Disabled/placeholder text
- `text-primary` — CTA/link text
- `text-energy` — Energy value text
- `text-rose` — Fitness accent text
- `text-success`, `text-warning`, `text-error`, `text-info` — Status text

**Borders**:

- `border-border` — Standard border
- `border-border-subtle` — Light divider
- `border-primary` — Active/focus border

**Rings (Focus)**:

- `ring-ring` — Default focus ring
- `ring-primary` — Today highlight ring
- `focus-visible:ring-2 focus-visible:outline-none` — Focus pattern (ALL interactive)

### 2.2 Spacing Scale

| Token   | Value | Use                                       |
| ------- | ----- | ----------------------------------------- |
| `gap-1` | 4px   | Inline tight (icon + text)                |
| `gap-2` | 8px   | Inline gap (buttons in row, chip spacing) |
| `gap-3` | 12px  | Card internal padding                     |
| `gap-4` | 16px  | Card gap, section spacing                 |
| `gap-6` | 24px  | Section gap                               |
| `p-3`   | 12px  | Compact card padding                      |
| `p-4`   | 16px  | Standard card padding                     |
| `p-5`   | 20px  | Hero card padding                         |
| `px-4`  | 16px  | Page horizontal padding                   |

### 2.3 Typography Scale

| Class           | Size            | Use                         |
| --------------- | --------------- | --------------------------- |
| `text-stat-big` | 2rem (32px)     | Timer countdown, large stat |
| `text-stat-med` | 1.5rem (24px)   | Streak count, key metric    |
| `text-section`  | 1.125rem (18px) | Section heading             |
| `text-lg`       | 18px            | Card title                  |
| `text-base`     | 16px            | Body text                   |
| `text-sm`       | 14px            | Description, secondary info |
| `text-xs`       | 12px            | Caption, badge, chip label  |

### 2.4 Shared Component Quick Reference

| Component                | Key Props                                                                                          | When to Use                            |
| ------------------------ | -------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `EmptyState`             | `variant="hero"\|"standard"\|"compact"`, `icon`, `title`, `description`, `actionLabel`, `onAction` | Any zero-data state                    |
| `ModalBackdrop`          | `onClose`, `mobileLayout="sheet"\|"center"`, `allowSwipeToDismiss`                                 | Bottom sheets, modals                  |
| `SubTabBar`              | `tabs[]`, `activeTab`, `onTabChange`                                                               | Tab navigation (already in FitnessTab) |
| `CloseButton`            | `onClick`, `variant="default"\|"overlay"`                                                          | Modal/sheet close                      |
| `StatusTag`              | `variant`, `children`                                                                              | Status badges                          |
| `ShellOrientationBanner` | `eyebrow`, `title`, `description`, `actionLabel`, `onAction`                                       | Contextual banners                     |

---

## 3. Wave 1 — Foundation & Decomposition

> **Priority**: P0 (Blocking). **Goal**: Extract TrainingPlanView.tsx (1093 LOC) into 6 standalone components. **Visual**: NO visual changes — architecture only.

### 3.1 US-01: TodayWorkoutCard

**Purpose**: Hero card for "today's planned workout" — the first thing user sees.

**Component**: `src/features/fitness/components/TodayWorkoutCard.tsx`

```
Props Interface:
  planDay: TrainingPlanDay          // Today's plan day data
  sessions: TrainingPlanDay[]       // All sessions for today (multi-session)
  activeSessionId: string           // Currently selected session tab
  completedSessionIds: string[]     // Sessions already done today
  onStartWorkout: () => void        // CTA handler
  onConvertToRest: () => void       // Convert training → rest
  onEditExercises: () => void       // Open PlanDayEditor
  onSelectSession: (id: string) => void
  onAddSession: () => void
  onDeleteSession: (id: string) => void
  isExpanded?: boolean              // Always true for today (not toggleable)
```

**Layout (extract from TPV lines 609-765, KEEP EXACT CLASSES)**:

```
<div data-testid="today-workout-card">
  <!-- SessionTabs (if sessions.length > 1) -->
  <SessionTabs
    sessions={sessions}
    activeSessionId={activeSessionId}
    completedSessionIds={completedSessionIds}
    onSelectSession={onSelectSession}
    onAddSession={onAddSession}
    onDeleteSession={onDeleteSession}
    maxSessions={3}
  />

  <!-- Workout name + muscle groups -->
  <div class="flex items-center gap-2 px-1 py-2">
    <h3 class="text-foreground text-base font-semibold">{workoutName}</h3>
    {modified && <StatusTag variant="warning">{t('fitness.plan.modified')}</StatusTag>}
  </div>

  <!-- Exercise list (collapsible at threshold=3) -->
  <div class="space-y-1">
    {displayedExercises.map(ex => (
      <div class="text-foreground-secondary flex items-center gap-2 py-1 text-sm">
        <span class="text-muted-foreground w-5 text-xs">{index+1}.</span>
        <span class="min-w-0 flex-1 truncate">{ex.nameVi}</span>
        <span class="text-muted-foreground text-xs tabular-nums">
          {ex.sets}×{ex.repsMin}-{ex.repsMax}
        </span>
      </div>
    ))}
    {shouldCollapse && !isExerciseListExpanded && (
      <button class="text-primary min-h-11 text-sm font-medium">
        {t('fitness.plan.showMore', { count: remaining })}
      </button>
    )}
  </div>

  <!-- CTA: Start Workout -->
  <button
    data-testid="btn-start-workout"
    class="bg-primary text-primary-foreground flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-lg font-semibold transition-[colors,transform] active:scale-[0.98] motion-reduce:transform-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
  >
    <Play class="h-5 w-5" />
    {t('fitness.plan.startWorkout')}
  </button>

  <!-- Secondary: Convert to rest (if applicable) -->
  {onConvertToRest && (
    <button
      class="text-muted-foreground flex min-h-11 w-full items-center justify-center gap-2 text-sm transition-colors"
    >
      <Moon class="h-4 w-4" />
      {t('fitness.plan.convertToRest')}
    </button>
  )}
</div>
```

**Accessibility**:

- `role="region"` with `aria-label={t('fitness.plan.todayWorkout')}`
- Start button: `aria-label={t('fitness.plan.startWorkoutFor', { name: workoutName })}`
- Exercise list uses semantic `<ol>` (ordered list)

**Edge Cases**:

- `sessions.length === 0` → Do not render (parent handles)
- `exercises === "[]"` → Show inline EmptyState: "Chưa có bài tập" + "Thêm bài tập" CTA
- 3 sessions, all completed → Start button changes to "Xem tổng kết" (secondary style)

---

### 3.2 US-02: TodayRestCard

**Purpose**: Rest day card with recovery tips and tomorrow preview.

**Component**: `src/features/fitness/components/TodayRestCard.tsx`

```
Props Interface:
  tomorrowPlanDay?: TrainingPlanDay  // Tomorrow's workout preview
  onQuickWeightLog: () => void       // Quick weight entry
  onQuickCardio: () => void          // Quick cardio session
  onConvertToTraining: () => void    // Convert rest → training
```

**Layout (extract from TPV lines 768-836)**:

```
<div data-testid="today-rest-card" class="bg-card rounded-2xl border border-border p-4">
  <!-- Rest icon + message -->
  <div class="flex items-center gap-3">
    <div class="bg-info/10 flex h-12 w-12 items-center justify-center rounded-full">
      <Moon class="text-info h-6 w-6" />
    </div>
    <div>
      <h3 class="text-foreground text-base font-semibold">{t('fitness.plan.restDay')}</h3>
      <p class="text-muted-foreground text-sm">{t('fitness.plan.restDayTip')}</p>
    </div>
  </div>

  <!-- Tomorrow preview (if exists) -->
  {tomorrowPlanDay && (
    <div class="border-border mt-3 border-t pt-3">
      <p class="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {t('fitness.plan.tomorrowPreview')}
      </p>
      <p class="text-foreground mt-1 text-sm font-medium">{tomorrowName}</p>
      <p class="text-muted-foreground text-xs">{exerciseCount} {t('fitness.plan.exercises')}</p>
    </div>
  )}

  <!-- Quick actions -->
  <div class="mt-3 flex gap-2">
    <button
      class="bg-muted text-foreground-secondary flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors active:scale-[0.98] motion-reduce:transform-none"
    >
      <Scale class="h-4 w-4" />
      {t('fitness.plan.logWeight')}
    </button>
    <button
      class="bg-muted text-foreground-secondary flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors active:scale-[0.98] motion-reduce:transform-none"
    >
      <Footprints class="h-4 w-4" />
      {t('fitness.plan.quickCardio')}
    </button>
  </div>
</div>
```

**Accessibility**:

- `role="region"` with `aria-label={t('fitness.plan.restDayRegion')}`
- Quick action buttons: descriptive `aria-label` for each

**Edge Cases**:

- No `tomorrowPlanDay` → Hide preview section entirely
- Consecutive rest days → Show "Ngày nghỉ liên tiếp" instead of tomorrow preview

---

### 3.3 US-03: WeekCalendarStrip

**Purpose**: 7-day week strip showing workout schedule and completion status.

**Component**: `src/features/fitness/components/WeekCalendarStrip.tsx`

```
Props Interface:
  selectedDay: number                // 1-7 (Mon-Sun)
  todayDow: number                   // Today's day of week
  planDays: TrainingPlanDay[]        // All plan days for active plan
  completedDays: Set<number>         // Days with logged workouts this week
  onDaySelect: (day: number) => void
```

**Layout (extract from TPV lines 420-471)**:

```
<div data-testid="week-calendar-strip" class="flex gap-1.5" role="radiogroup" aria-label={t('fitness.plan.weekOverview')}>
  {[1,2,3,4,5,6,7].map(dayNum => {
    const isToday = dayNum === todayDow
    const isSelected = dayNum === selectedDay
    const isCompleted = completedDays.has(dayNum)
    const planDay = planDays.find(d => d.dayOfWeek === dayNum)
    const isRest = !planDay || planDay.workoutType === 'rest'

    return (
      <button
        key={dayNum}
        role="radio"
        aria-checked={isSelected}
        aria-current={isToday ? 'date' : undefined}
        data-testid={`day-pill-${dayNum}`}
        class={cn(
          // Base
          "flex min-h-11 flex-1 flex-col items-center justify-center rounded-xl px-1 py-2 text-xs font-medium transition-colors",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          // Color by state
          isCompleted && "bg-success/10 text-success",
          !isCompleted && !isRest && "bg-primary/10 text-primary",
          isRest && !isCompleted && "bg-muted text-muted-foreground",
          // Ring for today
          isToday && "ring-2 ring-primary",
          // Ring for selected (non-today)
          !isToday && isSelected && "ring-2 ring-ring",
        )}
      >
        <span class="text-[10px] uppercase">{dayLabel}</span>
        {isCompleted ? (
          <Check class="h-3.5 w-3.5" aria-hidden="true" />
        ) : isRest ? (
          <Moon class="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Dumbbell class="h-3.5 w-3.5" aria-hidden="true" />
        )}
      </button>
    )
  })}
</div>
```

**Accessibility**:

- `role="radiogroup"` on container
- `role="radio"` + `aria-checked` on each pill
- `aria-current="date"` on today's pill
- Keyboard: Arrow Left/Right to move between days, Home/End for first/last

**Edge Cases**:

- No active plan → All pills neutral (`bg-muted text-muted-foreground`), no icons, taps do nothing
- Spontaneous workout (no plan day) → `isCompleted` true, green check shown

---

### 3.4 US-04: PlanDayAccordion

**Purpose**: Expandable card for non-today days showing workout details.

**Component**: `src/features/fitness/components/PlanDayAccordion.tsx`

```
Props Interface:
  planDay: TrainingPlanDay
  dayOfWeek: number
  isExpanded: boolean
  isCompleted: boolean
  onToggle: () => void
  onStartWorkout: () => void
  onEditExercises: () => void
```

**Layout (extract from TPV lines 840-973)**:

```
<div data-testid={`plan-day-${dayOfWeek}`} class="bg-card overflow-hidden rounded-xl border border-border">
  <!-- Collapse header -->
  <button
    type="button"
    aria-expanded={isExpanded}
    aria-controls={`plan-day-content-${dayOfWeek}`}
    class="flex w-full items-center justify-between px-4 py-3 text-left transition-all active:scale-[0.98] motion-reduce:transform-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
  >
    <div class="flex items-center gap-3 min-w-0">
      <!-- Day label -->
      <span class="text-muted-foreground text-xs font-medium uppercase">{dayLabel}</span>
      <!-- Workout name -->
      <span class="text-foreground truncate text-sm font-semibold">{workoutName}</span>
      <!-- Completed badge -->
      {isCompleted && (
        <span class="bg-success/10 text-success inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
          <Check class="mr-1 h-3 w-3" /> {t('fitness.plan.completed')}
        </span>
      )}
    </div>
    <ChevronDown class={cn("text-muted-foreground h-4 w-4 shrink-0 transition-transform", isExpanded && "rotate-180")} />
  </button>

  <!-- Expandable content -->
  {isExpanded && (
    <div id={`plan-day-content-${dayOfWeek}`} class="border-t border-border px-4 pb-3 pt-2">
      <!-- Exercise list -->
      <div class="space-y-1">
        {exercises.map((ex, i) => (
          <div class="text-foreground-secondary flex items-center gap-2 py-1 text-sm">
            <span class="text-muted-foreground w-5 text-xs">{i+1}.</span>
            <span class="min-w-0 flex-1 truncate">{ex.nameVi}</span>
            <span class="text-muted-foreground text-xs tabular-nums">{ex.sets}×{ex.repsMin}-{ex.repsMax}</span>
          </div>
        ))}
      </div>

      <!-- Actions -->
      <div class="mt-3 flex gap-2">
        <button
          class="bg-primary text-primary-foreground flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-[colors,transform] active:scale-[0.98] motion-reduce:transform-none"
        >
          <Play class="h-4 w-4" />
          {t('fitness.plan.startWorkout')}
        </button>
        <button
          class="border-border text-foreground-secondary flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors active:scale-[0.98] motion-reduce:transform-none"
          aria-label={t('fitness.plan.editExercises')}
        >
          <Pencil class="h-4 w-4" />
        </button>
      </div>
    </div>
  )}
</div>
```

**Accessibility**:

- Header button: `aria-expanded` + `aria-controls` linking to content
- Content has matching `id`
- Expand/collapse: 200ms transition on chevron rotation

**Edge Cases**:

- 0 exercises → Show inline empty: "Chưa có bài tập" + "Thêm" CTA
- Rest day with logged workout → Show completed badge overlaying rest icon

---

### 3.5 US-05: PlanActionBar

**Purpose**: 3 action buttons for plan management.

**Component**: `src/features/fitness/components/PlanActionBar.tsx`

```
Props Interface:
  onEditSchedule: () => void
  onChangeSplit: () => void
  onBrowseTemplates: () => void
  isDisabled?: boolean              // When plan completed/expired
```

**Layout (extract from TPV lines 473-565)**:

```
<div data-testid="plan-action-bar" class="flex gap-2">
  <button
    class="bg-card border-border text-foreground-secondary flex min-h-11 flex-1 touch-manipulation items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors active:scale-[0.98] motion-reduce:transform-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
    disabled={isDisabled}
  >
    <CalendarDays class="h-4 w-4" />
    {t('fitness.plan.editSchedule')}
  </button>
  <button class="..." disabled={isDisabled}>
    <RefreshCw class="h-4 w-4" />
    {t('fitness.plan.changeSplit')}
  </button>
  <button class="...">
    <BookOpen class="h-4 w-4" />
    {t('fitness.plan.templates')}
  </button>
</div>
```

**Accessibility**:

- `disabled` attribute (not `aria-disabled`) on completed plan buttons
- `disabled:opacity-50` visual feedback

---

### 3.6 US-06: Plan Empty States

**Purpose**: 4 empty state variants using shared `EmptyState` component.

**Variants**:

| Variant          | Condition                                  | EmptyState Props                                                                            |
| ---------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| No plan (auto)   | `!activePlan && planStrategy === 'auto'`   | `variant="hero"`, `icon={Dumbbell}`, title="Sẵn sàng tập luyện", CTA="Tạo kế hoạch AI"      |
| No plan (manual) | `!activePlan && planStrategy === 'manual'` | `variant="hero"`, `icon={CalendarPlus}`, title="Tạo lịch tập thủ công", CTA="Bắt đầu"       |
| No plan (choose) | `!activePlan && planStrategy === null`     | `variant="hero"`, `icon={Target}`, title="Chọn phương pháp", description="AI hoặc tự tạo"   |
| Plan expired     | `activePlan && isPlanExpired()`            | `variant="standard"`, `icon={RefreshCw}`, title="Kế hoạch đã hết hạn", CTA="Tạo chu kỳ mới" |

**CTA Button Pattern** (for all empty states):

```
<button class="bg-primary text-primary-foreground flex min-h-12 items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-[colors,transform] active:scale-[0.98] motion-reduce:transform-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50">
  {isLoading ? <RefreshCw class="h-5 w-5 animate-spin" /> : <Icon class="h-5 w-5" />}
  {label}
</button>
```

---

### 3.7 US-07: TrainingPlanView Orchestrator

**Purpose**: Parent component, ≤250 LOC, composing all 6 extracted components.

**Layout (post-decomposition)**:

```
<div data-testid="training-plan-view" class="flex flex-col gap-4">
  <!-- 1. Empty state (if no plan) -->
  {!activePlan && <PlanEmptyState ... />}

  <!-- 2. Active plan content -->
  {activePlan && (
    <>
      <StreakCounter />                          {/* Existing, unchanged */}
      <EnergyBalanceCard isCollapsible />         {/* Existing, unchanged */}
      <WeekCalendarStrip ... />                   {/* US-03 */}
      <PlanActionBar ... />                       {/* US-05 */}
      {coachingHint && <PlanCoachingHint ... />}  {/* Existing inline */}

      {/* Today's section */}
      {todayIsRest ? (
        <TodayRestCard ... />                     {/* US-02 */}
      ) : (
        <TodayWorkoutCard ... />                  {/* US-01 */}
      )}

      {/* Other days accordion */}
      {otherDays.map(day => (
        <PlanDayAccordion key={day.id} ... />     {/* US-04 */}
      ))}
    </>
  )}
</div>
```

**Rule**: Zero business logic in this file. All calculations happen in children or hooks.

---

## 4. Wave 2 — Today-First Layout

> **Priority**: P1. **Goal**: Redesign plan tab with "Hôm nay tập gì?" hero card as primary element.

### 4.1 US-08: Hero Card — Today's Workout (REDESIGN)

**Purpose**: Prominent hero card answering "Hôm nay tập gì?" within 1 second.

**Component**: Enhance `TodayWorkoutCard` from Wave 1 with hero styling.

**Layout**:

```
<section
  data-testid="today-hero-card"
  class="animate-slide-up bg-gradient-to-br from-primary-subtle to-card rounded-2xl border border-border/60 p-5 shadow-sm"
  aria-label={t('fitness.plan.todayWorkout')}
>
  <!-- Top row: Eyebrow + Status -->
  <div class="mb-3 flex items-center justify-between">
    <span class="text-muted-foreground text-xs font-medium uppercase tracking-wide">
      {t('fitness.plan.todayLabel')}
    </span>
    {isCompleted && (
      <span class="bg-success/10 text-success inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium">
        <Check class="h-3 w-3" /> {t('fitness.plan.completed')}
      </span>
    )}
    {hasMultipleSessions && (
      <span class="bg-primary/10 text-primary text-xs font-medium rounded-full px-2 py-0.5">
        {completedCount}/{totalSessions}
      </span>
    )}
  </div>

  <!-- Workout title + muscle groups -->
  <h2 class="text-foreground text-lg font-bold leading-tight">{workoutName}</h2>
  <div class="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
    <span>{muscleGroups.join(' · ')}</span>
    <span>·</span>
    <span>{exerciseCount} {t('fitness.plan.exercises')}</span>
    <span>·</span>
    <span>~{estimatedDuration} {t('common.minutes')}</span>
  </div>

  <!-- Session tabs (if multi-session) -->
  {sessions.length > 1 && (
    <div class="mt-3">
      <SessionTabs ... />
    </div>
  )}

  <!-- Exercise preview (top 3) -->
  <div class="border-border/60 mt-3 space-y-1 border-t pt-3">
    {previewExercises.map((ex, i) => (
      <div class="text-foreground-secondary flex items-center gap-2 text-sm">
        <span class="text-muted-foreground w-5 text-right text-xs tabular-nums">{i+1}</span>
        <span class="min-w-0 flex-1 truncate">{ex.nameVi}</span>
        <span class="text-muted-foreground text-xs tabular-nums">{ex.sets}×{ex.repsRange}</span>
      </div>
    ))}
    {exerciseCount > 3 && (
      <p class="text-muted-foreground text-xs">+{exerciseCount - 3} {t('fitness.plan.moreExercises')}</p>
    )}
  </div>

  <!-- Primary CTA -->
  <button
    data-testid="btn-start-workout-hero"
    class="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-lg font-semibold text-primary-foreground shadow-sm transition-[colors,transform] active:scale-[0.98] motion-reduce:transform-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
  >
    <Play class="h-5 w-5" />
    {t('fitness.plan.startWorkout')}
  </button>
</section>
```

**Rest Day Hero** (when today is rest):

```
<section
  data-testid="today-hero-rest"
  class="animate-slide-up bg-gradient-to-br from-info/5 to-card rounded-2xl border border-border/60 p-5 shadow-sm"
  aria-label={t('fitness.plan.restDayRegion')}
>
  <div class="flex items-center gap-4">
    <div class="bg-info/10 flex h-14 w-14 items-center justify-center rounded-2xl">
      <Moon class="text-info h-7 w-7" />
    </div>
    <div>
      <span class="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {t('fitness.plan.todayLabel')}
      </span>
      <h2 class="text-foreground text-lg font-bold">{t('fitness.plan.restDay')}</h2>
      <p class="text-muted-foreground text-sm">{t('fitness.plan.restDayTip')}</p>
    </div>
  </div>

  {/* Tomorrow preview */}
  {tomorrowPlanDay && (
    <div class="border-border/60 mt-4 rounded-xl border bg-card/50 p-3">
      <p class="text-muted-foreground text-xs font-medium">{t('fitness.plan.tomorrowPreview')}</p>
      <p class="text-foreground mt-1 text-sm font-semibold">{tomorrowName}</p>
    </div>
  )}

  {/* Quick actions */}
  <div class="mt-4 flex gap-2">
    <button class="bg-muted text-foreground-secondary flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors active:scale-[0.98] motion-reduce:transform-none">
      <Scale class="h-4 w-4" /> {t('fitness.plan.logWeight')}
    </button>
    <button class="bg-muted text-foreground-secondary flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors active:scale-[0.98] motion-reduce:transform-none">
      <Footprints class="h-4 w-4" /> {t('fitness.plan.quickCardio')}
    </button>
  </div>
</section>
```

**Completed Workout Hero** (already done today):

```
Same hero container, but:
- CTA text: "Xem tổng kết" (outline style, not primary)
- Below title: mini stats row: duration + volume + sets
```

```
<div class="mt-2 flex gap-4 text-sm">
  <span class="text-foreground-secondary flex items-center gap-1">
    <Clock class="h-3.5 w-3.5" /> {duration}m
  </span>
  <span class="text-foreground-secondary flex items-center gap-1">
    <Dumbbell class="h-3.5 w-3.5" /> {volume}kg
  </span>
  <span class="text-foreground-secondary flex items-center gap-1">
    <Layers class="h-3.5 w-3.5" /> {totalSets} sets
  </span>
</div>
```

**Animation**:

- `animate-slide-up` (stagger tier 1, delay 0ms)
- `@media (prefers-reduced-motion: reduce)`: instant render, no animation

---

### 4.2 US-09: Week Overview Strip (REDESIGN)

**Purpose**: Enhanced week strip with completion status icons and day preview.

**Component**: Enhance `WeekCalendarStrip` from Wave 1.

**Enhancements over Wave 1**:

```
<div class="animate-slide-up animate-stagger-2" style="--stagger-delay: 30ms">
  <!-- Week strip (same as US-03 but with animation class) -->
  <WeekCalendarStrip ... />

  <!-- Expanded day preview (when day tapped) -->
  {selectedDay !== todayDow && selectedDayData && (
    <div class="animate-fade-in mt-2 rounded-xl border border-border bg-card p-3">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-foreground text-sm font-semibold">{selectedDayWorkoutName}</p>
          <p class="text-muted-foreground text-xs">{exerciseCount} bài tập · {muscleGroups}</p>
        </div>
        <button
          class="bg-primary text-primary-foreground min-h-11 rounded-lg px-4 py-2 text-sm font-medium transition-colors active:scale-[0.98] motion-reduce:transform-none"
        >
          {t('fitness.plan.startWorkout')}
        </button>
      </div>
    </div>
  )}
</div>
```

**Pill Status Icons**:

| Status                    | Icon                   | Color                   | Background              |
| ------------------------- | ---------------------- | ----------------------- | ----------------------- |
| Completed                 | `Check` h-3.5 w-3.5    | `text-success`          | `bg-success/10`         |
| Rest (planned)            | `Moon` h-3.5 w-3.5     | `text-info`             | `bg-muted`              |
| Training (upcoming)       | `Dumbbell` h-3.5 w-3.5 | `text-primary`          | `bg-primary/10`         |
| Today (ring)              | Same as status         | Same                    | + `ring-2 ring-primary` |
| Missed (past, no workout) | `X` h-3.5 w-3.5        | `text-error`            | `bg-error/10`           |
| No plan                   | Circle (empty)         | `text-muted-foreground` | `bg-muted`              |

---

### 4.3 US-10: Compelling Empty States

**5 Empty State Contexts**:

| Context           | variant      | icon                | title (vi)           | description (vi)                         | CTA (vi)                             |
| ----------------- | ------------ | ------------------- | -------------------- | ---------------------------------------- | ------------------------------------ |
| No plan           | `"hero"`     | `Target` h-8 w-8    | "Bắt đầu hành trình" | "Tạo kế hoạch tập luyện phù hợp với bạn" | "Tạo kế hoạch"                       |
| No history        | `"standard"` | `Dumbbell` h-6 w-6  | "Chưa có buổi tập"   | "Hoàn thành buổi tập đầu tiên"           | "Bắt đầu tập" → navigate to plan tab |
| No progress data  | `"standard"` | `BarChart3` h-6 w-6 | "Chưa có dữ liệu"    | "Tập luyện để xem tiến trình"            | "Bắt đầu tập" → navigate to plan tab |
| Empty plan day    | `"compact"`  | `Plus` h-5 w-5      | "Chưa có bài tập"    | —                                        | "Thêm bài tập"                       |
| Search no results | `"compact"`  | `Search` h-5 w-5    | "Không tìm thấy"     | —                                        | "Tạo bài tập mới"                    |

**All empty states**: `animate-fade-in` entrance.

---

## 5. Wave 3 — Workout Logger Speed

> **Priority**: P1-P2. **Goal**: Faster logging with stepper buttons, copy set, auto-fill, rest timer, completion celebration.

### 5.1 US-11: Stepper Button Enhancement

**Purpose**: Large ± buttons for weight/reps with long-press rapid increment.

**Component**: `src/features/fitness/components/StepperInput.tsx` (NEW)

```
Props Interface:
  value: number
  onValueChange: (value: number) => void
  step: number                    // 0.5 for weight, 1 for reps
  min: number                     // 0 for weight, 1 for reps
  max?: number                    // undefined = no cap
  unit?: string                   // "kg" or "rep"
  label: string                   // Accessible label
  warningThreshold?: number       // 300 for weight
  size?: 'default' | 'compact'    // 'default' = 48dp, 'compact' = 44dp
```

**Layout**:

```
<div class="flex items-center gap-2" role="group" aria-label={label}>
  <!-- Minus button -->
  <button
    type="button"
    aria-label={t('common.decrease', { field: label })}
    disabled={value <= min}
    class="flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-border bg-card text-foreground-secondary transition-[colors,transform] active:scale-[0.95] active:bg-muted motion-reduce:transform-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 disabled:active:scale-100"
    onPointerDown={startDecrement}
    onPointerUp={stopIncrement}
    onPointerLeave={stopIncrement}
  >
    <Minus class="h-5 w-5" />
  </button>

  <!-- Value input -->
  <input
    type="text"
    inputMode="decimal"
    value={displayValue}
    onChange={handleDirectInput}
    aria-label={label}
    class="h-12 w-20 rounded-lg border-none bg-muted text-center text-lg font-semibold text-foreground tabular-nums outline-none focus:ring-2 focus:ring-ring"
  />

  <!-- Plus button -->
  <button
    type="button"
    aria-label={t('common.increase', { field: label })}
    class="flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-border bg-card text-foreground-secondary transition-[colors,transform] active:scale-[0.95] active:bg-primary/10 active:text-primary motion-reduce:transform-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    onPointerDown={startIncrement}
    onPointerUp={stopIncrement}
    onPointerLeave={stopIncrement}
  >
    <Plus class="h-5 w-5" />
  </button>

  <!-- Unit label -->
  {unit && <span class="text-muted-foreground text-sm font-medium">{unit}</span>}
</div>
```

**Long-press Behavior**:

- Trigger at ≥500ms hold
- Rapid increment at 150ms intervals
- Visual: Button stays in `:active` state (pressed appearance)

**Warning State** (weight > 300kg):

```
{value > warningThreshold && (
  <p class="text-warning mt-1 flex items-center gap-1 text-xs">
    <AlertTriangle class="h-3 w-3" />
    {t('fitness.logger.highWeightWarning')}
  </p>
)}
```

---

### 5.2 US-12: Copy Previous Set

**Purpose**: One-tap copy from last set or previous session.

**Component**: Inline in `ExerciseWorkoutCard` — add buttons below set input area.

**Layout**:

```
<div class="flex flex-wrap gap-2">
  <!-- Copy last set (current session) -->
  {lastSetThisSession && (
    <button
      data-testid="btn-copy-last-set"
      class="bg-primary/5 text-primary flex min-h-11 items-center gap-2 rounded-xl border border-primary/20 px-3 py-2 text-sm font-medium transition-colors active:scale-[0.98] active:bg-primary/10 motion-reduce:transform-none"
    >
      <Copy class="h-4 w-4" />
      <span>{t('fitness.logger.repeatSet')}: {lastSet.weight}kg × {lastSet.reps}</span>
    </button>
  )}

  <!-- Previous session reference -->
  {lastSessionSet && !lastSetThisSession && (
    <button
      data-testid="btn-copy-prev-session"
      class="bg-muted text-foreground-secondary flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors active:scale-[0.98] motion-reduce:transform-none"
    >
      <History class="h-4 w-4" />
      <span>{t('fitness.logger.prevSession')}: {prevSet.weight}kg × {prevSet.reps}</span>
    </button>
  )}
</div>
```

---

### 5.3 US-13: Progressive Overload Auto-Fill

**Purpose**: Smart suggestion chip for progressive overload.

**Layout (inline in ExerciseWorkoutCard)**:

```
{overloadSuggestion && (
  <button
    data-testid="btn-overload-suggestion"
    class="animate-fade-in bg-energy-subtle text-energy flex min-h-11 items-center gap-2 rounded-xl border border-energy/20 px-3 py-2 text-sm font-medium transition-colors active:scale-[0.98] motion-reduce:transform-none"
    onClick={() => onApplyOverload(overloadSuggestion)}
  >
    <TrendingUp class="h-4 w-4" />
    <span>
      {suggestion.source === 'weight_increase'
        ? t('fitness.logger.suggestWeight', { weight: suggestion.weight })
        : t('fitness.logger.suggestReps', { reps: suggestion.reps })}
    </span>
  </button>
)}

{plateauWarning && (
  <div class="bg-warning/10 text-warning flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
    <AlertTriangle class="h-3.5 w-3.5 shrink-0" />
    {t('fitness.logger.plateauWarning')}
  </div>
)}
```

---

### 5.4 US-14: Rest Timer Enhancement

**Purpose**: Full-screen animated ring timer with +30s/Skip.

**Component**: Enhance existing `src/features/fitness/components/RestTimer.tsx`

**Layout**:

```
<div
  role="alertdialog"
  aria-modal="true"
  aria-label={t('fitness.restTimer.title')}
  class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
>
  <div class="bg-card mx-4 flex w-full max-w-sm flex-col items-center rounded-2xl p-8 shadow-xl">
    <!-- Header -->
    <div class="mb-4 flex items-center gap-2">
      <Timer class="text-primary h-5 w-5" />
      <h2 class="text-foreground text-section font-semibold">{t('fitness.restTimer.title')}</h2>
    </div>

    <!-- SVG Ring Timer (≥200px diameter) -->
    <div class="relative mb-6 flex items-center justify-center">
      <svg
        width="200" height="200"
        viewBox="0 0 200 200"
        class="drop-shadow-sm"
        aria-hidden="true"
      >
        <!-- Background ring -->
        <circle
          cx="100" cy="100" r="90"
          fill="none"
          stroke="var(--color-muted)"
          stroke-width="8"
        />
        <!-- Progress ring -->
        <circle
          cx="100" cy="100" r="90"
          fill="none"
          stroke="var(--color-primary)"
          stroke-width="8"
          stroke-linecap="round"
          stroke-dasharray={circumference}
          stroke-dashoffset={progressOffset}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            transition: 'stroke-dashoffset 1s linear'
          }}
          class="motion-reduce:[transition:none]"
        />
      </svg>
      <!-- Time display (centered over SVG) -->
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-foreground text-stat-big font-bold tabular-nums">
          {formatMM_SS(remainingSeconds)}
        </span>
        <span class="text-muted-foreground text-xs">{t('fitness.restTimer.remaining')}</span>
      </div>
    </div>

    <!-- Screen reader progress -->
    <progress
      class="sr-only"
      value={elapsed}
      max={total}
      aria-label={t('fitness.restTimer.progress')}
      aria-valuenow={elapsed}
      aria-valuemin={0}
      aria-valuemax={total}
    />

    <!-- Action buttons -->
    <div class="flex w-full gap-3">
      <button
        data-testid="btn-rest-add-time"
        class="bg-muted text-foreground-secondary flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors active:scale-[0.98] motion-reduce:transform-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label={t('fitness.restTimer.addTime')}
      >
        <Plus class="h-4 w-4" />
        +30s
      </button>
      <button
        data-testid="btn-rest-skip"
        class="bg-primary text-primary-foreground flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors active:scale-[0.98] motion-reduce:transform-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label={t('fitness.restTimer.skip')}
      >
        <SkipForward class="h-4 w-4" />
        {t('fitness.restTimer.skip')}
      </button>
    </div>
  </div>
</div>
```

**Animation**:

- Ring: CSS `transition: stroke-dashoffset 1s linear` (smooth per-second)
- `@media (prefers-reduced-motion: reduce)`: Ring static, countdown still ticks

---

### 5.5 US-15: Workout Completion Celebration

**Purpose**: Summary card with stats, PRs, streak update after completing workout.

**Component**: `src/features/fitness/components/WorkoutCompletionCard.tsx` (NEW)

```
Props Interface:
  duration: number              // minutes
  totalVolume: number           // kg
  totalSets: number
  exerciseCount: number
  prs: PR[]                     // Detected PRs
  streakCount: number           // Updated streak
  streakMilestone?: number      // 7, 14, 30, etc.
  isFirstWorkout: boolean
  onSave: () => void
  onDiscard: () => void
```

**Layout**:

```
<div class="animate-scale-in mx-auto max-w-sm space-y-4 p-4">
  <!-- Trophy / checkmark icon -->
  <div class="flex flex-col items-center text-center">
    <div class="bg-success/10 mb-3 flex h-16 w-16 items-center justify-center rounded-full">
      <Trophy class="text-success h-8 w-8" />
    </div>
    <h2 class="text-foreground text-page font-bold">{t('fitness.logger.workoutComplete')}</h2>
    {isFirstWorkout && (
      <p class="text-muted-foreground mt-1 text-sm">{t('fitness.logger.firstWorkoutMessage')}</p>
    )}
  </div>

  <!-- Stats grid (2×2) -->
  <div class="grid grid-cols-2 gap-3">
    <StatCard icon={Clock} label={t('fitness.stats.duration')} value={`${duration}m`} />
    <StatCard icon={Dumbbell} label={t('fitness.stats.volume')} value={totalVolume > 0 ? `${totalVolume}kg` : '—'} />
    <StatCard icon={Layers} label={t('fitness.stats.sets')} value={totalSets} />
    <StatCard icon={ListChecks} label={t('fitness.stats.exercises')} value={exerciseCount} />
  </div>

  <!-- PRs section -->
  {prs.length > 0 && (
    <div class="rounded-xl border border-energy/20 bg-energy-subtle p-3">
      <div class="mb-2 flex items-center gap-2">
        <Star class="text-energy h-4 w-4" />
        <span class="text-energy text-sm font-semibold">{t('fitness.logger.newPRs')}</span>
      </div>
      {prs.map(pr => (
        <div class="text-foreground-secondary flex items-center justify-between py-1 text-sm">
          <span class="truncate">{pr.exerciseName}</span>
          <span class="text-energy font-medium tabular-nums">+{pr.improvement}kg @ {pr.reps}rep</span>
        </div>
      ))}
    </div>
  )}

  <!-- Streak milestone -->
  {streakMilestone && (
    <div class="bg-rose-50 border-rose/20 animate-scale-in rounded-xl border p-3 text-center">
      <span class="text-stat-med">🏆</span>
      <p class="text-rose text-sm font-semibold">
        {t('fitness.streak.milestone', { count: streakMilestone })}
      </p>
    </div>
  )}

  <!-- Actions -->
  <button
    data-testid="btn-save-workout"
    class="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-lg font-semibold text-primary-foreground transition-[colors,transform] active:scale-[0.98] motion-reduce:transform-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
  >
    <Save class="h-5 w-5" />
    {t('fitness.logger.saveAndClose')}
  </button>
</div>
```

**StatCard sub-component**:

```
<div class="bg-card rounded-xl border border-border p-3 text-center">
  <Icon class="text-muted-foreground mx-auto h-4 w-4" />
  <p class="text-foreground mt-1 text-lg font-bold tabular-nums">{value}</p>
  <p class="text-muted-foreground text-xs">{label}</p>
</div>
```

**Edge Case — 0 sets**:

```
<div class="text-center">
  <p class="text-muted-foreground">{t('fitness.logger.emptyWorkout')}</p>
  <button class="text-destructive min-h-11 text-sm font-medium">
    {t('fitness.logger.discardEmpty')}
  </button>
</div>
```

---

## 6. Wave 4 — Progress & History

> **Priority**: P2. **Goal**: Volume trends, PR tracking, enhanced history.

### 6.1 US-16: Volume Trend Chart

**Purpose**: Weekly total volume trend over 8 weeks.

**Component**: `src/features/fitness/components/VolumeTrendChart.tsx` (NEW)

**Layout**:

```
<div data-testid="volume-trend-chart" class="bg-card rounded-2xl border border-border p-4">
  <!-- Header -->
  <div class="mb-3 flex items-center justify-between">
    <h3 class="text-foreground text-section font-semibold">{t('fitness.progress.volumeTrend')}</h3>
    <div class="flex items-center gap-1 text-sm">
      {trendPercent > 0 ? (
        <span class="text-success flex items-center gap-0.5">
          <TrendingUp class="h-3.5 w-3.5" /> +{trendPercent}%
        </span>
      ) : trendPercent < 0 ? (
        <span class="text-error flex items-center gap-0.5">
          <TrendingDown class="h-3.5 w-3.5" /> {trendPercent}%
        </span>
      ) : (
        <span class="text-muted-foreground flex items-center gap-0.5">
          <ArrowRight class="h-3.5 w-3.5" /> {t('fitness.progress.stable')}
        </span>
      )}
    </div>
  </div>

  <!-- Bar chart (pure CSS, no library) -->
  <div class="flex h-40 items-end gap-1" role="img" aria-label={t('fitness.progress.volumeChartAria')}>
    {weeks.map((week, i) => {
      const heightPct = maxVolume > 0 ? (week.volume / maxVolume) * 100 : 0
      const isCurrent = i === weeks.length - 1
      return (
        <div key={i} class="flex flex-1 flex-col items-center gap-1">
          <!-- Bar -->
          <div
            class={cn(
              "w-full rounded-t-md transition-all duration-300",
              isCurrent ? "bg-primary" : "bg-primary/30",
            )}
            style={{ height: `${Math.max(heightPct, 2)}%` }}
            aria-hidden="true"
          />
          <!-- Label -->
          <span class={cn(
            "text-[10px] tabular-nums",
            isCurrent ? "text-primary font-semibold" : "text-muted-foreground"
          )}>
            W{week.weekNumber}
          </span>
        </div>
      )
    })}
  </div>

  <!-- Y-axis label -->
  <p class="text-muted-foreground mt-2 text-center text-xs">
    {t('fitness.progress.volumeUnit')}
  </p>
</div>
```

**Responsive**: Chart uses `flex-1` children — auto-scales to any width (360-428px). No horizontal scroll.

**Edge Cases**:

- <8 weeks → Show available bars, rest empty (no phantom bars)
- Week with 0 → Bar height 2% (visible dot)
- Large numbers (>99,999) → Format as "102.4K"

---

### 6.2 US-17: Personal Records Display

**Component**: `src/features/fitness/components/PersonalRecords.tsx` (NEW)

**Layout**:

```
<div data-testid="personal-records" class="bg-card rounded-2xl border border-border p-4">
  <div class="mb-3 flex items-center gap-2">
    <Star class="text-energy h-5 w-5" />
    <h3 class="text-foreground text-section font-semibold">{t('fitness.progress.personalRecords')}</h3>
  </div>

  <div class="space-y-2">
    {prs.map(pr => (
      <button
        key={pr.exerciseId}
        aria-expanded={expandedId === pr.exerciseId}
        class="w-full rounded-xl border border-border px-3 py-2.5 text-left transition-all active:scale-[0.98] motion-reduce:transform-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <div class="flex items-center justify-between">
          <div class="min-w-0 flex-1">
            <p class="text-foreground truncate text-sm font-semibold">{pr.exerciseName}</p>
            <p class="text-muted-foreground text-xs">
              {pr.bestWeight}kg × {pr.reps}rep · {formatRelativeDate(pr.date)}
            </p>
          </div>
          <ChevronDown class={cn("text-muted-foreground h-4 w-4 transition-transform", expandedId === pr.exerciseId && "rotate-180")} />
        </div>

        {/* Expanded progression history */}
        {expandedId === pr.exerciseId && (
          <div class="border-border mt-2 space-y-1 border-t pt-2">
            {pr.history.map(h => (
              <div class="text-muted-foreground flex justify-between text-xs">
                <span>{formatDate(h.date)}</span>
                <span class="tabular-nums">{h.weight}kg × {h.reps}</span>
              </div>
            ))}
          </div>
        )}
      </button>
    ))}
  </div>

  {prs.length === 0 && (
    <EmptyState
      variant="compact"
      icon={Star}
      title={t('fitness.progress.noPRs')}
      description={t('fitness.progress.noPRsDesc')}
    />
  )}
</div>
```

---

### 6.3 US-18: Workout History — Week Grouping

**Enhancement to existing `WorkoutHistory.tsx`**.

**Week Header (sticky)**:

```
<div class="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-1 py-2">
  <div class="flex items-center justify-between">
    <h3 class="text-foreground text-sm font-semibold">
      {t('fitness.history.week', { n: weekNumber })}
    </h3>
    <span class="text-muted-foreground text-xs">
      {dateRange} · {workoutCount} {t('fitness.history.workouts')}
    </span>
  </div>
</div>
```

**PR Badge on Exercise** (inline):

```
{hasPR && (
  <span class="bg-energy-subtle text-energy ml-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium">
    <Star class="h-2.5 w-2.5" /> PR
  </span>
)}
```

---

### 6.4 US-19: Clone Workout

**Addition to each history card**:

```
<button
  data-testid={`btn-clone-workout-${workout.id}`}
  class="text-primary flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors active:scale-[0.98] motion-reduce:transform-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
  aria-label={t('fitness.history.cloneWorkout')}
>
  <Copy class="h-4 w-4" />
</button>
```

**Placement**: In the workout card header row, right-aligned before the expand chevron.

---

## 7. Wave 5 — Polish & Integration

> **Priority**: P2-P3. **Goal**: Visual polish, accessibility audit, animations.

### 7.1 US-20: Streak Counter Redesign

**Component**: Enhance existing `StreakCounter.tsx`.

**State Machine**:

| State       | Condition                   | Render                                   |
| ----------- | --------------------------- | ---------------------------------------- |
| Hidden      | `streak === 0`              | Nothing (no DOM)                         |
| Flame (1-6) | `streak >= 1 && streak < 7` | Flame icon + count + encouraging message |
| Trophy (7+) | `streak >= 7`               | Trophy icon + count + milestone message  |
| At Risk     | `streakAtRisk === true`     | Warning badge overlay                    |

**Layout (flame state, 1-6)**:

```
<div
  data-testid="streak-counter"
  class="animate-slide-up animate-stagger-3 bg-card rounded-2xl border border-border p-4 shadow-sm"
>
  <div class="flex items-center gap-3">
    <div class="bg-energy-subtle flex h-10 w-10 items-center justify-center rounded-full">
      <Flame class="text-energy h-5 w-5" />
    </div>
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <span class="text-foreground text-stat-med font-bold tabular-nums">{streak}</span>
        <span class="text-foreground-secondary text-sm font-medium">{t('fitness.streak.days')}</span>
        {streakAtRisk && (
          <span class="bg-warning/10 text-warning rounded-full px-2 py-0.5 text-xs font-medium">
            {t('fitness.streak.atRisk')}
          </span>
        )}
      </div>
      <p class="text-muted-foreground text-xs">{encouragementMessage}</p>
    </div>
  </div>

  <!-- Week dots (7 days) -->
  <div class="mt-3 flex justify-between" role="img" aria-label={t('fitness.streak.weekView')}>
    {weekDots.map((dot, i) => (
      <div key={i} class="flex flex-col items-center gap-1">
        <div class={cn(
          "h-2.5 w-2.5 rounded-full",
          dot === 'completed' && "bg-success",
          dot === 'rest' && "bg-info",
          dot === 'today' && "bg-primary ring-2 ring-primary/30",
          dot === 'missed' && "bg-error",
          dot === 'upcoming' && "bg-muted",
        )} />
        <span class="text-muted-foreground text-[10px]">{dayLabel}</span>
      </div>
    ))}
  </div>
</div>
```

**Trophy state (7+)**: Same layout but:

- Icon: `Trophy` instead of `Flame`
- Background: `bg-rose-50` instead of `bg-energy-subtle`
- Color: `text-rose` instead of `text-energy`

**First workout (0→1)**: Entrance with `animate-scale-in`.

---

### 7.2 US-21: Exercise Selector Enhancement

**Enhancement to existing `ExerciseSelector.tsx`**.

**Recently Used Section** (new, above main list):

```
{recentlyUsed.length > 0 && (
  <div class="border-border border-b px-4 pb-3">
    <p class="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
      {t('fitness.exerciseSelector.recentlyUsed')}
    </p>
    <div class="space-y-0.5">
      {recentlyUsed.slice(0, 5).map(ex => (
        <button
          key={ex.id}
          data-testid={`recent-exercise-${ex.id}`}
          class="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors active:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Clock class="text-muted-foreground h-4 w-4 shrink-0" />
          <div class="min-w-0 flex-1">
            <p class="text-foreground truncate text-sm font-medium">{ex.nameVi}</p>
            <p class="text-muted-foreground text-xs">{ex.muscleGroup} · {ex.equipment}</p>
          </div>
        </button>
      ))}
    </div>
  </div>
)}
```

**Persistence**: Store recently used exercise IDs in `localStorage('fitness-recent-exercises')`.

---

### 7.3 US-22: Touch Target Compliance Audit

**Violations to Fix**:

| Component             | Element            | Current            | Fix                        |
| --------------------- | ------------------ | ------------------ | -------------------------- |
| RPE buttons           | Circular buttons   | `h-11 w-11` (44px) | `h-12 w-12` (48px)         |
| Edit/Delete icons     | Small icon buttons | `h-8 w-8` (32px)   | `min-h-11 min-w-11` (44px) |
| Exercise list items   | Row buttons        | `py-3` only        | Add `min-h-12`             |
| Dismiss coaching hint | X button           | `h-8 w-8`          | `min-h-11 min-w-11`        |

**Universal Rule**: Add to ALL existing buttons/interactive:

```
active:scale-[0.98] motion-reduce:transform-none
```

---

### 7.4 US-24: Stagger Animation System

**Animation Tier Assignments**:

| Component        | Tier | Delay | Class                                |
| ---------------- | ---- | ----- | ------------------------------------ |
| Hero Card        | 1    | 0ms   | `animate-slide-up`                   |
| Week Strip       | 2    | 30ms  | `animate-slide-up animate-stagger-2` |
| Streak Counter   | 3    | 60ms  | `animate-slide-up animate-stagger-3` |
| First Accordion  | 4    | 90ms  | `animate-slide-up animate-stagger-4` |
| Second Accordion | 5    | 120ms | `animate-slide-up animate-stagger-5` |

**Tab Switch**: Animations replay on remount (React conditional rendering).

---

### 7.5 US-25: Workout Draft Auto-Recovery

**Resume Prompt** (shown when draft exists on tab open):

```
<div class="animate-fade-in bg-warning/10 border-warning/20 rounded-xl border p-4">
  <div class="flex items-center gap-3">
    <div class="bg-warning/20 flex h-10 w-10 items-center justify-center rounded-full">
      <AlertCircle class="text-warning h-5 w-5" />
    </div>
    <div class="min-w-0 flex-1">
      <p class="text-foreground text-sm font-semibold">{t('fitness.draft.resumeTitle')}</p>
      <p class="text-muted-foreground text-xs">
        {t('fitness.draft.resumeDesc', { exercises: draft.exercises.length, sets: draft.sets.length })}
      </p>
    </div>
  </div>
  <div class="mt-3 flex gap-2">
    <button class="bg-primary text-primary-foreground flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold active:scale-[0.98] motion-reduce:transform-none">
      {t('fitness.draft.continue')}
    </button>
    <button class="bg-muted text-foreground-secondary flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium active:scale-[0.98] motion-reduce:transform-none">
      {t('fitness.draft.discard')}
    </button>
  </div>
</div>
```

---

### 7.6 US-28: Set Editor Modal Redesign

**Layout (bottom sheet pattern)**:

```
<ModalBackdrop
  onClose={onCancel}
  mobileLayout="sheet"
  allowSwipeToDismiss
>
  <div class="w-full space-y-4 p-4">
    <div class="flex items-center justify-between">
      <h3 class="text-foreground text-section font-semibold">{t('fitness.logger.editSet')}</h3>
      <CloseButton onClick={onCancel} />
    </div>

    <!-- Weight stepper -->
    <div>
      <label class="text-muted-foreground mb-1 block text-xs font-medium uppercase tracking-wide">
        {t('fitness.logger.weight')}
      </label>
      <StepperInput
        value={weight}
        onValueChange={setWeight}
        step={0.5}
        min={0}
        unit="kg"
        label={t('fitness.logger.weight')}
      />
    </div>

    <!-- Reps stepper -->
    <div>
      <label class="text-muted-foreground mb-1 block text-xs font-medium uppercase tracking-wide">
        {t('fitness.logger.reps')}
      </label>
      <StepperInput
        value={reps}
        onValueChange={setReps}
        step={1}
        min={1}
        label={t('fitness.logger.reps')}
      />
    </div>

    <!-- Recent weights chips -->
    {recentWeights.length > 0 && (
      <div>
        <label class="text-muted-foreground mb-1 block text-xs font-medium uppercase tracking-wide">
          {t('fitness.logger.recentWeights')}
        </label>
        <div class="flex flex-wrap gap-2">
          {recentWeights.map(w => (
            <button
              key={w}
              class={cn(
                "min-h-11 rounded-full px-3 py-2 text-sm font-medium transition-colors active:scale-[0.98] motion-reduce:transform-none",
                w === weight
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground-secondary"
              )}
            >
              {w}kg
            </button>
          ))}
        </div>
      </div>
    )}

    <!-- RPE selector -->
    <div>
      <label class="text-muted-foreground mb-1 block text-xs font-medium uppercase tracking-wide">
        RPE
      </label>
      <div class="flex gap-2">
        {[6, 7, 8, 9, 10].map(rpe => (
          <button
            key={rpe}
            class={cn(
              "flex min-h-12 min-w-12 items-center justify-center rounded-xl text-sm font-semibold transition-colors active:scale-[0.98] motion-reduce:transform-none",
              selectedRpe === rpe
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground-secondary"
            )}
          >
            {rpe}
          </button>
        ))}
      </div>
    </div>

    <!-- Save button -->
    <button
      class="flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-[colors,transform] active:scale-[0.98] motion-reduce:transform-none"
    >
      {t('common.save')}
    </button>
  </div>
</ModalBackdrop>
```

---

## 8. Cross-Cutting Concerns

### 8.1 Error States

**Network Error** (rare — offline-first app):

```
<div class="bg-error/10 border-error/20 flex items-center gap-3 rounded-xl border p-3">
  <AlertCircle class="text-error h-5 w-5 shrink-0" />
  <div class="min-w-0 flex-1">
    <p class="text-foreground text-sm font-medium">{t('common.error')}</p>
    <p class="text-muted-foreground text-xs">{errorMessage}</p>
  </div>
  <button class="text-error min-h-11 text-sm font-medium">{t('common.retry')}</button>
</div>
```

**Save Failure** (workout save atomic transaction failed):

```
Same pattern as network error, but:
- CTA: "Thử lại" (retry save)
- Secondary: "Lưu nháp" (save draft)
```

### 8.2 Loading States

**Plan Generation**:

```
<button disabled class="opacity-50 ...">
  <RefreshCw class="h-5 w-5 animate-spin" />
  {t('fitness.plan.generating')}
</button>
```

**Workout Save**:

```
<button disabled class="opacity-50 ...">
  <Loader2 class="h-5 w-5 animate-spin" />
  {t('fitness.logger.saving')}
</button>
```

**Skeleton (initial load)**:

```
import { Skeleton } from '@/components/ui/skeleton'

<div class="space-y-3">
  <Skeleton class="h-40 rounded-2xl" />  {/* Hero card */}
  <Skeleton class="h-12 rounded-xl" />   {/* Week strip */}
  <Skeleton class="h-20 rounded-xl" />   {/* Streak */}
</div>
```

### 8.3 Responsive Behavior (360px → 428px)

| Component          | 360px                 | 428px                 |
| ------------------ | --------------------- | --------------------- |
| Hero card          | Full width, `p-4`     | Full width, `p-5`     |
| Week pills         | `flex-1` (each ~47px) | `flex-1` (each ~57px) |
| Action bar buttons | Text may wrap         | Single line           |
| Stats grid         | `grid-cols-2`         | `grid-cols-2`         |
| Volume bars        | 8 bars × ~40px each   | 8 bars × ~49px each   |

**No breakpoint changes needed** — `flex-1` and `min-w-0 truncate` handle all widths.

### 8.4 Keyboard Navigation Map

| Context      | Key         | Action                             |
| ------------ | ----------- | ---------------------------------- |
| Week strip   | ←/→         | Move between day pills             |
| Week strip   | Home/End    | First/last day                     |
| Accordion    | Enter/Space | Toggle expand                      |
| Modal/Sheet  | Escape      | Close                              |
| Tab bar      | 1/2/3       | Switch tab (plan/progress/history) |
| Stepper      | ←/→         | Decrement/Increment                |
| RPE selector | ←/→         | Move between RPE values            |

### 8.5 ARIA Landmark Structure

```
<div role="tabpanel" id="tabpanel-plan" aria-labelledby="tab-plan">
  <section aria-label="Buổi tập hôm nay">     <!-- Hero card -->
  <div role="radiogroup" aria-label="Tuần">     <!-- Week strip -->
  <section aria-label="Chuỗi tập luyện">       <!-- Streak -->
  <div role="list" aria-label="Lịch tập tuần">  <!-- Day accordions -->
    <div role="listitem">                        <!-- Each day -->
</div>
```

### 8.6 i18n Keys Required (NEW)

```json
{
  "fitness": {
    "plan": {
      "todayLabel": "Hôm nay",
      "tomorrowPreview": "Ngày mai",
      "moreExercises": "bài tập nữa",
      "weekOverview": "Tổng quan tuần"
    },
    "logger": {
      "repeatSet": "Lặp lại",
      "prevSession": "Buổi trước",
      "suggestWeight": "Tăng lên {{weight}}kg",
      "suggestReps": "Tăng lên {{reps}} rep",
      "plateauWarning": "Plateau — thử giảm reps hoặc đổi bài tập",
      "highWeightWarning": "Cân nặng cao bất thường",
      "workoutComplete": "Hoàn thành!",
      "firstWorkoutMessage": "Buổi đầu tiên — lần sau sẽ so sánh!",
      "newPRs": "Kỷ lục mới",
      "saveAndClose": "Lưu & đóng",
      "emptyWorkout": "Buổi tập trống — không lưu",
      "discardEmpty": "Hủy buổi tập",
      "editSet": "Chỉnh sửa set",
      "weight": "Cân nặng",
      "reps": "Số rep",
      "recentWeights": "Gần đây",
      "saving": "Đang lưu..."
    },
    "stats": {
      "duration": "Thời gian",
      "volume": "Khối lượng",
      "sets": "Số set",
      "exercises": "Bài tập"
    },
    "streak": {
      "days": "ngày liên tiếp",
      "atRisk": "Sắp mất!",
      "weekView": "7 ngày gần đây",
      "milestone": "{{count}} ngày liên tiếp!"
    },
    "progress": {
      "volumeTrend": "Xu hướng khối lượng",
      "stable": "Ổn định",
      "volumeUnit": "Tổng khối lượng (kg)",
      "volumeChartAria": "Biểu đồ khối lượng tập luyện 8 tuần",
      "personalRecords": "Kỷ lục cá nhân",
      "noPRs": "Chưa có kỷ lục",
      "noPRsDesc": "Tập luyện để lập kỷ lục đầu tiên"
    },
    "history": {
      "week": "Tuần {{n}}",
      "workouts": "buổi tập",
      "cloneWorkout": "Tập lại buổi này"
    },
    "draft": {
      "resumeTitle": "Buổi tập chưa hoàn thành",
      "resumeDesc": "{{exercises}} bài tập, {{sets}} set đã ghi",
      "continue": "Tiếp tục",
      "discard": "Hủy"
    },
    "exerciseSelector": {
      "recentlyUsed": "Gần đây"
    },
    "restTimer": {
      "title": "Nghỉ giữa set",
      "remaining": "còn lại",
      "addTime": "Thêm 30 giây",
      "skip": "Bỏ qua",
      "progress": "Tiến trình nghỉ"
    }
  },
  "common": {
    "decrease": "Giảm {{field}}",
    "increase": "Tăng {{field}}",
    "minutes": "phút",
    "error": "Có lỗi xảy ra",
    "retry": "Thử lại"
  }
}
```

---

## 9. Component Inventory

### 9.1 New Components to Create

| Component               | File                                                    | LOC Target | Wave |
| ----------------------- | ------------------------------------------------------- | ---------- | ---- |
| `TodayWorkoutCard`      | `features/fitness/components/TodayWorkoutCard.tsx`      | ≤250       | W1   |
| `TodayRestCard`         | `features/fitness/components/TodayRestCard.tsx`         | ≤150       | W1   |
| `WeekCalendarStrip`     | `features/fitness/components/WeekCalendarStrip.tsx`     | ≤200       | W1   |
| `PlanDayAccordion`      | `features/fitness/components/PlanDayAccordion.tsx`      | ≤250       | W1   |
| `PlanActionBar`         | `features/fitness/components/PlanActionBar.tsx`         | ≤200       | W1   |
| `StepperInput`          | `features/fitness/components/StepperInput.tsx`          | ≤150       | W3   |
| `WorkoutCompletionCard` | `features/fitness/components/WorkoutCompletionCard.tsx` | ≤200       | W3   |
| `VolumeTrendChart`      | `features/fitness/components/VolumeTrendChart.tsx`      | ≤200       | W4   |
| `PersonalRecords`       | `features/fitness/components/PersonalRecords.tsx`       | ≤200       | W4   |

### 9.2 Existing Components to Enhance

| Component             | Enhancement                                     | Wave |
| --------------------- | ----------------------------------------------- | ---- |
| `TrainingPlanView`    | Decompose to ≤250 LOC orchestrator              | W1   |
| `RestTimer`           | Ring animation, +30s button, a11y               | W3   |
| `StreakCounter`       | State machine (hidden/flame/trophy/risk)        | W5   |
| `ExerciseSelector`    | Recently used section                           | W5   |
| `WorkoutHistory`      | Week grouping, sticky headers, PR badges, clone | W4   |
| `ExerciseWorkoutCard` | Copy set, overload chip, stepper buttons        | W3   |
| `SetEditor`           | Bottom sheet, stepper inputs, recent weights    | W5   |

### 9.3 Shared Components to Reuse (NO new creation needed)

| Use Case            | Component                | Props                                                                |
| ------------------- | ------------------------ | -------------------------------------------------------------------- |
| All empty states    | `EmptyState`             | `variant`, `icon`, `title`, `description`, `actionLabel`, `onAction` |
| Set Editor modal    | `ModalBackdrop`          | `mobileLayout="sheet"`, `allowSwipeToDismiss`                        |
| Streak status       | `StatusTag`              | `variant="warning"` for "at risk"                                    |
| Plan tab bar        | `SubTabBar`              | Already in use                                                       |
| Modal close buttons | `CloseButton`            | `variant="default"`                                                  |
| Profile sync banner | `ShellOrientationBanner` | `eyebrow`, `title`, `actionLabel`                                    |

### 9.4 Data Flow Summary

```
┌─────────────────────────────────────────────────┐
│              useFitnessStore (Zustand)           │
│                                                  │
│  trainingPlans → activePlan → planDays           │
│  workouts → workoutSets → completedDays          │
│  workoutDraft (auto-save)                        │
│  weightEntries                                   │
└────────┬──────────────┬──────────────┬───────────┘
         │              │              │
    ┌────▼────┐   ┌─────▼─────┐  ┌────▼─────┐
    │Plan Tab │   │History Tab│  │Progress  │
    │         │   │           │  │Tab       │
    │ Hero    │   │ WeekGroup │  │ Volume   │
    │ Week    │   │ PR Badges │  │ PRs      │
    │ Streak  │   │ Clone     │  │ Metrics  │
    │ Days    │   │ Delete    │  │          │
    └────┬────┘   └───────────┘  └──────────┘
         │
    ┌────▼────────────────┐
    │  WorkoutLogger      │
    │  (PageStack Overlay) │
    │                      │
    │  StepperInput        │
    │  CopySet / Overload  │
    │  RestTimer           │
    │  CompletionCard      │
    │  DraftAutoSave       │
    └──────────────────────┘
```

---

## Design Checklist (for Dev implementation)

- [ ] **Touch**: ALL interactive ≥48dp (`min-h-12`) or ≥44dp + 8dp gap
- [ ] **Press**: ALL tappable have `active:scale-[0.98] motion-reduce:transform-none`
- [ ] **Focus**: ALL interactive have `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none`
- [ ] **Color**: ONLY semantic tokens (no `blue-500`, `red-600`, etc.)
- [ ] **Text**: ALL via `t()` i18n — no hardcoded Vietnamese
- [ ] **Empty**: Every list/section has empty state via `<EmptyState />`
- [ ] **Loading**: Every async action shows spinner/skeleton
- [ ] **Error**: Every save/fetch has error handling UI
- [ ] **Animation**: Every entrance has `animate-slide-up` or `animate-fade-in`
- [ ] **Motion**: Every animation respects `prefers-reduced-motion: reduce`
- [ ] **ARIA**: Every region has `aria-label`, every toggle has `aria-expanded`
- [ ] **Keyboard**: Escape closes modals, Arrow keys navigate lists
- [ ] **Responsive**: No horizontal scroll at 360px
- [ ] **Performance**: Hero render ≤100ms, Logger interaction <50ms

---

**Status: DESIGN_READY**

> This spec provides exact Tailwind classes, exact component names, exact semantic tokens, and exact props interfaces for every component across all 5 waves. Dev can implement directly from this document without design ambiguity.
