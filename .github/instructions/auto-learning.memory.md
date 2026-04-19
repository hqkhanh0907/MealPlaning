# Quy tắc Tự học (Auto-Learning) & Quy trình Bắt buộc — BẮT BUỘC

> File này được load tự động vào mỗi session. Copilot PHẢI tuân thủ.

---

## QUY TẮC #1: MANUAL TEST TRÊN EMULATOR SAU MỌI THAY ĐỔI CODE — BẮT BUỘC

> **KHÔNG ĐƯỢC COI TASK LÀ HOÀN THÀNH nếu chưa manual test trên emulator-5556.**

Sau **MỌI lần thay đổi code** (fix bug, thêm feature, refactor UI, thay đổi text/label), PHẢI thực hiện đầy đủ quy trình sau:

### Quy trình bắt buộc:

```
1. npm run lint          → 0 errors
2. npm run test          → 0 failures, coverage 100%
3. npm run build         → clean build
4. npm run test:coverage → generate lcov report
5. npm run sonar         → SonarQube scan → 0 issues (xem QUY TẮC #2)
   → Nếu còn issues → fix → lặp lại từ bước 1
6. npx cap sync android  → sync web assets
7. cd android && ./gradlew assembleDebug  → build APK
8. adb -s emulator-5556 install -r app-debug.apk  → install
9. CDP test script       → verify thay đổi trên emulator thật
10. Screenshot           → lưu bằng chứng
```

### Tại sao bắt buộc?

- Unit test PASS ≠ UI hiển thị đúng trên mobile
- CSS/layout có thể khác nhau giữa browser và Capacitor WebView
- Text overflow, button alignment, modal position chỉ phát hiện được khi chạy thật
- Emulator là **nguồn sự thật cuối cùng** (Single Source of Truth cho UI)

### KHÔNG ĐƯỢC bỏ qua vì bất kỳ lý do nào:

- ❌ "Chỉ thay đổi text" → VẪN PHẢI test (text overflow!)
- ❌ "Chỉ fix logic" → VẪN PHẢI test (propagation bug!)
- ❌ "Unit test đã pass" → VẪN PHẢI test (UI regression!)
- ❌ "Emulator khó setup" → ĐÃ CÓ sẵn quy trình CDP trong memory

---

## QUY TẮC #2: SONARQUBE SCAN TRƯỚC MỌI COMMIT — BẮT BUỘC

> **KHÔNG ĐƯỢC COMMIT nếu SonarQube còn bất kỳ issue nào (Bug, Vulnerability, Code Smell).**

Trước **MỌI lần commit code**, PHẢI thực hiện đầy đủ quy trình sau:

### Quy trình bắt buộc:

```
1. Đảm bảo SonarQube server đang chạy:
   - Kiểm tra: curl -sf http://localhost:9000/api/system/status
   - Nếu chưa chạy: docker compose up -d sonarqube → chờ đến khi status="UP"
   - Hoặc: npm run sonar:setup (tự động khởi động + tạo token)

2. Chạy coverage trước (SonarQube cần lcov report):
   - npm run test:coverage

3. Chạy SonarQube scan:
   - npm run sonar

4. Kiểm tra kết quả trên dashboard:
   - http://localhost:9000/dashboard?id=meal-planing
   - HOẶC dùng API: curl -sf -u "$SONAR_TOKEN:" "http://localhost:9000/api/issues/search?componentKeys=meal-planing&resolved=false&types=BUG,VULNERABILITY,CODE_SMELL" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Issues: {d[\"total\"]}')"

5. NẾU CÒN ISSUES → Fix tất cả → Quay lại bước 2 (loop)
   - Đọc từng issue trên dashboard
   - Fix code theo đề xuất của SonarQube
   - Chạy lại npm run test:coverage → npm run sonar
   - Lặp cho đến khi total issues = 0

6. CHỈ KHI 0 issues → ĐƯỢC PHÉP commit
```

### Tại sao bắt buộc?

- ESLint chỉ bắt syntax/style issues → SonarQube phát hiện thêm **logic bugs, security vulnerabilities, code smells**
- SonarQube phân tích **data flow** và **control flow** sâu hơn ESLint
- Cognitive Complexity, Duplications, Security Hotspots chỉ SonarQube mới phát hiện
- Giữ codebase **zero-issue** từ đầu dễ hơn sửa hàng trăm issues tích tụ

### KHÔNG ĐƯỢC bỏ qua vì bất kỳ lý do nào:

- ❌ "Chỉ thay đổi nhỏ" → VẪN PHẢI scan (1 dòng có thể tạo security vulnerability!)
- ❌ "SonarQube chậm" → Scan mất ~30s, đáng để tránh bugs production
- ❌ "Issue là false positive" → Dùng `sonar.issue.ignore` trong config, KHÔNG skip scan
- ❌ "Server chưa chạy" → Khởi động bằng `docker compose up -d` trước

### Lệnh nhanh (copy-paste):

```bash
# Kiểm tra SonarQube status
curl -sf http://localhost:9000/api/system/status | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])"

# Khởi động nếu chưa chạy
docker compose up -d sonarqube

# Full scan pipeline
npm run test:coverage && npm run sonar

# Check issues count qua API
curl -sf -u "$SONAR_TOKEN:" "http://localhost:9000/api/issues/search?componentKeys=meal-planing&resolved=false" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Total issues: {d[\"total\"]}')"
```

---

## QUY TẮC #3: TỰ HỌC TỪ KINH NGHIỆM

Kinh nghiệm là tài sản quý nhất. **MỌI lần hoàn thành 1 task** đều phải rút kinh nghiệm.

---

## Quy trình 3 bước — CHẠY MỖI SESSION

### Bước 1: ĐỌC memory hiện có (đầu session)

Khi bắt đầu session mới, ĐỌC tất cả files trong `.github/instructions/memory/` để:

- Biết kinh nghiệm đã có
- Tránh lặp lại sai lầm cũ
- Áp dụng pattern đã được ghi nhận

### Bước 2: RÚT KINH NGHIỆM (sau mỗi task/trả lời)

Sau khi hoàn thành 1 task cho user, TỰ HỎI:

> 1. "Mình vừa học được gì mới?"
> 2. "Kinh nghiệm này đã có trong memory chưa?"
> 3. "Nếu có rồi — cần cập nhật/bổ sung gì không?"
> 4. "Nếu chưa — thêm vào file nào?"

### Bước 3: CẬP NHẬT memory

- **Kinh nghiệm MỚI** → APPEND vào file phù hợp
- **Kinh nghiệm đã có nhưng THIẾU** → Bổ sung thêm chi tiết
- **Kinh nghiệm đã có và ĐỦ** → Không cần làm gì
- **Commit ngay** sau khi cập nhật

---

## Loại kinh nghiệm cần lưu

| Loại                       | Ví dụ                                       | Giá trị             |
| -------------------------- | ------------------------------------------- | ------------------- |
| **Sai lầm**                | Tính nhẩm age sai → expected values sai hết | Tránh lặp lại       |
| **Pattern hiệu quả**       | Backward tracing từ UI → root cause         | Tái sử dụng         |
| **Gotcha/trap**            | Form dùng type="text" cho số                | Tiết kiệm thời gian |
| **Architecture discovery** | sql.js in-memory, không persist             | Hiểu hệ thống       |
| **Debug technique**        | CDP Runtime.evaluate thay adb tap           | Công cụ tốt hơn     |
| **Config/setup**           | Package name, port forwarding               | Không quên          |
| **Workaround**             | WebSocket suppress_origin                   | Platform limitation |
| **Quyết định thiết kế**    | Chọn GP1 vì ít thay đổi nhất                | Trade-off analysis  |
| **Quy trình tối ưu**       | Test tất cả trong 1 session                 | Best practice       |

**Không giới hạn** — bất cứ kinh nghiệm gì có giá trị cho lần sau đều PHẢI lưu.

---

## Lưu ở đâu?

Thư mục: `.github/instructions/memory/`

### Files hiện có (chọn file phù hợp để APPEND):

| File                                   | Chủ đề                                         |
| -------------------------------------- | ---------------------------------------------- |
| `emulator-testing.instructions.md`     | CDP, adb, emulator, WebView, form testids      |
| `test-case-design.instructions.md`     | Thiết kế test case, expected values, test data |
| `analysis-methodology.instructions.md` | Phương pháp phân tích, debug, audit            |

### Tạo file MỚI khi:

- Chủ đề không thuộc file nào ở trên
- Tên file: `<chủ-đề>.instructions.md` (suffix `.instructions.md` bắt buộc để auto-load)

---

## Format entry mới

```markdown
## N. Tiêu đề ngắn gọn

### Vấn đề

Mô tả vấn đề gặp phải (1-2 câu)

### Nguyên nhân

Root cause (1-2 câu)

### Giải pháp

Code/command/pattern cụ thể

### Bài học

1 câu tóm tắt để nhớ nhanh
```

### Quy tắc ghi:

1. **APPEND** vào file hiện có — KHÔNG tạo file mới nếu đã có file phù hợp
2. **Tăng số thứ tự** section (vd: file có đến ##20, entry mới là ##21)
3. **Cụ thể** — ghi code/command thật, KHÔNG viết chung chung
4. **Commit ngay** sau khi lưu — không để uncommitted
5. **Không lưu rác** — chỉ lưu điều thực sự có giá trị cho lần sau
