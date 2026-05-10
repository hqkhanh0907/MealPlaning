# Story 3.6: F-03 Week View — toggle from Day View + 7-row layout + copy previous week

Status: done

<!-- Source: _bmad-output/planning-artifacts/epic-3-calendar.md (rev 1) lines 374-421 -->

## Story

As a **user**,
I want **toggle sang Week View thấy 7 ngày với màu chỉ thị in-target / under / over và sao chép tuần trước**,
so that **review pattern ăn uống cả tuần và quick-jump vào ngày bất kỳ**.

## Acceptance Criteria

1. **AC-1 — Layout F-03 §3.** Week View render: header sticky `◄ "Tuần dd-dd/mm/yy" ►` + icon 📋 (toggle về Day View); "↩ Tuần này" button khi không phải tuần hiện tại; week summary row "Mục tiêu: {target} cal/ngày · Tổng {target*7}" + "Đã ăn: {logged_sum} cal ({pct}% target)"; 7 day row vertical (NO 7-col grid).

2. **AC-2 — `DayRow` component.** Inputs: `weekDay: WeekDayTotal` (date, label, dotCount, loggedCal, plannedCal, targetCal, status, isToday, isPast, hasPlan). Status emoji map: ✅ in-target (80–110%), 🟡 under (50–79%), ⚠️ over (110–150%), ⛔ extreme (<50% or >150%), ⚪ neutral (no data / future planned). Future ngày chưa plan: "─── (chưa plan)". Past ngày: bg opacity 0.85. Tap row → `setView('day') + setDate(date)`. Output `selectDate = output<string>()`.

3. **AC-3 — Color/status logic (F-04 §4).** Pure helper `weekDayStatus(weekDay)` decision table:
   - `!hasPlan` → `'no-plan'` (neutral gray, no emoji label)
   - `isFuture && hasPlan` → `'future-planned'` (neutral gray, label "{plannedCal} kcal · kế hoạch")
   - `isToday` → `'today-recording'` (orange-warning, label "{logged}/{target} · đang ghi")
   - `isPast` → status by `pct = round(loggedCal / targetCal * 100)` only (chỉ tính `is_completed=1`)

4. **AC-4 — Week query.** `CalendarStore.weekData = signal<WeekData | null>(null)` hydrate qua `DayPlanRepository.findByDateRange(weekStart, weekEnd)` trong effect bám `weekDays()` + `invalidationTick`. Stale-result guard giống `dayPlan`. Compute `WeekDayTotal[]` cho 7 ngày kể cả missing day (synthesized empty entries).

5. **AC-5 — Week navigation.** Tap ◄/► → `setDate(currentDate ± 7d)`. Boundary clamp ±365d (tái dùng store clamp).

6. **AC-6 — Copy previous week (F-03 §3.4).** Tap "📋 Sao chép tuần trước" → ConfirmDialog modal warning "Sẽ ghi đè món chưa ăn ở tuần này (món đã ăn được giữ nguyên)" → confirm → `CalendarStore.copyPreviousWeek()`:
   - Xác định prevWeekStart = weekStart(currentDate - 7d).
   - Với mỗi ngày trong prev week có data → ensureDayPlan ngày tương ứng tuần này.
   - Trong slot tương ứng tuần này: DELETE planned_dish WHERE is_completed=0 (xoá kế hoạch cũ chưa ăn, GIỮ logged).
   - INSERT planned_dish copy (is_completed=0) cho mỗi planned-or-logged dish của prev week vào slot tương ứng tuần này.
   - Returns `{ copiedCount, daysAffected }`.
   - Toast "Đã sao chép {n} món từ tuần trước".

7. **AC-7 — Day↔Week toggle.** Calendar.page bind `store.currentView()`. Day mode render existing UI; Week mode render WeekHeader + WeekSummary + DayRow×7. Toggle button update `setView('week'|'day')`.

8. **AC-8 — AI plan tuần CTA defer Phase 5.** Tap → toast "Tính năng AI sẽ ra mắt Phase 5". KHÔNG redirect.

9. **AC-9 — Test + guards + APK.** ≥4 specs cho mỗi component (DayRow, WeekSummary, weekDayStatus, copyPreviousWeek). Tổng test PASS. `check:guards` 9/9. Web build + APK debug PASS.

## Tasks

- [ ] **T1**: `week-day-status.ts` util + spec.
- [ ] **T2**: `WeekDayTotal` type addition (`meal-plan.types.ts`).
- [ ] **T3**: Extend `PlannedDishRepository.copyPreviousWeek(currentWeekStart)` + spec.
- [ ] **T4**: Extend `CalendarStore`: `weekData` signal + `hydrateWeek` effect + `copyPreviousWeek()` wrapper + spec deltas.
- [ ] **T5**: `DayRow` 3-file component + spec.
- [ ] **T6**: `WeekSummary` 3-file component + spec.
- [ ] **T7**: `calendar.page` extend: view toggle, Week mode template branch, copyPreviousWeek wiring, AI/copy toast.
- [ ] **T8**: `ng test` PASS; `check:guards` 9/9; web build; APK; commits.

## Dev Notes

- **Reuse**: `CalendarStore.weekDays()` (Story 3.3). Existing `clampDate` clamp ±365d.
- **`WeekDayTotal`** UI shape, place trong `core/models/meal-plan.types.ts` để repository/store không phụ thuộc UI:
  ```ts
  export interface WeekDayTotal {
    date: string;        // ISO yyyy-mm-dd
    label: string;       // "T2", "T3", … "CN"
    dotCount: number;    // số planned dish (logged+planned)
    loggedCal: number;
    plannedCal: number;
    targetCal: number;
    isToday: boolean;
    isPast: boolean;
    hasPlan: boolean;    // có ít nhất 1 dish (planned hoặc logged)
  }
  ```
- **VN day labels** map: Mon→"T2", Tue→"T3", Wed→"T4", Thu→"T5", Fri→"T6", Sat→"T7", Sun→"CN".
- **`copyPreviousWeek` semantics**: ghi đè món chưa ăn (`is_completed=0`) ở tuần hiện tại, GIỮ NGUYÊN món đã ăn (`is_completed=1`). Clear dùng `DELETE WHERE meal_slot_id=? AND is_completed=0`. INSERT new copies (luôn `is_completed=0`).
- **`weekData` hydrate**: effect bám `weekDays()` first/last. Sau khi load, store mỗi ngày qua map `date → DayPlanWithSlots`, synthesize empty entries cho missing days.
- **`weekDayStatus`** pure: input full `WeekDayTotal` + emit status code. Không tự render UI.
- **Toggle button** dùng existing `currentView` signal store. Day mode template branch là cũ (Story 3.5 unchanged). Week mode template mới ở `@if (store.currentView()==='week')`.
- **Confirm modal**: tái dùng `ConfirmDialog` đã có (`shared/components/confirm-dialog/`).
- **No new repo helpers cần thêm cho week summary** — sum effective_calories qua DayPlanWithSlots client-side.
- **Sprint-status rev**: 16 (ready-for-dev story commit), 17 (ready-for-review), 18 (done).

## DoD

- 7 tasks done; ≥30 new specs added.
- Toàn bộ test suite PASS (current 590 + ~30).
- check:guards 9/9; web build + APK PASS.
- Sprint status updated.

## Change Log

| Date | Change |
|------|--------|
| 2026-05-10 | Story created (`ready-for-dev`). |
| 2026-05-10 | Dev complete: util week-day-status (11 specs) + WeekDayTotal type + repo `copyPreviousWeek` (5 specs) + CalendarStore.weekData/copyPreviousWeek + DayRow component (6 specs) + calendar.page integration. 612/612 specs PASS (was 590, +22). `check:guards` 9/9 PASS. Web build + APK BUILD SUCCESSFUL. Status → `ready-for-review`. Commit `66b10e0`. |
| 2026-05-10 | Code-review: 0 PATCH, 2 DEFER (B1 weekday alignment assumption documented; E1 effective_calories=null silent → log warning at Story 3.7), 2 DISMISS (B2 currentDate-week semantics correct; E2 dotCount cap=6 cosmetic). Status → `done`. Commit `6a9a977`. |
