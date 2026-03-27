# Scenario 35: Today's Plan Card

**Version:** 1.0  
**Date:** 2026-06-18  
**Total Test Cases:** 240

---

## Mô tả tổng quan

Today's Plan Card là scenario kiểm thử component TodaysPlanCard và hook useTodaysPlan — thẻ hiển thị kế hoạch tập luyện và bữa ăn trong ngày trên Dashboard. Component có 4 trạng thái riêng biệt: **training-pending** (có lịch tập chưa hoàn thành → hiển thị workout name, exercise count, CTA "Bắt đầu" → navigate WorkoutLogger), **training-completed** (đã tập xong → hiển thị duration, total sets, PR highlight text-amber-500), **rest-day** (ngày nghỉ → recovery tips với emoji, tomorrow preview, quick action chips LogWeight/LogCardio), và **no-plan** (chưa có training plan → dumbbell icon, CTA "Tạo plan →" → navigate FitnessOnboarding).

Tất cả 4 states đều hiển thị MealsSection với meals progress (mealsLogged/totalMealsPlanned), hasReachedTarget indicator (CheckCircle emerald), nextMealToLog CTA, và navigate qua pushPage. Hook useTodaysPlan pull data từ fitnessStore (trainingPlans, trainingPlanDays, workouts, workoutSets) và dayPlanStore (dayPlans), xử lý date formatting, exercise parsing từ JSON, duration estimation, tomorrow preview, và meal tracking logic.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| TodaysPlanCard | TodaysPlanCard.tsx | Thẻ kế hoạch hôm nay, 4 states, CTA buttons |
| MealsSection | TodaysPlanCard.tsx (internal) | Sub-component meals progress + next meal CTA |
| useTodaysPlan | useTodaysPlan.ts | Hook tính state, workout data, meals progress |
| useNavigationStore | navigationStore.ts | Navigation pushPage cho CTA actions |
| useFitnessStore | fitnessStore.ts | Training plans, workouts, weight entries |
| useDayPlanStore | dayPlanStore.ts | Day plans cho meal tracking |
| determineTodayPlanState | useTodaysPlan.ts | Pure function xác định state từ plan/day/workout |
| parseExercises | useTodaysPlan.ts | Parse exercises JSON string → SelectedExercise[] |
| estimateDurationMinutes | useTodaysPlan.ts | Ước tính thời gian tập từ exercises |

## Luồng nghiệp vụ

1. Dashboard mount → useTodaysPlan() gọi → lấy today's date, tìm active training plan
2. determineTodayPlanState: no activePlan → 'no-plan', no todayPlanDay → 'rest-day', có todayWorkout → 'training-completed', else → 'training-pending'
3. State = training-pending: hiển thị workout name, exercise count, estimated duration, CTA "Bắt đầu"
4. State = training-completed: hiển thị completed duration, total sets, PR highlight nếu hasPR
5. State = rest-day: hiển thị recovery tips (🚶💧), tomorrow preview, quick action chips
6. State = no-plan: hiển thị Dumbbell icon, message, CTA "Tạo plan →"
7. MealsSection: đếm meals logged (0-3), hiển thị progress, nextMealToLog CTA
8. CTA buttons navigate qua pushPage: WorkoutLogger, FitnessOnboarding, WeightLogger, CardioLogger

## Quy tắc nghiệp vụ

1. 4 states: training-pending, training-completed, rest-day, no-plan (mutually exclusive)
2. State priority: no activePlan → no-plan > no todayPlanDay → rest-day > todayWorkout exists → training-completed > training-pending
3. TOTAL_MEALS_PLANNED = 3 (breakfast, lunch, dinner)
4. mealsLogged: đếm meals có ≥1 dishId (breakfastDishIds.length > 0 = 1 meal)
5. hasReachedTarget = mealsLogged >= 3
6. nextMealToLog: kiểm tra theo thứ tự breakfast → lunch → dinner, trả về meal đầu tiên chưa log
7. nextMealToLog = undefined khi hasReachedTarget = true
8. Khi không có todayDayPlan, nextMealToLog = 'breakfast' (default)
9. exercises parsed từ JSON string, return [] on parse error
10. estimatedDuration = Σ(sets × (avgReps × 3 + restSeconds)) / 60 (rounded)
11. completedWorkout.hasPR: hiện tại luôn = false (chưa implement PR detection)
12. Tomorrow preview: tìm planDay với dayOfWeek = (today + 1) % 7

## Test Cases (240 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_TPC_01 | TodaysPlanCard render với data-testid | Positive | P0 |
| TC_TPC_02 | State training-pending: hiển thị workout section | Positive | P0 |
| TC_TPC_03 | State training-pending: workout name hiển thị | Positive | P0 |
| TC_TPC_04 | State training-pending: exercise count hiển thị | Positive | P1 |
| TC_TPC_05 | State training-pending: CTA "Bắt đầu" hiển thị | Positive | P0 |
| TC_TPC_06 | CTA "Bắt đầu" → navigate WorkoutLogger | Positive | P0 |
| TC_TPC_07 | State training-completed: hiển thị completed section | Positive | P0 |
| TC_TPC_08 | State training-completed: duration hiển thị | Positive | P1 |
| TC_TPC_09 | State training-completed: total sets hiển thị | Positive | P1 |
| TC_TPC_10 | State training-completed: PR highlight khi hasPR | Positive | P1 |
| TC_TPC_11 | State training-completed: PR text-amber-500 font-bold | Positive | P2 |
| TC_TPC_12 | State training-completed: không PR → no highlight | Positive | P1 |
| TC_TPC_13 | State rest-day: recovery tips hiển thị | Positive | P0 |
| TC_TPC_14 | State rest-day: emoji 🚶 và 💧 hiển thị | Positive | P2 |
| TC_TPC_15 | State rest-day: tomorrow preview — có workout | Positive | P1 |
| TC_TPC_16 | State rest-day: tomorrow preview — ngày nghỉ | Positive | P1 |
| TC_TPC_17 | State rest-day: quick action chips (LogWeight, LogCardio) | Positive | P1 |
| TC_TPC_18 | LogWeight chip → navigate WeightLogger | Positive | P1 |
| TC_TPC_19 | LogCardio chip → navigate CardioLogger | Positive | P1 |
| TC_TPC_20 | State no-plan: dumbbell icon hiển thị | Positive | P0 |
| TC_TPC_21 | State no-plan: message "Chưa có kế hoạch" | Positive | P1 |
| TC_TPC_22 | State no-plan: CTA "Tạo plan →" hiển thị | Positive | P0 |
| TC_TPC_23 | CTA "Tạo plan →" → navigate FitnessOnboarding | Positive | P0 |
| TC_TPC_24 | MealsSection: 0/3 meals logged | Positive | P1 |
| TC_TPC_25 | MealsSection: 1/3 meals logged | Positive | P1 |
| TC_TPC_26 | MealsSection: 2/3 meals logged | Positive | P1 |
| TC_TPC_27 | MealsSection: 3/3 meals logged → hasReachedTarget | Positive | P0 |
| TC_TPC_28 | hasReachedTarget → CheckCircle emerald icon | Positive | P1 |
| TC_TPC_29 | hasReachedTarget → không hiển thị nextMealToLog CTA | Positive | P1 |
| TC_TPC_30 | nextMealToLog = breakfast → CTA "Log Breakfast" | Positive | P1 |
| TC_TPC_31 | nextMealToLog = lunch (breakfast đã log) | Positive | P1 |
| TC_TPC_32 | nextMealToLog = dinner (breakfast + lunch đã log) | Positive | P1 |
| TC_TPC_33 | Không có dayPlan → nextMealToLog = breakfast | Edge | P1 |
| TC_TPC_34 | determineTodayPlanState: no activePlan → no-plan | Positive | P0 |
| TC_TPC_35 | determineTodayPlanState: no todayPlanDay → rest-day | Positive | P1 |
| TC_TPC_36 | determineTodayPlanState: có workout → training-completed | Positive | P1 |
| TC_TPC_37 | determineTodayPlanState: có planDay, no workout → training-pending | Positive | P1 |
| TC_TPC_38 | exercises JSON parse error → empty array | Negative | P1 |
| TC_TPC_39 | exercises undefined → empty array | Edge | P1 |
| TC_TPC_40 | exerciseCount = undefined khi exercises.length = 0 | Edge | P2 |
| TC_TPC_41 | estimatedDuration tính đúng | Positive | P2 |
| TC_TPC_42 | completedWorkout.durationMin = 0 khi null | Edge | P2 |
| TC_TPC_43 | completedWorkout.totalSets đếm đúng sets | Positive | P2 |
| TC_TPC_44 | Tomorrow preview — tomorrowWorkoutType hiển thị | Positive | P1 |
| TC_TPC_45 | Tomorrow preview — tomorrowExerciseCount hiển thị | Positive | P2 |
| TC_TPC_46 | Tomorrow = Saturday (dayOfWeek wrap: 6→0) | Edge | P2 |
| TC_TPC_47 | Card styling: rounded-2xl shadow-md border | Positive | P2 |
| TC_TPC_48 | Dark mode: bg-slate-800, border-slate-700, text-slate-100 | Positive | P2 |
| TC_TPC_49 | grid grid-cols-2 gap-4 layout cho workout + meals | Positive | P2 |
| TC_TPC_50 | Decorative icons aria-hidden="true" | Positive | P2 |
| TC_TPC_51 | training-pending: Dumbbell icon blue-500 | Positive | P2 |
| TC_TPC_52 | training-completed: CheckCircle icon emerald-500 | Positive | P2 |
| TC_TPC_53 | no-plan: Dumbbell icon slate-300 (large 48px) | Positive | P2 |
| TC_TPC_54 | Multiple rapid CTA clicks — chỉ navigate 1 lần | Edge | P1 |
| TC_TPC_55 | React.memo prevents re-render khi data không đổi | Positive | P3 |
| TC_TPC_056 | Training-pending: workout name ngắn (5 chars) hiển thị đầy đủ | Positive | P2 |
| TC_TPC_057 | Training-pending: workout name trung bình (20 chars) | Positive | P2 |
| TC_TPC_058 | Training-pending: workout name dài (50+ chars) → truncate/wrap | Edge | P1 |
| TC_TPC_059 | Training-pending: 1 exercise hiển thị | Positive | P2 |
| TC_TPC_060 | Training-pending: 3 exercises hiển thị | Positive | P2 |
| TC_TPC_061 | Training-pending: 5 exercises hiển thị | Positive | P2 |
| TC_TPC_062 | Training-pending: 10 exercises hiển thị | Positive | P2 |
| TC_TPC_063 | Training-pending: 0 exercises (edge) | Edge | P1 |
| TC_TPC_064 | Training-pending: estimated duration hiển thị | Positive | P1 |
| TC_TPC_065 | Training-pending: duration format cho 30 phút | Positive | P2 |
| TC_TPC_066 | Training-pending: duration format cho 60 phút (1h) | Positive | P2 |
| TC_TPC_067 | Training-pending: duration format cho 90 phút (1h30m) | Positive | P2 |
| TC_TPC_068 | Training-pending: CTA 'Bắt đầu' button hiển thị | Positive | P0 |
| TC_TPC_069 | Training-pending: CTA 'Bắt đầu' click → navigate WorkoutLogger | Positive | P0 |
| TC_TPC_070 | Training-pending: CTA button có icon (Play hoặc ChevronRight) | Positive | P2 |
| TC_TPC_071 | Training-pending: Dumbbell icon hiển thị cạnh workout name | Positive | P2 |
| TC_TPC_072 | Training-pending: exercise list hiển thị (nếu có) | Positive | P2 |
| TC_TPC_073 | Training-pending: CTA touch target ≥ 44px | Positive | P2 |
| TC_TPC_074 | Training-pending: CTA aria-label | Positive | P2 |
| TC_TPC_075 | Training-pending: exercises JSON parse error → empty exercises | Negative | P1 |
| TC_TPC_076 | Training-pending: exercises JSON null → empty exercises | Negative | P1 |
| TC_TPC_077 | Training-pending: duration calculation formula đúng | Positive | P2 |
| TC_TPC_078 | Training-pending: duration = 0 khi exercises rỗng | Edge | P2 |
| TC_TPC_079 | Training-pending: background color/style phù hợp | Positive | P2 |
| TC_TPC_080 | Training-pending: CTA button emerald/green color | Positive | P2 |
| TC_TPC_081 | Training-pending: multiple CTA clicks → navigate once | Edge | P1 |
| TC_TPC_082 | Training-pending: responsive on narrow screen (320px) | Positive | P2 |
| TC_TPC_083 | Training-pending: workout with sets info | Positive | P2 |
| TC_TPC_084 | Training-pending: workout with reps range | Positive | P2 |
| TC_TPC_085 | Training-pending: icon colors đúng | Positive | P2 |
| TC_TPC_086 | Training-completed: completed section hiển thị | Positive | P0 |
| TC_TPC_087 | Training-completed: duration 30 phút hiển thị | Positive | P2 |
| TC_TPC_088 | Training-completed: duration 60 phút (1h) | Positive | P2 |
| TC_TPC_089 | Training-completed: duration 90 phút (1h30m) | Positive | P2 |
| TC_TPC_090 | Training-completed: duration 120 phút (2h) | Positive | P2 |
| TC_TPC_091 | Training-completed: total sets = 1 | Positive | P2 |
| TC_TPC_092 | Training-completed: total sets = 5 | Positive | P2 |
| TC_TPC_093 | Training-completed: total sets = 20 | Positive | P2 |
| TC_TPC_094 | Training-completed: total sets = 0 (edge) | Edge | P2 |
| TC_TPC_095 | Training-completed: PR highlight khi hasPR = true | Positive | P1 |
| TC_TPC_096 | Training-completed: PR text = 'Kỷ lục mới!' (hoặc tương tự) | Positive | P1 |
| TC_TPC_097 | Training-completed: PR text color amber-500 | Positive | P2 |
| TC_TPC_098 | Training-completed: PR text font-bold | Positive | P2 |
| TC_TPC_099 | Training-completed: không PR → no highlight text | Positive | P1 |
| TC_TPC_100 | Training-completed: CheckCircle icon (success) | Positive | P2 |
| TC_TPC_101 | Training-completed: workout name vẫn hiển thị | Positive | P2 |
| TC_TPC_102 | Training-completed: congratulation message | Positive | P2 |
| TC_TPC_103 | Training-completed: không hiển thị CTA 'Bắt đầu' | Positive | P1 |
| TC_TPC_104 | Training-completed: card background khác training-pending | Positive | P2 |
| TC_TPC_105 | Training-completed: accessible success announcement | Positive | P2 |
| TC_TPC_106 | Training-completed: duration = 0 (edge, instant workout) | Edge | P2 |
| TC_TPC_107 | Training-completed: sets rất lớn = 50 | Edge | P2 |
| TC_TPC_108 | Training-completed: dark mode styling | Positive | P2 |
| TC_TPC_109 | Training-completed: PR gold text visible on dark bg | Positive | P2 |
| TC_TPC_110 | Training-completed: no re-render flicker on completion | Positive | P2 |
| TC_TPC_111 | Rest-day: recovery section hiển thị | Positive | P0 |
| TC_TPC_112 | Rest-day: recovery tip 1 hiển thị với emoji | Positive | P1 |
| TC_TPC_113 | Rest-day: recovery tip 2 hiển thị | Positive | P1 |
| TC_TPC_114 | Rest-day: recovery tip 3 hiển thị | Positive | P1 |
| TC_TPC_115 | Rest-day: recovery tips rotation theo ngày | Positive | P2 |
| TC_TPC_116 | Rest-day: tomorrow preview hiển thị | Positive | P1 |
| TC_TPC_117 | Rest-day: tomorrow preview exercise count | Positive | P2 |
| TC_TPC_118 | Rest-day: tomorrow preview khi ngày mai cũng rest | Positive | P2 |
| TC_TPC_119 | Rest-day: tomorrow = 0 exercises → 'Nghỉ ngơi' | Positive | P2 |
| TC_TPC_120 | Rest-day: tomorrowExerciseCount = 3 | Positive | P2 |
| TC_TPC_121 | Rest-day: tomorrowExerciseCount = 5 | Positive | P2 |
| TC_TPC_122 | Rest-day: tomorrowExerciseCount = 8 | Positive | P2 |
| TC_TPC_123 | Rest-day: quick action chip LogWeight | Positive | P1 |
| TC_TPC_124 | Rest-day: quick action chip LogCardio | Positive | P1 |
| TC_TPC_125 | Rest-day: tap LogWeight chip → navigate | Positive | P1 |
| TC_TPC_126 | Rest-day: tap LogCardio chip → navigate | Positive | P1 |
| TC_TPC_127 | Rest-day: không hiển thị CTA 'Bắt đầu' (workout) | Positive | P1 |
| TC_TPC_128 | Rest-day: rest icon hiển thị (Moon/Bed/Coffee) | Positive | P2 |
| TC_TPC_129 | Rest-day: card background subtle khác | Positive | P2 |
| TC_TPC_130 | Rest-day: quick action chips touch target ≥ 44px | Positive | P2 |
| TC_TPC_131 | Rest-day: tomorrow preview calculate dayOfWeek correctly | Positive | P1 |
| TC_TPC_132 | Rest-day: dark mode styling | Positive | P2 |
| TC_TPC_133 | Rest-day: emoji rendering correct | Positive | P2 |
| TC_TPC_134 | Rest-day: screen reader reads recovery tips | Positive | P2 |
| TC_TPC_135 | Rest-day: quick action chips accessible labels | Positive | P2 |
| TC_TPC_136 | No-plan: dumbbell icon hiển thị | Positive | P0 |
| TC_TPC_137 | No-plan: message 'Chưa có kế hoạch tập luyện' | Positive | P0 |
| TC_TPC_138 | No-plan: CTA 'Tạo plan →' hiển thị | Positive | P0 |
| TC_TPC_139 | No-plan: CTA click → navigate FitnessOnboarding | Positive | P0 |
| TC_TPC_140 | No-plan: dumbbell icon gray/muted color | Positive | P2 |
| TC_TPC_141 | No-plan: CTA button prominent (primary style) | Positive | P2 |
| TC_TPC_142 | No-plan: không hiển thị workout section | Positive | P1 |
| TC_TPC_143 | No-plan: không hiển thị completed section | Positive | P1 |
| TC_TPC_144 | No-plan: không hiển thị recovery tips | Positive | P1 |
| TC_TPC_145 | No-plan: CTA touch target ≥ 44px | Positive | P2 |
| TC_TPC_146 | No-plan: CTA aria-label | Positive | P2 |
| TC_TPC_147 | No-plan: motivational subtitle (nếu có) | Positive | P2 |
| TC_TPC_148 | No-plan: dark mode styling | Positive | P2 |
| TC_TPC_149 | No-plan: narrow screen responsive | Positive | P2 |
| TC_TPC_150 | No-plan: MealsSection vẫn hiển thị | Positive | P1 |
| TC_TPC_151 | No-plan: CTA double click → navigate once | Edge | P1 |
| TC_TPC_152 | No-plan: screen reader describes state | Positive | P2 |
| TC_TPC_153 | No-plan: card không collapse/empty look | Positive | P2 |
| TC_TPC_154 | No-plan: dumbbell icon aria-hidden='true' | Positive | P2 |
| TC_TPC_155 | No-plan: activePlan = undefined → no-plan state | Positive | P1 |
| TC_TPC_156 | Meals progress: 0/3 (chưa log) | Positive | P0 |
| TC_TPC_157 | Meals progress: 1/3 (breakfast logged) | Positive | P0 |
| TC_TPC_158 | Meals progress: 2/3 (breakfast + lunch) | Positive | P0 |
| TC_TPC_159 | Meals progress: 3/3 (all meals logged) | Positive | P0 |
| TC_TPC_160 | hasReachedTarget = true khi mealsLogged >= 3 | Positive | P1 |
| TC_TPC_161 | hasReachedTarget = false khi mealsLogged < 3 | Positive | P1 |
| TC_TPC_162 | nextMealToLog = 'Bữa sáng' khi chưa log gì | Positive | P0 |
| TC_TPC_163 | nextMealToLog = 'Bữa trưa' khi đã log sáng | Positive | P0 |
| TC_TPC_164 | nextMealToLog = 'Bữa tối' khi đã log sáng + trưa | Positive | P0 |
| TC_TPC_165 | nextMealToLog = null khi all meals logged | Positive | P0 |
| TC_TPC_166 | nextMealToLog CTA click → navigate Calendar tab | Positive | P1 |
| TC_TPC_167 | Meals section hiển thị trong tất cả 4 states | Positive | P0 |
| TC_TPC_168 | Meals icons: breakfast icon phù hợp | Positive | P2 |
| TC_TPC_169 | Meals icons: lunch icon phù hợp | Positive | P2 |
| TC_TPC_170 | Meals icons: dinner icon phù hợp | Positive | P2 |
| TC_TPC_171 | Meals progress bar visual | Positive | P2 |
| TC_TPC_172 | Meals progress text font tabular-nums | Positive | P2 |
| TC_TPC_173 | Meals section accessible | Positive | P2 |
| TC_TPC_174 | No dayPlan → nextMealToLog = 'breakfast' (default) | Positive | P1 |
| TC_TPC_175 | MealsSection dark mode | Positive | P2 |
| TC_TPC_176 | Meal logged indicator: filled circle/check cho logged meal | Positive | P2 |
| TC_TPC_177 | All meals logged: celebration text (nếu có) | Positive | P2 |
| TC_TPC_178 | nextMealToLog CTA touch target ≥ 44px | Positive | P2 |
| TC_TPC_179 | Meals data update after logging meal | Positive | P1 |
| TC_TPC_180 | Meals count = TOTAL_MEALS_PLANNED (3) | Positive | P2 |
| TC_TPC_181 | determineTodayPlanState: no activePlan → 'no-plan' | Positive | P0 |
| TC_TPC_182 | determineTodayPlanState: no todayPlanDay → 'rest-day' | Positive | P0 |
| TC_TPC_183 | determineTodayPlanState: todayWorkout exists → 'training-completed' | Positive | P0 |
| TC_TPC_184 | determineTodayPlanState: no todayWorkout → 'training-pending' | Positive | P0 |
| TC_TPC_185 | State transition: pending → completed during day | Positive | P0 |
| TC_TPC_186 | State transition: no-plan → pending sau tạo plan | Positive | P1 |
| TC_TPC_187 | State transition timing: update ngay sau action | Positive | P1 |
| TC_TPC_188 | 4 states mutually exclusive | Positive | P0 |
| TC_TPC_189 | State priority: no-plan > rest-day > completed > pending | Positive | P1 |
| TC_TPC_190 | State persists across component re-render | Positive | P2 |
| TC_TPC_191 | Today's date ISO format correct | Positive | P2 |
| TC_TPC_192 | Day of week calculation correct | Positive | P2 |
| TC_TPC_193 | Tomorrow dayOfWeek = (today + 1) % 7 | Positive | P1 |
| TC_TPC_194 | Active training plan detection correct | Positive | P1 |
| TC_TPC_195 | No training plans → activePlan = undefined | Positive | P1 |
| TC_TPC_196 | Dark mode: training-pending card bg | Positive | P2 |
| TC_TPC_197 | Dark mode: training-pending text readable | Positive | P2 |
| TC_TPC_198 | Dark mode: training-pending CTA visible | Positive | P2 |
| TC_TPC_199 | Dark mode: training-completed card | Positive | P2 |
| TC_TPC_200 | Dark mode: rest-day emoji visible | Positive | P2 |
| TC_TPC_201 | Dark mode: rest-day chips | Positive | P2 |
| TC_TPC_202 | Dark mode: no-plan dumbbell icon visible | Positive | P2 |
| TC_TPC_203 | Dark mode: no-plan CTA visible | Positive | P2 |
| TC_TPC_204 | Dark mode: MealsSection progress indicators | Positive | P2 |
| TC_TPC_205 | Dark mode: MealsSection text | Positive | P2 |
| TC_TPC_206 | Dark mode: card border (nếu có) | Positive | P2 |
| TC_TPC_207 | Dark mode: tomorrow preview text | Positive | P2 |
| TC_TPC_208 | Light ↔ Dark toggle: card state preserved | Positive | P2 |
| TC_TPC_209 | Dark mode: exercise detail text readable | Positive | P2 |
| TC_TPC_210 | Dark mode: PR highlight visible on dark | Positive | P2 |
| TC_TPC_211 | Long workout name: 100 chars → ellipsis | Edge | P1 |
| TC_TPC_212 | Missing workout name → fallback | Negative | P1 |
| TC_TPC_213 | Empty workout name string | Negative | P2 |
| TC_TPC_214 | Missing exercise data → [] fallback | Negative | P1 |
| TC_TPC_215 | Invalid JSON in exercisesJson | Negative | P1 |
| TC_TPC_216 | Empty tomorrow preview (no next day plan) | Positive | P2 |
| TC_TPC_217 | Very many exercises: 20 exercises | Edge | P2 |
| TC_TPC_218 | Duration estimation with high rest seconds | Positive | P2 |
| TC_TPC_219 | Duration estimation with 0 rest seconds | Edge | P2 |
| TC_TPC_220 | Duration estimation: single exercise, 1 set | Positive | P2 |
| TC_TPC_221 | mealsLogged count excludes snacks | Positive | P1 |
| TC_TPC_222 | todayDayPlan undefined → default meal state | Positive | P1 |
| TC_TPC_223 | Workout data stale after midnight → refresh | Positive | P1 |
| TC_TPC_224 | PR data: hasPR currently always false | Positive | P2 |
| TC_TPC_225 | Card min-height maintained across all states | Positive | P2 |
| TC_TPC_226 | nextMealToLog order: breakfast → lunch → dinner | Positive | P1 |
| TC_TPC_227 | Component wrapped in React.memo | Positive | P3 |
| TC_TPC_228 | Multiple stores subscription cleanup | Positive | P2 |
| TC_TPC_229 | Keyboard accessible: Tab through all CTAs | Positive | P2 |
| TC_TPC_230 | Card role and accessible name | Positive | P2 |
| TC_TPC_231 | pushPage('WorkoutLogger') gọi với correct params | Positive | P1 |
| TC_TPC_232 | pushPage('FitnessOnboarding') gọi với correct params | Positive | P1 |
| TC_TPC_233 | Navigate from rest-day LogWeight chip | Positive | P1 |
| TC_TPC_234 | Navigate from rest-day LogCardio chip | Positive | P1 |
| TC_TPC_235 | Navigate from nextMealToLog CTA | Positive | P1 |
| TC_TPC_236 | Component render time < 50ms | Positive | P2 |
| TC_TPC_237 | useTodaysPlan hook computation < 10ms | Positive | P2 |
| TC_TPC_238 | No unnecessary re-renders khi unrelated store changes | Positive | P2 |
| TC_TPC_239 | Store subscriptions efficient: chỉ subscribe fields cần thiết | Positive | P3 |
| TC_TPC_240 | Card animation on state change (nếu có) | Positive | P3 |

---

## Chi tiết Test Cases

##### TC_TPC_01: TodaysPlanCard render
- **Pre-conditions**: Dashboard tab active
- **Steps**: 1. Mở Dashboard tab
- **Expected**: data-testid="todays-plan-card" tồn tại trong DOM
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_02: Training-pending hiển thị workout section
- **Pre-conditions**: Active training plan có, hôm nay là ngày tập, chưa log workout
- **Steps**: 1. Observe TodaysPlanCard
- **Expected**: data-testid="workout-section" hiển thị với workout info
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_03: Training-pending workout name
- **Pre-conditions**: todayPlanDay.workoutType = "Push Day"
- **Steps**: 1. Observe data-testid="workout-name"
- **Expected**: Hiển thị "Push Day"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_04: Training-pending exercise count
- **Pre-conditions**: exercises parsed = 5 items
- **Steps**: 1. Observe data-testid="exercise-count"
- **Expected**: Hiển thị "5 bài tập" (translation dashboard.todaysPlan.exercisesCount)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_05: CTA "Bắt đầu" hiển thị
- **Pre-conditions**: State = training-pending
- **Steps**: 1. Observe data-testid="start-workout-cta"
- **Expected**: Button "Bắt đầu" hiển thị với Play icon, bg-blue-600 text-white
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_06: CTA "Bắt đầu" navigate WorkoutLogger
- **Pre-conditions**: State = training-pending
- **Steps**: 1. Click data-testid="start-workout-cta"
- **Expected**: pushPage gọi với { id: 'workout-logger', component: 'WorkoutLogger' }
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_07: Training-completed hiển thị
- **Pre-conditions**: Active plan có, hôm nay đã tập (workout exists for today)
- **Steps**: 1. Observe TodaysPlanCard
- **Expected**: data-testid="workout-summary" hiển thị thay vì workout-section
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_08: Training-completed duration
- **Pre-conditions**: completedWorkout.durationMin = 45
- **Steps**: 1. Observe data-testid="workout-duration"
- **Expected**: Hiển thị "45 phút" (translation dashboard.todaysPlan.duration)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_09: Training-completed total sets
- **Pre-conditions**: completedWorkout.totalSets = 18
- **Steps**: 1. Observe data-testid="workout-sets"
- **Expected**: Hiển thị "18 sets" (translation dashboard.todaysPlan.setsCount)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_10: PR highlight khi hasPR = true
- **Pre-conditions**: completedWorkout.hasPR = true
- **Steps**: 1. Observe data-testid="pr-highlight"
- **Expected**: PR text hiển thị (dashboard.todaysPlan.prHighlight)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_11: PR text styling
- **Pre-conditions**: hasPR = true
- **Steps**: 1. Inspect PR element classes
- **Expected**: "text-sm font-bold text-amber-500" — gold text highlighting PR achievement
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_12: No PR → no highlight
- **Pre-conditions**: completedWorkout.hasPR = false
- **Steps**: 1. Tìm data-testid="pr-highlight"
- **Expected**: Element không tồn tại trong DOM (conditional rendering)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_13: Rest-day recovery tips
- **Pre-conditions**: State = rest-day (activePlan có, todayPlanDay không có)
- **Steps**: 1. Observe data-testid="recovery-tips"
- **Expected**: Hiển thị 2 recovery tips (recoveryTip1, recoveryTip2)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_14: Rest-day emoji display
- **Pre-conditions**: State = rest-day
- **Steps**: 1. Observe recovery tips content
- **Expected**: 🚶 trước tip 1, 💧 trước tip 2, spans có aria-hidden="true"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_15: Tomorrow preview — có workout
- **Pre-conditions**: State = rest-day, tomorrow có planDay
- **Steps**: 1. Observe data-testid="tomorrow-preview"
- **Expected**: Hiển thị tomorrowWorkoutType và tomorrowExerciseCount
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_16: Tomorrow preview — ngày nghỉ
- **Pre-conditions**: State = rest-day, tomorrow cũng là rest day (no planDay)
- **Steps**: 1. Observe tomorrow preview
- **Expected**: Hiển thị "Ngày nghỉ" (dashboard.todaysPlan.tomorrowRest)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_17: Quick action chips rest-day
- **Pre-conditions**: State = rest-day
- **Steps**: 1. Observe data-testid="quick-actions"
- **Expected**: 2 chips: data-testid="log-weight-chip" và "log-cardio-chip"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_18: LogWeight chip navigate
- **Pre-conditions**: State = rest-day
- **Steps**: 1. Click data-testid="log-weight-chip"
- **Expected**: pushPage gọi với { id: 'weight-logger', component: 'WeightLogger' }
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_19: LogCardio chip navigate
- **Pre-conditions**: State = rest-day
- **Steps**: 1. Click data-testid="log-cardio-chip"
- **Expected**: pushPage gọi với { id: 'cardio-logger', component: 'CardioLogger' }
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_20: No-plan dumbbell icon
- **Pre-conditions**: State = no-plan (no active training plan)
- **Steps**: 1. Observe data-testid="no-plan-section"
- **Expected**: Dumbbell icon 48×48px, text-slate-300 (light mode)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_21: No-plan message
- **Pre-conditions**: State = no-plan
- **Steps**: 1. Observe no-plan section text
- **Expected**: Text chứa "Chưa có kế hoạch" (dashboard.todaysPlan.noPlan)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_22: CTA "Tạo plan →"
- **Pre-conditions**: State = no-plan
- **Steps**: 1. Observe data-testid="create-plan-cta"
- **Expected**: Button với text "Tạo plan" + ChevronRight icon, bg-blue-600
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_23: CTA "Tạo plan →" navigate FitnessOnboarding
- **Pre-conditions**: State = no-plan
- **Steps**: 1. Click data-testid="create-plan-cta"
- **Expected**: pushPage gọi với { id: 'fitness-onboarding', component: 'FitnessOnboarding' }
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_24: MealsSection 0/3
- **Pre-conditions**: Không có dayPlan hoặc tất cả meals trống
- **Steps**: 1. Observe data-testid="meals-progress"
- **Expected**: Hiển thị "0/3" trong meals progress text
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_25: MealsSection 1/3
- **Pre-conditions**: Chỉ breakfast có dishes
- **Steps**: 1. Observe meals progress
- **Expected**: Hiển thị "1/3", nextMealToLog = lunch
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_26: MealsSection 2/3
- **Pre-conditions**: Breakfast + lunch có dishes, dinner trống
- **Steps**: 1. Observe meals progress
- **Expected**: Hiển thị "2/3", nextMealToLog = dinner
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_27: MealsSection 3/3 hasReachedTarget
- **Pre-conditions**: Tất cả 3 meals có dishes
- **Steps**: 1. Observe meals progress
- **Expected**: "3/3" + CheckCircle emerald + "Đã đạt mục tiêu" text
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_28: hasReachedTarget CheckCircle icon
- **Pre-conditions**: mealsLogged >= 3
- **Steps**: 1. Inspect meals section
- **Expected**: CheckCircle icon emerald-600, inline text "Đã đạt"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_29: hasReachedTarget ẩn nextMealToLog CTA
- **Pre-conditions**: mealsLogged = 3
- **Steps**: 1. Tìm data-testid="log-meal-cta"
- **Expected**: CTA button không tồn tại (nextMealKey && !hasReachedTarget = false)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_30: nextMealToLog = breakfast
- **Pre-conditions**: Tất cả meals trống, hoặc không có dayPlan
- **Steps**: 1. Observe log-meal-cta
- **Expected**: CTA text = "Log Breakfast" (dashboard.todaysPlan.logBreakfast)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_31: nextMealToLog = lunch
- **Pre-conditions**: breakfast đã log, lunch trống
- **Steps**: 1. Observe log-meal-cta
- **Expected**: CTA text = "Log Lunch" (dashboard.todaysPlan.logLunch)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_32: nextMealToLog = dinner
- **Pre-conditions**: breakfast + lunch đã log, dinner trống
- **Steps**: 1. Observe log-meal-cta
- **Expected**: CTA text = "Log Dinner" (dashboard.todaysPlan.logDinner)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_33: Không có dayPlan → nextMealToLog = breakfast
- **Pre-conditions**: Không có dayPlan cho hôm nay
- **Steps**: 1. Observe nextMealToLog trong useTodaysPlan output
- **Expected**: nextMealToLog = 'breakfast' (default khi todayDayPlan undefined)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_TPC_34: determineTodayPlanState: no activePlan
- **Pre-conditions**: trainingPlans trống hoặc không có status='active'
- **Steps**: 1. Check useTodaysPlan().state
- **Expected**: state = 'no-plan'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_35: determineTodayPlanState: no todayPlanDay
- **Pre-conditions**: activePlan có, nhưng hôm nay không có planDay (ngày nghỉ)
- **Steps**: 1. Check state
- **Expected**: state = 'rest-day'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_36: determineTodayPlanState: có workout
- **Pre-conditions**: activePlan có, todayPlanDay có, todayWorkout có
- **Steps**: 1. Check state
- **Expected**: state = 'training-completed'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_37: determineTodayPlanState: pending
- **Pre-conditions**: activePlan có, todayPlanDay có, todayWorkout không có
- **Steps**: 1. Check state
- **Expected**: state = 'training-pending'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_38: exercises JSON parse error
- **Pre-conditions**: todayPlanDay.exercises = "invalid json{{"
- **Steps**: 1. Check exercises parsed
- **Expected**: parseExercises trả về [] (empty array), component không crash, exerciseCount = undefined
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_TPC_39: exercises undefined
- **Pre-conditions**: todayPlanDay.exercises = undefined
- **Steps**: 1. Check parseExercises result
- **Expected**: Trả về [] (early return), exerciseCount = undefined
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_TPC_40: exerciseCount undefined khi 0 exercises
- **Pre-conditions**: exercises parsed = []
- **Steps**: 1. Check useTodaysPlan().exerciseCount
- **Expected**: exerciseCount = undefined (exercises.length > 0 ? ... : undefined)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_TPC_41: estimatedDuration calculation
- **Pre-conditions**: 2 exercises: ex1(sets:3, repsMin:8, repsMax:12, restSeconds:60), ex2(sets:4, repsMin:10, repsMax:10, restSeconds:90)
- **Steps**: 1. Calculate expected: ex1 = 3 × (10×3 + 60) = 270s, ex2 = 4 × (10×3 + 90) = 480s, total = 750s / 60 = 13 min
- **Expected**: estimatedDuration = 13 (Math.round(750/60))
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_42: completedWorkout.durationMin fallback
- **Pre-conditions**: todayWorkout.durationMin = null
- **Steps**: 1. Check completedWorkout.durationMin
- **Expected**: durationMin = 0 (todayWorkout.durationMin ?? 0)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_TPC_43: completedWorkout.totalSets count
- **Pre-conditions**: todayWorkout có 12 workoutSets
- **Steps**: 1. Check completedWorkout.totalSets
- **Expected**: totalSets = 12
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_44: Tomorrow workout type
- **Pre-conditions**: Tomorrow planDay có workoutType = "Pull Day"
- **Steps**: 1. Observe tomorrow preview (rest-day state)
- **Expected**: Hiển thị "Pull Day" và exercise count
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_45: Tomorrow exercise count
- **Pre-conditions**: Tomorrow planDay exercises parsed = 4 items
- **Steps**: 1. Observe tomorrowExerciseCount
- **Expected**: Hiển thị "4" exercises trong tomorrow preview
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_46: Tomorrow dayOfWeek wrap Saturday→Sunday
- **Pre-conditions**: Today = Saturday (dayOfWeek = 6), tomorrow = Sunday (0)
- **Steps**: 1. Check tomorrowDayOfWeek = (6 + 1) % 7 = 0
- **Expected**: tomorrowPlanDay tìm đúng planDay.dayOfWeek = 0
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_TPC_47: Card styling
- **Pre-conditions**: TodaysPlanCard render
- **Steps**: 1. Inspect card classes
- **Expected**: "bg-white rounded-2xl shadow-md border border-slate-100 p-4"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_48: Dark mode styling
- **Pre-conditions**: Dark mode enabled
- **Steps**: 1. Inspect card classes
- **Expected**: dark:bg-slate-800, dark:border-slate-700, dark:text-slate-100
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_49: Grid layout workout + meals
- **Pre-conditions**: State = training-pending hoặc training-completed
- **Steps**: 1. Inspect layout container
- **Expected**: "grid grid-cols-2 gap-4" — 2 columns side by side
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_50: Decorative icons aria-hidden
- **Pre-conditions**: TodaysPlanCard render bất kỳ state
- **Steps**: 1. Inspect tất cả decorative icons (Play, CheckCircle, Dumbbell, UtensilsCrossed, ChevronRight)
- **Expected**: Tất cả decorative icons có aria-hidden="true"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_51: Training-pending Dumbbell icon blue
- **Pre-conditions**: State = training-pending
- **Steps**: 1. Inspect Dumbbell icon trong workout section
- **Expected**: "w-4 h-4 text-blue-500"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_52: Training-completed CheckCircle emerald
- **Pre-conditions**: State = training-completed
- **Steps**: 1. Inspect CheckCircle icon
- **Expected**: "w-4 h-4 text-emerald-500"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_53: No-plan Dumbbell large slate
- **Pre-conditions**: State = no-plan
- **Steps**: 1. Inspect Dumbbell icon
- **Expected**: "w-12 h-12 text-slate-300" (large, muted)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_54: Rapid CTA clicks
- **Pre-conditions**: State = training-pending
- **Steps**: 1. Click "Bắt đầu" 5 lần liên tục nhanh
- **Expected**: pushPage gọi đúng cách (React handles event batching), không navigate trùng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_TPC_55: React.memo optimization
- **Pre-conditions**: TodaysPlanCard đã render, parent re-render
- **Steps**: 1. Trigger parent re-render với same data
- **Expected**: TodaysPlanCard không re-render (React.memo)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_TPC_056: Training-pending: workout name ngắn (5 chars) hiển thị đầy đủ
- **Pre-conditions**: State = training-pending, workoutName = 'Push'
- **Steps**: 1. Observe workout-name
- **Expected**: Hiển thị 'Push' đầy đủ, không truncate
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_057: Training-pending: workout name trung bình (20 chars)
- **Pre-conditions**: workoutName = 'Upper Body Push Day'
- **Steps**: 1. Observe workout-name
- **Expected**: Hiển thị 'Upper Body Push Day' đầy đủ
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_058: Training-pending: workout name dài (50+ chars) → truncate/wrap
- **Pre-conditions**: workoutName = 'Full Body Compound Exercises With Progressive Overload'
- **Steps**: 1. Observe workout-name
- **Expected**: Text truncate (ellipsis) hoặc wrap đúng cách, layout không vỡ
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_TPC_059: Training-pending: 1 exercise hiển thị
- **Pre-conditions**: exercises.length = 1
- **Steps**: 1. Observe exercise count
- **Expected**: Hiển thị '1 bài tập' hoặc tương tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_060: Training-pending: 3 exercises hiển thị
- **Pre-conditions**: exercises.length = 3
- **Steps**: 1. Observe exercise count
- **Expected**: Hiển thị '3 bài tập'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_061: Training-pending: 5 exercises hiển thị
- **Pre-conditions**: exercises.length = 5
- **Steps**: 1. Observe exercise count
- **Expected**: Hiển thị '5 bài tập'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_062: Training-pending: 10 exercises hiển thị
- **Pre-conditions**: exercises.length = 10
- **Steps**: 1. Observe exercise count
- **Expected**: Hiển thị '10 bài tập', layout intact
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_063: Training-pending: 0 exercises (edge)
- **Pre-conditions**: exercises = [] (empty JSON)
- **Steps**: 1. Observe exercise count
- **Expected**: Hiển thị '0 bài tập' hoặc ẩn count, không crash
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_TPC_064: Training-pending: estimated duration hiển thị
- **Pre-conditions**: exercises.length = 5
- **Steps**: 1. Observe duration display
- **Expected**: Estimated duration hiển thị (ví dụ: '~45 phút')
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_065: Training-pending: duration format cho 30 phút
- **Pre-conditions**: estimatedDuration = 30
- **Steps**: 1. Observe duration
- **Expected**: Hiển thị '~30 phút' hoặc '30m'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_066: Training-pending: duration format cho 60 phút (1h)
- **Pre-conditions**: estimatedDuration = 60
- **Steps**: 1. Observe duration
- **Expected**: Hiển thị '~1 giờ' hoặc '60 phút'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_067: Training-pending: duration format cho 90 phút (1h30m)
- **Pre-conditions**: estimatedDuration = 90
- **Steps**: 1. Observe duration
- **Expected**: Hiển thị '~1 giờ 30 phút' hoặc '90 phút'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_068: Training-pending: CTA 'Bắt đầu' button hiển thị
- **Pre-conditions**: State = training-pending
- **Steps**: 1. Observe CTA button
- **Expected**: Button text = 'Bắt đầu', visible, clickable
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_069: Training-pending: CTA 'Bắt đầu' click → navigate WorkoutLogger
- **Pre-conditions**: State = training-pending
- **Steps**: 1. Click 'Bắt đầu'
- **Expected**: pushPage('WorkoutLogger') gọi với đúng params
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_070: Training-pending: CTA button có icon (Play hoặc ChevronRight)
- **Pre-conditions**: State = training-pending
- **Steps**: 1. Inspect CTA icon
- **Expected**: CTA button có icon hợp lệ
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_071: Training-pending: Dumbbell icon hiển thị cạnh workout name
- **Pre-conditions**: State = training-pending
- **Steps**: 1. Inspect workout icon
- **Expected**: Dumbbell icon visible, aria-hidden='true'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_072: Training-pending: exercise list hiển thị (nếu có)
- **Pre-conditions**: State = training-pending, 3 exercises
- **Steps**: 1. Inspect exercise details
- **Expected**: Exercise names hoặc summary visible
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_073: Training-pending: CTA touch target ≥ 44px
- **Pre-conditions**: State = training-pending
- **Steps**: 1. Inspect CTA button size
- **Expected**: min-height ≥ 44px
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_074: Training-pending: CTA aria-label
- **Pre-conditions**: State = training-pending
- **Steps**: 1. Inspect CTA aria-label
- **Expected**: aria-label = 'Bắt đầu tập' hoặc tương tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_075: Training-pending: exercises JSON parse error → empty exercises
- **Pre-conditions**: exercisesJson = 'invalid JSON'
- **Steps**: 1. Observe component
- **Expected**: exercises = [], '0 bài tập', không crash (try/catch)
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_TPC_076: Training-pending: exercises JSON null → empty exercises
- **Pre-conditions**: exercisesJson = null
- **Steps**: 1. Observe component
- **Expected**: exercises = [], không crash
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_TPC_077: Training-pending: duration calculation formula đúng
- **Pre-conditions**: 3 exercises, mỗi exercise 3 sets × 10 reps × 3s + 60s rest
- **Steps**: 1. Kiểm tra estimated duration
- **Expected**: Duration = Math.round(3 × (3 × (10 × 3 + 60)) / 60) phút
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_078: Training-pending: duration = 0 khi exercises rỗng
- **Pre-conditions**: exercises = []
- **Steps**: 1. Observe duration
- **Expected**: Duration = 0 hoặc ẩn, không hiển thị '~0 phút'
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_TPC_079: Training-pending: background color/style phù hợp
- **Pre-conditions**: State = training-pending
- **Steps**: 1. Inspect card background
- **Expected**: Card background = white (light) hoặc slate-800 (dark)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_080: Training-pending: CTA button emerald/green color
- **Pre-conditions**: State = training-pending
- **Steps**: 1. Inspect CTA button color
- **Expected**: CTA bg-emerald-500 hoặc tương tự (action color)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_081: Training-pending: multiple CTA clicks → navigate once
- **Pre-conditions**: State = training-pending
- **Steps**: 1. Click 'Bắt đầu' 3 lần nhanh
- **Expected**: pushPage gọi 1 lần (debounce hoặc React batching)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_TPC_082: Training-pending: responsive on narrow screen (320px)
- **Pre-conditions**: Screen width 320px, state = training-pending
- **Steps**: 1. Inspect layout
- **Expected**: Card content readable, CTA accessible, no overflow
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_083: Training-pending: workout with sets info
- **Pre-conditions**: exercise has sets = 4
- **Steps**: 1. Observe exercise detail
- **Expected**: Sets info hiển thị (ví dụ: '4 sets')
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_084: Training-pending: workout with reps range
- **Pre-conditions**: exercise repsMin = 8, repsMax = 12
- **Steps**: 1. Observe exercise detail
- **Expected**: Reps range hiển thị (ví dụ: '8-12 reps')
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_085: Training-pending: icon colors đúng
- **Pre-conditions**: State = training-pending
- **Steps**: 1. Inspect icon colors
- **Expected**: Icons sử dụng emerald hoặc theme-appropriate color
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_086: Training-completed: completed section hiển thị
- **Pre-conditions**: State = training-completed
- **Steps**: 1. Observe completed section
- **Expected**: data-testid='completed-section' hoặc tương tự hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_087: Training-completed: duration 30 phút hiển thị
- **Pre-conditions**: completedDuration = 30
- **Steps**: 1. Observe duration
- **Expected**: Hiển thị '30 phút' hoặc '30m'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_088: Training-completed: duration 60 phút (1h)
- **Pre-conditions**: completedDuration = 60
- **Steps**: 1. Observe duration
- **Expected**: Hiển thị '1 giờ' hoặc '60 phút'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_089: Training-completed: duration 90 phút (1h30m)
- **Pre-conditions**: completedDuration = 90
- **Steps**: 1. Observe duration
- **Expected**: Hiển thị '1 giờ 30 phút' hoặc '1h 30m'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_090: Training-completed: duration 120 phút (2h)
- **Pre-conditions**: completedDuration = 120
- **Steps**: 1. Observe duration
- **Expected**: Hiển thị '2 giờ' hoặc '120 phút'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_091: Training-completed: total sets = 1
- **Pre-conditions**: totalSets = 1
- **Steps**: 1. Observe sets display
- **Expected**: Hiển thị '1 set'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_092: Training-completed: total sets = 5
- **Pre-conditions**: totalSets = 5
- **Steps**: 1. Observe sets display
- **Expected**: Hiển thị '5 sets'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_093: Training-completed: total sets = 20
- **Pre-conditions**: totalSets = 20
- **Steps**: 1. Observe sets display
- **Expected**: Hiển thị '20 sets', layout intact
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_094: Training-completed: total sets = 0 (edge)
- **Pre-conditions**: totalSets = 0 (no sets logged)
- **Steps**: 1. Observe sets display
- **Expected**: Hiển thị '0 sets' hoặc ẩn sets info
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_TPC_095: Training-completed: PR highlight khi hasPR = true
- **Pre-conditions**: hasPR = true
- **Steps**: 1. Observe PR section
- **Expected**: PR text hiển thị với text-amber-500 font-bold
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_096: Training-completed: PR text = 'Kỷ lục mới!' (hoặc tương tự)
- **Pre-conditions**: hasPR = true
- **Steps**: 1. Inspect PR text
- **Expected**: Text chứa 'Kỷ lục mới' hoặc 'PR' indication
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_097: Training-completed: PR text color amber-500
- **Pre-conditions**: hasPR = true
- **Steps**: 1. Inspect PR text color
- **Expected**: text-amber-500 class
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_098: Training-completed: PR text font-bold
- **Pre-conditions**: hasPR = true
- **Steps**: 1. Inspect PR text font
- **Expected**: font-bold class
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_099: Training-completed: không PR → no highlight text
- **Pre-conditions**: hasPR = false
- **Steps**: 1. Observe PR area
- **Expected**: Không có PR text/highlight section
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_100: Training-completed: CheckCircle icon (success)
- **Pre-conditions**: State = training-completed
- **Steps**: 1. Inspect success icon
- **Expected**: CheckCircle icon emerald hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_101: Training-completed: workout name vẫn hiển thị
- **Pre-conditions**: State = training-completed
- **Steps**: 1. Observe workout name
- **Expected**: Workout name hiển thị (ví dụ: 'Push Day hoàn thành')
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_102: Training-completed: congratulation message
- **Pre-conditions**: State = training-completed
- **Steps**: 1. Observe message
- **Expected**: Message khen ngợi (ví dụ: 'Tốt lắm!' hoặc tương tự)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_103: Training-completed: không hiển thị CTA 'Bắt đầu'
- **Pre-conditions**: State = training-completed
- **Steps**: 1. Search for 'Bắt đầu' button
- **Expected**: CTA 'Bắt đầu' không hiển thị (đã hoàn thành)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_104: Training-completed: card background khác training-pending
- **Pre-conditions**: State = training-completed
- **Steps**: 1. Compare background với pending state
- **Expected**: Background subtle khác (ví dụ: emerald tint hoặc success indicator)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_105: Training-completed: accessible success announcement
- **Pre-conditions**: Screen reader ON
- **Steps**: 1. Navigate to card
- **Expected**: Screen reader announces completion status
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_106: Training-completed: duration = 0 (edge, instant workout)
- **Pre-conditions**: completedDuration = 0
- **Steps**: 1. Observe duration
- **Expected**: Hiển thị '0 phút' hoặc '<1 phút'
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_TPC_107: Training-completed: sets rất lớn = 50
- **Pre-conditions**: totalSets = 50
- **Steps**: 1. Observe sets display
- **Expected**: Hiển thị '50 sets', layout intact
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_TPC_108: Training-completed: dark mode styling
- **Pre-conditions**: Dark mode ON, state = training-completed
- **Steps**: 1. Inspect card
- **Expected**: Dark theme applied, text readable, PR gold visible on dark
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_109: Training-completed: PR gold text visible on dark bg
- **Pre-conditions**: Dark mode ON, hasPR = true
- **Steps**: 1. Inspect PR text contrast
- **Expected**: text-amber-500 contrast ≥ 4.5:1 on dark bg
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_110: Training-completed: no re-render flicker on completion
- **Pre-conditions**: State transitions pending → completed
- **Steps**: 1. Observe visual transition
- **Expected**: Smooth transition, no flicker/flash
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_111: Rest-day: recovery section hiển thị
- **Pre-conditions**: State = rest-day
- **Steps**: 1. Observe rest-day section
- **Expected**: Recovery tips section hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_112: Rest-day: recovery tip 1 hiển thị với emoji
- **Pre-conditions**: State = rest-day
- **Steps**: 1. Observe first recovery tip
- **Expected**: Tip có emoji (🚶 hoặc 💧 etc.) và text
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_113: Rest-day: recovery tip 2 hiển thị
- **Pre-conditions**: State = rest-day
- **Steps**: 1. Observe second recovery tip
- **Expected**: Tip 2 visible với emoji
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_114: Rest-day: recovery tip 3 hiển thị
- **Pre-conditions**: State = rest-day
- **Steps**: 1. Observe third recovery tip
- **Expected**: Tip 3 visible với emoji
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_115: Rest-day: recovery tips rotation theo ngày
- **Pre-conditions**: State = rest-day, different days
- **Steps**: 1. Check tips on day 1 2. Check tips on day 2
- **Expected**: Tips thay đổi hoặc rotate theo ngày
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_116: Rest-day: tomorrow preview hiển thị
- **Pre-conditions**: State = rest-day, tomorrow has workout
- **Steps**: 1. Observe tomorrow preview
- **Expected**: Hiển thị 'Ngày mai: [workout name]' hoặc tương tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_117: Rest-day: tomorrow preview exercise count
- **Pre-conditions**: State = rest-day, tomorrow 5 exercises
- **Steps**: 1. Observe tomorrow exercise count
- **Expected**: Hiển thị '5 bài tập' cho ngày mai
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_118: Rest-day: tomorrow preview khi ngày mai cũng rest
- **Pre-conditions**: State = rest-day, tomorrow cũng rest-day
- **Steps**: 1. Observe tomorrow preview
- **Expected**: Hiển thị 'Ngày mai: Nghỉ ngơi' hoặc tương tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_119: Rest-day: tomorrow = 0 exercises → 'Nghỉ ngơi'
- **Pre-conditions**: tomorrowExerciseCount = 0
- **Steps**: 1. Observe tomorrow preview
- **Expected**: Hiển thị 'Ngày mai nghỉ' hoặc no workout preview
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_120: Rest-day: tomorrowExerciseCount = 3
- **Pre-conditions**: tomorrowExerciseCount = 3
- **Steps**: 1. Observe count
- **Expected**: Hiển thị '3 bài tập ngày mai'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_121: Rest-day: tomorrowExerciseCount = 5
- **Pre-conditions**: tomorrowExerciseCount = 5
- **Steps**: 1. Observe count
- **Expected**: Hiển thị '5 bài tập ngày mai'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_122: Rest-day: tomorrowExerciseCount = 8
- **Pre-conditions**: tomorrowExerciseCount = 8
- **Steps**: 1. Observe count
- **Expected**: Hiển thị '8 bài tập ngày mai'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_123: Rest-day: quick action chip LogWeight
- **Pre-conditions**: State = rest-day
- **Steps**: 1. Observe quick action chips
- **Expected**: Chip 'Log cân' hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_124: Rest-day: quick action chip LogCardio
- **Pre-conditions**: State = rest-day
- **Steps**: 1. Observe quick action chips
- **Expected**: Chip 'Cardio' hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_125: Rest-day: tap LogWeight chip → navigate
- **Pre-conditions**: State = rest-day
- **Steps**: 1. Tap LogWeight chip
- **Expected**: Navigate đến weight logging
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_126: Rest-day: tap LogCardio chip → navigate
- **Pre-conditions**: State = rest-day
- **Steps**: 1. Tap LogCardio chip
- **Expected**: Navigate đến cardio logging
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_127: Rest-day: không hiển thị CTA 'Bắt đầu' (workout)
- **Pre-conditions**: State = rest-day
- **Steps**: 1. Search for 'Bắt đầu' button
- **Expected**: CTA 'Bắt đầu' không hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_128: Rest-day: rest icon hiển thị (Moon/Bed/Coffee)
- **Pre-conditions**: State = rest-day
- **Steps**: 1. Inspect rest icon
- **Expected**: Rest icon hiển thị, aria-hidden='true'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_129: Rest-day: card background subtle khác
- **Pre-conditions**: State = rest-day
- **Steps**: 1. Inspect card background
- **Expected**: Background calm/muted (không active green)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_130: Rest-day: quick action chips touch target ≥ 44px
- **Pre-conditions**: State = rest-day
- **Steps**: 1. Inspect chip sizes
- **Expected**: Chips min-height ≥ 44px
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_131: Rest-day: tomorrow preview calculate dayOfWeek correctly
- **Pre-conditions**: Hôm nay = Thứ 7 (dayOfWeek = 6)
- **Steps**: 1. Check tomorrow = Chủ nhật (dayOfWeek = 0)
- **Expected**: Tomorrow preview lấy đúng planDay cho (today + 1) % 7
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_132: Rest-day: dark mode styling
- **Pre-conditions**: Dark mode ON, state = rest-day
- **Steps**: 1. Inspect card
- **Expected**: Dark theme, recovery tips readable, chips dark variant
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_133: Rest-day: emoji rendering correct
- **Pre-conditions**: State = rest-day
- **Steps**: 1. Inspect emoji display
- **Expected**: Emoji 🚶💧 hiển thị đúng, không bị replace bởi ☐
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_134: Rest-day: screen reader reads recovery tips
- **Pre-conditions**: Screen reader ON, state = rest-day
- **Steps**: 1. Navigate card
- **Expected**: Screen reader announces recovery tips text
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_135: Rest-day: quick action chips accessible labels
- **Pre-conditions**: State = rest-day
- **Steps**: 1. Inspect chips aria-labels
- **Expected**: Mỗi chip có aria-label mô tả action
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_136: No-plan: dumbbell icon hiển thị
- **Pre-conditions**: State = no-plan
- **Steps**: 1. Observe card icon
- **Expected**: Dumbbell icon hiển thị lớn/prominent
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_137: No-plan: message 'Chưa có kế hoạch tập luyện'
- **Pre-conditions**: State = no-plan
- **Steps**: 1. Observe message text
- **Expected**: Text = 'Chưa có kế hoạch tập luyện' hoặc tương tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_138: No-plan: CTA 'Tạo plan →' hiển thị
- **Pre-conditions**: State = no-plan
- **Steps**: 1. Observe CTA button
- **Expected**: CTA text = 'Tạo plan →' hoặc 'Tạo kế hoạch'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_139: No-plan: CTA click → navigate FitnessOnboarding
- **Pre-conditions**: State = no-plan
- **Steps**: 1. Click 'Tạo plan →'
- **Expected**: pushPage('FitnessOnboarding') gọi
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_140: No-plan: dumbbell icon gray/muted color
- **Pre-conditions**: State = no-plan
- **Steps**: 1. Inspect icon color
- **Expected**: Icon color = gray/slate (not active emerald)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_141: No-plan: CTA button prominent (primary style)
- **Pre-conditions**: State = no-plan
- **Steps**: 1. Inspect CTA styling
- **Expected**: CTA có emerald bg hoặc primary button styling
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_142: No-plan: không hiển thị workout section
- **Pre-conditions**: State = no-plan
- **Steps**: 1. Search for workout-section
- **Expected**: workout-section không tồn tại
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_143: No-plan: không hiển thị completed section
- **Pre-conditions**: State = no-plan
- **Steps**: 1. Search for completed-section
- **Expected**: completed-section không tồn tại
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_144: No-plan: không hiển thị recovery tips
- **Pre-conditions**: State = no-plan
- **Steps**: 1. Search for recovery tips
- **Expected**: Recovery tips không hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_145: No-plan: CTA touch target ≥ 44px
- **Pre-conditions**: State = no-plan
- **Steps**: 1. Inspect CTA size
- **Expected**: min-height ≥ 44px
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_146: No-plan: CTA aria-label
- **Pre-conditions**: State = no-plan
- **Steps**: 1. Inspect aria-label
- **Expected**: aria-label = 'Tạo kế hoạch tập luyện' hoặc tương tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_147: No-plan: motivational subtitle (nếu có)
- **Pre-conditions**: State = no-plan
- **Steps**: 1. Observe subtitle
- **Expected**: Subtitle encouraging user to create plan
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_148: No-plan: dark mode styling
- **Pre-conditions**: Dark mode ON, state = no-plan
- **Steps**: 1. Inspect card
- **Expected**: Dark theme, dumbbell icon visible, CTA readable
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_149: No-plan: narrow screen responsive
- **Pre-conditions**: 320px width, state = no-plan
- **Steps**: 1. Inspect layout
- **Expected**: Card content readable, CTA accessible
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_150: No-plan: MealsSection vẫn hiển thị
- **Pre-conditions**: State = no-plan
- **Steps**: 1. Observe MealsSection
- **Expected**: Meals progress vẫn visible (independent of training plan)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_151: No-plan: CTA double click → navigate once
- **Pre-conditions**: State = no-plan
- **Steps**: 1. Double click CTA
- **Expected**: pushPage gọi 1 lần
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_TPC_152: No-plan: screen reader describes state
- **Pre-conditions**: Screen reader ON
- **Steps**: 1. Navigate to card
- **Expected**: Screen reader announces 'Chưa có kế hoạch' hoặc tương tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_153: No-plan: card không collapse/empty look
- **Pre-conditions**: State = no-plan
- **Steps**: 1. Inspect card visual
- **Expected**: Card có min-height, không look empty/broken
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_154: No-plan: dumbbell icon aria-hidden='true'
- **Pre-conditions**: State = no-plan
- **Steps**: 1. Inspect icon
- **Expected**: aria-hidden='true' (decorative)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_155: No-plan: activePlan = undefined → no-plan state
- **Pre-conditions**: fitnessStore.trainingPlans = []
- **Steps**: 1. Observe card state
- **Expected**: State = no-plan, CTA 'Tạo plan' hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_156: Meals progress: 0/3 (chưa log)
- **Pre-conditions**: mealsLogged = 0, totalMealsPlanned = 3
- **Steps**: 1. Observe meals progress
- **Expected**: Hiển thị '0/3' hoặc 0 filled indicators
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_157: Meals progress: 1/3 (breakfast logged)
- **Pre-conditions**: mealsLogged = 1
- **Steps**: 1. Observe meals progress
- **Expected**: Hiển thị '1/3' hoặc 1 filled indicator
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_158: Meals progress: 2/3 (breakfast + lunch)
- **Pre-conditions**: mealsLogged = 2
- **Steps**: 1. Observe meals progress
- **Expected**: Hiển thị '2/3' hoặc 2 filled indicators
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_159: Meals progress: 3/3 (all meals logged)
- **Pre-conditions**: mealsLogged = 3
- **Steps**: 1. Observe meals progress
- **Expected**: Hiển thị '3/3' hoặc all filled + CheckCircle emerald
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_160: hasReachedTarget = true khi mealsLogged >= 3
- **Pre-conditions**: mealsLogged = 3
- **Steps**: 1. Observe target indicator
- **Expected**: CheckCircle icon emerald hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_161: hasReachedTarget = false khi mealsLogged < 3
- **Pre-conditions**: mealsLogged = 2
- **Steps**: 1. Observe target indicator
- **Expected**: Không có CheckCircle, progress ongoing
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_162: nextMealToLog = 'Bữa sáng' khi chưa log gì
- **Pre-conditions**: breakfastDishIds = [], lunchDishIds = [], dinnerDishIds = []
- **Steps**: 1. Observe next meal CTA
- **Expected**: CTA = 'Log bữa sáng' hoặc tương tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_163: nextMealToLog = 'Bữa trưa' khi đã log sáng
- **Pre-conditions**: breakfastDishIds.length > 0, lunchDishIds = []
- **Steps**: 1. Observe next meal CTA
- **Expected**: CTA = 'Log bữa trưa'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_164: nextMealToLog = 'Bữa tối' khi đã log sáng + trưa
- **Pre-conditions**: breakfast + lunch logged, dinnerDishIds = []
- **Steps**: 1. Observe next meal CTA
- **Expected**: CTA = 'Log bữa tối'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_165: nextMealToLog = null khi all meals logged
- **Pre-conditions**: 3/3 meals logged
- **Steps**: 1. Observe next meal CTA
- **Expected**: Không có next meal CTA (tất cả đã log)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_166: nextMealToLog CTA click → navigate Calendar tab
- **Pre-conditions**: nextMealToLog = 'Bữa trưa'
- **Steps**: 1. Click next meal CTA
- **Expected**: Navigate đến Calendar tab (meal logging)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_167: Meals section hiển thị trong tất cả 4 states
- **Pre-conditions**: Mỗi state
- **Steps**: 1. Kiểm tra training-pending 2. training-completed 3. rest-day 4. no-plan
- **Expected**: MealsSection visible trong cả 4 states
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_168: Meals icons: breakfast icon phù hợp
- **Pre-conditions**: Component render
- **Steps**: 1. Inspect breakfast icon
- **Expected**: Sunrise/Coffee icon hoặc phù hợp cho breakfast
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_169: Meals icons: lunch icon phù hợp
- **Pre-conditions**: Component render
- **Steps**: 1. Inspect lunch icon
- **Expected**: Sun/Utensils icon phù hợp cho lunch
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_170: Meals icons: dinner icon phù hợp
- **Pre-conditions**: Component render
- **Steps**: 1. Inspect dinner icon
- **Expected**: Moon/Utensils icon phù hợp cho dinner
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_171: Meals progress bar visual
- **Pre-conditions**: mealsLogged = 2, total = 3
- **Steps**: 1. Inspect progress bar
- **Expected**: Bar width = 66.7% (2/3)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_172: Meals progress text font tabular-nums
- **Pre-conditions**: Component render
- **Steps**: 1. Inspect font variant
- **Expected**: Meals count dùng tabular-nums
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_173: Meals section accessible
- **Pre-conditions**: Screen reader ON
- **Steps**: 1. Navigate to meals section
- **Expected**: Screen reader announces '2 trên 3 bữa ăn đã log' hoặc tương tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_174: No dayPlan → nextMealToLog = 'breakfast' (default)
- **Pre-conditions**: todayDayPlan = undefined
- **Steps**: 1. Observe next meal CTA
- **Expected**: Default to 'Bữa sáng' (breakfast)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_175: MealsSection dark mode
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect MealsSection
- **Expected**: Dark theme, progress readable, icons visible
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_176: Meal logged indicator: filled circle/check cho logged meal
- **Pre-conditions**: breakfast logged
- **Steps**: 1. Inspect breakfast indicator
- **Expected**: Filled/checked indicator cho breakfast, empty cho lunch/dinner
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_177: All meals logged: celebration text (nếu có)
- **Pre-conditions**: mealsLogged = 3
- **Steps**: 1. Observe text
- **Expected**: Congrats text hoặc 'Hoàn thành!' hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_178: nextMealToLog CTA touch target ≥ 44px
- **Pre-conditions**: nextMealToLog exists
- **Steps**: 1. Inspect CTA size
- **Expected**: min-height ≥ 44px
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_179: Meals data update after logging meal
- **Pre-conditions**: Log breakfast → mealsLogged 0→1
- **Steps**: 1. Log breakfast 2. Return to dashboard
- **Expected**: Meals progress updates to 1/3
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_180: Meals count = TOTAL_MEALS_PLANNED (3)
- **Pre-conditions**: Component render
- **Steps**: 1. Verify constant
- **Expected**: Total = 3 (breakfast, lunch, dinner)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_181: determineTodayPlanState: no activePlan → 'no-plan'
- **Pre-conditions**: activePlan = undefined
- **Steps**: 1. Call determineTodayPlanState
- **Expected**: Return 'no-plan'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_182: determineTodayPlanState: no todayPlanDay → 'rest-day'
- **Pre-conditions**: activePlan exists, todayPlanDay = undefined
- **Steps**: 1. Call determineTodayPlanState
- **Expected**: Return 'rest-day'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_183: determineTodayPlanState: todayWorkout exists → 'training-completed'
- **Pre-conditions**: activePlan + todayPlanDay + todayWorkout exist
- **Steps**: 1. Call determineTodayPlanState
- **Expected**: Return 'training-completed'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_184: determineTodayPlanState: no todayWorkout → 'training-pending'
- **Pre-conditions**: activePlan + todayPlanDay exist, todayWorkout = undefined
- **Steps**: 1. Call determineTodayPlanState
- **Expected**: Return 'training-pending'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_185: State transition: pending → completed during day
- **Pre-conditions**: User hoàn thành workout
- **Steps**: 1. State = pending 2. Log workout 3. Observe state
- **Expected**: State chuyển sang 'training-completed' tự động
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_186: State transition: no-plan → pending sau tạo plan
- **Pre-conditions**: User tạo training plan
- **Steps**: 1. State = no-plan 2. Create plan 3. Return to dashboard
- **Expected**: State chuyển sang 'training-pending' hoặc 'rest-day'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_187: State transition timing: update ngay sau action
- **Pre-conditions**: User complete workout
- **Steps**: 1. Complete workout 2. Navigate back
- **Expected**: State update reflected immediately (không cần refresh)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_188: 4 states mutually exclusive
- **Pre-conditions**: Component render
- **Steps**: 1. Inspect rendered sections
- **Expected**: Chỉ 1 state section active tại bất kỳ thời điểm nào
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_TPC_189: State priority: no-plan > rest-day > completed > pending
- **Pre-conditions**: Complex state
- **Steps**: 1. Verify priority logic
- **Expected**: State determination follows defined priority order
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_190: State persists across component re-render
- **Pre-conditions**: State = training-pending, parent re-render
- **Steps**: 1. Trigger parent re-render
- **Expected**: State vẫn = training-pending (derived from stores)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_191: Today's date ISO format correct
- **Pre-conditions**: Any state
- **Steps**: 1. Inspect today date computation
- **Expected**: Date = YYYY-MM-DD format, timezone-aware
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_192: Day of week calculation correct
- **Pre-conditions**: Hôm nay = Wednesday
- **Steps**: 1. Inspect dayOfWeek
- **Expected**: dayOfWeek = 3 (JavaScript: 0=Sunday)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_193: Tomorrow dayOfWeek = (today + 1) % 7
- **Pre-conditions**: Hôm nay = Saturday (6)
- **Steps**: 1. Inspect tomorrow dayOfWeek
- **Expected**: Tomorrow = Sunday (0) = (6 + 1) % 7
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_194: Active training plan detection correct
- **Pre-conditions**: Multiple plans, 1 active
- **Steps**: 1. Inspect which plan selected
- **Expected**: Only active plan used for state determination
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_195: No training plans → activePlan = undefined
- **Pre-conditions**: fitnessStore.trainingPlans = []
- **Steps**: 1. Inspect activePlan
- **Expected**: activePlan = undefined → state = no-plan
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_196: Dark mode: training-pending card bg
- **Pre-conditions**: Dark mode ON, state = training-pending
- **Steps**: 1. Inspect card bg
- **Expected**: dark:bg-slate-800 hoặc dark variant
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_197: Dark mode: training-pending text readable
- **Pre-conditions**: Dark mode ON, state = training-pending
- **Steps**: 1. Check text contrast
- **Expected**: All text ≥ 4.5:1 contrast on dark bg
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_198: Dark mode: training-pending CTA visible
- **Pre-conditions**: Dark mode ON, state = training-pending
- **Steps**: 1. Inspect CTA
- **Expected**: CTA button visible, readable on dark
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_199: Dark mode: training-completed card
- **Pre-conditions**: Dark mode ON, state = training-completed
- **Steps**: 1. Inspect card
- **Expected**: Success indication visible on dark
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_200: Dark mode: rest-day emoji visible
- **Pre-conditions**: Dark mode ON, state = rest-day
- **Steps**: 1. Inspect emoji rendering
- **Expected**: Emoji visible on dark background
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_201: Dark mode: rest-day chips
- **Pre-conditions**: Dark mode ON, state = rest-day
- **Steps**: 1. Inspect quick action chips
- **Expected**: Chips dark variant, text readable
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_202: Dark mode: no-plan dumbbell icon visible
- **Pre-conditions**: Dark mode ON, state = no-plan
- **Steps**: 1. Inspect icon
- **Expected**: Icon visible on dark background
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_203: Dark mode: no-plan CTA visible
- **Pre-conditions**: Dark mode ON, state = no-plan
- **Steps**: 1. Inspect CTA
- **Expected**: CTA readable, clickable on dark
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_204: Dark mode: MealsSection progress indicators
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect meal indicators
- **Expected**: Progress dots/bars visible on dark
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_205: Dark mode: MealsSection text
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect meal text
- **Expected**: Text readable (dark:text-slate-100)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_206: Dark mode: card border (nếu có)
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect card border
- **Expected**: dark:border-slate-700 hoặc tương tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_207: Dark mode: tomorrow preview text
- **Pre-conditions**: Dark mode ON, rest-day, tomorrow has workout
- **Steps**: 1. Inspect tomorrow text
- **Expected**: Text readable on dark
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_208: Light ↔ Dark toggle: card state preserved
- **Pre-conditions**: Toggle dark mode
- **Steps**: 1. Note state 2. Toggle 3. Observe
- **Expected**: State unchanged, only visual theme changes
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_209: Dark mode: exercise detail text readable
- **Pre-conditions**: Dark mode ON, training-pending
- **Steps**: 1. Inspect exercise text
- **Expected**: Exercise names, sets, reps all readable
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_210: Dark mode: PR highlight visible on dark
- **Pre-conditions**: Dark mode ON, hasPR = true
- **Steps**: 1. Inspect PR text
- **Expected**: Gold/amber text visible and readable on dark bg
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_211: Long workout name: 100 chars → ellipsis
- **Pre-conditions**: workoutName = 100 chars string
- **Steps**: 1. Observe workout name
- **Expected**: Name truncated with ellipsis, layout intact
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_TPC_212: Missing workout name → fallback
- **Pre-conditions**: workoutName = undefined/null
- **Steps**: 1. Observe workout name area
- **Expected**: Fallback text hoặc empty, không crash
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_TPC_213: Empty workout name string
- **Pre-conditions**: workoutName = ''
- **Steps**: 1. Observe workout name
- **Expected**: Empty hoặc placeholder text, không crash
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_TPC_214: Missing exercise data → [] fallback
- **Pre-conditions**: todayPlanDay.exercisesJson = undefined
- **Steps**: 1. Observe exercises
- **Expected**: exercises = [], '0 bài tập', không crash
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_TPC_215: Invalid JSON in exercisesJson
- **Pre-conditions**: exercisesJson = '{invalid'
- **Steps**: 1. Observe exercises
- **Expected**: exercises = [] (try/catch), không crash
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_TPC_216: Empty tomorrow preview (no next day plan)
- **Pre-conditions**: No planDay for tomorrow
- **Steps**: 1. Observe tomorrow preview
- **Expected**: Tomorrow preview ẩn hoặc 'Chưa có kế hoạch ngày mai'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_217: Very many exercises: 20 exercises
- **Pre-conditions**: exercises.length = 20
- **Steps**: 1. Observe card
- **Expected**: Card layout handles 20 exercises gracefully
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_TPC_218: Duration estimation with high rest seconds
- **Pre-conditions**: exercises with restSeconds = 300 (5 min)
- **Steps**: 1. Observe duration
- **Expected**: Duration calculated correctly with high rest
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_219: Duration estimation with 0 rest seconds
- **Pre-conditions**: exercises with restSeconds = 0
- **Steps**: 1. Observe duration
- **Expected**: Duration calculated with 0 rest, shorter than expected
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_TPC_220: Duration estimation: single exercise, 1 set
- **Pre-conditions**: 1 exercise: 1 set × 10 reps × 3s + 60s rest
- **Steps**: 1. Check duration
- **Expected**: Duration = Math.round((1 × (10 × 3 + 60)) / 60) = 2 phút
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_221: mealsLogged count excludes snacks
- **Pre-conditions**: 3 meals + 2 snacks logged
- **Steps**: 1. Observe mealsLogged
- **Expected**: mealsLogged = 3 (only breakfast/lunch/dinner count)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_222: todayDayPlan undefined → default meal state
- **Pre-conditions**: No dayPlan for today
- **Steps**: 1. Observe meals
- **Expected**: mealsLogged = 0, nextMealToLog = 'breakfast'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_223: Workout data stale after midnight → refresh
- **Pre-conditions**: Midnight crosses, new day
- **Steps**: 1. After midnight, observe card
- **Expected**: State refreshes for new day (new today date)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_224: PR data: hasPR currently always false
- **Pre-conditions**: Any completed workout
- **Steps**: 1. Inspect hasPR
- **Expected**: hasPR = false (documented limitation, not yet implemented)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_225: Card min-height maintained across all states
- **Pre-conditions**: All 4 states
- **Steps**: 1. Inspect card min-height in each state
- **Expected**: Card min-height consistent, no layout jump between states
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_226: nextMealToLog order: breakfast → lunch → dinner
- **Pre-conditions**: Only lunch logged (breakfast not logged)
- **Steps**: 1. Observe nextMealToLog
- **Expected**: nextMealToLog = 'breakfast' (first unlogged in order)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_227: Component wrapped in React.memo
- **Pre-conditions**: Source code review
- **Steps**: 1. Check component definition
- **Expected**: TodaysPlanCard wrapped in React.memo
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_TPC_228: Multiple stores subscription cleanup
- **Pre-conditions**: Component unmount
- **Steps**: 1. Mount then unmount component 2. Check subscriptions
- **Expected**: All store subscriptions cleaned up (no memory leak)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_229: Keyboard accessible: Tab through all CTAs
- **Pre-conditions**: Keyboard navigation
- **Steps**: 1. Tab through card
- **Expected**: All CTA buttons focusable, press Enter activates
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_230: Card role and accessible name
- **Pre-conditions**: Component render
- **Steps**: 1. Inspect card ARIA
- **Expected**: Card has role='region' or article with accessible name
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_231: pushPage('WorkoutLogger') gọi với correct params
- **Pre-conditions**: State = training-pending, click CTA
- **Steps**: 1. Spy on pushPage 2. Click CTA
- **Expected**: pushPage('WorkoutLogger') called with correct params
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_232: pushPage('FitnessOnboarding') gọi với correct params
- **Pre-conditions**: State = no-plan, click CTA
- **Steps**: 1. Spy on pushPage 2. Click CTA
- **Expected**: pushPage('FitnessOnboarding') called
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_233: Navigate from rest-day LogWeight chip
- **Pre-conditions**: State = rest-day
- **Steps**: 1. Tap LogWeight chip
- **Expected**: Navigate đến weight logging screen
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_234: Navigate from rest-day LogCardio chip
- **Pre-conditions**: State = rest-day
- **Steps**: 1. Tap LogCardio chip
- **Expected**: Navigate đến cardio logging screen
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_235: Navigate from nextMealToLog CTA
- **Pre-conditions**: nextMealToLog = 'lunch'
- **Steps**: 1. Tap next meal CTA
- **Expected**: Navigate đến Calendar tab, lunch section
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_TPC_236: Component render time < 50ms
- **Pre-conditions**: Dashboard mount
- **Steps**: 1. Profile TodaysPlanCard render
- **Expected**: Render < 50ms (React Profiler)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_237: useTodaysPlan hook computation < 10ms
- **Pre-conditions**: Dashboard mount
- **Steps**: 1. Profile hook computation
- **Expected**: Hook returns trong < 10ms
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_238: No unnecessary re-renders khi unrelated store changes
- **Pre-conditions**: Change unrelated store data
- **Steps**: 1. Monitor render count
- **Expected**: TodaysPlanCard không re-render khi unrelated data changes
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_TPC_239: Store subscriptions efficient: chỉ subscribe fields cần thiết
- **Pre-conditions**: Source review
- **Steps**: 1. Check store selectors
- **Expected**: Selectors chỉ lấy fields cần thiết (not entire store)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_TPC_240: Card animation on state change (nếu có)
- **Pre-conditions**: State pending → completed
- **Steps**: 1. Observe visual transition
- **Expected**: Smooth transition hoặc instant (depends on implementation)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

---

## Đề xuất Cải tiến

### Đề xuất 1: State Transition Animation
- **Vấn đề hiện tại**: Khi state thay đổi (ví dụ: training-pending → training-completed), card jump-cut không animation.
- **Giải pháp đề xuất**: Cross-fade animation 200ms giữa các states, congratulation pulse khi complete workout.
- **Lý do chi tiết**: Smooth transitions tạo cảm giác polished. Congratulation effect tăng motivation (gamification).
- **Phần trăm cải thiện**: User satisfaction +25%, Perceived quality +30%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 2: PR Detection Implementation
- **Vấn đề hiện tại**: hasPR luôn = false, chưa implement actual PR detection logic.
- **Giải pháp đề xuất**: So sánh workoutSets với historical best per exercise, detect new max weight/reps.
- **Lý do chi tiết**: PR highlight là motivational feature quan trọng cho fitness users. Gold text already styled.
- **Phần trăm cải thiện**: Engagement +35%, Motivation +40%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 3: Swipeable State Cards
- **Vấn đề hiện tại**: Tất cả info gom vào 1 card, có thể overwhelm trên mobile.
- **Giải pháp đề xuất**: Swipeable cards: swipe left = workout details, swipe right = meals details.
- **Lý do chi tiết**: Progressive disclosure giảm cognitive load. Pattern quen thuộc (Tinder-style cards).
- **Phần trăm cải thiện**: Mobile usability +20%, Information processing +25%
- **Mức độ ưu tiên**: Low | **Effort**: L
