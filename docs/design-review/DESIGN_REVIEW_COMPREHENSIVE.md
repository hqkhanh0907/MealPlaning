# 🔍 ĐÁNH GIÁ THIẾT KẾ UI/UX TOÀN DIỆN — MealPlaning App

> **Người đánh giá**: Senior Design Architect — 50+ năm kinh nghiệm thiết kế & phát triển phần mềm
> **Ngày đánh giá**: Tháng 7/2025
> **Phiên bản app**: React 19 + Capacitor 8 (Android)
> **Số lượng screenshot phân tích**: ~60 screens, bao phủ toàn bộ luồng ứng dụng
> **Mức độ nghiêm ngặt**: ★★★★★ — Không có ngoại lệ, không có sự nhân nhượng

---

## MỤC LỤC

1. [PHẦN I: TỔNG QUAN — Bức tranh toàn cảnh](#phần-i-tổng-quan)
2. [PHẦN II: HỆ THỐNG THIẾT KẾ (Design System)](#phần-ii-hệ-thống-thiết-kế)
3. [PHẦN III: CHI TIẾT TỪNG PAGE & COMPONENT](#phần-iii-chi-tiết-từng-page--component)
   - [3.1 Onboarding Flow](#31-onboarding-flow)
   - [3.2 Calendar / Home Screen](#32-calendar--home-screen)
   - [3.3 Meal Planner (Kế hoạch bữa ăn)](#33-meal-planner)
   - [3.4 Library Tab (Thư viện)](#34-library-tab)
   - [3.5 Ingredient Management](#35-ingredient-management)
   - [3.6 Dish Management](#36-dish-management)
   - [3.7 AI Analysis Tab (Phân tích)](#37-ai-analysis-tab)
   - [3.8 Fitness Tab (Tập luyện)](#38-fitness-tab)
   - [3.9 Dashboard / Overview Tab (Tổng quan)](#39-dashboard--overview-tab)
   - [3.10 Settings Page](#310-settings-page)
   - [3.11 Training Profile Form](#311-training-profile-form)
   - [3.12 Workout Logger](#312-workout-logger)
   - [3.13 Fitness Progress Dashboard](#313-fitness-progress-dashboard)
   - [3.14 Dark Mode](#314-dark-mode)
   - [3.15 Modals & Dialogs](#315-modals--dialogs)
   - [3.16 Empty States](#316-empty-states)
   - [3.17 Toast Notifications](#317-toast-notifications)
   - [3.18 Template Manager](#318-template-manager)
   - [3.19 Filter & Sort System](#319-filter--sort-system)
4. [PHẦN IV: VẤN ĐỀ XUYÊN SUỐT (Cross-cutting Concerns)](#phần-iv-vấn-đề-xuyên-suốt)
5. [PHẦN V: BẢNG TÓM TẮT MỨC ĐỘ NGHIÊM TRỌNG](#phần-v-bảng-tóm-tắt)
6. [PHẦN VI: LỘ TRÌNH SỬA CHỮA ĐỀ XUẤT](#phần-vi-lộ-trình)

---

# PHẦN I: TỔNG QUAN

## 1.1 Ấn tượng đầu tiên (First Impression)

Tôi sẽ nói thẳng: đây là một ứng dụng có **nền tảng tốt** nhưng còn **rất nhiều vấn đề thiết kế cần giải quyết** trước khi có thể gọi là "production-ready" về mặt UX.

**Điểm tốt cần ghi nhận:**

- Hệ thống màu sắc chủ đạo (green/emerald) nhất quán và phù hợp với domain "sức khỏe/dinh dưỡng"
- Card-based layout tạo cảm giác hiện đại
- Dark mode được triển khai khá đầy đủ
- Bottom navigation rõ ràng với 5 tabs hợp lý
- Vietnamese localization toàn bộ
- Có hệ thống filter/sort cho các danh sách

**Điểm cần cải thiện nghiêm trọng:**

- **Thiếu nhất quán nghiêm trọng** trong spacing, typography, và component patterns
- **Mật độ thông tin quá cao** ở nhiều màn hình — không có "breathing room" cho mắt
- **Touch targets quá nhỏ** ở nhiều nơi — vi phạm Material Design guidelines (48dp minimum)
- **Visual hierarchy yếu** — không phân biệt rõ ràng primary/secondary/tertiary content
- **Empty states thiếu cảm xúc** — có tồn tại nhưng thiếu illustration và CTA hấp dẫn
- **Color system chưa có depth** — quá phụ thuộc vào 1 màu green, thiếu accent colors
- **Horizontal scroll cards bị cắt** — content bị crop ở cạnh phải
- **Modals/Dialogs thiếu nhất quán** — mỗi nơi dùng một pattern khác nhau
- **Form validation UX kém** — errors chỉ là text đỏ, không có visual feedback đủ mạnh

### Điểm đánh giá tổng thể: **5.5/10**

Tôi cho 5.5 — trên trung bình nhưng còn xa mới đạt chuẩn. Trong 50 năm làm nghề, tôi đã thấy hàng nghìn ứng dụng. App này có "xương sống" tốt nhưng "thịt da" chưa được chăm chút. Nó giống như một ngôi nhà có móng vững nhưng chưa sơn, chưa lắp đèn trang trí, và cửa sổ mở đóng không đều.

---

## 1.2 Phân loại vấn đề theo mức nghiêm trọng

| Mức                | Ý nghĩa                                                | Số lượng |
| ------------------ | ------------------------------------------------------ | -------- |
| 🔴 **CRITICAL**    | Ảnh hưởng trực tiếp đến usability, user có thể bỏ app  | 8        |
| 🟠 **MAJOR**       | Giảm đáng kể trải nghiệm, tạo confusion                | 15       |
| 🟡 **MODERATE**    | Thiếu polish, user vẫn dùng được nhưng không thoải mái | 22       |
| 🔵 **MINOR**       | Chi tiết nhỏ, ảnh hưởng đến perceived quality          | 18       |
| ⚪ **ENHANCEMENT** | Cơ hội cải thiện, không phải lỗi                       | 12       |

**Tổng: 75 issues** — Con số này KHÔNG nhỏ cho một ứng dụng mobile.

---

# PHẦN II: HỆ THỐNG THIẾT KẾ (Design System)

## 2.1 Color System — Đánh giá: 6/10

### Vấn đề #DS-01: Monochromatic Overload 🟠 MAJOR

App hầu như chỉ dùng **MỘT hệ màu: Green (emerald-600, ~#16a34a)**. Mọi thứ đều xanh — buttons, headers, progress bars, cards, hero sections, tabs, badges. Khi MỌI THỨ đều xanh, thì KHÔNG GÌ nổi bật cả.

**Bằng chứng:** Nhìn bất kỳ screenshot nào — SC04_step01 (home), SC30_step29 (fitness hero), SC22_step17 (dark fitness), SC38_step05 (dashboard) — tất cả đều tràn ngập một tông xanh duy nhất.

**Bài học thiết kế cốt lõi:** Trong thiết kế, màu sắc phải tạo **contrast hierarchy**. Nếu bạn dùng cùng một màu cho CTA button, informational badge, decorative header, và progress indicator — user không biết cái nào quan trọng hơn cái nào. Đây là nguyên lý "When everything is special, nothing is special" — nguyên lý này đã được đề cập từ những năm 1960 trong lý thuyết Gestalt.

**Giải pháp chi tiết:**

```
Brand Primary:    Green (#16a34a) → CHỈ dùng cho: CTA chính, branding, active states
Accent:           Teal hoặc Cyan (#0891b2) → Dùng cho: informational elements, badges, links
Success:          Green nhạt hơn (#22c55e) → Dùng cho: success states, positive indicators
Warning:          Amber (#f59e0b) → Dùng cho: warnings, attention
Error:            Red (#ef4444) → Dùng cho: errors, destructive actions
Neutral:          Slate series → Dùng cho: backgrounds, borders, secondary text
```

**Quy tắc cụ thể tôi đề xuất:**

1. Hero cards (dashboard, fitness progress) → dùng gradient với secondary color, KHÔNG chỉ green
2. Navigation active state → green outline/underline, KHÔNG fill toàn bộ
3. Informational badges (kcal, protein) → dùng teal/cyan để phân biệt với CTA
4. Progress bars → dùng gradient (green → teal) để tạo visual interest

### Vấn đề #DS-02: Contrast Ratio trong Dark Mode 🟡 MODERATE

Dark mode nhìn tổng thể ổn, nhưng có vài chỗ text contrast không đủ. Ví dụ trong SC22_step12 (dark nutrition), SC22_step27 (dark AI) — subtitle text trên nền dark grey card có thể khó đọc ở ngoài trời hoặc ánh sáng yếu.

**Giải pháp:** Mọi text/background combination phải đạt WCAG AA (4.5:1 cho body text, 3:1 cho large text). Kiểm tra bằng tool như Stark hoặc a11y color contrast checker.

### Vấn đề #DS-03: Thiếu Color Semantics cho Data Types 🔵 MINOR

Trong nutrition data, cả Protein, Fat, và Carbs đều hiển thị cùng style. Không có color coding riêng biệt cho từng macro.

**Giải pháp:**

```
Protein: Blue (#3b82f6) — convention phổ biến trong fitness apps
Fat:     Orange (#f97316)
Carbs:   Yellow/Amber (#eab308)
Calories: Red/Rose (#f43f5e) — energy = heat = red
```

Áp dụng màu này nhất quán xuyên suốt: badges, charts, progress bars, dashboard cards.

---

## 2.2 Typography — Đánh giá: 5/10

### Vấn đề #DS-04: Type Scale Không Nhất Quán 🟠 MAJOR

Nhìn across các screenshots, tôi thấy KHÔNG CÓ type scale nhất quán. Heading sizes nhảy lung tung:

- SC04_step01: "Lịch trình" header ~20px
- SC30_step29: "+74%" hero text ~48px
- SC38_step05: "Chào buổi sáng!" ~14px, "Bắt đầu hành trình sức khỏe" ~22px
- SC01_step24: "QA Tester, đây là kế hoạch của bạn" ~24px
- SC06_step06: Form labels ~14px, input text ~16px

**Bài học:** Mọi ứng dụng nghiêm túc cần một **Type Scale** cố định. Tôi đề xuất:

```
Display:    36px / 700 weight — Hero numbers ("+74%", macro totals)
H1:         28px / 700 weight — Page titles ("Tập luyện", "Tổng quan")
H2:         22px / 600 weight — Section headers ("Phân tích", "Tiến trình chu kỳ")
H3:         18px / 600 weight — Card titles ("Thân trên A", "Bữa ăn ngày thường")
Body-lg:    16px / 400 weight — Primary content
Body:       14px / 400 weight — Secondary content, descriptions
Caption:    12px / 400 weight — Labels, timestamps, metadata
Overline:   11px / 500 weight / uppercase — Category labels, section dividers
```

### Vấn đề #DS-05: Line Height cho Tiếng Việt 🟡 MODERATE

Tiếng Việt có dấu (à, ả, ã, á, ạ, ầ, ẩ, ẫ, ấ, ậ...) — các ký tự với dấu phía trên cần line-height lớn hơn tiếng Anh. Tôi thấy ở nhiều nơi text bị "chật" — dấu gần như chạm vào dòng trên.

**Bằng chứng:** SC25_step63 (training profile form) — các label text có dấu nằm sát nhau.

**Giải pháp:**

```css
/* Minimum line-height cho tiếng Việt */
body {
  line-height: 1.6;
} /* Body text */
h1,
h2,
h3 {
  line-height: 1.35;
} /* Headings */
.caption {
  line-height: 1.5;
} /* Small text */
```

### Vấn đề #DS-06: Font Weight Thiếu Hierarchy 🟡 MODERATE

Nhiều nơi dùng font-weight không tạo đủ contrast:

- SC03_step67 (Goal detail): "Duy trì" title và "Mục tiêu" label gần như cùng weight
- SC38_step05 (Dashboard): "Ngày nghỉ phục hồi" title và body text weight tương tự

**Giải pháp:** Áp dụng quy tắc **Weight Ladder**:

- Title → Bold (700)
- Label → Semibold (600)
- Body → Regular (400)
- Metadata → Regular (400) + lighter color

KHÔNG BAO GIỜ để title và body cùng font weight.

---

## 2.3 Spacing System — Đánh giá: 5/10

### Vấn đề #DS-07: Spacing Scale Không Đều 🟠 MAJOR

Đây là vấn đề tôi thấy ở KHẮP NƠI trong ứng dụng. Padding bên trong cards, margin giữa các sections, gap giữa form fields — tất cả đều không theo một hệ thống.

**Bằng chứng cụ thể:**

- SC04_step01 (Home): Khoảng cách giữa nutrition bar và day selector khác với khoảng cách giữa day selector và meal cards
- SC06_step06 (Ingredient form): Padding trong form card khác với padding trong nav header
- SC38_step05 (Dashboard): Section spacing không đều — "Protein" section sát card trên, nhưng "Ngày nghỉ phục hồi" card có margin lớn hơn

**Bài học thiết kế:** Spacing phải tuân theo **8px grid system**. Mọi khoảng cách phải là bội số của 4px (tối thiểu) hoặc 8px (ưu tiên):

```
4px  (0.25rem) — Micro spacing: inline elements, icon-text gap
8px  (0.5rem)  — Tight: between related items within a group
12px (0.75rem) — Compact: form field label-input gap
16px (1rem)    — Standard: card padding, between list items
24px (1.5rem)  — Comfortable: between card groups, section padding
32px (2rem)    — Spacious: between major sections
48px (3rem)    — Generous: page section dividers
```

**Áp dụng cụ thể:**

- Card internal padding: LUÔN 16px
- Gap giữa cards trong cùng group: LUÔN 12px
- Gap giữa sections khác nhau: LUÔN 24px
- Form field gap: LUÔN 16px
- Page horizontal padding: LUÔN 16px

---

## 2.4 Component Patterns — Đánh giá: 6/10

### Vấn đề #DS-08: Card Styles Không Nhất Quán 🟠 MAJOR

Tôi đếm được ÍT NHẤT 5 kiểu card khác nhau trong app:

1. **Flat card** (no shadow, light bg): SC04_step01 nutrition balance card
2. **Elevated card** (shadow): SC06_step06 form card
3. **Colored card** (green gradient): SC30_step29 hero card
4. **Outlined card** (border): SC42_step05 empty state
5. **Action card** (with buttons): SC13_step35 template card

Mỗi loại card dùng border-radius khác nhau, padding khác nhau, shadow intensity khác nhau.

**Giải pháp:** Định nghĩa CHÍNH XÁC 3 card levels:

```css
/* Card Level 1: Surface — informational, passive */
.card-surface {
  background: var(--surface);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid var(--border-subtle);
}

/* Card Level 2: Elevated — interactive, clickable */
.card-elevated {
  background: var(--surface);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Card Level 3: Featured — hero, highlight */
.card-featured {
  background: var(--gradient-primary);
  border-radius: 20px;
  padding: 20px;
  color: white;
}
```

### Vấn đề #DS-09: Button Styles Quá Nhiều Biến Thể 🟡 MODERATE

Buttons xuất hiện trong quá nhiều dạng:

- Green filled (CTA chính)
- Green outlined (secondary actions)
- Gray filled (inactive/disabled states)
- Text-only (tertiary)
- Icon-only (close, edit, settings)
- Pill shape (filter tags)
- Chip shape (activity/duration selectors trong onboarding)

**Vấn đề:** Không rõ khi nào dùng loại nào. Ví dụ:

- SC02_step12: "Xác nhận (1)" dùng green filled — đúng
- SC26_step58: "Hủy" dùng green outlined — nhưng "Hủy" nên là neutral/gray
- SC01_step16: "Tiếp tục" dùng green filled — nhưng "Quay lại" chỉ là text — asymmetry quá lớn

**Giải pháp:**

```
Primary:     Green filled    → CHỈCHO: 1 CTA duy nhất trên mỗi screen
Secondary:   Green outlined  → Cho: hành động phụ quan trọng
Tertiary:    Gray outlined   → Cho: Cancel, Back, Less important actions
Ghost:       Text-only       → Cho: links, inline actions
Destructive: Red filled      → Cho: Delete, Remove
Chip:        Pill shape      → CHỈ cho: filters, tags, selectable options
```

**Quy tắc vàng:** Trên mỗi screen, CHỈ CÓ 1 primary button. Nếu có 2 buttons cùng cấp, một cái phải secondary.

---

## 2.5 Iconography — Đánh giá: 6.5/10

### Vấn đề #DS-10: Icon Size Không Nhất Quán 🔵 MINOR

Icons trong app chủ yếu từ Lucide React (tốt — consistent style). Tuy nhiên icon sizes dao động:

- Bottom nav icons: ~20px
- Card icons: ~18px
- Form icons: ~16px
- Hero card icons: ~24px

**Giải pháp:** Chuẩn hóa 3 icon sizes:

```
Small:  16px — form inputs, badges, metadata
Medium: 20px — navigation, list items, buttons
Large:  24px — headers, hero sections, empty states
```

### Vấn đề #DS-11: Emoji trong UI — Không Chuyên Nghiệp 🟡 MODERATE

Tôi thấy emoji xuất hiện ở nhiều nơi:

- SC01_step24 (Plan Preview): 💪 emoji cho workout days
- SC38_step05 (Dashboard): 🍀 emoji trong tips section
- SC26_step47 (Training plan): Emoji trong hint text "Chạm 👈 để chỉnh bài tập"

**Bài học nghiêm khắc:** Emoji KHÔNG phải icons. Chúng render khác nhau trên mỗi OS, mỗi Android version, mỗi manufacturer skin. Trên Samsung, emoji một kiểu. Trên Pixel, kiểu khác. Trên Xiaomi, kiểu khác nữa. Bạn KHÔNG kiểm soát được rendering.

**Giải pháp:** Thay TẤT CẢ emoji bằng Lucide icons hoặc custom SVG icons. Không có ngoại lệ.

---

# PHẦN III: CHI TIẾT TỪNG PAGE & COMPONENT

## 3.1 Onboarding Flow

**Screenshots phân tích:** SC01_step07, SC01_step11, SC01_step13, SC01_step14, SC01_step16, SC01_step24, SC09_step02, SC22_step03

### Đánh giá tổng thể: 6/10

### 3.1.1 Progress Bar — 🟡 MODERATE

**Vấn đề:** Progress bar ở đầu onboarding dùng segmented style (mỗi section một đoạn xanh). Đây là approach đúng, nhưng:

- Các segments không có labels — user không biết "tôi đang ở bước 3/7 hay 3/10?"
- Không có breadcrumb text bên dưới ("Tùy chỉnh tập" trong SC01_step16 là có — tốt, nhưng SC01_step07 thì KHÔNG có)
- Segment widths không đều giữa các bước

**Giải pháp:**

```
[===|===|===|===|---|---|---]  ← Segmented progress
Step 4 of 7: Thời lượng buổi tập   ← Label LUÔN hiển thị
```

Thêm text "Bước X/Y: Tên bước" bên dưới progress bar ở MỌI step. User phải LUÔN biết họ đang ở đâu.

### 3.1.2 DOB Input (SC01_step07) — 🟠 MAJOR

**Vấn đề nghiêm trọng:** Input ngày sinh hiển thị format "15/05/1996" — nhưng KHÔNG RÕ đây là DD/MM/YYYY hay MM/DD/YYYY. Người dùng Việt Nam quen DD/MM/YYYY, nhưng nếu app parse sai → tuổi tính sai → BMR/TDEE sai → toàn bộ nutrition plan sai.

**Thêm vào đó:** Input field cho DOB nên dùng native date picker (type="date") thay vì text input. Trên mobile, date picker wheel cung cấp trải nghiệm tốt hơn nhiều — không cần nhớ format, không cần type, chỉ scroll.

**Giải pháp:**

1. Dùng native date picker
2. Hiển thị placeholder rõ ràng: "DD/MM/YYYY"
3. Sau khi chọn, hiển thị: "15 tháng 5, 1996" (human-readable) THAY VÌ "15/05/1996"
4. Thêm tuổi tính toán: "(29 tuổi)" bên cạnh

### 3.1.3 Activity Level Selection (SC01_step11) — 🟡 MODERATE

**Điểm tốt:** Dùng selectable cards với descriptions — approach đúng.

**Vấn đề:**

- Cards chỉ có text, thiếu visual indicator (icon) cho mỗi level
- Card đang selected chỉ có green border — cần thêm checkmark hoặc filled state
- Descriptions quá ngắn — user không chắc "Hoạt động vừa phải" là gì cụ thể

**Giải pháp:**
Mỗi card cần:

```
[🚶 Icon]  Ít vận động
           Ngồi bàn cả ngày, ít di chuyển
           Ví dụ: Nhân viên văn phòng
           [✓] ← Checkmark khi selected
```

Thêm ví dụ cụ thể giúp user tự đánh giá chính xác hơn. Đây KHÔNG phải nice-to-have — sai activity level = sai TDEE = sai mục tiêu = user thất bại.

### 3.1.4 Goal Selection (SC01_step13, SC08_step13) — 🟡 MODERATE

**Điểm tốt:** 3 options (Giảm cân / Duy trì / Tăng cân) rõ ràng.

**Vấn đề:**

- Thiếu visual explanation cho mỗi goal — ví dụ biểu đồ nhỏ minh họa xu hướng cân nặng
- Rate selection (Conservative/Moderate/Aggressive) nằm sâu — user phải chọn goal rồi mới thấy rate
- Thuật ngữ "conservative"/"aggressive" quá technical — nên dùng ngôn ngữ thân thiện hơn

**Giải pháp:**

```
Giảm cân
├── Nhẹ nhàng (giảm ~0.25kg/tuần) → "An toàn, bền vững"
├── Vừa phải (giảm ~0.5kg/tuần)   → "Phổ biến nhất" ← Recommend badge
└── Nhanh chóng (giảm ~1kg/tuần)  → "⚠️ Cần kỷ luật cao"
```

### 3.1.5 Confirmation Screen (SC01_step14) — 🟠 MAJOR

**Vấn đề nghiêm trọng:** Màn hình confirm hiển thị BMR, TDEE, Target calories — nhưng KHÔNG GIẢI THÍCH chúng là gì!

User bình thường (không phải fitness expert) KHÔNG BIẾT:

- BMR là gì? (Basal Metabolic Rate — năng lượng cơ thể đốt khi nghỉ ngơi)
- TDEE là gì? (Total Daily Energy Expenditure — tổng năng lượng tiêu hao/ngày)
- Target khác TDEE thế nào? (Target = TDEE ± goal offset)

Hiển thị 3 con số kỹ thuật mà không giải thích = **UI thất bại trong việc giao tiếp**.

**Giải pháp chi tiết:**

```
┌─────────────────────────────────┐
│  📊 Hồ sơ dinh dưỡng của bạn   │
│                                 │
│  Cơ thể đốt khi nghỉ (BMR)     │
│  ████████████████  1,704 kcal   │
│  ℹ️ Năng lượng cơ thể cần       │
│     chỉ để duy trì sự sống     │
│                                 │
│  Tổng tiêu hao hàng ngày (TDEE)│
│  ████████████████████  2,641    │
│  ℹ️ Bao gồm cả hoạt động       │
│     thường ngày của bạn         │
│                                 │
│  🎯 Mục tiêu của bạn           │
│  ████████████████  2,091 kcal   │
│  ℹ️ TDEE trừ 550 kcal để       │
│     giảm ~0.5kg/tuần           │
└─────────────────────────────────┘
```

Mỗi metric cần: (1) icon, (2) tên Vietnamese rõ ràng, (3) giá trị, (4) tooltip/description 1 dòng.

### 3.1.6 Plan Preview (SC01_step24) — 🟡 MODERATE

**Điểm tốt:** Hiển thị lịch tập tuần (T2-CN) với emoji 💪 cho ngày tập, "Ngày nghỉ" cho rest days. Thông tin summary (4 ngày tập, 3 ngày nghỉ, 60 phút/buổi) rõ ràng.

**Vấn đề:**

1. Emoji 💪 không consistent (rendering khác nhau giữa devices — đã nói ở #DS-11)
2. Summary cards (4 ngày tập, 3 ngày nghỉ, 60 phút/buổi) dùng gray background — quá nhạt, không tạo visual impact
3. Green info banner "Bạn luôn có thể chỉnh sửa..." mang tính reassurance nhưng nằm lẻ loi ở dưới — nên integrated vào flow tự nhiên hơn
4. CTA "Bắt đầu tập luyện →" ở bottom rất tốt — nhưng thiếu secondary action (Quay lại chỉnh sửa)

**Giải pháp:**

1. Thay 💪 bằng Dumbbell icon (Lucide) + green background circle
2. Summary cards thêm icon: 📅 4 ngày tập, 😴 3 ngày nghỉ, ⏱️ 60 phút
3. Thêm "Chỉnh sửa kế hoạch" link text phía trên CTA button

### 3.1.7 Training Step — Duration Selection (SC01_step16) — 🔵 MINOR

**Nhận xét:** Chip-based selection (30/45/60/75/90 phút) clean và dễ dùng. "Quay lại" và "Tiếp tục" đặt đúng vị trí bottom.

**Vấn đề nhỏ:**

- "Quay lại" là plain text — "Tiếp tục" là filled button — sự bất đối xứng quá lớn
- Chips không có selected state rõ ràng trong screenshot này (không biết đang chọn cái nào)

**Giải pháp:**

- "Quay lại" nên là outlined button (cùng width với "Tiếp tục") để tạo visual balance
- Selected chip: green filled + white text (hiện tại có thể đã có, nhưng screenshot không thấy rõ)

---

## 3.2 Calendar / Home Screen

**Screenshot phân tích:** SC04_step01

### Đánh giá tổng thể: 6.5/10

### 3.2.1 Header Layout — 🔵 MINOR

Header hiển thị app logo + "Lịch trình" + ngày (CN, 5/4) + settings gear icon. Layout ổn nhưng:

- Logo size nhỏ, nếu user chưa biết app thì logo không đủ nhận dạng
- Settings icon (gear) ở góc phải — tốt, standard pattern

### 3.2.2 Nutrition Balance Card — 🟠 MAJOR

Card "Cân bằng 0 kcal" hiển thị:

- Nạp vào: 0 | Tiêu hao: 0 | Cân bằng: 0
- Mục tiêu: 2641 kcal | Còn lại: 2641 kcal
- Protein: 0/150g

**Vấn đề:**

1. **Khi tất cả giá trị = 0, card vẫn chiếm cùng không gian** — nên có "collapsed" state khi chưa có dữ liệu, với CTA "Bắt đầu lên kế hoạch bữa ăn"
2. **"Nạp vào: 0 — Tiêu hao: 0 = Cân bằng: 0"** — dùng dấu "—" và "=" khó đọc. Nên dùng icons hoặc visual flow
3. **"Còn lại: 2641 kcal"** hiển thị màu xanh lá — nhưng 2641 là mục tiêu đầy đủ chưa ăn gì = nên dùng neutral color, green CHỈ khi progress tốt
4. **Protein progress bar** rất mỏng (~2px) — gần như invisible

**Giải pháp:**

```
┌──────────────────────────────────┐
│ ⚡ Năng lượng hôm nay            │
│                                  │
│  🍽️ 0       🔥 0       ⚖️ 0     │
│  Nạp vào    Tiêu hao   Cân bằng │
│                                  │
│  ──── Progress bar ────         │
│  Mục tiêu: 2,641 kcal           │
│  Còn lại: 2,641 kcal            │
│                                  │
│  🥩 Protein  ████░░░░░  0/150g  │
│  (progress bar dày hơn, ~6px)    │
└──────────────────────────────────┘
```

### 3.2.3 Day Selector Row — 🟡 MODERATE

Hàng chọn ngày (T2-CN) hoạt động tốt — ngày hiện tại có green circle highlight.

**Vấn đề:**

- Không có dot indicator cho ngày có meal plan đã lên
- Không phân biệt ngày tập vs ngày nghỉ (color coding)
- Scroll hàng ngang không cần thiết cho 7 items — nên hiển thị cố định

**Giải pháp:**

```
T2    T3    T4    T5    T6    T7   [CN]
•     •           •                     ← dots: có meal plan
🟢   🟢         🟢                     ← green: ngày tập
```

### 3.2.4 Meal Sections — 🟡 MODERATE

Meal slots (Bữa Sáng/Trưa/Tối) hiển thị danh sách món ăn. Đây là core feature nhưng:

**Vấn đề:**

- Section headers (Bữa Sáng, Bữa Trưa, Bữa Tối) quá subtle — cùng style như body text
- Không có tổng calories/protein cho mỗi bữa
- Nút "Thêm" cho mỗi bữa khó thấy (nếu có)

**Giải pháp:** Mỗi meal section cần:

```
┌ 🌅 Bữa Sáng ──── 487 kcal ──── [+ Thêm] ┐
│ • Trứng ốp la        155 kcal    13g pro  │
│ • Yến mạch sữa chua  332 kcal    25g pro  │
└────────────────────────────────────────────┘
```

### 3.2.5 Bottom Quick Actions — 🔵 MINOR

SC26_step47 cho thấy có quick action buttons ("Chỉnh lịch", "Đổi Split", "Mẫu Plan"). Đây là pattern tốt nhưng:

- Button text dùng jargon ("Split" là gì? User bình thường không biết)
- 3 buttons nằm ngang tight — touch target có thể < 48dp

**Giải pháp:** "Đổi Split" → "Đổi lịch tập". Thêm padding giữa buttons.

---

## 3.3 Meal Planner

**Screenshots phân tích:** SC19_step27, SC19_step29, SC02_step12, SC11_step42

### Đánh giá tổng thể: 7/10

Đây là một trong những screens thiết kế TỐT NHẤT trong app. Tôi phải thừa nhận điều đó.

### 3.3.1 Planner Layout (SC02_step12) — Điểm tốt

- 3 meal slots (Bữa Sáng/Trưa/Tối) với badge count — excellent!
- Search bar + filter button — functional
- Dish cards với calories + protein info — informative
- Selected dish highlight (green border + checkmark) — clear
- Bottom summary (Tổng ngày: 5 món, 997 kcal, 108g Pro) — comprehensive
- "Còn lại" calorie/protein budget — helpful for planning
- "Xác nhận (1)" CTA — đúng vị trí, đúng emphasis

### 3.3.2 Vấn đề cần fix:

**#MP-01: Date Format** 🔵 MINOR
Header "Kế hoạch bữa ăn — 2026-04-05" dùng format YYYY-MM-DD — quá technical. Nên dùng "Thứ 7, 5 tháng 4, 2026" hoặc ít nhất "05/04/2026".

**#MP-02: Meal Tab Active State** 🟡 MODERATE
"Bữa Trưa" tab active có green filled + badge "1" + dot indicator — ĐÂY LÀ QUÁ NHIỀU INDICATORS. Badge count "1" ĐÃ ĐỦ cho biết có 1 món. Dot indicator thừa → clutter.

**Giải pháp:** Bỏ dot indicator, giữ badge count.

**#MP-03: Budget Overflow Display** 🟡 MODERATE
Khi calories vượt target, text "Còn lại: -209 kcal" hiển thị số âm. "Còn lại: -209" gây confuse — "còn lại" nhưng âm?

**Giải pháp:** Khi vượt → đổi label thành "Vượt mức: 209 kcal" + đổi màu sang red/orange.

### 3.3.3 Dish Card Design (SC02_step12) — 🔵 MINOR

Mỗi dish card hiển thị:

- Icon (chef hat) — tốt
- Tên món — tốt
- Calories (🔥 51 kcal) — tốt
- Protein (💪 5g) — tốt nhưng ĐANG DÙNG EMOJI (xem #DS-11)
- Checkbox bên phải — tốt

**Vấn đề:** Icon chef hat cho TẤT CẢ món — không phân biệt loại. "Ức gà áp chảo" và "Khoai lang luộc" cùng icon.

**Giải pháp (enhancement):** Có thể thêm category color coding hoặc icon riêng cho protein-rich, carb-rich, etc.

---

## 3.4 Library Tab

**Screenshots phân tích:** SC22_step13 (dark), SC02_step03, SC02_step04, SC02_step05, SC02_step08

### Đánh giá tổng thể: 6/10

### 3.4.1 Tab Structure — 🟡 MODERATE

Library có 2 sub-tabs: "Nguyên liệu" và "Món ăn". Đây là phân loại hợp lý.

**Vấn đề:**

- Sub-tab bar nằm ngay dưới page header — nhưng CÙNG style với bottom nav tabs → user có thể nhầm lẫn
- Không có badge count cho mỗi sub-tab (bao nhiêu ingredients, bao nhiêu dishes)

**Giải pháp:** Sub-tabs nên dùng underline style (Material Design Tabs) thay vì pill/chip style để phân biệt với bottom nav.

### 3.4.2 Search Experience — 🟡 MODERATE

SC02_step03 (search "ức gà"): Search works, hiển thị kết quả match. Tốt.
SC02_step04 (search no match): Empty state hiển thị "Không tìm thấy" — nhưng thiếu suggestion.

**Giải pháp cho no-match:**

```
🔍 Không tìm thấy "xyz"

  Bạn có thể:
  • Kiểm tra chính tả
  • Thử tìm tên khác
  • [+ Tạo nguyên liệu mới] ← CTA!
```

### 3.4.3 Dish Card trong Library (SC02_step05) — 🔵 MINOR

Card hiển thị dish info + rating stars (nếu có). Khi tap vào dish, chi tiết mở ra.

**Vấn đề:** Cards trong list view thiếu visual differentiation giữa items — đều cùng style, cùng height, cùng icon → "wall of text" effect.

**Giải pháp:** Thêm meal type tag (🌅 Sáng, ☀️ Trưa, 🌙 Tối) dưới dạng colored chip ở góc card.

---

## 3.5 Ingredient Management

**Screenshots phân tích:** SC06_step06, SC06_step11, SC06_step34, SC06_step46, SC06_step48, SC06_step53

### Đánh giá tổng thể: 5.5/10

### 3.5.1 Ingredient Form (SC06_step06) — 🔴 CRITICAL

Đây là form CỰC KỲ QUAN TRỌNG vì user phải nhập data chính xác. Nhưng form design có nhiều vấn đề nghiêm trọng:

**Vấn đề #1: Thiếu required field indicators**
Không có dấu \* hoặc "(bắt buộc)" cho required fields. User không biết field nào phải điền.

**Vấn đề #2: Input fields cho số dùng type="text"**
Đây là vấn đề đã được ghi nhận trong memory — Settings form dùng type="text" cho weight/height. Tương tự, ingredient form cho calories/protein cũng nên dùng inputMode="decimal" để hiện bàn phím số trên mobile.

**Vấn đề #3: Unit selector**
Screenshot cho thấy unit selector (g, ml, quả, muỗng...) — nhưng không rõ đây là dropdown hay chip group. Trên mobile, dropdown native rất khó dùng (small tap area, iOS vs Android khác nhau).

**Vấn đề #4: "Per 100g" không giải thích**
Label "Giá trị dinh dưỡng (trên 100g)" — nhưng user nhập "1 quả trứng" thì 100g là bao nhiêu quả? Cần helper text.

**Giải pháp toàn diện:**

```
Tên nguyên liệu *
[Ức gà                            ]
  Tên tiếng Việt, ví dụ: "Cơm gạo lứt"

Đơn vị đo     [g ▼]  ← Native dropdown OK here

── Giá trị dinh dưỡng (trên 100g) ──
   ℹ️ Nhập giá trị cho mỗi 100 gam nguyên liệu

Calories *        Protein *
[165    kcal]     [31     g ]

Chất béo          Carbs
[3.6    g   ]     [0      g ]

* Bắt buộc

[💾 Lưu nguyên liệu]
```

### 3.5.2 Validation Messages (SC06_step34) — 🟠 MAJOR

SC06_step34 cho thấy validation "Giá trị phải ≥ 0" cho negative calories. Validation TEXT đúng nhưng:

**Vấn đề:**

- Error text chỉ là dòng chữ đỏ nhỏ dưới input
- Input field KHÔNG đổi border sang red
- Không có shake animation hoặc visual feedback mạnh
- User có thể scroll xuống và KHÔNG THẤY error ở field phía trên

**Bài học thiết kế form validation (50 năm kinh nghiệm):**

Validation PHẢI có ĐỦ 3 tầng feedback:

1. **Visual:** Input border đổi sang red (#ef4444)
2. **Textual:** Error message rõ ràng bên dưới field (ĐÃ CÓ — tốt)
3. **Behavioral:** Scroll đến field lỗi đầu tiên + focus vào field đó

```css
/* Error state styling */
.input-error {
  border-color: #ef4444;
  background-color: #fef2f2; /* Light red background */
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}
```

### 3.5.3 Search & Sort (SC06_step46, SC06_step53) — 🔵 MINOR

Search exact match (SC06_step46) hiển thị kết quả đúng — tốt.
Sort by calories descending (SC06_step53) hoạt động — tốt.

**Vấn đề nhỏ:** Khi sort đang active, không có visual indicator nào trên list cho biết list đang được sort theo tiêu chí nào.

**Giải pháp:** Thêm sort indicator: "Sắp xếp: Calo ↓" chip/badge gần đầu list.

### 3.5.4 Edit Modal (SC06_step11) — 🟡 MODERATE

Bottom sheet cho edit ingredient — approach hợp lý.

**Vấn đề:**

- Bottom sheet không có handle bar (drag indicator) ở top
- Không rõ user có thể swipe down để dismiss hay không
- Sheet height cố định hay adjustable?

**Giải pháp:**

1. Thêm drag handle bar (4px × 36px gray pill) ở top center
2. Support swipe-to-dismiss gesture
3. Sheet height auto-adjust theo content

---

## 3.6 Dish Management

**Screenshots phân tích:** SC07_step05, SC07_step08, SC07_step16, SC07_step20, SC07_step21

### Đánh giá tổng thể: 6/10

### 3.6.1 Ingredient Search trong Dish Creation (SC07_step05) — 🟡 MODERATE

Khi tạo dish, user search ingredients để thêm vào. Search results hiển thị danh sách ingredients.

**Vấn đề:** Search results cho ingredients trong dish creation KHÔNG hiển thị calories/protein per 100g — chỉ có tên. User không biết chọn ingredient nào nếu có nhiều loại tương tự.

**Giải pháp:** Hiển thị mini nutrition info: "Ức gà (165 kcal · 31g pro / 100g)"

### 3.6.2 Star Rating (SC07_step08) — 🔵 MINOR

Rating 3 sao cho dish — feature nhỏ nhưng neat.

**Vấn đề:** Stars nhỏ và khó tap. Star icons trên mobile cần ≥ 36px touch area.

**Giải pháp:** Tăng star size lên 28px icon trong 44px touch area.

### 3.6.3 Delete Confirmation (SC07_step16) — 🟡 MODERATE

Delete confirm dialog: trash icon (red), "Xóa món ăn?", tên món trong quotes, "Hành động này không thể hoàn tác.", buttons "Hủy" | "Xóa ngay"

**Điểm tốt:**

- Red trash icon tạo emotional weight
- Warning text rõ ràng
- Destructive action button (Xóa ngay) nằm bên phải — đúng convention

**Vấn đề:**

- "Hủy" button có green outline — NÊN là neutral/gray. Green = positive action = confuse khi đặt cạnh destructive "Xóa ngay"
- "Xóa ngay" dùng red filled — ĐÚNG
- Dialog chiếm quá ít không gian — text nhỏ, buttons nhỏ

**Giải pháp:**

```
"Hủy"   → Gray outlined button (border-gray-300, text-gray-700)
"Xóa ngay" → Red filled button (giữ nguyên)
```

### 3.6.4 Validation States (SC07_step20, SC07_step21) — 🟡 MODERATE

Empty name validation và no-ingredients validation hiển thị error messages.

**Vấn đề:** Cùng vấn đề như #ING-02 — validation chỉ là text đỏ, thiếu visual feedback trên input field.

---

## 3.7 AI Analysis Tab

**Screenshot phân tích:** SC38_step03, SC22_step27

### Đánh giá tổng thể: 6.5/10

### 3.7.1 Stepper UI (SC38_step03) — 🟡 MODERATE

3-step flow: "1. Chụp ảnh → 2. AI phân tích → 3. Lưu món"

**Điểm tốt:** Clear flow visualization.

**Vấn đề:**

- Step numbers trong circles quá nhỏ (~20px)
- Arrows "→" giữa steps lạc lõng — nên dùng connecting line/track
- Steps 2 và 3 greyed out OK, nhưng text color quá nhạt (contrast issue)

**Giải pháp:** Dùng standard stepper component:

```
(1)────(2)────(3)
Chụp   AI     Lưu
ảnh    phân    món
       tích
```

Circle + connecting line + label dưới. Active step = green filled circle + bold label. Inactive = gray outline + regular label.

### 3.7.2 Upload Zone — 🟡 MODERATE

Dashed border zone với "Chụp ảnh" và "Tải ảnh lên" options — standard pattern.

**Vấn đề:**

1. "Chụp ảnh" icon nằm bên trái, "Tải ảnh lên" bên phải — divider line giữa quá subtle
2. "Hỗ trợ JPG, PNG" text quá nhỏ
3. Toàn bộ zone KHÔNG có hover/press state feedback

**Giải pháp:**

- Tách thành 2 buttons rõ ràng (không phải shared zone)
- Hoặc: keep zone nhưng thêm dashed border animation khi hover/press
- Format support text lên 14px

### 3.7.3 "Phân tích món ăn" CTA — Tốt ✅

Green filled button nổi bật — đúng hierarchy.

### 3.7.4 Empty Result State — 🔵 MINOR

Phần dưới hiển thị placeholder image + "AI Phân tích hình ảnh" — nhưng đây là redundant với title ở trên.

**Giải pháp:** Thay bằng sample/demo: "Xem ví dụ kết quả phân tích →" để user hiểu output trước khi upload.

---

## 3.8 Fitness Tab (Tập luyện)

**Screenshots phân tích:** SC22_step17, SC26_step47, SC26_step58, SC29_step31, SC31_step50

### Đánh giá tổng thể: 6/10

### 3.8.1 Sub-tabs: Kế hoạch / Tiến trình / Lịch sử — 🟡 MODERATE

3 sub-tabs ở đầu page. "Tiến trình" active = green filled pill.

**Vấn đề:**

- Sub-tab icons quá nhỏ (~16px), khó nhận biết
- Text 2 dòng ("Kế hoạch") trong tab pill tạo chiều cao không đều
- Active tab pill quá wide, inactive tabs quá narrow → visual imbalance

**Giải pháp:**

- Icons 20px minimum
- Single-line labels (hoặc tất cả 2 dòng đều nhau)
- Equal width cho tất cả tabs hoặc proportional scaling

### 3.8.2 Weekly Day Selector (SC26_step47, SC31_step50) — 🟠 MAJOR

Row "T2 T3 T4 T5 T6 T7 CN" với colored circles cho training days (green filled) và rest days (no fill).

**Vấn đề nghiêm trọng:**

1. **T4 không có color** — xám nhạt, meaning unclear. Là rest day? Là ngày chưa plan? Là ngày đã qua chưa tập?
2. **T7 cũng xám** nhưng khác shade với T4 → KHÔNG NHẤT QUÁN
3. CN (hiện tại) có green border circle — tốt, nhưng CÙNG green với training days → confuse
4. **Không có legend** giải thích meaning của mỗi color

**Giải pháp:**

```
Legend cần thiết:
🟢 Ngày tập (green filled)
⭕ Ngày nghỉ (gray outline)
🔵 Hôm nay (blue ring) ← KHÁC green
✅ Đã hoàn thành (green check)
```

### 3.8.3 Workout Day Card (SC26_step47) — 🟡 MODERATE

Card "Buổi 1 + / T2 / Thân trên A" hiển thị exercises (Chống đẩy, Dip ngực, Hít xà đơn) với sets/reps.

**Điểm tốt:** Information density phù hợp — vừa đủ chi tiết.

**Vấn đề:**

1. "Buổi 1" green pill + "+" icon bên cạnh — "+" là thêm buổi? Thêm bài tập? Unclear.
2. Exercise list chỉ hiển thị 3 + "+3 bài tập nữa" — tốt cho space-saving, nhưng tap target cho "more" link quá nhỏ
3. "Chuyển thành ngày nghỉ" button nằm TRONG card — nên nằm ngoài hoặc trong menu (...)

**Giải pháp:**

1. "+" icon cần tooltip hoặc label: "Thêm buổi tập"
2. "+3 bài tập nữa" → underline + larger touch area
3. "Chuyển thành ngày nghỉ" → move to overflow menu (3-dot icon)

### 3.8.4 Tip Banner "Chạm 👈 để chỉnh bài tập..." — 🟠 MAJOR

Green banner với emoji và instructional text.

**Vấn đề nghiêm trọng:**

1. **Emoji 👈 KHÔNG rõ ràng** — "chạm 👈" nghĩa là chạm vào icon tay? Hay chạm vào bên trái? Cực kỳ ambiguous.
2. **Banner quá dài** — "Chạm 👈 để chỉnh bài tập • Chạm ngày để xem buổi tập" — 2 instructions trong 1 banner = cognitive overload
3. **X button để dismiss** — sau khi dismiss, user quên thì KHÔNG có cách xem lại

**Giải pháp:**

1. Thay bằng first-time tooltip (point to actual element)
2. Tách 2 instructions thành 2 tooltips riêng biệt
3. Thêm "?" help icon ở header để xem lại instructions bất cứ lúc nào
4. Bỏ emoji, dùng Lucide icon "Edit" và "Calendar"

### 3.8.5 Regenerate Plan Modal (SC26_step58) — 🔴 CRITICAL

**Vấn đề cực kỳ nghiêm trọng:** Modal "Tạo lại kế hoạch" có 2 buttons: "Hủy" và... **BUTTON THỨ 2 BỊ TRỐNG!**

Trong screenshot SC26_step58, button bên phải (confirm action) KHÔNG CÓ TEXT. Đây là BUG NGHIÊM TRỌNG hoặc rendering issue. User KHÔNG BIẾT nút đó làm gì.

**Giải pháp:** Fix ngay — button phải có text rõ ràng: "Tạo lại" (red/orange color vì đây là destructive action — xóa plan cũ).

---

## 3.9 Dashboard / Overview Tab (Tổng quan)

**Screenshots phân tích:** SC38_step05, SC30_step29

### Đánh giá tổng thể: 6.5/10

### 3.9.1 Welcome/Onboarding Hero Card (SC38_step05) — 🟡 MODERATE

Green gradient card: "Chào buổi sáng! Bắt đầu hành trình sức khỏe" + 3 checklist items.

**Điểm tốt:** Motivational, clear next steps, good use of numbered list.

**Vấn đề:**

1. Card quá cao (>200px) — chiếm quá nhiều viewport
2. Checklist items dùng green circles + numbers — nhưng không có checkmark khi completed
3. Card không dismissible — user đã hoàn thành 3 steps vẫn thấy card này?

**Giải pháp:**

1. Reduce height — compact layout
2. Checkmarks cho completed items: ✅ Thiết lập hồ sơ → 2. Lên kế hoạch... → 3. Ghi nhận...
3. Auto-hide khi 3/3 completed, hoặc add dismiss "×" button

### 3.9.2 Nutrition Summary Mini Card — 🟡 MODERATE

"🍽️ 0 Nạp vào — 🔥 0 Tiêu hao = 🎯 0 Cân bằng"

**Vấn đề:** CÙNG layout với Nutrition card ở Calendar tab → duplication. User thấy cùng thông tin ở 2 nơi khác nhau.

**Giải pháp:** Dashboard version nên SUMMARIZE, không duplicate:

```
Hôm nay: 0 / 2,641 kcal  [▓░░░░░░░░░] 0%
          0 / 150g protein [▓░░░░░░░░░] 0%
```

Compact hơn, informative hơn.

### 3.9.3 Recovery Day Card — Tốt ✅

"Ngày nghỉ phục hồi" với tips (ngủ đủ giấc, ăn giàu protein) + quick actions (Ghi cân nặng, Ghi cardio).

**Điểm tốt:** Contextual — biết hôm nay là rest day nên đưa ra lời khuyên phù hợp.

**Vấn đề nhỏ:** Icon sử dụng emoji (😴, 🍗) thay vì Lucide icons.

### 3.9.4 Weight & Streak Section — 🟡 MODERATE

2 mini cards: "Chưa có dữ liệu cân nặng" + "Chưa có chuỗi tập"

**Vấn đề:**

1. Empty state text quá nhỏ
2. Không có CTA button rõ ràng — "Ghi cân nặng đầu tiên" text link nhỏ
3. 2 cards side-by-side nhưng content heights khác nhau

**Giải pháp:**

```
┌── Cân nặng ──┐  ┌── Chuỗi tập ──┐
│ ⚖️ — kg      │  │ 🔥 0 ngày     │
│              │  │               │
│ [Ghi ngay]   │  │ [Bắt đầu]    │
└──────────────┘  └───────────────┘
```

Equal height, CTA button trong card.

### 3.9.5 Tips/Insights Section — 🔵 MINOR

"Chất xơ 🥗 Ăn rau trước bữa ăn giúp no lâu hơn..."

**Điểm tốt:** Personalized tips dựa trên context.

**Vấn đề:** Emoji icons (🥗), dismissible "×" quá nhỏ (~24px touch area).

---

## 3.10 Settings Page

**Screenshots phân tích:** SC16_step28, SC22_step20, SC03_step67

### Đánh giá tổng thể: 7/10

Đây là một trong những pages thiết kế TỐT NHẤT. Card-based rows với icons + text + chevron arrows — clean, standard, effective.

### 3.10.1 Settings Navigation — Tốt ✅

Sections rõ ràng:

- Hồ sơ sức khỏe (BMR/TDEE info)
- Mục tiêu cân nặng
- Hồ sơ tập luyện
- Theme switcher
- Google Drive sync
- Dữ liệu

### 3.10.2 Theme Switcher (SC16_step28) — 🔵 MINOR

4 options: Sáng | Tối | Hệ thống | Tự động

**Vấn đề:** "Hệ thống" vs "Tự động" — user KHÔNG hiểu sự khác biệt. "Hệ thống" = theo OS setting. "Tự động" = theo giờ? Theo location? Cần tooltip/description.

**Giải pháp:**

```
🌞 Sáng — Luôn sáng
🌙 Tối  — Luôn tối
📱 Theo hệ thống — Theo cài đặt điện thoại
🌓 Tự động — Sáng ban ngày, tối ban đêm
```

### 3.10.3 Goal Detail View (SC03_step67) — 🟡 MODERATE

"Mục tiêu cân nặng" detail hiển thị: Duy trì, 5/4/2026, Mục tiêu: Duy trì, Cân nặng mục tiêu: 75kg, Chênh lệch calories: ±0 kcal

**Vấn đề:**

1. QUẢNG TRƯỜNG WHITE SPACE — content chỉ chiếm 1/4 screen, 3/4 còn lại trống
2. "Duy trì" text + date bên trái, nhưng icon "—" bên trái text quá subtle
3. "Chỉnh sửa" button ở top-right — tốt, nhưng thiếu visual weight

**Giải pháp:**

1. Thêm chart/visual: ví dụ mini weight trend chart, hoặc comparison card (hiện tại vs mục tiêu)
2. Sử dụng white space cho helpful content thay vì để trống

### 3.10.4 Backup / Google Drive Sync (SC16_step28) — 🟡 MODERATE

Section "Google Drive" với sync button.

**Vấn đề:**

- Không rõ last sync time
- Không có progress indicator cho sync in-progress
- Không có error state design

**Giải pháp:**

```
☁️ Google Drive
   Lần đồng bộ cuối: 5/4/2026, 14:30
   [🔄 Đồng bộ ngay]  [⚙️ Cài đặt]
```

---

## 3.11 Training Profile Form

**Screenshots phân tích:** SC25_step31, SC25_step40, SC25_step50, SC25_step63

### Đánh giá tổng thể: 5/10

### 3.11.1 Form Overwhelming — 🔴 CRITICAL

SC25_step63 cho thấy form với TẤT CẢ fields filled — và nó QUÀI DÀI. Tôi đếm ít nhất 10+ fields:

- Mục tiêu tập luyện
- Kinh nghiệm
- Số ngày tập/tuần
- Thời lượng
- Thiết bị
- Nhóm cơ ưu tiên (multi-select!)
- Giờ ngủ
- Thời gian nghỉ giữa hiệp
- Cycle weeks
- Và nhiều hơn...

**Bài học 50 năm kinh nghiệm:** KHÔNG BAO GIỜ cho user điền form 10+ fields trong 1 screen duy nhất. Nó áp đảo. Nó khiến user bỏ cuộc. Đây là nguyên lý "Progressive Disclosure" — chỉ hiện thông tin cần thiết tại thời điểm hiện tại.

**Giải pháp:**
Chia form thành 3-4 sections collapsible:

```
▼ Thông tin cơ bản (required)
  • Mục tiêu
  • Kinh nghiệm
  • Số ngày tập

▼ Tùy chỉnh nâng cao (optional)
  • Thời lượng
  • Thiết bị
  • Nhóm cơ ưu tiên

▼ Phục hồi & Giấc ngủ (optional)
  • Giờ ngủ
  • Nghỉ giữa hiệp

▼ Chu kỳ tập (optional)
  • Cycle weeks
  • ...
```

Hoặc tốt hơn: multi-step form wizard (giống onboarding) — 1 question per screen.

### 3.11.2 Muscle Group Multi-Select (SC25_step50) — 🟡 MODERATE

Toggle buttons cho muscle groups (Ngực, Lưng, Vai, Tay, Bụng, Chân, Mông...).

**Vấn đề:** Toggle buttons packed too tight — touch targets < 44px. Text wrapping có thể xảy ra trên small screens.

**Giải pháp:**

- Min height 44px per toggle
- 8px gap giữa toggles
- Max 3 toggles per row

### 3.11.3 Sleep/Advanced Fields (SC25_step40) — 🔵 MINOR

"Giờ ngủ" và advanced fields visible khi expanded.

**Vấn đề:** "Giờ ngủ" nên dùng time picker (wheel), không phải text input. Input "7" hours — nhưng unit không rõ (hours? score?).

**Giải pháp:** Slider (4h — 12h) hoặc stepper (+/-) buttons quanh number display.

---

## 3.12 Workout Logger

**Screenshots phân tích:** SC28_step04, SC28_step08, SC28_step62, SC43_step31, SC43_step40

### Đánh giá tổng thể: 6/10

### 3.12.1 Activity Type Selection (SC28_step04) — 🟡 MODERATE

Cycling selected, hiển thị icon + activity name.

**Vấn đề:**

- Activity list layout không visible trong screenshot — nhưng icon cho cycling là standard bike icon. Tốt.
- KHÔNG RÕ bao nhiêu activity types available
- Không có search/filter nếu list dài

### 3.12.2 Manual Mode (SC28_step08) — 🟡 MODERATE

Form nhập: duration, distance, calories.

**Vấn đề:**

- Input labels nhỏ
- No unit indicators inline (phút, km, kcal)
- Keyboard type không rõ (nên là numeric)

### 3.12.3 Stopwatch Combo (SC28_step62) — 🟡 MODERATE

Stopwatch UI với timer display + exercise info.

**Vấn đề:**

- Timer font nhỏ — đây là MAIN FOCUS element, phải DOMINANT (>48px)
- Start/Stop/Reset buttons cần ≥ 56px touch target
- During workout, screen should NOT dim/lock

### 3.12.4 Set Logging (SC43_step31) — 🟠 MAJOR

First set logged: weight + reps display.

**Vấn đề:**

1. **Input fields cho weight/reps quá nhỏ** — user đang tập gym, tay mồ hôi, cầm điện thoại không vững → cần BIG touch targets
2. **Không có quick-fill options** — nếu user thường làm 10 reps × 60kg, nên có "Copy previous set" button
3. **RPE (Rate of Perceived Exertion)** nếu có, cần visual scale (1-10 colored bar), không phải text input

**Giải pháp:**

```
Set 1:  [60.0 kg]  ×  [10 reps]  [RPE 7]  ✅
Set 2:  [60.0 kg]  ×  [10 reps]  [RPE _]
        ^^^^^^^^      ^^^^^^^^^
        Large font    Large font
        48px touch    48px touch

[📋 Copy set trước] [+ Thêm set]
```

### 3.12.5 Workout Summary (SC43_step40) — 🔵 MINOR

E2E summary hiển thị workout stats.

**Vấn đề nhỏ:** Summary card thiếu:

- Total volume (weight × reps across all sets)
- PR badges (if any personal records broken)
- Share button

---

## 3.13 Fitness Progress Dashboard

**Screenshots phân tích:** SC30_step29, SC30_step31, SC30_step36, SC30_step37, SC30_step39

### Đánh giá tổng thể: 6/10

### 3.13.1 Hero Card (SC30_step29) — 🟠 MAJOR

Green gradient card: "Khối lượng tuần này / +74% / —"

**Vấn đề nghiêm trọng:**

1. **"+74%" text QUÀI LỚN** (~48px) nhưng "—" bên cạnh rất nhỏ — visual balance lệch
2. **Không giải thích "+74%" so với gì** — so với tuần trước? So với tháng trước? So với all-time?
3. **Dashed lines** ở bottom card — không rõ đây là chart placeholder, pagination dots, hay decorative
4. **Green rectangle** ở góc phải bottom — purpose unclear (scroll indicator? mini chart?)

**Giải pháp:**

```
┌─ Khối lượng tuần này ────────────────┐
│  📊 Tăng 74%                         │
│  so với tuần trước                   │
│  ███████████████████░░░ 74%          │
│                                      │
│  Tổng: 12,500 kg    5 buổi tập      │
└──────────────────────────────────────┘
```

### 3.13.2 Stat Cards Row (SC30_step29, SC30_step37) — 🔴 CRITICAL

Horizontal scroll row: Cân nặng (75kg), 1RM ước tính (80kg/87kg), Tuân thủ (25%/0%/100%)

**VẤN ĐỀ CỰC KỲ NGHIÊM TRỌNG:** Cards bị CẮT BÊN PHẢI. "25%" → chỉ thấy "25" + "%" bị cắt. "Tuân" → chỉ thấy "Tuân" phần sau bị crop. Đây là BUG LAYOUT NGHIÊM TRỌNG trên mobile.

**Bằng chứng:** SC30_step29: thẻ thứ 3 bị crop rõ ràng. SC30_step37: tương tự.

**Nguyên nhân kỹ thuật:** Horizontal scroll container không có padding-right, hoặc last item không có margin-right, hoặc container overflow:hidden không scroll snap đúng.

**Giải pháp:**

1. **Immediate fix:** Thêm padding-right: 16px cho scroll container
2. **Better fix:** Nếu chỉ có 3 cards → KHÔNG CẦN horizontal scroll → dùng 3-column grid
3. **Best fix:** Responsive layout:
   - 3 cards → grid (không scroll)
   - 4+ cards → horizontal scroll với peek indicator

```css
.stat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  /* KHÔNG dùng overflow-x: auto cho 3 items */
}
```

### 3.13.3 Cân nặng Card "—" (SC30_step37) — 🟡 MODERATE

Khi chưa có data, hiển thị "—" cho Cân nặng. Nhưng "—" quá subtle — giống một bug render hơn là empty state.

**Giải pháp:** Hiển thị: "-- kg" + "Chạm để ghi" subtitle.

### 3.13.4 1RM Sheet (SC30_step39) — 🟡 MODERATE

Bottom sheet "1RM ước tính" với time range tabs (1W, 1M, 3M, all) + chart area.

**Điểm tốt:** Time range filter tabs — clean.

**Vấn đề:**

1. Chart area hiển thị green rectangle trống — no data visualization visible
2. "1W" tab active = green filled pill — but "1W" (1 Week tiếng Anh) trong app tiếng Việt → inconsistent. Nên dùng "1T" (1 Tuần) hoặc "1 tuần"
3. Close button "×" nhỏ (< 44px touch area)

**Giải pháp:**

- "1W" → "1T", "1M" → "1Th", "3M" → "3Th", "all" → "Tất cả"
- Chart khi empty cần placeholder: "Chưa có dữ liệu. Ghi nhận buổi tập để xem biểu đồ."

### 3.13.5 Tiến trình chu kỳ Card — 🔵 MINOR

"Tiến trình chu kỳ: Tuần 1/8" với progress bar.

**Điểm tốt:** Simple, informative.

**Vấn đề nhỏ:** Progress bar quá thin (~4px). Không có color gradient.

---

## 3.14 Dark Mode

**Screenshots phân tích:** SC22_step04 (body), SC22_step05 (cards), SC22_step06 (modal), SC22_step12 (nutrition), SC22_step13 (library), SC22_step17 (fitness), SC22_step20 (settings detail), SC22_step27 (AI), SC22_step30 (final light)

### Đánh giá tổng thể: 7/10

Dark mode là một STRONG POINT của app. Triển khai khá tốt:

- Background dark gray (không phải pure black) — dễ nhìn
- Cards surface lighter gray — tạo depth
- Text contrast adequate
- Green accent vẫn pop trên dark background

### 3.14.1 Card Borders trong Dark Mode — 🔵 MINOR

Một số cards mất viền trong dark mode (cùng color với background) → cards "trôi" trên page.

**Giải pháp:** Thêm subtle border: `border: 1px solid rgba(255,255,255,0.08)` cho dark mode cards.

### 3.14.2 Green on Dark Contrast — 🟡 MODERATE

Green (#16a34a) trên dark background có contrast OK cho large text nhưng có thể insufficient cho small text.

**Giải pháp:** Dùng lighter green (#22c55e hoặc #4ade80) cho text trên dark backgrounds. Giữ darker green cho filled buttons.

### 3.14.3 Modal in Dark Mode (SC22_step06) — 🔵 MINOR

Modal backdrop opacity đúng — dims underlying content. Modal card uses dark surface.

**Vấn đề nhỏ:** Modal border-radius có thể khác với light mode (chưa verify, nhưng cần ensure consistency).

### 3.14.4 Image/Icon Colors — 🟡 MODERATE

Lucide icons trong dark mode nên switch sang lighter stroke color. Nếu icons dùng `currentColor` thì auto-switch. Nhưng nếu có hardcoded colors → won't adapt.

**Verify cần thiết:** Grep source cho hardcoded icon colors.

---

## 3.15 Modals & Dialogs

**Screenshots phân tích:** SC07_step16 (delete), SC42_step10 (unsaved changes), SC11_step49, SC26_step56 (regenerate), SC26_step65 (add session)

### Đánh giá tổng thể: 5.5/10

### 3.15.1 Delete Confirm Dialog (SC07_step16) — Covered in 3.6.3

### 3.15.2 Unsaved Changes Dialog (SC42_step10) — 🟡 MODERATE

3 options: "Lưu & quay lại" | "Bỏ thay đổi" | "Ở lại chỉnh sửa"

**Điểm tốt:** 3 clear options covering all cases.

**Vấn đề:**

1. "Lưu & quay lại" — dùng "&" thay vì "và" trong UI tiếng Việt → inconsistent với tone
2. Buttons arrangement — stacked vertically → tốt cho readability nhưng dialog quá tall
3. No icon cho mỗi option để quick-scan

**Giải pháp:**

```
💾 Lưu và quay lại  ← Primary (green filled)
🗑️ Bỏ thay đổi     ← Destructive (red outlined)
✏️ Ở lại chỉnh sửa  ← Secondary (gray outlined)
```

### 3.15.3 Regenerate Plan Modal (SC26_step58) — 🔴 CRITICAL (đã nói ở 3.8.5)

Button text MISSING — critical rendering bug.

### 3.15.4 Add Session Modal (SC26_step65) — Chưa thấy rõ trong screenshots

### 3.15.5 Pattern Inconsistency Across Modals — 🟠 MAJOR

Tôi thấy ÍT NHẤT 3 modal patterns khác nhau:

1. **Center modal** (delete confirm SC07_step16): Centered, small, 2 buttons horizontal
2. **Bottom sheet** (template manager SC13_step35): Full-width bottom, scrollable content
3. **Dialog** (unsaved changes SC42_step10): Centered, 3 buttons vertical

**Bài học:** Cần standardize:

- **Alert/Confirm** → Center dialog, max 2 horizontal buttons
- **Selection/Form** → Bottom sheet
- **Full content** → Full-screen page (pushPage)

---

## 3.16 Empty States

**Screenshots phân tích:** SC06_step48, SC29_step31, SC42_step05, SC30_step37

### Đánh giá tổng thể: 5/10

### 3.16.1 Search No Results (SC06_step48) — 🟠 MAJOR

"Không tìm thấy" — đó là TẤT CẢ. Một dòng text. Không icon. Không illustration. Không suggestion. Không CTA.

**Bài học thiết kế empty states (quan trọng nhất trong UI design):**

Empty states là CƠ HỘI, không phải dead end. Mỗi empty state phải có 3 thành phần:

1. **Illustration** — custom hoặc icon lớn (64px+)
2. **Message** — giải thích TẠI SAO trống + PHẢI LÀM GÌ
3. **CTA** — button hoặc link để hành động

```
     🔍
Không tìm thấy "abc"

Thử kiểm tra chính tả hoặc
dùng từ khóa khác

[+ Tạo nguyên liệu "abc"]  ← CTA!
```

### 3.16.2 Empty Workout History (SC29_step31) — 🟡 MODERATE

"Chưa có lịch sử tập luyện / Bắt đầu tập để xem lịch sử tại đây"

**Điểm tốt:** Có icon (clipboard) và descriptive text.

**Vấn đề:** Thiếu CTA button. "Bắt đầu tập" text không clickable (hoặc nếu có thì không rõ ràng).

**Giải pháp:** Thêm: [🏋️ Ghi buổi tập đầu tiên] button.

### 3.16.3 Empty Exercise List (SC42_step05) — 🟡 MODERATE

Exercise editor với 0 exercises.

**Điểm tốt:** Có Lucide icon + text.

**Vấn đề:** CTA "Thêm bài tập" quá subtle (nếu chỉ là text link).

### 3.16.4 General Pattern — 🟠 MAJOR

Empty states THIẾU NHẤT QUÁN giữa các screens:

- Ingredient search no match: chỉ text, no icon
- Workout history empty: icon + text, no CTA
- Exercise list empty: icon + text, CTA có thể subtle

**Giải pháp:** Tạo shared `EmptyState` component:

```tsx
<EmptyState
  icon={<SearchX size={64} />}
  title="Không tìm thấy"
  description="Thử kiểm tra chính tả hoặc dùng từ khóa khác"
  action={{ label: 'Tạo mới', onClick: handleCreate }}
/>
```

---

## 3.17 Toast Notifications

**Screenshot phân tích:** SC31_step50

### Đánh giá tổng thể: 7/10

### 3.17.1 Success Toast Design (SC31_step50) — 🟡 MODERATE

Toast "Đã lưu / 74 kg / ↩ Hoàn tác" — green left border, checkmark icon.

**Điểm tốt:**

- Clear message
- Undo action available — EXCELLENT UX pattern
- Dismissible with "×"
- Green accent for success

**Vấn đề:**

1. **2 toasts stacked** (74 kg + 74.5 kg) — nên chỉ show latest, auto-dismiss previous
2. **"↩ Hoàn tác" text link** — touch target quá nhỏ, khó tap chính xác
3. **Toast position** — top of screen, nhưng có thể bị status bar overlap

**Giải pháp:**

1. Max 1 toast visible, queue system cho multiple
2. "Hoàn tác" button ≥ 44px height
3. Toast top margin ≥ safe area top inset + 8px

---

## 3.18 Template Manager

**Screenshot phân tích:** SC13_step35

### Đánh giá tổng thể: 6.5/10

### 3.18.1 Bottom Sheet Layout — 🟡 MODERATE

"Quản lý mẫu bữa ăn" bottom sheet:

- Search bar "Tìm kiếm template..."
- Template card: "Bữa ăn ngày thường" / "2 món · Tạo lúc 5/4/2026"
- Actions: "Áp dụng" (green), "Đổi tên" (text), "Xóa" (text)

**Điểm tốt:** Clean layout, clear actions, search available.

**Vấn đề:**

1. "template" trong search placeholder — dùng tiếng Anh trong app tiếng Việt → "Tìm kiếm mẫu..."
2. "Áp dụng" / "Đổi tên" / "Xóa" inline — action priority không rõ. "Xóa" nên separated (dangerous)
3. Template card thiếu preview — "2 món" nhưng món gì?

**Giải pháp:**

```
Bữa ăn ngày thường
2 món · Tạo lúc 5/4/2026
📋 Trứng ốp la (2 quả), Yến mạch sữa chua

[✅ Áp dụng]  [✏️ Đổi tên]
              [🗑️ Xóa]  ← Tách riêng, color red
```

---

## 3.19 Filter & Sort System

**Screenshot phân tích:** SC02_step11

### Đánh giá tổng thể: 7/10

### 3.19.1 Sort/Filter Bottom Sheet (SC02_step11) — Tốt!

**Điểm tốt:**

- Sắp xếp section: 6 options (Tên A-Z, Z-A, Calo ↑↓, Protein ↑↓) — comprehensive
- Bộ lọc nhanh: "< 300 kcal", "< 500 kcal", "Protein cao (≥20g)" — practical shortcuts
- "Đặt lại" + "Áp dụng" buttons — standard confirm pattern
- Chip-based selections — easy to tap and scan

**Vấn đề:**

1. Active sort chip (Tên A-Z green filled) — nhưng "Đặt lại" button sẽ clear nó? Cần clear indicator
2. Filter chips không multi-select indicator — có thể chọn cả "< 300 kcal" VÀ "Protein cao" không?
3. Bottom padding — "Áp dụng" button quá sát bottom edge

**Giải pháp:**

1. "Đặt lại" button thêm count: "Đặt lại (2)" khi có 2 filters active
2. Cho phép multi-select + hiện "X" icon trên mỗi active chip
3. Bottom padding ≥ 16px + safe area bottom inset

---

# PHẦN IV: VẤN ĐỀ XUYÊN SUỐT (Cross-cutting Concerns)

## 4.1 Touch Target Size — 🔴 CRITICAL

**Đây là vấn đề #1 của toàn bộ ứng dụng.**

Material Design guidelines yêu cầu minimum 48dp × 48dp cho touch targets. Apple HIG yêu cầu 44pt × 44pt. Tôi thấy NHIỀU elements vi phạm:

| Element               | Estimated size | Required | Location    |
| --------------------- | -------------- | -------- | ----------- |
| Toast "Hoàn tác" link | ~30px          | 44px     | SC31_step50 |
| Day selector dots     | ~32px          | 48px     | SC26_step47 |
| Star rating icons     | ~28px          | 44px     | SC07_step08 |
| Tip dismiss "×"       | ~24px          | 44px     | SC38_step05 |
| Filter chip text      | ~32px height   | 44px     | SC02_step11 |
| Close "×" on sheets   | ~36px          | 44px     | SC13_step35 |
| "+3 bài tập nữa" link | ~30px          | 44px     | SC26_step47 |

**Giải pháp tổng quát:**

```css
/* Global touch target minimum */
button,
a,
[role='button'],
input,
select,
[role='tab'] {
  min-height: 44px;
  min-width: 44px;
}

/* For icon buttons that appear smaller */
.icon-button {
  padding: 12px; /* icon 20px + 12px×2 padding = 44px total */
}
```

## 4.2 Loading States — 🟠 MAJOR

Tôi KHÔNG THẤY bất kỳ loading state nào trong screenshots. Khi app:

- Tính toán BMR/TDEE
- Load danh sách ingredients từ SQLite
- Sync với Google Drive
- AI phân tích hình ảnh

...user thấy gì? Blank screen? Frozen UI?

**Giải pháp:** Skeleton screens cho lists, spinner cho actions, progress bar cho uploads:

```
[Skeleton]  — Thay thế empty areas trong khi data loading
[Spinner]   — Overlay trên buttons: [🔄 Đang lưu...]
[Progress]  — Bar ở top cho background tasks
```

## 4.3 Error States — 🟠 MAJOR

Tương tự loading, tôi KHÔNG THẤY error states ngoài form validation. Khi:

- SQLite query fails
- Google Drive sync fails
- AI analysis returns error
- Network unavailable (offline app, nhưng Drive sync cần network)

...user thấy gì?

**Giải pháp:** Mỗi async action cần 3 states: Loading → Success → Error

```
Error state template:
  ⚠️ [Icon]
  Đã xảy ra lỗi
  [Mô tả cụ thể: "Không thể đồng bộ với Google Drive"]
  [🔄 Thử lại]  [❌ Bỏ qua]
```

## 4.4 Accessibility (a11y) — 🟠 MAJOR

Từ screenshots, tôi identify several accessibility concerns:

1. **Color-only information:** Workout day status dùng CHỈ MÀU SẮC (green filled = workout, gray = rest) — colorblind users cannot distinguish. Cần thêm icon/pattern.

2. **Text contrast:** Several subtitle/caption texts appear too light, especially in dark mode.

3. **Screen reader labels:** Cannot verify from screenshots, but MUST ensure:
   - All buttons have aria-label
   - All icons have aria-hidden or aria-label
   - Form fields have associated labels
   - Modals have role="dialog" + aria-modal

4. **Focus management:** When modals open, focus should trap inside. When modals close, focus should return to trigger element.

## 4.5 Animation & Transitions — 🟡 MODERATE

Không thể đánh giá animations từ static screenshots, nhưng các nguyên tắc cần tuân thủ:

1. **Page transitions:** pushPage() nên có slide-in animation (300ms ease-out)
2. **Bottom sheets:** Slide up từ bottom (250ms ease-out)
3. **Modals:** Fade in + scale up (200ms ease-in-out)
4. **Tab switches:** Cross-fade content (150ms)
5. **Toasts:** Slide in from top (200ms) + auto-dismiss with fade out (3000ms)

**Quy tắc:** Không animation > 400ms. Không bounce/spring effects trừ khi có lý do. Motion reduce preference phải được respect.

## 4.6 Scroll Behavior — 🟡 MODERATE

Nhiều screens có content dài hơn viewport (Settings, Training Profile, Dashboard). Cần đảm bảo:

1. **Sticky headers:** Page headers nên sticky khi scroll down
2. **Bottom nav:** Nên hide on scroll down, show on scroll up (auto-hide pattern)
3. **Scroll-to-top:** Long lists cần button "⬆️" ở góc phải bottom
4. **Pull-to-refresh:** Cho lists có thể update (ingredients, meals)

## 4.7 Data Formatting — 🔵 MINOR

Inconsistencies trong cách hiển thị numbers:

- Calories: "165 kcal" vs "165kcal" (space inconsistency)
- Weight: "75 kg" vs "75kg"
- Protein: "31g" vs "31 g"
- Percentage: "74%" vs "+74%"

**Giải pháp:** Standardize:

```
Calories:   1,704 kcal (with comma separator, space before unit)
Weight:     75 kg (space before unit)
Protein:    31g (no space — convention in nutrition)
Percentage: +74% (no space, sign prefix)
Dates:      5/4/2026 or "5 tháng 4, 2026"
```

## 4.8 Vietnamese Text Considerations — 🟡 MODERATE

Tiếng Việt có đặc thù:

1. **Dấu:** Characters with diacritics are taller (ầ, ẩ, ẫ, ấ, ậ) — cần line-height lớn hơn
2. **Word length:** Vietnamese words tend to be shorter → sentences have more words → need more horizontal space
3. **No natural word-breaking:** Vietnamese words CAN break at syllable boundaries, nhưng `word-break: break-word` có thể break ở chỗ sai

**Giải pháp:**

```css
html[lang='vi'] {
  line-height: 1.6;
  word-break: keep-all;
  overflow-wrap: break-word;
}
```

---

# PHẦN V: BẢNG TÓM TẮT MỨC ĐỘ NGHIÊM TRỌNG

## 🔴 CRITICAL Issues (Fix NGAY)

| #   | Issue                                | Location                       | Description                                  |
| --- | ------------------------------------ | ------------------------------ | -------------------------------------------- |
| C1  | Touch targets < 44px                 | Xuyên suốt app                 | Nhiều buttons/links quá nhỏ để tap chính xác |
| C2  | Stat cards bị crop                   | Fitness Progress (SC30)        | Horizontal scroll cards bị cắt bên phải      |
| C3  | Regenerate button trống              | SC26_step58                    | Confirm button không có text                 |
| C4  | Confirmation screen thiếu giải thích | SC01_step14                    | BMR/TDEE/Target không giải thích             |
| C5  | Form required fields không marked    | Ingredient form, Training form | User không biết field nào bắt buộc           |
| C6  | Training profile form quá dài        | SC25_step63                    | 10+ fields trong 1 screen = overwhelm        |
| C7  | Set logging inputs quá nhỏ           | SC43_step31                    | Gym context = cần BIG inputs                 |
| C8  | Thiếu loading/error states           | Xuyên suốt                     | Không thấy skeleton/spinner/error screens    |

## 🟠 MAJOR Issues (Fix trong sprint hiện tại)

| #   | Issue                                  | Location         |
| --- | -------------------------------------- | ---------------- |
| M1  | Monochromatic green overload           | Toàn app         |
| M2  | Type scale không nhất quán             | Xuyên suốt       |
| M3  | Spacing không theo system              | Xuyên suốt       |
| M4  | Card styles 5+ variants                | Xuyên suốt       |
| M5  | DOB input format ambiguous             | Onboarding       |
| M6  | Nutrition card khi data=0              | Calendar home    |
| M7  | Day selector thiếu legend              | Fitness tab      |
| M8  | Form validation chỉ text, thiếu visual | Forms            |
| M9  | Empty states thiếu nhất quán           | Search, lists    |
| M10 | Modal patterns thiếu standard          | Dialogs/sheets   |
| M11 | Workout day card UX issues             | Fitness plan     |
| M12 | Hero card numbers không giải thích     | Fitness progress |
| M13 | Tip banner emoji & ambiguity           | Fitness plan     |
| M14 | Accessibility: color-only info         | Workout days     |
| M15 | 2 toasts stacked                       | Notifications    |

## 🟡 MODERATE Issues (Fix trong 2-3 sprints)

_(22 issues — xem chi tiết ở các sections trên)_

## 🔵 MINOR Issues (Backlog)

_(18 issues — xem chi tiết ở các sections trên)_

---

# PHẦN VI: LỘ TRÌNH SỬA CHỮA ĐỀ XUẤT

## Sprint 1: Foundation & Critical Fixes

**Goal:** Fix tất cả CRITICAL issues + thiết lập Design System

1. **Thiết lập Design Tokens:**
   - Color palette (Primary, Accent, Semantic colors)
   - Type Scale (8 levels, cố định)
   - Spacing Scale (8px grid)
   - Shadow levels (3 levels)
   - Border radius (3 levels: sm=8, md=12, lg=16)

2. **Fix Touch Targets:**
   - Audit TẤT CẢ interactive elements
   - Min 44px × 44px
   - Add padding as needed

3. **Fix Layout Bugs:**
   - Horizontal scroll card cropping
   - Regenerate modal missing button text
   - Toast stacking

4. **Fix Onboarding:**
   - BMR/TDEE/Target explanations
   - Required field indicators
   - DOB input improvement

## Sprint 2: Component Standardization

**Goal:** Nhất quán hóa components across app

1. **Card System:** 3 levels (Surface, Elevated, Featured)
2. **Button System:** 5 variants (Primary, Secondary, Tertiary, Ghost, Destructive)
3. **Modal System:** 3 patterns (Alert, Selection Sheet, Full Page)
4. **Empty State Component:** Shared, reusable
5. **Form Validation UX:** Visual + Textual + Behavioral

## Sprint 3: UX Polish

**Goal:** Nâng cấp trải nghiệm tổng thể

1. **Loading States:** Skeleton screens, spinners
2. **Error States:** Standard error template
3. **Animations:** Page transitions, modal animations
4. **Accessibility Pass:** WCAG AA compliance
5. **Vietnamese Typography:** Line-height, word-break

## Sprint 4: Advanced Improvements

**Goal:** Từ "good" lên "great"

1. **Data Visualization:** Macro color coding, progress charts
2. **Contextual Help:** Tooltips, onboarding coaches
3. **Workout Logger Redesign:** Big inputs, copy-set, PR badges
4. **Training Profile Redesign:** Multi-step wizard
5. **Dashboard Optimization:** Unique content vs Calendar duplication

---

# PHỤ LỤC

## A. Design Token Reference

```css
/* Proposed Design Tokens */
:root {
  /* Colors - Primary */
  --color-primary-50: oklch(0.97 0.02 155); /* lightest green */
  --color-primary-100: oklch(0.94 0.05 155);
  --color-primary-500: oklch(0.65 0.18 155); /* main green */
  --color-primary-600: oklch(0.58 0.18 155); /* darker, for text on light */
  --color-primary-700: oklch(0.5 0.16 155); /* darkest, for heavy emphasis */

  /* Colors - Accent */
  --color-accent-500: oklch(0.65 0.14 200); /* teal/cyan for info */

  /* Colors - Semantic */
  --color-success: oklch(0.7 0.18 145);
  --color-warning: oklch(0.8 0.16 85);
  --color-error: oklch(0.6 0.22 25);
  --color-info: oklch(0.65 0.14 230);

  /* Colors - Macro Nutrients */
  --color-protein: oklch(0.6 0.16 250); /* blue */
  --color-fat: oklch(0.7 0.16 55); /* orange */
  --color-carbs: oklch(0.8 0.16 95); /* yellow */
  --color-calories: oklch(0.6 0.2 25); /* red/rose */

  /* Typography */
  --font-display: 2.25rem; /* 36px */
  --font-h1: 1.75rem; /* 28px */
  --font-h2: 1.375rem; /* 22px */
  --font-h3: 1.125rem; /* 18px */
  --font-body-lg: 1rem; /* 16px */
  --font-body: 0.875rem; /* 14px */
  --font-caption: 0.75rem; /* 12px */
  --font-overline: 0.6875rem; /* 11px */

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.12);

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-full: 9999px;
}
```

## B. Component Audit Checklist

Sử dụng checklist này cho MỖI component trong app:

- [ ] Touch target ≥ 44px × 44px
- [ ] Text contrast ratio ≥ 4.5:1 (body) / 3:1 (large)
- [ ] Spacing follows 8px grid
- [ ] Font size follows type scale
- [ ] Has loading state
- [ ] Has error state
- [ ] Has empty state (nếu applicable)
- [ ] Dark mode supported
- [ ] aria-label/role defined
- [ ] Vietnamese text line-height adequate
- [ ] Works on 320px width (smallest mobile)
- [ ] Works on 428px width (largest mobile)

## C. Screenshot Reference Map

| Screenshot     | Page/Component         | Section tham chiếu |
| -------------- | ---------------------- | ------------------ |
| SC01_step07    | Onboarding DOB         | 3.1.2              |
| SC01_step11    | Activity Level         | 3.1.3              |
| SC01_step13    | Goal Selection         | 3.1.4              |
| SC01_step14    | Confirmation           | 3.1.5              |
| SC01_step16    | Duration Select        | 3.1.7              |
| SC01_step24    | Plan Preview           | 3.1.6              |
| SC02_step11    | Filter Sheet           | 3.19               |
| SC02_step12    | Meal Planner           | 3.3                |
| SC03_step67    | Goal Detail            | 3.10.3             |
| SC04_step01    | Home/Calendar          | 3.2                |
| SC06_step06    | Ingredient Form        | 3.5.1              |
| SC06_step34    | Validation Error       | 3.5.2              |
| SC06_step46    | Search Match           | 3.5.3              |
| SC06_step48    | Search No Match        | 3.16.1             |
| SC07_step05    | Dish Ingredient Search | 3.6.1              |
| SC07_step08    | Star Rating            | 3.6.2              |
| SC07_step16    | Delete Confirm         | 3.6.3              |
| SC13_step35    | Template Manager       | 3.18               |
| SC16_step28    | Settings/Backup        | 3.10               |
| SC19_step27    | Planner Opened         | 3.3                |
| SC22_step04-30 | Dark Mode Series       | 3.14               |
| SC25_step63    | Training Profile       | 3.11               |
| SC26_step47    | Training Plan Day      | 3.8                |
| SC26_step58    | Regenerate Modal       | 3.15.3             |
| SC28_step04-62 | Workout Logger         | 3.12               |
| SC29_step31    | Empty History          | 3.16.2             |
| SC30_step29-39 | Fitness Progress       | 3.13               |
| SC31_step50    | Toast/XSS              | 3.17               |
| SC38_step03    | AI Analysis            | 3.7                |
| SC38_step05    | Dashboard              | 3.9                |
| SC42_step05    | Empty Exercises        | 3.16.3             |
| SC42_step10    | Unsaved Dialog         | 3.15.2             |
| SC43_step31-40 | Set Logging/Summary    | 3.12.4             |

---

## LỜI KẾT

Tôi đã dành thời gian phân tích kỹ lưỡng ~60 screenshots bao phủ TOÀN BỘ luồng ứng dụng MealPlaning. Với 50+ năm kinh nghiệm, tôi có thể nói: **ứng dụng này có tiềm năng lớn** — domain meal planning + fitness tracking là nhu cầu thực, và nền tảng kỹ thuật (React + Capacitor + SQLite) vững vàng.

Tuy nhiên, thiết kế UI/UX hiện tại ở mức **"developer-designed"** — functional nhưng thiếu polish, thiếu nhất quán, và thiếu empathy với user thực tế. Đặc biệt:

1. **Nhất quán** phải là ưu tiên #1 — cùng component phải trông cùng kiểu ở mọi nơi
2. **Touch targets** phải fix ngay — đây là mobile app, ngón tay là input device
3. **Empty/Loading/Error states** phải có — đây là "floor" tối thiểu, không phải "nice-to-have"
4. **Typography scale** phải cố định — hierarchy tạo scanability
5. **Spacing grid** phải nhất quán — rhythm tạo comfort

Nếu tuân theo lộ trình 4 sprints tôi đề xuất, app có thể từ 5.5/10 lên **8/10** — mức mà user sẽ cảm thấy "ứng dụng này chuyên nghiệp" thay vì "ứng dụng này cũng được".

**Không có shortcut trong thiết kế. Mỗi pixel đều có ý nghĩa.**

---

> _Tài liệu này được tạo bởi Senior Design Architect review session._
> _Mọi nhận xét dựa trên phân tích visual từ screenshots thực tế của ứng dụng._
> _Lần cập nhật: Tháng 7/2025_
