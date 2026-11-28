# Đối chiếu dữ liệu SQLite khi nâng cấp

Kiểm tra đường mở tệp của một tài khoản bằng Rust. Lát này bổ sung phép thử, sử dụng các hàm migration TypeScript thật để tạo tệp đối chứng.

| Luồng | Trước | Sau | Có phải regression không |
|---|---|---|---|
| Nhập hồ sơ và thực phẩm | Android dùng danh sách migration trong `migrations.ts` | Mở bản sao với `open_account`; đối chiếu tất cả các bảng nghiệp vụ | Khác giá trị, kiểu cột hoặc liên kết sẽ làm phép thử thất bại |
| Đọc bữa đã ghi | Phiên bản 2 lưu lượng ăn và thời điểm theo bữa | Rust đọc cùng dữ liệu sau khi nâng lên phiên bản 13 | Yêu cầu giữ UUID, timestamp, số lẻ và giá trị rỗng |
| Khởi tạo lại và đồng bộ | Ứng dụng mở lại tệp thuộc cùng tài khoản | Mở hai lần; so hàng, khóa ngoại và phiên bản tệp | Mất hoặc nhân đôi hàng là regression |

Điểm vào là `NativeDatabase`, `WebDatabase`, `MigrationRunner.run` và `healthmate_store::open_account`. Lát thử này không sửa các hàm trên, các quy tắc validation hoặc tài sản dữ liệu cũ.

| Công việc | Cách xác minh |
|---|---|
| Tạo một database Android phiên bản 2 với dữ liệu thử | Dùng chính registry TypeScript. Ghi hồ sơ, món có thành phần, bữa đã ghi và bữa chưa ghi |
| Sao chép tệp thành hai bản | Nâng bản thứ nhất bằng TypeScript và bản thứ hai bằng Rust |
| So dữ liệu và cấu trúc | So hai chiều từng bảng và thông tin cột. Chạy `foreign_key_check` và mở lại tệp |

Tệp lưu ở gốc repo có trước khi dự án chốt schema gram. Khi mở một bản sao, chính migration TypeScript dừng ở phiên bản 12 với điều kiện `theme = 'light'`. Phép đối chứng dùng dữ liệu thuộc schema gram của ứng dụng.

## Kết quả

`cargo test --locked -p healthmate-store --test legacy_database -- --ignored` xét 2 lần mở tệp. TypeScript chạy cả `MigrationRunner.run` và `prepareWorkspace`. Hai bản giữ cùng hồ sơ, nguyên liệu, món, khẩu phần, hiệp tập 40 kg × 6 và địa điểm tập.

Hai bản chuyển cờ chờ tải lên thành đúng một lần tăng phiên bản dữ liệu. Phép so hai chiều kiểm hàng, cột, danh sách chỉ mục và khóa ngoại. Cả hai từ chối xóa ngày sinh đã ghi và đặt mức tạ tiếp theo thành 501 kg. Codex Rescue đã chỉ ra các ca tập luyện và ràng buộc còn thiếu trong bản thử đầu tiên.
