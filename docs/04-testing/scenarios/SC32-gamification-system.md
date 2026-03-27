# Scenario 32: Gamification System

**Version:** 2.0  
**Date:** 2026-06-27  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Gamification System bao gồm 3 component chính: StreakCounter (đếm streak tập luyện liên tục), PRToast (thông báo khi đạt Personal Record mới), và MilestonesList (danh sách mốc thành tích). StreakCounter hiển thị streak hiện tại, streak kỷ lục, cảnh báo "at risk", và 7 dots theo ngày trong tuần (✓ completed / 🌙 rest / 📍 today / ○ missed/upcoming). PRToast tự động dismiss sau 3 giây, hỗ trợ keyboard accessibility (Enter/Space). MilestonesList có toggle expand/collapse, progress bar tới milestone tiếp theo, phân biệt achieved (emerald) vs unachieved (opacity-50). Streak calculation hỗ trợ grace period (1 ngày bỏ lỡ), rest days (từ training plan), và longest streak forward scan.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| StreakCounter | StreakCounter.tsx | Hiển thị streak count, longest streak, week dots, at-risk warning |
| PRToast | PRToast.tsx | Toast notification khi đạt PR mới, auto-dismiss 3s |
| MilestonesList | MilestonesList.tsx | Danh sách milestones expandable, progress bar |
| useFitnessStore | fitnessStore.ts | Store: workouts, trainingPlanDays, trainingPlans |
| calculateStreak | gamification.ts | Tính streak info (current, longest, weekDots, atRisk) |
| checkMilestones | gamification.ts | Kiểm tra milestones đạt/chưa đạt |
| detectPRs | gamification.ts | Phát hiện Personal Records |
| MILESTONES | gamification.ts | Constants: 10 milestones (5 sessions + 5 streak) |

## Luồng nghiệp vụ

1. Mở tab Fitness → StreakCounter render → tính streak từ workouts + planDays
2. Tuần hiện tại hiển thị 7 dots: Mon-Sun, mỗi dot có status (completed/rest/missed/today/upcoming)
3. Streak "at risk" khi grace period đã dùng (1 ngày bỏ lỡ)
4. Khi log workout → detectPRs so sánh current sets vs history → hiển thị PRToast nếu có PR
5. PRToast auto-dismiss sau 3000ms, click/Enter/Space dismiss
6. MilestonesList toggle expand/collapse → hiển thị tất cả milestones + progress bar
7. Progress bar tính % towards next unachieved milestone

## Quy tắc nghiệp vụ

1. Streak tính từ today backward: mỗi ngày có workout hoặc rest day = +1, grace period = 1 (1 ngày miss nhưng vẫn giữ streak)
2. Rest days: ngày không có trong planDays set (từ active training plan) 
3. Week dots: Mon(1)-Sun(7), status = completed/rest/missed/today/upcoming
4. streakAtRisk = true khi grace period đã dùng
5. Longest streak: max(forward scan streak, current streak)
6. PR detection: currentSet.weightKg > max previous sets cho cùng exerciseId & reps
7. PRToast auto-dismiss: setTimeout 3000ms
8. PRToast keyboard: Enter/Space → onDismiss
9. MILESTONES: sessions (1,10,25,50,100), streak (7,14,30,60,90)
10. Milestone achieved: value >= threshold → achievedDate = today
11. Progress to next: current / threshold × 100, capped 100%
12. MilestonesList: aria-expanded toggle, ChevronDown rotate-180 khi expanded

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_GAM_01 | StreakCounter render với streak = 0 (no workouts) | Positive | P0 |
| TC_GAM_02 | StreakCounter hiển thị current streak count | Positive | P0 |
| TC_GAM_03 | StreakCounter hiển thị fire emoji 🔥 | Positive | P2 |
| TC_GAM_04 | StreakCounter hiển thị longest streak | Positive | P1 |
| TC_GAM_05 | Streak at risk warning hiển thị | Positive | P0 |
| TC_GAM_06 | Streak at risk ẩn khi không at risk | Positive | P1 |
| TC_GAM_07 | Week dots hiển thị 7 dots (Mon-Sun) | Positive | P0 |
| TC_GAM_08 | Dot completed (✓) cho ngày đã tập | Positive | P0 |
| TC_GAM_09 | Dot rest (🌙) cho ngày nghỉ theo plan | Positive | P1 |
| TC_GAM_10 | Dot today (📍) cho ngày hiện tại | Positive | P1 |
| TC_GAM_11 | Dot missed (○ red) cho ngày bỏ lỡ | Positive | P1 |
| TC_GAM_12 | Dot upcoming (○ gray) cho ngày tương lai | Positive | P1 |
| TC_GAM_13 | Day labels T2-CN hiển thị đúng thứ tự | Positive | P2 |
| TC_GAM_14 | Streak tính đúng khi có rest days | Positive | P0 |
| TC_GAM_15 | Grace period: 1 ngày miss vẫn giữ streak | Edge | P0 |
| TC_GAM_16 | Grace period: 2 ngày miss → streak break | Edge | P0 |
| TC_GAM_17 | No training plan → rest days = [] | Edge | P1 |
| TC_GAM_18 | Longest streak ≥ current streak | Positive | P1 |
| TC_GAM_19 | PRToast render khi có PR | Positive | P0 |
| TC_GAM_20 | PRToast hiển thị exercise name, weight, reps, improvement | Positive | P0 |
| TC_GAM_21 | PRToast auto-dismiss sau 3 giây | Positive | P0 |
| TC_GAM_22 | PRToast click → dismiss | Positive | P1 |
| TC_GAM_23 | PRToast Enter key → dismiss | Positive | P1 |
| TC_GAM_24 | PRToast Space key → dismiss | Positive | P1 |
| TC_GAM_25 | PRToast có role="alert" | Positive | P2 |
| TC_GAM_26 | PRToast có tabIndex=0 (focusable) | Positive | P2 |
| TC_GAM_27 | PRToast Trophy icon hiển thị | Positive | P2 |
| TC_GAM_28 | PRToast gradient background amber | Positive | P2 |
| TC_GAM_29 | MilestonesList collapsed mặc định | Positive | P0 |
| TC_GAM_30 | Click toggle → expand milestones list | Positive | P0 |
| TC_GAM_31 | Click toggle khi expanded → collapse | Positive | P0 |
| TC_GAM_32 | aria-expanded=true khi open | Positive | P2 |
| TC_GAM_33 | aria-expanded=false khi closed | Positive | P2 |
| TC_GAM_34 | ChevronDown rotate-180 khi expanded | Positive | P2 |
| TC_GAM_35 | Progress bar to next milestone | Positive | P0 |
| TC_GAM_36 | Progress bar role="progressbar" với aria attributes | Positive | P2 |
| TC_GAM_37 | Progress bar width = current/threshold × 100% | Positive | P1 |
| TC_GAM_38 | All milestones achieved → progress = 100% | Edge | P1 |
| TC_GAM_39 | Achieved milestone style: bg-emerald-50 | Positive | P1 |
| TC_GAM_40 | Unachieved milestone style: opacity-50 | Positive | P1 |
| TC_GAM_41 | Achieved milestone hiển thị date + CheckCircle | Positive | P1 |
| TC_GAM_42 | Milestone emoji hiển thị đúng | Positive | P2 |
| TC_GAM_43 | 10 milestones tổng (5 sessions + 5 streak) | Positive | P1 |
| TC_GAM_44 | First-time user: streak=0, no PRs, no milestones achieved | Edge | P0 |
| TC_GAM_45 | Streak calculation: workout chỉ hôm nay → streak = 1 | Edge | P1 |
| TC_GAM_46 | Streak calculation: workout mỗi ngày 7 ngày → streak = 7 | Positive | P1 |
| TC_GAM_47 | PR detection: cùng exercise, cùng reps, weight cao hơn | Positive | P1 |
| TC_GAM_48 | PR detection: không PR khi weight bằng/thấp hơn | Negative | P1 |
| TC_GAM_49 | PR detection: exercise mới (no history) → không phải PR | Edge | P1 |
| TC_GAM_50 | Milestone sessions-1: đạt sau 1 workout | Positive | P1 |
| TC_GAM_51 | Milestone streak-7: đạt sau 7 ngày liên tục | Positive | P2 |
| TC_GAM_52 | Dark mode — StreakCounter bg dark:bg-zinc-800 | Positive | P2 |
| TC_GAM_53 | XSS trong exercise name → escaped trong PRToast | Negative | P0 |
| TC_GAM_54 | Streak edge: timezone change → streak không bị break | Edge | P2 |
| TC_GAM_55 | Rapid toggle MilestonesList 20 lần → UI stable | Boundary | P2 |
| TC_GAM_56 | Streak = 0 khi không có workout nào cả | Positive | P0 |
| TC_GAM_57 | Streak = 1 khi chỉ có workout hôm nay | Positive | P0 |
| TC_GAM_58 | Streak = 2 khi có workout hôm nay + hôm qua | Positive | P1 |
| TC_GAM_59 | Streak = 3 khi 3 ngày liên tục | Positive | P1 |
| TC_GAM_60 | Streak = 7 khi tập đủ 1 tuần | Positive | P1 |
| TC_GAM_61 | Streak = 14 khi tập đủ 2 tuần | Positive | P2 |
| TC_GAM_62 | Streak = 30 khi tập đủ 1 tháng | Positive | P2 |
| TC_GAM_63 | Streak = 100 milestone | Boundary | P2 |
| TC_GAM_64 | Streak = 365 full year | Boundary | P2 |
| TC_GAM_65 | Streak tính đúng với rest days xen kẽ | Positive | P0 |
| TC_GAM_66 | Streak break khi miss 1 non-rest day nhưng có grace | Edge | P0 |
| TC_GAM_67 | Streak break khi miss 2 non-rest days | Edge | P0 |
| TC_GAM_68 | Streak break rồi resume → streak restart | Positive | P1 |
| TC_GAM_69 | Longest streak > current streak | Positive | P1 |
| TC_GAM_70 | Longest streak = current streak | Positive | P1 |
| TC_GAM_71 | Longest streak từ historical data | Positive | P2 |
| TC_GAM_72 | At risk: tập hôm qua nhưng chưa tập hôm nay | Positive | P0 |
| TC_GAM_73 | At risk: grace period đã dùng, 1 miss nữa sẽ break | Positive | P1 |
| TC_GAM_74 | At risk ẩn khi không at risk (vừa tập xong) | Positive | P1 |
| TC_GAM_75 | At risk warning text color: text-amber-600 | Positive | P2 |
| TC_GAM_76 | At risk dark mode: text-amber-400 | Positive | P2 |
| TC_GAM_77 | Week dots: đúng 7 dots hiển thị | Positive | P0 |
| TC_GAM_78 | Week dots: labels T2 T3 T4 T5 T6 T7 CN | Positive | P1 |
| TC_GAM_79 | Dot completed: CheckCircle icon, emerald-500 | Positive | P0 |
| TC_GAM_80 | Dot rest: Moon icon, blue-400 | Positive | P1 |
| TC_GAM_81 | Dot today: MapPin icon, emerald-600 | Positive | P1 |
| TC_GAM_82 | Dot missed: Circle icon, red-400 | Positive | P1 |
| TC_GAM_83 | Dot upcoming: Circle icon, zinc-300 (light) | Positive | P1 |
| TC_GAM_84 | Dot upcoming dark: Circle icon, zinc-600 | Positive | P2 |
| TC_GAM_85 | Week dots: 3 completed + today + 3 upcoming | Positive | P1 |
| TC_GAM_86 | Week dots: all 7 completed | Positive | P2 |
| TC_GAM_87 | Week dots: all rest days (rest plan) | Edge | P2 |
| TC_GAM_88 | Week dots: no workout this week | Edge | P1 |
| TC_GAM_89 | Week dots: only today completed | Positive | P2 |
| TC_GAM_90 | Dots order: Mon first, Sun last | Positive | P2 |
| TC_GAM_91 | Day labels khớp Vietnamese abbreviations | Positive | P2 |
| TC_GAM_92 | Fire emoji 🔥 hiển thị bên cạnh streak count | Positive | P2 |
| TC_GAM_93 | Fire emoji aria-hidden="true" | Positive | P2 |
| TC_GAM_94 | Container bg-white dark:bg-zinc-800 | Positive | P2 |
| TC_GAM_95 | Container dark mode: dark:bg-zinc-800 | Positive | P2 |
| TC_GAM_96 | Text heading dark:text-zinc-100 | Positive | P2 |
| TC_GAM_97 | Labels dark:text-zinc-400 | Positive | P2 |
| TC_GAM_98 | No active training plan → planDays = [] | Edge | P1 |
| TC_GAM_99 | Multiple training plans → chỉ active plan used | Positive | P1 |
| TC_GAM_100 | Streak calculation ignores inactive plans | Positive | P2 |
| TC_GAM_101 | Streak với mixed rest/workout days chính xác | Positive | P1 |
| TC_GAM_102 | Streak at midnight boundary | Edge | P2 |
| TC_GAM_103 | Streak display: number formatted đúng | Positive | P2 |
| TC_GAM_104 | Longest streak display label | Positive | P2 |
| TC_GAM_105 | Container shadow-sm class | Positive | P3 |
| TC_GAM_106 | Toast render với exercise name | Positive | P0 |
| TC_GAM_107 | Toast render với weight value | Positive | P0 |
| TC_GAM_108 | Toast render với reps count | Positive | P0 |
| TC_GAM_109 | Toast render với improvement (+Xkg) | Positive | P0 |
| TC_GAM_110 | Toast format: "Bench Press: 100kg × 5 reps (+5kg)" | Positive | P0 |
| TC_GAM_111 | Toast với long exercise name | Edge | P2 |
| TC_GAM_112 | Toast với weight rất cao (200kg) | Boundary | P2 |
| TC_GAM_113 | Toast với 1 rep | Positive | P2 |
| TC_GAM_114 | Toast với improvement = 0.5kg | Edge | P2 |
| TC_GAM_115 | Toast auto-dismiss sau 3000ms | Positive | P0 |
| TC_GAM_116 | Toast manual dismiss via click | Positive | P1 |
| TC_GAM_117 | Toast dismiss via Enter key | Positive | P1 |
| TC_GAM_118 | Toast dismiss via Space key | Positive | P1 |
| TC_GAM_119 | Toast dismiss via other keys → no effect | Negative | P1 |
| TC_GAM_120 | Toast role="alert" attribute | Positive | P2 |
| TC_GAM_121 | Toast tabIndex={0} attribute | Positive | P2 |
| TC_GAM_122 | Toast keyboard focus visible | Positive | P2 |
| TC_GAM_123 | Toast Trophy icon hiển thị | Positive | P2 |
| TC_GAM_124 | Toast Trophy icon aria-hidden="true" | Positive | P2 |
| TC_GAM_125 | Toast gradient: amber to orange background | Positive | P2 |
| TC_GAM_126 | Toast text: font-bold text-amber-900 cho title | Positive | P2 |
| TC_GAM_127 | Toast details: text-sm text-amber-800 | Positive | P2 |
| TC_GAM_128 | Toast position: fixed top-4 inset-x-4 | Positive | P2 |
| TC_GAM_129 | Toast z-index: z-50 | Positive | P2 |
| TC_GAM_130 | Multiple PRs: first toast appears | Positive | P1 |
| TC_GAM_131 | Toast unmount cleanup (clearTimeout) | Positive | P2 |
| TC_GAM_132 | Toast onDismiss prop called correctly on click | Positive | P1 |
| TC_GAM_133 | Toast re-render with new PR data | Positive | P2 |
| TC_GAM_134 | Toast XSS trong exercise name → escaped | Negative | P0 |
| TC_GAM_135 | Toast với Unicode characters | Edge | P2 |
| TC_GAM_136 | Toast với special characters | Edge | P2 |
| TC_GAM_137 | Toast preventDefault on Space key | Positive | P2 |
| TC_GAM_138 | Toast preventDefault on Enter key | Positive | P2 |
| TC_GAM_139 | Toast does NOT preventDefault on other keys | Negative | P2 |
| TC_GAM_140 | Timer reset on onDismiss prop change | Edge | P2 |
| TC_GAM_141 | Toast dark mode (gradient unchanged) | Positive | P2 |
| TC_GAM_142 | Toast screen reader: role="alert" announced | Positive | P2 |
| TC_GAM_143 | Toast title i18n: fitness.gamification.newPR | Positive | P2 |
| TC_GAM_144 | Toast accessible name readable | Positive | P3 |
| TC_GAM_145 | Toast with improvement = 0 → display "+0kg" | Edge | P2 |
| TC_GAM_146 | MilestonesList collapsed mặc định (isExpanded=false) | Positive | P0 |
| TC_GAM_147 | Click toggle → expand (isExpanded=true) | Positive | P0 |
| TC_GAM_148 | Click toggle lần nữa → collapse | Positive | P0 |
| TC_GAM_149 | aria-expanded="true" khi expanded | Positive | P2 |
| TC_GAM_150 | aria-expanded="false" khi collapsed | Positive | P2 |
| TC_GAM_151 | ChevronDown icon default state (not rotated) | Positive | P2 |
| TC_GAM_152 | ChevronDown rotate-180 khi expanded | Positive | P2 |
| TC_GAM_153 | Transition animation on chevron | Positive | P3 |
| TC_GAM_154 | Toggle button keyboard Enter | Positive | P2 |
| TC_GAM_155 | Toggle button keyboard Space | Positive | P2 |
| TC_GAM_156 | Next milestone card hiển thị khi có unachieved | Positive | P1 |
| TC_GAM_157 | Next milestone card ẩn khi tất cả achieved | Edge | P1 |
| TC_GAM_158 | Next milestone emoji hiển thị đúng | Positive | P2 |
| TC_GAM_159 | Next milestone label i18n key | Positive | P2 |
| TC_GAM_160 | Progress bar role="progressbar" present | Positive | P2 |
| TC_GAM_161 | Progress bar aria-valuenow đúng | Positive | P2 |
| TC_GAM_162 | Progress bar aria-valuemin=0 | Positive | P2 |
| TC_GAM_163 | Progress bar aria-valuemax=100 | Positive | P2 |
| TC_GAM_164 | Progress 0%: 0 of threshold | Positive | P1 |
| TC_GAM_165 | Progress 25%: quarter way | Positive | P2 |
| TC_GAM_166 | Progress 50%: halfway | Positive | P2 |
| TC_GAM_167 | Progress 75%: three quarters | Positive | P2 |
| TC_GAM_168 | Progress 99%: almost there | Edge | P2 |
| TC_GAM_169 | Progress 100%: all milestones achieved | Positive | P1 |
| TC_GAM_170 | Progress calculation: current/threshold × 100 | Positive | P1 |
| TC_GAM_171 | Progress capped at 100% (Math.min) | Boundary | P1 |
| TC_GAM_172 | Progress bar width matches percentage | Positive | P2 |
| TC_GAM_173 | Progress bar fill bg-emerald-500 | Positive | P2 |
| TC_GAM_174 | Progress bar background bg-zinc-200 dark:bg-zinc-700 | Positive | P2 |
| TC_GAM_175 | Achieved milestone: bg-emerald-50 | Positive | P1 |
| TC_GAM_176 | Achieved milestone dark: bg-emerald-900/20 | Positive | P2 |
| TC_GAM_177 | Achieved milestone hiển thị date | Positive | P1 |
| TC_GAM_178 | Achieved milestone hiển thị CheckCircle icon | Positive | P1 |
| TC_GAM_179 | Unachieved milestone: bg-zinc-50 opacity-50 | Positive | P1 |
| TC_GAM_180 | Unachieved milestone dark: bg-zinc-800/50 | Positive | P2 |
| TC_GAM_181 | 10 total milestones (5 sessions + 5 streak) | Positive | P1 |
| TC_GAM_182 | Sessions milestones: thresholds 1, 10, 25, 50, 100 | Positive | P1 |
| TC_GAM_183 | Streak milestones: thresholds 7, 14, 30, 60, 90 | Positive | P1 |
| TC_GAM_184 | First milestone (1 session): achieved sau 1 workout | Positive | P1 |
| TC_GAM_185 | Milestone 10 sessions: achieved khi 10+ workouts | Positive | P2 |
| TC_GAM_186 | Milestone streak-7: achieved khi longestStreak ≥ 7 | Positive | P2 |
| TC_GAM_187 | Milestone ordering trong list | Positive | P2 |
| TC_GAM_188 | Milestone emoji display cho mỗi type | Positive | P2 |
| TC_GAM_189 | Milestone label matches i18n key | Positive | P2 |
| TC_GAM_190 | All milestones achieved → progress 100%, no next | Edge | P1 |
| TC_GAM_191 | No milestones achieved → first as next | Edge | P1 |
| TC_GAM_192 | Some achieved, some not → correct next picked | Positive | P1 |
| TC_GAM_193 | Long milestone name handling | Edge | P3 |
| TC_GAM_194 | Milestone achieved date format display | Positive | P2 |
| TC_GAM_195 | Expanded content dark mode colors | Positive | P2 |
| TC_GAM_196 | First-time user: streak=0, no PRs, 0 milestones achieved | Edge | P0 |
| TC_GAM_197 | After first workout: streak=1, milestone-1 achieved | Positive | P0 |
| TC_GAM_198 | After 7 consecutive days: streak=7, milestone streak-7 achieved | Positive | P1 |
| TC_GAM_199 | PR detected: PRToast shows while StreakCounter visible | Positive | P1 |
| TC_GAM_200 | StreakCounter + MilestonesList trên cùng screen | Positive | P2 |
| TC_GAM_201 | Data consistency: streak và milestones dùng cùng data | Positive | P1 |
| TC_GAM_202 | All components use same store data | Positive | P2 |
| TC_GAM_203 | Component refresh: all update together | Positive | P1 |
| TC_GAM_204 | PRToast unmount cleanup: timer cleared | Positive | P2 |
| TC_GAM_205 | Large workout history (500+): performance stable | Boundary | P1 |
| TC_GAM_206 | Dark mode: StreakCounter tất cả elements | Positive | P2 |
| TC_GAM_207 | Dark mode: MilestonesList tất cả elements | Positive | P2 |
| TC_GAM_208 | Accessibility: tất cả aria attributes verified | Positive | P1 |
| TC_GAM_209 | Screen reader: streak count announced | Positive | P2 |
| TC_GAM_210 | Touch targets ≥ 44px trên interactive elements | Positive | P3 |

---

## Chi tiết Test Cases

##### TC_GAM_01: StreakCounter render với streak = 0 (no workouts)
- **Pre-conditions**: fitnessStore.workouts = []
- **Steps**: 1. Render StreakCounter
- **Expected**: data-testid="streak-count" = "0", streak-warning ẩn
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_02: StreakCounter hiển thị current streak count
- **Pre-conditions**: 5 workouts liên tục 5 ngày gần nhất
- **Steps**: 1. Quan sát data-testid="streak-count"
- **Expected**: Text = "5" (hoặc số phù hợp tùy rest days)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_03: StreakCounter hiển thị fire emoji 🔥
- **Pre-conditions**: Component render
- **Steps**: 1. Quan sát streak counter header
- **Expected**: Emoji 🔥 hiển thị bên trái streak count
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_04: StreakCounter hiển thị longest streak
- **Pre-conditions**: currentStreak=5, longestStreak=10
- **Steps**: 1. Quan sát data-testid="streak-record"
- **Expected**: Text chứa "Kỷ lục: 10"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_05: Streak at risk warning hiển thị
- **Pre-conditions**: streakAtRisk = true (grace period đã dùng)
- **Steps**: 1. Quan sát data-testid="streak-warning"
- **Expected**: Warning text hiển thị, text-amber-600
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_06: Streak at risk ẩn khi không at risk
- **Pre-conditions**: streakAtRisk = false
- **Steps**: 1. Quan sát component
- **Expected**: streak-warning không render
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_07: Week dots hiển thị 7 dots (Mon-Sun)
- **Pre-conditions**: Component render
- **Steps**: 1. Quan sát data-testid="week-dots"
- **Expected**: 7 dot elements, mỗi dot có label (T2, T3, T4, T5, T6, T7, CN)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_08: Dot completed (✓) cho ngày đã tập
- **Pre-conditions**: Workout đã log cho thứ Hai tuần này
- **Steps**: 1. Quan sát dot-completed elements
- **Expected**: CheckCircle icon (text-emerald-500) cho ngày thứ Hai
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_09: Dot rest (🌙) cho ngày nghỉ theo plan
- **Pre-conditions**: Active plan, thứ Tư không trong planDays, không có workout thứ Tư
- **Steps**: 1. Quan sát dot cho thứ Tư
- **Expected**: Moon icon (text-blue-400), status = 'rest'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_10: Dot today (📍) cho ngày hiện tại
- **Pre-conditions**: Ngày hiện tại chưa qua
- **Steps**: 1. Quan sát dot cho today
- **Expected**: MapPin icon (text-emerald-600), status = 'today'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_11: Dot missed (○ red) cho ngày bỏ lỡ
- **Pre-conditions**: Ngày trong quá khứ, có trong planDays, không có workout
- **Steps**: 1. Quan sát dot cho ngày bỏ lỡ
- **Expected**: Circle icon (text-red-400), status = 'missed'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_12: Dot upcoming (○ gray) cho ngày tương lai
- **Pre-conditions**: Ngày chưa đến
- **Steps**: 1. Quan sát dot cho ngày tương lai
- **Expected**: Circle icon (text-zinc-300), status = 'upcoming'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_13: Day labels T2-CN hiển thị đúng thứ tự
- **Pre-conditions**: Component render
- **Steps**: 1. Đọc labels của 7 dots
- **Expected**: Thứ tự: T2, T3, T4, T5, T6, T7, CN
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_14: Streak tính đúng khi có rest days
- **Pre-conditions**: Plan days = [1,3,5] (Mon,Wed,Fri), workouts cho Mon,Wed,Fri × 2 tuần
- **Steps**: 1. Quan sát streak-count
- **Expected**: Streak = 14 (6 workout days + 8 rest days = 14 ngày liên tục)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_15: Grace period: 1 ngày miss vẫn giữ streak
- **Pre-conditions**: Workout mỗi ngày 5 ngày, miss 1 ngày, workout hôm nay
- **Steps**: 1. Quan sát streak-count
- **Expected**: Streak > 5 (grace period cho 1 ngày miss), streakAtRisk = true
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P0

##### TC_GAM_16: Grace period: 2 ngày miss → streak break
- **Pre-conditions**: Workout 5 ngày liên tục, miss 2 ngày, workout hôm nay
- **Steps**: 1. Quan sát streak-count
- **Expected**: Streak = 1 (chỉ hôm nay, streak đã break)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P0

##### TC_GAM_17: No training plan → rest days = []
- **Pre-conditions**: Không có active training plan
- **Steps**: 1. Render StreakCounter
- **Expected**: planDays = [], streak chỉ đếm ngày có workout, mọi ngày không workout = break
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_GAM_18: Longest streak ≥ current streak
- **Pre-conditions**: Có lịch sử workout dài hạn
- **Steps**: 1. Quan sát streak-count và streak-record
- **Expected**: longestStreak >= currentStreak luôn đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_19: PRToast render khi có PR
- **Pre-conditions**: detectPRs trả về PR: { exerciseName: "Bench Press", newWeight: 100, reps: 5, improvement: 5 }
- **Steps**: 1. Render PRToast với pr prop
- **Expected**: data-testid="pr-toast" hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_20: PRToast hiển thị exercise name, weight, reps, improvement
- **Pre-conditions**: PR: Bench Press 100kg × 5 reps (+5kg)
- **Steps**: 1. Quan sát data-testid="pr-details"
- **Expected**: Text "Bench Press: 100kg × 5 reps (+5kg)"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_21: PRToast auto-dismiss sau 3 giây
- **Pre-conditions**: PRToast vừa hiển thị
- **Steps**: 1. Đợi 3 giây
- **Expected**: onDismiss được gọi sau 3000ms (setTimeout)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_22: PRToast click → dismiss
- **Pre-conditions**: PRToast đang hiển thị
- **Steps**: 1. Click vào pr-toast
- **Expected**: onDismiss được gọi
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_23: PRToast Enter key → dismiss
- **Pre-conditions**: PRToast đang focus (tabIndex=0)
- **Steps**: 1. Focus pr-toast 2. Nhấn Enter
- **Expected**: onDismiss được gọi, e.preventDefault()
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_24: PRToast Space key → dismiss
- **Pre-conditions**: PRToast đang focus
- **Steps**: 1. Focus pr-toast 2. Nhấn Space
- **Expected**: onDismiss được gọi, e.preventDefault()
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_25: PRToast có role="alert"
- **Pre-conditions**: PRToast render
- **Steps**: 1. Inspect pr-toast element
- **Expected**: role="alert" attribute present
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_26: PRToast có tabIndex=0 (focusable)
- **Pre-conditions**: PRToast render
- **Steps**: 1. Inspect pr-toast
- **Expected**: tabIndex=0, element focusable qua keyboard
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_27: PRToast Trophy icon hiển thị
- **Pre-conditions**: PRToast render
- **Steps**: 1. Quan sát toast header
- **Expected**: Trophy icon (h-5 w-5) hiển thị bên trái "PR Mới!"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_28: PRToast gradient background amber
- **Pre-conditions**: PRToast render
- **Steps**: 1. Inspect style
- **Expected**: background = "linear-gradient(to right, #f59e0b, #d97706)"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_29: MilestonesList collapsed mặc định
- **Pre-conditions**: MilestonesList vừa render
- **Steps**: 1. Quan sát milestones-toggle aria-expanded
- **Expected**: aria-expanded="false", milestones-content không render
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_30: Click toggle → expand milestones list
- **Pre-conditions**: MilestonesList collapsed
- **Steps**: 1. Click milestones-toggle
- **Expected**: milestones-content hiển thị, aria-expanded="true"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_31: Click toggle khi expanded → collapse
- **Pre-conditions**: MilestonesList expanded
- **Steps**: 1. Click milestones-toggle lần nữa
- **Expected**: milestones-content ẩn, aria-expanded="false"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_32: aria-expanded=true khi open
- **Pre-conditions**: MilestonesList expanded
- **Steps**: 1. Inspect milestones-toggle
- **Expected**: aria-expanded="true"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_33: aria-expanded=false khi closed
- **Pre-conditions**: MilestonesList collapsed
- **Steps**: 1. Inspect milestones-toggle
- **Expected**: aria-expanded="false"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_34: ChevronDown rotate-180 khi expanded
- **Pre-conditions**: MilestonesList expanded
- **Steps**: 1. Inspect ChevronDown class
- **Expected**: class chứa "rotate-180"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_35: Progress bar to next milestone
- **Pre-conditions**: 15 workouts (sessions-25 is next milestone), expanded
- **Steps**: 1. Quan sát data-testid="progress-bar"
- **Expected**: Progress bar hiển thị, next milestone = "⚡ 25 sessions"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_36: Progress bar role="progressbar" với aria attributes
- **Pre-conditions**: Expanded, có next milestone
- **Steps**: 1. Inspect progress-bar
- **Expected**: role="progressbar", aria-valuenow, aria-valuemin=0, aria-valuemax=100
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_37: Progress bar width = current/threshold × 100%
- **Pre-conditions**: 15 sessions, next milestone threshold = 25
- **Steps**: 1. Inspect progress-fill style
- **Expected**: width = "60%" (15/25 × 100)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_38: All milestones achieved → progress = 100%
- **Pre-conditions**: 100+ sessions, longest streak 90+
- **Steps**: 1. Expand milestones 2. Quan sát progress bar
- **Expected**: Tất cả milestones có achievedDate, progress = 100%, no "next milestone" text
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_GAM_39: Achieved milestone style: bg-emerald-50
- **Pre-conditions**: Milestone sessions-1 achieved (1 workout)
- **Steps**: 1. Expand milestones 2. Quan sát milestone-sessions-1
- **Expected**: class chứa bg-emerald-50 (hoặc dark:bg-emerald-900/20)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_40: Unachieved milestone style: opacity-50
- **Pre-conditions**: Milestone sessions-100 chưa đạt (< 100 workouts)
- **Steps**: 1. Quan sát milestone-sessions-100
- **Expected**: class chứa "opacity-50", bg-zinc-50
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_41: Achieved milestone hiển thị date + CheckCircle
- **Pre-conditions**: Milestone đã achieved
- **Steps**: 1. Quan sát milestone-date-{id}
- **Expected**: CheckCircle icon + "Đạt được" + date text, text-emerald-600
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_42: Milestone emoji hiển thị đúng
- **Pre-conditions**: Expanded milestones
- **Steps**: 1. Quan sát emoji cho từng milestone
- **Expected**: 🥇(1), 💪(10), ⚡(25), 🔥(50), 💎(100), 📅(7), 🌟(14), 🦁(30), 👑(60), 🏆(90)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_43: 10 milestones tổng (5 sessions + 5 streak)
- **Pre-conditions**: MilestonesList expanded
- **Steps**: 1. Đếm milestone elements
- **Expected**: 10 milestone items render
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_44: First-time user: streak=0, no PRs, no milestones achieved
- **Pre-conditions**: workouts = [], mới tạo account
- **Steps**: 1. Render StreakCounter 2. Render MilestonesList
- **Expected**: Streak = 0, no warning, all dots = upcoming/today, all milestones unachieved (opacity-50)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P0

##### TC_GAM_45: Streak calculation: workout chỉ hôm nay → streak = 1
- **Pre-conditions**: 1 workout ngày hôm nay, no plan
- **Steps**: 1. Quan sát streak-count
- **Expected**: currentStreak = 1
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_GAM_46: Streak calculation: workout mỗi ngày 7 ngày → streak = 7
- **Pre-conditions**: Workouts cho 7 ngày liên tục, no plan
- **Steps**: 1. Quan sát streak-count
- **Expected**: currentStreak = 7
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_47: PR detection: cùng exercise, cùng reps, weight cao hơn
- **Pre-conditions**: Previous: Squat 100kg × 5, current: Squat 105kg × 5
- **Steps**: 1. detectPRs(currentSets, previousSets, exerciseMap)
- **Expected**: PRDetection: { newWeight: 105, previousWeight: 100, improvement: 5 }
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_48: PR detection: không PR khi weight bằng/thấp hơn
- **Pre-conditions**: Previous: Squat 100kg × 5, current: Squat 100kg × 5
- **Steps**: 1. detectPRs(currentSets, previousSets, exerciseMap)
- **Expected**: Trả về [] (empty, no PR)
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_GAM_49: PR detection: exercise mới (no history) → không phải PR
- **Pre-conditions**: Current set cho exercise chưa có trong history
- **Steps**: 1. detectPRs(currentSets, [], exerciseMap)
- **Expected**: Trả về [] (no previous sets to compare)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_GAM_50: Milestone sessions-1: đạt sau 1 workout
- **Pre-conditions**: 1 workout
- **Steps**: 1. checkMilestones(1, 0)
- **Expected**: sessions-1 milestone có achievedDate = today
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_51: Milestone streak-7: đạt sau 7 ngày liên tục
- **Pre-conditions**: longestStreak = 7
- **Steps**: 1. checkMilestones(workouts.length, 7)
- **Expected**: streak-7 milestone có achievedDate = today
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_52: Dark mode — StreakCounter bg dark:bg-zinc-800
- **Pre-conditions**: Dark mode enabled
- **Steps**: 1. Quan sát streak-counter
- **Expected**: bg-zinc-800, text dark variants
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_53: XSS trong exercise name → escaped trong PRToast
- **Pre-conditions**: PR với exerciseName = `<script>alert(1)</script>`
- **Steps**: 1. Render PRToast
- **Expected**: Text escaped, React auto-escapes, không execute
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_GAM_54: Streak edge: timezone change → streak không bị break
- **Pre-conditions**: Workouts spanning timezone change
- **Steps**: 1. Quan sát streak
- **Expected**: Streak tính dựa trên date string (YYYY-MM-DD), không affected bởi timezone
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GAM_55: Rapid toggle MilestonesList 20 lần → UI stable
- **Pre-conditions**: MilestonesList có milestones
- **Steps**: 1. Click toggle nhanh 20 lần
- **Expected**: UI stable, expanded/collapsed state đúng cuối cùng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GAM_56: Streak = 0 khi không có workout nào cả
- **Pre-conditions**: workouts = [], trainingPlans has active
- **Steps**: 1. Render StreakCounter
- **Expected**: streak-count = "0", warning ẩn
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_57: Streak = 1 khi chỉ có workout hôm nay
- **Pre-conditions**: workouts = [{ date: today }]
- **Steps**: 1. Render StreakCounter
- **Expected**: streak-count = "1"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_58: Streak = 2 khi có workout hôm nay + hôm qua
- **Pre-conditions**: workouts = [today, yesterday]
- **Steps**: 1. Render StreakCounter
- **Expected**: streak-count = "2"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_59: Streak = 3 khi 3 ngày liên tục
- **Pre-conditions**: workouts: today, yesterday, 2 days ago
- **Steps**: 1. Render StreakCounter
- **Expected**: streak-count = "3"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_60: Streak = 7 khi tập đủ 1 tuần
- **Pre-conditions**: workouts: 7 ngày liên tục
- **Steps**: 1. Render StreakCounter
- **Expected**: streak-count = "7"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_61: Streak = 14 khi tập đủ 2 tuần
- **Pre-conditions**: workouts: 14 ngày liên tục
- **Steps**: 1. Render StreakCounter
- **Expected**: streak-count = "14"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_62: Streak = 30 khi tập đủ 1 tháng
- **Pre-conditions**: workouts: 30 ngày liên tục
- **Steps**: 1. Render StreakCounter
- **Expected**: streak-count = "30"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_63: Streak = 100 milestone
- **Pre-conditions**: workouts: 100 ngày liên tục
- **Steps**: 1. Render StreakCounter
- **Expected**: streak-count = "100"
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GAM_64: Streak = 365 full year
- **Pre-conditions**: workouts: 365 ngày liên tục
- **Steps**: 1. Render StreakCounter
- **Expected**: streak-count = "365"
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GAM_65: Streak tính đúng với rest days xen kẽ
- **Pre-conditions**: Plan: Mon,Wed,Fri; workouts: Mon, (Tue rest), Wed
- **Steps**: 1. Render StreakCounter
- **Expected**: Streak tiếp tục qua rest days
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_66: Streak break khi miss 1 non-rest day nhưng có grace
- **Pre-conditions**: Miss 1 planned day (grace period)
- **Steps**: 1. Render StreakCounter
- **Expected**: Streak vẫn tiếp tục (grace period = 1)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P0

##### TC_GAM_67: Streak break khi miss 2 non-rest days
- **Pre-conditions**: Miss 2 planned days liên tục
- **Steps**: 1. Render StreakCounter
- **Expected**: Streak reset về 0 hoặc 1
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P0

##### TC_GAM_68: Streak break rồi resume → streak restart
- **Pre-conditions**: Streak = 5, miss 2 days, tập lại hôm nay
- **Steps**: 1. Render StreakCounter
- **Expected**: Streak = 1 (restart)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_69: Longest streak > current streak
- **Pre-conditions**: Historical streak = 10, current = 3
- **Steps**: 1. Quan sát longest streak text
- **Expected**: Longest = 10, current = 3
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_70: Longest streak = current streak
- **Pre-conditions**: Current streak = 7 (cũng là max)
- **Steps**: 1. Quan sát longest streak
- **Expected**: Longest = current = 7
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_71: Longest streak từ historical data
- **Pre-conditions**: Past streak 20 days (2 months ago), current = 5
- **Steps**: 1. Quan sát longest streak
- **Expected**: Longest = 20
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_72: At risk: tập hôm qua nhưng chưa tập hôm nay
- **Pre-conditions**: Last workout = yesterday, today planned but not done
- **Steps**: 1. Quan sát streak-warning
- **Expected**: Warning text hiển thị amber-600
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_73: At risk: grace period đã dùng, 1 miss nữa sẽ break
- **Pre-conditions**: Grace used, next miss breaks streak
- **Steps**: 1. Quan sát warning
- **Expected**: streakAtRisk = true, warning visible
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_74: At risk ẩn khi không at risk (vừa tập xong)
- **Pre-conditions**: Workout hôm nay đã complete
- **Steps**: 1. Quan sát component
- **Expected**: streak-warning không hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_75: At risk warning text color: text-amber-600
- **Pre-conditions**: streakAtRisk = true
- **Steps**: 1. Inspect warning text
- **Expected**: class text-amber-600
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_76: At risk dark mode: text-amber-400
- **Pre-conditions**: Dark mode, at risk
- **Steps**: 1. Inspect warning
- **Expected**: dark:text-amber-400
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_77: Week dots: đúng 7 dots hiển thị
- **Pre-conditions**: Có workouts
- **Steps**: 1. Đếm dots
- **Expected**: 7 dot elements (Mon-Sun)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_78: Week dots: labels T2 T3 T4 T5 T6 T7 CN
- **Pre-conditions**: Có component
- **Steps**: 1. Quan sát day labels
- **Expected**: Labels = ["T2","T3","T4","T5","T6","T7","CN"] theo thứ tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_79: Dot completed: CheckCircle icon, emerald-500
- **Pre-conditions**: Ngày T2 đã tập
- **Steps**: 1. Quan sát dot T2
- **Expected**: CheckCircle icon, class text-emerald-500
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_80: Dot rest: Moon icon, blue-400
- **Pre-conditions**: Ngày T3 là rest day (không trong plan)
- **Steps**: 1. Quan sát dot T3
- **Expected**: Moon icon, class text-blue-400
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_81: Dot today: MapPin icon, emerald-600
- **Pre-conditions**: Hôm nay = T4
- **Steps**: 1. Quan sát dot T4
- **Expected**: MapPin icon, class text-emerald-600
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_82: Dot missed: Circle icon, red-400
- **Pre-conditions**: Ngày T2 planned nhưng không tập
- **Steps**: 1. Quan sát dot T2
- **Expected**: Circle icon, class text-red-400
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_83: Dot upcoming: Circle icon, zinc-300 (light)
- **Pre-conditions**: Ngày T6 trong tương lai
- **Steps**: 1. Quan sát dot T6
- **Expected**: Circle icon, class text-zinc-300
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_84: Dot upcoming dark: Circle icon, zinc-600
- **Pre-conditions**: Dark mode, ngày T6 future
- **Steps**: 1. Quan sát dot T6
- **Expected**: Circle icon, dark:text-zinc-600
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_85: Week dots: 3 completed + today + 3 upcoming
- **Pre-conditions**: Mon-Wed tập, today = Thu, Fri-Sun future
- **Steps**: 1. Quan sát 7 dots
- **Expected**: Mon-Wed: completed, Thu: today, Fri-Sun: upcoming
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_86: Week dots: all 7 completed
- **Pre-conditions**: Tập cả 7 ngày, today = Sunday
- **Steps**: 1. Quan sát dots
- **Expected**: Tất cả 7 dots = completed (CheckCircle)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_87: Week dots: all rest days (rest plan)
- **Pre-conditions**: Plan không có ngày tập nào
- **Steps**: 1. Quan sát dots
- **Expected**: Tất cả dots = rest (Moon) trừ today
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GAM_88: Week dots: no workout this week
- **Pre-conditions**: Không tập ngày nào, today = Wed
- **Steps**: 1. Quan sát dots
- **Expected**: Mon-Tue: missed, Wed: today, Thu-Sun: upcoming
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_GAM_89: Week dots: only today completed
- **Pre-conditions**: Chỉ tập hôm nay (Mon)
- **Steps**: 1. Quan sát dots
- **Expected**: Mon: completed, Tue-Sun: upcoming/rest
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_90: Dots order: Mon first, Sun last
- **Pre-conditions**: Có component
- **Steps**: 1. Kiểm tra DOM order
- **Expected**: DAY_LABELS[0]="T2" (Mon) → DAY_LABELS[6]="CN" (Sun)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_91: Day labels khớp Vietnamese abbreviations
- **Pre-conditions**: Có component
- **Steps**: 1. Quan sát labels
- **Expected**: T2=Monday, T3=Tuesday...T7=Saturday, CN=Sunday
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_92: Fire emoji 🔥 hiển thị bên cạnh streak count
- **Pre-conditions**: streak > 0
- **Steps**: 1. Quan sát streak display
- **Expected**: 🔥 emoji visible
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_93: Fire emoji aria-hidden="true"
- **Pre-conditions**: Có component
- **Steps**: 1. Inspect emoji element
- **Expected**: aria-hidden="true" on 🔥
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_94: Container bg-white dark:bg-zinc-800
- **Pre-conditions**: Light mode
- **Steps**: 1. Inspect container
- **Expected**: bg-white class
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_95: Container dark mode: dark:bg-zinc-800
- **Pre-conditions**: Dark mode
- **Steps**: 1. Inspect container
- **Expected**: dark:bg-zinc-800
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_96: Text heading dark:text-zinc-100
- **Pre-conditions**: Dark mode
- **Steps**: 1. Inspect heading
- **Expected**: dark:text-zinc-100
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_97: Labels dark:text-zinc-400
- **Pre-conditions**: Dark mode
- **Steps**: 1. Inspect labels
- **Expected**: dark:text-zinc-400
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_98: No active training plan → planDays = []
- **Pre-conditions**: trainingPlans = [] hoặc all inactive
- **Steps**: 1. Render StreakCounter
- **Expected**: Streak calculated with planDays = [], rest days default
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_GAM_99: Multiple training plans → chỉ active plan used
- **Pre-conditions**: 3 plans: 1 active, 2 completed
- **Steps**: 1. Render StreakCounter
- **Expected**: planDays từ active plan only
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_100: Streak calculation ignores inactive plans
- **Pre-conditions**: Active plan days [1,3,5], inactive plan days [1,2,3,4,5]
- **Steps**: 1. Render StreakCounter
- **Expected**: Rest days based on active plan [1,3,5] only
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_101: Streak với mixed rest/workout days chính xác
- **Pre-conditions**: Plan: Mon,Wed,Fri; Tập Mon,Wed (rest Tue,Thu)
- **Steps**: 1. Quan sát streak
- **Expected**: Streak = 4 (Mon+Tue(rest)+Wed+Thu(rest))
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_102: Streak at midnight boundary
- **Pre-conditions**: Workout logged 23:59, next check 00:01
- **Steps**: 1. Quan sát streak
- **Expected**: Streak tính dựa trên date string, không bị ảnh hưởng bởi giờ
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GAM_103: Streak display: number formatted đúng
- **Pre-conditions**: streak = 42
- **Steps**: 1. Quan sát streak-count
- **Expected**: Text = "42"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_104: Longest streak display label
- **Pre-conditions**: longestStreak = 15
- **Steps**: 1. Quan sát longest streak text
- **Expected**: t("fitness.gamification.longestStreak") + ": 15"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_105: Container shadow-sm class
- **Pre-conditions**: Có component
- **Steps**: 1. Inspect container
- **Expected**: shadow-sm class present
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_GAM_106: Toast render với exercise name
- **Pre-conditions**: PR: exerciseName = "Bench Press"
- **Steps**: 1. Render PRToast
- **Expected**: Text chứa "Bench Press"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_107: Toast render với weight value
- **Pre-conditions**: PR: newWeight = 100
- **Steps**: 1. Render PRToast
- **Expected**: Text chứa "100kg"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_108: Toast render với reps count
- **Pre-conditions**: PR: reps = 5
- **Steps**: 1. Render PRToast
- **Expected**: Text chứa "5 reps"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_109: Toast render với improvement (+Xkg)
- **Pre-conditions**: PR: improvement = 5
- **Steps**: 1. Render PRToast
- **Expected**: Text chứa "+5kg"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_110: Toast format: "Bench Press: 100kg × 5 reps (+5kg)"
- **Pre-conditions**: PR: exerciseName="Bench Press", newWeight=100, reps=5, improvement=5
- **Steps**: 1. Quan sát toast text
- **Expected**: Format đúng: "Bench Press: 100kg × 5 reps (+5kg)"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_111: Toast với long exercise name
- **Pre-conditions**: exerciseName = "Dumbbell Incline Bench Press Alternating"
- **Steps**: 1. Render PRToast
- **Expected**: Exercise name hiển thị đầy đủ hoặc truncated
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GAM_112: Toast với weight rất cao (200kg)
- **Pre-conditions**: newWeight = 200
- **Steps**: 1. Render PRToast
- **Expected**: Text "200kg" hiển thị đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GAM_113: Toast với 1 rep
- **Pre-conditions**: reps = 1
- **Steps**: 1. Render PRToast
- **Expected**: Text chứa "1 reps"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_114: Toast với improvement = 0.5kg
- **Pre-conditions**: improvement = 0.5
- **Steps**: 1. Render PRToast
- **Expected**: Text "+0.5kg"
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GAM_115: Toast auto-dismiss sau 3000ms
- **Pre-conditions**: PRToast rendered
- **Steps**: 1. Đợi 3 giây
- **Expected**: onDismiss called sau 3000ms, toast ẩn
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_116: Toast manual dismiss via click
- **Pre-conditions**: PRToast visible
- **Steps**: 1. Click toast
- **Expected**: onDismiss called, toast ẩn
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_117: Toast dismiss via Enter key
- **Pre-conditions**: Focus on toast
- **Steps**: 1. Nhấn Enter
- **Expected**: onDismiss called, preventDefault
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_118: Toast dismiss via Space key
- **Pre-conditions**: Focus on toast
- **Steps**: 1. Nhấn Space
- **Expected**: onDismiss called, preventDefault
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_119: Toast dismiss via other keys → no effect
- **Pre-conditions**: Focus on toast
- **Steps**: 1. Nhấn "A" key
- **Expected**: onDismiss NOT called, toast vẫn hiện
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_GAM_120: Toast role="alert" attribute
- **Pre-conditions**: PRToast rendered
- **Steps**: 1. Inspect toast element
- **Expected**: role="alert" present
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_121: Toast tabIndex={0} attribute
- **Pre-conditions**: PRToast rendered
- **Steps**: 1. Inspect toast
- **Expected**: tabIndex="0" (focusable)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_122: Toast keyboard focus visible
- **Pre-conditions**: Tab to toast
- **Steps**: 1. Tab focus đến toast
- **Expected**: Focus outline/ring visible
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_123: Toast Trophy icon hiển thị
- **Pre-conditions**: PRToast rendered
- **Steps**: 1. Quan sát icon
- **Expected**: Trophy icon visible
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_124: Toast Trophy icon aria-hidden="true"
- **Pre-conditions**: PRToast rendered
- **Steps**: 1. Inspect Trophy icon
- **Expected**: aria-hidden="true"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_125: Toast gradient: amber to orange background
- **Pre-conditions**: PRToast rendered
- **Steps**: 1. Inspect background style
- **Expected**: linear-gradient(to right, #f59e0b, #d97706)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_126: Toast text: font-bold text-amber-900 cho title
- **Pre-conditions**: PRToast rendered
- **Steps**: 1. Inspect title text
- **Expected**: font-bold text-amber-900
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_127: Toast details: text-sm text-amber-800
- **Pre-conditions**: PRToast rendered
- **Steps**: 1. Inspect detail text
- **Expected**: text-sm text-amber-800
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_128: Toast position: fixed top-4 inset-x-4
- **Pre-conditions**: PRToast rendered
- **Steps**: 1. Inspect position
- **Expected**: fixed inset-x-4 top-4
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_129: Toast z-index: z-50
- **Pre-conditions**: PRToast rendered
- **Steps**: 1. Inspect z-index
- **Expected**: z-50 class
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_130: Multiple PRs: first toast appears
- **Pre-conditions**: 2 PRs in 1 session
- **Steps**: 1. Trigger 2 PRs
- **Expected**: First PR toast appears
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_131: Toast unmount cleanup (clearTimeout)
- **Pre-conditions**: PRToast rendered then unmounted
- **Steps**: 1. Unmount component
- **Expected**: setTimeout cleared, no memory leak
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_132: Toast onDismiss prop called correctly on click
- **Pre-conditions**: PRToast with onDismiss mock
- **Steps**: 1. Click toast
- **Expected**: onDismiss function called exactly 1 time
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_133: Toast re-render with new PR data
- **Pre-conditions**: PR 1 dismissed, PR 2 appears
- **Steps**: 1. Dismiss PR 1 2. New PR 2 rendered
- **Expected**: Toast shows PR 2 data
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_134: Toast XSS trong exercise name → escaped
- **Pre-conditions**: exerciseName = "<script>alert(1)</script>"
- **Steps**: 1. Render PRToast
- **Expected**: Text escaped, không execute
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_GAM_135: Toast với Unicode characters
- **Pre-conditions**: exerciseName = "Deadlift 🏋️"
- **Steps**: 1. Render PRToast
- **Expected**: Unicode + emoji hiển thị đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GAM_136: Toast với special characters
- **Pre-conditions**: exerciseName = "Bench Press (Wide Grip)"
- **Steps**: 1. Render PRToast
- **Expected**: Special chars hiển thị đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GAM_137: Toast preventDefault on Space key
- **Pre-conditions**: Focus on toast
- **Steps**: 1. Press Space
- **Expected**: e.preventDefault() called, page không scroll
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_138: Toast preventDefault on Enter key
- **Pre-conditions**: Focus on toast
- **Steps**: 1. Press Enter
- **Expected**: e.preventDefault() called
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_139: Toast does NOT preventDefault on other keys
- **Pre-conditions**: Focus on toast
- **Steps**: 1. Press "A"
- **Expected**: Default behavior preserved
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_GAM_140: Timer reset on onDismiss prop change
- **Pre-conditions**: PRToast re-rendered with new onDismiss
- **Steps**: 1. Change onDismiss prop
- **Expected**: Previous timer cleared, new 3000ms timer set
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GAM_141: Toast dark mode (gradient unchanged)
- **Pre-conditions**: Dark mode
- **Steps**: 1. Quan sát toast
- **Expected**: Amber gradient vẫn giữ nguyên
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_142: Toast screen reader: role="alert" announced
- **Pre-conditions**: Screen reader enabled
- **Steps**: 1. PRToast appears
- **Expected**: Screen reader announces "New PR!" alert
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_143: Toast title i18n: fitness.gamification.newPR
- **Pre-conditions**: PRToast rendered
- **Steps**: 1. Quan sát title
- **Expected**: Title = t("fitness.gamification.newPR")
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_144: Toast accessible name readable
- **Pre-conditions**: Screen reader
- **Steps**: 1. Navigate to toast
- **Expected**: Full PR info readable: exercise, weight, reps
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_GAM_145: Toast with improvement = 0 → display "+0kg"
- **Pre-conditions**: improvement = 0
- **Steps**: 1. Render PRToast
- **Expected**: Text "+0kg" hoặc improvement hidden
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GAM_146: MilestonesList collapsed mặc định (isExpanded=false)
- **Pre-conditions**: Component mounted
- **Steps**: 1. Render MilestonesList
- **Expected**: Content collapsed, aria-expanded="false"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_147: Click toggle → expand (isExpanded=true)
- **Pre-conditions**: MilestonesList collapsed
- **Steps**: 1. Click toggle button
- **Expected**: Content expanded, aria-expanded="true"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_148: Click toggle lần nữa → collapse
- **Pre-conditions**: MilestonesList expanded
- **Steps**: 1. Click toggle
- **Expected**: Content collapsed, aria-expanded="false"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_149: aria-expanded="true" khi expanded
- **Pre-conditions**: isExpanded = true
- **Steps**: 1. Inspect toggle button
- **Expected**: aria-expanded="true"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_150: aria-expanded="false" khi collapsed
- **Pre-conditions**: isExpanded = false
- **Steps**: 1. Inspect toggle button
- **Expected**: aria-expanded="false"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_151: ChevronDown icon default state (not rotated)
- **Pre-conditions**: Collapsed
- **Steps**: 1. Inspect icon
- **Expected**: ChevronDown, no rotate-180
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_152: ChevronDown rotate-180 khi expanded
- **Pre-conditions**: Expanded
- **Steps**: 1. Inspect icon
- **Expected**: rotate-180 class applied
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_153: Transition animation on chevron
- **Pre-conditions**: Toggle expand
- **Steps**: 1. Click toggle
- **Expected**: transition-transform class on icon
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_GAM_154: Toggle button keyboard Enter
- **Pre-conditions**: Focus on toggle
- **Steps**: 1. Press Enter
- **Expected**: Toggle expand/collapse
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_155: Toggle button keyboard Space
- **Pre-conditions**: Focus on toggle
- **Steps**: 1. Press Space
- **Expected**: Toggle expand/collapse
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_156: Next milestone card hiển thị khi có unachieved
- **Pre-conditions**: 3 milestones: 1 achieved, 2 unachieved
- **Steps**: 1. Expand MilestonesList
- **Expected**: Next milestone card visible with first unachieved
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_157: Next milestone card ẩn khi tất cả achieved
- **Pre-conditions**: All 10 milestones achieved
- **Steps**: 1. Expand
- **Expected**: No next milestone card, progress = 100%
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_GAM_158: Next milestone emoji hiển thị đúng
- **Pre-conditions**: Next milestone emoji = "💪"
- **Steps**: 1. Quan sát next milestone card
- **Expected**: Emoji "💪" hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_159: Next milestone label i18n key
- **Pre-conditions**: Next milestone label = "tenSessions"
- **Steps**: 1. Quan sát label
- **Expected**: Text = t("fitness.gamification.tenSessions")
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_160: Progress bar role="progressbar" present
- **Pre-conditions**: Expanded, has next milestone
- **Steps**: 1. Inspect progress bar
- **Expected**: role="progressbar" attribute
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_161: Progress bar aria-valuenow đúng
- **Pre-conditions**: progress = 60
- **Steps**: 1. Inspect
- **Expected**: aria-valuenow="60"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_162: Progress bar aria-valuemin=0
- **Pre-conditions**: Có progress bar
- **Steps**: 1. Inspect
- **Expected**: aria-valuemin="0"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_163: Progress bar aria-valuemax=100
- **Pre-conditions**: Có progress bar
- **Steps**: 1. Inspect
- **Expected**: aria-valuemax="100"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_164: Progress 0%: 0 of threshold
- **Pre-conditions**: Next milestone threshold = 10, current = 0
- **Steps**: 1. Quan sát progress
- **Expected**: Width = 0%, progress text "0/10"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_165: Progress 25%: quarter way
- **Pre-conditions**: Threshold = 100, current = 25
- **Steps**: 1. Quan sát progress bar
- **Expected**: Width = 25%
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_166: Progress 50%: halfway
- **Pre-conditions**: Threshold = 10, current = 5
- **Steps**: 1. Quan sát progress bar
- **Expected**: Width = 50%
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_167: Progress 75%: three quarters
- **Pre-conditions**: Threshold = 100, current = 75
- **Steps**: 1. Quan sát progress bar
- **Expected**: Width = 75%
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_168: Progress 99%: almost there
- **Pre-conditions**: Threshold = 100, current = 99
- **Steps**: 1. Quan sát progress bar
- **Expected**: Width = 99%
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GAM_169: Progress 100%: all milestones achieved
- **Pre-conditions**: All milestones achieved
- **Steps**: 1. Quan sát progress
- **Expected**: progress = 100%, no next milestone
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_170: Progress calculation: current/threshold × 100
- **Pre-conditions**: Current = 7, threshold = 10
- **Steps**: 1. Quan sát progress
- **Expected**: Progress = 70%
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_171: Progress capped at 100% (Math.min)
- **Pre-conditions**: Current = 15, threshold = 10
- **Steps**: 1. Quan sát progress
- **Expected**: Progress = 100% (not 150%)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_GAM_172: Progress bar width matches percentage
- **Pre-conditions**: progress = 42
- **Steps**: 1. Inspect bar fill width
- **Expected**: style.width = "42%"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_173: Progress bar fill bg-emerald-500
- **Pre-conditions**: Có progress bar
- **Steps**: 1. Inspect fill
- **Expected**: bg-emerald-500 class
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_174: Progress bar background bg-zinc-200 dark:bg-zinc-700
- **Pre-conditions**: Có progress bar
- **Steps**: 1. Inspect track
- **Expected**: bg-zinc-200 hoặc dark:bg-zinc-700
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_175: Achieved milestone: bg-emerald-50
- **Pre-conditions**: Milestone achieved
- **Steps**: 1. Inspect milestone card
- **Expected**: bg-emerald-50 class
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_176: Achieved milestone dark: bg-emerald-900/20
- **Pre-conditions**: Dark mode, milestone achieved
- **Steps**: 1. Inspect
- **Expected**: dark:bg-emerald-900/20
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_177: Achieved milestone hiển thị date
- **Pre-conditions**: achievedDate = "2026-01-15"
- **Steps**: 1. Quan sát milestone card
- **Expected**: Date "2026-01-15" hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_178: Achieved milestone hiển thị CheckCircle icon
- **Pre-conditions**: Milestone achieved
- **Steps**: 1. Quan sát icon
- **Expected**: CheckCircle icon visible, aria-hidden="true"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_179: Unachieved milestone: bg-zinc-50 opacity-50
- **Pre-conditions**: Milestone not achieved
- **Steps**: 1. Inspect card
- **Expected**: bg-zinc-50 opacity-50
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_180: Unachieved milestone dark: bg-zinc-800/50
- **Pre-conditions**: Dark mode, unachieved
- **Steps**: 1. Inspect
- **Expected**: dark:bg-zinc-800/50
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_181: 10 total milestones (5 sessions + 5 streak)
- **Pre-conditions**: Expanded MilestonesList
- **Steps**: 1. Đếm milestone items
- **Expected**: 10 items total
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_182: Sessions milestones: thresholds 1, 10, 25, 50, 100
- **Pre-conditions**: Expanded
- **Steps**: 1. Quan sát session milestones
- **Expected**: 5 session milestones với thresholds đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_183: Streak milestones: thresholds 7, 14, 30, 60, 90
- **Pre-conditions**: Expanded
- **Steps**: 1. Quan sát streak milestones
- **Expected**: 5 streak milestones với thresholds đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_184: First milestone (1 session): achieved sau 1 workout
- **Pre-conditions**: workouts.length = 1
- **Steps**: 1. Check milestone status
- **Expected**: Milestone "1 session" = achieved
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_185: Milestone 10 sessions: achieved khi 10+ workouts
- **Pre-conditions**: workouts.length = 10
- **Steps**: 1. Check milestone
- **Expected**: "10 sessions" achieved
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_186: Milestone streak-7: achieved khi longestStreak ≥ 7
- **Pre-conditions**: longestStreak = 7
- **Steps**: 1. Check milestone
- **Expected**: "streak 7" achieved
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_187: Milestone ordering trong list
- **Pre-conditions**: Expanded
- **Steps**: 1. Quan sát thứ tự
- **Expected**: Milestones theo thứ tự defined (sessions first, then streak)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_188: Milestone emoji display cho mỗi type
- **Pre-conditions**: Expanded
- **Steps**: 1. Quan sát emojis
- **Expected**: Mỗi milestone có emoji riêng (💪, 🏆, etc.)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_189: Milestone label matches i18n key
- **Pre-conditions**: Milestone label = "tenSessions"
- **Steps**: 1. Quan sát text
- **Expected**: t("fitness.gamification.tenSessions")
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_190: All milestones achieved → progress 100%, no next
- **Pre-conditions**: Tất cả 10 milestones achieved
- **Steps**: 1. Expand
- **Expected**: progress = 100%, next milestone card ẩn
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_GAM_191: No milestones achieved → first as next
- **Pre-conditions**: workouts = [], streak = 0
- **Steps**: 1. Expand
- **Expected**: Next milestone = "1 session", progress = 0%
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_GAM_192: Some achieved, some not → correct next picked
- **Pre-conditions**: 3 achieved, 7 unachieved
- **Steps**: 1. Expand
- **Expected**: Next milestone = first unachieved (4th milestone)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_193: Long milestone name handling
- **Pre-conditions**: Milestone label dài
- **Steps**: 1. Quan sát text
- **Expected**: Text wrap hoặc truncate đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P3

##### TC_GAM_194: Milestone achieved date format display
- **Pre-conditions**: achievedDate = "2026-03-15"
- **Steps**: 1. Quan sát date
- **Expected**: Date hiển thị đúng format
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_195: Expanded content dark mode colors
- **Pre-conditions**: Dark mode, expanded
- **Steps**: 1. Quan sát all elements
- **Expected**: All cards, text, progress bar use dark variants
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_196: First-time user: streak=0, no PRs, 0 milestones achieved
- **Pre-conditions**: workouts = [], no history
- **Steps**: 1. Render all 3 components
- **Expected**: Streak=0, no toast, first milestone as next
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P0

##### TC_GAM_197: After first workout: streak=1, milestone-1 achieved
- **Pre-conditions**: workouts = [today]
- **Steps**: 1. Render components
- **Expected**: Streak=1, "1 session" milestone achieved
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GAM_198: After 7 consecutive days: streak=7, milestone streak-7 achieved
- **Pre-conditions**: 7 ngày liên tục
- **Steps**: 1. Render components
- **Expected**: Streak=7, "streak 7" milestone achieved
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_199: PR detected: PRToast shows while StreakCounter visible
- **Pre-conditions**: New PR set, streak ongoing
- **Steps**: 1. Quan sát UI
- **Expected**: PRToast overlay trên StreakCounter, z-50
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_200: StreakCounter + MilestonesList trên cùng screen
- **Pre-conditions**: Có workouts, milestones
- **Steps**: 1. Quan sát layout
- **Expected**: Both components visible, no overlap
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_201: Data consistency: streak và milestones dùng cùng data
- **Pre-conditions**: workouts.length = 10, streak = 5
- **Steps**: 1. So sánh data
- **Expected**: Streak from same workouts, milestones from same count
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_202: All components use same store data
- **Pre-conditions**: fitnessStore chứa workouts
- **Steps**: 1. Verify data source
- **Expected**: StreakCounter, MilestonesList dùng cùng useFitnessStore
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_203: Component refresh: all update together
- **Pre-conditions**: Add new workout to store
- **Steps**: 1. Add workout 2. Quan sát components
- **Expected**: Streak, milestones, PR detection all update
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_204: PRToast unmount cleanup: timer cleared
- **Pre-conditions**: PRToast auto-dismiss
- **Steps**: 1. Wait 3s 2. Check no lingering timers
- **Expected**: useEffect cleanup runs, no memory leak
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_205: Large workout history (500+): performance stable
- **Pre-conditions**: workouts.length = 500
- **Steps**: 1. Render all components 2. Measure time
- **Expected**: Render < 2s, calculateStreak + checkMilestones efficient
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_GAM_206: Dark mode: StreakCounter tất cả elements
- **Pre-conditions**: Dark mode
- **Steps**: 1. Quan sát StreakCounter
- **Expected**: bg-zinc-800, text-zinc-100, dot colors đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_207: Dark mode: MilestonesList tất cả elements
- **Pre-conditions**: Dark mode
- **Steps**: 1. Quan sát MilestonesList
- **Expected**: bg-zinc-800, progress bar dark, milestone cards dark
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_208: Accessibility: tất cả aria attributes verified
- **Pre-conditions**: Có components
- **Steps**: 1. Audit aria attributes
- **Expected**: aria-expanded, aria-hidden, aria-valuenow, role all correct
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GAM_209: Screen reader: streak count announced
- **Pre-conditions**: Screen reader enabled
- **Steps**: 1. Navigate to streak
- **Expected**: streak-count value readable
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GAM_210: Touch targets ≥ 44px trên interactive elements
- **Pre-conditions**: Mobile viewport
- **Steps**: 1. Measure toggle button, toast
- **Expected**: Width và height ≥ 44px (WCAG)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3
