# F-005-cancel-no-undo — cancelWorkout is a destructive hard delete with no undo

**Severity:** P2
**Status:** OPEN — design + blueprint locked Turn 10. Implementation deferred to Phase P2.
**Discovered:** Turn 1, code-only
**Blueprint locked:** Turn 10

## Evidence (current behavior)

`active-workout.page.ts:91-107` raises an `AlertController` with header "Hủy buổi tập?" and message **"Toàn bộ set đã log sẽ mất."** Tapping "Hủy" calls `fitness.store.cancelWorkout()` which delegates to `WorkoutRepository.cancelSession(id)` — and `cancelSession` performs:

```sql
DELETE FROM workout_session WHERE id = ?
```

`workout_exercise` and `workout_set` cascade via `ON DELETE CASCADE`. The session, its exercises, and every logged set vanish irrecoverably. No `status='cancelled'` column. No archive. No undo window. The alert is the only friction.

Two Apple-spirit violations:

1. **Irreversibility at one tap.** Apple Mail's "Trash" lets you swipe-and-undo for 5 seconds; Notes lets you recover for 30 days. Even Trash mailboxes hold deleted mail before purge. Our cancel is more destructive than `rm -f`: an entire 45-minute logging session, including timestamps that anchor strength trend lines, is gone the moment a user taps the wrong button.
2. **Confessional copy without remedy.** Telling the user "Toàn bộ set đã log sẽ mất" is honest but cruel — it warns of the loss but doesn't give a way back. Apple's pattern is to *prevent* loss (soft delete + undo), not document it.

There is no telemetry on accidental cancels (no observability stack yet), but the shape of the alert + tall-phone reach to the header "Hủy" button creates a real fat-finger surface — especially right next to the close button.

## Cause

MVP scope-cut: when the active-workout page first shipped, sessions were stateless containers and "cancel" was framed as "throw the draft away." A soft-delete pattern was deferred because (a) no history page existed yet (F-002, now resolved Turn 5), so the cancelled session had nowhere visible to live; (b) the schema had no `status` column. Both blockers are now gone — history page renders cancelled sessions trivially, and the migration path is well-trodden after F-012's v4 ALTER.

## Proposed fix (blueprint)

### Schema — v5 migration (append-only)

```sql
ALTER TABLE workout_session ADD COLUMN status TEXT
  CHECK (status IN ('active', 'completed', 'cancelled')) NOT NULL DEFAULT 'active';
ALTER TABLE workout_session ADD COLUMN cancelled_at TEXT;
```

Backfill in the migration (post-DDL): `UPDATE workout_session SET status='completed' WHERE completed_at IS NOT NULL`. Active sessions stay `'active'` by default; null `completed_at` + `status='active'` already encoded today, this just makes it explicit.

`SCHEMA_VERSION` 4→5. Append to `MIGRATION_REGISTRY`. Pin v4-spec test files. Mirror to base DDL only AFTER first deploy — same lesson banked at F-012 ("ALTER-only path, never touch base v1 DDL in the same release").

### Repository

- `cancelSession(sessionId)` → replace `DELETE` with `UPDATE workout_session SET status='cancelled', cancelled_at=? WHERE id=?` (transaction).
- New `restoreSession(sessionId)` → `UPDATE … SET status='active', cancelled_at=NULL WHERE id=? AND status='cancelled'` (idempotent).
- New `purgeCancelledSession(sessionId)` → the actual hard delete, exposed for an eventual "Empty trash" UI or a scheduled cleanup. Not on the user-facing path in v1.
- `getActiveSession()` add `AND status='active'` filter.
- `recentSessions(limit)` add `WHERE status IN ('completed', 'cancelled')` and a `sortable_at` (completed_at OR cancelled_at) field for grouping. Cancelled rows render dimmed with strikethrough in history.

### Store + UI

- `cancelWorkout()` stops calling the destructive alert. Instead:
  1. Optimistic: clear `activeSession`, `selectedWorkoutExerciseId`, `restSeconds` immediately.
  2. Call repo `cancelSession` (soft).
  3. Surface a non-blocking **undo toast** (Ionic `ToastController`) bottom-anchored, duration 5000ms, with a single "Hoàn tác" button. Toast text: "Đã hủy buổi tập."
  4. On undo tap → call `restoreSession`, re-hydrate `activeSession`, route back to `/tabs/fitness/active`.
  5. On toast dismiss → leave the row in history under a "Đã hủy" group.
- Header "Hủy" stays in place (already correct position per F-008's spatial-role separation), but the AlertController **goes away** — no more confirmation modal. The toast IS the safety net. This is the Apple Mail pattern: swipe to delete, undo-or-it-sticks. The pre-tap confirm becomes the post-tap reversal.

### History page rendering

- Group cancelled sessions under a collapsed "Đã hủy" disclosure at the bottom of the week. Default-collapsed: cancelled sessions shouldn't compete with completed sessions for attention.
- Cancelled row visual: 60% opacity, no volume number, no streak contribution.

### Files to change (when implemented)

- `src/app/core/services/database/schema.ts` — append migration; bump `SCHEMA_VERSION`
- `src/app/core/services/database/migrations.ts` — registry entry
- `src/app/core/services/database/__test__/create-test-database.spec.ts` — pin v4 → v5
- `src/app/core/services/database/migrations.spec.ts` — pin v4 → v5
- `src/app/core/repositories/workout.repository.ts` — soft-cancel + restore + purge
- `src/app/core/repositories/fitness.repositories.spec.ts` — round-trip cancel→restore
- `src/app/core/stores/fitness.store.ts` — toast + restoreSession action
- `src/app/features/fitness/active-workout/active-workout.page.{ts,html}` — drop alert, wire toast
- `src/app/features/fitness/history/history.page.{ts,html,scss}` — render cancelled group

## Apple-spirit re-audit (against blueprint)

- **Tách bạch:** cancel is one action with two phases — execute + reversible window — encoded by the toast, not a modal. Confirmation moves from "promise of loss" to "demonstration of safety."
- **Reduce cognitive load:** removing the confirmation dialog removes a hard decision. Trust earned by an undoable design > attention demanded by a warning.
- **Status clarity:** the soft-cancel state is first-class in the schema. History tells the truth about what happened, including the cancelled ones. No silent gaps in the timeline.
- **Reversibility:** session-level undo (toast) AND structural undo (status flag retained until purge). Two levels of safety net.
- **Honest limits:** purge path is not yet user-exposed in v1 — accepted trade-off; user-facing "Empty trash" is a future-phase concern. Cancelled rows are never deleted automatically, so they accumulate slowly; non-issue for an offline single-user app at this scale.

## Test plan

- ⏳ Unit: `workout.repository.spec` — `cancelSession` writes `status='cancelled' + cancelled_at`; `getActiveSession` excludes cancelled; `restoreSession` round-trips; `recentSessions` includes cancelled.
- ⏳ Unit: `fitness.store.spec` — `cancelWorkout` clears local state optimistically + dispatches restoreSession when undo fires.
- ⏳ Migration test: v4 → v5 ALTER applies on existing v4 DB, backfill leaves completed rows at `'completed'`, active rows at `'active'`.
- ⏳ E2E: start session, log set, tap Hủy → toast appears → tap Hoàn tác within 5s → confirm session restored AND selected; second run: dismiss toast → confirm row in history "Đã hủy" group.

## Status

**OPEN — blueprint locked Turn 10.** Schema migration v5 + soft-cancel + 5s undo toast is the design. Implementation queued for Phase P2 (after F-004 runtime verify).
