# LEADER — Phase 3: Screen-by-Screen Redesign — Implementation Plan

> **Status**: KẾ*HOẠCH_KỸ_THUẬT*ĐÃ_CHỐT
> **Author**: Tech Leader Agent
> **Date**: 2026-07-18
> **Upstream**: BM-PHASE3-SCREEN-REDESIGN.md (1234 lines), DESIGNER-PHASE3-SCREEN-SPECS.md (1687 lines)

---

## TABLE OF CONTENTS

1. [Architecture Analysis](#1-architecture-analysis)
2. [Sub-Phase Strategy](#2-sub-phase-strategy)
3. [Phase 3.0 — Shared Foundation (DETAILED)](#3-phase-30--shared-foundation)
4. [Phase 3.1 — Dashboard Redesign (DETAILED)](#4-phase-31--dashboard-redesign)
5. [Phase 3.2 — Calendar + Meals (HIGH-LEVEL)](#5-phase-32--calendar--meals)
6. [Phase 3.3 — Library (HIGH-LEVEL)](#6-phase-33--library)
7. [Phase 3.4 — Onboarding (HIGH-LEVEL)](#7-phase-34--onboarding)
8. [Phase 3.5 — Settings (HIGH-LEVEL)](#8-phase-35--settings)
9. [Phase 3.6 — Fitness (HIGH-LEVEL, 5 Sub-Phases)](#9-phase-36--fitness)
10. [Phase 3.7 — AI Analysis (HIGH-LEVEL)](#10-phase-37--ai-analysis)
11. [Phase 3.8 — Global Polish (HIGH-LEVEL)](#11-phase-38--global-polish)
12. [File Ownership Matrix — Phase 3.0 + 3.1](#12-file-ownership-matrix)
13. [Risk Mitigation](#13-risk-mitigation)
14. [Dependency Graph Summary](#14-dependency-graph-summary)

---

## 1. ARCHITECTURE ANALYSIS

### 1.1 Current Component Inventory Per Screen

| Screen      | Components                                              | LOC         | Test Files        | Shared Deps                                       |
| ----------- | ------------------------------------------------------- | ----------- | ----------------- | ------------------------------------------------- |
| Dashboard   | 9 components + 6 hooks                                  | ~3,282      | 1 integration     | ModalBackdrop, CloseButton, EmptyState            |
| Calendar    | 12 components                                           | ~2,842      | 7 test files      | SubTabBar, ModalBackdrop, EmptyState, ListToolbar |
| Library     | 3 components (DishManager 876L, IngredientManager 509L) | ~1,475      | 2 test files      | SubTabBar, ListToolbar, FormField, ModalBackdrop  |
| Onboarding  | 23 files (main + 13 training steps)                     | ~2,567      | 3 test files      | None (self-contained)                             |
| Settings    | 6 components                                            | ~2,458      | 4 test files      | SettingsDetailLayout                              |
| Fitness     | 36 components + 8 hooks + 24 utils                      | ~13,718     | 6 test files      | SubTabBar, ModalBackdrop, EmptyState              |
| AI Analysis | 3 main + modals                                         | ~640        | 4 test files      | None                                              |
| **TOTAL**   | **~92 components**                                      | **~26,982** | **27 test files** | —                                                 |

### 1.2 Shared Patterns Across Screens (Reuse Opportunities)

| Pattern                   | Current Implementation                                       | Designer Spec Target                                        | Gap                                                |
| ------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------- | -------------------------------------------------- |
| **Card container**        | Ad-hoc Tailwind classes per component                        | `CardLayout` archetype (Phase 2)                            | Medium — some screens use CardLayout, others don't |
| **Skeleton loading**      | 2 inline skeletons (NutritionHeroSkeleton, AnalysisSkeleton) | 10 shape-matched skeleton variants + `useMinimumDelay`      | Large — 8 new skeletons + utility hook needed      |
| **Press feedback**        | None                                                         | Universal `active:scale-[0.97]` on all interactive elements | Large — CSS class + apply to all buttons/cards     |
| **Empty states**          | `EmptyState` component with 3 variants                       | 15 screen-specific empty state configurations               | Medium — component exists, configs need updating   |
| **SubTabBar**             | Exists, used by Calendar/Library/Fitness                     | Same, add animation (opacity+translateY)                    | Small — add CSS transition                         |
| **Form layout**           | Scattered form patterns                                      | `CompactForm` archetype (TASK-08)                           | Large — new shared archetype                       |
| **Page overlay**          | `PageLayout` exists                                          | TASK-09 workflow overlay spec                               | Small — PageLayout already matches spec            |
| **Double-tap prevention** | None                                                         | `useDebounceAction` hook                                    | Medium — new hook                                  |
| **Reduced motion**        | Some components check                                        | Global `useReducedMotion` + CSS override                    | Medium — needs consolidation                       |

### 1.3 Breaking Changes & Migration Strategy

| Change                                        | Impact                                 | Migration                                                      |
| --------------------------------------------- | -------------------------------------- | -------------------------------------------------------------- |
| **Extract CalorieRing from NutritionSection** | NutritionSection.tsx (425L) refactored | Non-breaking: extract inline → import. Tests update imports.   |
| **Extract MacroBar from NutritionSection**    | Same file                              | Same approach. Done in same task as CalorieRing.               |
| **Extract DishGridCard from DishManager**     | DishManager.tsx (876L) refactored      | Non-breaking: extract inline → import.                         |
| **Extract DishRow from MealSlot**             | MealSlot.tsx refactored                | Non-breaking: extract inline → import.                         |
| **CompactForm archetype**                     | Onboarding (23 files) + Settings forms | Incremental: create archetype first, migrate forms one by one. |
| **Skeleton utility (useMinimumDelay)**        | All loading states                     | Additive: new hook, no existing code changes.                  |
| **Press feedback CSS**                        | All interactive elements               | Additive: add CSS class, apply incrementally.                  |

### 1.4 Key Architectural Decisions

| Decision                                                | Rationale                                                                                                                                    |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phase 3.0 (Foundation) before any screen**            | Shared utilities (skeletons, animation, press feedback) used by ALL screens. Creating once avoids duplication.                               |
| **Extract components from large files BEFORE redesign** | NutritionSection (425L), DishManager (876L), TodaysPlanCard (422L) are too large. Extract first, then redesign the extracted pieces.         |
| **TASK-08 CompactForm is Phase 3.0**                    | Blocks both 3.4 (Onboarding) and 3.5 (Settings). Must be foundation.                                                                         |
| **TASK-09 is already done**                             | PageLayout already implements the Large Workflow Overlay spec (sticky header/footer, scrollable content). Only minor token alignment needed. |
| **Fitness sub-phased per CEO decision**                 | 63 files, 13.7K LOC. Split into 5 sub-phases: Empty→Creation→Active→Logger→Progress. Each independently shippable.                           |

---

## 2. SUB-PHASE STRATEGY

Phase 3 is divided into **9 sub-phases**, each independently shippable:

```
Phase 3.0: Shared Foundation    [BLOCKING ALL]     ~3 tasks,  Effort: M
Phase 3.1: Dashboard            [depends on 3.0]   ~6 tasks,  Effort: L
Phase 3.2: Calendar + Meals     [depends on 3.0]   ~5 tasks,  Effort: L
Phase 3.3: Library              [depends on 3.0]   ~4 tasks,  Effort: M
Phase 3.4: Onboarding           [depends on 3.0]   ~4 tasks,  Effort: L
Phase 3.5: Settings             [depends on 3.0]   ~3 tasks,  Effort: M
Phase 3.6: Fitness (5 sub)      [depends on 3.0]   ~8 tasks,  Effort: XL
Phase 3.7: AI Analysis          [depends on 3.0]   ~3 tasks,  Effort: M
Phase 3.8: Global Polish        [depends on ALL]   ~3 tasks,  Effort: M

Total: ~39 tasks across 9 sub-phases
```

**Parallelism opportunities**: After 3.0 completes, phases 3.1–3.7 can run in parallel (they don't share files). Phase 3.8 runs last.

**This document details**: Phase 3.0 + Phase 3.1 fully. Phases 3.2–3.8 at high level (will be detailed when their turn comes).

---

## 3. PHASE 3.0 — SHARED FOUNDATION

### TASK-P3-00: Shared Animation & Interaction Utilities

**Screen Group**: Foundation (all screens)
**Effort**: M (1-3h)
**Priority**: P0 — BLOCKING ALL

**Files to CREATE:**

- `src/hooks/useMinimumDelay.ts` — Skeleton minimum display duration hook (Designer §3.8 GCR-05)
- `src/hooks/useDebounceAction.ts` — Double-tap prevention hook (Designer §3.8)
- `src/hooks/useReducedMotion.ts` — Consolidated reduced motion detection hook

**Files to MODIFY:**

- `src/index.css` — Add `.interactive` press feedback class, reduced motion override (Designer §3.8)

**Files to DELETE:** None

**Dependencies:**

- Depends on: Nothing (foundation)
- Blocks: ALL Phase 3 tasks (every screen uses these)

**Acceptance Criteria:**

- [ ] AC1: `useMinimumDelay(isLoading)` returns `showSkeleton` boolean; skeleton visible for MIN 200ms even if data loads instantly
- [ ] AC2: `useDebounceAction(action, delay=200)` prevents double-tap; second call within window is ignored
- [ ] AC3: `useReducedMotion()` returns boolean from `prefers-reduced-motion` media query; reactive to system changes
- [ ] AC4: `.interactive` class applies `active:scale-[0.97] transition-transform duration-100`; disabled state adds `opacity-50 pointer-events-none`
- [ ] AC5: `@media (prefers-reduced-motion: reduce)` override in index.css sets all animation/transition durations to 0ms
- [ ] AC6: All 3 hooks have 100% test coverage
- [ ] AC7: Lint 0, Build clean

**User Stories Covered**: GCR-05 (Skeleton min display), BR-POL-04 (GPU-only animation), IR-GLOB-01 (Press feedback)
**Business Rules Applied**: BR-POL-04 (only animate transform/opacity), GCR-05 (200ms skeleton min)
**Designer Spec Reference**: Section 3.8 — Press Feedback Universal Pattern, Double-Tap Prevention, Minimum Display Duration

---

### TASK-P3-01: CompactForm Archetype (TASK-08 from Phase 2)

**Screen Group**: Foundation (used by 3.4 Onboarding + 3.5 Settings)
**Effort**: L (3-8h)
**Priority**: P0 — BLOCKING 3.4 + 3.5

**Files to CREATE:**

- `src/components/shared/CompactForm.tsx` — Reusable form layout with context variants (onboarding full-screen / settings embedded)
- `src/components/shared/ButtonGroupSelector.tsx` — Single-select button group (role=radiogroup, 44px per option, bg-primary when selected)
- `src/__tests__/CompactForm.test.tsx` — Tests for CompactForm
- `src/__tests__/ButtonGroupSelector.test.tsx` — Tests for ButtonGroupSelector

**Files to MODIFY:** None (new files only)

**Files to DELETE:** None

**Dependencies:**

- Depends on: Nothing
- Blocks: TASK-P3-20 (Onboarding redesign), TASK-P3-25 (Settings forms)

**Acceptance Criteria:**

- [ ] AC1: `CompactForm` renders with `variant="onboarding"` (px-6 py-8, sticky bottom CTA via PageLayout.stickyAction) and `variant="settings"` (px-4 py-4, inline CTA)
- [ ] AC2: Accepts `children` (FormField components) + `ctaLabel` + `onSubmit` + `isValid` + `isSubmitting` props
- [ ] AC3: CTA button: `w-full h-12 bg-primary text-primary-foreground rounded-xl font-semibold active:scale-[0.97]`; disabled when `!isValid || isSubmitting`
- [ ] AC4: `ButtonGroupSelector` renders options with `role="radiogroup"`, each button `role="radio" aria-checked`
- [ ] AC5: Selected: `bg-primary text-primary-foreground shadow-sm`; Unselected: `bg-muted text-foreground hover:bg-accent`
- [ ] AC6: Transition: `background-color 150ms var(--ease-enter)`
- [ ] AC7: Auto-scroll to first error on validation failure (`scrollIntoView({ behavior: 'smooth', block: 'center' })`)
- [ ] AC8: All new files have 100% test coverage
- [ ] AC9: ARIA: all inputs linked via `aria-describedby` to error messages

**User Stories Covered**: US-ONB-04 (Concise health form), US-SET-03 (In-app profile editing)
**Business Rules Applied**: BR-ONB-06 (44px touch targets), BR-SET-04 (form validation inline)
**Designer Spec Reference**: Section TASK-08 — CompactForm Archetype (full spec)

---

### TASK-P3-02: Dashboard Skeleton Components

**Screen Group**: 3.1 Dashboard + Foundation
**Effort**: S (<1h)
**Priority**: P1

**Files to CREATE:**

- `src/features/dashboard/components/TodaysPlanCardSkeleton.tsx` — Shape-matched skeleton for TodaysPlanCard (card with 3 row lines + button)
- `src/features/dashboard/components/AiInsightCardSkeleton.tsx` — Shape-matched skeleton for AiInsightCard (card with 1 text line, min-h-56px)
- `src/__tests__/dashboardSkeletons.test.tsx` — Tests for both skeletons

**Files to MODIFY:** None

**Files to DELETE:** None

**Dependencies:**

- Depends on: TASK-P3-00 (useMinimumDelay hook)
- Blocks: TASK-P3-08 (Dashboard orchestration)

**Acceptance Criteria:**

- [ ] AC1: `TodaysPlanCardSkeleton` renders card shape with 3 `Skeleton` lines + 1 `Skeleton` button, using `--spacing-card-padding` for internal spacing
- [ ] AC2: `AiInsightCardSkeleton` renders card shape with min-h-56px, 1 text line `Skeleton`
- [ ] AC3: Both use `Skeleton` from `@/components/ui/skeleton`
- [ ] AC4: Both integrate with `useMinimumDelay` — visible for at least 200ms
- [ ] AC5: 100% test coverage

**User Stories Covered**: US-DASH-05 (Visual loading hierarchy)
**Business Rules Applied**: GCR-05 (200ms minimum skeleton)
**Designer Spec Reference**: Section 3.8 — Skeleton Screen Inventory (Dashboard row)

---

## 4. PHASE 3.1 — DASHBOARD REDESIGN

### Current State Analysis

```
DashboardTab (root)
├── CombinedHero (109L)
│   ├── NutritionSection (425L) ← NEEDS EXTRACTION + REDESIGN
│   │   ├── ProgressRing (inline)  → extract to CalorieRing
│   │   ├── MacroBar (inline x3)  → extract to MacroBar
│   │   └── NutritionHeroSkeleton → keep inline
│   └── WeeklyStatsRow (201L)    → MINOR ENHANCEMENT
├── TodaysPlanCard (422L)        → REDESIGN (5 states)
├── AiInsightCard (187L)         → MINOR TOKEN ALIGNMENT
└── QuickActionsBar (59L)        → MINOR TOKEN ALIGNMENT
```

**Target State (Designer Spec):**

```
DashboardTab (root, tiered animation)
├── [Tier 1, immediate] CombinedHero
│   ├── NutritionSection (refactored, imports below)
│   │   ├── ScoreBadge (NEW, 32px, color-coded)
│   │   ├── CalorieRing (EXTRACTED, ≥120px SVG, 800ms spring)
│   │   └── MacroBar (EXTRACTED, x3 P/F/C, 600ms stagger)
│   └── WeeklyStatsRow (enhanced, 7-day dots)
├── [Tier 2, 30ms] TodaysPlanCard (5-state machine + MealSlots)
│   └── NextActionStrip (NEW, guided mode CTA)
├── [Tier 2] AiInsightCard (token alignment)
└── [Tier 3, RAF-gated] QuickActionsBar (token alignment)
```

### Wave Structure

```
Wave 1: TASK-P3-03, TASK-P3-04 (parallel — new files, no conflicts)
Wave 2: TASK-P3-05 (depends on Wave 1 — rewires NutritionSection)
Wave 3: TASK-P3-06, TASK-P3-07 (parallel — different files)
Wave 4: TASK-P3-08 (depends on all — orchestration + integration test)
```

---

### TASK-P3-03: Extract & Create CalorieRing + MacroBar Components

**Screen Group**: 3.1 Dashboard
**Effort**: M (1-3h)
**Priority**: P1

**Files to CREATE:**

- `src/features/dashboard/components/CalorieRing.tsx` — SVG circular progress ring (≥120px, animated 800ms spring fill)
- `src/features/dashboard/components/MacroBar.tsx` — Horizontal progress bar for P/F/C macro display
- `src/__tests__/CalorieRing.test.tsx` — Tests for CalorieRing
- `src/__tests__/MacroBar.test.tsx` — Tests for MacroBar

**Files to MODIFY:** None (create only — rewiring happens in TASK-P3-05)

**Files to DELETE:** None

**Dependencies:**

- Depends on: TASK-P3-00 (useReducedMotion for animation control)
- Blocks: TASK-P3-05 (NutritionSection rewire)

**Acceptance Criteria:**

- [ ] AC1: `CalorieRing` accepts `{ eaten: number; target: number; size?: number; className?: string }` props
- [ ] AC2: Renders SVG circle with `stroke: var(--color-macro-protein)` fill, `stroke: var(--color-border-subtle)` track
- [ ] AC3: Ring ≥120px diameter, stroke-dashoffset animated 800ms with `--ease-spring` on mount
- [ ] AC4: Center displays eaten/target text (e.g., "1327 / 2091")
- [ ] AC5: Respects `prefers-reduced-motion` — instant fill when reduced motion enabled
- [ ] AC6: `MacroBar` accepts `{ label: string; current: number; target: number; colorClass: string; testId: string }` props
- [ ] AC7: Renders horizontal bar `h-2 rounded-full`, fill width animated 600ms `--ease-enter`
- [ ] AC8: Shows label + "Xg / Yg" text below bar
- [ ] AC9: Color tokens: `bg-macro-protein`, `bg-macro-fat`, `bg-macro-carbs` (passed via `colorClass`)
- [ ] AC10: Both components memo-wrapped
- [ ] AC11: 100% test coverage for both

**User Stories Covered**: US-DASH-01 (Hero hierarchy — calorie ring ≥120px, macro bars labeled)
**Business Rules Applied**: BR-DASH-01 (Score badge + ring + macros), BR-POL-04 (GPU-only animation)
**Designer Spec Reference**: Section 3.1 — Calorie ring spec, Macro bar spec, Animation specs

---

### TASK-P3-04: Create ScoreBadge Component

**Screen Group**: 3.1 Dashboard
**Effort**: S (<1h)
**Priority**: P1

**Files to CREATE:**

- `src/features/dashboard/components/ScoreBadge.tsx` — Daily score badge (32px, color-coded)
- `src/__tests__/ScoreBadge.test.tsx` — Tests for ScoreBadge

**Files to MODIFY:** None

**Files to DELETE:** None

**Dependencies:**

- Depends on: TASK-P3-00 (useReducedMotion)
- Blocks: TASK-P3-05 (NutritionSection rewire)

**Acceptance Criteria:**

- [ ] AC1: `ScoreBadge` accepts `{ score: number; className?: string }` props
- [ ] AC2: Renders `text-stat-big` (32px) badge with score number
- [ ] AC3: Color thresholds: `≥80 → bg-success-subtle text-success border-success/20`, `≥50 → bg-warning-subtle text-warning border-warning/20`, `<50 → bg-muted text-muted-foreground border-border`
- [ ] AC4: Pulse animation on mount: `scale(1→1.05→1)` 400ms `--ease-spring`
- [ ] AC5: Reduced motion: no pulse
- [ ] AC6: `aria-label="Điểm hôm nay: {score} trên 100"`
- [ ] AC7: Memo-wrapped
- [ ] AC8: 100% test coverage

**User Stories Covered**: US-DASH-01 (Daily score badge 32px)
**Business Rules Applied**: BR-DASH-01 (score color thresholds)
**Designer Spec Reference**: Section 3.1 — Score badge spec

---

### TASK-P3-05: Refactor NutritionSection — Compose Extracted Components

**Screen Group**: 3.1 Dashboard
**Effort**: L (3-8h)
**Priority**: P1

**Files to MODIFY:**

- `src/features/dashboard/components/NutritionSection.tsx` — Remove inline ProgressRing + MacroBar definitions; import CalorieRing, MacroBar, ScoreBadge; restructure layout per Designer spec

**Files to MODIFY (test):**

- `src/__tests__/integration/dashboardEdgeCases.test.ts` — Update imports/assertions if component API changes

**Files to DELETE:** None (inline components are removed from NutritionSection, not separate files)

**Dependencies:**

- Depends on: TASK-P3-03 (CalorieRing, MacroBar), TASK-P3-04 (ScoreBadge)
- Blocks: TASK-P3-08 (Dashboard orchestration)

**Acceptance Criteria:**

- [ ] AC1: NutritionSection imports and renders `CalorieRing`, `MacroBar` (x3), `ScoreBadge` instead of inline implementations
- [ ] AC2: Layout matches Designer spec §3.1: Hero container with `bg-gradient-to-br from-card to-primary-subtle`
- [ ] AC3: Score badge positioned per spec (top-right of hero section)
- [ ] AC4: Calorie ring centered, ≥120px, with eaten/target labels
- [ ] AC5: 3 MacroBar instances below ring (Protein, Fat, Carbs) with 100ms stagger between bars
- [ ] AC6: First-time user setup prompt retained (EmptyState variant="compact")
- [ ] AC7: Greeting text uses `text-page font-bold` + user name from profile
- [ ] AC8: Remaining calories display: "Còn lại: X kcal" (positive) or "Vượt: X kcal" (negative, `text-destructive`)
- [ ] AC9: NutritionHeroSkeleton retained (inline, integrated with useMinimumDelay)
- [ ] AC10: File size reduced from ~425L to ~200L (extracted logic moved to CalorieRing/MacroBar/ScoreBadge)
- [ ] AC11: All existing dashboard tests pass without regression
- [ ] AC12: New test assertions added for CalorieRing/MacroBar/ScoreBadge composition; 0 test regressions from import changes
- [ ] AC13: 100% coverage maintained

**User Stories Covered**: US-DASH-01 (Hero hierarchy clarity)
**Business Rules Applied**: BR-DASH-01 (3-state hero: blocking/guided/passive), GCR-01 (semantic tokens only)
**Designer Spec Reference**: Section 3.1 — Dashboard Layout Blueprint, Token Usage table

---

### TASK-P3-06: Redesign TodaysPlanCard — 5-State Machine + MealSlots

**Screen Group**: 3.1 Dashboard
**Effort**: L (3-8h)
**Priority**: P1

**Files to MODIFY:**

- `src/features/dashboard/components/TodaysPlanCard.tsx` — Redesign all 5 states per Designer spec; add token alignment; enhance MealSlots inline component

**Files to MODIFY (test):**

- `src/__tests__/integration/dashboardEdgeCases.test.ts` — Add tests for all 5 states if not already covered

**Dependencies:**

- Depends on: TASK-P3-00 (press feedback, useDebounceAction)
- Blocks: TASK-P3-08 (Dashboard orchestration)

**Acceptance Criteria:**

- [ ] AC1: 5 states render distinct UI: `training-pending` (warning-subtle bg, "Bắt đầu tập" CTA), `training-partial` (info-subtle bg, "Tiếp tục" CTA + progress), `training-completed` (success-subtle bg, summary + PR badge), `rest-day` (muted bg, recovery tips + tomorrow preview), `no-plan` (EmptyState compact + "Tạo kế hoạch" CTA)
- [ ] AC2: Token alignment per Designer §3.1 token table: `border-warning/30` for pending, `border-success/30 bg-success-subtle` for completed, etc.
- [ ] AC3: MealSlots show 3 slots (breakfast/lunch/dinner) with `text-meal-breakfast/lunch/dinner` icons + mini progress
- [ ] AC4: SessionInfo shows "{completed}/{total} buổi tập" with session progress
- [ ] AC5: Rest day shows 5 rotation tips (indexed by dayOfYear % 5), tomorrow preview, current streak
- [ ] AC6: Quick actions on rest day: "Cân nặng" + "Cardio" chips with press feedback
- [ ] AC7: All CTAs use `useDebounceAction` to prevent double-tap
- [ ] AC8: All interactive elements have `.interactive` (press feedback) class
- [ ] AC9: `aria-label` on card: changes per state (e.g., "Kế hoạch hôm nay: Chờ bắt đầu")
- [ ] AC10: 100% test coverage for all 5 states

**User Stories Covered**: US-DASH-05 (TodaysPlanCard state machine)
**Business Rules Applied**: BR-DASH-02 (5-state machine), BR-DASH-03 (rest day tips rotation)
**Designer Spec Reference**: Section 3.1 — TodaysPlanCard spec, Token Usage table

---

### TASK-P3-07: NextActionStrip + WeeklyStatsRow Enhancement + AiInsightCard/QuickActionsBar Token Alignment

**Screen Group**: 3.1 Dashboard
**Effort**: M (1-3h)
**Priority**: P1

**Files to CREATE:**

- `src/features/dashboard/components/NextActionStrip.tsx` — Guided mode CTA strip (shown when `heroMode === 'guided'`)
- `src/__tests__/NextActionStrip.test.tsx` — Tests

**Files to MODIFY:**

- `src/features/dashboard/components/WeeklyStatsRow.tsx` — Enhance 7-day dots with color tokens from Designer spec; add adherence color thresholds (≥80% success, 50-79% warning, <50% destructive)
- `src/features/dashboard/components/AiInsightCard.tsx` — Token alignment only: `bg-ai-subtle text-foreground border-ai/20`
- `src/features/dashboard/components/QuickActionsBar.tsx` — Token alignment: `bg-muted text-foreground` + press feedback class

**Files to DELETE:** None

**Dependencies:**

- Depends on: TASK-P3-00 (press feedback CSS)
- Blocks: TASK-P3-08 (Dashboard orchestration)

**Acceptance Criteria:**

- [ ] AC1: `NextActionStrip` renders a contextual CTA based on `useDashboardOrchestration()` guided mode context
- [ ] AC2: Displays next recommended action: "Thêm bữa sáng" / "Bắt đầu tập" / "Cân nặng" with icon + arrow
- [ ] AC3: Background: `bg-primary-subtle`, text: `text-primary`, `active:scale-[0.97]`
- [ ] AC4: Only visible when `heroMode === 'guided'` (0 actions completed today)
- [ ] AC5: WeeklyStatsRow dots use Designer token colors: completed=`bg-success`, rest=`bg-muted`, missed=`bg-destructive`, upcoming=`bg-border`, today=`ring-2 ring-primary`
- [ ] AC6: Adherence progress bar color: `≥80% → stroke-success`, `50-79% → stroke-warning`, `<50% → stroke-destructive`
- [ ] AC7: AiInsightCard uses `bg-ai-subtle text-foreground border border-ai/20` (verify, fix if different)
- [ ] AC8: QuickActionsBar buttons use `bg-muted text-foreground` + `.interactive` class
- [ ] AC9: All modified files maintain 100% test coverage

**User Stories Covered**: US-DASH-02 (Zero-state progressive guidance), US-DASH-05 (Weekly stats clarity)
**Business Rules Applied**: BR-DASH-01 (guided mode NextActionStrip), GCR-01 (semantic tokens), IR-GLOB-01 (press feedback)
**Designer Spec Reference**: Section 3.1 — NextActionStrip, WeeklyStatsRow, AiInsightCard, QuickActionsBar specs

---

### TASK-P3-08: Dashboard Orchestration — Tiered Animation + Integration

**Screen Group**: 3.1 Dashboard
**Effort**: M (1-3h)
**Priority**: P1

**Files to MODIFY:**

- `src/features/dashboard/components/DashboardTab.tsx` — Implement 3-tier staggered animation choreography per Designer spec; integrate skeletons
- `src/features/dashboard/hooks/useDashboardOrchestration.ts` — Verify/align hero modes with NextActionStrip visibility logic

**Files to MODIFY (test):**

- `src/__tests__/integration/dashboardEdgeCases.test.ts` — Add integration tests for tiered animation, skeleton display, NextActionStrip visibility

**Dependencies:**

- Depends on: TASK-P3-02 (skeletons), TASK-P3-05 (NutritionSection), TASK-P3-06 (TodaysPlanCard), TASK-P3-07 (NextActionStrip + enhancements)
- Blocks: Nothing (final dashboard task)

**Acceptance Criteria:**

- [ ] AC1: Tier 1 (CombinedHero) renders immediately; Tier 2 (TodaysPlanCard + AiInsightCard) renders with 30ms stagger; Tier 3 (QuickActionsBar) renders on `requestAnimationFrame`
- [ ] AC2: Each tier uses `opacity 0→1` + `translateY(8px→0)` 200ms `--ease-enter` animation
- [ ] AC3: Skeletons (TodaysPlanCardSkeleton, AiInsightCardSkeleton) shown via `useMinimumDelay` during data loading
- [ ] AC4: `useDashboardOrchestration` heroMode controls NextActionStrip visibility: BLOCKING→no strip, GUIDED→show strip, PASSIVE→no strip
- [ ] AC5: Tab switch animation: incoming content fades in with `opacity+translateY` 200ms
- [ ] AC6: `aria-label="Tổng quan hôm nay"` on dashboard container
- [ ] AC7: Reduced motion: all stagger delays = 0, all animations instant
- [ ] AC8: Full dashboard integration test covers: skeleton→content transition, all 3 hero modes, tier animation order
- [ ] AC9: Hook consolidation verified: no dashboard hook subscribes to >3 stores; no duplicated data derivation across hooks (US-DASH-04)
- [ ] AC10: All interactive elements in refactored Dashboard components have `.interactive` class (press feedback IR-GLOB-01)
- [ ] AC11: Dashboard focus order matches Designer spec: Score → Ring → Macros → Plan Card → Insight → Quick Actions (keyboard tab order)
- [ ] AC12: Lint 0, Build clean, 100% coverage maintained

**User Stories Covered**: US-DASH-03 (Skeleton loading all tiers), US-DASH-04 (Hook consolidation — verify no data duplication, <3 stores per hook)
**Business Rules Applied**: BR-DASH-01 (3-tier hierarchy), BR-DASH-04 (hook consolidation), BR-POL-04 (GPU-only animation), GCR-05 (200ms skeleton)
**Designer Spec Reference**: Section 3.1 — Animation Choreography, Dashboard Load Choreography sequence

---

## 5. PHASE 3.2 — CALENDAR + MEALS (HIGH-LEVEL)

> Will be detailed when Phase 3.1 completes. High-level plan below.

### Tasks Identified

| Task ID    | Title                                                                     | Effort | Key Changes                             |
| ---------- | ------------------------------------------------------------------------- | ------ | --------------------------------------- |
| TASK-P3-10 | RecentDishChips + MealProgressBar components                              | M      | CREATE 2 new components + tests         |
| TASK-P3-11 | Extract DishRow from MealSlot + MealSlot redesign                         | L      | MODIFY MealSlot.tsx, CREATE DishRow.tsx |
| TASK-P3-12 | Calendar date strip token alignment + meal indicators                     | S      | MODIFY DateSelector.tsx                 |
| TASK-P3-13 | NutritionSubTab token alignment + recommendation panel                    | M      | MODIFY NutritionSubTab.tsx, Summary.tsx |
| TASK-P3-14 | Calendar skeleton variants (MealSlotSkeleton x3, NutritionSubTabSkeleton) | S      | CREATE 2 skeleton files                 |

**User Stories**: US-CAL-01 through US-CAL-06
**Wave Structure**: Wave 1 (10, 14 parallel) → Wave 2 (11, 12, 13 parallel)

### Key Files Affected

- `src/components/schedule/MealsSubTab.tsx`
- `src/components/schedule/MealSlot.tsx`
- `src/components/DateSelector.tsx`
- `src/components/nutrition/NutritionSubTab.tsx`
- `src/components/nutrition/EnergyBalanceCard.tsx`
- `src/components/Summary.tsx`

---

## 6. PHASE 3.3 — LIBRARY (HIGH-LEVEL)

### Tasks Identified

| Task ID    | Title                                                                        | Effort | Key Changes                                         |
| ---------- | ---------------------------------------------------------------------------- | ------ | --------------------------------------------------- |
| TASK-P3-15 | Extract DishGridCard + DishListRow from DishManager                          | L      | MODIFY DishManager.tsx (876L→~400L), CREATE 2 files |
| TASK-P3-16 | Library "Gần đây" section + filter chips                                     | M      | MODIFY ManagementTab.tsx, CREATE RecentSection      |
| TASK-P3-17 | IngredientManager token alignment + 2×2 macro grid                           | M      | MODIFY IngredientManager.tsx                        |
| TASK-P3-18 | Library skeleton variants (DishGridCardSkeleton x6, DishListRowSkeleton x10) | S      | CREATE 2 files                                      |

**User Stories**: US-LIB-01 through US-LIB-04
**Wave Structure**: Wave 1 (15, 18 parallel) → Wave 2 (16, 17 parallel)

### Key Files Affected

- `src/components/DishManager.tsx`
- `src/components/ManagementTab.tsx`
- `src/components/IngredientManager.tsx`

---

## 7. PHASE 3.4 — ONBOARDING (HIGH-LEVEL)

### Pre-Requisite: Test coverage exists (3 test files confirmed)

### Tasks Identified

| Task ID    | Title                                                   | Effort | Key Changes                                                                              |
| ---------- | ------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| TASK-P3-20 | Migrate HealthBasicStep to CompactForm archetype        | L      | MODIFY HealthBasicStep.tsx, ActivityLevelStep.tsx, use CompactForm + ButtonGroupSelector |
| TASK-P3-21 | Simplify onboarding flow: 7→6 screens per Designer spec | M      | MODIFY UnifiedOnboarding.tsx, OnboardingProgress.tsx                                     |
| TASK-P3-22 | Step transition animation (translateX) + field stagger  | M      | MODIFY UnifiedOnboarding.tsx (AnimatePresence config)                                    |
| TASK-P3-23 | Onboarding token alignment + empty state configs        | S      | MODIFY WelcomeSlides.tsx, HealthConfirmStep.tsx                                          |

**User Stories**: US-ONB-01 through US-ONB-05
**Dependencies**: TASK-P3-01 (CompactForm) MUST be complete
**Wave Structure**: Wave 1 (21) → Wave 2 (20, 23 parallel) → Wave 3 (22)

### Key Files Affected

- `src/components/UnifiedOnboarding.tsx`
- `src/components/onboarding/HealthBasicStep.tsx`
- `src/components/onboarding/ActivityLevelStep.tsx`
- `src/components/onboarding/OnboardingProgress.tsx`
- `src/components/onboarding/WelcomeSlides.tsx`
- `src/components/onboarding/HealthConfirmStep.tsx`

---

## 8. PHASE 3.5 — SETTINGS (HIGH-LEVEL)

### Tasks Identified

| Task ID    | Title                                                                    | Effort | Key Changes                                                                   |
| ---------- | ------------------------------------------------------------------------ | ------ | ----------------------------------------------------------------------------- |
| TASK-P3-25 | Settings cards with status badges + token alignment                      | M      | MODIFY SettingsMenu.tsx (status badge: configured/needs-attention/not-set-up) |
| TASK-P3-26 | Migrate HealthProfileForm to CompactForm archetype                       | L      | MODIFY HealthProfileForm.tsx (555L), GoalPhaseSelector.tsx (365L)             |
| TASK-P3-27 | Settings skeleton variants + progressive disclosure for training profile | M      | MODIFY TrainingProfileDetailPage.tsx, CREATE SettingsCardSkeleton             |

**User Stories**: US-SET-01 through US-SET-04
**Dependencies**: TASK-P3-01 (CompactForm) MUST be complete
**Wave Structure**: Wave 1 (25, 27 parallel) → Wave 2 (26)

### Key Files Affected

- `src/components/settings/SettingsMenu.tsx`
- `src/features/health-profile/components/HealthProfileForm.tsx`
- `src/features/health-profile/components/GoalPhaseSelector.tsx`
- `src/components/settings/TrainingProfileDetailPage.tsx`

---

## 9. PHASE 3.6 — FITNESS (HIGH-LEVEL, 5 Sub-Phases)

> Per CEO Decision Q5: Fitness by state. Largest module (63 files, 13.7K LOC).

### Sub-Phase Structure

| Sub-Phase | Focus                            | Tasks | Effort | Dependencies |
| --------- | -------------------------------- | ----- | ------ | ------------ |
| **3.6.1** | Empty State + Plan Creation      | 2     | M      | Phase 3.0    |
| **3.6.2** | Template Gallery                 | 1     | M      | 3.6.1        |
| **3.6.3** | Active Plan Weekly View          | 2     | L      | 3.6.2        |
| **3.6.4** | Workout Logger (TASK-09 overlay) | 2     | XL     | 3.6.3        |
| **3.6.5** | Progress Dashboard               | 1     | L      | 3.6.3        |

### Task IDs

| Task ID    | Sub-Phase | Title                                                               | Effort |
| ---------- | --------- | ------------------------------------------------------------------- | ------ |
| TASK-P3-30 | 3.6.1     | FitnessEmptyState redesign (hero variant + dual CTAs)               | S      |
| TASK-P3-31 | 3.6.1     | FitnessTab token alignment + SubTabBar animation                    | M      |
| TASK-P3-32 | 3.6.2     | PlanTemplateGallery cards with TemplateMatchBadge + difficulty dots | M      |
| TASK-P3-33 | 3.6.3     | WeeklyCalendarStrip redesign (7-day strip with completion states)   | M      |
| TASK-P3-34 | 3.6.3     | TodayWorkoutCard + PlanDayCards token alignment                     | L      |
| TASK-P3-35 | 3.6.4     | WorkoutLogger — set log table + rest timer redesign                 | XL     |
| TASK-P3-36 | 3.6.4     | ExerciseWorkoutCard + SetEditor token alignment                     | L      |
| TASK-P3-37 | 3.6.5     | ProgressDashboard — charts + adherence circle + plateau alert       | L      |

**User Stories**: US-FIT-01 through US-FIT-05
**Key Risk**: Fitness has only 6 test files for 63 component files. Test coverage MUST be verified/increased before redesign per Memory rule.

### Key Files Affected (per sub-phase, no cross-sub-phase conflicts)

**3.6.1**: FitnessEmptyState.tsx, FitnessTab.tsx
**3.6.2**: PlanTemplateGallery.tsx, TemplateMatchBadge.tsx
**3.6.3**: WeeklyCalendarStrip.tsx, TrainingPlanView.tsx, PlanDayEditor.tsx
**3.6.4**: WorkoutLogger.tsx, SetEditor.tsx, ExerciseWorkoutCard.tsx, RestTimer.tsx
**3.6.5**: ProgressDashboard.tsx, MilestonesList.tsx, StreakCounter.tsx

---

## 10. PHASE 3.7 — AI ANALYSIS (HIGH-LEVEL)

### Tasks Identified

| Task ID    | Title                                                   | Effort | Key Changes                                                                 |
| ---------- | ------------------------------------------------------- | ------ | --------------------------------------------------------------------------- |
| TASK-P3-40 | AI first-visit experience + value proposition banner    | M      | MODIFY AIImageAnalyzer.tsx (add banner, best practices card, usage counter) |
| TASK-P3-41 | ConfidenceBadge + IngredientConfidenceDot + FeedbackRow | M      | CREATE 3 new components, MODIFY AnalysisResultView.tsx                      |
| TASK-P3-42 | AI skeleton variant + token alignment                   | S      | CREATE AnalysisResultSkeleton.tsx, MODIFY ImageCapture.tsx                  |

**User Stories**: US-AI-01 through US-AI-04
**Wave Structure**: Wave 1 (42) → Wave 2 (40, 41 parallel)

### Key Files Affected

- `src/components/AIImageAnalyzer.tsx`
- `src/components/AnalysisResultView.tsx`
- `src/components/ImageCapture.tsx`

---

## 11. PHASE 3.8 — GLOBAL POLISH (HIGH-LEVEL)

> Runs AFTER all screen redesigns complete. Cross-cutting concerns.

### Tasks Identified

| Task ID    | Title                                                                        | Effort | Key Changes                                              |
| ---------- | ---------------------------------------------------------------------------- | ------ | -------------------------------------------------------- |
| TASK-P3-50 | Apply `.interactive` press feedback to ALL interactive elements project-wide | M      | MODIFY ~20 files (grep for `<button`, add class)         |
| TASK-P3-51 | Verify dark mode token inversion across all redesigned screens               | M      | Manual test + fix token issues                           |
| TASK-P3-52 | Accessibility audit — ARIA labels, focus order, screen reader announcements  | L      | MODIFY ~15 files per Designer §Accessibility Annotations |

**User Stories**: US-POL-01 through US-POL-03
**Dependencies**: ALL Phases 3.1–3.7 complete

---

## 12. FILE OWNERSHIP MATRIX — Phase 3.0 + 3.1

### Phase 3.0 Foundation

| File                                                           | TASK-P3-00 | TASK-P3-01 | TASK-P3-02 | Conflict? |
| -------------------------------------------------------------- | :--------: | :--------: | :--------: | :-------: |
| `src/hooks/useMinimumDelay.ts`                                 |   CREATE   |            |            |   ✅ No   |
| `src/hooks/useDebounceAction.ts`                               |   CREATE   |            |            |   ✅ No   |
| `src/hooks/useReducedMotion.ts`                                |   CREATE   |            |            |   ✅ No   |
| `src/index.css`                                                |   MODIFY   |            |            |   ✅ No   |
| `src/components/shared/CompactForm.tsx`                        |            |   CREATE   |            |   ✅ No   |
| `src/components/shared/ButtonGroupSelector.tsx`                |            |   CREATE   |            |   ✅ No   |
| `src/__tests__/CompactForm.test.tsx`                           |            |   CREATE   |            |   ✅ No   |
| `src/__tests__/ButtonGroupSelector.test.tsx`                   |            |   CREATE   |            |   ✅ No   |
| `src/features/dashboard/components/TodaysPlanCardSkeleton.tsx` |            |            |   CREATE   |   ✅ No   |
| `src/features/dashboard/components/AiInsightCardSkeleton.tsx`  |            |            |   CREATE   |   ✅ No   |
| `src/__tests__/dashboardSkeletons.test.tsx`                    |            |            |   CREATE   |   ✅ No   |

**Foundation Conflict Analysis: ✅ ZERO conflicts — all 3 tasks can run in parallel.**

### Phase 3.1 Dashboard

| File                             | P3-03  | P3-04  | P3-05  | P3-06  | P3-07  | P3-08  |     Conflict?     |
| -------------------------------- | :----: | :----: | :----: | :----: | :----: | :----: | :---------------: |
| `CalorieRing.tsx` (NEW)          | CREATE |        |        |        |        |        |       ✅ No       |
| `MacroBar.tsx` (NEW)             | CREATE |        |        |        |        |        |       ✅ No       |
| `CalorieRing.test.tsx` (NEW)     | CREATE |        |        |        |        |        |       ✅ No       |
| `MacroBar.test.tsx` (NEW)        | CREATE |        |        |        |        |        |       ✅ No       |
| `ScoreBadge.tsx` (NEW)           |        | CREATE |        |        |        |        |       ✅ No       |
| `ScoreBadge.test.tsx` (NEW)      |        | CREATE |        |        |        |        |       ✅ No       |
| `NutritionSection.tsx`           |        |        | MODIFY |        |        |        |       ✅ No       |
| `TodaysPlanCard.tsx`             |        |        |        | MODIFY |        |        |       ✅ No       |
| `NextActionStrip.tsx` (NEW)      |        |        |        |        | CREATE |        |       ✅ No       |
| `NextActionStrip.test.tsx` (NEW) |        |        |        |        | CREATE |        |       ✅ No       |
| `WeeklyStatsRow.tsx`             |        |        |        |        | MODIFY |        |       ✅ No       |
| `AiInsightCard.tsx`              |        |        |        |        | MODIFY |        |       ✅ No       |
| `QuickActionsBar.tsx`            |        |        |        |        | MODIFY |        |       ✅ No       |
| `DashboardTab.tsx`               |        |        |        |        |        | MODIFY |       ✅ No       |
| `useDashboardOrchestration.ts`   |        |        |        |        |        | MODIFY |       ✅ No       |
| `dashboardEdgeCases.test.ts`     |        |        | MODIFY | MODIFY |        | MODIFY | ⚠️ **Sequential** |

**Dashboard Conflict Analysis: ✅ ZERO production file conflicts.**
**⚠️ Test file `dashboardEdgeCases.test.ts`** is modified by P3-05, P3-06, P3-08. Mitigated by wave ordering: P3-05 runs in Wave 2, P3-06 in Wave 3, P3-08 in Wave 4 — never parallel. **Conflict resolution rules**: (1) P3-05 must keep existing test structure, only update imports for extracted components. (2) P3-06 must only ADD new test cases for 5-state machine, NOT restructure existing tests. (3) P3-08 verifies ALL existing tests pass before adding integration tests.

---

## 13. RISK MITIGATION

### Risk 1: Test-Before-Redesign for Onboarding & Fitness

**Situation**: Onboarding has 3 test files, Fitness has 6. Both have sufficient baseline coverage.

**Mitigation**:

- Before TASK-P3-20 (Onboarding): Run `npx vitest run src/__tests__/unifiedOnboarding* --coverage` to verify baseline. If coverage < 80%, add tests FIRST.
- Before TASK-P3-30 (Fitness): Run `npx vitest run src/__tests__/Fitness* src/__tests__/fitness* --coverage` to verify. Fitness components without tests (30/36) will need tests added IN the same task that modifies them.

**Rule**: Each task that MODIFIES a file MUST ensure 100% coverage for that file. If pre-existing coverage is low, the task includes writing tests.

### Risk 2: TASK-08/09 Deferred from Phase 2

**TASK-08 (CompactForm)**: Now TASK-P3-01 in Phase 3.0. Blocks 3.4 + 3.5 but NOT 3.1/3.2/3.3. Schedule early in Wave 1 of Phase 3.0.

**TASK-09 (Large Workflow Overlay)**: Already satisfied by existing `PageLayout` component. The Designer spec §TASK-09 describes exactly what PageLayout already implements (sticky header + scrollable content + sticky footer + safe area). Only minor token alignment needed. **No dedicated task required** — alignment happens in TASK-P3-35 (WorkoutLogger) when that overlay is redesigned.

### Risk 3: Rollback Strategy

**Per-wave rollback**: Each wave = 1 atomic commit. If a wave's quality gate fails:

1. `git stash` all changes from that wave
2. Investigate failing tests/lint
3. Fix and re-run quality gates
4. Only commit when gates pass

**Per-sub-phase rollback**: Each sub-phase (3.0, 3.1, 3.2...) is independently shippable. If sub-phase 3.2 fails badly, revert its commits — 3.1 remains intact.

**Feature flags**: Not needed. All changes are visual refinements of existing components, not new features. No runtime feature flags required.

### Risk 4: Large File Refactoring (NutritionSection 425L, DishManager 876L, TodaysPlanCard 422L)

**Mitigation**: Each large file is handled by exactly ONE task (no parallel modifications). The extraction pattern is:

1. Create new component file with extracted logic
2. Add tests for new component
3. Modify original file to import new component
4. Verify existing tests pass
5. All in one atomic task

### Risk 5: Cross-Screen Shared Component Changes

**Mitigation**: Phase 3.0 creates shared utilities BEFORE any screen task starts. No screen task creates shared components — they only consume them.

Exception: `src/index.css` (Phase 1 tokens) is modified ONLY in TASK-P3-00 and never again in Phase 3. No conflict.

---

## 14. DEPENDENCY GRAPH SUMMARY

```
PHASE 3.0 (Foundation)
  ├── TASK-P3-00: Animation/Interaction Utilities [no deps, BLOCKS ALL]
  ├── TASK-P3-01: CompactForm Archetype [no deps, BLOCKS 3.4+3.5]
  └── TASK-P3-02: Dashboard Skeletons [deps: P3-00, BLOCKS P3-08]

PHASE 3.1 (Dashboard) — depends on 3.0
  Wave 1: TASK-P3-03 ∥ TASK-P3-04 [deps: P3-00]
  Wave 2: TASK-P3-05 [deps: P3-03, P3-04]
  Wave 3: TASK-P3-06 ∥ TASK-P3-07 [deps: P3-00; P3-06 independent; P3-07 independent]
  Wave 4: TASK-P3-08 [deps: P3-02, P3-05, P3-06, P3-07]

PHASE 3.2 (Calendar) — depends on 3.0, parallel with 3.1
  Wave 1: TASK-P3-10 ∥ TASK-P3-14
  Wave 2: TASK-P3-11 ∥ TASK-P3-12 ∥ TASK-P3-13

PHASE 3.3 (Library) — depends on 3.0, parallel with 3.1
  Wave 1: TASK-P3-15 ∥ TASK-P3-18
  Wave 2: TASK-P3-16 ∥ TASK-P3-17

PHASE 3.4 (Onboarding) — depends on 3.0 + TASK-P3-01
  Wave 1: TASK-P3-21
  Wave 2: TASK-P3-20 ∥ TASK-P3-23
  Wave 3: TASK-P3-22

PHASE 3.5 (Settings) — depends on 3.0 + TASK-P3-01
  Wave 1: TASK-P3-25 ∥ TASK-P3-27
  Wave 2: TASK-P3-26

PHASE 3.6 (Fitness) — depends on 3.0, sequential sub-phases
  3.6.1: TASK-P3-30 ∥ TASK-P3-31
  3.6.2: TASK-P3-32 [deps: 3.6.1]
  3.6.3: TASK-P3-33 ∥ TASK-P3-34 [deps: 3.6.2]
  3.6.4: TASK-P3-35 ∥ TASK-P3-36 [deps: 3.6.3]
  3.6.5: TASK-P3-37 [deps: 3.6.3]

PHASE 3.7 (AI) — depends on 3.0, parallel with others
  Wave 1: TASK-P3-42
  Wave 2: TASK-P3-40 ∥ TASK-P3-41

PHASE 3.8 (Polish) — depends on ALL above
  TASK-P3-50, TASK-P3-51, TASK-P3-52 (sequential)
```

### Critical Path

```
P3-00 → P3-03/04 → P3-05 → P3-08 → [Phase 3.1 DONE]
                                    ↓
P3-01 → P3-21 → P3-20 → P3-22 → [Phase 3.4 DONE]
                                    ↓
                 → P3-26 → [Phase 3.5 DONE]
                                    ↓
P3-00 → P3-30/31 → P3-32 → P3-33/34 → P3-35/36 → [Phase 3.6 DONE]
                                                      ↓
                                               P3-50 → P3-51 → P3-52 → [Phase 3.8 DONE]
```

**Estimated total calendar time** (with parallelism):

- Phase 3.0: 1 day
- Phase 3.1: 2 days
- Phases 3.2+3.3+3.7 (parallel): 2 days
- Phases 3.4+3.5 (parallel): 2 days
- Phase 3.6 (sequential sub-phases): 4 days
- Phase 3.8: 1 day
- **Total: ~12 working days** with maximum parallelism

---

## APPENDIX A: USER STORIES ↔ TASK MAPPING

| User Story                      | Task(s)                               | Phase |
| ------------------------------- | ------------------------------------- | ----- |
| US-DASH-01                      | P3-03, P3-04, P3-05                   | 3.1   |
| US-DASH-02                      | P3-07                                 | 3.1   |
| US-DASH-03 (Skeleton Loading)   | P3-02, P3-08                          | 3.1   |
| US-DASH-04 (Hook Consolidation) | P3-08                                 | 3.1   |
| US-DASH-05 (TodaysPlanCard)     | P3-06                                 | 3.1   |
| US-CAL-01–06                    | P3-10 through P3-14                   | 3.2   |
| US-LIB-01–04                    | P3-15 through P3-18                   | 3.3   |
| US-ONB-01–05                    | P3-20 through P3-23                   | 3.4   |
| US-SET-01–04                    | P3-25 through P3-27                   | 3.5   |
| US-FIT-01–05                    | P3-30 through P3-37                   | 3.6   |
| US-AI-01–04                     | P3-40 through P3-42                   | 3.7   |
| US-POL-01–03                    | P3-50 through P3-52                   | 3.8   |
| GCR-01–10                       | P3-00 (foundation) + each screen task | All   |

## APPENDIX B: BUSINESS RULES ↔ TASK MAPPING

| Key Business Rules             | Task(s)      | Notes                          |
| ------------------------------ | ------------ | ------------------------------ |
| BR-DASH-01 (3-tier hero)       | P3-05, P3-08 | Hero hierarchy + orchestration |
| BR-DASH-02 (5-state plan card) | P3-06        | TodaysPlanCard states          |
| BR-POL-04 (GPU-only animation) | P3-00        | Foundation — enforced in CSS   |
| GCR-05 (200ms skeleton)        | P3-00, P3-02 | Hook + skeleton components     |
| BR-ONB-06 (44px touch targets) | P3-01        | CompactForm enforces this      |
| IR-GLOB-01 (press feedback)    | P3-00, P3-50 | CSS + global application       |

## APPENDIX C: EFFORT SUMMARY

| Effort    | Count  | Tasks                                                                                                                 |
| --------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| S (<1h)   | 8      | P3-02, P3-04, P3-12, P3-14, P3-18, P3-23, P3-30, P3-42                                                                |
| M (1-3h)  | 17     | P3-00, P3-03, P3-07, P3-08, P3-10, P3-13, P3-16, P3-17, P3-21, P3-22, P3-25, P3-27, P3-31, P3-32, P3-40, P3-41, P3-51 |
| L (3-8h)  | 11     | P3-01, P3-05, P3-06, P3-11, P3-15, P3-20, P3-26, P3-34, P3-36, P3-37, P3-52                                           |
| XL (>8h)  | 1      | P3-35                                                                                                                 |
| **Total** | **37** | —                                                                                                                     |

---

> **KẾ*HOẠCH_KỸ_THUẬT*ĐÃ_CHỐT** — Ready for Orchestrator to spawn Dev agents per task.
