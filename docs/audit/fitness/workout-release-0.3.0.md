# Nghiệm thu Tập luyện 0.3.0 trên Android

Các kết quả dưới đây thuộc bản tích hợp trước phát hành. SHA phát hành trên `origin/main`, lượt CI, phiên bản server, phép đo và bằng chứng APK cuối đang chờ xác minh.

## Bằng chứng của bản tích hợp

| Phép kiểm | Kết quả | Nơi xem |
|---|---|---|
| Hành trình trên Android API 36, `emulator-5584` | 19/19, gồm lượt cài mới, mất mạng, tắt tiến trình, tập lại và mức tạ đã xác nhận. | [Báo cáo và SHA-256 của APK][android] · [Trình kiểm][runner] |
| Hồi quy giáo án, buổi tự do, kỹ thuật và lịch sử | 81/81 trên APK tích hợp trước đó. Bốn mục điều hướng chính đạt trên APK mới hơn. | [Kết quả hồi quy][legacy] · [Kết quả bốn mục][tabs] |
| Unit với Chrome Headless | 1.080 phép kiểm đạt ở lượt toàn bộ. Ba ca SQLite mới đạt trong lượt riêng. | [Lượt toàn bộ][unit] · [Ba ca bổ sung][focused] |
| Backend thử nghiệm | 5/5, gồm hai thiết bị, retry, xung đột và khác phiên bản. | [Nhật ký backend][backend] |
| Hiệu năng APK tích hợp | Tệp 55.913.972 byte. Ghi một hiệp mất 667 ms. Mở app đến khi dashboard có dữ liệu mất tối đa 2.213 ms trong lần đo. | [Số đo trên Android][android] · [Mục 7.2 của PRD][prd] |

PRD đặt mốc 5 giây để ghi hiệp, 2 giây để mở Tổng quan và 30 MB cho APK. Bản tích hợp đạt mốc ghi hiệp. Hai số đo còn lại vượt mốc. Phép đo mở app gồm cả lúc trình kiểm chờ WebView. Thời gian nhập tự động khác tốc độ nhập của người tập.

## Giáo án và dụng cụ · F-08

| Tiêu chí trong PRD | Phép kiểm và kết quả trên bản tích hợp |
|---|---|
| Bốn mã mẫu, lịch, dụng cụ và buổi dài nhất | SQLite nạp bốn mẫu, giữ trống giáo án hoạt động. Bộ lọc chỉ giữ mẫu vừa lịch, dụng cụ và thời lượng. [`seeds all presets without activating any until explicitly chosen`][seed] · [Kiểm điều kiện từng mẫu][finder-tests] |
| Xem ngày, bài, hiệp, lần hoặc giây và nghỉ trước khi chọn | Android mở hai bản xem trước và xem đúng bài. Mẫu đề xuất hiện ngày, số hiệp, đơn vị và thời gian nghỉ. [Hồi quy Android][legacy] · [Giao diện đề xuất][preview-dose] |
| Đổi lịch hoặc rút gọn, xác nhận, mở lại, giữ nhật ký cũ | Kiểm đổi sang thứ Tư và thứ Bảy, giảm hiệp, lưu bản riêng và từ chối xác nhận đã cũ. Nhật ký trước đó còn nguyên. [Ca đổi lịch và rút gọn][finder-tests] · [Lưu nguyên tử][atomic] · [Kiểm bản cá nhân][personal] |
| Ít nhất 50 bài, lọc dụng cụ và xem kỹ thuật ngoại tuyến | Danh mục có 415 bài. Giả lập lọc tạ đơn, mở đúng hướng dẫn squat trước khi có buổi tập. [Bộ ca danh mục][seed-count] · [Kết quả Android][android] |
| Nhiều mẫu hoặc thiếu mẫu | Chọn bốn buổi xếp Upper / Lower đầu tiên, các mẫu đạt khác vẫn xuất hiện. Với 25 phút tại nhà, Android mở bản xem trước và giữ nút tập tự do. [`ranks exact frequency without hiding other feasible plans`][frequency] · [Ảnh xem trước][preview-image] |

## Ghi buổi tập · F-09

| Tiêu chí trong PRD | Phép kiểm và kết quả trên bản tích hợp |
|---|---|
| Tập theo ngày đã chọn hoặc thêm bài tự do | Android tập Full Body A đúng bốn bài. Sau đó thêm từng bài ở buổi tự do. [Kết quả theo từng bài][legacy] |
| Mức đã xác nhận, mức lần trước, sửa, xóa và số lần trống | Sau khi xác nhận 10 kg mỗi tay, buổi sau hiện 10 và để trống số lần. Xóa mức điền sẵn giữ nguyên hiệp cũ. [`verifyNextLoad`][next-load] · [Kết quả Android][android] |
| Giây, số lần mỗi bên và kg mỗi tay | Android lưu plank 30 giây, plank nghiêng 20 giây mỗi bên. Sửa hiệp hai tạ hiển thị 10 kg mỗi tay. [Chi tiết nhật ký và lịch sử][legacy] |
| Xem kỹ thuật, tiếp tục đúng hiệp, tự đếm nghỉ, cảm nhận tùy chọn | Mở và đóng hướng dẫn giữ nguyên giá trị đang nhập. Đồng hồ tiếp tục chạy. Bộ kiểm ghi cả hiệp có đánh dấu Dễ và hiệp bỏ trống cảm nhận. [Đồng hồ và hiệp][legacy] · [Phục hồi bản nháp][android] |
| Hoàn thành sau khi có hiệp thật, chỉ tính khối lượng của hiệp phù hợp | Ca toàn hiệp bỏ từ chối hoàn tất. SQLite phân biệt giây, lần và khối lượng thập phân sau khi mở lại. [Kiểm điều kiện hoàn thành][only-skipped] · [Kiểm các đơn vị][units] |
| Hủy, đổi giáo án và hoàn tác có điều kiện | Kiểm đổi giáo án sau hủy. Hoàn tác trả đúng buổi. Có buổi khác đang tập thì từ chối hoàn tác. [Đổi giáo án][cancel-switch] · [Kiểm hoàn tác][undo] |
| Lịch sử hiển thị hiệp thật, hiệp bỏ và bản tập lại độc lập | Kiểm màn lịch sử tách hai loại hiệp. Android mở buổi mới từ bản đã soạn và giữ nguyên hiệp ở buổi gốc. [Kiểm lịch sử][history] · [Kết quả tập lại][android] |
| Thay bài theo mục đích, dụng cụ và phạm vi người tập chọn | Bộ lọc đối chiếu mẫu vận động và dụng cụ. Ca SQLite giữ hiệp cũ và chỉ áp dụng quy tắc tại đúng nơi. [Điều kiện chọn bài][replacement-filter] · [Kiểm thay bài][substitution] |
| Đo thời gian ghi hiệp | Android mất 667 ms từ khi nhập tạ đến khi hàng hiệp xuất hiện. Thời gian thao tác thực của người tập cần đo riêng. [Số đo và phương pháp][android] |

## Tiến bộ · F-10

| Tiêu chí trong PRD | Phép kiểm và kết quả trên bản tích hợp |
|---|---|
| 1RM của ba bài chính, hiệp Tối đa trong 1–10 lần | Ca squat 60 kg × 5 cho 70 kg ước tính. Bộ lọc loại hiệp Dễ, 11 lần và bài ngoài danh sách. Công thức dùng tạ đã ghi cho một lần. [Ca giới hạn 1RM][strength] · [Nhánh một lần và danh sách ba bài][strength-query] |
| So hai tuần, hiển thị tám tuần kể cả tuần trống | Android mở tám hàng. Tuần có hiệp 7 kg × 9 hiện 63 kg. Các tuần trống trong dữ liệu thử hiện 0. [Số liệu tuần][trend-image] · [Trình kiểm Android][journal] |
| Chuỗi tuần thực tập, tối đa 12 tuần | Ghi hiệp thật và hoàn tất 13 tuần liên tiếp. Kết quả là 12. Sang tuần trống kế tiếp, kết quả là 0. [Ca giới hạn chuỗi tuần][streak-test] |
| Trung bình cân nặng bảy ngày và nhãn nguồn | Ba lần cân 70, 67 và 69 kg cho 68,7 kg. Hai lần cân ngoài khoảng bị loại. Khi thiếu nhật ký, ca riêng trả 65 kg từ hồ sơ. [Ca cửa sổ bảy ngày][weight-test] · [Ca dùng hồ sơ][progress] |
| Mở biểu đồ, đọc giá trị và xem buổi khi cuộn | Android mở biểu đồ, đọc giá trị, thu gọn rồi mở thẻ buổi tập. Phép kiểm này chưa đo khung hình mỗi giây. [Ảnh biểu đồ][trend-image] · [Ảnh lịch sử][history-image] |

## Soạn buổi và hỗ trợ điều chỉnh · F-11

| Tiêu chí trong PRD | Phép kiểm và kết quả trên bản tích hợp |
|---|---|
| AI chỉ dùng bài cho phép và kiểm lại điều kiện | Kiểm bản nháp với sai lịch, thiếu dụng cụ, vượt phút và động tác cần tránh. Ca dịch vụ dùng phản hồi giả lập và loại mã lạ. [Kiểm ràng buộc][draft] · [Kiểm đầu ra AI][ai-test] |
| Chỉ tạo giáo án AI sau xác nhận, giữ lịch sử khi lỗi | Store kiểm bước xem trước, xác nhận và từ chối ngoại tuyến. Repository lưu nguyên tử, giữ bản AI cũ và ngày đã ghi. [Kiểm xem trước][ai-store] · [Kiểm bảo toàn lịch sử][ai-preserve] |
| Đủ mục tiêu cùng mức tạ, hiệp cuối Dễ | Android ghi hai hiệp × 12 với 8 kg mỗi tay theo mục tiêu của buổi. Người tập xác nhận 10 kg cho lần sau. Ca âm loại tải khác nhau, hiệp bỏ và hiệp cuối Nặng. [Kết quả Android][android] · [Kiểm ca âm][negative] |
| Gợi ý mức nặng hơn tại đúng nơi hoặc cho tự nhập | Với mức hiện tại 20 kg, SQLite chọn 24 kg tại nhà và bỏ 22 kg ở gym. Sửa sang 26 kg lưu đúng. Android kiểm trường hợp chưa biết mức. [Ca chọn và sửa mức tạ][heavier-test] · [Kết quả Android][android] |
| Lý do thiếu hiệp tùy chọn | Ca SQLite lưu đúng nội dung người tập nhập. Màn tổng kết chỉ gửi lý do khi người dùng chọn lưu. [Kiểm ghi lý do][negative] · [Điều khiển ghi và bỏ qua][reason] |
| V1 không tự giảm tải định kỳ hoặc ép số hiệp chung | Đối chiếu quyết định sản phẩm với prompt AI và cách soạn buổi. Đội sản phẩm không đặt ngưỡng chung cho mọi nhóm cơ. [Quyết định v1][decisions] · [Prompt AI][ai-prompt] |

## Vòng đời buổi tập và đồng bộ

| Tình huống | Kết quả và phạm vi bằng chứng |
|---|---|
| Vào từ Lịch ăn, quay lại, tắt tiến trình trong lúc ghi | Android trở về đúng Lịch ăn. Mở lại buổi còn đúng bài, tạ và số lần đang nhập. [Kết quả Android][android] |
| Hai lần nhấn ghi hoặc bắt đầu đồng thời | Android chỉ ghi một hàng SQLite. Ca tranh chấp khởi động chỉ tạo một buổi hoạt động. [Kết quả Android][android] · [Ca hai thao tác đồng thời][concurrency] |
| Danh tính, xung đột, retry và tương thích | PocketBase thử nghiệm kiểm hai thiết bị cùng tài khoản, cô lập tài khoản khác và dữ liệu phiên bản cũ. [Ca đồng bộ][server] · [Nhật ký backend][backend] |
| Nơi tập, dụng cụ, lịch và mức tạ đã xác nhận | APK tích hợp đã lưu đúng vào SQLite. Trình kiểm online đối chiếu từng giá trị với API của tài khoản QA mới. Bằng chứng từ server đang phục vụ còn chờ. [`verifyRemote`][remote] |
| Lùi server rồi nâng lại | Ca thử phục hồi dữ liệu huấn luyện từ phiên bản gần nhất còn trong lịch sử sau một lần ghi kiểu cũ. Mỗi tài khoản chỉ giữ 32 phiên bản trước. Sau hơn 32 lần ghi bằng server cũ, dữ liệu mở rộng có thể mất khả năng phục hồi từ lịch sử. [Ca lùi phiên bản][rollback] · [Giới hạn lưu lịch sử][retention] |

## Cần theo dõi sau phát hành

So thời gian dự kiến với thời gian bắt đầu và hoàn tất của cùng buổi. Đối chiếu bài thay và nhật ký thực tập tại từng nơi. Quan sát người tập ghi hiệp trong lúc nghỉ để đo thời gian nhập thực tế.

Đánh giá sức mạnh qua nhiều buổi với cùng bài, cùng đơn vị và mức gắng sức tương đương. Số hiệp, tổng khối lượng và tốc độ giao diện chưa xác nhận tăng cơ hoặc mức phù hợp của giáo án cho từng người. [Cách đo và giới hạn][decisions]

## Xác nhận bản phát hành

| Bằng chứng cần điền | Trạng thái |
|---|---|
| SHA trên `origin/main`, tag, lượt CI có Android e2e | Chờ xác minh |
| Bản server đang phục vụ, bản sao lưu đã kiểm và lượt đối chiếu dữ liệu qua APK | Chờ xác minh |
| APK đã cài, SHA-256, bộ ảnh mới và báo cáo nghiệm thu | Chờ xác minh |
| Thời gian mở Tổng quan, ghi một hiệp và kích thước APK phát hành | Chờ đo |

[prd]: ../../2-requirements/prd.md#72-performance-targets
[decisions]: ../../2-requirements/workout-coaching-v1.md
[android]: /private/tmp/mealplan-workout-mobile.IUGp9S/candidate-6/workout-release.json
[legacy]: /private/tmp/mealplan-workout-mobile.IUGp9S/legacy-1/flows-results.json
[tabs]: /private/tmp/mealplan-workout-mobile.IUGp9S/candidate-new-tabs/offline-tabs-results.json
[preview-image]: /private/tmp/mealplan-workout-mobile.IUGp9S/candidate-6/one-off-preview.png
[preview-dose]: ../../../src/app/features/fitness/components/workout-plan-finder/workout-plan-finder.html#L303
[trend-image]: /private/tmp/mealplan-workout-mobile.IUGp9S/candidate-6/eight-week-progress.png
[history-image]: /private/tmp/mealplan-workout-mobile.IUGp9S/candidate-6/workout-history.png
[unit]: /private/tmp/mealplan-workout-candidate-unit.log
[focused]: /private/tmp/mealplan-workout-progress-acceptance.log
[backend]: /private/tmp/mealplan-workout-candidate-backend.log
[runner]: ../../../e2e/workout-release/verify.mjs
[next-load]: ../../../e2e/workout-release/verify.mjs#L262
[journal]: ../../../e2e/workout-release/verify.mjs#L206
[remote]: ../../../e2e/workout-release/verify.mjs#L121
[seed]: ../../../src/app/core/repositories/fitness.repositories.spec.ts#L83
[seed-count]: ../../../src/app/core/repositories/fitness.repositories.spec.ts#L40
[atomic]: ../../../src/app/core/repositories/fitness.repositories.spec.ts#L106
[personal]: ../../../src/app/core/repositories/fitness.repositories.spec.ts#L264
[progress]: ../../../src/app/core/repositories/fitness.repositories.spec.ts#L318
[strength]: ../../../src/app/core/repositories/fitness.repositories.spec.ts#L441
[units]: ../../../src/app/core/repositories/fitness.repositories.spec.ts#L370
[only-skipped]: ../../../src/app/core/repositories/fitness.repositories.spec.ts#L209
[cancel-switch]: ../../../src/app/core/repositories/fitness.repositories.spec.ts#L198
[undo]: ../../../src/app/core/repositories/fitness.repositories.spec.ts#L754
[ai-preserve]: ../../../src/app/core/repositories/fitness.repositories.spec.ts#L238
[finder-tests]: ../../../src/app/core/models/workout-plan-recommendation.spec.ts#L19
[frequency]: ../../../src/app/core/models/workout-plan-recommendation.spec.ts#L70
[draft]: ../../../src/app/core/models/workout-plan-recommendation.spec.ts#L84
[ai-test]: ../../../src/app/core/services/ai/ai-feature-services.spec.ts#L250
[ai-store]: ../../../src/app/core/stores/fitness.store.spec.ts#L454
[ai-prompt]: ../../../src/app/core/services/ai/prompts/training-plan.prompt.ts
[negative]: ../../../src/app/core/repositories/workout-coaching.repository.spec.ts#L205
[concurrency]: ../../../src/app/core/repositories/workout-coaching.repository.spec.ts#L69
[substitution]: ../../../src/app/core/repositories/workout-coaching.repository.spec.ts#L82
[replacement-filter]: ../../../src/app/features/fitness/components/workout-substitution/workout-substitution.ts
[history]: ../../../src/app/features/fitness/history/history.page.spec.ts#L144
[strength-query]: ../../../src/app/core/repositories/workout.repository.ts
[heavier-test]: ../../../src/app/core/repositories/workout-progress-acceptance.spec.ts#L59
[weight-test]: ../../../src/app/core/repositories/workout-progress-acceptance.spec.ts#L70
[streak-test]: ../../../src/app/core/repositories/workout-progress-acceptance.spec.ts#L79
[reason]: ../../../src/app/shared/components/workout-summary-modal/workout-summary-modal.html#L77
[server]: ../../../server/workspace.test.mjs#L57
[rollback]: ../../../server/workspace.test.mjs#L304
[retention]: ../../../server/pb_hooks/workspace.js#L36
