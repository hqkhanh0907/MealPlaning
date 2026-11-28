# Cài đặt trong Leptos

## Kết quả trên Android 17

Hai bản đều lưu tên mới qua máy chủ Rust thử nghiệm, giữ mục tiêu nhập tay khi đổi cân nặng và ghi đúng một mục trong nhật ký cân nặng. Hộp thoại quyền thông báo là hộp thoại Android thật. Từ chối giữ giá trị 0. Cho phép cập nhật giá trị thành 1.

Đối chiếu ảnh tìm ra lề nút Lưu, bóng tiêu đề và màu chữ hướng dẫn khác bản gốc. Sau khi sửa phạm vi CSS, hai màn Vận động và Mục tiêu khớp từng pixel. Dòng hướng dẫn khớp màu `#546078`. Tiêu đề Cơ thể có cùng đường viền với bản gốc.

Các route Cài đặt dùng cùng phiên tài khoản và SQLite với các tab. Màn gốc giữ vai trò đối chiếu.

## Điểm vào và rủi ro

| Đường chạy | Bên gọi và dữ liệu | Phép kiểm |
|---|---|---|
| `/settings` | Tổng quan, Lịch ăn, Quản lý và nút quay lại từ trang chỉnh sửa. Các guard kiểm phiên và hồ sơ. | So tiêu đề, tóm tắt, điều hướng và ngày địa phương giữa Angular và WASM. |
| `/settings/body` | ProfileStore, giới hạn số đo, ngày sinh, tuổi và mục tiêu tự tính. Hồ sơ cũ thiếu ngày sinh phải bổ sung trước khi lưu. | So lỗi, xem trước, payload và lần ghi SQLite. |
| `/settings/name` | AccountSession đổi tên tại máy chủ rồi cập nhật phiên. Tên trống hoặc trên 100 điểm mã không hợp lệ. | Kiểm tên tiếng Việt, khoảng trắng, lỗi mạng, double submit và điều hướng. |
| `/settings/goals` | Mục tiêu calorie, Protein, Carbs và Fat. Phân biệt thủ công, tự tính, số 0 và giá trị trống. | So ngưỡng, reset, giá trị lưu và xử lý thiếu ngày sinh. |
| `/settings/activity` | Hệ số vận động và kinh nghiệm tập. Hồ sơ cũ có thể thiếu hệ số khớp sẵn. | So lựa chọn, mức điều chỉnh, xem trước và hồ sơ ghi ra. |
| Nhắc nhở | LocalNotifications đọc quyền. ReminderCoordinator ghi lựa chọn và đặt lại lịch. | So hoàn nguyên toggle khi từ chối quyền, thông báo tạm dừng và cho phép lại. |
| Khóa AI | GroqCredentials mở hộp nhập gốc. Màn chỉ nhận trạng thái, phiên và kết quả. | Đổi tài khoản khi yêu cầu còn chạy. Kiểm hủy, cấp mới, gỡ và báo lỗi. |
| Phiên thiết bị | AccountSession tải và thu hồi. Phiên hiện tại được bảo vệ, tài khoản khác không thấy kết quả đến muộn. | So thông báo, xác nhận, hủy, ID và thu hồi. |
| Đồng bộ | AccountSync báo ngoại tuyến, hết phiên hoặc xung đột. Người dùng có thể chọn bản theo từng hiệp. | So nhãn, lựa chọn, thao tác bị khóa khi còn thiếu lựa chọn và quyết định áp dụng. |
| Đăng xuất | Xóa phiên, dọn lịch và rời ứng dụng về `/account`. | Dùng dịch vụ thử để kiểm lỗi, gọi lặp và thứ tự xử lý. |

## Triển khai và nghiệm thu

Trang chính và các panel nằm trong `crates/healthmate-leptos/src/settings/`. Các editor có thư mục sở hữu riêng. Host trong `src/app/features/settings/leptos/` nối các điểm vào cũ tới dịch vụ có quyền. Khóa AI và token không đi vào snapshot WASM.

Mỗi màn dùng đầu vào giống Angular. Kiểm DOM, trợ năng, ngày giờ, điều kiện vô hiệu và kết quả lưu. Người tích hợp đăng ký module, đường chạy thử và đối chiếu ảnh Android trước khi đổi mặc định.

## Hợp đồng và lệnh

`loadSettingsPage(kind)` phân giải năm route. Nếu không tải được module, loader trả đúng trang Angular của route đó. `mountSettings` nhận trạng thái hiển thị. `mountSettingsEditor` giữ bản nháp, tính ước lượng và gửi phần hồ sơ cần ghi.

Dùng `node scripts/build-leptos.mjs` rồi chạy `npx ng test --configuration leptos-parity '--include=src/app/features/settings/leptos/**/*.parity.ts' --watch=false --browsers=ChromeHeadless`.

| Bộ kiểm | Kết quả cần khớp |
|---|---|
| `settings.parity.ts` | Trạng thái đồng bộ, các lựa chọn xung đột, nhắc nhở, khóa AI và lỗi đăng xuất. Bỏ kết quả khi tài khoản đổi. |
| `devices.parity.ts` | Phân biệt máy hiện tại, danh sách trả muộn, phiên bị cấm và thao tác xác nhận thu hồi. Đối chiếu tên trợ năng của nút Ionic. |
| `editors.parity.ts` | Bốn trang chỉnh sửa. So nhãn, giá trị, lỗi, nhấn lưu, mục tiêu tự động và thủ công. |
| `profile-storage.parity.ts` | Hai màn cùng sửa cân nặng qua ProfileStore và SQLite. Giữ mục tiêu nhập tay, thêm một mục cân nặng và chỉ quay lại một lần. |

Luồng trên Chrome dùng phiên và khóa giả. Các phép kiểm gọi thật ProfileStore, UserProfileRepository, SQL và trigger ghi cân nặng.
