# Scenario 30: Progress Dashboard

**Version:** 2.0  
**Date:** 2026-06-27  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Progress Dashboard là giao diện tổng quan theo dõi tiến trình tập luyện, bao gồm: Hero metric card (volume change %), 4 metric cards (Weight, 1RM, Adherence %, Sessions), Cycle progress bar, Insights section (dismissible), và Bottom sheet với chart khi tap vào metric card. Người dùng có thể xem chi tiết từng metric theo các khoảng thời gian (1W / 1M / 3M / All). Dashboard tính toán volume thay đổi so với tuần trước, 7-day weight delta, best estimated 1RM (Brzycki formula), adherence % dựa trên training profile, và hiển thị sparkline 7 ngày gần nhất. Empty state hiển thị khi chưa có workout nào với CTA "Bắt đầu tập luyện".

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| ProgressDashboard | ProgressDashboard.tsx | Container chính hiển thị dashboard tiến trình |
| SimpleBarChart | ProgressDashboard.tsx | Bar chart đơn giản cho bottom sheet |
| useFitnessStore | fitnessStore.ts | Zustand store chứa workouts, workoutSets, weightEntries, trainingProfile |
| calculateWeeklyVolume | trainingMetrics.ts | Tính tổng volume tuần |
| estimate1RM | trainingMetrics.ts | Ước lượng 1RM theo Brzycki formula |
| getCutoffDate | ProgressDashboard.tsx | Tính ngày cutoff theo time range |
| getWeekBounds | ProgressDashboard.tsx | Tính Monday–Sunday bounds cho tuần |

## Luồng nghiệp vụ

1. Mở tab Fitness → chọn Progress → ProgressDashboard render
2. Nếu không có workouts → hiển thị empty state + CTA "Bắt đầu tập luyện"
3. Nếu có workouts → hiển thị hero card (volume %), 4 metric cards, cycle progress, insights
4. Click metric card → mở bottom sheet → hiển thị chart + time range filter
5. Chọn time range (1W/1M/3M/All) → chart data cập nhật theo khoảng thời gian
6. Close bottom sheet → click backdrop hoặc click X button
7. Dismiss insight → insight ẩn khỏi danh sách

## Quy tắc nghiệp vụ

1. Volume change % = (thisWeekVolume - lastWeekVolume) / lastWeekVolume × 100, rounded
2. Last week volume = 0 → volumeChangePercent = 0
3. Weight delta = latestWeight - weight7DaysAgo, rounded 1 decimal
4. 1RM estimation: Brzycki formula = weight / (1.0278 - 0.0278 × reps)
5. Adherence % = completedSessions / plannedSessions × 100, capped at 100%
6. plannedSessions = trainingProfile.daysPerWeek, default = 0
7. Cycle progress: currentWeek = min(max(diffWeeks+1, 1), durationWeeks), percent = currentWeek/totalWeeks × 100
8. Sparkline: 7 bars = volume mỗi ngày trong 7 ngày gần nhất
9. Insights: volume up/down, missed sessions, weight change — dismissible
10. Bottom sheet: mở khi click metric card, time range reset về '1W'
11. Chart data filtered by cutoff date theo time range

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_PRG_01 | Hiển thị empty state khi không có workouts | Positive | P0 |
| TC_PRG_02 | Empty state có skeleton placeholders | Positive | P2 |
| TC_PRG_03 | Empty state có text "Chưa có dữ liệu" | Positive | P1 |
| TC_PRG_04 | CTA "Bắt đầu tập luyện" hiển thị ở empty state | Positive | P1 |
| TC_PRG_05 | Hero card hiển thị volume change % | Positive | P0 |
| TC_PRG_06 | Volume tăng → hiển thị "+" prefix và TrendingUp icon | Positive | P1 |
| TC_PRG_07 | Volume giảm → hiển thị "-" prefix và TrendingDown icon | Positive | P1 |
| TC_PRG_08 | Volume không đổi → hiển thị "0%" và Minus icon | Edge | P1 |
| TC_PRG_09 | Sparkline hiển thị 7 bars | Positive | P1 |
| TC_PRG_10 | Sparkline bar height proportional to volume | Positive | P2 |
| TC_PRG_11 | Metric card Weight hiển thị latest weight | Positive | P0 |
| TC_PRG_12 | Metric card Weight khi chưa có data → "—" | Edge | P1 |
| TC_PRG_13 | Weight delta ↑ hiển thị text-red-500 | Positive | P1 |
| TC_PRG_14 | Weight delta ↓ hiển thị text-green-500 | Positive | P1 |
| TC_PRG_15 | Weight stable → hiển thị "→" text-slate-400 | Edge | P2 |
| TC_PRG_16 | Metric card 1RM hiển thị best estimated 1RM | Positive | P0 |
| TC_PRG_17 | 1RM khi không có sets → "—" | Edge | P1 |
| TC_PRG_18 | Metric card Adherence hiển thị % | Positive | P0 |
| TC_PRG_19 | Adherence capped at 100% (completedSessions > planned) | Boundary | P1 |
| TC_PRG_20 | Adherence = 0% khi plannedSessions = 0 | Edge | P1 |
| TC_PRG_21 | Metric card Sessions hiển thị completed count | Positive | P0 |
| TC_PRG_22 | Click Weight card → mở bottom sheet | Positive | P0 |
| TC_PRG_23 | Click 1RM card → mở bottom sheet | Positive | P0 |
| TC_PRG_24 | Click Adherence card → mở bottom sheet | Positive | P1 |
| TC_PRG_25 | Click Sessions card → mở bottom sheet | Positive | P1 |
| TC_PRG_26 | Bottom sheet có chart title (metric name) | Positive | P1 |
| TC_PRG_27 | Bottom sheet có BarChart3 icon | Positive | P2 |
| TC_PRG_28 | Time range filter hiển thị 4 buttons: 1W/1M/3M/All | Positive | P1 |
| TC_PRG_29 | Mở bottom sheet → time range mặc định = 1W | Positive | P1 |
| TC_PRG_30 | Click 1M → chart data cập nhật (30 ngày) | Positive | P0 |
| TC_PRG_31 | Click 3M → chart data cập nhật (90 ngày) | Positive | P1 |
| TC_PRG_32 | Click All → chart data hiển thị toàn bộ | Positive | P1 |
| TC_PRG_33 | Time range active có bg-emerald-500 style | Positive | P2 |
| TC_PRG_34 | SimpleBarChart render bars proportional to max value | Positive | P1 |
| TC_PRG_35 | Chart bar minHeight = 4px khi value > 0 | Positive | P2 |
| TC_PRG_36 | Chart bar minHeight = 2px khi value = 0 | Edge | P2 |
| TC_PRG_37 | Close bottom sheet bằng click backdrop | Positive | P0 |
| TC_PRG_38 | Close bottom sheet bằng click X button | Positive | P0 |
| TC_PRG_39 | Bottom sheet backdrop có bg-black/40 | Positive | P2 |
| TC_PRG_40 | Cycle progress bar hiển thị khi có activePlan | Positive | P1 |
| TC_PRG_41 | Cycle progress bar ẩn khi không có activePlan | Positive | P1 |
| TC_PRG_42 | Progress bar width = percentComplete% | Positive | P1 |
| TC_PRG_43 | Cycle progress có role="progressbar" và aria attributes | Positive | P2 |
| TC_PRG_44 | Insights section hiển thị khi có insights | Positive | P1 |
| TC_PRG_45 | Insight volume up/down message | Positive | P2 |
| TC_PRG_46 | Insight missed sessions message | Positive | P2 |
| TC_PRG_47 | Insight weight change message | Positive | P2 |
| TC_PRG_48 | Dismiss insight → insight ẩn | Positive | P1 |
| TC_PRG_49 | Dismiss tất cả insights → section ẩn | Positive | P2 |
| TC_PRG_50 | Metric cards scrollable horizontally (overflow-x-auto) | Positive | P2 |
| TC_PRG_51 | Last week volume = 0 → volume change = 0% | Edge | P1 |
| TC_PRG_52 | 365+ weight entries → chart render < 1s | Boundary | P1 |
| TC_PRG_53 | Dark mode — cards bg dark:bg-slate-800 | Positive | P2 |
| TC_PRG_54 | XSS trong insight text → escaped đúng | Negative | P0 |
| TC_PRG_55 | Rapid card click (open/close 20 lần) → UI stable | Boundary | P2 |
| TC_PRG_56 | Weight card hiển thị giá trị 50.0 kg | Positive | P1 |
| TC_PRG_57 | Weight card hiển thị giá trị 70.5 kg | Positive | P1 |
| TC_PRG_58 | Weight card hiển thị giá trị 100.0 kg | Positive | P1 |
| TC_PRG_59 | Weight card hiển thị giá trị 150.0 kg | Positive | P2 |
| TC_PRG_60 | Weight card khi không có weightEntries → "—" | Edge | P1 |
| TC_PRG_61 | Weight delta +0.5 → hiển thị ↑ text-red-500 | Positive | P1 |
| TC_PRG_62 | Weight delta +2.0 → hiển thị ↑ text-red-500 | Positive | P1 |
| TC_PRG_63 | Weight delta -0.3 → hiển thị ↓ text-green-500 | Positive | P1 |
| TC_PRG_64 | Weight delta -1.5 → hiển thị ↓ text-green-500 | Positive | P1 |
| TC_PRG_65 | Weight delta 0.0 → hiển thị → text-slate-400 | Edge | P2 |
| TC_PRG_66 | Weight delta khi không có weight7DaysAgo → delta = 0 | Edge | P1 |
| TC_PRG_67 | 1RM card hiển thị estimated 1RM value | Positive | P0 |
| TC_PRG_68 | 1RM card chọn best từ multiple exercises | Positive | P1 |
| TC_PRG_69 | 1RM Brzycki formula: weight / (1.0278 - 0.0278 × reps) | Positive | P1 |
| TC_PRG_70 | 1RM với 1 rep = weight itself | Positive | P1 |
| TC_PRG_71 | 1RM với 10 reps | Positive | P2 |
| TC_PRG_72 | 1RM khi không có sets → hiển thị "—" | Edge | P1 |
| TC_PRG_73 | Adherence = 0% khi không có sessions | Positive | P1 |
| TC_PRG_74 | Adherence = 25% | Positive | P2 |
| TC_PRG_75 | Adherence = 50% | Positive | P2 |
| TC_PRG_76 | Adherence = 75% | Positive | P2 |
| TC_PRG_77 | Adherence = 100% | Positive | P1 |
| TC_PRG_78 | Adherence > 100% capped at 100% | Boundary | P1 |
| TC_PRG_79 | Sessions card: 0 sessions | Positive | P1 |
| TC_PRG_80 | Sessions card: 1 session | Positive | P1 |
| TC_PRG_81 | Sessions card: 3 sessions | Positive | P2 |
| TC_PRG_82 | Sessions card: 7 sessions (every day) | Positive | P2 |
| TC_PRG_83 | Each card có correct icon: Weight = Scale | Positive | P2 |
| TC_PRG_84 | Each card có correct icon: 1RM = Dumbbell | Positive | P2 |
| TC_PRG_85 | Each card có correct icon: Adherence = Target | Positive | P2 |
| TC_PRG_86 | Each card có correct icon: Sessions = Calendar | Positive | P2 |
| TC_PRG_87 | Card click handler sets selectedCard correctly | Positive | P1 |
| TC_PRG_88 | Card click resets timeRange to 1W | Positive | P1 |
| TC_PRG_89 | Metric cards có aria-label cho accessibility | Positive | P2 |
| TC_PRG_90 | Metric cards horizontal scroll overflow-x-auto | Positive | P2 |
| TC_PRG_91 | Mở bottom sheet bằng click Weight card | Positive | P0 |
| TC_PRG_92 | Mở bottom sheet bằng click 1RM card | Positive | P0 |
| TC_PRG_93 | Mở bottom sheet bằng click Adherence card | Positive | P1 |
| TC_PRG_94 | Mở bottom sheet bằng click Sessions card | Positive | P1 |
| TC_PRG_95 | Bottom sheet title khớp với card type | Positive | P1 |
| TC_PRG_96 | BarChart3 icon trong bottom sheet header | Positive | P2 |
| TC_PRG_97 | Time range: 4 buttons hiển thị (1W/1M/3M/All) | Positive | P1 |
| TC_PRG_98 | Default time range = 1W khi mở bottom sheet | Positive | P1 |
| TC_PRG_99 | Click 1W → 7 data points trong chart | Positive | P1 |
| TC_PRG_100 | Click 1M → 30 data points trong chart | Positive | P0 |
| TC_PRG_101 | Click 3M → 90 data points trong chart | Positive | P1 |
| TC_PRG_102 | Click All → toàn bộ data points | Positive | P1 |
| TC_PRG_103 | Time range active button: bg-emerald-500 text-white | Positive | P2 |
| TC_PRG_104 | Time range inactive button style | Positive | P2 |
| TC_PRG_105 | Chart bars proportional to max value | Positive | P1 |
| TC_PRG_106 | Chart bar minHeight = 4px khi value > 0 | Positive | P2 |
| TC_PRG_107 | Chart bar minHeight = 2px khi value = 0 | Edge | P2 |
| TC_PRG_108 | Close bottom sheet bằng click backdrop | Positive | P0 |
| TC_PRG_109 | Close bottom sheet bằng click X button | Positive | P0 |
| TC_PRG_110 | Backdrop có bg-black/40 opacity | Positive | P2 |
| TC_PRG_111 | Open Weight → close → open 1RM → title thay đổi | Positive | P1 |
| TC_PRG_112 | Time range resets khi mở card khác | Positive | P1 |
| TC_PRG_113 | Chart data cho Weight: daily weight entries | Positive | P1 |
| TC_PRG_114 | Chart data cho 1RM: estimated 1RM values | Positive | P1 |
| TC_PRG_115 | Chart data cho Adherence: weekly adherence % | Positive | P1 |
| TC_PRG_116 | Chart data cho Sessions: weekly session counts | Positive | P1 |
| TC_PRG_117 | Empty chart: no data cho selected range | Edge | P1 |
| TC_PRG_118 | Chart với single data point | Edge | P2 |
| TC_PRG_119 | Chart với 365+ data points | Boundary | P1 |
| TC_PRG_120 | SimpleBarChart với all zero values | Edge | P2 |
| TC_PRG_121 | SimpleBarChart với single non-zero value | Edge | P2 |
| TC_PRG_122 | Bottom sheet z-index trên content | Positive | P2 |
| TC_PRG_123 | Multiple open/close cycles → UI stable | Boundary | P2 |
| TC_PRG_124 | X button có aria-label | Positive | P2 |
| TC_PRG_125 | Bottom sheet có fixed inset-0 positioning | Positive | P2 |
| TC_PRG_126 | Switching time ranges: data updates correctly | Positive | P0 |
| TC_PRG_127 | Chart bar count thay đổi theo time range | Positive | P1 |
| TC_PRG_128 | Bottom sheet không close khi click bên trong sheet | Positive | P1 |
| TC_PRG_129 | Chart data empty cho all time ranges → all charts empty | Edge | P2 |
| TC_PRG_130 | Bottom sheet animation smooth khi open/close | Positive | P3 |
| TC_PRG_131 | Volume change = 0% khi cả 2 tuần bằng nhau | Edge | P1 |
| TC_PRG_132 | Volume change = +50% | Positive | P1 |
| TC_PRG_133 | Volume change = +100% | Positive | P1 |
| TC_PRG_134 | Volume change = +200% | Positive | P2 |
| TC_PRG_135 | Volume change = -25% | Positive | P1 |
| TC_PRG_136 | Volume change = -50% | Positive | P1 |
| TC_PRG_137 | Volume change = -100% (no training this week) | Edge | P1 |
| TC_PRG_138 | Volume change khi lastWeekVolume = 0 → 0% | Edge | P0 |
| TC_PRG_139 | TrendingUp icon khi volume > 0% | Positive | P1 |
| TC_PRG_140 | TrendingDown icon khi volume < 0% | Positive | P1 |
| TC_PRG_141 | Minus icon khi volume = 0% | Edge | P2 |
| TC_PRG_142 | Volume percentage text format: "+XX%" với prefix | Positive | P2 |
| TC_PRG_143 | Hero card gradient: bg-gradient-to-br from-emerald-500 to-emerald-600 | Positive | P2 |
| TC_PRG_144 | Hero card text-white | Positive | P2 |
| TC_PRG_145 | Sparkline 7 bars hiển thị đúng | Positive | P1 |
| TC_PRG_146 | Sparkline all zeros (no workouts 7 days) | Edge | P2 |
| TC_PRG_147 | Sparkline 1 active day (6 zeros + 1 value) | Edge | P2 |
| TC_PRG_148 | Sparkline 7 active days (all non-zero) | Positive | P2 |
| TC_PRG_149 | Sparkline max bar = full height | Positive | P2 |
| TC_PRG_150 | thisWeek calculation: Monday to Sunday | Positive | P2 |
| TC_PRG_151 | lastWeek calculation: previous Monday to Sunday | Positive | P2 |
| TC_PRG_152 | Weekly volume calculation: sum of all sets weight×reps | Positive | P1 |
| TC_PRG_153 | Weekly volume with no sets → 0 | Edge | P2 |
| TC_PRG_154 | Hero card dark mode (gradient unchanged) | Positive | P2 |
| TC_PRG_155 | Hero card accessibility: volume change readable | Positive | P3 |
| TC_PRG_156 | Cycle progress visible khi có activePlan | Positive | P1 |
| TC_PRG_157 | Cycle progress ẩn khi không có activePlan | Positive | P1 |
| TC_PRG_158 | Progress 0%: tuần 1 of 12 | Positive | P1 |
| TC_PRG_159 | Progress 25%: tuần 3 of 12 | Positive | P2 |
| TC_PRG_160 | Progress 50%: tuần 6 of 12 | Positive | P2 |
| TC_PRG_161 | Progress 75%: tuần 9 of 12 | Positive | P2 |
| TC_PRG_162 | Progress 100%: tuần 12 of 12 | Positive | P1 |
| TC_PRG_163 | Progress bar width = percentComplete% | Positive | P1 |
| TC_PRG_164 | Progress bar fill bg-emerald-500 | Positive | P2 |
| TC_PRG_165 | Progress bar background bg-slate-100 dark:bg-slate-700 | Positive | P2 |
| TC_PRG_166 | role="progressbar" attribute present | Positive | P2 |
| TC_PRG_167 | aria-valuenow = percentComplete | Positive | P2 |
| TC_PRG_168 | aria-valuemin = 0 | Positive | P2 |
| TC_PRG_169 | aria-valuemax = 100 | Positive | P2 |
| TC_PRG_170 | Cycle text: "Tuần X/Y" format | Positive | P2 |
| TC_PRG_171 | currentWeek clamped: never > totalWeeks | Boundary | P1 |
| TC_PRG_172 | currentWeek clamped: never < 1 | Boundary | P1 |
| TC_PRG_173 | Multiple plans: chỉ active plan hiển thị | Positive | P1 |
| TC_PRG_174 | Plan duration 1 week → progress = 100% ngay tuần đầu | Edge | P2 |
| TC_PRG_175 | Dark mode: cycle progress bar colors | Positive | P2 |
| TC_PRG_176 | Insight volume up message khi volume tăng > 20% | Positive | P1 |
| TC_PRG_177 | Insight volume down message khi volume giảm > 20% | Positive | P1 |
| TC_PRG_178 | Insight missed sessions message | Positive | P1 |
| TC_PRG_179 | Insight weight change message khi delta > 1kg | Positive | P2 |
| TC_PRG_180 | Dismiss single insight → insight ẩn | Positive | P1 |
| TC_PRG_181 | Dismiss tất cả insights → section ẩn hoàn toàn | Positive | P1 |
| TC_PRG_182 | Dismissed insight không hiện lại khi re-render | Positive | P1 |
| TC_PRG_183 | Multiple insights hiển thị stacked | Positive | P2 |
| TC_PRG_184 | Insight text chứa i18n parameters đúng | Positive | P2 |
| TC_PRG_185 | Insight dismiss button có aria-label | Positive | P2 |
| TC_PRG_186 | Không có insights → section ẩn | Edge | P1 |
| TC_PRG_187 | Volume tăng < 20% → không tạo insight | Edge | P2 |
| TC_PRG_188 | Volume giảm < 20% → không tạo insight | Edge | P2 |
| TC_PRG_189 | All sessions completed → không có missed sessions insight | Edge | P2 |
| TC_PRG_190 | Weight delta < 1kg → không có weight change insight | Edge | P2 |
| TC_PRG_191 | Insights card bg-white dark:bg-slate-800 | Positive | P2 |
| TC_PRG_192 | Dark mode: insight text colors | Positive | P2 |
| TC_PRG_193 | XSS trong insight parameters → escaped | Negative | P0 |
| TC_PRG_194 | Insight ordering: most important first | Positive | P2 |
| TC_PRG_195 | Insight regeneration sau new workout | Positive | P2 |
| TC_PRG_196 | Insights với partial data (chỉ có weight, không có sessions) | Edge | P2 |
| TC_PRG_197 | Empty insights sau khi dismiss tất cả → visibleInsights empty | Positive | P2 |
| TC_PRG_198 | Insight dismiss icon X button | Positive | P3 |
| TC_PRG_199 | Insight với volume up > 100% → display correctly | Boundary | P2 |
| TC_PRG_200 | Insight card padding và spacing consistent | Positive | P3 |
| TC_PRG_201 | Dark mode: hero card gradient không đổi | Positive | P2 |
| TC_PRG_202 | Dark mode: metric cards bg dark:bg-slate-800 | Positive | P2 |
| TC_PRG_203 | Dark mode: bottom sheet backdrop và content | Positive | P2 |
| TC_PRG_204 | Dark mode: cycle progress bar | Positive | P2 |
| TC_PRG_205 | Dark mode: insights section | Positive | P2 |
| TC_PRG_206 | Dark mode: text colors throughout dashboard | Positive | P2 |
| TC_PRG_207 | Performance: 500 workouts dashboard load | Boundary | P1 |
| TC_PRG_208 | Performance: large weight entries chart render | Boundary | P1 |
| TC_PRG_209 | Performance: rapid card open/close 30 times | Boundary | P2 |
| TC_PRG_210 | Accessibility: tab navigation qua all interactive elements | Positive | P2 |

---

## Chi tiết Test Cases

##### TC_PRG_01: Hiển thị empty state khi không có workouts
- **Pre-conditions**: fitnessStore.workouts = []
- **Steps**: 1. Mở tab Fitness → chọn Progress
- **Expected**: data-testid="progress-empty-state" hiển thị, không có metric cards
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_PRG_02: Empty state có skeleton placeholders
- **Pre-conditions**: fitnessStore.workouts = []
- **Steps**: 1. Quan sát empty state
- **Expected**: 3 skeleton divs (h-24, 2× h-20, h-8) với opacity-30
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_03: Empty state có text "Chưa có dữ liệu"
- **Pre-conditions**: fitnessStore.workouts = []
- **Steps**: 1. Quan sát empty state text
- **Expected**: Text = t('fitness.progress.noData')
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_04: CTA "Bắt đầu tập luyện" hiển thị ở empty state
- **Pre-conditions**: fitnessStore.workouts = []
- **Steps**: 1. Quan sát data-testid="start-training-cta"
- **Expected**: Button hiển thị với text t('fitness.progress.startTraining') + "→", bg-emerald-500
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_05: Hero card hiển thị volume change %
- **Pre-conditions**: Có workouts tuần này và tuần trước
- **Steps**: 1. Quan sát data-testid="hero-metric-card"
- **Expected**: data-testid="volume-change" hiển thị "±X%", gradient bg emerald
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_PRG_06: Volume tăng → hiển thị "+" prefix và TrendingUp icon
- **Pre-conditions**: thisWeekVolume > lastWeekVolume
- **Steps**: 1. Quan sát hero card
- **Expected**: Text "+X%", icon TrendingUp visible
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_07: Volume giảm → hiển thị "-" prefix và TrendingDown icon
- **Pre-conditions**: thisWeekVolume < lastWeekVolume
- **Steps**: 1. Quan sát hero card
- **Expected**: Text "-X%", icon TrendingDown visible
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_08: Volume không đổi → hiển thị "0%" và Minus icon
- **Pre-conditions**: thisWeekVolume = lastWeekVolume hoặc lastWeekVolume = 0
- **Steps**: 1. Quan sát hero card
- **Expected**: Text "+0%", icon Minus visible
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_PRG_09: Sparkline hiển thị 7 bars
- **Pre-conditions**: Có workouts
- **Steps**: 1. Quan sát data-testid="sparkline"
- **Expected**: 7 div bars inside sparkline container
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_10: Sparkline bar height proportional to volume
- **Pre-conditions**: Ngày có volume 1000, ngày khác volume 500
- **Steps**: 1. Kiểm tra style height của bars
- **Expected**: Bar 1000 = 100% height, bar 500 = 50% height, bar 0 = 2px min
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_11: Metric card Weight hiển thị latest weight
- **Pre-conditions**: weightEntries có entry 75.5kg hôm nay
- **Steps**: 1. Quan sát data-testid="metric-card-weight"
- **Expected**: Text "75.5kg"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_PRG_12: Metric card Weight khi chưa có data → "—"
- **Pre-conditions**: weightEntries = []
- **Steps**: 1. Quan sát metric-card-weight
- **Expected**: Text "—" thay vì số
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_PRG_13: Weight delta ↑ hiển thị text-red-500
- **Pre-conditions**: latestWeight > weight7DaysAgo (đang tăng cân)
- **Steps**: 1. Quan sát data-testid="weight-delta"
- **Expected**: "↑ Xkg" với class text-red-500
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_14: Weight delta ↓ hiển thị text-green-500
- **Pre-conditions**: latestWeight < weight7DaysAgo (đang giảm cân)
- **Steps**: 1. Quan sát data-testid="weight-delta"
- **Expected**: "↓ Xkg" với class text-green-500
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_15: Weight stable → hiển thị "→" text-slate-400
- **Pre-conditions**: latestWeight = weight7DaysAgo, weightDelta = 0
- **Steps**: 1. Quan sát data-testid="weight-stable"
- **Expected**: Text "→" với class text-slate-400
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_PRG_16: Metric card 1RM hiển thị best estimated 1RM
- **Pre-conditions**: workoutSets có sets, best 1RM = 120kg
- **Steps**: 1. Quan sát data-testid="metric-card-1rm"
- **Expected**: Text "120kg"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_PRG_17: 1RM khi không có sets → "—"
- **Pre-conditions**: workoutSets = [] hoặc tất cả sets weight = 0
- **Steps**: 1. Quan sát metric-card-1rm
- **Expected**: Text "—"
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_PRG_18: Metric card Adherence hiển thị %
- **Pre-conditions**: trainingProfile.daysPerWeek = 4, completedSessions = 3
- **Steps**: 1. Quan sát data-testid="metric-card-adherence"
- **Expected**: Text "75%"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_PRG_19: Adherence capped at 100% (completedSessions > planned)
- **Pre-conditions**: daysPerWeek = 3, completedSessions = 5
- **Steps**: 1. Quan sát metric-card-adherence
- **Expected**: Text "100%", không vượt quá 100
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_PRG_20: Adherence = 0% khi plannedSessions = 0
- **Pre-conditions**: trainingProfile.daysPerWeek = 0 hoặc trainingProfile null
- **Steps**: 1. Quan sát metric-card-adherence
- **Expected**: Text "0%"
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_PRG_21: Metric card Sessions hiển thị completed count
- **Pre-conditions**: 3 workouts tuần này
- **Steps**: 1. Quan sát data-testid="metric-card-sessions"
- **Expected**: Text "3"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_PRG_22: Click Weight card → mở bottom sheet
- **Pre-conditions**: Có workouts/weightEntries
- **Steps**: 1. Click metric-card-weight
- **Expected**: data-testid="metric-bottom-sheet" hiển thị, title = t('fitness.progress.weight')
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_PRG_23: Click 1RM card → mở bottom sheet
- **Pre-conditions**: Có workoutSets
- **Steps**: 1. Click metric-card-1rm
- **Expected**: Bottom sheet mở, title = t('fitness.progress.estimated1rm')
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_PRG_24: Click Adherence card → mở bottom sheet
- **Pre-conditions**: Có workouts
- **Steps**: 1. Click metric-card-adherence
- **Expected**: Bottom sheet mở, title = t('fitness.progress.adherence')
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_25: Click Sessions card → mở bottom sheet
- **Pre-conditions**: Có workouts
- **Steps**: 1. Click metric-card-sessions
- **Expected**: Bottom sheet mở, title = t('fitness.progress.sessions')
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_26: Bottom sheet có chart title (metric name)
- **Pre-conditions**: Bottom sheet đang mở
- **Steps**: 1. Quan sát bottom sheet header
- **Expected**: Title text = tên metric tương ứng (Weight / 1RM / Adherence / Sessions)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_27: Bottom sheet có BarChart3 icon
- **Pre-conditions**: Bottom sheet đang mở
- **Steps**: 1. Quan sát header
- **Expected**: BarChart3 icon (h-5 w-5 text-emerald-500) visible
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_28: Time range filter hiển thị 4 buttons: 1W/1M/3M/All
- **Pre-conditions**: Bottom sheet đang mở
- **Steps**: 1. Quan sát data-testid="time-range-filter"
- **Expected**: 4 buttons: time-range-1W, time-range-1M, time-range-3M, time-range-all
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_29: Mở bottom sheet → time range mặc định = 1W
- **Pre-conditions**: Đã close bottom sheet trước đó (hoặc lần đầu)
- **Steps**: 1. Click metric card
- **Expected**: time-range-1W có bg-emerald-500 (active), các button khác inactive
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_30: Click 1M → chart data cập nhật (30 ngày)
- **Pre-conditions**: Bottom sheet mở, có data > 30 ngày
- **Steps**: 1. Click time-range-1M
- **Expected**: Chart bars cập nhật, chỉ hiển thị data từ 30 ngày gần nhất
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_PRG_31: Click 3M → chart data cập nhật (90 ngày)
- **Pre-conditions**: Bottom sheet mở
- **Steps**: 1. Click time-range-3M
- **Expected**: Chart data mở rộng đến 90 ngày, bars tương ứng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_32: Click All → chart data hiển thị toàn bộ
- **Pre-conditions**: Bottom sheet mở
- **Steps**: 1. Click time-range-all
- **Expected**: Chart hiển thị tất cả data từ đầu (cutoff = '0000-01-01')
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_33: Time range active có bg-emerald-500 style
- **Pre-conditions**: Bottom sheet mở
- **Steps**: 1. Click time-range-3M 2. Quan sát styles
- **Expected**: 3M button có bg-emerald-500 text-white, các buttons khác bg-slate-100
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_34: SimpleBarChart render bars proportional to max value
- **Pre-conditions**: Bottom sheet mở, data = [100, 200, 50, 0, 150]
- **Steps**: 1. Quan sát data-testid="bottom-sheet-chart"
- **Expected**: Bar 200 = 100% height, bar 100 = 50%, bar 0 = 2px min
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_35: Chart bar minHeight = 4px khi value > 0
- **Pre-conditions**: Data có value rất nhỏ so với max (ví dụ: 1 vs 1000)
- **Steps**: 1. Quan sát chart bars
- **Expected**: Bar nhỏ nhất vẫn visible (minHeight: 4px)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_36: Chart bar minHeight = 2px khi value = 0
- **Pre-conditions**: Data có ngày value = 0
- **Steps**: 1. Quan sát chart bar cho ngày đó
- **Expected**: Bar hiển thị với minHeight 2px (baseline)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_PRG_37: Close bottom sheet bằng click backdrop
- **Pre-conditions**: Bottom sheet đang mở
- **Steps**: 1. Click data-testid="bottom-sheet-backdrop"
- **Expected**: Bottom sheet đóng, selectedCard = null
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_PRG_38: Close bottom sheet bằng click X button
- **Pre-conditions**: Bottom sheet đang mở
- **Steps**: 1. Click data-testid="close-bottom-sheet"
- **Expected**: Bottom sheet đóng, selectedCard = null
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_PRG_39: Bottom sheet backdrop có bg-black/40
- **Pre-conditions**: Bottom sheet đang mở
- **Steps**: 1. Quan sát overlay
- **Expected**: Backdrop có class bg-black/40, click-through disabled
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_40: Cycle progress bar hiển thị khi có activePlan
- **Pre-conditions**: Có training plan với status = 'active'
- **Steps**: 1. Quan sát data-testid="cycle-progress"
- **Expected**: Progress bar hiển thị với currentWeek/totalWeeks và percentage
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_41: Cycle progress bar ẩn khi không có activePlan
- **Pre-conditions**: Không có training plan active
- **Steps**: 1. Quan sát dashboard
- **Expected**: data-testid="cycle-progress" không render
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_42: Progress bar width = percentComplete%
- **Pre-conditions**: Active plan: startDate 4 tuần trước, durationWeeks = 8
- **Steps**: 1. Quan sát progress bar inner div
- **Expected**: width style = "50%" (week 4/8), bg-emerald-500
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_43: Cycle progress có role="progressbar" và aria attributes
- **Pre-conditions**: Có active plan
- **Steps**: 1. Inspect data-testid="cycle-progress" element
- **Expected**: role="progressbar", aria-valuenow, aria-valuemin=0, aria-valuemax=100, aria-label
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_44: Insights section hiển thị khi có insights
- **Pre-conditions**: Volume thay đổi > 0% hoặc missed sessions > 0 hoặc weight changed
- **Steps**: 1. Quan sát data-testid="insights-section"
- **Expected**: Section hiển thị với ít nhất 1 insight card
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_45: Insight volume up/down message
- **Pre-conditions**: Volume thay đổi so với tuần trước
- **Steps**: 1. Quan sát insight-volume-up hoặc insight-volume-down
- **Expected**: Text mô tả % thay đổi volume
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_46: Insight missed sessions message
- **Pre-conditions**: completedSessions < plannedSessions, plannedSessions > 0
- **Steps**: 1. Quan sát insight-missed-sessions
- **Expected**: Text mô tả số sessions còn thiếu
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_47: Insight weight change message
- **Pre-conditions**: latestWeight khác weight7DaysAgo, weightDelta ≠ 0
- **Steps**: 1. Quan sát insight-weight-change
- **Expected**: Text mô tả thay đổi cân nặng (+X hoặc -X kg)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_48: Dismiss insight → insight ẩn
- **Pre-conditions**: Có insight đang hiển thị
- **Steps**: 1. Click dismiss-{insight-id}
- **Expected**: Insight biến mất, dismissedInsights chứa insight id
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_49: Dismiss tất cả insights → section ẩn
- **Pre-conditions**: Có 3 insights
- **Steps**: 1. Dismiss từng insight 2. Dismiss cái cuối cùng
- **Expected**: insights-section không render khi visibleInsights.length = 0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_50: Metric cards scrollable horizontally (overflow-x-auto)
- **Pre-conditions**: Viewport nhỏ hơn width của 4 cards
- **Steps**: 1. Swipe horizontal trên metric cards area
- **Expected**: Cards scrollable, data-testid="metric-cards" có overflow-x-auto
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_51: Last week volume = 0 → volume change = 0%
- **Pre-conditions**: Không có workouts tuần trước, có workouts tuần này
- **Steps**: 1. Quan sát volume-change
- **Expected**: Hiển thị "+0%" (lastWeekVolume = 0 → volumeChangePercent = 0)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_PRG_52: 365+ weight entries → chart render < 1s
- **Pre-conditions**: weightEntries có 365+ entries, bottom sheet mở cho Weight
- **Steps**: 1. Click time-range-all 2. Đo thời gian render chart
- **Expected**: Chart render < 1s, không jank
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_PRG_53: Dark mode — cards bg dark:bg-slate-800
- **Pre-conditions**: Dark mode enabled
- **Steps**: 1. Quan sát metric cards và bottom sheet
- **Expected**: Cards bg-slate-800, text colors dark variant
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_54: XSS trong insight text → escaped đúng
- **Pre-conditions**: Insight text chứa `<script>alert('xss')</script>`
- **Steps**: 1. Quan sát insights section
- **Expected**: Text rendered as-is, không execute, React auto-escapes
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_PRG_55: Rapid card click (open/close 20 lần) → UI stable
- **Pre-conditions**: Có workouts
- **Steps**: 1. Click nhanh metric cards và close bottom sheet 20 lần
- **Expected**: UI stable, bottom sheet open/close đúng, không memory leak
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_PRG_56: Weight card hiển thị giá trị 50.0 kg
- **Pre-conditions**: latestWeight = 50.0
- **Steps**: 1. Quan sát metric card Weight
- **Expected**: Hiển thị "50.0" hoặc "50"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_57: Weight card hiển thị giá trị 70.5 kg
- **Pre-conditions**: latestWeight = 70.5
- **Steps**: 1. Quan sát metric card Weight
- **Expected**: Hiển thị "70.5"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_58: Weight card hiển thị giá trị 100.0 kg
- **Pre-conditions**: latestWeight = 100.0
- **Steps**: 1. Quan sát metric card Weight
- **Expected**: Hiển thị "100" hoặc "100.0"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_59: Weight card hiển thị giá trị 150.0 kg
- **Pre-conditions**: latestWeight = 150.0
- **Steps**: 1. Quan sát metric card Weight
- **Expected**: Hiển thị "150"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_60: Weight card khi không có weightEntries → "—"
- **Pre-conditions**: weightEntries = []
- **Steps**: 1. Quan sát Weight card
- **Expected**: Hiển thị "—" thay vì số
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_PRG_61: Weight delta +0.5 → hiển thị ↑ text-red-500
- **Pre-conditions**: latestWeight = 70.5, weight7DaysAgo = 70.0
- **Steps**: 1. Quan sát delta indicator
- **Expected**: Text "↑ +0.5", class text-red-500
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_62: Weight delta +2.0 → hiển thị ↑ text-red-500
- **Pre-conditions**: latestWeight = 72.0, weight7DaysAgo = 70.0
- **Steps**: 1. Quan sát delta
- **Expected**: Text "↑ +2.0", text-red-500
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_63: Weight delta -0.3 → hiển thị ↓ text-green-500
- **Pre-conditions**: latestWeight = 69.7, weight7DaysAgo = 70.0
- **Steps**: 1. Quan sát delta
- **Expected**: Text "↓ -0.3", text-green-500
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_64: Weight delta -1.5 → hiển thị ↓ text-green-500
- **Pre-conditions**: latestWeight = 68.5, weight7DaysAgo = 70.0
- **Steps**: 1. Quan sát delta
- **Expected**: Text "↓ -1.5", text-green-500
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_65: Weight delta 0.0 → hiển thị → text-slate-400
- **Pre-conditions**: latestWeight = 70.0, weight7DaysAgo = 70.0
- **Steps**: 1. Quan sát delta
- **Expected**: Text "→ 0", text-slate-400
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_PRG_66: Weight delta khi không có weight7DaysAgo → delta = 0
- **Pre-conditions**: latestWeight = 70.0, no entry 7 days ago
- **Steps**: 1. Quan sát delta
- **Expected**: Delta = 0, hiển thị "→"
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_PRG_67: 1RM card hiển thị estimated 1RM value
- **Pre-conditions**: Sets: 100kg × 5 reps → 1RM ≈ 112.5
- **Steps**: 1. Quan sát 1RM card
- **Expected**: Hiển thị "113" (rounded)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_PRG_68: 1RM card chọn best từ multiple exercises
- **Pre-conditions**: Exercise A: 100kg×5=112.5, Exercise B: 80kg×10=106.7
- **Steps**: 1. Quan sát 1RM card
- **Expected**: Hiển thị 113 (max)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_69: 1RM Brzycki formula: weight / (1.0278 - 0.0278 × reps)
- **Pre-conditions**: Set: 100kg × 5 reps
- **Steps**: 1. Quan sát 1RM
- **Expected**: 1RM = 100 / (1.0278 - 0.0278×5) = 100/0.889 ≈ 112.5
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_70: 1RM với 1 rep = weight itself
- **Pre-conditions**: Set: 120kg × 1 rep
- **Steps**: 1. Quan sát 1RM
- **Expected**: 1RM = 120 / (1.0278 - 0.0278) = 120/1.0 = 120
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_71: 1RM với 10 reps
- **Pre-conditions**: Set: 80kg × 10 reps
- **Steps**: 1. Quan sát 1RM
- **Expected**: 1RM = 80 / (1.0278 - 0.278) ≈ 106.7
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_72: 1RM khi không có sets → hiển thị "—"
- **Pre-conditions**: workoutSets = []
- **Steps**: 1. Quan sát 1RM card
- **Expected**: Hiển thị "—"
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_PRG_73: Adherence = 0% khi không có sessions
- **Pre-conditions**: completedSessions = 0, plannedSessions = 5
- **Steps**: 1. Quan sát Adherence card
- **Expected**: Hiển thị "0%"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_74: Adherence = 25%
- **Pre-conditions**: completedSessions = 1, plannedSessions = 4
- **Steps**: 1. Quan sát Adherence card
- **Expected**: Hiển thị "25%"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_75: Adherence = 50%
- **Pre-conditions**: completedSessions = 2, plannedSessions = 4
- **Steps**: 1. Quan sát Adherence card
- **Expected**: Hiển thị "50%"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_76: Adherence = 75%
- **Pre-conditions**: completedSessions = 3, plannedSessions = 4
- **Steps**: 1. Quan sát Adherence card
- **Expected**: Hiển thị "75%"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_77: Adherence = 100%
- **Pre-conditions**: completedSessions = 4, plannedSessions = 4
- **Steps**: 1. Quan sát Adherence card
- **Expected**: Hiển thị "100%"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_78: Adherence > 100% capped at 100%
- **Pre-conditions**: completedSessions = 6, plannedSessions = 4
- **Steps**: 1. Quan sát Adherence card
- **Expected**: Hiển thị "100%" (Math.min(100, 150))
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_PRG_79: Sessions card: 0 sessions
- **Pre-conditions**: thisWeekWorkouts.length = 0
- **Steps**: 1. Quan sát Sessions card
- **Expected**: Hiển thị "0"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_80: Sessions card: 1 session
- **Pre-conditions**: thisWeekWorkouts.length = 1
- **Steps**: 1. Quan sát Sessions card
- **Expected**: Hiển thị "1"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_81: Sessions card: 3 sessions
- **Pre-conditions**: thisWeekWorkouts.length = 3
- **Steps**: 1. Quan sát Sessions card
- **Expected**: Hiển thị "3"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_82: Sessions card: 7 sessions (every day)
- **Pre-conditions**: thisWeekWorkouts.length = 7
- **Steps**: 1. Quan sát Sessions card
- **Expected**: Hiển thị "7"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_83: Each card có correct icon: Weight = Scale
- **Pre-conditions**: Có workouts
- **Steps**: 1. Quan sát Weight card icon
- **Expected**: Scale icon hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_84: Each card có correct icon: 1RM = Dumbbell
- **Pre-conditions**: Có workouts
- **Steps**: 1. Quan sát 1RM card icon
- **Expected**: Dumbbell icon hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_85: Each card có correct icon: Adherence = Target
- **Pre-conditions**: Có workouts
- **Steps**: 1. Quan sát Adherence card icon
- **Expected**: Target icon hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_86: Each card có correct icon: Sessions = Calendar
- **Pre-conditions**: Có workouts
- **Steps**: 1. Quan sát Sessions card icon
- **Expected**: Calendar icon hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_87: Card click handler sets selectedCard correctly
- **Pre-conditions**: Có workouts
- **Steps**: 1. Click Weight card
- **Expected**: selectedCard = "weight"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_88: Card click resets timeRange to 1W
- **Pre-conditions**: timeRange đang ở 3M
- **Steps**: 1. Close bottom sheet 2. Click 1RM card
- **Expected**: timeRange reset về "1W"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_89: Metric cards có aria-label cho accessibility
- **Pre-conditions**: Có workouts
- **Steps**: 1. Inspect Weight card
- **Expected**: aria-label chứa tên metric
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_90: Metric cards horizontal scroll overflow-x-auto
- **Pre-conditions**: Mobile viewport, 4 cards
- **Steps**: 1. Quan sát cards container
- **Expected**: overflow-x-auto class, cards scrollable horizontally
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_91: Mở bottom sheet bằng click Weight card
- **Pre-conditions**: Có weight entries
- **Steps**: 1. Click Weight card
- **Expected**: Bottom sheet opens, title = Weight metric name
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_PRG_92: Mở bottom sheet bằng click 1RM card
- **Pre-conditions**: Có workout sets
- **Steps**: 1. Click 1RM card
- **Expected**: Bottom sheet opens, title = 1RM metric name
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_PRG_93: Mở bottom sheet bằng click Adherence card
- **Pre-conditions**: Có workouts + trainingProfile
- **Steps**: 1. Click Adherence card
- **Expected**: Bottom sheet opens, title = Adherence metric name
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_94: Mở bottom sheet bằng click Sessions card
- **Pre-conditions**: Có workouts
- **Steps**: 1. Click Sessions card
- **Expected**: Bottom sheet opens, title = Sessions metric name
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_95: Bottom sheet title khớp với card type
- **Pre-conditions**: Click Weight card
- **Steps**: 1. Quan sát bottom sheet header
- **Expected**: Title = CARD_TITLE_KEYS["weight"] i18n value
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_96: BarChart3 icon trong bottom sheet header
- **Pre-conditions**: Bottom sheet open
- **Steps**: 1. Quan sát header
- **Expected**: BarChart3 icon hiển thị aria-hidden="true"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_97: Time range: 4 buttons hiển thị (1W/1M/3M/All)
- **Pre-conditions**: Bottom sheet open
- **Steps**: 1. Quan sát time range section
- **Expected**: 4 buttons: 1W, 1M, 3M, All
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_98: Default time range = 1W khi mở bottom sheet
- **Pre-conditions**: Click card mở bottom sheet
- **Steps**: 1. Quan sát active time range
- **Expected**: 1W button có bg-emerald-500 (active)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_99: Click 1W → 7 data points trong chart
- **Pre-conditions**: Bottom sheet open, Weight card
- **Steps**: 1. Click 1W
- **Expected**: Chart hiển thị 7 bars (7 ngày)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_100: Click 1M → 30 data points trong chart
- **Pre-conditions**: Bottom sheet open
- **Steps**: 1. Click 1M
- **Expected**: Chart hiển thị 30 bars (30 ngày)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_PRG_101: Click 3M → 90 data points trong chart
- **Pre-conditions**: Bottom sheet open
- **Steps**: 1. Click 3M
- **Expected**: Chart hiển thị 90 bars hoặc grouped data
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_102: Click All → toàn bộ data points
- **Pre-conditions**: Bottom sheet open, có 365 ngày data
- **Steps**: 1. Click All
- **Expected**: Chart hiển thị all data, days = không giới hạn
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_103: Time range active button: bg-emerald-500 text-white
- **Pre-conditions**: Bottom sheet open, 1M selected
- **Steps**: 1. Quan sát 1M button style
- **Expected**: bg-emerald-500 text-white
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_104: Time range inactive button style
- **Pre-conditions**: Bottom sheet open, 1W active
- **Steps**: 1. Quan sát 1M button style
- **Expected**: bg-slate-100 dark:bg-slate-700, text-slate-600
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_105: Chart bars proportional to max value
- **Pre-conditions**: Data: [100, 200, 300, 150]
- **Steps**: 1. Quan sát bar heights
- **Expected**: Bar 300 = max height, others proportional
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_106: Chart bar minHeight = 4px khi value > 0
- **Pre-conditions**: Data có giá trị rất nhỏ (1) và rất lớn (1000)
- **Steps**: 1. Quan sát smallest bar
- **Expected**: Bar value=1 vẫn có minHeight 4px
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_107: Chart bar minHeight = 2px khi value = 0
- **Pre-conditions**: Data có giá trị 0
- **Steps**: 1. Quan sát bar cho value=0
- **Expected**: Bar hiển thị với height 2px
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_PRG_108: Close bottom sheet bằng click backdrop
- **Pre-conditions**: Bottom sheet open
- **Steps**: 1. Click vùng backdrop (bg-black/40)
- **Expected**: Bottom sheet close, selectedCard = null
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_PRG_109: Close bottom sheet bằng click X button
- **Pre-conditions**: Bottom sheet open
- **Steps**: 1. Click X button
- **Expected**: Bottom sheet close, selectedCard = null
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_PRG_110: Backdrop có bg-black/40 opacity
- **Pre-conditions**: Bottom sheet open
- **Steps**: 1. Quan sát backdrop style
- **Expected**: bg-black/40 (40% opacity black)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_111: Open Weight → close → open 1RM → title thay đổi
- **Pre-conditions**: Có workouts
- **Steps**: 1. Click Weight card 2. Close 3. Click 1RM card
- **Expected**: Title chuyển từ Weight → 1RM
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_112: Time range resets khi mở card khác
- **Pre-conditions**: Bottom sheet Weight, timeRange = 3M
- **Steps**: 1. Close sheet 2. Open 1RM card
- **Expected**: timeRange = 1W (reset)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_113: Chart data cho Weight: daily weight entries
- **Pre-conditions**: Weight card bottom sheet, có 30 weight entries
- **Steps**: 1. Click 1M
- **Expected**: Chart hiển thị 30 bars = daily weights
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_114: Chart data cho 1RM: estimated 1RM values
- **Pre-conditions**: 1RM card bottom sheet
- **Steps**: 1. Quan sát chart
- **Expected**: Bars = estimated 1RM per workout/day
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_115: Chart data cho Adherence: weekly adherence %
- **Pre-conditions**: Adherence card bottom sheet
- **Steps**: 1. Quan sát chart
- **Expected**: Bars = weekly adherence percentage
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_116: Chart data cho Sessions: weekly session counts
- **Pre-conditions**: Sessions card bottom sheet
- **Steps**: 1. Quan sát chart
- **Expected**: Bars = sessions per week
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_117: Empty chart: no data cho selected range
- **Pre-conditions**: Weight card, 1W selected, no entries this week
- **Steps**: 1. Quan sát chart
- **Expected**: Chart rỗng hoặc all bars = 0
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_PRG_118: Chart với single data point
- **Pre-conditions**: Chỉ 1 weight entry
- **Steps**: 1. Quan sát chart
- **Expected**: 1 bar hiển thị, others = 0
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_PRG_119: Chart với 365+ data points
- **Pre-conditions**: Có weight entries 1 năm
- **Steps**: 1. Click All
- **Expected**: Chart render đầy đủ, performance OK
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_PRG_120: SimpleBarChart với all zero values
- **Pre-conditions**: Data = [0, 0, 0, 0, 0, 0, 0]
- **Steps**: 1. Quan sát chart
- **Expected**: Tất cả bars có minHeight 2px
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_PRG_121: SimpleBarChart với single non-zero value
- **Pre-conditions**: Data = [0, 0, 100, 0, 0, 0, 0]
- **Steps**: 1. Quan sát chart
- **Expected**: Bar index 2 = max height, others = 2px
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_PRG_122: Bottom sheet z-index trên content
- **Pre-conditions**: Bottom sheet open
- **Steps**: 1. Quan sát layering
- **Expected**: Bottom sheet z-50, above all dashboard content
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_123: Multiple open/close cycles → UI stable
- **Pre-conditions**: Có workouts
- **Steps**: 1. Open/close bottom sheet 15 lần
- **Expected**: UI stable, no memory leak, correct state mỗi lần
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_PRG_124: X button có aria-label
- **Pre-conditions**: Bottom sheet open
- **Steps**: 1. Inspect X button
- **Expected**: aria-label = "Close" hoặc tương đương
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_125: Bottom sheet có fixed inset-0 positioning
- **Pre-conditions**: Bottom sheet open
- **Steps**: 1. Inspect sheet container
- **Expected**: CSS: fixed inset-0, covers full viewport
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_126: Switching time ranges: data updates correctly
- **Pre-conditions**: Bottom sheet open
- **Steps**: 1. Click 1W 2. Click 1M 3. Click 3M 4. Click All
- **Expected**: Chart data cập nhật mỗi lần chuyển, bars thay đổi
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_PRG_127: Chart bar count thay đổi theo time range
- **Pre-conditions**: Weight card, 90 entries
- **Steps**: 1. Click 1W (7 bars) 2. Click 1M (30 bars) 3. Click 3M (90 bars)
- **Expected**: Số bars thay đổi tương ứng: 7 → 30 → 90
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_128: Bottom sheet không close khi click bên trong sheet
- **Pre-conditions**: Bottom sheet open
- **Steps**: 1. Click vào chart area bên trong sheet
- **Expected**: Sheet vẫn open, không close
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_129: Chart data empty cho all time ranges → all charts empty
- **Pre-conditions**: No weight entries, Weight card
- **Steps**: 1. Click 1W 2. Click 1M 3. Click 3M 4. Click All
- **Expected**: Tất cả ranges đều chart rỗng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_PRG_130: Bottom sheet animation smooth khi open/close
- **Pre-conditions**: Có workouts
- **Steps**: 1. Open bottom sheet 2. Close
- **Expected**: Transition smooth, no jank
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_PRG_131: Volume change = 0% khi cả 2 tuần bằng nhau
- **Pre-conditions**: thisWeekVolume = 5000, lastWeekVolume = 5000
- **Steps**: 1. Quan sát hero card
- **Expected**: Hiển thị "0%", Minus icon
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_PRG_132: Volume change = +50%
- **Pre-conditions**: thisWeekVolume = 7500, lastWeekVolume = 5000
- **Steps**: 1. Quan sát hero card
- **Expected**: Hiển thị "+50%", TrendingUp icon
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_133: Volume change = +100%
- **Pre-conditions**: thisWeekVolume = 10000, lastWeekVolume = 5000
- **Steps**: 1. Quan sát hero card
- **Expected**: Hiển thị "+100%", TrendingUp icon
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_134: Volume change = +200%
- **Pre-conditions**: thisWeekVolume = 15000, lastWeekVolume = 5000
- **Steps**: 1. Quan sát hero card
- **Expected**: Hiển thị "+200%"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_135: Volume change = -25%
- **Pre-conditions**: thisWeekVolume = 3750, lastWeekVolume = 5000
- **Steps**: 1. Quan sát hero card
- **Expected**: Hiển thị "-25%", TrendingDown icon
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_136: Volume change = -50%
- **Pre-conditions**: thisWeekVolume = 2500, lastWeekVolume = 5000
- **Steps**: 1. Quan sát hero card
- **Expected**: Hiển thị "-50%", TrendingDown icon
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_137: Volume change = -100% (no training this week)
- **Pre-conditions**: thisWeekVolume = 0, lastWeekVolume = 5000
- **Steps**: 1. Quan sát hero card
- **Expected**: Hiển thị "-100%", TrendingDown icon
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_PRG_138: Volume change khi lastWeekVolume = 0 → 0%
- **Pre-conditions**: thisWeekVolume = 5000, lastWeekVolume = 0
- **Steps**: 1. Quan sát hero card
- **Expected**: Hiển thị "0%" (avoid division by zero)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P0

##### TC_PRG_139: TrendingUp icon khi volume > 0%
- **Pre-conditions**: volumeChangePercent = 20
- **Steps**: 1. Quan sát hero card icon
- **Expected**: TrendingUp icon hiển thị, aria-hidden="true"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_140: TrendingDown icon khi volume < 0%
- **Pre-conditions**: volumeChangePercent = -15
- **Steps**: 1. Quan sát hero card icon
- **Expected**: TrendingDown icon hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_141: Minus icon khi volume = 0%
- **Pre-conditions**: volumeChangePercent = 0
- **Steps**: 1. Quan sát hero card icon
- **Expected**: Minus icon hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_PRG_142: Volume percentage text format: "+XX%" với prefix
- **Pre-conditions**: volumeChangePercent = 30
- **Steps**: 1. Quan sát text
- **Expected**: Text = "+30%"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_143: Hero card gradient: bg-gradient-to-br from-emerald-500 to-emerald-600
- **Pre-conditions**: Có workouts
- **Steps**: 1. Inspect hero card
- **Expected**: Gradient emerald-500 → emerald-600
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_144: Hero card text-white
- **Pre-conditions**: Có workouts
- **Steps**: 1. Quan sát text color
- **Expected**: Tất cả text trong hero card = white
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_145: Sparkline 7 bars hiển thị đúng
- **Pre-conditions**: Có workouts 7 ngày gần nhất
- **Steps**: 1. Quan sát sparkline
- **Expected**: 7 bars trong sparkline area
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_146: Sparkline all zeros (no workouts 7 days)
- **Pre-conditions**: Không có workout 7 ngày gần
- **Steps**: 1. Quan sát sparkline
- **Expected**: 7 bars tất cả height rất nhỏ
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_PRG_147: Sparkline 1 active day (6 zeros + 1 value)
- **Pre-conditions**: Chỉ 1 workout ngày hôm nay
- **Steps**: 1. Quan sát sparkline
- **Expected**: 1 bar cao, 6 bars thấp
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_PRG_148: Sparkline 7 active days (all non-zero)
- **Pre-conditions**: 7 workouts liên tục
- **Steps**: 1. Quan sát sparkline
- **Expected**: 7 bars tất cả có height, proportional
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_149: Sparkline max bar = full height
- **Pre-conditions**: Max volume = 5000, other days = 2000-4000
- **Steps**: 1. Quan sát tallest bar
- **Expected**: Tallest bar = full container height
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_150: thisWeek calculation: Monday to Sunday
- **Pre-conditions**: Today = Wednesday
- **Steps**: 1. Kiểm tra thisWeek bounds
- **Expected**: start = Monday 00:00, end = Sunday 23:59
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_151: lastWeek calculation: previous Monday to Sunday
- **Pre-conditions**: Today = Wednesday
- **Steps**: 1. Kiểm tra lastWeek bounds
- **Expected**: start = previous Monday, end = previous Sunday
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_152: Weekly volume calculation: sum of all sets weight×reps
- **Pre-conditions**: Week có 3 workouts, total volume = 15000
- **Steps**: 1. Quan sát hero card
- **Expected**: Volume = 15000
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_153: Weekly volume with no sets → 0
- **Pre-conditions**: Workouts exist but no sets
- **Steps**: 1. Quan sát volume
- **Expected**: Volume = 0
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_PRG_154: Hero card dark mode (gradient unchanged)
- **Pre-conditions**: Dark mode
- **Steps**: 1. Quan sát hero card
- **Expected**: Gradient from-emerald-500 to-emerald-600 không đổi
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_155: Hero card accessibility: volume change readable
- **Pre-conditions**: Screen reader
- **Steps**: 1. Navigate hero card
- **Expected**: Volume change % đọc được
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_PRG_156: Cycle progress visible khi có activePlan
- **Pre-conditions**: trainingPlans có 1 active plan, duration 12 weeks
- **Steps**: 1. Quan sát cycle section
- **Expected**: Progress bar hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_157: Cycle progress ẩn khi không có activePlan
- **Pre-conditions**: trainingPlans = [] hoặc all inactive
- **Steps**: 1. Quan sát dashboard
- **Expected**: Cycle progress section không render
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_158: Progress 0%: tuần 1 of 12
- **Pre-conditions**: Active plan: tuần 1, total 12 weeks
- **Steps**: 1. Quan sát progress bar
- **Expected**: Width ≈ 8.3% (1/12 × 100)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_159: Progress 25%: tuần 3 of 12
- **Pre-conditions**: Active plan: tuần 3, total 12 weeks
- **Steps**: 1. Quan sát progress bar
- **Expected**: Width = 25%
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_160: Progress 50%: tuần 6 of 12
- **Pre-conditions**: Active plan: tuần 6, total 12 weeks
- **Steps**: 1. Quan sát progress bar
- **Expected**: Width = 50%
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_161: Progress 75%: tuần 9 of 12
- **Pre-conditions**: Active plan: tuần 9, total 12 weeks
- **Steps**: 1. Quan sát progress bar
- **Expected**: Width = 75%
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_162: Progress 100%: tuần 12 of 12
- **Pre-conditions**: Active plan: tuần 12, total 12 weeks
- **Steps**: 1. Quan sát progress bar
- **Expected**: Width = 100%
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_163: Progress bar width = percentComplete%
- **Pre-conditions**: percentComplete = 42
- **Steps**: 1. Inspect progress bar fill
- **Expected**: style.width = "42%"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_164: Progress bar fill bg-emerald-500
- **Pre-conditions**: Có active plan
- **Steps**: 1. Inspect fill element
- **Expected**: bg-emerald-500 class
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_165: Progress bar background bg-slate-100 dark:bg-slate-700
- **Pre-conditions**: Có active plan
- **Steps**: 1. Inspect track element
- **Expected**: bg-slate-100 hoặc dark:bg-slate-700
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_166: role="progressbar" attribute present
- **Pre-conditions**: Có active plan
- **Steps**: 1. Inspect progress element
- **Expected**: role="progressbar" on element
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_167: aria-valuenow = percentComplete
- **Pre-conditions**: percentComplete = 58
- **Steps**: 1. Inspect aria-valuenow
- **Expected**: aria-valuenow="58"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_168: aria-valuemin = 0
- **Pre-conditions**: Có active plan
- **Steps**: 1. Inspect attribute
- **Expected**: aria-valuemin="0"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_169: aria-valuemax = 100
- **Pre-conditions**: Có active plan
- **Steps**: 1. Inspect attribute
- **Expected**: aria-valuemax="100"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_170: Cycle text: "Tuần X/Y" format
- **Pre-conditions**: Week 3 of 12
- **Steps**: 1. Quan sát cycle text
- **Expected**: Text chứa "3/12" hoặc tương đương
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_171: currentWeek clamped: never > totalWeeks
- **Pre-conditions**: Plan 8 weeks, started 10 weeks ago
- **Steps**: 1. Quan sát progress
- **Expected**: currentWeek = 8 (max), progress = 100%
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_PRG_172: currentWeek clamped: never < 1
- **Pre-conditions**: Plan just started today
- **Steps**: 1. Quan sát progress
- **Expected**: currentWeek = 1 (min)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_PRG_173: Multiple plans: chỉ active plan hiển thị
- **Pre-conditions**: 3 plans: 1 active, 2 completed
- **Steps**: 1. Quan sát cycle section
- **Expected**: Chỉ 1 progress bar cho active plan
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_174: Plan duration 1 week → progress = 100% ngay tuần đầu
- **Pre-conditions**: Active plan: 1 week total
- **Steps**: 1. Quan sát progress
- **Expected**: Progress = 100%
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_PRG_175: Dark mode: cycle progress bar colors
- **Pre-conditions**: Dark mode, active plan
- **Steps**: 1. Quan sát progress bar
- **Expected**: Track: dark:bg-slate-700, fill: bg-emerald-500
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_176: Insight volume up message khi volume tăng > 20%
- **Pre-conditions**: volumeChangePercent = 30
- **Steps**: 1. Quan sát insights section
- **Expected**: Insight hiển thị volume up message với +30%
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_177: Insight volume down message khi volume giảm > 20%
- **Pre-conditions**: volumeChangePercent = -25
- **Steps**: 1. Quan sát insights section
- **Expected**: Insight hiển thị volume down message với -25%
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_178: Insight missed sessions message
- **Pre-conditions**: completedSessions = 2, plannedSessions = 5
- **Steps**: 1. Quan sát insights
- **Expected**: Insight hiển thị "missed 3 sessions" message
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_179: Insight weight change message khi delta > 1kg
- **Pre-conditions**: weightDelta = 1.5
- **Steps**: 1. Quan sát insights
- **Expected**: Insight hiển thị weight change notification
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_180: Dismiss single insight → insight ẩn
- **Pre-conditions**: Có 3 insights
- **Steps**: 1. Click dismiss trên insight 1
- **Expected**: Insight 1 ẩn, insight 2 và 3 vẫn hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_181: Dismiss tất cả insights → section ẩn hoàn toàn
- **Pre-conditions**: Có 2 insights
- **Steps**: 1. Dismiss insight 1 2. Dismiss insight 2
- **Expected**: Insights section không hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_182: Dismissed insight không hiện lại khi re-render
- **Pre-conditions**: Dismissed insight "volume-up"
- **Steps**: 1. Trigger re-render
- **Expected**: Insight "volume-up" vẫn ẩn
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_PRG_183: Multiple insights hiển thị stacked
- **Pre-conditions**: Có 3 insights khác nhau
- **Steps**: 1. Quan sát layout
- **Expected**: 3 insight cards stacked vertically
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_184: Insight text chứa i18n parameters đúng
- **Pre-conditions**: Volume up 30%
- **Steps**: 1. Quan sát insight text
- **Expected**: Text chứa "30%" hoặc giá trị tương ứng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_185: Insight dismiss button có aria-label
- **Pre-conditions**: Có insight
- **Steps**: 1. Inspect dismiss button
- **Expected**: aria-label chứa "dismiss" hoặc tương đương
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_186: Không có insights → section ẩn
- **Pre-conditions**: volumeChangePercent trong range bình thường, no missed sessions
- **Steps**: 1. Quan sát dashboard
- **Expected**: Insights section không render
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_PRG_187: Volume tăng < 20% → không tạo insight
- **Pre-conditions**: volumeChangePercent = 10
- **Steps**: 1. Quan sát insights
- **Expected**: Không có volume insight
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_PRG_188: Volume giảm < 20% → không tạo insight
- **Pre-conditions**: volumeChangePercent = -10
- **Steps**: 1. Quan sát insights
- **Expected**: Không có volume insight
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_PRG_189: All sessions completed → không có missed sessions insight
- **Pre-conditions**: completedSessions >= plannedSessions
- **Steps**: 1. Quan sát insights
- **Expected**: Không có missed sessions insight
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_PRG_190: Weight delta < 1kg → không có weight change insight
- **Pre-conditions**: weightDelta = 0.3
- **Steps**: 1. Quan sát insights
- **Expected**: Không có weight change insight
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_PRG_191: Insights card bg-white dark:bg-slate-800
- **Pre-conditions**: Có insights
- **Steps**: 1. Inspect insight card
- **Expected**: bg-white hoặc dark:bg-slate-800
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_192: Dark mode: insight text colors
- **Pre-conditions**: Dark mode, có insights
- **Steps**: 1. Quan sát text colors
- **Expected**: Dark variant text colors applied
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_193: XSS trong insight parameters → escaped
- **Pre-conditions**: Insight text chứa "<script>alert(1)</script>"
- **Steps**: 1. Quan sát insight
- **Expected**: Text escaped, không execute
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_PRG_194: Insight ordering: most important first
- **Pre-conditions**: Có volume, sessions, weight insights
- **Steps**: 1. Kiểm tra thứ tự
- **Expected**: Insights theo thứ tự priority
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_195: Insight regeneration sau new workout
- **Pre-conditions**: Dismiss all insights, thêm workout mới
- **Steps**: 1. Thêm workout 2. Quan sát insights
- **Expected**: Insights mới xuất hiện dựa trên data mới
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_196: Insights với partial data (chỉ có weight, không có sessions)
- **Pre-conditions**: Có weight entries, không có trainingProfile
- **Steps**: 1. Quan sát insights
- **Expected**: Chỉ weight-related insights, không missed sessions
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_PRG_197: Empty insights sau khi dismiss tất cả → visibleInsights empty
- **Pre-conditions**: Dismiss all 3 insights
- **Steps**: 1. Quan sát DOM
- **Expected**: Insights section không render (visibleInsights.length = 0)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_198: Insight dismiss icon X button
- **Pre-conditions**: Có insight
- **Steps**: 1. Quan sát dismiss button
- **Expected**: X icon hoặc close icon hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_PRG_199: Insight với volume up > 100% → display correctly
- **Pre-conditions**: volumeChangePercent = 150
- **Steps**: 1. Quan sát insight text
- **Expected**: Text hiển thị "+150%" đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_PRG_200: Insight card padding và spacing consistent
- **Pre-conditions**: Có 2+ insights
- **Steps**: 1. Quan sát layout
- **Expected**: Spacing đồng đều giữa insight cards
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_PRG_201: Dark mode: hero card gradient không đổi
- **Pre-conditions**: Dark mode enabled
- **Steps**: 1. Quan sát hero card
- **Expected**: Gradient emerald vẫn giữ nguyên
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_202: Dark mode: metric cards bg dark:bg-slate-800
- **Pre-conditions**: Dark mode
- **Steps**: 1. Inspect metric cards
- **Expected**: dark:bg-slate-800 class applied
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_203: Dark mode: bottom sheet backdrop và content
- **Pre-conditions**: Dark mode, bottom sheet open
- **Steps**: 1. Quan sát sheet
- **Expected**: Sheet content dark:bg-slate-800, text dark variants
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_204: Dark mode: cycle progress bar
- **Pre-conditions**: Dark mode, active plan
- **Steps**: 1. Quan sát progress bar
- **Expected**: Track: dark:bg-slate-700, fill: emerald unchanged
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_205: Dark mode: insights section
- **Pre-conditions**: Dark mode, có insights
- **Steps**: 1. Quan sát insights
- **Expected**: Cards dark:bg-slate-800, text dark:text-slate-300
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_206: Dark mode: text colors throughout dashboard
- **Pre-conditions**: Dark mode
- **Steps**: 1. Quan sát all text
- **Expected**: Headings dark:text-white, body dark:text-slate-300
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_PRG_207: Performance: 500 workouts dashboard load
- **Pre-conditions**: 500 workouts trong store
- **Steps**: 1. Mở Progress dashboard 2. Measure load time
- **Expected**: Dashboard render < 3s, tất cả metrics tính đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_PRG_208: Performance: large weight entries chart render
- **Pre-conditions**: 365 weight entries, Weight card
- **Steps**: 1. Open bottom sheet 2. Click All
- **Expected**: Chart render < 1s
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_PRG_209: Performance: rapid card open/close 30 times
- **Pre-conditions**: Có workouts
- **Steps**: 1. Open/close bottom sheet 30 lần qua các cards
- **Expected**: UI stable, no memory leak, trạng thái đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_PRG_210: Accessibility: tab navigation qua all interactive elements
- **Pre-conditions**: Keyboard user
- **Steps**: 1. Tab qua CTA → metric cards → insights dismiss
- **Expected**: Focus di chuyển theo logical order
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2
