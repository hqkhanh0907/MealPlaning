KẾ HOẠCH TRIỂN KHAI TAB SETTINGS
Tính năng bao gồm: Đa ngôn ngữ (i18n), Giao diện (Theme), và Quản lý Dữ liệu (Backup/Restore).

Giai đoạn 1: Chuẩn bị Thư viện và Cấu trúc
Thư viện: Cài đặt i18next, react-i18next, i18next-browser-languagedetector cho i18n. (Theme và Backup sử dụng API có sẵn của trình duyệt, không cần cài thêm thư viện).

Thư mục:

locales/: Chứa file JSON ngôn ngữ.

contexts/: Chứa ThemeProvider và MealPlanProvider.

utils/: (Mới) Thêm file backupUtils.ts để chứa logic xử lý file.

Giai đoạn 2: Thiết lập Type-safety (An toàn kiểu dữ liệu)
Kiểu i18n & Theme: Khai báo module cho i18next và type Theme = 'light' | 'dark' | 'system'.

Kiểu Dữ liệu Sao lưu (Mới): Định nghĩa một Interface tổng quát cho file backup để TypeScript kiểm soát quá trình Import/Export.

Ví dụ: interface BackupSchema { version: string; timestamp: number; settings: { theme: Theme; language: string }; mealPlans: MealPlan[]; }

Giai đoạn 3: Xây dựng Core Logic (Trọng tâm xử lý dữ liệu)
Logic i18n & Theme: Cấu hình instance i18next và xây dựng ThemeProvider (quản lý localStorage và matchMedia).

Logic Sao lưu (Export): Viết hàm exportToJson(). Hàm này sẽ gom toàn bộ state hiện tại (Cài đặt + Kế hoạch bữa ăn), chuyển thành chuỗi JSON (JSON.stringify), và dùng tạo một thẻ <a> ẩn để kích hoạt trình duyệt tải xuống file (VD: meal-planner-backup-2026.json).

Logic Khôi phục (Import): Viết hàm importFromJson(file). Hàm này dùng FileReader API để đọc file, dùng JSON.parse để dịch ngược, và quan trọng nhất là kiểm tra tính hợp lệ (Validate) xem file có đúng cấu trúc BackupSchema hay không.

Giai đoạn 4: Xây dựng UI Tab Settings
Khung giao diện Settings lúc này sẽ có 3 Tabs chính:

Tab 1 - Ngôn ngữ: Dropdown/Radio chọn ngôn ngữ.

Tab 2 - Giao diện: Nút chọn Sáng / Tối / Hệ thống.

Tab 3 - Dữ liệu (Mới):

Nút "Xuất dữ liệu" (Export): Có icon tải xuống.

Nút "Nhập dữ liệu" (Import): Bản chất là một thẻ <input type="file" accept=".json" /> được ẩn đi và kích hoạt qua một nút bấm tùy chỉnh.

Giai đoạn 5: Tích hợp Cảnh báo & Trải nghiệm (UX cho Restore)
Khi người dùng chọn file để Import, tuyệt đối không ghi đè ngay. Phải trải qua luồng sau:

Chặn lại: Hiển thị một Modal/Dialog cảnh báo nguy hiểm (Màu đỏ/vàng): "Hành động này sẽ xóa toàn bộ kế hoạch bữa ăn hiện tại của bạn và thay thế bằng dữ liệu từ file. Bạn có chắc chắn muốn tiếp tục?"

Xác nhận: Nếu người dùng bấm "Đồng ý", ứng dụng mới gọi hàm cập nhật lại State (của Theme, i18n, và MealPlan) và lưu vào localStorage.

Thông báo: Hiển thị một Toast notification (thông báo nhỏ góc màn hình): "Khôi phục dữ liệu thành công!".

Giai đoạn 6: Kiểm thử độ ổn định (Testing)
Test Đa ngôn ngữ & Theme: Đổi ngôn ngữ/giao diện và F5 trình duyệt để kiểm tra lưu trữ.

Test Backup (Happy Path): Tạo vài món ăn -> Bấm Export -> Tải file về mở ra xem cấu trúc JSON có đúng không. Xóa hết món ăn trên app -> Bấm Import -> Chọn file vừa tải -> Các món ăn xuất hiện trở lại.

Test Restore (Edge Cases):

Thử Import một file JSON linh tinh (không phải của app) xem hệ thống có báo lỗi "File không hợp lệ" thay vì bị crash không.

Thử bấm Import nhưng chọn "Hủy" ở bảng Cảnh báo xem dữ liệu cũ có được giữ nguyên an toàn không.