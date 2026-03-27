# Scenario 25: Fitness Tab & Onboarding

**Version:** 2.0  
**Date:** 2026-03-26  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Fitness Tab & Onboarding là scenario cốt lõi của module Fitness trong ứng dụng Smart Meal Planner. Khi user chưa hoàn thành onboarding (isOnboarded=false), hệ thống hiển thị form FitnessOnboarding thay vì giao diện chính. Form onboarding thu thập thông tin training profile gồm: mục tiêu tập (strength/hypertrophy/endurance/general), kinh nghiệm (beginner/intermediate/advanced), số ngày tập/tuần, và các tùy chọn nâng cao (thiết bị, chấn thương, periodization, 1RM, giờ ngủ). Các trường nâng cao hiển thị có điều kiện theo experience level: intermediate+ thấy periodization/cycle weeks/priority muscles, advanced thấy thêm known 1RM và avg sleep.

Sau khi onboarding hoàn tất, FitnessTab hiển thị 4 sub-tabs: Kế hoạch (plan), Tập luyện (workout), Lịch sử (history), Tiến trình (progress). Tab "Tập luyện" có thêm toggle chế độ Strength/Cardio qua radiogroup. Component sử dụng React.memo để tối ưu render, lazy rendering cho inactive tabs (chỉ render tab đang active), và Zustand store (useFitnessStore) để persist trạng thái onboarding.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| FitnessTab | FitnessTab.tsx | Container chính cho tab Fitness, điều phối sub-tabs |
| FitnessOnboarding | FitnessOnboarding.tsx | Form onboarding thu thập training profile |
| SubTabBar | (shared) | Render sub-tab navigation pills |
| TrainingPlanView | TrainingPlanView.tsx | Nội dung tab "Kế hoạch" |
| WorkoutLogger | WorkoutLogger.tsx | Nội dung tab "Tập luyện" (strength mode) |
| CardioLogger | CardioLogger.tsx | Nội dung tab "Tập luyện" (cardio mode) |
| WorkoutHistory | WorkoutHistory.tsx | Nội dung tab "Lịch sử" |
| StreakCounter | StreakCounter.tsx | Streak display trong tab "Tiến trình" |
| ProgressDashboard | ProgressDashboard.tsx | Dashboard tiến trình tập luyện |
| useFitnessStore | fitnessStore.ts | Zustand store: isOnboarded, setOnboarded, setTrainingProfile |
| useTranslation | i18n | Hook i18n cho đa ngôn ngữ |

## Luồng nghiệp vụ

1. Mở app → chuyển tab Fitness → kiểm tra isOnboarded từ store
2. Nếu chưa onboarded → hiển thị FitnessOnboarding form
3. User chọn goal (strength/hypertrophy/endurance/general) → chọn experience → chọn days/week
4. (Tùy chọn) Expand "Tùy chỉnh" → cấu hình session duration, equipment, injuries, cardio sessions
5. (Intermediate+) Hiển thị thêm periodization, cycle weeks, priority muscles (tối đa 3)
6. (Advanced) Hiển thị thêm known 1RM (squat/bench/deadlift/ohp), avg sleep hours
7. Submit form → tạo TrainingProfile → setTrainingProfile + setOnboarded(true)
8. Hiển thị FitnessTab chính với 4 sub-tabs, mặc định tab "Kế hoạch"
9. Click sub-tab → switch nội dung, chỉ render tab active (lazy)
10. Tab "Tập luyện" → hiển thị mode selector (Strength ↔ Cardio)

## Quy tắc nghiệp vụ

1. isOnboarded = false → chỉ render FitnessOnboarding, ẩn toàn bộ sub-tabs
2. isOnboarded = true → render SubTabBar + nội dung tab active
3. Default activeSubTab = 'plan' (Kế hoạch)
4. Default workoutMode = 'strength'
5. Default goal = 'hypertrophy', experience = 'beginner', daysPerWeek = 3
6. Priority muscles tối đa 3 (MAX_PRIORITY_MUSCLES = 3)
7. Known 1RM phải > 0, loại bỏ giá trị NaN hoặc ≤ 0
8. Equipment và injuries là multi-select (toggle on/off)
9. Periodization/cycle weeks/priority muscles chỉ hiển thị khi experience ≥ intermediate
10. Known 1RM/avg sleep chỉ hiển thị khi experience = advanced
11. Profile ID tạo bằng crypto.randomUUID()
12. Workout mode toggle sử dụng role="radiogroup" với aria-checked
13. Tab panels sử dụng role="tabpanel" với id tương ứng
14. FitnessTab wrapped trong React.memo để tránh re-render không cần thiết

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_FIT_001 | Hiển thị onboarding khi chưa có profile | Positive | P0 |
| TC_FIT_002 | Hiển thị tabs khi đã có profile | Positive | P0 |
| TC_FIT_003 | Default tab là "Kế hoạch" sau onboarding | Positive | P0 |
| TC_FIT_004 | Chuyển giữa 4 sub-tabs | Positive | P1 |
| TC_FIT_005 | Tab "Tập luyện" hiển thị mode selector | Positive | P1 |
| TC_FIT_006 | Toggle Strength ↔ Cardio mode | Positive | P1 |
| TC_FIT_007 | Onboarding form: chọn goal | Positive | P1 |
| TC_FIT_008 | Onboarding form: chọn experience level | Positive | P1 |
| TC_FIT_009 | Onboarding form: chọn days per week | Positive | P1 |
| TC_FIT_010 | Expand/collapse tùy chỉnh nâng cao | Positive | P1 |
| TC_FIT_011 | Multi-select equipment | Positive | P1 |
| TC_FIT_012 | Multi-select injuries | Positive | P1 |
| TC_FIT_013 | Submit form tạo profile thành công | Positive | P0 |
| TC_FIT_014 | Trường intermediate+ hiển thị đúng điều kiện | Positive | P1 |
| TC_FIT_015 | Trường advanced hiển thị đúng điều kiện | Positive | P1 |
| TC_FIT_016 | Priority muscles giới hạn tối đa 3 | Boundary | P1 |
| TC_FIT_017 | Known 1RM validation: số dương | Positive | P1 |
| TC_FIT_018 | Known 1RM validation: giá trị âm bị loại | Negative | P1 |
| TC_FIT_019 | Known 1RM validation: giá trị NaN bị loại | Negative | P1 |
| TC_FIT_020 | Avg sleep hours nhập hợp lệ | Positive | P2 |
| TC_FIT_021 | Aria-checked cập nhật khi chọn goal | Positive | P2 |
| TC_FIT_022 | Aria-checked cập nhật khi chọn experience | Positive | P2 |
| TC_FIT_023 | Aria-expanded toggle trên nút tùy chỉnh | Positive | P2 |
| TC_FIT_024 | Role="radiogroup" trên goal selector | Positive | P2 |
| TC_FIT_025 | Role="radiogroup" trên experience selector | Positive | P2 |
| TC_FIT_026 | Role="radiogroup" trên days selector | Positive | P2 |
| TC_FIT_027 | Role="tabpanel" trên mỗi tab content | Positive | P2 |
| TC_FIT_028 | Workout mode aria-checked cập nhật | Positive | P2 |
| TC_FIT_029 | Lazy rendering: tab inactive không render DOM | Positive | P1 |
| TC_FIT_030 | React.memo: không re-render khi props không đổi | Positive | P2 |
| TC_FIT_031 | Beginner: không thấy intermediate fields | Negative | P1 |
| TC_FIT_032 | Beginner: không thấy advanced fields | Negative | P1 |
| TC_FIT_033 | Intermediate: thấy intermediate fields, không thấy advanced | Positive | P1 |
| TC_FIT_034 | Equipment toggle: select rồi deselect | Positive | P2 |
| TC_FIT_035 | Injury toggle: select rồi deselect | Positive | P2 |
| TC_FIT_036 | Priority muscle toggle: select rồi deselect | Positive | P2 |
| TC_FIT_037 | Chọn tất cả equipment (6/6) | Boundary | P2 |
| TC_FIT_038 | Chọn tất cả injuries (6/6) | Boundary | P2 |
| TC_FIT_039 | Chọn 4th priority muscle — bị chặn | Boundary | P1 |
| TC_FIT_040 | Days per week: giá trị min (2) | Boundary | P2 |
| TC_FIT_041 | Days per week: giá trị max (6) | Boundary | P2 |
| TC_FIT_042 | Session duration: tất cả options (30/45/60/90) | Positive | P2 |
| TC_FIT_043 | Cardio sessions: range 0-5 | Boundary | P2 |
| TC_FIT_044 | Periodization: chọn từng option | Positive | P2 |
| TC_FIT_045 | Cycle weeks: tất cả options (4/6/8/12) | Positive | P2 |
| TC_FIT_046 | Known 1RM: nhập 0 — bị loại bỏ | Boundary | P1 |
| TC_FIT_047 | Known 1RM: nhập text "abc" — bị loại bỏ | Negative | P1 |
| TC_FIT_048 | Avg sleep: nhập step 0.5 | Positive | P2 |
| TC_FIT_049 | Submit với tất cả optional fields trống | Positive | P1 |
| TC_FIT_050 | Submit với tất cả optional fields đầy đủ | Positive | P1 |
| TC_FIT_051 | Profile persist sau reload | Positive | P0 |
| TC_FIT_052 | Tab switch rapid 20 lần — không crash | Edge | P2 |
| TC_FIT_053 | Dark mode: onboarding đúng colors | Positive | P2 |
| TC_FIT_054 | i18n: labels cập nhật khi đổi ngôn ngữ | Positive | P2 |
| TC_FIT_055 | onComplete callback được gọi sau submit | Positive | P1 |
| TC_FIT_056 | Combination: goal=strength, experience=beginner, days=2 → submit thành công | Edge | P3 |
| TC_FIT_057 | Combination: goal=strength, experience=beginner, days=3 → submit thành công | Negative | P2 |
| TC_FIT_058 | Combination: goal=strength, experience=beginner, days=4 → submit thành công | Negative | P1 |
| TC_FIT_059 | Combination: goal=strength, experience=beginner, days=5 → submit thành công | Negative | P0 |
| TC_FIT_060 | Combination: goal=strength, experience=beginner, days=6 → submit thành công | Negative | P3 |
| TC_FIT_061 | Combination: goal=strength, experience=intermediate, days=2 → submit thành công | Edge | P3 |
| TC_FIT_062 | Combination: goal=strength, experience=intermediate, days=3 → submit thành công | Negative | P2 |
| TC_FIT_063 | Combination: goal=strength, experience=intermediate, days=4 → submit thành công | Negative | P1 |
| TC_FIT_064 | Combination: goal=strength, experience=intermediate, days=5 → submit thành công | Negative | P2 |
| TC_FIT_065 | Combination: goal=strength, experience=intermediate, days=6 → submit thành công | Boundary | P3 |
| TC_FIT_066 | Combination: goal=strength, experience=advanced, days=2 → submit thành công | Edge | P3 |
| TC_FIT_067 | Combination: goal=strength, experience=advanced, days=3 → submit thành công | Edge | P2 |
| TC_FIT_068 | Combination: goal=strength, experience=advanced, days=4 → submit thành công | Edge | P2 |
| TC_FIT_069 | Combination: goal=strength, experience=advanced, days=5 → submit thành công | Negative | P0 |
| TC_FIT_070 | Combination: goal=strength, experience=advanced, days=6 → submit thành công | Boundary | P3 |
| TC_FIT_071 | Combination: goal=hypertrophy, experience=beginner, days=2 → submit thành công | Edge | P3 |
| TC_FIT_072 | Combination: goal=hypertrophy, experience=beginner, days=3 → submit thành công | Positive | P2 |
| TC_FIT_073 | Combination: goal=hypertrophy, experience=beginner, days=4 → submit thành công | Positive | P1 |
| TC_FIT_074 | Combination: goal=hypertrophy, experience=beginner, days=5 → submit thành công | Negative | P2 |
| TC_FIT_075 | Combination: goal=hypertrophy, experience=beginner, days=6 → submit thành công | Boundary | P3 |
| TC_FIT_076 | Combination: goal=hypertrophy, experience=intermediate, days=2 → submit thành công | Edge | P0 |
| TC_FIT_077 | Combination: goal=hypertrophy, experience=intermediate, days=3 → submit thành công | Negative | P2 |
| TC_FIT_078 | Combination: goal=hypertrophy, experience=intermediate, days=4 → submit thành công | Negative | P1 |
| TC_FIT_079 | Combination: goal=hypertrophy, experience=intermediate, days=5 → submit thành công | Positive | P2 |
| TC_FIT_080 | Combination: goal=hypertrophy, experience=intermediate, days=6 → submit thành công | Negative | P3 |
| TC_FIT_081 | Combination: goal=hypertrophy, experience=advanced, days=2 → submit thành công | Edge | P3 |
| TC_FIT_082 | Combination: goal=hypertrophy, experience=advanced, days=3 → submit thành công | Edge | P0 |
| TC_FIT_083 | Combination: goal=hypertrophy, experience=advanced, days=4 → submit thành công | Edge | P2 |
| TC_FIT_084 | Combination: goal=hypertrophy, experience=advanced, days=5 → submit thành công | Negative | P0 |
| TC_FIT_085 | Combination: goal=hypertrophy, experience=advanced, days=6 → submit thành công | Boundary | P3 |
| TC_FIT_086 | Combination: goal=endurance, experience=beginner, days=2 → submit thành công | Edge | P3 |
| TC_FIT_087 | Combination: goal=endurance, experience=beginner, days=3 → submit thành công | Positive | P2 |
| TC_FIT_088 | Combination: goal=endurance, experience=beginner, days=4 → submit thành công | Positive | P1 |
| TC_FIT_089 | Combination: goal=endurance, experience=beginner, days=5 → submit thành công | Negative | P2 |
| TC_FIT_090 | Combination: goal=endurance, experience=beginner, days=6 → submit thành công | Edge | P3 |
| TC_FIT_091 | Combination: goal=endurance, experience=intermediate, days=2 → submit thành công | Edge | P3 |
| TC_FIT_092 | Combination: goal=endurance, experience=intermediate, days=3 → submit thành công | Edge | P2 |
| TC_FIT_093 | Combination: goal=endurance, experience=intermediate, days=4 → submit thành công | Positive | P1 |
| TC_FIT_094 | Combination: goal=endurance, experience=intermediate, days=5 → submit thành công | Negative | P2 |
| TC_FIT_095 | Combination: goal=endurance, experience=intermediate, days=6 → submit thành công | Boundary | P3 |
| TC_FIT_096 | Combination: goal=endurance, experience=advanced, days=2 → submit thành công | Boundary | P0 |
| TC_FIT_097 | Combination: goal=endurance, experience=advanced, days=3 → submit thành công | Negative | P2 |
| TC_FIT_098 | Combination: goal=endurance, experience=advanced, days=4 → submit thành công | Negative | P2 |
| TC_FIT_099 | Combination: goal=endurance, experience=advanced, days=5 → submit thành công | Negative | P0 |
| TC_FIT_100 | Combination: goal=endurance, experience=advanced, days=6 → submit thành công | Negative | P3 |
| TC_FIT_101 | Combination: goal=general, experience=beginner, days=2 → submit thành công | Edge | P3 |
| TC_FIT_102 | Combination: goal=general, experience=beginner, days=3 → submit thành công | Positive | P2 |
| TC_FIT_103 | Combination: goal=general, experience=beginner, days=4 → submit thành công | Positive | P1 |
| TC_FIT_104 | Combination: goal=general, experience=beginner, days=5 → submit thành công | Negative | P2 |
| TC_FIT_105 | Combination: goal=general, experience=beginner, days=6 → submit thành công | Boundary | P3 |
| TC_FIT_106 | Combination: goal=general, experience=intermediate, days=2 → submit thành công | Boundary | P0 |
| TC_FIT_107 | Combination: goal=general, experience=intermediate, days=3 → submit thành công | Negative | P2 |
| TC_FIT_108 | Combination: goal=general, experience=intermediate, days=4 → submit thành công | Negative | P1 |
| TC_FIT_109 | Combination: goal=general, experience=intermediate, days=5 → submit thành công | Negative | P2 |
| TC_FIT_110 | Combination: goal=general, experience=intermediate, days=6 → submit thành công | Edge | P3 |
| TC_FIT_111 | Combination: goal=general, experience=advanced, days=2 → submit thành công | Edge | P0 |
| TC_FIT_112 | Combination: goal=general, experience=advanced, days=3 → submit thành công | Edge | P2 |
| TC_FIT_113 | Combination: goal=general, experience=advanced, days=4 → submit thành công | Edge | P1 |
| TC_FIT_114 | Combination: goal=general, experience=advanced, days=5 → submit thành công | Negative | P0 |
| TC_FIT_115 | Combination: goal=general, experience=advanced, days=6 → submit thành công | Boundary | P3 |
| TC_FIT_116 | Equipment đơn lẻ: chỉ chọn barbell (Thanh tạ) | Edge | P2 |
| TC_FIT_117 | Equipment đơn lẻ: chỉ chọn dumbbell (Tạ tay) | Positive | P2 |
| TC_FIT_118 | Equipment đơn lẻ: chỉ chọn machine (Máy tập) | Positive | P2 |
| TC_FIT_119 | Equipment đơn lẻ: chỉ chọn cable (Cáp kéo) | Positive | P2 |
| TC_FIT_120 | Equipment đơn lẻ: chỉ chọn bodyweight (Tự trọng) | Positive | P2 |
| TC_FIT_121 | Equipment đơn lẻ: chỉ chọn bands (Dây kháng lực) | Positive | P2 |
| TC_FIT_122 | Equipment cặp: barbell + dumbbell | Edge | P3 |
| TC_FIT_123 | Equipment cặp: dumbbell + machine | Edge | P3 |
| TC_FIT_124 | Equipment cặp: machine + cable | Edge | P3 |
| TC_FIT_125 | Equipment cặp: cable + bodyweight | Edge | P3 |
| TC_FIT_126 | Equipment cặp: bodyweight + bands | Edge | P3 |
| TC_FIT_127 | Equipment cặp: barbell + bands | Edge | P3 |
| TC_FIT_128 | Equipment bộ ba: barbell + dumbbell + machine | Edge | P3 |
| TC_FIT_129 | Equipment bộ ba: cable + bodyweight + bands | Edge | P3 |
| TC_FIT_130 | Equipment bộ ba: barbell + cable + bodyweight | Edge | P3 |
| TC_FIT_131 | Equipment bộ ba: dumbbell + machine + bands | Edge | P3 |
| TC_FIT_132 | Equipment tất cả trừ barbell (Thanh tạ) | Negative | P3 |
| TC_FIT_133 | Equipment tất cả trừ dumbbell (Tạ tay) | Negative | P3 |
| TC_FIT_134 | Equipment tất cả trừ machine (Máy tập) | Negative | P3 |
| TC_FIT_135 | Equipment tất cả trừ cable (Cáp kéo) | Negative | P3 |
| TC_FIT_136 | Injury đơn lẻ: chỉ chọn shoulders (Vai) | Edge | P2 |
| TC_FIT_137 | Injury đơn lẻ: chỉ chọn lower_back (Lưng dưới) | Positive | P2 |
| TC_FIT_138 | Injury đơn lẻ: chỉ chọn knees (Đầu gối) | Positive | P2 |
| TC_FIT_139 | Injury đơn lẻ: chỉ chọn wrists (Cổ tay) | Positive | P2 |
| TC_FIT_140 | Injury đơn lẻ: chỉ chọn neck (Cổ) | Positive | P2 |
| TC_FIT_141 | Injury đơn lẻ: chỉ chọn hips (Hông) | Positive | P2 |
| TC_FIT_142 | Injury nhiều vùng: chọn vai và đầu gối | Edge | P2 |
| TC_FIT_143 | Injury nhiều vùng: chọn lưng dưới, cổ tay và hông | Edge | P2 |
| TC_FIT_144 | Injury nhiều vùng: chọn tất cả 6 vùng | Edge | P2 |
| TC_FIT_145 | Injury chọn tất cả rồi deselect vai | Negative | P3 |
| TC_FIT_146 | Injury chọn tất cả rồi deselect đầu gối và hông | Negative | P3 |
| TC_FIT_147 | Injury chọn tất cả rồi deselect tất cả | Negative | P3 |
| TC_FIT_148 | Priority muscle đơn lẻ: chọn chest (Ngực) | Positive | P1 |
| TC_FIT_149 | Priority muscle đơn lẻ: chọn back (Lưng) | Positive | P1 |
| TC_FIT_150 | Priority muscle đơn lẻ: chọn shoulders (Vai) | Positive | P2 |
| TC_FIT_151 | Priority muscle đơn lẻ: chọn legs (Chân) | Positive | P2 |
| TC_FIT_152 | Priority muscle đơn lẻ: chọn arms (Tay) | Positive | P2 |
| TC_FIT_153 | Priority muscle đơn lẻ: chọn core (Cơ lõi) | Positive | P3 |
| TC_FIT_154 | Priority muscle đơn lẻ: chọn glutes (Mông) | Positive | P3 |
| TC_FIT_155 | Priority muscle bộ ba tối đa: chest + back + shoulders | Boundary | P1 |
| TC_FIT_156 | Priority muscle bộ ba tối đa: legs + arms + core | Boundary | P1 |
| TC_FIT_157 | Priority muscle bộ ba tối đa: chest + legs + glutes | Boundary | P1 |
| TC_FIT_158 | Priority muscle bộ ba tối đa: back + shoulders + arms | Boundary | P1 |
| TC_FIT_159 | Priority muscle bộ ba tối đa: core + glutes + chest | Boundary | P1 |
| TC_FIT_160 | Priority muscle chặn thứ 4: đã có chest/back/shoulders → thử thêm legs | Negative | P1 |
| TC_FIT_161 | Priority muscle chặn thứ 4: đã có legs/arms/core → thử thêm glutes | Negative | P1 |
| TC_FIT_162 | Priority muscle chặn thứ 4: đã có chest/legs/glutes → thử thêm back | Negative | P1 |
| TC_FIT_163 | Periodization + Cycle: linear (Tuyến tính) × 4 tuần | Positive | P1 |
| TC_FIT_164 | Periodization + Cycle: linear (Tuyến tính) × 6 tuần | Positive | P1 |
| TC_FIT_165 | Periodization + Cycle: linear (Tuyến tính) × 8 tuần | Positive | P1 |
| TC_FIT_166 | Periodization + Cycle: linear (Tuyến tính) × 12 tuần | Positive | P2 |
| TC_FIT_167 | Periodization + Cycle: undulating (Dao động) × 4 tuần | Positive | P2 |
| TC_FIT_168 | Periodization + Cycle: undulating (Dao động) × 6 tuần | Positive | P2 |
| TC_FIT_169 | Periodization + Cycle: undulating (Dao động) × 8 tuần | Positive | P2 |
| TC_FIT_170 | Periodization + Cycle: undulating (Dao động) × 12 tuần | Positive | P2 |
| TC_FIT_171 | Periodization + Cycle: block (Khối) × 4 tuần | Positive | P3 |
| TC_FIT_172 | Periodization + Cycle: block (Khối) × 6 tuần | Positive | P3 |
| TC_FIT_173 | Periodization + Cycle: block (Khối) × 8 tuần | Positive | P3 |
| TC_FIT_174 | Periodization + Cycle: block (Khối) × 12 tuần | Positive | P3 |
| TC_FIT_175 | Cardio sessions/tuần: chọn giá trị 0 | Edge | P1 |
| TC_FIT_176 | Cardio sessions/tuần: chọn giá trị 1 | Boundary | P2 |
| TC_FIT_177 | Cardio sessions/tuần: chọn giá trị 2 | Boundary | P2 |
| TC_FIT_178 | Cardio sessions/tuần: chọn giá trị 3 | Boundary | P2 |
| TC_FIT_179 | Cardio sessions/tuần: chọn giá trị 4 | Boundary | P2 |
| TC_FIT_180 | Cardio sessions/tuần: chọn giá trị 5 | Boundary | P1 |
| TC_FIT_181 | Session duration: chọn 30 phút | Positive | P2 |
| TC_FIT_182 | Session duration: chọn 45 phút | Positive | P2 |
| TC_FIT_183 | Session duration: chọn 60 phút | Positive | P1 |
| TC_FIT_184 | Session duration: chọn 90 phút | Positive | P2 |
| TC_FIT_185 | Điền form → switch tab → quay lại → dữ liệu giữ nguyên | Edge | P0 |
| TC_FIT_186 | Điền customize → collapse → expand → dữ liệu giữ nguyên | Edge | P0 |
| TC_FIT_187 | Đổi experience beginner → intermediate → fields hiển thị ngay lập tức | Edge | P0 |
| TC_FIT_188 | Đổi experience intermediate → advanced → fields advanced xuất hiện | Edge | P1 |
| TC_FIT_189 | Đổi advanced → beginner → fields nâng cao biến mất | Negative | P1 |
| TC_FIT_190 | Đổi beginner → advanced → beginner → fields ẩn lại hoàn toàn | Negative | P1 |
| TC_FIT_191 | Submit form → verify onboarding ẩn và tabs hiện | Negative | P1 |
| TC_FIT_192 | Thay đổi goal sau khi đã chọn customize options | Negative | P2 |
| TC_FIT_193 | Double-click "Bắt đầu" → chỉ 1 lần submit | Edge | P0 |
| TC_FIT_194 | Rapid goal switching 10 lần | Edge | P1 |
| TC_FIT_195 | Rapid equipment toggle 20 lần | Edge | P1 |
| TC_FIT_196 | Rapid expand/collapse customize 10 lần | Edge | P2 |
| TC_FIT_197 | Rapid experience switching beginner↔advanced 10 lần | Edge | P1 |
| TC_FIT_198 | Click submit khi đang processing | Edge | P0 |
| TC_FIT_199 | Tab key duyệt qua tất cả form fields | Positive | P1 |
| TC_FIT_200 | Space/Enter chọn radio buttons | Positive | P0 |
| TC_FIT_201 | Arrow keys trong radiogroups | Positive | P1 |
| TC_FIT_202 | Escape đóng customize section | Negative | P2 |
| TC_FIT_203 | Screen reader thông báo form sections | Positive | P1 |
| TC_FIT_204 | Focus trap trong onboarding form | Edge | P2 |
| TC_FIT_205 | Tab order theo đúng visual order | Positive | P1 |
| TC_FIT_206 | Dark mode: active pill colors (emerald trên dark bg) | Negative | P2 |
| TC_FIT_207 | Dark mode: inactive pill colors (slate-700) | Negative | P2 |
| TC_FIT_208 | Dark mode: input fields border và background | Negative | P3 |
| TC_FIT_209 | Dark mode: submit button contrast đủ | Negative | P3 |
| TC_FIT_210 | Dark mode: customize section background và text | Negative | P3 |

---

## Chi tiết Test Cases

##### TC_FIT_001: Hiển thị onboarding khi chưa có profile
- **Pre-conditions**: isOnboarded = false trong fitnessStore, chưa có trainingProfile
- **Steps**:
  1. Mở app tại localhost:3000
  2. Chuyển sang tab Fitness
- **Expected Result**: FitnessOnboarding form hiển thị (data-testid="fitness-onboarding"), không thấy SubTabBar hay bất kỳ sub-tab nào
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_002: Hiển thị tabs khi đã có profile
- **Pre-conditions**: isOnboarded = true trong fitnessStore, đã có trainingProfile
- **Steps**:
  1. Mở app tại localhost:3000
  2. Chuyển sang tab Fitness
- **Expected Result**: SubTabBar hiển thị 4 tabs (Kế hoạch, Tập luyện, Lịch sử, Tiến trình) với icons tương ứng (ClipboardList, Dumbbell, History, BarChart3), data-testid="fitness-tab" visible
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_003: Default tab là "Kế hoạch" sau onboarding
- **Pre-conditions**: isOnboarded = true
- **Steps**:
  1. Mở tab Fitness
  2. Quan sát active sub-tab
- **Expected Result**: Tab "Kế hoạch" (plan) active mặc định, TrainingPlanView render trong tabpanel-plan
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_004: Chuyển giữa 4 sub-tabs
- **Pre-conditions**: isOnboarded = true, đang ở tab mặc định "Kế hoạch"
- **Steps**:
  1. Click tab "Tập luyện" (workout)
  2. Click tab "Lịch sử" (history)
  3. Click tab "Tiến trình" (progress)
  4. Click lại tab "Kế hoạch" (plan)
- **Expected Result**: Mỗi lần click, tab tương ứng active (aria-selected=true), nội dung tabpanel thay đổi đúng component
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_005: Tab "Tập luyện" hiển thị mode selector
- **Pre-conditions**: isOnboarded = true
- **Steps**:
  1. Click tab "Tập luyện"
  2. Quan sát khu vực trên cùng của tabpanel-workout
- **Expected Result**: Hiển thị radiogroup với 2 nút: Strength (có icon Dumbbell) và Cardio, role="radiogroup" present, aria-label phù hợp
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_006: Toggle Strength ↔ Cardio mode
- **Pre-conditions**: isOnboarded = true, tab "Tập luyện" active, workoutMode = 'strength'
- **Steps**:
  1. Click nút "Cardio"
  2. Quan sát component render
  3. Click nút "Strength"
  4. Quan sát component render
- **Expected Result**: Click Cardio → CardioLogger render, aria-checked="true" trên nút Cardio; Click Strength → WorkoutLogger render, aria-checked="true" trên nút Strength
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_007: Onboarding form: chọn goal
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Quan sát section "Mục tiêu tập luyện"
  2. Click lần lượt từng goal: strength, hypertrophy, endurance, general
- **Expected Result**: Mỗi goal button có role="radio", click chuyển aria-checked="true" cho goal được chọn, các goal khác aria-checked="false", style active (bg-emerald-500)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_008: Onboarding form: chọn experience level
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Click "beginner" → quan sát
  2. Click "intermediate" → quan sát
  3. Click "advanced" → quan sát
- **Expected Result**: Experience button active có aria-checked="true", style cập nhật. Khi chuyển level, các trường conditional hiển thị/ẩn tương ứng
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_009: Onboarding form: chọn days per week
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Quan sát section "Số ngày tập/tuần"
  2. Click lần lượt: 2, 3, 4, 5, 6
- **Expected Result**: Default = 3 (aria-checked="true"). Mỗi click thay đổi selection, chỉ 1 option active tại 1 thời điểm
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_010: Expand/collapse tùy chỉnh nâng cao
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Quan sát nút "Tùy chỉnh" (customize toggle)
  2. Click toggle → expand
  3. Click toggle → collapse
- **Expected Result**: Ban đầu collapse (aria-expanded="false", ChevronDown icon). Click lần 1: expand (aria-expanded="true", ChevronUp icon, data-testid="customize-section" visible). Click lần 2: collapse lại
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_011: Multi-select equipment
- **Pre-conditions**: Onboarding hiển thị, tùy chỉnh đã expand
- **Steps**:
  1. Click "barbell" → check icon xuất hiện
  2. Click "dumbbell" → check icon xuất hiện
  3. Click "barbell" lần nữa → check icon biến mất
- **Expected Result**: Equipment buttons có role="checkbox", click toggle aria-checked. Check icon (✓) hiển thị cho selected items. Có thể chọn nhiều equipment cùng lúc
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_012: Multi-select injuries
- **Pre-conditions**: Onboarding hiển thị, tùy chỉnh đã expand
- **Steps**:
  1. Click "shoulders" → selected
  2. Click "lower_back" → selected
  3. Click "shoulders" → deselected
- **Expected Result**: Injury buttons có role="checkbox", toggle hoạt động đúng, check icon xuất hiện/biến mất
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_013: Submit form tạo profile thành công
- **Pre-conditions**: Onboarding hiển thị, đã chọn goal/experience/days
- **Steps**:
  1. Chọn goal = "strength"
  2. Chọn experience = "beginner"
  3. Chọn days = 4
  4. Click nút "Bắt đầu" (submit)
- **Expected Result**: TrainingProfile được tạo với UUID id, smart defaults áp dụng, setTrainingProfile được gọi, setOnboarded(true), onComplete() callback triggered, chuyển sang hiển thị FitnessTab chính
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_014: Trường intermediate+ hiển thị đúng điều kiện
- **Pre-conditions**: Onboarding hiển thị, tùy chỉnh đã expand
- **Steps**:
  1. Chọn experience = "intermediate"
  2. Quan sát các trường trong customize section
- **Expected Result**: Hiển thị thêm: Periodization (linear/undulating/block), Cycle weeks (4/6/8/12), Priority muscles (7 options, max 3). KHÔNG hiển thị: Known 1RM, Avg sleep
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_015: Trường advanced hiển thị đúng điều kiện
- **Pre-conditions**: Onboarding hiển thị, tùy chỉnh đã expand
- **Steps**:
  1. Chọn experience = "advanced"
  2. Quan sát các trường trong customize section
- **Expected Result**: Hiển thị tất cả trường intermediate+ VÀ thêm: Known 1RM (4 inputs: squat/bench/deadlift/ohp, type="number"), Avg sleep hours (input type="number", step=0.5)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_016: Priority muscles giới hạn tối đa 3
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded
- **Steps**:
  1. Click "chest" → selected (1/3)
  2. Click "back" → selected (2/3)
  3. Click "shoulders" → selected (3/3)
  4. Click "legs" → attempt 4th selection
- **Expected Result**: 3 muscles đầu chọn thành công (aria-checked="true"). Attempt chọn muscle thứ 4 bị bỏ qua, priorityMuscles.length vẫn = 3
- **Priority**: P1 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_017: Known 1RM validation: số dương
- **Pre-conditions**: Experience = advanced, customize expanded
- **Steps**:
  1. Nhập squat = "100", bench = "80", deadlift = "120", ohp = "50"
  2. Submit form
- **Expected Result**: Tất cả 4 giá trị parsed thành công, profile.known1rm = {squat: 100, bench: 80, deadlift: 120, ohp: 50}
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_018: Known 1RM validation: giá trị âm bị loại
- **Pre-conditions**: Experience = advanced, customize expanded
- **Steps**:
  1. Nhập squat = "-50", bench = "80"
  2. Submit form
- **Expected Result**: squat bị loại (parseFloat → -50, -50 > 0 = false), profile.known1rm chỉ chứa {bench: 80}
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_019: Known 1RM validation: giá trị NaN bị loại
- **Pre-conditions**: Experience = advanced, customize expanded
- **Steps**:
  1. Nhập squat = "abc", bench = "", deadlift = "100"
  2. Submit form
- **Expected Result**: squat và bench bị loại (parseFloat → NaN), profile.known1rm chỉ chứa {deadlift: 100}
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_020: Avg sleep hours nhập hợp lệ
- **Pre-conditions**: Experience = advanced, customize expanded
- **Steps**:
  1. Nhập avg sleep = "7.5"
  2. Submit form
- **Expected Result**: profile.avgSleepHours = 7.5 (parseFloat thành công)
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_021: Aria-checked cập nhật khi chọn goal
- **Pre-conditions**: Onboarding hiển thị
- **Steps**:
  1. Inspect goal radiogroup
  2. Click "endurance"
  3. Kiểm tra aria-checked trên tất cả goal buttons
- **Expected Result**: endurance button có aria-checked="true", tất cả buttons khác có aria-checked="false"
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_022: Aria-checked cập nhật khi chọn experience
- **Pre-conditions**: Onboarding hiển thị
- **Steps**:
  1. Click "advanced"
  2. Kiểm tra aria-checked attributes
- **Expected Result**: advanced button aria-checked="true", beginner và intermediate aria-checked="false"
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_023: Aria-expanded toggle trên nút tùy chỉnh
- **Pre-conditions**: Onboarding hiển thị
- **Steps**:
  1. Kiểm tra nút customize → aria-expanded="false"
  2. Click nút → kiểm tra → aria-expanded="true"
  3. Click lại → kiểm tra → aria-expanded="false"
- **Expected Result**: aria-expanded toggle đúng mỗi lần click
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_024: Role="radiogroup" trên goal selector
- **Pre-conditions**: Onboarding hiển thị
- **Steps**:
  1. Inspect DOM element chứa goal buttons
- **Expected Result**: Container có role="radiogroup" và aria-label tương ứng với label "Mục tiêu tập luyện"
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_025: Role="radiogroup" trên experience selector
- **Pre-conditions**: Onboarding hiển thị
- **Steps**:
  1. Inspect DOM element chứa experience buttons
- **Expected Result**: Container có role="radiogroup" và aria-label tương ứng
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_026: Role="radiogroup" trên days selector
- **Pre-conditions**: Onboarding hiển thị
- **Steps**:
  1. Inspect DOM element chứa days per week buttons
- **Expected Result**: Container có role="radiogroup" và aria-label tương ứng
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_027: Role="tabpanel" trên mỗi tab content
- **Pre-conditions**: isOnboarded = true
- **Steps**:
  1. Click tab "Kế hoạch" → inspect DOM
  2. Click tab "Tập luyện" → inspect DOM
  3. Click tab "Lịch sử" → inspect DOM
  4. Click tab "Tiến trình" → inspect DOM
- **Expected Result**: Mỗi tab content wrapper có role="tabpanel" và id tương ứng (tabpanel-plan, tabpanel-workout, tabpanel-history, tabpanel-progress)
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_028: Workout mode aria-checked cập nhật
- **Pre-conditions**: isOnboarded = true, tab "Tập luyện" active
- **Steps**:
  1. Inspect strength button → aria-checked="true" (default)
  2. Click cardio → inspect cả 2 buttons
- **Expected Result**: Strength: aria-checked="false", Cardio: aria-checked="true". role="radio" present trên cả 2 buttons
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_029: Lazy rendering: tab inactive không render DOM
- **Pre-conditions**: isOnboarded = true, activeSubTab = 'plan'
- **Steps**:
  1. Inspect DOM cho tabpanel-workout
  2. Inspect DOM cho tabpanel-history
  3. Inspect DOM cho tabpanel-progress
- **Expected Result**: Chỉ tabpanel-plan tồn tại trong DOM. Các tab inactive (workout, history, progress) KHÔNG có DOM element (conditional rendering với &&)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_030: React.memo: không re-render khi props không đổi
- **Pre-conditions**: isOnboarded = true, React DevTools installed
- **Steps**:
  1. Bật React DevTools Profiler
  2. Trigger parent re-render (ví dụ thay đổi state không liên quan)
  3. Quan sát FitnessTab trong profiler
- **Expected Result**: FitnessTab (wrapped trong memo) không re-render nếu props không thay đổi
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_031: Beginner: không thấy intermediate fields
- **Pre-conditions**: Onboarding hiển thị, customize expanded
- **Steps**:
  1. Chọn experience = "beginner"
  2. Quan sát customize section
- **Expected Result**: KHÔNG hiển thị: Periodization, Cycle weeks, Priority muscles, Known 1RM, Avg sleep. Chỉ hiển thị: Session duration, Equipment, Injuries, Cardio sessions
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_032: Beginner: không thấy advanced fields
- **Pre-conditions**: Onboarding hiển thị, customize expanded, experience = beginner
- **Steps**:
  1. Search DOM cho input có id="orm-squat"
  2. Search DOM cho input có id="avg-sleep"
- **Expected Result**: Không tìm thấy cả 2 elements trong DOM
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_033: Intermediate: thấy intermediate fields, không thấy advanced
- **Pre-conditions**: Onboarding hiển thị, customize expanded
- **Steps**:
  1. Chọn experience = "intermediate"
  2. Quan sát customize section
- **Expected Result**: Hiển thị: Periodization (3 options), Cycle weeks (4 options), Priority muscles (7 options). KHÔNG hiển thị: Known 1RM inputs, Avg sleep input
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_034: Equipment toggle: select rồi deselect
- **Pre-conditions**: Onboarding hiển thị, customize expanded
- **Steps**:
  1. Click "dumbbell" → verify selected (aria-checked="true", check icon visible)
  2. Click "dumbbell" lần nữa → verify deselected (aria-checked="false", check icon hidden)
- **Expected Result**: Toggle hoạt động 2 chiều, state equipment[] cập nhật đúng
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_035: Injury toggle: select rồi deselect
- **Pre-conditions**: Onboarding hiển thị, customize expanded
- **Steps**:
  1. Click "knees" → verify selected
  2. Click "knees" lần nữa → verify deselected
- **Expected Result**: Toggle hoạt động 2 chiều, state injuries[] cập nhật đúng
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_036: Priority muscle toggle: select rồi deselect
- **Pre-conditions**: Experience = intermediate+, customize expanded
- **Steps**:
  1. Click "chest" → selected (1/3)
  2. Click "chest" lần nữa → deselected (0/3)
- **Expected Result**: Toggle hoạt động, priorityMuscles[] cập nhật đúng, count giảm về 0
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_037: Chọn tất cả equipment (6/6)
- **Pre-conditions**: Onboarding hiển thị, customize expanded
- **Steps**:
  1. Click lần lượt: barbell, dumbbell, machine, cable, bodyweight, bands
- **Expected Result**: Tất cả 6 equipment buttons có aria-checked="true" và check icon, equipment[] chứa 6 items
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_038: Chọn tất cả injuries (6/6)
- **Pre-conditions**: Onboarding hiển thị, customize expanded
- **Steps**:
  1. Click lần lượt: shoulders, lower_back, knees, wrists, neck, hips
- **Expected Result**: Tất cả 6 injury buttons có aria-checked="true" và check icon, injuries[] chứa 6 items
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_039: Chọn 4th priority muscle — bị chặn
- **Pre-conditions**: Experience = intermediate+, customize expanded, đã chọn 3 muscles (chest, back, legs)
- **Steps**:
  1. Verify 3 muscles đã selected
  2. Click "arms" (muscle thứ 4)
  3. Verify priorityMuscles
- **Expected Result**: "arms" KHÔNG được thêm vào, priorityMuscles vẫn = ['chest', 'back', 'legs'] (length = 3, MAX_PRIORITY_MUSCLES enforced)
- **Priority**: P1 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_040: Days per week: giá trị min (2)
- **Pre-conditions**: Onboarding hiển thị
- **Steps**:
  1. Click "2" trong days per week selector
- **Expected Result**: daysPerWeek = 2, aria-checked="true" trên nút 2, profile tạo với daysPerWeek=2
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_041: Days per week: giá trị max (6)
- **Pre-conditions**: Onboarding hiển thị
- **Steps**:
  1. Click "6" trong days per week selector
- **Expected Result**: daysPerWeek = 6, aria-checked="true" trên nút 6, profile tạo với daysPerWeek=6
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_042: Session duration: tất cả options (30/45/60/90)
- **Pre-conditions**: Onboarding hiển thị, customize expanded
- **Steps**:
  1. Click 30 → verify aria-checked
  2. Click 45 → verify
  3. Click 60 → verify
  4. Click 90 → verify
- **Expected Result**: Mỗi option chọn thành công, role="radio" với aria-checked toggle đúng, chỉ 1 option active
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_043: Cardio sessions: range 0-5
- **Pre-conditions**: Onboarding hiển thị, customize expanded
- **Steps**:
  1. Click 0 → verify
  2. Click 5 → verify
- **Expected Result**: cardioSessions cập nhật đúng cho mỗi giá trị từ 0 đến 5
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_044: Periodization: chọn từng option
- **Pre-conditions**: Experience = intermediate+, customize expanded
- **Steps**:
  1. Click "linear" → verify selected
  2. Click "undulating" → verify selected
  3. Click "block" → verify selected
- **Expected Result**: Mỗi option role="radio" chọn thành công, chỉ 1 active, aria-checked cập nhật
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_045: Cycle weeks: tất cả options (4/6/8/12)
- **Pre-conditions**: Experience = intermediate+, customize expanded
- **Steps**:
  1. Click lần lượt: 4, 6, 8, 12
- **Expected Result**: Mỗi option chọn thành công, aria-checked cập nhật
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_046: Known 1RM: nhập 0 — bị loại bỏ
- **Pre-conditions**: Experience = advanced, customize expanded
- **Steps**:
  1. Nhập squat = "0"
  2. Submit form
- **Expected Result**: squat bị loại (0 > 0 = false), profile.known1rm không chứa key "squat"
- **Priority**: P1 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_047: Known 1RM: nhập text "abc" — bị loại bỏ
- **Pre-conditions**: Experience = advanced, customize expanded
- **Steps**:
  1. Nhập squat = "abc"
  2. Submit form
- **Expected Result**: parseFloat("abc") = NaN, isNaN check loại bỏ, profile.known1rm không chứa key "squat"
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_048: Avg sleep: nhập step 0.5
- **Pre-conditions**: Experience = advanced, customize expanded
- **Steps**:
  1. Nhập avg sleep = "7.5"
  2. Kiểm tra input type="number" step attribute
- **Expected Result**: Input có step={0.5}, giá trị 7.5 accepted, hiển thị đúng
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_049: Submit với tất cả optional fields trống
- **Pre-conditions**: Onboarding hiển thị, chỉ chọn goal/experience/days (bắt buộc)
- **Steps**:
  1. Chọn goal = "hypertrophy", experience = "beginner", days = 3
  2. KHÔNG expand customize section
  3. Click submit
- **Expected Result**: Profile tạo thành công với smart defaults, optional fields không có trong profile object (sessionDurationMin, availableEquipment, etc. không present)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_050: Submit với tất cả optional fields đầy đủ
- **Pre-conditions**: Experience = advanced, customize expanded, tất cả fields đã điền
- **Steps**:
  1. Chọn goal=strength, exp=advanced, days=5
  2. Expand customize → chọn duration=60, equipment=[barbell,dumbbell], injuries=[knees]
  3. Chọn cardio=2, periodization=undulating, cycleWeeks=8, muscles=[chest,back,legs]
  4. Nhập 1RM: squat=140, bench=100, deadlift=180, ohp=60
  5. Nhập sleep=8
  6. Submit
- **Expected Result**: Profile chứa tất cả fields, known1rm có 4 entries hợp lệ, avgSleepHours=8, priorityMuscles length=3
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_051: Profile persist sau reload
- **Pre-conditions**: Đã submit onboarding thành công
- **Steps**:
  1. Reload trang (F5)
  2. Chuyển sang tab Fitness
- **Expected Result**: FitnessTab chính hiển thị (không phải onboarding), isOnboarded = true persist qua Zustand persist middleware
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_052: Tab switch rapid 20 lần — không crash
- **Pre-conditions**: isOnboarded = true
- **Steps**:
  1. Click nhanh liên tục qua 4 tabs, 20 lần trong < 3 giây
- **Expected Result**: Không crash, không JS error trong Console, tab cuối cùng clicked hiển thị đúng nội dung
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_053: Dark mode: onboarding đúng colors
- **Pre-conditions**: isOnboarded = false, dark mode enabled
- **Steps**:
  1. Mở tab Fitness trong dark mode
  2. Quan sát onboarding form
- **Expected Result**: Background dark:bg-slate-800, text dark:text-slate-300, pill inactive dark:bg-slate-700. Không có text khó đọc hoặc contrast thấp
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_054: i18n: labels cập nhật khi đổi ngôn ngữ
- **Pre-conditions**: isOnboarded = false
- **Steps**:
  1. Đổi ngôn ngữ từ vi sang en
  2. Quan sát tất cả labels trong onboarding form
- **Expected Result**: Tất cả label text cập nhật sang tiếng Anh (dùng t() translation keys), không có text hardcoded
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_055: onComplete callback được gọi sau submit
- **Pre-conditions**: isOnboarded = false
- **Steps**:
  1. Hoàn thành onboarding form (chọn goal, exp, days)
  2. Click submit
- **Expected Result**: onComplete callback triggered, FitnessTab chuyển sang hiển thị tabs (handleOnboardingComplete → setOnboarded(true))
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_056: Combination: goal=strength, experience=beginner, days=2 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Chọn goal = "strength" (Sức mạnh)
  2. Chọn experience = "beginner" (Mới bắt đầu)
  3. Chọn days per week = 2
  4. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo thành công với goal="strength", experience="beginner", daysPerWeek=2. getSmartDefaults("strength", "beginner", 2) áp dụng đúng. setTrainingProfile và setOnboarded(true) executed, chuyển sang FitnessTab
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_057: Combination: goal=strength, experience=beginner, days=3 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Chọn goal = "strength" (Sức mạnh)
  2. Chọn experience = "beginner" (Mới bắt đầu)
  3. Chọn days per week = 3
  4. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo thành công với goal="strength", experience="beginner", daysPerWeek=3. getSmartDefaults("strength", "beginner", 3) áp dụng đúng. setTrainingProfile và setOnboarded(true) executed, chuyển sang FitnessTab
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_058: Combination: goal=strength, experience=beginner, days=4 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Chọn goal = "strength" (Sức mạnh)
  2. Chọn experience = "beginner" (Mới bắt đầu)
  3. Chọn days per week = 4
  4. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo thành công với goal="strength", experience="beginner", daysPerWeek=4. getSmartDefaults("strength", "beginner", 4) áp dụng đúng. setTrainingProfile và setOnboarded(true) executed, chuyển sang FitnessTab
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_059: Combination: goal=strength, experience=beginner, days=5 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Chọn goal = "strength" (Sức mạnh)
  2. Chọn experience = "beginner" (Mới bắt đầu)
  3. Chọn days per week = 5
  4. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="strength", experience="beginner", daysPerWeek=5. Profile KHÔNG chứa periodizationModel, cycleWeeks, priorityMuscles, known1rm, avgSleepHours. Chỉ có smart defaults cho beginner level
- **Priority**: P0 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_060: Combination: goal=strength, experience=beginner, days=6 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Chọn goal = "strength" (Sức mạnh)
  2. Chọn experience = "beginner" (Mới bắt đầu)
  3. Chọn days per week = 6
  4. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo thành công với goal="strength", experience="beginner", daysPerWeek=6. getSmartDefaults("strength", "beginner", 6) áp dụng đúng. setTrainingProfile và setOnboarded(true) executed, chuyển sang FitnessTab
- **Priority**: P3 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_061: Combination: goal=strength, experience=intermediate, days=2 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "strength" (Sức mạnh)
  2. Chọn experience = "intermediate" (Trung cấp)
  3. Chọn days per week = 2
  4. Verify periodization, cycle weeks, priority muscles hiển thị
  5. Verify known 1RM, avg sleep KHÔNG hiển thị
  6. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="strength", experience="intermediate", daysPerWeek=2. Intermediate fields accessible (periodization, cycleWeeks, priorityMuscles). Advanced fields (known1rm, avgSleepHours) KHÔNG present trong profile
- **Priority**: P3 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_062: Combination: goal=strength, experience=intermediate, days=3 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "strength" (Sức mạnh)
  2. Chọn experience = "intermediate" (Trung cấp)
  3. Chọn days per week = 3
  4. Verify periodization, cycle weeks, priority muscles hiển thị
  5. Verify known 1RM, avg sleep KHÔNG hiển thị
  6. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="strength", experience="intermediate", daysPerWeek=3. Intermediate fields accessible (periodization, cycleWeeks, priorityMuscles). Advanced fields (known1rm, avgSleepHours) KHÔNG present trong profile
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_063: Combination: goal=strength, experience=intermediate, days=4 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "strength" (Sức mạnh)
  2. Chọn experience = "intermediate" (Trung cấp)
  3. Chọn days per week = 4
  4. Verify periodization, cycle weeks, priority muscles hiển thị
  5. Verify known 1RM, avg sleep KHÔNG hiển thị
  6. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="strength", experience="intermediate", daysPerWeek=4. Intermediate fields accessible (periodization, cycleWeeks, priorityMuscles). Advanced fields (known1rm, avgSleepHours) KHÔNG present trong profile
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_064: Combination: goal=strength, experience=intermediate, days=5 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "strength" (Sức mạnh)
  2. Chọn experience = "intermediate" (Trung cấp)
  3. Chọn days per week = 5
  4. Verify periodization, cycle weeks, priority muscles hiển thị
  5. Verify known 1RM, avg sleep KHÔNG hiển thị
  6. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="strength", experience="intermediate", daysPerWeek=5. Intermediate fields accessible (periodization, cycleWeeks, priorityMuscles). Advanced fields (known1rm, avgSleepHours) KHÔNG present trong profile
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_065: Combination: goal=strength, experience=intermediate, days=6 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "strength" (Sức mạnh)
  2. Chọn experience = "intermediate" (Trung cấp)
  3. Chọn days per week = 6
  4. Verify periodization, cycle weeks, priority muscles hiển thị
  5. Verify known 1RM, avg sleep KHÔNG hiển thị
  6. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="strength", experience="intermediate", daysPerWeek=6. Intermediate fields accessible (periodization, cycleWeeks, priorityMuscles). Advanced fields (known1rm, avgSleepHours) KHÔNG present trong profile
- **Priority**: P3 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_066: Combination: goal=strength, experience=advanced, days=2 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "strength" (Sức mạnh)
  2. Chọn experience = "advanced" (Nâng cao)
  3. Chọn days per week = 2
  4. Verify tất cả trường intermediate và advanced hiển thị
  5. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="strength", experience="advanced", daysPerWeek=2. Tất cả fields advanced accessible. Smart defaults cho advanced level áp dụng. Form submit thành công, chuyển sang FitnessTab
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_067: Combination: goal=strength, experience=advanced, days=3 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "strength" (Sức mạnh)
  2. Chọn experience = "advanced" (Nâng cao)
  3. Chọn days per week = 3
  4. Verify tất cả trường intermediate và advanced hiển thị
  5. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="strength", experience="advanced", daysPerWeek=3. Tất cả fields advanced accessible. Smart defaults cho advanced level áp dụng. Form submit thành công, chuyển sang FitnessTab
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_068: Combination: goal=strength, experience=advanced, days=4 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "strength" (Sức mạnh)
  2. Chọn experience = "advanced" (Nâng cao)
  3. Chọn days per week = 4
  4. Verify tất cả trường intermediate và advanced hiển thị
  5. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="strength", experience="advanced", daysPerWeek=4. Tất cả fields advanced accessible. Smart defaults cho advanced level áp dụng. Form submit thành công, chuyển sang FitnessTab
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_069: Combination: goal=strength, experience=advanced, days=5 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "strength" (Sức mạnh)
  2. Chọn experience = "advanced" (Nâng cao)
  3. Chọn days per week = 5
  4. Verify tất cả trường intermediate và advanced hiển thị
  5. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="strength", experience="advanced", daysPerWeek=5. Tất cả fields advanced accessible. Smart defaults cho advanced level áp dụng. Form submit thành công, chuyển sang FitnessTab
- **Priority**: P0 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_070: Combination: goal=strength, experience=advanced, days=6 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "strength" (Sức mạnh)
  2. Chọn experience = "advanced" (Nâng cao)
  3. Chọn days per week = 6
  4. Verify tất cả trường intermediate và advanced hiển thị
  5. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="strength", experience="advanced", daysPerWeek=6. Tất cả fields advanced accessible. Smart defaults cho advanced level áp dụng. Form submit thành công, chuyển sang FitnessTab
- **Priority**: P3 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_071: Combination: goal=hypertrophy, experience=beginner, days=2 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Chọn goal = "hypertrophy" (Phì đại cơ)
  2. Chọn experience = "beginner" (Mới bắt đầu)
  3. Chọn days per week = 2
  4. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo thành công với goal="hypertrophy", experience="beginner", daysPerWeek=2. getSmartDefaults("hypertrophy", "beginner", 2) áp dụng đúng. setTrainingProfile và setOnboarded(true) executed, chuyển sang FitnessTab
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_072: Combination: goal=hypertrophy, experience=beginner, days=3 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Chọn goal = "hypertrophy" (Phì đại cơ)
  2. Chọn experience = "beginner" (Mới bắt đầu)
  3. Chọn days per week = 3
  4. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo thành công với goal="hypertrophy", experience="beginner", daysPerWeek=3. getSmartDefaults("hypertrophy", "beginner", 3) áp dụng đúng. setTrainingProfile và setOnboarded(true) executed, chuyển sang FitnessTab
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_073: Combination: goal=hypertrophy, experience=beginner, days=4 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Chọn goal = "hypertrophy" (Phì đại cơ)
  2. Chọn experience = "beginner" (Mới bắt đầu)
  3. Chọn days per week = 4
  4. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo thành công với goal="hypertrophy", experience="beginner", daysPerWeek=4. getSmartDefaults("hypertrophy", "beginner", 4) áp dụng đúng. setTrainingProfile và setOnboarded(true) executed, chuyển sang FitnessTab
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_074: Combination: goal=hypertrophy, experience=beginner, days=5 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Chọn goal = "hypertrophy" (Phì đại cơ)
  2. Chọn experience = "beginner" (Mới bắt đầu)
  3. Chọn days per week = 5
  4. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="hypertrophy", experience="beginner", daysPerWeek=5. Profile KHÔNG chứa periodizationModel, cycleWeeks, priorityMuscles, known1rm, avgSleepHours. Chỉ có smart defaults cho beginner level
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_075: Combination: goal=hypertrophy, experience=beginner, days=6 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Chọn goal = "hypertrophy" (Phì đại cơ)
  2. Chọn experience = "beginner" (Mới bắt đầu)
  3. Chọn days per week = 6
  4. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo thành công với goal="hypertrophy", experience="beginner", daysPerWeek=6. getSmartDefaults("hypertrophy", "beginner", 6) áp dụng đúng. setTrainingProfile và setOnboarded(true) executed, chuyển sang FitnessTab
- **Priority**: P3 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_076: Combination: goal=hypertrophy, experience=intermediate, days=2 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "hypertrophy" (Phì đại cơ)
  2. Chọn experience = "intermediate" (Trung cấp)
  3. Chọn days per week = 2
  4. Verify periodization, cycle weeks, priority muscles hiển thị
  5. Verify known 1RM, avg sleep KHÔNG hiển thị
  6. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="hypertrophy", experience="intermediate", daysPerWeek=2. Intermediate fields accessible (periodization, cycleWeeks, priorityMuscles). Advanced fields (known1rm, avgSleepHours) KHÔNG present trong profile
- **Priority**: P3 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_077: Combination: goal=hypertrophy, experience=intermediate, days=3 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "hypertrophy" (Phì đại cơ)
  2. Chọn experience = "intermediate" (Trung cấp)
  3. Chọn days per week = 3
  4. Verify periodization, cycle weeks, priority muscles hiển thị
  5. Verify known 1RM, avg sleep KHÔNG hiển thị
  6. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="hypertrophy", experience="intermediate", daysPerWeek=3. Intermediate fields accessible (periodization, cycleWeeks, priorityMuscles). Advanced fields (known1rm, avgSleepHours) KHÔNG present trong profile
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_078: Combination: goal=hypertrophy, experience=intermediate, days=4 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "hypertrophy" (Phì đại cơ)
  2. Chọn experience = "intermediate" (Trung cấp)
  3. Chọn days per week = 4
  4. Verify periodization, cycle weeks, priority muscles hiển thị
  5. Verify known 1RM, avg sleep KHÔNG hiển thị
  6. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="hypertrophy", experience="intermediate", daysPerWeek=4. Intermediate fields accessible (periodization, cycleWeeks, priorityMuscles). Advanced fields (known1rm, avgSleepHours) KHÔNG present trong profile
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_079: Combination: goal=hypertrophy, experience=intermediate, days=5 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "hypertrophy" (Phì đại cơ)
  2. Chọn experience = "intermediate" (Trung cấp)
  3. Chọn days per week = 5
  4. Verify periodization, cycle weeks, priority muscles hiển thị
  5. Verify known 1RM, avg sleep KHÔNG hiển thị
  6. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="hypertrophy", experience="intermediate", daysPerWeek=5. Intermediate fields accessible (periodization, cycleWeeks, priorityMuscles). Advanced fields (known1rm, avgSleepHours) KHÔNG present trong profile
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_080: Combination: goal=hypertrophy, experience=intermediate, days=6 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "hypertrophy" (Phì đại cơ)
  2. Chọn experience = "intermediate" (Trung cấp)
  3. Chọn days per week = 6
  4. Verify periodization, cycle weeks, priority muscles hiển thị
  5. Verify known 1RM, avg sleep KHÔNG hiển thị
  6. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="hypertrophy", experience="intermediate", daysPerWeek=6. Intermediate fields accessible (periodization, cycleWeeks, priorityMuscles). Advanced fields (known1rm, avgSleepHours) KHÔNG present trong profile
- **Priority**: P3 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_081: Combination: goal=hypertrophy, experience=advanced, days=2 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "hypertrophy" (Phì đại cơ)
  2. Chọn experience = "advanced" (Nâng cao)
  3. Chọn days per week = 2
  4. Verify tất cả trường intermediate và advanced hiển thị
  5. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="hypertrophy", experience="advanced", daysPerWeek=2. Tất cả fields advanced accessible. Smart defaults cho advanced level áp dụng. Form submit thành công, chuyển sang FitnessTab
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_082: Combination: goal=hypertrophy, experience=advanced, days=3 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "hypertrophy" (Phì đại cơ)
  2. Chọn experience = "advanced" (Nâng cao)
  3. Chọn days per week = 3
  4. Verify tất cả trường intermediate và advanced hiển thị
  5. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="hypertrophy", experience="advanced", daysPerWeek=3. Tất cả fields advanced accessible. Smart defaults cho advanced level áp dụng. Form submit thành công, chuyển sang FitnessTab
- **Priority**: P0 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_083: Combination: goal=hypertrophy, experience=advanced, days=4 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "hypertrophy" (Phì đại cơ)
  2. Chọn experience = "advanced" (Nâng cao)
  3. Chọn days per week = 4
  4. Verify tất cả trường intermediate và advanced hiển thị
  5. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="hypertrophy", experience="advanced", daysPerWeek=4. Tất cả fields advanced accessible. Smart defaults cho advanced level áp dụng. Form submit thành công, chuyển sang FitnessTab
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_084: Combination: goal=hypertrophy, experience=advanced, days=5 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "hypertrophy" (Phì đại cơ)
  2. Chọn experience = "advanced" (Nâng cao)
  3. Chọn days per week = 5
  4. Verify tất cả trường intermediate và advanced hiển thị
  5. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="hypertrophy", experience="advanced", daysPerWeek=5. Tất cả fields advanced accessible. Smart defaults cho advanced level áp dụng. Form submit thành công, chuyển sang FitnessTab
- **Priority**: P0 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_085: Combination: goal=hypertrophy, experience=advanced, days=6 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "hypertrophy" (Phì đại cơ)
  2. Chọn experience = "advanced" (Nâng cao)
  3. Chọn days per week = 6
  4. Verify tất cả trường intermediate và advanced hiển thị
  5. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="hypertrophy", experience="advanced", daysPerWeek=6. Tất cả fields advanced accessible. Smart defaults cho advanced level áp dụng. Form submit thành công, chuyển sang FitnessTab
- **Priority**: P3 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_086: Combination: goal=endurance, experience=beginner, days=2 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Chọn goal = "endurance" (Sức bền)
  2. Chọn experience = "beginner" (Mới bắt đầu)
  3. Chọn days per week = 2
  4. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo thành công với goal="endurance", experience="beginner", daysPerWeek=2. getSmartDefaults("endurance", "beginner", 2) áp dụng đúng. setTrainingProfile và setOnboarded(true) executed, chuyển sang FitnessTab
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_087: Combination: goal=endurance, experience=beginner, days=3 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Chọn goal = "endurance" (Sức bền)
  2. Chọn experience = "beginner" (Mới bắt đầu)
  3. Chọn days per week = 3
  4. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo thành công với goal="endurance", experience="beginner", daysPerWeek=3. getSmartDefaults("endurance", "beginner", 3) áp dụng đúng. setTrainingProfile và setOnboarded(true) executed, chuyển sang FitnessTab
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_088: Combination: goal=endurance, experience=beginner, days=4 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Chọn goal = "endurance" (Sức bền)
  2. Chọn experience = "beginner" (Mới bắt đầu)
  3. Chọn days per week = 4
  4. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo thành công với goal="endurance", experience="beginner", daysPerWeek=4. getSmartDefaults("endurance", "beginner", 4) áp dụng đúng. setTrainingProfile và setOnboarded(true) executed, chuyển sang FitnessTab
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_089: Combination: goal=endurance, experience=beginner, days=5 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Chọn goal = "endurance" (Sức bền)
  2. Chọn experience = "beginner" (Mới bắt đầu)
  3. Chọn days per week = 5
  4. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="endurance", experience="beginner", daysPerWeek=5. Profile KHÔNG chứa periodizationModel, cycleWeeks, priorityMuscles, known1rm, avgSleepHours. Chỉ có smart defaults cho beginner level
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_090: Combination: goal=endurance, experience=beginner, days=6 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Chọn goal = "endurance" (Sức bền)
  2. Chọn experience = "beginner" (Mới bắt đầu)
  3. Chọn days per week = 6
  4. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo thành công với goal="endurance", experience="beginner", daysPerWeek=6. getSmartDefaults("endurance", "beginner", 6) áp dụng đúng. setTrainingProfile và setOnboarded(true) executed, chuyển sang FitnessTab
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_091: Combination: goal=endurance, experience=intermediate, days=2 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "endurance" (Sức bền)
  2. Chọn experience = "intermediate" (Trung cấp)
  3. Chọn days per week = 2
  4. Verify periodization, cycle weeks, priority muscles hiển thị
  5. Verify known 1RM, avg sleep KHÔNG hiển thị
  6. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="endurance", experience="intermediate", daysPerWeek=2. Intermediate fields accessible (periodization, cycleWeeks, priorityMuscles). Advanced fields (known1rm, avgSleepHours) KHÔNG present trong profile
- **Priority**: P3 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_092: Combination: goal=endurance, experience=intermediate, days=3 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "endurance" (Sức bền)
  2. Chọn experience = "intermediate" (Trung cấp)
  3. Chọn days per week = 3
  4. Verify periodization, cycle weeks, priority muscles hiển thị
  5. Verify known 1RM, avg sleep KHÔNG hiển thị
  6. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="endurance", experience="intermediate", daysPerWeek=3. Intermediate fields accessible (periodization, cycleWeeks, priorityMuscles). Advanced fields (known1rm, avgSleepHours) KHÔNG present trong profile
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_093: Combination: goal=endurance, experience=intermediate, days=4 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "endurance" (Sức bền)
  2. Chọn experience = "intermediate" (Trung cấp)
  3. Chọn days per week = 4
  4. Verify periodization, cycle weeks, priority muscles hiển thị
  5. Verify known 1RM, avg sleep KHÔNG hiển thị
  6. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="endurance", experience="intermediate", daysPerWeek=4. Intermediate fields accessible (periodization, cycleWeeks, priorityMuscles). Advanced fields (known1rm, avgSleepHours) KHÔNG present trong profile
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_094: Combination: goal=endurance, experience=intermediate, days=5 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "endurance" (Sức bền)
  2. Chọn experience = "intermediate" (Trung cấp)
  3. Chọn days per week = 5
  4. Verify periodization, cycle weeks, priority muscles hiển thị
  5. Verify known 1RM, avg sleep KHÔNG hiển thị
  6. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="endurance", experience="intermediate", daysPerWeek=5. Intermediate fields accessible (periodization, cycleWeeks, priorityMuscles). Advanced fields (known1rm, avgSleepHours) KHÔNG present trong profile
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_095: Combination: goal=endurance, experience=intermediate, days=6 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "endurance" (Sức bền)
  2. Chọn experience = "intermediate" (Trung cấp)
  3. Chọn days per week = 6
  4. Verify periodization, cycle weeks, priority muscles hiển thị
  5. Verify known 1RM, avg sleep KHÔNG hiển thị
  6. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="endurance", experience="intermediate", daysPerWeek=6. Intermediate fields accessible (periodization, cycleWeeks, priorityMuscles). Advanced fields (known1rm, avgSleepHours) KHÔNG present trong profile
- **Priority**: P3 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_096: Combination: goal=endurance, experience=advanced, days=2 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "endurance" (Sức bền)
  2. Chọn experience = "advanced" (Nâng cao)
  3. Chọn days per week = 2
  4. Verify tất cả trường intermediate và advanced hiển thị
  5. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="endurance", experience="advanced", daysPerWeek=2. Tất cả fields advanced accessible. Smart defaults cho advanced level áp dụng. Form submit thành công, chuyển sang FitnessTab
- **Priority**: P0 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_097: Combination: goal=endurance, experience=advanced, days=3 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "endurance" (Sức bền)
  2. Chọn experience = "advanced" (Nâng cao)
  3. Chọn days per week = 3
  4. Verify tất cả trường intermediate và advanced hiển thị
  5. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="endurance", experience="advanced", daysPerWeek=3. Tất cả fields advanced accessible. Smart defaults cho advanced level áp dụng. Form submit thành công, chuyển sang FitnessTab
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_098: Combination: goal=endurance, experience=advanced, days=4 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "endurance" (Sức bền)
  2. Chọn experience = "advanced" (Nâng cao)
  3. Chọn days per week = 4
  4. Verify tất cả trường intermediate và advanced hiển thị
  5. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="endurance", experience="advanced", daysPerWeek=4. Tất cả fields advanced accessible. Smart defaults cho advanced level áp dụng. Form submit thành công, chuyển sang FitnessTab
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_099: Combination: goal=endurance, experience=advanced, days=5 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "endurance" (Sức bền)
  2. Chọn experience = "advanced" (Nâng cao)
  3. Chọn days per week = 5
  4. Verify tất cả trường intermediate và advanced hiển thị
  5. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="endurance", experience="advanced", daysPerWeek=5. Tất cả fields advanced accessible. Smart defaults cho advanced level áp dụng. Form submit thành công, chuyển sang FitnessTab
- **Priority**: P0 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_100: Combination: goal=endurance, experience=advanced, days=6 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "endurance" (Sức bền)
  2. Chọn experience = "advanced" (Nâng cao)
  3. Chọn days per week = 6
  4. Verify tất cả trường intermediate và advanced hiển thị
  5. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="endurance", experience="advanced", daysPerWeek=6. Tất cả fields advanced accessible. Smart defaults cho advanced level áp dụng. Form submit thành công, chuyển sang FitnessTab
- **Priority**: P3 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_101: Combination: goal=general, experience=beginner, days=2 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Chọn goal = "general" (Tổng hợp)
  2. Chọn experience = "beginner" (Mới bắt đầu)
  3. Chọn days per week = 2
  4. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo thành công với goal="general", experience="beginner", daysPerWeek=2. getSmartDefaults("general", "beginner", 2) áp dụng đúng. setTrainingProfile và setOnboarded(true) executed, chuyển sang FitnessTab
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_102: Combination: goal=general, experience=beginner, days=3 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Chọn goal = "general" (Tổng hợp)
  2. Chọn experience = "beginner" (Mới bắt đầu)
  3. Chọn days per week = 3
  4. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo thành công với goal="general", experience="beginner", daysPerWeek=3. getSmartDefaults("general", "beginner", 3) áp dụng đúng. setTrainingProfile và setOnboarded(true) executed, chuyển sang FitnessTab
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_103: Combination: goal=general, experience=beginner, days=4 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Chọn goal = "general" (Tổng hợp)
  2. Chọn experience = "beginner" (Mới bắt đầu)
  3. Chọn days per week = 4
  4. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo thành công với goal="general", experience="beginner", daysPerWeek=4. getSmartDefaults("general", "beginner", 4) áp dụng đúng. setTrainingProfile và setOnboarded(true) executed, chuyển sang FitnessTab
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_104: Combination: goal=general, experience=beginner, days=5 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Chọn goal = "general" (Tổng hợp)
  2. Chọn experience = "beginner" (Mới bắt đầu)
  3. Chọn days per week = 5
  4. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="general", experience="beginner", daysPerWeek=5. Profile KHÔNG chứa periodizationModel, cycleWeeks, priorityMuscles, known1rm, avgSleepHours. Chỉ có smart defaults cho beginner level
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_105: Combination: goal=general, experience=beginner, days=6 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Chọn goal = "general" (Tổng hợp)
  2. Chọn experience = "beginner" (Mới bắt đầu)
  3. Chọn days per week = 6
  4. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo thành công với goal="general", experience="beginner", daysPerWeek=6. getSmartDefaults("general", "beginner", 6) áp dụng đúng. setTrainingProfile và setOnboarded(true) executed, chuyển sang FitnessTab
- **Priority**: P3 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_106: Combination: goal=general, experience=intermediate, days=2 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "general" (Tổng hợp)
  2. Chọn experience = "intermediate" (Trung cấp)
  3. Chọn days per week = 2
  4. Verify periodization, cycle weeks, priority muscles hiển thị
  5. Verify known 1RM, avg sleep KHÔNG hiển thị
  6. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="general", experience="intermediate", daysPerWeek=2. Intermediate fields accessible (periodization, cycleWeeks, priorityMuscles). Advanced fields (known1rm, avgSleepHours) KHÔNG present trong profile
- **Priority**: P3 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_107: Combination: goal=general, experience=intermediate, days=3 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "general" (Tổng hợp)
  2. Chọn experience = "intermediate" (Trung cấp)
  3. Chọn days per week = 3
  4. Verify periodization, cycle weeks, priority muscles hiển thị
  5. Verify known 1RM, avg sleep KHÔNG hiển thị
  6. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="general", experience="intermediate", daysPerWeek=3. Intermediate fields accessible (periodization, cycleWeeks, priorityMuscles). Advanced fields (known1rm, avgSleepHours) KHÔNG present trong profile
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_108: Combination: goal=general, experience=intermediate, days=4 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "general" (Tổng hợp)
  2. Chọn experience = "intermediate" (Trung cấp)
  3. Chọn days per week = 4
  4. Verify periodization, cycle weeks, priority muscles hiển thị
  5. Verify known 1RM, avg sleep KHÔNG hiển thị
  6. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="general", experience="intermediate", daysPerWeek=4. Intermediate fields accessible (periodization, cycleWeeks, priorityMuscles). Advanced fields (known1rm, avgSleepHours) KHÔNG present trong profile
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_109: Combination: goal=general, experience=intermediate, days=5 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "general" (Tổng hợp)
  2. Chọn experience = "intermediate" (Trung cấp)
  3. Chọn days per week = 5
  4. Verify periodization, cycle weeks, priority muscles hiển thị
  5. Verify known 1RM, avg sleep KHÔNG hiển thị
  6. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="general", experience="intermediate", daysPerWeek=5. Intermediate fields accessible (periodization, cycleWeeks, priorityMuscles). Advanced fields (known1rm, avgSleepHours) KHÔNG present trong profile
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_110: Combination: goal=general, experience=intermediate, days=6 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "general" (Tổng hợp)
  2. Chọn experience = "intermediate" (Trung cấp)
  3. Chọn days per week = 6
  4. Verify periodization, cycle weeks, priority muscles hiển thị
  5. Verify known 1RM, avg sleep KHÔNG hiển thị
  6. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="general", experience="intermediate", daysPerWeek=6. Intermediate fields accessible (periodization, cycleWeeks, priorityMuscles). Advanced fields (known1rm, avgSleepHours) KHÔNG present trong profile
- **Priority**: P3 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_111: Combination: goal=general, experience=advanced, days=2 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "general" (Tổng hợp)
  2. Chọn experience = "advanced" (Nâng cao)
  3. Chọn days per week = 2
  4. Verify tất cả trường intermediate và advanced hiển thị
  5. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="general", experience="advanced", daysPerWeek=2. Tất cả fields advanced accessible. Smart defaults cho advanced level áp dụng. Form submit thành công, chuyển sang FitnessTab
- **Priority**: P0 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_112: Combination: goal=general, experience=advanced, days=3 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "general" (Tổng hợp)
  2. Chọn experience = "advanced" (Nâng cao)
  3. Chọn days per week = 3
  4. Verify tất cả trường intermediate và advanced hiển thị
  5. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="general", experience="advanced", daysPerWeek=3. Tất cả fields advanced accessible. Smart defaults cho advanced level áp dụng. Form submit thành công, chuyển sang FitnessTab
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_113: Combination: goal=general, experience=advanced, days=4 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "general" (Tổng hợp)
  2. Chọn experience = "advanced" (Nâng cao)
  3. Chọn days per week = 4
  4. Verify tất cả trường intermediate và advanced hiển thị
  5. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="general", experience="advanced", daysPerWeek=4. Tất cả fields advanced accessible. Smart defaults cho advanced level áp dụng. Form submit thành công, chuyển sang FitnessTab
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_114: Combination: goal=general, experience=advanced, days=5 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "general" (Tổng hợp)
  2. Chọn experience = "advanced" (Nâng cao)
  3. Chọn days per week = 5
  4. Verify tất cả trường intermediate và advanced hiển thị
  5. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="general", experience="advanced", daysPerWeek=5. Tất cả fields advanced accessible. Smart defaults cho advanced level áp dụng. Form submit thành công, chuyển sang FitnessTab
- **Priority**: P0 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_115: Combination: goal=general, experience=advanced, days=6 → submit thành công
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn goal = "general" (Tổng hợp)
  2. Chọn experience = "advanced" (Nâng cao)
  3. Chọn days per week = 6
  4. Verify tất cả trường intermediate và advanced hiển thị
  5. Click nút "Bắt đầu" (submit)
- **Expected Result**: Profile tạo với goal="general", experience="advanced", daysPerWeek=6. Tất cả fields advanced accessible. Smart defaults cho advanced level áp dụng. Form submit thành công, chuyển sang FitnessTab
- **Priority**: P3 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_116: Equipment đơn lẻ: chỉ chọn barbell (Thanh tạ)
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn equipment nào
- **Steps**:
  1. Click "barbell" (Thanh tạ)
  2. Verify aria-checked="true" và check icon hiển thị
  3. Verify các equipment khác vẫn aria-checked="false"
  4. Submit form
- **Expected Result**: equipment[] chỉ chứa ["barbell"], profile.availableEquipment = ["barbell"], nút barbell có style active (bg-emerald-500)
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_117: Equipment đơn lẻ: chỉ chọn dumbbell (Tạ tay)
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn equipment nào
- **Steps**:
  1. Click "dumbbell" (Tạ tay)
  2. Verify aria-checked="true" và check icon hiển thị
  3. Verify các equipment khác vẫn aria-checked="false"
  4. Submit form
- **Expected Result**: equipment[] chỉ chứa ["dumbbell"], profile.availableEquipment = ["dumbbell"], nút dumbbell có style active (bg-emerald-500)
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_118: Equipment đơn lẻ: chỉ chọn machine (Máy tập)
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn equipment nào
- **Steps**:
  1. Click "machine" (Máy tập)
  2. Verify aria-checked="true" và check icon hiển thị
  3. Verify các equipment khác vẫn aria-checked="false"
  4. Submit form
- **Expected Result**: equipment[] chỉ chứa ["machine"], profile.availableEquipment = ["machine"], nút machine có style active (bg-emerald-500)
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_119: Equipment đơn lẻ: chỉ chọn cable (Cáp kéo)
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn equipment nào
- **Steps**:
  1. Click "cable" (Cáp kéo)
  2. Verify aria-checked="true" và check icon hiển thị
  3. Verify các equipment khác vẫn aria-checked="false"
  4. Submit form
- **Expected Result**: equipment[] chỉ chứa ["cable"], profile.availableEquipment = ["cable"], nút cable có style active (bg-emerald-500)
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_120: Equipment đơn lẻ: chỉ chọn bodyweight (Tự trọng)
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn equipment nào
- **Steps**:
  1. Click "bodyweight" (Tự trọng)
  2. Verify aria-checked="true" và check icon hiển thị
  3. Verify các equipment khác vẫn aria-checked="false"
  4. Submit form
- **Expected Result**: equipment[] chỉ chứa ["bodyweight"], profile.availableEquipment = ["bodyweight"], nút bodyweight có style active (bg-emerald-500)
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_121: Equipment đơn lẻ: chỉ chọn bands (Dây kháng lực)
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn equipment nào
- **Steps**:
  1. Click "bands" (Dây kháng lực)
  2. Verify aria-checked="true" và check icon hiển thị
  3. Verify các equipment khác vẫn aria-checked="false"
  4. Submit form
- **Expected Result**: equipment[] chỉ chứa ["bands"], profile.availableEquipment = ["bands"], nút bands có style active (bg-emerald-500)
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_122: Equipment cặp: barbell + dumbbell
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn equipment nào
- **Steps**:
  1. Click "barbell" (Thanh tạ) → verify selected
  2. Click "dumbbell" (Tạ tay) → verify selected
  3. Verify cả 2 có aria-checked="true" và check icon
  4. Submit form
- **Expected Result**: equipment[] chứa ["barbell", "dumbbell"], cả 2 nút hiển thị style active, các equipment khác inactive
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_123: Equipment cặp: dumbbell + machine
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn equipment nào
- **Steps**:
  1. Click "dumbbell" (Tạ tay) → verify selected
  2. Click "machine" (Máy tập) → verify selected
  3. Verify cả 2 có aria-checked="true" và check icon
  4. Submit form
- **Expected Result**: equipment[] chứa ["dumbbell", "machine"], cả 2 nút hiển thị style active, các equipment khác inactive
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_124: Equipment cặp: machine + cable
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn equipment nào
- **Steps**:
  1. Click "machine" (Máy tập) → verify selected
  2. Click "cable" (Cáp kéo) → verify selected
  3. Verify cả 2 có aria-checked="true" và check icon
  4. Submit form
- **Expected Result**: equipment[] chứa ["machine", "cable"], cả 2 nút hiển thị style active, các equipment khác inactive
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_125: Equipment cặp: cable + bodyweight
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn equipment nào
- **Steps**:
  1. Click "cable" (Cáp kéo) → verify selected
  2. Click "bodyweight" (Tự trọng) → verify selected
  3. Verify cả 2 có aria-checked="true" và check icon
  4. Submit form
- **Expected Result**: equipment[] chứa ["cable", "bodyweight"], cả 2 nút hiển thị style active, các equipment khác inactive
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_126: Equipment cặp: bodyweight + bands
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn equipment nào
- **Steps**:
  1. Click "bodyweight" (Tự trọng) → verify selected
  2. Click "bands" (Dây kháng lực) → verify selected
  3. Verify cả 2 có aria-checked="true" và check icon
  4. Submit form
- **Expected Result**: equipment[] chứa ["bodyweight", "bands"], cả 2 nút hiển thị style active, các equipment khác inactive
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_127: Equipment cặp: barbell + bands
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn equipment nào
- **Steps**:
  1. Click "barbell" (Thanh tạ) → verify selected
  2. Click "bands" (Dây kháng lực) → verify selected
  3. Verify cả 2 có aria-checked="true" và check icon
  4. Submit form
- **Expected Result**: equipment[] chứa ["barbell", "bands"], cả 2 nút hiển thị style active, các equipment khác inactive
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_128: Equipment bộ ba: barbell + dumbbell + machine
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn equipment nào
- **Steps**:
  1. Click "barbell" (Thanh tạ) → verify selected
  2. Click "dumbbell" (Tạ tay) → verify selected
  3. Click "machine" (Máy tập) → verify selected
  4. Submit form
- **Expected Result**: equipment[] chứa ["barbell", "dumbbell", "machine"], 3 nút active, 3 nút inactive
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_129: Equipment bộ ba: cable + bodyweight + bands
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn equipment nào
- **Steps**:
  1. Click "cable" (Cáp kéo) → verify selected
  2. Click "bodyweight" (Tự trọng) → verify selected
  3. Click "bands" (Dây kháng lực) → verify selected
  4. Submit form
- **Expected Result**: equipment[] chứa ["cable", "bodyweight", "bands"], 3 nút active, 3 nút inactive
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_130: Equipment bộ ba: barbell + cable + bodyweight
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn equipment nào
- **Steps**:
  1. Click "barbell" (Thanh tạ) → verify selected
  2. Click "cable" (Cáp kéo) → verify selected
  3. Click "bodyweight" (Tự trọng) → verify selected
  4. Submit form
- **Expected Result**: equipment[] chứa ["barbell", "cable", "bodyweight"], 3 nút active, 3 nút inactive
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_131: Equipment bộ ba: dumbbell + machine + bands
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn equipment nào
- **Steps**:
  1. Click "dumbbell" (Tạ tay) → verify selected
  2. Click "machine" (Máy tập) → verify selected
  3. Click "bands" (Dây kháng lực) → verify selected
  4. Submit form
- **Expected Result**: equipment[] chứa ["dumbbell", "machine", "bands"], 3 nút active, 3 nút inactive
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_132: Equipment tất cả trừ barbell (Thanh tạ)
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn equipment nào
- **Steps**:
  1. Click lần lượt tất cả equipment trừ "barbell"
  2. Verify barbell vẫn aria-checked="false"
  3. Verify 5 equipment còn lại có aria-checked="true"
  4. Submit form
- **Expected Result**: equipment[] chứa 5 items [dumbbell, machine, cable, bodyweight, bands], không chứa "barbell". 5 nút active, 1 nút (barbell) inactive
- **Priority**: P3 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_133: Equipment tất cả trừ dumbbell (Tạ tay)
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn equipment nào
- **Steps**:
  1. Click lần lượt tất cả equipment trừ "dumbbell"
  2. Verify dumbbell vẫn aria-checked="false"
  3. Verify 5 equipment còn lại có aria-checked="true"
  4. Submit form
- **Expected Result**: equipment[] chứa 5 items [barbell, machine, cable, bodyweight, bands], không chứa "dumbbell". 5 nút active, 1 nút (dumbbell) inactive
- **Priority**: P3 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_134: Equipment tất cả trừ machine (Máy tập)
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn equipment nào
- **Steps**:
  1. Click lần lượt tất cả equipment trừ "machine"
  2. Verify machine vẫn aria-checked="false"
  3. Verify 5 equipment còn lại có aria-checked="true"
  4. Submit form
- **Expected Result**: equipment[] chứa 5 items [barbell, dumbbell, cable, bodyweight, bands], không chứa "machine". 5 nút active, 1 nút (machine) inactive
- **Priority**: P3 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_135: Equipment tất cả trừ cable (Cáp kéo)
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn equipment nào
- **Steps**:
  1. Click lần lượt tất cả equipment trừ "cable"
  2. Verify cable vẫn aria-checked="false"
  3. Verify 5 equipment còn lại có aria-checked="true"
  4. Submit form
- **Expected Result**: equipment[] chứa 5 items [barbell, dumbbell, machine, bodyweight, bands], không chứa "cable". 5 nút active, 1 nút (cable) inactive
- **Priority**: P3 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_136: Injury đơn lẻ: chỉ chọn shoulders (Vai)
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn injury nào
- **Steps**:
  1. Click "shoulders" (Vai)
  2. Verify aria-checked="true" và check icon hiển thị
  3. Verify các injury khác vẫn aria-checked="false"
  4. Submit form
- **Expected Result**: injuries[] chỉ chứa ["shoulders"], profile.injuryAreas = ["shoulders"], nút shoulders có style active
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_137: Injury đơn lẻ: chỉ chọn lower_back (Lưng dưới)
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn injury nào
- **Steps**:
  1. Click "lower_back" (Lưng dưới)
  2. Verify aria-checked="true" và check icon hiển thị
  3. Verify các injury khác vẫn aria-checked="false"
  4. Submit form
- **Expected Result**: injuries[] chỉ chứa ["lower_back"], profile.injuryAreas = ["lower_back"], nút lower_back có style active
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_138: Injury đơn lẻ: chỉ chọn knees (Đầu gối)
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn injury nào
- **Steps**:
  1. Click "knees" (Đầu gối)
  2. Verify aria-checked="true" và check icon hiển thị
  3. Verify các injury khác vẫn aria-checked="false"
  4. Submit form
- **Expected Result**: injuries[] chỉ chứa ["knees"], profile.injuryAreas = ["knees"], nút knees có style active
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_139: Injury đơn lẻ: chỉ chọn wrists (Cổ tay)
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn injury nào
- **Steps**:
  1. Click "wrists" (Cổ tay)
  2. Verify aria-checked="true" và check icon hiển thị
  3. Verify các injury khác vẫn aria-checked="false"
  4. Submit form
- **Expected Result**: injuries[] chỉ chứa ["wrists"], profile.injuryAreas = ["wrists"], nút wrists có style active
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_140: Injury đơn lẻ: chỉ chọn neck (Cổ)
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn injury nào
- **Steps**:
  1. Click "neck" (Cổ)
  2. Verify aria-checked="true" và check icon hiển thị
  3. Verify các injury khác vẫn aria-checked="false"
  4. Submit form
- **Expected Result**: injuries[] chỉ chứa ["neck"], profile.injuryAreas = ["neck"], nút neck có style active
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_141: Injury đơn lẻ: chỉ chọn hips (Hông)
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn injury nào
- **Steps**:
  1. Click "hips" (Hông)
  2. Verify aria-checked="true" và check icon hiển thị
  3. Verify các injury khác vẫn aria-checked="false"
  4. Submit form
- **Expected Result**: injuries[] chỉ chứa ["hips"], profile.injuryAreas = ["hips"], nút hips có style active
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_142: Injury nhiều vùng: chọn vai và đầu gối
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn injury nào
- **Steps**:
  1. Click "shoulders" (Vai) → verify selected
  2. Click "knees" (Đầu gối) → verify selected
  3. Verify 2 injuries đã chọn
  4. Submit form
- **Expected Result**: injuries[] chứa ["shoulders", "knees"], tất cả nút tương ứng hiển thị style active và check icon
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_143: Injury nhiều vùng: chọn lưng dưới, cổ tay và hông
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn injury nào
- **Steps**:
  1. Click "lower_back" (Lưng dưới) → verify selected
  2. Click "wrists" (Cổ tay) → verify selected
  3. Click "hips" (Hông) → verify selected
  4. Verify 3 injuries đã chọn
  5. Submit form
- **Expected Result**: injuries[] chứa ["lower_back", "wrists", "hips"], tất cả nút tương ứng hiển thị style active và check icon
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_144: Injury nhiều vùng: chọn tất cả 6 vùng
- **Pre-conditions**: Onboarding hiển thị, customize expanded, chưa chọn injury nào
- **Steps**:
  1. Click "shoulders" (Vai) → verify selected
  2. Click "lower_back" (Lưng dưới) → verify selected
  3. Click "knees" (Đầu gối) → verify selected
  4. Click "wrists" (Cổ tay) → verify selected
  5. Click "neck" (Cổ) → verify selected
  6. Click "hips" (Hông) → verify selected
  7. Verify 6 injuries đã chọn
  8. Submit form
- **Expected Result**: injuries[] chứa ["shoulders", "lower_back", "knees", "wrists", "neck", "hips"], tất cả nút tương ứng hiển thị style active và check icon
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_145: Injury chọn tất cả rồi deselect vai
- **Pre-conditions**: Onboarding hiển thị, customize expanded
- **Steps**:
  1. Click lần lượt tất cả 6 injuries để select all
  2. Click lại "shoulders" (Vai) → deselect
  3. Verify injuries[] chỉ còn 5 items
- **Expected Result**: Sau deselect, injuries[] = ["lower_back", "knees", "wrists", "neck", "hips"] (5 items). Các nút deselected có aria-checked="false", không còn check icon
- **Priority**: P3 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_146: Injury chọn tất cả rồi deselect đầu gối và hông
- **Pre-conditions**: Onboarding hiển thị, customize expanded
- **Steps**:
  1. Click lần lượt tất cả 6 injuries để select all
  2. Click lại "knees" (Đầu gối) → deselect
  3. Click lại "hips" (Hông) → deselect
  4. Verify injuries[] chỉ còn 4 items
- **Expected Result**: Sau deselect, injuries[] = ["shoulders", "lower_back", "wrists", "neck"] (4 items). Các nút deselected có aria-checked="false", không còn check icon
- **Priority**: P3 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_147: Injury chọn tất cả rồi deselect tất cả
- **Pre-conditions**: Onboarding hiển thị, customize expanded
- **Steps**:
  1. Click lần lượt tất cả 6 injuries để select all
  2. Click lại "shoulders" (Vai) → deselect
  3. Click lại "lower_back" (Lưng dưới) → deselect
  4. Click lại "knees" (Đầu gối) → deselect
  5. Click lại "wrists" (Cổ tay) → deselect
  6. Click lại "neck" (Cổ) → deselect
  7. Click lại "hips" (Hông) → deselect
  8. Verify injuries[] chỉ còn 0 items
- **Expected Result**: Sau deselect, injuries[] = [rỗng] (0 items). Các nút deselected có aria-checked="false", không còn check icon
- **Priority**: P3 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_148: Priority muscle đơn lẻ: chọn chest (Ngực)
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded, chưa chọn muscle nào
- **Steps**:
  1. Click "chest" (Ngực)
  2. Verify aria-checked="true" và style active
  3. Verify priorityMuscles.length = 1
  4. Submit form
- **Expected Result**: priorityMuscles[] = ["chest"], profile.priorityMuscles chứa "chest", nút chest hiển thị active
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_149: Priority muscle đơn lẻ: chọn back (Lưng)
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded, chưa chọn muscle nào
- **Steps**:
  1. Click "back" (Lưng)
  2. Verify aria-checked="true" và style active
  3. Verify priorityMuscles.length = 1
  4. Submit form
- **Expected Result**: priorityMuscles[] = ["back"], profile.priorityMuscles chứa "back", nút back hiển thị active
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_150: Priority muscle đơn lẻ: chọn shoulders (Vai)
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded, chưa chọn muscle nào
- **Steps**:
  1. Click "shoulders" (Vai)
  2. Verify aria-checked="true" và style active
  3. Verify priorityMuscles.length = 1
  4. Submit form
- **Expected Result**: priorityMuscles[] = ["shoulders"], profile.priorityMuscles chứa "shoulders", nút shoulders hiển thị active
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_151: Priority muscle đơn lẻ: chọn legs (Chân)
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded, chưa chọn muscle nào
- **Steps**:
  1. Click "legs" (Chân)
  2. Verify aria-checked="true" và style active
  3. Verify priorityMuscles.length = 1
  4. Submit form
- **Expected Result**: priorityMuscles[] = ["legs"], profile.priorityMuscles chứa "legs", nút legs hiển thị active
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_152: Priority muscle đơn lẻ: chọn arms (Tay)
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded, chưa chọn muscle nào
- **Steps**:
  1. Click "arms" (Tay)
  2. Verify aria-checked="true" và style active
  3. Verify priorityMuscles.length = 1
  4. Submit form
- **Expected Result**: priorityMuscles[] = ["arms"], profile.priorityMuscles chứa "arms", nút arms hiển thị active
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_153: Priority muscle đơn lẻ: chọn core (Cơ lõi)
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded, chưa chọn muscle nào
- **Steps**:
  1. Click "core" (Cơ lõi)
  2. Verify aria-checked="true" và style active
  3. Verify priorityMuscles.length = 1
  4. Submit form
- **Expected Result**: priorityMuscles[] = ["core"], profile.priorityMuscles chứa "core", nút core hiển thị active
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_154: Priority muscle đơn lẻ: chọn glutes (Mông)
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded, chưa chọn muscle nào
- **Steps**:
  1. Click "glutes" (Mông)
  2. Verify aria-checked="true" và style active
  3. Verify priorityMuscles.length = 1
  4. Submit form
- **Expected Result**: priorityMuscles[] = ["glutes"], profile.priorityMuscles chứa "glutes", nút glutes hiển thị active
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_155: Priority muscle bộ ba tối đa: chest + back + shoulders
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded, chưa chọn muscle nào
- **Steps**:
  1. Click "chest" (Ngực) → selected (1/3)
  2. Click "back" (Lưng) → selected (2/3)
  3. Click "shoulders" (Vai) → selected (3/3)
  4. Verify tất cả 3 có aria-checked="true"
  5. Submit form
- **Expected Result**: priorityMuscles[] = ["chest", "back", "shoulders"] (đạt MAX_PRIORITY_MUSCLES=3), profile tạo thành công với đúng 3 muscles
- **Priority**: P1 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_156: Priority muscle bộ ba tối đa: legs + arms + core
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded, chưa chọn muscle nào
- **Steps**:
  1. Click "legs" (Chân) → selected (1/3)
  2. Click "arms" (Tay) → selected (2/3)
  3. Click "core" (Cơ lõi) → selected (3/3)
  4. Verify tất cả 3 có aria-checked="true"
  5. Submit form
- **Expected Result**: priorityMuscles[] = ["legs", "arms", "core"] (đạt MAX_PRIORITY_MUSCLES=3), profile tạo thành công với đúng 3 muscles
- **Priority**: P1 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_157: Priority muscle bộ ba tối đa: chest + legs + glutes
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded, chưa chọn muscle nào
- **Steps**:
  1. Click "chest" (Ngực) → selected (1/3)
  2. Click "legs" (Chân) → selected (2/3)
  3. Click "glutes" (Mông) → selected (3/3)
  4. Verify tất cả 3 có aria-checked="true"
  5. Submit form
- **Expected Result**: priorityMuscles[] = ["chest", "legs", "glutes"] (đạt MAX_PRIORITY_MUSCLES=3), profile tạo thành công với đúng 3 muscles
- **Priority**: P1 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_158: Priority muscle bộ ba tối đa: back + shoulders + arms
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded, chưa chọn muscle nào
- **Steps**:
  1. Click "back" (Lưng) → selected (1/3)
  2. Click "shoulders" (Vai) → selected (2/3)
  3. Click "arms" (Tay) → selected (3/3)
  4. Verify tất cả 3 có aria-checked="true"
  5. Submit form
- **Expected Result**: priorityMuscles[] = ["back", "shoulders", "arms"] (đạt MAX_PRIORITY_MUSCLES=3), profile tạo thành công với đúng 3 muscles
- **Priority**: P1 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_159: Priority muscle bộ ba tối đa: core + glutes + chest
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded, chưa chọn muscle nào
- **Steps**:
  1. Click "core" (Cơ lõi) → selected (1/3)
  2. Click "glutes" (Mông) → selected (2/3)
  3. Click "chest" (Ngực) → selected (3/3)
  4. Verify tất cả 3 có aria-checked="true"
  5. Submit form
- **Expected Result**: priorityMuscles[] = ["core", "glutes", "chest"] (đạt MAX_PRIORITY_MUSCLES=3), profile tạo thành công với đúng 3 muscles
- **Priority**: P1 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_160: Priority muscle chặn thứ 4: đã có chest/back/shoulders → thử thêm legs
- **Pre-conditions**: Experience = intermediate+, customize expanded, đã chọn 3 muscles: chest, back, shoulders
- **Steps**:
  1. Verify 3 muscles (chest, back, shoulders) đã selected
  2. Click "legs" (Chân) — attempt chọn muscle thứ 4
  3. Verify "legs" vẫn aria-checked="false"
  4. Verify priorityMuscles.length vẫn = 3
- **Expected Result**: "legs" KHÔNG được thêm vào (bị block bởi MAX_PRIORITY_MUSCLES=3), priorityMuscles vẫn = ['chest', 'back', 'shoulders'], không có thay đổi state
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_161: Priority muscle chặn thứ 4: đã có legs/arms/core → thử thêm glutes
- **Pre-conditions**: Experience = intermediate+, customize expanded, đã chọn 3 muscles: legs, arms, core
- **Steps**:
  1. Verify 3 muscles (legs, arms, core) đã selected
  2. Click "glutes" (Mông) — attempt chọn muscle thứ 4
  3. Verify "glutes" vẫn aria-checked="false"
  4. Verify priorityMuscles.length vẫn = 3
- **Expected Result**: "glutes" KHÔNG được thêm vào (bị block bởi MAX_PRIORITY_MUSCLES=3), priorityMuscles vẫn = ['legs', 'arms', 'core'], không có thay đổi state
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_162: Priority muscle chặn thứ 4: đã có chest/legs/glutes → thử thêm back
- **Pre-conditions**: Experience = intermediate+, customize expanded, đã chọn 3 muscles: chest, legs, glutes
- **Steps**:
  1. Verify 3 muscles (chest, legs, glutes) đã selected
  2. Click "back" (Lưng) — attempt chọn muscle thứ 4
  3. Verify "back" vẫn aria-checked="false"
  4. Verify priorityMuscles.length vẫn = 3
- **Expected Result**: "back" KHÔNG được thêm vào (bị block bởi MAX_PRIORITY_MUSCLES=3), priorityMuscles vẫn = ['chest', 'legs', 'glutes'], không có thay đổi state
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_163: Periodization + Cycle: linear (Tuyến tính) × 4 tuần
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded
- **Steps**:
  1. Chọn periodization = "linear" (Tuyến tính)
  2. Chọn cycle weeks = 4
  3. Verify cả 2 selections có aria-checked="true"
  4. Submit form
- **Expected Result**: Profile tạo với periodizationModel="linear", cycleWeeks=4. Cả 2 giá trị lưu đúng trong trainingProfile, form submit thành công
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_164: Periodization + Cycle: linear (Tuyến tính) × 6 tuần
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded
- **Steps**:
  1. Chọn periodization = "linear" (Tuyến tính)
  2. Chọn cycle weeks = 6
  3. Verify cả 2 selections có aria-checked="true"
  4. Submit form
- **Expected Result**: Profile tạo với periodizationModel="linear", cycleWeeks=6. Cả 2 giá trị lưu đúng trong trainingProfile, form submit thành công
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_165: Periodization + Cycle: linear (Tuyến tính) × 8 tuần
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded
- **Steps**:
  1. Chọn periodization = "linear" (Tuyến tính)
  2. Chọn cycle weeks = 8
  3. Verify cả 2 selections có aria-checked="true"
  4. Submit form
- **Expected Result**: Profile tạo với periodizationModel="linear", cycleWeeks=8. Cả 2 giá trị lưu đúng trong trainingProfile, form submit thành công
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_166: Periodization + Cycle: linear (Tuyến tính) × 12 tuần
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded
- **Steps**:
  1. Chọn periodization = "linear" (Tuyến tính)
  2. Chọn cycle weeks = 12
  3. Verify cả 2 selections có aria-checked="true"
  4. Submit form
- **Expected Result**: Profile tạo với periodizationModel="linear", cycleWeeks=12. Cả 2 giá trị lưu đúng trong trainingProfile, form submit thành công
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_167: Periodization + Cycle: undulating (Dao động) × 4 tuần
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded
- **Steps**:
  1. Chọn periodization = "undulating" (Dao động)
  2. Chọn cycle weeks = 4
  3. Verify cả 2 selections có aria-checked="true"
  4. Submit form
- **Expected Result**: Profile tạo với periodizationModel="undulating", cycleWeeks=4. Cả 2 giá trị lưu đúng trong trainingProfile, form submit thành công
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_168: Periodization + Cycle: undulating (Dao động) × 6 tuần
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded
- **Steps**:
  1. Chọn periodization = "undulating" (Dao động)
  2. Chọn cycle weeks = 6
  3. Verify cả 2 selections có aria-checked="true"
  4. Submit form
- **Expected Result**: Profile tạo với periodizationModel="undulating", cycleWeeks=6. Cả 2 giá trị lưu đúng trong trainingProfile, form submit thành công
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_169: Periodization + Cycle: undulating (Dao động) × 8 tuần
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded
- **Steps**:
  1. Chọn periodization = "undulating" (Dao động)
  2. Chọn cycle weeks = 8
  3. Verify cả 2 selections có aria-checked="true"
  4. Submit form
- **Expected Result**: Profile tạo với periodizationModel="undulating", cycleWeeks=8. Cả 2 giá trị lưu đúng trong trainingProfile, form submit thành công
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_170: Periodization + Cycle: undulating (Dao động) × 12 tuần
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded
- **Steps**:
  1. Chọn periodization = "undulating" (Dao động)
  2. Chọn cycle weeks = 12
  3. Verify cả 2 selections có aria-checked="true"
  4. Submit form
- **Expected Result**: Profile tạo với periodizationModel="undulating", cycleWeeks=12. Cả 2 giá trị lưu đúng trong trainingProfile, form submit thành công
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_171: Periodization + Cycle: block (Khối) × 4 tuần
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded
- **Steps**:
  1. Chọn periodization = "block" (Khối)
  2. Chọn cycle weeks = 4
  3. Verify cả 2 selections có aria-checked="true"
  4. Submit form
- **Expected Result**: Profile tạo với periodizationModel="block", cycleWeeks=4. Cả 2 giá trị lưu đúng trong trainingProfile, form submit thành công
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_172: Periodization + Cycle: block (Khối) × 6 tuần
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded
- **Steps**:
  1. Chọn periodization = "block" (Khối)
  2. Chọn cycle weeks = 6
  3. Verify cả 2 selections có aria-checked="true"
  4. Submit form
- **Expected Result**: Profile tạo với periodizationModel="block", cycleWeeks=6. Cả 2 giá trị lưu đúng trong trainingProfile, form submit thành công
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_173: Periodization + Cycle: block (Khối) × 8 tuần
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded
- **Steps**:
  1. Chọn periodization = "block" (Khối)
  2. Chọn cycle weeks = 8
  3. Verify cả 2 selections có aria-checked="true"
  4. Submit form
- **Expected Result**: Profile tạo với periodizationModel="block", cycleWeeks=8. Cả 2 giá trị lưu đúng trong trainingProfile, form submit thành công
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_174: Periodization + Cycle: block (Khối) × 12 tuần
- **Pre-conditions**: Experience = intermediate hoặc advanced, customize expanded
- **Steps**:
  1. Chọn periodization = "block" (Khối)
  2. Chọn cycle weeks = 12
  3. Verify cả 2 selections có aria-checked="true"
  4. Submit form
- **Expected Result**: Profile tạo với periodizationModel="block", cycleWeeks=12. Cả 2 giá trị lưu đúng trong trainingProfile, form submit thành công
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_175: Cardio sessions/tuần: chọn giá trị 0
- **Pre-conditions**: Onboarding hiển thị, customize expanded
- **Steps**:
  1. Click giá trị "0" trong cardio sessions selector
  2. Verify aria-checked="true" trên nút được chọn
  3. Verify các giá trị khác aria-checked="false"
  4. Submit form
- **Expected Result**: cardioSessions = 0, profile.cardioSessionsPerWeek = 0. Không có buổi cardio nào được lên kế hoạch
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_176: Cardio sessions/tuần: chọn giá trị 1
- **Pre-conditions**: Onboarding hiển thị, customize expanded
- **Steps**:
  1. Click giá trị "1" trong cardio sessions selector
  2. Verify aria-checked="true" trên nút được chọn
  3. Verify các giá trị khác aria-checked="false"
  4. Submit form
- **Expected Result**: cardioSessions = 1, profile.cardioSessionsPerWeek = 1. 1 buổi cardio/tuần được ghi nhận
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_177: Cardio sessions/tuần: chọn giá trị 2
- **Pre-conditions**: Onboarding hiển thị, customize expanded
- **Steps**:
  1. Click giá trị "2" trong cardio sessions selector
  2. Verify aria-checked="true" trên nút được chọn
  3. Verify các giá trị khác aria-checked="false"
  4. Submit form
- **Expected Result**: cardioSessions = 2, profile.cardioSessionsPerWeek = 2. 2 buổi cardio/tuần được ghi nhận
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_178: Cardio sessions/tuần: chọn giá trị 3
- **Pre-conditions**: Onboarding hiển thị, customize expanded
- **Steps**:
  1. Click giá trị "3" trong cardio sessions selector
  2. Verify aria-checked="true" trên nút được chọn
  3. Verify các giá trị khác aria-checked="false"
  4. Submit form
- **Expected Result**: cardioSessions = 3, profile.cardioSessionsPerWeek = 3. 3 buổi cardio/tuần được ghi nhận
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_179: Cardio sessions/tuần: chọn giá trị 4
- **Pre-conditions**: Onboarding hiển thị, customize expanded
- **Steps**:
  1. Click giá trị "4" trong cardio sessions selector
  2. Verify aria-checked="true" trên nút được chọn
  3. Verify các giá trị khác aria-checked="false"
  4. Submit form
- **Expected Result**: cardioSessions = 4, profile.cardioSessionsPerWeek = 4. 4 buổi cardio/tuần được ghi nhận
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_180: Cardio sessions/tuần: chọn giá trị 5
- **Pre-conditions**: Onboarding hiển thị, customize expanded
- **Steps**:
  1. Click giá trị "5" trong cardio sessions selector
  2. Verify aria-checked="true" trên nút được chọn
  3. Verify các giá trị khác aria-checked="false"
  4. Submit form
- **Expected Result**: cardioSessions = 5, profile.cardioSessionsPerWeek = 5. 5 buổi cardio/tuần được ghi nhận
- **Priority**: P1 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_FIT_181: Session duration: chọn 30 phút
- **Pre-conditions**: Onboarding hiển thị, customize expanded
- **Steps**:
  1. Click "30" trong session duration selector
  2. Verify aria-checked="true" trên nút 30
  3. Verify các duration khác aria-checked="false"
  4. Submit form
- **Expected Result**: sessionDuration = 30, profile.sessionDurationMin = 30. Nút 30 hiển thị style active (bg-emerald-500), các nút khác inactive
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_182: Session duration: chọn 45 phút
- **Pre-conditions**: Onboarding hiển thị, customize expanded
- **Steps**:
  1. Click "45" trong session duration selector
  2. Verify aria-checked="true" trên nút 45
  3. Verify các duration khác aria-checked="false"
  4. Submit form
- **Expected Result**: sessionDuration = 45, profile.sessionDurationMin = 45. Nút 45 hiển thị style active (bg-emerald-500), các nút khác inactive
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_183: Session duration: chọn 60 phút
- **Pre-conditions**: Onboarding hiển thị, customize expanded
- **Steps**:
  1. Click "60" trong session duration selector
  2. Verify aria-checked="true" trên nút 60
  3. Verify các duration khác aria-checked="false"
  4. Submit form
- **Expected Result**: sessionDuration = 60, profile.sessionDurationMin = 60. Nút 60 hiển thị style active (bg-emerald-500), các nút khác inactive
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_184: Session duration: chọn 90 phút
- **Pre-conditions**: Onboarding hiển thị, customize expanded
- **Steps**:
  1. Click "90" trong session duration selector
  2. Verify aria-checked="true" trên nút 90
  3. Verify các duration khác aria-checked="false"
  4. Submit form
- **Expected Result**: sessionDuration = 90, profile.sessionDurationMin = 90. Nút 90 hiển thị style active (bg-emerald-500), các nút khác inactive
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_185: Điền form → switch tab → quay lại → dữ liệu giữ nguyên
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, nhiều tab trong app
- **Steps**:
  1. Chọn goal = "endurance", experience = "intermediate", days = 5
  2. Chuyển sang tab khác (ví dụ: Nutrition)
  3. Quay lại tab Fitness
  4. Quan sát onboarding form
- **Expected Result**: Tất cả selections giữ nguyên: goal="endurance" (aria-checked="true"), experience="intermediate", daysPerWeek=5. Form state persist qua tab switch
- **Priority**: P0 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_186: Điền customize → collapse → expand → dữ liệu giữ nguyên
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Chọn session duration = 45
  2. Chọn equipment: barbell, dumbbell
  3. Chọn injury: knees
  4. Click nút tùy chỉnh để collapse
  5. Click nút tùy chỉnh để expand lại
  6. Quan sát tất cả fields trong customize section
- **Expected Result**: sessionDuration=45, equipment=[barbell,dumbbell], injuries=[knees] — tất cả giữ nguyên sau collapse/expand. aria-checked values không thay đổi
- **Priority**: P0 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_187: Đổi experience beginner → intermediate → fields hiển thị ngay lập tức
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded, experience = beginner
- **Steps**:
  1. Verify không thấy periodization, cycle weeks, priority muscles
  2. Click experience = "intermediate"
  3. Quan sát customize section ngay lập tức (không cần reload)
- **Expected Result**: Ngay khi click intermediate, các trường periodization, cycle weeks, priority muscles xuất hiện trong DOM. Không cần collapse/expand lại. Transition mượt mà
- **Priority**: P0 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_188: Đổi experience intermediate → advanced → fields advanced xuất hiện
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded, experience = intermediate
- **Steps**:
  1. Verify thấy periodization, cycle weeks, priority muscles
  2. Verify KHÔNG thấy known 1RM, avg sleep
  3. Click experience = "advanced"
  4. Quan sát customize section
- **Expected Result**: Giữ nguyên intermediate fields + thêm: 4 input Known 1RM (squat/bench/deadlift/ohp) và input Avg sleep hours. Tất cả xuất hiện ngay lập tức
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_189: Đổi advanced → beginner → fields nâng cao biến mất
- **Pre-conditions**: isOnboarded = false, customize expanded, experience = advanced, đã điền 1RM và sleep
- **Steps**:
  1. Verify thấy tất cả advanced fields
  2. Nhập squat 1RM = "100", avg sleep = "8"
  3. Click experience = "beginner"
  4. Quan sát customize section
- **Expected Result**: Tất cả intermediate và advanced fields biến mất: periodization, cycle weeks, priority muscles, known 1RM, avg sleep. Chỉ còn: session duration, equipment, injuries, cardio sessions
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_190: Đổi beginner → advanced → beginner → fields ẩn lại hoàn toàn
- **Pre-conditions**: isOnboarded = false, customize expanded, experience = beginner
- **Steps**:
  1. Click experience = "advanced" → verify all fields visible
  2. Chọn periodization = "block", nhập squat = "120"
  3. Click experience = "beginner"
  4. Verify advanced/intermediate fields ẩn
  5. Click experience = "advanced" lại
  6. Quan sát giá trị periodization và squat 1RM
- **Expected Result**: Khi quay lại advanced, periodization và squat 1RM values có thể reset hoặc giữ nguyên tùy implementation. Fields hiển thị đúng theo experience level hiện tại
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_191: Submit form → verify onboarding ẩn và tabs hiện
- **Pre-conditions**: isOnboarded = false, đã điền đầy đủ onboarding form
- **Steps**:
  1. Chọn goal, experience, days
  2. Click submit
  3. Kiểm tra DOM cho FitnessOnboarding
  4. Kiểm tra DOM cho SubTabBar
- **Expected Result**: FitnessOnboarding component unmount hoàn toàn (không còn trong DOM). SubTabBar xuất hiện với 4 tabs. Transition mượt mà, không flicker
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_192: Thay đổi goal sau khi đã chọn customize options
- **Pre-conditions**: isOnboarded = false, customize expanded, đã chọn equipment và injuries
- **Steps**:
  1. Chọn goal = "strength"
  2. Expand customize, chọn equipment=[barbell], injuries=[shoulders]
  3. Đổi goal = "endurance"
  4. Quan sát customize section
- **Expected Result**: Equipment và injuries selections giữ nguyên khi đổi goal. Goal chỉ ảnh hưởng smart defaults khi submit, không reset customize fields
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_193: Double-click "Bắt đầu" → chỉ 1 lần submit
- **Pre-conditions**: isOnboarded = false, onboarding form đã điền đầy đủ
- **Steps**:
  1. Chọn goal = "hypertrophy", experience = "beginner", days = 3
  2. Double-click nhanh nút "Bắt đầu" (2 clicks liên tiếp < 100ms)
  3. Quan sát Console log và Network tab
- **Expected Result**: setTrainingProfile chỉ được gọi 1 lần, setOnboarded(true) gọi 1 lần, onComplete gọi 1 lần. Không có duplicate profile creation hoặc race condition
- **Priority**: P0 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_194: Rapid goal switching 10 lần
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Click nhanh liên tục: strength → hypertrophy → endurance → general → strength → hypertrophy → endurance → general → strength → hypertrophy
  2. Quan sát DOM và Console sau khi dừng click
- **Expected Result**: Goal cuối cùng (hypertrophy) là active (aria-checked="true"). Không có JS error, không memory leak, không multiple active states
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_195: Rapid equipment toggle 20 lần
- **Pre-conditions**: isOnboarded = false, customize expanded
- **Steps**:
  1. Click nhanh "barbell" 20 lần liên tiếp trong < 3 giây
  2. Kiểm tra trạng thái cuối cùng của barbell
- **Expected Result**: Sau 20 clicks (chẵn), barbell ở trạng thái deselected (aria-checked="false"). State equipment[] nhất quán với UI. Không có stale state hoặc race condition
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_196: Rapid expand/collapse customize 10 lần
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Click nhanh nút "Tùy chỉnh" 10 lần liên tiếp
  2. Kiểm tra trạng thái cuối cùng
- **Expected Result**: Sau 10 clicks (chẵn), customize section ở trạng thái collapsed (aria-expanded="false"). Animation hoàn tất, không bị stuck giữa chừng
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_197: Rapid experience switching beginner↔advanced 10 lần
- **Pre-conditions**: isOnboarded = false, customize expanded
- **Steps**:
  1. Click nhanh luân phiên: beginner → advanced → beginner → advanced... (10 lần)
  2. Quan sát DOM elements cho intermediate/advanced fields
- **Expected Result**: Experience cuối cùng (chẵn = advanced hoặc lẻ = beginner tùy starting state) active đúng. Fields hiển thị/ẩn nhất quán. Không có orphan DOM elements hoặc memory leak
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_198: Click submit khi đang processing
- **Pre-conditions**: isOnboarded = false, onboarding form đã điền đầy đủ
- **Steps**:
  1. Click nút "Bắt đầu"
  2. Ngay lập tức click lại "Bắt đầu" lần nữa trong khi form đang xử lý
  3. Quan sát Console và store state
- **Expected Result**: Profile chỉ được tạo 1 lần. Nút submit disabled hoặc ignored khi đang processing. Không có duplicate entries trong store
- **Priority**: P0 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_199: Tab key duyệt qua tất cả form fields
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded
- **Steps**:
  1. Focus vào element đầu tiên của form
  2. Nhấn Tab liên tục qua tất cả interactive elements
  3. Đếm số lần Tab cần thiết để duyệt hết form
- **Expected Result**: Tab key di chuyển focus tuần tự qua: goal buttons → experience buttons → days buttons → customize toggle → (nếu expanded) session duration → equipment items → injury items → cardio sessions → (nếu intermediate+) periodization → cycle weeks → muscles → (nếu advanced) 1RM inputs → sleep input → submit button
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_200: Space/Enter chọn radio buttons
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Tab đến goal "strength" button
  2. Nhấn Space → verify selected
  3. Tab đến experience "intermediate"
  4. Nhấn Enter → verify selected
- **Expected Result**: Space và Enter đều activate radio buttons. aria-checked cập nhật, visual style thay đổi. Hành vi tương đương click chuột
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_201: Arrow keys trong radiogroups
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, focus trong goal radiogroup
- **Steps**:
  1. Focus vào goal radiogroup (đang ở hypertrophy - default)
  2. Nhấn ArrowRight → di chuyển đến endurance
  3. Nhấn ArrowRight → di chuyển đến general
  4. Nhấn ArrowLeft → quay lại endurance
- **Expected Result**: Arrow keys navigate giữa các radio options trong cùng radiogroup. Focus và selection di chuyển đúng hướng. ArrowRight/Down = next, ArrowLeft/Up = previous. Wrap around khi đến cuối/đầu
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_202: Escape đóng customize section
- **Pre-conditions**: isOnboarded = false, customize section đang expanded, focus trong customize section
- **Steps**:
  1. Verify customize section visible (aria-expanded="true")
  2. Nhấn Escape key
  3. Kiểm tra trạng thái customize section
- **Expected Result**: Customize section collapse (aria-expanded="false"), focus trả về nút toggle customize. Nếu Escape không được handle, section giữ nguyên expanded (tùy implementation)
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_203: Screen reader thông báo form sections
- **Pre-conditions**: isOnboarded = false, screen reader enabled (VoiceOver/NVDA)
- **Steps**:
  1. Bật screen reader
  2. Navigate qua form bằng screen reader
  3. Lắng nghe announcements cho mỗi section
- **Expected Result**: Screen reader đọc: role labels (radiogroup), aria-labels cho mỗi section, aria-checked states, aria-expanded state của customize toggle. Mỗi section có heading hoặc aria-label mô tả
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_204: Focus trap trong onboarding form
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị
- **Steps**:
  1. Tab từ element cuối cùng của form (submit button)
  2. Nhấn Tab thêm 1 lần
  3. Quan sát focus position
- **Expected Result**: Focus quay vòng lại element đầu tiên của form (hoặc thoát ra ngoài form tùy implementation). Không bị lost focus vào element không tương tác
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_FIT_205: Tab order theo đúng visual order
- **Pre-conditions**: isOnboarded = false, onboarding form hiển thị, customize expanded, experience = advanced
- **Steps**:
  1. Tab qua tất cả elements
  2. Ghi nhận thứ tự focus
  3. So sánh với visual layout (top-to-bottom, left-to-right)
- **Expected Result**: Tab order tuân thủ visual order: goal → experience → days → customize toggle → session duration → equipment → injuries → cardio → periodization → cycle weeks → priority muscles → 1RM inputs → sleep → submit. Không có tabindex bất thường phá vỡ thứ tự
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_FIT_206: Dark mode: active pill colors (emerald trên dark bg)
- **Pre-conditions**: isOnboarded = false, dark mode enabled, onboarding form hiển thị
- **Steps**:
  1. Quan sát goal button đang active (default: hypertrophy)
  2. Inspect computed styles của active pill
  3. So sánh với light mode active pill
- **Expected Result**: Active pill có bg-emerald-500 (hoặc dark variant), text-white. Contrast ratio ≥ 4.5:1 với dark background. Pill nổi bật rõ ràng trên nền tối
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_207: Dark mode: inactive pill colors (slate-700)
- **Pre-conditions**: isOnboarded = false, dark mode enabled, onboarding form hiển thị
- **Steps**:
  1. Quan sát các goal buttons không active
  2. Inspect computed styles của inactive pills
- **Expected Result**: Inactive pills có dark:bg-slate-700, dark:text-slate-300. Đủ contrast để đọc được nhưng visual hierarchy rõ ràng (inactive mờ hơn active). Không có vấn đề contrast ratio
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_208: Dark mode: input fields border và background
- **Pre-conditions**: isOnboarded = false, dark mode enabled, experience = advanced, customize expanded
- **Steps**:
  1. Quan sát Known 1RM input fields
  2. Quan sát Avg sleep input field
  3. Inspect border-color và background-color
- **Expected Result**: Input fields có dark:bg-slate-800 hoặc dark:bg-slate-900, dark:border-slate-600, dark:text-white. Placeholder text visible (dark:placeholder-slate-500). Focus ring vẫn hiển thị rõ
- **Priority**: P3 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_209: Dark mode: submit button contrast đủ
- **Pre-conditions**: isOnboarded = false, dark mode enabled, onboarding form hiển thị
- **Steps**:
  1. Quan sát nút "Bắt đầu" (submit)
  2. Kiểm tra contrast ratio giữa text và background button
  3. Kiểm tra contrast ratio giữa button và form background
- **Expected Result**: Submit button có bg-emerald-500 hoặc bg-emerald-600 trong dark mode. Text-white với contrast ≥ 4.5:1. Button nổi bật trên dark form background
- **Priority**: P3 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_FIT_210: Dark mode: customize section background và text
- **Pre-conditions**: isOnboarded = false, dark mode enabled, customize section expanded
- **Steps**:
  1. Expand customize section trong dark mode
  2. Quan sát background color của section
  3. Quan sát tất cả labels và text trong section
  4. Kiểm tra equipment/injury chip colors
- **Expected Result**: Customize section có dark background phù hợp (dark:bg-slate-800/900). Labels sử dụng dark:text-slate-300. Equipment/injury chips inactive: dark:bg-slate-700, active: bg-emerald-500. Tất cả text readable, không bị blend vào background
- **Priority**: P3 | **Type**: Negative
- **Kết quả test thực tế**: | — |