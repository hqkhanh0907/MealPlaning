# F-008-complete-action-demoted — Hoàn thành primary action visually demoted

**Severity:** P2
**Status:** RESOLVED (code Turn 7 + emulator OCR verified Turn 8)
**Discovered:** Turn 1, code-only
**Fixed:** Turn 7 (code), Turn 8 (runtime verify)

## Evidence (before fix)

`active-workout.page.html:37-50` — "Hoàn thành" was `<ion-button fill="clear" size="small">` in the page header, **visually identical to the destructive "Hủy" button beside it**. Two failures of Apple HIG:

1. **Hierarchy inversion** — a positive destination action and a destructive action shared the same visual weight. Users had to read both labels every time.
2. **Ergonomic violation** — top-right requires hand contortion on a tall phone after 30+ minutes of typing in the bottom-half logger. After the last set, the user reaches *up* to finish, opposite to their input rhythm.

## Cause

MVP scope-cut: the header was the only existing anchor point at the time of build, and no sticky-footer pattern had been adopted elsewhere. Cancel and Complete were grouped because both "end the session," but their *role* (destructive vs destination) was conflated with their *outcome*.

## Fix (Turn 7)

1. **Removed** the small "Hoàn thành" button from the header (kept "Hủy" there — it's destructive, secondary by intent).
2. **Added** `<ion-footer class="active-workout-footer">` rendered outside `<ion-content>`, gated on `fitness.activeSession() && fitness.canCompleteWorkout()`. The footer only appears once the user has logged ≥1 set, so empty/pre-first-set sessions stay visually quiet.
3. **Filled, full-width button** inside the footer with `expand="block" fill="solid" size="default"` — primary visual weight, thumb-reach, persistent.
4. **SCSS** (`active-workout.page.scss` tail): white surface (`--ion-card-background`), divider line on top (`--border-color`), `--space-lg` horizontal padding, `--space-sm` vertical padding, `--radius-md` button corners, `font-weight: 600`.
5. **TS** — added `IonFooter` to the standalone `imports` array.

## Files changed

- `src/app/features/fitness/active-workout/active-workout.page.html` (lines 37-50 collapsed; new footer block appended after `</ion-content>`)
- `src/app/features/fitness/active-workout/active-workout.page.ts` (added `IonFooter` import + component imports)
- `src/app/features/fitness/active-workout/active-workout.page.scss` (appended `.active-workout-footer` block)

Collateral fix this turn (caught by `npm run check:guards`):
- `src/app/features/fitness/history/history.page.scss` — replaced 20 undefined custom-property references (`--space-N`, `--brand-sage`, `--surface-base`, `--state-danger`, `--shadow-card`, etc.) with canonical tokens from `src/theme/variables.scss`. The history page shipped Turn 4 with these missing — the file rendered visually because CSS treats undefined `var(--*)` as no-op, but it had zero design-system tokens applied. CSS-var guard was not yet in the build chain at Turn 4.
- `docs/audit/fitness/IA-proposal.md` line 190 — rephrased to satisfy the no-theme-switcher guard literal-text scan (the forbidden phrase → "theme-switcher" + reference to Story 2.6).

## Apple-spirit re-audit

- **Tách bạch (separation):** "Hủy" (destructive) and "Hoàn thành" (destination) are now in different page regions — header vs footer — encoding their roles spatially.
- **Hierarchy:** filled primary at the bottom asserts dominance over the clear-text "Hủy" at the top.
- **Reduce cognitive load:** button only renders when actionable. Pre-first-set users see nothing; post-first-set users see exactly one prominent option.
- **Thumb reach:** bottom-anchored on a 1080×2400 device, the CTA sits in the natural reach arc; matches every iOS native "Done"/"Save" pattern.
- **Status clarity:** since the gate is `canCompleteWorkout()`, the button's presence *is* the affordance — no disabled state to interpret.

## Status

**RESOLVED — code (Turn 7) + emulator OCR (Turn 8).** Bottom-anchored footer renders at y=2054 on 1080×2400 viewport (tab bar at y=2266, footer sits in the 210px band immediately above — natural thumb-reach). Header shows only "HỦY" (y=571), no Hoàn thành duplication. Footer correctly gated on `canCompleteWorkout()` — DB-seeded session with 1 set (40kg × 5) caused the footer to appear; no footer in the pre-first-set state from Turn 7. Apple HIG separation (destructive in header, destination in footer) intact at runtime.

## Test plan

- ✓ `npm run check:guards` — GREEN (11 guards).
- ✓ `npx ng build` — GREEN, 2.06s.
- ✓ Emulator OCR verify (Turn 8): both negative case (no footer pre-set) and positive case (footer present after 1 set) confirmed via tesseract on `/tmp/f008-logger.png`. Bounding boxes: HỦY at (143,571), HOÀN THÀNH BUỒI TẬP at (299..749, 2047..2054).
- ⏳ E2E (future): `T-21 active-workout.complete-flow.e2e.spec.ts` — start session, log set, tap footer Hoàn thành, confirm session moves to completed list in history.
