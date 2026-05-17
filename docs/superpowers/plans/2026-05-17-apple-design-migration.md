# Apple Design Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the entire visual system of HealthMate AI (currently Sage Wellness v2.0) with a 1:1 adaptation of Apple's design language as documented in `DESIGN.md`, in a single coordinated Big Bang migration that leaves the build green at every intermediate commit.

**Architecture:** Foundation-first ordering. (1) Land Apple tokens + Inter font alongside legacy Sage tokens so nothing breaks. (2) Land new theme component SCSS. (3) Land all four new guards as **soft-warn** mode so page re-skin commits don't get blocked. (4) Re-skin pages tab-by-tab. (5) Once zero `--ion-color-*` references remain, flip `check-design-tokens` to hard-fail and flip the four soft-warn guards to hard-fail in the same PR. (6) Delete legacy theme files. (7) Rewrite docs. Every phase ends with `npm run build` green and a commit.

**Tech Stack:** Angular 21 standalone components, Ionic 8, SCSS, Inter (woff2 embedded in `src/assets/fonts/`), Node guards under `scripts/check-*.mjs`, Husky pre-commit, GitHub Actions.

**Source spec:** `docs/superpowers/specs/2026-05-17-apple-design-migration-design.md`

---

## Phase ordering at a glance

| Phase | Output | Build green at end? |
|---|---|---|
| 0 | Worktree + Inter woff2 assets + scratch test | yes |
| 1 | `variables.scss` rewritten with Apple tokens + legacy Sage tokens kept as alias | yes |
| 2 | `_typography.scss` + Inter `@font-face` loaded globally | yes |
| 3 | 9 new theme component SCSS files (`_button` … `_nav-bar`) — defined but not yet consumed | yes |
| 4 | 4 new guards added in **soft-warn** mode (exit 0, log warnings) | yes |
| 5 | Tab-by-tab page re-skin: Tabs wrapper → Dashboard → Calendar → Management → Fitness → Settings → Onboarding → shared/ | yes (after each tab) |
| 6 | Flip guards to hard-fail + enable `--ion-color-*` rejection + retire `check-form-input-pattern.mjs` | yes |
| 7 | Delete 8 legacy theme files | yes |
| 8 | Rewrite 6 markdown docs in `docs/3-design/` + new ADR + update `coding-conventions.md` + update `CLAUDE.md` | yes |
| 9 | Version bump → 0.3.0, final smoke test on Android device, merge | yes |

---

## Phase 0 — Setup, font assets, scratch test

### Task 0.1: Create worktree branch

**Files:** none (git only)

- [ ] **Step 1: Confirm clean tree**

Run: `git status`
Expected: working tree clean (last commit is `2d14710a` audit fixes).

- [ ] **Step 2: Create branch**

Run: `git checkout -b feat/apple-design-migration`
Expected: switched to new branch.

- [ ] **Step 3: Commit checkpoint marker**

Run: `git commit --allow-empty -m "chore: begin Apple design migration (spec 2026-05-17)"`

---

### Task 0.2: Add Inter woff2 font assets

**Files:**
- Create: `src/assets/fonts/Inter-Light.woff2`
- Create: `src/assets/fonts/Inter-Regular.woff2`
- Create: `src/assets/fonts/Inter-SemiBold.woff2`
- Create: `src/assets/fonts/Inter-Bold.woff2`
- Create: `src/assets/fonts/LICENSE.txt`

- [ ] **Step 1: Make fonts directory**

Run: `mkdir -p src/assets/fonts`

- [ ] **Step 2: Download Inter v4.0 woff2**

Source: <https://github.com/rsms/inter/releases>. Download the latest Inter zip and extract the four web woff2 files for weights 300/400/600/700.

```bash
cd /tmp
curl -sLo inter.zip "https://github.com/rsms/inter/releases/download/v4.0/Inter-4.0.zip"
unzip -q inter.zip -d inter-extracted
cp inter-extracted/InterWeb/Inter-Light.woff2 \
   inter-extracted/InterWeb/Inter-Regular.woff2 \
   inter-extracted/InterWeb/Inter-SemiBold.woff2 \
   inter-extracted/InterWeb/Inter-Bold.woff2 \
   "$OLDPWD/src/assets/fonts/"
cp inter-extracted/LICENSE.txt "$OLDPWD/src/assets/fonts/"
cd "$OLDPWD"
```

If the release zip layout differs at execution time, adjust paths — the goal is 4 woff2 files at `src/assets/fonts/Inter-{Light,Regular,SemiBold,Bold}.woff2` plus the SIL OFL license file.

- [ ] **Step 3: Verify files exist**

Run: `ls -lh src/assets/fonts/`
Expected: 4 woff2 + LICENSE.txt. Each woff2 ~70 KB. Total ~280 KB.

- [ ] **Step 4: Commit**

```bash
git add src/assets/fonts/
git commit -m "feat(fonts): bundle Inter 4.0 (Light/Regular/SemiBold/Bold) woff2

Apple-design-migration foundation. SF Pro substitute per DESIGN.md.
~280 KB total. Latin + Vietnamese coverage.
Spec: docs/superpowers/specs/2026-05-17-apple-design-migration-design.md"
```

---

### Task 0.3: Verify Angular asset pipeline serves fonts

**Files:**
- Modify: `angular.json` (only if fonts not already covered by `src/assets` glob)

- [ ] **Step 1: Inspect current asset config**

Run: `grep -A 12 '"assets"' angular.json | head -30`
Expected: see `"src/assets"` glob. If present, no edit needed.

- [ ] **Step 2: If glob missing, add it**

If `src/assets` is NOT listed, edit `angular.json` and add inside `build > options > assets`:

```json
{ "glob": "**/*", "input": "src/assets/fonts", "output": "/assets/fonts/" }
```

- [ ] **Step 3: Smoke build**

Run: `ng build --configuration=development 2>&1 | tail -20`
Expected: build completes with no font-related errors.

- [ ] **Step 4: Verify font landed in dist**

Run: `ls www/assets/fonts/ 2>/dev/null || ls dist/HealthMateAI/browser/assets/fonts/ 2>/dev/null`
Expected: 4 woff2 files.

- [ ] **Step 5: Commit (only if `angular.json` modified)**

```bash
git add angular.json
git commit -m "build: serve src/assets/fonts/ in Angular asset pipeline"
```

---

## Phase 1 — Rewrite `src/theme/variables.scss` (tokens + legacy alias)

**Phase invariant:** at end, `variables.scss` declares all 18 Apple color tokens + 3 semantic tokens + spacing + radius + elevation + backdrop, AND keeps the existing Sage `--ion-color-*` aliases so legacy SCSS still compiles. The legacy aliases are deleted in Phase 6.

### Task 1.1: Add Apple tokens above existing tokens

**Files:**
- Modify: `src/theme/variables.scss` (prepend a new block at the top of `:root {}`)

- [ ] **Step 1: Read current file**

Run: `wc -l src/theme/variables.scss`
Expected: ~248 lines.

- [ ] **Step 2: Edit `:root {}` to add the Apple block at the top**

Insert this block as the **first child of `:root {}`** (immediately after the opening `:root {` line; do not touch existing tokens yet):

```scss
  // ==========================================================================
  // Apple Design tokens (DS v3.0, 2026-05-17 migration)
  // Source of truth: DESIGN.md + spec 2026-05-17-apple-design-migration-design.md
  // Legacy Sage tokens are still present below during migration and will be
  // removed in Phase 6 once all consumers have been re-skinned.
  // ==========================================================================

  // --- Colors -------------------------------------------------------------
  --apple-primary: #0066cc;
  --apple-primary-focus: #0071e3;
  --apple-primary-on-dark: #2997ff;
  --apple-ink: #1d1d1f;
  --apple-body-on-dark: #ffffff;
  --apple-body-muted: #cccccc;
  --apple-ink-muted-80: #333333;
  --apple-ink-muted-48: #7a7a7a;
  --apple-divider-soft: #f0f0f0;
  --apple-hairline: #e0e0e0;
  --apple-canvas: #ffffff;
  --apple-canvas-parchment: #f5f5f7;
  --apple-surface-pearl: #fafafc;
  --apple-surface-chip: rgba(210, 210, 215, 0.64); // allow-hardcode: Apple translucent chip surface (DS v3.0 §2)
  --apple-surface-black: #000000;
  --apple-on-primary: #ffffff;
  --apple-on-dark: #ffffff;

  // --- Semantic (Apple-pure single-accent rule) ---------------------------
  --apple-semantic-success: #0066cc; // Action Blue — Apple has no semantic green
  --apple-semantic-warning: #333333; // ink-muted-80 — warning by icon+text only
  --apple-semantic-danger: #bf4800;  // Apple system-alert red (sole exception)

  // --- Spacing ------------------------------------------------------------
  --apple-space-xxs: 4px;
  --apple-space-xs: 8px;
  --apple-space-sm: 12px;
  --apple-space-md: 17px;
  --apple-space-lg: 24px;
  --apple-space-xl: 32px;
  --apple-space-xxl: 48px;
  --apple-space-section: 80px;

  // --- Radius -------------------------------------------------------------
  --apple-radius-none: 0;
  --apple-radius-xs: 5px;
  --apple-radius-sm: 8px;
  --apple-radius-md: 11px;
  --apple-radius-lg: 18px;
  --apple-radius-pill: 9999px;
  --apple-radius-full: 9999px;

  // --- Elevation ----------------------------------------------------------
  --apple-shadow-product: 3px 5px 30px 0 rgba(0, 0, 0, 0.22); // allow-hardcode: single product drop-shadow per DS v3.0 §2.5
  --apple-shadow-none: none;

  // --- Backdrop -----------------------------------------------------------
  --apple-backdrop-blur: saturate(180%) blur(20px);
  --apple-frosted-bg: rgba(245, 245, 247, 0.8); // allow-hardcode: frosted sticky bar (DS v3.0 §2.6)
```

- [ ] **Step 3: Add responsive `--apple-space-section` overrides at end of file**

Append at the bottom of `variables.scss` (after the `:root` closing brace, OR as additional `:root` rules — both legal SCSS):

```scss
@media (max-width: 833px) { :root { --apple-space-section: 48px; } }
@media (max-width: 640px) { :root { --apple-space-section: 32px; } }
@media (max-width: 419px) { :root { --apple-space-section: 24px; } }
```

- [ ] **Step 4: Build**

Run: `ng build --configuration=development 2>&1 | tail -5`
Expected: SUCCESS. No SCSS errors.

- [ ] **Step 5: Verify tokens are emitted in compiled CSS**

Run: `grep -c "apple-primary" www/styles*.css 2>/dev/null || grep -c "apple-primary" dist/HealthMateAI/browser/styles*.css`
Expected: count ≥ 1.

- [ ] **Step 6: Commit**

```bash
git add src/theme/variables.scss
git commit -m "feat(theme): add Apple design tokens alongside legacy Sage

Phase 1 of Apple migration. Adds 18 color + 3 semantic + spacing +
radius + elevation + backdrop tokens with --apple-* prefix. Legacy
--ion-color-* and Sage tokens retained for transitional builds; they
will be removed in Phase 6 once all consumers have been re-skinned.
Spec: docs/superpowers/specs/2026-05-17-apple-design-migration-design.md"
```

---

## Phase 2 — Create `src/theme/_typography.scss` + load Inter globally

**Phase invariant:** Inter loads on cold start; 15 typography tokens available globally; legacy font tokens unchanged.

### Task 2.1: Write `_typography.scss`

**Files:**
- Create: `src/theme/_typography.scss`
- Modify: `src/global.scss` (add one `@use` line)

- [ ] **Step 1: Create `src/theme/_typography.scss`** with this content:

```scss
// HealthMate AI — Apple Typography (DS v3.0, 2026-05-17)
// Source: DESIGN.md §Typography. Inter bundled at src/assets/fonts/.
// Weight 500 is forbidden by check-no-weight-500.mjs (Phase 4).

@font-face {
  font-family: 'Inter';
  src: url('/assets/fonts/Inter-Light.woff2') format('woff2');
  font-weight: 300; font-style: normal; font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('/assets/fonts/Inter-Regular.woff2') format('woff2');
  font-weight: 400; font-style: normal; font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('/assets/fonts/Inter-SemiBold.woff2') format('woff2');
  font-weight: 600; font-style: normal; font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('/assets/fonts/Inter-Bold.woff2') format('woff2');
  font-weight: 700; font-style: normal; font-display: swap;
}

:root {
  --apple-font-display: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  --apple-font-text:    'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;

  // Shorthand tokens used as: `font: var(--apple-type-X)`
  --apple-type-hero-display:   600 56px/1.07 var(--apple-font-display);
  --apple-type-display-lg:     600 40px/1.10 var(--apple-font-display);
  --apple-type-display-md:     600 34px/1.47 var(--apple-font-display);
  --apple-type-lead:           400 28px/1.14 var(--apple-font-text);
  --apple-type-lead-airy:      300 24px/1.5  var(--apple-font-text);
  --apple-type-tagline:        600 21px/1.19 var(--apple-font-display);
  --apple-type-body-strong:    600 17px/1.24 var(--apple-font-text);
  --apple-type-body:           400 17px/1.44 var(--apple-font-text);
  --apple-type-dense-link:     400 17px/2.41 var(--apple-font-text);
  --apple-type-caption:        400 14px/1.43 var(--apple-font-text);
  --apple-type-caption-strong: 600 14px/1.29 var(--apple-font-text);
  --apple-type-button-large:   300 18px/1.0  var(--apple-font-text);
  --apple-type-button-utility: 400 14px/1.29 var(--apple-font-text);
  --apple-type-fine-print:     400 12px/1.0  var(--apple-font-text);
  --apple-type-micro-legal:    400 10px/1.3  var(--apple-font-text);
  --apple-type-nav-link:       400 12px/1.0  var(--apple-font-text);

  // Tracking (letter-spacing) tokens — apply alongside `font:`.
  --apple-track-hero:        -0.28px;
  --apple-track-display-lg:  0;
  --apple-track-display-md:  -0.374px;
  --apple-track-lead:        0.196px;
  --apple-track-tagline:     0.231px;
  --apple-track-body:        -0.374px;
  --apple-track-caption:     -0.224px;
  --apple-track-fine:        -0.12px;
  --apple-track-micro:       -0.08px;
}

html, body {
  font-family: var(--apple-font-text);
  font-feature-settings: 'ss03'; // Inter substitution: rounded 'a'
}

@media (max-width: 419px) {
  :root {
    --apple-type-hero-display: 600 28px/1.10 var(--apple-font-display);
    --apple-type-display-lg:   600 28px/1.10 var(--apple-font-display);
  }
}
```

- [ ] **Step 2: Find global stylesheet entry point**

Run: `ls src/global.scss src/styles.scss 2>/dev/null`
Expected: at least one exists. Ionic Angular projects typically have `src/global.scss`.

- [ ] **Step 3: Add `@use` line at the top of `src/global.scss`**

Edit `src/global.scss`. Insert as the first non-comment line:

```scss
@use 'theme/typography';
```

If Sass throws "Can't find stylesheet to import", change to `@use './theme/typography';`.

- [ ] **Step 4: Build**

Run: `ng build --configuration=development 2>&1 | tail -10`
Expected: SUCCESS.

- [ ] **Step 5: Verify Inter appears in compiled CSS**

Run: `grep -c "Inter-Regular" www/styles*.css dist/HealthMateAI/browser/styles*.css 2>/dev/null | head -1`
Expected: ≥ 1.

- [ ] **Step 6: Commit**

```bash
git add src/theme/_typography.scss src/global.scss
git commit -m "feat(theme): add Apple typography ladder + load Inter globally

15 typography shorthand tokens (--apple-type-*) + 9 tracking tokens.
Inter @font-face for 4 weights (300/400/600/700). Weight 500 forbidden
(guard in Phase 4). Inter substitution: body line-height 1.44,
font-feature-settings ss03 for rounded 'a', display-size letter-spacing
pre-tightened in tokens."
```

---



## Phase 3 — New theme component SCSS files

**Phase invariant:** 9 new partials under `src/theme/` defining `.apple-*` classes, all wired into `global.scss` via `@use`. Legacy partials still loaded — there are no consumers of `.apple-*` yet, so visually nothing changes, but the classes are available for Phase 5.

All 9 partials follow the same pattern: declare classes using only `--apple-*` tokens; no raw hex; no `box-shadow` other than `var(--apple-shadow-product)`; no `font-weight: 500`.

### Task 3.1: `_button.scss` (6 button variants)

**Files:**
- Create: `src/theme/_button.scss`
- Modify: `src/global.scss` (add `@use 'theme/button';`)

- [ ] **Step 1: Create `src/theme/_button.scss`**:

```scss
// Apple Buttons — DS v3.0 §7. 6 variants. Active state: scale(0.95).
%apple-btn-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  cursor: pointer;
  transition: transform 0.12s ease, background 0.15s ease, border-color 0.15s ease;
  &:active { transform: scale(0.95); }
  &:focus-visible { outline: 2px solid var(--apple-primary-focus); outline-offset: 2px; }
  &[disabled] { opacity: 0.4; pointer-events: none; }
}

.apple-btn--primary {
  @extend %apple-btn-base;
  background: var(--apple-primary);
  color: var(--apple-on-primary);
  font: var(--apple-type-body);
  letter-spacing: var(--apple-track-body);
  border-radius: var(--apple-radius-pill);
  padding: 11px 22px;
  &:hover { background: var(--apple-primary-focus); }
}

.apple-btn--secondary {
  @extend %apple-btn-base;
  background: transparent;
  color: var(--apple-primary);
  border: 1px solid var(--apple-primary);
  font: var(--apple-type-body);
  letter-spacing: var(--apple-track-body);
  border-radius: var(--apple-radius-pill);
  padding: 11px 22px;
}

.apple-btn--dark-utility {
  @extend %apple-btn-base;
  background: var(--apple-ink);
  color: var(--apple-on-dark);
  font: var(--apple-type-button-utility);
  letter-spacing: var(--apple-track-caption);
  border-radius: var(--apple-radius-sm);
  padding: 8px 15px;
}

.apple-btn--pearl {
  @extend %apple-btn-base;
  background: var(--apple-surface-pearl);
  color: var(--apple-ink-muted-80);
  font: var(--apple-type-caption);
  letter-spacing: var(--apple-track-caption);
  border: 3px solid var(--apple-divider-soft);
  border-radius: var(--apple-radius-md);
  padding: 8px 14px;
}

.apple-btn--hero {
  @extend %apple-btn-base;
  background: var(--apple-primary);
  color: var(--apple-on-primary);
  font: var(--apple-type-button-large);
  border-radius: var(--apple-radius-pill);
  padding: 14px 28px;
}

.apple-btn--icon-circular {
  @extend %apple-btn-base;
  width: 44px;
  height: 44px;
  background: var(--apple-surface-chip);
  color: var(--apple-ink);
  border-radius: var(--apple-radius-full);
  padding: 0;
}
```

- [ ] **Step 2: Wire into `src/global.scss`** — add after `@use 'theme/typography';`:

```scss
@use 'theme/button';
```

- [ ] **Step 3: Build & commit**

Run: `ng build --configuration=development 2>&1 | tail -5`
Expected: SUCCESS.

```bash
git add src/theme/_button.scss src/global.scss
git commit -m "feat(theme): add Apple button variants (.apple-btn--*)"
```

---

### Task 3.2: `_card.scss`

**Files:**
- Create: `src/theme/_card.scss`
- Modify: `src/global.scss`

- [ ] **Step 1: Create `src/theme/_card.scss`**:

```scss
// Apple Card — DS v3.0 §7. Light-only. Product photo gets single drop-shadow.
.apple-card {
  background: var(--apple-canvas);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-radius-lg);
  padding: var(--apple-space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--apple-space-sm);
  color: var(--apple-ink);
}

.apple-card__title {
  font: var(--apple-type-tagline);
  letter-spacing: var(--apple-track-tagline);
  color: var(--apple-ink);
  margin: 0;
}

.apple-card__body {
  font: var(--apple-type-body);
  letter-spacing: var(--apple-track-body);
  color: var(--apple-ink);
  margin: 0;
}

.apple-card__meta {
  font: var(--apple-type-caption);
  letter-spacing: var(--apple-track-caption);
  color: var(--apple-ink-muted-48);
  margin: 0;
}

.apple-card__image {
  border-radius: var(--apple-radius-sm);
  overflow: hidden;
  display: block;
}

.apple-card__image--product {
  box-shadow: var(--apple-shadow-product); // allow-shadow: single product photo shadow (DS v3.0 §2.5)
}
```

- [ ] **Step 2: Wire into `src/global.scss`**:

```scss
@use 'theme/card';
```

- [ ] **Step 3: Build & commit**

```bash
git add src/theme/_card.scss src/global.scss
git commit -m "feat(theme): add .apple-card (list card primitive)"
```

---

### Task 3.3: `_chip.scss`

**Files:**
- Create: `src/theme/_chip.scss`
- Modify: `src/global.scss`

- [ ] **Step 1: Create `src/theme/_chip.scss`**:

```scss
// Apple Chip — DS v3.0 §3.3. Used as configurator + segment-control replacement.
.apple-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--apple-canvas);
  color: var(--apple-ink);
  font: var(--apple-type-caption);
  letter-spacing: var(--apple-track-caption);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-radius-pill);
  padding: 12px 16px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, transform 0.12s ease;
  &:active { transform: scale(0.95); }
  &:focus-visible { outline: 2px solid var(--apple-primary-focus); outline-offset: 2px; }
}

.apple-chip--selected {
  border: 2px solid var(--apple-primary-focus);
  padding: 11px 15px; // -1px on each side to compensate for 2px border
}

.apple-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--apple-space-xs);
}
```

- [ ] **Step 2: Wire**:

```scss
@use 'theme/chip';
```

- [ ] **Step 3: Build & commit**

```bash
git add src/theme/_chip.scss src/global.scss
git commit -m "feat(theme): add .apple-chip / .apple-chip-row (replaces ion-segment)"
```

---

### Task 3.4: `_field.scss` (form input — Apple-field canonical)

**Files:**
- Create: `src/theme/_field.scss`
- Modify: `src/global.scss`

- [ ] **Step 1: Create `src/theme/_field.scss`**:

```scss
// Apple Field — DS v3.0 §8 (replaces floating-label canonical pattern).
// Markup:
//   <div class="apple-field" [class.apple-field--error]="hasError">
//     <label class="apple-field__label" for="x">Label</label>
//     <input class="apple-field__input" id="x" />
//     <p class="apple-field__hint">Hint</p>
//     <p class="apple-field__error">Error</p>
//   </div>
.apple-field {
  display: flex;
  flex-direction: column;
  gap: var(--apple-space-xs);
  margin-bottom: var(--apple-space-lg);
}

.apple-field__label {
  font: var(--apple-type-caption-strong);
  letter-spacing: var(--apple-track-caption);
  color: var(--apple-ink);
}

.apple-field__input,
.apple-field__picker {
  font: var(--apple-type-body);
  letter-spacing: var(--apple-track-body);
  color: var(--apple-ink);
  background: var(--apple-canvas);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-radius-sm);
  padding: 12px 16px;
  height: 44px;
  outline: none;
  width: 100%;
  &::placeholder { color: var(--apple-ink-muted-48); }
  &:focus {
    border-color: var(--apple-primary);
    outline: 2px solid var(--apple-primary-focus);
    outline-offset: -1px;
  }
  &[disabled] { opacity: 0.4; }
}

.apple-field__picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  text-align: left;
}

.apple-field--error .apple-field__input,
.apple-field--error .apple-field__picker {
  border-color: var(--apple-semantic-danger);
}

.apple-field__hint {
  font: var(--apple-type-caption);
  letter-spacing: var(--apple-track-caption);
  color: var(--apple-ink-muted-48);
  margin: 0;
}

.apple-field__error {
  font: var(--apple-type-caption);
  letter-spacing: var(--apple-track-caption);
  color: var(--apple-semantic-danger);
  margin: 0;
}
```

- [ ] **Step 2: Wire**:

```scss
@use 'theme/field';
```

- [ ] **Step 3: Build & commit**

```bash
git add src/theme/_field.scss src/global.scss
git commit -m "feat(theme): add .apple-field (replaces floating-label form input)"
```

---

### Task 3.5: `_search.scss`

**Files:**
- Create: `src/theme/_search.scss`
- Modify: `src/global.scss`

- [ ] **Step 1: Create `src/theme/_search.scss`**:

```scss
// Apple Search — DS v3.0 §3.4. Pill-shaped input with leading icon.
.apple-search {
  display: flex;
  align-items: center;
  gap: var(--apple-space-sm);
  background: var(--apple-canvas);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-radius-pill);
  padding: 12px 20px;
  height: 44px;
}

.apple-search__icon {
  font-size: 14px;
  color: var(--apple-ink-muted-48);
  flex-shrink: 0;
}

.apple-search__input {
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  font: var(--apple-type-body);
  letter-spacing: var(--apple-track-body);
  color: var(--apple-ink);
  &::placeholder { color: var(--apple-ink-muted-48); }
}
```

- [ ] **Step 2: Wire**:

```scss
@use 'theme/search';
```

- [ ] **Step 3: Build & commit**

```bash
git add src/theme/_search.scss src/global.scss
git commit -m "feat(theme): add .apple-search (pill-shaped search input)"
```

---

### Task 3.6: `_tile.scss`

**Files:**
- Create: `src/theme/_tile.scss`
- Modify: `src/global.scss`

- [ ] **Step 1: Create `src/theme/_tile.scss`**:

```scss
// Apple Tile — DS v3.0 §3.3. Full-bleed surface section.
// Only two variants: light (white) + parchment. No dark tile (light-only invariant).
.apple-tile--light,
.apple-tile--parchment {
  padding: var(--apple-space-section) var(--apple-space-lg);
  color: var(--apple-ink);
  display: flex;
  flex-direction: column;
  gap: var(--apple-space-lg);
}

.apple-tile--light {
  background: var(--apple-canvas);
}

.apple-tile--parchment {
  background: var(--apple-canvas-parchment);
}
```

- [ ] **Step 2: Wire**:

```scss
@use 'theme/tile';
```

- [ ] **Step 3: Build & commit**

```bash
git add src/theme/_tile.scss src/global.scss
git commit -m "feat(theme): add .apple-tile--light / .apple-tile--parchment"
```

---

### Task 3.7: `_sticky-bar.scss`

**Files:**
- Create: `src/theme/_sticky-bar.scss`
- Modify: `src/global.scss`

- [ ] **Step 1: Create `src/theme/_sticky-bar.scss`**:

```scss
// Apple Sticky Bar — DS v3.0 §3.3. Bottom-floating frosted bar.
// Used by: Calendar "Tổng calo trong ngày", Meal edit "Tổng dinh dưỡng".
// Sits 8px above the .apple-tab-bar.
.apple-sticky-bar {
  position: fixed;
  left: var(--apple-space-lg);
  right: var(--apple-space-lg);
  bottom: calc(49px + 8px); // tab bar height + gap
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 32px;
  background: var(--apple-frosted-bg);
  backdrop-filter: var(--apple-backdrop-blur);
  -webkit-backdrop-filter: var(--apple-backdrop-blur);
  border-radius: var(--apple-radius-pill);
  color: var(--apple-ink);
  font: var(--apple-type-body-strong);
  letter-spacing: var(--apple-track-body);
  z-index: 30;
}

.apple-sticky-bar__label {
  font: var(--apple-type-caption);
  color: var(--apple-ink-muted-48);
}

.apple-sticky-bar__value {
  font: var(--apple-type-body-strong);
  color: var(--apple-ink);
}
```

- [ ] **Step 2: Wire**:

```scss
@use 'theme/sticky-bar';
```

- [ ] **Step 3: Build & commit**

```bash
git add src/theme/_sticky-bar.scss src/global.scss
git commit -m "feat(theme): add .apple-sticky-bar (frosted bottom-floating bar)"
```

---

### Task 3.8: `_tab-bar.scss` (Ionic re-skin)

**Files:**
- Create: `src/theme/_tab-bar.scss`
- Modify: `src/global.scss`

- [ ] **Step 1: Create `src/theme/_tab-bar.scss`**:

```scss
// Apple Tab Bar — DS v3.0 §3.1 (iOS HIG bottom Tab Bar, 49px standard).
// Applied to <ion-tabs class="apple-tab-bar">; styles target child <ion-tab-bar>.
.apple-tab-bar {
  ion-tab-bar {
    --background: var(--apple-canvas);
    --color: var(--apple-ink-muted-48);
    --color-selected: var(--apple-primary);
    --border: 1px solid var(--apple-hairline);
    height: 49px;
  }

  ion-tab-button {
    --color: var(--apple-ink-muted-48);
    --color-selected: var(--apple-primary);
    font: var(--apple-type-nav-link);
    letter-spacing: var(--apple-track-fine);

    ion-icon {
      font-size: 22px;
    }

    ion-label {
      font: var(--apple-type-nav-link);
      letter-spacing: var(--apple-track-fine);
      margin-top: 2px;
    }
  }
}
```

- [ ] **Step 2: Wire**:

```scss
@use 'theme/tab-bar';
```

- [ ] **Step 3: Build & commit**

```bash
git add src/theme/_tab-bar.scss src/global.scss
git commit -m "feat(theme): add .apple-tab-bar (iOS HIG bottom tabs re-skin)"
```

---

### Task 3.9: `_nav-bar.scss` (Ionic header re-skin)

**Files:**
- Create: `src/theme/_nav-bar.scss`
- Modify: `src/global.scss`

- [ ] **Step 1: Create `src/theme/_nav-bar.scss`**:

```scss
// Apple Nav Bar — DS v3.0 §3.1 (iOS UINavigationBar, 44px standard).
// Applied to <ion-header class="apple-nav-bar">.
// Large title behaviour: enable on tab roots via Ionic <ion-title size="large">.
.apple-nav-bar {
  ion-toolbar {
    --background: var(--apple-canvas);
    --color: var(--apple-ink);
    --border-color: var(--apple-divider-soft);
    --min-height: 44px;
    --padding-start: var(--apple-space-lg);
    --padding-end: var(--apple-space-lg);
  }

  ion-title {
    font: var(--apple-type-tagline);
    letter-spacing: var(--apple-track-tagline);
    color: var(--apple-ink);
    padding: 0;
  }

  // Large title (only when <ion-title size="large"> on tab root pages)
  ion-title[size='large'] {
    font: var(--apple-type-display-md);
    letter-spacing: var(--apple-track-display-md);
    padding: var(--apple-space-lg);
  }

  ion-back-button,
  ion-button {
    --color: var(--apple-primary);
    font: var(--apple-type-body);
    letter-spacing: var(--apple-track-body);
  }
}
```

- [ ] **Step 2: Wire**:

```scss
@use 'theme/nav-bar';
```

- [ ] **Step 3: Build & commit**

```bash
git add src/theme/_nav-bar.scss src/global.scss
git commit -m "feat(theme): add .apple-nav-bar (iOS UINavigationBar re-skin)"
```

---

## Phase 4 — Add 4 new guards in **soft-warn** mode

**Phase invariant:** All 4 new guard scripts exist and are wired into `package.json` `check:guards`. Each respects an env var to switch between soft-warn (exit 0, print warnings) and hard-fail (exit 1). Default in Phase 4 is **soft-warn** so Phase 5 page-by-page re-skin commits don't get blocked while migration is in progress. Phase 6 flips the default to hard-fail.

**Soft-warn pattern (used by every new guard):**

```js
const STRICT = process.env.GUARD_STRICT === '1' || process.argv.includes('--strict');
// ... collect violations ...
if (violations.length === 0) { console.log('✓ <guard>: PASS'); process.exit(0); }
console[STRICT ? 'error' : 'warn'](`${STRICT ? '✗' : '⚠'} <guard>: ${violations.length} violation(s):`);
for (const v of violations) console[STRICT ? 'error' : 'warn'](`  ${v.path}:${v.line} ${v.match}`);
process.exit(STRICT ? 1 : 0);
```

> Note: the existing 11 guards remain unchanged in Phase 4. `check-form-input-pattern.mjs` is NOT retired yet — page re-skin in Phase 5 will start failing it; until then the floating-label markup still passes. We retire it in Phase 6.

### Task 4.1: `check-no-box-shadow.mjs`

**Files:**
- Create: `scripts/check-no-box-shadow.mjs`
- Modify: `package.json` (add `check:no-box-shadow` script and append to `check:guards`)

- [ ] **Step 1: Create the guard script**

Write `scripts/check-no-box-shadow.mjs`:

```js
#!/usr/bin/env node
/**
 * scripts/check-no-box-shadow.mjs
 *
 * Apple migration guard: only `box-shadow: var(--apple-shadow-product)` is
 * allowed in src/**\/*.{scss,css}. Any other box-shadow declaration must carry
 * a `// allow-shadow: <reason>` comment on the same line or the line above.
 *
 * Default: soft-warn (exit 0). Pass --strict or GUARD_STRICT=1 to hard-fail.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const STRICT = process.env.GUARD_STRICT === '1' || process.argv.includes('--strict');
const SCAN_DIR = join(ROOT, 'src');
const EXTS = ['.scss', '.css'];
const SHADOW_RE = /^\s*box-shadow\s*:/;
const ALLOWED = /var\(--apple-shadow-product\)/;
const ESCAPE = /\/\/\s*allow-shadow:/;

const violations = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    let st; try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full);
    else if (EXTS.some(e => entry.endsWith(e))) check(full);
  }
}
function check(path) {
  const rel = relative(ROOT, path);
  const lines = readFileSync(path, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!SHADOW_RE.test(line)) continue;
    if (ALLOWED.test(line)) continue;
    if (ESCAPE.test(line)) continue;
    if (i > 0 && ESCAPE.test(lines[i - 1])) continue;
    violations.push({ rel, n: i + 1, snippet: line.trim().slice(0, 120) });
  }
}
walk(SCAN_DIR);

if (violations.length === 0) { console.log('✓ check-no-box-shadow: PASS'); process.exit(0); }
const log = STRICT ? console.error : console.warn;
const mark = STRICT ? '✗' : '⚠';
log(`${mark} check-no-box-shadow: ${violations.length} violation(s) (${STRICT ? 'STRICT' : 'soft-warn'}):`);
for (const v of violations) log(`  ${v.rel}:${v.n}  ${v.snippet}`);
process.exit(STRICT ? 1 : 0);
```

- [ ] **Step 2: Add npm script and append to aggregate**

Edit `package.json`:
- Inside `"scripts"`, add: `"check:no-box-shadow": "node scripts/check-no-box-shadow.mjs"`
- Modify `"check:guards"` value: append ` && npm run check:no-box-shadow` to the end.

- [ ] **Step 3: Run it**

Run: `npm run check:no-box-shadow`
Expected: prints `⚠ check-no-box-shadow: <N> violation(s) (soft-warn)` (since there are 36 box-shadows currently). Exits 0.

- [ ] **Step 4: Run aggregate to confirm it doesn't break the build**

Run: `npm run check:guards`
Expected: prints warnings for box-shadow but exits 0 overall.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-no-box-shadow.mjs package.json
git commit -m "feat(guard): add check-no-box-shadow.mjs (soft-warn)

Only box-shadow: var(--apple-shadow-product) is allowed; everything else
needs // allow-shadow: <reason>. Default soft-warn; --strict or
GUARD_STRICT=1 to hard-fail. Flipped to hard-fail in Phase 6."
```

---

### Task 4.2: `check-no-weight-500.mjs`

**Files:**
- Create: `scripts/check-no-weight-500.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create script**

Write `scripts/check-no-weight-500.mjs`:

```js
#!/usr/bin/env node
/**
 * scripts/check-no-weight-500.mjs
 * Apple migration guard: Inter ladder is 300/400/600/700. Weight 500 forbidden.
 * Detects: `font-weight: 500;` and `font: ... 500 ...`.
 * Soft-warn by default; --strict or GUARD_STRICT=1 to hard-fail.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const STRICT = process.env.GUARD_STRICT === '1' || process.argv.includes('--strict');
const SCAN_DIR = join(ROOT, 'src');
const EXTS = ['.scss', '.css'];
const WEIGHT_RE = /font-weight\s*:\s*500\b/;
const FONT_SHORTHAND_500 = /^\s*font\s*:\s*[^;]*\b500\b/;

const violations = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    let st; try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full);
    else if (EXTS.some(e => entry.endsWith(e))) check(full);
  }
}
function check(path) {
  const rel = relative(ROOT, path);
  const lines = readFileSync(path, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (WEIGHT_RE.test(l) || FONT_SHORTHAND_500.test(l)) {
      violations.push({ rel, n: i + 1, snippet: l.trim().slice(0, 120) });
    }
  }
}
walk(SCAN_DIR);

if (violations.length === 0) { console.log('✓ check-no-weight-500: PASS'); process.exit(0); }
const log = STRICT ? console.error : console.warn;
log(`${STRICT ? '✗' : '⚠'} check-no-weight-500: ${violations.length} violation(s) (${STRICT ? 'STRICT' : 'soft-warn'}):`);
for (const v of violations) log(`  ${v.rel}:${v.n}  ${v.snippet}`);
process.exit(STRICT ? 1 : 0);
```

- [ ] **Step 2: Wire into `package.json`**

Add `"check:no-weight-500": "node scripts/check-no-weight-500.mjs"`. Append ` && npm run check:no-weight-500` to `check:guards`.

- [ ] **Step 3: Run and commit**

Run: `npm run check:guards`
Expected: warnings for ~50 weight-500 lines. Exit 0.

```bash
git add scripts/check-no-weight-500.mjs package.json
git commit -m "feat(guard): add check-no-weight-500.mjs (soft-warn)

Inter ladder is 300/400/600/700. Default soft-warn; flipped to hard-fail
in Phase 6 once all weight-500 usages in src/ are migrated to 400 or 600."
```

---

### Task 4.3: `check-no-segment-control.mjs`

**Files:**
- Create: `scripts/check-no-segment-control.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create script**

Write `scripts/check-no-segment-control.mjs`:

```js
#!/usr/bin/env node
/**
 * scripts/check-no-segment-control.mjs
 * Apple migration guard: <ion-segment> and <ion-segment-button> are forbidden.
 * Use .apple-chip-row + .apple-chip instead.
 * Soft-warn by default; --strict / GUARD_STRICT=1 to hard-fail.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const STRICT = process.env.GUARD_STRICT === '1' || process.argv.includes('--strict');
const SCAN_DIR = join(ROOT, 'src');
const RE = /<ion-segment(\s|>)|<ion-segment-button(\s|>)/;

const violations = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    let st; try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full);
    else if (entry.endsWith('.html')) check(full);
  }
}
function check(path) {
  const rel = relative(ROOT, path);
  const lines = readFileSync(path, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (RE.test(lines[i])) violations.push({ rel, n: i + 1, snippet: lines[i].trim().slice(0, 120) });
  }
}
walk(SCAN_DIR);

if (violations.length === 0) { console.log('✓ check-no-segment-control: PASS'); process.exit(0); }
const log = STRICT ? console.error : console.warn;
log(`${STRICT ? '✗' : '⚠'} check-no-segment-control: ${violations.length} violation(s) (${STRICT ? 'STRICT' : 'soft-warn'}):`);
for (const v of violations) log(`  ${v.rel}:${v.n}  ${v.snippet}`);
process.exit(STRICT ? 1 : 0);
```

- [ ] **Step 2: Wire + run + commit**

Add `"check:no-segment-control": "node scripts/check-no-segment-control.mjs"`. Append to `check:guards`.

Run: `npm run check:guards`
Expected: warnings for current segment usages. Exit 0.

```bash
git add scripts/check-no-segment-control.mjs package.json
git commit -m "feat(guard): add check-no-segment-control.mjs (soft-warn)"
```

---

### Task 4.4: `check-apple-input-pattern.mjs`

**Files:**
- Create: `scripts/check-apple-input-pattern.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create script**

Write `scripts/check-apple-input-pattern.mjs`:

```js
#!/usr/bin/env node
/**
 * scripts/check-apple-input-pattern.mjs
 *
 * Apple migration: Apple-field is the canonical form input pattern.
 *   .apple-field > .apple-field__label + .apple-field__input
 *
 * Forbids in src/**\/*.{html,scss}:
 *   - .input-wrapper / .input-label / .input-native (legacy floating-label)
 *   - .picker-trigger--floating
 *   - <ion-input> outside an .apple-field wrapper (heuristic: any `<ion-input` not preceded by class="apple-field")
 *
 * Soft-warn by default; --strict / GUARD_STRICT=1 to hard-fail.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const STRICT = process.env.GUARD_STRICT === '1' || process.argv.includes('--strict');
const SCAN_DIR = join(ROOT, 'src');
const PATTERNS = [
  { re: /\binput-wrapper\b/, msg: 'legacy .input-wrapper (use .apple-field)' },
  { re: /\binput-label\b/, msg: 'legacy .input-label (use .apple-field__label)' },
  { re: /\binput-native\b/, msg: 'legacy .input-native (use .apple-field__input)' },
  { re: /picker-trigger--floating/, msg: 'legacy .picker-trigger--floating (use .apple-field__picker)' },
];

const violations = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    let st; try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full);
    else if (entry.endsWith('.html') || entry.endsWith('.scss')) check(full);
  }
}
function check(path) {
  const rel = relative(ROOT, path);
  // Theme files that define legacy form-field are allowed during Phase 4–5.
  if (rel.endsWith('theme/form-field.scss')) return;
  const lines = readFileSync(path, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const p of PATTERNS) {
      if (p.re.test(lines[i])) {
        violations.push({ rel, n: i + 1, msg: p.msg, snippet: lines[i].trim().slice(0, 120) });
        break;
      }
    }
  }
}
walk(SCAN_DIR);

if (violations.length === 0) { console.log('✓ check-apple-input-pattern: PASS'); process.exit(0); }
const log = STRICT ? console.error : console.warn;
log(`${STRICT ? '✗' : '⚠'} check-apple-input-pattern: ${violations.length} violation(s) (${STRICT ? 'STRICT' : 'soft-warn'}):`);
for (const v of violations) log(`  ${v.rel}:${v.n} [${v.msg}]  ${v.snippet}`);
process.exit(STRICT ? 1 : 0);
```

- [ ] **Step 2: Wire + run + commit**

Add `"check:apple-input-pattern": "node scripts/check-apple-input-pattern.mjs"`. Append to `check:guards`.

Run: `npm run check:guards`
Expected: warnings for 4 floating-label HTMLs. Exit 0.

```bash
git add scripts/check-apple-input-pattern.mjs package.json
git commit -m "feat(guard): add check-apple-input-pattern.mjs (soft-warn)"
```

---

### Task 4.5: `check-tab-bar-pattern.mjs` + `check-inter-font.mjs`

These two are cheaper than the above. Combine into one task.

**Files:**
- Create: `scripts/check-tab-bar-pattern.mjs`
- Create: `scripts/check-inter-font.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create `scripts/check-tab-bar-pattern.mjs`**

```js
#!/usr/bin/env node
/**
 * scripts/check-tab-bar-pattern.mjs
 * If <ion-tab-bar> exists in any src/**\/*.html, the enclosing <ion-tabs>
 * MUST carry class="apple-tab-bar" (or class includes apple-tab-bar).
 * Soft-warn by default.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const STRICT = process.env.GUARD_STRICT === '1' || process.argv.includes('--strict');
const SCAN_DIR = join(ROOT, 'src');

const violations = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    let st; try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full);
    else if (entry.endsWith('.html')) check(full);
  }
}
function check(path) {
  const rel = relative(ROOT, path);
  const src = readFileSync(path, 'utf8');
  if (!/<ion-tab-bar\b/.test(src)) return;
  const tabsMatch = src.match(/<ion-tabs\b[^>]*>/);
  if (!tabsMatch) {
    violations.push({ rel, msg: '<ion-tab-bar> present but no <ion-tabs> wrapper found' });
    return;
  }
  if (!/class\s*=\s*"[^"]*\bapple-tab-bar\b[^"]*"/.test(tabsMatch[0])) {
    violations.push({ rel, msg: `<ion-tabs> missing class="apple-tab-bar": ${tabsMatch[0].slice(0, 120)}` });
  }
}
walk(SCAN_DIR);

if (violations.length === 0) { console.log('✓ check-tab-bar-pattern: PASS'); process.exit(0); }
const log = STRICT ? console.error : console.warn;
log(`${STRICT ? '✗' : '⚠'} check-tab-bar-pattern: ${violations.length} violation(s) (${STRICT ? 'STRICT' : 'soft-warn'}):`);
for (const v of violations) log(`  ${v.rel}  ${v.msg}`);
process.exit(STRICT ? 1 : 0);
```

- [ ] **Step 2: Create `scripts/check-inter-font.mjs`**

```js
#!/usr/bin/env node
/**
 * scripts/check-inter-font.mjs
 * Verifies Inter is bundled and referenced.
 *   1. src/assets/fonts/Inter-{Light,Regular,SemiBold,Bold}.woff2 exist.
 *   2. src/theme/_typography.scss contains @font-face for each weight.
 * Hard-fail by default (this is a build precondition, not a migration warning).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const WEIGHTS = ['Light', 'Regular', 'SemiBold', 'Bold'];
const errors = [];

for (const w of WEIGHTS) {
  const p = join(ROOT, 'src/assets/fonts', `Inter-${w}.woff2`);
  if (!existsSync(p)) errors.push(`missing font file: src/assets/fonts/Inter-${w}.woff2`);
}

const typo = join(ROOT, 'src/theme/_typography.scss');
if (!existsSync(typo)) errors.push('missing src/theme/_typography.scss');
else {
  const txt = readFileSync(typo, 'utf8');
  for (const w of WEIGHTS) {
    if (!new RegExp(`Inter-${w}\\.woff2`).test(txt)) errors.push(`_typography.scss missing @font-face for Inter-${w}.woff2`);
  }
}

if (errors.length === 0) { console.log('✓ check-inter-font: PASS'); process.exit(0); }
console.error('✗ check-inter-font:');
for (const e of errors) console.error('  ' + e);
process.exit(1);
```

- [ ] **Step 3: Wire both into `package.json`**

Add:
- `"check:tab-bar-pattern": "node scripts/check-tab-bar-pattern.mjs"`
- `"check:inter-font": "node scripts/check-inter-font.mjs"`

Append both to `check:guards`: ` && npm run check:tab-bar-pattern && npm run check:inter-font`.

- [ ] **Step 4: Run**

Run: `npm run check:guards`
Expected: `check-tab-bar-pattern` warns (tabs not re-skinned yet); `check-inter-font` PASSES (Phase 0/2 already shipped the woff2 and typography). Aggregate exits 0.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-tab-bar-pattern.mjs scripts/check-inter-font.mjs package.json
git commit -m "feat(guard): add check-tab-bar-pattern (soft-warn) + check-inter-font (hard)

tab-bar-pattern: ensures <ion-tab-bar> sits inside <ion-tabs class='apple-tab-bar'>.
inter-font: verifies the 4 woff2 files + @font-face declarations exist."
```

---

## Phase 5 — Page re-skin (tab by tab)

**Phase invariant:** Each task in this phase re-skins one app area. After each task, build is green and the soft-warn guard count for that area drops to zero (or to a documented remainder). At the end of Phase 5, **zero** `var(--ion-color-*)` references remain in `src/app/**`, **zero** `box-shadow` violations remain, **zero** `font-weight: 500` remain, **zero** `<ion-segment>` remain, and **all 4** floating-label HTMLs have been converted to `.apple-field`.

### Re-skin template (used by every Phase 5 task)

Every page re-skin follows the same recipe — apply this template, do not deviate:

**Token replacement table** (apply with `sed -i` or careful Edit):

| Old | New |
|---|---|
| `var(--ion-color-primary)` | `var(--apple-primary)` |
| `var(--ion-color-primary-shade)` | `var(--apple-primary-focus)` |
| `var(--ion-color-primary-tint)` | `var(--apple-primary-on-dark)` |
| `var(--ion-color-secondary)` | `var(--apple-primary)` (CTA collapses into primary) |
| `var(--ion-color-tertiary)` | `var(--apple-ink-muted-80)` |
| `var(--ion-color-success)` | `var(--apple-semantic-success)` |
| `var(--ion-color-warning)` | `var(--apple-semantic-warning)` |
| `var(--ion-color-danger)` | `var(--apple-semantic-danger)` |
| `var(--ion-color-medium)` | `var(--apple-ink-muted-48)` |
| `var(--ion-color-light)` | `var(--apple-canvas-parchment)` |
| `var(--ion-background-color)` | `var(--apple-canvas)` |
| `var(--ion-text-color)` | `var(--apple-ink)` |
| `var(--primary-500)` … and Sage scale | nearest `--apple-primary` / `--apple-ink-muted-*` per DS v3.0 §11 mapping table |
| `var(--accent-500)` Coral | `var(--apple-primary)` (Coral folds into single accent) |
| `var(--bg-page)` | `var(--apple-canvas-parchment)` |
| `var(--bg-card)` | `var(--apple-canvas)` |
| `var(--bg-elevated)` | `var(--apple-surface-pearl)` |
| `var(--bg-muted)` | `var(--apple-divider-soft)` |
| `var(--text-primary)` | `var(--apple-ink)` |
| `var(--text-secondary)` | `var(--apple-ink-muted-80)` |
| `var(--text-tertiary)` | `var(--apple-ink-muted-48)` |
| `var(--border-color)` | `var(--apple-hairline)` |

**Component class swaps (HTML):**

| Old | New |
|---|---|
| `<ion-card>` | `<div class="apple-card">` (with inner `.apple-card__title` / `__body` / `__meta`) |
| `<ion-segment>` + `<ion-segment-button>` | `<div class="apple-chip-row">` + `<button class="apple-chip" [class.apple-chip--selected]>` |
| `<ion-searchbar>` | `<div class="apple-search">` + `<ion-icon name="search-outline" class="apple-search__icon">` + `<input class="apple-search__input">` |
| Floating-label `<div class="input-wrapper"><label class="input-label"><input class="input-native">` | `<div class="apple-field"><label class="apple-field__label"><input class="apple-field__input">` |
| `<ion-button>` primary CTA | `<button class="apple-btn--primary">` (or keep `<ion-button>` and add `class="apple-btn--primary"` if Ionic event handling is needed) |
| `<ion-fab-button>` | `<button class="apple-btn--icon-circular">` floating, OR keep `<ion-fab-button>` re-styled in the page scss |

**Typography swaps (SCSS):**

| Old | New |
|---|---|
| `font-size: var(--font-size-display);` | `font: var(--apple-type-display-md); letter-spacing: var(--apple-track-display-md);` |
| `font-size: var(--font-size-headline);` | `font: var(--apple-type-tagline); letter-spacing: var(--apple-track-tagline);` |
| `font-size: var(--font-size-title);` | `font: var(--apple-type-body-strong); letter-spacing: var(--apple-track-body);` |
| `font-size: var(--font-size-body);` | `font: var(--apple-type-body); letter-spacing: var(--apple-track-body);` |
| `font-size: var(--font-size-caption);` | `font: var(--apple-type-caption); letter-spacing: var(--apple-track-caption);` |
| `font-weight: 500;` | `font-weight: 400;` (or 600 if the element was meant to feel "semibold") |
| `font-family: var(--font-display);` | drop the line (Inter is the only font) |
| `box-shadow: var(--shadow-sm/md/lg/xl);` | delete the line (no shadows on UI chrome) |
| `box-shadow: <hex/rgba>;` on `<img>` of a meal/ingredient photo | `box-shadow: var(--apple-shadow-product); // allow-shadow: product photo (DS v3.0 §2.5)` |
| `border-radius: var(--radius-sm/md/lg/xl)` | nearest `--apple-radius-*` from the DS v3.0 §4 mapping |

**Per-area workflow (5 steps, repeated every task):**

1. Run `grep -rln "ion-color-\|font-weight: 500\|box-shadow\|input-wrapper\|ion-segment" src/app/<AREA>/` to enumerate the affected files.
2. For each file, apply the token-replacement table + class-swap table.
3. Update the page HTML to wrap with `<ion-header class="apple-nav-bar">` (44px nav bar) and re-skin any inner cards/buttons.
4. Run `ng build --configuration=development` — must succeed.
5. Run `npm run check:guards` — soft-warn count must DECREASE; never increase.

After each task, commit with message `feat(<area>): re-skin to Apple design`.

---

### Task 5.1: Re-skin the tabs wrapper (root nav scaffold)

**Files:**
- Modify: `src/app/tabs/tabs.page.html` (path may differ — confirm with `find src/app/tabs -name "*.html"`)
- Modify: `src/app/tabs/tabs.page.scss` (or equivalent)

- [ ] **Step 1: Confirm tab wrapper location**

Run: `find src/app/tabs -maxdepth 2 -name "*.html" -o -name "*.scss" -o -name "*.ts"`
Expected: 3 files matching `tabs.*`.

- [ ] **Step 2: Add `class="apple-tab-bar"` to `<ion-tabs>`**

In `tabs.page.html`, change:

```html
<ion-tabs>
```

to:

```html
<ion-tabs class="apple-tab-bar">
```

- [ ] **Step 3: Switch tab icons to outline variants**

In the same file, for each `<ion-tab-button>`:
- `home` → `home-outline`
- `calendar` → `calendar-outline`
- `cube` → `cube-outline` (Quản lý)
- `barbell` → `barbell-outline` (Tập luyện)

(Confirm exact icon names by inspecting current HTML.)

- [ ] **Step 4: Strip legacy tab-bar styles from `tabs.page.scss`**

Open `tabs.page.scss`. Remove any `ion-tab-bar { --background: ...; --color: ...; --color-selected: ...; }` blocks — they are now provided by `_tab-bar.scss` globally. Keep only file-local rules that aren't about color/typography.

- [ ] **Step 5: Build + smoke-run**

Run: `ng build --configuration=development 2>&1 | tail -5`
Expected: SUCCESS.

Run: `npm run check:tab-bar-pattern`
Expected: ✓ PASS (now that `<ion-tabs>` carries `apple-tab-bar`).

- [ ] **Step 6: Commit**

```bash
git add src/app/tabs/
git commit -m "feat(tabs): re-skin to Apple bottom tab bar (iOS HIG, 49px)

class='apple-tab-bar' on <ion-tabs>; outline icons; --apple-primary as
active color. Legacy color tokens moved out of tabs.page.scss into
src/theme/_tab-bar.scss (Phase 3)."
```

---

### Task 5.2: Re-skin Dashboard (Tổng quan)

**Files:**
- Modify: all `src/app/features/dashboard/**/*.{html,scss}` (~6–10 files)

- [ ] **Step 1: Enumerate**

Run: `find src/app/features/dashboard -type f \( -name "*.html" -o -name "*.scss" \)`
List the files to be modified.

- [ ] **Step 2: Apply re-skin template to each file**

For each `.html`:
- Wrap top of page in `<ion-header class="apple-nav-bar"><ion-toolbar><ion-title size="large">Tổng quan</ion-title></ion-toolbar></ion-header>`.
- Replace all `<ion-card>` with `<div class="apple-card">`.
- Replace KPI numbers' wrapping span with `<span class="dashboard-hero-number">` styled via `font: var(--apple-type-display-lg); letter-spacing: var(--apple-track-display-lg);` in the page scss.
- Replace any `<ion-button color="primary">` with `<button class="apple-btn--primary">`.
- Hero greeting/illustration goes inside `<section class="apple-tile--light">`.

For each `.scss`:
- Apply token replacement table.
- Delete `box-shadow` lines (except product photos: add `// allow-shadow: product photo (DS v3.0 §2.5)`).
- Replace `font-weight: 500` with 400 or 600.
- Drop `font-family: var(--font-display);` (Inter is sole font).

- [ ] **Step 3: Build**

Run: `ng build --configuration=development 2>&1 | tail -5`
Expected: SUCCESS.

- [ ] **Step 4: Verify guard counts**

Run: `npm run check:guards 2>&1 | grep -E "(check-(no-box-shadow|no-weight-500|apple-input-pattern|no-segment-control))"`
Expected: counts for `src/app/features/dashboard/` portion are zero. (Other areas still have warnings; that's expected.)

Spot-check:

Run: `grep -rn "ion-color-\|font-weight: 500\|box-shadow:" src/app/features/dashboard/ | grep -v "apple-shadow-product\|allow-shadow"`
Expected: no matches.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/dashboard/
git commit -m "feat(dashboard): re-skin to Apple design (cards, KPIs, hero)"
```

---

### Task 5.3: Re-skin Calendar (Lịch ăn) — includes chip-row + sticky bar

**Files:**
- Modify: all `src/app/features/calendar/**/*.{html,scss}`

- [ ] **Step 1: Enumerate**

Run: `find src/app/features/calendar -type f \( -name "*.html" -o -name "*.scss" \)`

- [ ] **Step 2: Replace `<ion-segment>` with chip row**

For each occurrence of `<ion-segment>...<ion-segment-button value="day">Ngày</ion-segment-button>...</ion-segment>`, replace with:

```html
<div class="apple-chip-row" role="tablist">
  <button class="apple-chip" [class.apple-chip--selected]="view() === 'day'" (click)="view.set('day')">Ngày</button>
  <button class="apple-chip" [class.apple-chip--selected]="view() === 'week'" (click)="view.set('week')">Tuần</button>
  <button class="apple-chip" [class.apple-chip--selected]="view() === 'month'" (click)="view.set('month')">Tháng</button>
</div>
```

(Adapt signal API to actual signal name — likely `view` or `currentView`. If the component uses a plain property, swap `()`/`set` for direct binding.)

In the component `.ts`, ensure `view` is a `signal<'day' | 'week' | 'month'>('day')`.

- [ ] **Step 3: Add `.apple-sticky-bar` for daily total**

At the bottom of `calendar.page.html` (still inside `<ion-content>`), append:

```html
<aside class="apple-sticky-bar">
  <span class="apple-sticky-bar__label">Tổng calo trong ngày</span>
  <span class="apple-sticky-bar__value">{{ totalCalories() }} kcal</span>
</aside>
```

- [ ] **Step 4: Apply re-skin template to all calendar files**

Same pattern as Dashboard: nav-bar wrapping, `<ion-card>` → `.apple-card`, token replacements, drop shadows, drop weight-500.

- [ ] **Step 5: Build + guards + commit**

Run: `ng build --configuration=development 2>&1 | tail -5`
Run: `npm run check:no-segment-control` → expect ✓ PASS for `src/app/features/calendar/` portion (no more `<ion-segment>` in this folder).

```bash
git add src/app/features/calendar/
git commit -m "feat(calendar): re-skin to Apple design

- Replace <ion-segment> with .apple-chip-row (Ngày/Tuần/Tháng)
- Add .apple-sticky-bar for daily total calories
- .apple-nav-bar with large title 'Lịch ăn'
- Cards re-skinned to .apple-card"
```

---

### Task 5.4: Re-skin Management (Quản lý) — 4 sub-pages, has all 4 floating-label HTMLs

**Files:**
- Modify: `src/app/features/management/**/*.{html,scss}`
- This area contains: ingredient-list, ingredient-edit, meal-list, meal-edit pages plus shared components

- [ ] **Step 1: Enumerate**

Run: `find src/app/features/management -type f -name "*.html" -o -name "*.scss"`

Run: `grep -rln "input-wrapper" src/app/features/management/`
Expected: this is where most/all of the 4 floating-label HTMLs live.

- [ ] **Step 2: Convert each floating-label form to `.apple-field`**

For each HTML using `<div class="input-wrapper">`:

Before:
```html
<div class="input-wrapper" [class.invalid]="form.controls.name.invalid && form.controls.name.touched">
  <label class="input-label" [class.invalid]="...">Tên nguyên liệu</label>
  <input class="input-native" type="text" formControlName="name" />
</div>
```

After:
```html
<div class="apple-field" [class.apple-field--error]="form.controls.name.invalid && form.controls.name.touched">
  <label class="apple-field__label" for="ing-name">Tên nguyên liệu</label>
  <input class="apple-field__input" id="ing-name" type="text" formControlName="name" />
  @if (form.controls.name.invalid && form.controls.name.touched) {
    <p class="apple-field__error">Bắt buộc nhập</p>
  }
</div>
```

For picker triggers (`.picker-trigger--floating`):

```html
<button class="apple-field__picker" type="button" (click)="openUnitPicker()">
  <span>{{ selectedUnit() }}</span>
  <ion-icon name="chevron-down-outline"></ion-icon>
</button>
```

(Wrap in `<div class="apple-field"><label class="apple-field__label">Đơn vị</label> ... </div>` if it's a labeled control.)

- [ ] **Step 3: Replace search bar on list pages**

In `ingredient-list.page.html` and `meal-list.page.html`, replace `<ion-searchbar>` with:

```html
<div class="apple-search">
  <ion-icon name="search-outline" class="apple-search__icon"></ion-icon>
  <input class="apple-search__input" type="search" placeholder="Tìm nguyên liệu..." [(ngModel)]="searchQuery" />
</div>
```

(Adjust `[(ngModel)]` to the actual signal/property used.)

- [ ] **Step 4: Filter chips on list pages**

Replace any filter `<ion-segment>` with `<div class="apple-chip-row">` (same pattern as Calendar).

- [ ] **Step 5: Card list items**

Convert `<ion-item>` rows or `<ion-card>` items to `<div class="apple-card">` with inner `__title` / `__meta` / `__image--product` (for ingredient/meal photos).

- [ ] **Step 6: FAB → circular icon button**

Replace `<ion-fab><ion-fab-button>` floats with a fixed-positioned `<button class="apple-btn--icon-circular">` containing the add icon, OR keep `<ion-fab-button>` and add `class="apple-btn--icon-circular"`.

- [ ] **Step 7: Apply re-skin template (tokens / shadows / weights)** to all 4 sub-pages

- [ ] **Step 8: Build + guards + commit**

Run: `ng build --configuration=development 2>&1 | tail -5`
Run: `npm run check:apple-input-pattern` → expect ✓ PASS for `src/app/features/management/` portion.
Run: `grep -rln "input-wrapper" src/app/features/management/` → expect no matches.

```bash
git add src/app/features/management/
git commit -m "feat(management): re-skin to Apple design (4 sub-pages)

- 4 floating-label forms → .apple-field (ingredient-edit, meal-edit)
- <ion-searchbar> → .apple-search on ingredient-list, meal-list
- <ion-segment> filter chips → .apple-chip-row
- <ion-card> list items → .apple-card with __image--product shadow
- FAB → .apple-btn--icon-circular"
```

---

### Task 5.5: Re-skin Fitness (Tập luyện)

**Files:**
- Modify: `src/app/features/fitness/**/*.{html,scss}`

- [ ] **Step 1: Enumerate**

Run: `find src/app/features/fitness -type f -name "*.html" -o -name "*.scss"`

- [ ] **Step 2: Apply re-skin template**

- Exercise list items → `.apple-card`
- Add/edit form → `.apple-field`
- Timer / metric display → `<section class="apple-tile--light">` with `font: var(--apple-type-display-md)` for the time digits
- Buttons → `.apple-btn--primary` / `.apple-btn--secondary`

- [ ] **Step 3: Build + commit**

```bash
git add src/app/features/fitness/
git commit -m "feat(fitness): re-skin to Apple design (cards, forms, timer tile)"
```

---

### Task 5.6: Re-skin Settings (Cài đặt)

**Files:**
- Modify: `src/app/features/settings/**/*.{html,scss}`

- [ ] **Step 1: Enumerate**

Run: `find src/app/features/settings -type f -name "*.html" -o -name "*.scss"`

- [ ] **Step 2: Settings root link list**

Replace `<ion-list><ion-item>...</ion-item></ion-list>` with a vertical stack where each link uses `font: var(--apple-type-dense-link)` (17px / line-height 2.41) and `color: var(--apple-ink)`. Chevron on the right via `<ion-icon name="chevron-forward-outline">`.

- [ ] **Step 3: Settings footer-like bottom section**

At the bottom of `settings.page.html`, add:

```html
<footer class="settings-footer">
  <a class="settings-footer__link" href="#">Điều khoản dịch vụ</a>
  <a class="settings-footer__link" href="#">Chính sách bảo mật</a>
  <p class="settings-footer__legal">© 2026 HealthMate AI</p>
</footer>
```

In `settings.page.scss`:

```scss
.settings-footer {
  background: var(--apple-canvas-parchment);
  padding: 64px var(--apple-space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--apple-space-sm);
}
.settings-footer__link {
  font: var(--apple-type-dense-link);
  color: var(--apple-primary);
  text-decoration: none;
}
.settings-footer__legal {
  font: var(--apple-type-fine-print);
  letter-spacing: var(--apple-track-fine);
  color: var(--apple-ink-muted-48);
  margin: var(--apple-space-md) 0 0;
}
```

- [ ] **Step 4: Re-skin edit sub-pages (profile, goals, etc.)** using the standard template — `.apple-field` for inputs, `.apple-btn--primary` for save.

- [ ] **Step 5: Build + commit**

```bash
git add src/app/features/settings/
git commit -m "feat(settings): re-skin to Apple design + parchment footer"
```

---

### Task 5.7: Re-skin Onboarding

**Files:**
- Modify: `src/app/features/onboarding/**/*.{html,scss}`

- [ ] **Step 1: Enumerate**

Run: `find src/app/features/onboarding -type f -name "*.html" -o -name "*.scss"`

- [ ] **Step 2: Each step wrapped in tile**

Wrap each step's content in `<section class="apple-tile--parchment">` (or `--light` alternating). Hero illustration on top, headline `font: var(--apple-type-display-lg); letter-spacing: var(--apple-track-display-lg);`, body `font: var(--apple-type-body);`.

- [ ] **Step 3: Hero CTA**

Final-step CTA button: `<button class="apple-btn--hero">Bắt đầu</button>` (18px / weight 300 / pill).

- [ ] **Step 4: Step indicator**

Step dots: ~10px circles, active = `var(--apple-primary)`, inactive = `var(--apple-hairline)`. Define `.onboarding-dots` in the page scss.

- [ ] **Step 5: Re-skin forms within onboarding (height, weight, goals)** using `.apple-field`.

- [ ] **Step 6: Build + commit**

```bash
git add src/app/features/onboarding/
git commit -m "feat(onboarding): re-skin to Apple design (tiles + hero CTA + dots)"
```

---

### Task 5.8: Re-skin `src/app/shared/components/`

**Files:**
- Modify: `src/app/shared/**/*.{html,scss}`

- [ ] **Step 1: Enumerate**

Run: `find src/app/shared -type f -name "*.html" -o -name "*.scss"`

- [ ] **Step 2: Apply re-skin template to every shared component**

Shared components are typically: list-card, macro-pill, modal headers, picker sheets, etc. For each:
- Tokens: replace per the table above.
- Box-shadow: delete or escape with `// allow-shadow: <reason>`.
- Weight 500: replace with 400 or 600.
- `<ion-card>` → `.apple-card`.
- `<ion-segment>` → `.apple-chip-row`.

For data-viz / category colors (e.g., macro chips using brand colors), keep raw hex BUT add `// allow-hardcode: <reason>` per existing convention.

- [ ] **Step 3: Build + commit**

```bash
git add src/app/shared/
git commit -m "feat(shared): re-skin all shared components to Apple design"
```

---

### Task 5.9: Sweep remaining areas + verify counts hit zero

**Files:**
- Modify: any remaining `src/app/**/*.{html,scss}` files

- [ ] **Step 1: Enumerate remaining violations**

Run:
```bash
echo "=== ion-color references ==="; grep -rln "var(--ion-color-" src/app/ | wc -l
echo "=== box-shadow ==="; grep -rEn "^\s*box-shadow\s*:" src/app/ src/theme/ | grep -v "apple-shadow-product\|allow-shadow" | wc -l
echo "=== weight 500 ==="; grep -rEn "font-weight\s*:\s*500" src/app/ src/theme/ | wc -l
echo "=== ion-segment ==="; grep -rEn "<ion-segment" src/app/ | wc -l
echo "=== input-wrapper ==="; grep -rln "input-wrapper" src/app/ | wc -l
```
Expected: all five counts are **0**.

If any count > 0, address them — typically tiny leftovers in app.component.scss, theme overrides, or one-off components.

- [ ] **Step 2: Build**

Run: `ng build --configuration=development 2>&1 | tail -5`
Expected: SUCCESS.

- [ ] **Step 3: Run aggregate guards (still soft-warn)**

Run: `npm run check:guards`
Expected: soft-warn counts for the 4 new guards = 0. Other guards still pass.

- [ ] **Step 4: Commit (only if files changed)**

```bash
git add src/app/
git commit -m "chore(skin): sweep last Apple re-skin holdouts (counts to zero)"
```

---

## Phase 6 — Flip guards to hard-fail + retire legacy guards

**Phase invariant:** All 4 soft-warn guards become hard-fail. `check-design-tokens.mjs` is updated to reject `var(--ion-color-*)` in app code. `check-css-vars.mjs` is updated to whitelist `--apple-*`. `check-form-input-pattern.mjs` is retired. `check-no-dark-mode.mjs` is strengthened with dark-tile patterns. At end, `npm run check:guards` is fully strict and exits 0.

### Task 6.1: Flip the 4 soft-warn guards to hard-fail by default

**Files:**
- Modify: `scripts/check-no-box-shadow.mjs`
- Modify: `scripts/check-no-weight-500.mjs`
- Modify: `scripts/check-no-segment-control.mjs`
- Modify: `scripts/check-apple-input-pattern.mjs`
- Modify: `scripts/check-tab-bar-pattern.mjs`

- [ ] **Step 1: Replace the STRICT-detection line in each script**

In every script above, find this line:

```js
const STRICT = process.env.GUARD_STRICT === '1' || process.argv.includes('--strict');
```

Replace with:

```js
// Phase 6: hard-fail is the default. Opt-out soft-warn with GUARD_SOFT=1.
const STRICT = !(process.env.GUARD_SOFT === '1' || process.argv.includes('--soft'));
```

- [ ] **Step 2: Run aggregate**

Run: `npm run check:guards`
Expected: ✓ PASS on all 5 newly-flipped guards (Phase 5 already drove their counts to zero). Exit 0.

If any guard fails: that means a violation slipped through Phase 5. Fix the underlying code, not the guard.

- [ ] **Step 3: Commit**

```bash
git add scripts/check-no-box-shadow.mjs scripts/check-no-weight-500.mjs scripts/check-no-segment-control.mjs scripts/check-apple-input-pattern.mjs scripts/check-tab-bar-pattern.mjs
git commit -m "feat(guard): flip 5 Apple-migration guards to hard-fail by default

Phase 6 of Apple migration. Soft-warn period ends; new code introducing
box-shadow, weight 500, ion-segment, legacy input-wrapper, or unmarked
ion-tabs now blocks the build. Opt-out: GUARD_SOFT=1 or --soft."
```

---

### Task 6.2: Update `check-design-tokens.mjs` to hard-fail `--ion-color-*`

**Files:**
- Modify: `scripts/check-design-tokens.mjs`

- [ ] **Step 1: Read current script**

Run: `wc -l scripts/check-design-tokens.mjs`

- [ ] **Step 2: Add `--ion-color-*` rejection in app code**

In the existing script, locate the violation loop. Add a new check: any line in `src/app/**/*.{scss,css}` (NOT `src/theme/variables.scss`) containing `var(--ion-color-` is a violation with message `--ion-color-* aliases are removed; use var(--apple-*) (DS v3.0)`.

Concrete patch — at the top of the file, add:

```js
const ION_COLOR_RE = /var\(--ion-color-/;
```

Inside `checkFile()`, before existing token checks, add:

```js
if (rel.startsWith('src/app/') && ION_COLOR_RE.test(line)) {
  violations.push({ rel, lineNum: i + 1, match: '--ion-color-*', snippet: line.trim().slice(0, 120) });
  continue;
}
```

(Adapt to the actual variable/function names in the existing script.)

- [ ] **Step 3: Run guard**

Run: `npm run check:design-tokens`
Expected: ✓ PASS (Phase 5 swept all `--ion-color-*` from `src/app/`).

If FAIL: a `--ion-color-*` reference slipped through. Find and fix it in app code.

- [ ] **Step 4: Commit**

```bash
git add scripts/check-design-tokens.mjs
git commit -m "feat(guard): check-design-tokens rejects var(--ion-color-*) in src/app/

Apple migration completion gate. The only place --ion-color-* is allowed
is src/theme/variables.scss (transitional legacy aliases, removed in
Phase 7 when legacy theme files are deleted)."
```

---

### Task 6.3: Update `check-css-vars.mjs` to whitelist `--apple-*`

**Files:**
- Modify: `scripts/check-css-vars.mjs`

- [ ] **Step 1: Read current whitelist**

Run: `grep -n "ion-\|swiper-" scripts/check-css-vars.mjs`
Expected: see the existing whitelist of `--ion-` and `--swiper-` prefixes.

- [ ] **Step 2: Add `--apple-` to the whitelist**

Locate the whitelist array and add `'--apple-'`. Exact form depends on script structure; if it's:

```js
const ALLOWED_PREFIXES = ['--ion-', '--swiper-'];
```

Change to:

```js
const ALLOWED_PREFIXES = ['--apple-', '--ion-', '--swiper-'];
```

- [ ] **Step 3: Run guard**

Run: `npm run check:css-vars`
Expected: ✓ PASS.

- [ ] **Step 4: Commit**

```bash
git add scripts/check-css-vars.mjs
git commit -m "feat(guard): check-css-vars whitelists --apple-* prefix"
```

---

### Task 6.4: Retire `check-form-input-pattern.mjs`

**Files:**
- Delete: `scripts/check-form-input-pattern.mjs`
- Modify: `package.json` (remove `check:form-pattern` and remove it from `check:guards`)
- Modify: `.husky/pre-commit` if it references the script directly (most likely it just calls `npm run check:guards`, so no edit needed)

- [ ] **Step 1: Delete the script**

Run: `git rm scripts/check-form-input-pattern.mjs`

- [ ] **Step 2: Remove from `package.json`**

Edit `package.json`:
- Remove the `"check:form-pattern": "node scripts/check-form-input-pattern.mjs"` line.
- In the `"check:guards"` value, remove `npm run check:form-pattern && ` (including the trailing ` && `).

- [ ] **Step 3: Run aggregate**

Run: `npm run check:guards`
Expected: ✓ PASS overall.

- [ ] **Step 4: Commit**

```bash
git add scripts/ package.json
git commit -m "chore(guard): retire check-form-input-pattern.mjs

Floating-label is no longer the canonical pattern (Apple migration
Phase 6). Replaced by check-apple-input-pattern.mjs (Phase 4 → 6)."
```

---

### Task 6.5: Strengthen `check-no-dark-mode.mjs` with dark-tile patterns

**Files:**
- Modify: `scripts/check-no-dark-mode.mjs`

- [ ] **Step 1: Add dark-tile patterns**

Open `scripts/check-no-dark-mode.mjs`. Locate the `PATTERNS` array (currently 5 entries). Append:

```js
  /\bsurface-tile-(?:1|2|3)\b/g,
  /\bdark-tile\b/g,
  /\bproduct-tile-dark\b/g,
  /\bapple-tile--dark\b/g,
```

- [ ] **Step 2: Run guard**

Run: `npm run check:no-dark-mode`
Expected: ✓ PASS (no usages anywhere in app code; the only mention is in DESIGN.md / specs which are already allowlisted).

- [ ] **Step 3: Commit**

```bash
git add scripts/check-no-dark-mode.mjs
git commit -m "feat(guard): check-no-dark-mode forbids dark-tile patterns

Strengthens the light-only invariant for Apple migration:
- surface-tile-1, surface-tile-2, surface-tile-3
- dark-tile, product-tile-dark, apple-tile--dark"
```

---

## Phase 7 — Delete legacy theme files

**Phase invariant:** All 8 legacy theme files in `src/theme/` are deleted. `variables.scss` is fully rewritten to contain ONLY Apple tokens (legacy Sage/Coral tokens and `--ion-color-*` aliases removed). `global.scss` no longer `@use`s legacy partials. Build green.

### Task 7.1: Delete 7 legacy theme partials

**Files:**
- Delete: `src/theme/_section.scss`
- Delete: `src/theme/button-row.scss` (or `_button-row.scss` — confirm exact name)
- Delete: `src/theme/form-field.scss`
- Delete: `src/theme/form-modal.scss`
- Delete: `src/theme/header-elevation.scss`
- Delete: `src/theme/list-card.scss`
- Delete: `src/theme/segment-control.scss`

- [ ] **Step 1: Confirm exact filenames**

Run: `ls src/theme/`
Expected: see all 8 current files. Confirm names match spec §1.1 list. Adjust this task if any names differ (e.g., `_section.scss` vs `section.scss`).

- [ ] **Step 2: Delete files**

Run:
```bash
git rm src/theme/_section.scss \
       src/theme/button-row.scss \
       src/theme/form-field.scss \
       src/theme/form-modal.scss \
       src/theme/header-elevation.scss \
       src/theme/list-card.scss \
       src/theme/segment-control.scss
```

(Use exact filenames from Step 1 output.)

- [ ] **Step 3: Remove `@use` lines from `src/global.scss`**

Edit `src/global.scss`. Delete any line referencing the deleted files (e.g., `@use 'theme/section';`, `@use 'theme/button-row';`, etc.). Keep only the new Apple partial `@use` lines.

- [ ] **Step 4: Build**

Run: `ng build --configuration=development 2>&1 | tail -20`
Expected: SUCCESS. If a build error references a deleted class (e.g., `.list-card`), find and replace it in the offending file — that's a stray legacy class that survived Phase 5.

- [ ] **Step 5: Commit**

```bash
git add src/theme/ src/global.scss
git commit -m "chore(theme): delete 7 legacy Sage Wellness partials

Apple migration Phase 7. All consumers re-skinned in Phase 5 to
.apple-* classes; legacy partials no longer used."
```

---

### Task 7.2: Rewrite `variables.scss` to Apple-only

**Files:**
- Modify: `src/theme/variables.scss`

- [ ] **Step 1: Backup current file (mental note)**

You're about to delete ~150 lines of legacy tokens. The Apple block at the top of the file (added in Phase 1) is the only content that stays.

- [ ] **Step 2: Rewrite the file**

Replace the entire contents of `src/theme/variables.scss` with:

```scss
// HealthMate AI — Design System v3.0 "Apple"
// Source: docs/3-design/design-system.md v3.0
// Migration: Sage Wellness v2.0 → Apple (2026-05-17, Story 3.0)
// Light-only invariant. No dark tiles. No Sage / Coral / Plum tokens.
// =============================================================================

:root {
  // --- Colors -------------------------------------------------------------
  --apple-primary: #0066cc;
  --apple-primary-focus: #0071e3;
  --apple-primary-on-dark: #2997ff;
  --apple-ink: #1d1d1f;
  --apple-body-on-dark: #ffffff;
  --apple-body-muted: #cccccc;
  --apple-ink-muted-80: #333333;
  --apple-ink-muted-48: #7a7a7a;
  --apple-divider-soft: #f0f0f0;
  --apple-hairline: #e0e0e0;
  --apple-canvas: #ffffff;
  --apple-canvas-parchment: #f5f5f7;
  --apple-surface-pearl: #fafafc;
  --apple-surface-chip: rgba(210, 210, 215, 0.64); // allow-hardcode: Apple translucent chip surface
  --apple-surface-black: #000000;
  --apple-on-primary: #ffffff;
  --apple-on-dark: #ffffff;

  // --- Semantic -----------------------------------------------------------
  --apple-semantic-success: #0066cc;
  --apple-semantic-warning: #333333;
  --apple-semantic-danger: #bf4800;

  // --- Spacing ------------------------------------------------------------
  --apple-space-xxs: 4px;
  --apple-space-xs: 8px;
  --apple-space-sm: 12px;
  --apple-space-md: 17px;
  --apple-space-lg: 24px;
  --apple-space-xl: 32px;
  --apple-space-xxl: 48px;
  --apple-space-section: 80px;

  // --- Radius -------------------------------------------------------------
  --apple-radius-none: 0;
  --apple-radius-xs: 5px;
  --apple-radius-sm: 8px;
  --apple-radius-md: 11px;
  --apple-radius-lg: 18px;
  --apple-radius-pill: 9999px;
  --apple-radius-full: 9999px;

  // --- Elevation ----------------------------------------------------------
  --apple-shadow-product: 3px 5px 30px 0 rgba(0, 0, 0, 0.22); // allow-hardcode: single product photo drop-shadow
  --apple-shadow-none: none;

  // --- Backdrop -----------------------------------------------------------
  --apple-backdrop-blur: saturate(180%) blur(20px);
  --apple-frosted-bg: rgba(245, 245, 247, 0.8); // allow-hardcode: frosted sticky bar
}

// Responsive --apple-space-section (DS v3.0 §5)
@media (max-width: 833px) { :root { --apple-space-section: 48px; } }
@media (max-width: 640px) { :root { --apple-space-section: 32px; } }
@media (max-width: 419px) { :root { --apple-space-section: 24px; } }
```

- [ ] **Step 3: Build**

Run: `ng build --configuration=development 2>&1 | tail -10`

If errors reference any of: `--ion-color-*`, `--font-display`, `--primary-N`, `--accent-N`, `--bg-page`, `--bg-card`, `--text-primary`, `--border-color`, `--space-N`, `--radius-N`, `--shadow-N`, `--scrim-*`, `--ease-*`, `--macro-*`, `--ai-card-*`, `--streak-*`, `--quick-action-*`, `--font-size-*`, `--input-bg`, `--input-border-color`, `--bg-card-accent`, `--bg-sunken`, `--ion-font-family`, `--ion-background-color`, `--ion-text-color`, `--ion-toolbar-background`, `--ion-tab-bar-*`, `--ion-border-color`, `--spacing-section`, `--focus-ring`, `--z-*` — that's a leftover from Phase 5.

Fix by mapping each leftover variable to its `--apple-*` equivalent (use spec §11 migration mapping table) and re-running.

- [ ] **Step 4: Run full guard suite**

Run: `npm run check:guards`
Expected: all 14 guards exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/theme/variables.scss
git commit -m "chore(theme): variables.scss is Apple-only

Apple migration Phase 7 completion. All legacy Sage / Coral / Plum
tokens removed. --ion-color-* aliases removed. Body of file is now
~70 lines vs ~250 in v2.0."
```

---

### Task 7.3: Final theme directory sanity

**Files:** none (verification only)

- [ ] **Step 1: Verify final theme directory contents**

Run: `ls src/theme/`
Expected: exactly 11 files:
- `variables.scss`
- `_typography.scss`
- `_button.scss`
- `_card.scss`
- `_chip.scss`
- `_field.scss`
- `_search.scss`
- `_tile.scss`
- `_sticky-bar.scss`
- `_tab-bar.scss`
- `_nav-bar.scss`

Adjust counts if anything is missing or extra.

- [ ] **Step 2: Verify `global.scss` `@use` block**

Run: `grep "^@use 'theme/" src/global.scss`
Expected: 10 lines (typography + button + card + chip + field + search + tile + sticky-bar + tab-bar + nav-bar). `variables.scss` is loaded via Ionic's pipeline, not via `@use`.

- [ ] **Step 3: Smoke run in browser (Capacitor not required)**

Run: `ionic serve` (or `ng serve`) in a separate terminal.

Manually verify:
- All 4 tabs render with `--apple-primary` active color and outline icons.
- Dashboard shows Action Blue accents, Inter font, no green.
- Open `ingredient-edit` page; form uses `.apple-field` with hairline-bordered rectangular inputs.

Stop the dev server when done.

- [ ] **Step 4: Commit (only if verification surfaced fixes)**

If any visual regressions surface, fix them inline and commit. Otherwise, no commit needed.

---

## Phase 8 — Documentation rewrite

**Phase invariant:** `docs/3-design/design-system.md` is v3.0 (Apple). Two UX specs are fully rewritten. Two README files updated. `coding-conventions.md` reflects Apple-field + Apple tokens + Inter ladder + iOS HIG nav. New ADR `apple-design-migration.md` committed. `CLAUDE.md` updated. All `Sage`/`Coral`/`Lifesum` mentions removed from canonical docs. Guards all pass.

### Task 8.1: Rewrite `docs/3-design/design-system.md` to v3.0

**Files:**
- Modify: `docs/3-design/design-system.md` (full rewrite)

- [ ] **Step 1: Archive v2.0 reference in changelog**

Before rewriting, capture the v2.0 → v3.0 transition note. Plan: the new file ends with a Changelog table that includes a v3.0 row pointing back to this migration. We do NOT keep v2.0 body content.

- [ ] **Step 2: Write the new file**

Replace the entire contents of `docs/3-design/design-system.md` with a 12-section structure per spec §4.1. The new file should be ~1500–1700 lines. Use the following skeleton and fill each section with concrete content drawn from `DESIGN.md` and this spec:

```markdown
# HealthMate AI Design System — v3.0 "Apple"

**Status:** Active
**Previous:** v2.0 (Sage Wellness, superseded 2026-05-17 by Apple migration)
**Source of truth for visual language:** DESIGN.md (Apple-design-analysis)
**Light-only invariant:** No dark mode, no theme switching, no dark tile surfaces.

## 1. Overview & philosophy
Apple-for-mobile-app adaptation: card-first (not photography-first),
single-accent rule (Action Blue), no gradients, no decorative shadows
on UI chrome. Mobile-first using iOS HIG navigation (bottom Tab Bar +
top UINavigationBar).

## 2. Color palette
[Full 18-token table from spec §2.1 + 3 semantic + retired tokens block.]

## 3. Decorative depth
[--apple-shadow-product (single drop-shadow, product photos only).
Surface color change as divider. Backdrop blur for sticky bar.]

## 4. Shapes (radius)
[Radius scale 0/5/8/11/18/9999. Pill as signature CTA.]

## 5. Spacing
[4/8/12/17/24/32/48/80. Responsive --apple-space-section.]

## 6. Typography
[Inter ladder 300/400/600/700. No 500. Body 17px invariant.
Display tracking rules. Inter substitution adjustments.]

## 7. Components
[Navigation (iOS HIG: tab bar + nav bar). 6 button variants. Cards
(.apple-card, .apple-tile--light/parchment, .apple-sticky-bar).
Forms (.apple-field, .apple-search, .apple-chip-row). Settings footer.]

## 8. Form inputs (mandatory)
[Apple-field canonical pattern (replaces former §8.6 floating-label).
Markup, scss, do/don't.]

## 9. Do's and Don'ts
[Adapted from DESIGN.md. App-specific additions: no segment control,
no dark tile surfaces, no hamburger, no apple.com global-nav, no
weight 500.]

## 10. Responsive behavior
[App breakpoints: 360 / 375 / 414 / 640 / 834 / 1024.
Hero typography scaling. Tab bar persistence.]

## 11. Migration mapping (Sage v2.0 → Apple v3.0)
[Side-by-side token table; aids reading legacy commits.]

## 12. Macro naming
[Protein / Carbs / Fat / Fiber — unchanged from v2.0.]

## Changelog
| Version | Date | Author | Notes |
|---|---|---|---|
| 3.0 | 2026-05-17 | Apple migration | Full visual rewrite. Sage Wellness retired. |
```

Fill each section with concrete content. Pull tables from this plan's earlier phases (Phase 1 for tokens, Phase 2 for typography, Phase 3 for components) and the spec §2–§3 for the master tables.

- [ ] **Step 3: Run docs guards**

Run: `npm run check:no-dark-mode`
Expected: ✓ PASS. (Allowlist includes `docs/3-design/` already? Let's verify.)

Run: `grep -E "Sage|Coral|Plum|Lifesum" docs/3-design/design-system.md`
Expected: matches only in §11 (migration mapping section, historical reference).

- [ ] **Step 4: Commit**

```bash
git add docs/3-design/design-system.md
git commit -m "docs(design): rewrite design-system.md to v3.0 (Apple)

Full Sage Wellness retirement. Tokens, typography, components,
navigation, do/don't, responsive, macro naming all aligned with
DESIGN.md and Apple migration spec."
```

---

### Task 8.2: Rewrite UX specs f-03 and f-04

**Files:**
- Modify: `docs/3-design/ux-specs/f-03-calendar-plan.md` (full rewrite)
- Modify: `docs/3-design/ux-specs/f-04-nutrition-tracking.md` (full rewrite)

- [ ] **Step 1: Confirm filenames**

Run: `ls docs/3-design/ux-specs/`

If the actual filenames differ slightly (e.g. `f-03-calendar.md`), use the actual names.

- [ ] **Step 2: Write each spec using the Apple template**

Each file uses this template (~300–500 lines):

```markdown
# F-0N: <Feature Name> UX Spec (Apple v3.0)

**Status:** Active | **Updated:** 2026-05-17 | **Design system:** v3.0

## Goal & user value
[1–2 paragraphs.]

## Navigation entry
- Tab: <which tab> (`.apple-tab-bar` icon + label)
- Nav bar title: "<title>" rendered via `.apple-nav-bar` + `<ion-title size="large">`
- Back behavior: <if any>

## Page structure
1. `.apple-nav-bar` (44px) with large title
2. Optional `.apple-chip-row` for view filters
3. `<ion-content>`:
   - `.apple-tile--light` or `--parchment` sections
   - `.apple-card` list items
   - Empty / loading / error states
4. Optional `.apple-sticky-bar` (bottom-floating frosted bar)
5. `.apple-tab-bar` (49px) inherited from tabs wrapper

## Component inventory
[Table: which Apple component is used where, with token references.]

## Empty / loading / error states
[Use Apple grammar: --apple-ink-muted-48 muted text, no semantic green
for "all good" states, --apple-semantic-danger only for destructive
confirmation.]

## Edge cases
[List behaviors: offline, partial data, very long lists, etc.]
```

Fill in concretely for f-03 (Calendar / meal plan) and f-04 (Nutrition tracking) based on the existing functionality. Reference Phase 5 task 5.3 (Calendar) and 5.2 (Dashboard) for the actual UI structure.

- [ ] **Step 3: Commit**

```bash
git add docs/3-design/ux-specs/
git commit -m "docs(ux): rewrite f-03 + f-04 UX specs to Apple v3.0"
```

---

### Task 8.3: Update `explorations/README.md` and `mockups/README.md`

**Files:**
- Modify: `docs/3-design/explorations/README.md` (~80–120 lines)
- Modify: `docs/3-design/mockups/README.md` (~80–120 lines)

- [ ] **Step 1: Rewrite each README**

Use this skeleton for both:

```markdown
# <Folder> — Design <Explorations | Mockups>

This folder contains <pre-direction exploration artifacts | mockup deliverables>
for HealthMate AI design work.

## Source of truth
The canonical design system is `docs/3-design/design-system.md` v3.0 "Apple".
Artifacts in this folder may pre-date the Apple migration (2026-05-17) and
may reflect retired Sage Wellness v2.0 patterns. Do not implement from
artifacts here without cross-checking against design-system.md.

## Naming convention
- `YYYY-MM-DD-<topic>.<ext>` for new artifacts.
- Legacy filenames preserved unchanged.

## Folder index
[Auto-generated or manually maintained list of folder contents.]
```

- [ ] **Step 2: Commit**

```bash
git add docs/3-design/explorations/README.md docs/3-design/mockups/README.md
git commit -m "docs(design): point explorations + mockups READMEs at v3.0 Apple SSOT"
```

---

### Task 8.4: Update `docs/3-design/data-model.md` header note

**Files:**
- Modify: `docs/3-design/data-model.md` (one-line header note)

- [ ] **Step 1: Add header note**

Locate the top of the file. After the title heading, add a single line:

```markdown
> **Note (2026-05-17):** Data model is independent of the visual system. The DB schema documented here is unchanged by the Apple design migration; see `design-system.md` v3.0 for visual tokens and components.
```

- [ ] **Step 2: Commit**

```bash
git add docs/3-design/data-model.md
git commit -m "docs(data-model): clarify independence from visual design migration"
```

---

### Task 8.5: Update `docs/4-architecture/coding-conventions.md`

**Files:**
- Modify: `docs/4-architecture/coding-conventions.md`

- [ ] **Step 1: Replace §8.6 (Form Inputs)**

Locate `## §8.6` or the form inputs section. Replace its body with:

```markdown
### §8.6 Form Inputs (MANDATORY)

ALL text/number/select inputs across the app MUST use the canonical
Apple-field pattern defined in `src/theme/_field.scss`. See
`docs/3-design/design-system.md` §8.

Required markup:
```html
<div class="apple-field" [class.apple-field--error]="hasError">
  <label class="apple-field__label" for="x">Label</label>
  <input class="apple-field__input" id="x" type="text" />
</div>
```

For select-like triggers, use `<button class="apple-field__picker">`
inside the same `.apple-field` wrapper.

DO NOT:
- Use legacy `.input-wrapper` / `.input-label` / `.input-native`
  (retired 2026-05-17, Apple migration Phase 5).
- Use `.picker-trigger--floating` (retired same time).
- Inline input styles in component `.ts` files.
- Use `ion-input` standalone without the `.apple-field` wrapper.

Guard: `scripts/check-apple-input-pattern.mjs` runs on every commit.
Floating-label guard `check-form-input-pattern.mjs` was retired in
Phase 6.
```

- [ ] **Step 2: Add new §N — Design tokens**

Append a new section (number it sequentially in the file) titled "Design Tokens":

```markdown
### §N Design Tokens (MANDATORY)

ALL `color` / `background` / `background-color` / `font-size` in
`*.scss` / `*.css` MUST use a `var(--apple-*)` token defined in
`src/theme/variables.scss`. Raw hex / rgb / rgba / hsl / named colors /
raw `<n>px` font-size are forbidden.

**`var(--ion-color-*)` is forbidden in `src/app/**`** — these aliases
were removed in the Apple migration (Phase 7, 2026-05-17). Only Ionic's
own internal `--ion-*` variables (e.g., `--ion-safe-area-top`) are
permitted via `check-css-vars.mjs`.

Allowed non-token values: `inherit`, `transparent`, `currentColor`,
`unset`, `initial`, `0`, and values already wrapped in `var(...)`.

Escape hatch: `// allow-hardcode: <reason>` on the same line, the line
above, or inside a multi-line value. Reason mandatory.

Guards: `check-design-tokens.mjs` + `check-css-vars.mjs`.
```

- [ ] **Step 3: Add new §N — Typography**

```markdown
### §N Typography (MANDATORY)

Inter is the only UI font. Weight ladder: 300, 400, 600, 700. Weight 500
is forbidden (guard: `check-no-weight-500.mjs`).

Use the 15 shorthand typography tokens defined in `src/theme/_typography.scss`:

```scss
.example { font: var(--apple-type-body); letter-spacing: var(--apple-track-body); }
```

Body text is always 17px. Display sizes carry pre-tightened
`letter-spacing` per the Inter substitution adjustments.

Do not declare raw `font-family: 'Inter'` or raw `font-size: <n>px` —
always use a token.
```

- [ ] **Step 4: Add new §N — Navigation**

```markdown
### §N Navigation (iOS HIG)

Bottom navigation:
- `<ion-tabs class="apple-tab-bar">` is required for the root tab scaffold.
- Outline icons (not filled). Active color `var(--apple-primary)`.
- Guard: `check-tab-bar-pattern.mjs`.

Top navigation:
- `<ion-header class="apple-nav-bar">` on every page.
- Tab-root pages enable large title via `<ion-title size="large">`.
- Sub-pages use the standard 44px nav bar (no large title).
- Back button: `<ion-back-button>` with `var(--apple-primary)` color.

No alternative nav containers (no custom header bars, no hamburger drawers,
no apple.com-style global-nav black bar). iOS HIG patterns only.
```

- [ ] **Step 5: Remove all Sage / Coral / Lifesum mentions**

Run: `grep -n "Sage\|Coral\|Lifesum\|Plum" docs/4-architecture/coding-conventions.md`
Replace any remaining mentions with Apple equivalents or delete the section.

- [ ] **Step 6: Commit**

```bash
git add docs/4-architecture/coding-conventions.md
git commit -m "docs(conventions): update for Apple migration

- §8.6: Apple-field replaces floating-label
- New §N: Design tokens (--apple-* mandatory)
- New §N: Typography (Inter ladder, no weight 500)
- New §N: Navigation (iOS HIG)
- All Sage / Coral / Lifesum / Plum mentions removed."
```

---

### Task 8.6: Create new ADR `apple-design-migration.md`

**Files:**
- Create: `docs/4-architecture/decisions/apple-design-migration.md`

> **Naming:** existing ADRs use plain topic filenames (e.g., `calendar-tracking.md`), not `ADR-NNN-` prefixes.

- [ ] **Step 1: Write the ADR**

Create the file with this content (~200 lines):

```markdown
# ADR: Apple Design Migration

**Status:** Accepted
**Date:** 2026-05-17
**Supersedes:** (none — Sage Wellness v2.0 had no formal ADR)

## Context

In v0.1.x, the app used Material Blue. In v0.2.0, a migration to "Sage
Wellness v2.0" was completed (Sage primary + Coral CTA + warm neutrals).
On 2026-05-17 the user directed a further migration to a 1:1 adaptation
of the Apple design language as documented in `DESIGN.md` at the repo
root.

The user chose a Big Bang approach: single spec, single implementation
plan, single PR sequence.

## Decision

Migrate the entire visual system to Apple in one coordinated change.

Token system: `--apple-*` only. All 18 color tokens + 3 semantic +
spacing/radius/elevation/backdrop, defined in `src/theme/variables.scss`.

Typography: Inter, bundled at `src/assets/fonts/`, weights 300/400/600/700.
15 typography shorthand tokens. Weight 500 is forbidden.

Components: 9 new theme partials providing `.apple-tab-bar`,
`.apple-nav-bar`, `.apple-card`, `.apple-tile--{light,parchment}`,
`.apple-chip` / `.apple-chip-row`, `.apple-field` / `.apple-field__picker`,
`.apple-search`, `.apple-sticky-bar`, and 6 button variants
(`.apple-btn--{primary,secondary,dark-utility,pearl,hero,icon-circular}`).

Navigation: iOS HIG (bottom Tab Bar 49px + top UINavigationBar 44px). The
apple.com web patterns (black 44px `global-nav` + frosted `sub-nav`) are
**not** adopted — DESIGN.md analyzes apple.com (a marketing website),
which is the wrong pattern for a mobile utility app.

CI: 4 new guards (check-no-box-shadow, check-no-weight-500,
check-no-segment-control, check-apple-input-pattern, check-tab-bar-pattern,
check-inter-font), 3 updated guards (check-design-tokens to reject
`--ion-color-*`, check-css-vars to whitelist `--apple-*`,
check-no-dark-mode strengthened with dark-tile patterns), 1 retired
guard (check-form-input-pattern).

## Consequences

**Removed:**
- Sage / Coral / Plum colors; warm neutrals
- Floating-label form inputs
- `<ion-segment>` / `<ion-segment-button>`
- Dark tile surfaces (light-only invariant strengthened)
- `box-shadow` on UI chrome (only photo product-shadow allowed)
- Weight-500 typography
- `--ion-color-*` aliases in app code

**Added:**
- Action Blue single accent
- Inter font (4 weights, ~280 KB woff2 in `src/assets/fonts/`)
- `.apple-field` form pattern
- `.apple-chip-row` (replaces segment control)
- `.apple-card`, `.apple-sticky-bar`, `.apple-tile--*`
- `.apple-nav-bar` (iOS UINavigationBar re-skin of `<ion-header>`)
- `.apple-tab-bar` (iOS Tab Bar re-skin of `<ion-tab-bar>`)

**Trade-offs:**
- APK size +~280 KB from bundled Inter (acceptable per offline-first
  design — no network font fetch on cold start)
- Visual change is large; users will see a fundamentally different
  palette (sage green → Apple blue) and typography
- Removed semantic green / yellow weakens UX signal for save / warning;
  compensated by copy + icon prominence per Apple Do's rule

## Alternatives considered

1. **Phased migration** (one tab at a time, multi-month timeline).
   Rejected — user chose Big Bang.

2. **Theme-only** (swap color tokens only, keep all components).
   Rejected — does not satisfy "1:1 Apple" directive; component
   semantics (card vs floating label vs segment) are core to the
   Apple language.

3. **apple.com-style top global-nav + hamburger drawer**.
   Rejected after recognizing that iOS HIG mandates Tab Bar for
   top-level destinations on mobile apps; apple.com patterns are
   designed for desktop marketing.

## Status / Acceptance

Accepted 2026-05-17.

Implementation plan: `docs/superpowers/plans/2026-05-17-apple-design-migration.md`.
Design spec: `docs/superpowers/specs/2026-05-17-apple-design-migration-design.md`.
```

- [ ] **Step 2: Commit**

```bash
git add docs/4-architecture/decisions/apple-design-migration.md
git commit -m "docs(adr): add Apple design migration ADR

Documents the Big Bang migration from Sage Wellness v2.0 to Apple v3.0,
the iOS HIG navigation rationale, alternatives considered, and the
trade-offs accepted."
```

---

### Task 8.7: Update `CLAUDE.md`

**Files:**
- Modify: `/Users/khanhhuynh/person_project/MealPlaning/CLAUDE.md`

- [ ] **Step 1: Replace the "Form Inputs (MANDATORY)" block**

Locate `### Form Inputs (MANDATORY)`. Replace its body with the Apple-field section content from Task 8.5 Step 1.

- [ ] **Step 2: Replace the "Design Tokens (MANDATORY)" block**

Locate `### Design Tokens (MANDATORY)`. Replace its body with the Apple-tokens text from Task 8.5 Step 2.

- [ ] **Step 3: Update the "Architecture Guards (CI-enforced)" table**

Replace the 7-row table with a 14-row table reflecting the post-Phase-6 guard list:

| Script | Purpose | Reference |
|---|---|---|
| `check-apple-input-pattern.mjs` | Apple-field canonical markup. | design-system §8 |
| `check-pc1-external-templates.mjs` | PC-1 binary rule. | conventions §2.2 |
| `check-style-2025-naming.mjs` | Style 2025 naming. | conventions §1 |
| `check-design-tokens.mjs` | `var(--apple-*)` only; rejects `--ion-color-*`. | design-system §2 |
| `check-css-vars.mjs` | Whitelists `--apple-`, `--ion-`, `--swiper-`. | (internal) |
| `check-macro-naming.mjs` | Full English macros. | design-system §12 |
| `check-version-sync.mjs` | Version sync. | (internal) |
| `check-status-ssot.mjs` | Story status SSOT. | investigation 2026-05-08 |
| `check-no-dark-mode.mjs` | Light-only + no dark tiles. | ADR apple-design-migration |
| `check-story-scope.mjs` | Story scope stability. | (internal) |
| `check-repo-columns.mjs` | DB column SSOT. | (internal) |
| `check-no-box-shadow.mjs` | Only `var(--apple-shadow-product)`. | design-system §3 |
| `check-no-weight-500.mjs` | Inter ladder 300/400/600/700. | design-system §6 |
| `check-no-segment-control.mjs` | No `<ion-segment>`. | design-system §7 |
| `check-tab-bar-pattern.mjs` | `<ion-tabs class="apple-tab-bar">`. | design-system §7 |
| `check-inter-font.mjs` | Inter woff2 + `@font-face` present. | design-system §6 |

Drop `check-form-input-pattern.mjs` (retired).

- [ ] **Step 4: Strip all Sage / Coral / Lifesum mentions**

Run: `grep -n "Sage\|Coral\|Lifesum\|Plum" CLAUDE.md`
Edit or remove matches. The only `Sage` / `Coral` mentions allowed (if any) are inside the Apple-migration historical context paragraph (e.g., "as of Phase 6, Sage Wellness retired").

- [ ] **Step 5: Run guards**

Run: `npm run check:guards`
Expected: ✓ PASS all 16 guards.

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): update CLAUDE.md for Apple migration

- Form Inputs block: Apple-field replaces floating-label
- Design Tokens block: --apple-* mandatory; --ion-color-* rejected
- Guards table: 16 entries (was 7); reflects post-Phase-6 state
- All Sage / Coral / Lifesum / Plum mentions removed."
```

---

## Phase 9 — Version bump, smoke test, merge

### Task 9.1: Bump version 0.2.2 → 0.3.0

**Files:**
- Modify: `package.json` (version field)
- Modify: any other version-sync targets (`check-version-sync.mjs` will tell you)

- [ ] **Step 1: Bump `package.json`**

Edit `package.json` `version` field: `0.2.2` → `0.3.0`.

- [ ] **Step 2: Run version-sync guard**

Run: `npm run check:version-sync`
Expected: ✓ PASS. If FAIL, the guard tells you which file is out of sync — update each one to `0.3.0`.

Typical version-synced files (verify by reading the guard script):
- `android/app/build.gradle` (`versionName`)
- Any `package-lock.json` references
- `src/environments/*.ts` if a build version constant lives there

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(release): bump version 0.2.2 → 0.3.0 (Apple design migration)

Major visual change. Sage Wellness v2.0 retired; Apple v3.0 active.
See docs/4-architecture/decisions/apple-design-migration.md."
```

---

### Task 9.2: Final aggregate-guard run + format check

**Files:** none

- [ ] **Step 1: Run all guards in strict mode**

Run: `npm run check:guards`
Expected: ✓ PASS for all 16 guards.

- [ ] **Step 2: Run lint**

Run: `npm run lint 2>&1 | tail -10`
Expected: no errors. Warnings about unused imports etc. are acceptable but address obvious ones.

- [ ] **Step 3: Run format check**

Run: `npm run format:check 2>&1 | tail -10`
Expected: ✓ all files match Prettier.

If FAIL: `npm run format` and commit the formatting diff:

```bash
git add -A
git commit -m "chore: prettier sweep after Apple migration"
```

- [ ] **Step 4: Production build**

Run: `npm run build:prod 2>&1 | tail -20`
Expected: SUCCESS. APK / web bundle size delta is reasonable (web bundle grows by ~280 KB from Inter; everything else may shrink slightly due to removed legacy SCSS).

Take note of bundle size delta and include in PR description.

---

### Task 9.3: Capacitor Android smoke run

**Files:** none

- [ ] **Step 1: Sync to Android**

Run: `npx cap sync android`
Expected: SUCCESS. No font / asset errors.

- [ ] **Step 2: Run on emulator or device**

Run: `npx cap run android`

Manually verify on the running app:

1. Inter font loads on cold start (no font flash; text renders in Inter from the first frame).
2. All 4 tabs (Tổng quan, Lịch ăn, Quản lý, Tập luyện) render with `.apple-tab-bar`.
3. Open Dashboard — Action Blue accents, no Sage green anywhere.
4. Open Calendar — chip row (Ngày/Tuần/Tháng) functional, sticky bar visible at bottom.
5. Open Management → Ingredient → Edit — `.apple-field` form renders correctly, save button is pill primary.
6. Open Settings → footer parchment section is at the bottom.
7. Open Onboarding (first-run flow if accessible) — tiles + hero CTA.
8. Verify no visible regressions: lists scroll, modals open, sticky bar doesn't overlap tab bar.

- [ ] **Step 3: Capture screenshots for PR**

Take ~6 screenshots covering the 4 tabs + ingredient-edit + settings. Save to `_bmad-output/implementation-artifacts/apple-migration-screenshots/`.

- [ ] **Step 4: Commit screenshots**

```bash
git add _bmad-output/implementation-artifacts/apple-migration-screenshots/
git commit -m "docs(qa): apple migration smoke-run screenshots"
```

---

### Task 9.4: Push branch + open PR

**Files:** none

- [ ] **Step 1: Push**

Run: `git push -u origin feat/apple-design-migration`

- [ ] **Step 2: Open PR**

Run:

```bash
gh pr create --title "feat(design): Apple design migration (Big Bang, v0.3.0)" --body "$(cat <<'EOF'
## Summary
- Migrate the entire visual system from Sage Wellness v2.0 to Apple v3.0 per `DESIGN.md`.
- Replace 8 legacy theme files with 11 new Apple partials.
- Bundle Inter (4 weights, ~280 KB) at `src/assets/fonts/`.
- Re-skin all 43 HTML / 43 SCSS files in `src/app/` to `.apple-*` classes.
- Add 6 new CI guards (no-box-shadow, no-weight-500, no-segment-control, apple-input-pattern, tab-bar-pattern, inter-font).
- Update 3 guards (design-tokens, css-vars, no-dark-mode). Retire 1 (form-input-pattern).
- Rewrite 6 docs in `docs/3-design/` + new ADR + `CLAUDE.md` update.

## Test plan
- [ ] `npm run check:guards` passes (16 guards)
- [ ] `npm run lint` clean
- [ ] `npm run format:check` clean
- [ ] `npm run build:prod` succeeds
- [ ] `npx cap sync android` succeeds
- [ ] Smoke run on Android device: 4 tabs render Apple-styled, Inter font on cold start, `.apple-field` works on ingredient-edit
- [ ] Screenshots attached in `_bmad-output/implementation-artifacts/apple-migration-screenshots/`

Spec: `docs/superpowers/specs/2026-05-17-apple-design-migration-design.md`
Plan: `docs/superpowers/plans/2026-05-17-apple-design-migration.md`
ADR: `docs/4-architecture/decisions/apple-design-migration.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Wait for CI**

Run: `gh pr checks --watch`
Expected: all green.

If any check fails, address inline and push fix commits to the branch.

- [ ] **Step 4: Merge (only after review approval)**

Per user policy, merge is **not** automated. Wait for explicit user approval before:

```bash
gh pr merge --squash --delete-branch
```

---

## End of plan

Total commits expected: ~30–40 across 10 phases. Final state on `main`:
- Sage Wellness v2.0 fully retired.
- Apple v3.0 active across all 43 pages.
- 16 CI guards strict.
- Version 0.3.0.
