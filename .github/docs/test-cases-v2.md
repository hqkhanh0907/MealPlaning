# TEST CASES V2 — Smart Meal Planner (Phân tích toàn diện)

> **Phiên bản:** 2.12  
> **Ngày cập nhật:** 2026-03-01  
> **Tổng TC:** 303  
> **Phương pháp:** Phân tích theo từng luồng nghiệp vụ (Business Flow), từng component (UI/UX), và mọi edge case có thể xảy ra.
> 
> **Changelog v2.12:**
> - M: Dark Mode / Theme Switcher (+8 TCs: THEME_01~08)
>   - 3-mode cycling (light → dark → system), icon thay đổi (Sun/Moon/Monitor), persist localStorage, system preference auto-detect, dark class toggle trên `<html>`, áp dụng toàn bộ UI
> - N: Lazy Loading & Code Splitting (+5 TCs: LAZY_01~05)
>   - GroceryList & AIImageAnalyzer dùng `React.lazy` + `Suspense`, TabLoadingFallback spinner, conditional render vs hidden/block strategy
> - O: Image Compression (+4 TCs: IMG_C_01~04)
>   - Upload/Camera/Paste → compress ≤ 1024x1024 JPEG 0.8, canvas fail → fallback ảnh gốc
> - A5: Management Sub-tabs (+4 TCs: MGT_S_01~04)
>   - 2 sub-tabs Món ăn / Nguyên liệu, DataBackup section, responsive touch target
> - J2: Notification nâng cao (+5 TCs: NOT_06~10)
>   - Toast action button, responsive position, close button, keyboard a11y, import validation per-key
>
> **Changelog v2.11:**
> - F1: Ingredient Picker — Ẩn NL đã chọn khỏi danh sách picker (+4 TCs: DSH_C_10~13)
>   - Chọn NL → biến mất khỏi picker, xóa NL → hiện lại, chọn hết → empty "Đã chọn tất cả", search + filter kết hợp
>
> **Changelog v2.10:**
> - E5/F5: Mobile Back Gesture Navigation (+8 TCs)
>   - ING_BK_01~04: Nguyên liệu — Back đóng View, Back từ Edit (no change) → View, Back từ Edit (có change) → unsaved dialog, Back từ dialog → dismiss
>   - DSH_BK_01~04: Món ăn — tương tự flow
>   - Implementation: `useModalBackHandler` hook với `history.pushState` + `popstate` + `@capacitor/app` backButton
>   - Tích hợp vào tất cả modals: DishManager, IngredientManager, PlanningModal, GoalSettingsModal, AISuggestionPreviewModal, ClearPlanModal, TypeSelectionModal, ConfirmationModal, AIImageAnalyzer
>
> **Changelog v2.9:**
> - E3/F3: View Detail ↔ Edit Modal navigation flow (+12 TCs)
>   - ING_VE_01~06: Nguyên liệu — Edit→Back quay lại View, detect thay đổi, dialog 3 nút (Lưu/Bỏ/Ở lại), Lưu→view mới, cameFromView=false bypass
>   - DSH_VE_01~06: Món ăn — tương tự flow IngredientManager
>
> **Changelog v2.8:**
> - E2/F2: View Detail Modal — click item trong thư viện mở modal xem chi tiết, có nút Edit chuyển sang chế độ sửa (+14 TCs)
>   - ING_V_01~07: Nguyên liệu — click card/row/mobile → view modal, hiển thị nutrition, "Dùng trong", nút Edit header + footer, backdrop close
>   - DSH_V_01~07: Món ăn — click card/row/mobile → view modal, hiển thị nutrition + ingredients list + tags, nút Edit header + footer, backdrop close
>
> **Changelog v2.7:**
> - H3: AI Save Modal — bắt buộc chọn tags khi lưu món ăn (+5 TCs)
>   - AI_S_10~14: Tags UI, validation, error clear, payload, skip khi chỉ lưu NL
> - K: migrateDishes — `tags: []` hoặc thiếu tags → default `['lunch']` (cập nhật MIG_01, MIG_03)
> - K: Thêm MIG_00 — validate init data phải có tags ≥ 1 (+1 TC)
> - App.tsx: `handleSaveAnalyzedDish` dùng `result.tags` thay vì hardcode `tags: []`
>
> **Changelog v2.6:**
> - B1/B2: Fix timezone bug — `toISOString()` trả UTC, gây sai ngày "hôm nay" ở timezone GMT+7 (+4 TCs)
>   - CAL_G_22~23: Ngày hôm nay đúng local timezone (calendar + week)
>   - CAL_W_18~19: Nút "Hôm nay" & khởi tạo selectedDate đúng local date
>
> **Changelog v2.5:**
> - F1: Món ăn bắt buộc phải có ít nhất 1 tag (+3 TCs)
>   - DSH_C_02b~d: Label có *, inline error đỏ, clear error khi chọn tag
>
> **Changelog v2.4:**
> - C4: AbortController — Đóng modal hoặc Regenerate sẽ cancel AI call đang chạy (+4 TCs)
>   - PLAN_A_16~19: Cancel on close, cancel on edit, cancel old before regenerate, silent abort
>
> **Changelog v2.3:**
> - C4: AI Suggestion Preview Modal — thay thế flow apply trực tiếp bằng Preview & Xác Nhận (+11 TCs)
>   - Loading state, Reasoning card, Checkbox chọn từng bữa
>   - Regenerate, Edit meal, Progress bars
>   - Error/Empty states
>
> **Changelog v2.2:**
> - E2: Layout Switcher (Grid/List view) + Sort dropdown cho Nguyên liệu (+6 TCs)
> - F2: Layout Switcher (Grid/List view) + Sort dropdown cho Món ăn (+6 TCs)
>
> **Changelog v2.1:**
> - B2: Refactor Week View từ 29-ngày scroll sang 7-ngày/tuần với swipe gesture (+10 TCs)
> - E1: Unit mặc định trống, inline validation errors (+3 TCs), AI error kèm tên NL
> - F1: Search clear → restore full list (+1 TC)
> - H1: Android CAMERA permission, mediaDevices check (+2 TCs)

---

## PHẦN A: LUỒNG NAVIGATION & LAYOUT (22 TCs)

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

### A5. Management Sub-tabs

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 19 | MGT_S_01 | 2 sub-tabs "Món ăn" / "Nguyên liệu" | Tab Thư viện có 2 sub-tabs: "Món ăn" (default) và "Nguyên liệu". Active state `bg-white dark:bg-slate-700 text-emerald-600 shadow-sm`, inactive `text-slate-500` | |
| 20 | MGT_S_02 | Default sub-tab = "Món ăn" | Mở tab Thư viện lần đầu → sub-tab "Món ăn" (`dishes`) hiển thị, DishManager render | |
| 21 | MGT_S_03 | DataBackup section luôn visible | Section "Sao lưu & Khôi phục" hiển thị bên dưới cả 2 sub-tabs (Món ăn lẫn Nguyên liệu), có border-top separator | |
| 22 | MGT_S_04 | Sub-tabs responsive mobile | Mobile: `min-h-11` touch target (44px), `overflow-x-auto scrollbar-hide`, `flex-nowrap`. Desktop: `sm:py-1.5` compact | |

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
| 37 | CAL_G_19 | Header CN màu rose | Header "CN" trong calendar grid hiển thị `text-rose-400`, T2–T7 giữ `text-slate-400` | |
| 38 | CAL_G_20 | Ngày CN trong calendar có background rose | Ngày CN (unselected, not today) hiển thị `bg-rose-50 text-rose-600`, ngày thường `bg-slate-50 text-slate-700` | |
| 39 | CAL_G_21 | Ngày CN selected → ưu tiên emerald | Khi click chọn ngày CN, style emerald-500 selected ưu tiên hơn rose | |
| 40 | CAL_G_22 | Ngày hôm nay đúng local timezone (Calendar) | Ở timezone GMT+7, lúc 0:00–6:59 sáng, ngày highlight "hôm nay" vẫn phải là ngày local (ví dụ 27/02), KHÔNG bị lùi 1 ngày do UTC. Kiểm tra: `formatLocalDate(new Date())` thay vì `new Date().toISOString().split('T')[0]` | Edge: timezone offset |
| 41 | CAL_G_23 | Khởi tạo selectedDate đúng local date | Khi app mở, `selectedDate` phải trùng với ngày local. Ví dụ: hôm nay thứ 6 27/02/2026 → selectedDate = "2026-02-27", KHÔNG phải "2026-02-26" | Edge: UTC midnight shift |

### B2. DateSelector — Week View Mode (7 ngày/tuần)

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 37 | CAL_W_01 | Hiển thị đúng 7 ngày (T2→CN) | Week view chỉ hiện 7 ô ngày dạng grid, bắt đầu từ thứ 2 kết thúc Chủ nhật | |
| 38 | CAL_W_02 | Ngày chọn nằm trong tuần hiện tại | selectedDate = 25/02 (T4) → tuần 24/02–02/03 hiển thị, ngày 25 highlight | |
| 39 | CAL_W_03 | Nút "▶" chuyển tuần tiếp theo | Click → weekOffset++ → hiển thị 7 ngày tuần sau | |
| 40 | CAL_W_04 | Nút "◀" chuyển tuần trước | Click → weekOffset-- → hiển thị 7 ngày tuần trước | |
| 41 | CAL_W_05 | Swipe trái → tuần sau (mobile) | Touch swipe left (>50px) → chuyển tuần tiếp theo | Mobile gesture |
| 42 | CAL_W_06 | Swipe phải → tuần trước (mobile) | Touch swipe right (>50px) → chuyển tuần trước | Mobile gesture |
| 43 | CAL_W_07 | Click ngày trong week view → chọn ngày | Tương tự calendar grid, Summary + MealCards cập nhật | |
| 44 | CAL_W_08 | Click ngày đang chọn → mở TypeSelection | `isSelected && onPlanClick` → mở modal lên kế hoạch | |
| 45 | CAL_W_09 | Nút "Hôm nay" reset weekOffset | Click "Hôm nay" → weekOffset=0 + selectedDate=today | |
| 46 | CAL_W_10 | Meal indicator dots | 3 dots (amber/blue/indigo) hiển thị trên mỗi ngày có plan | |
| 47 | CAL_W_11 | Tuần qua ranh giới tháng | T2=27/01, CN=02/02 → hiển thị đúng ngày tháng khác nhau | Edge: month boundary |
| 48 | CAL_W_12 | Tuần qua ranh giới năm | T2=29/12/2025, CN=04/01/2026 → hiển thị đúng | Edge: year boundary |
| 49 | CAL_W_13 | Label tuần | Header hiển thị range "24/02 - 02/03" thay vì "Chọn ngày" | |
| 50 | CAL_W_14 | Swipe chỉ khi X > Y | Swipe chéo (diffY > diffX) → KHÔNG chuyển tuần, cho phép scroll dọc | Edge: diagonal swipe |
| 51 | CAL_W_15 | Ngày CN trong week view có background rose | Ngày CN (unselected, not today) hiển thị `bg-rose-50 text-rose-600`, label "CN" = `text-rose-400` | |
| 52 | CAL_W_16 | Ngày CN selected trong week → emerald | Khi click chọn CN, style emerald-500 ưu tiên, label white | |
| 53 | CAL_W_17 | Responsive — layout không vỡ khi thêm rose style | Mobile 375px: 7 buttons không bị overflow, không horizontal scroll | |
| 54 | CAL_W_18 | Ngày hôm nay đúng local timezone (Week) | Ở week view, ngày có `isToday=true` phải trùng ngày local thực tế. Kiểm tra: `formatLocalDate(date) === formatLocalDate(new Date())`. VD: hôm nay T6 27/02 → ô T6 ngày 27 phải highlight, KHÔNG phải ô T5 ngày 26 | Edge: timezone offset |
| 55 | CAL_W_19 | Nút "Hôm nay" format đúng local date | Click "Hôm nay" → `onSelectDate(formatLocalDate(today))` → selectedDate = "2026-02-27" (local), KHÔNG bị lệch sang 26 do UTC | Edge: UTC midnight |

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

### C4. AI Suggestion Preview Modal

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 61 | PLAN_A_01 | Nút "Gợi ý AI" mở Preview Modal | Click → mở `AISuggestionPreviewModal` + bắt đầu loading | |
| 62 | PLAN_A_02 | Loading state trong modal | Hiển thị animated Sparkles icon + "AI đang phân tích..." + progress bar | |
| 63 | PLAN_A_03 | Preview Modal hiển thị gợi ý | Sau khi AI xong → hiển thị 3 meal cards với checkbox, tên món, nutrition | |
| 64 | PLAN_A_04 | Reasoning card | Hiển thị lý do AI chọn thực đơn trong card highlight indigo | |
| 65 | PLAN_A_05 | Checkbox chọn áp dụng từng bữa | Mặc định all checked nếu có gợi ý, uncheck → bữa đó không được áp dụng | |
| 66 | PLAN_A_06 | Nutrition summary tổng hợp | Hiển thị tổng cal/protein của các bữa đã chọn vs mục tiêu + progress bars | |
| 67 | PLAN_A_07 | Nút "Thay đổi" mở PlanningModal | Click → đóng Preview, mở PlanningModal cho bữa tương ứng | |
| 68 | PLAN_A_08 | Nút "Gợi ý lại" (Regenerate) | Click → reset + gọi AI lại, hiển thị loading state | |
| 69 | PLAN_A_09 | Nút "Hủy" đóng modal | Click → đóng modal, không thay đổi kế hoạch hiện tại | |
| 70 | PLAN_A_10 | Nút "Áp dụng" — chỉ apply bữa đã chọn | Apply các bữa có checkbox checked → toast success "Đã cập nhật kế hoạch!" | |
| 71 | PLAN_A_11 | "Áp dụng" disabled khi không chọn bữa nào | Uncheck tất cả → button "Áp dụng" disabled | Edge |
| 72 | PLAN_A_12 | Empty suggestion state | AI trả về 0 món cho cả 3 bữa → hiển thị "Chưa tìm được gợi ý phù hợp" + Regenerate | |
| 73 | PLAN_A_13 | Error state | API lỗi / timeout → hiển thị error message + nút "Thử lại" | |
| 74 | PLAN_A_14 | Meal card bị ẩn khi không có gợi ý | Bữa không có gợi ý (dishIds=[]) → không hiển thị card đó | |
| 75 | PLAN_A_15 | Progress bar màu động | Cal vượt mục tiêu → bar đỏ. Protein đạt → bar xanh emerald. Protein thấp → bar amber | |
| 76 | PLAN_A_16 | Đóng modal → hủy AI call đang chạy | Click Hủy/X khi đang loading → `AbortController.abort()` → API call bị cancel, không update state | Critical |
| 77 | PLAN_A_17 | Edit meal → hủy AI call đang chạy | Click "Thay đổi" khi đang loading → abort pending request + mở PlanningModal | Edge |
| 78 | PLAN_A_18 | Regenerate → hủy AI call cũ trước khi gọi mới | Click Regenerate → abort request cũ (nếu còn) + tạo AbortController mới + gọi AI | |
| 79 | PLAN_A_19 | Aborted request không hiện error | Request bị abort → không hiện error toast/message, silent cancel | |

### C5. ClearPlanModal

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 80 | PLAN_C_01 | 3 scope options với counter | Ngày (X ngày), Tuần (Y ngày), Tháng (Z ngày) — hiển thị số kế hoạch sẽ bị xóa | |
| 81 | PLAN_C_02 | Scope disabled khi count=0 | `disabled={count === 0}` → opacity-50, cursor-not-allowed | |
| 82 | PLAN_C_03 | Xóa scope ngày | Chỉ xóa plan của `selectedDate` | |
| 83 | PLAN_C_04 | Xóa scope tuần | Tính T2→CN, xóa tất cả plans trong range | |
| 84 | PLAN_C_05 | Xóa scope tháng | Xóa tất cả plans cùng year+month | |
| 85 | PLAN_C_06 | Xóa tuần chứa Chủ Nhật | `day===0 ? -6 : 1` → CN tính về tuần trước | Edge: week boundary |
| 86 | PLAN_C_07 | Xóa tháng cuối năm → scope chính xác | Tháng 12 chỉ xóa tháng 12, không ảnh hưởng tháng 1 năm sau | |

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
| 105 | ING_C_01 | Mở modal "Thêm nguyên liệu mới" | Title đúng, form trống, unit mặc định **trống** (placeholder "g, ml, cái, quả...") | |
| 106 | ING_C_02 | Validation tên trống | Submit không nhập tên → hiển thị text đỏ "Vui lòng nhập tên nguyên liệu" dưới field, border đỏ `border-rose-500` | |
| 106b | ING_C_02b | Validation unit trống | Submit khi unit trống → hiển thị đỏ "Vui lòng nhập đơn vị tính" dưới field unit, border đỏ | |
| 106c | ING_C_02c | Clear error khi nhập | User bắt đầu nhập vào field đang lỗi → error message biến mất, border trở về `border-slate-200` | |
| 106d | ING_C_02d | Nhiều field lỗi cùng lúc | Cả tên lẫn unit trống → cả 2 field đều hiện error đỏ đồng thời | Edge: multiple errors |
| 107 | ING_C_03 | Submit thành công | `onAdd({ ...formData, id: 'ing-{timestamp}' })` → modal đóng, NL mới xuất hiện | |
| 108 | ING_C_04 | AI auto-fill dinh dưỡng | Nhập tên + unit + click AI → loading → 5 fields auto-fill (cal/pro/carbs/fat/fiber) | |
| 109 | ING_C_05 | AI button disabled khi chưa nhập tên HOẶC unit | `disabled={!formData.name \|\| !formData.unit \|\| isSearchingAI}` — unit mặc định trống nên button disabled ban đầu | |
| 110 | ING_C_06 | AI timeout → warning toast với tên NL | Error.message === "Timeout" → `notify.warning('Phản hồi quá lâu', '"Tên NL" — Hệ thống phản hồi quá lâu. Vui lòng thử lại sau.')` | Edge: 5 phút timeout |
| 111 | ING_C_07 | AI error (non-timeout) → error toast với tên NL | `notify.error('Tra cứu thất bại', '"Tên NL" — Không thể tìm thấy thông tin. Vui lòng thử lại.')` | |
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
| 120 | ING_U_02 | Search no results → clear → full list | 1. Nhập "xyz" → empty state "Không tìm thấy nguyên liệu". 2. Xóa nội dung ô tìm kiếm → danh sách tất cả nguyên liệu hiển thị lại đầy đủ | |
| 121 | ING_U_03 | Empty state (no data) | 0 NL → "Chưa có nguyên liệu nào" + CTA "Thêm nguyên liệu" | |
| 122 | ING_U_04 | Relationship tags "Dùng trong:" | NL dùng trong 1 món → "Dùng trong: Tên món". 3+ món → "Tên1, Tên2 +1" | |
| 123 | ING_U_05 | Display unit label dynamic | unit="g" → "100g", unit="kg" → "100g" (đã normalize), unit="quả" → "1 quả" | |
| 124 | ING_U_06 | Nutrition values min=0 | `Math.max(0, Number(e.target.value))` — không cho âm | Edge: negative input |
| 125 | ING_U_07 | Card layout responsive | 1 col mobile, 2 col sm, 3 col lg | |
| 126 | ING_U_08 | AI giữ unit người dùng | AI trả về unit khác → app giữ nguyên `formData.unit` ban đầu | |
| 127 | ING_U_09 | Layout Switcher toggle | Click Grid/List icon → layout thay đổi tương ứng, active state `bg-emerald-500 text-white` | |
| 128 | ING_U_10 | Grid view layout | Grid: card view với nutrition details đầy đủ (Cal/Pro/Carbs/Fat) | |
| 129 | ING_U_11 | List view layout — Desktop | Table với columns: Tên/Calo/Protein/Carbs/Fat/Thao tác | |
| 130 | ING_U_12 | List view layout — Mobile | Simplified list với tên + nutrition tóm tắt + action buttons | |
| 131 | ING_U_13 | Sort dropdown | 6 options: Tên A-Z/Z-A, Calo ↑/↓, Protein ↑/↓ | |
| 132 | ING_U_14 | Sort + Search kết hợp | Search "gà" + Sort "Calo ↑" → kết quả filter + sorted đúng thứ tự | |

### E3. View Detail Modal — Nguyên liệu

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 133 | ING_V_01 | Click card (Grid) → mở View Detail Modal | Click vào card nguyên liệu trong grid view → modal hiển thị với title "Chi tiết nguyên liệu", icon Apple lớn, tên + unit + 5 nutrition metrics | |
| 134 | ING_V_02 | Click row (List Desktop) → mở View Detail Modal | Click table row → modal tương tự, hiển thị đầy đủ thông tin | |
| 135 | ING_V_03 | Click row (List Mobile) → mở View Detail Modal | Tap item trong mobile list → modal bottom sheet hiển thị | |
| 136 | ING_V_04 | Nút Edit (icon) trên header modal | Header có icon Edit3 bên cạnh nút X. Click → đóng view modal + mở form edit (pre-filled dữ liệu) | |
| 137 | ING_V_05 | Nút "Chỉnh sửa nguyên liệu" ở footer | Button full-width `bg-emerald-500` ở footer modal. Click → đóng view modal + mở form edit | |
| 138 | ING_V_06 | Backdrop click → đóng modal | Click overlay bên ngoài → `setViewingIngredient(null)` | |
| 139 | ING_V_07 | "Dùng trong" danh sách | NL dùng trong các món ăn → hiển thị danh sách tag chips với tên món. NL không dùng → không hiện section này | |

### E4. View Detail ↔ Edit Navigation — Nguyên liệu

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 140 | ING_VE_01 | Edit từ View → đóng Edit không thay đổi → quay lại View | View Detail → click Edit → edit modal mở (cameFromView=true) → KHÔNG sửa gì → click X → edit đóng → View Detail mở lại (data gốc) | |
| 141 | ING_VE_02 | Edit từ View → thay đổi data → click X → Unsaved dialog hiện | View Detail → Edit → sửa tên/nutrition → click X → dialog "Thay đổi chưa lưu" hiện 3 nút: Lưu & quay lại / Bỏ thay đổi / Ở lại chỉnh sửa | |
| 142 | ING_VE_03 | Unsaved dialog → "Lưu & quay lại" | Click "Lưu & quay lại" → `onUpdate(savedIng)` → edit đóng → View Detail mở lại với data MỚI | Validation fail → quay lại edit |
| 143 | ING_VE_04 | Unsaved dialog → "Bỏ thay đổi" | Click "Bỏ thay đổi" → KHÔNG lưu → edit đóng → View Detail mở lại với data CŨ | |
| 144 | ING_VE_05 | Unsaved dialog → "Ở lại chỉnh sửa" | Click "Ở lại chỉnh sửa" → dialog đóng → giữ nguyên edit modal, form data không mất | |
| 145 | ING_VE_06 | Lưu thành công từ Edit → quay lại View | Edit form → click "Lưu nguyên liệu" → `onUpdate` + edit đóng → View Detail mở lại với data mới (cameFromView=true) | |

### E5. Mobile Back Gesture — Nguyên liệu

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 146 | ING_BK_01 | Back gesture trên View Detail → đóng modal | Mở View Detail → browser back / Android back → modal đóng, quay về danh sách. Không rời trang. | |
| 147 | ING_BK_02 | Back gesture trên Edit (cameFromView, no changes) → quay View | View → Edit → back → Edit đóng → View Detail mở lại (data gốc) | |
| 148 | ING_BK_03 | Back gesture trên Edit (cameFromView, có changes) → unsaved dialog | View → Edit → sửa data → back → dialog "Thay đổi chưa lưu" hiện | |
| 149 | ING_BK_04 | Back gesture trên unsaved dialog → dismiss dialog | Dialog hiện → back → dialog đóng, giữ edit modal | |

---

## PHẦN F: LUỒNG QUẢN LÝ MÓN ĂN (20 TCs)

### F1. CRUD Món ăn

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 133 | DSH_C_01 | Mở modal "Tạo món ăn mới" | Title đúng, form trống, tags=[], selectedIngredients=[] | |
| 134 | DSH_C_02 | Chọn/bỏ tag bữa | Toggle 3 tags: Sáng/Trưa/Tối — active `bg-emerald-500 text-white` | |
| 135 | DSH_C_02b | Tag bắt buộc — label có dấu * đỏ | Label "Phù hợp cho bữa" có `<span className="text-rose-500">*</span>` | |
| 136 | DSH_C_02c | Validation tag khi submit không chọn | Submit với tags=[] → hiển thị error đỏ "Vui lòng chọn ít nhất một bữa ăn phù hợp" | Critical |
| 137 | DSH_C_02d | Clear error khi chọn tag | User chọn 1 tag → error message biến mất | |
| 138 | DSH_C_03 | Thêm NL từ danh sách | Click NL → thêm vào "Đã chọn" với amount=100. Click NL đã chọn → KHÔNG thêm trùng | Edge: duplicate check |
| 139 | DSH_C_04 | Tìm kiếm NL trong modal | Input filter NL realtime | |
| 140 | DSH_C_05 | Stepper +10 / -10 | "+" → amount+10, "-" → Math.max(0.1, amount-10) | |
| 141 | DSH_C_06 | Nhập trực tiếp amount | Type số → `Math.max(0.1, Number(value) \|\| 0.1)` | Edge: NaN, 0, negative |
| 142 | DSH_C_07 | Xóa NL khỏi danh sách chọn | Click trash icon → NL biến mất, "Chưa chọn nguyên liệu" nếu rỗng | |
| 143 | DSH_C_08 | Submit validation — name + NL + tags | `!name \|\| selectedIngredients.length === 0 \|\| tags.length === 0` → không submit | Edge: thiếu field |
| 144 | DSH_C_09 | Submit thành công — tạo mới | `onAdd(dishData)` với id=`dish-{timestamp}`, có tags | |
| 145 | DSH_C_10 | Chọn NL → biến mất khỏi picker | Chọn "Trứng gà" → "Trứng gà" không còn trong danh sách picker, chỉ hiện trong "Đã chọn" | |
| 146 | DSH_C_11 | Xóa NL đã chọn → hiện lại trong picker | Xóa "Trứng gà" khỏi "Đã chọn" → "Trứng gà" xuất hiện lại trong danh sách picker | |
| 147 | DSH_C_12 | Chọn tất cả NL → empty state picker | Chọn hết 12 NL → picker hiển thị "Đã chọn tất cả nguyên liệu" | Edge: 0 available |
| 148 | DSH_C_13 | Search + đã chọn kết hợp | "Ức gà" đã chọn → search "gà" → chỉ hiện "Trứng gà". Search "xyz" → "Không tìm thấy nguyên liệu" | |
| 149 | DSH_R_01 | Mở modal sửa món | Pre-fill name, tags (spread copy), ingredients (spread copy) | |
| 150 | DSH_R_02 | Sửa thành công | `onUpdate(dishData)` → card cập nhật | |
| 151 | DSH_D_01 | Xóa món không dùng | ConfirmationModal "Xóa món ăn?" → "Xóa ngay" → món biến mất | |
| 152 | DSH_D_02 | Xóa món đang dùng trong plan | `isDishUsed(id)=true` → toast warning "Không thể xóa" | |

### F2. UI/UX Món ăn

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 149 | DSH_U_01 | Tag filter chips | "Tất cả (X)" + 3 tag chips với counter — toggle filter | |
| 150 | DSH_U_02 | Filter + Search kết hợp | Search "gà" + filter "Trưa" → chỉ hiện món có cả 2 điều kiện | |
| 151 | DSH_U_03 | Card hiển thị NL count + nutrition | "3 nguyên liệu", Calories 332, Protein 25g | |
| 152 | DSH_U_04 | Card hiển thị tag labels | "🌅 Sáng", "🌤️ Trưa" — flex wrap | |
| 153 | DSH_U_05 | Empty state search | "Không tìm thấy món ăn" + "Thử tìm kiếm với từ khóa khác." | |
| 153b | DSH_U_05b | Search clear → hiện lại danh sách | Nhập "xyz" → empty state → xóa ô search → danh sách đầy đủ hiện lại | |
| 154 | DSH_U_06 | Empty state no data | "Chưa có món ăn nào" + CTA "Tạo món ăn" | |
| 155 | DSH_U_07 | Layout Switcher toggle | Click Grid/List icon → layout thay đổi tương ứng, active state `bg-emerald-500 text-white` | |
| 156 | DSH_U_08 | Grid view layout | Grid: 1 col mobile, 2 col sm, 3 col lg — card view với nutrition + tags | |
| 157 | DSH_U_09 | List view layout — Desktop | Table với columns: Tên/Tags/Calo/Protein/Thao tác | |
| 158 | DSH_U_10 | List view layout — Mobile | Simplified list với tên + nutrition tóm tắt + action buttons | |
| 159 | DSH_U_11 | Sort dropdown | 8 options: Tên A-Z/Z-A, Calo ↑/↓, Protein ↑/↓, Số NL ↑/↓ | |
| 160 | DSH_U_12 | Sort + Filter + Tag kết hợp | Tag "Sáng" + Search "gà" + Sort "Protein ↓" → kết quả đúng | |

### F3. View Detail Modal — Món ăn

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 161 | DSH_V_01 | Click card (Grid) → mở View Detail Modal | Click vào card món ăn trong grid view → modal hiển thị với title "Chi tiết món ăn", icon ChefHat lớn, tên + số NL + tags badges + 4 nutrition metrics + danh sách nguyên liệu chi tiết | |
| 162 | DSH_V_02 | Click row (List Desktop) → mở View Detail Modal | Click table row → modal tương tự, hiển thị đầy đủ thông tin | |
| 163 | DSH_V_03 | Click row (List Mobile) → mở View Detail Modal | Tap item trong mobile list → modal bottom sheet hiển thị | |
| 164 | DSH_V_04 | Nút Edit (icon) trên header modal | Header có icon Edit3 bên cạnh nút X. Click → đóng view modal + mở form edit (pre-filled dữ liệu) | |
| 165 | DSH_V_05 | Nút "Chỉnh sửa món ăn" ở footer | Button full-width `bg-emerald-500` ở footer modal. Click → đóng view modal + mở form edit | |
| 166 | DSH_V_06 | Backdrop click → đóng modal | Click overlay bên ngoài → `setViewingDish(null)` | |
| 167 | DSH_V_07 | Danh sách nguyên liệu chi tiết | Mỗi NL hiển thị: icon Apple + tên + lượng + đơn vị. NL bị xóa (orphan) → skip, không crash | Edge: orphan ingredient |

### F4. View Detail ↔ Edit Navigation — Món ăn

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 168 | DSH_VE_01 | Edit từ View → đóng Edit không thay đổi → quay lại View | View Detail → click Edit → edit modal mở (cameFromView=true) → KHÔNG sửa gì → click X → edit đóng → View Detail mở lại (data gốc) | |
| 169 | DSH_VE_02 | Edit từ View → thay đổi data → click X → Unsaved dialog hiện | View Detail → Edit → sửa tên/tags/NL → click X → dialog "Thay đổi chưa lưu" hiện 3 nút: Lưu & quay lại / Bỏ thay đổi / Ở lại chỉnh sửa | |
| 170 | DSH_VE_03 | Unsaved dialog → "Lưu & quay lại" | Click "Lưu & quay lại" → `onUpdate(dishData)` → edit đóng → View Detail mở lại với data MỚI | Validation fail → quay lại edit |
| 171 | DSH_VE_04 | Unsaved dialog → "Bỏ thay đổi" | Click "Bỏ thay đổi" → KHÔNG lưu → edit đóng → View Detail mở lại với data CŨ | |
| 172 | DSH_VE_05 | Unsaved dialog → "Ở lại chỉnh sửa" | Click "Ở lại chỉnh sửa" → dialog đóng → giữ nguyên edit modal, form data không mất | |
| 173 | DSH_VE_06 | Lưu thành công từ Edit → quay lại View | Edit form → click "Lưu món ăn" → `onUpdate` + edit đóng → View Detail mở lại với data mới (cameFromView=true) | |

### F5. Mobile Back Gesture — Món ăn

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 174 | DSH_BK_01 | Back gesture trên View Detail → đóng modal | Mở View Detail → browser back / Android back → modal đóng, quay về danh sách. Không rời trang. | |
| 175 | DSH_BK_02 | Back gesture trên Edit (cameFromView, no changes) → quay View | View → Edit → back → Edit đóng → View Detail mở lại (data gốc) | |
| 176 | DSH_BK_03 | Back gesture trên Edit (cameFromView, có changes) → unsaved dialog | View → Edit → sửa data → back → dialog "Thay đổi chưa lưu" hiện | |
| 177 | DSH_BK_04 | Back gesture trên unsaved dialog → dismiss dialog | Dialog hiện → back → dialog đóng, giữ edit modal | |

---

## PHẦN G: LUỒNG ĐI CHỢ (16 TCs)

### G1. Grocery List Logic

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 152 | GRC_L_01 | Scope "Hôm nay" | Chỉ collect NL từ `currentPlan` | |
| 153 | GRC_L_02 | Scope "Tuần này" | T2→CN: filter `dayPlans` trong range | |
| 154 | GRC_L_03 | Scope "Tất cả" | Toàn bộ `dayPlans` | |
| 155 | GRC_L_04 | Gộp NL trùng tên | 2 bữa đều có Ức gà 200g → hiện 1 dòng "Ức gà 400g" | Edge: aggregation |
| 156 | GRC_L_05 | Sort A-Z | `Object.values(map).sort((a, b) => a.name.localeCompare(b.name))` | |
| 157 | GRC_L_06 | Empty state — hôm nay trống, tuần có data | Hôm nay empty → check nếu tuần cũng empty → mới hiện EmptyState CTA | |
| 158 | GRC_L_07 | NL bị xóa khỏi thư viện | `allIngredients.find()` return undefined → skip, không crash | Edge: orphan |
| 159 | GRC_L_08 | Dish bị xóa khỏi thư viện | `allDishes.find()` return undefined → skip, không crash | Edge: orphan |

### G2. Grocery UI/UX

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 160 | GRC_U_01 | 3 scope tabs | "Hôm nay" / "Tuần này" / "Tất cả" — active `bg-white text-emerald-600 shadow-sm` | |
| 161 | GRC_U_02 | Checkbox toggle | Click item → checked (✅ emerald, line-through), click lại → uncheck | |
| 162 | GRC_U_03 | Progress bar + counter | "Đã mua 2/5" + progress bar emerald | |
| 163 | GRC_U_04 | All checked → celebration | "Đã mua đủ tất cả nguyên liệu! 🎉" footer emerald | |
| 164 | GRC_U_05 | Copy to clipboard | Click copy → format text "✅/☐ Tên — Xg" → toast success | |
| 165 | GRC_U_06 | Share (native) | `navigator.share` nếu có, fallback → copy | |
| 160 | GRC_U_07 | Chuyển scope → reset checked | `setCheckedIds(new Set())` khi switch scope | |
| 161 | GRC_U_08 | Amount hiển thị rounded | `Math.round(item.amount)` | |

---

## PHẦN H: LUỒNG AI PHÂN TÍCH HÌNH ẢNH (18 TCs)

### H1. Upload & Camera

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 162 | AI_U_01 | Tải ảnh từ file | Input file → FileReader → base64 → preview hiển thị | |
| 163 | AI_U_02 | Chụp ảnh từ camera | `getUserMedia` → video preview → "Chụp" → canvas capture → base64. **Android**: App phải khai báo CAMERA permission trong AndroidManifest | |
| 164 | AI_U_03 | Camera bị từ chối quyền — platform-specific | **Android**: "Không thể truy cập camera. Trên Android, hãy vào Cài đặt > Ứng dụng > Smart Meal Planner > Quyền > bật Camera." **Trình duyệt**: "Kiểm tra biểu tượng ổ khóa trên thanh địa chỉ" | Edge: permission denied |
| 165 | AI_U_04 | Dán ảnh (Ctrl+V / Cmd+V) | `paste` event listener → clipboard image → base64 | |
| 166 | AI_U_05 | "Chọn ảnh khác" | Reset image, clear result | |
| 167 | AI_U_06 | Nút "Phân tích" disabled khi chưa có ảnh | `disabled` khi `!image` | |
| 167b | AI_U_07 | Thiết bị không hỗ trợ camera | `navigator.mediaDevices` undefined → hiển thị "Thiết bị không hỗ trợ camera. Vui lòng sử dụng tính năng Tải ảnh lên" | Edge: WebView cũ |
| 167c | AI_U_08 | Android CAMERA permission trong Manifest | `<uses-permission android:name="android.permission.CAMERA"/>` + `<uses-feature android:name="android.hardware.camera" android:required="false"/>` | Config |

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
| 180 | AI_S_10 | Tags UI — 3 nút chọn bữa ăn | Khi `saveDish=true`, hiển thị 3 nút "🌅 Sáng", "🌤️ Trưa", "🌙 Tối" với label có dấu `*` đỏ. Toggle active → `bg-emerald-500 text-white` | |
| 181 | AI_S_11 | Tags validation — không chọn tag khi lưu | `saveDish=true` + `dishTags=[]` + click Xác nhận → hiển thị error đỏ "Vui lòng chọn ít nhất một bữa ăn phù hợp", KHÔNG đóng modal | Critical |
| 182 | AI_S_12 | Tags error clear khi chọn tag | User chọn 1 tag → error message biến mất (`setTagError(null)`) | |
| 183 | AI_S_13 | Tags truyền qua payload | `saveDish=true` + chọn Sáng+Tối → `payload.tags = ['breakfast', 'dinner']` → món ăn mới có tags đúng | |
| 184 | AI_S_14 | Tags không bắt buộc khi chỉ lưu NL | `saveDish=false` → không cần chọn tag, confirm thành công → `payload.tags = undefined` | |

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

## PHẦN J: ERROR HANDLING & NOTIFICATION (16 TCs)

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
| 203 | NOT_06 | Toast action button | Toast có `action` prop → hiển thị button underline dưới message (ví dụ "Xem chi tiết"). Click → `action.onClick()` + dismiss. `e.stopPropagation()` để không trigger toast onClick | |
| 204 | NOT_07 | Toast position responsive | Mobile: top, `top-[env(safe-area-inset-top)]`, full-width `left-0 right-0 p-3`. Desktop: `sm:bottom-6 sm:right-6`, max-w-sm | |
| 205 | NOT_08 | Toast close button (X) | Mỗi toast có nút X nhỏ góc phải. Click X → dismiss ngay lập tức. `e.stopPropagation()` tránh trigger onClick handler của toast | |
| 206 | NOT_09 | Keyboard accessibility trên clickable toast | Toast có onClick → `role="button"`, `tabIndex={0}`. Nhấn Enter hoặc Space → trigger `handleClick()` + dismiss | Edge: a11y |
| 207 | NOT_10 | Import validation per-key | Import file có 4 keys, 1 key sai format (ví dụ `mp-ingredients` chứa string thay vì array) → key đó bị skip + toast warning "Dữ liệu không hợp lệ — Bỏ qua 'mp-ingredients' do sai format", các key hợp lệ vẫn import thành công | Edge: partial import |

---

## PHẦN K: DATA MIGRATION & EDGE CASES (9 TCs)

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 203 | MIG_00 | Init data — tất cả món ăn phải có tags ≥ 1 | `initialDishes` trong `initialData.ts`: mỗi món đều có `tags` là mảng không rỗng (ví dụ `['breakfast']`, `['lunch','dinner']`). Không được có `tags: []` hoặc thiếu field `tags` | Critical — data integrity |
| 204 | MIG_01 | migrateDishes — tags trống/thiếu → default 'lunch' | Dữ liệu cũ trong localStorage thiếu `tags` hoặc `tags: []` → tự gán `tags: ['lunch']` (default). Logic: `Array.isArray(rawTags) && rawTags.length > 0 ? rawTags : ['lunch']` | |
| 204 | MIG_02 | migrateDayPlans — old format | Dữ liệu có `breakfastId` thay vì `breakfastDishIds` → tạo empty plan | |
| 205 | MIG_03 | Persist migrated data — detect empty tags | `useEffect` detect `needsMigration` (bao gồm `tags.length === 0`) → `setDishes(dishes)` → ghi lại localStorage | |
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

## PHẦN M: DARK MODE / THEME SWITCHER (8 TCs)

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 223 | THEME_01 | Mặc định theme = `system` | App mở lần đầu (chưa có `mp-theme` trong localStorage) → theme = `system`, icon Monitor hiển thị trên header. Dark/light tùy thuộc OS preference `prefers-color-scheme` | |
| 224 | THEME_02 | Cycle theme: light → dark → system | Click nút theme → cycle qua 3 mode: light (Sun icon) → dark (Moon icon) → system (Monitor icon) → light... Mỗi lần click, UI thay đổi ngay lập tức | |
| 225 | THEME_03 | Persist theme vào localStorage | Chọn dark mode → `localStorage.setItem('mp-theme', 'dark')`. Reload trang → theme vẫn là dark. Xóa `mp-theme` → fallback về `system` | |
| 226 | THEME_04 | Dark mode — class `dark` trên `<html>` | Theme = dark → `document.documentElement.classList.add('dark')`. Background `bg-slate-950`, text `text-slate-100`, cards `bg-slate-800`, borders `border-slate-700` | |
| 227 | THEME_05 | System mode — auto-detect OS preference | Theme = system + OS dark mode → app dark. Thay đổi OS setting (macOS Appearance) → app auto cập nhật nhờ `matchMedia('prefers-color-scheme: dark')` change listener | Edge: realtime OS change |
| 228 | THEME_06 | Tooltip/aria-label thay đổi theo theme | `aria-label="Chế độ hiển thị: Sáng"`, `title="Sáng — nhấn để đổi"`. Dark → "Tối — nhấn để đổi". System → "Theo hệ thống — nhấn để đổi" | |
| 229 | THEME_07 | Dark mode áp dụng toàn bộ UI | Tất cả modals, cards, toasts, inputs, navigation, dropdowns đều có `dark:` variants. Kiểm tra: modal overlay `dark:bg-slate-800`, toast `dark:bg-slate-800 dark:border-*`, input `dark:bg-slate-800 dark:text-slate-100` | |
| 230 | THEME_08 | localStorage fail → fallback system | `localStorage.getItem` throw (private browsing) → catch → default `system`. `localStorage.setItem` fail → catch → app vẫn hoạt động (state in memory) | Edge: storage blocked |

---

## PHẦN N: LAZY LOADING & CODE SPLITTING (5 TCs)

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 231 | LAZY_01 | Tab Grocery/AI dùng conditional render | `{activeMainTab === 'grocery' && <Suspense>...<GroceryList/></Suspense>}`. Rời tab → component unmount hoàn toàn. Quay lại → re-mount mới | |
| 232 | LAZY_02 | Tab Calendar/Management dùng hidden/block | `<div className={activeMainTab === 'calendar' ? 'block' : 'hidden'}>`. Component luôn mount, giữ state khi switch tab (search query, scroll position, form data) | |
| 233 | LAZY_03 | Loading fallback hiển thị | Lần đầu click tab Grocery hoặc AI → `TabLoadingFallback` hiển thị: spinner animate-spin + text "Đang tải..." cho đến khi lazy chunk load xong | |
| 234 | LAZY_04 | Chuyển tab nhanh liên tục | Click Grocery → AI → Calendar → Grocery nhanh liên tục → không crash, không double render, Suspense boundary không bị stuck | Edge: race condition |
| 235 | LAZY_05 | Network chậm → fallback kéo dài | Throttle network (Slow 3G) → click tab AI → fallback spinner hiển thị lâu hơn → chunk load xong → content hiện. Không timeout error | Edge: slow network |

---

## PHẦN O: IMAGE COMPRESSION (4 TCs)

| # | ID | Tên | Mô tả chi tiết | Edge Case |
|---|-----|------|----------------|-----------|
| 236 | IMG_C_01 | Upload ảnh lớn → compress | Upload ảnh >2MB, kích thước >2000px → `compressImage()` resize về ≤ 1024x1024 (giữ tỷ lệ), convert JPEG quality 0.8. Ảnh preview nhỏ hơn ảnh gốc đáng kể | |
| 237 | IMG_C_02 | Camera capture → compress | Chụp ảnh từ camera → canvas capture → `compressImage()` trước khi set vào state `image`. Preview hiển thị ảnh đã compress | |
| 238 | IMG_C_03 | Paste từ clipboard → compress | Ctrl+V/Cmd+V ảnh → `compressImage()` xử lý. Nếu compress thành công → set ảnh compressed. Nếu fail → fallback dùng ảnh gốc (try-catch trong paste handler) | Edge: compress fail fallback |
| 239 | IMG_C_04 | Canvas context fail → fallback | `canvas.getContext('2d')` return null → `compressImage()` reject với error "Failed to get canvas context" → caller catch → dùng ảnh gốc, app không crash | Edge: canvas unsupported |

---

## TÓM TẮT

| Phần | Module | Số TC |
|------|--------|-------|
| A | Navigation & Layout (A1~A5) | 22 |
| B | Calendar — Chọn ngày | 36 |
| C | Calendar — Kế hoạch bữa ăn | 39 |
| D | Dinh dưỡng & Mục tiêu | 18 |
| E | Quản lý Nguyên liệu (E1~E5) | 41 |
| F | Quản lý Món ăn (F1~F5) | 40 |
| G | Đi chợ | 16 |
| H | AI Phân tích | 25 |
| I | Data Backup & Persistence | 12 |
| J | Error Handling & Notification (J1~J2) | 16 |
| K | Data Migration & Edge Cases | 9 |
| L | Responsive & UI/UX | 12 |
| M | Dark Mode / Theme Switcher | 8 |
| N | Lazy Loading & Code Splitting | 5 |
| O | Image Compression | 4 |
| **TỔNG** | | **303** |        

### So sánh với V1 (41 TCs)

| Metric | V1 | V2 | Mới thêm |
|--------|-----|-----|---------|
| Navigation | 4 | 22 | +18 (badge detail, DOM structure, responsive, management sub-tabs) |
| Calendar | 8 | 71 | +63 (week view 7-ngày, AI Preview Modal với AbortController, Regenerate/Edit/Checkbox, month/year boundaries) |
| Management | 15 | 61 | +46 (inline validation, required tag với error, AI error với tên NL, Layout Switcher Grid/List, Sort dropdown) |
| Grocery | 3 | 16 | +13 (aggregation, copy, share, scope reset, orphan refs) |
| AI | 4 | 20 | +16 (camera Android permission, paste, save modal detail, AI Research, mediaDevices check) |
| Nutrition | 0 | 18 | +18 (calculation units, tips logic, progress bar colors) |
| Data/Error | 3 + 4 = 7 | 36 | +29 (migration, persistence edge, notification advanced, toast a11y) |
| Responsive | 4 | 12 | +8 (modal variants, scrollbar, card layout) |
| Dark Mode | 0 | 8 | +8 (3-mode cycling, persist, system auto-detect, dark class toggle) |
| Performance | 0 | 9 | +9 (lazy loading, code splitting, image compression) |
| **TỔNG** | **41** | **273** | **+232 TCs** |

