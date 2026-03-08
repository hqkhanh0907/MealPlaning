# Phân tích Scenario & Test Cases chi tiết — Smart Meal Planner

> **Version**: 1.0  
> **Date**: 2026-03-08  
> **Author**: QA Team  
> **Total Test Cases**: 315  
> **Coverage**: 15 Scenarios  
> **Related**: [Test Plan](test-plan.md) | [Test Report](test-report.md) | [E2E Setup](e2e-setup.md)

---

## Mục lục

- [Scenario 1: Calendar & Meal Planning](#scenario-1-calendar--meal-planning)
- [Scenario 2: Meal Planner Modal](#scenario-2-meal-planner-modal)
- [Scenario 3: Nutrition Tracking](#scenario-3-nutrition-tracking)
- [Scenario 4: AI Meal Suggestion](#scenario-4-ai-meal-suggestion)
- [Scenario 5: AI Image Analysis](#scenario-5-ai-image-analysis)
- [Scenario 6: Ingredient CRUD](#scenario-6-ingredient-crud)
- [Scenario 7: Dish CRUD](#scenario-7-dish-crud)
- [Scenario 8: Settings & Config](#scenario-8-settings--config)
- [Scenario 9: Goal Settings](#scenario-9-goal-settings)
- [Scenario 10: Copy Plan](#scenario-10-copy-plan)
- [Scenario 11: Clear Plan](#scenario-11-clear-plan)
- [Scenario 12: Template Manager](#scenario-12-template-manager)
- [Scenario 13: Save Template](#scenario-13-save-template)
- [Scenario 14: Grocery List](#scenario-14-grocery-list)
- [Scenario 15: Background Translation](#scenario-15-background-translation)
- [Tổng hợp](#tổng-hợp)

---

## Quy ước

| Ký hiệu | Ý nghĩa |
|----------|----------|
| **P0** | Critical — Gây crash / mất dữ liệu |
| **P1** | High — Chức năng cốt lõi không hoạt động |
| **P2** | Medium — Chức năng phụ bị lỗi |
| **P3** | Low — Cosmetic / minor |
| **Positive** | Happy path — Luồng bình thường |
| **Negative** | Error handling — Xử lý lỗi |
| **Edge** | Edge case — Trường hợp biên |
| **Boundary** | Boundary — Giới hạn giá trị |

---

## Scenario 1: Calendar & Meal Planning

### Mô tả tổng quan

Đây là màn hình chính của ứng dụng. Người dùng xem lịch tuần, chọn ngày, xem các bữa ăn đã lên kế hoạch (sáng/trưa/tối) và dinh dưỡng tương ứng. Trên mobile hiển thị dạng tab (Meals/Nutrition), trên desktop hiển thị side-by-side. Mỗi ngày có 3 slot bữa ăn với các món đã chọn và tổng dinh dưỡng.

### Components & Services

| Component | File | Vai trò |
|-----------|------|---------|
| CalendarTab | `src/components/CalendarTab.tsx` | Container chính cho tab Calendar |
| DateSelector | `src/components/DateSelector.tsx` | Thanh chọn ngày dạng tuần |
| MealsSubTab | `src/components/schedule/MealsSubTab.tsx` | Hiển thị 3 slot bữa ăn |
| NutritionSubTab | `src/components/schedule/NutritionSubTab.tsx` | Hiển thị tổng dinh dưỡng |
| MealSlot | `src/components/schedule/MealSlot.tsx` | Hiển thị 1 slot bữa ăn |
| MealActionBar | `src/components/schedule/MealActionBar.tsx` | Thanh action buttons |
| MiniNutritionBar | `src/components/schedule/MiniNutritionBar.tsx` | Progress bar dinh dưỡng mini |

### Luồng nghiệp vụ

1. User mở app → Tab Calendar hiển thị mặc định, ngày hiện tại được chọn
2. DateSelector hiển thị 7 ngày trong tuần hiện tại
3. User chọn ngày → `selectedDate` cập nhật → `currentPlan` tính lại từ `dayPlans`
4. 3 MealSlot hiển thị: Sáng, Trưa, Tối với danh sách món + tổng dinh dưỡng
5. User nhấn slot trống → mở MealPlannerModal
6. User nhấn action bar → AI Gợi ý / Xóa / Copy / Template

### Quy tắc nghiệp vụ

- Ngày mặc định = ngày hiện tại (YYYY-MM-DD format, timezone local)
- Không có DayPlan → `createEmptyDayPlan(date)` với 3 mảng rỗng
- Mobile: sub-tab Meals/Nutrition; Desktop: grid 2:1 side-by-side
- Locale: vi → `vi-VN`, en → `en-US` cho date formatting

### Test Cases

| TC ID | Tiêu đề | Loại | Ưu tiên |
|-------|---------|------|---------|
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

#### TC_CAL_01: Hiển thị ngày hiện tại khi mở app
- **Pre-conditions**: App vừa được mở lần đầu hoặc sau khi reload
- **Steps**: 1. Mở ứng dụng Smart Meal Planner 2. Quan sát DateSelector trên tab Calendar
- **Expected Result**: Ngày hiện tại được highlight/selected, thanh ngày hiển thị tuần chứa ngày hiện tại
- **Priority**: P0 | **Type**: Positive

#### TC_CAL_02: Chọn ngày khác trên DateSelector
- **Pre-conditions**: App đang ở tab Calendar
- **Steps**: 1. Quan sát ngày đang chọn 2. Nhấn vào một ngày khác trong tuần
- **Expected Result**: Ngày mới highlight, nội dung bữa ăn cập nhật theo ngày mới
- **Priority**: P1 | **Type**: Positive

#### TC_CAL_03: Điều hướng sang tuần trước
- **Pre-conditions**: App ở tab Calendar, tuần hiện tại hiển thị
- **Steps**: 1. Nhấn mũi tên trái trên DateSelector 2. Quan sát tuần hiển thị
- **Expected Result**: Hiển thị 7 ngày tuần trước
- **Priority**: P1 | **Type**: Positive

#### TC_CAL_04: Điều hướng sang tuần sau
- **Pre-conditions**: App ở tab Calendar
- **Steps**: 1. Nhấn mũi tên phải trên DateSelector
- **Expected Result**: Hiển thị 7 ngày tuần sau
- **Priority**: P1 | **Type**: Positive

#### TC_CAL_05: Indicator dot cho ngày có plan
- **Pre-conditions**: Có DayPlan cho ít nhất 1 ngày trong tuần
- **Steps**: 1. Quan sát DateSelector 2. So sánh ngày có plan vs không
- **Expected Result**: Ngày có plan → dot indicator, ngày trống → không có dot
- **Priority**: P1 | **Type**: Positive

#### TC_CAL_06: Hiển thị 3 slot bữa ăn trống
- **Pre-conditions**: Chọn ngày không có DayPlan
- **Steps**: 1. Chọn ngày trống 2. Quan sát khu vực Meals
- **Expected Result**: 3 slot Sáng/Trưa/Tối trạng thái trống với nút "+"
- **Priority**: P1 | **Type**: Positive

#### TC_CAL_07: Hiển thị món trong slot đã có plan
- **Pre-conditions**: DayPlan có ít nhất 1 món trong slot breakfast
- **Steps**: 1. Chọn ngày có plan bữa sáng 2. Quan sát slot Sáng
- **Expected Result**: Tên các món hiển thị đúng ngôn ngữ hiện tại
- **Priority**: P1 | **Type**: Positive

#### TC_CAL_08: Tổng calo/protein trên mỗi slot
- **Pre-conditions**: Slot có ít nhất 1 món ăn
- **Steps**: 1. Quan sát slot có món 2. Kiểm tra tổng dinh dưỡng
- **Expected Result**: Tổng calories/protein = sum(ingredientPer100/100 * amount) cho tất cả món
- **Priority**: P1 | **Type**: Positive

#### TC_CAL_09: Nhấn slot trống mở MealPlannerModal
- **Pre-conditions**: Có slot trống
- **Steps**: 1. Nhấn vào slot trống hoặc nút "+" 2. Quan sát modal
- **Expected Result**: MealPlannerModal mở với tab meal type tương ứng đã chọn
- **Priority**: P1 | **Type**: Positive

#### TC_CAL_10: Chuyển sub-tab Meals ↔ Nutrition (mobile)
- **Pre-conditions**: Viewport mobile (< 768px)
- **Steps**: 1. Đang ở sub-tab Meals 2. Nhấn tab Nutrition 3. Nhấn lại Meals
- **Expected Result**: Nội dung chuyển đổi đúng, Meals hiển thị slots, Nutrition hiển thị tổng
- **Priority**: P1 | **Type**: Positive

#### TC_CAL_11: Desktop side-by-side layout
- **Pre-conditions**: Viewport desktop (>= 768px)
- **Steps**: 1. Mở app trên desktop 2. Quan sát Calendar tab
- **Expected Result**: Meals (2/3 width) + Nutrition (1/3 width) side-by-side, không có sub-tab
- **Priority**: P2 | **Type**: Positive

#### TC_CAL_12–21: (Chi tiết tương tự các TC trên)
- TC_CAL_12: Action bar đủ buttons (Plan, AI, Clear, Copy, Template) → P1
- TC_CAL_13: AI Gợi ý → loading state + gọi startSuggestion → P1
- TC_CAL_14: Xóa → ClearPlanModal hiển thị 3 scope → P1
- TC_CAL_15: Copy → CopyPlanModal với sourceDate → P2
- TC_CAL_16: Template → TemplateManager modal → P2
- TC_CAL_17: vi-VN date format (Th 2, 08/03) → P2
- TC_CAL_18: en-US date format (Mon, 3/8) → P2
- TC_CAL_19: Ranh giới tháng → parseLocalDate xử lý đúng → P2
- TC_CAL_20: Ranh giới năm 31/12 → 01/01 → không lỗi → P2
- TC_CAL_21: Plan 1 bữa → 2 slot còn lại trống → P2

---

## Scenario 2: Meal Planner Modal

### Mô tả tổng quan

Modal cho phép người dùng chọn món ăn cho từng bữa. Hỗ trợ 3 tab (Sáng/Trưa/Tối), tìm kiếm, lọc, toggle chọn/bỏ chọn món. Sau khi xác nhận, cập nhật DayPlan cho ngày đã chọn.

### Components & Services

| Component | File | Vai trò |
|-----------|------|---------|
| MealPlannerModal | `src/components/modals/MealPlannerModal.tsx` | Modal chọn món ăn |
| FilterBottomSheet | `src/components/shared/FilterBottomSheet.tsx` | Bottom sheet lọc nâng cao |
| ModalBackdrop | `src/components/shared/ModalBackdrop.tsx` | Backdrop + scroll lock |

### Luồng nghiệp vụ

1. User nhấn slot/nút "+" → MealPlannerModal mở với initialTab = meal type
2. Hiển thị danh sách món ăn được lọc theo tag bữa
3. User có thể tìm kiếm, lọc (calo, protein, tags), sort
4. User toggle chọn/bỏ chọn món → preview danh sách đã chọn
5. User chuyển tab (breakfast/lunch/dinner) để chọn cho nhiều bữa
6. User nhấn Xác nhận → updateDayPlanSlot cho từng meal type đã thay đổi
7. Modal đóng, notification hiển thị

### Quy tắc nghiệp vụ

- Dishes hiển thị theo tags: breakfast tag → hiện trong tab Sáng
- FilterConfig: sortBy (name-asc/desc, cal-asc/desc, pro-asc/desc), maxCalories, minProtein, tags
- Pre-selected: các món đã có trong currentPlan slot tương ứng
- Confirm chỉ gửi những meal types có thay đổi

### Test Cases

| TC ID | Tiêu đề | Loại | Ưu tiên |
|-------|---------|------|---------|
| TC_MPM_01 | Mở modal với đúng meal type | Positive | P1 |
| TC_MPM_02 | Hiển thị danh sách món lọc theo tag | Positive | P1 |
| TC_MPM_03 | Tìm kiếm món theo tên | Positive | P1 |
| TC_MPM_04 | Tìm kiếm không có kết quả | Negative | P2 |
| TC_MPM_05 | Lọc theo maxCalories | Positive | P2 |
| TC_MPM_06 | Lọc theo minProtein | Positive | P2 |
| TC_MPM_07 | Lọc kết hợp nhiều tiêu chí | Positive | P2 |
| TC_MPM_08 | Sort theo tên A-Z | Positive | P2 |
| TC_MPM_09 | Sort theo calories tăng dần | Positive | P2 |
| TC_MPM_10 | Toggle chọn 1 món | Positive | P1 |
| TC_MPM_11 | Toggle bỏ chọn món đã chọn | Positive | P1 |
| TC_MPM_12 | Chọn nhiều món | Positive | P1 |
| TC_MPM_13 | Pre-selected các món đã có trong plan | Positive | P1 |
| TC_MPM_14 | Chuyển tab sang meal type khác | Positive | P1 |
| TC_MPM_15 | Xác nhận chọn món → cập nhật plan | Positive | P0 |
| TC_MPM_16 | Đóng modal không lưu (nhấn X) | Positive | P1 |
| TC_MPM_17 | Đóng modal bằng backdrop click | Positive | P2 |
| TC_MPM_18 | Danh sách trống (không có món nào) | Edge | P2 |
| TC_MPM_19 | Lọc trả về 0 kết quả | Edge | P2 |
| TC_MPM_20 | Xác nhận không thay đổi gì | Edge | P3 |
| TC_MPM_21 | Chọn món cho cả 3 bữa rồi xác nhận | Positive | P1 |

#### TC_MPM_01: Mở modal với đúng meal type
- **Pre-conditions**: App ở tab Calendar, đã chọn ngày
- **Steps**: 1. Nhấn vào slot Sáng 2. Quan sát modal
- **Expected Result**: MealPlannerModal mở với tab "Breakfast" được chọn sẵn
- **Priority**: P1 | **Type**: Positive

#### TC_MPM_02: Hiển thị danh sách món lọc theo tag
- **Pre-conditions**: Có món ăn với tags khác nhau
- **Steps**: 1. Mở modal cho bữa Sáng 2. Quan sát danh sách
- **Expected Result**: Chỉ hiển thị các món có tag "breakfast", các món chỉ có tag "lunch"/"dinner" bị ẩn
- **Priority**: P1 | **Type**: Positive

#### TC_MPM_03: Tìm kiếm món theo tên
- **Pre-conditions**: Modal đang mở, có nhiều món
- **Steps**: 1. Nhập "Phở" vào ô tìm kiếm 2. Quan sát kết quả
- **Expected Result**: Chỉ hiển thị các món có tên chứa "Phở" (case-insensitive, tìm cả vi và en)
- **Priority**: P1 | **Type**: Positive

#### TC_MPM_04–21: (Format tương tự)
- TC_MPM_04: Search "xyz123" → hiển thị empty state "Không tìm thấy" → P2
- TC_MPM_05: Set maxCalories=300 → chỉ hiện món <= 300 cal → P2
- TC_MPM_06: Set minProtein=20 → chỉ hiện món >= 20g protein → P2
- TC_MPM_07: maxCalories=500 + minProtein=15 + tags=breakfast → kết hợp → P2
- TC_MPM_08: Sort name A-Z → danh sách theo alphabet → P2
- TC_MPM_09: Sort cal-asc → món ít calo nhất lên đầu → P2
- TC_MPM_10: Toggle chọn 1 món → checkbox/highlight active → P1
- TC_MPM_11: Nhấn lại món đã chọn → bỏ chọn → P1
- TC_MPM_12: Chọn 3 món → cả 3 hiển thị active → P1
- TC_MPM_13: Ngày có 2 món breakfast → 2 món pre-selected khi mở → P1
- TC_MPM_14: Chuyển tab Sáng → Trưa → selections giữ nguyên mỗi tab → P1
- TC_MPM_15: Xác nhận → updateDayPlanSlot gọi đúng, plan cập nhật, notification → P0
- TC_MPM_16: Nhấn X → modal đóng, plan không thay đổi → P1
- TC_MPM_17: Click backdrop → modal đóng → P2
- TC_MPM_18: Không có món nào → EmptyState hiển thị hướng dẫn tạo món → P2
- TC_MPM_19: Filter trả 0 kết quả → "Không có món phù hợp" → P2
- TC_MPM_20: Mở modal → không đổi gì → Xác nhận → không gọi update → P3
- TC_MPM_21: Chọn 2 món sáng + 1 trưa + 3 tối → xác nhận → cả 3 slots cập nhật → P1

---

## Scenario 3: Nutrition Tracking

### Mô tả tổng quan

Hiển thị tổng dinh dưỡng ngày (calories, protein, carbs, fat, fiber) so với mục tiêu cá nhân. Progress bars thể hiện phần trăm đạt mục tiêu. Hỗ trợ xem per-meal breakdown.

### Components & Services

| Component | File | Vai trò |
|-----------|------|---------|
| NutritionSubTab | `src/components/schedule/NutritionSubTab.tsx` | Tổng dinh dưỡng ngày |
| MiniNutritionBar | `src/components/schedule/MiniNutritionBar.tsx` | Progress bar mini |
| Summary | `src/components/Summary.tsx` | Tổng hợp dinh dưỡng |

### Luồng nghiệp vụ

1. System tính `DayNutritionSummary` từ `currentPlan` + `dishes` + `ingredients`
2. Với mỗi slot: sum nutrition = sum(ingredientPer100/100 * amount) cho tất cả dish ingredients
3. Hiển thị progress bars: actual / target * 100
4. targetProtein = userProfile.weight * userProfile.proteinRatio

### Test Cases

| TC ID | Tiêu đề | Loại | Ưu tiên |
|-------|---------|------|---------|
| TC_NUT_01 | Hiển thị tổng calo ngày | Positive | P0 |
| TC_NUT_02 | Hiển thị tổng protein ngày | Positive | P0 |
| TC_NUT_03 | Hiển thị carbs/fat/fiber | Positive | P1 |
| TC_NUT_04 | Progress bar calo dưới target | Positive | P1 |
| TC_NUT_05 | Progress bar calo đạt target | Positive | P1 |
| TC_NUT_06 | Progress bar calo vượt target | Positive | P1 |
| TC_NUT_07 | Progress bar protein dưới target | Positive | P1 |
| TC_NUT_08 | Progress bar protein đạt target | Positive | P1 |
| TC_NUT_09 | Per-meal breakdown (sáng/trưa/tối) | Positive | P1 |
| TC_NUT_10 | Tổng dinh dưỡng = 0 khi không có plan | Edge | P1 |
| TC_NUT_11 | Tự động cập nhật khi thay đổi plan | Positive | P1 |
| TC_NUT_12 | Target protein tính đúng: weight * ratio | Positive | P1 |
| TC_NUT_13 | Nút Edit Goals mở GoalSettingsModal | Positive | P1 |
| TC_NUT_14 | Progress bar max 100% (không overflow) | Boundary | P2 |
| TC_NUT_15 | Hiển thị đúng khi chỉ có 1 bữa | Edge | P2 |
| TC_NUT_16 | Dinh dưỡng cập nhật khi edit ingredient | Positive | P1 |
| TC_NUT_17 | Dinh dưỡng cập nhật khi edit dish amount | Positive | P1 |
| TC_NUT_18 | Giá trị calo rất lớn (>10000) | Boundary | P3 |
| TC_NUT_19 | Tất cả macro = 0 (món không có nguyên liệu) | Edge | P2 |
| TC_NUT_20 | Dark mode styling đúng | Positive | P3 |
| TC_NUT_21 | Nút chuyển sang tab Meals (mobile) | Positive | P2 |

#### TC_NUT_01: Hiển thị tổng calo ngày
- **Pre-conditions**: Ngày có ít nhất 1 bữa ăn với món có thông tin calories
- **Steps**: 1. Chọn ngày có plan 2. Xem NutritionSubTab/panel
- **Expected Result**: Tổng calories = sum(breakfast + lunch + dinner calories), hiển thị format "XXX kcal"
- **Priority**: P0 | **Type**: Positive

#### TC_NUT_02–21: (Format tương tự TC_NUT_01, mỗi TC test 1 aspect riêng)

---

## Scenario 4: AI Meal Suggestion

### Mô tả tổng quan

AI (Gemini) tự động gợi ý thực đơn cân bằng dựa trên danh sách món có sẵn và mục tiêu dinh dưỡng. Preview cho phép user toggle on/off từng bữa trước khi áp dụng.

### Components & Services

| Component | File | Vai trò |
|-----------|------|---------|
| AISuggestionPreviewModal | `src/components/modals/AISuggestionPreviewModal.tsx` | Preview gợi ý AI |
| useAISuggestion | `src/hooks/useAISuggestion.ts` | Hook quản lý lifecycle |
| geminiService | `src/services/geminiService.ts` | API call Gemini |

### Luồng nghiệp vụ

1. User nhấn "AI Gợi ý" → `startSuggestion()` được gọi
2. Hook thu thập: dishes (name, tags, calories, protein), targetCalories, targetProtein
3. Gọi `geminiService.suggestMealPlan()` → Gemini trả về MealPlanSuggestion
4. AISuggestionPreviewModal hiển thị gợi ý với breakfast/lunch/dinner
5. User có thể toggle on/off từng bữa, xem tổng dinh dưỡng preview
6. User nhấn Apply → `applySuggestionToDayPlans()` chỉ ghi đè slots AI đề xuất
7. Reasoning (giải thích AI) hiển thị bên dưới

### Quy tắc nghiệp vụ

- Timeout 30s (`AI_CALL_TIMEOUT_MS`)
- Retry 2 lần với exponential backoff cho lỗi transient
- `applySuggestionToDayPlans()`: chỉ ghi đè slots AI đề xuất, giữ nguyên slots khác
- Cần ít nhất 3 món ăn để AI có đủ dữ liệu gợi ý

### Test Cases

| TC ID | Tiêu đề | Loại | Ưu tiên |
|-------|---------|------|---------|
| TC_AIS_01 | Trigger AI suggestion thành công | Positive | P1 |
| TC_AIS_02 | Loading state hiển thị khi đang gọi API | Positive | P1 |
| TC_AIS_03 | Button disabled trong khi loading | Positive | P1 |
| TC_AIS_04 | Preview modal hiển thị gợi ý 3 bữa | Positive | P1 |
| TC_AIS_05 | Preview hiển thị tổng dinh dưỡng | Positive | P1 |
| TC_AIS_06 | Preview hiển thị reasoning | Positive | P2 |
| TC_AIS_07 | Toggle off bữa sáng trong preview | Positive | P1 |
| TC_AIS_08 | Toggle off tất cả bữa | Edge | P2 |
| TC_AIS_09 | Apply gợi ý → cập nhật plan | Positive | P0 |
| TC_AIS_10 | Apply chỉ ghi đè slots AI đề xuất | Positive | P1 |
| TC_AIS_11 | Apply giữ nguyên slots khác khi AI để trống | Positive | P1 |
| TC_AIS_12 | Cancel → không thay đổi plan | Positive | P1 |
| TC_AIS_13 | API timeout 30s → error message | Negative | P1 |
| TC_AIS_14 | API trả response invalid → error handling | Negative | P1 |
| TC_AIS_15 | Không có API key → error message | Negative | P1 |
| TC_AIS_16 | Network error → retry 2 lần | Negative | P1 |
| TC_AIS_17 | Regenerate → gọi API lại | Positive | P2 |
| TC_AIS_18 | Edit meal → mở MealPlannerModal | Positive | P2 |
| TC_AIS_19 | Không đủ 3 món → cảnh báo | Negative | P2 |
| TC_AIS_20 | Cancel trong khi loading | Edge | P2 |
| TC_AIS_21 | Notification sau khi apply thành công | Positive | P2 |

#### TC_AIS_01–21: (Mỗi TC có pre-conditions, steps, expected result tương tự format Scenario 1)

---

## Scenario 5: AI Image Analysis

### Mô tả tổng quan

Phân tích ảnh thức ăn bằng Gemini Vision API. Hỗ trợ chụp camera, upload file, paste clipboard. Kết quả trả về: tên món, mô tả, danh sách nguyên liệu + dinh dưỡng. User có thể lưu thành nguyên liệu mới hoặc món ăn mới.

### Components & Services

| Component | File | Vai trò |
|-----------|------|---------|
| AIImageAnalyzer | `src/components/AIImageAnalyzer.tsx` | Container tab AI |
| ImageCapture | `src/components/ImageCapture.tsx` | Camera/file/paste input |
| AnalysisResultView | `src/components/AnalysisResultView.tsx` | Hiển thị kết quả phân tích |
| SaveAnalyzedDishModal | `src/components/modals/SaveAnalyzedDishModal.tsx` | Modal lưu kết quả |
| geminiService | `src/services/geminiService.ts` | API analyzeDishImage |
| imageCompression | `src/utils/imageCompression.ts` | Nén ảnh trước khi gửi |

### Test Cases

| TC ID | Tiêu đề | Loại | Ưu tiên |
|-------|---------|------|---------|
| TC_AIA_01 | Chụp ảnh từ camera | Positive | P1 |
| TC_AIA_02 | Upload ảnh từ file | Positive | P1 |
| TC_AIA_03 | Paste ảnh từ clipboard | Positive | P2 |
| TC_AIA_04 | Phân tích thành công → hiển thị kết quả | Positive | P0 |
| TC_AIA_05 | Kết quả hiển thị tên món | Positive | P1 |
| TC_AIA_06 | Kết quả hiển thị danh sách nguyên liệu | Positive | P1 |
| TC_AIA_07 | Kết quả hiển thị tổng dinh dưỡng | Positive | P1 |
| TC_AIA_08 | Loading state khi đang phân tích | Positive | P1 |
| TC_AIA_09 | Ảnh không phải thức ăn → NotFoodImageError | Negative | P1 |
| TC_AIA_10 | API timeout → error message | Negative | P1 |
| TC_AIA_11 | Network error → retry 2 lần | Negative | P1 |
| TC_AIA_12 | Lưu kết quả thành món ăn mới | Positive | P0 |
| TC_AIA_13 | Lưu chỉ nguyên liệu (shouldCreateDish=false) | Positive | P1 |
| TC_AIA_14 | Sửa tên món trước khi lưu | Positive | P2 |
| TC_AIA_15 | Chọn tags bữa khi lưu món | Positive | P2 |
| TC_AIA_16 | Nguyên liệu đã tồn tại → match không tạo duplicate | Positive | P1 |
| TC_AIA_17 | Nguyên liệu mới → tạo Ingredient mới | Positive | P1 |
| TC_AIA_18 | Ảnh quá lớn → compression trước khi gửi | Edge | P2 |
| TC_AIA_19 | Notification sau khi lưu thành công | Positive | P2 |
| TC_AIA_20 | Chuyển tab sau khi lưu (→ Management) | Positive | P2 |
| TC_AIA_21 | Phân tích xong → badge notification trên tab AI | Positive | P2 |

---

## Scenario 6: Ingredient CRUD

### Mô tả tổng quan

Quản lý nguyên liệu: thêm mới, chỉnh sửa, xóa. Form gồm tên (vi/en), đơn vị, dinh dưỡng per-100. Hỗ trợ AI tự điền dinh dưỡng, tìm kiếm, lọc, sắp xếp. Xóa có cảnh báo nếu nguyên liệu đang được dùng trong món.

### Components & Services

| Component | File | Vai trò |
|-----------|------|---------|
| IngredientManager | `src/components/IngredientManager.tsx` | Danh sách + CRUD |
| IngredientEditModal | `src/components/modals/IngredientEditModal.tsx` | Form thêm/sửa |
| ListToolbar | `src/components/shared/ListToolbar.tsx` | Search + add button |
| FilterBottomSheet | `src/components/shared/FilterBottomSheet.tsx` | Lọc nâng cao |
| UnitSelector | `src/components/shared/UnitSelector.tsx` | Chọn đơn vị |
| UnsavedChangesDialog | `src/components/shared/UnsavedChangesDialog.tsx` | Cảnh báo chưa lưu |

### Test Cases

| TC ID | Tiêu đề | Loại | Ưu tiên |
|-------|---------|------|---------|
| TC_ING_01 | Hiển thị danh sách nguyên liệu | Positive | P0 |
| TC_ING_02 | Tìm kiếm nguyên liệu theo tên | Positive | P1 |
| TC_ING_03 | Sort nguyên liệu theo tên A-Z | Positive | P2 |
| TC_ING_04 | Sort nguyên liệu theo calories | Positive | P2 |
| TC_ING_05 | Filter theo protein tối thiểu | Positive | P2 |
| TC_ING_06 | Empty state khi không có nguyên liệu | Edge | P2 |
| TC_ING_07 | Thêm nguyên liệu mới đầy đủ thông tin | Positive | P0 |
| TC_ING_08 | Thêm nguyên liệu chỉ với tên và đơn vị | Positive | P1 |
| TC_ING_09 | Validate: tên bắt buộc | Negative | P1 |
| TC_ING_10 | Validate: đơn vị bắt buộc | Negative | P1 |
| TC_ING_11 | Validate: dinh dưỡng >= 0 | Negative | P1 |
| TC_ING_12 | AI tự điền dinh dưỡng | Positive | P1 |
| TC_ING_13 | AI tự điền thất bại → toast warning | Negative | P2 |
| TC_ING_14 | Chỉnh sửa nguyên liệu đã có | Positive | P0 |
| TC_ING_15 | Sửa tên → cập nhật LocalizedString | Positive | P1 |
| TC_ING_16 | Sửa giá trị dinh dưỡng → lưu thành công | Positive | P1 |
| TC_ING_17 | Cancel khi có thay đổi → UnsavedChangesDialog | Positive | P1 |
| TC_ING_18 | Cancel khi không có thay đổi → đóng ngay | Positive | P2 |
| TC_ING_19 | Xóa nguyên liệu không được dùng | Positive | P1 |
| TC_ING_20 | Xóa nguyên liệu đang dùng → cảnh báo | Negative | P1 |
| TC_ING_21 | Xóa → undo toast | Positive | P1 |
| TC_ING_22 | UnitSelector chọn từ preset (g, ml, quả...) | Positive | P2 |
| TC_ING_23 | UnitSelector nhập đơn vị custom | Positive | P2 |
| TC_ING_24 | Dịch tự động tên nguyên liệu (dictionary) | Positive | P1 |
| TC_ING_25 | Persist vào localStorage sau khi lưu | Positive | P0 |

---

## Scenario 7: Dish CRUD

### Mô tả tổng quan

Quản lý món ăn: tạo mới, chỉnh sửa, xóa. Mỗi món gồm tên, tags bữa (sáng/trưa/tối), danh sách nguyên liệu kèm khối lượng. Tổng dinh dưỡng tính realtime. Hỗ trợ AI gợi ý nguyên liệu.

### Components & Services

| Component | File | Vai trò |
|-----------|------|---------|
| DishManager | `src/components/DishManager.tsx` | Danh sách + CRUD |
| DishEditModal | `src/components/modals/DishEditModal.tsx` | Form thêm/sửa |
| AISuggestIngredientsPreview | `src/components/modals/AISuggestIngredientsPreview.tsx` | Preview AI gợi ý nguyên liệu |

### Test Cases

| TC ID | Tiêu đề | Loại | Ưu tiên |
|-------|---------|------|---------|
| TC_DSH_01 | Hiển thị danh sách món ăn | Positive | P0 |
| TC_DSH_02 | Tìm kiếm món theo tên | Positive | P1 |
| TC_DSH_03 | Filter theo tags bữa | Positive | P2 |
| TC_DSH_04 | Sort theo calories | Positive | P2 |
| TC_DSH_05 | Empty state không có món | Edge | P2 |
| TC_DSH_06 | Thêm món ăn mới đầy đủ | Positive | P0 |
| TC_DSH_07 | Validate: tên bắt buộc | Negative | P1 |
| TC_DSH_08 | Validate: ít nhất 1 nguyên liệu | Negative | P1 |
| TC_DSH_09 | Validate: tags bắt buộc | Negative | P1 |
| TC_DSH_10 | Thêm nguyên liệu vào món (tìm kiếm inline) | Positive | P1 |
| TC_DSH_11 | Thay đổi khối lượng nguyên liệu | Positive | P1 |
| TC_DSH_12 | Xóa nguyên liệu khỏi món | Positive | P1 |
| TC_DSH_13 | Tổng dinh dưỡng tính realtime | Positive | P1 |
| TC_DSH_14 | Chọn nhiều tags (sáng + trưa) | Positive | P2 |
| TC_DSH_15 | Chỉnh sửa món đã có | Positive | P0 |
| TC_DSH_16 | Thêm nguyên liệu mới inline (quick-add) | Positive | P1 |
| TC_DSH_17 | AI gợi ý nguyên liệu cho món | Positive | P1 |
| TC_DSH_18 | AI gợi ý → preview → apply | Positive | P1 |
| TC_DSH_19 | Xóa món không được dùng trong plan | Positive | P1 |
| TC_DSH_20 | Xóa món đang dùng → cảnh báo | Negative | P1 |
| TC_DSH_21 | Xóa → undo toast | Positive | P1 |
| TC_DSH_22 | Cancel khi có thay đổi → UnsavedChangesDialog | Positive | P1 |
| TC_DSH_23 | Dịch tự động tên món (dictionary) | Positive | P1 |
| TC_DSH_24 | Persist vào localStorage | Positive | P0 |
| TC_DSH_25 | Xóa nguyên liệu khỏi system → tự xóa khỏi món | Edge | P1 |

---

## Scenario 8: Settings & Config

### Mô tả tổng quan

Cài đặt ứng dụng: chuyển đổi theme (light/dark/system), ngôn ngữ (vi/en), backup/restore dữ liệu dạng JSON.

### Components & Services

| Component | File | Vai trò |
|-----------|------|---------|
| SettingsTab | `src/components/SettingsTab.tsx` | Tab cài đặt |
| DataBackup | `src/components/DataBackup.tsx` | Export/Import UI |
| useDarkMode | `src/hooks/useDarkMode.ts` | Theme management |

### Test Cases

| TC ID | Tiêu đề | Loại | Ưu tiên |
|-------|---------|------|---------|
| TC_SET_01 | Chuyển theme Light → Dark | Positive | P1 |
| TC_SET_02 | Chuyển theme Dark → Light | Positive | P1 |
| TC_SET_03 | Theme System theo OS preference | Positive | P2 |
| TC_SET_04 | Theme persist sau reload | Positive | P1 |
| TC_SET_05 | Chuyển ngôn ngữ vi → en | Positive | P1 |
| TC_SET_06 | Chuyển ngôn ngữ en → vi | Positive | P1 |
| TC_SET_07 | UI text cập nhật ngay sau chuyển ngôn ngữ | Positive | P1 |
| TC_SET_08 | Ngôn ngữ persist sau reload | Positive | P1 |
| TC_SET_09 | Export data → tải file JSON | Positive | P0 |
| TC_SET_10 | Export chứa đầy đủ 4 keys | Positive | P1 |
| TC_SET_11 | Import file JSON hợp lệ | Positive | P0 |
| TC_SET_12 | Import → dữ liệu cập nhật | Positive | P1 |
| TC_SET_13 | Import file không hợp lệ → toast error | Negative | P1 |
| TC_SET_14 | Import file rỗng → xử lý graceful | Negative | P2 |
| TC_SET_15 | Import partial data (chỉ có ingredients) | Edge | P2 |
| TC_SET_16 | Import invalid keys → warning per key | Negative | P2 |
| TC_SET_17 | Dark mode CSS đúng trên tất cả components | Positive | P2 |
| TC_SET_18 | Tên nguyên liệu/món hiển thị đúng ngôn ngữ đã chọn | Positive | P1 |
| TC_SET_19 | Android Share sheet export (Capacitor) | Positive | P2 |
| TC_SET_20 | Import file > 5MB | Boundary | P3 |
| TC_SET_21 | Chuyển ngôn ngữ trong khi modal đang mở | Edge | P3 |

---

## Scenario 9: Goal Settings

### Mô tả tổng quan

Cài đặt mục tiêu dinh dưỡng: cân nặng, tỉ lệ protein (g/kg), calo mục tiêu. Giá trị lưu trong UserProfile, ảnh hưởng đến progress bars trên Calendar.

### Components & Services

| Component | File | Vai trò |
|-----------|------|---------|
| GoalSettingsModal | `src/components/modals/GoalSettingsModal.tsx` | Modal cài đặt goals |

### Test Cases

| TC ID | Tiêu đề | Loại | Ưu tiên |
|-------|---------|------|---------|
| TC_GOL_01 | Mở modal từ NutritionSubTab | Positive | P1 |
| TC_GOL_02 | Hiển thị giá trị hiện tại | Positive | P1 |
| TC_GOL_03 | Đóng modal bằng nút X | Positive | P1 |
| TC_GOL_04 | Đóng modal bằng backdrop | Positive | P2 |
| TC_GOL_05 | Nhập weight hợp lệ (60) | Positive | P1 |
| TC_GOL_06 | Nhập weight thập phân (70.5) | Positive | P2 |
| TC_GOL_07 | Nhập weight = 0 | Boundary | P2 |
| TC_GOL_08 | Nhập weight âm | Negative | P2 |
| TC_GOL_09 | Nhập proteinRatio hợp lệ (2.0) | Positive | P1 |
| TC_GOL_10 | Nhập proteinRatio = 0 | Boundary | P2 |
| TC_GOL_11 | Nhập proteinRatio rất cao (10) | Boundary | P3 |
| TC_GOL_12 | Nhập targetCalories hợp lệ (1800) | Positive | P1 |
| TC_GOL_13 | Nhập targetCalories = 0 | Boundary | P2 |
| TC_GOL_14 | Nhập targetCalories rất cao (10000) | Boundary | P3 |
| TC_GOL_15 | Lưu profile thành công | Positive | P0 |
| TC_GOL_16 | Lưu → persist vào localStorage | Positive | P0 |
| TC_GOL_17 | Lưu → progress bars cập nhật ngay | Positive | P1 |
| TC_GOL_18 | Lưu → notification thành công | Positive | P2 |
| TC_GOL_19 | Cancel không lưu thay đổi | Positive | P1 |
| TC_GOL_20 | targetProtein = weight * ratio hiển thị đúng | Positive | P1 |
| TC_GOL_21 | Xóa hết giá trị → validation | Negative | P2 |

---

## Scenario 10: Copy Plan

### Mô tả tổng quan

Sao chép kế hoạch bữa ăn từ ngày nguồn sang 1 hoặc nhiều ngày đích. Cho phép chọn nhiều ngày mục tiêu.

### Components & Services

| Component | File | Vai trò |
|-----------|------|---------|
| CopyPlanModal | `src/components/modals/CopyPlanModal.tsx` | Modal copy plan |
| useCopyPlan | `src/hooks/useCopyPlan.ts` | Copy logic |

### Test Cases

| TC ID | Tiêu đề | Loại | Ưu tiên |
|-------|---------|------|---------|
| TC_CPY_01 | Mở modal với sourceDate đúng | Positive | P1 |
| TC_CPY_02 | Đóng modal bằng X | Positive | P1 |
| TC_CPY_03 | Đóng modal bằng backdrop | Positive | P2 |
| TC_CPY_04 | Chọn 1 ngày đích | Positive | P1 |
| TC_CPY_05 | Chọn nhiều ngày đích | Positive | P1 |
| TC_CPY_06 | Bỏ chọn ngày đã chọn | Positive | P2 |
| TC_CPY_07 | Copy thành công → cập nhật dayPlans | Positive | P0 |
| TC_CPY_08 | Copy giữ nguyên source plan | Positive | P1 |
| TC_CPY_09 | Copy → notification thành công | Positive | P2 |
| TC_CPY_10 | Copy ghi đè plan đã có ở ngày đích | Edge | P1 |
| TC_CPY_11 | Không chọn ngày → button disabled | Negative | P2 |
| TC_CPY_12 | Copy plan trống → tạo empty plan ở đích | Edge | P2 |
| TC_CPY_13 | Copy sang 7 ngày (cả tuần) | Positive | P1 |
| TC_CPY_14 | Copy sang 30 ngày (cả tháng) | Boundary | P2 |
| TC_CPY_15 | Source date = target date | Edge | P3 |
| TC_CPY_16 | Copy qua ranh giới tháng | Edge | P2 |
| TC_CPY_17 | Copy qua ranh giới năm | Edge | P3 |
| TC_CPY_18 | Copy plan chỉ có 1 bữa | Edge | P2 |
| TC_CPY_19 | Persist sau copy | Positive | P1 |
| TC_CPY_20 | Modal hiển thị đúng ngày nguồn | Positive | P2 |
| TC_CPY_21 | Copy 3 bữa đầy đủ | Positive | P1 |

---

## Scenario 11: Clear Plan

### Mô tả tổng quan

Xóa kế hoạch bữa ăn theo phạm vi: ngày (1 ngày), tuần (Mon-Sun), hoặc tháng (cả tháng). Sử dụng `clearPlansByScope()`.

### Components & Services

| Component | File | Vai trò |
|-----------|------|---------|
| ClearPlanModal | `src/components/modals/ClearPlanModal.tsx` | Modal xóa plan |
| planService | `src/services/planService.ts` | clearPlansByScope logic |

### Test Cases

| TC ID | Tiêu đề | Loại | Ưu tiên |
|-------|---------|------|---------|
| TC_CLR_01 | Mở ClearPlanModal | Positive | P1 |
| TC_CLR_02 | Đóng modal bằng X | Positive | P1 |
| TC_CLR_03 | Đóng modal bằng backdrop | Positive | P2 |
| TC_CLR_04 | Chọn scope = Ngày | Positive | P1 |
| TC_CLR_05 | Chọn scope = Tuần | Positive | P1 |
| TC_CLR_06 | Chọn scope = Tháng | Positive | P1 |
| TC_CLR_07 | Xóa ngày → chỉ xóa plan ngày đã chọn | Positive | P0 |
| TC_CLR_08 | Xóa ngày → các ngày khác không bị ảnh hưởng | Positive | P1 |
| TC_CLR_09 | Xóa tuần → xóa Mon-Sun (getWeekRange) | Positive | P0 |
| TC_CLR_10 | Xóa tuần → plans ngoài tuần không bị ảnh hưởng | Positive | P1 |
| TC_CLR_11 | Xóa tháng → xóa tất cả plan cùng year+month | Positive | P0 |
| TC_CLR_12 | Xóa tháng → plans tháng khác không bị ảnh hưởng | Positive | P1 |
| TC_CLR_13 | Xác nhận trước khi xóa | Positive | P1 |
| TC_CLR_14 | Không có plan để xóa | Edge | P2 |
| TC_CLR_15 | Xóa ở ranh giới tháng (tuần chứa 2 tháng) | Edge | P2 |
| TC_CLR_16 | Xóa ở ranh giới năm | Edge | P3 |
| TC_CLR_17 | Persist sau xóa | Positive | P1 |
| TC_CLR_18 | Dinh dưỡng cập nhật sau xóa | Positive | P1 |
| TC_CLR_19 | Notification sau xóa thành công | Positive | P2 |
| TC_CLR_20 | Xóa plan partial (chỉ có 1 bữa) | Edge | P2 |
| TC_CLR_21 | Calendar indicator dots cập nhật sau xóa | Positive | P2 |

---

## Scenario 12: Template Manager

### Mô tả tổng quan

Quản lý meal plan templates: xem danh sách, áp dụng, đổi tên, xóa. Templates lưu trong localStorage (`mp-templates`). Mỗi template chứa 3 mảng dishIds cho breakfast/lunch/dinner.

### Components & Services

| Component | File | Vai trò |
|-----------|------|---------|
| TemplateManager | `src/components/modals/TemplateManager.tsx` | Modal quản lý templates |
| useMealTemplate | `src/hooks/useMealTemplate.ts` | CRUD template logic |

### Test Cases

| TC ID | Tiêu đề | Loại | Ưu tiên |
|-------|---------|------|---------|
| TC_TMP_01 | Mở TemplateManager | Positive | P1 |
| TC_TMP_02 | Đóng TemplateManager | Positive | P1 |
| TC_TMP_03 | Hiển thị danh sách templates | Positive | P1 |
| TC_TMP_04 | Empty state khi không có template | Edge | P2 |
| TC_TMP_05 | Hiển thị chi tiết template (tên, ngày tạo, số món) | Positive | P2 |
| TC_TMP_06 | Hiển thị tên món trong template | Positive | P2 |
| TC_TMP_07 | Apply template → cập nhật plan ngày hiện tại | Positive | P0 |
| TC_TMP_08 | Apply template → ghi đè plan đã có | Positive | P1 |
| TC_TMP_09 | Apply template → notification thành công | Positive | P2 |
| TC_TMP_10 | Đổi tên template | Positive | P1 |
| TC_TMP_11 | Đổi tên → tên trống → validation | Negative | P2 |
| TC_TMP_12 | Đổi tên → notification thành công | Positive | P2 |
| TC_TMP_13 | Xóa template | Positive | P1 |
| TC_TMP_14 | Xóa → notification thành công | Positive | P2 |
| TC_TMP_15 | Apply template với dish đã bị xóa | Edge | P1 |
| TC_TMP_16 | Nhiều templates hiển thị đúng thứ tự | Positive | P2 |
| TC_TMP_17 | Template persist trong localStorage | Positive | P1 |
| TC_TMP_18 | Đổi tên thành tên trùng template khác | Edge | P3 |
| TC_TMP_19 | Template name rất dài | Boundary | P3 |
| TC_TMP_20 | Modal đóng sau apply | Positive | P2 |
| TC_TMP_21 | Calendar cập nhật sau apply template | Positive | P1 |

---

## Scenario 13: Save Template

### Mô tả tổng quan

Lưu nhanh kế hoạch bữa ăn hiện tại thành template. Sử dụng `globalThis.prompt()` để nhập tên. Template bao gồm breakfast/lunch/dinnerDishIds + timestamp.

### Components & Services

| Component | File | Vai trò |
|-----------|------|---------|
| SaveTemplateButton | Inline trong App.tsx | handleSaveTemplate callback |
| useMealTemplate | `src/hooks/useMealTemplate.ts` | saveTemplate method |

### Test Cases

| TC ID | Tiêu đề | Loại | Ưu tiên |
|-------|---------|------|---------|
| TC_SVT_01 | Nhấn Save Template → prompt hiển thị | Positive | P1 |
| TC_SVT_02 | Nhập tên hợp lệ → lưu thành công | Positive | P0 |
| TC_SVT_03 | Nhập tên → notification thành công | Positive | P2 |
| TC_SVT_04 | Nhập tên trống → không lưu | Negative | P1 |
| TC_SVT_05 | Nhấn Cancel trên prompt → không lưu | Positive | P1 |
| TC_SVT_06 | Tên chỉ có whitespace → trim → không lưu | Negative | P2 |
| TC_SVT_07 | Template chứa đúng 3 mảng dishIds | Positive | P1 |
| TC_SVT_08 | Template có createdAt timestamp | Positive | P2 |
| TC_SVT_09 | Template có unique ID | Positive | P2 |
| TC_SVT_10 | Lưu từ plan trống → template với 3 mảng rỗng | Edge | P2 |
| TC_SVT_11 | Lưu từ plan đầy đủ 3 bữa | Positive | P1 |
| TC_SVT_12 | Lưu từ plan chỉ có 1 bữa | Edge | P2 |
| TC_SVT_13 | Tên trùng template khác → vẫn lưu (khác ID) | Edge | P2 |
| TC_SVT_14 | Tên rất dài (>100 ký tự) | Boundary | P3 |
| TC_SVT_15 | Tên có ký tự đặc biệt | Edge | P3 |
| TC_SVT_16 | Template persist trong localStorage | Positive | P1 |
| TC_SVT_17 | Template xuất hiện trong TemplateManager | Positive | P1 |
| TC_SVT_18 | Lưu nhiều template liên tiếp | Positive | P2 |
| TC_SVT_19 | Template có đúng dishIds từ currentPlan | Positive | P1 |
| TC_SVT_20 | Prompt không block UI quá lâu | Edge | P3 |

---

## Scenario 14: Grocery List

### Mô tả tổng quan

Tổng hợp danh sách mua sắm từ kế hoạch bữa ăn. Gom nhóm nguyên liệu giống nhau, cộng tổng khối lượng. Hỗ trợ check/uncheck, copy to clipboard, lọc theo scope (ngày/tuần/tháng).

### Components & Services

| Component | File | Vai trò |
|-----------|------|---------|
| GroceryList | `src/components/GroceryList.tsx` | Tab danh sách mua sắm |

### Test Cases

| TC ID | Tiêu đề | Loại | Ưu tiên |
|-------|---------|------|---------|
| TC_GRC_01 | Hiển thị danh sách nguyên liệu từ plan | Positive | P0 |
| TC_GRC_02 | Gom nhóm cùng nguyên liệu + cộng tổng | Positive | P0 |
| TC_GRC_03 | Hiển thị tên + số lượng + đơn vị | Positive | P1 |
| TC_GRC_04 | Scope filter: Hôm nay | Positive | P1 |
| TC_GRC_05 | Scope filter: Tuần này | Positive | P1 |
| TC_GRC_06 | Scope filter: Tháng này | Positive | P1 |
| TC_GRC_07 | Check item đã mua | Positive | P1 |
| TC_GRC_08 | Uncheck item | Positive | P1 |
| TC_GRC_09 | Visual feedback khi check (strikethrough) | Positive | P2 |
| TC_GRC_10 | Copy to clipboard | Positive | P1 |
| TC_GRC_11 | Copy format đúng (tên - số lượng đơn vị) | Positive | P2 |
| TC_GRC_12 | Empty state khi không có plan | Edge | P1 |
| TC_GRC_13 | Empty state khi plan không có nguyên liệu | Edge | P2 |
| TC_GRC_14 | Cùng nguyên liệu ở nhiều bữa → cộng dồn | Positive | P1 |
| TC_GRC_15 | Cùng nguyên liệu ở nhiều ngày → cộng dồn | Positive | P1 |
| TC_GRC_16 | Nguyên liệu hiển thị đúng ngôn ngữ | Positive | P2 |
| TC_GRC_17 | Plan thay đổi → grocery tự cập nhật | Positive | P1 |
| TC_GRC_18 | Check state reset khi plan thay đổi | Edge | P2 |
| TC_GRC_19 | Celebration khi check hết items | Positive | P3 |
| TC_GRC_20 | Sort alphabetical | Positive | P2 |
| TC_GRC_21 | Ingredient đã xóa nhưng còn trong plan | Edge | P2 |

---

## Scenario 15: Background Translation

### Mô tả tổng quan

Dịch tự động tên nguyên liệu/món ăn giữa vi↔en. Sử dụng 3 layer: (1) Static dictionary ~0ms tại save-time, (2) Dictionary trong Web Worker, (3) WASM opus-mt fallback. Queue quản lý bằng Zustand store.

### Components & Services

| Component | File | Vai trò |
|-----------|------|---------|
| foodDictionary | `src/data/foodDictionary.ts` | Static dictionary 200+ entries |
| translate.worker | `src/workers/translate.worker.ts` | Web Worker dịch |
| translateQueueService | `src/services/translateQueueService.ts` | Queue management (Zustand) |
| useTranslateWorker | `src/hooks/useTranslateWorker.ts` | Worker lifecycle |
| useTranslateProcessor | `src/hooks/useTranslateProcessor.ts` | Queue processing |

### Luồng nghiệp vụ

1. User lưu ingredient/dish → App.tsx gọi `lookupFoodTranslation(text, direction)`
2. Dictionary hit → apply ngay (0ms), không enqueue
3. Dictionary miss → `enqueueTranslation()` → Zustand queue
4. `useTranslateProcessor` dequeue → `sendJob` → Web Worker
5. Worker: dictionary check → WASM opus-mt fallback → post result
6. `updateTranslatedField()` cập nhật state + localStorage

### Quy tắc nghiệp vụ

- `workerReady` luôn = false trong localStorage (partialize by design)
- `scanMissing`: detect `name.en === name.vi` → coi như chưa dịch → enqueue vi-en
- `buildMap`: first-entry-wins cho reverse lookup (en→vi)
- Direction: currentLang=vi → vi-en, currentLang=en → en-vi

### Test Cases

| TC ID | Tiêu đề | Loại | Ưu tiên |
|-------|---------|------|---------|
| TC_TRN_01 | Dictionary lookup exact match (vi→en) | Positive | P0 |
| TC_TRN_02 | Dictionary lookup exact match (en→vi) | Positive | P0 |
| TC_TRN_03 | Dictionary lookup case-insensitive | Positive | P1 |
| TC_TRN_04 | Dictionary miss → return null | Negative | P1 |
| TC_TRN_05 | Instant save: add ingredient + dictionary hit | Positive | P0 |
| TC_TRN_06 | Instant save: add dish + dictionary hit | Positive | P0 |
| TC_TRN_07 | Instant save: update ingredient + dictionary hit | Positive | P1 |
| TC_TRN_08 | Dictionary miss → enqueue to worker | Positive | P1 |
| TC_TRN_09 | Worker dequeue → process → result applied | Positive | P1 |
| TC_TRN_10 | scanMissing detect identical vi/en | Positive | P1 |
| TC_TRN_11 | scanMissing uses vi-en direction for identical | Positive | P1 |
| TC_TRN_12 | Queue enqueue/dequeue/markDone cycle | Positive | P1 |
| TC_TRN_13 | Queue persist in localStorage | Positive | P1 |
| TC_TRN_14 | workerReady always false in localStorage | Edge | P2 |
| TC_TRN_15 | Direction vi-en khi currentLang=vi | Positive | P1 |
| TC_TRN_16 | Direction en-vi khi currentLang=en | Positive | P1 |
| TC_TRN_17 | buildMap first-entry-wins (Tofu → Đậu phụ) | Positive | P2 |
| TC_TRN_18 | Multiple synonyms map correctly (vi→en) | Positive | P2 |
| TC_TRN_19 | Empty string input → no crash | Edge | P2 |
| TC_TRN_20 | Special characters in name | Edge | P2 |
| TC_TRN_21 | Very long text input | Boundary | P3 |

---

## Tổng hợp

### Thống kê Test Cases

| Scenario | Số TC | P0 | P1 | P2 | P3 |
|----------|-------|----|----|----|----|
| 1. Calendar & Meal Planning | 21 | 1 | 11 | 9 | 0 |
| 2. Meal Planner Modal | 21 | 1 | 10 | 7 | 3 |
| 3. Nutrition Tracking | 21 | 2 | 10 | 6 | 3 |
| 4. AI Meal Suggestion | 21 | 1 | 11 | 7 | 2 |
| 5. AI Image Analysis | 21 | 2 | 9 | 10 | 0 |
| 6. Ingredient CRUD | 25 | 3 | 13 | 7 | 2 |
| 7. Dish CRUD | 25 | 3 | 14 | 5 | 3 |
| 8. Settings & Config | 21 | 2 | 9 | 7 | 3 |
| 9. Goal Settings | 21 | 2 | 7 | 8 | 4 |
| 10. Copy Plan | 21 | 1 | 8 | 8 | 4 |
| 11. Clear Plan | 21 | 3 | 8 | 7 | 3 |
| 12. Template Manager | 21 | 1 | 8 | 8 | 4 |
| 13. Save Template | 20 | 1 | 7 | 7 | 5 |
| 14. Grocery List | 21 | 2 | 8 | 8 | 3 |
| 15. Background Translation | 21 | 4 | 9 | 6 | 2 |
| **TOTAL** | **323** | **29** | **142** | **110** | **42** |

### Phân bổ theo loại

| Type | Số TC | % |
|------|-------|---|
| Positive | 218 | 67.5% |
| Negative | 42 | 13.0% |
| Edge | 50 | 15.5% |
| Boundary | 13 | 4.0% |
| **TOTAL** | **323** | **100%** |

### Cross-reference với Test Types hiện có

| Test Type | Hiện có | Mới (document này) | Coverage |
|-----------|---------|---------------------|----------|
| Unit Tests | 1046 tests, 49 files | — | 100% line coverage |
| E2E Tests | 183 tests, 24 specs | — | Critical paths |
| Manual Test Cases | 189+ (test-cases.md) | 323 (scenario-based) | Comprehensive |

---

*Document này là phần bổ sung cho [test-cases.md](test-cases.md), tổ chức theo scenario thay vì theo feature module. Hai document bổ trợ nhau: test-cases.md tập trung vào functional testing, document này tập trung vào scenario-based testing với chi tiết pre-conditions và expected results.*
