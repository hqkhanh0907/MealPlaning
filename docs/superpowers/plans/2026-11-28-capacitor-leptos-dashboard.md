# Chuyển màn hình Tổng quan sang Leptos

## Phạm vi

Khanh chọn Capacitor + Leptos cho Android 17 ngày 28/11/2026. Màn hình đầu tiên là Tổng quan. So với bản Angular từ cùng mã nguồn, trên cùng một cơ sở dữ liệu SQLite và cùng thiết bị. Giữ nguyên các màn hình khác trong lần đối chiếu này.

## Nơi gọi và nguy cơ đổi hành vi

| Luồng | Trước | Sau khi chuyển phần hiển thị | Có phải regression không |
|---|---|---|---|
| Mở tab, quay lại từ Cài đặt | Ionic gọi `ionViewWillEnter` rồi tải số liệu | Giữ cùng vòng đời và cùng `DashboardStore.refresh` | Phải đối chiếu lúc tải, lúc lỗi và khi quay lại |
| Mở bữa chưa ghi | Nhấn liên kết chuyển ngày, bữa và món sang Lịch ăn | Gọi đường điều hướng cũ với đúng món đang hiển thị | Mất mã món hoặc chặn Ctrl+click sẽ làm đổi hành vi |
| Thêm món và ghi tay từ ảnh | Lưu ngày đích trước khi chuyển tab. Dọn trạng thái nếu chuyển thất bại | Giữ nguyên các hàm điều hướng này | Đối chứng bằng các ca trong `dashboard.page.spec.ts` |
| Nhận xét AI và chọn ảnh | Kho dữ liệu xử lý yêu cầu. Màn hình đọc kết quả, lỗi và trạng thái mạng | Truyền trạng thái thật sang Leptos. Đưa tiêu điểm đến kết quả mới | Cần kiểm tra ngoại tuyến, hủy và quyền truy cập |
| Sửa khẩu phần | Giữ tên, số gam, lựa chọn và lỗi của từng mục cho đến khi lưu | Chuyển sự kiện đến cùng bản nháp. Giữ ô đang nhập khi tín hiệu đổi | Mất tiêu điểm hoặc biến ô trống thành số 0 là regression |
| Lưu kết quả ảnh | Lưu vào ngày và tài khoản của bản nháp. Hiện thông báo khi thành công | Dùng cùng giao dịch và chỉ gọi một lần cho mỗi lần lưu | Kiểm tra giá trị thiếu, lưu lỗi và chuyển tài khoản |
| Dữ liệu cũ và đồng bộ | Repository, SQLite và worker đọc định dạng đang dùng | Lát hiển thị không thay schema, xác thực hoặc dữ liệu gửi đi | So cùng cơ sở dữ liệu cũ. Kiểm tra lại một luồng độc lập |

Điểm vào ngoài màn hình gồm `tabs.routes.ts`, `dashboard.routes.ts`, trang Lịch ăn và dịch vụ lưu bữa từ ảnh. Tìm mọi vị trí dùng `DashboardStore`, `pendingMealNavigation`, `addMealForDate` và `PhotoMealRepository` trước khi thay các API này.

## Công việc và tiêu chí nghiệm thu

| Việc | Tệp hoặc điểm vào | Điều kiện đạt |
|---|---|---|
| Giữ bản đối chứng | `src/app/features/dashboard/dashboard.page.*` | Build và chụp màn hình bản Angular trên Android 17 |
| Viết phần hiển thị | `crates/healthmate-leptos/` | Cùng dữ liệu đầu vào tạo cùng nội dung và hành động |
| Nối WebAssembly | `scripts/build-leptos.mjs` và cấu hình build Angular | APK thử chứa mã Rust biên dịch từ nguồn hiện tại |
| Nối giao diện với ứng dụng | Trang Tổng quan Leptos và bộ định tuyến của Capacitor | Dùng cùng tài khoản, thanh tab, kho dữ liệu và đường điều hướng |
| So hai phiên bản | `npm run build:leptos` và phòng thử Android | So ảnh, cây giao diện và thao tác. Lưu bằng chứng bên ngoài repo |
| Kiểm tra trước commit | Rust fmt, clippy, test, Angular guards và ChromeHeadless | Ghi kết quả thực tế cùng giới hạn còn lại |

Giữ nguyên design token, kiểu chữ, nhãn và thứ tự nội dung từ màn hình hiện tại. Không đổi giao diện trong lát này. Chỉ chuyển đường mặc định sau khi so khớp trải nghiệm thực tế.
