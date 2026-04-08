# DESIGN GUIDE — Smart Meal Planner (Android)

> **Version:** 1.0 — June 2025
> **Audience:** UI/UX Designers creating Figma mockups from scratch
> **Stack:** React 19 · TypeScript · Tailwind CSS v4 · Capacitor 8 · Android only
> **Language:** Vietnamese UI with this guide written in English

---

## Table of Contents

1. [Project Overview & Platform](#chapter-1-project-overview--platform)
2. [Design System](#chapter-2-design-system)
3. [UI Components Reference](#chapter-3-ui-components-reference)
4. [Navigation Architecture](#chapter-4-navigation-architecture)
5. [Onboarding Flow](#chapter-5-onboarding-flow)
6. [Calendar Tab](#chapter-6-calendar-tab)
7. [Library Tab](#chapter-7-library-tab)
8. [AI Analysis Tab](#chapter-8-ai-analysis-tab)
9. [Fitness Tab](#chapter-9-fitness-tab)
10. [Dashboard Tab](#chapter-10-dashboard-tab)
11. [Settings & Overlays](#chapter-11-settings--overlays)
12. [Build APK & Emulator Setup](#chapter-12-build-apk--emulator-setup)

---

## Chapter 1: Project Overview & Platform

### 1.1 App Description

**Smart Meal Planner** is an all-in-one Android application for nutrition management and workout tracking.

| Aspect             | Detail                                                        |
| ------------------ | ------------------------------------------------------------- |
| **Type**           | Offline-first mobile app                                      |
| **Platform**       | Android only (APK via Capacitor 8)                            |
| **UI Language**    | Vietnamese                                                    |
| **AI Integration** | Google Gemini — food image analysis, meal/workout suggestions |
| **Offline**        | Full functionality without internet (except AI features)      |
| **Data Storage**   | SQLite (native, persistent on device)                         |
| **Sync**           | Optional Google Drive backup/restore                          |

### 1.2 Platform Constraints

| Constraint               | Value                                                    |
| ------------------------ | -------------------------------------------------------- |
| **Viewport width**       | 360–412 px (standard Android phones)                     |
| **Reference device**     | Pixel 7 — 1080 x 2400 px, 420 dpi                        |
| **Safe area — top**      | Status bar ~24 dp                                        |
| **Safe area — bottom**   | Navigation bar ~48 dp                                    |
| **Rendering engine**     | Capacitor WebView (Chrome-based)                         |
| **Bottom nav**           | 5 tabs, always visible unless a full-screen page is open |
| **Touch target minimum** | 44 x 44 dp (all interactive elements)                    |
| **Font rendering**       | System font stack (no custom fonts loaded)               |

### 1.3 Screen Inventory

| Category                  | Count   | Examples                                                                                  |
| ------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| Main tabs                 | 5       | Calendar, Library, AI Analysis, Fitness, Dashboard                                        |
| Sub-tab views             | 7       | Calendar (Meals/Nutrition), Library (Dishes/Ingredients), Fitness (Plan/Progress/History) |
| Full-screen overlay pages | 8       | Settings, WorkoutLogger, CardioLogger, PlanDayEditor, etc.                                |
| Settings detail pages     | 3       | Health Profile, Goal, Training Profile                                                    |
| Modal dialogs             | 14+     | MealPlanner, DishEdit, IngredientEdit, Confirmation, etc.                                 |
| Bottom sheets             | 7       | Filter, ExerciseSelector, WeightQuickLog, SwapExercise, etc.                              |
| **Total unique screens**  | **45+** |                                                                                           |

---

## Chapter 2: Design System

### 2.1 Color Palette

All colors use **OKLCH** format for perceptual uniformity. When importing to Figma, convert OKLCH values to HEX/RGB using a tool like [oklch.com](https://oklch.com).

#### Primary & Brand Colors

| Token                  | OKLCH                       | Approx. HEX | Usage                                |
| ---------------------- | --------------------------- | ----------- | ------------------------------------ |
| `primary`              | `oklch(0.627 0.194 163.95)` | #059669     | CTAs, active states, primary buttons |
| `primary-foreground`   | `oklch(1 0 0)`              | #FFFFFF     | Text on primary backgrounds          |
| `primary-subtle`       | `oklch(0.962 0.044 163.25)` | #ECFDF5     | Light tinted backgrounds             |
| `primary-emphasis`     | `oklch(0.527 0.154 163.45)` | #047857     | Hover/pressed primary                |
| `secondary`            | `oklch(0.696 0.17 162.48)`  | #10B981     | Secondary actions                    |
| `secondary-foreground` | `oklch(1 0 0)`              | #FFFFFF     | Text on secondary                    |
| `destructive`          | `oklch(0.637 0.237 25.33)`  | #EF4444     | Delete, errors, danger               |
| `accent-warm`          | `oklch(0.606 0.222 22)`     | #EA580C     | CTA highlights (orange)              |
| `accent-highlight`     | `oklch(0.606 0.25 292.72)`  | #8B5CF6     | Special highlights (violet)          |
| `accent-subtle`        | `oklch(0.969 0.016 293.76)` | ~Violet-50  | Light violet tint                    |

#### Macro Nutrition Colors

These colors appear in charts, badges, and progress bars throughout the app.

| Token              | OKLCH                       | Approx. HEX | Macro             |
| ------------------ | --------------------------- | ----------- | ----------------- |
| `protein`          | `oklch(0.588 0.158 241.97)` | #0284C7     | Protein (Sky-600) |
| `protein-emphasis` | `oklch(0.443 0.11 240.8)`   | ~Sky-800    | Dark protein      |
| `protein-subtle`   | `oklch(0.977 0.013 236.6)`  | ~Sky-50     | Light protein bg  |
| `fat`              | `oklch(0.555 0.163 48.99)`  | #B45309     | Fat (Amber-700)   |
| `carbs`            | `oklch(0.546 0.245 262.88)` | #2563EB     | Carbs (Blue-600)  |
| `carbs-emphasis`   | `oklch(0.488 0.243 264.06)` | #1D4ED8     | Dark carbs        |
| `carbs-subtle`     | `oklch(0.97 0.014 254.6)`   | #EFF6FF     | Light carbs bg    |
| `fiber`            | `oklch(0.527 0.198 142.5)`  | #15803D     | Fiber (Green-700) |

#### Meal Type Colors

Each meal time has a distinct color used for section headers, badges, and icons.

| Token       | OKLCH                        | Approx. HEX | Meal                 |
| ----------- | ---------------------------- | ----------- | -------------------- |
| `breakfast` | `oklch(0.795 0.184 86.047)`  | ~Amber-400  | Bua Sang (Breakfast) |
| `lunch`     | `oklch(0.685 0.169 237.323)` | ~Sky-500    | Bua Trua (Lunch)     |
| `dinner`    | `oklch(0.585 0.233 277.117)` | ~Indigo-500 | Bua Toi (Dinner)     |

#### Status Colors

| Token            | OKLCH                       | Approx. HEX | Usage                  |
| ---------------- | --------------------------- | ----------- | ---------------------- |
| `success`        | `oklch(0.637 0.16 163.89)`  | #059669     | Positive confirmations |
| `warning`        | `oklch(0.666 0.179 58.32)`  | #D97706     | Caution states         |
| `error`          | `oklch(0.637 0.237 25.33)`  | #EF4444     | Errors, destructive    |
| `error-emphasis` | `oklch(0.505 0.213 27.33)`  | #B91C1C     | Darker error           |
| `error-subtle`   | `oklch(0.971 0.013 17.38)`  | #FEF2F2     | Error background       |
| `info`           | `oklch(0.546 0.245 262.88)` | #2563EB     | Informational          |

#### Toast Notification Colors

Toasts use a 3-tier color system: **base** (icon/border), **subtle** (background), **emphasis** (text).

| Type    | Base                                | Subtle (bg)                        | Emphasis (text)                    |
| ------- | ----------------------------------- | ---------------------------------- | ---------------------------------- |
| Error   | Rose-500 `oklch(0.645 0.246 16.4)`  | Rose-50 `oklch(0.969 0.015 12.4)`  | Rose-800 `oklch(0.455 0.188 13.7)` |
| Warning | Amber-500 `oklch(0.769 0.188 70.1)` | Amber-50 `oklch(0.987 0.022 95.3)` | Amber-800 `oklch(0.513 0.165 55)`  |
| Info    | Sky-500 `oklch(0.685 0.169 237.3)`  | Sky-50 `oklch(0.977 0.013 236.6)`  | Sky-800 `oklch(0.443 0.11 240.8)`  |

#### Domain-Specific Colors

| Token             | OKLCH                      | Approx. HEX | Domain             |
| ----------------- | -------------------------- | ----------- | ------------------ |
| `ai`              | `oklch(0.585 0.233 277.1)` | ~Indigo-500 | AI features        |
| `ai-subtle`       | `oklch(0.962 0.018 272.3)` | ~Indigo-50  | AI backgrounds     |
| `ai-emphasis`     | `oklch(0.457 0.24 277.02)` | #4338CA     | AI headers         |
| `energy`          | `oklch(0.769 0.188 70.1)`  | ~Amber-400  | Calorie/energy     |
| `energy-emphasis` | `oklch(0.555 0.163 48.99)` | #B45309     | Energy headers     |
| `energy-subtle`   | `oklch(0.987 0.022 95.3)`  | #FFFBEB     | Energy backgrounds |
| `rose`            | `oklch(0.645 0.246 16.4)`  | ~Rose-500   | Favorites          |
| `rose-emphasis`   | `oklch(0.514 0.222 16.57)` | #BE123C     | Favorites hover    |
| `rose-subtle`     | `oklch(0.969 0.015 12.4)`  | #FFF1F2     | Favorites bg       |

#### Neutral & Surface Colors (Light Mode)

| Token              | OKLCH                       | Approx. HEX          | Usage                                  |
| ------------------ | --------------------------- | -------------------- | -------------------------------------- |
| `background`       | `oklch(0.985 0.015 163)`    | ~#F0FDF4             | Page background (emerald-tinted white) |
| `foreground`       | `oklch(0.208 0.026 264.69)` | #0F172A              | Primary text                           |
| `card`             | `oklch(1 0 0)`              | #FFFFFF              | Card surfaces                          |
| `card-foreground`  | `oklch(0.208 0.026 264.69)` | #0F172A              | Card text                              |
| `muted`            | `oklch(0.972 0.015 163)`    | ~Emerald-tinted gray | Disabled/muted bg                      |
| `muted-foreground` | `oklch(0.446 0.043 257.28)` | #475569              | Secondary text                         |
| `border`           | `oklch(0.945 0.025 163)`    | ~#E1F2ED             | Card/element borders                   |
| `border-subtle`    | `oklch(0.968 0.007 247.86)` | #F1F5F9              | Divider lines                          |
| `input`            | `oklch(0.945 0.025 163)`    | ~#E1F2ED             | Input borders                          |
| `ring`             | `oklch(0.696 0.17 162.48)`  | ~Emerald-500         | Focus ring color                       |

#### Dark Mode

The app supports full dark mode. All tokens have `.dark` equivalents.

| Token              | OKLCH (Dark)                      | Approx. HEX     | Note                   |
| ------------------ | --------------------------------- | --------------- | ---------------------- |
| `background`       | `oklch(0.208 0.026 264.69)`       | #0F172A         | Near-black (Slate-900) |
| `foreground`       | `oklch(0.929 0.013 255.51)`       | #E2E8F0         | Light text             |
| `card`             | `oklch(0.295 0.029 260.03)`       | ~Slate-800      | Elevated surface       |
| `primary`          | `oklch(0.765 0.177 163.22)`       | #34D399         | Brighter emerald       |
| `secondary`        | `oklch(0.527 0.154 163.45)`       | ~Emerald-700    | Muted green            |
| `destructive`      | `oklch(0.704 0.191 22.216)`       | ~Red-400        | Brighter red           |
| `muted`            | `oklch(0.295 0.029 260.03)`       | ~Slate-800      | Dark muted             |
| `muted-foreground` | `oklch(0.704 0.04 256.79)`        | #94A3B8         | Dim text               |
| `border`           | `oklch(1 0 0 / 10%)`              | White 10%       | Subtle borders         |
| `input`            | `oklch(1 0 0 / 15%)`              | White 15%       | Input borders          |
| `ring`             | `oklch(0.765 0.177 163.22)`       | ~Emerald-400    | Focus rings            |
| `protein`          | `oklch(0.746 0.16 232.66)`        | ~Sky-400        | Brighter protein       |
| `fat`              | `oklch(0.752 0.183 55.93)`        | ~Amber-400      | Brighter fat           |
| `carbs`            | `oklch(0.707 0.165 254.62)`       | ~Blue-400       | Brighter carbs         |
| `fiber`            | `oklch(0.845 0.143 164.9)`        | ~Green-400      | Brighter fiber         |
| `breakfast`        | `oklch(0.666 0.179 58.318)`       | ~Amber-600      | Dark breakfast         |
| `lunch`            | `oklch(0.588 0.158 241.966)`      | ~Sky-600        | Dark lunch             |
| `dinner`           | `oklch(0.511 0.262 276.966)`      | ~Indigo-600     | Dark dinner            |
| `ai`               | `oklch(0.673 0.182 274.5)`        | ~Indigo-400     | Brighter AI            |
| `energy`           | `oklch(0.828 0.189 84.4)`         | ~Amber-300      | Brighter energy        |
| `rose`             | `oklch(0.712 0.194 13.4)`         | ~Rose-400       | Brighter rose          |
| `shadow-glow`      | `oklch(0.765 0.177 163.22 / 0.3)` | Emerald-400 30% | Glow on dark           |

### 2.2 Typography

**Font family:** System fonts — `ui-sans-serif, system-ui, -apple-system, Roboto, sans-serif`

No custom fonts are loaded. The app relies entirely on the system font stack for performance.

#### Type Scale

| Token        | Size            | Line-height | Weight         | Letter-spacing | Usage                           |
| ------------ | --------------- | ----------- | -------------- | -------------- | ------------------------------- |
| `stat-big`   | 32px (2rem)     | 1.1         | 700 (Bold)     | -0.02em        | Main calorie number, hero KPI   |
| `stat-med`   | 24px (1.5rem)   | 1.2         | 700 (Bold)     | -0.01em        | Secondary stats (TDEE, protein) |
| `page`       | 24px (1.5rem)   | 1.3         | 700 (Bold)     | -0.01em        | Page/screen titles              |
| `section`    | 18px (1.125rem) | 1.4         | 600 (Semibold) | —              | Section headers                 |
| `card-title` | 16px (1rem)     | 1.5         | 600 (Semibold) | —              | Card headers, item titles       |
| `body`       | 14px (0.875rem) | 1.5         | 400 (Regular)  | —              | Body text (default)             |
| `caption`    | 12px (0.75rem)  | 1.4         | 400 (Regular)  | —              | Labels, hints, timestamps       |

#### Special Typography Rules

- **`stat-big` and `stat-med`** automatically use `font-variant-numeric: tabular-nums` so numbers align in columns.
- All numeric data (tables, progress bars, timers) use tabular figures.
- Vietnamese diacritics render correctly with the system font stack.

### 2.3 Spacing System (8dp Grid)

All spacing follows an **8dp rhythm** with named tokens.

| Token          | Value   | Pixels | Usage                                   |
| -------------- | ------- | ------ | --------------------------------------- |
| `inline-tight` | 0.25rem | 4px    | Icon-to-text gap, tight pairs           |
| `inline-gap`   | 0.5rem  | 8px    | Badge-to-badge, small element gaps      |
| `card-padding` | 0.75rem | 12px   | Padding inside cards                    |
| `card-gap`     | 1rem    | 16px   | Gap between cards in same section       |
| `section-gap`  | 1.5rem  | 24px   | Gap between sections (vertical rhythm)  |
| `breathing`    | 2rem    | 32px   | Major section dividers, page top/bottom |

**Safe area insets (Capacitor):**

- `--sat`: Status bar top inset (env safe-area-inset-top, ~24dp)
- `--sab`: Safe area bottom (env safe-area-inset-bottom, ~48dp)
- Applied via `.pt-safe` and `.pb-safe` utility classes

### 2.4 Border Radius

Base radius: **10px** (`0.625rem`). All tokens computed from base.

| Token | Computation | Value    | Pixels | Usage                                |
| ----- | ----------- | -------- | ------ | ------------------------------------ |
| `sm`  | base x 0.6  | 0.375rem | 6px    | Small chips, badges                  |
| `md`  | base x 0.8  | 0.5rem   | 8px    | Buttons, inputs                      |
| `lg`  | base x 1.0  | 0.625rem | 10px   | Cards (default)                      |
| `xl`  | base x 1.4  | 0.875rem | 14px   | Modals, large cards                  |
| `2xl` | base x 1.8  | 1.125rem | 18px   | Bottom sheets                        |
| `3xl` | base x 2.2  | 1.375rem | 22px   | Hero cards                           |
| `4xl` | base x 2.6  | 1.625rem | 26px   | Full badges (rounded-full for pills) |

### 2.5 Shadows

| Token  | Definition                     | Usage                        |
| ------ | ------------------------------ | ---------------------------- |
| `none` | `none`                         | Flat elements                |
| `sm`   | `0 1px 2px rgba(0,0,0,0.05)`   | Subtle hover lift            |
| `md`   | `0 2px 8px rgba(0,0,0,0.08)`   | Default card elevation       |
| `lg`   | `0 4px 20px rgba(0,0,0,0.12)`  | Modal/sheet elevation        |
| `glow` | `0 2px 6px oklch(emerald/0.3)` | Emerald-tinted glow for CTAs |

### 2.6 Icons

- **Library:** Lucide React (open-source, consistent stroke) — browse at [lucide.dev](https://lucide.dev)
- **Size:** 20-24px for UI icons, 16px for inline icons
- **Stroke width:** Consistent 2px
- **Color:** Inherits from parent text color (currentColor)
- **Touch target:** Always wrapped in 44x44dp minimum hit area

### 2.7 Animations

| Animation      | Behavior                        | Duration                   | Usage                   |
| -------------- | ------------------------------- | -------------------------- | ----------------------- |
| `pulse-subtle` | Box-shadow pulse (emerald glow) | 2s ease-in-out, 3x         | Today's date highlight  |
| `loading-bar`  | Translate left-to-right loop    | 1.5s ease-in-out, infinite | AI processing indicator |
| Stagger        | Sequential child entrance       | 50-200ms delay per item    | List items, card grids  |

**Easing curves:**

- `ease-enter`: `cubic-bezier(0, 0, 0.2, 1)` — Quick entrance
- `ease-exit`: `cubic-bezier(0.4, 0, 1, 1)` — Smooth exit
- `ease-spring`: `cubic-bezier(0.34, 1.56, 0.64, 1)` — Bouncy spring

**Accessibility:** All animations respect `prefers-reduced-motion: reduce` (reduced to no animation).

---

## Chapter 3: UI Components Reference

This chapter catalogs every reusable component. Use these as building blocks for all screens.

### 3.1 Button

**Variants (7):**

| Variant       | Background            | Text                | Border | Usage                                         |
| ------------- | --------------------- | ------------------- | ------ | --------------------------------------------- |
| `default`     | Primary (Emerald-600) | White               | —      | Main CTAs: "Luu" (Save), "Xac nhan" (Confirm) |
| `destructive` | Red-500               | White               | —      | Delete, remove actions                        |
| `outline`     | Transparent           | Foreground          | Border | Secondary actions                             |
| `secondary`   | Muted bg              | Foreground          | —      | Tertiary actions                              |
| `ghost`       | Transparent           | Foreground          | —      | Icon-only, toolbar                            |
| `link`        | Transparent           | Primary + underline | —      | Inline text links                             |
| `warning`     | Energy (Orange)       | White               | —      | Warning CTAs                                  |

**Sizes (8):**

| Size      | Height     | Padding | Font | Usage                 |
| --------- | ---------- | ------- | ---- | --------------------- |
| `xs`      | 24px (h-6) | Compact | 12px | Inline actions, chips |
| `sm`      | 28px (h-7) | px-2    | 13px | Secondary buttons     |
| `default` | 32px (h-8) | px-2.5  | 14px | Standard buttons      |
| `lg`      | 36px (h-9) | px-3    | 14px | Prominent CTAs        |
| `icon-xs` | 24x24      | —       | —    | Tiny icon buttons     |
| `icon-sm` | 28x28      | —       | —    | Small icon buttons    |
| `icon`    | 32x32      | —       | —    | Standard icon buttons |
| `icon-lg` | 36x36      | —       | —    | Large icon buttons    |

**States:** Default, Hover (slight darken), Active (pressed), Disabled (50% opacity, no pointer events), Focus (emerald ring 2px offset)

### 3.2 Card

**Variants (3):**

| Variant    | Background   | Border        | Shadow    | Usage                    |
| ---------- | ------------ | ------------- | --------- | ------------------------ |
| `default`  | Card (white) | ring-1 border | —         | Standard cards           |
| `ghost`    | Muted/40%    | —             | —         | Subtle container         |
| `elevated` | Card (white) | —             | shadow-md | Floating/prominent cards |

**Sizes:** `default` (gap-4, p-4), `sm` (gap-3, p-3)

**Sub-components:**

```
+-------------------------------------+
| CardHeader                          |
| +- CardTitle ---------- CardAction -+|
| |  "Title text"           [gear]   ||
| +- CardDescription ----------------+|
|    "Subtitle text"                  |
+-------------------------------------+
| CardContent                         |
| (Main content area with padding)    |
+-------------------------------------+
| CardFooter                          |
| (border-top, muted bg, actions)     |
+-------------------------------------+
```

### 3.3 Input & Form Controls

#### Input

- Height: 40px (h-10), border-radius: lg (10px)
- Padding: px-2.5, py-1.5
- Border: input color, focus ring: emerald
- Error state: `aria-invalid` red border
- Placeholder: muted-foreground color

#### Select

- **Trigger sizes:** `default` (h-8), `sm` (h-7)
- Dropdown popup with scroll buttons for long lists
- Sub-components: SelectTrigger, SelectContent, SelectItem, SelectValue, SelectGroup, SelectLabel

#### RadioGroup

- Circular radio buttons (16x16 dp)
- Grid layout with gap-2
- Checked state: primary color fill

#### Switch

- **Sizes:** `default` (18.4x32 dp), `sm` (14x24 dp)
- Track + thumb animation on toggle
- Checked: primary bg, Unchecked: muted bg

#### Toggle

- **Variants:** `default`, `outline`
- **Sizes:** `default` (h-8), `sm` (h-7), `lg` (h-9)
- Pressed state: muted bg + foreground text

#### ToggleGroup

- Horizontal or vertical orientation
- Wraps multiple Toggle items with shared context

### 3.4 Badge

**Variants (12):**

| Variant       | Background      | Text           | Usage          |
| ------------- | --------------- | -------------- | -------------- |
| `default`     | Primary         | White          | Standard label |
| `secondary`   | Secondary bg    | Secondary text | Subtle label   |
| `destructive` | Destructive     | White          | Error/danger   |
| `outline`     | Transparent     | Foreground     | Bordered label |
| `ghost`       | Transparent     | Foreground     | Minimal label  |
| `success`     | Primary (green) | White          | Success state  |
| `warning`     | Energy (amber)  | White          | Warning state  |
| `ai`          | AI (indigo)     | White          | AI features    |
| `protein`     | Protein (sky)   | White          | Protein macro  |
| `fat`         | Fat (amber)     | White          | Fat macro      |
| `carbs`       | Carbs (blue)    | White          | Carbs macro    |
| `fiber`       | Fiber (green)   | White          | Fiber macro    |

**Visual:** Height 20px, `rounded-full`, padding px-2, text 12px (xs), font-medium.

### 3.5 Dialog & AlertDialog

#### Dialog

- Centered overlay with backdrop blur
- Max-width: `md` (28rem / 448px)
- Close: X button (top-right) or Cancel button
- Sub-components: DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter

#### AlertDialog

- **Sizes:** `default`, `sm` (narrower)
- Includes AlertDialogMedia slot (icon area, 40x40 dp)
- Footer: 2-column layout for Confirm + Cancel
- Cancel button uses `outline` variant

```
+-----------------------------------+
|      [icon]                       |
|                                   |
|   "Xoa mon an?" (Delete dish?)    |
|   "Hanh dong khong the hoan tac"  |
|                                   |
|   [ Huy (Cancel) ] [ Xoa (Del) ] |
+-----------------------------------+
```

### 3.6 Sheet (Bottom Sheet)

- Slides up from bottom of screen
- Drag handle at top (4x40 dp, muted color)
- Backdrop with blur overlay
- Close: drag down > 100px, backdrop click, or X button
- Scrollable content area
- Mobile: 75% width, Tablet+: max-w-sm

### 3.7 ModalBackdrop (Shared Modal Container)

The shared modal wrapper provides consistent behavior:

| Feature            | Behavior                                                        |
| ------------------ | --------------------------------------------------------------- |
| **Scroll lock**    | Body scroll disabled while open (reference-counted for nesting) |
| **Focus trap**     | Auto-focuses first interactive element; restores on close       |
| **Escape key**     | Only topmost modal responds (escape stacking)                   |
| **Touch drag**     | Swipe down > 100px to close on mobile                           |
| **Backdrop click** | Click outside to close                                          |
| **Accessibility**  | `aria-modal="true"`, grab handle with testid                    |
| **Z-index**        | Configurable: z-50 (default), z-60, z-70                        |

### 3.8 Navigation Components

#### BottomNavBar

Fixed at screen bottom. 5 equally-spaced tabs. Hidden when full-screen page is open.

```
+---------------------------------------+
|  cal      lib      AI      fit    dash |
|  Lich   Thu vien   AI   Tap     Tong  |
|                         luyen   quan  |
+---------------------------------------+
  ^ active tab: primary color + filled icon
  ^ inactive: muted-foreground + outline icon
```

- Height: ~56dp (including labels)
- Z-index: z-30
- Icons: 24x24dp
- Labels: caption (12px)
- Active indicator: primary color text + icon
- Red dot badge: AI tab (when notifications)

#### SubTabBar

Horizontal inline tab switcher within a tab panel.

```
+----------------------------------+
|  [ Meals (check) ]  [ Nutrition ]|
|   active bg           muted text |
+----------------------------------+
```

- Active: white background pill, primary text
- Inactive: transparent, muted-foreground
- Icons optional (left of label)

### 3.9 Form Components

#### ChipSelect (Multi-select)

- Horizontal row of pill buttons
- Active: primary bg + white text
- Inactive: outline with muted text
- Max/min item constraints
- Use case: equipment selection, muscle groups, meal types

#### RadioPills (Single-select)

- Same visual as ChipSelect but mutually exclusive
- Only 1 active at a time
- Use case: activity level, goal type, experience level

#### StringNumberController

- Numeric input with **[-]** and **[+]** buttons flanking
- Supports integer and decimal modes
- Min/max clamping
- Use case: weight, height, reps, sets, servings

```
+- [-] --- [ 75.0 ] --- [+] -+
|   <-        kg input     -> |
+-----------------------------+
```

#### UnitSelector

- Dropdown with common units (g, kg, ml, L, piece, tbsp, cup, etc.)
- "Khac..." (Other) option reveals free-text input
- Modes: `single` (string), `bilingual` (Vietnamese + English)

### 3.10 Data Display Components

#### MacroDonutChart

SVG donut chart showing macro distribution.

```
        .----------.
      /   Protein    \
    /    (Sky-600)     \
   |   +----------+    |
   |   |  1327    |    |   <- Center: total kcal
   |   |  kcal    |    |
   |   +----------+    |
    \   Fat (Amber)   /
      \  Carbs (Blue)/
        '----------'
```

- Default size: 120x120 dp
- 3 segments: Protein (sky), Fat (amber), Carbs (blue)
- Center text: Total calories (stat-big)

#### EnergyBalanceCard

Shows daily calorie budget breakdown.

```
+-------------------------------------+
| Energy Balance                      |
|                                     |
| Net: +764 kcal remaining            |
| ||||||||.....  1327 / 2091 kcal     |
|                                     |
| Protein: 170g / 157g               |
| ||||||||||  108%                    |
|                                     |
| BMR: 1704   TDEE: 2641             |
| Target: 2091 (Cut -550)            |
+-------------------------------------+
```

- Collapsible mode available
- Progress bars: primary fill on muted track (h-1, rounded-full)
- Color shifts: green (under budget) to amber (near) to red (over)

#### MiniNutritionBar

Compact nutrition summary shown at top of Calendar Meals view.

```
+----------------------------------------+
| ||||||||...  1327/2091 kcal  .  170g P |
+----------------------------------------+
```

- Clickable button (opens detail)
- Shows: calories progress, protein progress
- Optional macro pills (P/F/C totals)
- Smart nudge text: "Can them 20g protein" (Need 20g more protein)

#### Progress

- Horizontal bar with track + indicator
- Track: h-1, muted bg, rounded-full
- Indicator: primary color fill
- Optional: label (left) + value text (right)

#### Skeleton

- Animated pulse placeholder (muted bg)
- Rounded-md, customizable width/height
- Used for loading states throughout the app

### 3.11 Shared Components

#### EmptyState

| Variant    | Padding     | Border        | Usage                  |
| ---------- | ----------- | ------------- | ---------------------- |
| `compact`  | px-4, py-6  | —             | Inline empty sections  |
| `standard` | px-6, py-12 | —             | Default empty views    |
| `hero`     | px-8, py-16 | Dashed border | Full-page empty states |

Structure: Icon (Lucide, muted) - Title - Description - Optional action button

#### FilterBottomSheet

- Sort options: Name (up/down), Calories (up/down), Protein (up/down)
- Quick filters: less than 300 cal, less than 500 cal, more than 20g protein
- Reset + Apply buttons
- Z-index: z-60

#### ListToolbar

```
+--------------------------------------+
| [Search...          ] [Sort v] [+Add]|
|                       [Grid|List]    |
+--------------------------------------+
```

- Search input (max 100 chars)
- Sort dropdown
- Layout toggle (grid/list view)
- Add button (+ icon)

#### CloseButton

- **Variants:** `default` (subtle), `overlay` (high contrast)
- X icon: 20x20 dp
- Touch target: 44x44 dp minimum
- Focus ring support

#### UnsavedChangesDialog

```
+------------------------------------+
|  (!)  Thay doi chua luu            |
|       (Unsaved changes)            |
|                                    |
|  Ban co thay doi chua luu.         |
|  Ban muon lam gi?                  |
|                                    |
|  [ Luu & quay lai (Save & back) ]  |
|  [ Bo thay doi (Discard)        ]  |
|  [ O lai chinh sua (Stay)       ]  |
+------------------------------------+
```

- Warning icon (yellow background circle)
- 3 action buttons: Save (primary), Discard (destructive), Stay (muted)
- Z-index: z-70 (stacks above other modals)

#### DisabledReason

- Small text (caption, 12px) explaining why a button is disabled
- Linked via `aria-describedby`
- Appears below the disabled element

#### AiBadge

- "AI" text with Sparkles icon
- AI-colored background + border
- 12px font, font-medium, rounded-full
- Indicates AI-powered features

---

## Chapter 4: Navigation Architecture

### 4.1 Tab + Page Stack Model

The app uses a **stack-based navigation** pattern with 3 layers:

```
+-----------------------------------------------------+
|                  Status Bar (24dp)                   |
+-----------------------------------------------------+
|                                                     |
|                                                     |
|              Active Tab Content                     |
|                                                     |
|         (Calendar / Library / AI /                  |
|          Fitness / Dashboard)                       |
|                                                     |
|         +- Sub-tabs rendered inline -+              |
|         |  [Meals] [Nutrition]        |              |
|         +----------------------------+              |
|                                                     |
|                                                     |
+-----------------------------------------------------+
|   cal        lib        AI        fit        dash   |
|   Lich    Thu vien      AI     Tap luyen  Tong quan |
|              Bottom Navigation Bar                  |
|              (fixed, z-30, ~56dp)                   |
+-----------------------------------------------------+
```

#### 5 Main Tabs

| #   | Tab Key       | Icon (Lucide)   | Label (VN) | Label (EN)  | Default Sub-tab |
| --- | ------------- | --------------- | ---------- | ----------- | --------------- |
| 1   | `calendar`    | CalendarDays    | Lich       | Calendar    | `meals`         |
| 2   | `library`     | ClipboardList   | Thu vien   | Library     | `dishes`        |
| 3   | `ai-analysis` | Bot             | AI         | AI Analysis | (single view)   |
| 4   | `fitness`     | Dumbbell        | Tap luyen  | Fitness     | `plan`          |
| 5   | `dashboard`   | LayoutDashboard | Tong quan  | Dashboard   | (single view)   |

#### Sub-tabs per Main Tab

| Main Tab    | Sub-tabs                      | Switcher        |
| ----------- | ----------------------------- | --------------- |
| Calendar    | `meals`, `nutrition`          | SubTabBar (top) |
| Library     | `dishes`, `ingredients`       | SubTabBar (top) |
| AI Analysis | —                             | No sub-tabs     |
| Fitness     | `plan`, `progress`, `history` | SubTabBar (top) |
| Dashboard   | —                             | No sub-tabs     |

### 4.2 Full-Screen Pages (Page Stack)

Full-screen pages are **pushed onto a stack** (max depth: 2). When a page is open:

- Bottom navigation bar is **hidden**
- Page renders as full-screen overlay at **z-50**
- Back/X button closes the page and returns to the tab

```
       NORMAL STATE                 PAGE PUSHED
  +-------------------+        +-------------------+
  |   Tab Content     |        |  Full-Screen      |
  |                   | push   |  Page Content     |
  |                   | -----> |  (z-50)           |
  |                   |        |                   |
  +-------------------+        |  [<- Back]        |
  |  Bottom Nav       |        |                   |
  +-------------------+        +-------------------+
                                    ^ no bottom nav
```

#### Page Registry

| Page                | Component             | Purpose                                    | Opened From                |
| ------------------- | --------------------- | ------------------------------------------ | -------------------------- |
| Settings            | `SettingsTab`         | Health, goal, training, appearance, backup | Gear icon (any tab header) |
| WorkoutLogger       | `WorkoutLogger`       | Log strength training session              | Fitness Plan, Dashboard    |
| CardioLogger        | `CardioLogger`        | Log cardio/aerobic session                 | Fitness Plan, Dashboard    |
| PlanDayEditor       | `PlanDayEditor`       | Edit exercises for a training day          | Fitness Plan (tap day)     |
| PlanScheduleEditor  | `PlanScheduleEditor`  | Configure weekly training schedule         | Fitness Plan               |
| SplitChanger        | `SplitChanger`        | Change training split type                 | Fitness Plan               |
| PlanTemplateGallery | `PlanTemplateGallery` | Browse workout plan templates              | Fitness Plan               |
| GoalDetailPage      | `GoalDetailPage`      | Edit nutrition/body composition goal       | Settings, Calendar         |

### 4.3 Modal System

**Rule:** Only 1 modal open at a time (exclusive). Exception: UnsavedChangesDialog can stack on top (z-70).

| Behavior | Detail                                                   |
| -------- | -------------------------------------------------------- |
| Opening  | Centered on screen, backdrop blur/dim                    |
| Closing  | Backdrop click, Escape key, X button, or Cancel          |
| Focus    | Trapped inside modal (Tab cycles through modal elements) |
| Scroll   | Body scroll locked while modal is open                   |
| Nesting  | Reference-counted scroll lock handles nested correctly   |

#### Modal Inventory

| Modal                       | Z-index | Opened From              | Purpose                           |
| --------------------------- | ------- | ------------------------ | --------------------------------- |
| MealPlannerModal            | z-50    | Calendar Meals [+]       | Select dishes for meal slot       |
| ClearPlanModal              | z-50    | Calendar action bar      | Clear meals for day/week          |
| CopyPlanModal               | z-50    | Calendar action bar      | Copy meal plan from another date  |
| SaveTemplateModal           | z-50    | Calendar action bar      | Save current plan as template     |
| TemplateManager             | z-50    | Calendar action bar      | Manage saved meal templates       |
| DishEditModal               | z-60    | Library Dishes           | Create/edit dish + ingredients    |
| IngredientEditModal         | z-60    | Library Ingredients      | Create/edit ingredient            |
| ConfirmationModal           | z-70    | Various (delete/warning) | Generic confirm dialog            |
| AISuggestionPreviewModal    | z-50    | AI tab, Calendar         | Preview AI meal suggestions       |
| AISuggestIngredientsPreview | z-70    | DishEditModal            | Preview AI ingredient suggestions |
| SaveAnalyzedDishModal       | z-50    | AI Analysis              | Save dish from image analysis     |
| SyncConflictModal           | z-50    | Settings Backup          | Resolve cloud sync conflicts      |
| UnsavedChangesDialog        | z-70    | PlanDayEditor, forms     | Confirm exit with unsaved changes |
| GroceryList                 | z-50    | Calendar action bar      | View aggregated grocery list      |

### 4.4 Bottom Sheets

Bottom sheets slide up from the screen bottom. They are dismissible by swipe-down or backdrop click.

| Sheet              | Z-index | Purpose                            |
| ------------------ | ------- | ---------------------------------- |
| FilterBottomSheet  | z-60    | Sort & filter for Library lists    |
| ExerciseSelector   | z-60    | Browse & select exercises          |
| WeightQuickLog     | z-60    | Quick bodyweight entry             |
| SwapExerciseSheet  | z-70    | Replace exercise with alternative  |
| DayAssignmentSheet | z-50    | Assign workout to weekday          |
| SetEditor          | z-50    | Edit weight/reps/RPE for a set     |
| EnergyDetailSheet  | z-50    | Detailed BMR/TDEE/Target breakdown |

### 4.5 Z-Index Layers

```
z-70  --- ConfirmationModal, UnsavedChangesDialog, SwapExercise
z-60  --- DishEditModal, IngredientEditModal, FilterSheet, ExerciseSelector
z-50  --- Full-screen pages (PageStack), Default modals, Default sheets
z-40  --- Settings detail actions (fixed bar), FAB buttons
z-30  --- BottomNavBar (fixed)
z-0   --- Tab content (base)
```

### 4.6 Cross-Tab Navigation

Some actions navigate between tabs or open full-screen pages from a different tab context.

```
Dashboard ---- "Them bua an" (Add meal) ----------> Calendar tab
    |
    +---- "Bat dau tap" (Start workout) ----------> WorkoutLogger (full-screen)
    |
    +---- "Ghi cardio" (Log cardio) --------------> CardioLogger (full-screen)
    |
    +---- "Tao ke hoach" (Create plan) -----------> Fitness tab

AI Analysis -- "Luu mon" (Save dish) -------------> Library tab (dishes)
    |
    +---- "Luu nguyen lieu" (Save ingredients) ---> Library tab (ingredients)

Calendar ----- "Sua muc tieu" (Edit goal) --------> GoalDetailPage (full-screen)

Any tab ------ Gear icon --------------------------> Settings (full-screen)
```

---

## Chapter 5: Onboarding Flow

The onboarding is a multi-section wizard that collects user profile, goals, and generates a personalized plan.

### Flow Diagram

```
+---------+    +----------+    +----------+    +------+    +---------+
| Welcome |===>|  Health   |===>| Activity |===>| Goal |===>| Confirm |
| 3 slides|    | Profile   |    |  Level   |    |      |    | Summary |
+---------+    +----------+    +----------+    +------+    +----+----+
                                                                |
    +----------+    +----------+    +----------+               |
    |   Main   |<===| Preview  |<===|Computing |<===+----------+
    |   App    |    |  Plan    |    |  ~13s    |    | Training
    +----------+    +----------+    +----------+    | 8 steps
                                                    +----------+
```

### Section 1: Welcome (3 Slides)

```
+---------------------------------+
|                     [Bo qua ->] |  <- Skip button (top-right)
|                                 |
|         +----------+            |
|         |  icon    |            |  <- Large circular icon
|         +----------+            |     (bg-primary/10, text-primary)
|                                 |
|   "Ke hoach dinh duong thong    |  <- Title (text-2xl, font-semibold)
|    minh"                        |
|                                 |
|   "Tao thuc don can bang cho    |  <- Description (text-base)
|    moi ngay"                    |
|                                 |
|         o . .                   |  <- Dot indicators (3 slides)
|                                 |
|        [Tiep tuc ->]            |  <- Continue/Start button
+---------------------------------+
```

- 3 slides: Nutrition, Analytics, Fitness
- Last slide: "Bat dau" (Start) button instead of "Tiep tuc" (Continue)
- Dot indicators animate width on active slide

### Section 2: Health Profile

Form with sequential fields:

| Field              | Input Type                                   | Constraints                     | ID          |
| ------------------ | -------------------------------------------- | ------------------------------- | ----------- |
| Gioi tinh (Gender) | 2 pill buttons: "Nam" (Male) / "Nu" (Female) | Required                        | —           |
| Ten (Name)         | Text input                                   | Max 50 chars, character counter | `ob-name`   |
| Ngay sinh (DOB)    | Date picker                                  | Required                        | `ob-dob`    |
| Chieu cao (Height) | Number input + "cm" suffix                   | Required, hints for invalid     | `ob-height` |
| Can nang (Weight)  | Number input + "kg" suffix                   | Required                        | `ob-weight` |

- Back/Next navigation (sticky bottom bar)
- Validation: inline error messages below fields
- Next button: `data-testid="health-basic-next"`

### Section 3: Activity Level

5 selectable cards (RadioPills pattern):

| Level        | Vietnamese         | Description                       |
| ------------ | ------------------ | --------------------------------- |
| Sedentary    | It van dong        | Desk job, minimal movement        |
| Light        | Hoat dong nhe      | Light walks 1-3x/week             |
| Moderate     | Hoat dong vua phai | Exercise 3-5x/week                |
| Active       | Hoat dong tich cuc | Hard exercise 6-7x/week           |
| Extra Active | Hoat dong rat cao  | Very hard exercise + physical job |

### Section 4: Goal

**Goal type** — 3 cards (single-select):

- Giam can (Cut) — lose weight
- Duy tri (Maintain) — maintain weight
- Tang can (Bulk) — gain weight

**Rate** (appears for Cut/Bulk only) — 3 options:

- Nhe nhang (Conservative): +/-275 kcal
- Vua phai (Moderate): +/-550 kcal
- Nhanh (Aggressive): +/-1100 kcal

### Section 5: Confirm Summary

```
+---------------------------------+
| Xac nhan thong tin (Confirm)    |
|                                 |
| BMR:    1,704 kcal              |
| TDEE:   2,641 kcal              |
| Target: 2,091 kcal              |
|                                 |
| Protein: 157g                   |
| Fat:     58g                    |
| Carbs:   241g                   |
|                                 |
|      [<- Quay lai] [Xac nhan ->]|
+---------------------------------+
```

### Section 6: Training Setup (8 Sub-steps)

| Step          | Content                                                         | Input Type           |
| ------------- | --------------------------------------------------------------- | -------------------- |
| 1. Goal       | Training goal: Strength / Hypertrophy / Endurance / Athleticism | RadioPills           |
| 2. Experience | Beginner / Intermediate / Advanced                              | RadioPills           |
| 3. Days/week  | Number of training days (3-7)                                   | Slider or RadioPills |
| 4. Duration   | Session length in minutes                                       | Number input         |
| 5. Equipment  | Barbells, Dumbbells, Cables, Machines, Bodyweight               | ChipSelect (multi)   |
| 6. Injuries   | Body areas to avoid                                             | ChipSelect (multi)   |
| 7. Cardio     | Preferred cardio type                                           | RadioPills           |
| 8. Sleep      | Average sleep hours                                             | Number input         |

Each step has Back/Next or "Bo qua" (Skip) button.

### Section 7: Computing Animation

```
+---------------------------------+
|                                 |
|     Dang tao ke hoach...        |
|     (Creating your plan...)     |
|                                 |
|  Step 1: Analyzing profile   v  |
|  Step 2: Selecting exercises v  |
|  Step 3: Optimizing split    v  |
|  Step 4: Generating plan     ~  |
|                                 |
|  |||||||||||||...  75%          |
|                                 |
+---------------------------------+
```

- 4-step animated progress (~13 seconds total)
- Each step shows checkmark when complete
- Loading bar animation

### Section 8: Plan Preview

```
+---------------------------------+
| Ke hoach tap luyen (Plan)       |
|                                 |
| Mon: Push Day - Chest, Shoulder |
| Tue: Pull Day - Back, Biceps    |
| Wed: Rest                       |
| Thu: Legs - Quads, Glutes       |
| Fri: Push Day - Chest, Triceps  |
| Sat: Pull Day - Back, Biceps    |
| Sun: Rest                       |
|                                 |
|  [Bat dau tap luyen ->]         |
|  (Start training)               |
+---------------------------------+
```

- testid: `onboarding-complete`
- After tapping enters main app (Calendar tab)
- Bottom nav becomes visible

---

## Chapter 6: Calendar Tab

The Calendar is the app's primary tab — where users plan daily meals and track nutrition.

### Layout Structure

```
+---------------------------------------+
| <- April 2026 ->        [Settings]    |  <- Month selector + gear icon
+---------------------------------------+
| Mon  Tue  Wed  Thu  Fri  Sat  Sun     |  <- Week day headers
|  7    8    9   10*  11   12   13      |  <- Date cells (* = today)
|       .    .   ...              .     |  <- Meal dots (up to 3)
+---------------------------------------+
|  [Bua an (Meals)]  [Dinh duong        |  <- Sub-tab switcher
|                     (Nutrition)]      |
+---------------------------------------+
|                                       |
|         (Sub-tab content)             |
|                                       |
+---------------------------------------+
```

### Meals Sub-tab

```
+---------------------------------------+
| Mini Nutrition Bar (clickable)        |
| ||||||||.....  1327/2091 kcal         |
| Protein: 170g/157g . Con: 764 kcal   |
+---------------------------------------+
|                                       |
| (sun) BUA SANG (BREAKFAST)       [+]  |
| +-----------------------------------+ |
| | Trung op la          155 kcal     | |
| |    Protein: 13g       [x1] [del] | |
| +-----------------------------------+ |
| | Yen mach sua chua     332 kcal    | |
| |    Protein: 25g       [x1] [del] | |
| +-----------------------------------+ |
|   Subtotal: 487 kcal, 38g protein    |
|                                       |
| (cloud) BUA TRUA (LUNCH)        [+]  |
| +-----------------------------------+ |
| | Uc ga ap chao         330 kcal    | |
| |    Protein: 62g       [x1] [del] | |
| +-----------------------------------+ |
| | Bong cai luoc          51 kcal    | |
| |    Protein: 5g        [x1] [del] | |
| +-----------------------------------+ |
| | Khoai lang luoc       129 kcal    | |
| |    Protein: 3g        [x1] [del] | |
| +-----------------------------------+ |
|   Subtotal: 510 kcal, 70g protein    |
|                                       |
| (moon) BUA TOI (DINNER)         [+]  |
| +-----------------------------------+ |
| |  (Empty - "Chua co mon nao")      | |
| |  [+ Them mon (Add dish)]          | |
| +-----------------------------------+ |
|                                       |
+---------------------------------------+
| [Len KH]  [Sao chep]  [AI goi y]    |
|  (Plan)    (Copy)      (Suggest)     |
+---------------------------------------+
```

#### Meal Slot Color Coding

| Meal                 | Header Color | Icon    |
| -------------------- | ------------ | ------- |
| Bua Sang (Breakfast) | Amber-400    | Sunrise |
| Bua Trua (Lunch)     | Sky-500      | Sun     |
| Bua Toi (Dinner)     | Indigo-500   | Moon    |

#### Dish Card Layout (per item)

```
+----------------------------------+
| [Icon] Dish Name        XXX kcal |
|        Protein: XXg    [xN] [del]|
+----------------------------------+
```

- Dish name: card-title (16px, semibold)
- Nutrition: caption (12px)
- Servings: [xN] adjustable (StringNumberController)
- Delete: trash icon button

#### MealActionBar (sticky bottom of Meals sub-tab)

| Button    | Icon          | Vietnamese   | English       | Action                         |
| --------- | ------------- | ------------ | ------------- | ------------------------------ |
| Plan      | ClipboardList | Len ke hoach | Plan meals    | Opens MealPlannerModal         |
| Copy      | Copy          | Sao chep     | Copy plan     | Opens CopyPlanModal            |
| AI        | Bot           | Goi y AI     | AI suggest    | Opens AISuggestionPreviewModal |
| Template  | Save          | Luu mau      | Save template | Opens SaveTemplateModal        |
| Templates | FolderOpen    | Quan ly mau  | Templates     | Opens TemplateManager          |
| Grocery   | ShoppingCart  | Di cho       | Grocery list  | Opens GroceryList              |

### Nutrition Sub-tab

```
+---------------------------------------+
| CAN BANG NANG LUONG                   |
| (ENERGY BALANCE)                      |
|                                       |
| BMR:    1,704 kcal                    |
| TDEE:   2,641 kcal                    |
| Target: 2,091 kcal (Cut -550)        |
|                                       |
| ||||||||.....  1327 / 2091 kcal       |
| Con lai (Remaining): 764 kcal        |
+---------------------------------------+
|                                       |
|       .----------.                    |
|      /  Protein    \                  |
|    /   157g (30%)    \                |
|   |  +----------+    |               |
|   |  |  2091    |    |               |
|   |  |  kcal    |    |               |
|   |  +----------+    |               |
|    \  Fat 58g (25%) /                 |
|      \ Carbs 241g /                   |
|       '----------'                    |
|                                       |
+---------------------------------------+
| Protein  |||||||||.  170/157g         |
| Fat      ||||.....    35/58g          |
| Carbs    |||||....   180/241g         |
| Fiber    ||.......    12/25g          |
+---------------------------------------+
```

### Calendar Modals

#### MealPlannerModal

```
+---------------------------------------+
| Len ke hoach bua an (Plan meals)    X |
+---------------------------------------+
| [(sun)Sang] [(cloud)Trua v] [(moon)Toi]| <- Meal type tabs
+---------------------------------------+
| [Search tim mon an...]  [Loc (filter)]|
+---------------------------------------+
| [ ] Uc ga ap chao      330 kcal 62g P|
| [ ] Khoai lang luoc    129 kcal  3g P|
| [v] Bong cai luoc       51 kcal  5g P| <- Selected
| [ ] Ca hoi nuong        208 kcal 20g P|
| ...                                   |
+---------------------------------------+
| Da chon: 1 mon . 51 kcal             |
|              [Xac nhan (Confirm)]     |
+---------------------------------------+
```

#### CopyPlanModal

- Date picker to select source date
- Preview of meals being copied
- Confirm/Cancel buttons

#### SaveTemplateModal

- Template name input (with character counter)
- Tag input (add/remove tags)
- Preset tag quick-add buttons
- Preview: shows B/L/D sections with dish names
- Save button

#### TemplateManager

- Search bar + tag filter
- Template cards: name, meal count, tags, Apply/Delete actions

---

## Chapter 7: Library Tab

The Library manages the user's food database — dishes (recipes) and base ingredients.

### Layout

```
+---------------------------------------+
|  [Mon an (Dishes)]  [Nguyen lieu      |  <- Sub-tab switcher
|                      (Ingredients)]   |
+---------------------------------------+
|  [Search...      ] [Sort v] [+ Them] |  <- ListToolbar
|                     [Grid|List]       |
+---------------------------------------+
|                                       |
|  (Content: dish or ingredient cards)  |
|                                       |
+---------------------------------------+
```

### Dishes View

#### Dish Card (Grid mode)

```
+------------------------------+
| Uc ga ap chao                |  <- card-title (16px, semibold)
| (Pan-fried chicken breast)   |
|                              |
| 330 kcal . 62g P . 0g C     |  <- Nutrition summary (caption)
| **** (4/5)                   |  <- Rating stars
|                              |
| [Trua] [Toi]                |  <- Meal type badges (colored)
|                              |
| [View] [Edit] [del]         |  <- Action buttons
+------------------------------+
```

#### DishEditModal (2-Step Form)

**Step 1 — Basic Info:**

```
+-----------------------------------+
| Tao mon an (Create dish)        X |
+-----------------------------------+
| Ten mon (Name)                    |
| [_________________________]       |
|                                   |
| Danh gia (Rating)                 |
| **** (tap to rate)                |
|                                   |
| Loai bua (Meal types)             |
| [(sun) Sang] [(cloud) Trua]      |
| [(moon) Toi]                      | <- ChipSelect (multi)
|                                   |
| Ghi chu (Notes)                   |
| [_________________________]       |
|                                   |
|          [Tiep theo -> (Next)]    |
+-----------------------------------+
```

**Step 2 — Ingredients:**

```
+-----------------------------------+
| Nguyen lieu (Ingredients)       X |
+-----------------------------------+
| [Search tim nguyen lieu...]       |
|                                   |
| +-------------------------------+ |
| | Uc ga     200g  330 kcal      | |
| |           [-] [200] [+] [del] | |
| +-------------------------------+ |
| | Dau an     5ml   44 kcal      | |
| |           [-] [ 5 ] [+] [del] | |
| +-------------------------------+ |
|                                   |
| [+ Them nguyen lieu (Add)]        |
| [AI goi y (AI suggest)]          |
|                                   |
| -- Tong (Total) --                |
| 374 kcal . 62g P . 0g C . 11g F  |
|                                   |
|      [Luu (Save)]                 |
+-----------------------------------+
```

### Ingredients View

#### Ingredient Card

```
+------------------------------+
| Uc ga (Chicken breast)       |
| Category: Thit (Meat)        |
|                              |
| Per 100g:                    |
| 165 kcal . 31g P . 0g C     |
| 4g F . 0g Fiber              |
|                              |
| [Edit]  [Delete]             |
+------------------------------+
```

#### IngredientEditModal

```
+-----------------------------------+
| Chinh sua nguyen lieu           X |
+-----------------------------------+
| Ten (Name)                        |
| [_________________________]       |
|                                   |
| Don vi (Unit)                     |
| [g v]  (dropdown: g/kg/ml/L/etc) |
|                                   |
| -- Dinh duong per 100g --         |
| Calories:  [165]  kcal            |
| Protein:   [ 31]  g               |
| Carbs:     [  0]  g               |
| Fat:       [  4]  g               |
| Fiber:     [  0]  g               |
|                                   |
|      [Luu (Save)]                 |
+-----------------------------------+
```

### Compare Mode

Toggle compare mode, select 2+ dishes, side-by-side nutrition comparison table.

---

## Chapter 8: AI Analysis Tab

The AI tab uses Google Gemini to analyze food photos and provide nutrition estimates.

> **Requires internet connection.** Show offline warning when unavailable.

### Layout

```
+---------------------------------------+
|  AI Phan tich (AI Analysis)           |
+---------------------------------------+
|                                       |
|  +-----------------------------------+|
|  |                                   ||
|  |     Camera Preview                ||  <- 16:9 aspect ratio
|  |     (or selected image)           ||
|  |                                   ||
|  +-----------------------------------+|
|                                       |
|  [Chup anh (Capture)]  [Thu vien     |
|                          (Gallery)]   |
|                                       |
|  [Phan tich (Analyze)]               |  <- Disabled until image
|                                       |
|  Step: 1 Chup -> 2 Phan tich ->     |
|        3 Luu                          |
|                                       |
+------------- RESULTS -----------------+
|                                       |
|  Detected: Com ga xoi mo              |  <- Dish name (bold)
|                                       |
|  Ingredients:                         |
|  - Com trang 200g       231 kcal      |
|  - Ga chien  150g       375 kcal      |
|  - Hanh phi   10g        52 kcal      |
|                                       |
|  -- Total --                          |
|  658 kcal . 45g P . 52g C . 28g F    |
|                                       |
|  [Luu nguyen lieu (Save ingr.)]      |
|  [Tao mon an (Create dish)]          |
|                                       |
+---------------------------------------+
```

### Flow

```
AI Tab -> Capture/Select image -> Tap "Phan tich"
    -> Loading (loading-bar animation)
    -> Results: detected dish + ingredients + nutrition
    -> "Luu nguyen lieu" -> saves to Library/Ingredients
    -> "Tao mon an" -> opens SaveAnalyzedDishModal -> saves to Library/Dishes
```

### AI Suggestion Modal (from Calendar)

When triggered from Calendar's AI button, shows full daily meal suggestions:

```
+---------------------------------------+
| AI Goi y bua an (Meal suggestion)   X |
+---------------------------------------+
| Target: 2,091 kcal                    |
|                                       |
| (sun) Bua Sang: 520 kcal             |
|   - Yen mach sua chua (332 kcal)     |
|   - Trung op la (155 kcal)           |
|                                       |
| (cloud) Bua Trua: 580 kcal           |
|   - Ca hoi nuong (208 kcal)          |
|   - Gao lut (222 kcal)               |
|   - Bong cai luoc (51 kcal)          |
|                                       |
| (moon) Bua Toi: 480 kcal             |
|   - Uc ga ap chao (330 kcal)         |
|   - Khoai lang (129 kcal)            |
|                                       |
| Total: 1,580 kcal . 152g P           |
|                                       |
|       [Ap dung (Apply)]              |
+---------------------------------------+
```

---

## Chapter 9: Fitness Tab

The Fitness tab manages training plans, workout logging, and progress tracking.

### Sub-tabs

```
+-------------------------------------------------+
| [Ke hoach (Plan)] [Tien trinh (Progress)] [Lich |
|                                            su   |
|                                        (History)]|
+-------------------------------------------------+
```

### Plan Sub-tab

#### Active Plan Card

```
+---------------------------------------+
| Push/Pull/Legs (Active)               |
| Tuan 3/8 (Week 3 of 8)               |
| 5 ngay/tuan (5 days/week)             |
| -- Lich tuan (Weekly schedule) --     |
|                                       |
| +---+---+---+---+---+---+---+        |
| |Mon|Tue|Wed|Thu|Fri|Sat|Sun|        |
| |PSH|PUL|LEG|PSH|PUL|LEG|RST|        |
| | 6 | 5 | 5 | 6 | 5 | 5 | - |        |
| +---+---+---+---+---+---+---+        |
|  ^ exercises per day                  |
|                                       |
| [Chinh sua lich (Edit schedule)]      |
| [Doi split (Change split)]           |
| [Mau ke hoach (Templates)]           |
+---------------------------------------+
```

#### Weekly Schedule Grid (Detail)

Each day card:

```
+---------------------+
| Thu 2 (Monday)      |
| Push Day             |
| Chest . Shoulder     |
| 6 exercises . ~60min |
| [Tap to edit ->]     |
+---------------------+
```

- Color-coded by workout type
- Rest days: muted card with "Nghi" (Rest) label
- Tap opens PlanDayEditor (full-screen)

#### No Plan State (EmptyState hero variant)

```
+-------------------------------------+
|        (dumbbell icon)              |
|  Chua co ke hoach tap luyen        |
|  (No training plan yet)             |
|                                     |
|  [Tao tu dong (Auto generate)]     |
|  [Tao thu cong (Create manual)]    |
+-------------------------------------+
```

### PlanDayEditor (Full-Screen Page)

```
+---------------------------------------+
| [<- Back]   Thu 3 - Push Day   [Save] |
+---------------------------------------+
|                                       |
| 1. Bench Press (Barbell)              |
|    Chest . Compound                   |
|    4 sets x 8-12 reps                 |
|    [Swap] [Remove]                    |
|                                       |
| 2. Overhead Press (Barbell)           |
|    Shoulders . Compound               |
|    3 sets x 8-10 reps                 |
|    [Swap] [Remove]                    |
|                                       |
| 3. Incline Dumbbell Press             |
|    Upper Chest . Compound             |
|    3 sets x 10-12 reps               |
|    [Swap] [Remove]                    |
|                                       |
| ... (more exercises)                  |
|                                       |
| [+ Them bai tap (Add exercise)]      |
|                                       |
+---------------------------------------+
```

- Each exercise: drag handle for reorder
- Swap opens SwapExerciseSheet (same muscle group alternatives)
- Add opens ExerciseSelector (search + filter by muscle group/equipment)
- Back with unsaved changes triggers UnsavedChangesDialog

### WorkoutLogger (Full-Screen Page)

```
+---------------------------------------+
| [<- Back]  Push Day         32:15     |
+---------------------------------------+
| [Bench Press v] [OHP] [Incline] [Fly]|  <- Exercise tabs
+---------------------------------------+
|                                       |
| Overhead Press                        |
| Shoulders . Barbell                   |
| PR: 60kg x 8 reps                    |
|                                       |
| +- Set 1 --------------------------+ |
| | [-] 50.0 kg [+]  x  [-] 10 [+]  | |
| | RPE: [7]          [v] Completed   | |
| +-----------------------------------+ |
|                                       |
| +- Set 2 --------------------------+ |
| | [-] 52.5 kg [+]  x  [-]  8 [+]  | |
| | RPE: [8]          [ ] Not done    | |
| +-----------------------------------+ |
|                                       |
| +- Set 3 --------------------------+ |
| | [-] 52.5 kg [+]  x  [-]  8 [+]  | |
| | RPE: [-]          [ ] Not done    | |
| +-----------------------------------+ |
|                                       |
| [+ Them set (Add set)]               |
|                                       |
| Rest Timer: 01:30                     |
| [Start rest] [Skip]                   |
|                                       |
+---------------------------------------+
| Progressive hint:                     |
| "Try 55kg x 8 next session"          |
|                                       |
|       [Hoan thanh (Complete)]         |
+---------------------------------------+
```

#### Rest Timer

```
+----------------------+
|    Timer 01:23       |
|  [Start] [Reset]     |
|  (or auto-starts)    |
+----------------------+
```

### CardioLogger (Full-Screen Page)

```
+---------------------------------------+
| [<- Back]   Ghi Cardio (Log Cardio)   |
+---------------------------------------+
|                                       |
| Loai (Type):                          |
| [Chay (Run)] [Dap xe (Cycle)]        |
| [Boi (Swim)] [Rowing] [Khac (Other)] |
|                                       |
| Thoi gian (Duration):                 |
| [-]  30  [+]  phut (min)             |
|                                       |
| Khoang cach (Distance):              |
| [-]  5.0  [+]  km                    |
|                                       |
| Nhip tim TB (Avg Heart Rate):        |
| [-]  145  [+]  bpm                   |
|                                       |
| Cuong do (Intensity):                 |
| [Nhe (Low)] [TB (Mod) v] [Cao (High)]|
|                                       |
| Calories uoc tinh: ~320 kcal         |
|                                       |
| Ghi chu (Notes):                      |
| [_________________________]           |
|                                       |
|        [Luu (Save)]                   |
+---------------------------------------+
```

### Progress Sub-tab

```
+---------------------------------------+
| Streak: 7 ngay (7-day streak)         |
+---------------------------------------+
| Tuan nay (This week):                 |
| - 5 workouts . 12,500 kg volume      |
| - 45 min cardio . Best: Squat 100kg  |
+---------------------------------------+
|                                       |
| Weight Progression (Line chart)       |
| +-----------------------------------+|
| |   /\   /\                         ||
| |  /  \/   \--                      ||
| | /            \                    ||
| +-----------------------------------+|
| Jan  Feb  Mar  Apr  May              |
|                                       |
| Max Lifts (Bar chart per exercise)   |
|                                       |
| Milestones                            |
| - [gold] Squatted 100kg (Apr 1)     |
| - [silver] 5 days streak (Mar 28)   |
+---------------------------------------+
```

### History Sub-tab

```
+---------------------------------------+
| [Search...]  [Filter: All v]          |
+---------------------------------------+
|                                       |
| 10 Apr 2026                           |
| +-----------------------------------+|
| | Push Day . 6 exercises . 52 min   ||
| | Volume: 8,400 kg                  ||
| | [Expand details v]                ||
| +-----------------------------------+|
|                                       |
| 9 Apr 2026                            |
| +-----------------------------------+|
| | Cardio . Running . 30 min         ||
| | 5.2 km . 320 kcal                 ||
| +-----------------------------------+|
|                                       |
| 8 Apr 2026                            |
| +-----------------------------------+|
| | Pull Day . 5 exercises . 48 min   ||
| | Volume: 7,200 kg                  ||
| +-----------------------------------+|
|                                       |
| ... (infinite scroll)                 |
+---------------------------------------+
```

---

## Chapter 10: Dashboard Tab

The Dashboard provides a daily overview and quick actions.

### Layout

```
+---------------------------------------+
|                                       |
| +- CombinedHero ----+                |
| | +================================+ |
| | | Good afternoon, Khanh!         | |  <- Gradient card
| | |                                | |     (emerald -> teal)
| | |   +----------+  Today:        | |
| | |   |  Donut   |  1327 kcal     | |  <- Nutrition ring
| | |   |  Chart   |  / 2091        | |
| | |   +----------+                | |
| | |                                | |
| | |  Streak: 7 days               | |  <- Fitness summary
| | |  Next: Push Day                | |
| | +================================+ |
| +------------------------------------+|
|   ^ Tap to open EnergyDetailSheet     |
|                                       |
| +- TodaysPlanCard --+                |
| | Bua an hom nay (Today's meals)     |
| |                                    |
| | (sun) Sang: Trung, Yen mach 487cal|
| | (cloud) Trua: Uc ga, Khoai 510cal |
| | (moon) Toi: (Chua len ke hoach)    |
| |                                    |
| | [+ Them bua toi (Add dinner)]      |
| +------------------------------------+|
|                                       |
| +- QuickActionsBar --+               |
| | [Can (Weight)] [Tap (Workout)]     |
| | [KH (Plan)]    [Cardio]           |
| +------------------------------------+|
|                                       |
| +- AiInsightCard --+                 |
| | AI Goi y (AI Insight)              |
| |                                    |
| | "Ban can them 20g protein          |
| |  trong bua toi de dat muc         |
| |  tieu hom nay"                     |
| |                                    |
| | [Xem goi y chi tiet ->]           |
| +------------------------------------+|
|                                       |
+---------------------------------------+
```

### CombinedHero Detail

- Background: gradient `bg-gradient-to-br from-primary/90 to-emerald-700`
- Time-based greeting: Chao buoi sang/chieu/toi (Good morning/afternoon/evening)
- Nutrition donut ring (MacroDonutChart, smaller size)
- Fitness summary: streak counter, next workout type
- **Tap to open** EnergyDetailSheet (bottom sheet with full BMR/TDEE/Target/Macros breakdown)

### Quick Actions

| Action        | Icon          | Vietnamese  | English | Navigates To                  |
| ------------- | ------------- | ----------- | ------- | ----------------------------- |
| Log Weight    | Scale         | Can nang    | Weight  | WeightQuickLog (bottom sheet) |
| Start Workout | Dumbbell      | Bat dau tap | Workout | WorkoutLogger (full-screen)   |
| Plan Meal     | ClipboardList | Ke hoach    | Plan    | Calendar tab                  |
| Log Cardio    | Activity      | Cardio      | Cardio  | CardioLogger (full-screen)    |

### EnergyDetailSheet (Bottom Sheet)

```
+---------------------------------------+
| === (drag handle) ===                 |
|                                       |
| Chi tiet nang luong                   |
| (Energy Details)                      |
|                                       |
| BMR:           1,704 kcal             |
| (Basal Metabolic Rate)                |
|                                       |
| TDEE:          2,641 kcal             |
| x 1.55 (Moderate activity)            |
|                                       |
| Goal:          Cut (-550)             |
| Target:        2,091 kcal             |
|                                       |
| -- Per Meal Breakdown --              |
| Sang (B): ~520 kcal (25%)            |
| Trua (L): ~730 kcal (35%)            |
| Toi (D):  ~625 kcal (30%)            |
| Snacks:   ~210 kcal (10%)            |
|                                       |
| -- Macros --                          |
| Protein: 157g (2.1g/kg)              |
| Fat:      58g (25%)                   |
| Carbs:   241g (remaining)             |
+---------------------------------------+
```

### WeightQuickLog (Bottom Sheet)

```
+---------------------------------------+
| === (drag handle) ===                 |
|                                       |
| Ghi can nang (Log weight)             |
|                                       |
| Can nang (Weight):                    |
| [-]  75.0  [+]  kg                   |
|                                       |
| Ngay (Date): 10/04/2026              |
|                                       |
| Ghi chu (Note):                       |
| [_________________________]           |
|                                       |
|        [Luu (Save)]                   |
+---------------------------------------+
```

---

## Chapter 11: Settings & Overlays

Settings is a full-screen page opened via the gear icon from any tab header.

### Settings Menu

```
+---------------------------------------+
| [<- Back]      Cai dat (Settings)     |
+---------------------------------------+
| [Tim kiem... (Search...)]             |
+---------------------------------------+
|                                       |
| +- (heart) Ho so suc khoe -----> > + |
| |    (Health Profile)               | |
| |    BMR: 1704 . TDEE: 2641        | |
| +-----------------------------------+ |
|                                       |
| +- (target) Muc tieu ----------> > + |
| |    (Goal)                         | |
| |    Giam can (Cut) - Vua phai     | |
| +-----------------------------------+ |
|                                       |
| +- (dumbbell) Ho so tap luyen -> > + |
| |    (Training Profile)             | |
| |    5 ngay . 60 phut              | |
| +-----------------------------------+ |
|                                       |
| -- Giao dien (Appearance) --          |
| [(sun)Sang] [(moon)Toi] [(sys)HT]   |
| [(clock)LT]                          |
|  (Light)   (Dark)  (System)(Sched.)  |
|                                       |
| -- Dong bo (Cloud Sync) --            |
| Google Drive                          |
| Last sync: 10 Apr 2026, 14:30        |
| [Dong bo ngay (Sync now)]            |
| [Ket noi / Ngat ket noi]             |
|  (Connect / Disconnect)              |
|                                       |
| -- Du lieu (Data) --                  |
| [Xuat (Export)]  [Nhap (Import)]     |
|                                       |
| -- Thong tin (About) --              |
| Version 1.0.0                         |
+---------------------------------------+
```

### Health Profile Detail Page

Two modes: **Read view** -> **Edit view**

#### Read View

```
+---------------------------------------+
| [<- Back]   Ho so suc khoe           |
+---------------------------------------+
|                                       |
| Ten (Name):       Khanh               |
| Gioi tinh:        Nam (Male)          |
| Ngay sinh:        15/05/1996          |
| Chieu cao:        175 cm              |
| Can nang:         75 kg               |
| Hoat dong:        Vua phai (Moderate) |
|                                       |
| -- Tinh toan (Calculated) --         |
| BMR:   1,704 kcal                     |
| TDEE:  2,641 kcal                     |
|                                       |
|       [Chinh sua (Edit)]             |
+---------------------------------------+
```

#### Edit View

```
+---------------------------------------+
| [<- Back]   Chinh sua ho so           |
+---------------------------------------+
|                                       |
| Ten (Name):                           |
| [Khanh_________________________]      |
|                                       |
| Gioi tinh (Gender):                   |
| (*) Nam (Male)  ( ) Nu (Female)       |
|                                       |
| Ngay sinh (DOB):                      |
| [1996-05-15]                          |
|                                       |
| Chieu cao (Height):                   |
| [175] cm                              |
|                                       |
| Can nang (Weight):                    |
| [75.0] kg                             |
|                                       |
| Ti le mo (Body fat %): (optional)     |
| [___]                                 |
|                                       |
| Muc van dong (Activity level):        |
| [Sedentary v]                         |
|                                       |
| BMR Override:                         |
| (*) Tu dong (Auto)  ( ) Nhap thu cong|
| [____] kcal (if manual)              |
|                                       |
| Protein ratio:                        |
| [2.0] g/kg                            |
|                                       |
| -- Preview --                         |
| BMR: 1,704 . TDEE: 2,641             |
| Protein: 157g . Fat: 58g . Carbs: 241g|
|                                       |
|   [Huy (Cancel)]  [Luu (Save)]       |
+---------------------------------------+
```

### Goal Detail Page

```
+---------------------------------------+
| [<- Back]   Muc tieu (Goal)          |
+---------------------------------------+
|                                       |
| Loai muc tieu (Goal type):           |
| [Giam v]  [Giu]    [Tang]            |
|  (Cut)   (Maintain)  (Bulk)          |
|                                       |
| Toc do (Rate):                        |
| [Nhe]    [Vua v]    [Nhanh]          |
| -275cal   -550cal    -1100cal         |
|                                       |
| Offset: -550 kcal/ngay               |
|                                       |
|   [Huy (Cancel)]  [Luu (Save)]       |
+---------------------------------------+
```

### Theme Modes (4 options)

| Mode     | Vietnamese | Icon    | Behavior            |
| -------- | ---------- | ------- | ------------------- |
| Light    | Sang       | Sun     | Always light theme  |
| Dark     | Toi        | Moon    | Always dark theme   |
| System   | He thong   | Monitor | Follows OS setting  |
| Schedule | Lich trinh | Clock   | Auto by time of day |

### SyncConflictModal

When cloud and local data differ, shows side-by-side comparison:

```
+---------------------------------------+
| Xung dot dong bo (Sync conflict)      |
+---------------------------------------+
|                                       |
|  Local Data    |    Cloud Data        |
| ---------------|--------------------- |
|  75 kg         |    73 kg             |
|  BMR: 1704     |    BMR: 1684         |
|  5 dishes      |    7 dishes          |
|  Last: Today   |    Last: Yesterday   |
|                                       |
| [Giu local]        [Dung cloud]       |
| (Keep local)       (Use cloud)        |
+---------------------------------------+
```

### Data Propagation Chain

When any health/goal setting changes, ALL dependent values update automatically:

```
Weight/Height/Age/Gender change
    |
    v
BMR (Mifflin-St Jeor formula)
    |
    v
TDEE (BMR x activity multiplier)
    |
    v
Target Calories (TDEE + goal offset)
    |
    v
Macros (Protein -> Fat -> Carbs)
    |
    +---> Dashboard (CombinedHero, TodaysPlanCard)
    +---> Calendar Nutrition (EnergyBalanceCard, MacroChart)
    +---> Calendar Meals (MiniNutritionBar)
    +---> EnergyDetailSheet (full breakdown)
    +---> Fitness bridge (calorie tracking)
```

**Designer note:** Every screen that displays nutrition data (calories, macros, targets) must update when the user changes their profile. Design for this consistency — the same numbers should appear everywhere.

---

## Chapter 12: Build APK & Emulator Setup

This chapter helps designers set up a local Android emulator to test the app alongside their Figma mockups.

### Prerequisites

| Tool           | Version | Purpose             |
| -------------- | ------- | ------------------- |
| Node.js        | 18+     | JavaScript runtime  |
| npm            | 9+      | Package manager     |
| Android Studio | Latest  | Emulator + SDK      |
| JDK            | 17+     | Android build tools |
| Chrome         | Latest  | DevTools debugging  |

### Quick Setup Steps

```bash
# 1. Install dependencies
npm install

# 2. Build web assets
npm run build

# 3. Sync to Android project
npx cap sync android

# 4. Build debug APK
cd android && ./gradlew assembleDebug && cd ..

# 5. APK location
# -> android/app/build/outputs/apk/debug/app-debug.apk
```

### Emulator Setup

1. Open **Android Studio** -> Tools -> Device Manager
2. Create Virtual Device:
   - Device: **Pixel 7** (or similar)
   - System Image: **API 34** (Android 14)
   - Resolution: **1080 x 2400**
   - Density: **420 dpi**
3. Start the emulator
4. Install the APK:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

5. Launch the app:

```bash
adb shell am start -n com.mealplaner.app/.MainActivity
```

### Chrome DevTools (Inspect WebView)

1. Open Chrome -> navigate to `chrome://inspect`
2. Under "Remote Target", find the MealPlaner WebView
3. Click "Inspect" to open DevTools
4. Use DevTools tabs:
   - **Elements:** Inspect layout, CSS, DOM structure
   - **Console:** View JavaScript errors/warnings
   - **Network:** Monitor API calls (for AI features)
   - **Application:** Check Local Storage, SQLite state

### Quick Rebuild (After Code Changes)

```bash
npm run build && npx cap sync android && cd android && ./gradlew assembleDebug && cd ..
```

Then reinstall: `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`

### Common Issues

| Problem                | Solution                                                                        |
| ---------------------- | ------------------------------------------------------------------------------- |
| Emulator very slow     | Enable Hardware Acceleration (HAXM/KVM) in Android Studio                       |
| White/blank screen     | Run `npx cap sync android` after every `npm run build`                          |
| App won't install      | Check package name: must be `com.mealplaner.app` (note: "planer" not "planner") |
| Can't connect DevTools | Use debug APK (not release); ensure WebView debugging is enabled                |
| Layout looks wrong     | Test at 1080x2400, 420dpi — this is the reference device                        |

### Design-to-Development Handoff Notes

| Figma Concept   | Implementation                                                 |
| --------------- | -------------------------------------------------------------- |
| Colors          | OKLCH tokens in `src/index.css` (Chapter 2)                    |
| Spacing         | 8dp grid tokens (Chapter 2.3)                                  |
| Components      | shadcn/ui + custom components in `src/components/`             |
| Icons           | Lucide React (browse at lucide.dev)                            |
| Animations      | CSS keyframes + Tailwind transitions                           |
| Responsive      | Single breakpoint: mobile-first (360-412px), no desktop layout |
| Dark mode       | `.dark` class on `<html>` toggles all color tokens             |
| Vietnamese text | All UI text comes from `src/locales/vi.json` via i18next       |
| Safe areas      | CSS `env(safe-area-inset-*)` for status/nav bars               |

---

## Appendix A: Screen Index (Quick Reference)

| #   | Screen                  | Type        | Parent      | Key Components                         |
| --- | ----------------------- | ----------- | ----------- | -------------------------------------- |
| 1   | Welcome Slides          | Onboarding  | —           | Carousel, dots, CTA                    |
| 2   | Health Profile Form     | Onboarding  | —           | Gender, Name, DOB, Height, Weight      |
| 3   | Activity Level          | Onboarding  | —           | 5 RadioPill cards                      |
| 4   | Goal Selection          | Onboarding  | —           | 3 goal + 3 rate cards                  |
| 5   | Confirm Summary         | Onboarding  | —           | BMR/TDEE/Macros display                |
| 6   | Training Setup (x8)     | Onboarding  | —           | Various form steps                     |
| 7   | Computing               | Onboarding  | —           | Progress animation                     |
| 8   | Plan Preview            | Onboarding  | —           | Weekly plan summary                    |
| 9   | Calendar — Meals        | Tab         | Calendar    | MiniNutritionBar, MealSlots, ActionBar |
| 10  | Calendar — Nutrition    | Tab         | Calendar    | EnergyBalance, Donut, MacroBars        |
| 11  | MealPlannerModal        | Modal       | Calendar    | Tabs, Search, Dish selection           |
| 12  | CopyPlanModal           | Modal       | Calendar    | Date picker, Preview                   |
| 13  | ClearPlanModal          | Modal       | Calendar    | Confirmation                           |
| 14  | SaveTemplateModal       | Modal       | Calendar    | Name, Tags, Preview                    |
| 15  | TemplateManager         | Modal       | Calendar    | Search, Template cards                 |
| 16  | GroceryList             | Modal       | Calendar    | Aggregated items                       |
| 17  | Library — Dishes        | Tab         | Library     | ListToolbar, DishCards                 |
| 18  | Library — Ingredients   | Tab         | Library     | ListToolbar, IngredientCards           |
| 19  | DishEditModal           | Modal       | Library     | 2-step form                            |
| 20  | IngredientEditModal     | Modal       | Library     | Nutrition per 100g form                |
| 21  | AI Analysis             | Tab         | AI          | Camera, Results, Save                  |
| 22  | AISuggestionPreview     | Modal       | AI/Calendar | Daily meal suggestion                  |
| 23  | SaveAnalyzedDish        | Modal       | AI          | Confirm analyzed dish                  |
| 24  | Dashboard               | Tab         | Dashboard   | Hero, TodaysPlan, Actions, Insights    |
| 25  | EnergyDetailSheet       | Sheet       | Dashboard   | BMR/TDEE/Target/Macros                 |
| 26  | WeightQuickLog          | Sheet       | Dashboard   | Weight input + save                    |
| 27  | Fitness — Plan          | Tab         | Fitness     | Active plan, Weekly grid               |
| 28  | Fitness — Progress      | Tab         | Fitness     | Charts, Streak, Milestones             |
| 29  | Fitness — History       | Tab         | Fitness     | Workout timeline                       |
| 30  | PlanDayEditor           | Full-screen | Fitness     | Exercise list, Add/Swap                |
| 31  | WorkoutLogger           | Full-screen | Fitness     | Set logging, Timer                     |
| 32  | CardioLogger            | Full-screen | Fitness     | Type, Duration, Distance               |
| 33  | ExerciseSelector        | Sheet       | Fitness     | Search, Filter, Select                 |
| 34  | SwapExerciseSheet       | Sheet       | Fitness     | Alternative exercises                  |
| 35  | DayAssignmentSheet      | Sheet       | Fitness     | Weekday assignment                     |
| 36  | SetEditor               | Sheet       | Fitness     | Weight/Reps/RPE                        |
| 37  | Settings Menu           | Full-screen | Any         | Search, Section cards                  |
| 38  | Health Profile Detail   | Settings    | Settings    | Read + Edit views                      |
| 39  | Goal Detail             | Settings    | Settings    | Goal type + Rate                       |
| 40  | Training Profile Detail | Settings    | Settings    | Training form                          |
| 41  | SyncConflictModal       | Modal       | Settings    | Side-by-side compare                   |
| 42  | ConfirmationModal       | Modal       | Various     | Generic confirm                        |
| 43  | UnsavedChangesDialog    | Modal       | Forms       | Save/Discard/Stay                      |
| 44  | PlanScheduleEditor      | Full-screen | Fitness     | Weekly schedule config                 |
| 45  | PlanTemplateGallery     | Full-screen | Fitness     | Template browser                       |
| 46  | SplitChanger            | Full-screen | Fitness     | Training split selector                |
| 47  | GoalDetailPage          | Full-screen | Settings    | Goal editing                           |

---

## Appendix B: Vietnamese UI Text Reference

Key labels that appear throughout the app (for accurate Figma mockups):

### Navigation

| Vietnamese | English     | Context        |
| ---------- | ----------- | -------------- |
| Lich       | Calendar    | Bottom nav tab |
| Thu vien   | Library     | Bottom nav tab |
| AI         | AI Analysis | Bottom nav tab |
| Tap luyen  | Fitness     | Bottom nav tab |
| Tong quan  | Dashboard   | Bottom nav tab |

### Common Actions

| Vietnamese | English  | Context              |
| ---------- | -------- | -------------------- |
| Luu        | Save     | All save buttons     |
| Huy        | Cancel   | All cancel buttons   |
| Xoa        | Delete   | Delete actions       |
| Chinh sua  | Edit     | Edit buttons         |
| Them       | Add      | Add buttons          |
| Tiep tuc   | Continue | Wizard next          |
| Quay lai   | Go back  | Back navigation      |
| Xac nhan   | Confirm  | Confirmation buttons |
| Bo qua     | Skip     | Skip optional steps  |
| Tim kiem   | Search   | Search inputs        |
| Dong       | Close    | Close buttons        |

### Nutrition Terms

| Vietnamese | English       | Context            |
| ---------- | ------------- | ------------------ |
| Calories   | Calories      | (same in both)     |
| Protein    | Protein       | (same in both)     |
| Chat beo   | Fat           | Macro nutrient     |
| Carbs      | Carbohydrates | (same in both)     |
| Chat xo    | Fiber         | Macro nutrient     |
| Bua Sang   | Breakfast     | Meal type          |
| Bua Trua   | Lunch         | Meal type          |
| Bua Toi    | Dinner        | Meal type          |
| Muc tieu   | Target        | Calorie target     |
| Con lai    | Remaining     | Remaining calories |

### Fitness Terms

| Vietnamese | English  | Context             |
| ---------- | -------- | ------------------- |
| Ke hoach   | Plan     | Training plan       |
| Tien trinh | Progress | Progress tracking   |
| Lich su    | History  | Workout history     |
| Bai tap    | Exercise | Individual exercise |
| Hiep       | Set      | Exercise set        |
| Lan        | Rep      | Repetition          |
| Nghi       | Rest     | Rest day/timer      |
| Hoan thanh | Complete | Workout completion  |

---

_End of Design Guide — Smart Meal Planner v1.0_
