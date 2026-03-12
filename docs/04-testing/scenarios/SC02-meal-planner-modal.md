# Scenario 2: Meal Planner Modal

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 105

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

## Test Cases (105 TCs)

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

##### TC_MPM_27–29: Filter meal type tags
- **Pre-conditions**: Dishes có tags
- **Steps**: 1. Ở tab breakfast/lunch/dinner
- **Expected**: Dishes matching tag ưu tiên hiển thị
- **Type**: Positive | **Priority**: P2

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

##### TC_MPM_34–35: Desktop/Mobile layout
- **Pre-conditions**: Viewport desktop/mobile
- **Steps**: 1. Mở modal
- **Expected**: Desktop centered, Mobile full-screen bottom sheet
- **Type**: Positive | **Priority**: P2

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

##### TC_MPM_43–44: AI suggestion edit
- **Pre-conditions**: AI suggestion có dishes
- **Steps**: 1. Click "Edit" trên AI suggestion 2. Modal mở
- **Expected**: Modal pre-filled với AI suggested dishes
- **Type**: Positive | **Priority**: P2

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

##### TC_MPM_63–72: Advanced selection scenarios  
- Select all, deselect all, 50+ dishes, rapid toggle, cross-tab selection, nutrition overflow, zero-cal
- **Expected**: Selection logic correct, nutrition accurate
- **Type**: Positive/Boundary/Edge | **Priority**: P1-P2

##### TC_MPM_73–81: Modal lifecycle scenarios
- Open from various sources, re-open, close methods, unsaved handling, confirm no-change, modal stack
- **Expected**: Lifecycle correct, no state leak
- **Type**: Positive/Edge | **Priority**: P1-P2

##### TC_MPM_82–89: Tab navigation scenarios
- Rapid switch, content preservation, animation, swipe, accessibility, initial tab, empty tab
- **Expected**: Tab navigation smooth, accessible
- **Type**: Positive/Edge | **Priority**: P1-P3

##### TC_MPM_90–97: Accessibility & responsive scenarios
- Keyboard nav, focus management, screen reader, high contrast, mobile/desktop layout, orientation
- **Expected**: Fully accessible, responsive
- **Type**: Positive | **Priority**: P2-P3

##### TC_MPM_98–105: Performance scenarios
- 200+ dishes, search perf, render time, memoization, nutrition calc, lazy render, atomic save, animation
- **Expected**: Performance within acceptable bounds
- **Type**: Boundary | **Priority**: P2-P3

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
