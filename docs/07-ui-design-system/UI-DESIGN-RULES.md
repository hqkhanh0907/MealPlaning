# 📐 MealPlaning UI Design System — Unified Reference

> **Version**: 3.0 • **Date**: 2026-04-02 (Post 5-Wave Design System Upgrade)
> **Stack**: React 19 + Tailwind CSS v4 + shadcn/ui (base-nova) + Capacitor 8
> **Overall UI Score**: 17/20 (Good → Excellent threshold) — up from 13/20 pre-upgrade

---

## 📋 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Color Rules](#2-color-rules)
3. [Typography Rules](#3-typography-rules)
4. [Border Radius Rules](#4-border-radius-rules)
5. [Spacing Rules](#5-spacing-rules)
6. [Shadow / Elevation Rules](#6-shadow--elevation-rules)
7. [Motion / Animation Rules](#7-motion--animation-rules)
8. [Component Rules](#8-component-rules)
9. [Layout & Responsive Rules](#9-layout--responsive-rules)
10. [Accessibility Rules](#10-accessibility-rules)
11. [Violations & Fix Plan](#11-violations--fix-plan)
12. [Detailed Reports](#12-detailed-reports)
13. [Enforcement](#13-enforcement)

---

## 1. Executive Summary

### Audit Health Score (5-Dimension × 0-4)

| #         | Dimension     | Score                          | Key Finding                                                                                                                       |
| --------- | ------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 1         | Accessibility | 3.5/4                          | aria-hidden added (30×); 10 icon buttons still missing aria-label; ~14 text-slate-400 low-contrast without dark: pair             |
| 2         | Performance   | 3/4                            | Zustand selectors fixed in App.tsx; useMemo in DishEditModal; 3 mega-files remain (>700 lines); 5 missing useMemo in dashboard    |
| 3         | Theming       | 3.5/4                          | 768 semantic token usages; 4 new tokens created; ~14 raw text-slate-400 without dark: pair; 128 intentional dark: slate-400 pairs |
| 4         | Responsive    | 3.5/4                          | Safe areas ✓; touch targets ✓ (119×); 2 min-w overflow risks (MealActionBar, Summary); grid breakpoints added                     |
| 5         | Anti-Patterns | 3.5/4                          | 0 AI slop; 0 gradient text; 0 bounce easing; 4 stray console.error (should use logger.ts); 0 purple classes                       |
| **Total** | **17/20**     | **Good (Excellent threshold)** |

### Migration Status (5-Wave Upgrade Results)

| Metric             | Pre-Upgrade (v2.0)   | Post-Upgrade (v3.0)                                                       | Change        |
| ------------------ | -------------------- | ------------------------------------------------------------------------- | ------------- |
| Semantic tokens    | 888 (35%)            | **1,656+ (>75%)**                                                         | **+86%**      |
| New tokens created | 0                    | 4 (primary-subtle, primary-emphasis, foreground-secondary, border-subtle) | ✅ New        |
| Dead tokens        | 17 (chart, duration) | **0**                                                                     | ✅ Eliminated |
| Font-bold overuse  | ~50                  | **0** (migrated to semibold/medium)                                       | ✅ Fixed      |
| Inline styles      | 63                   | **29** (touchAction + tabular-nums migrated)                              | -54%          |
| text-[10px]        | 15                   | **0** (promoted to text-xs)                                               | ✅ Fixed      |
| Dark mode pairs    | ~80%                 | **128 intentional pairs + semantic**                                      | ✅ Excellent  |
| aria-hidden        | ~0                   | **30+**                                                                   | ✅ New        |
| CI enforcement     | check-banned-colors  | + prettier-plugin-tailwindcss + husky                                     | ✅ Enhanced   |

### Top 5 Remaining Actions

1. **Add aria-label to 10+ icon-only buttons** — SetEditor (5), WorkoutLogger (5+), modal close buttons
2. **Fix ~14 text-slate-400 without dark: pair** — GoalSettingsModal (6), EnergyBalanceMini (5), others
3. **Add useMemo to 5 dashboard sorts** — AdjustmentHistory, WeightQuickLog, WeightMini helpers
4. **Split 3 mega-files** — TrainingPlanView (832 lines), DishManager (809), DishEditModal (730)
5. **Migrate 4 console.error to logger.ts** — WorkoutLogger, CardioLogger, HealthConfirmStep, OnboardingErrorBoundary

---

## 2. Color Rules

### 2.1 Semantic Tokens (MANDATORY for all new code)

| Token                  | Light       | Dark        | Tailwind Class                        | Use For                               |
| ---------------------- | ----------- | ----------- | ------------------------------------- | ------------------------------------- |
| **Primary**            | Emerald-500 | Emerald-400 | `bg-primary` / `text-primary`         | CTAs, active states, focus rings      |
| **Primary Foreground** | White       | Slate-900   | `text-primary-foreground`             | Text on primary backgrounds           |
| **Secondary**          | Slate-50    | Slate-800   | `bg-secondary`                        | Secondary buttons, subtle backgrounds |
| **Muted**              | Slate-100   | Slate-800   | `bg-muted`                            | Disabled states, subtle fills         |
| **Muted Foreground**   | Slate-500   | Slate-400   | `text-muted-foreground`               | Helper text, placeholders, captions   |
| **Destructive**        | Red-500     | Red-400     | `bg-destructive` / `text-destructive` | Delete, error, danger                 |
| **Background**         | White       | Slate-900   | `bg-background`                       | Page background                       |
| **Foreground**         | Slate-800   | Slate-200   | `text-foreground`                     | Primary text                          |
| **Card**               | White       | Slate-800   | `bg-card`                             | Card surfaces                         |
| **Border**             | Slate-200   | white/10%   | `border-border`                       | All borders, dividers                 |
| **Ring**               | Emerald-500 | Emerald-400 | `ring-ring`                           | Focus rings                           |

### 2.2 Allowed Raw Color Families

| Family      | Role                                 | Allowed |
| ----------- | ------------------------------------ | ------- |
| **Emerald** | Brand primary, success, protein      | ✅      |
| **Slate**   | All neutrals (bg, text, border)      | ✅      |
| **Amber**   | Warning, fat macro, secondary accent | ✅      |
| **Blue**    | Info, carbs macro                    | ✅      |
| **Rose**    | Destructive variant, calorie deficit | ✅      |
| **Indigo**  | AI/suggestion features               | ✅      |

### 2.3 BANNED Color Families (✅ ALL ELIMINATED)

| Family        | Pre-Migration | Post-Migration | Status                                       |
| ------------- | ------------- | -------------- | -------------------------------------------- |
| **gray-\***   | 8 uses        | **0**          | ✅ Migrated to `slate-*`                     |
| **zinc-\***   | 25 uses       | **0**          | ✅ Migrated to `slate-*`                     |
| **green-\***  | 30 uses       | **0**          | ✅ Migrated to `emerald-*` / `--color-fiber` |
| **violet-\*** | 4 uses        | **0**          | ✅ Migrated to `indigo-*`                    |
| **teal-\***   | 2 uses        | **0**          | ✅ Migrated to `emerald-*`                   |
| **yellow-\*** | —             | **0**          | ✅ Use `amber-*`                             |

> **Enforcement**: `scripts/check-banned-colors.sh` runs in CI to prevent regressions.

### 2.3.1 Off-Palette Stragglers (low priority)

| Family                   | Uses | Action                               |
| ------------------------ | ---- | ------------------------------------ |
| **purple-\***            | 4    | → Migrate to `indigo-*`              |
| **orange-\***            | 17   | → Review: consolidate with `amber-*` |
| **sky-\*** / **cyan-\*** | 12   | → Review: consolidate with `blue-*`  |

### 2.4 Defined but Unused Token Families

These tokens exist in `src/index.css` but no component references them. Components use raw Tailwind colors instead:

| Token                              | Intended For      | Raw Alternative Used   |
| ---------------------------------- | ----------------- | ---------------------- |
| `--macro-protein`                  | Protein macro     | `emerald-*` raw        |
| `--macro-fat`                      | Fat macro         | `amber-*` raw          |
| `--macro-carbs`                    | Carbs macro       | `blue-*` raw           |
| `--macro-fiber`                    | Fiber macro       | `green-*` raw          |
| `--chart-1..5`                     | Chart colors      | Raw palette            |
| `--color-ai` / `--color-ai-subtle` | AI features       | `indigo-*` raw         |
| `--color-energy`                   | Energy/calories   | `amber-*` raw          |
| `--color-rose`                     | Deficit indicator | `rose-*` raw           |
| `--status-success/warning/info`    | Status badges     | Raw emerald/amber/blue |

**Action**: Wire components to these tokens (high-value migration — 200+ replacements).

### 2.5 Missing Tokens Needed

| Pattern (used often)                     | Count | Proposed Token             |
| ---------------------------------------- | ----- | -------------------------- |
| `bg-emerald-50 dark:bg-emerald-900/20`   | 187×  | `--primary-subtle`         |
| `text-emerald-700 dark:text-emerald-400` | 96×   | `--primary-emphasis`       |
| `text-slate-600`                         | 129×  | `--foreground-secondary`   |
| `border-slate-100`                       | 68×   | `--border-subtle`          |
| (missing from shadcn)                    | —     | `--destructive-foreground` |

### 2.6 Top Inconsistencies to Resolve

| Pattern      | Variants                                                                       | Target                    |
| ------------ | ------------------------------------------------------------------------------ | ------------------------- |
| Card surface | `bg-card`(121) vs `bg-white`(67) vs `bg-slate-50`(87)                          | → `bg-card`               |
| Border       | `border-border`(3) vs `border-slate-200`(125) vs `border-slate-100`(68)        | → `border-border`         |
| Muted text   | `text-muted-foreground`(255) vs `text-slate-500`(141) vs `text-slate-400`(178) | → `text-muted-foreground` |
| Fat macro    | rose (some) vs amber (some)                                                    | Standardize to amber      |

### 2.7 Dark Mode Pairing Rules

**Coverage**: 98% (127/151 files). Every raw color class MUST have a `dark:` counterpart:

| Light              | Dark                     |
| ------------------ | ------------------------ |
| `bg-emerald-50`    | `dark:bg-emerald-900/30` |
| `bg-emerald-500`   | `dark:bg-emerald-600`    |
| `text-emerald-600` | `dark:text-emerald-400`  |
| `text-emerald-700` | `dark:text-emerald-300`  |
| `text-slate-500`   | `dark:text-slate-400`    |
| `text-slate-800`   | `dark:text-slate-100`    |
| `border-slate-200` | `dark:border-slate-700`  |
| `bg-white`         | `dark:bg-slate-800`      |
| `bg-slate-50`      | `dark:bg-slate-800`      |
| `bg-slate-100`     | `dark:bg-slate-700`      |

> **Known gaps**: 44 elements still need `dark:` variants. 36 are `text-slate-400` without `dark:text-slate-500`.
> **8 true bg-white violations** need conversion to `bg-card`.

### 2.8 Contrast Issues (WCAG AA = 4.5:1 min)

| Combination                      | Ratio  | Status                       |
| -------------------------------- | ------ | ---------------------------- |
| Emerald-500 primary + white text | 3.4:1  | ❌ FAIL → use Emerald-600    |
| Amber gradient + white text      | 2.5:1  | ❌ FAIL → use text-amber-950 |
| text-slate-400 on white bg       | 3.1:1  | ❌ FAIL → use text-slate-500 |
| Emerald-600 gradient end + white | 4.2:1  | ⚠️ Borderline                |
| Card bg + foreground             | 12.5:1 | ✅ Excellent                 |
| Dark card bg + foreground        | 9.7:1  | ✅ Excellent                 |

### 2.9 ✅ DO / ❌ DON'T

```tsx
// ✅ Semantic tokens
<button className="bg-primary text-primary-foreground" />
<p className="text-muted-foreground" />
<div className="border-border" />

// ✅ Raw emerald WITH dark pair
<div className="bg-emerald-50 dark:bg-emerald-900/30" />

// ❌ BANNED families
<div className="bg-gray-200" />     // → bg-slate-200 or bg-muted
<div className="text-zinc-500" />    // → text-slate-500
<span className="text-green-500" /> // → text-emerald-500
<span className="text-red-500" />   // → text-destructive

// ❌ Missing dark mode
<div className="bg-emerald-50" />   // → add dark:bg-emerald-900/30
<div className="bg-white" />        // → add dark:bg-slate-800
```

---

## 3. Typography Rules

### 3.1 Type Scale

> ⚠️ **Known Issue**: H1 (text-lg/18px) is currently SMALLER than H2 (text-2xl/24px). This heading inversion should be fixed.

| Role                   | Current Classes                                              | Size    | Use For                | Status                    |
| ---------------------- | ------------------------------------------------------------ | ------- | ---------------------- | ------------------------- |
| **Page Title (H1)**    | `text-lg font-bold text-slate-800 dark:text-slate-100`       | 18px    | App bar title          | ⚠️ Too small              |
| **Screen Title (H2)**  | `text-2xl font-bold text-slate-800 dark:text-slate-100`      | 24px    | Tab/screen heading     | OK                        |
| **Section Title (H3)** | `text-xl font-bold text-slate-800 dark:text-slate-100`       | 20px    | Content section header | OK                        |
| **Card Title**         | `text-base font-semibold text-slate-800 dark:text-slate-100` | 16px    | Card/inline header     | OK                        |
| **Subsection Label**   | `text-sm font-semibold text-slate-700 dark:text-slate-300`   | 14px    | Group label            | OK                        |
| **Form Label**         | `text-sm font-medium text-slate-700 dark:text-slate-300`     | 14px    | Input labels           | OK                        |
| **Body Text**          | `text-sm text-slate-600 dark:text-slate-300`                 | 14px    | Default paragraph      | ✅ De facto body (419×)   |
| **Caption / Helper**   | `text-xs text-muted-foreground`                              | 12px    | Timestamps, hints      | ✅ Standard (117×)        |
| **Micro Label**        | `text-[10px] font-bold uppercase tracking-wider`             | 10px    | Unit suffixes, badges  | ⚠️ 15 instances too small |
| **Stat / Hero Number** | `text-2xl font-bold` to `text-4xl font-bold`                 | 24-36px | Data displays          | OK                        |

### 3.2 Font Weight Rules

| Weight             | Class           | Use For                              | Current Count        |
| ------------------ | --------------- | ------------------------------------ | -------------------- |
| **Bold (700)**     | `font-bold`     | Headings ONLY, stat values, emphasis | 335 (⚠️ overused)    |
| **Semibold (600)** | `font-semibold` | Section titles, card titles          | 105 (should be more) |
| **Medium (500)**   | `font-medium`   | Labels, buttons, form labels         | —                    |
| **Normal (400)**   | _(default)_     | Body text                            | —                    |

> **Recommendation**: Reserve bold for H1-H2 + stat values. Use semibold for H3, card titles, labels.

### 3.3 text-[10px] Classification (52 instances)

| Category                                                  | Count | Action                 |
| --------------------------------------------------------- | ----- | ---------------------- |
| ✅ Acceptable (badges, nav icons, day abbreviations)      | 13    | Keep                   |
| ⚠️ Borderline (macro labels with uppercase)               | 24    | Monitor                |
| ❌ Too small (nutrition values, form labels, user advice) | 15    | **Upgrade to text-xs** |

### 3.3 Numeric Display

All numbers (calories, grams, weights, %) MUST use `tabular-nums` class or `data-numeric` attribute.

---

## 4. Border Radius Rules

| Element                   | Class           | Notes                                       |
| ------------------------- | --------------- | ------------------------------------------- |
| **Standard card**         | `rounded-xl`    | Default for all cards (274 uses — DOMINANT) |
| **Hero / highlight card** | `rounded-2xl`   | Gradient hero, feature highlights           |
| **Bottom sheet**          | `rounded-t-2xl` | Top corners only                            |
| **Modal / dialog**        | `rounded-xl`    | Via shadcn/ui                               |
| **Button (default)**      | `rounded-lg`    | Via shadcn buttonVariants                   |
| **Button (pill)**         | `rounded-full`  | Filter chips, pills                         |
| **Input field**           | `rounded-lg`    | Via shadcn input                            |
| **Badge**                 | `rounded-lg`    | Via shadcn badge                            |
| **Avatar / circle**       | `rounded-full`  | Always circular                             |
| **Progress bar**          | `rounded-full`  | Track and indicator                         |

### ❌ BANNED: `rounded-3xl` (31 uses) and `rounded-4xl` (1 use) → migrate to `rounded-2xl`

---

## 5. Spacing Rules

### 5.1 Padding

| Context             | Classes                                     | Notes                   |
| ------------------- | ------------------------------------------- | ----------------------- |
| **Page horizontal** | `px-4` (16px)                               | Standard page padding   |
| **Page top**        | `pt-safe` + `py-3`/`py-4`                   | Safe area + content     |
| **Card internal**   | `p-4` (16px) standard, `p-3` (12px) compact | Most common             |
| **Modal body**      | `p-4` to `p-6`                              | Standard to generous    |
| **Hero section**    | `p-6` (24px)                                | Generous breathing room |
| **List item**       | `py-2` to `py-3`                            | Vertical padding        |

### 5.2 Gap

| Context                 | Classes                      | Notes                  |
| ----------------------- | ---------------------------- | ---------------------- |
| **Default element gap** | `gap-2` (8px)                | DOMINANT — 230 uses    |
| **Form field gap**      | `gap-3` (12px)               | Between form fields    |
| **Section gap**         | `gap-4` (16px)               | Between major sections |
| **Inline icon + text**  | `gap-1` to `gap-1.5` (4-6px) | Tight                  |
| **Button icon + text**  | `gap-1.5` (6px)              | shadcn standard        |

---

## 6. Shadow / Elevation Rules

| Element                  | Shadow                        | Notes                              |
| ------------------------ | ----------------------------- | ---------------------------------- |
| **Standard card**        | `shadow-sm`                   | Light, subtle (DOMINANT — 76 uses) |
| **Elevated card**        | `shadow-md`                   | Moderate lift                      |
| **Bottom sheet / modal** | `shadow-xl`                   | Strong elevation                   |
| **Floating action**      | `shadow-lg`                   | Prominent                          |
| **Gradient hero card**   | `shadow-lg`                   | Pairs with gradient bg             |
| **Buttons**              | None                          | Buttons do NOT have shadows        |
| **Emerald glow**         | `shadow-[var(--shadow-glow)]` | Accent effect                      |

---

## 7. Motion / Animation Rules

| Action               | Duration | Easing       | Class                                     |
| -------------------- | -------- | ------------ | ----------------------------------------- |
| **Color transition** | 150ms    | default ease | `transition-colors`                       |
| **Layout shift**     | 250ms    | ease-enter   | `transition-all`                          |
| **Modal enter**      | 250ms    | ease-enter   | fade + scale                              |
| **Modal exit**       | 150ms    | ease-exit    | fade out                                  |
| **Button hover**     | 150ms    | default      | `transition-colors`                       |
| **Reduced motion**   | —        | —            | Always add `motion-reduce:transform-none` |

---

## 8. Component Rules

### 8.1 Buttons (shadcn/ui)

| Size        | Height | Text            | Use For                |
| ----------- | ------ | --------------- | ---------------------- |
| **xs**      | `h-6`  | `text-xs`       | Inline compact actions |
| **sm**      | `h-7`  | `text-[0.8rem]` | Secondary actions      |
| **default** | `h-8`  | `text-sm`       | Standard buttons       |
| **lg**      | `h-9`  | `text-sm`       | Primary CTAs           |

> ⚠️ **ALL sizes are below 44px**. Consuming components MUST add `min-h-11` for mobile.
> Currently mitigated by 99 instances of `min-h-11` overrides, but design system root should enforce this.

### 8.2 Cards

```tsx
// Standard: rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800
// Tinted:   rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/30
// Hero:     rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white shadow-lg
```

### 8.3 Form Fields

```tsx
// Input:  rounded-lg border-input h-8 text-base md:text-sm
// Label:  mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300
// Error:  text-xs text-destructive mt-1
```

### 8.4 Bottom Sheets

```tsx
// Container: rounded-t-2xl
// Header:    border-b border-slate-100 dark:border-slate-700 px-6 py-4
// Body:      p-4 or p-6
```

### 8.5 Navigation

```tsx
// Active tab:   text-emerald-600 dark:text-emerald-400
// Inactive tab: text-slate-400 dark:text-slate-500
// Icon size:    h-5 w-5
// Touch target: min-h-12 (48px)
```

### 8.6 Toast / Notifications

```tsx
// Container: z-[80] fixed bottom-safe
// Success:   bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200
// Error:     bg-destructive/10 text-destructive
// Warning:   bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200
// Duration:  3000ms auto-dismiss, 5000ms for errors
```

### 8.7 Form Validation

```tsx
// Error state:  border-destructive text-destructive
// Helper text:  text-xs text-muted-foreground
// Required:     aria-required="true" + visual indicator
// Zod schema:   z.preprocess() for numeric coercion
// Multi-step:   NEVER trigger() without field args
```

### 8.8 Loading & Empty States

```tsx
// Loading:  <Skeleton> or spinner with text-muted-foreground
// Empty:    centered icon (h-12 w-12) + text-muted-foreground message
// Error:    text-destructive icon + retry button
```

### 8.9 Disabled Elements

```tsx
// Standard:  disabled:opacity-50 (not 30/40/60 — standardize!)
// Cursor:    disabled:cursor-not-allowed
// Pointer:   disabled:pointer-events-none (buttons only)
```

---

## 9. Layout & Responsive Rules

### 9.1 Page Structure

```
min-h-dvh bg-slate-50 dark:bg-slate-950
├─ Header: pt-safe sticky top-0 z-20 | px-4 py-2 sm:px-6 sm:py-4
├─ Main:   mx-auto max-w-5xl px-4 py-6 pb-28 sm:px-6 sm:py-8 sm:pb-8
└─ BottomNav: fixed inset-x-0 bottom-0 z-30 sm:hidden | min-h-12 | pb-safe
```

### 9.2 Z-Index Scale

| Layer         | z-index  | Element             |
| ------------- | -------- | ------------------- |
| Base          | `z-0`    | Normal content      |
| Sticky header | `z-20`   | App bar             |
| Bottom nav    | `z-30`   | Tab bar             |
| Page overlay  | `z-50`   | Full-screen pages   |
| Modal         | `z-50`   | shadcn Dialog/Sheet |
| Toast         | `z-[80]` | Notifications       |

### 9.3 Grid Responsiveness (MUST follow)

```tsx
// ❌ WRONG — overflows on mobile
<div className="grid grid-cols-4 gap-2">

// ✅ CORRECT — responsive grid
<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
```

### 9.4 Viewport Units

```tsx
// ❌ WRONG — address bar overlap
<div className="max-h-[90vh]">

// ✅ CORRECT — dynamic viewport
<div className="max-h-[90dvh]">
```

---

## 10. Accessibility Rules

| Rule                 | Standard      | Requirement                                      |
| -------------------- | ------------- | ------------------------------------------------ |
| **Touch targets**    | WCAG 2.5.8    | Minimum `min-h-11 min-w-11` (44×44px)            |
| **Color contrast**   | WCAG AA 4.5:1 | No white text on light gradients                 |
| **Form labels**      | WCAG 1.3.1    | Every input needs `<label>` or `aria-label`      |
| **Focus indicators** | WCAG 2.4.7    | `focus-visible:ring-2 focus-visible:ring-ring`   |
| **Decorative icons** | —             | Always add `aria-hidden="true"`                  |
| **Reduced motion**   | WCAG 2.3.3    | Add `motion-reduce:transform-none` to animations |
| **Text size**        | Readability   | Avoid `text-[10px]` for critical information     |

---

## 11. Violations & Fix Plan

### 🔴 P0 — Critical (Must Fix Immediately)

| #   | Issue                                               | Location          | Fix                                                 |
| --- | --------------------------------------------------- | ----------------- | --------------------------------------------------- |
| 1   | **Broad Zustand destructures** → cascade re-renders | `App.tsx:177-181` | Use individual selectors: `useXStore(s => s.field)` |

### 🔴 P1 — High Priority (Fix Before Release)

| #   | Issue                                                         | Scope                                   | Fix                                             |
| --- | ------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------- |
| 2   | **WCAG contrast: Emerald-500 + white** (3.4:1 < 4.5:1)        | Primary buttons, hero cards             | Change `--primary` to Emerald-600 in light mode |
| 3   | **WCAG contrast: amber gradient + white** (2.5:1)             | DailyScoreHero, PRToast, WorkoutSummary | Use `text-amber-950` instead of `text-white`    |
| 4   | **text-slate-500/400 raw → text-muted-foreground** (141+178×) | App-wide                                | Bulk migrate to semantic token                  |
| 5   | **border-slate-200 raw → border-border** (125×)               | App-wide                                | Bulk migrate to semantic token                  |
| 6   | **bg-white raw → bg-card** (67×)                              | Card surfaces                           | Bulk migrate to semantic token                  |
| 7   | **28 mega-files >300 lines**                                  | TrainingPlanView(843), DishManager(813) | Extract sub-components                          |
| 8   | **Missing useMemo** in DishEditModal ingredient filter        | DishEditModal.tsx                       | Add useMemo for keystroke perf                  |
| 9   | **2 buttons < 44px touch target**                             | WorkoutAssignmentList.tsx               | Add `min-h-11`                                  |

### 🟡 P2 — Medium Priority

| #   | Issue                                                | Scope                             | Fix                                     |
| --- | ---------------------------------------------------- | --------------------------------- | --------------------------------------- |
| 10  | Create `--primary-subtle` token (pattern used 187×)  | New token needed                  | Add to index.css, adopt in components   |
| 11  | Wire dead macro/status/AI tokens (200+ replacements) | 13 token families                 | Replace raw colors with semantic tokens |
| 12  | Fix 44 dark mode edge cases                          | 36× text-slate-400 without dark:  | Add `dark:text-slate-500`               |
| 13  | 15× text-[10px] too small for readable content       | Nutrition values, form labels     | Upgrade to `text-xs`                    |
| 14  | Fix heading scale inversion (H1 < H2)                | App header vs screen titles       | Standardize hierarchy                   |
| 15  | ~12 non-responsive grid-cols                         | Calendar, Analysis, Summary       | Add `sm:` breakpoints                   |
| 16  | 7 dynamic texts lack truncation                      | DishEditModal, WorkoutSummaryCard | Add `truncate` or `line-clamp-*`        |
| 17  | Standardize disabled opacity                         | 4 different values (30/40/50/60)  | → `disabled:opacity-50`                 |
| 18  | Migrate 42 inline styles                             | 17× touchAction, 16× tabular-nums | → Tailwind classes                      |

### 🟢 P3 — Polish

| #   | Issue                                               | Fix                                           |
| --- | --------------------------------------------------- | --------------------------------------------- |
| 19  | 45 console.\* outside logger utility                | → Migrate to `src/utils/logger.ts`            |
| 20  | 28 decorative icons missing `aria-hidden`           | Add `aria-hidden="true"`                      |
| 21  | 4 purple instances off-palette                      | → Migrate to `indigo-*`                       |
| 22  | font-bold overused (335×)                           | Reserve for headings, use semibold for labels |
| 23  | Remove dead tokens (chart-1..5, duration-_, ease-_) | Clean up `index.css`                          |
| 24  | PlanTemplateGallery missing `pb-safe`               | Add safe area padding                         |

### ✅ Previously Fixed (for tracking)

| Issue                                      | Status                                                 |
| ------------------------------------------ | ------------------------------------------------------ |
| ~~Orphan colors (gray/zinc/green/violet)~~ | ✅ Eliminated (0 remaining)                            |
| ~~20 components missing dark mode~~        | ✅ Fixed (98% coverage)                                |
| ~~90vh instead of 90dvh~~                  | ✅ All converted to dvh                                |
| ~~z-9999 in NotificationContext~~          | ✅ Normalized to z-[80]                                |
| ~~rounded-3xl inconsistency~~              | ✅ All normalized to rounded-2xl                       |
| ~~Form fields without labels~~             | ✅ aria-labels added                                   |
| ~~Missing focus styles~~                   | ✅ All 129 outline-none paired with focus-visible:ring |

---

## 12. Detailed Reports

Full analysis with line-by-line evidence available in session workspace:

| Report                           | Description                                                                  |
| -------------------------------- | ---------------------------------------------------------------------------- |
| `unified-ui-audit-report.md`     | Complete post-migration audit (6 agents, 13/20 score)                        |
| `ui-design-system-rules.md`      | Comprehensive canonical rules (color, type, radius, spacing, shadow, motion) |
| `ui-extract-normalize.md`        | Token extraction with exact counts + inconsistency analysis                  |
| `ui-layout-responsive-polish.md` | Layout patterns, responsive issues, micro-detail polish audit                |

---

## 13. Enforcement

### CI/CD Pipeline

| Tool                             | What It Checks                               | Blocks PR? |
| -------------------------------- | -------------------------------------------- | ---------- |
| `scripts/check-banned-colors.sh` | gray/zinc/green/violet/teal/yellow           | ✅ Yes     |
| `npm run lint`                   | TypeScript + ESLint (0 errors)               | ✅ Yes     |
| `npm run test`                   | 4397 tests (100% coverage for new code)      | ✅ Yes     |
| `npm run build`                  | Clean production build                       | ✅ Yes     |
| Husky pre-commit                 | lint-staged + prettier + tailwind class sort | ✅ Yes     |

### PR Template Checklist

- [ ] No banned color families (run `scripts/check-banned-colors.sh`)
- [ ] Every raw color has `dark:` pair
- [ ] Touch targets ≥ 44px (`min-h-11`)
- [ ] Semantic tokens preferred over raw Tailwind colors
- [ ] No `eslint-disable` comments
- [ ] WCAG AA contrast verified for new text/background combos
