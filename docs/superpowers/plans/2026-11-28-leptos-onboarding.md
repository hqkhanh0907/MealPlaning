# Thiết lập hồ sơ trong Leptos

## Kết quả trên Android 17

Đã đi hết ba bước trên hai tài khoản thử, một tài khoản qua Angular và một tài khoản qua Leptos. Cả ba ảnh khớp từng pixel trong vùng ứng dụng. Tệp APK nhắm API 37, chạy trên máy ảo ARM64 có trang nhớ 16 KB.

Hai hàng hồ sơ khớp ở 21 trường sản phẩm, kể cả hai giá trị NULL. Mỗi tài khoản chỉ có một hàng và có UUID v4 riêng. Mở lại ứng dụng đi thẳng vào Tổng quan. Không tự thêm hàng cân nặng khi tạo hồ sơ lần đầu.

Màn hình Angular hiện có làm chuẩn cho ba bước. Bản Leptos dùng cùng stylesheet, nhãn tiếng Việt, cấu trúc Ionic và thứ tự trường. Android và web dùng cùng màn Leptos trong cấu hình thử.

## Đường gọi và rủi ro

| Nơi gọi | Hành vi cần giữ | Đối chiếu |
|---|---|---|
| `database.provider.ts`, `app.routes.ts`, `accountGuard`, `onboardingCompletedRedirectGuard` | Khởi tạo cơ sở dữ liệu tài khoản và tải hồ sơ trước điều hướng. Chuyển người đã hoàn tất về trang chính. | Giữ bộ khởi tạo và hai guard trong cấu hình thử. |
| `OnboardingPage`, `onboardingStep2aSchema`, `BodyFields`, `BirthDateField` | Nút tiếp tục kiểm sự hiện diện. Sau lần bấm đầu, trường sai hiện lỗi ngay khi sửa. Trường trống và số 0 khác nhau. | Cùng thao tác DOM trên hai màn. Kiểm giới hạn, ngày tương lai, lỗi khi rời trường và ngày sinh nhuận. |
| `LocalDay`, `profile-birth-date`, `bodyMeasurementError` | Thiết lập và Cài đặt dùng ngày địa phương. Tuổi hợp lệ từ 10 đến 120. | Truyền `LocalDay.iso()` và cập nhật khi ngày đổi. Kiểm người chưa đến và vừa qua sinh nhật. |
| `getActivityFactor`, `deriveFitnessLevel`, `recalcTargets` | Cài đặt cơ thể, hoạt động, mục tiêu và `profile-measurement-update` dùng cùng công thức. | Tái sử dụng `healthmate_domain::profile`. So toàn bộ payload cho người lớn và tuổi biên. |
| `ProfileStore.saveOnboardingProfile`, `UserProfileRepository.insert`, `ProfileStore.publish` | Lưu một lần, giữ trạng thái đang lưu, thử lại sau lỗi, chuyển `/` với `replaceUrl`. Kho giữ ID, timestamp và phiên SQLite. | Kiểm Promise còn chờ, lưu thất bại và cùng dữ liệu sau lần thử lại. |
| `CapacitorApp.backButton`, các nút quay lại và rời trang | Quay từng bước, giữ dữ liệu đã nhập, chuyển focus sang tiêu đề. Ở bước đầu, thoát nếu hệ thống hết lịch sử. | Chạy luồng lùi rồi tới trên cùng hồ sơ. Kiểm gỡ listener khi rời trang. |

## Hợp đồng

`mountOnboarding(host, localDay, save)` trả handle có `setDay`, `back` và `free`. Rust dựng ba bước, kiểm dữ liệu và gửi hồ sơ. Host cung cấp ngày, lưu vào `ProfileStore`, điều hướng sau thành công và nối nút quay lại của Android. Lỗi tải WASM mở màn Angular hiện có.

`onboarding.parity.ts` dùng TestBed chạy màn Angular gốc và cùng thao tác trong WASM. So nhãn, trạng thái điều khiển, lỗi và toàn bộ hồ sơ ghi ra. Nhóm đối chiếu ảnh trên Android trước khi đổi đường chạy mặc định.

## Phép kiểm có thể chạy lại

Chạy `node scripts/build-leptos.mjs` trước khi chạy Karma để trình duyệt tải WASM hiện tại.

| Phép kiểm | Lệnh |
|---|---|
| Bảy hồ sơ đối chiếu Angular và một lần lưu qua host thật | `npx ng test --configuration leptos-parity --include=src/app/features/onboarding/leptos/onboarding.parity.ts --watch=false --browsers=ChromeHeadless` |
| Lưu hồ sơ lần đầu, lặp lại và giữ nguyên ID | `npx ng test --include=src/app/core/repositories/user-profile.repository.spec.ts --watch=false --browsers=ChromeHeadless` |
| Biên dinh dưỡng, ngày nhuận và tính tuổi | `cargo test -p healthmate-domain --test nutrition_profile` |

Trong trình duyệt, bảy hồ sơ bao phủ tuổi 10, 18, 19, 34, 78, 79 và 120. Hồ sơ dùng số đo thập phân, hai mục tiêu macro còn trống và lần lưu đầu thất bại. Phép kiểm qua host giữ lời gọi lưu ở trạng thái chờ, bấm hoàn tất hai lần, rồi kiểm đúng một lần chuyển trang.
