# Apple Design Migration — Design Spec

**Date:** 2026-05-17
**Status:** Draft (awaiting user approval)
**Author:** Brainstorming session
**Source of truth for visual system:** `DESIGN.md` (Apple-design-analysis, alpha)
**Approach:** Big Bang (single spec, single implementation plan)

---

## 1. Overview

Replace the existing "Sage Wellness v2.0" design system with a 1:1 adaptation of Apple's design language as documented in `DESIGN.md` at the repo root. The migration covers tokens, components, theme files, navigation, documentation, and CI guards in a single coordinated change.

The previous migration (Material Blue → Sage Wellness v2.0) is fully retired. After this migration, no Sage/Coral/Plum/warm-neutral tokens remain in the codebase.

### 1.1 Scope (in)

| Area | Current | After |
|---|---|---|
| Design tokens | `src/theme/variables.scss` — Sage `#6f8b6e` + Coral `#d97757` + warm neutrals | Apple — Action Blue `#0066cc` + parchment/white/pearl + ink `#1d1d1f` |
| Typography | System font, undefined ladder | Inter (woff2, embedded in `src/assets/fonts/`), ladder 300/400/600/700 (no 500) |
| Theme files | 8 files: `_section.scss`, `button-row.scss`, `form-field.scss`, `form-modal.scss`, `header-elevation.scss`, `list-card.scss`, `segment-control.scss`, `variables.scss` | All 8 deleted. 11 new files: `_typography.scss`, `_button.scss`, `_card.scss`, `_chip.scss`, `_field.scss`, `_search.scss`, `_tile.scss`, `_sticky-bar.scss`, `_tab-bar.scss`, `_nav-bar.scss`, `variables.scss` (rewritten). Net +3 files. |
| Form inputs | Floating-label `.input-wrapper > .input-label + .input-native` (4 HTML files) | Apple-field: label above, rectangular input (radius 8px), hairline border `#e0e0e0` |
| Navigation | Ionic bottom tabs (4 tabs) — UI for Tổng quan / Lịch ăn / Quản lý / Tập luyện | **Bottom tabs re-skinned to Apple visual (iOS HIG)** + new top `app-nav-bar` (44px, iOS UINavigationBar pattern). No hamburger drawer, no apple.com-style global-nav black bar. |
| CI guards | 7 guards | 12 entries (5 new + 1 retire + 2 update + 5 keep) |
| Docs | 6 markdown files in `docs/3-design/` (4141 lines) | All rewritten. `design-system.md` becomes v3.0 "Apple". New ADR documents the decision. |
| App pages | 43 HTML files in `src/app/features/**` | All re-skinned: pill CTAs, light-only surface alternation (parchment ↔ white ↔ pearl), single product drop-shadow used only on imagery. |
| `--ion-color-*` aliases | Heavy use | Removed. Only `--apple-*` tokens. Hard-fail on first appearance in app code. |
| Segment control | `<ion-segment>` used in app | Retired. Replaced by chip row (`apple-chip`). Guard forbids `<ion-segment>`. |

### 1.2 Scope (out)

- Data model (`docs/3-design/data-model.md`). DB schema is independent from visuals. Only a 1-line header note added.
- Repository / Signal store / Service layer code. Migration is visual only.
- Vietnamese labels (Tổng quan, Lịch ăn, Quản lý, Tập luyện) and macro naming (Protein/Carbs/Fat/Fiber) — invariants preserved.
- Database (SQLite, UUID v4, ISO 8601, snake_case). Untouched.
- Capacitor / Android build setup. Untouched.

### 1.3 Invariants preserved

- Light-only (no `prefers-color-scheme`, no theme switching, no dark tile surfaces).
- Vietnamese labels for all user-facing UI.
- Style 2025 naming (no `Component`/`Service`/`Pipe`/`Directive` suffix; no `.component.ts`/`.service.ts` file suffix).
- PC-1 binary: every `@Component` uses external `templateUrl` + `styleUrl`.
- All `color`/`background`/`background-color`/`font-size` declared via `var(--*)` tokens. Escape hatch `// allow-hardcode: <reason>` retained.
- Standalone Angular components, Signal stores, repository pattern.
- snake_case DB columns, camelCase TS, UUID v4, ISO 8601.
- Macro naming guard (`check-macro-naming.mjs`) unchanged.
- Status SSOT guard (`check-status-ssot.mjs`) unchanged.

### 1.4 Invariants changed

- `coding-conventions.md §8.6` (floating-label) — REPLACED by new §8.6 (Apple-field pattern).
- Story 2.6 "light-only" — clarified to also forbid dark tile surfaces (`surface-tile-1/2/3` from DESIGN.md), not just OS-driven theme switching.

---

## 2. Token Mapping

### 2.1 Colors — `src/theme/variables.scss`

All tokens are CSS custom properties under `:root {}`. No Sass map needed. Naming convention: `--apple-<category>-<name>`.

| `DESIGN.md` token | CSS variable | Value |
|---|---|---|
| `colors.primary` (Action Blue) | `--apple-primary` | `#0066cc` |
| `colors.primary-focus` | `--apple-primary-focus` | `#0071e3` |
| `colors.primary-on-dark` | `--apple-primary-on-dark` | `#2997ff` |
| `colors.ink` | `--apple-ink` | `#1d1d1f` |
| `colors.body` | (alias of `--apple-ink`) | `#1d1d1f` |
| `colors.body-on-dark` | `--apple-body-on-dark` | `#ffffff` |
| `colors.body-muted` | `--apple-body-muted` | `#cccccc` |
| `colors.ink-muted-80` | `--apple-ink-muted-80` | `#333333` |
| `colors.ink-muted-48` | `--apple-ink-muted-48` | `#7a7a7a` |
| `colors.divider-soft` | `--apple-divider-soft` | `#f0f0f0` |
| `colors.hairline` | `--apple-hairline` | `#e0e0e0` |
| `colors.canvas` | `--apple-canvas` | `#ffffff` |
| `colors.canvas-parchment` | `--apple-canvas-parchment` | `#f5f5f7` |
| `colors.surface-pearl` | `--apple-surface-pearl` | `#fafafc` |
| `colors.surface-chip-translucent` | `--apple-surface-chip` | `rgba(210, 210, 215, 0.64)` |
| `colors.surface-black` | `--apple-surface-black` | `#000000` |
| `colors.on-primary` | `--apple-on-primary` | `#ffffff` |
| `colors.on-dark` | `--apple-on-dark` | `#ffffff` |

**Dark surface tokens (`surface-tile-1/2/3`) are explicitly excluded** — bỏ dark tiles per user decision. `surface-black` is retained only for potential future use (currently no component uses it, but kept as a token for clarity).

**Semantic tokens (Apple-pure: blue / muted / red):**

| Semantic | CSS variable | Value | Reason |
|---|---|---|---|
| Success | `--apple-semantic-success` | `#0066cc` (Action Blue) | Apple does not have semantic green. Affirmative signals use the primary accent. |
| Warning | `--apple-semantic-warning` | `#333333` (ink-muted-80) | Apple does not have warning yellow. Warning indicated by icon + muted text only — no background fill. |
| Danger | `--apple-semantic-danger` | `#bf4800` | Apple system-alert red. Only exception to the single-accent rule, required for destructive actions (delete ingredient, cancel meal plan). |

**Retired (deleted from `variables.scss`):**
- All Coral CTA tokens (`#d97757` + scale).
- All Plum tertiary tokens (`#8a6a8c` + scale).
- All warm-neutral medium tokens (`#80776a` + scale).
- All Sage success/warning tokens (`#6f8b6e`, `#d9a857`).
- All `--ion-color-*` aliases. Code referencing `--ion-color-primary` etc. is rewritten to use `--apple-*` directly. The hard-fail guard is enabled on the same PR.

### 2.2 Typography — `src/theme/_typography.scss` (new)

Inter is bundled. Place woff2 files in `src/assets/fonts/`:
- `Inter-Light.woff2` (300)
- `Inter-Regular.woff2` (400)
- `Inter-SemiBold.woff2` (600)
- `Inter-Bold.woff2` (700)

**Weight 500 is forbidden.** Guard `check-no-weight-500.mjs` enforces this.

```scss
@font-face { font-family: 'Inter'; src: url('/assets/fonts/Inter-Light.woff2') format('woff2'); font-weight: 300; font-display: swap; }
@font-face { font-family: 'Inter'; src: url('/assets/fonts/Inter-Regular.woff2') format('woff2'); font-weight: 400; font-display: swap; }
@font-face { font-family: 'Inter'; src: url('/assets/fonts/Inter-SemiBold.woff2') format('woff2'); font-weight: 600; font-display: swap; }
@font-face { font-family: 'Inter'; src: url('/assets/fonts/Inter-Bold.woff2') format('woff2'); font-weight: 700; font-display: swap; }

:root {
  --apple-font-display: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  --apple-font-text: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}
```

15 typography tokens map 1:1 from `DESIGN.md §Typography`:

| Token | Size | Weight | Line | Tracking | Use |
|---|---|---|---|---|---|
| `--apple-type-hero-display` | 56px (28px ≤419) | 600 | 1.07 | -0.28px | Hero headlines on onboarding, dashboard hero |
| `--apple-type-display-lg` | 40px (28px ≤419) | 600 | 1.10 | 0 | Section headlines |
| `--apple-type-display-md` | 34px | 600 | 1.47 | -0.374px | Sub-section headlines |
| `--apple-type-lead` | 28px | 400 | 1.14 | 0.196px | Page leads |
| `--apple-type-lead-airy` | 24px | 300 | 1.5 | 0 | Airy body leads (rare) |
| `--apple-type-tagline` | 21px | 600 | 1.19 | 0.231px | Card titles, nav-bar large title |
| `--apple-type-body-strong` | 17px | 600 | 1.24 | -0.374px | Inline emphasis |
| `--apple-type-body` | 17px | 400 | 1.44 (Inter-adjusted) | -0.374px | Default paragraph, input text |
| `--apple-type-dense-link` | 17px | 400 | 2.41 | 0 | Settings link list |
| `--apple-type-caption` | 14px | 400 | 1.43 | -0.224px | Field hints, helper text |
| `--apple-type-caption-strong` | 14px | 600 | 1.29 | -0.224px | Field labels |
| `--apple-type-button-large` | 18px | 300 | 1.0 | 0 | Hero CTAs (rare) |
| `--apple-type-button-utility` | 14px | 400 | 1.29 | -0.224px | Utility button labels |
| `--apple-type-fine-print` | 12px | 400 | 1.0 | -0.12px | Footer fine-print |
| `--apple-type-micro-legal` | 10px | 400 | 1.3 | -0.08px | Legal disclaimers |
| `--apple-type-nav-link` | 12px | 400 | 1.0 | -0.12px | Tab bar labels |

**Inter substitution adjustments** (DESIGN.md §Note on Font Substitutes):
- All display sizes ≥ 17px: `letter-spacing` already tightened in the token table above (Inter runs wider than SF Pro).
- Body line-height: `1.44` instead of `1.47` (Inter has taller x-height).
- Body `font-feature-settings: "ss03"` for rounded "a".

Each token is exposed as a single shorthand CSS variable usable as `font: var(--apple-type-body)`, plus split variables (`--apple-type-body-size`, `--apple-type-body-weight`, etc.) for granular use.

### 2.3 Spacing

| Token | Value | Notes |
|---|---|---|
| `--apple-space-xxs` | `4px` | |
| `--apple-space-xs` | `8px` | |
| `--apple-space-sm` | `12px` | |
| `--apple-space-md` | `17px` | |
| `--apple-space-lg` | `24px` | Card padding, gap between form fields |
| `--apple-space-xl` | `32px` | |
| `--apple-space-xxl` | `48px` | |
| `--apple-space-section` | `80px` desktop / `48px` ≤833 / `32px` ≤640 / `24px` ≤419 | Vertical padding inside full-bleed tile (responsive) |

### 2.4 Radius

| Token | Value | Use |
|---|---|---|
| `--apple-radius-none` | `0` | Full-bleed tiles (rare on mobile) |
| `--apple-radius-xs` | `5px` | Inline subtle chips |
| `--apple-radius-sm` | `8px` | Form inputs (`apple-field__input`), dark utility buttons, inline image |
| `--apple-radius-md` | `11px` | Pearl button capsule |
| `--apple-radius-lg` | `18px` | List cards (`apple-card`) |
| `--apple-radius-pill` | `9999px` | Primary CTAs, search input, configurator chip |
| `--apple-radius-full` | `9999px` | Circular icon button 44px |

### 2.5 Elevation

```scss
:root {
  --apple-shadow-product: 3px 5px 30px 0 rgba(0, 0, 0, 0.22);
  --apple-shadow-none: none;
}
```

**Only one drop-shadow exists in the system**, applied exclusively to photographic imagery (ingredient thumbnails, meal photos, onboarding illustrations). All card / button / text shadows are removed. Guard `check-no-box-shadow.mjs` enforces this — only `var(--apple-shadow-product)` references are allowed.

### 2.6 Backdrop blur (sticky bar only)

```scss
:root {
  --apple-backdrop-blur: saturate(180%) blur(20px);
  --apple-frosted-bg: rgba(245, 245, 247, 0.8); // canvas-parchment @ 80%
}
```

Used by `apple-sticky-bar` (bottom-floating "Tổng calo trong ngày" on Calendar tab, "Tổng dinh dưỡng" on meal edit).

---

## 3. Component Mapping

### 3.1 Navigation (iOS HIG)

**Decision rationale:** `DESIGN.md` describes apple.com (a marketing website). For a mobile app, Apple's actual mobile pattern is iOS Human Interface Guidelines, which mandates bottom Tab Bar for top-level destinations. The web `global-nav` black bar and frosted `sub-nav` from `DESIGN.md` are web patterns and are **not** adopted.

| Component | File | Description |
|---|---|---|
| `apple-tab-bar` | `_tab-bar.scss` (new) | Bottom Tab Bar, 49px height (iOS standard). Background `--apple-canvas`. Border-top `1px solid var(--apple-hairline)`. Active tab: icon + label `--apple-primary`. Inactive: `--apple-ink-muted-48`. Icon style: line/outline (not filled). Label typography `--apple-type-nav-link`. Re-skin of existing `<ion-tab-bar>`. |
| `apple-nav-bar` | `_nav-bar.scss` (new) | Top navigation bar, 44px height (iOS UINavigationBar standard). Background `--apple-canvas`. Border-bottom `1px solid var(--apple-divider-soft)`. Three slots: leading (back button or title), center (page title — `tagline` 21px/600), trailing (actions). Uses Ionic `<ion-header>` + `<ion-toolbar>` re-skinned. |
| Large title (per-page opt-in) | (within `_nav-bar.scss`) | On tab roots (Tổng quan, Lịch ăn, Quản lý, Tập luyện), large title is **always enabled**. On secondary pages (e.g., ingredient-edit, meal-edit), large title is **always disabled** (standard 44px nav bar only). Implementation: pass `largeTitle: boolean` prop to the wrapping page component; the spec for each page in `docs/3-design/ux-specs/` declares this prop. When enabled and scroll position is 0, page title renders as `--apple-type-display-md` (34px/600/-0.374px). On scroll, large title collapses into the 44px nav bar via Ionic `<ion-title size="large">`. |
| ~~Hamburger drawer~~ | — | NOT adopted. iOS HIG forbids hamburger for top-level destinations. |
| ~~`global-nav` black 44px~~ | — | NOT adopted. Web-only pattern. |
| ~~`sub-nav-frosted`~~ | — | NOT adopted. Web-only pattern. The Apple frosted-glass concept survives only on `apple-sticky-bar` (bottom). |

### 3.2 Buttons — `_button.scss`

| Class | DESIGN.md component | Use |
|---|---|---|
| `.apple-btn--primary` | `button-primary` | All primary CTAs (Lưu, Thêm, Buy). Background `--apple-primary`, text `--apple-on-primary`, `--apple-type-body`, radius `--apple-radius-pill`, padding 11px × 22px. |
| `.apple-btn--secondary` | `button-secondary-pill` | Ghost pill for "Hủy", "Quay lại". Transparent background, text `--apple-primary`, 1px solid `--apple-primary` border, radius pill. |
| `.apple-btn--dark-utility` | `button-dark-utility` | Compact rectangular utility. Background `--apple-ink`, text `--apple-on-dark`, `--apple-type-button-utility`, radius `--apple-radius-sm`, padding 8 × 15. |
| `.apple-btn--pearl` | `button-pearl-capsule` | Soft secondary. Background `--apple-surface-pearl`, text `--apple-ink-muted-80`, `--apple-type-caption`, radius `--apple-radius-md`, padding 8 × 14, 3px solid `--apple-divider-soft` ring. |
| `.apple-btn--hero` | `button-store-hero` | Large CTA for onboarding hero. `--apple-type-button-large` (18px / 300 — rare weight), radius pill, padding 14 × 28. |
| `.apple-btn--icon-circular` | `button-icon-circular` | 44 × 44 circle. Background `--apple-surface-chip`, icon `--apple-ink`, radius `--apple-radius-full`. Floats over imagery. |

Active state on all buttons: `transform: scale(0.95)`. Focus state: `outline: 2px solid var(--apple-primary-focus)`.

### 3.3 Cards & Containers

| Class | DESIGN.md component | Use | File |
|---|---|---|---|
| `.apple-tile--light` | `product-tile-light` | Hero sections on Dashboard, Settings root | `_tile.scss` |
| `.apple-tile--parchment` | `product-tile-parchment` | Section breaks between two white sections | `_tile.scss` |
| `.apple-card` | `store-utility-card` | List cards: ingredient list, meal list, calendar event, exercise. Background `--apple-canvas`, 1px solid `--apple-hairline`, radius `--apple-radius-lg` (18px), padding `--apple-space-lg`. Inner image radius `--apple-radius-sm`. Product photo (if present) gets `--apple-shadow-product`. | `_card.scss` |
| `.apple-chip` | `configurator-option-chip` | Filter chips, unit selector (g/ml/cái), segment-control replacement. Background `--apple-canvas`, text `--apple-ink`, `--apple-type-caption`, radius pill, padding 12 × 16. | `_chip.scss` |
| `.apple-chip--selected` | `configurator-option-chip-selected` | Selected state: 2px solid `--apple-primary-focus` border. | `_chip.scss` |
| `.apple-sticky-bar` | `floating-sticky-bar` | Bottom-floating frosted bar: "Tổng calo trong ngày" (Calendar), "Tổng dinh dưỡng" (meal edit). Background `--apple-frosted-bg`, `backdrop-filter: var(--apple-backdrop-blur)`, height 64px, padding 12 × 32. Sits above the tab bar with 8px gap. | `_sticky-bar.scss` |

### 3.4 Form inputs — `_field.scss`

**Canonical pattern (replaces floating-label):**

```html
<div class="apple-field" [class.apple-field--error]="hasError">
  <label class="apple-field__label" for="ing-name">Tên nguyên liệu</label>
  <input class="apple-field__input" id="ing-name" type="text" />
  <p class="apple-field__hint" *ngIf="!hasError">Tối đa 80 ký tự</p>
  <p class="apple-field__error" *ngIf="hasError">Bắt buộc nhập</p>
</div>
```

```scss
.apple-field {
  display: flex;
  flex-direction: column;
  gap: var(--apple-space-xs); // 8px
  margin-bottom: var(--apple-space-lg); // 24px between fields
}

.apple-field__label {
  font: var(--apple-type-caption-strong); // 14px / 600
  color: var(--apple-ink);
}

.apple-field__input {
  font: var(--apple-type-body); // 17px / 400 / -0.374px
  color: var(--apple-ink);
  background: var(--apple-canvas);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-radius-sm); // 8px
  padding: 12px 16px;
  height: 44px; // iOS touch target
  outline: none;

  &:focus {
    border-color: var(--apple-primary);
    outline: 2px solid var(--apple-primary-focus);
    outline-offset: -1px;
  }
}

.apple-field--error .apple-field__input {
  border-color: var(--apple-semantic-danger);
}

.apple-field__hint { font: var(--apple-type-caption); color: var(--apple-ink-muted-48); }
.apple-field__error { font: var(--apple-type-caption); color: var(--apple-semantic-danger); }
```

**Picker / select trigger:**

```html
<button class="apple-field__picker" type="button">
  <span class="apple-field__picker-value">100 g</span>
  <ion-icon name="chevron-down"></ion-icon>
</button>
```

Same visual as `.apple-field__input`, with right-aligned chevron.

**Search input — `_search.scss`:**

```html
<div class="apple-search">
  <ion-icon name="search-outline" class="apple-search__icon"></ion-icon>
  <input class="apple-search__input" type="search" placeholder="Tìm nguyên liệu..." />
</div>
```

Pill-shaped (radius `--apple-radius-pill`), height 44px, padding 12 × 20, leading icon 14px, muted tint.

### 3.5 Segment control replacement

`<ion-segment>` is forbidden. Replace all usages with a chip row:

```html
<div class="apple-chip-row" role="tablist">
  <button class="apple-chip" [class.apple-chip--selected]="view === 'day'" (click)="view = 'day'">Ngày</button>
  <button class="apple-chip" [class.apple-chip--selected]="view === 'week'" (click)="view = 'week'">Tuần</button>
  <button class="apple-chip" [class.apple-chip--selected]="view === 'month'" (click)="view = 'month'">Tháng</button>
</div>
```

### 3.6 Footer (Settings page only)

Settings root page gains a footer-like bottom section: background `--apple-canvas-parchment`, padding 64px vertical. Link list uses `--apple-type-dense-link` (17px / 400 / line-height 2.41). Legal row uses `--apple-type-fine-print` (12px / `--apple-ink-muted-48`). No global footer on other pages.

---

## 4. Documentation Rewrite

### 4.1 `docs/3-design/design-system.md` — v3.0 "Apple"

Full rewrite. ~1500–1700 lines. Structure:

| § | Title | Notes |
|---|---|---|
| 1 | Overview & philosophy | Apple-for-mobile-app adaptation. Card-first (not photography-first). Single accent rule. |
| 2 | Color palette | 18 Apple tokens + 3 semantic. Light-only invariant. No gradients. |
| 3 | Decorative depth | Single `--apple-shadow-product`. Surface color change as divider. Backdrop blur for sticky bar only. |
| 4 | Shapes | Radius scale 0/5/8/11/18/9999. Pill as signature CTA. |
| 5 | Spacing | 4/8/12/17/24/32/48/80. Responsive section scale. |
| 6 | Typography | Inter ladder 300/400/600/700. No 500. Body 17px invariant. Display tracking rules. Inter substitution adjustments. |
| 7 | Components | Navigation (iOS HIG: tab bar + nav bar). Buttons (6 variants). Cards (`apple-card`, `apple-tile`, `apple-sticky-bar`). Forms (`apple-field`, `apple-search`, chip row). Settings footer. |
| 8 | Form inputs (mandatory) | Replaces previous §8.6. Apple-field canonical pattern. Markup, scss, do/don't. |
| 9 | Do's and Don'ts | Adapted from DESIGN.md. App-specific additions: no segment control, no dark tile surfaces, no hamburger, no apple.com global-nav. |
| 10 | Responsive behavior | App breakpoints: 360 / 375 / 414 / 640 / 834 / 1024. Hero typography scaling. Tab bar persistence. |
| 11 | Migration mapping (Sage → Apple) | Side-by-side table. Aids reading legacy commits. |
| 12 | Macro naming | Preserved from previous design system (Protein/Carbs/Fat/Fiber). |

### 4.2 `docs/3-design/data-model.md`

Untouched except for one header note: data model is independent from visual system. Reference latest design system version.

### 4.3 `docs/3-design/ux-specs/f-03-calendar-plan.md` & `f-04-nutrition-tracking.md`

Full rewrite (~300–500 lines each). Template:
- Goal & user value
- Navigation entry (tab bar tab + nav bar title)
- Page structure (`apple-nav-bar` → content sections → optional `apple-sticky-bar` → `apple-tab-bar`)
- Component inventory (which Apple components, where)
- Empty / loading / error states using Apple grammar
- Edge cases

### 4.4 `docs/3-design/explorations/README.md` & `docs/3-design/mockups/README.md`

Short rewrite (~80–120 lines each). Folder purpose, naming convention, point to design-system v3.0 as SSOT.

### 4.5 `docs/4-architecture/coding-conventions.md`

| § | Change |
|---|---|
| §1 Style 2025 naming | Unchanged |
| §2.2 PC-1 external templates | Unchanged |
| §8.6 Form inputs | **REPLACED**: floating-label retired, Apple-field is canonical |
| §N Design tokens (new) | All `color`/`background`/`background-color`/`font-size` use `var(--apple-*)`. `var(--ion-color-*)` references are hard-failed. Escape hatch `// allow-hardcode: <reason>` retained. |
| §N Typography (new) | Inter ladder 300/400/600/700. Weight 500 forbidden. Body always 17px. Display sizes carry tracking adjustments. |
| §N Navigation (new) | Bottom `<ion-tab-bar>` allowed but must apply `.apple-tab-bar` styles. Top `<ion-header>` uses `.apple-nav-bar`. No alternative nav containers. |

### 4.6 New ADR — `docs/4-architecture/decisions/ADR-NNN-apple-design-migration.md`

> **Implementation step prerequisite:** Before writing the ADR, list `ls docs/4-architecture/decisions/` and pick the next sequential ADR number. Replace `NNN` in the filename.

~200 lines. Sections:
- Context: previous Sage Wellness v2.0 migration (after Material Blue → Sage). User directive on 2026-05-17 to adopt Apple 1:1.
- Decision: Big Bang migration to Apple design language per `DESIGN.md`.
- Navigation clarification: iOS HIG (bottom tabs + top nav bar), not apple.com web nav.
- Consequences:
  - Removed: Sage / Coral / Plum colors; warm neutrals; floating-label inputs; segment controls; dark tile surfaces; box-shadow on UI chrome; weight-500 typography; `--ion-color-*` aliases.
  - Added: Action Blue single accent; Inter font (4 weights, ~280 KB woff2 in `src/assets/fonts/`); Apple-field; chip row; `apple-card`; `apple-sticky-bar`; `apple-nav-bar`; `apple-tab-bar` re-skin.
  - Trade-offs: APK size +~280 KB. Visual change is large; users will see fundamentally different palette and typography.
- Alternatives considered:
  - Phased migration (rejected — user chose Big Bang).
  - Theme-only (rejected — does not satisfy "1:1").
  - apple.com-style nav with hamburger drawer (rejected after learning iOS HIG mandates Tab Bar).
- Status: Accepted 2026-05-17.

### 4.7 `CLAUDE.md` updates

Update these blocks:
- "Form Inputs (MANDATORY)" — replace with Apple-field markup + reference `_field.scss`.
- "Design Tokens (MANDATORY)" — reference `var(--apple-*)`. `var(--ion-color-*)` forbidden.
- "Architecture Guards (CI-enforced)" — update table (Section 5 of this spec).
- Remove all mention of "Sage Wellness", "Lifesum", and "Coral CTA".

---

## 5. CI Guards

| Guard script | Status | Detail |
|---|---|---|
| `check-form-input-pattern.mjs` | **RETIRE** | Floating-label no longer canonical. Remove from `package.json` and Husky pre-commit. Delete file. |
| `check-apple-input-pattern.mjs` | **NEW** | Enforce `.apple-field > .apple-field__label + .apple-field__input` markup. Forbid `.input-wrapper`, `.input-label`, `.input-native`, `.picker-trigger--floating`. Forbid inline input styles in `.ts` files. |
| `check-pc1-external-templates.mjs` | **KEEP** | Unchanged. Every `@Component` uses external `templateUrl` + `styleUrl`. |
| `check-style-2025-naming.mjs` | **KEEP** | Unchanged. |
| `check-design-tokens.mjs` | **UPDATE** | Allowlist: `var(--apple-*)`. Hard-fail on `var(--ion-color-*)` outside of `variables.scss` itself. Raw hex / rgb / rgba / hsl / named colors / `<n>px` font-size still forbidden. Escape hatch `// allow-hardcode: <reason>` retained. |
| `check-macro-naming.mjs` | **KEEP** | Unchanged (Protein/Carbs/Fat/Fiber, no abbrev). |
| `check-status-ssot.mjs` | **KEEP** | Unchanged. |
| `check-no-dark-mode.mjs` | **STRENGTHEN** | Add forbidden patterns: `surface-tile-1`, `surface-tile-2`, `surface-tile-3`, `dark-tile`, `product-tile-dark`, `apple-tile--dark`. Keep existing rules. |
| `check-no-segment-control.mjs` | **NEW** | Forbid `<ion-segment>` and `<ion-segment-button>` in `src/**/*.html`. Suggest `apple-chip-row`. |
| `check-tab-bar-pattern.mjs` | **NEW** | If `<ion-tab-bar>` appears in any HTML, validate that the same template's parent `<ion-tabs>` element carries the literal class `apple-tab-bar`. Static check on HTML AST. Fail if `<ion-tab-bar>` exists without `class="apple-tab-bar"` on the enclosing `<ion-tabs>`. |
| `check-no-box-shadow.mjs` | **NEW** | Forbid `box-shadow:` in `src/**/*.{scss,css}` except `box-shadow: var(--apple-shadow-product)`. Escape `// allow-shadow: <reason>` permitted. |
| `check-no-weight-500.mjs` | **NEW** | Forbid `font-weight: 500` (or `font: ... 500 ...`) in `src/**/*.{scss,css}`. Inter ladder is 300/400/600/700. |
| `check-inter-font.mjs` | **NEW** | Verify `@font-face` for Inter in `_typography.scss` references the 4 woff2 files. Verify the woff2 files exist in `src/assets/fonts/`. |

Aggregate runner `npm run check:guards` invokes all guards. Husky pre-commit runs all guards. GitHub Actions runs on `push` and `pull_request`.

---

## 6. App Page Re-skin Inventory

All 43 HTML files in `src/app/features/**` need re-skinning. Grouping for plan-level breakdown:

| Tab/page area | Folders | Re-skin notes |
|---|---|---|
| Tabs wrapper | `src/app/tabs/` | Re-skin `<ion-tab-bar>` to `.apple-tab-bar`. Update icons to outline style. Active color `--apple-primary`. |
| Dashboard (Tổng quan) | `features/dashboard/` | Hero section uses `.apple-tile--light`. Cards become `.apple-card`. KPI numbers use `--apple-type-display-lg`. Action buttons pill primary. |
| Calendar (Lịch ăn) | `features/calendar/` | Top `.apple-nav-bar` with view chip-row (Ngày/Tuần/Tháng) under nav bar. Event cards `.apple-card`. Bottom `.apple-sticky-bar` for daily total. |
| Management (Quản lý) | `features/management/` (ingredient list, ingredient edit, meal list, meal edit) | List page: search uses `.apple-search`. Filter chips use `.apple-chip`. Items use `.apple-card`. Edit page: forms use `.apple-field`. FAB → `.apple-btn--icon-circular` or pill primary. |
| Fitness (Tập luyện) | `features/fitness/` | Exercise cards `.apple-card`. Add/edit forms `.apple-field`. Timer / metrics in tile layout. |
| Settings | `features/settings/` | Settings list uses `.apple-type-dense-link` (17px / 2.41). Footer-like bottom section parchment background. Toggle re-skin per `_button.scss` patterns. |
| Onboarding | `features/onboarding/` | Each step a `.apple-tile--parchment` or `--light`. Hero CTA `.apple-btn--hero` (18px / 300). Step indicator dots use `--apple-primary` / `--apple-hairline`. |

`shared/components/` re-skinned proportionally as encountered.

---

## 7. Risks & Trade-offs

| Risk | Severity | Mitigation |
|---|---|---|
| Big Bang PR is large and hard to review | High | Even though approach is Big Bang, implementation plan (writing-plans step) MUST break work into ordered steps with intermediate validation. Each step buildable. |
| Inter `~280 KB` adds APK size | Low | Use woff2 (compressed). Subset to Latin + Vietnamese if needed in a later optimization. |
| `--ion-color-*` hard-fail breaks unrelated code in the same PR | High | Migration completes all `--ion-color-*` references before enabling the guard. Single PR contains both removal and guard activation. |
| Segment control retirement disrupts existing UX (e.g., Calendar view switcher) | Medium | Chip row is a direct functional replacement. UX spec rewrites document each replacement. |
| User confusion: visual change is drastic (Sage green → Apple blue) | Medium | Acceptable per user directive. Splash screen / release note should explain. |
| Apple-field markup change requires touching all 4 floating-label HTMLs in one go | Low | Only 4 files. |
| Tab bar re-skin may conflict with Ionic's internal CSS variables | Low–Medium | Ionic 8 tab bar styling uses documented CSS variables. Override in `_tab-bar.scss`. Test on Android device early. |
| Removing semantic green/yellow weakens UX signal for save/warning | Medium | Validated decision: single-accent is the Apple Do's rule. Toast / alert UX uses copy + icon prominence to compensate. |

---

## 8. Out of Scope (explicit)

- DB migrations.
- Backend / SQLite schema changes.
- Capacitor plugin changes.
- Accessibility audit beyond what existing guards already enforce.
- Animation library introduction (no Lottie, no Framer Motion).
- Localization beyond Vietnamese (Vietnamese remains the only locale).
- Performance profiling beyond build size deltas from Inter inclusion.

---

## 9. Acceptance Criteria

After all implementation steps complete:

1. `npm run build` succeeds with no warnings from any guard.
2. `npm run check:guards` exits 0.
3. `grep -r "ion-color-" src/app` returns no matches (only allowed in `variables.scss` if at all).
4. `grep -r "Sage\|Coral\|Plum" docs/3-design src/theme` returns no matches.
5. `grep -r "box-shadow" src/**/*.scss src/**/*.css | grep -v "apple-shadow-product\|allow-shadow"` returns no matches.
6. All 6 markdown files in `docs/3-design/` reflect Apple design system v3.0.
7. New ADR `ADR-NNN-apple-design-migration.md` is committed (NNN resolved at implementation time).
8. `CLAUDE.md` mentions only Apple tokens and patterns.
9. The 4 Ionic tabs render with `.apple-tab-bar` re-skin (Action Blue active, outline icons, 49px height).
10. At least one page on each tab uses `.apple-nav-bar` with large title scroll behavior.
11. The `ingredient-edit` page (already open in IDE) uses the `.apple-field` pattern end-to-end.
12. Inter font loads on cold start (verified via Capacitor Android run).

---

## 10. Implementation Note

This is a design spec only. No code has been written. The next step (per the brainstorming skill flow) is to invoke `superpowers:writing-plans` to produce an ordered implementation plan with concrete file-level steps.

Because the user selected the Big Bang approach, the resulting plan will be long. The plan writer should still produce a logically ordered sequence (foundation tokens → component scss → guard updates → page re-skin → doc rewrites) so that intermediate states remain buildable.
