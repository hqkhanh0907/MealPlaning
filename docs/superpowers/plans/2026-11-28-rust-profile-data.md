# Hồ sơ tài khoản qua SQLite của Rust trên Android

## Kết quả trên thiết bị

Trên Android 17, hai lần bấm Hoàn tất thực sự chỉ gọi `MealPlanProfile.apply(insert)` một lần. Sau khi mở lại trong tiến trình mới, tài khoản vẫn có đúng một UUID. Ba lần sửa hồ sơ đều đi qua Rust. SQLite có một mục cân nặng 69,4 kg và giữ đúng các mục tiêu nhập tay 2.150, 137, 270 và 68.

Đối chiếu TypeScript với Rust đã bao phủ 21 thao tác trên cùng dữ liệu. Kiểm chéo phát hiện trường hợp đồng bộ hết hạn sau khi SQLite đã commit. Lớp trả kết quả vẫn chấp nhận thay đổi đã lưu nếu chủ và thế hệ phiên giữ nguyên. Phiên bị thu hồi vẫn bị từ chối. Ca kiểm trình duyệt chứng minh cả hai trường hợp.

| Nơi gọi | Dữ liệu cần giữ | Nguy cơ và phép kiểm |
|---|---|---|
| database.provider, AccountSync, ProfileStore.loadProfile, hai onboarding guard | Mở đúng cơ sở dữ liệu trước khi đọc hồ sơ; có thể cần tải lại sau đồng bộ. | Hồ sơ trống vẫn trả null. Không tạo file khi sai owner, tên DB hoặc phiên bản. |
| OnboardingPage.complete và trang Leptos | Lưu một hồ sơ, UUID v4, hai chế độ mục tiêu mặc định và ngày sinh. | Gọi lại trả hàng cũ kể cả dữ liệu mới không hợp lệ. Lần đầu không thêm weight_log. |
| BodyEditPage, GoalsEditPage, ActivityEditPage và SettingsEditorPage | ProfileStore.updateProfile chỉ gửi phần thay đổi. Giữ NULL, 0, chế độ thủ công và giá trị cũ. | Dùng ngày đối chiếu do caller cung cấp. Kiểm sinh nhật nhuận và xác thực tại giao dịch. |
| SettingsPage.toggleNotif | Chỉnh riêng cờ nhắc nhở, rồi mới làm mới lịch hệ thống. | Kiểm tuổi và cách tính mục tiêu cùng ngày; không đổi cân nặng. |
| App.refreshTargets, ProfileStore.publish | Có thể ghi lại mục tiêu và đọc hồ sơ lần nữa ở thời điểm đổi ngày. | So mục tiêu tự động và thủ công. Giữ timestamp theo cơ sở dữ liệu. |
| DashboardStore.loadWeightSummary và WorkoutPlanFinder | Lấy hồ sơ, cân gần nhất và cân trước một mốc. | Giữ điều kiện date < mốc, thứ tự giảm dần và kết quả null. |
| NativeDatabase.execute và SQLite trigger | Đặt tác vụ dự phòng trước khi ghi. SQLite tự tăng change_version và cập nhật weight_log. | Đặt tác vụ pending khi có thay đổi đã commit. Lỗi lập lịch vẫn cho phép lưu. |
| AccountSession và SessionVault | JS chụp danh tính hiện tại. Plugin kiểm owner, generation và trạng thái trong khóa của vault. | Kiểm lại danh tính trước khi trả kết quả. Chặn phiên đã thu hồi. Mất mạng hoặc thiếu quyền đồng bộ vẫn cho sửa dữ liệu cục bộ. |

Plugin `MealPlanProfile` xuất `binding` và `apply`. Các thao tác là `get`, `latestWeight`, `previousWeight`, `insert` và `update`. Rust mở file đã có, kiểm schema trong giao dịch và dùng healthmate-store. Khóa vault bao trùm thao tác ghi và commit.

Trang web tiếp tục sử dụng đường TypeScript để so cùng đầu vào. Android chỉ dùng đường cũ khi plugin hoặc thư viện native chưa có. Một kết quả không khớp phiên không được thử lại trên đường cũ.

## Kiểm thử có thể chạy lại

| Phép kiểm | Lệnh hoặc tín hiệu |
|---|---|
| So hai SQLite cùng schema | `cargo test --locked --manifest-path crates/healthmate-capacitor/Cargo.toml --test profile_data -- --include-ignored` |
| Kiểm adapter và API repository | `npx ng test --include=src/app/core/account/profile-data.spec.ts --include=src/app/core/repositories/user-profile.repository.spec.ts --watch=false --browsers=ChromeHeadless` |
| Kiểm chính sách vault | `./android/gradlew -p android :app:testDebugUnitTest --tests com.healthmate.ai.sync.ProfileDataSessionTest` |
| Nghiệm thu trên máy | Quan sát plugin `MealPlanProfile.apply` trả thành công, UUID, hàng weight_log, change_version và tác vụ guard/pending. |

Bộ Rust dùng Node có `node:sqlite` và các dependency đã cài của app. Nó so 21 thao tác với mã TypeScript gốc. Sau mỗi thao tác, phép kiểm so kết quả, lỗi, hàng hồ sơ, lịch sử cân và phiên bản thay đổi.

Hai luồng Rust cùng lưu hồ sơ đầu tiên phải nhận cùng UUID. Nếu chuẩn bị ghi thất bại, giao dịch không tạo hồ sơ. Thử lại sau khi xác nhận tài khoản thất bại không được ghi qua đường dự phòng.
