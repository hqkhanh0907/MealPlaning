# Scenario 29: Workout History

**Version:** 2.0  
**Date:** 2026-06-27  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Workout History hiển thị toàn bộ lịch sử buổi tập của người dùng, được nhóm theo tuần (week grouping). Người dùng có thể lọc theo loại bài tập (All / Strength / Cardio), mở rộng từng workout card để xem chi tiết sets (weight × reps @ RPE), volume tổng, số bài tập, thời gian hoàn thành, và ghi chú. Component sử dụng relative dates ("Hôm nay", "Hôm qua", "N ngày trước") cho các ngày gần, và format đầy đủ (T2, dd/MM/yyyy) cho ngày xa hơn. Dữ liệu đọc từ fitnessStore (workouts + workoutSets), sắp xếp theo thứ tự giảm dần (mới nhất trước). Empty state hiển thị skeleton preview khi chưa có workout nào.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| WorkoutHistory | WorkoutHistory.tsx | Container chính hiển thị lịch sử workout |
| useFitnessStore | fitnessStore.ts | Zustand store chứa workouts & workoutSets |
| calculateExerciseVolume | trainingMetrics.ts | Tính tổng volume (weight × reps) cho các sets |
| getRelativeDate | WorkoutHistory.tsx | Format ngày tương đối (Hôm nay, N ngày trước) |
| getMondayOfWeek | WorkoutHistory.tsx | Xác định thứ Hai đầu tuần cho grouping |
| getWeekKey / getWeekLabel | WorkoutHistory.tsx | Tạo key và label cho mỗi nhóm tuần |
| formatCompletionTime | WorkoutHistory.tsx | Format giờ hoàn thành (HH:mm) |

## Luồng nghiệp vụ

1. Mở tab Fitness → chọn mục History → WorkoutHistory render
2. Nếu không có workout → hiển thị empty state (icon + text + skeleton preview)
3. Nếu có workouts → hiển thị filter tabs (All / Strength / Cardio) + danh sách nhóm tuần
4. Mỗi nhóm tuần có header "Tuần từ dd/MM" và danh sách workout cards
5. Click workout card → toggle expand/collapse → hiển thị chi tiết sets, volume, duration, notes
6. Chọn filter → lọc workouts theo loại (strength = có set weight > 0, cardio = có set durationMin > 0)

## Quy tắc nghiệp vụ

1. Workouts sắp xếp theo ngày giảm dần (mới nhất trước)
2. Week grouping: tuần bắt đầu từ thứ Hai, key = YYYY-MM-DD của thứ Hai
3. Relative date: 0 ngày = "Hôm nay", 1 ngày = "Hôm qua", 2-6 ngày = "N ngày trước", ≥7 ngày = "T2, dd/MM/yyyy"
4. Filter Strength: workout có ít nhất 1 set với weightKg > 0
5. Filter Cardio: workout có ít nhất 1 set với durationMin > 0
6. Volume = Σ (weightKg × reps) cho tất cả sets của workout
7. Exercise count = số exerciseId unique trong các sets của workout
8. Chỉ 1 workout expanded tại 1 thời điểm (toggle pattern)
9. Set detail: hiển thị "Xkg × Y reps RPE Z" cho strength, "N phút" cho cardio
10. Completion time format HH:mm từ workout.updatedAt
11. Notes chỉ hiển thị khi expanded và workout.notes có giá trị

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_WKH_01 | Hiển thị empty state khi không có workout | Positive | P0 |
| TC_WKH_02 | Empty state có icon ClipboardList | Positive | P2 |
| TC_WKH_03 | Empty state có title "Chưa có lịch sử" | Positive | P1 |
| TC_WKH_04 | Empty state có subtitle hướng dẫn | Positive | P2 |
| TC_WKH_05 | Empty state hiển thị 3 skeleton cards | Positive | P2 |
| TC_WKH_06 | Hiển thị filter tabs All/Strength/Cardio | Positive | P0 |
| TC_WKH_07 | Filter All mặc định được chọn (aria-pressed=true) | Positive | P1 |
| TC_WKH_08 | Click filter Strength → chỉ hiển thị workout có weight sets | Positive | P0 |
| TC_WKH_09 | Click filter Cardio → chỉ hiển thị workout có duration sets | Positive | P0 |
| TC_WKH_10 | Click filter All → hiển thị tất cả workouts | Positive | P0 |
| TC_WKH_11 | Filter active có style emerald-500 bg | Positive | P2 |
| TC_WKH_12 | Nhóm workouts theo tuần (week grouping) | Positive | P0 |
| TC_WKH_13 | Week header hiển thị "Tuần từ dd/MM" | Positive | P1 |
| TC_WKH_14 | Workouts trong cùng tuần nằm chung nhóm | Positive | P1 |
| TC_WKH_15 | Nhóm tuần sắp xếp giảm dần (tuần mới nhất trước) | Positive | P1 |
| TC_WKH_16 | Workout hôm nay hiển thị "Hôm nay" | Positive | P0 |
| TC_WKH_17 | Workout hôm qua hiển thị "Hôm qua" | Positive | P1 |
| TC_WKH_18 | Workout 2 ngày trước hiển thị "2 ngày trước" | Positive | P1 |
| TC_WKH_19 | Workout 6 ngày trước hiển thị "6 ngày trước" | Positive | P1 |
| TC_WKH_20 | Workout 7+ ngày trước hiển thị "T2, dd/MM/yyyy" | Positive | P1 |
| TC_WKH_21 | Click workout card → expand chi tiết | Positive | P0 |
| TC_WKH_22 | Click workout đã expanded → collapse | Positive | P0 |
| TC_WKH_23 | Chỉ 1 workout expanded tại 1 thời điểm | Positive | P1 |
| TC_WKH_24 | Expand workout A → expand workout B → A tự collapse | Positive | P1 |
| TC_WKH_25 | aria-expanded=true khi card mở | Positive | P2 |
| TC_WKH_26 | aria-expanded=false khi card đóng | Positive | P2 |
| TC_WKH_27 | Hiển thị volume tổng (kg) trên workout card | Positive | P1 |
| TC_WKH_28 | Hiển thị exercise count trên workout card | Positive | P1 |
| TC_WKH_29 | Hiển thị duration trên card (khi có durationMin) | Positive | P1 |
| TC_WKH_30 | Không hiển thị duration khi durationMin = 0/null | Positive | P2 |
| TC_WKH_31 | Set detail: "Xkg × Y reps" cho strength | Positive | P0 |
| TC_WKH_32 | Set detail: "RPE Z" khi có rpe | Positive | P1 |
| TC_WKH_33 | Set detail: "N phút" cho cardio (durationMin > 0) | Positive | P1 |
| TC_WKH_34 | Sets nhóm theo exerciseId trong expanded view | Positive | P1 |
| TC_WKH_35 | Exercise group hiển thị volume riêng | Positive | P2 |
| TC_WKH_36 | Completion time format HH:mm | Positive | P1 |
| TC_WKH_37 | Workout notes hiển thị khi có giá trị | Positive | P1 |
| TC_WKH_38 | Workout notes ẩn khi không có | Positive | P2 |
| TC_WKH_39 | Icon ChevronDown khi collapsed, ChevronUp khi expanded | Positive | P2 |
| TC_WKH_40 | Filter Strength → không có kết quả → danh sách trống | Edge | P1 |
| TC_WKH_41 | Filter Cardio → không có kết quả → danh sách trống | Edge | P1 |
| TC_WKH_42 | Workout không có sets → exercise count = 0, volume = 0 | Edge | P1 |
| TC_WKH_43 | Workout chỉ có 1 set duy nhất | Edge | P2 |
| TC_WKH_44 | Workout có 50+ sets → render chi tiết đúng | Boundary | P2 |
| TC_WKH_45 | 100+ workouts → danh sách render < 2s | Boundary | P1 |
| TC_WKH_46 | Workout ngày Chủ nhật → relative date hiển thị "CN" | Edge | P2 |
| TC_WKH_47 | Workout spanning 2 tuần khác nhau → nhóm đúng | Edge | P2 |
| TC_WKH_48 | Workout date format không chuẩn → xử lý graceful | Negative | P2 |
| TC_WKH_49 | Set weightKg = 0 và reps = 0 → không hiển thị "0kg × 0" | Edge | P2 |
| TC_WKH_50 | Dark mode — card bg dark:bg-slate-800 | Positive | P2 |
| TC_WKH_51 | Rapid filter switching (All → Strength → Cardio × 10) | Boundary | P2 |
| TC_WKH_52 | Rapid expand/collapse 20 lần → UI stable | Boundary | P2 |
| TC_WKH_53 | Workout tên 200+ ký tự → truncation/overflow handled | Boundary | P3 |
| TC_WKH_54 | XSS trong workout name → escaped đúng | Negative | P0 |
| TC_WKH_55 | Screen reader đọc đúng workout name và date | Positive | P3 |
| TC_WKH_56 | Filter "Tất cả" với 0 workouts → empty state hiển thị | Edge | P1 |
| TC_WKH_57 | Filter "Tất cả" với 1 workout → hiển thị 1 card | Positive | P1 |
| TC_WKH_58 | Filter "Tất cả" với 5 workouts → hiển thị đủ 5 cards | Positive | P1 |
| TC_WKH_59 | Filter "Tất cả" với 20 workouts → hiển thị đủ 20 | Positive | P1 |
| TC_WKH_60 | Filter "Tất cả" với 100 workouts → performance OK | Boundary | P1 |
| TC_WKH_61 | Filter "Sức mạnh" chỉ hiển thị workout có set weight > 0 | Positive | P0 |
| TC_WKH_62 | Filter "Sức mạnh" với toàn bộ workouts là cardio → rỗng | Edge | P1 |
| TC_WKH_63 | Filter "Sức mạnh" với toàn bộ workouts là strength → hiển thị tất cả | Positive | P1 |
| TC_WKH_64 | Filter "Cardio" chỉ hiển thị workout có set durationMin > 0 | Positive | P0 |
| TC_WKH_65 | Filter "Cardio" với toàn bộ workouts là strength → rỗng | Edge | P1 |
| TC_WKH_66 | Filter "Cardio" với toàn bộ workouts là cardio → hiển thị tất cả | Positive | P1 |
| TC_WKH_67 | Chuyển filter All → Strength → Cardio → All nhanh 5 lần | Boundary | P2 |
| TC_WKH_68 | Filter button aria-pressed="true" cho filter đang active | Positive | P2 |
| TC_WKH_69 | Filter button aria-pressed toggle khi chuyển filter | Positive | P2 |
| TC_WKH_70 | Click cùng filter 2 lần → không thay đổi | Edge | P2 |
| TC_WKH_71 | Filter chip text khớp i18n key fitness.history.all/strength/cardio | Positive | P2 |
| TC_WKH_72 | Luôn hiển thị đúng 3 filter buttons | Positive | P1 |
| TC_WKH_73 | Filter state persistence khi expand/collapse workout | Positive | P1 |
| TC_WKH_74 | Filter chip selected style: bg-emerald-500 text-white | Positive | P2 |
| TC_WKH_75 | Filter chip unselected style: bg-slate-100 dark:bg-slate-700 | Positive | P2 |
| TC_WKH_76 | Filter dark mode: selected chip emerald-500 visible | Positive | P2 |
| TC_WKH_77 | Filter dark mode: unselected chip dark:bg-slate-700 | Positive | P2 |
| TC_WKH_78 | Filter results count: Strength filter đúng số lượng | Positive | P1 |
| TC_WKH_79 | Filter results count: Cardio filter đúng số lượng | Positive | P1 |
| TC_WKH_80 | Expand workout rồi chuyển filter → expandedId reset | Edge | P2 |
| TC_WKH_81 | Workouts trong 1 tuần → 1 week group duy nhất | Positive | P1 |
| TC_WKH_82 | Workouts trải 2 tuần → 2 week groups | Positive | P1 |
| TC_WKH_83 | Workouts trải 5 tuần → 5 week groups | Positive | P1 |
| TC_WKH_84 | Workouts trải 10 tuần → 10 week groups đúng thứ tự | Positive | P1 |
| TC_WKH_85 | Week header format "Tuần từ dd/MM" với ngày 1 chữ số | Positive | P2 |
| TC_WKH_86 | Week header format với tháng 2 chữ số (tháng 12) | Positive | P2 |
| TC_WKH_87 | Monday calculation cho ngày T2 (đã là thứ Hai) | Positive | P2 |
| TC_WKH_88 | Monday calculation cho ngày CN (day=0 edge case) | Edge | P1 |
| TC_WKH_89 | Week spanning tháng: CN 31/03 và T2 01/04 | Edge | P2 |
| TC_WKH_90 | Week spanning năm: CN 29/12/2025 và T2 30/12/2025 | Edge | P2 |
| TC_WKH_91 | Single workout per week → 1 card per group | Positive | P2 |
| TC_WKH_92 | Multiple workouts cùng ngày trong 1 tuần | Edge | P2 |
| TC_WKH_93 | Tuần trống không hiển thị (no empty week headers) | Positive | P1 |
| TC_WKH_94 | Week sort: newest first, oldest last | Positive | P1 |
| TC_WKH_95 | Tất cả workouts trong tuần hiện tại | Positive | P1 |
| TC_WKH_96 | Tất cả workouts trong tuần quá khứ (không có tuần hiện tại) | Positive | P2 |
| TC_WKH_97 | Week key format YYYY-MM-DD (ISO Monday date) | Positive | P2 |
| TC_WKH_98 | Tuần có đúng 7 workouts (mỗi ngày 1 workout) | Boundary | P2 |
| TC_WKH_99 | Week group với filtered results: filter giảm số cards | Positive | P1 |
| TC_WKH_100 | Week group bị loại hoàn toàn khi filter → không hiển thị | Edge | P2 |
| TC_WKH_101 | Workout 3 ngày trước hiển thị "3 ngày trước" | Positive | P1 |
| TC_WKH_102 | Workout 4 ngày trước hiển thị "4 ngày trước" | Positive | P2 |
| TC_WKH_103 | Workout 5 ngày trước hiển thị "5 ngày trước" | Positive | P2 |
| TC_WKH_104 | Workout 7 ngày trước → full format (không dùng relative) | Positive | P1 |
| TC_WKH_105 | Workout 8 ngày trước → full format | Positive | P2 |
| TC_WKH_106 | Workout 14 ngày trước → full format | Positive | P2 |
| TC_WKH_107 | Workout 30 ngày trước → full format | Positive | P2 |
| TC_WKH_108 | Workout 365 ngày trước → full format năm trước | Positive | P2 |
| TC_WKH_109 | Date format: ngày có 1 chữ số (03/03) | Positive | P2 |
| TC_WKH_110 | Date format: tháng có 2 chữ số (15/12) | Positive | P2 |
| TC_WKH_111 | Vietnamese day abbreviation T2 cho Monday | Positive | P2 |
| TC_WKH_112 | Vietnamese day abbreviation T3 cho Tuesday | Positive | P2 |
| TC_WKH_113 | Vietnamese day abbreviation T4 cho Wednesday | Positive | P2 |
| TC_WKH_114 | Vietnamese day abbreviation T5 cho Thursday | Positive | P2 |
| TC_WKH_115 | Vietnamese day abbreviation T6 cho Friday | Positive | P2 |
| TC_WKH_116 | Vietnamese day abbreviation T7 cho Saturday | Positive | P2 |
| TC_WKH_117 | Vietnamese day abbreviation CN cho Sunday | Positive | P2 |
| TC_WKH_118 | DAY_NAMES array mapping: [CN, T2, T3, T4, T5, T6, T7] | Positive | P2 |
| TC_WKH_119 | Relative date hiển thị cả ở compact view (collapsed) | Positive | P1 |
| TC_WKH_120 | Relative date hiển thị ở expanded view | Positive | P2 |
| TC_WKH_121 | Click first card trong danh sách → expand | Positive | P0 |
| TC_WKH_122 | Click expanded card → collapse chính xác | Positive | P0 |
| TC_WKH_123 | Click card A → click card B → A collapse, B expand | Positive | P0 |
| TC_WKH_124 | Rapid expand/collapse cùng card 10 lần | Boundary | P2 |
| TC_WKH_125 | Expand card → scroll xuống → expand card khác | Positive | P1 |
| TC_WKH_126 | ChevronDown icon hiển thị khi card collapsed | Positive | P2 |
| TC_WKH_127 | ChevronUp icon hiển thị khi card expanded | Positive | P2 |
| TC_WKH_128 | aria-expanded="true" sau expand | Positive | P2 |
| TC_WKH_129 | aria-expanded="false" sau collapse | Positive | P2 |
| TC_WKH_130 | Toggle button có aria-label với workout name | Positive | P2 |
| TC_WKH_131 | Expanded card hiển thị tất cả detail sections | Positive | P0 |
| TC_WKH_132 | Collapsed card ẩn toàn bộ detail sections | Positive | P1 |
| TC_WKH_133 | Multiple toggle clicks within 100ms → state đúng cuối cùng | Boundary | P2 |
| TC_WKH_134 | Expand card không có sets → detail section trống | Edge | P2 |
| TC_WKH_135 | Expand card có 1 set → 1 exercise group, 1 set-detail | Positive | P1 |
| TC_WKH_136 | Expand card có 10+ sets → tất cả hiển thị | Positive | P1 |
| TC_WKH_137 | Expand card có cả strength và cardio sets | Positive | P1 |
| TC_WKH_138 | Icon transition từ ChevronDown sang ChevronUp | Positive | P3 |
| TC_WKH_139 | Toggle button có type="button" | Positive | P3 |
| TC_WKH_140 | Keyboard Enter trên toggle button → expand/collapse | Positive | P2 |
| TC_WKH_141 | Keyboard Space trên toggle button → expand/collapse | Positive | P2 |
| TC_WKH_142 | Tab navigation qua các workout cards | Positive | P2 |
| TC_WKH_143 | Screen reader thông báo expand state change | Positive | P3 |
| TC_WKH_144 | Expand card ở cuối danh sách → scroll đúng | Positive | P2 |
| TC_WKH_145 | Collapse tất cả cards → không có detail nào hiển thị | Positive | P2 |
| TC_WKH_146 | Volume = 0 khi workout không có sets | Edge | P1 |
| TC_WKH_147 | Volume calculation: single set 50kg × 10 reps = 500kg | Positive | P1 |
| TC_WKH_148 | Volume calculation: multiple sets sum correctly | Positive | P1 |
| TC_WKH_149 | Volume hiển thị format có đơn vị "kg" | Positive | P2 |
| TC_WKH_150 | Exercise count = 0 khi không có sets | Edge | P1 |
| TC_WKH_151 | Exercise count = 1 với single exercise | Positive | P1 |
| TC_WKH_152 | Exercise count: unique count khi có duplicate exerciseIds | Positive | P1 |
| TC_WKH_153 | Duration display: 30 phút | Positive | P1 |
| TC_WKH_154 | Duration = 0 → section ẩn | Positive | P2 |
| TC_WKH_155 | Duration = undefined → section ẩn (fallback ?? 0) | Edge | P2 |
| TC_WKH_156 | Duration > 60 (ví dụ 90 phút) → hiển thị đúng | Positive | P2 |
| TC_WKH_157 | Completion time format HH:mm từ updatedAt | Positive | P1 |
| TC_WKH_158 | Notes hiển thị với icon StickyNote khi expanded | Positive | P1 |
| TC_WKH_159 | Notes ẩn khi giá trị = empty string "" | Edge | P2 |
| TC_WKH_160 | Notes ẩn khi giá trị = null | Edge | P2 |
| TC_WKH_161 | Notes ẩn khi giá trị = undefined | Edge | P2 |
| TC_WKH_162 | Sets nhóm theo exerciseId: 3 exercises → 3 groups | Positive | P1 |
| TC_WKH_163 | Strength set format: "80kg × 8" | Positive | P0 |
| TC_WKH_164 | Strength set with RPE: "80kg × 8 RPE 8" | Positive | P1 |
| TC_WKH_165 | Cardio set format: "30 phút" | Positive | P1 |
| TC_WKH_166 | Set với weight=0 và duration>0 → cardio format | Positive | P1 |
| TC_WKH_167 | Set với weight>0 và duration=0 → strength format | Positive | P1 |
| TC_WKH_168 | Set với weight>0 và duration>0 → strength format ưu tiên | Edge | P1 |
| TC_WKH_169 | Volume icon Dumbbell hiển thị bên cạnh volume text | Positive | P2 |
| TC_WKH_170 | Clock icon hiển thị bên cạnh duration text | Positive | P2 |
| TC_WKH_171 | StickyNote icon hiển thị bên cạnh notes text | Positive | P2 |
| TC_WKH_172 | Exercise name hiển thị trong group header | Positive | P1 |
| TC_WKH_173 | Workout name hiển thị trên card header | Positive | P1 |
| TC_WKH_174 | Set detail không hiển thị RPE khi rpe undefined | Positive | P2 |
| TC_WKH_175 | Volume calculation bỏ qua cardio sets (weight=0) | Edge | P1 |
| TC_WKH_176 | Workout với name rỗng → hiển thị fallback | Edge | P2 |
| TC_WKH_177 | Workout với name 500 ký tự → truncation hoặc wrap | Boundary | P2 |
| TC_WKH_178 | Workout name có special characters (!@#$%^&*) | Edge | P2 |
| TC_WKH_179 | Workout name có emoji 💪🔥 | Edge | P2 |
| TC_WKH_180 | Set với negative weight → render as-is | Negative | P2 |
| TC_WKH_181 | Set với reps = 0 → hiển thị "Xkg × 0" | Edge | P2 |
| TC_WKH_182 | Set với RPE = 0 → hiển thị "RPE 0" hoặc ẩn | Edge | P2 |
| TC_WKH_183 | Set với RPE = 10 (max) → hiển thị "RPE 10" | Boundary | P2 |
| TC_WKH_184 | Workout có 100 sets → tất cả render | Boundary | P2 |
| TC_WKH_185 | Week có 50+ workouts → render đúng | Boundary | P2 |
| TC_WKH_186 | Filter → empty → back to All → full list | Positive | P1 |
| TC_WKH_187 | Workout date đúng week boundary (CN cuối tuần) | Edge | P2 |
| TC_WKH_188 | Workout date tương lai → hiển thị đúng | Edge | P2 |
| TC_WKH_189 | Hai workouts cùng exact timestamp | Edge | P2 |
| TC_WKH_190 | Workout không có updatedAt → completion time ẩn | Edge | P2 |
| TC_WKH_191 | Volume rất lớn (99999 kg) → hiển thị không overflow | Boundary | P2 |
| TC_WKH_192 | Exercise count 20+ unique exercises | Boundary | P2 |
| TC_WKH_193 | Long exercise name trong group header → truncation | Boundary | P3 |
| TC_WKH_194 | Unicode characters trong notes | Edge | P2 |
| TC_WKH_195 | HTML injection trong workout name → escaped | Negative | P0 |
| TC_WKH_196 | Dark mode: workout card background dark:bg-slate-800 | Positive | P2 |
| TC_WKH_197 | Dark mode: card border dark:border-slate-700 | Positive | P2 |
| TC_WKH_198 | Dark mode: text colors dark:text-slate-300/400 | Positive | P2 |
| TC_WKH_199 | Dark mode: filter active chip emerald visible | Positive | P2 |
| TC_WKH_200 | Dark mode: filter inactive chip dark:bg-slate-700 | Positive | P2 |
| TC_WKH_201 | Dark mode: week header text color | Positive | P2 |
| TC_WKH_202 | Dark mode: expanded detail section colors | Positive | P2 |
| TC_WKH_203 | Dark mode: volume text dark:text-emerald-400 | Positive | P2 |
| TC_WKH_204 | Dark mode: duration text color | Positive | P2 |
| TC_WKH_205 | Dark mode: notes section colors | Positive | P3 |
| TC_WKH_206 | Screen reader đọc full workout summary | Positive | P3 |
| TC_WKH_207 | Tab navigation qua tất cả interactive elements | Positive | P2 |
| TC_WKH_208 | 200+ workouts render performance < 3s | Boundary | P1 |
| TC_WKH_209 | Memory usage stable sau 50 expand/collapse cycles | Boundary | P2 |
| TC_WKH_210 | Touch target size filter buttons ≥ 44px | Positive | P3 |

---

## Chi tiết Test Cases

##### TC_WKH_01: Hiển thị empty state khi không có workout
- **Pre-conditions**: fitnessStore.workouts = []
- **Steps**: 1. Mở tab Fitness → chọn History
- **Expected**: Container data-testid="workout-history-empty" hiển thị, không có workout list
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_WKH_02: Empty state có icon ClipboardList
- **Pre-conditions**: fitnessStore.workouts = []
- **Steps**: 1. Quan sát empty state
- **Expected**: Icon ClipboardList hiển thị (w-12 h-12, text-slate-300)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_03: Empty state có title "Chưa có lịch sử"
- **Pre-conditions**: fitnessStore.workouts = []
- **Steps**: 1. Quan sát data-testid="empty-title"
- **Expected**: Text = t('fitness.history.noHistory'), font-medium
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_04: Empty state có subtitle hướng dẫn
- **Pre-conditions**: fitnessStore.workouts = []
- **Steps**: 1. Quan sát data-testid="empty-subtitle"
- **Expected**: Text = t('fitness.history.emptySubtitle'), text-sm
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_05: Empty state hiển thị 3 skeleton cards
- **Pre-conditions**: fitnessStore.workouts = []
- **Steps**: 1. Quan sát data-testid="skeleton-preview"
- **Expected**: 3 skeleton cards (skeleton-card-1, skeleton-card-2, skeleton-card-3) với animate-pulse, opacity-30, blur
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_06: Hiển thị filter tabs All/Strength/Cardio
- **Pre-conditions**: Có ít nhất 1 workout trong store
- **Steps**: 1. Quan sát data-testid="filter-chips"
- **Expected**: 3 buttons: filter-all, filter-strength, filter-cardio
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_WKH_07: Filter All mặc định được chọn (aria-pressed=true)
- **Pre-conditions**: Có workouts, vừa mở WorkoutHistory
- **Steps**: 1. Kiểm tra filter-all aria-pressed
- **Expected**: filter-all có aria-pressed="true", filter-strength và filter-cardio có aria-pressed="false"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_08: Click filter Strength → chỉ hiển thị workout có weight sets
- **Pre-conditions**: Có 3 workouts: 1 strength (weightKg > 0), 1 cardio (durationMin > 0), 1 mixed
- **Steps**: 1. Click filter-strength
- **Expected**: Chỉ hiển thị workouts có ít nhất 1 set với weightKg > 0, cardio-only workout ẩn
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_WKH_09: Click filter Cardio → chỉ hiển thị workout có duration sets
- **Pre-conditions**: Có workouts strength, cardio, và mixed
- **Steps**: 1. Click filter-cardio
- **Expected**: Chỉ hiển thị workouts có ít nhất 1 set với durationMin > 0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_WKH_10: Click filter All → hiển thị tất cả workouts
- **Pre-conditions**: Đang ở filter Strength hoặc Cardio
- **Steps**: 1. Click filter-all
- **Expected**: Tất cả workouts hiển thị, không phân biệt loại
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_WKH_11: Filter active có style emerald-500 bg
- **Pre-conditions**: Có workouts
- **Steps**: 1. Click filter-strength 2. Quan sát style
- **Expected**: filter-strength có bg-emerald-500 text-white, filter-all và filter-cardio có bg-slate-100
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_12: Nhóm workouts theo tuần (week grouping)
- **Pre-conditions**: Có workouts trải trên 3 tuần khác nhau
- **Steps**: 1. Quan sát data-testid="workout-list"
- **Expected**: 3 nhóm tuần (week-group-*), mỗi nhóm chứa workouts đúng tuần
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_WKH_13: Week header hiển thị "Tuần từ dd/MM"
- **Pre-conditions**: Có workouts
- **Steps**: 1. Quan sát week-header-* elements
- **Expected**: Header text = t('fitness.history.weekOf', { date: 'dd/MM' }) với dd/MM là thứ Hai đầu tuần
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_14: Workouts trong cùng tuần nằm chung nhóm
- **Pre-conditions**: 2 workouts: T2 và T5 cùng tuần
- **Steps**: 1. Quan sát week groups
- **Expected**: Cả 2 workout trong cùng 1 week-group-*
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_15: Nhóm tuần sắp xếp giảm dần (tuần mới nhất trước)
- **Pre-conditions**: Workouts trải trên 3 tuần: tuần này, tuần trước, 2 tuần trước
- **Steps**: 1. Kiểm tra thứ tự week groups
- **Expected**: Tuần này xuất hiện đầu tiên, tuần cũ nhất cuối cùng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_16: Workout hôm nay hiển thị "Hôm nay"
- **Pre-conditions**: Có workout với date = today (YYYY-MM-DD)
- **Steps**: 1. Quan sát workout-date-* element
- **Expected**: Text = t('fitness.history.today') = "Hôm nay"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_WKH_17: Workout hôm qua hiển thị "Hôm qua"
- **Pre-conditions**: Có workout với date = yesterday
- **Steps**: 1. Quan sát workout-date-*
- **Expected**: Text = t('fitness.history.yesterday') = "Hôm qua"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_18: Workout 2 ngày trước hiển thị "2 ngày trước"
- **Pre-conditions**: Có workout với date = today - 2
- **Steps**: 1. Quan sát workout-date-*
- **Expected**: Text = t('fitness.history.daysAgo', { count: 2 })
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_19: Workout 6 ngày trước hiển thị "6 ngày trước"
- **Pre-conditions**: Có workout với date = today - 6
- **Steps**: 1. Quan sát workout-date-*
- **Expected**: Text = t('fitness.history.daysAgo', { count: 6 })
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_20: Workout 7+ ngày trước hiển thị "T2, dd/MM/yyyy"
- **Pre-conditions**: Có workout với date = today - 10
- **Steps**: 1. Quan sát workout-date-*
- **Expected**: Format "DAY_NAME, dd/MM/yyyy" (ví dụ: "T4, 03/03/2026")
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_21: Click workout card → expand chi tiết
- **Pre-conditions**: Có workout, card đang collapsed
- **Steps**: 1. Click workout-toggle-{id}
- **Expected**: workout-detail-{id} hiển thị, aria-expanded="true"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_WKH_22: Click workout đã expanded → collapse
- **Pre-conditions**: Workout card đang expanded
- **Steps**: 1. Click workout-toggle-{id} lần nữa
- **Expected**: workout-detail-{id} ẩn, aria-expanded="false"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_WKH_23: Chỉ 1 workout expanded tại 1 thời điểm
- **Pre-conditions**: Có 3+ workouts
- **Steps**: 1. Expand workout A 2. Expand workout B
- **Expected**: Workout B expanded, workout A auto-collapsed
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_24: Expand workout A → expand workout B → A tự collapse
- **Pre-conditions**: Có 2 workouts
- **Steps**: 1. Click toggle A 2. Click toggle B
- **Expected**: expandedId = B, detail A ẩn, detail B hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_25: aria-expanded=true khi card mở
- **Pre-conditions**: Có workout
- **Steps**: 1. Click toggle 2. Kiểm tra attribute
- **Expected**: workout-toggle-{id} có aria-expanded="true"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_26: aria-expanded=false khi card đóng
- **Pre-conditions**: Workout card collapsed
- **Steps**: 1. Kiểm tra attribute
- **Expected**: workout-toggle-{id} có aria-expanded="false"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_27: Hiển thị volume tổng (kg) trên workout card
- **Pre-conditions**: Workout có sets với weightKg > 0
- **Steps**: 1. Quan sát workout-volume-{id}
- **Expected**: Hiển thị tổng volume = Σ(weightKg × reps) + " kg", text-emerald-600
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_28: Hiển thị exercise count trên workout card
- **Pre-conditions**: Workout có 4 exercises khác nhau
- **Steps**: 1. Quan sát workout-exercises-{id}
- **Expected**: Text = t('fitness.history.exerciseCount', { count: 4 })
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_29: Hiển thị duration trên card (khi có durationMin)
- **Pre-conditions**: Workout với durationMin = 45
- **Steps**: 1. Quan sát workout card header area
- **Expected**: "45 phút" hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_30: Không hiển thị duration khi durationMin = 0/null
- **Pre-conditions**: Workout với durationMin = 0 hoặc undefined
- **Steps**: 1. Quan sát workout card header
- **Expected**: Không có text "phút" trên header
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_31: Set detail: "Xkg × Y reps" cho strength
- **Pre-conditions**: Workout expanded, set có weightKg=80 reps=8
- **Steps**: 1. Quan sát set-detail-{id}
- **Expected**: Text chứa "80kg × 8"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_WKH_32: Set detail: "RPE Z" khi có rpe
- **Pre-conditions**: Set có rpe=8
- **Steps**: 1. Quan sát set-detail-{id}
- **Expected**: Text chứa "RPE 8"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_33: Set detail: "N phút" cho cardio (durationMin > 0)
- **Pre-conditions**: Set có durationMin=30, weightKg=0
- **Steps**: 1. Quan sát set-detail-{id}
- **Expected**: Text = "30 phút", không hiển thị "0kg × 0"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_34: Sets nhóm theo exerciseId trong expanded view
- **Pre-conditions**: Workout có 3 exercises, mỗi exercise 3 sets
- **Steps**: 1. Expand workout 2. Quan sát exercise-group-* elements
- **Expected**: 3 exercise groups, mỗi group chứa 3 set-detail elements
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_35: Exercise group hiển thị volume riêng
- **Pre-conditions**: Exercise group có sets: 80kg×8, 90kg×6, 100kg×4
- **Steps**: 1. Expand workout 2. Quan sát exercise group
- **Expected**: Volume hiển thị: "Volume: 1780 kg" (80×8 + 90×6 + 100×4)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_36: Completion time format HH:mm
- **Pre-conditions**: Workout với updatedAt = "2026-03-13T14:30:00.000Z"
- **Steps**: 1. Expand workout 2. Quan sát workout-completed-{id}
- **Expected**: Hiển thị "Hoàn thành lúc 14:30" (local time)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_37: Workout notes hiển thị khi có giá trị
- **Pre-conditions**: Workout với notes = "Cảm giác mạnh hôm nay"
- **Steps**: 1. Expand workout 2. Quan sát workout-notes-{id}
- **Expected**: Notes text hiển thị kèm icon StickyNote
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_38: Workout notes ẩn khi không có
- **Pre-conditions**: Workout với notes = undefined/null/""
- **Steps**: 1. Expand workout
- **Expected**: workout-notes-{id} không render
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_39: Icon ChevronDown khi collapsed, ChevronUp khi expanded
- **Pre-conditions**: Có workout
- **Steps**: 1. Quan sát icon khi collapsed 2. Click expand 3. Quan sát icon
- **Expected**: Collapsed: ChevronDown, Expanded: ChevronUp
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_40: Filter Strength → không có kết quả → danh sách trống
- **Pre-conditions**: Chỉ có cardio workouts (không có set weightKg > 0)
- **Steps**: 1. Click filter-strength
- **Expected**: workout-list rỗng, không có week groups
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_WKH_41: Filter Cardio → không có kết quả → danh sách trống
- **Pre-conditions**: Chỉ có strength workouts (không có set durationMin > 0)
- **Steps**: 1. Click filter-cardio
- **Expected**: workout-list rỗng, không có week groups
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_WKH_42: Workout không có sets → exercise count = 0, volume = 0
- **Pre-conditions**: Workout tồn tại nhưng workoutSets rỗng cho workout đó
- **Steps**: 1. Quan sát workout card
- **Expected**: Không hiển thị exercise count (ẩn khi = 0), volume = 0 (ẩn)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_WKH_43: Workout chỉ có 1 set duy nhất
- **Pre-conditions**: Workout có đúng 1 set (80kg × 5)
- **Steps**: 1. Expand workout
- **Expected**: 1 exercise group, 1 set detail, volume = 400
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_44: Workout có 50+ sets → render chi tiết đúng
- **Pre-conditions**: Workout có 50 sets, 10 exercises × 5 sets mỗi exercise
- **Steps**: 1. Expand workout 2. Scroll chi tiết
- **Expected**: Tất cả 50 sets hiển thị đúng, 10 exercise groups, render < 1s
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_WKH_45: 100+ workouts → danh sách render < 2s
- **Pre-conditions**: fitnessStore có 100+ workouts
- **Steps**: 1. Mở WorkoutHistory 2. Đo thời gian render
- **Expected**: Danh sách render đầy đủ trong < 2s, không jank
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_WKH_46: Workout ngày Chủ nhật → relative date hiển thị "CN"
- **Pre-conditions**: Workout date = Chủ nhật, > 7 ngày trước
- **Steps**: 1. Quan sát workout-date-*
- **Expected**: Text bắt đầu bằng "CN, dd/MM/yyyy"
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_47: Workout spanning 2 tuần khác nhau → nhóm đúng
- **Pre-conditions**: Workout A ngày CN 06/03, workout B ngày T2 07/03 (tuần mới)
- **Steps**: 1. Quan sát week groups
- **Expected**: A và B ở 2 week groups khác nhau
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_48: Workout date format không chuẩn → xử lý graceful
- **Pre-conditions**: Workout với date = "invalid-date" hoặc "2026/03/13"
- **Steps**: 1. Mở WorkoutHistory
- **Expected**: Không crash, workout hiển thị với date fallback hoặc bị skip
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_WKH_49: Set weightKg = 0 và reps = 0 → không hiển thị "0kg × 0"
- **Pre-conditions**: Set với weightKg=0, reps=0, durationMin=0
- **Steps**: 1. Expand workout 2. Quan sát set-detail
- **Expected**: Không hiển thị "0kg × 0", element rỗng hoặc ẩn
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_50: Dark mode — card bg dark:bg-slate-800
- **Pre-conditions**: Dark mode enabled
- **Steps**: 1. Quan sát workout cards
- **Expected**: Cards có bg-slate-800, text colors dark variant, border-slate-700
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_51: Rapid filter switching (All → Strength → Cardio × 10)
- **Pre-conditions**: Có workouts
- **Steps**: 1. Click nhanh qua 3 filters liên tục 10 lần
- **Expected**: UI stable, danh sách cuối cùng đúng filter cuối, không flicker
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_WKH_52: Rapid expand/collapse 20 lần → UI stable
- **Pre-conditions**: Có 5+ workouts
- **Steps**: 1. Click toggle nhanh 20 lần trên các workout khác nhau
- **Expected**: Trạng thái expand/collapse cuối cùng đúng, không memory leak
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_WKH_53: Workout tên 200+ ký tự → truncation/overflow handled
- **Pre-conditions**: Workout với name = 200+ chars
- **Steps**: 1. Quan sát workout-name-{id}
- **Expected**: Tên không overflow container, truncation hoặc wrap đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P3

##### TC_WKH_54: XSS trong workout name → escaped đúng
- **Pre-conditions**: Workout name = `<script>alert('xss')</script>`
- **Steps**: 1. Mở WorkoutHistory
- **Expected**: Text rendered as-is, không execute script, React auto-escapes
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_WKH_55: Screen reader đọc đúng workout name và date
- **Pre-conditions**: Screen reader enabled
- **Steps**: 1. Navigate qua workout cards
- **Expected**: aria-label = "{name} - {relativeDate}", đọc đúng tên + ngày
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_WKH_56: Filter "Tất cả" với 0 workouts → empty state hiển thị
- **Pre-conditions**: fitnessStore.workouts = []
- **Steps**: 1. Mở WorkoutHistory, filter mặc định All
- **Expected**: Empty state hiển thị, filter chips không render
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_WKH_57: Filter "Tất cả" với 1 workout → hiển thị 1 card
- **Pre-conditions**: Có 1 workout duy nhất
- **Steps**: 1. Mở WorkoutHistory, filter = All
- **Expected**: 1 workout card hiển thị, 1 week group
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_58: Filter "Tất cả" với 5 workouts → hiển thị đủ 5 cards
- **Pre-conditions**: Có 5 workouts trong 2 tuần
- **Steps**: 1. Mở WorkoutHistory, filter = All
- **Expected**: 5 workout cards hiển thị đúng, nhóm theo tuần
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_59: Filter "Tất cả" với 20 workouts → hiển thị đủ 20
- **Pre-conditions**: Có 20 workouts trải 4 tuần
- **Steps**: 1. Mở WorkoutHistory, filter = All
- **Expected**: 20 cards hiển thị đầy đủ, scroll hoạt động
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_60: Filter "Tất cả" với 100 workouts → performance OK
- **Pre-conditions**: Có 100 workouts trải 15 tuần
- **Steps**: 1. Mở WorkoutHistory, filter = All
- **Expected**: 100 cards render < 2s, scroll mượt
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_WKH_61: Filter "Sức mạnh" chỉ hiển thị workout có set weight > 0
- **Pre-conditions**: Có 5 strength, 3 cardio, 2 mixed workouts
- **Steps**: 1. Click filter-strength
- **Expected**: Chỉ 7 workouts hiển thị (5 strength + 2 mixed), 3 cardio ẩn
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_WKH_62: Filter "Sức mạnh" với toàn bộ workouts là cardio → rỗng
- **Pre-conditions**: Có 5 workouts, tất cả chỉ có durationMin > 0, weightKg = 0
- **Steps**: 1. Click filter-strength
- **Expected**: Danh sách rỗng, không có week groups
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_WKH_63: Filter "Sức mạnh" với toàn bộ workouts là strength → hiển thị tất cả
- **Pre-conditions**: Có 5 workouts, tất cả có weightKg > 0
- **Steps**: 1. Click filter-strength
- **Expected**: Tất cả 5 workouts hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_64: Filter "Cardio" chỉ hiển thị workout có set durationMin > 0
- **Pre-conditions**: Có 3 strength, 4 cardio, 1 mixed
- **Steps**: 1. Click filter-cardio
- **Expected**: Chỉ 5 workouts hiển thị (4 cardio + 1 mixed), 3 strength ẩn
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_WKH_65: Filter "Cardio" với toàn bộ workouts là strength → rỗng
- **Pre-conditions**: Có 5 workouts, tất cả chỉ có weightKg > 0, durationMin = 0
- **Steps**: 1. Click filter-cardio
- **Expected**: Danh sách rỗng, không có week groups
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_WKH_66: Filter "Cardio" với toàn bộ workouts là cardio → hiển thị tất cả
- **Pre-conditions**: Có 5 workouts, tất cả có durationMin > 0
- **Steps**: 1. Click filter-cardio
- **Expected**: Tất cả 5 workouts hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_67: Chuyển filter All → Strength → Cardio → All nhanh 5 lần
- **Pre-conditions**: Có mixed workouts
- **Steps**: 1. Click lần lượt All→Strength→Cardio→All 5 vòng liên tiếp
- **Expected**: UI không flicker, filter cuối = All, danh sách đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_WKH_68: Filter button aria-pressed="true" cho filter đang active
- **Pre-conditions**: Có workouts, filter = Strength
- **Steps**: 1. Click filter-strength 2. Kiểm tra aria-pressed trên cả 3 buttons
- **Expected**: filter-strength: aria-pressed="true", filter-all & filter-cardio: aria-pressed="false"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_69: Filter button aria-pressed toggle khi chuyển filter
- **Pre-conditions**: Filter = All
- **Steps**: 1. Click filter-cardio 2. Kiểm tra aria-pressed
- **Expected**: filter-cardio: aria-pressed="true", filter-all: aria-pressed="false"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_70: Click cùng filter 2 lần → không thay đổi
- **Pre-conditions**: Filter = Strength
- **Steps**: 1. Click filter-strength lần nữa
- **Expected**: Vẫn filter Strength, danh sách không thay đổi, aria-pressed="true"
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_71: Filter chip text khớp i18n key fitness.history.all/strength/cardio
- **Pre-conditions**: Có workouts
- **Steps**: 1. Quan sát text content của 3 filter buttons
- **Expected**: Button texts = t("fitness.history.all"), t("fitness.history.strength"), t("fitness.history.cardio")
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_72: Luôn hiển thị đúng 3 filter buttons
- **Pre-conditions**: Có workouts
- **Steps**: 1. Đếm số filter buttons
- **Expected**: 3 buttons: filter-all, filter-strength, filter-cardio
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_73: Filter state persistence khi expand/collapse workout
- **Pre-conditions**: Filter = Strength, 2 workouts
- **Steps**: 1. Click filter-strength 2. Expand workout 3. Collapse workout
- **Expected**: Filter vẫn là Strength, danh sách không thay đổi
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_74: Filter chip selected style: bg-emerald-500 text-white
- **Pre-conditions**: Filter = Cardio
- **Steps**: 1. Quan sát style filter-cardio
- **Expected**: bg-emerald-500 text-white, rounded-full
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_75: Filter chip unselected style: bg-slate-100 dark:bg-slate-700
- **Pre-conditions**: Filter = All (Strength và Cardio unselected)
- **Steps**: 1. Quan sát style filter-strength
- **Expected**: bg-slate-100 dark:bg-slate-700, text-slate-600 dark:text-slate-300
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_76: Filter dark mode: selected chip emerald-500 visible
- **Pre-conditions**: Dark mode, filter = Strength
- **Steps**: 1. Quan sát filter-strength style
- **Expected**: bg-emerald-500 text-white đúng trong dark mode
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_77: Filter dark mode: unselected chip dark:bg-slate-700
- **Pre-conditions**: Dark mode, filter = Strength
- **Steps**: 1. Quan sát filter-all style
- **Expected**: dark:bg-slate-700 dark:text-slate-300
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_78: Filter results count: Strength filter đúng số lượng
- **Pre-conditions**: Có 10 workouts: 4 strength, 3 cardio, 3 mixed
- **Steps**: 1. Click filter-strength 2. Đếm cards
- **Expected**: 7 cards (4 strength + 3 mixed)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_79: Filter results count: Cardio filter đúng số lượng
- **Pre-conditions**: Có 10 workouts: 4 strength, 3 cardio, 3 mixed
- **Steps**: 1. Click filter-cardio 2. Đếm cards
- **Expected**: 6 cards (3 cardio + 3 mixed)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_80: Expand workout rồi chuyển filter → expandedId reset
- **Pre-conditions**: Workout A expanded, filter = All
- **Steps**: 1. Expand workout A 2. Click filter-strength
- **Expected**: Workout A collapsed (nếu vẫn hiển thị) hoặc ẩn, expandedId reset
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_81: Workouts trong 1 tuần → 1 week group duy nhất
- **Pre-conditions**: Có 3 workouts T2, T4, T6 cùng tuần
- **Steps**: 1. Quan sát week groups
- **Expected**: 1 week-group hiển thị chứa 3 workout cards
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_82: Workouts trải 2 tuần → 2 week groups
- **Pre-conditions**: Có workouts T6 tuần trước + T2 tuần này
- **Steps**: 1. Quan sát week groups
- **Expected**: 2 week-groups, tuần này đầu tiên
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_83: Workouts trải 5 tuần → 5 week groups
- **Pre-conditions**: Có 1 workout mỗi tuần × 5 tuần
- **Steps**: 1. Quan sát week groups
- **Expected**: 5 week-groups, sắp xếp giảm dần
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_84: Workouts trải 10 tuần → 10 week groups đúng thứ tự
- **Pre-conditions**: Có workouts trải 10 tuần
- **Steps**: 1. Scroll qua danh sách
- **Expected**: 10 week-groups, newest first, oldest last
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_85: Week header format "Tuần từ dd/MM" với ngày 1 chữ số
- **Pre-conditions**: Workout ngày T2 05/01 (tháng 1)
- **Steps**: 1. Quan sát week header
- **Expected**: Text chứa "Tuần từ 05/01"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_86: Week header format với tháng 2 chữ số (tháng 12)
- **Pre-conditions**: Workout ngày T2 01/12
- **Steps**: 1. Quan sát week header
- **Expected**: Text chứa "Tuần từ 01/12"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_87: Monday calculation cho ngày T2 (đã là thứ Hai)
- **Pre-conditions**: Workout ngày T2 10/03/2026
- **Steps**: 1. Quan sát week-group key
- **Expected**: Week key = "2026-03-10" (chính ngày T2)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_88: Monday calculation cho ngày CN (day=0 edge case)
- **Pre-conditions**: Workout ngày CN 09/03/2026
- **Steps**: 1. Quan sát week-group key
- **Expected**: Week key = "2026-03-03" (thứ Hai trước đó)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_WKH_89: Week spanning tháng: CN 31/03 và T2 01/04
- **Pre-conditions**: Workout A ngày 31/03 (CN), workout B ngày 01/04 (T2)
- **Steps**: 1. Quan sát week groups
- **Expected**: 2 week groups khác nhau (2 tuần khác nhau)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_90: Week spanning năm: CN 29/12/2025 và T2 30/12/2025
- **Pre-conditions**: Workout cuối năm 2025 và đầu tuần mới
- **Steps**: 1. Quan sát week groups
- **Expected**: Nhóm đúng theo thứ Hai đầu tuần
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_91: Single workout per week → 1 card per group
- **Pre-conditions**: 5 tuần, mỗi tuần 1 workout
- **Steps**: 1. Quan sát week groups
- **Expected**: Mỗi week-group có đúng 1 workout card
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_92: Multiple workouts cùng ngày trong 1 tuần
- **Pre-conditions**: 3 workouts cùng ngày T3 11/03
- **Steps**: 1. Quan sát week group
- **Expected**: 1 week-group chứa 3 cards, sorted by time desc
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_93: Tuần trống không hiển thị (no empty week headers)
- **Pre-conditions**: Workouts tuần 1 và tuần 3 (tuần 2 trống)
- **Steps**: 1. Quan sát week groups
- **Expected**: 2 week-groups (tuần 1 và 3), không có tuần 2 trống
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_94: Week sort: newest first, oldest last
- **Pre-conditions**: 3 week-groups
- **Steps**: 1. Kiểm tra thứ tự DOM
- **Expected**: Week-group[0] = tuần mới nhất, week-group[last] = tuần cũ nhất
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_95: Tất cả workouts trong tuần hiện tại
- **Pre-conditions**: 5 workouts T2-T6 tuần này
- **Steps**: 1. Quan sát week groups
- **Expected**: 1 week-group duy nhất, chứa 5 cards
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_96: Tất cả workouts trong tuần quá khứ (không có tuần hiện tại)
- **Pre-conditions**: 3 workouts tuần trước
- **Steps**: 1. Quan sát week groups
- **Expected**: 1 week-group với label tuần trước
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_97: Week key format YYYY-MM-DD (ISO Monday date)
- **Pre-conditions**: Workouts trên nhiều tuần
- **Steps**: 1. Kiểm tra data-testid="week-group-{key}"
- **Expected**: Key format YYYY-MM-DD, ví dụ: week-group-2026-03-10
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_98: Tuần có đúng 7 workouts (mỗi ngày 1 workout)
- **Pre-conditions**: 7 workouts Mon-Sun cùng tuần
- **Steps**: 1. Expand week group
- **Expected**: 1 week-group chứa 7 cards, sorted by date desc
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_WKH_99: Week group với filtered results: filter giảm số cards
- **Pre-conditions**: 5 workouts (3 strength, 2 cardio) cùng tuần, filter Strength
- **Steps**: 1. Click filter-strength
- **Expected**: Week group chỉ còn 3 cards (strength)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_100: Week group bị loại hoàn toàn khi filter → không hiển thị
- **Pre-conditions**: Tuần A: 2 cardio, Tuần B: 2 strength; Filter = Strength
- **Steps**: 1. Click filter-strength
- **Expected**: Chỉ tuần B hiển thị, tuần A ẩn hoàn toàn
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_101: Workout 3 ngày trước hiển thị "3 ngày trước"
- **Pre-conditions**: Workout date = today - 3
- **Steps**: 1. Quan sát workout-date-*
- **Expected**: Text = t("fitness.history.daysAgo", { count: 3 })
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_102: Workout 4 ngày trước hiển thị "4 ngày trước"
- **Pre-conditions**: Workout date = today - 4
- **Steps**: 1. Quan sát workout-date-*
- **Expected**: Text = t("fitness.history.daysAgo", { count: 4 })
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_103: Workout 5 ngày trước hiển thị "5 ngày trước"
- **Pre-conditions**: Workout date = today - 5
- **Steps**: 1. Quan sát workout-date-*
- **Expected**: Text = t("fitness.history.daysAgo", { count: 5 })
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_104: Workout 7 ngày trước → full format (không dùng relative)
- **Pre-conditions**: Workout date = today - 7
- **Steps**: 1. Quan sát workout-date-*
- **Expected**: Format "DAY_NAME, dd/MM/yyyy" thay vì "7 ngày trước"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_105: Workout 8 ngày trước → full format
- **Pre-conditions**: Workout date = today - 8
- **Steps**: 1. Quan sát workout-date-*
- **Expected**: Format "DAY_NAME, dd/MM/yyyy"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_106: Workout 14 ngày trước → full format
- **Pre-conditions**: Workout date = today - 14
- **Steps**: 1. Quan sát workout-date-*
- **Expected**: Full format, ví dụ "T2, 27/02/2026"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_107: Workout 30 ngày trước → full format
- **Pre-conditions**: Workout date = today - 30
- **Steps**: 1. Quan sát workout-date-*
- **Expected**: Full format với tháng trước
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_108: Workout 365 ngày trước → full format năm trước
- **Pre-conditions**: Workout date = today - 365
- **Steps**: 1. Quan sát workout-date-*
- **Expected**: Full format với năm trước, ví dụ "T3, 28/06/2025"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_109: Date format: ngày có 1 chữ số (03/03)
- **Pre-conditions**: Workout ngày 3 tháng 3, > 7 ngày trước
- **Steps**: 1. Quan sát date text
- **Expected**: Day zero-padded: "03/03/2026"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_110: Date format: tháng có 2 chữ số (15/12)
- **Pre-conditions**: Workout ngày 15 tháng 12, > 7 ngày trước
- **Steps**: 1. Quan sát date text
- **Expected**: Month format: "15/12/2025"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_111: Vietnamese day abbreviation T2 cho Monday
- **Pre-conditions**: Workout Monday > 7 ngày trước
- **Steps**: 1. Quan sát date text
- **Expected**: Bắt đầu bằng "T2, "
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_112: Vietnamese day abbreviation T3 cho Tuesday
- **Pre-conditions**: Workout Tuesday > 7 ngày trước
- **Steps**: 1. Quan sát date text
- **Expected**: Bắt đầu bằng "T3, "
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_113: Vietnamese day abbreviation T4 cho Wednesday
- **Pre-conditions**: Workout Wednesday > 7 ngày trước
- **Steps**: 1. Quan sát date text
- **Expected**: Bắt đầu bằng "T4, "
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_114: Vietnamese day abbreviation T5 cho Thursday
- **Pre-conditions**: Workout Thursday > 7 ngày trước
- **Steps**: 1. Quan sát date text
- **Expected**: Bắt đầu bằng "T5, "
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_115: Vietnamese day abbreviation T6 cho Friday
- **Pre-conditions**: Workout Friday > 7 ngày trước
- **Steps**: 1. Quan sát date text
- **Expected**: Bắt đầu bằng "T6, "
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_116: Vietnamese day abbreviation T7 cho Saturday
- **Pre-conditions**: Workout Saturday > 7 ngày trước
- **Steps**: 1. Quan sát date text
- **Expected**: Bắt đầu bằng "T7, "
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_117: Vietnamese day abbreviation CN cho Sunday
- **Pre-conditions**: Workout Sunday > 7 ngày trước
- **Steps**: 1. Quan sát date text
- **Expected**: Bắt đầu bằng "CN, "
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_118: DAY_NAMES array mapping: [CN, T2, T3, T4, T5, T6, T7]
- **Pre-conditions**: Workouts cho mỗi ngày trong tuần
- **Steps**: 1. Quan sát date hiển thị cho mỗi workout
- **Expected**: Mỗi ngày ánh xạ đúng abbreviation Việt
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_119: Relative date hiển thị cả ở compact view (collapsed)
- **Pre-conditions**: Workout hôm nay, card collapsed
- **Steps**: 1. Quan sát workout card khi collapsed
- **Expected**: Date "Hôm nay" hiển thị trên card header
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_120: Relative date hiển thị ở expanded view
- **Pre-conditions**: Workout hôm qua, card expanded
- **Steps**: 1. Expand workout
- **Expected**: Date "Hôm qua" vẫn hiển thị trên card header khi expanded
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_121: Click first card trong danh sách → expand
- **Pre-conditions**: Có 5 workouts, tất cả collapsed
- **Steps**: 1. Click workout-toggle của card đầu tiên
- **Expected**: Card đầu tiên expanded, workout-detail hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_WKH_122: Click expanded card → collapse chính xác
- **Pre-conditions**: Card đầu tiên đang expanded
- **Steps**: 1. Click workout-toggle của card đầu tiên
- **Expected**: Card collapsed, workout-detail ẩn, aria-expanded="false"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_WKH_123: Click card A → click card B → A collapse, B expand
- **Pre-conditions**: Có 3 workouts, card A expanded
- **Steps**: 1. Click workout-toggle-B
- **Expected**: Card A collapsed, Card B expanded, expandedId = B
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_WKH_124: Rapid expand/collapse cùng card 10 lần
- **Pre-conditions**: Có workout
- **Steps**: 1. Click toggle nhanh 10 lần liên tục
- **Expected**: Trạng thái cuối đúng (collapsed nếu chẵn lần click), UI stable
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_WKH_125: Expand card → scroll xuống → expand card khác
- **Pre-conditions**: Có 10 workouts, card 1 expanded
- **Steps**: 1. Scroll xuống card 8 2. Click toggle card 8
- **Expected**: Card 1 collapsed, Card 8 expanded
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_126: ChevronDown icon hiển thị khi card collapsed
- **Pre-conditions**: Card collapsed
- **Steps**: 1. Quan sát icon trong toggle button
- **Expected**: ChevronDown icon visible, ChevronUp hidden
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_127: ChevronUp icon hiển thị khi card expanded
- **Pre-conditions**: Card expanded
- **Steps**: 1. Quan sát icon trong toggle button
- **Expected**: ChevronUp icon visible, ChevronDown hidden
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_128: aria-expanded="true" sau expand
- **Pre-conditions**: Card collapsed
- **Steps**: 1. Click toggle 2. Kiểm tra aria-expanded
- **Expected**: aria-expanded="true" trên workout-toggle-{id}
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_129: aria-expanded="false" sau collapse
- **Pre-conditions**: Card expanded
- **Steps**: 1. Click toggle 2. Kiểm tra aria-expanded
- **Expected**: aria-expanded="false" trên workout-toggle-{id}
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_130: Toggle button có aria-label với workout name
- **Pre-conditions**: Có workout "Ngày chân"
- **Steps**: 1. Kiểm tra aria-label của toggle button
- **Expected**: aria-label chứa tên workout
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_131: Expanded card hiển thị tất cả detail sections
- **Pre-conditions**: Card expanded, workout có sets + notes + duration
- **Steps**: 1. Quan sát expanded area
- **Expected**: Hiển thị: exercise groups, set details, volume, completion time, notes
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_WKH_132: Collapsed card ẩn toàn bộ detail sections
- **Pre-conditions**: Card collapsed
- **Steps**: 1. Quan sát card
- **Expected**: workout-detail-{id} không render, chỉ hiện summary (name, date)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_133: Multiple toggle clicks within 100ms → state đúng cuối cùng
- **Pre-conditions**: Có workout
- **Steps**: 1. Programmatically click toggle 3 lần trong 100ms
- **Expected**: Trạng thái cuối = expanded (odd clicks), UI không jank
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_WKH_134: Expand card không có sets → detail section trống
- **Pre-conditions**: Workout không có workoutSets
- **Steps**: 1. Click toggle
- **Expected**: Expanded view hiện nhưng không có exercise groups
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_135: Expand card có 1 set → 1 exercise group, 1 set-detail
- **Pre-conditions**: Workout có 1 set (80kg × 8)
- **Steps**: 1. Click toggle
- **Expected**: 1 exercise group, 1 set-detail "80kg × 8"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_136: Expand card có 10+ sets → tất cả hiển thị
- **Pre-conditions**: Workout có 12 sets từ 4 exercises
- **Steps**: 1. Click toggle 2. Scroll detail
- **Expected**: 4 exercise groups, tổng 12 set-details
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_137: Expand card có cả strength và cardio sets
- **Pre-conditions**: Workout có 3 strength sets + 2 cardio sets
- **Steps**: 1. Click toggle
- **Expected**: Strength sets hiện "Xkg × Y", Cardio sets hiện "N phút"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_138: Icon transition từ ChevronDown sang ChevronUp
- **Pre-conditions**: Card collapsed
- **Steps**: 1. Click toggle 2. Quan sát icon animation
- **Expected**: Icon chuyển từ ChevronDown → ChevronUp (hoặc ngược lại)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_WKH_139: Toggle button có type="button"
- **Pre-conditions**: Có workout
- **Steps**: 1. Inspect toggle button
- **Expected**: type="button" attribute present
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_WKH_140: Keyboard Enter trên toggle button → expand/collapse
- **Pre-conditions**: Focus trên toggle button
- **Steps**: 1. Nhấn Enter
- **Expected**: Card expand/collapse tương tự click
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_141: Keyboard Space trên toggle button → expand/collapse
- **Pre-conditions**: Focus trên toggle button
- **Steps**: 1. Nhấn Space
- **Expected**: Card expand/collapse tương tự click
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_142: Tab navigation qua các workout cards
- **Pre-conditions**: Có 5 workouts
- **Steps**: 1. Nhấn Tab liên tục
- **Expected**: Focus di chuyển qua các toggle buttons theo thứ tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_143: Screen reader thông báo expand state change
- **Pre-conditions**: Screen reader enabled
- **Steps**: 1. Click toggle
- **Expected**: aria-expanded thay đổi, screen reader đọc trạng thái mới
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_WKH_144: Expand card ở cuối danh sách → scroll đúng
- **Pre-conditions**: Có 20 workouts, scroll xuống card cuối
- **Steps**: 1. Expand card cuối cùng
- **Expected**: Detail section hiển thị, có thể cần scroll
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_145: Collapse tất cả cards → không có detail nào hiển thị
- **Pre-conditions**: Không có card nào expanded
- **Steps**: 1. Quan sát DOM
- **Expected**: Không có workout-detail-* element nào trong DOM
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_146: Volume = 0 khi workout không có sets
- **Pre-conditions**: Workout với 0 sets
- **Steps**: 1. Quan sát workout card
- **Expected**: Volume section ẩn hoặc hiển thị "0 kg"
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_WKH_147: Volume calculation: single set 50kg × 10 reps = 500kg
- **Pre-conditions**: Workout có 1 set: weightKg=50, reps=10
- **Steps**: 1. Quan sát workout-volume-{id}
- **Expected**: Volume = 500 kg
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_148: Volume calculation: multiple sets sum correctly
- **Pre-conditions**: Sets: 80×8=640, 90×6=540, 100×4=400
- **Steps**: 1. Quan sát workout-volume
- **Expected**: Volume = 1580 kg (640+540+400)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_149: Volume hiển thị format có đơn vị "kg"
- **Pre-conditions**: Workout có volume > 0
- **Steps**: 1. Quan sát workout-volume text
- **Expected**: Text kết thúc bằng " kg" hoặc chứa "kg"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_150: Exercise count = 0 khi không có sets
- **Pre-conditions**: Workout với 0 sets
- **Steps**: 1. Quan sát workout card
- **Expected**: Exercise count ẩn hoặc = 0
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_WKH_151: Exercise count = 1 với single exercise
- **Pre-conditions**: Workout có 3 sets cùng exerciseId
- **Steps**: 1. Quan sát workout-exercises
- **Expected**: Count = 1 (unique exerciseId)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_152: Exercise count: unique count khi có duplicate exerciseIds
- **Pre-conditions**: Workout có 6 sets: exerciseId A×3, B×2, C×1
- **Steps**: 1. Quan sát workout-exercises
- **Expected**: Count = 3 (3 unique exercises)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_153: Duration display: 30 phút
- **Pre-conditions**: Workout durationMin = 30
- **Steps**: 1. Quan sát duration trên card
- **Expected**: Text "30" + t("fitness.history.minutes")
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_154: Duration = 0 → section ẩn
- **Pre-conditions**: Workout durationMin = 0
- **Steps**: 1. Quan sát card header
- **Expected**: Không có icon Clock và text phút
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_155: Duration = undefined → section ẩn (fallback ?? 0)
- **Pre-conditions**: Workout không có trường durationMin
- **Steps**: 1. Quan sát card header
- **Expected**: Duration section ẩn
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_156: Duration > 60 (ví dụ 90 phút) → hiển thị đúng
- **Pre-conditions**: Workout durationMin = 90
- **Steps**: 1. Quan sát duration
- **Expected**: Text "90 phút" (hiển thị phút, không convert giờ)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_157: Completion time format HH:mm từ updatedAt
- **Pre-conditions**: Workout updatedAt = "2026-03-13T09:05:00"
- **Steps**: 1. Expand workout
- **Expected**: Text "Hoàn thành lúc 09:05"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_158: Notes hiển thị với icon StickyNote khi expanded
- **Pre-conditions**: Workout notes = "Buổi tập tốt"
- **Steps**: 1. Expand workout
- **Expected**: Icon StickyNote + text "Buổi tập tốt" hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_159: Notes ẩn khi giá trị = empty string ""
- **Pre-conditions**: Workout notes = ""
- **Steps**: 1. Expand workout
- **Expected**: workout-notes-{id} không render
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_160: Notes ẩn khi giá trị = null
- **Pre-conditions**: Workout notes = null
- **Steps**: 1. Expand workout
- **Expected**: workout-notes-{id} không render
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_161: Notes ẩn khi giá trị = undefined
- **Pre-conditions**: Workout không có field notes
- **Steps**: 1. Expand workout
- **Expected**: workout-notes-{id} không render
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_162: Sets nhóm theo exerciseId: 3 exercises → 3 groups
- **Pre-conditions**: Workout có sets: exA×3, exB×2, exC×4
- **Steps**: 1. Expand workout
- **Expected**: 3 exercise-group elements, mỗi group chứa sets tương ứng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_163: Strength set format: "80kg × 8"
- **Pre-conditions**: Set: weightKg=80, reps=8, durationMin=0
- **Steps**: 1. Expand workout 2. Quan sát set-detail
- **Expected**: Text = "80kg × 8"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_WKH_164: Strength set with RPE: "80kg × 8 RPE 8"
- **Pre-conditions**: Set: weightKg=80, reps=8, rpe=8
- **Steps**: 1. Quan sát set-detail
- **Expected**: Text chứa "RPE 8"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_165: Cardio set format: "30 phút"
- **Pre-conditions**: Set: weightKg=0, durationMin=30
- **Steps**: 1. Quan sát set-detail
- **Expected**: Text = "30" + t("fitness.history.minutes")
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_166: Set với weight=0 và duration>0 → cardio format
- **Pre-conditions**: Set: weightKg=0, reps=0, durationMin=45
- **Steps**: 1. Quan sát set-detail
- **Expected**: "45 phút", không hiện "0kg × 0"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_167: Set với weight>0 và duration=0 → strength format
- **Pre-conditions**: Set: weightKg=60, reps=12, durationMin=0
- **Steps**: 1. Quan sát set-detail
- **Expected**: "60kg × 12"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_168: Set với weight>0 và duration>0 → strength format ưu tiên
- **Pre-conditions**: Set: weightKg=50, reps=10, durationMin=20
- **Steps**: 1. Quan sát set-detail
- **Expected**: "50kg × 10" (weight takes priority)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_WKH_169: Volume icon Dumbbell hiển thị bên cạnh volume text
- **Pre-conditions**: Workout có volume > 0, expanded
- **Steps**: 1. Quan sát volume section
- **Expected**: Icon Dumbbell với text-emerald-400
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_170: Clock icon hiển thị bên cạnh duration text
- **Pre-conditions**: Workout có durationMin > 0
- **Steps**: 1. Quan sát card header
- **Expected**: Icon Clock aria-hidden="true"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_171: StickyNote icon hiển thị bên cạnh notes text
- **Pre-conditions**: Workout có notes, expanded
- **Steps**: 1. Quan sát notes section
- **Expected**: Icon StickyNote aria-hidden="true"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_172: Exercise name hiển thị trong group header
- **Pre-conditions**: Exercise "Bench Press" với 3 sets
- **Steps**: 1. Expand workout
- **Expected**: Group header chứa tên "Bench Press"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_173: Workout name hiển thị trên card header
- **Pre-conditions**: Workout name = "Ngày ngực vai tay sau"
- **Steps**: 1. Quan sát workout-name-{id}
- **Expected**: Text = "Ngày ngực vai tay sau"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_174: Set detail không hiển thị RPE khi rpe undefined
- **Pre-conditions**: Set: weightKg=80, reps=8, rpe=undefined
- **Steps**: 1. Quan sát set-detail
- **Expected**: Text = "80kg × 8", không có "RPE"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_175: Volume calculation bỏ qua cardio sets (weight=0)
- **Pre-conditions**: Workout: 2 strength sets (80×8, 90×6) + 1 cardio (0×0, 30min)
- **Steps**: 1. Quan sát volume
- **Expected**: Volume = 1180 (640+540), không tính cardio set
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_WKH_176: Workout với name rỗng → hiển thị fallback
- **Pre-conditions**: Workout name = ""
- **Steps**: 1. Quan sát workout card
- **Expected**: Card hiển thị, name trống hoặc placeholder
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_177: Workout với name 500 ký tự → truncation hoặc wrap
- **Pre-conditions**: Workout name = "A" × 500
- **Steps**: 1. Quan sát workout-name
- **Expected**: Text không overflow container, truncation hoặc line wrap
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_WKH_178: Workout name có special characters (!@#$%^&*)
- **Pre-conditions**: Workout name = "Chest & Back #1"
- **Steps**: 1. Quan sát workout card
- **Expected**: Hiển thị đúng: "Chest & Back #1"
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_179: Workout name có emoji 💪🔥
- **Pre-conditions**: Workout name = "Push Day 💪🔥"
- **Steps**: 1. Quan sát workout card
- **Expected**: Emoji hiển thị đúng trong name
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_180: Set với negative weight → render as-is
- **Pre-conditions**: Set weightKg = -10 (data lỗi)
- **Steps**: 1. Expand workout
- **Expected**: Hiển thị "-10kg × Y" hoặc xử lý graceful
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_WKH_181: Set với reps = 0 → hiển thị "Xkg × 0"
- **Pre-conditions**: Set: weightKg=80, reps=0
- **Steps**: 1. Quan sát set-detail
- **Expected**: Hiển thị "80kg × 0" hoặc ẩn set
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_182: Set với RPE = 0 → hiển thị "RPE 0" hoặc ẩn
- **Pre-conditions**: Set: rpe=0
- **Steps**: 1. Quan sát set-detail
- **Expected**: Hiển thị "RPE 0" hoặc ẩn RPE (tùy truthy check)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_183: Set với RPE = 10 (max) → hiển thị "RPE 10"
- **Pre-conditions**: Set: rpe=10
- **Steps**: 1. Quan sát set-detail
- **Expected**: Text chứa "RPE 10"
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_WKH_184: Workout có 100 sets → tất cả render
- **Pre-conditions**: Workout có 100 sets từ 10 exercises
- **Steps**: 1. Expand workout 2. Scroll
- **Expected**: Tất cả 100 sets hiển thị, 10 exercise groups
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_WKH_185: Week có 50+ workouts → render đúng
- **Pre-conditions**: 50 workouts cùng tuần
- **Steps**: 1. Scroll week group
- **Expected**: Tất cả 50 cards hiển thị trong 1 week group
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_WKH_186: Filter → empty → back to All → full list
- **Pre-conditions**: Strength filter → 0 results
- **Steps**: 1. Click filter-strength (0 results) 2. Click filter-all
- **Expected**: Quay lại full list, tất cả workouts hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_WKH_187: Workout date đúng week boundary (CN cuối tuần)
- **Pre-conditions**: Workout ngày CN 15/03 (cuối tuần của T2 10/03)
- **Steps**: 1. Quan sát week group
- **Expected**: Workout nằm trong week-group bắt đầu từ T2 10/03
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_188: Workout date tương lai → hiển thị đúng
- **Pre-conditions**: Workout date = tomorrow
- **Steps**: 1. Mở WorkoutHistory
- **Expected**: Workout hiển thị với date tương lai, relative date format đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_189: Hai workouts cùng exact timestamp
- **Pre-conditions**: Workout A và B cùng date = "2026-03-13"
- **Steps**: 1. Quan sát danh sách
- **Expected**: Cả 2 hiển thị, sorted by position ổn định
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_190: Workout không có updatedAt → completion time ẩn
- **Pre-conditions**: Workout updatedAt = undefined
- **Steps**: 1. Expand workout
- **Expected**: Completion time section không hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_191: Volume rất lớn (99999 kg) → hiển thị không overflow
- **Pre-conditions**: Sets: 200kg × 50reps × 10 sets
- **Steps**: 1. Quan sát volume text
- **Expected**: Volume = 100000 kg, text không overflow card
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_WKH_192: Exercise count 20+ unique exercises
- **Pre-conditions**: Workout có 20 unique exercises
- **Steps**: 1. Quan sát exercise count
- **Expected**: Count = 20, hiển thị đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_WKH_193: Long exercise name trong group header → truncation
- **Pre-conditions**: Exercise name = 100+ chars
- **Steps**: 1. Expand workout
- **Expected**: Exercise name truncated hoặc wrapped trong group header
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P3

##### TC_WKH_194: Unicode characters trong notes
- **Pre-conditions**: Workout notes = "日本語テスト 🏋️"
- **Steps**: 1. Expand workout
- **Expected**: Notes hiển thị đúng Unicode + emoji
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_WKH_195: HTML injection trong workout name → escaped
- **Pre-conditions**: Workout name = "<b>Bold</b><img src=x onerror=alert(1)>"
- **Steps**: 1. Quan sát workout card
- **Expected**: HTML tags rendered as text, không execute, React auto-escapes
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_WKH_196: Dark mode: workout card background dark:bg-slate-800
- **Pre-conditions**: Dark mode enabled, có workouts
- **Steps**: 1. Quan sát workout cards
- **Expected**: bg-slate-800 applied on cards
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_197: Dark mode: card border dark:border-slate-700
- **Pre-conditions**: Dark mode enabled
- **Steps**: 1. Quan sát card borders
- **Expected**: border-slate-700 applied
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_198: Dark mode: text colors dark:text-slate-300/400
- **Pre-conditions**: Dark mode enabled
- **Steps**: 1. Quan sát text elements
- **Expected**: Main text: dark:text-slate-200, secondary: dark:text-slate-400
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_199: Dark mode: filter active chip emerald visible
- **Pre-conditions**: Dark mode, filter active
- **Steps**: 1. Quan sát active filter
- **Expected**: bg-emerald-500 text-white vẫn đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_200: Dark mode: filter inactive chip dark:bg-slate-700
- **Pre-conditions**: Dark mode, filter inactive
- **Steps**: 1. Quan sát inactive filter
- **Expected**: dark:bg-slate-700 dark:text-slate-300
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_201: Dark mode: week header text color
- **Pre-conditions**: Dark mode
- **Steps**: 1. Quan sát week header
- **Expected**: text-slate-500 dark:text-slate-400
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_202: Dark mode: expanded detail section colors
- **Pre-conditions**: Dark mode, card expanded
- **Steps**: 1. Quan sát expanded area
- **Expected**: Background, text, borders all use dark variants
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_203: Dark mode: volume text dark:text-emerald-400
- **Pre-conditions**: Dark mode, workout có volume
- **Steps**: 1. Quan sát volume text
- **Expected**: text-emerald-400 trong dark mode
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_204: Dark mode: duration text color
- **Pre-conditions**: Dark mode, workout có duration
- **Steps**: 1. Quan sát duration text
- **Expected**: Dark variant text color applied
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_205: Dark mode: notes section colors
- **Pre-conditions**: Dark mode, workout có notes, expanded
- **Steps**: 1. Quan sát notes section
- **Expected**: StickyNote icon + text use dark variant colors
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_WKH_206: Screen reader đọc full workout summary
- **Pre-conditions**: Screen reader enabled
- **Steps**: 1. Navigate qua workout card
- **Expected**: aria-label chứa workout name, date, exercise count
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_WKH_207: Tab navigation qua tất cả interactive elements
- **Pre-conditions**: Keyboard user
- **Steps**: 1. Tab qua filters 2. Tab qua toggle buttons
- **Expected**: Focus di chuyển theo thứ tự: filters → workout toggles
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_WKH_208: 200+ workouts render performance < 3s
- **Pre-conditions**: fitnessStore có 200 workouts
- **Steps**: 1. Mở WorkoutHistory 2. Measure render time
- **Expected**: Initial render < 3s, scroll mượt
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_WKH_209: Memory usage stable sau 50 expand/collapse cycles
- **Pre-conditions**: Có workouts
- **Steps**: 1. Expand/collapse 50 lần 2. Monitor memory
- **Expected**: Không memory leak, heap size ổn định
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_WKH_210: Touch target size filter buttons ≥ 44px
- **Pre-conditions**: Mobile viewport
- **Steps**: 1. Measure filter button dimensions
- **Expected**: Width và height ≥ 44px (WCAG touch target)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3
