# Scenario 41: Multi-Session System

**Version:** 1.0  
**Date:** 2026-06-29  
**Total Test Cases:** 72

---

## Mô tả tổng quan

Multi-Session System là hệ thống cho phép người dùng lên kế hoạch và thực hiện tối đa 3 buổi tập luyện (sessions) trong cùng một ngày — ví dụ: Buổi sáng Strength + Buổi chiều Cardio + Buổi tối Freestyle. Scenario này kiểm thử toàn bộ vòng đời của multi-session: từ giao diện tab chuyển đổi (SessionTabs với icon Sun/Moon/Sunset), modal thêm session (AddSessionModal với 3 loại Strength/Cardio/Freestyle), trạng thái theo dõi hoàn thành từng phần (training-partial khi 1+ session xong nhưng chưa hết), cho đến cơ chế tự động sinh lịch multi-session dựa trên daysPerWeek và sessionDurationMin.

**Components chính:**
- **SessionTabs**: Pill-style tab switcher hiển thị các session hiện có với icon Sun (session 1), Moon (session 2), Sunset (session 3), và tab "+" để thêm session mới. Ẩn hoàn toàn khi chỉ có 1 session (backward compatible). Session đã hoàn thành hiển thị icon Check thay thế.
- **AddSessionModal**: Bottom sheet cung cấp 3 lựa chọn loại session — Strength (yêu cầu chọn muscle groups từ 7 nhóm cơ dạng toggleable chips), Cardio, và Freestyle. Bị disable khi đã đạt tối đa 3 sessions.
- **TodaysPlanCard**: Hiển thị trạng thái "training-partial" khi một số sessions đã hoàn thành nhưng chưa tất cả, với thông tin completedSessions/totalSessions.
- **useTodaysPlan**: Hook trả về totalSessions, completedSessions, todayPlanDays[], nextUncompletedSession để điều phối giao diện.
- **fitnessStore**: Quản lý actions addPlanDaySession và removePlanDaySession, cập nhật daySessionsMap.
- **TrainingPlanView**: Tích hợp SessionTabs, nhóm sessions theo dayOfWeek qua daySessionsMap, quản lý activeSessionIds.

**Data model changes:**
- `TrainingPlanDay`: thêm trường `sessionOrder` (1-3) xác định thứ tự session trong ngày, và `originalExercises` (backup bài tập gốc trước khi chỉnh sửa).
- `Workout`: thêm trường `planDayId` (FK tới training_plan_days, null cho freestyle) cho phép liên kết workout với session cụ thể, hỗ trợ partial tracking.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| SessionTabs | SessionTabs.tsx | Pill-style tab switcher Sun/Moon/Sunset, ẩn khi 1 session |
| AddSessionModal | AddSessionModal.tsx | Bottom sheet thêm session: Strength/Cardio/Freestyle |
| TodaysPlanCard | TodaysPlanCard.tsx | Hiển thị trạng thái training-partial, completedSessions |
| useTodaysPlan | useTodaysPlan.ts | Hook: totalSessions, completedSessions, nextUncompletedSession |
| useFitnessStore | fitnessStore.ts | Actions: addPlanDaySession, removePlanDaySession |
| TrainingPlanView | TrainingPlanView.tsx | Tích hợp SessionTabs, daySessionsMap, activeSessionIds |
| TrainingPlanDay | types.ts | Model: +sessionOrder (1-3), +originalExercises |
| Workout | types.ts | Model: +planDayId (FK → training_plan_days, null = freestyle) |

## Luồng nghiệp vụ

1. User mở TrainingPlanView → hệ thống load danh sách sessions theo dayOfWeek từ daySessionsMap
2. Nếu chỉ có 1 session → SessionTabs ẩn hoàn toàn (backward compatible với plan cũ)
3. Nếu có 2+ sessions → SessionTabs hiển thị các pill tabs với icon tương ứng (Sun/Moon/Sunset)
4. User nhấn tab "+" → mở AddSessionModal (bottom sheet) với 3 lựa chọn: Strength, Cardio, Freestyle
5. Nếu chọn Strength → hiển thị 7 muscle group chips (Chest, Back, Shoulders, Arms, Legs, Core, Full Body) → user toggle chọn → confirm → gọi `addPlanDaySession` với sessionOrder tiếp theo
6. Nếu chọn Cardio hoặc Freestyle → không cần chọn muscle group → confirm → gọi `addPlanDaySession`
7. Session mới được thêm vào daySessionsMap với sessionOrder = (số session hiện có + 1)
8. User chuyển đổi giữa các sessions bằng cách nhấn tab tương ứng → activeSessionIds cập nhật → nội dung exercises thay đổi theo session được chọn
9. User hoàn thành workout cho 1 session → Workout record tạo với planDayId liên kết đến TrainingPlanDay tương ứng
10. TodaysPlanCard cập nhật: completedSessions tăng, trạng thái chuyển sang "training-partial" nếu chưa hoàn thành tất cả
11. SessionTabs cập nhật: session đã hoàn thành hiển thị icon Check thay vì icon thời gian
12. Khi tất cả sessions hoàn thành → trạng thái chuyển sang "training-completed"
13. User có thể xóa session (trừ session cuối cùng) qua long-press hoặc context menu → gọi `removePlanDaySession`

## Quy tắc nghiệp vụ

1. **Tối đa 3 sessions mỗi ngày**: Mỗi ngày trong plan chỉ được phép có tối đa 3 sessions (sessionOrder 1, 2, 3). Tab "+" bị disable khi đạt 3.
2. **SessionOrder tuần tự**: Sessions luôn có sessionOrder 1, 2, 3 theo thứ tự thêm vào. Khi xóa session giữa, các session sau được reorder.
3. **SessionTabs ẩn khi 1 session**: Backward compatible — plan cũ chỉ có 1 session sẽ không thấy tabs (UX không đổi).
4. **Icon mapping cố định**: Session 1 = Sun (☀️), Session 2 = Moon (🌙), Session 3 = Sunset (🌅). Session hoàn thành = Check (✓).
5. **Strength yêu cầu muscle groups**: Khi chọn loại Strength trong AddSessionModal, bắt buộc phải chọn ít nhất 1 trong 7 muscle groups trước khi confirm.
6. **7 muscle groups**: Chest, Back, Shoulders, Arms, Legs, Core, Full Body — hiển thị dạng toggleable chips.
7. **State progression**: training-pending → training-partial → training-completed. Trạng thái "training-partial" xuất hiện khi completedSessions ≥ 1 và completedSessions < totalSessions.
8. **planDayId liên kết workout ↔ session**: Mỗi Workout record có planDayId trỏ đến TrainingPlanDay cụ thể (null cho freestyle). Cho phép theo dõi session nào đã hoàn thành.
9. **Auto-generation — Cardio on rest days**: Khi daysPerWeek ≤ 4, hệ thống tự thêm Cardio session vào các ngày nghỉ (single session, không multi-session).
10. **Auto-generation — Cardio as session 2**: Khi daysPerWeek ≥ 5, Cardio được thêm làm session 2 vào ngày strength nhẹ nhất (lightest).
11. **Auto-generation — Never Cardio HIIT + Legs**: Không bao giờ đặt Cardio HIIT cùng ngày với Legs strength.
12. **Auto-generation — Max 2 double-session days**: Tối đa 2 ngày có 2 sessions trong tuần.
13. **Auto-generation — Split heavy day**: Khi sessionDurationMin ≤ 45 VÀ daysPerWeek ≥ 5, ngày strength nặng nhất được split thành 2 sessions.
14. **originalExercises backup**: Khi user chỉnh sửa exercises của 1 session, bài tập gốc được lưu trong trường originalExercises để có thể reset.

## Test Cases (72 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_MSS_01 | SessionTabs ẩn hoàn toàn khi chỉ có 1 session | Positive | P0 |
| TC_MSS_02 | SessionTabs hiển thị khi có 2 sessions | Positive | P0 |
| TC_MSS_03 | SessionTabs hiển thị khi có 3 sessions | Positive | P0 |
| TC_MSS_04 | Session 1 hiển thị icon Sun | Positive | P0 |
| TC_MSS_05 | Session 2 hiển thị icon Moon | Positive | P0 |
| TC_MSS_06 | Session 3 hiển thị icon Sunset | Positive | P0 |
| TC_MSS_07 | Tab "+" hiển thị khi sessions < 3 | Positive | P0 |
| TC_MSS_08 | Tab "+" bị disable khi đã có 3 sessions | Positive | P0 |
| TC_MSS_09 | Nhấn tab chuyển đổi active session | Positive | P0 |
| TC_MSS_10 | Active tab có visual highlight (pill style selected) | Positive | P1 |
| TC_MSS_11 | Session hoàn thành hiển thị icon Check thay thế | Positive | P0 |
| TC_MSS_12 | Session chưa hoàn thành giữ icon thời gian gốc | Positive | P1 |
| TC_MSS_13 | SessionTabs render đúng data-testid | Positive | P1 |
| TC_MSS_14 | Tab "+" gọi mở AddSessionModal | Positive | P0 |
| TC_MSS_15 | AddSessionModal hiển thị 3 lựa chọn: Strength, Cardio, Freestyle | Positive | P0 |
| TC_MSS_16 | Chọn Strength → hiển thị 7 muscle group chips | Positive | P0 |
| TC_MSS_17 | 7 muscle groups đúng: Chest, Back, Shoulders, Arms, Legs, Core, Full Body | Positive | P0 |
| TC_MSS_18 | Muscle group chips toggleable (chọn/bỏ chọn) | Positive | P1 |
| TC_MSS_19 | Strength: confirm bị disable khi chưa chọn muscle group nào | Negative | P0 |
| TC_MSS_20 | Strength: confirm enable khi chọn ≥ 1 muscle group | Positive | P0 |
| TC_MSS_21 | Strength: chọn nhiều muscle groups cùng lúc | Positive | P1 |
| TC_MSS_22 | Chọn Cardio → không hiển thị muscle group selection | Positive | P1 |
| TC_MSS_23 | Chọn Freestyle → không hiển thị muscle group selection | Positive | P1 |
| TC_MSS_24 | Cardio: confirm ngay lập tức (không cần chọn thêm) | Positive | P1 |
| TC_MSS_25 | Freestyle: confirm ngay lập tức (không cần chọn thêm) | Positive | P1 |
| TC_MSS_26 | AddSessionModal đóng sau confirm thành công | Positive | P1 |
| TC_MSS_27 | AddSessionModal đóng khi nhấn backdrop/cancel | Positive | P1 |
| TC_MSS_28 | AddSessionModal không mở khi đã có 3 sessions (tab "+" disabled) | Negative | P0 |
| TC_MSS_29 | Session mới được thêm với sessionOrder đúng (tiếp theo) | Positive | P0 |
| TC_MSS_30 | addPlanDaySession gọi với đúng tham số (dayOfWeek, sessionOrder, type) | Positive | P0 |
| TC_MSS_31 | Session mới xuất hiện ngay trong SessionTabs sau khi thêm | Positive | P1 |
| TC_MSS_32 | removePlanDaySession xóa session thành công | Positive | P0 |
| TC_MSS_33 | Sau xóa session giữa, các session còn lại được reorder | Positive | P1 |
| TC_MSS_34 | Không thể xóa session cuối cùng (ít nhất 1 session) | Negative | P0 |
| TC_MSS_35 | Xóa session → activeSessionIds cập nhật | Positive | P1 |
| TC_MSS_36 | Trạng thái training-partial khi 1/2 sessions hoàn thành | Positive | P0 |
| TC_MSS_37 | Trạng thái training-partial khi 1/3 sessions hoàn thành | Positive | P0 |
| TC_MSS_38 | Trạng thái training-partial khi 2/3 sessions hoàn thành | Positive | P0 |
| TC_MSS_39 | Trạng thái training-pending khi 0 sessions hoàn thành | Positive | P0 |
| TC_MSS_40 | Trạng thái training-completed khi tất cả sessions hoàn thành | Positive | P0 |
| TC_MSS_41 | useTodaysPlan.totalSessions trả về đúng số lượng sessions | Positive | P0 |
| TC_MSS_42 | useTodaysPlan.completedSessions trả về đúng số sessions hoàn thành | Positive | P0 |
| TC_MSS_43 | useTodaysPlan.nextUncompletedSession trả về session tiếp theo chưa hoàn thành | Positive | P0 |
| TC_MSS_44 | nextUncompletedSession = undefined khi tất cả đã hoàn thành | Positive | P1 |
| TC_MSS_45 | useTodaysPlan.todayPlanDays[] chứa đúng các PlanDay của hôm nay | Positive | P1 |
| TC_MSS_46 | TodaysPlanCard hiển thị completedSessions/totalSessions | Positive | P0 |
| TC_MSS_47 | Workout record tạo với planDayId đúng khi hoàn thành session | Positive | P0 |
| TC_MSS_48 | planDayId = null cho freestyle workout (không liên kết plan) | Positive | P1 |
| TC_MSS_49 | TrainingPlanView nhóm sessions theo dayOfWeek qua daySessionsMap | Positive | P0 |
| TC_MSS_50 | activeSessionIds cập nhật khi chuyển tab | Positive | P1 |
| TC_MSS_51 | Nội dung exercises thay đổi khi chuyển session tab | Positive | P0 |
| TC_MSS_52 | Auto-gen: daysPerWeek=3 → Cardio trên rest days (single session) | Positive | P0 |
| TC_MSS_53 | Auto-gen: daysPerWeek=4 → Cardio trên rest days (single session) | Positive | P1 |
| TC_MSS_54 | Auto-gen: daysPerWeek=5 → Cardio làm session 2 trên ngày nhẹ nhất | Positive | P0 |
| TC_MSS_55 | Auto-gen: daysPerWeek=6 → Cardio làm session 2 trên ngày nhẹ nhất | Positive | P1 |
| TC_MSS_56 | Auto-gen: KHÔNG đặt Cardio HIIT cùng ngày với Legs | Negative | P0 |
| TC_MSS_57 | Auto-gen: tối đa 2 ngày có double-session trong tuần | Positive | P0 |
| TC_MSS_58 | Auto-gen: sessionDurationMin ≤ 45 + daysPerWeek ≥ 5 → split ngày nặng nhất | Positive | P1 |
| TC_MSS_59 | Auto-gen: sessionDurationMin > 45 → không split | Positive | P1 |
| TC_MSS_60 | Auto-gen: daysPerWeek < 5 → không split dù sessionDurationMin ≤ 45 | Boundary | P1 |
| TC_MSS_61 | SessionOrder luôn 1, 2, 3 — không có gap | Boundary | P0 |
| TC_MSS_62 | dayOfWeek = 7 (Chủ nhật) xử lý đúng | Boundary | P1 |
| TC_MSS_63 | dayOfWeek = 1 (Thứ hai) xử lý đúng | Boundary | P1 |
| TC_MSS_64 | Rapid switching giữa các tabs không gây race condition | Edge | P1 |
| TC_MSS_65 | originalExercises lưu backup khi chỉnh sửa exercises | Positive | P1 |
| TC_MSS_66 | Reset exercises khôi phục từ originalExercises | Positive | P1 |
| TC_MSS_67 | SessionTabs có role="tablist" cho accessibility | Positive | P1 |
| TC_MSS_68 | Mỗi tab có role="tab" và aria-selected đúng | Positive | P1 |
| TC_MSS_69 | Keyboard navigation: Arrow keys chuyển tab | Positive | P2 |
| TC_MSS_70 | Touch target mỗi tab ≥ 44px | Positive | P1 |
| TC_MSS_71 | Dark mode: SessionTabs contrast đạt WCAG AA | Positive | P2 |
| TC_MSS_72 | SQLite failure khi addPlanDaySession → hiển thị error, không crash | Negative | P1 |

---

## Chi tiết Test Cases

### A. SessionTabs Rendering (TC_MSS_01 → TC_MSS_14)

##### TC_MSS_01: SessionTabs ẩn hoàn toàn khi chỉ có 1 session
- **Pre-conditions**: TrainingPlanDay có 1 session duy nhất (sessionOrder=1) cho ngày đang xem
- **Steps**:
  1. Render TrainingPlanView với plan có 1 session/ngày
  2. Kiểm tra DOM cho SessionTabs component
- **Expected**: SessionTabs không render trong DOM (null hoặc hidden), giao diện tương tự plan cũ chỉ có 1 session — backward compatible
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_02: SessionTabs hiển thị khi có 2 sessions
- **Pre-conditions**: TrainingPlanDay có 2 sessions (sessionOrder 1 và 2) cho ngày đang xem
- **Steps**:
  1. Render TrainingPlanView với plan có 2 sessions cho 1 ngày
  2. Kiểm tra SessionTabs component trong DOM
- **Expected**: SessionTabs visible, hiển thị 2 tab pills + tab "+"
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_03: SessionTabs hiển thị khi có 3 sessions
- **Pre-conditions**: TrainingPlanDay có 3 sessions (sessionOrder 1, 2, 3)
- **Steps**:
  1. Render TrainingPlanView với plan có 3 sessions cho 1 ngày
  2. Kiểm tra SessionTabs component
- **Expected**: SessionTabs visible, hiển thị 3 tab pills, tab "+" disabled hoặc ẩn
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_04: Session 1 hiển thị icon Sun
- **Pre-conditions**: SessionTabs visible với ≥ 1 session
- **Steps**:
  1. Render SessionTabs với 2+ sessions
  2. Kiểm tra icon của tab đầu tiên (sessionOrder=1)
- **Expected**: Tab session 1 hiển thị icon Sun (☀️)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_05: Session 2 hiển thị icon Moon
- **Pre-conditions**: SessionTabs visible với ≥ 2 sessions
- **Steps**:
  1. Render SessionTabs với 2+ sessions
  2. Kiểm tra icon của tab thứ hai (sessionOrder=2)
- **Expected**: Tab session 2 hiển thị icon Moon (🌙)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_06: Session 3 hiển thị icon Sunset
- **Pre-conditions**: SessionTabs visible với 3 sessions
- **Steps**:
  1. Render SessionTabs với 3 sessions
  2. Kiểm tra icon của tab thứ ba (sessionOrder=3)
- **Expected**: Tab session 3 hiển thị icon Sunset (🌅)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_07: Tab "+" hiển thị khi sessions < 3
- **Pre-conditions**: Ngày hiện tại có 1 hoặc 2 sessions
- **Steps**:
  1. Render SessionTabs với 2 sessions
  2. Kiểm tra sự hiện diện của tab "+" sau các session tabs
- **Expected**: Tab "+" hiển thị, clickable, cho phép thêm session mới
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_08: Tab "+" bị disable khi đã có 3 sessions
- **Pre-conditions**: Ngày hiện tại đã có đúng 3 sessions
- **Steps**:
  1. Render SessionTabs với 3 sessions
  2. Kiểm tra trạng thái tab "+"
  3. Thử nhấn tab "+"
- **Expected**: Tab "+" hiển thị nhưng bị disable (opacity giảm, cursor not-allowed), nhấn không mở AddSessionModal
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_09: Nhấn tab chuyển đổi active session
- **Pre-conditions**: SessionTabs visible với 2+ sessions, session 1 đang active
- **Steps**:
  1. Render SessionTabs với 2 sessions, session 1 active
  2. Nhấn tab session 2
  3. Kiểm tra active state
- **Expected**: Session 2 trở thành active (highlighted), session 1 bỏ highlight, nội dung exercises cập nhật theo session 2
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_10: Active tab có visual highlight (pill style selected)
- **Pre-conditions**: SessionTabs visible, 1 tab đang active
- **Steps**:
  1. Render SessionTabs với session 1 active
  2. Kiểm tra CSS/style của active tab
- **Expected**: Active tab có background highlight (pill style), khác biệt rõ ràng so với tabs inactive
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_11: Session hoàn thành hiển thị icon Check thay thế
- **Pre-conditions**: Session 1 đã có workout record hoàn thành (completedAt not null)
- **Steps**:
  1. Render SessionTabs với session 1 đã hoàn thành
  2. Kiểm tra icon của tab session 1
- **Expected**: Tab session 1 hiển thị icon Check (✓) thay vì icon Sun ban đầu
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_12: Session chưa hoàn thành giữ icon thời gian gốc
- **Pre-conditions**: Session 2 chưa có workout record hoàn thành
- **Steps**:
  1. Render SessionTabs với session 2 chưa hoàn thành
  2. Kiểm tra icon của tab session 2
- **Expected**: Tab session 2 vẫn hiển thị icon Moon (🌙), không thay đổi
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_13: SessionTabs render đúng data-testid
- **Pre-conditions**: SessionTabs component mounted
- **Steps**:
  1. Render SessionTabs
  2. Query DOM bằng data-testid
- **Expected**: Container có data-testid="session-tabs", mỗi tab có data-testid="session-tab-{sessionOrder}"
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_14: Tab "+" gọi mở AddSessionModal
- **Pre-conditions**: SessionTabs visible, < 3 sessions
- **Steps**:
  1. Render SessionTabs với 1 session
  2. Nhấn tab "+"
  3. Kiểm tra AddSessionModal
- **Expected**: AddSessionModal mở dạng bottom sheet, hiển thị 3 lựa chọn loại session
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

### B. AddSessionModal Flows (TC_MSS_15 → TC_MSS_28)

##### TC_MSS_15: AddSessionModal hiển thị 3 lựa chọn: Strength, Cardio, Freestyle
- **Pre-conditions**: AddSessionModal đã mở
- **Steps**:
  1. Mở AddSessionModal qua tab "+"
  2. Kiểm tra nội dung modal
- **Expected**: Modal hiển thị 3 options rõ ràng: "Strength" (với icon tạ), "Cardio" (với icon chạy), "Freestyle" (với icon tự do)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_16: Chọn Strength → hiển thị 7 muscle group chips
- **Pre-conditions**: AddSessionModal mở
- **Steps**:
  1. Nhấn option "Strength"
  2. Kiểm tra UI thay đổi
- **Expected**: Hiển thị 7 muscle group chips dạng toggleable: Chest, Back, Shoulders, Arms, Legs, Core, Full Body
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_17: 7 muscle groups đúng: Chest, Back, Shoulders, Arms, Legs, Core, Full Body
- **Pre-conditions**: AddSessionModal mở, Strength đã chọn
- **Steps**:
  1. Chọn Strength trong AddSessionModal
  2. Đếm và kiểm tra tên các muscle group chips
- **Expected**: Đúng 7 chips hiển thị với text: "Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Full Body"
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_18: Muscle group chips toggleable (chọn/bỏ chọn)
- **Pre-conditions**: Strength đã chọn, muscle group chips hiển thị
- **Steps**:
  1. Nhấn chip "Chest" → kiểm tra trạng thái selected
  2. Nhấn chip "Chest" lần nữa → kiểm tra trạng thái deselected
  3. Nhấn chip "Back" → kiểm tra "Back" selected, "Chest" vẫn deselected
- **Expected**: Chips hoạt động toggle: nhấn lần 1 = selected (highlight), nhấn lần 2 = deselected. Nhiều chips có thể selected cùng lúc
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_19: Strength: confirm bị disable khi chưa chọn muscle group nào
- **Pre-conditions**: Strength đã chọn, 0 muscle groups được chọn
- **Steps**:
  1. Chọn Strength trong AddSessionModal
  2. Không chọn muscle group nào
  3. Kiểm tra nút Confirm
- **Expected**: Nút Confirm bị disable (opacity giảm, không clickable)
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P0

##### TC_MSS_20: Strength: confirm enable khi chọn ≥ 1 muscle group
- **Pre-conditions**: Strength đã chọn
- **Steps**:
  1. Chọn Strength
  2. Chọn muscle group "Chest"
  3. Kiểm tra nút Confirm
- **Expected**: Nút Confirm enable (highlight, clickable)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_21: Strength: chọn nhiều muscle groups cùng lúc
- **Pre-conditions**: Strength đã chọn
- **Steps**:
  1. Chọn Strength
  2. Chọn "Chest", "Back", "Shoulders" (3 muscle groups)
  3. Nhấn Confirm
- **Expected**: Session mới tạo với 3 muscle groups được liên kết, addPlanDaySession gọi với danh sách muscles = ["Chest", "Back", "Shoulders"]
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_22: Chọn Cardio → không hiển thị muscle group selection
- **Pre-conditions**: AddSessionModal mở
- **Steps**:
  1. Nhấn option "Cardio"
  2. Kiểm tra UI
- **Expected**: Không hiển thị muscle group chips, nút Confirm enable ngay lập tức
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_23: Chọn Freestyle → không hiển thị muscle group selection
- **Pre-conditions**: AddSessionModal mở
- **Steps**:
  1. Nhấn option "Freestyle"
  2. Kiểm tra UI
- **Expected**: Không hiển thị muscle group chips, nút Confirm enable ngay lập tức
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_24: Cardio: confirm ngay lập tức (không cần chọn thêm)
- **Pre-conditions**: AddSessionModal mở
- **Steps**:
  1. Chọn Cardio
  2. Nhấn Confirm
- **Expected**: Modal đóng, session Cardio mới được thêm thành công với sessionOrder tiếp theo
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_25: Freestyle: confirm ngay lập tức (không cần chọn thêm)
- **Pre-conditions**: AddSessionModal mở
- **Steps**:
  1. Chọn Freestyle
  2. Nhấn Confirm
- **Expected**: Modal đóng, session Freestyle mới được thêm thành công với sessionOrder tiếp theo
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_26: AddSessionModal đóng sau confirm thành công
- **Pre-conditions**: AddSessionModal mở, session type đã chọn (Cardio cho đơn giản)
- **Steps**:
  1. Chọn Cardio
  2. Nhấn Confirm
  3. Kiểm tra modal state
- **Expected**: Modal đóng smooth (animation slide down), SessionTabs cập nhật hiển thị session mới
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_27: AddSessionModal đóng khi nhấn backdrop/cancel
- **Pre-conditions**: AddSessionModal đang mở
- **Steps**:
  1. Mở AddSessionModal
  2. Nhấn backdrop (vùng tối bên ngoài modal) hoặc nút Cancel
- **Expected**: Modal đóng, không thêm session mới, state không thay đổi
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_28: AddSessionModal không mở khi đã có 3 sessions (tab "+" disabled)
- **Pre-conditions**: Ngày đang xem đã có đúng 3 sessions
- **Steps**:
  1. Xác nhận có 3 sessions
  2. Nhấn tab "+"
  3. Kiểm tra AddSessionModal
- **Expected**: AddSessionModal KHÔNG mở, tab "+" không phản hồi click event
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P0

### C. Session Lifecycle (TC_MSS_29 → TC_MSS_35)

##### TC_MSS_29: Session mới được thêm với sessionOrder đúng (tiếp theo)
- **Pre-conditions**: Ngày hiện có 1 session (sessionOrder=1)
- **Steps**:
  1. Thêm session mới qua AddSessionModal (chọn Cardio)
  2. Kiểm tra sessionOrder của session mới trong store
- **Expected**: Session mới có sessionOrder=2
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_30: addPlanDaySession gọi với đúng tham số
- **Pre-conditions**: Ngày Monday (dayOfWeek=1), hiện có 1 session
- **Steps**:
  1. Mock fitnessStore.addPlanDaySession
  2. Thêm session Strength với muscle group "Back"
  3. Kiểm tra tham số gọi
- **Expected**: addPlanDaySession được gọi với { dayOfWeek: 1, sessionOrder: 2, type: 'strength', muscleGroups: ['Back'] }
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_31: Session mới xuất hiện ngay trong SessionTabs sau khi thêm
- **Pre-conditions**: SessionTabs đang hiển thị 1 session
- **Steps**:
  1. Thêm session mới
  2. Kiểm tra SessionTabs render
- **Expected**: SessionTabs re-render ngay lập tức, hiển thị 2 tabs thay vì 1 (hoặc tabs xuất hiện nếu trước đó ẩn)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_32: removePlanDaySession xóa session thành công
- **Pre-conditions**: Ngày có 2 sessions
- **Steps**:
  1. Gọi removePlanDaySession cho session 2
  2. Kiểm tra daySessionsMap
- **Expected**: Session 2 bị xóa, daySessionsMap chỉ còn session 1
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_33: Sau xóa session giữa, các session còn lại được reorder
- **Pre-conditions**: Ngày có 3 sessions (order 1, 2, 3)
- **Steps**:
  1. Xóa session 2
  2. Kiểm tra sessionOrder của các session còn lại
- **Expected**: Session 1 giữ order=1, session cũ order=3 → reorder thành order=2. Không có gap trong sessionOrder
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_34: Không thể xóa session cuối cùng (ít nhất 1 session)
- **Pre-conditions**: Ngày chỉ có 1 session duy nhất
- **Steps**:
  1. Thử gọi removePlanDaySession cho session duy nhất
  2. Kiểm tra kết quả
- **Expected**: Hành động bị từ chối hoặc nút xóa ẩn/disable, luôn giữ ít nhất 1 session
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P0

##### TC_MSS_35: Xóa session → activeSessionIds cập nhật
- **Pre-conditions**: Session 2 đang active, ngày có 2 sessions
- **Steps**:
  1. Xóa session 2 (đang active)
  2. Kiểm tra activeSessionIds
- **Expected**: activeSessionIds tự động chuyển về session 1 (session còn lại), không ở trạng thái trống
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

### D. Multi-Session State Tracking (TC_MSS_36 → TC_MSS_48)

##### TC_MSS_36: Trạng thái training-partial khi 1/2 sessions hoàn thành
- **Pre-conditions**: Ngày có 2 sessions, session 1 đã có workout record hoàn thành
- **Steps**:
  1. Setup: 2 sessions, 1 completed
  2. Gọi useTodaysPlan
  3. Kiểm tra state
- **Expected**: state = 'training-partial', completedSessions = 1, totalSessions = 2
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_37: Trạng thái training-partial khi 1/3 sessions hoàn thành
- **Pre-conditions**: Ngày có 3 sessions, session 1 đã hoàn thành
- **Steps**:
  1. Setup: 3 sessions, 1 completed
  2. Gọi useTodaysPlan
- **Expected**: state = 'training-partial', completedSessions = 1, totalSessions = 3
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_38: Trạng thái training-partial khi 2/3 sessions hoàn thành
- **Pre-conditions**: Ngày có 3 sessions, session 1 và 2 đã hoàn thành
- **Steps**:
  1. Setup: 3 sessions, 2 completed
  2. Gọi useTodaysPlan
- **Expected**: state = 'training-partial', completedSessions = 2, totalSessions = 3
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_39: Trạng thái training-pending khi 0 sessions hoàn thành
- **Pre-conditions**: Ngày có 2 sessions, không session nào hoàn thành
- **Steps**:
  1. Setup: 2 sessions, 0 completed
  2. Gọi useTodaysPlan
- **Expected**: state = 'training-pending', completedSessions = 0, totalSessions = 2
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_40: Trạng thái training-completed khi tất cả sessions hoàn thành
- **Pre-conditions**: Ngày có 2 sessions, cả 2 đều hoàn thành
- **Steps**:
  1. Setup: 2 sessions, 2 completed
  2. Gọi useTodaysPlan
- **Expected**: state = 'training-completed', completedSessions = 2, totalSessions = 2
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_41: useTodaysPlan.totalSessions trả về đúng số lượng sessions
- **Pre-conditions**: Ngày có 3 sessions
- **Steps**:
  1. Setup: 3 TrainingPlanDay records cho cùng ngày
  2. Gọi useTodaysPlan
  3. Kiểm tra totalSessions
- **Expected**: totalSessions = 3
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_42: useTodaysPlan.completedSessions trả về đúng số sessions hoàn thành
- **Pre-conditions**: 3 sessions, 2 có workout records với completedAt
- **Steps**:
  1. Setup: 3 sessions, 2 completed workouts liên kết qua planDayId
  2. Gọi useTodaysPlan
- **Expected**: completedSessions = 2
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_43: useTodaysPlan.nextUncompletedSession trả về session tiếp theo chưa hoàn thành
- **Pre-conditions**: 3 sessions, session 1 completed, session 2 chưa completed
- **Steps**:
  1. Setup: session 1 completed, session 2 và 3 chưa
  2. Gọi useTodaysPlan
- **Expected**: nextUncompletedSession = session 2 (sessionOrder=2)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_44: nextUncompletedSession = undefined khi tất cả đã hoàn thành
- **Pre-conditions**: Tất cả sessions đã hoàn thành
- **Steps**:
  1. Setup: 2 sessions, cả 2 completed
  2. Gọi useTodaysPlan
- **Expected**: nextUncompletedSession = undefined
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_45: useTodaysPlan.todayPlanDays[] chứa đúng các PlanDay của hôm nay
- **Pre-conditions**: Hôm nay là Wednesday (dayOfWeek=3), plan có 2 sessions cho Wednesday
- **Steps**:
  1. Setup: 2 TrainingPlanDay với dayOfWeek=3
  2. Gọi useTodaysPlan
- **Expected**: todayPlanDays.length = 2, cả 2 có dayOfWeek=3
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_46: TodaysPlanCard hiển thị completedSessions/totalSessions
- **Pre-conditions**: 3 sessions, 1 completed
- **Steps**:
  1. Render TodaysPlanCard với state training-partial
  2. Kiểm tra UI text
- **Expected**: Hiển thị "1/3 buổi tập hoàn thành" hoặc tương tự, phản ánh completedSessions/totalSessions
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_47: Workout record tạo với planDayId đúng khi hoàn thành session
- **Pre-conditions**: Session 2 (planDay id="pd-123") đang active, user bắt đầu workout
- **Steps**:
  1. Hoàn thành workout cho session 2
  2. Kiểm tra Workout record trong store/DB
- **Expected**: Workout.planDayId = "pd-123", liên kết chính xác với TrainingPlanDay của session 2
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_48: planDayId = null cho freestyle workout (không liên kết plan)
- **Pre-conditions**: User tạo freestyle workout không từ plan
- **Steps**:
  1. Tạo và hoàn thành freestyle workout
  2. Kiểm tra Workout record
- **Expected**: Workout.planDayId = null
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

### E. TrainingPlanView Integration (TC_MSS_49 → TC_MSS_51)

##### TC_MSS_49: TrainingPlanView nhóm sessions theo dayOfWeek qua daySessionsMap
- **Pre-conditions**: Plan có Monday 2 sessions, Wednesday 1 session, Friday 3 sessions
- **Steps**:
  1. Render TrainingPlanView
  2. Kiểm tra daySessionsMap
- **Expected**: daySessionsMap[1] = 2 sessions, daySessionsMap[3] = 1 session, daySessionsMap[5] = 3 sessions
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_50: activeSessionIds cập nhật khi chuyển tab
- **Pre-conditions**: TrainingPlanView render với Monday 2 sessions, session 1 active
- **Steps**:
  1. Nhấn tab session 2
  2. Kiểm tra activeSessionIds trong store
- **Expected**: activeSessionIds cho Monday cập nhật thành id của session 2
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_51: Nội dung exercises thay đổi khi chuyển session tab
- **Pre-conditions**: Session 1 = Chest exercises, Session 2 = Back exercises
- **Steps**:
  1. Xác nhận session 1 active → hiển thị Chest exercises
  2. Chuyển sang session 2
  3. Kiểm tra exercises hiển thị
- **Expected**: Exercises list cập nhật hiển thị Back exercises thay vì Chest exercises
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

### F. Auto-Generation Verification (TC_MSS_52 → TC_MSS_60)

##### TC_MSS_52: Auto-gen: daysPerWeek=3 → Cardio trên rest days (single session)
- **Pre-conditions**: User tạo plan với daysPerWeek=3
- **Steps**:
  1. Tạo training plan với daysPerWeek=3
  2. Kiểm tra plan generated cho 7 ngày trong tuần
- **Expected**: 3 ngày strength (single session), rest days có Cardio single session (không multi-session), phù hợp quy tắc daysPerWeek ≤ 4
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_53: Auto-gen: daysPerWeek=4 → Cardio trên rest days (single session)
- **Pre-conditions**: User tạo plan với daysPerWeek=4
- **Steps**:
  1. Tạo training plan với daysPerWeek=4
  2. Kiểm tra các rest days
- **Expected**: Rest days có Cardio single session, không có ngày nào multi-session
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_54: Auto-gen: daysPerWeek=5 → Cardio làm session 2 trên ngày nhẹ nhất
- **Pre-conditions**: User tạo plan với daysPerWeek=5
- **Steps**:
  1. Tạo training plan với daysPerWeek=5
  2. Tìm ngày strength nhẹ nhất (ít exercises/sets nhất)
  3. Kiểm tra session 2 của ngày đó
- **Expected**: Ngày strength nhẹ nhất có thêm Cardio làm session 2 (double-session), phù hợp quy tắc daysPerWeek ≥ 5
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_55: Auto-gen: daysPerWeek=6 → Cardio làm session 2 trên ngày nhẹ nhất
- **Pre-conditions**: User tạo plan với daysPerWeek=6
- **Steps**:
  1. Tạo training plan với daysPerWeek=6
  2. Kiểm tra multi-session days
- **Expected**: Có Cardio session 2 trên ngày/những ngày nhẹ nhất, tối đa 2 double-session days
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_56: Auto-gen: KHÔNG đặt Cardio HIIT cùng ngày với Legs
- **Pre-conditions**: Plan có ngày Legs strength
- **Steps**:
  1. Tạo plan với daysPerWeek=5 bao gồm ngày Legs
  2. Kiểm tra session 2 của ngày Legs
- **Expected**: Ngày Legs KHÔNG có Cardio HIIT làm session 2 (có thể có Cardio Low-Intensity hoặc không có session 2)
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P0

##### TC_MSS_57: Auto-gen: tối đa 2 ngày có double-session trong tuần
- **Pre-conditions**: Plan với daysPerWeek=6
- **Steps**:
  1. Tạo plan với daysPerWeek=6
  2. Đếm số ngày có ≥ 2 sessions
- **Expected**: Tối đa 2 ngày có double-session, các ngày còn lại single session
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MSS_58: Auto-gen: sessionDurationMin ≤ 45 + daysPerWeek ≥ 5 → split ngày nặng nhất
- **Pre-conditions**: sessionDurationMin=40, daysPerWeek=5
- **Steps**:
  1. Tạo plan với sessionDurationMin=40, daysPerWeek=5
  2. Tìm ngày strength nặng nhất (nhiều exercises/volume nhất)
  3. Kiểm tra sessions
- **Expected**: Ngày nặng nhất được split thành 2 sessions (exercises chia đều), mỗi session ≤ 40 phút
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_59: Auto-gen: sessionDurationMin > 45 → không split
- **Pre-conditions**: sessionDurationMin=60, daysPerWeek=5
- **Steps**:
  1. Tạo plan với sessionDurationMin=60, daysPerWeek=5
  2. Kiểm tra ngày nặng nhất
- **Expected**: Ngày nặng nhất KHÔNG bị split, vẫn 1 session duy nhất (vì sessionDurationMin > 45)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_60: Auto-gen: daysPerWeek < 5 → không split dù sessionDurationMin ≤ 45
- **Pre-conditions**: sessionDurationMin=30, daysPerWeek=4
- **Steps**:
  1. Tạo plan với sessionDurationMin=30, daysPerWeek=4
  2. Kiểm tra các ngày
- **Expected**: Không có ngày nào bị split (vì daysPerWeek < 5, chỉ thêm Cardio vào rest days)
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1

### G. Edge Cases & Boundary (TC_MSS_61 → TC_MSS_66)

##### TC_MSS_61: SessionOrder luôn 1, 2, 3 — không có gap
- **Pre-conditions**: Ngày có 3 sessions, xóa session 2, thêm session mới
- **Steps**:
  1. Setup: 3 sessions (order 1, 2, 3)
  2. Xóa session 2 → reorder → sessions có order 1, 2
  3. Thêm session mới
- **Expected**: Session mới có sessionOrder=3, tổng sessions order = [1, 2, 3], không có gap
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_MSS_62: dayOfWeek = 7 (Chủ nhật) xử lý đúng
- **Pre-conditions**: Plan có sessions vào Chủ nhật (dayOfWeek=7)
- **Steps**:
  1. Tạo plan với session vào dayOfWeek=7
  2. Kiểm tra daySessionsMap[7]
  3. Xác nhận SessionTabs hiển thị đúng cho ngày Chủ nhật
- **Expected**: daySessionsMap[7] chứa đúng sessions, không bị lỗi off-by-one
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1

##### TC_MSS_63: dayOfWeek = 1 (Thứ hai) xử lý đúng
- **Pre-conditions**: Plan có sessions vào Thứ hai (dayOfWeek=1)
- **Steps**:
  1. Tạo plan với session vào dayOfWeek=1
  2. Kiểm tra daySessionsMap[1]
- **Expected**: daySessionsMap[1] chứa đúng sessions, mapping chính xác
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1

##### TC_MSS_64: Rapid switching giữa các tabs không gây race condition
- **Pre-conditions**: 3 sessions, exercises đang load
- **Steps**:
  1. Nhấn tab 1 → ngay lập tức nhấn tab 2 → ngay lập tức nhấn tab 3
  2. Kiểm tra UI sau rapid switching
- **Expected**: UI hiển thị đúng exercises của session cuối cùng được chọn (session 3), không có trạng thái lẫn lộn giữa các sessions
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P1

##### TC_MSS_65: originalExercises lưu backup khi chỉnh sửa exercises
- **Pre-conditions**: Session 1 có exercises ["Bench Press", "Squat"]
- **Steps**:
  1. Chỉnh sửa exercises của session 1 (thêm "Deadlift")
  2. Kiểm tra trường originalExercises của TrainingPlanDay
- **Expected**: originalExercises chứa bản gốc ["Bench Press", "Squat"] trước khi chỉnh sửa
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_66: Reset exercises khôi phục từ originalExercises
- **Pre-conditions**: Session 1 đã bị chỉnh sửa, originalExercises có giá trị
- **Steps**:
  1. Gọi reset exercises cho session 1
  2. Kiểm tra exercises hiện tại
- **Expected**: Exercises trở về giá trị trong originalExercises, originalExercises được clear (null)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

### H. Accessibility & Dark Mode (TC_MSS_67 → TC_MSS_71)

##### TC_MSS_67: SessionTabs có role="tablist" cho accessibility
- **Pre-conditions**: SessionTabs rendered với 2+ sessions
- **Steps**:
  1. Render SessionTabs
  2. Kiểm tra ARIA attributes của container
- **Expected**: Container element có role="tablist"
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_68: Mỗi tab có role="tab" và aria-selected đúng
- **Pre-conditions**: SessionTabs rendered, session 1 active
- **Steps**:
  1. Kiểm tra ARIA attributes của mỗi tab element
  2. Xác nhận active tab vs inactive tabs
- **Expected**: Mỗi tab có role="tab", active tab có aria-selected="true", inactive tabs có aria-selected="false"
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_69: Keyboard navigation: Arrow keys chuyển tab
- **Pre-conditions**: SessionTabs focused
- **Steps**:
  1. Focus vào SessionTabs
  2. Nhấn ArrowRight → kiểm tra active tab
  3. Nhấn ArrowLeft → kiểm tra active tab
- **Expected**: ArrowRight chuyển sang tab tiếp theo, ArrowLeft quay lại tab trước, theo ARIA tab pattern
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_MSS_70: Touch target mỗi tab ≥ 44px
- **Pre-conditions**: SessionTabs rendered trên mobile viewport
- **Steps**:
  1. Render SessionTabs
  2. Đo kích thước clickable area của mỗi tab
- **Expected**: Mỗi tab có min-width ≥ 44px và min-height ≥ 44px (WCAG 2.5.5 Target Size)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MSS_71: Dark mode: SessionTabs contrast đạt WCAG AA
- **Pre-conditions**: App ở dark mode
- **Steps**:
  1. Bật dark mode
  2. Render SessionTabs
  3. Kiểm tra contrast ratio của text/icon so với background
- **Expected**: Contrast ratio ≥ 4.5:1 cho text, ≥ 3:1 cho UI components (WCAG AA)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

### I. Error Handling (TC_MSS_72)

##### TC_MSS_72: SQLite failure khi addPlanDaySession → hiển thị error, không crash
- **Pre-conditions**: Database connection có vấn đề hoặc SQLite write fail
- **Steps**:
  1. Mock database service throw error khi addPlanDaySession
  2. Thử thêm session mới qua AddSessionModal
  3. Kiểm tra UI
- **Expected**: App không crash, hiển thị error message (toast hoặc inline error), AddSessionModal vẫn mở để user thử lại
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1
