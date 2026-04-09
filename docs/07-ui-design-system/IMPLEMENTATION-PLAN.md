# Color System Implementation Plan

> **Phase**: 1 — Design Token Migration (Grayscale → Vibrant)
> **Source Spec**: `COLOR-PALETTE-SPEC.md` (commit 8c2684f)
> **Author**: Tech Leader Agent
> **Status**: READY FOR DEV EXECUTION

---

## 1. Executive Summary

Migrate the MealPlaning app's color system from 83 grayscale tokens to a vibrant 2-layer token architecture. All 88 primitive oklch tokens and 80 semantic mappings are defined in `COLOR-PALETTE-SPEC.md`.

**Scope**:

- **1 CSS file** modified: `src/index.css` (4 sections: primitives, :root semantics, .dark overrides, @theme inline)
- **6 TS/TSX files** modified: `src/constant/colors.ts`, `MacroChart.tsx`, `MacroDonutChart.tsx`, `src/data/constants.ts`, `QuickPreviewPanel.tsx`, `CopyPlanModal.tsx`
- **3 component files** with hardcoded meal color classes — ALL migrated in TASK-06: `MealPlannerModal.tsx`, `QuickPreviewPanel.tsx`, `CopyPlanModal.tsx`
- **9 circular reference fixes** — feature color tokens that self-reference in `@theme inline`
- **1 hardcoded focus ring fix** — `oklch(0.145 0 0)` → `var(--ring)` at line 134

**Token Counts**:

| Layer                          | Count   | Description                                   |
| ------------------------------ | ------- | --------------------------------------------- |
| Primitives (Layer 1)           | 88      | 8 hues × 11 shades — raw oklch values         |
| Semantics (Layer 2) — existing | 64      | Remap from grayscale → primitive refs         |
| Semantics (Layer 2) — new ★    | 16      | emphasis/subtle for fat, fiber, status, meals |
| Neutral (unchanged)            | 21      | shadcn base tokens — no value change          |
| @theme inline — new ★          | 16      | Tailwind utility generators for new tokens    |
| **Total tokens touched**       | **189** |                                               |

> **GOLDEN RULE**: When plan examples conflict with Appendix A/B values in the spec, **Appendix A/B wins**. Dev agents must copy exact values from the spec appendices, never approximate or compute intermediate oklch values.

---

## 2. Architecture

### 2.1 Two-Layer Token System (§8.1)

```
┌─────────────────────────────────────────────┐
│ Layer 1: Primitives (88 tokens in :root)    │
│ --red-50, --red-100, ..., --rose-950        │
│ Raw oklch values. NEVER used by components. │
│ NOT exposed as Tailwind utilities.          │
└─────────┬───────────────────────────────────┘
          │ var() references
┌─────────▼───────────────────────────────────┐
│ Layer 2: Semantics (80 tokens in :root/.dark)│
│ --destructive: var(--red-600)               │
│ --macro-protein: var(--emerald-600)         │
│ Light/dark pairs. THESE are used by UI.     │
└─────────┬───────────────────────────────────┘
          │ var() references
┌─────────▼───────────────────────────────────┐
│ @theme inline (Tailwind utility generator)  │
│ --color-destructive: var(--destructive)     │
│ Generates: text-destructive, bg-destructive │
│ Components use THESE utility classes.       │
└─────────────────────────────────────────────┘
```

### 2.2 File Map

| File                                           | Sections Modified                                                                                                       | Lines (approx) |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------- |
| `src/index.css` — `:root`                      | Insert primitives (new block) + remap 64 semantics + add 16 new + fix 9 circular refs                                   | 13–100         |
| `src/index.css` — `.dark`                      | Remap 43 dark overrides + add 16 new dark tokens                                                                        | 299–381        |
| `src/index.css` — `@theme inline`              | Fix 9 circular ref mappings + add 16 new entries                                                                        | 178–260        |
| `src/index.css` — `:focus-visible`             | Replace hardcoded oklch → `var(--ring)`                                                                                 | 134            |
| `src/constant/colors.ts`                       | Replace hardcoded hex → CSS var resolution                                                                              | 1–19           |
| `src/data/constants.ts`                        | Migrate `MEAL_TYPE_ICON_COLORS`: `text-energy`/`text-info` → `text-meal-breakfast`/`text-meal-lunch`/`text-meal-dinner` | 36–40          |
| `src/components/schedule/MacroChart.tsx`       | Use CSS vars for stroke/fill                                                                                            | 54–71          |
| `src/components/nutrition/MacroDonutChart.tsx` | Use CSS vars for stroke/fill                                                                                            | 51–54          |
| `src/components/modals/MealPlannerModal.tsx`   | Migrate hardcoded `MEAL_TABS` color strings → meal-type tokens                                                          | 50–53          |
| `src/components/QuickPreviewPanel.tsx`         | Migrate hardcoded `MEAL_SECTIONS` color strings → meal-type tokens                                                      | 18–21          |
| `src/components/modals/CopyPlanModal.tsx`      | Migrate hardcoded meal section color strings → meal-type tokens                                                         | 97–100         |

### 2.3 Circular Reference Fix (§8.4)

**Problem**: 9 tokens in `:root` use `--color-X` naming which collides with `@theme inline` mappings, creating self-referential `var()` loops.

**Fix**: Rename the 9 `:root` tokens by adding a `--feature-` prefix (replacing `--color-`). The `@theme inline` entries then reference the renamed tokens.

| Current `:root` Name            | New `:root` Name            | `@theme inline` Before            | `@theme inline` After               |
| ------------------------------- | --------------------------- | --------------------------------- | ----------------------------------- |
| `--color-ai` (L50)              | `--feature-ai`              | `var(--color-ai)` ⚠️ CIRCULAR     | `var(--feature-ai)` ✅              |
| `--color-ai-subtle` (L51)       | `--feature-ai-subtle`       | `var(--color-ai-subtle)` ⚠️       | `var(--feature-ai-subtle)` ✅       |
| `--color-ai-emphasis` (L74)     | `--feature-ai-emphasis`     | `var(--color-ai-emphasis)` ⚠️     | `var(--feature-ai-emphasis)` ✅     |
| `--color-energy` (L52)          | `--feature-energy`          | `var(--color-energy)` ⚠️          | `var(--feature-energy)` ✅          |
| `--color-energy-emphasis` (L72) | `--feature-energy-emphasis` | `var(--color-energy-emphasis)` ⚠️ | `var(--feature-energy-emphasis)` ✅ |
| `--color-energy-subtle` (L73)   | `--feature-energy-subtle`   | `var(--color-energy-subtle)` ⚠️   | `var(--feature-energy-subtle)` ✅   |
| `--color-rose` (L53)            | `--feature-rose`            | `var(--color-rose)` ⚠️            | `var(--feature-rose)` ✅            |
| `--color-rose-emphasis` (L75)   | `--feature-rose-emphasis`   | `var(--color-rose-emphasis)` ⚠️   | `var(--feature-rose-emphasis)` ✅   |
| `--color-rose-subtle` (L76)     | `--feature-rose-subtle`     | `var(--color-rose-subtle)` ⚠️     | `var(--feature-rose-subtle)` ✅     |

> **Naming note**: The `--feature-` prefix provides a clear namespace for the 3 feature color families (ai, energy, rose). This avoids any potential future collision with primitive tokens (e.g., `--rose-50`) and makes the intent explicit: these are semantic feature tokens, not primitives. The `@theme inline` names (`--color-ai`, `--color-energy`, `--color-rose`) do NOT change — only their `var()` targets change. Tailwind classes remain `text-ai`, `bg-energy`, `text-rose`.

**Impact on `.dark` block**: Same 9 tokens must also be renamed with `--feature-` prefix in the `.dark` override block (lines 337–340, 358–360, 376–378).

**Impact on components**: ZERO. All 55 components use Tailwind classes (`text-ai`, `bg-energy`, `text-rose`), which resolve through `@theme inline`. The `@theme` entry names (`--color-ai`, `--color-energy`, `--color-rose`) do NOT change — only their `var()` targets change from `var(--color-X)` (circular) to `var(--feature-X)` (resolved).

---

## 3. Dependency Graph

```
TASK-01 (Primitives)
    │
    ├──→ TASK-02 (Light Semantics + Circular Fix)
    │        │
    │        ├──→ TASK-04 (@theme inline update)
    │        │        │
    │        │        └──→ TASK-06 (Chart + Constants + Meal Components Migration)
    │        │
    │        └──→ TASK-03 (Dark Semantics)
    │
    └──→ TASK-05 (Focus Ring Fix) [independent]

TASK-01..06 all complete ──→ TASK-07 (Quality Gate)
```

---

## 4. Wave Breakdown

### Wave 1: Foundation — Primitives (1 agent, blocking)

#### TASK-01: Insert 88 Primitive Tokens

| Field          | Value                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| **File**       | `src/index.css`                                                                                      |
| **Action**     | INSERT new block inside `:root`, BEFORE the existing semantic tokens (after line 12, before line 13) |
| **Tokens**     | 88 = 8 hue families × 11 shades each                                                                 |
| **Format**     | `--{hue}-{shade}: oklch(L C H);`                                                                     |
| **Source**     | §2 + Appendix B of `COLOR-PALETTE-SPEC.md`                                                           |
| **Constraint** | Primitives MUST NOT appear in `@theme inline` — they are internal references only (§8.2)             |

**8 Hue Families** (copy exact values from spec §2):

| Family            | Hue (H°) | Shades | Spec Section |
| ----------------- | -------- | ------ | ------------ |
| Red               | 27       | 50–950 | §2.1         |
| Amber             | 65       | 50–950 | §2.2         |
| Yellow-Green (yg) | 100      | 50–950 | §2.3         |
| Emerald           | 145      | 50–950 | §2.4         |
| Teal              | 185      | 50–950 | §2.5         |
| Blue              | 230      | 50–950 | §2.6         |
| Violet            | 280      | 50–950 | §2.7         |
| Rose              | 350      | 50–950 | §2.8         |

**CSS Structure**:

```css
:root {
  /* ══════════════════════════════════════════════
     LAYER 1: PRIMITIVE TOKENS (88)
     Raw oklch values — never use directly in components.
     Reference via semantic tokens in Layer 2.
     ══════════════════════════════════════════════ */

  /* ── Red (H=27°) ── Destructive / Toast Error ── */
  --red-50: oklch(0.971 0.013 27);
  --red-100: oklch(0.936 0.032 27);
  /* ... 9 more shades ... */

  /* ── Amber (H=65°) ── Warning / Toast Warning ── */
  --amber-50: oklch(0.98 0.016 65);
  /* ... etc for all 8 families ... */

  /* ══════════════════════════════════════════════
     LAYER 2: SEMANTIC TOKENS (existing, below)
     ══════════════════════════════════════════════ */
  /* ... existing tokens from line 13 onward ... */
}
```

**Acceptance Criteria**:

- [ ] `npm run build` succeeds — CSS parses without error
- [ ] `grep -c "^  --" src/index.css` count increases by 88
- [ ] Every primitive follows `oklch(L C H)` format (3 values, no alpha)
- [ ] No primitive appears in `@theme inline` block

---

### Wave 2: Semantic Remapping — Light Mode + Circular Fix (1 agent, depends on Wave 1)

> **CRITICAL**: This wave modifies 3 sections of `src/index.css`. A SINGLE agent must handle all 3 tasks to avoid file conflicts.

#### TASK-02: Remap Light-Mode Semantic Tokens + Fix Circular Refs + Add 16 New Tokens

| Field      | Value                                                                                  |
| ---------- | -------------------------------------------------------------------------------------- |
| **File**   | `src/index.css` — `:root` block (lines 13–100)                                         |
| **Action** | REPLACE grayscale `oklch(L 0 0)` values → `var(--primitive)` references                |
| **Source** | §3 + Appendix A of `COLOR-PALETTE-SPEC.md`                                             |
| **Count**  | 43 existing tokens remapped + 9 circular ref renames + 16 new tokens = 68 line changes |

**Sub-task 2a: Remap 43 existing colored semantic tokens**

Replace each token's grayscale value with its primitive reference per Appendix A. The 21 neutral tokens (§3.2: background, foreground, card-_, popover-_, primary-_, secondary-_, muted-_, accent, accent-foreground, border, input, ring, sidebar-_, chart-1 through chart-5) retain their current grayscale values — do NOT change them.

**Example remappings** (full list in Appendix A):

| Token                      | Current Value (grayscale) | New Value (colored)  |
| -------------------------- | ------------------------- | -------------------- |
| `--destructive`            | `oklch(0.577 0 0)`        | `var(--red-600)`     |
| `--destructive-foreground` | `oklch(0.985 0 0)`        | `oklch(1 0 0)`       |
| `--macro-protein`          | `oklch(0.145 0 0)`        | `var(--emerald-600)` |
| `--macro-fat`              | `oklch(0.556 0 0)`        | `var(--amber-600)`   |
| `--macro-carbs`            | `oklch(0.717 0 0)`        | `var(--blue-600)`    |
| `--macro-fiber`            | `oklch(0.857 0 0)`        | `var(--teal-600)`    |
| `--status-success`         | `oklch(0.556 0 0)`        | `var(--emerald-600)` |
| `--status-warning`         | `oklch(0.556 0 0)`        | `var(--amber-500)`   |
| `--status-info`            | `oklch(0.556 0 0)`        | `var(--blue-600)`    |
| `--toast-error`            | `oklch(0.556 0 0)`        | `var(--red-600)`     |
| `--meal-breakfast`         | `oklch(0.556 0 0)`        | `var(--amber-500)`   |
| `--meal-lunch`             | `oklch(0.556 0 0)`        | `var(--emerald-500)` |
| `--meal-dinner`            | `oklch(0.556 0 0)`        | `var(--violet-500)`  |
| `--accent-warm`            | `oklch(0.556 0 0)`        | `var(--amber-600)`   |
| `--compare-active`         | `oklch(0.459 0 0)`        | `var(--blue-600)`    |
| `--compare-default`        | `oklch(0.717 0 0)`        | `var(--blue-300)`    |

**⚠️ MANDATORY: Use exact values from Appendix A of the spec for ALL 43 tokens. Do not approximate.**

**Sub-task 2b: Rename 9 circular-reference tokens**

Apply the rename table from §2.3 of this plan. In `:root`, change:

```css
/* BEFORE */
--color-ai: oklch(0.432 0 0);
--color-ai-subtle: oklch(0.97 0 0);
--color-energy: oklch(0.556 0 0);
--color-rose: oklch(0.556 0 0);
--color-energy-emphasis: oklch(0.357 0 0);
--color-energy-subtle: oklch(0.985 0 0);
--color-ai-emphasis: oklch(0.304 0 0);
--color-rose-emphasis: oklch(0.357 0 0);
--color-rose-subtle: oklch(0.985 0 0);

/* AFTER */
--feature-ai: var(--violet-600);
--feature-ai-subtle: var(--violet-50);
--feature-energy: var(--yg-500);
--feature-rose: var(--rose-500);
--feature-energy-emphasis: var(--yg-700);
--feature-energy-subtle: var(--yg-50);
--feature-ai-emphasis: var(--violet-700);
--feature-rose-emphasis: var(--rose-700);
--feature-rose-subtle: var(--rose-50);
```

**Sub-task 2c: Add 16 new semantic tokens**

Insert these after the existing emphasis/subtle tokens (after line ~76):

```css
/* ── NEW emphasis/subtle tokens (★ Phase 1) ── */
--macro-fat-emphasis: var(--amber-800);
--macro-fat-subtle: var(--amber-50);
--macro-fiber-emphasis: var(--teal-700);
--macro-fiber-subtle: var(--teal-50);
--status-success-emphasis: var(--emerald-700);
--status-success-subtle: var(--emerald-50);
--status-warning-emphasis: var(--amber-800);
--status-warning-subtle: var(--amber-50);
--status-info-emphasis: var(--blue-700);
--status-info-subtle: var(--blue-50);
--meal-breakfast-emphasis: var(--amber-700);
--meal-breakfast-subtle: var(--amber-50);
--meal-lunch-emphasis: var(--emerald-700);
--meal-lunch-subtle: var(--emerald-50);
--meal-dinner-emphasis: var(--violet-700);
--meal-dinner-subtle: var(--violet-50);
```

**Acceptance Criteria**:

- [ ] `npm run build` succeeds
- [ ] Zero tokens in `:root` light block contain `oklch(L 0 0)` pattern EXCEPT the 21 neutral tokens (§3.2)
- [ ] All 9 previously-circular tokens now use `--feature-ai*`, `--feature-energy*`, `--feature-rose*` naming
- [ ] 16 new tokens present with `var(--hue-shade)` values

---

#### TASK-03: Remap Dark-Mode Semantic Tokens + Add 16 New Dark Tokens

| Field                      | Value                                                                     |
| -------------------------- | ------------------------------------------------------------------------- |
| **File**                   | `src/index.css` — `.dark` block (lines 299–381)                           |
| **Action**                 | REPLACE grayscale values → primitive refs following §5 dark mode strategy |
| **Source**                 | §3 (dark column) + §5 of `COLOR-PALETTE-SPEC.md`                          |
| **Dark Mode Pattern (§5)** | Base=400, Emphasis=300, Subtle=950@30% opacity                            |

**Dark mode mapping pattern**:

| Semantic Role                               | Light Value          | Dark Value                      |
| ------------------------------------------- | -------------------- | ------------------------------- |
| Base (e.g., `--macro-protein`)              | `var(--emerald-600)` | `var(--emerald-400)`            |
| Emphasis (e.g., `--macro-protein-emphasis`) | `var(--emerald-700)` | `var(--emerald-300)`            |
| Subtle (e.g., `--macro-protein-subtle`)     | `var(--emerald-50)`  | `oklch(0.278 0.062 145 / 0.30)` |
| Foreground on colored bg                    | `oklch(1 0 0)`       | `oklch(0.145 0 0)`              |

> **⚠️ SPEC INCONSISTENCY**: §5.1 says "950 @ 40% opacity" and §5.2 shows `/ 0.40`, but ALL actual token values in §3 use `/ 0.30`. **DEV MUST use the specific §3 values (30% opacity)** — these are the implementation-ready values.
>
> **⚠️ STANDARDIZE OPACITY**: ALL dark subtle tokens (16 existing + 16 new) MUST use `/ 0.30` opacity. If any §3 value shows `/ 0.40`, it is a spec typo — normalize to `0.30`. This is a RESOLVED inconsistency: spec §3 concrete values (0.30) override §5 prose (0.40).
>
> **⚠️ Dark subtle tokens use STATIC oklch values**, NOT relative color syntax (`oklch(from ...)`). Copy exact values from spec §3 subsections. Do NOT use `oklch(from var(--X-950) l c h / 0.30)`.

**Sub-task 3a: Remap existing dark tokens**

Apply the dark column values from Appendix A for all existing `.dark` overrides.

**Sub-task 3b: Rename 9 circular-reference tokens in `.dark`**

Same rename as `:root`: `--color-ai` → `--feature-ai`, `--color-rose` → `--feature-rose`, etc.

```css
/* BEFORE */
.dark {
  --color-ai: oklch(0.717 0 0);
  --color-ai-subtle: oklch(0.205 0 0);
  --color-energy: oklch(0.717 0 0);
  --color-rose: oklch(0.717 0 0);
  /* ... */
}

/* AFTER */
.dark {
  --feature-ai: var(--violet-400);
  --feature-ai-subtle: oklch(0.265 0.062 280 / 0.3);
  --feature-energy: var(--yg-400);
  --feature-rose: var(--rose-400);
  /* ... */
}
```

**Sub-task 3c: Add 16 new dark-mode tokens**

Mirror the 16 new tokens from TASK-02c with dark values:

```css
.dark {
  /* ── NEW emphasis/subtle tokens (★ Phase 1) ── */
  /* Copy exact oklch values from spec §3 subsections. */
  --macro-fat-emphasis: var(--amber-300);
  --macro-fat-subtle: oklch(0.28 0.063 65 / 0.3);
  --macro-fiber-emphasis: var(--teal-300);
  --macro-fiber-subtle: oklch(0.278 0.058 185 / 0.3);
  --status-success-emphasis: var(--emerald-300);
  --status-success-subtle: oklch(0.278 0.062 145 / 0.3);
  --status-warning-emphasis: var(--amber-300);
  --status-warning-subtle: oklch(0.28 0.063 65 / 0.3);
  --status-info-emphasis: var(--blue-300);
  --status-info-subtle: oklch(0.265 0.06 230 / 0.3);
  --meal-breakfast-emphasis: var(--amber-300);
  --meal-breakfast-subtle: oklch(0.28 0.063 65 / 0.3);
  --meal-lunch-emphasis: var(--emerald-300);
  --meal-lunch-subtle: oklch(0.278 0.062 145 / 0.3);
  --meal-dinner-emphasis: var(--violet-300);
  --meal-dinner-subtle: oklch(0.265 0.062 280 / 0.3);
}
```

**Acceptance Criteria**:

- [ ] `npm run build` succeeds
- [ ] All `.dark` colored tokens reference `var(--hue-shade)` with shade ≤ 400 for base (lighter on dark bg)
- [ ] 16 new dark tokens present
- [ ] Circular ref tokens renamed to `--feature-*` namespace, consistently with `:root`
- [ ] **STANDARDIZE**: ALL dark subtle tokens use `/ 0.30` opacity (normalize any `/ 0.40` to `/ 0.30`)

---

#### TASK-04: Update @theme inline Block

| Field      | Value                                                   |
| ---------- | ------------------------------------------------------- |
| **File**   | `src/index.css` — `@theme inline` block (lines 178–260) |
| **Action** | Fix 9 circular-ref mappings + add 16 new entries        |

**Sub-task 4a: Fix 9 circular reference mappings**

```css
/* BEFORE — circular self-references */
--color-ai: var(--color-ai); /* L224 */
--color-ai-subtle: var(--color-ai-subtle); /* L225 */
--color-energy: var(--color-energy); /* L226 */
--color-rose: var(--color-rose); /* L227 */
--color-energy-emphasis: var(--color-energy-emphasis); /* L244 */
--color-energy-subtle: var(--color-energy-subtle); /* L245 */
--color-ai-emphasis: var(--color-ai-emphasis); /* L246 */
--color-rose-emphasis: var(--color-rose-emphasis); /* L247 */
--color-rose-subtle: var(--color-rose-subtle); /* L248 */

/* AFTER — reference renamed :root tokens (--feature-* namespace) */
--color-ai: var(--feature-ai);
--color-ai-subtle: var(--feature-ai-subtle);
--color-energy: var(--feature-energy);
--color-rose: var(--feature-rose);
--color-energy-emphasis: var(--feature-energy-emphasis);
--color-energy-subtle: var(--feature-energy-subtle);
--color-ai-emphasis: var(--feature-ai-emphasis);
--color-rose-emphasis: var(--feature-rose-emphasis);
--color-rose-subtle: var(--feature-rose-subtle);
```

**Sub-task 4b: Add 16 new @theme inline entries**

These generate Tailwind utilities (`text-macro-fat-emphasis`, `bg-success-subtle`, etc.):

> **⚠️ @theme NAMING CONVENTION**: Existing base tokens use SHORT names: `--color-success` → `text-success`, `--color-warning` → `text-warning`. New emphasis/subtle tokens MUST follow the same pattern: `--color-success-emphasis` (NOT `--color-status-success-emphasis`). The `:root` semantic token (`--status-success-emphasis`) and the `@theme inline` entry (`--color-success-emphasis`) have DIFFERENT names — this is intentional to keep Tailwind class families consistent (`text-success`, `text-success-emphasis`, `text-success-subtle`).

```css
/* ── NEW: Emphasis utility generators ── */
--color-macro-fat-emphasis: var(--macro-fat-emphasis);
--color-macro-fiber-emphasis: var(--macro-fiber-emphasis);
--color-success-emphasis: var(--status-success-emphasis);
--color-warning-emphasis: var(--status-warning-emphasis);
--color-info-emphasis: var(--status-info-emphasis);
--color-meal-breakfast-emphasis: var(--meal-breakfast-emphasis);
--color-meal-lunch-emphasis: var(--meal-lunch-emphasis);
--color-meal-dinner-emphasis: var(--meal-dinner-emphasis);

/* ── NEW: Subtle utility generators ── */
--color-macro-fat-subtle: var(--macro-fat-subtle);
--color-macro-fiber-subtle: var(--macro-fiber-subtle);
--color-success-subtle: var(--status-success-subtle);
--color-warning-subtle: var(--status-warning-subtle);
--color-info-subtle: var(--status-info-subtle);
--color-meal-breakfast-subtle: var(--meal-breakfast-subtle);
--color-meal-lunch-subtle: var(--meal-lunch-subtle);
--color-meal-dinner-subtle: var(--meal-dinner-subtle);
```

> **Note**: `--color-macro-protein-emphasis`, `--color-macro-protein-subtle`, `--color-macro-carbs-emphasis`, and `--color-macro-carbs-subtle` already exist in the current `@theme inline` block (lines 217–218, 251–252). Do NOT duplicate them.
>
> **Note**: The existing `@theme inline` already has `--color-success: var(--status-success)` (L228), `--color-warning: var(--status-warning)` (L229), `--color-info: var(--status-info)` (L230). These generate `text-success`, `text-warning`, `text-info`. The NEW emphasis/subtle entries follow the same short-name pattern to keep the family consistent: `text-success-emphasis`, `text-success-subtle`, NOT `text-status-success-emphasis`.

**Acceptance Criteria**:

- [ ] `npm run build` succeeds
- [ ] Zero `var(--color-X)` self-references remain in `@theme inline`
- [ ] 16 new `--color-*` entries present in `@theme inline`
- [ ] Status emphasis/subtle entries use SHORT names (`--color-success-emphasis`, NOT `--color-status-success-emphasis`) — consistent with existing `--color-success`
- [ ] `npx tailwindcss --content src/index.css` generates classes for all new tokens (verify with `grep`)

---

#### TASK-05: Fix Focus Ring Hardcode

| Field      | Value                                              |
| ---------- | -------------------------------------------------- |
| **File**   | `src/index.css` — line 134                         |
| **Action** | Replace hardcoded oklch value with token reference |

```css
/* BEFORE */
:focus-visible {
  outline: 2px solid oklch(0.145 0 0);
}

/* AFTER */
:focus-visible {
  outline: 2px solid var(--ring);
}
```

This is a 1-line change, independent of other tasks. Can execute in parallel with Wave 2.

**Acceptance Criteria**:

- [ ] `grep 'oklch(0.145 0 0)' src/index.css` returns 0 matches outside `:root`/`.dark` blocks

---

### Wave 3: Chart + Constants Migration (1–2 agents, depends on Wave 2)

#### TASK-06: Migrate Charts, MACRO_COLORS, and Meal Type Color Constants

| Field          | Value                                                                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Files**      | `src/constant/colors.ts`, `src/components/schedule/MacroChart.tsx`, `src/components/nutrition/MacroDonutChart.tsx`, `src/data/constants.ts`, `src/components/modals/MealPlannerModal.tsx` |
| **Action**     | Replace hardcoded hex/grayscale color values and meal type color class names with CSS variable references                                                                                 |
| **Source**     | §9.3 + §3.7 of `COLOR-PALETTE-SPEC.md`                                                                                                                                                    |
| **Depends on** | TASK-02 (semantic tokens must have colored values) + TASK-04 (@theme must generate utilities)                                                                                             |

**Current State**:

```typescript
// src/constant/colors.ts
export const MACRO_COLORS = {
  protein: { light: '#0a0a0a', dark: '#fafafa' },
  fat: { light: '#525252', dark: '#a3a3a3' },
  carbs: { light: '#737373', dark: '#d4d4d4' },
};
```

```tsx
// MacroChart.tsx (line ~60)
stroke={isDark ? arc.darkColor : arc.color}
```

**Migration Strategy — Option A (CSS var in SVG attribute)**:

Modern Capacitor WebView (Chrome 100+) supports `var()` in SVG presentation attributes. Test this first:

```tsx
// MacroChart.tsx — replace MACRO_COLORS usage
const MACRO_CSS_VARS = {
  protein: 'var(--macro-protein)',
  fat: 'var(--macro-fat)',
  carbs: 'var(--macro-carbs)',
} as const;

// In render:
stroke={MACRO_CSS_VARS[arc.key]}
// No isDark toggle needed — CSS var auto-switches via .dark class
```

**If Option A fails** (SVG attribute doesn't resolve `var()`), use **Option B — getComputedStyle hook**:

```typescript
// src/hooks/useThemeColors.ts (NEW FILE)
export function useThemeColors<K extends string>(tokenMap: Record<K, string>): Record<K, string> {
  const [colors, setColors] = useState(tokenMap);

  useEffect(() => {
    const resolve = () => {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      const resolved = {} as Record<K, string>;
      for (const [key, varName] of Object.entries(tokenMap) as [K, string][]) {
        resolved[key] = style.getPropertyValue(varName).trim() || varName;
      }
      setColors(resolved);
    };

    resolve(); // Initial resolve

    // Re-resolve on theme change (dark mode toggle adds/removes .dark class)
    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (m.attributeName === 'class') resolve();
      }
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return colors;
}
```

> **Important**: Option B MUST observe `<html>` class attribute for `.dark` toggle, otherwise chart colors won't update on theme change.

**Sub-task 6a: Update `colors.ts`**

```typescript
// Replace hardcoded hex with CSS var names
export const MACRO_COLORS = {
  protein: 'var(--macro-protein)',
  fat: 'var(--macro-fat)',
  carbs: 'var(--macro-carbs)',
} as const;

// Remove isDark toggle — CSS handles dark mode automatically
```

**Sub-task 6b: Update chart components**

Remove `isDark` conditional logic in both chart components. Use the CSS var directly in `stroke`/`fill` attributes.

**Sub-task 6c: Migrate `src/data/constants.ts` — MEAL_TYPE_ICON_COLORS**

The spec introduces dedicated meal type tokens (`--meal-breakfast`, `--meal-lunch`, `--meal-dinner`). The current constants map meal types to generic color classes that don't match the new token system:

```typescript
// CURRENT (wrong after migration):
export const MEAL_TYPE_ICON_COLORS: Record<MealType, string> = {
  breakfast: 'text-energy', // → should be text-meal-breakfast
  lunch: 'text-energy', // → should be text-meal-lunch
  dinner: 'text-info', // → should be text-meal-dinner
};

// AFTER:
export const MEAL_TYPE_ICON_COLORS: Record<MealType, string> = {
  breakfast: 'text-meal-breakfast',
  lunch: 'text-meal-lunch',
  dinner: 'text-meal-dinner',
};
```

This constant is imported by 6+ components: `MealSlot`, `DishManager`, `DishEditModal`, `SaveAnalyzedDishModal`, `AISuggestionPreviewModal`, `MealPlannerModal`, `QuickPreviewPanel`. Changing the constant propagates automatically.

**Sub-task 6d: Migrate `MealPlannerModal.tsx` — MEAL_TABS inline color strings**

```tsx
// CURRENT (lines 50-53):
const MEAL_TABS = [
  { type: 'breakfast', ..., color: 'text-energy' },
  { type: 'lunch', ..., color: 'text-energy' },
  { type: 'dinner', ..., color: 'text-info' },
];

// AFTER:
const MEAL_TABS = [
  { type: 'breakfast', ..., color: 'text-meal-breakfast' },
  { type: 'lunch', ..., color: 'text-meal-lunch' },
  { type: 'dinner', ..., color: 'text-meal-dinner' },
];
```

Also update line 316 hardcoded `bg-energy-subtle text-energy` → `bg-meal-breakfast-subtle text-meal-breakfast` (or use the meal type dynamically).

**Sub-task 6e: Migrate `QuickPreviewPanel.tsx` — MEAL_SECTIONS inline color strings**

```tsx
// CURRENT (lines 18-21):
const MEAL_SECTIONS = [
  { type: 'breakfast', icon: Sunrise, key: 'meal.breakfast', color: 'text-energy' },
  { type: 'lunch', icon: Sun, key: 'meal.lunch', color: 'text-energy' },
  { type: 'dinner', icon: Moon, key: 'meal.dinner', color: 'text-info' },
];

// AFTER:
const MEAL_SECTIONS = [
  { type: 'breakfast', icon: Sunrise, key: 'meal.breakfast', color: 'text-meal-breakfast' },
  { type: 'lunch', icon: Sun, key: 'meal.lunch', color: 'text-meal-lunch' },
  { type: 'dinner', icon: Moon, key: 'meal.dinner', color: 'text-meal-dinner' },
];
```

> Note: This component also imports `MEAL_TYPE_ICON_COLORS` from `constants.ts` (covered in sub-task 6c), so some usages will migrate automatically. Only the LOCAL `MEAL_SECTIONS` array needs explicit fix here.

**Sub-task 6f: Migrate `CopyPlanModal.tsx` — inline meal section colors**

```tsx
// CURRENT (lines 97-100):
const sections = [
  { key: 'b', label: t('calendar.morning'), items: breakfast, color: 'text-warning' },
  { key: 'l', label: t('calendar.afternoon'), items: lunch, color: 'text-info' },
  { key: 'd', label: t('calendar.evening'), items: dinner, color: 'text-ai' },
];

// AFTER:
const sections = [
  { key: 'b', label: t('calendar.morning'), items: breakfast, color: 'text-meal-breakfast' },
  { key: 'l', label: t('calendar.afternoon'), items: lunch, color: 'text-meal-lunch' },
  { key: 'd', label: t('calendar.evening'), items: dinner, color: 'text-meal-dinner' },
];
```

> ⚠️ Note: CopyPlanModal uses **different** generic tokens (text-warning, text-info, text-ai) than the other meal components. All three MUST map to the same meal-type semantic tokens for consistency.

**Sub-task 6g: Update tests**

Any test that asserts specific hex color values must be updated to expect CSS var strings or resolved values.

**Acceptance Criteria**:

- [ ] Both chart components render colored arcs (not grayscale)
- [ ] Dark mode toggle changes chart colors automatically
- [ ] `isDark` ternary for colors is removed from both chart components
- [ ] `MEAL_TYPE_ICON_COLORS` uses `text-meal-breakfast`/`text-meal-lunch`/`text-meal-dinner`
- [ ] `MealPlannerModal.tsx` MEAL_TABS uses meal-type color classes
- [ ] `QuickPreviewPanel.tsx` MEAL_SECTIONS uses meal-type color classes
- [ ] `CopyPlanModal.tsx` meal section colors use meal-type tokens (no more text-warning/text-info/text-ai for meals)
- [ ] `npm run test` passes — chart and meal component test assertions updated
- [ ] `npm run build` succeeds
- [ ] `grep -rn 'text-energy\|text-info' src/data/constants.ts` returns 0 matches
- [ ] `grep -rn "color: 'text-energy'\|color: 'text-info'\|color: 'text-warning'\|color: 'text-ai'" src/components/QuickPreviewPanel.tsx src/components/modals/CopyPlanModal.tsx src/components/modals/MealPlannerModal.tsx` returns 0 matches

---

### Wave 4: Quality Gate (1 agent, depends on ALL previous waves)

#### TASK-07: Build Verification, Contrast Audit & Visual Smoke Test

| Field          | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| **Action**     | Run full quality gate pipeline + spec-specific validations |
| **Depends on** | ALL previous tasks                                         |

**Sub-task 7a: Standard Quality Gates**

```bash
npm run lint          # 0 errors
npm run test          # 0 failures, coverage ≥ 100% new code
npm run build         # clean production build
npm run test:coverage # generate lcov
npm run sonar         # 0 issues
```

**Sub-task 7b: Token Count Verification + Migration Contract**

Run ALL 5 verification scripts — ALL must pass for migration to be considered complete:

```bash
# 1. Verify primitive count = 88
PRIM_COUNT=$(grep -cE '^\s+--\w+-\d{2,3}:' src/index.css)
[ "$PRIM_COUNT" -eq 88 ] && echo "✅ Primitives: $PRIM_COUNT" || echo "❌ Primitives: $PRIM_COUNT (expected 88)"

# 2. Verify no primitives leaked into @theme inline
LEAKED=$(grep '@theme' -A 200 src/index.css | grep -cE '--\w+-\d{2,3}:')
[ "$LEAKED" -eq 0 ] && echo "✅ No primitives in @theme" || echo "❌ $LEAKED primitives in @theme"

# 3. Verify no circular references remain
CIRCULAR=$(grep -cE '^\s+--color-\w+:\s*var\(--color-\w+\)' src/index.css)
[ "$CIRCULAR" -eq 0 ] && echo "✅ No circular refs" || echo "❌ $CIRCULAR circular refs"

# 4. Verify no grayscale values in colored tokens (exclude neutral block)
# Count grayscale oklch in :root OUTSIDE the neutral section
# Expected: ONLY the 21 neutral tokens should have "oklch(L 0 0)" pattern
GRAY_COUNT=$(sed -n '/:root/,/\.dark/p' src/index.css | grep -cE 'oklch\([0-9.]+ 0 0\)')
[ "$GRAY_COUNT" -le 21 ] && echo "✅ Grayscale only in neutrals: $GRAY_COUNT" || echo "❌ $GRAY_COUNT grayscale values (expected ≤21)"

# 5. Verify all 9 circular-ref tokens renamed to --feature-* namespace
FEATURE_COUNT=$(grep -cE '^\s+--feature-(ai|energy|rose)' src/index.css)
[ "$FEATURE_COUNT" -ge 9 ] && echo "✅ Feature namespace: $FEATURE_COUNT tokens" || echo "❌ Feature namespace: $FEATURE_COUNT (expected ≥9)"
```

> **All 5 checks MUST pass.** If any check fails, fix before proceeding to visual smoke test.

**Sub-task 7c: Contrast Verification (§4, §9.2)**

For each semantic token used as text on background, verify WCAG AA contrast ≥ 4.5:1.

**Borderline tokens requiring explicit sRGB hex → WCAG contrast calculation**:

| Token         | oklch Value              | Use Case                         | Min Ratio | Check Against   |
| ------------- | ------------------------ | -------------------------------- | --------- | --------------- |
| `emerald-700` | `oklch(0.548 0.157 145)` | `--macro-protein-emphasis` text  | 4.5:1     | white `#FFFFFF` |
| `teal-700`    | `oklch(0.548 0.140 185)` | `--macro-fiber-emphasis` text    | 4.5:1     | white `#FFFFFF` |
| `yg-700`      | `oklch(0.565 0.148 100)` | `--feature-energy-emphasis` text | 4.5:1     | white `#FFFFFF` |
| `amber-800`   | `oklch(0.470 0.125 65)`  | `--macro-fat-emphasis` text      | 4.5:1     | white `#FFFFFF` |
| `blue-700`    | `oklch(0.530 0.145 230)` | `--status-info-emphasis` text    | 4.5:1     | white `#FFFFFF` |
| `violet-700`  | `oklch(0.525 0.148 280)` | `--feature-ai-emphasis` text     | 4.5:1     | white `#FFFFFF` |

**Mandatory verification script** (requires `culori` npm package):

```bash
node -e "
const {oklch, formatHex} = require('culori');
const tokens = [
  {name: 'emerald-700', val: 'oklch(0.548 0.157 145)'},
  {name: 'teal-700',    val: 'oklch(0.548 0.140 185)'},
  {name: 'yg-700',      val: 'oklch(0.565 0.148 100)'},
  {name: 'amber-800',   val: 'oklch(0.470 0.125 65)'},
  {name: 'blue-700',    val: 'oklch(0.530 0.145 230)'},
  {name: 'violet-700',  val: 'oklch(0.525 0.148 280)'},
];
function luminance(hex) {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const [rs,gs,bs] = [r,g,b].map(c => c<=0.03928 ? c/12.92 : ((c+0.055)/1.055)**2.4);
  return 0.2126*rs + 0.7152*gs + 0.0722*bs;
}
function contrast(hex1, hex2) {
  const l1 = luminance(hex1), l2 = luminance(hex2);
  return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
}
tokens.forEach(t => {
  const hex = formatHex(oklch(t.val));
  const ratio = contrast('#ffffff', hex).toFixed(2);
  const pass = parseFloat(ratio) >= 4.5 ? '✅' : '❌';
  console.log(pass + ' ' + t.name + ': ' + hex + ' → ' + ratio + ':1');
});
"
```

> **If ANY borderline token fails 4.5:1, escalate to Tech Leader** with the computed hex + ratio. Do NOT adjust oklch values independently.

**Sub-task 7d: Gamut Clipping Check (§7) — Round-Trip Validation**

Verify no primitive exceeds sRGB gamut. **Two-step verification**:

**Step 1 — Static chroma cap check** (all 88 primitives):

| Hue            | Max Chroma (§7.1) |
| -------------- | ----------------- |
| Red (27°)      | 0.180             |
| Amber (65°)    | 0.170             |
| YG (100°)      | 0.165             |
| Emerald (145°) | 0.178             |
| Teal (185°)    | 0.155             |
| Blue (230°)    | 0.160             |
| Violet (280°)  | 0.165             |
| Rose (350°)    | 0.180             |

```bash
# Extract all chroma values from primitives and check against caps
# This grep finds all primitive tokens and their chroma values
grep -E '^\s+--\w+-\d{2,3}:\s+oklch\(' src/index.css | \
  sed -E 's/.*oklch\(([0-9.]+) ([0-9.]+) ([0-9.]+)\).*/\3 \2/' | \
  awk '{
    h=$1; c=$2;
    if (h>=0 && h<46) cap=0.180;       # Red
    else if (h<83) cap=0.170;           # Amber
    else if (h<123) cap=0.165;          # YG
    else if (h<165) cap=0.178;          # Emerald
    else if (h<208) cap=0.155;          # Teal
    else if (h<255) cap=0.160;          # Blue
    else if (h<315) cap=0.165;          # Violet
    else cap=0.180;                     # Rose
    if (c > cap) print "❌ hue=" h " chroma=" c " exceeds cap=" cap;
  }'
# Expected: no output (all within caps)
```

**Step 2 — getComputedStyle round-trip test** (run in browser/emulator):

```javascript
// Paste in DevTools console after app loads — tests all 88 primitives
const root = document.documentElement;
const style = getComputedStyle(root);
const families = ['red', 'amber', 'yg', 'emerald', 'teal', 'blue', 'violet', 'rose'];
const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
let clipped = 0;
families.forEach(f =>
  shades.forEach(s => {
    const val = style.getPropertyValue(`--${f}-${s}`).trim();
    if (!val) {
      console.warn(`⚠️ --${f}-${s} not found`);
      return;
    }
    // Create temp element to test round-trip
    const el = document.createElement('div');
    el.style.color = val;
    document.body.appendChild(el);
    const resolved = getComputedStyle(el).color;
    document.body.removeChild(el);
    if (!resolved || resolved === '') {
      console.error(`❌ --${f}-${s}: gamut clipped`);
      clipped++;
    }
  }),
);
console.log(clipped === 0 ? '✅ All 88 primitives within sRGB gamut' : `❌ ${clipped} tokens clipped`);
```

> **If any token clips, escalate to Tech Leader** with the token name and oklch value.

**Sub-task 7e: Visual Smoke Test**

Build APK and verify on emulator:

1. Dashboard — macro colors visible and distinct
2. Calendar — meal type colors (breakfast=amber, lunch=emerald, dinner=violet)
3. Settings — destructive buttons are red
4. AI tab — ai feature colors are violet
5. Dark mode toggle — all colors switch to lighter variants

**Acceptance Criteria**:

- [ ] All standard quality gates pass (lint, test, build, sonar)
- [ ] 88 primitives verified
- [ ] 0 circular references remain
- [ ] 0 primitives in @theme inline
- [ ] Borderline contrast pairs verified ≥ 4.5:1
- [ ] No gamut clipping (all chromas within hue caps)
- [ ] Visual smoke test on emulator confirms color rendering

---

## 5. Risk Mitigations

### 5.1 Red Chroma Cap (§9.1)

**Issue**: Spec defines red chroma cap at 0.180 (§7.1 table). Lighter shades (red-400, red-300) may appear desaturated compared to design intent.

**Recommendation**: Spec §9.1 suggests raising cap to **0.195 for red only** if needed. Implement with 0.180 first. If visual review finds red-600 (destructive) too muted, **escalate to Tech Leader** — do NOT adjust values independently. All values are isolated in primitives, so change is trivial (1 token update).

**Action**: TASK-07 visual smoke test must explicitly evaluate destructive button vibrancy.

### 5.2 Emerald/Teal 700 Contrast (§9.2)

**Issue**: Emerald-700 and Teal-700 are borderline WCAG AA for small text on white.

**Action**: TASK-07 must compute exact sRGB hex → contrast ratio. If either fails 4.5:1, **escalate to Tech Leader** with computed values. Do NOT darken or lighten tokens independently.

**Fallback**: These shades are used for emphasis tokens (e.g., `--macro-protein-emphasis`, `--macro-fiber-emphasis`). If they serve as text color, the component should use them on a tinted background (e.g., `bg-emerald-50`), not pure white.

### 5.3 SVG CSS Variable Support (§9.3)

**Issue**: SVG `stroke`/`fill` attributes may not resolve `var()` in all WebView versions.

**Action**: TASK-06 implements Option A first. TASK-07 visual test verifies chart colors render. If they don't, Dev falls back to Option B (`useThemeColors` hook with `getComputedStyle` + MutationObserver for theme change).

### 5.4 Amber Text Accessibility (§9.4)

**Issue**: Amber-500/600 as `text-*` on white fails WCAG AA.

**Action**: This is a component-level concern, not a token-level issue. Document in the spec that `text-meal-breakfast` and `text-status-warning` must NEVER be used for small body text on white. They are safe for:

- Icon fill colors
- Badge backgrounds with dark text
- Chart segments
- Text on dark backgrounds

### 5.5 Colorblind Safety (§9.5)

**Issue**: Color alone must not be the only differentiator.

**Action**: Deferred to Phase 2 (component-level). Token layer provides distinct hues (27°, 65°, 100°, 145°, 185°, 230°, 280°, 350°) which are maximally separated. Component-level non-color cues (icons, labels, patterns) are a separate task.

> **⚠️ Colorblind-critical pairs for Dev awareness**: The following token pairs may appear similar under deuteranopia/protanopia and MUST have non-color differentiators (icon, label, position) at the component level:
>
> - `--macro-protein` (emerald-600, H=145°) vs `--feature-energy` (yg-500, H=100°) — both green family
> - `--meal-breakfast` (amber-500, H=65°) vs `--status-warning` (amber-500, H=65°) — same hue, distinguish by context
> - `--destructive` (red-600, H=27°) vs `--meal-breakfast` (amber-500, H=65°) — red/orange confusion under protanopia
>
> These are NOT blocking for Phase 1 (token layer). Phase 2 component work MUST add icons/labels alongside color.

---

## 6. Execution Summary

| Wave   | Tasks                              | Agent(s)            | Est. Lines Changed           | Blocking?                                                  |
| ------ | ---------------------------------- | ------------------- | ---------------------------- | ---------------------------------------------------------- |
| **W1** | TASK-01                            | 1 agent             | +88 lines (insert)           | YES — all subsequent waves depend on primitives            |
| **W2** | TASK-02, TASK-03, TASK-04, TASK-05 | 1 agent (same file) | ~150 lines (modify + insert) | YES — chart/constants migration depends on semantic values |
| **W3** | TASK-06                            | 1 agent             | ~80 lines (modify 5+ files)  | NO — can start after W2 completes                          |
| **W4** | TASK-07                            | 1 agent             | 0 lines (validation only)    | FINAL — must run after all code changes                    |

**Total estimated changes**: ~318 lines across 6+ files (1 CSS, 5+ TS/TSX).

**Parallelism notes**:

- W1 → W2 is strictly sequential (primitives must exist before semantics reference them)
- W2 TASK-05 (focus ring) can technically run in parallel with TASK-02/03/04, but since it's 1 line in the same file, the same agent should handle it
- W3 can start immediately after W2 completes
- W4 runs last as validation

---

## 7. Spec Cross-Reference Checklist

| Spec Section                      | Plan Coverage                          | Task(s)                      |
| --------------------------------- | -------------------------------------- | ---------------------------- |
| §2 — 88 Primitives                | ✅ Full                                | TASK-01                      |
| §3 — 80 Semantic Mappings         | ✅ Full (64 remap + 16 new)            | TASK-02, TASK-03             |
| §4 — Contrast Verification        | ✅ In QA gate                          | TASK-07c                     |
| §5 — Dark Mode Strategy           | ✅ Full                                | TASK-03                      |
| §6 — Hue Allocation               | ✅ Encoded in semantic mappings        | TASK-02                      |
| §7 — Gamut Safety                 | ✅ In QA gate                          | TASK-07d                     |
| §8.1 — CSS Architecture           | ✅ 2-layer structure                   | TASK-01, TASK-02             |
| §8.2 — Primitives not in @theme   | ✅ Enforced in TASK-01 AC              | TASK-01                      |
| §8.3 — @supports fallback         | ⏸ Deferred (optional per spec)         | —                            |
| §8.4 — Circular Reference Fix     | ✅ Full (9 tokens)                     | TASK-02b, TASK-03b, TASK-04a |
| §8.5 — 16 new semantic tokens     | ✅ Full                                | TASK-02c, TASK-03c           |
| §8.6 — 16 new @theme entries      | ✅ Full                                | TASK-04b                     |
| §9.1 — Red chroma cap             | ✅ Risk mitigation §5.1                | TASK-07                      |
| §9.2 — Emerald/Teal contrast      | ✅ Risk mitigation §5.2                | TASK-07c                     |
| §9.3 — Chart CSS var migration    | ✅ Full                                | TASK-06                      |
| §9.4 — Amber text safety          | ✅ Documented in §5.4                  | —                            |
| §9.5 — Colorblind safety          | ⏸ Deferred to Phase 2                  | —                            |
| §3.12 — Focus ring fix            | ✅ Full                                | TASK-05                      |
| Appendix A — Token quick ref      | ✅ Used as source for TASK-02, TASK-03 | —                            |
| Appendix B — Primitive values     | ✅ Used as source for TASK-01          | —                            |
| Appendix C — Lightness uniformity | ✅ Pre-validated by Designer           | —                            |

---

## 8. Dev Agent Instructions

### ⛔ ABSOLUTE RULES — Violation = Immediate Escalation

1. **NEVER invent oklch values**. Copy EXACTLY from spec Appendix A (semantics) or Appendix B (primitives). If a value seems wrong or missing, **escalate to Tech Leader** — do NOT compute or approximate.
2. **Appendix values win over plan examples**. If this plan shows a different value than Appendix A/B, the Appendix is correct. This plan's examples are illustrative — the spec appendices are canonical.
3. **NEVER use `eslint-disable`**. Fix the underlying issue.
4. **NEVER modify files outside your assigned task scope**.

### For ALL agents:

1. Read `COLOR-PALETTE-SPEC.md` Appendix A (token quick reference) and Appendix B (primitive values) as your primary data source
2. Copy values EXACTLY from the spec — do not compute or approximate oklch values
3. Dark subtle tokens use **STATIC oklch values** (e.g., `oklch(0.278 0.062 145 / 0.30)`) — do NOT use relative color syntax `oklch(from var(...) ...)`
4. The spec has an internal inconsistency: §5 says 40% opacity for dark subtle, but ALL actual values in §3 use 30% opacity. **Use the §3 values (30%)**. STANDARDIZE ALL dark subtle tokens to `/ 0.30` — if any spec value shows `/ 0.40`, normalize to `0.30`.
5. **@theme inline naming**: Status emphasis/subtle entries use SHORT names matching existing base tokens: `--color-success-emphasis` (NOT `--color-status-success-emphasis`). This keeps the Tailwind class family consistent: `text-success`, `text-success-emphasis`, `text-success-subtle`.
6. After completing your task, run `npm run build` to verify CSS parses correctly
7. If any value looks wrong, contrast fails, or gamut clips — **STOP and escalate to Tech Leader**. Do NOT adjust values independently.

### For TASK-01 agent:

- Insert primitives as a new comment-delimited block at the TOP of `:root`, before existing semantic tokens
- Group by hue family with section comments matching the spec
- Verify count = 88 after insertion
- All values come from **Appendix B** — copy verbatim

### For TASK-02/03/04/05 agent:

- This is a SINGLE agent handling 4 tasks sequentially in one file
- Start with TASK-02 (light semantics), then TASK-03 (dark), then TASK-04 (@theme), then TASK-05 (focus ring)
- For circular ref renames: search for ALL occurrences of the old name across the entire file — `:root`, `.dark`, AND `@theme inline`
- The rename pattern is: `--color-X` → `--feature-X` (add `--feature-` prefix instead of `--color-`). This provides a clear namespace for the 3 feature families (ai, energy, rose). The `@theme inline` names (`--color-ai`, `--color-energy`, `--color-rose`) do NOT change — only their `var()` targets change from `var(--color-X)` (circular) to `var(--feature-X)` (resolved)
- For new @theme status tokens: use SHORT names matching existing base (`--color-success-emphasis`, NOT `--color-status-success-emphasis`) — keeps Tailwind class family consistent: `text-success`, `text-success-emphasis`, `text-success-subtle`
- All semantic mappings come from **Appendix A** — copy the `var(--primitive-shade)` references verbatim
- After each sub-task, run `npm run build` as a checkpoint

### For TASK-06 agent:

- Test Option A (CSS var in SVG) first with a quick prototype
- If `stroke="var(--macro-protein)"` renders correctly in the build output, proceed with full migration
- If not, implement Option B with `useThemeColors` hook — MUST include `MutationObserver` on `document.documentElement` to rerun on `.dark` class toggle
- Migrate `MEAL_TYPE_ICON_COLORS` in `src/data/constants.ts` to use `text-meal-*` classes
- Migrate `MEAL_TABS` in `MealPlannerModal.tsx` to use `text-meal-*` classes
- Update ALL existing tests that assert color values

### For TASK-07 agent:

- Run the full quality gate pipeline first
- Then run the 5-point migration contract (TASK-07b) — ALL must pass
- Run contrast verification script (TASK-07c) with `culori` — compute actual sRGB hex and WCAG ratios for all 6 borderline tokens
- Run gamut validation: both static chroma cap check AND getComputedStyle round-trip in browser/emulator (TASK-07d)
- Gamut caps per hue: Red=0.180, Amber=0.170, YG=0.165, Emerald=0.178, Teal=0.155, Blue=0.160, Violet=0.165, Rose=0.180
- Take emulator screenshots for visual verification
- Report any failures with exact details (token name, expected vs actual)
- If any contrast pair fails 4.5:1, **escalate to Tech Leader** with computed ratio — do NOT adjust tokens

---

**DESIGN_READY → IMPLEMENTATION_PLAN_READY**

_This plan provides all technical details needed for Dev agents to execute. Each task has exact line references, before/after code, and acceptance criteria. The wave structure ensures safe sequential/parallel execution without file conflicts._
