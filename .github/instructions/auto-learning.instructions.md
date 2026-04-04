# Quy tắc Tự học (Auto-Learning) — BẮT BUỘC

> File này được load tự động vào mỗi session. Copilot PHẢI tuân thủ.

---

## NGUYÊN TẮC CỐT LÕI

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
