# Product Vision — HealthMate AI

**Version:** 1.1  
**Date:** 2026-04-15  
**Status:** Active

---

## 1. Tầm nhìn sản phẩm

### Vision Statement

> **HealthMate AI** là huấn luyện viên sức khỏe cá nhân trong túi bạn — ứng dụng duy nhất kết hợp AI thông minh để tự động lên kế hoạch ăn uống, thiết kế lịch tập luyện, và điều chỉnh theo tiến độ thực tế của bạn mỗi ngày.

### Elevator Pitch

HealthMate AI giúp người Việt Nam từ 16-45 tuổi đạt mục tiêu sức khỏe (giảm cân, tăng cơ, duy trì, tăng sức mạnh) mà không cần kiến thức chuyên môn. Khác với MyFitnessPal hay Samsung Health — HealthMate AI không chỉ **theo dõi** mà còn **chủ động hướng dẫn**: AI lên thực đơn tuần, lên lịch tập, nhận xét hàng ngày, và tự điều chỉnh plan khi bạn chệch mục tiêu. Miễn phí 100%, chụp ảnh đĩa cơm là xong.

### 3 Trụ cột

| Trụ cột | Mô tả | AI Coach làm gì |
|---------|-------|------------------|
| 🍽️ **Dinh dưỡng** | Theo dõi calo, protein, macro hàng ngày | AI lên thực đơn tuần, nhận diện ảnh thức ăn, gợi ý khi ăn thiếu/thừa |
| 💪 **Tập luyện** | Kế hoạch workout cá nhân hóa, ghi log bài tập | AI lên lịch tập (PPL/Upper-Lower/Full Body), điều chỉnh theo tiến độ |
| 🤖 **AI Coach** | Huấn luyện viên cá nhân 24/7 | Nhận xét hàng ngày, điều chỉnh plan tự động, gợi ý dựa trên dữ liệu thực tế |

---

## 2. Vấn đề cần giải quyết

### 6 Pain Points

| # | Vấn đề | Mức độ | Giải pháp HealthMate AI |
|---|--------|:------:|------------------------|
| P1 | **Không biết hôm nay ăn gì** — muốn giảm/tăng cân nhưng không biết cần bao nhiêu calo | ⭐⭐⭐⭐⭐ | AI tự lên thực đơn tuần theo mục tiêu |
| P2 | **Nhập liệu dinh dưỡng mất thời gian** — tra từng nguyên liệu, tính khẩu phần | ⭐⭐⭐⭐⭐ | Chụp ảnh → AI nhận diện → log tự động |
| P3 | **Không biết món Việt có bao nhiêu calo** — phở, bún chả không có trong database nước ngoài | ⭐⭐⭐⭐ | Database món Việt + AI tra cứu dinh dưỡng |
| P4 | **Đến gym không biết tập gì** — không có kế hoạch, tập xong quên ghi | ⭐⭐⭐⭐ | AI lên lịch tập cá nhân hóa + workout logger |
| P5 | **App hiện tại quá phức tạp hoặc quá đắt** — MFP $79.99/năm, Samsung Health thiếu tính năng | ⭐⭐⭐ | Miễn phí 100%, đơn giản, thiết kế cho người Việt |
| P6 | **Không thấy tiến trình** — tập 1 tháng mà không biết có tiến bộ không | ⭐⭐⭐ | Dashboard + AI nhận xét hàng ngày + progress charts |

### Giải pháp cốt lõi

> App không chỉ **tracking** mà còn **coaching** — AI chủ động lên plan, nhận xét, và điều chỉnh. Người dùng chỉ cần mở app, làm theo, và thấy kết quả.

---

## 3. User Personas

### Persona 1: Minh — "Người giảm cân bận rộn"

| Thuộc tính | Chi tiết |
|------------|----------|
| **Tuổi / Giới** | 28 tuổi, Nam |
| **Nghề nghiệp** | Nhân viên văn phòng, làm 9-6 |
| **Mục tiêu** | Giảm 5kg trong 3 tháng |
| **Pain chính** | Không có thời gian tính calo, không biết ăn gì cho đúng |
| **Kỳ vọng** | Mở app → thấy hôm nay ăn gì, không cần suy nghĩ |
| **Quote** | _"Tôi chỉ muốn ai đó nói cho tôi hôm nay ăn gì và tập gì, tôi làm theo thôi"_ |

### Persona 2: Vy — "Sinh viên mới tập gym"

| Thuộc tính | Chi tiết |
|------------|----------|
| **Tuổi / Giới** | 21 tuổi, Nữ |
| **Nghề nghiệp** | Sinh viên |
| **Mục tiêu** | Tăng cơ, giảm mỡ, body đẹp |
| **Pain chính** | Mới tập gym, không biết gì về dinh dưỡng và training program |
| **Kỳ vọng** | App dạy từ đầu: ăn gì, tập gì, bao nhiêu set/rep |
| **Quote** | _"Mình không đủ tiền thuê PT, cần một app như PT trong điện thoại"_ |

### Persona 3: Hùng — "Gym-goer nghiêm túc"

| Thuộc tính | Chi tiết |
|------------|----------|
| **Tuổi / Giới** | 32 tuổi, Nam |
| **Nghề nghiệp** | Kỹ sư phần mềm |
| **Mục tiêu** | Tăng sức mạnh (bench press 100kg), duy trì 12% body fat |
| **Pain chính** | Đã biết tập, nhưng cần track progressive overload và macro chính xác |
| **Kỳ vọng** | Workout logger nhanh, biểu đồ tiến trình, AI điều chỉnh khi plateau |
| **Quote** | _"Tôi cần data, không cần tutorial. Cho tôi biểu đồ và AI phân tích"_ |

### Persona 4: Lan — "Beginner muốn sống khỏe"

| Thuộc tính | Chi tiết |
|------------|----------|
| **Tuổi / Giới** | 40 tuổi, Nữ |
| **Nghề nghiệp** | Nội trợ / kinh doanh nhỏ |
| **Mục tiêu** | Duy trì sức khỏe, ăn uống cân bằng |
| **Pain chính** | Không biết gì về calo, protein, chỉ muốn app đơn giản |
| **Kỳ vọng** | Chụp ảnh bữa ăn → app nói "tốt" hay "cần thêm rau" |
| **Quote** | _"Tôi chỉ muốn biết bữa ăn của mình có tốt không, đừng cho tôi con số"_ |

---

## 4. Nguyên tắc sản phẩm

| # | Nguyên tắc | Giải thích |
|---|-----------|------------|
| 1 | **AI-first, không phải form-first** | Mọi thao tác phức tạp (lên plan, tính macro) do AI xử lý. User chỉ cần confirm |
| 2 | **10 giây, không phải 5 phút** | Mọi tương tác hàng ngày phải hoàn thành trong < 10 giây |
| 3 | **Chủ động, không phải thụ động** | App chủ động gợi ý, nhắc nhở, điều chỉnh — không đợi user hỏi |
| 4 | **Đơn giản cho beginner, mạnh cho pro** | Beginner thấy gợi ý đơn giản, pro thấy data chi tiết |
| 5 | **Local-first, AI khi cần** | Data lưu local. Chỉ gọi Gemini khi user dùng tính năng AI |
| 6 | **Miễn phí mãi mãi** | Không paywall, không quảng cáo, không subscription |

---

## 5. Điểm khác biệt cạnh tranh

### So với đối thủ

| Tính năng | MyFitnessPal | Samsung Health | HealthMate AI |
|-----------|:------------:|:--------------:|:-------------:|
| Tracking dinh dưỡng | ✅ | ✅ (cơ bản) | ✅ |
| Món Việt Nam | ❌ (<20%) | ❌ | ✅ (AI tra cứu) |
| AI nhận diện ảnh | ✅ (Premium) | ❌ | ✅ (Gemini) |
| **AI lên plan ăn tuần** | ❌ | ❌ | ✅ |
| **AI lên lịch tập** | ❌ | ❌ | ✅ |
| **AI điều chỉnh theo tiến độ** | ❌ | ❌ | ✅ |
| **AI nhận xét hàng ngày** | ❌ | ❌ | ✅ |
| Workout logger | ❌ | ✅ (cơ bản) | ✅ (chi tiết) |
| Progress charts | ✅ | ✅ | ✅ |
| Giá | $79.99/năm | Free (hạn chế) | **Free 100%** |
| Offline | ❌ | ✅ | ✅ (local-first) |

### Unique Value Proposition

> **"Huấn luyện viên AI miễn phí cho người Việt"** — App duy nhất tự động lên plan ăn + tập, điều chỉnh hàng ngày theo tiến độ thực tế, hiểu món Việt, và hoàn toàn miễn phí.

---

## 6. Scope V1 — Features

### V1 Features (13 features — build hết rồi release)

**Nhóm 1: Core Nutrition**

| ID | Feature | Mô tả |
|----|---------|-------|
| F-01 | Thư viện Nguyên liệu | Supporting library cho nguyên liệu với dinh dưỡng per 100g/100ml; tạo/sửa khi phục vụ món ăn |
| F-02 | Quản lý Món ăn | Flow chính: CRUD món ăn ingredient-based, tạo nhanh nguyên liệu khi thiếu, AI auto-fill |
| F-03 | Calendar & Meal Planning | Lịch ăn tuần/ngày, thêm món vào bữa, AI lên plan ngày/tuần |
| F-04 | Nutrition Tracking | Tổng calo, protein, carbs, fat, fiber hàng ngày |

**Nhóm 2: AI Features**

| ID | Feature | Mô tả |
|----|---------|-------|
| F-05 | AI Image Analysis | Chụp ảnh đĩa cơm → AI nhận diện món + dinh dưỡng |
| F-06 | AI Menu Suggestions | AI gợi ý món ăn phù hợp mục tiêu calo |
| F-07 | AI Daily Insights | AI nhận xét hàng ngày (ăn thừa/thiếu gì, gợi ý điều chỉnh) |

**Nhóm 3: Fitness**

| ID | Feature | Mô tả |
|----|---------|-------|
| F-08 | Training Plan System | Chọn program (PPL/Upper-Lower/Full Body), xem lịch tập |
| F-09 | Workout Logger | Ghi log set/rep/weight tại gym (guided + free mode) |
| F-10 | Progress Charts | Biểu đồ tiến trình (cân nặng, sức mạnh, volume) |
| F-11 | AI Training Plan | AI tự lên lịch tập dựa trên mục tiêu và level |

**Nhóm 4: App Shell**

| ID | Feature | Mô tả |
|----|---------|-------|
| F-12 | Dashboard | Feed card stack: AI card, Nutrition, Workout, Streak+Weight, Quick Actions |
| F-13 | Settings | Profile & Goals, 4 push notifications (toggleable), Light/Dark/System theme |

### Navigation

4 tabs + Settings icon trên toolbar:

| Tab | Feature |
|-----|---------|
| 🏠 Dashboard | F-12 |
| 📅 Calendar | F-03, F-04 |
| 🍳 Quản lý | F-01, F-02 |
| 💪 Fitness | F-08, F-09, F-10, F-11 |
| ⚙️ Settings (toolbar icon) | F-13 |

### Onboarding Flow

```
Mở app lần đầu
  → Bước 1: Chọn mục tiêu (Giảm cân / Tăng cơ / Duy trì / Performance)
  → Bước 2: Nhập thông tin cơ bản (chiều cao, cân nặng, tuổi, giới tính)
  → Vào app — AI bắt đầu gợi ý dần dần
```

### Mục tiêu hỗ trợ

| Mục tiêu | Chiến lược AI |
|----------|--------------|
| **Giảm cân** | Calorie deficit, ưu tiên protein cao, cardio + weight training |
| **Tăng cơ** | Calorie surplus, protein 1.6-2.2g/kg, progressive overload |
| **Duy trì** | Calorie maintenance, balanced macro, general fitness |
| **Performance** | Periodization, strength focus, macro timing |

---

## 7. Tech Stack

| Layer | Công nghệ | Version |
|-------|-----------|---------|
| UI Framework | Angular | 21 |
| UI Components | Ionic | 8 |
| Language | TypeScript | 5.9, strict mode |
| Native Wrapper | Capacitor | 8.3 |
| Database | SQLite (local) | sql.js + @capacitor-community/sqlite |
| State Management | Angular Signals | built-in |
| AI | Google Gemini API | paid tier |
| Runtime | Node.js 22 LTS + Java 21 LTS | — |
| Platform | Android only | API 36 (min 24) |

> **Chi tiết:** xem [architecture.md §1 Tech Stack](../4-architecture/architecture.md)

---

## 8. Chỉ số thành công (KPIs)

| KPI | Mục tiêu | Cách đo |
|-----|---------|---------|
| Daily Active Users (DAU) | 100 trong 3 tháng đầu | Analytics |
| Retention D7 | > 30% | User quay lại sau 7 ngày |
| Thời gian nhập liệu trung bình | < 10 giây/bữa | Measure in-app |
| Play Store rating | > 4.0 | Store reviews |
| AI accuracy (nhận diện ảnh) | > 80% | User feedback |

---

## 9. Rủi ro

| Rủi ro | Mức độ | Giảm thiểu |
|--------|:------:|------------|
| Gemini API cost cao khi scale | Trung bình | Monitor usage, rate limiting, cache responses |
| AI accuracy thấp với món Việt | Cao | Fine-tune prompts, cho user sửa kết quả AI |
| Scope V1 quá lớn (13 features) | Cao | Chia internal milestones, focus core trước |
| Performance WebView (Capacitor) | Trung bình | Ionic optimization, lazy loading, native plugins |
| Solo developer burnout | Trung bình | Không deadline cứng, side project pace |

---

## 10. Mô hình kinh doanh

**Free 100%** — không paywall, không quảng cáo, không subscription.

Chi phí duy nhất: **Gemini API** (developer tự chịu).

Mục tiêu hiện tại: **xây portfolio + học hỏi + tạo sản phẩm có giá trị thực**.

---

## 11. Data Privacy

- Tất cả dữ liệu người dùng lưu **local trên device** (SQLite)
- Dữ liệu chỉ được gửi lên **Google Gemini API** khi user **chủ động** dùng tính năng AI
- Không thu thập, không tracking, không bán data
- Không yêu cầu đăng nhập / tạo tài khoản
