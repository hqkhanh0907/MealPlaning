# Ghi buổi tập vào SQLite từ Rust

| Điểm vào                             | Hợp đồng giữ lại                                                                         | Phép thử                                                                    |
| ------------------------------------ | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| FitnessStore.logSet và repeatLastSet | UUID do client cấp, thứ tự hiệp, thời gian, ghi chú và mức gắng sức.                     | Ghi lại cùng UUID trước và sau khi kết thúc. Trả đúng hiệp và toàn bộ buổi. |
| FitnessStore.skipSet                 | Giá trị dự kiến ngoài phạm vi trở về 0. Hiệp bỏ qua không làm tăng khối lượng.           | Bỏ qua hiệp với tạ âm và số lần lẻ.                                         |
| FitnessStore.completeWorkout         | Buổi phải hoạt động và có ít nhất một hiệp đã ghi. Thời lượng làm tròn theo phút.        | So hai biên 89 và 90 giây, buổi rỗng và buổi đã đóng.                       |
| Trang lịch sử                        | Chỉ sửa hiệp hợp lệ trong buổi đã hoàn tất. Giữ UUID và xóa gợi ý tạ khi số đo thay đổi. | So sửa thực sự, sửa cùng số, hiệp bỏ qua và hiệp có đơn vị cũ.              |
| Mở lại buổi hoặc trả kết quả sau ghi | Trả cùng bộ trường và giữ thứ tự bài, hiệp.                                              | So toàn bộ JSON của buổi và hiệp sau mỗi lần ghi.                           |
| Đổi tài khoản hoặc rollback          | Kiểm phiên trước tác dụng phụ đầu tiên. Giao dịch đang chạy dùng kết nối của người ghi.  | Từ chối chủ khác, mô phỏng lỗi trước khi ghi, thử lại và kiểm hàng SQLite.  |

Giữ công thức hai bên ở bước chuyển số đo của FitnessStore. Repository nhận tổng tạ. Với 12,5 kg mỗi tay và 6 lần, SQLite lưu 25 kg và tổng buổi là 150 kg.

Oracle dùng hai cơ sở dữ liệu thử độc lập. Mỗi bên chạy cùng lệnh trên cùng fixture, khóa thời gian và so cả kết quả lẫn thông báo lỗi.

## Kết quả

Ba ca Rust đạt khi chạy `cargo test --locked --manifest-path crates/healthmate-capacitor/Cargo.toml --test workout_data`. Oracle thực thi repository TypeScript rồi kiểm đường Android với đúng các kết quả Rust.

Hai lần ghi cạnh tranh bằng cùng UUID chỉ gọi một lần kiểm trước khi ghi. Khi cập nhật tổng khối lượng gặp lỗi SQLite, giao dịch hoàn tác cả hiệp vừa thêm.

Buổi dài 89,999 giây ghi một phút. Buổi dài 90 giây ghi hai phút. Fixture cũng kiểm ngày không hợp lệ và mốc bắt đầu có độ lệch múi giờ.

Ca đối chứng `fitness_workout` của kho SQLite đạt. Chrome Headless vượt qua 55 ca về repository, store và lịch sử. Clippy và phép biên dịch JNI cho Android ARM64 đạt.

### Repository trước khi chuyển

Chạy lại lệnh Cargo trên với `WORKOUT_ORACLE_REVISION=367cef88`. Oracle dùng `git show` để đọc đúng tệp TypeScript ở commit đó rồi nạp tệp từ thư mục tạm.

Git blob của repository gốc là `18a42103b5eecce3f55cacfff273f0f18397fee7`. Cả repository gốc và nhánh TypeScript hiện tại khớp Rust ở 35 lệnh, gồm 17 kết quả lỗi.

Ca ép SQLite báo lỗi trong khi cập nhật tổng cũng chạy trên cả ba phiên bản. Mỗi phiên bản hoàn tác hiệp và tổng, sau đó hai lần gửi cùng ID chỉ ghi một hiệp. Ba bảng có cùng SHA-256 sau khi chuẩn hóa thời gian do SQLite tạo.

### Android 17

APK `094e923367aa4baf3d759ae0fcd9fbf5e7a90b59d2645445b969e16232502ab1` chạy trên ARM64, API 37. Hai tài khoản thử có cơ sở dữ liệu riêng.

Giao diện gọi 24 lệnh native thành công qua sáu điểm vào. Buổi đạt 150 kg, rồi đạt 200 kg sau khi sửa đúng UUID. Hai hiệp side plank cùng lưu 45 giây.

Khi thử thêm lỗi sau lệnh ghi hiệp, SQLite hoàn tác về 0 hàng. Gửi lại cùng ID chỉ lưu một hiệp và tổng 21 kg. Tài khoản B không đọc được buổi của A.
