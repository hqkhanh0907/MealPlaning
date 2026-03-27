# Scenario 31: Daily Weight Input

**Version:** 2.0  
**Date:** 2026-06-27  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Daily Weight Input là component cho phép người dùng nhập cân nặng hàng ngày. Hỗ trợ nhập trực tiếp qua input number, tăng/giảm ±0.1kg qua nút +/−, và chọn nhanh từ recent weight chips (tối đa 5 giá trị unique gần nhất). Khi save, nếu đã có entry cho hôm nay thì update, nếu chưa thì tạo mới. Sau khi save hiển thị toast notification với Undo action (5 giây countdown). Component hiển thị thông tin bổ sung: cân nặng hôm qua, delta so với hôm qua, moving average 7 ngày, trend indicator (↑ gaining / ↓ losing / → stable). Input sử dụng font-variant-numeric: tabular-nums cho alignment tốt. Boundary: min 30kg, max 300kg, step 0.1kg.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| DailyWeightInput | DailyWeightInput.tsx | Component chính nhập cân nặng |
| useFitnessStore | fitnessStore.ts | Store: weightEntries, addWeightEntry, updateWeightEntry, removeWeightEntry |
| useNotification | NotificationContext.tsx | Toast notification với undo action |
| calculateMovingAverage | useFeedbackLoop.ts | Tính moving average từ entries (trả về null nếu < 3 entries) |
| todayStr / yesterdayStr | DailyWeightInput.tsx | Helper lấy YYYY-MM-DD hôm nay/hôm qua |
| getRecentUniqueWeights | DailyWeightInput.tsx | Lấy 5 unique weights gần nhất (trừ today) |
| getEntriesLast7Days | DailyWeightInput.tsx | Filter entries trong 7 ngày gần nhất |
| getTrendIndicator | DailyWeightInput.tsx | Trả về ↑/↓/→ dựa trên movingAvg vs yesterday |
| round1 | DailyWeightInput.tsx | Round 1 decimal |

## Luồng nghiệp vụ

1. Component mount → load initial weight (todayEntry hoặc latestEntry hoặc 0)
2. Nhập weight bằng keyboard, nút +/−, hoặc chọn chip
3. Click Save → tạo/update entry cho today → hiển thị toast "Đã lưu X kg" với Undo (5s)
4. Click Undo trong toast → revert entry → isSaved = false
5. Thông tin phụ hiển thị: yesterday weight, delta, moving average 7d, trend
6. Recent chips hiển thị 5 giá trị unique gần nhất (trừ hôm nay)

## Quy tắc nghiệp vụ

1. MIN_WEIGHT = 30kg, MAX_WEIGHT = 300kg, STEP = 0.1kg
2. isValid: inputValue >= 30 && inputValue <= 300
3. Save disabled khi !isValid
4. Save cùng ngày: update entry hiện tại (không duplicate)
5. Undo duration: 5000ms
6. Undo new entry: removeWeightEntry; Undo update: revert to previousWeight
7. Recent chips: tối đa RECENT_CHIP_COUNT = 5, exclude today, unique values
8. Moving average: calculateMovingAverage cần ≥ 3 entries, trả null nếu < 3
9. Trend: movingAvg > yesterday → ↑ (red), < → ↓ (green), = → → (slate)
10. Delta = round1(inputValue - yesterdayEntry.weightKg)
11. isSaved state: true sau save, false sau chip select/input change/undo
12. Saved state: border-emerald-400, bg-emerald-50; Unsaved: border-slate-300, bg-white
13. tabular-nums trên input và chips cho alignment

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_DWI_01 | Component render với initial weight từ today entry | Positive | P0 |
| TC_DWI_02 | Component render với initial weight từ latest entry (no today) | Positive | P0 |
| TC_DWI_03 | Component render với 0 khi không có entries | Positive | P1 |
| TC_DWI_04 | Nhập weight qua text input | Positive | P0 |
| TC_DWI_05 | Click nút + tăng 0.1kg | Positive | P0 |
| TC_DWI_06 | Click nút − giảm 0.1kg | Positive | P0 |
| TC_DWI_07 | Chọn recent chip → input cập nhật | Positive | P0 |
| TC_DWI_08 | Recent chips hiển thị tối đa 5 giá trị unique | Positive | P1 |
| TC_DWI_09 | Recent chips exclude hôm nay | Positive | P1 |
| TC_DWI_10 | Recent chips sắp xếp theo ngày giảm dần | Positive | P2 |
| TC_DWI_11 | Chip đang chọn có style emerald highlight | Positive | P2 |
| TC_DWI_12 | Không có recent entries → chips section ẩn | Edge | P1 |
| TC_DWI_13 | Save tạo mới entry cho today | Positive | P0 |
| TC_DWI_14 | Save cập nhật entry nếu today đã có | Positive | P0 |
| TC_DWI_15 | Save → toast "Đã lưu" hiển thị | Positive | P0 |
| TC_DWI_16 | Toast có Undo action button | Positive | P1 |
| TC_DWI_17 | Toast duration = 5000ms | Positive | P1 |
| TC_DWI_18 | Undo new entry → removeWeightEntry | Positive | P0 |
| TC_DWI_19 | Undo update → revert to previousWeight | Positive | P0 |
| TC_DWI_20 | Undo → isSaved = false, inputValue restored | Positive | P1 |
| TC_DWI_21 | Save button disabled khi input invalid | Negative | P0 |
| TC_DWI_22 | Input < 30kg → disabled save | Boundary | P0 |
| TC_DWI_23 | Input > 300kg → disabled save | Boundary | P0 |
| TC_DWI_24 | Input = 30kg → save enabled (boundary min) | Boundary | P1 |
| TC_DWI_25 | Input = 300kg → save enabled (boundary max) | Boundary | P1 |
| TC_DWI_26 | Input = 29.9kg → disabled | Boundary | P1 |
| TC_DWI_27 | Input = 300.1kg → disabled | Boundary | P1 |
| TC_DWI_28 | Input empty → value = 0 → disabled | Edge | P1 |
| TC_DWI_29 | Click + khi value = 300 → không tăng thêm | Boundary | P1 |
| TC_DWI_30 | Click − khi value = 30 → không giảm thêm | Boundary | P1 |
| TC_DWI_31 | Decimal precision 0.1kg (70.1, 70.2...) | Positive | P1 |
| TC_DWI_32 | Floating point: 70.1 + 0.1 = 70.2 (không phải 70.20000001) | Edge | P1 |
| TC_DWI_33 | Yesterday weight hiển thị khi có entry hôm qua | Positive | P1 |
| TC_DWI_34 | Yesterday info ẩn khi không có entry hôm qua | Edge | P1 |
| TC_DWI_35 | Delta hiển thị so với yesterday | Positive | P1 |
| TC_DWI_36 | Delta dương → text-red-500 (+X) | Positive | P2 |
| TC_DWI_37 | Delta âm → text-emerald-600 (-X) | Positive | P2 |
| TC_DWI_38 | Delta = 0 → text-slate-400 | Edge | P2 |
| TC_DWI_39 | Moving average 7 ngày hiển thị | Positive | P1 |
| TC_DWI_40 | Moving average = null khi < 3 entries → ẩn | Edge | P1 |
| TC_DWI_41 | Trend ↑ (gaining) → text-red-500 | Positive | P1 |
| TC_DWI_42 | Trend ↓ (losing) → text-emerald-500 | Positive | P1 |
| TC_DWI_43 | Trend → (stable) → text-slate-400 | Positive | P2 |
| TC_DWI_44 | Trend ẩn khi movingAvg null hoặc no yesterday | Edge | P2 |
| TC_DWI_45 | tabular-nums trên input field | Positive | P2 |
| TC_DWI_46 | tabular-nums trên recent chips | Positive | P2 |
| TC_DWI_47 | isSaved = true → border emerald, bg emerald | Positive | P1 |
| TC_DWI_48 | isSaved = false → border slate, bg white | Positive | P1 |
| TC_DWI_49 | Save → isSaved = true → chọn chip → isSaved = false | Positive | P1 |
| TC_DWI_50 | Save → isSaved = true → thay đổi input → isSaved = false | Positive | P1 |
| TC_DWI_51 | Save 2 lần cùng ngày → chỉ 1 entry (update) | Positive | P0 |
| TC_DWI_52 | First time user: no entries → input = 0, no chips, no avg, no trend | Edge | P0 |
| TC_DWI_53 | Dark mode — colors dark variant | Positive | P2 |
| TC_DWI_54 | XSS trong weight notes → escaped đúng | Negative | P0 |
| TC_DWI_55 | Rapid click +/− 50 lần → value stable, no jank | Boundary | P2 |
| TC_DWI_56 | Nhập weight = 30.0 (exact min boundary) | Boundary | P1 |
| TC_DWI_57 | Nhập weight = 30.1 (just above min) | Boundary | P2 |
| TC_DWI_58 | Nhập weight = 50.0 | Positive | P1 |
| TC_DWI_59 | Nhập weight = 60.5 | Positive | P2 |
| TC_DWI_60 | Nhập weight = 70.0 (typical value) | Positive | P1 |
| TC_DWI_61 | Nhập weight = 75.5 | Positive | P1 |
| TC_DWI_62 | Nhập weight = 80.0 | Positive | P2 |
| TC_DWI_63 | Nhập weight = 100.0 | Positive | P2 |
| TC_DWI_64 | Nhập weight = 120.5 | Positive | P2 |
| TC_DWI_65 | Nhập weight = 150.0 | Positive | P2 |
| TC_DWI_66 | Nhập weight = 200.0 | Positive | P2 |
| TC_DWI_67 | Nhập weight = 250.0 | Positive | P2 |
| TC_DWI_68 | Nhập weight = 299.9 (just below max) | Boundary | P2 |
| TC_DWI_69 | Nhập weight = 300.0 (exact max boundary) | Boundary | P1 |
| TC_DWI_70 | Nhập weight integer 70 (không decimal) | Positive | P1 |
| TC_DWI_71 | Nhập weight với .0 decimal (75.0) | Positive | P2 |
| TC_DWI_72 | Nhập weight với .5 decimal (72.5) | Positive | P2 |
| TC_DWI_73 | Nhập weight .1 decimal precision (70.1) | Positive | P2 |
| TC_DWI_74 | Nhập weight .9 decimal precision (70.9) | Positive | P2 |
| TC_DWI_75 | Re-enter same value as yesterday | Positive | P2 |
| TC_DWI_76 | Nhập value khác biệt lớn so với yesterday (+10kg) | Edge | P2 |
| TC_DWI_77 | Nhập value giảm nhẹ so với yesterday (-0.3kg) | Positive | P2 |
| TC_DWI_78 | Nhập weight via +/- buttons từ initial 70.0 | Positive | P1 |
| TC_DWI_79 | Nhập weight via text input typing 85.5 | Positive | P1 |
| TC_DWI_80 | Nhập weight via chip selection 72.0 | Positive | P1 |
| TC_DWI_81 | 0 entries → chips section không hiển thị | Edge | P1 |
| TC_DWI_82 | 1 entry (yesterday) → 1 chip hiển thị | Positive | P1 |
| TC_DWI_83 | 2 unique entries → 2 chips hiển thị | Positive | P1 |
| TC_DWI_84 | 3 unique entries → 3 chips | Positive | P2 |
| TC_DWI_85 | 5 unique entries → 5 chips (max) | Positive | P1 |
| TC_DWI_86 | 6+ unique entries → vẫn chỉ 5 chips | Boundary | P1 |
| TC_DWI_87 | Chips exclude entry hôm nay | Positive | P1 |
| TC_DWI_88 | Chips chỉ hiển thị unique values (no duplicates) | Positive | P1 |
| TC_DWI_89 | Chip values sorted by date (most recent first) | Positive | P2 |
| TC_DWI_90 | Chip click fills input with value | Positive | P0 |
| TC_DWI_91 | Chip click sets isSaved = false | Positive | P1 |
| TC_DWI_92 | Chip active khi value matches inputValue | Positive | P2 |
| TC_DWI_93 | Chip inactive khi value khác inputValue | Positive | P2 |
| TC_DWI_94 | Chip hiển thị weight format "XX.X kg" | Positive | P2 |
| TC_DWI_95 | Chip text có tabular-nums class | Positive | P2 |
| TC_DWI_96 | Multiple entries same weight → single chip | Edge | P2 |
| TC_DWI_97 | All entries same weight → 1 chip duy nhất | Edge | P2 |
| TC_DWI_98 | Chip selection then save → entry created correctly | Positive | P1 |
| TC_DWI_99 | Chip selection then +/- button → value thay đổi từ chip | Positive | P1 |
| TC_DWI_100 | Chip dark mode styling | Positive | P2 |
| TC_DWI_101 | Dark mode chip active state | Positive | P2 |
| TC_DWI_102 | Chip aria-label includes weight value | Positive | P2 |
| TC_DWI_103 | Chip click after save → isSaved false | Positive | P1 |
| TC_DWI_104 | Chip keyboard: Enter to select | Positive | P2 |
| TC_DWI_105 | Chip keyboard: Tab navigation qua chips | Positive | P2 |
| TC_DWI_106 | Save tạo new entry khi chưa có today entry | Positive | P0 |
| TC_DWI_107 | Save updates existing entry khi đã có today entry | Positive | P0 |
| TC_DWI_108 | Save entry có đúng date format YYYY-MM-DD | Positive | P1 |
| TC_DWI_109 | Save entry có đúng weightKg value | Positive | P1 |
| TC_DWI_110 | Save entry có timestamp updatedAt | Positive | P2 |
| TC_DWI_111 | Save sets isSaved = true | Positive | P0 |
| TC_DWI_112 | Save shows notification "Đã lưu X kg" | Positive | P0 |
| TC_DWI_113 | Notification có Undo button | Positive | P1 |
| TC_DWI_114 | Notification duration = 5000ms | Positive | P1 |
| TC_DWI_115 | Undo new entry → removeWeightEntry called | Positive | P0 |
| TC_DWI_116 | Undo update → restores previousWeight | Positive | P0 |
| TC_DWI_117 | Undo sets isSaved = false | Positive | P1 |
| TC_DWI_118 | Undo restores inputValue to previous | Positive | P1 |
| TC_DWI_119 | Toast auto-dismiss sau 5s không cần action | Positive | P1 |
| TC_DWI_120 | Save twice same day → chỉ 1 entry (update) | Positive | P0 |
| TC_DWI_121 | Save, undo, save again → entry created correctly | Positive | P1 |
| TC_DWI_122 | Save with value at min boundary (30) | Boundary | P1 |
| TC_DWI_123 | Save with value at max boundary (300) | Boundary | P1 |
| TC_DWI_124 | Save button disabled khi invalid (< 30) | Negative | P0 |
| TC_DWI_125 | Save button enabled khi valid | Positive | P1 |
| TC_DWI_126 | Save button aria-label: "Đã lưu" khi saved | Positive | P2 |
| TC_DWI_127 | Save button aria-label: "Lưu" khi unsaved | Positive | P2 |
| TC_DWI_128 | Save button style: bg-emerald-500 text-white khi saved | Positive | P2 |
| TC_DWI_129 | Save button style: bg-emerald-100 text-emerald-600 khi unsaved | Positive | P2 |
| TC_DWI_130 | Container border: emerald khi saved | Positive | P1 |
| TC_DWI_131 | Container border: slate khi unsaved | Positive | P1 |
| TC_DWI_132 | Multiple saves nhanh liên tục (debounce check) | Boundary | P2 |
| TC_DWI_133 | Save then thay đổi input → isSaved = false | Positive | P1 |
| TC_DWI_134 | Save then select chip → isSaved = false | Positive | P1 |
| TC_DWI_135 | Save then press + → isSaved = false | Positive | P1 |
| TC_DWI_136 | Save then press - → isSaved = false | Positive | P1 |
| TC_DWI_137 | Undo then save new value | Positive | P1 |
| TC_DWI_138 | Save with floating point precision | Edge | P1 |
| TC_DWI_139 | Save entry ID generation unique | Positive | P2 |
| TC_DWI_140 | Notification trigger khi save thành công | Positive | P1 |
| TC_DWI_141 | Press + once: 70.0 → 70.1 | Positive | P0 |
| TC_DWI_142 | Press + five times: 70.0 → 70.5 | Positive | P1 |
| TC_DWI_143 | Press + ten times: 70.0 → 71.0 | Positive | P1 |
| TC_DWI_144 | Press - once: 70.0 → 69.9 | Positive | P0 |
| TC_DWI_145 | Press - five times: 70.0 → 69.5 | Positive | P1 |
| TC_DWI_146 | Press - at 30.0 → stays 30.0 (min clamp) | Boundary | P0 |
| TC_DWI_147 | Press + at 300.0 → stays 300.0 (max clamp) | Boundary | P0 |
| TC_DWI_148 | Press - at 30.1 → goes to 30.0 | Boundary | P1 |
| TC_DWI_149 | Press + at 299.9 → goes to 300.0 | Boundary | P1 |
| TC_DWI_150 | Floating point: 70.1 + 0.1 = 70.2 (no precision error) | Edge | P1 |
| TC_DWI_151 | Floating point: 70.7 + 0.1 = 70.8 | Edge | P2 |
| TC_DWI_152 | Floating point: 70.9 + 0.1 = 71.0 | Edge | P1 |
| TC_DWI_153 | Rapid press + 50 lần → stable | Boundary | P2 |
| TC_DWI_154 | Rapid press - 50 lần → stable | Boundary | P2 |
| TC_DWI_155 | Alternating + và - 20 lần | Boundary | P2 |
| TC_DWI_156 | + button sets isSaved = false | Positive | P1 |
| TC_DWI_157 | - button sets isSaved = false | Positive | P1 |
| TC_DWI_158 | + button aria-label = t("common.increase") | Positive | P2 |
| TC_DWI_159 | - button aria-label = t("common.decrease") | Positive | P2 |
| TC_DWI_160 | Button touch-friendly size ≥ 44px | Positive | P3 |
| TC_DWI_161 | Press + from chip-selected value | Positive | P2 |
| TC_DWI_162 | Press - from chip-selected value | Positive | P2 |
| TC_DWI_163 | Press + then Save → correct value saved | Positive | P1 |
| TC_DWI_164 | + button visual feedback on click | Positive | P3 |
| TC_DWI_165 | + button bg-slate-100 dark:bg-slate-700 | Positive | P2 |
| TC_DWI_166 | Yesterday weight hiển thị khi có entry hôm qua | Positive | P1 |
| TC_DWI_167 | Yesterday info ẩn khi không có entry | Edge | P1 |
| TC_DWI_168 | Delta positive +0.5 → text-red-500 | Positive | P1 |
| TC_DWI_169 | Delta negative -0.3 → text-emerald-600 | Positive | P1 |
| TC_DWI_170 | Delta zero 0.0 → text-slate-400 | Edge | P2 |
| TC_DWI_171 | Delta với 1 decimal precision | Positive | P2 |
| TC_DWI_172 | Delta: +2.5 (large gain) | Positive | P2 |
| TC_DWI_173 | Delta: -3.0 (large loss) | Positive | P2 |
| TC_DWI_174 | Delta: +0.1 (minimal gain) | Positive | P2 |
| TC_DWI_175 | Moving average với 1 entry → null → ẩn | Edge | P1 |
| TC_DWI_176 | Moving average với 2 entries → null → ẩn | Edge | P1 |
| TC_DWI_177 | Moving average với 3 entries → hiển thị | Positive | P1 |
| TC_DWI_178 | Moving average với 7 entries → 7-day average | Positive | P1 |
| TC_DWI_179 | Moving average với 14 entries → vẫn 7-day window | Positive | P2 |
| TC_DWI_180 | Moving average value rounded 1 decimal | Positive | P2 |
| TC_DWI_181 | Trend ↑ (gaining): movingAvg > yesterday | Positive | P1 |
| TC_DWI_182 | Trend ↓ (losing): movingAvg < yesterday | Positive | P1 |
| TC_DWI_183 | Trend → (stable): movingAvg ≈ yesterday (< 0.3kg diff) | Positive | P2 |
| TC_DWI_184 | Trend hidden khi no movingAvg (< 3 entries) | Edge | P1 |
| TC_DWI_185 | Trend hidden khi no yesterday entry | Edge | P1 |
| TC_DWI_186 | Trend aria-label attribute | Positive | P2 |
| TC_DWI_187 | First-time user: no entries → input=0, no extras | Edge | P0 |
| TC_DWI_188 | Only today entry: no yesterday, no avg | Edge | P1 |
| TC_DWI_189 | 3 entries over 3 days: avg + trend hiển thị | Positive | P1 |
| TC_DWI_190 | Delta thay đổi khi input thay đổi (live update) | Positive | P1 |
| TC_DWI_191 | Moving average chỉ dùng last 7 days | Positive | P2 |
| TC_DWI_192 | Moving average ignores entries > 7 days | Positive | P2 |
| TC_DWI_193 | Supplementary info dark mode colors | Positive | P2 |
| TC_DWI_194 | Yesterday section dark mode text | Positive | P2 |
| TC_DWI_195 | Delta colors consistent in dark mode | Positive | P2 |
| TC_DWI_196 | Input type="number" attribute | Positive | P2 |
| TC_DWI_197 | Input chấp nhận decimal values | Positive | P1 |
| TC_DWI_198 | Input reject non-numeric text | Negative | P1 |
| TC_DWI_199 | Input empty string → value = 0 | Edge | P1 |
| TC_DWI_200 | Input negative number → save disabled | Negative | P1 |
| TC_DWI_201 | Input value > 300 → save disabled | Negative | P0 |
| TC_DWI_202 | Input value < 30 → save disabled | Negative | P0 |
| TC_DWI_203 | Input paste value from clipboard | Positive | P2 |
| TC_DWI_204 | Input with leading zeros: "072" → 72 | Edge | P2 |
| TC_DWI_205 | Input with multiple decimal points: "72.5.3" | Negative | P2 |
| TC_DWI_206 | Dark mode: container bg-slate-800 khi unsaved | Positive | P2 |
| TC_DWI_207 | Dark mode: container bg-emerald-950/30 khi saved | Positive | P2 |
| TC_DWI_208 | Dark mode: input field dark:bg-slate-700 | Positive | P2 |
| TC_DWI_209 | Accessibility: all interactive elements có aria-label | Positive | P1 |
| TC_DWI_210 | Screen reader: input label đọc "Cân nặng hôm nay" | Positive | P2 |

---

## Chi tiết Test Cases

##### TC_DWI_01: Component render với initial weight từ today entry
- **Pre-conditions**: weightEntries chứa entry cho today: { date: today, weightKg: 75.5 }
- **Steps**: 1. Render DailyWeightInput
- **Expected**: Input value = 75.5, isSaved = true, border emerald
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DWI_02: Component render với initial weight từ latest entry (no today)
- **Pre-conditions**: Không có entry hôm nay, có entry hôm qua: 74.0
- **Steps**: 1. Render DailyWeightInput
- **Expected**: Input value = 74.0, isSaved = false, border slate
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DWI_03: Component render với 0 khi không có entries
- **Pre-conditions**: weightEntries = []
- **Steps**: 1. Render DailyWeightInput
- **Expected**: Input value rỗng (0 → hiển thị ''), isSaved = false
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_04: Nhập weight qua text input
- **Pre-conditions**: Component đã render
- **Steps**: 1. Click vào input 2. Xóa text cũ 3. Nhập "72.5"
- **Expected**: inputValue = 72.5, isSaved = false
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DWI_05: Click nút + tăng 0.1kg
- **Pre-conditions**: inputValue = 70.0
- **Steps**: 1. Click nút + (aria-label="Tăng")
- **Expected**: inputValue = 70.1, isSaved = false
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DWI_06: Click nút − giảm 0.1kg
- **Pre-conditions**: inputValue = 70.0
- **Steps**: 1. Click nút − (aria-label="Giảm")
- **Expected**: inputValue = 69.9, isSaved = false
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DWI_07: Chọn recent chip → input cập nhật
- **Pre-conditions**: Recent chips hiển thị [74.0, 73.5, 73.0]
- **Steps**: 1. Click chip 73.5
- **Expected**: inputValue = 73.5, isSaved = false
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DWI_08: Recent chips hiển thị tối đa 5 giá trị unique
- **Pre-conditions**: 10 entries với 8 giá trị unique
- **Steps**: 1. Quan sát data-testid="quick-select-chips"
- **Expected**: Tối đa 5 chip buttons hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_09: Recent chips exclude hôm nay
- **Pre-conditions**: Entry hôm nay = 75.0, entries khác = [74.0, 73.5]
- **Steps**: 1. Quan sát chips
- **Expected**: 75.0 không xuất hiện trong chips (excluded)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_10: Recent chips sắp xếp theo ngày giảm dần
- **Pre-conditions**: Entries: hôm qua=74.0, 2 ngày trước=73.5, 3 ngày trước=73.0
- **Steps**: 1. Quan sát thứ tự chips
- **Expected**: Chips: [74.0, 73.5, 73.0] (gần nhất trước)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_11: Chip đang chọn có style emerald highlight
- **Pre-conditions**: inputValue = 74.0, chip 74.0 tồn tại
- **Steps**: 1. Quan sát chip 74.0
- **Expected**: Chip có border-emerald-400, bg-emerald-100
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_12: Không có recent entries → chips section ẩn
- **Pre-conditions**: weightEntries = [] hoặc chỉ có 1 entry hôm nay
- **Steps**: 1. Quan sát component
- **Expected**: quick-select-chips không render
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_DWI_13: Save tạo mới entry cho today
- **Pre-conditions**: Không có entry hôm nay, inputValue = 72.0, isValid = true
- **Steps**: 1. Click save-weight-btn
- **Expected**: addWeightEntry gọi với { date: today, weightKg: 72.0 }, isSaved = true
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DWI_14: Save cập nhật entry nếu today đã có
- **Pre-conditions**: Có entry hôm nay = 71.0, inputValue = 72.0
- **Steps**: 1. Click save-weight-btn
- **Expected**: updateWeightEntry gọi với { weightKg: 72.0 }, không tạo entry mới
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DWI_15: Save → toast "Đã lưu" hiển thị
- **Pre-conditions**: isValid = true
- **Steps**: 1. Click save 2. Quan sát notification
- **Expected**: Toast success với text t('fitness.weight.saved') + "72 kg"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DWI_16: Toast có Undo action button
- **Pre-conditions**: Vừa save thành công
- **Steps**: 1. Quan sát toast notification
- **Expected**: Toast có action button label = t('common.undo')
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_17: Toast duration = 5000ms
- **Pre-conditions**: Vừa save
- **Steps**: 1. Đợi 5 giây
- **Expected**: Toast auto-dismiss sau 5s (UNDO_DURATION = 5000)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_18: Undo new entry → removeWeightEntry
- **Pre-conditions**: Save tạo entry mới (không có todayEntry trước đó)
- **Steps**: 1. Save 2. Click Undo trong toast
- **Expected**: Entry hôm nay bị xóa (removeWeightEntry), isSaved = false
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DWI_19: Undo update → revert to previousWeight
- **Pre-conditions**: todayEntry = 71.0, save mới = 72.0
- **Steps**: 1. Save 2. Click Undo
- **Expected**: Entry revert về 71.0 (updateWeightEntry previousWeight), isSaved = false
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DWI_20: Undo → isSaved = false, inputValue restored
- **Pre-conditions**: Save new entry 72.0
- **Steps**: 1. Click Undo
- **Expected**: isSaved = false, border chuyển về slate, inputValue = savedWeight (72.0)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_21: Save button disabled khi input invalid
- **Pre-conditions**: inputValue = 25 (< MIN_WEIGHT)
- **Steps**: 1. Quan sát save-weight-btn
- **Expected**: Button có disabled attribute, opacity-40
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_DWI_22: Input < 30kg → disabled save
- **Pre-conditions**: inputValue = 29
- **Steps**: 1. Quan sát save button
- **Expected**: disabled = true
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P0

##### TC_DWI_23: Input > 300kg → disabled save
- **Pre-conditions**: inputValue = 301
- **Steps**: 1. Quan sát save button
- **Expected**: disabled = true
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P0

##### TC_DWI_24: Input = 30kg → save enabled (boundary min)
- **Pre-conditions**: inputValue = 30
- **Steps**: 1. Quan sát save button
- **Expected**: disabled = false, save functional
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DWI_25: Input = 300kg → save enabled (boundary max)
- **Pre-conditions**: inputValue = 300
- **Steps**: 1. Quan sát save button
- **Expected**: disabled = false, save functional
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DWI_26: Input = 29.9kg → disabled
- **Pre-conditions**: inputValue = 29.9
- **Steps**: 1. Quan sát save button
- **Expected**: disabled = true (< MIN_WEIGHT 30)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DWI_27: Input = 300.1kg → disabled
- **Pre-conditions**: inputValue = 300.1
- **Steps**: 1. Quan sát save button
- **Expected**: disabled = true (> MAX_WEIGHT 300)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DWI_28: Input empty → value = 0 → disabled
- **Pre-conditions**: Xóa hết nội dung input
- **Steps**: 1. Clear input 2. Quan sát save button
- **Expected**: inputValue = 0, isValid = false, save disabled
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_DWI_29: Click + khi value = 300 → không tăng thêm
- **Pre-conditions**: inputValue = 300
- **Steps**: 1. Click nút + 5 lần
- **Expected**: inputValue vẫn = 300, không vượt MAX_WEIGHT
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DWI_30: Click − khi value = 30 → không giảm thêm
- **Pre-conditions**: inputValue = 30
- **Steps**: 1. Click nút − 5 lần
- **Expected**: inputValue vẫn = 30, không dưới MIN_WEIGHT
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DWI_31: Decimal precision 0.1kg (70.1, 70.2...)
- **Pre-conditions**: inputValue = 70.0
- **Steps**: 1. Click + 1 lần 2. Click + thêm 1 lần
- **Expected**: 70.0 → 70.1 → 70.2, chính xác 1 decimal
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_32: Floating point: 70.1 + 0.1 = 70.2 (không phải 70.20000001)
- **Pre-conditions**: inputValue = 70.1
- **Steps**: 1. Click + 1 lần
- **Expected**: inputValue = 70.2 (round1 xử lý floating point)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_DWI_33: Yesterday weight hiển thị khi có entry hôm qua
- **Pre-conditions**: Entry hôm qua = 74.0
- **Steps**: 1. Quan sát data-testid="yesterday-info"
- **Expected**: Text "Hôm qua: 74 kg"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_34: Yesterday info ẩn khi không có entry hôm qua
- **Pre-conditions**: Không có entry cho yesterday
- **Steps**: 1. Quan sát component
- **Expected**: yesterday-info không render
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_DWI_35: Delta hiển thị so với yesterday
- **Pre-conditions**: inputValue = 75.0, yesterdayEntry.weightKg = 74.0
- **Steps**: 1. Quan sát data-testid="weight-delta"
- **Expected**: Text "(+1)"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_36: Delta dương → text-red-500 (+X)
- **Pre-conditions**: inputValue > yesterdayEntry.weightKg
- **Steps**: 1. Quan sát weight-delta class
- **Expected**: class chứa text-red-500
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_37: Delta âm → text-emerald-600 (-X)
- **Pre-conditions**: inputValue < yesterdayEntry.weightKg
- **Steps**: 1. Quan sát weight-delta class
- **Expected**: class chứa text-emerald-600
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_38: Delta = 0 → text-slate-400
- **Pre-conditions**: inputValue = yesterdayEntry.weightKg
- **Steps**: 1. Quan sát weight-delta class
- **Expected**: class chứa text-slate-400, text "(0)"
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_DWI_39: Moving average 7 ngày hiển thị
- **Pre-conditions**: weightEntries có ≥ 3 entries trong 7 ngày
- **Steps**: 1. Quan sát data-testid="moving-average"
- **Expected**: Text "TB 7 ngày: X.X kg" với fontVariantNumeric tabular-nums
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_40: Moving average = null khi < 3 entries → ẩn
- **Pre-conditions**: weightEntries có < 3 entries trong 7 ngày
- **Steps**: 1. Quan sát component
- **Expected**: moving-average không render
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_DWI_41: Trend ↑ (gaining) → text-red-500
- **Pre-conditions**: movingAvg > yesterdayEntry.weightKg
- **Steps**: 1. Quan sát data-testid="trend-indicator"
- **Expected**: symbol = "↑", class text-red-500
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_42: Trend ↓ (losing) → text-emerald-500
- **Pre-conditions**: movingAvg < yesterdayEntry.weightKg
- **Steps**: 1. Quan sát trend-indicator
- **Expected**: symbol = "↓", class text-emerald-500
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_43: Trend → (stable) → text-slate-400
- **Pre-conditions**: movingAvg = yesterdayEntry.weightKg
- **Steps**: 1. Quan sát trend-indicator
- **Expected**: symbol = "→", class text-slate-400
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_44: Trend ẩn khi movingAvg null hoặc no yesterday
- **Pre-conditions**: Không có entry hôm qua hoặc < 3 entries (movingAvg = null)
- **Steps**: 1. Quan sát component
- **Expected**: trend-indicator không render
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_DWI_45: tabular-nums trên input field
- **Pre-conditions**: Component render
- **Steps**: 1. Inspect data-testid="weight-input" style
- **Expected**: fontVariantNumeric = "tabular-nums"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_46: tabular-nums trên recent chips
- **Pre-conditions**: Recent chips hiển thị
- **Steps**: 1. Inspect chip button style
- **Expected**: fontVariantNumeric = "tabular-nums"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_47: isSaved = true → border emerald, bg emerald
- **Pre-conditions**: Vừa save thành công
- **Steps**: 1. Quan sát container class
- **Expected**: border-emerald-400 bg-emerald-50 (hoặc dark variant)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_48: isSaved = false → border slate, bg white
- **Pre-conditions**: Chưa save hoặc vừa thay đổi input
- **Steps**: 1. Quan sát container class
- **Expected**: border-slate-300 bg-white (hoặc dark variant)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_49: Save → isSaved = true → chọn chip → isSaved = false
- **Pre-conditions**: Đã save xong (isSaved = true)
- **Steps**: 1. Click chip khác giá trị
- **Expected**: isSaved chuyển false, border chuyển về slate
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_50: Save → isSaved = true → thay đổi input → isSaved = false
- **Pre-conditions**: Đã save xong
- **Steps**: 1. Thay đổi giá trị trong input
- **Expected**: isSaved chuyển false
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_51: Save 2 lần cùng ngày → chỉ 1 entry (update)
- **Pre-conditions**: Không có entry hôm nay
- **Steps**: 1. Nhập 72.0 → Save 2. Nhập 73.0 → Save
- **Expected**: Chỉ 1 entry cho today với weightKg = 73.0 (update, không duplicate)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DWI_52: First time user: no entries → input = 0, no chips, no avg, no trend
- **Pre-conditions**: weightEntries = [], đây là lần đầu dùng
- **Steps**: 1. Render component
- **Expected**: Input = 0 (empty), no chips, no moving-average, no trend-indicator, no yesterday-info
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P0

##### TC_DWI_53: Dark mode — colors dark variant
- **Pre-conditions**: Dark mode enabled
- **Steps**: 1. Quan sát component
- **Expected**: Container dark:bg-slate-800, text dark:text-slate-100, border dark:border-slate-600
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_54: XSS trong weight notes → escaped đúng
- **Pre-conditions**: Entry với notes = `<img onerror="alert(1)" src=x>`
- **Steps**: 1. Render component
- **Expected**: Text escaped, không execute script
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_DWI_55: Rapid click +/− 50 lần → value stable, no jank
- **Pre-conditions**: inputValue = 70.0
- **Steps**: 1. Click + nhanh 25 lần 2. Click − nhanh 25 lần
- **Expected**: Giá trị cuối = 70.0, UI không jank, precision đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DWI_56: Nhập weight = 30.0 (exact min boundary)
- **Pre-conditions**: Không có entry hôm nay
- **Steps**: 1. Nhập 30.0 vào input 2. Click Save
- **Expected**: Save thành công, entry tạo với weightKg = 30.0
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DWI_57: Nhập weight = 30.1 (just above min)
- **Pre-conditions**: Không có entry hôm nay
- **Steps**: 1. Nhập 30.1 vào input
- **Expected**: isValid = true, save enabled
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DWI_58: Nhập weight = 50.0
- **Pre-conditions**: Không có entry hôm nay
- **Steps**: 1. Nhập 50.0 2. Click Save
- **Expected**: Entry tạo với weightKg = 50.0, toast hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_59: Nhập weight = 60.5
- **Pre-conditions**: Không có entry hôm nay
- **Steps**: 1. Nhập 60.5 2. Click Save
- **Expected**: Entry tạo với weightKg = 60.5
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_60: Nhập weight = 70.0 (typical value)
- **Pre-conditions**: Không có entry hôm nay
- **Steps**: 1. Nhập 70.0 2. Click Save
- **Expected**: Entry tạo với weightKg = 70.0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_61: Nhập weight = 75.5
- **Pre-conditions**: Entry hôm nay = 74.0
- **Steps**: 1. Nhập 75.5 2. Click Save
- **Expected**: Entry updated, toast "Đã lưu 75.5 kg"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_62: Nhập weight = 80.0
- **Pre-conditions**: Không có entry hôm nay
- **Steps**: 1. Nhập 80.0 2. Click Save
- **Expected**: Entry tạo, isSaved = true
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_63: Nhập weight = 100.0
- **Pre-conditions**: Không có entry
- **Steps**: 1. Nhập 100.0 2. Click Save
- **Expected**: Entry tạo với weightKg = 100.0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_64: Nhập weight = 120.5
- **Pre-conditions**: Không có entry
- **Steps**: 1. Nhập 120.5 2. Click Save
- **Expected**: Entry tạo với weightKg = 120.5
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_65: Nhập weight = 150.0
- **Pre-conditions**: Không có entry
- **Steps**: 1. Nhập 150.0 2. Click Save
- **Expected**: Entry tạo, save thành công
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_66: Nhập weight = 200.0
- **Pre-conditions**: Không có entry
- **Steps**: 1. Nhập 200.0 2. Click Save
- **Expected**: Entry tạo với weightKg = 200.0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_67: Nhập weight = 250.0
- **Pre-conditions**: Không có entry
- **Steps**: 1. Nhập 250.0 2. Click Save
- **Expected**: Entry tạo, giá trị hợp lệ
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_68: Nhập weight = 299.9 (just below max)
- **Pre-conditions**: Không có entry
- **Steps**: 1. Nhập 299.9
- **Expected**: isValid = true, save enabled
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DWI_69: Nhập weight = 300.0 (exact max boundary)
- **Pre-conditions**: Không có entry
- **Steps**: 1. Nhập 300.0 2. Click Save
- **Expected**: Save thành công, entry tạo với weightKg = 300.0
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DWI_70: Nhập weight integer 70 (không decimal)
- **Pre-conditions**: Không có entry
- **Steps**: 1. Nhập "70" 2. Click Save
- **Expected**: Entry tạo với weightKg = 70, save OK
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_71: Nhập weight với .0 decimal (75.0)
- **Pre-conditions**: Không có entry
- **Steps**: 1. Nhập "75.0"
- **Expected**: inputValue = 75.0, hiển thị đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_72: Nhập weight với .5 decimal (72.5)
- **Pre-conditions**: Không có entry
- **Steps**: 1. Nhập "72.5"
- **Expected**: inputValue = 72.5
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_73: Nhập weight .1 decimal precision (70.1)
- **Pre-conditions**: Không có entry
- **Steps**: 1. Nhập "70.1"
- **Expected**: inputValue = 70.1
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_74: Nhập weight .9 decimal precision (70.9)
- **Pre-conditions**: Không có entry
- **Steps**: 1. Nhập "70.9"
- **Expected**: inputValue = 70.9
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_75: Re-enter same value as yesterday
- **Pre-conditions**: yesterday entry = 71.0
- **Steps**: 1. Nhập 71.0
- **Expected**: inputValue = 71.0, delta = 0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_76: Nhập value khác biệt lớn so với yesterday (+10kg)
- **Pre-conditions**: yesterday = 70.0
- **Steps**: 1. Nhập 80.0
- **Expected**: inputValue = 80.0, delta = +10.0 text-red-500
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_DWI_77: Nhập value giảm nhẹ so với yesterday (-0.3kg)
- **Pre-conditions**: yesterday = 70.3
- **Steps**: 1. Nhập 70.0
- **Expected**: delta = -0.3, text-emerald-600
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_78: Nhập weight via +/- buttons từ initial 70.0
- **Pre-conditions**: inputValue = 70.0
- **Steps**: 1. Click + 5 lần
- **Expected**: inputValue = 70.5
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_79: Nhập weight via text input typing 85.5
- **Pre-conditions**: inputValue = 0
- **Steps**: 1. Clear input 2. Type "85.5"
- **Expected**: inputValue = 85.5
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_80: Nhập weight via chip selection 72.0
- **Pre-conditions**: Recent chips chứa 72.0
- **Steps**: 1. Click chip 72.0
- **Expected**: inputValue = 72.0, isSaved = false
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_81: 0 entries → chips section không hiển thị
- **Pre-conditions**: weightEntries = []
- **Steps**: 1. Render component
- **Expected**: Không có recent chips section trong DOM
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_DWI_82: 1 entry (yesterday) → 1 chip hiển thị
- **Pre-conditions**: 1 entry hôm qua: 71.0
- **Steps**: 1. Quan sát chips
- **Expected**: 1 chip: 71.0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_83: 2 unique entries → 2 chips hiển thị
- **Pre-conditions**: 2 entries: 71.0, 72.5
- **Steps**: 1. Quan sát chips
- **Expected**: 2 chips: 72.5, 71.0 (sorted by date)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_84: 3 unique entries → 3 chips
- **Pre-conditions**: 3 entries: 70.0, 71.5, 72.0
- **Steps**: 1. Quan sát chips
- **Expected**: 3 chips hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_85: 5 unique entries → 5 chips (max)
- **Pre-conditions**: 5 entries với 5 giá trị khác nhau
- **Steps**: 1. Quan sát chips
- **Expected**: Đúng 5 chips hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_86: 6+ unique entries → vẫn chỉ 5 chips
- **Pre-conditions**: 8 entries với 8 giá trị khác nhau
- **Steps**: 1. Quan sát chips
- **Expected**: Chỉ 5 chips (RECENT_CHIP_COUNT = 5)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DWI_87: Chips exclude entry hôm nay
- **Pre-conditions**: Entry hôm nay = 70.0, entry hôm qua = 71.0
- **Steps**: 1. Quan sát chips
- **Expected**: Chip 71.0 hiển thị, chip 70.0 KHÔNG hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_88: Chips chỉ hiển thị unique values (no duplicates)
- **Pre-conditions**: 3 entries: 70.0, 70.0, 71.0
- **Steps**: 1. Quan sát chips
- **Expected**: 2 chips: 71.0, 70.0 (unique)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_89: Chip values sorted by date (most recent first)
- **Pre-conditions**: Entries: 3 ngày trước=68.0, 2 ngày=69.0, hôm qua=70.0
- **Steps**: 1. Quan sát thứ tự chips
- **Expected**: Chips: 70.0, 69.0, 68.0 (newest first)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_90: Chip click fills input with value
- **Pre-conditions**: Chip 72.0 hiển thị, inputValue = 70.0
- **Steps**: 1. Click chip 72.0
- **Expected**: inputValue = 72.0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DWI_91: Chip click sets isSaved = false
- **Pre-conditions**: isSaved = true (đã save)
- **Steps**: 1. Click chip 71.0
- **Expected**: isSaved = false, border chuyển sang slate
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_92: Chip active khi value matches inputValue
- **Pre-conditions**: inputValue = 71.0, chip 71.0 exists
- **Steps**: 1. Quan sát chip 71.0 style
- **Expected**: border-emerald-400 bg-emerald-100 (active)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_93: Chip inactive khi value khác inputValue
- **Pre-conditions**: inputValue = 70.0, chip 71.0 exists
- **Steps**: 1. Quan sát chip 71.0 style
- **Expected**: border-slate-200 bg-slate-50 (inactive)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_94: Chip hiển thị weight format "XX.X kg"
- **Pre-conditions**: Chip value = 71.5
- **Steps**: 1. Quan sát chip text
- **Expected**: Text chứa "71.5" và "kg"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_95: Chip text có tabular-nums class
- **Pre-conditions**: Có chips
- **Steps**: 1. Inspect chip text style
- **Expected**: font-variant-numeric: tabular-nums hoặc class [tabular-nums]
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_96: Multiple entries same weight → single chip
- **Pre-conditions**: 5 entries tất cả = 70.0
- **Steps**: 1. Quan sát chips
- **Expected**: 1 chip: 70.0
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_DWI_97: All entries same weight → 1 chip duy nhất
- **Pre-conditions**: 10 entries, tất cả weightKg = 72.0
- **Steps**: 1. Quan sát chips
- **Expected**: Chỉ 1 chip: 72.0
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_DWI_98: Chip selection then save → entry created correctly
- **Pre-conditions**: Chip 71.0, click chip, click Save
- **Steps**: 1. Click chip 71.0 2. Click Save
- **Expected**: Entry tạo/update với weightKg = 71.0, isSaved = true
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_99: Chip selection then +/- button → value thay đổi từ chip
- **Pre-conditions**: Click chip 70.0 → inputValue = 70.0
- **Steps**: 1. Click chip 70.0 2. Click + 3 lần
- **Expected**: inputValue = 70.3
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_100: Chip dark mode styling
- **Pre-conditions**: Dark mode, có chips
- **Steps**: 1. Quan sát chips
- **Expected**: dark:border-slate-600, dark:bg-slate-700 (inactive)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_101: Dark mode chip active state
- **Pre-conditions**: Dark mode, chip matches inputValue
- **Steps**: 1. Quan sát active chip
- **Expected**: dark:border-emerald-500, dark:bg-emerald-900/50
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_102: Chip aria-label includes weight value
- **Pre-conditions**: Chip 71.5
- **Steps**: 1. Inspect chip button
- **Expected**: aria-label chứa "71.5" và "kg"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_103: Chip click after save → isSaved false
- **Pre-conditions**: isSaved = true
- **Steps**: 1. Click chip 69.0
- **Expected**: isSaved = false, border từ emerald → slate
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_104: Chip keyboard: Enter to select
- **Pre-conditions**: Focus trên chip button
- **Steps**: 1. Nhấn Enter
- **Expected**: inputValue = chip value, isSaved = false
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_105: Chip keyboard: Tab navigation qua chips
- **Pre-conditions**: Có 3 chips
- **Steps**: 1. Tab qua các chips
- **Expected**: Focus di chuyển qua 3 chip buttons
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_106: Save tạo new entry khi chưa có today entry
- **Pre-conditions**: todayEntry = undefined, inputValue = 72.0
- **Steps**: 1. Click Save
- **Expected**: addWeightEntry called với date = today, weightKg = 72.0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DWI_107: Save updates existing entry khi đã có today entry
- **Pre-conditions**: todayEntry exists, inputValue = 73.0
- **Steps**: 1. Click Save
- **Expected**: updateWeightEntry called với new weightKg = 73.0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DWI_108: Save entry có đúng date format YYYY-MM-DD
- **Pre-conditions**: inputValue = 70.0
- **Steps**: 1. Click Save
- **Expected**: Entry date = today formatted "YYYY-MM-DD"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_109: Save entry có đúng weightKg value
- **Pre-conditions**: inputValue = 72.5
- **Steps**: 1. Click Save
- **Expected**: Entry weightKg = 72.5 (exact value)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_110: Save entry có timestamp updatedAt
- **Pre-conditions**: inputValue = 71.0
- **Steps**: 1. Click Save
- **Expected**: Entry có updatedAt = current timestamp
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_111: Save sets isSaved = true
- **Pre-conditions**: isSaved = false
- **Steps**: 1. Click Save
- **Expected**: isSaved = true, border emerald, bg emerald
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DWI_112: Save shows notification "Đã lưu X kg"
- **Pre-conditions**: inputValue = 72.5
- **Steps**: 1. Click Save
- **Expected**: Toast notification hiển thị "Đã lưu 72.5 kg"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DWI_113: Notification có Undo button
- **Pre-conditions**: Save thành công
- **Steps**: 1. Quan sát toast
- **Expected**: Toast chứa Undo action button
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_114: Notification duration = 5000ms
- **Pre-conditions**: Save thành công
- **Steps**: 1. Quan sát toast 2. Đợi 5s
- **Expected**: Toast tự dismiss sau 5000ms
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_115: Undo new entry → removeWeightEntry called
- **Pre-conditions**: Save tạo new entry, toast hiện
- **Steps**: 1. Click Undo trong toast
- **Expected**: removeWeightEntry called, entry bị xóa
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DWI_116: Undo update → restores previousWeight
- **Pre-conditions**: Save updated từ 70.0 → 72.0, toast hiện
- **Steps**: 1. Click Undo
- **Expected**: updateWeightEntry called với weight = 70.0 (previous)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DWI_117: Undo sets isSaved = false
- **Pre-conditions**: Save rồi Undo
- **Steps**: 1. Click Undo
- **Expected**: isSaved = false, border slate
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_118: Undo restores inputValue to previous
- **Pre-conditions**: Save 72.0 (previous = 70.0), Undo
- **Steps**: 1. Click Undo
- **Expected**: inputValue = 70.0 (restored)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_119: Toast auto-dismiss sau 5s không cần action
- **Pre-conditions**: Save thành công, toast hiện
- **Steps**: 1. Không click gì 2. Đợi 5s
- **Expected**: Toast tự ẩn, entry giữ nguyên
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_120: Save twice same day → chỉ 1 entry (update)
- **Pre-conditions**: Save 70.0 → Save 72.0 cùng ngày
- **Steps**: 1. Save 70.0 2. Change to 72.0 3. Save
- **Expected**: Chỉ 1 entry cho today: weightKg = 72.0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DWI_121: Save, undo, save again → entry created correctly
- **Pre-conditions**: Save 70.0, Undo, nhập 71.0, Save
- **Steps**: 1. Save 70.0 2. Undo 3. Nhập 71.0 4. Save
- **Expected**: Entry final = 71.0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_122: Save with value at min boundary (30)
- **Pre-conditions**: inputValue = 30
- **Steps**: 1. Click Save
- **Expected**: Entry tạo với weightKg = 30, save thành công
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DWI_123: Save with value at max boundary (300)
- **Pre-conditions**: inputValue = 300
- **Steps**: 1. Click Save
- **Expected**: Entry tạo với weightKg = 300, save thành công
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DWI_124: Save button disabled khi invalid (< 30)
- **Pre-conditions**: inputValue = 25
- **Steps**: 1. Quan sát save button
- **Expected**: Button disabled, opacity-50 hoặc pointer-events-none
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_DWI_125: Save button enabled khi valid
- **Pre-conditions**: inputValue = 70
- **Steps**: 1. Quan sát save button
- **Expected**: Button enabled, clickable
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_126: Save button aria-label: "Đã lưu" khi saved
- **Pre-conditions**: isSaved = true
- **Steps**: 1. Inspect save button
- **Expected**: aria-label = t("fitness.weight.saved")
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_127: Save button aria-label: "Lưu" khi unsaved
- **Pre-conditions**: isSaved = false
- **Steps**: 1. Inspect save button
- **Expected**: aria-label = t("common.save")
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_128: Save button style: bg-emerald-500 text-white khi saved
- **Pre-conditions**: isSaved = true
- **Steps**: 1. Inspect save button
- **Expected**: bg-emerald-500 text-white
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_129: Save button style: bg-emerald-100 text-emerald-600 khi unsaved
- **Pre-conditions**: isSaved = false
- **Steps**: 1. Inspect save button
- **Expected**: bg-emerald-100 text-emerald-600
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_130: Container border: emerald khi saved
- **Pre-conditions**: isSaved = true
- **Steps**: 1. Inspect container
- **Expected**: border-emerald-400 bg-emerald-50
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_131: Container border: slate khi unsaved
- **Pre-conditions**: isSaved = false
- **Steps**: 1. Inspect container
- **Expected**: border-slate-300 bg-white
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_132: Multiple saves nhanh liên tục (debounce check)
- **Pre-conditions**: inputValue = 70
- **Steps**: 1. Click Save 5 lần nhanh trong 1s
- **Expected**: Chỉ 1 entry cuối, không duplicate, notification cuối hiện
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DWI_133: Save then thay đổi input → isSaved = false
- **Pre-conditions**: Save xong (isSaved = true)
- **Steps**: 1. Thay đổi input value
- **Expected**: isSaved = false, border chuyển slate
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_134: Save then select chip → isSaved = false
- **Pre-conditions**: Save xong
- **Steps**: 1. Click chip 69.0
- **Expected**: isSaved = false
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_135: Save then press + → isSaved = false
- **Pre-conditions**: Save xong
- **Steps**: 1. Click + button
- **Expected**: isSaved = false, value +0.1
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_136: Save then press - → isSaved = false
- **Pre-conditions**: Save xong
- **Steps**: 1. Click - button
- **Expected**: isSaved = false, value -0.1
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_137: Undo then save new value
- **Pre-conditions**: Save 70.0, Undo, nhập 72.0
- **Steps**: 1. Save 70.0 2. Undo 3. Nhập 72.0 4. Save
- **Expected**: Entry = 72.0, toast mới hiện
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_138: Save with floating point precision
- **Pre-conditions**: inputValue = 70.1 (sau nhiều +0.1)
- **Steps**: 1. Click Save
- **Expected**: Entry weightKg = 70.1 (not 70.10000001)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_DWI_139: Save entry ID generation unique
- **Pre-conditions**: Save 2 lần khác ngày
- **Steps**: 1. Save today 2. Save tomorrow (giả lập)
- **Expected**: Mỗi entry có ID unique
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_140: Notification trigger khi save thành công
- **Pre-conditions**: inputValue valid
- **Steps**: 1. Click Save
- **Expected**: useNotification called với success type, weight info
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_141: Press + once: 70.0 → 70.1
- **Pre-conditions**: inputValue = 70.0
- **Steps**: 1. Click +
- **Expected**: inputValue = 70.1
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DWI_142: Press + five times: 70.0 → 70.5
- **Pre-conditions**: inputValue = 70.0
- **Steps**: 1. Click + 5 lần
- **Expected**: inputValue = 70.5
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_143: Press + ten times: 70.0 → 71.0
- **Pre-conditions**: inputValue = 70.0
- **Steps**: 1. Click + 10 lần
- **Expected**: inputValue = 71.0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_144: Press - once: 70.0 → 69.9
- **Pre-conditions**: inputValue = 70.0
- **Steps**: 1. Click -
- **Expected**: inputValue = 69.9
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DWI_145: Press - five times: 70.0 → 69.5
- **Pre-conditions**: inputValue = 70.0
- **Steps**: 1. Click - 5 lần
- **Expected**: inputValue = 69.5
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_146: Press - at 30.0 → stays 30.0 (min clamp)
- **Pre-conditions**: inputValue = 30.0
- **Steps**: 1. Click -
- **Expected**: inputValue = 30.0 (không giảm)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P0

##### TC_DWI_147: Press + at 300.0 → stays 300.0 (max clamp)
- **Pre-conditions**: inputValue = 300.0
- **Steps**: 1. Click +
- **Expected**: inputValue = 300.0 (không tăng)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P0

##### TC_DWI_148: Press - at 30.1 → goes to 30.0
- **Pre-conditions**: inputValue = 30.1
- **Steps**: 1. Click -
- **Expected**: inputValue = 30.0
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DWI_149: Press + at 299.9 → goes to 300.0
- **Pre-conditions**: inputValue = 299.9
- **Steps**: 1. Click +
- **Expected**: inputValue = 300.0
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DWI_150: Floating point: 70.1 + 0.1 = 70.2 (no precision error)
- **Pre-conditions**: inputValue = 70.1
- **Steps**: 1. Click +
- **Expected**: inputValue = 70.2 (exact, không phải 70.20000000001)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_DWI_151: Floating point: 70.7 + 0.1 = 70.8
- **Pre-conditions**: inputValue = 70.7
- **Steps**: 1. Click +
- **Expected**: inputValue = 70.8
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_DWI_152: Floating point: 70.9 + 0.1 = 71.0
- **Pre-conditions**: inputValue = 70.9
- **Steps**: 1. Click +
- **Expected**: inputValue = 71.0 (cross integer)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_DWI_153: Rapid press + 50 lần → stable
- **Pre-conditions**: inputValue = 70.0
- **Steps**: 1. Click + 50 lần nhanh
- **Expected**: inputValue = 75.0, UI không jank
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DWI_154: Rapid press - 50 lần → stable
- **Pre-conditions**: inputValue = 75.0
- **Steps**: 1. Click - 50 lần nhanh
- **Expected**: inputValue = 70.0, UI stable
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DWI_155: Alternating + và - 20 lần
- **Pre-conditions**: inputValue = 70.0
- **Steps**: 1. Click + - + - ... 20 lần
- **Expected**: inputValue = 70.0 (back to start), no precision drift
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DWI_156: + button sets isSaved = false
- **Pre-conditions**: isSaved = true
- **Steps**: 1. Click +
- **Expected**: isSaved = false
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_157: - button sets isSaved = false
- **Pre-conditions**: isSaved = true
- **Steps**: 1. Click -
- **Expected**: isSaved = false
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_158: + button aria-label = t("common.increase")
- **Pre-conditions**: Có component
- **Steps**: 1. Inspect + button
- **Expected**: aria-label = "Tăng" hoặc t("common.increase")
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_159: - button aria-label = t("common.decrease")
- **Pre-conditions**: Có component
- **Steps**: 1. Inspect - button
- **Expected**: aria-label = "Giảm" hoặc t("common.decrease")
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_160: Button touch-friendly size ≥ 44px
- **Pre-conditions**: Mobile viewport
- **Steps**: 1. Measure + and - button dimensions
- **Expected**: Width và height ≥ 44px
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_DWI_161: Press + from chip-selected value
- **Pre-conditions**: Click chip 72.0 → inputValue = 72.0
- **Steps**: 1. Click +
- **Expected**: inputValue = 72.1
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_162: Press - from chip-selected value
- **Pre-conditions**: Click chip 72.0 → inputValue = 72.0
- **Steps**: 1. Click -
- **Expected**: inputValue = 71.9
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_163: Press + then Save → correct value saved
- **Pre-conditions**: inputValue = 70.0
- **Steps**: 1. Click + 3 lần 2. Click Save
- **Expected**: Entry weightKg = 70.3
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_164: + button visual feedback on click
- **Pre-conditions**: Có component
- **Steps**: 1. Click + button
- **Expected**: Button có visual feedback (hover/active state)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_DWI_165: + button bg-slate-100 dark:bg-slate-700
- **Pre-conditions**: Có component
- **Steps**: 1. Inspect + button style
- **Expected**: bg-slate-100 hover:bg-slate-200 dark:bg-slate-700
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_166: Yesterday weight hiển thị khi có entry hôm qua
- **Pre-conditions**: yesterdayEntry = { weightKg: 71.0 }
- **Steps**: 1. Quan sát yesterday section
- **Expected**: Text hiển thị "71.0 kg" cho yesterday
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_167: Yesterday info ẩn khi không có entry
- **Pre-conditions**: yesterdayEntry = undefined
- **Steps**: 1. Quan sát component
- **Expected**: Yesterday section không render
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_DWI_168: Delta positive +0.5 → text-red-500
- **Pre-conditions**: inputValue = 71.5, yesterday = 71.0
- **Steps**: 1. Quan sát delta
- **Expected**: Text "+0.5", class text-red-500
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_169: Delta negative -0.3 → text-emerald-600
- **Pre-conditions**: inputValue = 70.7, yesterday = 71.0
- **Steps**: 1. Quan sát delta
- **Expected**: Text "-0.3", class text-emerald-600
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_170: Delta zero 0.0 → text-slate-400
- **Pre-conditions**: inputValue = 71.0, yesterday = 71.0
- **Steps**: 1. Quan sát delta
- **Expected**: Text "0", class text-slate-400
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_DWI_171: Delta với 1 decimal precision
- **Pre-conditions**: inputValue = 72.35 (rounded)
- **Steps**: 1. Quan sát delta
- **Expected**: Delta = round1(72.35 - yesterday)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_172: Delta: +2.5 (large gain)
- **Pre-conditions**: inputValue = 73.5, yesterday = 71.0
- **Steps**: 1. Quan sát delta
- **Expected**: Text "+2.5", text-red-500
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_173: Delta: -3.0 (large loss)
- **Pre-conditions**: inputValue = 68.0, yesterday = 71.0
- **Steps**: 1. Quan sát delta
- **Expected**: Text "-3.0", text-emerald-600
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_174: Delta: +0.1 (minimal gain)
- **Pre-conditions**: inputValue = 71.1, yesterday = 71.0
- **Steps**: 1. Quan sát delta
- **Expected**: Text "+0.1", text-red-500
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_175: Moving average với 1 entry → null → ẩn
- **Pre-conditions**: 1 weight entry
- **Steps**: 1. Quan sát component
- **Expected**: Moving average section không render
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_DWI_176: Moving average với 2 entries → null → ẩn
- **Pre-conditions**: 2 weight entries
- **Steps**: 1. Quan sát component
- **Expected**: Moving average section không render (< 3 entries)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_DWI_177: Moving average với 3 entries → hiển thị
- **Pre-conditions**: 3 entries: 70.0, 71.0, 72.0
- **Steps**: 1. Quan sát moving average
- **Expected**: Hiển thị avg ≈ 71.0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_178: Moving average với 7 entries → 7-day average
- **Pre-conditions**: 7 entries liên tục
- **Steps**: 1. Quan sát avg
- **Expected**: Moving average = mean of 7 values
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_179: Moving average với 14 entries → vẫn 7-day window
- **Pre-conditions**: 14 entries
- **Steps**: 1. Quan sát avg
- **Expected**: Avg tính từ 7 entries gần nhất
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_180: Moving average value rounded 1 decimal
- **Pre-conditions**: Avg = 70.666... 
- **Steps**: 1. Quan sát avg text
- **Expected**: Hiển thị "70.7" (rounded)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_181: Trend ↑ (gaining): movingAvg > yesterday
- **Pre-conditions**: movingAvg = 72.0, yesterday = 71.0
- **Steps**: 1. Quan sát trend indicator
- **Expected**: Arrow ↑, text-red-500
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_182: Trend ↓ (losing): movingAvg < yesterday
- **Pre-conditions**: movingAvg = 70.0, yesterday = 71.0
- **Steps**: 1. Quan sát trend indicator
- **Expected**: Arrow ↓, text-emerald-500
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_183: Trend → (stable): movingAvg ≈ yesterday (< 0.3kg diff)
- **Pre-conditions**: movingAvg = 71.1, yesterday = 71.0
- **Steps**: 1. Quan sát trend indicator
- **Expected**: Arrow →, text-slate-400
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_184: Trend hidden khi no movingAvg (< 3 entries)
- **Pre-conditions**: 2 entries only
- **Steps**: 1. Quan sát component
- **Expected**: Trend indicator không render
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_DWI_185: Trend hidden khi no yesterday entry
- **Pre-conditions**: Có 7 entries nhưng không có hôm qua
- **Steps**: 1. Quan sát component
- **Expected**: Trend indicator không render
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_DWI_186: Trend aria-label attribute
- **Pre-conditions**: Trend visible
- **Steps**: 1. Inspect trend element
- **Expected**: aria-label = t("fitness.weight.trend")
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_187: First-time user: no entries → input=0, no extras
- **Pre-conditions**: weightEntries = []
- **Steps**: 1. Render component
- **Expected**: inputValue = 0, no chips, no avg, no trend, no yesterday
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P0

##### TC_DWI_188: Only today entry: no yesterday, no avg
- **Pre-conditions**: 1 entry hôm nay
- **Steps**: 1. Render component
- **Expected**: No yesterday section, no avg (1 < 3)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_DWI_189: 3 entries over 3 days: avg + trend hiển thị
- **Pre-conditions**: 3 entries: today, yesterday, 2 days ago
- **Steps**: 1. Quan sát component
- **Expected**: Avg hiển thị (≥ 3 entries), trend hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_190: Delta thay đổi khi input thay đổi (live update)
- **Pre-conditions**: yesterday = 71.0, inputValue = 72.0
- **Steps**: 1. Nhập 73.0
- **Expected**: Delta thay đổi từ +1.0 → +2.0 realtime
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_191: Moving average chỉ dùng last 7 days
- **Pre-conditions**: 30 entries, 7 gần nhất avg = 72.0
- **Steps**: 1. Quan sát avg
- **Expected**: Avg = 72.0 (only last 7 days)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_192: Moving average ignores entries > 7 days
- **Pre-conditions**: Entry 10 days ago = 90.0, last 7 days avg = 72.0
- **Steps**: 1. Quan sát avg
- **Expected**: Avg = 72.0, not affected by old entry
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_193: Supplementary info dark mode colors
- **Pre-conditions**: Dark mode, có yesterday + avg + trend
- **Steps**: 1. Quan sát info sections
- **Expected**: Text colors use dark variants
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_194: Yesterday section dark mode text
- **Pre-conditions**: Dark mode, có yesterday entry
- **Steps**: 1. Quan sát yesterday section
- **Expected**: dark:text-slate-300/400 variants
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_195: Delta colors consistent in dark mode
- **Pre-conditions**: Dark mode, delta positive
- **Steps**: 1. Quan sát delta
- **Expected**: text-red-500 vẫn đúng (same in dark)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_196: Input type="number" attribute
- **Pre-conditions**: Có component
- **Steps**: 1. Inspect input element
- **Expected**: type="number" attribute present
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_197: Input chấp nhận decimal values
- **Pre-conditions**: Nhập "72.5"
- **Steps**: 1. Type "72.5" vào input
- **Expected**: inputValue = 72.5
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_198: Input reject non-numeric text
- **Pre-conditions**: Nhập "abc"
- **Steps**: 1. Type "abc" vào input
- **Expected**: inputValue không thay đổi hoặc = 0, type="number" prevents
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_DWI_199: Input empty string → value = 0
- **Pre-conditions**: Clear input field
- **Steps**: 1. Xóa hết text trong input
- **Expected**: inputValue = 0
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_DWI_200: Input negative number → save disabled
- **Pre-conditions**: Nhập "-5"
- **Steps**: 1. Type "-5"
- **Expected**: inputValue = -5, isValid = false, save disabled
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_DWI_201: Input value > 300 → save disabled
- **Pre-conditions**: Nhập "350"
- **Steps**: 1. Type "350"
- **Expected**: isValid = false, save button disabled
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_DWI_202: Input value < 30 → save disabled
- **Pre-conditions**: Nhập "20"
- **Steps**: 1. Type "20"
- **Expected**: isValid = false, save button disabled
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_DWI_203: Input paste value from clipboard
- **Pre-conditions**: Clipboard = "72.5"
- **Steps**: 1. Paste "72.5" vào input
- **Expected**: inputValue = 72.5
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_204: Input with leading zeros: "072" → 72
- **Pre-conditions**: Type "072"
- **Steps**: 1. Nhập "072"
- **Expected**: inputValue = 72 (parseInt/parseFloat handles)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_DWI_205: Input with multiple decimal points: "72.5.3"
- **Pre-conditions**: Type "72.5.3"
- **Steps**: 1. Nhập "72.5.3"
- **Expected**: type="number" rejects, inputValue stays previous
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_DWI_206: Dark mode: container bg-slate-800 khi unsaved
- **Pre-conditions**: Dark mode, isSaved = false
- **Steps**: 1. Inspect container
- **Expected**: dark:bg-slate-800 dark:border-slate-600
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_207: Dark mode: container bg-emerald-950/30 khi saved
- **Pre-conditions**: Dark mode, isSaved = true
- **Steps**: 1. Inspect container
- **Expected**: dark:bg-emerald-950/30 dark:border-emerald-600
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_208: Dark mode: input field dark:bg-slate-700
- **Pre-conditions**: Dark mode
- **Steps**: 1. Inspect input
- **Expected**: dark:bg-slate-700 dark:border-slate-600
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DWI_209: Accessibility: all interactive elements có aria-label
- **Pre-conditions**: Có component
- **Steps**: 1. Inspect input, buttons, chips
- **Expected**: aria-label present trên input, +, -, save, và chips
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DWI_210: Screen reader: input label đọc "Cân nặng hôm nay"
- **Pre-conditions**: Screen reader enabled
- **Steps**: 1. Focus input
- **Expected**: aria-label = t("fitness.weight.todayWeight")
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2
