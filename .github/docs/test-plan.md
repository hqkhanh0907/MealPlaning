# TEST PLAN — Smart Meal Planner v1.0 (Updated)

> **Test Cases V2:** Xem `test-cases-v2.md` cho danh sách 201 TCs chi tiết (bao gồm edge cases).  
> **Test Cases V1:** Xem `test-cases.md` cho 41 TCs gốc (đã thực thi 100% pass).

## 1. Thông tin chung

| Mục | Chi tiết |
|-----|---------|
| **Dự án** | Smart Meal Planner |
| **Phiên bản** | 1.0.0 |
| **Ngày tạo** | 2026-02-25 |
| **Loại kiểm thử** | Frontend UI + Tích hợp (localStorage) |
| **Môi trường** | macOS, Chrome, localhost:3000 |
| **Framework** | React 19, TypeScript, Tailwind CSS 4, Vite 6 |
| **Kiến trúc** | Standalone SPA, No Backend (AI qua Google Genai SDK) |

## 2. Phạm vi kiểm thử

### Trong phạm vi:
- **Tab Lịch trình (Calendar):** Chọn ngày, xem tóm tắt dinh dưỡng, lên kế hoạch bữa ăn, gợi ý AI, xóa kế hoạch, cài đặt mục tiêu, tips động
- **Tab Thư viện (Management):** Quản lý nguyên liệu (CRUD), quản lý món ăn (CRUD), sao lưu/khôi phục dữ liệu
- **Tab Đi chợ (Grocery):** Xem danh sách đi chợ theo ngày/tuần/tất cả, checkbox, chia sẻ
- **Tab AI Phân tích:** Upload/chụp ảnh, phân tích AI, skeleton loading, lưu kết quả
- **Navigation:** Bottom nav (mobile), Desktop nav, AI badge, tab switching
- **Error Handling:** ErrorBoundary per tab
- **Data Persistence:** localStorage (usePersistedState)
- **Responsive:** Mobile-first, Desktop

### Ngoài phạm vi:
- Backend API testing (không có backend)
- Performance/Load testing
- Capacitor/Android native testing
- AI accuracy testing (Google Genai SDK)

## 3. Công cụ kiểm thử

- **Chrome DevTools:** Console, Network, Application (localStorage), Elements
- **Trình duyệt:** Chrome (latest)
- **Responsive testing:** Chrome DevTools Device Mode

## 4. Danh sách Test Cases

Xem chi tiết tại: [test-cases.md](./test-cases.md)

## 5. Tiêu chí đạt/không đạt

- **Đạt (PASS):** Kết quả thực tế khớp với kết quả mong đợi, không có lỗi JS trong Console, không có request 404 (trừ favicon)
- **Không đạt (FAIL):** Kết quả thực tế khác biệt, có lỗi JS, crash, hoặc UI không render đúng

## 6. Rủi ro

| Rủi ro | Mức độ | Giải pháp |
|--------|--------|-----------|
| AI API Key không khả dụng | Cao | Test các luồng không cần AI, mock thông báo lỗi |
| localStorage bị xóa giữa phiên | Thấp | Kiểm tra persistence cẩn thận |
| Responsive chưa đầy đủ | Trung bình | Test cả mobile và desktop viewport |

