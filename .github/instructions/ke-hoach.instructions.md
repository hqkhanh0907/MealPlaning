Mục tiêu: Xây dựng bộ tài liệu dự án 6 nhóm nhất quán, chính xác, lấy nhóm Tài liệu Kiểm thử (Testing & QA) làm cốt lõi để xác thực và đồng bộ ngược lại các tài liệu Kiến trúc, Yêu cầu và Quy trình.

GIAI ĐOẠN 1: PHÂN TÍCH VÀ KHỞI TẠO (INITIALIZATION)
(Tương ứng Bước 1 & 2)

Bước 1. Phân tích toàn diện dự án (Project Audit):

Thu thập toàn bộ thông tin hiện có: Mã nguồn Frontend (chạy tại localhost:3000), cấu trúc Backend (ví dụ: các API viết bằng Go hoặc Spring Boot), sơ đồ database hiện tại.

Rà soát các tài liệu đã có (nếu có) như PRD nháp, Figma, README cơ bản.

Mục đích: Hiểu rõ bức tranh tổng thể, luồng nghiệp vụ (Business flow) và kiến trúc hệ thống (System Architecture) trước khi viết kịch bản test.

Bước 2. Khởi tạo Kế hoạch & Kịch bản Kiểm thử (Test Plan & Test Cases - v1.0):

Test Plan: Xác định phạm vi kiểm thử (chỉ test UI, hay test cả tích hợp API), cấu hình môi trường (ví dụ: Frontend localhost:3000, Backend API URL, IDE IntelliJ, Trình duyệt Chrome).

Test Cases: Viết các kịch bản chi tiết (Step-by-step). Mỗi Test Case phải bao gồm:

Mã TC (ví dụ: TC_AUTH_01).

Tiền điều kiện (Pre-conditions).

Các bước thực hiện.

Kết quả mong đợi (Expected Result).

GIAI ĐOẠN 2: VÒNG LẶP KIỂM THỬ THỰC CHIẾN (EXECUTION & DEBUGGING LOOP)
(Tương ứng Bước 3, 4, 5)

Đây là giai đoạn cốt lõi, lặp đi lặp lại cho đến khi dự án đạt độ ổn định tuyệt đối.

Bước 3. Thực thi Kiểm thử (Execution):

Khởi chạy dự án tại localhost:3000.

Sử dụng Chrome DevTools làm công cụ giám sát chính:

Tab Console: Giám sát Javascript errors, React/Angular warnings.

Tab Network: Giám sát HTTP status codes, request headers, response payloads, thời gian phản hồi (latency).

Tab Application: Kiểm tra trạng thái lưu trữ (Local Storage, Cookies, Session Token).

Thực hiện thao tác người dùng bám sát từng kịch bản trong Test Cases v1.0.

Bước 4. Ghi nhận Lỗi (Bug Logging):

Bất cứ khi nào kết quả thực tế (Actual Result) sai lệch với Kết quả mong đợi (Expected Result), hoặc Chrome DevTools xuất hiện cảnh báo (Warning/Error), lập tức tạo Bug Report.

Thông tin bắt buộc trong Bug Report:

Mô tả lỗi (Bug Description).

Môi trường (Environment): OS, Browser version.

Các bước tái hiện (Steps to reproduce).

Bằng chứng (Log từ DevTools, ảnh chụp màn hình).

Bước 5. Phân tích, Đề xuất và Xử lý (Root Cause Analysis & Resolution):

Phân tích lỗi: Đọc log để xác định lỗi thuộc về Frontend UI, lỗi logic Backend, hay lỗi giao tiếp API.

Đề xuất 3 giải pháp (Tư duy kiến trúc): Đối với mỗi lỗi phức tạp, bắt buộc đưa ra 3 hướng giải quyết. (Ví dụ: Giải pháp 1: Fix cứng ở Frontend; Giải pháp 2: Xử lý logic ở cấp Backend service; Giải pháp 3: Tái cấu trúc lại bảng Database).

So sánh & Lựa chọn: Cân nhắc trade-off (thời gian, hiệu suất, khả năng mở rộng) để chọn 1 giải pháp tối ưu nhất.

Cập nhật code & Retest: Tiến hành sửa code. Sau đó cập nhật lại Test Case (nếu luồng nghiệp vụ thay đổi) và chạy lại Bước 3. Vòng lặp tiếp tục cho đến khi DevTools báo sạch lỗi.
Khi cập nhật code lại bắt buộc phải run sonar lint để đảm bảo không phát sinh thêm lỗi mới và tuân thủ coding standards đã đề ra trong tài liệu Quy trình (Coding Guidelines). Không được phép bỏ qua bước này. Nếu có issue mới phát sinh từ sonar lint, bắt buộc phải fix trước khi tiếp tục vòng lặp kiểm thử. Nếu có bất kỳ lỗi nào mới phát sinh từ việc sửa lỗi cũ, lập tức quay lại Bước 4 để ghi nhận và phân tích tiếp. Không được phép bỏ qua bất kỳ lỗi nào, dù là lỗi nhỏ nhất, để đảm bảo chất lượng sản phẩm đạt mức cao nhất. Không được dùng eslint-disable-next-line hoặc eslint-disable để bỏ qua lỗi lint trong bất kỳ trường hợp nào. Nếu có lỗi lint phát sinh, bắt buộc phải fix ngay lập tức để đảm bảo codebase luôn sạch sẽ và tuân thủ các quy tắc đã đề ra trong tài liệu Quy trình (Coding Guidelines). Việc bỏ qua lỗi lint sẽ dẫn đến việc tích tụ các vấn đề về chất lượng code, làm giảm hiệu suất làm việc của team và tăng nguy cơ phát sinh lỗi nghiêm trọng trong tương lai. Do đó, việc tuân thủ nghiêm ngặt các quy tắc lint là bắt buộc để duy trì chất lượng code và đảm bảo sự ổn định của dự án.
Tiếp tục sẽ run unit test, sonar coverage để đảm bảo rằng các phần code mới sửa đã được kiểm thử đầy đủ và không làm giảm độ bao phủ của test. Nếu có bất kỳ lỗi nào phát sinh từ unit test hoặc giảm độ bao phủ, bắt buộc phải fix ngay lập tức trước khi tiếp tục vòng lặp kiểm thử. Việc duy trì độ bao phủ của test là rất quan trọng để đảm bảo rằng tất cả các phần code đều được kiểm thử đầy đủ và giảm thiểu rủi ro phát sinh lỗi trong tương lai. Do đó, việc tuân thủ nghiêm ngặt quy trình kiểm thử và đảm bảo độ bao phủ của test là bắt buộc để duy trì chất lượng sản phẩm và sự ổn định của dự án. Luôn đảm bảo coverage của test không giảm sau mỗi lần sửa lỗi, và nếu có bất kỳ lỗi nào phát sinh từ unit test, bắt buộc phải fix ngay lập tức để đảm bảo rằng tất cả các phần code đều được kiểm thử đầy đủ và giảm thiểu rủi ro phát sinh lỗi trong tương lai. Việc duy trì độ bao phủ của test là rất quan trọng để đảm bảo rằng tất cả các phần code đều được kiểm thử đầy đủ và giảm thiểu rủi ro phát sinh lỗi trong tương lai. Do đó, việc tuân thủ nghiêm ngặt quy trình kiểm thử và đảm bảo độ bao phủ của test là bắt buộc để duy trì chất lượng sản phẩm và sự ổn định của dự án. Nếu có bất kỳ lỗi nào phát sinh từ unit test hoặc giảm độ bao phủ, bắt buộc phải fix ngay lập tức trước khi tiếp tục vòng lặp kiểm thử. luon đảm bảo phần trăm độ phủ luôn là 100% sau mỗi lần sửa lỗi, và nếu có bất kỳ lỗi nào phát sinh từ unit test, bắt buộc phải fix ngay lập tức để đảm bảo rằng tất cả các phần code đều được kiểm thử đầy đủ và giảm thiểu rủi ro phát sinh lỗi trong tương lai. Việc duy trì độ bao phủ của test là rất quan trọng để đảm bảo rằng tất cả các phần code đều được kiểm thử đầy đủ và giảm thiểu rủi ro phát sinh lỗi trong tương lai. Do đó, việc tuân thủ nghiêm ngặt quy trình kiểm thử và đảm bảo độ bao phủ của test là bắt buộc để duy trì chất lượng sản phẩm và sự ổn định của dự án. Không được phép để phần trăm độ phủ nhỏ hơn 100% sau mỗi lần sửa lỗi.

GIAI ĐOẠN 3: HOÀN THIỆN VÀ ĐỒNG BỘ (FINALIZATION & SYNC)
(Tương ứng Bước 6 & Cập nhật chéo)

Bước 6. Đóng băng Tài liệu Kiểm thử (Test Closure):

Khi 100% Test Cases đều "Passed" và DevTools không còn bất kỳ warning nào, xuất bản Test Report cuối cùng, xác nhận độ ổn định của bản build.

Bước 7. Đồng bộ hóa Tài liệu Hệ thống (Reverse Synchronization):

Dựa trên những thay đổi về code và logic phát sinh từ Giai đoạn 2, tiến hành "cập nhật ngược" lại 5 nhóm tài liệu còn lại để đảm bảo tính nhất quán duy nhất (Single Source of Truth):

Nhóm Yêu cầu (PRD/Use Cases): Cập nhật lại nếu trong quá trình test phát hiện logic nghiệp vụ ban đầu không khả thi và đã được thay đổi.

Nhóm Kiến trúc (SAD/Sequence Diagrams): Vẽ lại luồng đi của dữ liệu nếu lúc fix bug có thêm mới/bớt đi các bước gọi API hoặc thay đổi schema Database.

Nhóm Lập trình viên (API Docs/README): Cập nhật Swagger/OpenAPI nếu response body thay đổi; bổ sung các biến môi trường (.env) mới phát sinh vào file README.md.

Nhóm Quy trình (Coding Guidelines): Thêm các quy tắc mới vào guideline nếu phát hiện nguyên nhân gốc rễ của bug đến từ thói quen code không tốt của team.