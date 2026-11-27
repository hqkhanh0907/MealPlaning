# Kiểm hành trình Tập luyện trên Android

Chạy trên giả lập thử nghiệm với APK debug vừa build. Lệnh gỡ bản cài cũ cùng dữ liệu ứng dụng trên giả lập đã chọn. Chọn thư mục bằng chứng mới, ngoài repo.

```sh
ANDROID_SERIAL=emulator-5584 \
APK_PATH=/absolute/path/to/app-debug.apk \
OUTPUT_DIR=/private/tmp/mealplan-workout-capture/run-1 \
node e2e/workout-release/verify.mjs
```

Chế độ mặc định dùng tài khoản giả lập ngoại tuyến. Để kiểm bản phát hành sau deploy, thêm `WORKOUT_SYNC_LIVE=1`. Chế độ này đăng ký một tài khoản QA riêng qua giao diện. Trình kiểm đối chiếu dữ liệu SQLite với bản trên server sau khi nối mạng. Dữ liệu gồm hiệp, mức tạ lần tới, nơi tập, dụng cụ và lịch đã chọn.

`workout-release.json` ghi mã nguồn, thay đổi local, SHA-256 của APK trước và sau cài, thời điểm chụp, thông tin thiết bị và kết quả. Ảnh dùng cùng thư mục với báo cáo.

Thời gian mở app tính từ lệnh khởi động tiến trình mới đến khi trình kiểm thấy số liệu trên Tổng quan. Số đo này gồm thời gian kết nối lại WebView. Thời gian ghi hiệp tính từ thao tác tự động nhập tạ đến khi hàng hiệp xuất hiện. Dùng mục 7.2 trong PRD để đối chiếu. Đánh giá tốc độ nhập của người tập qua buổi sử dụng thật.
