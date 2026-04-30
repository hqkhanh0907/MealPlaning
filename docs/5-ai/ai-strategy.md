# AI Strategy — HealthMate AI

**Version:** 1.3 (Phase 1.5B kickoff)  
**Date:** 2026-04-30  
**Status:** Active

> **Revision 1.4 (2026-04-30) — F-02 nutrition expansion (Q7-B).** §3.2 mở rộng JSON schema cho row `is_in_db=false`: thêm `category` + 5 `*_per_100g` + `confidence`. Phục vụ INSERT ingredient mới một round-trip mà không vi phạm RULE-DISH-TOTAL-04 (per-ingredient nutrition ≠ dish total). Xem `docs/5-development/phase-1.5b-ai-foundation.md` §2-bis (Q1-Q12 design decisions).
>
> **Revision 1.1 (2026-04-30) — Gram-only absolute.** Ba prompt template ingredient-level đã được rewrite: §3.1 (Image Analysis), §3.2 (Dish Auto-fill), §3.9 (Ingredient Lookup). Output chỉ chứa `gram_weight` cho ingredient amount và 5 macro per 100g cho nutrition. Không còn `unit_id`, `amount_value`, `display_unit`, `density_g_per_ml`, `factor_to_basis`, `units[]`, `nutrition_basis_unit`. Xem PRD §F-01 và `docs/4-architecture/business-rules.md` (RULE-DI-GRAM-01..05) để biết lý do.

---

## 1. Tổng quan

HealthMate AI sử dụng **Google Gemini API** để cung cấp **9 prompt templates** (Image Analysis, Dish Auto-fill, Ingredient Lookup, Menu Suggest, Day Plan, Week Plan, Daily Insight, Weekly Review, Training Plan) phục vụ **7 features** (F-01, F-02, F-03, F-05, F-06, F-07, F-11). Tất cả AI features đều optional — app hoạt động 100% offline cho tracking cơ bản. F-06 (Menu Suggest) và F-11 (Training Plan) không có offline fallback — khi offline sẽ disable button + banner.

### Model

| Config | Value |
|--------|-------|
| Default model | `gemini-2.5-flash` (chốt 2026-04-30 cho Phase 1.5B) |
| Khi upgrade | Đổi sang stable mới nhất khi có GA (VD: `gemini-3.0-flash` khi thành stable) |
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

**Prompt (gram-only revision):**
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
      "name": string,                  // Tên món tiếng Việt
      "ingredients": [
        {
          "name": string,              // Tên nguyên liệu (match DB nếu có)
          "gram_weight": number,       // Lượng GRAM ước tính (luôn là gram)
          "is_in_db": boolean          // true nếu match được với DB
        }
      ],
      "total_calories": number,        // Chỉ để preview, KHÔNG persist (xem RULE-DISH-TOTAL)
      "total_protein": number,
      "total_carbs": number,
      "total_fat": number,
      "confidence": number             // 0.0-1.0
    }
  ],
  "meal_comment": string               // Nhận xét ngắn theo tone {user_level}
}

Rules:
- Ước tính LUÔN bằng gram. Không trả unit khác (quả/cup/muỗng).
- Liquid (sữa, dầu, nước chấm): cũng quy về gram. Quy ước: 1 ml ≈ 1 g cho nước; sữa 1.03 g/ml; dầu 0.92 g/ml.
- Nếu ảnh mờ hoặc không rõ, vẫn trả best-guess với confidence thấp.
- Nếu không phải đồ ăn, trả dishes: [].
```

**Post-processing:**
1. Lấy ingredient names từ response
2. Match với DB local (tìm theo tên, fuzzy match)
3. Nếu match: dùng nutrition data từ DB (chính xác hơn). Total nutrition tính lại từ VIEW `dish_with_totals`.
4. Nếu không match: hỏi user "Lưu nguyên liệu mới X?"
5. Tạo dish (type: `ai_autofill`) + dish_ingredient (chỉ `gram_weight`)
6. User review → sửa nếu sai → Confirm → Lưu vào planned_dish

---

### 3.2 AI Dish Auto-fill (F-02)

**Trigger:** User nhập tên món → bấm 🤖 AI tự điền (Phase 1.5B Q1-A: nút trong form `dish-add`)

**Input:**
- Tên món: user input
- DB ingredient list: `[{id, name, category}]` (truyền nguyên list, AI tự match)

**Prompt (gram-only + Q7-B nutrition expansion, revision 1.2):**
```
Cho món "{dish_name}", liệt kê nguyên liệu thông dụng cho 1 phần ăn.

Danh sách nguyên liệu trong database (ưu tiên match):
{db_ingredient_list}    // dạng "id | name | category", một dòng/ingredient

Trả JSON theo schema:
{
  "dish_name": string,
  "servings": 1,
  "ingredients": [
    {
      "name": string,                       // Ưu tiên tên đúng như DB nếu match
      "gram_weight": number,                // Lượng GRAM (luôn là gram, 0.1–10000)
      "is_in_db": boolean,                  // true nếu match DB
      "matched_ingredient_id": string|null, // BẮT BUỘC khi is_in_db=true; lấy từ list

      // CHỈ trả 6 field dưới khi is_in_db=false (ingredient sẽ được tạo mới):
      "category": string|null,              // 'Thịt'|'Hải sản'|'Rau củ'|'Trái cây'|
                                            // 'Ngũ cốc'|'Sữa & trứng'|'Gia vị'|
                                            // 'Đồ uống'|'Khác'
      "calories_per_100g": number|null,     // kcal/100g (PER-INGREDIENT, không phải total)
      "protein_per_100g": number|null,      // g/100g
      "carbs_per_100g": number|null,
      "fat_per_100g": number|null,
      "fiber_per_100g": number|null,
      "confidence": "high"|"medium"|"low"|null   // độ tự tin số liệu nutrition
    }
  ]
}

Rules:
- LUÔN trả gram. Không có unit nào khác (không cup, không muỗng, không quả).
- Liquid quy về gram bằng quy ước 1 ml ≈ 1 g cho nước (sữa/dầu xấp xỉ).
- KHÔNG trả total nutrition của dish. App sẽ tính total derived từ
  dish_with_totals VIEW dựa trên gram_weight × ingredient nutrition canonical.
- Khi is_in_db=true: BỎ TRỐNG (null) toàn bộ 6 field nutrition + category;
  app sẽ dùng dữ liệu canonical từ DB qua matched_ingredient_id.
- Khi is_in_db=false: BẮT BUỘC điền đủ category + 5 nutrition + confidence
  (phục vụ INSERT ingredient mới).
- confidence='low' khi nguyên liệu lạ/khó tra cứu, để app cảnh báo user.
```

**Post-processing (Phase 1.5B §4.2 F-02 flow):**
1. Local fuzzy-match Q5-C (normalize + Levenshtein) cho row `is_in_db=false` để bắt case AI thiếu dấu / khác hoa thường khi DB đã có ingredient tương đương.
2. Cho user xem sheet, sửa gram, xóa/thêm row, edit nutrition row "+" (Q8-C).
3. Atomic transaction Q6-A: INSERT ingredient mới (`source='ai'`) → INSERT/UPDATE dish (`type='ai_autofill'`, `source='ai'`) → INSERT dish_ingredient (chỉ `gram_weight`).

> **Lưu ý kiến trúc (RULE-DISH-TOTAL-04 — không vi phạm):** Các field `*_per_100g` ở schema này là **nutrition canonical PER-INGREDIENT** (đơn vị /100g), được dùng để INSERT row mới vào bảng `ingredient` khi `is_in_db=false`. Đây KHÔNG phải total nutrition của dish. Total dish nutrition vẫn được tính derived từ `dish_with_totals` VIEW (gram_weight × per-100g) — không bao giờ persist từ AI. Nếu prompt tương lai có field `total_*` ở cấp dish thì phải bị strip khi lưu.

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
- Locale: `vi-VN` (ưu tiên định danh tiếng Việt)

**Prompt (gram-only revision):**
```
Tra cứu thông tin dinh dưỡng canonical cho nguyên liệu "{ingredient_name}".

Rules về basis:
- LUÔN trả nutrition theo per 100 gram (cả nguyên liệu rắn lẫn lỏng).
- Với liquid (sữa, dầu, nước chấm): tự quy đổi về 100g bằng quy ước 1ml ≈ 1g cho nước; sữa ~1.03 g/ml; dầu ~0.92 g/ml. Không trả per 100ml.

Trả JSON:
{
  "name": string,                  // Chuẩn hóa tên tiếng Việt
  "category": string,              // Ví dụ: "Thịt", "Ngũ cốc", "Trứng & Sữa"
  "calories": number,              // kcal per 100g
  "protein": number,               // g per 100g
  "carbs": number,                 // g per 100g
  "fat": number,                   // g per 100g
  "fiber": number,                 // g per 100g
  "confidence": "high" | "medium" | "low"
}

Rules:
- Nếu tên mơ hồ (VD "thịt") → confidence: "low"
- Phase 1 ưu tiên USDA làm nutrition authority chính ở mức ingredient-level
- Nguồn phụ tiếng Việt chỉ dùng để hỗ trợ naming/alias hoặc fill gap sau khi review thủ công
- KHÔNG được bịa số — nếu không chắc, confidence: "low"
- KHÔNG trả unit/measurement/density/conversion. Schema chỉ có 5 macro per 100g.
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

**V1 strategy (revision 2026-04-30 — Phase 1.5B chốt KHÔNG quota):**
- **Không áp dụng per-call throttling** — user không bị chặn khi click AI
- **Không áp dụng quota limit** — Gemini paid tier, dev tự chịu cost (phù hợp `product-vision.md` §248). Nếu V2+ cần hạn chế → cho user paste key riêng trong Settings.
- Vẫn áp dụng exponential backoff retry (§5.2) để tránh hammer Gemini khi server lỗi.

> **Changelog:** Spec gốc 1.1/1.2 đặt 50 requests/day/install. Phase 1.5B (2026-04-30) bỏ quota limit theo discussion với product owner. Xem `docs/5-development/phase-1.5b-ai-foundation.md` §2 quyết định #4.

### 4.4 API Key Management (theo Decision D3)

**Strategy V1: Developer key ship trong APK**
- Dev key bundle trong app, **obfuscation = XOR + base64** (xem `phase-1.5b-ai-foundation.md` §3.7 implementation)
- Build-time script `scripts/obfuscate-gemini-key.mjs` đọc `process.env.GEMINI_API_KEY` → ghi `environment.prod.ts` với obfuscated string
- Runtime decode trong `src/app/core/services/ai/gemini-key.ts`
- User KHÔNG cần nhập API key (không có Settings UI cho API key trong V1)
- Trade-off: key có thể bị extract khỏi APK → vì không có quota (§4.3) nên risk là dev burn cost. Acceptable cho V1 alpha/internal. V2+ migrate sang user-provided key.

**Rules:**
- Không commit plain key vào git (dùng env var tại build time + obfuscation)
- Không gửi key lên bất kỳ server nào ngoài Gemini API endpoint
- Storage: key không lưu trong DB — read từ bundle config tại runtime

---

## 5. Error Handling

### 5.1 Error Types & Response

| Error | Xử lý | UI |
|-------|-------|-----|
| Network offline | Detect bằng Capacitor Network plugin → disable AI buttons + show `<app-ai-offline-banner>` | Banner: "Bạn đang offline · Cần kết nối để dùng AI" |
| API timeout (>15s) | Retry 3 lần exp backoff (1s/2s/4s) | Toast: "AI đang bận, thử lại sau" |
| API error (500, 502, 503, 504) | Retry 3 lần exp backoff (1s/2s/4s) | Toast: "Lỗi server AI, thử lại sau" |
| Rate limit (429) | Không retry | Toast: "Đã đạt giới hạn, thử lại sau" |
| Invalid API key (401, 403) | Log lỗi + disable AI features trong phiên đó | Alert: "Lỗi cấu hình AI, vui lòng cập nhật app" |
| Bad request (400) | Không retry — prompt sai | Toast: "Lỗi gửi yêu cầu AI" |
| JSON parse error / zod validation fail | Retry 3 lần | Toast: "AI trả kết quả lạ, đang thử lại..." |
| Image too large | Auto resize max 1024px | Tự động, user không thấy |
| Empty response (no candidates) | Không retry | Toast: "AI không có gợi ý, hãy thử lại" |

> Phase 1.5B implementation: xem `docs/5-development/phase-1.5b-ai-foundation.md` §3.5 error taxonomy.

### 5.2 Retry Strategy

```
Attempt 1: Gọi API (timeout 15s)
  → Success → return
  → Fail (5xx / network / parse)
      → wait 1s → Attempt 2
        → Success → return
        → Fail → wait 2s → Attempt 3
            → Success → return
            → Fail → wait 4s → throw → Show error toast
              → User có thể bấm "Thử lại" (manual retry, unlimited)

KHÔNG retry: 4xx (400/401/403/429), empty response
```

> Phase 1.5B revision (2026-04-30): tăng từ 1 retry → 3 retries exponential backoff. Xem `phase-1.5b-ai-foundation.md` §2 quyết định #6 và §3.4 implementation.

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
| 1.3 | 2026-04-30 | Phase 1.5B kickoff. §1 default model → `gemini-2.5-flash`. §4.3 bỏ quota limit. §4.4 obfuscation = XOR + base64 (chi tiết). §5.1/5.2 retry 3 lần exp backoff (1s/2s/4s) thay vì 1 lần. Cross-link sang `docs/5-development/phase-1.5b-ai-foundation.md`. |
| 1.4 | 2026-04-30 | Phase 1.5B F-02 design lock (Q1-Q8). §3.2 prompt schema mở rộng theo Q7-B: row `is_in_db=false` trả thêm `category` + 5 `*_per_100g` + `confidence`. Note rõ KHÔNG vi phạm RULE-DISH-TOTAL-04 (per-ingredient ≠ dish total). Trigger label đổi sang "AI tự điền" (Q1-A). Post-processing reference Phase 1.5B §4.2 cho fuzzy-match Q5-C, Q8-C edit, Q6-A atomic. |
