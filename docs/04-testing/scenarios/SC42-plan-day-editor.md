# Scenario 42: Plan Day Editor

**Version:** 1.0  
**Date:** 2026-06-29  
**Total Test Cases:** 55

---

## Mô tả tổng quan

Plan Day Editor là trang toàn màn hình (full-screen page) cho phép người dùng tùy chỉnh danh sách bài tập trong một buổi tập cụ thể thuộc kế hoạch tập luyện (Training Plan). Trang được mở qua `pushPage({ id: 'plan-day-editor', component: PlanDayEditor, props: { planDay } })` từ TrainingPlanView, nhất quán với kiến trúc navigation full-screen đã áp dụng cho WorkoutLogger.

Component chính `PlanDayEditor` (wrapped bởi `React.memo`) sử dụng React local state (`useState`) để quản lý danh sách bài tập đang chỉnh sửa (`localExercises`), kết hợp Zustand store (`fitnessStore`) để lưu trữ vĩnh viễn vào SQLite. Dữ liệu bài tập được lưu dưới dạng JSON string trong `TrainingPlanDay.exercises` (phiên bản chỉnh sửa) và `TrainingPlanDay.originalExercises` (bản gốc bất biến từ lúc tạo kế hoạch).

Các tính năng chính bao gồm: (1) hiển thị danh sách bài tập với tên, số hiệp, số lần lặp và thời gian nghỉ; (2) sắp xếp lại thứ tự bài tập bằng nút ChevronUp/ChevronDown; (3) xóa bài tập riêng lẻ bằng nút X; (4) thêm bài tập mới qua ExerciseSelector bottom sheet; (5) lưu thay đổi gọi `fitnessStore.updatePlanDayExercises(dayId, newExercises)` và `popPage()`; (6) khôi phục bản gốc gọi `fitnessStore.restorePlanDayOriginal(dayId)` đưa exercises về originalExercises; (7) badge trạng thái "Đã chỉnh sửa" hiển thị khi exercises khác originalExercises hoặc có thay đổi local chưa lưu; (8) dialog cảnh báo thay đổi chưa lưu khi nhấn nút Back trong khi có thay đổi.

Hệ thống phát hiện thay đổi hoạt động trên hai cấp độ: `hasChanges` so sánh `JSON.stringify(localExercises)` với snapshot ban đầu (phát hiện chỉnh sửa local chưa lưu), và `isModified` so sánh `planDay.exercises` với `planDay.originalExercises` (phát hiện thay đổi đã lưu trước đó so với bản gốc). Badge hiển thị khi bất kỳ cấp độ nào phát hiện thay đổi.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| PlanDayEditor | src/features/fitness/components/PlanDayEditor.tsx | Trang full-screen chỉnh sửa danh sách bài tập trong buổi tập |
| ExerciseSelector | src/features/fitness/components/ExerciseSelector.tsx | Bottom sheet chọn bài tập mới (tìm kiếm, lọc nhóm cơ/dụng cụ) |
| useFitnessStore | src/store/fitnessStore.ts | Zustand store quản lý trạng thái fitness + persistence SQLite |
| useNavigationStore | src/store/navigationStore.ts | Zustand store quản lý page stack (pushPage/popPage) |
| safeJsonParse | src/features/fitness/utils/safeJsonParse.ts | Tiện ích parse JSON an toàn với fallback value |
| updatePlanDayExercises() | fitnessStore.ts | Cập nhật exercises của TrainingPlanDay (state + SQLite) |
| restorePlanDayOriginal() | fitnessStore.ts | Khôi phục exercises = originalExercises (state + SQLite) |
| TrainingPlanDay | src/features/fitness/types.ts | Interface định nghĩa cấu trúc dữ liệu buổi tập |
| SelectedExercise | src/features/fitness/types.ts | Interface bài tập đã chọn (exercise, sets, repsMin, repsMax, restSeconds) |
| Exercise | src/features/fitness/types.ts | Interface bài tập gốc (id, nameVi, nameEn, muscleGroup, equipment...) |

## Luồng nghiệp vụ

1. Người dùng mở TrainingPlanView, nhấn nút Edit (biểu tượng Pencil) trên một buổi tập cụ thể
2. Hệ thống gọi `pushPage({ id: 'plan-day-editor', component: PlanDayEditor, props: { planDay } })` — trang PlanDayEditor mở full-screen
3. PlanDayEditor parse `planDay.exercises` qua `safeJsonParse()` → khởi tạo `localExercises` state
4. Hiển thị danh sách bài tập với tên (nameVi), số hiệp (sets), phạm vi reps (repsMin–repsMax) và thời gian nghỉ (restSeconds)
5. Người dùng có thể sắp xếp lại thứ tự bằng nút ChevronUp/ChevronDown — hoán đổi vị trí 2 phần tử liền kề trong mảng
6. Người dùng có thể xóa bài tập bằng nút X — loại bỏ phần tử khỏi mảng theo index
7. Người dùng nhấn "Thêm bài tập" → mở ExerciseSelector bottom sheet → chọn bài tập → tạo SelectedExercise mới (3 sets, 90s rest, reps từ exercise defaults) → thêm vào cuối mảng
8. Nếu `localExercises` khác snapshot ban đầu (`hasChanges`) hoặc `exercises` khác `originalExercises` (`isModified`), badge "Đã chỉnh sửa" hiển thị trên header
9. Người dùng nhấn "Lưu" → gọi `fitnessStore.updatePlanDayExercises(planDay.id, localExercises)` → `popPage()` quay về TrainingPlanView
10. Người dùng nhấn "Khôi phục gốc" → parse `planDay.originalExercises` → set `localExercises` = bản gốc → gọi `fitnessStore.restorePlanDayOriginal(planDay.id)` cập nhật store + SQLite
11. Người dùng nhấn nút Back khi không có thay đổi → `popPage()` trực tiếp
12. Người dùng nhấn nút Back khi có thay đổi chưa lưu → hiển thị dialog xác nhận "Bạn có thay đổi chưa lưu. Bỏ thay đổi?" → "Hủy" đóng dialog, "Xác nhận" gọi `popPage()` bỏ thay đổi

## Quy tắc nghiệp vụ

1. **Full-screen page**: PlanDayEditor mở qua `pushPage()` (KHÔNG render inline trong tab) — nhất quán với kiến trúc WorkoutLogger
2. **Sắp xếp bằng nút**: Sử dụng ChevronUp/ChevronDown để di chuyển bài tập (không hỗ trợ drag-drop trong v1)
3. **Phát hiện thay đổi local**: `hasChanges = JSON.stringify(localExercises) !== initialSnapshot` — so sánh string JSON
4. **Phát hiện chỉnh sửa đã lưu**: `isModified = planDay.originalExercises !== undefined && planDay.exercises !== planDay.originalExercises`
5. **Lưu trữ vĩnh viễn**: `updatePlanDayExercises` cập nhật cả Zustand state và SQLite (`UPDATE training_plan_days SET exercises = ? WHERE id = ?`)
6. **Khôi phục bản gốc**: `restorePlanDayOriginal` copy `originalExercises` → `exercises` trong cả state và SQLite
7. **Trạng thái rỗng**: Hiển thị "Chưa có bài tập nào" khi `localExercises.length === 0`
8. **Giới hạn page stack**: Tối đa depth = 2 (TrainingPlanView → PlanDayEditor)
9. **Touch target tối thiểu 44px**: Tất cả nút bấm (Back, Save, Restore, MoveUp, MoveDown, Remove, Add) đều có kích thước tối thiểu h-11 (44px)
10. **Bài tập mới mặc định**: Khi thêm bài tập qua ExerciseSelector: sets=3, restSeconds=90, repsMin/repsMax lấy từ exercise.defaultRepsMin/defaultRepsMax
11. **Nút MoveUp disabled**: Disabled khi index === 0 (bài tập đầu tiên), opacity giảm 30%
12. **Nút MoveDown disabled**: Disabled khi index === localExercises.length - 1 (bài tập cuối), opacity giảm 30%
13. **Dialog chỉ xuất hiện khi có thay đổi**: Nút Back chỉ hiển thị dialog xác nhận khi `hasChanges === true`
14. **Memoization**: Component wrapped bởi `React.memo()` để tránh re-render không cần thiết
15. **JSON parse an toàn**: Sử dụng `safeJsonParse` với fallback `[]` — không crash khi exercises là null/undefined/malformed

## Test Cases (55 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_PDE_01 | Render đầy đủ danh sách bài tập từ planDay.exercises | Positive | P0 |
| TC_PDE_02 | Hiển thị tên bài tập (nameVi) cho mỗi exercise item | Positive | P0 |
| TC_PDE_03 | Hiển thị thông tin sets × repsMin–repsMax · restSeconds cho mỗi item | Positive | P0 |
| TC_PDE_04 | Render header với tiêu đề "Chỉnh sửa bài tập" | Positive | P0 |
| TC_PDE_05 | Hiển thị nút Back (ArrowLeft), Save, Restore trên header | Positive | P0 |
| TC_PDE_06 | Hiển thị nút "Thêm bài tập" sticky ở bottom | Positive | P1 |
| TC_PDE_07 | Mỗi exercise item có nút ChevronUp, ChevronDown, X (Remove) | Positive | P0 |
| TC_PDE_08 | Hiển thị icon GripVertical cho mỗi exercise item | Positive | P2 |
| TC_PDE_09 | Render empty state "Chưa có bài tập nào" khi exercises rỗng | Positive | P0 |
| TC_PDE_10 | MoveUp hoán đổi vị trí bài tập với bài tập phía trên | Positive | P0 |
| TC_PDE_11 | MoveDown hoán đổi vị trí bài tập với bài tập phía dưới | Positive | P0 |
| TC_PDE_12 | MoveUp bài tập đầu tiên (index=0) → không thay đổi thứ tự | Boundary | P0 |
| TC_PDE_13 | MoveDown bài tập cuối cùng → không thay đổi thứ tự | Boundary | P0 |
| TC_PDE_14 | Nút MoveUp disabled (opacity giảm) khi index=0 | Positive | P0 |
| TC_PDE_15 | Nút MoveDown disabled (opacity giảm) khi index cuối | Positive | P0 |
| TC_PDE_16 | MoveUp bài tập thứ 2 → hoán đổi với bài tập thứ 1 | Positive | P1 |
| TC_PDE_17 | MoveDown bài tập thứ 1 trong danh sách 3 items → hoán đổi với thứ 2 | Positive | P1 |
| TC_PDE_18 | Liên tiếp MoveUp 2 lần → bài tập di chuyển lên 2 vị trí | Positive | P1 |
| TC_PDE_19 | Xóa bài tập bằng nút X → bài tập biến mất khỏi danh sách | Positive | P0 |
| TC_PDE_20 | Xóa bài tập duy nhất → chuyển sang empty state | Positive | P0 |
| TC_PDE_21 | Xóa 2 bài tập liên tiếp → danh sách cập nhật đúng sau mỗi lần xóa | Positive | P1 |
| TC_PDE_22 | Xóa tất cả bài tập lần lượt → hiển thị "Chưa có bài tập nào" | Positive | P1 |
| TC_PDE_23 | Xóa bài tập ở giữa danh sách → các bài tập còn lại giữ đúng thứ tự | Positive | P1 |
| TC_PDE_24 | Nhấn "Thêm bài tập" → mở ExerciseSelector (isOpen=true) | Positive | P0 |
| TC_PDE_25 | Chọn bài tập từ ExerciseSelector → thêm vào cuối danh sách | Positive | P0 |
| TC_PDE_26 | Bài tập mới có giá trị mặc định: sets=3, restSeconds=90 | Positive | P0 |
| TC_PDE_27 | Bài tập mới lấy repsMin/repsMax từ exercise.defaultRepsMin/defaultRepsMax | Positive | P1 |
| TC_PDE_28 | Đóng ExerciseSelector không chọn → danh sách không thay đổi | Positive | P1 |
| TC_PDE_29 | Thêm nhiều bài tập liên tiếp → tất cả xuất hiện đúng thứ tự cuối danh sách | Positive | P1 |
| TC_PDE_30 | Nhấn Save → gọi updatePlanDayExercises(planDay.id, localExercises) | Positive | P0 |
| TC_PDE_31 | Nhấn Save → gọi popPage() sau khi lưu | Positive | P0 |
| TC_PDE_32 | updatePlanDayExercises cập nhật Zustand state đúng dayId | Positive | P0 |
| TC_PDE_33 | updatePlanDayExercises persist vào SQLite (UPDATE training_plan_days) | Positive | P1 |
| TC_PDE_34 | Nhấn Restore → setLocalExercises về bản gốc originalExercises | Positive | P0 |
| TC_PDE_35 | Nhấn Restore → gọi restorePlanDayOriginal(planDay.id) | Positive | P0 |
| TC_PDE_36 | Sau Restore, danh sách UI hiển thị đúng bài tập gốc | Positive | P0 |
| TC_PDE_37 | Restore khi originalExercises undefined → fallback mảng rỗng | Edge | P1 |
| TC_PDE_38 | Badge "Đã chỉnh sửa" hiển thị khi hasChanges=true (thay đổi local chưa lưu) | Positive | P0 |
| TC_PDE_39 | Badge "Đã chỉnh sửa" hiển thị khi isModified=true (exercises≠originalExercises) | Positive | P0 |
| TC_PDE_40 | Badge không hiển thị khi không có thay đổi nào | Negative | P0 |
| TC_PDE_41 | Badge hiển thị ngay sau khi MoveUp/MoveDown thay đổi thứ tự | Positive | P1 |
| TC_PDE_42 | Badge hiển thị ngay sau khi xóa 1 bài tập | Positive | P1 |
| TC_PDE_43 | Badge biến mất khi undo thay đổi đưa về trạng thái ban đầu | Edge | P2 |
| TC_PDE_44 | Nhấn Back khi không có thay đổi → popPage() trực tiếp, không dialog | Positive | P0 |
| TC_PDE_45 | Nhấn Back khi có thay đổi chưa lưu → hiển thị dialog xác nhận | Positive | P0 |
| TC_PDE_46 | Dialog hiển thị text "Bạn có thay đổi chưa lưu. Bỏ thay đổi?" | Positive | P0 |
| TC_PDE_47 | Nhấn "Hủy" trên dialog → đóng dialog, giữ nguyên trang editor | Positive | P0 |
| TC_PDE_48 | Nhấn "Xác nhận" trên dialog → popPage() bỏ thay đổi | Positive | P0 |
| TC_PDE_49 | PlanDayEditor mở qua pushPage() (full-screen, không inline) | Positive | P0 |
| TC_PDE_50 | popPage() quay về TrainingPlanView đúng cách | Positive | P1 |
| TC_PDE_51 | Bài tập có tên rất dài → truncate hiển thị (CSS truncate) | Edge | P1 |
| TC_PDE_52 | Danh sách 20+ bài tập → scroll hoạt động đúng (overflow-y-auto) | Edge | P1 |
| TC_PDE_53 | Tất cả nút bấm có kích thước touch target tối thiểu 44px (h-11) | Accessibility | P0 |
| TC_PDE_54 | Nút Back có aria-label đúng (common.back) | Accessibility | P1 |
| TC_PDE_55 | Nút MoveUp/MoveDown/Remove có aria-label chứa tên bài tập | Accessibility | P1 |

---

## Chi tiết Test Cases

### A. Rendering — Hiển thị danh sách bài tập (TC_PDE_01 → TC_PDE_09)

##### TC_PDE_01: Render đầy đủ danh sách bài tập từ planDay.exercises
- **Pre-conditions**: planDay.exercises chứa JSON hợp lệ với 3 SelectedExercise (Bench Press, Squat, Deadlift)
- **Steps**:
  1. Render PlanDayEditor với planDay có 3 bài tập
  2. Kiểm tra số lượng exercise items trong danh sách
- **Expected**: Render đúng 3 exercise items trong `<ul>`, mỗi item có đầy đủ thông tin
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_02: Hiển thị tên bài tập (nameVi) cho mỗi exercise item
- **Pre-conditions**: planDay có bài tập với nameVi = "Đẩy ngực ngang"
- **Steps**:
  1. Render PlanDayEditor
  2. Tìm phần tử có data-testid="exercise-name"
  3. Kiểm tra nội dung text
- **Expected**: Phần tử hiển thị text "Đẩy ngực ngang" đúng, CSS class `truncate` được áp dụng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_03: Hiển thị thông tin sets × repsMin–repsMax · restSeconds cho mỗi item
- **Pre-conditions**: Bài tập có sets=4, repsMin=8, repsMax=12, restSeconds=90
- **Steps**:
  1. Render PlanDayEditor với bài tập trên
  2. Kiểm tra text hiển thị thông tin chi tiết
- **Expected**: Hiển thị "4 sets × 8-12 reps · 90s rest" trong phần mô tả phụ (text-xs)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_04: Render header với tiêu đề "Chỉnh sửa bài tập"
- **Pre-conditions**: PlanDayEditor được render với bất kỳ planDay nào
- **Steps**:
  1. Render PlanDayEditor
  2. Kiểm tra nội dung thẻ `<h1>` trong header
- **Expected**: Header hiển thị text tương ứng với key i18n `fitness.plan.editExercises` = "Chỉnh sửa bài tập"
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_05: Hiển thị nút Back (ArrowLeft), Save, Restore trên header
- **Pre-conditions**: PlanDayEditor được render
- **Steps**:
  1. Render PlanDayEditor
  2. Kiểm tra sự tồn tại của nút Back (aria-label chứa "back"), nút Save (text "Lưu"), nút Restore (icon RotateCcw)
- **Expected**: Cả 3 nút đều hiển thị trên header bar, nút Back bên trái, Restore và Save bên phải
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_06: Hiển thị nút "Thêm bài tập" sticky ở bottom
- **Pre-conditions**: PlanDayEditor được render
- **Steps**:
  1. Render PlanDayEditor
  2. Tìm nút có text tương ứng với key i18n `fitness.plan.addExercise`
  3. Kiểm tra nút nằm trong container có class `sticky bottom-0`
- **Expected**: Nút "Thêm bài tập" hiển thị sticky ở bottom, có icon Plus, kích thước h-12 full width
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_PDE_07: Mỗi exercise item có nút ChevronUp, ChevronDown, X (Remove)
- **Pre-conditions**: planDay có ít nhất 1 bài tập
- **Steps**:
  1. Render PlanDayEditor với 1 bài tập "Đẩy ngực ngang"
  2. Kiểm tra mỗi exercise item có 3 nút action
- **Expected**: Mỗi item có: nút MoveUp (aria-label chứa "Move up"), nút MoveDown (aria-label chứa "Move down"), nút Remove (aria-label chứa "Remove")
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_08: Hiển thị icon GripVertical cho mỗi exercise item
- **Pre-conditions**: planDay có ít nhất 1 bài tập
- **Steps**:
  1. Render PlanDayEditor
  2. Kiểm tra sự tồn tại của icon GripVertical trong mỗi item
- **Expected**: Mỗi exercise item hiển thị icon GripVertical bên trái (visual indicator cho khả năng sắp xếp), có class `text-slate-300`
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P2

##### TC_PDE_09: Render empty state "Chưa có bài tập nào" khi exercises rỗng
- **Pre-conditions**: planDay.exercises = '[]' hoặc null/undefined
- **Steps**:
  1. Render PlanDayEditor với planDay có exercises rỗng
  2. Kiểm tra nội dung hiển thị trong vùng nội dung chính
- **Expected**: Hiển thị text tương ứng với key i18n `fitness.plan.noExercises` = "Chưa có bài tập nào", không hiển thị `<ul>` danh sách
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

### B. Reorder — Sắp xếp lại thứ tự bài tập (TC_PDE_10 → TC_PDE_18)

##### TC_PDE_10: MoveUp hoán đổi vị trí bài tập với bài tập phía trên
- **Pre-conditions**: planDay có 3 bài tập: [A, B, C]
- **Steps**:
  1. Render PlanDayEditor
  2. Nhấn nút MoveUp của bài tập B (index=1)
  3. Kiểm tra thứ tự danh sách
- **Expected**: Danh sách sau khi di chuyển: [B, A, C] — B và A hoán đổi vị trí
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_11: MoveDown hoán đổi vị trí bài tập với bài tập phía dưới
- **Pre-conditions**: planDay có 3 bài tập: [A, B, C]
- **Steps**:
  1. Render PlanDayEditor
  2. Nhấn nút MoveDown của bài tập B (index=1)
  3. Kiểm tra thứ tự danh sách
- **Expected**: Danh sách sau khi di chuyển: [A, C, B] — B và C hoán đổi vị trí
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_12: MoveUp bài tập đầu tiên (index=0) → không thay đổi thứ tự
- **Pre-conditions**: planDay có 3 bài tập: [A, B, C]
- **Steps**:
  1. Render PlanDayEditor
  2. Nhấn nút MoveUp của bài tập A (index=0)
  3. Kiểm tra thứ tự danh sách
- **Expected**: Danh sách giữ nguyên [A, B, C] — handleMoveUp return sớm khi index === 0
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_PDE_13: MoveDown bài tập cuối cùng → không thay đổi thứ tự
- **Pre-conditions**: planDay có 3 bài tập: [A, B, C]
- **Steps**:
  1. Render PlanDayEditor
  2. Nhấn nút MoveDown của bài tập C (index=2, cuối cùng)
  3. Kiểm tra thứ tự danh sách
- **Expected**: Danh sách giữ nguyên [A, B, C] — handleMoveDown return `prev` khi index >= prev.length - 1
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_PDE_14: Nút MoveUp disabled (opacity giảm) khi index=0
- **Pre-conditions**: planDay có ít nhất 1 bài tập
- **Steps**:
  1. Render PlanDayEditor
  2. Kiểm tra thuộc tính disabled của nút MoveUp trên bài tập đầu tiên
- **Expected**: Nút MoveUp có `disabled={true}`, class `disabled:opacity-30` được áp dụng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_15: Nút MoveDown disabled (opacity giảm) khi index cuối
- **Pre-conditions**: planDay có 3 bài tập
- **Steps**:
  1. Render PlanDayEditor
  2. Kiểm tra thuộc tính disabled của nút MoveDown trên bài tập cuối cùng (index=2)
- **Expected**: Nút MoveDown có `disabled={true}`, class `disabled:opacity-30` được áp dụng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_16: MoveUp bài tập thứ 2 → hoán đổi với bài tập thứ 1
- **Pre-conditions**: planDay có 3 bài tập: [Bench Press, Squat, Deadlift]
- **Steps**:
  1. Render PlanDayEditor
  2. Nhấn nút MoveUp của Squat (index=1)
  3. Kiểm tra thứ tự hiển thị
- **Expected**: Thứ tự mới: [Squat, Bench Press, Deadlift], Squat nay ở index=0 với MoveUp disabled
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_PDE_17: MoveDown bài tập thứ 1 trong danh sách 3 items → hoán đổi với thứ 2
- **Pre-conditions**: planDay có 3 bài tập: [A, B, C]
- **Steps**:
  1. Render PlanDayEditor
  2. Nhấn nút MoveDown của A (index=0)
  3. Kiểm tra thứ tự hiển thị
- **Expected**: Thứ tự mới: [B, A, C], A nay ở index=1 với cả MoveUp và MoveDown enabled
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_PDE_18: Liên tiếp MoveUp 2 lần → bài tập di chuyển lên 2 vị trí
- **Pre-conditions**: planDay có 4 bài tập: [A, B, C, D]
- **Steps**:
  1. Render PlanDayEditor
  2. Nhấn nút MoveUp của D (index=3) → [A, B, D, C]
  3. Nhấn nút MoveUp của D (nay ở index=2) → [A, D, B, C]
- **Expected**: Sau 2 lần MoveUp, D di chuyển từ index=3 lên index=1, thứ tự cuối: [A, D, B, C]
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

### C. Remove — Xóa bài tập (TC_PDE_19 → TC_PDE_23)

##### TC_PDE_19: Xóa bài tập bằng nút X → bài tập biến mất khỏi danh sách
- **Pre-conditions**: planDay có 3 bài tập: [A, B, C]
- **Steps**:
  1. Render PlanDayEditor
  2. Nhấn nút Remove (X) của bài tập B
  3. Kiểm tra danh sách
- **Expected**: Danh sách còn 2 items [A, C], bài tập B không còn hiển thị
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_20: Xóa bài tập duy nhất → chuyển sang empty state
- **Pre-conditions**: planDay có 1 bài tập duy nhất
- **Steps**:
  1. Render PlanDayEditor với 1 bài tập
  2. Nhấn nút Remove của bài tập duy nhất
  3. Kiểm tra giao diện
- **Expected**: Danh sách `<ul>` biến mất, hiển thị empty state "Chưa có bài tập nào"
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_21: Xóa 2 bài tập liên tiếp → danh sách cập nhật đúng sau mỗi lần xóa
- **Pre-conditions**: planDay có 4 bài tập: [A, B, C, D]
- **Steps**:
  1. Render PlanDayEditor
  2. Nhấn nút Remove của B → danh sách [A, C, D]
  3. Nhấn nút Remove của C → danh sách [A, D]
- **Expected**: Sau 2 lần xóa liên tiếp, danh sách chỉ còn [A, D] với thứ tự đúng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_PDE_22: Xóa tất cả bài tập lần lượt → hiển thị "Chưa có bài tập nào"
- **Pre-conditions**: planDay có 3 bài tập: [A, B, C]
- **Steps**:
  1. Render PlanDayEditor
  2. Xóa bài tập đầu tiên 3 lần liên tiếp (mỗi lần xóa item ở index=0)
  3. Kiểm tra giao diện
- **Expected**: Sau khi xóa hết, hiển thị empty state "Chưa có bài tập nào", không có `<li>` nào
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_PDE_23: Xóa bài tập ở giữa danh sách → các bài tập còn lại giữ đúng thứ tự
- **Pre-conditions**: planDay có 5 bài tập: [A, B, C, D, E]
- **Steps**:
  1. Render PlanDayEditor
  2. Nhấn nút Remove của C (index=2)
  3. Kiểm tra thứ tự hiển thị
- **Expected**: Danh sách [A, B, D, E] — D nay ở index=2, E ở index=3, thứ tự tương đối không đổi
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

### D. Add — Thêm bài tập mới (TC_PDE_24 → TC_PDE_29)

##### TC_PDE_24: Nhấn "Thêm bài tập" → mở ExerciseSelector (isOpen=true)
- **Pre-conditions**: PlanDayEditor đã render
- **Steps**:
  1. Nhấn nút "Thêm bài tập" (có icon Plus)
  2. Kiểm tra trạng thái showSelector
- **Expected**: ExerciseSelector nhận prop `isOpen={true}`, bottom sheet hiển thị
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_25: Chọn bài tập từ ExerciseSelector → thêm vào cuối danh sách
- **Pre-conditions**: planDay có 2 bài tập [A, B], ExerciseSelector đang mở
- **Steps**:
  1. Mở ExerciseSelector qua nút "Thêm bài tập"
  2. Trigger onSelect với exercise mới C
  3. Kiểm tra danh sách
- **Expected**: Danh sách giờ có 3 items [A, B, C], bài tập mới C ở cuối. ExerciseSelector tự động đóng (showSelector=false)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_26: Bài tập mới có giá trị mặc định: sets=3, restSeconds=90
- **Pre-conditions**: Exercise được chọn từ ExerciseSelector
- **Steps**:
  1. Trigger handleAddExercise với exercise mới
  2. Kiểm tra SelectedExercise được tạo
- **Expected**: SelectedExercise mới có `sets: 3` và `restSeconds: 90` (giá trị hardcoded trong handleAddExercise)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_27: Bài tập mới lấy repsMin/repsMax từ exercise.defaultRepsMin/defaultRepsMax
- **Pre-conditions**: Exercise có defaultRepsMin=8, defaultRepsMax=12
- **Steps**:
  1. Trigger handleAddExercise với exercise có defaultRepsMin=8, defaultRepsMax=12
  2. Kiểm tra SelectedExercise được tạo
- **Expected**: SelectedExercise mới có `repsMin: 8` và `repsMax: 12` lấy từ exercise defaults
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_PDE_28: Đóng ExerciseSelector không chọn → danh sách không thay đổi
- **Pre-conditions**: planDay có 2 bài tập, ExerciseSelector đang mở
- **Steps**:
  1. Mở ExerciseSelector
  2. Trigger onClose (đóng selector mà không chọn)
  3. Kiểm tra danh sách
- **Expected**: Danh sách giữ nguyên 2 bài tập, ExerciseSelector đóng (showSelector=false)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_PDE_29: Thêm nhiều bài tập liên tiếp → tất cả xuất hiện đúng thứ tự cuối danh sách
- **Pre-conditions**: planDay có 1 bài tập [A]
- **Steps**:
  1. Mở ExerciseSelector, chọn B → danh sách [A, B]
  2. Mở ExerciseSelector, chọn C → danh sách [A, B, C]
  3. Mở ExerciseSelector, chọn D → danh sách [A, B, C, D]
- **Expected**: Tất cả bài tập mới được thêm vào cuối theo đúng thứ tự chọn
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

### E. Save — Lưu thay đổi (TC_PDE_30 → TC_PDE_33)

##### TC_PDE_30: Nhấn Save → gọi updatePlanDayExercises(planDay.id, localExercises)
- **Pre-conditions**: PlanDayEditor đã render, localExercises đã bị thay đổi
- **Steps**:
  1. Thực hiện bất kỳ thay đổi nào (xóa/thêm/reorder)
  2. Nhấn nút Save
  3. Kiểm tra fitnessStore.updatePlanDayExercises đã được gọi
- **Expected**: `useFitnessStore.getState().updatePlanDayExercises` được gọi với `(planDay.id, localExercises)` chính xác
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_31: Nhấn Save → gọi popPage() sau khi lưu
- **Pre-conditions**: PlanDayEditor đã render
- **Steps**:
  1. Nhấn nút Save
  2. Kiểm tra popPage đã được gọi
- **Expected**: `popPage()` từ navigationStore được gọi 1 lần, quay về trang trước (TrainingPlanView)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_32: updatePlanDayExercises cập nhật Zustand state đúng dayId
- **Pre-conditions**: fitnessStore có trainingPlanDays chứa day target, planDay.id = 'day-123'
- **Steps**:
  1. Gọi updatePlanDayExercises('day-123', newExercises)
  2. Kiểm tra state.trainingPlanDays
- **Expected**: Chỉ TrainingPlanDay có id='day-123' được cập nhật `exercises = JSON.stringify(newExercises)`, các day khác giữ nguyên
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_33: updatePlanDayExercises persist vào SQLite (UPDATE training_plan_days)
- **Pre-conditions**: SQLite database đã khởi tạo (_db !== null)
- **Steps**:
  1. Gọi updatePlanDayExercises('day-123', newExercises)
  2. Kiểm tra SQL query được thực thi
- **Expected**: `_db.execute('UPDATE training_plan_days SET exercises = ? WHERE id = ?', [JSON.stringify(exercises), dayId])` được gọi đúng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

### F. Restore — Khôi phục bản gốc (TC_PDE_34 → TC_PDE_37)

##### TC_PDE_34: Nhấn Restore → setLocalExercises về bản gốc originalExercises
- **Pre-conditions**: planDay có originalExercises chứa [A, B], exercises đã bị thay đổi thành [B, A, C]
- **Steps**:
  1. Nhấn nút Restore (icon RotateCcw)
  2. Kiểm tra localExercises state
- **Expected**: localExercises được set về giá trị parse từ planDay.originalExercises = [A, B]
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_35: Nhấn Restore → gọi restorePlanDayOriginal(planDay.id)
- **Pre-conditions**: PlanDayEditor đã render, planDay.id = 'day-456'
- **Steps**:
  1. Nhấn nút Restore
  2. Kiểm tra fitnessStore.restorePlanDayOriginal đã được gọi
- **Expected**: `useFitnessStore.getState().restorePlanDayOriginal('day-456')` được gọi 1 lần
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_36: Sau Restore, danh sách UI hiển thị đúng bài tập gốc
- **Pre-conditions**: originalExercises = [Bench Press, Squat], exercises hiện tại = [Squat, Bench Press, Deadlift]
- **Steps**:
  1. Xác nhận UI đang hiển thị 3 bài tập đã chỉnh sửa
  2. Nhấn nút Restore
  3. Kiểm tra danh sách UI
- **Expected**: UI hiển thị lại đúng 2 bài tập gốc [Bench Press, Squat] theo thứ tự ban đầu, Deadlift không còn
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_37: Restore khi originalExercises undefined → fallback mảng rỗng
- **Pre-conditions**: planDay.originalExercises = undefined (không có bản gốc)
- **Steps**:
  1. Render PlanDayEditor với planDay không có originalExercises
  2. Nhấn nút Restore
  3. Kiểm tra localExercises
- **Expected**: `safeJsonParse(undefined ?? '[]', [])` → localExercises = [], hiển thị empty state
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P1

### G. Modified Badge — Trạng thái chỉnh sửa (TC_PDE_38 → TC_PDE_43)

##### TC_PDE_38: Badge "Đã chỉnh sửa" hiển thị khi hasChanges=true (thay đổi local chưa lưu)
- **Pre-conditions**: planDay có exercises = originalExercises (isModified=false), nhưng user đã thay đổi local
- **Steps**:
  1. Render PlanDayEditor
  2. Xóa 1 bài tập (tạo hasChanges=true)
  3. Kiểm tra header có badge text
- **Expected**: Text "Đã chỉnh sửa" (key i18n `fitness.plan.modified`) hiển thị dưới tiêu đề, class `text-emerald-100 text-xs`
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_39: Badge "Đã chỉnh sửa" hiển thị khi isModified=true (exercises≠originalExercises)
- **Pre-conditions**: planDay.exercises ≠ planDay.originalExercises (đã lưu thay đổi trước đó)
- **Steps**:
  1. Render PlanDayEditor với planDay có exercises khác originalExercises
  2. Kiểm tra header ngay khi mount (chưa thao tác gì)
- **Expected**: Badge "Đã chỉnh sửa" hiển thị ngay lập tức do isModified=true
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_40: Badge không hiển thị khi không có thay đổi nào
- **Pre-conditions**: planDay.exercises === planDay.originalExercises, user chưa thao tác
- **Steps**:
  1. Render PlanDayEditor với planDay chưa bị chỉnh sửa
  2. Kiểm tra header
- **Expected**: Không có text "Đã chỉnh sửa" trong header, badge `<span>` không render (condition false)
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P0

##### TC_PDE_41: Badge hiển thị ngay sau khi MoveUp/MoveDown thay đổi thứ tự
- **Pre-conditions**: planDay chưa bị chỉnh sửa, có 2+ bài tập
- **Steps**:
  1. Render PlanDayEditor — xác nhận không có badge
  2. Nhấn MoveDown bài tập đầu tiên
  3. Kiểm tra header
- **Expected**: Badge "Đã chỉnh sửa" xuất hiện ngay vì JSON.stringify(localExercises) khác initialSnapshot
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_PDE_42: Badge hiển thị ngay sau khi xóa 1 bài tập
- **Pre-conditions**: planDay chưa bị chỉnh sửa, có 2+ bài tập
- **Steps**:
  1. Render PlanDayEditor — xác nhận không có badge
  2. Xóa 1 bài tập bất kỳ
  3. Kiểm tra header
- **Expected**: Badge "Đã chỉnh sửa" xuất hiện ngay do localExercises thay đổi
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_PDE_43: Badge biến mất khi undo thay đổi đưa về trạng thái ban đầu
- **Pre-conditions**: planDay có 2 bài tập [A, B] chưa chỉnh sửa
- **Steps**:
  1. MoveDown bài tập A → [B, A] — badge xuất hiện
  2. MoveUp bài tập A (nay ở index=1) → [A, B] — về trạng thái ban đầu
  3. Kiểm tra header
- **Expected**: Badge biến mất vì JSON.stringify(localExercises) === initialSnapshot (về lại trạng thái gốc)
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P2

### H. Unsaved Changes Dialog — Dialog cảnh báo (TC_PDE_44 → TC_PDE_48)

##### TC_PDE_44: Nhấn Back khi không có thay đổi → popPage() trực tiếp, không dialog
- **Pre-conditions**: PlanDayEditor vừa mở, user chưa thao tác gì (hasChanges=false)
- **Steps**:
  1. Render PlanDayEditor
  2. Nhấn nút Back (ArrowLeft)
  3. Kiểm tra showConfirmDialog và popPage
- **Expected**: `popPage()` được gọi ngay lập tức, dialog không xuất hiện (showConfirmDialog vẫn false)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_45: Nhấn Back khi có thay đổi chưa lưu → hiển thị dialog xác nhận
- **Pre-conditions**: PlanDayEditor đã render, user đã xóa 1 bài tập (hasChanges=true)
- **Steps**:
  1. Xóa 1 bài tập
  2. Nhấn nút Back
  3. Kiểm tra giao diện
- **Expected**: Dialog xác nhận hiển thị (overlay bg-black/50 + modal bg-white), `popPage()` CHƯA được gọi
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_46: Dialog hiển thị text "Bạn có thay đổi chưa lưu. Bỏ thay đổi?"
- **Pre-conditions**: Dialog đang mở sau khi nhấn Back với thay đổi chưa lưu
- **Steps**:
  1. Tạo thay đổi, nhấn Back
  2. Kiểm tra nội dung dialog
- **Expected**: Dialog chứa text tương ứng key i18n `fitness.plan.unsavedChanges` = "Bạn có thay đổi chưa lưu. Bỏ thay đổi?", có 2 nút "Hủy" và "Xác nhận"
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_47: Nhấn "Hủy" trên dialog → đóng dialog, giữ nguyên trang editor
- **Pre-conditions**: Dialog đang mở
- **Steps**:
  1. Nhấn nút "Hủy" (key i18n `common.cancel`)
  2. Kiểm tra trạng thái
- **Expected**: Dialog đóng (showConfirmDialog=false), PlanDayEditor vẫn hiển thị, localExercises giữ nguyên thay đổi, `popPage()` KHÔNG được gọi
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_48: Nhấn "Xác nhận" trên dialog → popPage() bỏ thay đổi
- **Pre-conditions**: Dialog đang mở, có thay đổi chưa lưu
- **Steps**:
  1. Nhấn nút "Xác nhận" (key i18n `common.confirm`)
  2. Kiểm tra hành vi
- **Expected**: `popPage()` được gọi 1 lần, thay đổi bị bỏ (không gọi updatePlanDayExercises), quay về TrainingPlanView
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

### I. Navigation — Điều hướng trang (TC_PDE_49 → TC_PDE_50)

##### TC_PDE_49: PlanDayEditor mở qua pushPage() (full-screen, không inline)
- **Pre-conditions**: TrainingPlanView đang hiển thị, có nút Edit (Pencil icon) cho buổi tập
- **Steps**:
  1. Từ TrainingPlanView, nhấn nút Edit trên buổi tập
  2. Kiểm tra navigation stack
- **Expected**: `pushPage({ id: 'plan-day-editor', component: PlanDayEditor, props: { planDay } })` được gọi, PlanDayEditor render full-screen, page stack depth = 2
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_PDE_50: popPage() quay về TrainingPlanView đúng cách
- **Pre-conditions**: PlanDayEditor đang mở (page stack = [TrainingPlanView, PlanDayEditor])
- **Steps**:
  1. Nhấn nút Save hoặc Back (khi không có thay đổi)
  2. Kiểm tra page hiển thị
- **Expected**: PlanDayEditor unmount, TrainingPlanView hiển thị lại, page stack depth = 1
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

### J. Edge Cases — Trường hợp biên (TC_PDE_51 → TC_PDE_52)

##### TC_PDE_51: Bài tập có tên rất dài → truncate hiển thị (CSS truncate)
- **Pre-conditions**: Bài tập có nameVi = "Kéo cáp tay một bên từ trên xuống xoay cổ tay vào trong" (rất dài)
- **Steps**:
  1. Render PlanDayEditor với bài tập có tên dài
  2. Kiểm tra hiển thị tên
- **Expected**: Tên bài tập bị truncate bởi CSS class `truncate` (text-overflow: ellipsis), không phá vỡ layout, exercise item giữ nguyên chiều cao
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P1

##### TC_PDE_52: Danh sách 20+ bài tập → scroll hoạt động đúng (overflow-y-auto)
- **Pre-conditions**: planDay có 25 bài tập
- **Steps**:
  1. Render PlanDayEditor với 25 bài tập
  2. Kiểm tra container nội dung có scrollable
  3. Kiểm tra nút "Thêm bài tập" vẫn visible (sticky)
- **Expected**: Vùng nội dung (`overflow-y-auto`) có thể scroll, nút "Thêm bài tập" sticky ở bottom luôn hiển thị, padding-bottom đủ cho nút sticky (pb-24)
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P1

### K. Accessibility — Khả năng tiếp cận (TC_PDE_53 → TC_PDE_55)

##### TC_PDE_53: Tất cả nút bấm có kích thước touch target tối thiểu 44px (h-11)
- **Pre-conditions**: PlanDayEditor đã render với ít nhất 1 bài tập
- **Steps**:
  1. Kiểm tra kích thước rendered của tất cả nút: Back (h-11 w-11), MoveUp (h-11 w-9), MoveDown (h-11 w-9), Remove (h-11 w-9), Save (h-11), Restore (h-11), Add (h-12)
- **Expected**: Tất cả nút có chiều cao tối thiểu 44px (h-11 = 2.75rem = 44px), tuân thủ WCAG touch target guidelines
- **Kết quả test thực tế**: —
- **Type**: Accessibility | **Priority**: P0

##### TC_PDE_54: Nút Back có aria-label đúng (common.back)
- **Pre-conditions**: PlanDayEditor đã render
- **Steps**:
  1. Tìm nút Back
  2. Kiểm tra thuộc tính aria-label
- **Expected**: Nút Back có `aria-label` tương ứng với key i18n `common.back`, screen reader có thể đọc mục đích nút
- **Kết quả test thực tế**: —
- **Type**: Accessibility | **Priority**: P1

##### TC_PDE_55: Nút MoveUp/MoveDown/Remove có aria-label chứa tên bài tập
- **Pre-conditions**: planDay có bài tập nameVi = "Đẩy ngực ngang"
- **Steps**:
  1. Render PlanDayEditor
  2. Kiểm tra aria-label của các nút action
- **Expected**: MoveUp: `"Move up Đẩy ngực ngang"`, MoveDown: `"Move down Đẩy ngực ngang"`, Remove: `"Remove Đẩy ngực ngang"` — screen reader xác định rõ nút thuộc bài tập nào
- **Kết quả test thực tế**: —
- **Type**: Accessibility | **Priority**: P1
