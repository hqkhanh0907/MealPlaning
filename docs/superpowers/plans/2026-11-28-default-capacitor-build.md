# Dùng giao diện Leptos cho bản dựng Android mặc định

Các màn tài khoản, thiết lập ban đầu, Tổng quan, Lịch ăn, Quản lý, Tập luyện và Cài đặt đã chạy qua bộ định tuyến Leptos trên Android 17. Lát này đưa các màn đó vào các lệnh dựng sản phẩm hiện tại.

| Luồng | Trước | Sau | Nguy cơ và cách kiểm |
|---|---|---|---|
| `npm run build` và `npm run build:prod` | Angular tạo web bundle cũ; người dùng phải gọi riêng `build:leptos` | Biên dịch WASM từ Rust 1.100.1 rồi chạy cấu hình sản phẩm với các màn Leptos | Kiểm tệp WASM và tải ứng dụng thực tế |
| `ionic build` | Angular CLI chọn cấu hình mặc định | Hook dựng WASM trước. Angular chọn các route sản phẩm đã nghiệm thu | Kiểm cấu hình Angular và lệnh gọi hook |
| Android sau `cap sync` | Gradle có thể dựng APK thiếu thư viện Rust nếu người dùng bỏ qua bước native | Gradle dựng thư viện khi đầu vào thay đổi, kể cả lần đầu | Kiểm JNI trong APK, ABI, khóa ký và SQLite |
| Web và các phép đối chứng | Dùng store và màn Angular | Giữ lệnh dựng giao diện gốc theo yêu cầu đối chứng. Các bài Karma vẫn chạy được riêng | Kiểm lại bài mở hồ sơ và phép so sánh hai màn thật |

Mã native của Android vẫn dùng Keystore, WorkManager và các plugin hệ thống. Một số màn Leptos tiếp tục gọi store, form và hộp thoại Angular. Đổi điểm vào sản phẩm không chứng minh các mô-đun này đã chuyển sang Rust.

## Kết quả

Trên một bản xuất mã nguồn sạch, `npm run android` dựng WASM, tạo dự án Capacitor và chạy tác vụ Gradle `buildHealthMateRust`. APK chứa giao diện WASM và thư viện Rust cho cả bốn ABI. Khi chọn riêng ARM64, Gradle chỉ đóng gói thư viện cho ARM64.

APK mặc định đã mở đủ bốn tab trên Android 17. Từ Tổng quan, thao tác mở Cài đặt, quay lại, chọn bữa trưa và thêm món đều đạt. WebView đã tải WASM và dựng Tổng quan bằng Leptos. SHA-256 của APK thử là `bf9d6c0f5af917e0294eb4f093b696bb2068fff23b41fb8eb9c3be69709f26ef`.
