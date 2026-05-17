# F-004-edit-set-incomplete — editSet() only edits weight+reps; rest/effort/notes uneditable

**Severity:** P2
**Status:** RESOLVED at code (Turn 9). Runtime emulator verify ⏳ pending next turn.
**Discovered:** Turn 1, code-only
**Fixed:** Turn 9 (code)

## Evidence (before fix)

`active-workout.page.ts:126-161` (pre-Turn-9) — `editSet(setId, setNumber, currentWeight, currentReps)` called `AlertController.create` with **only two inputs** (weight + reps). The user's previously-entered `rest_seconds`, `effort` (Dễ/Vừa/Nặng/Tối đa), and `notes` were displayed in the set-history card via `set.effort` / `set.notes` but had **no edit path**. To correct a wrong rest time or change "Vừa → Nặng" the user had to delete the set and re-log it from scratch.

`workout.repository.ts` `updateSet(setId, weightKg, reps)` matched: SQL was `UPDATE workout_set SET weight_kg=?, reps=?, updated_at=? WHERE id=?` — three columns ignored even though they exist on the row.

Two Apple-spirit violations:

1. **Loss of fidelity** — users invest effort (literally) tagging a set as `hard` or jotting "felt tight in left shoulder"; silently dropping these fields on edit teaches the user not to bother filling them in the first place.
2. **Path dependency** — the only way to fix a stale `rest_seconds` is *delete + re-log*, which (a) discards the original timestamp ordering, (b) interacts badly with F-005 (no undo on hard delete), (c) forces a confirmation alert for what should be a one-tap correction.

## Cause

MVP scope-cut at the time set-history was first built — `weight × reps` was framed as "the set" and the other fields as "metadata." That framing was wrong: in any strength-training app the rest and RPE tell you whether the set was easy or maxing out, which is the whole signal the program is trying to capture.

## Fix (Turn 9)

1. **`workout.repository.ts` `updateSet` signature widened** from `(setId, weightKg, reps)` to `(setId, input: WorkoutSetInput)` — same shape as `addSet`. New SQL writes all five columns plus `updated_at`. Reuses `validateSetInput` (weight 0..500, reps 1..100, rest 0..600). Wrapped in `withTransaction` together with `syncTotals` so `total_volume` resync is atomic with the edit.
2. **`fitness.store.ts` `updateSet`** signature widened to `(setId, input: WorkoutSetInput)`. Imports the type from the repo for a single source of truth.
3. **`active-workout.page.ts` `editSet`** rewritten to take a `WorkoutSet` object and present a 5-input `AlertController` alert:
   - `weightKg` (number, prefilled `set.weight_kg`)
   - `reps` (number, prefilled `set.reps`)
   - `restSeconds` (number, prefilled `set.rest_seconds`)
   - `effortIndex` (number 0..4 — AlertController inputs can't mix radios with text/number in one alert, so we render an index with a helper line `Mức nỗ lực: 0 = bỏ trống · 1 = Dễ · 2 = Vừa · 3 = Nặng · 4 = Tối đa`. The dedicated edit-set sheet in IA-proposal P1 will replace this index UX with a real `effort-chip` group — see follow-up below.)
   - `notes` (textarea, prefilled `set.notes`)
   - Validation mirrors `addSet`: weight 0..500, reps integer 1..100, rest integer 0..600, effortIndex integer 0..4. Notes trimmed; empty string → `null`.
4. **`active-workout.page.html`** call site collapsed from `editSet(set.id, set.set_number, set.weight_kg, set.reps)` to `editSet(set)`.
5. **`EFFORT_OPTIONS` constant** added in the page: `readonly WorkoutEffort[] = ['easy', 'just_right', 'hard', 'maxed']` — drives index↔enum mapping in one place.

### Files changed

- `src/app/core/repositories/workout.repository.ts` (updateSet signature + SQL + transaction)
- `src/app/core/stores/fitness.store.ts` (import type + signature)
- `src/app/features/fitness/active-workout/active-workout.page.ts` (editSet rewrite + EFFORT_OPTIONS)
- `src/app/features/fitness/active-workout/active-workout.page.html` (call site)
- `src/app/core/repositories/fitness.repositories.spec.ts` (T-01 widened — now asserts rest_seconds, effort, notes round-trip in addition to weight/reps/updated_at/total_volume)
- `src/app/core/stores/fitness.store.spec.ts` (`updateSet calls repo with full draft` widened to assert full input object passed through)

## Apple-spirit re-audit

- **Fidelity preserved:** every field the user filled when logging a set is now editable on the same set. No silent data loss.
- **One path to truth:** users no longer need delete-and-re-add to fix a typo in rest time or upgrade `Vừa → Nặng`. Edit really edits.
- **Atomicity:** transaction wraps UPDATE + total_volume resync — the row and the aggregate cannot diverge.
- **Honest limitation:** the numeric `effortIndex` is a deliberate compromise of `AlertController`'s API (mixing radios + text inputs in one alert is not supported). The helper-text legend keeps the cognitive load explicit rather than hidden. Long-term home: IA-proposal P1 dedicated edit-set sheet with the same `.effort-chip` row already used in the logger — see follow-up.

## Follow-up

- **IA-proposal P1 (next phase):** replace the index-driven `AlertController` with a dedicated `EditSetSheet` (bottom sheet or push page) reusing the existing 4-chip effort selector and floating-label inputs. The current alert is fully functional but not as ergonomic as the logger; treat as a transitional UX, not the destination.

## Status

**RESOLVED at code (Turn 9).** All 11 guards GREEN. `npx ng build` GREEN. T-01 regression test widened to lock in the round-trip of all 5 fields.

## Test plan

- ✓ `npm run check:guards` — GREEN (11 guards).
- ✓ `npx ng build` — GREEN, 3.64s.
- ✓ Unit T-01 (`fitness.repositories.spec.ts`) — asserts `weightKg/reps/restSeconds/effort/notes` round-trip on `updateSet` + `updated_at` ISO + `total_volume` resync.
- ✓ Unit (`fitness.store.spec.ts`) — `updateSet calls repo with full draft` passes full `WorkoutSetInput` object through to the repo spy.
- ⏳ Emulator OCR verify (next turn): edit a real seeded set, pull DB, confirm all 5 fields persisted.
- ⏳ E2E (future, Phase P2): `T-22 active-workout.edit-set.e2e.spec.ts` — log set, open edit, change rest/effort/notes, save, reopen edit, fields prefilled with new values.
