# Chọn bài tập theo nhiều tiêu chí

## Khảo sát

- Hevy giữ ô tìm kiếm và bộ lọc cơ, dụng cụ trong cùng bộ chọn cho buổi tập và giáo án. [Thư viện bài tập Hevy](https://www.hevyapp.com/features/exercise-library/)
- openGym áp dụng hồ sơ dụng cụ trước khi tính kết quả và cho phép xem lại toàn bộ thư viện. Mã nguồn kiểm riêng phụ kiện bài cần. [Bộ chọn openGym](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/frontend/src/components/MuscleExplorer.jsx) · [Quy tắc dụng cụ openGym](https://github.com/DuarteSantos8/openGym/blob/e4a68a94c42a3c17cbd560d66ce2e46a7048ab99/frontend/src/lib/equipment.js)
- Fitbod lưu dụng cụ theo từng nơi tập có tên. Bộ lọc khi thêm bài có thể giới hạn kết quả theo dụng cụ ở nơi hiện tại. [Hồ sơ Fitbod](https://help.fitbod.me/hc/en-us/articles/34336407191191-My-Plan) · [Thêm bài trong Fitbod](https://help.fitbod.me/hc/en-us/articles/360006335593-Editing-Workouts-in-Fitbod)

## Quy tắc trong MealPlaning

Giữ ô tìm kiếm ở đầu bộ chọn. Kết hợp từ khóa, nhóm cơ, dụng cụ muốn tìm và nơi tập bằng phép giao. Tìm tên tiếng Việt có dấu hoặc không dấu, tên gốc và bí danh. Khi lọc theo cơ, hiện bài khớp cơ chính trước và ghi tên nhóm cơ phụ trong các kết quả còn lại.

Phân biệt dụng cụ muốn tìm với tất cả dụng cụ bắt buộc. Dụng cụ có trong hồ sơ phải đáp ứng toàn bộ yêu cầu đã xác minh. Máy chuyên dụng và phụ kiện có mã riêng. Lưu các trường hợp hiệu chỉnh cùng nguồn và lý do. Nếu chưa rõ yêu cầu, hiển thị trạng thái chưa xác định và loại bài khỏi kết quả theo dụng cụ hiện có.

Đặt sẵn hồ sơ Nhà, Phòng gym và Ngoài trời. Cho phép đổi tên và sửa dụng cụ trong bộ chọn. Lưu trên thiết bị trong `app_config` của tài khoản. Hồ sơ chưa thiết lập vẫn cho tìm bài và có nút thiết lập. Nếu người dùng lưu danh sách rỗng, hồ sơ chỉ khớp với bài đã xác nhận tập không cần dụng cụ.

Dùng nhóm cơ hiện có để tìm bài tự tạo và bài cũ thiếu metadata. Giữ các bài đó trong tìm kiếm thường. Chỉ dùng nhãn cũ để lọc dụng cụ nếu nhận diện được. Trạng thái tập được vẫn là chưa xác định nếu chưa xác minh đủ dụng cụ.

Dùng chung bộ chọn để thêm bài vào buổi tập và để thêm hoặc thay bài trong giáo án. Trình sửa giáo án vẫn giữ quy tắc loại cardio, bài đã có trong ngày và cách lưu bản nháp. Giữ cột `muscle_group` và cách tính thống kê lịch sử. Giữ danh mục gốc, trình nhập, 415 mã và 796 hình.

## Rà dữ liệu bài tập

Đã rà 415 mã và áp dụng 64 hiệu chỉnh.

146 mã có hồ sơ dụng cụ theo bài. 269 mã dùng yêu cầu từ danh mục đã ghim. Dữ liệu đối chiếu cũng ghi giá trị cũ và mới của nhóm cơ, chuyển động và cách ghi từng bên. [Dữ liệu đối chiếu](../../src/app/core/models/exercise-catalog-review.data.ts)

13 mã còn thiếu bằng chứng:

| Mã bài | Bằng chứng cần bổ sung |
|---|---|
| `archer-push-up` | Cần nguồn về vai trò cơ lõi trong biến thể chống đẩy cung thủ. |
| `band-lying-leg-curl` | Cần nguồn cho biến thể dùng hai đai cổ chân nối với dây. |
| `cable-woodchopper` | Cần nguồn khớp độ cao ròng rọc trong hình. |
| `cable-y-raise` | Cần nguồn cho cách dùng cáp cùng bên. |
| `dead-hang` | Cần xác nhận tư thế treo thụ động hay chủ động hạ bả vai. |
| `doorway-row` | Cần xác nhận vị trí chân ở ngưỡng cửa. |
| `dumbbell-calf-raise` | Cần nguồn khớp tư thế đứng hai chân trên sàn, một tay cầm tạ và một tay vịn trụ. |
| `lateral-neck-raise` | Cần nguồn về cách đếm và đổi bên. |
| `muscle-up` | Cần nguồn về vai trò cơ ngực trong biến thể lên xà không dùng đà. |
| `overhead-lat-side-bend` | Cần nguồn khớp tư thế đứng nghiêng người. |
| `renegade-row` | Cần xác nhận tải đã ghi là khối lượng mỗi tạ hay tổng hai tạ. |
| `reverse-nordic` | Cần nguồn kỹ thuật cho biến thể móc cổ chân dưới đệm. |
| `reverse-wrist-curl` | Cần xác nhận tải đã ghi là khối lượng mỗi tạ hay tổng hai tạ. |

## Ca nghiệm thu

Kiểm trên APK mới khi Android ngoại tuyến:

1. Hồ sơ Nhà chỉ có tạ đơn hiện `dumbbell-floor-press` khi lọc Ngực. Ẩn `dumbbell-chest-press`, `dumbbell-squeeze-press` và `bench-press`.
2. Đổi tên Ngoài trời thành Công viên và lưu xà. Chọn cơ Lưng rồi tìm `pull-up`.
3. Tìm `archer-push-up` qua Ngực và qua Tay sau. Đây là hai nhóm cơ chính.
4. Bỏ bộ lọc và tìm lại bài tự tạo cùng bài danh mục. Bài tự tạo thiếu yêu cầu dụng cụ hiện trạng thái chưa xác định.
5. Đổi nơi tập giữ nguyên từ khóa. Đóng bộ lọc đưa tiêu điểm về nút mở. Thử thêm bài trong buổi tập, thêm và thay bài trong giáo án.
6. Kiểm tên và dụng cụ của hồ sơ sau khi mở lại ứng dụng. Kiểm bàn phím, chữ lớn, mục tiêu chạm và nhãn hỗ trợ.
7. Lọc Ngực và Tạ đơn với hồ sơ Nhà. `single-arm-overhead-press` phải nằm sau các bài khớp cơ chính và hiện nhãn Cơ phụ.

Chạy kiểm danh mục và hình theo nguồn đã ghim. Chạy kiểm hồi quy, lint và build. Lưu ảnh, kết quả, revision, diff, SHA-256 APK, giả lập và thời điểm chụp ngoài repo.
