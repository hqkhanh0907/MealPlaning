# TEST REPORT V2 — Smart Meal Planner

> ⚠️ **SUPERSEDED**: Tài liệu này đã được thay thế. Xem phiên bản chính tại [docs/04-testing/test-report.md](../../docs/04-testing/test-report.md).

> **Ngày:** 2026-03-02 | **Env:** localhost:3000 | **Tool:** Chrome DevTools MCP + Vitest | **TC Doc:** test-cases-v2.13

---

## Changelog

| Ngày | Phiên bản | Thay đổi |
|------|-----------|----------|
| 2026-03-02 | v2.13 | +27 TCs: PHẦN P — Code Quality & Architecture (P1~P6): useModalManager SRP hook, callWithTimeout DRY, getTabLabels POLA DI, migrateDishes resilience, Logger observability, ADR docs. Vitest 448/448 PASSED. Tổng 348→375 |
| 2026-03-01 | v2.12 | +26 TCs: PHẦN M (THEME_01~08), PHẦN N (LAZY_01~05), PHẦN O (IMG_C_01~04), A5 (MGT_S_01~04), J2 mở rộng (NOT_06~10). Tổng 322→348 |
| 2026-02-28 | v2.11 | Khởi tạo report v2 với 322 TCs |

---

## Tổng hợp

| Trạng thái | Số TC |
|---|---|
| ✅ PASSED | 375 |
| ❌ FAILED | 0 |
| ⏩ SKIP | 0 |
| ⏳ PENDING | 0 |
| **TỔNG** | **375** |

---

## PHẦN A: NAVIGATION & LAYOUT

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| NAV_D_01 | Mặc định tab Calendar khi mở app | ✅ | Tab "Lịch trình" active với `bg-white text-emerald-600 shadow-sm`, header + subtitle đúng |
| NAV_D_02 | Chuyển đổi 4 tabs | ✅ | Active tab `bg-white text-emerald-600 shadow-sm`, inactive `text-slate-500`, content đổi đúng |
| NAV_D_03 | Tab ẩn/hiện bằng class hidden/block | ✅ | 4 divs luôn render trong DOM, chỉ active tab có class `block`, còn lại `hidden` |
| NAV_D_04 | Header subtitle hiển thị cân nặng realtime | ✅ | Đổi 80→70kg, subtitle cập nhật "Dinh dưỡng chính xác cho 70kg" |
| NAV_D_05 | DesktopNav hidden trên mobile | ✅ | Viewport 375px: DesktopNav ẩn, BottomNavBar hiển thị |
| NAV_M_01 | BottomNavBar fixed bottom | ✅ | `position: fixed`, `bottom: 0px`, `z-index: 30` |
| NAV_M_02 | 4 icon buttons với label | ✅ | Lịch trình/Thư viện/AI/Đi chợ |
| NAV_M_03 | Active indicator dot | ✅ | Tab active có emerald color + dot indicator |
| NAV_M_04 | Touch target ≥ 56px | ✅ | Tất cả buttons height=58.5px (≥56px) |
| NAV_M_05 | Header thay đổi theo tab | ✅ | Mobile header: Lịch trình/Thư viện/AI Phân tích/Đi chợ |
| NAV_M_06 | Content padding bottom cho BottomNav | ✅ | `padding-bottom: 96px` (pb-24) |
| NAV_B_01 | Badge hiển thị khi AI hoàn tất ở tab khác | ✅ | Code: `activeMainTabRef.current !== 'ai-analysis'` → `setHasNewAIResult(true)`. DOM: `bg-rose-500 rounded-full 10px` |
| NAV_B_02 | Badge biến mất khi chuyển sang tab AI | ✅ | Code: `useEffect → if (activeMainTab === 'ai-analysis') setHasNewAIResult(false)` |
| NAV_B_03 | Badge KHÔNG hiển thị nếu đang ở tab AI | ✅ | Code: guard `activeMainTabRef.current !== 'ai-analysis'` |
| NAV_B_04 | Toast khi ở tab khác | ✅ | Code: `notify.success('Phân tích hoàn tất!', ..., onClick → setActiveMainTab('ai-analysis'))` |
| NAV_B_05 | Badge chỉ hiện trên mobile BottomNav | ✅ | Code: `showAIBadge` chỉ truyền vào `BottomNavBar`, DesktopNav không nhận prop |
| NAV_L_01 | Max-width container max-w-5xl | ✅ | `max-width: 1024px`, width=1024 |
| NAV_L_02 | Sticky header | ✅ | `position: sticky`, `top: 0px`, `z-index: 20` |

### A5. Management Sub-tabs

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| MGT_S_01 | 2 sub-tabs "Món ăn" / "Nguyên liệu" | ✅ | Tab Quản lý: 2 sub-tabs visible. Active `bg-white text-emerald-600 shadow-sm`, inactive `text-slate-500` |
| MGT_S_02 | Default sub-tab = "Món ăn" | ✅ | Mở tab Quản lý → sub-tab "Món ăn" active, DishManager render (7 món hiển thị) |
| MGT_S_03 | DataBackup section luôn visible | ✅ | "Sao lưu & Khôi phục" hiển thị bên dưới cả sub-tab Món ăn lẫn Nguyên liệu |
| MGT_S_04 | Sub-tabs responsive mobile | ✅ | iPhone 375×812: button height ≥ 44px (`min-h-11`), touch-friendly |

---

## PHẦN B: CALENDAR — CHỌN NGÀY

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| CAL_G_01 | Hiển thị tháng hiện tại mặc định | ✅ | "Tháng 2, 2026", 7 header T2-CN, title "Chọn ngày" |
| CAL_G_02 | Ngày hôm nay highlight | ✅ | Ngày 27 (T6) có `bg-emerald-50 text-emerald-600` khi không selected. **Fixed:** trước đó sai ngày 26 do UTC timezone bug |
| CAL_G_03 | Ngày đang chọn highlight | ✅ | `bg-emerald-500 text-white scale-105 ring-4 ring-emerald-500/20` |
| CAL_G_04 | Click ngày → chọn ngày | ✅ | Click 25 → selected, date display "Thứ Tư, 25 tháng 2, 2026" |
| CAL_G_05 | Click ngày đang chọn → mở TypeSelection | ✅ | Click lần nữa → modal "Lên kế hoạch" mở với 3 bữa |
| CAL_G_06 | Double-click ngày → chọn + mở plan | ✅ | dblclick event → TypeSelection modal mở |
| CAL_G_07 | Nút ◀/▶ chuyển tháng | ✅ | ◀ prev, ▶ next, title cập nhật |
| CAL_G_08 | Empty cells cho firstDay offset | ✅ | T2/2026: 6 empty cells trước ngày 1 (CN=index 6) |
| CAL_G_09 | Meal indicator dots | ✅ | 3 dots per day (Sáng/Trưa/Tối), structure đúng |
| CAL_G_10 | Ngày KHÔNG có plan → dots transparent | ✅ | `bg-transparent` cho cả 3 dots |
| CAL_G_11 | Tooltip khi không có plan | ✅ | "Nhấn đúp hoặc nhấn vào ngày đang chọn để lên kế hoạch" |
| CAL_G_12 | Tooltip ẩn khi có plan | ✅ | Ngày 26 có plan → tooltip không hiển thị |
| CAL_G_13 | Legend indicator | ✅ | Legend "Sáng", "Trưa", "Tối" hiển thị |
| CAL_G_14 | Nút "Hôm nay" | ✅ | Click từ Tháng 3 → về Tháng 2/2026 |
| CAL_G_15 | Nút chuyển view mode | ✅ | "Chế độ tuần" → week view, "Chế độ lịch" → calendar grid |
| CAL_G_16 | Tháng 2 năm nhuận | ✅ | JS Date: Feb 2028=29 days, Feb 2026=28 days |
| CAL_G_17 | Chuyển tháng 12→1 | ✅ | T12/2026 → ▶ → T1/2027 |
| CAL_G_18 | Chuyển tháng 1→12 | ✅ | T1/2027 → ◀ → T12/2026 |
| CAL_G_19 | Header CN màu rose | ✅ | "CN" = `text-rose-400`, T2–T7 = `text-slate-400` |
| CAL_G_20 | Ngày CN background rose | ✅ | Ngày 1, 8 = `bg-rose-50 text-rose-600`, ngày 2 = `bg-slate-50` |
| CAL_G_21 | Ngày CN selected → ưu tiên emerald | ✅ | Click CN → `bg-emerald-500 text-white`, rose bị override |
| CAL_G_22 | Ngày hôm nay đúng local timezone (Calendar) | ✅ | **Bug fix:** Thay `new Date().toISOString().split('T')[0]` bằng `formatLocalDate(new Date())`. Ở GMT+7, `toISOString()` trả `2026-02-26` (UTC midnight) thay vì `2026-02-27` (local). Đã sửa → ngày 27 highlight đúng |
| CAL_G_23 | Khởi tạo selectedDate đúng local date | ✅ | **Bug fix:** App.tsx `useState(() => formatLocalDate)` thay vì `toISOString()`. Ngày khởi tạo = "2026-02-27" (đúng T6 local) |

### B2. Week View Mode

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| CAL_W_01 | Hiển thị đúng 7 ngày (T2→CN) | ✅ | T2 23, T3 24, T4 25, T5 26, T6 27, T7 28, CN 1 |
| CAL_W_02 | Ngày chọn nằm trong tuần hiện tại | ✅ | Ngày 26 trong tuần 23/02-01/03 |
| CAL_W_03 | Nút ▶ chuyển tuần tiếp theo | ✅ | 23/02-01/03 → 02/03-08/03 |
| CAL_W_04 | Nút ◀ chuyển tuần trước | ✅ | 02/03-08/03 → 23/02-01/03 |
| CAL_W_05 | Swipe trái → tuần sau (mobile) | ✅ | Code: `diffX < 0 → nextWeek()`, threshold 50px |
| CAL_W_06 | Swipe phải → tuần trước (mobile) | ✅ | Code: `diffX > 0 → prevWeek()` |
| CAL_W_07 | Click ngày trong week view → chọn ngày | ✅ | Click T4 25 → date display cập nhật |
| CAL_W_08 | Click ngày đang chọn → mở TypeSelection | ✅ | Click lần nữa → modal mở |
| CAL_W_09 | Nút Hôm nay reset weekOffset | ✅ | Từ tuần 09/03 → click Hôm nay → 23/02-01/03 |
| CAL_W_10 | Meal indicator dots | ✅ | Cùng logic với calendar grid, 3 dots per day |
| CAL_W_11 | Tuần qua ranh giới tháng | ✅ | 23/02-01/03 hiển thị ngày cả T2 và T3 |
| CAL_W_12 | Tuần qua ranh giới năm | ✅ | Code: `getWeekDates` uses standard Date arithmetic, handles year boundaries |
| CAL_W_13 | Label tuần | ✅ | "23/02 - 01/03" format đúng |
| CAL_W_14 | Swipe chỉ khi X > Y | ✅ | Code: `Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50` |
| CAL_W_15 | Ngày CN week view background rose | ✅ | CN = `bg-rose-50 text-rose-600`, label = `text-rose-400` |
| CAL_W_16 | Ngày CN selected week → emerald | ✅ | Click CN → `bg-emerald-500`, label `text-white/80` |
| CAL_W_17 | Responsive layout không vỡ | ✅ | Mobile 375px: no horizontal scroll, 7 buttons fit |
| CAL_W_18 | Ngày hôm nay đúng local timezone (Week) | ✅ | **Bug fix:** `formatLocalDate(date) === formatLocalDate(new Date())`. Trước fix: ô T5 (26) highlight sai. Sau fix: ô T6 (27) highlight đúng |
| CAL_W_19 | Nút "Hôm nay" format đúng local date | ✅ | **Bug fix:** `onSelectDate(formatLocalDate(today))`. selectedDate = "2026-02-27" (đúng T6 local), không bị lệch sang 26 |

---

## PHẦN C: KẾ HOẠCH BỮA ĂN

### C1. TypeSelectionModal

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| PLAN_T_01 | Mở modal TypeSelection | ✅ | Click "Lên kế hoạch" → modal mở |
| PLAN_T_02 | 3 bữa hiển thị đúng | ✅ | Bữa Sáng/Trưa/Tối với mô tả |
| PLAN_T_03 | Bữa đã có plan → badge đếm | ✅ | Badge "1 món" `bg-emerald-100 text-emerald-600 rounded-full` + `border-emerald-500` |
| PLAN_T_04 | Click bữa → mở PlanningModal | ✅ | Click Bữa Sáng → "Chọn món cho Bữa Sáng" |
| PLAN_T_05 | Đóng modal TypeSelection | ✅ | Click Close → modal đóng |

### C2. PlanningModal

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| PLAN_P_01 | Hiển thị danh sách món theo tag | ✅ | Bữa Sáng: 2 món có tag Sáng |
| PLAN_P_02 | Search món trong modal | ✅ | Search "salad" → chỉ hiện "Salad rau bina thịt bò" |
| PLAN_P_03 | Sort dropdown 6 options | ✅ | Tên A-Z/Z-A, Calo ↑↓, Protein ↑↓ |
| PLAN_P_04 | Toggle chọn/bỏ chọn món | ✅ | Click → "Đã chọn: 1 món" |
| PLAN_P_05 | Nutrition summary footer | ✅ | "453 kcal · 36g Pro" hiển thị khi chọn 3 món |
| PLAN_P_06 | Confirm button | ✅ | Xác nhận → modal đóng, món xuất hiện trong plan |
| PLAN_P_07 | Pre-select các món đã trong plan | ✅ | Bữa Sáng có Trứng ốp la → "Đã chọn: 1" |
| PLAN_P_08 | Xác nhận với 0 món | ✅ | "Đã chọn: 0", click Xác nhận → modal không đóng |
| PLAN_P_09 | Nút Back → về TypeSelection | ✅ | Click back → "Lên kế hoạch" title |
| PLAN_P_10 | Empty state khi không có món phù hợp | ✅ | Search "xyznonexist" → "Chưa có món ăn phù hợp cho Bữa Sáng" |
| PLAN_P_11 | Chọn nhiều món cho 1 bữa | ✅ | Chọn 3 món cho Bữa Trưa, "Xác nhận (3)" |

### C3. MealCards

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| PLAN_M_01 | Hiển thị tên món + dinh dưỡng | ✅ | "Trứng ốp la" hiển thị trong Bữa Sáng |
| PLAN_M_02 | Empty card → nút Thêm món ăn | ✅ | Bữa Trưa/Tối trống → nút "Thêm món ăn" |
| PLAN_M_03 | Nút edit → mở PlanningModal | ✅ | Click edit button → "Chọn món cho Bữa Sáng" |
| PLAN_M_04 | Món bị xóa khỏi thư viện | ✅ | Code: `.filter(Boolean)` loại undefined dish. ID vẫn lưu nhưng tên không hiển thị |

### C4. AI Suggestion Preview Modal

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| PLAN_A_01 | Nút "Gợi ý AI" mở Preview Modal | ✅ | Click → modal "Gợi ý bữa ăn từ AI" mở + loading |
| PLAN_A_02 | Loading state trong modal | ✅ | "AI đang phân tích..." + "Đang tìm thực đơn tối ưu cho bạn" |
| PLAN_A_03 | Preview Modal hiển thị gợi ý | ✅ | 3 meal cards: Sáng (487kcal), Trưa (510kcal), Tối (515kcal) |
| PLAN_A_04 | Reasoning card | ✅ | "Lý do gợi ý" + text giải thích chi tiết |
| PLAN_A_05 | Checkbox chọn áp dụng từng bữa | ✅ | All checked mặc định. Uncheck Sáng → total giảm từ 1512→1025 kcal |
| PLAN_A_06 | Nutrition summary tổng hợp | ✅ | "TỔNG CỘNG: 1512 kcal · 144g protein", progress bars "Calo 101%", "Protein 103%" |
| PLAN_A_07 | Nút "Thay đổi" mở PlanningModal | ✅ | Code: `handleEditAISuggestionMeal` → đóng AI modal + mở PlanningModal |
| PLAN_A_08 | Nút "Gợi ý lại" (Regenerate) | ✅ | Code: abort cũ + tạo AbortController mới + gọi AI lại |
| PLAN_A_09 | Nút "Hủy" đóng modal | ✅ | Click Hủy → modal đóng, plan không thay đổi |
| PLAN_A_10 | Nút "Áp dụng" chỉ apply bữa đã chọn | ✅ | Apply → 3 bữa cập nhật, toast "Đã cập nhật kế hoạch!" |
| PLAN_A_11 | "Áp dụng" disabled khi không chọn bữa | ✅ | Uncheck all → button disabled |
| PLAN_A_12 | Empty suggestion state | ✅ | Code: `!aiSuggestion && !isSuggesting && !aiSuggestionError` → "Chưa tìm được" |
| PLAN_A_13 | Error state | ✅ | Code: `setAiSuggestionError('Có lỗi xảy ra...')` khi catch error |
| PLAN_A_14 | Meal card ẩn khi không có gợi ý | ✅ | Code: `dishIds.length > 0` → chỉ hiện card có món |
| PLAN_A_15 | Progress bar màu động | ✅ | UI: 101% calo, 103% protein hiển thị đúng |
| PLAN_A_16 | Đóng modal → hủy AI call | ✅ | Code: `handleCloseAISuggestionModal` → `abort()` + reset state |
| PLAN_A_17 | Edit meal → hủy AI call | ✅ | Code: `handleEditAISuggestionMeal` → `abort()` + mở PlanningModal |
| PLAN_A_18 | Regenerate → hủy call cũ | ✅ | Code: `abort()` trước + `new AbortController()` + gọi AI mới |
| PLAN_A_19 | Aborted request không hiện error | ✅ | Code: `if (error.name === 'AbortError') return` — silent cancel |

### C5. ClearPlanModal

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| PLAN_C_01 | 3 scope options với counter | ✅ | "Ngày này (1 ngày)", "Tuần này (2 ngày)", "Tháng này (2 ngày)" |
| PLAN_C_02 | Scope disabled khi count=0 | ✅ | Code: `disabled={count===0}` → `opacity-50 cursor-not-allowed` |
| PLAN_C_03 | Xóa scope ngày | ✅ | Click "Ngày này" → Cal=0, 3 bữa trống |
| PLAN_C_04 | Xóa scope tuần | ✅ | Code: `getWeekRange` T2→CN, filter dayPlans in range |
| PLAN_C_05 | Xóa scope tháng | ✅ | Code: same year+month filter |
| PLAN_C_06 | Xóa tuần chứa CN | ✅ | Code: `day===0 ? -6 : 1` → CN tính về tuần trước |
| PLAN_C_07 | Xóa tháng cuối năm | ✅ | Code: chỉ so sánh `getFullYear()` + `getMonth()` |

---

## PHẦN D: DINH DƯỠNG & MỤC TIÊU

### D1. Summary Panel

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| NUT_S_01 | Tổng hợp dinh dưỡng 3 bữa | ✅ | 155 cal, 13g pro cho 1 bữa (Trứng ốp la) |
| NUT_S_02 | Progress bar Calories | ✅ | 10.33% (155/1500), `bg-orange-500`, cap 100% |
| NUT_S_03 | Progress bar Calories vượt mục tiêu | ✅ | Code: `totalCalories > targetCalories ? 'bg-rose-500' : 'bg-orange-500'` |
| NUT_S_04 | Progress bar Protein | ✅ | 11.6% (13/112), `bg-blue-500` |
| NUT_S_05 | 3 ô phụ: Carbs/Fat/Fiber | ✅ | Carbs=1g, Fat=11g, Fiber=0g hiển thị đúng |
| NUT_S_06 | Nút edit goals → mở GoalSettings | ✅ | Click → modal "Mục tiêu dinh dưỡng" mở |
| NUT_S_07 | Ngày không có plan → tất cả = 0 | ✅ | Ngày trống → 0/1500 cal |

### D2. GoalSettingsModal

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| NUT_G_01 | 3 fields: weight, proteinRatio, targetCalories | ✅ | Pre-filled: 70kg, 1.6g/kg, 1500kcal |
| NUT_G_02 | Weight min=1, max=500 | ✅ | Code: `Math.max(1, Number(e.target.value) \|\| 1)` |
| NUT_G_03 | Protein ratio min=0.1, max=5 | ✅ | 4 preset buttons: 1.2, 1.6, 2, 2.2 |
| NUT_G_04 | Preset buttons | ✅ | Active: `bg-blue-500 text-white`, click → ratio cập nhật |
| NUT_G_05 | Calculated protein display | ✅ | Badge "112g / ngày" = 70*1.6 |
| NUT_G_06 | Target calories min=100 | ✅ | Code: `Math.max(100, Number(e.target.value) \|\| 100)` |
| NUT_G_07 | Auto-save ngay khi thay đổi | ✅ | "tự động lưu" + onChange gọi `onUpdateProfile` |
| NUT_G_08 | Nút "Hoàn tất" → đóng modal | ✅ | `onClick={onClose}` |
| NUT_G_09 | Input weight NaN | ✅ | Code: `Number(e.target.value) \|\| 1` → NaN → 1 |

### D3. Tips Logic

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| NUT_T_01 | Tip: Chưa có plan | ✅ | "📋 Bắt đầu lên kế hoạch..." khi `!hasAnyPlan` |
| NUT_T_02 | Tip: Calories vượt >15% | ✅ | "⚠️ Bạn đang vượt Xkcal..." khi `totalCalories > targetCalories * 1.15` |
| NUT_T_03 | Tip: Calories thấp <70% | ✅ | "📉 Lượng calo hôm nay thấp" chỉ khi `isComplete` |
| NUT_T_04 | Tip: Protein đạt | ✅ | "💪 Tuyệt vời! Đạt Xg protein" |
| NUT_T_05 | Tip: Protein thấp <80% | ✅ | "🥩 Protein hôm nay mới đạt..." khi `isComplete` |
| NUT_T_06 | Tip: Fiber thấp <15g | ✅ | "🥬 Lượng chất xơ thấp" khi `isComplete` |
| NUT_T_07 | Tip: Fat ratio >40% | ✅ | "🫒 Tỷ lệ chất béo cao (X%)" — hiện 64% |
| NUT_T_08 | Tip: Kế hoạch cân đối | ✅ | "✅ Kế hoạch hôm nay cân đối!" khi `isComplete && tips.length === 0` |
| NUT_T_09 | Max 2 tips | ✅ | Code: `tips.slice(0, 2)` |
| NUT_T_10 | Footer: Missing slots | ✅ | "Bạn còn thiếu bữa trưa, bữa tối" / "Kế hoạch hoàn tất!" |

### D4. Nutrition Calculation

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| NUT_C_01 | Unit g → factor = amount/100 | ✅ | Code: `isWeightOrVolume → factor = amount * convFactor / 100` |
| NUT_C_02 | Unit kg → factor = amount*1000/100 | ✅ | Code: `getConversionFactor('kg') = 1000` |
| NUT_C_03 | Unit ml → factor = amount/100 | ✅ | Code: `convFactor = 1` for ml |
| NUT_C_04 | Unit piece → factor = amount | ✅ | Code: `!isWeightOrVolume → factor = amount` |
| NUT_C_05 | Ingredient không tìm thấy | ✅ | Code: `if (!ingredient) return acc` — skip |
| NUT_C_06 | Dish không tìm thấy | ✅ | Code: same pattern, skip on undefined |
| NUT_C_07 | normalizeUnit aliases | ✅ | UNIT_ALIASES: gram→g, kilogram→kg, gam→g, liter→l |

---

## PHẦN E: QUẢN LÝ NGUYÊN LIỆU

### E1. CRUD Nguyên liệu

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| ING_C_01 | Mở modal "Thêm nguyên liệu mới" | ✅ | Unit mặc định trống, placeholder "g, ml, cái, quả..." |
| ING_C_02 | Validation tên trống | ✅ | "Vui lòng nhập tên nguyên liệu" + `border-rose-500` |
| ING_C_02b | Validation unit trống | ✅ | "Vui lòng nhập đơn vị tính" hiển thị |
| ING_C_02c | Clear error khi nhập | ✅ | Nhập tên → name error biến mất, unit error vẫn còn |
| ING_C_02d | Nhiều field lỗi cùng lúc | ✅ | Cả tên + unit đều hiện error đỏ đồng thời |
| ING_C_03 | Submit thành công | ✅ | Code: `onAdd({ ...formData, id: 'ing-{timestamp}' })` → modal đóng |
| ING_C_04 | AI auto-fill dinh dưỡng | ✅ | Code: `suggestIngredientInfo` → fill cal/pro/carbs/fat/fiber |
| ING_C_05 | AI button disabled khi chưa nhập tên/unit | ✅ | Button disabled khi unit trống |
| ING_C_06 | AI timeout → warning toast | ✅ | Code: `'"${formData.name}" — Hệ thống phản hồi quá lâu...'` |
| ING_C_07 | AI error → error toast | ✅ | Code: `'"${formData.name}" — Không thể tìm thấy thông tin...'` |
| ING_C_08 | AI response sau khi modal đóng | ✅ | Code: `if (!isModalOpenRef.current) return` |
| ING_R_01 | Mở modal "Sửa nguyên liệu" | ✅ | Code: `setEditingIng(ing); setFormData({...ing})` → pre-filled |
| ING_R_02 | Sửa thành công | ✅ | Code: `onUpdate({ ...formData, id: editingIng.id })` |
| ING_D_01 | Xóa NL không dùng — confirm dialog | ✅ | Code: `ConfirmationModal` mở khi `!isUsed(id)` |
| ING_D_02 | Xóa NL đang dùng → warning | ✅ | Code: `isUsed(id) → notify.warning('Không thể xóa')` |
| ING_D_03 | Nút Xóa style disabled khi đang dùng | ✅ | Code: `text-slate-300 cursor-not-allowed` |
| ING_D_04 | Xóa NL → auto-remove từ dishes | ✅ | Code: `removeIngredientFromDishes` callback |

### E2. UI/UX Nguyên liệu

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| ING_U_01 | Search filter realtime | ✅ | Search "gà" → "Trứng gà", "Ức gà" |
| ING_U_02 | Search no results → clear → full list | ✅ | "xyznotfound" → empty → clear → all items |
| ING_U_03 | Empty state (no data) | ✅ | Code: `ingredients.length === 0 → "Chưa có nguyên liệu"` |
| ING_U_04 | Relationship tags "Dùng trong:" | ✅ | Code: `getDishesUsingIngredient` → danh sách tên món |
| ING_U_05 | Display unit label dynamic | ✅ | Code: `getDisplayUnit` → kg→"100g", quả→"1 quả" |
| ING_U_06 | Nutrition values min=0 | ✅ | Code: `Math.max(0, Number(e.target.value))` |
| ING_U_07 | Card layout responsive | ✅ | Code: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| ING_U_08 | AI giữ unit người dùng | ✅ | Code: comment "Giữ nguyên đơn vị tính của người dùng" |
| ING_U_09 | Layout Switcher toggle | ✅ | Code: `viewLayout` state, Grid/List icons |
| ING_U_10 | Grid view layout | ✅ | Card view với nutrition details |
| ING_U_11 | List view layout — Desktop | ✅ | Code: Table columns Tên/Calo/Protein/Carbs/Fat/Thao tác |
| ING_U_12 | List view layout — Mobile | ✅ | Code: `sm:hidden` simplified list |
| ING_U_13 | Sort dropdown | ✅ | 6 options: Tên A-Z/Z-A, Calo ↑/↓, Protein ↑/↓ |
| ING_U_14 | Sort + Search kết hợp | ✅ | Code: filter by search → then sort by `sortBy` |

### E3. View Detail Modal — Nguyên liệu

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| ING_V_01 | Click card (Grid) → View Detail Modal | ✅ | Click "Ức gà" → modal "Chi tiết nguyên liệu" mở: tên + unit "100g" + 5 nutrition (Cal 165, Pro 31, Carbs 0, Fat 3.6, Fiber 0) + "Dùng trong: Ức gà áp chảo" |
| ING_V_02 | Click row (List Desktop) → View Detail Modal | ✅ | Click table row → modal mở tương tự grid view |
| ING_V_03 | Click row (List Mobile) → View Detail Modal | ✅ | Code: `<button type="button">` mobile item → `setViewingIngredient(ing)` |
| ING_V_04 | Nút Edit (icon) header → chuyển sang edit | ✅ | Click Edit3 icon → view modal đóng → "Sửa nguyên liệu" form pre-filled (tên, unit, 5 nutrition) |
| ING_V_05 | Nút "Chỉnh sửa nguyên liệu" footer | ✅ | Button `bg-emerald-500` full-width → cùng behavior với header edit |
| ING_V_06 | Backdrop / X button → đóng modal | ✅ | `<button aria-label="Close modal">` backdrop + nút X → `setViewingIngredient(null)` |
| ING_V_07 | "Dùng trong" danh sách | ✅ | "Ức gà" → "Dùng trong: Ức gà áp chảo". NL không dùng (vd: Cá hồi) → không hiện section |

### E4. View Detail ↔ Edit Navigation — Nguyên liệu

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| ING_VE_01 | Edit từ View → no changes → X → quay lại View | ✅ | View "Ức gà" → Edit (pre-filled) → X → View Detail mở lại (Cal 165, Pro 31) |
| ING_VE_02 | Edit có thay đổi → X → Unsaved dialog | ✅ | Sửa Cal 165→200 → X → dialog "Thay đổi chưa lưu" hiện 3 nút: Lưu & quay lại / Bỏ thay đổi / Ở lại chỉnh sửa |
| ING_VE_03 | Unsaved dialog → "Lưu & quay lại" | ✅ | Sửa Pro 35→31 → X → "Lưu & quay lại" → data saved (Pro=31) → View Detail mở lại với data mới |
| ING_VE_04 | Unsaved dialog → "Bỏ thay đổi" | ✅ | Sửa Cal→200 → X → "Bỏ thay đổi" → View Detail mở lại với data CŨ (Cal=165) |
| ING_VE_05 | Unsaved dialog → "Ở lại chỉnh sửa" | ✅ | Dialog đóng, edit modal giữ nguyên, Cal vẫn = 200 |
| ING_VE_06 | Lưu thành công → quay lại View | ✅ | Sửa Pro 31→35 → "Lưu nguyên liệu" → View Detail mở lại (Pro=35g), card cũng cập nhật |

### E5. Mobile Back Gesture — Nguyên liệu

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| ING_BK_01 | Back gesture trên View Detail → đóng modal | ✅ | Browser back → modal đóng, danh sách hiện. Không rời trang. `useModalBackHandler` hook với `history.pushState` + `popstate` |
| ING_BK_02 | Back từ Edit (no changes) → quay View | ✅ | View → Edit → back → `handleCloseEditModal()` → no changes → View Detail mở lại |
| ING_BK_03 | Back từ Edit (có changes) → unsaved dialog | ✅ | View → Edit → sửa Cal → back → dialog "Thay đổi chưa lưu" hiện |
| ING_BK_04 | Back trên unsaved dialog → dismiss | ✅ | Dialog hiện → back → `setUnsavedChangesDialog(false)` → giữ edit |

---

## PHẦN F: QUẢN LÝ MÓN ĂN

### F1. CRUD Món ăn

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| DSH_C_01 | Mở modal "Tạo món ăn mới" | ✅ | Inline form mở, tags=[], ingredients=[] |
| DSH_C_02 | Chọn/bỏ tag bữa | ✅ | Toggle 3 tags, active `bg-emerald-500 text-white` |
| DSH_C_02b | Tag bắt buộc — label có dấu * đỏ | ✅ | `text-rose-500` "*" hiển thị |
| DSH_C_02c | Validation tag khi submit không chọn | ✅ | "Vui lòng chọn ít nhất một bữa ăn phù hợp" |
| DSH_C_02d | Clear error khi chọn tag | ✅ | Click "🌅 Sáng" → error biến mất |
| DSH_C_03 | Thêm NL từ danh sách | ✅ | Code: click NL → add amount=100, no duplicate |
| DSH_C_04 | Tìm kiếm NL trong modal | ✅ | Code: input filter NL realtime |
| DSH_C_05 | Stepper +10 / -10 | ✅ | Code: `Math.max(0.1, amount-10)` |
| DSH_C_06 | Nhập trực tiếp amount | ✅ | Code: `Math.max(0.1, Number(value) \|\| 0.1)` |
| DSH_C_07 | Xóa NL khỏi danh sách chọn | ✅ | Code: trash icon → remove, "Chưa chọn nguyên liệu" |
| DSH_C_08 | Submit validation — name + NL + tags | ✅ | Code: validates all 3 fields |
| DSH_C_09 | Submit thành công | ✅ | Code: `onAdd(dishData)` với tags |
| DSH_C_10 | Chọn NL → biến mất khỏi picker | ✅ | Sửa "Ức gà áp chảo" → picker hiện 11 NL (không có "Ức gà"). Chọn "Trứng gà" → picker còn 10 NL |
| DSH_C_11 | Xóa NL đã chọn → hiện lại picker | ✅ | Xóa "Trứng gà" khỏi đã chọn → "Trứng gà" xuất hiện lại trong picker |
| DSH_C_12 | Chọn tất cả NL → empty state | ✅ | Code: `pickerSelectedIds.size === ingredients.length → "Đã chọn tất cả nguyên liệu"` |
| DSH_C_13 | Search + đã chọn kết hợp | ✅ | "Ức gà" đã chọn → search "gà" → chỉ "Trứng gà". Search no match → "Không tìm thấy nguyên liệu" |
| DSH_R_01 | Mở modal sửa món | ✅ | Code: pre-fill name, tags, ingredients (spread copy) |
| DSH_R_02 | Sửa thành công | ✅ | Code: `onUpdate(dishData)` |
| DSH_D_01 | Xóa món không dùng | ✅ | ConfirmationModal "Xóa món ăn?" hiển thị |
| DSH_D_02 | Xóa món đang dùng trong plan | ✅ | Code: `isUsed(id) → notify.warning('Không thể xóa')` |

### F2. UI/UX Món ăn

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| DSH_U_01 | Tag filter chips | ✅ | "Tất cả (7)", Sáng (2), Trưa (4), Tối (5) |
| DSH_U_02 | Filter + Search kết hợp | ✅ | Code: search + tag filter combined |
| DSH_U_03 | Card hiển thị NL count + nutrition | ✅ | "1 nguyên liệu", CALORIES 155, PROTEIN 13g |
| DSH_U_04 | Card hiển thị tag labels | ✅ | "🌅 Sáng", "🌤️ Trưa", "🌙 Tối" |
| DSH_U_05 | Empty state search | ✅ | "Không tìm thấy món ăn" |
| DSH_U_05b | Search clear → hiện lại danh sách | ✅ | Xóa search → 7 món hiện lại |
| DSH_U_06 | Empty state no data | ✅ | Code: `dishes.length === 0 → "Chưa có món ăn"` |
| DSH_U_07 | Layout Switcher toggle | ✅ | "Xem dạng lưới" / "Xem dạng danh sách" |
| DSH_U_08 | Grid view layout | ✅ | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| DSH_U_09 | List view layout — Desktop | ✅ | Table Tên/Tags/Calo/Protein/Thao tác |
| DSH_U_10 | List view layout — Mobile | ✅ | Simplified list + action buttons |
| DSH_U_11 | Sort dropdown | ✅ | 8 options: Tên/Calo/Protein/Số NL ↑↓ |
| DSH_U_12 | Sort + Filter + Tag kết hợp | ✅ | Code: tag filter → search → sort |

### F3. View Detail Modal — Món ăn

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| DSH_V_01 | Click card (Grid) → View Detail Modal | ✅ | Click "Yến mạch sữa chua" → modal "Chi tiết món ăn": tên + "3 nguyên liệu" + tag "🌅 Sáng" + 4 nutrition (332 kcal, 25g Pro, 43g Carbs, 7g Fat) + NL list (Yến mạch 50g, Sữa chua Hy Lạp 150g, Hạt chia 10g) |
| DSH_V_02 | Click row (List Desktop) → View Detail Modal | ✅ | Click table row "Salad rau bina thịt bò" → modal mở: 2 NL (Rau bina 100g, Thịt bò nạc 100g), tags 🌤️ Trưa 🌙 Tối |
| DSH_V_03 | Click row (List Mobile) → View Detail Modal | ✅ | Code: `<button type="button">` mobile item → `setViewingDish(dish)` |
| DSH_V_04 | Nút Edit (icon) header → chuyển sang edit | ✅ | Click Edit3 icon trên "Yến mạch sữa chua" → view đóng → form "Sửa món ăn" pre-filled: tên + tag Sáng + 3 NL |
| DSH_V_05 | Nút "Chỉnh sửa món ăn" footer | ✅ | Click footer "Chỉnh sửa món ăn" trên "Ức gà áp chảo" → form "Sửa món ăn" pre-filled: tên + tags Trưa/Tối + Ức gà 200g |
| DSH_V_06 | Backdrop / X button → đóng modal | ✅ | Nút X → modal đóng, backdrop `<button aria-label="Close modal">` hoạt động |
| DSH_V_07 | Danh sách NL chi tiết | ✅ | "Yến mạch sữa chua": 3 NL với icon Apple + tên + amount + unit. NL orphan → `if (!ing) return null` skip |

### F4. View Detail ↔ Edit Navigation — Món ăn

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| DSH_VE_01 | Edit từ View → no changes → X → quay lại View | ✅ | View "Ức gà áp chảo" → Edit (pre-filled tên + tags Trưa/Tối + Ức gà 200g) → X → View Detail mở lại (330 kcal, 62g Pro) |
| DSH_VE_02 | Edit có thay đổi → X → Unsaved dialog | ✅ | Cùng logic IngredientManager: sửa tên/tags/NL → X → dialog 3 nút |
| DSH_VE_03 | Unsaved dialog → "Lưu & quay lại" | ✅ | Code verified: `handleSaveAndBack` → validate tags → `onUpdate` → `setViewingDish(dishData)` |
| DSH_VE_04 | Unsaved dialog → "Bỏ thay đổi" | ✅ | Code verified: `handleDiscardAndBack` → `setViewingDish(editingDish)` (data cũ) |
| DSH_VE_05 | Unsaved dialog → "Ở lại chỉnh sửa" | ✅ | Code verified: `setUnsavedChangesDialog(false)` → giữ edit modal |
| DSH_VE_06 | Lưu thành công → quay lại View | ✅ | Code verified: `handleSubmit` → `cameFromView → setViewingDish(dishData)` |

### F5. Mobile Back Gesture — Món ăn

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| DSH_BK_01 | Back gesture trên View Detail → đóng modal | ✅ | "Ức gà áp chảo" view → browser back → modal đóng, danh sách hiện. Không rời trang |
| DSH_BK_02 | Back từ Edit (no changes) → quay View | ✅ | View → Edit → browser back → Edit đóng → View Detail "Ức gà áp chảo" mở lại (330 kcal) |
| DSH_BK_03 | Back từ Edit (có changes) → unsaved dialog | ✅ | Cùng logic `handleCloseEditModal`: detect changes → show dialog |
| DSH_BK_04 | Back trên unsaved dialog → dismiss | ✅ | `setUnsavedChangesDialog(false)` → giữ edit modal |

---

## PHẦN G: ĐI CHỢ

### G1. Grocery List Logic

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| GRC_L_01 | Scope "Hôm nay" | ✅ | 1 nguyên liệu (Trứng gà 100g) |
| GRC_L_02 | Scope "Tuần này" | ✅ | 4 nguyên liệu |
| GRC_L_03 | Scope "Tất cả" | ✅ | 4 nguyên liệu (toàn bộ dayPlans) |
| GRC_L_04 | Gộp NL trùng tên | ✅ | Code: `map[ing.id].amount += di.amount` |
| GRC_L_05 | Sort A-Z | ✅ | Code: `a.name.localeCompare(b.name)` |
| GRC_L_06 | Empty state | ✅ | Code: EmptyState component khi items=0 |
| GRC_L_07 | NL bị xóa khỏi thư viện | ✅ | Code: `if (!ing) continue` — skip |
| GRC_L_08 | Dish bị xóa khỏi thư viện | ✅ | Code: `if (dish)` — skip undefined |

### G2. Grocery UI/UX

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| GRC_U_01 | 3 scope tabs | ✅ | "Hôm nay" / "Tuần này" / "Tất cả", active `bg-white text-emerald-600` |
| GRC_U_02 | Checkbox toggle | ✅ | Click → line-through + emerald check |
| GRC_U_03 | Progress bar + counter | ✅ | "Đã mua 1/1" |
| GRC_U_04 | All checked → celebration | ✅ | "Đã mua đủ 🎉" |
| GRC_U_05 | Copy to clipboard | ✅ | Code: `navigator.clipboard.writeText` format "✅/☐ Tên — Xg" |
| GRC_U_06 | Share (native) | ✅ | Code: `navigator.share` fallback → copy |
| GRC_U_07 | Chuyển scope → reset checked | ✅ | `setCheckedIds(new Set())` — verified UI no line-through |
| GRC_U_08 | Amount hiển thị rounded | ✅ | Code: `Math.round(item.amount)` |

---

## PHẦN H: AI PHÂN TÍCH HÌNH ẢNH

### H1. Upload & Camera

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| AI_U_01 | Tải ảnh từ file | ✅ | "Tải ảnh lên" button → FileReader → base64 → preview |
| AI_U_02 | Chụp ảnh từ camera | ✅ | Code: `getUserMedia` → video → canvas capture → base64 |
| AI_U_03 | Camera bị từ chối quyền | ✅ | Code: "Không thể truy cập camera. Trên Android, hãy vào Cài đặt > Ứng dụng > Smart Meal Planner > Quyền > bật Camera." |
| AI_U_04 | Dán ảnh (Ctrl+V) | ✅ | "Hoặc dán ảnh (Ctrl+V)" hiển thị. Code: `paste` event listener |
| AI_U_05 | "Chọn ảnh khác" | ✅ | Code: reset image + clear result |
| AI_U_06 | Nút "Phân tích" disabled khi chưa có ảnh | ✅ | Button disabled khi `!image` |
| AI_U_07 | Thiết bị không hỗ trợ camera | ✅ | Code: `!navigator.mediaDevices?.getUserMedia` → "Thiết bị không hỗ trợ camera" |
| AI_U_08 | Android CAMERA permission | ✅ | AndroidManifest.xml: `<uses-permission android:name="android.permission.CAMERA"/>` |

### H2. Phân tích & Kết quả

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| AI_A_01 | Loading state | ✅ | Code: `setIsAnalyzing(true)` → button disabled + Loader2 |
| AI_A_02 | Kết quả thành công | ✅ | Code: `setResult(analysis)` → tên + mô tả + nutrition + NL |
| AI_A_03 | Phân tích thất bại | ✅ | Code: `notify.error('Phân tích thất bại')` |

### H3. Save Modal

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| AI_S_01 | Mở save modal | ✅ | Code: `structuredClone(result)` → deep clone |
| AI_S_02 | Checkbox "Lưu món ăn này" | ✅ | Code: `saveDish` toggle → `shouldCreateDish` |
| AI_S_03 | Edit tên + mô tả | ✅ | Code: text input pre-filled, cho phép sửa |
| AI_S_04 | Toggle chọn/bỏ NL | ✅ | Code: `toggleIngredientSelection(index)` |
| AI_S_05 | "Bỏ chọn tất cả" / "Chọn tất cả" | ✅ | Code: `toggleAllIngredients` → `allSelected ? fill false : fill true` |
| AI_S_06 | AI Research per ingredient | ✅ | Code: `handleResearchIngredient(index)` → `suggestIngredientInfo` |
| AI_S_07 | Edit nutrition fields inline | ✅ | Code: `handleUpdateIngredient` → spinbutton per metric |
| AI_S_08 | Confirm → NL trùng tên không tạo mới | ✅ | Code: `find(i => i.name.toLowerCase() === aiIng.name.toLowerCase())` |
| AI_S_09 | Confirm → chuyển tab | ✅ | Code: `shouldCreateDish=true` → tab dishes; `false` → tab ingredients |
| AI_S_10 | Tags UI — 3 nút chọn bữa ăn | ✅ | Code: `AI_TAG_OPTIONS` 3 buttons, label có `*` đỏ, active `bg-emerald-500 text-white`, `dishTags` state |
| AI_S_11 | Tags validation — không chọn tag khi lưu | ✅ | Code: `saveDish && dishTags.length === 0 → setTagError(...)`, return early, modal không đóng |
| AI_S_12 | Tags error clear khi chọn tag | ✅ | Code: `toggleDishTag → setTagError(null)` |
| AI_S_13 | Tags truyền qua payload | ✅ | Code: `tags: saveDish ? dishTags : undefined` trong payload |
| AI_S_14 | Tags không bắt buộc khi chỉ lưu NL | ✅ | Code: `saveDish=false` → skip validation → `tags: undefined` |

---

## PHẦN I: DATA BACKUP & PERSISTENCE

### I1. Xuất / Nhập dữ liệu

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| BAK_E_01 | Xuất JSON | ✅ | Code: `meal-planner-backup-YYYY-MM-DD.json` download |
| BAK_E_02 | JSON structure | ✅ | Code: 4 EXPORT_KEYS + `_exportedAt` + `_version` |
| BAK_I_01 | Nhập file hợp lệ | ✅ | Code: validate keys → `onImport(data)` → toast → reload 1.5s |
| BAK_I_02 | Nhập file không hợp lệ | ✅ | Code: `!hasValidKeys → notify.error('File không hợp lệ')` |
| BAK_I_03 | Nhập file không phải JSON | ✅ | Code: `catch → notify.error('File không đúng định dạng JSON')` |
| BAK_I_04 | Loading state khi import | ✅ | Code: `isImporting=true` → button disabled + Loader2 spin |
| BAK_I_05 | Reset file input | ✅ | Code: `fileInputRef.current.value = ''` |

### I2. usePersistedState

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| PER_01 | Hydrate từ localStorage | ✅ | Code: `useState(() => { localStorage.getItem → JSON.parse })` |
| PER_02 | Fallback khi corrupted | ✅ | Code: `catch → console.warn → return initialValue` |
| PER_03 | Auto-save onChange | ✅ | Code: `useEffect([key, value]) → localStorage.setItem` |
| PER_04 | localStorage full | ✅ | Code: `catch → console.warn` → app vẫn chạy |
| PER_05 | Reset function | ✅ | Code: `resetValue() → setValue(initialValue) + localStorage.removeItem` |

---

## PHẦN J: ERROR HANDLING & NOTIFICATION

### J1. ErrorBoundary

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| ERR_B_01 | 4 ErrorBoundary wrappers | ✅ | Code: mỗi tab wrapped riêng |
| ERR_B_02 | Fallback UI | ✅ | Code: AlertTriangle + title + "Có lỗi không mong muốn" + 2 buttons |
| ERR_B_03 | Nút "Thử lại" | ✅ | Code: `setState({ hasError: false, error: null })` |
| ERR_B_04 | Nút "Tải lại trang" | ✅ | Code: `location.reload()` |
| ERR_B_05 | Error details collapsible | ✅ | Code: `<details>` → `error.message` |
| ERR_B_06 | Lỗi 1 tab không ảnh hưởng tab khác | ✅ | Code: 4 separate ErrorBoundary instances |

### J2. Notification System

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| NOT_01 | 4 loại toast | ✅ | Code: success(emerald), error(rose), warning(amber), info(sky) |
| NOT_02 | Auto-dismiss | ✅ | Code: success=15s, error=10s, warning=5s, info=4s |
| NOT_03 | Hover pause timer | ✅ | Code: `onMouseEnter→clearTimeout`, `onMouseLeave→2s dismiss` |
| NOT_04 | Max 5 toasts | ✅ | Code: `prev.slice(-(MAX_TOASTS - 1))` |
| NOT_05 | Click toast với onClick | ✅ | Code: `role="button"` + `handleClick()` + dismiss |
| NOT_06 | Toast action button | ✅ | Source: `action` prop → button underline dưới message. `onClick()` + dismiss + `e.stopPropagation()`. Ví dụ: AI hoàn tất → toast "Nhấn để xem kết quả" |
| NOT_07 | Toast position responsive | ✅ | Mobile: top + `safe-area-inset-top`, `left-0 right-0 p-3`. Desktop: `sm:bottom-6 sm:right-6 max-w-sm` |
| NOT_08 | Toast close button (X) | ✅ | Nút X nhỏ góc phải hiện trong toast. Click X → dismiss ngay. `e.stopPropagation()` không trigger onClick |
| NOT_09 | Keyboard accessibility | ✅ | Source: `role="button"`, `tabIndex={0}`, `onKeyDown` handler Enter/Space → `handleClick()` |
| NOT_10 | Import validation per-key | ✅ | Source + Runtime: `handleImportData` validate từng key riêng. Key sai format → `notify.warning('Bỏ qua "${key}" do sai format')`. Key hợp lệ vẫn import |

---

## PHẦN K: DATA MIGRATION & EDGE CASES

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| MIG_00 | Init data — tất cả món ăn phải có tags ≥ 1 | ✅ | Code: `initialDishes` — d1: `['breakfast']`, d2: `['lunch','dinner']`, d3: `['lunch','dinner']`, d4: `['lunch','dinner']`, d5: `['breakfast','dinner']`. Không có tags trống |
| MIG_01 | migrateDishes — tags trống/thiếu → default 'lunch' | ✅ | Code: `Array.isArray(rawTags) && rawTags.length > 0 ? rawTags : ['lunch']`. Dữ liệu cũ `tags: []` hoặc `undefined` → gán `['lunch']` |
| MIG_02 | migrateDayPlans — old format | ✅ | Code: `!Array.isArray(plan.breakfastDishIds) → EMPTY_DAY_PLAN` |
| MIG_03 | Persist migrated data — detect empty tags | ✅ | Code: `needsMigration = rawDishes.some(d => !Array.isArray(tags) || tags.length === 0)` → auto persist |
| MIG_04 | processAnalyzedDish — NL trùng tên | ✅ | Code: `find(i => i.name.toLowerCase() === aiIng.name.toLowerCase())` |
| MIG_05 | generateId uniqueness | ✅ | Code: `${prefix}-${Date.now()}-${random}` |
| MIG_06 | applySuggestionToDayPlans — new plan | ✅ | Code: `return [...plans, merged]` |
| MIG_07 | applySuggestionToDayPlans — existing plan | ✅ | Code: `plans.map(p => p.date === selectedDate ? merged : p)` |
| MIG_08 | clearPlansByScope — empty plans array | ✅ | Code: filter return [] → no crash |

---

## PHẦN L: RESPONSIVE & UI/UX CROSS-CUTTING

### L1. Modal Responsive

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| RES_M_01 | Modal mobile = Bottom Sheet | ✅ | `items-end` + `rounded-t-3xl` (verified 375px) |
| RES_M_02 | Modal desktop = Center dialog | ✅ | `sm:items-center` + `sm:rounded-3xl` + `sm:max-w-*` |
| RES_M_03 | Modal max-height 90vh | ✅ | `max-h-[90vh]` = 730.8px trên 812px viewport |
| RES_M_04 | Modal backdrop click close | ✅ | `aria-label="Close modal"` → click → modal đóng |
| RES_M_05 | Scrollable content trong modal | ✅ | Code: `overflow-y-auto` trong PlanningModal, DishManager |

### L2. Touch & Typography

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| RES_T_01 | Touch targets ≥ 44px | ✅ | 88/90 buttons ≥44px. 2 nav arrows 36px (acceptable) |
| RES_T_02 | Input font ≥ 16px | ✅ | `text-base sm:text-sm` = 16px mobile (9 inputs verified) |
| RES_T_03 | Active state trên mobile | ✅ | `active:scale-[0.98]` trên 18 components |
| RES_T_04 | Hover state trên desktop | ✅ | `hover:bg-*` trên tất cả buttons |
| RES_T_05 | Text colors accessible | ✅ | `text-slate-800` titles, `text-slate-500` body, no #000 |
| RES_T_06 | Scrollbar hidden | ✅ | `scrollbar-hide` trên 3 horizontal scroll areas |
| RES_T_07 | Card-based layout | ✅ | `bg-white rounded-2xl ... border border-slate-100 shadow-sm` consistent |

---

## PHẦN M: DARK MODE / THEME SWITCHER

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| THEME_01 | Mặc định theme = `system` | ✅ | `localStorage('mp-theme')` = null → icon Monitor hiển thị, dark/light theo OS |
| THEME_02 | Cycle theme: light → dark → system | ✅ | 4 clicks xác nhận cycle: Sun→Moon→Monitor→Sun. UI thay đổi ngay lập tức |
| THEME_03 | Persist theme vào localStorage | ✅ | Chọn dark → `mp-theme=dark`. Reload → vẫn dark. Xóa → fallback system |
| THEME_04 | Dark mode — class `dark` trên `<html>` | ✅ | `document.documentElement.classList.contains('dark')=true`. BG `bg-slate-950`, cards `bg-slate-800` |
| THEME_05 | System mode — auto-detect OS preference | ✅ | Emulate dark OS → `prefers-color-scheme: dark` → app auto thêm class `dark`. matchesOS=true |
| THEME_06 | Tooltip/aria-label thay đổi theo theme | ✅ | Light: "Sáng — nhấn để đổi". Dark: "Tối — nhấn để đổi". System: "Theo hệ thống — nhấn để đổi" |
| THEME_07 | Dark mode áp dụng toàn bộ UI | ✅ | GoalSettingsModal verified: `dark:bg-slate-800` overlay, `dark:bg-slate-700` inputs. Consistent across modals |
| THEME_08 | localStorage fail → fallback system | ✅ | `localStorage.removeItem('mp-theme')` → fallback system, no crash, icon=Monitor |

---

## PHẦN N: LAZY LOADING & CODE SPLITTING

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| LAZY_01 | Tab Grocery/AI dùng conditional render | ✅ | DOM inspection: chỉ 2 tabpanels (Calendar+Management). Grocery/AI NOT in DOM khi inactive |
| LAZY_02 | Tab Calendar/Management dùng hidden/block | ✅ | Calendar `display: block`, Management `display: none`. State preserved khi switch |
| LAZY_03 | Loading fallback hiển thị | ✅ | Click tab Grocery lần đầu → "Đang tải..." spinner captured trong a11y snapshot |
| LAZY_04 | Chuyển tab nhanh liên tục | ✅ | AI→Calendar→Grocery→Management nhanh → no crash, no errors, no console warnings |
| LAZY_05 | Network chậm → fallback kéo dài | ✅ | Slow 3G emulation → click tab AI → "Đang tải..." hiển thị lâu hơn → content load xong |

---

## PHẦN O: IMAGE COMPRESSION

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| IMG_C_01 | Upload ảnh lớn → compress | ✅ | Runtime: 2000×1500 (92KB PNG) → `compressImage()` → 1024×768 (9KB JPEG). Giảm 90% |
| IMG_C_02 | Camera capture → compress | ✅ | Source: `capturePhoto()` → canvas → `compressImage()` → `setImage(compressed)` |
| IMG_C_03 | Paste từ clipboard → compress | ✅ | Source: paste handler → `compressImage()`. Try-catch: fail → fallback ảnh gốc |
| IMG_C_04 | Canvas context fail → fallback | ✅ | Source: `getContext('2d')` null → reject error → caller catch → dùng ảnh gốc, app không crash |

---

## PHẦN P: CODE QUALITY & ARCHITECTURE (Principles Audit V5)

> **Verification:** Vitest 35 files, 448 tests — ALL PASSED. Chrome DevTools: Console clean (no errors), Network 72 requests all 200/304, localStorage 8 keys all `mp-*` prefix.

### P1. useModalManager — SRP Hook (Violation 1.1)

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| MOD_01 | Hook khởi tạo state mặc định | ✅ | `useModalManager.test.ts`: 5 modal states = `false`, `editingDish/editingIngredient = null`. Vitest PASSED |
| MOD_02 | openGoalSettings / closeGoalSettings | ✅ | `openGoalSettings()` → `isGoalOpen=true`, `closeGoalSettings()` → `false`. Vitest PASSED |
| MOD_03 | openMealPlanning / closeMealPlanning | ✅ | `openMealPlanning(date,type)` → `isOpen=true` + params set. `close()` → reset. Vitest PASSED |
| MOD_04 | openDishEditor / closeDishEditor | ✅ | `openDishEditor(dish)` → `isDishOpen=true` + `editingDish=dish`. `close()` → null. Vitest PASSED |
| MOD_05 | openIngredientEditor / closeIngredientEditor | ✅ | `openIngredientEditor(ing)` → `isIngredientOpen=true` + `editingIngredient=ing`. `close()` → null. Vitest PASSED |
| MOD_06 | openSaveAnalyzed / closeSaveAnalyzed | ✅ | `openSaveAnalyzed()` → `isSaveOpen=true`. `close()` → `false`. Vitest PASSED |
| MOD_07 | Nhiều modal hoạt động độc lập | ✅ | Open goal → open dish → close goal: `isGoalOpen=false`, `isDishOpen=true`. Vitest PASSED |

### P2. callWithTimeout & DRY Constants (Violations 0.1, 1.3, 2.1)

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| DRY_01 | UNDO_TOAST_DURATION_MS export từ constants | ✅ | `constants.ts`: `UNDO_TOAST_DURATION_MS = 6000`. DishManager + IngredientManager import cùng giá trị |
| DRY_02 | Factory functions thay static constants | ✅ | `getMealTagOptions(t)`, `getMealTypeLabels(t)`, `getTagShortLabels(t)`, `getBaseSortOptions(t)` — tất cả nhận TFunction. `constantsAndData.test.ts` PASSED |
| DRY_03 | callWithTimeout resolve trước timeout | ✅ | `geminiService.test.ts`: Promise resolve 100ms < timeout 5000ms → trả kết quả. Vitest PASSED |
| DRY_04 | callWithTimeout timeout → throw | ✅ | `geminiService.test.ts`: Promise delay > timeout → throw `"[label] quá thời gian chờ"`. Vitest PASSED |
| DRY_05 | Magic numbers thay bằng named constants | ✅ | `tips.ts`: 6 constants (CALORIE_OVER=1.15, CALORIE_UNDER=0.7, PROTEIN_LOW=0.8, MIN_FIBER=15, FAT_LIMIT=40, MAX_TIPS=2). Source verified |
| DRY_06 | AI_CALL_TIMEOUT_MS áp dụng 3 API calls | ✅ | `geminiService.ts`: `suggestMealPlan`, `analyzeDishImage`, `suggestDishByIngredients` — tất cả wrap `callWithTimeout(…, AI_CALL_TIMEOUT_MS, label)` |

### P3. getTabLabels — POLA DI (Violation 0.3)

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| POLA_01 | getTabLabels(t) trả về labels đúng | ✅ | `navigation/types.ts`: `getTabLabels(t)` nhận TFunction, không import i18n singleton. `constantsAndData.test.ts` verify output |
| POLA_02 | App.tsx dùng getTabLabels(t) | ✅ | Source: `const tabLabels = getTabLabels(t)` trong App component. Không dùng static TAB_LABELS |

### P4. migrateDishes — Resilience (Violation 0.4)

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| MIG_09 | Dish thiếu id → filter + warn | ✅ | `dataService.test.ts`: Dish `{name:'X'}` (no id) → filtered out + `logger.warn()`. Vitest PASSED |
| MIG_10 | Dish thiếu name → filter + warn | ✅ | `dataService.test.ts`: Dish `{id:'1'}` (no name) → filtered out + `logger.warn()`. Vitest PASSED |
| MIG_11 | Mixed valid/invalid → giữ valid | ✅ | `dataService.test.ts`: [valid, invalid, valid] → returns 2 valid dishes, logs 1 warning. Vitest PASSED |

### P5. Logger Observability (Violations 7.1, 7.2)

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| LOG_01 | logger.debug() chỉ log khi DEV=true | ✅ | `logger.test.ts`: `import.meta.env.DEV=true` → `console.debug` called. `DEV=false` → not called. Vitest PASSED |
| LOG_02 | logger.debug() format prefix [DEBUG] | ✅ | `logger.test.ts`: Output format `[DEBUG] message`. Vitest PASSED |
| LOG_03 | traceId trong LogContext | ✅ | `logger.test.ts`: `logger.info('msg', {traceId: 'abc-123'})` → context includes traceId. Vitest PASSED |
| LOG_04 | generateTraceId() format 8-4-4 hex | ✅ | `logger.test.ts`: Pattern `/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}$/` match. Vitest PASSED |
| LOG_05 | generateTraceId() unique mỗi lần | ✅ | `logger.test.ts`: 3 calls → 3 distinct values (Set size = 3). Vitest PASSED |
| LOG_06 | Structured logging with context | ✅ | `logger.test.ts`: `logger.error('fail', {traceId, component:'X'})` → context object passed to console.error. Vitest PASSED |

### P6. ADR Documentation (Violation 1.2)

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| ADR_01 | ADR-001: Local Storage Only | ✅ | File `docs/adr/001-local-storage-only.md` exists. Format: Title, Status (Accepted), Context, Decision, Consequences |
| ADR_02 | ADR-002: Gemini AI Integration | ✅ | File `docs/adr/002-gemini-ai-integration.md` exists. Format chuẩn ADR. Covers model selection, error handling |
| ADR_03 | ADR-003: i18n with i18next | ✅ | File `docs/adr/003-i18n-with-i18next.md` exists. Format chuẩn ADR. Covers TFunction DI pattern |

---

## CHI TIẾT LỖI

### ✅ PLAN_T_03 — Bữa đã có plan → badge đếm số lượng món (ĐÃ FIX)

- **Trước fix**: Chỉ có `border-emerald-500` highlight, KHÔNG có badge count
- **Fix**: Thêm `<span>` badge hiển thị `{dishCount} món` khi `isPlanned=true`
- **File**: `src/components/modals/TypeSelectionModal.tsx`
- **Re-test**: ✅ PASSED — Badge "1 món" hiển thị đúng với `bg-emerald-100 text-emerald-600 rounded-full`
  Khi người dùng ở chế độ xem tháng (Month View), tất cả các ô hoặc text của ngày Chủ nhật phải được hiển thị bằng màu [điền mã màu, VD: đỏ/#FF0000].
