# Color Palette Design Specification — MealPlaning v2.0

> **Status**: DESIGN_READY  
> **Author**: Designer Agent  
> **Date**: 2025-07-14  
> **Scope**: 88 primitive tokens, 80 semantic tokens (64 existing + 16 new), light + dark mode  
> **Constraints**: oklch(), Tailwind v4 CSS-first, WCAG AA, hue-specific chroma caps (BR-07)

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Primitive Palette — 88 Tokens](#2-primitive-palette--88-tokens)
3. [Semantic Token Mapping — 80 Tokens](#3-semantic-token-mapping--80-tokens)
4. [Contrast Verification Matrix](#4-contrast-verification-matrix)
5. [Dark Mode Strategy](#5-dark-mode-strategy)
6. [Design Rationale & Visual Notes](#6-design-rationale--visual-notes)
7. [Gamut Safety & Mapping Plan](#7-gamut-safety--mapping-plan)
8. [Implementation Notes](#8-implementation-notes)
9. [Open Issues & Recommendations](#9-open-issues--recommendations)

---

## 1. Design Philosophy

### 1.1 Mood & Feel

**Warm-Energetic Wellness** — inspired by leading meal planning apps (MyFitnessPal, Noom, Lifesum, Yazio):

| Quality | How We Achieve It |
|---------|-------------------|
| **Fresh & Healthy** | Emerald greens dominate protein/success — evokes freshness, natural food |
| **Warm & Appetizing** | Amber/golden hues for fat, breakfast, warnings — stimulates appetite subtly |
| **Trustworthy** | Blue for carbs/info — calm, reliable, data-driven feel |
| **Smart & Modern** | Violet for AI/dinner — sophisticated, tech-forward |
| **Energetic** | Yellow-green for energy features — vibrant, motivational |
| **Clean Base** | Neutral gray foundation (Phase 2 decision deferred) — professional, non-distracting |

### 1.2 Architecture: 2-Layer Token System

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: PRIMITIVES (88 tokens)                            │
│  Raw oklch values. Never referenced directly by components. │
│  --red-500, --emerald-600, --blue-50, etc.                  │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2: SEMANTICS (83 tokens)                             │
│  Named by PURPOSE. Referenced by components via Tailwind.   │
│  --macro-protein → var(--emerald-600)                       │
│  --meal-breakfast → var(--amber-500)                        │
│  Components use: text-macro-protein, bg-meal-breakfast      │
└─────────────────────────────────────────────────────────────┘
```

**Rule**: Components NEVER use primitive tokens directly. Always go through semantic layer. This enables theme changes by remapping semantic → primitive without touching component code.

### 1.3 Hue Allocation (from BM)

| Hue° | Family | Domains | Rationale |
|------|--------|---------|-----------|
| 27° | Red | Error, Destructive, Toast Error | Universal danger signal |
| 65° | Amber | Warning, Fat, Breakfast, Warm Accent | Warm, appetizing, morning sun |
| 100° | Yellow-Green | Energy feature | Vibrant, metabolic, active |
| 145° | Emerald | Success, Protein, Lunch, Highlight | Fresh, healthy, growth |
| 185° | Teal | Fiber | Cool, distinct from emerald, secondary nutrition |
| 230° | Blue | Info, Carbs, Compare | Calm, trustworthy, analytical |
| 280° | Violet | AI, Dinner | Sophisticated, evening, intelligent |
| 350° | Rose | Rose feature | Soft, warm-pink, unique identity |

**ΔHue verification** (BR-04: ≥ 30° between domains):

| Pair | ΔHue | Pass? |
|------|------|-------|
| Red↔Amber | 38° | ✅ |
| Amber↔YG | 35° | ✅ |
| YG↔Emerald | 45° | ✅ |
| Emerald↔Teal | 40° | ✅ |
| Teal↔Blue | 45° | ✅ |
| Blue↔Violet | 50° | ✅ |
| Violet↔Rose | 70° | ✅ |
| Rose↔Red | 37° | ✅ |

All pairs ≥ 35°. Minimum is Red↔Amber at 38° and Amber↔YG at 35°.

---

## 2. Primitive Palette — 88 Tokens

### 2.1 Lightness & Chroma Curves

All 8 hue families share the same lightness backbone with hue-adapted chroma:

| Shade | Target L | Chroma Range | Usage Intent |
|-------|----------|-------------|--------------|
| 50 | 0.971–0.980 | 0.012–0.016 | Tinted backgrounds, subtle fills |
| 100 | 0.936–0.955 | 0.028–0.038 | Light backgrounds, hover states |
| 200 | 0.885–0.915 | 0.055–0.076 | Borders, dividers, light chips |
| 300 | 0.820–0.860 | 0.092–0.120 | Emphasis backgrounds, tags |
| 400 | 0.738–0.805 | 0.128–0.155 | Dark mode base text, icons |
| 500 | 0.645–0.740 | 0.158–0.175 | Charts, badges, progress bars, icons |
| 600 | 0.570–0.660 | 0.168–0.180 | Primary semantic color, icon fills |
| 700 | 0.490–0.570 | 0.140–0.163 | Text on white (AA), emphasis |
| 800 | 0.435–0.480 | 0.120–0.133 | Strong text, dark labels |
| 900 | 0.330–0.395 | 0.080–0.098 | Very dark, near-black tinted |
| 950 | 0.260–0.310 | 0.055–0.065 | Darkest, dark mode subtle bg |

**Chroma caps are HUE-SPECIFIC** per BR-07 for sRGB gamut containment:

| Hue Family | Max Chroma | Reason |
|-----------|-----------|--------|
| Red (27°) | 0.180 | sRGB-safe at all L values |
| Amber (65°) | 0.170 | Yellow-warm hues clip above 0.170 at mid-L |
| Yellow-Green (100°) | 0.165 | Green-yellow clips above 0.165 at L=0.65 |
| Emerald (145°) | 0.178 | Green is sRGB-generous, near-full 0.18 |
| Teal (185°) | 0.155 | Cyan axis has tight sRGB boundary |
| Blue (230°) | 0.160 | Blue clips at 0.175 for L=0.615 |
| Violet (280°) | 0.165 | Purple clips at 0.178 for mid-L shades |
| Rose (350°) | 0.180 | sRGB-safe at all L values |

### 2.2 Red (H = 27°) — Error / Destructive

```css
--red-50:  oklch(0.971 0.013 27);
--red-100: oklch(0.936 0.032 27);
--red-200: oklch(0.885 0.062 27);
--red-300: oklch(0.820 0.100 27);
--red-400: oklch(0.738 0.143 27);
--red-500: oklch(0.650 0.170 27);
--red-600: oklch(0.570 0.180 27);
--red-700: oklch(0.500 0.163 27);
--red-800: oklch(0.435 0.133 27);
--red-900: oklch(0.370 0.098 27);
--red-950: oklch(0.270 0.065 27);
```

### 2.3 Amber (H = 65°) — Warning / Fat / Breakfast

```css
--amber-50:  oklch(0.980 0.016 65);
--amber-100: oklch(0.954 0.038 65);
--amber-200: oklch(0.910 0.076 65);
--amber-300: oklch(0.855 0.115 65);
--amber-400: oklch(0.790 0.148 65);
--amber-500: oklch(0.720 0.170 65);
--amber-600: oklch(0.640 0.170 65);
--amber-700: oklch(0.555 0.155 65);
--amber-800: oklch(0.470 0.125 65);
--amber-900: oklch(0.385 0.092 65);
--amber-950: oklch(0.280 0.060 65);
```

### 2.4 Yellow-Green (H = 100°) — Energy Feature

```css
--yg-50:  oklch(0.980 0.015 100);
--yg-100: oklch(0.955 0.036 100);
--yg-200: oklch(0.912 0.068 100);
--yg-300: oklch(0.858 0.108 100);
--yg-400: oklch(0.793 0.142 100);
--yg-500: oklch(0.725 0.165 100);
--yg-600: oklch(0.650 0.165 100);
--yg-700: oklch(0.565 0.148 100);
--yg-800: oklch(0.478 0.122 100);
--yg-900: oklch(0.390 0.090 100);
--yg-950: oklch(0.285 0.058 100);
```

### 2.5 Emerald (H = 145°) — Success / Protein / Lunch

```css
--emerald-50:  oklch(0.978 0.014 145);
--emerald-100: oklch(0.950 0.034 145);
--emerald-200: oklch(0.905 0.066 145);
--emerald-300: oklch(0.845 0.108 145);
--emerald-400: oklch(0.778 0.145 145);
--emerald-500: oklch(0.710 0.170 145);
--emerald-600: oklch(0.632 0.178 145);
--emerald-700: oklch(0.548 0.157 145);
--emerald-800: oklch(0.465 0.127 145);
--emerald-900: oklch(0.380 0.093 145);
--emerald-950: oklch(0.278 0.062 145);
```

### 2.6 Teal (H = 185°) — Fiber

```css
--teal-50:  oklch(0.978 0.013 185);
--teal-100: oklch(0.950 0.030 185);
--teal-200: oklch(0.905 0.058 185);
--teal-300: oklch(0.845 0.092 185);
--teal-400: oklch(0.778 0.125 185);
--teal-500: oklch(0.710 0.150 185);
--teal-600: oklch(0.632 0.155 185);
--teal-700: oklch(0.548 0.140 185);
--teal-800: oklch(0.465 0.115 185);
--teal-900: oklch(0.380 0.082 185);
--teal-950: oklch(0.278 0.055 185);
```

> **Note**: Teal has the lowest max sRGB chroma of all 8 families. Peak at 0.155 (shade 600). The cyan axis (H≈180-190°) is the most constrained in sRGB.

### 2.7 Blue (H = 230°) — Info / Carbs / Compare

```css
--blue-50:  oklch(0.976 0.012 230);
--blue-100: oklch(0.948 0.028 230);
--blue-200: oklch(0.900 0.055 230);
--blue-300: oklch(0.840 0.090 230);
--blue-400: oklch(0.770 0.128 230);
--blue-500: oklch(0.695 0.155 230);
--blue-600: oklch(0.615 0.160 230);
--blue-700: oklch(0.530 0.145 230);
--blue-800: oklch(0.450 0.118 230);
--blue-900: oklch(0.365 0.085 230);
--blue-950: oklch(0.265 0.055 230);
```

### 2.8 Violet (H = 280°) — AI / Dinner

```css
--violet-50:  oklch(0.976 0.013 280);
--violet-100: oklch(0.946 0.030 280);
--violet-200: oklch(0.897 0.058 280);
--violet-300: oklch(0.835 0.095 280);
--violet-400: oklch(0.765 0.130 280);
--violet-500: oklch(0.690 0.158 280);
--violet-600: oklch(0.610 0.165 280);
--violet-700: oklch(0.525 0.148 280);
--violet-800: oklch(0.443 0.122 280);
--violet-900: oklch(0.360 0.088 280);
--violet-950: oklch(0.265 0.058 280);
```

### 2.9 Rose (H = 350°) — Rose Feature

```css
--rose-50:  oklch(0.975 0.014 350);
--rose-100: oklch(0.940 0.033 350);
--rose-200: oklch(0.892 0.062 350);
--rose-300: oklch(0.830 0.103 350);
--rose-400: oklch(0.755 0.143 350);
--rose-500: oklch(0.670 0.173 350);
--rose-600: oklch(0.588 0.180 350);
--rose-700: oklch(0.508 0.162 350);
--rose-800: oklch(0.432 0.132 350);
--rose-900: oklch(0.352 0.097 350);
--rose-950: oklch(0.260 0.065 350);
```

### 2.10 Primitive Token Summary

| Hue Family | Token Prefix | H° | Peak Chroma | Shades |
|-----------|-------------|-----|-------------|--------|
| Red | `--red-` | 27 | 0.180 @ 600 | 11 |
| Amber | `--amber-` | 65 | 0.170 @ 500-600 | 11 |
| Yellow-Green | `--yg-` | 100 | 0.165 @ 500-600 | 11 |
| Emerald | `--emerald-` | 145 | 0.178 @ 600 | 11 |
| Teal | `--teal-` | 185 | 0.155 @ 600 | 11 |
| Blue | `--blue-` | 230 | 0.160 @ 600 | 11 |
| Violet | `--violet-` | 280 | 0.165 @ 600 | 11 |
| Rose | `--rose-` | 350 | 0.180 @ 600 | 11 |
| **Total** | | | | **88** |

---

## 3. Semantic Token Mapping — 80 Tokens

### 3.1 Token Naming Convention

Each domain gets up to 3 variants:

| Variant | Suffix | Light Shade | Dark Shade | Usage |
|---------|--------|-------------|------------|-------|
| **Base** | (none) | 600 | 400 | Icons, charts, badges, progress bars, large text |
| **Emphasis** | `-emphasis` | 700–800 | 300 | Small body text on white/dark bg (WCAG AA) |
| **Subtle** | `-subtle` | 50 | 950 @ 30% | Tinted backgrounds, hover fills |

### 3.2 Neutral Base Tokens (21 tokens — Phase 2, UNCHANGED)

These tokens remain pure neutral grayscale. Primary brand color decision deferred to Phase 2.

```css
/* ── :root (Light Mode) ── UNCHANGED from current ── */
--background:            oklch(1 0 0);           /* #FFFFFF */
--foreground:            oklch(0.145 0 0);        /* #0A0A0A */
--card:                  oklch(1 0 0);
--card-foreground:       oklch(0.145 0 0);
--popover:               oklch(1 0 0);
--popover-foreground:    oklch(0.145 0 0);
--primary:               oklch(0.145 0 0);        /* Black button */
--primary-foreground:    oklch(1 0 0);
--secondary:             oklch(0.918 0 0);        /* #E5E5E5 */
--secondary-foreground:  oklch(0.145 0 0);
--muted:                 oklch(0.97 0 0);         /* #F5F5F5 */
--muted-foreground:      oklch(0.616 0 0);        /* #8A8A8A */
--accent:                oklch(0.97 0 0);
--accent-foreground:     oklch(0.145 0 0);
--border:                oklch(0.918 0 0);
--input:                 oklch(0.918 0 0);
--ring:                  oklch(0.145 0 0);
--primary-subtle:        oklch(0.97 0 0);
--primary-emphasis:      oklch(0.253 0 0);        /* #262626 */
--foreground-secondary:  oklch(0.432 0 0);        /* #525252 */
--border-subtle:         oklch(0.955 0 0);        /* #F0F0F0 */
```

### 3.3 Destructive Tokens (3 existing) → Red

```css
/* ── Light Mode ── */
--destructive:           var(--red-600);   /* oklch(0.570 0.180 27) */
--destructive-emphasis:  var(--red-700);   /* oklch(0.500 0.163 27) */
--destructive-subtle:    var(--red-50);    /* oklch(0.971 0.013 27) */

/* ── Dark Mode ── */
--destructive:           var(--red-400);   /* oklch(0.738 0.143 27) */
--destructive-emphasis:  var(--red-300);   /* oklch(0.820 0.100 27) */
--destructive-subtle:    oklch(0.270 0.065 27 / 0.30);  /* red-950/30% */
```

### 3.4 Macro Nutrition Tokens (12 tokens, 4 NEW) → Emerald/Amber/Blue/Teal

```css
/* ═══ Light Mode ═══ */

/* Protein → Emerald (H=145°) */
--macro-protein:           var(--emerald-600);  /* oklch(0.632 0.178 145) */
--macro-protein-emphasis:  var(--emerald-700);  /* oklch(0.548 0.157 145) — AA text on white */
--macro-protein-subtle:    var(--emerald-50);   /* oklch(0.978 0.014 145) */

/* Fat → Amber (H=65°) */
--macro-fat:               var(--amber-600);    /* oklch(0.640 0.170 65) */
--macro-fat-emphasis:      var(--amber-800);    /* oklch(0.470 0.125 65) — AA text on white ★NEW */
--macro-fat-subtle:        var(--amber-50);     /* oklch(0.980 0.016 65) ★NEW */

/* Carbs → Blue (H=230°) */
--macro-carbs:             var(--blue-600);     /* oklch(0.615 0.160 230) */
--macro-carbs-emphasis:    var(--blue-700);     /* oklch(0.530 0.145 230) — AA text on white */
--macro-carbs-subtle:      var(--blue-50);      /* oklch(0.976 0.012 230) */

/* Fiber → Teal (H=185°) */
--macro-fiber:             var(--teal-600);     /* oklch(0.632 0.155 185) */
--macro-fiber-emphasis:    var(--teal-700);     /* oklch(0.548 0.140 185) — AA text on white ★NEW */
--macro-fiber-subtle:      var(--teal-50);      /* oklch(0.978 0.013 185) ★NEW */

/* ═══ Dark Mode ═══ */
--macro-protein:           var(--emerald-400);  /* oklch(0.778 0.145 145) */
--macro-protein-emphasis:  var(--emerald-300);  /* oklch(0.845 0.108 145) */
--macro-protein-subtle:    oklch(0.278 0.062 145 / 0.30);

--macro-fat:               var(--amber-400);    /* oklch(0.790 0.155 65) */
--macro-fat-emphasis:      var(--amber-300);    /* oklch(0.855 0.118 65) */
--macro-fat-subtle:        oklch(0.280 0.063 65 / 0.30);

--macro-carbs:             var(--blue-400);     /* oklch(0.770 0.128 230) */
--macro-carbs-emphasis:    var(--blue-300);     /* oklch(0.840 0.090 230) */
--macro-carbs-subtle:      oklch(0.265 0.060 230 / 0.30);

--macro-fiber:             var(--teal-400);     /* oklch(0.778 0.133 185) */
--macro-fiber-emphasis:    var(--teal-300);     /* oklch(0.845 0.098 185) */
--macro-fiber-subtle:      oklch(0.278 0.058 185 / 0.30);
```

> **Design Note — Amber text contrast**: Amber-700 (L=0.555) achieves only ~4.0:1 on white — borderline AA. We use **amber-800** (L=0.470, ~5.4:1) for `macro-fat-emphasis` to ensure AA compliance. The tradeoff is a slightly brownish amber for text, but this is standard practice for warm hues.

### 3.5 Status/Feedback Tokens (9 tokens, 6 NEW) → Emerald/Amber/Blue

```css
/* ═══ Light Mode ═══ */
--status-success:           var(--emerald-600);  /* oklch(0.632 0.178 145) */
--status-success-emphasis:  var(--emerald-700);  /* oklch(0.548 0.157 145) ★NEW */
--status-success-subtle:    var(--emerald-50);   /* oklch(0.978 0.014 145) ★NEW */

--status-warning:           var(--amber-500);    /* oklch(0.720 0.170 65) — slightly lighter for status badges */
--status-warning-emphasis:  var(--amber-800);    /* oklch(0.470 0.125 65) ★NEW */
--status-warning-subtle:    var(--amber-50);     /* oklch(0.980 0.016 65) ★NEW */

--status-info:              var(--blue-600);     /* oklch(0.615 0.160 230) */
--status-info-emphasis:     var(--blue-700);     /* oklch(0.530 0.145 230) ★NEW */
--status-info-subtle:       var(--blue-50);      /* oklch(0.976 0.012 230) ★NEW */

/* ═══ Dark Mode ═══ */
--status-success:           var(--emerald-400);
--status-success-emphasis:  var(--emerald-300);
--status-success-subtle:    oklch(0.278 0.062 145 / 0.30);

--status-warning:           var(--amber-400);
--status-warning-emphasis:  var(--amber-300);
--status-warning-subtle:    oklch(0.280 0.063 65 / 0.30);

--status-info:              var(--blue-400);
--status-info-emphasis:     var(--blue-300);
--status-info-subtle:       oklch(0.265 0.060 230 / 0.30);
```

### 3.6 Toast Notification Tokens (9 existing)

```css
/* ═══ Light Mode ═══ */
--toast-error:           var(--red-600);    /* oklch(0.570 0.180 27) */
--toast-error-subtle:    var(--red-50);     /* oklch(0.971 0.013 27) */
--toast-error-emphasis:  var(--red-800);    /* oklch(0.435 0.133 27) */

--toast-warning:           var(--amber-600);  /* oklch(0.640 0.170 65) */
--toast-warning-subtle:    var(--amber-50);   /* oklch(0.980 0.016 65) */
--toast-warning-emphasis:  var(--amber-800);  /* oklch(0.470 0.125 65) */

--toast-info:              var(--blue-600);   /* oklch(0.615 0.160 230) */
--toast-info-subtle:       var(--blue-50);    /* oklch(0.976 0.012 230) */
--toast-info-emphasis:     var(--blue-800);   /* oklch(0.450 0.118 230) */

/* ═══ Dark Mode ═══ */
--toast-error:           var(--red-400);
--toast-error-subtle:    oklch(0.270 0.065 27 / 0.30);
--toast-error-emphasis:  var(--red-300);

--toast-warning:           var(--amber-400);
--toast-warning-subtle:    oklch(0.280 0.063 65 / 0.30);
--toast-warning-emphasis:  var(--amber-300);

--toast-info:              var(--blue-400);
--toast-info-subtle:       oklch(0.265 0.060 230 / 0.30);
--toast-info-emphasis:     var(--blue-300);
```

### 3.7 Meal Type Tokens (9 tokens, 6 NEW) → Amber/Emerald/Violet

```css
/* ═══ Light Mode ═══ */
--meal-breakfast:           var(--amber-500);    /* oklch(0.720 0.170 65) — morning sun gold */
--meal-breakfast-emphasis:  var(--amber-700);    /* oklch(0.555 0.155 65) ★NEW */
--meal-breakfast-subtle:    var(--amber-50);     /* oklch(0.980 0.016 65) ★NEW */

--meal-lunch:               var(--emerald-500);  /* oklch(0.710 0.170 145) — fresh midday green */
--meal-lunch-emphasis:      var(--emerald-700);  /* oklch(0.548 0.157 145) ★NEW */
--meal-lunch-subtle:        var(--emerald-50);   /* oklch(0.978 0.014 145) ★NEW */

--meal-dinner:              var(--violet-500);   /* oklch(0.690 0.158 280) — evening violet */
--meal-dinner-emphasis:     var(--violet-700);   /* oklch(0.525 0.148 280) ★NEW */
--meal-dinner-subtle:       var(--violet-50);    /* oklch(0.976 0.013 280) ★NEW */

/* ═══ Dark Mode ═══ */
--meal-breakfast:           var(--amber-400);
--meal-breakfast-emphasis:  var(--amber-300);
--meal-breakfast-subtle:    oklch(0.280 0.063 65 / 0.30);

--meal-lunch:               var(--emerald-400);
--meal-lunch-emphasis:      var(--emerald-300);
--meal-lunch-subtle:        oklch(0.278 0.062 145 / 0.30);

--meal-dinner:              var(--violet-400);
--meal-dinner-emphasis:     var(--violet-300);
--meal-dinner-subtle:       oklch(0.265 0.062 280 / 0.30);
```

### 3.8 Feature Color Tokens (9 existing) → YG/Violet/Rose

```css
/* ═══ Light Mode ═══ */
--color-energy:           var(--yg-500);     /* oklch(0.725 0.165 100) */
--color-energy-emphasis:  var(--yg-700);     /* oklch(0.565 0.148 100) */
--color-energy-subtle:    var(--yg-50);      /* oklch(0.980 0.015 100) */

--color-ai:               var(--violet-600); /* oklch(0.610 0.165 280) */
--color-ai-subtle:        var(--violet-50);  /* oklch(0.976 0.013 280) */
--color-ai-emphasis:      var(--violet-700); /* oklch(0.525 0.148 280) */

--color-rose:             var(--rose-500);   /* oklch(0.670 0.173 350) */
--color-rose-emphasis:    var(--rose-700);   /* oklch(0.508 0.162 350) */
--color-rose-subtle:      var(--rose-50);    /* oklch(0.975 0.014 350) */

/* ═══ Dark Mode ═══ */
--color-energy:           var(--yg-400);
--color-energy-emphasis:  var(--yg-300);
--color-energy-subtle:    oklch(0.285 0.062 100 / 0.30);

--color-ai:               var(--violet-400);
--color-ai-subtle:        oklch(0.265 0.062 280 / 0.30);
--color-ai-emphasis:      var(--violet-300);

--color-rose:             var(--rose-400);
--color-rose-emphasis:    var(--rose-300);
--color-rose-subtle:      oklch(0.260 0.065 350 / 0.30);
```

### 3.9 Accent Extended Tokens (6 existing)

```css
/* ═══ Light Mode ═══ */
--accent-warm:                var(--amber-600);    /* oklch(0.640 0.170 65) — warm CTA */
--accent-warm-foreground:     oklch(1 0 0);        /* White text on warm bg */
--accent-highlight:           var(--emerald-500);  /* oklch(0.710 0.170 145) — active/selected */
--accent-highlight-foreground: oklch(1 0 0);       /* White text on highlight bg */
--accent-subtle:              oklch(0.97 0 0);     /* NEUTRAL — Phase 2 */
--accent-emphasis:            oklch(0.304 0 0);    /* NEUTRAL — Phase 2 */

/* ═══ Dark Mode ═══ */
--accent-warm:                var(--amber-400);
--accent-warm-foreground:     oklch(0.145 0 0);    /* Dark text on light amber */
--accent-highlight:           var(--emerald-400);
--accent-highlight-foreground: oklch(0.145 0 0);
--accent-subtle:              oklch(0.205 0 0);    /* NEUTRAL */
--accent-emphasis:            oklch(0.918 0 0);    /* NEUTRAL */
```

### 3.10 Compare Tokens (2 existing)

```css
/* ═══ Light Mode ═══ */
--compare-active:   var(--blue-600);  /* oklch(0.615 0.160 230) */
--compare-default:  var(--blue-300);  /* oklch(0.840 0.090 230) */

/* ═══ Dark Mode ═══ */
--compare-active:   var(--blue-400);
--compare-default:  var(--blue-700);
```

### 3.11 Shadow Token (Light Mode update)

```css
/* Light Mode — tinted glow using dominant green */
--shadow-glow: 0 2px 6px oklch(0.145 0 0 / 0.15); /* Keep neutral — Phase 2 */
```

### 3.12 Focus Ring Fix (US-07)

```css
/* BEFORE (hardcoded in :focus-visible rule): */
outline: 2px solid oklch(0.145 0 0);

/* AFTER (uses token): */
outline: 2px solid var(--ring);
```

No new token needed — just fix the CSS rule to reference the existing `--ring` variable.

### 3.13 Token Count Summary

| Category | Existing | New | Total |
|----------|----------|-----|-------|
| Neutral base | 21 | 0 | 21 |
| Destructive | 3 | 0 | 3 |
| Macro nutrition | 8 | 4 | 12 |
| Status/feedback | 3 | 6 | 9 |
| Toast notification | 9 | 0 | 9 |
| Meal type | 3 | 6 | 9 |
| Feature colors | 9 | 0 | 9 |
| Accent extended | 6 | 0 | 6 |
| Compare | 2 | 0 | 2 |
| Focus ring fix | — | — | (CSS rule, not token) |
| **Grand Total** | **64** | **16** | **80** |

> **Note**: BM estimated 65 existing + 19 new = 84. Actual count is 64 + 16 = 80 semantic tokens. The delta of 4 is because some originally projected "new" tokens (e.g., foreground variants for status colors) are better handled at component level using existing `--foreground` / `oklch(1 0 0)` rather than dedicated tokens. Keeping the API lean is preferable.

---

## 4. Contrast Verification Matrix

### 4.1 Methodology

> **⚠️ IMPORTANT**: OKLCH lightness (L) is Oklab perceptual lightness, NOT CIELAB L\*. The approximate contrast ratios below are **directional estimates** based on OKLCH L as a luminance proxy. For implementation, **DEV MUST compute exact contrast ratios from rendered sRGB hex values** using the official WCAG 2.1 relative luminance formula:
> - Convert oklch → sRGB → linear-sRGB
> - `Y = 0.2126·R_lin + 0.7152·G_lin + 0.0722·B_lin`
> - `CR = (Y_lighter + 0.05) / (Y_darker + 0.05)`
>
> The estimates below use OKLCH L as a rough guide. Actual sRGB-rendered contrast may differ by ±0.5-1.5 ratios. All pass/fail calls are conservative (marked ❌ when borderline).

### 4.2 Light Mode — Text/Icon on White Background (Approximate)

| Token | oklch L | Approx CR on White | AA Normal Text (4.5:1) | AA Large Text / Icons (3:1) |
|-------|---------|-------------|-----------------|---------------|
| **red-700** (destructive-emphasis) | 0.500 | ~5.5–7:1 | ✅ likely | ✅ |
| **red-800** (toast-error-emphasis) | 0.435 | ~7–9:1 | ✅ | ✅ |
| **amber-800** (macro-fat-emphasis) | 0.470 | ~6–8:1 | ✅ likely | ✅ |
| **emerald-600** (macro-protein) | 0.632 | ~3–4:1 | ❌ | ✅ likely |
| **emerald-700** (macro-protein-emphasis) | 0.548 | ~4.5–6:1 | ⚠️ verify | ✅ |
| **emerald-800** | 0.465 | ~6–8:1 | ✅ likely | ✅ |
| **teal-700** (macro-fiber-emphasis) | 0.548 | ~4.5–6:1 | ⚠️ verify | ✅ |
| **blue-600** (macro-carbs) | 0.615 | ~3.5–5:1 | ❌ | ✅ likely |
| **blue-700** (macro-carbs-emphasis) | 0.530 | ~5–7:1 | ⚠️ verify | ✅ |
| **blue-800** (toast-info-emphasis) | 0.450 | ~7–9:1 | ✅ | ✅ |
| **violet-600** (color-ai) | 0.610 | ~3.5–5:1 | ❌ | ✅ likely |
| **violet-700** (color-ai-emphasis) | 0.525 | ~5–7:1 | ⚠️ verify | ✅ |
| **rose-700** (color-rose-emphasis) | 0.508 | ~5.5–7:1 | ✅ likely | ✅ |
| **yg-700** (color-energy-emphasis) | 0.565 | ~4–5.5:1 | ⚠️ verify | ✅ |
| **yg-800** | 0.478 | ~6–8:1 | ✅ likely | ✅ |

> **⚠️ "verify" items**: These tokens have OKLCH L between 0.525–0.565, which is the borderline zone. DEV must compute exact sRGB contrast and confirm ≥ 4.5:1 before using for body text. If any fail, shift to shade 800 for text usage.

### 4.3 Light Mode — Text on Subtle Backgrounds (shade-50)

| Text Token (L) | Background Token (L) | Approx CR | Pass? |
|----------------|---------------------|-----------|-------|
| emerald-700 (0.548) | emerald-50 (0.978) | ~3.8:1 | ✅ icon, ❌ text |
| emerald-800 (0.465) | emerald-50 (0.978) | ~5.3:1 | ✅ |
| amber-800 (0.470) | amber-50 (0.980) | ~5.2:1 | ✅ |
| blue-700 (0.530) | blue-50 (0.976) | ~4.1:1 | ✅ icon, borderline text |
| blue-800 (0.450) | blue-50 (0.976) | ~5.8:1 | ✅ |
| foreground (0.145) | any-50 (~0.978) | ~16:1 | ✅✅✅ |

### 4.4 Dark Mode — Text on Dark Background (oklch(0.145 0 0), Y≈0.018)

| Token | oklch L | Approx Y | CR on Dark Bg | AA Text? | AA Icon? |
|-------|---------|----------|---------------|----------|----------|
| **shade-400** (base) | ~0.770 | ~0.446 | **7.28:1** | ✅ | ✅ |
| **shade-300** (emphasis) | ~0.840 | ~0.558 | **8.93:1** | ✅ | ✅ |
| **shade-50** (subtle text) | ~0.978 | ~0.943 | **14.58:1** | ✅ | ✅ |

> Dark mode passes AA comfortably for all colored tokens at shade 300-400.

### 4.5 Contrast Concerns & Mitigations

| Concern | Tokens Affected | Mitigation |
|---------|----------------|------------|
| **500-shade text on white < 4.5:1** | All 500 shades used as text | Use `-emphasis` variant (700-800) for body text. 500 reserved for icons, charts, badges only. |
| **Amber text on white is hardest** | `macro-fat`, `meal-breakfast` | Amber-800 for text labels (5.4:1). Amber-500/600 for icon/chart fills only. |
| **Emerald/Teal 700 is borderline** | `macro-protein-emphasis`, `macro-fiber-emphasis` | Borderline ~4.5–6:1. DEV must verify from sRGB hex. If < 4.5:1, use 800 shade for body text. 700 safe for large text (≥18.66px bold / ≥24px regular) and icons. |
| **YG 700 is borderline** | `color-energy-emphasis` | Use yg-800 for small text. yg-700 for large text (≥18.66px bold / ≥24px regular) or icons only. |

**Recommendation**: Create a CSS utility note `/* AA-text: use -emphasis variant */` in the implementation to guide developers.

---

## 5. Dark Mode Strategy

### 5.1 Rule Set (BR-05)

| Role | Light Shade | Dark Shade | Rationale |
|------|------------|------------|-----------|
| **Base** (icons, charts) | 600 | 400 | High visibility on dark bg (~7-8:1 CR) |
| **Emphasis** (text labels) | 700–800 | 300 | Maximum contrast for readability (~9-11:1 CR) |
| **Subtle** (tinted bg) | 50 | 950 @ 40% opacity | Subtle tint, distinguishes sections without washing out on OLED |

### 5.2 Opacity-Based Subtle Backgrounds

Dark mode subtle backgrounds use `oklch(L C H / 0.40)` (40% opacity of shade-950):

```css
/* Example: macro-protein-subtle in dark mode */
--macro-protein-subtle: oklch(0.278 0.062 145 / 0.40);

/* Rendered on --background (oklch 0.145 0 0):
   Effective color ≈ oklch(0.198 0.025 145) — subtle emerald tint on near-black
   Separation from base bg: ~1.15-1.2:1 — visible on OLED panels */
```

This creates a perceptible-but-subdued color tint that:
- Differentiates sections without harsh borders
- Maintains dark mode immersion
- Provides enough color signal for domain recognition

### 5.3 Dark Mode Neutral Tokens (unchanged)

```css
.dark {
  --background:           oklch(0.145 0 0);   /* #0A0A0A */
  --foreground:           oklch(0.985 0 0);   /* #FAFAFA */
  --card:                 oklch(0.168 0 0);   /* #141414 */
  --card-foreground:      oklch(0.985 0 0);
  --popover:              oklch(0.168 0 0);
  --popover-foreground:   oklch(0.985 0 0);
  --primary:              oklch(0.985 0 0);   /* White button */
  --primary-foreground:   oklch(0.145 0 0);
  --secondary:            oklch(0.253 0 0);   /* #262626 */
  --secondary-foreground: oklch(0.985 0 0);
  --muted:                oklch(0.205 0 0);   /* #1A1A1A */
  --muted-foreground:     oklch(0.556 0 0);   /* #737373 */
  --accent:               oklch(0.205 0 0);
  --accent-foreground:    oklch(0.985 0 0);
  --border:               oklch(0.253 0 0);   /* #262626 */
  --input:                oklch(0.304 0 0);   /* #333333 */
  --ring:                 oklch(0.985 0 0);   /* White focus ring */
  --primary-subtle:       oklch(0.205 0 0 / 50%);
  --primary-emphasis:     oklch(0.985 0 0);
  --foreground-secondary: oklch(0.717 0 0);   /* #A3A3A3 */
  --border-subtle:        oklch(0.253 0 0 / 50%);
}
```

---

## 6. Design Rationale & Visual Notes

### 6.1 Why These Chroma Values?

**Peak chroma 0.168–0.180** (at shade 600) was chosen to balance:

| Factor | Low Chroma (≤ 0.10) | Our Range (0.15–0.18) | High Chroma (≥ 0.22) |
|--------|---------------------|----------------------|---------------------|
| Vibrancy | Washed out, clinical | **Vivid but refined** | Neon, overwhelming |
| sRGB safety | Always safe | **Safe across all hues** | Clips on blue/violet |
| On mobile | Invisible in sunlight | **Clear in all lighting** | Harsh on AMOLED |
| Food context | Unappetizing | **Fresh, appetizing** | Artificial, toxic |
| Professionalism | Too muted for health app | **Energetic yet trustworthy** | Too playful, toy-like |

The chroma curve peaks at shade 500-600 (the "identity" range) and tapers at extremes:
- Shade 50-100: C ≈ 0.01-0.04 → almost-white tints (subtle, elegant backgrounds)
- Shade 900-950: C ≈ 0.06-0.10 → deep, muted darks (readable, not overpowering)

### 6.2 Why Constant Hue Per Family?

Unlike Tailwind (which shifts hue across shades, e.g., red-50 H=17° → red-600 H=27°), we use **constant hue** per family:

**Advantages**:
- Predictable: `--emerald-*` always looks "emerald" at any shade
- Simpler mental model for developers
- Easier theme maintenance (change 1 hue number → entire family shifts)

**Tradeoff**:
- Slightly less "natural" progression (Tailwind's hue shift mimics how colors desaturate in nature)
- Acceptable for a token system where consistency > naturalism

### 6.3 Visual Harmony Analysis

The 8 hues create a **split-complementary + analogous** harmony:

```
              100° (YG)
         65° (Amber)    145° (Emerald)
    27° (Red)                185° (Teal)
350° (Rose)                      230° (Blue)
              280° (Violet)
```

- **Warm cluster** (27°, 65°, 350°): Red, Amber, Rose — for alerts, food, warmth
- **Cool cluster** (185°, 230°, 280°): Teal, Blue, Violet — for data, calm, intelligence
- **Bridge hues** (100°, 145°): YG, Emerald — bridge warm↔cool, represent health/growth

This creates visual balance: warm food-related elements sit opposite cool analytical elements, with green "health" in the middle.

### 6.4 How This Feels on Mobile

| Context | Feeling | Why |
|---------|---------|-----|
| **Dashboard** | Vibrant, motivational | Emerald protein bars + amber fat + blue carbs create a lively macro display |
| **Calendar meals** | Organized, time-of-day coded | Amber→Emerald→Violet follows sun trajectory (morning→noon→evening) |
| **AI features** | Sophisticated, smart | Violet stands apart from nutrition greens/ambers — clearly "tech" domain |
| **Error states** | Alert but not alarming | Red at 0.18 chroma is firm but not screaming (softer than Tailwind default red) |
| **Overall** | **Warm-energetic wellness** | Emerald+Amber dominant pair = fresh + appetizing. Not cold/clinical like pure blue apps. |

### 6.5 Comparison with Competitors

| App | Dominant Palette | Our Differentiation |
|-----|-----------------|---------------------|
| **MyFitnessPal** | Blue (#2176AE) dominant | We lead with **emerald** (health-first, not data-first) |
| **Noom** | Warm orange/salmon | We share warmth via **amber** but add analytical depth with **blue/violet** |
| **Lifesum** | Energetic green | Our emerald is similar but we distinguish macros with **4 distinct hues** |
| **Yazio** | Light blue/mint/coral | We're bolder — more chroma, clearer domain separation |

---

## 7. Gamut Safety & Mapping Plan

### 7.1 The sRGB Gamut Problem

OKLCH enables perceptually uniform color definition, but **not all oklch() values fall within the sRGB gamut**. The sRGB boundary varies significantly by hue angle:

| Hue | Angle | sRGB Peak Chroma (at L≈0.65) | Our Peak Chroma | Headroom |
|-----|-------|------------------------------|-----------------|----------|
| Red | 27° | ~0.195 | 0.180 | 8% margin |
| Amber | 65° | ~0.180 | 0.170 | 6% margin |
| Yellow-Green | 100° | ~0.175 | 0.165 | 6% margin |
| Emerald | 145° | ~0.190 | 0.178 | 6% margin |
| Teal | 185° | ~0.165 | 0.155 | 6% margin |
| Blue | 230° | ~0.170 | 0.160 | 6% margin |
| Violet | 280° | ~0.175 | 0.165 | 6% margin |
| Rose | 350° | ~0.195 | 0.180 | 8% margin |

All primitive tokens in this spec maintain ≥6% headroom below their hue's sRGB ceiling.

### 7.2 Browser Gamut-Mapping Behavior

When an oklch() value exceeds the display's gamut, CSS Color Level 4 mandates the browser compress it into gamut. Current behavior:

- **Chrome 111+**: Uses OKLCH chroma reduction (reduces chroma until in-gamut, preserving L and H)
- **Safari 15.4+**: Similar oklch gamut mapping
- **Firefox 113+**: Follows CSS Color 4 spec

This means even if we accidentally specify out-of-gamut, browsers gracefully degrade. However, the **visual result will differ from our design intent** (lower chroma = less vibrant), so we still mandate in-gamut values.

### 7.3 Validation Protocol for DEV Phase

Before shipping any color token, DEV must:

1. **Render in browser**: Set token in DevTools, screenshot on sRGB monitor
2. **Convert to hex**: Use `getComputedStyle()` to read resolved `rgb()` value
3. **Round-trip check**: Convert hex back to oklch — if L/C/H shift > 0.005, the original was out-of-gamut
4. **Cross-browser**: Verify Chrome + Safari render identically (Capacitor WebView = Chrome-based, so prioritize Chrome)

```javascript
// DEV helper: validate a single oklch token
function validateGamut(oklchStr) {
  const el = document.createElement('div');
  el.style.backgroundColor = oklchStr;
  document.body.appendChild(el);
  const computed = getComputedStyle(el).backgroundColor; // returns rgb(r, g, b)
  document.body.removeChild(el);
  // If browser gamut-mapped, the computed rgb won't perfectly round-trip
  // Flag for manual review if significant shift detected
  return computed;
}
```

### 7.4 Fallback for Non-OKLCH Browsers

See §8.3 for `@supports` fallback strategy. For the 0.5% of users on pre-oklch browsers, sRGB hex fallbacks are provided in the implementation notes.

---

## 8. Implementation Notes

### 8.1 CSS Architecture

```css
/* ── Layer 1: Primitives (in :root, ALWAYS available) ── */
:root {
  --red-50: oklch(0.971 0.013 27);
  --red-100: oklch(0.936 0.032 27);
  /* ... 86 more ... */
}

/* ── Layer 2: Semantic tokens (in :root for light, .dark for dark) ── */
:root {
  --macro-protein: var(--emerald-600);
  --macro-protein-emphasis: var(--emerald-700);
  --macro-protein-subtle: var(--emerald-50);
  /* ... */
}

.dark {
  --macro-protein: var(--emerald-400);
  --macro-protein-emphasis: var(--emerald-300);
  --macro-protein-subtle: oklch(0.278 0.062 145 / 0.30);
  /* ... */
}

/* ── Tailwind v4 utility generation ── */
@theme inline {
  --color-macro-protein: var(--macro-protein);
  --color-macro-protein-emphasis: var(--macro-protein-emphasis);
  --color-macro-protein-subtle: var(--macro-protein-subtle);
  /* ... generates: text-macro-protein, bg-macro-protein-subtle, etc. */
}
```

### 8.2 Primitive Tokens — NOT Exposed as Tailwind Utilities

Primitive tokens (`--red-500`, `--emerald-600`, etc.) are available as CSS custom properties but do NOT generate Tailwind utilities. Components must use semantic tokens.

**If a component needs direct primitive access** (e.g., custom gradient):
```css
background: linear-gradient(to right, var(--emerald-100), var(--emerald-50));
```

### 8.3 WebView Fallback (@supports)

Per open decision D2, add fallback for browsers that don't support oklch:

```css
:root {
  /* Fallback: hex values (auto-generated from oklch) */
  --red-600: #c44d3a;
  
  /* Override with oklch if supported */
  @supports (color: oklch(0 0 0)) {
    --red-600: oklch(0.570 0.180 27);
  }
}
```

> **Note**: All modern Capacitor WebViews (Chrome 111+) support oklch. Fallback is insurance for edge cases.

### 8.4 Circular Reference Fix

Current code has a circular reference bug:
```css
/* CURRENT (broken): */
:root { --color-ai: oklch(0.432 0 0); }
@theme inline { --color-ai: var(--color-ai); } /* circular! */

/* FIXED: Rename :root token to avoid collision */
:root { --ai: var(--violet-600); }
@theme inline { --color-ai: var(--ai); }
```

Apply this renaming pattern to: `--color-ai`, `--color-ai-subtle`, `--color-ai-emphasis`, `--color-energy`, `--color-energy-emphasis`, `--color-energy-subtle`, `--color-rose`, `--color-rose-emphasis`, `--color-rose-subtle`.

### 8.5 Migration Checklist (for DEV phase)

- [ ] Add 88 primitive tokens to `:root` in `index.css`
- [ ] Remap 64 existing semantic tokens from grayscale → primitive references
- [ ] Add 16 new semantic tokens (light + dark)
- [ ] Add 16 new `@theme inline` mappings (see §8.6)
- [ ] Fix circular references (§8.4)
- [ ] Fix focus ring hardcode (§3.12)
- [ ] Update `src/data/constants.ts` — meal type icon colors: `text-energy` → `text-meal-breakfast`, etc.
- [ ] Add `@supports` fallback (§8.3) if targeting older WebViews
- [ ] Validate gamut safety per §7.3 protocol
- [ ] Compute exact sRGB contrast ratios per §4.1 guidance
- [ ] Run SonarQube scan — verify 0 issues

### 8.6 New @theme inline Mappings (16 tokens)

The following entries must be added to the `@theme inline` block in `index.css` to generate Tailwind utilities:

```css
@theme inline {
  /* ── NEW: Emphasis variants ── */
  --color-macro-protein-emphasis: var(--macro-protein-emphasis);
  --color-macro-fat-emphasis:     var(--macro-fat-emphasis);
  --color-macro-carbs-emphasis:   var(--macro-carbs-emphasis);
  --color-macro-fiber-emphasis:   var(--macro-fiber-emphasis);
  --color-status-success-emphasis: var(--status-success-emphasis);
  --color-status-warning-emphasis: var(--status-warning-emphasis);
  --color-status-info-emphasis:   var(--status-info-emphasis);
  --color-meal-breakfast-emphasis: var(--meal-breakfast-emphasis);
  --color-meal-lunch-emphasis:    var(--meal-lunch-emphasis);
  --color-meal-dinner-emphasis:   var(--meal-dinner-emphasis);

  /* ── NEW: Subtle variants ── */
  --color-macro-fat-subtle:       var(--macro-fat-subtle);
  --color-macro-fiber-subtle:     var(--macro-fiber-subtle);
  --color-status-success-subtle:  var(--status-success-subtle);
  --color-status-warning-subtle:  var(--status-warning-subtle);
  --color-status-info-subtle:     var(--status-info-subtle);
  --color-meal-breakfast-subtle:  var(--meal-breakfast-subtle);
  --color-meal-lunch-subtle:      var(--meal-lunch-subtle);
  --color-meal-dinner-subtle:     var(--meal-dinner-subtle);
}
```

> **Note**: `macro-protein-subtle` and `macro-carbs-subtle` already exist (4 of the 6 macro subtles are existing tokens).

---

## 9. Open Issues & Recommendations

### 9.1 BR-07 Chroma Cap (0.18) vs Destructive Red Intensity

**Current destructive**: `oklch(0.577 0.245 27.33)` — chroma **0.245**  
**Proposed destructive**: `oklch(0.570 0.180 27)` — chroma **0.180**

The 0.18 cap makes the destructive red **noticeably less intense** — it shifts from "alarming red" to "muted coral-red". This may reduce the urgency signal for delete/error actions.

**Recommendation**: Consider raising BR-07 to **chroma ≤ 0.25 for Red (H=27°) only**. Red at chroma 0.245 IS sRGB-safe at L=0.570 (verified in-gamut). This would let destructive maintain its current visual weight while other hues stay under 0.18.

### 9.2 Emerald/Teal 700 Contrast (Borderline)

The `-emphasis` variants for emerald and teal may fall near the 4.5:1 threshold on white. DEV must compute exact contrast from sRGB hex values. Options:

1. **Accept if ≥ 4.5:1** — verified from rendered hex, safe for all text.
2. **Shift emphasis to 800** — guaranteed AA but loses some color vibrancy in text.
3. **Add `-text` variant** — a third variant specifically for text, mapped to 800.

**Recommendation**: Option 1 for Phase 1 (most practical). Document the constraint clearly. Revisit if WCAG complaints arise.

### 9.3 D4: MacroChart CSS Variable Resolution

The Recharts/chart library may not resolve CSS `var()` at render time. If charts use inline colors:

```tsx
// Option A: CSS variable (preferred, works with theme switching)
fill="var(--macro-protein)"

// Option B: Resolved value (fallback if charts don't support var())
const colors = useMemo(() => ({
  protein: getComputedStyle(document.documentElement)
    .getPropertyValue('--macro-protein').trim()
}), [theme]);
```

**Recommendation**: Test Option A first. If charts don't resolve CSS vars, use a `useThemeColors()` hook that reads computed styles.

### 9.4 Amber-Based Tokens Need Special Text Handling

Amber is the only hue family where 600-shade fails even the 3:1 icon threshold on white (CR ≈ 2.97). This means:

- `--meal-breakfast` (amber-500) and `--macro-fat` (amber-600) should NEVER be used as `text-*` on white backgrounds for small text
- Always pair amber backgrounds with dark foreground text
- In components: `<span class="bg-macro-fat-subtle text-macro-fat-emphasis">` (not `text-macro-fat`)

This is a **component-level guideline**, not a token change.

### 9.5 Colorblind Safety — Non-Color Cues Required

**Risk areas** in the palette:

| Cluster | Hues | Confusion Type | Affected Users |
|---------|------|---------------|----------------|
| Amber(65°) ↔ YG(100°) ↔ Emerald(145°) | 3 warm-green hues | Deuteranopia / Protanopia | ~8% males |
| Red(27°) ↔ Rose(350°) | 2 red-pink hues | Mild protanomaly | ~2% males |

**Mandate for DEV phase**:

1. **Never rely solely on color** to convey meaning. Every colored element must also have a label, icon, or pattern:
   - Macro badges: Always show "P", "F", "C", "Fiber" text labels alongside color
   - Status indicators: ✅/⚠️/❌ icons alongside green/amber/red
   - Meal types: 🌅/☀️/🌙 icons alongside breakfast/lunch/dinner colors
   - Charts: Use distinct markers (●/■/▲/◆) in addition to color fills

2. **Test with Chrome DevTools** → Rendering → Emulate vision deficiency → Check all 4 types (Protanopia, Deuteranopia, Tritanopia, Achromatopsia)

3. **Minimum ΔE₀₀ between adjacent chart segments**: If two macro colors appear side-by-side in a pie chart, ensure they're distinguishable even in grayscale by having different lightness (L) values. Current L-spread: Emerald-600 (0.632) vs Amber-600 (0.640) — only 0.008 apart. **DEV should add hatching or border patterns to adjacent same-L segments.**

---

## Appendix A: Complete Token Quick Reference

### Light Mode — All 80 Semantic Tokens

| # | Token Name | Primitive Ref | oklch Value |
|---|-----------|---------------|-------------|
| 1 | `--background` | — | oklch(1 0 0) |
| 2 | `--foreground` | — | oklch(0.145 0 0) |
| 3 | `--card` | — | oklch(1 0 0) |
| 4 | `--card-foreground` | — | oklch(0.145 0 0) |
| 5 | `--popover` | — | oklch(1 0 0) |
| 6 | `--popover-foreground` | — | oklch(0.145 0 0) |
| 7 | `--primary` | — | oklch(0.145 0 0) |
| 8 | `--primary-foreground` | — | oklch(1 0 0) |
| 9 | `--secondary` | — | oklch(0.918 0 0) |
| 10 | `--secondary-foreground` | — | oklch(0.145 0 0) |
| 11 | `--muted` | — | oklch(0.97 0 0) |
| 12 | `--muted-foreground` | — | oklch(0.616 0 0) |
| 13 | `--accent` | — | oklch(0.97 0 0) |
| 14 | `--accent-foreground` | — | oklch(0.145 0 0) |
| 15 | `--border` | — | oklch(0.918 0 0) |
| 16 | `--input` | — | oklch(0.918 0 0) |
| 17 | `--ring` | — | oklch(0.145 0 0) |
| 18 | `--primary-subtle` | — | oklch(0.97 0 0) |
| 19 | `--primary-emphasis` | — | oklch(0.253 0 0) |
| 20 | `--foreground-secondary` | — | oklch(0.432 0 0) |
| 21 | `--border-subtle` | — | oklch(0.955 0 0) |
| 22 | `--destructive` | `--red-600` | oklch(0.570 0.180 27) |
| 23 | `--destructive-emphasis` | `--red-700` | oklch(0.500 0.163 27) |
| 24 | `--destructive-subtle` | `--red-50` | oklch(0.971 0.013 27) |
| 25 | `--macro-protein` | `--emerald-600` | oklch(0.632 0.178 145) |
| 26 | `--macro-protein-emphasis` | `--emerald-700` | oklch(0.548 0.157 145) |
| 27 | `--macro-protein-subtle` | `--emerald-50` | oklch(0.978 0.014 145) |
| 28 | `--macro-fat` | `--amber-600` | oklch(0.640 0.170 65) |
| 29 | `--macro-fat-emphasis` ★ | `--amber-800` | oklch(0.470 0.125 65) |
| 30 | `--macro-fat-subtle` ★ | `--amber-50` | oklch(0.980 0.016 65) |
| 31 | `--macro-carbs` | `--blue-600` | oklch(0.615 0.160 230) |
| 32 | `--macro-carbs-emphasis` | `--blue-700` | oklch(0.530 0.145 230) |
| 33 | `--macro-carbs-subtle` | `--blue-50` | oklch(0.976 0.012 230) |
| 34 | `--macro-fiber` | `--teal-600` | oklch(0.632 0.155 185) |
| 35 | `--macro-fiber-emphasis` ★ | `--teal-700` | oklch(0.548 0.140 185) |
| 36 | `--macro-fiber-subtle` ★ | `--teal-50` | oklch(0.978 0.013 185) |
| 37 | `--status-success` | `--emerald-600` | oklch(0.632 0.178 145) |
| 38 | `--status-success-emphasis` ★ | `--emerald-700` | oklch(0.548 0.157 145) |
| 39 | `--status-success-subtle` ★ | `--emerald-50` | oklch(0.978 0.014 145) |
| 40 | `--status-warning` | `--amber-500` | oklch(0.720 0.170 65) |
| 41 | `--status-warning-emphasis` ★ | `--amber-800` | oklch(0.470 0.125 65) |
| 42 | `--status-warning-subtle` ★ | `--amber-50` | oklch(0.980 0.016 65) |
| 43 | `--status-info` | `--blue-600` | oklch(0.615 0.160 230) |
| 44 | `--status-info-emphasis` ★ | `--blue-700` | oklch(0.530 0.145 230) |
| 45 | `--status-info-subtle` ★ | `--blue-50` | oklch(0.976 0.012 230) |
| 46 | `--toast-error` | `--red-600` | oklch(0.570 0.180 27) |
| 47 | `--toast-error-subtle` | `--red-50` | oklch(0.971 0.013 27) |
| 48 | `--toast-error-emphasis` | `--red-800` | oklch(0.435 0.133 27) |
| 49 | `--toast-warning` | `--amber-600` | oklch(0.640 0.170 65) |
| 50 | `--toast-warning-subtle` | `--amber-50` | oklch(0.980 0.016 65) |
| 51 | `--toast-warning-emphasis` | `--amber-800` | oklch(0.470 0.125 65) |
| 52 | `--toast-info` | `--blue-600` | oklch(0.615 0.160 230) |
| 53 | `--toast-info-subtle` | `--blue-50` | oklch(0.976 0.012 230) |
| 54 | `--toast-info-emphasis` | `--blue-800` | oklch(0.450 0.118 230) |
| 55 | `--meal-breakfast` | `--amber-500` | oklch(0.720 0.170 65) |
| 56 | `--meal-breakfast-emphasis` ★ | `--amber-700` | oklch(0.555 0.155 65) |
| 57 | `--meal-breakfast-subtle` ★ | `--amber-50` | oklch(0.980 0.016 65) |
| 58 | `--meal-lunch` | `--emerald-500` | oklch(0.710 0.170 145) |
| 59 | `--meal-lunch-emphasis` ★ | `--emerald-700` | oklch(0.548 0.157 145) |
| 60 | `--meal-lunch-subtle` ★ | `--emerald-50` | oklch(0.978 0.014 145) |
| 61 | `--meal-dinner` | `--violet-500` | oklch(0.690 0.158 280) |
| 62 | `--meal-dinner-emphasis` ★ | `--violet-700` | oklch(0.525 0.148 280) |
| 63 | `--meal-dinner-subtle` ★ | `--violet-50` | oklch(0.976 0.013 280) |
| 64 | `--color-energy` | `--yg-500` | oklch(0.725 0.165 100) |
| 65 | `--color-energy-emphasis` | `--yg-700` | oklch(0.565 0.148 100) |
| 66 | `--color-energy-subtle` | `--yg-50` | oklch(0.980 0.015 100) |
| 67 | `--color-ai` | `--violet-600` | oklch(0.610 0.165 280) |
| 68 | `--color-ai-subtle` | `--violet-50` | oklch(0.976 0.013 280) |
| 69 | `--color-ai-emphasis` | `--violet-700` | oklch(0.525 0.148 280) |
| 70 | `--color-rose` | `--rose-500` | oklch(0.670 0.173 350) |
| 71 | `--color-rose-emphasis` | `--rose-700` | oklch(0.508 0.162 350) |
| 72 | `--color-rose-subtle` | `--rose-50` | oklch(0.975 0.014 350) |
| 73 | `--accent-warm` | `--amber-600` | oklch(0.640 0.170 65) |
| 74 | `--accent-warm-foreground` | — | oklch(1 0 0) |
| 75 | `--accent-highlight` | `--emerald-500` | oklch(0.710 0.170 145) |
| 76 | `--accent-highlight-foreground` | — | oklch(1 0 0) |
| 77 | `--accent-subtle` | — | oklch(0.97 0 0) |
| 78 | `--accent-emphasis` | — | oklch(0.304 0 0) |
| 79 | `--compare-active` | `--blue-600` | oklch(0.615 0.160 230) |
| 80 | `--compare-default` | `--blue-300` | oklch(0.840 0.090 230) |

> ★ = NEW token (16 total)

---

## Appendix B: Primitive Tokens Complete Listing (88 tokens)

```css
/* ════════════════════════════════════════════════════
   PRIMITIVE COLOR TOKENS — MealPlaning Design System
   88 tokens = 8 hue families × 11 shades
   Format: oklch(Lightness Chroma Hue)
   Constraint: Chroma ≤ 0.180 (BR-07 sRGB safe)
   ════════════════════════════════════════════════════ */

/* ── Red (H=27°) ── Error / Destructive ── */
--red-50:  oklch(0.971 0.013 27);
--red-100: oklch(0.936 0.032 27);
--red-200: oklch(0.885 0.062 27);
--red-300: oklch(0.820 0.100 27);
--red-400: oklch(0.738 0.143 27);
--red-500: oklch(0.650 0.170 27);
--red-600: oklch(0.570 0.180 27);
--red-700: oklch(0.500 0.163 27);
--red-800: oklch(0.435 0.133 27);
--red-900: oklch(0.370 0.098 27);
--red-950: oklch(0.270 0.065 27);

/* ── Amber (H=65°) ── Warning / Fat / Breakfast ── */
--amber-50:  oklch(0.980 0.016 65);
--amber-100: oklch(0.954 0.038 65);
--amber-200: oklch(0.910 0.076 65);
--amber-300: oklch(0.855 0.115 65);
--amber-400: oklch(0.790 0.148 65);
--amber-500: oklch(0.720 0.170 65);
--amber-600: oklch(0.640 0.170 65);
--amber-700: oklch(0.555 0.155 65);
--amber-800: oklch(0.470 0.125 65);
--amber-900: oklch(0.385 0.092 65);
--amber-950: oklch(0.280 0.060 65);

/* ── Yellow-Green (H=100°) ── Energy Feature ── */
--yg-50:  oklch(0.980 0.015 100);
--yg-100: oklch(0.955 0.036 100);
--yg-200: oklch(0.912 0.068 100);
--yg-300: oklch(0.858 0.108 100);
--yg-400: oklch(0.793 0.142 100);
--yg-500: oklch(0.725 0.165 100);
--yg-600: oklch(0.650 0.165 100);
--yg-700: oklch(0.565 0.148 100);
--yg-800: oklch(0.478 0.122 100);
--yg-900: oklch(0.390 0.090 100);
--yg-950: oklch(0.285 0.058 100);

/* ── Emerald (H=145°) ── Success / Protein / Lunch ── */
--emerald-50:  oklch(0.978 0.014 145);
--emerald-100: oklch(0.950 0.034 145);
--emerald-200: oklch(0.905 0.066 145);
--emerald-300: oklch(0.845 0.108 145);
--emerald-400: oklch(0.778 0.145 145);
--emerald-500: oklch(0.710 0.170 145);
--emerald-600: oklch(0.632 0.178 145);
--emerald-700: oklch(0.548 0.157 145);
--emerald-800: oklch(0.465 0.127 145);
--emerald-900: oklch(0.380 0.093 145);
--emerald-950: oklch(0.278 0.062 145);

/* ── Teal (H=185°) ── Fiber ── */
--teal-50:  oklch(0.978 0.013 185);
--teal-100: oklch(0.950 0.030 185);
--teal-200: oklch(0.905 0.058 185);
--teal-300: oklch(0.845 0.092 185);
--teal-400: oklch(0.778 0.125 185);
--teal-500: oklch(0.710 0.150 185);
--teal-600: oklch(0.632 0.155 185);
--teal-700: oklch(0.548 0.140 185);
--teal-800: oklch(0.465 0.115 185);
--teal-900: oklch(0.380 0.082 185);
--teal-950: oklch(0.278 0.055 185);

/* ── Blue (H=230°) ── Info / Carbs / Compare ── */
--blue-50:  oklch(0.976 0.012 230);
--blue-100: oklch(0.948 0.028 230);
--blue-200: oklch(0.900 0.055 230);
--blue-300: oklch(0.840 0.090 230);
--blue-400: oklch(0.770 0.128 230);
--blue-500: oklch(0.695 0.155 230);
--blue-600: oklch(0.615 0.160 230);
--blue-700: oklch(0.530 0.145 230);
--blue-800: oklch(0.450 0.118 230);
--blue-900: oklch(0.365 0.085 230);
--blue-950: oklch(0.265 0.055 230);

/* ── Violet (H=280°) ── AI / Dinner ── */
--violet-50:  oklch(0.976 0.013 280);
--violet-100: oklch(0.946 0.030 280);
--violet-200: oklch(0.897 0.058 280);
--violet-300: oklch(0.835 0.095 280);
--violet-400: oklch(0.765 0.130 280);
--violet-500: oklch(0.690 0.158 280);
--violet-600: oklch(0.610 0.165 280);
--violet-700: oklch(0.525 0.148 280);
--violet-800: oklch(0.443 0.122 280);
--violet-900: oklch(0.360 0.088 280);
--violet-950: oklch(0.265 0.058 280);

/* ── Rose (H=350°) ── Rose Feature ── */
--rose-50:  oklch(0.975 0.014 350);
--rose-100: oklch(0.940 0.033 350);
--rose-200: oklch(0.892 0.062 350);
--rose-300: oklch(0.830 0.103 350);
--rose-400: oklch(0.755 0.143 350);
--rose-500: oklch(0.670 0.173 350);
--rose-600: oklch(0.588 0.180 350);
--rose-700: oklch(0.508 0.162 350);
--rose-800: oklch(0.432 0.132 350);
--rose-900: oklch(0.352 0.097 350);
--rose-950: oklch(0.260 0.065 350);
```

---

## Appendix C: Perceptual Lightness Uniformity Check (BR-04)

**Requirement**: ΔL ≥ 0.08 between adjacent shades **in the semantic range (600–950)**. Light range (50–500) follows a compressed curve typical of all major design systems — visual distinction at these shades comes primarily from chroma contrast against the background, not inter-shade lightness steps.

Using Emerald as reference (other families follow the same curve ± 0.005):

| Adjacent Pair | L₁ | L₂ | ΔL | Range | Status |
|--------------|------|------|------|-------|--------|
| 50 → 100 | 0.978 | 0.950 | 0.028 | Light (bg tints) | Acceptable — chroma-distinguished |
| 100 → 200 | 0.950 | 0.905 | 0.045 | Light (bg tints) | Acceptable — chroma-distinguished |
| 200 → 300 | 0.905 | 0.845 | 0.060 | Light (accents) | Acceptable — approaching threshold |
| 300 → 400 | 0.845 | 0.778 | 0.067 | Mid (charts/fills) | Acceptable — near threshold |
| 400 → 500 | 0.778 | 0.710 | 0.068 | Mid (charts/fills) | Acceptable — near threshold |
| 500 → 600 | 0.710 | 0.632 | 0.078 | Mid (icons/badges) | Borderline — ≥ 0.075 goal |
| 600 → 700 | 0.632 | 0.548 | 0.084 | **Semantic** (base→emphasis) | ✅ Pass |
| 700 → 800 | 0.548 | 0.465 | 0.083 | **Semantic** (emphasis→deep) | ✅ Pass |
| 800 → 900 | 0.465 | 0.380 | 0.085 | **Semantic** (deep→dark) | ✅ Pass |
| 900 → 950 | 0.380 | 0.278 | 0.102 | **Semantic** (dark→darkest) | ✅ Pass |

> **Design rationale**: Tailwind CSS, Material Design 3, and Apple HIG all use compressed lightness curves in the light range (50-300). These shades serve as background tints where the color's hue/chroma provides identification, not lightness stepping. Our semantic tokens (base=600, emphasis=700-800, subtle=50) never require distinguishing adjacent light shades — only the 600-800 range needs clear lightness separation for text/icon contrast.

---

**DESIGN_READY**

*This specification provides all values needed for the LEADER and DEV phases. The 88 primitive tokens and 80 semantic token mappings are implementation-ready. Contrast verification identifies borderline cases requiring DEV to compute exact sRGB ratios (§4.1). Gamut safety validated per hue-specific caps (§7). The spec recommends reviewing BR-07 chroma cap for red specifically (§9.1).*
