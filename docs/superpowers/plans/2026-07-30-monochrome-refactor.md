# Monochrome Color System Refactor — Implementation Plan

> **Status: ✅ COMPLETE** (Waves 1-4 implemented and committed)
>
> | Wave                    | Commit    | Summary                                                                    |
> | ----------------------- | --------- | -------------------------------------------------------------------------- |
> | W1: Token Foundation    | `17946de` | 115 OKLCH tokens → grayscale, colors.ts rewrite, chart dark mode fix       |
> | W2: Component Variants  | `ff78917` | Badge 6 variants → monochrome, Button warning → secondary, Toast grayscale |
> | W3: Gradients + Cleanup | `72fc86a` | 5 gradient files → from-muted, delete orphaned tokens.css                  |
> | W4: Sweep               | `4f6d368` | ring-green-400/50 → ring-ring/50 (last non-token colors)                   |

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the entire Emerald-based multi-color theme with a pure Monochrome (grayscale) design across the full MealPlaning app.

**Architecture:** Token-first approach — change CSS custom property values in `src/index.css` to grayscale OKLCH, which auto-propagates to ~80% of the UI via Tailwind v4 + shadcn/ui. Remaining ~20% requires manual component updates where color was the sole differentiator (charts, badges, toasts, gradients).

**Tech Stack:** Tailwind CSS v4 (OKLCH tokens), shadcn/ui, React 19, class-variance-authority (badge/button variants), SVG charts (MacroDonutChart, MacroChart)

**Design Reference:** `docs/mockup-monochrome-calendar.html` (approved by user)

---

## Scope & Rules

### What Changes

- **ALL** colored CSS custom properties → grayscale OKLCH (0 chroma)
- **ALL** hardcoded hex colors in `colors.ts` → grayscale hex
- Badge/Button variants → monochrome equivalents
- Chart colors → opacity-based differentiation
- Gradient compositions → flat or subtle grayscale
- Toast notifications → icon-only differentiation (all grayscale except error)

### What Stays

- **Validation red** (`--destructive`) — kept for form error borders + text
- **Toast error red** (`--toast-error`) — kept for error notification visibility
- **Google brand colors** in `GoogleDriveSync.tsx` SVG — external brand, don't touch
- **All functionality** — zero behavior changes, purely visual

### Design Decisions (Pre-resolved)

| Decision                | Resolution                                                           |
| ----------------------- | -------------------------------------------------------------------- |
| Toast differentiation   | Icons (already present) + grayscale bg. Error stays red.             |
| Macro chart (donut/bar) | Opacity-based: 100%/60%/30% of foreground. Text labels stay.         |
| Badge variants          | Keep variant API, make colored variants visually same as `secondary` |
| Meal type colors        | All become foreground (already have text labels "Bữa Sáng/Trưa/Tối") |
| Compare state           | Border style (solid/dashed) instead of blue color                    |
| AI features             | Text badge "[AI]" + muted background, no indigo                      |
| Focus ring              | Black (light) / White (dark) instead of Emerald                      |
| Primary button          | Black bg/white text (light) ↔ White bg/black text (dark)             |

### Commit Rules

- **Sub-agents CANNOT commit** — only orchestrator commits after full quality gate
- **1 commit per wave** after all quality gates pass
- Quality gates: lint → test → build → SonarQube → emulator verify

---

## File Structure Map — EXACT Change Manifest

> Mỗi file liệt kê chính xác dòng nào thay đổi, giá trị cũ → mới.

### Wave 1: Token Foundation (5 files)

**File 1: `src/index.css`** — 124 CSS custom properties + focus ring + shadow-glow

| Dòng    | Property                                                     | Giá trị cũ (Emerald/Color)                | Giá trị mới (Grayscale)                         |
| ------- | ------------------------------------------------------------ | ----------------------------------------- | ----------------------------------------------- |
| 14      | `--background`                                               | `oklch(0.985 0.015 163)` Emerald-50       | `oklch(1 0 0)` #FFFFFF                          |
| 15      | `--foreground`                                               | `oklch(0.208 0.026 264.69)` Slate-900     | `oklch(0.145 0 0)` #0A0A0A                      |
| 16      | `--card`                                                     | `oklch(1 0 0)` ✅ đã gray                 | Giữ nguyên                                      |
| 17      | `--card-foreground`                                          | `oklch(0.208 0.026 264.69)`               | `oklch(0.145 0 0)`                              |
| 18      | `--popover`                                                  | `oklch(1 0 0)` ✅ đã gray                 | Giữ nguyên                                      |
| 19      | `--popover-foreground`                                       | `oklch(0.208 0.026 264.69)`               | `oklch(0.145 0 0)`                              |
| 20-22   | `--primary`                                                  | `oklch(0.627 0.194 163.95)` Emerald-600   | `oklch(0.145 0 0)` #0A0A0A (black button)       |
| 23      | `--primary-foreground`                                       | `oklch(1 0 0)` ✅                         | Giữ nguyên                                      |
| 24      | `--secondary`                                                | `oklch(0.696 0.17 162.48)` Emerald-500    | `oklch(0.918 0 0)` #E5E5E5                      |
| 25      | `--secondary-foreground`                                     | `oklch(1 0 0)`                            | `oklch(0.145 0 0)` #0A0A0A                      |
| 26      | `--muted`                                                    | `oklch(0.972 0.015 163)` Emerald-tint     | `oklch(0.97 0 0)` #F5F5F5                       |
| 27      | `--muted-foreground`                                         | `oklch(0.446 0.043 257.28)` Slate-600     | `oklch(0.616 0 0)` #8A8A8A                      |
| 28      | `--accent`                                                   | `oklch(0.972 0.015 163)`                  | `oklch(0.97 0 0)` #F5F5F5                       |
| 29      | `--accent-foreground`                                        | `oklch(0.208 0.026 264.69)`               | `oklch(0.145 0 0)`                              |
| 30      | `--destructive`                                              | `oklch(0.637 0.237 25.33)` Red-500        | `oklch(0.577 0.245 27.33)` **GIỮ ĐỎ** (#DC2626) |
| 31      | `--border`                                                   | `oklch(0.945 0.025 163)` Green-tint       | `oklch(0.918 0 0)` #E5E5E5                      |
| 32      | `--input`                                                    | `oklch(0.945 0.025 163)`                  | `oklch(0.918 0 0)`                              |
| 33      | `--ring`                                                     | `oklch(0.696 0.17 162.48)` Emerald-500    | `oklch(0.145 0 0)` #0A0A0A (black ring)         |
| 36      | `--primary-subtle`                                           | `oklch(0.962 0.044 163.25)`               | `oklch(0.97 0 0)` #F5F5F5                       |
| 37      | `--primary-emphasis`                                         | `oklch(0.527 0.154 163.45)`               | `oklch(0.253 0 0)` #262626                      |
| 38      | `--foreground-secondary`                                     | `oklch(0.446 0.043 257.28)`               | `oklch(0.432 0 0)` #525252                      |
| 39      | `--border-subtle`                                            | `oklch(0.968 0.007 247.86)`               | `oklch(0.955 0 0)` #F0F0F0                      |
| 42      | `--accent-warm`                                              | `oklch(0.606 0.222 22)` Orange            | `oklch(0.432 0 0)` #525252                      |
| 43      | `--accent-warm-foreground`                                   | `oklch(1 0 0)` ✅                         | Giữ nguyên                                      |
| 46      | `--macro-protein`                                            | `oklch(0.588 0.158 241.97)` Sky-600       | `oklch(0.145 0 0)` foreground                   |
| 47      | `--macro-fat`                                                | `oklch(0.555 0.163 48.99)` Amber-700      | `oklch(0.432 0 0)` #525252                      |
| 48      | `--macro-carbs`                                              | `oklch(0.546 0.245 262.88)` Blue-600      | `oklch(0.556 0 0)` #737373                      |
| 49      | `--macro-fiber`                                              | `oklch(0.527 0.198 142.5)` Green-700      | `oklch(0.635 0 0)` muted                        |
| 52      | `--color-ai`                                                 | `oklch(0.585 0.233 277.1)` Indigo-500     | `oklch(0.432 0 0)` #525252                      |
| 53      | `--color-ai-subtle`                                          | `oklch(0.962 0.018 272.3)`                | `oklch(0.97 0 0)` #F5F5F5                       |
| 54      | `--color-energy`                                             | `oklch(0.769 0.188 70.1)` Amber-400       | `oklch(0.556 0 0)` #737373                      |
| 55      | `--color-rose`                                               | `oklch(0.645 0.246 16.4)` Rose-500        | `oklch(0.556 0 0)` #737373                      |
| 58      | `--status-success`                                           | `oklch(0.637 0.16 163.89)` Emerald-600    | `oklch(0.357 0 0)` #404040                      |
| 59-61   | `--status-warning`                                           | `oklch(0.666 0.179 58.32)` Amber-600      | `oklch(0.432 0 0)` #525252                      |
| 62      | `--status-info`                                              | `oklch(0.546 0.245 262.88)` Blue-600      | `oklch(0.556 0 0)` #737373                      |
| 65      | `--toast-error`                                              | `oklch(0.645 0.246 16.4)` Rose-500        | `oklch(0.577 0.245 27.33)` **GIỮ ĐỎ**           |
| 66      | `--toast-error-subtle`                                       | `oklch(0.969 0.015 12.4)`                 | `oklch(0.971 0.013 17.38)` **GIỮ ĐỎ**           |
| 67      | `--toast-error-emphasis`                                     | `oklch(0.455 0.188 13.7)`                 | Giữ nguyên **GIỮ ĐỎ**                           |
| 68      | `--toast-warning`                                            | `oklch(0.769 0.188 70.1)` Amber           | `oklch(0.432 0 0)` #525252                      |
| 69      | `--toast-warning-subtle`                                     | `oklch(0.987 0.022 95.3)`                 | `oklch(0.97 0 0)` #F5F5F5                       |
| 70      | `--toast-warning-emphasis`                                   | `oklch(0.513 0.165 55)`                   | `oklch(0.253 0 0)` #262626                      |
| 71      | `--toast-info`                                               | `oklch(0.685 0.169 237.3)` Sky            | `oklch(0.556 0 0)` #737373                      |
| 72      | `--toast-info-subtle`                                        | `oklch(0.977 0.013 236.6)`                | `oklch(0.97 0 0)` #F5F5F5                       |
| 73      | `--toast-info-emphasis`                                      | `oklch(0.443 0.11 240.8)`                 | `oklch(0.304 0 0)` #333333                      |
| 76      | `--color-energy-emphasis`                                    | `oklch(0.555 0.163 48.99)`                | `oklch(0.357 0 0)` #404040                      |
| 77      | `--color-energy-subtle`                                      | `oklch(0.987 0.022 95.3)`                 | `oklch(0.985 0 0)` #FAFAFA                      |
| 78      | `--color-ai-emphasis`                                        | `oklch(0.457 0.24 277.02)`                | `oklch(0.304 0 0)` #333333                      |
| 79      | `--color-rose-emphasis`                                      | `oklch(0.514 0.222 16.57)`                | `oklch(0.357 0 0)` #404040                      |
| 80      | `--color-rose-subtle`                                        | `oklch(0.969 0.015 12.4)`                 | `oklch(0.985 0 0)` #FAFAFA                      |
| 81      | `--destructive-emphasis`                                     | `oklch(0.505 0.213 27.33)`                | Giữ nguyên **GIỮ ĐỎ**                           |
| 82      | `--destructive-subtle`                                       | `oklch(0.971 0.013 17.38)`                | Giữ nguyên **GIỮ ĐỎ**                           |
| 83      | `--macro-carbs-emphasis`                                     | `oklch(0.488 0.243 264.06)`               | `oklch(0.432 0 0)` #525252                      |
| 84      | `--macro-carbs-subtle`                                       | `oklch(0.97 0.014 254.6)`                 | `oklch(0.97 0 0)` #F5F5F5                       |
| 87      | `--meal-breakfast`                                           | `oklch(0.795 0.184 86.047)` Amber         | `oklch(0.432 0 0)` #525252                      |
| 88      | `--meal-lunch`                                               | `oklch(0.685 0.169 237.323)` Sky          | `oklch(0.357 0 0)` #404040                      |
| 89      | `--meal-dinner`                                              | `oklch(0.585 0.233 277.117)` Indigo       | `oklch(0.304 0 0)` #333333                      |
| 92      | `--accent-highlight`                                         | `oklch(0.606 0.25 292.72)` Violet         | `oklch(0.432 0 0)` #525252                      |
| 93      | `--accent-highlight-foreground`                              | `oklch(1 0 0)` ✅                         | Giữ nguyên                                      |
| 94      | `--accent-subtle`                                            | `oklch(0.969 0.016 293.76)` Violet        | `oklch(0.97 0 0)` #F5F5F5                       |
| 95      | `--accent-emphasis`                                          | `oklch(0.491 0.27 292.58)`                | `oklch(0.304 0 0)` #333333                      |
| 98      | `--macro-protein-emphasis`                                   | `oklch(0.443 0.11 240.8)` Sky             | `oklch(0.145 0 0)` foreground                   |
| 99      | `--macro-protein-subtle`                                     | `oklch(0.977 0.013 236.6)`                | `oklch(0.97 0 0)` #F5F5F5                       |
| 102     | `--compare-active`                                           | `oklch(0.746 0.16 232.66)` Blue           | `oklch(0.357 0 0)` #404040                      |
| 103     | `--compare-default`                                          | `oklch(0.546 0.245 262.88)`               | `oklch(0.556 0 0)` #737373                      |
| 112     | `--shadow-glow`                                              | `oklch(0.696 0.17 162.48 / 0.3)` Emerald  | `oklch(0.145 0 0 / 0.15)` Black subtle          |
| 138     | `:focus-visible outline`                                     | `oklch(0.696 0.17 162.48)` Emerald        | `oklch(0.145 0 0)` Black                        |
| 304     | `.dark --background`                                         | `oklch(0.208 0.026 264.69)` Slate         | `oklch(0.145 0 0)` #0A0A0A                      |
| 305     | `.dark --foreground`                                         | `oklch(0.929 0.013 255.51)`               | `oklch(0.985 0 0)` #FAFAFA                      |
| 306     | `.dark --card`                                               | `oklch(0.295 0.029 260.03)`               | `oklch(0.168 0 0)` #141414                      |
| 307-309 | `.dark --card-fg/popover/popover-fg`                         | Slate values                              | Gray equivalents                                |
| 310     | `.dark --primary`                                            | `oklch(0.765 0.177 163.22)` Emerald-400   | `oklch(0.985 0 0)` #FAFAFA (white btn)          |
| 311     | `.dark --primary-foreground`                                 | `oklch(0.208 0.026 264.69)`               | `oklch(0.145 0 0)` #0A0A0A                      |
| 312-317 | `.dark --secondary/muted/accent`                             | Emerald/Slate values                      | Gray equivalents                                |
| 318     | `.dark --destructive`                                        | `oklch(0.704 0.191 22.216)`               | Giữ nguyên **GIỮ ĐỎ**                           |
| 319     | `.dark --border`                                             | `oklch(1 0 0 / 10%)` alpha white          | `oklch(0.253 0 0)` #262626 solid                |
| 320     | `.dark --input`                                              | `oklch(1 0 0 / 15%)`                      | `oklch(0.304 0 0)` #333333 solid                |
| 321     | `.dark --ring`                                               | `oklch(0.765 0.177 163.22)` Emerald       | `oklch(0.985 0 0)` White ring                   |
| 323-326 | `.dark --primary-subtle/emphasis/fg-secondary/border-subtle` | Colored                                   | Gray                                            |
| 328-331 | `.dark --macro-protein/fat/carbs/fiber`                      | Sky/Amber/Blue/Green                      | Gray tones                                      |
| 334-337 | `.dark --accent-highlight/subtle/emphasis`                   | Violet                                    | Gray                                            |
| 338-339 | `.dark --macro-protein-emphasis/subtle`                      | Sky                                       | Gray                                            |
| 341-344 | `.dark --color-ai/energy/rose`                               | Indigo/Amber/Rose                         | Gray                                            |
| 346-348 | `.dark --status-success/warning/info`                        | Emerald/Amber/Blue                        | Gray                                            |
| 351-359 | `.dark --toast-*`                                            | Rose/Amber/Sky                            | **Error GIỮ ĐỎ**, rest → Gray                   |
| 362-366 | `.dark --energy/ai/rose/destructive/carbs subtle`            | Colored                                   | Gray (destructive giữ đỏ)                       |
| 369-371 | `.dark --meal-breakfast/lunch/dinner`                        | Amber/Sky/Indigo                          | Gray                                            |
| 374-377 | `.dark --accent-warm/compare`                                | Orange/Blue                               | Gray                                            |
| 378     | `.dark --destructive-emphasis`                               | Red-400                                   | Giữ nguyên **GIỮ ĐỎ**                           |
| 379-382 | `.dark --macro-carbs/ai/energy/rose emphasis`                | Colored                                   | Gray                                            |
| 384     | `.dark --shadow-glow`                                        | `oklch(0.765 0.177 163.22 / 0.3)` Emerald | `oklch(0.985 0 0 / 0.1)` White subtle           |

**Không thay đổi (giữ nguyên):**

- Dòng 105: `--radius: 0.625rem` (không liên quan màu)
- Dòng 108-111: `--shadow-none/sm/md/lg` (dùng rgba black, đã grayscale)
- Dòng 114-118: Easing curves (không liên quan màu)
- Dòng 153-160: `pulse-subtle` animation — tự động cập nhật vì dùng `var(--primary)`
- Dòng 182-301: `@theme inline` block — ALL `var()` references, không có trực tiếp color value
- Dòng 403-433: `@layer base` — dùng tokens, tự động cập nhật

---

**File 2: `src/constant/colors.ts`** — Toàn bộ file (19 dòng → viết lại)

| Dòng | Giá trị cũ                                                       | Giá trị mới                                               |
| ---- | ---------------------------------------------------------------- | --------------------------------------------------------- |
| 3    | `emerald400: '#34d399'`                                          | `gray950: '#0a0a0a'`                                      |
| 4    | `emerald500: '#10b981'`                                          | `gray800: '#262626'`                                      |
| 5    | `emerald600: '#059669'`                                          | `gray700: '#404040'`                                      |
| 6    | `emerald700: '#047857'`                                          | `gray600: '#525252'`                                      |
| 7    | `amber400: '#fbbf24'`                                            | `gray500: '#737373'`                                      |
| 8    | `amber500: '#f59e0b'`                                            | `gray400: '#a3a3a3'`                                      |
| 9    | `amber600: '#d97706'`                                            | `gray300: '#d4d4d4'`                                      |
| 10   | `blue400: '#60a5fa'`                                             | `gray200: '#e5e5e5'`                                      |
| 11   | `blue500: '#3b82f6'`                                             | `gray50: '#fafafa'`                                       |
| 12   | `red500: '#ef4444'`                                              | `red600: '#dc2626'`                                       |
| 16   | `protein: { light: COLORS.emerald500, dark: COLORS.emerald400 }` | `protein: { light: COLORS.gray950, dark: COLORS.gray50 }` |
| 17   | `fat: { light: COLORS.amber500, dark: COLORS.amber400 }`         | `fat: { light: COLORS.gray500, dark: COLORS.gray400 }`    |
| 18   | `carbs: { light: COLORS.blue500, dark: COLORS.blue400 }`         | `carbs: { light: COLORS.gray300, dark: COLORS.gray600 }`  |

---

**File 3: `src/hooks/useDarkMode.ts`** — 1 dòng

| Dòng | Giá trị cũ                       | Giá trị mới                      |
| ---- | -------------------------------- | -------------------------------- |
| 29   | `isDark ? '#0f172a' : '#10b981'` | `isDark ? '#0a0a0a' : '#ffffff'` |

---

**File 4: `src/components/nutrition/MacroDonutChart.tsx`** — Thêm dark mode support

| Dòng      | Thay đổi                                                                                                       |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| 2 (thêm)  | `import { useDarkMode } from '@/hooks/useDarkMode';`                                                           |
| 37 (thêm) | `const { isDark } = useDarkMode();` trong component body                                                       |
| 50        | `color: MACRO_COLORS.protein.light` → `color: isDark ? MACRO_COLORS.protein.dark : MACRO_COLORS.protein.light` |
| 51        | `color: MACRO_COLORS.fat.light` → tương tự                                                                     |
| 52        | `color: MACRO_COLORS.carbs.light` → tương tự                                                                   |

---

**File 5: `src/components/schedule/MacroChart.tsx`** — Fix dead `darkColor` code

| Dòng      | Thay đổi                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| 2 (thêm)  | `import { useDarkMode } from '@/hooks/useDarkMode';`                                                         |
| 34 (thêm) | `const { isDark } = useDarkMode();` trong component body                                                     |
| 111       | `stroke={arc.color}` → `stroke={isDark ? arc.darkColor : arc.color}`                                         |
| 122       | `style={{ backgroundColor: seg.color }}` → `style={{ backgroundColor: isDark ? seg.darkColor : seg.color }}` |

---

### Wave 2: Component Variants (3 files)

**File 6: `src/components/ui/badge.tsx`** — 10 variant class strings thay đổi

| Dòng  | Variant       | Giá trị cũ                                                    | Giá trị mới                          |
| ----- | ------------- | ------------------------------------------------------------- | ------------------------------------ |
| 12    | `default`     | `bg-primary text-primary-foreground`                          | Giữ nguyên (auto-gray từ W1)         |
| 13    | `secondary`   | `bg-secondary text-secondary-foreground`                      | Giữ nguyên (auto-gray)               |
| 14-15 | `destructive` | (giữ đỏ)                                                      | Giữ nguyên                           |
| 16    | `outline`     | Giữ nguyên                                                    | Giữ nguyên                           |
| 17    | `ghost`       | Giữ nguyên                                                    | Giữ nguyên                           |
| 18    | `link`        | `text-primary`                                                | Giữ nguyên (auto-gray)               |
| 19    | `success`     | `bg-primary/10 text-primary`                                  | `bg-muted text-foreground`           |
| 20    | `warning`     | `bg-energy/10 text-energy dark:bg-energy/20 dark:text-energy` | `bg-muted text-foreground-secondary` |
| 21    | `ai`          | `bg-ai/10 text-ai dark:bg-ai/20 dark:text-ai`                 | `bg-muted text-foreground-secondary` |
| 22    | `protein`     | `bg-primary/10 text-primary`                                  | `bg-muted text-foreground`           |
| 23    | `fat`         | `bg-energy/10 text-energy dark:bg-energy/20 dark:text-energy` | `bg-muted text-foreground-secondary` |
| 24    | `carbs`       | `bg-macro-carbs/10 text-macro-carbs dark:...`                 | `bg-muted text-foreground-secondary` |

---

**File 7: `src/components/ui/button.tsx`** — 1 variant

| Dòng  | Variant   | Giá trị cũ                                                                                                      | Giá trị mới                                                    |
| ----- | --------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 23-24 | `warning` | `bg-energy text-white shadow-xs hover:bg-energy/90 dark:bg-energy dark:text-background dark:hover:bg-energy/90` | `bg-secondary text-secondary-foreground hover:bg-secondary/80` |

---

**File 8: `src/contexts/NotificationContext.tsx`** — 3 toast types thay đổi (error giữ nguyên)

| Dòng  | Toast type          | Field | Giá trị cũ                                   | Giá trị mới                          |
| ----- | ------------------- | ----- | -------------------------------------------- | ------------------------------------ |
| 47    | success.border      |       | `border-primary/20`                          | `border-border`                      |
| 48    | success.iconBg      |       | `bg-primary-subtle text-primary`             | `bg-muted text-foreground`           |
| 49    | success.title       |       | `text-primary`                               | `text-foreground`                    |
| 50    | success.message     |       | `text-primary`                               | `text-foreground-secondary`          |
| 52    | success.progressBar |       | `bg-primary`                                 | `bg-foreground`                      |
| 53-61 | error.\*            |       | (All RED values)                             | **GIỮ NGUYÊN**                       |
| 62    | warning.border      |       | `border-toast-warning/20`                    | `border-border`                      |
| 63    | warning.iconBg      |       | `bg-toast-warning-subtle text-toast-warning` | `bg-muted text-foreground-secondary` |
| 64    | warning.title       |       | `text-toast-warning-emphasis`                | `text-foreground`                    |
| 65    | warning.message     |       | `text-toast-warning`                         | `text-foreground-secondary`          |
| 68    | warning.progressBar |       | `bg-toast-warning`                           | `bg-foreground-secondary`            |
| 70    | info.border         |       | `border-toast-info/20`                       | `border-border`                      |
| 71    | info.iconBg         |       | `bg-toast-info-subtle text-toast-info`       | `bg-muted text-foreground-secondary` |
| 72    | info.title          |       | `text-toast-info-emphasis`                   | `text-foreground`                    |
| 73    | info.message        |       | `text-toast-info`                            | `text-foreground-secondary`          |
| 75    | info.progressBar    |       | `bg-toast-info`                              | `bg-foreground-secondary`            |

---

### Wave 3: Gradients + Cleanup (7 files)

| File                                                     | Dòng | Gradient cũ                                                 | Thay bằng                            |
| -------------------------------------------------------- | ---- | ----------------------------------------------------------- | ------------------------------------ |
| `src/components/AnalysisResultView.tsx`                  | 55   | `from-primary/10 to-color-ai-subtle ... bg-gradient-to-br`  | `bg-muted`                           |
| `src/features/fitness/components/WorkoutSummaryCard.tsx` | 37   | `from-color-energy to-color-energy/80 ... bg-gradient-to-r` | `bg-primary text-primary-foreground` |
| `src/features/fitness/components/ProgressDashboard.tsx`  | 317  | `from-primary/90 to-primary ... bg-gradient-to-br`          | `bg-primary text-primary-foreground` |
| `src/features/fitness/components/PlanGeneratedCard.tsx`  | 18   | `from-primary/90 to-primary ... bg-gradient-to-br`          | `bg-primary text-primary-foreground` |
| `src/features/fitness/components/PRToast.tsx`            | 24   | `from-color-energy to-color-energy/80 ... bg-gradient-to-r` | `bg-primary text-primary-foreground` |
| `src/features/fitness/components/TrainingPlanView.tsx`   | 748  | `from-info/80 to-info ... bg-gradient-to-br`                | `bg-primary text-primary-foreground` |
| `src/features/fitness/components/TrainingPlanView.tsx`   | 943  | `from-info/80 to-info ... bg-gradient-to-br`                | `bg-primary text-primary-foreground` |
| `src/styles/tokens.css`                                  | ALL  | Orphaned file (not imported)                                | **XÓA FILE**                         |

---

### Wave 4: Sweep + Tests (~5 files)

| File                                               | Dòng             | Class cũ                             | Thay bằng         |
| -------------------------------------------------- | ---------------- | ------------------------------------ | ----------------- |
| `src/components/modals/IngredientEditModal.tsx`    | 320              | `ring-green-400/50`                  | `ring-ring/50`    |
| `src/components/modals/QuickAddIngredientForm.tsx` | 287              | `ring-green-400/50`                  | `ring-ring/50`    |
| Các file có numeric palette class                  | (grep phát hiện) | `text-blue-500`, `bg-emerald-100`... | Token equivalents |

---

### Wave 5: Docs + Verification (no code files)

Chỉ cập nhật docs + chụp 24 screenshots.

### Files KHÔNG thay đổi

- `src/components/GoogleDriveSync.tsx:176-188` — Google brand SVG colors (#4285F4, #34A853, #FBBC05, #EA4335)
- `src/index.css:182-301` — `@theme inline` block (all `var()` references, tự propagate)
- `src/index.css:153-160` — `pulse-subtle` animation (dùng `var(--primary)`, tự propagate)
- `src/index.css:403-433` — `@layer base` block (dùng tokens, tự propagate)
- 75 component files dùng 383 token-based classes — TẤT CẢ tự propagate từ W1

---

## Wave 1: Token Foundation (HIGHEST LEVERAGE)

> This single wave transforms ~80% of the app's appearance by changing token values.

### Task 1.1: Light Mode Token Replacement (`:root` block)

**Files:**

- Modify: `src/index.css:9-119`

**Monochrome OKLCH Value Map (0 chroma = pure gray):**

```
CURRENT → MONOCHROME mapping principle:
- High lightness colored → High lightness gray (same L, c=0, h=0)
- All hue/chroma stripped → oklch(L 0 0) format
```

- [ ] **Step 1: Replace core semantic tokens**

Replace lines 11-46 in `:root` block:

```css
/* Core surfaces */
--background: oklch(1 0 0); /* #FFFFFF — pure white */
--foreground: oklch(0.145 0 0); /* #0A0A0A — near-black */
--card: oklch(1 0 0); /* #FFFFFF */
--card-foreground: oklch(0.145 0 0); /* #0A0A0A */
--popover: oklch(1 0 0); /* #FFFFFF */
--popover-foreground: oklch(0.145 0 0); /* #0A0A0A */

/* Primary — BLACK button */
--primary: oklch(0.145 0 0); /* #0A0A0A — black */
--primary-foreground: oklch(1 0 0); /* #FFFFFF — white */
--primary-subtle: oklch(0.97 0 0); /* #F5F5F5 */
--primary-emphasis: oklch(0.253 0 0); /* #262626 */

/* Secondary */
--secondary: oklch(0.918 0 0); /* #E5E5E5 */
--secondary-foreground: oklch(0.145 0 0); /* #0A0A0A */

/* Muted — 3-tier text hierarchy: foreground > foreground-secondary > muted-foreground */
--muted: oklch(0.97 0 0); /* #F5F5F5 */
--muted-foreground: oklch(0.616 0 0); /* #8A8A8A — mockup --text-muted */

/* Accent */
--accent: oklch(0.97 0 0); /* #F5F5F5 */
--accent-foreground: oklch(0.145 0 0); /* #0A0A0A */

/* Accent highlight — was Violet, now medium gray */
--accent-highlight: oklch(0.432 0 0); /* #525252 */
--accent-highlight-foreground: oklch(1 0 0); /* #FFFFFF */
--accent-subtle: oklch(0.97 0 0); /* #F5F5F5 */
--accent-emphasis: oklch(0.304 0 0); /* #333333 */

/* Accent warm — was Orange, now medium gray */
--accent-warm: oklch(0.432 0 0); /* #525252 */
--accent-warm-foreground: oklch(1 0 0); /* #FFFFFF */

/* Destructive — KEEP RED (validation) */
--destructive: oklch(0.577 0.245 27.33); /* #DC2626 — unchanged! */

/* Borders */
--border: oklch(0.918 0 0); /* #E5E5E5 */
--input: oklch(0.918 0 0); /* #E5E5E5 */
--ring: oklch(0.145 0 0); /* #0A0A0A — black focus ring */

/* Extended */
--foreground-secondary: oklch(0.432 0 0); /* #525252 */
--border-subtle: oklch(0.955 0 0); /* #F0F0F0 */
```

- [ ] **Step 2: Replace macro nutrition tokens**

```css
/* ALL macros → foreground (differentiated by text labels) */
--macro-protein: oklch(0.145 0 0); /* Same as foreground */
--macro-protein-emphasis: oklch(0.145 0 0);
--macro-protein-subtle: oklch(0.97 0 0);

--macro-fat: oklch(0.432 0 0); /* Slightly lighter — secondary weight */
--macro-carbs: oklch(0.556 0 0); /* Medium gray */
--macro-carbs-emphasis: oklch(0.432 0 0);
--macro-carbs-subtle: oklch(0.97 0 0);

--macro-fiber: oklch(0.635 0 0); /* Muted level */
```

- [ ] **Step 3: Replace AI/Energy/Rose feature tokens**

```css
/* ALL feature colors → grayscale */
--color-ai: oklch(0.432 0 0); /* #525252 */
--color-ai-subtle: oklch(0.97 0 0); /* #F5F5F5 */
--color-ai-emphasis: oklch(0.304 0 0); /* #333333 */

--color-energy: oklch(0.556 0 0); /* #737373 */
--color-energy-emphasis: oklch(0.357 0 0); /* #404040 */
--color-energy-subtle: oklch(0.985 0 0); /* #FAFAFA */

--color-rose: oklch(0.556 0 0); /* #737373 */
--color-rose-emphasis: oklch(0.357 0 0); /* #404040 */
--color-rose-subtle: oklch(0.985 0 0); /* #FAFAFA */
```

- [ ] **Step 4: Replace status + toast tokens**

```css
/* Status — all gray */
--status-success: oklch(0.357 0 0); /* #404040 */
--status-warning: oklch(0.432 0 0); /* #525252 */
--status-info: oklch(0.556 0 0); /* #737373 */

/* Toast — error stays RED, rest gray */
--toast-error: oklch(0.577 0.245 27.33); /* RED — keep for error visibility */
--toast-error-subtle: oklch(0.971 0.013 17.38); /* Light red bg — keep */
--toast-error-emphasis: oklch(0.455 0.188 13.7); /* Dark red — keep */

--toast-warning: oklch(0.432 0 0); /* #525252 */
--toast-warning-subtle: oklch(0.97 0 0); /* #F5F5F5 */
--toast-warning-emphasis: oklch(0.253 0 0); /* #262626 */

--toast-info: oklch(0.556 0 0); /* #737373 */
--toast-info-subtle: oklch(0.97 0 0); /* #F5F5F5 */
--toast-info-emphasis: oklch(0.304 0 0); /* #333333 */
```

- [ ] **Step 5: Replace meal type + compare + destructive variant tokens**

```css
/* Meal types — all same foreground */
--meal-breakfast: oklch(0.432 0 0); /* #525252 */
--meal-lunch: oklch(0.357 0 0); /* #404040 */
--meal-dinner: oklch(0.304 0 0); /* #333333 */

/* Compare — gray tones */
--compare-active: oklch(0.357 0 0); /* #404040 */
--compare-default: oklch(0.556 0 0); /* #737373 */

/* Destructive variants — KEEP RED */
--destructive-emphasis: oklch(0.505 0.213 27.33); /* Red-700 — keep */
--destructive-subtle: oklch(0.971 0.013 17.38); /* Red-50 — keep */
```

- [ ] **Step 6: Replace shadow-glow and focus-visible**

Line 112 (shadow-glow):

```css
--shadow-glow: 0 2px 6px oklch(0.145 0 0 / 0.15); /* Black shadow, subtle */
```

Lines 137-140 (focus-visible):

```css
:focus-visible {
  outline: 2px solid oklch(0.145 0 0); /* Black focus ring */
  outline-offset: 2px;
  border-radius: 8px;
}
```

- [ ] **Step 7: Run lint to verify CSS is valid**

```bash
npm run lint
```

Expected: 0 errors

### Task 1.2: Dark Mode Token Replacement (`.dark` block)

**Files:**

- Modify: `src/index.css:303-385`

- [ ] **Step 1: Replace ALL dark mode token values**

Dark mode = exact inversion of light (white text on black bg):

```css
.dark {
  /* Core surfaces */
  --background: oklch(0.145 0 0); /* #0A0A0A — near-black */
  --foreground: oklch(0.985 0 0); /* #FAFAFA — off-white */
  --card: oklch(0.168 0 0); /* #141414 */
  --card-foreground: oklch(0.985 0 0); /* #FAFAFA */
  --popover: oklch(0.168 0 0); /* #141414 */
  --popover-foreground: oklch(0.985 0 0); /* #FAFAFA */

  /* Primary — WHITE button in dark */
  --primary: oklch(0.985 0 0); /* #FAFAFA */
  --primary-foreground: oklch(0.145 0 0); /* #0A0A0A */
  --primary-subtle: oklch(0.213 0 0 / 20%); /* Subtle dark bg */
  --primary-emphasis: oklch(0.985 0 0); /* #FAFAFA */

  /* Secondary */
  --secondary: oklch(0.253 0 0); /* #262626 */
  --secondary-foreground: oklch(0.985 0 0); /* #FAFAFA */

  /* Muted — 3-tier text: foreground > secondary > muted */
  --muted: oklch(0.213 0 0); /* #1C1C1C */
  --muted-foreground: oklch(0.556 0 0); /* #737373 — mockup dark --text-muted */

  /* Accent */
  --accent: oklch(0.213 0 0); /* #1C1C1C */
  --accent-foreground: oklch(0.985 0 0); /* #FAFAFA */

  /* Accent highlight */
  --accent-highlight: oklch(0.717 0 0); /* #A3A3A3 */
  --accent-highlight-foreground: oklch(0.145 0 0); /* #0A0A0A */
  --accent-subtle: oklch(0.213 0 0); /* #1C1C1C */
  --accent-emphasis: oklch(0.87 0 0); /* #D4D4D4 */

  /* Accent warm */
  --accent-warm: oklch(0.717 0 0); /* #A3A3A3 */
  --accent-warm-foreground: oklch(0.145 0 0); /* #0A0A0A */

  /* Destructive — KEEP RED */
  --destructive: oklch(0.704 0.191 22.216); /* Red-400 — unchanged */
  --destructive-emphasis: oklch(0.704 0.191 22.216);
  --destructive-subtle: oklch(0.213 0.04 24); /* Dark red subtle */

  /* Borders — SOLID grays (not alpha whites — per mockup) */
  --border: oklch(0.253 0 0); /* #262626 — mockup --border-default */
  --input: oklch(0.304 0 0); /* #333333 — slightly lighter for input focus */
  --ring: oklch(0.985 0 0); /* White focus ring */

  /* Extended */
  --foreground-secondary: oklch(0.717 0 0); /* #A3A3A3 — mockup --text-secondary */
  --border-subtle: oklch(0.213 0 0); /* #1C1C1C — subtler than border */

  /* Macro nutrition — grayscale */
  --macro-protein: oklch(0.985 0 0); /* White (foreground) */
  --macro-protein-emphasis: oklch(0.985 0 0);
  --macro-protein-subtle: oklch(0.253 0 0 / 30%);

  --macro-fat: oklch(0.717 0 0); /* #A3A3A3 */
  --macro-carbs: oklch(0.556 0 0); /* #737373 */
  --macro-carbs-emphasis: oklch(0.717 0 0);
  --macro-carbs-subtle: oklch(0.213 0 0);

  --macro-fiber: oklch(0.432 0 0);

  /* AI/Energy/Rose — grayscale */
  --color-ai: oklch(0.717 0 0);
  --color-ai-subtle: oklch(0.213 0 0 / 30%);
  --color-ai-emphasis: oklch(0.717 0 0);

  --color-energy: oklch(0.717 0 0);
  --color-energy-emphasis: oklch(0.717 0 0);
  --color-energy-subtle: oklch(0.253 0 0);

  --color-rose: oklch(0.717 0 0);
  --color-rose-emphasis: oklch(0.717 0 0);
  --color-rose-subtle: oklch(0.213 0 0);

  /* Status — gray */
  --status-success: oklch(0.87 0 0);
  --status-warning: oklch(0.717 0 0);
  --status-info: oklch(0.556 0 0);

  /* Toast — error stays RED, rest gray */
  --toast-error: oklch(0.704 0.191 22.216); /* Red-400 — keep */
  --toast-error-subtle: oklch(0.213 0.04 16 / 30%);
  --toast-error-emphasis: oklch(0.87 0.05 14);
  --toast-warning: oklch(0.717 0 0);
  --toast-warning-subtle: oklch(0.213 0 0 / 30%);
  --toast-warning-emphasis: oklch(0.87 0 0);
  --toast-info: oklch(0.556 0 0);
  --toast-info-subtle: oklch(0.213 0 0 / 30%);
  --toast-info-emphasis: oklch(0.87 0 0);

  /* Meal types — grayscale */
  --meal-breakfast: oklch(0.717 0 0);
  --meal-lunch: oklch(0.556 0 0);
  --meal-dinner: oklch(0.432 0 0);

  /* Compare — grayscale */
  --compare-active: oklch(0.87 0 0);
  --compare-default: oklch(0.556 0 0);

  /* Shadow glow */
  --shadow-glow: 0 2px 6px oklch(0.985 0 0 / 0.1); /* White shadow */
}
```

- [ ] **Step 2: Update pulse-subtle animation** (line ~153-160)

The animation uses `oklch(from var(--primary) l c h / 0.3)` — this auto-updates since `--primary` changes. **No manual change needed.** Verify only.

- [ ] **Step 3: Run lint + build**

```bash
npm run lint && npm run build
```

Expected: 0 errors, clean build

### Task 1.3: Rewrite colors.ts

**Files:**

- Modify: `src/constant/colors.ts`

> ⚠️ **No dedicated test file exists** for `colors.ts`. Consumers are tested via their own test files.

- [ ] **Step 1: Replace all hex values with grayscale**

```typescript
/** Design token hex values — monochrome grayscale palette */
export const COLORS = {
  gray950: '#0a0a0a',
  gray800: '#262626',
  gray700: '#404040',
  gray600: '#525252',
  gray500: '#737373',
  gray400: '#a3a3a3',
  gray300: '#d4d4d4',
  gray200: '#e5e5e5',
  gray50: '#fafafa',
  red600: '#dc2626',
} as const;

export const MACRO_COLORS = {
  protein: { light: COLORS.gray950, dark: COLORS.gray50 },
  fat: { light: COLORS.gray500, dark: COLORS.gray400 },
  carbs: { light: COLORS.gray300, dark: COLORS.gray600 },
} as const;
```

- [ ] **Step 2: Verify no remaining old COLORS key references**

```bash
grep -rn 'COLORS\.\(emerald\|amber\|blue\)' src/ --include='*.ts' --include='*.tsx'
```

Expected: 0 matches. Confirmed by audit: ONLY `MacroChart.tsx` and `MacroDonutChart.tsx` import COLORS.
ProgressDashboard does NOT use COLORS.\* directly (false positive from initial audit).

- [ ] **Step 3: Run lint to verify**

```bash
npm run lint
```

### Task 1.3b: Fix Chart Dark Mode (MOVED FROM Wave 3 — prevents regression)

> **Why here**: Both charts import MACRO_COLORS from colors.ts. After Task 1.3, values are grayscale.
> But both charts ONLY render `.light` variant, ignoring dark mode. Fix now to prevent visual regression.
>
> **Current state (verified by code inspection):**
>
> - `MacroDonutChart.tsx` uses `.light` ONLY — no dark mode handling at all
> - `MacroChart.tsx` defines `darkColor` property but NEVER uses it in SVG render (lines 109-115 use `arc.color` only)

**Files:**

- Modify: `src/components/nutrition/MacroDonutChart.tsx`
- Modify: `src/components/schedule/MacroChart.tsx`

- [ ] **Step 1: Add dark mode to MacroDonutChart**

Add `useDarkMode` import and use correct color variant:

```typescript
import { useDarkMode } from '@/hooks/useDarkMode';

// Inside component, before segments:
const { isDark } = useDarkMode();

// Update segments to use mode-aware colors:
const segments: { cal: number; color: string; testId: string }[] = [
  { cal: proteinCal, color: isDark ? MACRO_COLORS.protein.dark : MACRO_COLORS.protein.light, testId: 'arc-protein' },
  { cal: fatCal, color: isDark ? MACRO_COLORS.fat.dark : MACRO_COLORS.fat.light, testId: 'arc-fat' },
  { cal: carbsCal, color: isDark ? MACRO_COLORS.carbs.dark : MACRO_COLORS.carbs.light, testId: 'arc-carbs' },
];
```

- [ ] **Step 2: Fix MacroChart to USE darkColor in render**

Add `useDarkMode` import and use it in SVG rendering:

```typescript
import { useDarkMode } from '@/hooks/useDarkMode';

// Inside component:
const { isDark } = useDarkMode();

// Line ~109: Change SVG circle stroke:
stroke={isDark ? arc.darkColor : arc.color}

// Line ~122: Change legend indicator bg:
style={{ backgroundColor: isDark ? seg.darkColor : seg.color }}
```

- [ ] **Step 3: Run chart tests**

```bash
npx vitest run src/__tests__/MacroDonutChart.test.tsx src/__tests__/scheduleComponents.test.tsx -v
```

> **Test impact analysis (verified):**
>
> - `MacroDonutChart.test.tsx` — tests rendering presence only, NO color hex assertions → PASS
> - `scheduleComponents.test.tsx:811-830` — tests MacroChart via testid presence only → PASS
> - No test file exists for MacroChart in isolation (only via scheduleComponents)

### Task 1.4: Update useDarkMode.ts Meta Theme Color

**Files:**

- Modify: `src/hooks/useDarkMode.ts:29`

- [ ] **Step 1: Replace hardcoded hex values**

```typescript
// Line 29 — old:
if (meta) meta.setAttribute('content', isDark ? '#0f172a' : '#10b981');
// Line 29 — new:
if (meta) meta.setAttribute('content', isDark ? '#0a0a0a' : '#ffffff');
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

### Task 1.5: Wave 1 Quality Gate

- [ ] **Step 1: Full quality pipeline**

```bash
npm run lint && npm run test && npm run build
```

Expected: 0 lint errors, 0 test failures, clean build

- [ ] **Step 2: Visual verification**

Build APK, install on emulator, screenshot key screens (Calendar, Dashboard, Settings) in both light + dark mode. Compare with mockup.

- [ ] **Step 3: Commit (orchestrator only)**

```bash
git add -A && git commit -m "refactor: replace entire color system with monochrome grayscale

- Replace 105 CSS custom properties in index.css (light + dark mode)
- Rewrite colors.ts with grayscale hex palette
- Fix chart dark mode (MacroDonutChart + MacroChart)
- Update meta theme-color to black/white
- Update focus ring and shadow-glow to neutral
- Keep validation red (--destructive, --toast-error) only

Design reference: docs/mockup-monochrome-calendar.html

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Wave 2: Component Variant Updates

> After token changes, colored badge/button variants and toasts render as gray automatically. But variant LOGIC may need updates for visual clarity.

### Task 2.1: Badge Variant Consolidation

**Files:**

- Modify: `src/components/ui/badge.tsx`

- [ ] **Step 1: Simplify colored variants to monochrome equivalents**

Since all color tokens are now grayscale, variants like `success`, `warning`, `ai`, `protein`, `fat`, `carbs` all render similarly. Consolidate visual styles:

```typescript
const badgeVariants = cva(
  'group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a]:hover:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80',
        destructive:
          'bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20',
        outline: 'border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground',
        ghost: 'hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50',
        link: 'text-primary underline-offset-4 hover:underline',
        // Monochrome: all semantic variants → muted style (tokens already grayscale)
        success: 'border-transparent bg-muted text-foreground',
        warning: 'border-transparent bg-muted text-foreground-secondary',
        ai: 'border-transparent bg-muted text-foreground-secondary',
        protein: 'border-transparent bg-muted text-foreground',
        fat: 'border-transparent bg-muted text-foreground-secondary',
        carbs: 'border-transparent bg-muted text-foreground-secondary',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);
```

**Key**: Keep variant names in API (backward compatible), make them render as monochrome. Components using `variant="protein"` still work, just render gray.

- [ ] **Step 2: Update badge tests**

```bash
npx vitest run src/__tests__/AiBadge.test.tsx src/__tests__/components.test.tsx -v
```

> Note: `components.test.tsx:331` asserts `.bg-rose` class on AI badge. Since `--color-rose` token
> name stays (only value changes), `.bg-rose` class still exists → test PASSES without changes.

### Task 2.2: Button Variant Update

**Files:**

- Modify: `src/components/ui/button.tsx`

- [ ] **Step 1: Check if warning variant exists and update**

```bash
grep -n 'warning' src/components/ui/button.tsx
```

If `warning` variant exists, change its styles to monochrome (same as `secondary` or `outline`).

- [ ] **Step 2: Run lint + test**

```bash
npm run lint && npx vitest run src/__tests__/CloseButton.test.tsx -v
```

> Note: No generic button.test.ts exists. CloseButton test is the closest coverage.

### Task 2.3: Toast Notification Styles

**Files:**

- Modify: `src/contexts/NotificationContext.tsx:42-78`

- [ ] **Step 1: Update TOAST_STYLES to monochrome (error stays red)**

```typescript
const TOAST_STYLES: Record<
  NotificationType,
  { border: string; iconBg: string; title: string; message: string; icon: React.ReactNode; progressBar: string }
> = {
  success: {
    border: 'border-border',
    iconBg: 'bg-muted text-foreground',
    title: 'text-foreground',
    message: 'text-foreground-secondary',
    icon: <CheckCircle2 className="h-5 w-5" />,
    progressBar: 'bg-foreground',
  },
  error: {
    // KEEP RED for error visibility
    border: 'border-toast-error/20',
    iconBg: 'bg-toast-error-subtle text-toast-error',
    title: 'text-toast-error-emphasis',
    message: 'text-toast-error',
    icon: <XCircle className="h-5 w-5" />,
    progressBar: 'bg-toast-error',
  },
  warning: {
    border: 'border-border',
    iconBg: 'bg-muted text-foreground-secondary',
    title: 'text-foreground',
    message: 'text-foreground-secondary',
    icon: <AlertTriangle className="h-5 w-5" />,
    progressBar: 'bg-foreground-secondary',
  },
  info: {
    border: 'border-border',
    iconBg: 'bg-muted text-foreground-secondary',
    title: 'text-foreground',
    message: 'text-foreground-secondary',
    icon: <Info className="h-5 w-5" />,
    progressBar: 'bg-foreground-secondary',
  },
};
```

- [ ] **Step 2: Update NotificationContext tests**

```bash
npx vitest run src/__tests__/NotificationContext.test.tsx -v
```

### Task 2.4: Wave 2 Quality Gate

- [ ] **Step 1: Full quality pipeline**

```bash
npm run lint && npm run test && npm run build
```

- [ ] **Step 2: Commit (orchestrator only)**

```bash
git add -A && git commit -m "refactor: update badge/button/toast variants to monochrome

- Badge: 12 variants simplified to monochrome equivalents
- Toast: success/warning/info → grayscale, error stays red
- Button: warning variant → monochrome

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Wave 3: Gradients + Orphan Cleanup

### Task 3.1: Gradient Simplification

> Charts are now handled in Task 1.3b (Wave 1). This wave focuses on gradients and orphan cleanup.

**Files (7 gradient instances in 6 files):**

- Modify: `src/components/AnalysisResultView.tsx:55`
- Modify: `src/features/fitness/components/WorkoutSummaryCard.tsx:37`
- Modify: `src/features/fitness/components/ProgressDashboard.tsx:317`
- Modify: `src/features/fitness/components/PlanGeneratedCard.tsx:18`
- Modify: `src/features/fitness/components/PRToast.tsx:24`
- Modify: `src/features/fitness/components/TrainingPlanView.tsx:748,943`

- [ ] **Step 1: Replace gradient compositions with flat or subtle grayscale**

Pattern: `bg-gradient-to-br from-primary/90 to-primary` → `bg-primary`

For each file, replace the gradient class with a flat bg:

```
AnalysisResultView.tsx:55   — from-primary/10 to-color-ai-subtle → bg-muted
WorkoutSummaryCard.tsx:37   — from-color-energy to-color-energy/80 → bg-primary
ProgressDashboard.tsx:317   — from-primary/90 to-primary → bg-primary
PlanGeneratedCard.tsx:18    — from-primary/90 to-primary → bg-primary
PRToast.tsx:24              — from-color-energy to-color-energy/80 → bg-primary
TrainingPlanView.tsx:748    — from-info/80 to-info → bg-primary
TrainingPlanView.tsx:943    — from-info/80 to-info → bg-primary
```

- [ ] **Step 2: Run affected tests**

```bash
npx vitest run src/__tests__/TrainingPlanView.test.tsx src/__tests__/ProgressDashboard.test.tsx src/__tests__/WorkoutSummaryCard.test.tsx src/__tests__/PRToast.test.tsx src/__tests__/analysisResultView.test.tsx -v
```

### Task 3.2: Delete Orphaned tokens.css

**Files:**

- Delete: `src/styles/tokens.css`

> **Verified**: `tokens.css` is NOT imported anywhere in the codebase. It's an orphaned file
> superseded by CSS custom properties in `src/index.css`. Contains old emerald/amber/blue tokens
> that conflict with monochrome design.

- [ ] **Step 1: Verify no imports**

```bash
grep -rn 'tokens.css' src/ --include='*.ts' --include='*.tsx' --include='*.css'
```

Expected: 0 matches

- [ ] **Step 2: Delete the file**

```bash
rm src/styles/tokens.css
```

### Task 3.3: Wave 3 Quality Gate

- [ ] **Step 1: Full quality pipeline**

```bash
npm run lint && npm run test && npm run build
```

- [ ] **Step 2: Commit (orchestrator only)**

```bash
git add -A && git commit -m "refactor: simplify gradients + remove orphaned tokens.css

- 7 gradient compositions → flat monochrome backgrounds
- Delete orphaned src/styles/tokens.css (not imported anywhere)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Wave 4: Component Sweep + Test Updates

> After Waves 1-3, the token-level changes auto-propagate to most components. This wave handles any remaining explicit color classes that bypass tokens or need semantic updates.

### Task 4.1: Scan for Remaining Explicit Color Classes

> After Waves 1-3, **all token-based classes** (e.g. `text-rose`, `text-energy`, `text-info`, `bg-primary`) are already monochrome because their underlying CSS values changed. This task targets only **Tailwind numeric palette classes** (`text-blue-500`, `bg-emerald-100`, etc.) and **inline color styles** that bypass the token system entirely.

- [ ] **Step 1: Find all numeric palette color classes in components**

```bash
# Find Tailwind NUMERIC palette classes (e.g. text-blue-500, bg-emerald-100, border-sky-300)
# These bypass CSS tokens and need manual replacement.
grep -rn -E '(text|bg|border|ring|from|to|via)-(blue|sky|amber|emerald|indigo|violet|orange|green|teal|cyan|lime|yellow|pink|fuchsia|purple|slate|zinc|stone|neutral|gray)-[0-9]' src/ --include='*.tsx' --include='*.ts' | grep -v '__tests__' | grep -v 'node_modules'
```

Also check for inline color styles:

```bash
grep -rn -E "style=.*color.*#[0-9a-fA-F]" src/ --include='*.tsx' --include='*.ts' | grep -v '__tests__' | grep -v 'node_modules'
```

- [ ] **Step 2: Replace each explicit numeric palette class**

Mapping:

```
ring-green-400/50 → ring-ring/50   (2 files: IngredientEditModal.tsx:320, QuickAddIngredientForm.tsx:287)
text-blue-500   → text-foreground-secondary
text-blue-600   → text-foreground
text-sky-500    → text-foreground-secondary
text-amber-500  → text-foreground-secondary
text-emerald-500 → text-foreground or text-primary
text-emerald-600 → text-foreground
bg-blue-50      → bg-muted
bg-blue-500     → bg-primary
bg-emerald-50   → bg-muted
bg-emerald-500  → bg-primary
bg-amber-50     → bg-muted
border-blue-200 → border-border
border-blue-500 → border-border
inline style color: #hex → remove or use CSS variable
```

**Exception**: Classes inside `__tests__/` — update in Task 4.2.
**Exception**: `text-red-*` / `bg-red-*` — keep if validation-related, else → grayscale.
**Exception**: Token-based classes (`text-rose`, `text-energy`, `text-info`, etc.) — already grayscale from W1, DO NOT touch.

- [ ] **Step 3: Verify no remaining numeric palette classes**

```bash
# Same regex as Step 1 — must return 0 matches
grep -rn -E '(text|bg|border|ring|from|to|via)-(blue|sky|amber|emerald|indigo|violet|orange|green|teal|cyan|lime|yellow|pink|fuchsia|purple|slate|zinc|stone|neutral|gray)-[0-9]' src/ --include='*.tsx' --include='*.ts' | grep -v '__tests__' | grep -v 'node_modules' | wc -l
```

Expected: 0

### Task 4.2: Update Test Files

- [ ] **Step 1: Find tests asserting on old color classes**

```bash
grep -rn 'text-primary\|bg-primary\|text-emerald\|text-blue\|text-energy\|text-ai\|text-macro' src/__tests__/ --include='*.tsx' --include='*.ts' | head -30
```

- [ ] **Step 2: Update test assertions**

Tests that check for specific Tailwind classes (like `expect(element).toHaveClass('text-energy')`) should still pass since the class names don't change — only the underlying CSS values change. **Most tests need no changes.**

Tests that check for specific color VALUES (hex/rgb) in inline styles need updating to grayscale values.

- [ ] **Step 3: Run full test suite**

```bash
npm run test
```

Expected: 0 failures

### Task 4.3: Wave 4 Quality Gate

- [ ] **Step 1: Full quality pipeline + SonarQube**

```bash
npm run lint && npm run test && npm run build
npm run test:coverage && npm run sonar
```

Expected: 0 lint errors, 0 test failures, clean build, 0 SonarQube issues

- [ ] **Step 2: Emulator verification**

Build APK → install → screenshot ALL major screens (Calendar meals, Calendar nutrition, Dashboard, Library, Settings, Fitness) in both light + dark mode.

- [ ] **Step 3: Commit (orchestrator only)**

```bash
git add -A && git commit -m "refactor: complete monochrome sweep — explicit colors + tests

- Replace all explicit Tailwind color classes with token-based equivalents
- Update test assertions for new color values (if any)
- Full SonarQube + emulator verification

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Wave 5: Documentation + Final Verification

### Task 5.1: Update Design Documentation

**Files:**

- Modify: `docs/web-design-review-report.md` — Add monochrome migration appendix

- [ ] **Step 1: Add Appendix D — Monochrome Migration Record**

Document:

- Date of migration
- Design reference (mockup file path)
- Token value changes summary
- Kept exceptions (validation red, toast error red)
- Impact on deferred TODOs (which become irrelevant)

### Task 5.2: Review Deferred TODOs Superseded by Monochrome

The following deferred TODOs from the previous plan are now **superseded** by the monochrome refactor:

| TODO                           | Previous Concern                        | Status Post-Monochrome                                       |
| ------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| TODO-02                        | Dark mode foreground-secondary contrast | **Superseded** — new OKLCH values designed for contrast      |
| TODO-09                        | Progress bar opacity too low            | **Superseded** — monochrome progress uses 100% foreground    |
| TODO-11                        | Card elevation dark mode                | **Superseded** — new card bg values designed for separation  |
| Deferred: 60-30-10 color ratio | Color system balance                    | **Superseded** — monochrome eliminates color balance concern |
| Deferred: Macro color coding   | Distinct protein/fat/carbs colors       | **Superseded** — text labels replace color coding            |

- [ ] **Step 1: Update `docs/superpowers/plans/2026-07-30-monochrome-refactor.md` marking superseded TODOs as complete**

### Task 5.3: Final Emulator Screenshot Suite

- [ ] **Step 1: Full screenshot pass — 12 screens × 2 modes = 24 screenshots**

Screens: Calendar (meals), Calendar (nutrition), Dashboard, Library (dishes), Library (ingredients), Settings (profile), Settings (goal), Fitness (plan), Fitness (progress), AI Analysis, Onboarding (1st screen), Planner modal

Save to: `screenshots/monochrome-refactor/`

- [ ] **Step 2: Compare each with mockup design tokens**

Verify:

- Light: white bg, black text, gray borders ✓
- Dark: black bg, white text, gray borders ✓
- Only red = validation errors ✓
- Charts show grayscale differentiation ✓
- Toasts: error = red, others = gray ✓

---

## Audit Summary (2026-04-08)

| Category                              | Count                           | Scope                        |
| ------------------------------------- | ------------------------------- | ---------------------------- |
| **CSS custom properties (total)**     | 124 (62 light + 62 dark)        | `src/index.css`              |
| **Highly saturated (chroma ≥0.15)**   | ~50                             | Need → oklch(L 0 0)          |
| **Near-grayscale (chroma 0.01-0.05)** | ~22                             | Need → oklch(L 0 0)          |
| **Already grayscale (chroma=0)**      | 7                               | No change                    |
| **Token-based semantic color usages** | 383 across 75 files             | Auto-propagate from W1       |
| **Numeric palette bypasses**          | 2 (`ring-green-400/50`)         | W4 manual fix                |
| **Inline hex/rgb styles**             | 0                               | ✅ Clean                     |
| **Gradient instances**                | 7 in 6 files                    | W3 flatten                   |
| **Hardcoded hex (colors.ts)**         | 10 values + MACRO_COLORS        | W1 rewrite                   |
| **Chart dark mode bug**               | 2 files (dead `darkColor` code) | W1 fix                       |
| **Google SVG brand colors**           | 4 values                        | Exempt — don't touch         |
| **Focus ring hardcoded**              | 1 (line 138)                    | W1 fix                       |
| **Shadow-glow colored**               | 2 (line 112 + 384)              | W1 fix                       |
| **Pulse animation inherits color**    | 1 (line 153-160)                | W1 auto (inherits --primary) |
| **Orphaned tokens.css**               | 1 file                          | W3 delete                    |

---

## Summary

| Wave                   | Tasks  | Files                                                           | Effort | Auto-propagation                                          |
| ---------------------- | ------ | --------------------------------------------------------------- | ------ | --------------------------------------------------------- |
| 1: Token Foundation    | 6      | 5 files (index.css, colors.ts, useDarkMode.ts, 2 charts)        | Medium | ~80% of UI (383 usages across 75 files) + chart dark mode |
| 2: Component Variants  | 4      | 3 files (badge, button, toast)                                  | Low    | Variant API compatible                                    |
| 3: Gradients + Cleanup | 3      | 7 files (6 gradient files + delete tokens.css)                  | Low    | Flat bg replacements                                      |
| 4: Sweep + Tests       | 3      | ~5 files (2 ring-green + any remaining numeric palette + tests) | Low    | Narrow scope post-W1                                      |
| 5: Docs + Verification | 3      | 2 docs + screenshots                                            | Low    | Documentation only                                        |
| **TOTAL**              | **19** | **~22 files**                                                   |        |                                                           |

**Key insight**: Wave 1 alone (5 files) transforms ~80% of the app — 383 token-based color usages across 75 files auto-propagate. Wave 4 is much smaller than originally planned because nearly all color classes use tokens, not numeric palettes.
