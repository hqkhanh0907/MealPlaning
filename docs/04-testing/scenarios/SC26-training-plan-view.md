# Scenario 26: Training Plan View

**Version:** 2.0  
**Date:** 2026-03-26  
**Total Test Cases:** 210

---

## Mô tả tổng quan

TrainingPlanView là component hiển thị kế hoạch tập luyện theo ngày trong tab "Kế hoạch" của module Fitness. Component gồm 3 phần chính: (1) Calendar strip hiển thị 7 ngày trong tuần với nhãn tiếng Việt (T2-CN), highlight ngày hiện tại bằng aria-current="date" và ring emerald, cho phép chọn/bỏ chọn ngày bằng tap toggle; (2) Workout card hiển thị chi tiết bài tập cho ngày được chọn, bao gồm loại workout (strength/cardio), nhóm cơ, danh sách exercises, thời gian ước tính, và nút "Bắt đầu" chỉ enable khi xem ngày hôm nay; (3) Rest day card với gradient teal→blue hiển thị tips nghỉ ngơi, preview bài tập ngày mai, và quick action buttons (Log Weight, Log Light Cardio).

Component tích hợp StreakCounter (đầu trang) và DailyWeightInput (cuối trang). Day pills trên calendar strip mã hóa màu theo loại workout: emerald cho strength, blue cho cardio, slate cho ngày trống. Dữ liệu exercises parse từ JSON string, có error handling cho invalid JSON. Khi không có training plan active, hiển thị CTA tạo plan mới.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| TrainingPlanView | TrainingPlanView.tsx | Component chính hiển thị kế hoạch tập luyện |
| StreakCounter | StreakCounter.tsx | Hiển thị streak tập luyện liên tục |
| DailyWeightInput | DailyWeightInput.tsx | Input cân nặng hàng ngày |
| WorkoutLogger | WorkoutLogger.tsx | Component workout được push khi bắt đầu tập |
| useFitnessStore | fitnessStore.ts | Zustand store: trainingPlans, trainingPlanDays |
| useNavigationStore | navigationStore.ts | Navigation stack: pushPage |
| useTranslation | i18n | Hook i18n cho đa ngôn ngữ |

## Luồng nghiệp vụ

1. Mở tab Fitness → sub-tab "Kế hoạch" → load TrainingPlanView
2. Kiểm tra trainingPlans có plan status='active' → nếu không → hiển thị no-plan CTA
3. Nếu có active plan → hiển thị StreakCounter + calendar strip 7 ngày
4. Mặc định hiển thị ngày hôm nay (viewedDay = todayDow)
5. Tap ngày khác → selectedDay thay đổi → load planDay cho ngày đó
6. Tap cùng ngày đã chọn → deselect → quay về xem today
7. Ngày có workout → hiển thị workout card (exercises, muscle groups, estimated duration)
8. Ngày nghỉ → hiển thị rest day card (tips, tomorrow preview, quick actions)
9. Nút "Bắt đầu" chỉ hiển thị khi viewedDay = today → pushPage WorkoutLogger
10. DailyWeightInput hiển thị cuối trang

## Quy tắc nghiệp vụ

1. activePlan = trainingPlans.find(p => p.status === 'active')
2. planDays = trainingPlanDays.filter(d => d.planId === activePlan.id)
3. viewedDay = selectedDay ?? todayDow (default = today)
4. todayDow: getDay() → 0=CN chuyển thành 7, 1-6 giữ nguyên (T2=1...T7=6, CN=7)
5. tomorrowDow = todayDow === 7 ? 1 : todayDow + 1 (wrap-around Sunday→Monday)
6. Calendar strip: 7 ngày cố định T2-CN (DAY_LABELS = ['T2','T3','T4','T5','T6','T7','CN'])
7. Day pill color: strength → emerald, cardio → blue, no plan → slate
8. Tap day pill: toggle select (tap lần 1 = select, tap lần 2 = deselect)
9. "Bắt đầu" button chỉ render khi isViewingToday = true
10. Rest day tips hiển thị 3 gợi ý cố định
11. Tomorrow preview chỉ hiển thị khi isViewingToday AND tomorrowPlanDay tồn tại
12. Quick actions (Log Weight, Log Light Cardio) chỉ hiển thị khi isViewingToday
13. parseExercises() trả về [] nếu JSON invalid (try-catch)
14. estimateDuration = (sum of sets × (30 + restSeconds)) / 60 + 5 phút
15. aria-current="date" trên day pill của ngày hiện tại

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_TPV_001 | Hiển thị no-plan CTA khi không có active plan | Positive | P0 |
| TC_TPV_002 | Click nút "Tạo kế hoạch" gọi onGeneratePlan | Positive | P0 |
| TC_TPV_003 | Hiển thị calendar strip 7 ngày khi có plan | Positive | P0 |
| TC_TPV_004 | Ngày hiện tại highlight với ring emerald | Positive | P0 |
| TC_TPV_005 | aria-current="date" trên today pill | Positive | P1 |
| TC_TPV_006 | Chọn ngày khác trên calendar strip | Positive | P1 |
| TC_TPV_007 | Tap ngày đã chọn → deselect | Positive | P1 |
| TC_TPV_008 | Workout card hiển thị cho ngày có bài tập | Positive | P0 |
| TC_TPV_009 | Rest day card hiển thị cho ngày nghỉ | Positive | P0 |
| TC_TPV_010 | Nút "Bắt đầu" hiển thị khi xem today | Positive | P0 |
| TC_TPV_011 | Nút "Bắt đầu" ẩn khi xem ngày khác | Negative | P1 |
| TC_TPV_012 | Click "Bắt đầu" → pushPage WorkoutLogger | Positive | P1 |
| TC_TPV_013 | Day pill emerald cho strength workout | Positive | P1 |
| TC_TPV_014 | Day pill blue cho cardio workout | Positive | P1 |
| TC_TPV_015 | Day pill slate cho ngày không có plan | Positive | P1 |
| TC_TPV_016 | Danh sách exercises hiển thị đúng | Positive | P1 |
| TC_TPV_017 | Muscle groups hiển thị trên workout card | Positive | P1 |
| TC_TPV_018 | Estimated duration tính đúng | Positive | P1 |
| TC_TPV_019 | Exercise count hiển thị đúng | Positive | P1 |
| TC_TPV_020 | StreakCounter render ở đầu trang | Positive | P1 |
| TC_TPV_021 | DailyWeightInput render ở cuối trang | Positive | P1 |
| TC_TPV_022 | Rest day tips hiển thị 3 gợi ý | Positive | P2 |
| TC_TPV_023 | Tomorrow preview hiển thị khi xem today + ngày mai có plan | Positive | P1 |
| TC_TPV_024 | Tomorrow preview ẩn khi xem ngày khác | Negative | P2 |
| TC_TPV_025 | Quick actions hiển thị khi rest day + today | Positive | P1 |
| TC_TPV_026 | Quick actions ẩn khi rest day + ngày khác | Negative | P2 |
| TC_TPV_027 | Sunday wrap-around: tomorrowDow = 1 khi today = CN | Edge | P1 |
| TC_TPV_028 | parseExercises với JSON hợp lệ | Positive | P1 |
| TC_TPV_029 | parseExercises với JSON invalid → empty array | Negative | P1 |
| TC_TPV_030 | parseExercises với undefined → empty array | Negative | P1 |
| TC_TPV_031 | Workout card không có muscleGroups → section ẩn | Edge | P2 |
| TC_TPV_032 | Workout card không có exercises → empty list | Edge | P2 |
| TC_TPV_033 | Default viewedDay = todayDow khi selectedDay null | Positive | P1 |
| TC_TPV_034 | Deselect → viewedDay quay về todayDow | Positive | P1 |
| TC_TPV_035 | Calendar strip labels đúng thứ tự T2-CN | Positive | P2 |
| TC_TPV_036 | data-testid attributes đúng | Positive | P2 |
| TC_TPV_037 | Chuyển tab đi và quay lại → state preserved | Positive | P1 |
| TC_TPV_038 | Multiple plans, chỉ 1 active | Edge | P2 |
| TC_TPV_039 | Plan có 7/7 ngày đều có workout | Boundary | P2 |
| TC_TPV_040 | Plan có 7/7 ngày đều là rest day | Boundary | P2 |
| TC_TPV_041 | Exercise list dài (20+ exercises) | Boundary | P2 |
| TC_TPV_042 | estimateDuration với 0 exercises → 5 phút | Boundary | P2 |
| TC_TPV_043 | estimateDuration với exercises có restSeconds = 0 | Edge | P2 |
| TC_TPV_044 | Day pill selection ring visible khi selected | Positive | P2 |
| TC_TPV_045 | Dark mode: workout card đúng colors | Positive | P2 |
| TC_TPV_046 | Dark mode: rest day gradient visible | Positive | P2 |
| TC_TPV_047 | Dark mode: calendar strip đúng contrast | Positive | P2 |
| TC_TPV_048 | i18n: labels cập nhật khi đổi ngôn ngữ | Positive | P2 |
| TC_TPV_049 | Click rapid 10 ngày liên tục — không crash | Edge | P2 |
| TC_TPV_050 | No planDays cho active plan → mọi ngày rest day | Edge | P1 |
| TC_TPV_051 | pushPage truyền đúng workoutPlanDay prop | Positive | P1 |
| TC_TPV_052 | Quick Log Weight button functional | Positive | P2 |
| TC_TPV_053 | Quick Log Cardio button functional | Positive | P2 |
| TC_TPV_054 | Plan ngày T2 (dayOfWeek=1) hiển thị đúng | Positive | P2 |
| TC_TPV_055 | Plan ngày CN (dayOfWeek=7) hiển thị đúng | Edge | P2 |
| TC_TPV_056 | Click chọn ngày T2 trên calendar strip | Positive | P2 |
| TC_TPV_057 | Click chọn ngày T3 trên calendar strip | Positive | P2 |
| TC_TPV_058 | Click chọn ngày T4 trên calendar strip | Positive | P2 |
| TC_TPV_059 | Click chọn ngày T5 trên calendar strip | Positive | P2 |
| TC_TPV_060 | Click chọn ngày T6 trên calendar strip | Positive | P2 |
| TC_TPV_061 | Click chọn ngày T7 trên calendar strip | Positive | P2 |
| TC_TPV_062 | Click chọn ngày CN trên calendar strip | Positive | P2 |
| TC_TPV_063 | Chọn T2 rồi chuyển sang T3 | Positive | P2 |
| TC_TPV_064 | Chọn T3 rồi chuyển sang T4 | Positive | P2 |
| TC_TPV_065 | Chọn T4 rồi chuyển sang T5 | Positive | P2 |
| TC_TPV_066 | Chọn T5 rồi chuyển sang T6 | Positive | P2 |
| TC_TPV_067 | Chọn T6 rồi chuyển sang T7 | Positive | P2 |
| TC_TPV_068 | Chọn T7 rồi chuyển sang CN | Positive | P2 |
| TC_TPV_069 | Chọn CN rồi chuyển sang T2 | Positive | P2 |
| TC_TPV_070 | Chọn T2 rồi deselect bằng click lại | Positive | P2 |
| TC_TPV_071 | Chọn T3 rồi deselect bằng click lại | Positive | P2 |
| TC_TPV_072 | Chọn T4 rồi deselect bằng click lại | Positive | P2 |
| TC_TPV_073 | Chọn T5 rồi deselect bằng click lại | Positive | P2 |
| TC_TPV_074 | Chọn T6 rồi deselect bằng click lại | Positive | P2 |
| TC_TPV_075 | Chọn T7 rồi deselect bằng click lại | Positive | P2 |
| TC_TPV_076 | Chọn CN rồi deselect bằng click lại | Positive | P2 |
| TC_TPV_077 | Ring emerald trên today khi today = T2 | Positive | P1 |
| TC_TPV_078 | Ring emerald trên today khi today = T3 | Positive | P1 |
| TC_TPV_079 | Ring emerald trên today khi today = T4 | Positive | P1 |
| TC_TPV_080 | Ring emerald trên today khi today = T5 | Positive | P1 |
| TC_TPV_081 | Ring emerald trên today khi today = T6 | Positive | P1 |
| TC_TPV_082 | Ring emerald trên today khi today = T7 | Positive | P1 |
| TC_TPV_083 | Ring emerald trên today khi today = CN | Positive | P1 |
| TC_TPV_084 | Ring slate khi chọn ngày T2 (không phải today) | Positive | P2 |
| TC_TPV_085 | Ring slate khi chọn ngày T3 (không phải today) | Positive | P2 |
| TC_TPV_086 | Ring slate khi chọn ngày T4 (không phải today) | Positive | P2 |
| TC_TPV_087 | Ring slate khi chọn ngày T5 (không phải today) | Positive | P2 |
| TC_TPV_088 | Ring slate khi chọn ngày T6 (không phải today) | Positive | P2 |
| TC_TPV_089 | Ring slate khi chọn ngày T7 (không phải today) | Positive | P2 |
| TC_TPV_090 | Ring slate khi chọn ngày CN (không phải today) | Positive | P2 |
| TC_TPV_091 | Workout card với 1 exercise duy nhất | Positive | P1 |
| TC_TPV_092 | Workout card với 3 exercises | Positive | P1 |
| TC_TPV_093 | Workout card với 5 exercises | Positive | P2 |
| TC_TPV_094 | Workout card với 10 exercises | Boundary | P2 |
| TC_TPV_095 | Workout card với 0 exercises (empty list) | Edge | P1 |
| TC_TPV_096 | Exercise name truncation cho tên dài 50+ ký tự | Edge | P2 |
| TC_TPV_097 | Muscle groups display: single group | Positive | P2 |
| TC_TPV_098 | Muscle groups display: multiple groups | Positive | P2 |
| TC_TPV_099 | Muscle groups display: undefined → ẩn section | Edge | P2 |
| TC_TPV_100 | Estimated duration: 0 exercises → 0 phút | Boundary | P1 |
| TC_TPV_101 | Estimated duration: 1 exercise (3 sets, 60s rest) | Positive | P2 |
| TC_TPV_102 | Estimated duration: 5 exercises tổng hợp | Positive | P2 |
| TC_TPV_103 | Workout type: "Strength Training" display | Positive | P2 |
| TC_TPV_104 | Workout type: "Cardio" display | Positive | P2 |
| TC_TPV_105 | Workout type: "Full Body" display | Positive | P2 |
| TC_TPV_106 | Workout type name dài 30+ ký tự | Edge | P3 |
| TC_TPV_107 | Exercise list scroll khi >10 exercises | Boundary | P3 |
| TC_TPV_108 | Exercise nameVi hiển thị đúng ký tự tiếng Việt | Positive | P1 |
| TC_TPV_109 | Workout card header: "Hôm nay" khi xem today | Positive | P1 |
| TC_TPV_110 | Workout card header: day label khi xem ngày khác | Positive | P1 |
| TC_TPV_111 | Rest day card render với gradient teal→blue | Positive | P1 |
| TC_TPV_112 | 3 recovery tips đều hiển thị | Positive | P1 |
| TC_TPV_113 | Tomorrow preview: ngày mai có workout → hiển thị type + exercise count | Positive | P0 |
| TC_TPV_114 | Tomorrow preview: ngày mai không có workout → ẩn | Negative | P1 |
| TC_TPV_115 | Tomorrow preview: Sunday wrap-around (today=CN, tomorrow=T2) | Edge | P1 |
| TC_TPV_116 | Tomorrow preview: Saturday → Sunday | Edge | P2 |
| TC_TPV_117 | Quick actions visible trên today rest day | Positive | P1 |
| TC_TPV_118 | Quick actions ẩn trên non-today rest day | Negative | P2 |
| TC_TPV_119 | "Log cân nặng" chip text và styling | Positive | P2 |
| TC_TPV_120 | "Log cardio nhẹ" chip text và styling | Positive | P2 |
| TC_TPV_121 | Rest day cho mỗi ngày trong tuần (T2) | Positive | P3 |
| TC_TPV_122 | Rest day cho mỗi ngày trong tuần (T5) | Positive | P3 |
| TC_TPV_123 | Rest day dark mode: gradient vẫn visible | Positive | P2 |
| TC_TPV_124 | Rest day Moon icon hiển thị | Positive | P3 |
| TC_TPV_125 | Rest day tips text đọc được qua i18n | Positive | P3 |
| TC_TPV_126 | No active plan → CTA container hiển thị | Positive | P0 |
| TC_TPV_127 | CTA click → onGeneratePlan gọi | Positive | P0 |
| TC_TPV_128 | No active plan → Dumbbell icon visible | Positive | P2 |
| TC_TPV_129 | No active plan → "Chưa có kế hoạch" message text | Positive | P2 |
| TC_TPV_130 | Multiple plans, none active → CTA hiển thị | Edge | P1 |
| TC_TPV_131 | Plan với status="completed" → CTA hiển thị | Edge | P2 |
| TC_TPV_132 | Plan với status="draft" → CTA hiển thị | Edge | P3 |
| TC_TPV_133 | No-plan CTA dark mode rendering | Positive | P3 |
| TC_TPV_134 | CTA button hover state | Positive | P3 |
| TC_TPV_135 | CTA button active:scale-95 effect | Positive | P3 |
| TC_TPV_136 | Nút "Bắt đầu" hiển thị khi today = T2 và có workout | Positive | P1 |
| TC_TPV_137 | Nút "Bắt đầu" hiển thị khi today = T3 và có workout | Positive | P1 |
| TC_TPV_138 | Nút "Bắt đầu" hiển thị khi today = T4 và có workout | Positive | P1 |
| TC_TPV_139 | Nút "Bắt đầu" hiển thị khi today = T5 và có workout | Positive | P1 |
| TC_TPV_140 | Nút "Bắt đầu" hiển thị khi today = T6 và có workout | Positive | P1 |
| TC_TPV_141 | Nút "Bắt đầu" hiển thị khi today = T7 và có workout | Positive | P1 |
| TC_TPV_142 | Nút "Bắt đầu" hiển thị khi today = CN và có workout | Positive | P1 |
| TC_TPV_143 | Nút "Bắt đầu" ẩn khi xem T3 (today = T4) | Negative | P1 |
| TC_TPV_144 | Nút "Bắt đầu" ẩn khi xem T6 (today = T2) | Negative | P1 |
| TC_TPV_145 | Nút "Bắt đầu" ẩn khi xem CN (today = T5) | Negative | P1 |
| TC_TPV_146 | Click "Bắt đầu" → pushPage gọi với đúng planDay data | Positive | P0 |
| TC_TPV_147 | Nút "Bắt đầu" có Play icon | Positive | P3 |
| TC_TPV_148 | Nút "Bắt đầu" styling emerald | Positive | P3 |
| TC_TPV_149 | StreakCounter render ở đầu trang với active plan | Positive | P1 |
| TC_TPV_150 | DailyWeightInput render ở cuối trang với active plan | Positive | P1 |
| TC_TPV_151 | StreakCounter và DailyWeightInput cùng visible | Positive | P2 |
| TC_TPV_152 | No-plan state: StreakCounter KHÔNG hiển thị | Negative | P2 |
| TC_TPV_153 | No-plan state: DailyWeightInput KHÔNG hiển thị | Negative | P2 |
| TC_TPV_154 | No-plan state: Calendar strip KHÔNG hiển thị | Negative | P1 |
| TC_TPV_155 | StreakCounter position: DOM order trước calendar | Positive | P3 |
| TC_TPV_156 | DailyWeightInput position: DOM order sau card | Positive | P3 |
| TC_TPV_157 | parseExercises: valid JSON array → exercises đúng | Positive | P1 |
| TC_TPV_158 | parseExercises: invalid JSON "{bad" → empty array | Negative | P0 |
| TC_TPV_159 | parseExercises: null → empty array | Negative | P1 |
| TC_TPV_160 | parseExercises: undefined → empty array | Negative | P1 |
| TC_TPV_161 | parseExercises: empty string "" → empty array | Edge | P2 |
| TC_TPV_162 | parseExercises: "[]" → empty array | Boundary | P2 |
| TC_TPV_163 | parseExercises: malformed JSON "}" → empty array | Negative | P1 |
| TC_TPV_164 | estimateDuration: 0 exercises → 0 | Boundary | P1 |
| TC_TPV_165 | estimateDuration: 1 exercise (2 sets, 90s rest) | Positive | P2 |
| TC_TPV_166 | estimateDuration: large set (10 exercises, 5 sets each, 120s rest) | Boundary | P2 |
| TC_TPV_167 | todayDow: Sunday (getDay()=0) → mapped to 7 | Edge | P0 |
| TC_TPV_168 | todayDow: Monday (getDay()=1) → stays 1 | Positive | P2 |
| TC_TPV_169 | tomorrowDow: todayDow=7 (Sunday) → returns 1 | Edge | P1 |
| TC_TPV_170 | tomorrowDow: todayDow=6 (Saturday) → returns 7 | Positive | P2 |
| TC_TPV_171 | tomorrowDow: todayDow=1 (Monday) → returns 2 | Positive | P2 |
| TC_TPV_172 | Plan day without exercises field | Edge | P1 |
| TC_TPV_173 | Plan day with empty muscleGroups string | Edge | P2 |
| TC_TPV_174 | Multiple plans: chỉ active plan data hiển thị | Positive | P1 |
| TC_TPV_175 | ViewedDay defaults to todayDow khi selectedDay null | Positive | P1 |
| TC_TPV_176 | Strength day pill: emerald-100 bg, emerald-700 text (light mode) | Positive | P2 |
| TC_TPV_177 | Cardio day pill: blue-100 bg, blue-700 text (light mode) | Positive | P2 |
| TC_TPV_178 | No-plan day pill: slate-100 bg, slate-500 text (light mode) | Positive | P2 |
| TC_TPV_179 | Dark mode: strength pill dark:bg-emerald-900/50 dark:text-emerald-300 | Positive | P2 |
| TC_TPV_180 | Dark mode: cardio pill dark:bg-blue-900/50 dark:text-blue-300 | Positive | P2 |
| TC_TPV_181 | Dark mode: no-plan pill dark:bg-slate-700 dark:text-slate-400 | Positive | P2 |
| TC_TPV_182 | Dark mode: workout card background dark:bg-slate-800 | Positive | P2 |
| TC_TPV_183 | Dark mode: rest day gradient vẫn hiển thị | Positive | P2 |
| TC_TPV_184 | Dark mode: text contrast đủ đọc | Positive | P2 |
| TC_TPV_185 | Dark mode: start workout button visible | Positive | P3 |
| TC_TPV_186 | aria-current="date" chỉ trên today pill | Positive | P1 |
| TC_TPV_187 | Non-today pills: KHÔNG có aria-current | Positive | P2 |
| TC_TPV_188 | data-testid present trên tất cả interactive elements | Positive | P2 |
| TC_TPV_189 | Keyboard navigation: Tab qua day pills | Positive | P2 |
| TC_TPV_190 | Keyboard: Enter/Space chọn day | Positive | P2 |
| TC_TPV_191 | Screen reader: day labels được announce | Positive | P3 |
| TC_TPV_192 | Screen reader: workout type được announce | Positive | P3 |
| TC_TPV_193 | Exercise list semantic (ul/li) | Positive | P2 |
| TC_TPV_194 | Start workout button accessible label | Positive | P2 |
| TC_TPV_195 | CTA button accessible (no-plan state) | Positive | P3 |
| TC_TPV_196 | Decorative icons có aria-hidden="true" | Positive | P2 |
| TC_TPV_197 | Today indicator không chỉ dựa vào color | Positive | P2 |
| TC_TPV_198 | Calendar strip role và accessibility | Positive | P3 |
| TC_TPV_199 | Rapid day selection 20 lần → không crash | Edge | P2 |
| TC_TPV_200 | Select tất cả 7 ngày nhanh liên tục | Edge | P2 |
| TC_TPV_201 | Switch giữa workout và rest days nhanh | Edge | P2 |
| TC_TPV_202 | React.memo optimization: không re-render không cần thiết | Positive | P3 |
| TC_TPV_203 | Large plan: 7 ngày × 10+ exercises mỗi ngày | Boundary | P2 |
| TC_TPV_204 | Calendar strip overflow: 7 pills vừa 1 hàng | Boundary | P2 |
| TC_TPV_205 | Long exercise names không break layout | Edge | P3 |
| TC_TPV_206 | Multiple plans store, switching active plan | Edge | P2 |
| TC_TPV_207 | Empty trainingPlanDays array | Edge | P1 |
| TC_TPV_208 | Empty trainingPlans array | Edge | P1 |
| TC_TPV_209 | Plan day với very large exercise JSON (10KB+) | Boundary | P3 |
| TC_TPV_210 | Memory: không leak sau 50 day switches | Edge | P3 |

---

## Chi tiết Test Cases

##### TC_TPV_001: Hiển thị no-plan CTA khi không có active plan
- **Pre-conditions**: Không có training plan nào hoặc tất cả plans có status !== 'active', isOnboarded = true
- **Steps**:
  1. Mở tab Fitness → sub-tab "Kế hoạch"
  2. Quan sát nội dung TrainingPlanView
- **Expected Result**: Hiển thị centered CTA với Dumbbell icon, message "Chưa có kế hoạch tập luyện", nút "Tạo kế hoạch" visible (data-testid="no-plan-cta", data-testid="create-plan-btn")
- **Priority**: P0 | **Type**: Positive

##### TC_TPV_002: Click nút "Tạo kế hoạch" gọi onGeneratePlan
- **Pre-conditions**: No-plan CTA đang hiển thị
- **Steps**:
  1. Click nút "Tạo kế hoạch" (data-testid="create-plan-btn")
- **Expected Result**: onGeneratePlan callback được gọi, activeSubTab chuyển về 'plan'
- **Priority**: P0 | **Type**: Positive

##### TC_TPV_003: Hiển thị calendar strip 7 ngày khi có plan
- **Pre-conditions**: Có active training plan
- **Steps**:
  1. Mở tab Fitness → sub-tab "Kế hoạch"
  2. Quan sát calendar strip area
- **Expected Result**: Calendar strip (data-testid="calendar-strip") hiển thị 7 day pills, labels T2 T3 T4 T5 T6 T7 CN theo đúng thứ tự
- **Priority**: P0 | **Type**: Positive

##### TC_TPV_004: Ngày hiện tại highlight với ring emerald
- **Pre-conditions**: Có active training plan
- **Steps**:
  1. Xác định ngày hiện tại (ví dụ: T4)
  2. Quan sát day pill tương ứng
- **Expected Result**: Day pill của today có ring-2 ring-emerald-400 class, nổi bật so với các ngày khác
- **Priority**: P0 | **Type**: Positive

##### TC_TPV_005: aria-current="date" trên today pill
- **Pre-conditions**: Có active training plan
- **Steps**:
  1. Inspect DOM day pill ngày hiện tại
- **Expected Result**: Day pill today có attribute aria-current="date", các ngày khác KHÔNG có attribute này
- **Priority**: P1 | **Type**: Positive

##### TC_TPV_006: Chọn ngày khác trên calendar strip
- **Pre-conditions**: Có active plan, đang xem today (mặc định)
- **Steps**:
  1. Click day pill "T6" (data-testid="day-pill-5")
  2. Quan sát workout card/rest day card
- **Expected Result**: T6 pill có selection ring (ring-slate), nội dung card cập nhật theo planDay của T6, selectedDay = 5
- **Priority**: P1 | **Type**: Positive

##### TC_TPV_007: Tap ngày đã chọn → deselect
- **Pre-conditions**: Đã chọn ngày T6 (selectedDay = 5)
- **Steps**:
  1. Click lại day pill "T6"
  2. Quan sát viewedDay
- **Expected Result**: selectedDay trở về null, viewedDay quay về todayDow, nội dung cập nhật hiển thị ngày hôm nay
- **Priority**: P1 | **Type**: Positive

##### TC_TPV_008: Workout card hiển thị cho ngày có bài tập
- **Pre-conditions**: Active plan, ngày đang xem có planDay với exercises
- **Steps**:
  1. Chọn ngày có workout (ví dụ T2 = strength day)
  2. Quan sát data-testid="today-workout-card"
- **Expected Result**: Workout card hiển thị: workout type header, muscle groups (nếu có), exercise count + estimated duration, danh sách exercises dạng ul/li
- **Priority**: P0 | **Type**: Positive

##### TC_TPV_009: Rest day card hiển thị cho ngày nghỉ
- **Pre-conditions**: Active plan, ngày đang xem KHÔNG có planDay
- **Steps**:
  1. Chọn ngày nghỉ
  2. Quan sát data-testid="rest-day-card"
- **Expected Result**: Rest day card gradient teal→blue, Moon icon, message nghỉ ngơi, 3 tips hiển thị
- **Priority**: P0 | **Type**: Positive

##### TC_TPV_010: Nút "Bắt đầu" hiển thị khi xem today
- **Pre-conditions**: Active plan, today có workout, đang xem today (selectedDay = null hoặc = todayDow)
- **Steps**:
  1. Xem ngày hôm nay (mặc định)
  2. Quan sát data-testid="start-workout-btn"
- **Expected Result**: Nút "Bắt đầu" visible với Play icon, emerald background, clickable
- **Priority**: P0 | **Type**: Positive

##### TC_TPV_011: Nút "Bắt đầu" ẩn khi xem ngày khác
- **Pre-conditions**: Active plan, ngày T5 có workout
- **Steps**:
  1. Click day pill T5 (không phải today)
  2. Workout card hiển thị
  3. Search cho data-testid="start-workout-btn"
- **Expected Result**: Nút "Bắt đầu" KHÔNG render trong DOM khi isViewingToday = false
- **Priority**: P1 | **Type**: Negative

##### TC_TPV_012: Click "Bắt đầu" → pushPage WorkoutLogger
- **Pre-conditions**: Đang xem today, today có workout
- **Steps**:
  1. Click nút "Bắt đầu" (data-testid="start-workout-btn")
- **Expected Result**: pushPage được gọi với {id: 'workout-logger', component: WorkoutLogger, props: {workoutPlanDay: planDay}}, chuyển sang màn hình WorkoutLogger
- **Priority**: P1 | **Type**: Positive

##### TC_TPV_013: Day pill emerald cho strength workout
- **Pre-conditions**: Active plan, ngày T2 có workoutType='strength'
- **Steps**:
  1. Quan sát day pill T2
- **Expected Result**: Day pill T2 có background emerald (bg-emerald-500 hoặc tương tự), text white
- **Priority**: P1 | **Type**: Positive

##### TC_TPV_014: Day pill blue cho cardio workout
- **Pre-conditions**: Active plan, ngày T4 có workoutType='cardio'
- **Steps**:
  1. Quan sát day pill T4
- **Expected Result**: Day pill T4 có background blue (bg-blue-500 hoặc tương tự), text white
- **Priority**: P1 | **Type**: Positive

##### TC_TPV_015: Day pill slate cho ngày không có plan
- **Pre-conditions**: Active plan, ngày T7 không có planDay
- **Steps**:
  1. Quan sát day pill T7
- **Expected Result**: Day pill T7 có background slate (bg-slate-200/dark:bg-slate-700), text muted
- **Priority**: P1 | **Type**: Positive

##### TC_TPV_016: Danh sách exercises hiển thị đúng
- **Pre-conditions**: Active plan, ngày có workout với 3 exercises
- **Steps**:
  1. Chọn ngày có workout
  2. Quan sát data-testid="exercise-list"
- **Expected Result**: ul/li list hiển thị tên từng exercise, đúng số lượng (3 items)
- **Priority**: P1 | **Type**: Positive

##### TC_TPV_017: Muscle groups hiển thị trên workout card
- **Pre-conditions**: Active plan, ngày có workout với muscleGroups defined
- **Steps**:
  1. Chọn ngày có workout
  2. Quan sát workout card header
- **Expected Result**: Muscle groups text hiển thị bên dưới workout type heading
- **Priority**: P1 | **Type**: Positive

##### TC_TPV_018: Estimated duration tính đúng
- **Pre-conditions**: Active plan, ngày có workout với 3 exercises: ex1 (3 sets, rest=60s), ex2 (4 sets, rest=90s), ex3 (3 sets, rest=60s)
- **Steps**:
  1. Tính manual: (3×(30+60) + 4×(30+90) + 3×(30+60)) / 60 + 5
  2. So sánh với hiển thị trên data-testid="workout-stats"
- **Expected Result**: Thời gian ước tính hiển thị đúng (theo công thức estimateDuration), đơn vị phút
- **Priority**: P1 | **Type**: Positive

##### TC_TPV_019: Exercise count hiển thị đúng
- **Pre-conditions**: Active plan, ngày có 5 exercises
- **Steps**:
  1. Chọn ngày có workout
  2. Quan sát stats area
- **Expected Result**: Hiển thị "5 bài tập" (hoặc tương đương i18n)
- **Priority**: P1 | **Type**: Positive

##### TC_TPV_020: StreakCounter render ở đầu trang
- **Pre-conditions**: Có active training plan
- **Steps**:
  1. Mở TrainingPlanView
  2. Quan sát vị trí đầu trang (trước calendar strip)
- **Expected Result**: StreakCounter component render visible ở đầu trang
- **Priority**: P1 | **Type**: Positive

##### TC_TPV_021: DailyWeightInput render ở cuối trang
- **Pre-conditions**: Có active training plan
- **Steps**:
  1. Scroll xuống cuối TrainingPlanView
- **Expected Result**: DailyWeightInput component render visible ở cuối trang
- **Priority**: P1 | **Type**: Positive

##### TC_TPV_022: Rest day tips hiển thị 3 gợi ý
- **Pre-conditions**: Đang xem ngày nghỉ
- **Steps**:
  1. Quan sát rest day card
  2. Đếm số tips hiển thị
- **Expected Result**: 3 rest day tips hiển thị (danh sách gợi ý nghỉ ngơi)
- **Priority**: P2 | **Type**: Positive

##### TC_TPV_023: Tomorrow preview hiển thị khi xem today + ngày mai có plan
- **Pre-conditions**: Đang xem today (rest day), ngày mai (tomorrowDow) có planDay
- **Steps**:
  1. Xem today (ngày nghỉ)
  2. Quan sát data-testid="tomorrow-preview"
- **Expected Result**: Tomorrow preview hiển thị tên workout ngày mai, exercises preview, ChevronRight icon
- **Priority**: P1 | **Type**: Positive

##### TC_TPV_024: Tomorrow preview ẩn khi xem ngày khác
- **Pre-conditions**: SelectedDay != todayDow, ngày đang xem là rest day
- **Steps**:
  1. Chọn ngày nghỉ khác today
  2. Search DOM cho data-testid="tomorrow-preview"
- **Expected Result**: Tomorrow preview KHÔNG render trong DOM (isViewingToday = false)
- **Priority**: P2 | **Type**: Negative

##### TC_TPV_025: Quick actions hiển thị khi rest day + today
- **Pre-conditions**: Today là rest day, đang xem today
- **Steps**:
  1. Quan sát data-testid="quick-actions"
- **Expected Result**: 2 quick action buttons hiển thị: "Log Weight" (data-testid="quick-log-weight") và "Log Light Cardio" (data-testid="quick-log-cardio")
- **Priority**: P1 | **Type**: Positive

##### TC_TPV_026: Quick actions ẩn khi rest day + ngày khác
- **Pre-conditions**: Chọn ngày nghỉ khác today
- **Steps**:
  1. Search DOM cho data-testid="quick-actions"
- **Expected Result**: Quick actions KHÔNG render (isViewingToday = false)
- **Priority**: P2 | **Type**: Negative

##### TC_TPV_027: Sunday wrap-around: tomorrowDow = 1 khi today = CN
- **Pre-conditions**: Today = Chủ nhật (todayDow = 7)
- **Steps**:
  1. Xác nhận todayDow = 7
  2. Kiểm tra tomorrowDow
- **Expected Result**: tomorrowDow = 1 (thứ Hai), tomorrow preview hiển thị plan T2 (nếu có)
- **Priority**: P1 | **Type**: Edge

##### TC_TPV_028: parseExercises với JSON hợp lệ
- **Pre-conditions**: planDay.exercises = '[{"nameVi":"Gánh tạ","sets":3}]'
- **Steps**:
  1. Load plan view cho ngày có exercises JSON hợp lệ
- **Expected Result**: Exercises parsed thành công, danh sách hiển thị đúng tên và số lượng
- **Priority**: P1 | **Type**: Positive

##### TC_TPV_029: parseExercises với JSON invalid → empty array
- **Pre-conditions**: planDay.exercises = 'invalid{json'
- **Steps**:
  1. Load plan view cho ngày có invalid JSON
- **Expected Result**: parseExercises trả về [], exercise list trống, KHÔNG crash, không JS error trong Console
- **Priority**: P1 | **Type**: Negative

##### TC_TPV_030: parseExercises với undefined → empty array
- **Pre-conditions**: planDay.exercises = undefined
- **Steps**:
  1. Load plan view cho ngày có exercises undefined
- **Expected Result**: parseExercises trả về [], exercise list trống, workout card vẫn hiển thị (chỉ không có danh sách exercises)
- **Priority**: P1 | **Type**: Negative

##### TC_TPV_031: Workout card không có muscleGroups → section ẩn
- **Pre-conditions**: planDay tồn tại nhưng muscleGroups undefined
- **Steps**:
  1. Load plan view cho ngày đó
  2. Inspect workout card header
- **Expected Result**: Muscle groups text KHÔNG render (conditional: chỉ render nếu viewedPlanDay.muscleGroups truthy)
- **Priority**: P2 | **Type**: Edge

##### TC_TPV_032: Workout card không có exercises → empty list
- **Pre-conditions**: planDay tồn tại nhưng exerciseList trống (exercises = "[]" hoặc undefined)
- **Steps**:
  1. Load plan view cho ngày đó
- **Expected Result**: Workout card hiển thị nhưng exercise list trống (0 items), stats hiển thị "0 bài tập"
- **Priority**: P2 | **Type**: Edge

##### TC_TPV_033: Default viewedDay = todayDow khi selectedDay null
- **Pre-conditions**: Vừa mở TrainingPlanView, chưa click ngày nào
- **Steps**:
  1. Quan sát nội dung card
- **Expected Result**: Hiển thị plan/rest day cho ngày hôm nay (viewedDay = todayDow vì selectedDay = null)
- **Priority**: P1 | **Type**: Positive

##### TC_TPV_034: Deselect → viewedDay quay về todayDow
- **Pre-conditions**: Đã chọn ngày T5 (selectedDay = 5)
- **Steps**:
  1. Click lại T5 để deselect
  2. Quan sát nội dung card
- **Expected Result**: selectedDay = null, viewedDay = todayDow, nội dung quay về hiển thị ngày hôm nay
- **Priority**: P1 | **Type**: Positive

##### TC_TPV_035: Calendar strip labels đúng thứ tự T2-CN
- **Pre-conditions**: Có active plan
- **Steps**:
  1. Đọc text trên 7 day pills từ trái sang phải
- **Expected Result**: Labels theo đúng thứ tự: T2, T3, T4, T5, T6, T7, CN (DAY_LABELS array)
- **Priority**: P2 | **Type**: Positive

##### TC_TPV_036: data-testid attributes đúng
- **Pre-conditions**: Có active plan
- **Steps**:
  1. Inspect DOM elements
- **Expected Result**: Các data-testid present: training-plan-view, calendar-strip, day-pill-1 đến day-pill-7, today-workout-card (hoặc rest-day-card), exercise-list, start-workout-btn (khi today)
- **Priority**: P2 | **Type**: Positive

##### TC_TPV_037: Chuyển tab đi và quay lại → state preserved
- **Pre-conditions**: Đã chọn ngày T5 trên calendar
- **Steps**:
  1. Chuyển sang tab "Tập luyện"
  2. Quay lại tab "Kế hoạch"
- **Expected Result**: TrainingPlanView re-mount, selectedDay reset về null (vì component state, không persist)
- **Priority**: P1 | **Type**: Positive

##### TC_TPV_038: Multiple plans, chỉ 1 active
- **Pre-conditions**: trainingPlans chứa 3 plans: 2 inactive, 1 active
- **Steps**:
  1. Load TrainingPlanView
- **Expected Result**: Chỉ active plan được sử dụng, planDays filter đúng theo activePlan.id
- **Priority**: P2 | **Type**: Edge

##### TC_TPV_039: Plan có 7/7 ngày đều có workout
- **Pre-conditions**: Active plan, planDays cho tất cả 7 ngày
- **Steps**:
  1. Click từng ngày T2-CN
- **Expected Result**: Mỗi ngày hiển thị workout card, KHÔNG có rest day card nào. 7 day pills đều có color (emerald/blue)
- **Priority**: P2 | **Type**: Boundary

##### TC_TPV_040: Plan có 7/7 ngày đều là rest day
- **Pre-conditions**: Active plan, planDays rỗng (không có ngày nào)
- **Steps**:
  1. Click từng ngày T2-CN
- **Expected Result**: Mỗi ngày hiển thị rest day card, 7 day pills đều slate color
- **Priority**: P2 | **Type**: Boundary

##### TC_TPV_041: Exercise list dài (20+ exercises)
- **Pre-conditions**: planDay có 20 exercises trong JSON
- **Steps**:
  1. Load plan view cho ngày đó
  2. Quan sát exercise list
- **Expected Result**: Tất cả 20 exercises hiển thị, list scrollable nếu cần, không bị truncate
- **Priority**: P2 | **Type**: Boundary

##### TC_TPV_042: estimateDuration với 0 exercises → 5 phút
- **Pre-conditions**: planDay tồn tại nhưng exercises = "[]"
- **Steps**:
  1. Tính: sum of sets = 0, (0)/60 + 5 = 5
  2. Verify trên UI
- **Expected Result**: Estimated duration = 5 phút (base time only)
- **Priority**: P2 | **Type**: Boundary

##### TC_TPV_043: estimateDuration với exercises có restSeconds = 0
- **Pre-conditions**: planDay có exercise với restSeconds = 0, sets = 4
- **Steps**:
  1. Tính: 4 × (30 + 0) / 60 + 5 = 7 phút
  2. Verify trên UI
- **Expected Result**: Duration tính đúng với restSeconds = 0 (chỉ tính 30s per set + 5 phút base)
- **Priority**: P2 | **Type**: Edge

##### TC_TPV_044: Day pill selection ring visible khi selected
- **Pre-conditions**: Có active plan
- **Steps**:
  1. Click day pill T3
  2. Inspect styling
- **Expected Result**: T3 pill có ring class (ring-slate hoặc tương tự) phân biệt với pills không selected
- **Priority**: P2 | **Type**: Positive

##### TC_TPV_045: Dark mode: workout card đúng colors
- **Pre-conditions**: Dark mode enabled, ngày có workout
- **Steps**:
  1. Quan sát workout card
- **Expected Result**: Card background dark:bg-slate tối, text sáng, contrast đủ đọc
- **Priority**: P2 | **Type**: Positive

##### TC_TPV_046: Dark mode: rest day gradient visible
- **Pre-conditions**: Dark mode enabled, ngày nghỉ
- **Steps**:
  1. Quan sát rest day card
- **Expected Result**: Gradient teal→blue vẫn visible trong dark mode, text đọc được
- **Priority**: P2 | **Type**: Positive

##### TC_TPV_047: Dark mode: calendar strip đúng contrast
- **Pre-conditions**: Dark mode enabled
- **Steps**:
  1. Quan sát day pills
- **Expected Result**: Day pill labels đọc được, colors phân biệt rõ ràng trên dark background
- **Priority**: P2 | **Type**: Positive

##### TC_TPV_048: i18n: labels cập nhật khi đổi ngôn ngữ
- **Pre-conditions**: Có active plan
- **Steps**:
  1. Đổi ngôn ngữ vi → en
  2. Quan sát buttons, labels
- **Expected Result**: Button "Bắt đầu" → "Start", các label workout/rest day cập nhật, DAY_LABELS vẫn T2-CN (hardcoded)
- **Priority**: P2 | **Type**: Positive

##### TC_TPV_049: Click rapid 10 ngày liên tục — không crash
- **Pre-conditions**: Có active plan
- **Steps**:
  1. Click nhanh qua 7 day pills, lặp lại 10 lần trong < 3 giây
- **Expected Result**: Không crash, không JS error, ngày cuối cùng clicked hiển thị đúng content
- **Priority**: P2 | **Type**: Edge

##### TC_TPV_050: No planDays cho active plan → mọi ngày rest day
- **Pre-conditions**: Active plan tồn tại nhưng trainingPlanDays trống cho plan đó
- **Steps**:
  1. Load TrainingPlanView
  2. Click qua từng ngày
- **Expected Result**: Mọi ngày đều hiển thị rest day card, tất cả day pills slate color
- **Priority**: P1 | **Type**: Edge

##### TC_TPV_051: pushPage truyền đúng workoutPlanDay prop
- **Pre-conditions**: Today có workout
- **Steps**:
  1. Click "Bắt đầu"
  2. Verify props truyền cho WorkoutLogger
- **Expected Result**: pushPage gọi với props chứa workoutPlanDay = {dayOfWeek, workoutType, exercises, muscleGroups} đúng data
- **Priority**: P1 | **Type**: Positive

##### TC_TPV_052: Quick Log Weight button functional
- **Pre-conditions**: Today là rest day, quick actions visible
- **Steps**:
  1. Click "Log Weight" (data-testid="quick-log-weight")
- **Expected Result**: Trigger action log weight (focus vào DailyWeightInput hoặc mở modal tương ứng)
- **Priority**: P2 | **Type**: Positive

##### TC_TPV_053: Quick Log Cardio button functional
- **Pre-conditions**: Today là rest day, quick actions visible
- **Steps**:
  1. Click "Log Light Cardio" (data-testid="quick-log-cardio")
- **Expected Result**: Trigger action log cardio (chuyển sang tab workout cardio mode hoặc mở logger)
- **Priority**: P2 | **Type**: Positive

##### TC_TPV_054: Plan ngày T2 (dayOfWeek=1) hiển thị đúng
- **Pre-conditions**: Active plan, T2 có workout
- **Steps**:
  1. Click day-pill-1 (T2)
- **Expected Result**: Workout card hiển thị đúng data cho dayOfWeek=1
- **Priority**: P2 | **Type**: Positive

##### TC_TPV_055: Plan ngày CN (dayOfWeek=7) hiển thị đúng
- **Pre-conditions**: Active plan, CN có workout
- **Steps**:
  1. Click day-pill-7 (CN)
- **Expected Result**: Workout card hiển thị đúng data cho dayOfWeek=7. getTodayDow xử lý đúng Sunday (getDay()=0 → dow=7)
- **Priority**: P2 | **Type**: Edge

##### TC_TPV_056: Click chọn ngày T2 trên calendar strip
- **Pre-conditions**: Có active plan, đang xem today mặc định
- **Steps**:
  1. Click day-pill-1 (T2)
  2. Quan sát selection ring và nội dung card
- **Expected Result**: Day pill T2 có selection ring (ring-slate-400 nếu không phải today), nội dung cập nhật cho dayOfWeek=1
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_057: Click chọn ngày T3 trên calendar strip
- **Pre-conditions**: Có active plan, đang xem today mặc định
- **Steps**:
  1. Click day-pill-2 (T3)
  2. Quan sát selection ring và nội dung card
- **Expected Result**: Day pill T3 có selection ring (ring-slate-400 nếu không phải today), nội dung cập nhật cho dayOfWeek=2
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_058: Click chọn ngày T4 trên calendar strip
- **Pre-conditions**: Có active plan, đang xem today mặc định
- **Steps**:
  1. Click day-pill-3 (T4)
  2. Quan sát selection ring và nội dung card
- **Expected Result**: Day pill T4 có selection ring (ring-slate-400 nếu không phải today), nội dung cập nhật cho dayOfWeek=3
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_059: Click chọn ngày T5 trên calendar strip
- **Pre-conditions**: Có active plan, đang xem today mặc định
- **Steps**:
  1. Click day-pill-4 (T5)
  2. Quan sát selection ring và nội dung card
- **Expected Result**: Day pill T5 có selection ring (ring-slate-400 nếu không phải today), nội dung cập nhật cho dayOfWeek=4
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_060: Click chọn ngày T6 trên calendar strip
- **Pre-conditions**: Có active plan, đang xem today mặc định
- **Steps**:
  1. Click day-pill-5 (T6)
  2. Quan sát selection ring và nội dung card
- **Expected Result**: Day pill T6 có selection ring (ring-slate-400 nếu không phải today), nội dung cập nhật cho dayOfWeek=5
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_061: Click chọn ngày T7 trên calendar strip
- **Pre-conditions**: Có active plan, đang xem today mặc định
- **Steps**:
  1. Click day-pill-6 (T7)
  2. Quan sát selection ring và nội dung card
- **Expected Result**: Day pill T7 có selection ring (ring-slate-400 nếu không phải today), nội dung cập nhật cho dayOfWeek=6
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_062: Click chọn ngày CN trên calendar strip
- **Pre-conditions**: Có active plan, đang xem today mặc định
- **Steps**:
  1. Click day-pill-7 (CN)
  2. Quan sát selection ring và nội dung card
- **Expected Result**: Day pill CN có selection ring (ring-slate-400 nếu không phải today), nội dung cập nhật cho dayOfWeek=7
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_063: Chọn T2 rồi chuyển sang T3
- **Pre-conditions**: Có active plan, đã chọn T2 (selectedDay=1)
- **Steps**:
  1. Click day-pill-2 (T3)
  2. Quan sát nội dung card
- **Expected Result**: Selection chuyển sang T3, ring xuất hiện trên T3, nội dung cập nhật cho dayOfWeek=2
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_064: Chọn T3 rồi chuyển sang T4
- **Pre-conditions**: Có active plan, đã chọn T3 (selectedDay=2)
- **Steps**:
  1. Click day-pill-3 (T4)
  2. Quan sát nội dung card
- **Expected Result**: Selection chuyển sang T4, ring xuất hiện trên T4, nội dung cập nhật cho dayOfWeek=3
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_065: Chọn T4 rồi chuyển sang T5
- **Pre-conditions**: Có active plan, đã chọn T4 (selectedDay=3)
- **Steps**:
  1. Click day-pill-4 (T5)
  2. Quan sát nội dung card
- **Expected Result**: Selection chuyển sang T5, ring xuất hiện trên T5, nội dung cập nhật cho dayOfWeek=4
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_066: Chọn T5 rồi chuyển sang T6
- **Pre-conditions**: Có active plan, đã chọn T5 (selectedDay=4)
- **Steps**:
  1. Click day-pill-5 (T6)
  2. Quan sát nội dung card
- **Expected Result**: Selection chuyển sang T6, ring xuất hiện trên T6, nội dung cập nhật cho dayOfWeek=5
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_067: Chọn T6 rồi chuyển sang T7
- **Pre-conditions**: Có active plan, đã chọn T6 (selectedDay=5)
- **Steps**:
  1. Click day-pill-6 (T7)
  2. Quan sát nội dung card
- **Expected Result**: Selection chuyển sang T7, ring xuất hiện trên T7, nội dung cập nhật cho dayOfWeek=6
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_068: Chọn T7 rồi chuyển sang CN
- **Pre-conditions**: Có active plan, đã chọn T7 (selectedDay=6)
- **Steps**:
  1. Click day-pill-7 (CN)
  2. Quan sát nội dung card
- **Expected Result**: Selection chuyển sang CN, ring xuất hiện trên CN, nội dung cập nhật cho dayOfWeek=7
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_069: Chọn CN rồi chuyển sang T2
- **Pre-conditions**: Có active plan, đã chọn CN (selectedDay=7)
- **Steps**:
  1. Click day-pill-1 (T2)
  2. Quan sát nội dung card
- **Expected Result**: Selection chuyển sang T2, ring xuất hiện trên T2, nội dung cập nhật cho dayOfWeek=1
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_070: Chọn T2 rồi deselect bằng click lại
- **Pre-conditions**: Đã chọn T2 (selectedDay=1)
- **Steps**:
  1. Click lại day-pill-1 (T2)
  2. Quan sát viewedDay
- **Expected Result**: selectedDay = null, viewedDay quay về todayDow, nội dung hiển thị ngày hôm nay
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_071: Chọn T3 rồi deselect bằng click lại
- **Pre-conditions**: Đã chọn T3 (selectedDay=2)
- **Steps**:
  1. Click lại day-pill-2 (T3)
  2. Quan sát viewedDay
- **Expected Result**: selectedDay = null, viewedDay quay về todayDow, nội dung hiển thị ngày hôm nay
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_072: Chọn T4 rồi deselect bằng click lại
- **Pre-conditions**: Đã chọn T4 (selectedDay=3)
- **Steps**:
  1. Click lại day-pill-3 (T4)
  2. Quan sát viewedDay
- **Expected Result**: selectedDay = null, viewedDay quay về todayDow, nội dung hiển thị ngày hôm nay
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_073: Chọn T5 rồi deselect bằng click lại
- **Pre-conditions**: Đã chọn T5 (selectedDay=4)
- **Steps**:
  1. Click lại day-pill-4 (T5)
  2. Quan sát viewedDay
- **Expected Result**: selectedDay = null, viewedDay quay về todayDow, nội dung hiển thị ngày hôm nay
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_074: Chọn T6 rồi deselect bằng click lại
- **Pre-conditions**: Đã chọn T6 (selectedDay=5)
- **Steps**:
  1. Click lại day-pill-5 (T6)
  2. Quan sát viewedDay
- **Expected Result**: selectedDay = null, viewedDay quay về todayDow, nội dung hiển thị ngày hôm nay
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_075: Chọn T7 rồi deselect bằng click lại
- **Pre-conditions**: Đã chọn T7 (selectedDay=6)
- **Steps**:
  1. Click lại day-pill-6 (T7)
  2. Quan sát viewedDay
- **Expected Result**: selectedDay = null, viewedDay quay về todayDow, nội dung hiển thị ngày hôm nay
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_076: Chọn CN rồi deselect bằng click lại
- **Pre-conditions**: Đã chọn CN (selectedDay=7)
- **Steps**:
  1. Click lại day-pill-7 (CN)
  2. Quan sát viewedDay
- **Expected Result**: selectedDay = null, viewedDay quay về todayDow, nội dung hiển thị ngày hôm nay
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_077: Ring emerald trên today khi today = T2
- **Pre-conditions**: Hệ thống date mock: today = T2 (todayDow=1), có active plan
- **Steps**:
  1. Quan sát day-pill-1
  2. Inspect ring class
- **Expected Result**: Day pill T2 có ring-2 ring-emerald-500, aria-current="date". Các ngày khác KHÔNG có ring emerald
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_078: Ring emerald trên today khi today = T3
- **Pre-conditions**: Hệ thống date mock: today = T3 (todayDow=2), có active plan
- **Steps**:
  1. Quan sát day-pill-2
  2. Inspect ring class
- **Expected Result**: Day pill T3 có ring-2 ring-emerald-500, aria-current="date". Các ngày khác KHÔNG có ring emerald
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_079: Ring emerald trên today khi today = T4
- **Pre-conditions**: Hệ thống date mock: today = T4 (todayDow=3), có active plan
- **Steps**:
  1. Quan sát day-pill-3
  2. Inspect ring class
- **Expected Result**: Day pill T4 có ring-2 ring-emerald-500, aria-current="date". Các ngày khác KHÔNG có ring emerald
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_080: Ring emerald trên today khi today = T5
- **Pre-conditions**: Hệ thống date mock: today = T5 (todayDow=4), có active plan
- **Steps**:
  1. Quan sát day-pill-4
  2. Inspect ring class
- **Expected Result**: Day pill T5 có ring-2 ring-emerald-500, aria-current="date". Các ngày khác KHÔNG có ring emerald
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_081: Ring emerald trên today khi today = T6
- **Pre-conditions**: Hệ thống date mock: today = T6 (todayDow=5), có active plan
- **Steps**:
  1. Quan sát day-pill-5
  2. Inspect ring class
- **Expected Result**: Day pill T6 có ring-2 ring-emerald-500, aria-current="date". Các ngày khác KHÔNG có ring emerald
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_082: Ring emerald trên today khi today = T7
- **Pre-conditions**: Hệ thống date mock: today = T7 (todayDow=6), có active plan
- **Steps**:
  1. Quan sát day-pill-6
  2. Inspect ring class
- **Expected Result**: Day pill T7 có ring-2 ring-emerald-500, aria-current="date". Các ngày khác KHÔNG có ring emerald
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_083: Ring emerald trên today khi today = CN
- **Pre-conditions**: Hệ thống date mock: today = CN (todayDow=7), có active plan
- **Steps**:
  1. Quan sát day-pill-7
  2. Inspect ring class
- **Expected Result**: Day pill CN có ring-2 ring-emerald-500, aria-current="date". Các ngày khác KHÔNG có ring emerald
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_084: Ring slate khi chọn ngày T2 (không phải today)
- **Pre-conditions**: Today ≠ T2, có active plan
- **Steps**:
  1. Click day-pill-1 (T2)
  2. Inspect ring class
- **Expected Result**: Day pill T2 có ring-2 ring-slate-400 (selection ring), KHÔNG có ring-emerald
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_085: Ring slate khi chọn ngày T3 (không phải today)
- **Pre-conditions**: Today ≠ T3, có active plan
- **Steps**:
  1. Click day-pill-2 (T3)
  2. Inspect ring class
- **Expected Result**: Day pill T3 có ring-2 ring-slate-400 (selection ring), KHÔNG có ring-emerald
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_086: Ring slate khi chọn ngày T4 (không phải today)
- **Pre-conditions**: Today ≠ T4, có active plan
- **Steps**:
  1. Click day-pill-3 (T4)
  2. Inspect ring class
- **Expected Result**: Day pill T4 có ring-2 ring-slate-400 (selection ring), KHÔNG có ring-emerald
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_087: Ring slate khi chọn ngày T5 (không phải today)
- **Pre-conditions**: Today ≠ T5, có active plan
- **Steps**:
  1. Click day-pill-4 (T5)
  2. Inspect ring class
- **Expected Result**: Day pill T5 có ring-2 ring-slate-400 (selection ring), KHÔNG có ring-emerald
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_088: Ring slate khi chọn ngày T6 (không phải today)
- **Pre-conditions**: Today ≠ T6, có active plan
- **Steps**:
  1. Click day-pill-5 (T6)
  2. Inspect ring class
- **Expected Result**: Day pill T6 có ring-2 ring-slate-400 (selection ring), KHÔNG có ring-emerald
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_089: Ring slate khi chọn ngày T7 (không phải today)
- **Pre-conditions**: Today ≠ T7, có active plan
- **Steps**:
  1. Click day-pill-6 (T7)
  2. Inspect ring class
- **Expected Result**: Day pill T7 có ring-2 ring-slate-400 (selection ring), KHÔNG có ring-emerald
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_090: Ring slate khi chọn ngày CN (không phải today)
- **Pre-conditions**: Today ≠ CN, có active plan
- **Steps**:
  1. Click day-pill-7 (CN)
  2. Inspect ring class
- **Expected Result**: Day pill CN có ring-2 ring-slate-400 (selection ring), KHÔNG có ring-emerald
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_091: Workout card với 1 exercise duy nhất
- **Pre-conditions**: Active plan, ngày có planDay với 1 exercise trong JSON
- **Steps**:
  1. Chọn ngày có 1 exercise
  2. Quan sát exercise list
- **Expected Result**: Exercise list hiển thị 1 item, stats hiển thị "1 bài tập", estimated duration tính đúng
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_092: Workout card với 3 exercises
- **Pre-conditions**: Active plan, ngày có planDay với 3 exercises
- **Steps**:
  1. Chọn ngày có 3 exercises
  2. Quan sát exercise list
- **Expected Result**: Exercise list hiển thị 3 items, stats hiển thị "3 bài tập"
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_093: Workout card với 5 exercises
- **Pre-conditions**: Active plan, ngày có 5 exercises
- **Steps**:
  1. Chọn ngày
  2. Đếm exercises trong list
- **Expected Result**: 5 exercises hiển thị đúng, duration tính cho 5 exercises
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_094: Workout card với 10 exercises
- **Pre-conditions**: Active plan, ngày có 10 exercises trong JSON
- **Steps**:
  1. Chọn ngày
  2. Scroll exercise list nếu cần
  3. Đếm items
- **Expected Result**: 10 exercises hiển thị, list có thể scroll, stats hiển thị "10 bài tập"
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_TPV_095: Workout card với 0 exercises (empty list)
- **Pre-conditions**: Active plan, planDay tồn tại nhưng exercises = "[]"
- **Steps**:
  1. Chọn ngày
  2. Quan sát exercise area
- **Expected Result**: Workout card hiển thị nhưng không có exercise list (viewedExercises.length === 0), stats "0 bài tập ~5 phút"
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_TPV_096: Exercise name truncation cho tên dài 50+ ký tự
- **Pre-conditions**: Active plan, exercise có nameVi = "Bài tập nâng tạ đẩy ngực trên ghế nghiêng 45 độ với tạ đơn" (50+ chars)
- **Steps**:
  1. Chọn ngày có exercise tên dài
  2. Quan sát display
- **Expected Result**: Tên exercise hiển thị đầy đủ hoặc truncate với ellipsis, KHÔNG bị overflow layout
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_TPV_097: Muscle groups display: single group
- **Pre-conditions**: planDay có muscleGroups = "Ngực"
- **Steps**:
  1. Chọn ngày
  2. Quan sát muscle groups area
- **Expected Result**: Text "Ngực" hiển thị bên dưới workout type heading
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_098: Muscle groups display: multiple groups
- **Pre-conditions**: planDay có muscleGroups = "Ngực, Vai, Tay sau"
- **Steps**:
  1. Chọn ngày
  2. Quan sát muscle groups area
- **Expected Result**: Text "Ngực, Vai, Tay sau" hiển thị đúng, wrapping nếu dài
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_099: Muscle groups display: undefined → ẩn section
- **Pre-conditions**: planDay có muscleGroups = undefined
- **Steps**:
  1. Chọn ngày
  2. Inspect DOM cho muscle groups element
- **Expected Result**: Muscle groups paragraph KHÔNG render (conditional && check)
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_TPV_100: Estimated duration: 0 exercises → 0 phút
- **Pre-conditions**: planDay với exercises = "[]" (rỗng)
- **Steps**:
  1. Load plan view
  2. Kiểm tra estimateDuration output
- **Expected Result**: estimateDuration([]) = 0 (trả về 0, không cộng 5 vì length===0)
- **Priority**: P1 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_TPV_101: Estimated duration: 1 exercise (3 sets, 60s rest)
- **Pre-conditions**: planDay có 1 exercise: sets=3, restSeconds=60
- **Steps**:
  1. Tính: (3×(30+60))/60 + 5 = 4.5 + 5 = 10 (round)
  2. Verify trên UI
- **Expected Result**: Duration hiển thị ~10 phút (Math.round(270/60) + 5 = 10)
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_102: Estimated duration: 5 exercises tổng hợp
- **Pre-conditions**: planDay có 5 exercises, mỗi exercise 4 sets × 90s rest
- **Steps**:
  1. Tính: 5×(4×(30+90))/60 + 5 = 40 + 5 = 45
  2. Verify trên UI
- **Expected Result**: Duration hiển thị ~45 phút
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_103: Workout type: "Strength Training" display
- **Pre-conditions**: planDay.workoutType = "Strength Training"
- **Steps**:
  1. Chọn ngày
  2. Quan sát heading trong workout card
- **Expected Result**: H3 heading hiển thị text "Strength Training"
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_104: Workout type: "Cardio" display
- **Pre-conditions**: planDay.workoutType = "Cardio"
- **Steps**:
  1. Chọn ngày
  2. Quan sát heading
- **Expected Result**: H3 heading hiển thị text "Cardio"
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_105: Workout type: "Full Body" display
- **Pre-conditions**: planDay.workoutType = "Full Body"
- **Steps**:
  1. Chọn ngày
  2. Quan sát heading
- **Expected Result**: H3 heading hiển thị text "Full Body"
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_106: Workout type name dài 30+ ký tự
- **Pre-conditions**: planDay.workoutType = "Upper Body Strength + Core Stability Training"
- **Steps**:
  1. Chọn ngày
  2. Quan sát heading hiển thị
- **Expected Result**: Tên hiển thị đầy đủ hoặc wrap, KHÔNG overflow card container
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_TPV_107: Exercise list scroll khi >10 exercises
- **Pre-conditions**: planDay có 15 exercises
- **Steps**:
  1. Chọn ngày
  2. Scroll trong exercise list area
- **Expected Result**: List overflow handled, tất cả 15 exercises accessible qua scroll
- **Priority**: P3 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_TPV_108: Exercise nameVi hiển thị đúng ký tự tiếng Việt
- **Pre-conditions**: planDay có exercises với nameVi chứa dấu: "Gánh tạ đẩy", "Đẩy ngực nằm"
- **Steps**:
  1. Chọn ngày
  2. Quan sát exercise names
- **Expected Result**: Tất cả ký tự tiếng Việt có dấu hiển thị đúng, không bị encoding lỗi
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_109: Workout card header: "Hôm nay" khi xem today
- **Pre-conditions**: Đang xem today (isViewingToday = true)
- **Steps**:
  1. Quan sát workout card header (data-testid="workout-card-header")
- **Expected Result**: Header hiển thị text t("fitness.plan.todayWorkout") = "Hôm nay" (hoặc tương đương i18n)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_110: Workout card header: day label khi xem ngày khác
- **Pre-conditions**: Đang xem T5 (isViewingToday = false)
- **Steps**:
  1. Click day-pill-4 (T5)
  2. Quan sát workout card header
- **Expected Result**: Header hiển thị "T5" (DAY_LABELS[viewedDay-1]) thay vì "Hôm nay"
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_111: Rest day card render với gradient teal→blue
- **Pre-conditions**: Ngày xem là rest day (không có planDay)
- **Steps**:
  1. Chọn ngày nghỉ
  2. Inspect background
- **Expected Result**: Rest day card có class gradient bg-gradient-to-br from-teal-500 to-blue-500, text white
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_112: 3 recovery tips đều hiển thị
- **Pre-conditions**: Đang xem rest day
- **Steps**:
  1. Quan sát ul trong rest day card
  2. Đếm li items
- **Expected Result**: 3 tips hiển thị: restDayTip1, restDayTip2, restDayTip3 (từ i18n keys)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_113: Tomorrow preview: ngày mai có workout → hiển thị type + exercise count
- **Pre-conditions**: Today là rest day, tomorrowPlanDay tồn tại (VD: tomorrow = Strength, 5 exercises)
- **Steps**:
  1. Xem today (rest day)
  2. Quan sát data-testid="tomorrow-preview"
- **Expected Result**: Preview hiển thị: "📋 Ngày mai: Strength — 5 bài tập" (tomorrowPlanDay.workoutType + tomorrowExercises.length)
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_114: Tomorrow preview: ngày mai không có workout → ẩn
- **Pre-conditions**: Today là rest day, tomorrowDow KHÔNG có planDay
- **Steps**:
  1. Xem today
  2. Search DOM cho tomorrow-preview
- **Expected Result**: tomorrow-preview KHÔNG render (conditional: isViewingToday && tomorrowPlanDay)
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_TPV_115: Tomorrow preview: Sunday wrap-around (today=CN, tomorrow=T2)
- **Pre-conditions**: todayDow=7 (CN), T2 (dayOfWeek=1) có planDay
- **Steps**:
  1. Xem today = CN (rest day)
  2. Quan sát tomorrow preview
- **Expected Result**: tomorrowDow=1, preview hiển thị plan của T2 (Monday)
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_TPV_116: Tomorrow preview: Saturday → Sunday
- **Pre-conditions**: todayDow=6 (T7), CN (dayOfWeek=7) có planDay hoặc rest
- **Steps**:
  1. Xem today = T7 (rest day)
- **Expected Result**: tomorrowDow=7, preview hiển thị plan CN nếu tồn tại
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_TPV_117: Quick actions visible trên today rest day
- **Pre-conditions**: Today là rest day, đang xem today
- **Steps**:
  1. Quan sát data-testid="quick-actions"
- **Expected Result**: 2 buttons hiển thị: quick-log-weight và quick-log-cardio, styling bg-white/20 rounded-full
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_118: Quick actions ẩn trên non-today rest day
- **Pre-conditions**: Chọn ngày nghỉ khác today
- **Steps**:
  1. Click ngày nghỉ ≠ today
  2. Search DOM cho quick-actions
- **Expected Result**: quick-actions div KHÔNG render trong DOM
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_TPV_119: "Log cân nặng" chip text và styling
- **Pre-conditions**: Today rest day, quick actions visible
- **Steps**:
  1. Inspect quick-log-weight button
- **Expected Result**: Button có text t("fitness.plan.logWeight"), class bg-white/20 px-3 py-1.5 rounded-full text-white
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_120: "Log cardio nhẹ" chip text và styling
- **Pre-conditions**: Today rest day, quick actions visible
- **Steps**:
  1. Inspect quick-log-cardio button
- **Expected Result**: Button có text t("fitness.plan.logLightCardio"), styling tương tự log weight chip
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_121: Rest day cho mỗi ngày trong tuần (T2)
- **Pre-conditions**: Active plan, T2 KHÔNG có planDay (rest day)
- **Steps**:
  1. Click day-pill-1 (T2)
  2. Quan sát content
- **Expected Result**: Rest day card hiển thị cho T2
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_122: Rest day cho mỗi ngày trong tuần (T5)
- **Pre-conditions**: Active plan, T5 KHÔNG có planDay
- **Steps**:
  1. Click day-pill-4 (T5)
  2. Quan sát content
- **Expected Result**: Rest day card hiển thị cho T5
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_123: Rest day dark mode: gradient vẫn visible
- **Pre-conditions**: Dark mode enabled, đang xem rest day
- **Steps**:
  1. Quan sát rest day card trong dark mode
- **Expected Result**: Gradient teal→blue vẫn hiển thị đẹp, text white readable trên dark background
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_124: Rest day Moon icon hiển thị
- **Pre-conditions**: Đang xem rest day
- **Steps**:
  1. Inspect rest day card header
- **Expected Result**: Moon icon (aria-hidden="true") hiển thị bên cạnh heading "Ngày nghỉ"
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_125: Rest day tips text đọc được qua i18n
- **Pre-conditions**: Đang xem rest day
- **Steps**:
  1. Quan sát 3 tips text
- **Expected Result**: Tips sử dụng i18n keys (restDayTip1/2/3), text hiển thị đúng ngôn ngữ hiện tại
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_126: No active plan → CTA container hiển thị
- **Pre-conditions**: trainingPlans = [] hoặc tất cả status ≠ "active"
- **Steps**:
  1. Mở TrainingPlanView
- **Expected Result**: data-testid="no-plan-cta" visible, centered, chứa Dumbbell icon + message + button
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_127: CTA click → onGeneratePlan gọi
- **Pre-conditions**: No-plan CTA hiển thị
- **Steps**:
  1. Click nút "Tạo kế hoạch"
- **Expected Result**: onGeneratePlan callback triggered, activeSubTab chuyển về plan
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_128: No active plan → Dumbbell icon visible
- **Pre-conditions**: No-plan CTA hiển thị
- **Steps**:
  1. Inspect CTA area
- **Expected Result**: Dumbbell icon h-12 w-12 text-slate-300 visible, aria-hidden="true"
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_129: No active plan → "Chưa có kế hoạch" message text
- **Pre-conditions**: No-plan CTA hiển thị
- **Steps**:
  1. Quan sát text message
- **Expected Result**: Message hiển thị t("fitness.plan.noPlan"), text-slate-500
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_130: Multiple plans, none active → CTA hiển thị
- **Pre-conditions**: trainingPlans có 3 entries, tất cả status="completed"
- **Steps**:
  1. Load TrainingPlanView
- **Expected Result**: activePlan = undefined (find returns undefined), no-plan CTA hiển thị
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_TPV_131: Plan với status="completed" → CTA hiển thị
- **Pre-conditions**: trainingPlans = [{status: "completed", ...}]
- **Steps**:
  1. Load TrainingPlanView
- **Expected Result**: Không có active plan, CTA hiển thị bình thường
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_TPV_132: Plan với status="draft" → CTA hiển thị
- **Pre-conditions**: trainingPlans = [{status: "draft", ...}]
- **Steps**:
  1. Load TrainingPlanView
- **Expected Result**: Draft plan không phải active, CTA hiển thị
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_TPV_133: No-plan CTA dark mode rendering
- **Pre-conditions**: Dark mode enabled, no active plan
- **Steps**:
  1. Quan sát CTA trong dark mode
- **Expected Result**: Dumbbell icon dark:text-slate-600, message text dark:text-slate-400, button emerald vẫn visible
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_134: CTA button hover state
- **Pre-conditions**: No-plan CTA hiển thị
- **Steps**:
  1. Hover trên nút "Tạo kế hoạch"
- **Expected Result**: Button chuyển sang hover:bg-emerald-600, cursor pointer
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_135: CTA button active:scale-95 effect
- **Pre-conditions**: No-plan CTA hiển thị
- **Steps**:
  1. Click và giữ nút "Tạo kế hoạch"
- **Expected Result**: Button scale nhỏ lại (active:scale-95) tạo feedback visual
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_136: Nút "Bắt đầu" hiển thị khi today = T2 và có workout
- **Pre-conditions**: Mock today = T2 (todayDow=1), T2 có planDay với exercises
- **Steps**:
  1. Load TrainingPlanView với today = T2
  2. Quan sát start-workout-btn
- **Expected Result**: Nút "Bắt đầu" visible (isViewingToday = true vì selectedDay null → viewedDay = todayDow = 1)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_137: Nút "Bắt đầu" hiển thị khi today = T3 và có workout
- **Pre-conditions**: Mock today = T3 (todayDow=2), T3 có planDay với exercises
- **Steps**:
  1. Load TrainingPlanView với today = T3
  2. Quan sát start-workout-btn
- **Expected Result**: Nút "Bắt đầu" visible (isViewingToday = true vì selectedDay null → viewedDay = todayDow = 2)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_138: Nút "Bắt đầu" hiển thị khi today = T4 và có workout
- **Pre-conditions**: Mock today = T4 (todayDow=3), T4 có planDay với exercises
- **Steps**:
  1. Load TrainingPlanView với today = T4
  2. Quan sát start-workout-btn
- **Expected Result**: Nút "Bắt đầu" visible (isViewingToday = true vì selectedDay null → viewedDay = todayDow = 3)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_139: Nút "Bắt đầu" hiển thị khi today = T5 và có workout
- **Pre-conditions**: Mock today = T5 (todayDow=4), T5 có planDay với exercises
- **Steps**:
  1. Load TrainingPlanView với today = T5
  2. Quan sát start-workout-btn
- **Expected Result**: Nút "Bắt đầu" visible (isViewingToday = true vì selectedDay null → viewedDay = todayDow = 4)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_140: Nút "Bắt đầu" hiển thị khi today = T6 và có workout
- **Pre-conditions**: Mock today = T6 (todayDow=5), T6 có planDay với exercises
- **Steps**:
  1. Load TrainingPlanView với today = T6
  2. Quan sát start-workout-btn
- **Expected Result**: Nút "Bắt đầu" visible (isViewingToday = true vì selectedDay null → viewedDay = todayDow = 5)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_141: Nút "Bắt đầu" hiển thị khi today = T7 và có workout
- **Pre-conditions**: Mock today = T7 (todayDow=6), T7 có planDay với exercises
- **Steps**:
  1. Load TrainingPlanView với today = T7
  2. Quan sát start-workout-btn
- **Expected Result**: Nút "Bắt đầu" visible (isViewingToday = true vì selectedDay null → viewedDay = todayDow = 6)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_142: Nút "Bắt đầu" hiển thị khi today = CN và có workout
- **Pre-conditions**: Mock today = CN (todayDow=7), CN có planDay với exercises
- **Steps**:
  1. Load TrainingPlanView với today = CN
  2. Quan sát start-workout-btn
- **Expected Result**: Nút "Bắt đầu" visible (isViewingToday = true vì selectedDay null → viewedDay = todayDow = 7)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_143: Nút "Bắt đầu" ẩn khi xem T3 (today = T4)
- **Pre-conditions**: Today = T4, đã click T3
- **Steps**:
  1. Click day-pill-2 (T3)
  2. Search DOM cho start-workout-btn
- **Expected Result**: Nút KHÔNG render (isViewingToday = false)
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_TPV_144: Nút "Bắt đầu" ẩn khi xem T6 (today = T2)
- **Pre-conditions**: Today = T2, đã click T6
- **Steps**:
  1. Click day-pill-5 (T6)
  2. Search DOM
- **Expected Result**: start-workout-btn KHÔNG tồn tại trong DOM
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_TPV_145: Nút "Bắt đầu" ẩn khi xem CN (today = T5)
- **Pre-conditions**: Today = T5, đã click CN
- **Steps**:
  1. Click day-pill-7 (CN)
- **Expected Result**: start-workout-btn KHÔNG render
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_TPV_146: Click "Bắt đầu" → pushPage gọi với đúng planDay data
- **Pre-conditions**: Today có workout, nút visible
- **Steps**:
  1. Click start-workout-btn
  2. Verify pushPage arguments
- **Expected Result**: pushPage gọi với {id: "workout-logger", component: "WorkoutLogger", props: {workoutPlanDay: viewedPlanDay}}
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_147: Nút "Bắt đầu" có Play icon
- **Pre-conditions**: Today có workout, nút visible
- **Steps**:
  1. Inspect start-workout-btn
- **Expected Result**: Play icon (h-5 w-5, aria-hidden="true") hiển thị bên cạnh text
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_148: Nút "Bắt đầu" styling emerald
- **Pre-conditions**: Today có workout
- **Steps**:
  1. Inspect button classes
- **Expected Result**: Button có bg-emerald-500 text-white font-bold rounded-xl, hover:bg-emerald-600 active:scale-[0.98]
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_149: StreakCounter render ở đầu trang với active plan
- **Pre-conditions**: Có active training plan
- **Steps**:
  1. Mở TrainingPlanView
  2. Quan sát element đầu trang trước calendar strip
- **Expected Result**: StreakCounter component visible ở top, trước calendar-strip div
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_150: DailyWeightInput render ở cuối trang với active plan
- **Pre-conditions**: Có active training plan
- **Steps**:
  1. Scroll xuống cuối TrainingPlanView
- **Expected Result**: DailyWeightInput component visible sau workout/rest card
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_151: StreakCounter và DailyWeightInput cùng visible
- **Pre-conditions**: Có active plan, đang xem today
- **Steps**:
  1. Quan sát full page layout
- **Expected Result**: Cả StreakCounter (top) và DailyWeightInput (bottom) đều render trong DOM
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_152: No-plan state: StreakCounter KHÔNG hiển thị
- **Pre-conditions**: Không có active plan
- **Steps**:
  1. Load TrainingPlanView
  2. Inspect DOM
- **Expected Result**: StreakCounter KHÔNG render (no-plan CTA return sớm, không render streak/calendar)
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_TPV_153: No-plan state: DailyWeightInput KHÔNG hiển thị
- **Pre-conditions**: Không có active plan
- **Steps**:
  1. Inspect DOM cho DailyWeightInput
- **Expected Result**: DailyWeightInput KHÔNG render trong no-plan state
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_TPV_154: No-plan state: Calendar strip KHÔNG hiển thị
- **Pre-conditions**: Không có active plan
- **Steps**:
  1. Inspect DOM cho calendar-strip
- **Expected Result**: calendar-strip KHÔNG render, chỉ có no-plan CTA
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_TPV_155: StreakCounter position: DOM order trước calendar
- **Pre-conditions**: Có active plan
- **Steps**:
  1. Inspect DOM tree order
- **Expected Result**: StreakCounter element xuất hiện trước calendar-strip trong DOM order
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_156: DailyWeightInput position: DOM order sau card
- **Pre-conditions**: Có active plan
- **Steps**:
  1. Inspect DOM tree order
- **Expected Result**: DailyWeightInput element xuất hiện sau workout-card/rest-day-card trong DOM
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_157: parseExercises: valid JSON array → exercises đúng
- **Pre-conditions**: planDay.exercises = '[{"exercise":{"id":"ex1","nameVi":"Gánh"},"sets":3,"restSeconds":90}]'
- **Steps**:
  1. Load plan view
- **Expected Result**: parseExercises trả về array 1 element, exercise nameVi="Gánh" hiển thị
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_158: parseExercises: invalid JSON "{bad" → empty array
- **Pre-conditions**: planDay.exercises = "{bad"
- **Steps**:
  1. Load plan view
  2. Kiểm tra Console cho errors
- **Expected Result**: parseExercises trả về [], exercise list trống, KHÔNG crash, KHÔNG unhandled error
- **Priority**: P0 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_TPV_159: parseExercises: null → empty array
- **Pre-conditions**: planDay.exercises = null
- **Steps**:
  1. Load plan view
- **Expected Result**: parseExercises nhận null → check !exercises → return [], list trống
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_TPV_160: parseExercises: undefined → empty array
- **Pre-conditions**: planDay.exercises không tồn tại (undefined)
- **Steps**:
  1. Load plan view
- **Expected Result**: parseExercises nhận undefined → check !exercises → return []
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_TPV_161: parseExercises: empty string "" → empty array
- **Pre-conditions**: planDay.exercises = ""
- **Steps**:
  1. Load plan view
- **Expected Result**: parseExercises nhận "" → check !exercises (falsy) → return []
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_TPV_162: parseExercises: "[]" → empty array
- **Pre-conditions**: planDay.exercises = "[]"
- **Steps**:
  1. Load plan view
- **Expected Result**: JSON.parse("[]") = [], exercise list trống nhưng parse thành công
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_TPV_163: parseExercises: malformed JSON "}" → empty array
- **Pre-conditions**: planDay.exercises = "}"
- **Steps**:
  1. Load plan view
  2. Kiểm tra Console
- **Expected Result**: try-catch bắt SyntaxError, trả về [], KHÔNG crash
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_TPV_164: estimateDuration: 0 exercises → 0
- **Pre-conditions**: viewedExercises = []
- **Steps**:
  1. Verify estimateDuration output
- **Expected Result**: estimateDuration([]) → exercises.length === 0 → return 0
- **Priority**: P1 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_TPV_165: estimateDuration: 1 exercise (2 sets, 90s rest)
- **Pre-conditions**: Exercise: sets=2, restSeconds=90
- **Steps**:
  1. Tính: (2×(30+90))/60 + 5 = 4 + 5 = 9
  2. Verify UI
- **Expected Result**: Duration = Math.round(240/60) + 5 = 9 phút
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_166: estimateDuration: large set (10 exercises, 5 sets each, 120s rest)
- **Pre-conditions**: 10 exercises mỗi ex 5 sets × (30+120)
- **Steps**:
  1. Tính: 10×(5×150)/60 + 5 = 125 + 5 = 130
  2. Verify UI
- **Expected Result**: Duration = 130 phút (long workout), hiển thị đúng
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_TPV_167: todayDow: Sunday (getDay()=0) → mapped to 7
- **Pre-conditions**: System date = Chủ nhật
- **Steps**:
  1. getTodayDow() → jsDay=0 → return 7
  2. Verify today pill = CN
- **Expected Result**: todayDow = 7, day-pill-7 (CN) có ring emerald và aria-current="date"
- **Priority**: P0 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_TPV_168: todayDow: Monday (getDay()=1) → stays 1
- **Pre-conditions**: System date = Thứ Hai
- **Steps**:
  1. getTodayDow() → jsDay=1 → return 1
- **Expected Result**: todayDow = 1, day-pill-1 (T2) có ring emerald
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_169: tomorrowDow: todayDow=7 (Sunday) → returns 1
- **Pre-conditions**: todayDow = 7
- **Steps**:
  1. getTomorrowDow(7) → 7===7 ? 1 : 8 → return 1
- **Expected Result**: tomorrowDow = 1 (T2), wrap-around hoạt động đúng
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_TPV_170: tomorrowDow: todayDow=6 (Saturday) → returns 7
- **Pre-conditions**: todayDow = 6
- **Steps**:
  1. getTomorrowDow(6) → 6===7 ? 1 : 7 → return 7
- **Expected Result**: tomorrowDow = 7 (CN)
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_171: tomorrowDow: todayDow=1 (Monday) → returns 2
- **Pre-conditions**: todayDow = 1
- **Steps**:
  1. getTomorrowDow(1) → 1===7 ? 1 : 2 → return 2
- **Expected Result**: tomorrowDow = 2 (T3)
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_172: Plan day without exercises field
- **Pre-conditions**: planDay tồn tại nhưng KHÔNG có key exercises
- **Steps**:
  1. Load plan view cho ngày đó
- **Expected Result**: parseExercises(undefined) → [], workout card hiển thị nhưng exercise list rỗng
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_TPV_173: Plan day with empty muscleGroups string
- **Pre-conditions**: planDay.muscleGroups = ""
- **Steps**:
  1. Load plan view
  2. Inspect muscle groups area
- **Expected Result**: muscleGroups "" là falsy → paragraph KHÔNG render (conditional check truthy)
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_TPV_174: Multiple plans: chỉ active plan data hiển thị
- **Pre-conditions**: trainingPlans: [{id:"p1",status:"completed"}, {id:"p2",status:"active"}, {id:"p3",status:"draft"}]
- **Steps**:
  1. Load TrainingPlanView
- **Expected Result**: activePlan = p2, planDays filter theo p2.id, chỉ data p2 hiển thị
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_175: ViewedDay defaults to todayDow khi selectedDay null
- **Pre-conditions**: Vừa mount component, selectedDay = null
- **Steps**:
  1. Quan sát viewedDay computation
- **Expected Result**: viewedDay = selectedDay ?? todayDow = todayDow, nội dung hiển thị ngày hôm nay
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_176: Strength day pill: emerald-100 bg, emerald-700 text (light mode)
- **Pre-conditions**: Day có workoutType không chứa "cardio"
- **Steps**:
  1. Inspect day pill classes
- **Expected Result**: bg-emerald-100 text-emerald-700 applied
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_177: Cardio day pill: blue-100 bg, blue-700 text (light mode)
- **Pre-conditions**: Day có workoutType.toLowerCase().includes("cardio")
- **Steps**:
  1. Inspect day pill classes
- **Expected Result**: bg-blue-100 text-blue-700 applied (isCardio = true)
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_178: No-plan day pill: slate-100 bg, slate-500 text (light mode)
- **Pre-conditions**: Day KHÔNG có planDay
- **Steps**:
  1. Inspect day pill classes
- **Expected Result**: bg-slate-100 text-slate-500 applied (default colorClass)
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_179: Dark mode: strength pill dark:bg-emerald-900/50 dark:text-emerald-300
- **Pre-conditions**: Dark mode enabled, day có strength workout
- **Steps**:
  1. Inspect day pill classes trong dark mode
- **Expected Result**: Dark mode classes applied: dark:bg-emerald-900/50 dark:text-emerald-300
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_180: Dark mode: cardio pill dark:bg-blue-900/50 dark:text-blue-300
- **Pre-conditions**: Dark mode enabled, day có cardio workout
- **Steps**:
  1. Inspect day pill trong dark mode
- **Expected Result**: dark:bg-blue-900/50 dark:text-blue-300 applied
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_181: Dark mode: no-plan pill dark:bg-slate-700 dark:text-slate-400
- **Pre-conditions**: Dark mode enabled, day không có planDay
- **Steps**:
  1. Inspect day pill
- **Expected Result**: dark:bg-slate-700 dark:text-slate-400 applied
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_182: Dark mode: workout card background dark:bg-slate-800
- **Pre-conditions**: Dark mode enabled, ngày có workout
- **Steps**:
  1. Inspect today-workout-card
- **Expected Result**: Card có dark:bg-slate-800 dark:border-slate-700, text dark:text-slate-100
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_183: Dark mode: rest day gradient vẫn hiển thị
- **Pre-conditions**: Dark mode enabled, ngày nghỉ
- **Steps**:
  1. Inspect rest day card
- **Expected Result**: Gradient from-teal-500 to-blue-500 không bị override trong dark mode
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_184: Dark mode: text contrast đủ đọc
- **Pre-conditions**: Dark mode enabled, có active plan
- **Steps**:
  1. Scan tất cả text elements
- **Expected Result**: Tất cả text có contrast ratio ≥ 4.5:1 (WCAG AA) với dark background
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_185: Dark mode: start workout button visible
- **Pre-conditions**: Dark mode enabled, today có workout
- **Steps**:
  1. Inspect start-workout-btn
- **Expected Result**: Button bg-emerald-500 text-white visible và readable trong dark mode
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_186: aria-current="date" chỉ trên today pill
- **Pre-conditions**: Có active plan, today = T4
- **Steps**:
  1. Inspect tất cả 7 day pills
- **Expected Result**: Chỉ day-pill-3 (T4) có aria-current="date", 6 pills còn lại KHÔNG có attribute này
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_187: Non-today pills: KHÔNG có aria-current
- **Pre-conditions**: Có active plan
- **Steps**:
  1. Query DOM: [aria-current="date"]
- **Expected Result**: Chỉ 1 element match (today pill), tất cả non-today pills KHÔNG có aria-current
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_188: data-testid present trên tất cả interactive elements
- **Pre-conditions**: Có active plan
- **Steps**:
  1. Verify data-testid trên: training-plan-view, calendar-strip, day-pill-1 đến 7, today-workout-card, start-workout-btn, rest-day-card, quick-actions, etc.
- **Expected Result**: Tất cả elements cần thiết có data-testid attribute cho testing
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_189: Keyboard navigation: Tab qua day pills
- **Pre-conditions**: Có active plan
- **Steps**:
  1. Focus vào day-pill-1
  2. Nhấn Tab liên tục
- **Expected Result**: Focus di chuyển qua từng day pill theo thứ tự T2→T3→...→CN, tất cả focusable
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_190: Keyboard: Enter/Space chọn day
- **Pre-conditions**: Focus trên day pill T5
- **Steps**:
  1. Nhấn Enter hoặc Space
- **Expected Result**: Day T5 được chọn (tương đương click), nội dung cập nhật
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_191: Screen reader: day labels được announce
- **Pre-conditions**: Screen reader active, focus trên day pills
- **Steps**:
  1. Navigate qua day pills
- **Expected Result**: Screen reader đọc label T2, T3, etc. khi focus (button text content)
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_192: Screen reader: workout type được announce
- **Pre-conditions**: Focus trên workout card
- **Steps**:
  1. Navigate đến heading
- **Expected Result**: H3 heading text (workout type) được screen reader đọc
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_193: Exercise list semantic (ul/li)
- **Pre-conditions**: Có exercises hiển thị
- **Steps**:
  1. Inspect exercise-list element
- **Expected Result**: data-testid="exercise-list" là ul element, mỗi exercise là li element (semantic HTML)
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_194: Start workout button accessible label
- **Pre-conditions**: Today có workout, nút visible
- **Steps**:
  1. Inspect start-workout-btn accessible name
- **Expected Result**: Button có text content đủ để screen reader announce (t("fitness.plan.startWorkout"))
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_195: CTA button accessible (no-plan state)
- **Pre-conditions**: No active plan, CTA hiển thị
- **Steps**:
  1. Inspect create-plan-btn
- **Expected Result**: Button text + ChevronRight (aria-hidden) → screen reader đọc chỉ text, icon bị ẩn
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_196: Decorative icons có aria-hidden="true"
- **Pre-conditions**: Có active plan
- **Steps**:
  1. Inspect tất cả icon elements (Calendar, Play, Moon, Dumbbell, ChevronRight)
- **Expected Result**: Tất cả decorative icons có aria-hidden="true" attribute
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_197: Today indicator không chỉ dựa vào color
- **Pre-conditions**: Có active plan
- **Steps**:
  1. So sánh today pill với non-today pill
- **Expected Result**: Today pill có ring (visual indicator bổ sung ngoài color) + aria-current="date" (programmatic)
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_198: Calendar strip role và accessibility
- **Pre-conditions**: Có active plan
- **Steps**:
  1. Inspect calendar-strip container
  2. Verify button roles
- **Expected Result**: Mỗi day pill là button element, accessible cho keyboard và screen reader navigation
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_199: Rapid day selection 20 lần → không crash
- **Pre-conditions**: Có active plan
- **Steps**:
  1. Click nhanh qua 7 day pills, lặp ~3 rounds trong < 3 giây
- **Expected Result**: Không crash, không JS error, cuối cùng day đúng selected
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_TPV_200: Select tất cả 7 ngày nhanh liên tục
- **Pre-conditions**: Có active plan
- **Steps**:
  1. Click T2, T3, T4, T5, T6, T7, CN nhanh trong < 2 giây
- **Expected Result**: State cập nhật đúng cho ngày cuối cùng clicked (CN), nội dung hiển thị CN
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_TPV_201: Switch giữa workout và rest days nhanh
- **Pre-conditions**: Active plan: T2 workout, T3 rest, T4 workout, T5 rest
- **Steps**:
  1. Click T2, T3, T4, T5 nhanh liên tục
- **Expected Result**: UI chuyển đúng giữa workout card ↔ rest day card mỗi lần, không flicker lỗi
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_TPV_202: React.memo optimization: không re-render không cần thiết
- **Pre-conditions**: React DevTools Profiler enabled
- **Steps**:
  1. Mount TrainingPlanView
  2. Trigger unrelated parent re-render
- **Expected Result**: TrainingPlanView (wrapped memo) không re-render nếu props không đổi
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_TPV_203: Large plan: 7 ngày × 10+ exercises mỗi ngày
- **Pre-conditions**: Active plan, tất cả 7 ngày có 10-15 exercises
- **Steps**:
  1. Load TrainingPlanView
  2. Click qua từng ngày
- **Expected Result**: Performance acceptable, không lag, exercise lists render đầy đủ
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_TPV_204: Calendar strip overflow: 7 pills vừa 1 hàng
- **Pre-conditions**: Active plan, screen width 320px (iPhone SE)
- **Steps**:
  1. Load TrainingPlanView trên narrow screen
- **Expected Result**: 7 day pills flex-1 vừa 1 hàng, text T2-CN vẫn đọc được, không overflow
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_TPV_205: Long exercise names không break layout
- **Pre-conditions**: Exercise nameVi 60+ ký tự
- **Steps**:
  1. Load plan view với long exercise names
- **Expected Result**: Exercise list items wrap text đúng, không overflow card container
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_TPV_206: Multiple plans store, switching active plan
- **Pre-conditions**: Ban đầu plan A active, sau đó switch plan B active
- **Steps**:
  1. Load với plan A → verify data A
  2. Switch plan B active → verify data B
- **Expected Result**: TrainingPlanView re-render với planDays của plan B, calendar strip cập nhật
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_TPV_207: Empty trainingPlanDays array
- **Pre-conditions**: Active plan tồn tại nhưng trainingPlanDays = []
- **Steps**:
  1. Load TrainingPlanView
- **Expected Result**: planDays = [] (filter returns nothing), tất cả 7 ngày hiển thị rest day
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_TPV_208: Empty trainingPlans array
- **Pre-conditions**: trainingPlans = []
- **Steps**:
  1. Load TrainingPlanView
- **Expected Result**: activePlan = undefined, no-plan CTA hiển thị
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_TPV_209: Plan day với very large exercise JSON (10KB+)
- **Pre-conditions**: planDay.exercises chứa JSON 50+ exercises (~10KB)
- **Steps**:
  1. Load plan view cho ngày đó
- **Expected Result**: JSON parse thành công, 50 exercises render, performance acceptable
- **Priority**: P3 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_TPV_210: Memory: không leak sau 50 day switches
- **Pre-conditions**: Có active plan
- **Steps**:
  1. Click qua 7 ngày, lặp lại 7 rounds (49 clicks)
  2. Monitor memory trong DevTools
- **Expected Result**: Heap memory không tăng đáng kể, không có detached DOM nodes tích lũy
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |
