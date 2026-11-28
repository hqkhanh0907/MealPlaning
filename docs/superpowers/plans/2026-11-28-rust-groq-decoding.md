# Giải mã phản hồi Groq trên Android

## Kết quả trên Android 17

APK ARM64 nhắm API 37 đã nạp bộ giải mã Rust trên thiết bị ảo dùng trang nhớ 16 KB. `GroqDecoderParityTest` chạy trong tiến trình Android và vượt qua cả sáu ca. Ca nhận diện bộ giải mã yêu cầu JNI thực sự hoạt động.

Hai lượt JVM dùng cùng 15 đầu vào để so Java cũ và Rust. Các lượt này dùng kết nối thử. Chưa gọi dịch vụ Groq bên ngoài. Bản phát hành tiếp tục dùng đường TLS và kho khóa hiện tại.

`MealPlanGroqPlugin.completeGeneration` gọi `GroqTransport.generate`. Sau khi đọc kết quả, plugin so lại chủ tài khoản, thế hệ phiên và phiên bản khóa trước khi trả nội dung. Các yêu cầu văn bản và ảnh dùng chung đường này.

| Điểm gọi | Hợp đồng | Kiểm thử |
|---|---|---|
| `GroqTransport.prepare` | Giữ model, kích thước yêu cầu và thời gian chờ. | Bộ kiểm Java gốc. |
| `GroqTransport.generate` | HTTP 100–599 khác 200 trả nguyên mã và nội dung trống. Không mở luồng phản hồi lỗi. | Kết nối HTTP giả với 201, 302, 401, 429, 500 và trạng thái ngoài miền. |
| `readContent` | Giới hạn hai MiB trên luồng, tính theo byte trước khi giải mã UTF-8. | Biên đúng dung lượng, vượt một byte và luồng lỗi. |
| `decodeContentNative` | Rust chọn phần tử đầu trong choices. Chỉ nhận message.content kiểu chuỗi với ít nhất một ký tự ngoài U+0000 đến U+0020. | Chạy cùng byte qua JNI, hàm Java gốc và điểm vào generate. So từng đơn vị UTF-16. |
| Cú pháp Android | org.json chấp nhận một số văn bản ngoài JSON chuẩn. UTF-8 hỏng và surrogate đơn cũng có hành vi riêng. | Nhánh tương thích dùng org.json của Android qua JNI khi serde_json từ chối. |
| Khóa và tài khoản | HTTP tiếp tục dùng TLS, deadline, kiểm chính chủ và phiên bản khóa hiện có. | Chạy bộ kiểm GroqTransport và GroqVaultPolicy với dữ liệu giả. |

Đường Android có thư viện native dùng bộ giải mã Rust. Nếu thiếu thư viện hoặc biểu tượng JNI, ứng dụng dùng bộ giải mã Java cũ. `GroqTransport.usesRustDecoder()` cho phép phân biệt khi nghiệm thu.

## Đối chiếu trên JVM

Chạy `python3 crates/healthmate-capacitor/tests/groq_jni_test.py` từ kho mã. Máy cần Rust 1.100.1, JDK 21, Android SDK 37 và các dependency Android của dự án. Biến `GRADLE_USER_HOME` chọn bộ nhớ đệm Gradle. Biến `ANDROID_JAR` cho phép chỉ định tệp SDK.

Phép kiểm dựng thư viện JNI cho máy đang chạy từ chính `src/groq.rs`. Hai JVM độc lập chạy cùng 15 ca. Một JVM buộc dùng đường Java. JVM kia buộc nạp JNI và bật `-Xcheck:jni`. Cả hai gọi `GroqTransport.generate` qua kết nối HTTP giả.

Ca đổi phiên sửa chủ sở hữu, thế hệ phiên hoặc phiên bản khóa trong lúc đang đọc phản hồi. Phép kiểm gọi `SessionVault.sameGroq` sau khi giải mã. Plugin dùng cùng điều kiện trước khi trả kết quả. Việc xác minh thư viện trong APK và Android Keystore cần chạy riêng trên Android.
