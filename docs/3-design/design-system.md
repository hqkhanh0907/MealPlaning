# Design System — HealthMate AI

**Version:** 1.1  
**Date:** 2026-04-19  
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

| Vai trò | Light Mode | Dark Mode | Dùng cho |
|---------|-----------|-----------|----------|
| **Success** | `#4CAF50` | `#66BB6A` | Đạt mục tiêu, progress đủ, weight giảm |
| **Warning** | `#FFC107` | `#FFD54F` | Thiếu macro, gần giới hạn |
| **Error** | `#F44336` | `#EF5350` | Vượt calo, lỗi hệ thống |
| **Info** | `#2196F3` | `#42A5F5` | Thông báo, gợi ý |

### 2.4 Neutral Colors

| Token | Light Mode | Dark Mode | Dùng cho |
|-------|-----------|-----------|----------|
| `--bg-page` | `#F5F7FA` | `#121212` | Page background |
| `--bg-card` | `#FFFFFF` | `#1E1E1E` | Card background |
| `--bg-elevated` | `#FFFFFF` | `#2E2E2E` | Modal, bottom sheet |
| `--text-primary` | `#1A1A1A` | `#FFFFFF` | Heading, số liệu |
| `--text-secondary` | `#333333` | `#E0E0E0` | Body text |
| `--text-tertiary` | `#666666` | `#999999` | Subtitle, mô tả phụ |
| `--text-disabled` | `#999999` | `#666666` | Disabled, placeholder |
| `--border` | `#E8E8E8` | `#333333` | Divider, border |

### 2.5 Dark Mode — AI Card

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| AI card bg | `#E3F2FD` | `#1A237E` |
| AI card border | `#BBDEFB` | `#283593` |
| AI avatar bg | `#2196F3` | `#42A5F5` |
| AI text color | `#1565C0` | `#90CAF9` |
| Quick action bg | `#E3F2FD` | `#1A237E` |
| Quick action text | `#1565C0` | `#90CAF9` |
| Streak card bg | `#FFF8E1` | `#2E2E1E` |

---

## 3. Typography

### 3.1 Font Family

```scss
--font-family: 'Roboto', sans-serif;
```

**Lý do chọn Roboto:**
- Mặc định của Ionic/Material — zero conflict
- Hỗ trợ tiếng Việt có dấu tốt (Google thiết kế cho đa ngôn ngữ)
- Nhẹ nhất (~80KB cho 3 weights)
- Phù hợp tất cả persona

### 3.2 Font Weights

| Weight | Value | Dùng cho |
|--------|-------|----------|
| Regular | 400 | Body text, mô tả, caption |
| Medium | 500 | Card title, subtitle, button, link |
| Bold | 700 | Heading, số liệu lớn, streak number |

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
| `--radius-xs` | 8px | Small chips, tags |
| `--radius-sm` | 12px | Input fields, select fields |
| `--radius-md` | 12px | Quick action buttons, sub-cards (streak) |
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
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.06)` | Subtle card (compact) |
| `--shadow-md` | `0 1px 4px rgba(0,0,0,0.08)` | **Card mặc định** (light mode) |
| `--shadow-lg` | `0 2px 8px rgba(0,0,0,0.12)` | Modal, bottom sheet, FAB |
| Dark mode | **Không dùng shadow** | Dùng background elevation thay thế |

### Dark Mode Elevation

| Level | Background | Dùng cho |
|-------|-----------|----------|
| Base | `#121212` | Page background |
| Level 1 | `#1E1E1E` | Cards |
| Level 2 | `#2E2E2E` | Modal, elevated components |
| Level 3 | `#333333` | Dropdown, tooltip |

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

```
┌─────────────────────────────┐
│ [16px padding]              │
│ 🍽️ Card Title  (14px/500)  │
│ [10px gap]                  │
│ Content area                │
│ [16px padding]              │
└─────────────────────────────┘
  radius: 16px
  shadow: 0 1px 4px rgba(0,0,0,0.08)  (light)
  background: #FFFFFF (light) / #1E1E1E (dark)
  gap giữa cards: 12px
```

### 8.2 Buttons

| Type | Background | Text Color | Radius | Padding |
|------|-----------|------------|--------|---------|
| Primary (CTA) | `#FF9800` | `#FFFFFF` | 10px | 10px 16px |
| Secondary | `#E3F2FD` | `#2196F3` | 10px | 10px 16px |
| Outline | transparent | `#2196F3` | 10px | 10px 16px |
| Text/Link | transparent | `#2196F3` | — | 4px 8px |

### 8.3 Progress Bars

| Type | Height | Radius | Background (empty) | Fill color |
|------|--------|--------|--------------------|------------|
| Calo (main) | 14px | 7px | `#E8E8E8` / `#333` | Gradient `#2196F3 → #1976D2` |
| Macro (sub) | 10px | 5px | `#E8E8E8` / `#333` | `#42A5F5` / `#64B5F6` |

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
  bg: #FFF8E1 (light) / #2E2E1E (dark)
  radius: 12px
  padding: 12px
  number: 22px/700, color: #FF9800 / #FFB74D
  label: 11px/400, color: #999999
```

### 8.6 Input Fields

> **Rule:** Input/Select dùng **standalone** (KHÔNG wrap trong `ion-item`). Fill style = `outline`.

| Property | Value | Notes |
|----------|-------|-------|
| Fill | `outline` | Viền 4 cạnh, floating label |
| Label Placement | `floating` | Label animate lên khi focus/có value |
| Background | `var(--bg-card)` | `#FFFFFF` light / `#1E1E1E` dark — dùng token |
| Border Color | `#d1d1d6` (light) / `#444` (dark) | Apple system gray |
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
| Transition | — | `background 0.15s ease` |
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

> **BẮT BUỘC:** Mọi interactive element phải có đủ 6 states.

### State Definitions

| State | CSS | Visual |
|-------|-----|--------|
| Default | — | Trạng thái bình thường |
| Hover | `:hover` | Chỉ hiện trên web (desktop testing) |
| Active/Pressed | `:active` | Opacity giảm nhẹ hoặc scale 0.98 |
| Focus Visible | `:focus-visible` | Ring `2px solid var(--ion-color-primary)`, offset `2px` |
| Disabled | `[disabled]` | `opacity: 0.5`, `pointer-events: none` |
| Error | `.ion-invalid` | Border/text chuyển `var(--ion-color-danger)` |

### Per-Component States

| Component | Hover | Active | Focus | Disabled | Error |
|-----------|-------|--------|-------|----------|-------|
| Button (CTA) | Shade color | Scale 0.98 | Focus ring | opacity 0.5 | — |
| Button (Outline) | bg tint nhẹ | Scale 0.98 | Focus ring | opacity 0.5 | — |
| Input (Outline) | — | — | Primary border | opacity 0.5 | Danger border + text |
| Radio Item | bg tint nhẹ | — | Focus ring | opacity 0.5 | — |
| Select | — | — | Primary border | opacity 0.5 | Danger border |

### Loading State

| Pattern | Dùng cho |
|---------|----------|
| Skeleton shimmer (`bg-muted animate-pulse`) | Card loading, list loading |
| Inline spinner (ion-spinner) | Button action pending |
| **KHÔNG dùng** centered full-page spinner | — |

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
| Radio item select | `background` | `150ms` | `ease` | Click/tap |
| Input label float | Built-in Ionic | ~200ms | ease-in-out | Focus/blur |
| Button press | `transform` | `100ms` | `ease` | `:active` → scale(0.98) |
| Page transition | Built-in Ionic | ~300ms | cubic-bezier | Navigation push/pop |
| Skeleton shimmer | `background-position` | `1.5s` | `linear` | Infinite loop |
| Bottom sheet | `transform` | `300ms` | `cubic-bezier(0.32, 0.72, 0, 1)` | Open/close |

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

> **Rule:** Mọi animation PHẢI respect `prefers-reduced-motion`. Skeleton shimmer → static bg. Transitions → instant.

---

## 8g. Segment Control (Sub-tabs)

> **Rule:** Sub-tabs trong page PHẢI dùng `ion-segment` (Segmented Control), KHÔNG dùng underline tabs.
> Theo spec `phase-1-management.md`: "Management page có segment control: Nguyên liệu | Món ăn"

### Spec

| Property | Value | Notes |
|----------|-------|-------|
| Component | `ion-segment` + `ion-segment-button` | Ionic native |
| **Position** | **Trong content area** (dưới toolbar) | KHÔNG nằm trên toolbar bg — giảm top chrome nặng |
| Background | `var(--bg-page)` (`#F5F7FA` / `#121212`) | Nền page, không nền primary |
| Container bg | `#E8E8E8` (light) / `#333` (dark) | Pill track background |
| Active indicator | `var(--bg-card)` (white/dark card) pill, radius 8px | |
| Inactive text | `var(--text-tertiary)` | `#666` / `#999` |
| Active text | `var(--text-primary)`, `font-weight: 600` | `#1A1A1A` / `#FFF` |
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
| Default bg | `var(--bg-card)` | `#FFFFFF` / `#1E1E1E` |
| Active bg | `var(--ion-color-primary)` | `#2196F3` / `#42A5F5` |
| Active text | `#FFFFFF` / `#121212` | |

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
| Background | `var(--bg-elevated)` (`#FFFFFF` / `#2E2E2E`) |
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
1. **Radio circle** (18px, left) — unfilled #CCC border → filled #2196F3 + white dot
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
| Divider | 1px `var(--border-color)` between items |
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

  // Text
  --ion-text-color: #1A1A1A;
  --ion-text-color-rgb: 26, 26, 26;

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

    --ion-background-color: #121212;
    --ion-card-background: #1E1E1E;
    --ion-toolbar-background: #1565C0;
    --ion-tab-bar-background: #1E1E1E;

    --ion-text-color: #FFFFFF;
    --ion-text-color-rgb: 255, 255, 255;

    --ion-border-color: #333333;
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
| 1.1 | 2026-04-19 | Add: Input/Select spec (8.6), Radio/Checkbox (8.7), Toolbar (8.8), Interaction States (8b), Touch Targets (8c), Text Transform (8d), Icon Rules (8e), Animations (8f), Onboarding Components (8g). Fix: `--radius-sm` 8→12px, add `--radius-xs` 8px. |
| 1.0 | 2026-04-14 | Initial Design System — Color, Typography, Spacing, Components |
