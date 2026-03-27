# Scenario 19: Quick Preview Panel

**Version:** 2.0  
**Date:** 2026-03-15  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Quick Preview Panel hiển thị tóm tắt nhanh kế hoạch bữa ăn cho ngày được chọn trên Calendar. Component QuickPreviewPanel nhận props: currentPlan (DayPlan), dishes (Dish[]), ingredients (Ingredient[]), onPlanMeal, onPlanAll. Hiển thị 3 meal slots (Sáng 🌅, Trưa 🌤️, Tối 🌙) với tối đa 2 dishes visible mỗi slot. Nutrition progress bars so sánh với target (667 kcal/slot, 20g protein/slot). Trên desktop hiển thị inline bên phải, mobile dạng bottom sheet. Hỗ trợ empty state, add/edit actions, real-time updates.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| QuickPreviewPanel | components/QuickPreviewPanel.tsx | Panel UI chính: meal slots, nutrition bars, actions |
| CalendarTab | pages/CalendarTab.tsx | Container component, truyền props cho panel |
| useIsDesktop | hooks/useIsDesktop.ts | Xác định layout inline (desktop) vs bottom sheet (mobile) |
| useDarkMode | hooks/useDarkMode.ts | Dark mode styling cho panel |

## Luồng nghiệp vụ

1. User tap/click ngày trên Calendar
2. QuickPreviewPanel nhận currentPlan cho ngày đó
3. Panel hiển thị 3 meal slots: Sáng, Trưa, Tối
4. Mỗi slot hiển thị tối đa 2 dishes (truncate nếu > 2)
5. Nutrition progress bars tính toán từ dishes ingredients
6. Empty slots hiển thị nút thêm bữa ăn
7. User click add → onPlanMeal(mealType) → mở meal planner modal
8. User click "Plan All" → onPlanAll() → mở meal planner cho tất cả

## Quy tắc nghiệp vụ

1. Max 2 dishes visible per slot, surplus hiển thị "...và N món khác"
2. Calories target per slot: 667 kcal (2000/3 meals)
3. Protein target per slot: 20g
4. Progress bar colors: green (<100%), yellow (100-120%), red (>120%)
5. Desktop (≥1024px): inline panel bên phải calendar
6. Mobile (<1024px): bottom sheet slide up
7. Empty state: CTA "Lên kế hoạch bữa ăn" khi tất cả slots trống
8. Real-time update: panel reflect changes ngay khi data thay đổi
9. Test IDs: quick-preview-panel, quick-preview-row-breakfast, quick-preview-row-lunch, quick-preview-row-dinner

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority |
|---|---|---|---|
| TC_QP_001 | Tap ngày trên calendar → preview panel hiển thị | Positive | P0 |
| TC_QP_002 | Preview hiển thị đúng ngày được chọn | Positive | P1 |
| TC_QP_003 | Panel collapse khi tap lại ngày đang chọn | Positive | P1 |
| TC_QP_004 | Panel expand từ trạng thái collapsed | Positive | P1 |
| TC_QP_005 | Animation panel mở mượt mà | Positive | P2 |
| TC_QP_006 | Animation panel đóng mượt mà | Positive | P2 |
| TC_QP_007 | Desktop: panel inline bên phải calendar | Positive | P1 |
| TC_QP_008 | Mobile: panel dạng bottom sheet | Positive | P1 |
| TC_QP_009 | Mobile: swipe down đóng panel | Positive | P2 |
| TC_QP_010 | Click outside panel đóng panel | Positive | P2 |
| TC_QP_011 | ESC key đóng panel (desktop) | Positive | P2 |
| TC_QP_012 | Panel z-index đúng (trên calendar, dưới modal) | Positive | P2 |
| TC_QP_013 | Panel auto-open khi chọn ngày từ calendar | Positive | P2 |
| TC_QP_014 | Panel toggle button (nếu có) | Positive | P2 |
| TC_QP_015 | Panel overlay dim background (mobile) | Positive | P3 |
| TC_QP_016 | Test ID quick-preview-panel tồn tại | Positive | P1 |
| TC_QP_017 | Panel height auto-adjust theo content | Positive | P2 |
| TC_QP_018 | Panel snap points (half/full) mobile | Positive | P3 |
| TC_QP_019 | Panel mở → modal mở → panel phía sau | Positive | P2 |
| TC_QP_020 | Modal đóng → panel visible lại | Positive | P2 |
| TC_QP_021 | Panel drag handle visible (mobile) | Positive | P2 |
| TC_QP_022 | Rapid date tapping → panel stable | Edge | P2 |
| TC_QP_023 | Panel trong landscape orientation | Positive | P2 |
| TC_QP_024 | Panel khi calendar đang ở month view | Positive | P2 |
| TC_QP_025 | Panel state reset khi chuyển tab | Positive | P2 |
| TC_QP_026 | Hiển thị calories bữa sáng | Positive | P1 |
| TC_QP_027 | Hiển thị calories bữa trưa | Positive | P1 |
| TC_QP_028 | Hiển thị calories bữa tối | Positive | P1 |
| TC_QP_029 | Hiển thị tổng calories cả ngày | Positive | P0 |
| TC_QP_030 | Calories progress bar bữa sáng | Positive | P1 |
| TC_QP_031 | Calories progress bar bữa trưa | Positive | P1 |
| TC_QP_032 | Calories progress bar bữa tối | Positive | P1 |
| TC_QP_033 | Progress bar xanh khi < 100% target | Positive | P1 |
| TC_QP_034 | Progress bar vàng khi 100-120% target | Positive | P2 |
| TC_QP_035 | Progress bar đỏ khi > 120% target | Positive | P2 |
| TC_QP_036 | Calories = 0 hiển thị đúng | Edge | P2 |
| TC_QP_037 | Calories rất cao (3000+) hiển thị đúng | Edge | P2 |
| TC_QP_038 | Calories chính xác so với chi tiết món ăn | Positive | P0 |
| TC_QP_039 | Calories cập nhật khi thêm dish | Positive | P1 |
| TC_QP_040 | Calories cập nhật khi xóa dish | Positive | P1 |
| TC_QP_041 | Calories format: số nguyên + 'kcal' | Positive | P2 |
| TC_QP_042 | Calories per-slot target = 667 kcal | Positive | P1 |
| TC_QP_043 | Tổng calories ngày so với target 2000 kcal | Positive | P1 |
| TC_QP_044 | Calories với dish có ingredient nutrition = null | Edge | P2 |
| TC_QP_045 | Calories display trong dark mode | Positive | P2 |
| TC_QP_046 | Calories display responsive mobile | Positive | P2 |
| TC_QP_047 | Calories display responsive desktop | Positive | P2 |
| TC_QP_048 | Progress bar width responsive | Positive | P2 |
| TC_QP_049 | Calories khi dish bị sửa amount | Positive | P1 |
| TC_QP_050 | Multiple progress bars alignment | Positive | P2 |
| TC_QP_051 | Protein bữa sáng hiển thị | Positive | P1 |
| TC_QP_052 | Protein bữa trưa hiển thị | Positive | P1 |
| TC_QP_053 | Protein bữa tối hiển thị | Positive | P1 |
| TC_QP_054 | Protein tổng ngày | Positive | P1 |
| TC_QP_055 | Protein progress bar vs target 20g/slot | Positive | P1 |
| TC_QP_056 | Carbs bữa sáng hiển thị | Positive | P2 |
| TC_QP_057 | Carbs bữa trưa hiển thị | Positive | P2 |
| TC_QP_058 | Carbs bữa tối hiển thị | Positive | P2 |
| TC_QP_059 | Carbs tổng ngày | Positive | P2 |
| TC_QP_060 | Fat bữa sáng hiển thị | Positive | P2 |
| TC_QP_061 | Fat bữa trưa hiển thị | Positive | P2 |
| TC_QP_062 | Fat bữa tối hiển thị | Positive | P2 |
| TC_QP_063 | Fat tổng ngày | Positive | P2 |
| TC_QP_064 | Fiber hiển thị (nếu có) | Positive | P2 |
| TC_QP_065 | Mini nutrition bars cho mỗi macro | Positive | P2 |
| TC_QP_066 | Tất cả macros = 0 khi không có dishes | Edge | P2 |
| TC_QP_067 | Tất cả macros rất cao | Edge | P2 |
| TC_QP_068 | Macro accuracy: protein tổng đúng | Positive | P0 |
| TC_QP_069 | Macro format: số + 'g' | Positive | P2 |
| TC_QP_070 | Macro decimal handling | Positive | P2 |
| TC_QP_071 | Nutrition labels tiếng Việt | Positive | P2 |
| TC_QP_072 | Nutrition comparison to daily targets | Positive | P1 |
| TC_QP_073 | Nutrition target exceeded warning | Positive | P2 |
| TC_QP_074 | Protein target comparison | Positive | P2 |
| TC_QP_075 | Macros cập nhật real-time khi sửa dish | Positive | P1 |
| TC_QP_076 | Nutrition dark mode: bars visible | Positive | P2 |
| TC_QP_077 | Nutrition responsive mobile | Positive | P2 |
| TC_QP_078 | Nutrition responsive desktop | Positive | P2 |
| TC_QP_079 | Nutrition với dish có partial data | Edge | P2 |
| TC_QP_080 | Nutrition tổng ngày consistent với per-meal | Positive | P0 |
| TC_QP_081 | Breakfast slot hiển thị emoji 🌅 | Positive | P1 |
| TC_QP_082 | Lunch slot hiển thị emoji 🌤️ | Positive | P1 |
| TC_QP_083 | Dinner slot hiển thị emoji 🌙 | Positive | P1 |
| TC_QP_084 | Test ID quick-preview-row-breakfast | Positive | P1 |
| TC_QP_085 | Test ID quick-preview-row-lunch | Positive | P1 |
| TC_QP_086 | Test ID quick-preview-row-dinner | Positive | P1 |
| TC_QP_087 | 0 dishes trong slot → empty state | Positive | P1 |
| TC_QP_088 | 1 dish trong slot hiển thị tên | Positive | P1 |
| TC_QP_089 | 2 dishes trong slot hiển thị cả 2 tên | Positive | P1 |
| TC_QP_090 | 3+ dishes trong slot → truncated | Positive | P1 |
| TC_QP_091 | Tên dish dài bị truncate | Positive | P2 |
| TC_QP_092 | Tên dish tiếng Việt hiển thị đúng | Positive | P1 |
| TC_QP_093 | Dish calories hiển thị bên cạnh tên | Positive | P2 |
| TC_QP_094 | Quick add button cho slot trống | Positive | P1 |
| TC_QP_095 | Quick add button cho bữa sáng | Positive | P2 |
| TC_QP_096 | Quick add button cho bữa trưa | Positive | P2 |
| TC_QP_097 | Quick add button cho bữa tối | Positive | P2 |
| TC_QP_098 | 'Plan All' button khi tất cả slots trống | Positive | P1 |
| TC_QP_099 | 'Plan All' click → onPlanAll callback | Positive | P1 |
| TC_QP_100 | 'Plan All' ẩn khi tất cả slots đã có dishes | Positive | P2 |
| TC_QP_101 | Edit button cho dish trong slot | Positive | P2 |
| TC_QP_102 | 5 dishes trong 1 slot | Boundary | P2 |
| TC_QP_103 | 10 dishes trong 1 slot | Boundary | P2 |
| TC_QP_104 | Slot row click → onPlanMeal callback | Positive | P2 |
| TC_QP_105 | Meal slot labels tiếng Việt | Positive | P2 |
| TC_QP_106 | Slot với dish đã bị xóa | Edge | P2 |
| TC_QP_107 | Slot order: Sáng → Trưa → Tối (top→bottom) | Positive | P1 |
| TC_QP_108 | Slot dividers/separators | Positive | P2 |
| TC_QP_109 | Dish name với emoji | Edge | P2 |
| TC_QP_110 | All slots full → nutrition summary nổi bật | Positive | P2 |
| TC_QP_111 | Tất cả slots trống → CTA 'Lên kế hoạch bữa ăn' | Positive | P1 |
| TC_QP_112 | Chỉ bữa sáng có dishes | Positive | P2 |
| TC_QP_113 | Chỉ bữa trưa có dishes | Positive | P2 |
| TC_QP_114 | Chỉ bữa tối có dishes | Positive | P2 |
| TC_QP_115 | 2 bữa có dishes, 1 trống | Positive | P2 |
| TC_QP_116 | Tất cả 3 bữa đầy đủ | Positive | P1 |
| TC_QP_117 | Empty state sau clear plan | Positive | P1 |
| TC_QP_118 | Empty state cho ngày trong tương lai xa | Positive | P2 |
| TC_QP_119 | Empty state cho ngày quá khứ | Positive | P2 |
| TC_QP_120 | CTA button click → meal planner modal | Positive | P1 |
| TC_QP_121 | Empty state dark mode | Positive | P2 |
| TC_QP_122 | Empty state i18n tiếng Việt | Positive | P2 |
| TC_QP_123 | Empty state responsive mobile | Positive | P2 |
| TC_QP_124 | Empty state responsive desktop | Positive | P2 |
| TC_QP_125 | Partial empty: add button cho slot trống chỉ hiện ở slot trống | Positive | P2 |
| TC_QP_126 | Empty slot placeholder text | Positive | P2 |
| TC_QP_127 | All empty → illustration/icon hiển thị | Positive | P3 |
| TC_QP_128 | Empty state không hiển thị nutrition bars | Positive | P2 |
| TC_QP_129 | Transition: từ empty → có data | Positive | P2 |
| TC_QP_130 | Transition: từ có data → empty | Positive | P2 |
| TC_QP_131 | Empty state accessibility | Positive | P3 |
| TC_QP_132 | Empty panel loading state | Positive | P2 |
| TC_QP_133 | Error state khi data load fail | Positive | P2 |
| TC_QP_134 | Empty state cho ngày chưa có plan object | Edge | P2 |
| TC_QP_135 | Multiple empty slots: count empty | Positive | P2 |
| TC_QP_136 | Thêm dish → panel cập nhật ngay | Positive | P0 |
| TC_QP_137 | Sửa dish → panel cập nhật | Positive | P0 |
| TC_QP_138 | Xóa dish → panel cập nhật | Positive | P0 |
| TC_QP_139 | Copy plan → preview hiển thị data copied | Positive | P1 |
| TC_QP_140 | Clear plan → preview empty | Positive | P1 |
| TC_QP_141 | Apply template → preview hiển thị | Positive | P1 |
| TC_QP_142 | AI thêm dish → preview cập nhật | Positive | P2 |
| TC_QP_143 | Sửa ingredient amount → nutrition recalculate | Positive | P1 |
| TC_QP_144 | Rapid changes → panel stable | Edge | P2 |
| TC_QP_145 | Thêm nhiều dishes cùng lúc | Positive | P2 |
| TC_QP_146 | Thay đổi ở tab khác → panel refresh khi quay lại | Positive | P2 |
| TC_QP_147 | Drag dish giữa meals (nếu có) | Positive | P3 |
| TC_QP_148 | Undo action → panel revert | Positive | P2 |
| TC_QP_149 | Batch update → panel update 1 lần | Positive | P2 |
| TC_QP_150 | Panel data sync với Calendar view | Positive | P1 |
| TC_QP_151 | Real-time update không gây re-render toàn panel | Boundary | P2 |
| TC_QP_152 | Update khi panel đang animation | Edge | P2 |
| TC_QP_153 | Delete last dish → slot chuyển empty | Positive | P1 |
| TC_QP_154 | Update từ Google Drive sync | Positive | P2 |
| TC_QP_155 | Update không mất scroll position | Positive | P2 |
| TC_QP_156 | Meal type icon không thay đổi sau update | Positive | P2 |
| TC_QP_157 | Update visual feedback | Positive | P3 |
| TC_QP_158 | Concurrent updates (2 browser tabs) | Edge | P2 |
| TC_QP_159 | Panel update performance < 50ms | Boundary | P2 |
| TC_QP_160 | Memory stable sau 100 updates | Boundary | P2 |
| TC_QP_161 | Panel cho ngày hôm nay | Positive | P0 |
| TC_QP_162 | Panel cho ngày hôm qua | Positive | P2 |
| TC_QP_163 | Panel cho ngày mai | Positive | P2 |
| TC_QP_164 | Panel cho ngày tuần trước | Positive | P2 |
| TC_QP_165 | Panel cho ngày tuần sau | Positive | P2 |
| TC_QP_166 | Tap ngày khác → panel cập nhật | Positive | P0 |
| TC_QP_167 | Rapid date tapping 5 ngày → panel stable | Edge | P2 |
| TC_QP_168 | Panel state preserved khi navigate tuần | Positive | P2 |
| TC_QP_169 | Panel với ngày không có dayPlan object | Edge | P2 |
| TC_QP_170 | Calendar navigate tháng → panel reset | Positive | P2 |
| TC_QP_171 | Panel date header format đúng | Positive | P2 |
| TC_QP_172 | Panel cho ngày đầu tháng | Positive | P2 |
| TC_QP_173 | Panel cho ngày cuối tháng | Positive | P2 |
| TC_QP_174 | Panel cho ngày 29/02 (năm nhuận) | Edge | P3 |
| TC_QP_175 | Panel mở → navigate date → panel đóng rồi mở lại | Positive | P2 |
| TC_QP_176 | Date change không gây memory leak | Boundary | P2 |
| TC_QP_177 | Panel cho selected date sync với Calendar highlight | Positive | P1 |
| TC_QP_178 | Calendar date selection → panel auto-scroll to top | Positive | P2 |
| TC_QP_179 | Panel cho cùng ngày khi user chọn lại | Positive | P2 |
| TC_QP_180 | Navigation arrows + panel interaction | Positive | P2 |
| TC_QP_181 | Dark mode: panel background | Positive | P2 |
| TC_QP_182 | Dark mode: text colors | Positive | P2 |
| TC_QP_183 | Dark mode: progress bars visible | Positive | P2 |
| TC_QP_184 | Dark mode: emoji visibility | Positive | P2 |
| TC_QP_185 | Dark mode: border colors | Positive | P2 |
| TC_QP_186 | Dark mode: empty state | Positive | P2 |
| TC_QP_187 | Dark mode: add button | Positive | P2 |
| TC_QP_188 | Mobile layout: panel full-width | Positive | P1 |
| TC_QP_189 | Desktop layout: panel fixed width | Positive | P1 |
| TC_QP_190 | Tablet layout: panel adapt | Positive | P2 |
| TC_QP_191 | Panel width responsive: không quá rộng | Positive | P2 |
| TC_QP_192 | Panel height auto-adjust: ít content | Positive | P2 |
| TC_QP_193 | Panel height auto-adjust: nhiều content | Positive | P2 |
| TC_QP_194 | Font sizes responsive trong panel | Positive | P2 |
| TC_QP_195 | Panel spacing responsive | Positive | P2 |
| TC_QP_196 | Panel scroll behavior mobile | Positive | P2 |
| TC_QP_197 | Panel scroll behavior desktop | Positive | P2 |
| TC_QP_198 | Panel transition dark↔light | Positive | P2 |
| TC_QP_199 | Panel trong landscape mobile | Positive | P2 |
| TC_QP_200 | Panel print layout (nếu có) | Positive | P3 |
| TC_QP_201 | Screen reader đọc panel content | Positive | P3 |
| TC_QP_202 | Keyboard navigation trong panel | Positive | P3 |
| TC_QP_203 | Focus management: panel mở → focus vào panel | Positive | P2 |
| TC_QP_204 | Focus management: panel đóng → focus về calendar | Positive | P2 |
| TC_QP_205 | ARIA labels cho panel | Positive | P3 |
| TC_QP_206 | ARIA live region cho nutrition updates | Positive | P3 |
| TC_QP_207 | Performance: panel render < 50ms | Boundary | P2 |
| TC_QP_208 | Memory: open/close 100 lần không leak | Boundary | P2 |
| TC_QP_209 | Panel khi sync đang chạy | Edge | P2 |
| TC_QP_210 | Panel với very long content scroll | Edge | P2 |

---

## Chi tiết Test Cases

### Nhóm 1: Panel Toggle & Visibility (Hiển thị & Ẩn panel) (TC_QP_001 – TC_QP_025)

### TC_QP_001: Tap ngày trên calendar → preview panel hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_001 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Tab Lịch đang mở, có ít nhất 1 ngày có dữ liệu |
| **Các bước thực hiện** | 1. Tap/click vào 1 ngày trên calendar |
| **Kết quả mong đợi** | Quick Preview Panel hiển thị với dữ liệu của ngày được chọn |
| **Kết quả test thực tế** | — |

### TC_QP_002: Preview hiển thị đúng ngày được chọn

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_002 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Calendar hiển thị, chọn ngày 15/03 |
| **Các bước thực hiện** | 1. Tap ngày 15/03<br>2. Kiểm tra header panel |
| **Kết quả mong đợi** | Panel hiển thị 'Thứ Bảy, 15/03/2026' hoặc tương tự |
| **Kết quả test thực tế** | — |

### TC_QP_003: Panel collapse khi tap lại ngày đang chọn

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_003 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Panel đang mở cho ngày 15/03 |
| **Các bước thực hiện** | 1. Tap lại ngày 15/03 |
| **Kết quả mong đợi** | Panel collapse/đóng lại |
| **Kết quả test thực tế** | — |

### TC_QP_004: Panel expand từ trạng thái collapsed

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_004 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Panel đang collapsed |
| **Các bước thực hiện** | 1. Tap ngày bất kỳ |
| **Kết quả mong đợi** | Panel expand hiển thị nội dung |
| **Kết quả test thực tế** | — |

### TC_QP_005: Animation panel mở mượt mà

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_005 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel đang đóng |
| **Các bước thực hiện** | 1. Tap ngày |
| **Kết quả mong đợi** | Animation slide up (mobile) hoặc fade in (desktop) smooth ~200ms |
| **Kết quả test thực tế** | — |

### TC_QP_006: Animation panel đóng mượt mà

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_006 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel đang mở |
| **Các bước thực hiện** | 1. Đóng panel |
| **Kết quả mong đợi** | Animation slide down/fade out smooth |
| **Kết quả test thực tế** | — |

### TC_QP_007: Desktop: panel inline bên phải calendar

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_007 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Tap ngày<br>2. Kiểm tra vị trí panel |
| **Kết quả mong đợi** | Panel hiển thị inline bên phải, không overlay |
| **Kết quả test thực tế** | — |

### TC_QP_008: Mobile: panel dạng bottom sheet

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_008 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Tap ngày |
| **Kết quả mong đợi** | Panel slide up từ dưới dạng bottom sheet |
| **Kết quả test thực tế** | — |

### TC_QP_009: Mobile: swipe down đóng panel

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_009 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px, panel mở |
| **Các bước thực hiện** | 1. Swipe xuống trên panel header |
| **Kết quả mong đợi** | Panel slide down và đóng |
| **Kết quả test thực tế** | — |

### TC_QP_010: Click outside panel đóng panel

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_010 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel đang mở |
| **Các bước thực hiện** | 1. Click/tap vào vùng ngoài panel |
| **Kết quả mong đợi** | Panel đóng lại |
| **Kết quả test thực tế** | — |

### TC_QP_011: ESC key đóng panel (desktop)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_011 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px, panel mở |
| **Các bước thực hiện** | 1. Nhấn ESC |
| **Kết quả mong đợi** | Panel đóng lại |
| **Kết quả test thực tế** | — |

### TC_QP_012: Panel z-index đúng (trên calendar, dưới modal)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_012 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel mở |
| **Các bước thực hiện** | 1. Kiểm tra z-index |
| **Kết quả mong đợi** | Panel hiển thị trên calendar nhưng dưới modal |
| **Kết quả test thực tế** | — |

### TC_QP_013: Panel auto-open khi chọn ngày từ calendar

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_013 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel đang đóng |
| **Các bước thực hiện** | 1. Click/tap ngày mới |
| **Kết quả mong đợi** | Panel tự động mở cho ngày được chọn |
| **Kết quả test thực tế** | — |

### TC_QP_014: Panel toggle button (nếu có)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_014 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Desktop layout |
| **Các bước thực hiện** | 1. Click nút toggle panel |
| **Kết quả mong đợi** | Panel show/hide theo toggle |
| **Kết quả test thực tế** | — |

### TC_QP_015: Panel overlay dim background (mobile)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_015 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Viewport 375px, panel mở |
| **Các bước thực hiện** | 1. Kiểm tra background |
| **Kết quả mong đợi** | Background bị dim nhẹ khi panel mở |
| **Kết quả test thực tế** | — |

### TC_QP_016: Test ID quick-preview-panel tồn tại

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_016 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Panel mở |
| **Các bước thực hiện** | 1. Kiểm tra DOM |
| **Kết quả mong đợi** | Element có data-testid='quick-preview-panel' |
| **Kết quả test thực tế** | — |

### TC_QP_017: Panel height auto-adjust theo content

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_017 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel mở |
| **Các bước thực hiện** | 1. Kiểm tra height với ít/nhiều content |
| **Kết quả mong đợi** | Panel height adjust theo nội dung, max-height constraint |
| **Kết quả test thực tế** | — |

### TC_QP_018: Panel snap points (half/full) mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_018 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Viewport 375px, panel mở |
| **Các bước thực hiện** | 1. Kéo panel lên/xuống |
| **Kết quả mong đợi** | Panel snap ở 50% hoặc 100% height |
| **Kết quả test thực tế** | — |

### TC_QP_019: Panel mở → modal mở → panel phía sau

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_019 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel mở |
| **Các bước thực hiện** | 1. Click nút thêm bữa ăn trong panel |
| **Kết quả mong đợi** | Modal mở trên panel, panel vẫn visible phía sau |
| **Kết quả test thực tế** | — |

### TC_QP_020: Modal đóng → panel visible lại

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_020 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Modal đang mở trên panel |
| **Các bước thực hiện** | 1. Đóng modal |
| **Kết quả mong đợi** | Panel hiển thị lại với nội dung đúng |
| **Kết quả test thực tế** | — |

### TC_QP_021: Panel drag handle visible (mobile)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_021 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px, panel mở |
| **Các bước thực hiện** | 1. Kiểm tra top panel |
| **Kết quả mong đợi** | Drag handle bar hiển thị ở top panel |
| **Kết quả test thực tế** | — |

### TC_QP_022: Rapid date tapping → panel stable

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_022 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Calendar hiển thị |
| **Các bước thực hiện** | 1. Tap nhanh 5 ngày khác nhau liên tiếp |
| **Kết quả mong đợi** | Panel cập nhật đúng ngày cuối cùng, không crash |
| **Kết quả test thực tế** | — |

### TC_QP_023: Panel trong landscape orientation

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_023 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Mobile landscape |
| **Các bước thực hiện** | 1. Xoay phone ngang<br>2. Kiểm tra panel |
| **Kết quả mong đợi** | Panel adjust layout phù hợp landscape |
| **Kết quả test thực tế** | — |

### TC_QP_024: Panel khi calendar đang ở month view

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_024 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Month view calendar |
| **Các bước thực hiện** | 1. Tap ngày trong month view |
| **Kết quả mong đợi** | Panel mở với data đúng |
| **Kết quả test thực tế** | — |

### TC_QP_025: Panel state reset khi chuyển tab

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_025 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel mở ở tab Lịch |
| **Các bước thực hiện** | 1. Chuyển sang tab Quản lý<br>2. Quay lại tab Lịch |
| **Kết quả mong đợi** | Panel state reset hoặc giữ nguyên theo design |
| **Kết quả test thực tế** | — |

### Nhóm 2: Nutrition Display - Calories (Hiển thị Calo) (TC_QP_026 – TC_QP_050)

### TC_QP_026: Hiển thị calories bữa sáng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_026 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Ngày có bữa sáng với 2 dishes |
| **Các bước thực hiện** | 1. Mở panel cho ngày đó<br>2. Kiểm tra row bữa sáng |
| **Kết quả mong đợi** | Calories bữa sáng hiển thị đúng (tổng từ các dishes) |
| **Kết quả test thực tế** | — |

### TC_QP_027: Hiển thị calories bữa trưa

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_027 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Ngày có bữa trưa |
| **Các bước thực hiện** | 1. Kiểm tra row bữa trưa |
| **Kết quả mong đợi** | Calories bữa trưa hiển thị đúng |
| **Kết quả test thực tế** | — |

### TC_QP_028: Hiển thị calories bữa tối

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_028 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Ngày có bữa tối |
| **Các bước thực hiện** | 1. Kiểm tra row bữa tối |
| **Kết quả mong đợi** | Calories bữa tối hiển thị đúng |
| **Kết quả test thực tế** | — |

### TC_QP_029: Hiển thị tổng calories cả ngày

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_029 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Ngày có đủ 3 bữa |
| **Các bước thực hiện** | 1. Kiểm tra tổng calories |
| **Kết quả mong đợi** | Tổng calories = sáng + trưa + tối |
| **Kết quả test thực tế** | — |

### TC_QP_030: Calories progress bar bữa sáng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_030 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Bữa sáng có dishes |
| **Các bước thực hiện** | 1. Kiểm tra progress bar |
| **Kết quả mong đợi** | Progress bar hiển thị % so với target 667 kcal |
| **Kết quả test thực tế** | — |

### TC_QP_031: Calories progress bar bữa trưa

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_031 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Bữa trưa có dishes |
| **Các bước thực hiện** | 1. Kiểm tra progress bar |
| **Kết quả mong đợi** | Progress bar hiển thị % so với target |
| **Kết quả test thực tế** | — |

### TC_QP_032: Calories progress bar bữa tối

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_032 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Bữa tối có dishes |
| **Các bước thực hiện** | 1. Kiểm tra progress bar |
| **Kết quả mong đợi** | Progress bar hiển thị % so với target |
| **Kết quả test thực tế** | — |

### TC_QP_033: Progress bar xanh khi < 100% target

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_033 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Bữa ăn calories = 400 kcal (< 667) |
| **Các bước thực hiện** | 1. Kiểm tra màu progress bar |
| **Kết quả mong đợi** | Bar màu xanh lá (green) |
| **Kết quả test thực tế** | — |

### TC_QP_034: Progress bar vàng khi 100-120% target

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_034 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Bữa ăn calories = 700 kcal (105% of 667) |
| **Các bước thực hiện** | 1. Kiểm tra màu bar |
| **Kết quả mong đợi** | Bar màu vàng (yellow/amber) |
| **Kết quả test thực tế** | — |

### TC_QP_035: Progress bar đỏ khi > 120% target

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_035 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Bữa ăn calories = 900 kcal (135% of 667) |
| **Các bước thực hiện** | 1. Kiểm tra màu bar |
| **Kết quả mong đợi** | Bar màu đỏ (red) |
| **Kết quả test thực tế** | — |

### TC_QP_036: Calories = 0 hiển thị đúng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_036 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Bữa ăn không có dishes hoặc dishes calories=0 |
| **Các bước thực hiện** | 1. Kiểm tra calories display |
| **Kết quả mong đợi** | Hiển thị '0 kcal', progress bar rỗng |
| **Kết quả test thực tế** | — |

### TC_QP_037: Calories rất cao (3000+) hiển thị đúng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_037 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Bữa ăn có nhiều dishes calories cao |
| **Các bước thực hiện** | 1. Kiểm tra display |
| **Kết quả mong đợi** | Số hiển thị đúng, bar có thể vượt 100% |
| **Kết quả test thực tế** | — |

### TC_QP_038: Calories chính xác so với chi tiết món ăn

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_038 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Bữa sáng: Phở bò (500kcal) + Bánh mì (300kcal) |
| **Các bước thực hiện** | 1. Kiểm tra calories bữa sáng trong panel<br>2. So sánh với detail view |
| **Kết quả mong đợi** | Panel hiển thị 800 kcal = 500 + 300 |
| **Kết quả test thực tế** | — |

### TC_QP_039: Calories cập nhật khi thêm dish

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_039 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Panel mở, bữa sáng 500kcal |
| **Các bước thực hiện** | 1. Thêm dish mới 200kcal vào bữa sáng |
| **Kết quả mong đợi** | Calories cập nhật thành 700kcal ngay lập tức |
| **Kết quả test thực tế** | — |

### TC_QP_040: Calories cập nhật khi xóa dish

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_040 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Panel mở, bữa sáng 700kcal (2 dishes) |
| **Các bước thực hiện** | 1. Xóa 1 dish 200kcal |
| **Kết quả mong đợi** | Calories giảm còn 500kcal |
| **Kết quả test thực tế** | — |

### TC_QP_041: Calories format: số nguyên + 'kcal'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_041 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format |
| **Kết quả mong đợi** | Format: '500 kcal' (không phải 500.00 hay 500kcal) |
| **Kết quả test thực tế** | — |

### TC_QP_042: Calories per-slot target = 667 kcal

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_042 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Panel hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra progress bar calculation |
| **Kết quả mong đợi** | Progress bar tính % dựa trên 667 kcal per slot |
| **Kết quả test thực tế** | — |

### TC_QP_043: Tổng calories ngày so với target 2000 kcal

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_043 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Ngày đầy đủ 3 bữa |
| **Các bước thực hiện** | 1. Kiểm tra tổng ngày |
| **Kết quả mong đợi** | Tổng hiển thị so với daily target (ví dụ 1800/2000 kcal) |
| **Kết quả test thực tế** | — |

### TC_QP_044: Calories với dish có ingredient nutrition = null

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_044 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dish có ingredient thiếu calories data |
| **Các bước thực hiện** | 1. Kiểm tra panel |
| **Kết quả mong đợi** | Calories tính đúng (bỏ qua null, không crash) |
| **Kết quả test thực tế** | — |

### TC_QP_045: Calories display trong dark mode

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_045 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra calories text và progress bar |
| **Kết quả mong đợi** | Số và bar hiển thị rõ ràng trên nền tối |
| **Kết quả test thực tế** | — |

### TC_QP_046: Calories display responsive mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_046 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Kiểm tra calories layout |
| **Kết quả mong đợi** | Calories hiển thị đúng, không bị cắt |
| **Kết quả test thực tế** | — |

### TC_QP_047: Calories display responsive desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_047 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Kiểm tra calories layout |
| **Kết quả mong đợi** | Calories hiển thị với nhiều detail hơn |
| **Kết quả test thực tế** | — |

### TC_QP_048: Progress bar width responsive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_048 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport thay đổi |
| **Các bước thực hiện** | 1. Kiểm tra bar width ở 375 và 1440 |
| **Kết quả mong đợi** | Bar width adjust theo container |
| **Kết quả test thực tế** | — |

### TC_QP_049: Calories khi dish bị sửa amount

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_049 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dish trong bữa sáng bị sửa số lượng |
| **Các bước thực hiện** | 1. Sửa amount từ 1 → 2 portions<br>2. Kiểm tra panel |
| **Kết quả mong đợi** | Calories double (cập nhật tức thì) |
| **Kết quả test thực tế** | — |

### TC_QP_050: Multiple progress bars alignment

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_050 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 3 bữa đều có data |
| **Các bước thực hiện** | 1. Kiểm tra alignment |
| **Kết quả mong đợi** | 3 progress bars aligned đều, cùng width |
| **Kết quả test thực tế** | — |

### Nhóm 3: Nutrition Display - Macros (Hiển thị chất dinh dưỡng) (TC_QP_051 – TC_QP_080)

### TC_QP_051: Protein bữa sáng hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_051 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Bữa sáng có dishes |
| **Các bước thực hiện** | 1. Kiểm tra protein display |
| **Kết quả mong đợi** | Protein bữa sáng hiển thị đúng (g) |
| **Kết quả test thực tế** | — |

### TC_QP_052: Protein bữa trưa hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_052 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Bữa trưa có dishes |
| **Các bước thực hiện** | 1. Kiểm tra protein |
| **Kết quả mong đợi** | Protein bữa trưa đúng |
| **Kết quả test thực tế** | — |

### TC_QP_053: Protein bữa tối hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_053 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Bữa tối có dishes |
| **Các bước thực hiện** | 1. Kiểm tra protein |
| **Kết quả mong đợi** | Protein bữa tối đúng |
| **Kết quả test thực tế** | — |

### TC_QP_054: Protein tổng ngày

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_054 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | 3 bữa có data |
| **Các bước thực hiện** | 1. Kiểm tra tổng protein |
| **Kết quả mong đợi** | Tổng protein = sáng + trưa + tối |
| **Kết quả test thực tế** | — |

### TC_QP_055: Protein progress bar vs target 20g/slot

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_055 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Bữa sáng 15g protein |
| **Các bước thực hiện** | 1. Kiểm tra progress bar |
| **Kết quả mong đợi** | Bar hiển thị 75% (15/20) |
| **Kết quả test thực tế** | — |

### TC_QP_056: Carbs bữa sáng hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_056 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Bữa sáng có data |
| **Các bước thực hiện** | 1. Kiểm tra carbs |
| **Kết quả mong đợi** | Carbs bữa sáng đúng |
| **Kết quả test thực tế** | — |

### TC_QP_057: Carbs bữa trưa hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_057 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Bữa trưa có data |
| **Các bước thực hiện** | 1. Kiểm tra carbs |
| **Kết quả mong đợi** | Carbs bữa trưa đúng |
| **Kết quả test thực tế** | — |

### TC_QP_058: Carbs bữa tối hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_058 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Bữa tối có data |
| **Các bước thực hiện** | 1. Kiểm tra carbs |
| **Kết quả mong đợi** | Carbs bữa tối đúng |
| **Kết quả test thực tế** | — |

### TC_QP_059: Carbs tổng ngày

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_059 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 3 bữa có data |
| **Các bước thực hiện** | 1. Kiểm tra tổng carbs |
| **Kết quả mong đợi** | Tổng carbs đúng |
| **Kết quả test thực tế** | — |

### TC_QP_060: Fat bữa sáng hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_060 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Bữa sáng có data |
| **Các bước thực hiện** | 1. Kiểm tra fat |
| **Kết quả mong đợi** | Fat bữa sáng đúng |
| **Kết quả test thực tế** | — |

### TC_QP_061: Fat bữa trưa hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_061 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Bữa trưa có data |
| **Các bước thực hiện** | 1. Kiểm tra fat |
| **Kết quả mong đợi** | Fat bữa trưa đúng |
| **Kết quả test thực tế** | — |

### TC_QP_062: Fat bữa tối hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_062 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Bữa tối có data |
| **Các bước thực hiện** | 1. Kiểm tra fat |
| **Kết quả mong đợi** | Fat bữa tối đúng |
| **Kết quả test thực tế** | — |

### TC_QP_063: Fat tổng ngày

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_063 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 3 bữa có data |
| **Các bước thực hiện** | 1. Kiểm tra tổng fat |
| **Kết quả mong đợi** | Tổng fat đúng |
| **Kết quả test thực tế** | — |

### TC_QP_064: Fiber hiển thị (nếu có)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_064 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dishes có fiber data |
| **Các bước thực hiện** | 1. Kiểm tra fiber display |
| **Kết quả mong đợi** | Fiber hiển thị nếu component hỗ trợ |
| **Kết quả test thực tế** | — |

### TC_QP_065: Mini nutrition bars cho mỗi macro

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_065 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra mini bars |
| **Kết quả mong đợi** | Calories, protein, carbs, fat đều có mini progress bars |
| **Kết quả test thực tế** | — |

### TC_QP_066: Tất cả macros = 0 khi không có dishes

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_066 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ngày không có dishes nào |
| **Các bước thực hiện** | 1. Kiểm tra nutrition display |
| **Kết quả mong đợi** | Tất cả hiển thị 0g, bars rỗng |
| **Kết quả test thực tế** | — |

### TC_QP_067: Tất cả macros rất cao

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_067 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ngày có rất nhiều dishes |
| **Các bước thực hiện** | 1. Kiểm tra display |
| **Kết quả mong đợi** | Số hiển thị đúng, không overflow UI |
| **Kết quả test thực tế** | — |

### TC_QP_068: Macro accuracy: protein tổng đúng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_068 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Bữa sáng: Trứng (13g), Cơm (5g) |
| **Các bước thực hiện** | 1. Kiểm tra protein bữa sáng |
| **Kết quả mong đợi** | Protein = 18g (13+5) |
| **Kết quả test thực tế** | — |

### TC_QP_069: Macro format: số + 'g'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_069 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra format macros |
| **Kết quả mong đợi** | Format: '18g' hoặc '18 g' |
| **Kết quả test thực tế** | — |

### TC_QP_070: Macro decimal handling

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_070 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Protein = 15.7g |
| **Các bước thực hiện** | 1. Kiểm tra display |
| **Kết quả mong đợi** | Hiển thị '15.7g' hoặc '16g' (rounded) |
| **Kết quả test thực tế** | — |

### TC_QP_071: Nutrition labels tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_071 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ngôn ngữ Việt |
| **Các bước thực hiện** | 1. Kiểm tra labels |
| **Kết quả mong đợi** | 'Calo', 'Đạm', 'Tinh bột', 'Chất béo' |
| **Kết quả test thực tế** | — |

### TC_QP_072: Nutrition comparison to daily targets

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_072 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Targets đã thiết lập |
| **Các bước thực hiện** | 1. Kiểm tra so sánh |
| **Kết quả mong đợi** | Hiển thị actual/target (ví dụ 1500/2000 kcal) |
| **Kết quả test thực tế** | — |

### TC_QP_073: Nutrition target exceeded warning

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_073 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Calories vượt target |
| **Các bước thực hiện** | 1. Kiểm tra visual indicator |
| **Kết quả mong đợi** | Visual warning (red bar, icon, hoặc text) |
| **Kết quả test thực tế** | — |

### TC_QP_074: Protein target comparison

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_074 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Protein target = 60g |
| **Các bước thực hiện** | 1. Kiểm tra protein bar |
| **Kết quả mong đợi** | Bar hiển thị % so với 60g daily target |
| **Kết quả test thực tế** | — |

### TC_QP_075: Macros cập nhật real-time khi sửa dish

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_075 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Panel mở, sửa dish ingredient amount |
| **Các bước thực hiện** | 1. Sửa số lượng ingredient |
| **Kết quả mong đợi** | Tất cả macros cập nhật tức thì |
| **Kết quả test thực tế** | — |

### TC_QP_076: Nutrition dark mode: bars visible

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_076 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra nutrition bars |
| **Kết quả mong đợi** | Bars colors distinguishable trên nền tối |
| **Kết quả test thực tế** | — |

### TC_QP_077: Nutrition responsive mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_077 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Kiểm tra nutrition layout |
| **Kết quả mong đợi** | Nutrition info compact, stacked vertically |
| **Kết quả test thực tế** | — |

### TC_QP_078: Nutrition responsive desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_078 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Kiểm tra nutrition layout |
| **Kết quả mong đợi** | Nutrition info rộng hơn, có thể hiển thị inline |
| **Kết quả test thực tế** | — |

### TC_QP_079: Nutrition với dish có partial data

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_079 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dish có calories nhưng không có protein |
| **Các bước thực hiện** | 1. Kiểm tra nutrition |
| **Kết quả mong đợi** | Hiển thị calories đúng, protein = 0 hoặc N/A |
| **Kết quả test thực tế** | — |

### TC_QP_080: Nutrition tổng ngày consistent với per-meal

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_080 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | 3 bữa có data |
| **Các bước thực hiện** | 1. So sánh tổng ngày vs tổng 3 bữa |
| **Kết quả mong đợi** | Tổng ngày = bữa sáng + trưa + tối (không sai lệch) |
| **Kết quả test thực tế** | — |

### Nhóm 4: Meal Slot Display (Hiển thị bữa ăn) (TC_QP_081 – TC_QP_110)

### TC_QP_081: Breakfast slot hiển thị emoji 🌅

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_081 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Panel mở, có bữa sáng |
| **Các bước thực hiện** | 1. Kiểm tra breakfast row |
| **Kết quả mong đợi** | Emoji 🌅 hiển thị bên cạnh label 'Sáng' |
| **Kết quả test thực tế** | — |

### TC_QP_082: Lunch slot hiển thị emoji 🌤️

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_082 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Panel mở, có bữa trưa |
| **Các bước thực hiện** | 1. Kiểm tra lunch row |
| **Kết quả mong đợi** | Emoji 🌤️ hiển thị bên cạnh label 'Trưa' |
| **Kết quả test thực tế** | — |

### TC_QP_083: Dinner slot hiển thị emoji 🌙

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_083 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Panel mở, có bữa tối |
| **Các bước thực hiện** | 1. Kiểm tra dinner row |
| **Kết quả mong đợi** | Emoji 🌙 hiển thị bên cạnh label 'Tối' |
| **Kết quả test thực tế** | — |

### TC_QP_084: Test ID quick-preview-row-breakfast

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_084 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Panel mở |
| **Các bước thực hiện** | 1. Kiểm tra DOM |
| **Kết quả mong đợi** | Element có data-testid='quick-preview-row-breakfast' |
| **Kết quả test thực tế** | — |

### TC_QP_085: Test ID quick-preview-row-lunch

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_085 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Panel mở |
| **Các bước thực hiện** | 1. Kiểm tra DOM |
| **Kết quả mong đợi** | data-testid='quick-preview-row-lunch' tồn tại |
| **Kết quả test thực tế** | — |

### TC_QP_086: Test ID quick-preview-row-dinner

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_086 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Panel mở |
| **Các bước thực hiện** | 1. Kiểm tra DOM |
| **Kết quả mong đợi** | data-testid='quick-preview-row-dinner' tồn tại |
| **Kết quả test thực tế** | — |

### TC_QP_087: 0 dishes trong slot → empty state

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_087 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Bữa sáng không có dishes |
| **Các bước thực hiện** | 1. Kiểm tra breakfast slot |
| **Kết quả mong đợi** | Hiển thị empty state 'Chưa có món ăn' hoặc nút thêm |
| **Kết quả test thực tế** | — |

### TC_QP_088: 1 dish trong slot hiển thị tên

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_088 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Bữa sáng có 1 dish: Phở bò |
| **Các bước thực hiện** | 1. Kiểm tra breakfast slot |
| **Kết quả mong đợi** | Hiển thị 'Phở bò' |
| **Kết quả test thực tế** | — |

### TC_QP_089: 2 dishes trong slot hiển thị cả 2 tên

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_089 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Bữa sáng có 2 dishes |
| **Các bước thực hiện** | 1. Kiểm tra breakfast slot |
| **Kết quả mong đợi** | Hiển thị tên cả 2 dishes |
| **Kết quả test thực tế** | — |

### TC_QP_090: 3+ dishes trong slot → truncated

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_090 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Bữa sáng có 4 dishes |
| **Các bước thực hiện** | 1. Kiểm tra breakfast slot |
| **Kết quả mong đợi** | Hiển thị 2 dishes + '...và 2 món khác' |
| **Kết quả test thực tế** | — |

### TC_QP_091: Tên dish dài bị truncate

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_091 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dish tên: 'Cơm chiên hải sản thập cẩm đặc biệt' |
| **Các bước thực hiện** | 1. Kiểm tra display |
| **Kết quả mong đợi** | Tên bị truncate với ... nếu quá dài |
| **Kết quả test thực tế** | — |

### TC_QP_092: Tên dish tiếng Việt hiển thị đúng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_092 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dish: 'Bún bò Huế' |
| **Các bước thực hiện** | 1. Kiểm tra display |
| **Kết quả mong đợi** | Dấu tiếng Việt hiển thị đúng |
| **Kết quả test thực tế** | — |

### TC_QP_093: Dish calories hiển thị bên cạnh tên

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_093 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dish trong slot |
| **Các bước thực hiện** | 1. Kiểm tra dish info |
| **Kết quả mong đợi** | Hiển thị 'Phở bò - 500 kcal' |
| **Kết quả test thực tế** | — |

### TC_QP_094: Quick add button cho slot trống

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_094 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Bữa sáng trống |
| **Các bước thực hiện** | 1. Kiểm tra slot |
| **Kết quả mong đợi** | Nút '+' hoặc 'Thêm bữa sáng' hiển thị |
| **Kết quả test thực tế** | — |

### TC_QP_095: Quick add button cho bữa sáng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_095 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Bữa sáng trống |
| **Các bước thực hiện** | 1. Click nút thêm |
| **Kết quả mong đợi** | Mở meal planner modal cho bữa sáng |
| **Kết quả test thực tế** | — |

### TC_QP_096: Quick add button cho bữa trưa

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_096 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Bữa trưa trống |
| **Các bước thực hiện** | 1. Click nút thêm |
| **Kết quả mong đợi** | Mở meal planner modal cho bữa trưa |
| **Kết quả test thực tế** | — |

### TC_QP_097: Quick add button cho bữa tối

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_097 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Bữa tối trống |
| **Các bước thực hiện** | 1. Click nút thêm |
| **Kết quả mong đợi** | Mở meal planner modal cho bữa tối |
| **Kết quả test thực tế** | — |

### TC_QP_098: 'Plan All' button khi tất cả slots trống

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_098 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | 3 bữa đều trống |
| **Các bước thực hiện** | 1. Kiểm tra panel |
| **Kết quả mong đợi** | Nút 'Lên kế hoạch tất cả' hiển thị |
| **Kết quả test thực tế** | — |

### TC_QP_099: 'Plan All' click → onPlanAll callback

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_099 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Nút Plan All visible |
| **Các bước thực hiện** | 1. Click 'Lên kế hoạch tất cả' |
| **Kết quả mong đợi** | onPlanAll() được gọi, mở meal planner |
| **Kết quả test thực tế** | — |

### TC_QP_100: 'Plan All' ẩn khi tất cả slots đã có dishes

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_100 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 3 bữa đều có dishes |
| **Các bước thực hiện** | 1. Kiểm tra panel |
| **Kết quả mong đợi** | Nút 'Plan All' không hiển thị |
| **Kết quả test thực tế** | — |

### TC_QP_101: Edit button cho dish trong slot

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_101 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Slot có dish |
| **Các bước thực hiện** | 1. Kiểm tra dish actions |
| **Kết quả mong đợi** | Nút edit/sửa hiển thị khi hover hoặc tap |
| **Kết quả test thực tế** | — |

### TC_QP_102: 5 dishes trong 1 slot

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_102 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Bữa sáng có 5 dishes |
| **Các bước thực hiện** | 1. Kiểm tra display |
| **Kết quả mong đợi** | 2 dishes visible + '...và 3 món khác' |
| **Kết quả test thực tế** | — |

### TC_QP_103: 10 dishes trong 1 slot

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_103 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Bữa sáng có 10 dishes |
| **Các bước thực hiện** | 1. Kiểm tra display |
| **Kết quả mong đợi** | 2 dishes visible + '...và 8 món khác' |
| **Kết quả test thực tế** | — |

### TC_QP_104: Slot row click → onPlanMeal callback

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_104 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Click vào meal slot |
| **Các bước thực hiện** | 1. Click vào row bữa sáng |
| **Kết quả mong đợi** | onPlanMeal('breakfast') được gọi |
| **Kết quả test thực tế** | — |

### TC_QP_105: Meal slot labels tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_105 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ngôn ngữ Việt |
| **Các bước thực hiện** | 1. Kiểm tra labels |
| **Kết quả mong đợi** | 'Sáng', 'Trưa', 'Tối' (không phải Breakfast/Lunch/Dinner) |
| **Kết quả test thực tế** | — |

### TC_QP_106: Slot với dish đã bị xóa

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_106 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Plan references dish đã bị xóa |
| **Các bước thực hiện** | 1. Kiểm tra slot |
| **Kết quả mong đợi** | Không crash, hiển thị 'Món ăn không tồn tại' hoặc ẩn |
| **Kết quả test thực tế** | — |

### TC_QP_107: Slot order: Sáng → Trưa → Tối (top→bottom)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_107 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Panel mở với 3 bữa |
| **Các bước thực hiện** | 1. Kiểm tra thứ tự |
| **Kết quả mong đợi** | Sáng ở trên, Trưa ở giữa, Tối ở dưới |
| **Kết quả test thực tế** | — |

### TC_QP_108: Slot dividers/separators

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_108 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 3 slots hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra giữa các slots |
| **Kết quả mong đợi** | Có divider line hoặc spacing rõ ràng giữa các bữa |
| **Kết quả test thực tế** | — |

### TC_QP_109: Dish name với emoji

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_109 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dish tên '🍜 Phở bò' |
| **Các bước thực hiện** | 1. Kiểm tra display |
| **Kết quả mong đợi** | Emoji trong tên hiển thị đúng |
| **Kết quả test thực tế** | — |

### TC_QP_110: All slots full → nutrition summary nổi bật

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_110 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 3 bữa đầy đủ |
| **Các bước thực hiện** | 1. Kiểm tra overall nutrition |
| **Kết quả mong đợi** | Tổng nutrition summary hiển thị prominently |
| **Kết quả test thực tế** | — |

### Nhóm 5: Empty & Partial States (Trạng thái rỗng & một phần) (TC_QP_111 – TC_QP_135)

### TC_QP_111: Tất cả slots trống → CTA 'Lên kế hoạch bữa ăn'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_111 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Ngày không có bất kỳ dish nào |
| **Các bước thực hiện** | 1. Mở panel cho ngày trống |
| **Kết quả mong đợi** | Hiển thị message empty và nút CTA |
| **Kết quả test thực tế** | — |

### TC_QP_112: Chỉ bữa sáng có dishes

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_112 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Bữa sáng có 1 dish, trưa và tối trống |
| **Các bước thực hiện** | 1. Kiểm tra panel |
| **Kết quả mong đợi** | Sáng hiển thị dish, Trưa/Tối hiển thị empty + nút thêm |
| **Kết quả test thực tế** | — |

### TC_QP_113: Chỉ bữa trưa có dishes

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_113 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Bữa trưa có dishes, sáng/tối trống |
| **Các bước thực hiện** | 1. Kiểm tra panel |
| **Kết quả mong đợi** | Trưa hiển thị dish, Sáng/Tối empty |
| **Kết quả test thực tế** | — |

### TC_QP_114: Chỉ bữa tối có dishes

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_114 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Bữa tối có dishes |
| **Các bước thực hiện** | 1. Kiểm tra panel |
| **Kết quả mong đợi** | Tối hiển thị dish, Sáng/Trưa empty |
| **Kết quả test thực tế** | — |

### TC_QP_115: 2 bữa có dishes, 1 trống

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_115 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Sáng và trưa có dishes, tối trống |
| **Các bước thực hiện** | 1. Kiểm tra panel |
| **Kết quả mong đợi** | 2 bữa hiển thị dishes, 1 bữa empty + add button |
| **Kết quả test thực tế** | — |

### TC_QP_116: Tất cả 3 bữa đầy đủ

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_116 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | 3 bữa đều có ≥1 dish |
| **Các bước thực hiện** | 1. Kiểm tra panel |
| **Kết quả mong đợi** | 3 slots hiển thị dishes, không có CTA 'Plan All' |
| **Kết quả test thực tế** | — |

### TC_QP_117: Empty state sau clear plan

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_117 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Ngày có dishes |
| **Các bước thực hiện** | 1. Clear plan cho ngày đó<br>2. Kiểm tra panel |
| **Kết quả mong đợi** | Panel chuyển sang empty state |
| **Kết quả test thực tế** | — |

### TC_QP_118: Empty state cho ngày trong tương lai xa

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_118 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ngày 01/01/2027 |
| **Các bước thực hiện** | 1. Mở panel cho ngày tương lai |
| **Kết quả mong đợi** | Empty state phù hợp |
| **Kết quả test thực tế** | — |

### TC_QP_119: Empty state cho ngày quá khứ

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_119 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ngày 01/01/2025 |
| **Các bước thực hiện** | 1. Mở panel cho ngày quá khứ |
| **Kết quả mong đợi** | Empty state hoặc read-only |
| **Kết quả test thực tế** | — |

### TC_QP_120: CTA button click → meal planner modal

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_120 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Empty state hiển thị |
| **Các bước thực hiện** | 1. Click nút CTA |
| **Kết quả mong đợi** | Meal planner modal mở cho ngày đó |
| **Kết quả test thực tế** | — |

### TC_QP_121: Empty state dark mode

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_121 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật, ngày trống |
| **Các bước thực hiện** | 1. Kiểm tra empty state |
| **Kết quả mong đợi** | Message và CTA hiển thị rõ trong dark mode |
| **Kết quả test thực tế** | — |

### TC_QP_122: Empty state i18n tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_122 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ngôn ngữ Việt, ngày trống |
| **Các bước thực hiện** | 1. Kiểm tra text |
| **Kết quả mong đợi** | 'Chưa có kế hoạch bữa ăn' hoặc tương tự |
| **Kết quả test thực tế** | — |

### TC_QP_123: Empty state responsive mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_123 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px, ngày trống |
| **Các bước thực hiện** | 1. Kiểm tra layout |
| **Kết quả mong đợi** | Empty state centered, nút dễ bấm |
| **Kết quả test thực tế** | — |

### TC_QP_124: Empty state responsive desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_124 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px, ngày trống |
| **Các bước thực hiện** | 1. Kiểm tra layout |
| **Kết quả mong đợi** | Empty state trong panel bên phải |
| **Kết quả test thực tế** | — |

### TC_QP_125: Partial empty: add button cho slot trống chỉ hiện ở slot trống

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_125 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Sáng có dish, trưa trống, tối có dish |
| **Các bước thực hiện** | 1. Kiểm tra panel |
| **Kết quả mong đợi** | Nút thêm chỉ hiện ở bữa trưa |
| **Kết quả test thực tế** | — |

### TC_QP_126: Empty slot placeholder text

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_126 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Slot trống |
| **Các bước thực hiện** | 1. Kiểm tra placeholder |
| **Kết quả mong đợi** | Text 'Thêm bữa sáng/trưa/tối' hoặc icon + |
| **Kết quả test thực tế** | — |

### TC_QP_127: All empty → illustration/icon hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_127 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Ngày hoàn toàn trống |
| **Các bước thực hiện** | 1. Kiểm tra visual |
| **Kết quả mong đợi** | Có illustration hoặc icon rỗng thẩm mỹ |
| **Kết quả test thực tế** | — |

### TC_QP_128: Empty state không hiển thị nutrition bars

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_128 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ngày trống |
| **Các bước thực hiện** | 1. Kiểm tra nutrition section |
| **Kết quả mong đợi** | Nutrition bars rỗng hoặc ẩn |
| **Kết quả test thực tế** | — |

### TC_QP_129: Transition: từ empty → có data

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_129 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ngày trống, thêm dish |
| **Các bước thực hiện** | 1. Thêm 1 dish vào bữa sáng |
| **Kết quả mong đợi** | Panel transition smooth từ empty sang có content |
| **Kết quả test thực tế** | — |

### TC_QP_130: Transition: từ có data → empty

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_130 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ngày có 1 dish, xóa nó |
| **Các bước thực hiện** | 1. Xóa dish duy nhất |
| **Kết quả mong đợi** | Panel transition smooth sang empty state |
| **Kết quả test thực tế** | — |

### TC_QP_131: Empty state accessibility

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_131 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Screen reader, ngày trống |
| **Các bước thực hiện** | 1. Kiểm tra accessibility |
| **Kết quả mong đợi** | Screen reader đọc empty state message |
| **Kết quả test thực tế** | — |

### TC_QP_132: Empty panel loading state

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_132 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel đang load data |
| **Các bước thực hiện** | 1. Mở panel |
| **Kết quả mong đợi** | Skeleton hoặc spinner trong lúc load |
| **Kết quả test thực tế** | — |

### TC_QP_133: Error state khi data load fail

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_133 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Data load thất bại |
| **Các bước thực hiện** | 1. Mở panel |
| **Kết quả mong đợi** | Error message hiển thị, không crash |
| **Kết quả test thực tế** | — |

### TC_QP_134: Empty state cho ngày chưa có plan object

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_134 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ngày không tồn tại trong dayPlans |
| **Các bước thực hiện** | 1. Mở panel |
| **Kết quả mong đợi** | Xử lý gracefully, hiển thị empty state |
| **Kết quả test thực tế** | — |

### TC_QP_135: Multiple empty slots: count empty

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_135 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 2 slots trống |
| **Các bước thực hiện** | 1. Kiểm tra panel |
| **Kết quả mong đợi** | Hiển thị đúng số slots cần lên kế hoạch |
| **Kết quả test thực tế** | — |

### Nhóm 6: Real-time Updates (Cập nhật thời gian thực) (TC_QP_136 – TC_QP_160)

### TC_QP_136: Thêm dish → panel cập nhật ngay

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_136 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Panel mở, bữa sáng trống |
| **Các bước thực hiện** | 1. Thêm dish Phở bò vào bữa sáng<br>2. Kiểm tra panel |
| **Kết quả mong đợi** | Panel hiển thị 'Phở bò' trong bữa sáng ngay lập tức |
| **Kết quả test thực tế** | — |

### TC_QP_137: Sửa dish → panel cập nhật

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_137 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Panel mở, bữa sáng có Phở bò |
| **Các bước thực hiện** | 1. Sửa tên dish thành 'Bún bò' |
| **Kết quả mong đợi** | Panel hiển thị 'Bún bò' thay vì 'Phở bò' |
| **Kết quả test thực tế** | — |

### TC_QP_138: Xóa dish → panel cập nhật

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_138 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Panel mở, bữa sáng có 1 dish |
| **Các bước thực hiện** | 1. Xóa dish khỏi bữa sáng |
| **Kết quả mong đợi** | Panel chuyển sang empty state cho bữa sáng |
| **Kết quả test thực tế** | — |

### TC_QP_139: Copy plan → preview hiển thị data copied

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_139 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Panel mở, copy plan từ ngày khác |
| **Các bước thực hiện** | 1. Copy plan ngày A sang ngày B<br>2. Mở panel ngày B |
| **Kết quả mong đợi** | Panel hiển thị data giống ngày A |
| **Kết quả test thực tế** | — |

### TC_QP_140: Clear plan → preview empty

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_140 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Panel mở, ngày có data |
| **Các bước thực hiện** | 1. Clear toàn bộ plan ngày đó |
| **Kết quả mong đợi** | Panel chuyển sang empty state hoàn toàn |
| **Kết quả test thực tế** | — |

### TC_QP_141: Apply template → preview hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_141 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Panel mở, apply meal template |
| **Các bước thực hiện** | 1. Apply template cho ngày |
| **Kết quả mong đợi** | Panel hiển thị dishes từ template |
| **Kết quả test thực tế** | — |

### TC_QP_142: AI thêm dish → preview cập nhật

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_142 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel mở, AI suggestion accepted |
| **Các bước thực hiện** | 1. Accept AI suggestion cho bữa trưa |
| **Kết quả mong đợi** | Panel hiển thị dish mới từ AI |
| **Kết quả test thực tế** | — |

### TC_QP_143: Sửa ingredient amount → nutrition recalculate

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_143 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Panel mở, dish có 200g thịt bò |
| **Các bước thực hiện** | 1. Sửa thịt bò từ 200g → 400g |
| **Kết quả mong đợi** | Nutrition values double trong panel |
| **Kết quả test thực tế** | — |

### TC_QP_144: Rapid changes → panel stable

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_144 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel mở |
| **Các bước thực hiện** | 1. Thêm 5 dishes nhanh liên tiếp |
| **Kết quả mong đợi** | Panel cập nhật mỗi lần, không crash hoặc lag |
| **Kết quả test thực tế** | — |

### TC_QP_145: Thêm nhiều dishes cùng lúc

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_145 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel mở, bữa sáng trống |
| **Các bước thực hiện** | 1. Thêm 3 dishes vào bữa sáng cùng lúc |
| **Kết quả mong đợi** | Panel hiển thị 2 dishes + '...và 1 món khác' |
| **Kết quả test thực tế** | — |

### TC_QP_146: Thay đổi ở tab khác → panel refresh khi quay lại

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_146 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel mở ở tab Lịch |
| **Các bước thực hiện** | 1. Chuyển tab Quản lý, sửa dish<br>2. Quay lại tab Lịch |
| **Kết quả mong đợi** | Panel hiển thị data đã cập nhật |
| **Kết quả test thực tế** | — |

### TC_QP_147: Drag dish giữa meals (nếu có)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_147 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Desktop, dish trong bữa sáng |
| **Các bước thực hiện** | 1. Drag dish từ sáng sang trưa |
| **Kết quả mong đợi** | Dish chuyển sang bữa trưa, panel cập nhật |
| **Kết quả test thực tế** | — |

### TC_QP_148: Undo action → panel revert

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_148 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Vừa xóa dish |
| **Các bước thực hiện** | 1. Undo (nếu có) |
| **Kết quả mong đợi** | Panel revert hiển thị dish đã xóa |
| **Kết quả test thực tế** | — |

### TC_QP_149: Batch update → panel update 1 lần

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_149 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Nhiều thay đổi cùng lúc |
| **Các bước thực hiện** | 1. Import data mới |
| **Kết quả mong đợi** | Panel cập nhật 1 lần (không flicker nhiều lần) |
| **Kết quả test thực tế** | — |

### TC_QP_150: Panel data sync với Calendar view

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_150 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Panel mở + Calendar view |
| **Các bước thực hiện** | 1. Thêm dish<br>2. Kiểm tra cả panel và calendar |
| **Kết quả mong đợi** | Cả 2 cập nhật đồng bộ |
| **Kết quả test thực tế** | — |

### TC_QP_151: Real-time update không gây re-render toàn panel

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_151 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel mở |
| **Các bước thực hiện** | 1. Sửa 1 dish<br>2. Kiểm tra performance |
| **Kết quả mong đợi** | Chỉ slot bị ảnh hưởng re-render, không toàn panel |
| **Kết quả test thực tế** | — |

### TC_QP_152: Update khi panel đang animation

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_152 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel đang expand animation |
| **Các bước thực hiện** | 1. Thêm dish trong lúc animation |
| **Kết quả mong đợi** | Animation hoàn thành, data hiển thị đúng |
| **Kết quả test thực tế** | — |

### TC_QP_153: Delete last dish → slot chuyển empty

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_153 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Slot có 1 dish duy nhất |
| **Các bước thực hiện** | 1. Xóa dish đó |
| **Kết quả mong đợi** | Slot chuyển empty state + add button |
| **Kết quả test thực tế** | — |

### TC_QP_154: Update từ Google Drive sync

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_154 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel mở, Drive sync download data mới |
| **Các bước thực hiện** | 1. Sync download hoàn thành |
| **Kết quả mong đợi** | Panel cập nhật data mới từ sync |
| **Kết quả test thực tế** | — |

### TC_QP_155: Update không mất scroll position

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_155 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel scrolled xuống |
| **Các bước thực hiện** | 1. Thêm dish vào bữa sáng |
| **Kết quả mong đợi** | Scroll position giữ nguyên sau update |
| **Kết quả test thực tế** | — |

### TC_QP_156: Meal type icon không thay đổi sau update

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_156 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel mở |
| **Các bước thực hiện** | 1. Thêm/xóa dishes |
| **Kết quả mong đợi** | Emoji 🌅🌤️🌙 giữ nguyên vị trí |
| **Kết quả test thực tế** | — |

### TC_QP_157: Update visual feedback

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_157 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Panel mở |
| **Các bước thực hiện** | 1. Thêm dish |
| **Kết quả mong đợi** | Flash hoặc highlight nhẹ trên slot vừa thay đổi |
| **Kết quả test thực tế** | — |

### TC_QP_158: Concurrent updates (2 browser tabs)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_158 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 2 tabs mở cùng ngày |
| **Các bước thực hiện** | 1. Tab 1 thêm dish<br>2. Tab 2 kiểm tra |
| **Kết quả mong đợi** | Tab 2 cập nhật sau refresh/sync |
| **Kết quả test thực tế** | — |

### TC_QP_159: Panel update performance < 50ms

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_159 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel mở |
| **Các bước thực hiện** | 1. Thêm dish, đo render time |
| **Kết quả mong đợi** | Panel re-render < 50ms |
| **Kết quả test thực tế** | — |

### TC_QP_160: Memory stable sau 100 updates

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_160 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel mở |
| **Các bước thực hiện** | 1. Thêm/xóa 100 dishes liên tiếp<br>2. Kiểm tra memory |
| **Kết quả mong đợi** | Memory không tăng bất thường |
| **Kết quả test thực tế** | — |

### Nhóm 7: Date Navigation (Điều hướng ngày) (TC_QP_161 – TC_QP_180)

### TC_QP_161: Panel cho ngày hôm nay

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_161 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Calendar ở ngày hôm nay |
| **Các bước thực hiện** | 1. Tap ngày hôm nay |
| **Kết quả mong đợi** | Panel hiển thị data đúng cho today |
| **Kết quả test thực tế** | — |

### TC_QP_162: Panel cho ngày hôm qua

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_162 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Calendar navigation |
| **Các bước thực hiện** | 1. Navigate đến hôm qua<br>2. Tap |
| **Kết quả mong đợi** | Panel hiển thị data ngày hôm qua |
| **Kết quả test thực tế** | — |

### TC_QP_163: Panel cho ngày mai

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_163 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Calendar navigation |
| **Các bước thực hiện** | 1. Navigate đến ngày mai<br>2. Tap |
| **Kết quả mong đợi** | Panel hiển thị data ngày mai (có thể empty) |
| **Kết quả test thực tế** | — |

### TC_QP_164: Panel cho ngày tuần trước

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_164 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Calendar week navigation |
| **Các bước thực hiện** | 1. Navigate lùi 1 tuần<br>2. Tap ngày |
| **Kết quả mong đợi** | Panel hiển thị data đúng |
| **Kết quả test thực tế** | — |

### TC_QP_165: Panel cho ngày tuần sau

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_165 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Calendar week navigation |
| **Các bước thực hiện** | 1. Navigate tiến 1 tuần<br>2. Tap ngày |
| **Kết quả mong đợi** | Panel hiển thị data đúng |
| **Kết quả test thực tế** | — |

### TC_QP_166: Tap ngày khác → panel cập nhật

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_166 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Panel mở cho ngày A |
| **Các bước thực hiện** | 1. Tap ngày B |
| **Kết quả mong đợi** | Panel chuyển sang hiển thị data ngày B |
| **Kết quả test thực tế** | — |

### TC_QP_167: Rapid date tapping 5 ngày → panel stable

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_167 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Calendar hiển thị |
| **Các bước thực hiện** | 1. Tap nhanh ngày 1,2,3,4,5 |
| **Kết quả mong đợi** | Panel hiển thị data ngày 5 (cuối cùng), stable |
| **Kết quả test thực tế** | — |

### TC_QP_168: Panel state preserved khi navigate tuần

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_168 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel mở |
| **Các bước thực hiện** | 1. Nhấn nút tuần tiếp theo |
| **Kết quả mong đợi** | Panel đóng hoặc cập nhật cho ngày tương ứng |
| **Kết quả test thực tế** | — |

### TC_QP_169: Panel với ngày không có dayPlan object

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_169 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ngày chưa từng được plan |
| **Các bước thực hiện** | 1. Tap ngày chưa có plan |
| **Kết quả mong đợi** | Hiển thị empty state, không crash |
| **Kết quả test thực tế** | — |

### TC_QP_170: Calendar navigate tháng → panel reset

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_170 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel mở, navigate sang tháng khác |
| **Các bước thực hiện** | 1. Navigate sang tháng sau |
| **Kết quả mong đợi** | Panel đóng hoặc reset |
| **Kết quả test thực tế** | — |

### TC_QP_171: Panel date header format đúng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_171 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel mở |
| **Các bước thực hiện** | 1. Kiểm tra date header |
| **Kết quả mong đợi** | Format: 'Thứ Hai, 15/03/2026' hoặc tương tự |
| **Kết quả test thực tế** | — |

### TC_QP_172: Panel cho ngày đầu tháng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_172 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ngày 01 của tháng |
| **Các bước thực hiện** | 1. Tap ngày 01 |
| **Kết quả mong đợi** | Panel hiển thị đúng |
| **Kết quả test thực tế** | — |

### TC_QP_173: Panel cho ngày cuối tháng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_173 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ngày 28/29/30/31 của tháng |
| **Các bước thực hiện** | 1. Tap ngày cuối |
| **Kết quả mong đợi** | Panel hiển thị đúng |
| **Kết quả test thực tế** | — |

### TC_QP_174: Panel cho ngày 29/02 (năm nhuận)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_174 |
| **Loại** | Edge |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Năm nhuận |
| **Các bước thực hiện** | 1. Navigate đến 29/02<br>2. Tap |
| **Kết quả mong đợi** | Panel hiển thị đúng cho leap day |
| **Kết quả test thực tế** | — |

### TC_QP_175: Panel mở → navigate date → panel đóng rồi mở lại

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_175 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel mở cho ngày A |
| **Các bước thực hiện** | 1. Navigate đến ngày cách xa<br>2. Panel đóng<br>3. Tap ngày mới |
| **Kết quả mong đợi** | Panel mở lại cho ngày mới |
| **Kết quả test thực tế** | — |

### TC_QP_176: Date change không gây memory leak

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_176 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel mở |
| **Các bước thực hiện** | 1. Chuyển qua 50 ngày khác nhau<br>2. Kiểm tra memory |
| **Kết quả mong đợi** | Memory stable, không leak |
| **Kết quả test thực tế** | — |

### TC_QP_177: Panel cho selected date sync với Calendar highlight

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_177 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Panel mở cho ngày A |
| **Các bước thực hiện** | 1. Kiểm tra calendar |
| **Kết quả mong đợi** | Ngày A được highlight trên calendar |
| **Kết quả test thực tế** | — |

### TC_QP_178: Calendar date selection → panel auto-scroll to top

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_178 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel đang scroll xuống |
| **Các bước thực hiện** | 1. Tap ngày mới |
| **Kết quả mong đợi** | Panel scroll lại top với content mới |
| **Kết quả test thực tế** | — |

### TC_QP_179: Panel cho cùng ngày khi user chọn lại

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_179 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel mở cho ngày A, tap ngày A lại |
| **Các bước thực hiện** | 1. Tap ngày A lần nữa |
| **Kết quả mong đợi** | Panel toggle (đóng) hoặc stay open (theo design) |
| **Kết quả test thực tế** | — |

### TC_QP_180: Navigation arrows + panel interaction

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_180 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel mở |
| **Các bước thực hiện** | 1. Click navigation arrow tuần trước/sau |
| **Kết quả mong đợi** | Panel đóng hoặc update cho ngày mới trong tuần |
| **Kết quả test thực tế** | — |

### Nhóm 8: Dark Mode & Responsive (Chế độ tối & Responsive) (TC_QP_181 – TC_QP_200)

### TC_QP_181: Dark mode: panel background

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_181 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở panel |
| **Kết quả mong đợi** | Panel background dark (slate-800 hoặc tương tự) |
| **Kết quả test thực tế** | — |

### TC_QP_182: Dark mode: text colors

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_182 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra text trong panel |
| **Kết quả mong đợi** | Text light color, đọc được rõ |
| **Kết quả test thực tế** | — |

### TC_QP_183: Dark mode: progress bars visible

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_183 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra nutrition bars |
| **Kết quả mong đợi** | Bar colors distinguishable trên nền tối |
| **Kết quả test thực tế** | — |

### TC_QP_184: Dark mode: emoji visibility

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_184 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra 🌅🌤️🌙 |
| **Kết quả mong đợi** | Emojis hiển thị rõ trên nền tối |
| **Kết quả test thực tế** | — |

### TC_QP_185: Dark mode: border colors

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_185 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra borders giữa slots |
| **Kết quả mong đợi** | Borders visible nhưng subtle trên nền tối |
| **Kết quả test thực tế** | — |

### TC_QP_186: Dark mode: empty state

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_186 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật, ngày trống |
| **Các bước thực hiện** | 1. Kiểm tra empty state |
| **Kết quả mong đợi** | Message và CTA button visible |
| **Kết quả test thực tế** | — |

### TC_QP_187: Dark mode: add button

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_187 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật, slot trống |
| **Các bước thực hiện** | 1. Kiểm tra nút thêm |
| **Kết quả mong đợi** | Button visible và clickable |
| **Kết quả test thực tế** | — |

### TC_QP_188: Mobile layout: panel full-width

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_188 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Mở panel |
| **Kết quả mong đợi** | Panel width = 100% viewport |
| **Kết quả test thực tế** | — |

### TC_QP_189: Desktop layout: panel fixed width

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_189 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Mở panel |
| **Kết quả mong đợi** | Panel có fixed width (ví dụ 300-400px) bên phải |
| **Kết quả test thực tế** | — |

### TC_QP_190: Tablet layout: panel adapt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_190 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 768px |
| **Các bước thực hiện** | 1. Mở panel |
| **Kết quả mong đợi** | Panel layout phù hợp tablet |
| **Kết quả test thực tế** | — |

### TC_QP_191: Panel width responsive: không quá rộng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_191 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1920px |
| **Các bước thực hiện** | 1. Kiểm tra panel width |
| **Kết quả mong đợi** | Panel có max-width, không chiếm toàn bộ màn hình |
| **Kết quả test thực tế** | — |

### TC_QP_192: Panel height auto-adjust: ít content

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_192 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Chỉ 1 bữa có 1 dish |
| **Các bước thực hiện** | 1. Kiểm tra panel height |
| **Kết quả mong đợi** | Panel height adjust theo content, không quá cao |
| **Kết quả test thực tế** | — |

### TC_QP_193: Panel height auto-adjust: nhiều content

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_193 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 3 bữa đầy đủ, nhiều dishes |
| **Các bước thực hiện** | 1. Kiểm tra panel height |
| **Kết quả mong đợi** | Panel có max-height với scroll |
| **Kết quả test thực tế** | — |

### TC_QP_194: Font sizes responsive trong panel

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_194 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport thay đổi |
| **Các bước thực hiện** | 1. Kiểm tra font sizes |
| **Kết quả mong đợi** | Text readable ở cả mobile và desktop |
| **Kết quả test thực tế** | — |

### TC_QP_195: Panel spacing responsive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_195 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport thay đổi |
| **Các bước thực hiện** | 1. Kiểm tra padding/margin |
| **Kết quả mong đợi** | Spacing phù hợp kích thước |
| **Kết quả test thực tế** | — |

### TC_QP_196: Panel scroll behavior mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_196 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px, nhiều content |
| **Các bước thực hiện** | 1. Scroll trong panel |
| **Kết quả mong đợi** | Smooth scroll, momentum |
| **Kết quả test thực tế** | — |

### TC_QP_197: Panel scroll behavior desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_197 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px, nhiều content |
| **Các bước thực hiện** | 1. Scroll trong panel |
| **Kết quả mong đợi** | Smooth scroll, mouse wheel |
| **Kết quả test thực tế** | — |

### TC_QP_198: Panel transition dark↔light

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_198 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Toggle dark mode khi panel mở |
| **Các bước thực hiện** | 1. Toggle theme |
| **Kết quả mong đợi** | Panel colors update smooth |
| **Kết quả test thực tế** | — |

### TC_QP_199: Panel trong landscape mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_199 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Mobile landscape |
| **Các bước thực hiện** | 1. Mở panel |
| **Kết quả mong đợi** | Panel adjust height/width cho landscape |
| **Kết quả test thực tế** | — |

### TC_QP_200: Panel print layout (nếu có)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_200 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Desktop, panel mở |
| **Các bước thực hiện** | 1. Print page |
| **Kết quả mong đợi** | Panel content included in print |
| **Kết quả test thực tế** | — |

### Nhóm 9: Accessibility & Edge Cases (Trợ năng & Trường hợp biên) (TC_QP_201 – TC_QP_210)

### TC_QP_201: Screen reader đọc panel content

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_201 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Screen reader bật |
| **Các bước thực hiện** | 1. Mở panel |
| **Kết quả mong đợi** | Screen reader đọc: slot names, dish names, nutrition values |
| **Kết quả test thực tế** | — |

### TC_QP_202: Keyboard navigation trong panel

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_202 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Desktop, panel mở |
| **Các bước thực hiện** | 1. Tab qua elements |
| **Kết quả mong đợi** | Focus di chuyển qua slots, dishes, buttons |
| **Kết quả test thực tế** | — |

### TC_QP_203: Focus management: panel mở → focus vào panel

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_203 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel vừa mở |
| **Các bước thực hiện** | 1. Kiểm tra focus |
| **Kết quả mong đợi** | Focus chuyển vào panel (first interactive element) |
| **Kết quả test thực tế** | — |

### TC_QP_204: Focus management: panel đóng → focus về calendar

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_204 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel vừa đóng |
| **Các bước thực hiện** | 1. Kiểm tra focus |
| **Kết quả mong đợi** | Focus quay về date cell trên calendar |
| **Kết quả test thực tế** | — |

### TC_QP_205: ARIA labels cho panel

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_205 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Panel mở |
| **Các bước thực hiện** | 1. Kiểm tra aria-labels |
| **Kết quả mong đợi** | Panel có aria-label, slots có aria-labels phù hợp |
| **Kết quả test thực tế** | — |

### TC_QP_206: ARIA live region cho nutrition updates

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_206 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Panel mở, thêm dish |
| **Các bước thực hiện** | 1. Screen reader lắng nghe |
| **Kết quả mong đợi** | Nutrition change được announce bởi screen reader |
| **Kết quả test thực tế** | — |

### TC_QP_207: Performance: panel render < 50ms

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_207 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel chưa mở |
| **Các bước thực hiện** | 1. Tap ngày, đo render time |
| **Kết quả mong đợi** | Panel render hoàn thành < 50ms |
| **Kết quả test thực tế** | — |

### TC_QP_208: Memory: open/close 100 lần không leak

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_208 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Panel mở |
| **Các bước thực hiện** | 1. Mở/đóng panel 100 lần<br>2. Kiểm tra memory |
| **Kết quả mong đợi** | Memory stable, không tăng bất thường |
| **Kết quả test thực tế** | — |

### TC_QP_209: Panel khi sync đang chạy

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_209 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Sync đang upload |
| **Các bước thực hiện** | 1. Mở panel |
| **Kết quả mong đợi** | Panel hoạt động bình thường, data hiện tại |
| **Kết quả test thực tế** | — |

### TC_QP_210: Panel với very long content scroll

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_QP_210 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Mỗi bữa 10 dishes, nhiều nutrition data |
| **Các bước thực hiện** | 1. Mở panel<br>2. Scroll |
| **Kết quả mong đợi** | Panel scrollable, performance OK |
| **Kết quả test thực tế** | — |

---

## Đề xuất Cải tiến

### Đề xuất 1: Inline Editing in Preview
- **Vấn đề hiện tại**: Preview is read-only. Edit requires opening separate modal.
- **Giải pháp đề xuất**: Inline edit: tap dish name → edit. Tap amount → adjust. Swipe to delete.
- **Phần trăm cải thiện**: Edit speed +60%, Modal usage -50%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 2: Nutrition at a Glance
- **Vấn đề hiện tại**: Nutrition details require navigating to separate sub-tab.
- **Giải pháp đề xuất**: Mini donut chart in preview: cal/protein/carbs/fat ratios. Tap to expand.
- **Phần trăm cải thiện**: Nutrition awareness +50%, Navigation steps -40%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 3: Quick Photo Log
- **Vấn đề hiện tại**: To log a meal via photo, must navigate to AI tab.
- **Giải pháp đề xuất**: Camera icon in preview. Snap → AI analyze → add to slot. One-step flow.
- **Phần trăm cải thiện**: Photo logging speed +70%, Feature discoverability +40%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 4: Meal Swap Between Slots
- **Vấn đề hiện tại**: Can't move dish from lunch to dinner easily.
- **Giải pháp đề xuất**: Drag & drop between meal sections or "Move to..." menu.
- **Phần trăm cải thiện**: Meal rearrangement time -70%, Flexibility +40%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 5: Preview Comparison Mode
- **Vấn đề hiện tại**: Can't compare today vs yesterday or vs goal.
- **Giải pháp đề xuất**: Side-by-side comparison: "Today vs Yesterday" or "Today vs Goal".
- **Phần trăm cải thiện**: Self-awareness +40%, Comparison time -60%
- **Mức độ ưu tiên**: Low | **Effort**: M
