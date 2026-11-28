# Đăng nhập và tạo tài khoản HealthMate

## Phạm vi

Chuyển màn hình tài khoản sang Leptos. Hai trang dùng cùng API tài khoản. Giữ màn Angular để đối chiếu nhãn, khả năng nhập liệu và kết quả của từng thao tác.

| Luồng | Trước | Sau | Chuẩn đối chiếu |
|---|---|---|---|
| Mở tài khoản từ guard | Đường dẫn `/account` hiện đăng nhập | Cùng route và trường đang dùng | So tiêu đề, nhãn, autocomplete, nút gửi |
| Chuyển chế độ | Giữ tên đã nhập, username và mật khẩu. Xóa lỗi | Rust giữ trạng thái hiển thị và để trình duyệt quản lý các trường | Chuyển hai chiều, so giá trị và tiêu điểm |
| Tạo tài khoản | Tên dài tối đa 100 ký tự Unicode. Mật khẩu dùng đơn vị UTF-16 | Cùng validation ở màn hình. Giữ thêm kiểm tra phía dịch vụ | Ca tên rỗng, dấu tiếng Việt, emoji và ký tự thứ 101 |
| Gửi và nhận lỗi | Mỗi yêu cầu gọi `authenticate` một lần. Lỗi trường, từ chối quyền và mất mạng có thông báo riêng | Rust điều khiển gửi và hiển thị lỗi. Host giữ phiên, HTTP và điều hướng thành công | So payload và thông báo. Thử nhấn gửi hai lần |

Điểm vào nằm ở `app.routes.ts`. `AccountSession.authenticate` cấp phiên sau khi đăng nhập. Android lưu phiên trong kho hiện tại. Khi mở lại, `AccountSession.restore` đọc đúng tài khoản.

| Việc | Điều kiện đạt |
|---|---|
| Đối chiếu hành vi gốc | Hai trang chạy cùng dữ liệu và cùng phản hồi giả. Không ghi nội dung mật khẩu vào bằng chứng |
| Đưa biểu mẫu sang Rust | Giữ CSS, nhãn và thuộc tính trợ năng. Dùng callback để chuyển kết quả đăng nhập về dịch vụ gốc |
| Mở APK trên Android 17 | Chụp hai chế độ, kiểm lỗi trường và xác nhận đường đăng nhập thật |

## Nguyên nhân và nghiệm thu

Chrome độc lập dựng biểu mẫu Rust và phát một yêu cầu cho một lần gửi. Trong bộ kiểm cũ, Jasmine có thể hủy trang trước khi lần tải module thứ hai hoàn tất. TestBed còn tháo biểu mẫu Angular khỏi tài liệu khi khởi tạo trang Leptos. Khi đó nhấn gửi trên trang Angular không kích hoạt hành vi mặc định của biểu mẫu.

Bộ định tuyến hiện chờ WebAssembly tải một lần rồi mới tạo trang. Bộ kiểm chạy hết kịch bản Angular, hủy fixture, rồi chạy cùng kịch bản qua route Leptos. Mỗi lần gửi đều xuất phát từ một biểu mẫu đang gắn trong tài liệu.

Trên Android 17 ARM64 với trang nhớ 16 KB, sáu trạng thái đăng nhập và đăng ký khớp về trợ năng và pixel trong vùng ứng dụng. Khi ngắt mạng, WebView nhận lỗi mạng thật. Máy chủ Rust cục bộ trả HTTP 400 cho thông tin sai. Đăng ký và đăng nhập lại trả HTTP 200, giữ đúng tài khoản trong kho phiên Android và mở `/onboarding`.

Phòng thử chuyển tiếp riêng yêu cầu xác thực đến máy chủ cục bộ. Phép thử này chưa kiểm DNS hoặc TLS của production. SHA-256 của APK là `cb8529c8158c744020fa6373b408bafc55bcb146a439c6bd73be909ad1660f6d`.
