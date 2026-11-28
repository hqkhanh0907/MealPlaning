# Khả năng viết HealthMate bằng Rust trên Android 17

## Quyết định cho ứng dụng

Ngày 28/11/2026, Khanh chọn **Capacitor + Leptos** cho toàn bộ giao diện Android của HealthMate. Leptos dựng giao diện bằng Rust và hiển thị trong WebView của Capacitor. Lõi Rust quản lý nghiệp vụ và dữ liệu. Máy chủ dùng các crate Rust hiện có.

Màn hình đầu tiên là Tổng quan. Hai bản phải hiển thị cùng dữ liệu, nhãn, màu và trạng thái khi mở từ thanh tab. Nhóm sẽ so ảnh trên Android 17 trước khi chuyển màn hình tiếp theo.

Phép thử ghi hiệp cho thấy cả hai APK xử lý được mất mạng, mất phản hồi và xung đột giữa hai thiết bị. Bản Capacitor dùng 101 dòng Java tự viết cho cầu nối và tác vụ nền. Con số này chỉ áp dụng cho bản thử. Các mục dưới đây lưu kết quả nghiên cứu trước khi Khanh quyết định.

Ngày nghiên cứu: 28/11/2026. Mục tiêu là Android 17, với `minSdk = 37` và `targetSdk = 37`. Các phép thử dùng Rust **1.100.1 stable**, phát hành ngày 27/11. Bộ công cụ được ghim ở đúng phiên bản này trong phòng thử. [Android 17](https://android-developers.googleblog.com/2026/06/Android-17.html) · [Rust 1.100.1](https://blog.rust-lang.org/2026/11/27/Rust-1.100.1/)

**Nghiệp vụ, lưu trữ, máy chủ và giao diện có thể do dự án viết bằng Rust.** Chi phí còn khác nhau ở những việc Android phải gọi ngược vào ứng dụng. Hai ví dụ là trả ảnh sau khi rời màn hình và đánh thức tiến trình để đồng bộ. Hiện chưa đủ kết quả để xác nhận một bộ khung đáp ứng trọn HealthMate mà dự án không phải bảo trì Kotlin hoặc Java.

Ở đây, “toàn bộ Rust” nói về mã ứng dụng do nhóm bảo trì. Thư viện có thể đóng gói Java, C, C++ hoặc mã JavaScript sinh tự động. APK vẫn có manifest, tài nguyên và cấu hình đóng gói. Hai cột khác nhau cần cân nhắc là ngôn ngữ nhóm *viết* và ngôn ngữ có mặt trong *bản phân phối*.

## Phạm vi HealthMate

Mã đang mở là `8bf4e717`. Mốc `origin/main` có sẵn trong Git là `e876df69`, có thêm phần tập luyện và quản lý phiên. Báo cáo đối chiếu hành vi ở cả hai mốc. Bản nghiệm thu 0.3.0 ở mốc sau chạy trên API 36. Kết quả đó chỉ dùng làm mốc so sánh. [Nghiệm thu 0.3.0](https://github.com/hqkhanh0907/MealPlaning/blob/e876df69/docs/audit/fitness/workout-release-0.3.0.md)

| Phần của HealthMate | Mã có thể viết bằng Rust | Điểm chạm Android hoặc việc phải tái tạo |
|---|---|---|
| Đăng ký, đăng nhập, đăng xuất và quản lý thiết bị | HTTP, kiểm tra phiên, thu hồi từng thiết bị và đổi tài khoản | Android Keystore giữ khóa AES. Tệp trên máy chứa phiên đã mã hóa. Đăng xuất hủy lịch của phiên nhưng giữ hàng chờ theo tài khoản. |
| Hồ sơ, mục tiêu và Tổng quan | Công thức dinh dưỡng, truy vấn, trạng thái và biểu mẫu | Bộ gõ, cuộn, nhãn và điều hướng quay lại phụ thuộc bộ giao diện. |
| Nguyên liệu, công thức, thực đơn, lịch ăn | Dữ liệu mẫu, khẩu phần, tổng dinh dưỡng, các thao tác sửa và hoàn tác | SQLite theo từng tài khoản. Giữ giá trị bữa đã ghi khi công thức thay đổi. |
| Giáo án, dụng cụ, buổi tập và lịch sử | Lọc bài, ghi hiệp, tính tải, ảnh hướng dẫn, bản nháp, bộ đếm nghỉ | Vòng đời màn hình quyết định thời điểm lưu và phục hồi bản nháp. Đồng hồ nghỉ và lịch nhắc là hai tính năng riêng. |
| Gợi ý bằng AI và phân tích ảnh | Gọi HTTP, tạo yêu cầu, đọc JSON, giới hạn thời gian và xét phản hồi | Model vẫn chạy ở nhà cung cấp. Truy cập khóa đúng phiên và lấy ảnh từ Android. |
| Chụp hoặc chọn ảnh món | Kiểm tra MIME, đổi kích thước, mã hóa và gửi ảnh | Mở camera hoặc thư viện, xin quyền, nhận kết quả và xử lý hủy. Ứng dụng hiện yêu cầu ảnh tối đa 1024 × 1024, chất lượng 85. |
| Nhắc ăn và nhắc tập | Tính giờ ba bữa, tổng kết tuần và lịch tập theo thứ. Bật/tắt theo tài khoản | Xin quyền thông báo, đặt và hủy lịch hệ thống. Cần phân biệt lịch lặp với một thông báo gửi ngay. |
| Mạng, dùng ngoại tuyến và đồng bộ hai máy | Hàng chờ SQLite, mã thao tác, gửi lại, gộp chỉnh sửa, xử lý xung đột | Android lập lịch khi có mạng. Worker phải lấy đúng chủ tài khoản và thế hệ phiên. Nhật ký AI, cài đặt máy và bản nháp hiệp tập ở lại thiết bị. |
| Máy chủ, trang quản trị và vận hành | API, xác thực, giao dịch, lưu lịch sử, giao diện quản trị và công cụ nhập dữ liệu | Cần tái tạo quyền quản trị chỉ đọc, cổng công khai giới hạn đường dẫn, sao lưu và khôi phục. Phần này độc lập với Kotlin/Java. |
| Khởi động, thanh hệ thống và kiểm thử | Khởi tạo ứng dụng, điều hướng, kiểm thử nghiệp vụ bằng Rust | Android cung cấp màn hình khởi động và vùng hiển thị an toàn. Bộ kiểm thử truy cập DOM phải đổi cách điều khiển cho mọi giao diện không dùng WebView. |

Nguồn mã của các hành vi trên gồm [máy chủ và phạm vi dữ liệu](https://github.com/hqkhanh0907/MealPlaning/blob/e876df69/server/README.md), [xử lý đồng bộ](https://github.com/hqkhanh0907/MealPlaning/blob/e876df69/server/pb_hooks/workspace.js#L84-L131), [chụp ảnh](https://github.com/hqkhanh0907/MealPlaning/blob/e876df69/src/app/core/services/camera/camera-capture.ts), [lịch nhắc](https://github.com/hqkhanh0907/MealPlaning/blob/e876df69/src/app/core/services/notifications/local-notifications.ts), [tác vụ nền](https://github.com/hqkhanh0907/MealPlaning/blob/e876df69/scripts/android-native/mealplan-sync/SyncSchedule.java) và [bộ kiểm thử giao diện](https://github.com/hqkhanh0907/MealPlaning/blob/e876df69/e2e/exercise-guides/driver.mjs).

## So sánh năm bộ giao diện

| Phương án | Cách viết và hiển thị | Bằng chứng liên quan đến API 37 | Phần cần nhóm duy trì hoặc xác minh |
|---|---|---|---|
| **Tauri 2 + Leptos** | Viết giao diện bằng Rust. Leptos chạy dưới dạng WebAssembly trong WebView. Lõi Rust chạy riêng trên máy. | Mẫu Tauri CLI 2.12.6 đặt cả compile SDK và target SDK ở 37. | Có plugin Android cho nhiều việc. Phải đi từ giao diện qua lõi hoặc API plugin để gọi chức năng hệ thống. [Mẫu Android](https://github.com/tauri-apps/tauri/blob/tauri-cli-v2.12.6/crates/tauri-cli/templates/mobile/android/app/build.gradle.kts#L20-L26) · [Leptos](https://v2.tauri.app/start/frontend/leptos/) |
| **Dioxus Mobile** | Mã Rust chạy trên máy. WebView hiển thị giao diện. Bộ dựng hình Dioxus Native dùng WGPU là một hướng khác còn thử nghiệm. | CLI 0.7.11 mặc định compile SDK và target SDK 34. Mẫu dùng AGP 8.7, Google hỗ trợ chính thức đến API 35. | Cấu hình nhắm API 37 cần đối chiếu với phiên bản Gradle và AGP thực sự dùng. Có cầu nối giao tiếp với mã Android. [Dioxus Mobile](https://dioxuslabs.com/learn/0.7/guides/platforms/mobile/) · [Mẫu Gradle](https://github.com/DioxusLabs/dioxus/blob/v0.7.11/packages/cli/assets/android/gen/build.gradle.kts#L7) · [Phạm vi AGP](https://developer.android.com/build/releases/agp-8-7-0-release-notes#compatibility) |
| **Makepad** | Bộ khung tự vẽ giao diện và có cú pháp khai báo riêng trong macro Rust. Makepad cung cấp Activity, cầu nối bộ gõ và trợ năng bằng Java. Robrix là ứng dụng thực tế dùng hướng này. | Nhánh release đã đọc đặt target SDK 35. Robrix ghim một nhánh Makepad riêng. | Cần đối chiếu gói phát hành, nhánh mã và cấu hình nhắm 37. Giao diện web hiện tại phải dựng lại. [Cấu hình Makepad](https://github.com/makepad/makepad/blob/05d60f03f6f0508346a7ec08bcb2188ec7a2f7e4/tools/cargo_makepad/src/android/sdk.rs#L49-L72) · [Robrix](https://github.com/project-robius/robrix/blob/87385e10680a5b38cf485cc8657a63f8c7174792/Cargo.toml#L15-L19) |
| **egui / eframe** | Tự vẽ giao diện bằng Rust. Có thể chọn NativeActivity hoặc GameActivity. | Ví dụ Android 0.37 nhắm API 35. Ví dụ dùng NativeActivity, còn bộ nối AccessKit trên Android cần GameActivity. | Chọn GameActivity nếu cần đường tích hợp bộ gõ và TalkBack này. Thư viện cung cấp lớp Android. Cần kiểm tra tiếng Việt, vùng bàn phím và thứ tự đọc. [Ví dụ egui](https://github.com/emilk/egui/blob/0.37.0/examples/hello_android/Cargo.toml) · [Bộ gõ](https://github.com/rust-mobile/android-activity#nativeactivity) · [AccessKit](https://github.com/AccessKit/accesskit/blob/main/adapters/winit/README.md#android-activity-compatibility) |
| **Slint** | Logic bằng Rust. Giao diện dùng ngôn ngữ Slint, trong tệp `.slint` hoặc macro `slint!`. Bộ khung cung cấp mã Java nối bộ gõ. | Viewer ở bản 1.19.1 nhắm API 36. Hướng dẫn yêu cầu NDK r30 khi dùng gói Skia dựng sẵn. | Nếu yêu cầu cú pháp Rust cho cả khai báo giao diện, DSL của Slint là một đánh đổi. Cần xác minh TalkBack và bản nhắm API 37. [Hướng dẫn](https://docs.slint.dev/latest/docs/slint/guide/platforms/mobile/android/) · [Viewer](https://github.com/slint-ui/slint/blob/v1.19.1/tools/viewer/android/app/build.gradle.kts#L35-L45) · [Bộ gõ](https://github.com/slint-ui/slint/blob/v1.19.1/internal/backends/android-activity/java/SlintAndroidJavaHelper.java) |

## Ai phải viết mã Android cho từng tính năng?

“Có thư viện” dưới đây nghĩa là đã tìm được mã nguồn cho thao tác nêu trong ô. Một plugin của Tauri, Day hay Makepad phụ thuộc môi trường khởi động tương ứng. Chỉ nhìn kiểu dữ liệu Rust chưa đủ để kết luận có thể gắn plugin vào bộ khung khác.

| Tính năng | Tauri + Leptos | Dioxus Mobile | Makepad | egui / eframe | Slint |
|---|---|---|---|---|---|
| Biểu mẫu, danh sách, lịch và biểu đồ | Rust + HTML ngữ nghĩa trong WebView | Rust + HTML ngữ nghĩa trong WebView | Widget Makepad | Widget egui | Widget trong DSL Slint |
| Bàn phím tiếng Việt, TalkBack | Dùng WebView hệ thống. Cần kiểm tra khi sửa giữa từ. | Cùng đường WebView. Cần kiểm tra giữ tiêu điểm khi cập nhật giao diện. | Bộ khung có mã nối bộ gõ và trợ năng. | GameActivity và AccessKit là đường có mã hỗ trợ. | Có mã nối bộ gõ. Chưa có bằng chứng đủ cho TalkBack của biểu mẫu. |
| Chụp ảnh bằng camera | Plugin cộng đồng mở camera hệ thống, trả JPEG Base64. | Có thể dùng API tệp của WebView hoặc nối camera Android. Chưa xác nhận luồng chụp bắt buộc qua API tệp. | Có API camera và ví dụ lưu ảnh từ khung hình. Phải đối chiếu xoay ảnh, độ nét và kích thước. | Cần thư viện camera ngoài hoặc một cầu nối Android. | Cần thư viện camera ngoài hoặc một cầu nối Android. |
| Chọn ảnh thư viện | Plugin dialog cung cấp trình chọn nội dung. Lõi đọc dữ liệu từ URI. | WebView có đường chọn tệp. Chưa xác nhận việc trả ảnh khi Android tạo lại tiến trình. | Có thể xét bộ chọn ảnh Robius. Java đi kèm thư viện. | Có thể tích hợp Robius nếu Activity và vòng đời khớp. | Có thể tích hợp Robius nếu Activity và vòng đời khớp. |
| Phiên đăng nhập, khóa Groq | Có thể dùng Rust/JNI trong lõi | Có thể dùng Rust/JNI trong lõi | Có thể dùng Rust/JNI | Có thể dùng Rust/JNI | Có thể dùng Rust/JNI |
| Nhắc ăn hằng ngày, nhắc tập theo thứ | Plugin chính thức có lịch lặp và hủy theo ID. Có giới hạn khi khôi phục lịch. | SDK thông báo 0.7 trả `Unsupported` trên Android. Cần thư viện khác hoặc cầu nối. | Phải bổ sung phần đặt lịch hệ thống. | Phải bổ sung phần đặt lịch hệ thống. | Phải bổ sung phần đặt lịch hệ thống. |
| Đồng bộ khi tiến trình đã dừng | JNI gọi được Rust. Cần Worker khởi động độc lập với WebView. | Cần Worker khởi động độc lập với giao diện. | Cần Worker khởi động độc lập với giao diện. | Cần Worker khởi động độc lập với giao diện. | Cần Worker khởi động độc lập với giao diện. |
| Trạng thái mạng khi đang dùng | Có thể đọc sự kiện WebView hoặc nối API Android. | Tương tự Tauri khi dùng WebView. | Có thể dùng thư viện ngoài hoặc nối sự kiện Android. | Tương tự Makepad. | Tương tự Makepad. |
| SQLite, AI qua HTTPS, máy chủ và quản trị | Có thể dùng các thư viện Rust bên dưới. | Cùng cách làm. | Cùng cách làm. | Cùng cách làm. | Cùng cách làm. |

**Bàn phím và trợ năng.** Có mã nối bộ gõ không chứng minh Gboard đặt dấu đúng sau khi người dùng di chuyển con trỏ. Cây trợ năng của Android WebView cho phép dùng nhãn HTML. Giao diện tự vẽ cần đưa từng trường, giá trị và hành động vào cây trợ năng. Chưa có kết quả TalkBack tiếng Việt của HealthMate trong nghiên cứu này. [Chromium](https://github.com/chromium/chromium/blob/main/docs/accessibility/browser/android.md) · [Bộ gõ Makepad](https://github.com/makepad/makepad/blob/506ec05105b9adb08d1d21f9879df181b5244ea7/tools/cargo_makepad/src/android/java/dev/makepad/android/MakepadInputConnection.java#L400-L441)

**Camera và thư viện ảnh.** Plugin camera Tauri và bộ chọn tệp là hai đường riêng. Ví dụ Makepad lấy ảnh từ luồng camera. Robius có lớp Java cho trình chọn ảnh hệ thống.

Android yêu cầu ứng dụng lưu riêng trạng thái nghiệp vụ nếu tiến trình có thể chết trước khi nhận kết quả. Khi quay lại, cần tránh gắn ảnh vào sai bữa hoặc sai tài khoản. [Camera Tauri](https://github.com/kushaldas/tauri-plugin-native-camera/blob/526f7703262e3087ecc59c35dc8ed331d8e29e97/README.md) · [Bộ chọn Tauri](https://github.com/tauri-apps/plugins-workspace/blob/dialog-v2.8.4/plugins/dialog/android/src/main/java/DialogPlugin.kt#L55-L73) · [Camera Makepad](https://github.com/makepad/makepad/blob/05d60f03f6f0508346a7ec08bcb2188ec7a2f7e4/apps/camera/src/still.rs) · [Robius](https://github.com/project-robius/robius/blob/729692cc6a87c5eb377d4faa6112320fab0e93cf/crates/file-picker/src/sys/android/FilePickerFragment.java#L390-L426) · [Android Activity Result](https://developer.android.com/training/basics/intents/result)

**Khóa và phiên.** Android Keystore giữ khóa để mã hóa bí mật của ứng dụng. Crate `android-native-keyring-store 1.0.0` truy cập Keystore và SharedPreferences qua JNI. Bản phát hành này cần khởi tạo `ndk-context`. API mới xuất hiện trên nhánh phát triển có thể khác gói 1.0.0.

Phải cung cấp đúng ngữ cảnh khi Android chỉ khởi động Worker. HealthMate còn phải kiểm tra chủ tài khoản, thế hệ phiên và phiên bản khóa trước khi dùng. [Crate đã phát hành](https://docs.rs/android-native-keyring-store/1.0.0/android_native_keyring_store/) · [Mã quản lý phiên HealthMate](https://github.com/hqkhanh0907/MealPlaning/blob/e876df69/scripts/android-native/mealplan-sync/SessionVault.java) · [Android Keystore](https://developer.android.com/privacy-and-security/keystore)

**Mạng.** HealthMate cần đọc trạng thái ban đầu và nhận sự kiện khi trạng thái đổi. Day Connectivity có hàm Rust đọc trạng thái qua lớp Java đi kèm. Đường này chưa chứng minh ứng dụng nhận đủ sự kiện chuyển mạng. Hệ điều hành vẫn quyết định thời điểm chạy tác vụ nền. [Mã HealthMate](https://github.com/hqkhanh0907/MealPlaning/blob/e876df69/src/app/core/stores/network.store.ts) · [Day Connectivity](https://github.com/daybrite/day/blob/v0.7.14/crates/day-part-connectivity/src/lib.rs) · [Android ConnectivityManager](https://developer.android.com/develop/connectivity/network-ops/reading-network-state#listen-events)

**Thông báo.** Tauri Notification 2.8.1 biểu diễn được giờ và thứ trong tuần. Nhánh đặt lịch đơn từ Rust chưa lưu đủ dữ liệu cho lần khởi động lại. Nhóm Tauri đã sửa đường đặt theo lô sau bản 2.8.1. Họ xác nhận bản sửa theo lô chưa kiểm tra toàn bộ chuỗi khởi động lại rồi giao thông báo.

Với bốn bộ giao diện còn lại, chưa xác minh thư viện lắp sẵn đáp ứng đủ lịch HealthMate. [Tauri 2.8.1](https://github.com/tauri-apps/plugins-workspace/blob/notification-v2.8.1/plugins/notification/src/mobile.rs#L35-L45) · [Bản sửa và giới hạn](https://github.com/tauri-apps/plugins-workspace/pull/3728) · [Dioxus SDK](https://github.com/DioxusLabs/sdk/blob/v0.7.0/packages/notification/src/lib.rs#L68-L77)

**Đồng bộ nền.** Khi dùng WorkManager trực tiếp, Android cần lớp Worker để gọi sau khi khởi động tiến trình. Nhóm có thể bảo trì một lớp Kotlin/Java mỏng, hoặc dùng lớp do thư viện đóng gói hay sinh ra. Logic đọc hàng chờ, gửi HTTP, gộp dữ liệu và thử lại vẫn viết bằng Rust. Một luồng Rust đang chạy trong giao diện sẽ kết thúc cùng tiến trình. [Android WorkManager](https://developer.android.com/develop/background-work/background-tasks/persistent) · [Tauri gọi Rust qua JNI](https://v2.tauri.app/develop/plugins/develop-mobile/#calling-rust-from-mobile-plugins)

Day cung cấp giao diện Android Material viết từ Rust và các thư viện Android riêng. Nghiên cứu xét thêm Day vì bộ khung này cung cấp lớp Java cho Worker. [Tài liệu Day](https://daybrite.dev/docs/)

`day-part-background 0.1.1` khởi tạo Day bằng Application Context rồi gọi hàm Rust. Nó phụ thuộc môi trường Day. Chính sách thay công việc cũ cũng khác HealthMate.

Day Notify có đặt một lần và hủy, còn HealthMate cần lịch lặp. Bộ chọn tệp Day 0.7.14 giữ yêu cầu trong bộ nhớ tiến trình. [Worker của Day](https://github.com/daybrite/day-part-background/blob/cfd50e10f48b33982c6c92d58f020fc4297a7796/platform/android/dev/daybrite/background/DayBackgroundWorker.java#L10-L32) · [Lịch nhắc Day](https://daybrite.dev/docs/reference/notify/) · [Bộ chọn tệp Day](https://github.com/daybrite/day/blob/v0.7.14/crates/day-toolkit-material/java/dev/daybrite/day/bridge/DayBridge.java#L5789-L5795)

Istmo có thể sinh lớp Kotlin để gọi hàm Rust trong Worker. Ứng dụng vẫn phải cung cấp phần đưa việc vào lịch và hủy lịch. Chưa có căn cứ để gán toàn bộ chức năng này cho một trong năm bộ giao diện. [Tài liệu Istmo](https://github.com/SergioRibera/istmo/blob/HEAD/docs/src/content/docs/writing-plugins/services-workers.md)

## Có cần framework hay thư viện nào để thay thế?

| Công việc | Thành phần có thể dùng | Việc nhóm vẫn sở hữu |
|---|---|---|
| Khởi động Android với mã ứng dụng Rust | NativeActivity có sẵn trong Android, hoặc `android-activity`, `ndk` và `jni` | Nếu tự dựng giao diện, nhóm phải xử lý bố cục, chữ, bàn phím, trợ năng và điều hướng. Một ứng dụng tối thiểu có thể khởi động mà không dùng framework UI. [Android NDK](https://developer.android.com/ndk/guides/concepts) |
| SQLite ngoại tuyến | `rusqlite`, với tùy chọn `bundled` để đóng kèm SQLite | Tệp theo tài khoản, schema, giao dịch, bản nháp, hàng chờ và cách tính dinh dưỡng. SQLite đóng kèm có mã C. [rusqlite](https://docs.rs/rusqlite/0.43.0/rusqlite/) |
| Kiểu dữ liệu và trao đổi API | `serde`, `serde_json`, `uuid` và `time` | Đơn vị, làm tròn, lịch địa phương, tương thích phiên bản và kiểm tra dữ liệu AI trả về. [Serde](https://serde.rs/) · [time](https://docs.rs/time/latest/time/) |
| HTTP, tài khoản, AI và đồng bộ | `reqwest` cho HTTP, `tokio` cho tác vụ bất đồng bộ | Chính sách hết hạn, hủy, thử lại, xử lý lỗi và cô lập khóa theo phiên. Tokio chỉ chạy khi tiến trình còn sống. [reqwest](https://docs.rs/reqwest/0.13.5/reqwest/) · [Tokio](https://tokio.rs/) |
| Máy chủ thay PocketBase và cổng Node | `axum` + `tokio`, SQLite và thư viện băm mật khẩu như `argon2` | Đăng nhập bằng tên, thu hồi từng thiết bị, bản ghi chống ghi trùng, phân quyền và sao lưu. Các thư viện không tự tái tạo hợp đồng máy chủ. [Axum](https://docs.rs/axum/0.8.9/axum/) · [Argon2](https://docs.rs/argon2/latest/argon2/) |
| Trang quản trị và công cụ phát triển | Leptos cho trang web. Chương trình dòng lệnh Rust tạo dữ liệu mẫu và kiểm tra quy tắc | Cô lập cổng quản trị, giữ quyền chỉ đọc và thay các kiểm tra Angular bằng kiểm tra phù hợp. Có thể kiểm thử API từ bên ngoài mà vẫn giữ bộ ca nghiệp vụ. [Leptos](https://leptos.dev/) · [Quyền quản trị hiện tại](https://github.com/hqkhanh0907/MealPlaning/blob/e876df69/server/README.md#L53-L75) |

## Các phép kiểm cục bộ

Phòng thử dùng Rust 1.100.1 stable, Android SDK 37.0, NDK r30 và kiến trúc ARM64. Mẫu Leptos dùng đích WebAssembly. Mỗi bộ phụ thuộc có tệp Cargo.lock riêng. Mọi chương trình mẫu dùng dữ liệu giả và nằm ngoài mã ứng dụng.

| Mẫu | Phép kiểm | Kết quả |
|---|---|---|
| SQLite `rusqlite 0.43.0` | Chạy kiểm thử trên macOS và liên kết thư viện Android | Đạt. Sau hai lần gửi cho An và một lần gửi cho Bình, tổng của An vẫn là 125 g. |
| Máy chủ `axum 0.8.9` | Chạy kiểm thử tuyến HTTP nội bộ trên macOS | Đạt. Tuyến trả mã 200 và JSON mong đợi. Phép thử chỉ bao phủ định tuyến và tuần tự hóa. |
| `leptos 0.8.23` | Biên dịch một biểu mẫu sang WebAssembly | Đạt. Một mẫu Leptos khác đã chạy trong WebView của APK Tauri bên dưới. |
| `tauri 2.12.7` và `dioxus 0.7.10` | Chạy `cargo check` cho ARM64 Android | Cả hai đạt. Mẫu Dioxus bật tính năng mobile. Phép kiểm chưa đóng gói giao diện bằng Gradle. |
| `eframe 0.37.0` và `slint 1.19.1` | Chạy `cargo check` cho ARM64 Android | Cả hai đạt. Mẫu egui bật GameActivity và AccessKit. Mẫu Slint khai báo trường nhập văn bản. |
| `makepad-widgets 1.0.0` | Chạy `cargo check` cho ARM64 Android | Đạt với bản trên crates.io. Mẫu này chỉ tham chiếu kiểu trong thư viện. Kết quả không bao phủ nhánh Makepad riêng của Robrix. |

Đã đóng gói APK ARM64 nhắm API 37 cho cả năm bộ giao diện và một APK riêng cho Worker của Day. Mẫu egui có APK dùng NativeActivity. Phép kiểm kiểu trong bảng trên dùng GameActivity và AccessKit. Đây là hai cấu hình riêng.

Tauri dùng dự án Android do CLI chính thức tạo. Với Dioxus, CLI đã biên dịch được mã Rust nhưng mẫu Gradle ban đầu dừng ở bước tìm Android SDK 37. Bản thử đóng gói thành công khi dùng Gradle 9.6.1, AGP 9.3.1 và plugin Kotlin 2.2.10. Bản này cũng bỏ cờ buildConfig cũ và khai báo trích xuất thư viện không tương thích trong manifest. Nhóm có thể phải duy trì các thay đổi đóng gói ngoài mã Rust.

Mẫu Makepad dùng `makepad-widgets 1.0.0` và các lớp Java nguyên bản từ cùng mốc mã của crate. Phòng thử tự đóng gói bằng Android build tools để đặt minSdk và targetSdk ở 37. Kết quả này ghi nhận chi phí thiết lập riêng, ngoài trình đóng gói mặc định. [Mã Java gốc](https://github.com/makepad/makepad/tree/a1868e19d3bb955200957efb3c880791a43424eb/tools/cargo_makepad/src/android/java/dev/makepad/android)

Riêng hai APK thử SQLite và Keystore đặt `minSdk = targetSdk = 37` và dùng NativeActivity. Cả hai có chữ ký APK hợp lệ. Các phân đoạn ELF và tệp thư viện trong APK đáp ứng căn chỉnh 16 KB. Hai gói đều không có `classes.dex` của ứng dụng. Các phép kiểm này không xác nhận hành vi của thư viện khác khi ghép vào sản phẩm. [Hướng dẫn căn chỉnh Android](https://developer.android.com/guide/practices/page-sizes)

## Kết quả chạy trên Android 17

Giả lập báo Android 17, API 37, ARM64 và trang nhớ 16.384 byte. Các phép thử chỉ dùng ứng dụng mẫu. Trạng thái mở Activity, kết quả hàm Rust và kết quả quan sát trên giao diện được ghi riêng.

| Phép thử | Kết quả quan sát | Giới hạn |
|---|---|---|
| SQLite trong APK không có mã Java/Kotlin tự viết | Android gọi NativeActivity. Hàm Rust chạy SQLite và trả kết quả mong đợi. | Cơ sở dữ liệu thử nằm trong bộ nhớ. Chưa kiểm toàn bộ schema của HealthMate. |
| Android Keystore từ Rust | Tiến trình 3026 lưu bí mật giả qua crate 1.0.0. Sau khi dừng ứng dụng, tiến trình 3157 đọc lại đúng giá trị rồi xóa. | Đã kiểm khi mở Activity trên giả lập. Chưa kiểm khả năng đọc trước lần mở khóa máy đầu tiên hoặc từ Worker của HealthMate. |
| Worker của Day sau khi mất tiến trình | Tiến trình 5238 đặt việc. Sau khi đưa app xuống nền, phép thử kết thúc tiến trình và xác nhận không còn PID. Sau 91,1 giây, tiến trình 6513 chạy hàm Rust. | Không mở lại giao diện. Hàm ghi dấu thử vào tệp riêng. Phép thử không gửi HTTP hoặc giải quyết xung đột hai thiết bị. |
| Slint và SQLite | Lưu và mở lại đúng “Bún bò Huế”. Chỉnh ô thành “PhoBo”, lưu rồi mở lại cũng đúng. | Chuỗi có dấu ban đầu nằm sẵn trong ô. XML của UIAutomator chỉ nhận diện tiêu đề, chưa xác nhận TalkBack đọc được trường. |
| Dioxus Mobile | UIAutomator nhận diện nút lưu. Sau khi chạm, cây giao diện chứa “Món đã lưu: Bún bò Huế”. | Dữ liệu ở trong trạng thái màn hình. Một phép thử bổ sung qua CDP không xác nhận được cùng thao tác. |
| Tauri và Leptos | Giao diện nhận dữ liệu tiếng Việt và báo đã lưu “Bún bò Huế”. Chromium nhận diện đúng trường “Tên món” và nút “Lưu món”. | Chuỗi tiếng Việt đi qua công cụ kiểm thử. UIAutomator có lần chỉ nhìn thấy WebView. TalkBack và Telex thực tế vẫn chưa xác minh. |

Trong phép thử Tauri tiếp theo, ứng dụng xuống nền 1,8 giây trước khi dừng tiến trình. Sau khi mở lại, cả localStorage và giao diện đều chứa đúng “Bún bò Huế”. Một lượt dừng ngay sau thao tác lưu đã đọc thấy giá trị trống. Bản thử dùng localStorage. HealthMate hiện dùng SQLite cho dữ liệu nghiệp vụ.

| Phép thử bổ sung | Kết quả trên Android 17 | Điều này trả lời gì cho HealthMate? |
|---|---|---|
| egui, nút lưu và phông chữ | Nút gọi đúng hàm Rust. Bộ phông mặc định của mẫu hiển thị ký tự thiếu tại chữ “ế”. Thêm Noto Sans bằng Rust cho kết quả đúng cả từ “Huế”. | Nhóm có thể sửa phần hiển thị tiếng Việt bằng mã Rust và tài nguyên phông chữ. Kết quả này chưa bao phủ xử lý Telex. |
| Makepad, nút lưu và tài nguyên | Bản đóng gói thủ công đầu tiên bỏ sót hai tài nguyên phông chữ và hiện màn hình đen. Sau khi bổ sung đúng tài nguyên của thư viện, biểu mẫu xuất hiện và nút gọi đúng hàm Rust. | Nhóm cần quản lý đủ tài nguyên khi tự đóng gói nhắm API 37. Lỗi đầu tiên xuất phát từ cách đóng gói mẫu thí nghiệm. |
| Day và camera | Bản dùng CameraX 1.5.1 dừng khi mở camera. Chỉ đổi bốn phụ thuộc CameraX sang 1.5.2 trong Gradle. Cùng mã Rust đã nhận ảnh JPEG 38.078 byte, kích thước 1.392 × 1.856. | Đường chụp đã chạy mà ứng dụng không phải tự viết Kotlin/Java. Đây là camera sau giả lập. Chưa kiểm ảnh từ điện thoại thật hoặc bước thu ảnh về 1.024 pixel. |
| Day và trình chọn ảnh | Hủy trả về đúng sự kiện. Chọn tệp PNG 69 byte đưa đúng nội dung về Rust. Bản sao cache và tệp đầu vào có cùng SHA-256. | Đây là trình chọn tài liệu hệ thống lọc ảnh. Lớp Java do Day cung cấp. |
| Chọn ảnh sau khi Android mất tiến trình gọi | Giữ trình chọn mở rồi dùng `am kill`. Tiến trình 6724 biến mất. Chọn ảnh đưa ứng dụng trở lại với PID 7727. Hàm Rust không nhận thêm kết quả trong 9 giây quan sát. | Giữ bữa ăn và tài khoản đích trong trạng thái bền. Nếu phải nhận lại ảnh ngay, cần cơ chế khôi phục kết quả trong thư viện hoặc lớp kết nối. |
| Tauri Notification 2.8.1 | Android ghi nhận báo thức và xóa nó khi nhấn hủy trước giờ. Lịch thứ hai giao đúng thông báo, trễ 44 giây trong cửa sổ báo thức không chính xác. Android đặt tiếp lịch cùng giờ vào thứ Bảy tuần sau. | Rust đặt và hủy được lịch thông qua Kotlin của plugin. Mẫu có quyền thông báo và không khai báo quyền báo thức chính xác. |
| Khởi động lại sau khi đã có lịch tuần sau | Đã xác nhận máy khởi động lại và người dùng mở khóa. Sau gần 83 giây, danh sách báo thức không còn lịch của ứng dụng. Dấu thử trong tệp riêng vẫn còn. | Đường Rust `.schedule(...).show()` đã thử chưa đáp ứng yêu cầu giữ lịch qua khởi động lại. Muốn nhắc trước lần mở app kế tiếp cần có cơ chế khôi phục từ hệ thống. |

Các thử nghiệm camera dùng Day 0.7.14 và `day-piece-camera 0.1.2`. Thư viện đóng gói phần Java gọi CameraX. Google đã mô tả lỗi dải động này trên Android 17 và nêu phiên bản CameraX đã sửa. Bộ thử thông báo dùng nút kiểm tra gọi lệnh qua IPC. Phần đặt lịch và hủy lịch nằm trong Rust. [Mã camera của Day](https://github.com/daybrite/day-piece-camera/blob/89590f4a65916829cab4b485e9351a20008731e8/src/DayCamera.java) · [Ghi chú Android 17](https://android-developers.googleblog.com/2026/06/Android-17.html)

## Kết luận về Kotlin và Java

**Có thể giao trọn cho Rust** phần tính toán, truy cập SQLite, xử lý phiên, gợi ý AI qua HTTP và ghi hiệp. Rust cũng có thể đảm nhận đồng bộ dữ liệu, máy chủ và trang quản trị. Bộ giao diện giúp dựng màn hình. Việc chọn bộ giao diện không quyết định thuật toán đồng bộ hoặc kiểu dữ liệu.

**Có thể dùng mã Android do thư viện bảo trì** cho nhập liệu, camera, trình chọn ảnh, Keystore, báo thức và Worker. Các trường hợp đã đo thuộc những bộ tích hợp khác nhau. Ghép Tauri, Makepad hoặc Dioxus với Worker của Day vẫn cần đánh giá riêng.

**Chỉ cần tính công tự viết Kotlin/Java khi chọn đường tích hợp thiếu lớp gọi ngược phù hợp.** Với WorkManager trực tiếp, cần một lớp Worker mà Android có thể tạo trong tiến trình mới. Với nhắc lịch sau khởi động lại, cần thành phần nhận sự kiện và đặt lại lịch. Có thể dùng lớp đã đóng gói, lớp sinh từ khai báo hoặc tự viết lớp mỏng. Logic nghiệp vụ vẫn có thể đặt trong Rust.

## Các phép thử trong nghiên cứu ban đầu

- **Biểu mẫu.** Nhập và sửa giữa từ “bún bò Huế”. Với TalkBack, đọc đúng nhãn, giá trị và lỗi khi bàn phím đang mở.
- **Ảnh.** Kiểm tra chụp, chọn, hủy, từ chối quyền và trở lại sau khi Android tạo lại tiến trình. Xác nhận đúng bữa và tài khoản.
- **Lịch.** Kiểm tra nhắc ăn hằng ngày, nhắc tập theo thứ, hủy khi đổi tài khoản và giao thông báo sau khi khởi động lại máy.
- **Đồng bộ.** Kiểm tra gửi lại khi mất phản hồi, đổi phiên lúc còn việc chờ và chỉnh sửa từ hai thiết bị. Khi Android thu hồi tiến trình, xác nhận máy chủ nhận dữ liệu trước khi người dùng mở lại ứng dụng.
- **Hiệu năng.** So trên cùng thiết bị, dữ liệu, kiến trúc CPU và kiểu bản dựng. Phép đo hiện có của HealthMate dùng giả lập API 36 và APK debug đa kiến trúc. [Số đo gốc](https://github.com/hqkhanh0907/MealPlaning/blob/e876df69/docs/audit/fitness/workout-release-0.3.0.md#L80-L93)

Android phân biệt thu hồi tiến trình với thao tác **Buộc dừng** của người dùng. Sau khi người dùng buộc dừng, hệ thống chờ một tương tác của họ để thoát trạng thái này. Đó là hai ca kiểm thử riêng. [Quy tắc của Android](https://developer.android.com/about/versions/15/behavior-changes-all#package-stopped-state)

Mốc hiện tại là APK debug đa kiến trúc 55,9 MB. Cận trên tới lúc thấy dữ liệu Tổng quan là 2,605 giây, gồm thời gian công cụ kết nối lại WebView. Kho mã chứa 796 ảnh tập luyện, tổng cộng 23,25 MB trước khi đóng gói. [Kết quả gốc](https://github.com/hqkhanh0907/MealPlaning/blob/e876df69/docs/audit/fitness/workout-release-0.3.0.md#L80-L93) · [Tài nguyên hình ảnh](https://github.com/hqkhanh0907/MealPlaning/tree/e876df69/src/assets/fitness)

Khi nghiệm thu bản phát hành, cần đo dung lượng, RAM và thời gian khởi động với dữ liệu của toàn bộ ứng dụng.
