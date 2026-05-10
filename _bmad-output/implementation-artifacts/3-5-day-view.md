# Story 3.5: F-03 Day View — meal slot list + per-dish actions + DaySummaryCard placeholder

Status: ready-for-dev

<!-- Source: _bmad-output/planning-artifacts/epic-3-calendar.md (rev 1) lines 319-370 -->

## Story

As a **user**,
I want **mở tab "Lịch ăn" thấy 4 meal slot với danh sách món, có thể tap [+] thêm món, tap [Đã ăn] mark eaten, swipe ngày qua lại**,
so that **quản lý kế hoạch ăn uống + log thực tế hàng ngày**.

## Acceptance Criteria

1. **AC-1 — Layout F-03 §2.** `calendar.page.html` render: sticky header (chip "Hôm nay ▼" left + center "{Thứ}, {dd/mm/yy}" VN format + 📅 right toggle Week View placeholder); DaySummaryCard placeholder section; 4 MealSlotCard (🍳 Bữa sáng / 🍱 Bữa trưa / 🍲 Bữa chiều / 🍪 Bữa phụ — Vietnamese label fixed); AI CTA "🤖 AI chọn món hôm nay" → toast "Tính năng sẽ ra mắt Phase 5".

2. **AC-2 — `MealSlotCard` (`features/calendar/components/meal-slot-card/`).** Inputs: `slot: MealSlotWithDishes`, `mealType: MealType`. Header: emoji + label + tổng calo (sum effective_calories) + nút [+]. Body: dish row với:
   - `is_completed=1` (logged): text solid, `<app-status-pill status="logged">` next to name
   - `is_completed=0` (planned): text opacity 0.6, calo placeholder `░░░`
   Outputs: `markEaten = output<string>()` on tap [Đã ăn] (chỉ hiện khi `is_completed=0`); `openLog = output<MealType>()` on tap [+]; `unmarkEaten = output<string>()` on tap [Đã ăn] khi đã logged (toggle).

3. **AC-3 — Mark/unmark eaten flow (F-03.D.4).** Tap [Đã ăn] (planned) → calendar.page mở `ConfirmEatModal` mode=mark → confirm → `CalendarStore.markEaten(plannedDishId)` → tx atomic snapshot → UI flip faded → solid (re-query qua `dayPlan` refetch). Tap [Đã ăn] (logged) → `ConfirmEatModal` mode=unmark → confirm → `CalendarStore.unmarkEaten(plannedDishId)`.

4. **AC-4 — Empty state (F-03 §5).** Khi `dayPlan().meal_slots.every(s => s.planned_dishes.length === 0)` → render `EmptyDayState` component với 3 CTA: [Lên kế hoạch] (call openLog breakfast), [Sao chép từ hôm qua] (disabled khi `CalendarStore.canCopyFromYesterday()===false`), [🤖 AI Phase 5] (toast).

5. **AC-5 — Header date chip (Story 3.7 deferred).** Story 3.5 chỉ render chip "Hôm nay ▼" hoặc "Hôm qua"/"Ngày mai"/`{Thứ}, {dd/mm/yy}` qua pure helper `relativeDateLabel(date, today)`. Tap chip → toast "Date picker sẽ ra ở Story 3.7" (defer modal).

6. **AC-6 — Swipe gesture (F-03.D.2).** Body content swipe left → `CalendarStore.setDate(currentDate + 1d)`; right → `currentDate - 1d`. Boundary clamp ở store. Implement via Ionic gesture API (`createGesture`) hoặc native touch events.

7. **AC-7 — AI button defer Phase 5.** Tap → IonToast "Tính năng AI sẽ ra mắt Phase 5". KHÔNG redirect, KHÔNG modal.

8. **AC-8 — File structure.**
   - `features/calendar/calendar.page.{ts,html,scss}` — extend (signal-driven, inject CalendarStore + ConfirmEatModal wiring)
   - `features/calendar/components/meal-slot-card/` — 3 file PC-1
   - `features/calendar/components/empty-day-state/` — 3 file PC-1
   - `features/calendar/components/day-summary-card/` — 3 file PC-1 (stub Epic 3)

9. **AC-9 — Test coverage + guards.** ≥4 specs per new component (MealSlotCard, EmptyDayState, DaySummaryCard) + relativeDateLabel util specs (≥4 cases). Calendar page integration spec (mark-eaten flow + swipe). All `check:guards` PASS. Web build + APK debug PASS.

## Tasks

- [ ] **T1**: `relative-date-label.ts` util + spec.
- [ ] **T2**: `DaySummaryCard` 3-file stub + spec.
- [ ] **T3**: `EmptyDayState` 3-file + spec.
- [ ] **T4**: `MealSlotCard` 3-file + spec.
- [ ] **T5**: `calendar.page` rewrite (signal-driven, CalendarStore inject, ConfirmEatModal wiring, swipe gesture, AI toast) + spec.
- [ ] **T6**: `ng test` PASS; `check:guards` 9/9 PASS; build; APK.
- [ ] **T7**: Sprint status rev bump + commit dev.

## Dev Notes

- **Reuse**: `StatusPill`, `ConfirmEatModal`, `CalorieRing` (Story 3.4); `CalendarStore` (Story 3.3) for `currentDate`/`dayPlan`/`setDate`/`markEaten`/`unmarkEaten`/`canCopyFromYesterday`.
- **No `@capacitor/haptics`** — long-press feedback skipped (Pitfall A). Long-press menu được Story 3.7 owned.
- **Vietnamese meal labels** fixed: emoji+label hard-coded per `MealType`.
- **`relativeDateLabel`** pure: today → "Hôm nay"; today-1 → "Hôm qua"; today+1 → "Ngày mai"; else → `"{Thứ N}, dd/mm/yy"` (vi-VN). Test 4 boundary.
- **Sum tổng calo per slot**: `slot.planned_dishes.reduce((a,d) => a + (d.is_completed ? d.effective_calories : 0), 0)` — chỉ tính logged để khớp F-03 §2.3 hybrid display semantic. Confirm với spec inline (precedent F-04 §2.3).
- **Swipe gesture**: Ionic `createGesture({el, gestureName:'swipe-day', threshold:30, onEnd: ev => …})`. Direction qua `ev.deltaX`. KHÔNG dùng third-party Hammer.
- **AI toast** dùng `ToastController` từ `@ionic/angular/standalone`.
- **DaySummaryCard stub** chỉ render placeholder text "Tổng quan dinh dưỡng — sẽ có ở Epic 4". Inputs: `date: string`. KHÔNG inject store.
- **Sprint-status `last_updated` rev bump 2 lần**: rev N (ready-for-dev) khi commit story file + commit retrofit; rev N+1 (ready-for-review) sau dev; rev N+2 (done) sau review.

## DoD

- 4 components/util implemented per AC.
- ≥18 new specs (4×4 component + 4 util util + buffer).
- ≥558 + ~25 = ≥583 tests pass; `check:guards` 9/9 PASS; build + APK pass.
- Sprint status updated; conventional commits.

## Change Log

| Date | Change |
|------|--------|
| 2026-05-10 | Story created (`ready-for-dev`). |
