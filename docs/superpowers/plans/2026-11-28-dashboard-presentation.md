# Chuyển quy tắc hiển thị Tổng quan sang Rust

## Phạm vi

Phần này chuyển cách trình bày số liệu sau khi đọc dữ liệu. Bản Angular tiếp tục làm chuẩn đối chiếu. Mô-đun mới thuộc `healthmate-domain`. Leptos sẽ gọi cùng một hàm cho lần mở màn và mỗi lần trạng thái thay đổi.

## Đường đi của dữ liệu

| Điểm gọi | Hành vi hiện tại | Biên chuyển sang Rust |
|---|---|---|
| `DashboardStore.refresh` | Đọc tổng theo lịch, lượng đã ăn, cân nặng và chuỗi ngày. Gạt kết quả tải đã cũ. | Giữ nguyên cơ chế đọc dữ liệu, ngày địa phương và vòng đời. Truyền tín hiệu thô. |
| `DashboardStore.targets` | Dùng mục tiêu do `NutritionStore` cung cấp sau khi xử lý hồ sơ. | Truyền năm số mục tiêu hiện hành. Đừng coi mục tiêu thiếu là mục tiêu 100%. |
| `dashboard.page.html` | Hiển thị Calories đã ăn và theo lịch, mục tiêu, bốn macro, nhận xét, cân và hai chuỗi ngày/tuần. | Dùng trang này làm đối chứng. Giữ nguyên nhãn, thứ tự, cách làm tròn và CTA. |
| `LeptosDashboardPage.viewJson` | Lấy các trường đã định dạng từ store và gửi qua WebAssembly. | Khi tích hợp, gửi một trường dữ liệu thô cho toàn bộ phép tính. |
| `healthmate-leptos/src/model.rs` và `view.rs` | Nhận mô hình, hiện hoặc ẩn từng khối và phân phát sự kiện. | Ánh xạ kết quả Rust sang cùng DOM. Nhận xét AI đã lưu vẫn có ưu tiên. |
| `dashboard.store.spec.ts`, `dashboard-view.parity.ts` | Kiểm store và bản dựng Angular với Leptos. | Giữ các ca đối chứng. Bổ sung các đầu vào sinh kết quả từ chính store Angular. |

`workoutTitle` và `workoutBody` cũng dùng dữ liệu buổi tập. Template hiện hành không đọc hai trường này. Phần này giữ nguyên chúng trong store. Ngày hiển thị, liên kết món, dữ liệu đánh giá ảnh và thông báo mạng tiếp tục đi qua biên hiện có.

## Nguy cơ đổi hành vi

| Tình huống | Điều cần giữ |
|---|---|
| Nhật ký và kế hoạch khác nhau | Calories “Đã ăn” lấy từ nhật ký. Macro, mức mục tiêu và nhận xét lấy từ kế hoạch. |
| Mục tiêu thiếu hoặc bằng 0 | Giữ dấu gạch dài, thông báo chưa đặt mục tiêu và thanh tiến độ 0%. |
| Giá trị sát 50%, 70% hoặc 120% | So ngưỡng trước khi làm tròn. Ưu tiên cảnh báo Calories rồi mới xét Protein. |
| Vượt mục tiêu | Nhãn có thể vượt 100%. Độ rộng thanh dừng ở 100%. |
| Số lẻ và hàng nghìn | So kết quả thật của `Intl.NumberFormat('vi-VN')`. Kiểm số âm sát 0 và quy tắc làm tròn cân nặng. |
| Chuỗi ngày hoặc cân nặng trống | Phân biệt chưa có dữ liệu, số 0, nguồn hồ sơ và nhật ký cân không có mốc trước. |

## Thứ tự thực hiện

1. Lấy kết quả của store TypeScript cho bộ dữ liệu biên, gồm số lẻ, mục tiêu thiếu, xu hướng cân và ngưỡng nhận xét.
2. Viết phép kiểm Rust đối chiếu từng trường theo cùng đầu vào. Xác nhận phép kiểm phát hiện phần triển khai còn thiếu.
3. Cài `dashboard_presentation::present` và tái sử dụng phép tính tỷ lệ của lõi dinh dưỡng.
4. Nối hàm vào mô hình Leptos sau lần chụp ảnh đối chứng đầu tiên. Giữ route Angular cũ để so lại.
5. Kiểm riêng DOM và các thao tác trên Android. Chỉ đổi đường mặc định sau khi đạt phép kiểm tương ứng.

## Hợp đồng tích hợp

`healthmate_domain::dashboard_presentation::present(&DashboardInput)` trả `DashboardPresentation`. Hai kiểu dùng tên trường camelCase khi trao đổi JSON.

| Trường đầu vào | Nguồn từ ứng dụng |
|---|---|
| `totals`, `loggedTotals`, `targets` | Ba tín hiệu tương ứng của `DashboardStore`. Mỗi trường chứa Calories, Protein, Carbs, Fat và Fiber. |
| `weightSummary` | Chuyển `currentKg`, `deltaKg` và `source` từ kết quả `loadWeightSummary`. Giữ giá trị null. |
| `nutritionStreakDays` | Số ngày hoặc null do store trả về. Giữ số 0 khi người dùng có mục tiêu nhưng chuỗi bằng 0. |
| `workoutStreakWeeks` | Lấy `streakWeeks` từ `workoutSummary()`. |

Các trường kết quả có cùng tên với trường hiển thị trong `LeptosDashboardPage.viewJson`. Rust cũng trả `caloriePercent`, `proteinPercent` và `nutritionStreakDisplay`. Angular giữ trách nhiệm chọn bản nhận xét AI theo ngày và dữ liệu hiện hành. Bộ dựng Leptos giữ trách nhiệm ưu tiên nhận xét AI trong DOM.

## Bằng chứng trước khi nối giao diện

Sau khi nối, Leptos nhận số liệu thô từ ứng dụng và gọi trực tiếp `present` trong Rust. Đã chạy 67 phép kiểm trong Chrome với WASM thật. Trên Android 17, ảnh đầu và cuối Tổng quan khớp từng pixel trong vùng ứng dụng với bản trước khi chuyển công thức. Luồng mở bữa chờ, thêm món, vào Cài đặt và quay lại đều đạt.

Phép kiểm lấy kết quả từ chính các tín hiệu `computed` của Angular. Bộ kiểm thay nguồn SQLite và mạng bằng phụ thuộc thử. Bộ lập lịch thử giữ tác vụ tải bất đồng bộ ở trạng thái chờ.

Bộ dữ liệu gồm 35 trường hợp. Nó bao phủ hai phía của các ngưỡng nhận xét, số âm làm tròn về 0, dấu phân cách tiếng Việt và mục tiêu thiếu. Có trường hợp Calories đã ăn khác Calories theo lịch.

Khi tắt `float_roundtrip`, bộ đọc JSON từng làm tỷ lệ `117.24568857785553` thành `117.24568857785552`. Tính năng này giữ cùng giá trị nhị phân khi đọc JSON ở biên Rust.

Lệnh dưới chạy cả bộ dữ liệu đã lưu và phép đối chiếu lại với Angular. Cần cài phụ thuộc npm để chạy phần Angular.

````sh
cargo test --locked -p healthmate-domain --test dashboard_presentation -- --include-ignored
````
