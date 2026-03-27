# Scenario 36: Quick Actions & Weight Log

**Version:** 1.0  
**Date:** 2026-06-18  
**Total Test Cases:** 260

---

## Mô tả tổng quan

Quick Actions & Weight Log là scenario kiểm thử QuickActionsBar và WeightQuickLog — hai components tương tác chính ở cuối Dashboard. QuickActionsBar hiển thị 3 action buttons context-aware (left/center/right) dựa trên trạng thái user (meals logged, workout completed, rest day, weight logged, training plan), với primary button (emerald, shadow-glow, 56px height) và secondary buttons (white border, 48px height). Mỗi button có icon + label, navigate qua handleAction.

WeightQuickLog là bottom sheet cho phép ghi cân nặng nhanh: stepper ±0.1kg (STEP=0.1, range 30-300kg), long-press acceleration (500ms delay → 150ms interval → 50ms fast sau 8 ticks), recent value chips (5 unique weights, loại today), yesterday info, 7-day moving average, trend indicator (↑↓→), save action (create/update entry), undo toast (5 giây), close button 44px touch target, ModalBackdrop dismiss. Component tích hợp với fitnessStore (weightEntries, addWeightEntry, updateWeightEntry, removeWeightEntry) và NotificationContext.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| QuickActionsBar | QuickActionsBar.tsx | Thanh 3 action buttons context-aware |
| ActionButton | QuickActionsBar.tsx (internal) | Button component (primary/secondary variant) |
| WeightQuickLog | WeightQuickLog.tsx | Bottom sheet ghi cân nặng |
| ModalBackdrop | ModalBackdrop.tsx | Backdrop overlay + dismiss logic |
| useQuickActions | useQuickActions.ts | Hook xác định 3 actions + handleAction |
| determineQuickActions | useQuickActions.ts | Pure function mapping state → 3 actions |
| useLongPress | WeightQuickLog.tsx (internal) | Long-press hook với acceleration |
| useFitnessStore | fitnessStore.ts | Weight entries CRUD |
| useNotification | NotificationContext.ts | Toast notifications (success + undo) |
| useModalBackHandler | useModalBackHandler.ts | Hardware back button handler |
| calculateMovingAverage | useFeedbackLoop.ts | 7-day moving average weight |

## Luồng nghiệp vụ

1. Dashboard Tier 5 render → QuickActionsBar mount → useQuickActions() xác định 3 actions
2. Action mapping: dựa trên mealsLoggedToday, hasBreakfast/Lunch/Dinner, workoutCompleted, isRestDay, weightLoggedToday, hasTrainingPlan
3. Left button: luôn "log-weight" (Scale icon)
4. Center button: context-dependent — "view-results" (workout done) > "start-workout" (training plan, not done) > "log-meal" > specific meal
5. Right button: context-dependent — "log-snack" > "start-workout" > "view-results" > "log-cardio"
6. Tap action → handleAction dispatches to 'fitness' tab hoặc 'calendar' tab
7. WeightQuickLog mở → initial weight = todayEntry ?? yesterdayEntry ?? latestEntry ?? 0
8. Stepper ±0.1kg → inputValue cập nhật (clamped 30-300)
9. Long press: 500ms delay → 150ms interval → sau 8 ticks → 50ms fast interval
10. Chip select → inputValue = selected weight
11. Save: create hoặc update entry → close → success toast với undo action (5s)
12. Undo: revert to previous weight hoặc remove entry

## Quy tắc nghiệp vụ

1. QuickActionsBar luôn hiển thị 3 buttons (left, center, right)
2. Primary button: isPrimary = true → emerald bg, shadow-glow, 56px height, 24px icon
3. Secondary button: isPrimary = false → white bg + border, 48px height, 20px icon
4. ACTION_ICON_MAP: log-weight→Scale, log-breakfast/lunch/dinner/meal/snack→Plus, start-workout→Dumbbell, log-cardio→Activity, view-results→TrendingUp
5. WeightQuickLog STEP = 0.1, MIN_WEIGHT = 30, MAX_WEIGHT = 300
6. RECENT_CHIP_COUNT = 5 unique weights (excluding today)
7. UNDO_DURATION = 5000ms
8. LONG_PRESS_DELAY = 500ms, LONG_PRESS_INTERVAL_INITIAL = 150ms, LONG_PRESS_INTERVAL_FAST = 50ms
9. ACCELERATION_THRESHOLD = 8 ticks → switch to fast interval
10. Decrement disabled khi inputValue ≤ MIN_WEIGHT, increment disabled khi ≥ MAX_WEIGHT
11. Close button: h-11 w-11 (44px touch target)
12. Save disabled khi inputValue < 30 hoặc > 300
13. Trend: ↑ red-500 (weight up), ↓ emerald-500 (weight down), → slate-400 (stable)
14. Moving average: cần ≥3 entries trong 7 ngày, else null
15. Save: todayEntry exists → update, else → create new entry

## Test Cases (260 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_QAW_01 | QuickActionsBar render với data-testid | Positive | P0 |
| TC_QAW_02 | 3 action buttons hiển thị | Positive | P0 |
| TC_QAW_03 | Left button = log-weight (luôn luôn) | Positive | P0 |
| TC_QAW_04 | Center = view-results khi workout completed | Positive | P1 |
| TC_QAW_05 | Center = start-workout khi training plan, chưa tập | Positive | P1 |
| TC_QAW_06 | Center = log-meal khi all meals unlogged | Positive | P1 |
| TC_QAW_07 | Center = log-breakfast/lunch/dinner based on next meal | Positive | P1 |
| TC_QAW_08 | Right action context mapping | Positive | P1 |
| TC_QAW_09 | Primary button: emerald bg, shadow-glow, 56px height | Positive | P1 |
| TC_QAW_10 | Secondary button: white bg, border, 48px height | Positive | P1 |
| TC_QAW_11 | Icon mapping: log-weight → Scale icon | Positive | P1 |
| TC_QAW_12 | Icon mapping: start-workout → Dumbbell icon | Positive | P1 |
| TC_QAW_13 | Icon mapping: log-meal → Plus icon | Positive | P2 |
| TC_QAW_14 | Icon mapping: view-results → TrendingUp icon | Positive | P2 |
| TC_QAW_15 | Icon mapping: log-cardio → Activity icon | Positive | P2 |
| TC_QAW_16 | Tap action dispatches đúng tab | Positive | P0 |
| TC_QAW_17 | QuickActionsBar nav aria-label | Positive | P2 |
| TC_QAW_18 | Action button aria-label | Positive | P2 |
| TC_QAW_19 | Icons aria-hidden="true" | Positive | P2 |
| TC_QAW_20 | WeightQuickLog render khi mở | Positive | P0 |
| TC_QAW_21 | WeightQuickLog role="dialog" | Positive | P1 |
| TC_QAW_22 | Initial weight = today's entry | Positive | P0 |
| TC_QAW_23 | Initial weight = yesterday khi no today | Positive | P1 |
| TC_QAW_24 | Initial weight = latest entry khi no today/yesterday | Positive | P1 |
| TC_QAW_25 | Initial weight = 0 khi no entries | Edge | P1 |
| TC_QAW_26 | Weight display "—" khi inputValue = 0 | Positive | P1 |
| TC_QAW_27 | Increment +0.1kg | Positive | P0 |
| TC_QAW_28 | Decrement −0.1kg | Positive | P0 |
| TC_QAW_29 | Increment disabled khi ≥ 300kg | Boundary | P1 |
| TC_QAW_30 | Decrement disabled khi ≤ 30kg | Boundary | P1 |
| TC_QAW_31 | Increment at 299.9 → 300.0 → disabled | Boundary | P1 |
| TC_QAW_32 | Decrement at 30.1 → 30.0 → disabled | Boundary | P1 |
| TC_QAW_33 | Long press increment: 500ms delay → continuous increment | Positive | P1 |
| TC_QAW_34 | Long press acceleration: sau 8 ticks → 50ms interval | Positive | P2 |
| TC_QAW_35 | Long press stop on pointer up | Positive | P1 |
| TC_QAW_36 | Long press stop on pointer leave | Positive | P1 |
| TC_QAW_37 | Recent chips hiển thị (max 5 unique) | Positive | P1 |
| TC_QAW_38 | Recent chips exclude today's weight | Positive | P1 |
| TC_QAW_39 | Chip select updates inputValue | Positive | P1 |
| TC_QAW_40 | Active chip highlight (emerald border/bg) | Positive | P2 |
| TC_QAW_41 | Yesterday chip label "(Hôm qua)" | Positive | P2 |
| TC_QAW_42 | No recent entries → no chips section | Edge | P2 |
| TC_QAW_43 | Save creates new entry (no today entry) | Positive | P0 |
| TC_QAW_44 | Save updates existing entry (today entry exists) | Positive | P0 |
| TC_QAW_45 | Save → close → success toast | Positive | P0 |
| TC_QAW_46 | Undo toast: 5 second duration | Positive | P1 |
| TC_QAW_47 | Undo new entry → removeWeightEntry | Positive | P1 |
| TC_QAW_48 | Undo update → revert to previous weight | Positive | P1 |
| TC_QAW_49 | Close button 44px touch target (h-11 w-11) | Positive | P1 |
| TC_QAW_50 | Close button click → onClose | Positive | P0 |
| TC_QAW_51 | Backdrop click → onClose | Positive | P1 |
| TC_QAW_52 | Save disabled khi invalid range | Negative | P1 |
| TC_QAW_53 | Yesterday info, moving average, trend display | Positive | P1 |
| TC_QAW_54 | Trend indicator: ↑ red, ↓ emerald, → slate | Positive | P2 |
| TC_QAW_55 | Weight display tabular-nums | Positive | P2 |
| TC_QAW_056 | Context: 0 meals logged → center = 'log-breakfast' (primary) | Positive | P0 |
| TC_QAW_057 | Context: 0 meals → left = 'log-weight' (always) | Positive | P0 |
| TC_QAW_058 | Context: 0 meals → right = 'start-workout' hoặc 'log-cardio' | Positive | P1 |
| TC_QAW_059 | Context: 0 meals, no training plan → right = 'log-cardio' | Positive | P1 |
| TC_QAW_060 | Context: 1 meal (breakfast) → center = 'log-lunch' (primary) | Positive | P0 |
| TC_QAW_061 | Context: 1 meal logged → left vẫn = 'log-weight' | Positive | P1 |
| TC_QAW_062 | Context: 2 meals (breakfast + lunch) → center = 'log-dinner' | Positive | P0 |
| TC_QAW_063 | Context: 2 meals → right = 'start-workout' (if plan) | Positive | P1 |
| TC_QAW_064 | Context: all meals logged → center = 'start-workout' (if plan, not done) | Positive | P0 |
| TC_QAW_065 | Context: all meals + no training plan → center = 'log-meal' | Positive | P1 |
| TC_QAW_066 | Context: all meals logged → right = 'log-snack' | Positive | P1 |
| TC_QAW_067 | Context: all meals + workout done → center = 'view-results' | Positive | P0 |
| TC_QAW_068 | Context: all meals + workout done → right = 'log-snack' | Positive | P1 |
| TC_QAW_069 | Context: rest day → center = 'log-meal' (primary) | Positive | P1 |
| TC_QAW_070 | Context: rest day → right = 'log-cardio' | Positive | P1 |
| TC_QAW_071 | Context: workout completed, meals remaining → center = 'log-meal' | Positive | P1 |
| TC_QAW_072 | Context: workout completed → right = 'view-results' | Positive | P1 |
| TC_QAW_073 | Left button luôn là 'log-weight' bất kể context | Positive | P0 |
| TC_QAW_074 | Center button luôn isPrimary = true | Positive | P0 |
| TC_QAW_075 | Left và right buttons luôn isPrimary = false | Positive | P0 |
| TC_QAW_076 | Primary button: bg-emerald-500 | Positive | P1 |
| TC_QAW_077 | Primary button: text-white | Positive | P2 |
| TC_QAW_078 | Primary button: height = 56px | Positive | P1 |
| TC_QAW_079 | Primary button: icon size = 24px | Positive | P2 |
| TC_QAW_080 | Primary button: shadow-glow effect | Positive | P1 |
| TC_QAW_081 | Primary button: rounded-full | Positive | P2 |
| TC_QAW_082 | Primary button: min-w-[100px] | Positive | P2 |
| TC_QAW_083 | Secondary button: bg-white + border | Positive | P1 |
| TC_QAW_084 | Secondary button: text-emerald-600 | Positive | P2 |
| TC_QAW_085 | Secondary button: height = 48px | Positive | P1 |
| TC_QAW_086 | Secondary button: icon size = 20px | Positive | P2 |
| TC_QAW_087 | Secondary button: no shadow-glow | Positive | P2 |
| TC_QAW_088 | Secondary button: rounded-full | Positive | P2 |
| TC_QAW_089 | Label text font: text-[10px] font-medium | Positive | P2 |
| TC_QAW_090 | Label text leading-tight | Positive | P2 |
| TC_QAW_091 | Icon aria-hidden='true' trên tất cả buttons | Positive | P2 |
| TC_QAW_092 | Button type='button' (not submit) | Positive | P2 |
| TC_QAW_093 | QuickActionsBar là nav element | Positive | P1 |
| TC_QAW_094 | QuickActionsBar aria-label | Positive | P1 |
| TC_QAW_095 | 3 buttons centered: justify-center | Positive | P2 |
| TC_QAW_096 | Tap log-weight → navigate 'fitness' tab | Positive | P0 |
| TC_QAW_097 | Tap log-breakfast → navigate 'calendar' tab | Positive | P0 |
| TC_QAW_098 | Tap log-lunch → navigate 'calendar' tab | Positive | P0 |
| TC_QAW_099 | Tap log-dinner → navigate 'calendar' tab | Positive | P0 |
| TC_QAW_100 | Tap log-meal → navigate 'calendar' tab | Positive | P1 |
| TC_QAW_101 | Tap log-snack → navigate 'calendar' tab | Positive | P1 |
| TC_QAW_102 | Tap start-workout → navigate 'fitness' tab | Positive | P0 |
| TC_QAW_103 | Tap log-cardio → navigate 'fitness' tab | Positive | P1 |
| TC_QAW_104 | Tap view-results → navigate 'fitness' tab | Positive | P0 |
| TC_QAW_105 | Rapid tapping same button → debounce | Edge | P1 |
| TC_QAW_106 | Tap different buttons quickly | Edge | P2 |
| TC_QAW_107 | ACTION_ICON_MAP: log-weight → Scale | Positive | P2 |
| TC_QAW_108 | ACTION_ICON_MAP: start-workout → Dumbbell | Positive | P2 |
| TC_QAW_109 | ACTION_ICON_MAP: view-results → TrendingUp | Positive | P2 |
| TC_QAW_110 | ACTION_ICON_MAP: log-cardio → Activity | Positive | P2 |
| TC_QAW_111 | WeightQuickLog open via 'Log cân' button | Positive | P0 |
| TC_QAW_112 | WeightQuickLog open via WeightMini tap | Positive | P0 |
| TC_QAW_113 | WeightQuickLog: initial weight = todayEntry.weightKg | Positive | P0 |
| TC_QAW_114 | WeightQuickLog: initial weight = yesterdayEntry khi no todayEntry | Positive | P1 |
| TC_QAW_115 | WeightQuickLog: initial weight = latestEntry khi no today/yesterday | Positive | P1 |
| TC_QAW_116 | WeightQuickLog: initial weight = 0 khi no entries | Edge | P1 |
| TC_QAW_117 | WeightQuickLog close via X button | Positive | P0 |
| TC_QAW_118 | WeightQuickLog X button ≥ 44px touch target | Positive | P1 |
| TC_QAW_119 | WeightQuickLog close via backdrop tap | Positive | P0 |
| TC_QAW_120 | WeightQuickLog close: unsaved input discarded | Positive | P1 |
| TC_QAW_121 | WeightQuickLog backdrop is semi-transparent | Positive | P2 |
| TC_QAW_122 | WeightQuickLog backdrop z-index = z-60 | Positive | P2 |
| TC_QAW_123 | WeightQuickLog role='dialog' | Positive | P1 |
| TC_QAW_124 | WeightQuickLog aria-label | Positive | P2 |
| TC_QAW_125 | WeightQuickLog header: Scale icon + title text | Positive | P1 |
| TC_QAW_126 | WeightQuickLog open animation: slide up | Positive | P2 |
| TC_QAW_127 | WeightQuickLog close animation: slide down | Positive | P2 |
| TC_QAW_128 | WeightQuickLog rounded top: rounded-t-3xl | Positive | P2 |
| TC_QAW_129 | WeightQuickLog sm:rounded-3xl (on larger screens) | Positive | P2 |
| TC_QAW_130 | WeightQuickLog sm:max-w-md (capped width) | Positive | P2 |
| TC_QAW_131 | Increment +0.1kg: 70.0 → 70.1 | Positive | P0 |
| TC_QAW_132 | Decrement -0.1kg: 70.0 → 69.9 | Positive | P0 |
| TC_QAW_133 | Increment multiple: 70.0 → 70.1 → 70.2 → 70.3 | Positive | P1 |
| TC_QAW_134 | Decrement multiple: 70.0 → 69.9 → 69.8 | Positive | P1 |
| TC_QAW_135 | STEP = 0.1 constant | Positive | P2 |
| TC_QAW_136 | MIN_WEIGHT = 30 boundary: decrement at 30.0 → disabled | Boundary | P0 |
| TC_QAW_137 | MIN_WEIGHT = 30 boundary: decrement at 30.1 → 30.0 (enabled) | Boundary | P0 |
| TC_QAW_138 | MAX_WEIGHT = 300 boundary: increment at 300.0 → disabled | Boundary | P0 |
| TC_QAW_139 | MAX_WEIGHT = 300 boundary: increment at 299.9 → 300.0 (enabled) | Boundary | P0 |
| TC_QAW_140 | Decrement disabled: visual indicator | Positive | P2 |
| TC_QAW_141 | Increment disabled: visual indicator | Positive | P2 |
| TC_QAW_142 | Decrement button: Minus icon | Positive | P2 |
| TC_QAW_143 | Increment button: Plus icon | Positive | P2 |
| TC_QAW_144 | Stepper buttons: h-12 w-12 (48px) | Positive | P2 |
| TC_QAW_145 | Stepper buttons: rounded-full | Positive | P2 |
| TC_QAW_146 | Float precision: 70.0 + 0.1 = 70.1 (not 70.10000001) | Positive | P1 |
| TC_QAW_147 | Float precision: 69.9 + 0.1 = 70.0 | Positive | P1 |
| TC_QAW_148 | round1 function: round1(70.15) = 70.2 | Positive | P2 |
| TC_QAW_149 | round1 function: round1(70.04) = 70.0 | Positive | P2 |
| TC_QAW_150 | Stepper aria-labels: 'Giảm' và 'Tăng' | Positive | P2 |
| TC_QAW_151 | Long press increment: hold → continuous increment | Positive | P0 |
| TC_QAW_152 | Long press decrement: hold → continuous decrement | Positive | P0 |
| TC_QAW_153 | Long press delay: 500ms before first repeat | Positive | P1 |
| TC_QAW_154 | Long press initial interval: 150ms | Positive | P1 |
| TC_QAW_155 | Long press acceleration: after 8 ticks → 50ms interval | Positive | P1 |
| TC_QAW_156 | Recent chips hiển thị khi có weight entries | Positive | P1 |
| TC_QAW_157 | Recent chips: max 5 unique weights | Positive | P1 |
| TC_QAW_158 | Recent chips: exclude today's weight | Positive | P1 |
| TC_QAW_159 | Recent chips: unique values only | Positive | P1 |
| TC_QAW_160 | Recent chip tap → set inputValue | Positive | P0 |
| TC_QAW_161 | Selected chip: highlighted styling | Positive | P1 |
| TC_QAW_162 | Unselected chip: default styling | Positive | P1 |
| TC_QAW_163 | Yesterday chip has '(Hôm qua)' label | Positive | P1 |
| TC_QAW_164 | No recent chips khi no entries (except today) | Positive | P1 |
| TC_QAW_165 | Chips horizontal scroll (overflow-x-auto) | Positive | P2 |
| TC_QAW_166 | Chip data-testid format: chip-{weight} | Positive | P2 |
| TC_QAW_167 | Chip font: text-sm font-medium | Positive | P2 |
| TC_QAW_168 | Chip rounded-full | Positive | P2 |
| TC_QAW_169 | Chip padding: px-3.5 py-1.5 | Positive | P2 |
| TC_QAW_170 | Tap different chip → deselect previous | Positive | P1 |
| TC_QAW_171 | Recent chips shrink-0 (no wrap/shrink) | Positive | P2 |
| TC_QAW_172 | RECENT_CHIP_COUNT = 5 constant | Positive | P2 |
| TC_QAW_173 | Chips order: most recent first | Positive | P2 |
| TC_QAW_174 | Chip with same value as inputValue → auto-highlight | Positive | P1 |
| TC_QAW_175 | Dark mode: chip styling | Positive | P2 |
| TC_QAW_176 | Save button enabled khi isValid (30 ≤ weight ≤ 300) | Positive | P0 |
| TC_QAW_177 | Save button disabled khi inputValue < 30 | Positive | P0 |
| TC_QAW_178 | Save button disabled khi inputValue > 300 | Boundary | P1 |
| TC_QAW_179 | Save button disabled khi inputValue = 0 (no entry selected) | Positive | P1 |
| TC_QAW_180 | Save: new entry → addWeightEntry called | Positive | P0 |
| TC_QAW_181 | Save: existing entry → updateWeightEntry called | Positive | P0 |
| TC_QAW_182 | Save → close bottom sheet | Positive | P0 |
| TC_QAW_183 | Save → success toast hiển thị | Positive | P0 |
| TC_QAW_184 | Save → toast có undo action | Positive | P0 |
| TC_QAW_185 | Undo trong 5 giây → revert weight | Positive | P0 |
| TC_QAW_186 | Undo sau 5 giây → expired, không revert | Positive | P1 |
| TC_QAW_187 | UNDO_DURATION = 5000ms constant | Positive | P2 |
| TC_QAW_188 | Undo new entry → removeWeightEntry called | Positive | P1 |
| TC_QAW_189 | Undo updated entry → revert to previous weight | Positive | P1 |
| TC_QAW_190 | Save button styling: bg-emerald-500 text-white rounded-xl | Positive | P2 |
| TC_QAW_191 | Save button padding: px-6 py-3.5 | Positive | P2 |
| TC_QAW_192 | Save button hover: hover:bg-emerald-600 | Positive | P2 |
| TC_QAW_193 | Save button active: active:scale-[0.98] | Positive | P2 |
| TC_QAW_194 | Save button transition-all | Positive | P2 |
| TC_QAW_195 | Save: weight display shows saved value correctly | Positive | P1 |
| TC_QAW_196 | Double tap save → only 1 save operation | Edge | P1 |
| TC_QAW_197 | Save disabled button: click does nothing | Positive | P1 |
| TC_QAW_198 | Save at MIN_WEIGHT boundary: 30.0 | Boundary | P1 |
| TC_QAW_199 | Save at MAX_WEIGHT boundary: 300.0 | Boundary | P1 |
| TC_QAW_200 | Toast notification auto-dismiss after 5s | Positive | P2 |
| TC_QAW_201 | Info row: yesterday weight hiển thị | Positive | P1 |
| TC_QAW_202 | Info row: no yesterday → yesterday-info ẩn | Positive | P1 |
| TC_QAW_203 | Info row: 7-day moving average hiển thị | Positive | P1 |
| TC_QAW_204 | Info row: < 3 entries → moving average ẩn | Positive | P1 |
| TC_QAW_205 | Info row: moving average = round1 (1 decimal) | Positive | P2 |
| TC_QAW_206 | Info row: trend ↑ (weight going up) | Positive | P1 |
| TC_QAW_207 | Info row: trend ↓ (weight going down) | Positive | P1 |
| TC_QAW_208 | Info row: trend → (stable) | Positive | P1 |
| TC_QAW_209 | Info row: trend ẩn khi no data | Positive | P1 |
| TC_QAW_210 | Info row: tabular-nums applied | Positive | P2 |
| TC_QAW_211 | Info row: text-sm text-slate-500 | Positive | P2 |
| TC_QAW_212 | Info row: flex-wrap for narrow screens | Positive | P2 |
| TC_QAW_213 | Trend indicator aria-label | Positive | P2 |
| TC_QAW_214 | MOVING_AVG_DAYS = 7 constant | Positive | P2 |
| TC_QAW_215 | Moving average calculation correct | Positive | P1 |
| TC_QAW_216 | Trend calculation: movingAvg 70.5, yesterday 70.0 → ↑ | Positive | P1 |
| TC_QAW_217 | Trend calculation: movingAvg 69.5, yesterday 70.0 → ↓ | Positive | P1 |
| TC_QAW_218 | Info row: all 3 pieces visible together | Positive | P1 |
| TC_QAW_219 | Info row: gap spacing between items | Positive | P2 |
| TC_QAW_220 | Info row: dark mode text color | Positive | P2 |
| TC_QAW_221 | Dark mode: QuickActionsBar buttons | Positive | P2 |
| TC_QAW_222 | Dark mode: primary button unchanged (emerald) | Positive | P2 |
| TC_QAW_223 | Dark mode: shadow-glow on primary button | Positive | P2 |
| TC_QAW_224 | Dark mode: WeightQuickLog bg | Positive | P2 |
| TC_QAW_225 | Dark mode: weight display text | Positive | P2 |
| TC_QAW_226 | Dark mode: stepper buttons | Positive | P2 |
| TC_QAW_227 | Dark mode: save button | Positive | P2 |
| TC_QAW_228 | Dark mode: close button | Positive | P2 |
| TC_QAW_229 | Dark mode: info row text readable | Positive | P2 |
| TC_QAW_230 | Dark mode: chip active state | Positive | P2 |
| TC_QAW_231 | Dark mode: chip inactive state | Positive | P2 |
| TC_QAW_232 | Dark mode: ModalBackdrop opacity | Positive | P2 |
| TC_QAW_233 | Dark mode: trend indicator colors visible | Positive | P2 |
| TC_QAW_234 | Dark mode: header Scale icon | Positive | P2 |
| TC_QAW_235 | Dark mode: 'kg' label text | Positive | P2 |
| TC_QAW_236 | Dark mode: disabled button styling | Positive | P2 |
| TC_QAW_237 | Light → Dark toggle: weight value preserved | Positive | P2 |
| TC_QAW_238 | Dark mode: toast notification styling | Positive | P2 |
| TC_QAW_239 | Dark mode: weight display font | Positive | P2 |
| TC_QAW_240 | Dark mode: QuickActionsBar nav bg | Positive | P2 |
| TC_QAW_241 | All buttons have accessible names | Positive | P1 |
| TC_QAW_242 | Keyboard navigation: Tab through 3 buttons | Positive | P1 |
| TC_QAW_243 | Enter key activates focused button | Positive | P1 |
| TC_QAW_244 | Space key activates focused button | Positive | P1 |
| TC_QAW_245 | WeightQuickLog: keyboard stepper (Arrow Up/Down) | Positive | P2 |
| TC_QAW_246 | WeightQuickLog: Escape key closes | Positive | P1 |
| TC_QAW_247 | WeightQuickLog: focus trap active | Positive | P1 |
| TC_QAW_248 | WeightQuickLog: focus returns after close | Positive | P2 |
| TC_QAW_249 | Screen reader: QuickActionsBar navigation landmark | Positive | P2 |
| TC_QAW_250 | Screen reader: weight value announced | Positive | P2 |
| TC_QAW_251 | Touch target ≥ 44px cho tất cả buttons | Positive | P1 |
| TC_QAW_252 | Component unmount cleanup: no memory leak | Positive | P2 |
| TC_QAW_253 | Long press cleanup on unmount | Positive | P2 |
| TC_QAW_254 | Undo timer cleanup on unmount | Positive | P2 |
| TC_QAW_255 | ActionButton wrapped in React.memo | Positive | P3 |
| TC_QAW_256 | QuickActionsBar wrapped in React.memo | Positive | P3 |
| TC_QAW_257 | WeightQuickLog wrapped in React.memo | Positive | P3 |
| TC_QAW_258 | Responsive: 320px width QuickActionsBar | Positive | P2 |
| TC_QAW_259 | Responsive: 768px width WeightQuickLog | Positive | P2 |
| TC_QAW_260 | WeightQuickLog: weight display '—' khi inputValue = 0 | Edge | P1 |

---

## Chi tiết Test Cases

##### TC_QAW_01: QuickActionsBar render
- **Pre-conditions**: Dashboard tab active, Tier 5 visible
- **Steps**: 1. Mở Dashboard tab 2. Chờ lazy load
- **Expected**: data-testid="quick-actions-bar" tồn tại, là nav element
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_02: 3 action buttons hiển thị
- **Pre-conditions**: QuickActionsBar render
- **Steps**: 1. Đếm buttons trong quick-actions-bar
- **Expected**: Chính xác 3 buttons, mỗi button có icon + label text
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_03: Left button luôn là log-weight
- **Pre-conditions**: Bất kỳ user state nào
- **Steps**: 1. Inspect first button
- **Expected**: data-testid="quick-action-log-weight", Scale icon, label "Cân nặng"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_04: Center = view-results khi workout completed
- **Pre-conditions**: workoutCompleted = true
- **Steps**: 1. Inspect center button
- **Expected**: data-testid="quick-action-view-results", TrendingUp icon
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_05: Center = start-workout khi chưa tập
- **Pre-conditions**: hasTrainingPlan = true, workoutCompleted = false, isRestDay = false
- **Steps**: 1. Inspect center button
- **Expected**: data-testid="quick-action-start-workout", Dumbbell icon
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_06: Center = log-meal khi chưa log
- **Pre-conditions**: hasTrainingPlan = false, mealsLoggedToday = 0
- **Steps**: 1. Inspect center button
- **Expected**: data-testid="quick-action-log-meal" hoặc specific meal action, Plus icon
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_07: Center meal based on next unlogged
- **Pre-conditions**: hasBreakfast = true, hasLunch = false
- **Steps**: 1. Inspect center button
- **Expected**: Specific meal action phản ánh next unlogged meal (log-lunch)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_08: Right action context mapping
- **Pre-conditions**: Various user states
- **Steps**: 1. Test right button across different states
- **Expected**: Right action changes based on priority: log-snack > start-workout > view-results > log-cardio
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_09: Primary button styling
- **Pre-conditions**: Action isPrimary = true
- **Steps**: 1. Inspect button classes/style
- **Expected**: bg-emerald-500, text-white, height: 56px, boxShadow: var(--shadow-glow), min-w-[100px], rounded-full
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_10: Secondary button styling
- **Pre-conditions**: Action isPrimary = false
- **Steps**: 1. Inspect button classes/style
- **Expected**: bg-white, border border-gray-200, text-emerald-600, height: 48px, min-w-[100px], rounded-full
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_11: Icon mapping log-weight → Scale
- **Pre-conditions**: QuickActionsBar render
- **Steps**: 1. Inspect log-weight button icon
- **Expected**: Scale icon (lucide-react) hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_12: Icon mapping start-workout → Dumbbell
- **Pre-conditions**: start-workout action visible
- **Steps**: 1. Inspect button icon
- **Expected**: Dumbbell icon hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_13: Icon mapping log-meal → Plus
- **Pre-conditions**: log-meal action visible
- **Steps**: 1. Inspect button icon
- **Expected**: Plus icon hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_14: Icon mapping view-results → TrendingUp
- **Pre-conditions**: view-results action visible
- **Steps**: 1. Inspect button icon
- **Expected**: TrendingUp icon hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_15: Icon mapping log-cardio → Activity
- **Pre-conditions**: log-cardio action visible
- **Steps**: 1. Inspect button icon
- **Expected**: Activity icon hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_16: Tap action dispatches đúng tab
- **Pre-conditions**: QuickActionsBar render
- **Steps**: 1. Click log-weight → verify dispatches to fitness tab 2. Click log-meal → verify dispatches to calendar tab
- **Expected**: Weight/workout/cardio/results → fitness tab, meal actions → calendar tab
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_17: Nav aria-label
- **Pre-conditions**: QuickActionsBar render
- **Steps**: 1. Inspect nav element
- **Expected**: aria-label chứa translation "quickActions.ariaLabel"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_18: Action button aria-label
- **Pre-conditions**: QuickActionsBar render
- **Steps**: 1. Inspect each button
- **Expected**: Mỗi button có aria-label = t(action.label)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_19: Icons aria-hidden
- **Pre-conditions**: QuickActionsBar render
- **Steps**: 1. Inspect SVG icons
- **Expected**: Tất cả icons có aria-hidden="true"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_20: WeightQuickLog render
- **Pre-conditions**: weightQuickLogOpen = true
- **Steps**: 1. Trigger WeightMini tap
- **Expected**: data-testid="weight-quick-log" hiển thị, ModalBackdrop visible
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_21: WeightQuickLog role="dialog"
- **Pre-conditions**: WeightQuickLog open
- **Steps**: 1. Inspect dialog element
- **Expected**: role="dialog", aria-label chứa "quickLogTitle" translation
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_22: Initial weight = today's entry
- **Pre-conditions**: todayEntry.weightKg = 75.5
- **Steps**: 1. Open WeightQuickLog
- **Expected**: data-testid="weight-display" hiển thị "75.5"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_23: Initial weight = yesterday khi no today
- **Pre-conditions**: Không có todayEntry, yesterdayEntry.weightKg = 75.0
- **Steps**: 1. Open WeightQuickLog
- **Expected**: weight-display hiển thị "75"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_24: Initial weight = latest entry
- **Pre-conditions**: Không có today/yesterday, latestEntry.weightKg = 74.3
- **Steps**: 1. Open WeightQuickLog
- **Expected**: weight-display hiển thị "74.3"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_25: Initial weight = 0 khi no entries
- **Pre-conditions**: weightEntries = []
- **Steps**: 1. Open WeightQuickLog
- **Expected**: inputValue = 0, weight-display hiển thị "—"
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_QAW_26: Weight display "—" khi 0
- **Pre-conditions**: inputValue = 0
- **Steps**: 1. Observe weight-display
- **Expected**: Hiển thị "—" thay vì "0" (inputValue > 0 ? inputValue : '—')
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_27: Increment +0.1kg
- **Pre-conditions**: inputValue = 75.0
- **Steps**: 1. Click data-testid="increment-btn"
- **Expected**: weight-display = "75.1" (round1(75.0 + 0.1))
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_28: Decrement −0.1kg
- **Pre-conditions**: inputValue = 75.0
- **Steps**: 1. Click data-testid="decrement-btn"
- **Expected**: weight-display = "74.9" (round1(75.0 - 0.1))
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_29: Increment disabled at 300kg
- **Pre-conditions**: inputValue = 300.0
- **Steps**: 1. Inspect increment-btn
- **Expected**: disabled attribute present, opacity-40, cursor-not-allowed
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_QAW_30: Decrement disabled at 30kg
- **Pre-conditions**: inputValue = 30.0
- **Steps**: 1. Inspect decrement-btn
- **Expected**: disabled attribute present, opacity-40, cursor-not-allowed
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_QAW_31: Increment 299.9 → 300.0 → disabled
- **Pre-conditions**: inputValue = 299.9
- **Steps**: 1. Click increment 2. Verify value = 300.0 3. Click increment again
- **Expected**: After first click: 300.0. Second click: no change (next = 300.1 > MAX_WEIGHT)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_QAW_32: Decrement 30.1 → 30.0 → disabled
- **Pre-conditions**: inputValue = 30.1
- **Steps**: 1. Click decrement 2. Verify value = 30.0 3. Click decrement again
- **Expected**: After first click: 30.0. Second click: no change (next = 29.9 < MIN_WEIGHT)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_QAW_33: Long press continuous increment
- **Pre-conditions**: inputValue = 70.0
- **Steps**: 1. Pointer down trên increment-btn 2. Hold 1 giây 3. Pointer up
- **Expected**: Value tăng liên tục (500ms delay + interval ticks), value > 70.3 sau 1s
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_34: Long press acceleration
- **Pre-conditions**: inputValue = 70.0
- **Steps**: 1. Long press increment 2. Hold > 2 giây
- **Expected**: Sau 8 ticks, interval switch từ 150ms → 50ms (3x faster)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_35: Long press stop on pointer up
- **Pre-conditions**: Long pressing increment
- **Steps**: 1. Release pointer
- **Expected**: Value stops incrementing, timers cleared
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_36: Long press stop on pointer leave
- **Pre-conditions**: Long pressing increment
- **Steps**: 1. Move pointer outside button
- **Expected**: Value stops incrementing, timers cleared
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_37: Recent chips display
- **Pre-conditions**: 7 weight entries (different weights)
- **Steps**: 1. Observe data-testid="quick-select-chips"
- **Expected**: Hiển thị max 5 unique weights, sorted by most recent date
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_38: Recent chips exclude today
- **Pre-conditions**: Today entry = 75.0, yesterday = 74.5
- **Steps**: 1. Observe chips
- **Expected**: 75.0 (today) không xuất hiện trong chips, 74.5 có
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_39: Chip select updates value
- **Pre-conditions**: Chips visible, chip value = 74.5
- **Steps**: 1. Click chip 74.5
- **Expected**: inputValue = 74.5, weight-display cập nhật
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_40: Active chip highlight
- **Pre-conditions**: inputValue matches một chip value
- **Steps**: 1. Observe chip styling
- **Expected**: Active chip: border-emerald-400 bg-emerald-100 text-emerald-700
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_41: Yesterday chip label
- **Pre-conditions**: Chip weight = yesterday's weight
- **Steps**: 1. Observe chip text
- **Expected**: Weight number + "(Hôm qua)" label
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_42: No recent entries → no chips
- **Pre-conditions**: weightEntries = [] hoặc chỉ có today
- **Steps**: 1. Observe DOM
- **Expected**: data-testid="quick-select-chips" không tồn tại (recentChips.length === 0)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_QAW_43: Save creates new entry
- **Pre-conditions**: Không có todayEntry, inputValue = 75.5
- **Steps**: 1. Click save-btn
- **Expected**: addWeightEntry gọi với { id: 'w-...', date: today, weightKg: 75.5, createdAt, updatedAt }
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_44: Save updates existing entry
- **Pre-conditions**: todayEntry exists (id: 'w-123', weightKg: 74.0), inputValue = 75.5
- **Steps**: 1. Click save-btn
- **Expected**: updateWeightEntry gọi với ('w-123', { weightKg: 75.5, updatedAt: ... })
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_45: Save → close → toast
- **Pre-conditions**: Valid inputValue
- **Steps**: 1. Click save-btn
- **Expected**: 1. onClose() gọi (sheet đóng) 2. notify.success hiển thị với "75.5 kg" 3. Toast có undo action
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_46: Undo toast 5 second duration
- **Pre-conditions**: Save completed, toast visible
- **Steps**: 1. Observe toast duration
- **Expected**: Toast hiển thị 5000ms (UNDO_DURATION), có nút undo
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_47: Undo new entry → remove
- **Pre-conditions**: Save tạo new entry (id: 'w-456')
- **Steps**: 1. Click undo trên toast
- **Expected**: removeWeightEntry('w-456') gọi, entry bị xóa
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_48: Undo update → revert
- **Pre-conditions**: Save update entry (wasUpdate=true, previousWeight=74.0)
- **Steps**: 1. Click undo trên toast
- **Expected**: updateWeightEntry(id, { weightKg: 74.0, updatedAt: ... }) gọi, revert về giá trị cũ
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_49: Close button touch target
- **Pre-conditions**: WeightQuickLog open
- **Steps**: 1. Inspect data-testid="close-btn"
- **Expected**: h-11 w-11 (44px × 44px), đạt minimum touch target
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_50: Close button click
- **Pre-conditions**: WeightQuickLog open
- **Steps**: 1. Click close-btn
- **Expected**: onClose() gọi, sheet đóng, không save data
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_51: Backdrop dismiss
- **Pre-conditions**: WeightQuickLog open
- **Steps**: 1. Click ModalBackdrop area (outside sheet)
- **Expected**: onClose() gọi qua ModalBackdrop, sheet đóng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_52: Save disabled invalid range
- **Pre-conditions**: inputValue = 0 (< MIN_WEIGHT)
- **Steps**: 1. Inspect save-btn
- **Expected**: disabled attribute, opacity-50, cursor-not-allowed, click không trigger save
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_QAW_53: Info row: yesterday, moving avg, trend
- **Pre-conditions**: yesterdayEntry có, ≥3 entries trong 7 ngày
- **Steps**: 1. Observe data-testid="info-row"
- **Expected**: yesterday-info hiển thị, moving-average hiển thị, trend-indicator hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_54: Trend indicator colors
- **Pre-conditions**: movingAvg > yesterdayWeight
- **Steps**: 1. Inspect trend-indicator
- **Expected**: symbol = "↑", class = "text-red-500" (weight going up). Khi movingAvg < yesterday → "↓" emerald-500. Equal → "→" slate-400
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_55: Weight display tabular-nums
- **Pre-conditions**: WeightQuickLog open
- **Steps**: 1. Inspect weight-display style
- **Expected**: fontVariantNumeric: "tabular-nums", số không nhảy layout khi thay đổi
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_056: Context: 0 meals logged → center = 'log-breakfast' (primary)
- **Pre-conditions**: mealsLoggedToday = 0, hasBreakfast = false
- **Steps**: 1. Observe center button
- **Expected**: Center button = 'Log bữa sáng', isPrimary = true, Plus icon
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_057: Context: 0 meals → left = 'log-weight' (always)
- **Pre-conditions**: mealsLoggedToday = 0
- **Steps**: 1. Observe left button
- **Expected**: Left button = 'Log cân', Scale icon, isPrimary = false
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_058: Context: 0 meals → right = 'start-workout' hoặc 'log-cardio'
- **Pre-conditions**: mealsLoggedToday = 0, hasTrainingPlan = true
- **Steps**: 1. Observe right button
- **Expected**: Right button = 'Bắt đầu tập', Dumbbell icon, secondary
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_059: Context: 0 meals, no training plan → right = 'log-cardio'
- **Pre-conditions**: mealsLoggedToday = 0, hasTrainingPlan = false
- **Steps**: 1. Observe right button
- **Expected**: Right button = 'Log cardio', Activity icon, secondary
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_060: Context: 1 meal (breakfast) → center = 'log-lunch' (primary)
- **Pre-conditions**: hasBreakfast = true, hasLunch = false, mealsLoggedToday = 1
- **Steps**: 1. Observe center button
- **Expected**: Center button = 'Log bữa trưa', isPrimary = true
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_061: Context: 1 meal logged → left vẫn = 'log-weight'
- **Pre-conditions**: mealsLoggedToday = 1
- **Steps**: 1. Observe left button
- **Expected**: Left button vẫn là 'Log cân' (always)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_062: Context: 2 meals (breakfast + lunch) → center = 'log-dinner'
- **Pre-conditions**: hasBreakfast = true, hasLunch = true, hasDinner = false
- **Steps**: 1. Observe center button
- **Expected**: Center button = 'Log bữa tối', isPrimary = true
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_063: Context: 2 meals → right = 'start-workout' (if plan)
- **Pre-conditions**: mealsLoggedToday = 2, hasTrainingPlan = true, workoutCompleted = false
- **Steps**: 1. Observe right button
- **Expected**: Right button = 'Bắt đầu tập', secondary
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_064: Context: all meals logged → center = 'start-workout' (if plan, not done)
- **Pre-conditions**: mealsLoggedToday = 3, hasTrainingPlan = true, workoutCompleted = false
- **Steps**: 1. Observe center button
- **Expected**: Center button = 'Bắt đầu tập', isPrimary = true, Dumbbell icon
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_065: Context: all meals + no training plan → center = 'log-meal'
- **Pre-conditions**: mealsLoggedToday = 3, hasTrainingPlan = false
- **Steps**: 1. Observe center button
- **Expected**: Center button = 'Log thêm' hoặc 'log-meal', primary
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_066: Context: all meals logged → right = 'log-snack'
- **Pre-conditions**: mealsLoggedToday = 3, workoutCompleted = false, hasTrainingPlan = true
- **Steps**: 1. Observe right button
- **Expected**: Right button = 'Log snack', secondary
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_067: Context: all meals + workout done → center = 'view-results'
- **Pre-conditions**: mealsLoggedToday = 3, workoutCompleted = true
- **Steps**: 1. Observe center button
- **Expected**: Center button = 'Xem kết quả', isPrimary = true, TrendingUp icon
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_068: Context: all meals + workout done → right = 'log-snack'
- **Pre-conditions**: mealsLoggedToday = 3, workoutCompleted = true
- **Steps**: 1. Observe right button
- **Expected**: Right button = 'Log snack', secondary
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_069: Context: rest day → center = 'log-meal' (primary)
- **Pre-conditions**: isRestDay = true, mealsLoggedToday < 3
- **Steps**: 1. Observe center button
- **Expected**: Center button = 'Log bữa' hoặc specific meal, primary
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_070: Context: rest day → right = 'log-cardio'
- **Pre-conditions**: isRestDay = true
- **Steps**: 1. Observe right button
- **Expected**: Right button = 'Log cardio', Activity icon
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_071: Context: workout completed, meals remaining → center = 'log-meal'
- **Pre-conditions**: workoutCompleted = true, mealsLoggedToday = 1
- **Steps**: 1. Observe center button
- **Expected**: Center button = specific next meal hoặc 'log-meal', primary
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_072: Context: workout completed → right = 'view-results'
- **Pre-conditions**: workoutCompleted = true, mealsLoggedToday < 3
- **Steps**: 1. Observe right button
- **Expected**: Right button = 'Xem kết quả', TrendingUp, secondary
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_073: Left button luôn là 'log-weight' bất kể context
- **Pre-conditions**: Bất kỳ combination nào
- **Steps**: 1. Test 5+ different contexts 2. Check left button
- **Expected**: Left button = 'log-weight' trong tất cả contexts
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_074: Center button luôn isPrimary = true
- **Pre-conditions**: Bất kỳ context nào
- **Steps**: 1. Inspect center button isPrimary
- **Expected**: isPrimary = true cho center button
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_075: Left và right buttons luôn isPrimary = false
- **Pre-conditions**: Bất kỳ context nào
- **Steps**: 1. Inspect left/right isPrimary
- **Expected**: isPrimary = false cho left và right
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_076: Primary button: bg-emerald-500
- **Pre-conditions**: Center button render
- **Steps**: 1. Inspect center button classes
- **Expected**: class chứa 'bg-emerald-500'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_077: Primary button: text-white
- **Pre-conditions**: Center button render
- **Steps**: 1. Inspect text color
- **Expected**: class chứa 'text-white'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_078: Primary button: height = 56px
- **Pre-conditions**: Center button render
- **Steps**: 1. Inspect computed height
- **Expected**: height = 56px (style={{ height: 56 }})
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_079: Primary button: icon size = 24px
- **Pre-conditions**: Center button render
- **Steps**: 1. Inspect icon size
- **Expected**: Icon size = 24px
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_080: Primary button: shadow-glow effect
- **Pre-conditions**: Center button render
- **Steps**: 1. Inspect boxShadow
- **Expected**: boxShadow = 'var(--shadow-glow)'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_081: Primary button: rounded-full
- **Pre-conditions**: Center button render
- **Steps**: 1. Inspect border-radius
- **Expected**: border-radius = 9999px (rounded-full)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_082: Primary button: min-w-[100px]
- **Pre-conditions**: Center button render
- **Steps**: 1. Inspect min-width
- **Expected**: min-width = 100px
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_083: Secondary button: bg-white + border
- **Pre-conditions**: Left button render
- **Steps**: 1. Inspect left button classes
- **Expected**: bg-white border border-gray-200
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_084: Secondary button: text-emerald-600
- **Pre-conditions**: Left button render
- **Steps**: 1. Inspect text color
- **Expected**: text-emerald-600
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_085: Secondary button: height = 48px
- **Pre-conditions**: Left button render
- **Steps**: 1. Inspect computed height
- **Expected**: height = 48px (style={{ height: 48 }})
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_086: Secondary button: icon size = 20px
- **Pre-conditions**: Left button render
- **Steps**: 1. Inspect icon size
- **Expected**: Icon size = 20px
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_087: Secondary button: no shadow-glow
- **Pre-conditions**: Left button render
- **Steps**: 1. Inspect boxShadow
- **Expected**: Không có shadow-glow
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_088: Secondary button: rounded-full
- **Pre-conditions**: Left button render
- **Steps**: 1. Inspect border-radius
- **Expected**: border-radius = 9999px
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_089: Label text font: text-[10px] font-medium
- **Pre-conditions**: Any button
- **Steps**: 1. Inspect label font
- **Expected**: font-size: 10px, font-weight: 500
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_090: Label text leading-tight
- **Pre-conditions**: Any button
- **Steps**: 1. Inspect line-height
- **Expected**: line-height: tight (1.25)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_091: Icon aria-hidden='true' trên tất cả buttons
- **Pre-conditions**: All 3 buttons render
- **Steps**: 1. Inspect icon aria-hidden
- **Expected**: Tất cả 3 icons có aria-hidden='true'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_092: Button type='button' (not submit)
- **Pre-conditions**: All 3 buttons
- **Steps**: 1. Inspect type attribute
- **Expected**: type = 'button' cho tất cả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_093: QuickActionsBar là nav element
- **Pre-conditions**: Component render
- **Steps**: 1. Inspect QuickActionsBar tag
- **Expected**: Tag = <nav>
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_094: QuickActionsBar aria-label
- **Pre-conditions**: Component render
- **Steps**: 1. Inspect nav aria-label
- **Expected**: aria-label = 'Hành động nhanh' hoặc i18n equivalent
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_095: 3 buttons centered: justify-center
- **Pre-conditions**: Component render
- **Steps**: 1. Inspect nav layout
- **Expected**: justify-content: center, gap: 12px (gap-3)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_096: Tap log-weight → navigate 'fitness' tab
- **Pre-conditions**: Tap left button
- **Steps**: 1. Tap 'Log cân' button
- **Expected**: navigateTab('fitness') called
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_097: Tap log-breakfast → navigate 'calendar' tab
- **Pre-conditions**: Center = log-breakfast
- **Steps**: 1. Tap center button
- **Expected**: navigateTab('calendar') called
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_098: Tap log-lunch → navigate 'calendar' tab
- **Pre-conditions**: Center = log-lunch
- **Steps**: 1. Tap center button
- **Expected**: navigateTab('calendar') called
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_099: Tap log-dinner → navigate 'calendar' tab
- **Pre-conditions**: Center = log-dinner
- **Steps**: 1. Tap center button
- **Expected**: navigateTab('calendar') called
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_100: Tap log-meal → navigate 'calendar' tab
- **Pre-conditions**: Center = log-meal
- **Steps**: 1. Tap center button
- **Expected**: navigateTab('calendar') called
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_101: Tap log-snack → navigate 'calendar' tab
- **Pre-conditions**: Right = log-snack
- **Steps**: 1. Tap right button
- **Expected**: navigateTab('calendar') called
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_102: Tap start-workout → navigate 'fitness' tab
- **Pre-conditions**: Right = start-workout
- **Steps**: 1. Tap right button
- **Expected**: navigateTab('fitness') called
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_103: Tap log-cardio → navigate 'fitness' tab
- **Pre-conditions**: Right = log-cardio
- **Steps**: 1. Tap right button
- **Expected**: navigateTab('fitness') called
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_104: Tap view-results → navigate 'fitness' tab
- **Pre-conditions**: Center = view-results
- **Steps**: 1. Tap center button
- **Expected**: navigateTab('fitness') called
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_105: Rapid tapping same button → debounce
- **Pre-conditions**: Any button
- **Steps**: 1. Tap 5 lần liên tục nhanh
- **Expected**: navigateTab gọi 1 lần (hoặc React batching)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_QAW_106: Tap different buttons quickly
- **Pre-conditions**: All buttons
- **Steps**: 1. Tap left → center → right nhanh
- **Expected**: Navigate to last tapped action's destination
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_QAW_107: ACTION_ICON_MAP: log-weight → Scale
- **Pre-conditions**: Component render
- **Steps**: 1. Verify icon mapping
- **Expected**: log-weight action renders Scale icon
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_108: ACTION_ICON_MAP: start-workout → Dumbbell
- **Pre-conditions**: Component render
- **Steps**: 1. Verify icon mapping
- **Expected**: start-workout action renders Dumbbell icon
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_109: ACTION_ICON_MAP: view-results → TrendingUp
- **Pre-conditions**: Component render
- **Steps**: 1. Verify icon mapping
- **Expected**: view-results action renders TrendingUp icon
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_110: ACTION_ICON_MAP: log-cardio → Activity
- **Pre-conditions**: Component render
- **Steps**: 1. Verify icon mapping
- **Expected**: log-cardio action renders Activity icon
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_111: WeightQuickLog open via 'Log cân' button
- **Pre-conditions**: QuickActionsBar visible
- **Steps**: 1. Tap 'Log cân' button
- **Expected**: WeightQuickLog bottom sheet mở, data-testid='weight-quick-log' visible
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_112: WeightQuickLog open via WeightMini tap
- **Pre-conditions**: Dashboard WeightMini visible
- **Steps**: 1. Tap WeightMini widget
- **Expected**: WeightQuickLog bottom sheet mở
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_113: WeightQuickLog: initial weight = todayEntry.weightKg
- **Pre-conditions**: todayEntry exists (67.5kg)
- **Steps**: 1. Open WeightQuickLog 2. Observe weight display
- **Expected**: weight-display = 67.5
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_114: WeightQuickLog: initial weight = yesterdayEntry khi no todayEntry
- **Pre-conditions**: No todayEntry, yesterdayEntry = 68.0
- **Steps**: 1. Open WeightQuickLog
- **Expected**: weight-display = 68.0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_115: WeightQuickLog: initial weight = latestEntry khi no today/yesterday
- **Pre-conditions**: No today/yesterday, latestEntry = 70.0
- **Steps**: 1. Open WeightQuickLog
- **Expected**: weight-display = 70.0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_116: WeightQuickLog: initial weight = 0 khi no entries
- **Pre-conditions**: No weight entries at all
- **Steps**: 1. Open WeightQuickLog
- **Expected**: weight-display = '—' (dash, inputValue = 0)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_QAW_117: WeightQuickLog close via X button
- **Pre-conditions**: WeightQuickLog open
- **Steps**: 1. Tap close-btn (X)
- **Expected**: Bottom sheet closes, unmounts from DOM
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_118: WeightQuickLog X button ≥ 44px touch target
- **Pre-conditions**: WeightQuickLog open
- **Steps**: 1. Inspect close-btn size
- **Expected**: h-11 w-11 = 44px × 44px
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_119: WeightQuickLog close via backdrop tap
- **Pre-conditions**: WeightQuickLog open
- **Steps**: 1. Tap ModalBackdrop (outside bottom sheet)
- **Expected**: Bottom sheet closes
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_120: WeightQuickLog close: unsaved input discarded
- **Pre-conditions**: WeightQuickLog open, changed weight, close
- **Steps**: 1. Increment weight 2. Close without save 3. Reopen
- **Expected**: Weight resets to initial (unsaved changes discarded)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_121: WeightQuickLog backdrop is semi-transparent
- **Pre-conditions**: WeightQuickLog open
- **Steps**: 1. Inspect ModalBackdrop
- **Expected**: Backdrop có dark semi-transparent overlay
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_122: WeightQuickLog backdrop z-index = z-60
- **Pre-conditions**: WeightQuickLog open
- **Steps**: 1. Inspect z-index
- **Expected**: z-index = 60 (z-60 class)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_123: WeightQuickLog role='dialog'
- **Pre-conditions**: WeightQuickLog open
- **Steps**: 1. Inspect role attribute
- **Expected**: role = 'dialog'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_124: WeightQuickLog aria-label
- **Pre-conditions**: WeightQuickLog open
- **Steps**: 1. Inspect aria-label
- **Expected**: aria-label chứa title text (quick log title)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_125: WeightQuickLog header: Scale icon + title text
- **Pre-conditions**: WeightQuickLog open
- **Steps**: 1. Inspect header
- **Expected**: Scale icon (emerald) + 'Ghi cân nặng' title (hoặc i18n)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_126: WeightQuickLog open animation: slide up
- **Pre-conditions**: WeightQuickLog closed → open
- **Steps**: 1. Tap trigger 2. Observe animation
- **Expected**: Bottom sheet slides up from bottom (hoặc fade in)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_127: WeightQuickLog close animation: slide down
- **Pre-conditions**: WeightQuickLog open → close
- **Steps**: 1. Tap close 2. Observe animation
- **Expected**: Bottom sheet slides down (hoặc fade out)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_128: WeightQuickLog rounded top: rounded-t-3xl
- **Pre-conditions**: WeightQuickLog open
- **Steps**: 1. Inspect border-radius
- **Expected**: border-top-left-radius: 24px, border-top-right-radius: 24px
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_129: WeightQuickLog sm:rounded-3xl (on larger screens)
- **Pre-conditions**: WeightQuickLog open, screen ≥ 640px
- **Steps**: 1. Inspect border-radius on sm screen
- **Expected**: All corners rounded (sm:rounded-3xl)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_130: WeightQuickLog sm:max-w-md (capped width)
- **Pre-conditions**: WeightQuickLog open, screen ≥ 640px
- **Steps**: 1. Inspect max-width
- **Expected**: max-width = 28rem (md) on sm+ screens
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_131: Increment +0.1kg: 70.0 → 70.1
- **Pre-conditions**: inputValue = 70.0
- **Steps**: 1. Tap increment-btn
- **Expected**: weight-display = 70.1
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_132: Decrement -0.1kg: 70.0 → 69.9
- **Pre-conditions**: inputValue = 70.0
- **Steps**: 1. Tap decrement-btn
- **Expected**: weight-display = 69.9
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_133: Increment multiple: 70.0 → 70.1 → 70.2 → 70.3
- **Pre-conditions**: inputValue = 70.0
- **Steps**: 1. Tap increment-btn 3 lần
- **Expected**: weight-display = 70.3
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_134: Decrement multiple: 70.0 → 69.9 → 69.8
- **Pre-conditions**: inputValue = 70.0
- **Steps**: 1. Tap decrement-btn 2 lần
- **Expected**: weight-display = 69.8
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_135: STEP = 0.1 constant
- **Pre-conditions**: Source code review
- **Steps**: 1. Verify STEP constant
- **Expected**: STEP = 0.1
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_136: MIN_WEIGHT = 30 boundary: decrement at 30.0 → disabled
- **Pre-conditions**: inputValue = 30.0
- **Steps**: 1. Inspect decrement-btn
- **Expected**: Button disabled (disabled attribute present)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P0

##### TC_QAW_137: MIN_WEIGHT = 30 boundary: decrement at 30.1 → 30.0 (enabled)
- **Pre-conditions**: inputValue = 30.1
- **Steps**: 1. Tap decrement-btn
- **Expected**: weight-display = 30.0, decrement now disabled
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P0

##### TC_QAW_138: MAX_WEIGHT = 300 boundary: increment at 300.0 → disabled
- **Pre-conditions**: inputValue = 300.0
- **Steps**: 1. Inspect increment-btn
- **Expected**: Button disabled
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P0

##### TC_QAW_139: MAX_WEIGHT = 300 boundary: increment at 299.9 → 300.0 (enabled)
- **Pre-conditions**: inputValue = 299.9
- **Steps**: 1. Tap increment-btn
- **Expected**: weight-display = 300.0, increment now disabled
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P0

##### TC_QAW_140: Decrement disabled: visual indicator
- **Pre-conditions**: inputValue = 30.0
- **Steps**: 1. Inspect decrement-btn styling
- **Expected**: Button has disabled styling (opacity reduced, cursor not-allowed)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_141: Increment disabled: visual indicator
- **Pre-conditions**: inputValue = 300.0
- **Steps**: 1. Inspect increment-btn styling
- **Expected**: Button has disabled styling
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_142: Decrement button: Minus icon
- **Pre-conditions**: WeightQuickLog open
- **Steps**: 1. Inspect decrement-btn icon
- **Expected**: Minus icon hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_143: Increment button: Plus icon
- **Pre-conditions**: WeightQuickLog open
- **Steps**: 1. Inspect increment-btn icon
- **Expected**: Plus icon hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_144: Stepper buttons: h-12 w-12 (48px)
- **Pre-conditions**: WeightQuickLog open
- **Steps**: 1. Inspect button dimensions
- **Expected**: height = width = 48px
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_145: Stepper buttons: rounded-full
- **Pre-conditions**: WeightQuickLog open
- **Steps**: 1. Inspect border-radius
- **Expected**: border-radius = 9999px
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_146: Float precision: 70.0 + 0.1 = 70.1 (not 70.10000001)
- **Pre-conditions**: inputValue = 70.0
- **Steps**: 1. Tap increment 2. Inspect value
- **Expected**: Display = '70.1' (round1 function handles precision)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_147: Float precision: 69.9 + 0.1 = 70.0
- **Pre-conditions**: inputValue = 69.9
- **Steps**: 1. Tap increment
- **Expected**: Display = '70' hoặc '70.0'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_148: round1 function: round1(70.15) = 70.2
- **Pre-conditions**: Unit test
- **Steps**: 1. Call round1(70.15)
- **Expected**: Return 70.2
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_149: round1 function: round1(70.04) = 70.0
- **Pre-conditions**: Unit test
- **Steps**: 1. Call round1(70.04)
- **Expected**: Return 70
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_150: Stepper aria-labels: 'Giảm' và 'Tăng'
- **Pre-conditions**: WeightQuickLog open
- **Steps**: 1. Inspect button aria-labels
- **Expected**: decrement: aria-label='Giảm', increment: aria-label='Tăng'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_151: Long press increment: hold → continuous increment
- **Pre-conditions**: inputValue = 70.0, hold increment button
- **Steps**: 1. Press and hold increment for 2s
- **Expected**: Weight increases continuously (70.0 → ~71.0+ depending on acceleration)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_152: Long press decrement: hold → continuous decrement
- **Pre-conditions**: inputValue = 70.0, hold decrement button
- **Steps**: 1. Press and hold decrement for 2s
- **Expected**: Weight decreases continuously
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_153: Long press delay: 500ms before first repeat
- **Pre-conditions**: Hold increment
- **Steps**: 1. Hold button, measure first repeat timing
- **Expected**: First repeat after ~500ms (LONG_PRESS_DELAY)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_154: Long press initial interval: 150ms
- **Pre-conditions**: Hold increment for 1s
- **Steps**: 1. Measure interval between increments
- **Expected**: Interval = ~150ms (LONG_PRESS_INTERVAL_INITIAL)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_155: Long press acceleration: after 8 ticks → 50ms interval
- **Pre-conditions**: Hold increment for 3s+
- **Steps**: 1. Hold long enough for 8+ ticks 2. Measure interval
- **Expected**: Interval switches to ~50ms after 8 ticks (ACCELERATION_THRESHOLD)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_156: Recent chips hiển thị khi có weight entries
- **Pre-conditions**: ≥ 1 weight entry (not today)
- **Steps**: 1. Observe quick-select-chips
- **Expected**: data-testid='quick-select-chips' visible
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_157: Recent chips: max 5 unique weights
- **Pre-conditions**: 10 different weight entries
- **Steps**: 1. Count chips
- **Expected**: Maximum 5 chips hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_158: Recent chips: exclude today's weight
- **Pre-conditions**: todayEntry = 70.0, other entries exist
- **Steps**: 1. Inspect chips
- **Expected**: Chip '70.0' không hiển thị (today excluded)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_159: Recent chips: unique values only
- **Pre-conditions**: Entries: 70.0, 70.0, 69.5, 69.5, 71.0
- **Steps**: 1. Count unique chips
- **Expected**: 3 chips: 70.0, 69.5, 71.0 (deduplicated)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_160: Recent chip tap → set inputValue
- **Pre-conditions**: Chip '69.5' visible
- **Steps**: 1. Tap chip '69.5'
- **Expected**: weight-display = 69.5, inputValue = 69.5
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_161: Selected chip: highlighted styling
- **Pre-conditions**: inputValue = 69.5, chip 69.5 present
- **Steps**: 1. Inspect chip-69.5
- **Expected**: Chip has active styling: border-emerald-400 bg-emerald-100
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_162: Unselected chip: default styling
- **Pre-conditions**: inputValue = 70.0, chip 69.5 present
- **Steps**: 1. Inspect chip-69.5
- **Expected**: Chip has default styling: border-slate-200 bg-white
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_163: Yesterday chip has '(Hôm qua)' label
- **Pre-conditions**: yesterdayEntry = 69.5
- **Steps**: 1. Inspect chip matching yesterday weight
- **Expected**: Chip shows '69.5 (Hôm qua)' extra label
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_164: No recent chips khi no entries (except today)
- **Pre-conditions**: Only todayEntry exists
- **Steps**: 1. Observe chips area
- **Expected**: quick-select-chips không hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_165: Chips horizontal scroll (overflow-x-auto)
- **Pre-conditions**: 5 chips visible
- **Steps**: 1. Inspect chips container
- **Expected**: overflow-x: auto, scrollable nếu cần
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_166: Chip data-testid format: chip-{weight}
- **Pre-conditions**: Chips visible
- **Steps**: 1. Inspect chip testids
- **Expected**: data-testid='chip-69.5' format
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_167: Chip font: text-sm font-medium
- **Pre-conditions**: Chips visible
- **Steps**: 1. Inspect chip font
- **Expected**: font-size: 14px (text-sm), font-weight: 500
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_168: Chip rounded-full
- **Pre-conditions**: Chips visible
- **Steps**: 1. Inspect chip border-radius
- **Expected**: border-radius = 9999px
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_169: Chip padding: px-3.5 py-1.5
- **Pre-conditions**: Chips visible
- **Steps**: 1. Inspect chip padding
- **Expected**: padding-left/right: 14px, padding-top/bottom: 6px
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_170: Tap different chip → deselect previous
- **Pre-conditions**: Chip 69.5 selected, tap chip 70.0
- **Steps**: 1. Tap chip 70.0
- **Expected**: Chip 70.0 highlighted, chip 69.5 unhighlighted, weight = 70.0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_171: Recent chips shrink-0 (no wrap/shrink)
- **Pre-conditions**: 5 chips visible
- **Steps**: 1. Inspect chip flex-shrink
- **Expected**: shrink-0 class (chips don't compress)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_172: RECENT_CHIP_COUNT = 5 constant
- **Pre-conditions**: Source review
- **Steps**: 1. Verify constant
- **Expected**: RECENT_CHIP_COUNT = 5
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_173: Chips order: most recent first
- **Pre-conditions**: Multiple entries
- **Steps**: 1. Inspect chip order
- **Expected**: Chips ordered by recency (most recent entry first)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_174: Chip with same value as inputValue → auto-highlight
- **Pre-conditions**: inputValue = 70.0, chip 70.0 exists
- **Steps**: 1. Observe chip
- **Expected**: Chip 70.0 auto-highlighted (matches inputValue)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_175: Dark mode: chip styling
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect chip colors
- **Expected**: dark:border-slate-600 dark:bg-slate-700 variants
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_176: Save button enabled khi isValid (30 ≤ weight ≤ 300)
- **Pre-conditions**: inputValue = 70.0
- **Steps**: 1. Inspect save-btn
- **Expected**: Button enabled, not disabled
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_177: Save button disabled khi inputValue < 30
- **Pre-conditions**: inputValue = 0 (dash)
- **Steps**: 1. Inspect save-btn
- **Expected**: Button disabled
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_178: Save button disabled khi inputValue > 300
- **Pre-conditions**: inputValue = 301 (shouldn't happen but defensive)
- **Steps**: 1. Inspect save-btn
- **Expected**: Button disabled
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_QAW_179: Save button disabled khi inputValue = 0 (no entry selected)
- **Pre-conditions**: No weight entries, inputValue = 0
- **Steps**: 1. Inspect save-btn
- **Expected**: Button disabled (0 < 30)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_180: Save: new entry → addWeightEntry called
- **Pre-conditions**: No todayEntry, inputValue = 70.0
- **Steps**: 1. Tap save-btn
- **Expected**: addWeightEntry({date: today, weightKg: 70.0}) called
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_181: Save: existing entry → updateWeightEntry called
- **Pre-conditions**: todayEntry exists, inputValue changed to 70.5
- **Steps**: 1. Tap save-btn
- **Expected**: updateWeightEntry called with new weight
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_182: Save → close bottom sheet
- **Pre-conditions**: inputValue = 70.0, tap save
- **Steps**: 1. Tap save-btn 2. Observe bottom sheet
- **Expected**: Bottom sheet closes after save
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_183: Save → success toast hiển thị
- **Pre-conditions**: Save weight
- **Steps**: 1. Tap save-btn 2. Observe toast
- **Expected**: Success toast hiển thị (ví dụ: 'Đã lưu 70.0 kg')
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_184: Save → toast có undo action
- **Pre-conditions**: Save weight
- **Steps**: 1. Tap save-btn 2. Observe toast undo button
- **Expected**: Toast chứa 'Hoàn tác' button
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_185: Undo trong 5 giây → revert weight
- **Pre-conditions**: Save weight, tap undo within 5s
- **Steps**: 1. Save 2. Tap undo within 5s
- **Expected**: Weight reverted to previous value (or entry removed)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_QAW_186: Undo sau 5 giây → expired, không revert
- **Pre-conditions**: Save weight, wait 6s
- **Steps**: 1. Save 2. Wait 6 seconds 3. Try undo
- **Expected**: Undo expired, weight remains saved
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_187: UNDO_DURATION = 5000ms constant
- **Pre-conditions**: Source review
- **Steps**: 1. Verify constant
- **Expected**: UNDO_DURATION = 5000
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_188: Undo new entry → removeWeightEntry called
- **Pre-conditions**: No previous todayEntry, saved new, undo
- **Steps**: 1. Save new entry 2. Undo
- **Expected**: removeWeightEntry called (entry deleted)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_189: Undo updated entry → revert to previous weight
- **Pre-conditions**: Previous todayEntry = 70.0, saved 70.5, undo
- **Steps**: 1. Save update 2. Undo
- **Expected**: Weight reverted to 70.0 (updateWeightEntry with old value)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_190: Save button styling: bg-emerald-500 text-white rounded-xl
- **Pre-conditions**: WeightQuickLog open
- **Steps**: 1. Inspect save-btn classes
- **Expected**: bg-emerald-500, text-white, rounded-xl, font-bold, w-full
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_191: Save button padding: px-6 py-3.5
- **Pre-conditions**: WeightQuickLog open
- **Steps**: 1. Inspect save-btn padding
- **Expected**: padding phù hợp (px-6 py-3.5)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_192: Save button hover: hover:bg-emerald-600
- **Pre-conditions**: Mouse hover save button
- **Steps**: 1. Hover save-btn
- **Expected**: Background changes to emerald-600
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_193: Save button active: active:scale-[0.98]
- **Pre-conditions**: Click and hold save button
- **Steps**: 1. Press save-btn
- **Expected**: Button scales down slightly (0.98)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_194: Save button transition-all
- **Pre-conditions**: Save button interaction
- **Steps**: 1. Inspect transition
- **Expected**: transition: all (smooth state changes)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_195: Save: weight display shows saved value correctly
- **Pre-conditions**: inputValue = 67.3, save
- **Steps**: 1. Save 2. Reopen WeightQuickLog
- **Expected**: Display shows 67.3 (today's entry now exists)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_196: Double tap save → only 1 save operation
- **Pre-conditions**: inputValue = 70.0
- **Steps**: 1. Double tap save-btn nhanh
- **Expected**: addWeightEntry/updateWeightEntry gọi 1 lần
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_QAW_197: Save disabled button: click does nothing
- **Pre-conditions**: inputValue = 0 (disabled)
- **Steps**: 1. Click save-btn
- **Expected**: Không gọi save function, không close
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_198: Save at MIN_WEIGHT boundary: 30.0
- **Pre-conditions**: inputValue = 30.0
- **Steps**: 1. Tap save
- **Expected**: Save successful, entry = 30.0
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_QAW_199: Save at MAX_WEIGHT boundary: 300.0
- **Pre-conditions**: inputValue = 300.0
- **Steps**: 1. Tap save
- **Expected**: Save successful, entry = 300.0
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_QAW_200: Toast notification auto-dismiss after 5s
- **Pre-conditions**: Save → toast visible
- **Steps**: 1. Save 2. Wait 5+ seconds
- **Expected**: Toast auto-dismiss sau ~5s
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_201: Info row: yesterday weight hiển thị
- **Pre-conditions**: yesterdayEntry = 69.5
- **Steps**: 1. Observe yesterday-info
- **Expected**: Hiển thị 'Hôm qua: 69.5 kg'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_202: Info row: no yesterday → yesterday-info ẩn
- **Pre-conditions**: No yesterdayEntry
- **Steps**: 1. Query yesterday-info
- **Expected**: yesterday-info không hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_203: Info row: 7-day moving average hiển thị
- **Pre-conditions**: ≥ 3 entries trong 7 ngày
- **Steps**: 1. Observe moving-average
- **Expected**: Hiển thị 'TB 7 ngày: XX.X kg'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_204: Info row: < 3 entries → moving average ẩn
- **Pre-conditions**: < 3 entries trong 7 ngày
- **Steps**: 1. Query moving-average
- **Expected**: moving-average không hiển thị (null)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_205: Info row: moving average = round1 (1 decimal)
- **Pre-conditions**: movingAvg = 69.456
- **Steps**: 1. Observe moving-average text
- **Expected**: Hiển thị '69.5' (round1)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_206: Info row: trend ↑ (weight going up)
- **Pre-conditions**: movingAvg > yesterdayWeight
- **Steps**: 1. Observe trend-indicator
- **Expected**: symbol = '↑', class = 'text-red-500'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_207: Info row: trend ↓ (weight going down)
- **Pre-conditions**: movingAvg < yesterdayWeight
- **Steps**: 1. Observe trend-indicator
- **Expected**: symbol = '↓', class = 'text-emerald-500'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_208: Info row: trend → (stable)
- **Pre-conditions**: movingAvg = yesterdayWeight
- **Steps**: 1. Observe trend-indicator
- **Expected**: symbol = '→', class = 'text-slate-400'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_209: Info row: trend ẩn khi no data
- **Pre-conditions**: No movingAvg or no yesterday
- **Steps**: 1. Query trend-indicator
- **Expected**: Trend indicator không hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_210: Info row: tabular-nums applied
- **Pre-conditions**: Info row visible
- **Steps**: 1. Inspect fontVariantNumeric
- **Expected**: style fontVariantNumeric = 'tabular-nums'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_211: Info row: text-sm text-slate-500
- **Pre-conditions**: Info row visible
- **Steps**: 1. Inspect font and color
- **Expected**: font-size: 14px, color: slate-500
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_212: Info row: flex-wrap for narrow screens
- **Pre-conditions**: Screen width 320px
- **Steps**: 1. Inspect info row wrapping
- **Expected**: Items wrap to next line nếu cần
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_213: Trend indicator aria-label
- **Pre-conditions**: Trend visible
- **Steps**: 1. Inspect trend aria-label
- **Expected**: aria-label = 'Xu hướng cân nặng' hoặc tương tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_214: MOVING_AVG_DAYS = 7 constant
- **Pre-conditions**: Source review
- **Steps**: 1. Verify constant
- **Expected**: MOVING_AVG_DAYS = 7
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_215: Moving average calculation correct
- **Pre-conditions**: 7 entries: [70, 69, 71, 70, 69, 71, 70]
- **Steps**: 1. Calculate expected avg 2. Compare with display
- **Expected**: movingAvg = 70.0 (sum/count)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_216: Trend calculation: movingAvg 70.5, yesterday 70.0 → ↑
- **Pre-conditions**: movingAvg = 70.5, yesterdayWeight = 70.0
- **Steps**: 1. Observe trend
- **Expected**: ↑ (moving avg > yesterday = weight trending up)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_217: Trend calculation: movingAvg 69.5, yesterday 70.0 → ↓
- **Pre-conditions**: movingAvg = 69.5, yesterdayWeight = 70.0
- **Steps**: 1. Observe trend
- **Expected**: ↓ (moving avg < yesterday = weight trending down)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_218: Info row: all 3 pieces visible together
- **Pre-conditions**: yesterdayEntry + ≥3 entries + trend
- **Steps**: 1. Observe info-row
- **Expected**: All 3 visible: yesterday, average, trend
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_219: Info row: gap spacing between items
- **Pre-conditions**: Multiple items visible
- **Steps**: 1. Inspect gap
- **Expected**: gap-x-4 gap-y-1 spacing
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_220: Info row: dark mode text color
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect info row text
- **Expected**: dark:text-slate-400 hoặc readable variant
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_221: Dark mode: QuickActionsBar buttons
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect all 3 buttons
- **Expected**: Secondary: dark:bg-slate-800, dark:border-slate-600, dark:text-emerald-400
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_222: Dark mode: primary button unchanged (emerald)
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect center button
- **Expected**: bg-emerald-500 maintained (primary same in dark)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_223: Dark mode: shadow-glow on primary button
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect boxShadow
- **Expected**: shadow-glow visible/appropriate on dark
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_224: Dark mode: WeightQuickLog bg
- **Pre-conditions**: Dark mode ON, WeightQuickLog open
- **Steps**: 1. Inspect bottom sheet bg
- **Expected**: dark:bg-slate-800
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_225: Dark mode: weight display text
- **Pre-conditions**: Dark mode ON, WeightQuickLog open
- **Steps**: 1. Inspect weight-display color
- **Expected**: Text sáng trên dark bg
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_226: Dark mode: stepper buttons
- **Pre-conditions**: Dark mode ON, WeightQuickLog open
- **Steps**: 1. Inspect stepper buttons
- **Expected**: Dark variant bg, text visible
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_227: Dark mode: save button
- **Pre-conditions**: Dark mode ON, WeightQuickLog open
- **Steps**: 1. Inspect save-btn
- **Expected**: bg-emerald-500 (same in dark), text-white
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_228: Dark mode: close button
- **Pre-conditions**: Dark mode ON, WeightQuickLog open
- **Steps**: 1. Inspect close-btn
- **Expected**: Dark variant, X icon visible
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_229: Dark mode: info row text readable
- **Pre-conditions**: Dark mode ON, info row visible
- **Steps**: 1. Check contrast
- **Expected**: All info text ≥ 4.5:1 contrast
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_230: Dark mode: chip active state
- **Pre-conditions**: Dark mode ON, chip selected
- **Steps**: 1. Inspect active chip
- **Expected**: dark:border-emerald-400 dark:bg-emerald-900 variant
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_231: Dark mode: chip inactive state
- **Pre-conditions**: Dark mode ON, chip unselected
- **Steps**: 1. Inspect inactive chip
- **Expected**: dark:border-slate-600 dark:bg-slate-700 variant
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_232: Dark mode: ModalBackdrop opacity
- **Pre-conditions**: Dark mode ON, WeightQuickLog open
- **Steps**: 1. Inspect backdrop
- **Expected**: Backdrop appropriate opacity on dark
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_233: Dark mode: trend indicator colors visible
- **Pre-conditions**: Dark mode ON, trend visible
- **Steps**: 1. Inspect trend colors
- **Expected**: ↑ red-400, ↓ emerald-400, → slate-500 (dark variants)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_234: Dark mode: header Scale icon
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect Scale icon
- **Expected**: text-emerald-400 (dark variant) visible
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_235: Dark mode: 'kg' label text
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect kg label
- **Expected**: text-slate-400 (dark variant)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_236: Dark mode: disabled button styling
- **Pre-conditions**: Dark mode ON, decrement at MIN
- **Steps**: 1. Inspect disabled button
- **Expected**: Disabled dark variant visible (opacity/color)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_237: Light → Dark toggle: weight value preserved
- **Pre-conditions**: Toggle dark mode with WeightQuickLog open
- **Steps**: 1. Set weight 70.5 2. Toggle dark mode
- **Expected**: Weight = 70.5 still displayed
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_238: Dark mode: toast notification styling
- **Pre-conditions**: Dark mode ON, save → toast
- **Steps**: 1. Inspect toast
- **Expected**: Toast dark variant, text readable, undo button visible
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_239: Dark mode: weight display font
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect weight-display
- **Expected**: text-4xl font-bold maintained, tabular-nums
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_240: Dark mode: QuickActionsBar nav bg
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect nav background
- **Expected**: Appropriate dark background for QuickActionsBar
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_241: All buttons have accessible names
- **Pre-conditions**: QuickActionsBar render
- **Steps**: 1. Inspect aria-labels
- **Expected**: All 3 buttons have aria-label matching action
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_242: Keyboard navigation: Tab through 3 buttons
- **Pre-conditions**: Keyboard focus
- **Steps**: 1. Tab through QuickActionsBar
- **Expected**: Focus moves left → center → right in tab order
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_243: Enter key activates focused button
- **Pre-conditions**: Focus on center button
- **Steps**: 1. Press Enter
- **Expected**: Action triggered (same as click)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_244: Space key activates focused button
- **Pre-conditions**: Focus on center button
- **Steps**: 1. Press Space
- **Expected**: Action triggered (same as click)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_245: WeightQuickLog: keyboard stepper (Arrow Up/Down)
- **Pre-conditions**: WeightQuickLog open, focused
- **Steps**: 1. Press Arrow Up
- **Expected**: Increment weight (if keyboard stepper supported)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_246: WeightQuickLog: Escape key closes
- **Pre-conditions**: WeightQuickLog open
- **Steps**: 1. Press Escape
- **Expected**: Bottom sheet closes
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_247: WeightQuickLog: focus trap active
- **Pre-conditions**: WeightQuickLog open
- **Steps**: 1. Tab repeatedly
- **Expected**: Focus cycles within bottom sheet, doesn't escape
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_248: WeightQuickLog: focus returns after close
- **Pre-conditions**: WeightQuickLog close
- **Steps**: 1. Close bottom sheet
- **Expected**: Focus returns to trigger element
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_249: Screen reader: QuickActionsBar navigation landmark
- **Pre-conditions**: Screen reader ON
- **Steps**: 1. Navigate landmarks
- **Expected**: QuickActionsBar announced as navigation
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_250: Screen reader: weight value announced
- **Pre-conditions**: Screen reader ON, WeightQuickLog open
- **Steps**: 1. Navigate to weight display
- **Expected**: Announces '70.0 kg' hoặc tương tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_251: Touch target ≥ 44px cho tất cả buttons
- **Pre-conditions**: All buttons
- **Steps**: 1. Measure hit areas
- **Expected**: All buttons ≥ 44×44px touch target
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_QAW_252: Component unmount cleanup: no memory leak
- **Pre-conditions**: Mount/unmount 10 times
- **Steps**: 1. Mount/unmount 10 lần 2. Check heap
- **Expected**: Heap stable (long press intervals, undo timers cleaned)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_253: Long press cleanup on unmount
- **Pre-conditions**: Long pressing, component unmounts
- **Steps**: 1. Start long press 2. Close bottom sheet
- **Expected**: Intervals cleared, no orphan timers
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_254: Undo timer cleanup on unmount
- **Pre-conditions**: Save → undo timer active → unmount
- **Steps**: 1. Save 2. Unmount before 5s
- **Expected**: Timer cleared, no state update on unmounted component
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_255: ActionButton wrapped in React.memo
- **Pre-conditions**: Source review
- **Steps**: 1. Check ActionButton definition
- **Expected**: React.memo wrapper present
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_QAW_256: QuickActionsBar wrapped in React.memo
- **Pre-conditions**: Source review
- **Steps**: 1. Check QuickActionsBar definition
- **Expected**: React.memo wrapper present
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_QAW_257: WeightQuickLog wrapped in React.memo
- **Pre-conditions**: Source review
- **Steps**: 1. Check WeightQuickLog definition
- **Expected**: React.memo wrapper with displayName set
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_QAW_258: Responsive: 320px width QuickActionsBar
- **Pre-conditions**: Screen 320px
- **Steps**: 1. Inspect layout
- **Expected**: 3 buttons fit, labels visible, no overflow
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_259: Responsive: 768px width WeightQuickLog
- **Pre-conditions**: Screen 768px, WeightQuickLog open
- **Steps**: 1. Inspect layout
- **Expected**: Centered, sm:max-w-md, sm:rounded-3xl
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_QAW_260: WeightQuickLog: weight display '—' khi inputValue = 0
- **Pre-conditions**: inputValue = 0
- **Steps**: 1. Observe weight-display
- **Expected**: Display = '—' (dash, not '0')
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

---

## Đề xuất Cải tiến

### Đề xuất 1: Haptic Feedback cho Stepper
- **Vấn đề hiện tại**: Stepper ±0.1kg không có tactile feedback trên mobile.
- **Giải pháp đề xuất**: Thêm Vibration API (10ms pulse) cho mỗi step và stronger pulse khi đạt round number (70.0, 75.0).
- **Lý do chi tiết**: Haptic feedback tăng precision cho fine-grained input. Apple HIG và Material Design đều khuyến nghị cho steppers.
- **Phần trăm cải thiện**: Input accuracy +20%, User satisfaction +25%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 2: Weight Graph Inline Preview
- **Vấn đề hiện tại**: Chỉ hiển thị yesterday + moving average, không thấy trend visual.
- **Giải pháp đề xuất**: Thêm sparkline graph (30 ngày) phía trên save button.
- **Lý do chi tiết**: Visual trend là motivation driver lớn cho weight tracking. Compact sparkline phù hợp bottom sheet.
- **Phần trăm cải thiện**: User engagement +30%, Retention +20%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 3: Quick Actions Customization
- **Vấn đề hiện tại**: Actions mapping là fixed logic, user không thể customize.
- **Giải pháp đề xuất**: Cho phép user long-press QuickActionsBar → rearrange/swap actions.
- **Lý do chi tiết**: Power users có workflow riêng. Customizable shortcuts tăng efficiency.
- **Phần trăm cải thiện**: Power user satisfaction +35%, Task speed +20%
- **Mức độ ưu tiên**: Low | **Effort**: L
