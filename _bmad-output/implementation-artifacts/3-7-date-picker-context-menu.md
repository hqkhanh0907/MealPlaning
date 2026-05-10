# Story 3.7: Date Picker + Long-press Context Menu + Undo Toast

Status: in-progress

<!-- Source: _bmad-output/planning-artifacts/epic-3-calendar.md (rev 1) lines 425-470 -->

## Story Goal

Cho user (1) nhảy đến ngày bất kỳ qua date picker, (2) sao chép/di chuyển/xoá dish qua long-press menu với optimistic UI + undo 8s.

## Tasks

- [ ] **T1**: `repo.PlannedDishRepository.moveToSlot(plannedDishId, targetMealSlotId)` + spec.
- [ ] **T2**: `CalendarStore.moveDish` + `deleteDish` (returns deleted snapshot for undo) + `restoreDish(snapshot)` + spec.
- [ ] **T3**: `DishContextMenuModal` component (bottom sheet, 3 actions: copy/move/delete) + spec.
- [ ] **T4**: `DatePickerModal` wrapper around `ion-datetime` (vi-VN, today shortcut, ±365d clamp) + spec.
- [ ] **T5**: `MealSlotPickerModal` (4 meal-type chooser) + spec.
- [ ] **T6**: `UndoToastQueue` service (FIFO 8s timers, restore action) + spec.
- [ ] **T7**: Wire long-press in `MealSlotCard` → emit `dishLongPress`; wire chip date tap → DatePickerModal in `calendar.page`.
- [ ] **T8**: Wire empty-state "Sao chép từ hôm qua" + checkCanCopyYesterday signal.
- [ ] **T9**: Verify ng test/build/APK + commit.

## ACs

AC-1 Date Picker (basic vi-VN ion-datetime + Today shortcut + ±365d boundary clamp). Calendar dot decoration deferred → §Deferred.
AC-2 Empty state copy-from-yesterday CTA wired (disabled if yesterday empty).
AC-3 Long-press context menu: copy/move/delete.
AC-4 Undo toast 8s with progress (Ionic toast standard duration; bespoke progress bar deferred → §Deferred).
AC-5 Undo data preservation: full snapshot cached, restore re-inserts via `addToSlot` (+ `markCompleted` if was completed).
AC-6 Boundary clamp ±365d.
AC-7 Manual QA → deferred (CI/automated only).

## Deferred (move to deferred-items.md after merge)

- Calendar dot decoration on date picker (per-day plan/log indicator) — Story 3.8 or Phase 5.
- Bespoke 8s progress-bar countdown UI on undo toast — current uses Ionic toast `duration` only.
- Manual QA scenarios (need device interaction).

## Verification

- ≥15 new specs across new components/services/repo methods.
- `npm run check:guards` PASS.
- `npm run build` + APK BUILD SUCCESSFUL.

## Changelog

| Date | Change |
|------|--------|
| 2026-05-10 | Story created (`ready-for-dev`). |
