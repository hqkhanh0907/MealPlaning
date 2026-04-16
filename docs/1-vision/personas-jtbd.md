# User Personas & Jobs-to-be-Done — HealthMate AI

**Version:** 1.0  
**Date:** 2026-04-13  
**Status:** Active

---

## 1. Personas tổng quan

| Persona | Tên | Mục tiêu | AI Coach tone | Level |
|---------|-----|----------|---------------|-------|
| P1 | Minh | Giảm cân | Coach (khuyến khích) | Intermediate |
| P2 | Vy | Tăng cơ | Friendly (thân thiện, dạy từ đầu) | Beginner |
| P3 | Hùng | Performance | Expert (data, phân tích) | Advanced |
| P4 | Lan | Duy trì | Friendly (đơn giản, dễ hiểu) | Beginner |

---

## 2. Chi tiết Personas

### Persona 1: Minh — "Người giảm cân bận rộn"

| Thuộc tính | Chi tiết |
|------------|----------|
| **Tuổi / Giới** | 28 tuổi, Nam |
| **Nghề nghiệp** | Nhân viên văn phòng, 9-6 |
| **Thiết bị** | Android tầm trung-cao |
| **Mục tiêu** | Giảm 5kg trong 3 tháng (calorie deficit) |
| **Pain** | Không có thời gian tính calo, không biết ăn gì cho đúng |
| **Kỳ vọng** | Mở app → thấy hôm nay ăn gì, không cần suy nghĩ |
| **Tech savvy** | 3/5 — dùng app quen nhưng không thích phức tạp |
| **Quote** | _"Tôi chỉ muốn ai đó nói cho tôi hôm nay ăn gì và tập gì, tôi làm theo thôi"_ |

**AI Coach behavior với Minh:**
- Tone: Coach — khuyến khích, năng động
- Mức chi tiết: Trung bình — hiện calo + gợi ý cụ thể
- Ví dụ: _"Tốt lắm Minh! Bữa trưa 520 kcal, còn 680 kcal cho tối. Gợi ý: Salad gà 450 kcal"_
- Khi chệch mục tiêu: _"Hôm nay hơi vượt 200 kcal, không sao! Mai giảm bớt cơm trưa là cân bằng"_

---

### Persona 2: Vy — "Sinh viên mới tập gym"

| Thuộc tính | Chi tiết |
|------------|----------|
| **Tuổi / Giới** | 21 tuổi, Nữ |
| **Nghề nghiệp** | Sinh viên |
| **Thiết bị** | Android tầm trung |
| **Mục tiêu** | Tăng cơ, giảm mỡ, body đẹp |
| **Pain** | Mới tập gym, không biết gì về dinh dưỡng lẫn training |
| **Kỳ vọng** | App dạy từ đầu: ăn gì, tập gì, bao nhiêu set/rep |
| **Tech savvy** | 4/5 — Gen Z, quen dùng nhiều app |
| **Quote** | _"Mình không đủ tiền thuê PT, cần một app như PT trong điện thoại"_ |

**AI Coach behavior với Vy:**
- Tone: Friendly — thân thiện, giải thích từ đầu
- Mức chi tiết: Đơn giản — ít số, nhiều gợi ý dễ hiểu
- Ví dụ: _"Hôm nay là ngày tập chân nè! 🦵 Bắt đầu với Squat 3 set x 10 rep nhé. Nếu lần đầu thì bắt đầu với tạ nhẹ thôi"_
- Khi chệch mục tiêu: _"Hôm nay ăn hơi ít protein, thêm 1 quả trứng luộc buổi chiều nha!"_

---

### Persona 3: Hùng — "Gym-goer nghiêm túc"

| Thuộc tính | Chi tiết |
|------------|----------|
| **Tuổi / Giới** | 32 tuổi, Nam |
| **Nghề nghiệp** | Kỹ sư phần mềm |
| **Thiết bị** | Android flagship |
| **Mục tiêu** | Bench press 100kg, duy trì 12% body fat |
| **Pain** | Cần track progressive overload và macro chính xác |
| **Kỳ vọng** | Workout logger nhanh, biểu đồ, AI phân tích dữ liệu |
| **Tech savvy** | 5/5 — developer, muốn data chi tiết |
| **Quote** | _"Tôi cần data, không cần tutorial. Cho tôi biểu đồ và AI phân tích"_ |

**AI Coach behavior với Hùng:**
- Tone: Expert — chuyên môn, trung lập, data-driven
- Mức chi tiết: Cao — số liệu cụ thể, phân tích xu hướng
- Ví dụ: _"Tuần này total volume tăng 8% (Push: 12,400kg → 13,390kg). Bench 1RM ước tính: 92kg. Progressive overload đang on track"_
- Khi plateau: _"Volume Chest stagnant 3 tuần. Đề xuất: deload 1 tuần → tăng frequency lên 2x/tuần"_

---

### Persona 4: Lan — "Beginner muốn sống khỏe"

| Thuộc tính | Chi tiết |
|------------|----------|
| **Tuổi / Giới** | 40 tuổi, Nữ |
| **Nghề nghiệp** | Nội trợ / kinh doanh nhỏ |
| **Thiết bị** | Android tầm trung |
| **Mục tiêu** | Duy trì sức khỏe, ăn uống cân bằng |
| **Pain** | Không biết gì về calo/protein, chỉ muốn biết bữa ăn có tốt không |
| **Kỳ vọng** | Chụp ảnh → app nói "tốt" hay "cần thêm rau" |
| **Tech savvy** | 2/5 — chỉ dùng Zalo, Facebook |
| **Quote** | _"Tôi chỉ muốn biết bữa ăn của mình có tốt không, đừng cho tôi con số"_ |

**AI Coach behavior với Lan:**
- Tone: Friendly — đơn giản, dễ hiểu, không dùng thuật ngữ
- Mức chi tiết: Rất đơn giản — emoji + nhận xét ngắn, không hiện số nếu không cần
- Ví dụ: _"Bữa trưa tốt lắm! 👍 Có đủ rau, thịt, cơm. Buổi chiều nhớ uống đủ nước nhé"_
- Khi ăn thiếu: _"Hôm nay hơi ít rau xanh, bữa tối thêm rau luộc hoặc canh nha 🥬"_

---

## 3. Jobs-to-be-Done (JTBD)

### Job Map — Việc người dùng cần hoàn thành

| Job | Mô tả | Persona chính | Feature liên quan |
|-----|-------|:-------------:|-------------------|
| **J1** | Biết hôm nay ăn gì mà không cần suy nghĩ | Minh, Lan | AI Auto Meal Plan, Dashboard |
| **J2** | Log bữa ăn trong < 10 giây | Tất cả | AI Image Analysis, Confirm Plan |
| **J3** | Biết mình đang đúng hướng hay chệch mục tiêu | Tất cả | AI Daily Insights, Dashboard |
| **J4** | Biết hôm nay tập gì khi đến gym | Minh, Vy | AI Training Plan, Workout Logger |
| **J5** | Ghi log bài tập nhanh tại gym | Hùng, Vy | Workout Logger (guided + free) |
| **J6** | Thấy tiến trình sau 1 tuần / 1 tháng | Hùng, Minh | Progress Charts, AI Weekly Review |
| **J7** | Tự tin biết bữa ăn có "tốt" không | Lan | AI Daily Insights (simplified) |
| **J8** | Học dần về dinh dưỡng và tập luyện | Vy | AI Coach (educational tone) |

---

## 4. User Journey — Một ngày điển hình

### 4.1 Buổi sáng (7:00-8:00) — Xem plan

```
Mở app → Dashboard
  ├─ Card 1: "Hôm nay ăn gì" (plan bữa sáng/trưa/tối)
  ├─ Card 2: "Hôm nay tập gì" (Ngày Push — Chest + Shoulder + Triceps)
  ├─ Card 3: AI Morning Brief ("Chào buổi sáng! Hôm nay cần 1500 kcal, tập Push")
  └─ Calo còn lại: 1500/1500 kcal
```

**Push notification (7:30):** _"☀️ Plan hôm nay: Bữa sáng — Yến mạch + Chuối (350 kcal)"_

### 4.2 Sau bữa ăn (12:00, 19:00) — Log meal

```
Cách 1: Confirm plan
  Mở app → Calendar → Bữa trưa → "Đã ăn bữa này" ✓ (3 giây)

Cách 2: Chụp ảnh
  Mở app → Camera → Chụp ảnh đĩa cơm
    → AI nhận diện: "Cơm trắng 150g + Gà kho 200g + Canh rau"
    → User review + sửa nếu sai → Confirm → Saved (10 giây)
```

**Push notification (12:30):** _"🍚 Đã log bữa trưa chưa?"_

### 4.3 Tại gym (17:00-18:30) — Workout

```
Mode 1: Guided Workout
  Mở app → Fitness tab → "Bắt đầu buổi tập" 
    → Bài 1: Bench Press — 4 set x 8 rep x 60kg
    → Nhập weight thực tế → Next
    → Bài 2: Incline Dumbbell Press...
    → Done → AI: "Volume Push hôm nay: 5,200kg (+5% so tuần trước) 💪"

Mode 2: Free Logging
  Mở app → Fitness tab → "Log tự do"
    → Chọn bài tập → Nhập set/rep/weight → Save
```

### 4.4 Buổi tối (21:00) — Review & AI Insights

```
Mở app → Dashboard
  ├─ Calorie: 1380/1500 kcal ✅
  ├─ Protein: 95/120g ⚠️ (thiếu 25g)
  ├─ Workout: Completed ✅ — Push day done
  └─ AI Daily Summary:
     "Ngày tốt! Calo đạt 92%. Protein hơi thiếu — mai thêm 1 phần sữa 
      whey hoặc 2 quả trứng buổi sáng. Buổi tập Push volume tăng 5% 
      so tuần trước, keep it up! 🔥"
```

**Push notification (21:00):** _"📊 Tổng kết: 1380/1500 kcal, Protein 79%. Xem chi tiết"_

### 4.5 Cuối tuần — AI Weekly Review

```
Chủ nhật tối → Push notification: "📋 AI đã lên plan tuần mới"
Mở app → Dashboard → "Weekly Review":
  "Tuần này:
   - Calo trung bình: 1420/1500 (95%) ✅
   - Protein trung bình: 100/120g (83%) ⚠️ 
   - Workout: 4/5 buổi (bỏ 1 buổi thứ 4)
   - Cân nặng: 78.5kg → 78.2kg (-0.3kg)
   
   Điều chỉnh tuần tới:
   - Tăng protein nguồn: thêm Greek yogurt vào bữa phụ
   - Bù buổi tập bỏ: chuyển sang tập 4 ngày/tuần thay vì 5"
```

---

## 5. AI Coach — Behavior Matrix

### 5.1 Giọng điệu theo Level

| Level | Personas | Tone | Độ chi tiết | Ví dụ nhận xét |
|-------|----------|------|-------------|----------------|
| **Beginner** | Vy, Lan | Friendly, giải thích | Đơn giản, ít số, nhiều emoji | _"Bữa ăn tốt lắm! 👍 Thêm chút rau nha"_ |
| **Intermediate** | Minh | Coach, khuyến khích | Trung bình, calo + gợi ý | _"520 kcal, còn 680 cho tối. Gợi ý: Cá hồi + rau"_ |
| **Advanced** | Hùng | Expert, data-driven | Cao, macro + trends + phân tích | _"Protein 142/150g. Total volume Push +8%. 1RM Bench ước tính 92kg"_ |

### 5.2 AI Response khi lỗi / sai

| Tình huống | Hành vi AI |
|------------|-----------|
| Ảnh mờ / không rõ | Hiện kết quả best-guess + "⚠️ Không chắc chắn, hãy kiểm tra lại" + cho sửa |
| Món lạ AI không biết | Hỏi user: "Đây có phải là [gợi ý]?" + cho nhập thủ công |
| User bỏ meal plan | Không phán xét, gợi ý nhẹ: "Không sao! Ngày mai quay lại plan nhé" |
| User không tập nhiều ngày | Nhắc nhẹ, không guilt-trip: "Lâu rồi chưa tập, muốn bắt đầu lại không?" |
| Offline (không có mạng) | Dùng data local, tắt AI features, hiện thông báo rõ ràng |

### 5.3 Push Notifications

| Thời điểm | Nội dung | Có thể tắt |
|-----------|---------|:-----------:|
| Sáng (7:30) | Plan hôm nay (ăn gì + tập gì) | ✅ |
| Giữa ngày (12:30) | Nhắc log bữa trưa | ✅ |
| Tối (21:00) | Tổng kết ngày + AI nhận xét | ✅ |
| Chủ nhật | AI weekly review + plan tuần mới | ✅ |

Tất cả notifications đều **có thể tắt** trong Settings.

---

## 6. User Level Detection

### Onboarding xác định level

```
Bước 1: Chọn mục tiêu (Giảm cân / Tăng cơ / Duy trì / Performance)
Bước 2: Nhập thông tin (chiều cao, cân nặng, tuổi, giới tính)
  → Sub-question: "Bạn đã từng tập gym chưa?"
     □ Chưa bao giờ → Beginner
     □ Dưới 6 tháng → Beginner  
     □ 6 tháng - 2 năm → Intermediate
     □ Trên 2 năm → Advanced
```

### Level ảnh hưởng đến gì

| Aspect | Beginner | Intermediate | Advanced |
|--------|----------|-------------|----------|
| AI tone | Friendly | Coach | Expert |
| Số liệu hiển thị | Ít (emoji, %) | Vừa (kcal, g) | Nhiều (macro, volume, 1RM) |
| Training plan | Đơn giản (Full Body 3x/tuần) | Trung bình (Upper/Lower 4x) | Nâng cao (PPL 5-6x) |
| AI giải thích | Có (dạy concept) | Ngắn gọn | Không (chỉ data) |
| Dashboard cards | 2-3 cards đơn giản | 4 cards | 5+ cards chi tiết |
