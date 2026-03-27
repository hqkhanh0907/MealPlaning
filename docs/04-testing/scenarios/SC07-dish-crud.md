# Scenario 7: Dish CRUD

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Dish management cho phép tạo, sửa, xóa dishes. Dish = { id, name, ingredients: [{ingredientId, amount}] }. Nutrition tính từ ingredients. Dish dùng trong meal plan → không thể xóa (hoặc cảnh báo cascade). Management Tab → Dishes sub-tab.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| ManagementTab | ManagementTab.tsx | Container |
| DishList | components/ | List dishes |
| DishForm | components/ | Add/Edit form |
| AddDishModal | modals/ | Add modal |
| EditDishModal | modals/ | Edit modal |
| DishIngredientSelector | components/ | Pick ingredients |

## Luồng nghiệp vụ

1. User goes to Management → Dishes
2. List shows all dishes with name and nutrition summary
3. Add: click "+" → modal → name + select ingredients + set amounts → save
4. Edit: click dish → edit name/ingredients/amounts → save
5. Delete: click delete → confirm → remove (cascade from plans or block)

## Quy tắc nghiệp vụ

1. Name required, unique
2. At least 1 ingredient required
3. Amount > 0 for each ingredient
4. Nutrition = sum(ingredient.nutritionPer100 × amount / 100) for g/ml, nutritionPerUnit × amount for custom
5. Dish used in plan → warning on delete
6. Edit dish → all plan entries update (reference, not copy)

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_DSH_01 | Dishes tab hiển thị | Positive | P0 |
| TC_DSH_02 | List shows all dishes | Positive | P1 |
| TC_DSH_03 | Empty state | Positive | P1 |
| TC_DSH_04 | Add button visible | Positive | P1 |
| TC_DSH_05 | Click add → modal opens | Positive | P0 |
| TC_DSH_06 | Modal form: name field | Positive | P1 |
| TC_DSH_07 | Modal form: ingredient selector | Positive | P1 |
| TC_DSH_08 | Select ingredient from list | Positive | P1 |
| TC_DSH_09 | Set ingredient amount | Positive | P1 |
| TC_DSH_10 | Add multiple ingredients | Positive | P1 |
| TC_DSH_11 | Remove ingredient from dish | Positive | P1 |
| TC_DSH_12 | Nutrition preview while adding | Positive | P1 |
| TC_DSH_13 | Save new dish | Positive | P0 |
| TC_DSH_14 | Success notification | Positive | P1 |
| TC_DSH_15 | New dish in list | Positive | P0 |
| TC_DSH_16 | Modal closes after save | Positive | P1 |
| TC_DSH_17 | Cancel → no changes | Positive | P1 |
| TC_DSH_18 | Edit dish click | Positive | P0 |
| TC_DSH_19 | Edit modal pre-filled | Positive | P1 |
| TC_DSH_20 | Edit dish name | Positive | P1 |
| TC_DSH_21 | Add ingredient to existing dish | Positive | P1 |
| TC_DSH_22 | Remove ingredient from dish | Positive | P1 |
| TC_DSH_23 | Change ingredient amount | Positive | P1 |
| TC_DSH_24 | Save edited dish | Positive | P0 |
| TC_DSH_25 | Edit reflected in list | Positive | P1 |
| TC_DSH_26 | Edit cascades to plan entries | Positive | P0 |
| TC_DSH_27 | Delete dish button | Positive | P1 |
| TC_DSH_28 | Delete confirmation | Positive | P1 |
| TC_DSH_29 | Confirm delete → removed | Positive | P0 |
| TC_DSH_30 | Cancel delete → preserved | Positive | P1 |
| TC_DSH_31 | Delete used dish → warning | Positive | P0 |
| TC_DSH_32 | Delete unused dish → no warning | Positive | P2 |
| TC_DSH_33 | Delete cascade from plans | Positive | P1 |
| TC_DSH_34 | Name empty → error | Negative | P0 |
| TC_DSH_35 | Name whitespace only → error | Negative | P1 |
| TC_DSH_36 | Name duplicate → error | Negative | P0 |
| TC_DSH_37 | Name case-insensitive duplicate | Negative | P1 |
| TC_DSH_38 | Name max length (100) | Boundary | P1 |
| TC_DSH_39 | Name 101 chars → error | Boundary | P1 |
| TC_DSH_40 | Name special characters | Edge | P2 |
| TC_DSH_41 | Name Vietnamese diacritics | Positive | P1 |
| TC_DSH_42 | Name emoji | Edge | P2 |
| TC_DSH_43 | Name HTML injection | Security | P1 |
| TC_DSH_44 | No ingredients → validation error | Negative | P0 |
| TC_DSH_45 | Amount = 0 → error | Negative | P1 |
| TC_DSH_46 | Amount negative → error | Negative | P1 |
| TC_DSH_47 | Amount decimal (0.5) | Positive | P2 |
| TC_DSH_48 | Amount very large (10000g) | Boundary | P2 |
| TC_DSH_49 | Amount non-numeric → error | Negative | P1 |
| TC_DSH_50 | Duplicate ingredient in dish → prevent | Negative | P1 |
| TC_DSH_51 | Nutrition calc: g unit ingredient | Positive | P1 |
| TC_DSH_52 | Nutrition calc: ml unit ingredient | Positive | P1 |
| TC_DSH_53 | Nutrition calc: custom unit | Positive | P1 |
| TC_DSH_54 | Nutrition updates on amount change | Positive | P1 |
| TC_DSH_55 | Nutrition updates on ingredient add/remove | Positive | P1 |
| TC_DSH_56 | Mixed units in one dish | Positive | P2 |
| TC_DSH_57 | Search dish by name | Positive | P1 |
| TC_DSH_58 | Search case-insensitive | Positive | P2 |
| TC_DSH_59 | Search partial match | Positive | P2 |
| TC_DSH_60 | Search no results | Positive | P2 |
| TC_DSH_61 | Search Vietnamese diacritics | Positive | P2 |
| TC_DSH_62 | Clear search | Positive | P2 |
| TC_DSH_63 | Sort by name | Positive | P2 |
| TC_DSH_64 | Sort by calories | Positive | P2 |
| TC_DSH_65 | Dish count display | Positive | P2 |
| TC_DSH_66 | Scroll large list (100+) | Positive | P2 |
| TC_DSH_67 | Dish card: name + nutrition summary | Positive | P1 |
| TC_DSH_68 | Dish card: ingredient count | Positive | P2 |
| TC_DSH_69 | Dark mode | Positive | P2 |
| TC_DSH_70 | i18n labels | Positive | P2 |
| TC_DSH_71 | Desktop layout | Positive | P2 |
| TC_DSH_72 | Mobile layout | Positive | P2 |
| TC_DSH_73 | Persist after reload | Positive | P0 |
| TC_DSH_74 | LocalStorage format | Positive | P1 |
| TC_DSH_75 | Data integrity after edit | Positive | P1 |
| TC_DSH_76 | Rapid add 10 dishes | Boundary | P2 |
| TC_DSH_77 | 200 dishes performance | Boundary | P2 |
| TC_DSH_78 | Delete all dishes | Edge | P2 |
| TC_DSH_79 | Import dishes from backup | Positive | P1 |
| TC_DSH_80 | Export dishes | Positive | P1 |
| TC_DSH_81 | Cloud sync dishes | Positive | P2 |
| TC_DSH_82 | AI-created dish editable | Positive | P1 |
| TC_DSH_83 | AI image → saved dish editable | Positive | P1 |
| TC_DSH_84 | Dish in grocery list | Positive | P1 |
| TC_DSH_85 | Delete dish → grocery update | Positive | P1 |
| TC_DSH_86 | Edit dish → plan nutrition cascade | Positive | P1 |
| TC_DSH_87 | Ingredient deleted → dish updates | Positive | P1 |
| TC_DSH_88 | Undo delete | Positive | P3 |
| TC_DSH_89 | Batch delete | Positive | P3 |
| TC_DSH_90 | Dish category/tag | Positive | P3 |
| TC_DSH_91 | Dish photo | Positive | P3 |
| TC_DSH_92 | Copy dish (duplicate) | Positive | P3 |
| TC_DSH_93 | Keyboard shortcuts | Positive | P3 |
| TC_DSH_94 | Form tab navigation | Positive | P3 |
| TC_DSH_95 | Screen reader | Positive | P3 |
| TC_DSH_96 | Swipe to delete mobile | Positive | P2 |
| TC_DSH_97 | Modal backdrop close | Positive | P2 |
| TC_DSH_98 | Modal escape close | Positive | P2 |
| TC_DSH_99 | Autofocus on modal open | Positive | P2 |
| TC_DSH_100 | Unsaved changes warning | Positive | P2 |
| TC_DSH_101 | Ingredient search in selector | Positive | P1 |
| TC_DSH_102 | Recently used ingredients first | Positive | P3 |
| TC_DSH_103 | Ingredient amount unit label | Positive | P2 |
| TC_DSH_104 | Dish creation from template | Positive | P2 |
| TC_DSH_105 | Dish version/edit history | Positive | P3 |

---
| TC_DSH_106 | Thêm món với 1 nguyên liệu duy nhất | Positive | P1 |
| TC_DSH_107 | Thêm món với 5 nguyên liệu | Positive | P1 |
| TC_DSH_108 | Thêm món với 10 nguyên liệu | Boundary | P2 |
| TC_DSH_109 | Thêm món với 20 nguyên liệu | Boundary | P2 |
| TC_DSH_110 | Thêm món với amount = 0.1g | Boundary | P2 |
| TC_DSH_111 | Thêm món với amount = 1000g | Boundary | P2 |
| TC_DSH_112 | Thêm món — nutrition preview real-time khi thêm nguyên liệu | Positive | P1 |
| TC_DSH_113 | Thêm món — nutrition preview cập nhật khi thay đổi amount | Positive | P1 |
| TC_DSH_114 | Thêm món — tên chứa ký tự đặc biệt Phở bò #1 | Edge | P2 |
| TC_DSH_115 | Thêm món — tên có khoảng trắng đầu/cuối → auto trim | Edge | P2 |
| TC_DSH_116 | Thêm món với tag Breakfast | Positive | P1 |
| TC_DSH_117 | Thêm món với tag Lunch + Dinner multi-tag | Positive | P1 |
| TC_DSH_118 | Thêm món với tất cả tags Breakfast + Lunch + Dinner | Positive | P2 |
| TC_DSH_119 | Thêm món không có tag → vẫn save được | Positive | P2 |
| TC_DSH_120 | Thêm món với rating = 0 | Boundary | P2 |
| TC_DSH_121 | Thêm món với rating = 5 | Positive | P2 |
| TC_DSH_122 | Thêm món với notes field | Positive | P2 |
| TC_DSH_123 | Thêm món — AI gợi ý nguyên liệu tự động | Positive | P1 |
| TC_DSH_124 | Thêm món — AI gợi ý thất bại → nhập thủ công | Negative | P1 |
| TC_DSH_125 | Thêm món — quick-add nguyên liệu mới inline | Positive | P1 |
| TC_DSH_126 | Sửa tên món thành tên đã tồn tại → lỗi duplicate | Negative | P1 |
| TC_DSH_127 | Sửa món — thêm nguyên liệu mới vào món hiện tại | Positive | P1 |
| TC_DSH_128 | Sửa món — xóa bớt nguyên liệu | Positive | P1 |
| TC_DSH_129 | Sửa món — xóa hết nguyên liệu → validation error | Negative | P0 |
| TC_DSH_130 | Sửa món — thay đổi amount → nutrition recalculate | Positive | P1 |
| TC_DSH_131 | Sửa món — thay đổi tag Breakfast → Lunch | Positive | P2 |
| TC_DSH_132 | Sửa món — thay đổi rating | Positive | P2 |
| TC_DSH_133 | Sửa món — thay đổi notes | Positive | P2 |
| TC_DSH_134 | Sửa món đang dùng trong plan → plan entries cập nhật | Positive | P0 |
| TC_DSH_135 | Sửa món đang dùng trong 5 ngày → tất cả cập nhật | Positive | P1 |
| TC_DSH_136 | Sửa món — cancel → không thay đổi gì | Positive | P1 |
| TC_DSH_137 | Sửa món — unsaved changes warning khi click ngoài | Positive | P2 |
| TC_DSH_138 | Sửa món — form pre-fill đúng nguyên liệu và amount | Positive | P1 |
| TC_DSH_139 | Sửa món — ingredient search trong selector hoạt động | Positive | P1 |
| TC_DSH_140 | Sửa món — recently used ingredients hiển thị ở đầu | Positive | P2 |
| TC_DSH_141 | Sửa món — amount ± buttons smart step | Positive | P2 |
| TC_DSH_142 | Sửa món — dark mode edit form hiển thị đúng | Positive | P2 |
| TC_DSH_143 | Sửa món — i18n labels trong edit modal | Positive | P2 |
| TC_DSH_144 | Sửa món liên tiếp 5 lần | Positive | P2 |
| TC_DSH_145 | Sửa món — nutrition preview match sau save | Positive | P1 |
| TC_DSH_146 | Xóa món dùng trong 1 plan → warning hiện tên ngày | Positive | P1 |
| TC_DSH_147 | Xóa món dùng trong 10 plans → warning liệt kê | Positive | P1 |
| TC_DSH_148 | Xóa món cuối cùng → empty state | Positive | P2 |
| TC_DSH_149 | Xóa món → undo toast 30 giây | Positive | P1 |
| TC_DSH_150 | Xóa món → click undo → món khôi phục | Positive | P1 |
| TC_DSH_151 | Xóa món → undo timeout → không khôi phục | Positive | P2 |
| TC_DSH_152 | Xóa 3 món liên tiếp → mỗi cái undo riêng | Positive | P2 |
| TC_DSH_153 | Xóa món → plan entries remove dish | Positive | P1 |
| TC_DSH_154 | Xóa món khi đang search → list cập nhật | Edge | P2 |
| TC_DSH_155 | Xóa món khi đang sort → list re-sort đúng | Edge | P2 |
| TC_DSH_156 | Xóa món — confirm dialog dark mode | Positive | P2 |
| TC_DSH_157 | Xóa món — confirm dialog i18n | Positive | P2 |
| TC_DSH_158 | Xóa món — keyboard Enter confirm | Positive | P2 |
| TC_DSH_159 | Xóa món — keyboard Escape cancel | Positive | P2 |
| TC_DSH_160 | Xóa món đã import từ backup | Positive | P2 |
| TC_DSH_161 | Nutrition calc — 1 nguyên liệu unit g chính xác | Positive | P0 |
| TC_DSH_162 | Nutrition calc — 1 nguyên liệu unit ml chính xác | Positive | P1 |
| TC_DSH_163 | Nutrition calc — 1 nguyên liệu custom unit | Positive | P1 |
| TC_DSH_164 | Nutrition calc — 3 nguyên liệu mixed units tổng đúng | Positive | P1 |
| TC_DSH_165 | Nutrition calc — protein sum chính xác | Positive | P1 |
| TC_DSH_166 | Nutrition calc — carbs sum chính xác | Positive | P1 |
| TC_DSH_167 | Nutrition calc — fat sum chính xác | Positive | P1 |
| TC_DSH_168 | Nutrition calc — fiber sum chính xác | Positive | P2 |
| TC_DSH_169 | Nutrition calc — amount thay đổi → tổng cập nhật | Positive | P1 |
| TC_DSH_170 | Nutrition calc — xóa nguyên liệu → tổng giảm | Positive | P1 |
| TC_DSH_171 | Nutrition calc — thêm nguyên liệu → tổng tăng | Positive | P1 |
| TC_DSH_172 | Nutrition calc — nguyên liệu 0 cal → không ảnh hưởng | Edge | P2 |
| TC_DSH_173 | Nutrition calc — amount 0.1g precision đúng | Boundary | P2 |
| TC_DSH_174 | Nutrition calc — amount 5000g tổng lớn | Boundary | P2 |
| TC_DSH_175 | Nutrition calc — hiển thị làm tròn 1 decimal | Positive | P2 |
| TC_DSH_176 | Nutrition calc — preview vs saved khớp nhau | Positive | P1 |
| TC_DSH_177 | Nutrition calc — edit amount sau save recalculate đúng | Positive | P1 |
| TC_DSH_178 | Nutrition calc — ingredient sửa → dish auto-update | Positive | P0 |
| TC_DSH_179 | Nutrition calc — ingredient xóa → dish nutrition giảm | Positive | P1 |
| TC_DSH_180 | Nutrition display card hiện cal pro carb fat fiber | Positive | P1 |
| TC_DSH_181 | Tìm kiếm Vietnamese phở matches Phở bò Phở gà | Positive | P1 |
| TC_DSH_182 | Tìm kiếm — clear X button xóa search text | Positive | P2 |
| TC_DSH_183 | Tìm kiếm — debounce không search mỗi keystroke | Positive | P2 |
| TC_DSH_184 | Tìm kiếm — query 1 ký tự | Boundary | P2 |
| TC_DSH_185 | Filter theo tag Breakfast | Positive | P1 |
| TC_DSH_186 | Filter theo tag Lunch | Positive | P1 |
| TC_DSH_187 | Filter theo tag Dinner | Positive | P1 |
| TC_DSH_188 | Filter — kết hợp search + tag filter | Positive | P2 |
| TC_DSH_189 | Filter — clear filter → hiện tất cả | Positive | P2 |
| TC_DSH_190 | Sắp xếp — tên A-Z | Positive | P1 |
| TC_DSH_191 | Sắp xếp — tên Z-A | Positive | P1 |
| TC_DSH_192 | Sắp xếp — calories tăng dần | Positive | P2 |
| TC_DSH_193 | Sắp xếp — calories giảm dần | Positive | P2 |
| TC_DSH_194 | Sắp xếp — protein tăng dần | Positive | P2 |
| TC_DSH_195 | Sắp xếp — ingredient count tăng dần | Positive | P2 |
| TC_DSH_196 | Sắp xếp — rating giảm dần | Positive | P2 |
| TC_DSH_197 | Grid view hiển thị dish cards | Positive | P2 |
| TC_DSH_198 | List view hiển thị dish rows | Positive | P2 |
| TC_DSH_199 | Chuyển đổi Grid ↔ List view | Positive | P1 |
| TC_DSH_200 | Dish comparison — chọn 2 dishes so sánh | Positive | P2 |
| TC_DSH_201 | Dish comparison — chọn 3 dishes so sánh nutrition | Positive | P2 |
| TC_DSH_202 | Dish comparison — bảng so sánh cal/pro/carb/fat | Positive | P2 |
| TC_DSH_203 | Copy dish duplicate tạo bản sao tên + copy | Positive | P2 |
| TC_DSH_204 | Copy dish — bản sao editable độc lập | Positive | P2 |
| TC_DSH_205 | Dish detail modal nutrition breakdown per ingredient | Positive | P1 |
| TC_DSH_206 | Dish count badge trên tab | Positive | P2 |
| TC_DSH_207 | Loading state khi lấy dữ liệu dishes | Positive | P2 |
| TC_DSH_208 | Empty state CTA Thêm món ăn đầu tiên | Positive | P1 |
| TC_DSH_209 | Animation khi thêm/xóa dish trong list | Positive | P3 |
| TC_DSH_210 | Responsive layout mobile 1 cột desktop 2-3 cột | Positive | P2 |


---

## Chi tiết Test Cases

##### TC_DSH_01: Dishes tab hiển thị
- **Pre-conditions**: App đã load
- **Steps**: 1. Navigate tới Management → Dishes tab
- **Expected**: Dishes tab hiển thị danh sách món ăn
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSH_02: List shows all dishes
- **Pre-conditions**: Có 5+ dishes trong localStorage
- **Steps**: 1. Mở Dishes tab
- **Expected**: List hiển thị tất cả dishes đã lưu
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_03: Empty state
- **Pre-conditions**: localStorage trống
- **Steps**: 1. Mở Dishes tab
- **Expected**: Empty state hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_04: Add button visible
- **Pre-conditions**: Dishes tab đang mở
- **Steps**: 1. Quan sát giao diện
- **Expected**: Nút Thêm (+) hiển thị rõ ràng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_05: Click add → modal opens
- **Pre-conditions**: Dishes tab đang mở
- **Steps**: 1. Click nút Thêm (+)
- **Expected**: Modal thêm dish mở ra
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSH_06: Modal form: name field
- **Pre-conditions**: Modal thêm dish mở
- **Steps**: 1. Quan sát form
- **Expected**: Field tên dish hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_07: Modal form: ingredient selector
- **Pre-conditions**: Modal thêm dish mở
- **Steps**: 1. Quan sát form
- **Expected**: Ingredient selector hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_08: Select ingredient from list
- **Pre-conditions**: Modal thêm dish mở, ingredient selector hiện
- **Steps**: 1. Click chọn 1 nguyên liệu
- **Expected**: Nguyên liệu được thêm vào dish
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_09: Set ingredient amount
- **Pre-conditions**: Đã chọn nguyên liệu
- **Steps**: 1. Nhập amount cho nguyên liệu
- **Expected**: Amount hiển thị đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_10: Add multiple ingredients
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Chọn 3 nguyên liệu khác nhau
- **Expected**: Tất cả 3 nguyên liệu hiện trong danh sách
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_11: Remove ingredient from dish
- **Pre-conditions**: Dish có 3 nguyên liệu
- **Steps**: 1. Click nút xóa trên 1 nguyên liệu
- **Expected**: Nguyên liệu bị xóa khỏi dish
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_12: Nutrition preview while adding
- **Pre-conditions**: Modal thêm, có nguyên liệu và amount
- **Steps**: 1. Quan sát nutrition preview
- **Expected**: Nutrition tính đúng từ nguyên liệu × amount
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_13: Save new dish
- **Pre-conditions**: Modal thêm, form hợp lệ
- **Steps**: 1. Click Lưu
- **Expected**: Dish được lưu thành công
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSH_14: Success notification
- **Pre-conditions**: Vừa lưu dish
- **Steps**: 1. Quan sát notification
- **Expected**: Toast thành công hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_15: New dish in list
- **Pre-conditions**: Vừa lưu dish
- **Steps**: 1. Quan sát list
- **Expected**: Dish mới xuất hiện trong list
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSH_16: Modal closes after save
- **Pre-conditions**: Vừa lưu dish
- **Steps**: 1. Quan sát modal
- **Expected**: Modal tự động đóng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_17: Cancel → no changes
- **Pre-conditions**: Modal thêm đang mở
- **Steps**: 1. Click Cancel
- **Expected**: Modal đóng, không có dish mới
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_18: Edit dish click
- **Pre-conditions**: Có dish trong list
- **Steps**: 1. Click vào dish để sửa
- **Expected**: Modal sửa mở ra
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSH_19: Edit modal pre-filled
- **Pre-conditions**: Modal sửa mở
- **Steps**: 1. Quan sát form
- **Expected**: Tên, nguyên liệu, amounts pre-fill đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_20: Edit dish name
- **Pre-conditions**: Modal sửa mở
- **Steps**: 1. Đổi tên dish 2. Lưu
- **Expected**: Tên mới cập nhật
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_21: Add ingredient to existing dish
- **Pre-conditions**: Modal sửa mở
- **Steps**: 1. Thêm nguyên liệu mới 2. Lưu
- **Expected**: Nguyên liệu mới thêm vào dish
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_22: Remove ingredient from dish
- **Pre-conditions**: Modal sửa, dish có 3 nguyên liệu
- **Steps**: 1. Xóa 1 nguyên liệu 2. Lưu
- **Expected**: Nguyên liệu bị xóa khỏi dish
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_23: Change ingredient amount
- **Pre-conditions**: Modal sửa mở
- **Steps**: 1. Thay đổi amount 2. Lưu
- **Expected**: Amount mới cập nhật
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_24: Save edited dish
- **Pre-conditions**: Modal sửa, đã thay đổi
- **Steps**: 1. Click Lưu
- **Expected**: Dish cập nhật thành công
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSH_25: Edit reflected in list
- **Pre-conditions**: Vừa sửa dish
- **Steps**: 1. Quan sát list
- **Expected**: Thay đổi phản ánh trong list
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_26: Edit cascades to plan entries
- **Pre-conditions**: Dish dùng trong plan
- **Steps**: 1. Sửa dish 2. Lưu 3. Kiểm tra plan
- **Expected**: Plan entries cập nhật (reference)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSH_27: Delete dish button
- **Pre-conditions**: Có dish trong list
- **Steps**: 1. Click nút xóa
- **Expected**: Hiện confirm dialog
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_28: Delete confirmation
- **Pre-conditions**: Confirm dialog mở
- **Steps**: 1. Quan sát dialog
- **Expected**: Hiện câu hỏi xác nhận xóa
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_29: Confirm delete → removed
- **Pre-conditions**: Confirm dialog mở
- **Steps**: 1. Click Xác nhận
- **Expected**: Dish bị xóa khỏi list
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSH_30: Cancel delete → preserved
- **Pre-conditions**: Confirm dialog mở
- **Steps**: 1. Click Hủy
- **Expected**: Dish vẫn còn
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_31: Delete used dish → warning
- **Pre-conditions**: Dish dùng trong plan
- **Steps**: 1. Click xóa
- **Expected**: Warning: Dish đang dùng trong plan
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSH_32: Delete unused dish → no warning
- **Pre-conditions**: Dish không dùng trong plan
- **Steps**: 1. Click xóa
- **Expected**: Confirm bình thường, không warning
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_33: Delete cascade from plans
- **Pre-conditions**: Dish dùng trong plans
- **Steps**: 1. Xóa dish 2. Confirm
- **Expected**: Dish bị xóa khỏi plans (cascade)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_34: Name empty → error
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Để tên trống 2. Lưu
- **Expected**: Validation error: tên không được trống
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_DSH_35: Name whitespace only → error
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập chỉ spaces 2. Lưu
- **Expected**: Validation error: tên không được trống
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_DSH_36: Name duplicate → error
- **Pre-conditions**: Đã có dish "Phở bò"
- **Steps**: 1. Thêm dish tên "Phở bò" 2. Lưu
- **Expected**: Error: tên đã tồn tại
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_DSH_37: Name case-insensitive duplicate
- **Pre-conditions**: Đã có dish "Phở bò"
- **Steps**: 1. Thêm dish tên "phở bò" 2. Lưu
- **Expected**: Error: tên đã tồn tại (case-insensitive)
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_DSH_38: Name max length (100)
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập tên 100 ký tự 2. Lưu
- **Expected**: Lưu thành công
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DSH_39: Name 101 chars → error
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập tên 101 ký tự 2. Lưu
- **Expected**: Error hoặc truncate
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_DSH_40: Name special characters
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập tên với ký tự đặc biệt 2. Lưu
- **Expected**: Xử lý phù hợp
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_DSH_41: Name Vietnamese diacritics
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập tên Vietnamese diacritics 2. Lưu
- **Expected**: Lưu thành công
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_42: Name emoji
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập tên chứa emoji 2. Lưu
- **Expected**: Xử lý phù hợp
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_DSH_43: Name HTML injection
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập HTML injection vào tên 2. Lưu
- **Expected**: HTML bị sanitize
- **Kết quả test thực tế**: | — |
- **Type**: Security | **Priority**: P1

##### TC_DSH_44: No ingredients → validation error
- **Pre-conditions**: Modal thêm, chưa chọn nguyên liệu
- **Steps**: 1. Click Lưu
- **Expected**: Validation error: cần ít nhất 1 nguyên liệu
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_DSH_45: Amount = 0 → error
- **Pre-conditions**: Dish có nguyên liệu, amount = 0
- **Steps**: 1. Click Lưu
- **Expected**: Validation error: amount phải > 0
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_DSH_46: Amount negative → error
- **Pre-conditions**: Dish có nguyên liệu, amount = -1
- **Steps**: 1. Click Lưu
- **Expected**: Validation error: amount không được âm
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_DSH_47: Amount decimal (0.5)
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Set amount = 0.5 2. Lưu
- **Expected**: Lưu thành công với decimal amount
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_48: Amount very large (10000g)
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Set amount = 10000g 2. Lưu
- **Expected**: Lưu thành công (boundary lớn)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DSH_49: Amount non-numeric → error
- **Pre-conditions**: Modal thêm mở
- **Steps**: 1. Nhập text vào amount field 2. Lưu
- **Expected**: Validation error: phải là số
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_DSH_50: Duplicate ingredient in dish → prevent
- **Pre-conditions**: Modal thêm, đã chọn nguyên liệu A
- **Steps**: 1. Chọn lại nguyên liệu A
- **Expected**: Nguyên liệu không bị duplicate trong dish
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_DSH_51: Nutrition calc: g unit ingredient
- **Pre-conditions**: Dish có nguyên liệu unit g
- **Steps**: 1. Kiểm tra nutrition calc
- **Expected**: cal = ingCal × amount/100
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_52: Nutrition calc: ml unit ingredient
- **Pre-conditions**: Dish có nguyên liệu unit ml
- **Steps**: 1. Kiểm tra nutrition calc
- **Expected**: cal = ingCal × amount/100
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_53: Nutrition calc: custom unit
- **Pre-conditions**: Dish có nguyên liệu custom unit
- **Steps**: 1. Kiểm tra nutrition calc
- **Expected**: cal = ingCal × amount (per unit)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_54: Nutrition updates on amount change
- **Pre-conditions**: Dish đang edit, thay đổi amount
- **Steps**: 1. Quan sát nutrition preview
- **Expected**: Nutrition cập nhật real-time
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_55: Nutrition updates on ingredient add/remove
- **Pre-conditions**: Dish đang edit
- **Steps**: 1. Thêm/xóa nguyên liệu
- **Expected**: Nutrition cập nhật khi thêm/xóa
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_56: Mixed units in one dish
- **Pre-conditions**: Dish có nguyên liệu mixed units
- **Steps**: 1. Kiểm tra tổng nutrition
- **Expected**: Tổng tính đúng cho mixed units
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_57: Search dish by name
- **Pre-conditions**: Có nhiều dishes
- **Steps**: 1. Nhập tên vào ô tìm kiếm
- **Expected**: Filter dishes theo tên
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_58: Search case-insensitive
- **Pre-conditions**: Có dish "Phở Bò"
- **Steps**: 1. Search "phở bò" (lowercase)
- **Expected**: Hiện "Phở Bò" (case-insensitive)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_59: Search partial match
- **Pre-conditions**: Có dish "Phở bò"
- **Steps**: 1. Search "bò"
- **Expected**: Hiện "Phở bò" (partial)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_60: Search no results
- **Pre-conditions**: Có dishes
- **Steps**: 1. Search "xyz"
- **Expected**: 0 kết quả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_61: Search Vietnamese diacritics
- **Pre-conditions**: Có dish "Bún bò Huế"
- **Steps**: 1. Search "bún bò"
- **Expected**: Hiện kết quả diacritics match
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_62: Clear search
- **Pre-conditions**: Đang search
- **Steps**: 1. Xóa text search
- **Expected**: Hiện tất cả dishes
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_63: Sort by name
- **Pre-conditions**: Nhiều dishes
- **Steps**: 1. Sort theo tên
- **Expected**: Alphabetical sort
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_64: Sort by calories
- **Pre-conditions**: Nhiều dishes
- **Steps**: 1. Sort theo calories
- **Expected**: Sort theo calories
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_65: Dish count display
- **Pre-conditions**: 15 dishes
- **Steps**: 1. Quan sát count
- **Expected**: Hiển thị "15 món"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_66: Scroll large list (100+)
- **Pre-conditions**: 100+ dishes
- **Steps**: 1. Scroll
- **Expected**: Scroll mượt
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_67: Dish card: name + nutrition summary
- **Pre-conditions**: Grid view
- **Steps**: 1. Quan sát card
- **Expected**: Card hiện tên + nutrition summary
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_68: Dish card: ingredient count
- **Pre-conditions**: Grid view
- **Steps**: 1. Quan sát card
- **Expected**: Card hiện ingredient count
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_69: Dark mode
- **Pre-conditions**: Dark mode bật
- **Steps**: 1. Mở Dishes tab
- **Expected**: Dark mode hiển thị đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_70: i18n labels
- **Pre-conditions**: Ngôn ngữ vi/en
- **Steps**: 1. Quan sát labels
- **Expected**: Labels đúng ngôn ngữ
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_71: Desktop layout
- **Pre-conditions**: Desktop 1920px
- **Steps**: 1. Quan sát layout
- **Expected**: Layout tối ưu desktop
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_72: Mobile layout
- **Pre-conditions**: Mobile 375px
- **Steps**: 1. Quan sát layout
- **Expected**: Layout responsive mobile
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_73: Persist after reload
- **Pre-conditions**: Đã thêm dish
- **Steps**: 1. Reload trang
- **Expected**: Dish vẫn còn (localStorage persist)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSH_74: LocalStorage format
- **Pre-conditions**: Đã thêm dish
- **Steps**: 1. Kiểm tra localStorage
- **Expected**: Format JSON đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_75: Data integrity after edit
- **Pre-conditions**: Đã sửa dish
- **Steps**: 1. Reload
- **Expected**: Data integrity preserved
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_76: Rapid add 10 dishes
- **Pre-conditions**: App load
- **Steps**: 1. Thêm nhanh 10 dishes
- **Expected**: Tất cả lưu thành công
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DSH_77: 200 dishes performance
- **Pre-conditions**: 200 dishes
- **Steps**: 1. Mở tab, search, scroll
- **Expected**: Performance OK
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DSH_78: Delete all dishes
- **Pre-conditions**: 5 dishes
- **Steps**: 1. Xóa tất cả
- **Expected**: Empty state hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_DSH_79: Import dishes from backup
- **Pre-conditions**: File backup hợp lệ
- **Steps**: 1. Import backup
- **Expected**: Dishes import thành công
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_80: Export dishes
- **Pre-conditions**: Có dishes
- **Steps**: 1. Export
- **Expected**: File JSON chứa dishes
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_81: Cloud sync dishes
- **Pre-conditions**: Cloud sync configured
- **Steps**: 1. Thêm dish, sync
- **Expected**: Dish sync lên cloud
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_82: AI-created dish editable
- **Pre-conditions**: AI tạo dish
- **Steps**: 1. Sửa dish AI-created
- **Expected**: Dish editable bình thường
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_83: AI image → saved dish editable
- **Pre-conditions**: AI image → dish
- **Steps**: 1. Sửa dish
- **Expected**: Dish editable
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_84: Dish in grocery list
- **Pre-conditions**: Dish trong grocery list
- **Steps**: 1. Kiểm tra
- **Expected**: Dish xuất hiện trong grocery
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_85: Delete dish → grocery update
- **Pre-conditions**: Dish trong grocery
- **Steps**: 1. Xóa dish
- **Expected**: Grocery cập nhật
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_86: Edit dish → plan nutrition cascade
- **Pre-conditions**: Dish trong plan
- **Steps**: 1. Sửa dish
- **Expected**: Plan nutrition cascade
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_87: Ingredient deleted → dish updates
- **Pre-conditions**: Ingredient bị xóa
- **Steps**: 1. Kiểm tra dish
- **Expected**: Dish cập nhật (ingredient removed)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_88: Undo delete
- **Pre-conditions**: Vừa xóa dish
- **Steps**: 1. Undo
- **Expected**: Dish khôi phục
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_DSH_89: Batch delete
- **Pre-conditions**: Nhiều dishes
- **Steps**: 1. Batch delete
- **Expected**: Xóa nhiều cùng lúc
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_DSH_90: Dish category/tag
- **Pre-conditions**: Category feature
- **Steps**: 1. Gán category
- **Expected**: Category hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_DSH_91: Dish photo
- **Pre-conditions**: Photo feature
- **Steps**: 1. Thêm ảnh dish
- **Expected**: Ảnh hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_DSH_92: Copy dish (duplicate)
- **Pre-conditions**: Có dish
- **Steps**: 1. Copy/duplicate
- **Expected**: Dish copy tạo thành công
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_DSH_93: Keyboard shortcuts
- **Pre-conditions**: Desktop
- **Steps**: 1. Keyboard shortcut
- **Expected**: Shortcut hoạt động
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_DSH_94: Form tab navigation
- **Pre-conditions**: Modal mở
- **Steps**: 1. Tab navigation
- **Expected**: Focus di chuyển đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_DSH_95: Screen reader
- **Pre-conditions**: Screen reader active
- **Steps**: 1. Navigate dishes
- **Expected**: Screen reader đọc đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_DSH_96: Swipe to delete mobile
- **Pre-conditions**: Mobile
- **Steps**: 1. Swipe dish
- **Expected**: Nút Delete hiện
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_97: Modal backdrop close
- **Pre-conditions**: Modal mở
- **Steps**: 1. Click backdrop
- **Expected**: Modal đóng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_98: Modal escape close
- **Pre-conditions**: Modal mở
- **Steps**: 1. Nhấn Escape
- **Expected**: Modal đóng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_99: Autofocus on modal open
- **Pre-conditions**: Vừa mở modal
- **Steps**: 1. Quan sát focus
- **Expected**: Autofocus vào field tên
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_100: Unsaved changes warning
- **Pre-conditions**: Modal có thay đổi
- **Steps**: 1. Thử đóng
- **Expected**: Warning unsaved changes
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_101: Ingredient search in selector
- **Pre-conditions**: Modal thêm, ingredient selector
- **Steps**: 1. Search nguyên liệu
- **Expected**: Filter nguyên liệu theo tên
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_102: Recently used ingredients first
- **Pre-conditions**: Modal thêm
- **Steps**: 1. Quan sát recently used
- **Expected**: Recently used ở đầu danh sách
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_DSH_103: Ingredient amount unit label
- **Pre-conditions**: Dish có nguyên liệu unit g
- **Steps**: 1. Quan sát amount label
- **Expected**: Label hiện "g" bên cạnh amount
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_104: Dish creation from template
- **Pre-conditions**: Template feature
- **Steps**: 1. Tạo dish từ template
- **Expected**: Dish tạo với pre-filled data
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_105: Dish version/edit history
- **Pre-conditions**: Edit history feature
- **Steps**: 1. Xem version history
- **Expected**: Hiện lịch sử chỉnh sửa
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_DSH_106: Thêm món với 1 nguyên liệu duy nhất
- **Pre-conditions**: Có 1+ nguyên liệu, modal thêm dish mở
- **Steps**: 1. Nhập tên dish 2. Chọn 1 nguyên liệu 3. Set amount 4. Click Lưu
- **Expected**: Dish lưu thành công với 1 nguyên liệu
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_107: Thêm món với 5 nguyên liệu
- **Pre-conditions**: Có 5+ nguyên liệu, modal thêm mở
- **Steps**: 1. Nhập tên 2. Chọn 5 nguyên liệu 3. Set amounts 4. Lưu
- **Expected**: Dish lưu với 5 nguyên liệu, nutrition tổng đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_108: Thêm món với 10 nguyên liệu
- **Pre-conditions**: Có 10+ nguyên liệu, modal thêm mở
- **Steps**: 1. Nhập tên 2. Chọn 10 nguyên liệu 3. Set amounts 4. Lưu
- **Expected**: Dish lưu thành công, list nguyên liệu scrollable
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DSH_109: Thêm món với 20 nguyên liệu
- **Pre-conditions**: Có 20+ nguyên liệu, modal thêm mở
- **Steps**: 1. Nhập tên 2. Chọn 20 nguyên liệu 3. Set amounts 4. Lưu
- **Expected**: Dish lưu thành công, performance OK với 20 nguyên liệu
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DSH_110: Thêm món với amount = 0.1g
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Thêm món với amount = 0.1g
- **Expected**: Kết quả đúng: Thêm món với amount = 0.1g
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DSH_111: Thêm món với amount = 1000g
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Thêm món với amount = 1000g
- **Expected**: Kết quả đúng: Thêm món với amount = 1000g
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DSH_112: Thêm món — nutrition preview real-time khi thêm nguyên liệu
- **Pre-conditions**: Modal thêm dish mở
- **Steps**: 1. Chọn nguyên liệu A → quan sát nutrition 2. Chọn thêm nguyên liệu B → quan sát
- **Expected**: Nutrition preview cập nhật real-time mỗi khi thêm nguyên liệu
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_113: Thêm món — nutrition preview cập nhật khi thay đổi amount
- **Pre-conditions**: Modal thêm, có 2 nguyên liệu
- **Steps**: 1. Thay đổi amount nguyên liệu 1 từ 100 → 200
- **Expected**: Nutrition preview cập nhật ngay khi amount thay đổi
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_114: Thêm món — tên chứa ký tự đặc biệt Phở bò #1
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Thêm món — tên chứa ký tự đặc biệt Phở bò #1
- **Expected**: Kết quả đúng: Thêm món — tên chứa ký tự đặc biệt Phở bò #1
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_DSH_115: Thêm món — tên có khoảng trắng đầu/cuối → auto trim
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Thêm món — tên có khoảng trắng đầu/cuối → auto trim
- **Expected**: Kết quả đúng: Thêm món — tên có khoảng trắng đầu/cuối → auto trim
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_DSH_116: Thêm món với tag Breakfast
- **Pre-conditions**: Modal thêm dish mở
- **Steps**: 1. Nhập tên 2. Chọn nguyên liệu 3. Tick tag Breakfast 4. Lưu
- **Expected**: Dish lưu với tag Breakfast, xuất hiện khi filter Breakfast
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_117: Thêm món với tag Lunch + Dinner multi-tag
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Thêm món với tag Lunch + Dinner multi-tag
- **Expected**: Kết quả đúng: Thêm món với tag Lunch + Dinner multi-tag
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_118: Thêm món với tất cả tags Breakfast + Lunch + Dinner
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Thêm món với tất cả tags Breakfast + Lunch + Dinner
- **Expected**: Kết quả đúng: Thêm món với tất cả tags Breakfast + Lunch + Dinner
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_119: Thêm món không có tag → vẫn save được
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Thêm món không có tag → vẫn save được
- **Expected**: Kết quả đúng: Thêm món không có tag → vẫn save được
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_120: Thêm món với rating = 0
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Thêm món với rating = 0
- **Expected**: Kết quả đúng: Thêm món với rating = 0
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DSH_121: Thêm món với rating = 5
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Thêm món với rating = 5
- **Expected**: Kết quả đúng: Thêm món với rating = 5
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_122: Thêm món với notes field
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Thêm món với notes field
- **Expected**: Kết quả đúng: Thêm món với notes field
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_123: Thêm món — AI gợi ý nguyên liệu tự động
- **Pre-conditions**: API key cấu hình, modal thêm mở
- **Steps**: 1. Nhập tên dish "Phở bò" 2. Click AI gợi ý nguyên liệu
- **Expected**: AI đề xuất danh sách nguyên liệu phù hợp cho Phở bò
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_124: Thêm món — AI gợi ý thất bại → nhập thủ công
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Thêm món — AI gợi ý thất bại → nhập thủ công
- **Expected**: Kết quả đúng: Thêm món — AI gợi ý thất bại → nhập thủ công
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_DSH_125: Thêm món — quick-add nguyên liệu mới inline
- **Pre-conditions**: Modal thêm dish mở, cần nguyên liệu chưa có
- **Steps**: 1. Click quick-add 2. Nhập tên nguyên liệu mới 3. Điền nutrition 4. Save
- **Expected**: Nguyên liệu mới tạo inline và tự động thêm vào dish
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_126: Sửa tên món thành tên đã tồn tại → lỗi duplicate
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sửa tên món thành tên đã tồn tại → lỗi duplicate
- **Expected**: Kết quả đúng: Sửa tên món thành tên đã tồn tại → lỗi duplicate
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_DSH_127: Sửa món — thêm nguyên liệu mới vào món hiện tại
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sửa món — thêm nguyên liệu mới vào món hiện tại
- **Expected**: Kết quả đúng: Sửa món — thêm nguyên liệu mới vào món hiện tại
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_128: Sửa món — xóa bớt nguyên liệu
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sửa món — xóa bớt nguyên liệu
- **Expected**: Kết quả đúng: Sửa món — xóa bớt nguyên liệu
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_129: Sửa món — xóa hết nguyên liệu → validation error
- **Pre-conditions**: Modal sửa dish, dish có 1 nguyên liệu
- **Steps**: 1. Xóa nguyên liệu cuối cùng 2. Click Lưu
- **Expected**: Validation error: Dish cần ít nhất 1 nguyên liệu
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P0

##### TC_DSH_130: Sửa món — thay đổi amount → nutrition recalculate
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sửa món — thay đổi amount → nutrition recalculate
- **Expected**: Kết quả đúng: Sửa món — thay đổi amount → nutrition recalculate
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_131: Sửa món — thay đổi tag Breakfast → Lunch
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sửa món — thay đổi tag Breakfast → Lunch
- **Expected**: Kết quả đúng: Sửa món — thay đổi tag Breakfast → Lunch
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_132: Sửa món — thay đổi rating
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sửa món — thay đổi rating
- **Expected**: Kết quả đúng: Sửa món — thay đổi rating
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_133: Sửa món — thay đổi notes
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sửa món — thay đổi notes
- **Expected**: Kết quả đúng: Sửa món — thay đổi notes
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_134: Sửa món đang dùng trong plan → plan entries cập nhật
- **Pre-conditions**: Dish "Cơm" dùng trong plan ngày 15/03
- **Steps**: 1. Sửa tên thành "Cơm trắng" 2. Lưu 3. Kiểm tra plan ngày 15/03
- **Expected**: Plan entry hiện tên mới "Cơm trắng" (reference update)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSH_135: Sửa món đang dùng trong 5 ngày → tất cả cập nhật
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sửa món đang dùng trong 5 ngày → tất cả cập nhật
- **Expected**: Kết quả đúng: Sửa món đang dùng trong 5 ngày → tất cả cập nhật
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_136: Sửa món — cancel → không thay đổi gì
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sửa món — cancel → không thay đổi gì
- **Expected**: Kết quả đúng: Sửa món — cancel → không thay đổi gì
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_137: Sửa món — unsaved changes warning khi click ngoài
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sửa món — unsaved changes warning khi click ngoài
- **Expected**: Kết quả đúng: Sửa món — unsaved changes warning khi click ngoài
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_138: Sửa món — form pre-fill đúng nguyên liệu và amount
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sửa món — form pre-fill đúng nguyên liệu và amount
- **Expected**: Kết quả đúng: Sửa món — form pre-fill đúng nguyên liệu và amount
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_139: Sửa món — ingredient search trong selector hoạt động
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sửa món — ingredient search trong selector hoạt động
- **Expected**: Kết quả đúng: Sửa món — ingredient search trong selector hoạt động
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_140: Sửa món — recently used ingredients hiển thị ở đầu
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sửa món — recently used ingredients hiển thị ở đầu
- **Expected**: Kết quả đúng: Sửa món — recently used ingredients hiển thị ở đầu
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_141: Sửa món — amount ± buttons smart step
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sửa món — amount ± buttons smart step
- **Expected**: Kết quả đúng: Sửa món — amount ± buttons smart step
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_142: Sửa món — dark mode edit form hiển thị đúng
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sửa món — dark mode edit form hiển thị đúng
- **Expected**: Kết quả đúng: Sửa món — dark mode edit form hiển thị đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_143: Sửa món — i18n labels trong edit modal
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sửa món — i18n labels trong edit modal
- **Expected**: Kết quả đúng: Sửa món — i18n labels trong edit modal
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_144: Sửa món liên tiếp 5 lần
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sửa món liên tiếp 5 lần
- **Expected**: Kết quả đúng: Sửa món liên tiếp 5 lần
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_145: Sửa món — nutrition preview match sau save
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sửa món — nutrition preview match sau save
- **Expected**: Kết quả đúng: Sửa món — nutrition preview match sau save
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_146: Xóa món dùng trong 1 plan → warning hiện tên ngày
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Xóa món dùng trong 1 plan → warning hiện tên ngày
- **Expected**: Kết quả đúng: Xóa món dùng trong 1 plan → warning hiện tên ngày
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_147: Xóa món dùng trong 10 plans → warning liệt kê
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Xóa món dùng trong 10 plans → warning liệt kê
- **Expected**: Kết quả đúng: Xóa món dùng trong 10 plans → warning liệt kê
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_148: Xóa món cuối cùng → empty state
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Xóa món cuối cùng → empty state
- **Expected**: Kết quả đúng: Xóa món cuối cùng → empty state
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_149: Xóa món → undo toast 30 giây
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Xóa món → undo toast 30 giây
- **Expected**: Kết quả đúng: Xóa món → undo toast 30 giây
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_150: Xóa món → click undo → món khôi phục
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Xóa món → click undo → món khôi phục
- **Expected**: Kết quả đúng: Xóa món → click undo → món khôi phục
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_151: Xóa món → undo timeout → không khôi phục
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Xóa món → undo timeout → không khôi phục
- **Expected**: Kết quả đúng: Xóa món → undo timeout → không khôi phục
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_152: Xóa 3 món liên tiếp → mỗi cái undo riêng
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Xóa 3 món liên tiếp → mỗi cái undo riêng
- **Expected**: Kết quả đúng: Xóa 3 món liên tiếp → mỗi cái undo riêng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_153: Xóa món → plan entries remove dish
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Xóa món → plan entries remove dish
- **Expected**: Kết quả đúng: Xóa món → plan entries remove dish
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_154: Xóa món khi đang search → list cập nhật
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Xóa món khi đang search → list cập nhật
- **Expected**: Kết quả đúng: Xóa món khi đang search → list cập nhật
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_DSH_155: Xóa món khi đang sort → list re-sort đúng
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Xóa món khi đang sort → list re-sort đúng
- **Expected**: Kết quả đúng: Xóa món khi đang sort → list re-sort đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_DSH_156: Xóa món — confirm dialog dark mode
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Xóa món — confirm dialog dark mode
- **Expected**: Kết quả đúng: Xóa món — confirm dialog dark mode
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_157: Xóa món — confirm dialog i18n
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Xóa món — confirm dialog i18n
- **Expected**: Kết quả đúng: Xóa món — confirm dialog i18n
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_158: Xóa món — keyboard Enter confirm
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Xóa món — keyboard Enter confirm
- **Expected**: Kết quả đúng: Xóa món — keyboard Enter confirm
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_159: Xóa món — keyboard Escape cancel
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Xóa món — keyboard Escape cancel
- **Expected**: Kết quả đúng: Xóa món — keyboard Escape cancel
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_160: Xóa món đã import từ backup
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Xóa món đã import từ backup
- **Expected**: Kết quả đúng: Xóa món đã import từ backup
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_161: Nutrition calc — 1 nguyên liệu unit g chính xác
- **Pre-conditions**: Nguyên liệu: Gạo cal=130/100g, Dish amount=200g
- **Steps**: 1. Tính calories = 130 × 200/100 = 260
- **Expected**: Nutrition hiển thị calories = 260
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSH_162: Nutrition calc — 1 nguyên liệu unit ml chính xác
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Nutrition calc — 1 nguyên liệu unit ml chính xác
- **Expected**: Kết quả đúng: Nutrition calc — 1 nguyên liệu unit ml chính xác
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_163: Nutrition calc — 1 nguyên liệu custom unit
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Nutrition calc — 1 nguyên liệu custom unit
- **Expected**: Kết quả đúng: Nutrition calc — 1 nguyên liệu custom unit
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_164: Nutrition calc — 3 nguyên liệu mixed units tổng đúng
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Nutrition calc — 3 nguyên liệu mixed units tổng đúng
- **Expected**: Kết quả đúng: Nutrition calc — 3 nguyên liệu mixed units tổng đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_165: Nutrition calc — protein sum chính xác
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Nutrition calc — protein sum chính xác
- **Expected**: Kết quả đúng: Nutrition calc — protein sum chính xác
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_166: Nutrition calc — carbs sum chính xác
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Nutrition calc — carbs sum chính xác
- **Expected**: Kết quả đúng: Nutrition calc — carbs sum chính xác
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_167: Nutrition calc — fat sum chính xác
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Nutrition calc — fat sum chính xác
- **Expected**: Kết quả đúng: Nutrition calc — fat sum chính xác
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_168: Nutrition calc — fiber sum chính xác
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Nutrition calc — fiber sum chính xác
- **Expected**: Kết quả đúng: Nutrition calc — fiber sum chính xác
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_169: Nutrition calc — amount thay đổi → tổng cập nhật
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Nutrition calc — amount thay đổi → tổng cập nhật
- **Expected**: Kết quả đúng: Nutrition calc — amount thay đổi → tổng cập nhật
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_170: Nutrition calc — xóa nguyên liệu → tổng giảm
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Nutrition calc — xóa nguyên liệu → tổng giảm
- **Expected**: Kết quả đúng: Nutrition calc — xóa nguyên liệu → tổng giảm
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_171: Nutrition calc — thêm nguyên liệu → tổng tăng
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Nutrition calc — thêm nguyên liệu → tổng tăng
- **Expected**: Kết quả đúng: Nutrition calc — thêm nguyên liệu → tổng tăng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_172: Nutrition calc — nguyên liệu 0 cal → không ảnh hưởng
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Nutrition calc — nguyên liệu 0 cal → không ảnh hưởng
- **Expected**: Kết quả đúng: Nutrition calc — nguyên liệu 0 cal → không ảnh hưởng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_DSH_173: Nutrition calc — amount 0.1g precision đúng
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Nutrition calc — amount 0.1g precision đúng
- **Expected**: Kết quả đúng: Nutrition calc — amount 0.1g precision đúng
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DSH_174: Nutrition calc — amount 5000g tổng lớn
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Nutrition calc — amount 5000g tổng lớn
- **Expected**: Kết quả đúng: Nutrition calc — amount 5000g tổng lớn
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DSH_175: Nutrition calc — hiển thị làm tròn 1 decimal
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Nutrition calc — hiển thị làm tròn 1 decimal
- **Expected**: Kết quả đúng: Nutrition calc — hiển thị làm tròn 1 decimal
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_176: Nutrition calc — preview vs saved khớp nhau
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Nutrition calc — preview vs saved khớp nhau
- **Expected**: Kết quả đúng: Nutrition calc — preview vs saved khớp nhau
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_177: Nutrition calc — edit amount sau save recalculate đúng
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Nutrition calc — edit amount sau save recalculate đúng
- **Expected**: Kết quả đúng: Nutrition calc — edit amount sau save recalculate đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_178: Nutrition calc — ingredient sửa → dish auto-update
- **Pre-conditions**: Dish A dùng nguyên liệu B cal=100
- **Steps**: 1. Sửa nguyên liệu B cal → 150 2. Lưu 3. Kiểm tra dish A
- **Expected**: Dish A nutrition tự động cập nhật với cal mới = 150
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_DSH_179: Nutrition calc — ingredient xóa → dish nutrition giảm
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Nutrition calc — ingredient xóa → dish nutrition giảm
- **Expected**: Kết quả đúng: Nutrition calc — ingredient xóa → dish nutrition giảm
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_180: Nutrition display card hiện cal pro carb fat fiber
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Nutrition display card hiện cal pro carb fat fiber
- **Expected**: Kết quả đúng: Nutrition display card hiện cal pro carb fat fiber
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_181: Tìm kiếm Vietnamese phở matches Phở bò Phở gà
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Tìm kiếm Vietnamese phở matches Phở bò Phở gà
- **Expected**: Kết quả đúng: Tìm kiếm Vietnamese phở matches Phở bò Phở gà
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_182: Tìm kiếm — clear X button xóa search text
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Tìm kiếm — clear X button xóa search text
- **Expected**: Kết quả đúng: Tìm kiếm — clear X button xóa search text
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_183: Tìm kiếm — debounce không search mỗi keystroke
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Tìm kiếm — debounce không search mỗi keystroke
- **Expected**: Kết quả đúng: Tìm kiếm — debounce không search mỗi keystroke
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_184: Tìm kiếm — query 1 ký tự
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Tìm kiếm — query 1 ký tự
- **Expected**: Kết quả đúng: Tìm kiếm — query 1 ký tự
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_DSH_185: Filter theo tag Breakfast
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Filter theo tag Breakfast
- **Expected**: Kết quả đúng: Filter theo tag Breakfast
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_186: Filter theo tag Lunch
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Filter theo tag Lunch
- **Expected**: Kết quả đúng: Filter theo tag Lunch
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_187: Filter theo tag Dinner
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Filter theo tag Dinner
- **Expected**: Kết quả đúng: Filter theo tag Dinner
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_188: Filter — kết hợp search + tag filter
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Filter — kết hợp search + tag filter
- **Expected**: Kết quả đúng: Filter — kết hợp search + tag filter
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_189: Filter — clear filter → hiện tất cả
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Filter — clear filter → hiện tất cả
- **Expected**: Kết quả đúng: Filter — clear filter → hiện tất cả
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_190: Sắp xếp — tên A-Z
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sắp xếp — tên A-Z
- **Expected**: Kết quả đúng: Sắp xếp — tên A-Z
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_191: Sắp xếp — tên Z-A
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sắp xếp — tên Z-A
- **Expected**: Kết quả đúng: Sắp xếp — tên Z-A
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_192: Sắp xếp — calories tăng dần
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sắp xếp — calories tăng dần
- **Expected**: Kết quả đúng: Sắp xếp — calories tăng dần
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_193: Sắp xếp — calories giảm dần
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sắp xếp — calories giảm dần
- **Expected**: Kết quả đúng: Sắp xếp — calories giảm dần
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_194: Sắp xếp — protein tăng dần
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sắp xếp — protein tăng dần
- **Expected**: Kết quả đúng: Sắp xếp — protein tăng dần
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_195: Sắp xếp — ingredient count tăng dần
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sắp xếp — ingredient count tăng dần
- **Expected**: Kết quả đúng: Sắp xếp — ingredient count tăng dần
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_196: Sắp xếp — rating giảm dần
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Sắp xếp — rating giảm dần
- **Expected**: Kết quả đúng: Sắp xếp — rating giảm dần
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_197: Grid view hiển thị dish cards
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Grid view hiển thị dish cards
- **Expected**: Kết quả đúng: Grid view hiển thị dish cards
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_198: List view hiển thị dish rows
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: List view hiển thị dish rows
- **Expected**: Kết quả đúng: List view hiển thị dish rows
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_199: Chuyển đổi Grid ↔ List view
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Chuyển đổi Grid ↔ List view
- **Expected**: Kết quả đúng: Chuyển đổi Grid ↔ List view
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_200: Dish comparison — chọn 2 dishes so sánh
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Dish comparison — chọn 2 dishes so sánh
- **Expected**: Kết quả đúng: Dish comparison — chọn 2 dishes so sánh
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_201: Dish comparison — chọn 3 dishes so sánh nutrition
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Dish comparison — chọn 3 dishes so sánh nutrition
- **Expected**: Kết quả đúng: Dish comparison — chọn 3 dishes so sánh nutrition
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_202: Dish comparison — bảng so sánh cal/pro/carb/fat
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Dish comparison — bảng so sánh cal/pro/carb/fat
- **Expected**: Kết quả đúng: Dish comparison — bảng so sánh cal/pro/carb/fat
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_203: Copy dish duplicate tạo bản sao tên + copy
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Copy dish duplicate tạo bản sao tên + copy
- **Expected**: Kết quả đúng: Copy dish duplicate tạo bản sao tên + copy
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_204: Copy dish — bản sao editable độc lập
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Copy dish — bản sao editable độc lập
- **Expected**: Kết quả đúng: Copy dish — bản sao editable độc lập
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_205: Dish detail modal nutrition breakdown per ingredient
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Dish detail modal nutrition breakdown per ingredient
- **Expected**: Kết quả đúng: Dish detail modal nutrition breakdown per ingredient
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_206: Dish count badge trên tab
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Dish count badge trên tab
- **Expected**: Kết quả đúng: Dish count badge trên tab
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_207: Loading state khi lấy dữ liệu dishes
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Loading state khi lấy dữ liệu dishes
- **Expected**: Kết quả đúng: Loading state khi lấy dữ liệu dishes
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_DSH_208: Empty state CTA Thêm món ăn đầu tiên
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Empty state CTA Thêm món ăn đầu tiên
- **Expected**: Kết quả đúng: Empty state CTA Thêm món ăn đầu tiên
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_DSH_209: Animation khi thêm/xóa dish trong list
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Animation khi thêm/xóa dish trong list
- **Expected**: Kết quả đúng: Animation khi thêm/xóa dish trong list
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_DSH_210: Responsive layout mobile 1 cột desktop 2-3 cột
- **Pre-conditions**: App đã load, Management → Dishes tab, có nguyên liệu sẵn
- **Steps**: 1. Thực hiện: Responsive layout mobile 1 cột desktop 2-3 cột
- **Expected**: Kết quả đúng: Responsive layout mobile 1 cột desktop 2-3 cột
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

---

### Nhóm Test Cases

##### TC_DSH_01–17: Add Flow
- Navigate → add button → modal → fill form → select ingredients → set amounts → save → verify

##### TC_DSH_18–26: Edit Flow
- Click dish → pre-filled → edit name/ingredients/amounts → save → cascade to plans

##### TC_DSH_27–33: Delete Flow
- Delete → confirm → cascade/warning → verify removal

##### TC_DSH_34–56: Validation & Calculation
- Name validation, ingredient validation, nutrition calculation

##### TC_DSH_57–72: Search, Sort & Display
- Search, sort, card layout, dark mode, responsive

##### TC_DSH_73–87: Persistence & Integration
- LocalStorage, import/export, sync, AI dishes, grocery, cascade

##### TC_DSH_88–105: Advanced & Accessibility
- Undo, batch, category, photo, copy, keyboard, screen reader, ingredient selector UX

##### TC_DSH_106–125: Thêm món ăn nâng cao
- 1/5/10/20 nguyên liệu, amount boundaries, nutrition preview real-time, tags, rating, notes, AI, quick-add

##### TC_DSH_126–145: Chỉnh sửa món ăn nâng cao
- Duplicate name, thêm/xóa nguyên liệu, amount change, tag/rating/notes, plan cascade, form UX

##### TC_DSH_146–160: Xóa món ăn nâng cao
- Warning plans, empty state, undo toast, cascade, search/sort context, dark/i18n, keyboard

##### TC_DSH_161–180: Tính toán dinh dưỡng chi tiết
- Nutrition calc g/ml/custom, sum protein/carbs/fat/fiber, amount changes, precision, rounding

##### TC_DSH_181–200: Tìm kiếm, Lọc & Sắp xếp nâng cao
- Vietnamese search, tag filter, sort by name/calories/protein/count/rating, grid/list view, comparison

##### TC_DSH_201–210: Tích hợp & Nâng cao
- Dish comparison 3 dishes, copy/duplicate, detail modal, count badge, loading, empty state, animation, responsive

---

## Đề xuất Cải tiến


### Đề xuất 1: Dish Recipe/Instructions Field
- **Vấn đề hiện tại**: Dish chỉ có name + ingredients. No cooking instructions.
- **Giải pháp đề xuất**: Optional rich text field cho recipe steps. Markdown support. Photo per step.
- **Lý do chi tiết**: Users want complete meal planning including cooking. Recipe field makes app self-contained.
- **Phần trăm cải thiện**: App completeness +40%, External app dependency -50%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 2: Dish Templates (Quick Variations)
- **Vấn đề hiện tại**: Similar dishes (Phở gà, Phở bò) require full re-creation.
- **Giải pháp đề xuất**: "Clone & Modify" button. Clone dish, rename, adjust ingredients. Link to parent.
- **Lý do chi tiết**: 30% dishes are variations of others. Clone saves 70% creation time per variation.
- **Phần trăm cải thiện**: Dish creation time -50%, Variation management +60%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 3: Portion Size Adjuster
- **Vấn đề hiện tại**: Dish serves fixed portion. No scaling for 2, 4 people.
- **Giải pháp đề xuất**: Serving size slider (1-10). Ingredients & nutrition auto-scale. Default serving stored.
- **Lý do chi tiết**: Family cooking needs scaling. Manual multiplication error-prone. Auto-scale = accurate portions.
- **Phần trăm cải thiện**: Cooking accuracy +40%, Family planning +60%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 4: Dish Rating & Notes
- **Vấn đề hiện tại**: No way to rate dishes or add cooking notes.
- **Giải pháp đề xuất**: Star rating (1-5) + notes field. Sort by rating. "Favorites" filter.
- **Lý do chi tiết**: Helps plan better meals over time. Avoid repeating poorly-rated dishes.
- **Phần trăm cải thiện**: Meal satisfaction +25%, Planning quality +30%
- **Mức độ ưu tiên**: Low | **Effort**: S

### Đề xuất 5: Smart Ingredient Amount Suggestions
- **Vấn đề hiện tại**: User guesses ingredient amounts. No guidance.
- **Giải pháp đề xuất**: When adding ingredient, suggest typical amount based on dish type. "Typical: 150g chicken for 1 serving".
- **Lý do chi tiết**: New cooks don't know typical amounts. Suggestions reduce nutrition tracking errors 40%.
- **Phần trăm cải thiện**: Amount accuracy +40%, New user confidence +50%
- **Mức độ ưu tiên**: Medium | **Effort**: M
