---
title: Tầm nhìn Sản phẩm
status: Active
version: 1.1
owner: CEO
updated: 2026-04-12
related:
  - docs/2-requirements/prd.md
  - docs/3-design/design-handoff.md
---

# 📋 PRODUCT VISION — Smart Meal Planner

---

## Mục lục

1. [Tầm nhìn sản phẩm](#1-tầm-nhìn-sản-phẩm)
2. [Vấn đề cần giải quyết](#2-vấn-đề-cần-giải-quyết)
3. [User Persona](#3-user-persona)
4. [Jobs-to-be-Done](#4-jobs-to-be-done)
5. [Nguyên tắc sản phẩm](#5-nguyên-tắc-sản-phẩm)
6. [Phân tích cạnh tranh](#6-phân-tích-cạnh-tranh)
7. [Giá trị độc nhất & Lợi thế cạnh tranh](#7-giá-trị-độc-nhất--lợi-thế-cạnh-tranh)
8. [Phạm vi & Ưu tiên (MoSCoW)](#8-phạm-vi--ưu-tiên-moscow)
9. [Chỉ số thành công (KPIs)](#9-chỉ-số-thành-công-kpis)
10. [Đánh giá rủi ro](#10-đánh-giá-rủi-ro)
11. [Mô hình kinh doanh](#11-mô-hình-kinh-doanh)
12. [Thị trường mục tiêu](#12-thị-trường-mục-tiêu)

---

## 1. Tầm nhìn sản phẩm

### Tuyên bố tầm nhìn (Vision Statement)

> **Trở thành ứng dụng sức khỏe #1 Việt Nam** — nơi mọi người từ 16 đến 45 tuổi có thể theo dõi dinh dưỡng, lập kế hoạch tập luyện, và đạt mục tiêu sức khỏe cá nhân **chỉ trong vài giây mỗi ngày** — mà không cần kiến thức chuyên môn.

### Tóm tắt một câu (Elevator Pitch)

**Smart Meal Planner** là ứng dụng di động giúp người Việt Nam quản lý dinh dưỡng và tập luyện bằng AI — chỉ cần chụp ảnh đĩa cơm, app tự tính calo. Khác biệt với MyFitnessPal: miễn phí 100%, thiết kế cho người Việt, đơn giản đến mức ai cũng dùng được.

### Sản phẩm dùng để làm gì?

Smart Meal Planner kết hợp **3 trụ cột** trong 1 ứng dụng duy nhất:

| Trụ cột           | Mô tả                                                 | Ví dụ                                            |
| ----------------- | ----------------------------------------------------- | ------------------------------------------------ |
| 🍽️ **Dinh dưỡng** | Theo dõi calo, protein, macro hàng ngày               | Chụp ảnh bữa trưa → app log 550 calo             |
| 💪 **Tập luyện**  | Lên kế hoạch workout và ghi log bài tập               | Mở app tại gym → thấy ngay "Ngày Ngực + Vai"     |
| 🤖 **AI**         | Nhận diện thức ăn, tra cứu dinh dưỡng, gợi ý thực đơn | Gõ "Đậu hũ" → AI điền: 76 calo, 8g protein /100g |

---

## 2. Vấn đề cần giải quyết

### Pain Points — 6 vấn đề thực tế người Việt gặp phải

| #   | Vấn đề                                                                                                     | Mức độ đau (1-5) | Bằng chứng                           |
| --- | ---------------------------------------------------------------------------------------------------------- | :--------------: | ------------------------------------ |
| P1  | **Không biết hôm nay ăn gì cho đúng mục tiêu** — Muốn giảm/tăng cân nhưng không biết cần ăn bao nhiêu calo |    ⭐⭐⭐⭐⭐    | 4/4 persona đều gặp                  |
| P2  | **Nhập liệu dinh dưỡng quá mất thời gian** — Phải tra từng nguyên liệu, tính khẩu phần, cộng tổng          |    ⭐⭐⭐⭐⭐    | Lý do #1 bỏ app (Minh)               |
| P3  | **Không biết món Việt có bao nhiêu calo** — Phở, bún chả, cơm tấm không có trong database MyFitnessPal     |     ⭐⭐⭐⭐     | MFP chỉ có món Tây                   |
| P4  | **Không có kế hoạch tập phù hợp** — Đến gym không biết tập gì, tập xong quên ghi                           |     ⭐⭐⭐⭐     | Persona Anh (PT)                     |
| P5  | **App hiện tại quá phức tạp hoặc quá đắt** — MFP paywall, Samsung Health thiếu tính năng                   |      ⭐⭐⭐      | Persona Minh dùng MFP nhưng khó dùng |
| P6  | **Không thấy tiến trình rõ ràng** — Tập 1 tháng mà không biết có tiến bộ không                             |      ⭐⭐⭐      | Persona Anh cần xem tổng quan        |

### Giải pháp cốt lõi

> **Giảm thời gian nhập liệu dinh dưỡng từ 5 phút xuống 10 giây** bằng AI nhận diện ảnh + database món Việt — đồng thời cung cấp kế hoạch tập luyện cá nhân hóa trong cùng 1 app.

---

## 3. User Persona

### Persona 1: Minh — "Người muốn kiểm soát cân nặng nhưng lười nhập liệu"

| Thuộc tính         | Chi tiết                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------- |
| **Tuổi / Giới**    | 25 tuổi, Nam                                                                                |
| **Nghề nghiệp**    | Nhân viên văn phòng                                                                         |
| **Thiết bị**       | Android cao cấp (>10 triệu)                                                                 |
| **Rành công nghệ** | 2-3/5 — Dùng được Facebook, Zalo nhưng không thích app phức tạp                             |
| **Đang dùng**      | Đã thử MyFitnessPal, bỏ vì nhập liệu quá lâu và phức tạp                                    |
| **Mục tiêu**       | Giảm cân HOẶC tăng cơ — muốn kiểm soát lượng calo nạp vào chính xác                         |
| **Pain #1**        | Nhập liệu dinh dưỡng quá mất thời gian — tra từng nguyên liệu, tính khẩu phần               |
| **Pain #2**        | Không biết dinh dưỡng chính xác của món Việt                                                |
| **Hành vi**        | Mở app 2-3 lần/ngày (sau mỗi bữa ăn), mỗi lần < 1 phút                                      |
| **Quote**          | _"Tôi chỉ muốn chụp ảnh đĩa cơm hoặc gõ tên món rồi xong, không muốn tra từng nguyên liệu"_ |

> **Lưu ý**: Persona này đại diện cho CẢ nhu cầu giảm cân (calorie deficit) LẪN tăng cân (calorie surplus). Cả hai đều cần cùng core feature: tracking chính xác + nhập liệu nhanh. Khác biệt duy nhất là goal setting (cut vs bulk) — đã được handle trong onboarding.

### Persona 2: Vy — "Sinh viên giảm cân theo mục tiêu"

| Thuộc tính         | Chi tiết                                                               |
| ------------------ | ---------------------------------------------------------------------- |
| **Tuổi / Giới**    | 20 tuổi, Nữ                                                            |
| **Nghề nghiệp**    | Sinh viên                                                              |
| **Thiết bị**       | Android tầm trung                                                      |
| **Rành công nghệ** | 3/5 — Cài app thành thạo                                               |
| **Đang dùng**      | Không dùng app nào (ghi sổ tay hoặc tính nhẩm)                         |
| **Mục tiêu**       | Giảm cân có kiểm soát — muốn thâm hụt calo hàng ngày                   |
| **Pain #1**        | Muốn biết lượng đồ ăn nạp vào có đạt mục tiêu thâm hụt calo không      |
| **Pain #2**        | Ngân sách eo hẹp — không trả được phí subscription                     |
| **Hành vi**        | Mở app 3 lần/ngày, check target calo sau mỗi bữa                       |
| **Quote**          | _"Tôi cần biết hôm nay còn bao nhiêu calo để ăn tối mà không bị vượt"_ |

### Persona 3: Anh — "Huấn luyện viên quản lý workout"

| Thuộc tính         | Chi tiết                                                               |
| ------------------ | ---------------------------------------------------------------------- |
| **Tuổi / Giới**    | 20 tuổi, Nam                                                           |
| **Nghề nghiệp**    | Hướng dẫn viên thể hình (PT)                                           |
| **Thiết bị**       | Android cao cấp                                                        |
| **Rành công nghệ** | 4/5 — Rành tech, thích khám phá                                        |
| **Đang dùng**      | Ghi sổ tay + Excel                                                     |
| **Mục tiêu**       | Quản lý kế hoạch tập và theo dõi tiến trình                            |
| **Pain #1**        | Hôm nay tập gì? Nhập bài tập, kiểm tra lại quá trình tập               |
| **Pain #2**        | Muốn xem tổng quan tiến trình tập trong tuần/tháng/năm                 |
| **Hành vi**        | Mở app tại gym, log workout real-time, review cuối tuần                |
| **Quote**          | _"Tôi cần mở app là thấy ngay bài tập hôm nay, không cần click 5 lần"_ |

### Ma trận Persona × Feature

| Feature              | Minh 🏢 (cut/bulk) | Vy 🎓  | Anh 💪 |
| -------------------- | :----------------: | :----: | :----: |
| AI nhận diện ảnh     |       ⭐⭐⭐       |  ⭐⭐  |   ⭐   |
| Tracking calo        |       ⭐⭐⭐       | ⭐⭐⭐ |  ⭐⭐  |
| Kế hoạch tập         |        ⭐⭐        |   ⭐   | ⭐⭐⭐ |
| Workout logging      |        ⭐⭐        |   ⭐   | ⭐⭐⭐ |
| Dashboard tiến trình |        ⭐⭐        |  ⭐⭐  | ⭐⭐⭐ |
| Gợi ý thực đơn AI    |        ⭐⭐        | ⭐⭐⭐ |   ⭐   |

> ⭐⭐⭐ = Tính năng cốt lõi cho persona này | ⭐ = Dùng nhưng không phải lý do chính

---

## 4. Jobs-to-be-Done

Mỗi "Job" mô tả một **tình huống thực tế** mà user cần app giải quyết. Đây là cơ sở để BM viết Use Cases và Designer thiết kế User Flow.

### Job 1: Tracking nhanh sau bữa ăn ⭐ (Core Job)

> **"Khi tôi vừa ăn xong, tôi muốn chụp ảnh đĩa cơm hoặc gõ tên món, để app tự ghi lại dinh dưỡng trong vòng 10 giây — không cần tra từng nguyên liệu."**

| Thuộc tính               | Chi tiết                                                     |
| ------------------------ | ------------------------------------------------------------ |
| **Persona**              | Minh                                                         |
| **Tần suất**             | 2-3 lần/ngày                                                 |
| **Thước đo thành công**  | Thời gian log 1 bữa ≤ 10 giây                                |
| **Alternative hiện tại** | MyFitnessPal (5+ phút), ghi sổ tay (quên), không ghi (đa số) |

### Job 2: Biết ngân sách calo còn lại

> **"Khi tôi muốn biết hôm nay còn ăn được bao nhiêu nữa, tôi muốn mở app thấy ngay '764 calo còn lại', để tôi chọn bữa tối phù hợp mà không vượt mục tiêu."**

| Thuộc tính               | Chi tiết                                               |
| ------------------------ | ------------------------------------------------------ |
| **Persona**              | Vy, Minh                                               |
| **Tần suất**             | 1-2 lần/ngày (trước bữa ăn)                            |
| **Thước đo thành công**  | Thông tin hiển thị trong ≤ 2 giây (mở app → thấy ngay) |
| **Alternative hiện tại** | Tính nhẩm (không chính xác), không tính (đa số)        |

### Job 3: Tạo món ăn với AI tra cứu

> **"Khi tôi muốn thêm món ăn mới nhưng không biết dinh dưỡng, tôi muốn gõ tên nguyên liệu và AI tự điền số liệu, để tôi không cần tra bảng dinh dưỡng."**

| Thuộc tính               | Chi tiết                                             |
| ------------------------ | ---------------------------------------------------- |
| **Persona**              | Minh                                                 |
| **Tần suất**             | 2-3 lần/tuần (khi thêm món mới)                      |
| **Thước đo thành công**  | AI điền chính xác ≥ 90% so với bảng dinh dưỡng chuẩn |
| **Alternative hiện tại** | Google search (5+ phút, không chính xác), bỏ qua     |

### Job 4: Tập luyện có kế hoạch

> **"Khi tôi đến gym và không nhớ hôm nay tập gì, tôi muốn mở app thấy ngay danh sách bài tập với set/rep rõ ràng, để bắt đầu tập trong 10 giây."**

| Thuộc tính               | Chi tiết                                                   |
| ------------------------ | ---------------------------------------------------------- |
| **Persona**              | Anh, Minh                                                  |
| **Tần suất**             | 3-6 lần/tuần                                               |
| **Thước đo thành công**  | Từ mở app → bắt đầu tập ≤ 10 giây                          |
| **Alternative hiện tại** | Ghi sổ tay (quên mang), Excel (không tiện trên điện thoại) |

### Job 5: Xem tiến trình tổng quan

> **"Khi tôi muốn biết tuần/tháng này có tiến bộ không, tôi muốn thấy biểu đồ cân nặng, streak tập luyện, và xu hướng calo, để tôi có động lực tiếp tục."**

| Thuộc tính               | Chi tiết                                        |
| ------------------------ | ----------------------------------------------- |
| **Persona**              | Anh, Vy                                         |
| **Tần suất**             | 1-2 lần/tuần                                    |
| **Thước đo thành công**  | Dashboard hiển thị trend rõ ràng trong ≤ 3 giây |
| **Alternative hiện tại** | Tự vẽ biểu đồ Excel, không theo dõi             |

---

## 5. Nguyên tắc sản phẩm

5 nguyên tắc dưới đây là **luật bất di bất dịch** — khi hai quyết định mâu thuẫn, nguyên tắc có số thứ tự nhỏ hơn THẮNG.

### 🥇 Nguyên tắc 1: Evidence-based (Dựa trên khoa học)

> Mọi công thức, gợi ý, và tính toán trong app PHẢI dựa trên nghiên cứu khoa học đã được kiểm chứng.

**Áp dụng:**

- Công thức BMR: Mifflin-St Jeor (tiêu chuẩn y khoa)
- Hệ số vận động: Katch-McArdle validated
- Protein khuyến nghị: 1.6-2.2g/kg (meta-analysis ISSN)
- AI nutrition: Cross-check với USDA/VNFI database

**Ví dụ mâu thuẫn:** AI gợi ý "detox 3 ngày" → TỪ CHỐI vì không có evidence khoa học.

### 🥈 Nguyên tắc 2: Data Accuracy > Convenience (Chính xác hơn tiện lợi)

> Thà mất thêm 5 giây nhập liệu còn hơn ghi sai 100 calo. Không bao giờ làm tròn số để "nhìn đẹp hơn".

**Áp dụng:**

- Hiển thị calo chính xác đến đơn vị (1704 kcal, không phải "~1700")
- AI nhận diện ảnh PHẢI cho user review trước khi lưu
- Khi không chắc chắn → hỏi user thay vì đoán

**Ví dụ mâu thuẫn:** User muốn "1 chạm log bữa ăn" nhưng AI chưa chắc chắn → BẮT BUỘC hiển thị preview để user xác nhận. Accuracy thắng Convenience.

### 🥉 Nguyên tắc 3: Simple > Powerful (Đơn giản hơn phức tạp)

> Người mới PHẢI hiểu app trong 30 giây đầu tiên. Nếu một tính năng cần "hướng dẫn sử dụng" thì tính năng đó chưa đủ đơn giản.

**Áp dụng:**

- Onboarding ≤ 7 bước, mỗi bước 1 hành động duy nhất
- Navigation: 5 tab rõ ràng, không sub-menu ẩn
- Empty state: Khi chưa có data → hiển thị hướng dẫn visual thay vì trang trắng

**Ví dụ mâu thuẫn:** Feature "tùy chỉnh macro ratio" cho power user → ẨN trong Settings, không hiển thị trên main screen. Simple cho đa số, Powerful cho ai cần.

### Nguyên tắc 4: AI-Augmented (AI hỗ trợ, user kiểm soát)

> AI là trợ lý, KHÔNG phải người quyết định. User luôn có quyền chỉnh sửa, từ chối, hoặc ghi đè kết quả AI.

**Áp dụng:**

- AI nhận diện ảnh → hiển thị kết quả → user EDIT → user CONFIRM → lưu
- AI gợi ý thực đơn → user CHỌN chấp nhận hoặc từ chối từng món
- AI tra cứu dinh dưỡng → user KIỂM TRA số liệu trước khi lưu
- Khi không có internet → tất cả tính năng non-AI vẫn hoạt động bình thường

**Offline vs Online Feature Map:**

| Feature                        | Offline ✅ | Online 🌐 | Ghi chú                |
| ------------------------------ | :--------: | :-------: | ---------------------- |
| Meal planning (thêm/sửa/xóa)   |     ✅     |           | SQLite local           |
| Nutrition tracking & dashboard |     ✅     |           | Tính toán local        |
| Workout logging                |     ✅     |           | SQLite local           |
| Training plan & scheduling     |     ✅     |           | SQLite local           |
| Ingredient library (có sẵn)    |     ✅     |           | Seed data + user-added |
| Settings & profile             |     ✅     |           | SQLite + localStorage  |
| AI nhận diện ảnh               |            |    🌐     | Gemini API             |
| AI tra cứu dinh dưỡng          |            |    🌐     | Gemini API             |
| AI gợi ý thực đơn              |            |    🌐     | Gemini API             |
| Google Drive backup/restore    |            |    🌐     | Google Drive API       |

> **Tỷ lệ**: 7/10 features = 100% offline. 3/10 features = cần internet (đều là AI-powered). Offline coverage ≈ **90%** theo thời gian sử dụng thực tế (user dùng AI ~3 lần/ngày, còn lại đều offline).

**Ví dụ mâu thuẫn:** AI muốn "tự động log bữa ăn khi detect ảnh trong gallery" → TỪ CHỐI vì user chưa chủ động cho phép.

### Nguyên tắc 5: Privacy by default (Riêng tư mặc định)

> Dữ liệu sức khỏe là dữ liệu CỰC KỲ NHẠY CẢM. Không bao giờ rời thiết bị trừ khi user chủ động cho phép.

**Áp dụng:**

- Database SQLite lưu trên thiết bị, KHÔNG có server backend
- Google Drive sync: CHỈ khi user tự đăng nhập và nhấn "Tải lên"
- AI request: CHỈ khi user nhấn nút phân tích, KHÔNG tự gửi data
- Xóa app = xóa toàn bộ dữ liệu (trừ khi đã backup)
- Không thu thập analytics, không tracking, không ads

**Ví dụ mâu thuẫn:** Muốn thêm "bảng xếp hạng cộng đồng" → TỪ CHỐI ở V1 vì yêu cầu chia sẻ dữ liệu cá nhân lên server.

---

## 6. Phân tích cạnh tranh

### Ma trận so sánh

| Tiêu chí                         |    **Smart Meal Planner**     |     **MyFitnessPal**     |     **Samsung/Apple Health**      |
| -------------------------------- | :---------------------------: | :----------------------: | :-------------------------------: |
| Giá                              |       ✅ Miễn phí 100%        | ❌ Freemium ($79.99/năm) |            ✅ Miễn phí            |
| Món Việt Nam                     | ✅ Database Việt + AI tra cứu |    ❌ Chủ yếu món Tây    |            ❌ Không có            |
| Giao diện tiếng Việt             |     ✅ Native Vietnamese      |   ⚠️ Có nhưng dịch máy   |               ✅ Có               |
| AI nhận diện ảnh                 |        ✅ Có (Gemini)         |     ⚠️ Premium only      |             ❌ Không              |
| Workout logging                  |      ✅ Có + kế hoạch AI      |        ⚠️ Cơ bản         |             ⚠️ Cơ bản             |
| Offline                          |        ✅ 90% offline         |  ⚠️ Cần mạng cho search  |            ✅ Offline             |
| Privacy                          |    ✅ No server, local DB     |      ❌ Cloud-based      |           ⚠️ Cloud sync           |
| All-in-one (Nutrition + Fitness) |    ✅ Tích hợp trong 1 app    |   ⚠️ Chủ yếu nutrition   |        ⚠️ Chủ yếu fitness         |
| Độ phức tạp UI                   |      ✅ Đơn giản (5 tab)      | ❌ Phức tạp (nhiều menu) | ✅ Đơn giản nhưng thiếu tính năng |

### Điểm yếu của đối thủ = Cơ hội của chúng ta

| Đối thủ        | Điểm yếu                                     | Cơ hội cho Smart Meal Planner       |
| -------------- | -------------------------------------------- | ----------------------------------- |
| MyFitnessPal   | Trả phí, phức tạp, không có món Việt         | Miễn phí + đơn giản + database Việt |
| Samsung Health | Ít người biết dùng, thiếu nutrition tracking | All-in-one nutrition + fitness      |
| Ghi sổ tay     | Quên, không chính xác, không theo dõi trend  | Tự động + chính xác + biểu đồ       |

---

## 7. Giá trị độc nhất & Lợi thế cạnh tranh

### Unique Value Proposition (UVP)

> **"Ứng dụng sức khỏe miễn phí DUY NHẤT cho người Việt kết hợp tracking dinh dưỡng AI + kế hoạch tập luyện cá nhân hóa — đơn giản đến mức chỉ cần chụp ảnh đĩa cơm."**

### 3 điểm khác biệt cốt lõi

| #   | Điểm khác biệt                                                                            | Tại sao quan trọng                                                                     | Đối thủ có không?                       |
| --- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------- |
| 1   | **Vietnamese-native UX** — Thiết kế từ đầu cho người Việt, không phải localize từ app Tây | Persona tech level 2-3/5, cần UI cực kỳ đơn giản bằng tiếng Việt tự nhiên              | ❌ MFP dịch máy, Samsung Health generic |
| 2   | **AI + Offline hybrid** — AI khi có mạng, full-function khi không có mạng                 | 90% thời gian dùng = offline (tại bàn ăn, tại gym). AI là bonus, không phải dependency | ❌ MFP cần mạng                         |
| 3   | **Zero cost, zero data collection** — Miễn phí vĩnh viễn, không thu thập dữ liệu          | Giải quyết pain "trả phí" (MFP) và "lo ngại privacy" (cloud apps)                      | ❌ MFP $79.99/năm                       |

### Unfair Advantage (Lợi thế không thể copy)

**Primary moat: UX Moat** — Trải nghiệm đơn giản nhất cho người Việt.

Đối thủ lớn (MyFitnessPal, Noom) thiết kế cho thị trường toàn cầu → phức tạp hóa để phục vụ mọi người. Smart Meal Planner thiết kế TỪ ĐẦU cho 1 thị trường duy nhất (Việt Nam, 16-45 tuổi) → mọi quyết định UX đều tối ưu cho đúng nhóm này.

**Secondary moat: Speed of execution** — Solo developer ship nhanh hơn team 50 người ở công ty lớn. Mỗi insight từ user → cập nhật app trong ngày, không cần qua 5 lớp approval.

---

## 8. Phạm vi & Ưu tiên (MoSCoW)

### V1 — Phiên bản ra mắt

#### 🟢 MUST HAVE — Không có thì KHÔNG ra mắt

| #   | Feature                                                           | Persona chính | Job liên quan |
| --- | ----------------------------------------------------------------- | :-----------: | :-----------: |
| M1  | **Onboarding** — Thu thập health profile, tạo kế hoạch            |    Tất cả     |     Setup     |
| M2  | **Meal Planning** — Lập kế hoạch bữa ăn sáng/trưa/tối             |   Minh, Vy    |   Job 1, 2    |
| M3  | **Ingredient Library** — Kho nguyên liệu + dinh dưỡng/100g        |    Tất cả     |   Job 1, 3    |
| M4  | **Nutrition Tracking** — Tính calo/macro tự động, so sánh target  |   Vy, Minh    |     Job 2     |
| M5  | **Workout Logging** — Ghi log bài tập (set/rep/weight)            |   Anh, Minh   |     Job 4     |
| M6  | **Settings** — Chỉnh sửa profile, mục tiêu, kế hoạch tập          |    Tất cả     |  Maintenance  |
| M7  | **AI Photo Analysis** — Chụp ảnh → nhận diện món → log dinh dưỡng |     Minh      |     Job 1     |
| M8  | **Google Drive Sync** — Sao lưu/khôi phục dữ liệu                 |    Tất cả     |  Data safety  |
| M9  | **Dashboard** — Tổng quan dinh dưỡng + tập luyện hôm nay          |    Anh, Vy    |   Job 2, 5    |

#### 🟡 COULD HAVE — Nếu kịp thì làm

| #   | Feature           | Lý do xếp Could                         |
| --- | ----------------- | --------------------------------------- |
| C1  | Danh sách đi chợ  | Nice-to-have, user có thể tự ghi        |
| C2  | AI gợi ý thực đơn | Phụ thuộc vào AI quality                |
| C3  | Dark mode         | UX bonus, không ảnh hưởng core function |

#### 🔴 WON'T HAVE (V1) — Để V2 trở đi

| #   | Feature                         | Lý do hoãn                              |
| --- | ------------------------------- | --------------------------------------- |
| W1  | Kết nối smartwatch              | Cần SDK phức tạp, ít user có smartwatch |
| W2  | Phiên bản iOS                   | Solo dev, focus Android trước           |
| W3  | Multi-language                  | Vietnamese-first, English sau           |
| W4  | Social features / Chia sẻ       | Vi phạm Privacy principle               |
| W5  | Barcode scanner                 | Cần database UPC Việt Nam (chưa có)     |
| W6  | Template bữa ăn / Copy kế hoạch | Không phát triển ở V1                   |

---

## 9. Chỉ số thành công (KPIs)

### North Star Metric

> **Số bữa ăn được log mỗi ngày PER USER** (Meals Logged / Day / User)
>
> Đo hoàn toàn local (SQLite count). Phản ánh: user MỞ app (active) + DÙNG core feature (engagement) + THẤY GIÁ TRỊ (retention). Không cần server analytics.

### 4 KPIs chính — 100% đo local, không cần backend

| #   | KPI                           | Target V1 | Cách đo                                                                      |
| --- | ----------------------------- | :-------: | ---------------------------------------------------------------------------- |
| 🥇  | **Meals Logged / Day / User** | ≥ 1.5 bữa | SQLite: `COUNT(*) FROM day_plans WHERE date = today`                         |
| 🥈  | **AI Acceptance Rate**        |   ≥ 85%   | Local counter: AI results user accepted ÷ total AI results shown             |
| 🥉  | **App Store Rating**          | ≥ 4.5 ⭐  | CH Play console (public metric, không phải tracking)                         |
| 4   | **Crash-free Sessions**       |  ≥ 99.5%  | Firebase Crashlytics (opt-in, chỉ crash data — không thu thập behavior data) |

### KPIs phụ — đo qua proxy, không tracking user

| KPI                        | Cách đo proxy                                          | Ý nghĩa                        |
| -------------------------- | ------------------------------------------------------ | ------------------------------ |
| Onboarding Completion Rate | CH Play install → first review ratio                   | Chất lượng first experience    |
| Active Usage (proxy)       | CH Play "current installs" trend                       | Sức khỏe tổng thể              |
| Workout Consistency        | Local: `COUNT(DISTINCT date) FROM workouts WHERE week` | Core engagement fitness pillar |

> **Nguyên tắc**: Tuân thủ Product Principle #5 (Privacy by default). KHÔNG sử dụng: Firebase Analytics, Google Analytics, Mixpanel, Amplitude, hoặc bất kỳ user behavior tracking nào. Chỉ đo những gì user có thể thấy trên thiết bị của họ.

---

## 10. Đánh giá rủi ro

### 4 rủi ro chính

#### ⚠️ Rủi ro 1: Dữ liệu dinh dưỡng không chính xác (HIGH)

| Thuộc tính     | Chi tiết                                                                                                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**      | User nhập sai thông tin dinh dưỡng (nhầm khẩu phần, nhầm nguyên liệu) hoặc AI nhận diện sai → tính toán calo/macro sai → user đưa ra quyết định ăn uống sai                                               |
| **Xác suất**   | Cao — Hầu hết user không có kiến thức dinh dưỡng chuyên sâu                                                                                                                                               |
| **Tác động**   | Cao — Vi phạm Product Principle #1 (Evidence-based) và #2 (Accuracy). User mất niềm tin → bỏ app                                                                                                          |
| **Giảm thiểu** | (1) AI nhận diện luôn có bước preview + edit trước khi lưu. (2) Cảnh báo khi giá trị bất thường (VD: 1 quả trứng 500 calo). (3) Database nguyên liệu mẫu có sẵn (đã kiểm chứng). (4) Cho phép sửa mọi lúc |

#### ⚠️ Rủi ro 2: Ghi log workout không chính xác (MEDIUM)

| Thuộc tính     | Chi tiết                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Mô tả**      | User ghi sai set, rep, khối lượng tập → thống kê tiến trình sai → mất động lực                                                                                     |
| **Xác suất**   | Trung bình — PT (Anh) sẽ ghi đúng, user thường dễ nhầm                                                                                                             |
| **Tác động**   | Trung bình — Ảnh hưởng đến Job 5 (xem tiến trình)                                                                                                                  |
| **Giảm thiểu** | (1) Pre-fill từ lần tập trước (VD: "Lần trước bạn bench 60kg × 8 rep"). (2) Cảnh báo giá trị bất thường (VD: Squat 500kg). (3) Cho phép sửa/xóa log bất cứ lúc nào |

#### ⚠️ Rủi ro 3: Dashboard không trực quan (MEDIUM)

| Thuộc tính     | Chi tiết                                                                                                                                                                                                                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mô tả**      | User nhìn Dashboard nhưng không hiểu các con số có ý nghĩa gì → không thấy giá trị → bỏ app                                                                                                                                                                                              |
| **Xác suất**   | Trung bình — Persona tech level 2/5 (Minh) sẽ gặp khó                                                                                                                                                                                                                                    |
| **Tác động**   | Cao — Dashboard là nơi user thấy GIÁ TRỊ app mang lại. Nếu không hiểu = không thấy giá trị = churn                                                                                                                                                                                       |
| **Giảm thiểu** | (1) Thiết kế "glanceable" — nhìn 2 giây hiểu ngay (dùng màu sắc, icon, progress bar thay vì số). (2) Giải thích ngắn dưới mỗi số (VD: "1704 kcal — Cơ thể bạn đốt bấy nhiêu khi nghỉ ngơi"). (3) AI Insights bằng ngôn ngữ tự nhiên ("Hôm nay bạn ăn tốt rồi, còn 200 calo cho bữa tối") |

#### ⚠️ Rủi ro 4: Bus Factor = 1 — Solo Developer (HIGH)

| Thuộc tính     | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Mô tả**      | Dự án chỉ có 1 developer duy nhất. Nếu developer không thể tiếp tục (bệnh, chuyển việc, mất motivation) → dự án dừng hoàn toàn. Không có knowledge transfer, code review peer, hoặc backup.                                                                                                                                                                                                                                                                        |
| **Xác suất**   | Cao — Thống kê cho thấy >60% solo side-project bị abandon trong 6 tháng đầu (nguồn: GitHub Octoverse 2024)                                                                                                                                                                                                                                                                                                                                                         |
| **Tác động**   | Rất Cao — Toàn bộ sản phẩm dừng, user mất app, data có thể mất nếu không backup                                                                                                                                                                                                                                                                                                                                                                                    |
| **Giảm thiểu** | (1) **Modular codebase**: Architecture tách biệt — contributor mới có thể hiểu từng module độc lập. (2) **Comprehensive docs**: 6-group documentation (chính là bộ docs đang xây). (3) **Open-source ready**: Code structure chuẩn, CI/CD, tests 100% → contributor có thể fork/PR. (4) **Google Drive backup**: Data user an toàn ngay cả khi app dừng phát triển. (5) **Scope control**: V1 giữ nhỏ (9 MUST features) → ship nhanh, validate sớm, tránh burn-out |

### Ma trận rủi ro tổng hợp

```
Tác động ↑
   Rất  │                              R4: Bus Factor = 1
   Cao  │                              ─────────────────
        │                              Xác suất: CAO
        │
   Cao  │  R1: Sai dinh dưỡng     R3: Dashboard khó hiểu
        │  ────────────────────    ─────────────────────
        │  Xác suất: CAO           Xác suất: TRUNG BÌNH
        │
   TB   │  R2: Sai workout
        │  ─────────────────
        │  Xác suất: TRUNG BÌNH
        │
   Thấp │
        └──────────────────────────────────────────────→
          Thấp          Trung bình          Cao     Xác suất
```

---

## 11. Mô hình kinh doanh

### Mô hình: 100% Miễn phí (Passion Project)

| Thuộc tính          | Chi tiết                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Loại**            | Free Forever — Không có paywall, không subscription, không ads                                                                                          |
| **Lý do**           | (1) Giải quyết vấn đề thực tế cho cộng đồng Việt Nam. (2) Loại bỏ rào cản lớn nhất của đối thủ (MFP $79.99/năm). (3) Passion project của solo developer |
| **Doanh thu**       | Không có — Chi phí duy nhất là thời gian phát triển + hosting API AI (Google Gemini API)                                                                |
| **Tác động đến UI** | Không paywall, không premium badge, không upsell, không "bạn đã hết lượt dùng AI"                                                                       |
| **Bền vững**        | Chi phí API AI thấp ở quy mô nhỏ (xem bảng chi phí bên dưới). Nếu user base lớn → xem xét sponsor/donation model                                        |

### Chi phí API AI — Projection theo user scale

> Nguồn: [Google Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing) (04/2026), [CostGoat Gemini Calculator](https://costgoat.com/pricing/gemini-api)

**Giả định**: Mỗi user active dùng AI trung bình 3 lần/ngày (nhận diện ảnh + tra cứu + gợi ý). Model: Gemini 2.5 Flash-Lite — tối ưu chi phí cho mobile use case.

| Scale (DAU) | AI requests/tháng | Chi phí ước tính/tháng | Chi phí/user/tháng |
| :---------: | :---------------: | :--------------------: | :----------------: |
|     100     |       9,000       |    ~$0 (free tier)     |         $0         |
|    1,000    |      90,000       |          ~$27          |       $0.027       |
|   10,000    |      900,000      |         ~$270          |       $0.027       |
|   100,000   |     9,000,000     |        ~$2,700         |       $0.027       |

> **Free tier**: Gemini cung cấp 1,500 requests/ngày miễn phí = đủ cho ~130 DAU mà không tốn chi phí.

### Plan B — Sustainability khi vượt free tier

| Trigger              | Hành động                                                                       |
| -------------------- | ------------------------------------------------------------------------------- |
| > 130 DAU            | Chi trả từ quỹ cá nhân (~$27/tháng cho 1K DAU — chấp nhận được)                 |
| > 10K DAU            | Mở **voluntary donation** (Ko-fi/Buy Me a Coffee) — KHÔNG paywall               |
| > 50K DAU            | Tìm **sponsor** (gym chains, health brands) — banner "Sponsored by X"           |
| > 100K DAU           | Evaluate: **Gemini caching** giảm 50% cost + **rate limit** AI/user/ngày        |
| Chi phí > $500/tháng | **Fallback**: Switch sang local AI model (Gemma 3n on-device) cho basic queries |

> **Nguyên tắc bất biến**: KHÔNG BAO GIỜ thêm paywall, subscription, hoặc premium tier. Revenue = donation/sponsor, KHÔNG phải từ user.

### Ý nghĩa cho Designer

> **KHÔNG thiết kế**: Màn hình pricing, premium badge, paywall gate, subscription flow, ads placement.
>
> **CÓ thiết kế**: Toàn bộ tính năng accessible cho tất cả user từ ngày đầu.

---

## 12. Thị trường mục tiêu

### Phạm vi địa lý

**Chỉ Việt Nam** — Giai đoạn V1 tập trung 100% vào thị trường Việt Nam. Đông Nam Á và quốc tế là mục tiêu dài hạn (V3+).

### Đối tượng mục tiêu

| Thuộc tính    | Chi tiết                                                              |
| ------------- | --------------------------------------------------------------------- |
| **Độ tuổi**   | 16-45 tuổi                                                            |
| **Giới tính** | Nam + Nữ (không phân biệt)                                            |
| **Thu nhập**  | Không giới hạn (app miễn phí)                                         |
| **Thiết bị**  | Android (tầm trung → cao cấp)                                         |
| **Hành vi**   | Quan tâm đến sức khỏe, muốn kiểm soát cân nặng, có hoặc không tập gym |

### Ước tính quy mô thị trường (TAM / SAM / SOM)

> Nguồn: [DataReportal Digital 2025 Vietnam](https://datareportal.com/reports/digital-2025-vietnam), [BlueWeave Vietnam Fitness App Market](https://www.blueweaveconsulting.com/report/vietnam-fitness-app-market), [Statista Vietnam Smartphone](https://www.statista.com/topics/9168/smartphone-market-in-vietnam/), [Start.io Vietnam Demographics](https://www.start.io/audience/smartphone-users-in-vietnam)

| Cấp                   |      Quy mô       | Cách tính                                                                                                                |
| --------------------- | :---------------: | ------------------------------------------------------------------------------------------------------------------------ |
| **TAM** (Total)       |  ~55 triệu người  | Dân số VN 16-45 tuổi sở hữu smartphone. VN có ~78M smartphone users (DataReportal 2025), ~70% trong 16-45 ≈ 55M          |
| **SAM** (Serviceable) | ~8-12 triệu người | Trong đó, người CHỦ ĐỘNG quan tâm sức khỏe/fitness. VN fitness market growth 15%/yr (BlueWeave). ~15-20% của TAM ≈ 8-12M |
| **SOM** (Obtainable)  |  100K-300K người  | Mục tiêu thực tế 2-3 năm cho solo dev app. Top health app VN trên CH Play đạt ~500K installs. Target: 20-60% of that     |

> **Thận trọng**: SOM cũ ghi "1 triệu" — con số đó chỉ khả thi nếu có marketing budget + team. Solo dev realistic target = 100K-300K installs trong 2-3 năm với organic growth (CH Play SEO + community).

### Kênh tiếp cận (Go-to-market)

| Kênh                              | Ưu tiên |  Chi phí  |
| --------------------------------- | :-----: | :-------: |
| CH Play (organic search)          |   P0    | Miễn phí  |
| Cộng đồng fitness Facebook/TikTok |   P1    | Thời gian |
| Word-of-mouth từ PT/gym           |   P1    | Miễn phí  |
| Review từ tech YouTuber Việt      |   P2    |    Tùy    |

---

## Phụ lục

### A. Tài liệu liên quan

| Document                             | Mục đích                              |    Trạng thái    |
| ------------------------------------ | ------------------------------------- | :--------------: |
| `docs/2-requirements/prd.md`         | Yêu cầu sản phẩm chi tiết (BM output) |  📝 Chờ BM tạo   |
| `docs/3-design/design-handoff.md`    | Handoff thiết kế cho Developer        | 📝 Chờ Designer  |
| `docs/4-architecture/sad.md`         | Kiến trúc hệ thống (Tech Leader)      | 📝 Chờ Tech Lead |
| `docs/5-development/coding-guide.md` | Quy tắc code & conventions            |  📝 Chờ Dev tạo  |

> Các tài liệu trên sẽ được tạo theo pipeline: CEO (done) → BM → Designer → Tech Leader → Dev → QA

### B. Lịch sử thay đổi

| Ngày       | Phiên bản | Thay đổi                                                                                                                                               |
| ---------- | :-------: | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-04-12 |    1.0    | Tạo mới từ CEO Q&A session — 12 mục đầy đủ                                                                                                             |
| 2026-04-12 |    1.1    | CEO Review: Merge persona Minh+Khanh, thay KPIs privacy-compliant, thêm R4 bus factor, API cost projection, TAM/SAM/SOM citations, offline feature map |

---

> **Smart Meal Planner** — Ăn đúng. Tập đúng. Sống khỏe. 🇻🇳
