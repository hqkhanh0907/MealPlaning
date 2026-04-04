# Quy tắc Tự học (Auto-Learning) — BẮT BUỘC

> File này được load tự động vào mỗi session. Copilot PHẢI tuân thủ.

---

## Khi nào PHẢI lưu vào memory?

Khi xảy ra **BẤT KỲ** tình huống nào sau đây trong session:

| Trigger                                     | Ví dụ                                                        |
| ------------------------------------------- | ------------------------------------------------------------ |
| **Retry > 2 lần** cho cùng 1 vấn đề         | Build fail 3 lần vì sai config                               |
| **Sai approach** phải đổi hướng             | Dùng `input[type="number"]` → fail → phải dùng `data-testid` |
| **Gotcha/trap** mất > 10 phút               | Age tính nhẩm sai 1 năm → toàn bộ expected values sai        |
| **Workaround** cho tool/platform limitation | WebSocket cần `suppress_origin=True`                         |
| **Pattern mới** có giá trị tái sử dụng      | Backward tracing từ UI → root cause                          |
| **Debug technique** hiệu quả                | CDP `Runtime.evaluate` thay vì `adb tap`                     |
| **Config/setup** dễ quên                    | Package name đúng, port forwarding command                   |
| **Architecture discovery**                  | sql.js in-memory → không persist, mất data khi restart       |
| **Phát hiện bug** và cách fix               | Consumer dùng TDEE thay Target                               |
| **Sai lầm phân tích**                       | Chỉ audit logic, bỏ qua persistence layer                    |

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

## Cách lưu?

### Format entry mới:

```markdown
## N. Tiêu đề ngắn gọn

### Vấn đề

Mô tả vấn đề gặp phải (1-2 câu)

### Nguyên nhân

Root cause (1-2 câu)

### Giải pháp

Code/command/pattern cụ thể

### Thời gian mất

Ước lượng (vd: "2 vòng retry, ~30 phút")
```

### Quy tắc:

1. **APPEND** vào file hiện có — KHÔNG tạo file mới nếu đã có file phù hợp
2. **Tăng số thứ tự** section (vd: file có đến ##20, entry mới là ##21)
3. **Cụ thể** — ghi code/command thật, KHÔNG viết chung chung
4. **Commit ngay** sau khi lưu — không để uncommitted

---

## Quy trình cuối mỗi session

Trước khi kết thúc session (hoặc trước `task_complete`), tự hỏi:

> "Trong session này, tôi có gặp tình huống nào trong bảng trigger ở trên không?"

Nếu CÓ → lưu vào memory TRƯỚC khi kết thúc.
Nếu KHÔNG → không cần lưu (không lưu rác).

---

## Ví dụ thực tế (từ session 2026-04-04)

### Trigger: Sai approach → đổi hướng

- **Vấn đề**: Tìm weight input bằng `input[type="number"]` → không tìm thấy
- **Lưu vào**: `emulator-testing.instructions.md` → Section "Health Profile Form"
- **Nội dung**: Bảng testids, ghi rõ type="text" cho số

### Trigger: Gotcha mất > 10 phút

- **Vấn đề**: Age tính nhẩm = 30, thực tế = 29 → tất cả expected sai
- **Lưu vào**: `test-case-design.instructions.md` → Section "Sai lầm 5.1"
- **Nội dung**: Code Python tính age đúng, bảng ví dụ

### Trigger: Architecture discovery

- **Vấn đề**: sql.js in-memory, force-stop mất hết data
- **Lưu vào**: `emulator-testing.instructions.md` → Section "KIẾN TRÚC"
- **Nội dung**: Hệ quả + ảnh hưởng đến test strategy
