# AI Strategy — HealthMate AI

**Version:** 1.0  
**Date:** 2026-04-15  
**Status:** Active

---

## 1. Tổng quan

HealthMate AI sử dụng **Google Gemini API** để cung cấp **9 prompt templates** (Image Analysis, Dish Auto-fill, Ingredient Lookup, Menu Suggest, Day Plan, Week Plan, Daily Insight, Weekly Review, Training Plan) phục vụ **7 features** (F-01, F-02, F-03, F-05, F-06, F-07, F-11). Tất cả AI features đều optional — app hoạt động 100% offline cho tracking cơ bản. F-06 (Menu Suggest) và F-11 (Training Plan) không có offline fallback — khi offline sẽ disable button + banner.

### Model

| Config | Value |
|--------|-------|
| Default model | `gemini-2.0-flash` |
| Khi upgrade | Đổi sang stable mới nhất khi có GA (VD: `gemini-2.5-flash` khi thành stable) |
| Rule | **Chỉ dùng model Stable (GA), KHÔNG dùng Preview cho production** |

### Prompt Architecture

```
┌─────────────────────────────────────┐
│ System Instruction (shared)         │
│ - Persona: HealthMate AI Coach      │
│ - Language: Vietnamese              │
│ - Tone: theo user level             │
│ - Rules: behavior rules             │
│ - Output format: JSON               │
└─────────────────────────────────────┘
            +
┌─────────────────────────────────────┐
│ User Prompt (per feature)           │
│ - Context: user profile, targets    │
│ - Data: specific to feature         │
│ - Task: instruction cho feature     │
│ - Schema: expected JSON output      │
└─────────────────────────────────────┘
```

**Lý do:** Gemini cache system instruction → nhanh hơn, rẻ hơn cho repeated calls. Tách biệt instruction vs data rõ ràng.

---

## 2. System Instruction

Shared cho tất cả AI features. Inject `{user_level}` và `{user_goal}` từ user_profile.

```
Bạn là HealthMate AI Coach — huấn luyện viên sức khỏe cá nhân cho người Việt Nam.

RULES:
1. Luôn trả lời bằng tiếng Việt tự nhiên, đời thường. Được dùng thuật ngữ gym phổ biến (set, rep, PR).
2. Luôn trả lời bằng JSON valid theo schema được yêu cầu. Không trả text, markdown, hay HTML.
3. Không phán xét user. Khi user ăn thừa/bỏ tập, khuyến khích nhẹ nhàng, không guilt-trip.
4. Không đưa lời khuyên y tế. Nếu liên quan sức khỏe, gợi ý "hỏi bác sĩ".
5. Khi không chắc chắn, set confidence thấp và nói rõ "không chắc chắn".

TONE theo level:
- beginner: Friendly — emoji nhiều, giải thích đơn giản, ít số liệu, dạy concept
- intermediate: Coach — khuyến khích, năng động, calo cụ thể, gợi ý rõ ràng
- advanced: Expert — data-driven, con số, phân tích xu hướng, không tutorial

User hiện tại:
- Level: {user_level}
- Goal: {user_goal}
```

---

## 3. AI Features — Prompt Templates

### 3.1 AI Image Analysis (F-05)

**Trigger:** User chụp ảnh bữa ăn

**Input:**
- Ảnh (base64/URI, resize max 1024px)
- User context: `goal`, `target_calories`
- Meal type: auto-detect theo giờ hoặc user chọn
- DB ingredient names: danh sách tên nguyên liệu trong DB (để match)

**Prompt:**
```
Nhận diện tất cả món ăn trong ảnh này.

Bữa ăn: {meal_type}
Mục tiêu user: {target_calories} kcal/ngày

Danh sách nguyên liệu trong database (ưu tiên match):
{db_ingredient_names}

Trả JSON theo schema:
{
  "dishes": [
    {
      "name": string,          // Tên món tiếng Việt
      "ingredients": [
        {
          "name": string,      // Tên nguyên liệu (match DB nếu có)
          "amount_value": number,
          "unit_id": string,
          "display_unit": string,   // Ví dụ: "g", "ml", "quả", "muỗng canh"
          "is_in_db": boolean  // true nếu match được với DB
        }
      ],
      "total_calories": number,
      "total_protein": number,
      "total_carbs": number,
      "total_fat": number,
      "confidence": number     // 0.0-1.0
    }
  ],
  "meal_comment": string       // Nhận xét ngắn theo tone {user_level}
}

Nếu ảnh mờ hoặc không rõ, vẫn trả best-guess với confidence thấp.
Nếu không phải đồ ăn, trả dishes: [].
```

**Post-processing:**
1. Lấy ingredient names từ response
2. Match với DB local (tìm theo tên, fuzzy match)
3. Nếu match: dùng nutrition data từ DB (chính xác hơn)
4. Nếu không match: hỏi user "Lưu nguyên liệu mới X?"
5. Tạo dish (type: `ai_autofill`) + dish_ingredient
6. User review → sửa nếu sai → Confirm → Lưu vào planned_dish

---

### 3.2 AI Dish Auto-fill (F-02)

**Trigger:** User nhập tên món → bấm 🤖 AI Auto-fill

**Input:**
- Tên món: user input
- DB ingredient names: danh sách nguyên liệu trong DB

**Prompt:**
```
Cho món "{dish_name}", liệt kê nguyên liệu thông dụng và số lượng cho 1 phần ăn.

Danh sách nguyên liệu trong database (ưu tiên match):
{db_ingredient_names}

Trả JSON:
{
  "dish_name": string,
  "servings": 1,
  "ingredients": [
    {
      "name": string,          // Ưu tiên match DB
      "amount_value": number,
      "unit_id": string,
      "display_unit": string,  // Ví dụ: "g", "ml", "quả", "muỗng canh"
      "is_in_db": boolean
    }
  ]
}
```

**Post-processing:** Tương tự Image Analysis — match DB → hỏi user ingredient mới → tạo dish (`type = 'ai_autofill'`, `source = 'ai'`) + dish_ingredient rows.

> **Lưu ý kiến trúc (RULE-DISH-TOTAL-04):** AI auto-fill **CHỈ** trả về danh sách ingredient + amount. App **không bao giờ** persist total nutrition do AI tự sinh ra. Total nutrition của dish được tính derived từ `dish_with_totals` VIEW dựa trên ingredient nutrition canonical trong DB (tham khảo `docs/4-architecture/business-rules.md`). Nếu prompt tương lai có trường `total_*` thì phải bị strip khi lưu.

---

### 3.3 AI Menu Suggestions (F-06)

**Trigger:** User mở Calendar → thêm món → bấm 🤖 Gợi ý AI

**Input:**
- Calories remaining: `target - consumed`
- Protein remaining: `target - consumed`
- Meal type: `breakfast/lunch/dinner/snack`
- DB dishes (names + nutrition): danh sách món user đã lưu

**Prompt:**
```
Gợi ý 3-5 món ăn phù hợp cho bữa {meal_type}.

Calo còn lại hôm nay: {remaining_calories} kcal
Protein còn lại: {remaining_protein}g

Danh sách món đã lưu (CHỈ chọn từ danh sách này):
{db_dishes_with_nutrition}

Trả JSON:
{
  "suggestions": [
    {
      "dish_id": string,       // ID từ danh sách
      "dish_name": string,
      "calories": number,
      "protein": number,
      "reason": string         // Lý do gợi ý (ngắn gọn, theo tone {user_level})
    }
  ]
}

Nếu DB ít món, gợi ý thêm tên món mới kèm note "Bạn chưa có món này trong app".
```

---

### 3.4 AI Meal Plan Day (F-03)

**Trigger:** Calendar → Day View → bấm "🤖 AI chọn món hôm nay"

**Input:**
- User profile: targets (calories, protein)
- DB dishes with nutrition
- Date context (nếu đã log bữa nào rồi)

**Prompt:**
```
Lên kế hoạch ăn 3 bữa (sáng/trưa/tối) cho ngày {date}.

Mục tiêu:
- Calo: {target_calories} kcal
- Protein: {target_protein}g

{already_logged ? "Đã log hôm nay: " + logged_meals : "Chưa log bữa nào."}

Danh sách món đã lưu (CHỈ chọn từ danh sách này):
{db_dishes_with_nutrition}

Trả JSON:
{
  "date": "{date}",
  "meals": {
    "breakfast": {
      "dishes": [{ "dish_id": string, "servings": number }],
      "total_calories": number,
      "total_protein": number
    },
    "lunch": { ... },
    "dinner": { ... }
  },
  "day_total": { "calories": number, "protein": number },
  "note": string  // Nhận xét ngắn theo tone {user_level}
}

Tổng calo các bữa phải gần khớp target (±5%).
Ưu tiên đa dạng, không lặp món trong ngày.
```

---

### 3.5 AI Meal Plan Week (F-03)

**Trigger:** Calendar → Week View → bấm "🤖 AI lên plan cả tuần"

**Input:** Tương tự Day Plan, nhưng cho 7 ngày.

**Prompt:**
```
Lên kế hoạch ăn 7 ngày (từ {start_date} đến {end_date}).
Mỗi ngày 3 bữa (sáng/trưa/tối).

Mục tiêu mỗi ngày:
- Calo: {target_calories} kcal
- Protein: {target_protein}g

Danh sách món đã lưu (CHỈ chọn từ danh sách này):
{db_dishes_with_nutrition}

Trả JSON:
{
  "days": [
    {
      "date": string,
      "meals": { "breakfast": {...}, "lunch": {...}, "dinner": {...} },
      "day_total": { "calories": number, "protein": number }
    }
  ],
  "week_note": string  // Nhận xét tổng tuần
}

Rules:
- Mỗi ngày tổng calo gần khớp target (±5%)
- Đa dạng: không lặp bữa trưa liên tiếp 2 ngày
- Xen kẽ thịt/cá/trứng đậu qua các ngày
```

---

### 3.6 AI Daily Insights (F-07)

**Trigger:** Tự động cuối ngày (khi user mở app buổi tối) hoặc push notification 21:00

**Input:**
- User level + goal
- Day data: meals logged, macros actual vs target
- Workout data: completed or not, volume
- Streak: nutrition + workout

**Prompt:**
```
Tổng kết ngày hôm nay cho user.

User: {user_level} | Goal: {user_goal}
Dinh dưỡng:
- Calo: {actual_cal}/{target_cal} ({percent}%)
- Protein: {actual_pro}/{target_pro}g ({percent}%)
- Bữa đã log: {meals_logged}

Tập luyện:
- {workout_completed ? training_day_name + ", volume: " + volume + "kg" : "Không tập hôm nay"}

Streak: 🍽️ {nutrition_streak} ngày | 🏋️ {workout_streak} buổi

Trả JSON:
{
  "summary": string,       // Nhận xét tổng hợp (2-3 câu, theo tone {user_level})
  "highlights": [string],  // Tags: "calo_on_track", "protein_low", "workout_done", etc.
  "suggestions": [string]  // 1-2 gợi ý cụ thể cho ngày mai
}
```

---

### 3.7 AI Weekly Review (F-07)

**Trigger:** Chủ nhật tối (push notification)

**Input:**
- 7 ngày data: avg macros, workout sessions, weight log
- Goal progress

**Prompt:**
```
Tổng kết tuần cho user.

User: {user_level} | Goal: {user_goal}
Tuần {start_date} → {end_date}:

Dinh dưỡng trung bình:
- Calo: {avg_cal}/{target_cal} ({percent}%)
- Protein: {avg_pro}/{target_pro}g ({percent}%)
- Số ngày log đầy đủ: {days_logged}/7

Tập luyện:
- Buổi tập: {workouts_completed}/{planned_workouts}
- Total volume tuần: {total_volume}kg ({volume_change})

Cân nặng:
- Đầu tuần: {weight_start}kg → Cuối tuần: {weight_end}kg ({weight_change})

Trả JSON:
{
  "summary": string,           // Tổng kết ngắn gọn
  "adjustments": [string],     // Điều chỉnh cho tuần tới (1-3 items)
  "motivation": string         // Câu động viên + progress toward goal
}
```

---

### 3.8 AI Training Plan (F-11)

**Trigger:** Fitness tab → "Tạo plan mới" → "🤖 AI tạo plan"

**Input:**
- User level, goal, preferred frequency
- Available equipment (user chọn)
- DB exercises list

**Prompt:**
```
Tạo lịch tập cá nhân hóa.

User:
- Level: {user_level}
- Goal: {user_goal}
- Tập {frequency} ngày/tuần
- Thiết bị: {equipment_list}

Danh sách bài tập (CHỈ chọn từ danh sách này):
{db_exercises_with_info}

Trả JSON:
{
  "plan_name": string,
  "type": "full_body" | "upper_lower" | "ppl" | "ai_custom",
  "frequency": number,
  "description": string,
  "days": [
    {
      "day_of_week": number,   // 0=CN, 1=T2...6=T7
      "name": string,          // "Push Day", "Upper Body A"
      "is_rest_day": boolean,
      "exercises": [
        {
          "exercise_id": string,
          "sets": number,
          "reps_min": number,
          "reps_max": number,
          "rest_seconds": number,
          "notes": string      // Tips ngắn
        }
      ]
    }
  ]
}

Rules:
- Beginner: Full Body hoặc Upper/Lower, ít bài compound
- Intermediate: Upper/Lower hoặc PPL, progressive overload focus
- Advanced: PPL hoặc custom split, volume optimization
- Mỗi muscle group tập ít nhất 2x/tuần (frequency đủ)
- Ưu tiên compound trước, isolation sau
```

---

### 3.9 AI Ingredient Lookup (F-01)

**Trigger:** User vào Management tab → "Thêm nguyên liệu" → nhập tên → bấm 🤖 AI Lookup

**Input:**
- Tên nguyên liệu: user input (VD "ức gà", "gạo trắng")
- Locale: `vi-VN` (ưu tiên định danh tiếng Việt + unit mặc định tự nhiên)

**Prompt:**
```
Tra cứu thông tin dinh dưỡng canonical cho nguyên liệu "{ingredient_name}".

Rules về basis:
- Nguyên liệu rắn: trả nutrition theo `100g`
- Nguyên liệu lỏng: trả nutrition theo `100ml`
- Mỗi ingredient chỉ có 1 nutrition basis authoritative
- AI phải trả danh sách `units[]` có thể nhập cho ingredient
- Nếu có unit khác dimension với basis:
  - ưu tiên factor curated trong `ingredient_unit`
  - nếu không có thì mới dùng `density_g_per_ml`
  - nếu vẫn không có thì không được bịa; loại unit đó khỏi output hoặc giảm confidence
- Unit ước lượng (`pinch`, `bunch`, ...) được phép nếu có factor rõ ràng; phải gắn cờ approximate

Trả JSON:
{
  "name": string,              // Chuẩn hóa tên tiếng Việt
  "category": string,          // Ví dụ: "Thịt", "Ngũ cốc", "Trứng & Sữa"
  "nutrition_basis_unit": "g" | "ml",
  "nutrition_basis_quantity": 100,
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "density_g_per_ml": number | null,
  "units": [
    {
      "unit_id": string,
      "display_label": string | null,
      "factor_to_basis": number,
      "is_default": boolean,
      "is_approximate": boolean
    }
  ],
  "confidence": "high" | "medium" | "low",  // Độ tin cậy của AI
  "note": string               // Ghi chú nếu cần (VD: "đã nấu chín", "raw")
}

Rules:
- Nếu tên mơ hồ (VD "thịt") → confidence: "low" + note yêu cầu rõ
- Phase 1 ưu tiên USDA làm nutrition authority chính ở mức ingredient-level
- Nguồn phụ tiếng Việt chỉ dùng để hỗ trợ naming/alias hoặc fill gap sau khi review thủ công
- Không được bịa `density_g_per_ml` hoặc `factor_to_basis`
- Nếu không xác định chắc conversion cho một unit → bỏ unit đó khỏi `units[]` hoặc hạ confidence
- KHÔNG được bịa số — nếu không chắc, confidence: "low"
```

**Post-processing:**
1. Hiển thị kết quả AI với icon confidence
2. Nếu `confidence: "low"` → highlight + khuyến khích user verify
3. **Duplicate check:** So khớp tên ingredient AI trả về với DB hiện có. Nếu trùng/gần giống → cảnh báo "đã tồn tại" + cho user chọn: cập nhật ingredient cũ hoặc tạo mới
4. User có thể sửa tất cả fields trước khi lưu
5. Confirm → insert vào `ingredient` table với `source: 'ai'` (hoặc update ingredient cũ nếu user chọn cập nhật)
6. Log vào `ai_chat_log` với `feature: 'ingredient_lookup'`
7. **Source lifecycle:** Nếu user sửa một AI-lookup ingredient sau này (`source = 'ai'`), record đó flip sang `source = 'manual'` — nhất quán với logic seed (`db → manual`)

---

## 4. Cost Optimization

### 4.1 Ước tính cost

| User type | AI calls/tháng | Estimated cost |
|-----------|---------------:|---------------:|
| Light (Lan) | ~40 | ~$0.01 |
| Active (Minh) | ~120 | ~$0.03 |
| Power (Hùng) | ~180 | ~$0.04 |

**100 users ≈ $3/tháng, 1000 users ≈ $30/tháng.**

### 4.2 Strategies

| Strategy | Mô tả | Impact |
|----------|-------|--------|
| **System instruction caching** | Gemini tự cache → giảm input tokens repeated calls | ~10-15% |
| **Response caching** | Cache kết quả AI cho cùng input (VD: dish auto-fill "Phở bò" → cache 24h trong ai_chat_log) | ~20-30% |
| **DB context pruning** | Chỉ gửi top 50 dishes/ingredients phù hợp thay vì toàn bộ DB | ~30-40% input |
| **Structured JSON output** | Yêu cầu JSON ngắn gọn, không paragraphs dài | ~20% output |
| **Image resize** | Resize ảnh max 1024px trước khi gửi | ~50% image tokens |

### 4.3 Rate Limiting

**V1 strategy (theo Decision D3):**
- **Không áp dụng per-call throttling UX** — user không bị chặn khi click AI
- **Internal quota limit per user/day** (soft limit trong code) để bảo vệ dev key khỏi abuse — ví dụ: 50 requests/day/install
- Khi đạt limit: hiển thị toast "Đã đạt giới hạn AI hôm nay, thử lại ngày mai" + disable AI buttons

### 4.4 API Key Management (theo Decision D3)

**Strategy V1: Developer key ship trong APK**
- Dev key bundle trong app (obfuscate — không plain text trong source)
- User KHÔNG cần nhập API key (không có Settings UI cho API key trong V1)
- Trade-off: key có thể bị extract khỏi APK → cần quota limit (4.3) để chống abuse
- V2+ có thể cho user nhập key riêng để bỏ quota

**Rules:**
- Không commit plain key vào git (dùng env var tại build time + obfuscation)
- Không gửi key lên bất kỳ server nào ngoài Gemini API endpoint
- Storage: key không lưu trong DB — read từ bundle config tại runtime

---

## 5. Error Handling

### 5.1 Error Types & Response

| Error | Xử lý | UI |
|-------|-------|-----|
| Network offline | Không gọi AI, disable AI buttons | Toast: "Cần kết nối mạng để dùng AI" |
| API timeout (>15s) | Retry 1 lần | Toast: "AI đang bận, thử lại sau" |
| API error (500, 503) | Retry 1 lần, exponential backoff | Toast: "Lỗi server AI, thử lại sau" |
| Rate limit (429) | Không retry, hiện cooldown | Toast: "Đã đạt giới hạn, thử lại sau X phút" |
| Invalid API key | Log lỗi + disable AI features trong phiên đó (V1 không có Settings UI cho API key — xem §4.4) | Alert: "Lỗi cấu hình AI, vui lòng cập nhật app" |
| JSON parse error | Retry 1 lần | Toast: "AI trả kết quả lạ, đang thử lại..." |
| Image too large | Auto resize max 1024px | Tự động, user không thấy |
| Empty response | Hiện fallback | Toast: "AI không có gợi ý, hãy thử lại" |

### 5.2 Retry Strategy

```
Attempt 1: Gọi API
  → Success → return
  → Fail → wait 1s → Attempt 2
    → Success → return
    → Fail → Show error toast
      → User có thể bấm "Thử lại" (manual retry, unlimited)
```

### 5.3 Offline Fallback

| Feature | Offline behavior |
|---------|-----------------|
| Image Analysis | ❌ Disabled |
| Dish Auto-fill | ❌ Disabled |
| Menu Suggestions | ❌ Disabled |
| Meal Plan Day/Week | ❌ Disabled |
| Daily Insights | ⚠️ Hiện data thô, không AI comment |
| Weekly Review | ⚠️ Hiện data thô, không AI comment |
| AI Training Plan | ❌ Disabled |
| Workout Logger | ✅ 100% local |
| Dashboard | ✅ Hiện data, ẩn AI card |
| Calendar & Tracking | ✅ 100% local |

---

## 6. AI Behavior Rules

### Rule 1: Tone theo User Level

| Level | Tone | Emoji | Số liệu | Ví dụ |
|-------|------|:-----:|---------|-------|
| Beginner | Friendly — dạy concept | Nhiều | Ít (%, đánh giá) | "Bữa trưa tốt lắm! 👍 Thêm chút rau nha" |
| Intermediate | Coach — khuyến khích | Vừa | Vừa (kcal, g) | "520 kcal, còn 680 cho tối. Gợi ý: Cá hồi + rau" |
| Advanced | Expert — data-driven | Ít | Nhiều (macro, volume, 1RM) | "Protein 142/150g. Volume Push +8%. 1RM ~92kg" |

### Rule 2: Không phán xét

```
❌ "Bạn ăn quá nhiều, cần kiểm soát"
❌ "Hôm nay bạn đã bỏ cuộc"
❌ "Bạn thiếu kỷ luật"
✅ "Hôm nay hơi vượt 200 kcal, không sao! Mai giảm bớt cơm trưa là cân bằng"
✅ "Lâu rồi chưa tập, muốn bắt đầu lại không?"
✅ "Không sao, ngày mai quay lại plan nhé"
```

### Rule 3: Không lời khuyên y tế

```
❌ "Bạn nên bổ sung vitamin D"
❌ "Triệu chứng này có thể là..."
❌ "Bạn nên ngừng ăn gluten"
✅ "Nếu có vấn đề sức khỏe, hãy hỏi bác sĩ nhé"
```

### Rule 4: Tiếng Việt tự nhiên

- Tiếng Việt 100%
- Thuật ngữ gym phổ biến OK: set, rep, PR, 1RM, PPL, progressive overload
- Ngôn ngữ đời thường, không academic
- Emoji phù hợp context (Beginner nhiều, Advanced ít)

### Rule 5: Luôn trả JSON valid

- System instruction enforce JSON-only response
- Schema rõ ràng cho từng feature
- Nếu không chắc chắn → set `confidence` thấp

### Rule 6: Privacy

- Không gửi user ID, tên, hay personal info lên Gemini
- Chỉ gửi data cần thiết: targets, meals, macros, exercise logs
- Log prompt/response chỉ ở local `ai_chat_log`
- Không tracking, không analytics bên ngoài

---

## 7. Implementation Architecture

### Service Layer

```
GeminiService (core)
  ├─ buildSystemInstruction(userProfile)
  ├─ generateContent(prompt, options)
  ├─ generateContentWithImage(image, prompt, options)
  └─ parseJsonResponse<T>(response, schema)

NutritionAiService (strategy)
  ├─ lookupIngredient(name)                              [F-01 — Phase 1.5]
  ├─ autofillDish(dishName, dbIngredients)               [F-02 — Phase 1.5]
  ├─ planDay(date, targets, dbDishes)                    [F-03 — Phase 2]
  ├─ planWeek(startDate, targets, dbDishes)              [F-03 — Phase 2]
  ├─ analyzeImage(image, mealType, dbIngredients)        [F-05 — Phase 5]
  └─ suggestMenu(remaining, mealType, dbDishes)          [F-06 — Phase 5]

FitnessAiService (strategy)
  └─ generateTrainingPlan(profile, frequency, equipment, dbExercises)   [F-11 — Phase 5]

InsightAiService (strategy)
  ├─ dailyInsight(dayData, profile)                                     [F-07 — Phase 5]
  └─ weeklyReview(weekData, profile)                                    [F-07 — Phase 5]
```

### Flow Diagram

```
Component → AI Strategy Service → GeminiService → Gemini API
                                       ↓
                                  ai_chat_log (local)
                                       ↓
                              Parse JSON → Match DB → Return typed result
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-15 | Initial AI Strategy — model, prompts, cost, error handling, behavior rules |
| 1.1 | 2026-04-18 | §1 clarify "8 templates / 6 features", §4.3 internal quota limit thay Rate Limit, §4.4 Developer key ship trong APK (D3) |
| 1.2 | 2026-04-18 | Thêm §3.9 AI Ingredient Lookup (F-01) → "9 templates / 7 features". §5.1 Invalid API key không còn redirect Settings. §7 Service Layer: thêm `lookupIngredient` + đánh dấu phase mapping cho mỗi method |
