# Đọc nguyên liệu bằng Rust trên Android

## Kết quả trên thiết bị

Trên cùng SQLite có 47 nguyên liệu, Android đã chạy 40 ca từ oracle TypeScript và sáu ca bổ sung có kết quả dương. Cả 46 phản hồi Rust khớp với Angular về chủ tài khoản, loại yêu cầu, giá trị và hình dạng dữ liệu.

Codex Rescue kiểm tra các nơi gọi khi tạo món bằng AI, lưu ảnh và sửa dữ liệu trong giao dịch. Phép đối chiếu giữ thứ tự ID, ID lặp, tìm kiếm tiếng Việt và từ chối công bố dữ liệu khi đổi chủ.

Repository giữ giao diện hiện tại. Android đọc cơ sở dữ liệu của tài khoản đang đăng nhập qua cùng giao dịch chỉ đọc với lịch ăn.

| Nơi gọi                                     | Hành vi cần giữ                                                                              | Ca đối chiếu                                                                 |
| ------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Danh mục, IngredientStore, trình sửa món    | Danh sách sắp xếp theo SQLite NOCASE. Tìm tên giữ ký tự đại diện của LIKE và phép so bỏ dấu. | Dùng tên viết hoa, dấu tổ hợp, khoảng trắng, dấu phần trăm và dấu gạch dưới. |
| Bộ chọn nguyên liệu                         | Danh sách gần đây xét ngày sửa món hoặc ngày tạo. Mỗi nguyên liệu xuất hiện một lần.         | Dùng hai món trùng thời điểm, một món có ngày sửa và các giới hạn 0, 1, âm.  |
| Trình sửa nguyên liệu, luồng ảnh và ghi món | Đọc lại theo ID phải thấy dữ liệu vừa ghi.                                                   | Đọc trước commit trên kết nối đang ghi. Xác nhận rollback.                   |
| DishAutofillApplier và DishStore            | So tên khớp đầu tiên sau chuẩn hóa. Khôi phục thứ tự ID, giữ ID lặp, bỏ ID thiếu.            | Chạy với tên Việt tương đương, ID lặp và ID chưa có.                         |
| Kiểm tra trước khi xóa                      | Đếm số dòng liên kết trong dish_ingredient.                                                  | Đếm 0 và nhiều tham chiếu.                                                   |
| Schema và nạp seed                          | Đọc nguyên liệu seed và thủ công cùng hình dạng bản ghi.                                     | So toàn bộ cột, nguồn, thời điểm và giá trị null trên cùng SQLite.           |
| Đổi tài khoản hoặc mở giao dịch             | Bỏ kết quả trả muộn của tài khoản cũ. Giao dịch đang ghi đọc qua kết nối của giao dịch đó.   | Đổi tài khoản lúc chờ native hoặc dự phòng. Mở giao dịch trong lúc chờ.      |

Bộ kiểm Rust gọi lại repository TypeScript trên cùng dữ liệu để đối chiếu kết quả từng phép đọc. Bộ kiểm Angular chạy cả nhánh native và nhánh giao dịch.

## Kết quả

Rust 1.100.1 vượt qua hai ca trong `cargo test --locked --manifest-path crates/healthmate-capacitor/Cargo.toml --test catalog_read`.

Oracle dùng dữ liệu từ `seed_catalog`, cùng nguyên liệu thủ công và nguyên liệu AI. Oracle so 40 yêu cầu qua repository TypeScript và đường Android nhận kết quả thật từ Rust.

Chrome Headless vượt qua 62 ca về repository, danh mục, seed, áp dụng gợi ý AI, nhập từ ảnh và sửa nguyên liệu. Phép thử rollback đọc được cả nguyên liệu vừa thêm và tên mới trong giao dịch.

Clippy vượt qua với `-D warnings`. JNI biên dịch được cho `aarch64-linux-android`. Lần chạy này kiểm phần kết nối JNI bằng trình biên dịch.
