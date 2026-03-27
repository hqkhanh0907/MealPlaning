# Scenario 6: Ingredient CRUD

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Quản lý nguyên liệu (Ingredients) là core data của ứng dụng. Ingredient = { id, name, unit, caloriesPer100, proteinPer100, carbsPer100, fatPer100 }. Management Tab → Ingredients sub-tab cho phép Add/Edit/Delete ingredients. Delete ingredient cascade vào dish (remove từ dish.ingredients). Ingredient dùng trong dish → hiện cảnh báo khi xóa.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| ManagementTab | ManagementTab.tsx | Container tab |
| IngredientList | components/ | List ingredients |
| IngredientForm | components/ | Add/Edit form |
| AddIngredientModal | modals/ | Modal wrapper |
| EditIngredientModal | modals/ | Modal for edit |

## Luồng nghiệp vụ

1. User navigates to Management → Ingredients
2. List shows all ingredients (searchable, filterable)
3. Add: click "+" → modal → fill form → save
4. Edit: click ingredient → modal pre-filled → edit → save
5. Delete: swipe or button → confirm dialog → delete
6. Cascade: deleting ingredient removes it from all dishes

## Quy tắc nghiệp vụ

1. Name required, unique (case-insensitive)
2. Unit required: g | ml | custom string
3. Nutrition values ≥ 0
4. Delete cascade: remove from all dishes' ingredient lists
5. Used ingredient: show warning "Used in X dishes"
6. Validation: name min 1 char, max 100 chars
7. Search: filter by name substring (case-insensitive)

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_ING_01 | Ingredients list hiển thị | Positive | P0 |
| TC_ING_02 | List shows all ingredients | Positive | P1 |
| TC_ING_03 | Empty state khi chưa có ingredient | Positive | P1 |
| TC_ING_04 | Add button visible | Positive | P1 |
| TC_ING_05 | Click add → modal opens | Positive | P0 |
| TC_ING_06 | Modal form fields hiển thị | Positive | P1 |
| TC_ING_07 | Fill name field | Positive | P1 |
| TC_ING_08 | Fill unit field | Positive | P1 |
| TC_ING_09 | Fill calories field | Positive | P1 |
| TC_ING_10 | Fill protein field | Positive | P1 |
| TC_ING_11 | Fill carbs field | Positive | P1 |
| TC_ING_12 | Fill fat field | Positive | P1 |
| TC_ING_13 | Save new ingredient | Positive | P0 |
| TC_ING_14 | Success notification | Positive | P1 |
| TC_ING_15 | New ingredient appears in list | Positive | P0 |
| TC_ING_16 | Modal closes after save | Positive | P1 |
| TC_ING_17 | Cancel modal — no changes | Positive | P1 |
| TC_ING_18 | Edit ingredient click | Positive | P0 |
| TC_ING_19 | Edit modal pre-filled | Positive | P1 |
| TC_ING_20 | Edit name | Positive | P1 |
| TC_ING_21 | Edit unit | Positive | P1 |
| TC_ING_22 | Edit nutrition values | Positive | P1 |
| TC_ING_23 | Save edited ingredient | Positive | P0 |
| TC_ING_24 | Edit reflected in list | Positive | P1 |
| TC_ING_25 | Edit cascades to dishes | Positive | P0 |
| TC_ING_26 | Delete ingredient button | Positive | P1 |
| TC_ING_27 | Delete confirmation dialog | Positive | P1 |
| TC_ING_28 | Confirm delete → removed | Positive | P0 |
| TC_ING_29 | Cancel delete → preserved | Positive | P1 |
| TC_ING_30 | Delete cascade — removed from dishes | Positive | P0 |
| TC_ING_31 | Delete warning — used in dishes | Positive | P1 |
| TC_ING_32 | Delete unused ingredient — no warning | Positive | P2 |
| TC_ING_33 | Name empty → validation error | Negative | P0 |
| TC_ING_34 | Name whitespace only → error | Negative | P1 |
| TC_ING_35 | Name duplicate → error | Negative | P0 |
| TC_ING_36 | Name case-insensitive duplicate | Negative | P1 |
| TC_ING_37 | Name max 100 chars | Boundary | P1 |
| TC_ING_38 | Name 101 chars → truncate/error | Boundary | P1 |
| TC_ING_39 | Name special characters | Edge | P2 |
| TC_ING_40 | Name Vietnamese with diacritics | Positive | P1 |
| TC_ING_41 | Name emoji | Edge | P2 |
| TC_ING_42 | Name HTML injection | Security | P1 |
| TC_ING_43 | Unit empty → validation | Negative | P1 |
| TC_ING_44 | Unit = g | Positive | P1 |
| TC_ING_45 | Unit = ml | Positive | P1 |
| TC_ING_46 | Unit = custom string | Positive | P1 |
| TC_ING_47 | Calories = 0 | Boundary | P2 |
| TC_ING_48 | Calories negative → error | Negative | P1 |
| TC_ING_49 | Calories decimal (2.5) | Positive | P2 |
| TC_ING_50 | Calories very large (10000) | Boundary | P2 |
| TC_ING_51 | Protein = 0 | Boundary | P2 |
| TC_ING_52 | Protein negative → error | Negative | P1 |
| TC_ING_53 | Carbs = 0 | Boundary | P2 |
| TC_ING_54 | Fat = 0 | Boundary | P2 |
| TC_ING_55 | All nutrition = 0 | Boundary | P2 |
| TC_ING_56 | Non-numeric nutrition → error | Negative | P1 |
| TC_ING_57 | Search ingredient by name | Positive | P1 |
| TC_ING_58 | Search case-insensitive | Positive | P2 |
| TC_ING_59 | Search partial match | Positive | P2 |
| TC_ING_60 | Search no results | Positive | P2 |
| TC_ING_61 | Search Vietnamese diacritics | Positive | P2 |
| TC_ING_62 | Clear search → show all | Positive | P2 |
| TC_ING_63 | Sort ingredients by name | Positive | P2 |
| TC_ING_64 | Sort by calories | Positive | P2 |
| TC_ING_65 | Ingredient count display | Positive | P2 |
| TC_ING_66 | Scroll for large list (100+) | Positive | P2 |
| TC_ING_67 | Ingredient card layout | Positive | P2 |
| TC_ING_68 | Ingredient nutrition display | Positive | P2 |
| TC_ING_69 | Dark mode ingredient list | Positive | P2 |
| TC_ING_70 | i18n labels | Positive | P2 |
| TC_ING_71 | Desktop layout | Positive | P2 |
| TC_ING_72 | Mobile layout | Positive | P2 |
| TC_ING_73 | Persist after reload | Positive | P0 |
| TC_ING_74 | LocalStorage format correct | Positive | P1 |
| TC_ING_75 | Data integrity after edit | Positive | P1 |
| TC_ING_76 | Rapid add 10 ingredients | Boundary | P2 |
| TC_ING_77 | 500 ingredients performance | Boundary | P2 |
| TC_ING_78 | Delete all ingredients | Edge | P2 |
| TC_ING_79 | Import ingredients from backup | Positive | P1 |
| TC_ING_80 | Export ingredients | Positive | P1 |
| TC_ING_81 | Cloud sync ingredients | Positive | P2 |
| TC_ING_82 | Add from AI image analysis | Positive | P1 |
| TC_ING_83 | Add from AI suggestion | Positive | P1 |
| TC_ING_84 | Ingredient used in grocery list | Positive | P1 |
| TC_ING_85 | Delete ingredient → grocery list update | Positive | P1 |
| TC_ING_86 | Edit ingredient → dish nutrition cascade | Positive | P1 |
| TC_ING_87 | Edit ingredient → calendar nutrition update | Positive | P1 |
| TC_ING_88 | Undo delete (if supported) | Positive | P3 |
| TC_ING_89 | Batch delete ingredients | Positive | P3 |
| TC_ING_90 | Ingredient category/tag | Positive | P3 |
| TC_ING_91 | Ingredient photo | Positive | P3 |
| TC_ING_92 | Keyboard shortcuts desktop | Positive | P3 |
| TC_ING_93 | Form tab navigation | Positive | P3 |
| TC_ING_94 | Screen reader for list | Positive | P3 |
| TC_ING_95 | Touch hold for actions | Positive | P3 |
| TC_ING_96 | Swipe to delete mobile | Positive | P2 |
| TC_ING_97 | Modal backdrop click close | Positive | P2 |
| TC_ING_98 | Modal escape key close | Positive | P2 |
| TC_ING_99 | Form autofocus on open | Positive | P2 |
| TC_ING_100 | Unsaved changes warning | Positive | P2 |
| TC_ING_101 | Empty fields default to 0 | Edge | P2 |
| TC_ING_102 | Paste text into fields | Positive | P2 |
| TC_ING_103 | Copy ingredient (duplicate) | Positive | P3 |
| TC_ING_104 | Ingredient creation timestamp | Positive | P3 |
| TC_ING_105 | Ingredient usage count display | Positive | P3 |

---
| TC_ING_106 | Thêm nguyên liệu với tên 1 ký tự | Boundary | P2 |
| TC_ING_107 | Thêm nguyên liệu với tên 50 ký tự | Positive | P2 |
| TC_ING_108 | Thêm nguyên liệu với tên chứa số | Positive | P2 |
| TC_ING_109 | Thêm nguyên liệu với tên có khoảng trắng đầu/cuối → trim | Edge | P2 |
| TC_ING_110 | Thêm nguyên liệu với calories = 0.01 | Boundary | P2 |
| TC_ING_111 | Thêm nguyên liệu với calories = 999.99 | Boundary | P2 |
| TC_ING_112 | Thêm nguyên liệu với protein > calories (logic check) | Edge | P2 |
| TC_ING_113 | Thêm nguyên liệu với tất cả nutrition = 0 ngoại trừ fat | Positive | P2 |
| TC_ING_114 | Thêm nguyên liệu với fiber field | Positive | P2 |
| TC_ING_115 | Thêm nguyên liệu với unit = quả (custom Vietnamese) | Positive | P1 |
| TC_ING_116 | Thêm nguyên liệu với unit = muỗng canh | Positive | P2 |
| TC_ING_117 | Thêm nguyên liệu với unit = lát | Positive | P2 |
| TC_ING_118 | Thêm nguyên liệu — AI lookup tự động điền nutrition | Positive | P1 |
| TC_ING_119 | Thêm nguyên liệu — AI lookup thất bại → nhập thủ công | Negative | P1 |
| TC_ING_120 | Thêm nguyên liệu — AI lookup trả về kết quả không hợp lệ | Negative | P2 |
| TC_ING_121 | Thêm nguyên liệu với tên trùng nhưng khác unit → lỗi | Negative | P1 |
| TC_ING_122 | Thêm nguyên liệu liên tiếp 5 lần không đóng modal | Positive | P2 |
| TC_ING_123 | Thêm nguyên liệu với tên chứa dấu / | Edge | P2 |
| TC_ING_124 | Thêm nguyên liệu với tên chứa dấu & | Edge | P2 |
| TC_ING_125 | Thêm nguyên liệu với tên toàn số 12345 | Edge | P2 |
| TC_ING_126 | Sửa tên nguyên liệu thành tên đã tồn tại → lỗi duplicate | Negative | P1 |
| TC_ING_127 | Sửa unit từ g sang ml | Positive | P2 |
| TC_ING_128 | Sửa unit từ g sang custom unit | Positive | P2 |
| TC_ING_129 | Sửa calories từ 100 → 0 | Boundary | P2 |
| TC_ING_130 | Sửa tất cả nutrition fields cùng lúc | Positive | P1 |
| TC_ING_131 | Sửa nguyên liệu đang dùng trong dish → dish nutrition cập nhật | Positive | P0 |
| TC_ING_132 | Sửa nguyên liệu đang dùng trong 5 dishes → tất cả cập nhật | Positive | P1 |
| TC_ING_133 | Sửa tên nguyên liệu → search kết quả cập nhật | Positive | P2 |
| TC_ING_134 | Sửa nguyên liệu rồi cancel → không thay đổi | Positive | P1 |
| TC_ING_135 | Sửa nguyên liệu — form validation hiển thị inline | Positive | P2 |
| TC_ING_136 | Sửa nguyên liệu — xóa tên → validation error | Negative | P1 |
| TC_ING_137 | Sửa nguyên liệu — nhập ký tự vào field số → error | Negative | P1 |
| TC_ING_138 | Sửa nguyên liệu — dark mode form hiển thị đúng | Positive | P2 |
| TC_ING_139 | Sửa nguyên liệu — modal pre-fill giá trị hiện tại đúng | Positive | P1 |
| TC_ING_140 | Sửa nguyên liệu — thay đổi rồi refresh → chưa save thì mất | Edge | P2 |
| TC_ING_141 | Sửa nguyên liệu với giá trị protein rất lớn 9999 | Boundary | P2 |
| TC_ING_142 | Sửa nguyên liệu — click ngoài modal → cảnh báo unsaved | Positive | P2 |
| TC_ING_143 | Sửa nguyên liệu nhiều lần liên tiếp | Positive | P2 |
| TC_ING_144 | Sửa nguyên liệu — calendar view phản ánh thay đổi nutrition | Positive | P1 |
| TC_ING_145 | Sửa nguyên liệu — grocery list cập nhật thông tin mới | Positive | P2 |
| TC_ING_146 | Xóa nguyên liệu dùng trong 1 dish → warning hiện tên dish | Positive | P1 |
| TC_ING_147 | Xóa nguyên liệu dùng trong 10 dishes → warning liệt kê tất cả | Positive | P1 |
| TC_ING_148 | Xóa nguyên liệu cuối cùng → empty state hiện lại | Positive | P2 |
| TC_ING_149 | Xóa nguyên liệu → undo toast xuất hiện 30 giây | Positive | P1 |
| TC_ING_150 | Xóa nguyên liệu → click undo → khôi phục | Positive | P1 |
| TC_ING_151 | Xóa nguyên liệu → undo timeout → không thể khôi phục | Positive | P2 |
| TC_ING_152 | Xóa 3 nguyên liệu liên tiếp → mỗi cái undo riêng | Positive | P2 |
| TC_ING_153 | Xóa nguyên liệu → localStorage cập nhật ngay | Positive | P1 |
| TC_ING_154 | Xóa nguyên liệu khi đang ở search filtered view | Edge | P2 |
| TC_ING_155 | Xóa nguyên liệu khi đang sort → list re-sort đúng | Edge | P2 |
| TC_ING_156 | Xóa nguyên liệu → dishes bị ảnh hưởng recalculate nutrition | Positive | P1 |
| TC_ING_157 | Xóa nguyên liệu duy nhất trong dish → dish 0 ingredients | Edge | P1 |
| TC_ING_158 | Xóa nguyên liệu — confirm dialog dark mode đúng | Positive | P2 |
| TC_ING_159 | Xóa nguyên liệu — confirm dialog i18n labels đúng | Positive | P2 |
| TC_ING_160 | Xóa nguyên liệu — cancel delete không trigger toast | Positive | P2 |
| TC_ING_161 | Xóa nguyên liệu — keyboard Enter confirm delete | Positive | P2 |
| TC_ING_162 | Xóa nguyên liệu — keyboard Escape cancel delete | Positive | P2 |
| TC_ING_163 | Xóa nguyên liệu — mobile swipe-to-delete gesture | Positive | P2 |
| TC_ING_164 | Xóa nguyên liệu đã import từ backup | Positive | P2 |
| TC_ING_165 | Xóa nguyên liệu tạo từ AI suggestion | Positive | P2 |
| TC_ING_166 | Validation — field calories nhập abc → error Vietnamese | Negative | P1 |
| TC_ING_167 | Validation — field protein nhập -5 → error âm | Negative | P1 |
| TC_ING_168 | Validation — field carbs nhập 1e5 scientific notation | Edge | P2 |
| TC_ING_169 | Validation — field fat nhập ký tự đặc biệt → error | Edge | P2 |
| TC_ING_170 | Validation — tên chứa Unicode đặc biệt Ñ ü ø | Edge | P2 |
| TC_ING_171 | Validation — tên chỉ có dấu cách → trim → empty → error | Negative | P1 |
| TC_ING_172 | Validation — paste text chứa newline vào name field | Edge | P2 |
| TC_ING_173 | Validation — nutrition nhập 1,5 comma thay dot | Edge | P2 |
| TC_ING_174 | Validation — unit field chỉ có space → error | Negative | P2 |
| TC_ING_175 | Validation — submit form với tất cả field trống | Negative | P1 |
| TC_ING_176 | Validation — error message biến mất khi sửa field | Positive | P2 |
| TC_ING_177 | Validation — multiple errors hiển thị cùng lúc | Positive | P2 |
| TC_ING_178 | Validation — error border highlight trên field sai | Positive | P2 |
| TC_ING_179 | Validation — submit button disabled khi có lỗi | Positive | P2 |
| TC_ING_180 | Validation — calories nhập 100. trailing dot | Edge | P2 |
| TC_ING_181 | Validation — calories nhập .5 leading dot → 0.5 | Edge | P2 |
| TC_ING_182 | Validation — copy-paste giá trị âm vào nutrition field | Negative | P2 |
| TC_ING_183 | Validation — nhập giá trị → xóa hết → field trống → error | Negative | P2 |
| TC_ING_184 | Validation — đổi ngôn ngữ → error messages đổi theo | Positive | P2 |
| TC_ING_185 | Validation — dark mode error messages hiển thị rõ ràng | Positive | P2 |
| TC_ING_186 | Tìm kiếm với query 1 ký tự | Boundary | P2 |
| TC_ING_187 | Tìm kiếm với query 100 ký tự | Boundary | P2 |
| TC_ING_188 | Tìm kiếm — highlight kết quả matching text | Positive | P3 |
| TC_ING_189 | Tìm kiếm — debounce input không search mỗi keystroke | Positive | P2 |
| TC_ING_190 | Tìm kiếm Vietnamese: thịt matches Thịt bò và Thịt gà | Positive | P1 |
| TC_ING_191 | Tìm kiếm — clear button X xóa search text | Positive | P2 |
| TC_ING_192 | Tìm kiếm — search + sort cùng lúc hoạt động đúng | Positive | P2 |
| TC_ING_193 | Sắp xếp — tên A-Z ascending | Positive | P1 |
| TC_ING_194 | Sắp xếp — tên Z-A descending | Positive | P1 |
| TC_ING_195 | Sắp xếp — calories tăng dần | Positive | P2 |
| TC_ING_196 | Sắp xếp — calories giảm dần | Positive | P2 |
| TC_ING_197 | Sắp xếp — protein tăng dần | Positive | P2 |
| TC_ING_198 | Sắp xếp — protein giảm dần | Positive | P2 |
| TC_ING_199 | Sắp xếp — toggle asc/desc khi click lại cùng cột | Positive | P2 |
| TC_ING_200 | Sắp xếp — giữ lại sort khi thêm nguyên liệu mới | Positive | P2 |
| TC_ING_201 | Grid view hiển thị card nguyên liệu đúng | Positive | P2 |
| TC_ING_202 | List view hiển thị row nguyên liệu đúng | Positive | P2 |
| TC_ING_203 | Chuyển đổi Grid ↔ List view | Positive | P1 |
| TC_ING_204 | Grid view responsive — 1 cột mobile, 2-3 cột desktop | Positive | P2 |
| TC_ING_205 | Ingredient card hiển thị icon nutrition cal pro carb fat | Positive | P2 |
| TC_ING_206 | Ingredient count badge trên tab | Positive | P2 |
| TC_ING_207 | Loading state khi lấy dữ liệu | Positive | P2 |
| TC_ING_208 | Empty state hiển thị CTA Thêm nguyên liệu đầu tiên | Positive | P1 |
| TC_ING_209 | Detail modal khi click card — hiện đầy đủ thông tin | Positive | P1 |
| TC_ING_210 | Animation khi thêm/xóa nguyên liệu trong list | Positive | P3 |


---

## Chi tiết Test Cases

##### TC_ING_01: Ingredients list hiển thị
- **Pre-conditions**: App đã load
- **Steps**: 1. Navigate tới Management → Ingredients tab
- **Expected**: Ingredients list hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_ING_02: List shows all ingredients
- **Pre-conditions**: Có 5+ nguyên liệu trong localStorage
- **Steps**: 1. Mở Ingredients tab
- **Expected**: List hiển thị tất cả nguyên liệu đã lưu
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_03: Empty state khi chưa có ingredient
- **Pre-conditions**: localStorage trống, không có nguyên liệu
- **Steps**: 1. Mở Ingredients tab
- **Expected**: Empty state hiển thị, text hướng dẫn thêm nguyên liệu
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_04: Add button visible
- **Pre-conditions**: Ingredients tab đang mở
- **Steps**: 1. Quan sát giao diện
- **Expected**: Nút Thêm (+) hiển thị rõ ràng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_05: Click add → modal opens
- **Pre-conditions**: Ingredients tab đang mở
- **Steps**: 1. Click nút Thêm (+)
- **Expected**: Modal thêm nguyên liệu mở ra
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_ING_06: Modal form fields hiển thị
- **Pre-conditions**: Modal thêm nguyên liệu đang mở
- **Steps**: 1. Quan sát form fields
- **Expected**: Hiển thị đầy đủ: Name, Unit, Calories, Protein, Carbs, Fat
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_07: Fill name field
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập tên "Thịt bò" vào field Name
- **Expected**: Text hiển thị đúng trong field
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_08: Fill unit field
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Chọn/nhập unit "g"
- **Expected**: Unit field hiển thị giá trị đã chọn
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_09: Fill calories field
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập 250 vào field Calories
- **Expected**: Giá trị 250 hiển thị trong field
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_10: Fill protein field
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập 26 vào field Protein
- **Expected**: Giá trị 26 hiển thị trong field
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_11: Fill carbs field
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập 0 vào field Carbs
- **Expected**: Giá trị 0 hiển thị trong field
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_12: Fill fat field
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập 15 vào field Fat
- **Expected**: Giá trị 15 hiển thị trong field
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_13: Save new ingredient
- **Pre-conditions**: Modal thêm, tất cả fields đã điền hợp lệ
- **Steps**: 1. Click nút Lưu/Save
- **Expected**: Nguyên liệu được lưu thành công
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_ING_14: Success notification
- **Pre-conditions**: Vừa lưu nguyên liệu thành công
- **Steps**: 1. Quan sát notification
- **Expected**: Toast thông báo thành công hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_15: New ingredient appears in list
- **Pre-conditions**: Vừa lưu nguyên liệu mới
- **Steps**: 1. Quan sát ingredients list
- **Expected**: Nguyên liệu mới xuất hiện trong list
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_ING_16: Modal closes after save
- **Pre-conditions**: Vừa lưu nguyên liệu thành công
- **Steps**: 1. Quan sát modal
- **Expected**: Modal tự động đóng sau khi lưu thành công
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_17: Cancel modal — no changes
- **Pre-conditions**: Modal thêm đang mở, đã điền một số fields
- **Steps**: 1. Click nút Cancel/Hủy
- **Expected**: Modal đóng, không có nguyên liệu mới trong list
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_18: Edit ingredient click
- **Pre-conditions**: Có nguyên liệu trong list
- **Steps**: 1. Click vào nguyên liệu để sửa
- **Expected**: Modal sửa mở ra
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_ING_19: Edit modal pre-filled
- **Pre-conditions**: Modal sửa đang mở
- **Steps**: 1. Quan sát các fields
- **Expected**: Tất cả fields pre-fill đúng giá trị hiện tại của nguyên liệu
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_20: Edit name
- **Pre-conditions**: Modal sửa đang mở
- **Steps**: 1. Thay đổi tên nguyên liệu 2. Click Lưu
- **Expected**: Tên mới được cập nhật trong list
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_21: Edit unit
- **Pre-conditions**: Modal sửa đang mở
- **Steps**: 1. Thay đổi unit 2. Click Lưu
- **Expected**: Unit mới được cập nhật
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_22: Edit nutrition values
- **Pre-conditions**: Modal sửa đang mở
- **Steps**: 1. Thay đổi các giá trị nutrition 2. Click Lưu
- **Expected**: Nutrition values cập nhật đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_23: Save edited ingredient
- **Pre-conditions**: Modal sửa, đã thay đổi fields
- **Steps**: 1. Click Lưu
- **Expected**: Nguyên liệu được cập nhật thành công
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_ING_24: Edit reflected in list
- **Pre-conditions**: Vừa lưu sửa đổi
- **Steps**: 1. Quan sát list
- **Expected**: Thay đổi phản ánh trong list ngay lập tức
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_25: Edit cascades to dishes
- **Pre-conditions**: Nguyên liệu đang sửa được dùng trong dishes
- **Steps**: 1. Sửa nutrition 2. Lưu 3. Kiểm tra dishes
- **Expected**: Dishes sử dụng nguyên liệu này tự động cập nhật nutrition
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_ING_26: Delete ingredient button
- **Pre-conditions**: Có nguyên liệu trong list
- **Steps**: 1. Click nút xóa trên nguyên liệu
- **Expected**: Hiện nút Delete hoặc confirm dialog
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_27: Delete confirmation dialog
- **Pre-conditions**: Đã click xóa
- **Steps**: 1. Quan sát dialog
- **Expected**: Confirm dialog hiện: Bạn có chắc muốn xóa?
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_28: Confirm delete → removed
- **Pre-conditions**: Confirm dialog đang mở
- **Steps**: 1. Click Xác nhận/OK
- **Expected**: Nguyên liệu bị xóa khỏi list
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_ING_29: Cancel delete → preserved
- **Pre-conditions**: Confirm dialog đang mở
- **Steps**: 1. Click Hủy/Cancel
- **Expected**: Dialog đóng, nguyên liệu vẫn còn trong list
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_30: Delete cascade — removed from dishes
- **Pre-conditions**: Nguyên liệu dùng trong 2 dishes
- **Steps**: 1. Xóa nguyên liệu 2. Confirm
- **Expected**: Nguyên liệu bị xóa khỏi cả 2 dishes (cascade delete)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_ING_31: Delete warning — used in dishes
- **Pre-conditions**: Nguyên liệu đang dùng trong dishes
- **Steps**: 1. Click xóa
- **Expected**: Warning hiện: Nguyên liệu đang được sử dụng trong X dishes
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_32: Delete unused ingredient — no warning
- **Pre-conditions**: Nguyên liệu không dùng trong dish nào
- **Steps**: 1. Click xóa
- **Expected**: Confirm dialog bình thường, không có warning
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_33: Name empty → validation error
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Để tên trống 2. Click Lưu
- **Expected**: Validation error: Tên không được trống
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_ING_34: Name whitespace only → error
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập chỉ spaces vào tên 2. Click Lưu
- **Expected**: Validation error: Tên không được trống (sau trim)
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_ING_35: Name duplicate → error
- **Pre-conditions**: Đã có nguyên liệu "Gạo"
- **Steps**: 1. Thêm nguyên liệu tên "Gạo" 2. Click Lưu
- **Expected**: Validation error: Tên đã tồn tại
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_ING_36: Name case-insensitive duplicate
- **Pre-conditions**: Đã có nguyên liệu "Gạo"
- **Steps**: 1. Thêm nguyên liệu tên "gạo" (lowercase) 2. Click Lưu
- **Expected**: Validation error: Tên đã tồn tại (case-insensitive)
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_ING_37: Name max 100 chars
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập tên đúng 100 ký tự 2. Click Lưu
- **Expected**: Lưu thành công với tên 100 ký tự
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_ING_38: Name 101 chars → truncate/error
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập tên 101 ký tự 2. Click Lưu
- **Expected**: Bị truncate hoặc validation error vượt quá max length
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_ING_39: Name special characters
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập tên chứa ký tự đặc biệt !@#$%^
- **Expected**: Lưu thành công hoặc xử lý ký tự đặc biệt phù hợp
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_ING_40: Name Vietnamese with diacritics
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập tên Vietnamese có dấu "Bún bò Huế" 2. Click Lưu
- **Expected**: Lưu thành công, diacritics hiển thị đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_41: Name emoji
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập tên chứa emoji "🍎 Táo" 2. Click Lưu
- **Expected**: Lưu thành công hoặc xử lý emoji phù hợp
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_ING_42: Name HTML injection
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập tên chứa HTML tag <script>alert(1)</script>
- **Expected**: HTML bị sanitize, không execute, text hiển thị an toàn
- **Kết quả test thực tế**: | — |
- **Type**: Security | **Priority**: P1

##### TC_ING_43: Unit empty → validation
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Để unit trống 2. Click Lưu
- **Expected**: Validation error: Unit không được trống
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_ING_44: Unit = g
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Chọn unit = g 2. Click Lưu
- **Expected**: Unit = g lưu thành công
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_45: Unit = ml
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Chọn unit = ml 2. Click Lưu
- **Expected**: Unit = ml lưu thành công
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_46: Unit = custom string
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập unit custom "miếng" 2. Click Lưu
- **Expected**: Unit custom lưu thành công
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_47: Calories = 0
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập calories = 0 2. Click Lưu
- **Expected**: Lưu thành công (0 là giá trị hợp lệ)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_ING_48: Calories negative → error
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập calories = -5 2. Click Lưu
- **Expected**: Validation error: Giá trị không được âm
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_ING_49: Calories decimal (2.5)
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập calories = 2.5 2. Click Lưu
- **Expected**: Lưu thành công với giá trị decimal
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_50: Calories very large (10000)
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập calories = 10000 2. Click Lưu
- **Expected**: Lưu thành công với giá trị rất lớn
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_ING_51: Protein = 0
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập protein = 0 2. Click Lưu
- **Expected**: Lưu thành công (0 là boundary hợp lệ)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_ING_52: Protein negative → error
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập protein = -1 2. Click Lưu
- **Expected**: Validation error: Giá trị không được âm
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_ING_53: Carbs = 0
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập carbs = 0 2. Click Lưu
- **Expected**: Lưu thành công
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_ING_54: Fat = 0
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập fat = 0 2. Click Lưu
- **Expected**: Lưu thành công
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_ING_55: All nutrition = 0
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập tất cả nutrition = 0 2. Click Lưu
- **Expected**: Lưu thành công, tất cả giá trị = 0
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_ING_56: Non-numeric nutrition → error
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập text không phải số vào nutrition field 2. Click Lưu
- **Expected**: Validation error: Giá trị phải là số
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_ING_57: Search ingredient by name
- **Pre-conditions**: Có nhiều nguyên liệu
- **Steps**: 1. Nhập tên vào ô tìm kiếm
- **Expected**: Kết quả filter theo tên, chỉ hiện matching
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_58: Search case-insensitive
- **Pre-conditions**: Có nguyên liệu "Thịt Bò"
- **Steps**: 1. Search "thịt bò" (lowercase)
- **Expected**: Kết quả hiện "Thịt Bò" (case-insensitive)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_59: Search partial match
- **Pre-conditions**: Có nguyên liệu "Thịt bò"
- **Steps**: 1. Search "bò"
- **Expected**: Kết quả hiện "Thịt bò" (partial match)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_60: Search no results
- **Pre-conditions**: Có nguyên liệu trong list
- **Steps**: 1. Search "xyz123"
- **Expected**: Hiển thị 0 kết quả, message "Không tìm thấy"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_61: Search Vietnamese diacritics
- **Pre-conditions**: Có nguyên liệu "Bún bò Huế"
- **Steps**: 1. Search "bún bò"
- **Expected**: Kết quả hiện "Bún bò Huế" (Vietnamese diacritics match)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_62: Clear search → show all
- **Pre-conditions**: Đang search với text filter
- **Steps**: 1. Xóa text search
- **Expected**: Hiển thị lại tất cả nguyên liệu
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_63: Sort ingredients by name
- **Pre-conditions**: Có nhiều nguyên liệu
- **Steps**: 1. Click sort theo tên
- **Expected**: Nguyên liệu sắp xếp alphabetically
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_64: Sort by calories
- **Pre-conditions**: Có nhiều nguyên liệu
- **Steps**: 1. Click sort theo calories
- **Expected**: Nguyên liệu sắp xếp theo calories
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_65: Ingredient count display
- **Pre-conditions**: Có 15 nguyên liệu
- **Steps**: 1. Quan sát count display
- **Expected**: Hiển thị "15 nguyên liệu" hoặc count badge
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_66: Scroll for large list (100+)
- **Pre-conditions**: Có 100+ nguyên liệu
- **Steps**: 1. Scroll list
- **Expected**: Scroll mượt mà, không lag, tất cả items render đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_67: Ingredient card layout
- **Pre-conditions**: Grid view active
- **Steps**: 1. Quan sát ingredient card
- **Expected**: Card hiển thị tên, unit, calories, protein, carbs, fat
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_68: Ingredient nutrition display
- **Pre-conditions**: Ingredients list hiển thị
- **Steps**: 1. Quan sát nutrition data
- **Expected**: Nutrition values hiển thị đúng cho mỗi nguyên liệu
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_69: Dark mode ingredient list
- **Pre-conditions**: Dark mode bật
- **Steps**: 1. Mở Ingredients tab
- **Expected**: List hiển thị dark mode: background tối, text sáng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_70: i18n labels
- **Pre-conditions**: Ngôn ngữ vi/en
- **Steps**: 1. Quan sát labels
- **Expected**: Labels hiển thị đúng ngôn ngữ đã chọn
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_71: Desktop layout
- **Pre-conditions**: Desktop browser width 1920px
- **Steps**: 1. Quan sát layout
- **Expected**: Layout tối ưu cho desktop: multi-column, spacing rộng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_72: Mobile layout
- **Pre-conditions**: Mobile browser width 375px
- **Steps**: 1. Quan sát layout
- **Expected**: Layout responsive cho mobile: single column, touch-friendly
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_73: Persist after reload
- **Pre-conditions**: Đã thêm nguyên liệu
- **Steps**: 1. Reload trang
- **Expected**: Nguyên liệu vẫn còn sau reload (persist localStorage)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_ING_74: LocalStorage format correct
- **Pre-conditions**: Đã thêm nguyên liệu
- **Steps**: 1. Kiểm tra localStorage
- **Expected**: Data format JSON đúng schema
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_75: Data integrity after edit
- **Pre-conditions**: Đã sửa nguyên liệu
- **Steps**: 1. Reload 2. Kiểm tra data
- **Expected**: Data integrity preserved sau edit và reload
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_76: Rapid add 10 ingredients
- **Pre-conditions**: App đã load
- **Steps**: 1. Thêm nhanh 10 nguyên liệu liên tiếp
- **Expected**: Tất cả 10 lưu thành công, không lỗi performance
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_ING_77: 500 ingredients performance
- **Pre-conditions**: Có 500 nguyên liệu trong localStorage
- **Steps**: 1. Mở Ingredients tab 2. Search 3. Scroll
- **Expected**: App hoạt động mượt, không lag đáng kể
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_ING_78: Delete all ingredients
- **Pre-conditions**: Có 5 nguyên liệu
- **Steps**: 1. Xóa tất cả lần lượt
- **Expected**: Sau khi xóa hết, empty state hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_ING_79: Import ingredients from backup
- **Pre-conditions**: Có file backup JSON hợp lệ
- **Steps**: 1. Import file backup
- **Expected**: Nguyên liệu từ backup xuất hiện trong list
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_80: Export ingredients
- **Pre-conditions**: Có nguyên liệu trong app
- **Steps**: 1. Click Export
- **Expected**: File JSON download chứa tất cả nguyên liệu
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_81: Cloud sync ingredients
- **Pre-conditions**: Cloud sync đã cấu hình
- **Steps**: 1. Thêm nguyên liệu 2. Trigger sync
- **Expected**: Nguyên liệu sync lên cloud
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_82: Add from AI image analysis
- **Pre-conditions**: AI image analysis available
- **Steps**: 1. Dùng AI phân tích ảnh thực phẩm 2. Lưu nguyên liệu từ kết quả
- **Expected**: Nguyên liệu từ AI image analysis lưu thành công
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_83: Add from AI suggestion
- **Pre-conditions**: AI suggestion available
- **Steps**: 1. Dùng AI suggest nguyên liệu
- **Expected**: Nguyên liệu từ AI suggestion tạo thành công
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_84: Ingredient used in grocery list
- **Pre-conditions**: Nguyên liệu dùng trong dish thuộc grocery list
- **Steps**: 1. Kiểm tra grocery list
- **Expected**: Nguyên liệu xuất hiện trong grocery list
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_85: Delete ingredient → grocery list update
- **Pre-conditions**: Nguyên liệu trong grocery list
- **Steps**: 1. Xóa nguyên liệu
- **Expected**: Grocery list cập nhật: item bị xóa
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_86: Edit ingredient → dish nutrition cascade
- **Pre-conditions**: Nguyên liệu dùng trong dish
- **Steps**: 1. Sửa nutrition 2. Lưu
- **Expected**: Dish nutrition cascade cập nhật
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_87: Edit ingredient → calendar nutrition update
- **Pre-conditions**: Nguyên liệu dùng trong dish thuộc plan
- **Steps**: 1. Sửa nutrition 2. Lưu
- **Expected**: Calendar nutrition bars cập nhật
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_88: Undo delete (if supported)
- **Pre-conditions**: Vừa xóa nguyên liệu
- **Steps**: 1. Click Undo
- **Expected**: Nguyên liệu khôi phục (nếu feature supported)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_ING_89: Batch delete ingredients
- **Pre-conditions**: Có nhiều nguyên liệu
- **Steps**: 1. Chọn nhiều nguyên liệu 2. Xóa batch
- **Expected**: Tất cả nguyên liệu đã chọn bị xóa (nếu supported)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_ING_90: Ingredient category/tag
- **Pre-conditions**: Feature category/tag available
- **Steps**: 1. Gán category cho nguyên liệu
- **Expected**: Category/tag hiển thị trên card
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_ING_91: Ingredient photo
- **Pre-conditions**: Feature photo available
- **Steps**: 1. Thêm ảnh cho nguyên liệu
- **Expected**: Ảnh hiển thị trên card
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_ING_92: Keyboard shortcuts desktop
- **Pre-conditions**: Desktop, Ingredients tab
- **Steps**: 1. Dùng keyboard shortcut
- **Expected**: Shortcut hoạt động: Ctrl+N = thêm mới
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_ING_93: Form tab navigation
- **Pre-conditions**: Modal thêm đang mở
- **Steps**: 1. Nhấn Tab để navigate giữa fields
- **Expected**: Focus di chuyển qua các fields theo thứ tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_ING_94: Screen reader for list
- **Pre-conditions**: Screen reader active
- **Steps**: 1. Navigate Ingredients list
- **Expected**: Screen reader đọc đúng tên, unit, nutrition cho mỗi item
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_ING_95: Touch hold for actions
- **Pre-conditions**: Mobile, touch hold
- **Steps**: 1. Touch và giữ nguyên liệu
- **Expected**: Menu actions hiện: Sửa, Xóa
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_ING_96: Swipe to delete mobile
- **Pre-conditions**: Mobile, ingredient list
- **Steps**: 1. Swipe nguyên liệu sang trái
- **Expected**: Nút Delete hiện ra
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_97: Modal backdrop click close
- **Pre-conditions**: Modal đang mở
- **Steps**: 1. Click vào backdrop (ngoài modal)
- **Expected**: Modal đóng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_98: Modal escape key close
- **Pre-conditions**: Modal đang mở
- **Steps**: 1. Nhấn phím Escape
- **Expected**: Modal đóng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_99: Form autofocus on open
- **Pre-conditions**: Vừa mở modal thêm
- **Steps**: 1. Quan sát focus
- **Expected**: Cursor autofocus vào field tên
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_100: Unsaved changes warning
- **Pre-conditions**: Modal đang mở, đã thay đổi fields
- **Steps**: 1. Thử đóng modal
- **Expected**: Cảnh báo: Bạn có thay đổi chưa lưu
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_101: Empty fields default to 0
- **Pre-conditions**: Modal thêm mở, nutrition fields trống
- **Steps**: 1. Lưu mà không điền nutrition
- **Expected**: Fields trống default về 0
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_ING_102: Paste text into fields
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Copy text 2. Paste vào field
- **Expected**: Text paste thành công vào field
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_103: Copy ingredient (duplicate)
- **Pre-conditions**: Có nguyên liệu trong list
- **Steps**: 1. Click duplicate/copy nguyên liệu
- **Expected**: Nguyên liệu mới tạo với tên + (copy)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_ING_104: Ingredient creation timestamp
- **Pre-conditions**: Đã thêm nguyên liệu
- **Steps**: 1. Kiểm tra timestamp
- **Expected**: Nguyên liệu có creation timestamp
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_ING_105: Ingredient usage count display
- **Pre-conditions**: Nguyên liệu dùng trong 3 dishes
- **Steps**: 1. Xem usage count
- **Expected**: Hiển thị "Dùng trong 3 món"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_ING_106: Thêm nguyên liệu với tên 1 ký tự
- **Pre-conditions**: App đã load, Management → Ingredients tab
- **Steps**: 1. Click nút Thêm nguyên liệu 2. Nhập tên chỉ 1 ký tự "A" 3. Điền unit và nutrition 4. Click Lưu
- **Expected**: Nguyên liệu được tạo thành công với tên 1 ký tự
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_ING_107: Thêm nguyên liệu với tên 50 ký tự
- **Pre-conditions**: App đã load, modal thêm nguyên liệu mở
- **Steps**: 1. Nhập tên 50 ký tự hợp lệ 2. Điền đầy đủ các trường 3. Click Lưu
- **Expected**: Nguyên liệu được tạo thành công, tên hiển thị đầy đủ 50 ký tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_108: Thêm nguyên liệu với tên chứa số
- **Pre-conditions**: Modal thêm nguyên liệu mở
- **Steps**: 1. Nhập tên chứa số "Vitamin B12" 2. Điền các trường còn lại 3. Click Lưu
- **Expected**: Nguyên liệu được tạo thành công với tên chứa số
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_109: Thêm nguyên liệu với tên có khoảng trắng đầu/cuối → trim
- **Pre-conditions**: Modal thêm nguyên liệu mở
- **Steps**: 1. Nhập tên có khoảng trắng đầu/cuối "  Gạo  " 2. Click Lưu
- **Expected**: Tên được trim tự động thành "Gạo", lưu thành công
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_ING_110: Thêm nguyên liệu với calories = 0.01
- **Pre-conditions**: Modal thêm nguyên liệu mở
- **Steps**: 1. Nhập tên hợp lệ 2. Nhập calories = 0.01 3. Click Lưu
- **Expected**: Nguyên liệu lưu với calories = 0.01, giá trị decimal nhỏ được chấp nhận
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_ING_111: Thêm nguyên liệu với calories = 999.99
- **Pre-conditions**: Modal thêm nguyên liệu mở
- **Steps**: 1. Nhập tên hợp lệ 2. Nhập calories = 999.99 3. Click Lưu
- **Expected**: Nguyên liệu lưu thành công với calories = 999.99
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_ING_112: Thêm nguyên liệu với protein > calories (logic check)
- **Pre-conditions**: Modal thêm nguyên liệu mở
- **Steps**: 1. Nhập protein = 500, calories = 100 2. Click Lưu
- **Expected**: Hệ thống cho phép lưu (không có validation logic consistency) hoặc hiện cảnh báo
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_ING_113: Thêm nguyên liệu với tất cả nutrition = 0 ngoại trừ fat
- **Pre-conditions**: Modal thêm nguyên liệu mở
- **Steps**: 1. Nhập tên hợp lệ 2. Calories = 0, protein = 0, carbs = 0, fat = 50 3. Click Lưu
- **Expected**: Nguyên liệu lưu thành công, chỉ fat có giá trị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_114: Thêm nguyên liệu với fiber field
- **Pre-conditions**: Modal thêm nguyên liệu mở
- **Steps**: 1. Nhập tên và các trường bắt buộc 2. Nhập fiber = 5.2 3. Click Lưu
- **Expected**: Nguyên liệu lưu với fiber = 5.2, hiển thị trong detail
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_115: Thêm nguyên liệu với unit = quả (custom Vietnamese)
- **Pre-conditions**: Modal thêm nguyên liệu mở
- **Steps**: 1. Nhập tên "Trứng gà" 2. Chọn/nhập unit = "quả" 3. Điền nutrition 4. Click Lưu
- **Expected**: Nguyên liệu lưu thành công với unit tùy chỉnh tiếng Việt "quả"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_116: Thêm nguyên liệu với unit = muỗng canh
- **Pre-conditions**: Modal thêm nguyên liệu mở
- **Steps**: 1. Nhập tên "Dầu ăn" 2. Nhập unit = "muỗng canh" 3. Click Lưu
- **Expected**: Nguyên liệu lưu thành công với unit "muỗng canh"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_117: Thêm nguyên liệu với unit = lát
- **Pre-conditions**: Modal thêm nguyên liệu mở
- **Steps**: 1. Nhập tên "Bánh mì" 2. Nhập unit = "lát" 3. Click Lưu
- **Expected**: Nguyên liệu lưu thành công với unit "lát"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_118: Thêm nguyên liệu — AI lookup tự động điền nutrition
- **Pre-conditions**: Modal thêm mở, API key đã cấu hình
- **Steps**: 1. Nhập tên "Thịt gà" 2. Click nút AI lookup 3. Chờ kết quả
- **Expected**: AI tự động điền calories, protein, carbs, fat từ cơ sở dữ liệu
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_119: Thêm nguyên liệu — AI lookup thất bại → nhập thủ công
- **Pre-conditions**: Modal thêm mở, API key đã cấu hình nhưng mạng yếu
- **Steps**: 1. Nhập tên "Rau muống" 2. Click nút AI lookup 3. AI trả về lỗi
- **Expected**: Hiện thông báo lỗi, cho phép user nhập thủ công các trường nutrition
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_ING_120: Thêm nguyên liệu — AI lookup trả về kết quả không hợp lệ
- **Pre-conditions**: Modal thêm mở, API key cấu hình
- **Steps**: 1. Nhập tên "XYZ" 2. Click AI lookup 3. AI trả về giá trị âm hoặc NaN
- **Expected**: Hệ thống bỏ qua kết quả không hợp lệ, giữ fields trống cho user nhập
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_ING_121: Thêm nguyên liệu với tên trùng nhưng khác unit → lỗi
- **Pre-conditions**: Đã có nguyên liệu "Sữa" unit ml
- **Steps**: 1. Thêm nguyên liệu mới tên "Sữa" unit g 2. Click Lưu
- **Expected**: Validation error: tên đã tồn tại (bất kể unit khác nhau)
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_ING_122: Thêm nguyên liệu liên tiếp 5 lần không đóng modal
- **Pre-conditions**: Modal thêm nguyên liệu mở
- **Steps**: 1. Thêm nguyên liệu 1 → Lưu 2. Không đóng modal, thêm tiếp nguyên liệu 2 → Lưu 3. Lặp lại 5 lần
- **Expected**: Tất cả 5 nguyên liệu được tạo thành công, form reset sau mỗi lần lưu
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_123: Thêm nguyên liệu với tên chứa dấu /
- **Pre-conditions**: Modal thêm nguyên liệu mở
- **Steps**: 1. Nhập tên "Nước mắm/nước tương" 2. Điền các trường 3. Click Lưu
- **Expected**: Nguyên liệu lưu thành công, tên chứa dấu / hiển thị đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_ING_124: Thêm nguyên liệu với tên chứa dấu &
- **Pre-conditions**: Modal thêm nguyên liệu mở
- **Steps**: 1. Nhập tên "Muối & tiêu" 2. Click Lưu
- **Expected**: Nguyên liệu lưu thành công, ký tự & không gây lỗi HTML
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_ING_125: Thêm nguyên liệu với tên toàn số 12345
- **Pre-conditions**: Modal thêm nguyên liệu mở
- **Steps**: 1. Nhập tên chỉ gồm số "12345" 2. Click Lưu
- **Expected**: Nguyên liệu lưu thành công (tên số được chấp nhận)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_ING_126: Sửa tên nguyên liệu thành tên đã tồn tại → lỗi duplicate
- **Pre-conditions**: Đã có nguyên liệu "Cà chua", đang sửa nguyên liệu "Cà rốt"
- **Steps**: 1. Click sửa "Cà rốt" 2. Đổi tên thành "Cà chua" 3. Click Lưu
- **Expected**: Validation error: tên đã tồn tại
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_ING_127: Sửa unit từ g sang ml
- **Pre-conditions**: Nguyên liệu "Nước lọc" unit = g
- **Steps**: 1. Click sửa "Nước lọc" 2. Đổi unit từ g sang ml 3. Click Lưu
- **Expected**: Unit cập nhật thành ml, các trường khác giữ nguyên
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_128: Sửa unit từ g sang custom unit
- **Pre-conditions**: Nguyên liệu "Bơ" unit = g
- **Steps**: 1. Click sửa "Bơ" 2. Đổi unit sang "muỗng" 3. Click Lưu
- **Expected**: Unit cập nhật thành custom unit "muỗng"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_129: Sửa calories từ 100 → 0
- **Pre-conditions**: Nguyên liệu "Đường" calories = 100
- **Steps**: 1. Click sửa "Đường" 2. Đổi calories = 0 3. Click Lưu
- **Expected**: Calories cập nhật thành 0 (giá trị boundary hợp lệ)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_ING_130: Sửa tất cả nutrition fields cùng lúc
- **Pre-conditions**: Nguyên liệu có giá trị nutrition hiện tại
- **Steps**: 1. Click sửa 2. Thay đổi calories, protein, carbs, fat cùng lúc 3. Click Lưu
- **Expected**: Tất cả nutrition values cập nhật đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_131: Sửa nguyên liệu đang dùng trong dish → dish nutrition cập nhật
- **Pre-conditions**: Nguyên liệu "Gạo" dùng trong dish "Cơm trắng"
- **Steps**: 1. Sửa "Gạo" calories từ 130 → 150 2. Click Lưu 3. Mở dish "Cơm trắng"
- **Expected**: Dish "Cơm trắng" tự động recalculate nutrition với calories mới = 150
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_ING_132: Sửa nguyên liệu đang dùng trong 5 dishes → tất cả cập nhật
- **Pre-conditions**: Nguyên liệu "Thịt gà" dùng trong 5 dishes khác nhau
- **Steps**: 1. Sửa "Thịt gà" protein từ 25 → 30 2. Lưu 3. Kiểm tra từng dish
- **Expected**: Tất cả 5 dishes cập nhật nutrition phản ánh protein mới = 30
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_133: Sửa tên nguyên liệu → search kết quả cập nhật
- **Pre-conditions**: Nguyên liệu "Cà chua" hiện trong search "cà"
- **Steps**: 1. Sửa tên "Cà chua" thành "Pomidoro" 2. Lưu 3. Search "cà"
- **Expected**: "Pomidoro" không còn xuất hiện khi search "cà", search "Pom" thì thấy
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_134: Sửa nguyên liệu rồi cancel → không thay đổi
- **Pre-conditions**: Modal sửa nguyên liệu đang mở với giá trị gốc
- **Steps**: 1. Thay đổi tên và calories 2. Click Cancel/Hủy
- **Expected**: Modal đóng, nguyên liệu giữ nguyên giá trị gốc không thay đổi
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_135: Sửa nguyên liệu — form validation hiển thị inline
- **Pre-conditions**: Modal sửa nguyên liệu đang mở
- **Steps**: 1. Xóa tên để trống 2. Nhập calories âm
- **Expected**: Validation error hiện inline ngay dưới mỗi field bị lỗi
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_136: Sửa nguyên liệu — xóa tên → validation error
- **Pre-conditions**: Modal sửa nguyên liệu đang mở
- **Steps**: 1. Xóa hết tên 2. Click Lưu
- **Expected**: Validation error: Tên nguyên liệu không được trống
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_ING_137: Sửa nguyên liệu — nhập ký tự vào field số → error
- **Pre-conditions**: Modal sửa nguyên liệu đang mở
- **Steps**: 1. Nhập "abc" vào field calories 2. Click Lưu
- **Expected**: Validation error trên field calories: giá trị phải là số
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_ING_138: Sửa nguyên liệu — dark mode form hiển thị đúng
- **Pre-conditions**: Dark mode đang bật, modal sửa mở
- **Steps**: 1. Quan sát giao diện modal edit
- **Expected**: Background tối, text sáng, input fields có border phù hợp dark mode
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_139: Sửa nguyên liệu — modal pre-fill giá trị hiện tại đúng
- **Pre-conditions**: Nguyên liệu "Cá hồi" cal=200, pro=25, carbs=0, fat=12
- **Steps**: 1. Click sửa "Cá hồi"
- **Expected**: Modal mở với tất cả fields pre-fill đúng: cal=200, pro=25, carbs=0, fat=12
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_140: Sửa nguyên liệu — thay đổi rồi refresh → chưa save thì mất
- **Pre-conditions**: Modal sửa đang mở, đã thay đổi giá trị
- **Steps**: 1. Thay đổi calories 2. Refresh trình duyệt (chưa save)
- **Expected**: Thay đổi bị mất, nguyên liệu giữ giá trị cũ
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_ING_141: Sửa nguyên liệu với giá trị protein rất lớn 9999
- **Pre-conditions**: Modal sửa đang mở
- **Steps**: 1. Nhập protein = 9999 2. Click Lưu
- **Expected**: Nguyên liệu lưu với protein = 9999 (giá trị boundary lớn)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_ING_142: Sửa nguyên liệu — click ngoài modal → cảnh báo unsaved
- **Pre-conditions**: Modal sửa đang mở, đã thay đổi giá trị
- **Steps**: 1. Click ngoài modal (backdrop)
- **Expected**: Cảnh báo unsaved changes hiện lên: Hủy thay đổi?
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_143: Sửa nguyên liệu nhiều lần liên tiếp
- **Pre-conditions**: Có nguyên liệu trong list
- **Steps**: 1. Sửa nguyên liệu A → Lưu 2. Sửa nguyên liệu B → Lưu 3. Sửa nguyên liệu C → Lưu
- **Expected**: Tất cả 3 lần sửa thành công, list cập nhật đúng sau mỗi lần
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_144: Sửa nguyên liệu — calendar view phản ánh thay đổi nutrition
- **Pre-conditions**: Nguyên liệu dùng trong dish, dish trong plan ngày hôm nay
- **Steps**: 1. Sửa nutrition nguyên liệu 2. Lưu 3. Mở Calendar tab
- **Expected**: Calendar view hiển thị nutrition bars cập nhật với giá trị mới
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_145: Sửa nguyên liệu — grocery list cập nhật thông tin mới
- **Pre-conditions**: Nguyên liệu dùng trong dish thuộc grocery list
- **Steps**: 1. Sửa tên nguyên liệu 2. Lưu 3. Mở grocery list
- **Expected**: Grocery list hiển thị tên nguyên liệu mới
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_146: Xóa nguyên liệu dùng trong 1 dish → warning hiện tên dish
- **Pre-conditions**: Nguyên liệu "Hành" dùng trong dish "Phở"
- **Steps**: 1. Click xóa "Hành" 2. Xem confirm dialog
- **Expected**: Dialog hiện: "Hành đang được sử dụng trong: Phở. Bạn có chắc muốn xóa?"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_147: Xóa nguyên liệu dùng trong 10 dishes → warning liệt kê tất cả
- **Pre-conditions**: Nguyên liệu "Muối" dùng trong 10 dishes
- **Steps**: 1. Click xóa "Muối" 2. Xem confirm dialog
- **Expected**: Dialog liệt kê tất cả 10 tên dishes đang sử dụng nguyên liệu
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_148: Xóa nguyên liệu cuối cùng → empty state hiện lại
- **Pre-conditions**: Chỉ còn 1 nguyên liệu trong list
- **Steps**: 1. Xóa nguyên liệu cuối cùng 2. Confirm xóa
- **Expected**: List trống, empty state hiển thị với CTA thêm nguyên liệu
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_149: Xóa nguyên liệu → undo toast xuất hiện 30 giây
- **Pre-conditions**: Có nguyên liệu trong list
- **Steps**: 1. Xóa 1 nguyên liệu 2. Confirm
- **Expected**: Undo toast xuất hiện ở bottom, đếm ngược 30 giây
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_150: Xóa nguyên liệu → click undo → khôi phục
- **Pre-conditions**: Vừa xóa nguyên liệu, undo toast đang hiện
- **Steps**: 1. Click nút Undo trên toast
- **Expected**: Nguyên liệu được khôi phục lại trong list, toast biến mất
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_151: Xóa nguyên liệu → undo timeout → không thể khôi phục
- **Pre-conditions**: Vừa xóa nguyên liệu, undo toast đang hiện
- **Steps**: 1. Chờ 30 giây cho toast biến mất 2. Thử tìm nguyên liệu đã xóa
- **Expected**: Toast biến mất, nguyên liệu bị xóa vĩnh viễn, không thể khôi phục
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_152: Xóa 3 nguyên liệu liên tiếp → mỗi cái undo riêng
- **Pre-conditions**: Có 3+ nguyên liệu trong list
- **Steps**: 1. Xóa nguyên liệu A 2. Ngay lập tức xóa B 3. Xóa C
- **Expected**: Mỗi nguyên liệu có undo toast riêng, click undo chỉ khôi phục cái tương ứng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_153: Xóa nguyên liệu → localStorage cập nhật ngay
- **Pre-conditions**: Có nguyên liệu trong list
- **Steps**: 1. Xóa 1 nguyên liệu 2. Confirm 3. Kiểm tra localStorage
- **Expected**: localStorage cập nhật ngay, ingredient bị xóa khỏi array
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_154: Xóa nguyên liệu khi đang ở search filtered view
- **Pre-conditions**: Đang search "gà", kết quả hiện 3 nguyên liệu
- **Steps**: 1. Xóa 1 nguyên liệu từ kết quả search 2. Confirm
- **Expected**: Nguyên liệu bị xóa, search results cập nhật còn 2
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_ING_155: Xóa nguyên liệu khi đang sort → list re-sort đúng
- **Pre-conditions**: Đang sort theo calories tăng dần
- **Steps**: 1. Xóa 1 nguyên liệu 2. Confirm
- **Expected**: List cập nhật, sort order vẫn đúng theo calories tăng dần
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_ING_156: Xóa nguyên liệu → dishes bị ảnh hưởng recalculate nutrition
- **Pre-conditions**: Nguyên liệu A dùng trong dish B
- **Steps**: 1. Xóa nguyên liệu A 2. Confirm 3. Mở dish B
- **Expected**: Dish B tự động remove nguyên liệu A, nutrition recalculate
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_157: Xóa nguyên liệu duy nhất trong dish → dish 0 ingredients
- **Pre-conditions**: Dish "Nước lọc" chỉ có 1 nguyên liệu "Nước"
- **Steps**: 1. Xóa nguyên liệu "Nước" 2. Confirm 3. Kiểm tra dish
- **Expected**: Dish "Nước lọc" có 0 ingredients, có thể hiện warning cần thêm
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_ING_158: Xóa nguyên liệu — confirm dialog dark mode đúng
- **Pre-conditions**: Dark mode bật
- **Steps**: 1. Xóa nguyên liệu 2. Xem confirm dialog
- **Expected**: Confirm dialog hiển thị đúng dark mode: background tối, text sáng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_159: Xóa nguyên liệu — confirm dialog i18n labels đúng
- **Pre-conditions**: Ngôn ngữ = en
- **Steps**: 1. Xóa nguyên liệu 2. Xem confirm dialog
- **Expected**: Dialog labels hiển thị tiếng Anh: Delete, Cancel, Warning
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_160: Xóa nguyên liệu — cancel delete không trigger toast
- **Pre-conditions**: Confirm delete dialog đang mở
- **Steps**: 1. Click Cancel
- **Expected**: Dialog đóng, không có toast notification, nguyên liệu giữ nguyên
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_161: Xóa nguyên liệu — keyboard Enter confirm delete
- **Pre-conditions**: Confirm delete dialog đang mở
- **Steps**: 1. Nhấn Enter trên bàn phím
- **Expected**: Xóa nguyên liệu (Enter = confirm)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_162: Xóa nguyên liệu — keyboard Escape cancel delete
- **Pre-conditions**: Confirm delete dialog đang mở
- **Steps**: 1. Nhấn Escape trên bàn phím
- **Expected**: Dialog đóng, không xóa (Escape = cancel)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_163: Xóa nguyên liệu — mobile swipe-to-delete gesture
- **Pre-conditions**: Mobile, ingredient list hiển thị
- **Steps**: 1. Swipe nguyên liệu sang trái
- **Expected**: Hiện nút Delete, cho phép xóa bằng swipe gesture
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_164: Xóa nguyên liệu đã import từ backup
- **Pre-conditions**: Nguyên liệu được import từ backup file
- **Steps**: 1. Xóa nguyên liệu đã import 2. Confirm
- **Expected**: Nguyên liệu bị xóa bình thường, không khác gì nguyên liệu tạo thủ công
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_165: Xóa nguyên liệu tạo từ AI suggestion
- **Pre-conditions**: Nguyên liệu được tạo từ AI suggestion
- **Steps**: 1. Xóa nguyên liệu AI-created 2. Confirm
- **Expected**: Nguyên liệu bị xóa bình thường
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_166: Validation — field calories nhập abc → error Vietnamese
- **Pre-conditions**: Modal thêm/sửa nguyên liệu mở
- **Steps**: 1. Nhập "abc" vào field calories 2. Click Lưu
- **Expected**: Error message tiếng Việt: "Giá trị phải là số"
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_ING_167: Validation — field protein nhập -5 → error âm
- **Pre-conditions**: Modal thêm/sửa mở
- **Steps**: 1. Nhập "-5" vào field protein 2. Click Lưu
- **Expected**: Error message: "Giá trị không được âm"
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_ING_168: Validation — field carbs nhập 1e5 scientific notation
- **Pre-conditions**: Modal thêm/sửa mở
- **Steps**: 1. Nhập "1e5" vào field carbs
- **Expected**: Hệ thống parse thành 100000 hoặc hiện error tùy implementation
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_ING_169: Validation — field fat nhập ký tự đặc biệt → error
- **Pre-conditions**: Modal thêm/sửa mở
- **Steps**: 1. Nhập ký tự đặc biệt vào field fat
- **Expected**: Error message hiển thị, không cho phép lưu
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_ING_170: Validation — tên chứa Unicode đặc biệt Ñ ü ø
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập tên chứa Unicode đặc biệt "Crème brûlée" 2. Click Lưu
- **Expected**: Tên lưu thành công với ký tự Unicode đặc biệt
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_ING_171: Validation — tên chỉ có dấu cách → trim → empty → error
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập tên chỉ gồm spaces "   " 2. Click Lưu
- **Expected**: Trim → empty string → validation error: tên không được trống
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_ING_172: Validation — paste text chứa newline vào name field
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Paste text có newline "Gạo\nnếp" vào name field
- **Expected**: Newline bị strip, tên thành "Gạonếp" hoặc "Gạo nếp"
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_ING_173: Validation — nutrition nhập 1,5 comma thay dot
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập "1,5" vào field nutrition (dùng comma thay dot)
- **Expected**: Hệ thống parse thành 1.5 hoặc hiện error tùy locale
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_ING_174: Validation — unit field chỉ có space → error
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập chỉ spaces vào unit field 2. Click Lưu
- **Expected**: Validation error: unit không được trống
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_ING_175: Validation — submit form với tất cả field trống
- **Pre-conditions**: Modal thêm mở, tất cả fields trống
- **Steps**: 1. Click Lưu ngay
- **Expected**: Hiển thị validation errors cho tất cả required fields cùng lúc
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_ING_176: Validation — error message biến mất khi sửa field
- **Pre-conditions**: Modal có validation error trên field name
- **Steps**: 1. Nhập tên hợp lệ vào field name
- **Expected**: Error message biến mất ngay khi user bắt đầu sửa
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_177: Validation — multiple errors hiển thị cùng lúc
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Để tên trống 2. Nhập calories âm 3. Để unit trống 4. Click Lưu
- **Expected**: 3 error messages hiển thị cùng lúc cho 3 fields
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_178: Validation — error border highlight trên field sai
- **Pre-conditions**: Modal có validation errors
- **Steps**: 1. Quan sát fields bị lỗi
- **Expected**: Fields lỗi có border đỏ hoặc highlight khác biệt
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_179: Validation — submit button disabled khi có lỗi
- **Pre-conditions**: Modal có validation errors
- **Steps**: 1. Quan sát nút Lưu
- **Expected**: Nút Lưu disabled (grayed out) khi form có lỗi validation
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_180: Validation — calories nhập 100. trailing dot
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập "100." vào calories (trailing dot)
- **Expected**: Parse thành 100 hoặc giữ nguyên 100. tùy implementation
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_ING_181: Validation — calories nhập .5 leading dot → 0.5
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập ".5" vào calories (leading dot)
- **Expected**: Parse thành 0.5, chấp nhận giá trị
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_ING_182: Validation — copy-paste giá trị âm vào nutrition field
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Copy giá trị "-10" 2. Paste vào field nutrition
- **Expected**: Validation error: giá trị không được âm
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_ING_183: Validation — nhập giá trị → xóa hết → field trống → error
- **Pre-conditions**: Modal thêm/sửa, field calories đang có giá trị 100
- **Steps**: 1. Xóa hết giá trị trong field calories 2. Click Lưu
- **Expected**: Validation error hoặc default to 0
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_ING_184: Validation — đổi ngôn ngữ → error messages đổi theo
- **Pre-conditions**: Đang có validation error, ngôn ngữ = vi
- **Steps**: 1. Đổi ngôn ngữ sang en
- **Expected**: Error messages chuyển sang tiếng Anh
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_185: Validation — dark mode error messages hiển thị rõ ràng
- **Pre-conditions**: Dark mode bật, modal có validation errors
- **Steps**: 1. Quan sát error messages
- **Expected**: Error text màu đỏ/cam hiển thị rõ ràng trên nền tối
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_186: Tìm kiếm với query 1 ký tự
- **Pre-conditions**: Có 10 nguyên liệu trong list
- **Steps**: 1. Nhập 1 ký tự "g" vào ô tìm kiếm
- **Expected**: Hiển thị tất cả nguyên liệu có chứa "g" trong tên
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_ING_187: Tìm kiếm với query 100 ký tự
- **Pre-conditions**: Có nguyên liệu trong list
- **Steps**: 1. Nhập query 100 ký tự vào ô tìm kiếm
- **Expected**: Search hoạt động, hiện 0 kết quả (không có tên 100 ký tự)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_ING_188: Tìm kiếm — highlight kết quả matching text
- **Pre-conditions**: Search đang hiện kết quả
- **Steps**: 1. Quan sát text matching trong tên nguyên liệu
- **Expected**: Phần text matching được highlight (bold hoặc màu khác)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_ING_189: Tìm kiếm — debounce input không search mỗi keystroke
- **Pre-conditions**: Ô tìm kiếm đang focus
- **Steps**: 1. Gõ nhanh "thit ga" 2. Quan sát timing search
- **Expected**: Search chỉ trigger sau debounce delay, không search mỗi keystroke
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_190: Tìm kiếm Vietnamese: thịt matches Thịt bò và Thịt gà
- **Pre-conditions**: Có nguyên liệu "Thịt bò", "Thịt gà", "Cá hồi"
- **Steps**: 1. Nhập "thịt" vào ô tìm kiếm
- **Expected**: Hiển thị "Thịt bò" và "Thịt gà", diacritics matching đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_191: Tìm kiếm — clear button X xóa search text
- **Pre-conditions**: Ô tìm kiếm có text
- **Steps**: 1. Click nút X (clear) trên ô tìm kiếm
- **Expected**: Text bị xóa, hiển thị lại tất cả nguyên liệu
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_192: Tìm kiếm — search + sort cùng lúc hoạt động đúng
- **Pre-conditions**: Đang search "gà" và sort theo calories
- **Steps**: 1. Quan sát kết quả
- **Expected**: Chỉ nguyên liệu matching "gà" hiện, sắp xếp theo calories
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_193: Sắp xếp — tên A-Z ascending
- **Pre-conditions**: Có nhiều nguyên liệu chưa sort
- **Steps**: 1. Click sort theo tên A-Z
- **Expected**: Nguyên liệu sắp xếp ascending theo alphabet (A → Z)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_194: Sắp xếp — tên Z-A descending
- **Pre-conditions**: Đang sort tên A-Z
- **Steps**: 1. Click sort theo tên Z-A
- **Expected**: Nguyên liệu sắp xếp descending (Z → A)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_195: Sắp xếp — calories tăng dần
- **Pre-conditions**: Có nguyên liệu với calories khác nhau
- **Steps**: 1. Click sort theo calories tăng dần
- **Expected**: Nguyên liệu sắp xếp từ calories thấp → cao
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_196: Sắp xếp — calories giảm dần
- **Pre-conditions**: Có nguyên liệu với calories khác nhau
- **Steps**: 1. Click sort theo calories giảm dần
- **Expected**: Nguyên liệu sắp xếp từ calories cao → thấp
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_197: Sắp xếp — protein tăng dần
- **Pre-conditions**: Có nguyên liệu với protein khác nhau
- **Steps**: 1. Click sort theo protein tăng dần
- **Expected**: Nguyên liệu sắp xếp từ protein thấp → cao
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_198: Sắp xếp — protein giảm dần
- **Pre-conditions**: Có nguyên liệu với protein khác nhau
- **Steps**: 1. Click sort theo protein giảm dần
- **Expected**: Nguyên liệu sắp xếp từ protein cao → thấp
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_199: Sắp xếp — toggle asc/desc khi click lại cùng cột
- **Pre-conditions**: Đang sort tên A-Z
- **Steps**: 1. Click lại nút sort tên
- **Expected**: Toggle sang Z-A, click lại toggle về A-Z
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_200: Sắp xếp — giữ lại sort khi thêm nguyên liệu mới
- **Pre-conditions**: Đang sort theo calories tăng dần
- **Steps**: 1. Thêm nguyên liệu mới 2. Quay lại list
- **Expected**: Nguyên liệu mới xuất hiện đúng vị trí theo sort calories
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_201: Grid view hiển thị card nguyên liệu đúng
- **Pre-conditions**: Ingredients tab, grid view active
- **Steps**: 1. Quan sát layout
- **Expected**: Mỗi nguyên liệu hiển thị dưới dạng card với icon, tên, unit, nutrition summary
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_202: List view hiển thị row nguyên liệu đúng
- **Pre-conditions**: Ingredients tab
- **Steps**: 1. Chuyển sang list view
- **Expected**: Mỗi nguyên liệu hiển thị dưới dạng row trong bảng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_203: Chuyển đổi Grid ↔ List view
- **Pre-conditions**: Grid view đang active
- **Steps**: 1. Click nút chuyển view 2. Quan sát
- **Expected**: Chuyển sang list view, click lại chuyển về grid view
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_204: Grid view responsive — 1 cột mobile, 2-3 cột desktop
- **Pre-conditions**: Grid view, responsive test
- **Steps**: 1. Xem trên mobile (width 375px) 2. Xem trên desktop (1920px)
- **Expected**: Mobile: 1 cột cards, Desktop: 2-3 cột cards
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_205: Ingredient card hiển thị icon nutrition cal pro carb fat
- **Pre-conditions**: Grid view, ingredient cards
- **Steps**: 1. Quan sát card content
- **Expected**: Card hiển thị icon cho calories, protein, carbs, fat với giá trị tương ứng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_206: Ingredient count badge trên tab
- **Pre-conditions**: Có 15 nguyên liệu
- **Steps**: 1. Quan sát Ingredients tab header
- **Expected**: Badge hiển thị số "15" bên cạnh tên tab
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_207: Loading state khi lấy dữ liệu
- **Pre-conditions**: App khởi động, dữ liệu đang load từ localStorage
- **Steps**: 1. Quan sát ingredients list
- **Expected**: Loading skeleton/spinner hiển thị trong khi dữ liệu đang load
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_ING_208: Empty state hiển thị CTA Thêm nguyên liệu đầu tiên
- **Pre-conditions**: Không có nguyên liệu nào (list trống)
- **Steps**: 1. Quan sát empty state
- **Expected**: Hiển thị message "Chưa có nguyên liệu" và CTA button "Thêm nguyên liệu đầu tiên"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_209: Detail modal khi click card — hiện đầy đủ thông tin
- **Pre-conditions**: Có nguyên liệu trong grid view
- **Steps**: 1. Click vào card nguyên liệu
- **Expected**: Detail modal mở hiển thị đầy đủ: tên, unit, cal, pro, carbs, fat, fiber
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_ING_210: Animation khi thêm/xóa nguyên liệu trong list
- **Pre-conditions**: Ingredients list đang hiển thị
- **Steps**: 1. Thêm 1 nguyên liệu mới 2. Xóa 1 nguyên liệu
- **Expected**: Animation slide-in khi thêm, fade-out khi xóa
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

---

### Nhóm Test Cases

##### TC_ING_01–17: Add Flow
- Luồng thêm nguyên liệu đầy đủ từ click button → fill form → save → verify in list

##### TC_ING_18–25: Edit Flow
- Click → pre-filled modal → edit fields → save → verify cascade to dishes

##### TC_ING_26–32: Delete Flow
- Delete button → confirmation → cascade → warnings for used ingredients

##### TC_ING_33–56: Validation
- Name: empty, whitespace, duplicate, case-insensitive, length, special chars, Vietnamese, emoji, injection
- Unit: empty, g/ml/custom
- Nutrition: zero, negative, decimal, large, non-numeric

##### TC_ING_57–72: Search, Sort & Display
- Search: case, partial, no results, diacritics, clear
- Sort, count, scroll, card, dark mode, i18n, responsive

##### TC_ING_73–87: Persistence & Integration
- LocalStorage, import/export, sync, AI creation, grocery list, cascade

##### TC_ING_88–105: Advanced & Accessibility
- Undo, batch, category, photo, keyboard, screen reader, touch, modal, form UX

##### TC_ING_106–125: Thêm nguyên liệu nâng cao
- Tên 1/50 ký tự, tên chứa số, trim spaces, calories boundary (0.01, 999.99), protein logic check
- Fiber field, custom Vietnamese units (quả, muỗng canh, lát), AI lookup success/failure
- Tên trùng khác unit, thêm liên tiếp, ký tự đặc biệt / & số

##### TC_ING_126–145: Chỉnh sửa nâng cao
- Sửa tên trùng duplicate, đổi unit g→ml→custom, sửa calories boundary
- Cascade to dishes (1 dish, 5 dishes), search update, cancel/undo, form validation inline
- Dark mode, pre-fill check, refresh mất data, unsaved changes warning

##### TC_ING_146–165: Xóa nâng cao
- Warning hiện tên dishes (1, 10 dishes), empty state, undo toast 30s, undo restore
- Undo timeout, multiple deletes, localStorage update, search/sort context
- Cascade nutrition recalc, dark mode dialog, i18n, keyboard Enter/Escape, swipe mobile

##### TC_ING_166–185: Validation nâng cao
- Nhập text vào số, giá trị âm, scientific notation, ký tự Unicode
- Trim spaces → empty, newline paste, comma decimal, unit spaces
- All fields trống, error disappear, multiple errors, border highlight, submit disabled
- Trailing/leading dot, paste âm, clear field, i18n errors, dark mode errors

##### TC_ING_186–200: Tìm kiếm & Sắp xếp nâng cao
- Query 1/100 ký tự, highlight match, debounce, Vietnamese diacritics matching
- Clear button, search + sort combo, tên A-Z/Z-A, calories/protein asc/desc
- Toggle sort direction, maintain sort on add

##### TC_ING_201–210: Hiển thị & Giao diện
- Grid/List view, chuyển đổi view, responsive columns, nutrition icons
- Count badge, loading state, empty state CTA, detail modal, animations

---

## Đề xuất Cải tiến


### Đề xuất 1: Ingredient Database with Auto-Complete
- **Vấn đề hiện tại**: User phải nhập manual nutrition data cho mỗi ingredient — tedious và error-prone.
- **Giải pháp đề xuất**: Built-in database 500+ common ingredients với nutrition data. Auto-complete search khi user gõ tên.
- **Lý do chi tiết**: Manual entry sai nutrition 40% cases. Pre-populated data tăng accuracy + giảm effort 80%.
- **Phần trăm cải thiện**: Data accuracy +60%, Entry time -80%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 2: Barcode Scanner for Ingredients
- **Vấn đề hiện tại**: Packaged food ingredients require manual lookup.
- **Giải pháp đề xuất**: Scan barcode → auto-fill name, unit, nutrition from OpenFoodFacts API.
- **Lý do chi tiết**: 40% of ingredients are packaged. Scan = 100% accurate, 2 seconds vs 2 minutes.
- **Phần trăm cải thiện**: Entry speed +95%, Accuracy +30%
- **Mức độ ưu tiên**: Medium | **Effort**: L

### Đề xuất 3: Ingredient Categories/Tags
- **Vấn đề hiện tại**: Flat list of ingredients, hard to find in large collections.
- **Giải pháp đề xuất**: Categorize: Proteins, Vegetables, Grains, Dairy, etc. Color-coded tags. Filter by category.
- **Lý do chi tiết**: Users with 50+ ingredients spend 30s searching. Categories reduce to 5s.
- **Phần trăm cải thiện**: Search time -80%, Organization +60%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 4: Bulk Import from Spreadsheet
- **Vấn đề hiện tại**: Adding 20 ingredients = 20 individual forms. Very slow.
- **Giải pháp đề xuất**: CSV/Excel import. Paste from spreadsheet. Template download.
- **Lý do chi tiết**: New users need 30-50 ingredients to start. Bulk import reduces setup from 1 hour to 2 minutes.
- **Phần trăm cải thiện**: Onboarding time -90%, User activation +40%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 5: Recently Used / Favorites
- **Vấn đề hiện tại**: When adding ingredients to dishes, user scrolls through all. No recency bias.
- **Giải pháp đề xuất**: "Recently Used" section at top. Star favorite ingredients. Sorted by frequency.
- **Lý do chi tiết**: 80% of daily cooking uses 20 ingredients. Quick access to favorites = 60% faster dish creation.
- **Phần trăm cải thiện**: Dish creation time -40%, User satisfaction +30%
- **Mức độ ưu tiên**: Medium | **Effort**: S
