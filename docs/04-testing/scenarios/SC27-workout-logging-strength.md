# Scenario 27: Workout Logging - Strength

**Version:** 2.0  
**Date:** 2026-03-26  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Workout Logging - Strength là scenario bao quát toàn bộ luồng ghi nhận bài tập sức mạnh (strength training) trong module Fitness. Khi user nhấn "Bắt đầu" từ TrainingPlanView, WorkoutLogger mở dưới dạng full-screen overlay (z-50) với header sticky hiển thị thời gian elapsed (MM:SS), nút Back và nút Finish.

WorkoutLogger quản lý danh sách exercises (từ plan hoặc thêm thủ công qua ExerciseSelector), cho phép log từng set gồm: weight (±2.5kg increment, min 0), reps (±1, min 0), RPE (6-10, toggle select). Sau mỗi set logged, RestTimer hiển thị (countdown circular progress, +30s extend, skip option). ExerciseSelector hỗ trợ tìm kiếm (nameVi/nameEn), filter theo muscle group (7 groups) và equipment, hiển thị exercises theo category (compound/secondary/isolation).

SetEditor là modal chỉnh sửa chi tiết với weight/reps controls (increment buttons + input), recent weight chips, RPE selector, và validation (weight min 0, reps min 1). Khi hoàn thành workout, user thấy summary screen trước khi save (tổng volume, duration, PR detection). Elapsed time counter chạy liên tục từ lúc mở WorkoutLogger.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| WorkoutLogger | WorkoutLogger.tsx | Container chính cho logging bài tập sức mạnh |
| ExerciseSelector | ExerciseSelector.tsx | Modal chọn bài tập (search, filter, select) |
| RestTimer | RestTimer.tsx | Timer đếm ngược giữa các sets |
| SetEditor | SetEditor.tsx | Modal chỉnh sửa chi tiết set (weight/reps/RPE) |
| useFitnessStore | fitnessStore.ts | Zustand store: addWorkout, addWorkoutSet |
| useTranslation | i18n | Hook i18n cho đa ngôn ngữ |
| useModalBackHandler | hooks | Xử lý back gesture/escape cho modals |

## Luồng nghiệp vụ

1. User click "Bắt đầu" từ TrainingPlanView → WorkoutLogger mở full-screen
2. Elapsed timer bắt đầu đếm (interval 1s)
3. Exercises từ planDay load tự động → hiển thị exercise sections
4. User nhập weight → nhập reps → (optional) chọn RPE → click "Log Set"
5. Set logged → RestTimer hiển thị (countdown từ DEFAULT_REST_SECONDS=90s)
6. RestTimer: chờ hết giờ, hoặc +30s extend, hoặc Skip
7. User có thể thêm exercise mới: click "Add Exercise" → ExerciseSelector mở
8. Khi hoàn thành → click "Finish" → Summary screen hiển thị
9. Summary: tổng volume, duration, sets logged → click "Save"
10. Save: tạo Workout + WorkoutSets → lưu vào store → onComplete callback

## Quy tắc nghiệp vụ

1. WEIGHT_INCREMENT = 2.5, weight min = 0
2. RPE_OPTIONS = [6, 7, 8, 9, 10], toggle-selectable
3. DEFAULT_REST_SECONDS = 90, ADD_SECONDS = 30
4. RestTimer countdown dừng ở 0, onComplete khi remaining === 0
5. Elapsed timer: interval 1s, format MM:SS
6. ExerciseSelector: muscleGroup AND equipment AND search (nameVi OR nameEn)
7. SetEditor: MIN_WEIGHT = 0, MIN_REPS = 1
8. isOpen/isVisible = false → return null

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_WLS_001 | WorkoutLogger mở full-screen overlay | Positive | P0 |
| TC_WLS_002 | Elapsed timer bắt đầu đếm | Positive | P0 |
| TC_WLS_003 | Exercises từ plan load tự động | Positive | P0 |
| TC_WLS_004 | Log set: nhập weight + reps → confirm | Positive | P0 |
| TC_WLS_005 | RestTimer hiển thị sau log set | Positive | P0 |
| TC_WLS_006 | RestTimer countdown đến 0 → auto complete | Positive | P1 |
| TC_WLS_007 | RestTimer +30s extend | Positive | P1 |
| TC_WLS_008 | RestTimer skip | Positive | P1 |
| TC_WLS_009 | Weight increment +2.5kg | Positive | P1 |
| TC_WLS_010 | Weight decrement -2.5kg | Positive | P1 |
| TC_WLS_011 | Weight không giảm dưới 0 | Boundary | P1 |
| TC_WLS_012 | Reps increment +1 | Positive | P1 |
| TC_WLS_013 | Reps decrement -1 | Positive | P1 |
| TC_WLS_014 | RPE selector: chọn từng giá trị | Positive | P1 |
| TC_WLS_015 | RPE toggle: click lần 2 deselect | Positive | P1 |
| TC_WLS_016 | ExerciseSelector mở khi click "Add" | Positive | P0 |
| TC_WLS_017 | ExerciseSelector search | Positive | P1 |
| TC_WLS_018 | ExerciseSelector filter by muscle group | Positive | P1 |
| TC_WLS_019 | ExerciseSelector chọn exercise → thêm vào list | Positive | P0 |
| TC_WLS_020 | ExerciseSelector đóng khi chọn xong | Positive | P1 |
| TC_WLS_021 | Finish → summary screen hiển thị | Positive | P0 |
| TC_WLS_022 | Summary hiển thị duration | Positive | P1 |
| TC_WLS_023 | Summary hiển thị total volume | Positive | P1 |
| TC_WLS_024 | Summary hiển thị sets count | Positive | P1 |
| TC_WLS_025 | Save → workout lưu vào store | Positive | P0 |
| TC_WLS_026 | Save → onComplete callback triggered | Positive | P1 |
| TC_WLS_027 | Empty state khi không có exercises | Positive | P1 |
| TC_WLS_028 | Add exercise button visible | Positive | P2 |
| TC_WLS_029 | Back button → onBack callback | Positive | P1 |
| TC_WLS_030 | Elapsed timer format MM:SS | Positive | P2 |
| TC_WLS_031 | Weight input field editable | Positive | P2 |
| TC_WLS_032 | Reps input field editable | Positive | P2 |
| TC_WLS_033 | Logged sets hiển thị dưới exercise | Positive | P1 |
| TC_WLS_034 | Set number tự tăng | Positive | P1 |
| TC_WLS_035 | Total volume tính đúng công thức | Positive | P1 |
| TC_WLS_036 | Duration tính từ elapsed seconds | Positive | P2 |
| TC_WLS_037 | Workout ID unique (timestamp-based) | Positive | P2 |
| TC_WLS_038 | Set ID unique | Positive | P2 |
| TC_WLS_039 | resolveExercises invalid JSON → empty | Negative | P1 |
| TC_WLS_040 | resolveExercises undefined → empty | Negative | P1 |
| TC_WLS_041 | SetEditor weight controls | Positive | P1 |
| TC_WLS_042 | SetEditor reps controls | Positive | P1 |
| TC_WLS_043 | SetEditor RPE selector | Positive | P2 |
| TC_WLS_044 | SetEditor recent weight chips | Positive | P2 |
| TC_WLS_045 | SetEditor save → data passed correctly | Positive | P1 |
| TC_WLS_046 | SetEditor cancel → no changes | Positive | P2 |
| TC_WLS_047 | RestTimer SVG progress ring | Positive | P2 |
| TC_WLS_048 | RestTimer countdown accuracy | Positive | P1 |
| TC_WLS_049 | ExerciseSelector empty results | Negative | P2 |
| TC_WLS_050 | Dark mode: WorkoutLogger header | Positive | P2 |
| TC_WLS_051 | Dark mode: exercise sections | Positive | P2 |
| TC_WLS_052 | i18n: labels update on lang change | Positive | P2 |
| TC_WLS_053 | Multiple exercises independent state | Positive | P1 |
| TC_WLS_054 | Rapid set logging 10 sets | Edge | P2 |
| TC_WLS_055 | Memory: no leak after extended session | Edge | P3 |
| TC_WLS_056 | Search partial text "gáy" → tìm thấy exercises chứa "gáy" | Positive | P1 |
| TC_WLS_057 | Search Vietnamese diacritics "đẩy" → match chính xác | Positive | P1 |
| TC_WLS_058 | Search English name "bench press" | Positive | P1 |
| TC_WLS_059 | Search case-insensitive "SQUAT" | Edge | P2 |
| TC_WLS_060 | Search with spaces " squat " → trimmed | Edge | P3 |
| TC_WLS_061 | Search empty string → tất cả exercises hiển thị | Boundary | P2 |
| TC_WLS_062 | Search "xyznonexistent" → empty state | Negative | P2 |
| TC_WLS_063 | Search + filter chest → chỉ chest exercises match "đẩy" | Positive | P1 |
| TC_WLS_064 | Search + filter back | Negative | P2 |
| TC_WLS_065 | Search + filter legs | Negative | P2 |
| TC_WLS_066 | Filter muscle group: Ngực (chest) | Negative | P2 |
| TC_WLS_067 | Filter muscle group: Lưng (back) | Negative | P2 |
| TC_WLS_068 | Filter muscle group: Vai (shoulders) | Negative | P3 |
| TC_WLS_069 | Filter muscle group: Chân (legs) | Negative | P2 |
| TC_WLS_070 | Filter muscle group: Tay (arms) | Negative | P3 |
| TC_WLS_071 | Filter muscle group: Bụng (core) | Edge | P3 |
| TC_WLS_072 | Filter muscle group: Mông (glutes) | Edge | P3 |
| TC_WLS_073 | Clear search → full list restored | Edge | P3 |
| TC_WLS_074 | Search: type rồi xóa từng ký tự | Edge | P3 |
| TC_WLS_075 | Search special chars "%" → không crash | Negative | P2 |
| TC_WLS_076 | Filter "all" → shows everything | Positive | P1 |
| TC_WLS_077 | Switch specific group về "all" | Edge | P2 |
| TC_WLS_078 | Switch nhanh 7 muscle groups | Edge | P2 |
| TC_WLS_079 | Equipment filter: barbell only | Negative | P2 |
| TC_WLS_080 | Equipment filter: bodyweight only | Negative | P2 |
| TC_WLS_081 | Equipment filter: multiple | Edge | P3 |
| TC_WLS_082 | Combined: search + muscleGroup + equipment | Positive | P1 |
| TC_WLS_083 | Filter → no results → empty state | Negative | P2 |
| TC_WLS_084 | Select exercise → selector đóng | Positive | P0 |
| TC_WLS_085 | Select exercise → close callback | Negative | P2 |
| TC_WLS_086 | Modal backdrop click → đóng | Negative | P2 |
| TC_WLS_087 | Back gesture → đóng selector | Negative | P2 |
| TC_WLS_088 | Drag handle visible | Edge | P3 |
| TC_WLS_089 | Exercise item: nameVi, group, category, equipment | Negative | P2 |
| TC_WLS_090 | ExerciseSelector isOpen=false → null | Edge | P3 |
| TC_WLS_091 | Weight = 0 (min boundary) | Boundary | P1 |
| TC_WLS_092 | Weight = 2.5 | Boundary | P2 |
| TC_WLS_093 | Weight = 100 | Positive | P1 |
| TC_WLS_094 | Weight = 200 (heavy) | Edge | P2 |
| TC_WLS_095 | Weight = 500 (extreme) | Boundary | P3 |
| TC_WLS_096 | Weight=0, minus → stays 0 | Boundary | P1 |
| TC_WLS_097 | Weight=100, plus 10 lần → 125 | Edge | P2 |
| TC_WLS_098 | Weight=5, minus 3 lần → 0 | Boundary | P1 |
| TC_WLS_099 | Direct input weight=67.5 | Edge | P2 |
| TC_WLS_100 | Direct input weight negative → 0 | Negative | P0 |
| TC_WLS_101 | Direct input weight=0 | Boundary | P2 |
| TC_WLS_102 | Direct input weight decimal 0.5 | Edge | P3 |
| TC_WLS_103 | Direct input weight=999 | Edge | P3 |
| TC_WLS_104 | Weight plus: +2.5 each | Positive | P0 |
| TC_WLS_105 | Weight minus: -2.5 each | Positive | P1 |
| TC_WLS_106 | Weight input type="number" | Edge | P3 |
| TC_WLS_107 | Weight display "Xkg × Y" | Negative | P2 |
| TC_WLS_108 | Multiple exercises: independent weight | Negative | P2 |
| TC_WLS_109 | Rapid weight increment 20x | Edge | P3 |
| TC_WLS_110 | Weight persist across sets | Edge | P3 |
| TC_WLS_111 | Reps=0 (WorkoutLogger boundary) | Boundary | P2 |
| TC_WLS_112 | Reps=1 (SetEditor min) | Boundary | P1 |
| TC_WLS_113 | Reps=5 | Positive | P1 |
| TC_WLS_114 | Reps=12 | Positive | P2 |
| TC_WLS_115 | Reps=50 | Edge | P3 |
| TC_WLS_116 | Reps=100 | Edge | P3 |
| TC_WLS_117 | Reps negative → Math.max(0) | Negative | P1 |
| TC_WLS_118 | Reps input type="number" | Edge | P3 |
| TC_WLS_119 | Reps display in logged set | Negative | P2 |
| TC_WLS_120 | Multiple exercises: independent reps | Negative | P2 |
| TC_WLS_121 | Reps=0 → volume contribution = 0 | Boundary | P2 |
| TC_WLS_122 | SetEditor: reps min 1, decrement at 1 | Boundary | P0 |
| TC_WLS_123 | SetEditor: reps 1→2 | Positive | P2 |
| TC_WLS_124 | SetEditor: input reps=0 → 1 | Negative | P1 |
| TC_WLS_125 | Rapid reps increment 20x | Edge | P3 |
| TC_WLS_126 | Select RPE 6 | Boundary | P2 |
| TC_WLS_127 | Select RPE 7 | Positive | P2 |
| TC_WLS_128 | Select RPE 8 | Positive | P2 |
| TC_WLS_129 | Select RPE 9 | Positive | P2 |
| TC_WLS_130 | Select RPE 10 | Boundary | P2 |
| TC_WLS_131 | RPE toggle: 8 → deselect | Edge | P1 |
| TC_WLS_132 | RPE switch: 7→9 | Edge | P2 |
| TC_WLS_133 | No RPE → undefined in set | Negative | P3 |
| TC_WLS_134 | RPE display "RPE X" | Positive | P2 |
| TC_WLS_135 | RPE not shown when undefined | Negative | P2 |
| TC_WLS_136 | RPE styling: selected emerald | Edge | P3 |
| TC_WLS_137 | SetEditor RPE aria-pressed | Edge | P3 |
| TC_WLS_138 | SetEditor RPE toggle | Edge | P2 |
| TC_WLS_139 | Multiple exercises: independent RPE | Negative | P2 |
| TC_WLS_140 | RPE options: 5 buttons render | Boundary | P1 |
| TC_WLS_141 | RestTimer starts 90s | Positive | P0 |
| TC_WLS_142 | Countdown: 90→89→88 | Positive | P0 |
| TC_WLS_143 | Timer reaches 0 → onComplete | Positive | P0 |
| TC_WLS_144 | Display "1:30" at start | Edge | P1 |
| TC_WLS_145 | Display "0:01" near end | Boundary | P2 |
| TC_WLS_146 | Display "0:00" at zero | Boundary | P2 |
| TC_WLS_147 | +30s: 90→120 | Positive | P1 |
| TC_WLS_148 | +30s at 10s → 40s | Edge | P2 |
| TC_WLS_149 | +30s twice → +60s | Edge | P2 |
| TC_WLS_150 | +30s updates progress ring | Edge | P2 |
| TC_WLS_151 | Skip → immediate close | Positive | P0 |
| TC_WLS_152 | Skip at 90s | Edge | P2 |
| TC_WLS_153 | Skip at 1s | Edge | P3 |
| TC_WLS_154 | Progress ring 100% at start | Boundary | P2 |
| TC_WLS_155 | Progress ring 50% | Edge | P3 |
| TC_WLS_156 | Progress ring 0% | Boundary | P2 |
| TC_WLS_157 | Progress ring SVG role="progressbar" | Edge | P3 |
| TC_WLS_158 | Timer isVisible=false → null | Negative | P1 |
| TC_WLS_159 | Timer overlay bg-black/60 | Edge | P3 |
| TC_WLS_160 | Timer dialog role="dialog" | Edge | P3 |
| TC_WLS_161 | Timer aria-label | Edge | P3 |
| TC_WLS_162 | +30s button text | Negative | P3 |
| TC_WLS_163 | Skip button text | Negative | P3 |
| TC_WLS_164 | Timer icon present | Edge | P3 |
| TC_WLS_165 | Multiple rest timers sequence | Edge | P2 |
| TC_WLS_166 | SetEditor opens with initials | Positive | P0 |
| TC_WLS_167 | SetEditor weight dec: 100→97.5 | Positive | P1 |
| TC_WLS_168 | SetEditor weight inc: 100→102.5 | Positive | P1 |
| TC_WLS_169 | SetEditor weight 0→minus stays 0 | Boundary | P1 |
| TC_WLS_170 | SetEditor weight direct input | Edge | P2 |
| TC_WLS_171 | SetEditor reps dec: 5→4 | Positive | P1 |
| TC_WLS_172 | SetEditor reps inc: 5→6 | Positive | P1 |
| TC_WLS_173 | SetEditor reps 1→minus stays 1 | Boundary | P1 |
| TC_WLS_174 | SetEditor reps negative → 1 | Negative | P1 |
| TC_WLS_175 | Recent chips: 0 → hidden | Negative | P2 |
| TC_WLS_176 | Recent chips: 1 | Edge | P3 |
| TC_WLS_177 | Recent chips: 3 | Edge | P3 |
| TC_WLS_178 | Recent chips: 5 | Edge | P3 |
| TC_WLS_179 | Click chip → weight updates | Positive | P1 |
| TC_WLS_180 | Click chip → highlighted | Edge | P3 |
| TC_WLS_181 | Save → onSave({weight,reps,rpe}) | Positive | P0 |
| TC_WLS_182 | Cancel → onCancel | Negative | P1 |
| TC_WLS_183 | Close X → onCancel | Negative | P2 |
| TC_WLS_184 | SetEditor isVisible=false → null | Negative | P1 |
| TC_WLS_185 | SetEditor role="dialog" | Edge | P3 |
| TC_WLS_186 | 1 exercise in session | Positive | P0 |
| TC_WLS_187 | 3 exercises in session | Positive | P1 |
| TC_WLS_188 | 5 exercises in session | Positive | P2 |
| TC_WLS_189 | 10 exercises in session | Edge | P3 |
| TC_WLS_190 | Add exercise via selector | Positive | P0 |
| TC_WLS_191 | Exercise nameVi displayed | Negative | P1 |
| TC_WLS_192 | Logged sets display | Boundary | P2 |
| TC_WLS_193 | Multiple sets: setNumber increments | Boundary | P1 |
| TC_WLS_194 | Finish → summary | Positive | P0 |
| TC_WLS_195 | Summary duration MM:SS | Positive | P1 |
| TC_WLS_196 | Summary volume | Positive | P1 |
| TC_WLS_197 | Summary sets count | Boundary | P2 |
| TC_WLS_198 | Save calls addWorkout+addWorkoutSet | Positive | P0 |
| TC_WLS_199 | Save: onComplete with workout | Positive | P1 |
| TC_WLS_200 | Empty exercises state | Negative | P2 |
| TC_WLS_201 | Back button → onBack | Positive | P1 |
| TC_WLS_202 | Timer: 0s → "00:00" | Boundary | P2 |
| TC_WLS_203 | Timer: 65s → "01:05" | Boundary | P2 |
| TC_WLS_204 | Timer: 3661s → "61:01" | Edge | P2 |
| TC_WLS_205 | Log set weight=0, reps=0 | Boundary | P2 |
| TC_WLS_206 | Dark mode: header emerald | Edge | P3 |
| TC_WLS_207 | Dark mode: sections bg-slate-800 | Edge | P3 |
| TC_WLS_208 | Dark mode: inputs contrast | Negative | P3 |
| TC_WLS_209 | Dark mode: RPE buttons | Negative | P3 |
| TC_WLS_210 | Workout 0 sets → save volume=0 | Negative | P2 |

---

## Chi tiết Test Cases

##### TC_WLS_001: WorkoutLogger mở full-screen overlay
- **Pre-conditions**: User đã click "Bắt đầu" từ TrainingPlanView, planDay tồn tại
- **Steps**:
  1. Click nút "Bắt đầu" trên TrainingPlanView
  2. Quan sát WorkoutLogger render
- **Expected Result**: WorkoutLogger mở full-screen (fixed inset-0 z-50), data-testid="workout-logger" visible, header sticky hiển thị
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_002: Elapsed timer bắt đầu đếm
- **Pre-conditions**: WorkoutLogger vừa mở
- **Steps**:
  1. Quan sát data-testid="elapsed-timer" ngay khi component mount
  2. Chờ 3 giây
- **Expected Result**: Timer bắt đầu từ "00:00" và tăng mỗi giây (interval 1s), format MM:SS
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_003: Exercises từ plan load tự động
- **Pre-conditions**: WorkoutLogger mở từ planDay có 3 exercises trong JSON
- **Steps**:
  1. Quan sát exercise sections
- **Expected Result**: currentExercises = resolveExercises(planDay.exercises), 3 exercise sections render với nameVi
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_004: Log set: nhập weight + reps → confirm
- **Pre-conditions**: WorkoutLogger có exercise, weight=80, reps=10
- **Steps**:
  1. Nhập weight = 80 vào weight input
  2. Nhập reps = 10 vào reps input
  3. Click log-set button
- **Expected Result**: WorkoutSet tạo: {weightKg: 80, reps: 10, setNumber: 1}, hiển thị trong logged sets area
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_005: RestTimer hiển thị sau log set
- **Pre-conditions**: Vừa log set thành công
- **Steps**:
  1. Quan sát sau khi click "Log Set"
- **Expected Result**: showRestTimer = true, RestTimer overlay hiển thị (rest-timer-overlay), countdown từ 90s
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_006: RestTimer countdown đến 0 → auto complete
- **Pre-conditions**: RestTimer đang countdown, remaining gần 0
- **Steps**:
  1. Chờ timer countdown đến 0
- **Expected Result**: remaining === 0 → onComplete() → showRestTimer = false, RestTimer đóng
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_007: RestTimer +30s extend
- **Pre-conditions**: RestTimer visible, remaining = 60
- **Steps**:
  1. Click add-time-button
- **Expected Result**: remaining += 30 = 90, totalDuration += 30, timer tiếp tục countdown từ 90
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_008: RestTimer skip
- **Pre-conditions**: RestTimer visible
- **Steps**:
  1. Click skip-button
- **Expected Result**: onSkip() → showRestTimer = false, timer đóng ngay lập tức
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_009: Weight increment +2.5kg
- **Pre-conditions**: weight = 50 cho exercise
- **Steps**:
  1. Click weight-plus button
- **Expected Result**: weight = 52.5 (WEIGHT_INCREMENT = 2.5)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_010: Weight decrement -2.5kg
- **Pre-conditions**: weight = 50 cho exercise
- **Steps**:
  1. Click weight-minus button
- **Expected Result**: weight = 47.5
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_011: Weight không giảm dưới 0
- **Pre-conditions**: weight = 0
- **Steps**:
  1. Click weight-minus button
- **Expected Result**: Math.max(0, 0 - 2.5) = 0, weight vẫn = 0
- **Priority**: P1 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_012: Reps increment +1
- **Pre-conditions**: reps = 10
- **Steps**:
  1. Click hoặc nhập reps tăng 1
- **Expected Result**: reps = 11
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_013: Reps decrement -1
- **Pre-conditions**: reps = 10
- **Steps**:
  1. Click hoặc nhập reps giảm 1
- **Expected Result**: reps = 9
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_014: RPE selector: chọn từng giá trị
- **Pre-conditions**: Exercise section visible, RPE chưa chọn
- **Steps**:
  1. Click RPE 8 button
- **Expected Result**: rpe = 8, button active (emerald-500), các RPE khác inactive
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_015: RPE toggle: click lần 2 deselect
- **Pre-conditions**: rpe = 8
- **Steps**:
  1. Click RPE 8 lần nữa
- **Expected Result**: rpe = undefined (toggle: same value → deselect)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_016: ExerciseSelector mở khi click "Add"
- **Pre-conditions**: WorkoutLogger mở
- **Steps**:
  1. Click add-exercise-button
- **Expected Result**: showExerciseSelector = true, ExerciseSelector modal visible
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_017: ExerciseSelector search
- **Pre-conditions**: ExerciseSelector đang mở
- **Steps**:
  1. Nhập "gánh" vào search input
- **Expected Result**: Filtered exercises chỉ chứa items có nameVi/nameEn match "gánh"
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_018: ExerciseSelector filter by muscle group
- **Pre-conditions**: ExerciseSelector đang mở
- **Steps**:
  1. Click chip "Ngực"
- **Expected Result**: Chỉ chest exercises hiển thị
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_019: ExerciseSelector chọn exercise → thêm vào list
- **Pre-conditions**: ExerciseSelector hiển thị exercises
- **Steps**:
  1. Click 1 exercise item
- **Expected Result**: onSelect(exercise) → exercise thêm vào currentExercises, selector đóng
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_020: ExerciseSelector đóng khi chọn xong
- **Pre-conditions**: Vừa chọn exercise
- **Steps**:
  1. Verify selector state
- **Expected Result**: showExerciseSelector = false, selector không còn visible
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_021: Finish → summary screen hiển thị
- **Pre-conditions**: Đã log vài sets
- **Steps**:
  1. Click finish-button
- **Expected Result**: showSummary = true, workout-summary screen render
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_022: Summary hiển thị duration
- **Pre-conditions**: Summary screen visible, elapsedSeconds = 305
- **Steps**:
  1. Quan sát summary-duration
- **Expected Result**: Duration hiển thị formatElapsed(305) = "05:05"
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_023: Summary hiển thị total volume
- **Pre-conditions**: Logged sets: 80×10, 80×8
- **Steps**:
  1. Quan sát summary-volume
- **Expected Result**: totalVolume = 800 + 640 = 1440 kg
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_024: Summary hiển thị sets count
- **Pre-conditions**: Đã log 5 sets
- **Steps**:
  1. Quan sát summary-sets
- **Expected Result**: Hiển thị "5"
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_025: Save → workout lưu vào store
- **Pre-conditions**: Summary screen hiển thị
- **Steps**:
  1. Click save-workout-button
- **Expected Result**: addWorkout(workout) gọi, workout lưu vào fitnessStore
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_026: Save → onComplete callback triggered
- **Pre-conditions**: Đã click save
- **Steps**:
  1. Verify callback
- **Expected Result**: onComplete(workout) triggered, chuyển về history tab
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_027: Empty state khi không có exercises
- **Pre-conditions**: currentExercises = []
- **Steps**:
  1. Quan sát WorkoutLogger body
- **Expected Result**: data-testid="empty-state" visible, message "Chưa có bài tập"
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_028: Add exercise button visible
- **Pre-conditions**: WorkoutLogger mở
- **Steps**:
  1. Quan sát bottom bar
- **Expected Result**: add-exercise-button visible với Plus icon và dashed border
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_029: Back button → onBack callback
- **Pre-conditions**: WorkoutLogger mở
- **Steps**:
  1. Click back-button
- **Expected Result**: onBack() triggered, quay về TrainingPlanView
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_030: Elapsed timer format MM:SS
- **Pre-conditions**: elapsedSeconds = 65
- **Steps**:
  1. Quan sát elapsed-timer
- **Expected Result**: formatElapsed(65) = "01:05"
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_031: Weight input field editable
- **Pre-conditions**: Exercise section visible
- **Steps**:
  1. Click weight input
  2. Nhập số
- **Expected Result**: Input editable, type="number", giá trị cập nhật
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_032: Reps input field editable
- **Pre-conditions**: Exercise section visible
- **Steps**:
  1. Click reps input
  2. Nhập số
- **Expected Result**: Input editable, type="number"
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_033: Logged sets hiển thị dưới exercise
- **Pre-conditions**: Đã log 2 sets cho exercise
- **Steps**:
  1. Quan sát dưới exercise heading
- **Expected Result**: 2 logged-set divs: "Set 1: 80kg × 10", "Set 2: 80kg × 8"
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_034: Set number tự tăng
- **Pre-conditions**: Log set lần 3 cho cùng exercise
- **Steps**:
  1. Log 3 sets liên tiếp
- **Expected Result**: setNumber tăng: 1, 2, 3 (existingCount + 1)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_035: Total volume tính đúng công thức
- **Pre-conditions**: Logged: 100×5=500, 80×8=640
- **Steps**:
  1. Click finish
  2. Check volume
- **Expected Result**: totalVolume = reduce(sum, set.weightKg * (set.reps ?? 0)) = 1140
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_036: Duration tính từ elapsed seconds
- **Pre-conditions**: elapsedSeconds = 600
- **Steps**:
  1. Click finish → save
- **Expected Result**: durationMin = Math.floor(600/60) = 10
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_037: Workout ID unique (timestamp-based)
- **Pre-conditions**: Save workout
- **Steps**:
  1. Verify workout.id
- **Expected Result**: id = "workout-{Date.now()}", unique per save
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_038: Set ID unique
- **Pre-conditions**: Log multiple sets
- **Steps**:
  1. Verify set IDs
- **Expected Result**: id = "set-{Date.now()}-{setNumber}", unique per set
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_039: resolveExercises invalid JSON → empty
- **Pre-conditions**: planDay.exercises = "invalid{json"
- **Steps**:
  1. Load WorkoutLogger
- **Expected Result**: resolveExercises catch block → return [], currentExercises = []
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_040: resolveExercises undefined → empty
- **Pre-conditions**: planDay.exercises = undefined
- **Steps**:
  1. Load WorkoutLogger
- **Expected Result**: resolveExercises(!exercisesJson) → return []
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_041: SetEditor weight controls
- **Pre-conditions**: SetEditor visible
- **Steps**:
  1. Click weight plus, minus, input
- **Expected Result**: Weight adjustable via buttons and input, enforces MIN_WEIGHT=0
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_042: SetEditor reps controls
- **Pre-conditions**: SetEditor visible
- **Steps**:
  1. Click reps plus, minus, input
- **Expected Result**: Reps adjustable, enforces MIN_REPS=1
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_043: SetEditor RPE selector
- **Pre-conditions**: SetEditor visible
- **Steps**:
  1. Click RPE buttons
- **Expected Result**: RPE selectable/deselectable, aria-pressed updates
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_044: SetEditor recent weight chips
- **Pre-conditions**: SetEditor visible, recentWeights=[60,65,70]
- **Steps**:
  1. Click chip 65
- **Expected Result**: weight = 65, chip highlighted
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_045: SetEditor save → data passed correctly
- **Pre-conditions**: SetEditor: weight=80, reps=10, rpe=8
- **Steps**:
  1. Click save
- **Expected Result**: onSave({weight:80, reps:10, rpe:8}) triggered
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_046: SetEditor cancel → no changes
- **Pre-conditions**: SetEditor visible
- **Steps**:
  1. Click cancel
- **Expected Result**: onCancel() triggered, no data saved
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_047: RestTimer SVG progress ring
- **Pre-conditions**: RestTimer visible
- **Steps**:
  1. Inspect progress-ring SVG
- **Expected Result**: SVG role="progressbar", circular progress ring visible, dashoffset animates
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_048: RestTimer countdown accuracy
- **Pre-conditions**: RestTimer visible, start = 90
- **Steps**:
  1. Wait 10 seconds
  2. Check remaining
- **Expected Result**: remaining ≈ 80 (within 1s tolerance of interval)
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_049: ExerciseSelector empty results
- **Pre-conditions**: ExerciseSelector open, search "xyznonexist"
- **Steps**:
  1. Nhập search text không match
- **Expected Result**: exercise-empty-state visible, "Không tìm thấy" message
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_050: Dark mode: WorkoutLogger header
- **Pre-conditions**: Dark mode enabled
- **Steps**:
  1. Inspect workout-header
- **Expected Result**: Header emerald-600 bg, text white, visible
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_051: Dark mode: exercise sections
- **Pre-conditions**: Dark mode enabled
- **Steps**:
  1. Inspect exercise sections
- **Expected Result**: dark:bg-slate-800, text readable
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_052: i18n: labels update on lang change
- **Pre-conditions**: WorkoutLogger open
- **Steps**:
  1. Switch language vi → en
- **Expected Result**: All labels update (logger.back, logger.finish, etc.)
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_053: Multiple exercises independent state
- **Pre-conditions**: WorkoutLogger có 2 exercises
- **Steps**:
  1. Set ex1 weight=80, ex2 weight=60
- **Expected Result**: setInputs tracks independently per exerciseId
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_054: Rapid set logging 10 sets
- **Pre-conditions**: Exercise visible
- **Steps**:
  1. Log 10 sets nhanh liên tục
- **Expected Result**: Tất cả 10 sets logged, setNumber 1-10, không crash
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_055: Memory: no leak after extended session
- **Pre-conditions**: WorkoutLogger open 10+ minutes
- **Steps**:
  1. Monitor memory during extended session
- **Expected Result**: No significant heap growth, intervals cleaned properly
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |


### ExerciseSelector - Tìm kiếm (TC_WLS_056 → TC_WLS_075)
##### TC_WLS_056: Search partial text "gáy" → tìm thấy exercises chứa "gáy"
- **Pre-conditions**: ExerciseSelector đang mở
- **Steps**:
  1. Nhập "gáy" vào search input
  2. Quan sát filtered results
- **Expected Result**: Chỉ exercises có nameVi chứa "gáy" hiển thị, case-insensitive
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_057: Search Vietnamese diacritics "đẩy" → match chính xác
- **Pre-conditions**: ExerciseSelector đang mở
- **Steps**:
  1. Nhập "đẩy" vào search input
- **Expected Result**: Exercises có "đẩy" trong nameVi match (VD: "Đẩy ngực nằm")
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_058: Search English name "bench press"
- **Pre-conditions**: ExerciseSelector đang mở, exercises có nameEn
- **Steps**:
  1. Nhập "bench press"
- **Expected Result**: Exercises có nameEn chứa "bench press" hiển thị
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_059: Search case-insensitive "SQUAT"
- **Pre-conditions**: ExerciseSelector đang mở
- **Steps**:
  1. Nhập "SQUAT"
- **Expected Result**: Match tìm thấy dù input uppercase (query.toLowerCase())
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_060: Search with spaces " squat " → trimmed
- **Pre-conditions**: ExerciseSelector đang mở
- **Steps**:
  1. Nhập " squat "
- **Expected Result**: Spaces được trim, results match "squat"
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_061: Search empty string → tất cả exercises hiển thị
- **Pre-conditions**: ExerciseSelector đang mở, search trống
- **Steps**:
  1. Clear search input
- **Expected Result**: allExercises hiển thị đầy đủ
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_062: Search "xyznonexistent" → empty state
- **Pre-conditions**: ExerciseSelector đang mở
- **Steps**:
  1. Nhập "xyznonexistent"
- **Expected Result**: filteredExercises = [], exercise-empty-state visible
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_063: Search + filter chest → chỉ chest exercises match "đẩy"
- **Pre-conditions**: ExerciseSelector đang mở
- **Steps**:
  1. Chọn "Ngực"
  2. Nhập "đẩy"
- **Expected Result**: Chỉ chest exercises AND nameVi chứa "đẩy"
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_064: Search + filter back
- **Pre-conditions**: ExerciseSelector đang mở
- **Steps**:
  1. Chọn "Lưng"
  2. Nhập "kéo"
- **Expected Result**: Chỉ back exercises AND nameVi chứa "kéo"
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_065: Search + filter legs
- **Pre-conditions**: ExerciseSelector đang mở
- **Steps**:
  1. Chọn "Chân"
  2. Nhập "gánh"
- **Expected Result**: Chỉ legs exercises matching
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_066: Filter muscle group: Ngực (chest)
- **Pre-conditions**: ExerciseSelector đang mở
- **Steps**:
  1. Click chip "Ngực"
- **Expected Result**: Chỉ exercises muscleGroup="chest" hiển thị
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_067: Filter muscle group: Lưng (back)
- **Pre-conditions**: ExerciseSelector đang mở
- **Steps**:
  1. Click chip "Lưng"
- **Expected Result**: Chỉ exercises muscleGroup="back" hiển thị
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_068: Filter muscle group: Vai (shoulders)
- **Pre-conditions**: ExerciseSelector đang mở
- **Steps**:
  1. Click chip "Vai"
- **Expected Result**: Chỉ exercises muscleGroup="shoulders" hiển thị
- **Priority**: P3 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_069: Filter muscle group: Chân (legs)
- **Pre-conditions**: ExerciseSelector đang mở
- **Steps**:
  1. Click chip "Chân"
- **Expected Result**: Chỉ exercises muscleGroup="legs" hiển thị
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_070: Filter muscle group: Tay (arms)
- **Pre-conditions**: ExerciseSelector đang mở
- **Steps**:
  1. Click chip "Tay"
- **Expected Result**: Chỉ exercises muscleGroup="arms" hiển thị
- **Priority**: P3 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_071: Filter muscle group: Bụng (core)
- **Pre-conditions**: ExerciseSelector đang mở
- **Steps**:
  1. Click chip "Bụng"
- **Expected Result**: Chỉ exercises muscleGroup="core" hiển thị
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_072: Filter muscle group: Mông (glutes)
- **Pre-conditions**: ExerciseSelector đang mở
- **Steps**:
  1. Click chip "Mông"
- **Expected Result**: Chỉ exercises muscleGroup="glutes" hiển thị
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_073: Clear search → full list restored
- **Pre-conditions**: Search "bench"
- **Steps**:
  1. Clear input
- **Expected Result**: Full list restored
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_074: Search: type rồi xóa từng ký tự
- **Pre-conditions**: Selector mở
- **Steps**:
  1. Nhập "gánh"
  2. Xóa chars
- **Expected Result**: Results update realtime
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_075: Search special chars "%" → không crash
- **Pre-conditions**: Selector mở
- **Steps**:
  1. Nhập "%"
- **Expected Result**: Không crash, 0 results
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |


### ExerciseSelector - Kết hợp Filter (TC_WLS_076 → TC_WLS_090)
##### TC_WLS_076: Filter "all" → shows everything
- **Pre-conditions**: Filter = chest
- **Steps**:
  1. Click "Tất cả"
- **Expected Result**: selectedMuscleGroup="all", full list
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_077: Switch specific group về "all"
- **Pre-conditions**: Filter = chest
- **Steps**:
  1. Click "Tất cả"
- **Expected Result**: List expand
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_078: Switch nhanh 7 muscle groups
- **Pre-conditions**: Selector mở
- **Steps**:
  1. Click 7 groups nhanh
- **Expected Result**: Không crash
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_079: Equipment filter: barbell only
- **Pre-conditions**: equipmentFilter=["barbell"]
- **Steps**:
  1. Quan sát list
- **Expected Result**: Chỉ barbell exercises
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_080: Equipment filter: bodyweight only
- **Pre-conditions**: equipmentFilter=["bodyweight"]
- **Steps**:
  1. Quan sát
- **Expected Result**: Chỉ bodyweight exercises
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_081: Equipment filter: multiple
- **Pre-conditions**: equipmentFilter=["barbell","dumbbell"]
- **Steps**:
  1. Quan sát
- **Expected Result**: barbell OR dumbbell exercises
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_082: Combined: search + muscleGroup + equipment
- **Pre-conditions**: All 3 filters set
- **Steps**:
  1. Verify results
- **Expected Result**: Only items matching ALL 3
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_083: Filter → no results → empty state
- **Pre-conditions**: Filter combo no match
- **Steps**:
  1. Apply filters
- **Expected Result**: exercise-empty-state visible
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_084: Select exercise → selector đóng
- **Pre-conditions**: Exercises visible
- **Steps**:
  1. Click exercise item
- **Expected Result**: onSelect+onClose triggered
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_085: Select exercise → close callback
- **Pre-conditions**: Selector mở
- **Steps**:
  1. Click exercise
- **Expected Result**: handleSelect calls onSelect+onClose
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_086: Modal backdrop click → đóng
- **Pre-conditions**: Selector mở
- **Steps**:
  1. Click backdrop
- **Expected Result**: onClose triggered
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_087: Back gesture → đóng selector
- **Pre-conditions**: Selector mở, mobile
- **Steps**:
  1. Press Back
- **Expected Result**: useModalBackHandler triggers onClose
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_088: Drag handle visible
- **Pre-conditions**: Selector mở
- **Steps**:
  1. Inspect top
- **Expected Result**: Handle div visible
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_089: Exercise item: nameVi, group, category, equipment
- **Pre-conditions**: Exercises visible
- **Steps**:
  1. Inspect 1 item
- **Expected Result**: nameVi bold, group label, category, equipment list
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_090: ExerciseSelector isOpen=false → null
- **Pre-conditions**: isOpen=false
- **Steps**:
  1. Inspect DOM
- **Expected Result**: return null
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |


### Set Logging - Weight (TC_WLS_091 → TC_WLS_110)
##### TC_WLS_091: Weight = 0 (min boundary)
- **Pre-conditions**: Exercise visible
- **Steps**:
  1. Set weight=0
- **Expected Result**: weight=0 accepted
- **Priority**: P1 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_092: Weight = 2.5
- **Pre-conditions**: weight=0
- **Steps**:
  1. Click plus
- **Expected Result**: weight=2.5
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_093: Weight = 100
- **Pre-conditions**: Exercise visible
- **Steps**:
  1. Input 100
- **Expected Result**: weight=100
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_094: Weight = 200 (heavy)
- **Pre-conditions**: Exercise visible
- **Steps**:
  1. Input 200
- **Expected Result**: weight=200
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_095: Weight = 500 (extreme)
- **Pre-conditions**: Exercise visible
- **Steps**:
  1. Input 500
- **Expected Result**: weight=500, no upper limit
- **Priority**: P3 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_096: Weight=0, minus → stays 0
- **Pre-conditions**: weight=0
- **Steps**:
  1. Click minus
- **Expected Result**: Math.max(0,0-2.5)=0
- **Priority**: P1 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_097: Weight=100, plus 10 lần → 125
- **Pre-conditions**: weight=100
- **Steps**:
  1. Click plus 10x
- **Expected Result**: weight=125
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_098: Weight=5, minus 3 lần → 0
- **Pre-conditions**: weight=5
- **Steps**:
  1. Click minus 3x
- **Expected Result**: 5→2.5→0→0
- **Priority**: P1 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_099: Direct input weight=67.5
- **Pre-conditions**: Exercise visible
- **Steps**:
  1. Input "67.5"
- **Expected Result**: weight=67.5
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_100: Direct input weight negative → 0
- **Pre-conditions**: Exercise visible
- **Steps**:
  1. Input "-10"
- **Expected Result**: Clamped to 0
- **Priority**: P0 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_101: Direct input weight=0
- **Pre-conditions**: Exercise visible
- **Steps**:
  1. Input "0"
- **Expected Result**: weight=0
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_102: Direct input weight decimal 0.5
- **Pre-conditions**: Exercise visible
- **Steps**:
  1. Input "0.5"
- **Expected Result**: weight=0.5
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_103: Direct input weight=999
- **Pre-conditions**: Exercise visible
- **Steps**:
  1. Input "999"
- **Expected Result**: weight=999
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_104: Weight plus: +2.5 each
- **Pre-conditions**: weight=50
- **Steps**:
  1. Click plus 2x
- **Expected Result**: weight=55
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_105: Weight minus: -2.5 each
- **Pre-conditions**: weight=55
- **Steps**:
  1. Click minus
- **Expected Result**: weight=52.5
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_106: Weight input type="number"
- **Pre-conditions**: Exercise visible
- **Steps**:
  1. Inspect input
- **Expected Result**: type="number"
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_107: Weight display "Xkg × Y"
- **Pre-conditions**: Logged set: 80kg × 10
- **Steps**:
  1. Quan sát display
- **Expected Result**: "80kg × 10"
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_108: Multiple exercises: independent weight
- **Pre-conditions**: 2 exercises
- **Steps**:
  1. Set different weights
- **Expected Result**: Independent per exerciseId
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_109: Rapid weight increment 20x
- **Pre-conditions**: weight=0
- **Steps**:
  1. Click plus 20x
- **Expected Result**: weight=50
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_110: Weight persist across sets
- **Pre-conditions**: weight=80, log set
- **Steps**:
  1. Log set, rest, check weight
- **Expected Result**: weight stays 80
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |


### Set Logging - Reps (TC_WLS_111 → TC_WLS_125)
##### TC_WLS_111: Reps=0 (WorkoutLogger boundary)
- **Pre-conditions**: Exercise visible
- **Steps**:
  1. Set reps=0
- **Expected Result**: reps=0 accepted
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_112: Reps=1 (SetEditor min)
- **Pre-conditions**: SetEditor mở
- **Steps**:
  1. Set reps=1
- **Expected Result**: reps=1
- **Priority**: P1 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_113: Reps=5
- **Pre-conditions**: Exercise visible
- **Steps**:
  1. Input 5
- **Expected Result**: reps=5
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_114: Reps=12
- **Pre-conditions**: Exercise visible
- **Steps**:
  1. Input 12
- **Expected Result**: reps=12
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_115: Reps=50
- **Pre-conditions**: Exercise visible
- **Steps**:
  1. Input 50
- **Expected Result**: reps=50
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_116: Reps=100
- **Pre-conditions**: Exercise visible
- **Steps**:
  1. Input 100
- **Expected Result**: reps=100
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_117: Reps negative → Math.max(0)
- **Pre-conditions**: Exercise visible
- **Steps**:
  1. Input -5
- **Expected Result**: reps=0
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_118: Reps input type="number"
- **Pre-conditions**: Exercise visible
- **Steps**:
  1. Inspect
- **Expected Result**: type="number"
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_119: Reps display in logged set
- **Pre-conditions**: Logged: 60×8
- **Steps**:
  1. Quan sát
- **Expected Result**: "60kg × 8"
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_120: Multiple exercises: independent reps
- **Pre-conditions**: 2 exercises
- **Steps**:
  1. Different reps
- **Expected Result**: Independent
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_121: Reps=0 → volume contribution = 0
- **Pre-conditions**: Log: weight=100, reps=0
- **Steps**:
  1. Check volume
- **Expected Result**: 100×0=0
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_122: SetEditor: reps min 1, decrement at 1
- **Pre-conditions**: SetEditor reps=1
- **Steps**:
  1. Click minus
- **Expected Result**: Math.max(1,0)=1
- **Priority**: P0 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_123: SetEditor: reps 1→2
- **Pre-conditions**: SetEditor reps=1
- **Steps**:
  1. Click plus
- **Expected Result**: reps=2
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_124: SetEditor: input reps=0 → 1
- **Pre-conditions**: SetEditor
- **Steps**:
  1. Input "0"
- **Expected Result**: Math.max(1,0)=1
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_125: Rapid reps increment 20x
- **Pre-conditions**: SetEditor reps=1
- **Steps**:
  1. Click plus 20x
- **Expected Result**: reps=21
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |


### RPE Selection (TC_WLS_126 → TC_WLS_140)
##### TC_WLS_126: Select RPE 6
- **Pre-conditions**: Exercise visible, no RPE
- **Steps**:
  1. Click rpe-6
- **Expected Result**: rpe=6, button active
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_127: Select RPE 7
- **Pre-conditions**: Exercise visible, no RPE
- **Steps**:
  1. Click rpe-7
- **Expected Result**: rpe=7, button active
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_128: Select RPE 8
- **Pre-conditions**: Exercise visible, no RPE
- **Steps**:
  1. Click rpe-8
- **Expected Result**: rpe=8, button active
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_129: Select RPE 9
- **Pre-conditions**: Exercise visible, no RPE
- **Steps**:
  1. Click rpe-9
- **Expected Result**: rpe=9, button active
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_130: Select RPE 10
- **Pre-conditions**: Exercise visible, no RPE
- **Steps**:
  1. Click rpe-10
- **Expected Result**: rpe=10, button active
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_131: RPE toggle: 8 → deselect
- **Pre-conditions**: rpe=8
- **Steps**:
  1. Click rpe-8
- **Expected Result**: rpe=undefined
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_132: RPE switch: 7→9
- **Pre-conditions**: rpe=7
- **Steps**:
  1. Click rpe-9
- **Expected Result**: rpe=9
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_133: No RPE → undefined in set
- **Pre-conditions**: No RPE
- **Steps**:
  1. Log set
- **Expected Result**: set.rpe=undefined
- **Priority**: P3 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_134: RPE display "RPE X"
- **Pre-conditions**: Set logged rpe=9
- **Steps**:
  1. Inspect
- **Expected Result**: "RPE 9" visible
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_135: RPE not shown when undefined
- **Pre-conditions**: Set logged no RPE
- **Steps**:
  1. Inspect
- **Expected Result**: No RPE label
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_136: RPE styling: selected emerald
- **Pre-conditions**: rpe=8
- **Steps**:
  1. Inspect buttons
- **Expected Result**: RPE 8: emerald, others: slate
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_137: SetEditor RPE aria-pressed
- **Pre-conditions**: SetEditor rpe=9
- **Steps**:
  1. Inspect rpe-button-9
- **Expected Result**: aria-pressed="true"
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_138: SetEditor RPE toggle
- **Pre-conditions**: SetEditor rpe=7
- **Steps**:
  1. Click rpe-7
- **Expected Result**: rpe=undefined
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_139: Multiple exercises: independent RPE
- **Pre-conditions**: 2 exercises
- **Steps**:
  1. Set different RPE
- **Expected Result**: Independent per exerciseId
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_140: RPE options: 5 buttons render
- **Pre-conditions**: Exercise visible
- **Steps**:
  1. Count buttons
- **Expected Result**: 5 buttons: 6,7,8,9,10
- **Priority**: P1 | **Type**: Boundary
- **Kết quả test thực tế**: | — |


### Rest Timer (TC_WLS_141 → TC_WLS_165)
##### TC_WLS_141: RestTimer starts 90s
- **Pre-conditions**: Just logged set
- **Steps**:
  1. Check display
- **Expected Result**: "1:30"
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_142: Countdown: 90→89→88
- **Pre-conditions**: Timer visible
- **Steps**:
  1. Wait 2s
- **Expected Result**: "1:28"
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_143: Timer reaches 0 → onComplete
- **Pre-conditions**: remaining→0
- **Steps**:
  1. Wait
- **Expected Result**: onComplete(), timer closes
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_144: Display "1:30" at start
- **Pre-conditions**: Timer just opened
- **Steps**:
  1. Check
- **Expected Result**: formatTime(90)="1:30"
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_145: Display "0:01" near end
- **Pre-conditions**: remaining=1
- **Steps**:
  1. Check
- **Expected Result**: formatTime(1)="0:01"
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_146: Display "0:00" at zero
- **Pre-conditions**: remaining=0
- **Steps**:
  1. Check
- **Expected Result**: formatTime(0)="0:00"
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_147: +30s: 90→120
- **Pre-conditions**: remaining=90
- **Steps**:
  1. Click +30s
- **Expected Result**: remaining=120, total=120
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_148: +30s at 10s → 40s
- **Pre-conditions**: remaining=10
- **Steps**:
  1. Click +30s
- **Expected Result**: remaining=40
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_149: +30s twice → +60s
- **Pre-conditions**: remaining=90
- **Steps**:
  1. Click +30s 2x
- **Expected Result**: remaining=150
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_150: +30s updates progress ring
- **Pre-conditions**: remaining=45/90
- **Steps**:
  1. Click +30s
- **Expected Result**: totalDuration changes, ring recalculates
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_151: Skip → immediate close
- **Pre-conditions**: Timer visible, remaining=60
- **Steps**:
  1. Click skip
- **Expected Result**: onSkip(), timer closes
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_152: Skip at 90s
- **Pre-conditions**: Just opened
- **Steps**:
  1. Click skip
- **Expected Result**: Timer closes immediately
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_153: Skip at 1s
- **Pre-conditions**: remaining=1
- **Steps**:
  1. Click skip
- **Expected Result**: Closes
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_154: Progress ring 100% at start
- **Pre-conditions**: remaining=90, total=90
- **Steps**:
  1. Inspect
- **Expected Result**: dashoffset=0 (full)
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_155: Progress ring 50%
- **Pre-conditions**: remaining=45/90
- **Steps**:
  1. Inspect
- **Expected Result**: dashoffset=CIRCUMFERENCE*0.5
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_156: Progress ring 0%
- **Pre-conditions**: remaining=0
- **Steps**:
  1. Inspect
- **Expected Result**: dashoffset=CIRCUMFERENCE
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_157: Progress ring SVG role="progressbar"
- **Pre-conditions**: Timer visible
- **Steps**:
  1. Inspect SVG
- **Expected Result**: role, aria-valuenow, min, max
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_158: Timer isVisible=false → null
- **Pre-conditions**: showRestTimer=false
- **Steps**:
  1. Inspect DOM
- **Expected Result**: return null
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_159: Timer overlay bg-black/60
- **Pre-conditions**: Timer visible
- **Steps**:
  1. Inspect
- **Expected Result**: fixed inset-0 z-50 bg-black/60
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_160: Timer dialog role="dialog"
- **Pre-conditions**: Timer visible
- **Steps**:
  1. Inspect
- **Expected Result**: role="dialog" aria-modal="true"
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_161: Timer aria-label
- **Pre-conditions**: Timer visible
- **Steps**:
  1. Inspect
- **Expected Result**: aria-label=t("fitness.timer.rest")
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_162: +30s button text
- **Pre-conditions**: Timer visible
- **Steps**:
  1. Check text
- **Expected Result**: t("fitness.timer.addTime")
- **Priority**: P3 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_163: Skip button text
- **Pre-conditions**: Timer visible
- **Steps**:
  1. Check text
- **Expected Result**: t("fitness.timer.skip")
- **Priority**: P3 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_164: Timer icon present
- **Pre-conditions**: Timer visible
- **Steps**:
  1. Inspect header
- **Expected Result**: Timer icon visible
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_165: Multiple rest timers sequence
- **Pre-conditions**: Log 3 sets
- **Steps**:
  1. Log, rest, log, rest, log, rest
- **Expected Result**: Each rest timer starts fresh at 90s
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |


### SetEditor Modal (TC_WLS_166 → TC_WLS_185)
##### TC_WLS_166: SetEditor opens with initials
- **Pre-conditions**: initialWeight=80, reps=10, rpe=8
- **Steps**:
  1. Check fields
- **Expected Result**: weight=80, reps=10, RPE 8
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_167: SetEditor weight dec: 100→97.5
- **Pre-conditions**: weight=100
- **Steps**:
  1. Click minus
- **Expected Result**: weight=97.5
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_168: SetEditor weight inc: 100→102.5
- **Pre-conditions**: weight=100
- **Steps**:
  1. Click plus
- **Expected Result**: weight=102.5
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_169: SetEditor weight 0→minus stays 0
- **Pre-conditions**: weight=0
- **Steps**:
  1. Click minus
- **Expected Result**: Math.max(0,-2.5)=0
- **Priority**: P1 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_170: SetEditor weight direct input
- **Pre-conditions**: SetEditor mở
- **Steps**:
  1. Input "75"
- **Expected Result**: weight=75
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_171: SetEditor reps dec: 5→4
- **Pre-conditions**: reps=5
- **Steps**:
  1. Click minus
- **Expected Result**: reps=4
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_172: SetEditor reps inc: 5→6
- **Pre-conditions**: reps=5
- **Steps**:
  1. Click plus
- **Expected Result**: reps=6
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_173: SetEditor reps 1→minus stays 1
- **Pre-conditions**: reps=1
- **Steps**:
  1. Click minus
- **Expected Result**: Math.max(1,0)=1
- **Priority**: P1 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_174: SetEditor reps negative → 1
- **Pre-conditions**: SetEditor
- **Steps**:
  1. Input "-3"
- **Expected Result**: Math.max(1,-3)=1
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_175: Recent chips: 0 → hidden
- **Pre-conditions**: recentWeights=[]
- **Steps**:
  1. Inspect
- **Expected Result**: Section not rendered
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_176: Recent chips: 1
- **Pre-conditions**: recentWeights=[60]
- **Steps**:
  1. Inspect
- **Expected Result**: 1 chip visible
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_177: Recent chips: 3
- **Pre-conditions**: recentWeights=[60,65,70]
- **Steps**:
  1. Inspect
- **Expected Result**: 3 chips
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_178: Recent chips: 5
- **Pre-conditions**: recentWeights=[50,55,60,65,70]
- **Steps**:
  1. Inspect
- **Expected Result**: 5 chips
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_179: Click chip → weight updates
- **Pre-conditions**: chips=[60,65], weight=80
- **Steps**:
  1. Click 65
- **Expected Result**: weight=65
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_180: Click chip → highlighted
- **Pre-conditions**: weight=65
- **Steps**:
  1. Inspect chip 65
- **Expected Result**: emerald bg
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_181: Save → onSave({weight,reps,rpe})
- **Pre-conditions**: weight=80,reps=10,rpe=8
- **Steps**:
  1. Click save
- **Expected Result**: onSave triggered
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_182: Cancel → onCancel
- **Pre-conditions**: SetEditor mở
- **Steps**:
  1. Click cancel
- **Expected Result**: onCancel triggered
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_183: Close X → onCancel
- **Pre-conditions**: SetEditor mở
- **Steps**:
  1. Click X
- **Expected Result**: onCancel triggered
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_184: SetEditor isVisible=false → null
- **Pre-conditions**: isVisible=false
- **Steps**:
  1. Inspect
- **Expected Result**: return null
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_185: SetEditor role="dialog"
- **Pre-conditions**: SetEditor visible
- **Steps**:
  1. Inspect
- **Expected Result**: role="dialog" aria-modal="true"
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |


### Workout Session Flow (TC_WLS_186 → TC_WLS_200)
##### TC_WLS_186: 1 exercise in session
- **Pre-conditions**: planDay 1 exercise
- **Steps**:
  1. Load
- **Expected Result**: 1 section renders
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_187: 3 exercises in session
- **Pre-conditions**: planDay 3 exercises
- **Steps**:
  1. Load
- **Expected Result**: 3 sections
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_188: 5 exercises in session
- **Pre-conditions**: planDay 5 exercises
- **Steps**:
  1. Load, scroll
- **Expected Result**: 5 sections, scrollable
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_189: 10 exercises in session
- **Pre-conditions**: planDay 10 exercises
- **Steps**:
  1. Load
- **Expected Result**: 10 sections, performance ok
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_190: Add exercise via selector
- **Pre-conditions**: 2 exercises loaded
- **Steps**:
  1. Click add, select new
- **Expected Result**: currentExercises grows to 3
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_191: Exercise nameVi displayed
- **Pre-conditions**: Exercise in list
- **Steps**:
  1. Inspect heading
- **Expected Result**: H3 shows exercise.nameVi
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_192: Logged sets display
- **Pre-conditions**: 2 sets logged
- **Steps**:
  1. Inspect
- **Expected Result**: Set 1 and Set 2 visible
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_193: Multiple sets: setNumber increments
- **Pre-conditions**: Log 3 sets
- **Steps**:
  1. Verify numbers
- **Expected Result**: 1, 2, 3
- **Priority**: P1 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_194: Finish → summary
- **Pre-conditions**: Sets logged
- **Steps**:
  1. Click finish
- **Expected Result**: workout-summary visible
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_195: Summary duration MM:SS
- **Pre-conditions**: elapsed=305
- **Steps**:
  1. Check display
- **Expected Result**: "05:05"
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_196: Summary volume
- **Pre-conditions**: Sets: 80×10, 80×8
- **Steps**:
  1. Check
- **Expected Result**: 800+640=1440 kg
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_197: Summary sets count
- **Pre-conditions**: 5 sets
- **Steps**:
  1. Check
- **Expected Result**: "5"
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_198: Save calls addWorkout+addWorkoutSet
- **Pre-conditions**: Summary visible
- **Steps**:
  1. Click save
- **Expected Result**: Both store methods called, onComplete triggered
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_199: Save: onComplete with workout
- **Pre-conditions**: Summary visible
- **Steps**:
  1. Click save
- **Expected Result**: onComplete(workout) with correct object
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_200: Empty exercises state
- **Pre-conditions**: currentExercises=[]
- **Steps**:
  1. Inspect
- **Expected Result**: empty-state visible
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |


### Edge Cases & Dark Mode (TC_WLS_201 → TC_WLS_210)
##### TC_WLS_201: Back button → onBack
- **Pre-conditions**: WorkoutLogger mở
- **Steps**:
  1. Click back
- **Expected Result**: onBack() triggered
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_WLS_202: Timer: 0s → "00:00"
- **Pre-conditions**: Just mounted
- **Steps**:
  1. Check timer
- **Expected Result**: "00:00"
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_203: Timer: 65s → "01:05"
- **Pre-conditions**: elapsed=65
- **Steps**:
  1. Check
- **Expected Result**: "01:05"
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_204: Timer: 3661s → "61:01"
- **Pre-conditions**: elapsed=3661
- **Steps**:
  1. Check
- **Expected Result**: "61:01", no cap
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_205: Log set weight=0, reps=0
- **Pre-conditions**: Both 0
- **Steps**:
  1. Log set
- **Expected Result**: Set created with 0 values
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_WLS_206: Dark mode: header emerald
- **Pre-conditions**: Dark mode
- **Steps**:
  1. Inspect header
- **Expected Result**: bg-emerald-600, white text
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_207: Dark mode: sections bg-slate-800
- **Pre-conditions**: Dark mode
- **Steps**:
  1. Inspect sections
- **Expected Result**: dark:bg-slate-800
- **Priority**: P3 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_WLS_208: Dark mode: inputs contrast
- **Pre-conditions**: Dark mode
- **Steps**:
  1. Inspect inputs
- **Expected Result**: dark:bg-slate-700, readable
- **Priority**: P3 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_209: Dark mode: RPE buttons
- **Pre-conditions**: Dark mode, RPE=8
- **Steps**:
  1. Inspect
- **Expected Result**: Selected emerald, others dark:bg-slate-700
- **Priority**: P3 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_WLS_210: Workout 0 sets → save volume=0
- **Pre-conditions**: No sets logged
- **Steps**:
  1. Finish, save
- **Expected Result**: totalVolume=0, sets=0, save ok
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

