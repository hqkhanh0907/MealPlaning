# Kiểm kê các mô-đun khi chuyển HealthMate sang Capacitor + Leptos

Ngày 28/11/2026. Khanh đã chọn Capacitor + Leptos cho Android. Mốc Git là `193b7dcf`. Bảng cũng ghi riêng các tệp đang phát triển trên cây làm việc.

**Bản Android mặc định dùng Capacitor và Leptos.** `npm run android` dựng WASM, thư viện native và APK. `npm run build:prod` dựng giao diện sản phẩm. Lệnh `npm run build:angular` giữ màn Angular để đối chiếu. Một số store, biểu mẫu và hộp thoại vẫn chạy bằng TypeScript. `mobile/` là bản thử Day trước khi Khanh chọn stack.

## Tiến độ sau kiểm kê

| Phần | Bằng chứng trên main | Phạm vi còn lại |
|---|---|---|
| Máy chủ | API, phiên, trang quản trị và SQLite chạy trong `healthmate-server`. Hai bộ test kiểm tài khoản mới và đồng bộ hai máy. | Nghiệm thu dùng database mới. |
| Đăng nhập và thiết lập | Route Leptos và hồ sơ tài khoản đã chạy trên Android 17. | Phân tách xác thực native và bridge của WebView. |
| Tổng quan và Lịch ăn | Rust đọc SQLite theo chủ tài khoản. Các ca mất mạng và giao dịch đang mở có kiểm riêng. | Lệnh sửa lịch còn dùng repository TypeScript. |
| Quản lý | Danh sách, bộ lọc và tính dinh dưỡng đã đối chiếu trên cùng dữ liệu. | Các repository ghi món và nguyên liệu tiếp tục chuyển từng phần. |
| Tập luyện và Cài đặt | Ghi hiệp, sửa lịch sử, tập lại và lưu mục tiêu đã kiểm trên Android 17. | Các thao tác lưu buổi tập và một số hộp thoại vẫn dùng mã cũ. |

Danh sách đường dẫn sau đây là bản kiểm kê tại mốc ban đầu. Các kế hoạch theo từng phần ghi lệnh kiểm và kết quả của các thay đổi về sau.

**Phạm vi phía ứng dụng gồm 224 đường dẫn TypeScript dưới `src/`.** Có 215 đường dẫn dưới `src/app/`, gồm bốn tệp mới của Tổng quan Leptos. Chín đường dẫn còn lại gồm điểm vào, polyfill, khai báo kiểu và cấu hình. Các tệp dùng chung một hàng có cùng đích và cùng phép kiểm. Mọi đường dẫn tính từ gốc kho.

“Có ca” xác nhận có mã kiểm thử cho hành vi nêu trong hàng. “Chờ giao diện” yêu cầu chạy hành vi trên APK Leptos. Khi cần xác nhận chức năng sản phẩm, dựng và cài lại từ đúng nguồn rồi chụp bằng chứng mới. Lần kiểm kê này đối chiếu tệp và mã nguồn, chưa chạy lại các bộ kiểm.

Đếm lại nguồn ứng dụng từ gốc kho bằng `rg --files src -g '*.ts' -g '!*.spec.ts' -g '!*.parity.ts' -g '!**/__test__/**' -g '!test.ts' | wc -l`. Số lượng bao gồm khai báo kiểu và tệp cục bộ sinh khi build.

## Phép kiểm được dẫn trong bảng

| Tên | Lệnh hoặc bằng chứng | Phạm vi |
|---|---|---|
| Hồ sơ và dinh dưỡng | `cargo test --locked -p healthmate-domain --test nutrition_profile` | Ranh giới ngày sinh, mục tiêu, số đo, khẩu phần và snapshot. |
| Quy tắc tập luyện | `cargo test --locked -p healthmate-domain --test workout` | Đơn vị, gợi ý mức tạ, giáo án và tổng hợp tiến độ. |
| Danh mục bài tập | `cargo test --locked -p healthmate-domain --test typescript_source -- --ignored` và `node --import tsx --test crates/healthmate-store/tests/fitness_seed_parity.ts` | So trường seed, dữ kiện phân loại và giáo án với TS. Cần cài phụ thuộc npm. |
| Dữ liệu SQLite | `cargo test --locked -p healthmate-store --test storage` | Hợp đồng tệp riêng, song song, seed, nâng phiên bản và chống hạ phiên bản. |
| Hành trình dinh dưỡng | `cargo test --locked -p healthmate-store --test nutrition_journey` | Ghi bữa, sửa công thức, ghi ảnh, hồ sơ và số đo. |
| Lưu buổi tập | `cargo test --locked -p healthmate-store --test fitness_workout --test fitness_coaching` | Lưu hiệp offline, mở lại, giáo án, địa điểm, thay bài và lịch sử. |
| Đồng bộ | `cargo test --locked -p healthmate-client-sync --test sync` | Mất phản hồi, gửi lại, đổi chủ, phiên bị thu hồi và xung đột. |
| Giao thức | `cargo test --locked -p healthmate-protocol` | Đối chiếu hàm JS tham chiếu với Rust, gồm schema 12/13, lựa chọn và xóa. |
| Tài khoản và AI | `cargo test --manifest-path crates/healthmate-services/Cargo.toml --test services` | Mã trên cây làm việc. So bảy yêu cầu Groq với TS bằng phản hồi giả lập. |
| Xác nhận AI trên Day | `cargo test --manifest-path mobile/Cargo.toml --lib ai_features::tests` | SQL và logic xác nhận của nguyên mẫu Day. Chưa kiểm giao diện Leptos. |
| Ảnh Capacitor | [Kết quả hủy và chọn ảnh thử](/private/tmp/mealplan-avdlab-kll820xi/controls/result.json) và `cargo test --manifest-path crates/healthmate-android/Cargo.toml --test ownership` | APK thu gọn và quyền sở hữu ảnh của bộ nối Day là hai bằng chứng riêng. |
| Nhắc lịch | `cargo test --manifest-path crates/healthmate-android/Cargo.toml --test ownership recurring_rules` | Kiểm ID và thứ trong tuần. Kiểm tra thông báo hệ thống cần APK. |
| Tổng quan đối chiếu | `cargo test --manifest-path crates/healthmate-leptos/Cargo.toml`, `npm run test:leptos`, `npm run build:leptos` | Kiểm giá trị và DOM của bản thử. So thao tác thật sau khi cài từng APK. |
| Lịch ăn Angular | `npx ng test --watch=false --browsers=ChromeHeadless --include='src/app/features/calendar/**/*.spec.ts'` | Mốc cũ cho Lịch ăn và các điều khiển của bữa. |
| Tập luyện Angular | `npx ng test --watch=false --browsers=ChromeHeadless --include='src/app/features/fitness/**/*.spec.ts'` | Mốc cũ cho điều hướng, ngày tập, bộ đếm và giáo án. |
| Quản lý Angular | `npx ng test --watch=false --browsers=ChromeHeadless --include='src/app/features/management/**/*.spec.ts'` | Mốc cũ cho danh mục và hai trình chỉnh sửa. |
| Onboarding Angular | `npm run e2e:smoke` với Appium và APK đối chứng | `e2e/specs/onboarding-persist.e2e.ts` kiểm phục hồi sau thiết lập. |
| Cài đặt Angular | `npx ng test --watch=false --browsers=ChromeHeadless --include='src/app/features/settings/**/*.spec.ts'` | Mốc cũ cho số đo và quản lý phiên thiết bị. |
| Thành phần Angular | `npx ng test --watch=false --browsers=ChromeHeadless --include='src/app/shared/components/**/*.spec.ts'` | Chạy các ca thành phần đã có. Với phần không có spec, kiểm ngay trên màn gọi nó. |
| Form Angular | `npx ng test --watch=false --browsers=ChromeHeadless --include='src/app/shared/forms/**/*.spec.ts'` | Mốc cũ cho điều kiện trường và thao tác rời form. |
| APK đối chiếu | `npm run build:prod` và `npm run build:leptos` trong hai lần dựng riêng | Cài từng APK, giữ cùng tài khoản và dữ liệu thử. Ghi SHA, API, màn hình và kết quả từng thao tác. |

Chạy lệnh Rust bằng phiên bản 1.100.1. Bộ kiểm Rust ở gốc chỉ xét các crate trong [workspace](../../../Cargo.toml). Các lệnh có `--manifest-path` chỉ rõ crate ngoài workspace tại mốc kiểm kê.

## Bảng đường dẫn ứng dụng

### Khởi động và điều hướng

| Nguồn TypeScript | Đích hoặc điểm tích hợp | Trạng thái và cách kiểm |
|---|---|---|
| `src/main.ts`<br>`src/polyfills.ts`<br>`src/zone-flags.ts`<br>`src/app/app.ts` | Leptos trong WebView. Angular hiện khởi động Ionic, phục hồi phiên và tải dữ liệu. | Chưa thay điểm vào. **APK đối chiếu** cần kiểm cài mới, mở lạnh và trở lại ứng dụng. |
| `src/app/app.routes.ts`<br>`src/app/tabs/tabs.page.ts`<br>`src/app/tabs/tabs.routes.ts` | Bộ định tuyến và thanh tab của ứng dụng. Leptos cần giữ đường dẫn đang dùng. | Chờ giao diện. **APK đối chiếu** kiểm bốn tab, liên kết sâu và nút Quay lại. |
| `src/app/core/guards/onboarding-guard.ts`<br>`src/app/core/guards/unsaved-changes-guard.ts` | Phiên và hồ sơ cung cấp điều kiện. Màn Leptos phải chặn điều hướng đúng lúc. | Chờ giao diện. **APK đối chiếu** kiểm hồ sơ thiếu, hủy sửa và tiếp tục nhập. |
| `src/environments/environment.ts`<br>`src/environments/environment.prod.ts`<br>`src/environments/groq-development.ts`<br>`src/environments/groq.local.ts`<br>`src/environments/groq.ts` | Cấu hình theo bản dựng. Android lấy khóa qua kho phiên. Hai tệp cục bộ có thể do công cụ sinh. | Cấu hình. **APK đối chiếu** kiểm bản phát hành dùng đúng đích API và đúng nguồn khóa. |
| `src/types/sql.js.d.ts` | Kiểu TypeScript cho bộ SQLite WASM dùng trên web. | Riêng web. **Dữ liệu SQLite** kiểm bộ lưu native. Hợp đồng bản web cần quyết định riêng. |

### Tài khoản, đồng bộ và SQLite

| Nguồn TypeScript | Đích hoặc điểm tích hợp | Trạng thái và cách kiểm |
|---|---|---|
| `src/app/core/account/account-name.ts`<br>`src/app/core/account/account-session.ts` | `healthmate-services::AccountClient`, `ProtectedVault`, `healthmate-client-sync::Sessions`. | Có ca tạo tài khoản, khôi phục, đổi tên và đăng xuất. **Tài khoản và AI**. Cần gắn vào Leptos. |
| `src/app/core/account/native-account.ts` | Hợp đồng plugin Capacitor cho phiên, thiết bị và Worker. Rust có client phiên và đồng bộ. | Cầu nối sản phẩm còn cần kiểm trên APK. **Đồng bộ** và **Tài khoản và AI**. |
| `src/app/core/account/account-sync.ts`<br>`src/app/core/account/workspace-snapshot.ts` | `healthmate-client-sync` giữ outbox, phiên và biên nhận. `healthmate-store::initialize` cài trigger theo schema. | Có ca mất phản hồi, áp dụng snapshot và đổi tài khoản. **Đồng bộ** và **Dữ liệu SQLite**. |
| `src/app/core/account/workout-sync-conflict.ts` | `healthmate-protocol::merge_snapshots`, `healthmate-client-sync::Action::Choose`. | Có ca chọn từng trường và xóa buổi tập. **Giao thức**. Hộp thoại Leptos cần kiểm riêng. |
| `src/app/core/services/database/database.ts`<br>`src/app/core/services/database/database.provider.ts`<br>`src/app/core/services/database/native-database.ts` | `healthmate-store::{account_path,open_account}` dùng SQLite theo chủ tài khoản. | Có ca mở đồng thời, ghi và tách tài khoản. **Dữ liệu SQLite**. Cần kiểm cầu nối trên thiết bị. |
| `src/app/core/services/database/migration-runner.ts`<br>`src/app/core/services/database/migrations.ts`<br>`src/app/core/services/database/schema-compatibility.ts`<br>`src/app/core/services/database/schema.ts`<br>`src/app/core/services/database/profile-weight-log-trigger.ts` | `healthmate-store::initialize`, `crates/healthmate-store/migrations/` và `schema/workspace.json`. | Có ca nâng từ phiên bản 12, giữ cân nặng và từ chối hạ phiên bản. **Dữ liệu SQLite**. |
| `src/app/core/services/database/web-database.ts` | sql.js cho trình duyệt. `healthmate-store` mở tệp native trên Android. | Riêng web. **Dữ liệu SQLite** chỉ kiểm hợp đồng SQLite native. Cần xác định nhu cầu chạy độc lập trên web. |
| `src/app/core/services/seed/seed-loader.ts`<br>`src/app/core/services/seed/seed-records.ts` | `healthmate-store::seed_catalog`, các tệp JSON trong `src/assets/seed/`. | Có ca đối chiếu dữ liệu mẫu và giữ chỉnh sửa khi nạp lại. **Dữ liệu SQLite**. |

### Hồ sơ, dinh dưỡng và lịch ăn

| Nguồn TypeScript | Đích hoặc điểm tích hợp | Trạng thái và cách kiểm |
|---|---|---|
| `src/app/core/models/body-measurements.ts`<br>`src/app/core/models/user-profile.model.ts`<br>`src/app/core/models/user-profile.types.ts`<br>`src/app/core/services/profile/activity-label.ts`<br>`src/app/core/services/profile/energy-targets.ts`<br>`src/app/core/services/profile/manual-targets.ts`<br>`src/app/core/services/profile/profile-birth-date.ts`<br>`src/app/core/services/profile/profile-measurement-update.ts`<br>`src/app/core/services/profile/recalc-targets.ts` | `healthmate-domain::profile`, `profile::measurements`, `dates`. `healthmate-store::profile` ghi kết quả. | Có ca ngày sinh, khoảng đo, BMR/TDEE và mục tiêu thủ công. **Hồ sơ và dinh dưỡng**. Nhãn hiển thị cần kiểm trên APK. |
| `src/app/core/models/nutrition.ts`<br>`src/app/core/models/meal-plan.types.ts`<br>`src/app/core/models/photo-meal.ts`<br>`src/app/core/repositories/photo-meal.repository.ts` | `healthmate-domain::nutrition`, `healthmate-store::{meals,calendar,photo}`. | Có ca khẩu phần, ảnh lưu một lần và bữa đã ghi. **Hồ sơ và dinh dưỡng**, **Hành trình dinh dưỡng**. |
| `src/app/core/models/management.constants.ts`<br>`src/app/core/models/management.model.ts`<br>`src/app/core/models/management.types.ts` | Hợp đồng nguyên liệu, món và loại. `healthmate-store::management` dùng dữ liệu SQLite. Nhãn nằm ở giao diện. | Có mô hình và ca ghi dữ liệu. **Hành trình dinh dưỡng**. Cần kiểm đủ nhãn và loại trên Leptos. |
| `src/app/core/repositories/dish-ingredient.repository.ts`<br>`src/app/core/repositories/dish-per-serving.sql.ts`<br>`src/app/core/repositories/dish.repository.ts`<br>`src/app/core/repositories/ingredient.repository.ts` | `healthmate-store::{management,meals}`, truy vấn `crates/healthmate-store/src/per-serving.sql`. | Có ca lưu món, tính theo khẩu phần và giữ bữa cũ khi đổi công thức. **Hành trình dinh dưỡng**. |
| `src/app/core/repositories/day-plan.repository.ts`<br>`src/app/core/repositories/planned-dish.repository.ts`<br>`src/app/core/services/nutrition/nutrition-query.ts` | `healthmate-store::{meals,calendar,dashboard}` đọc lịch, chuyển món, tính tổng dự kiến và đã ăn. | Có ca snapshot dinh dưỡng. **Hành trình dinh dưỡng**. Kiểm thêm sao chép tuần, hoàn tác và tổng theo ngày. |
| `src/app/core/repositories/user-profile.repository.ts` | `healthmate-store::profile` tạo hồ sơ, sửa số đo và đọc lịch sử cân. | Có ca tạo lại không trùng hồ sơ và ghi đúng một lần đo. **Hành trình dinh dưỡng**. |
| `src/app/core/utils/local-date.ts` | `healthmate-domain::dates` xử lý ngày địa phương và tuần. | Có ca biên ngày và năm nhuận. **Hồ sơ và dinh dưỡng**. Cần kiểm đổi múi giờ trên Android. |
| `src/app/core/utils/band-color.ts`<br>`src/app/core/utils/key-metric-router.ts`<br>`src/app/core/utils/relative-date-label.ts`<br>`src/app/core/utils/week-day-status.ts`<br>`src/app/shared/nutrition-number.ts` | Quy tắc trình bày số, nhãn ngày, màu và chỉ số. Màn Leptos cần nhận đúng dữ liệu rồi định dạng. | Chưa có bằng chứng khớp toàn bộ quy tắc hiển thị. **APK đối chiếu** kiểm nhãn tiếng Việt và ranh giới ngưỡng. |

### Tập luyện và danh mục hướng dẫn

| Nguồn TypeScript | Đích hoặc điểm tích hợp | Trạng thái và cách kiểm |
|---|---|---|
| `src/app/core/models/fitness.types.ts`<br>`src/app/core/models/fitness-prescription.ts`<br>`src/app/core/models/fitness-workout-set.ts`<br>`src/app/core/models/exercise-measures.ts`<br>`src/app/core/models/workout-coaching.ts`<br>`src/app/core/models/workout-plan-recommendation.ts` | `healthmate-domain::{fitness,progress,recommendation}` và `healthmate-store::fitness`. | Có ca đơn vị, mức tạ, giáo án, đề xuất và tiến độ. **Quy tắc tập luyện**, **Lưu buổi tập**. |
| `src/app/core/models/exercise-catalog.generated.ts`<br>`src/app/core/models/exercise-catalog-review.data.ts`<br>`src/app/core/models/exercise-catalog.ts`<br>`src/app/core/models/exercise-catalog.types.ts`<br>`src/app/core/models/exercise-discovery.ts`<br>`src/app/core/models/fitness-seed.ts`<br>`src/app/core/repositories/fitness-seed.ts` | `healthmate-domain/data/exercise-facts.json` và `healthmate-store/src/fitness/{catalog.rs,exercises.json,preset-plans.json}` trong `crates/`. | Có đối chiếu các trường seed và dữ liệu tính giáo án. **Danh mục bài tập**. Bộ lọc và thứ tự giao diện cần kiểm riêng. |
| `src/app/core/models/exercise-guide-illustration-notes.ts`<br>`src/app/core/models/exercise-guide-texts.ts`<br>`src/app/core/models/exercise-guide.types.ts`<br>`src/app/core/models/exercise-guides.ts`<br>`src/app/core/models/exercise-guides/cardio-guides.ts`<br>`src/app/core/models/exercise-guides/carry-guides.ts`<br>`src/app/core/models/exercise-guides/core-guides.ts`<br>`src/app/core/models/exercise-guides/hinge-guides.ts`<br>`src/app/core/models/exercise-guides/index.ts`<br>`src/app/core/models/exercise-guides/isometric-guides.ts`<br>`src/app/core/models/exercise-guides/lunge-guides.ts`<br>`src/app/core/models/exercise-guides/mobility-guides.ts`<br>`src/app/core/models/exercise-guides/plyo-guides.ts`<br>`src/app/core/models/exercise-guides/pull-h-guides.ts`<br>`src/app/core/models/exercise-guides/pull-v-guides.ts`<br>`src/app/core/models/exercise-guides/push-h-guides.ts`<br>`src/app/core/models/exercise-guides/push-v-guides.ts`<br>`src/app/core/models/exercise-guides/rotation-guides.ts`<br>`src/app/core/models/exercise-guides/squat-guides.ts`<br>`src/app/core/models/exercise-guides/stretch-guides.ts` | `healthmate-store::fitness::catalog` có dữ liệu seed. Nguồn hình offline nằm trong `src/assets/fitness/`. | Có đối chiếu các trường seed. **Danh mục bài tập**. Cần so từng bước, cặp ảnh và ghi chú bằng màn hướng dẫn Leptos. |
| `src/app/core/repositories/exercise-place.repository.ts`<br>`src/app/core/repositories/exercise.repository.ts`<br>`src/app/core/repositories/training-plan.repository.ts`<br>`src/app/core/repositories/workout.repository.ts` | `healthmate-store::fitness::{list_exercises,list_places,create_ai_plan,append_set,progress_summary}` và các thao tác phiên tập. | Có ca tắt rồi mở lại, tách tài khoản, sửa hiệp và giữ điều kiện tập. **Lưu buổi tập**. |

### AI và dịch vụ thiết bị

| Nguồn TypeScript | Đích hoặc điểm tích hợp | Trạng thái và cách kiểm |
|---|---|---|
| `src/app/core/services/ai/ai-generation.ts`<br>`src/app/core/services/ai/groq-client.ts`<br>`src/app/core/services/ai/groq-credentials.ts`<br>`src/app/core/services/ai/groq-food-photo.ts` | `healthmate-services::{ai,vault}` kiểm chủ, thế hệ khóa, timeout và schema. `groq-food-photo.ts` chỉ xuất lại kiểu lỗi. | Có ca bằng nhà cung cấp giả. **Tài khoản và AI**. Cần kiểm giao diện nhập khóa và kết quả ảnh trên Capacitor. |
| `src/app/core/services/ai/dish-autofill-applier.ts`<br>`src/app/core/services/ai/fitness-ai.ts`<br>`src/app/core/services/ai/food-image-ai.ts`<br>`src/app/core/services/ai/insight-ai.ts`<br>`src/app/core/services/ai/meal-plan-ai.ts`<br>`src/app/core/services/ai/menu-suggestion-ai.ts`<br>`src/app/core/services/ai/nutrition-ai.ts`<br>`src/app/core/utils/fuzzy-match.ts` | `healthmate-services::{ai,prompt,response}`. Mã thử Day `mobile/src/ai_features/` có phần xem trước và xác nhận. | Có ca kiểm đầu ra, ngân sách bữa và tên dấu tiếng Việt. **Tài khoản và AI**, **Xác nhận AI trên Day**. Leptos còn thiếu. |
| `src/app/core/services/ai/prompts/ai-catalog.ts`<br>`src/app/core/services/ai/prompts/daily-insight.prompt.ts`<br>`src/app/core/services/ai/prompts/dish-autofill.prompt.ts`<br>`src/app/core/services/ai/prompts/food-image-analysis.prompt.ts`<br>`src/app/core/services/ai/prompts/ingredient-lookup.prompt.ts`<br>`src/app/core/services/ai/prompts/meal-plan-day.prompt.ts`<br>`src/app/core/services/ai/prompts/menu-suggestion.prompt.ts`<br>`src/app/core/services/ai/prompts/training-plan.prompt.ts` | `crates/healthmate-services/resources/ai-contracts.json`, `src/prompt.rs` và `src/response.rs` cùng crate. | Có đối chiếu bảy tính năng với prompt và schema TS qua provider giả. **Tài khoản và AI**. |
| `src/app/core/services/ai/ai-log.ts`<br>`src/app/core/services/ai/gemini-client.ts`<br>`src/app/core/services/ai/gemini-key.ts`<br>`src/app/core/services/ai/gemini-response-schema.ts`<br>`src/app/core/services/ai/gemini-types.ts` | Gemini là đường dự phòng văn bản trên web. Log AI và thời hạn lưu nằm ngoài workspace đồng bộ. | Riêng web và dọn log cục bộ. **Tài khoản và AI** chỉ kiểm Groq native. Cần riêng ca TTL và lỗi Gemini nếu giữ web. |
| `src/app/core/services/camera/camera-capture.ts` | Capacitor Camera và trình chọn ảnh. `healthmate-android` có một cách tích hợp riêng cho Day. | Đã thử trên APK thu gọn. **Ảnh Capacitor** kiểm mất tiến trình, hai chủ và hủy. Cần kiểm lại trong APK sản phẩm. |
| `src/app/core/services/notifications/local-notifications.ts`<br>`src/app/core/services/notifications/notification-preferences.ts`<br>`src/app/core/services/notifications/notification-schedule.ts`<br>`src/app/core/services/notifications/reminder-coordinator.ts` | Capacitor Local Notifications. `healthmate-android::reminders` có quy tắc lịch và ID. | Có ca quy tắc Rust và phép thử lịch trên bản thu gọn. **Nhắc lịch**. Cần kiểm trong APK sản phẩm sau reboot và đổi chủ. |
| `src/app/core/services/theme/theme-service.ts`<br>`src/app/core/services/undo-toast-queue.ts` | Chủ đề sáng, thanh hệ thống và hàng đợi hoàn tác. Điểm gọi nằm ở giao diện. | Chờ Leptos. **APK đối chiếu** kiểm nhiều lần xóa, thời hạn hoàn tác và quay lại ứng dụng. |

### Store và trạng thái ứng dụng

| Nguồn TypeScript | Đích hoặc điểm tích hợp | Trạng thái và cách kiểm |
|---|---|---|
| `src/app/core/stores/calendar.store.ts`<br>`src/app/core/stores/nutrition.store.ts` | `healthmate-store::{calendar,meals,dashboard}` và `healthmate-domain::nutrition`. | Có ca ghi bữa và giữ snapshot. **Hành trình dinh dưỡng**. Cần so vòng tải, đổi ngày và bộ đệm của store. |
| `src/app/core/stores/dish.store.ts`<br>`src/app/core/stores/ingredient.store.ts` | `healthmate-store::{management,meals}`. Màn nhập AI Day có giao dịch ghi món và nguyên liệu. | Có ca giao dịch và lưu dữ liệu. **Hành trình dinh dưỡng**, **Xác nhận AI trên Day**. State Leptos còn thiếu. |
| `src/app/core/stores/dashboard.store.ts` | `healthmate-store::dashboard`, `healthmate-services::ai` và `healthmate-store::photo`. Bản đối chiếu dùng lại DashboardStore. | Đang nối phần hiển thị. **Tổng quan đối chiếu** phải kiểm tải lại, đề xuất đến muộn và phục hồi ảnh. |
| `src/app/core/stores/fitness.store.ts` | `healthmate-store::fitness`, `healthmate-domain::{fitness,progress,recommendation}`. | Có ca lưu hiệp. **Lưu buổi tập**. Cần so bản nháp, đồng hồ nghỉ, bộ lọc và cập nhật màn đang mở. |
| `src/app/core/stores/profile.store.ts`<br>`src/app/core/stores/local-day.ts` | `healthmate-store::profile` và `healthmate-domain::dates`. | Có ca ngày sinh và số đo. **Hồ sơ và dinh dưỡng**. Cần kiểm đổi ngày khi app ngủ và mở lại. |
| `src/app/core/stores/network.store.ts` | Trạng thái mạng của WebView và Capacitor. Worker dùng điều kiện mạng của Android. | Chờ kết nối Leptos. **APK đối chiếu** kiểm đổi mạng khi mở màn AI và đồng bộ lại. |

### Màn hình và điều hướng theo tính năng

| Nguồn TypeScript | Đích hoặc điểm tích hợp | Trạng thái và cách kiểm |
|---|---|---|
| `src/app/features/account/account.page.ts` | Màn tài khoản Leptos cần gọi dịch vụ phiên. Mẫu Day có `mobile/src/login.rs`. | Chờ giao diện. **Tài khoản và AI** kiểm dữ liệu. **APK đối chiếu** kiểm lỗi tên, mật khẩu và đăng nhập lại. |
| `src/app/features/calendar/calendar.page.ts`<br>`src/app/features/calendar/calendar.routes.ts`<br>`src/app/features/calendar/components/day-row/day-row.ts`<br>`src/app/features/calendar/components/day-summary-card/day-summary-card.ts`<br>`src/app/features/calendar/components/empty-day-state/empty-day-state.ts`<br>`src/app/features/calendar/components/logging-modal/logging-modal.ts`<br>`src/app/features/calendar/components/meal-slot-card/meal-slot-card.ts` | Màn Lịch ăn Leptos. `healthmate-store::{calendar,meals}` xử lý dữ liệu. | Chờ giao diện. **Lịch ăn Angular** và **APK đối chiếu** kiểm liên kết ngày, đúng bữa, trạng thái rỗng và ghi món. |
| `src/app/features/dashboard/dashboard.page.ts`<br>`src/app/features/dashboard/dashboard.routes.ts` | Tổng quan Angular làm bản chuẩn. Bản thử thay bộ hiển thị và giữ các hành động gốc. | Đang chuyển. **Tổng quan đối chiếu** kiểm các trạng thái và hành động từ cùng workspace. |
| `src/app/features/dashboard/dashboard.leptos.routes.ts`<br>`src/app/features/dashboard/leptos-dashboard.page.ts`<br>`src/app/features/dashboard/leptos-photo-portion.ts`<br>`src/app/features/dashboard/leptos-renderer.ts` | Cấu hình Leptos thay route Tổng quan. Cầu nối TS truyền trạng thái, phần ăn trong ảnh và hành động sang trình dựng WASM. | Cầu nối mới trên cây làm việc. **Tổng quan đối chiếu** kiểm bản dựng, giá trị hiển thị và thao tác thật. |
| `src/app/features/fitness/fitness.page.ts`<br>`src/app/features/fitness/fitness.routes.ts`<br>`src/app/features/fitness/workout-navigation.ts`<br>`src/app/features/fitness/workout-tabs.ts`<br>`src/app/features/fitness/history/history.page.ts`<br>`src/app/features/fitness/library/workout-library.ts`<br>`src/app/features/fitness/plans/workout-plans.ts`<br>`src/app/features/fitness/today/workout-today.ts` | Cần các màn Hôm nay, Giáo án, Bài tập và Lịch sử trong Leptos. `healthmate-store::fitness` cung cấp dữ liệu. | Chờ giao diện. **Tập luyện Angular** và **APK đối chiếu** kiểm bốn điểm vào cùng lịch sử trên thiết bị. |
| `src/app/features/fitness/components/exercise-guide-sheet/exercise-guide-sheet.ts`<br>`src/app/features/fitness/components/plan-editor/plan-editor.ts`<br>`src/app/features/fitness/components/plan-preview/plan-preview.ts`<br>`src/app/features/fitness/components/rest-timer/rest-timer.ts`<br>`src/app/features/fitness/components/workout-plan-finder/workout-plan-finder.ts`<br>`src/app/features/fitness/components/workout-substitution/workout-substitution.ts` | Leptos cần sheet hướng dẫn, sửa và xem trước giáo án, bộ đếm nghỉ, tìm giáo án và thay bài. | Chờ giao diện. **Tập luyện Angular**, **Danh mục bài tập**. Kiểm mất tiến trình, thay bài và xem kỹ thuật offline. |
| `src/app/features/management/catalog-toast.ts`<br>`src/app/features/management/dish-edit/dish-edit.page.ts`<br>`src/app/features/management/dish-edit/dish-edit.types.ts`<br>`src/app/features/management/ingredient-edit/ingredient-edit.page.ts`<br>`src/app/features/management/ingredient-edit/ingredient-edit.types.ts`<br>`src/app/features/management/management.page.ts`<br>`src/app/features/management/management.routes.ts` | Leptos cần danh mục và hai trình chỉnh sửa. `healthmate-store::management` ghi nguyên liệu, món và thành phần. | Chờ giao diện. **Quản lý Angular** kiểm nhập, xác nhận AI, quay lại khi chưa lưu, xóa và hoàn tác. |
| `src/app/features/onboarding/onboarding-calculation.ts`<br>`src/app/features/onboarding/onboarding-form.types.ts`<br>`src/app/features/onboarding/onboarding-validation.ts`<br>`src/app/features/onboarding/onboarding.page.ts`<br>`src/app/features/onboarding/onboarding.routes.ts` | `healthmate-domain::profile` tính chỉ số. Cần wizard và kiểm điều kiện trước khi sang bước trên Leptos. | Có ca công thức. **Hồ sơ và dinh dưỡng**, **Onboarding Angular**. Cần kiểm lưu bước cuối và định tuyến khi mở lại. |
| `src/app/features/settings/activity-edit/activity-edit.page.ts`<br>`src/app/features/settings/body-edit/body-edit.page.ts`<br>`src/app/features/settings/goals-edit/goals-edit.page.ts`<br>`src/app/features/settings/name-edit/name-edit.page.ts`<br>`src/app/features/settings/settings.page.ts`<br>`src/app/features/settings/settings.routes.ts` | `healthmate-domain::profile`, `healthmate-store::profile`, `healthmate-services::AccountClient`. Cần form Leptos và điều hướng Cài đặt. | Chờ giao diện. **Cài đặt Angular**, **Hồ sơ và dinh dưỡng**. Kiểm sửa tên, đo cơ thể, mục tiêu và trở về tab. |
| `src/app/features/settings/device-sessions/device-sessions-panel.ts`<br>`src/app/features/settings/workout-conflict/workout-conflict.ts` | `healthmate-services::AccountClient` liệt kê và thu hồi phiên. `healthmate-client-sync::Action` gửi quyết định xung đột. | Có ca lõi và HTTP. **Tài khoản và AI**, **Đồng bộ**. Chờ kiểm cụm điều khiển Leptos và lỗi phiên hết hạn. |

### Thành phần giao diện dùng chung

| Nguồn TypeScript | Đích hoặc điểm tích hợp | Trạng thái và cách kiểm |
|---|---|---|
| `src/app/shared/ai-availability.ts`<br>`src/app/shared/components/ai-offline-banner/ai-offline-banner.ts`<br>`src/app/shared/components/ai-lookup-sheet/ai-lookup-sheet.ts`<br>`src/app/shared/components/dish-autofill-sheet/dish-autofill-sheet.ts` | Leptos cần trạng thái AI, thiếu mạng, xem trước và quyết định từng nguyên liệu. `healthmate-services` cung cấp kết quả. | Chờ giao diện. **Thành phần Angular**, **Tài khoản và AI**. Kiểm lựa chọn trước khi ghi. |
| `src/app/shared/components/bottom-sheet-picker/bottom-sheet-picker.ts`<br>`src/app/shared/components/confirm-dialog/confirm-dialog.ts`<br>`src/app/shared/components/confirm-eat-modal/confirm-eat-modal.ts`<br>`src/app/shared/components/date-picker-modal/date-picker-modal.ts`<br>`src/app/shared/components/dish-context-menu-modal/dish-context-menu-modal.ts`<br>`src/app/shared/components/dishes-using-sheet/dishes-using-sheet.ts`<br>`src/app/shared/components/meal-slot-picker-modal/meal-slot-picker-modal.ts` | Leptos cần hộp chọn, xác nhận, lịch và thực đơn ngữ cảnh. Giữ nhãn và đích điều hướng hiện hành. | Chờ giao diện. **Thành phần Angular**, **APK đối chiếu**. Kiểm phím Back, tiêu điểm, chọn ngày và hủy. |
| `src/app/shared/components/calorie-ring/calorie-ring.ts`<br>`src/app/shared/components/macro-row/macro-row.ts`<br>`src/app/shared/components/nutrition-badge/nutrition-badge.ts`<br>`src/app/shared/components/recipe-changed-banner/recipe-changed-banner.ts`<br>`src/app/shared/components/servings-stepper/servings-stepper.ts`<br>`src/app/shared/components/status-pill/status-pill.ts`<br>`src/app/shared/components/trend-bar-chart/trend-bar-chart.ts` | Hiển thị dinh dưỡng, khẩu phần, cảnh báo đổi công thức và xu hướng. Xem vùng Tổng quan Leptos cho phần đang chuyển. | Cần xác minh từng thành phần. **Thành phần Angular**, **Tổng quan đối chiếu**. So nhãn, số 0, dữ liệu thiếu và kích thước chữ. |
| `src/app/shared/components/empty-state/empty-state.ts`<br>`src/app/shared/components/search-toolbar/search-toolbar.ts`<br>`src/app/shared/components/segmented-control/segmented-control.ts` | Leptos cần trạng thái rỗng, tìm kiếm và chuyển phân đoạn cho các màn dùng chung. | Chờ giao diện. **Thành phần Angular**. Kiểm nhập dấu, xóa truy vấn và trạng thái được chọn. |
| `src/app/shared/components/exercise-picker-sheet/exercise-picker-sheet.ts`<br>`src/app/shared/components/workout-summary-modal/workout-summary-modal.ts` | Leptos cần bộ chọn bài và kết thúc buổi. Lõi có `healthmate-store::fitness` và `healthmate-domain::fitness`. | Chờ giao diện. **Thành phần Angular**, **Lưu buổi tập**. Kiểm tìm bài offline và xác nhận mức tạ tiếp theo. |
| `src/app/shared/forms/birth-date-field/birth-date-field.ts`<br>`src/app/shared/forms/body-fields/body-fields.ts`<br>`src/app/shared/forms/discard-changes.ts`<br>`src/app/shared/forms/dish-edit.types.ts`<br>`src/app/shared/forms/form-field/form-field.ts`<br>`src/app/shared/forms/index.ts`<br>`src/app/shared/forms/ingredient-edit.types.ts`<br>`src/app/shared/forms/save-and-close.ts`<br>`src/app/shared/forms/schemas/common.ts`<br>`src/app/shared/forms/schemas/dish-form.schema.ts`<br>`src/app/shared/forms/schemas/ingredient-form.schema.ts`<br>`src/app/shared/forms/schemas/onboarding-step2a-form.schema.ts`<br>`src/app/shared/forms/types.ts` | Leptos cần form, nhãn nổi, quy tắc bỏ thay đổi và hành vi lưu. Lõi Rust kiểm một phần điều kiện dữ liệu. | Chờ giao diện. **Form Angular**, **APK đối chiếu**. Kiểm lỗi theo trường, bàn phím tiếng Việt, TalkBack và lưu đúng một lần. |

## Cấu hình và công cụ quanh ứng dụng

| Đường dẫn | Vai trò | Đối chiếu |
|---|---|---|
| `capacitor.config.ts` | Cấu hình host Android. Duy trì ứng dụng Capacitor, ID gói và thư mục tài sản web. | **APK đối chiếu**. Kiểm APK chứa đúng bản WASM và gọi đúng plugin. |
| `scripts/seed/build.ts`<br>`scripts/seed/build-composites.ts`<br>`scripts/seed/build-dishes.ts`<br>`scripts/seed/build-ingredients.ts` | Công cụ tạo seed khi phát triển. Rust đã có bộ đọc và nạp các JSON. | `npm run seed:test` và **Dữ liệu SQLite**. Chưa xác nhận bộ tạo seed viết bằng Rust. |
| `scripts/seed/curated/vi-composites.ts`<br>`scripts/seed/curated/vi-dishes.ts`<br>`scripts/seed/curated/vi-ingredients.ts`<br>`scripts/seed/types.ts`<br>`scripts/seed/units.ts`<br>`scripts/seed/validate-seed.ts` | Nguồn biên tập, đơn vị và kiểm dữ liệu đầu vào cho công cụ seed. | `npm run seed:test` và **Dữ liệu SQLite**. Đối chiếu bản JSON đầu ra trước khi đổi công cụ. |
| `scripts/build-leptos.mjs` | Biên dịch và chuẩn bị tài sản WASM cho cấu hình thử. | **Tổng quan đối chiếu** và **APK đối chiếu**. |
| `scripts/postsync-android.mjs`<br>`scripts/sync-android-native.mjs`<br>`scripts/patch-capacitor-android-bridge.mjs` | Kết nối mã Android sau bước Capacitor sync. | Dựng APK sạch rồi kiểm manifest, lớp Worker và đăng ký plugin. |

`src/test.ts`, các tệp `*.spec.ts`, `src/app/core/services/database/__test__/create-test-database.ts` và `dashboard-view.parity.ts` là mã kiểm thử. `src/types/sql.js.d.ts` là khai báo kiểu và đã có trong bảng. `scripts/test-dish-autofill-real.ts` gọi dịch vụ thật trong thử nghiệm riêng.

Bảy mô-đun ứng dụng cũ chưa xuất hiện trong đồ thị import từ `src/main.ts` và polyfill tại mốc đối chứng. Đó là alias `groq-food-photo.ts`, `onboarding-calculation.ts`, `onboarding.routes.ts` và bốn thành phần `nutrition-badge`, `recipe-changed-banner`, `servings-stepper`, `trend-bar-chart`. Các đường dẫn đầy đủ vẫn nằm trong bảng để xét cả nơi gọi sau này. Các thay thế tệp của Angular và khai báo kiểu có cách nạp riêng.

## Phần Android do dự án duy trì

Các tệp dưới đây nằm trong `scripts/android-native/mealplan-sync/`. Capacitor đóng gói chúng vào Android. So các API qua plugin thật trước khi chuyển mã gọi từ TypeScript sang Rust/WASM.

| Tệp Java hiện tại | Đích Rust hoặc phụ thuộc Android | Bằng chứng và điều kiện đạt |
|---|---|---|
| `MealPlanSyncPlugin.java`<br>`MealPlanApi.java`<br>`SessionAuthorizer.java`<br>`DeviceSessions.java` | `healthmate-services` và `healthmate-client-sync::{Sessions,HttpTransport}`. | **Tài khoản và AI**, **Đồng bộ**. Kiểm đăng ký, cập nhật và thu hồi từ Leptos qua host Capacitor. |
| `SessionVault.java` | `healthmate-services::ProtectedVault` và mã đọc vault cũ trên Android. | **Tài khoản và AI** kiểm dữ liệu tổng hợp. Kiểm nâng APK cùng danh tính ký, sau đó thử đổi tài khoản. |
| `WorkspaceSchema.java`<br>`WorkspaceStore.java`<br>`SnapshotMerge.java` | `healthmate-store`, `healthmate-client-sync/src/store.rs` và `healthmate-protocol`. | **Đồng bộ**, **Giao thức**. Kiểm sửa mới trong lúc chờ biên nhận. |
| `SyncEngine.java`<br>`SyncStatus.java`<br>`SyncTime.java` | `healthmate-client-sync/src/engine.rs` và trạng thái lưu theo tài khoản. | **Đồng bộ**. Kiểm lỗi, trạng thái hết hạn và thời gian sau khi mở lại. |
| `MealPlanSyncWorker.java`<br>`SyncSchedule.java`<br>`SyncProgress.java` | WorkManager phải khởi động đường Rust độc lập với WebView. Thông báo tiến độ thuộc hệ điều hành. | So đúng hai tình huống mất tiến trình và buộc dừng. Phép thử APK thu gọn bên dưới chỉ áp dụng cho luồng đã đo. |
| `MealPlanGroqPlugin.java`<br>`GroqTransport.java` | `healthmate-services::{ai,vault}` giữ khóa, giới hạn thời gian và xét kết quả. | **Tài khoản và AI**. Kiểm bàn phím bảo mật, đổi khóa giữa yêu cầu và hủy từ giao diện. |

## Máy chủ và trang vận hành

Hai đơn vị systemd hiện gọi `healthmate-server`. Cấu hình trong kho thể hiện đường chạy khi triển khai. Phiên kiểm kê chưa đối chiếu phiên bản đang phục vụ trên máy chủ thật. [Hướng dẫn máy chủ](../../../server/README.md)

| Mô-đun cũ tại `e876df69` | Điểm vào hiện tại | Bằng chứng và phép kiểm |
|---|---|---|
| `server/pb_hooks/api.pb.js`<br>`server/pb_hooks/device-sessions.pb.js`<br>`server/pb_hooks/session.js` | `crates/healthmate-server/src/routes.rs`, `auth.rs`, `error.rs`. Xác thực, cấp quyền thiết bị, làm mới, thu hồi và đăng xuất. | **HTTP máy chủ**. Ca `one_time_exchange_and_device_revocation_are_owner_scoped` kiểm cô lập tài khoản. |
| `server/pb_hooks/snapshot.js`<br>`server/pb_hooks/workspace.js` | `crates/healthmate-protocol/src/{normalize,merge,coaching}.rs` và `crates/healthmate-server/src/workspace.rs`. | **Giao thức**, **Hợp đồng cũ**. So khớp biên nhận và lựa chọn của hai thiết bị. |
| `server/pb_hooks/sync-schema.json` | `schema/workspace.json` làm nguồn chung cho lược đồ đồng bộ. | **Giao thức**, **Đồng bộ**. Kiểm phiên bản 12/13 và quan hệ cha con. |
| `server/pb_hooks/operations.js` | `crates/healthmate-server/src/{operations,admin,routes}.rs`. | **HTTP máy chủ**. Kiểm quyền vận hành chỉ đọc và số liệu gộp. |
| `server/pb_migrations/1795614800_mealplan.js`<br>`server/pb_migrations/1795652500_mealplan_sessions.js`<br>`server/pb_migrations/1795652501_workspace_history.js`<br>`server/pb_migrations/1795750000_mealplan_operations.js`<br>`server/pb_migrations/1795750001_mealplan_device_sessions.js` | `crates/healthmate-server/src/{db,import}.rs` và `schema.sql`. Chuyển tài khoản, phiên, lịch sử, biên nhận và số liệu vận hành. | **Nhập PocketBase**. Kiểm đầu vào thật trên dữ liệu thử, backup và restore vào đường dẫn mới. |
| `server/pb_public/mealplan-admin.html`<br>`server/pb_public/mealplan-admin.js`<br>`server/pb_public/mealplan-admin.css` | `crates/healthmate-server/src/admin.rs` dựng HTML. `server/resources/operations.css` cung cấp kiểu hiển thị. | **HTTP máy chủ**. Kiểm đăng nhập riêng, tải lại trạng thái, đăng xuất và giới hạn quyền. |
| `server/public-proxy.mjs` | `crates/healthmate-server/src/{main,lib,routes}.rs`. Hai listener trên loopback dùng chung SQLite. | **HTTP máy chủ**. Kiểm allowlist theo đường dẫn, phương thức, CORS và kích thước nội dung. |
| `server/deploy/mealplan-db.service`<br>`server/deploy/mealplan-public.service` | Các tệp systemd cùng đường dẫn chạy `serve-private` và `serve-public`. | Kiểm bản phát hành trong môi trường triển khai. Đối chiếu SHA, DB, đường public và truy cập quản trị qua SSH. |

| Phép kiểm máy chủ | Lệnh |
|---|---|
| HTTP máy chủ | `cargo test --locked -p healthmate-server --test http_contract` |
| Hợp đồng cũ | `cargo build --locked --bin healthmate-server` rồi `crates/healthmate-server/tests/run-legacy-http.sh target/debug/healthmate-server` |
| Nhập PocketBase | Với `POCKETBASE_BIN` trỏ tới bản 0.40.6, chạy `cargo test --locked -p healthmate-server imports_real_pocketbase -- --ignored`. |

Mã JavaScript của PocketBase được giữ trong `server/tests/pocketbase/` cho bộ kiểm hợp đồng. Kiểm JavaScript ở đây chỉ chạy với dữ liệu thử.

## Bằng chứng thiết bị và phần còn mở

| Nguồn | Phạm vi đã đo | Việc còn mở |
|---|---|---|
| [Nghiệm thu Android 0.3.0](../../audit/fitness/workout-release-0.3.0.md) | APK đối chứng API 36 tại `81fa007a`, có thiết bị thử, SHA và hành trình tập luyện. | Dựng lại cả hai APK trên API 37 trước khi kết luận về giao diện mới. |
| [Hai APK so sánh](/private/tmp/mealplan-avdlab-j1s7jbdu/run02) | Cùng lõi Rust thu gọn. Có snapshot trước và sau mất phản hồi, gửi lại, xung đột và chọn bản ghi. | Chạy giao thức workspace sản phẩm và dữ liệu ứng dụng thật sự trên tài khoản thử. |
| [Phép đo khởi động](/private/tmp/mealplan-avdlab-j1s7jbdu/startup-benchmark/report.md) | 24 lần đo với tập 100 bản ghi trên giả lập. | Đo lại APK sản phẩm theo cùng cấu hình, dữ liệu và tiêu chí sẵn sàng. |
| [Hợp đồng hiển thị Tổng quan](../../../crates/healthmate-leptos/PARITY.md) | Mô tả các trạng thái, phần hiển thị, vòng đời và hành động cần so với Angular. | Bổ sung kết quả từ cùng thiết bị và cùng nguồn trước khi đổi route mặc định. |

Các đường dẫn `/private/tmp/` là bằng chứng cục bộ của lần thử. Trước khi đánh dấu một màn đã chuyển, ghi commit nguồn, SHA-256 của APK, thiết bị, dữ liệu đầu vào và kết quả hành vi vào biên bản nghiệm thu.
