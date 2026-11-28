# Dựng ứng dụng Capacitor cho Android 17

Khanh chỉ yêu cầu hỗ trợ Android 17. Bản đối chứng Tổng quan đã chạy trên API 37, nhưng APK vẫn khai báo minSdk 24 và targetSdk 36. Lát này đổi ba giá trị SDK của APK thành 37.

| Luồng | Trước | Sau | Có phải regression không |
|---|---|---|---|
| `cap add android` và `cap sync android` | Capacitor tạo lại cấu hình từ mẫu | Hook của dự án áp cấu hình SDK và phiên bản Gradle đã ghim | Mất cấu hình sau lần đồng bộ tiếp theo là regression |
| Cài trên Android 17 | Hệ thống áp quy tắc tương thích của target 36 | Hệ thống áp quy tắc target 37 | Phải thử cài đặt, thu hồi tiến trình và các luồng đang dùng |
| Cài trên Android cũ | minSdk 24 cho phép cài | minSdk 37 giới hạn thiết bị | Thay đổi theo yêu cầu của Khanh |
| Nâng cấp APK | Cùng package, khóa ký và thư mục dữ liệu | Giữ danh tính ứng dụng và dữ liệu ngoại tuyến | Đổi chữ ký hoặc xóa dữ liệu là regression |

| Công việc | Phép kiểm |
|---|---|
| Áp cấu hình trên mẫu Capacitor đã ghim | Chạy hai lần và so từng tệp. Giữ mã phiên bản, cấu hình ký và danh sách plugin |
| Dựng APK sản phẩm với toàn bộ plugin | Kiểm minSdk, targetSdk, compileSdk và nội dung WASM trong APK |
| Chạy trên API 37 | Nâng cấp tại chỗ, mở Tổng quan, đi các tab và so trạng thái phiên |

Google hướng dẫn dùng compileSdk và targetSdk 37. Bảng tương thích yêu cầu AGP từ 9.1.1 cho nền tảng 37.0. Phòng thử đã dùng AGP 9.3.1 với Gradle 9.6.1. [Thiết lập Android 17](https://developer.android.com/about/versions/17/setup-sdk) · [Bảng tương thích](https://developer.android.com/build/releases/about-agp)

## Kết quả ngày 28/11/2026

Từ mã ứng dụng ở `b8962058`, Gradle chạy thành công `:app:testDebugUnitTest`, `:app:assembleDebug` và `:app:assembleRelease`. Bản release trong phòng thử chưa ký. APK debug ký bằng cùng chứng thư với bản đối chứng. SHA-256 của APK debug là `2fadf905d276ee4d7a0027e9b32f1c0ea068fbb202e8ac9e1e57b56a80138dfc`.

`aapt dump badging` xác nhận compileSdk 37, minSdk 37 và targetSdk 37. Máy ảo Android 17 ARM64 dùng trang nhớ 16 KB. Sau `adb install -r`, 21 bảng và tệp phiên mã hóa khớp với bản trước. WebView tải WASM và chỉ gắn màn hình Leptos ở tab Tổng quan.

Phép thử mở Cài đặt, quay lại, mở đúng bữa trưa, thêm món và đi cả bốn tab. Không cần đăng nhập lại. Các tab ngoài Tổng quan vẫn dùng Angular ở mốc này.
