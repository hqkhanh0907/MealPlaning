# F-017 — Free-mode exercise picker có 2 entry points cùng wording "Thêm bài tập", gây race + nhân đôi tap không đồng nhất

**Severity:** P2 (UX confusion)
**Status:** OPEN — deferred Pha 2 IA refactor (sheet-ize picker, F-009 follow-on).
**Discovered:** Turn 12, runtime cross-check

## Evidence

Trên `fitness.page.html` cùng 1 scroll surface có:

1. **Toggle picker** (line 200-210) trong card "Hôm nay" / Buổi tập tự do (khi `activeSession()=null`): button "Thêm bài tập tự do" — mở inline picker dưới scroll cùng page.
2. **Empty active CTA** (line 282-285): khi `activeSession()` tồn tại nhưng `session.exercises.length === 0` → button "Thêm bài tập" gọi `openFreeModeAndScroll()` (cuộn lên toggle ở (1) + mở freeModeOpen signal).
3. **Mid-session add** (KHÔNG có) — sau khi session đã có ≥1 exercise, không có CTA "Thêm bài tập" nào để user thêm bài thứ 2. User phải scroll lên cuộn ngược lên picker và toggle lại.

Runtime Turn 12: tap "THÊM BÀI TẬP" trong empty state thực tế **bị `/tmp/uihit.py tap "Thêm bài tập"` mismatch** (vì hệ thống tìm thấy toggle button (1) trước → tap nhầm). Người dùng thật cũng dễ nhầm vì 2 button cùng label trong cùng viewport.

## Liên hệ F-009

F-009 (turn 1) đề xuất tách picker thành `<app-exercise-picker-sheet>` modal sheet, sống ở 2 trigger contexts: (a) Tập luyện hub khi không có session, (b) Active workout page (Pha 2) khi có session, trigger từ footer secondary. Hiện tại chưa tách → F-017 là một biểu hiện cụ thể của F-009.

## Fix proposal (Pha 2, đồng bộ F-009)

- Convert inline `.exercise-picker` thành `IonModal` standalone component `<app-exercise-picker-sheet>`.
- Single trigger: 1 button "Thêm bài tập" duy nhất theo context:
  - Pre-session: trong empty-active CTA (line 282).
  - Mid-session: trong workout-exercise-tabs row, ngay sau danh sách tab pill.
- Đóng toggle "Thêm bài tập tự do" trong card "Hôm nay" — chỉ giữ "Bắt đầu buổi tự do" (no picker; sheet sẽ mở từ inside session).

## Pha 1 mitigation (tiết kiệm)

Đổi wording để giảm nhầm: rename toggle từ "Thêm bài tập tự do" thành "Chọn nhanh bài tập" (eyebrow rõ "trước khi bắt đầu") và empty-state button giữ "Thêm bài tập". Không refactor sheet ở Pha 1.

## Status

OPEN — Pha 2 IA refactor. Pha 1 mitigation (rename) chưa ship.
