# Scenario 28: Cardio Logging

**Version:** 2.0  
**Date:** 2026-03-26  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Cardio Logging là scenario bao quát toàn bộ luồng ghi nhận bài tập cardio trong module Fitness. CardioLogger mở dạng full-screen overlay (z-50) khi user chọn chế độ Cardio trong tab "Tập luyện". Component hỗ trợ 7 loại cardio: running (🏃), cycling (🚴), swimming (🏊), hiit (⚡), walking (🚶), elliptical (🏋️), rowing (🚣), mỗi loại hiển thị dưới dạng pill button với emoji.

Hệ thống cung cấp 2 chế độ nhập thời gian: Stopwatch (đồng hồ bấm giờ real-time với Start/Pause/Stop) và Manual (nhập số phút thủ công). Header hiển thị elapsed timer riêng biệt chạy liên tục từ lúc mở component. Trường Distance (km) chỉ hiển thị cho 3 loại: running, cycling, swimming (DISTANCE_TYPES). Intensity selector có 3 mức: low/moderate/high, mặc định moderate. Calorie estimation tự động tính dựa trên duration, intensity, và cân nặng từ healthProfileStore.

Khi save, hệ thống tạo Workout + WorkoutSet objects và lưu vào fitnessStore. Tất cả input số (duration, distance, heart rate) validate với Math.max(0, value) để không cho giá trị âm. Distance và heart rate có thể để trống (undefined).

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| CardioLogger | CardioLogger.tsx | Component chính cho logging bài tập cardio |
| useFitnessStore | fitnessStore.ts | Zustand store: addWorkout, addWorkoutSet |
| useHealthProfileStore | healthProfileStore.ts | Zustand store: weightKg cho tính calorie |
| useTranslation | i18n | Hook i18n cho đa ngôn ngữ |

## Luồng nghiệp vụ

1. Tab "Tập luyện" → chọn mode "Cardio" → CardioLogger mở full-screen overlay
2. Header elapsed timer bắt đầu đếm liên tục (interval 1s)
3. User chọn loại cardio (7 options, default = running)
4. Chọn chế độ timer: Stopwatch hoặc Manual
5. Stopwatch mode: Start → bấm giờ → Pause (giữ time) → Stop (reset về 0)
6. Manual mode: nhập số phút trực tiếp
7. (Nếu running/cycling/swimming) Nhập distance (km)
8. Nhập heart rate (optional)
9. Chọn intensity: low/moderate/high
10. Calorie estimation hiển thị tự động
11. Click "Save" → tạo Workout + WorkoutSet → lưu store → onComplete callback
12. Click "Back" → onBack callback → quay về FitnessTab

## Quy tắc nghiệp vụ

1. CARDIO_TYPES = ['running','cycling','swimming','hiit','walking','elliptical','rowing'] (7 loại)
2. DISTANCE_TYPES = ['running','cycling','swimming'] (3 loại có distance input)
3. INTENSITY_OPTIONS = ['low','moderate','high'] (default = 'moderate')
4. Default selectedType = 'running'
5. Default isStopwatchMode = true
6. Stopwatch: Start → stopwatchRunning=true, Pause → stopwatchRunning=false (giữ time), Stop → running=false AND seconds=0
7. Manual duration: input type number, Math.max(0, value) validation
8. Distance: chỉ hiển thị khi selectedType ∈ DISTANCE_TYPES, Math.max(0, value), cho phép undefined
9. Heart rate: optional, Math.max(0, value), cho phép undefined
10. durationMin = isStopwatchMode ? Math.floor(stopwatchSeconds/60) : manualDuration
11. Header elapsed timer: chạy liên tục, KHÔNG reset khi chuyển mode
12. Calorie estimation dựa trên durationMin, intensity, weightKg
13. durationMin > 0 check trước khi include trong saved data
14. Distance/heart rate can be cleared (set to undefined) khi input empty

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_CDL_001 | CardioLogger mở full-screen overlay | Positive | P0 |
| TC_CDL_002 | Header elapsed timer bắt đầu đếm | Positive | P0 |
| TC_CDL_003 | Hiển thị 7 cardio type buttons | Positive | P0 |
| TC_CDL_004 | Default type = running | Positive | P1 |
| TC_CDL_005 | Chọn cardio type khác | Positive | P1 |
| TC_CDL_006 | Stopwatch mode: Start bắt đầu đếm | Positive | P0 |
| TC_CDL_007 | Stopwatch mode: Pause giữ time | Positive | P0 |
| TC_CDL_008 | Stopwatch mode: Stop reset về 0 | Positive | P0 |
| TC_CDL_009 | Manual mode: nhập duration | Positive | P0 |
| TC_CDL_010 | Toggle Stopwatch ↔ Manual mode | Positive | P1 |
| TC_CDL_011 | Distance field hiển thị cho running | Positive | P1 |
| TC_CDL_012 | Distance field hiển thị cho cycling | Positive | P1 |
| TC_CDL_013 | Distance field hiển thị cho swimming | Positive | P1 |
| TC_CDL_014 | Distance field ẩn cho hiit | Negative | P1 |
| TC_CDL_015 | Distance field ẩn cho walking | Negative | P1 |
| TC_CDL_016 | Distance field ẩn cho elliptical | Negative | P1 |
| TC_CDL_017 | Distance field ẩn cho rowing | Negative | P1 |
| TC_CDL_018 | Heart rate input | Positive | P1 |
| TC_CDL_019 | Intensity selector: 3 options | Positive | P1 |
| TC_CDL_020 | Default intensity = moderate | Positive | P1 |
| TC_CDL_021 | Calorie estimation hiển thị | Positive | P1 |
| TC_CDL_022 | Calorie = 0 khi duration = 0 | Boundary | P1 |
| TC_CDL_023 | Save tạo Workout + WorkoutSet | Positive | P0 |
| TC_CDL_024 | Save → onComplete callback | Positive | P0 |
| TC_CDL_025 | Back button → onBack callback | Positive | P1 |
| TC_CDL_026 | Stopwatch Start → Pause → Resume | Positive | P1 |
| TC_CDL_027 | Stopwatch Stop resets seconds | Positive | P1 |
| TC_CDL_028 | Manual duration: negative → 0 | Negative | P1 |
| TC_CDL_029 | Distance: negative → 0 | Negative | P1 |
| TC_CDL_030 | Heart rate: optional (undefined) | Positive | P2 |
| TC_CDL_031 | Distance: clear → undefined | Positive | P2 |
| TC_CDL_032 | Heart rate: clear → undefined | Positive | P2 |
| TC_CDL_033 | Elapsed timer independent của stopwatch | Positive | P1 |
| TC_CDL_034 | Elapsed timer format MM:SS | Positive | P2 |
| TC_CDL_035 | durationMin calculation: stopwatch mode | Positive | P1 |
| TC_CDL_036 | durationMin calculation: manual mode | Positive | P1 |
| TC_CDL_037 | Calorie estimation thay đổi theo type | Positive | P2 |
| TC_CDL_038 | Calorie estimation thay đổi theo intensity | Positive | P2 |
| TC_CDL_039 | Calorie estimation thay đổi theo duration | Positive | P2 |
| TC_CDL_040 | Save: durationMin > 0 check | Positive | P1 |
| TC_CDL_041 | Save: estimatedCalories > 0 check | Positive | P2 |
| TC_CDL_042 | Stopwatch display format MM:SS | Positive | P2 |
| TC_CDL_043 | data-testid attributes đúng | Positive | P2 |
| TC_CDL_044 | Dark mode: CardioLogger colors | Positive | P2 |
| TC_CDL_045 | Dark mode: input fields readable | Positive | P2 |
| TC_CDL_046 | i18n: labels cập nhật khi đổi ngôn ngữ | Positive | P2 |
| TC_CDL_047 | Cardio type pill horizontal scroll | Positive | P2 |
| TC_CDL_048 | Intensity button click responsive | Positive | P2 |
| TC_CDL_049 | Rapid type switching không crash | Edge | P2 |
| TC_CDL_050 | Save với tất cả fields undefined | Edge | P2 |
| TC_CDL_051 | Header finish button gọi handleSave | Positive | P1 |
| TC_CDL_052 | Bottom save button gọi handleSave | Positive | P1 |
| TC_CDL_053 | Workout ID unique | Positive | P2 |
| TC_CDL_054 | WorkoutSet ID unique | Positive | P2 |
| TC_CDL_055 | Memory: không leak sau extended session | Edge | P3 |
| TC_CDL_056 | Select cardio type Chạy bộ (running) → pill active | Positive | P1 |
| TC_CDL_057 | Select cardio type Đạp xe (cycling) → pill active | Positive | P1 |
| TC_CDL_058 | Select cardio type Bơi lội (swimming) → pill active | Positive | P1 |
| TC_CDL_059 | Select cardio type HIIT (hiit) → pill active | Positive | P1 |
| TC_CDL_060 | Select cardio type Đi bộ (walking) → pill active | Positive | P1 |
| TC_CDL_061 | Select cardio type Elliptical (elliptical) → pill active | Positive | P1 |
| TC_CDL_062 | Select cardio type Rowing (rowing) → pill active | Positive | P1 |
| TC_CDL_063 | Select Chạy bộ → emoji 🏃 hiển thị | Positive | P3 |
| TC_CDL_064 | Select Đạp xe → emoji 🚴 hiển thị | Positive | P3 |
| TC_CDL_065 | Select Bơi lội → emoji 🏊 hiển thị | Positive | P3 |
| TC_CDL_066 | Select HIIT → emoji ⚡ hiển thị | Positive | P3 |
| TC_CDL_067 | Select Đi bộ → emoji 🚶 hiển thị | Positive | P3 |
| TC_CDL_068 | Select Elliptical → emoji 🏋️ hiển thị | Positive | P3 |
| TC_CDL_069 | Select Rowing → emoji 🚣 hiển thị | Positive | P3 |
| TC_CDL_070 | Switch running → cycling → running | Positive | P1 |
| TC_CDL_071 | Switch running → hiit → distance field ẩn | Positive | P0 |
| TC_CDL_072 | Switch cycling → walking → distance ẩn | Positive | P1 |
| TC_CDL_073 | Switch swimming → elliptical → distance ẩn | Positive | P1 |
| TC_CDL_074 | Switch hiit → running → distance xuất hiện | Positive | P1 |
| TC_CDL_075 | Switch walking → cycling → distance xuất hiện | Positive | P2 |
| TC_CDL_076 | Rapid type switching 10 lần | Edge | P2 |
| TC_CDL_077 | Switch type khi stopwatch đang chạy → timer continues | Positive | P1 |
| TC_CDL_078 | Switch type với manual duration set → preserved | Edge | P2 |
| TC_CDL_079 | Switch type → distance preserved hay reset | Edge | P2 |
| TC_CDL_080 | Switch type → heart rate preserved | Positive | P2 |
| TC_CDL_081 | Switch type → intensity preserved | Positive | P2 |
| TC_CDL_082 | Switch type → calorie re-calculated | Positive | P1 |
| TC_CDL_083 | Start: seconds bắt đầu tăng | Positive | P0 |
| TC_CDL_084 | Start: display thay đổi từ 00:00 | Positive | P1 |
| TC_CDL_085 | Pause: seconds đóng băng | Positive | P0 |
| TC_CDL_086 | Pause: display frozen | Positive | P1 |
| TC_CDL_087 | Resume sau pause: tiếp tục từ giá trị paused | Positive | P0 |
| TC_CDL_088 | Stop: seconds reset về 0 | Positive | P0 |
| TC_CDL_089 | Stop: display hiển thị 00:00 | Positive | P1 |
| TC_CDL_090 | Stop khi not running → vẫn reset | Edge | P2 |
| TC_CDL_091 | Pause khi not running → no effect | Edge | P2 |
| TC_CDL_092 | Start → chờ 5s → display "00:05" | Positive | P1 |
| TC_CDL_093 | Start → chờ 60s → display "01:00" | Positive | P2 |
| TC_CDL_094 | Start → chờ 90s → display "01:30" | Positive | P2 |
| TC_CDL_095 | Start → Pause → Start → continues | Positive | P1 |
| TC_CDL_096 | Start → Pause → Stop → reset to 0 | Positive | P1 |
| TC_CDL_097 | Start → Stop → Start → counts from 0 | Positive | P1 |
| TC_CDL_098 | Duration calculation: 59s → 0 min | Boundary | P1 |
| TC_CDL_099 | Duration calculation: 60s → 1 min | Boundary | P1 |
| TC_CDL_100 | Duration calculation: 90s → 1 min | Boundary | P2 |
| TC_CDL_101 | Duration calculation: 120s → 2 min | Boundary | P2 |
| TC_CDL_102 | Duration calculation: 0s → 0 min | Boundary | P2 |
| TC_CDL_103 | Button state: not running → show Start | Positive | P1 |
| TC_CDL_104 | Button state: running → show Pause | Positive | P1 |
| TC_CDL_105 | Stop button luôn visible | Positive | P2 |
| TC_CDL_106 | Start button styling: emerald bg | Positive | P3 |
| TC_CDL_107 | Pause button styling: amber bg | Positive | P3 |
| TC_CDL_108 | Stop button styling: red bg | Positive | P3 |
| TC_CDL_109 | Stopwatch display font: mono, 3xl, bold | Positive | P3 |
| TC_CDL_110 | Stopwatch panel data-testid present | Positive | P3 |
| TC_CDL_111 | Manual mode: nhập 0 → duration = 0 | Boundary | P2 |
| TC_CDL_112 | Manual mode: nhập 1 → duration = 1 | Positive | P2 |
| TC_CDL_113 | Manual mode: nhập 30 → duration = 30 | Positive | P1 |
| TC_CDL_114 | Manual mode: nhập 60 → duration = 60 | Positive | P2 |
| TC_CDL_115 | Manual mode: nhập 120 → duration = 120 | Positive | P2 |
| TC_CDL_116 | Manual mode: nhập 180 → duration = 180 | Boundary | P3 |
| TC_CDL_117 | Manual mode: nhập negative (-5) → clamped to 0 | Negative | P1 |
| TC_CDL_118 | Manual mode: nhập decimal 30.5 | Edge | P3 |
| TC_CDL_119 | Manual mode: nhập very large 9999 | Boundary | P3 |
| TC_CDL_120 | Manual mode: clear field → duration = 0 | Edge | P2 |
| TC_CDL_121 | Manual mode: input type="number" | Positive | P3 |
| TC_CDL_122 | Manual mode: không có start/pause/stop buttons | Negative | P1 |
| TC_CDL_123 | Manual mode: input centered, lg font | Positive | P3 |
| TC_CDL_124 | Switch sang manual → stopwatch irrelevant cho duration | Positive | P1 |
| TC_CDL_125 | Switch sang stopwatch → manual irrelevant cho duration | Positive | P1 |
| TC_CDL_126 | Default là stopwatch mode | Positive | P0 |
| TC_CDL_127 | Click manual button → switch sang manual mode | Positive | P0 |
| TC_CDL_128 | Click stopwatch button → switch back | Positive | P1 |
| TC_CDL_129 | Stopwatch running → switch manual → stopwatch vẫn ticking | Edge | P1 |
| TC_CDL_130 | Manual có value → switch stopwatch → manual ignored | Positive | P1 |
| TC_CDL_131 | Stopwatch mode button: active styling emerald | Positive | P3 |
| TC_CDL_132 | Manual mode button: active styling emerald | Positive | P3 |
| TC_CDL_133 | Inactive mode button: slate styling | Positive | P3 |
| TC_CDL_134 | Switch modes nhanh 10 lần | Edge | P2 |
| TC_CDL_135 | Mode buttons data-testid present | Positive | P3 |
| TC_CDL_136 | Switch manual → stopwatch: stopwatch bắt đầu từ last value | Edge | P2 |
| TC_CDL_137 | Switch với running stopwatch → stopwatch vẫn runs | Edge | P2 |
| TC_CDL_138 | durationMin reflects active mode correctly | Positive | P1 |
| TC_CDL_139 | Distance visible cho running | Positive | P1 |
| TC_CDL_140 | Distance visible cho cycling | Positive | P1 |
| TC_CDL_141 | Distance visible cho swimming | Positive | P1 |
| TC_CDL_142 | Distance ẩn cho hiit | Negative | P1 |
| TC_CDL_143 | Distance ẩn cho walking | Negative | P1 |
| TC_CDL_144 | Distance ẩn cho elliptical | Negative | P1 |
| TC_CDL_145 | Distance ẩn cho rowing | Negative | P1 |
| TC_CDL_146 | Distance: nhập 0 | Boundary | P2 |
| TC_CDL_147 | Distance: nhập 0.1 (short) | Positive | P2 |
| TC_CDL_148 | Distance: nhập 5.0 (standard) | Positive | P1 |
| TC_CDL_149 | Distance: nhập 10.0 (long run) | Positive | P2 |
| TC_CDL_150 | Distance: nhập 21.1 (half marathon) | Positive | P2 |
| TC_CDL_151 | Distance: nhập 42.195 (full marathon) | Boundary | P3 |
| TC_CDL_152 | Distance: nhập negative → Math.max(0) | Negative | P1 |
| TC_CDL_153 | Distance: clear → undefined | Positive | P1 |
| TC_CDL_154 | Distance input step=0.1 | Positive | P3 |
| TC_CDL_155 | Distance input min=0 | Positive | P3 |
| TC_CDL_156 | Heart rate: nhập 60 bpm (resting) | Positive | P2 |
| TC_CDL_157 | Heart rate: nhập 80 bpm (light) | Positive | P2 |
| TC_CDL_158 | Heart rate: nhập 120 bpm (moderate) | Positive | P2 |
| TC_CDL_159 | Heart rate: nhập 160 bpm (vigorous) | Positive | P2 |
| TC_CDL_160 | Heart rate: nhập 180 bpm (max effort) | Positive | P2 |
| TC_CDL_161 | Heart rate: nhập 200 bpm (extreme) | Positive | P3 |
| TC_CDL_162 | Heart rate: nhập 220 bpm (theoretical max) | Boundary | P3 |
| TC_CDL_163 | Heart rate: nhập 40 bpm (very low boundary) | Boundary | P2 |
| TC_CDL_164 | Heart rate: nhập 0 → accepted | Boundary | P2 |
| TC_CDL_165 | Heart rate: nhập negative → Math.max(0) = 0 | Negative | P1 |
| TC_CDL_166 | Heart rate: clear → undefined | Positive | P1 |
| TC_CDL_167 | Heart rate input type="number" | Positive | P3 |
| TC_CDL_168 | Heart rate: optional (save without it) | Positive | P1 |
| TC_CDL_169 | Heart rate preserved khi switch type | Positive | P2 |
| TC_CDL_170 | Heart rate section luôn visible | Positive | P2 |
| TC_CDL_171 | Intensity: select low | Positive | P1 |
| TC_CDL_172 | Intensity: select moderate (default) | Positive | P1 |
| TC_CDL_173 | Intensity: select high | Positive | P1 |
| TC_CDL_174 | Intensity: switch low → high | Positive | P2 |
| TC_CDL_175 | Intensity: switch high → moderate | Positive | P2 |
| TC_CDL_176 | Intensity: switch moderate → low → moderate | Positive | P3 |
| TC_CDL_177 | Intensity affects calorie estimation | Positive | P0 |
| TC_CDL_178 | Low intensity: lowest calorie burn | Positive | P2 |
| TC_CDL_179 | High intensity: highest calorie burn | Positive | P2 |
| TC_CDL_180 | Intensity buttons styling: selected=emerald, unselected=slate | Positive | P3 |
| TC_CDL_181 | Intensity data-testid cho mỗi button | Positive | P3 |
| TC_CDL_182 | Intensity section heading visible | Positive | P3 |
| TC_CDL_183 | Calories: duration 0 → 0 | Boundary | P0 |
| TC_CDL_184 | Calories: duration 30, moderate, running | Positive | P1 |
| TC_CDL_185 | Calories: duration 60, high, cycling | Positive | P2 |
| TC_CDL_186 | Calories: duration 1, low, walking | Positive | P2 |
| TC_CDL_187 | Change duration → calories update | Positive | P1 |
| TC_CDL_188 | Change type → calories update | Positive | P1 |
| TC_CDL_189 | Change intensity → calories update | Positive | P1 |
| TC_CDL_190 | Calorie preview section visible | Positive | P2 |
| TC_CDL_191 | Calorie value displayed | Positive | P2 |
| TC_CDL_192 | Calories với very long duration (180 min) | Boundary | P3 |
| TC_CDL_193 | Calories sử dụng weightKg từ healthProfileStore | Positive | P2 |
| TC_CDL_194 | Calories format: integer | Positive | P3 |
| TC_CDL_195 | Calorie section styling: emerald bg | Positive | P3 |
| TC_CDL_196 | Save với tất cả fields populated | Positive | P0 |
| TC_CDL_197 | Save với chỉ duration (stopwatch) | Positive | P1 |
| TC_CDL_198 | Save với chỉ duration (manual) | Positive | P1 |
| TC_CDL_199 | Save với duration + distance (running) | Positive | P1 |
| TC_CDL_200 | Save with partial fields (no heart rate) | Positive | P2 |
| TC_CDL_201 | Save với duration=0 → durationMin undefined | Edge | P1 |
| TC_CDL_202 | Save: Workout object tạo đúng | Positive | P1 |
| TC_CDL_203 | Save: WorkoutSet với cardio data đầy đủ | Positive | P1 |
| TC_CDL_204 | Save: onComplete callback triggered | Positive | P0 |
| TC_CDL_205 | Header finish button và bottom save button cùng hoạt động | Positive | P1 |
| TC_CDL_206 | Dark mode: header bg-emerald-600 | Positive | P2 |
| TC_CDL_207 | Dark mode: section cards bg-slate-800 | Positive | P2 |
| TC_CDL_208 | Dark mode: input fields contrast | Positive | P3 |
| TC_CDL_209 | Dark mode: calorie preview section | Positive | P3 |
| TC_CDL_210 | Dark mode: tất cả text readable | Positive | P2 |

---

## Chi tiết Test Cases

##### TC_CDL_001: CardioLogger mở full-screen overlay
- **Pre-conditions**: Tab "Tập luyện" active, chế độ Cardio selected
- **Steps**:
  1. Chuyển sang mode Cardio trong FitnessTab
- **Expected Result**: CardioLogger mở dạng fixed overlay toàn màn hình (fixed inset-0 z-50), header có Back button (ArrowLeft), elapsed timer, và Finish button (X icon)
- **Priority**: P0 | **Type**: Positive

##### TC_CDL_002: Header elapsed timer bắt đầu đếm
- **Pre-conditions**: CardioLogger vừa mở
- **Steps**:
  1. Quan sát timer trên header
  2. Chờ 5 giây
- **Expected Result**: Timer bắt đầu từ 00:00, tăng 1 giây mỗi giây (useEffect interval 1000ms), hiển thị format MM:SS
- **Priority**: P0 | **Type**: Positive

##### TC_CDL_003: Hiển thị 7 cardio type buttons
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Quan sát cardio type selector area
  2. Đếm số buttons
- **Expected Result**: 7 pill buttons hiển thị với emoji + tên: Running 🏃, Cycling 🚴, Swimming 🏊, HIIT ⚡, Walking 🚶, Elliptical 🏋️, Rowing 🚣
- **Priority**: P0 | **Type**: Positive

##### TC_CDL_004: Default type = running
- **Pre-conditions**: CardioLogger vừa mở
- **Steps**:
  1. Quan sát cardio type selector
- **Expected Result**: "Running" pill active (highlighted emerald), selectedType = 'running', distance field visible
- **Priority**: P1 | **Type**: Positive

##### TC_CDL_005: Chọn cardio type khác
- **Pre-conditions**: CardioLogger mở, selectedType = 'running'
- **Steps**:
  1. Click "Cycling" pill
- **Expected Result**: Cycling pill highlighted, Running deselected, selectedType = 'cycling', distance field vẫn visible (cycling ∈ DISTANCE_TYPES)
- **Priority**: P1 | **Type**: Positive

##### TC_CDL_006: Stopwatch mode: Start bắt đầu đếm
- **Pre-conditions**: CardioLogger mở, isStopwatchMode = true, stopwatchRunning = false
- **Steps**:
  1. Click nút "Start"
- **Expected Result**: stopwatchRunning = true, stopwatch timer bắt đầu đếm lên (interval 1s), display thay đổi từ 00:00 → 00:01 → ...
- **Priority**: P0 | **Type**: Positive

##### TC_CDL_007: Stopwatch mode: Pause giữ time
- **Pre-conditions**: Stopwatch đang chạy (stopwatchRunning = true, stopwatchSeconds = 45)
- **Steps**:
  1. Click nút "Pause"
- **Expected Result**: stopwatchRunning = false, stopwatchSeconds giữ nguyên = 45, display hiển thị 00:45 cố định, interval cleared
- **Priority**: P0 | **Type**: Positive

##### TC_CDL_008: Stopwatch mode: Stop reset về 0
- **Pre-conditions**: Stopwatch đang chạy hoặc đã pause, stopwatchSeconds > 0
- **Steps**:
  1. Click nút "Stop"
- **Expected Result**: stopwatchRunning = false AND stopwatchSeconds = 0, display reset về 00:00
- **Priority**: P0 | **Type**: Positive

##### TC_CDL_009: Manual mode: nhập duration
- **Pre-conditions**: isStopwatchMode = false (manual mode)
- **Steps**:
  1. Nhập "30" vào duration input
- **Expected Result**: manualDuration = 30, durationMin = 30, input hiển thị 30
- **Priority**: P0 | **Type**: Positive

##### TC_CDL_010: Toggle Stopwatch ↔ Manual mode
- **Pre-conditions**: CardioLogger mở, isStopwatchMode = true
- **Steps**:
  1. Click nút "Manual" mode
  2. Quan sát timer panel → manual input hiển thị
  3. Click nút "Stopwatch" mode
  4. Quan sát timer panel → stopwatch hiển thị
- **Expected Result**: Toggle giữa 2 modes, UI panel thay đổi tương ứng. Stopwatch panel có Start/Pause/Stop buttons. Manual panel có number input
- **Priority**: P1 | **Type**: Positive

##### TC_CDL_011: Distance field hiển thị cho running
- **Pre-conditions**: selectedType = 'running'
- **Steps**:
  1. Quan sát form fields
- **Expected Result**: Distance input (km) visible, step=0.1, label hiển thị đúng
- **Priority**: P1 | **Type**: Positive

##### TC_CDL_012: Distance field hiển thị cho cycling
- **Pre-conditions**: Chọn type = 'cycling'
- **Steps**:
  1. Click "Cycling"
  2. Quan sát form fields
- **Expected Result**: Distance input visible ('cycling' ∈ DISTANCE_TYPES)
- **Priority**: P1 | **Type**: Positive

##### TC_CDL_013: Distance field hiển thị cho swimming
- **Pre-conditions**: Chọn type = 'swimming'
- **Steps**:
  1. Click "Swimming"
  2. Quan sát form fields
- **Expected Result**: Distance input visible ('swimming' ∈ DISTANCE_TYPES)
- **Priority**: P1 | **Type**: Positive

##### TC_CDL_014: Distance field ẩn cho hiit
- **Pre-conditions**: Chọn type = 'hiit'
- **Steps**:
  1. Click "HIIT"
  2. Quan sát form fields
- **Expected Result**: Distance input KHÔNG hiển thị ('hiit' ∉ DISTANCE_TYPES), showDistance = false
- **Priority**: P1 | **Type**: Negative

##### TC_CDL_015: Distance field ẩn cho walking
- **Pre-conditions**: Chọn type = 'walking'
- **Steps**:
  1. Click "Walking"
  2. Quan sát form fields
- **Expected Result**: Distance input KHÔNG hiển thị ('walking' ∉ DISTANCE_TYPES)
- **Priority**: P1 | **Type**: Negative

##### TC_CDL_016: Distance field ẩn cho elliptical
- **Pre-conditions**: Chọn type = 'elliptical'
- **Steps**:
  1. Click "Elliptical"
  2. Quan sát form fields
- **Expected Result**: Distance input KHÔNG hiển thị ('elliptical' ∉ DISTANCE_TYPES)
- **Priority**: P1 | **Type**: Negative

##### TC_CDL_017: Distance field ẩn cho rowing
- **Pre-conditions**: Chọn type = 'rowing'
- **Steps**:
  1. Click "Rowing"
  2. Quan sát form fields
- **Expected Result**: Distance input KHÔNG hiển thị ('rowing' ∉ DISTANCE_TYPES)
- **Priority**: P1 | **Type**: Negative

##### TC_CDL_018: Heart rate input
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Nhập "150" vào heart rate input
- **Expected Result**: avgHeartRate = 150, input hiển thị 150
- **Priority**: P1 | **Type**: Positive

##### TC_CDL_019: Intensity selector: 3 options
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Quan sát intensity section
  2. Click "Low" → verify
  3. Click "High" → verify
  4. Click "Moderate" → verify
- **Expected Result**: 3 pill buttons (Low, Moderate, High), chỉ 1 active tại 1 thời điểm, style highlighted cho option selected
- **Priority**: P1 | **Type**: Positive

##### TC_CDL_020: Default intensity = moderate
- **Pre-conditions**: CardioLogger vừa mở
- **Steps**:
  1. Quan sát intensity selector
- **Expected Result**: "Moderate" pill highlighted (default), intensity = 'moderate'
- **Priority**: P1 | **Type**: Positive

##### TC_CDL_021: Calorie estimation hiển thị
- **Pre-conditions**: CardioLogger mở, duration > 0
- **Steps**:
  1. Chọn running, start stopwatch, chờ 60+ giây
  2. Quan sát calorie preview section
- **Expected Result**: Green box hiển thị estimated calories, giá trị > 0, cập nhật khi duration tăng
- **Priority**: P1 | **Type**: Positive

##### TC_CDL_022: Save workout thành công
- **Pre-conditions**: CardioLogger mở, duration > 0
- **Steps**:
  1. Chọn running, duration = 30 min (manual mode)
  2. Nhập distance = 5 km
  3. Nhập heart rate = 150
  4. Chọn intensity = moderate
  5. Click nút "Save" ở bottom
- **Expected Result**: Workout object tạo (type, duration, date), WorkoutSet tạo (distance, heartRate, intensity), addWorkout + addWorkoutSet gọi, onComplete callback triggered
- **Priority**: P0 | **Type**: Positive

##### TC_CDL_023: Back button → onBack callback
- **Pre-conditions**: CardioLogger đang mở
- **Steps**:
  1. Click nút Back (ArrowLeft) trên header
- **Expected Result**: onBack callback gọi, CardioLogger đóng, quay về FitnessTab
- **Priority**: P1 | **Type**: Positive

##### TC_CDL_024: Stopwatch display format MM:SS
- **Pre-conditions**: Stopwatch đang chạy
- **Steps**:
  1. Chờ 65 giây
  2. Quan sát stopwatch display
- **Expected Result**: Hiển thị "01:05" (format MM:SS), không "65" hay "1:5"
- **Priority**: P2 | **Type**: Positive

##### TC_CDL_025: Header timer format MM:SS
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Chờ 125 giây
  2. Quan sát header elapsed timer
- **Expected Result**: Hiển thị "02:05" (format MM:SS)
- **Priority**: P2 | **Type**: Positive

##### TC_CDL_026: Stopwatch Pause → resume giữ time
- **Pre-conditions**: Stopwatch đang chạy, stopwatchSeconds = 30
- **Steps**:
  1. Click Pause → display = 00:30
  2. Chờ 5 giây → display vẫn = 00:30
  3. Click Start → resume counting từ 00:30
  4. Chờ 3 giây → display = ~00:33
- **Expected Result**: Pause giữ nguyên time, resume tiếp tục từ chỗ dừng, không reset
- **Priority**: P1 | **Type**: Positive

##### TC_CDL_027: Duration min validation: Math.max(0)
- **Pre-conditions**: Manual mode active
- **Steps**:
  1. Nhập duration = "-5"
- **Expected Result**: manualDuration = 0 (Math.max(0, -5) = 0), input hiển thị 0
- **Priority**: P1 | **Type**: Boundary

##### TC_CDL_028: Distance validation: Math.max(0)
- **Pre-conditions**: Running selected (distance visible)
- **Steps**:
  1. Nhập distance = "-3"
- **Expected Result**: distanceKm = 0 (Math.max(0, -3) = 0), input hiển thị 0
- **Priority**: P1 | **Type**: Boundary

##### TC_CDL_029: Heart rate validation: Math.max(0)
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Nhập heart rate = "-10"
- **Expected Result**: avgHeartRate = 0 (Math.max(0, -10) = 0), input hiển thị 0
- **Priority**: P1 | **Type**: Boundary

##### TC_CDL_030: Duration input giá trị âm → clamp 0
- **Pre-conditions**: Manual mode active
- **Steps**:
  1. Nhập "-100" vào duration input
- **Expected Result**: Giá trị clamp về 0, không cho phép giá trị âm persist trong state
- **Priority**: P1 | **Type**: Negative

##### TC_CDL_031: Distance input giá trị âm → clamp 0
- **Pre-conditions**: Running selected, distance visible
- **Steps**:
  1. Nhập "-5.5" vào distance input
- **Expected Result**: Giá trị clamp về 0, distanceKm = 0
- **Priority**: P1 | **Type**: Negative

##### TC_CDL_032: Heart rate input giá trị âm → clamp 0
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Nhập "-80" vào heart rate input
- **Expected Result**: Giá trị clamp về 0, avgHeartRate = 0
- **Priority**: P1 | **Type**: Negative

##### TC_CDL_033: Distance clear → undefined
- **Pre-conditions**: distanceKm = 5.0
- **Steps**:
  1. Clear distance input (xóa hết text)
- **Expected Result**: distanceKm = undefined (input empty → set to undefined), field trống
- **Priority**: P2 | **Type**: Positive

##### TC_CDL_034: Heart rate clear → undefined
- **Pre-conditions**: avgHeartRate = 150
- **Steps**:
  1. Clear heart rate input
- **Expected Result**: avgHeartRate = undefined, field trống
- **Priority**: P2 | **Type**: Positive

##### TC_CDL_035: durationMin tính đúng từ stopwatch
- **Pre-conditions**: isStopwatchMode = true, stopwatchSeconds = 150 (2 min 30 sec)
- **Steps**:
  1. Kiểm tra durationMin value
- **Expected Result**: durationMin = Math.floor(150/60) = 2 phút (floor, không round)
- **Priority**: P1 | **Type**: Positive

##### TC_CDL_036: durationMin tính đúng từ manual
- **Pre-conditions**: isStopwatchMode = false, manualDuration = 45
- **Steps**:
  1. Kiểm tra durationMin value
- **Expected Result**: durationMin = 45 (lấy trực tiếp từ manualDuration)
- **Priority**: P1 | **Type**: Positive

##### TC_CDL_037: Save với duration = 0 → validation
- **Pre-conditions**: durationMin = 0 (chưa bắt đầu stopwatch hoặc nhập 0 manual)
- **Steps**:
  1. Click Save
- **Expected Result**: durationMin > 0 check → duration không included trong saved data, hoặc workout vẫn save nhưng với duration = 0
- **Priority**: P1 | **Type**: Boundary

##### TC_CDL_038: Chuyển type → distance field toggle
- **Pre-conditions**: selectedType = 'running' (distance visible)
- **Steps**:
  1. Click "HIIT" → distance biến mất
  2. Click "Swimming" → distance hiện lại
  3. Click "Walking" → distance biến mất
  4. Click "Cycling" → distance hiện lại
- **Expected Result**: Distance field toggle đúng theo DISTANCE_TYPES: hiện cho running/cycling/swimming, ẩn cho hiit/walking/elliptical/rowing
- **Priority**: P1 | **Type**: Positive

##### TC_CDL_039: Header timer không reset khi chuyển mode
- **Pre-conditions**: CardioLogger mở 30 giây, header timer = 00:30
- **Steps**:
  1. Toggle từ Stopwatch → Manual
  2. Kiểm tra header timer
  3. Toggle từ Manual → Stopwatch
  4. Kiểm tra header timer
- **Expected Result**: Header elapsed timer tiếp tục đếm không gián đoạn (~00:30+), KHÔNG reset khi chuyển mode (separate useEffect)
- **Priority**: P1 | **Type**: Edge

##### TC_CDL_040: Calorie thay đổi theo intensity
- **Pre-conditions**: CardioLogger mở, duration = 30 min
- **Steps**:
  1. Chọn intensity = "low" → ghi nhận calories C1
  2. Chọn intensity = "moderate" → ghi nhận calories C2
  3. Chọn intensity = "high" → ghi nhận calories C3
- **Expected Result**: C1 < C2 < C3 (calorie tăng theo intensity), giá trị cập nhật real-time
- **Priority**: P1 | **Type**: Positive

##### TC_CDL_041: Calorie thay đổi theo duration
- **Pre-conditions**: CardioLogger mở, intensity = moderate
- **Steps**:
  1. Manual mode, duration = 15 → ghi nhận C1
  2. Duration = 30 → ghi nhận C2
  3. Duration = 60 → ghi nhận C3
- **Expected Result**: C1 < C2 < C3 (calorie tăng theo duration), calorie estimate cập nhật khi duration thay đổi
- **Priority**: P1 | **Type**: Positive

##### TC_CDL_042: Calorie phụ thuộc weightKg
- **Pre-conditions**: healthProfileStore có weightKg
- **Steps**:
  1. Verify calorie estimation sử dụng weightKg từ store
- **Expected Result**: Calorie estimate khác nhau cho user 60kg vs 80kg (cùng duration/intensity)
- **Priority**: P2 | **Type**: Positive

##### TC_CDL_043: Distance step = 0.1
- **Pre-conditions**: Running selected, distance visible
- **Steps**:
  1. Inspect distance input element
  2. Nhập "5.3"
- **Expected Result**: Input có step=0.1 attribute, giá trị 5.3 accepted, distanceKm = 5.3
- **Priority**: P2 | **Type**: Positive

##### TC_CDL_044: Stopwatch: 60s → hiển thị 01:00
- **Pre-conditions**: Stopwatch đang chạy
- **Steps**:
  1. Chờ chính xác 60 giây
- **Expected Result**: Display chuyển từ "00:59" → "01:00", format đúng
- **Priority**: P2 | **Type**: Boundary

##### TC_CDL_045: Stopwatch: 3600s → hiển thị 60:00
- **Pre-conditions**: Stopwatch đang chạy rất lâu (simulate)
- **Steps**:
  1. Chờ/simulate 3600 giây
- **Expected Result**: Display hiển thị "60:00" (hoặc format tương ứng nếu hỗ trợ HH:MM), không overflow
- **Priority**: P2 | **Type**: Boundary

##### TC_CDL_046: Manual duration: nhập 0
- **Pre-conditions**: Manual mode active
- **Steps**:
  1. Nhập "0" vào duration input
- **Expected Result**: manualDuration = 0, durationMin = 0, calorie estimate = 0 hoặc rất thấp
- **Priority**: P2 | **Type**: Boundary

##### TC_CDL_047: Manual duration: nhập 999
- **Pre-conditions**: Manual mode active
- **Steps**:
  1. Nhập "999" vào duration input
- **Expected Result**: manualDuration = 999, durationMin = 999, calorie estimate tính đúng cho ~16.6 giờ, UI không crash
- **Priority**: P2 | **Type**: Boundary

##### TC_CDL_048: Heart rate: nhập 0
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Nhập "0" vào heart rate input
- **Expected Result**: avgHeartRate = 0, giá trị accepted (Math.max(0, 0) = 0)
- **Priority**: P2 | **Type**: Boundary

##### TC_CDL_049: Heart rate: nhập 250 (extreme)
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Nhập "250" vào heart rate input
- **Expected Result**: avgHeartRate = 250, giá trị accepted (không có upper bound validation), UI không crash
- **Priority**: P2 | **Type**: Boundary

##### TC_CDL_050: Chọn tất cả 7 types lần lượt
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Click Running → verify selected
  2. Click Cycling → verify
  3. Click Swimming → verify
  4. Click HIIT → verify
  5. Click Walking → verify
  6. Click Elliptical → verify
  7. Click Rowing → verify
- **Expected Result**: Mỗi type chọn thành công, pill highlight chuyển đúng, distance field toggle theo DISTANCE_TYPES
- **Priority**: P2 | **Type**: Positive

##### TC_CDL_051: Dark mode: CardioLogger đúng colors
- **Pre-conditions**: Dark mode enabled, CardioLogger mở
- **Steps**:
  1. Quan sát overall layout
- **Expected Result**: Header background dark, content area dark, pill buttons đúng dark variants, calorie box visible, text đọc được
- **Priority**: P2 | **Type**: Positive

##### TC_CDL_052: i18n: labels cập nhật khi đổi ngôn ngữ
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Đổi ngôn ngữ vi → en
  2. Quan sát buttons, labels, section headers
- **Expected Result**: Save button, Back, intensity labels, section headers cập nhật sang tiếng Anh
- **Priority**: P2 | **Type**: Positive

##### TC_CDL_053: Emoji hiển thị đúng cho mỗi cardio type
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Quan sát 7 cardio type pills
- **Expected Result**: Running=🏃, Cycling=🚴, Swimming=🏊, HIIT=⚡, Walking=🚶, Elliptical=🏋️, Rowing=🚣, mỗi pill có emoji + text
- **Priority**: P2 | **Type**: Positive

##### TC_CDL_054: Save tạo Workout + WorkoutSet objects
- **Pre-conditions**: duration > 0, đã điền đủ thông tin
- **Steps**:
  1. Chọn cycling, 30 min manual, distance=10km, HR=140, intensity=high
  2. Click Save
  3. Verify store
- **Expected Result**: addWorkout gọi với Workout object (type='cardio', durationMin=30). addWorkoutSet gọi với WorkoutSet object chứa distance, heartRate, intensity. workoutId linked đúng
- **Priority**: P1 | **Type**: Positive

##### TC_CDL_055: Finish button trên header functional
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Click nút Finish (X icon) trên header
- **Expected Result**: Trigger save flow hoặc back navigation (tùy implementation), không crash
- **Priority**: P1 | **Type**: Positive

##### TC_CDL_056: Select cardio type Chạy bộ (running) → pill active
- **Pre-conditions**: CardioLogger mở, mặc định running
- **Steps**:
  1. Click cardio-type-running button
- **Expected Result**: selectedType = "running", pill active (bg-emerald-500 text-white), các type khác inactive
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_057: Select cardio type Đạp xe (cycling) → pill active
- **Pre-conditions**: CardioLogger mở, mặc định running
- **Steps**:
  1. Click cardio-type-cycling button
- **Expected Result**: selectedType = "cycling", pill active (bg-emerald-500 text-white), các type khác inactive
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_058: Select cardio type Bơi lội (swimming) → pill active
- **Pre-conditions**: CardioLogger mở, mặc định running
- **Steps**:
  1. Click cardio-type-swimming button
- **Expected Result**: selectedType = "swimming", pill active (bg-emerald-500 text-white), các type khác inactive
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_059: Select cardio type HIIT (hiit) → pill active
- **Pre-conditions**: CardioLogger mở, mặc định running
- **Steps**:
  1. Click cardio-type-hiit button
- **Expected Result**: selectedType = "hiit", pill active (bg-emerald-500 text-white), các type khác inactive
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_060: Select cardio type Đi bộ (walking) → pill active
- **Pre-conditions**: CardioLogger mở, mặc định running
- **Steps**:
  1. Click cardio-type-walking button
- **Expected Result**: selectedType = "walking", pill active (bg-emerald-500 text-white), các type khác inactive
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_061: Select cardio type Elliptical (elliptical) → pill active
- **Pre-conditions**: CardioLogger mở, mặc định running
- **Steps**:
  1. Click cardio-type-elliptical button
- **Expected Result**: selectedType = "elliptical", pill active (bg-emerald-500 text-white), các type khác inactive
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_062: Select cardio type Rowing (rowing) → pill active
- **Pre-conditions**: CardioLogger mở, mặc định running
- **Steps**:
  1. Click cardio-type-rowing button
- **Expected Result**: selectedType = "rowing", pill active (bg-emerald-500 text-white), các type khác inactive
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_063: Select Chạy bộ → emoji 🏃 hiển thị
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Click cardio-type-running
  2. Quan sát emoji trong button
- **Expected Result**: Emoji "🏃" hiển thị bên cạnh text t(i18nKey)
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_064: Select Đạp xe → emoji 🚴 hiển thị
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Click cardio-type-cycling
  2. Quan sát emoji trong button
- **Expected Result**: Emoji "🚴" hiển thị bên cạnh text t(i18nKey)
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_065: Select Bơi lội → emoji 🏊 hiển thị
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Click cardio-type-swimming
  2. Quan sát emoji trong button
- **Expected Result**: Emoji "🏊" hiển thị bên cạnh text t(i18nKey)
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_066: Select HIIT → emoji ⚡ hiển thị
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Click cardio-type-hiit
  2. Quan sát emoji trong button
- **Expected Result**: Emoji "⚡" hiển thị bên cạnh text t(i18nKey)
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_067: Select Đi bộ → emoji 🚶 hiển thị
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Click cardio-type-walking
  2. Quan sát emoji trong button
- **Expected Result**: Emoji "🚶" hiển thị bên cạnh text t(i18nKey)
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_068: Select Elliptical → emoji 🏋️ hiển thị
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Click cardio-type-elliptical
  2. Quan sát emoji trong button
- **Expected Result**: Emoji "🏋️" hiển thị bên cạnh text t(i18nKey)
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_069: Select Rowing → emoji 🚣 hiển thị
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Click cardio-type-rowing
  2. Quan sát emoji trong button
- **Expected Result**: Emoji "🚣" hiển thị bên cạnh text t(i18nKey)
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_070: Switch running → cycling → running
- **Pre-conditions**: CardioLogger mở, selectedType=running
- **Steps**:
  1. Click cycling
  2. Verify selectedType=cycling
  3. Click running
  4. Verify selectedType=running
- **Expected Result**: Type switch back and forth đúng, distance field visible cho cả 2
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_071: Switch running → hiit → distance field ẩn
- **Pre-conditions**: selectedType=running (distance visible)
- **Steps**:
  1. Click hiit
- **Expected Result**: selectedType=hiit, DISTANCE_TYPES không chứa "hiit" → distance section ẩn
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_072: Switch cycling → walking → distance ẩn
- **Pre-conditions**: selectedType=cycling (distance visible)
- **Steps**:
  1. Click walking
- **Expected Result**: selectedType=walking, distance section ẩn
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_073: Switch swimming → elliptical → distance ẩn
- **Pre-conditions**: selectedType=swimming (distance visible)
- **Steps**:
  1. Click elliptical
- **Expected Result**: selectedType=elliptical, distance section ẩn
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_074: Switch hiit → running → distance xuất hiện
- **Pre-conditions**: selectedType=hiit (distance ẩn)
- **Steps**:
  1. Click running
- **Expected Result**: selectedType=running, DISTANCE_TYPES includes "running" → distance section visible
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_075: Switch walking → cycling → distance xuất hiện
- **Pre-conditions**: selectedType=walking (distance ẩn)
- **Steps**:
  1. Click cycling
- **Expected Result**: distance section xuất hiện cho cycling
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_076: Rapid type switching 10 lần
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Click nhanh qua 7 types, lặp lại, tổng 10 clicks
- **Expected Result**: Không crash, type cuối cùng selected đúng
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_CDL_077: Switch type khi stopwatch đang chạy → timer continues
- **Pre-conditions**: Stopwatch running, stopwatchSeconds=30
- **Steps**:
  1. Click cycling (switch type)
  2. Quan sát stopwatch
- **Expected Result**: Stopwatch vẫn chạy, seconds tiếp tục tăng, type chỉ thay đổi selectedType state
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_078: Switch type với manual duration set → preserved
- **Pre-conditions**: Manual mode, manualDuration=45
- **Steps**:
  1. Click hiit
  2. Quan sát duration
- **Expected Result**: manualDuration vẫn = 45, không reset khi đổi type
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_CDL_079: Switch type → distance preserved hay reset
- **Pre-conditions**: selectedType=running, distanceKm=5.0
- **Steps**:
  1. Click cycling (vẫn show distance)
  2. Quan sát distance input
- **Expected Result**: distanceKm vẫn = 5.0 (state không reset khi đổi type)
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_CDL_080: Switch type → heart rate preserved
- **Pre-conditions**: avgHeartRate=140, selectedType=running
- **Steps**:
  1. Click hiit
- **Expected Result**: avgHeartRate vẫn = 140, không bị reset
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_081: Switch type → intensity preserved
- **Pre-conditions**: intensity=high, selectedType=running
- **Steps**:
  1. Click walking
- **Expected Result**: intensity vẫn = "high", không reset
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_082: Switch type → calorie re-calculated
- **Pre-conditions**: selectedType=running, durationMin=30, intensity=moderate → calories = X
- **Steps**:
  1. Click cycling
  2. Quan sát calorie-value
- **Expected Result**: estimateCardioBurn recalculated với type=cycling → calorie value thay đổi
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_083: Start: seconds bắt đầu tăng
- **Pre-conditions**: isStopwatchMode=true, stopwatchRunning=false, stopwatchSeconds=0
- **Steps**:
  1. Click start-button
- **Expected Result**: stopwatchRunning = true, interval bắt đầu, seconds tăng mỗi giây
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_084: Start: display thay đổi từ 00:00
- **Pre-conditions**: Stopwatch chưa start
- **Steps**:
  1. Click start
  2. Chờ 1 giây
- **Expected Result**: stopwatch-display chuyển từ "00:00" → "00:01"
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_085: Pause: seconds đóng băng
- **Pre-conditions**: Stopwatch running, seconds=30
- **Steps**:
  1. Click pause-button
  2. Chờ 2 giây
- **Expected Result**: stopwatchRunning = false, seconds vẫn = 30 (không tăng)
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_086: Pause: display frozen
- **Pre-conditions**: Paused tại 30s
- **Steps**:
  1. Quan sát display sau 3 giây
- **Expected Result**: Display vẫn hiển thị "00:30", không thay đổi
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_087: Resume sau pause: tiếp tục từ giá trị paused
- **Pre-conditions**: Paused tại seconds=30
- **Steps**:
  1. Click start-button
  2. Chờ 2 giây
- **Expected Result**: stopwatchRunning = true, seconds tiếp tục từ 30 → 31 → 32
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_088: Stop: seconds reset về 0
- **Pre-conditions**: Stopwatch running hoặc paused, seconds=45
- **Steps**:
  1. Click stop-button
- **Expected Result**: stopwatchRunning = false, stopwatchSeconds = 0
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_089: Stop: display hiển thị 00:00
- **Pre-conditions**: Sau click stop
- **Steps**:
  1. Quan sát stopwatch-display
- **Expected Result**: Display = "00:00"
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_090: Stop khi not running → vẫn reset
- **Pre-conditions**: stopwatchRunning=false, stopwatchSeconds=0
- **Steps**:
  1. Click stop-button
- **Expected Result**: stopwatchSeconds vẫn = 0, không side effect
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_CDL_091: Pause khi not running → no effect
- **Pre-conditions**: stopwatchRunning=false (chưa start)
- **Steps**:
  1. Click pause-button (không visible vì Start hiển thị)
- **Expected Result**: Pause button không hiển thị khi !stopwatchRunning, Start hiển thị thay thế
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_CDL_092: Start → chờ 5s → display "00:05"
- **Pre-conditions**: Stopwatch chưa start
- **Steps**:
  1. Click start
  2. Chờ 5 giây
- **Expected Result**: stopwatch-display = "00:05"
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_093: Start → chờ 60s → display "01:00"
- **Pre-conditions**: Stopwatch chưa start
- **Steps**:
  1. Click start
  2. Chờ 60 giây
- **Expected Result**: formatElapsed(60) = "01:00"
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_094: Start → chờ 90s → display "01:30"
- **Pre-conditions**: Stopwatch chưa start
- **Steps**:
  1. Click start
  2. Chờ 90 giây
- **Expected Result**: formatElapsed(90) = "01:30"
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_095: Start → Pause → Start → continues
- **Pre-conditions**: Stopwatch paused tại 20s
- **Steps**:
  1. Click start
  2. Chờ 5 giây
- **Expected Result**: Seconds tiếp tục từ 20: 20 → 21 → ... → 25
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_096: Start → Pause → Stop → reset to 0
- **Pre-conditions**: Stopwatch running
- **Steps**:
  1. Click pause (seconds=40)
  2. Click stop
- **Expected Result**: seconds = 0, display "00:00"
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_097: Start → Stop → Start → counts from 0
- **Pre-conditions**: Stopwatch stopped (seconds=0)
- **Steps**:
  1. Click start
  2. Chờ 3 giây
- **Expected Result**: Seconds bắt đầu lại từ 0: 0 → 1 → 2 → 3
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_098: Duration calculation: 59s → 0 min
- **Pre-conditions**: stopwatchSeconds = 59
- **Steps**:
  1. Check durationMin
- **Expected Result**: Math.floor(59/60) = 0, durationMin = 0
- **Priority**: P1 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_CDL_099: Duration calculation: 60s → 1 min
- **Pre-conditions**: stopwatchSeconds = 60
- **Steps**:
  1. Check durationMin
- **Expected Result**: Math.floor(60/60) = 1, durationMin = 1
- **Priority**: P1 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_CDL_100: Duration calculation: 90s → 1 min
- **Pre-conditions**: stopwatchSeconds = 90
- **Steps**:
  1. Check durationMin
- **Expected Result**: Math.floor(90/60) = 1, durationMin = 1
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_CDL_101: Duration calculation: 120s → 2 min
- **Pre-conditions**: stopwatchSeconds = 120
- **Steps**:
  1. Check durationMin
- **Expected Result**: Math.floor(120/60) = 2, durationMin = 2
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_CDL_102: Duration calculation: 0s → 0 min
- **Pre-conditions**: stopwatchSeconds = 0
- **Steps**:
  1. Check durationMin
- **Expected Result**: Math.floor(0/60) = 0, durationMin = 0
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_CDL_103: Button state: not running → show Start
- **Pre-conditions**: stopwatchRunning = false
- **Steps**:
  1. Quan sát buttons trong stopwatch panel
- **Expected Result**: Start button visible (data-testid="start-button"), Pause button KHÔNG visible
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_104: Button state: running → show Pause
- **Pre-conditions**: stopwatchRunning = true
- **Steps**:
  1. Quan sát buttons
- **Expected Result**: Pause button visible (data-testid="pause-button"), Start button KHÔNG visible
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_105: Stop button luôn visible
- **Pre-conditions**: Bất kỳ state nào
- **Steps**:
  1. Quan sát stop-button
- **Expected Result**: Stop button (data-testid="stop-button") luôn hiển thị
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_106: Start button styling: emerald bg
- **Pre-conditions**: stopwatchRunning = false
- **Steps**:
  1. Inspect start-button
- **Expected Result**: Button có bg-emerald-500 text-white, hover:bg-emerald-600
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_107: Pause button styling: amber bg
- **Pre-conditions**: stopwatchRunning = true
- **Steps**:
  1. Inspect pause-button
- **Expected Result**: Button có bg-amber-500 text-white, hover:bg-amber-600
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_108: Stop button styling: red bg
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Inspect stop-button
- **Expected Result**: Button có bg-red-500 text-white, hover:bg-red-600
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_109: Stopwatch display font: mono, 3xl, bold
- **Pre-conditions**: CardioLogger mở, stopwatch mode
- **Steps**:
  1. Inspect stopwatch-display
- **Expected Result**: Display có class font-mono text-3xl font-bold text-slate-800
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_110: Stopwatch panel data-testid present
- **Pre-conditions**: isStopwatchMode = true
- **Steps**:
  1. Inspect DOM
- **Expected Result**: data-testid="stopwatch-panel" visible, chứa display + control buttons
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_111: Manual mode: nhập 0 → duration = 0
- **Pre-conditions**: isStopwatchMode = false
- **Steps**:
  1. Nhập "0" vào manual-duration-input
- **Expected Result**: manualDuration = 0, durationMin = 0
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_CDL_112: Manual mode: nhập 1 → duration = 1
- **Pre-conditions**: Manual mode active
- **Steps**:
  1. Nhập "1"
- **Expected Result**: manualDuration = 1, durationMin = 1
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_113: Manual mode: nhập 30 → duration = 30
- **Pre-conditions**: Manual mode active
- **Steps**:
  1. Nhập "30"
- **Expected Result**: manualDuration = 30
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_114: Manual mode: nhập 60 → duration = 60
- **Pre-conditions**: Manual mode active
- **Steps**:
  1. Nhập "60"
- **Expected Result**: manualDuration = 60
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_115: Manual mode: nhập 120 → duration = 120
- **Pre-conditions**: Manual mode active
- **Steps**:
  1. Nhập "120"
- **Expected Result**: manualDuration = 120
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_116: Manual mode: nhập 180 → duration = 180
- **Pre-conditions**: Manual mode active
- **Steps**:
  1. Nhập "180"
- **Expected Result**: manualDuration = 180 (3 giờ workout)
- **Priority**: P3 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_CDL_117: Manual mode: nhập negative (-5) → clamped to 0
- **Pre-conditions**: Manual mode active
- **Steps**:
  1. Nhập "-5"
- **Expected Result**: Math.max(0, Number("-5")) = 0, manualDuration = 0
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_CDL_118: Manual mode: nhập decimal 30.5
- **Pre-conditions**: Manual mode active
- **Steps**:
  1. Nhập "30.5"
- **Expected Result**: manualDuration = 30 (Math.max(0, 30.5) = 30.5, nhưng durationMin sẽ là 30.5 nếu không floor)
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_CDL_119: Manual mode: nhập very large 9999
- **Pre-conditions**: Manual mode active
- **Steps**:
  1. Nhập "9999"
- **Expected Result**: manualDuration = 9999, no upper limit validation
- **Priority**: P3 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_CDL_120: Manual mode: clear field → duration = 0
- **Pre-conditions**: Manual mode, duration = 30
- **Steps**:
  1. Clear input field
- **Expected Result**: manualDuration = 0 (Math.max(0, NaN) hoặc 0)
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_CDL_121: Manual mode: input type="number"
- **Pre-conditions**: Manual mode active
- **Steps**:
  1. Inspect manual-duration-input
- **Expected Result**: Input có type="number", min=0
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_122: Manual mode: không có start/pause/stop buttons
- **Pre-conditions**: isStopwatchMode = false
- **Steps**:
  1. Search DOM cho start-button, pause-button
- **Expected Result**: Start/Pause buttons KHÔNG render (conditional: isStopwatchMode chỉ render stopwatch panel)
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_CDL_123: Manual mode: input centered, lg font
- **Pre-conditions**: Manual mode active
- **Steps**:
  1. Inspect manual-duration-input styling
- **Expected Result**: Input có text-center text-lg font-semibold
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_124: Switch sang manual → stopwatch irrelevant cho duration
- **Pre-conditions**: Stopwatch seconds=120 (2 min), switch sang manual, manual=45
- **Steps**:
  1. Kiểm tra durationMin
- **Expected Result**: isStopwatchMode=false → durationMin = manualDuration = 45 (không phải floor(120/60)=2)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_125: Switch sang stopwatch → manual irrelevant cho duration
- **Pre-conditions**: Manual duration=60, switch sang stopwatch, stopwatchSeconds=0
- **Steps**:
  1. Kiểm tra durationMin
- **Expected Result**: isStopwatchMode=true → durationMin = floor(0/60) = 0 (không phải 60)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_126: Default là stopwatch mode
- **Pre-conditions**: CardioLogger vừa mở
- **Steps**:
  1. Quan sát mode buttons
- **Expected Result**: Stopwatch button active (emerald), isStopwatchMode = true, stopwatch panel visible
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_127: Click manual button → switch sang manual mode
- **Pre-conditions**: isStopwatchMode = true
- **Steps**:
  1. Click manual-mode-button
- **Expected Result**: isStopwatchMode = false, manual panel visible, manual button active (emerald)
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_128: Click stopwatch button → switch back
- **Pre-conditions**: isStopwatchMode = false
- **Steps**:
  1. Click stopwatch-mode-button
- **Expected Result**: isStopwatchMode = true, stopwatch panel visible
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_129: Stopwatch running → switch manual → stopwatch vẫn ticking
- **Pre-conditions**: Stopwatch running, seconds tăng
- **Steps**:
  1. Click manual-mode-button
  2. Chờ 3 giây
  3. Click stopwatch-mode-button
- **Expected Result**: Stopwatch interval vẫn chạy (state độc lập), seconds tiếp tục tăng
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_CDL_130: Manual có value → switch stopwatch → manual ignored
- **Pre-conditions**: Manual mode, manualDuration = 45
- **Steps**:
  1. Click stopwatch-mode-button
  2. Check durationMin
- **Expected Result**: durationMin = floor(stopwatchSeconds/60), manualDuration không ảnh hưởng
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_131: Stopwatch mode button: active styling emerald
- **Pre-conditions**: isStopwatchMode = true
- **Steps**:
  1. Inspect stopwatch-mode-button
- **Expected Result**: bg-emerald-500 text-white applied
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_132: Manual mode button: active styling emerald
- **Pre-conditions**: isStopwatchMode = false
- **Steps**:
  1. Inspect manual-mode-button
- **Expected Result**: bg-emerald-500 text-white applied
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_133: Inactive mode button: slate styling
- **Pre-conditions**: isStopwatchMode = true
- **Steps**:
  1. Inspect manual-mode-button (inactive)
- **Expected Result**: bg-slate-100 text-slate-600 (light mode) hoặc dark variants
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_134: Switch modes nhanh 10 lần
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Click stopwatch ↔ manual 10 lần nhanh
- **Expected Result**: Không crash, cuối cùng mode đúng, UI stable
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_CDL_135: Mode buttons data-testid present
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Inspect DOM
- **Expected Result**: stopwatch-mode-button và manual-mode-button data-testid present
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_136: Switch manual → stopwatch: stopwatch bắt đầu từ last value
- **Pre-conditions**: Stopwatch paused tại 30s, switch manual, switch back
- **Steps**:
  1. Click manual
  2. Click stopwatch
  3. Quan sát display
- **Expected Result**: Display hiển thị stopwatchSeconds value (30 hoặc tiếp tục nếu vẫn running)
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_CDL_137: Switch với running stopwatch → stopwatch vẫn runs
- **Pre-conditions**: Stopwatch running
- **Steps**:
  1. Click manual
  2. Chờ 5s
  3. Click stopwatch
- **Expected Result**: Stopwatch seconds đã tăng thêm ~5s trong lúc ở manual mode
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_CDL_138: durationMin reflects active mode correctly
- **Pre-conditions**: Stopwatch seconds=120, manual=45
- **Steps**:
  1. Switch giữa modes
  2. Verify durationMin mỗi lần
- **Expected Result**: Stopwatch: durationMin=2, Manual: durationMin=45
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_139: Distance visible cho running
- **Pre-conditions**: selectedType = "running"
- **Steps**:
  1. Chọn running
  2. Quan sát distance-section
- **Expected Result**: showDistance = DISTANCE_TYPES.includes("running") = true → distance-section visible
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_140: Distance visible cho cycling
- **Pre-conditions**: selectedType = "cycling"
- **Steps**:
  1. Chọn cycling
  2. Quan sát distance-section
- **Expected Result**: showDistance = DISTANCE_TYPES.includes("cycling") = true → distance-section visible
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_141: Distance visible cho swimming
- **Pre-conditions**: selectedType = "swimming"
- **Steps**:
  1. Chọn swimming
  2. Quan sát distance-section
- **Expected Result**: showDistance = DISTANCE_TYPES.includes("swimming") = true → distance-section visible
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_142: Distance ẩn cho hiit
- **Pre-conditions**: selectedType = "hiit"
- **Steps**:
  1. Chọn hiit
  2. Search DOM cho distance-section
- **Expected Result**: showDistance = DISTANCE_TYPES.includes("hiit") = false → distance-section KHÔNG render
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_CDL_143: Distance ẩn cho walking
- **Pre-conditions**: selectedType = "walking"
- **Steps**:
  1. Chọn walking
  2. Search DOM cho distance-section
- **Expected Result**: showDistance = DISTANCE_TYPES.includes("walking") = false → distance-section KHÔNG render
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_CDL_144: Distance ẩn cho elliptical
- **Pre-conditions**: selectedType = "elliptical"
- **Steps**:
  1. Chọn elliptical
  2. Search DOM cho distance-section
- **Expected Result**: showDistance = DISTANCE_TYPES.includes("elliptical") = false → distance-section KHÔNG render
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_CDL_145: Distance ẩn cho rowing
- **Pre-conditions**: selectedType = "rowing"
- **Steps**:
  1. Chọn rowing
  2. Search DOM cho distance-section
- **Expected Result**: showDistance = DISTANCE_TYPES.includes("rowing") = false → distance-section KHÔNG render
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_CDL_146: Distance: nhập 0
- **Pre-conditions**: Distance section visible, selectedType=running
- **Steps**:
  1. Nhập "0" vào distance-input
- **Expected Result**: distanceKm = 0 (Math.max(0, 0))
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_CDL_147: Distance: nhập 0.1 (short)
- **Pre-conditions**: Distance visible
- **Steps**:
  1. Nhập "0.1"
- **Expected Result**: distanceKm = 0.1
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_148: Distance: nhập 5.0 (standard)
- **Pre-conditions**: Distance visible
- **Steps**:
  1. Nhập "5.0"
- **Expected Result**: distanceKm = 5.0
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_149: Distance: nhập 10.0 (long run)
- **Pre-conditions**: Distance visible
- **Steps**:
  1. Nhập "10.0"
- **Expected Result**: distanceKm = 10.0
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_150: Distance: nhập 21.1 (half marathon)
- **Pre-conditions**: Distance visible
- **Steps**:
  1. Nhập "21.1"
- **Expected Result**: distanceKm = 21.1
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_151: Distance: nhập 42.195 (full marathon)
- **Pre-conditions**: Distance visible
- **Steps**:
  1. Nhập "42.195"
- **Expected Result**: distanceKm = 42.195 (precision accepted)
- **Priority**: P3 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_CDL_152: Distance: nhập negative → Math.max(0)
- **Pre-conditions**: Distance visible
- **Steps**:
  1. Nhập "-3"
- **Expected Result**: Math.max(0, Number("-3")) = 0 hoặc validation block
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_CDL_153: Distance: clear → undefined
- **Pre-conditions**: Distance visible, distanceKm = 5.0
- **Steps**:
  1. Clear distance input (xóa hết)
- **Expected Result**: val="" → distanceKm = undefined (val === "" ? undefined : ...)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_154: Distance input step=0.1
- **Pre-conditions**: Distance visible
- **Steps**:
  1. Inspect distance-input
- **Expected Result**: Input có step={0.1}, min={0}
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_155: Distance input min=0
- **Pre-conditions**: Distance visible
- **Steps**:
  1. Inspect distance-input
- **Expected Result**: Input có min={0}, type="number"
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_156: Heart rate: nhập 60 bpm (resting)
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Nhập "60" vào heart-rate-input
- **Expected Result**: avgHeartRate = 60, hiển thị đúng
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_157: Heart rate: nhập 80 bpm (light)
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Nhập "80" vào heart-rate-input
- **Expected Result**: avgHeartRate = 80, hiển thị đúng
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_158: Heart rate: nhập 120 bpm (moderate)
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Nhập "120" vào heart-rate-input
- **Expected Result**: avgHeartRate = 120, hiển thị đúng
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_159: Heart rate: nhập 160 bpm (vigorous)
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Nhập "160" vào heart-rate-input
- **Expected Result**: avgHeartRate = 160, hiển thị đúng
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_160: Heart rate: nhập 180 bpm (max effort)
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Nhập "180" vào heart-rate-input
- **Expected Result**: avgHeartRate = 180, hiển thị đúng
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_161: Heart rate: nhập 200 bpm (extreme)
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Nhập "200" vào heart-rate-input
- **Expected Result**: avgHeartRate = 200, hiển thị đúng
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_162: Heart rate: nhập 220 bpm (theoretical max)
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Nhập "220" vào heart-rate-input
- **Expected Result**: avgHeartRate = 220, hiển thị đúng
- **Priority**: P3 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_CDL_163: Heart rate: nhập 40 bpm (very low boundary)
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Nhập "40" vào heart-rate-input
- **Expected Result**: avgHeartRate = 40, accepted (no lower limit enforced beyond Math.max(0))
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_CDL_164: Heart rate: nhập 0 → accepted
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Nhập "0"
- **Expected Result**: Math.max(0, 0) = 0, avgHeartRate = 0
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_CDL_165: Heart rate: nhập negative → Math.max(0) = 0
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Nhập "-10"
- **Expected Result**: Math.max(0, -10) = 0, avgHeartRate = 0
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_CDL_166: Heart rate: clear → undefined
- **Pre-conditions**: avgHeartRate = 120
- **Steps**:
  1. Clear heart-rate-input
- **Expected Result**: val="" → avgHeartRate = undefined
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_167: Heart rate input type="number"
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Inspect heart-rate-input
- **Expected Result**: Input có type="number", min={0}
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_168: Heart rate: optional (save without it)
- **Pre-conditions**: avgHeartRate = undefined, các fields khác có giá trị
- **Steps**:
  1. Click save
- **Expected Result**: Workout saved thành công, WorkoutSet.avgHeartRate = undefined (không include)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_169: Heart rate preserved khi switch type
- **Pre-conditions**: avgHeartRate = 150, selectedType=running
- **Steps**:
  1. Click walking
- **Expected Result**: avgHeartRate vẫn = 150, input vẫn hiển thị 150
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_170: Heart rate section luôn visible
- **Pre-conditions**: Bất kỳ selectedType nào
- **Steps**:
  1. Chọn lần lượt 7 types
  2. Mỗi lần check heart rate section
- **Expected Result**: Heart rate section hiển thị cho mọi cardio type (không conditional)
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_171: Intensity: select low
- **Pre-conditions**: intensity = moderate (default)
- **Steps**:
  1. Click intensity-low button
- **Expected Result**: intensity = "low", low button active (emerald), moderate inactive
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_172: Intensity: select moderate (default)
- **Pre-conditions**: CardioLogger vừa mở
- **Steps**:
  1. Quan sát intensity buttons
- **Expected Result**: intensity = "moderate" mặc định, moderate button active
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_173: Intensity: select high
- **Pre-conditions**: intensity = moderate
- **Steps**:
  1. Click intensity-high
- **Expected Result**: intensity = "high", high button active
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_174: Intensity: switch low → high
- **Pre-conditions**: intensity = low
- **Steps**:
  1. Click intensity-high
- **Expected Result**: intensity chuyển sang "high"
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_175: Intensity: switch high → moderate
- **Pre-conditions**: intensity = high
- **Steps**:
  1. Click intensity-moderate
- **Expected Result**: intensity = "moderate"
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_176: Intensity: switch moderate → low → moderate
- **Pre-conditions**: intensity = moderate
- **Steps**:
  1. Click low
  2. Click moderate
- **Expected Result**: intensity quay về "moderate"
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_177: Intensity affects calorie estimation
- **Pre-conditions**: duration = 30 min, type = running, weight = 70kg
- **Steps**:
  1. Set intensity = low → note calories
  2. Set high → note calories
- **Expected Result**: Calories với high > moderate > low (estimateCardioBurn thay đổi theo intensity)
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_178: Low intensity: lowest calorie burn
- **Pre-conditions**: duration=30, type=running, weight=70
- **Steps**:
  1. Set intensity=low
  2. Quan sát calorie-value
- **Expected Result**: Calorie estimate thấp nhất so với moderate/high cùng conditions
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_179: High intensity: highest calorie burn
- **Pre-conditions**: duration=30, type=running, weight=70
- **Steps**:
  1. Set intensity=high
  2. Quan sát calorie-value
- **Expected Result**: Calorie estimate cao nhất
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_180: Intensity buttons styling: selected=emerald, unselected=slate
- **Pre-conditions**: intensity = moderate
- **Steps**:
  1. Inspect 3 intensity buttons
- **Expected Result**: moderate: bg-emerald-500 text-white. low, high: bg-slate-100 text-slate-600
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_181: Intensity data-testid cho mỗi button
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Inspect buttons
- **Expected Result**: intensity-low, intensity-moderate, intensity-high data-testid present
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_182: Intensity section heading visible
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Quan sát intensity section
- **Expected Result**: H3 heading "Cường độ" (i18n key) visible
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_183: Calories: duration 0 → 0
- **Pre-conditions**: durationMin = 0
- **Steps**:
  1. Quan sát calorie-value
- **Expected Result**: estimatedCalories = 0 (durationMin <= 0 → return 0)
- **Priority**: P0 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_CDL_184: Calories: duration 30, moderate, running
- **Pre-conditions**: durationMin=30, intensity=moderate, selectedType=running, weightKg=70
- **Steps**:
  1. Quan sát calorie-value
- **Expected Result**: estimateCardioBurn(running, 30, moderate, 70) = giá trị > 0
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_185: Calories: duration 60, high, cycling
- **Pre-conditions**: durationMin=60, intensity=high, selectedType=cycling, weightKg=70
- **Steps**:
  1. Quan sát calorie-value
- **Expected Result**: Calorie value > value cho 30min/moderate (higher duration + intensity)
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_186: Calories: duration 1, low, walking
- **Pre-conditions**: durationMin=1, intensity=low, selectedType=walking
- **Steps**:
  1. Quan sát calorie-value
- **Expected Result**: Small positive value (1 minute light walking)
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_187: Change duration → calories update
- **Pre-conditions**: durationMin=30, calories=X
- **Steps**:
  1. Thay đổi duration sang 60
  2. Quan sát calorie-value
- **Expected Result**: Calorie value tăng (duration tăng → burn tăng)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_188: Change type → calories update
- **Pre-conditions**: type=running, duration=30, calories=X
- **Steps**:
  1. Switch type sang walking
  2. Quan sát calorie-value
- **Expected Result**: Calorie value thay đổi (walking vs running khác burn rate)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_189: Change intensity → calories update
- **Pre-conditions**: intensity=low, duration=30
- **Steps**:
  1. Click intensity-high
  2. Quan sát calorie-value
- **Expected Result**: Calorie value tăng (high intensity → higher burn)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_190: Calorie preview section visible
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Quan sát calorie-preview section
- **Expected Result**: data-testid="calorie-preview" visible, hiển thị label + value
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_191: Calorie value displayed
- **Pre-conditions**: durationMin > 0
- **Steps**:
  1. Quan sát data-testid="calorie-value"
- **Expected Result**: calorie-value element hiển thị số nguyên
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_192: Calories với very long duration (180 min)
- **Pre-conditions**: durationMin=180, type=running, intensity=high
- **Steps**:
  1. Quan sát calorie-value
- **Expected Result**: Large calorie value hiển thị đúng, không overflow
- **Priority**: P3 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_CDL_193: Calories sử dụng weightKg từ healthProfileStore
- **Pre-conditions**: weightKg=80 trong healthProfileStore
- **Steps**:
  1. Quan sát calories
  2. So sánh với weightKg=60
- **Expected Result**: Heavier person → higher calorie burn (weight factor)
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_194: Calories format: integer
- **Pre-conditions**: durationMin > 0
- **Steps**:
  1. Quan sát calorie display
- **Expected Result**: Calorie hiển thị là số nguyên (estimateCardioBurn returns integer)
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_195: Calorie section styling: emerald bg
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Inspect calorie-preview
- **Expected Result**: Section có bg-emerald-50 dark:bg-emerald-900/20
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_196: Save với tất cả fields populated
- **Pre-conditions**: selectedType=running, durationMin=30, distanceKm=5, avgHeartRate=150, intensity=high
- **Steps**:
  1. Click save-button
- **Expected Result**: Workout created: name=cardio title, durationMin=30. WorkoutSet: exerciseId=running, distanceKm=5, avgHeartRate=150, intensity=high, estimatedCalories>0
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_197: Save với chỉ duration (stopwatch)
- **Pre-conditions**: Stopwatch mode, seconds=600 (10min), distance=undefined, HR=undefined
- **Steps**:
  1. Click save
- **Expected Result**: Workout durationMin=10, WorkoutSet: distanceKm=undefined, avgHeartRate=undefined
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_198: Save với chỉ duration (manual)
- **Pre-conditions**: Manual mode, manualDuration=45
- **Steps**:
  1. Click save
- **Expected Result**: Workout durationMin=45
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_199: Save với duration + distance (running)
- **Pre-conditions**: type=running, duration=30, distance=5.0
- **Steps**:
  1. Click save
- **Expected Result**: WorkoutSet.distanceKm = 5.0
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_200: Save with partial fields (no heart rate)
- **Pre-conditions**: duration=30, distance=5, avgHeartRate=undefined
- **Steps**:
  1. Click save
- **Expected Result**: Save thành công, avgHeartRate undefined trong WorkoutSet
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_201: Save với duration=0 → durationMin undefined
- **Pre-conditions**: durationMin = 0 (stopwatch 0s hoặc manual 0)
- **Steps**:
  1. Click save
- **Expected Result**: Workout.durationMin = undefined (durationMin > 0 check: 0 > 0 = false)
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_CDL_202: Save: Workout object tạo đúng
- **Pre-conditions**: Có data hợp lệ
- **Steps**:
  1. Click save
  2. Verify workout object
- **Expected Result**: Workout {id: "workout-{timestamp}", date: "YYYY-MM-DD", name: t("fitness.cardio.title"), durationMin, createdAt, updatedAt}
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_203: Save: WorkoutSet với cardio data đầy đủ
- **Pre-conditions**: Tất cả fields populated
- **Steps**:
  1. Click save
  2. Verify WorkoutSet
- **Expected Result**: WorkoutSet chứa: exerciseId=selectedType, durationMin, distanceKm, avgHeartRate, intensity, estimatedCalories
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_204: Save: onComplete callback triggered
- **Pre-conditions**: Đã click save
- **Steps**:
  1. Verify callback
- **Expected Result**: onComplete(workout) gọi với workout object, chuyển về FitnessTab history tab
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_205: Header finish button và bottom save button cùng hoạt động
- **Pre-conditions**: CardioLogger mở
- **Steps**:
  1. Click finish-button (header)
  2. Verify save triggered
- **Expected Result**: Cả finish-button (header) và save-button (bottom) đều gọi handleSave()
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_206: Dark mode: header bg-emerald-600
- **Pre-conditions**: Dark mode enabled, CardioLogger mở
- **Steps**:
  1. Inspect cardio-header
- **Expected Result**: Header background emerald-600, text white
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_207: Dark mode: section cards bg-slate-800
- **Pre-conditions**: Dark mode enabled
- **Steps**:
  1. Inspect duration/distance/heartrate/intensity sections
- **Expected Result**: Sections có dark:bg-slate-800, text dark:text-slate-300
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_208: Dark mode: input fields contrast
- **Pre-conditions**: Dark mode enabled
- **Steps**:
  1. Inspect manual-duration-input, distance-input, heart-rate-input
- **Expected Result**: Inputs dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_209: Dark mode: calorie preview section
- **Pre-conditions**: Dark mode enabled, durationMin > 0
- **Steps**:
  1. Inspect calorie-preview
- **Expected Result**: dark:bg-emerald-900/20, text dark:text-emerald-300/400, readable
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_CDL_210: Dark mode: tất cả text readable
- **Pre-conditions**: Dark mode enabled
- **Steps**:
  1. Scan toàn bộ CardioLogger elements
- **Expected Result**: Tất cả text có contrast ratio đủ (≥ 4.5:1 WCAG AA) với dark backgrounds
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |
