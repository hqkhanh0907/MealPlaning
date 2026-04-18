# Product Requirements Document (PRD) — HealthMate AI

**Version:** 1.0  
**Date:** 2026-04-13  
**Status:** Active

---

## 1. Tổng quan

### Mục tiêu PRD

Tài liệu này mô tả chi tiết **13 features** của HealthMate AI V1, bao gồm yêu cầu chức năng, hành vi UI, và tiêu chí chấp nhận cho từng feature.

### Phạm vi V1

- **Platform:** Android only (Capacitor)
- **Stack:** Angular 20 + Ionic 8 + Capacitor 8
- **Database:** SQLite local-first
- **AI:** Google Gemini API (paid tier)
- **Ngôn ngữ:** Tiếng Việt only
- **Giá:** Free 100%
- **Release:** Build hết 13 features → release 1 lần

### Tham chiếu

- [Product Vision](../1-vision/product-vision.md)
- [Personas & JTBD](../1-vision/personas-jtbd.md)

---

## 2. Nhóm 1: Core Nutrition

### F-01: Quản lý Nguyên liệu

**Mô tả:** CRUD nguyên liệu với thông tin dinh dưỡng per 100g. Là nền tảng cho toàn bộ hệ thống tính calo.

**Chức năng chi tiết:**

| Chức năng | Mô tả |
|-----------|-------|
| **Xem danh sách** | Hiển thị tất cả nguyên liệu, hỗ trợ tìm kiếm, sắp xếp theo tên/nhóm |
| **Thêm thủ công** | Form nhập: tên, nhóm, calo, protein, carbs, fat, fiber per 100g |
| **Sửa** | Chỉnh sửa thông tin nguyên liệu đã thêm |
| **Xóa** | Xóa nguyên liệu (confirm dialog nếu đang dùng trong món ăn) |
| **AI Lookup** | Nhập tên nguyên liệu → AI tra cứu thông tin dinh dưỡng → user confirm |
| **Vietnamese Food DB** | Database sẵn các nguyên liệu phổ biến Việt Nam (gạo, thịt, rau...) |

**Dữ liệu nguyên liệu:**

```
Ingredient {
  id: string
  name: string                    // "Ức gà"
  group: string                   // "Thịt"
  calories_per_100g: number       // 165
  protein_per_100g: number        // 31
  carbs_per_100g: number          // 0
  fat_per_100g: number            // 3.6
  fiber_per_100g: number          // 0
  source: 'manual' | 'ai' | 'db' // Nguồn dữ liệu
  created_at: timestamp
  updated_at: timestamp
}
```

**Tiêu chí chấp nhận:**
- [ ] CRUD hoạt động đúng, data persist sau restart
- [ ] Tìm kiếm real-time theo tên
- [ ] AI lookup trả về kết quả và user có thể sửa trước khi lưu
- [ ] Vietnamese food DB có sẵn ≥ 100 nguyên liệu phổ biến

---

### F-02: Quản lý Món ăn

**Mô tả:** CRUD món ăn. Mỗi món gồm danh sách nguyên liệu (với khối lượng) → tự tính dinh dưỡng tổng. Hỗ trợ thêm nhanh và AI auto-fill nguyên liệu.

**3 cách thêm món:**

| Cách | Mô tả | Khi nào dùng |
|------|-------|-------------|
| **Ingredient-based** | Chọn nguyên liệu + nhập khối lượng (g) → tự tính nutrition | Muốn chính xác, tự chọn |
| **Quick Add** | Nhập trực tiếp tên + tổng calo/protein/carbs/fat | Muốn nhanh, không cần chi tiết |
| **🤖 AI Auto-fill** | Nhập tên món → bấm AI → AI trả về nguyên liệu + khối lượng thông dụng → User confirm | Muốn chính xác nhưng không biết nguyên liệu |

**AI Auto-fill Flow:**

```
1. User nhập tên món: "Phở bò"
2. Bấm nút 🤖 AI
3. AI trả về danh sách nguyên liệu thông dụng:
   ┌────────────────────────────┐
   │ 🍜 Phở bò                  │
   │                            │
   │ Nguyên liệu AI gợi ý:     │
   │ ☑ Bánh phở    200g  190kcal│
   │ ☑ Thịt bò     100g  250kcal│
   │ ☑ Giá đỗ      50g   15kcal │
   │ ☑ Hành lá     10g    3kcal │
   │ ☑ Nước dùng  300ml  30kcal │
   │────────────────────────────│
   │ Tổng: 488 kcal  |  28g pro │
   │                            │
   │ [Sửa] [✅ Lưu món + NL mới]│
   └────────────────────────────┘
4. User review: sửa khối lượng, bỏ/thêm nguyên liệu
5. Confirm → Lưu món
6. Nếu có nguyên liệu mới (chưa có trong DB):
   → Hỏi: "Lưu 3 nguyên liệu mới vào DB chung?"
   → User chọn lưu hoặc bỏ qua
```

**Dữ liệu món ăn:**

```
Dish {
  id: string
  name: string                       // "Cơm gà xối mỡ"
  description?: string
  type: 'ingredient-based' | 'quick'
  ingredients: DishIngredient[]      // Nếu ingredient-based
  total_calories: number             // Auto-calculated hoặc manual
  total_protein: number
  total_carbs: number
  total_fat: number
  total_fiber: number
  servings: number                   // Số phần ăn
  image_url?: string                 // Ảnh món ăn (optional)
  created_at: timestamp
}

DishIngredient {
  ingredient_id: string
  amount_grams: number               // 150g gạo, 200g ức gà...
}
```

**Tiêu chí chấp nhận:**
- [ ] Ingredient-based: chọn nguyên liệu, nhập khối lượng, tự tính tổng
- [ ] Quick add: nhập trực tiếp số liệu dinh dưỡng
- [ ] AI Auto-fill: nhập tên → AI trả về nguyên liệu → user confirm → lưu
- [ ] AI Auto-fill: nguyên liệu mới → hỏi user có lưu vào DB chung không
- [ ] Hiển thị tổng nutrition mỗi món
- [ ] Tìm kiếm món ăn theo tên

---

### F-03: Calendar & Meal Planning

**Mô tả:** Lịch ăn hỗ trợ 2 view: Week (tổng quan tuần) và Day (chi tiết ngày). Cho phép thêm món vào bữa sáng/trưa/tối/phụ. Tích hợp AI plan (thay thế F-07 cũ).

**Views:**

| View | Hiển thị | Interaction |
|------|---------|-------------|
| **Week View** | 7 ngày, mỗi ngày hiện tổng calo + màu (xanh=đạt, vàng=gần, đỏ=thiếu/thừa) | Tap ngày → chuyển Day View. Nút "🤖 AI lên plan cả tuần" |
| **Day View** | Chi tiết từng bữa (Sáng/Trưa/Tối/Phụ) + danh sách món + tổng nutrition | Thêm/xóa/sửa món. Nút "🤖 AI chọn món hôm nay" + "Thêm món thủ công" |

**AI Meal Planning (tích hợp trong Calendar):**

| Chế độ | Vị trí | Mô tả |
|--------|--------|-------|
| **AI plan 1 ngày** | Day View → nút "🤖 AI chọn món hôm nay" | AI chọn món cho 3-4 bữa sao cho tổng dinh dưỡng khớp mục tiêu |
| **AI plan cả tuần** | Week View → nút "🤖 AI lên plan cả tuần" | AI lên thực đơn 7 ngày, đa dạng, khớp mục tiêu mỗi ngày |

**AI chọn món — Nguồn dữ liệu (thứ tự ưu tiên):**
1. **Món ăn user đã lưu** — ưu tiên gợi ý từ thư viện của user
2. **Lịch sử ăn** — tránh lặp lại, đa dạng hóa
3. **AI bổ sung món mới** — nếu user chưa có đủ món, AI tự tạo món mới (ingredient-based, có đầy đủ nguyên liệu + dinh dưỡng)

**AI plan flow:**

```
1. User bấm "🤖 AI chọn món hôm nay" (Day View) hoặc "AI lên plan cả tuần" (Week View)
2. AI phân tích:
   - Mục tiêu calo/protein hàng ngày
   - Món ăn trong thư viện user
   - Lịch sử ăn (tránh lặp)
3. AI trả về plan → User review:
   - Xem từng bữa / từng ngày
   - Swap món nếu không thích
   - Confirm → Apply vào Calendar
4. Nếu AI bổ sung món mới → hỏi user "Lưu món mới vào thư viện?"
```

**Meal Slots (4 bữa):**

```
DayPlan {
  id: string
  date: string                    // "2026-04-13"
  meals: {
    breakfast: MealSlot
    lunch: MealSlot
    dinner: MealSlot
    snack: MealSlot
  }
  total_calories: number          // Auto-sum
  total_protein: number
  target_calories: number         // Từ user profile
  target_protein: number
}

MealSlot {
  dishes: PlannedDish[]
  total_calories: number
}

PlannedDish {
  dish_id: string
  servings: number                // Có thể ăn 0.5 hoặc 2 phần
  is_completed: boolean           // Đã ăn bữa này chưa
}
```

**Tiêu chí chấp nhận:**
- [ ] Week view hiện 7 ngày với color indicator
- [ ] Day view hiện 4 bữa với danh sách món
- [ ] Thêm món vào bữa từ danh sách món ăn
- [ ] Mark "Đã ăn" cho từng bữa (confirm plan trong ≤ 3 giây)
- [ ] Tổng calo/protein cập nhật real-time khi thêm/xóa món
- [ ] AI plan 1 ngày: chọn món cho 3-4 bữa, tổng dinh dưỡng ±10% mục tiêu
- [ ] AI plan cả tuần: 7 ngày hoàn chỉnh, đa dạng, protein ≥80% target
- [ ] AI ưu tiên món từ thư viện user, bổ sung món mới nếu không đủ
- [ ] User có thể swap từng món trước khi apply

---

### F-04: Nutrition Tracking & Display

**Mô tả:** Hiển thị tổng dinh dưỡng hàng ngày. Mặc định hiện Calo + Protein (gọn). Carbs & Fat ẩn sau "Xem chi tiết".

**Nguyên tắc hiển thị:**

| Level / Goal | Hiển thị mặc định | Xem chi tiết |
|---|---|---|
| **Beginner** | Calo (progress bar) | + Protein, Carbs, Fat |
| **Intermediate (Giảm cân)** | Calo + Protein | + Carbs, Fat, Fiber |
| **Intermediate (Tăng cơ)** | Calo + Protein | + Carbs, Fat, Fiber |
| **Advanced** | Calo + Protein + Carbs + Fat | + Fiber, chi tiết macro % |

**Smart Key Metric:**
- Giảm cân → Highlight **Calo** (deficit là quan trọng nhất)
- Tăng cơ → Highlight **Protein** (đủ protein là quan trọng nhất)
- Duy trì → Highlight **Calo** (cân bằng)
- Performance → Highlight **Protein** + **Calo**

**Cách hiển thị trên các màn hình:**

| Màn hình | Kiểu hiển thị |
|----------|--------------|
| **Dashboard** | Card với progress bar (Calo lớn + Protein nhỏ) |
| **Calendar Week** | Mỗi ngày = color indicator (xanh/vàng/đỏ) |
| **Calendar Day** | Chi tiết: bar + số liệu cho từng bữa + tổng ngày |

**Tiêu chí chấp nhận:**
- [ ] Mặc định hiện Calo + Protein (không overwhelm beginner)
- [ ] "Xem chi tiết" mở Carbs, Fat, Fiber
- [ ] Color coding: xanh ≥80% target, vàng 50-79%, đỏ <50% hoặc >120%
- [ ] Key metric highlight theo goal type

---

## 3. Nhóm 2: AI Features

### F-05: AI Image Analysis

**Mô tả:** Chụp 1 ảnh đĩa cơm → AI nhận diện món ăn + ước tính dinh dưỡng.

**Flow:**

```
1. User nhấn nút 📷 (Quick Action hoặc trong Calendar)
2. Mở camera → Chụp 1 ảnh
3. Gửi ảnh → Gemini Vision API
4. AI trả về:
   - Danh sách món nhận diện (VD: "Cơm trắng 150g, Gà kho 200g, Canh rau")
   - Ước tính dinh dưỡng mỗi món
   - Confidence score
5. User review:
   - Đúng → Confirm → Log vào bữa ăn
   - Sai → Sửa tên/khối lượng → Confirm
   - AI không chắc → Hiện "⚠️ Không chắc chắn, hãy kiểm tra lại"
```

**Xử lý edge cases:**

| Tình huống | Hành vi |
|-----------|--------|
| Ảnh mờ / tối | Best-guess + cảnh báo "⚠️ Ảnh không rõ" |
| Món lạ | Hỏi user: "Đây có phải [gợi ý]?" + cho nhập thủ công |
| Nhiều món 1 ảnh | Liệt kê tất cả món nhận diện được |
| Không có mạng | Thông báo "Cần kết nối mạng để dùng AI" |

**Tiêu chí chấp nhận:**
- [ ] Chụp ảnh → nhận diện trong ≤ 5 giây
- [ ] Accuracy ≥ 80% cho món Việt phổ biến
- [ ] User có thể sửa kết quả AI trước khi lưu
- [ ] Offline: thông báo rõ ràng, không crash

---

### F-06: AI Menu Suggestions

**Mô tả:** AI gợi ý món ăn phù hợp khi user đang chọn món cho 1 bữa cụ thể. Khác với AI plan trong F-03 (plan tự động ngày/tuần), F-06 là gợi ý theo ngữ cảnh khi user thêm món thủ công.

**Khi nào hiển thị:**
- User mở Calendar Day View → chọn 1 bữa (VD: bữa tối) → bấm "Thêm món"
- AI hiện gợi ý: "Bữa tối còn 680 kcal, gợi ý: Cá hồi + rau luộc (450 kcal)"
- User có thể chọn gợi ý hoặc tìm món thủ công

**Nguồn dữ liệu (thứ tự ưu tiên):**
1. **Món ăn user đã lưu** — ưu tiên từ thư viện
2. **Lịch sử ăn** — tránh lặp lại
3. **AI bổ sung** — nếu chưa đủ món phù hợp

**Tiêu chí chấp nhận:**
- [ ] Gợi ý phù hợp mục tiêu calo/protein còn lại trong ngày
- [ ] Ưu tiên món từ thư viện user
- [ ] User có thể accept/reject/sửa gợi ý
- [ ] Gợi ý hiện nhanh ≤ 3 giây

---

> **Note (lịch sử):** Trước đây từng có feature "AI Auto Meal Plan" với ID F-07 — đã được gộp trực tiếp vào F-03 Calendar & Meal Planning (xem mục "AI Meal Planning" trong F-03). ID F-07 hiện dùng cho AI Daily Insights bên dưới.

---

### F-07: AI Daily Insights

**Mô tả:** AI nhận xét hàng ngày — ăn thừa/thiếu gì, gợi ý điều chỉnh. Mức chi tiết thay đổi theo user level.

**Mức chi tiết theo level:**

| Level | Ví dụ AI Insight |
|-------|-----------------|
| **Beginner** | "Bữa ăn tốt lắm! 👍 Thêm chút rau nha" |
| **Intermediate** | "520 kcal bữa trưa, còn 680 kcal cho tối. Gợi ý: Cá hồi + rau" |
| **Advanced** | "Protein 142/150g. Carbs hơi thấp, thêm 50g cơm bữa tối. Total volume Push +8%" |

**Thời điểm hiển thị:**
- **Sau mỗi bữa log**: Nhận xét ngắn về bữa vừa ăn
- **Buổi tối (21:00)**: Tổng kết ngày
- **Cuối tuần**: Weekly review tổng hợp

**Tiêu chí chấp nhận:**
- [ ] Insight phù hợp với level user
- [ ] Tone đúng persona (Beginner=friendly, Intermediate=coach, Advanced=expert)
- [ ] Gợi ý cụ thể, actionable (không chung chung)
- [ ] Không phán xét khi user chệch plan

---

## 4. Nhóm 3: Fitness

### F-08: Training Plan System

**Mô tả:** Hệ thống training plan dựa trên nghiên cứu khoa học. 3 preset programs + AI custom plan.

**Programs (Evidence-based):**

| Program | Level | Frequency | Cơ sở khoa học |
|---------|-------|-----------|----------------|
| **Full Body** | Beginner | 3x/tuần | Schoenfeld 2016 — Beginner respond tốt với full body frequency |
| **Upper/Lower** | Intermediate | 4x/tuần | ACSM Guidelines — Split cho phép tăng volume mỗi nhóm cơ |
| **PPL** (Push/Pull/Legs) | Advanced | 5-6x/tuần | Schoenfeld 2019 — High frequency + high volume cho advanced |
| **AI Custom** | Tất cả | Tùy chỉnh | AI tạo plan dựa trên nguyên lý khoa học (periodization, progressive overload, volume landmarks) |

**PPL giải thích:**
- **Push Day:** Ngực + Vai + Triceps (Bench Press, Shoulder Press, Tricep Extension...)
- **Pull Day:** Lưng + Biceps (Deadlift, Row, Bicep Curl...)
- **Legs Day:** Chân + Mông (Squat, Leg Press, Lunge...)

**Dữ liệu Training Plan:**

```
TrainingPlan {
  id: string
  name: string                    // "PPL 6 ngày"
  type: 'full_body' | 'upper_lower' | 'ppl' | 'ai_custom'
  frequency: number               // Số ngày/tuần
  days: TrainingDay[]
  created_at: timestamp
}

TrainingDay {
  day_of_week: number             // 0=CN, 1=T2...
  name: string                    // "Push Day"
  exercises: PlannedExercise[]
}

PlannedExercise {
  exercise_id: string
  sets: number                    // 3-4 sets
  reps_min: number                // 8
  reps_max: number                // 12
  rest_seconds: number            // 90-120s
  notes?: string                  // "Tăng 2.5kg mỗi tuần"
}
```

**Tiêu chí chấp nhận:**
- [ ] 3 preset programs hoạt động đúng
- [ ] AI custom plan tuân thủ nguyên lý khoa học
- [ ] Hiển thị lịch tập trong tuần
- [ ] Mỗi bài tập có set/rep/rest rõ ràng
- [ ] Exercise database ≥ 50 bài tập phổ biến

---

### F-09: Workout Logger

**Mô tả:** Ghi log chi tiết buổi tập tại gym. Hỗ trợ guided mode (theo plan) và free mode (tập tự do).

**2 Mode:**

| Mode | Mô tả |
|------|-------|
| **Guided** | Theo training plan — hiện từng bài tập, user nhập weight thực tế |
| **Free** | Tự chọn bài tập, nhập set/rep/weight |

**Thông tin mỗi set:**

| Field | Bắt buộc | Mô tả |
|-------|:--------:|-------|
| Weight (kg) | ✅ | Trọng lượng tạ |
| Reps | ✅ | Số lần lặp |
| Rest timer | ✅ | Đếm ngược thời gian nghỉ (tự động bắt đầu sau mỗi set) |
| Effort emoji | Optional | 😊 Easy (RIR 4+) / 💪 Just Right (RIR 2-3) / 😤 Hard (RIR 1) / 🔥 Maxed (RIR 0) |
| Notes | Optional | Ghi chú tự do ("Đau vai", "Form chưa tốt"...) |

**Effort Emoji → RIR mapping (V1 simplified):**

| Emoji | Nghĩa | RIR tương đương | Khi nào dùng |
|-------|-------|:---:|---|
| 😊 | Dễ | 4+ | Còn sức nhiều, có thể thêm 4+ rep |
| 💪 | Vừa | 2-3 | Tốt, còn 2-3 rep trong tank |
| 😤 | Nặng | 1 | Gần max, chỉ còn 1 rep |
| 🔥 | Max | 0 | Không thể thêm rep nào |

**Dữ liệu Workout:**

```
WorkoutSession {
  id: string
  date: string
  training_day_name: string       // "Push Day"
  mode: 'guided' | 'free'
  exercises: WorkoutExercise[]
  duration_minutes: number        // Auto-track
  total_volume: number            // Auto-calculate (Σ weight × reps)
  started_at: timestamp
  completed_at: timestamp
}

WorkoutExercise {
  exercise_id: string
  sets: WorkoutSet[]
}

WorkoutSet {
  set_number: number
  weight_kg: number
  reps: number
  effort?: 'easy' | 'just_right' | 'hard' | 'maxed'
  rest_seconds: number
  notes?: string
}
```

**Tiêu chí chấp nhận:**
- [ ] Guided mode: hiện bài tập theo plan, nhập weight nhanh
- [ ] Free mode: chọn bài tập từ database
- [ ] Rest timer tự động đếm ngược
- [ ] Effort emoji optional (không bắt buộc)
- [ ] Auto-calculate total volume sau buổi tập
- [ ] Log nhanh ≤ 5 giây/set

---

### F-10: Progress Charts

**Mô tả:** Biểu đồ theo dõi tiến trình tập luyện. 4 metrics chính.

**4 Progress Metrics:**

| Metric | Công thức / Cách tính | Hiển thị |
|--------|----------------------|---------|
| **Est. 1RM** | Epley: `weight × (1 + reps/30)` | Line chart theo tuần, cho từng bài tập compound (Bench, Squat, Deadlift) |
| **Volume/Muscle Group** | `Σ(weight × reps)` nhóm theo Push/Pull/Legs | Bar chart so sánh tuần trước vs tuần này |
| **Workout Streak** | Số ngày liên tiếp hoàn thành buổi tập | Number + flame icon 🔥 |
| **Body Weight (Weekly Avg)** | Trung bình cân nặng 7 ngày gần nhất | Line chart xu hướng, giảm noise |

**Tiêu chí chấp nhận:**
- [ ] Est. 1RM chart chính xác theo Epley formula
- [ ] Volume chart so sánh tuần hiện tại vs tuần trước
- [ ] Streak cập nhật real-time
- [ ] Weight chart hiện weekly average (không daily noise)
- [ ] Charts responsive, smooth scroll

---

### F-11: AI Training Plan

**Mô tả:** AI tự lên lịch tập dựa trên mục tiêu, level, và data tập luyện thực tế. Tuân thủ nghiêm ngặt nguyên lý khoa học.

**Nguyên lý khoa học AI phải tuân thủ:**

| Nguyên lý | Nguồn | Áp dụng |
|-----------|-------|---------|
| **Progressive Overload** | Helms 2016 | Tăng dần weight/volume theo thời gian |
| **Volume Landmarks** | Schoenfeld 2019 | MEV → MRV cho mỗi nhóm cơ (10-20 sets/tuần) |
| **Frequency** | Schoenfeld 2016 | ≥ 2x/tuần mỗi nhóm cơ cho optimal |
| **RPE/Autoregulation** | Zourdos 2016 | Điều chỉnh intensity theo feedback effort |
| **Periodization** | ACSM | Mesocycle: Accumulation → Deload |
| **Deload Protocol** | Helms 2016 | Mỗi 4-6 tuần: giảm volume 40-60% |

**AI behavior:**

| Tình huống | AI hành động |
|-----------|-------------|
| User mới bắt đầu | Gợi ý Full Body 3x/tuần, weight nhẹ, focus form |
| Plateau 3+ tuần | Đề xuất deload → tăng frequency hoặc volume |
| User bỏ tập nhiều ngày | Nhắc nhẹ, không guilt-trip, gợi ý giảm volume khi quay lại |
| Effort luôn "Easy" | Gợi ý tăng weight |
| Effort luôn "Maxed" | Cảnh báo over-training, gợi ý giảm intensity |

**Tiêu chí chấp nhận:**
- [ ] AI plan tuân thủ volume landmarks (10-20 sets/muscle group/tuần)
- [ ] Progressive overload có trong plan (tăng weight/reps theo tuần)
- [ ] Deload tự động sau 4-6 tuần training
- [ ] AI điều chỉnh dựa trên effort emoji feedback
- [ ] Không tạo plan bừa bãi — mọi gợi ý đều có cơ sở khoa học

---

## 5. Nhóm 4: Dashboard & Settings

### F-12: Dashboard

**Mô tả:** Màn hình chính dạng **Feed Card Stack** — scroll dọc với các card riêng biệt.

**Card Stack (từ trên xuống dưới):**

| # | Card | Nội dung | Hiển thị |
|---|------|---------|---------|
| 1 | **AI Insight Card** | Nhận xét/gợi ý từ AI | **Chỉ khi cần** — ăn thiếu, bỏ tập, gợi ý quan trọng |
| 2 | **Nutrition Card** | Calo (progress bar lớn) + Protein (bar nhỏ) + "Xem chi tiết" | **Luôn hiện** |
| 3 | **Workout Card** | Ngày tập: tên + bài tập + nút "Bắt đầu". Ngày nghỉ: "Rest Day 😴" | **Luôn hiện** |
| 4 | **Streak + Weight Card** | 2 mini cards ngang: Nutrition streak 🍽️ + Workout streak 🏋️ + Cân nặng hiện tại | **Luôn hiện** |
| 5 | **Quick Actions** | 4 nút: 📷 Chụp ảnh, 🏋️ Log workout, ⚖️ Cân nặng, 🤖 Hỏi AI | **Luôn hiện** |

**Dashboard Layout (ASCII):**

```
┌──────────────────────────────┐
│ 🤖 Protein hơi thiếu hôm qua,│  ← Chỉ hiện khi cần
│ thêm trứng buổi sáng nha!   │
└──────────────────────────────┘
┌──────────────────────────────┐
│  🍽️ Dinh dưỡng hôm nay       │
│                              │
│  Calo                        │
│  █████████░░░░░  820/1500   │
│                     kcal     │
│  Protein                     │
│  █████░░░░░░░░░  65/120g    │
│                              │
│        [Xem chi tiết ▸]      │
└──────────────────────────────┘
┌──────────────────────────────┐
│  🏋️ Push Day                  │
│  Bench • Incline • Fly       │
│  4 bài tập • ~45 phút       │
│  [🚀 Bắt đầu tập]            │
└──────────────────────────────┘
┌─────────────┬────────────────┐
│ 🔥 Streak   │ ⚖️ Cân nặng    │
│ 5🍽️ 3🏋️    │ 78.2 kg       │
│             │ (-0.3 tuần)   │
└─────────────┴────────────────┘
┌──────────────────────────────┐
│ [📷 Chụp] [🏋️ Tập] [⚖️ Cân] [🤖 AI] │
└──────────────────────────────┘
```

**Streak types:**
- **Nutrition streak 🍽️:** Số ngày liên tiếp đạt mục tiêu calo (±10%)
- **Workout streak 🏋️:** Số ngày liên tiếp hoàn thành buổi tập theo plan

**Tiêu chí chấp nhận:**
- [ ] Feed scroll mượt ≥ 60fps
- [ ] AI card ẩn/hiện đúng logic
- [ ] Nutrition card cập nhật real-time khi log bữa ăn
- [ ] Workout card hiện đúng ngày tập/nghỉ
- [ ] Streak + Weight cập nhật chính xác
- [ ] Quick Actions navigate đúng destination

---

### F-13: Settings

**Mô tả:** Cài đặt profile, mục tiêu, notifications, và theme.

**3 phần Settings:**

#### 13.1 Profile & Goals

| Field | Mô tả | Sửa được |
|-------|-------|:--------:|
| Chiều cao (cm) | Dùng tính BMR/TDEE | ✅ |
| Cân nặng (kg) | Dùng tính mục tiêu calo | ✅ |
| Tuổi | Dùng tính BMR | ✅ |
| Giới tính | Dùng tính BMR | ✅ |
| Mục tiêu | Giảm cân / Tăng cơ / Duy trì / Performance | ✅ |
| Mục tiêu calo/ngày | AI tự tính từ TDEE, user có thể override | ✅ |
| Mục tiêu protein/ngày | AI tự tính, user có thể override | ✅ |
| Mục tiêu carbs/ngày (optional) | User có thể set để F-04 track; mặc định null | ⬜ |
| Mục tiêu fat/ngày (optional) | User có thể set để F-04 track; mặc định null | ⬜ |
| Level tập luyện | Beginner / Intermediate / Advanced | ✅ |

**TDEE Calculation:**
```
BMR (Mifflin-St Jeor):
  Nam: 10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
  Nữ: 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161

TDEE = BMR × Activity Factor
  Ít vận động: 1.2
  Nhẹ (1-3 ngày/tuần): 1.375
  Trung bình (3-5 ngày/tuần): 1.55
  Nặng (6-7 ngày/tuần): 1.725

Mục tiêu:
  Giảm cân: TDEE - 500 kcal
  Tăng cơ: TDEE + 300 kcal
  Duy trì: TDEE
  Performance: TDEE + 200 kcal (tùy phase)
```

#### 13.2 Push Notifications

| Notification | Thời gian | Mặc định | Tắt được |
|-------------|----------|:--------:|:--------:|
| 🌅 Plan hôm nay | 7:30 sáng | ✅ Bật | ✅ |
| 🍚 Nhắc log bữa trưa | 12:30 | ✅ Bật | ✅ |
| 📊 Tổng kết ngày | 21:00 | ✅ Bật | ✅ |
| 📋 Weekly review | Chủ nhật tối | ✅ Bật | ✅ |

#### 13.3 Theme

| Option | Mô tả |
|--------|-------|
| Light | Giao diện sáng |
| Dark | Giao diện tối |
| System | Theo cài đặt hệ thống Android |

**Tiêu chí chấp nhận:**
- [ ] Profile fields đúng và persist
- [ ] TDEE tự tính khi thay đổi thông tin cơ bản
- [ ] Mục tiêu calo/protein cập nhật khi đổi goal
- [ ] Mỗi notification có toggle bật/tắt riêng
- [ ] Theme chuyển đổi smooth, không flash

---

## 6. Onboarding Flow

**Mô tả:** 2 bước đơn giản khi mở app lần đầu. Không yêu cầu đăng nhập.

```
Bước 1: Chọn mục tiêu
  ┌─────────────────────────┐
  │  Mục tiêu của bạn?       │
  │                          │
  │  ○ 🏃 Giảm cân          │
  │  ○ 💪 Tăng cơ           │
  │  ○ ⚖️ Duy trì           │
  │  ○ 🏋️ Tăng sức mạnh    │
  └─────────────────────────┘

Bước 2: Thông tin cơ bản
  ┌─────────────────────────┐
  │  Chiều cao: [___] cm     │
  │  Cân nặng:  [___] kg     │
  │  Tuổi:      [___]        │
  │  Giới tính: [Nam/Nữ]     │
  │                          │
  │  Bạn đã tập gym chưa?   │
  │  ○ Chưa bao giờ          │  → Beginner
  │  ○ Dưới 6 tháng          │  → Beginner
  │  ○ 6 tháng - 2 năm       │  → Intermediate
  │  ○ Trên 2 năm            │  → Advanced
  └─────────────────────────┘

  → Vào app → AI bắt đầu gợi ý dần dần
```

**Tiêu chí chấp nhận:**
- [ ] 2 bước, hoàn thành ≤ 30 giây
- [ ] Không yêu cầu đăng nhập / tạo tài khoản
- [ ] Level auto-detect từ câu trả lời gym experience
- [ ] TDEE + mục tiêu calo tự tính ngay sau onboarding
- [ ] Redirect vào Dashboard sau khi xong

---

## 7. Cross-cutting Requirements

### 7.1 Offline Behavior

| Tính năng | Offline | Online |
|-----------|---------|--------|
| CRUD nguyên liệu/món | ✅ Hoạt động | ✅ Hoạt động |
| Calendar & Meal Planning | ✅ Hoạt động | ✅ Hoạt động |
| Workout Logger | ✅ Hoạt động | ✅ Hoạt động |
| Nutrition Tracking | ✅ Hoạt động | ✅ Hoạt động |
| AI Image Analysis | ❌ Cần mạng | ✅ |
| AI Menu Suggestions | ❌ Cần mạng | ✅ |
| AI Daily Insights | ❌ Cần mạng | ✅ |
| Push Notifications | ✅ Local triggers | ✅ |

### 7.2 Performance Targets

| Metric | Target |
|--------|--------|
| App launch → Dashboard | ≤ 2 giây |
| Log bữa ăn (confirm plan) | ≤ 3 giây |
| Log 1 set workout | ≤ 5 giây |
| AI Image response | ≤ 5 giây |
| Dashboard scroll | ≥ 60fps |
| APK size | ≤ 30MB |

### 7.3 Data Privacy

- Tất cả data lưu local trên device (SQLite)
- Chỉ gửi data lên Gemini API khi user chủ động dùng tính năng AI
- Không thu thập, không tracking, không bán data
- Không yêu cầu đăng nhập / tạo tài khoản

---

## 8. Feature Dependency Map

```
F-01 (Nguyên liệu) ──→ F-02 (Món ăn + AI Auto-fill) ──→ F-03 (Calendar + AI Plan)
                                                              │
                                                              ▼
                                                         F-04 (Nutrition) ──→ F-07 (AI Insights)
                                                              │
F-08 (Training Plan) ──→ F-09 (Workout) ──→ F-10 (Progress)
                              │
                              ▼
                         F-11 (AI Training)

F-05 (AI Image) ──→ F-02 (adds dishes from AI)
F-06 (AI Menu Suggestions) ──→ F-03 (gợi ý khi thêm món)

F-12 (Dashboard) ← reads from F-04 + F-09 + F-10
F-13 (Settings) ← affects F-04 targets + F-08 plans + F-07 AI tone
```

**Build Order (theo dependency):**
1. F-01 → F-02 → F-03 → F-04 (Core Nutrition)
2. F-08 → F-09 → F-10 (Core Fitness)
3. F-05 → F-06 → F-07 (AI Features)
4. F-11 (AI Training — depends on F-08 + F-09)
5. F-12 → F-13 (Dashboard & Settings)
