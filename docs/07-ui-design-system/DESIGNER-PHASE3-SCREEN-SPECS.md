# [DESIGNER] Phase 3: Screen-by-Screen Design Specifications

> **Trạng thái: DESIGN_READY**
> **Version**: 1.0
> **Date**: 2026-07-14
> **Author**: Designer (UI/UX Expert) Agent
> **Input**: BM Phase 3 Deliverable (31 US, 57 BR, 67 EC, 10 GCR), Phase 1 Tokens, Phase 2 Components, Current Codebase Audit
> **Target viewport**: 360–428px width (Capacitor Android WebView)

---

## Table of Contents

- [Global Design Decisions](#global-design-decisions)
- [TASK-08 Spec: Compact Form Archetype](#task-08-spec-compact-form-archetype)
- [TASK-09 Spec: Large Workflow Overlay](#task-09-spec-large-workflow-overlay)
- [Animation Choreography](#animation-choreography)
- [Empty State Variants](#empty-state-variants)
- [3.1 Dashboard](#31-dashboard)
- [3.2 Calendar + Meals](#32-calendar--meals)
- [3.3 Library](#33-library)
- [3.4 Onboarding](#34-onboarding)
- [3.5 Settings](#35-settings)
- [3.6 Fitness](#36-fitness)
- [3.7 AI Analysis](#37-ai-analysis)
- [3.8 Polish — Global Motion & Skeleton](#38-polish--global-motion--skeleton)

---

## Global Design Decisions

### Information Density Model (Q2=B — Balanced)

Reference: MyFitnessPal home screen density. Key principle: **Primary metrics always visible, secondary metrics one tap away.**

| Tier      | Visible                            | Expandable (1 tap)         | Hidden (2+ taps)           |
| --------- | ---------------------------------- | -------------------------- | -------------------------- |
| Nutrition | Calories eaten/target, Protein g   | Fat/Carbs/Fiber breakdown  | Per-ingredient nutrition   |
| Workout   | Today's workout type, completion % | Exercise list, set details | Historical comparisons     |
| Progress  | Daily score, streak                | Weekly stats, weight trend | 1RM estimates, adherence % |

### Mobile-First Grid System

```
┌─────────────────────────────────────┐
│ Safe Area Top (--sat)               │
├─────────────────────────────────────┤
│ px-[--spacing-card-gap] = 16px      │
│ ┌─────────────────────────────────┐ │
│ │ Card (w-full)                   │ │
│ │ p-[--spacing-card-padding]=12px │ │
│ └─────────────────────────────────┘ │
│ gap-[--spacing-card-gap] = 16px     │
│ ┌─────────────────────────────────┐ │
│ │ Card (w-full)                   │ │
│ └─────────────────────────────────┘ │
│ section-gap = 24px                  │
│ ┌─────────────────────────────────┐ │
│ │ New Section                     │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Bottom Nav (56px + --sab)           │
└─────────────────────────────────────┘
```

- Single column layout (360–428px → no multi-column)
- Cards: `w-full`, `rounded-2xl`, `border border-border`, `bg-card`, `shadow-sm`
- Page scroll area: `pb-[calc(56px+var(--sab)+32px)]` (nav + safe area + breathing)

### Dark Mode Strategy

All specs use semantic tokens. Dark mode requires zero component changes — tokens invert automatically via `:root.dark` CSS variables.

---

## TASK-08 Spec: Compact Form Archetype

> **BLOCKING** dependency for 3.4 Onboarding + 3.5 Settings
> Traces: US-ONB-04, US-SET-03

### Purpose

Reusable form layout pattern used across HealthBasicStep, ActivityLevelStep, GoalStep, HealthProfileForm, TrainingProfileForm. Ensures identical form UX in both onboarding (full-screen) and settings (embedded detail page).

### Layout Blueprint

```
┌─────────────────────────────────────┐
│ CompactForm                          │
│ display: flex, flex-col              │
│ gap: --spacing-card-gap (16px)       │
│                                      │
│ ┌─────────────────────────────────┐  │
│ │ FormField                       │  │
│ │ ┌───────────────────────────┐   │  │
│ │ │ Label (text-sm, font-med) │   │  │
│ │ │ text-foreground           │   │  │
│ │ └───────────────────────────┘   │  │
│ │ ┌───────────────────────────┐   │  │
│ │ │ Input / ButtonGroup /     │   │  │
│ │ │ DatePicker / ChipGroup    │   │  │
│ │ │ h-11 (44px), rounded-lg   │   │  │
│ │ │ border-input, bg-card     │   │  │
│ │ │ focus: ring-2 ring-ring   │   │  │
│ │ └───────────────────────────┘   │  │
│ │ ┌───────────────────────────┐   │  │
│ │ │ Error (if invalid)        │   │  │
│ │ │ text-sm text-destructive  │   │  │
│ │ │ max 2 lines, truncate     │   │  │
│ │ └───────────────────────────┘   │  │
│ └─────────────────────────────────┘  │
│                                      │
│ ... more FormFields ...              │
│                                      │
│ ┌─────────────────────────────────┐  │
│ │ CTA Button                      │  │
│ │ w-full, h-12 (48px)             │  │
│ │ bg-primary, text-primary-fg     │  │
│ │ rounded-xl, font-semibold       │  │
│ │ active:scale-[0.97]             │  │
│ └─────────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Field Types

| Type               | Component                                 | Height          | Props                                |
| ------------------ | ----------------------------------------- | --------------- | ------------------------------------ |
| Text Input         | `<Input>` (shadcn)                        | 44px (h-11)     | placeholder, error, disabled         |
| Number Input       | `<Input type="text" inputMode="decimal">` | 44px            | min, max, step                       |
| Date Input         | `<Input type="date">`                     | 44px            | min, max                             |
| Button Group       | Custom `<ButtonGroupSelector>`            | 44px per button | options[], value, onChange           |
| Multi-Select Chips | Custom `<ChipGroup>`                      | 36px per chip   | options[], selected[], onChange, max |
| Select             | `<Select>` (shadcn)                       | 44px            | options[], value, onChange           |

### Button Group Selector Spec

```
┌──────────┐  gap-2  ┌──────────┐  gap-2  ┌──────────┐
│  Option A │        │ Option B  │        │ Option C  │
│  (muted)  │        │(selected) │        │  (muted)  │
│ bg-muted  │        │bg-primary │        │ bg-muted  │
│ text-fg   │        │text-pri-fg│        │ text-fg   │
└──────────┘        └──────────┘        └──────────┘
h-11 (44px), rounded-lg, flex-1, font-medium
Selected: bg-primary text-primary-foreground shadow-sm
Unselected: bg-muted text-foreground hover:bg-accent
Transition: background-color 150ms --ease-enter
```

### Context Variants

| Context                  | Padding     | Scroll                            | CTA Position                                    |
| ------------------------ | ----------- | --------------------------------- | ----------------------------------------------- |
| Onboarding (full-screen) | `px-6 py-8` | Page-level scroll                 | Sticky bottom (stickyAction slot of PageLayout) |
| Settings (embedded)      | `px-4 py-4` | Detail page scroll, form inherits | Inline at bottom of form                        |

### Token Usage

| Element          | Token                                               |
| ---------------- | --------------------------------------------------- |
| Form background  | `bg-card` (onboarding) / `bg-background` (settings) |
| Label text       | `text-foreground`, `text-sm`, `font-medium`         |
| Input border     | `border-input` → `border-destructive` on error      |
| Input background | `bg-card`                                           |
| Input focus      | `ring-2 ring-ring`                                  |
| Error text       | `text-destructive`, `text-sm`                       |
| CTA button       | `bg-primary text-primary-foreground`                |
| Disabled CTA     | `opacity-50 pointer-events-none`                    |

### Accessibility

- All inputs: `aria-describedby` linking to error message div
- Button groups: `role="radiogroup"`, each button `role="radio"` + `aria-checked`
- Chip groups: `role="group"`, each chip `role="checkbox"` + `aria-checked`
- Auto-scroll to first error on validation failure
- Keyboard: Tab navigates fields, Enter submits, Space toggles selections

---

## TASK-09 Spec: Large Workflow Overlay

> **BLOCKING** dependency for 3.6 Fitness (WorkoutLogger, PlanDayEditor)
> Traces: US-FIT-04

### Purpose

Full-screen overlay for complex multi-step workflows that require sustained user focus (workout logging, plan editing). Opened via `pushPage()` onto page stack.

### Layout Blueprint

```
┌─────────────────────────────────────┐
│ STICKY TOP BAR (56px + --sat)       │
│ bg-card/95 backdrop-blur-md         │
│ ┌──┐                          ┌──┐  │
│ │← │  Title (center, truncate)│ ⋯│  │
│ └──┘                          └──┘  │
│ Back btn    text-page, semibold  Act │
├─────────────────────────────────────┤
│                                     │
│ SCROLLABLE CONTENT AREA             │
│ flex-1, overflow-y-auto             │
│ px-[--spacing-card-gap]             │
│ pt-[--spacing-card-gap]             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Content Card / Section          │ │
│ └─────────────────────────────────┘ │
│ gap-[--spacing-card-gap]            │
│ ┌─────────────────────────────────┐ │
│ │ Content Card / Section          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ pb-[calc(80px+var(--sab))]          │
│                                     │
├─────────────────────────────────────┤
│ STICKY BOTTOM ACTION (if needed)    │
│ px-4 py-3 bg-card/95 backdrop-blur  │
│ border-t border-border              │
│ ┌─────────────────────────────────┐ │
│ │ Primary CTA (w-full, h-12)      │ │
│ └─────────────────────────────────┘ │
│ pb-safe                             │
└─────────────────────────────────────┘
```

### Component: `PageLayout` (existing — reuse directly)

The existing `PageLayout` component already implements this pattern:

- `topBar` slot → sticky header with safe area
- `children` → scrollable content
- `stickyAction` slot → sticky footer with safe area

### Navigation Behavior

| Action                | Behavior                                                        |
| --------------------- | --------------------------------------------------------------- |
| Back button tap       | If unsaved changes → `UnsavedChangesDialog`. Else → `popPage()` |
| Android hardware back | Same as back button tap                                         |
| Swipe from left edge  | Disabled for workflow overlays (prevents accidental exit)       |

### Transition

- Enter: `translateX(100% → 0)`, 250ms, `--ease-enter`
- Exit: `translateX(0 → 100%)`, 200ms, `--ease-exit`
- Backdrop: Bottom nav hides (managed by `PageStackOverlay`)

---

## Animation Choreography

> Global motion specification — Q3=B (Moderate Motion)
> Traces: GCR-08, BR-POL-01→06, US-POL-01

### Master Animation Table

| Category              | Transform                                    | Duration | Easing          | Trigger                    |
| --------------------- | -------------------------------------------- | -------- | --------------- | -------------------------- |
| **Tab switch**        | `opacity 0→1` + `translateY(8px→0)`          | 200ms    | `--ease-enter`  | Tab tap                    |
| **Page push**         | `translateX(100%→0)`                         | 250ms    | `--ease-enter`  | `pushPage()`               |
| **Page pop**          | `translateX(0→100%)`                         | 200ms    | `--ease-exit`   | `popPage()` / back         |
| **Modal enter**       | `opacity 0→1` + `scale(0.95→1)`              | 200ms    | `--ease-enter`  | Modal open                 |
| **Modal exit**        | `opacity 1→0` + `scale(1→0.95)`              | 150ms    | `--ease-exit`   | Modal close                |
| **Sheet enter**       | `translateY(100%→0)`                         | 250ms    | `--ease-spring` | Sheet open                 |
| **Sheet exit**        | `translateY(0→100%)`                         | 200ms    | `--ease-exit`   | Sheet close / swipe        |
| **Backdrop enter**    | `opacity 0→0.5`                              | 200ms    | `--ease-enter`  | With modal/sheet           |
| **Backdrop exit**     | `opacity 0.5→0`                              | 150ms    | `--ease-exit`   | With modal/sheet           |
| **Skeleton→content**  | `opacity 0→1`                                | 300ms    | `--ease-enter`  | Data loaded                |
| **Press feedback**    | `scale(1→0.97)`                              | 100ms    | `--ease-enter`  | `:active` pseudo           |
| **Toggle state**      | `background-color` transition                | 150ms    | `--ease-enter`  | State change               |
| **Calorie ring fill** | `stroke-dashoffset` animation                | 800ms    | `--ease-spring` | Data loaded                |
| **Macro bar fill**    | `width 0→N%`                                 | 600ms    | `--ease-enter`  | Data loaded, stagger 100ms |
| **Score badge pulse** | `scale(1→1.05→1)`                            | 400ms    | `--ease-spring` | Score calculated           |
| **Step transition**   | `translateX(-100%→0)` enter, `(0→100%)` exit | 250ms    | `--ease-enter`  | Onboarding next/back       |

### Reduced Motion Override

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0ms !important;
    transition-duration: 0ms !important;
  }
}
```

Every component using animation MUST check `useReducedMotion()` hook at top level. If true: all durations = 0, all transforms = instant.

### GPU-Only Rule (BR-POL-04)

**ONLY animate**: `transform`, `opacity`
**NEVER animate**: `width`, `height`, `top`, `left`, `margin`, `padding`, `border-width`

This prevents layout reflow and ensures 60fps on low-end Android WebView.

---

## Empty State Variants

> Per GCR-04, using `EmptyState` (Phase 2) component.
> 3 variants: `compact` (inline), `standard` (section), `hero` (full-screen)

### Per-Screen Empty States

| Screen                          | Condition                         | Variant    | Icon            | Title                          | Description                                            | CTA                                |
| ------------------------------- | --------------------------------- | ---------- | --------------- | ------------------------------ | ------------------------------------------------------ | ---------------------------------- |
| Dashboard (no profile)          | `!healthProfile`                  | `hero`     | UserCircle      | "Thiết lập hồ sơ"              | "Nhập thông tin cơ bản để bắt đầu theo dõi dinh dưỡng" | "Thiết lập ngay" → Settings        |
| Dashboard (no meals)            | `eatenCal === 0`                  | `compact`  | UtensilsCrossed | "Chưa có bữa ăn"               | "Thêm bữa ăn đầu tiên hôm nay"                         | "Thêm bữa" → Calendar              |
| Dashboard (no plan)             | `!activePlan`                     | `compact`  | Dumbbell        | "Chưa có kế hoạch tập"         | "Tạo kế hoạch để theo dõi tiến trình"                  | "Tạo kế hoạch" → Fitness           |
| Calendar meals (empty day)      | `dayPlan.slots.all(empty)`        | `standard` | CalendarPlus    | "Chưa lên kế hoạch"            | "Thêm món ăn cho ngày hôm nay"                         | "Lên kế hoạch" → Planner           |
| Calendar nutrition (no profile) | `!healthProfile`                  | `standard` | Target          | "Thiết lập mục tiêu"           | "Thiết lập hồ sơ để xem mục tiêu dinh dưỡng"           | "Thiết lập" → Settings             |
| Library dishes (empty)          | `dishes.length === 0`             | `hero`     | BookOpen        | "Thư viện trống"               | "Thêm món ăn đầu tiên hoặc sử dụng AI phân tích"       | "Thêm món" → DishEditModal         |
| Library ingredients (empty)     | `ingredients.length === 0`        | `hero`     | Salad           | "Chưa có nguyên liệu"          | "Thêm nguyên liệu để bắt đầu tạo món"                  | "Thêm nguyên liệu"                 |
| Library search (no results)     | `filteredList.length === 0`       | `compact`  | SearchX         | "Không tìm thấy"               | "Thử điều chỉnh từ khóa hoặc bộ lọc"                   | —                                  |
| Fitness (no profile + no plan)  | `!trainingProfile && !activePlan` | `hero`     | Dumbbell        | "Bắt đầu hành trình tập luyện" | "Thiết lập hồ sơ và nhận kế hoạch tập luyện phù hợp"   | "Tạo kế hoạch AI" + "Tạo thủ công" |
| Fitness (profile, no plan)      | `trainingProfile && !activePlan`  | `standard` | ClipboardList   | "Tạo kế hoạch tập"             | "Hồ sơ đã sẵn sàng. Tạo kế hoạch để bắt đầu."          | "Tạo kế hoạch"                     |
| Fitness progress (< 7 days)     | `workoutDays < 7`                 | `compact`  | BarChart3       | "Cần thêm dữ liệu"             | "Tập thêm {7 - n} ngày nữa để xem thống kê"            | —                                  |
| Fitness weight (no entries)     | `weightLogs.length === 0`         | `compact`  | Scale           | "Chưa có dữ liệu cân nặng"     | "Ghi nhận cân nặng đầu tiên"                           | "Cân nặng" → WeightQuickLog        |
| AI Analysis (first visit)       | `!hasUsedAI`                      | `hero`     | Camera          | "Phân tích dinh dưỡng bằng AI" | "Chụp ảnh món ăn để nhận ước tính dinh dưỡng tự động"  | "Thử ngay" → Camera                |
| AI Analysis (no results)        | `!currentAnalysis`                | `standard` | ImageOff        | "Không nhận diện được"         | "Thử chụp ảnh rõ hơn, đủ sáng, một món/ảnh"            | "Thử lại" → Camera                 |

### Token Usage for Empty States

| Element     | Token                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| Icon        | `text-muted-foreground`, size 48px (hero) / 32px (standard) / 24px (compact)                          |
| Title       | `text-foreground`, `font-semibold`, text-lg (hero) / text-base (standard/compact)                     |
| Description | `text-muted-foreground`, `text-sm`                                                                    |
| CTA Button  | `bg-primary text-primary-foreground` (primary) / `bg-secondary text-secondary-foreground` (secondary) |
| Container   | No background (inherits parent). Centered (`flex flex-col items-center text-center`)                  |

---

## 3.1 Dashboard

> Traces: US-DASH-01→05, BR-DASH-01→09, IR-DASH-01→06
> Dependencies: None (first in chain)
> Current: CombinedHero (blocking/guided/passive), NutritionSection, TodaysPlanCard, AiInsightCard, QuickActionsBar, WeeklyStatsRow

### Layout Blueprint

```
┌─────────────────────────────────────┐
│ safe-area-top                       │
├─────────────────────────────────────┤  ← TIER 1: Immediate render
│ COMBINED HERO SECTION               │
│ bg-gradient-to-br from-card         │
│ to-primary-subtle                   │
│ px-4 pt-4 pb-5 rounded-b-3xl       │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ ① GREETING + SCORE BADGE      │ │
│  │ "Chào, {name}" text-sm muted  │ │
│  │ Score: [87] text-stat-big     │ │
│  │ color: emerald/amber/slate    │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ ② CALORIE RING                │ │
│  │ SVG circle, ≥120px diameter   │ │
│  │ Stroke: --macro-protein        │ │
│  │ Center: eaten/target kcal     │ │
│  │ text-stat-med / text-sm       │ │
│  │ Tap → EnergyDetailSheet       │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ ③ MACRO BARS (P / F / C)      │ │
│  │ 3 horizontal bars, h-2        │ │
│  │ P: bg-macro-protein            │ │
│  │ F: bg-macro-fat                │ │
│  │ C: bg-macro-carbs              │ │
│  │ Labels: "Xg / Yg" per bar    │ │
│  └────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤  ← TIER 2: 30ms stagger (RAF)
│ gap: --spacing-section-gap (24px)   │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ ④ TODAY'S PLAN CARD            │ │
│  │ CardLayout                     │ │
│  │ ┌──────────────────────────┐   │ │
│  │ │ Header: icon + "Kế hoạch"│   │ │
│  │ ├──────────────────────────┤   │ │
│  │ │ Workout Status Row       │   │ │
│  │ │ [icon] [label] [badge]   │   │ │
│  │ ├──────────────────────────┤   │ │
│  │ │ Meal Slots (3 rows)      │   │ │
│  │ │ 🌅 Sáng: d1, d2  487cal │   │ │
│  │ │ ☀️ Trưa: d3       510cal │   │ │
│  │ │ 🌙 Tối: (trống)    —    │   │ │
│  │ ├──────────────────────────┤   │ │
│  │ │ CTA: context-dependent   │   │ │
│  │ └──────────────────────────┘   │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ ⑤ AI INSIGHT CARD              │ │
│  │ CardLayout, min-h-[56px]       │ │
│  │ AiBadge + 1 insight line       │ │
│  │ Long-press to dismiss          │ │
│  └────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤  ← TIER 3: RAF-gated
│  ┌────────────────────────────────┐ │
│  │ ⑥ QUICK ACTIONS BAR            │ │
│  │ flex row, gap-3                │ │
│  │ [⚖️ Cân nặng] [🏃 Cardio]      │ │
│  │ Each: flex-1, h-12, rounded-xl │ │
│  │ bg-muted, text-foreground      │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ ⑦ WEEKLY STATS ROW             │ │
│  │ Hidden if isFirstTimeUser      │ │
│  │ Horizontal scroll, 7 day dots  │ │
│  │ Each dot: color by completion  │ │
│  └────────────────────────────────┘ │
│                                     │
│ pb-[calc(56px+var(--sab)+32px)]     │
└─────────────────────────────────────┘
```

### Visual Hierarchy (scan order)

1. **Score badge** (32px, color-coded) — eye anchor top-left
2. **Calorie ring** (120px) — dominant visual center of hero
3. **Macro bars** (compact, color-coded) — quick glance P/F/C
4. **Today's plan card** — actionable next-step info
5. **Quick actions** — secondary actions (bottom)

### Component Map

| Component              | Phase 2 Reuse         | New/Modified                            | Key Props                         |
| ---------------------- | --------------------- | --------------------------------------- | --------------------------------- |
| CombinedHero           | —                     | **Modify** (add score badge)            | mode: blocking/guided/passive     |
| NutritionSection       | —                     | **Modify** (ring animation, macro bars) | eaten, target, macros, score      |
| ScoreBadge             | —                     | **NEW**                                 | score: number, size: 'lg' \| 'sm' |
| CalorieRing            | —                     | **NEW** (extract from NutritionSection) | eaten, target, size, animated     |
| MacroBar               | —                     | **NEW** (extract from NutritionSection) | current, target, color, label     |
| TodaysPlanCard         | CardLayout            | **Modify** (5 state machine)            | planState, meals, onAction        |
| AiInsightCard          | CardLayout            | Existing                                | insight, onDismiss                |
| QuickActionsBar        | —                     | Existing                                | actions[]                         |
| WeeklyStatsRow         | —                     | Existing                                | weekData, hidden                  |
| NextActionStrip        | —                     | **NEW** (guided mode CTA)               | action, onTap, onDismiss          |
| NutritionHeroSkeleton  | Skeleton (shadcn)     | Existing                                | —                                 |
| TodaysPlanCardSkeleton | Skeleton              | **NEW**                                 | —                                 |
| AiInsightCardSkeleton  | Skeleton              | **NEW**                                 | —                                 |
| EnergyDetailSheet      | ModalBackdrop (sheet) | Existing                                | bmr, tdee, target, macros         |

### Token Usage Map — Dashboard

| Element                   | Background                                      | Text                            | Border                  | Status  |
| ------------------------- | ----------------------------------------------- | ------------------------------- | ----------------------- | ------- |
| Hero container            | `bg-gradient-to-br from-card to-primary-subtle` | —                               | —                       | —       |
| Score badge ≥80           | `bg-success-subtle`                             | `text-success`                  | `border-success/20`     | success |
| Score badge ≥50           | `bg-warning-subtle`                             | `text-warning`                  | `border-warning/20`     | warning |
| Score badge <50           | `bg-muted`                                      | `text-muted-foreground`         | `border-border`         | neutral |
| Calorie ring track        | —                                               | —                               | `stroke: border-subtle` | —       |
| Calorie ring fill         | —                                               | —                               | `stroke: macro-protein` | —       |
| Ring center text (eaten)  | —                                               | `text-foreground text-stat-med` | —                       | —       |
| Ring center text (target) | —                                               | `text-muted-foreground text-sm` | —                       | —       |
| Macro bar P               | `bg-macro-protein`                              | `text-macro-protein-emphasis`   | —                       | —       |
| Macro bar F               | `bg-macro-fat`                                  | `text-macro-fat-emphasis`       | —                       | —       |
| Macro bar C               | `bg-macro-carbs`                                | `text-macro-carbs-emphasis`     | —                       | —       |
| Bar track                 | `bg-muted`                                      | —                               | —                       | —       |
| Plan card                 | `bg-card`                                       | —                               | `border-border`         | —       |
| Workout: rest-day         | `bg-muted`                                      | `text-muted-foreground`         | —                       | neutral |
| Workout: pending          | `bg-warning-subtle`                             | `text-warning`                  | —                       | warning |
| Workout: partial          | `bg-info-subtle`                                | `text-info`                     | —                       | info    |
| Workout: completed        | `bg-success-subtle`                             | `text-success`                  | —                       | success |
| Quick action btn          | `bg-muted`                                      | `text-foreground`               | —                       | —       |
| AI insight                | `bg-ai-subtle`                                  | `text-foreground`               | `border-ai/20`          | —       |

### Interaction Choreography

**Hero Mode State Machine** (BR-DASH-01):

```
                    ┌──────────┐
                    │ BLOCKING │ ←── Missing: health profile / goal /
                    └────┬─────┘     training profile / fitness plan
                         │ All 4 configured
                    ┌────▼─────┐
                    │  GUIDED  │ ←── 0 data logged today
                    └────┬─────┘     Shows NextActionStrip
                         │ ≥1 action completed
                    ┌────▼─────┐
                    │ PASSIVE  │ ←── Normal daily use
                    └──────────┘     Full hero with data
```

**Calorie Ring Interaction**:

1. Tap ring → EnergyDetailSheet opens (bottom sheet, `--ease-spring`)
2. Sheet shows: BMR → TDEE → Target breakdown, per-meal split
3. Swipe down or tap backdrop → sheet closes

**TodaysPlanCard State Machine** (US-DASH-05):

| State                | Icon          | Color   | CTA                  | Badge |
| -------------------- | ------------- | ------- | -------------------- | ----- |
| `no-plan`            | ClipboardList | muted   | "Tạo kế hoạch"       | —     |
| `rest-day`           | Moon          | muted   | "Xem gợi ý phục hồi" | 😴    |
| `training-pending`   | Dumbbell      | warning | "Bắt đầu tập"        | ⏳    |
| `training-partial`   | Dumbbell      | info    | "Tiếp tục tập"       | 50%   |
| `training-completed` | CheckCircle   | success | "Xem tổng kết"       | ✓     |

### Accessibility Annotations

- Score badge: `aria-label="Điểm hôm nay: {score} trên 100"`
- Calorie ring: `role="img" aria-label="Đã ăn {eaten} trên {target} kilocalories"`
- Macro bars: each `role="meter" aria-valuenow={current} aria-valuemax={target} aria-label="{macro}: {current}g trên {target}g"`
- Quick actions: `role="button"`, descriptive labels
- Focus order: Score → Ring → Macros → Plan Card → Insight → Quick Actions

### Before → After

| Aspect             | Before            | After                                | Breaking?                |
| ------------------ | ----------------- | ------------------------------------ | ------------------------ |
| Score badge        | Not present       | NEW: top of hero, text-stat-big      | No (additive)            |
| Ring animation     | Static SVG        | Animated fill on load (800ms spring) | No                       |
| Macro bars         | Text-only display | Horizontal bars with labels          | No                       |
| TodaysPlanCard     | 3 states          | 5 states (adds no-plan, partial)     | **Yes** — new state enum |
| AiInsight skeleton | Empty div         | Skeleton component                   | No                       |
| NextActionStrip    | Not present       | NEW: guided mode CTA strip           | No (additive)            |
| Tier rendering     | Unknown stagger   | 3 tiers with RAF gating              | No                       |

---

## 3.2 Calendar + Meals

> Traces: US-CAL-01→04, BR-CAL-01→08, IR-CAL-01→06
> Dependencies: 3.1 patterns (CardLayout, EmptyState, Skeleton)
> Current: CalendarTab with Meals/Nutrition subtabs, MealSlot, MealPlannerModal

### Layout Blueprint

```
┌─────────────────────────────────────┐
│ CALENDAR DATE STRIP                 │
│ Horizontal scroll, h-16             │
│ 7 visible days, today highlighted   │
│ Each: w-12, rounded-xl              │
│ Today: bg-primary text-primary-fg   │
│ Other: bg-card text-foreground      │
│ Has meals: dot indicator below date │
├─────────────────────────────────────┤
│ SUB TAB BAR (SubTabBar Phase 2)     │
│ [  Bữa ăn  |  Dinh dưỡng  ]        │
│ Active: bg-card shadow-sm           │
│ Inactive: text-muted-foreground     │
├═════════════════════════════════════┤
│                                     │
│ ═══ MEALS SUBTAB ═══                │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ RECENTLY USED (if any slots     │ │
│ │ empty AND has recent dishes)    │ │
│ │ Section header: "Gần đây"      │ │
│ │ Horizontal scroll, gap-2        │ │
│ │ ┌─────┐ ┌─────┐ ┌─────┐ ...   │ │
│ │ │Dish1│ │Dish2│ │Dish3│ max 8  │ │
│ │ │120kc│ │330kc│ │155kc│        │ │
│ │ └─────┘ └─────┘ └─────┘        │ │
│ │ "Xem tất cả →"                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ── Meal Progress Bar (if 1-2/3) ── │
│ ┌─────────────────────────────────┐ │
│ │ [███████░░░░░░░] 2/3 bữa       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ MEAL SLOT: BỮA SÁNG ☀️          │ │
│ │ CardLayout                      │ │
│ │ ┌──────────────────────────┐    │ │
│ │ │ Icon + "Bữa Sáng" + Edit│    │ │
│ │ ├──────────────────────────┤    │ │
│ │ │ Dish row 1: name   120kc│    │ │
│ │ │  [-] 1 [+] servings     │    │ │
│ │ │ Dish row 2: name   330kc│    │ │
│ │ │  [-] 1 [+] servings     │    │ │
│ │ │ (if >2: "+X more")       │    │ │
│ │ ├──────────────────────────┤    │ │
│ │ │ 450 kcal | P 38g        │    │ │
│ │ └──────────────────────────┘    │ │
│ └─────────────────────────────────┘ │
│ gap: --spacing-card-gap             │
│ ┌─────────────────────────────────┐ │
│ │ MEAL SLOT: BỮA TRƯA (same)     │ │
│ └─────────────────────────────────┘ │
│ gap: --spacing-card-gap             │
│ ┌─────────────────────────────────┐ │
│ │ MEAL SLOT: BỮA TỐI              │ │
│ │ (if empty: dashed border, CTA)  │ │
│ │ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │ │
│ │   + Thêm món                    │ │
│ │ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ═══ NUTRITION SUBTAB ═══            │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ENERGY BALANCE CARD             │ │
│ │ CardLayout                      │ │
│ │ Calories In / Target            │ │
│ │ Protein Current / Target        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ MACRO DONUT CHART               │ │
│ │ P/F/C percentages               │ │
│ │ Macro colors from tokens        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ RECOMMENDATION PANEL            │ │
│ │ Dynamic tips (success/warn/info)│ │
│ │ "Chỉnh mục tiêu" CTA           │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Component Map

| Component           | Phase 2 Reuse  | New/Modified                     | Props                                |
| ------------------- | -------------- | -------------------------------- | ------------------------------------ |
| CalendarDateStrip   | —              | **Existing**                     | selectedDate, onDateChange, mealDots |
| SubTabBar           | SubTabBar (P2) | Reuse directly                   | tabs, activeTab, onChange            |
| RecentDishChips     | —              | **NEW**                          | dishes[], onAdd, onViewAll           |
| MealProgressBar     | —              | **NEW**                          | filledSlots: 0-3                     |
| MealSlot            | CardLayout     | **Modify** (density improvement) | mealType, dishes, onEdit, onAdd      |
| DishRow             | —              | **NEW** (extracted)              | dish, servings, onServingsChange     |
| ServingsStepper     | —              | **Existing**                     | value, onChange, min, max            |
| MealSlotSkeleton    | Skeleton       | **NEW**                          | —                                    |
| EnergyBalanceCard   | CardLayout     | **Existing**                     | caloriesIn, target, protein          |
| MacroDonutChart     | —              | **Existing**                     | protein, fat, carbs                  |
| RecommendationPanel | CardLayout     | **Existing**                     | tips[], onAdjustGoal                 |
| MealPlannerModal    | ModalBackdrop  | **Existing**                     | mealType, onConfirm                  |

### Token Usage Map — Calendar

| Element                      | Token                                     |
| ---------------------------- | ----------------------------------------- |
| Date strip today             | `bg-primary text-primary-foreground`      |
| Date strip other             | `bg-card text-foreground`                 |
| Date strip has-meals dot     | `bg-success` (3/3), `bg-warning` (1-2/3)  |
| Meal slot breakfast header   | `text-meal-breakfast`                     |
| Meal slot lunch header       | `text-meal-lunch`                         |
| Meal slot dinner header      | `text-meal-dinner`                        |
| Empty slot border            | `border-dashed border-border`             |
| Empty slot CTA               | `text-primary`                            |
| Recent chip                  | `bg-muted text-foreground`, `rounded-xl`  |
| Progress bar track           | `bg-muted`                                |
| Progress bar fill (partial)  | `bg-warning`                              |
| Progress bar fill (complete) | `bg-success`                              |
| Nutrition tip (success)      | `bg-success-subtle text-success-emphasis` |
| Nutrition tip (warning)      | `bg-warning-subtle text-warning-emphasis` |
| Nutrition tip (info)         | `bg-info-subtle text-info-emphasis`       |

### Interaction Choreography

**Quick-add from Recently Used** (US-CAL-02):

```
User taps recent dish chip
  ├─ If 1 empty slot → Optimistic add (no modal)
  │   → chip briefly highlights (bg-success-subtle, 200ms)
  │   → slot updates with dish
  │   → toast: "Đã thêm {dish}" (auto-dismiss 2s)
  │
  └─ If >1 empty slot → Submenu appears (bottom sheet)
      → Options: "Bữa Sáng" / "Bữa Trưa" / "Bữa Tối"
      → Tap option → same optimistic add flow
```

**Swipe-to-clear MealSlot** (IR-CAL-04):

```
Swipe left on filled MealSlot
  → Reveals red "Xóa" action (bg-destructive, w-80px)
  → Tap "Xóa" → ConfirmationModal
  → Confirm → optimistic remove + toast "Đã xóa bữa {type}"
```

### Accessibility

- Date strip: `role="radiogroup"`, each date `role="radio" aria-checked`
- Meal slots: `role="region" aria-label="Bữa sáng: {count} món, {total} kilocalories"`
- Servings stepper: `role="spinbutton" aria-valuenow aria-valuemin aria-valuemax`
- Recent chips: `role="button" aria-label="Thêm {dish.name}, {calories} kilocalories"`

### Before → After

| Aspect                | Before                      | After                                                        | Breaking?                      |
| --------------------- | --------------------------- | ------------------------------------------------------------ | ------------------------------ |
| Recently used section | Not visible on Meals subtab | NEW: horizontal chip scroll at top                           | No (additive)                  |
| Meal progress bar     | Not present                 | NEW: between recent and slots                                | No                             |
| MealSlot density      | Basic dish list             | Balanced: name + cal + protein visible, fat/carbs expandable | **Yes** — new layout           |
| Serving stepper       | Exists                      | Unchanged (already correct)                                  | No                             |
| Quick-add flow        | Always opens modal          | 1-tap if 1 empty slot                                        | **Yes** — new interaction path |
| Swipe-to-clear        | Not present                 | NEW: swipe gesture                                           | No (additive)                  |

---

## 3.3 Library

> Traces: US-LIB-01→04, BR-LIB-01→07, IR-LIB-01→06
> Dependencies: 3.1 patterns
> Current: DishManager (~400 LOC), IngredientManager, grid/list views

### Layout Blueprint

```
┌─────────────────────────────────────┐
│ SUB TAB BAR (SubTabBar Phase 2)     │
│ [  Món ăn  |  Nguyên liệu  ]       │
├─────────────────────────────────────┤
│ LIST TOOLBAR (ListToolbar Phase 2)  │
│ [🔍 Search...        ] [Sort▾][≡/▦]│
│ [+ Thêm] (right side)               │
├─────────────────────────────────────┤
│ MEAL TYPE FILTER CHIPS              │
│ [ Tất cả ] [ 🌅 Sáng ] [ ☀️ Trưa ] │
│ [ 🌙 Tối ]                          │
│ Horizontal scroll if overflow       │
├═════════════════════════════════════┤
│                                     │
│ ═══ GẦN ĐÂY section ═══            │
│ (if recent dishes exist)            │
│ Section header: "Gần đây" + toggle  │
│ ┌─────────────────────────────────┐ │
│ │ DishGridCard × max 8            │ │
│ │ 2-column grid, gap-3            │ │
│ │ ┌──────────┐ ┌──────────┐      │ │
│ │ │ Dish 1   │ │ Dish 2   │      │ │
│ │ │ 330 kcal │ │ 155 kcal │      │ │
│ │ │ P: 62g   │ │ P: 13g   │      │ │
│ │ └──────────┘ └──────────┘      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ── Separator (border-t) ──          │
│                                     │
│ ═══ TẤT CẢ section ═══             │
│ Section header: "Tất cả ({count})"  │
│ ┌─────────────────────────────────┐ │
│ │ DishGridCard grid (2-col)       │ │
│ │ OR DishListRow list             │ │
│ │ (toggle via ListToolbar)        │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### DishGridCard Spec (NEW — extracted component)

```
┌─────────────────────────────────┐
│ CardLayout, h-auto              │
│ p-[--spacing-card-padding]      │
│                                 │
│ ┌─ Name ──────────── [⋮] ────┐ │
│ │ "Ức gà áp chảo"    Actions │ │
│ │ text-card-title, semibold   │ │
│ │ truncate 1 line             │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─ Meal tags ────────────────┐  │
│ │ [Trưa] [Tối]   chips      │  │
│ │ text-xs, rounded-full      │  │
│ │ bg-meal-{type}-subtle      │  │
│ │ text-meal-{type}-emphasis  │  │
│ └────────────────────────────┘  │
│                                 │
│ ┌─ Nutrition 2×2 ────────────┐  │
│ │ 330 kcal    │  P 62g       │  │
│ │ text-sm     │  text-sm     │  │
│ │ text-fg     │  text-macro- │  │
│ │             │  protein     │  │
│ ├─────────────┼──────────────┤  │
│ │ F 4g        │  C 0g        │  │
│ │ text-xs     │  text-xs     │  │
│ │ text-muted  │  text-muted  │  │
│ └─────────────┴──────────────┘  │
│                                 │
│ ┌─ Compare toggle ───────────┐  │
│ │ [☐] So sánh                │  │
│ │ text-xs text-muted-fg      │  │
│ └────────────────────────────┘  │
└─────────────────────────────────┘
Min-width: calc(50% - 6px) in 2-col grid
Touch target: entire card = 44px min height
```

### IngredientGridCard Spec (MODIFIED)

```
┌─────────────────────────────────┐
│ CardLayout                      │
│ ┌─ Name + Unit ──────────────┐  │
│ │ "Ức gà" · "per 100g"      │  │
│ │ text-card-title + text-xs  │  │
│ └────────────────────────────┘  │
│                                 │
│ ┌─ Nutrition 2×2 ────────────┐  │
│ │ 165 kcal    │  P 31g       │  │
│ │ F 4g        │  C 0g        │  │
│ └─────────────┴──────────────┘  │
│                                 │
│ ┌─ Usage ────────────────────┐  │
│ │ "Dùng trong 2 món"         │  │
│ │ text-xs text-muted-fg      │  │
│ └────────────────────────────┘  │
└─────────────────────────────────┘
Delete disabled when usage > 0
```

### Token Usage Map — Library

| Element            | Token                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| Grid card          | `bg-card border-border shadow-sm rounded-2xl`                                     |
| Card hover         | `hover:shadow-md` (desktop) / `active:scale-[0.97]` (mobile)                      |
| Compare selected   | `border-compare-active border-2`                                                  |
| Compare unselected | `border-border`                                                                   |
| Meal tag breakfast | `bg-meal-breakfast-subtle text-meal-breakfast-emphasis`                           |
| Meal tag lunch     | `bg-meal-lunch-subtle text-meal-lunch-emphasis`                                   |
| Meal tag dinner    | `bg-meal-dinner-subtle text-meal-dinner-emphasis`                                 |
| Nutrition value    | `text-foreground text-sm` (primary) / `text-muted-foreground text-xs` (secondary) |
| Section header     | `text-section font-semibold`                                                      |
| "Gần đây" section  | `bg-background` (no card, just grouped cards)                                     |

### Before → After

| Aspect            | Before                      | After                                                         | Breaking?               |
| ----------------- | --------------------------- | ------------------------------------------------------------- | ----------------------- |
| DishManager LOC   | ~400 LOC                    | < 200 LOC (extracted DishGridCard, DishListRow, ComparePanel) | **Yes** — file split    |
| "Gần đây" section | Not present                 | NEW: top section with recent dishes                           | No (additive)           |
| Grid card layout  | Basic with inline nutrition | 2×2 macro grid + meal tags                                    | **Yes** — card redesign |
| Ingredient card   | Basic cal/protein only      | All 4 macros in 2×2 grid + "Used in"                          | **Yes** — card redesign |

---

## 3.4 Onboarding

> Traces: US-ONB-01→04, BR-ONB-01→06, IR-ONB-01→05
> Dependencies: TASK-08 (compact form archetype) — BLOCKING
> CEO: Q4=Hybrid — short core + contextual prompts

### Layout Blueprint (6-Screen Core)

```
SCREEN 1/6: WELCOME
┌─────────────────────────────────────┐
│                                     │
│        [App Logo / Illustration]    │
│                                     │
│    "Chào mừng đến với MealPlaner"   │
│    text-page, font-bold, center     │
│                                     │
│    "Ứng dụng lên kế hoạch bữa ăn   │
│     và tập luyện cá nhân hóa"       │
│    text-sm, text-muted-fg, center   │
│                                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Bắt đầu]  bg-primary w-full   │ │
│ │ h-12 rounded-xl                 │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [Bỏ qua]  text-muted-fg        │ │
│ │ text-sm, underline              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ pb-safe                             │
└─────────────────────────────────────┘

SCREEN 2/6: HEALTH BASICS (CompactForm/TASK-08)
┌─────────────────────────────────────┐
│ ← Back     ● ● ○ ○ ○ ○    2/6      │
│                                     │
│ "Thông tin cơ bản"                  │
│ text-page, font-bold                │
│                                     │
│ "Thông tin cơ bản để tính mục tiêu  │
│  dinh dưỡng"                        │
│ text-sm, text-muted-fg              │
│                                     │
│ ┌─ CompactForm ──────────────────┐  │
│ │                                │  │
│ │ Giới tính                      │  │
│ │ [ Nam ] [ Nữ ]  ButtonGroup    │  │
│ │                                │  │
│ │ Tên                            │  │
│ │ [ __________________ ]         │  │
│ │                                │  │
│ │ Ngày sinh                      │  │
│ │ [ ____/____/________ ]         │  │
│ │                                │  │
│ │ Chiều cao (cm)                 │  │
│ │ [ __________________ ]         │  │
│ │                                │  │
│ │ Cân nặng (kg)                  │  │
│ │ [ __________________ ]         │  │
│ │                                │  │
│ └────────────────────────────────┘  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Tiếp tục]  (sticky bottom)    │ │
│ │ Disabled until all fields valid │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

SCREEN 3/6: ACTIVITY LEVEL (ButtonGroup)
┌─────────────────────────────────────┐
│ ← Back     ● ● ● ○ ○ ○    3/6      │
│                                     │
│ "Mức độ vận động"                   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Ít vận động       ]           │ │
│ │  Ít hoặc không tập thể dục     │ │
│ ├─────────────────────────────────┤ │
│ │ [Hoạt động nhẹ     ]           │ │
│ │  1-3 ngày/tuần                 │ │
│ ├─────────────────────────────────┤ │
│ │ [Hoạt động vừa phải]  ← sel   │ │
│ │  3-5 ngày/tuần                 │ │
│ │  bg-primary text-primary-fg    │ │
│ ├─────────────────────────────────┤ │
│ │ [Hoạt động tích cực ]           │ │
│ │  6-7 ngày/tuần                 │ │
│ ├─────────────────────────────────┤ │
│ │ [Hoạt động rất cao ]           │ │
│ │  Vận động viên, 2x/ngày        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Tiếp tục]                          │
└─────────────────────────────────────┘
Each option: h-auto, min-h-[56px], rounded-xl, p-4
Selected: bg-primary text-primary-foreground
Unselected: bg-card border-border

SCREEN 4/6: GOAL
┌─────────────────────────────────────┐
│ ← Back     ● ● ● ● ○ ○    4/6      │
│                                     │
│ "Mục tiêu của bạn"                 │
│                                     │
│ Goal type:                          │
│ [Giảm cân] [Duy trì] [Tăng cân]   │
│ ButtonGroup, flex row               │
│                                     │
│ Rate (if cut/bulk):                 │
│ [Nhẹ nhàng] [Vừa phải] [Tích cực] │
│ ButtonGroup, flex row               │
│                                     │
│ Calorie offset display:             │
│ "{±X} kcal/ngày"                   │
│ text-stat-med, text-center          │
│                                     │
│ [Tiếp tục]                          │
└─────────────────────────────────────┘

SCREEN 5/6: CONFIRM
┌─────────────────────────────────────┐
│ ← Back     ● ● ● ● ● ○    5/6      │
│                                     │
│ "Xác nhận kết quả"                  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Summary Card (CardLayout)       │ │
│ │                                 │ │
│ │ BMR:    1,704 kcal/ngày         │ │
│ │ TDEE:   2,641 kcal/ngày         │ │
│ │ Mục tiêu: 2,091 kcal/ngày      │ │
│ │                                 │ │
│ │ text-stat-med for numbers       │ │
│ │ text-muted-fg for labels        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Macro Preview                   │ │
│ │ P: 150g  F: 58g  C: 241g       │ │
│ │ Colored bars (macro tokens)     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Xác nhận]                          │
│ [Chỉnh sửa] (text link, secondary) │
└─────────────────────────────────────┘

SCREEN 6/6: DONE
┌─────────────────────────────────────┐
│                                     │
│        [✓ Success Illustration]     │
│                                     │
│    "Đã sẵn sàng!"                   │
│    text-page, font-bold             │
│                                     │
│    "Hồ sơ dinh dưỡng đã thiết lập. │
│     Bắt đầu lên kế hoạch bữa ăn." │
│                                     │
│ [Bắt đầu sử dụng]  bg-primary      │
│                                     │
└─────────────────────────────────────┘
```

### Component Map

| Component          | Source                           | Props                     |
| ------------------ | -------------------------------- | ------------------------- |
| OnboardingProgress | **Existing** (modify to 6 steps) | currentStep, totalSteps   |
| WelcomeScreen      | **Existing** (simplify)          | onStart, onSkip           |
| HealthBasicStep    | CompactForm (TASK-08)            | form (RHF)                |
| ActivityLevelStep  | CompactForm (TASK-08)            | value, onChange           |
| GoalStep           | CompactForm (TASK-08)            | goalType, rate, onChange  |
| ConfirmStep        | CardLayout                       | bmr, tdee, target, macros |
| DoneScreen         | —                                | onComplete                |

### Step Transition Animation

- Forward (Next): `translateX(100% → 0)`, 250ms, `--ease-enter`
- Backward (Back): `translateX(-100% → 0)`, 250ms, `--ease-enter`
- Content within step: `opacity 0→1`, 200ms, staggered 50ms per element

### Before → After

| Aspect             | Before                        | After                                                     | Breaking?                 |
| ------------------ | ----------------------------- | --------------------------------------------------------- | ------------------------- |
| Total screens      | 7 sections, 13-21 steps       | **6 screens** (Welcome→Health→Activity→Goal→Confirm→Done) | **Yes** — reduced flow    |
| Training setup     | In onboarding                 | **DEFERRED** to Fitness tab contextual prompt             | **Yes** — removed section |
| Strategy step      | In onboarding (13s computing) | **REMOVED** from onboarding                               | **Yes** — removed section |
| Form pattern       | Custom per step               | TASK-08 CompactForm archetype                             | **Yes** — unified pattern |
| Progress indicator | Step dots                     | "X/6" text + dot progress                                 | Minor change              |

---

## 3.5 Settings

> Traces: US-SET-01→03, BR-SET-01→06, IR-SET-01→06
> Dependencies: TASK-08 form archetype, 3.4

### Layout Blueprint

```
SETTINGS MENU (opened as full-screen page via pushPage)
┌─────────────────────────────────────┐
│ HEADER (PageLayout.topBar)          │
│ ← Close    "Cài đặt"     (56px)    │
├─────────────────────────────────────┤
│ px-4                                │
│                                     │
│ ═══ HỒ SƠ & MỤC TIÊU ═══          │
│ text-section, font-semibold         │
│ mb: --spacing-card-gap              │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ CARD 1: Hồ sơ sức khỏe         │ │
│ │ CardLayout                      │ │
│ │ [❤️ icon]                        │ │
│ │ Title: "Hồ sơ sức khỏe"        │ │
│ │ Summary: "Nam, 75kg, 175cm"     │ │
│ │ Badge: [✓ Đã thiết lập]         │ │
│ │   bg-success-subtle              │ │
│ │   text-success-emphasis          │ │
│ └─────────────────────────────────┘ │
│ gap: --spacing-card-gap             │
│ ┌─────────────────────────────────┐ │
│ │ CARD 2: Mục tiêu                │ │
│ │ [🎯 icon]                        │ │
│ │ Summary: "Giảm cân, -550 kcal"  │ │
│ │ Badge: [✓ Đã thiết lập]         │ │
│ └─────────────────────────────────┘ │
│ gap: --spacing-card-gap             │
│ ┌─────────────────────────────────┐ │
│ │ CARD 3: Hồ sơ tập luyện        │ │
│ │ [💪 icon]                        │ │
│ │ Summary: "3 ngày/tuần, 45 phút" │ │
│ │ Badge: varies                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ gap: --spacing-section-gap          │
│                                     │
│ ═══ TÙY CHỈNH ═══                  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Theme row (inline)              │ │
│ │ [🌓] "Giao diện" → [Switch]    │ │
│ ├─────────────────────────────────┤ │
│ │ Cloud sync row                  │ │
│ │ [☁️] "Đồng bộ" → [Toggle]      │ │
│ ├─────────────────────────────────┤ │
│ │ Data management row             │ │
│ │ [📦] "Dữ liệu" → [>]          │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘

SETTINGS DETAIL PAGE (pushed on top)
┌─────────────────────────────────────┐
│ ← Back    "Hồ sơ sức khỏe"         │
├─────────────────────────────────────┤
│                                     │
│ ═══ VIEW MODE ═══                   │
│ Read-only display of all fields     │
│ ┌─────────────────────────────────┐ │
│ │ Field: Value                    │ │
│ │ Giới tính: Nam                  │ │
│ │ Chiều cao: 175 cm               │ │
│ │ Cân nặng: 75 kg                 │ │
│ │ ...                             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Chỉnh sửa]  bg-primary w-full     │
│                                     │
│ ═══ EDIT MODE ═══                   │
│ CompactForm (TASK-08) embedded      │
│ Same fields as Onboarding HealthBas │
│ [Lưu] [Hủy] buttons                │
│                                     │
└─────────────────────────────────────┘
```

### Status Badge Spec

| Status          | Color                                     | Text             | Condition                         |
| --------------- | ----------------------------------------- | ---------------- | --------------------------------- |
| Configured      | `bg-success-subtle text-success-emphasis` | "Đã thiết lập"   | All required fields filled        |
| Needs Attention | `bg-warning-subtle text-warning-emphasis` | "Cần cập nhật"   | Stale data or missing recommended |
| Not Set Up      | `bg-muted text-muted-foreground`          | "Chưa thiết lập" | Required fields missing           |

### Progressive Disclosure — Training Profile (US-SET-02)

| Experience Level | Visible Fields                                     | Hidden Fields                                          |
| ---------------- | -------------------------------------------------- | ------------------------------------------------------ |
| Beginner         | duration, equipment, injuries, cardio, confirm (5) | periodization, cycleWeeks, priorityMuscles, sleepHours |
| Intermediate     | + periodization, cycleWeeks, priorityMuscles (8)   | sleepHours                                             |
| Advanced         | + sleepHours (9)                                   | —                                                      |

Field show/hide: `opacity 0→1` + `max-height 0→auto`, 200ms, `--ease-enter`.

### Before → After

| Aspect                 | Before              | After                                | Breaking?                       |
| ---------------------- | ------------------- | ------------------------------------ | ------------------------------- |
| Settings cards         | Existing 3 cards    | Same structure, add status badges    | No                              |
| Detail view/edit       | Existing toggle     | Use TASK-08 CompactForm in edit mode | **Yes** — form component change |
| Progressive disclosure | Exists for training | Unchanged (already correct)          | No                              |

---

## 3.6 Fitness

> Traces: US-FIT-01→05, BR-FIT-01→09, IR-FIT-01→07
> Dependencies: 3.1–3.5, TASK-09 (large workflow overlay)
> 5 sub-phases per CEO Q5

### 3.6.1 Empty State

```
┌─────────────────────────────────────┐
│ FITNESS TAB                         │
│ SubTabBar: [Kế hoạch][Tiến trình]  │
│            [Lịch sử]               │
├─────────────────────────────────────┤
│                                     │
│    EmptyState(hero)                 │
│                                     │
│    [Dumbbell icon, 48px, muted]     │
│                                     │
│    "Bắt đầu hành trình tập luyện"  │
│    text-lg, font-semibold           │
│                                     │
│    "Tạo kế hoạch phù hợp với        │
│     mục tiêu và lịch trình của bạn" │
│    text-sm, text-muted-fg           │
│                                     │
│    [Tạo kế hoạch AI]  bg-primary    │
│    w-full, h-12                     │
│                                     │
│    [Tạo thủ công]  bg-secondary     │
│    w-full, h-12                     │
│                                     │
│    Contextual prompt (max 3 shows)  │
│    After 3: subtle "Thiết lập" link │
│                                     │
└─────────────────────────────────────┘
```

### 3.6.2 Plan Creation — Template Gallery

```
┌─────────────────────────────────────┐
│ ← Back    "Chọn kế hoạch"          │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ TEMPLATE CARD (CardLayout)      │ │
│ │ ┌─ Header ─────────────────┐    │ │
│ │ │ "Push-Pull-Legs"    [AI] │    │ │
│ │ │ TemplateMatchBadge       │    │ │
│ │ ├──────────────────────────┤    │ │
│ │ │ Split: 6 ngày/tuần      │    │ │
│ │ │ Difficulty: ●●●○ Inter   │    │ │
│ │ │ Muscles: Full body       │    │ │
│ │ ├──────────────────────────┤    │ │
│ │ │ [Xem chi tiết] [Áp dụng]│    │ │
│ │ └──────────────────────────┘    │ │
│ └─────────────────────────────────┘ │
│ gap: --spacing-card-gap             │
│ ┌─────────────────────────────────┐ │
│ │ TEMPLATE CARD 2 ...             │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### 3.6.3 Active Plan — Weekly View

```
┌─────────────────────────────────────┐
│ WEEKLY CALENDAR STRIP               │
│ [T2][T3][T4][T5][T6][T7][CN]       │
│ Today: bg-primary, ✓ if completed   │
│ Rest: bg-muted, gray                │
│ Workout: border-primary (pending)   │
├─────────────────────────────────────┤
│ WEEK PROGRESS                       │
│ "Tuần 4/8" + progress bar          │
│ [████████░░░░] 50%                  │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ TODAY'S WORKOUT CARD            │ │
│ │ CardLayout, border-primary/30   │ │
│ │                                 │ │
│ │ "Ngày đẩy - Ngực & Vai"        │ │
│ │ text-card-title, font-semibold  │ │
│ │                                 │ │
│ │ 6 bài tập · ~45 phút           │ │
│ │ Muscle icons: chest, shoulder   │ │
│ │                                 │ │
│ │ [Bắt đầu tập]  bg-primary      │ │
│ │ (or "Tiếp tục" / "✓ Hoàn thành")│ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ EXERCISE LIST (collapsed)       │ │
│ │ Exercise 1: Bench Press  3×10   │ │
│ │ Exercise 2: OHP          3×8    │ │
│ │ Exercise 3: Lateral Raise 3×12  │ │
│ │ ...                             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Other days shown below (scrollable) │
│                                     │
└─────────────────────────────────────┘
```

### 3.6.4 Workout Logger (TASK-09 overlay)

```
┌─────────────────────────────────────┐
│ ← Back    "Ngày đẩy"    ⏱ 12:34   │
│ PageLayout.topBar + timer           │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ CURRENT EXERCISE                │ │
│ │ "Bench Press"                   │ │
│ │ text-page, font-bold            │ │
│ │ Target: 3 × 8-10 reps          │ │
│ │ Previous best: 80kg × 10       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ SET LOG TABLE                   │ │
│ │ Set | Reps | Weight | RPE | ✓  │ │
│ │  1  |  10  |  80kg  |  8  | ✓  │ │
│ │  2  |   9  |  80kg  |  9  | ✓  │ │
│ │  3  |  [ ] |  [ ]   | [ ] | ○  │ │
│ │      ← active set input         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ REST TIMER (if resting)         │ │
│ │ Circular countdown, 60s         │ │
│ │ bg-muted, text-stat-big         │ │
│ │ [Skip rest] text button         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Bỏ qua bài tập] secondary         │
│                                     │
├─────────────────────────────────────┤
│ NEXT EXERCISE PREVIEW               │
│ "Tiếp theo: OHP · 3×8"             │
│ text-sm text-muted-fg               │
├─────────────────────────────────────┤
│ [Hoàn thành tập]  (when all done)   │
│ stickyAction, bg-primary            │
└─────────────────────────────────────┘
```

### 3.6.5 Progress Dashboard

```
┌─────────────────────────────────────┐
│ TIME RANGE SELECTOR                 │
│ [7d] [14d] [30d] [90d]             │
│ ButtonGroup, compact                │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ WEIGHT TREND (CardLayout)       │ │
│ │ Line chart, current + target    │ │
│ │ Markers on data points          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ WEEKLY VOLUME (CardLayout)      │ │
│ │ Bar chart, last 4 weeks         │ │
│ │ Bars: bg-primary                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 1RM ESTIMATES (CardLayout)      │ │
│ │ Top 5 exercises, Epley formula  │ │
│ │ List: exercise name + 1RM kg    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ADHERENCE (CardLayout)          │ │
│ │ Circular progress: X%           │ │
│ │ "Y/Z buổi tập hoàn thành"      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ PLATEAU ALERT (if detected)     │ │
│ │ bg-warning-subtle               │ │
│ │ "Có thể đang đình trệ..."      │ │
│ │ [Xem đề xuất]                   │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Token Usage — Fitness (all sub-phases)

| Element                | Token                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------ |
| Weekly strip today     | `bg-primary text-primary-foreground`                                                 |
| Weekly strip completed | `bg-success text-success-foreground`                                                 |
| Weekly strip rest      | `bg-muted text-muted-foreground`                                                     |
| Weekly strip pending   | `border-primary text-foreground`                                                     |
| Workout card pending   | `border-warning/30`                                                                  |
| Workout card completed | `border-success/30 bg-success-subtle`                                                |
| Rest timer circle      | `stroke: primary`, `bg-muted`                                                        |
| PR notification        | `bg-feature-energy-subtle text-feature-energy-emphasis`                              |
| Plateau alert          | `bg-warning-subtle text-warning-emphasis border-warning/20`                          |
| Deload badge           | `bg-info-subtle text-info-emphasis`                                                  |
| Volume bar             | `bg-primary`                                                                         |
| Adherence circle       | `stroke: success` (≥80%) / `stroke: warning` (50-79%) / `stroke: destructive` (<50%) |

### Before → After Summary — Fitness

| Aspect            | Before                      | After                                         | Breaking?                |
| ----------------- | --------------------------- | --------------------------------------------- | ------------------------ |
| Empty state       | FitnessEmptyState (basic)   | EmptyState(hero) + 2 CTA paths                | **Yes** — redesign       |
| Plan view         | TrainingPlanView (1093 LOC) | < 500 LOC, extracted weekly strip + day cards | **Yes** — major refactor |
| Workout logger    | WorkoutLogger (681 LOC)     | < 400 LOC, TASK-09 overlay pattern            | **Yes** — layout change  |
| Progress          | ProgressDashboard (basic)   | 4-section dashboard with charts               | **Yes** — expanded       |
| Contextual prompt | Not present                 | NEW: training profile prompt (max 3 shows)    | No (additive)            |

---

## 3.7 AI Analysis

> Traces: US-AI-01→03, BR-AI-01→06, IR-AI-01→06
> Dependencies: 3.1–3.5 patterns

### Layout Blueprint

```
FIRST-VISIT EXPERIENCE
┌─────────────────────────────────────┐
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ VALUE PROPOSITION BANNER        │ │
│ │ bg-ai-subtle border-ai/20      │ │
│ │ rounded-2xl, p-4               │ │
│ │                                 │ │
│ │ "Phân tích dinh dưỡng bằng AI" │ │
│ │ text-card-title, font-semibold  │ │
│ │                                 │ │
│ │ 3-step guide (horizontal):      │ │
│ │ [📸 Chụp] → [🤖 AI] → [💾 Lưu] │ │
│ │                                 │ │
│ │ Example badges:                 │ │
│ │ [Phở] [Cơm] [Salad]            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ BEST PRACTICES CARD             │ │
│ │ "Mẹo chụp ảnh tốt nhất"        │ │
│ │ • Chụp từ trên xuống            │ │
│ │ • Đủ ánh sáng                   │ │
│ │ • Một món/ảnh                   │ │
│ │ Collapsible (default: expanded) │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [📸 Thử ngay]  bg-primary, w-full  │
│ h-14, rounded-xl                    │
│                                     │
│ "Còn {X}/10 lượt phân tích"        │
│ text-xs, text-muted-fg, center      │
│                                     │
└─────────────────────────────────────┘

ANALYSIS RESULT VIEW
┌─────────────────────────────────────┐
│ ← Back    "Kết quả phân tích"       │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ IMAGE PREVIEW                   │ │
│ │ aspect-video, rounded-2xl       │ │
│ │ Swipe left/right for retake     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ CONFIDENCE BADGE (top of card)  │ │
│ │ High (≥70%): bg-success-subtle  │ │
│ │   text-success, "Cao"           │ │
│ │ Med (40-69%): bg-warning-subtle │ │
│ │   text-warning, "Trung bình"    │ │
│ │ Low (<40%): bg-feature-rose-sub │ │
│ │   text-feature-rose, "Thấp"    │ │
│ │                                 │ │
│ │ Tap → expands explanation       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ NUTRITION SUMMARY CARD          │ │
│ │ CardLayout                      │ │
│ │ Dish name: text-page, bold      │ │
│ │                                 │ │
│ │ ┌──────────────────────────┐    │ │
│ │ │ 400 ±60 kcal             │    │ │
│ │ │ text-stat-big            │    │ │
│ │ ├──────────────────────────┤    │ │
│ │ │ P: 35 ±5g | F: 15 ±4g  │    │ │
│ │ │ C: 40 ±8g               │    │ │
│ │ │ Macro bars (with ± range)│    │ │
│ │ └──────────────────────────┘    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ INGREDIENT BREAKDOWN            │ │
│ │ ┌──────────────────────────┐    │ │
│ │ │ 🟢 Ức gà         200g   │    │ │
│ │ │ 🟡 Rau xanh      100g   │    │ │
│ │ │ 🔴 Sốt (không rõ) 30g   │    │ │
│ │ │ Dot color = confidence   │    │ │
│ │ └──────────────────────────┘    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ FEEDBACK ROW                    │ │
│ │ "Kết quả có đúng không?"       │ │
│ │ [👍] [👎]  each 44×44 target   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ "Tại sao ước tính?"             │ │
│ │ Collapsible card                │ │
│ │ (default: collapsed)            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ SOURCE ATTRIBUTION                  │
│ "Phân tích bởi Google Gemini"       │
│ AiBadge + text-xs text-muted-fg     │
│                                     │
├─────────────────────────────────────┤
│ [Lưu vào thư viện]  stickyAction    │
│ bg-primary, w-full, h-12            │
└─────────────────────────────────────┘
```

### Confidence Indicator Spec

| Level  | Range  | Color                                      | Badge Text   | Error Range |
| ------ | ------ | ------------------------------------------ | ------------ | ----------- |
| High   | ≥70%   | `bg-success-subtle text-success`           | "Cao"        | ±15%        |
| Medium | 40-69% | `bg-warning-subtle text-warning`           | "Trung bình" | ±25%        |
| Low    | <40%   | `bg-feature-rose-subtle text-feature-rose` | "Thấp"       | ±40%        |

Per-ingredient confidence dot:

- `🟢` (green dot) = High → `text-success`
- `🟡` (yellow dot) = Medium → `text-warning`
- `🔴` (red dot) = Low → `text-destructive`

### Before → After

| Aspect                    | Before           | After                              | Breaking?     |
| ------------------------- | ---------------- | ---------------------------------- | ------------- |
| First-use guide           | Not present      | NEW: 3-step guide + best practices | No (additive) |
| Confidence badge          | Not present      | NEW: High/Med/Low with colors      | No (additive) |
| Error ranges              | Not present      | NEW: ±X% per value                 | No (additive) |
| Per-ingredient confidence | Not present      | NEW: colored dots                  | No (additive) |
| Feedback (👍/👎)          | Not present      | NEW: feedback row                  | No (additive) |
| Rate limiting display     | Not present      | NEW: "Còn X/10 lượt"               | No (additive) |
| Source attribution        | Basic disclaimer | AiBadge + "Google Gemini"          | Minor change  |

---

## 3.8 Polish — Global Motion & Skeleton

> Traces: US-POL-01→03, BR-POL-01→06
> Dependencies: 3.1–3.7 (all stable first)

### Skeleton Screen Inventory

| Screen              | Skeleton Components                               | Shape Match                                |
| ------------------- | ------------------------------------------------- | ------------------------------------------ |
| Dashboard Hero      | NutritionHeroSkeleton (existing)                  | Ring circle + bar lines + text lines       |
| Dashboard Plan Card | **NEW** TodaysPlanCardSkeleton                    | Card with 3 row lines + button             |
| Dashboard Insight   | **NEW** AiInsightCardSkeleton                     | Card with 1 text line (56px min-h)         |
| Calendar Meals      | **NEW** MealSlotSkeleton × 3                      | Card with header + 2 dish lines + summary  |
| Calendar Nutrition  | **NEW** NutritionSubTabSkeleton                   | Card + donut circle + text lines           |
| Library Grid        | **NEW** DishGridCardSkeleton × 6                  | Card with title + tag row + 2×2 grid       |
| Library List        | **NEW** DishListRowSkeleton × 10                  | Row with name + 4 number columns           |
| Fitness Plan        | **NEW** WeeklyStripSkeleton + DayCardSkeleton × 7 | Strip of 7 circles + cards                 |
| AI Analysis         | **NEW** AnalysisResultSkeleton                    | Image placeholder + card + ingredient rows |
| Settings Menu       | **NEW** SettingsCardSkeleton × 3                  | Card with icon circle + 2 text lines       |

### Skeleton Implementation Pattern

```tsx
// Each skeleton uses shadcn Skeleton component
// Shape matches final content ±10%
<div className="flex flex-col gap-[--spacing-card-gap]">
  <Skeleton className="h-[120px] w-[120px] rounded-full" /> {/* ring */}
  <Skeleton className="h-4 w-3/4" /> {/* text line 1 */}
  <Skeleton className="h-3 w-1/2" /> {/* text line 2 */}
  <div className="flex gap-2">
    <Skeleton className="h-2 flex-1 rounded-full" /> {/* macro bar */}
    <Skeleton className="h-2 flex-1 rounded-full" />
    <Skeleton className="h-2 flex-1 rounded-full" />
  </div>
</div>
```

### Minimum Display Duration (GCR-05)

```typescript
// Pattern: minimum 200ms skeleton display
const MIN_SKELETON_MS = 200;

function useMinimumDelay(isLoading: boolean): boolean {
  const [showSkeleton, setShowSkeleton] = useState(true);
  const mountTime = useRef(Date.now());

  useEffect(() => {
    if (!isLoading) {
      const elapsed = Date.now() - mountTime.current;
      const remaining = Math.max(0, MIN_SKELETON_MS - elapsed);
      const timer = setTimeout(() => setShowSkeleton(false), remaining);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return showSkeleton;
}
```

### Press Feedback Universal Pattern

```css
/* Apply to ALL interactive elements */
.interactive {
  @apply transition-transform duration-100 active:scale-[0.97];
}

/* Disabled elements: NO feedback */
.interactive:disabled {
  @apply pointer-events-none opacity-50;
}

/* Reduced motion: instant */
@media (prefers-reduced-motion: reduce) {
  .interactive {
    transition-duration: 0ms;
  }
}
```

Apply to: all `<button>`, tappable cards (MealSlot, DishCard, SettingsCard, TemplateCard), quick action buttons, recent dish chips.

### Double-Tap Prevention

```typescript
function useDebounceAction(action: () => void, delay = 200) {
  const lastCall = useRef(0);
  return useCallback(() => {
    const now = Date.now();
    if (now - lastCall.current > delay) {
      lastCall.current = now;
      action();
    }
  }, [action, delay]);
}
```

---

## Cross-Cutting Design Annotations

### Focus Order (Global)

Tab panels follow natural DOM order. Within each tab:

1. **Dashboard**: Score → Ring → Macros → Plan Card (meal slots → workout) → Insight → Quick Actions
2. **Calendar**: Date strip → SubTab → (Meals: recent chips → slots) / (Nutrition: balance → chart → tips)
3. **Library**: SubTab → Search → Sort/Layout → Filter chips → Cards
4. **Fitness**: SubTab → Weekly strip → Day cards → Exercises
5. **AI**: Camera button → Results → Ingredients → Feedback → Save

### Screen Reader Experience

Every screen provides meaningful `aria-label` on container:

- Dashboard: `aria-label="Tổng quan hôm nay"`
- Calendar: `aria-label="Lịch bữa ăn ngày {date}"`
- Library: `aria-label="Thư viện món ăn và nguyên liệu"`
- Fitness: `aria-label="Kế hoạch tập luyện"`
- AI: `aria-label="Phân tích dinh dưỡng AI"`
- Settings: `aria-label="Cài đặt ứng dụng"`

Live regions for dynamic content:

- Calorie updates: `aria-live="polite"`
- Toast notifications: `aria-live="assertive"`
- Loading states: `aria-busy="true"` on skeleton containers

### Contrast Requirements (WCAG AAA)

| Text Type                      | Min Contrast | Verification                                 |
| ------------------------------ | ------------ | -------------------------------------------- |
| Body text (14px)               | 7:1          | `foreground` on `background` = 19.3:1 ✓      |
| Large text (≥18px bold)        | 4.5:1        | All semantic tokens meet this ✓              |
| UI components (borders, icons) | 3:1          | `muted-foreground` on `background` = 4.8:1 ✓ |
| Disabled text                  | No minimum   | `opacity-50` on all disabled elements        |

---

## Appendix: New Components Summary

| Component               | Type                | Used In         | Priority      |
| ----------------------- | ------------------- | --------------- | ------------- |
| CompactForm (TASK-08)   | Layout archetype    | 3.4, 3.5        | P0 (blocking) |
| ScoreBadge              | Display             | 3.1 Dashboard   | P1            |
| CalorieRing             | Display             | 3.1 Dashboard   | P1            |
| MacroBar                | Display             | 3.1, 3.2        | P1            |
| NextActionStrip         | Action              | 3.1 Dashboard   | P1            |
| RecentDishChips         | Action              | 3.2 Calendar    | P1            |
| MealProgressBar         | Display             | 3.2 Calendar    | P2            |
| DishRow                 | Display (extracted) | 3.2 Calendar    | P1            |
| DishGridCard            | Display (extracted) | 3.3 Library     | P1            |
| DishListRow             | Display (extracted) | 3.3 Library     | P1            |
| ComparePanel            | Display (extracted) | 3.3 Library     | P2            |
| ConfidenceBadge         | Display             | 3.7 AI          | P1            |
| IngredientConfidenceDot | Display             | 3.7 AI          | P2            |
| FeedbackRow             | Action              | 3.7 AI          | P2            |
| 10 Skeleton variants    | Loading             | 3.8 all screens | P2            |

**Total new components**: 15 (+ 10 skeleton variants = 25)
**Total extracted components**: 4 (from existing monolith components)

---

**[DESIGNER] Trạng thái: DESIGN_READY**

> 8 screen groups fully specified. TASK-08 + TASK-09 blocking dependencies defined.
> All specs use Phase 1 tokens exclusively (0 hardcoded colors).
> All specs reuse Phase 2 components where applicable.
> 25 new/extracted components identified with priority.
> Animation choreography covers all 16 transition types + reduced motion.
> 15 empty state variants specified per screen.
> Full accessibility annotations (ARIA, focus order, screen reader, contrast).
> Ready for Tech Leader task breakdown and Dev implementation.
