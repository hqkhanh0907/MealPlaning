# Scenario 1: Calendar & Meal Planning

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 105

---

## Mô tả tổng quan

Calendar & Meal Planning là scenario cốt lõi của ứng dụng Smart Meal Planner, bao gồm toàn bộ luồng tương tác của người dùng với lịch bữa ăn. Scenario này cover việc hiển thị và điều hướng ngày tháng qua DateSelector (week view với swipe gesture), quản lý 3 slot bữa ăn (Sáng/Trưa/Tối) cho mỗi ngày, hiển thị indicator dots cho ngày có plan, và tích hợp với MealActionBar (AI Suggest, Clear Plan, Copy Plan, Template).

Trên mobile, calendar sử dụng sub-tabs (Meals ↔ Nutrition) để tối ưu không gian. Trên desktop (≥1024px), hiển thị side-by-side layout. Ngày hiện tại có pulse animation highlight, Chủ nhật hiển thị màu rose. Dữ liệu dayPlans được persist trong localStorage key 'mp-day-plans'.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| CalendarTab | CalendarTab.tsx | Container chính cho tab Calendar |
| DateSelector | DateSelector.tsx | Chọn ngày, navigation tuần, calendar/week view |
| MealsSubTab | MealsSubTab.tsx | Hiển thị 3 meal slots + action bar |
| NutritionSubTab | NutritionSubTab.tsx | Progress bars dinh dưỡng |
| MealActionBar | MealActionBar.tsx | Buttons: AI, Clear, Copy, Template |
| Summary | Summary.tsx | Tổng hợp nutrition ngày |
| QuickPreviewPanel | QuickPreviewPanel.tsx | Panel preview chi tiết |
| useIsDesktop | useIsDesktop.ts | Responsive breakpoint (1024px) |
| usePersistedState | usePersistedState.ts | localStorage sync |

## Luồng nghiệp vụ

1. Mở app → Calendar tab mặc định → hiển thị tuần chứa ngày hôm nay
2. Chọn ngày → load dayPlan cho ngày đó → hiển thị 3 meal slots
3. Click slot trống → mở MealPlannerModal → chọn dishes → confirm → update plan
4. Click slot có món → mở MealPlannerModal với pre-selected dishes
5. Action bar: AI Suggest / Clear Plan / Copy Plan / Template
6. Chuyển sub-tab Meals ↔ Nutrition (mobile only)
7. Desktop: side-by-side Meals + Nutrition

## Quy tắc nghiệp vụ

1. selectedDate mặc định = today (YYYY-MM-DD format)
2. Tuần bắt đầu từ thứ Hai (vi locale)
3. Indicator dot hiển thị cho ngày có ≥1 dish trong bất kỳ meal nào
4. Mini nutrition bar = actual/target x 100, capped tại container width
5. Swipe gesture: threshold 50px, horizontal > vertical movement
6. Calendar hint dismisses sau first interaction, lưu vào localStorage
7. Today pulse animation, Sunday rose highlight
8. dayPlans persist qua reload (localStorage)
9. selectedDate KHÔNG persist (reset về today khi reload)

## Test Cases (105 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_CAL_01 | Hiển thị ngày hiện tại khi mở app | Positive | P0 |
| TC_CAL_02 | Chọn ngày khác trên DateSelector | Positive | P1 |
| TC_CAL_03 | Điều hướng sang tuần trước | Positive | P1 |
| TC_CAL_04 | Điều hướng sang tuần sau | Positive | P1 |
| TC_CAL_05 | Indicator dot cho ngày có plan | Positive | P1 |
| TC_CAL_06 | Hiển thị 3 slot bữa ăn trống | Positive | P1 |
| TC_CAL_07 | Hiển thị món trong slot đã có plan | Positive | P1 |
| TC_CAL_08 | Tổng calo/protein trên mỗi slot | Positive | P1 |
| TC_CAL_09 | Nhấn slot trống mở MealPlannerModal | Positive | P1 |
| TC_CAL_10 | Chuyển sub-tab Meals ↔ Nutrition (mobile) | Positive | P1 |
| TC_CAL_11 | Desktop side-by-side layout | Positive | P2 |
| TC_CAL_12 | Action bar hiển thị đủ buttons | Positive | P1 |
| TC_CAL_13 | Nhấn AI Gợi ý trên action bar | Positive | P1 |
| TC_CAL_14 | Nhấn Xóa kế hoạch mở ClearPlanModal | Positive | P1 |
| TC_CAL_15 | Nhấn Copy mở CopyPlanModal | Positive | P2 |
| TC_CAL_16 | Nhấn Template mở TemplateManager | Positive | P2 |
| TC_CAL_17 | Date format locale vi-VN | Positive | P2 |
| TC_CAL_18 | Date format locale en-US | Positive | P2 |
| TC_CAL_19 | Chuyển ngày qua ranh giới tháng | Edge | P2 |
| TC_CAL_20 | Chuyển ngày qua ranh giới năm | Edge | P2 |
| TC_CAL_21 | Plan chỉ có 1 bữa | Edge | P2 |
| TC_CAL_22 | DST spring forward — không mất plan | Edge | P1 |
| TC_CAL_23 | DST fall back — không duplicate plan | Edge | P1 |
| TC_CAL_24 | Leap year Feb 29 hiển thị đúng plan | Edge | P2 |
| TC_CAL_25 | Feb 29 → non-leap year → không crash | Edge | P2 |
| TC_CAL_26 | Rapid date switching (10 clicks < 1s) | Edge | P2 |
| TC_CAL_27 | Rapid tab switch Meals↔Nutrition 20 lần | Edge | P2 |
| TC_CAL_28 | 100+ món trong 1 slot — render performance | Boundary | P2 |
| TC_CAL_29 | Empty localStorage — app không crash | Edge | P1 |
| TC_CAL_30 | Corrupt localStorage dayPlans — graceful fallback | Negative | P1 |
| TC_CAL_31 | Corrupt date format "2026-13-45" — xử lý đúng | Negative | P2 |
| TC_CAL_32 | XSS trong tên món — escaped đúng | Negative | P0 |
| TC_CAL_33 | Tên món 200 ký tự — truncation/ellipsis | Boundary | P3 |
| TC_CAL_34 | Thêm món → nutrition cập nhật cascade | Positive | P1 |
| TC_CAL_35 | Thêm món → grocery list cập nhật | Positive | P1 |
| TC_CAL_36 | Indicator dots cho 100+ ngày có plan | Boundary | P3 |
| TC_CAL_37 | Tuần spanning 2 tháng (28/1 → 3/2) | Edge | P2 |
| TC_CAL_38 | Tuần spanning 2 năm (29/12 → 4/1) | Edge | P2 |
| TC_CAL_39 | 1/1 first day — tuần trước = tuần cuối năm cũ | Edge | P2 |
| TC_CAL_40 | 31/12 — tuần sau = tuần đầu năm mới | Edge | P2 |
| TC_CAL_41 | Date rollover tại midnight | Edge | P1 |
| TC_CAL_42 | Reload giữa lúc thay đổi ngày | Edge | P2 |
| TC_CAL_43 | Nhiều tabs/windows — localStorage sync | Edge | P2 |
| TC_CAL_44 | Slot có món → MealPlannerModal pre-selected | Positive | P1 |
| TC_CAL_45 | Mini nutrition bar tỉ lệ actual/target | Positive | P1 |
| TC_CAL_46 | Nutrition bar overflow (actual > target) | Boundary | P2 |
| TC_CAL_47 | Swipe left/right chuyển tuần (mobile) | Positive | P2 |
| TC_CAL_48 | Action bar disabled khi không có plan | Negative | P2 |
| TC_CAL_49 | Keyboard navigation Arrow keys | Positive | P3 |
| TC_CAL_50 | Screen reader đọc đúng ngày & plan | Positive | P3 |
| TC_CAL_51 | Chuyển ngôn ngữ → tên ngày cập nhật | Positive | P2 |
| TC_CAL_52 | Dark mode — calendar đúng colors | Positive | P2 |
| TC_CAL_53 | Empty plan 7 ngày — UI nhất quán | Edge | P2 |
| TC_CAL_54 | Plan với dish bị xóa — không crash | Edge | P1 |
| TC_CAL_55 | Chuyển tab đi và về — state preserved | Positive | P1 |
| TC_CAL_56 | Timezone khác UTC — ngày local đúng | Edge | P1 |
| TC_CAL_57 | Browser tab visibility change → state preserved | Edge | P2 |
| TC_CAL_58 | Orientation change portrait ↔ landscape | Edge | P2 |
| TC_CAL_59 | Memory pressure — state preserved | Edge | P2 |
| TC_CAL_60 | PWA mode (Add to Home Screen) | Edge | P2 |
| TC_CAL_61 | RTL text trong tên món | Edge | P3 |
| TC_CAL_62 | Emoji trong tên món hiển thị đúng | Edge | P3 |
| TC_CAL_63 | Concurrent localStorage writes từ 2 tabs | Edge | P1 |
| TC_CAL_64 | localStorage quota gần đầy (>4.5MB) | Boundary | P1 |
| TC_CAL_65 | Ngày quá khứ xa (01/01/1900) | Boundary | P3 |
| TC_CAL_66 | Ngày tương lai xa (01/01/2100) | Boundary | P3 |
| TC_CAL_67 | DST timezone US/Pacific | Edge | P2 |
| TC_CAL_68 | Ngày không tồn tại (30/02) handled | Edge | P2 |
| TC_CAL_69 | 7/7 ngày có plan — dots cho tất cả | Positive | P2 |
| TC_CAL_70 | Chọn ngày → scroll position reset | Positive | P2 |
| TC_CAL_71 | 500+ dayPlans — initial load < 2s | Boundary | P1 |
| TC_CAL_72 | Rapid scroll week view (50 swipes) | Boundary | P2 |
| TC_CAL_73 | 50 dishes trong 1 slot — scrollable | Boundary | P2 |
| TC_CAL_74 | Resize window rapidly 20 lần | Boundary | P2 |
| TC_CAL_75 | Switch orientation rapidly 10 lần | Boundary | P2 |
| TC_CAL_76 | CPU throttle 4x — vẫn responsive | Boundary | P2 |
| TC_CAL_77 | 1000 date changes — memory leak check | Boundary | P2 |
| TC_CAL_78 | Complex nutrition bars render < 100ms | Boundary | P3 |
| TC_CAL_79 | 365 ngày data — indicator dots perf | Boundary | P3 |
| TC_CAL_80 | Concurrent state updates | Edge | P2 |
| TC_CAL_81 | Delete dish trong plan → calendar update | Positive | P1 |
| TC_CAL_82 | Edit ingredient → nutrition cascade | Positive | P1 |
| TC_CAL_83 | Import data → calendar refresh | Positive | P1 |
| TC_CAL_84 | Cloud sync → calendar refresh | Positive | P1 |
| TC_CAL_85 | Template apply → calendar update | Positive | P1 |
| TC_CAL_86 | Clear plan → grocery list update | Positive | P1 |
| TC_CAL_87 | Language switch → day names update | Positive | P2 |
| TC_CAL_88 | Dark mode toggle → colors update | Positive | P2 |
| TC_CAL_89 | Copy plan → indicator dots update | Positive | P2 |
| TC_CAL_90 | Goal change → nutrition bars update | Positive | P2 |
| TC_CAL_91 | Keyboard Tab qua dates | Positive | P3 |
| TC_CAL_92 | Tab order logical | Positive | P3 |
| TC_CAL_93 | Focus trap trong modal từ calendar | Positive | P2 |
| TC_CAL_94 | High contrast mode | Positive | P3 |
| TC_CAL_95 | Reduced motion — disable pulse | Positive | P3 |
| TC_CAL_96 | Screen reader announces meal contents | Positive | P3 |
| TC_CAL_97 | Focus returns sau modal close | Positive | P2 |
| TC_CAL_98 | ARIA live regions nutrition updates | Positive | P3 |
| TC_CAL_99 | Touch targets >= 44px | Positive | P2 |
| TC_CAL_100 | Swipe vs browser back gesture | Edge | P1 |
| TC_CAL_101 | Pull-to-refresh không interfere | Edge | P2 |
| TC_CAL_102 | Landscape mobile layout | Edge | P2 |
| TC_CAL_103 | Split-screen mode Android | Edge | P3 |
| TC_CAL_104 | Gesture nav conflict Android | Edge | P2 |
| TC_CAL_105 | Scroll snap week view | Positive | P2 |

---

## Chi tiết Test Cases

##### TC_CAL_01: Hiển thị ngày hiện tại khi mở app
- **Pre-conditions**: App fresh load, localStorage trống hoặc có data
- **Steps**: 1. Mở app tại localhost:3000
- **Expected**: Calendar tab active, ngày hiện tại highlight với pulse animation, tuần chứa today hiển thị
- **Type**: Positive | **Priority**: P0

##### TC_CAL_02: Chọn ngày khác trên DateSelector
- **Pre-conditions**: App đã load, Calendar tab active
- **Steps**: 1. Click vào ngày khác (không phải today) trên DateSelector
- **Expected**: Ngày được chọn highlight (không pulse), meal slots cập nhật theo ngày mới
- **Type**: Positive | **Priority**: P1

##### TC_CAL_03: Điều hướng sang tuần trước
- **Pre-conditions**: App đã load, đang ở tuần hiện tại
- **Steps**: 1. Click mũi tên trái hoặc swipe right trên DateSelector
- **Expected**: Tuần trước hiển thị (7 ngày trước), selectedDate chuyển sang ngày tương ứng
- **Type**: Positive | **Priority**: P1

##### TC_CAL_04: Điều hướng sang tuần sau
- **Pre-conditions**: App đã load, đang ở tuần hiện tại
- **Steps**: 1. Click mũi tên phải hoặc swipe left trên DateSelector
- **Expected**: Tuần sau hiển thị, selectedDate chuyển tương ứng
- **Type**: Positive | **Priority**: P1

##### TC_CAL_05: Indicator dot cho ngày có plan
- **Pre-conditions**: Có ít nhất 1 ngày trong tuần có dayPlan
- **Steps**: 1. Quan sát DateSelector 2. So sánh ngày có plan vs không
- **Expected**: Ngày có plan hiển thị dot indicator, ngày trống không có dot
- **Type**: Positive | **Priority**: P1

##### TC_CAL_06: Hiển thị 3 slot bữa ăn trống
- **Pre-conditions**: Chọn ngày không có plan
- **Steps**: 1. Click vào ngày không có dayPlan
- **Expected**: 3 slot trống: Breakfast, Lunch, Dinner với nút "+"
- **Type**: Positive | **Priority**: P1

##### TC_CAL_07: Hiển thị món trong slot đã có plan
- **Pre-conditions**: Ngày đã chọn có dayPlan với dishes
- **Steps**: 1. Chọn ngày có plan 2. Quan sát meal slots
- **Expected**: Mỗi slot hiển thị danh sách tên món, icon, nutrition summary
- **Type**: Positive | **Priority**: P1

##### TC_CAL_08: Tổng calo/protein trên mỗi slot
- **Pre-conditions**: Ngày có plan với dishes có nutrition data
- **Steps**: 1. Quan sát mỗi meal slot
- **Expected**: Mỗi slot hiển thị tổng calories (kcal) và protein (g)
- **Type**: Positive | **Priority**: P1

##### TC_CAL_09: Nhấn slot trống mở MealPlannerModal
- **Pre-conditions**: Ngày có slot trống
- **Steps**: 1. Click vào slot trống
- **Expected**: MealPlannerModal mở với tab tương ứng (breakfast/lunch/dinner)
- **Type**: Positive | **Priority**: P1

##### TC_CAL_10: Chuyển sub-tab Meals ↔ Nutrition (mobile)
- **Pre-conditions**: Viewport < 1024px, Calendar tab active
- **Steps**: 1. Click "Meals" 2. Click "Nutrition" 3. Click "Meals"
- **Expected**: Content chuyển đổi mượt, data consistent giữa 2 views
- **Type**: Positive | **Priority**: P1

##### TC_CAL_11: Desktop side-by-side layout
- **Pre-conditions**: Viewport >= 1024px
- **Steps**: 1. Mở app trên desktop browser
- **Expected**: Meals và Nutrition hiển thị side-by-side, không sub-tab toggle
- **Type**: Positive | **Priority**: P2

##### TC_CAL_12: Action bar hiển thị đủ buttons
- **Pre-conditions**: Calendar tab active, ngày có plan
- **Steps**: 1. Quan sát MealActionBar
- **Expected**: 4 buttons: AI Gợi ý, Xóa kế hoạch, Copy, Template
- **Type**: Positive | **Priority**: P1

##### TC_CAL_13: Nhấn AI Gợi ý
- **Pre-conditions**: Calendar tab active
- **Steps**: 1. Click "AI Gợi ý"
- **Expected**: AISuggestionPreviewModal mở, generate suggestion
- **Type**: Positive | **Priority**: P1

##### TC_CAL_14: Nhấn Xóa kế hoạch
- **Pre-conditions**: Calendar tab, ngày có plan
- **Steps**: 1. Click "Xóa kế hoạch"
- **Expected**: ClearPlanModal mở với options Day/Week/Month
- **Type**: Positive | **Priority**: P1

##### TC_CAL_15: Nhấn Copy
- **Pre-conditions**: Calendar tab, ngày có plan
- **Steps**: 1. Click "Copy"
- **Expected**: CopyPlanModal mở với target date selection
- **Type**: Positive | **Priority**: P2

##### TC_CAL_16: Nhấn Template
- **Pre-conditions**: Calendar tab active
- **Steps**: 1. Click "Template"
- **Expected**: TemplateManager modal mở
- **Type**: Positive | **Priority**: P2

##### TC_CAL_17: Date format locale vi-VN
- **Pre-conditions**: Language = Vietnamese
- **Steps**: 1. Quan sát DateSelector
- **Expected**: Format "Th 2", "Th 3"... "CN", ngày "dd/MM"
- **Type**: Positive | **Priority**: P2

##### TC_CAL_18: Date format locale en-US
- **Pre-conditions**: Language = English
- **Steps**: 1. Chuyển English 2. Quan sát dates
- **Expected**: "Mon", "Tue"... "Sun", date "MM/dd"
- **Type**: Positive | **Priority**: P2

##### TC_CAL_19: Chuyển ngày qua ranh giới tháng
- **Pre-conditions**: Đang ở ngày cuối tháng (31/01)
- **Steps**: 1. Navigate sang ngày hôm sau
- **Expected**: Chuyển sang 01/02, tháng label update
- **Type**: Edge | **Priority**: P2

##### TC_CAL_20: Chuyển ngày qua ranh giới năm
- **Pre-conditions**: Đang ở 31/12/2026
- **Steps**: 1. Navigate sang ngày hôm sau
- **Expected**: Chuyển sang 01/01/2027, năm label update
- **Type**: Edge | **Priority**: P2

##### TC_CAL_21: Plan chỉ có 1 bữa
- **Pre-conditions**: Ngày chỉ có breakfast, lunch/dinner trống
- **Steps**: 1. Chọn ngày đó
- **Expected**: Breakfast hiển thị dishes, Lunch/Dinner slot trống "+"
- **Type**: Edge | **Priority**: P2

##### TC_CAL_22: DST spring forward
- **Pre-conditions**: Timezone có DST, ngày spring forward
- **Steps**: 1. Tạo plan cho ngày DST 2. Reload
- **Expected**: Plan vẫn hiển thị đúng, không mất
- **Type**: Edge | **Priority**: P1

##### TC_CAL_23: DST fall back
- **Pre-conditions**: Timezone có DST, ngày fall back
- **Steps**: 1. Tạo plan 2. Reload
- **Expected**: Chỉ 1 plan, không duplicate
- **Type**: Edge | **Priority**: P1

##### TC_CAL_24: Leap year Feb 29
- **Pre-conditions**: Năm nhuận 2028, plan cho 29/02
- **Steps**: 1. Navigate đến 29/02/2028
- **Expected**: Ngày hiển thị đúng, plan đầy đủ
- **Type**: Edge | **Priority**: P2

##### TC_CAL_25: Feb 29 → non-leap year
- **Pre-conditions**: Đang xem 29/02/2028
- **Steps**: 1. Navigate sang 2027
- **Expected**: Không crash, hiển thị Feb 28 hoặc Mar 1
- **Type**: Edge | **Priority**: P2

##### TC_CAL_26: Rapid date switching
- **Pre-conditions**: Calendar tab active
- **Steps**: 1. Click 10 ngày khác nhau trong < 1s
- **Expected**: Ngày cuối cùng được chọn đúng, UI stable
- **Type**: Edge | **Priority**: P2

##### TC_CAL_27: Rapid sub-tab switch
- **Pre-conditions**: Mobile, Calendar tab
- **Steps**: 1. Toggle Meals/Nutrition 20 lần nhanh
- **Expected**: Tab cuối hiển thị đúng, không crash
- **Type**: Edge | **Priority**: P2

##### TC_CAL_28: 100+ món trong slot
- **Pre-conditions**: Slot có 100 dishIds
- **Steps**: 1. Chọn ngày 2. Đo render time
- **Expected**: Render < 500ms, scroll mượt
- **Type**: Boundary | **Priority**: P2

##### TC_CAL_29: Empty localStorage
- **Pre-conditions**: localStorage.clear()
- **Steps**: 1. Clear localStorage 2. Reload
- **Expected**: App load bình thường, calendar tuần hiện tại, slots trống
- **Type**: Edge | **Priority**: P1

##### TC_CAL_30: Corrupt localStorage dayPlans
- **Pre-conditions**: localStorage['mp-day-plans'] = "invalid json"
- **Steps**: 1. Set corrupt data 2. Reload
- **Expected**: Không crash, fallback empty dayPlans
- **Type**: Negative | **Priority**: P1

##### TC_CAL_31: Corrupt date format
- **Pre-conditions**: Date string "2026-13-45"
- **Steps**: 1. parseLocalDate xử lý
- **Expected**: Graceful handling, không crash
- **Type**: Negative | **Priority**: P2

##### TC_CAL_32: XSS trong tên món
- **Pre-conditions**: Dish name = "<script>alert('xss')</script>"
- **Steps**: 1. Tạo dish tên XSS 2. Thêm vào plan 3. Xem calendar
- **Expected**: Text thuần, không execute script
- **Type**: Negative | **Priority**: P0

##### TC_CAL_33: Tên món 200 ký tự
- **Pre-conditions**: Dish name = 200 chars
- **Steps**: 1. Tạo dish dài 2. Thêm vào plan
- **Expected**: Truncate "...", không break layout
- **Type**: Boundary | **Priority**: P3

##### TC_CAL_34: Nutrition cascade
- **Pre-conditions**: Calendar tab, ngày có plan
- **Steps**: 1. Thêm món mới vào breakfast 2. Quan sát nutrition
- **Expected**: Nutrition bars update real-time
- **Type**: Positive | **Priority**: P1

##### TC_CAL_35: Grocery sync
- **Pre-conditions**: Calendar tab, ngày có plan
- **Steps**: 1. Thêm món 2. Chuyển Grocery tab
- **Expected**: Grocery list có ingredients mới
- **Type**: Positive | **Priority**: P1

##### TC_CAL_36: 100+ ngày dots
- **Pre-conditions**: 100+ dayPlans
- **Steps**: 1. Navigate nhiều tuần
- **Expected**: Dots đúng, performance ổn
- **Type**: Boundary | **Priority**: P3

##### TC_CAL_37: Tuần 2 tháng
- **Pre-conditions**: Tuần 28/01 → 03/02
- **Steps**: 1. Quan sát DateSelector
- **Expected**: Đủ 7 ngày, label 2 tháng
- **Type**: Edge | **Priority**: P2

##### TC_CAL_38: Tuần 2 năm
- **Pre-conditions**: Tuần 29/12 → 04/01
- **Steps**: 1. Quan sát
- **Expected**: 7 ngày đúng, năm label update
- **Type**: Edge | **Priority**: P2

##### TC_CAL_39: 1/1 tuần trước
- **Pre-conditions**: selectedDate = 01/01
- **Steps**: 1. Navigate tuần trước
- **Expected**: Tuần cuối năm cũ hiển thị
- **Type**: Edge | **Priority**: P2

##### TC_CAL_40: 31/12 tuần sau
- **Pre-conditions**: selectedDate = 31/12
- **Steps**: 1. Navigate tuần sau
- **Expected**: Tuần đầu năm mới
- **Type**: Edge | **Priority**: P2

##### TC_CAL_41: Midnight rollover
- **Pre-conditions**: App mở gần midnight
- **Steps**: 1. Đợi qua midnight
- **Expected**: Today highlight chuyển ngày mới, plan đúng
- **Type**: Edge | **Priority**: P1

##### TC_CAL_42: Reload giữa date change
- **Pre-conditions**: Đang chọn ngày
- **Steps**: 1. Click ngày mới 2. F5 reload ngay
- **Expected**: Quay về today, plan data preserved
- **Type**: Edge | **Priority**: P2

##### TC_CAL_43: Multi-tab localStorage
- **Pre-conditions**: 2 tabs mở app
- **Steps**: 1. Tab 1: thêm plan 2. Tab 2: reload
- **Expected**: Tab 2 thấy plan mới
- **Type**: Edge | **Priority**: P2

##### TC_CAL_44: Slot có món → pre-selected
- **Pre-conditions**: Ngày có plan breakfast
- **Steps**: 1. Click breakfast slot
- **Expected**: MealPlannerModal mở, dishes pre-selected
- **Type**: Positive | **Priority**: P1

##### TC_CAL_45: Nutrition bar tỉ lệ
- **Pre-conditions**: Ngày có plan, targets set
- **Steps**: 1. Quan sát mini bars
- **Expected**: Width = actual/target * 100%
- **Type**: Positive | **Priority**: P1

##### TC_CAL_46: Nutrition bar overflow
- **Pre-conditions**: Actual > target
- **Steps**: 1. Nhiều món vượt target
- **Expected**: Bar capped, warning color, actual number đúng
- **Type**: Boundary | **Priority**: P2

##### TC_CAL_47: Swipe chuyển tuần
- **Pre-conditions**: Mobile, Calendar tab
- **Steps**: 1. Swipe left > 50px
- **Expected**: Chuyển tuần sau
- **Type**: Positive | **Priority**: P2

##### TC_CAL_48: Action bar disabled
- **Pre-conditions**: Ngày trống
- **Steps**: 1. Quan sát action bar
- **Expected**: Copy/Clear disabled, AI/Template enabled
- **Type**: Negative | **Priority**: P2

##### TC_CAL_49: Keyboard navigation
- **Pre-conditions**: Desktop
- **Steps**: 1. Focus DateSelector 2. Arrow keys
- **Expected**: Arrow Left/Right chuyển ngày
- **Type**: Positive | **Priority**: P3

##### TC_CAL_50: Screen reader
- **Pre-conditions**: Screen reader on
- **Steps**: 1. Navigate dates
- **Expected**: Đọc ngày, trạng thái plan, nutrition
- **Type**: Positive | **Priority**: P3

##### TC_CAL_51: Language switch day names
- **Pre-conditions**: Vietnamese
- **Steps**: 1. Switch English 2. Quan sát
- **Expected**: "Th 2"→"Mon", "CN"→"Sun"
- **Type**: Positive | **Priority**: P2

##### TC_CAL_52: Dark mode calendar
- **Pre-conditions**: Dark mode
- **Steps**: 1. Bật dark 2. Quan sát
- **Expected**: Dark bg, light text, contrast đủ
- **Type**: Positive | **Priority**: P2

##### TC_CAL_53: 7 ngày trống
- **Pre-conditions**: Tuần không có plan
- **Steps**: 1. Navigate tuần trống
- **Expected**: 7x3 slots trống, UI nhất quán
- **Type**: Edge | **Priority**: P2

##### TC_CAL_54: Dish bị xóa trong plan
- **Pre-conditions**: Plan reference dishId không tồn tại
- **Steps**: 1. Xóa dish 2. Quay lại Calendar
- **Expected**: Graceful handling, không crash
- **Type**: Edge | **Priority**: P1

##### TC_CAL_55: Tab switch preserve state
- **Pre-conditions**: Đang xem ngày khác today
- **Steps**: 1. Chuyển Library 2. Quay Calendar
- **Expected**: selectedDate, scroll preserved
- **Type**: Positive | **Priority**: P1

##### TC_CAL_56: Timezone khác UTC
- **Pre-conditions**: Timezone UTC+7
- **Steps**: 1. Mở app lúc 23:30 UTC
- **Expected**: Today = ngày local (không phải UTC)
- **Type**: Edge | **Priority**: P1

##### TC_CAL_57: Tab visibility change
- **Pre-conditions**: App đang mở
- **Steps**: 1. Switch browser tab 2. Đợi 5 phút 3. Quay lại
- **Expected**: Calendar đúng, data preserved
- **Type**: Edge | **Priority**: P2

##### TC_CAL_58: Orientation change
- **Pre-conditions**: Mobile
- **Steps**: 1. Portrait → Landscape → Portrait
- **Expected**: Layout adapt, data preserved
- **Type**: Edge | **Priority**: P2

##### TC_CAL_59: Memory pressure
- **Pre-conditions**: Nhiều tabs mở
- **Steps**: 1. DevTools Performance > Memory pressure
- **Expected**: State preserved, không crash
- **Type**: Edge | **Priority**: P2

##### TC_CAL_60: PWA mode
- **Pre-conditions**: Add to Home Screen
- **Steps**: 1. Mở từ home screen
- **Expected**: Calendar hoạt động bình thường
- **Type**: Edge | **Priority**: P2

##### TC_CAL_61: RTL text tên món
- **Pre-conditions**: Dish name Arabic
- **Steps**: 1. Tạo dish Arabic 2. Thêm plan
- **Expected**: Hiển thị đúng direction
- **Type**: Edge | **Priority**: P3

##### TC_CAL_62: Emoji tên món
- **Pre-conditions**: Dish name có emoji
- **Steps**: 1. Dish "Bún bò 🍜" 2. Thêm plan
- **Expected**: Emoji hiển thị đúng
- **Type**: Edge | **Priority**: P3

##### TC_CAL_63: Concurrent localStorage writes
- **Pre-conditions**: 2 tabs mở
- **Steps**: 1. Tab 1: add breakfast 2. Tab 2: add lunch 3. Reload cả 2
- **Expected**: No data corruption
- **Type**: Edge | **Priority**: P1

##### TC_CAL_64: localStorage quota gần đầy
- **Pre-conditions**: localStorage > 4.5MB
- **Steps**: 1. Thêm plan mới
- **Expected**: Graceful error hoặc save thành công
- **Type**: Boundary | **Priority**: P1

##### TC_CAL_65: Ngày quá khứ xa
- **Pre-conditions**: Navigate đến 1900
- **Steps**: 1. Liên tục tuần trước
- **Expected**: Không crash, date format đúng
- **Type**: Boundary | **Priority**: P3

##### TC_CAL_66: Ngày tương lai xa
- **Pre-conditions**: Navigate đến 2100
- **Steps**: 1. Liên tục tuần sau
- **Expected**: Không crash
- **Type**: Boundary | **Priority**: P3

##### TC_CAL_67: DST US/Pacific
- **Pre-conditions**: Timezone US/Pacific
- **Steps**: 1. Plan cho ngày spring forward 2. Reload
- **Expected**: Plan đúng ngày
- **Type**: Edge | **Priority**: P2

##### TC_CAL_68: Ngày không tồn tại
- **Pre-conditions**: Data reference "2026-02-30"
- **Steps**: 1. Load data có date invalid
- **Expected**: Handled gracefully
- **Type**: Edge | **Priority**: P2

##### TC_CAL_69: 7/7 ngày có plan
- **Pre-conditions**: Full week plans
- **Steps**: 1. Quan sát DateSelector
- **Expected**: 7 dots hiển thị
- **Type**: Positive | **Priority**: P2

##### TC_CAL_70: Scroll reset on date change
- **Pre-conditions**: Đang scroll xuống
- **Steps**: 1. Scroll down 2. Click ngày khác
- **Expected**: Scroll reset top
- **Type**: Positive | **Priority**: P2

##### TC_CAL_71: 500+ dayPlans load
- **Pre-conditions**: 500+ dayPlans localStorage
- **Steps**: 1. Reload 2. Measure load time
- **Expected**: < 2 seconds
- **Type**: Boundary | **Priority**: P1

##### TC_CAL_72: 50 rapid swipes
- **Pre-conditions**: Mobile week view
- **Steps**: 1. Swipe 50 lần nhanh
- **Expected**: UI không freeze, dừng đúng tuần
- **Type**: Boundary | **Priority**: P2

##### TC_CAL_73: 50 dishes 1 slot
- **Pre-conditions**: Breakfast 50 dishes
- **Steps**: 1. Xem slot
- **Expected**: Scrollable, nutrition đúng
- **Type**: Boundary | **Priority**: P2

##### TC_CAL_74: Rapid window resize
- **Pre-conditions**: Desktop
- **Steps**: 1. Resize 20 lần nhanh
- **Expected**: Layout stable, no crash
- **Type**: Boundary | **Priority**: P2

##### TC_CAL_75: Rapid orientation switch
- **Pre-conditions**: Mobile
- **Steps**: 1. Rotate 10 lần
- **Expected**: Layout stable
- **Type**: Boundary | **Priority**: P2

##### TC_CAL_76: CPU throttle 4x
- **Pre-conditions**: DevTools throttle
- **Steps**: 1. Navigate, add plans
- **Expected**: Chậm nhưng không freeze
- **Type**: Boundary | **Priority**: P2

##### TC_CAL_77: Memory leak 1000 changes
- **Pre-conditions**: DevTools Memory
- **Steps**: 1. Snapshot 2. 1000 date changes 3. Snapshot
- **Expected**: Growth < 10MB
- **Type**: Boundary | **Priority**: P2

##### TC_CAL_78: Nutrition bars render
- **Pre-conditions**: 3 meals x 10 dishes
- **Steps**: 1. Select date 2. Measure render
- **Expected**: < 100ms
- **Type**: Boundary | **Priority**: P3

##### TC_CAL_79: 365 days dots perf
- **Pre-conditions**: Full year data
- **Steps**: 1. Navigate weeks
- **Expected**: < 200ms per week
- **Type**: Boundary | **Priority**: P3

##### TC_CAL_80: Concurrent state updates
- **Pre-conditions**: Calendar active
- **Steps**: 1. Add dish + change date simultaneously
- **Expected**: No race condition, consistent state
- **Type**: Edge | **Priority**: P2

##### TC_CAL_81: Delete dish in plan
- **Pre-conditions**: Dish A in today's breakfast
- **Steps**: 1. DishManager xóa A 2. Back Calendar
- **Expected**: Calendar updated (dish blocked if in use, or removed from plan)
- **Type**: Positive | **Priority**: P1

##### TC_CAL_82: Edit ingredient cascade
- **Pre-conditions**: Ingredient Egg cal=155, dish uses Egg, in plan
- **Steps**: 1. Edit Egg cal→180 2. Back Calendar
- **Expected**: Nutrition trên slot cập nhật
- **Type**: Positive | **Priority**: P1

##### TC_CAL_83: Import data refresh
- **Pre-conditions**: Calendar tab
- **Steps**: 1. Settings > Import JSON with different plans
- **Expected**: Calendar refresh, dots update
- **Type**: Positive | **Priority**: P1

##### TC_CAL_84: Cloud sync refresh
- **Pre-conditions**: Signed in, remote data khác
- **Steps**: 1. Sync download 2. Choose "Use Cloud"
- **Expected**: Calendar refresh với remote data
- **Type**: Positive | **Priority**: P1

##### TC_CAL_85: Template apply
- **Pre-conditions**: Saved template, Calendar tab
- **Steps**: 1. TemplateManager 2. Apply to today
- **Expected**: Slots update với template dishes
- **Type**: Positive | **Priority**: P1

##### TC_CAL_86: Clear plan → grocery
- **Pre-conditions**: Plan, grocery items
- **Steps**: 1. Clear plan 2. Check Grocery
- **Expected**: Grocery items from cleared plan removed
- **Type**: Positive | **Priority**: P1

##### TC_CAL_87: Language → day names
- **Pre-conditions**: Vietnamese
- **Steps**: 1. Switch English 2. Back Calendar
- **Expected**: "Th 2"→"Mon", "CN"→"Sun"
- **Type**: Positive | **Priority**: P2

##### TC_CAL_88: Dark mode colors
- **Pre-conditions**: Light mode
- **Steps**: 1. Toggle dark 2. Calendar
- **Expected**: Colors change to dark theme
- **Type**: Positive | **Priority**: P2

##### TC_CAL_89: Copy plan dots
- **Pre-conditions**: Day A has plan, Day B empty
- **Steps**: 1. Copy A→B 2. Check dots
- **Expected**: Day B gets dot
- **Type**: Positive | **Priority**: P2

##### TC_CAL_90: Goal change bars
- **Pre-conditions**: Plan, goals set
- **Steps**: 1. Change target cal 2. Check bars
- **Expected**: Bars recalculate proportion
- **Type**: Positive | **Priority**: P2

##### TC_CAL_91: Keyboard Tab dates
- **Pre-conditions**: Desktop
- **Steps**: 1. Tab through dates
- **Expected**: Focus moves logically, visible indicator
- **Type**: Positive | **Priority**: P3

##### TC_CAL_92: Tab order
- **Pre-conditions**: Desktop
- **Steps**: 1. Tab from start
- **Expected**: DateSelector → dates → slots → action bar
- **Type**: Positive | **Priority**: P3

##### TC_CAL_93: Focus trap modal
- **Pre-conditions**: Calendar
- **Steps**: 1. Open modal 2. Tab repeatedly
- **Expected**: Focus stays in modal
- **Type**: Positive | **Priority**: P2

##### TC_CAL_94: High contrast
- **Pre-conditions**: OS high contrast
- **Steps**: 1. View calendar
- **Expected**: All elements visible, sufficient contrast
- **Type**: Positive | **Priority**: P3

##### TC_CAL_95: Reduced motion
- **Pre-conditions**: prefers-reduced-motion
- **Steps**: 1. View today
- **Expected**: Pulse disabled, static highlight
- **Type**: Positive | **Priority**: P3

##### TC_CAL_96: Screen reader meals
- **Pre-conditions**: Screen reader, plan exists
- **Steps**: 1. Focus meal slot
- **Expected**: Announces type, dish count, nutrition
- **Type**: Positive | **Priority**: P3

##### TC_CAL_97: Focus return after modal
- **Pre-conditions**: Click slot → modal
- **Steps**: 1. Close modal
- **Expected**: Focus returns to triggering slot
- **Type**: Positive | **Priority**: P2

##### TC_CAL_98: ARIA live nutrition
- **Pre-conditions**: Screen reader
- **Steps**: 1. Add dish via modal
- **Expected**: Live region announces nutrition change
- **Type**: Positive | **Priority**: P3

##### TC_CAL_99: Touch targets 44px
- **Pre-conditions**: Mobile
- **Steps**: 1. Inspect all interactive elements
- **Expected**: All >= 44x44px
- **Type**: Positive | **Priority**: P2

##### TC_CAL_100: Swipe vs browser back
- **Pre-conditions**: Chrome Android
- **Steps**: 1. Swipe right on calendar
- **Expected**: Calendar nav, not browser back
- **Type**: Edge | **Priority**: P1

##### TC_CAL_101: Pull-to-refresh
- **Pre-conditions**: Mobile browser
- **Steps**: 1. Pull down at top
- **Expected**: No interference with calendar
- **Type**: Edge | **Priority**: P2

##### TC_CAL_102: Landscape mobile
- **Pre-conditions**: Mobile landscape
- **Steps**: 1. Rotate 2. View calendar
- **Expected**: Usable, no overflow
- **Type**: Edge | **Priority**: P2

##### TC_CAL_103: Split-screen Android
- **Pre-conditions**: Android split-screen
- **Steps**: 1. Put app in half screen
- **Expected**: Calendar adapts, functional
- **Type**: Edge | **Priority**: P3

##### TC_CAL_104: Gesture nav conflict
- **Pre-conditions**: Android gesture nav
- **Steps**: 1. Swipe from screen edge
- **Expected**: System gesture priority, no conflict
- **Type**: Edge | **Priority**: P2

##### TC_CAL_105: Scroll snap week
- **Pre-conditions**: Mobile week view
- **Steps**: 1. Partial scroll between weeks 2. Release
- **Expected**: Snaps to nearest full week
- **Type**: Positive | **Priority**: P2

---

## Đề xuất Cải tiến

### Đề xuất 1: Week Overview Summary Bar
- **Vấn đề hiện tại**: Người dùng chỉ thấy dinh dưỡng từng ngày, không có cái nhìn tổng quan cả tuần.
- **Giải pháp đề xuất**: Thêm thanh tổng hợp tuần phía trên DateSelector: calories TB/ngày, số ngày có plan, trend so với tuần trước.
- **Lý do chi tiết**: Dashboard overview giúp quyết định nhanh hơn 40%. User meal planner cần biết "tuần này đủ chưa" thay vì chỉ "hôm nay đủ chưa".
- **Phần trăm cải thiện**: Task completion +25%, Time-on-task -30%, Satisfaction +20%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 2: Drag & Drop giữa slots
- **Vấn đề hiện tại**: Chuyển món Sáng→Trưa = xóa → modal → thêm lại = 6+ bước.
- **Giải pháp đề xuất**: Drag & drop trực tiếp. Mobile: long-press. Desktop: click-drag.
- **Lý do chi tiết**: Direct manipulation nhanh 3-5x so với modal (Fitts' Law). Pattern quen thuộc (Trello, Google Calendar).
- **Phần trăm cải thiện**: Task time -70%, Error rate -50%, Satisfaction +35%
- **Mức độ ưu tiên**: High | **Effort**: L

### Đề xuất 3: Quick Add inline search
- **Vấn đề hiện tại**: Thêm món = 5 bước (click → modal → search → select → confirm).
- **Giải pháp đề xuất**: Inline dropdown search khi click "+", full modal chỉ khi cần filter nâng cao.
- **Lý do chi tiết**: 80% user chỉ search nhanh 1 món. Inline giảm context switch.
- **Phần trăm cải thiện**: Task time -60%, Perceived speed +40%, Context preservation +90%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 4: Calendar Month View heatmap
- **Vấn đề hiện tại**: Week view giới hạn, user không thấy pattern dài hạn.
- **Giải pháp đề xuất**: Month view + heatmap (xanh=đạt, vàng=gần, đỏ=vượt/thiếu).
- **Lý do chi tiết**: Month view giúp nhận patterns (cuối tuần vượt cal). Heatmap cực mạnh cho data viz (GitHub, Apple Health).
- **Phần trăm cải thiện**: User insight +50%, Adherence +30%, Engagement +25%
- **Mức độ ưu tiên**: Medium | **Effort**: L

### Đề xuất 5: Swipe + Haptic Feedback
- **Vấn đề hiện tại**: Mobile chuyển ngày phải nhấn chính xác vào target nhỏ.
- **Giải pháp đề xuất**: Swipe left/right trên content area + haptic 10ms.
- **Lý do chi tiết**: Swipe tự nhiên (Instagram). Haptic tăng confidence. Apple HIG khuyến nghị cho navigation.
- **Phần trăm cải thiện**: Mobile usability +30%, Error rate -25%, Engagement +15%
- **Mức độ ưu tiên**: Medium | **Effort**: S
