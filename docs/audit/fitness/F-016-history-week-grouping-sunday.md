# F-016 — History page tuần grouping off-by-one cho buổi tập ngày Chủ Nhật

**Severity:** P2
**Status:** SHIPPED (Pha 1.5, commit 5fb642e5+)
**Discovered:** Turn 12, runtime emulator

## Evidence

Sau khi hoàn thành 1 buổi tập ngày `2026-05-17` (Chủ Nhật, ISO weekday=7) và navigate sang `/tabs/fitness/history`, page render:

```
TUẦN 10 THG 5 – 16 THG 5
  CN, 17 thg 5 · Free Workout · 1 set · 600 kg · 7 phút
```

Tuần header `10/5 – 16/5` là tuần Thứ-Hai-đầu (10/5 Mon → 16/5 Sun). Nhưng row entry `17/5 CN` thuộc tuần SAU đó (`17/5 Mon? — 17/5 Sun?`). Logic grouping nhét row 17/5 vào tuần 10–16, off-by-one 1 ngày.

## Suspected cause

`src/app/features/fitness/history/history.page.ts` (đọc lúc bắt đầu Turn 12): hàm `weekKey()` / `weekStart()` dùng Date.prototype methods JS native. Default JS `getDay()` trả về 0 cho Chủ Nhật, 1 cho Thứ Hai. Khi tính "Monday-start week" với formula như `date.getDate() - date.getDay() + 1`, ngày CN sẽ bị shift về tuần TRƯỚC (vì `0 - 0 + 1 = 1` rơi vào thứ Hai tuần đó, nhưng JS Date subtract làm sai cho ngày CN bằng cách trở thành ngày 11/5 thay vì 18/5).

Đây là pitfall cổ điển khi mapping ISO weekday (Mon=1..Sun=7) sang JS weekday (Sun=0..Sat=6) mà không normalize.

## Fix proposal

`history.page.ts`: thay logic week-start bằng helper chuẩn ISO:
```ts
function isoWeekStart(d: Date): Date {
  const day = d.getDay();           // 0 (Sun) .. 6 (Sat)
  const offsetToMon = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + offsetToMon);
  start.setHours(0, 0, 0, 0);
  return start;
}
```
Dùng cùng helper với streak calc + currentWeekStart (đã có ở `workout.repository.ts:startOfWeekIso`). Reuse helper đó thay vì viết lại.

## Test plan

- Repo unit: pin date provider, insert sessions trải các ngày Mon..Sun, assert grouping chính xác.
- Smoke E2E: log session ngày CN → history → assert tuần header chứa ngày đó, không thuộc tuần trước.

## Status

OPEN — fix nhỏ, có thể ship Pha 1 follow-up.

## Resolution (Pha 1.5)

Root cause confirmed: KHÔNG phải off-by-one weekday — là **timezone drift**. `d.toISOString().slice(0,10)` ở GMT+7 đã shift `Mon 2026-05-11T00:00 local` → `Sun 2026-05-10T17:00Z` → `"2026-05-10"`. Group key sai 1 ngày, header label tính từ Mon-1 nên hiển thị "10 thg 5 – 16 thg 5".

Fix: thay `toISOString().slice(0,10)` bằng `formatLocalIsoDate()` (local Y/M/D components zero-padded).

Verify runtime emulator: CN 17/5 nay group vào header `TUẦN 11 THG 5 – 17 THG 5` ✓.
Spec: `history.page.spec.ts` 8 cases (Sun/Mon/Wed/Sat/month boundary/year boundary/format/regression guard 2026-05-10).
