# F-006 — Set draft autosave/restore khi app bị OS kill giữa chừng

**Severity:** P2
**Status:** SHIPPED (Pha 1.5)
**Discovered:** Audit Turn 5 (initial pass), validated Turn 13 runtime

## Evidence

Trước fix: user gõ weight=77 vào logger, force-stop app, relaunch → field reset về DEFAULT_SET_DRAFT (20kg / 10 reps / 90s). Toàn bộ input "tạm" mất.

Runtime emulator confirm:
- `/tmp/fitness-audit/42-autosave-restored.png` — pre-fix: Tạ=20 sau relaunch.
- `/tmp/fitness-audit/44b-restored.png` — post-fix: Tạ=77 ✓.

## Root Cause

`setDraft` chỉ tồn tại trong `FitnessStore` signal (in-memory). App killed → process exit → signal mất. Repository không persist draft, không có IndexedDB/localStorage fallback. Khi `selectedWorkoutExerciseId` re-set bởi `refreshActiveSession()`, draft luôn reset về DEFAULT.

## Fix

`src/app/core/stores/fitness.store.ts`:

1. **Autosave effect** — watch `selectedWorkoutExerciseId + setDraft`, debounce 500ms, `localStorage.setItem('fitness:draft:<exerciseId>', JSON.stringify(draft))`.
2. **Hydration effect** — watch `selectedWorkoutExerciseId` change, gọi `loadDraft(id)` khi id mới ≠ `lastHydratedExerciseId`. Cover mọi entry point: `refreshActiveSession`, `startGuidedFromPlan`, `addExerciseToSession`, `selectWorkoutExercise`.
3. **Clear after logSet success** — `clearPersistedDraft(exercise.id)` để fresh set start clean.
4. **Graceful failure** — try/catch quanh localStorage (private mode, quota).

## Verify

- Unit: 823 specs green (no regression).
- Runtime emulator: type Tạ=77 → kill app → relaunch → field=77 ✓.

## Trade-offs

- Storage không cap → user dùng nhiều exercises trong nhiều buổi → tích lũy nhiều keys `fitness:draft:*`. localStorage limit Android WebView ~5MB; mỗi draft <200B → cần >25k drafts mới đầy. Defer GC tới Pha 2/3.
- Race: nếu user log set + force-kill TRƯỚC khi `clearPersistedDraft` chạy (HIẾM, server-side latency), key cũ vẫn tồn tại → relaunch hydrate stale draft. Impact: minor — fields nhìn như đã có giá trị, user vẫn confirm trước khi log next set. Acceptable.

## Status

SHIPPED (Pha 1.5).
