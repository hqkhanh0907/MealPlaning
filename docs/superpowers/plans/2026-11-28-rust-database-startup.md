# Khởi tạo SQLite bằng Rust trên Android

Android mở tệp của tài khoản sau khi khôi phục phiên. Rust tạo schema, bật WAL và chuẩn bị theo dõi thay đổi. Kết nối Capacitor vẫn phục vụ các repository đang chuyển dần.

| Luồng | Trước | Sau | Điểm đối chiếu |
|---|---|---|---|
| Cài mới và đăng nhập | NativeDatabase dựng bảng qua migration TypeScript | Dùng cùng schema Rust trên database mới của đúng tài khoản | Phiên bản, cột, mặc định, khóa ngoại, trigger và số hàng ban đầu |
| Mở lại ứng dụng | Đọc SQLite đã có rồi tải hồ sơ | Lặp lại khởi tạo an toàn, giữ dữ liệu vừa ghi | Một hồ sơ, đúng tài khoản, giữ phiên bản đồng bộ |
| Đổi tài khoản khi đang mở | Đường dẫn gắn với tài khoản | Vault kiểm chủ và tên DB trước khi Rust mở tệp | Không tạo tệp cho chủ khác hoặc khi mất quyền |
| Dữ liệu mẫu và hiển thị | App tải hồ sơ trước rồi mới lên lịch nạp dữ liệu mẫu | Giữ thứ tự này và quyền ghi của repository đang dùng | Khởi tạo không tự tạo hồ sơ, buổi tập hay bữa ăn |

Điểm vào là `provideDatabaseService`, `NativeDatabase.initialize`, `ProfileStore.loadProfile` và `AccountSync.initialize`. Mỗi kết nối Capacitor phải bật khóa ngoại trên chính kết nối đó sau khi Rust chuẩn bị tệp. Lượt này chỉ xét cài mới và dữ liệu do bản hiện tại tạo.

| Công việc | Phép kiểm |
|---|---|
| Gọi điểm vào Rust với tệp chưa tồn tại | Kiểm schema và dữ liệu trống. Từ chối cặp owner và database không khớp |
| Mở lại tệp bằng cả hai đầu đọc | Kiểm dữ liệu hồ sơ, hàng chờ đồng bộ và khóa ngoại |
| Gắn vào khởi tạo ứng dụng | Chứng minh qua bridge của APK trên Android 17 và kiểm luồng đăng nhập → thiết lập → Tổng quan |

## Kết quả trên Android 17

APK ARM64 có SHA-256 `094e923367aa4baf3d759ae0fcd9fbf5e7a90b59d2645445b969e16232502ab1`. Màn hồ sơ của tài khoản thử hiển thị lại chiều cao 172 cm và cân nặng 64 kg.

Khi ứng dụng mở, WebView gọi `MealPlanSync.initializeDatabase` trước cả lệnh thăm dò. SQLite báo `user_version=13` và `integrity_check=ok`. Khi thử tên cơ sở dữ liệu của chủ khác, plugin trả `database_session_changed` và không tạo tệp.

Ca `new_databases_match_the_original_android_schema_and_sync_triggers` chạy trên hai cơ sở dữ liệu mới. Nó so bảng, cột, chỉ mục, khóa ngoại, tên trigger và hàng ban đầu. Ba thao tác thêm, sửa và xóa nguyên liệu tăng phiên bản đồng bộ đúng ba lần.

Cùng ca kiểm cũng đạt khi dùng mã Angular lấy trực tiếp từ commit `367cef88`. Bộ kiểm Chrome trên đúng các tệp chuẩn bị push đạt 1.121 ca.
