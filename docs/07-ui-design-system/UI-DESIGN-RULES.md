# 📐 MealPlaning UI Design System — Unified Reference

> **Version**: 1.0 • **Date**: 2026-04-02
> **Stack**: React 19 + Tailwind CSS v4 + shadcn/ui (base-nova) + Capacitor 8
> **Overall UI Score**: 68/100

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

---

## 1. Executive Summary

### Scores

| Category         | Score | Key Finding                                                     |
| ---------------- | ----- | --------------------------------------------------------------- |
| Theming          | 4/10  | 97% raw Tailwind colors, only 3% semantic tokens adopted        |
| Accessibility    | 6/10  | Missing form labels, WCAG contrast failure, small touch targets |
| Visual Hierarchy | 6/10  | CTAs clear, heading levels inconsistent                         |
| Consistency      | 8/10  | Modals & buttons follow shared patterns                         |
| Mobile UX        | 7/10  | Solid fundamentals, some cognitive-load issues                  |
| Performance      | 7/10  | Good lazy-loading, Zustand selectors inconsistent               |

### Top 5 Critical Actions

1. **Migrate to semantic color tokens** — 126/146 files hardcode colors
2. **Fix WCAG contrast failure** — white text on amber-400 gradient
3. **Add missing form labels** — 4+ fields without `<label>` or `aria-label`
4. **Eliminate orphan color families** — gray (8), zinc (25), green (30), violet (4) → migrate to slate/emerald
5. **Add dark mode** to 20 components missing `dark:` variants

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

### 2.3 BANNED Color Families (must migrate)

| Family        | Current Uses       | Migrate To                          |
| ------------- | ------------------ | ----------------------------------- |
| **gray-\***   | 8 uses in 3 files  | `slate-*`                           |
| **zinc-\***   | 25 uses in 2 files | `slate-*`                           |
| **green-\***  | 30 uses in 6 files | `emerald-*` or `--color-fiber`      |
| **violet-\*** | 4 uses             | `indigo-*`                          |
| **purple-\*** | 12 uses            | Consolidate with `indigo-*`         |
| **teal-\***   | 2 uses             | Review — close to emerald           |
| **orange-\*** | 20 uses            | Review — consolidate with `amber-*` |

### 2.4 Dark Mode Pairing Rules

Every raw color class MUST have a `dark:` counterpart:

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

### 2.5 ✅ DO / ❌ DON'T

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

| Role                   | Classes                                                      | Use For                |
| ---------------------- | ------------------------------------------------------------ | ---------------------- |
| **Page Title (H1)**    | `text-lg font-bold text-slate-800 dark:text-slate-100`       | App bar title          |
| **Screen Title (H2)**  | `text-2xl font-bold text-slate-800 dark:text-slate-100`      | Tab/screen heading     |
| **Section Title (H3)** | `text-xl font-bold text-slate-800 dark:text-slate-100`       | Content section header |
| **Card Title**         | `text-base font-semibold text-slate-800 dark:text-slate-100` | Card/inline header     |
| **Subsection Label**   | `text-sm font-semibold text-slate-700 dark:text-slate-300`   | Group label            |
| **Form Label**         | `text-sm font-medium text-slate-700 dark:text-slate-300`     | Input labels           |
| **Body Text**          | `text-sm text-slate-600 dark:text-slate-300`                 | Default paragraph      |
| **Caption / Helper**   | `text-xs text-slate-500 dark:text-slate-400`                 | Timestamps, hints      |
| **Micro Label**        | `text-[10px] font-bold uppercase tracking-wider`             | Unit suffixes, badges  |
| **Stat / Hero Number** | `text-2xl font-bold` to `text-4xl font-bold`                 | Data displays          |

### 3.2 Font Weight Rules

| Weight             | Class           | Use For                         |
| ------------------ | --------------- | ------------------------------- |
| **Bold (700)**     | `font-bold`     | Headings, stat values, emphasis |
| **Semibold (600)** | `font-semibold` | Section titles, card titles     |
| **Medium (500)**   | `font-medium`   | Labels, buttons, form labels    |
| **Normal (400)**   | _(default)_     | Body text                       |

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

Touch target: minimum `min-h-11` (44px) for mobile buttons.

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

### 🔴 P0 — Critical (Must Fix)

| #   | Issue                                      | Files                                 | Fix                                                 |
| --- | ------------------------------------------ | ------------------------------------- | --------------------------------------------------- |
| 1   | WCAG contrast failure — white on amber-400 | `WorkoutSummaryCard.tsx:34`           | Change to `text-slate-900` or darken gradient       |
| 2   | 4 form fields without labels               | `CustomExerciseModal.tsx:64,76,88,97` | Add `aria-label` to each                            |
| 3   | Missing focus styles on `<select>`         | `CustomExerciseModal.tsx:76,88`       | Add `focus:ring-2 focus:ring-ring`                  |
| 4   | Zustand full-store subscriptions           | `App.tsx:177-181`                     | Use individual selectors: `useXStore(s => s.field)` |

### 🔴 P1 — High Priority

| #   | Issue                                         | Scope                                                          | Fix                                                                       |
| --- | --------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 5   | 86% hardcoded colors (semantic tokens unused) | 126/146 files                                                  | Phased migration → `bg-primary`, `text-muted-foreground`, `border-border` |
| 6   | Orphan colors (green/zinc/gray/violet)        | 23 files                                                       | Migrate → emerald/slate/indigo                                            |
| 7   | 20 components missing dark mode               | 20 files                                                       | Add `dark:` variants                                                      |
| 8   | Missing search input labels                   | `ExerciseSelector`, `SwapExerciseSheet`, `PlanTemplateGallery` | Add `aria-label`                                                          |
| 9   | Touch target too small (29px)                 | `SettingsDetailLayout.tsx:35`                                  | Add `min-h-11 min-w-11`                                                   |
| 10  | 15 mega-files (>300 lines)                    | `TrainingPlanView` (843), `DishManager` (813), `App.tsx` (742) | Extract sub-components                                                    |

### 🟡 P2 — Medium Priority

| #   | Issue                                             | Scope                             | Fix                                                          |
| --- | ------------------------------------------------- | --------------------------------- | ------------------------------------------------------------ |
| 11  | `grid-cols-4` without responsive fallback         | `AnalysisResultView.tsx` + 6 more | ✅ Fixed — `grid-cols-2 sm:grid-cols-4`                      |
| 12  | `90vh` instead of `90dvh`                         | 5 modals                          | ✅ Fixed — all converted to `dvh`                            |
| 13  | 52+ `text-[10px]` instances                       | App-wide                          | Audit each — critical info needs `text-xs` minimum           |
| 14  | `z-9999` in NotificationContext                   | 1 file                            | ✅ Fixed — normalized to `z-[80]`                            |
| 15  | `rounded-3xl` (31 uses) → should be `rounded-2xl` | 31 instances                      | ✅ Fixed — all normalized                                    |
| 16  | Abrupt show/hide (missing transitions)            | `GroceryList.tsx`, `SetEditor`    | Add `transition-all duration-200`                            |
| 17  | Inconsistent icon sizes                           | Multiple files                    | Standardize: h-4 w-4 (inline), h-5 w-5 (nav), h-6 w-6 (hero) |
| 18  | 7+ custom buttons bypassing `<Button>` component  | Multiple files                    | Refactor to use shadcn `<Button>`                            |

### 🟢 P3 — Nice-to-Have

| #   | Issue                                                  | Fix                                  |
| --- | ------------------------------------------------------ | ------------------------------------ |
| 19  | Custom `--space-*` tokens defined but unused           | Either adopt in components or remove |
| 20  | Missing loading skeletons for data-fetching components | Add `<Skeleton>` placeholders        |
| 21  | Cognitive overload in MealActionBar (12+ targets)      | Consolidate into overflow menu       |
| 22  | `AutoAdjustBanner.tsx` uses inline `style={{}}`        | Replace with Tailwind classes        |

---

## 12. Detailed Reports

Full analysis with line-by-line evidence in:

| Report                                                               | Description                                                                             |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [`ui-audit-critique.md`](./ui-audit-critique.md)                     | Full audit (a11y, performance, theming) + UX critique scores                            |
| [`ui-extract-normalize.md`](./ui-extract-normalize.md)               | Token extraction with exact counts + inconsistency analysis                             |
| [`ui-design-system-rules.md`](./ui-design-system-rules.md)           | Complete design system rules (color, type, radius, spacing, shadow, motion, components) |
| [`ui-layout-responsive-polish.md`](./ui-layout-responsive-polish.md) | Layout patterns, responsive issues, micro-detail polish audit                           |
