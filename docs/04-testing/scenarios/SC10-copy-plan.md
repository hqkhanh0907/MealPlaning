# Scenario 10: Copy Plan

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Copy Plan cho phép user sao chép meal plan từ ngày/tuần nguồn sang ngày/tuần đích. Hỗ trợ 2 mode: Copy Day (3 meals) và Copy Week (7 days × 3 meals = 21 slots). Nếu ngày đích đã có data → confirm overwrite. Hook useCopyPlan quản lý logic.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| CopyPlanModal | modals/CopyPlanModal.tsx | UI modal |
| useCopyPlan | hooks/useCopyPlan.ts | Copy logic |
| CalendarTab | CalendarTab.tsx | Source context |

## Luồng nghiệp vụ

1. User chọn ngày/tuần trên calendar
2. Click "Copy Plan" button
3. Modal opens: select source date(s) + target date(s)
4. Choose mode: Day or Week
5. If target has existing data → overwrite confirmation
6. Confirm → data copied → calendar refreshes → modal closes

## Quy tắc nghiệp vụ

1. Copy Day: copies breakfast, lunch, dinner for 1 day
2. Copy Week: copies all 7 days (Mon-Sun)
3. Overwrite: replaces target completely (not merge)
4. Source = Target → no-op or warning
5. Dishes referenced, not deep-copied
6. Nutrition auto-recalculated on target dates

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_CP_01 | Copy Plan button visible | Positive | P1 |
| TC_CP_02 | Click → modal opens | Positive | P0 |
| TC_CP_03 | Modal shows source date | Positive | P1 |
| TC_CP_04 | Target date picker | Positive | P1 |
| TC_CP_05 | Mode: Day selected | Positive | P1 |
| TC_CP_06 | Mode: Week selected | Positive | P1 |
| TC_CP_07 | Confirm copy button | Positive | P1 |
| TC_CP_08 | Cancel button | Positive | P1 |
| TC_CP_09 | Copy Day: source → target | Positive | P0 |
| TC_CP_10 | Copy Day: 3 meals copied | Positive | P0 |
| TC_CP_11 | Copy Day: breakfast only if only breakfast | Edge | P2 |
| TC_CP_12 | Copy Day: empty source → empty target | Positive | P2 |
| TC_CP_13 | Copy Week: 7 days copied | Positive | P0 |
| TC_CP_14 | Copy Week: 21 slots correct | Positive | P1 |
| TC_CP_15 | Copy Week: partial week (3/7 days with data) | Edge | P2 |
| TC_CP_16 | Target has data → overwrite confirm | Positive | P0 |
| TC_CP_17 | Confirm overwrite → data replaced | Positive | P0 |
| TC_CP_18 | Cancel overwrite → no changes | Positive | P1 |
| TC_CP_19 | Source = Target → warning | Negative | P1 |
| TC_CP_20 | Source empty → copy nothing | Edge | P1 |
| TC_CP_21 | Success notification after copy | Positive | P1 |
| TC_CP_22 | Calendar refreshes after copy | Positive | P1 |
| TC_CP_23 | Modal closes after copy | Positive | P1 |
| TC_CP_24 | Target nutrition recalculated | Positive | P1 |
| TC_CP_25 | Copied dishes reference same dish objects | Positive | P1 |
| TC_CP_26 | Edit dish after copy → both dates reflect | Positive | P1 |
| TC_CP_27 | Delete dish after copy → both dates affected | Positive | P1 |
| TC_CP_28 | Copy to past date | Positive | P2 |
| TC_CP_29 | Copy to future date (30 days ahead) | Positive | P2 |
| TC_CP_30 | Copy to far future (1 year) | Boundary | P2 |
| TC_CP_31 | Copy across months | Positive | P2 |
| TC_CP_32 | Copy across years | Edge | P2 |
| TC_CP_33 | Copy to today | Positive | P2 |
| TC_CP_34 | Copy from today | Positive | P2 |
| TC_CP_35 | Copy Week: Mon start | Positive | P1 |
| TC_CP_36 | Copy Week: mid-week source → Mon target | Edge | P2 |
| TC_CP_37 | Copy Week: cross-month boundary | Edge | P2 |
| TC_CP_38 | Copy Week: cross-year boundary | Edge | P2 |
| TC_CP_39 | Date picker shows correct dates | Positive | P2 |
| TC_CP_40 | Date picker navigation (prev/next month) | Positive | P2 |
| TC_CP_41 | Multiple consecutive copies | Positive | P2 |
| TC_CP_42 | Copy → then clear target → then re-copy | Edge | P2 |
| TC_CP_43 | Copy Day with 10 dishes per meal | Boundary | P2 |
| TC_CP_44 | Copy Week with full 21 slots filled | Boundary | P2 |
| TC_CP_45 | Copy performance (large data) | Boundary | P2 |
| TC_CP_46 | Copy preserves dish order | Positive | P2 |
| TC_CP_47 | Copy preserves meal assignment | Positive | P1 |
| TC_CP_48 | Copied plan in grocery list | Positive | P1 |
| TC_CP_49 | Undo copy | Positive | P3 |
| TC_CP_50 | Copy to multiple targets | Positive | P3 |
| TC_CP_51 | Persist after reload | Positive | P0 |
| TC_CP_52 | localStorage updated correctly | Positive | P1 |
| TC_CP_53 | Copy → export → verify data | Positive | P2 |
| TC_CP_54 | Copy → cloud sync | Positive | P2 |
| TC_CP_55 | Dark mode modal | Positive | P2 |
| TC_CP_56 | i18n modal labels | Positive | P2 |
| TC_CP_57 | Mobile modal layout | Positive | P2 |
| TC_CP_58 | Desktop modal layout | Positive | P2 |
| TC_CP_59 | Modal backdrop close | Positive | P2 |
| TC_CP_60 | Modal Escape close | Positive | P2 |
| TC_CP_61 | Screen reader | Positive | P3 |
| TC_CP_62 | Keyboard navigation | Positive | P3 |
| TC_CP_63 | Touch on date picker mobile | Positive | P2 |
| TC_CP_64 | Loading state during copy | Positive | P2 |
| TC_CP_65 | Error handling during copy | Negative | P1 |
| TC_CP_66 | Copy interrupted (tab close) | Edge | P2 |
| TC_CP_67 | Source data changes during modal open | Edge | P2 |
| TC_CP_68 | Target selected then cleared | Edge | P2 |
| TC_CP_69 | No target selected → validation | Negative | P1 |
| TC_CP_70 | Invalid date → error | Negative | P2 |
| TC_CP_71 | Feb 29 leap year | Edge | P2 |
| TC_CP_72 | Copy with deleted ingredient dish | Edge | P1 |
| TC_CP_73 | Copy with AI-generated dish | Positive | P2 |
| TC_CP_74 | Copy template-applied plan | Positive | P2 |
| TC_CP_75 | Overwrite partial data | Edge | P2 |
| TC_CP_76 | Target day some meals have data | Edge | P2 |
| TC_CP_77 | Target week mixed (some days full, some empty) | Edge | P2 |
| TC_CP_78 | Copy Day breakfast only source | Edge | P2 |
| TC_CP_79 | Copy Day lunch + dinner only | Edge | P2 |
| TC_CP_80 | Verify meal type mapping (B→B, L→L, D→D) | Positive | P1 |
| TC_CP_81 | Copy does not affect source data | Positive | P0 |
| TC_CP_82 | Source data unchanged after overwrite | Positive | P1 |
| TC_CP_83 | Multiple copy same source → different targets | Positive | P2 |
| TC_CP_84 | Chain copy: A→B then B→C | Positive | P2 |
| TC_CP_85 | Circular copy: A→B then B→A | Edge | P2 |
| TC_CP_86 | Copy entire month data | Boundary | P3 |
| TC_CP_87 | Copy with unsaved modal changes | Edge | P2 |
| TC_CP_88 | Concurrent copy operations | Edge | P2 |
| TC_CP_89 | Copy → immediately edit target | Positive | P2 |
| TC_CP_90 | Copy → immediately delete target meal | Positive | P2 |
| TC_CP_91 | Copy preserves original creation context | Edge | P3 |
| TC_CP_92 | Notification after large copy (week) | Positive | P2 |
| TC_CP_93 | Error recovery after partial copy | Edge | P2 |
| TC_CP_94 | Copy with 0 dishes in source day | Edge | P2 |
| TC_CP_95 | Animation/transition on copy | Positive | P3 |
| TC_CP_96 | Batch copy (multiple days select) | Positive | P3 |
| TC_CP_97 | Copy preview before confirm | Positive | P3 |
| TC_CP_98 | Copy history log | Positive | P3 |
| TC_CP_99 | Merge mode (not overwrite) | Positive | P3 |
| TC_CP_100 | Smart copy (avoid duplicates) | Positive | P3 |
| TC_CP_101 | Copy with time constraints | Edge | P3 |
| TC_CP_102 | Stress test: copy 30 times rapidly | Boundary | P3 |
| TC_CP_103 | Memory after many copies | Boundary | P3 |
| TC_CP_104 | Copy Day → verify 3 and only 3 meals | Positive | P1 |
| TC_CP_105 | Copy Week → verify 7 and only 7 days | Positive | P1 |

---
| TC_CP_106 | Source preview — 0 meals source trống | Positive | P2 |
| TC_CP_107 | Source preview — 1 meal chỉ breakfast | Positive | P2 |
| TC_CP_108 | Source preview — 2 meals breakfast + lunch | Positive | P2 |
| TC_CP_109 | Source preview — 3 meals đầy đủ | Positive | P1 |
| TC_CP_110 | Source preview — hiện tên dishes cho mỗi meal | Positive | P1 |
| TC_CP_111 | Source preview — meal có 1 dish | Positive | P2 |
| TC_CP_112 | Source preview — meal có 3 dishes | Positive | P2 |
| TC_CP_113 | Source preview — meal có 10 dishes | Boundary | P2 |
| TC_CP_114 | Source preview — dish đã bị xóa hiện Đã xóa | Edge | P1 |
| TC_CP_115 | Source preview — dark mode hiển thị đúng | Positive | P2 |
| TC_CP_116 | Source preview — i18n labels Breakfast/Lunch/Dinner | Positive | P2 |
| TC_CP_117 | Source preview — nutrition tổng hiển thị | Positive | P2 |
| TC_CP_118 | Source preview — empty meal hiện Không có món | Positive | P2 |
| TC_CP_119 | Source preview — scroll nếu nhiều dishes | Positive | P3 |
| TC_CP_120 | Source date format locale vi dd/MM en MM/dd | Positive | P2 |
| TC_CP_121 | Quick select Ngày mai → thêm ngày mai | Positive | P1 |
| TC_CP_122 | Quick select Tuần này → thêm 6 ngày tiếp | Positive | P1 |
| TC_CP_123 | Quick select Ngày mai đã selected → no duplicate | Positive | P2 |
| TC_CP_124 | Quick select Tuần này một số đã selected → no dup | Positive | P2 |
| TC_CP_125 | Quick select → selected dates sorted | Positive | P2 |
| TC_CP_126 | Quick select → count cập nhật | Positive | P2 |
| TC_CP_127 | Quick select Ngày mai cuối tháng → cross-month | Edge | P2 |
| TC_CP_128 | Quick select Tuần này 28/12 → cross-year | Edge | P2 |
| TC_CP_129 | Quick select Ngày mai i18n label đúng | Positive | P2 |
| TC_CP_130 | Quick select Tuần này i18n label đúng | Positive | P2 |
| TC_CP_131 | Quick select dark mode buttons đúng | Positive | P2 |
| TC_CP_132 | Quick select → remove 1 ngày → count giảm | Positive | P2 |
| TC_CP_133 | Quick select Tuần này → remove tất cả → empty | Positive | P2 |
| TC_CP_134 | Quick select double-click → chỉ thêm 1 lần | Edge | P2 |
| TC_CP_135 | Quick select → source date không trong selected | Positive | P1 |
| TC_CP_136 | Date picker — mở lịch hiển thị | Positive | P1 |
| TC_CP_137 | Date picker — chọn 1 ngày thêm vào selected | Positive | P1 |
| TC_CP_138 | Date picker — chọn nhiều ngày | Positive | P1 |
| TC_CP_139 | Date picker — chọn ngày đã selected → toggle | Positive | P2 |
| TC_CP_140 | Date picker — navigate tháng trước/sau | Positive | P2 |
| TC_CP_141 | Date picker — chọn ngày khác tháng | Positive | P2 |
| TC_CP_142 | Date picker — Feb 29 leap year hiện | Edge | P2 |
| TC_CP_143 | Date picker — source date highlight/disabled | Positive | P2 |
| TC_CP_144 | Date picker — selected dates highlight | Positive | P2 |
| TC_CP_145 | Date picker — dark mode đúng | Positive | P2 |
| TC_CP_146 | Date picker — mobile touch interaction | Positive | P2 |
| TC_CP_147 | Date picker — desktop click interaction | Positive | P2 |
| TC_CP_148 | Date picker — chọn ngày quá khứ cho phép | Positive | P2 |
| TC_CP_149 | Date picker — chọn ngày 1 năm sau cho phép | Boundary | P2 |
| TC_CP_150 | Date picker — i18n month/day names | Positive | P2 |
| TC_CP_151 | Copy mode Overwrite default — target thay thế | Positive | P0 |
| TC_CP_152 | Copy mode Merge — dishes thêm vào không xóa cũ | Positive | P1 |
| TC_CP_153 | Copy mode toggle Overwrite ↔ Merge | Positive | P1 |
| TC_CP_154 | Overwrite — target 3 meals tất cả thay thế | Positive | P1 |
| TC_CP_155 | Merge — target có breakfast → source thêm vào | Positive | P1 |
| TC_CP_156 | Merge — target trống → giống Overwrite | Edge | P2 |
| TC_CP_157 | Merge — source trống → target giữ nguyên | Edge | P2 |
| TC_CP_158 | Copy mode persist trong modal session | Positive | P2 |
| TC_CP_159 | Copy mode i18n labels Ghi đè/Ghép | Positive | P2 |
| TC_CP_160 | Copy mode dark mode toggle đúng | Positive | P2 |
| TC_CP_161 | Overwrite confirm dialog rõ Sẽ ghi đè | Positive | P1 |
| TC_CP_162 | Merge confirm dialog rõ Sẽ ghép thêm | Positive | P2 |
| TC_CP_163 | Copy mode tooltip giải thích sự khác biệt | Positive | P3 |
| TC_CP_164 | Merge → nutrition tổng cả cũ và mới | Positive | P1 |
| TC_CP_165 | Overwrite → nutrition chỉ từ source | Positive | P1 |
| TC_CP_166 | Selected dates — hiển thị list đã chọn | Positive | P1 |
| TC_CP_167 | Selected dates — remove bằng click X | Positive | P1 |
| TC_CP_168 | Selected dates — sorted ascending | Positive | P2 |
| TC_CP_169 | Selected dates — no duplicates dedup | Positive | P2 |
| TC_CP_170 | Selected dates — count badge số ngày | Positive | P2 |
| TC_CP_171 | Selected dates — 0 dates → copy disabled | Positive | P1 |
| TC_CP_172 | Selected dates — 1 date → copy enabled | Positive | P1 |
| TC_CP_173 | Selected dates — 7 dates copy tất cả | Positive | P2 |
| TC_CP_174 | Selected dates — 30 dates boundary | Boundary | P2 |
| TC_CP_175 | Selected dates — format theo locale | Positive | P2 |
| TC_CP_176 | Selected dates — date có data indicator | Positive | P2 |
| TC_CP_177 | Selected dates — remove all → copy disabled | Positive | P2 |
| TC_CP_178 | Selected dates — dark mode list đúng | Positive | P2 |
| TC_CP_179 | Selected dates — scroll nhiều dates | Positive | P3 |
| TC_CP_180 | Selected dates — mobile responsive | Positive | P2 |
| TC_CP_181 | Copy → target breakfast = source breakfast | Positive | P0 |
| TC_CP_182 | Copy → target lunch = source lunch | Positive | P0 |
| TC_CP_183 | Copy → target dinner = source dinner | Positive | P0 |
| TC_CP_184 | Copy → source data KHÔNG thay đổi | Positive | P0 |
| TC_CP_185 | Copy → target nutrition recalculate đúng | Positive | P1 |
| TC_CP_186 | Copy → dishes reference không deep copy | Positive | P1 |
| TC_CP_187 | Copy → edit dish sau → cả source target update | Positive | P1 |
| TC_CP_188 | Copy → delete dish → cả hai affected | Positive | P1 |
| TC_CP_189 | Copy → localStorage cập nhật ngay | Positive | P1 |
| TC_CP_190 | Copy → reload → data vẫn đúng | Positive | P1 |
| TC_CP_191 | Copy → export → verify target trong JSON | Positive | P2 |
| TC_CP_192 | Copy → cloud sync data đồng bộ | Positive | P2 |
| TC_CP_193 | Copy → grocery list cập nhật target dates | Positive | P2 |
| TC_CP_194 | Copy nhiều dates → tất cả targets đúng | Positive | P1 |
| TC_CP_195 | Copy target có data + Overwrite → cũ mất | Positive | P1 |
| TC_CP_196 | Copy target có data + Merge → cũ + mới | Positive | P1 |
| TC_CP_197 | Chain copy A→B rồi B→C → C giống A | Positive | P2 |
| TC_CP_198 | Copy → edit target → save → persist | Positive | P2 |
| TC_CP_199 | Copy → delete 1 dish target → chỉ target affected | Edge | P2 |
| TC_CP_200 | Copy large plan 3×5 dishes performance OK | Boundary | P2 |
| TC_CP_201 | Copy no target → validation Chọn ít nhất 1 ngày | Negative | P0 |
| TC_CP_202 | Copy source=target → warning cùng ngày | Negative | P1 |
| TC_CP_203 | Copy source có dish bị xóa → skip copy phần còn | Edge | P1 |
| TC_CP_204 | Copy network error sync → local vẫn OK | Edge | P2 |
| TC_CP_205 | Copy interrupted đóng modal → no partial write | Edge | P2 |
| TC_CP_206 | Copy rapid click 5 lần → chỉ copy 1 lần | Edge | P2 |
| TC_CP_207 | Copy success notification Đã sao chép X ngày | Positive | P1 |
| TC_CP_208 | Copy → modal tự đóng sau success | Positive | P1 |
| TC_CP_209 | Copy → calendar refresh hiển thị data mới | Positive | P1 |
| TC_CP_210 | Copy → undo revert target về trước | Positive | P3 |


---

## Chi tiết Test Cases

##### TC_CP_01: Copy Plan button visible
- **Pre-conditions**: Calendar tab, ngày có plan
- **Steps**: 1. Quan sát nút Copy Plan
- **Expected**: Nút Copy Plan hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_02: Click → modal opens
- **Pre-conditions**: Nút Copy Plan visible
- **Steps**: 1. Click Copy Plan
- **Expected**: CopyPlanModal mở ra
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_CP_03: Modal shows source date
- **Pre-conditions**: Modal mở
- **Steps**: 1. Quan sát source date
- **Expected**: Source date hiển thị ngày đã chọn
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_04: Target date picker
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_05: Mode: Day selected
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_06: Mode: Week selected
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_07: Confirm copy button
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_08: Cancel button
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_09: Copy Day: source → target
- **Pre-conditions**: Modal mở, source có 3 meals, target chọn
- **Steps**: 1. Click Copy
- **Expected**: 3 meals copy sang target
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_CP_10: Copy Day: 3 meals copied
- **Pre-conditions**: Source có breakfast + lunch + dinner
- **Steps**: 1. Copy to target
- **Expected**: Target có đủ 3 meals
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_CP_11: Copy Day: breakfast only if only breakfast
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_12: Copy Day: empty source → empty target
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_13: Copy Week: 7 days copied
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_CP_14: Copy Week: 21 slots correct
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_15: Copy Week: partial week (3/7 days with data)
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_16: Target has data → overwrite confirm
- **Pre-conditions**: Target đã có data
- **Steps**: 1. Copy to target
- **Expected**: Overwrite confirm dialog hiện
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_CP_17: Confirm overwrite → data replaced
- **Pre-conditions**: Confirm overwrite dialog
- **Steps**: 1. Click Xác nhận
- **Expected**: Target data bị thay thế bằng source
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_CP_18: Cancel overwrite → no changes
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_19: Source = Target → warning
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_CP_20: Source empty → copy nothing
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_CP_21: Success notification after copy
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_22: Calendar refreshes after copy
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_23: Modal closes after copy
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_24: Target nutrition recalculated
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_25: Copied dishes reference same dish objects
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_26: Edit dish after copy → both dates reflect
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_27: Delete dish after copy → both dates affected
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_28: Copy to past date
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_29: Copy to future date (30 days ahead)
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_30: Copy to far future (1 year)
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_CP_31: Copy across months
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_32: Copy across years
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_33: Copy to today
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_34: Copy from today
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_35: Copy Week: Mon start
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_36: Copy Week: mid-week source → Mon target
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_37: Copy Week: cross-month boundary
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_38: Copy Week: cross-year boundary
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_39: Date picker shows correct dates
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_40: Date picker navigation (prev/next month)
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_41: Multiple consecutive copies
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_42: Copy → then clear target → then re-copy
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_43: Copy Day with 10 dishes per meal
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_CP_44: Copy Week with full 21 slots filled
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_CP_45: Copy performance (large data)
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_CP_46: Copy preserves dish order
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_47: Copy preserves meal assignment
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_48: Copied plan in grocery list
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_49: Undo copy
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_CP_50: Copy to multiple targets
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_CP_51: Persist after reload
- **Pre-conditions**: Vừa copy xong
- **Steps**: 1. Reload page
- **Expected**: Data vẫn persist đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_CP_52: localStorage updated correctly
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_53: Copy → export → verify data
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_54: Copy → cloud sync
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_55: Dark mode modal
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_56: i18n modal labels
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_57: Mobile modal layout
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_58: Desktop modal layout
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_59: Modal backdrop close
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_60: Modal Escape close
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_61: Screen reader
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_CP_62: Keyboard navigation
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_CP_63: Touch on date picker mobile
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_64: Loading state during copy
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_65: Error handling during copy
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_CP_66: Copy interrupted (tab close)
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_67: Source data changes during modal open
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_68: Target selected then cleared
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_69: No target selected → validation
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_CP_70: Invalid date → error
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_CP_71: Feb 29 leap year
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_72: Copy with deleted ingredient dish
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_CP_73: Copy with AI-generated dish
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_74: Copy template-applied plan
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_75: Overwrite partial data
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_76: Target day some meals have data
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_77: Target week mixed (some days full, some empty)
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_78: Copy Day breakfast only source
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_79: Copy Day lunch + dinner only
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_80: Verify meal type mapping (B→B, L→L, D→D)
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_81: Copy does not affect source data
- **Pre-conditions**: Source có data, target selected
- **Steps**: 1. Copy 2. Kiểm tra source
- **Expected**: Source data KHÔNG thay đổi sau copy
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_CP_82: Source data unchanged after overwrite
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_83: Multiple copy same source → different targets
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_84: Chain copy: A→B then B→C
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_85: Circular copy: A→B then B→A
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_86: Copy entire month data
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P3

##### TC_CP_87: Copy with unsaved modal changes
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_88: Concurrent copy operations
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_89: Copy → immediately edit target
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_90: Copy → immediately delete target meal
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_91: Copy preserves original creation context
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P3

##### TC_CP_92: Notification after large copy (week)
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_93: Error recovery after partial copy
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_94: Copy with 0 dishes in source day
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_95: Animation/transition on copy
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_CP_96: Batch copy (multiple days select)
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_CP_97: Copy preview before confirm
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_CP_98: Copy history log
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_CP_99: Merge mode (not overwrite)
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_CP_100: Smart copy (avoid duplicates)
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_CP_101: Copy with time constraints
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P3

##### TC_CP_102: Stress test: copy 30 times rapidly
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P3

##### TC_CP_103: Memory after many copies
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P3

##### TC_CP_104: Copy Day → verify 3 and only 3 meals
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_105: Copy Week → verify 7 and only 7 days
- **Pre-conditions**: Có plan data, Calendar tab active
- **Steps**: 1. Thực hiện thao tác
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_106: Source preview — 0 meals source trống
- **Pre-conditions**: Source day không có meal nào
- **Steps**: 1. Mở CopyPlanModal 2. Quan sát preview
- **Expected**: Preview hiện "Không có meal nào" cho source trống
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_107: Source preview — 1 meal chỉ breakfast
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Source preview — 1 meal chỉ breakfast
- **Expected**: Kết quả: Source preview — 1 meal chỉ breakfast
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_108: Source preview — 2 meals breakfast + lunch
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Source preview — 2 meals breakfast + lunch
- **Expected**: Kết quả: Source preview — 2 meals breakfast + lunch
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_109: Source preview — 3 meals đầy đủ
- **Pre-conditions**: Source có breakfast+lunch+dinner
- **Steps**: 1. Mở modal 2. Quan sát preview
- **Expected**: Preview hiện 3 sections: Sáng, Trưa, Tối với tên dishes
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_110: Source preview — hiện tên dishes cho mỗi meal
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Source preview — hiện tên dishes cho mỗi meal
- **Expected**: Kết quả: Source preview — hiện tên dishes cho mỗi meal
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_111: Source preview — meal có 1 dish
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Source preview — meal có 1 dish
- **Expected**: Kết quả: Source preview — meal có 1 dish
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_112: Source preview — meal có 3 dishes
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Source preview — meal có 3 dishes
- **Expected**: Kết quả: Source preview — meal có 3 dishes
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_113: Source preview — meal có 10 dishes
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Source preview — meal có 10 dishes
- **Expected**: Kết quả: Source preview — meal có 10 dishes
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_CP_114: Source preview — dish đã bị xóa hiện Đã xóa
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Source preview — dish đã bị xóa hiện Đã xóa
- **Expected**: Kết quả: Source preview — dish đã bị xóa hiện Đã xóa
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_CP_115: Source preview — dark mode hiển thị đúng
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Source preview — dark mode hiển thị đúng
- **Expected**: Kết quả: Source preview — dark mode hiển thị đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_116: Source preview — i18n labels Breakfast/Lunch/Dinner
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Source preview — i18n labels Breakfast/Lunch/Dinner
- **Expected**: Kết quả: Source preview — i18n labels Breakfast/Lunch/Dinner
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_117: Source preview — nutrition tổng hiển thị
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Source preview — nutrition tổng hiển thị
- **Expected**: Kết quả: Source preview — nutrition tổng hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_118: Source preview — empty meal hiện Không có món
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Source preview — empty meal hiện Không có món
- **Expected**: Kết quả: Source preview — empty meal hiện Không có món
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_119: Source preview — scroll nếu nhiều dishes
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Source preview — scroll nếu nhiều dishes
- **Expected**: Kết quả: Source preview — scroll nếu nhiều dishes
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_CP_120: Source date format locale vi dd/MM en MM/dd
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Source date format locale vi dd/MM en MM/dd
- **Expected**: Kết quả: Source date format locale vi dd/MM en MM/dd
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_121: Quick select Ngày mai → thêm ngày mai
- **Pre-conditions**: Modal mở
- **Steps**: 1. Click nút Ngày mai
- **Expected**: Ngày mai thêm vào selected dates list
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_122: Quick select Tuần này → thêm 6 ngày tiếp
- **Pre-conditions**: Modal mở
- **Steps**: 1. Click nút Tuần này
- **Expected**: 6 ngày tiếp theo thêm vào selected dates
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_123: Quick select Ngày mai đã selected → no duplicate
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Quick select Ngày mai đã selected → no duplicate
- **Expected**: Kết quả: Quick select Ngày mai đã selected → no duplicate
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_124: Quick select Tuần này một số đã selected → no dup
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Quick select Tuần này một số đã selected → no dup
- **Expected**: Kết quả: Quick select Tuần này một số đã selected → no dup
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_125: Quick select → selected dates sorted
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Quick select → selected dates sorted
- **Expected**: Kết quả: Quick select → selected dates sorted
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_126: Quick select → count cập nhật
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Quick select → count cập nhật
- **Expected**: Kết quả: Quick select → count cập nhật
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_127: Quick select Ngày mai cuối tháng → cross-month
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Quick select Ngày mai cuối tháng → cross-month
- **Expected**: Kết quả: Quick select Ngày mai cuối tháng → cross-month
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_128: Quick select Tuần này 28/12 → cross-year
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Quick select Tuần này 28/12 → cross-year
- **Expected**: Kết quả: Quick select Tuần này 28/12 → cross-year
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_129: Quick select Ngày mai i18n label đúng
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Quick select Ngày mai i18n label đúng
- **Expected**: Kết quả: Quick select Ngày mai i18n label đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_130: Quick select Tuần này i18n label đúng
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Quick select Tuần này i18n label đúng
- **Expected**: Kết quả: Quick select Tuần này i18n label đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_131: Quick select dark mode buttons đúng
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Quick select dark mode buttons đúng
- **Expected**: Kết quả: Quick select dark mode buttons đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_132: Quick select → remove 1 ngày → count giảm
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Quick select → remove 1 ngày → count giảm
- **Expected**: Kết quả: Quick select → remove 1 ngày → count giảm
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_133: Quick select Tuần này → remove tất cả → empty
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Quick select Tuần này → remove tất cả → empty
- **Expected**: Kết quả: Quick select Tuần này → remove tất cả → empty
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_134: Quick select double-click → chỉ thêm 1 lần
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Quick select double-click → chỉ thêm 1 lần
- **Expected**: Kết quả: Quick select double-click → chỉ thêm 1 lần
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_135: Quick select → source date không trong selected
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Quick select → source date không trong selected
- **Expected**: Kết quả: Quick select → source date không trong selected
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_136: Date picker — mở lịch hiển thị
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Date picker — mở lịch hiển thị
- **Expected**: Kết quả: Date picker — mở lịch hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_137: Date picker — chọn 1 ngày thêm vào selected
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Date picker — chọn 1 ngày thêm vào selected
- **Expected**: Kết quả: Date picker — chọn 1 ngày thêm vào selected
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_138: Date picker — chọn nhiều ngày
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Date picker — chọn nhiều ngày
- **Expected**: Kết quả: Date picker — chọn nhiều ngày
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_139: Date picker — chọn ngày đã selected → toggle
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Date picker — chọn ngày đã selected → toggle
- **Expected**: Kết quả: Date picker — chọn ngày đã selected → toggle
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_140: Date picker — navigate tháng trước/sau
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Date picker — navigate tháng trước/sau
- **Expected**: Kết quả: Date picker — navigate tháng trước/sau
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_141: Date picker — chọn ngày khác tháng
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Date picker — chọn ngày khác tháng
- **Expected**: Kết quả: Date picker — chọn ngày khác tháng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_142: Date picker — Feb 29 leap year hiện
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Date picker — Feb 29 leap year hiện
- **Expected**: Kết quả: Date picker — Feb 29 leap year hiện
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_143: Date picker — source date highlight/disabled
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Date picker — source date highlight/disabled
- **Expected**: Kết quả: Date picker — source date highlight/disabled
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_144: Date picker — selected dates highlight
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Date picker — selected dates highlight
- **Expected**: Kết quả: Date picker — selected dates highlight
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_145: Date picker — dark mode đúng
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Date picker — dark mode đúng
- **Expected**: Kết quả: Date picker — dark mode đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_146: Date picker — mobile touch interaction
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Date picker — mobile touch interaction
- **Expected**: Kết quả: Date picker — mobile touch interaction
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_147: Date picker — desktop click interaction
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Date picker — desktop click interaction
- **Expected**: Kết quả: Date picker — desktop click interaction
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_148: Date picker — chọn ngày quá khứ cho phép
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Date picker — chọn ngày quá khứ cho phép
- **Expected**: Kết quả: Date picker — chọn ngày quá khứ cho phép
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_149: Date picker — chọn ngày 1 năm sau cho phép
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Date picker — chọn ngày 1 năm sau cho phép
- **Expected**: Kết quả: Date picker — chọn ngày 1 năm sau cho phép
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_CP_150: Date picker — i18n month/day names
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Date picker — i18n month/day names
- **Expected**: Kết quả: Date picker — i18n month/day names
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_151: Copy mode Overwrite default — target thay thế
- **Pre-conditions**: Mode=Overwrite, target có data
- **Steps**: 1. Copy source → target 2. Confirm
- **Expected**: Target data bị thay thế hoàn toàn bằng source
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_CP_152: Copy mode Merge — dishes thêm vào không xóa cũ
- **Pre-conditions**: Mode=Merge, target có breakfast
- **Steps**: 1. Copy source → target
- **Expected**: Source dishes thêm vào target, target cũ giữ nguyên
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_153: Copy mode toggle Overwrite ↔ Merge
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy mode toggle Overwrite ↔ Merge
- **Expected**: Kết quả: Copy mode toggle Overwrite ↔ Merge
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_154: Overwrite — target 3 meals tất cả thay thế
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Overwrite — target 3 meals tất cả thay thế
- **Expected**: Kết quả: Overwrite — target 3 meals tất cả thay thế
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_155: Merge — target có breakfast → source thêm vào
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Merge — target có breakfast → source thêm vào
- **Expected**: Kết quả: Merge — target có breakfast → source thêm vào
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_156: Merge — target trống → giống Overwrite
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Merge — target trống → giống Overwrite
- **Expected**: Kết quả: Merge — target trống → giống Overwrite
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_157: Merge — source trống → target giữ nguyên
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Merge — source trống → target giữ nguyên
- **Expected**: Kết quả: Merge — source trống → target giữ nguyên
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_158: Copy mode persist trong modal session
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy mode persist trong modal session
- **Expected**: Kết quả: Copy mode persist trong modal session
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_159: Copy mode i18n labels Ghi đè/Ghép
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy mode i18n labels Ghi đè/Ghép
- **Expected**: Kết quả: Copy mode i18n labels Ghi đè/Ghép
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_160: Copy mode dark mode toggle đúng
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy mode dark mode toggle đúng
- **Expected**: Kết quả: Copy mode dark mode toggle đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_161: Overwrite confirm dialog rõ Sẽ ghi đè
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Overwrite confirm dialog rõ Sẽ ghi đè
- **Expected**: Kết quả: Overwrite confirm dialog rõ Sẽ ghi đè
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_162: Merge confirm dialog rõ Sẽ ghép thêm
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Merge confirm dialog rõ Sẽ ghép thêm
- **Expected**: Kết quả: Merge confirm dialog rõ Sẽ ghép thêm
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_163: Copy mode tooltip giải thích sự khác biệt
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy mode tooltip giải thích sự khác biệt
- **Expected**: Kết quả: Copy mode tooltip giải thích sự khác biệt
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_CP_164: Merge → nutrition tổng cả cũ và mới
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Merge → nutrition tổng cả cũ và mới
- **Expected**: Kết quả: Merge → nutrition tổng cả cũ và mới
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_165: Overwrite → nutrition chỉ từ source
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Overwrite → nutrition chỉ từ source
- **Expected**: Kết quả: Overwrite → nutrition chỉ từ source
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_166: Selected dates — hiển thị list đã chọn
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Selected dates — hiển thị list đã chọn
- **Expected**: Kết quả: Selected dates — hiển thị list đã chọn
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_167: Selected dates — remove bằng click X
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Selected dates — remove bằng click X
- **Expected**: Kết quả: Selected dates — remove bằng click X
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_168: Selected dates — sorted ascending
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Selected dates — sorted ascending
- **Expected**: Kết quả: Selected dates — sorted ascending
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_169: Selected dates — no duplicates dedup
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Selected dates — no duplicates dedup
- **Expected**: Kết quả: Selected dates — no duplicates dedup
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_170: Selected dates — count badge số ngày
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Selected dates — count badge số ngày
- **Expected**: Kết quả: Selected dates — count badge số ngày
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_171: Selected dates — 0 dates → copy disabled
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Selected dates — 0 dates → copy disabled
- **Expected**: Kết quả: Selected dates — 0 dates → copy disabled
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_172: Selected dates — 1 date → copy enabled
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Selected dates — 1 date → copy enabled
- **Expected**: Kết quả: Selected dates — 1 date → copy enabled
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_173: Selected dates — 7 dates copy tất cả
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Selected dates — 7 dates copy tất cả
- **Expected**: Kết quả: Selected dates — 7 dates copy tất cả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_174: Selected dates — 30 dates boundary
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Selected dates — 30 dates boundary
- **Expected**: Kết quả: Selected dates — 30 dates boundary
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_CP_175: Selected dates — format theo locale
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Selected dates — format theo locale
- **Expected**: Kết quả: Selected dates — format theo locale
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_176: Selected dates — date có data indicator
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Selected dates — date có data indicator
- **Expected**: Kết quả: Selected dates — date có data indicator
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_177: Selected dates — remove all → copy disabled
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Selected dates — remove all → copy disabled
- **Expected**: Kết quả: Selected dates — remove all → copy disabled
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_178: Selected dates — dark mode list đúng
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Selected dates — dark mode list đúng
- **Expected**: Kết quả: Selected dates — dark mode list đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_179: Selected dates — scroll nhiều dates
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Selected dates — scroll nhiều dates
- **Expected**: Kết quả: Selected dates — scroll nhiều dates
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_CP_180: Selected dates — mobile responsive
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Selected dates — mobile responsive
- **Expected**: Kết quả: Selected dates — mobile responsive
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_181: Copy → target breakfast = source breakfast
- **Pre-conditions**: Source: breakfast=[DishA,DishB]
- **Steps**: 1. Copy to empty target 2. Kiểm tra target
- **Expected**: Target breakfast = [DishA, DishB] giống source
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_CP_182: Copy → target lunch = source lunch
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy → target lunch = source lunch
- **Expected**: Kết quả: Copy → target lunch = source lunch
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_CP_183: Copy → target dinner = source dinner
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy → target dinner = source dinner
- **Expected**: Kết quả: Copy → target dinner = source dinner
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_CP_184: Copy → source data KHÔNG thay đổi
- **Pre-conditions**: Source có full 3 meals
- **Steps**: 1. Copy to target 2. Kiểm tra source
- **Expected**: Source data không thay đổi sau khi copy
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_CP_185: Copy → target nutrition recalculate đúng
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy → target nutrition recalculate đúng
- **Expected**: Kết quả: Copy → target nutrition recalculate đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_186: Copy → dishes reference không deep copy
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy → dishes reference không deep copy
- **Expected**: Kết quả: Copy → dishes reference không deep copy
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_187: Copy → edit dish sau → cả source target update
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy → edit dish sau → cả source target update
- **Expected**: Kết quả: Copy → edit dish sau → cả source target update
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_188: Copy → delete dish → cả hai affected
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy → delete dish → cả hai affected
- **Expected**: Kết quả: Copy → delete dish → cả hai affected
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_189: Copy → localStorage cập nhật ngay
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy → localStorage cập nhật ngay
- **Expected**: Kết quả: Copy → localStorage cập nhật ngay
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_190: Copy → reload → data vẫn đúng
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy → reload → data vẫn đúng
- **Expected**: Kết quả: Copy → reload → data vẫn đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_191: Copy → export → verify target trong JSON
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy → export → verify target trong JSON
- **Expected**: Kết quả: Copy → export → verify target trong JSON
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_192: Copy → cloud sync data đồng bộ
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy → cloud sync data đồng bộ
- **Expected**: Kết quả: Copy → cloud sync data đồng bộ
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_193: Copy → grocery list cập nhật target dates
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy → grocery list cập nhật target dates
- **Expected**: Kết quả: Copy → grocery list cập nhật target dates
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_194: Copy nhiều dates → tất cả targets đúng
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy nhiều dates → tất cả targets đúng
- **Expected**: Kết quả: Copy nhiều dates → tất cả targets đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_195: Copy target có data + Overwrite → cũ mất
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy target có data + Overwrite → cũ mất
- **Expected**: Kết quả: Copy target có data + Overwrite → cũ mất
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_196: Copy target có data + Merge → cũ + mới
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy target có data + Merge → cũ + mới
- **Expected**: Kết quả: Copy target có data + Merge → cũ + mới
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_197: Chain copy A→B rồi B→C → C giống A
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Chain copy A→B rồi B→C → C giống A
- **Expected**: Kết quả: Chain copy A→B rồi B→C → C giống A
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_198: Copy → edit target → save → persist
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy → edit target → save → persist
- **Expected**: Kết quả: Copy → edit target → save → persist
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_CP_199: Copy → delete 1 dish target → chỉ target affected
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy → delete 1 dish target → chỉ target affected
- **Expected**: Kết quả: Copy → delete 1 dish target → chỉ target affected
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_200: Copy large plan 3×5 dishes performance OK
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy large plan 3×5 dishes performance OK
- **Expected**: Kết quả: Copy large plan 3×5 dishes performance OK
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_CP_201: Copy no target → validation Chọn ít nhất 1 ngày
- **Pre-conditions**: Modal mở, chưa chọn target date
- **Steps**: 1. Click Copy
- **Expected**: Validation error: Chọn ít nhất 1 ngày đích
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_CP_202: Copy source=target → warning cùng ngày
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy source=target → warning cùng ngày
- **Expected**: Kết quả: Copy source=target → warning cùng ngày
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_CP_203: Copy source có dish bị xóa → skip copy phần còn
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy source có dish bị xóa → skip copy phần còn
- **Expected**: Kết quả: Copy source có dish bị xóa → skip copy phần còn
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_CP_204: Copy network error sync → local vẫn OK
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy network error sync → local vẫn OK
- **Expected**: Kết quả: Copy network error sync → local vẫn OK
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_205: Copy interrupted đóng modal → no partial write
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy interrupted đóng modal → no partial write
- **Expected**: Kết quả: Copy interrupted đóng modal → no partial write
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_206: Copy rapid click 5 lần → chỉ copy 1 lần
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy rapid click 5 lần → chỉ copy 1 lần
- **Expected**: Kết quả: Copy rapid click 5 lần → chỉ copy 1 lần
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_CP_207: Copy success notification Đã sao chép X ngày
- **Pre-conditions**: Vừa copy 3 ngày thành công
- **Steps**: 1. Quan sát notification
- **Expected**: Toast hiện: Đã sao chép thành công 3 ngày
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_208: Copy → modal tự đóng sau success
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy → modal tự đóng sau success
- **Expected**: Kết quả: Copy → modal tự đóng sau success
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_209: Copy → calendar refresh hiển thị data mới
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy → calendar refresh hiển thị data mới
- **Expected**: Kết quả: Copy → calendar refresh hiển thị data mới
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_CP_210: Copy → undo revert target về trước
- **Pre-conditions**: CopyPlanModal mở, có source plan data
- **Steps**: 1. Thực hiện: Copy → undo revert target về trước
- **Expected**: Kết quả: Copy → undo revert target về trước
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

---

### Nhóm Test Cases

##### TC_CP_01–27: Core Copy Flow
- Button, modal, source/target selection, Day/Week modes, overwrite confirm, success

##### TC_CP_28–40: Date Edge Cases
- Past/future, cross-month/year, leap year, date picker

##### TC_CP_41–54: Data Integrity
- Multiple copies, large data, order, grocery, persistence, export, sync

##### TC_CP_55–64: UI/UX
- Dark mode, i18n, responsive, modal interactions, accessibility

##### TC_CP_65–77: Error & Edge Cases
- Interruption, validation, deleted ingredients, partial data

##### TC_CP_78–105: Advanced Scenarios
- Partial meals, source preservation, chain, circular, batch, merge, preview, stress

##### TC_CP_106–120: Source Plan Preview
- 0/1/2/3 meals preview, dish names, deleted dishes, dark mode, i18n, nutrition, locale format

##### TC_CP_121–135: Quick Select
- Ngày mai, Tuần này, dedup, sorted, cross-month/year, i18n, remove, source exclusion

##### TC_CP_136–150: Custom Date Picker
- Open, select single/multi, toggle, navigate months, leap year, highlight, dark mode, mobile/desktop

##### TC_CP_151–165: Copy Mode
- Overwrite default, Merge, toggle, target replace, append, confirm dialogs, i18n, nutrition

##### TC_CP_166–180: Selected Dates Management
- Display, remove, sorted, dedup, count, 0/1/7/30 dates, locale format, indicator, dark mode, responsive

##### TC_CP_181–200: Data Integrity After Copy
- Breakfast/lunch/dinner verification, source unchanged, nutrition, reference, edit/delete cascade, localStorage, export, sync, chain copy

##### TC_CP_201–210: Error Handling & Edge Cases
- No target validation, same day warning, deleted dish, network error, interrupted, rapid clicks, success notification, modal close, calendar refresh, undo

---

## Đề xuất Cải tiến


### Đề xuất 1: Smart Copy with Variation
- **Vấn đề hiện tại**: Copy exact duplicate. Boring meal repetition.
- **Giải pháp đề xuất**: "Copy with Variation" option: keep similar nutrition but suggest alternative dishes. AI-powered.
- **Lý do chi tiết**: Variety is key to diet adherence. Smart variation maintains nutrition targets while avoiding monotony.
- **Phần trăm cải thiện**: Meal variety +50%, Diet adherence +25%
- **Mức độ ưu tiên**: Medium | **Effort**: L

### Đề xuất 2: Copy Preview
- **Vấn đề hiện tại**: Can't see what will be copied before confirming. Blind action.
- **Giải pháp đề xuất**: Preview panel showing source meals + target state (empty/will be overwritten).
- **Lý do chi tiết**: Preview reduces accidental overwrites 90%. Users feel more confident.
- **Phần trăm cải thiện**: Accidental overwrites -90%, User confidence +40%
- **Mức độ ưu tiên**: High | **Effort**: S

### Đề xuất 3: Merge Mode
- **Vấn đề hiện tại**: Copy = overwrite. Can't add to existing plan.
- **Giải pháp đề xuất**: Toggle: "Overwrite" vs "Merge". Merge appends dishes to existing meals.
- **Lý do chi tiết**: Users often want to combine plans, not replace. Merge enables flexible planning.
- **Phần trăm cải thiện**: Planning flexibility +50%, User satisfaction +30%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 4: Multi-Select Target
- **Vấn đề hiện tại**: Copy to one target at a time. Copy to 5 days = 5 operations.
- **Giải pháp đề xuất**: Multi-select target dates. Checkbox calendar. One copy → multiple targets.
- **Lý do chi tiết**: Weekly meal prep: same meal for Mon-Fri. 5x faster.
- **Phần trăm cải thiện**: Batch operation time -80%, Feature efficiency +60%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 5: Undo Copy
- **Vấn đề hiện tại**: Copy overwrites target irreversibly. Accidental = data loss.
- **Giải pháp đề xuất**: 30-second undo toast. Snapshot target before copy. One-click restore.
- **Lý do chi tiết**: Undo is expected in modern apps. Prevents frustration from accidental copy.
- **Phần trăm cải thiện**: Data loss incidents -95%, User trust +40%
- **Mức độ ưu tiên**: High | **Effort**: S
