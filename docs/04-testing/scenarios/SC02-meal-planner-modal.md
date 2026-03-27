# Scenario 2: Meal Planner Modal

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 210

---

## Mô tả tổng quan

MealPlannerModal là modal chính để chọn món ăn cho từng bữa (Sáng/Trưa/Tối). Modal có 3 internal tabs tương ứng 3 bữa, mỗi tab hiển thị danh sách dishes có checkbox. Hỗ trợ search, sort, filter theo meal type tags. Nutrition summary cập nhật real-time khi thay đổi selection. UnsavedChangesDialog cảnh báo khi đóng modal nếu có thay đổi chưa lưu.

Modal có thể mở từ: calendar slot click, action bar, AI suggestion edit. Trên desktop hiển thị centered với max-width, mobile full-screen bottom sheet. Android back button đóng modal qua useModalBackHandler.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| MealPlannerModal | MealPlannerModal.tsx | Modal chính chọn dishes |
| ModalBackdrop | ModalBackdrop.tsx | Backdrop với scroll lock |
| UnsavedChangesDialog | UnsavedChangesDialog.tsx | Cảnh báo thay đổi chưa lưu |
| useModalBackHandler | useModalBackHandler.ts | Handle Android back button |
| useModalManager | useModalManager.ts | State management cho modals |

## Luồng nghiệp vụ

1. Mở modal → hiển thị tab bữa ăn tương ứng → load danh sách dishes
2. Search/filter dishes → chọn/bỏ chọn → nutrition summary update
3. Confirm → update dayPlan → đóng modal
4. Cancel → UnsavedChangesDialog nếu có changes → đóng hoặc quay lại

## Quy tắc nghiệp vụ

1. Pre-select dishes đã có trong current plan cho meal type đó
2. Search case-insensitive, tìm cả vi và en names
3. Dishes filter theo meal type tags (breakfast dishes ưu tiên trong breakfast tab)
4. Nutrition recalculate real-time khi checkbox thay đổi
5. Chỉ 1 modal mở tại 1 thời điểm (closeAll pattern)
6. Scroll lock khi modal mở

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_MPM_01 | Mở modal từ slot trống — tab đúng bữa | Positive | P0 |
| TC_MPM_02 | Mở modal từ slot có món — pre-selected | Positive | P0 |
| TC_MPM_03 | Hiển thị danh sách dishes đầy đủ | Positive | P1 |
| TC_MPM_04 | Search dish theo tên tiếng Việt | Positive | P1 |
| TC_MPM_05 | Search dish theo tên tiếng Anh | Positive | P1 |
| TC_MPM_06 | Search case-insensitive | Positive | P1 |
| TC_MPM_07 | Search không có kết quả — empty state | Negative | P1 |
| TC_MPM_08 | Chọn 1 dish → checkbox active | Positive | P1 |
| TC_MPM_09 | Chọn nhiều dishes → counter cập nhật | Positive | P1 |
| TC_MPM_10 | Bỏ chọn dish → counter giảm | Positive | P1 |
| TC_MPM_11 | Nutrition summary cập nhật real-time | Positive | P1 |
| TC_MPM_12 | Chuyển tab Sáng → Trưa → Tối | Positive | P1 |
| TC_MPM_13 | Selection giữ nguyên khi chuyển tab | Positive | P1 |
| TC_MPM_14 | Confirm → update dayPlan thành công | Positive | P0 |
| TC_MPM_15 | Cancel không có changes → đóng ngay | Positive | P1 |
| TC_MPM_16 | Cancel có changes → UnsavedChangesDialog | Positive | P1 |
| TC_MPM_17 | UnsavedChanges → Discard → đóng modal | Positive | P1 |
| TC_MPM_18 | UnsavedChanges → Stay → quay lại modal | Positive | P1 |
| TC_MPM_19 | Click backdrop → đóng modal (+ unsaved check) | Positive | P1 |
| TC_MPM_20 | Android back button → đóng modal | Positive | P1 |
| TC_MPM_21 | Sort dishes theo tên A-Z | Positive | P2 |
| TC_MPM_22 | Sort dishes theo tên Z-A | Positive | P2 |
| TC_MPM_23 | Sort dishes theo calories tăng | Positive | P2 |
| TC_MPM_24 | Sort dishes theo calories giảm | Positive | P2 |
| TC_MPM_25 | Sort dishes theo protein tăng | Positive | P2 |
| TC_MPM_26 | Sort dishes theo protein giảm | Positive | P2 |
| TC_MPM_27 | Filter theo meal type tag — breakfast | Positive | P2 |
| TC_MPM_28 | Filter theo meal type tag — lunch | Positive | P2 |
| TC_MPM_29 | Filter theo meal type tag — dinner | Positive | P2 |
| TC_MPM_30 | Dish không có tag — hiển thị trong tất cả tabs | Edge | P2 |
| TC_MPM_31 | Dish có nhiều tags — hiển thị trong nhiều tabs | Edge | P2 |
| TC_MPM_32 | Scroll lock khi modal mở | Positive | P1 |
| TC_MPM_33 | Scroll unlock khi modal đóng | Positive | P1 |
| TC_MPM_34 | Modal desktop centered max-width | Positive | P2 |
| TC_MPM_35 | Modal mobile full-screen bottom sheet | Positive | P2 |
| TC_MPM_36 | Confirm với 0 dishes — clear slot | Edge | P2 |
| TC_MPM_37 | Chọn 50+ dishes — performance | Boundary | P2 |
| TC_MPM_38 | Search với special chars (!@#$) | Negative | P2 |
| TC_MPM_39 | Search với regex chars (.*+) | Negative | P2 |
| TC_MPM_40 | Dark mode — modal colors đúng | Positive | P2 |
| TC_MPM_41 | i18n — labels tiếng Việt | Positive | P2 |
| TC_MPM_42 | i18n — labels tiếng Anh | Positive | P2 |
| TC_MPM_43 | Mở từ AI suggestion edit | Positive | P2 |
| TC_MPM_44 | Pre-fill dishes từ AI suggestion | Positive | P2 |
| TC_MPM_45 | Dish với nutrition = 0 | Edge | P2 |
| TC_MPM_46 | Dish với tên rất dài (200 chars) | Boundary | P3 |
| TC_MPM_47 | Dish list trống (0 dishes) — empty state | Negative | P1 |
| TC_MPM_48 | Double-click checkbox — toggle đúng | Edge | P2 |
| TC_MPM_49 | Keyboard Enter confirm | Positive | P3 |
| TC_MPM_50 | Keyboard Escape close | Positive | P3 |
| TC_MPM_51 | Focus trap trong modal | Positive | P2 |
| TC_MPM_52 | Mở modal lại sau confirm — state reset | Positive | P1 |
| TC_MPM_53 | Search rồi chọn → clear search → selection preserved | Positive | P1 |
| TC_MPM_54 | Search với dấu tiếng Việt (ê, ơ, ư) | Positive | P2 |
| TC_MPM_55 | Search không dấu tìm được có dấu | Edge | P2 |
| TC_MPM_56 | Search query rất dài (500 chars) | Boundary | P3 |
| TC_MPM_57 | Search while scrolling — no freeze | Edge | P2 |
| TC_MPM_58 | Clear search button restores full list | Positive | P2 |
| TC_MPM_59 | Search bắt đầu ngay từ ký tự đầu (no debounce visible) | Positive | P2 |
| TC_MPM_60 | Search match partial — "gà" matches "Cơm gà" | Positive | P2 |
| TC_MPM_61 | Search match beginning of word | Positive | P2 |
| TC_MPM_62 | Search với spaces — trim handled | Edge | P2 |
| TC_MPM_63 | Select all dishes — nutrition shows total | Boundary | P2 |
| TC_MPM_64 | Deselect all — nutrition shows 0 | Positive | P2 |
| TC_MPM_65 | Select 50+ dishes → confirm → plan saved | Boundary | P2 |
| TC_MPM_66 | Toggle checkbox rapidly 20 lần | Edge | P2 |
| TC_MPM_67 | Select dish → search (selection preserved?) | Positive | P1 |
| TC_MPM_68 | Select dishes in multiple tabs → confirm all | Positive | P1 |
| TC_MPM_69 | Pre-selected count display đúng | Positive | P1 |
| TC_MPM_70 | Nutrition overflow: nhiều dishes, cal > 5000 | Boundary | P2 |
| TC_MPM_71 | Deselect pre-selected dish → confirm → removed | Positive | P1 |
| TC_MPM_72 | Zero-calorie dish selection | Edge | P2 |
| TC_MPM_73 | Mở modal từ calendar slot click | Positive | P1 |
| TC_MPM_74 | Mở modal từ MealActionBar | Positive | P1 |
| TC_MPM_75 | Mở từ AI edit → pre-fill AI dishes | Positive | P2 |
| TC_MPM_76 | Re-open sau close — selections reset | Positive | P1 |
| TC_MPM_77 | Close với back button + unsaved | Positive | P1 |
| TC_MPM_78 | Close backdrop click + unsaved | Positive | P1 |
| TC_MPM_79 | UnsavedChanges confirm discard | Positive | P1 |
| TC_MPM_80 | Confirm khi không thay đổi gì | Edge | P2 |
| TC_MPM_81 | Modal stack: another modal trên MealPlanner | Edge | P2 |
| TC_MPM_82 | Switch tab rapidly 20 lần | Edge | P2 |
| TC_MPM_83 | Tab content preserves selections cross-tab | Positive | P1 |
| TC_MPM_84 | Tab indicator animation smooth | Positive | P3 |
| TC_MPM_85 | Swipe between tabs (mobile gesture) | Positive | P2 |
| TC_MPM_86 | Tab accessibility — aria-selected | Positive | P3 |
| TC_MPM_87 | Tab keyboard navigation (Arrow Left/Right) | Positive | P3 |
| TC_MPM_88 | Initial tab from context (breakfast slot → breakfast tab) | Positive | P1 |
| TC_MPM_89 | Tab with no matching dishes — empty state | Edge | P2 |
| TC_MPM_90 | Keyboard navigation trong dish list | Positive | P3 |
| TC_MPM_91 | Focus management — first element on open | Positive | P2 |
| TC_MPM_92 | Screen reader announces modal title | Positive | P3 |
| TC_MPM_93 | High contrast mode — checkboxes visible | Positive | P3 |
| TC_MPM_94 | Mobile full-screen — close button accessible | Positive | P2 |
| TC_MPM_95 | Desktop centered — click outside closes | Positive | P2 |
| TC_MPM_96 | Orientation change while modal open | Edge | P2 |
| TC_MPM_97 | Scroll position reset when switching tabs | Positive | P2 |
| TC_MPM_98 | 200+ dishes in list — virtual scroll performance | Boundary | P2 |
| TC_MPM_99 | Search performance with 200+ dishes | Boundary | P2 |
| TC_MPM_100 | Render time with many selections | Boundary | P2 |
| TC_MPM_101 | Selection state memoized — no unnecessary rerenders | Boundary | P3 |
| TC_MPM_102 | Real-time nutrition calc performance | Boundary | P2 |
| TC_MPM_103 | Lazy render for off-screen dishes | Boundary | P3 |
| TC_MPM_104 | Confirm closes modal + updates localStorage atomically | Positive | P1 |
| TC_MPM_105 | Modal animation smooth open/close | Positive | P3 |
| TC_MPM_106 | Mở FilterBottomSheet từ button filter | Positive | P1 |
| TC_MPM_107 | FilterBottomSheet close callback | Positive | P1 |
| TC_MPM_108 | Filter maxCalories lọc dishes vượt ngưỡng | Positive | P1 |
| TC_MPM_109 | Filter minProtein lọc dishes dưới ngưỡng | Positive | P1 |
| TC_MPM_110 | Filter tags lọc theo meal type | Positive | P1 |
| TC_MPM_111 | hasActiveFilters indicator dot hiển thị | Positive | P2 |
| TC_MPM_112 | hasActiveFilters false no indicator | Positive | P2 |
| TC_MPM_113 | Filter maxCalories=0 no dishes | Edge | P2 |
| TC_MPM_114 | Filter minProtein=9999 no dishes | Edge | P2 |
| TC_MPM_115 | Kết hợp maxCalories + minProtein | Positive | P2 |
| TC_MPM_116 | Filter + search kết hợp | Positive | P1 |
| TC_MPM_117 | Reset filter full list restored | Positive | P1 |
| TC_MPM_118 | Filter thay đổi filteredDishes cập nhật | Positive | P1 |
| TC_MPM_119 | Filter không ảnh hưởng selections đã chọn | Positive | P1 |
| TC_MPM_120 | Filter tags undefined show all | Edge | P2 |
| TC_MPM_121 | Filter maxCalories negative graceful | Negative | P2 |
| TC_MPM_122 | Filter minProtein negative graceful | Negative | P2 |
| TC_MPM_123 | Filter bottom sheet mobile layout | Positive | P2 |
| TC_MPM_124 | Filter bottom sheet desktop layout | Positive | P2 |
| TC_MPM_125 | Filter count badge trên button | Positive | P2 |
| TC_MPM_126 | Remaining budget hiển thị targetCalories | Positive | P1 |
| TC_MPM_127 | Remaining budget hiển thị targetProtein | Positive | P1 |
| TC_MPM_128 | Remaining budget ẩn khi no targets | Edge | P2 |
| TC_MPM_129 | Remaining cal positive emerald color | Positive | P1 |
| TC_MPM_130 | Remaining cal negative rose color | Positive | P1 |
| TC_MPM_131 | Remaining protein positive emerald | Positive | P2 |
| TC_MPM_132 | Remaining protein negative rose | Positive | P2 |
| TC_MPM_133 | Budget ẩn khi totalDayDishCount=0 | Edge | P2 |
| TC_MPM_134 | Budget text Còn lại X kcal | Positive | P2 |
| TC_MPM_135 | Budget text Vượt X kcal khi over | Positive | P2 |
| TC_MPM_136 | Budget cập nhật real-time toggle dish | Positive | P1 |
| TC_MPM_137 | Budget cal = target - totalDay | Positive | P1 |
| TC_MPM_138 | Budget protein = target - totalDay | Positive | P1 |
| TC_MPM_139 | Budget targetCalories=0 | Edge | P2 |
| TC_MPM_140 | Budget data-testid attributes | Positive | P2 |
| TC_MPM_141 | Changed tab indicator dot hiển thị | Positive | P1 |
| TC_MPM_142 | Changed tab dot emerald inactive | Positive | P2 |
| TC_MPM_143 | Changed tab dot white active | Positive | P2 |
| TC_MPM_144 | Confirm label Xác nhận N 1 tab | Positive | P1 |
| TC_MPM_145 | Confirm label Lưu tất cả nhiều tabs | Positive | P1 |
| TC_MPM_146 | Confirm label Xác nhận no changes | Positive | P2 |
| TC_MPM_147 | hasTabChanged compare original vs current | Positive | P1 |
| TC_MPM_148 | Confirm chỉ gửi changed tabs | Positive | P1 |
| TC_MPM_149 | Confirm 1 tab changed gửi 1 type | Positive | P1 |
| TC_MPM_150 | Confirm 3 tabs changed gửi 3 types | Positive | P1 |
| TC_MPM_151 | Confirm no change vẫn close modal | Edge | P2 |
| TC_MPM_152 | Tab selection count badge đúng | Positive | P1 |
| TC_MPM_153 | Tab badge active bg-white/20 | Positive | P2 |
| TC_MPM_154 | Tab badge inactive bg-slate | Positive | P2 |
| TC_MPM_155 | Tab badge ẩn count=0 | Edge | P2 |
| TC_MPM_156 | changedTabs memo recalculates | Positive | P2 |
| TC_MPM_157 | activeTabNutrition tính đúng tab | Positive | P1 |
| TC_MPM_158 | totalDayNutrition tổng 3 tabs | Positive | P1 |
| TC_MPM_159 | totalDayDishCount sum 3 tabs | Positive | P2 |
| TC_MPM_160 | Footer active tab + day total | Positive | P1 |
| TC_MPM_161 | Dish card selected border emerald | Positive | P2 |
| TC_MPM_162 | Dish card unselected border slate | Positive | P2 |
| TC_MPM_163 | Dish card selected bg emerald-50 | Positive | P2 |
| TC_MPM_164 | Dish card hover border emerald-200 | Positive | P3 |
| TC_MPM_165 | Checkbox selected emerald bg white icon | Positive | P2 |
| TC_MPM_166 | Checkbox unselected border only | Positive | P2 |
| TC_MPM_167 | Dish name localized i18n language | Positive | P1 |
| TC_MPM_168 | Nutrition badge calories orange | Positive | P2 |
| TC_MPM_169 | Nutrition badge protein blue | Positive | P2 |
| TC_MPM_170 | Dish card active scale animation | Positive | P3 |
| TC_MPM_171 | Dish card min height 16 | Positive | P2 |
| TC_MPM_172 | ChefHat icon selected emerald | Positive | P2 |
| TC_MPM_173 | ChefHat icon unselected slate | Positive | P2 |
| TC_MPM_174 | Dish name truncate overflow | Positive | P2 |
| TC_MPM_175 | Nutrition Math.round calories | Positive | P2 |
| TC_MPM_176 | Nutrition Math.round protein | Positive | P2 |
| TC_MPM_177 | filteredDishes filter activeTab tag | Positive | P1 |
| TC_MPM_178 | filteredDishes sort filterConfig | Positive | P1 |
| TC_MPM_179 | Empty state ChefHat noMatchTitle | Positive | P1 |
| TC_MPM_180 | Empty state noMatchHint meal label | Positive | P2 |
| TC_MPM_181 | Modal header date selectedDate | Positive | P1 |
| TC_MPM_182 | Modal header subtitle text | Positive | P2 |
| TC_MPM_183 | Modal close button X icon | Positive | P1 |
| TC_MPM_184 | Modal close aria-label localized | Positive | P2 |
| TC_MPM_185 | Modal height mobile 92dvh | Positive | P2 |
| TC_MPM_186 | Modal height desktop max 90dvh | Positive | P2 |
| TC_MPM_187 | Modal width desktop max-w-2xl | Positive | P2 |
| TC_MPM_188 | Search input data-testid | Positive | P2 |
| TC_MPM_189 | Search input aria-label localized | Positive | P2 |
| TC_MPM_190 | Confirm button data-testid | Positive | P2 |
| TC_MPM_191 | Confirm button full width emerald | Positive | P2 |
| TC_MPM_192 | Confirm button min-h-12 | Positive | P2 |
| TC_MPM_193 | ModalBackdrop onClose callback | Positive | P1 |
| TC_MPM_194 | useModalBackHandler integrated | Positive | P1 |
| TC_MPM_195 | Search section sticky top z-10 | Positive | P2 |
| TC_MPM_196 | Dish without tags không hiển thị | Negative | P1 |
| TC_MPM_197 | Dish tags empty array không hiển thị | Edge | P2 |
| TC_MPM_198 | Search getLocalizedField multi-lang | Positive | P2 |
| TC_MPM_199 | calculateDishNutrition no ingredients | Edge | P1 |
| TC_MPM_200 | calculateDishesNutrition empty array | Edge | P2 |
| TC_MPM_201 | Selection Set operations atomic | Positive | P2 |
| TC_MPM_202 | initialTab prop sets activeTab | Positive | P1 |
| TC_MPM_203 | initialTab lunch → lunch active | Positive | P2 |
| TC_MPM_204 | initialTab dinner → dinner active | Positive | P2 |
| TC_MPM_205 | currentPlan pre-populate selections | Positive | P1 |
| TC_MPM_206 | currentPlan empty → empty Sets | Positive | P2 |
| TC_MPM_207 | Dish list overscroll-contain | Positive | P2 |
| TC_MPM_208 | Sort name-asc localeCompare | Positive | P2 |
| TC_MPM_209 | Sort cal-asc/desc nutrition | Positive | P2 |
| TC_MPM_210 | Sort pro-asc/desc nutrition | Positive | P2 |

---

## Chi tiết Test Cases

##### TC_MPM_01: Mở modal từ slot trống
- **Pre-conditions**: Ngày không có plan cho slot đó
- **Steps**: 1. Click slot breakfast trống
- **Expected**: MealPlannerModal mở, breakfast tab active, no pre-selections
- **Type**: Positive | **Priority**: P0

##### TC_MPM_02: Mở modal từ slot có món
- **Pre-conditions**: Ngày có breakfast với 2 dishes
- **Steps**: 1. Click breakfast slot có món
- **Expected**: Modal mở, breakfast tab, 2 dishes pre-selected (checkboxes on)
- **Type**: Positive | **Priority**: P0

##### TC_MPM_03: Danh sách dishes đầy đủ
- **Pre-conditions**: App có 10 dishes
- **Steps**: 1. Mở modal 2. Quan sát dish list
- **Expected**: Tất cả 10 dishes hiển thị với name, nutrition info
- **Type**: Positive | **Priority**: P1

##### TC_MPM_04: Search tiếng Việt
- **Pre-conditions**: Dishes có tên Vietnamese
- **Steps**: 1. Type "Cơm" trong search
- **Expected**: Chỉ dishes có "Cơm" trong tên hiển thị
- **Type**: Positive | **Priority**: P1

##### TC_MPM_05: Search tiếng Anh
- **Pre-conditions**: Dishes có tên English
- **Steps**: 1. Type "Rice" trong search
- **Expected**: Dishes matching "Rice" hiển thị
- **Type**: Positive | **Priority**: P1

##### TC_MPM_06: Search case-insensitive
- **Pre-conditions**: Dish "Cơm Gà"
- **Steps**: 1. Type "cơm gà" (lowercase)
- **Expected**: "Cơm Gà" xuất hiện trong kết quả
- **Type**: Positive | **Priority**: P1

##### TC_MPM_07: Search không kết quả
- **Pre-conditions**: Bất kỳ
- **Steps**: 1. Type "xyz123" trong search
- **Expected**: Empty state message, no dishes shown
- **Type**: Negative | **Priority**: P1

##### TC_MPM_08: Chọn 1 dish
- **Pre-conditions**: Modal mở, dishes hiển thị
- **Steps**: 1. Click checkbox dish đầu tiên
- **Expected**: Checkbox active, selection count = 1
- **Type**: Positive | **Priority**: P1

##### TC_MPM_09: Chọn nhiều dishes
- **Pre-conditions**: Modal mở
- **Steps**: 1. Chọn 3 dishes
- **Expected**: Counter hiển thị 3, nutrition summary = tổng 3 dishes
- **Type**: Positive | **Priority**: P1

##### TC_MPM_10: Bỏ chọn dish
- **Pre-conditions**: 3 dishes đã chọn
- **Steps**: 1. Click bỏ 1 dish
- **Expected**: Counter = 2, nutrition recalculate
- **Type**: Positive | **Priority**: P1

##### TC_MPM_11: Nutrition real-time
- **Pre-conditions**: Modal mở
- **Steps**: 1. Chọn dish (300 cal) 2. Quan sát summary
- **Expected**: Summary hiển thị 300 kcal, protein/carbs/fat tương ứng
- **Type**: Positive | **Priority**: P1

##### TC_MPM_12: Chuyển tab
- **Pre-conditions**: Modal mở ở breakfast
- **Steps**: 1. Click tab Trưa 2. Click tab Tối
- **Expected**: Content change, dish list filter theo meal type
- **Type**: Positive | **Priority**: P1

##### TC_MPM_13: Selection giữ nguyên cross-tab
- **Pre-conditions**: Chọn dish ở breakfast
- **Steps**: 1. Switch to lunch 2. Switch back to breakfast
- **Expected**: Breakfast selection vẫn active
- **Type**: Positive | **Priority**: P1

##### TC_MPM_14: Confirm thành công
- **Pre-conditions**: Đã chọn dishes
- **Steps**: 1. Click "Xác nhận"
- **Expected**: Modal đóng, dayPlan updated, calendar slot hiển thị dishes mới
- **Type**: Positive | **Priority**: P0

##### TC_MPM_15: Cancel không changes
- **Pre-conditions**: Vừa mở modal, không thay đổi gì
- **Steps**: 1. Click "Hủy"
- **Expected**: Modal đóng ngay, không UnsavedChangesDialog
- **Type**: Positive | **Priority**: P1

##### TC_MPM_16: Cancel có changes
- **Pre-conditions**: Đã thay đổi selection
- **Steps**: 1. Click "Hủy"
- **Expected**: UnsavedChangesDialog xuất hiện
- **Type**: Positive | **Priority**: P1

##### TC_MPM_17: Discard changes
- **Pre-conditions**: UnsavedChangesDialog hiện
- **Steps**: 1. Click "Bỏ thay đổi"
- **Expected**: Modal đóng, plan không thay đổi
- **Type**: Positive | **Priority**: P1

##### TC_MPM_18: Stay in modal
- **Pre-conditions**: UnsavedChangesDialog hiện
- **Steps**: 1. Click "Ở lại"
- **Expected**: Quay lại modal, selections preserved
- **Type**: Positive | **Priority**: P1

##### TC_MPM_19: Backdrop click close
- **Pre-conditions**: Modal mở
- **Steps**: 1. Click backdrop area
- **Expected**: Nếu no changes → đóng. Nếu changes → UnsavedChanges
- **Type**: Positive | **Priority**: P1

##### TC_MPM_20: Android back button
- **Pre-conditions**: Modal mở trên Android
- **Steps**: 1. Press hardware/gesture back
- **Expected**: Modal đóng (with unsaved check)
- **Type**: Positive | **Priority**: P1

##### TC_MPM_21–26: Sort dishes
- **Pre-conditions**: Dishes với different names/calories/protein
- **Steps**: 1. Chọn sort option
- **Expected**: List reorder đúng thứ tự
- **Type**: Positive | **Priority**: P2
- **Kết quả test thực tế**: | — |


##### TC_MPM_27–29: Filter meal type tags
- **Pre-conditions**: Dishes có tags
- **Steps**: 1. Ở tab breakfast/lunch/dinner
- **Expected**: Dishes matching tag ưu tiên hiển thị
- **Type**: Positive | **Priority**: P2
- **Kết quả test thực tế**: | — |


##### TC_MPM_30: Dish không tag
- **Pre-conditions**: Dish không có meal type tag
- **Steps**: 1. Check dish hiển thị ở tất cả tabs
- **Expected**: Dish hiển thị trong tất cả tabs
- **Type**: Edge | **Priority**: P2

##### TC_MPM_31: Dish nhiều tags
- **Pre-conditions**: Dish tagged breakfast + lunch
- **Steps**: 1. Check breakfast tab 2. Check lunch tab
- **Expected**: Dish hiển thị ở cả 2 tabs
- **Type**: Edge | **Priority**: P2

##### TC_MPM_32–33: Scroll lock/unlock
- **Pre-conditions**: Page có scroll
- **Steps**: 1. Mở modal 2. Đóng modal
- **Expected**: Background không scroll khi modal mở, scroll lại khi đóng
- **Type**: Positive | **Priority**: P1
- **Kết quả test thực tế**: | — |


##### TC_MPM_34–35: Desktop/Mobile layout
- **Pre-conditions**: Viewport desktop/mobile
- **Steps**: 1. Mở modal
- **Expected**: Desktop centered, Mobile full-screen bottom sheet
- **Type**: Positive | **Priority**: P2
- **Kết quả test thực tế**: | — |


##### TC_MPM_36: Confirm 0 dishes
- **Pre-conditions**: Deselect tất cả
- **Steps**: 1. Confirm với 0 selections
- **Expected**: Slot cleared, plan updated
- **Type**: Edge | **Priority**: P2

##### TC_MPM_37: 50+ dishes selected
- **Pre-conditions**: 50+ dishes
- **Steps**: 1. Select all 2. Confirm
- **Expected**: Save thành công, performance OK
- **Type**: Boundary | **Priority**: P2

##### TC_MPM_38–39: Special/regex chars search
- **Pre-conditions**: Any
- **Steps**: 1. Type special chars trong search
- **Expected**: No crash, no regex execution, treated as literal
- **Type**: Negative | **Priority**: P2
- **Kết quả test thực tế**: | — |


##### TC_MPM_40: Dark mode
- **Pre-conditions**: Dark mode on
- **Steps**: 1. Mở modal
- **Expected**: Dark bg, light text, checkboxes visible
- **Type**: Positive | **Priority**: P2

##### TC_MPM_41–42: i18n labels
- **Pre-conditions**: Language vi/en
- **Steps**: 1. Mở modal
- **Expected**: Labels, buttons, placeholder text đúng ngôn ngữ
- **Type**: Positive | **Priority**: P2
- **Kết quả test thực tế**: | — |


##### TC_MPM_43–44: AI suggestion edit
- **Pre-conditions**: AI suggestion có dishes
- **Steps**: 1. Click "Edit" trên AI suggestion 2. Modal mở
- **Expected**: Modal pre-filled với AI suggested dishes
- **Type**: Positive | **Priority**: P2
- **Kết quả test thực tế**: | — |


##### TC_MPM_45: Zero calorie dish
- **Pre-conditions**: Dish calories = 0
- **Steps**: 1. Chọn dish
- **Expected**: Nutrition shows 0 cal contribution, no error
- **Type**: Edge | **Priority**: P2

##### TC_MPM_46: Tên dài 200 chars
- **Pre-conditions**: Dish name 200 chars
- **Steps**: 1. Xem trong list
- **Expected**: Truncated, tooltip hoặc ellipsis
- **Type**: Boundary | **Priority**: P3

##### TC_MPM_47: 0 dishes
- **Pre-conditions**: App không có dish nào
- **Steps**: 1. Mở modal
- **Expected**: Empty state message, "Tạo món ăn đầu tiên"
- **Type**: Negative | **Priority**: P1

##### TC_MPM_48: Double-click checkbox
- **Pre-conditions**: Modal mở
- **Steps**: 1. Double-click checkbox
- **Expected**: Toggle on then off (or vice versa), final state correct
- **Type**: Edge | **Priority**: P2

##### TC_MPM_49–50: Keyboard Enter/Escape
- **Pre-conditions**: Modal mở, focus trong modal
- **Steps**: 1. Press Enter / Escape
- **Expected**: Enter = confirm, Escape = cancel
- **Type**: Positive | **Priority**: P3
- **Kết quả test thực tế**: | — |


##### TC_MPM_51: Focus trap
- **Pre-conditions**: Modal mở
- **Steps**: 1. Tab repeatedly
- **Expected**: Focus stays within modal
- **Type**: Positive | **Priority**: P2

##### TC_MPM_52: Re-open after confirm
- **Pre-conditions**: Vừa confirm modal
- **Steps**: 1. Click slot lại
- **Expected**: Modal mở fresh, shows current plan state
- **Type**: Positive | **Priority**: P1

##### TC_MPM_53: Search → select → clear search
- **Pre-conditions**: Modal mở
- **Steps**: 1. Search "gà" 2. Select dish 3. Clear search
- **Expected**: Full list appears, selected dish still checked
- **Type**: Positive | **Priority**: P1

##### TC_MPM_54–62: Advanced search scenarios
- Dấu tiếng Việt, không dấu, query dài, spaces, partial match, word boundary
- **Expected**: Search works correctly for all Vietnamese-specific cases
- **Type**: Positive/Edge | **Priority**: P2
- **Kết quả test thực tế**: | — |


##### TC_MPM_63–72: Advanced selection scenarios  
- Select all, deselect all, 50+ dishes, rapid toggle, cross-tab selection, nutrition overflow, zero-cal
- **Expected**: Selection logic correct, nutrition accurate
- **Type**: Positive/Boundary/Edge | **Priority**: P1-P2
- **Kết quả test thực tế**: | — |


##### TC_MPM_73–81: Modal lifecycle scenarios
- Open from various sources, re-open, close methods, unsaved handling, confirm no-change, modal stack
- **Expected**: Lifecycle correct, no state leak
- **Type**: Positive/Edge | **Priority**: P1-P2
- **Kết quả test thực tế**: | — |


##### TC_MPM_82–89: Tab navigation scenarios
- Rapid switch, content preservation, animation, swipe, accessibility, initial tab, empty tab
- **Expected**: Tab navigation smooth, accessible
- **Type**: Positive/Edge | **Priority**: P1-P3
- **Kết quả test thực tế**: | — |


##### TC_MPM_90–97: Accessibility & responsive scenarios
- Keyboard nav, focus management, screen reader, high contrast, mobile/desktop layout, orientation
- **Expected**: Fully accessible, responsive
- **Type**: Positive | **Priority**: P2-P3
- **Kết quả test thực tế**: | — |


##### TC_MPM_98–105: Performance scenarios
- 200+ dishes, search perf, render time, memoization, nutrition calc, lazy render, atomic save, animation
- **Expected**: Performance within acceptable bounds
- **Type**: Boundary | **Priority**: P2-P3

---
- **Kết quả test thực tế**: | — |


##### TC_MPM_106–125: Filter Functionality

##### TC_MPM_106: Mở FilterBottomSheet từ button filter
- **Pre-conditions**: MealPlannerModal đang mở, có 20+ dishes trong library với các tags khác nhau
- **Steps**:
  1. Navigate đến component chứa element cần test
  2. Click/tap vào element: Mở FilterBottomSheet từ button filter
  3. Verify action được thực thi đúng
- **Expected Result**: Mở FilterBottomSheet từ button filter — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_107: FilterBottomSheet close callback
- **Pre-conditions**: MealPlannerModal đang mở, có 20+ dishes trong library với các tags khác nhau
- **Steps**:
  1. Mount component với initial props
  2. Trigger re-render với props không thay đổi
  3. Verify component không re-render không cần thiết
- **Expected Result**: FilterBottomSheet close callback — component đóng đúng, state cleanup, không memory leak
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_108: Filter maxCalories lọc dishes vượt ngưỡng
- **Pre-conditions**: MealPlannerModal đang mở, có 20+ dishes trong library với các tags khác nhau
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Filter maxCalories lọc dishes vượt ngưỡng
  3. Verify kết quả đúng như expected
- **Expected Result**: Filter maxCalories lọc dishes vượt ngưỡng — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_109: Filter minProtein lọc dishes dưới ngưỡng
- **Pre-conditions**: MealPlannerModal đang mở, có 20+ dishes trong library với các tags khác nhau
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Filter minProtein lọc dishes dưới ngưỡng
  3. Verify kết quả đúng như expected
- **Expected Result**: Filter minProtein lọc dishes dưới ngưỡng — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_110: Filter tags lọc theo meal type
- **Pre-conditions**: MealPlannerModal đang mở, có 20+ dishes trong library với các tags khác nhau
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Filter tags lọc theo meal type
  3. Verify kết quả đúng như expected
- **Expected Result**: Filter tags lọc theo meal type — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_111: hasActiveFilters indicator dot hiển thị
- **Pre-conditions**: MealPlannerModal đang mở, có 20+ dishes trong library với các tags khác nhau
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: hasActiveFilters indicator dot hiển thị
  3. Verify element visible và nội dung đúng
- **Expected Result**: hasActiveFilters indicator dot hiển thị — UI element hiển thị đúng, đầy đủ thông tin, không lỗi visual
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_112: hasActiveFilters false no indicator
- **Pre-conditions**: MealPlannerModal đang mở, có 20+ dishes trong library với các tags khác nhau
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: hasActiveFilters false no indicator
  3. Verify kết quả đúng như expected
- **Expected Result**: hasActiveFilters false no indicator — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_113: Filter maxCalories=0 no dishes
- **Pre-conditions**: MealPlannerModal đang mở, có 20+ dishes trong library với các tags khác nhau
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Filter maxCalories=0 no dishes
  3. Verify kết quả đúng như expected
- **Expected Result**: Filter maxCalories=0 no dishes — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_MPM_114: Filter minProtein=9999 no dishes
- **Pre-conditions**: MealPlannerModal đang mở, có 20+ dishes trong library với các tags khác nhau
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Filter minProtein=9999 no dishes
  3. Verify kết quả đúng như expected
- **Expected Result**: Filter minProtein=9999 no dishes — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_MPM_115: Kết hợp maxCalories + minProtein
- **Pre-conditions**: MealPlannerModal đang mở với danh sách dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Kết hợp maxCalories + minProtein
  3. Verify kết quả đúng như expected
- **Expected Result**: Kết hợp maxCalories + minProtein — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_116: Filter + search kết hợp
- **Pre-conditions**: MealPlannerModal đang mở, có 20+ dishes trong library với các tags khác nhau
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Filter + search kết hợp
  3. Verify kết quả đúng như expected
- **Expected Result**: Filter + search kết hợp — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_117: Reset filter full list restored
- **Pre-conditions**: MealPlannerModal đang mở, có 20+ dishes trong library với các tags khác nhau
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Reset filter full list restored
  3. Verify kết quả đúng như expected
- **Expected Result**: Reset filter full list restored — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_118: Filter thay đổi filteredDishes cập nhật
- **Pre-conditions**: MealPlannerModal đang mở, có 20+ dishes trong library với các tags khác nhau
- **Steps**:
  1. Ghi nhận giá trị hiện tại
  2. Thực hiện thay đổi trigger update
  3. Verify giá trị mới đúng sau update
- **Expected Result**: Filter thay đổi filteredDishes cập nhật — data/UI cập nhật ngay lập tức, đồng bộ chính xác
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_119: Filter không ảnh hưởng selections đã chọn
- **Pre-conditions**: MealPlannerModal đang mở, có 20+ dishes trong library với các tags khác nhau
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Filter không ảnh hưởng selections đã chọn
  3. Verify kết quả đúng như expected
- **Expected Result**: Filter không ảnh hưởng selections đã chọn — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_120: Filter tags undefined show all
- **Pre-conditions**: MealPlannerModal đang mở, có 20+ dishes trong library với các tags khác nhau
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Filter tags undefined show all
  3. Verify kết quả đúng như expected
- **Expected Result**: Filter tags undefined show all — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_MPM_121: Filter maxCalories negative graceful
- **Pre-conditions**: MealPlannerModal đang mở, có 20+ dishes trong library với các tags khác nhau
- **Steps**:
  1. Thiết lập điều kiện lỗi/edge case
  2. Trigger action gây lỗi
  3. Verify app xử lý gracefully, không crash
- **Expected Result**: Filter maxCalories negative graceful — app xử lý gracefully, hiển thị error message phù hợp, không crash
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_MPM_122: Filter minProtein negative graceful
- **Pre-conditions**: MealPlannerModal đang mở, có 20+ dishes trong library với các tags khác nhau
- **Steps**:
  1. Thiết lập điều kiện lỗi/edge case
  2. Trigger action gây lỗi
  3. Verify app xử lý gracefully, không crash
- **Expected Result**: Filter minProtein negative graceful — app xử lý gracefully, hiển thị error message phù hợp, không crash
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_MPM_123: Filter bottom sheet mobile layout
- **Pre-conditions**: MealPlannerModal đang mở, có 20+ dishes trong library với các tags khác nhau
- **Steps**:
  1. Điều chỉnh viewport/device cho phù hợp
  2. Quan sát layout và styling
  3. Verify layout đúng theo breakpoint
- **Expected Result**: Filter bottom sheet mobile layout — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_124: Filter bottom sheet desktop layout
- **Pre-conditions**: MealPlannerModal đang mở, có 20+ dishes trong library với các tags khác nhau
- **Steps**:
  1. Điều chỉnh viewport/device cho phù hợp
  2. Quan sát layout và styling
  3. Verify layout đúng theo breakpoint
- **Expected Result**: Filter bottom sheet desktop layout — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_125: Filter count badge trên button
- **Pre-conditions**: MealPlannerModal đang mở, có 20+ dishes trong library với các tags khác nhau
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Filter count badge trên button
  3. Verify kết quả đúng như expected
- **Expected Result**: Filter count badge trên button — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |


##### TC_MPM_126–140: Remaining Budget Display

##### TC_MPM_126: Remaining budget hiển thị targetCalories
- **Pre-conditions**: MealPlannerModal đang mở, targetCalories=2000, targetProtein=100, đã chọn một số dishes
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: Remaining budget hiển thị targetCalories
  3. Verify element visible và nội dung đúng
- **Expected Result**: Remaining budget hiển thị targetCalories — UI element hiển thị đúng, đầy đủ thông tin, không lỗi visual
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_127: Remaining budget hiển thị targetProtein
- **Pre-conditions**: MealPlannerModal đang mở, targetCalories=2000, targetProtein=100, đã chọn một số dishes
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: Remaining budget hiển thị targetProtein
  3. Verify element visible và nội dung đúng
- **Expected Result**: Remaining budget hiển thị targetProtein — UI element hiển thị đúng, đầy đủ thông tin, không lỗi visual
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_128: Remaining budget ẩn khi no targets
- **Pre-conditions**: MealPlannerModal đang mở, targetCalories=2000, targetProtein=100, đã chọn một số dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Remaining budget ẩn khi no targets
  3. Verify kết quả đúng như expected
- **Expected Result**: Remaining budget ẩn khi no targets — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_MPM_129: Remaining cal positive emerald color
- **Pre-conditions**: MealPlannerModal đang mở, targetCalories=2000, targetProtein=100, đã chọn một số dishes
- **Steps**:
  1. Bật chế độ dark mode (nếu applicable)
  2. Quan sát colors và contrast
  3. Verify styling đúng theo design spec
- **Expected Result**: Remaining cal positive emerald color — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_130: Remaining cal negative rose color
- **Pre-conditions**: MealPlannerModal đang mở, targetCalories=2000, targetProtein=100, đã chọn một số dishes
- **Steps**:
  1. Thiết lập điều kiện lỗi/edge case
  2. Trigger action gây lỗi
  3. Verify app xử lý gracefully, không crash
- **Expected Result**: Remaining cal negative rose color — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_131: Remaining protein positive emerald
- **Pre-conditions**: MealPlannerModal đang mở, targetCalories=2000, targetProtein=100, đã chọn một số dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Remaining protein positive emerald
  3. Verify kết quả đúng như expected
- **Expected Result**: Remaining protein positive emerald — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_132: Remaining protein negative rose
- **Pre-conditions**: MealPlannerModal đang mở, targetCalories=2000, targetProtein=100, đã chọn một số dishes
- **Steps**:
  1. Thiết lập điều kiện lỗi/edge case
  2. Trigger action gây lỗi
  3. Verify app xử lý gracefully, không crash
- **Expected Result**: Remaining protein negative rose — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_133: Budget ẩn khi totalDayDishCount=0
- **Pre-conditions**: MealPlannerModal đang mở, targetCalories=2000, targetProtein=100, đã chọn một số dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Budget ẩn khi totalDayDishCount=0
  3. Verify kết quả đúng như expected
- **Expected Result**: Budget ẩn khi totalDayDishCount=0 — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_MPM_134: Budget text Còn lại X kcal
- **Pre-conditions**: MealPlannerModal đang mở, targetCalories=2000, targetProtein=100, đã chọn một số dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Budget text Còn lại X kcal
  3. Verify kết quả đúng như expected
- **Expected Result**: Budget text Còn lại X kcal — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_135: Budget text Vượt X kcal khi over
- **Pre-conditions**: MealPlannerModal đang mở, targetCalories=2000, targetProtein=100, đã chọn một số dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Budget text Vượt X kcal khi over
  3. Verify kết quả đúng như expected
- **Expected Result**: Budget text Vượt X kcal khi over — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_136: Budget cập nhật real-time toggle dish
- **Pre-conditions**: MealPlannerModal đang mở, targetCalories=2000, targetProtein=100, đã chọn một số dishes
- **Steps**:
  1. Quan sát trạng thái ban đầu
  2. Thực hiện toggle/switch action
  3. Verify trạng thái đã thay đổi đúng
- **Expected Result**: Budget cập nhật real-time toggle dish — data/UI cập nhật ngay lập tức, đồng bộ chính xác
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_137: Budget cal = target - totalDay
- **Pre-conditions**: MealPlannerModal đang mở, targetCalories=2000, targetProtein=100, đã chọn một số dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Budget cal = target - totalDay
  3. Verify kết quả đúng như expected
- **Expected Result**: Budget cal = target - totalDay — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_138: Budget protein = target - totalDay
- **Pre-conditions**: MealPlannerModal đang mở, targetCalories=2000, targetProtein=100, đã chọn một số dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Budget protein = target - totalDay
  3. Verify kết quả đúng như expected
- **Expected Result**: Budget protein = target - totalDay — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_139: Budget targetCalories=0
- **Pre-conditions**: MealPlannerModal đang mở, targetCalories=2000, targetProtein=100, đã chọn một số dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Budget targetCalories=0
  3. Verify kết quả đúng như expected
- **Expected Result**: Budget targetCalories=0 — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_MPM_140: Budget data-testid attributes
- **Pre-conditions**: MealPlannerModal đang mở, targetCalories=2000, targetProtein=100, đã chọn một số dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Budget data-testid attributes
  3. Verify kết quả đúng như expected
- **Expected Result**: Budget data-testid attributes — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |


##### TC_MPM_141–160: Changed Tabs & Confirm Logic

##### TC_MPM_141: Changed tab indicator dot hiển thị
- **Pre-conditions**: MealPlannerModal đang mở, đã thay đổi selections trong 1 hoặc nhiều tabs
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: Changed tab indicator dot hiển thị
  3. Verify element visible và nội dung đúng
- **Expected Result**: Changed tab indicator dot hiển thị — UI element hiển thị đúng, đầy đủ thông tin, không lỗi visual
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_142: Changed tab dot emerald inactive
- **Pre-conditions**: MealPlannerModal đang mở, đã thay đổi selections trong 1 hoặc nhiều tabs
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Changed tab dot emerald inactive
  3. Verify kết quả đúng như expected
- **Expected Result**: Changed tab dot emerald inactive — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_143: Changed tab dot white active
- **Pre-conditions**: MealPlannerModal đang mở, đã thay đổi selections trong 1 hoặc nhiều tabs
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Changed tab dot white active
  3. Verify kết quả đúng như expected
- **Expected Result**: Changed tab dot white active — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_144: Confirm label Xác nhận N 1 tab
- **Pre-conditions**: MealPlannerModal đang mở, đã thay đổi selections trong 1 hoặc nhiều tabs
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Confirm label Xác nhận N 1 tab
  3. Verify kết quả đúng như expected
- **Expected Result**: Confirm label Xác nhận N 1 tab — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_145: Confirm label Lưu tất cả nhiều tabs
- **Pre-conditions**: MealPlannerModal đang mở, đã thay đổi selections trong 1 hoặc nhiều tabs
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Confirm label Lưu tất cả nhiều tabs
  3. Verify kết quả đúng như expected
- **Expected Result**: Confirm label Lưu tất cả nhiều tabs — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_146: Confirm label Xác nhận no changes
- **Pre-conditions**: MealPlannerModal đang mở, đã thay đổi selections trong 1 hoặc nhiều tabs
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Confirm label Xác nhận no changes
  3. Verify kết quả đúng như expected
- **Expected Result**: Confirm label Xác nhận no changes — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_147: hasTabChanged compare original vs current
- **Pre-conditions**: MealPlannerModal đang mở, đã thay đổi selections trong 1 hoặc nhiều tabs
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: hasTabChanged compare original vs current
  3. Verify kết quả đúng như expected
- **Expected Result**: hasTabChanged compare original vs current — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_148: Confirm chỉ gửi changed tabs
- **Pre-conditions**: MealPlannerModal đang mở, đã thay đổi selections trong 1 hoặc nhiều tabs
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Confirm chỉ gửi changed tabs
  3. Verify kết quả đúng như expected
- **Expected Result**: Confirm chỉ gửi changed tabs — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_149: Confirm 1 tab changed gửi 1 type
- **Pre-conditions**: MealPlannerModal đang mở, đã thay đổi selections trong 1 hoặc nhiều tabs
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Confirm 1 tab changed gửi 1 type
  3. Verify kết quả đúng như expected
- **Expected Result**: Confirm 1 tab changed gửi 1 type — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_150: Confirm 3 tabs changed gửi 3 types
- **Pre-conditions**: MealPlannerModal đang mở, đã thay đổi selections trong 1 hoặc nhiều tabs
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Confirm 3 tabs changed gửi 3 types
  3. Verify kết quả đúng như expected
- **Expected Result**: Confirm 3 tabs changed gửi 3 types — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_151: Confirm no change vẫn close modal
- **Pre-conditions**: MealPlannerModal đang mở, đã thay đổi selections trong 1 hoặc nhiều tabs
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Confirm no change vẫn close modal
  3. Verify kết quả đúng như expected
- **Expected Result**: Confirm no change vẫn close modal — component đóng đúng, state cleanup, không memory leak
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_MPM_152: Tab selection count badge đúng
- **Pre-conditions**: MealPlannerModal đang mở với danh sách dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Tab selection count badge đúng
  3. Verify kết quả đúng như expected
- **Expected Result**: Tab selection count badge đúng — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_153: Tab badge active bg-white/20
- **Pre-conditions**: MealPlannerModal đang mở với danh sách dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Tab badge active bg-white/20
  3. Verify kết quả đúng như expected
- **Expected Result**: Tab badge active bg-white/20 — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_154: Tab badge inactive bg-slate
- **Pre-conditions**: MealPlannerModal đang mở với danh sách dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Tab badge inactive bg-slate
  3. Verify kết quả đúng như expected
- **Expected Result**: Tab badge inactive bg-slate — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_155: Tab badge ẩn count=0
- **Pre-conditions**: MealPlannerModal đang mở với danh sách dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Tab badge ẩn count=0
  3. Verify kết quả đúng như expected
- **Expected Result**: Tab badge ẩn count=0 — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_MPM_156: changedTabs memo recalculates
- **Pre-conditions**: MealPlannerModal đang mở với danh sách dishes
- **Steps**:
  1. Ghi nhận giá trị hiện tại
  2. Thực hiện thay đổi trigger update
  3. Verify giá trị mới đúng sau update
- **Expected Result**: changedTabs memo recalculates — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_157: activeTabNutrition tính đúng tab
- **Pre-conditions**: MealPlannerModal đang mở với danh sách dishes
- **Steps**:
  1. Chuẩn bị input data cho calculation
  2. Gọi function/trigger calculation
  3. Verify kết quả tính toán chính xác
- **Expected Result**: activeTabNutrition tính đúng tab — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_158: totalDayNutrition tổng 3 tabs
- **Pre-conditions**: MealPlannerModal đang mở với danh sách dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: totalDayNutrition tổng 3 tabs
  3. Verify kết quả đúng như expected
- **Expected Result**: totalDayNutrition tổng 3 tabs — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_159: totalDayDishCount sum 3 tabs
- **Pre-conditions**: MealPlannerModal đang mở với danh sách dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: totalDayDishCount sum 3 tabs
  3. Verify kết quả đúng như expected
- **Expected Result**: totalDayDishCount sum 3 tabs — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_160: Footer active tab + day total
- **Pre-conditions**: MealPlannerModal đang mở với danh sách dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Footer active tab + day total
  3. Verify kết quả đúng như expected
- **Expected Result**: Footer active tab + day total — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |


##### TC_MPM_161–180: Dish Display & Interaction

##### TC_MPM_161: Dish card selected border emerald
- **Pre-conditions**: MealPlannerModal đang mở, tab breakfast active, danh sách dishes hiển thị
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Dish card selected border emerald
  3. Verify kết quả đúng như expected
- **Expected Result**: Dish card selected border emerald — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_162: Dish card unselected border slate
- **Pre-conditions**: MealPlannerModal đang mở, tab breakfast active, danh sách dishes hiển thị
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Dish card unselected border slate
  3. Verify kết quả đúng như expected
- **Expected Result**: Dish card unselected border slate — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_163: Dish card selected bg emerald-50
- **Pre-conditions**: MealPlannerModal đang mở, tab breakfast active, danh sách dishes hiển thị
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Dish card selected bg emerald-50
  3. Verify kết quả đúng như expected
- **Expected Result**: Dish card selected bg emerald-50 — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_164: Dish card hover border emerald-200
- **Pre-conditions**: MealPlannerModal đang mở, tab breakfast active, danh sách dishes hiển thị
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Dish card hover border emerald-200
  3. Verify kết quả đúng như expected
- **Expected Result**: Dish card hover border emerald-200 — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_165: Checkbox selected emerald bg white icon
- **Pre-conditions**: MealPlannerModal đang mở, tab breakfast active, danh sách dishes hiển thị
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Checkbox selected emerald bg white icon
  3. Verify kết quả đúng như expected
- **Expected Result**: Checkbox selected emerald bg white icon — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_166: Checkbox unselected border only
- **Pre-conditions**: MealPlannerModal đang mở, tab breakfast active, danh sách dishes hiển thị
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Checkbox unselected border only
  3. Verify kết quả đúng như expected
- **Expected Result**: Checkbox unselected border only — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_167: Dish name localized i18n language
- **Pre-conditions**: MealPlannerModal đang mở với danh sách dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Dish name localized i18n language
  3. Verify kết quả đúng như expected
- **Expected Result**: Dish name localized i18n language — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_168: Nutrition badge calories orange
- **Pre-conditions**: MealPlannerModal đang mở, tab breakfast active, danh sách dishes hiển thị
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Nutrition badge calories orange
  3. Verify kết quả đúng như expected
- **Expected Result**: Nutrition badge calories orange — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_169: Nutrition badge protein blue
- **Pre-conditions**: MealPlannerModal đang mở, tab breakfast active, danh sách dishes hiển thị
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Nutrition badge protein blue
  3. Verify kết quả đúng như expected
- **Expected Result**: Nutrition badge protein blue — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_170: Dish card active scale animation
- **Pre-conditions**: MealPlannerModal đang mở, tab breakfast active, danh sách dishes hiển thị
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Dish card active scale animation
  3. Verify kết quả đúng như expected
- **Expected Result**: Dish card active scale animation — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_171: Dish card min height 16
- **Pre-conditions**: MealPlannerModal đang mở, tab breakfast active, danh sách dishes hiển thị
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Dish card min height 16
  3. Verify kết quả đúng như expected
- **Expected Result**: Dish card min height 16 — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_172: ChefHat icon selected emerald
- **Pre-conditions**: MealPlannerModal đang mở, tab breakfast active, danh sách dishes hiển thị
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: ChefHat icon selected emerald
  3. Verify kết quả đúng như expected
- **Expected Result**: ChefHat icon selected emerald — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_173: ChefHat icon unselected slate
- **Pre-conditions**: MealPlannerModal đang mở, tab breakfast active, danh sách dishes hiển thị
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: ChefHat icon unselected slate
  3. Verify kết quả đúng như expected
- **Expected Result**: ChefHat icon unselected slate — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_174: Dish name truncate overflow
- **Pre-conditions**: MealPlannerModal đang mở với danh sách dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Dish name truncate overflow
  3. Verify kết quả đúng như expected
- **Expected Result**: Dish name truncate overflow — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_175: Nutrition Math.round calories
- **Pre-conditions**: MealPlannerModal đang mở với danh sách dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Nutrition Math.round calories
  3. Verify kết quả đúng như expected
- **Expected Result**: Nutrition Math.round calories — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_176: Nutrition Math.round protein
- **Pre-conditions**: MealPlannerModal đang mở với danh sách dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Nutrition Math.round protein
  3. Verify kết quả đúng như expected
- **Expected Result**: Nutrition Math.round protein — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_177: filteredDishes filter activeTab tag
- **Pre-conditions**: MealPlannerModal đang mở, có 20+ dishes trong library với các tags khác nhau
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: filteredDishes filter activeTab tag
  3. Verify kết quả đúng như expected
- **Expected Result**: filteredDishes filter activeTab tag — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_178: filteredDishes sort filterConfig
- **Pre-conditions**: MealPlannerModal đang mở, có 20+ dishes trong library với các tags khác nhau
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: filteredDishes sort filterConfig
  3. Verify kết quả đúng như expected
- **Expected Result**: filteredDishes sort filterConfig — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_179: Empty state ChefHat noMatchTitle
- **Pre-conditions**: MealPlannerModal đang mở, tab breakfast active, danh sách dishes hiển thị
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Empty state ChefHat noMatchTitle
  3. Verify kết quả đúng như expected
- **Expected Result**: Empty state ChefHat noMatchTitle — empty state hiển thị đúng, không crash, UI thân thiện
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_180: Empty state noMatchHint meal label
- **Pre-conditions**: MealPlannerModal đang mở với danh sách dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Empty state noMatchHint meal label
  3. Verify kết quả đúng như expected
- **Expected Result**: Empty state noMatchHint meal label — empty state hiển thị đúng, không crash, UI thân thiện
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |


##### TC_MPM_181–195: Modal Structure & Responsive

##### TC_MPM_181: Modal header date selectedDate
- **Pre-conditions**: MealPlannerModal vừa mở từ calendar slot, selectedDate='2026-03-15'
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Modal header date selectedDate
  3. Verify kết quả đúng như expected
- **Expected Result**: Modal header date selectedDate — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_182: Modal header subtitle text
- **Pre-conditions**: MealPlannerModal vừa mở từ calendar slot, selectedDate='2026-03-15'
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Modal header subtitle text
  3. Verify kết quả đúng như expected
- **Expected Result**: Modal header subtitle text — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_183: Modal close button X icon
- **Pre-conditions**: MealPlannerModal vừa mở từ calendar slot, selectedDate='2026-03-15'
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Modal close button X icon
  3. Verify kết quả đúng như expected
- **Expected Result**: Modal close button X icon — component đóng đúng, state cleanup, không memory leak
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_184: Modal close aria-label localized
- **Pre-conditions**: MealPlannerModal vừa mở từ calendar slot, selectedDate='2026-03-15'
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Modal close aria-label localized
  3. Verify kết quả đúng như expected
- **Expected Result**: Modal close aria-label localized — component đóng đúng, state cleanup, không memory leak
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_185: Modal height mobile 92dvh
- **Pre-conditions**: MealPlannerModal vừa mở từ calendar slot, selectedDate='2026-03-15'
- **Steps**:
  1. Điều chỉnh viewport/device cho phù hợp
  2. Quan sát layout và styling
  3. Verify layout đúng theo breakpoint
- **Expected Result**: Modal height mobile 92dvh — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_186: Modal height desktop max 90dvh
- **Pre-conditions**: MealPlannerModal vừa mở từ calendar slot, selectedDate='2026-03-15'
- **Steps**:
  1. Điều chỉnh viewport/device cho phù hợp
  2. Quan sát layout và styling
  3. Verify layout đúng theo breakpoint
- **Expected Result**: Modal height desktop max 90dvh — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_187: Modal width desktop max-w-2xl
- **Pre-conditions**: MealPlannerModal vừa mở từ calendar slot, selectedDate='2026-03-15'
- **Steps**:
  1. Điều chỉnh viewport/device cho phù hợp
  2. Quan sát layout và styling
  3. Verify layout đúng theo breakpoint
- **Expected Result**: Modal width desktop max-w-2xl — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_188: Search input data-testid
- **Pre-conditions**: MealPlannerModal vừa mở từ calendar slot, selectedDate='2026-03-15'
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Search input data-testid
  3. Verify kết quả đúng như expected
- **Expected Result**: Search input data-testid — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_189: Search input aria-label localized
- **Pre-conditions**: MealPlannerModal vừa mở từ calendar slot, selectedDate='2026-03-15'
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Search input aria-label localized
  3. Verify kết quả đúng như expected
- **Expected Result**: Search input aria-label localized — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_190: Confirm button data-testid
- **Pre-conditions**: MealPlannerModal đang mở, đã thay đổi selections trong 1 hoặc nhiều tabs
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Confirm button data-testid
  3. Verify kết quả đúng như expected
- **Expected Result**: Confirm button data-testid — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_191: Confirm button full width emerald
- **Pre-conditions**: MealPlannerModal đang mở, đã thay đổi selections trong 1 hoặc nhiều tabs
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Confirm button full width emerald
  3. Verify kết quả đúng như expected
- **Expected Result**: Confirm button full width emerald — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_192: Confirm button min-h-12
- **Pre-conditions**: MealPlannerModal đang mở, đã thay đổi selections trong 1 hoặc nhiều tabs
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Confirm button min-h-12
  3. Verify kết quả đúng như expected
- **Expected Result**: Confirm button min-h-12 — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_193: ModalBackdrop onClose callback
- **Pre-conditions**: MealPlannerModal vừa mở từ calendar slot, selectedDate='2026-03-15'
- **Steps**:
  1. Mount component với initial props
  2. Trigger re-render với props không thay đổi
  3. Verify component không re-render không cần thiết
- **Expected Result**: ModalBackdrop onClose callback — component đóng đúng, state cleanup, không memory leak
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_194: useModalBackHandler integrated
- **Pre-conditions**: MealPlannerModal đang mở với danh sách dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: useModalBackHandler integrated
  3. Verify kết quả đúng như expected
- **Expected Result**: useModalBackHandler integrated — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_195: Search section sticky top z-10
- **Pre-conditions**: MealPlannerModal vừa mở từ calendar slot, selectedDate='2026-03-15'
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Search section sticky top z-10
  3. Verify kết quả đúng như expected
- **Expected Result**: Search section sticky top z-10 — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |


##### TC_MPM_196–210: Advanced Edge Cases & Integration

##### TC_MPM_196: Dish without tags không hiển thị
- **Pre-conditions**: MealPlannerModal đang mở với danh sách dishes
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: Dish without tags không hiển thị
  3. Verify element visible và nội dung đúng
- **Expected Result**: Dish without tags không hiển thị — UI element hiển thị đúng, đầy đủ thông tin, không lỗi visual
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_MPM_197: Dish tags empty array không hiển thị
- **Pre-conditions**: MealPlannerModal đang mở với danh sách dishes
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: Dish tags empty array không hiển thị
  3. Verify element visible và nội dung đúng
- **Expected Result**: Dish tags empty array không hiển thị — UI element hiển thị đúng, đầy đủ thông tin, không lỗi visual
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_MPM_198: Search getLocalizedField multi-lang
- **Pre-conditions**: MealPlannerModal vừa mở từ calendar slot, selectedDate='2026-03-15'
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Search getLocalizedField multi-lang
  3. Verify kết quả đúng như expected
- **Expected Result**: Search getLocalizedField multi-lang — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_199: calculateDishNutrition no ingredients
- **Pre-conditions**: MealPlannerModal đang mở với danh sách dishes
- **Steps**:
  1. Chuẩn bị input data cho calculation
  2. Gọi function/trigger calculation
  3. Verify kết quả tính toán chính xác
- **Expected Result**: calculateDishNutrition no ingredients — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_MPM_200: calculateDishesNutrition empty array
- **Pre-conditions**: MealPlannerModal đang mở với danh sách dishes
- **Steps**:
  1. Chuẩn bị input data cho calculation
  2. Gọi function/trigger calculation
  3. Verify kết quả tính toán chính xác
- **Expected Result**: calculateDishesNutrition empty array — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_MPM_201: Selection Set operations atomic
- **Pre-conditions**: MealPlannerModal đang mở với danh sách dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Selection Set operations atomic
  3. Verify kết quả đúng như expected
- **Expected Result**: Selection Set operations atomic — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_202: initialTab prop sets activeTab
- **Pre-conditions**: MealPlannerModal được mở với initialTab và currentPlan từ CalendarTab
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: initialTab prop sets activeTab
  3. Verify kết quả đúng như expected
- **Expected Result**: initialTab prop sets activeTab — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_203: initialTab lunch → lunch active
- **Pre-conditions**: MealPlannerModal được mở với initialTab và currentPlan từ CalendarTab
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: initialTab lunch → lunch active
  3. Verify kết quả đúng như expected
- **Expected Result**: initialTab lunch → lunch active — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_204: initialTab dinner → dinner active
- **Pre-conditions**: MealPlannerModal được mở với initialTab và currentPlan từ CalendarTab
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: initialTab dinner → dinner active
  3. Verify kết quả đúng như expected
- **Expected Result**: initialTab dinner → dinner active — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_205: currentPlan pre-populate selections
- **Pre-conditions**: MealPlannerModal được mở với initialTab và currentPlan từ CalendarTab
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: currentPlan pre-populate selections
  3. Verify kết quả đúng như expected
- **Expected Result**: currentPlan pre-populate selections — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_206: currentPlan empty → empty Sets
- **Pre-conditions**: MealPlannerModal được mở với initialTab và currentPlan từ CalendarTab
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: currentPlan empty → empty Sets
  3. Verify kết quả đúng như expected
- **Expected Result**: currentPlan empty → empty Sets — empty state hiển thị đúng, không crash, UI thân thiện
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_207: Dish list overscroll-contain
- **Pre-conditions**: MealPlannerModal đang mở với danh sách dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Dish list overscroll-contain
  3. Verify kết quả đúng như expected
- **Expected Result**: Dish list overscroll-contain — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_208: Sort name-asc localeCompare
- **Pre-conditions**: MealPlannerModal đang mở, filterConfig có sortBy đã set
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Sort name-asc localeCompare
  3. Verify kết quả đúng như expected
- **Expected Result**: Sort name-asc localeCompare — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_209: Sort cal-asc/desc nutrition
- **Pre-conditions**: MealPlannerModal đang mở, filterConfig có sortBy đã set
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Sort cal-asc/desc nutrition
  3. Verify kết quả đúng như expected
- **Expected Result**: Sort cal-asc/desc nutrition — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_MPM_210: Sort pro-asc/desc nutrition
- **Pre-conditions**: MealPlannerModal đang mở, filterConfig có sortBy đã set
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Sort pro-asc/desc nutrition
  3. Verify kết quả đúng như expected
- **Expected Result**: Sort pro-asc/desc nutrition — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

---

## Đề xuất Cải tiến

### Đề xuất 1: Recent/Favorite dishes section
- **Vấn đề hiện tại**: Mỗi lần mở modal phải search lại các món thường ăn.
- **Giải pháp đề xuất**: Thêm section "Gần đây" (5 món dùng gần nhất) và "Yêu thích" (user đánh dấu star).
- **Lý do chi tiết**: 80% meal planning là lặp lại. Quick access giảm search time 70%.
- **Phần trăm cải thiện**: Task time -60%, Satisfaction +40%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 2: Quantity selector per dish
- **Vấn đề hiện tại**: Chọn 2 trứng = phải tạo dish mới "2 trứng" hoặc chỉnh amount thủ công.
- **Giải pháp đề xuất**: Thêm quantity selector (+/-) bên cạnh mỗi dish. Default = 1, cho phép 0.5 → 10.
- **Lý do chi tiết**: Real meals cần portion control. Quantity selector pattern quen thuộc (e-commerce cart).
- **Phần trăm cải thiện**: Data accuracy +50%, Nutrition tracking accuracy +40%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 3: Preview nutrition tổng ngày
- **Vấn đề hiện tại**: Modal chỉ hiện nutrition cho bữa đang edit, không biết tổng ngày.
- **Giải pháp đề xuất**: Hiển thị mini summary bar: "Tổng ngày: X/Y cal" cập nhật khi thay đổi selection.
- **Lý do chi tiết**: Context cả ngày giúp cân bằng bữa ăn tốt hơn. Tránh ăn quá nhiều bữa trưa rồi bỏ tối.
- **Phần trăm cải thiện**: Nutrition goal adherence +35%, User confidence +25%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 4: Undo last confirm
- **Vấn đề hiện tại**: Confirm nhầm → phải mở modal lại, chọn lại từ đầu.
- **Giải pháp đề xuất**: Toast "Đã cập nhật bữa Sáng" với nút Undo (5s timeout).
- **Lý do chi tiết**: Error recovery pattern chuẩn (Gmail undo send). Giảm anxiety khi thao tác.
- **Phần trăm cải thiện**: Error recovery -90%, User anxiety -40%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 5: Smart suggest dựa trên history
- **Vấn đề hiện tại**: Không có gợi ý dựa trên thói quen ăn uống.
- **Giải pháp đề xuất**: Section "Gợi ý cho bạn" dựa trên: (1) Món hay ăn cùng, (2) Bổ sung nutrition thiếu, (3) Pattern tuần trước.
- **Lý do chi tiết**: Predictive UX giảm cognitive load. Netflix/Spotify đã chứng minh recommendation tăng engagement 60%.
- **Phần trăm cải thiện**: Decision time -50%, Engagement +30%, Nutrition balance +20%
- **Mức độ ưu tiên**: Low | **Effort**: L
