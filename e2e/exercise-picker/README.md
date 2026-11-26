# Kiểm bộ chọn bài tập trên Android

Dùng Node.js 22 và APK debug có thể kết nối WebView DevTools. Cài APK mới lên một giả lập riêng dành cho kiểm thử.

Kịch bản xóa dữ liệu HealthMate trên giả lập đã chọn. Kịch bản tắt Wi-Fi và dữ liệu di động, rồi bật chế độ máy bay. Giả lập vẫn ngoại tuyến sau khi kiểm.

Chạy từ thư mục gốc của repo. Dùng số máy từ `adb devices -l` và tạo thư mục bằng chứng mới ngoài repo.

````bash
ANDROID_SERIAL=emulator-5566 \
CDP_PORT=9337 \
APK_PATH=/Users/khanhhuynh/person_project/MealPlaning/android/app/build/outputs/apk/debug/app-debug.apk \
OUTPUT_DIR="$(mktemp -d /tmp/mealplan-exercise-picker.XXXXXX)" \
node e2e/exercise-picker/flows.mjs
````

Đặt `ADB` nếu Android SDK nằm ngoài vị trí mặc định. `APK_PATH` mặc định trỏ tới APK debug trong repo. Kịch bản so SHA-256 với bản đã cài trước khi xóa dữ liệu.

## Luồng kiểm

- Kiểm tìm kiếm, nhóm cơ, dụng cụ và nơi tập khi thêm bài trong buổi tập.
- Chèn một bài cũ với dụng cụ chưa xác định qua Capacitor SQLite trên tài khoản kiểm thử.
- Kiểm bàn phím Android, tiêu điểm và nhãn trong cây trợ năng của WebView.
- Kiểm mục tiêu chạm và cách xuống dòng ở 360 điểm ảnh CSS với cỡ chữ Android 1,3.
- Thêm và thay bài trong trình sửa giáo án, rồi kiểm giáo án và hồ sơ dụng cụ sau khi mở lại ứng dụng.

Kịch bản khôi phục kích thước, mật độ, cỡ chữ và thiết lập bàn phím khi kết thúc. Kịch bản kiểm cây trợ năng WebView qua CDP. Kiểm đọc bằng giọng nói qua TalkBack nằm ngoài kịch bản này.

## Bằng chứng

`flows-results.json` lưu từng kiểm tra, thiết bị, thời điểm, SHA-256 APK và revision. Ảnh PNG ghi lại trạng thái cần đối chiếu. `workspace.diff` chứa thay đổi của tệp Git đang theo dõi. `workspace-status.txt` liệt kê trạng thái tệp, gồm cả tệp mới.

Lệnh trả mã lỗi nếu một kiểm tra thất bại. Dùng thư mục mới cho mỗi lượt chạy.
