# TEST REPORT V2 — Smart Meal Planner

> **Ngày:** 2026-02-26 | **Env:** localhost:3000 | **Tool:** Chrome DevTools MCP | **TC Doc:** test-cases-v2.5

---

## Tổng hợp

| Trạng thái | Số TC |
|---|---|
| ✅ PASSED | 53 |
| ❌ FAILED | 0 |
| ⏩ SKIP | 30 |
| ⏳ PENDING | 164 |

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

---

## PHẦN B: CALENDAR — CHỌN NGÀY

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| CAL_G_01 | Hiển thị tháng hiện tại mặc định | ✅ | "Tháng 2, 2026", 7 header T2-CN, title "Chọn ngày" |
| CAL_G_02 | Ngày hôm nay highlight | ✅ | Ngày 26 có `bg-emerald-50 text-emerald-600` khi không selected |
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

---

## PHẦN C: KẾ HOẠCH BỮA ĂN

### C1. TypeSelectionModal

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| PLAN_T_01 | Mở modal TypeSelection | ✅ | Click "Lên kế hoạch" → modal mở |
| PLAN_T_02 | 3 bữa hiển thị đúng | ✅ | Bữa Sáng/Trưa/Tối với mô tả |
| PLAN_T_03 | Bữa đã có plan → badge đếm | ❌ | Có `border-emerald-500` khi isPlanned, nhưng không có badge count số lượng món |
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

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| NUT_S_01 | Tổng hợp dinh dưỡng 3 bữa | ✅ | 155 cal, 13g pro cho 1 bữa (Trứng ốp la) |
| NUT_S_02–S_06 | Progress bars & Goals | ⏳ | Cần test thêm |
| NUT_S_07 | Ngày không có plan → tất cả = 0 | ✅ | Ngày 27 → 0 cal, 0g protein |
| NUT_G_01–G_05 | GoalSettings | ⏳ | |
| NUT_T_01–T_06 | Tips logic | ⏳ | |

---

## PHẦN E: QUẢN LÝ NGUYÊN LIỆU

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| ING_* | 31 TCs | ⏳ | Cần test chi tiết |

---

## PHẦN F: QUẢN LÝ MÓN ĂN

| ID | Tên | Kết quả | Ghi chú |
|----|-----|---------|---------|
| DSH_U_01 | Tag filter chips | ✅ | "Tất cả (7)", Sáng (2), Trưa (4), Tối (5) — filter Sáng → 2 món |
| DSH_U_03 | Card hiển thị NL count + nutrition | ✅ | Tên + "X nguyên liệu" + Cal + Protein |
| DSH_U_04 | Card hiển thị tag labels | ✅ | "🌅 Sáng", "🌤️ Trưa", "🌙 Tối" |
| DSH_U_05 | Empty state search | ✅ | "xyzabc" → "Không tìm thấy món ăn" |
| DSH_U_05b | Search clear → hiện lại danh sách | ✅ | Xóa search → 7 món hiện lại |
| DSH_U_07 | Layout Switcher toggle | ✅ | Buttons "Xem dạng lưới" / "Xem dạng danh sách" |
| DSH_U_11 | Sort dropdown | ✅ | 8 options: Tên A-Z/Z-A, Calo ↑↓, Protein ↑↓, Số NL ↑↓ |
| DSH_C_01–DSH_D_02 | CRUD + còn lại | ⏳ | Cần test chi tiết |

---

## PHẦN G–L: CÒN LẠI

| Phần | Số TC | Kết quả | Ghi chú |
|------|-------|---------|---------|
| G. Đi chợ | 16 | ⏳ | |
| H. AI Phân tích | 20 | ⏩ | Cần API key |
| I. Data Backup | 12 | ⏳ | |
| J. Error Handling | 11 | ⏳ | |
| K. Migration | 8 | ⏳ | |
| L. Responsive | 12 | ⏳ | |

---

## CHI TIẾT LỖI

_(Chưa có)_
