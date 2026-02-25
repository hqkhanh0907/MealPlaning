# TEST CASES — Smart Meal Planner v1.0

---

## Module 1: Navigation (NAV)

### TC_NAV_01: Chuyển tab trên Desktop
- **Tiền điều kiện:** App đang chạy tại localhost:3000, viewport >= 640px
- **Bước thực hiện:**
  1. Click tab "Lịch trình"
  2. Click tab "Quản lý"
  3. Click tab "AI Phân tích"
  4. Click tab "Đi chợ"
- **Kết quả mong đợi:** Mỗi tab hiển thị nội dung tương ứng, tab active có style `bg-white text-emerald-600 shadow-sm`
- **Trạng thái:** [ ]

### TC_NAV_02: Chuyển tab trên Mobile (Bottom Nav)
- **Tiền điều kiện:** App đang chạy, viewport < 640px
- **Bước thực hiện:**
  1. Tap từng icon trên bottom nav bar
  2. Quan sát tab active và content thay đổi
- **Kết quả mong đợi:** Tab active có màu emerald-600, có dot indicator, nội dung thay đổi đúng
- **Trạng thái:** [ ]

### TC_NAV_03: Header hiển thị tên tab trên Mobile
- **Tiền điều kiện:** viewport < 640px
- **Bước thực hiện:**
  1. Chuyển qua từng tab
  2. Quan sát header title
- **Kết quả mong đợi:** Header hiển thị tên tab hiện tại thay vì "Smart Meal Planner"
- **Trạng thái:** [ ]

### TC_NAV_04: AI Badge trên Bottom Nav
- **Tiền điều kiện:** viewport < 640px, đang ở tab khác (không phải AI)
- **Bước thực hiện:**
  1. AI phân tích hoàn tất (trigger `onAnalysisComplete`)
  2. Quan sát bottom nav icon AI
  3. Tap vào tab AI
- **Kết quả mong đợi:** Badge đỏ xuất hiện trên icon AI, biến mất khi chuyển sang tab AI
- **Trạng thái:** [ ]

---

## Module 2: Calendar Tab (CAL)

### TC_CAL_01: Hiển thị ngày hiện tại mặc định
- **Tiền điều kiện:** App vừa khởi động
- **Bước thực hiện:**
  1. Quan sát DateSelector
- **Kết quả mong đợi:** Ngày hiện tại được chọn (highlight), hiển thị ngày tháng đầy đủ
- **Trạng thái:** [ ]

### TC_CAL_02: Chọn ngày khác trên DateSelector
- **Tiền điều kiện:** Tab Calendar đang active
- **Bước thực hiện:**
  1. Click vào một ngày khác trên DateSelector
- **Kết quả mong đợi:** Ngày được chọn cập nhật, Summary và MealCards cập nhật theo ngày mới
- **Trạng thái:** [ ]

### TC_CAL_03: Mở TypeSelectionModal bằng nút "Lên kế hoạch"
- **Tiền điều kiện:** Tab Calendar active
- **Bước thực hiện:**
  1. Click nút "Lên kế hoạch"
- **Kết quả mong đợi:** TypeSelectionModal mở ra, hiển thị 3 bữa (Sáng, Trưa, Tối)
- **Trạng thái:** [ ]

### TC_CAL_04: Lên kế hoạch bữa ăn qua PlanningModal
- **Tiền điều kiện:** TypeSelectionModal đang mở
- **Bước thực hiện:**
  1. Chọn "Bữa Sáng"
  2. PlanningModal mở, chọn 1 hoặc nhiều món ăn
  3. Click "Xác nhận"
- **Kết quả mong đợi:** Modal đóng, MealCard "Bữa Sáng" hiển thị món đã chọn, Summary cập nhật
- **Trạng thái:** [ ]

### TC_CAL_05: Xóa kế hoạch qua MoreMenu
- **Tiền điều kiện:** Đã có kế hoạch cho ngày hiện tại
- **Bước thực hiện:**
  1. Click icon MoreVertical (⋮)
  2. Chọn "Xóa kế hoạch"
  3. ClearPlanModal mở, chọn scope (ngày/tuần/tháng)
  4. Xác nhận xóa
- **Kết quả mong đợi:** Kế hoạch bị xóa theo scope, MealCards trở về trạng thái trống
- **Trạng thái:** [ ]

### TC_CAL_06: Gợi ý AI (nút "Gợi ý AI")
- **Tiền điều kiện:** Tab Calendar active, có món ăn trong thư viện
- **Bước thực hiện:**
  1. Click nút "Gợi ý AI"
  2. Quan sát loading state
- **Kết quả mong đợi:** Nút disabled + spinner khi đang gọi API. Nếu thành công: toast success + MealCards cập nhật. Nếu thất bại: toast error
- **Trạng thái:** [ ]

### TC_CAL_07: Dynamic Tips trong RecommendationPanel
- **Tiền điều kiện:** Tab Calendar active
- **Bước thực hiện:**
  1. Không có kế hoạch → quan sát tips
  2. Thêm 1-2 bữa → quan sát tips thay đổi
  3. Hoàn tất 3 bữa → quan sát tips
- **Kết quả mong đợi:** Tips thay đổi động: chưa có plan → info tip; thiếu bữa → warning; đầy đủ → success/cân đối
- **Trạng thái:** [ ]

### TC_CAL_08: GoalSettingsModal - Cập nhật mục tiêu
- **Tiền điều kiện:** Tab Calendar active
- **Bước thực hiện:**
  1. Click nút cài đặt mục tiêu trên Summary
  2. GoalSettingsModal mở
  3. Thay đổi cân nặng, tỷ lệ protein, target calories
  4. Click "Hoàn tất"
- **Kết quả mong đợi:** Modal đóng, Summary cập nhật với mục tiêu mới, toast thông báo
- **Trạng thái:** [ ]

---

## Module 3: Management Tab (MGT)

### TC_MGT_01: Chuyển sub-tab Món ăn / Nguyên liệu
- **Tiền điều kiện:** Tab Thư viện active
- **Bước thực hiện:**
  1. Click tab "Món ăn"
  2. Click tab "Nguyên liệu"
- **Kết quả mong đợi:** Nội dung chuyển đổi đúng, tab active có style highlight
- **Trạng thái:** [ ]

### TC_MGT_02: Thêm nguyên liệu mới
- **Tiền điều kiện:** Sub-tab "Nguyên liệu" active
- **Bước thực hiện:**
  1. Click "Thêm nguyên liệu"
  2. Modal mở, nhập tên, đơn vị, thông tin dinh dưỡng
  3. Click "Lưu nguyên liệu"
- **Kết quả mong đợi:** Modal đóng, nguyên liệu mới xuất hiện trong danh sách
- **Trạng thái:** [ ]

### TC_MGT_03: AI tự động điền thông tin nguyên liệu
- **Tiền điều kiện:** Modal thêm nguyên liệu đang mở
- **Bước thực hiện:**
  1. Nhập tên nguyên liệu (vd: "Thịt gà")
  2. Nhập đơn vị (vd: "g")
  3. Click nút AI (✨)
- **Kết quả mong đợi:** Loading spinner, sau đó tự động điền calories, protein, carbs, fat, fiber
- **Trạng thái:** [ ]

### TC_MGT_04: Sửa nguyên liệu
- **Tiền điều kiện:** Có ít nhất 1 nguyên liệu
- **Bước thực hiện:**
  1. Click "Sửa" trên card nguyên liệu
  2. Thay đổi thông tin
  3. Click "Lưu"
- **Kết quả mong đợi:** Thông tin cập nhật trên card
- **Trạng thái:** [ ]

### TC_MGT_05: Xóa nguyên liệu (không đang dùng)
- **Tiền điều kiện:** Có nguyên liệu không thuộc món ăn nào
- **Bước thực hiện:**
  1. Click "Xóa" trên card nguyên liệu
  2. ConfirmationModal mở
  3. Click "Xóa ngay"
- **Kết quả mong đợi:** Nguyên liệu bị xóa khỏi danh sách
- **Trạng thái:** [ ]

### TC_MGT_06: Xóa nguyên liệu đang được sử dụng
- **Tiền điều kiện:** Nguyên liệu đang thuộc 1+ món ăn
- **Bước thực hiện:**
  1. Click "Xóa" trên card nguyên liệu
- **Kết quả mong đợi:** Toast warning "Không thể xóa", nút xóa có style disabled
- **Trạng thái:** [ ]

### TC_MGT_07: Relationship tags trên nguyên liệu
- **Tiền điều kiện:** Nguyên liệu đang được dùng trong 1+ món ăn
- **Bước thực hiện:**
  1. Quan sát card nguyên liệu
- **Kết quả mong đợi:** Hiển thị "Dùng trong: Tên món 1, Tên món 2" hoặc "Dùng trong: Tên món 1, Tên món 2 +N"
- **Trạng thái:** [ ]

### TC_MGT_08: Thêm món ăn mới
- **Tiền điều kiện:** Sub-tab "Món ăn" active, có nguyên liệu
- **Bước thực hiện:**
  1. Click "Thêm món ăn"
  2. Modal mở, nhập tên, chọn tags (Sáng/Trưa/Tối), thêm nguyên liệu
  3. Click "Lưu"
- **Kết quả mong đợi:** Modal đóng, món ăn mới xuất hiện trong danh sách
- **Trạng thái:** [ ]

### TC_MGT_09: Stepper +/- buttons cho lượng nguyên liệu
- **Tiền điều kiện:** Modal thêm/sửa món ăn, đã thêm nguyên liệu
- **Bước thực hiện:**
  1. Click nút "+" → lượng tăng 10
  2. Click nút "-" → lượng giảm 10
  3. Nhập trực tiếp vào input
- **Kết quả mong đợi:** Giá trị thay đổi đúng, không cho phép giá trị < 0.1
- **Trạng thái:** [ ]

### TC_MGT_10: Tag filter chips cho món ăn
- **Tiền điều kiện:** Sub-tab "Món ăn" active, có nhiều món ăn
- **Bước thực hiện:**
  1. Click chip "🌅 Sáng"
  2. Click chip "🌤️ Trưa"
  3. Click chip "Tất cả"
- **Kết quả mong đợi:** Danh sách lọc theo tag tương ứng, chip active có style emerald
- **Trạng thái:** [ ]

### TC_MGT_11: Tìm kiếm món ăn
- **Tiền điều kiện:** Sub-tab "Món ăn" active
- **Bước thực hiện:**
  1. Nhập từ khóa vào ô tìm kiếm
- **Kết quả mong đợi:** Danh sách lọc real-time theo tên
- **Trạng thái:** [ ]

### TC_MGT_12: Empty state CTA - Món ăn
- **Tiền điều kiện:** Không có món ăn nào (hoặc filter trả về rỗng)
- **Bước thực hiện:**
  1. Quan sát empty state
- **Kết quả mong đợi:** Hiển thị icon, text mô tả, nút CTA "Tạo món ăn" (khi không search)
- **Trạng thái:** [ ]

### TC_MGT_13: Empty state CTA - Nguyên liệu
- **Tiền điều kiện:** Không có nguyên liệu nào
- **Bước thực hiện:**
  1. Quan sát empty state
- **Kết quả mong đợi:** Hiển thị icon, text mô tả, nút CTA "Thêm nguyên liệu"
- **Trạng thái:** [ ]

### TC_MGT_14: Data Backup - Xuất dữ liệu
- **Tiền điều kiện:** Tab Thư viện active, có dữ liệu
- **Bước thực hiện:**
  1. Scroll xuống phần "Sao lưu & Khôi phục"
  2. Click "Xuất dữ liệu"
- **Kết quả mong đợi:** File JSON được tải xuống, toast success
- **Trạng thái:** [ ]

### TC_MGT_15: Data Backup - Nhập dữ liệu
- **Tiền điều kiện:** Có file backup JSON hợp lệ
- **Bước thực hiện:**
  1. Click "Nhập dữ liệu"
  2. Chọn file backup
- **Kết quả mong đợi:** Toast success, trang reload sau 1.5s, dữ liệu khôi phục
- **Trạng thái:** [ ]

---

## Module 4: Grocery Tab (GRC)

### TC_GRC_01: Hiển thị danh sách đi chợ theo tab
- **Tiền điều kiện:** Có kế hoạch bữa ăn cho ngày/tuần hiện tại
- **Bước thực hiện:**
  1. Chuyển sang tab "Đi chợ"
  2. Chuyển giữa các tab: "Hôm nay", "Tuần này", "Tất cả"
- **Kết quả mong đợi:** Danh sách nguyên liệu thay đổi theo phạm vi
- **Trạng thái:** [ ]

### TC_GRC_02: Checkbox đánh dấu nguyên liệu đã mua
- **Tiền điều kiện:** Danh sách đi chợ có items
- **Bước thực hiện:**
  1. Click checkbox trên 1 item
- **Kết quả mong đợi:** Item bị gạch ngang (line-through), progress bar cập nhật
- **Trạng thái:** [ ]

### TC_GRC_03: Empty state khi không có kế hoạch
- **Tiền điều kiện:** Không có kế hoạch bữa ăn
- **Bước thực hiện:**
  1. Chuyển sang tab "Đi chợ"
- **Kết quả mong đợi:** Hiển thị empty state với CTA hướng dẫn lên kế hoạch
- **Trạng thái:** [ ]

---

## Module 5: AI Analysis Tab (AI)

### TC_AI_01: Upload ảnh để phân tích
- **Tiền điều kiện:** Tab AI active
- **Bước thực hiện:**
  1. Click "Tải ảnh lên" hoặc drag & drop
  2. Chọn ảnh món ăn
- **Kết quả mong đợi:** Ảnh hiển thị trong preview area
- **Trạng thái:** [ ]

### TC_AI_02: Skeleton loading khi phân tích
- **Tiền điều kiện:** Đã upload ảnh
- **Bước thực hiện:**
  1. Click "Phân tích món ăn"
  2. Quan sát panel kết quả
- **Kết quả mong đợi:** Skeleton loading (pulse animation) hiển thị thay cho kết quả, text "AI đang phân tích..."
- **Trạng thái:** [ ]

### TC_AI_03: Hiển thị kết quả phân tích
- **Tiền điều kiện:** Phân tích hoàn tất thành công
- **Bước thực hiện:**
  1. Quan sát panel kết quả
- **Kết quả mong đợi:** Hiển thị tên món, mô tả, 4 ô dinh dưỡng (Calo, Protein, Carbs, Fat), bảng nguyên liệu chi tiết
- **Trạng thái:** [ ]

### TC_AI_04: Lưu kết quả phân tích vào thư viện
- **Tiền điều kiện:** Có kết quả phân tích
- **Bước thực hiện:**
  1. Click "Lưu vào thư viện món ăn"
  2. SaveModal mở, chỉnh sửa thông tin
  3. Click "Xác nhận lưu"
- **Kết quả mong đợi:** Toast success, chuyển sang tab Thư viện, món ăn/nguyên liệu mới xuất hiện
- **Trạng thái:** [ ]

---

## Module 6: Error Handling & Data Persistence (ERR)

### TC_ERR_01: ErrorBoundary bắt lỗi per tab
- **Tiền điều kiện:** Tab bất kỳ đang active
- **Bước thực hiện:**
  1. (Giả lập lỗi trong component)
- **Kết quả mong đợi:** ErrorBoundary hiển thị fallback UI với title tương ứng, nút "Thử lại" và "Tải lại trang"
- **Trạng thái:** [ ] (Manual/Dev inspection)

### TC_ERR_02: Data persistence qua localStorage
- **Tiền điều kiện:** Đã có dữ liệu (nguyên liệu, món ăn, kế hoạch, profile)
- **Bước thực hiện:**
  1. Refresh trang (F5)
  2. Quan sát dữ liệu
- **Kết quả mong đợi:** Tất cả dữ liệu được giữ nguyên sau reload
- **Trạng thái:** [ ]

### TC_ERR_03: Notification System
- **Tiền điều kiện:** App đang chạy
- **Bước thực hiện:**
  1. Thực hiện action tạo success toast (vd: lưu món ăn)
  2. Thực hiện action tạo error toast (vd: gọi AI thất bại)
  3. Thực hiện action tạo warning toast (vd: xóa nguyên liệu đang dùng)
- **Kết quả mong đợi:** Toast hiển thị đúng loại (success/error/warning), tự dismiss sau timeout, có nút close
- **Trạng thái:** [ ]

---

## Module 7: Responsive Design (RES)

### TC_RES_01: Modal dạng Bottom Sheet trên Mobile
- **Tiền điều kiện:** viewport < 640px
- **Bước thực hiện:**
  1. Mở bất kỳ modal nào
- **Kết quả mong đợi:** Modal hiển thị từ dưới lên (items-end), rounded-t-3xl, full width
- **Trạng thái:** [ ]

### TC_RES_02: Modal centered trên Desktop
- **Tiền điều kiện:** viewport >= 640px
- **Bước thực hiện:**
  1. Mở bất kỳ modal nào
- **Kết quả mong đợi:** Modal hiển thị giữa màn hình, rounded-3xl, max-width giới hạn
- **Trạng thái:** [ ]

### TC_RES_03: Touch targets >= 44px trên Mobile
- **Tiền điều kiện:** viewport < 640px
- **Bước thực hiện:**
  1. Kiểm tra kích thước các nút, input, checkbox
- **Kết quả mong đợi:** Tất cả phần tử tương tác có min-height >= 44px (min-h-11)
- **Trạng thái:** [ ]

### TC_RES_04: Input font-size >= 16px trên Mobile
- **Tiền điều kiện:** viewport < 640px
- **Bước thực hiện:**
  1. Kiểm tra font-size của input/textarea
- **Kết quả mong đợi:** Font-size >= 16px (text-base) để tránh iOS auto-zoom
- **Trạng thái:** [ ]

---

## Tổng kết

| Module | Số TC | Đã test | Pass | Fail |
|--------|-------|---------|------|------|
| NAV    | 4     |         |      |      |
| CAL    | 8     |         |      |      |
| MGT    | 15    |         |      |      |
| GRC    | 3     |         |      |      |
| AI     | 4     |         |      |      |
| ERR    | 3     |         |      |      |
| RES    | 4     |         |      |      |
| **Tổng** | **41** |     |      |      |

