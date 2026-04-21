# Design System — HealthMate AI

**Version:** 1.2  
**Date:** 2026-04-20  
**Status:** Active

---

## 1. Tổng quan

Design System của HealthMate AI dựa trên **Ionic 8 + Material Design**, tối ưu cho Android. Tất cả quyết định thiết kế đều đã được so sánh mockup HTML và lựa chọn qua discussion.

### Nguyên tắc thiết kế

| Nguyên tắc | Mô tả |
|------------|-------|
| **Đơn giản** | UI phải dễ hiểu cho Persona Lan (tech savvy 2/5) |
| **Data-friendly** | Hiển thị số liệu (calo, macro, weight) rõ ràng cho Persona Hùng |
| **Offline-aware** | Mọi trạng thái offline đều rõ ràng (toast + banner + disable AI) |
| **Dark mode first** | Mọi component đều phải có dark variant |

---

## 2. Color Palette

### 2.1 Primary — Material Blue

| Token | Hex | Dùng cho |
|-------|-----|----------|
| `--primary-900` | `#0D47A1` | Status bar (dark) |
| `--primary-800` | `#1565C0` | Toolbar dark mode, header hover |
| `--primary-700` | `#1976D2` | Status bar (light) |
| `--primary-600` | `#1E88E5` | Active states |
| `--primary-500` | `#2196F3` | **Primary — toolbar, buttons, links, nav active** |
| `--primary-400` | `#42A5F5` | Dark mode primary, progress bars |

> **⚠️ Contrast note:** `--primary-500` (#2196F3) on white = **3.12:1** — passes AA for large text (≥18pt / ≥14pt bold) and icons only. For body-size primary text on white, use `--primary-700` (#1976D2, 5.58:1) instead. `--primary-400` (#42A5F5) on dark bg (#121218) = **7.05:1** — passes AA for all text sizes.
| `--primary-300` | `#64B5F6` | Dark mode links, secondary blue |
| `--primary-200` | `#90CAF9` | Dark mode AI text, light accents |
| `--primary-100` | `#BBDEFB` | AI card border (light) |
| `--primary-50` | `#E3F2FD` | AI card background, quick action bg (light) |

### 2.2 Action Accent — Orange

| Token | Hex | Dùng cho |
|-------|-----|----------|
| `--accent-700` | `#F57C00` | Orange hover/pressed |
| `--accent-500` | `#FF9800` | **CTA buttons, streak 🔥, AI buttons, FAB** |
| `--accent-300` | `#FFB74D` | Dark mode streak, light orange |
| `--accent-50` | `#FFF8E1` | Streak card background (light) |

### 2.3 Semantic Colors

> **Color-blind note:** ~8% nam giới không phân biệt rõ đỏ/xanh lá. Khi hiển thị macros (Protein=xanh, Fat=đỏ) cạnh nhau, PHẢI kèm text label hoặc icon — KHÔNG dựa vào màu alone.

| Vai trò | Light Mode | Dark Mode | Dùng cho |
|---------|-----------|-----------|----------|
| **Success** | `#4CAF50` | `#66BB6A` | Đạt mục tiêu, progress đủ, weight giảm |
| **Warning** | `#FFC107` | `#FFD54F` | Thiếu macro, gần giới hạn |
| **Error** | `#F44336` | `#EF5350` | Vượt calo, lỗi hệ thống |
| **Info** | `#2196F3` | `#42A5F5` | Thông báo, gợi ý |

### 2.4 Neutral Colors

> **Rule: Tinted Neutrals.** Pure gray (`#E8E8E8`, `#999`) thiếu personality. Mọi neutral nên có **blue tint nhẹ** (chroma ~0.01, hue ~230) để cohesive với primary blue. Implementation dùng hex gần nhất.

| Token | Light Mode | Dark Mode | Dùng cho |
|-------|-----------|-----------|----------|
| `--bg-page` | `#F5F7FA` | `#121218` | Page background (đã tinted) |
| `--bg-card` | `#FFFFFF` | `#1D1F26` | Card background |
| `--bg-elevated` | `#FFFFFF` | `#2C2E36` | Modal, bottom sheet |
| `--text-primary` | `#1A1A2E` | `#FFFFFF` | Heading, số liệu |
| `--text-secondary` | `#2D3142` | `#E0E0E8` | Body text |
| `--text-tertiary` | `#5F6575` | `#A8AAB4` | Subtitle, mô tả phụ (dark ≥4.78:1 on card bg) |
| `--text-disabled` | `#939AAA` | `#5F6575` | Disabled, placeholder |
| `--border` | `#E2E4EC` | `#333340` | Divider, border |

### 2.5 Dark Mode — AI Card

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| AI card bg | `#E3F2FD` | `#1A237E` |
| AI card border | `#BBDEFB` | `#283593` |
| AI avatar bg | `#2196F3` | `#42A5F5` |
| AI text color | `#1565C0` | `#90CAF9` |
| Quick action bg | `#E3F2FD` | `#1A237E` |
| Quick action text | `#1565C0` | `#90CAF9` |
| Streak card bg | `#FFF8E1` | `#2C2E1E` |

---

## 3. Typography

### 3.1 Font Family

```scss
--font-family: 'Roboto', sans-serif;
```

**Lý do chọn Roboto:**
- Mặc định của Ionic/Material — zero conflict
- Hỗ trợ tiếng Việt có dấu tốt (Google thiết kế cho đa ngôn ngữ)
- Nhẹ nhất (~100KB cho 4 weights: Regular, Medium, SemiBold, Bold)
- Phù hợp tất cả persona

### 3.2 Font Weights

| Weight | Value | Dùng cho |
|--------|-------|----------|
| Regular | 400 | Body text, mô tả, caption |
| Medium | 500 | Card title, subtitle, button, link |
| SemiBold | 600 | Macro values (P/C/F), dish card title, emphasis text |
| Bold | 700 | Heading, số liệu lớn (calories), streak number |

### 3.3 Type Scale

| Token | Size | Weight | Line Height | Dùng cho |
|-------|------|--------|-------------|----------|
| `display` | 28px | 700 | 1.2 | Số lớn trên Dashboard (calorie total) |
| `headline` | 22px | 700 | 1.3 | Tiêu đề trang |
| `title` | 18px | 500 | 1.3 | Tiêu đề card chính |
| `subtitle` | 16px | 500 | 1.4 | Section header, subtitle |
| `body` | 14px | 400 | 1.6 | Nội dung chính, mô tả |
| `body-sm` | 13px | 400 | 1.5 | Chi tiết phụ, list item |
| `caption` | 12px | 400 | 1.4 | Timestamp, meta info, link text |
| `overline` | 11px | 500 | 1.3 | Tab label, tag, chip text |

> **Note Typography:**
> - `body-sm (13px)` và `body (14px)` chỉ khác 1px — dùng **weight/color** thay vì size để phân cấp khi cần.
> - `overline (11px)` là minimum readable — chỉ dùng cho badges/chips nhỏ, KHÔNG cho body text. Tab labels ưu tiên dùng `caption (12px)` nếu có dấu tiếng Việt dài.
> - Thêm `letter-spacing: 0.05em` cho `overline` để cải thiện readability ở 11px.

### 3.4 Number Typography

| Token | Size | Weight | Dùng cho |
|-------|------|--------|----------|
| `number-lg` | 32px | 700 | Progress %, stat number lớn |
| `number-md` | 22px | 700 | Streak count, badge, weight |
| `number-sm` | 14px | 500 | Progress value (95/120g), macro |

### 3.5 Numeric Display

```css
font-variant-numeric: tabular-nums;
```

**BẮT BUỘC** áp dụng cho MỌI element hiển thị số: calories, macros, weight, progress, streak count. Tabular numbers đảm bảo các chữ số có độ rộng bằng nhau → cột số thẳng hàng, không nhảy giật khi giá trị thay đổi.

Nếu app hiển thị phân số nguyên liệu (½, ¼), thêm:
```css
font-variant-numeric: tabular-nums diagonal-fractions;
```

### 3.7 Vertical Rhythm Baseline

> Body text: `14px × 1.6 = 22.4px ≈ 24px`. Spacing values (4, 8, 12, 16, 24, 32) nên là bội số hoặc ước số của baseline `24px` để tạo nhịp thị giác nhất quán. Trong thực tế: 8px = ⅓, 12px = ½, 24px = 1×, 48px = 2×.

### 3.6 Calorie Visual Hierarchy

Trong các màn hình nhập/hiển thị dinh dưỡng, **Calories luôn nổi bật hơn** P/C/F:

| Element | Size | Weight | Dùng cho |
|---------|------|--------|----------|
| Calories value | `24px` | `700` | Số kcal — luôn lớn nhất, đậm nhất |
| Calories label | `12px` | `400` | "kcal" dưới số |
| Macro (P/C/F) value | `16px` | `600` | Giá trị gram — nhỏ hơn calories |
| Macro (P/C/F) label | `11px` | `400` | "Protein" / "Carbs" / "Fat" |

---

## 4. Spacing

### 4.1 Spacing Scale (4px grid)

| Token | Value | Dùng cho |
|-------|-------|----------|
| `--space-xs` | 4px | Gap nhỏ (icon ↔ text) |
| `--space-sm` | 8px | Button padding, item gap nhỏ |
| `--space-md` | 12px | Gap giữa cards, content padding top |
| `--space-lg` | 16px | Page padding (trái/phải), card padding |
| `--space-xl` | 24px | Section separator |
| `--space-2xl` | 32px | Page top/bottom padding |

### 4.2 Component Spacing

| Component | Padding | Gap (giữa items) |
|-----------|---------|-------------------|
| Page content | 16px (trái/phải), 12px (trên) | — |
| Card | 16px | 12px (giữa cards) |
| Card inner content | — | 10px (giữa sections) |
| Button | 10px (vertical), 16px (horizontal) | — |
| Quick action grid | 8px (gap) | — |
| Streak row | 10px (gap) | — |
| Progress group | — | 4px (label ↔ bar) |

---

## 5. Border Radius

| Token | Value | Dùng cho |
|-------|-------|----------|
| `--radius-xs` | 8px | Small chips, tags, badges |
| `--radius-sm` | 12px | Input fields, select fields, quick action buttons |
| `--radius-lg` | 16px | **Cards** — component chính |
| `--radius-xl` | 20px | Modal, bottom sheet |
| `--radius-full` | 9999px | Avatar, circular icon, FAB |

### Progress Bar Radius

| Element | Height | Radius |
|---------|--------|--------|
| Calo bar (lớn) | 14px | 7px |
| Macro bar (nhỏ) | 10px | 5px |

---

## 6. Shadows

| Token | Value | Dùng cho |
|-------|-------|----------|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.06)` | **Tier Subtle**: list items, secondary cards |
| `--shadow-md` | `0 1px 4px rgba(0,0,0,0.08)` | **Tier Prominent**: primary cards (light mode) |
| `--shadow-lg` | `0 2px 8px rgba(0,0,0,0.12)` | Modal, bottom sheet, FAB |
| Dark mode | **Không dùng shadow** | Dùng background elevation thay thế (§6 Dark Mode) |

> **Mapping → Card Tiers (§8.1):** Flat=no shadow, Subtle=`--shadow-sm`, Prominent=`--shadow-md`. Modals/sheets dùng `--shadow-lg`.

### Dark Mode Elevation

| Level | Background | Dùng cho |
|-------|-----------|----------|
| Base | `#121218` | Page background |
| Level 1 | `#1D1F26` | Cards |
| Level 2 | `#2C2E36` | Modal, elevated components |
| Level 3 | `#333340` | Dropdown, tooltip |

> **Note:** Dark mode dùng blue-tinted dark grays (hue ~230) thay vì pure neutral. Tạo visual connection với primary blue.

---

## 7. Iconography

### 7.1 Navigation Icons (Tab Bar)

| Tab | Emoji | Ionic Icon Alternative |
|-----|-------|----------------------|
| Dashboard | 🏠 | `home-outline` / `home` |
| Calendar | 📅 | `calendar-outline` / `calendar` |
| Quản lý | 🍳 | `restaurant-outline` / `restaurant` |
| Fitness | 💪 | `barbell-outline` / `barbell` |
| Settings | ⚙️ | `settings-outline` / `settings` |

> **Note:** Trong implementation, sử dụng Ionicons thay vì emoji. Mockup dùng emoji để dễ preview.

### 7.2 Quick Action Icons

Theo PRD F-12 (Dashboard Quick Actions):

| Action | Emoji (mockup) | Ionicon |
|--------|----------------|---------|
| Chụp ảnh | 📷 | `camera-outline` |
| Log workout | 🏋️ | `barbell-outline` |
| Cân nặng | ⚖️ | `scale-outline` |
| Hỏi AI | 🤖 | `chatbubble-ellipses-outline` |

---

## 8. Component Guidelines

### 8.1 Cards

#### Card Hierarchy (3 Tiers)

> Không phải mọi content group đều cần card. Dùng spacing/typography thay card khi có thể.

| Tier | Shadow | Border | Radius | Dùng cho |
|------|--------|--------|--------|----------|
| **Flat** (no card) | none | none | — | Inline sections, metadata rows, form field groups |
| **Subtle** | `--shadow-sm` | optional `--border` | `--radius-lg` | List items, ingredient rows, secondary cards |
| **Prominent** | `--shadow-md` | none | `--radius-lg` | Dashboard hero cards, primary content, AI card |

> **Rule:** Khi mọi card cùng shadow level → flat hierarchy. Phân tầng shadow tạo **visual depth** giúp user biết đâu quan trọng.

#### Card Base Spec

```
┌─────────────────────────────┐
│ [16px padding]              │
│ 🍽️ Card Title  (14px/500)  │
│ [10px gap]                  │
│ Content area                │
│ [16px padding]              │
└─────────────────────────────┘
  radius: 16px
  shadow: varies by tier (see above)
  background: var(--bg-card)
  gap giữa cards: 12px
```

### 8.2 Buttons

| Type | Background | Text Color | Radius | Padding | Min Height |
|------|-----------|------------|--------|---------|------------|
| Primary (CTA) | `#FF9800` / `#FFB74D` | `#FFFFFF` / `#121218` | `--radius-sm` (12px) | 10px 16px | **44px** |
| Secondary | `#E3F2FD` / `#1A237E` | `#2196F3` / `#90CAF9` | `--radius-sm` (12px) | 10px 16px | **44px** |
| Outline | transparent | `#2196F3` / `#64B5F6` | `--radius-sm` (12px) | 10px 16px | **44px** |
| Text/Link | transparent | `#2196F3` / `#64B5F6` | — | 4px 8px | **44px** (via padding) |

> **Rule:** Mọi button PHẢI có `min-height: 44px` (touch target §8c). Button radius dùng `--radius-sm` (12px) — trên 4px grid, nhất quán với input fields. Dark mode: CTA dùng `#FFB74D` (cam nhạt), text trên CTA dùng `var(--bg-page)`. Format: `light / dark`.

### 8.3 Progress Bars

| Type | Height | Radius | Background (empty) | Fill color |
|------|--------|--------|--------------------|------------|
| Calo (main) | 14px | 7px | `var(--border)` | Gradient `#2196F3 → #1976D2` |
| Macro (sub) | 10px | 5px | `var(--border)` | `#42A5F5` / `#64B5F6` |

### 8.4 AI Card

```
┌─ AI Card ─────────────────────┐
│ 🤖 [avatar 36px]              │
│     AI message text (13px)    │
│     color: #1565C0 (light)    │
│     color: #90CAF9 (dark)     │
└───────────────────────────────┘
  bg: #E3F2FD (light) / #1A237E (dark)
  border: 1px solid #BBDEFB (light) / #283593 (dark)
  radius: 16px
  padding: 14px
```

### 8.5 Streak Card

```
┌──────────┐ ┌──────────┐
│  🍽️ 8    │ │  🏋️ 5    │
│ ngày log │ │ buổi tập │
└──────────┘ └──────────┘
  bg: #FFF8E1 (light) / var(--bg-elevated) (dark)
  radius: var(--radius-sm) (12px)
  padding: 12px
  number: 22px/700, color: #FF9800 / #FFB74D
  label: 11px/400, color: var(--text-tertiary)
```

### 8.6 Input Fields

> **Rule:** Input/Select dùng **standalone** (KHÔNG wrap trong `ion-item`). Fill style = `outline`.

| Property | Value | Notes |
|----------|-------|-------|
| Fill | `outline` | Viền 4 cạnh, floating label |
| Label Placement | `floating` | Label animate lên khi focus/có value |
| Background | `var(--bg-card)` | Token resolves to tinted values per mode |
| Border Color | `#C8CBD4` (light) / `#444850` (dark) | Tinted neutral — không dùng Apple pure gray |
| Border Width | `1px` | |
| Border Radius | `--radius-sm` (12px) | Apple-style soft corners |
| Height | Auto (~56px with floating label) | |
| Padding | `16px` horizontal | `--padding-start` + `--padding-end` |
| Margin Bottom | `8px` | Giữa các fields |
| Focus Color | `var(--ion-color-primary)` | Highlight border khi focus |

**Error state:**
| Property | Value |
|----------|-------|
| Border Color | `var(--ion-color-danger)` (`#F44336`) |
| Error Text | `12px/400`, color `var(--ion-color-danger)` |
| Error Position | Dưới input, `padding-left: 4px`, `margin-bottom: 8px` |
| Accessibility | `role="alert"` + `aria-describedby` linking input → error |

#### Error Message Templates (Vietnamese)

> Mỗi error message phải trả lời: (1) Gì sai? (2) Tại sao? (3) Sửa thế nào?

| Trường hợp | ❌ Sai | ✅ Đúng |
|------------|--------|---------|
| **Format sai** | "Giá trị không hợp lệ" | "Chiều cao cần từ 100 đến 250 cm. Ví dụ: 165" |
| **Thiếu bắt buộc** | "Trường này bắt buộc" | "Vui lòng nhập tên món ăn" |
| **Vượt giới hạn** | "Số quá lớn" | "Calories tối đa 9999 kcal" |
| **Chưa chọn** | "Vui lòng chọn" | "Chọn mục tiêu để tiếp tục" |

> **KHÔNG bao giờ** đổ lỗi user: ~~"Bạn nhập sai"~~ → "Cân nặng cần từ 30 đến 200 kg"

**ion-select** dùng cùng spec, thêm:
| Property | Value |
|----------|-------|
| Arrow | Ionic default dropdown arrow |

### 8.7 Radio / Checkbox Items

> **Rule:** Radio circles ẩn (`::part(container) { display: none }`). Selection thể hiện qua background change + **checkmark icon**.

| Property | Default | Selected |
|----------|---------|----------|
| Background | `var(--bg-card)` | `rgba(var(--ion-color-primary-rgb), 0.08)` |
| Font Weight | 400 | **600** |
| Border Radius | `--radius-sm` (12px) | Giữ nguyên |
| Padding Start | `16px` | Giữ nguyên |
| Margin Bottom | `8px` | Giữ nguyên |
| Transition | — | `background 0.15s var(--ease-out-quart)` |
| **Checkmark** | Hidden | **✓ icon** (22px) ở góc phải, color `var(--ion-color-primary)` |

> **A11y:** Highlight + checkmark cùng lúc → người lớn tuổi / thị lực kém nhận diện rõ ràng hơn chỉ highlight alone.

**Icon trong radio items (nếu có):**
| Property | Value |
|----------|-------|
| Size | `22px` |
| Color | `var(--ion-color-primary)` |
| Margin Right | `8px` |
| Offset from left | Tuân theo `--padding-start` (16px) |

### 8.8 Toolbar

| Property | Value | Notes |
|----------|-------|-------|
| Background | `var(--ion-color-primary)` | `#2196F3` light / `#1565C0` dark |
| Title Size | `20px` | |
| Title Weight | `500` | |
| Title Color | `#FFFFFF` | |
| Height | `56px` | Android standard |
| Back Button | Ionic default `chevron-back` | Color: white |

**Toolbar Save Action (cho form dài):**

| Property | Value | Notes |
|----------|-------|-------|
| Type | Text button | `"Lưu"` ở góc phải toolbar |
| Color | `#FFFFFF` | Cùng màu với title |
| Font | `16px / 500` | Medium weight |
| Position | `margin-left: auto` | Căn phải |
| Behavior | Luôn hiện (không disable) | Khi tap → validate → auto-scroll to first error nếu invalid |

> **Rule:** Mọi form Add/Edit có scroll content > 1 viewport PHẢI có nút "Lưu" trên toolbar header. User không nên phải scroll xuống cuối chỉ để save.

### 8.8b CTA Behavior — 2 Context Rules

#### Context 1: Step Navigation (Tiếp tục / Next)

> Áp dụng khi: wizard steps, onboarding, flow tuần tự có ≤2 required actions rõ ràng.

| State | Visual | Behavior |
|-------|--------|----------|
| **Chưa hoàn thành** | `opacity: 0.5`, `pointer-events: none` | Disable cho tới khi step requirements met |
| **Đã hoàn thành** | Full opacity, enabled | Tap → chuyển step tiếp |

**Lý do:** Chỉ 1-2 action cần làm → user biết rõ tại sao nút mờ. Nút sáng lên = instant feedback.
**Ví dụ:** Onboarding bước 1 "Tiếp tục" — disable cho tới khi chọn radio.

#### Context 2: Form Submission (Lưu / Hoàn tất / Submit)

> Áp dụng khi: form có ≥3 fields, user không biết chắc đâu sai.

| State | Visual | Behavior |
|-------|--------|----------|
| **Luôn luôn** | Full opacity, enabled | Tap → validate → auto-scroll to first error |

1. Nút Lưu/Hoàn tất **KHÔNG BAO GIỜ disable** (trừ saving state)
2. Khi tap mà form invalid → `scrollIntoView()` đến field lỗi đầu tiên
3. Field lỗi: border `var(--ion-color-danger)` + error text bên dưới
4. Optional: flash animation nhẹ (border pulse 2 lần)

**Lý do:** "Tại sao nút mờ?" gây confusion → "Bấm Lưu → thấy lỗi ở đâu" = guided UX.
**Ví dụ:** Onboarding bước 2 "Hoàn tất", Lưu nguyên liệu/món ăn.

#### Context 3: Saving State (async)

| State | Visual | Behavior |
|-------|--------|----------|
| **Đang lưu** | `opacity: 0.5` + spinner + "Đang lưu..." | Disable tất cả interactions |

---

## 8b. Interaction States

> **BẮT BUỘC:** Mọi interactive element phải có đủ **8 states** (6 core + loading + success).

### Core States (6)

| State | CSS | Visual |
|-------|-----|--------|
| Default | — | Trạng thái bình thường |
| Hover | `:hover` | Chỉ hiện trên web (desktop testing) |
| Active/Pressed | `:active` | Opacity giảm nhẹ hoặc scale 0.98 |
| Focus Visible | `:focus-visible` | Ring `2px solid var(--ion-color-primary)`, offset `2px` |
| Disabled | `[disabled]` | `opacity: 0.5`, `pointer-events: none` |
| Error | `.ion-invalid` | Border/text chuyển `var(--ion-color-danger)` |

### Extended States (+2)

| State | Spec | Dùng cho |
|-------|------|----------|
| Loading | Skeleton shimmer / inline spinner | Xem §Loading State bên dưới |
| Success | Flash / toast / inline check | Xem §Success State bên dưới |

### Per-Component States

| Component | Hover | Active | Focus | Disabled | Error |
|-----------|-------|--------|-------|----------|-------|
| Button (CTA) | Shade color | Scale 0.98 | Focus ring | opacity 0.5 | — |
| Button (Outline) | bg tint nhẹ | Scale 0.98 | Focus ring | opacity 0.5 | — |
| Input (Outline) | — | — | Primary border | opacity 0.5 | Danger border + text |
| Radio Item | bg tint nhẹ | — | Focus ring | opacity 0.5 | — |
| Select | — | — | Primary border | opacity 0.5 | Danger border |
| FAB | Shade CTA | Scale 0.95 | Focus ring | opacity 0.5 | — |
| Segment Control | — | bg swap | Focus ring | opacity 0.5 | — |
| Filter Chip | bg tint nhẹ | Scale 0.98 | Focus ring | opacity 0.5 | — |
| Card (tappable) | shadow lift | Scale 0.99 | Focus ring | opacity 0.5 | — |
| ⋮ More Menu | bg circle | — | Focus ring | opacity 0.5 | — |

### Loading State

| Pattern | Dùng cho |
|---------|----------|
| Skeleton shimmer (`bg-muted animate-pulse`) | Card loading, list loading |
| Inline spinner (ion-spinner) | Button action pending |
| **KHÔNG dùng** centered full-page spinner | — |

### Success State

| Pattern | Dùng cho | Duration |
|---------|----------|----------|
| Button flash: `✓ Đã lưu` (green bg, white text) | Sau save thành công | 1.5s → navigate/reset |
| Toast confirmation: specific message | Feedback nhẹ (thêm nguyên liệu, cập nhật) | 2-3s auto-dismiss |
| Inline check: `✓` icon + green text | Validation passed (field-level) | Persistent until change |

> **Rule:** Success feedback phải **specific** — "Đã lưu Cơm gà nướng" không phải "Thành công". Dùng verb + object.

### Empty State

| Element | Spec |
|---------|------|
| Icon | `48px`, color `var(--text-tertiary)` |
| Message | `14px/400`, encouraging tone, Vietnamese |
| CTA Button | Optional, primary style |
| Layout | Center vertical + horizontal |

### Disabled State

| Rule | Spec |
|------|------|
| Opacity | `0.5` |
| Pointer Events | `none` |
| Tooltip/Explain | **Phải** giải thích WHY disabled (aria-label hoặc tooltip) |

---

## 8c. Touch Targets

> **Minimum 44×44px** cho mọi tappable element (Apple HIG / WCAG 2.5.8).

| Component | Min Height | Min Width | Notes |
|-----------|-----------|-----------|-------|
| Button (CTA) | 44px | 44px | `min-height: 44px` |
| Button (Outline) | 44px | 44px | |
| Radio Item | 44px | Full width | |
| Input Field | 44px | Full width | Ionic default ~56px — OK |
| Icon Button | 44px | 44px | Padding quanh icon để đạt 44px |
| **Search Clear (✕)** | **44px** | **44px** | **Icon 20px nhưng hitbox phải 44px** (padding: 12px) |
| Tab Bar Item | 48px | Equal flex | Ionic default — OK |
| Link/Text Button | 44px | — | Dùng padding để đạt min |

**Spacing giữa touch targets:** Minimum `8px` gap để tránh mis-tap.

---

## 8d. Text Transform

| Component | Text Transform | Lý do |
|-----------|---------------|-------|
| Button (CTA) | `none` (Title Case) | Thân thiện hơn UPPERCASE |
| Button (Outline) | `none` (Title Case) | Nhất quán |
| Tab Label | `none` | Vietnamese diacritics đọc dễ hơn |
| Section Label | `none` | |
| **KHÔNG dùng** `uppercase` | — | Trừ khi tag/badge nhỏ cần emphasis |

> **Rule:** Ionic Android mặc định `text-transform: uppercase` cho buttons. **Luôn override** với `text-transform: none`.

---

## 8e. Icon Usage Rules

### Khi nào dùng icon

| Dùng icon ✅ | KHÔNG dùng icon ❌ |
|-------------|-------------------|
| Navigation (tab bar) | Mỗi dòng text trong list đơn giản |
| Quick actions (cần nhận diện nhanh) | Radio options chỉ có text ngắn (gym experience) |
| Empty states (minh họa) | Form labels (text đủ rõ) |
| Status indicators (success/error) | Mỗi card header (trừ khi cần phân biệt loại) |

### Rule: Icon KHÔNG tự động thêm vào mọi nơi

> Hỏi: "Icon này mang lại value gì mà text không có?" Nếu không trả lời được → bỏ icon.

### Icon Specs

| Context | Size | Color | Margin |
|---------|------|-------|--------|
| Tab bar (inactive) | `24px` | `var(--text-tertiary)` | — |
| Tab bar (active) | `24px` | `var(--ion-color-primary)` | — |
| Radio item (nếu có) | `22px` | `var(--ion-color-primary)` | `0 8px 0 0` |
| Quick action | `24px` | Inherits from parent | — |
| Empty state | `48px` | `var(--text-tertiary)` | `0 0 12px 0` |
| Toolbar back | `24px` | `#FFFFFF` | Ionic default |

### Icon Library

**Ionicons only** — không mix với Lucide, Material Icons, hoặc custom SVG.
- Dùng `-outline` variant cho inactive, filled variant cho active.
- Import qua `addIcons()` trong component constructor.

---

## 8f. Animations & Transitions

| Element | Property | Duration | Easing | Trigger |
|---------|----------|----------|--------|---------|
| Radio item select | `background` | `150ms` | `cubic-bezier(0.25, 1, 0.5, 1)` (ease-out-quart) | Click/tap |
| Input label float | Built-in Ionic | ~200ms | ease-in-out | Focus/blur |
| Button press | `transform` | `100ms` | `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo) | `:active` → scale(0.98) |
| Page transition | Built-in Ionic | ~300ms | cubic-bezier | Navigation push/pop |
| Skeleton shimmer | `background-position` | `1.5s` | `linear` | Infinite loop |
| Bottom sheet open | `transform` | `300ms` | `cubic-bezier(0.32, 0.72, 0, 1)` | Open |
| Bottom sheet close | `transform` | `225ms` | `cubic-bezier(0.32, 0.72, 0, 1)` | Close (75% of open) |

> **Exit Rule:** Exit animations = **75% of entrance duration**. Open 300ms → close 225ms. Enter 500ms → leave 375ms.

### Easing Tokens

```css
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);    /* Default micro-interaction */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);      /* Snappy feedback (button, toggle) */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);       /* State toggle (open ↔ close) */
--ease-sheet: cubic-bezier(0.32, 0.72, 0, 1);        /* Bottom sheet, drawer */
```

> **KHÔNG dùng `ease` generic.** Mỗi interaction type dùng curve phù hợp.

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  /* Disable spatial movement */
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }

  /* Preserve functional animations */
  ion-progress-bar, .progress-bar { transition-duration: 200ms !important; }
  ion-spinner { animation-duration: 1s !important; }
  :focus-visible { transition-duration: 100ms !important; }
}
```

> **Rule:** Mọi animation PHẢI respect `prefers-reduced-motion`. Skeleton shimmer → static bg. Transitions → instant. Nhưng **giữ lại** progress bars, spinners, focus indicators — đây là functional, không phải decorative.

---

## 8g. Segment Control (Sub-tabs)

> **Rule:** Sub-tabs trong page PHẢI dùng `ion-segment` (Segmented Control), KHÔNG dùng underline tabs.
> Theo spec `phase-1-management.md`: "Management page có segment control: Nguyên liệu | Món ăn"

### Spec

| Property | Value | Notes |
|----------|-------|-------|
| Component | `ion-segment` + `ion-segment-button` | Ionic native |
| **Position** | **Trong content area** (dưới toolbar) | KHÔNG nằm trên toolbar bg — giảm top chrome nặng |
| Background | `var(--bg-page)` (`#F5F7FA` / `#121218`) | Nền page, không nền primary |
| Container bg | `#E2E4EC` (light) / `#333340` (dark) | Pill track background (tinted neutral) |
| Active indicator | `var(--bg-card)` (white/dark card) pill, radius 8px | |
| Inactive text | `var(--text-tertiary)` | `#5F6575` / `#A8AAB4` (tinted) |
| Active text | `var(--text-primary)`, `font-weight: 600` | `#1A1A2E` / `#FFF` |
| Font | `14px / 500` (inactive), `14px / 600` (active) | |
| Padding | `4px` outer (track), `8px 16px` per button | |
| Height | `36px` | Compact |
| Margin | `12px 16px` | Page padding alignment |
| Mode | `md` | Material Design style |

```
┌─ Toolbar (blue) ────────────────────┐
│  ← Quản lý                          │
└──────────────────────────────────────┘
┌─ Content area (gray/dark bg) ────────┐
│  ┌─────────────────────────────────┐ │
│  │ [Nguyên liệu] │  Món ăn        │ │  ← segment (page bg)
│  └─────────────────────────────────┘ │
│  ┌─ Search ──────────────────────┐   │
│  │ 🔍 Tìm kiếm...               │   │
│  └───────────────────────────────┘   │
│  ...cards...                         │
└──────────────────────────────────────┘
   ▲ active (white pill)  ▲ inactive
```

> **Lý do đổi:** Status bar + toolbar + segment cùng xanh = "dày đầu màn hình". Đưa segment xuống nền trắng/xám giảm visual weight đáng kể.

---

## 8h. Filter Chips (Horizontal Scroll)

### Spec

| Property | Value | Notes |
|----------|-------|-------|
| Layout | `display: flex; overflow-x: auto` | Horizontal scroll |
| Gap | `8px` | Giữa chips |
| Chip padding | `6px 14px` | |
| Chip radius | `--radius-xs` (8px) | |
| Font | `12px / 500` | Overline |
| Default bg | `var(--bg-card)` | Token (§2.4) |
| Active bg | `var(--ion-color-primary)` | `#2196F3` / `#42A5F5` |
| Active text | `#FFFFFF` / `var(--bg-page)` | |

### Scroll Affordance (BẮT BUỘC)

Khi filter chips nhiều hơn viewport width:
1. Item cuối cùng hiển thị trên màn hình bị cắt **30-50%** → gợi ý cuộn
2. **Gradient fade** mép phải: `linear-gradient(to left, transparent, var(--bg-page) 24px)` overlay
3. Ẩn scrollbar: `::-webkit-scrollbar { display: none }`

---

## 8i. Bottom Sheet

### Spec cơ bản

| Property | Value |
|----------|-------|
| Background | `var(--bg-elevated)` (§2.4) |
| Radius | `--radius-xl` (20px) top-left + top-right |
| Handle | `40px × 4px`, centered, `var(--border)` color |
| Backdrop | `rgba(0,0,0,0.5)` |
| Animation | `300ms cubic-bezier(0.32, 0.72, 0, 1)` |

### Keyboard Behavior (CRITICAL)

> Khi input trong Bottom Sheet được focus → keyboard chiếm ~50% màn hình.

| State | Sheet Height | Behavior |
|-------|-------------|----------|
| Default (no keyboard) | `50-60%` viewport | Nội dung fit trong sheet |
| **Keyboard active** | **`90%` viewport** | Sheet mở rộng lên gần full-screen |
| Search input focus | `90%` viewport | Đảm bảo kết quả search vẫn hiển thị phía dưới input |

> **Rule:** Bottom sheet có search/input PHẢI expand lên `90%` khi keyboard bật. Không để user bị kẹt trong sheet nhỏ với keyboard che hết content.

---

## 8j. Onboarding-Specific Components

### Step Title

| Property | Value |
|----------|-------|
| Tag | `<h1>` |
| Size | `headline` (22px) |
| Weight | 700 |
| Color | `var(--text-primary)` |
| Margin Bottom | `4px` |
| Accessibility | `tabindex="-1"` for programmatic focus |

### Step Subtitle

| Property | Value |
|----------|-------|
| Size | `body` (14px) |
| Weight | 400 |
| Color | `var(--text-tertiary)` |
| Margin Bottom | `24px` |

### Section Label (e.g., "Kinh nghiệm tập gym?")

| Property | Value |
|----------|-------|
| Size | `subtitle` (16px) |
| Weight | 500 |
| Color | `var(--text-secondary)` |
| Margin | `24px 0 12px` |

### Progress Indicator (Onboarding)

| Property | Value |
|----------|-------|
| Component | `ion-progress-bar` |
| Height | `4px` |
| Track Color | `rgba(255,255,255,0.3)` |
| Fill Color | `#FFFFFF` |
| Buffer | `transparent` |
| Position | Below toolbar |
| **Steps** | **3 steps** (Mục tiêu → Thông tin cơ thể → Mức hoạt động) |

### Onboarding Steps Structure

| Step | Title | Fields | CTA | CTA Rule |
|------|-------|--------|-----|----------|
| 1 | Mục tiêu của bạn | Radio cards (goal selection) | Tiếp tục | **Disabled** until selected (step nav context) |
| 2a | Thông tin cơ thể | Chiều cao, cân nặng, tuổi, giới tính | Tiếp tục | **Always active** (form context) |
| 2b | Mức hoạt động | Mức vận động, kinh nghiệm tập | Hoàn tất | **Always active** (form context) |

### Radio Card Selection (Step 1)

Triple affordance:
1. **Radio circle** (18px, left) — unfilled `var(--border)` border → filled #2196F3 + white dot
2. **Background highlight** — `rgba(33, 150, 243, 0.08)` light / `rgba(66, 165, 245, 0.15)` dark
3. **Checkmark ✓** (22px, right) — `var(--ion-color-primary)`

### Button Row (Step 2: Quay lại + Hoàn tất)

| Property | Value |
|----------|-------|
| Layout | `display: flex; gap: 12px` |
| Margin Top | `24px` |
| Button Height | Uniform via `--height: 48px` |
| Button Margin | `0` (override Ionic defaults) |
| "Quay lại" | `fill="outline"`, `text-transform: none` |
| "Hoàn tất" | `color="secondary"` (CTA orange), `text-transform: none` |

---

## 8k. List Item Interaction Convention

> **Swipe deprecated.** Edit/Delete chỉ qua ⋮ more menu.

| Interaction | Action | Notes |
|-------------|--------|-------|
| **Tap card** | Navigate to detail/edit page | Primary interaction |
| **Tap ⋮** | Open bottom sheet: [Sửa] + [Xóa] | Discoverable, accessible |
| ~~Swipe left~~ | ~~Removed~~ | Deprecated — low discoverability |

### ⋮ More Icon Spec

| Property | Value |
|----------|-------|
| Icon | `⋮` (vertical ellipsis) |
| Size | 16-20px visual, **44×44px** hitbox |
| Position | Top-right corner of card |
| Color | `var(--text-tertiary)` |

### ⋮ Bottom Sheet Menu

| Property | Value |
|----------|-------|
| Items | [Sửa] (icon: pencil, primary text) + [Xóa] (icon: trash, `--ion-color-danger`) |
| Divider | 1px `var(--border)` between items |
| Cancel | Tap outside / drag down to dismiss |

## 8l. Ingredient Picker — Recently Used + "Thêm tiếp" Mode

### Recently Used Section

| Property | Value |
|----------|-------|
| Position | Top of picker, below search, before full list |
| Header | "Gần đây" — 13px/600, `var(--text-tertiary)` |
| Max items | 5 |
| Item style | Compact row: name + kcal/100g, `padding: 8px 16px` |
| Empty | Hide section entirely (no empty "Gần đây") |

### "Thêm tiếp" Mode

After adding an ingredient, bottom sheet stays open:

1. Brief confirmation: "✓ Đã thêm [tên] — [amount]" (green, 2-3s)
2. Search resets, Recently Used updates
3. Two buttons at bottom:
   - **[Xong]** — secondary/outline, closes sheet
   - **[Thêm tiếp]** — primary/filled, keeps picker open
4. User taps [Xong] → return to dish form with all added ingredients

---

## 9. Ionic Theme Variables

### 9.1 Light Mode (`variables.scss`)

```scss
:root {
  // Primary
  --ion-color-primary: #2196F3;
  --ion-color-primary-rgb: 33, 150, 243;
  --ion-color-primary-contrast: #ffffff;
  --ion-color-primary-shade: #1976D2;
  --ion-color-primary-tint: #42A5F5;

  // Secondary (Action Accent)
  --ion-color-secondary: #FF9800;
  --ion-color-secondary-rgb: 255, 152, 0;
  --ion-color-secondary-contrast: #ffffff;
  --ion-color-secondary-shade: #F57C00;
  --ion-color-secondary-tint: #FFB74D;

  // Success
  --ion-color-success: #4CAF50;
  --ion-color-success-rgb: 76, 175, 80;
  --ion-color-success-contrast: #ffffff;
  --ion-color-success-shade: #388E3C;
  --ion-color-success-tint: #66BB6A;

  // Warning
  --ion-color-warning: #FFC107;
  --ion-color-warning-rgb: 255, 193, 7;
  --ion-color-warning-contrast: #000000;
  --ion-color-warning-shade: #FFA000;
  --ion-color-warning-tint: #FFD54F;

  // Danger
  --ion-color-danger: #F44336;
  --ion-color-danger-rgb: 244, 67, 54;
  --ion-color-danger-contrast: #ffffff;
  --ion-color-danger-shade: #D32F2F;
  --ion-color-danger-tint: #EF5350;

  // Background
  --ion-background-color: #F5F7FA;
  --ion-card-background: #FFFFFF;
  --ion-toolbar-background: #2196F3;
  --ion-tab-bar-background: #FFFFFF;

  // Text (tinted neutral)
  --ion-text-color: #1A1A2E;
  --ion-text-color-rgb: 26, 26, 46;

  // Font
  --ion-font-family: 'Roboto', sans-serif;
}
```

### 9.2 Dark Mode

```scss
@media (prefers-color-scheme: dark) {
  :root {
    --ion-color-primary: #42A5F5;
    --ion-color-primary-shade: #2196F3;
    --ion-color-primary-tint: #64B5F6;

    --ion-color-secondary: #FFB74D;
    --ion-color-secondary-shade: #FF9800;
    --ion-color-secondary-tint: #FFE0B2;

    // Blue-tinted dark neutrals
    --ion-background-color: #121218;
    --ion-card-background: #1D1F26;
    --ion-toolbar-background: #1565C0;
    --ion-tab-bar-background: #1D1F26;

    --ion-text-color: #FFFFFF;
    --ion-text-color-rgb: 255, 255, 255;

    --ion-border-color: #333340;
  }
}
```

---

## 10. Responsive Notes

HealthMate AI là **Android-only** app, không cần responsive cho tablet hay desktop. Thiết kế target:

| Spec | Value |
|------|-------|
| Min width | 320px |
| Design width | 375px (mockup reference) |
| Max width | 428px (large Android phones) |
| Orientation | Portrait only |

### 10.1 Safe Areas (Android)

> Android 10+ có gesture navigation bar, punch-hole camera, rounded corners. PHẢI handle safe areas.

```css
/* Viewport meta tag — BẮT BUỘC */
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

/* Safe area padding */
ion-content {
  --padding-top: env(safe-area-inset-top);
  --padding-bottom: env(safe-area-inset-bottom);
}

/* Tab bar + FAB phải tránh gesture bar */
ion-tab-bar {
  padding-bottom: max(0px, env(safe-area-inset-bottom));
}

.fab-button {
  bottom: calc(72px + env(safe-area-inset-bottom));
}

/* Bottom sheet full-height tính safe area */
.bottom-sheet-full {
  max-height: calc(90vh - env(safe-area-inset-top));
}
```

### 10.2 Dark Mode Typography Adjustment

> Text trên dark background có perceived weight nhẹ hơn. Giảm font-weight nhẹ cho body text.

```css
@media (prefers-color-scheme: dark) {
  body { font-weight: 350; }  /* Thay vì 400 — dark text nhìn mảnh hơn light */
  .bold-text { font-weight: 600; }  /* Thay vì 700 */
}
```

> **Optional:** Tăng `line-height` thêm 0.05-0.1 cho dark mode body text.

### 10.3 Accessibility Labels (ARIA)

> Mọi custom interactive component PHẢI có `aria-label` hoặc semantic label.

| Component | `aria-label` | Notes |
|-----------|-------------|-------|
| FAB | `"Thêm mới"` | Luôn rõ action, không dùng `"+"` |
| ⋮ More Menu | `"Tuỳ chọn cho [tên item]"` | Dynamic label theo context |
| Segment Control | `ion-segment-button` tự có `value` | Ionic handles a11y nếu dùng đúng component |
| Filter Chip (active) | `aria-pressed="true"` | Cho screen reader biết trạng thái |
| Search Clear (✕) | `"Xóa tìm kiếm"` | Không dùng `"X"` |
| Bottom sheet handle | `role="dialog" aria-label="[tiêu đề sheet]"` | Trap focus khi open |
| Delete button (dialog) | `"Xóa [tên item]"` | Specific, không generic "Xóa" |

### Focus Order

> Khi push page hoặc open bottom sheet → focus PHẢI chuyển vào element đầu tiên có thể tương tác.

| Scenario | Focus Target |
|----------|-------------|
| Push page | Page title `<h1 tabindex="-1">` |
| Bottom sheet open | First input hoặc close handle |
| Dialog open | Primary action button |
| Page back/pop | Trigger element (card/button that opened page) |

---

## 11. Mockup Files

Tất cả mockup HTML dùng trong quá trình discussion:

| File | Nội dung | Quyết định |
|------|----------|-----------|
| `mockups/color-palette.html` | So sánh 3 blue shades + accent colors | Material Blue + Orange/Green dual accent |
| `mockups/typography.html` | So sánh Inter vs Roboto vs Nunito | Roboto |
| `mockups/spacing.html` | So sánh Compact vs Standard vs Spacious | Standard (16px) |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.2 | 2026-04-20 | **Audit Rounds 1-10:** Fix tinted neutrals (#AAAAAA→#A8AAB4, #1A1A1A→#1A1A2E). Add SemiBold 600 weight. Add type scale notes (muddy pairs). Add easing tokens (no generic ease). Add card 3-tier hierarchy. Add success state pattern. Add error message templates. Add safe area §10.1. Add dark mode weight §10.2. Add vertical rhythm §3.7. Add diagonal-fractions §3.5. Update reduced motion (preserve functional). Update all Ionic dark vars (tinted). Fix button radius → --radius-sm (12px). Add 8 states (was 6). Add FAB/Segment/Filter/Card/Menu to per-component states. Add §10.3 ARIA labels + focus order. Fix shadow mapping → card tiers. Fix input/progress bar/segment tokens. Remove --radius-md (duplicate). |
| 1.1 | 2026-04-19 | Add: Input/Select spec (8.6), Radio/Checkbox (8.7), Toolbar (8.8), Interaction States (8b), Touch Targets (8c), Text Transform (8d), Icon Rules (8e), Animations (8f), Onboarding Components (8g). Fix: `--radius-sm` 8→12px, add `--radius-xs` 8px. |
| 1.0 | 2026-04-14 | Initial Design System — Color, Typography, Spacing, Components |
