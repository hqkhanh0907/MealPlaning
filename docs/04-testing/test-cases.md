# Test Cases — Smart Meal Planner

**Version:** 1.0  
**Date:** 2026-03-06

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
| TC_SET_02 | Đổi ngôn ngữ | Tab Settings | Chọn Tiếng Anh | Toàn bộ UI chuyển sang English | ✅ Pass |
| TC_SET_03 | Đổi ngôn ngữ về Tiếng Việt | Ngôn ngữ đang là English | Chọn Tiếng Việt | UI chuyển lại tiếng Việt | ✅ Pass |
| TC_SET_04 | Cập nhật mục tiêu calo | Tab Settings | Sửa targetCalories → lưu | Dashboard calo/ngày hiển thị target mới | ✅ Pass |

---

### TC_BAK — Backup & Restore

| ID | Tên | Điều kiện tiên quyết | Bước thực hiện | Kết quả mong đợi | Trạng thái |
|----|-----|---------------------|----------------|-----------------|-----------|
| TC_BAK_01 | Export dữ liệu | Có dữ liệu trong app | Tab Settings → Export | Hiển thị Android Share sheet, file JSON được tạo | ✅ Pass |
| TC_BAK_02 | Import dữ liệu hợp lệ | Có file backup JSON | Settings → Import → chọn file | Dữ liệu được restore, toast thành công | ✅ Pass |
| TC_BAK_03 | Import file không hợp lệ | Settings → Import | Chọn file JSON ngẫu nhiên không đúng schema | Toast lỗi, dữ liệu hiện tại không bị ghi đè | ✅ Pass |

---

## E2E Tests — Kết quả

| Spec File | Số TCs | Pass | Fail | Status |
|-----------|--------|------|------|--------|
| `01-navigation.spec.ts` | 3 | 3 | 0 | ✅ |
| `02-calendar-basic.spec.ts` | 4 | 4 | 0 | ✅ |
| `03-dish-crud.spec.ts` | 5 | 5 | 0 | ✅ |
| `04-ingredient-crud.spec.ts` | 5 | 5 | 0 | ✅ |
| `05-planning.spec.ts` | 4 | 4 | 0 | ✅ |
| `06-grocery.spec.ts` | 3 | 3 | 0 | ✅ |
| `07-settings.spec.ts` | 3 | 3 | 0 | ✅ |
| `08-data-backup.spec.ts` | 3 | 3 | 0 | ✅ |
| `09-ai-analysis.spec.ts` | 4 | 4 | 0 | ✅ |
| `10-goal-settings.spec.ts` | 3 | 3 | 0 | ✅ |
| **TOTAL** | **37** | **37** | **0** | **✅ 100%** |

---

## Unit Test Summary

| File | Tests | Status |
|------|-------|--------|
| `aiImageAnalyzer.test.tsx` | ~35 | ✅ |
| `geminiService.test.ts` | ~60 | ✅ |
| `dataService.test.ts` | ~55 | ✅ |
| `planService.test.ts` | ~40 | ✅ |
| `calorieCalculator.test.ts` | ~30 | ✅ |
| `IngredientEditModal.test.tsx` | ~45 | ✅ |
| `CalendarTab.test.tsx` | ~50 | ✅ |
| `usePersistedState.test.ts` | ~25 | ✅ |
| (+ 31 other files) | ~328 | ✅ |
| **TOTAL** | **668** | **✅ 100%** |
