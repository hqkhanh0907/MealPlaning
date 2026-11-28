# Chuyển màn Lịch ăn sang Leptos

## Nghiệm thu Android 17

Cùng dữ liệu đầu vào trên hai bản, liên kết từ Tổng quan mở ngày, bữa và món đang chờ. Thêm 1,5 phần Phở bò, chuyển sang bữa tối, xóa, hoàn tác và chép sang tuần sau đều cho cùng kết quả SQLite.

Trong 19 trạng thái của Lịch ăn và Quản lý, cả 19 đích điều hướng đều khớp. Mười ảnh khớp từng pixel trong vùng ứng dụng. Bản cuối đã khôi phục khoảng trắng trong dòng `0 / 2,000 kcal`. Một số nét chữ sau khoảng trắng lệch tối đa một pixel vật lý. Phép thử lại cuối chỉ bao phủ hai vị trí chữ đã sửa.

Màn Angular vẫn cung cấp chuẩn đối chiếu. Lịch ăn mở từ thanh tab, Tổng quan và nút quay lại sau khi tạo món.

## Điểm vào và giới hạn

| Nơi gọi | Dữ liệu và hành vi cần giữ | Bằng chứng cần thu |
|---|---|---|
| `tabs.routes.ts`, `calendar.routes.ts` | Truy cập trực tiếp và từ thanh tab cùng dùng CalendarStore. | Mở cả ngày và tuần trong cùng tài khoản. |
| `DashboardPage.addMeal`, `navigateToPendingMeal`, `CalendarPage.ionViewWillEnter` | Ngày đích và món cần xem chỉ tiêu thụ một lần. Đợi kế hoạch đúng ngày trước khi cuộn và đặt tiêu điểm. | Mở ngày khác từ Tổng quan và kiểm nút của đúng món. |
| `CalendarStore`, `DayPlanRepository`, `NutritionStore` | SQL trả dinh dưỡng theo công thức cho món dự kiến. Món đã ăn dùng bản lưu tại lúc ghi. | Hiển thị số khác nhau cho hai món. So cả tổng bữa, macro và tiến độ. |
| `MealSlotCard`, `LoggingModal`, `DishContextMenuModal`, `ConfirmEatModal` | Ghi, bỏ ghi, sửa khẩu phần, chuyển bữa, sao chép, xóa và hoàn tác. | Nút và nhấn giữ 500 ms gọi cùng phương thức trang. Chỉ sửa khẩu phần món chưa ghi. |
| `UndoToastQueue`, `CalendarPage.onUndoTap` | Hoàn tác lần xóa ở đầu hàng chờ trong tám giây. | Phân biệt nút hoàn tác và đóng. |
| `DaySummaryCard`, `MacroRow`, `CalorieRing`, `DayRow` | Giữ ngày địa phương, làm tròn năng lượng và dải phần trăm. | So nhãn, thông báo trợ năng, biểu đồ và ngày tuần khi thiếu mục tiêu. |
| `onCopyFromYesterday`, `onConfirmCopyPreviousWeek`, `onCopyDatePicked` | Sao chép cũng phải kiểm ngày và giữ bữa đã ghi. | So trạng thái xác nhận và lệnh gửi tới store. |
| `onAiCta`, `onLoggingAiSuggestionsRequested` | Phân biệt tạo lịch ngày và gợi ý từng bữa. Bỏ phản hồi đến muộn khi đầu vào đổi. | Dùng dịch vụ cục bộ giả trong kiểm thử. Giữ phản hồi lỗi và trạng thái ngoại tuyến. |

## Quyền sở hữu

- Lớp host nằm trong `src/app/features/calendar/leptos/`. Host sử dụng bộ điều khiển CalendarPage, các hộp thoại dùng chung và API SQLite hiện có.
- Rust trong `crates/healthmate-leptos/src/calendar/` dựng thanh điều khiển, nội dung và hoàn tác. Ngày trống, tải dữ liệu, tuần và ngày có món dùng cùng đầu vào.
- `summary.rs` và `week.rs` sở hữu biểu đồ ngày và dòng tuần. Các file còn lại sở hữu món, sự kiện, nhấn giữ và vòng đời trình dựng.
- `picker.rs` dựng bộ chọn món và xử lý tìm kiếm, tab, khẩu phần, món yêu thích và gợi ý AI. Ionic mở và đóng bảng chọn.
- Quyền đăng ký module, cấu hình dựng và đường dẫn tham gia bản thử thuộc người tích hợp.

## Phép kiểm

Thử cùng ngày, món, trạng thái kết nối và mục tiêu trên hai trang. So DOM và lệnh chuyển xuống store. Phép kiểm Android dùng cùng SQLite cho cả hai bản. Giữ màn Angular khi tài nguyên WASM thiếu.

Chạy `node scripts/build-leptos.mjs` rồi chạy `npx ng test --configuration leptos-parity '--include=src/app/features/calendar/leptos/**/*.parity.ts' --watch=false --browsers=ChromeHeadless`.

| Bộ kiểm | Dữ liệu đối chiếu |
|---|---|
| `calendar.parity.ts` | Ngày có món, ngày trống, đang tải, thiếu mạng, tuần, nhấn giữ, mở món từ Tổng quan và tiêu điểm sau khi tải. |
| `calendar-metrics.parity.ts` | Dữ liệu của DaySummaryCard và DayRow gốc. Kiểm vòng tròn, màu, phần trăm, nhãn trợ năng, giới hạn chấm và tuần qua năm mới. |
| `logging/logging-picker.parity.ts` | Danh sách món, tìm kiếm tiếng Việt, món gần đây, món yêu thích, khẩu phần, gợi ý AI và mở trang tạo món sau khi đóng bảng. |
| `calendar-storage.parity.ts` | SQLite thật qua sql.js trên Chrome. So hàng dữ liệu sau khi ghi, sửa công thức, bỏ ghi, chuyển bữa, sao chép và hoàn tác xóa. |

Ca kiểm SQLite dùng món 100 kcal và 1,5 khẩu phần. Sau khi nguyên liệu tăng lên 200 kcal, món đã ghi giữ 150 kcal. Bỏ đánh dấu đưa món về 300 kcal. Dịch vụ AI giả trả một món cho bữa tối. Lời gọi lưu đi qua cùng CalendarStore và repository trên cả hai màn.
