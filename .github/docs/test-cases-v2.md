# TEST CASES V2 — Smart Meal Planner (Phân tích toàn diện)

> **Phiên bản:** 2.0  
> **Ngày tạo:** 2026-02-26  
> **Tổng TC:** 147  
> **Phương pháp:** Phân tích theo từng luồng nghiệp vụ (Business Flow), từng component (UI/UX), và mọi edge case có thể xảy ra.

---

## PHẦN A: LUỒNG NAVIGATION & LAYOUT (18 TCs)

### A1. Desktop Navigation (viewport ≥ 640px)

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 1 | NAV_D_01 | Mặc định tab Calendar khi mở app | App mở lần đầu → tab "Lịch trình" active, DesktopNav hiển thị 4 tabs, header "Smart Meal Planner" + subtitle cân nặng | |
| 2 | NAV_D_02 | Chuyển đổi 4 tabs | Click lần lượt 4 tabs → content thay đổi đúng, active tab có `bg-white text-emerald-600 shadow-sm`, inactive `text-slate-500` | |
| 3 | NAV_D_03 | Tab ẩn/hiện bằng class `hidden`/`block` | Kiểm tra DOM: tất cả 4 tab content luôn render (hidden), chỉ active tab có `block` → tránh mất state khi switch | |
| 4 | NAV_D_04 | Header subtitle hiển thị cân nặng realtime | Thay đổi cân nặng trong GoalSettings → header subtitle "Dinh dưỡng chính xác cho Xkg" cập nhật ngay | |
| 5 | NAV_D_05 | DesktopNav hidden trên mobile | Viewport < 640px → `hidden sm:flex` → DesktopNav không hiển thị | |

### A2. Mobile Navigation (viewport < 640px)

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 6 | NAV_M_01 | BottomNavBar fixed bottom | Nav cố định dưới màn hình, `z-30`, có `pb-safe` cho notch | |
| 7 | NAV_M_02 | 4 icon buttons với label | Lịch trình/Thư viện/AI/Đi chợ — icon + text dưới | |
| 8 | NAV_M_03 | Active indicator dot | Tab active có `emerald-600` + dot emerald-500 dưới text | |
| 9 | NAV_M_04 | Touch target ≥ 56px | Mỗi button `min-h-14` (56px) — kiểm tra bằng getBoundingClientRect | |
| 10 | NAV_M_05 | Header thay đổi theo tab | Mobile header hiện tên tab thay vì "Smart Meal Planner": "Lịch trình" / "Thư viện" / "AI Phân tích" / "Đi chợ" | |
| 11 | NAV_M_06 | Content padding bottom cho BottomNav | `pb-24 sm:pb-8` → content không bị che bởi bottom nav | |

### A3. AI Badge

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 12 | NAV_B_01 | Badge hiển thị khi AI hoàn tất ở tab khác | Đang ở tab Calendar, AI phân tích xong → badge đỏ `bg-rose-500` xuất hiện trên icon AI | |
| 13 | NAV_B_02 | Badge biến mất khi chuyển sang tab AI | Click tab AI → `setHasNewAIResult(false)` → badge ẩn | |
| 14 | NAV_B_03 | Badge KHÔNG hiển thị nếu đang ở tab AI | AI phân tích xong khi đang ở tab AI → `activeMainTabRef.current === 'ai-analysis'` → badge không set | |
| 15 | NAV_B_04 | Toast "Phân tích hoàn tất!" khi ở tab khác | Kèm toast success "Nhấn để xem kết quả" → click toast → chuyển sang tab AI | |
| 16 | NAV_B_05 | Badge chỉ hiện trên mobile BottomNav | Desktop không có badge logic (DesktopNav không nhận `showAIBadge`) | |

### A4. Layout & Responsive

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 17 | NAV_L_01 | Max-width container `max-w-5xl` | Content không bị kéo rộng quá 1024px trên màn hình lớn | |
| 18 | NAV_L_02 | Sticky header `sticky top-0 z-20` | Scroll xuống → header dính trên cùng, z-index 20 | |

---

## PHẦN B: LUỒNG CALENDAR — CHỌN NGÀY (22 TCs)

### B1. DateSelector — Calendar Grid Mode

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 19 | CAL_G_01 | Hiển thị tháng hiện tại mặc định | Title "Tháng X, YYYY", 7 header columns T2-CN, ngày đúng layout | |
| 20 | CAL_G_02 | Ngày hôm nay highlight | `bg-emerald-50 text-emerald-600 border-emerald-200` | |
| 21 | CAL_G_03 | Ngày đang chọn highlight | `bg-emerald-500 text-white shadow-sm ring-4 ring-emerald-500/20 scale-105` | |
| 22 | CAL_G_04 | Click ngày → chọn ngày | Click ngày khác → `onSelectDate(dateStr)`, Summary + MealCards cập nhật | |
| 23 | CAL_G_05 | Click ngày đang chọn → mở TypeSelection | `isSelected && onPlanClick` → mở modal lên kế hoạch | |
| 24 | CAL_G_06 | Double-click ngày → chọn + mở plan | `onDoubleClick` → `onSelectDate(dateStr)` + `onPlanClick()` | |
| 25 | CAL_G_07 | Nút "◀" / "▶" chuyển tháng | `prevMonth()` / `nextMonth()` → title cập nhật, grid re-render | |
| 26 | CAL_G_08 | Empty cells cho firstDay offset | Tháng bắt đầu thứ 4 → 2 ô trống phía trước ngày 1 | |
| 27 | CAL_G_09 | Meal indicator dots | Ngày có plan → 3 dots (amber=sáng, blue=trưa, indigo=tối), selected → dots trắng | |
| 28 | CAL_G_10 | Ngày KHÔNG có plan → dots transparent | `bg-transparent` cho 3 dots | |
| 29 | CAL_G_11 | Mẹo tooltip khi không có plan | Hiện "Nhấn đúp hoặc nhấn vào ngày đang chọn để lên kế hoạch" | Mobile: "Nhấn vào ngày đang chọn để lên kế hoạch" |
| 30 | CAL_G_12 | Mẹo ẩn khi có plan | Ngày đang chọn có plan → không hiển thị mẹo | |
| 31 | CAL_G_13 | Legend indicator | 3 dots legend: Sáng (amber), Trưa (blue), Tối (indigo) | |
| 32 | CAL_G_14 | Nút "Hôm nay" | Click → `setCurrentMonth(today)` + `onSelectDate(today)` | |
| 33 | CAL_G_15 | Nút chuyển view mode | Click icon List → chuyển sang week view, icon Calendar → chuyển lại | |
| 34 | CAL_G_16 | Tháng 2 năm nhuận | Năm nhuận: 29 ngày, năm thường: 28 ngày | Edge case quan trọng |
| 35 | CAL_G_17 | Chuyển tháng 12→1 (năm mới) | Tháng 12/2026 → click "▶" → Tháng 1/2027 | |
| 36 | CAL_G_18 | Chuyển tháng 1→12 (năm trước) | Tháng 1/2026 → click "◀" → Tháng 12/2025 | |

### B2. DateSelector — Week Scroll Mode

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 37 | CAL_W_01 | Hiển thị ±14 ngày quanh ngày chọn | 29 buttons cuộn ngang, mỗi button có label thứ + ngày | |
| 38 | CAL_W_02 | Auto-scroll đến ngày chọn | `scrollIntoView({ behavior: 'smooth', inline: 'center' })` | |
| 39 | CAL_W_03 | Click ngày → chọn ngày | Same as calendar grid | |
| 40 | CAL_W_04 | Click ngày đang chọn → mở TypeSelection | Same behavior | |

---

## PHẦN C: LUỒNG CALENDAR — KẾ HOẠCH BỮA ĂN (24 TCs)

### C1. TypeSelectionModal

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 41 | PLAN_T_01 | Mở modal từ nút "Lên kế hoạch" | 3 options: Bữa Sáng (amber), Bữa Trưa (blue), Bữa Tối (indigo) | |
| 42 | PLAN_T_02 | Bữa đã có plan → border emerald | `isPlanned` → `border-emerald-500`, text emerald | |
| 43 | PLAN_T_03 | Click bữa → mở PlanningModal | `onSelectType(type)` → TypeSelection đóng, PlanningModal mở | |
| 44 | PLAN_T_04 | Click backdrop → đóng modal | Click overlay → `onClose()` | |
| 45 | PLAN_T_05 | Click X → đóng modal | Button close top-right | |

### C2. PlanningModal

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 46 | PLAN_P_01 | Chỉ hiển thị món có tag phù hợp | Bữa Sáng → chỉ hiện món có `tags.includes('breakfast')` | |
| 47 | PLAN_P_02 | Tìm kiếm món ăn trong modal | Nhập keyword → filter realtime | |
| 48 | PLAN_P_03 | Sort options (6 kiểu) | Tên A-Z, Z-A, Calo thấp→cao, cao→thấp, Protein thấp→cao, cao→thấp | |
| 49 | PLAN_P_04 | Toggle chọn/bỏ chọn món | Click → border emerald + checkmark, click lại → bỏ chọn | |
| 50 | PLAN_P_05 | Counter "Đã chọn: X món" | Hiện số lượng đã chọn ở footer | |
| 51 | PLAN_P_06 | Tổng dinh dưỡng đã chọn | Footer hiện `X kcal · Yg Pro` của tổng các món đã chọn | |
| 52 | PLAN_P_07 | Pre-select các món đã trong plan | `currentDishIds` → Set được khởi tạo → các món đã plan tự checked | |
| 53 | PLAN_P_08 | Xác nhận với 0 món | Click Xác nhận khi không chọn → plan bị xóa hết cho bữa đó (dishIds=[]) | Edge: xóa plan bữa |
| 54 | PLAN_P_09 | Nút "Back" → về TypeSelection | `onBack()` → PlanningModal đóng, TypeSelection mở lại | |
| 55 | PLAN_P_10 | Empty state khi không có món phù hợp | "Chưa có món ăn phù hợp cho Bữa Sáng. Hãy thêm món ăn và gắn tag" | |
| 56 | PLAN_P_11 | Chọn nhiều món cho 1 bữa | Chọn 3 món → Xác nhận → MealCard hiện 3 tên món + tổng dinh dưỡng | |

### C3. MealCards

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 57 | PLAN_M_01 | Hiển thị tên món + dinh dưỡng | Mỗi món 1 dòng (icon ChefHat + name), footer: kcal + Pro | |
| 58 | PLAN_M_02 | Empty card → nút "Thêm món ăn" | Border dashed, icon Plus, click → mở PlanningModal trực tiếp | |
| 59 | PLAN_M_03 | Nút edit (bút chì) → mở PlanningModal | Click bút → `onPlanMeal(type)` → TypeSelection SKIP, vào thẳng PlanningModal | |
| 60 | PLAN_M_04 | Món bị xóa khỏi thư viện | Dish ID tồn tại trong plan nhưng dish đã bị xóa → `dishes.find(d => d.id === id)` return undefined → tên không hiện | Edge: orphan reference |

### C4. AI Suggest & Clear

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 61 | PLAN_A_01 | Nút "Gợi ý AI" — loading state | Button disabled + Loader2 spin khi `isSuggesting=true` | |
| 62 | PLAN_A_02 | AI suggest thành công | `suggestion.breakfastDishIds.length > 0` → toast success + reasoning | |
| 63 | PLAN_A_03 | AI suggest GIỮ bữa đã có plan | `suggestion.breakfastDishIds.length === 0` → giữ `existing?.breakfastDishIds` | Edge: chỉ fill bữa trống |
| 64 | PLAN_A_04 | AI suggest thất bại | Toast error "Gợi ý thất bại" + "Vui lòng kiểm tra lại API Key" | |

### C5. ClearPlanModal

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 65 | PLAN_C_01 | 3 scope options với counter | Ngày (X ngày), Tuần (Y ngày), Tháng (Z ngày) — hiển thị số kế hoạch sẽ bị xóa | |
| 66 | PLAN_C_02 | Scope disabled khi count=0 | `disabled={count === 0}` → opacity-50, cursor-not-allowed | |
| 67 | PLAN_C_03 | Xóa scope ngày | Chỉ xóa plan của `selectedDate` | |
| 68 | PLAN_C_04 | Xóa scope tuần | Tính T2→CN, xóa tất cả plans trong range | |
| 69 | PLAN_C_05 | Xóa scope tháng | Xóa tất cả plans cùng year+month | |
| 70 | PLAN_C_06 | Xóa tuần chứa Chủ Nhật | `day===0 ? -6 : 1` → CN tính về tuần trước | Edge: week boundary |
| 71 | PLAN_C_07 | Xóa tháng cuối năm → scope chính xác | Tháng 12 chỉ xóa tháng 12, không ảnh hưởng tháng 1 năm sau | |

---

## PHẦN D: LUỒNG DINH DƯỠNG & MỤC TIÊU (18 TCs)

### D1. Summary Panel

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 72 | NUT_S_01 | Tổng hợp dinh dưỡng 3 bữa | Calories/Protein/Carbs/Fat/Fiber = sum(breakfast + lunch + dinner) | |
| 73 | NUT_S_02 | Progress bar Calories | `calPercent = min(100, totalCal/targetCal * 100)` — cap tại 100% | |
| 74 | NUT_S_03 | Progress bar Calories vượt mục tiêu | `totalCalories > targetCalories` → bar đổi sang `bg-rose-500` (đỏ) | Edge: visual warning |
| 75 | NUT_S_04 | Progress bar Protein | Tương tự calories | |
| 76 | NUT_S_05 | 3 ô phụ: Carbs/Fat/Fiber | Hiển thị giá trị round, màu amber/rose/emerald | |
| 77 | NUT_S_06 | Nút edit goals → mở GoalSettings | Click bút chì → `onEditGoals()` | |
| 78 | NUT_S_07 | Ngày không có plan → tất cả = 0 | Chuyển sang ngày trống → "0 / 1500" | |

### D2. GoalSettingsModal

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 79 | NUT_G_01 | 3 fields: weight, proteinRatio, targetCalories | Pre-filled với giá trị hiện tại, auto-save onChange | |
| 80 | NUT_G_02 | Weight min=1, max=500 | Nhập 0 → clamp thành 1. Nhập 600 → HTML cho phép nhưng logic `Math.max(1,...)` | |
| 81 | NUT_G_03 | Protein ratio min=0.1, max=5 | Nhập 0 → 0.1. 4 preset buttons: 1.2, 1.6, 2, 2.2 | |
| 82 | NUT_G_04 | Preset buttons | Click 2.0 → `proteinRatio=2`, button active `bg-blue-500 text-white` | |
| 83 | NUT_G_05 | Calculated protein display | Badge "Xg / ngày" = `weight * proteinRatio` cập nhật realtime | |
| 84 | NUT_G_06 | Target calories min=100 | Nhập 50 → clamp thành 100 | |
| 85 | NUT_G_07 | Auto-save ngay khi thay đổi | "Thay đổi được tự động lưu ngay lập tức" — `onUpdateProfile` gọi trực tiếp trong onChange | |
| 86 | NUT_G_08 | Nút "Hoàn tất" → đóng modal | Chỉ đóng modal, không cần confirm (đã auto-save) | |
| 87 | NUT_G_09 | Input weight NaN | Nhập chữ → `Number(e.target.value)` = NaN → `Math.max(1, NaN || 1)` = 1 | Edge: NaN handling |

### D3. RecommendationPanel / Tips

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 88 | NUT_T_01 | Tip: Chưa có plan | "📋 Bắt đầu lên kế hoạch ăn uống..." | |
| 89 | NUT_T_02 | Tip: Calories vượt >15% | "⚠️ Bạn đang vượt Xkcal so với mục tiêu" | |
| 90 | NUT_T_03 | Tip: Calories thấp <70% (khi đủ 3 bữa) | "📉 Lượng calo hôm nay thấp" — chỉ hiện khi `isComplete` | Edge: chỉ cảnh báo khi đủ 3 bữa |
| 91 | NUT_T_04 | Tip: Protein đạt mục tiêu | "💪 Tuyệt vời! Đạt Xg protein" | |
| 92 | NUT_T_05 | Tip: Protein thấp <80% (khi đủ 3 bữa) | "🥩 Protein hôm nay mới đạt..." | |
| 93 | NUT_T_06 | Tip: Fiber thấp < 15g (khi đủ 3 bữa) | "🥬 Lượng chất xơ thấp" | |
| 94 | NUT_T_07 | Tip: Fat ratio > 40% tổng calo | "🫒 Tỷ lệ chất béo cao (X%)" | |
| 95 | NUT_T_08 | Tip: Kế hoạch cân đối | "✅ Kế hoạch hôm nay cân đối!" — khi đủ 3 bữa + không có warning | |
| 96 | NUT_T_09 | Max 2 tips hiển thị | `tips.slice(0, 2)` — chỉ hiển thị tối đa 2 tips | Edge: prioritization |
| 97 | NUT_T_10 | Footer: Missing slots | "Bạn còn thiếu bữa sáng, bữa trưa" / "Kế hoạch ngày hôm nay đã hoàn tất!" | |

### D4. Nutrition Calculation

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 98 | NUT_C_01 | Unit g → factor = amount/100 | 200g ức gà (165cal/100g) → 330 cal | |
| 99 | NUT_C_02 | Unit kg → factor = amount*1000/100 | 0.2kg ức gà → factor = 2 → 330 cal | |
| 100 | NUT_C_03 | Unit ml → factor = amount/100 | Tương tự g | |
| 101 | NUT_C_04 | Unit "cái"/"quả" (piece) → factor = amount | 2 quả trứng (155cal/quả) → 310 cal | Edge: non-weight unit |
| 102 | NUT_C_05 | Ingredient không tìm thấy | `allIngredients.find()` return undefined → skip, không crash | Edge: orphan ingredient |
| 103 | NUT_C_06 | Dish không tìm thấy | `allDishes.find()` return undefined → skip | Edge: orphan dish |
| 104 | NUT_C_07 | normalizeUnit aliases | "gram"→"g", "kilogram"→"kg", "gam"→"g", "Liter"→"l" | |

---

## PHẦN E: LUỒNG QUẢN LÝ NGUYÊN LIỆU (22 TCs)

### E1. CRUD Nguyên liệu

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 105 | ING_C_01 | Mở modal "Thêm nguyên liệu mới" | Title đúng, form trống, unit mặc định "g" | |
| 106 | ING_C_02 | Form validation — tên required | Submit không nhập tên → HTML5 required block | |
| 107 | ING_C_03 | Submit thành công | `onAdd({ ...formData, id: 'ing-{timestamp}' })` → modal đóng, NL mới xuất hiện | |
| 108 | ING_C_04 | AI auto-fill dinh dưỡng | Nhập tên + click AI → loading → 5 fields auto-fill (cal/pro/carbs/fat/fiber) | |
| 109 | ING_C_05 | AI button disabled khi chưa nhập tên | `disabled={!formData.name \|\| !formData.unit \|\| isSearchingAI}` | |
| 110 | ING_C_06 | AI timeout → warning toast | Error.message === "Timeout" → "Phản hồi quá lâu. Vui lòng thử lại sau." | Edge: 5 phút timeout |
| 111 | ING_C_07 | AI error (non-timeout) → error toast | "Tra cứu thất bại. Không thể tìm thấy thông tin" | |
| 112 | ING_C_08 | AI response sau khi modal đóng | `isModalOpenRef.current === false` → KHÔNG update state → no crash | Edge: race condition |
| 113 | ING_R_01 | Mở modal "Sửa nguyên liệu" | Title "Sửa nguyên liệu", form pre-filled dữ liệu hiện tại | |
| 114 | ING_R_02 | Sửa thành công | `onUpdate({ ...formData, id: editingIng.id })` → card cập nhật | |
| 115 | ING_D_01 | Xóa NL không dùng — confirm dialog | ConfirmationModal "Xóa nguyên liệu?" → click "Xóa ngay" → NL biến mất | |
| 116 | ING_D_02 | Xóa NL đang dùng → warning | `isUsed(id)=true` → toast warning "Không thể xóa" → KHÔNG mở confirm | |
| 117 | ING_D_03 | Nút Xóa style disabled khi đang dùng | `text-slate-300 cursor-not-allowed` thay vì `text-slate-500` | |
| 118 | ING_D_04 | Xóa NL → auto-remove từ dishes | `removeIngredientFromDishes(dishes, ingredientId)` → món ăn mất NL đó | |

### E2. UI/UX Nguyên liệu

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 119 | ING_U_01 | Search filter realtime | Nhập "gà" → chỉ hiện "Ức gà" | |
| 120 | ING_U_02 | Search no results | Nhập "xyz" → empty state "Không tìm thấy nguyên liệu" + "Thử tìm kiếm với từ khóa khác" | |
| 121 | ING_U_03 | Empty state (no data) | 0 NL → "Chưa có nguyên liệu nào" + CTA "Thêm nguyên liệu" | |
| 122 | ING_U_04 | Relationship tags "Dùng trong:" | NL dùng trong 1 món → "Dùng trong: Tên món". 3+ món → "Tên1, Tên2 +1" | |
| 123 | ING_U_05 | Display unit label dynamic | unit="g" → "100g", unit="kg" → "100g" (đã normalize), unit="quả" → "1 quả" | |
| 124 | ING_U_06 | Nutrition values min=0 | `Math.max(0, Number(e.target.value))` — không cho âm | Edge: negative input |
| 125 | ING_U_07 | Card layout responsive | 1 col mobile, 2 col sm, 3 col lg | |
| 126 | ING_U_08 | AI giữ unit người dùng | AI trả về unit khác → app giữ nguyên `formData.unit` ban đầu | |

---

## PHẦN F: LUỒNG QUẢN LÝ MÓN ĂN (20 TCs)

### F1. CRUD Món ăn

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 127 | DSH_C_01 | Mở modal "Tạo món ăn mới" | Title đúng, form trống, tags=[], selectedIngredients=[] | |
| 128 | DSH_C_02 | Chọn/bỏ tag bữa | Toggle 3 tags: Sáng/Trưa/Tối — active `bg-emerald-500 text-white` | |
| 129 | DSH_C_03 | Thêm NL từ danh sách | Click NL → thêm vào "Đã chọn" với amount=100. Click NL đã chọn → KHÔNG thêm trùng | Edge: duplicate check |
| 130 | DSH_C_04 | Tìm kiếm NL trong modal | Input filter NL realtime | |
| 131 | DSH_C_05 | Stepper +10 / -10 | "+" → amount+10, "-" → Math.max(0.1, amount-10) | |
| 132 | DSH_C_06 | Nhập trực tiếp amount | Type số → `Math.max(0.1, Number(value) \|\| 0.1)` | Edge: NaN, 0, negative |
| 133 | DSH_C_07 | Xóa NL khỏi danh sách chọn | Click trash icon → NL biến mất, "Chưa chọn nguyên liệu" nếu rỗng | |
| 134 | DSH_C_08 | Submit validation | `!name \|\| selectedIngredients.length === 0` → return, không submit | Edge: thiếu NL |
| 135 | DSH_C_09 | Submit thành công — tạo mới | `onAdd(dishData)` với id=`dish-{timestamp}` | |
| 136 | DSH_R_01 | Mở modal sửa món | Pre-fill name, tags (spread copy), ingredients (spread copy) | |
| 137 | DSH_R_02 | Sửa thành công | `onUpdate(dishData)` → card cập nhật | |
| 138 | DSH_D_01 | Xóa món không dùng | ConfirmationModal "Xóa món ăn?" → "Xóa ngay" → món biến mất | |
| 139 | DSH_D_02 | Xóa món đang dùng trong plan | `isDishUsed(id)=true` → toast warning "Không thể xóa" | |

### F2. UI/UX Món ăn

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 140 | DSH_U_01 | Tag filter chips | "Tất cả (X)" + 3 tag chips với counter — toggle filter | |
| 141 | DSH_U_02 | Filter + Search kết hợp | Search "gà" + filter "Trưa" → chỉ hiện món có cả 2 điều kiện | |
| 142 | DSH_U_03 | Card hiển thị NL count + nutrition | "3 nguyên liệu", Calories 332, Protein 25g | |
| 143 | DSH_U_04 | Card hiển thị tag labels | "🌅 Sáng", "🌤️ Trưa" — flex wrap | |
| 144 | DSH_U_05 | Empty state search | "Không tìm thấy món ăn" + "Thử tìm kiếm với từ khóa khác." | |
| 145 | DSH_U_06 | Empty state no data | "Chưa có món ăn nào" + CTA "Tạo món ăn" | |

---

## PHẦN G: LUỒNG ĐI CHỢ (16 TCs)

### G1. Grocery List Logic

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 146 | GRC_L_01 | Scope "Hôm nay" | Chỉ collect NL từ `currentPlan` | |
| 147 | GRC_L_02 | Scope "Tuần này" | T2→CN: filter `dayPlans` trong range | |
| 148 | GRC_L_03 | Scope "Tất cả" | Toàn bộ `dayPlans` | |
| 149 | GRC_L_04 | Gộp NL trùng tên | 2 bữa đều có Ức gà 200g → hiện 1 dòng "Ức gà 400g" | Edge: aggregation |
| 150 | GRC_L_05 | Sort A-Z | `Object.values(map).sort((a, b) => a.name.localeCompare(b.name))` | |
| 151 | GRC_L_06 | Empty state — hôm nay trống, tuần có data | Hôm nay empty → check nếu tuần cũng empty → mới hiện EmptyState CTA | |
| 152 | GRC_L_07 | NL bị xóa khỏi thư viện | `allIngredients.find()` return undefined → skip, không crash | Edge: orphan |
| 153 | GRC_L_08 | Dish bị xóa khỏi thư viện | `allDishes.find()` return undefined → skip, không crash | Edge: orphan |

### G2. Grocery UI/UX

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 154 | GRC_U_01 | 3 scope tabs | "Hôm nay" / "Tuần này" / "Tất cả" — active `bg-white text-emerald-600 shadow-sm` | |
| 155 | GRC_U_02 | Checkbox toggle | Click item → checked (✅ emerald, line-through), click lại → uncheck | |
| 156 | GRC_U_03 | Progress bar + counter | "Đã mua 2/5" + progress bar emerald | |
| 157 | GRC_U_04 | All checked → celebration | "Đã mua đủ tất cả nguyên liệu! 🎉" footer emerald | |
| 158 | GRC_U_05 | Copy to clipboard | Click copy → format text "✅/☐ Tên — Xg" → toast success | |
| 159 | GRC_U_06 | Share (native) | `navigator.share` nếu có, fallback → copy | |
| 160 | GRC_U_07 | Chuyển scope → reset checked | `setCheckedIds(new Set())` khi switch scope | |
| 161 | GRC_U_08 | Amount hiển thị rounded | `Math.round(item.amount)` | |

---

## PHẦN H: LUỒNG AI PHÂN TÍCH HÌNH ẢNH (18 TCs)

### H1. Upload & Camera

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 162 | AI_U_01 | Tải ảnh từ file | Input file → FileReader → base64 → preview hiển thị | |
| 163 | AI_U_02 | Chụp ảnh từ camera | `getUserMedia` → video preview → "Chụp" → canvas capture → base64 | |
| 164 | AI_U_03 | Camera bị từ chối quyền | `cameraError` → hiện message + nút "Đóng camera" | Edge: permission denied |
| 165 | AI_U_04 | Dán ảnh (Ctrl+V / Cmd+V) | `paste` event listener → clipboard image → base64 | |
| 166 | AI_U_05 | "Chọn ảnh khác" | Reset image, clear result | |
| 167 | AI_U_06 | Nút "Phân tích" disabled khi chưa có ảnh | `disabled` khi `!image` | |

### H2. Phân tích & Kết quả

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 168 | AI_A_01 | Loading state | Button "Đang phân tích..." disabled, text "AI đang phân tích hình ảnh..." | |
| 169 | AI_A_02 | Kết quả thành công | Tên + mô tả + 4 ô dinh dưỡng + bảng NL chi tiết | |
| 170 | AI_A_03 | Phân tích thất bại | Toast error "Phân tích thất bại" | |

### H3. Save Modal

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 171 | AI_S_01 | Mở save modal | Click "Lưu vào thư viện" → editedResult = deep clone, checkbox checked | |
| 172 | AI_S_02 | Checkbox "Lưu món ăn này" | Uncheck → `shouldCreateDish=false` → chỉ lưu NL, không tạo món | |
| 173 | AI_S_03 | Edit tên + mô tả | Text input pre-filled, cho phép sửa | |
| 174 | AI_S_04 | Toggle chọn/bỏ NL | Checkbox mỗi NL → bỏ chọn → NL đó không lưu | |
| 175 | AI_S_05 | "Bỏ chọn tất cả" / "Chọn tất cả" | Toggle all → allSelected ? fill false : fill true | |
| 176 | AI_S_06 | AI Research per ingredient | Click "AI Research" → loading → cập nhật nutrition cho NL đó | |
| 177 | AI_S_07 | Edit nutrition fields inline | Spinbutton cho mỗi metric | |
| 178 | AI_S_08 | Confirm → NL trùng tên không tạo mới | `processAnalyzedDish` → `find(i => i.name.toLowerCase() === aiIng.name.toLowerCase())` → dùng existing | Edge: duplicate NL detection |
| 179 | AI_S_09 | Confirm → chuyển tab Thư viện | `shouldCreateDish=true` → tab dishes; `false` → tab ingredients | |

---

## PHẦN I: DATA BACKUP & PERSISTENCE (12 TCs)

### I1. Xuất / Nhập dữ liệu

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 180 | BAK_E_01 | Xuất JSON | File `meal-planner-backup-YYYY-MM-DD.json` tải xuống, chứa 4 keys + metadata | |
| 181 | BAK_E_02 | JSON structure | `mp-ingredients`, `mp-dishes`, `mp-day-plans`, `mp-user-profile`, `_exportedAt`, `_version` | |
| 182 | BAK_I_01 | Nhập file hợp lệ | Upload → validate keys → `localStorage.setItem` → toast success → reload sau 1.5s | |
| 183 | BAK_I_02 | Nhập file không hợp lệ — thiếu keys | File JSON không chứa key nào trong EXPORT_KEYS → toast error "File không hợp lệ" | Edge: invalid backup |
| 184 | BAK_I_03 | Nhập file không phải JSON | JSON.parse fail → toast error "File không đúng định dạng JSON" | Edge: corrupted file |
| 185 | BAK_I_04 | Loading state khi import | `isImporting=true` → button disabled + Loader2 spin | |
| 186 | BAK_I_05 | Reset file input sau import | `fileInputRef.current.value = ''` → cho phép upload lại cùng file | |

### I2. usePersistedState

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 187 | PER_01 | Hydrate từ localStorage | Mount → đọc localStorage → parse JSON → dùng làm initial state | |
| 188 | PER_02 | Fallback khi corrupted | JSON.parse fail → `console.warn` + dùng `initialValue` | Edge: corrupted data |
| 189 | PER_03 | Auto-save onChange | `useEffect([key, value])` → `localStorage.setItem` | |
| 190 | PER_04 | localStorage full | `setItem` fail → `console.warn` → app vẫn chạy (state in memory) | Edge: quota exceeded |
| 191 | PER_05 | Reset function | `resetValue()` → set initialValue + `localStorage.removeItem` | |

---

## PHẦN J: ERROR HANDLING & NOTIFICATION (11 TCs)

### J1. ErrorBoundary

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 192 | ERR_B_01 | 4 ErrorBoundary wrappers | Lịch trình / Đi chợ / Thư viện / AI — mỗi tab độc lập | |
| 193 | ERR_B_02 | Fallback UI | Icon AlertTriangle + title + "Có lỗi không mong muốn" + 2 buttons | |
| 194 | ERR_B_03 | Nút "Thử lại" | `setState({ hasError: false, error: null })` → re-render children | |
| 195 | ERR_B_04 | Nút "Tải lại trang" | `location.reload()` | |
| 196 | ERR_B_05 | Error details collapsible | `<details>` → `error.message` | |
| 197 | ERR_B_06 | Lỗi 1 tab không ảnh hưởng tab khác | Tab Calendar crash → tab Đi chợ vẫn hoạt động | Edge: isolation |

### J2. Notification System

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 198 | NOT_01 | 4 loại toast | Success (emerald), Error (rose), Warning (amber), Info (sky) | |
| 199 | NOT_02 | Auto-dismiss | Success 15s, Error 10s, Warning 5s, Info 4s | |
| 200 | NOT_03 | Hover pause timer | Mouse enter → `clearTimeout`, mouse leave → 2s mới dismiss | |
| 201 | NOT_04 | Max 5 toasts | `prev.slice(-(MAX_TOASTS - 1))` → 6th toast đẩy toast cũ nhất ra | Edge: overflow |
| 202 | NOT_05 | Click toast với onClick handler | Clickable toast → `handleClick()` + dismiss | |

---

## PHẦN K: DATA MIGRATION & EDGE CASES (8 TCs)

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 203 | MIG_01 | migrateDishes — thêm tags=[] | Dữ liệu cũ thiếu `tags` → tự thêm `tags: []` | |
| 204 | MIG_02 | migrateDayPlans — old format | Dữ liệu có `breakfastId` thay vì `breakfastDishIds` → tạo empty plan | |
| 205 | MIG_03 | Persist migrated data | `useEffect` detect `needsMigration` → `setDishes(dishes)` → ghi lại localStorage | |
| 206 | MIG_04 | processAnalyzedDish — NL trùng tên | AI trả về NL đã tồn tại (case-insensitive) → dùng existing, không tạo mới | |
| 207 | MIG_05 | generateId uniqueness | `${prefix}-${Date.now()}-${random}` — 2 calls liên tiếp → 2 IDs khác nhau | |
| 208 | MIG_06 | applySuggestionToDayPlans — new plan | Ngày chưa có plan → `[...plans, merged]` thêm mới | |
| 209 | MIG_07 | applySuggestionToDayPlans — existing plan | Ngày đã có plan → `plans.map(p => p.date === selectedDate ? merged : p)` update | |
| 210 | MIG_08 | clearPlansByScope — empty plans array | Plans=[] → filter return [] → no crash | |

---

## PHẦN L: RESPONSIVE & UI/UX CROSS-CUTTING (12 TCs)

### L1. Modal Responsive

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 211 | RES_M_01 | Modal mobile = Bottom Sheet | `items-end` → trượt từ dưới, `rounded-t-3xl`, full width | |
| 212 | RES_M_02 | Modal desktop = Center dialog | `sm:items-center`, `sm:rounded-3xl`, `sm:max-w-md` | |
| 213 | RES_M_03 | Modal max-height 90vh | `max-h-[90vh]` → không tràn viewport | |
| 214 | RES_M_04 | Modal backdrop click close | Click overlay → `onClose()` trên tất cả modal | |
| 215 | RES_M_05 | Scrollable content trong modal | `overflow-y-auto` cho danh sách dài (PlanningModal, DishManager) | |

### L2. Touch & Typography

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 216 | RES_T_01 | Touch targets ≥ 44px | Tất cả buttons, inputs, checkboxes: `min-h-11` (44px) trên mobile | |
| 217 | RES_T_02 | Input font ≥ 16px | `text-base sm:text-sm` → mobile 16px, desktop 14px. Tránh iOS auto-zoom | |
| 218 | RES_T_03 | Active state trên mobile | `active:scale-[0.98]`, `active:bg-*` cho feedback khi tap | |
| 219 | RES_T_04 | Hover state trên desktop | `hover:bg-*`, `hover:text-*`, `hover:shadow-md` | |
| 220 | RES_T_05 | Text colors accessible | Title: `text-slate-800/900`, body: `text-slate-500/600`, KHÔNG dùng #000 | |
| 221 | RES_T_06 | Scrollbar hidden | `scrollbar-hide` trên horizontal scroll areas (tags, week dates, scope tabs) | |
| 222 | RES_T_07 | Card-based layout | `bg-white rounded-2xl shadow-sm border border-slate-100` consistent | |

---

## TÓM TẮT

| Phần | Module | Số TC |
|------|--------|-------|
| A | Navigation & Layout | 18 |
| B | Calendar — Chọn ngày | 22 |
| C | Calendar — Kế hoạch bữa ăn | 24 |
| D | Dinh dưỡng & Mục tiêu | 18 |
| E | Quản lý Nguyên liệu | 22 |
| F | Quản lý Món ăn | 20 |
| G | Đi chợ | 16 |
| H | AI Phân tích | 18 |
| I | Data Backup & Persistence | 12 |
| J | Error Handling & Notification | 11 |
| K | Data Migration & Edge Cases | 8 |
| L | Responsive & UI/UX | 12 |
| **TỔNG** | | **201** |

### So sánh với V1 (41 TCs)

| Metric | V1 | V2 | Mới thêm |
|--------|-----|-----|---------|
| Navigation | 4 | 18 | +14 (badge detail, DOM structure, responsive) |
| Calendar | 8 | 46 | +38 (week view, double-click, month boundaries, meal dots) |
| Management | 15 | 42 | +27 (validation, AI timeout, race condition, duplicate check) |
| Grocery | 3 | 16 | +13 (aggregation, copy, share, scope reset, orphan refs) |
| AI | 4 | 18 | +14 (camera, paste, save modal detail, AI Research) |
| Nutrition | 0 | 18 | +18 (calculation units, tips logic, progress bar colors) |
| Data/Error | 3 + 4 = 7 | 31 | +24 (migration, persistence edge, notification limits) |
| Responsive | 4 | 12 | +8 (modal variants, scrollbar, card layout) |
| **TỔNG** | **41** | **201** | **+160 TCs** |

