# Nghiệm thu Tập luyện 0.3.0 trên Android

Phiên bản Android 0.3.0 dùng commit `81fa007a2513fd073c5b7541a26220fa84bda446`. App và server dùng cùng mã phát hành. APK đã cài có SHA-256 trùng với tệp bàn giao. [Kết quả trên thiết bị][android] · [CI khi push][push-ci] · [CI Android][ci]

APK debug mang tên gói `com.healthmate.ai`, phiên bản 0.3.0, mã Android 6. SHA-256 của tệp là `d2f00a5cfddf6f86643af7959079f0b0dd43f8cf65972ec24ec9caa587ef40d1`.

## Kết quả phát hành

| Phép kiểm | Kết quả | Bằng chứng |
|---|---|---|
| APK phát hành, Android API 36, tài khoản QA trên server thật | 23/23 phép kiểm đạt, kể cả ngoại tuyến, tắt tiến trình, tập lại và đồng bộ. | [Báo cáo trên thiết bị][android] |
| CI Android x86_64 | 81/81 ca hồi quy, 4 mục điều hướng chính và 19 phép kiểm hành trình ngoại tuyến đạt. | [Bộ ảnh và kết quả CI][legacy] |
| Unit và backend | 1.093 ca Chrome Headless và 5 ca backend đạt. | [Unit và build][unit] · [PocketBase][backend] |
| Máy chủ | Đã sao lưu hai DB, khôi phục vào thư mục riêng và kiểm toàn vẹn. Hai service hoạt động. Đối chiếu từng tệp trong `server/` với SHA phát hành đạt. | [Kết quả triển khai][production] |
| Dữ liệu đồng bộ | Server trả workspace phiên bản 13, revision 1, đủ 3 hiệp và 3 cài đặt. Mức 10 kg mỗi tay lưu thành 20 kg tổng. | [Đối chiếu trên APK][android] |

Phép kiểm AI dùng phản hồi giả lập để thử điều kiện chấp nhận và từ chối. Phép kiểm đồng bộ dùng server đang phục vụ. Với thao tác của người tập thật, xem phần theo dõi sau phát hành.

## Giáo án và dụng cụ · F-08

| Tiêu chí trong PRD | Cách kiểm | Kết quả | Bằng chứng |
|---|---|---|---|
| Bốn mã mẫu, lịch, dụng cụ và buổi dài nhất | Nạp mẫu vào SQLite và chạy bộ lọc. | SQLite nạp bốn mẫu, giữ trống giáo án hoạt động. Bộ lọc chỉ giữ mẫu vừa lịch, dụng cụ và thời lượng. | [`seeds all presets without activating any until explicitly chosen`][seed] · [Kiểm điều kiện từng mẫu][finder-tests] |
| Xem ngày, bài, hiệp, lần hoặc giây và nghỉ trước khi chọn | Mở bản xem trước trên Android. | Android mở hai bản xem trước và xem đúng bài. Mẫu đề xuất hiện ngày, số hiệp, đơn vị và thời gian nghỉ. | [Hồi quy Android][legacy] · [Giao diện đề xuất][preview-dose] |
| Đổi lịch hoặc rút gọn, xác nhận, mở lại, giữ nhật ký cũ | Đổi lịch và thời lượng rồi lưu lại. | Kiểm đổi sang thứ Tư và thứ Bảy, giảm hiệp, lưu bản riêng và từ chối xác nhận đã cũ. Nhật ký trước đó còn nguyên. | [Ca đổi lịch và rút gọn][finder-tests] · [Lưu nguyên tử][atomic] · [Kiểm bản cá nhân][personal] |
| Ít nhất 50 bài, lọc dụng cụ và xem kỹ thuật ngoại tuyến | Tìm bài trên Android đang ngoại tuyến. | Danh mục có 415 bài. Giả lập lọc tạ đơn, mở đúng hướng dẫn squat trước khi có buổi tập. | [Bộ ca danh mục][seed-count] · [Kết quả Android][android] |
| Nhiều mẫu hoặc thiếu mẫu | So hai lịch rảnh và giảm số phút. | Chọn bốn buổi xếp Upper / Lower đầu tiên, các mẫu đạt khác vẫn xuất hiện. Với 25 phút tại nhà, Android mở bản xem trước và giữ nút tập tự do. | [`ranks exact frequency without hiding other feasible plans`][frequency] · [Ảnh xem trước][preview-image] |

## Ghi buổi tập · F-09

| Tiêu chí trong PRD | Cách kiểm | Kết quả | Bằng chứng |
|---|---|---|---|
| Tập theo ngày đã chọn hoặc thêm bài tự do | Mở buổi theo lịch rồi mở buổi tự do. | Android tập Full Body A đúng bốn bài. Sau đó thêm từng bài ở buổi tự do. | [Kết quả theo từng bài][legacy] |
| Mức đã xác nhận, mức lần trước, sửa, xóa và số lần trống | Xác nhận tạ, tập lại rồi xóa ô nhập. | Sau khi xác nhận 10 kg mỗi tay, buổi sau hiện 10 và để trống số lần. Xóa mức điền sẵn giữ nguyên hiệp cũ. | [`verifyNextLoad`][next-load] · [Kết quả Android][android] |
| Giây, số lần mỗi bên và kg mỗi tay | Ghi bài tính giây và bài dùng hai tạ. | Android lưu plank 30 giây, plank nghiêng 20 giây mỗi bên. Sửa hiệp hai tạ hiển thị 10 kg mỗi tay. | [Chi tiết nhật ký và lịch sử][legacy] |
| Xem kỹ thuật, tiếp tục đúng hiệp, tự đếm nghỉ, cảm nhận tùy chọn | Mở kỹ thuật trước và trong thời gian nghỉ. | Mở và đóng hướng dẫn giữ nguyên giá trị đang nhập. Đồng hồ tiếp tục chạy. Bộ kiểm ghi cả hiệp có đánh dấu Dễ và hiệp bỏ trống cảm nhận. | [Đồng hồ và hiệp][legacy] · [Phục hồi bản nháp][android] |
| Hoàn thành sau khi có hiệp thật, chỉ tính khối lượng của hiệp phù hợp | Thử hoàn tất buổi chỉ có hiệp bỏ. | Ca toàn hiệp bỏ từ chối hoàn tất. SQLite phân biệt giây, lần và khối lượng thập phân sau khi mở lại. | [Kiểm điều kiện hoàn thành][only-skipped] · [Kiểm các đơn vị][units] |
| Hủy, đổi giáo án và hoàn tác có điều kiện | Hủy, đổi giáo án rồi thử hoàn tác. | Kiểm đổi giáo án sau hủy. Hoàn tác trả đúng buổi. Có buổi khác đang tập thì từ chối hoàn tác. | [Đổi giáo án][cancel-switch] · [Kiểm hoàn tác][undo] |
| Lịch sử hiển thị hiệp thật, hiệp bỏ và bản tập lại độc lập | Mở lịch sử và tập lại buổi độc lập. | Kiểm màn lịch sử tách hai loại hiệp. Android mở buổi mới từ bản đã soạn và giữ nguyên hiệp ở buổi gốc. | [Kiểm lịch sử][history] · [Kết quả tập lại][android] |
| Thay bài theo mục đích, dụng cụ và phạm vi người tập chọn | So bài thay thế và mở lại tại hai nơi. | Bộ lọc đối chiếu mẫu vận động và dụng cụ. Ca SQLite giữ hiệp cũ và chỉ áp dụng quy tắc tại đúng nơi. | [Điều kiện chọn bài][replacement-filter] · [Kiểm thay bài][substitution] |
| Đo thời gian ghi hiệp | Đo thao tác tự động trên Android. | Android mất 671 ms từ khi nhập tạ đến khi hàng hiệp xuất hiện. Thời gian thao tác thực của người tập cần đo riêng. | [Số đo và phương pháp][android] |

## Tiến bộ · F-10

| Tiêu chí trong PRD | Cách kiểm | Kết quả | Bằng chứng |
|---|---|---|---|
| 1RM của ba bài chính, hiệp Tối đa trong 1–10 lần | So 1RM với hiệp các mức gắng sức. | Ca squat 60 kg × 5 cho 70 kg ước tính. Bộ lọc loại hiệp Dễ, 11 lần và bài ngoài danh sách. Công thức dùng tạ đã ghi cho một lần. | [Ca giới hạn 1RM][strength] · [Nhánh một lần và danh sách ba bài][strength-query] |
| So hai tuần, hiển thị tám tuần kể cả tuần trống | Mở biểu đồ sau khi ghi hiệp. | Android mở tám hàng. Tuần có hiệp 7 kg × 9 hiện 63 kg. Các tuần trống trong dữ liệu thử hiện 0. | [Số liệu tuần][trend-image] · [Trình kiểm Android][journal] |
| Chuỗi tuần thực tập, tối đa 12 tuần | Ghi hiệp trong 13 tuần liên tiếp. | Ghi hiệp thật và hoàn tất 13 tuần liên tiếp. Kết quả là 12. Sang tuần trống kế tiếp, kết quả là 0. | [Ca giới hạn chuỗi tuần][streak-test] |
| Trung bình cân nặng bảy ngày và nhãn nguồn | Nạp ngày cân bên trong và ngoài cửa sổ. | Ba lần cân 70, 67 và 69 kg cho 68,7 kg. Hai lần cân ngoài khoảng bị loại. Khi thiếu nhật ký, ca riêng trả 65 kg từ hồ sơ. | [Ca cửa sổ bảy ngày][weight-test] · [Ca dùng hồ sơ][progress] |
| Mở biểu đồ, đọc giá trị và xem buổi khi cuộn | Mở biểu đồ và cuộn tới thẻ buổi. | Android mở biểu đồ, đọc giá trị, thu gọn rồi mở thẻ buổi tập. Phép kiểm này chưa đo khung hình mỗi giây. | [Ảnh biểu đồ][trend-image] · [Ảnh lịch sử][history-image] |

## Soạn buổi và hỗ trợ điều chỉnh · F-11

| Tiêu chí trong PRD | Cách kiểm | Kết quả | Bằng chứng |
|---|---|---|---|
| AI chỉ dùng bài cho phép và kiểm lại điều kiện | Cho dịch vụ trả bản nháp đúng và sai. | Kiểm bản nháp với sai lịch, thiếu dụng cụ, vượt phút và động tác cần tránh. Ca dịch vụ dùng phản hồi giả lập và loại mã lạ. | [Kiểm ràng buộc][draft] · [Kiểm đầu ra AI][ai-test] |
| Chỉ tạo giáo án AI sau xác nhận, giữ lịch sử khi lỗi | Xem trước, xác nhận và tạo lỗi lưu. | Store kiểm bước xem trước, xác nhận và từ chối ngoại tuyến. Repository lưu nguyên tử, giữ bản AI cũ và ngày đã ghi. | [Kiểm xem trước][ai-store] · [Kiểm bảo toàn lịch sử][ai-preserve] |
| Đủ mục tiêu cùng mức tạ, hiệp cuối Dễ | Ghi hai hiệp rồi xác nhận mức tiếp theo. | Android ghi hai hiệp × 12 với 8 kg mỗi tay theo mục tiêu của buổi. Người tập xác nhận 10 kg cho lần sau. Ca âm loại tải khác nhau, hiệp bỏ và hiệp cuối Nặng. | [Kết quả Android][android] · [Kiểm ca âm][negative] |
| Gợi ý mức nặng hơn tại đúng nơi hoặc cho tự nhập | Ghi lịch sử hai nơi rồi sửa gợi ý. | Với mức hiện tại 20 kg, SQLite chọn 24 kg tại nhà và bỏ 22 kg ở gym. Sửa sang 26 kg lưu đúng. Android kiểm trường hợp chưa biết mức. | [Ca chọn và sửa mức tạ][heavier-test] · [Kết quả Android][android] |
| Lý do thiếu hiệp tùy chọn | Lưu lý do của buổi tập thiếu hiệp. | Ca SQLite lưu đúng nội dung người tập nhập. Màn tổng kết chỉ gửi lý do khi người dùng chọn lưu. | [Kiểm ghi lý do][negative] · [Điều khiển ghi và bỏ qua][reason] |
| V1 không tự giảm tải định kỳ hoặc ép số hiệp chung | Đọc lời nhắc AI và quy tắc cục bộ. | Đối chiếu quyết định sản phẩm với prompt AI và cách soạn buổi. Đội sản phẩm không đặt ngưỡng chung cho mọi nhóm cơ. | [Quyết định v1][decisions] · [Prompt AI][ai-prompt] |

## Vòng đời buổi tập và đồng bộ

| Tình huống | Kết quả và phạm vi bằng chứng |
|---|---|
| Vào từ Lịch ăn, quay lại, tắt tiến trình trong lúc ghi | Android trở về đúng Lịch ăn. Mở lại buổi còn đúng bài, tạ và số lần đang nhập. [Kết quả Android][android] |
| Hai lần nhấn ghi hoặc bắt đầu đồng thời | Android chỉ ghi một hàng SQLite. Ca tranh chấp khởi động chỉ tạo một buổi hoạt động. [Kết quả Android][android] · [Ca hai thao tác đồng thời][concurrency] |
| Danh tính, xung đột, retry và tương thích | PocketBase thử nghiệm kiểm hai thiết bị cùng tài khoản, cô lập tài khoản khác và dữ liệu phiên bản cũ. [Ca đồng bộ][server] · [Nhật ký backend][backend] |
| Nơi tập, dụng cụ, lịch và mức tạ đã xác nhận | APK phát hành lưu vào SQLite và đối chiếu từng giá trị với API của tài khoản QA mới. Cả bốn kiểm tra server đều đạt. [`verifyRemote`][remote] |
| Lùi server rồi nâng lại | Ca thử phục hồi dữ liệu huấn luyện từ phiên bản gần nhất còn trong lịch sử sau một lần ghi kiểu cũ. Mỗi tài khoản chỉ giữ 32 phiên bản trước. Sau hơn 32 lần ghi bằng server cũ, dữ liệu mở rộng có thể mất khả năng phục hồi từ lịch sử. [Ca lùi phiên bản][rollback] · [Giới hạn lưu lịch sử][retention] |

## Cần theo dõi sau phát hành

So thời gian dự kiến với thời gian bắt đầu và hoàn tất của cùng buổi. Đối chiếu bài thay và nhật ký thực tập tại từng nơi. Quan sát người tập ghi hiệp trong lúc nghỉ để đo thời gian nhập thực tế.

Đánh giá sức mạnh qua nhiều buổi với cùng bài, cùng đơn vị và mức gắng sức tương đương. Số hiệp, tổng khối lượng và tốc độ giao diện chưa xác nhận tăng cơ hoặc mức phù hợp của giáo án cho từng người. [Cách đo và giới hạn][decisions]

## Hiệu năng và phạm vi đo

| Phép đo | Kết quả trên APK phát hành | Mục tiêu PRD |
|---|---|---|
| Ghi hiệp từ khi nhập tự động tới lúc hiện hàng đã lưu | 671 ms | ≤ 5.000 ms |
| Khởi động lạnh tới khi trình kiểm thấy dữ liệu Tổng quan | 2.605 ms, gồm kết nối lại WebView | ≤ 2.000 ms |
| Khởi động Activity do Android đo | 1.947 ms | Phép đo bổ sung |
| Kích thước APK debug đa kiến trúc | 55.914.593 byte | ≤ 30 MB |
| Cuộn Tổng quan, năm lượt sau làm nóng | 59,95–60,22 FPS. SurfaceFlinger ghi 241 khoảng khung. | ≥ 60 FPS |
| Mở Hôm nay, Giáo án, Bài tập và Lịch sử khi app đang chạy | Trung vị theo thứ tự là 27,4 / 34,4 / 45,4 / 194,2 ms. | Phép đo bổ sung |

Giả lập dùng màn hình 60 Hz. Một lượt cuộn thấp hơn 60 FPS. Đo trên điện thoại thật trước khi kết luận tốc độ tối thiểu. [Cách đo và kết quả](workout-performance-0.3.0.json)

App chạy trên giả lập arm64 với màn hình 1080x2400. Cận trên khi mở app và kích thước APK vượt mục tiêu. Số liệu người dùng trong một năm cần theo dõi khi đã có lịch sử sử dụng thật. [Số đo và thời điểm chụp ảnh][android]

## Thử bản 0.3.0

Mở **Tập luyện → Hôm nay → Tìm giáo án phù hợp**. Chọn ngày, số phút và dụng cụ tại nơi mặc định. Xem trước một buổi, mở hướng dẫn rồi ghi một hiệp. Mở **Lịch sử** để xem số liệu.

Trong phép kiểm 25 phút tại nhà với tạ đơn, app soạn ba bài. Buổi gồm squat ôm tạ, đẩy ngực tạ đơn nằm sàn và deadlift Romania hai tạ đơn. Bản xem trước ghi hai hiệp mỗi bài cùng thời gian nghỉ.

[ci]: https://github.com/hqkhanh0907/MealPlaning/actions/runs/46026882693
[push-ci]: https://github.com/hqkhanh0907/MealPlaning/actions/runs/46026881968
[production]: workout-release-server-0.3.0.json
[prd]: ../../2-requirements/prd.md#72-performance-targets
[decisions]: ../../2-requirements/workout-coaching-v1.md
[android]: workout-live-0.3.0.json
[legacy]: https://github.com/hqkhanh0907/MealPlaning/actions/runs/46026882693/artifacts/15213121664
[tabs]: https://github.com/hqkhanh0907/MealPlaning/actions/runs/46026882693/artifacts/15213121664
[preview-image]: https://github.com/hqkhanh0907/MealPlaning/actions/runs/46026882693/artifacts/15213121664
[preview-dose]: ../../../src/app/features/fitness/components/workout-plan-finder/workout-plan-finder.html#L303
[trend-image]: https://github.com/hqkhanh0907/MealPlaning/actions/runs/46026882693/artifacts/15213121664
[history-image]: https://github.com/hqkhanh0907/MealPlaning/actions/runs/46026882693/artifacts/15213121664
[unit]: https://github.com/hqkhanh0907/MealPlaning/actions/runs/46026882693/job/140600471633
[focused]: https://github.com/hqkhanh0907/MealPlaning/actions/runs/46026882693/job/140600471633
[backend]: https://github.com/hqkhanh0907/MealPlaning/actions/runs/46026882693/job/140600472098
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
[concurrency]: ../../../src/app/core/repositories/workout-coaching.repository.spec.ts#L70
[substitution]: ../../../src/app/core/repositories/workout-coaching.repository.spec.ts#L83
[replacement-filter]: ../../../src/app/features/fitness/components/workout-substitution/workout-substitution.ts
[history]: ../../../src/app/features/fitness/history/history.page.spec.ts#L147
[strength-query]: ../../../src/app/core/repositories/workout.repository.ts
[heavier-test]: ../../../src/app/core/repositories/workout-progress-acceptance.spec.ts#L59
[weight-test]: ../../../src/app/core/repositories/workout-progress-acceptance.spec.ts#L70
[streak-test]: ../../../src/app/core/repositories/workout-progress-acceptance.spec.ts#L79
[reason]: ../../../src/app/shared/components/workout-summary-modal/workout-summary-modal.html#L77
[server]: ../../../server/workspace.test.mjs#L57
[rollback]: ../../../server/workspace.test.mjs#L304
[retention]: ../../../server/pb_hooks/workspace.js#L2
