# Product Requirements Document (PRD) — HealthMate AI

**Version:** 1.1 (gram-only revision)  
**Date:** 2026-04-30  
**Status:** Active

> **Revision 1.3 (2026-04-30) — F-02 AI Auto-fill IMPLEMENTED.** F-02 status: **DONE** (GRAM-ONLY ABSOLUTE scope, commit `20a8084`). AI auto-fill flow live: dish-edit page (mode create) → "Điền bằng AI" button → bottom sheet PA1 Option B với per-row decision (DB matched ✓ / fuzzy 2 nút / + tạo mới) + atomic transaction qua `dishStore.applyAutofillAtomic`. Q2/Q8-C/Q13 + cleanup 30 days defer Phase 1.5B.4. Test count: 305/305 GREEN. Chi tiết evidence: `docs/5-development/phase-1.5b-ai-foundation.md` §7.
>
> **Revision 1.2 (2026-04-30) — F-02 confirm modal nguyên liệu mới (Phase 1.5B Q11+Q12).** §F-02 step 6 (AI Auto-fill flow) cập nhật wording: từ "Hỏi: Lưu N nguyên liệu mới?" sang "Confirm modal với checkbox per-row, ràng buộc dish ≥ 1 ingredient sau filter, atomic transaction commit". Chi tiết tham khảo `docs/5-development/phase-1.5b-ai-foundation.md` §2-bis Q1-Q12.
>
> **Revision 1.1 (2026-04-30) — Gram-only absolute.** F-02.5 (Kho nguyên liệu & Measurement Layer) đã bị loại bỏ hoàn toàn. F-01 và F-02 đã được rewrite theo triết lý gram-only: mọi lượng là gram, mọi nutrition theo `100g`, không modifier, không edible yield, không density, không snapshot, không pantry. Xem F-01 §"Triết lý gram-only" để biết lý do và trade-off. Mockup cũ tham chiếu F-02.5 đã bị deprecate, sẽ refactor trong scope mockup phase-1.

---

## 1. Tổng quan

### Mục tiêu PRD

Tài liệu này mô tả chi tiết **13 features** của HealthMate AI V1, bao gồm yêu cầu chức năng, hành vi UI, và tiêu chí chấp nhận cho từng feature.

### Phạm vi V1

- **Platform:** Android only (Capacitor)
- **Stack:** Angular 21 + Ionic 8 + Capacitor 8
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

### F-01: Thư viện Nguyên liệu

**Mô tả:** Quản lý thư viện nguyên liệu với thông tin dinh dưỡng canonical **theo `100g`**. Đây là dữ liệu nền để tính calo cho món ăn, nhưng **không phải entry flow chính trong tab Quản lý**. UX mặc định của `Quản lý` là `Món ăn`; nguyên liệu chủ yếu được chọn/tạo nhanh trong ngữ cảnh tạo món và chỉ vào `Thư viện nguyên liệu` khi cần xem, sửa sai hoặc bảo trì dữ liệu.

**Triết lý gram-only (chốt 2026-04-30):**

- **Mọi lượng đều là gram.** App không có đơn vị nào khác (không `quả`, `cup`, `tbsp`, `ml`, `pack`, `serving`). Mọi input và mọi output đều là gram.
- **Mọi nutrition đều theo `100g`.** Không có `100ml`, không có per-piece, không có per-serving.
- **Không modifier.** 1 ingredient = 1 bộ nutrition. Nếu user muốn track "Khoai tây chiên" khác với "Khoai tây luộc", tạo ingredient riêng.
- **Không edible yield, không density, không snapshot.** User tự cân phần ăn được (gram). Tính realtime từ nutrition hiện tại của ingredient.
- **Không pantry/inventory.** Tab Quản lý chỉ là catalog (ingredient + recipe). Không track tồn kho, HSD, vị trí lưu.
- **Lý do:** giảm friction, schema phẳng nhất, UI ít field nhất, tránh bài toán quy đổi đơn vị per-ingredient (impossible to maintain accurate). Trade-off chấp nhận: user tự đoán "1 quả ~?g" hoặc dùng cân điện tử.

**Chức năng chi tiết:**

| Chức năng | Mô tả |
|-----------|-------|
| **Xem danh sách** | Hiển thị tất cả nguyên liệu, hỗ trợ tìm kiếm, sắp xếp theo tên/nhóm. Tap card mở màn chi tiết/read-only trước, không mở form sửa trực tiếp. |
| **Thêm vào thư viện** | Form nhập: tên, category, calories/protein/carbs/fat/fiber per `100g`. Đây là advanced/supporting flow; user thường tạo nguyên liệu từ flow tạo món. |
| **Tạo nhanh trong món** | Khi tạo/sửa món và search không có nguyên liệu, user có thể tạo nhanh nguyên liệu rồi `Lưu và thêm vào món`. Nguyên liệu mới vẫn được lưu vào thư viện để sửa lại sau. |
| **Sửa** | Chỉnh sửa thông tin nguyên liệu đã thêm từ màn chi tiết bằng CTA `Sửa thông tin`. V1 là sửa global; nếu nguyên liệu đang được dùng trong món, UI phải cảnh báo tổng calories/macro của các món liên quan sẽ thay đổi (vì nutrition tính realtime, không snapshot). |
| **Xóa** | Xóa nguyên liệu nếu chưa được dùng; nếu đang dùng trong món thì chặn xóa và hiển thị danh sách/đếm số món liên quan. |
| **AI Lookup** | Nhập tên nguyên liệu → AI tra cứu kcal/P/C/F per 100g → user confirm. AI **không** trả về unit conversion, density, hay edible yield. |
| **Vietnamese Core Seed** | App ship sẵn dataset nền cho **20 món Việt curated** (6 sáng / 7 trưa / 7 tối), không gồm snack. Mọi seed ingredient đã chuẩn hoá về kcal/100g. |

**Dữ liệu nguyên liệu:**

```
Ingredient {
  id: string                      // UUID v4
  name: string                    // "Ức gà"
  category: string                // "Thịt"
  calories: number                // kcal per 100g, vd 165
  protein: number                 // g per 100g, vd 31
  carbs: number                   // g per 100g, vd 0
  fat: number                     // g per 100g, vd 3.6
  fiber: number                   // g per 100g, vd 0
  source: 'manual' | 'ai' | 'db' // Nguồn dữ liệu
  created_at: timestamp
  updated_at: timestamp
}
```

> **Canonical rule:** Mọi macro luôn per `100g`. Không có basis nào khác. Liquid (sữa, dầu, nước chấm) cũng tính theo gram (1ml ≈ 1g cho nước; user tự cân hoặc estimate cho liquid khác).
> **Phase 1 cho phép composite ingredient** cho nước dùng / nước chấm / base canh nếu cần để giữ seed dataset gọn — chúng vẫn tuân thủ kcal/100g.
> `Ingredient.source` dùng để phân biệt provenance: seed mặc định = `db`, user tự tạo/sửa = `manual`, AI lookup tạo = `ai`. Khi user sửa seed/AI ingredient, record đổi sang `manual`.
> **AI Lookup duplicate handling:** Trước khi insert, app kiểm tra tên trùng/gần giống. Nếu trùng → cảnh báo + cho chọn: cập nhật cũ hoặc tạo mới.
> **Management UX principle:** Tab `Quản lý` mở `Món ăn` trước. Segment order: `Món ăn | Thư viện nguyên liệu`. `Thư viện nguyên liệu` là supporting master data.
> **Ingredient library edit principle:** Tap nguyên liệu mở detail/read-only trước. Chỉ khi bấm `Sửa thông tin` mới vào form. V1 sửa global; vì không snapshot nên dish totals và meal log đã ghi sẽ tự cập nhật theo — UI cảnh báo trước khi save.

**Tiêu chí chấp nhận:**
- [ ] CRUD hoạt động đúng, data persist sau restart
- [ ] Tìm kiếm real-time theo tên
- [ ] AI lookup trả về kết quả (kcal/P/C/F per 100g) và user có thể sửa trước khi lưu
- [ ] Core Vietnamese seed dataset hỗ trợ 20 món Việt curated (6 sáng / 7 trưa / 7 tối), không gồm snack
- [ ] Không có UI nào cho phép nhập đơn vị khác gram (no unit picker, no measurement, no size, no modifier)

**Validation rules (Phase 1):**

| Field | Required | Min | Max | Default | Notes |
|-------|:--------:|-----|-----|---------|-------|
| `name` | ✅ | 1 char | 100 chars | — | Unique check (case-insensitive) khi tạo mới |
| `category` | ✅ | — | — | — | Từ enum chuẩn (xem danh sách bên dưới) |
| `calories` | ✅ | 0 | 2000 | — | kcal per 100g |
| `protein` | — | 0 | 100 | 0 | g per 100g |
| `carbs` | — | 0 | 100 | 0 | g per 100g |
| `fat` | — | 0 | 100 | 0 | g per 100g |
| `fiber` | — | 0 | 100 | 0 | g per 100g |

**Ingredient categories chuẩn (Phase 1):**

```
'Thịt' | 'Cá & Hải sản' | 'Trứng & Sữa' | 'Rau củ' | 'Ngũ cốc & Tinh bột' |
'Đậu & Hạt' | 'Dầu & Mỡ' | 'Gia vị' | 'Nước dùng & Nước chấm' | 'Trái cây' | 'Khác'
```

---

### F-02: Quản lý Món ăn

**Mô tả:** CRUD món ăn là flow chính của tab `Quản lý`. Mỗi món gồm danh sách nguyên liệu (với khối lượng **gram**) → dinh dưỡng tổng được **tính derived** từ nguyên liệu (single source of truth: SQL VIEW `dish_with_totals`). Không có cơ chế nhập tay total. Khi thiếu nguyên liệu, user tạo nhanh nguyên liệu ngay trong flow món và quay lại món với nguyên liệu vừa tạo được chọn sẵn.

**Triết lý gram-only áp dụng cho món ăn:**

- Mỗi `dish_ingredient` chỉ lưu **1 trường định lượng duy nhất: `gram_weight` (number, gram)**.
- Không có `unit_id`, không có `amount_value`, không có `normalized_amount`/`normalized_unit`. UI không có unit picker.
- Không có conversion snapshot, không có `applies_to`, không có `edible_yield_ratio`. Tính nutrition realtime: `gram_weight / 100 × ingredient.calories`.
- Sửa nutrition của ingredient → mọi món tham chiếu sẽ cập nhật theo realtime (xem cảnh báo ở F-01 Sửa).

**2 cách thêm món (V1):**

| Cách | Mô tả | Khi nào dùng |
|------|-------|-------------|
| **Ingredient-based** | Chọn nguyên liệu + nhập `gram_weight` → tự tính nutrition. Nếu nguyên liệu chưa có, tạo nhanh ngay trong flow món với CTA `Lưu và thêm vào món`. | Muốn chính xác, tự chọn |
| **🤖 AI Auto-fill** | Nhập tên món → bấm AI → AI trả về nguyên liệu + gram thông dụng → User confirm | Muốn nhanh nhưng không biết nguyên liệu |

> **Quick Add đã bị loại bỏ khỏi V1.** Mọi món ăn đều phải có danh sách `dish_ingredient`; total nutrition luôn derived từ ingredient (xem `docs/4-architecture/business-rules.md` — RULE-DISH-TOTAL).
> **Không có missing-conversion handling.** Vì mọi input là gram, không có khái niệm "thiếu conversion".

**AI Auto-fill Flow:**

```
1. User nhập tên món: "Phở bò"
2. Bấm nút 🤖 AI
3. AI trả về danh sách nguyên liệu thông dụng (gram):
   ┌────────────────────────────┐
   │ 🍜 Phở bò                  │
   │                            │
   │ Nguyên liệu AI gợi ý:     │
   │ ☑ Bánh phở    200g  190kcal│
   │ ☑ Thịt bò     100g  250kcal│
   │ ☑ Giá đỗ       50g   15kcal│
   │ ☑ Hành lá      10g    3kcal│
   │ ☑ Nước dùng   300g   30kcal│
   │────────────────────────────│
   │ Tổng: 488 kcal  |  28g pro │
   │                            │
   │ [Sửa] [✅ Lưu món + NL mới]│
   └────────────────────────────┘
4. User review: sửa gram, bỏ/thêm nguyên liệu
5. Confirm → Lưu món
6. Nếu có nguyên liệu mới (chưa có trong DB):
   → Hiện confirm modal "Lưu N nguyên liệu mới vào DB?" với checkbox per-row
     (default all-checked). Bỏ check = ingredient đó KHÔNG được tạo + KHÔNG vào dish.
   → Ràng buộc: tổng nguyên liệu giữ lại (DB matched + checked new) ≥ 1.
   → User bấm Tiếp tục → atomic transaction lưu cả ingredient mới + dish + dish_ingredient.
   → Chi tiết design: `docs/5-development/phase-1.5b-ai-foundation.md` §2-bis Q11/Q12.
```

**Dữ liệu món ăn:**

```
Dish {
  id: string                         // UUID v4
  name: string                       // "Cơm gà xối mỡ"
  description?: string
  type: 'ingredient_based' | 'ai_autofill'
  source: 'db' | 'custom' | 'ai'
  ingredients: DishIngredient[]      // Bắt buộc — không có dish nào không có ingredient
  servings: number                   // Số phần ăn
  image_url?: string                 // Ảnh món ăn (optional)
  created_at: timestamp
}

// Total nutrition (calories/protein/carbs/fat/fiber) KHÔNG được lưu trên Dish.
// Đọc từ VIEW dish_with_totals — derived realtime từ dish_ingredient + ingredient.
// UI có thể dùng helper computeDishTotalsPreview() khi form chưa save (preview only,
// không persist).

DishIngredient {
  ingredient_id: string
  gram_weight: number                // Bắt buộc, > 0, đơn vị duy nhất là gram
}
```

> Phase 1 cho phép `DishIngredient` trỏ tới ingredient thường hoặc composite ingredient đã curate sẵn cho broth/sauce/base.
> Với 20 món seed của Phase 1, user sửa trực tiếp record seed gốc; app không tạo bản copy tự động trước khi sửa.
> Khi app update, seeded dishes đã tồn tại trong DB không bị overwrite bởi seed artifact mới.
> Seed dataset chỉ được nạp ở fresh install; các version sau không tự thêm lại seed đã bị xóa và cũng không tự thêm seed mới vào DB đã tồn tại.
> `Dish.source` dùng để phân biệt provenance: seed mặc định = `db`, user tự tạo/sửa = `custom`, AI tạo = `ai`. Khi user sửa seed dish, record đổi `db` → `custom`.

**Validation rules — Dish (Phase 1):**

| Field | Required | Min | Max | Default | Notes |
|-------|:--------:|-----|-----|---------|-------|
| `dish.name` | ✅ | 1 char | 150 chars | — | — |
| `dish.servings` | ✅ | 0.5 | 20 | 1 | — |
| `dish.ingredients` | ✅ | 1 item | — | — | Phải có ít nhất 1 dish_ingredient (không cho lưu dish rỗng) |
| `dish_ingredient.gram_weight` | ✅ | 0.1 | 10000 | — | Đơn vị gram, hỗ trợ 1 chữ số thập phân |

**Tiêu chí chấp nhận:**
- [ ] Ingredient-based: chọn nguyên liệu, nhập gram_weight, tổng nutrition derived realtime từ VIEW
- [ ] AI Auto-fill: nhập tên → AI trả về nguyên liệu + gram → user confirm → lưu
- [ ] AI Auto-fill: nguyên liệu mới → hỏi user có lưu vào DB chung không
- [ ] Hiển thị tổng nutrition mỗi món (đọc từ `dish_with_totals`)
- [ ] Tìm kiếm món ăn theo tên
- [ ] App ship sẵn 20 món Việt curated dưới dạng `1 serving` templates
- [ ] Form thêm/sửa món KHÔNG có unit picker, KHÔNG có size selector, KHÔNG có modifier picker

---

<!-- F-02.5 (Kho nguyên liệu & Measurement Layer) đã bị loại bỏ ngày 2026-04-30. -->
<!-- Lý do: chuyển sang triết lý gram-only absolute (xem F-01). Pantry, measurement, -->
<!-- gross/edible, missing-conversion, snapshot — tất cả đều bị bỏ. Tab Quản lý chỉ -->
<!-- là catalog (ingredient + recipe). -->

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

> **Realtime nutrition (gram-only revision 2026-04-30):** `MealSlot.total_calories` và `DayPlan.total_calories` luôn derived realtime từ `dish_with_totals` × `PlannedDish.servings`. Không snapshot. Nếu user sửa nutrition của ingredient thì lịch sử meal log cập nhật theo. Đây là trade-off chấp nhận — đổi lấy schema phẳng và logic đơn giản.

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
| DB size sau 1 năm sử dụng | ≤ 20MB (gram-only schema phẳng — không snapshot, không pantry, không measurement table) |

> **Storage note (gram-only revision 2026-04-30):** Schema sau revision có 4 entity chính (ingredient · dish · dish_ingredient · meal_log). Mỗi `dish_ingredient` chỉ 2 trường định lượng (`gram_weight`); mỗi `meal_log_item` chỉ 1 trường (`gram_weight`). Không có cột JSON snapshot, không có conversion table. Storage cost giảm ~40-60% so với spec Phase 1.5A trước đó.

### 7.3 Data Privacy

- Tất cả data lưu local trên device (SQLite)
- Chỉ gửi data lên Gemini API khi user chủ động dùng tính năng AI
- Không thu thập, không tracking, không bán data
- Không yêu cầu đăng nhập / tạo tài khoản

---

## 8. Feature Dependency Map

```
F-02 (Món ăn-first + contextual ingredient creation) ──→ F-01 (Thư viện nguyên liệu hỗ trợ) ──→ F-03 (Calendar + AI Plan)
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
1. F-02 món ăn-first + F-01 thư viện nguyên liệu hỗ trợ → F-03 → F-04 (Core Nutrition)
2. F-08 → F-09 → F-10 (Core Fitness)
3. F-05 → F-06 → F-07 (AI Features)
4. F-11 (AI Training — depends on F-08 + F-09)
5. F-12 → F-13 (Dashboard & Settings)
