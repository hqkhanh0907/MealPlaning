# F-014 — Ghost routes: `/tabs/fitness/active` & `/tabs/fitness/history` không reachable từ UI; `active-workout/*` là 100% dead code

**Severity:** P1 (history); P2 (active duplicate dead code)
**Status:** PARTIAL FIX (Turn 12, history) — `/tabs/fitness/history` đã có entry point. `/tabs/fitness/active` vẫn dead-code, đánh dấu để Pha 2 IA refactor quyết định giữ/xóa.
**Discovered:** Turn 12 (cross-check code vs runtime)
**Fixed (partial):** Turn 12

## Evidence

`src/app/features/fitness/fitness.routes.ts` định nghĩa 3 routes:
- `''` → `fitness.page`
- `'active'` → `active-workout/active-workout.page`
- `'history'` → `history/history.page`

Trước Turn 12, grep toàn repo:
```
grep -rn "router.navigate.*active\|navigate.*fitness/active\|navigateByUrl.*active\|fitness/active\|fitness/history" src/
→ 0 results
```

Tức là không có 1 lệnh navigate hay `[routerLink]` nào trỏ tới 2 route con này. User không bao giờ tới được. `active-workout/active-workout.page.{ts,html,scss}` (~ 229 lines TS) là dead code chiếm chỗ + tạo dual-source-of-truth cho logger UI.

Runtime confirm (dump uihit Turn 12): tap "Bắt đầu buổi tự do" trên hub → store `startFree()` chỉ set signal `activeSession`, **không** `router.navigate`. Active session render inline trong `fitness.page.html` (line 243-456) — `active-workout.page` không bao giờ mount.

## Cause

Phía `origin/main` (incoming merge `8f72bb49`) đã ship blueprint tách 3 route nhưng quên wire entry points. Audit turn 1-11 trước chỉ verify trên `active-workout.page` standalone — không phát hiện hub vẫn dùng inline logger. Merge hợp 2 nhánh để lại routes định nghĩa nhưng UI hub không link tới.

## Fix (Turn 12)

### Phần history (P1) — DONE
- `src/app/features/fitness/fitness.page.ts`: import `RouterLink` + `IonFooter` + `timeOutline` icon, add vào component imports + addIcons.
- `src/app/features/fitness/fitness.page.html` line 460-475: add `<ion-button [routerLink]="['/tabs/fitness/history']">` với icon `time-outline` + label "Lịch sử" trong header của section Tiến trình.
- Runtime verify: build → APK → install → cold launch → tap Tập luyện → scroll xuống Tiến trình → tap "LỊCH SỬ" → navigate sang `/tabs/fitness/history` thành công, hiển thị buổi tập đã hoàn thành (CN 17/5, Free Workout, 1 set, 600 kg, 7 phút).

### Phần active-workout (P2) — DEFERRED
- Quyết định: KHÔNG xóa `active-workout/*` ở Pha 1 vì:
  - Code đã ship + có spec test (`active-workout.page.spec` exists), xóa = throw away công sức turn 7-8 đã verify F-008 footer trên page này.
  - Pha 2 IA redesign (theo IA-proposal.md) sẽ tách 5 page mới (Fitness Home / Plans / Active / History / Insights); `active-workout.page` là tiền thân của Active page Pha 2 — giữ làm reference, refactor đồng bộ.
- Tới Pha 2: thay `inline active workout section` trong hub bằng `router.navigate(['/tabs/fitness/active'])` từ `startTodayGuided` / `startFree`. Khi đó hub chỉ còn entry CTAs, page Active gánh full logger.

## Apple-spirit re-audit

- Hub gắn lại CTA Lịch sử → user có lối ra theo phản xạ Apple (xem lịch sử là core mental model fitness app).
- Dead code không gây hại runtime nhưng tăng cognitive load cho dev đọc code → ghi rõ status để Pha 2 cleanup, không thừa silent.

## Status

PARTIAL — history reachable, active deferred to Pha 2 IA refactor.
