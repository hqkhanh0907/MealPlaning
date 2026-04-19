# Kinh nghiệm Design Process — MealPlaning

> Rút ra từ session design direction discussion (2026-04-12).
> Đọc kỹ trước khi thực hiện design work hoặc discuss design với user.

---

## 1. ask_user Schema Format — oneOf NOT enum+enumNames

### Vấn đề

`ask_user` tool reject schema dùng `enum` + `enumNames` format. Lỗi: "Expected object, received string".

### Nguyên nhân

Tool yêu cầu `oneOf` format với `const` + `title` cho mỗi option, KHÔNG phải `enum` array.

### Giải pháp

```json
// ❌ SAI — bị reject
{
  "type": "string",
  "enum": ["option_a", "option_b"],
  "enumNames": ["Label A", "Label B"]
}

// ✅ ĐÚNG — accepted
{
  "type": "string",
  "oneOf": [
    {"const": "option_a", "title": "Label A"},
    {"const": "option_b", "title": "Label B"}
  ]
}
```

### Bài học

Luôn dùng `oneOf` format cho ask_user dropdowns. `enum`+`enumNames` là JSON Schema draft-7 extension mà tool không support.

---

## 2. Non-designers KHÔNG hiểu design jargon — PHẢI giải thích trước

### Vấn đề

Hỏi user chọn "blue shift hue 210 vs 230 vs 250" → user trả lời "tôi không hiểu khái niệm này". Hỏi "gradient bold vs color blocking vs vibrant spots" → cũng không hiểu.

### Nguyên nhân

Design terminology (hue, chroma, color blocking, gradient bold, saturated surfaces) là chuyên môn. Non-designer user không có mental model cho các khái niệm này.

### Giải pháp: Giải thích bằng REAL-WORLD ANALOGIES trước khi hỏi

| Thuật ngữ | Ví dụ thực tế dễ hiểu |
|-----------|----------------------|
| Hue shift | "Như App Store vs Facebook vs Sapphire" |
| Background tint | "Như iPhone Settings (xanh nhẹ) vs giấy cao cấp (vàng ấm)" |
| Gradient bold | "Như nút Play trên Spotify" |
| Color blocking | "Như Google Calendar (mỗi loại 1 màu)" |
| Vibrant spots | "Như Apple Health (nền trắng, vòng Activity rực rỡ)" |
| Saturated surfaces | "Như Duolingo (thẻ nền màu đậm)" |

### Pattern giao tiếp design với non-designer

```
1. KHÔNG hỏi ngay → user sẽ confused
2. Giải thích khái niệm bằng app quen thuộc (Apple, Spotify, Facebook)
3. Dùng so sánh A vs B với ảnh/mockup nếu có
4. SAU ĐÓ mới hỏi chọn
5. Nếu user vẫn không hiểu → tạo visual mockup trước, hỏi sau
```

### Bài học

Education TRƯỚC selection. Mỗi ask_user form cho design choices PHẢI kèm giải thích dễ hiểu. Dùng tên app quen thuộc thay vì thuật ngữ.

---

## 3. Design Feedback Loop — v2 "dislike" cần Root Cause Analysis trước v3

### Vấn đề

User đánh giá v2 "không thích" nhưng không nói rõ tại sao. Nếu tạo v3 ngay → có thể lại "không thích".

### Giải pháp: 2-step probing

```
Step 1: Hỏi CỤ THỂ từng element (primary color, background, accents, dark mode, macros)
       → Phát hiện: primary cần more blue, bg cần tint rõ hơn, accents quá nhạt

Step 2: Hỏi STYLE preference với ví dụ thực tế
       → Phát hiện: muốn App Store blue, iPhone Settings bg, Spotify gradients
```

### Bài học

"Không thích" = cần 5-7 câu hỏi cụ thể để xác định CHÍNH XÁC phần nào không thích. KHÔNG BAO GIỜ tạo revision mới chỉ dựa trên "không thích" chung chung.

---

## 4. v3 Confirmed Design Decisions (2026-04-12)

### Palette: Gradient Bold

| Element | v2 Value | v3 Value | Lý do thay đổi |
|---------|----------|----------|----------------|
| Primary hue | 200 (teal) | 205→225 gradient | User muốn "App Store blue" |
| Background chroma | 0.003 | 0.012 | "iPhone Settings" visible blue tint |
| Peach chroma | 0.11 | 0.145 | "Quá nhạt" → bolder |
| Lavender chroma | 0.09 | 0.130 | "Quá nhạt" → bolder |
| Accents style | Flat color | 135° gradient | "Spotify gradient" preference |
| Font | System | Plus Jakarta Sans | Vietnamese support + distinctive |

### Gradient ở đâu (user confirmed)

| Element | Gradient? | Lý do |
|---------|-----------|-------|
| Nút bấm chính | ✅ Yes | Dynamic, modern feel |
| Vòng tròn năng lượng | ✅ Yes | Apple Activity Rings inspired |
| Thẻ bữa ăn (header) | ✅ Yes | Phân biệt 3 bữa bằng hue domain |
| Header/Banner | ❌ No | User explicitly rejected |
| Progress bars macro | ✅ Yes | Dễ nhận biết macro type |

### User profile

- Inspiration app: **Apple Health** (tinh tế, kiềm chế)
- Wow factor: **Tất cả** (animation, data viz, typography, color)
- Tổng quan v2: **Dislike** — quá nhạt, thiếu đột phá
- Tổng quan v3: **Chưa confirm** — cần chờ feedback

---

## 5. Mockup Creation — Template hiệu quả

### Cấu trúc mockup HTML chuẩn

```
1. Page header (title + description)
2. Screen tabs (interactive tab selector)
3. Dual phone frames (Light + Dark side by side)
4. 5 screens: Dashboard, Calendar Meals, Calendar Nutrition, Fitness, Library
5. Color swatches section (visual reference cho palette)
6. Design rationale section (giải thích mọi quyết định)
```

### Tips tạo mockup nhanh

- Dùng CSS custom properties cho Light/Dark → `.light` và `.dark` class
- Gradient dùng `linear-gradient(135deg, from, to)` — 135° = reading direction
- Conic gradient cho energy ring (Apple Activity Rings feel)
- Phone frame: `border-radius: 48px; border: 6px solid; width: 390px; height: 844px`
- Plus Jakarta Sans from Google Fonts — good Vietnamese support

### Bài học

Mockup HTML ~80KB cho 5 screens × 2 modes là bình thường. Đừng cố minimize — user cần xem FULL detail.

---

## 6. Visual Comparison — PHẢI duyệt HỆ THỐNG, không chỉ "nổi bật"

### Vấn đề

So sánh mockup vs app chỉ kiểm tra font-size, font-weight, color → bỏ sót 3 lỗi rõ ràng:
- ❌ Button height lệch 20px (56 vs 36) — hiển nhiên nhưng bỏ qua
- ❌ Icon padding = 0px (sát viền) — vi phạm whitespace principle
- ❌ Input padding = 0px (CSS generic `ion-item` scope quá rộng)

### Nguyên nhân

1. Chỉ so sánh "thuộc tính nổi bật" (text, color, font) mà KHÔNG có checklist spacing/layout
2. Không kiểm tra `--padding-start`, `margin`, `height` trên MỌI element
3. Tự tin vào kết quả sai → vi phạm P5 (kỹ lưỡng)

### Giải pháp: Visual Comparison Checklist (BẮT BUỘC)

Mỗi lần so sánh mockup vs app, duyệt TỪNG element theo 8 thuộc tính:

```
□ 1. Typography: font-size, font-weight, line-height, text-transform, color
□ 2. Spacing: padding (all 4 sides), margin (all 4 sides), gap
□ 3. Sizing: width, height, min-height, max-width
□ 4. Layout: display, flex, alignment, position
□ 5. Borders: border-width, border-radius, border-color
□ 6. Background: background-color, gradient, opacity
□ 7. Interactive states: hover, active, focus, disabled
□ 8. Touch targets: min 44px height/width cho tappable elements
```

### Design Rules vi phạm

| Issue | Rule vi phạm |
|-------|-------------|
| Button height khác nhau | Design Principle #3 (mobile-first, 44px+ targets) |
| Padding = 0 | Design Principle #1 (whitespace > ornament) |
| Generic CSS scope | R1 (Clean Code — scope CSS chính xác) |

### Bài học

**KHÔNG BAO GIỜ** claim "mockup và app giống nhau" nếu chưa duyệt đủ 8 thuộc tính trên MỌI element. User CÓ MẮT — nếu lệch 1px user cũng thấy, đừng nói 20px.

---

## 7. Domain variable independence — Activity Level ≠ Gym Experience (2026-04-19)

- ❌ **Sai**: Suy "Mức vận động" (activity factor) từ "Kinh nghiệm gym" (gym experience)
- ✅ **Đúng**: Đây là 2 biến ĐỘC LẬP hoàn toàn
  - Gym experience (never/under_6m/6m_2y/over_2y) → fitness_level → chọn chương trình tập
  - Activity level (sedentary/light/moderate/heavy) → activity_factor (1.2–1.725) → tính TDEE
  - Ví dụ: gym 5 năm (advanced) + ngồi văn phòng cả ngày = sedentary (1.2)
- 💡 **Bài học**: Khi PRD thiếu field mà formula cần → thêm field mới, KHÔNG "thông minh" suy từ field khác. Correlation ≠ causation.
