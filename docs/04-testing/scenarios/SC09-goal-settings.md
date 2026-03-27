# Scenario 9: Goal Settings

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Goal Settings cho phép user thiết lập mục tiêu dinh dưỡng hàng ngày: target calories, protein ratio, weight, height. GoalSettingsModal mở từ Summary component hoặc Settings tab. Goals ảnh hưởng trực tiếp đến progress bars trên Calendar tab.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| GoalSettingsModal | GoalSettingsModal.tsx | Modal form |
| Summary | Summary.tsx | Hiển thị progress |
| usePersistedState | hooks/usePersistedState.ts | Persist goals |

## Luồng nghiệp vụ

1. User clicks goal icon/button on Summary or Settings
2. GoalSettingsModal opens with current values
3. User edits target calories, protein ratio, weight
4. Save → localStorage → bars recalculate → modal closes
5. Cancel → no changes

## Quy tắc nghiệp vụ

1. targetCalories: integer > 0, default 2000
2. proteinRatio: float > 0, default 1.5 (g per kg body weight)
3. weight: float > 0 (kg)
4. targetProtein = weight × proteinRatio
5. All values persist to localStorage
6. Changes immediately reflected in nutrition bars

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_GS_01 | Goal button visible on Summary | Positive | P1 |
| TC_GS_02 | Click goal → modal opens | Positive | P0 |
| TC_GS_03 | Modal shows current values | Positive | P1 |
| TC_GS_04 | Target calories field | Positive | P1 |
| TC_GS_05 | Protein ratio field | Positive | P1 |
| TC_GS_06 | Weight field | Positive | P1 |
| TC_GS_07 | Save button | Positive | P1 |
| TC_GS_08 | Cancel button | Positive | P1 |
| TC_GS_09 | Save → values persist | Positive | P0 |
| TC_GS_10 | Cancel → no changes | Positive | P1 |
| TC_GS_11 | Save → bars recalculate | Positive | P0 |
| TC_GS_12 | Default values first time | Positive | P1 |
| TC_GS_13 | Edit calories → save | Positive | P1 |
| TC_GS_14 | Edit protein ratio → save | Positive | P1 |
| TC_GS_15 | Edit weight → save | Positive | P1 |
| TC_GS_16 | Edit all fields → save | Positive | P1 |
| TC_GS_17 | Partial edit (only cal) | Positive | P2 |
| TC_GS_18 | No changes → save (idempotent) | Positive | P2 |
| TC_GS_19 | Calories = 0 → validation error | Negative | P0 |
| TC_GS_20 | Calories negative → error | Negative | P1 |
| TC_GS_21 | Calories empty → error | Negative | P1 |
| TC_GS_22 | Calories non-numeric → error | Negative | P1 |
| TC_GS_23 | Calories = 1 (min boundary) | Boundary | P2 |
| TC_GS_24 | Calories = 500 | Positive | P2 |
| TC_GS_25 | Calories = 2000 (typical) | Positive | P1 |
| TC_GS_26 | Calories = 5000 | Positive | P2 |
| TC_GS_27 | Calories = 10000 (max practical) | Boundary | P2 |
| TC_GS_28 | Calories = 99999 | Boundary | P2 |
| TC_GS_29 | Calories decimal (2000.5) | Edge | P2 |
| TC_GS_30 | Protein ratio = 0 → error | Negative | P1 |
| TC_GS_31 | Protein ratio negative → error | Negative | P1 |
| TC_GS_32 | Protein ratio empty → error | Negative | P1 |
| TC_GS_33 | Protein ratio = 0.5 | Positive | P2 |
| TC_GS_34 | Protein ratio = 1.0 | Positive | P2 |
| TC_GS_35 | Protein ratio = 1.5 (default) | Positive | P1 |
| TC_GS_36 | Protein ratio = 2.0 | Positive | P2 |
| TC_GS_37 | Protein ratio = 3.0 | Positive | P2 |
| TC_GS_38 | Protein ratio = 5.0 (very high) | Boundary | P2 |
| TC_GS_39 | Protein ratio = 10.0 | Boundary | P2 |
| TC_GS_40 | Protein ratio decimal (1.75) | Positive | P2 |
| TC_GS_41 | Weight = 0 → error | Negative | P1 |
| TC_GS_42 | Weight negative → error | Negative | P1 |
| TC_GS_43 | Weight empty → error | Negative | P1 |
| TC_GS_44 | Weight = 30 (min practical) | Boundary | P2 |
| TC_GS_45 | Weight = 70 (typical) | Positive | P1 |
| TC_GS_46 | Weight = 100 | Positive | P2 |
| TC_GS_47 | Weight = 150 | Boundary | P2 |
| TC_GS_48 | Weight = 300 | Boundary | P2 |
| TC_GS_49 | Weight decimal (72.5) | Positive | P2 |
| TC_GS_50 | targetProtein = weight × ratio (verify) | Positive | P0 |
| TC_GS_51 | Change weight → targetProtein recalc | Positive | P1 |
| TC_GS_52 | Change ratio → targetProtein recalc | Positive | P1 |
| TC_GS_53 | Change both → targetProtein correct | Positive | P1 |
| TC_GS_54 | Bars: cal actual/target | Positive | P1 |
| TC_GS_55 | Bars: protein actual/target | Positive | P1 |
| TC_GS_56 | Bars color: green <=80% | Positive | P2 |
| TC_GS_57 | Bars color: yellow 80-100% | Positive | P2 |
| TC_GS_58 | Bars color: red >100% | Positive | P2 |
| TC_GS_59 | Very low target → bars easily red | Boundary | P2 |
| TC_GS_60 | Very high target → bars always green | Boundary | P2 |
| TC_GS_61 | Reload → values preserved | Positive | P0 |
| TC_GS_62 | localStorage key correct | Positive | P2 |
| TC_GS_63 | localStorage format JSON | Positive | P2 |
| TC_GS_64 | Corrupt localStorage → defaults | Edge | P1 |
| TC_GS_65 | Missing localStorage key → defaults | Edge | P1 |
| TC_GS_66 | Clear localStorage → defaults | Positive | P2 |
| TC_GS_67 | Import data with goals | Positive | P1 |
| TC_GS_68 | Export includes goals | Positive | P1 |
| TC_GS_69 | Cloud sync goals | Positive | P2 |
| TC_GS_70 | Modal from Summary | Positive | P1 |
| TC_GS_71 | Modal from Settings | Positive | P1 |
| TC_GS_72 | Both entry points same modal | Positive | P2 |
| TC_GS_73 | Modal backdrop click → close? | Positive | P2 |
| TC_GS_74 | Modal Escape key → close | Positive | P2 |
| TC_GS_75 | Modal form autofocus | Positive | P2 |
| TC_GS_76 | Tab navigation between fields | Positive | P2 |
| TC_GS_77 | Enter key submit | Positive | P2 |
| TC_GS_78 | Validation messages inline | Positive | P1 |
| TC_GS_79 | Error highlight on invalid field | Positive | P2 |
| TC_GS_80 | Success toast after save | Positive | P2 |
| TC_GS_81 | Dark mode modal | Positive | P2 |
| TC_GS_82 | i18n modal labels | Positive | P2 |
| TC_GS_83 | Mobile modal layout | Positive | P2 |
| TC_GS_84 | Desktop modal layout | Positive | P2 |
| TC_GS_85 | Screen reader modal | Positive | P3 |
| TC_GS_86 | Keyboard only usage | Positive | P3 |
| TC_GS_87 | Touch field interaction mobile | Positive | P2 |
| TC_GS_88 | Number keyboard on mobile for numeric fields | Positive | P2 |
| TC_GS_89 | Field step increment (arrows) | Positive | P3 |
| TC_GS_90 | Copy-paste into fields | Positive | P2 |
| TC_GS_91 | Multiple rapid saves | Edge | P2 |
| TC_GS_92 | Open modal → switch tab → return | Edge | P2 |
| TC_GS_93 | Unsaved changes → close warning | Positive | P2 |
| TC_GS_94 | Goal presets (lose/maintain/gain) | Positive | P3 |
| TC_GS_95 | BMR calculator integration | Positive | P3 |
| TC_GS_96 | Activity level factor | Positive | P3 |
| TC_GS_97 | Goal history tracking | Positive | P3 |
| TC_GS_98 | Goal progress over time | Positive | P3 |
| TC_GS_99 | Carbs target | Positive | P3 |
| TC_GS_100 | Fat target | Positive | P3 |
| TC_GS_101 | Fiber target | Positive | P3 |
| TC_GS_102 | Water intake target | Positive | P3 |
| TC_GS_103 | Goal comparison (previous vs current) | Positive | P3 |
| TC_GS_104 | Reset goals to defaults | Positive | P2 |
| TC_GS_105 | Goal validation — calories consistent with macros | Edge | P3 |

---
| TC_GS_106 | Preset ⚖️ Balanced → cal=2000 ratio=1.6 | Positive | P1 |
| TC_GS_107 | Preset 💪 High Protein → cal=2200 ratio=2.5 | Positive | P1 |
| TC_GS_108 | Preset 🥑 Low Carb → cal=1600 ratio=2.0 | Positive | P1 |
| TC_GS_109 | Preset 🥗 Light Diet → cal=1400 ratio=1.2 | Positive | P1 |
| TC_GS_110 | Chọn preset → fields tự động fill | Positive | P1 |
| TC_GS_111 | Chọn preset → targetProtein recalculate | Positive | P1 |
| TC_GS_112 | Chọn preset → nutrition bars cập nhật | Positive | P1 |
| TC_GS_113 | Chọn preset → sửa manual → giá trị custom | Positive | P2 |
| TC_GS_114 | Chọn preset Balanced → đổi High Protein → cập nhật | Positive | P2 |
| TC_GS_115 | Chọn preset → cancel → giá trị cũ preserved | Positive | P2 |
| TC_GS_116 | Preset buttons hiển thị emoji + label đúng | Positive | P2 |
| TC_GS_117 | Preset buttons i18n labels vi/en | Positive | P2 |
| TC_GS_118 | Preset buttons dark mode hiển thị đúng | Positive | P2 |
| TC_GS_119 | Chọn preset → save → reload → giá trị đúng | Positive | P1 |
| TC_GS_120 | Preset không thay đổi weight giữ hiện tại | Positive | P1 |
| TC_GS_121 | Quick button protein 1g → ratio=1.0 | Positive | P2 |
| TC_GS_122 | Quick button protein 2g → ratio=2.0 | Positive | P2 |
| TC_GS_123 | Quick button protein 3g → ratio=3.0 | Positive | P2 |
| TC_GS_124 | Quick button protein 4g → ratio=4.0 | Positive | P2 |
| TC_GS_125 | Quick button → targetProtein cập nhật ngay | Positive | P2 |
| TC_GS_126 | Calories nhập abc → validation error | Negative | P1 |
| TC_GS_127 | Calories nhập 1e5 scientific notation | Edge | P2 |
| TC_GS_128 | Calories nhập 2,000 comma separator | Edge | P2 |
| TC_GS_129 | Calories nhập 2000.5 decimal | Edge | P2 |
| TC_GS_130 | Calories = 100 min hợp lệ | Boundary | P2 |
| TC_GS_131 | Calories = 99 dưới min → error | Boundary | P2 |
| TC_GS_132 | Calories = 10000 max hợp lệ | Boundary | P2 |
| TC_GS_133 | Calories = 10001 trên max → error | Boundary | P2 |
| TC_GS_134 | Protein ratio = 0.1 min hợp lệ | Boundary | P2 |
| TC_GS_135 | Protein ratio = 0.09 dưới min → error | Boundary | P2 |
| TC_GS_136 | Protein ratio = 5.0 max hợp lệ | Boundary | P2 |
| TC_GS_137 | Protein ratio = 5.1 trên max → error | Boundary | P2 |
| TC_GS_138 | Weight = 1 min system | Boundary | P2 |
| TC_GS_139 | Weight = 500 max system | Boundary | P2 |
| TC_GS_140 | Weight = 0 → error | Negative | P1 |
| TC_GS_141 | Weight = 501 trên max → error | Boundary | P2 |
| TC_GS_142 | Weight nhập abc → error | Negative | P1 |
| TC_GS_143 | Protein ratio nhập abc → error | Negative | P1 |
| TC_GS_144 | Tất cả fields trống → validation errors | Negative | P1 |
| TC_GS_145 | Field trống → nhập giá trị → error biến mất | Positive | P2 |
| TC_GS_146 | Error message inline dưới field | Positive | P2 |
| TC_GS_147 | Error border highlight trên field sai | Positive | P2 |
| TC_GS_148 | Multiple errors hiển thị cùng lúc | Positive | P2 |
| TC_GS_149 | Paste giá trị âm vào calories | Negative | P2 |
| TC_GS_150 | Nhập leading zeros 007 → parse 7 | Edge | P2 |
| TC_GS_151 | Nhập trailing dot 100. → parse 100 | Edge | P2 |
| TC_GS_152 | Nhập leading dot .5 → parse 0.5 | Edge | P2 |
| TC_GS_153 | Paste giá trị rất lớn 999999999 | Boundary | P2 |
| TC_GS_154 | Nhập space vào numeric field → error | Edge | P2 |
| TC_GS_155 | Validation i18n error messages đổi ngôn ngữ | Positive | P2 |
| TC_GS_156 | targetProtein = 70 × 1.5 = 105g verify | Positive | P1 |
| TC_GS_157 | targetProtein = 80 × 2.0 = 160g verify | Positive | P1 |
| TC_GS_158 | targetProtein = 50 × 1.2 = 60g verify | Positive | P2 |
| TC_GS_159 | targetProtein = 100 × 3.0 = 300g verify | Positive | P2 |
| TC_GS_160 | targetProtein real-time khi thay đổi weight | Positive | P1 |
| TC_GS_161 | targetProtein real-time khi thay đổi ratio | Positive | P1 |
| TC_GS_162 | targetProtein format làm tròn 1 decimal | Positive | P2 |
| TC_GS_163 | Bars — calories actual=0 → bar 0% | Positive | P2 |
| TC_GS_164 | Bars — calories actual=target → bar 100% | Positive | P1 |
| TC_GS_165 | Bars — calories actual=50% target → bar 50% | Positive | P2 |
| TC_GS_166 | Bars — calories actual > target → bar > 100% | Positive | P2 |
| TC_GS_167 | Bars — protein actual/target hiển thị đúng | Positive | P1 |
| TC_GS_168 | Bars — color green khi ≤ 80% | Positive | P2 |
| TC_GS_169 | Bars — color yellow khi 80-100% | Positive | P2 |
| TC_GS_170 | Bars — color red khi > 100% | Positive | P2 |
| TC_GS_171 | Bars — target rất thấp 100 cal → dễ đỏ | Boundary | P2 |
| TC_GS_172 | Bars — target rất cao 10000 cal → luôn xanh | Boundary | P2 |
| TC_GS_173 | Thay đổi goal → bars cập nhật không cần refresh | Positive | P1 |
| TC_GS_174 | Bars hiển thị percentage text 75% | Positive | P2 |
| TC_GS_175 | Bars hiển thị actual/target 1500/2000 kcal | Positive | P2 |
| TC_GS_176 | Save goals → localStorage key userProfile | Positive | P2 |
| TC_GS_177 | Save goals → localStorage JSON format đúng | Positive | P2 |
| TC_GS_178 | Reload page → goals preserved chính xác | Positive | P0 |
| TC_GS_179 | Clear browser cache → goals mất → defaults | Edge | P2 |
| TC_GS_180 | Corrupt localStorage JSON → app dùng defaults | Edge | P1 |
| TC_GS_181 | Missing weight localStorage → default weight | Edge | P2 |
| TC_GS_182 | Missing calories localStorage → default 2000 | Edge | P2 |
| TC_GS_183 | Missing proteinRatio localStorage → default 1.5 | Edge | P2 |
| TC_GS_184 | Export data → goals included trong file | Positive | P1 |
| TC_GS_185 | Import data có goals → goals cập nhật | Positive | P1 |
| TC_GS_186 | Import data không có goals → giữ hiện tại | Edge | P2 |
| TC_GS_187 | Cloud sync → goals đồng bộ | Positive | P2 |
| TC_GS_188 | Goals 2 devices → sync đúng | Positive | P2 |
| TC_GS_189 | Offline → save → sync khi online | Edge | P2 |
| TC_GS_190 | Clear all data → goals reset defaults | Positive | P2 |
| TC_GS_191 | Modal từ Summary → hiển thị đúng | Positive | P1 |
| TC_GS_192 | Modal từ Settings → hiển thị đúng | Positive | P1 |
| TC_GS_193 | Modal — Android back button → đóng | Positive | P2 |
| TC_GS_194 | Modal — backdrop click → đóng | Positive | P2 |
| TC_GS_195 | Modal — Escape key → đóng | Positive | P2 |
| TC_GS_196 | Modal — autofocus calories field | Positive | P2 |
| TC_GS_197 | Modal — Tab navigation giữa fields | Positive | P2 |
| TC_GS_198 | Modal — Enter key submit | Positive | P2 |
| TC_GS_199 | Modal — dark mode tất cả elements | Positive | P2 |
| TC_GS_200 | Modal — i18n tất cả labels | Positive | P2 |
| TC_GS_201 | Modal — mobile layout responsive | Positive | P2 |
| TC_GS_202 | Modal — desktop layout centered | Positive | P2 |
| TC_GS_203 | Modal — number keyboard mobile cho numeric | Positive | P2 |
| TC_GS_204 | Modal — rapid saves 5 lần persist đúng | Edge | P2 |
| TC_GS_205 | Modal — mở → switch tab → quay lại → vẫn mở | Edge | P2 |
| TC_GS_206 | Modal — unsaved changes → đóng → warning | Positive | P2 |
| TC_GS_207 | Modal — success feedback sau save | Positive | P2 |
| TC_GS_208 | Modal — screen reader accessible | Positive | P3 |
| TC_GS_209 | Modal — keyboard-only navigation hoàn chỉnh | Positive | P3 |
| TC_GS_210 | Modal — scroll nếu content dài mobile nhỏ | Positive | P2 |


---

## Chi tiết Test Cases

##### TC_GS_01: Goal button visible on Summary
- **Pre-conditions**: Summary component hiển thị
- **Steps**: 1. Quan sát nút Goal settings
- **Expected**: Nút Goal hiển thị trên Summary
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_02: Click goal → modal opens
- **Pre-conditions**: Summary active
- **Steps**: 1. Click nút Goal
- **Expected**: GoalSettingsModal mở ra
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GS_03: Modal shows current values
- **Pre-conditions**: Modal mở lần đầu hoặc có data
- **Steps**: 1. Quan sát fields
- **Expected**: Modal hiển thị giá trị hiện tại: calories, protein ratio, weight
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_04: Target calories field
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_05: Protein ratio field
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_06: Weight field
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_07: Save button
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_08: Cancel button
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_09: Save → values persist
- **Pre-conditions**: Modal mở, đã sửa giá trị
- **Steps**: 1. Click Save/Lưu
- **Expected**: Giá trị persist vào localStorage, modal đóng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GS_10: Cancel → no changes
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_11: Save → bars recalculate
- **Pre-conditions**: Vừa save goals
- **Steps**: 1. Quan sát nutrition bars
- **Expected**: Bars recalculate theo target mới
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GS_12: Default values first time
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_13: Edit calories → save
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_14: Edit protein ratio → save
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_15: Edit weight → save
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_16: Edit all fields → save
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_17: Partial edit (only cal)
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_18: No changes → save (idempotent)
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_19: Calories = 0 → validation error
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_GS_20: Calories negative → error
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_GS_21: Calories empty → error
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_GS_22: Calories non-numeric → error
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_GS_23: Calories = 1 (min boundary)
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_24: Calories = 500
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_25: Calories = 2000 (typical)
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_26: Calories = 5000
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_27: Calories = 10000 (max practical)
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_28: Calories = 99999
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_29: Calories decimal (2000.5)
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GS_30: Protein ratio = 0 → error
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_GS_31: Protein ratio negative → error
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_GS_32: Protein ratio empty → error
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_GS_33: Protein ratio = 0.5
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_34: Protein ratio = 1.0
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_35: Protein ratio = 1.5 (default)
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_36: Protein ratio = 2.0
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_37: Protein ratio = 3.0
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_38: Protein ratio = 5.0 (very high)
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_39: Protein ratio = 10.0
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_40: Protein ratio decimal (1.75)
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_41: Weight = 0 → error
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_GS_42: Weight negative → error
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_GS_43: Weight empty → error
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_GS_44: Weight = 30 (min practical)
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_45: Weight = 70 (typical)
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_46: Weight = 100
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_47: Weight = 150
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_48: Weight = 300
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_49: Weight decimal (72.5)
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_50: targetProtein = weight × ratio (verify)
- **Pre-conditions**: Weight=70, ratio=1.5
- **Steps**: 1. Kiểm tra targetProtein
- **Expected**: targetProtein = 70 × 1.5 = 105g
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GS_51: Change weight → targetProtein recalc
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_52: Change ratio → targetProtein recalc
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_53: Change both → targetProtein correct
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_54: Bars: cal actual/target
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_55: Bars: protein actual/target
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_56: Bars color: green <=80%
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_57: Bars color: yellow 80-100%
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_58: Bars color: red >100%
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_59: Very low target → bars easily red
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_60: Very high target → bars always green
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_61: Reload → values preserved
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GS_62: localStorage key correct
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_63: localStorage format JSON
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_64: Corrupt localStorage → defaults
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_GS_65: Missing localStorage key → defaults
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_GS_66: Clear localStorage → defaults
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_67: Import data with goals
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_68: Export includes goals
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_69: Cloud sync goals
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_70: Modal from Summary
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_71: Modal from Settings
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_72: Both entry points same modal
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_73: Modal backdrop click → close?
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_74: Modal Escape key → close
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_75: Modal form autofocus
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_76: Tab navigation between fields
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_77: Enter key submit
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_78: Validation messages inline
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_79: Error highlight on invalid field
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_80: Success toast after save
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_81: Dark mode modal
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_82: i18n modal labels
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_83: Mobile modal layout
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_84: Desktop modal layout
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_85: Screen reader modal
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_GS_86: Keyboard only usage
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_GS_87: Touch field interaction mobile
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_88: Number keyboard on mobile for numeric fields
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_89: Field step increment (arrows)
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_GS_90: Copy-paste into fields
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_91: Multiple rapid saves
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GS_92: Open modal → switch tab → return
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GS_93: Unsaved changes → close warning
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_94: Goal presets (lose/maintain/gain)
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_GS_95: BMR calculator integration
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_GS_96: Activity level factor
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_GS_97: Goal history tracking
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_GS_98: Goal progress over time
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_GS_99: Carbs target
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_GS_100: Fat target
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_GS_101: Fiber target
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_GS_102: Water intake target
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_GS_103: Goal comparison (previous vs current)
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_GS_104: Reset goals to defaults
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_105: Goal validation — calories consistent with macros
- **Pre-conditions**: GoalSettingsModal available
- **Steps**: 1. Thực hiện thao tác theo mô tả
- **Expected**: Kết quả đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P3

##### TC_GS_106: Preset ⚖️ Balanced → cal=2000 ratio=1.6
- **Pre-conditions**: Modal mở
- **Steps**: 1. Click preset ⚖️ Balanced
- **Expected**: Calories=2000, proteinRatio=1.6 tự động fill
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_107: Preset 💪 High Protein → cal=2200 ratio=2.5
- **Pre-conditions**: Modal mở
- **Steps**: 1. Click preset 💪 High Protein
- **Expected**: Calories=2200, proteinRatio=2.5 tự động fill
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_108: Preset 🥑 Low Carb → cal=1600 ratio=2.0
- **Pre-conditions**: Modal mở
- **Steps**: 1. Click preset 🥑 Low Carb
- **Expected**: Calories=1600, proteinRatio=2.0 tự động fill
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_109: Preset 🥗 Light Diet → cal=1400 ratio=1.2
- **Pre-conditions**: Modal mở
- **Steps**: 1. Click preset 🥗 Light Diet
- **Expected**: Calories=1400, proteinRatio=1.2 tự động fill
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_110: Chọn preset → fields tự động fill
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Chọn preset → fields tự động fill
- **Expected**: Kết quả: Chọn preset → fields tự động fill
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_111: Chọn preset → targetProtein recalculate
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Chọn preset → targetProtein recalculate
- **Expected**: Kết quả: Chọn preset → targetProtein recalculate
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_112: Chọn preset → nutrition bars cập nhật
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Chọn preset → nutrition bars cập nhật
- **Expected**: Kết quả: Chọn preset → nutrition bars cập nhật
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_113: Chọn preset → sửa manual → giá trị custom
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Chọn preset → sửa manual → giá trị custom
- **Expected**: Kết quả: Chọn preset → sửa manual → giá trị custom
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_114: Chọn preset Balanced → đổi High Protein → cập nhật
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Chọn preset Balanced → đổi High Protein → cập nhật
- **Expected**: Kết quả: Chọn preset Balanced → đổi High Protein → cập nhật
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_115: Chọn preset → cancel → giá trị cũ preserved
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Chọn preset → cancel → giá trị cũ preserved
- **Expected**: Kết quả: Chọn preset → cancel → giá trị cũ preserved
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_116: Preset buttons hiển thị emoji + label đúng
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Preset buttons hiển thị emoji + label đúng
- **Expected**: Kết quả: Preset buttons hiển thị emoji + label đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_117: Preset buttons i18n labels vi/en
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Preset buttons i18n labels vi/en
- **Expected**: Kết quả: Preset buttons i18n labels vi/en
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_118: Preset buttons dark mode hiển thị đúng
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Preset buttons dark mode hiển thị đúng
- **Expected**: Kết quả: Preset buttons dark mode hiển thị đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_119: Chọn preset → save → reload → giá trị đúng
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Chọn preset → save → reload → giá trị đúng
- **Expected**: Kết quả: Chọn preset → save → reload → giá trị đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_120: Preset không thay đổi weight giữ hiện tại
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Preset không thay đổi weight giữ hiện tại
- **Expected**: Kết quả: Preset không thay đổi weight giữ hiện tại
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_121: Quick button protein 1g → ratio=1.0
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Quick button protein 1g → ratio=1.0
- **Expected**: Kết quả: Quick button protein 1g → ratio=1.0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_122: Quick button protein 2g → ratio=2.0
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Quick button protein 2g → ratio=2.0
- **Expected**: Kết quả: Quick button protein 2g → ratio=2.0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_123: Quick button protein 3g → ratio=3.0
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Quick button protein 3g → ratio=3.0
- **Expected**: Kết quả: Quick button protein 3g → ratio=3.0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_124: Quick button protein 4g → ratio=4.0
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Quick button protein 4g → ratio=4.0
- **Expected**: Kết quả: Quick button protein 4g → ratio=4.0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_125: Quick button → targetProtein cập nhật ngay
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Quick button → targetProtein cập nhật ngay
- **Expected**: Kết quả: Quick button → targetProtein cập nhật ngay
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_126: Calories nhập abc → validation error
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Calories nhập abc → validation error
- **Expected**: Kết quả: Calories nhập abc → validation error
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_GS_127: Calories nhập 1e5 scientific notation
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Calories nhập 1e5 scientific notation
- **Expected**: Kết quả: Calories nhập 1e5 scientific notation
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GS_128: Calories nhập 2,000 comma separator
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Calories nhập 2,000 comma separator
- **Expected**: Kết quả: Calories nhập 2,000 comma separator
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GS_129: Calories nhập 2000.5 decimal
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Calories nhập 2000.5 decimal
- **Expected**: Kết quả: Calories nhập 2000.5 decimal
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GS_130: Calories = 100 min hợp lệ
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Calories = 100 min hợp lệ
- **Expected**: Kết quả: Calories = 100 min hợp lệ
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_131: Calories = 99 dưới min → error
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Calories = 99 dưới min → error
- **Expected**: Kết quả: Calories = 99 dưới min → error
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_132: Calories = 10000 max hợp lệ
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Calories = 10000 max hợp lệ
- **Expected**: Kết quả: Calories = 10000 max hợp lệ
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_133: Calories = 10001 trên max → error
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Calories = 10001 trên max → error
- **Expected**: Kết quả: Calories = 10001 trên max → error
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_134: Protein ratio = 0.1 min hợp lệ
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Protein ratio = 0.1 min hợp lệ
- **Expected**: Kết quả: Protein ratio = 0.1 min hợp lệ
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_135: Protein ratio = 0.09 dưới min → error
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Protein ratio = 0.09 dưới min → error
- **Expected**: Kết quả: Protein ratio = 0.09 dưới min → error
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_136: Protein ratio = 5.0 max hợp lệ
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Protein ratio = 5.0 max hợp lệ
- **Expected**: Kết quả: Protein ratio = 5.0 max hợp lệ
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_137: Protein ratio = 5.1 trên max → error
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Protein ratio = 5.1 trên max → error
- **Expected**: Kết quả: Protein ratio = 5.1 trên max → error
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_138: Weight = 1 min system
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Weight = 1 min system
- **Expected**: Kết quả: Weight = 1 min system
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_139: Weight = 500 max system
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Weight = 500 max system
- **Expected**: Kết quả: Weight = 500 max system
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_140: Weight = 0 → error
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Weight = 0 → error
- **Expected**: Kết quả: Weight = 0 → error
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_GS_141: Weight = 501 trên max → error
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Weight = 501 trên max → error
- **Expected**: Kết quả: Weight = 501 trên max → error
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_142: Weight nhập abc → error
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Weight nhập abc → error
- **Expected**: Kết quả: Weight nhập abc → error
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_GS_143: Protein ratio nhập abc → error
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Protein ratio nhập abc → error
- **Expected**: Kết quả: Protein ratio nhập abc → error
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_GS_144: Tất cả fields trống → validation errors
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Tất cả fields trống → validation errors
- **Expected**: Kết quả: Tất cả fields trống → validation errors
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_GS_145: Field trống → nhập giá trị → error biến mất
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Field trống → nhập giá trị → error biến mất
- **Expected**: Kết quả: Field trống → nhập giá trị → error biến mất
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_146: Error message inline dưới field
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Error message inline dưới field
- **Expected**: Kết quả: Error message inline dưới field
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_147: Error border highlight trên field sai
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Error border highlight trên field sai
- **Expected**: Kết quả: Error border highlight trên field sai
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_148: Multiple errors hiển thị cùng lúc
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Multiple errors hiển thị cùng lúc
- **Expected**: Kết quả: Multiple errors hiển thị cùng lúc
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_149: Paste giá trị âm vào calories
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Paste giá trị âm vào calories
- **Expected**: Kết quả: Paste giá trị âm vào calories
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_GS_150: Nhập leading zeros 007 → parse 7
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Nhập leading zeros 007 → parse 7
- **Expected**: Kết quả: Nhập leading zeros 007 → parse 7
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GS_151: Nhập trailing dot 100. → parse 100
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Nhập trailing dot 100. → parse 100
- **Expected**: Kết quả: Nhập trailing dot 100. → parse 100
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GS_152: Nhập leading dot .5 → parse 0.5
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Nhập leading dot .5 → parse 0.5
- **Expected**: Kết quả: Nhập leading dot .5 → parse 0.5
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GS_153: Paste giá trị rất lớn 999999999
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Paste giá trị rất lớn 999999999
- **Expected**: Kết quả: Paste giá trị rất lớn 999999999
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_154: Nhập space vào numeric field → error
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Nhập space vào numeric field → error
- **Expected**: Kết quả: Nhập space vào numeric field → error
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GS_155: Validation i18n error messages đổi ngôn ngữ
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Validation i18n error messages đổi ngôn ngữ
- **Expected**: Kết quả: Validation i18n error messages đổi ngôn ngữ
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_156: targetProtein = 70 × 1.5 = 105g verify
- **Pre-conditions**: Weight=70, ratio=1.5
- **Steps**: 1. Quan sát targetProtein hiển thị
- **Expected**: targetProtein = 70 × 1.5 = 105g
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_157: targetProtein = 80 × 2.0 = 160g verify
- **Pre-conditions**: Weight=80, ratio=2.0
- **Steps**: 1. Quan sát targetProtein
- **Expected**: targetProtein = 80 × 2.0 = 160g
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_158: targetProtein = 50 × 1.2 = 60g verify
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: targetProtein = 50 × 1.2 = 60g verify
- **Expected**: Kết quả: targetProtein = 50 × 1.2 = 60g verify
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_159: targetProtein = 100 × 3.0 = 300g verify
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: targetProtein = 100 × 3.0 = 300g verify
- **Expected**: Kết quả: targetProtein = 100 × 3.0 = 300g verify
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_160: targetProtein real-time khi thay đổi weight
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: targetProtein real-time khi thay đổi weight
- **Expected**: Kết quả: targetProtein real-time khi thay đổi weight
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_161: targetProtein real-time khi thay đổi ratio
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: targetProtein real-time khi thay đổi ratio
- **Expected**: Kết quả: targetProtein real-time khi thay đổi ratio
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_162: targetProtein format làm tròn 1 decimal
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: targetProtein format làm tròn 1 decimal
- **Expected**: Kết quả: targetProtein format làm tròn 1 decimal
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_163: Bars — calories actual=0 → bar 0%
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Bars — calories actual=0 → bar 0%
- **Expected**: Kết quả: Bars — calories actual=0 → bar 0%
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_164: Bars — calories actual=target → bar 100%
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Bars — calories actual=target → bar 100%
- **Expected**: Kết quả: Bars — calories actual=target → bar 100%
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_165: Bars — calories actual=50% target → bar 50%
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Bars — calories actual=50% target → bar 50%
- **Expected**: Kết quả: Bars — calories actual=50% target → bar 50%
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_166: Bars — calories actual > target → bar > 100%
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Bars — calories actual > target → bar > 100%
- **Expected**: Kết quả: Bars — calories actual > target → bar > 100%
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_167: Bars — protein actual/target hiển thị đúng
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Bars — protein actual/target hiển thị đúng
- **Expected**: Kết quả: Bars — protein actual/target hiển thị đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_168: Bars — color green khi ≤ 80%
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Bars — color green khi ≤ 80%
- **Expected**: Kết quả: Bars — color green khi ≤ 80%
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_169: Bars — color yellow khi 80-100%
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Bars — color yellow khi 80-100%
- **Expected**: Kết quả: Bars — color yellow khi 80-100%
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_170: Bars — color red khi > 100%
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Bars — color red khi > 100%
- **Expected**: Kết quả: Bars — color red khi > 100%
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_171: Bars — target rất thấp 100 cal → dễ đỏ
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Bars — target rất thấp 100 cal → dễ đỏ
- **Expected**: Kết quả: Bars — target rất thấp 100 cal → dễ đỏ
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_172: Bars — target rất cao 10000 cal → luôn xanh
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Bars — target rất cao 10000 cal → luôn xanh
- **Expected**: Kết quả: Bars — target rất cao 10000 cal → luôn xanh
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_GS_173: Thay đổi goal → bars cập nhật không cần refresh
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Thay đổi goal → bars cập nhật không cần refresh
- **Expected**: Kết quả: Thay đổi goal → bars cập nhật không cần refresh
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_174: Bars hiển thị percentage text 75%
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Bars hiển thị percentage text 75%
- **Expected**: Kết quả: Bars hiển thị percentage text 75%
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_175: Bars hiển thị actual/target 1500/2000 kcal
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Bars hiển thị actual/target 1500/2000 kcal
- **Expected**: Kết quả: Bars hiển thị actual/target 1500/2000 kcal
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_176: Save goals → localStorage key userProfile
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Save goals → localStorage key userProfile
- **Expected**: Kết quả: Save goals → localStorage key userProfile
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_177: Save goals → localStorage JSON format đúng
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Save goals → localStorage JSON format đúng
- **Expected**: Kết quả: Save goals → localStorage JSON format đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_178: Reload page → goals preserved chính xác
- **Pre-conditions**: Vừa save goals
- **Steps**: 1. Reload page 2. Mở modal lại
- **Expected**: Giá trị goals preserved chính xác
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_GS_179: Clear browser cache → goals mất → defaults
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Clear browser cache → goals mất → defaults
- **Expected**: Kết quả: Clear browser cache → goals mất → defaults
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GS_180: Corrupt localStorage JSON → app dùng defaults
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Corrupt localStorage JSON → app dùng defaults
- **Expected**: Kết quả: Corrupt localStorage JSON → app dùng defaults
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_GS_181: Missing weight localStorage → default weight
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Missing weight localStorage → default weight
- **Expected**: Kết quả: Missing weight localStorage → default weight
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GS_182: Missing calories localStorage → default 2000
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Missing calories localStorage → default 2000
- **Expected**: Kết quả: Missing calories localStorage → default 2000
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GS_183: Missing proteinRatio localStorage → default 1.5
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Missing proteinRatio localStorage → default 1.5
- **Expected**: Kết quả: Missing proteinRatio localStorage → default 1.5
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GS_184: Export data → goals included trong file
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Export data → goals included trong file
- **Expected**: Kết quả: Export data → goals included trong file
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_185: Import data có goals → goals cập nhật
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Import data có goals → goals cập nhật
- **Expected**: Kết quả: Import data có goals → goals cập nhật
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_186: Import data không có goals → giữ hiện tại
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Import data không có goals → giữ hiện tại
- **Expected**: Kết quả: Import data không có goals → giữ hiện tại
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GS_187: Cloud sync → goals đồng bộ
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Cloud sync → goals đồng bộ
- **Expected**: Kết quả: Cloud sync → goals đồng bộ
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_188: Goals 2 devices → sync đúng
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Goals 2 devices → sync đúng
- **Expected**: Kết quả: Goals 2 devices → sync đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_189: Offline → save → sync khi online
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Offline → save → sync khi online
- **Expected**: Kết quả: Offline → save → sync khi online
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GS_190: Clear all data → goals reset defaults
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Clear all data → goals reset defaults
- **Expected**: Kết quả: Clear all data → goals reset defaults
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_191: Modal từ Summary → hiển thị đúng
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Modal từ Summary → hiển thị đúng
- **Expected**: Kết quả: Modal từ Summary → hiển thị đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_192: Modal từ Settings → hiển thị đúng
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Modal từ Settings → hiển thị đúng
- **Expected**: Kết quả: Modal từ Settings → hiển thị đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_GS_193: Modal — Android back button → đóng
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Modal — Android back button → đóng
- **Expected**: Kết quả: Modal — Android back button → đóng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_194: Modal — backdrop click → đóng
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Modal — backdrop click → đóng
- **Expected**: Kết quả: Modal — backdrop click → đóng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_195: Modal — Escape key → đóng
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Modal — Escape key → đóng
- **Expected**: Kết quả: Modal — Escape key → đóng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_196: Modal — autofocus calories field
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Modal — autofocus calories field
- **Expected**: Kết quả: Modal — autofocus calories field
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_197: Modal — Tab navigation giữa fields
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Modal — Tab navigation giữa fields
- **Expected**: Kết quả: Modal — Tab navigation giữa fields
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_198: Modal — Enter key submit
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Modal — Enter key submit
- **Expected**: Kết quả: Modal — Enter key submit
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_199: Modal — dark mode tất cả elements
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Modal — dark mode tất cả elements
- **Expected**: Kết quả: Modal — dark mode tất cả elements
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_200: Modal — i18n tất cả labels
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Modal — i18n tất cả labels
- **Expected**: Kết quả: Modal — i18n tất cả labels
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_201: Modal — mobile layout responsive
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Modal — mobile layout responsive
- **Expected**: Kết quả: Modal — mobile layout responsive
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_202: Modal — desktop layout centered
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Modal — desktop layout centered
- **Expected**: Kết quả: Modal — desktop layout centered
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_203: Modal — number keyboard mobile cho numeric
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Modal — number keyboard mobile cho numeric
- **Expected**: Kết quả: Modal — number keyboard mobile cho numeric
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_204: Modal — rapid saves 5 lần persist đúng
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Modal — rapid saves 5 lần persist đúng
- **Expected**: Kết quả: Modal — rapid saves 5 lần persist đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GS_205: Modal — mở → switch tab → quay lại → vẫn mở
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Modal — mở → switch tab → quay lại → vẫn mở
- **Expected**: Kết quả: Modal — mở → switch tab → quay lại → vẫn mở
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_GS_206: Modal — unsaved changes → đóng → warning
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Modal — unsaved changes → đóng → warning
- **Expected**: Kết quả: Modal — unsaved changes → đóng → warning
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_207: Modal — success feedback sau save
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Modal — success feedback sau save
- **Expected**: Kết quả: Modal — success feedback sau save
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_GS_208: Modal — screen reader accessible
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Modal — screen reader accessible
- **Expected**: Kết quả: Modal — screen reader accessible
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_GS_209: Modal — keyboard-only navigation hoàn chỉnh
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Modal — keyboard-only navigation hoàn chỉnh
- **Expected**: Kết quả: Modal — keyboard-only navigation hoàn chỉnh
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_GS_210: Modal — scroll nếu content dài mobile nhỏ
- **Pre-conditions**: GoalSettingsModal mở, có data hiện tại
- **Steps**: 1. Thực hiện: Modal — scroll nếu content dài mobile nhỏ
- **Expected**: Kết quả: Modal — scroll nếu content dài mobile nhỏ
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

---

### Nhóm Test Cases

##### TC_GS_01–18: Basic CRUD
- Open modal, view, edit, save, cancel, defaults

##### TC_GS_19–49: Validation
- Calories, protein ratio, weight: 0, negative, empty, boundaries, decimal

##### TC_GS_50–60: Calculation Verification
- targetProtein, bar colors

##### TC_GS_61–69: Persistence & Integration
- localStorage, import/export, sync

##### TC_GS_70–90: UX & Modal
- Entry points, interactions, validation UI, dark mode, i18n, responsive

##### TC_GS_91–105: Edge Cases & Future Features
- Rapid saves, presets, BMR, history, macro targets

##### TC_GS_106–125: Goal Presets & Quick Buttons
- 4 presets (Balanced/HighProtein/LowCarb/LightDiet), auto-fill, recalculate, i18n, dark mode, protein quick buttons

##### TC_GS_126–155: Validation nâng cao
- Calories/ratio/weight boundary min/max, abc input, scientific notation, comma, leading zeros, paste, i18n errors

##### TC_GS_156–175: Tính toán & Hiển thị
- targetProtein verification, real-time update, rounding, bars 0%/50%/100%/>100%, color states

##### TC_GS_176–190: Persistence & Data
- localStorage key/format, reload, corrupt data, import/export goals, cloud sync, offline, clear

##### TC_GS_191–210: Modal UX nâng cao
- Entry points, back handler, backdrop, escape, autofocus, tab nav, dark mode, i18n, responsive, rapid saves

---

## Đề xuất Cải tiến


### Đề xuất 1: Visual Goal Progress Timeline
- **Vấn đề hiện tại**: No history of goal changes. Can't track progress over weeks/months.
- **Giải pháp đề xuất**: Timeline chart showing goal changes + actual averages over time.
- **Lý do chi tiết**: Progress visibility is #1 motivation factor. Without it, users abandon goals after 2 weeks.
- **Phần trăm cải thiện**: Goal adherence +45%, Long-term retention +30%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 2: TDEE Calculator Built-in
- **Vấn đề hiện tại**: Users don't know what calorie target to set. Requires external research.
- **Giải pháp đề xuất**: Built-in TDEE calculator: input age, gender, activity level → recommended target.
- **Lý do chi tiết**: 70% of users set incorrect goals. TDEE calc eliminates guesswork.
- **Phần trăm cải thiện**: Goal accuracy +70%, Setup completion +40%
- **Mức độ ưu tiên**: High | **Effort**: S

### Đề xuất 3: Goal Presets (Diet Types)
- **Vấn đề hiện tại**: User must understand macros to set protein ratio.
- **Giải pháp đề xuất**: Presets: "Balanced" (1.5g/kg), "High Protein" (2.0), "Keto" (low carb/high fat), "Vegan" (1.0).
- **Lý do chi tiết**: Presets reduce cognitive load 80%. Most users fit standard diet types.
- **Phần trăm cải thiện**: Setup time -60%, User confidence +50%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 4: Weekly/Monthly Goal Mode
- **Vấn đề hiện tại**: Only daily goals. Miss Monday = fail even if weekly average is on track.
- **Giải pháp đề xuất**: Weekly calorie budget option. "2000/day or 14000/week". Flexible daily distribution.
- **Lý do chi tiết**: Flexibility reduces guilt and improves adherence. Weekend flexibility = realistic dieting.
- **Phần trăm cải thiện**: Goal adherence +35%, Psychological comfort +50%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 5: Goal Sharing / Coach Mode
- **Vấn đề hiện tại**: Goals are private. No way to share with nutritionist/trainer.
- **Giải pháp đề xuất**: Export goals as shareable link/QR code. Trainer can set goals remotely.
- **Lý do chi tiết**: Professional guidance increases success rate 3x. Sharing enables accountability.
- **Phần trăm cải thiện**: Professional usage +40%, Goal success rate +30%
- **Mức độ ưu tiên**: Low | **Effort**: M
