# Design System — HealthMate AI

**Version:** 1.0  
**Date:** 2026-04-14  
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
| `--radius-sm` | 8px | Input fields, small chips |
| `--radius-md` | 12px | Quick action buttons, sub-cards (streak), tags |
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

| Action | Emoji (mockup) | Ionicon |
|--------|----------------|---------|
| Chụp ảnh | 📸 | `camera-outline` |
| Thêm món | ➕ | `add-circle-outline` |
| AI Coach | 🤖 | `chatbubble-ellipses-outline` |
| Cân nặng | ⚖️ | `scale-outline` |

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
| 1.0 | 2026-04-14 | Initial Design System — Color, Typography, Spacing, Components |
