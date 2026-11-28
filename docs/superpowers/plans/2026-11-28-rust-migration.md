# Chuyển HealthMate sang Rust

**Mục tiêu.** Chuyển ứng dụng Android, máy chủ và trang quản trị sang Rust 1.100.1. Mốc đối chiếu ban đầu là `e876df69` trên `main`. Nếu `main` nhận tính năng mới trong quá trình chuyển đổi, bổ sung hành vi đó vào phạm vi nghiệm thu.

**Ràng buộc chung**

- Làm trực tiếp trên main. Giữ thay đổi của các phiên khác.
- Giữ hành vi sản phẩm và hợp đồng dữ liệu hiện có ở các điểm vào thực tế.
- Dùng Rust 1.100.1, dữ liệu thử và nguồn phép kiểm có thể chạy lại.
- Chỉ chuyển đường chạy mặc định sau khi phần thay thế đạt kiểm thử tương ứng.

## Quyết định kiến trúc

Lõi Rust quản lý nghiệp vụ và SQLite theo tài khoản. Máy chủ Rust phải thực hiện giao thức workspace hiện tại. Giao thức theo từng hiệp trong APK thử chỉ kiểm chứng một cơ chế. Dùng chung phần chuẩn hóa và hòa giải workspace khi hai phía cần cùng quy tắc.

Khanh chọn Capacitor + Leptos ngày 28/11/2026. Giao diện Leptos chạy trong WebView của Capacitor. Các plugin Android xử lý vòng đời và gọi lõi Rust khi cần. Bản thử Day trong `mobile/` chỉ dùng để đối chiếu hành vi. Tài liệu quyết định nằm ở `docs/4-architecture/rust-android-17-feasibility.md`.

## Các phần triển khai và quyền sở hữu

1. **Giao thức workspace.** `crates/healthmate-protocol/` sở hữu chuẩn hóa, snapshot 12/13, bảo toàn dữ liệu tập luyện, hợp nhất và quyết định xung đột. Đối chiếu với `server/pb_hooks/snapshot.js` và `server/workout-coaching.test.mjs`. Kiểm cả dữ liệu lỗi, thao tác xóa và sửa đồng thời.
2. **Máy chủ.** `crates/healthmate-server/` sở hữu HTTP, xác thực mật khẩu, phiên thiết bị, biên nhận thao tác, lịch sử, phân quyền và quản trị. Đối chiếu toàn bộ đường dẫn công khai và riêng với các bộ kiểm trong `server/*.test.mjs`. Mỗi lần phát hành phải có đường sao lưu và khôi phục đã kiểm tra.
3. **Nghiệp vụ.** `crates/healthmate-domain/` sở hữu tính dinh dưỡng, hồ sơ, khẩu phần và quy tắc tập luyện. Chuyển từng quy tắc cùng các trường hợp biên của TypeScript. Dùng cùng kết quả giữa giao diện, cơ sở dữ liệu và máy chủ khi có quy tắc chung.
4. **Dữ liệu trên thiết bị.** `crates/healthmate-store/` sở hữu schema SQLite, khởi tạo, dữ liệu mẫu, repository, giao dịch, hàng chờ và trạng thái theo tài khoản. Kiểm tra lưu rồi mở lại, đổi tài khoản, mất phản hồi và hai thiết bị sửa cùng dữ liệu.
5. **Ứng dụng Android.** `crates/healthmate-leptos/` sở hữu màn hình Rust. Triển khai Tổng quan trước. Sau khi đối chiếu trên Android 17, tiếp tục với tài khoản, thiết lập ban đầu, Lịch ăn, Quản lý, Tập luyện và Cài đặt. Giữ nhãn tiếng Việt, tài nguyên hình ảnh, design token và thao tác quay lại.
6. **Dịch vụ thiết bị và AI.** Chuyển xử lý phiên, khóa Groq, yêu cầu AI, điều phối ảnh, lịch nhắc và Worker. Thử chọn ảnh khi tiến trình cũ đã mất và Bình đăng nhập trước khi ảnh trả về. Thử lịch ngày và tuần sau reboot trước khi mở lại ứng dụng.
7. **Chuyển đường chạy.** Đổi CI, lệnh dựng APK, cấu hình hai dịch vụ và trang quản trị sau nghiệm thu. Bỏ mã cũ do dự án duy trì khi mọi điểm vào đã dùng phần Rust. Giữ tài sản tĩnh và ca kiểm thử độc lập còn giá trị.

## Thứ tự xác minh

- Trước mỗi commit: định dạng, kiểm thử phần bị tác động và kiểm tra diff đã stage.
- Máy chủ: thử đăng ký, đăng nhập, thu hồi, đổi tên, phân tách hai tài khoản, ghi trùng và xung đột bằng hai thiết bị.
- Ứng dụng: dựng và cài APK từ nguồn hiện tại. Ghi nhận phiên bản, SHA-256, thiết bị và thời điểm của từng lần nghiệm thu.
- Tập luyện: ghi 40 kg × 6 ngoại tuyến. Kiểm tra thử lại sau mất phản hồi và hai máy sửa thành 7 hoặc 9 lần.
- Dinh dưỡng: giữ ảnh chụp dữ liệu bữa đã ghi khi công thức thay đổi. Kiểm tra đơn vị, khẩu phần và giá trị thiếu.
- Vận hành: so sánh giao thức với bản đang chạy, khôi phục bản sao trong thư mục riêng và thử quy trình lùi phiên bản cục bộ.
- Trước khi kết thúc: chạy các điểm vào mặc định, xác nhận CI tại commit đã push và đối chiếu từng chức năng với bản gốc.

## Tình trạng

Kế hoạch này mô tả tiêu chí hoàn thành. Bằng chứng triển khai là mã nguồn, kết quả kiểm thử và commit trên main.
