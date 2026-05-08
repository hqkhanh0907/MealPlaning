# Superseded Features — HealthMate AI

> **Purpose:** Single source of truth for features that were once shipped or planned but have been **removed**. Each entry records: when, why, and where the historical implementation lives in git history. This file replaces the prior practice of leaving "addendum banners" or `~~strikethrough~~` clutter inside canonical design/architecture docs.

> **Convention (per investigation 2026-05-08, group G2):** When a feature is removed:
> 1. **Delete** content describing it from canonical docs (design-system, architecture, dev-plan).
> 2. **Add** an entry here with: feature name, dates, removal commit/tag, rationale, recovery hint.
> 3. **Keep** historical mention only in: BMAD planning artifacts, `_bmad-output/`, git history, BMAD brownfield snapshots (mark with stale notice banner).

---

## Index

| ID | Feature | Removed | Removal | Reason |
|---|---|---|---|---|
| SF-001 | Dark mode (Theme: Sáng / Tối / Hệ thống) | 2026-05-08 | v0.2.1, commits `c49f4b5` + `fcc7dd4` | Brand sage-on-cream is light-only canonical; QA bandwidth insufficient for dual-theme |

---

## SF-001 — Dark mode

- **Status:** Removed
- **Original ship:** 2026-05-04 (commits `7112f68` + `9660905` — `Theme` service + `@mixin dark` + `@include dark-root`)
- **Final form before removal:** Story 2.3 (commit `605a438`) — Theme persistence + dark mode QA pass on 4 Settings screens (no-flash transition, contrast verified)
- **Removed:** Story 2.6, commits `c49f4b5` (DB collapse) + `fcc7dd4` (SCSS/TS/HTML strip), tag `v0.2.1` (2026-05-08)
- **Affected artifacts removed:**
  - `src/theme/_dark-mode.scss` (DELETED)
  - 9 `@use './dark-mode'` imports across `variables.scss` + 5 partials + onboarding + bottom-sheet
  - 12 `@include dark-root { ... }` blocks
  - 2 `@media (prefers-color-scheme: dark)` blocks (`global.scss`, `bottom-sheet-picker.scss`)
  - Settings page "GIAO DIỆN" `<ion-radio-group>` + `setTheme()` handler
  - `ThemeMode` union narrowed to literal `'light'`; `Theme` service kept as `@deprecated` no-op shim to preserve call sites
  - `UserProfile.theme` type narrowed to `'light'`
  - `users.theme` SQLite column — `CHECK (theme IN ('light'))` constraint
- **Rationale:**
  - **Brand:** Sage-on-cream warm palette only reaches visual parity in light. Dark variants required warm-charcoal `#14110E` + `#28251F` surfaces; chroma was muted to the point of looking grey-green and conflicting with the Lifesum Sage Wellness direction.
  - **Maintenance:** 9 SCSS partials × 2 themes × design-token churn = repeated drift. Each design-system revision required re-auditing dark contrast.
  - **QA:** Single-developer team (Amelia + Hermes) — no bandwidth to maintain dual visual regression.
  - **Demand:** Pre-release; no telemetry signal that dark was requested. Decision was unilateral product call before public launch.
- **Recovery hint (if ever resurrected):**
  - Git: `git show 605a438:src/theme/_dark-mode.scss` for the last shipped mixin.
  - Tokens: design-system.md v2.0 (commit before `126b860`) had full dark column for primary / accent / neutral / semantic / AI-card / macro palettes.
  - Architecture: pre-2.6 the `Theme` service applied `data-theme="dark"` to `<html>`; SCSS used `[data-theme="dark"]` selector + `@media (prefers-color-scheme: dark)` fallback for system mode.
  - Re-introduction would require: undo `CHECK` constraint via new migration, restore `_dark-mode.scss`, restore `setTheme()` handler, restore radio group, expand `ThemeMode` union.
- **Decision record:** `_bmad-output/planning-artifacts/sprint-change-proposal-2026-05-08-remove-dark-mode.md`
- **Story record:** `_bmad-output/implementation-artifacts/2-6-remove-dark-mode-collapse-migrations.md`

---

## How to add an entry

1. Bump the Index table with the next `SF-NNN` ID.
2. Add a section with: Status, Original ship, Final form, Removed (commit/tag/date), Affected artifacts, Rationale, Recovery hint, Decision/Story records.
3. Strip the feature description from canonical docs in the same commit (do not leave addendum banners — that's the anti-pattern this file replaces).
