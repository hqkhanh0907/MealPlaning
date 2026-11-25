# Giáo án đầu tiên khi chưa có nhật ký tập

Đặc tả đề xuất cho MealPlaning cá nhân, ngày 24/11/2026. Đối tượng là người trưởng thành khỏe mạnh muốn tập sức mạnh hoặc tăng cơ. Ca minh họa giả định người dùng có thể thực hiện các động tác đã chọn. Người dùng có thể loại một động tác hoặc tự dùng giáo án riêng.

## Quyết định của app hiện tại

Khi chưa có giáo án hoạt động, app chọn toàn thân ba buổi. Hồ sơ có tuổi, chiều cao, cân nặng và giới tính. Các phép tính dinh dưỡng dùng những trường đó. Kinh nghiệm gym tự khai quy thành ba mức theo thời gian đã tập. [Khởi tạo giáo án](../../src/app/core/repositories/training-plan.repository.ts) · [Quy đổi kinh nghiệm](../../src/app/features/onboarding/onboarding-calculation.ts) · [Tính dinh dưỡng](../../src/app/core/services/profile/recalc-targets.ts)

Khi người dùng yêu cầu AI, app gửi mục tiêu, mức kinh nghiệm, danh mục bài, tổng kg × số lần trong tuần và số tuần tập liên tiếp. Hai hồ sơ khác chỉ số cơ thể nhưng giống các thông tin trên tạo cùng nội dung gửi AI. Ca thử với phản hồi giả lập chỉ có đẩy ngực trong hai ngày đã qua bước kiểm tra và lưu. [Tạo giáo án AI](../../src/app/core/services/ai/fitness-ai.ts) · [Định dạng đầu ra và chỉ dẫn](../../src/app/core/services/ai/prompts/training-plan.prompt.ts)

## Đầu vào và cách ra quyết định

| Quyết định | App cần biết gì? | Quy tắc đề xuất và cách xử lý khi thiếu dữ liệu |
|---|---|---|
| Chọn lịch | Mục tiêu tập, ngày có thể tập, số buổi mong muốn, số phút mỗi buổi, lịch cố định hay chu kỳ. | Chỉ xếp ngày người dùng chọn. Nếu số buổi vượt số ngày rảnh, hiện số ngày khả dụng và cho sửa trước khi tạo. |
| Chọn theo thứ hay theo chu kỳ | Với lịch cố định, lưu thứ trong tuần. Với chu kỳ, lưu thứ tự buổi, ngày nghỉ và vị trí đang tập. | Yêu cầu “ba buổi rồi nghỉ” có chu kỳ bốn ngày. Nếu phiên bản chỉ hỗ trợ lịch tuần, giải thích giới hạn và cho chọn lịch cố định. |
| Chọn bài | Dụng cụ thực có, vật hỗ trợ như ghế hoặc xà, bài quen và động tác người dùng muốn tránh. | Kiểm dụng cụ của **biến thể cụ thể**. Nếu thiếu một động tác cần thiết, nêu phần còn thiếu và cho đổi bài. |
| Chọn số hiệp | Mục tiêu, lịch gần đây, thời gian nghỉ tập và số phút có thể tập. | Với người mới, dùng số hiệp khởi đầu có thể chỉnh. Với người quay lại, xác nhận mức hiện tại trước khi dùng lịch sử cũ. |
| Chọn mức tạ | Lần ghi gần nhất của cùng bài, cùng biến thể, cùng đơn vị tải và mức gắng sức. | Chưa có dữ liệu phù hợp thì để trống kg. Tách “chưa biết” khỏi “0 kg tải ngoài” ở bài dùng trọng lượng cơ thể. |
| Giải thích đề xuất | Mục tiêu đã chọn, lịch rảnh, thiết bị, số hiệp trực tiếp và kết quả kiểm thời lượng. | Hiện lý do ngay trong bản xem trước. Người dùng được sửa và xác nhận trước khi thay giáo án đang dùng. |

Chiều cao, cân nặng, tuổi, giới tính, BMI và mức tiêu hao năng lượng chưa đủ để suy ra mức tạ của một bài. Trường hợp cần điều chỉnh theo giới hạn vận động phải dùng thông tin về động tác cụ thể. Phần trăm mỡ, nhịp tim và thiết bị đeo không phải đầu vào bắt buộc cho luồng này.

Nếu hồ sơ có lịch sử, ưu tiên buổi hoàn thành gần nhất của cùng biến thể và cùng đơn vị. Hiện ngày, kg và số lần của từng hiệp đã ghi. Dù buổi đó cách một tuần hay tám tháng, người dùng vẫn xác nhận mức tạ hiện tại. Chỉ tiêu giảm tải định kỳ trong PRD cần được đối chiếu trước khi triển khai. [Yêu cầu giáo án tập và AI](prd.md)

### Chọn bản nháp cho lịch cố định

Các lựa chọn dưới đây là mặc định sản phẩm để bắt đầu so sánh. Chỉ dùng những ngày người dùng đã chọn. Nếu có nhiều phương án khả thi, ưu tiên kiểu tập người dùng quen, rồi đến phương án ít đổi dụng cụ hơn.

| Số buổi đã chọn | Bản nháp đầu tiên | Điều cần kiểm |
|---|---|---|
| 1 | Một buổi toàn thân cho ngày đã chọn. | Hiện tần suất đạt được. Luồng AI hiện yêu cầu ít nhất hai buổi. Dùng bản cục bộ cho trường hợp một buổi. |
| 2–3 | Phân bổ các động tác toàn thân qua những ngày đã chọn. | Nếu các ngày liền nhau, hiện khoảng cách và cho luân phiên trọng tâm. Không khẳng định cơ đã hồi phục. |
| 4 | Thử hai buổi thân trên và hai buổi thân dưới. | Tính lại hiệp từng nhóm từ bài thật và so thời lượng từng buổi. |
| 5 | Bắt đầu từ bốn buổi trên. Phân một phần hiệp đã dự kiến sang buổi thứ năm theo nhóm ưu tiên. | Giữ tổng dự kiến khi chỉ đổi cách chia buổi. Nếu người dùng muốn tăng lượng tập, hiện riêng số hiệp tăng thêm. |

Nếu mục tiêu là cải thiện thành tích, hỏi người dùng muốn cải thiện bài hoặc động tác nào. Nếu mục tiêu là tăng cơ, hiển thị các nhóm cơ ưu tiên. Khi hai mục tiêu đều quan trọng, cho chọn ưu tiên lần này. Khi người dùng chưa rõ, cho xem mẫu tập tổng quát và lý do chọn.

Lưu tùy chọn ngày, thời lượng và thiết bị riêng với giáo án. Bản xem trước chưa tạo buổi trong nhật ký. Khi kích hoạt, chỉ áp dụng thay đổi cho buổi bắt đầu sau đó. Hồ sơ cũ có giáo án hoạt động tiếp tục dùng lịch đã lưu. [Quy tắc bảo toàn nhật ký](../4-architecture/business-rules.md#rule-workout-history--giáo-án-và-nhật-ký-tập)

## Bằng chứng và giới hạn áp dụng

| Loại | Căn cứ | Quyết định cho app |
|---|---|---|
| Phép đếm | Đếm số ngày khác nhau có bài tác động chính vào nhóm cơ. Cộng số hiệp của các bài đó. | Hai bài ngực cùng ngày vẫn là một ngày. Tách số dự kiến khỏi hiệp thực tập trong buổi đã hoàn thành. Hiệp bỏ qua không cộng. |
| Khuyến nghị cho người lớn khỏe mạnh | ACSM khuyến nghị tập các nhóm cơ lớn ít nhất hai lần mỗi tuần. Với tăng cơ, khoảng 10 hiệp mỗi nhóm cơ mỗi tuần là mốc tham khảo. [ACSM, 2026](https://acsm.org/resistance-training-guidelines-update-2026/) | Hiện mức tập của tuần đầu. Không dùng 10 hiệp làm điều kiện bắt buộc để bắt đầu. Cho phép một ngày khả dụng và giải thích giới hạn của lịch. |
| Kiểu chia lịch | Tổng quan 14 nghiên cứu với 392 người ghi nhận kết quả tương tự giữa tập toàn thân và chia nhóm khi tổng lượng tập tương đương. [Ramos-Campo và cộng sự, 2024](https://pubmed.ncbi.nlm.nih.gov/38595233/) | Chọn 3, 4 hoặc 5 buổi theo lịch khả thi. Không dùng số năm tập để bắt buộc tập 5–6 buổi. |
| Tải tương đối | Số lần có thể thực hiện ở cùng tỷ lệ sức tối đa thay đổi theo bài và cá nhân. [Nuzzo và cộng sự, 2024](https://doi.org/10.1007/s40279-023-01937-7) | Lấy lần thực hiện cùng bài làm mốc. Với tạ đơn, xác định kg mỗi tay hoặc tổng hai tay trước khi so. |
| Mức gắng sức và giảm tải | Cảm nhận số lần còn có thể thực hiện có sai số. Đồng thuận về giảm tải tập trung vào thể thao sức mạnh và hình thể. [Halperin và cộng sự](https://pubmed.ncbi.nlm.nih.gov/34542869/) · [Bell và cộng sự, 2023](https://doi.org/10.1186/s40798-023-00633-0) | Ghi cảm nhận để xem cùng số lần và tạ. Chưa xác minh được ngưỡng tự tăng tạ hoặc tự giảm tải riêng cho Khanh. |
| Ước tính thời lượng | Số giây thực hiện, khởi động và chuyển bài phụ thuộc người tập. Nghiên cứu về nghỉ giữa hiệp không cho một con số tối ưu riêng cho mọi người. [Singer và cộng sự, 2024](https://doi.org/10.3389/fspor.2024.1429789) | Hiện giả định và số phút dự phòng. Thời gian thực đo sau buổi đầu dùng để chỉnh ước tính. |

## Ví dụ nghiệm thu: thứ Ba và thứ Sáu, 35 phút, hai tạ đơn

Người thử mới tập, chọn tập toàn thân và có sàn trống. Thiết bị gồm hai tạ đơn, không có ghế, máy, cáp hoặc xà. Hai buổi giống nhau giúp đối chiếu lần tập kế tiếp. Đây là dữ liệu kiểm sản phẩm, chưa phải giáo án đã kê riêng cho Khanh.

| Bài trong mỗi buổi | Nhóm chính dùng để đếm | Khối lượng dự kiến | Dụng cụ thực tế | Tình trạng danh mục |
|---|---|---|---|---|
| Squat ôm một tạ đơn | Đùi trước | 2 hiệp × 8–12 lần | Một tạ đơn | Mẫu dùng `goblet-squat`. |
| Chống đẩy | Ngực | 2 hiệp × 8–12 lần | Sàn | Mẫu dùng `push-up`. Nếu biến thể này quá khó, cho đổi trước khi ghi. |
| Kéo tạ đơn chống đẩy luân phiên | Lưng | 2 hiệp × 8–12 lần | Hai tạ đơn và sàn | Mẫu dùng `renegade-row`. Danh mục gốc không có bài kéo hai tạ khi đứng gập hông. |
| Deadlift Romania hai tạ đơn | Đùi sau | 2 hiệp × 8–12 lần | Hai tạ đơn | Mẫu dùng `dumbbell-romanian-deadlift`. |

Đây là bốn kiểu động tác trong ví dụ tập toàn thân: gập gối, đẩy, kéo và gập hông. Bộ kiểm xét chúng trên cả tuần. Các bài phối hợp còn huy động cơ phụ. Bảng chỉ cộng hiệp cho nhóm chính trong danh mục. [Danh mục bài và dụng cụ](../../src/app/core/repositories/fitness-seed.ts)

**Phép tính độc lập.** Mỗi buổi có 8 hiệp. Mỗi nhóm chính có 2 ngày và 4 hiệp trực tiếp mỗi tuần. Mức kg cho bài tạ đơn để trống đến khi người dùng xác lập. Ngày còn lại là ngày không lên lịch tập.

| Thành phần thời gian | Giả định của ví dụ | Hai hiệp mỗi bài | Một hiệp mỗi bài |
|---|---|---:|---:|
| Khởi động | Tổng 5 phút | 5 phút | 5 phút |
| Thực hiện | 45 giây mỗi hiệp | 6 phút | 3 phút |
| Nghỉ giữa hai hiệp cùng bài | 90 giây mỗi khoảng | 6 phút | 0 phút |
| Nghỉ và chuyển sang bài kế tiếp | 120 giây mỗi lần, ba lần | 6 phút | 6 phút |
| Dự phòng | Tổng 5 phút | 5 phút | 5 phút |
| **Tổng ước tính** | | **28 phút** | **19 phút** |

Ở mức 35 phút, bản hai hiệp còn 7 phút ngoài phần dự phòng đã tính. Nếu chỉ có 20 phút, bản một hiệp là lựa chọn để người dùng xem trước. Nếu ngay cả bản rút gọn vượt thời lượng, giải thích và cho người dùng sửa. Không âm thầm cắt thời gian nghỉ.

**Mẫu Hai tạ đơn và sàn.** Người dùng có thể xem từng buổi trước khi chọn mẫu. Mỗi bài có hướng dẫn tiếng Việt và hình đọc ngoại tuyến. Màn ghi hiệp dùng tổng kg của hai tạ cho các bài cầm hai tạ rời.

Phần hướng dẫn tham khảo cách trình bày của openGym tại `e4a68a94c42a3c17cbd560d66ce2e46a7048ab99`. Màn chi tiết gọi `instrFor(ex)` để hiển thị từng bước. Dữ liệu tiếng Anh của bài kéo lưng nằm trong trường `instructions` của bài 0293. [Màn chi tiết](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/frontend/src/sheets.jsx#L1613) · [Bản ghi bài kéo lưng](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/catalogue/exercises/0293.json)

Các bước tiếng Anh của bài 0293 đến từ ExerciseDB v1 qua exercises-dataset, theo MIT. Mã openGym, mô tả riêng và bản dịch của họ dùng AGPL-3.0. Gym visual cấp riêng quyền dùng ảnh và hoạt ảnh cho openGym. [Thông báo giấy phép](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/NOTICE.md#L47)

MealPlaning dùng lời hướng dẫn tiếng Việt viết riêng theo từng mã của danh mục gốc. Hình lấy nguyên từ Open Exercise Illustrations, xem mục "Danh mục gốc" bên dưới. openGym chỉ là tham khảo về cách trình bày. Không tệp hình nào của Gym visual nằm trong ứng dụng.

Hai hiệp và khoảng 8–12 lần là lựa chọn cho ví dụ người lớn khỏe mạnh mới tập. Mốc nghỉ 90 giây là giả định của mẫu. Mức tạ bắt đầu do người dùng xác lập. [ACSM, mô hình tăng tiến 2009](https://pubmed.ncbi.nlm.nih.gov/19204579/) · [ACSM, tổng quan 2026](https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/)

## Hồ sơ đối chứng và tiêu chí chấp nhận

Mỗi hàng bắt đầu từ hồ sơ chuẩn ở trên. Chỉ thay đổi yếu tố ghi ở cột đầu. Các hàng có lịch sử dùng cùng một hồ sơ tham chiếu đã ghi rõ trong hàng.

| Thay một yếu tố | Kết quả cần quan sát |
|---|---|
| Đổi ngày rảnh sang thứ Tư và thứ Bảy | Chỉ hai ngày mới có buổi tập. Số hiệp, dụng cụ và thời lượng không tự đổi. |
| Giảm thời lượng từ 35 xuống 20 phút | Bản 28 phút vượt giới hạn. Bản 19 phút vừa thời gian. Mỗi nhóm còn 2 hiệp trực tiếp mỗi tuần. |
| Chọn một buổi thay cho hai | Giữ một ngày do người dùng chọn. Thông báo lịch này cho mỗi nhóm một lần tập trong ví dụ. |
| Giữ hồ sơ nhưng thêm ghế điều chỉnh | Biến thể đẩy ngực dốc trở thành lựa chọn. Tạ đơn vẫn cần mức kg do người dùng xác lập. |
| Đổi riêng cân nặng từ 55 thành 90 kg | Không tự điền kg tạ đơn. Số buổi và lịch khả dụng giữ nguyên. |
| Có lịch sử cùng bài, đổi riêng mức gần nhất từ 6 thành 10 kg mỗi tay | Dòng “Lần trước” đổi từ 6 thành 10 kg mỗi tay. Hiệp mới vẫn chờ ghi nhận. |
| Có cùng thành tích, đổi riêng thời điểm từ tuần trước thành tám tháng trước | Hiện ngày thực tập và hỏi người dùng xác lập lại mức hiện tại. Tám tháng là dữ liệu thử, không phải ngưỡng sinh lý. |
| Đề xuất toàn thân nhưng cả hai buổi chỉ có đẩy ngực | Báo thiếu các kiểu động tác của lịch toàn thân. Không kích hoạt bản nháp dù mã bài và các con số hợp lệ. |
| Người dùng loại chống đẩy | Tìm biến thể đẩy đã xác nhận dụng cụ và khả năng thực hiện. Nếu chưa có, nêu rõ phần thiếu. |
| Mất mạng giữa lúc xem trước hoặc hủy chỉnh | Vẫn dùng được mẫu cục bộ. Giữ giáo án đang hoạt động. Mở lại app kiểm lịch cũ và buổi đã lưu. |

## Điểm tích hợp và nghiệm thu Android

1. Thu các lựa chọn tập ở lần đầu mở mục Giáo án. Hồ sơ cũ được giữ và chỉ hỏi phần còn thiếu.
2. Sinh bản nháp cục bộ. Cả mẫu và AI phải qua cùng quy tắc lịch, dụng cụ, thời lượng và phạm vi nhóm cơ.
3. Hiện ngày, động tác, dụng cụ, số hiệp, khoảng số lần, phút ước tính và lý do. Chỉ lưu giáo án hoạt động sau khi xác nhận.
4. Trên Android, thử ca hai ngày với mạng tắt. Kiểm cả trạng thái thiếu bài và trạng thái đủ bài sau khi danh mục hỗ trợ.
5. Ghi khối lượng buổi đầu. Hoàn thành buổi, đóng hẳn app, mở lại và đối chiếu tạ, số lần, đơn vị cùng ngày đã ghi.

Bộ đối chiếu kiểm phép tính của ví dụ, cặp hồ sơ, danh mục và các biến thể trong mẫu. Chạy từ gốc dự án bằng `node --import tsx --test scripts/audit/initial-training-plan.cjs`.

## Danh mục gốc và hướng dẫn ngoại tuyến, ngày 24/11/2026

Danh mục bài tập của ứng dụng là nguyên bộ Open Exercise Illustrations tại phiên bản `2786aefa4b36a08faeca8114e0d1eb0af3ef6732`, giấy phép CC0. Ứng dụng dùng mã gốc của nguồn làm mã bài. Ứng dụng chưa phát hành, nên seed cũ được thay hẳn và không có lớp chuyển đổi. [Kho nguồn](https://github.com/hitmanrepo/open-exercise-illustrations/tree/2786aefa4b36a08faeca8114e0d1eb0af3ef6732) · [Giấy phép](https://github.com/hitmanrepo/open-exercise-illustrations/blob/2786aefa4b36a08faeca8114e0d1eb0af3ef6732/LICENSE)

| Hạng mục | Giá trị |
|---|---|
| Mã bài trong nguồn | 415 |
| Mã bài trong ứng dụng | 415, khớp hai chiều, không thiếu, không thừa, không trùng |
| Tệp hình đóng gói | 796, trùng từng byte với nguồn |
| Bí danh và tên biến thể của nguồn | Dùng để tìm đúng bài. 44 tên biến thể không thành bài riêng. |
| Mã còn vướng giữa chữ và hình | 69, liệt kê trong `scripts/audit/exercise-guides.open.json` |
| Mã có nguồn kỹ thuật chưa đạt mức chuyên môn | 250, cùng tệp trên |

Tác giả bộ hình ghi rõ hình do AI tạo và chưa có huấn luyện viên thẩm định. Vì vậy chữ kỹ thuật dựa trên nguồn chuyên môn của từng bài. Mỗi bài qua một lượt viết và một lượt phản biện độc lập, cả hai đều mở từng khung hình. Bài nào hình mâu thuẫn với nguồn vẫn nằm trong danh mục và được ghi vào danh sách còn vướng.

Nhập lại danh mục bằng `node scripts/fitness/import-open-exercise-illustrations.mjs`. Thêm `--check` để chỉ kiểm. Chạy lần hai không đổi tệp nào. Bản ghim của `exercises.json` nằm trong `scripts/fitness/open-exercise-illustrations/`. Bộ kiểm `scripts/audit/exercise-guides.cjs` đọc danh sách kỳ vọng từ bản ghim đó.

Hướng dẫn hiện các khung hình theo đúng thứ tự nguồn khai báo: Bắt đầu rồi Kết thúc, có thêm khung Giữa ở bài ba khung, và một khung Tư thế giữ ở bài giữ tĩnh. Màn xem trước giáo án và màn đang tập dùng chung một bảng hướng dẫn. Giao diện giữ nền sáng. Nền tối chỉ nằm trong hình.

Đơn vị ghi theo từng mã: bài giữ tĩnh, giãn cơ giữ, mang vác và máy cardio ghi giây. Bài một bên của nguồn ghi "Số lần mỗi bên". Bài cầm hai tạ rời ghi "Tổng hai tạ (kg)".

Giáo án mẫu dùng mã gốc. Mẫu Hai tạ đơn và sàn chỉ gồm bài mà nguồn khai báo dụng cụ là tạ đơn hoặc không dụng cụ. Bài kéo của mẫu đổi sang `renegade-row`, khó hơn bài kéo khi đứng gập hông.

### Nghiệm thu trên Android, ngày 24/11/2026

Môi trường: APK debug `com.healthmate.ai`, giả lập Android 16 API 36, 1080×2400, mật độ 420, cỡ chữ 1.0, hồ sơ thử mới, chế độ máy bay, Wi-Fi và dữ liệu di động tắt.

| Thao tác | Kết quả trên Android |
|---|---|
| Mở hướng dẫn từng bài qua bộ chọn bài của buổi tự do. | 415 trên 415 bài mở đúng tên, chữ, nguồn, thứ tự khung và tải đủ hình. 0 bài lỗi. |
| Xem trước mẫu Hai tạ đơn và sàn, rồi Full Body 3 buổi. | Bài kéo hai tạ trên sàn hiện hai khung. Plank hiện một khung Tư thế giữ. |
| Buổi Full Body A: nhập 50 kg × 8, mở rồi đóng hướng dẫn, ghi hiệp. | Số đang nhập giữ nguyên. Hiệp ghi 50 kg × 8 lần, khối lượng 400 kg. |
| Mở hướng dẫn khi đang nghỉ. | Hiệp đã lưu giữ nguyên. Đồng hồ đi từ 1:58 xuống 1:52 sau 6.1 giây thực. |
| Đổi sang đẩy ngực rồi quay lại squat. | Tên, dụng cụ, chữ và hình đổi theo bài. Hiệp cũ vẫn thuộc squat. |
| Ghi plank 30. | Màn ghi dùng nhãn Tập (giây). Lịch sử lưu 30 giây. |
| Buổi tự do: hai tạ đơn 20 kg × 8, split squat 16 kg × 8 mỗi bên. | Nhãn Tổng hai tạ (kg) và Số lần mỗi bên. Khối lượng 160 kg và 128 kg, không nhân đôi. |
| Tìm "Barbell Rollout" trong bộ chọn bài. | Ra đúng bài của mã `ab-wheel-rollout`. Mã seed cũ không còn. |
| Mở hướng dẫn khi bàn phím đang mở. | Tạ và số lần đang nhập giữ nguyên. |
| Hoàn thành hai buổi, đóng hẳn app, mở lại khi ngoại tuyến. | Lịch sử khớp cả 9 hiệp đã ghi. |
| Đổi sang màn 720×1280 và cỡ chữ 1.3 giữa buổi. | Buổi đang tập và hiệp đã ghi còn nguyên. Không tràn ngang, ảnh giữ tỷ lệ. |
| Mở một bài tự tạo ngoài danh mục. | Hiện "Chưa có hướng dẫn và hình minh họa cho bài này." |

Kết quả từng ca, ảnh chụp và APK nằm trong [thư mục bàn giao Android](../../e2e/artifacts/exercise-guides/catalog/). Kịch bản chạy lại nằm trong `e2e/exercise-guides/`.
