# Scenario 43: Freestyle Workout

**Version:** 1.0  
**Date:** 2026-06-29  
**Total Test Cases:** 45

---

## Mô tả tổng quan

Freestyle Workout cho phép người dùng tạo buổi tập ngoài kế hoạch (ad-hoc), không gắn với bất kỳ ngày tập nào trong training plan đã được generate. Khác biệt chính so với planned workout: `planDayId = null/undefined` trong database, không ảnh hưởng đến trạng thái hoàn thành kế hoạch (training-partial/training-completed), và không tính vào streak.

Luồng chính: Người dùng nhấn tab "+" trên SessionTabs → AddSessionModal hiển thị → chọn "Tập tự do (Freestyle)" → WorkoutLogger mở ở chế độ freestyle (không có `planDay` prop) → người dùng tự thêm bài tập qua nút "+" sticky ở bottom → log sets/reps/weight → nhấn "Finish" → hiển thị màn summary với ô nhập tên buổi tập → nếu bỏ trống, tên mặc định là "Buổi tập tự do" → lưu workout với `planDayId = null` vào SQLite.

Freestyle workout hiển thị trong lịch sử tập luyện (WorkoutHistory) với tên do người dùng đặt hoặc tên mặc định, được lọc theo loại bài tập (strength/cardio) dựa trên sets chứ không dựa trên planDayId. Không có giới hạn số session freestyle riêng biệt (khác với planned workout tối đa 3 session/ngày).

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| AddSessionModal | src/features/fitness/components/AddSessionModal.tsx | Modal chọn loại session: Strength, Cardio, Freestyle — entry point cho freestyle |
| WorkoutLogger | src/features/fitness/components/WorkoutLogger.tsx | Component chính ghi nhận workout, xử lý cả planned và freestyle |
| TrainingPlanView | src/features/fitness/components/TrainingPlanView.tsx | View chứa SessionTabs, tab "+" mở AddSessionModal, handler onSelectFreestyle |
| SessionTabs | src/features/fitness/components/SessionTabs.tsx | Tab navigation cho multiple sessions, nút "+" để thêm session mới |
| ExerciseSelector | src/features/fitness/components/ExerciseSelector.tsx | Modal chọn bài tập, hoạt động giống nhau cho cả planned và freestyle |
| WorkoutHistory | src/features/fitness/components/WorkoutHistory.tsx | Hiển thị lịch sử workout theo tuần, bao gồm cả freestyle |
| fitnessStore | src/store/fitnessStore.ts | Zustand store: addWorkout, saveWorkoutAtomic với planDayId ?? null |
| useNavigationStore | src/store/navigationStore.ts | Quản lý navigation: pushPage để mở WorkoutLogger full-screen |

## Luồng nghiệp vụ

1. Người dùng đang ở TrainingPlanView → nhấn tab "+" trên SessionTabs
2. AddSessionModal hiển thị 3 lựa chọn: Strength, Cardio, Freestyle — nút Freestyle có icon ⚡ (Zap) màu amber
3. Nhấn "Tập tự do (Freestyle)" → gọi `onSelectFreestyle()` → `pushPage({ id: 'workout-logger', component: 'WorkoutLogger', props: {} })` — KHÔNG truyền planDay
4. WorkoutLogger mount với `planDay = undefined` → `isFreestyle = !planDay = true`
5. Người dùng nhấn nút "+" sticky ở bottom → ExerciseSelector mở → chọn bài tập (không có muscle group filter mặc định)
6. Người dùng log sets: nhập weight (kg), reps, RPE cho mỗi set — tất cả tính năng WorkoutLogger (rest timer, set logging) hoạt động bình thường
7. Nhấn "Finish" → hiển thị WorkoutSummaryCard kèm ô nhập tên freestyle (`freestyle-name-input`)
8. Người dùng nhập tên hoặc bỏ trống → nhấn "Save"
9. `handleSave()` tạo Workout object: `name = freestyleName.trim() || "Buổi tập tự do"`, `planDayId = planDay?.id = undefined`
10. `saveWorkoutAtomic(workout, sets)` lưu vào SQLite trong transaction: `plan_day_id = NULL`
11. Workout freestyle xuất hiện trong WorkoutHistory, lọc theo strength/cardio dựa trên loại sets

## Quy tắc nghiệp vụ

1. **Freestyle = planDayId === null/undefined**: Workout không có planDayId được coi là freestyle, phân biệt hoàn toàn với planned workout
2. **Entry point duy nhất**: AddSessionModal → nút "Tập tự do (Freestyle)" → gọi `onSelectFreestyle()` trực tiếp (không cần chọn muscle group)
3. **WorkoutLogger props rỗng**: Freestyle được trigger bởi việc KHÔNG truyền `planDay` prop vào WorkoutLogger
4. **Tên buổi tập hiển thị SAU khi Finish**: Ô nhập tên chỉ xuất hiện trên màn summary (sau khi nhấn Finish), giảm friction trong quá trình tập
5. **Tên mặc định "Buổi tập tự do"**: Nếu người dùng bỏ trống ô tên, sử dụng `t('fitness.plan.freestyleDefault')` = "Buổi tập tự do"
6. **KHÔNG ảnh hưởng training state**: Freestyle workout không thay đổi trạng thái training-partial hoặc training-completed của training plan
7. **KHÔNG tính vào streak**: Chỉ planned workouts được tính streak liên tiếp
8. **Nút "+" sticky ở bottom**: Nút thêm bài tập cố định ở bottom, luôn visible khi scroll
9. **ExerciseSelector không filter**: Khi mở từ freestyle, ExerciseSelector không pre-filter theo muscle group
10. **Giới hạn 3 session/ngày áp dụng chung**: AddSessionModal disable tất cả options (bao gồm freestyle) khi `currentSessionCount >= 3`
11. **Lưu trữ atomic**: `saveWorkoutAtomic()` dùng `db.transaction()` để đảm bảo workout + sets được lưu hoặc rollback cùng nhau
12. **Draft preservation**: WorkoutLogger lưu/khôi phục draft bất kể mode (freestyle hay planned)

## Test Cases (45 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_FW_01 | Hiển thị nút "Tập tự do (Freestyle)" trong AddSessionModal với icon ⚡ amber | Positive | P0 |
| TC_FW_02 | Nhấn "Tập tự do (Freestyle)" gọi onSelectFreestyle callback | Positive | P0 |
| TC_FW_03 | Nút freestyle bị disabled khi currentSessionCount >= 3 | Negative | P0 |
| TC_FW_04 | onSelectFreestyle → pushPage WorkoutLogger với props rỗng (không có planDay) | Integration | P0 |
| TC_FW_05 | WorkoutLogger mount với planDay=undefined → isFreestyle=true | Positive | P0 |
| TC_FW_06 | WorkoutLogger freestyle KHÔNG hiển thị danh sách bài tập pre-loaded | Positive | P1 |
| TC_FW_07 | Nút "+" sticky hiển thị cố định ở bottom trong freestyle mode | Positive | P0 |
| TC_FW_08 | Nhấn nút "+" sticky → ExerciseSelector mở | Positive | P0 |
| TC_FW_09 | ExerciseSelector mở từ freestyle KHÔNG có muscle group filter mặc định | Positive | P1 |
| TC_FW_10 | Chọn bài tập từ ExerciseSelector → thêm vào danh sách workout | Positive | P0 |
| TC_FW_11 | Thêm nhiều bài tập (3+) qua ExerciseSelector trong cùng 1 freestyle session | Positive | P1 |
| TC_FW_12 | Xóa bài tập khỏi freestyle workout | Positive | P1 |
| TC_FW_13 | Nút "+" sticky vẫn visible khi scroll danh sách bài tập dài | Positive | P1 |
| TC_FW_14 | Nhập weight (kg) cho set trong freestyle workout | Positive | P0 |
| TC_FW_15 | Nhập reps cho set trong freestyle workout | Positive | P0 |
| TC_FW_16 | Thêm nhiều sets cho cùng 1 bài tập trong freestyle | Positive | P1 |
| TC_FW_17 | Rest timer hoạt động bình thường trong freestyle mode | Positive | P1 |
| TC_FW_18 | RPE input hoạt động trong freestyle mode | Positive | P2 |
| TC_FW_19 | Nhấn "Finish" → hiển thị WorkoutSummaryCard | Positive | P0 |
| TC_FW_20 | Ô nhập tên freestyle (freestyle-name-input) hiển thị trên màn summary | Positive | P0 |
| TC_FW_21 | Label "Đặt tên buổi tập" hiển thị bên trên ô nhập tên | Positive | P1 |
| TC_FW_22 | Placeholder "Buổi tập tự do" hiển thị trong ô nhập tên trống | Positive | P1 |
| TC_FW_23 | Nhập tên tùy chỉnh → save → workout.name = tên đã nhập | Positive | P0 |
| TC_FW_24 | Bỏ trống ô tên → save → workout.name = "Buổi tập tự do" (default) | Positive | P0 |
| TC_FW_25 | Nhập tên chỉ có khoảng trắng → trim → fallback về tên mặc định | Edge | P1 |
| TC_FW_26 | Ô nhập tên KHÔNG hiển thị khi WorkoutLogger có planDay (planned workout) | Negative | P0 |
| TC_FW_27 | Save freestyle → planDayId = undefined trong workout object | Positive | P0 |
| TC_FW_28 | saveWorkoutAtomic lưu plan_day_id = NULL vào SQLite cho freestyle | Integration | P0 |
| TC_FW_29 | Workout + sets được lưu trong cùng 1 transaction (atomic) | Integration | P1 |
| TC_FW_30 | onComplete callback nhận workout object với planDayId=undefined | Integration | P1 |
| TC_FW_31 | Freestyle workout KHÔNG thay đổi trạng thái training-partial | Positive | P0 |
| TC_FW_32 | Freestyle workout KHÔNG thay đổi trạng thái training-completed | Positive | P0 |
| TC_FW_33 | Freestyle workout KHÔNG tính vào training streak | Positive | P1 |
| TC_FW_34 | Freestyle workout hiển thị trong WorkoutHistory | Integration | P0 |
| TC_FW_35 | Freestyle workout trong history hiển thị đúng tên (custom hoặc default) | Integration | P1 |
| TC_FW_36 | WorkoutHistory lọc freestyle theo strength/cardio dựa trên sets (không dựa planDayId) | Integration | P1 |
| TC_FW_37 | Freestyle workout với 0 bài tập → xử lý graceful (không crash) | Edge | P1 |
| TC_FW_38 | Tên freestyle 200 ký tự → hiển thị đúng, không overflow | Boundary | P2 |
| TC_FW_39 | Tên freestyle chứa ký tự đặc biệt (<>&"') → escaped đúng, không XSS | Negative | P1 |
| TC_FW_40 | Tên freestyle chứa emoji → lưu và hiển thị đúng | Edge | P2 |
| TC_FW_41 | Draft freestyle workout được lưu và khôi phục khi quay lại | Edge | P1 |
| TC_FW_42 | Nút "+" sticky accessible với screen reader (aria-label) | Positive | P2 |
| TC_FW_43 | Ô nhập tên freestyle accessible — label liên kết đúng với input | Positive | P2 |
| TC_FW_44 | Dark mode — AddSessionModal freestyle button hiển thị đúng colors | Positive | P2 |
| TC_FW_45 | Luồng end-to-end: tab "+" → AddSessionModal → Freestyle → thêm bài tập → log sets → Finish → đặt tên → Save → hiển thị trong History | E2E | P0 |
