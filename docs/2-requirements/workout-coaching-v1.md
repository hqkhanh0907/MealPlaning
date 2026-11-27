# Chọn giáo án và ghi buổi tập trên Android

Bản 0.3.0 phục vụ người muốn tập sức mạnh hoặc tăng cơ với lịch và dụng cụ thực có. Người tập có thể dùng ngay thư viện, ghi từng hiệp và giữ giáo án riêng. Gợi ý tuần đầu là bản xem trước.

## Đường dữ liệu và quyết định

```text
Hồ sơ dinh dưỡng → Tổng quan → Tập luyện → Hôm nay
                                            ├─ Buổi dang dở → Trở lại bài và hiệp
                                            ├─ Giáo án đang dùng → Buổi của ngày
                                            ├─ Tìm giáo án → Xem trước → Chọn
                                            └─ Tập tự do → Thêm bài
Buổi tập → Ghi hiệp → Hoàn thành → Lịch sử → Xu hướng hoặc Tập lại
Bài tập → Lọc theo nơi và dụng cụ → Xem kỹ thuật
```

Ở commit trước, `ensurePresetPlans()` gọi `activatePlan('full_body')` nếu thiếu giáo án hoạt động. Truy vấn ưu tiên mã `plan_full_body_3x` khi có hai mẫu toàn thân. Hồ sơ dinh dưỡng và kinh nghiệm không tham gia nhánh này. [Khởi tạo và truy vấn cũ](https://github.com/hqkhanh0907/MealPlaning/blob/05753adb7f7533a9b9c7689a98ac8dafecc37f20/src/app/core/repositories/training-plan.repository.ts#L112-L141)

Onboarding lưu hồ sơ. Khi mở Tập luyện, repository nạp bốn mẫu, store đọc giáo án và buổi đang hoạt động. Nếu thiếu giáo án, Hôm nay mời tìm giáo án hoặc tập tự do. Người tập xác nhận trước khi đổi giáo án. [Onboarding](../../src/app/features/onboarding/onboarding.page.ts#L259) · [Kho giáo án](../../src/app/core/repositories/training-plan.repository.ts) · [Hôm nay](../../src/app/features/fitness/today/workout-today.html)

Giáo án mô tả các bài và liều tập dự kiến. Khi bắt đầu, app lưu riêng chỉ tiêu của buổi. Nhật ký lấy số lần, giây, mức tạ và cảm nhận người tập thực sự ghi. Vào lịch sử để sửa một hiệp đã ghi hoặc xem xu hướng. [Kho buổi tập](../../src/app/core/repositories/workout.repository.ts) · [Lịch sử](../../src/app/features/fitness/history/history.page.ts)

## Bốn mẫu và điều kiện sử dụng

| Mẫu | Số buổi và hiệp mỗi tuần | Dụng cụ và lịch | Khoảng phút mỗi buổi |
|---|---:|---|---:|
| Hai tạ đơn và sàn | 2 buổi, 16 hiệp | Hai tạ đầu lục giác, sàn, thứ Ba và Sáu | 28–30 |
| Full Body 3 buổi | 3 buổi, 35 hiệp | Giá tạ, ghế, tạ đòn, tạ đơn, cáp, máy đạp đùi và xà | 37–42 |
| Upper / Lower | 4 buổi, 61 hiệp | Giá tạ, ghế, máy chân, xà, dây cáp và các tay cầm riêng | 42–56 |
| Push / Pull / Legs | 6 buổi, 100 hiệp | Thiết bị theo từng biến thể, gồm cả máy kéo xà trợ lực và cuốn đùi | 45–61 |

Các khoảng phút là ước tính. Cận trên dùng 60 giây cho một hiệp lặp, nhân đôi phần thực hiện khi tập mỗi bên. Bài tính giây dùng thời lượng của mẫu. Cộng nghỉ giữa hiệp, hai phút mỗi lần chuyển bài và mười phút cho khởi động cùng dự phòng. Thư viện so với buổi dài nhất. Chưa xác minh thời lượng thực tế của từng mẫu. [Các buổi và số hiệp](../../src/app/core/models/fitness-seed.ts) · [Công thức và bộ lọc](../../src/app/core/models/workout-plan-recommendation.ts)

## Căn cứ và giới hạn

| Quyết định | Nghiên cứu | Suy luận và lựa chọn sản phẩm |
|---|---|---|
| Phạm vi tự gợi ý | ACSM 2026 tổng hợp kết quả sức mạnh, khối cơ và năng lực thể chất ở người lớn khỏe mạnh. [ACSM](https://acsm.org/resistance-training-guidelines-update-2026/) | Tuổi 18 là ranh giới của quần thể tham chiếu. Không phải ngưỡng sinh lý để đổi giáo án. Người ngoài phạm vi vẫn có thể ghi buổi. |
| Chọn số buổi | Ramos-Campo 2024 tổng hợp 14 nghiên cứu, 392 người. Khi khối lượng tương đương, khác biệt sức mạnh và tăng cơ giữa hai kiểu chia lịch không rõ. [Nghiên cứu](https://pubmed.ncbi.nlm.nih.gov/38595233/) | Bốn mẫu có số hiệp khác nhau. App lọc ngày, hỏi mức quen với lịch nhiều hiệp và cho xem số hiệp trước khi chọn. |
| Kiểm đối tượng | Pedersen 2022 so hai lịch trong 12 tuần ở nữ chưa tập kháng lực. Sức mạnh tối đa tăng ở hai nhóm, khác biệt giữa nhóm không rõ. [Thử nghiệm](https://doi.org/10.1186/s13102-022-00481-7) | Thử nghiệm có giám sát. Không dùng giới tính, BMI, chiều cao hoặc cân nặng để chỉ định một mẫu. Đây cũng là dữ liệu gốc liên quan tổng quan trên. |
| Chọn bài theo dụng cụ | Haugen 2023 tổng hợp 13 nghiên cứu ở người lớn. Kết quả sức mạnh phụ thuộc dụng cụ dùng để kiểm. Chỉ năm nghiên cứu đo tăng cơ. [Nghiên cứu](https://doi.org/10.1186/s13102-023-00713-4) | Kiểm đúng biến thể, yêu cầu dụng cụ và nhóm cơ. Nhãn “phòng gym” không xác nhận máy đang sẵn. Đau chưa rõ không đủ để chọn bài điều trị. |
| Quay lại sau nghỉ | Halonen 2024 phân ngẫu nhiên 55 người chưa tập. Sau mười tuần nghỉ, sức mạnh và tiết diện cơ giảm rồi tăng khi tập lại. [Thử nghiệm](https://doi.org/10.1111/sms.14739) | Chưa xác minh hệ số giảm tạ theo số tuần nghỉ cho từng người. Hiển thị lịch sử và để người tập sửa mức tạ. |
| Tăng tạ và nghỉ | ACSM 2009 mô tả tiến triển khi người tập vượt số lần mục tiêu. Hướng dẫn cập nhật năm 2026 nhấn mạnh tính đều đặn và điều chỉnh theo mục tiêu. [ACSM 2009](https://pubmed.ncbi.nlm.nih.gov/19204579/) · [ACSM 2026](https://doi.org/10.1249/MSS.0000000000003897) | Đạt cận trên mọi hiệp cùng tạ và đánh dấu hiệp cuối Dễ chỉ mở đề xuất. Ngưỡng cụ thể là lựa chọn sản phẩm, chưa xác minh trên người dùng. |
| Mức tạ đầu tiên | Nuzzo 2024 tổng hợp các phép thử số lần tối đa ở nhiều bài và cá nhân. Cùng tỷ lệ 1RM cho số lần khác nhau. [Nghiên cứu](https://pmc.ncbi.nlm.nih.gov/articles/PMC10933212/) | Giữ trống mức tạ chưa biết. Với bài hai tạ, nhập kg mỗi tay và lưu tổng tạ ngoài để tính khối lượng. |

## Các lựa chọn đã chốt

- Hỏi khi người tập tìm giáo án lần đầu. Onboarding dinh dưỡng không thêm câu hỏi tập luyện.
- Dùng ngày sinh để xác định phạm vi gợi ý. Mức vận động hằng ngày và mục tiêu cân nặng không xếp lịch sức mạnh.
- Một mẫu phù hợp thì nêu mẫu cùng lý do. Nhiều mẫu thì hỏi số buổi mong muốn, xếp mẫu đúng số buổi trước và giữ các lựa chọn còn lại.
- Ví dụ, thứ Tư và thứ Bảy với hai tạ lục giác và 35 phút cho phép dịch mẫu hai buổi. Danh sách bài giữ nguyên.
- Nếu nguyên mẫu quá dài, phân biệt bản giảm hiệp và buổi soạn một lần. Thời gian nghỉ của bài giữ nguyên.
- Trong màn tập, máy bận gợi ý đổi một lần. Thiếu máy tại nơi tập gợi ý dùng bài thay thế ở nơi đó cho các buổi sau.
- Hết giờ, tạ nặng và đau là lý do tùy chọn sau buổi. Một hiệp chưa ghi tự nó không kích hoạt giảm tải.
- Bốn tab giữ các việc có tần suất khác nhau. Màn tập ẩn tab để nhường chỗ cho ghi hiệp. Quay lại giữ bản nháp trên thiết bị.
- AI chỉ soạn khi có mạng và có điều kiện tập phù hợp. Danh mục gửi đi đã lọc tại máy. Kết quả qua cùng bước kiểm cục bộ.
- Lịch, nơi mặc định và bộ dụng cụ theo nơi đồng bộ theo tài khoản. Bản nhập dở thuộc thiết bị đang tập.
- Mỗi bản AI đã chọn có mã riêng. Tập lại buổi độc lập tạo buổi mới. Các buổi đã hoàn thành giữ số liệu gốc.

So với giả thuyết đầu, app chỉ đặt câu hỏi tại thời điểm câu trả lời đổi được quyết định. V1 dùng thông tin hạn chế theo động tác cụ thể hoặc “chưa xác định”. Phần lý do thiếu hiệp là tùy chọn. Mức tạ kế tiếp có thể lấy từ một mức nặng hơn đã ghi cùng bài, cùng nơi. Đây là mức từng dùng, chưa xác nhận toàn bộ các nấc tạ hiện có.

## Hồ sơ đối chiếu với cách chọn cũ

Trong các ca dưới đây, người tập 28 tuổi, có 65 phút, đã quen tập nhiều buổi và muốn tập bốn buổi mỗi tuần. Mỗi cặp chỉ thay điều kiện nêu trong bảng. Cách cũ kích hoạt Full Body 3 buổi nếu tài khoản chưa có giáo án đang hoạt động.

| Chỉ thay một điều kiện | Kết quả mong đợi | Kết quả từ v1 |
|---|---|---|
| Đủ dụng cụ phòng gym → chỉ có hai tạ lục giác, cùng sáu ngày rảnh | Mẫu đầu đổi theo thiết bị thực có. | Upper / Lower → Hai tạ đơn và sàn. |
| Rảnh thứ Hai, Ba, Năm, Sáu → chỉ thứ Ba và Sáu | Giáo án tuần nằm trong số ngày còn rảnh. | Upper / Lower → Hai tạ đơn và sàn. |
| BMI 21 → 35, giữ nguyên khả năng tập | Cùng tập hợp lựa chọn. | Cả hai có đủ bốn mẫu và Upper / Lower đứng đầu. |
| Đã quen lượng tập gần đây → vừa trở lại sau kỳ nghỉ dài | Xem lại khối lượng thường tập gần đây. | Từ bốn lựa chọn còn Hai tạ đơn và sàn cùng Full Body 3 buổi. |
| Không có động tác cần tránh → chưa xác định được động tác có thể tập | Dừng gợi ý tự động khi chưa mô tả được giới hạn. | App cho chọn thủ công, không kê bài cho cơn đau. |
| 65 phút → 10 phút | Không đưa bản vượt thời gian đã nhập. | Không còn mẫu tuần hoặc buổi soạn phù hợp. Vẫn có tập tự do. |
| Chưa kích hoạt → đã kích hoạt giáo án cá nhân | Giữ giáo án mà người tập đang dùng. | Hôm nay mở lịch cá nhân. Cả cách cũ và v1 giữ giáo án này. |

Các ca trên kiểm logic chọn, chưa xác minh mức phù hợp sau nhiều tuần. Giới hạn còn lại là v1 chỉ dịch đồng loạt các ngày của mẫu. Một lịch có đủ số buổi vẫn có thể thiếu cách xếp giữ nguyên khoảng nghỉ của mẫu. [Bộ lọc](../../src/app/core/models/workout-plan-recommendation.ts) · [Ca hồi quy](../../src/app/core/models/workout-plan-recommendation.spec.ts)

## Thay đổi tiêu chí trong PRD

| Phần | Tiêu chí trước | Tiêu chí v1 | Lý do và cách kiểm |
|---|---|---|---|
| Giáo án | Ba mẫu hoạt động | Bốn mã, ban đầu chưa kích hoạt. Bản đổi lịch và rút gọn có xem trước. | Ràng buộc thời gian, dụng cụ và lịch khác nhau. Kiểm bộ lọc, giao dịch SQLite và Android. |
| Giáo án | Xem ngày, hiệp, lần, nghỉ | Giữ, thêm giây cho bài tính thời gian. | Tránh nhầm đơn vị. Kiểm mẫu và màn chi tiết. |
| Giáo án | Đổi lịch, thay bài, lưu, mở lại | Giữ, bảo toàn mẫu và các bản AI đã chọn. | Kiểm khóa của ngày cũ sau khi lưu thêm giáo án. |
| Giáo án | Buổi mới dùng thay đổi, buổi cũ giữ nguyên | Giữ. | Kiểm bản ghi trước và sau chỉnh giáo án. |
| Thư viện | Tối thiểu 50 bài | Giữ, thêm tra kỹ thuật ngoại tuyến và lọc theo nơi ngoài buổi tập. | Người tập cần kiểm dụng cụ trước khi chọn. |
| Ghi hiệp | Theo giáo án và tập tự do | Giữ cả hai, thêm buổi soạn độc lập và mở lại bản nháp. | Kiểm trên Android qua màn ghi thực tế. |
| Ghi hiệp | Bộ đếm nghỉ tự chạy, cảm nhận tùy chọn | Giữ cả hai. | Kiểm thời gian và ghi hiệp khi bỏ trống cảm nhận. |
| Ghi hiệp | Chỉ hoàn tất khi có hiệp thật, chỉ tính hiệp thật | Giữ, phân biệt đơn vị giây và tải ngoài. | Đối chiếu tổng SQLite với số đã nhập. |
| Ghi hiệp | Chọn giáo án sau hủy, xem lịch sử cả hiệp bỏ | Giữ cả hai, thêm ghi chú, thay bài và tập lại buổi độc lập. | Kiểm hủy, hoàn tác, lịch sử và bản ghi mới. |
| Ghi hiệp | Ghi một hiệp trong 5 giây | Giữ mốc so sánh. | Ghi riêng thời gian tới khi hiện kết quả. Tốc độ của người dùng thật cần quan sát riêng. |
| Tiến bộ | Biểu đồ 1RM theo Epley | Hiện mức tốt nhất trong 12 tuần của ba bài chính khi hiệp đủ dữ kiện. | Ít điểm đo không đủ tạo đường xu hướng đáng tin. |
| Tiến bộ | So khối lượng hai tuần | Giữ, thêm chuỗi tám tuần. | Dùng mọi buổi hoàn thành trong khoảng, độc lập giới hạn danh sách 20 buổi. |
| Tiến bộ | Chuỗi ngày tập cập nhật ngay | Đếm tuần có hiệp thật trong 12 tuần, cập nhật sau ghi hoặc sửa buổi. | Phù hợp lịch xen ngày nghỉ. |
| Tiến bộ | Đồ thị trung bình cân nặng | Hiện trung bình bảy ngày hoặc nhãn hồ sơ nếu thiếu nhật ký. | Một điểm cân không tạo xu hướng. |
| Tiến bộ | Biểu đồ thích ứng, cuộn mượt | Giữ khả năng mở, cuộn và đọc số liệu trên Android. | Phân biệt quan sát thao tác với phép đo tốc độ khung hình. |
| AI | 10–20 hiệp cho mọi nhóm cơ | Kiểm mỗi ngày và từng bài với điều kiện thực tế. | Chưa xác minh một liều chung cho mọi người. |
| AI | Tăng tạ hoặc số lần mỗi tuần | Đề xuất tăng khi có dữ liệu của bài, cho giữ mức hoặc tự nhập. | Tiến độ từng bài khác nhau. |
| AI | Tự giảm tải sau 4–6 tuần | Bỏ lịch giảm tải cố định. | Chưa xác minh khoảng giảm tải phổ quát. |
| AI | Điều chỉnh theo biểu tượng cảm nhận | Dùng hiệp thực tế cùng cảm nhận cuối. Lý do thiếu hiệp lưu riêng. | Một biểu tượng không đủ suy ra nguyên nhân. |
| AI | Mọi gợi ý đều có cơ sở khoa học | Nêu giới hạn, kiểm mã bài, lịch và dụng cụ, chỉ kích hoạt khi xác nhận. | Nghiên cứu ở nhóm không chứng minh độ phù hợp cá nhân. |

## Đánh giá sau các buổi tập thật

| Câu hỏi | Dữ liệu và phép đo | Giới hạn |
|---|---|---|
| Buổi có vừa thời gian không? | Đối chiếu phút dự kiến khi chọn với thời gian bắt đầu và hoàn thành của cùng buổi. | App mở khi người tập tạm dừng có thể làm số phút tăng. |
| Giáo án có khả thi tại nơi đó không? | Xem bài gốc, bài thay, nơi, số hiệp thật và ghi chú cuối buổi trong nhật ký. | Không suy ra đau hoặc máy bận từ hiệp thiếu. |
| Người tập có duy trì không? | Trong các tuần tiếp theo, đối chiếu ngày họ dự định tập với buổi hoàn thành và buổi tập tự do. | Giáo án có thể đã đổi. Thiếu nhật ký chưa chứng minh người đó bỏ tập. |
| Người tập có mạnh hơn không? | So cùng bài, đơn vị, số lần và mức gắng sức giữa nhiều buổi. | Khối lượng toàn buổi không đo trực tiếp sức mạnh hoặc tăng cơ. |
| Thao tác có thuận tiện không? | Quan sát người tập tìm bài, ghi một hiệp lúc nghỉ và tiếp tục sau khi xem kỹ thuật. | Tách thời gian nhập của người thật khỏi phép đo tự động. |

Dùng dữ liệu đã lưu và phản hồi tự nguyện. V1 không thêm sự kiện phân tích hành vi. Giữ riêng tiêu chí kỹ thuật đã kiểm và tác động với người dùng thật chưa xác minh.

[Bảng nghiệm thu và số đo của bản phát hành](../audit/fitness/workout-release-0.3.0.md)
