# Đăng nhập và đăng ký Android bằng Rust

| Điểm gọi | Hành vi cần giữ | Phép kiểm |
|---|---|---|
| Hai trang tài khoản gọi AccountSession.authenticate | Giữ nguyên mật khẩu. Chuẩn hóa tên đăng nhập, kiểm tra họ tên rồi tạo tài khoản nếu người dùng chọn đăng ký. | So thứ tự POST, dữ liệu Unicode và lỗi trường với đường web hiện tại. |
| `/api/collections/users/records` rồi `/api/mealplan/session` | Chỉ xin phiên sau khi đăng ký thành công. Tên thiết bị là mẫu máy do Android cung cấp. | Máy chủ giả trả lỗi tên trùng, thiếu quyền hoặc mất kết nối ở bước hai. |
| SessionVault và SyncSchedule | Kiểm phản hồi trước khi đổi phiên. Lần đăng nhập mới hoặc đăng xuất vô hiệu kết quả cũ. Giữ quy tắc khóa Groq theo tài khoản. | Kiểm token không xuất hiện trong dữ liệu trả về WebView. Kiểm ghi và lập lịch với đúng thế hệ. |
| AccountSession.restore, bộ khởi tạo và hai guard | Phục hồi tên, username và owner từ vault trước khi mở SQLite. Vẫn nhập được phiên cũ nếu cần. | Không gửi access token từ phiên mới sang JS. |
| NameEditPage và SettingsEditorPage | Gia hạn nếu cần, cập nhật họ tên rồi mới công bố vào đúng phiên. | Máy chủ trả lỗi 401/403. Đổi tài khoản trong khi chờ phải bỏ phản hồi cũ. |
| Cài đặt phiên thiết bị, đăng xuất và Worker | Các thao tác tiếp tục dùng vault và đường dẫn hiện có. | Phiên đăng nhập mới phải dùng đúng nguồn HTTPS, tên SQLite và lịch WorkManager. |

Rust điều phối các bước và đọc hợp đồng HTTP thật. OkHttp 5.5.1 dùng TrustManager mặc định của nền tảng. JavaScript không được cung cấp URL, chứng thư hoặc HTTP header. Mỗi yêu cầu có deadline mười giây. Nội dung yêu cầu và phản hồi không ghi vào log.

CapacitorCookies đặt CookieHandler chung của tiến trình. HttpsURLConnection có thể gửi cookie của WebView qua handler đó. Client riêng dùng `CookieJar.NO_COOKIES` để giữ hành vi `credentials: 'omit'`. Nó cũng bỏ Set-Cookie. Dữ liệu POST chỉ gửi một lần cho mỗi đích. Chuyển hướng cùng nguồn giữ POST với 307/308, đổi thành GET với 301/302/303. Client từ chối chuyển hướng sang nguồn khác.

AccountClient trong healthmate-services gắn với vault riêng và kéo theo Day trên Android. Nó kiểm mật khẩu và username sớm hơn AccountSession hiện tại. Lát này dùng trực tiếp vault Capacitor đang lưu phiên. Đường web giữ nguyên để đối chiếu.

Plugin thử biểu tượng JNI trước khi bắt đầu mạng hoặc ghi trạng thái. Chỉ lỗi thiếu plugin hoặc thư viện ở bước này cho phép quay về đường cũ. Sau khi đã tạo tài khoản, lỗi cấp phiên không thử lại đăng ký qua JS.

Nếu người dùng đăng xuất hay đăng nhập lần nữa trong lúc cấp phiên, vault từ chối kết quả cũ. Khi máy chủ đã cấp token, client thử thu hồi đúng phiên vừa cấp. Nó kiểm token khác phiên trước và phiên đang hoạt động trước khi gọi logout.

Vault ghi cùng lúc thông tin đăng nhập và dấu lịch đồng bộ đang chờ. Nếu WorkManager lỗi sau khi lưu, WebView vẫn nhận đúng tài khoản. Lần đọc danh tính sau thử lại lịch định kỳ của đúng thế hệ. Sau khi đặt lịch thành công, vault xóa dấu chờ.

Rust chuyển token cấp quyền và token phiên cho SessionVault. Vault mã hóa token trong tệp riêng bằng khóa AES của Android Keystore. WebView nhận ba trường định danh và mã thế hệ. Bước khôi phục dữ liệu `mealplan.session.v1` cũ vẫn dùng đường nhập tương thích có sẵn.

## Phép kiểm có thể chạy lại

| Phép kiểm | Lệnh |
|---|---|
| Luồng đăng ký và các phản hồi từ máy chủ giả | `cargo test --locked --manifest-path crates/healthmate-capacitor/Cargo.toml --test account_auth` |
| Luồng AccountSession và ánh xạ lỗi từ plugin | `npx ng test --include=src/app/core/account/account-auth-port.spec.ts --include=src/app/features/account/account.page.spec.ts --watch=false --browsers=ChromeHeadless` |
| Cookie, chuyển hướng, 503 và dữ liệu trả về JS | `./android/gradlew -p android :app:testDebugUnitTest --tests com.healthmate.ai.sync.AccountAuthHttpTest` |
| JNI, HTTPS nội bộ và Android Keystore | `./android/gradlew -p android :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.healthmate.ai.sync.AccountAuthVaultTest` |

Phép kiểm trên thiết bị tạo chứng thư localhost mới và chỉ tin chứng thư đó trong client thử. Tệp vault riêng nằm trong thư mục cache có UUID. Bản phát hành giữ URL và cấu hình TLS cố định.

Phép kiểm khôi phục lịch gây lỗi có chủ đích sau lần cấp phiên. Nó đếm đúng một POST đăng nhập, một lần đặt lịch thành công và kiểm dấu chờ của thế hệ mới.

## Đăng nhập, đăng xuất và đổi tên đồng thời

Plugin lấy vé đăng xuất trước khi đưa việc vào hàng chờ. Vault chỉ xóa tệp nếu vé còn hiệu lực. Nếu một phiên khác thắng, yêu cầu đăng xuất cũ cũng không hủy thông báo của phiên mới.

Khi đăng nhập thất bại, AccountSession đọc danh tính đã lưu để đồng bộ lại màn hình. Lần đăng nhập vừa thất bại vẫn trả lỗi gốc. Phép đọc này không gửi lại yêu cầu tạo tài khoản hay cấp token.

Angular và plugin xử lý các yêu cầu đổi tên theo thứ tự. Yêu cầu luôn mang chủ tài khoản và thế hệ ban đầu. `dataBinding()` giữ nguyên khi tên đổi, đổi khi đăng nhập lại và trả null sau đăng xuất.

Android 17 đã chạy lại cả năm ca `AccountAuthVaultTest` sau khi sửa ba lỗi đồng thời. Ca đăng xuất cũ giữ đúng phiên mới và lịch đồng bộ. Máy chủ HTTPS thử nghiệm chạy trên thiết bị. Android Keystore thực sự lưu khóa.

APK ARM64 có SHA-256 `094e923367aa4baf3d759ae0fcd9fbf5e7a90b59d2645445b969e16232502ab1`. APK kiểm thử có SHA-256 `a3f4354b57419adf6326a796bb102078384015393a02ca61db04ed6fa2228a0d`. Chrome đạt cả 12 ca cho giao diện và điều phối tài khoản. Rust đạt sáu ca hợp đồng tài khoản. Một ca chạy cùng chín đầu vào qua Angular và Rust. Hai bên gửi cùng nội dung theo cùng thứ tự, rồi trả cùng định danh hoặc lỗi.

Lần rà soát độc lập thứ hai đã kiểm lại thứ tự đăng xuất, đăng nhập lỗi và hai yêu cầu đổi tên. Kết quả trên thiết bị dùng tài khoản thử và máy chủ nội bộ.
