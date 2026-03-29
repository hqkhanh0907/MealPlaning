# Test Cases — Smart Meal Planner

**Version:** 8.0  
**Date:** 2026-07-05  

> **v8.0**: Fitness Plan Flexibility — Thêm TC_FLEX (23 test cases) cho Multi-Session System, Plan Day Editor, Freestyle Workout, PageStack overlay. Scenarios SC41-SC43. Xem [Changelog](#changelog).
>
> **v6.0**: QA Cycle 5 — Comprehensive scenario expansion. Unit tests 995→1046 (49 files). Coverage 99.53% Stmts, 92.30% Branch.
>
> **v5.0**: QA Cycle 4 — Dark mode visual audit via Chrome DevTools. Added TC_DM (Dark Mode) test cases. Unit tests 866→995 (47 files). BUG-DM-001 fixed.
>
> **Xem thêm:** Scenario-based test cases chi tiết (799 TCs, 15 scenarios × 50+ TCs): [scenario-analysis-and-testcases.md](scenario-analysis-and-testcases.md)

---

## Mục lục

- [Danh sách Test Cases (Browser QA Manual)](#danh-sách-test-cases-browser-qa-manual)
  - [TC_NAV — Navigation](#tc_nav--navigation)
  - [TC_CAL — Calendar / Meal Planning](#tc_cal--calendar--meal-planning)
  - [TC_LIB — Library (Nguyên liệu & Món ăn)](#tc_lib--library-nguyên-liệu--món-ăn)
  - [TC_AI — AI Features](#tc_ai--ai-features)
  - [TC_SHOP — Grocery List](#tc_shop--grocery-list)
  - [TC_SET — Settings](#tc_set--settings)
  - [TC_BAK — Backup & Restore](#tc_bak--backup--restore)
  - [TC_RESP — Responsive UI](#tc_resp--responsive-ui)
  - [TC_I18N — i18n Language](#tc_i18n--i18n-language)
  - [TC_DET — Detail Modal](#tc_det--detail-modal)
  - [TC_DEL — Delete Guard & Undo](#tc_del--delete-guard--undo)
  - [TC_EDGE — Error Handling & Edge Cases](#tc_edge--error-handling--edge-cases)
  - [TC_INTEG — Deep Integration Tests](#tc_integ--deep-integration-tests)
  - [TC_MULTI — Multi-day & Cross-tab](#tc_multi--multi-day--cross-tab)
  - [TC_DM — Dark Mode Visual QA](#tc_dm--dark-mode-visual-qa-chrome-devtools)
  - [TC_FLEX — Fitness Plan Flexibility](#tc_flex--fitness-plan-flexibility)
- [E2E Tests — Kết quả](#e2e-tests--kết-quả)
- [Unit Test Summary](#unit-test-summary)
- [Changelog](#changelog)

---

## Danh sách Test Cases (Browser QA Manual)

### TC_NAV — Navigation

| ID | Tên | Điều kiện tiên quyết | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|----|-----|---------------------|----------------|-----------------|-----------|
| TC_NAV_01 | Chuyển tab Calendar | App đang mở | Click icon lịch | Tab Calendar hiển thị, active indicator trên icon lịch | ✅ Pass |
| TC_NAV_02 | Chuyển tab Library | App đang mở | Click icon thư viện | Tab Library hiển thị với 2 sub-tabs: Nguyên liệu / Món ăn | ✅ Pass |
| TC_NAV_03 | Chuyển tab Grocery | App đang mở | Click icon giỏ hàng | Tab Grocery hiển thị danh sách mua sắm | ✅ Pass |
| TC_NAV_04 | Chuyển tab Settings | App đang mở | Click icon cài đặt | Tab Settings hiển thị thông tin người dùng | ✅ Pass |
| TC_NAV_05 | Chuyển tab AI | App đang mở | Click icon AI | Tab AI hiển thị khu vực phân tích ảnh | ✅ Pass |

---

### TC_CAL — Calendar / Meal Planning

| ID | Tên | Điều kiện tiên quyết | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|----|-----|---------------------|----------------|-----------------|-----------|
| TC_CAL_01 | Hiển thị ngày hiện tại | App mở lần đầu | Vào tab Calendar | Ngày hôm nay được highlight | ✅ Pass |
| TC_CAL_02 | Chọn ngày khác | Tab Calendar đang mở | Click vào ngày khác trong tuần | Panel ngày thay đổi, hiển thị kế hoạch của ngày được chọn | ✅ Pass |
| TC_CAL_03 | Thêm bữa ăn vào ngày | Có ít nhất 1 món ăn trong Library | 1. Chọn ngày; 2. Click "+" tại slot Bữa sáng; 3. Chọn món | Món ăn hiển thị trong slot Bữa sáng với calo | ✅ Pass |
| TC_CAL_04 | Xóa bữa ăn | Ngày có ít nhất 1 bữa | Click icon xóa trên bữa ăn → confirm | Bữa ăn bị xóa, calo ngày giảm | ✅ Pass |
| TC_CAL_05 | Tổng calo ngày | Ngày có 2+ bữa | Xem summary row cuối ngày | Tổng calo = sum(calo từng bữa), protein = sum(protein từng bữa) | ✅ Pass |
| TC_CAL_06 | Chuyển tuần | Calendar tuần | Click nút Tuần sau / Tuần trước | Calendar chuyển sang tuần tương ứng | ✅ Pass |
| TC_CAL_07 | Copy kế hoạch ngày | Ngày nguồn có bữa ăn | Click "Copy day" → chọn ngày đích → confirm | Ngày đích có y hệt bữa ăn như ngày nguồn | ✅ Pass |

---

### TC_LIB — Library (Nguyên liệu & Món ăn)

| ID | Tên | Điều kiện tiên quyết | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|----|-----|---------------------|----------------|-----------------|-----------|
| TC_LIB_01 | Thêm nguyên liệu mới | Tab Library → sub-tab Nguyên liệu | 1. Click "+"; 2. Nhập tên, đơn vị, calo, protein; 3. Click Lưu | Nguyên liệu mới xuất hiện trong danh sách | ✅ Pass |
| TC_LIB_02 | Sửa nguyên liệu | Có ≥1 nguyên liệu | 1. Long press / click edit; 2. Thay đổi giá trị; 3. Lưu | Nguyên liệu cập nhật với giá trị mới | ✅ Pass |
| TC_LIB_03 | Xóa nguyên liệu | Có ≥1 nguyên liệu | 1. Swipe xóa / click xóa; 2. Confirm | Nguyên liệu bị xóa khỏi danh sách | ✅ Pass |
| TC_LIB_04 | Tìm kiếm nguyên liệu | Có ≥3 nguyên liệu | Nhập tên vào ô tìm kiếm | Chỉ hiển thị nguyên liệu khớp | ✅ Pass |
| TC_LIB_05 | Thêm món ăn mới | Có ≥1 nguyên liệu | 1. Sub-tab Món ăn; 2. "+"; 3. Đặt tên, thêm nguyên liệu; 4. Lưu | Món ăn mới với calo/protein được tính tự động | ✅ Pass |
| TC_LIB_06 | Sửa món ăn | Có ≥1 món ăn | Sửa tên hoặc nguyên liệu của món | Món ăn cập nhật | ✅ Pass |
| TC_LIB_07 | Xóa món ăn | Có ≥1 món ăn không dùng trong kế hoạch | Xóa món ăn → confirm | Món ăn bị xóa | ✅ Pass |
| TC_LIB_08 | Calo tự tính | Thêm/sửa món ăn | Thêm nguyên liệu vào món → xem summary | Calo = sum(cal × qty), Protein = sum(prot × qty) | ✅ Pass |

---

### TC_AI — AI Features

| ID | Tên | Điều kiện tiên quyết | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|----|-----|---------------------|----------------|-----------------|-----------|
| TC_AI_01 | Phân tích ảnh thức ăn | API key hợp lệ, tab AI | 1. Chụp ảnh / upload; 2. Đợi phân tích | Hiển thị tên món, danh sách nguyên liệu ước tính, calo | ✅ Pass |
| TC_AI_02 | Lưu kết quả phân tích | TC_AI_01 hoàn thành | Click "Lưu" trên kết quả | Nguyên liệu mới và món ăn được tạo trong Library | ✅ Pass |
| TC_AI_03 | Ảnh không phải thức ăn | API key hợp lệ | Upload ảnh xe / phong cảnh | Toast thông báo lỗi "Không phải ảnh thức ăn", không crash | ✅ Pass |
| TC_AI_04 | Tra cứu nguyên liệu AI | Tab AI / Library | Nhập tên nguyên liệu → tra cứu | Trả về calo/protein ước tính từ Gemini | ✅ Pass |
| TC_AI_05 | Gợi ý thực đơn AI | Có ≥3 món, có UserProfile | Tab Calendar → "AI Gợi ý" | Preview thực đơn 1 tuần dựa trên target calo/protein | ✅ Pass |
| TC_AI_06 | Áp dụng gợi ý AI | TC_AI_05 hiển thị preview | Click "Áp dụng" trong modal preview | Calendar cập nhật với thực đơn được gợi ý | ✅ Pass |
| TC_AI_07 | AI timeout | API chậm / không phản hồi | (Simulate offline) Phân tích ảnh | Sau 30s hiển thị toast lỗi, UI không bị freeze | ✅ Pass |

---

### TC_SHOP — Grocery List

| ID | Tên | Điều kiện tiên quyết | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|----|-----|---------------------|----------------|-----------------|-----------|
| TC_SHOP_01 | Tạo grocery từ kế hoạch | Tuần hiện tại có ≥1 bữa | Tab Grocery → "Tạo danh sách" | Danh sách nguyên liệu cần mua với tổng số lượng | ✅ Pass |
| TC_SHOP_02 | Tick mua xong | Có grocery list | Tick checkbox nguyên liệu đã mua | Item hiển thị strikethrough / chuyển sang "đã mua" | ✅ Pass |
| TC_SHOP_03 | Xóa grocery list | Có grocery list | Click "Xóa danh sách" → confirm | Grocery list trống | ✅ Pass |

---

### TC_SET — Settings

| ID | Tên | Điều kiện tiên quyết | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|----|-----|---------------------|----------------|-----------------|-----------|
| TC_SET_01 | Cập nhật cân nặng | Tab Settings | Sửa cân nặng → lưu | Mục tiêu protein cập nhật (weight × ratio) | ✅ Pass |
| TC_SET_02 | ~~Đổi ngôn ngữ~~ | — | — | *Đã xóa — chỉ hỗ trợ Tiếng Việt (v7.0)* | N/A |
| TC_SET_04 | Cập nhật mục tiêu calo | Tab Settings | Sửa targetCalories → lưu | Dashboard calo/ngày hiển thị target mới | ✅ Pass |

---

### TC_BAK — Backup & Restore

| ID | Tên | Điều kiện tiên quyết | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|----|-----|---------------------|----------------|-----------------|-----------|
| TC_BAK_01 | Export dữ liệu | Có dữ liệu trong app | Tab Settings → Export | Hiển thị Android Share sheet, file JSON được tạo | ✅ Pass |
| TC_BAK_02 | Import dữ liệu hợp lệ | Có file backup JSON | Settings → Import → chọn file | Dữ liệu được restore, toast thành công | ✅ Pass |
| TC_BAK_03 | Import file không hợp lệ | Settings → Import | Chọn file JSON ngẫu nhiên không đúng schema | Toast lỗi, dữ liệu hiện tại không bị ghi đè | ✅ Pass |

---

### TC_RESP — Responsive UI

| ID | Tên | Điều kiện tiên quyết | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|----|-----|---------------------|----------------|-----------------|-----------|
| TC_RESP_01 | Bottom navigation hiển thị | App mở | Kiểm tra 5 nav tabs | Tất cả 5 tabs hiển thị và click được | ✅ Pass |
| TC_RESP_02 | Tab switching active state | Nav tab hiển thị | Click từng tab | Active tab thay đổi tương ứng | ✅ Pass |
| TC_RESP_03 | List view persistence | Tab Library | Chuyển sang list view | Layout chuyển sang list và lưu preference | ✅ Pass |
| TC_RESP_04 | Grid view persistence | List view đang bật | Chuyển sang grid view | Layout chuyển sang grid và lưu preference | ✅ Pass |
| TC_RESP_05 | Layout persist after reload | Đã chọn layout | Reload app | Layout preference vẫn giữ nguyên | ✅ Pass |
| TC_RESP_06 | Touch targets minimum 44px | Nav bar hiển thị | Đo kích thước button | Touch target ≥ 44px | ✅ Pass |
| TC_RESP_07 | Add button visibility | Tab Library | Kiểm tra nút thêm | Add dish button hiển thị rõ ràng | ✅ Pass |

---

### TC_I18N — i18n (Vietnamese Only)

> **v7.0**: Đã xóa tính năng chuyển đổi ngôn ngữ. Ứng dụng chỉ hỗ trợ Tiếng Việt. Các test case EN↔VI switching đã bị loại bỏ.

| ID | Tên | Điều kiện tiên quyết | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|----|-----|---------------------|----------------|-----------------|-----------|
| TC_I18N_01 | UI hiển thị Tiếng Việt | App mở | Kiểm tra tất cả labels, nav tabs | Toàn bộ UI hiển thị bằng Tiếng Việt | ✅ Pass |
| TC_I18N_02 | Validation messages Tiếng Việt | App mở | Submit form rỗng | Lỗi validation hiển thị bằng Tiếng Việt | ✅ Pass |
| TC_I18N_03 | t() function coverage | App mở | Navigate tất cả tabs | Không có hardcoded English text | ✅ Pass |

---

### TC_DET — Detail Modal

| ID | Tên | Điều kiện tiên quyết | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|----|-----|---------------------|----------------|-----------------|-----------|
| TC_DET_01 | Open dish detail | Có dish trong library | Click tên dish | DetailModal mở hiển thị tên + nutrition | ✅ Pass |
| TC_DET_02 | Dish nutrition display | DetailModal mở | Kiểm tra nutrition info | Hiển thị calories, protein | ✅ Pass |
| TC_DET_03 | Edit from detail | DetailModal mở | Click Edit button | Mở DishEditModal | ✅ Pass |
| TC_DET_04 | Close detail modal | DetailModal mở | Click Close button | Modal đóng | ✅ Pass |
| TC_DET_05 | Ingredient detail | Có ingredient | Click ingredient | DetailModal hiển thị nutrition per 100g | ✅ Pass |

---

### TC_DEL — Delete Guard & Undo

| ID | Tên | Điều kiện tiên quyết | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|----|-----|---------------------|----------------|-----------------|-----------|
| TC_DEL_01 | Delete confirmation modal | Dish không dùng trong plan | Click xóa dish | ConfirmationModal hiển thị | ✅ Pass |
| TC_DEL_02 | Cancel delete | ConfirmationModal hiển thị | Click Cancel | Dish vẫn còn | ✅ Pass |
| TC_DEL_03 | Confirm delete + undo toast | ConfirmationModal hiển thị | Click Confirm | Dish bị xóa + undo toast hiển thị | ✅ Pass |
| TC_DEL_04 | In-use dish delete warning | Dish đang dùng trong plan | Click xóa | Warning toast, không xóa | ✅ Pass |
| TC_DEL_05 | Delete standalone ingredient | Ingredient không dùng bởi dish nào | Click xóa → confirm | Ingredient bị xóa khỏi danh sách | ✅ Pass |

---

### TC_EDGE — Error Handling & Edge Cases

| ID | Tên | Điều kiện tiên quyết | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|----|-----|---------------------|----------------|-----------------|-----------|
| TC_EDGE_01 | Empty grocery state | Không có plan nào | Mở Grocery tab | Hiển thị empty state | ✅ Pass |
| TC_EDGE_02 | Dark theme CSS | App mở | Settings → Dark | HTML element có class "dark" | ✅ Pass |
| TC_EDGE_03 | Light theme CSS | Dark theme đang bật | Settings → Light | HTML element không có class "dark" | ✅ Pass |
| TC_EDGE_04 | Theme persist | Đã chọn theme | Reload app | Theme preference lưu trong localStorage | ✅ Pass |
| TC_EDGE_05 | localStorage corruption | App mở | Inject corrupt data → reload | App không crash, xử lý gracefully | ✅ Pass |

---

### TC_INTEG — Deep Integration Tests

| ID | Tên | Điều kiện tiên quyết | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|----|-----|---------------------|----------------|-----------------|-----------|
| TC_INTEG_01 | Calendar calories from plan | Inject ingredient + dish + plan | Mở Calendar | Hiển thị đúng calories từ dish đã plan | ✅ Pass |
| TC_INTEG_02 | Grocery shows planned ingredient | Plan có dish với ingredient | Mở Grocery | Ingredient hiển thị trong grocery list | ✅ Pass |
| TC_INTEG_03 | Clear plan empties grocery | Đã plan bữa ăn | Clear day plan → Grocery | Grocery trống hoặc empty state | ✅ Pass |
| TC_INTEG_04 | Re-plan repopulates grocery | Plan đã bị clear | Inject plan lại → reload → Grocery | Grocery hiển thị lại ingredient | ✅ Pass |
| TC_INTEG_05 | Delete ingredient cascade | Ingredient dùng trong dish | Xóa ingredient → kiểm tra dish | Dish không còn ingredient đã xóa | ✅ Pass |
| TC_INTEG_06 | Grocery reflects deletion | Ingredient đã xóa | Mở Grocery | Grocery không hiển thị ingredient đã xóa | ✅ Pass |
| TC_INTEG_07 | Import data cross-tab | Import backup JSON | Kiểm tra tất cả tabs | Data accessible từ mọi tab | ✅ Pass |

---

### TC_MULTI — Multi-day & Cross-tab

| ID | Tên | Điều kiện tiên quyết | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|----|-----|---------------------|----------------|-----------------|-----------|
| TC_MULTI_01 | Day scope grocery | Inject plan cho today | Grocery → Day scope | Chỉ hiển thị ingredients hôm nay | ✅ Pass |
| TC_MULTI_02 | Week scope aggregation | Inject plan cho 2 ngày | Grocery → Week scope | Aggregates ingredients cả 2 ngày | ✅ Pass |
| TC_MULTI_03 | Clear today keeps tomorrow | Có plan 2 ngày | Clear today → Week scope | Vẫn có ingredients ngày mai | ✅ Pass |
| TC_LANG_INTEG_01 | Vietnamese nav labels | App mở | Kiểm tra nav labels | Labels hiển thị tiếng Việt | ✅ Pass |
| TC_THEME_INTEG_01 | Dark theme all tabs | Settings → Dark | Navigate tất cả tabs | Class "dark" áp dụng mọi nơi | ✅ Pass |
| TC_THEME_INTEG_02 | Theme persist reload | Dark theme đang bật | Reload app | Dark theme vẫn giữ | ✅ Pass |
| TC_THEME_INTEG_03 | Light theme restore | Settings → Light | Kiểm tra tất cả tabs | Class "dark" bị xóa | ✅ Pass |
| TC_NUTR_CASCADE_01 | Nutrition edit cascade | Có ingredient trong dish | Edit ingredient nutrition → check dish | Dish calories cập nhật theo | ✅ Pass |

---

### TC_DM — Dark Mode Visual QA (Chrome DevTools)

| ID | Tên | Điều kiện tiên quyết | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|----|-----|---------------------|----------------|-----------------|-----------|
| TC_DM_01 | Calendar dark mode | Dark mode bật | Tab Lịch trình → kiểm tra calendar, ngày, tuần | Background tối, text trắng/sáng, ngày selected có contrast tốt | ✅ Pass |
| TC_DM_02 | Meal plan cards dark | Dark mode + có plan | Xem meal slots (Sáng/Trưa/Tối) | Cards có dark background, text đọc được, nutrition badges visible | ✅ Pass |
| TC_DM_03 | Action bar active states | Dark mode + có plan | Nhấn giữ nút xóa/copy/save/template | Active state hiển thị `dark:active:bg-{color}-900/30`, không flash trắng | ✅ Pass (Fixed BUG-DM-001) |
| TC_DM_04 | Date nav active states | Dark mode | Nhấn giữ nút prev/next/toggle view | Active state `dark:active:bg-slate-600`, không flash `bg-slate-200` | ✅ Pass (Fixed BUG-DM-001) |
| TC_DM_05 | Library dark mode | Dark mode | Tab Thư viện → kiểm tra list nguyên liệu + món ăn | Cards, text, borders đều có dark variant | ✅ Pass |
| TC_DM_06 | AI Analysis dark mode | Dark mode | Tab AI Phân tích → upload ảnh | Skeleton loader dùng `dark:bg-slate-700`, container dùng `dark:bg-slate-800` | ✅ Pass (Fixed BUG-DM-001) |
| TC_DM_07 | Shopping list dark mode | Dark mode | Tab Đi chợ → kiểm tra danh sách | Background tối, ingredient text trắng, checkbox visible | ✅ Pass |
| TC_DM_08 | Settings dark mode | Dark mode | Tab Cài đặt | Theme buttons, language buttons có contrast tốt | ✅ Pass |
| TC_DM_09 | AI Suggestion modal dark | Dark mode + Calendar | Click "Gợi ý AI" → xem preview modal | Meal type cards dùng `dark:bg-{color}-900/20`, text `dark:text-{color}-400` | ✅ Pass (Fixed BUG-DM-001) |
| TC_DM_10 | Nutrition progress dark | Dark mode + có plan | Xem Dinh dưỡng trong ngày | Progress bars, số liệu, labels đều đọc được | ✅ Pass |
| TC_DM_11 | Console clean dark mode | Dark mode, tất cả tabs | Mở DevTools Console → navigate tất cả tabs | 0 errors, 0 warnings | ✅ Pass |

---

### TC_FLEX — Fitness Plan Flexibility

> **v7.0**: 23 test cases cho tính năng Fitness Plan Flexibility. Tham khảo scenarios: [SC41-multi-session-system.md](scenarios/SC41-multi-session-system.md), [SC42-plan-day-editor.md](scenarios/SC42-plan-day-editor.md), [SC43-freestyle-workout.md](scenarios/SC43-freestyle-workout.md).

#### Multi-Session System (SC41)

| ID | Tên | Điều kiện tiên quyết | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|----|-----|---------------------|----------------|-----------------|-----------|
| TC_FLEX_01 | SessionTabs ẩn khi chỉ có 1 session | Fitness tab mở, plan ngày có đúng 1 session | Mở tab Fitness → xem Plan sub-tab | SessionTabs không hiển thị, workout hiển thị trực tiếp không cần chọn tab | ✅ P0 |
| TC_FLEX_02 | SessionTabs hiển thị khi có 2+ sessions | Plan ngày có ≥2 sessions | Mở tab Fitness → xem Plan sub-tab | SessionTabs hiển thị với tên từng session, session đầu tiên được chọn mặc định | ✅ P0 |
| TC_FLEX_03 | AddSessionModal mở từ tab "+" | Plan ngày có ≥1 session, SessionTabs hiển thị | Click tab "+" ở cuối SessionTabs | AddSessionModal mở với các tùy chọn: Strength, Cardio, Freestyle | ✅ P0 |
| TC_FLEX_04 | Thêm session Strength với nhóm cơ | AddSessionModal đang mở | 1. Chọn "Strength"; 2. Chọn nhóm cơ (ví dụ: Ngực, Vai); 3. Click "Thêm" | Session mới xuất hiện trong SessionTabs, có danh sách bài tập theo nhóm cơ đã chọn | ✅ P0 |
| TC_FLEX_05 | Giới hạn tối đa 3 sessions | Plan ngày đã có 3 sessions | Click tab "+" trên SessionTabs | Tab "+" bị disabled hoặc hiển thị thông báo "Tối đa 3 buổi tập/ngày" | ✅ P1 |
| TC_FLEX_06 | Trạng thái training-partial trên TodaysPlanCard | Có 2 sessions, hoàn thành 1 session | Quay về Dashboard → xem TodaysPlanCard | TodaysPlanCard hiển thị trạng thái "training-partial" (ví dụ: "1/2 buổi hoàn thành") | ✅ P0 |
| TC_FLEX_07 | Chuyển đổi session thay đổi hiển thị workout | Có 2+ sessions với bài tập khác nhau | Click tab session thứ 2 trên SessionTabs | Danh sách bài tập thay đổi theo session được chọn | ✅ P1 |
| TC_FLEX_08 | Xóa session và kiểm tra reorder | Có 3 sessions (A, B, C) | 1. Long press session B; 2. Chọn "Xóa"; 3. Confirm | Session B bị xóa, SessionTabs hiển thị A và C, session_order cập nhật liên tục | ✅ P1 |

#### Plan Day Editor (SC42)

| ID | Tên | Điều kiện tiên quyết | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|----|-----|---------------------|----------------|-----------------|-----------|
| TC_FLEX_09 | Nút Edit mở PlanDayEditor full-screen | Plan ngày có ≥1 bài tập | Click nút "Chỉnh sửa" trên Plan sub-tab | PlanDayEditor mở dưới dạng full-screen overlay qua pushPage(), không render inline | ✅ P0 |
| TC_FLEX_10 | Danh sách bài tập hiển thị đúng | PlanDayEditor đang mở, session có 3 bài tập | Xem danh sách bài tập | Hiển thị đầy đủ tên, số set × rep, và thứ tự đúng với original_exercises | ✅ P0 |
| TC_FLEX_11 | Sắp xếp lại bài tập lên/xuống | PlanDayEditor mở, có ≥2 bài tập | 1. Click nút ↑ trên bài tập thứ 2; 2. Xác nhận thứ tự mới | Bài tập thứ 2 di chuyển lên vị trí 1, thứ tự cập nhật trên UI | ✅ P0 |
| TC_FLEX_12 | Xóa bài tập | PlanDayEditor mở, có ≥2 bài tập | 1. Click nút xóa trên bài tập; 2. Confirm | Bài tập bị xóa khỏi danh sách, các bài tập còn lại reindex | ✅ P0 |
| TC_FLEX_13 | Thêm bài tập qua selector | PlanDayEditor mở | 1. Click "Thêm bài tập"; 2. Chọn bài tập từ danh sách; 3. Confirm | Bài tập mới xuất hiện ở cuối danh sách | ✅ P1 |
| TC_FLEX_14 | Lưu thay đổi persist vào store | PlanDayEditor có thay đổi (reorder/add/remove) | Click "Lưu" | PlanDayEditor đóng, quay về Plan sub-tab, danh sách bài tập phản ánh thay đổi đã lưu trong Zustand store | ✅ P0 |
| TC_FLEX_15 | Dialog cảnh báo khi quay lại chưa lưu | PlanDayEditor có thay đổi chưa lưu | Click nút Back (←) | Hiển thị dialog "Bạn có thay đổi chưa lưu. Hủy bỏ?" với 2 nút: Hủy / Tiếp tục chỉnh sửa | ✅ P0 |

#### Freestyle Workout (SC43)

| ID | Tên | Điều kiện tiên quyết | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|----|-----|---------------------|----------------|-----------------|-----------|
| TC_FLEX_16 | Freestyle qua AddSessionModal mở WorkoutLogger | AddSessionModal đang mở | 1. Chọn "Freestyle"; 2. Confirm | WorkoutLogger mở full-screen qua pushPage() ở chế độ freestyle, không có plan bài tập sẵn | ✅ P0 |
| TC_FLEX_17 | Nhập tên buổi tập sau khi hoàn thành freestyle | WorkoutLogger freestyle, đã log ≥1 bài tập | Click "Hoàn thành" | Hiển thị prompt nhập tên buổi tập (ví dụ: "Tập tay + vai") | ✅ P0 |
| TC_FLEX_18 | Tên mặc định "Buổi tập tự do" khi bỏ qua | Prompt nhập tên đang hiển thị | Bỏ trống và click "Xác nhận" hoặc "Bỏ qua" | Buổi tập được lưu với tên mặc định "Buổi tập tự do" | ✅ P1 |
| TC_FLEX_19 | Freestyle lưu với planDayId=null | Hoàn thành buổi freestyle workout | Kiểm tra dữ liệu lưu trong store/SQLite | Record workout có planDayId=null, các bài tập và set được lưu đầy đủ | ✅ P0 |
| TC_FLEX_20 | Freestyle không ảnh hưởng trạng thái training | Có plan ngày với 1 session chưa tập | Tập freestyle → hoàn thành → quay về Plan sub-tab | Trạng thái training của session plan không thay đổi (vẫn "chưa tập") | ✅ P1 |

#### PageStack Bug Fix

| ID | Tên | Điều kiện tiên quyết | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|----|-----|---------------------|----------------|-----------------|-----------|
| TC_FLEX_21 | PlanDayEditor render full-screen overlay | Plan ngày có bài tập | Click "Chỉnh sửa" trên Plan sub-tab | PlanDayEditor render qua PageStackRenderer dưới dạng overlay phủ toàn màn hình, không phải inline trong tab | ✅ P0 |
| TC_FLEX_22 | WorkoutLogger render full-screen overlay | Session có bài tập | Click "Bắt đầu tập" trên Plan sub-tab | WorkoutLogger render qua PageStackRenderer dưới dạng overlay phủ toàn màn hình | ✅ P0 |
| TC_FLEX_23 | Nút Back đóng overlay và quay về view trước | PlanDayEditor hoặc WorkoutLogger đang mở overlay | Click nút Back (←) hoặc swipe back | Overlay đóng, quay về đúng view trước đó (Plan sub-tab), không bị trap trong page | ✅ P0 |

---

## E2E Tests — Kết quả

| Spec File | Số TCs | Pass | Fail | Status |
|-----------|--------|------|------|--------|
| `01-navigation.spec.ts` | 3 | 3 | 0 | ✅ |
| `02-calendar-basic.spec.ts` | 10 | 10 | 0 | ✅ |
| `03-dish-crud.spec.ts` | 13 | 13 | 0 | ✅ |
| `04-ingredient-crud.spec.ts` | 12 | 12 | 0 | ✅ |
| `05-planning.spec.ts` | 5 | 5 | 0 | ✅ |
| `06-grocery.spec.ts` | 6 | 6 | 0 | ✅ |
| `07-settings.spec.ts` | 5 | 5 | 0 | ✅ |
| `08-data-backup.spec.ts` | 5 | 5 | 0 | ✅ |
| `09-ai-analysis.spec.ts` | 5 | 5 | 0 | ✅ |
| `10-goal-settings.spec.ts` | 7 | 7 | 0 | ✅ |
| `11-responsive-ui.spec.ts` | 7 | 7 | 0 | ✅ |
| `12-i18n-language.spec.ts` | 7 | 7 | 0 | ✅ |
| `13-detail-modal.spec.ts` | 5 | 5 | 0 | ✅ |
| `14-delete-guard.spec.ts` | 5 | 5 | 0 | ✅ |
| `15-error-edge-cases.spec.ts` | 5 | 5 | 0 | ✅ |
| `16-deep-integration.spec.ts` | 7 | 7 | 0 | ✅ |
| `17-multi-day-scope.spec.ts` | 3 | 3 | 0 | ✅ |
| `18-lang-integration.spec.ts` | 3 | 3 | 0 | ✅ |
| `19-theme-integration.spec.ts` | 3 | 3 | 0 | ✅ |
| `20-nutrition-cascade.spec.ts` | 1 | 1 | 0 | ✅ |
| `21-layout-switcher.spec.ts` | 5 | 5 | 0 | ✅ |
| `22-sort-filter.spec.ts` | 7 | 7 | 0 | ✅ |
| `23-unit-selector.spec.ts` | 12 | 12 | 0 | ✅ |
| `24-ai-suggestion-preview.spec.ts` | 12 | 12 | 0 | ✅ |
| **TOTAL** | **183** | **183** | **0** | **✅ 100%** |

---

## Unit Test Summary

| File | Tests | Status |
|------|-------|--------|
| `aiImageAnalyzer.test.tsx` | ✓ | ✅ |
| `aiSuggestionPreview.test.tsx` | ✓ | ✅ |
| `analysisResultView.test.tsx` | ✓ | ✅ |
| `app.test.tsx` | ✓ (enhanced: ~47 tests, CRUD handlers, tab rendering, edge cases) | ✅ |
| `calendarAndDate.test.tsx` | ✓ (enhanced: DateSelector edge cases) | ✅ |
| `components.test.tsx` | ✓ (enhanced: UnitSelector, Navigation tests) | ✅ |
| `constantsAndData.test.ts` | ✓ | ✅ |
| `dataBackup.test.tsx` | ✓ (enhanced: import/export edge cases) | ✅ |
| `dataService.test.ts` | ✓ | ✅ |
| `dishEditModal.test.tsx` | ✓ (enhanced: validation, quick-add, edge cases) | ✅ |
| `ErrorBoundary.test.tsx` | ✓ | ✅ |
| `geminiService.test.ts` | ✓ (enhanced: retry, abort, cache tests) | ✅ |
| `groceryList.test.tsx` | ✓ (enhanced: scope/share tests) | ✅ |
| `helpers.test.ts` | ✓ | ✅ |
| `imageCapture.test.tsx` | ✓ (enhanced: camera edge cases) | ✅ |
| `imageCompression.test.ts` | ✓ | ✅ |
| `ingredientEditModal.test.tsx` | ✓ | ✅ |
| `integration.test.ts` | ✓ | ✅ |
| `logger.test.ts` | ✓ | ✅ |
| `main.test.tsx` | ✓ | ✅ |
| `managers.test.tsx` | ✓ (enhanced: list view, detail modal, delete tests) | ✅ |
| `modalBackdrop.test.tsx` | ✓ | ✅ |
| `navigationIndex.test.ts` | ✓ (NEW) | ✅ |
| `NotificationContext.test.tsx` | ✓ (enhanced: pause/resume tests) | ✅ |
| `nutrition.test.ts` | ✓ | ✅ |
| `planService.test.ts` | ✓ | ✅ |
| `planningModal.test.tsx` | ✓ | ✅ |
| `saveAnalyzedDishModal.test.tsx` | ✓ | ✅ |
| `settingsTab.test.tsx` | ✓ | ✅ |
| `smallModals.test.tsx` | ✓ | ✅ |
| `summaryAndManagement.test.tsx` | ✓ | ✅ |
| `tips.test.ts` | ✓ | ✅ |
| `translateQueueService.test.ts` | ✓ | ✅ |
| `useAISuggestion.test.ts` | ✓ | ✅ |
| `useDarkMode.test.ts` | ✓ | ✅ |
| `useItemModalFlow.test.ts` | ✓ | ✅ |
| `useListManager.test.ts` | ✓ | ✅ |
| `useModalBackHandler.test.ts` | ✓ | ✅ |
| `useModalManager.test.ts` | ✓ | ✅ |
| `usePersistedState.test.ts` | ✓ | ✅ |
| **TOTAL (47 files)** | **995 tests** | **✅ 100%** |

### Các lĩnh vực test mới bổ sung trong QA Cycle 2

| Lĩnh vực | File | Mô tả |
|-----------|------|-------|
| App.tsx CRUD handlers | `app.test.tsx` | Test toàn bộ add/edit/delete flows cho ingredients, dishes, plans |
| DishEditModal validation | `dishEditModal.test.tsx` | Quick-add ingredient flow, validation rules, edge cases |
| Manager list/detail views | `managers.test.tsx` | List view rendering, detail modal, delete confirmation |
| Gemini retry/abort/cache | `geminiService.test.ts` | Retry logic, AbortController, response caching |
| Camera edge cases | `imageCapture.test.tsx` | Permission denied, camera unavailable, format fallbacks |
| Grocery scope/share | `groceryList.test.tsx` | Weekly/daily scope, share via Android Share sheet |
| UnitSelector + Navigation | `components.test.tsx` | Custom unit dropdown, tab navigation indicators |
| Notification pause/resume | `NotificationContext.test.tsx` | Toast queue pause during modals, resume on close |
| DateSelector edge cases | `calendarAndDate.test.tsx` | Week boundary, year boundary, DST transitions |
| Import/export edge cases | `dataBackup.test.tsx` | Corrupt JSON, large files, partial restore |
| Navigation index | `navigationIndex.test.ts` | NEW file — navigation module barrel exports |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-06 | Initial test cases |
| 2.0 | 2026-03-06 | Unit test list đầy đủ 39 files; version header cập nhật |
| 3.0 | 2026-03-06 | QA Cycle 2: 866 tests (+195), 40 files (+1 navigationIndex.test.ts); enhanced test areas documented |
| 4.0 | 2026-03-07 | QA Cycle 3: 183 E2E tests across 24 specs (↑from 37/10). Added TC_RESP, TC_I18N, TC_DET, TC_DEL, TC_EDGE, TC_INTEG, TC_MULTI sections. 100% feature coverage with deep integration tests |
| 5.0 | 2026-03-07 | QA Cycle 4: Dark mode visual audit. Added TC_DM (11 test cases). Unit tests 866→995, test files 40→47. BUG-DM-001 fixed (4 components). Chrome DevTools MCP used for visual QA |
| 7.0 | 2026-03-13 | Removed English language support: deleted TC_SET_02/03 (EN switch), replaced TC_I18N_01-07 with Vietnamese-only TCs, removed TC_LANG_INTEG_02/03. Added BUG-NAN-001 fix documentation. Updated for Vite best practices audit changes (lazy loading, code splitting, strict mode). |
| 8.0 | 2026-07-05 | Fitness Plan Flexibility: Added TC_FLEX section (23 test cases — TC_FLEX_01 to TC_FLEX_23). Covers Multi-Session System (SC41), Plan Day Editor (SC42), Freestyle Workout (SC43), PageStack overlay rendering. Schema v2 migration (session_order, original_exercises, plan_day_id). |
