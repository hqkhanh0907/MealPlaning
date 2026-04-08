# HƯỚNG DẪN THIẾT KẾ — Smart Meal Planner (Android)

> **Phiên bản:** 1.0  
> **Cập nhật:** Tháng 7, 2026  
> **Đối tượng:** UI/UX Designer tạo mockup Figma từ đầu  
> **Ngôn ngữ giao diện:** Tiếng Việt (duy nhất)

---

## Mục lục

| Chương | Nội dung                                                                                    | Trang |
| ------ | ------------------------------------------------------------------------------------------- | ----- |
| 1      | [Tổng quan dự án & Nền tảng](#chương-1-tổng-quan-dự-án--nền-tảng)                           | —     |
| 2      | [Hệ thống thiết kế (Design System)](#chương-2-hệ-thống-thiết-kế-design-system)              | —     |
| 3      | [Thành phần giao diện (UI Components)](#chương-3-thành-phần-giao-diện-ui-components)        | —     |
| 4      | [Kiến trúc điều hướng (Navigation)](#chương-4-kiến-trúc-điều-hướng-navigation-architecture) | —     |
| 5      | [Luồng Onboarding](#chương-5-luồng-onboarding-đón-tiếp-người-dùng-mới)                      | —     |
| 6      | [Tab Lịch (Calendar)](#chương-6-tab-lịch-calendar)                                          | —     |
| 7      | [Tab Thư viện (Library)](#chương-7-tab-thư-viện-library)                                    | —     |
| 8      | [Tab Phân tích AI](#chương-8-tab-phân-tích-ai-ai-analysis)                                  | —     |
| 9      | [Tab Tập luyện (Fitness)](#chương-9-tab-tập-luyện-fitness)                                  | —     |
| 10     | [Tab Tổng quan (Dashboard)](#chương-10-tab-tổng-quan-dashboard)                             | —     |
| 11     | [Cài đặt & Các Overlay](#chương-11-cài-đặt--các-overlay-settings)                           | —     |
| 12     | [Build APK & Emulator Setup](#chương-12-build-apk--emulator-setup)                          | —     |

---

## CHƯƠNG 1: TỔNG QUAN DỰ ÁN & NỀN TẢNG

### 1.1 Mô tả ứng dụng

**Smart Meal Planner** — ứng dụng Android all-in-one quản lý dinh dưỡng + kế hoạch tập luyện cá nhân.

| Đặc điểm          | Chi tiết                                                |
| ----------------- | ------------------------------------------------------- |
| **Offline-first** | Hoạt động không cần internet (trừ tính năng AI)         |
| **AI tích hợp**   | Google Gemini phân tích ảnh thức ăn, gợi ý thực đơn     |
| **Platform**      | Android (build APK qua Capacitor 8)                     |
| **Stack**         | React 19 + TypeScript + Tailwind CSS v4 + Vite 6        |
| **Ngôn ngữ UI**   | Tiếng Việt (duy nhất)                                   |
| **Database**      | SQLite (Capacitor SQLite plugin, lưu trữ trên thiết bị) |

### 1.2 Giới hạn nền tảng (Platform Constraints)

| Thông số              | Giá trị                                                     |
| --------------------- | ----------------------------------------------------------- |
| **Viewport width**    | 360px – 412px (điện thoại Android tiêu chuẩn)               |
| **Độ phân giải**      | 1080 × 2400 pixels                                          |
| **Mật độ điểm ảnh**   | 420 dpi                                                     |
| **Safe area top**     | ~24dp (thanh trạng thái hệ thống)                           |
| **Safe area bottom**  | ~48dp (thanh điều hướng hệ thống)                           |
| **Render engine**     | Capacitor WebView (nội dung web trong shell Android native) |
| **Bottom navigation** | 5 tab, luôn hiển thị trừ khi trang full-screen đang mở      |
| **Background color**  | `#f8fafc` (Slate-50)                                        |

### 1.3 Thống kê màn hình (Screen Inventory)

| Loại                           | Số lượng                    | Ghi chú                                                        |
| ------------------------------ | --------------------------- | -------------------------------------------------------------- |
| Tab chính                      | 5                           | Calendar, Library, AI, Fitness, Dashboard                      |
| Sub-tab view                   | 7                           | meals, nutrition, dishes, ingredients, plan, progress, history |
| Trang full-screen (page stack) | 8                           | Settings, WorkoutLogger, CardioLogger, PlanDayEditor...        |
| Trang cài đặt chi tiết         | 4                           | Health Profile, Goal, Training Profile, Theme                  |
| Modal dialog                   | 12+                         | MealPlanner, DishEdit, IngredientEdit, Confirmation...         |
| Bottom sheet                   | 5+                          | GroceryList, Filter, WeightQuickLog, SwapExercise...           |
| **Tổng cộng**                  | **45+ màn hình riêng biệt** |                                                                |

---

## CHƯƠNG 2: HỆ THỐNG THIẾT KẾ (DESIGN SYSTEM)

### 2.1 Bảng màu (Color Palette)

Toàn bộ màu sử dụng định dạng **OKLCH** (Oklab Lightness-Chroma-Hue) để đảm bảo đồng nhất về mặt cảm nhận thị giác.

#### Màu chính (Primary Colors)

| Token                  | Giá trị OKLCH               | Mã hex xấp xỉ         | Công dụng                             |
| ---------------------- | --------------------------- | --------------------- | ------------------------------------- |
| `--primary`            | `oklch(0.627 0.194 163.95)` | `#059669` Emerald-600 | Nút CTA, trạng thái active, nút chính |
| `--primary-foreground` | `oklch(1 0 0)`              | `#FFFFFF`             | Chữ trên nền primary                  |
| `--secondary`          | `oklch(0.696 0.17 162.48)`  | `#10B981` Emerald-500 | Hover, phần tử phụ, focus ring        |
| `--primary-subtle`     | `oklch(0.962 0.044 163.25)` | `#ECFDF5` Emerald-50  | Nền nhẹ cho badge, tag primary        |
| `--primary-emphasis`   | `oklch(0.527 0.154 163.45)` | `#047857` Emerald-700 | Nhấn mạnh hơn primary                 |

#### Màu hành động & cảnh báo

| Token                    | Giá trị OKLCH              | Mã hex               | Công dụng                   |
| ------------------------ | -------------------------- | -------------------- | --------------------------- |
| `--destructive`          | `oklch(0.637 0.237 25.33)` | `#EF4444` Red-500    | Nút xóa, trạng thái lỗi     |
| `--destructive-emphasis` | `oklch(0.505 0.213 27.33)` | `#B91C1C` Red-700    | Hover destructive           |
| `--destructive-subtle`   | `oklch(0.971 0.013 17.38)` | `#FEF2F2` Red-50     | Nền nhẹ cho cảnh báo xóa    |
| `--accent-warm`          | `oklch(0.606 0.222 22)`    | `#EA580C` Orange     | CTA đặc biệt, nút highlight |
| `--accent-highlight`     | `oklch(0.606 0.25 292.72)` | `#8B5CF6` Violet-500 | Feature highlight, premium  |

#### Màu dinh dưỡng (Macro Nutrition)

| Token             | Giá trị OKLCH               | Mã hex              | Đại diện         |
| ----------------- | --------------------------- | ------------------- | ---------------- |
| `--macro-protein` | `oklch(0.588 0.158 241.97)` | `#0284C7` Sky-600   | Protein (Đạm)    |
| `--macro-fat`     | `oklch(0.555 0.163 48.99)`  | `#B45309` Amber-700 | Fat (Chất béo)   |
| `--macro-carbs`   | `oklch(0.546 0.245 262.88)` | `#2563EB` Blue-600  | Carbs (Tinh bột) |
| `--macro-fiber`   | `oklch(0.527 0.198 142.5)`  | `#15803D` Green-700 | Fiber (Chất xơ)  |

> Mỗi macro có thêm biến thể `-emphasis` (đậm hơn) và `-subtle` (nhạt hơn) cho badge, nền, biểu đồ.

#### Màu loại bữa ăn (Meal Type)

| Token              | Giá trị OKLCH                | Mã hex     | Biểu tượng  |
| ------------------ | ---------------------------- | ---------- | ----------- |
| `--meal-breakfast` | `oklch(0.795 0.184 86.047)`  | Amber-400  | ☀️ Bữa Sáng |
| `--meal-lunch`     | `oklch(0.685 0.169 237.323)` | Sky-500    | 🌤️ Bữa Trưa |
| `--meal-dinner`    | `oklch(0.585 0.233 277.117)` | Indigo-500 | 🌙 Bữa Tối  |

#### Màu trạng thái (Status)

| Token              | Giá trị OKLCH               | Mã hex                | Công dụng  |
| ------------------ | --------------------------- | --------------------- | ---------- |
| `--status-success` | `oklch(0.637 0.16 163.89)`  | `#059669` Emerald-600 | Thành công |
| `--status-warning` | `oklch(0.666 0.179 58.32)`  | `#D97706` Amber-600   | Cảnh báo   |
| `--status-info`    | `oklch(0.546 0.245 262.88)` | `#2563EB` Blue-600    | Thông tin  |

#### Màu thông báo Toast

| Nhóm                | Base                                | Subtle (nền)                       | Emphasis (chữ đậm)                 |
| ------------------- | ----------------------------------- | ---------------------------------- | ---------------------------------- |
| **Error** (Rose)    | `oklch(0.645 0.246 16.4)` Rose-500  | `oklch(0.969 0.015 12.4)` Rose-50  | `oklch(0.455 0.188 13.7)` Rose-800 |
| **Warning** (Amber) | `oklch(0.769 0.188 70.1)` Amber-500 | `oklch(0.987 0.022 95.3)` Amber-50 | `oklch(0.513 0.165 55)` Amber-800  |
| **Info** (Sky)      | `oklch(0.685 0.169 237.3)` Sky-500  | `oklch(0.977 0.013 236.6)` Sky-50  | `oklch(0.443 0.11 240.8)` Sky-800  |

#### Màu tính năng đặc biệt (Domain-Specific)

| Token              | Giá trị OKLCH                         | Công dụng                    |
| ------------------ | ------------------------------------- | ---------------------------- |
| `--color-ai`       | `oklch(0.585 0.233 277.1)` Indigo-500 | Tính năng AI, badge AI       |
| `--color-energy`   | `oklch(0.769 0.188 70.1)` Amber-400   | Năng lượng/calo              |
| `--color-rose`     | `oklch(0.645 0.246 16.4)` Rose-500    | Tim/yêu thích, thâm hụt calo |
| `--compare-active` | `oklch(0.746 0.16 232.66)` Blue-400   | Chế độ so sánh (active)      |

#### Chế độ tối (Dark Mode)

App hỗ trợ **đầy đủ dark mode** với selector `.dark`. Mọi màu chức năng đều có tương đương dark.

| Token          | Light                                    | Dark                                    |
| -------------- | ---------------------------------------- | --------------------------------------- |
| `--background` | `oklch(0.985 0.015 163)` Emerald-50 warm | `oklch(0.208 0.026 264.69)` Slate-900   |
| `--foreground` | `oklch(0.208 0.026 264.69)` Slate-900    | `oklch(0.929 0.013 255.51)` Slate-200   |
| `--card`       | `oklch(1 0 0)` White                     | `oklch(0.295 0.029 260.03)` Slate-800   |
| `--primary`    | `oklch(0.627 0.194 163.95)` Emerald-600  | `oklch(0.765 0.177 163.22)` Emerald-400 |
| `--border`     | `oklch(0.945 0.025 163)` Green-tinted    | `oklch(1 0 0 / 10%)` White 10%          |
| `--muted`      | `oklch(0.972 0.015 163)` Emerald-tinted  | `oklch(0.295 0.029 260.03)` Slate-800   |

> **Quy tắc thiết kế dark mode:** Trong dark mode, màu primary chuyển từ Emerald-600 → Emerald-400 (sáng hơn), background từ gần-trắng → gần-đen với tint emerald nhẹ. Meal type colors cũng chuyển sang biến thể 600 (đậm hơn) thay vì 400-500.

### 2.2 Typography (Hệ chữ)

**Font family:** System fonts — không tải custom web font.

```
ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif
```

**Hệ thống phân cấp 5 bậc:**

| Token        | Kích thước      | Line-height | Letter-spacing | Font-weight    | Công dụng                     |
| ------------ | --------------- | ----------- | -------------- | -------------- | ----------------------------- |
| `stat-big`   | 32px (2rem)     | 1.1         | -0.02em        | 700 (Bold)     | Số calo chính, KPI lớn        |
| `stat-med`   | 24px (1.5rem)   | 1.2         | -0.01em        | 700 (Bold)     | Số thống kê phụ (TDEE, macro) |
| `page`       | 24px (1.5rem)   | 1.3         | -0.01em        | 700 (Bold)     | Tiêu đề trang                 |
| `section`    | 18px (1.125rem) | 1.4         | —              | 600 (Semibold) | Tiêu đề section               |
| `card-title` | 16px (1rem)     | 1.5         | —              | 600 (Semibold) | Tiêu đề card, item            |

**Kích thước bổ sung (Tailwind mặc định):**

| Tên                   | Kích thước | Công dụng                 |
| --------------------- | ---------- | ------------------------- |
| `body` / `text-sm`    | 14px       | Nội dung chính (mặc định) |
| `caption` / `text-xs` | 12px       | Nhãn, gợi ý, timestamp    |
| `text-base`           | 16px       | Nội dung lớn hơn          |

**Đặc biệt:** Token `stat-big` và `stat-med` tự động áp dụng `font-variant-numeric: tabular-nums` để các chữ số thẳng hàng khi hiển thị cạnh nhau (ví dụ: 1327/2091 kcal).

### 2.3 Hệ thống khoảng cách (Spacing)

Dựa trên **hệ thống lưới 8dp** (8 density-independent pixels).

| Token          | Giá trị        | Công dụng                                    |
| -------------- | -------------- | -------------------------------------------- |
| `inline-tight` | 4px (0.25rem)  | Khoảng cách icon↔text, padding chặt          |
| `inline-gap`   | 8px (0.5rem)   | Khoảng cách badge↔badge, phần tử inline      |
| `card-padding` | 12px (0.75rem) | Padding bên trong card                       |
| `card-gap`     | 16px (1rem)    | Khoảng cách giữa các card trong cùng section |
| `section-gap`  | 24px (1.5rem)  | Khoảng cách giữa các section                 |
| `breathing`    | 32px (2rem)    | Phân cách lớn giữa các nhóm section          |

**Safe area insets (Capacitor):**

- `--sat`: Khoảng cách an toàn phía trên (status bar)
- `--sab`: Khoảng cách an toàn phía dưới (navigation bar)

### 2.4 Bo góc (Border Radius)

**Giá trị gốc:** `--radius` = 10px (0.625rem)

| Token  | Giá trị | Công dụng                  |
| ------ | ------- | -------------------------- |
| `sm`   | ~3.75px | Pill nhỏ, tag nhỏ          |
| `md`   | ~5px    | Nút bấm, input             |
| `lg`   | 10px    | Card (mặc định), container |
| `xl`   | 14px    | Modal, bottom sheet        |
| `2xl`  | 18px    | Dialog lớn                 |
| `3xl`  | 22px    | Hero card, onboarding card |
| `4xl`  | 26px    | Phần tử đặc biệt lớn       |
| `full` | 9999px  | Hình tròn, pill badge      |

> **Quy tắc:** Card dùng `lg` (10px). Button dùng `md` (5px). Modal dùng `xl` (14px). Badge dùng `full` (pill).

### 2.5 Bóng đổ (Shadows)

| Token  | CSS Value                                  | Mô tả                                 |
| ------ | ------------------------------------------ | ------------------------------------- |
| `none` | `none`                                     | Không bóng                            |
| `sm`   | `0 1px 2px rgba(0,0,0,0.05)`               | Bóng nhẹ — card mặc định              |
| `md`   | `0 2px 8px rgba(0,0,0,0.08)`               | Bóng trung bình — modal, popover      |
| `lg`   | `0 4px 20px rgba(0,0,0,0.12)`              | Bóng mạnh — floating element          |
| `glow` | `0 2px 6px oklch(0.696 0.17 162.48 / 0.3)` | Ánh sáng Emerald — highlight đặc biệt |

> **Dark mode:** `glow` chuyển sang Emerald-400 với 30% alpha.

### 2.6 Biểu tượng (Icons)

| Thuộc tính            | Giá trị                                         |
| --------------------- | ----------------------------------------------- |
| **Thư viện**          | Lucide React (`lucide-react` v0.546.0)          |
| **Kích thước inline** | 20px (h-5 w-5) — icon trong text, tab bar       |
| **Kích thước action** | 24px (h-6 w-6) — nút hành động                  |
| **Kích thước nhỏ**    | 16px (h-4 w-4) — badge, indicator               |
| **Stroke width**      | Đồng nhất theo mặc định Lucide                  |
| **Màu sắc**           | Kế thừa từ text parent hoặc dùng semantic color |

**Một số icon thường dùng:**

| Icon Lucide       | Vị trí sử dụng                  |
| ----------------- | ------------------------------- |
| `Calendar`        | Tab Lịch                        |
| `ClipboardList`   | Tab Thư viện                    |
| `Bot`             | Tab Phân tích AI                |
| `Dumbbell`        | Tab Tập luyện                   |
| `LayoutDashboard` | Tab Tổng quan                   |
| `UtensilsCrossed` | Sub-tab Bữa ăn                  |
| `BarChart3`       | Sub-tab Dinh dưỡng / Tiến trình |
| `History`         | Sub-tab Lịch sử                 |
| `Settings`        | Nút cài đặt                     |
| `TrendingDown`    | Mục tiêu Giảm cân               |
| `TrendingUp`      | Mục tiêu Tăng cơ                |
| `Minus`           | Mục tiêu Duy trì                |
| `Scale`           | Ghi cân nặng                    |
| `Activity`        | Cardio                          |

### 2.7 Hoạt ảnh (Animations)

#### Đường cong chuyển động (Easing)

| Token           | CSS Value                           | Công dụng                    |
| --------------- | ----------------------------------- | ---------------------------- |
| `--ease-enter`  | `cubic-bezier(0, 0, 0.2, 1)`        | Phần tử xuất hiện (ease-out) |
| `--ease-exit`   | `cubic-bezier(0.4, 0, 1, 1)`        | Phần tử biến mất (ease-in)   |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Hiệu ứng đàn hồi (bounce)    |

#### Thời lượng

| Token                | Giá trị |
| -------------------- | ------- |
| `--duration-instant` | 0ms     |
| `--duration-fast`    | 150ms   |
| `--duration-normal`  | 250ms   |
| `--duration-slow`    | 400ms   |

#### Keyframes

| Animation      | Thời lượng | Mô tả                               |
| -------------- | ---------- | ----------------------------------- |
| `fadeIn`       | 200ms      | Opacity 0→1                         |
| `slideUp`      | 300ms      | Dịch lên 8px + fade (phổ biến nhất) |
| `scaleIn`      | 150ms      | Scale 0.95→1 + fade                 |
| `pulse-subtle` | 2s × 3 lần | Box-shadow nhấp nháy nhẹ            |
| `loading-bar`  | 1.5s ∞     | Thanh loading chạy qua lại          |

#### Hiệu ứng xếp tầng (Stagger)

Khi hiển thị danh sách item (ví dụ: card dashboard), mỗi item xuất hiện lần lượt với delay tăng dần:

| Bậc       | Delay |
| --------- | ----- |
| Stagger-1 | 30ms  |
| Stagger-2 | 60ms  |
| Stagger-3 | 90ms  |
| Stagger-4 | 120ms |
| Stagger-5 | 150ms |

> **QUAN TRỌNG:** Phải tôn trọng `prefers-reduced-motion` — tắt hoạt ảnh khi người dùng thiết lập giảm chuyển động.

---

## CHƯƠNG 3: THÀNH PHẦN GIAO DIỆN (UI COMPONENTS)

### 3.1 Button (Nút bấm)

**7 biến thể (Variants):**

| Variant       | Màu nền              | Màu chữ    | Công dụng                       |
| ------------- | -------------------- | ---------- | ------------------------------- |
| `default`     | Emerald-600          | White      | CTA chính, hành động quan trọng |
| `destructive` | Red-500              | White      | Xóa, hành động nguy hiểm        |
| `outline`     | Transparent + border | Foreground | Hành động phụ                   |
| `secondary`   | Emerald-500          | White      | Hành động phụ nổi bật           |
| `ghost`       | Transparent          | Foreground | Hành động nhẹ, ít nhấn mạnh     |
| `link`        | Transparent          | Primary    | Liên kết dạng nút               |
| `accent-warm` | Orange               | White      | CTA đặc biệt, nổi bật           |

**7 kích thước (Sizes):**

| Size      | Chiều cao   | Padding   | Font             |
| --------- | ----------- | --------- | ---------------- |
| `xs`      | 28px (h-7)  | px-2.5    | text-xs (12px)   |
| `sm`      | 32px (h-8)  | px-3      | text-xs (12px)   |
| `default` | 36px (h-9)  | px-4 py-2 | text-sm (14px)   |
| `lg`      | 40px (h-10) | px-6      | text-sm (14px)   |
| `xl`      | 44px (h-11) | px-8      | text-base (16px) |
| `icon-sm` | 28px        | Vuông     | Chỉ icon 16px    |
| `icon`    | 36px        | Vuông     | Chỉ icon 20px    |

**Trạng thái:**

- **Hover:** Đổi opacity hoặc shade
- **Focus-visible:** Viền focus ring 2px Emerald-500, offset 2px
- **Disabled:** Opacity 50%, con trỏ not-allowed
- **Loading:** Spinner icon thay thế nội dung

### 3.2 Card (Thẻ)

**3 biến thể:**

| Variant    | Mô tả                                |
| ---------- | ------------------------------------ |
| `default`  | Nền trắng + viền nhẹ (phổ biến nhất) |
| `glass`    | Nền mờ + hiệu ứng blur (đặc biệt)    |
| `bordered` | Viền đậm hơn default                 |

**2 kích thước:**

| Size      | Padding    | Gap nội bộ   |
| --------- | ---------- | ------------ |
| `default` | 16px (p-4) | 16px (gap-4) |
| `compact` | 12px (p-3) | 8px (gap-2)  |

**Cấu trúc con:** Card.Header → Card.Title + Card.Description → Card.Content → Card.Footer

Bo góc mặc định: `rounded-lg` (10px)

### 3.3 Input & Select (Ô nhập liệu)

| Thành phần      | Chiều cao                            | Mô tả                                         |
| --------------- | ------------------------------------ | --------------------------------------------- |
| **Input**       | 36px (h-9)                           | Viền, bo góc md, placeholder text, focus ring |
| **Select**      | 36px (h-9) hoặc 32px (h-8 cho sm)    | Dropdown với danh sách option                 |
| **RadioGroup**  | —                                    | Radio buttons dọc hoặc ngang                  |
| **Switch**      | 2 size (default, sm)                 | Toggle bật/tắt                                |
| **Toggle**      | 2 variant (default, outline), 3 size | Nút toggle trạng thái                         |
| **ToggleGroup** | —                                    | Nhóm toggle loại trừ lẫn nhau                 |

### 3.4 Badge (Huy hiệu)

**12 biến thể:**

| Variant       | Màu               | Công dụng          |
| ------------- | ----------------- | ------------------ |
| `default`     | Primary (Emerald) | Mặc định           |
| `secondary`   | Muted             | Phụ                |
| `destructive` | Red               | Cảnh báo nguy hiểm |
| `outline`     | Viền              | Nhẹ nhàng          |
| `success`     | Emerald           | Thành công         |
| `warning`     | Amber             | Cảnh báo           |
| `info`        | Blue              | Thông tin          |
| `protein`     | Sky-600           | Chỉ số Protein     |
| `fat`         | Amber-700         | Chỉ số Fat         |
| `carbs`       | Blue-600          | Chỉ số Carbs       |
| `fiber`       | Green-700         | Chỉ số Fiber       |
| `ai`          | Indigo-500        | Tính năng AI       |

Hình dạng: Pill (bo tròn hoàn toàn), chữ nhỏ, nền màu nhạt.

### 3.5 Dialog / AlertDialog (Hộp thoại)

| Loại            | Mô tả                                                                  |
| --------------- | ---------------------------------------------------------------------- |
| **Dialog**      | Overlay giữa màn hình, nền mờ (backdrop blur), max-width sm/default/lg |
| **AlertDialog** | Tương tự nhưng có nút Confirm/Cancel rõ ràng. 2 size: default, sm      |

- Nút đóng: X góc trên phải hoặc nút Cancel
- Backdrop click hoặc phím Escape để đóng

### 3.6 Sheet (Bottom Sheet)

| Thuộc tính      | Giá trị                            |
| --------------- | ---------------------------------- |
| **Hướng**       | Chủ yếu bottom (trượt lên từ dưới) |
| **Drag handle** | Thanh kéo ở đầu sheet              |
| **Backdrop**    | Overlay tối                        |
| **Nội dung**    | Có thể cuộn (scrollable)           |
| **Bo góc**      | `rounded-t-2xl` (18px top)         |

### 3.7 ModalBackdrop (Nền modal tùy chỉnh)

- **Scroll-lock:** Khóa cuộn nền (đếm tham chiếu cho modal lồng nhau)
- **Focus trap:** Tab chỉ di chuyển trong modal
- **Escape stacking:** Modal mới nhất đóng trước
- **Overlay:** Nền tối mờ

### 3.8 Thành phần điều hướng (Navigation Components)

**BottomNavBar:**

```
┌─────────────────────────────────────────────┐
│  📅         📋         🤖         💪         📊  │
│ Lịch trình  Thư viện  Phân tích  Tập luyện  Tổng quan │
└─────────────────────────────────────────────┘
```

- 5 tab: icon (20px) + label tiếng Việt
- Tab active: màu Primary (Emerald)
- Tab inactive: màu Muted-foreground (Slate-600)
- **Ẩn** khi trang full-screen đang mở (pageStack > 0)

**SubTabBar:**

- Tab ngang trong nội dung trang
- Active indicator: gạch dưới màu Primary
- Sử dụng cho: Calendar (2 tab), Library (2 tab), Fitness (3 tab)

### 3.9 Thành phần Form đặc biệt

| Thành phần                 | Mô tả                                                       |
| -------------------------- | ----------------------------------------------------------- |
| **FormField**              | Label + input + thông báo lỗi                               |
| **ChipSelect**             | Multi-select dạng pill (ví dụ: chọn loại bữa, thiết bị tập) |
| **RadioPills**             | Radio buttons ngang dạng pill                               |
| **StringNumberController** | Input số với nút +/- hoặc slider                            |

### 3.10 Thành phần hiển thị dữ liệu

| Thành phần            | Mô tả                                                   |
| --------------------- | ------------------------------------------------------- |
| **MacroDonutChart**   | Biểu đồ donut SVG: protein/fat/carbs/fiber              |
| **EnergyBalanceCard** | Card tóm tắt calo (BMR, TDEE, Target, eaten, remaining) |
| **MiniNutritionBar**  | Thanh ngang compact hiển thị tiến độ calo/protein       |
| **Progress**          | Thanh tiến độ tuyến tính có phần trăm                   |
| **Skeleton**          | Placeholder loading (hiệu ứng pulse)                    |

### 3.11 Thành phần dùng chung (Shared Components)

| Thành phần               | Mô tả                                                             |
| ------------------------ | ----------------------------------------------------------------- |
| **EmptyState**           | 3 variant (default, search, error) — icon + tiêu đề + mô tả + CTA |
| **FilterBottomSheet**    | Bottom sheet bộ lọc (checkbox, range)                             |
| **ListToolbar**          | Thanh tìm kiếm + nút lọc + dropdown sắp xếp                       |
| **UnitSelector**         | Toggle đổi đơn vị (kg/lbs, cm/in)                                 |
| **CloseButton**          | 2 variant: icon button mặc định, overlay close                    |
| **UnsavedChangesDialog** | 3 nút: "Lưu & quay lại" / "Bỏ thay đổi" / "Ở lại chỉnh sửa"       |
| **DisabledReason**       | Tooltip giải thích lý do element bị vô hiệu hóa                   |
| **AiBadge**              | Badge nhỏ chỉ tính năng AI                                        |
| **ConfirmationModal**    | Dialog xác nhận chung (variant danger/warning)                    |

---

## CHƯƠNG 4: KIẾN TRÚC ĐIỀU HƯỚNG (NAVIGATION ARCHITECTURE)

### 4.1 Mô hình Tab + Page Stack

```
┌──────────────────────────────────────────────┐
│              Status Bar (24dp)                │
├──────────────────────────────────────────────┤
│                                              │
│                                              │
│           Nội dung Tab đang active           │
│        (Calendar / Library / AI /            │
│         Fitness / Dashboard)                 │
│                                              │
│                                              │
│                                              │
├──────────────────────────────────────────────┤
│  📅      📋       🤖      💪       📊       │
│ Lịch    Thư     Phân    Tập     Tổng       │
│ trình   viện    tích    luyện   quan        │
│          Bottom Navigation Bar              │
└──────────────────────────────────────────────┘
```

**5 Tab chính:**

| Tab           | Icon Lucide       | Label tiếng Việt | Sub-tab mặc định |
| ------------- | ----------------- | ---------------- | ---------------- |
| `calendar`    | `Calendar`        | Lịch trình       | `meals`          |
| `library`     | `ClipboardList`   | Thư viện         | `dishes`         |
| `ai-analysis` | `Bot`             | Phân tích        | (không có)       |
| `fitness`     | `Dumbbell`        | Tập luyện        | `plan`           |
| `dashboard`   | `LayoutDashboard` | Tổng quan        | (không có)       |

### 4.2 Page Stack (Trang Full-Screen)

Khi mở trang full-screen:

```
┌──────────────────────────────────────────────┐
│  ← Quay lại      Tiêu đề trang         [✕]  │
├──────────────────────────────────────────────┤
│                                              │
│                                              │
│         Nội dung trang Full-Screen           │
│      (Settings, WorkoutLogger, v.v.)         │
│                                              │
│                                              │
│                                              │
│       Bottom nav bị ẨN hoàn toàn            │
│                                              │
└──────────────────────────────────────────────┘
```

**Quy tắc:**

- Độ sâu tối đa: **2 tầng** (trang chồng trang)
- Bottom nav **ẩn hoàn toàn** khi page stack active
- Nút ← hoặc ✕ để đóng → quay về tab trước
- Chuyển tab **luôn xóa** page stack

**8 trang Full-Screen:**

| Trang                 | Mở từ đâu                       | Mô tả                          |
| --------------------- | ------------------------------- | ------------------------------ |
| `SettingsTab`         | Icon ⚙️ ở header bất kỳ tab nào | Cài đặt ứng dụng               |
| `WorkoutLogger`       | Dashboard CTA hoặc Fitness      | Ghi nhật ký buổi tập           |
| `CardioLogger`        | Dashboard CTA hoặc Fitness      | Ghi nhật ký cardio             |
| `PlanDayEditor`       | Tap ngày trong Fitness Plan     | Chỉnh sửa bài tập cho 1 ngày   |
| `PlanScheduleEditor`  | Nút chỉnh sửa lịch tuần         | Chỉnh sửa lịch tập tuần        |
| `SplitChanger`        | Menu đổi split                  | Đổi loại chia nhóm cơ          |
| `PlanTemplateGallery` | Nút Template                    | Duyệt & chọn template kế hoạch |
| `GoalDetailPage`      | Settings hoặc Calendar          | Xem/sửa mục tiêu cân nặng      |

### 4.3 Hệ thống Modal

Modal hiển thị dạng overlay giữa màn hình với backdrop tối:

```
┌──────────────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░┌────────────────────────────────┐░░░░  │
│  ░░░│        Tiêu đề Modal          │░░░░  │
│  ░░░│                                │░░░░  │
│  ░░░│        Nội dung Modal          │░░░░  │
│  ░░░│                                │░░░░  │
│  ░░░│     [Hủy]     [Xác nhận]      │░░░░  │
│  ░░░└────────────────────────────────┘░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
└──────────────────────────────────────────────┘
```

**Quy tắc modal:**

- Chỉ **1 modal mở** tại một thời điểm (quản lý bởi `useModalManager`)
- Click backdrop hoặc Escape để đóng
- Focus bị giữ (trap) trong modal
- Cuộn nền bị khóa

**12+ Modal dialogs:**

| Modal                         | Mô tả                                                |
| ----------------------------- | ---------------------------------------------------- |
| `MealPlannerModal`            | Chọn món cho bữa ăn (tìm kiếm, lọc, sắp xếp)         |
| `DishEditModal`               | Tạo/sửa món ăn (multi-step: thông tin → nguyên liệu) |
| `IngredientEditModal`         | Tạo/sửa nguyên liệu                                  |
| `SaveAnalyzedDishModal`       | Lưu món từ AI phân tích                              |
| `AISuggestionPreviewModal`    | Xem trước gợi ý AI thực đơn                          |
| `AISuggestIngredientsPreview` | Xem trước gợi ý AI nguyên liệu                       |
| `CopyPlanModal`               | Sao chép kế hoạch bữa ăn sang ngày khác              |
| `ClearPlanModal`              | Xóa kế hoạch bữa ăn (xác nhận)                       |
| `SaveTemplateModal`           | Lưu kế hoạch dạng template                           |
| `TemplateManager`             | Duyệt, tải, xóa template                             |
| `ConfirmationModal`           | Xác nhận hành động chung (danger/warning)            |
| `SyncConflictModal`           | Giải quyết xung đột Local vs Cloud                   |

### 4.4 Bottom Sheet

Trượt lên từ dưới:

```
┌──────────────────────────────────────────────┐
│                                              │
│          Nội dung Tab (mờ đi)                │
│                                              │
├──────────────────────────────────────────────┤
│  ──────────── (thanh kéo) ────────────       │
│                                              │
│         Nội dung Bottom Sheet                │
│         (có thể cuộn)                        │
│                                              │
└──────────────────────────────────────────────┘
```

**Các Bottom Sheet chính:**

| Sheet                   | Mô tả                                                 |
| ----------------------- | ----------------------------------------------------- |
| `FilterBottomSheet`     | Bộ lọc trong MealPlanner (sắp xếp + lọc calo/protein) |
| `WeightQuickLog`        | Ghi nhanh cân nặng (input + note + save)              |
| `SwapExerciseSheet`     | Đổi bài tập trong PlanDayEditor                       |
| `DayAssignmentSheet`    | Gán ngày tập trong PlanScheduleEditor                 |
| `EnergyDetailSheet`     | Chi tiết năng lượng (BMR/TDEE/Target breakdown)       |
| `ExerciseSelectorSheet` | Chọn bài tập (tìm kiếm + danh mục)                    |

### 4.5 Thứ tự Z-Index (Rendering Order)

| Z-Index | Lớp                | Mô tả                                                    |
| ------- | ------------------ | -------------------------------------------------------- |
| Z-0     | Base               | Nội dung tab chính                                       |
| Z-50    | Modal cơ sở        | Modal mặc định, settings overlay                         |
| Z-60    | Dialog chuẩn       | DishEdit, IngredientEdit, ExerciseSelector, Filter       |
| Z-70    | Dialog ưu tiên cao | Confirmation, UnsavedChanges, SwapExercise, SaveAnalyzed |
| Z-80    | Toast              | Thông báo toast (cao nhất)                               |

### 4.6 Luồng điều hướng giữa các Tab

```
Dashboard ──"Thêm bữa"──────────→ Calendar (sub-tab: Bữa ăn)
Dashboard ──"Bắt đầu tập"───────→ WorkoutLogger (full-screen)
Dashboard ──"Lên kế hoạch"──────→ Calendar (sub-tab: Bữa ăn)
Dashboard ──"Ghi cân"───────────→ WeightQuickLog (bottom sheet)
Dashboard ──"Cardio"────────────→ CardioLogger (full-screen)
Dashboard ──"Xem kế hoạch tập"──→ Fitness (sub-tab: Kế hoạch)

AI Analysis ──"Lưu món"─────────→ Library (sub-tab: Món ăn)
AI Analysis ──"Lưu nguyên liệu"─→ Library (sub-tab: Nguyên liệu)
AI Analysis ──"Áp dụng gợi ý"───→ Calendar (sub-tab: Bữa ăn)

Bất kỳ tab ──Icon ⚙️────────────→ Settings (full-screen)

Fitness ──tap ngày───────────────→ PlanDayEditor (full-screen)
Fitness ──"Bắt đầu buổi tập"────→ WorkoutLogger (full-screen)
```

---

## CHƯƠNG 5: LUỒNG ONBOARDING (ĐÓN TIẾP NGƯỜI DÙNG MỚI)

Luồng onboarding có **7 section**. App KHÔNG hiển thị nội dung chính cho đến khi onboarding hoàn tất.

### Sơ đồ tổng thể

```
Khởi chạy App
    │
    ▼
┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│  Welcome  │───▶│  Health   │───▶│ Activity  │───▶│   Goal    │
│  3 slide  │    │  Basic    │    │  Level    │    │  Select   │
└───────────┘    └───────────┘    └───────────┘    └───────────┘
                                                        │
    ┌───────────────────────────────────────────────────┘
    ▼
┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│ Training  │───▶│ Training  │───▶│ Strategy  │───▶│   Plan    │
│   Core    │    │  Details  │    │ & Compute │    │  Preview  │
└───────────┘    └───────────┘    └───────────┘    └───────────┘
                                                        │
                                                        ▼
                                                  ┌───────────┐
                                                  │ Main App  │
                                                  └───────────┘
```

### Section 1: Welcome (3 Slide)

**Bố cục:** Full-screen, nội dung căn giữa

| Slide | Nội dung                                 | Icon     |
| ----- | ---------------------------------------- | -------- |
| 1     | "Chào mừng đến với Smart Meal Planner"   | Utensils |
| 2     | "Dinh dưỡng chính xác" — mô tả tính năng | Chart    |
| 3     | "Tập luyện & Sức khỏe" — mô tả tính năng | Dumbbell |

- Điều hướng: Nút "Tiếp tục" ở dưới, dấu chấm tiến trình (dot indicator)
- Slide cuối: Nút "Bắt đầu" chuyển sang Section 2
- Nút "Bỏ qua" ở góc trên

### Section 2: Health Basic Profile

**Bố cục:** Form cuộn dọc

```
┌─────────────────────────────────────┐
│  Hồ sơ sức khỏe                    │
├─────────────────────────────────────┤
│                                     │
│  Giới tính:                         │
│  ┌──────────┐  ┌──────────┐        │
│  │   Nam     │  │    Nữ    │        │
│  └──────────┘  └──────────┘        │
│                                     │
│  Tên:                               │
│  [_______________________________]  │
│                                     │
│  Ngày sinh:                         │
│  [____/____/________]               │
│                                     │
│  Chiều cao (cm):                    │
│  [_________]  (100–250)             │
│                                     │
│  Cân nặng (kg):                     │
│  [_________]  (30–300)              │
│                                     │
│         [Tiếp tục →]                │
└─────────────────────────────────────┘
```

**Chi tiết field:**

| Field     | ID           | Type              | Validation             |
| --------- | ------------ | ----------------- | ---------------------- |
| Giới tính | 2 nút toggle | `male` / `female` | Bắt buộc               |
| Tên       | `ob-name`    | Text              | Max 50 ký tự, bắt buộc |
| Ngày sinh | `ob-dob`     | Date              | Bắt buộc               |
| Chiều cao | `ob-height`  | Number            | 100–250 cm, bắt buộc   |
| Cân nặng  | `ob-weight`  | Number            | 30–300 kg, bắt buộc    |

### Section 3: Activity Level (Mức vận động)

**Bố cục:** 5 card chọn, xếp dọc

| Giá trị        | Label tiếng Việt | Hệ số nhân | Mô tả                            |
| -------------- | ---------------- | ---------- | -------------------------------- |
| `sedentary`    | Ít vận động      | ×1.2       | Công việc bàn giấy, ít tập       |
| `light`        | Vận động nhẹ     | ×1.375     | Tập nhẹ 1-3 ngày/tuần            |
| `moderate`     | Vận động vừa     | ×1.55      | Tập vừa 3-5 ngày/tuần            |
| `active`       | Vận động nhiều   | ×1.725     | Tập nặng 6-7 ngày/tuần           |
| `extra_active` | Cường độ cao     | ×1.9       | Tập rất nặng + công việc thể lực |

- Tap card để chọn → viền Emerald nổi bật
- Nút "Tiếp tục" ở dưới

### Section 4: Goal Selection (Chọn mục tiêu)

**Bố cục:** 3 card mục tiêu + bộ chọn tốc độ

```
┌─────────────────────────────────────┐
│  Mục tiêu của bạn:                  │
│                                     │
│  ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │ Giảm cân│ │ Duy trì │ │ Tăng cơ││
│  │   ↓     │ │   —     │ │   ↑    ││
│  └─────────┘ └─────────┘ └────────┘│
│                                     │
│  Tốc độ thay đổi:                  │
│  (hiện khi chọn Giảm/Tăng)        │
│  ┌──────────┐ ┌──────┐ ┌─────────┐│
│  │ Nhẹ      │ │ Vừa  │ │ Mạnh    ││
│  │ ~0.25kg/ │ │~0.5kg│ │ ~1kg/   ││
│  │  tuần    │ │/tuần │ │  tuần   ││
│  └──────────┘ └──────┘ └─────────┘│
│                                     │
│         [Tiếp tục →]                │
└─────────────────────────────────────┘
```

**Offset calo theo mục tiêu:**

| Mục tiêu | Tốc độ                   | Offset (kcal/ngày) |
| -------- | ------------------------ | ------------------ |
| Giảm cân | Nhẹ nhàng (Conservative) | −275               |
| Giảm cân | Vừa phải (Moderate)      | −550               |
| Giảm cân | Mạnh mẽ (Aggressive)     | −1100              |
| Duy trì  | —                        | 0                  |
| Tăng cơ  | Nhẹ nhàng                | +275               |
| Tăng cơ  | Vừa phải                 | +550               |
| Tăng cơ  | Mạnh mẽ                  | +1100              |

### Section 5: Training Core (Thiết lập tập luyện cơ bản)

**Bố cục:** 3 nhóm field

**Nhóm 1 — Mục tiêu tập luyện** (lưới 2×2):

- `strength`: Tăng sức mạnh
- `hypertrophy`: Tăng cơ bắp
- `endurance`: Tăng sức bền
- `general`: Tổng hợp

**Nhóm 2 — Kinh nghiệm** (3 nút):

- `beginner`: Mới bắt đầu
- `intermediate`: Trung cấp
- `advanced`: Nâng cao

**Nhóm 3 — Số ngày tập/tuần** (5 nút số):

- 2, 3, 4, 5, 6 ngày

### Section 6: Training Details (8 bước chi tiết)

Mỗi bước là một màn hình riêng với thanh tiến trình ở đầu:

| Bước | Nội dung                                                                   | Loại input       |
| ---- | -------------------------------------------------------------------------- | ---------------- |
| 1    | Thời lượng buổi tập (phút)                                                 | Slider/Number    |
| 2    | Thiết bị: barbell, dumbbell, machine, cable, bodyweight, bands, kettlebell | ChipSelect multi |
| 3    | Chấn thương: Vai, Lưng dưới, Đầu gối, Cổ tay, Cổ, Hông                     | ChipSelect multi |
| 4    | Cardio/tuần: 0-7 buổi                                                      | Number           |
| 5    | Chu kỳ hóa: Tuyến tính, Dao động, Theo khối                                | Radio            |
| 6    | Số tuần/chu kỳ: 4, 6, 8, 12                                                | Radio            |
| 7    | Nhóm cơ ưu tiên (max 3): ngực, lưng, vai, chân, tay, core, mông            | ChipSelect max 3 |
| 8    | Giờ ngủ trung bình: 3-12 giờ                                               | Slider           |

- Mỗi bước có "Tiếp tục" hoặc "Bỏ qua"
- Bước cuối: tóm tắt + xác nhận

### Section 7: Strategy & Computing

**Chọn chiến lược:**

- "Để app lên kế hoạch" (tự động) → chuyển sang màn hình computing
- "Tự lên kế hoạch" (thủ công) → bỏ qua computing, vào Plan Preview

**Màn hình Computing:**

```
┌─────────────────────────────────────┐
│                                     │
│           ┌────────────┐            │
│           │  ◯ 45%     │            │
│           │  Loading   │            │
│           └────────────┘            │
│                                     │
│  ✓ Phân tích mục tiêu tập luyện   │
│  ✓ Lựa chọn bài tập phù hợp      │
│  ◯ Tối ưu lịch tập & ngày nghỉ   │
│  ○ Hoàn thiện kế hoạch cá nhân    │
│                                     │
└─────────────────────────────────────┘
```

- 4 bước hiệu ứng tuần tự, tổng ~13 giây
- Hiệu ứng vòng tròn tiến trình

### Section 8: Plan Preview

**Bố cục:** Tóm tắt kế hoạch đã tạo

```
┌─────────────────────────────────────┐
│  Kế hoạch của bạn                   │
├─────────────────────────────────────┤
│                                     │
│  Split: PPL (Push/Pull/Legs)       │
│  Thời gian: 12 tuần                │
│  Ngày tập: 5 ngày/tuần            │
│  Tổng bài tập: 24                  │
│  Thời lượng: 60 phút/buổi         │
│                                     │
│  Tổng quan lịch tuần:              │
│  T2: Push | T3: Pull | T4: Legs   │
│  T5: Push | T6: Pull              │
│  T7: Nghỉ | CN: Nghỉ              │
│                                     │
│     [Bắt đầu tập luyện →]         │
│                                     │
└─────────────────────────────────────┘
```

- Nút "Bắt đầu tập luyện →" (testid: `onboarding-complete`) → vào Main App

---

## CHƯƠNG 6: TAB LỊCH (CALENDAR)

### Bố cục tổng thể

```
┌──────────────────────────────────────────────┐
│  ◀ ▶  Tháng 4, 2026                    ⚙️   │
├──────────────────────────────────────────────┤
│  T2    T3    T4    T5    T6    T7    CN     │
│  31     1     2    [3]    4     5     6      │
├──────────────────────────────────────────────┤
│  [ 🍽 Bữa ăn ]  [ 📊 Dinh dưỡng ]          │
├──────────────────────────────────────────────┤
│                                              │
│  Nội dung Sub-tab                            │
│  (Bữa ăn hoặc Dinh dưỡng)                   │
│                                              │
└──────────────────────────────────────────────┘
```

**Header:**

- Tiêu đề tháng/năm, mũi tên trái/phải chuyển tháng
- Hàng thứ trong tuần (T2–CN: Thứ Hai → Chủ Nhật)
- Hàng ngày: tap để chọn, ngày hôm nay nổi bật vòng tròn Emerald
- Icon ⚙️ góc trên phải → mở Settings full-screen

### Sub-tab: Bữa ăn (Meals)

```
┌──────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓░░░░  1327 / 2091 kcal         │
│ Protein: 170g / 157g                    │
├──────────────────────────────────────────┤
│                                          │
│ ☀️ BỮA SÁNG (487 kcal)             [+] │
│ ┌──────────────────────────────────┐    │
│ │ Trứng ốp la          155 kcal   │    │
│ │ P:13g  C:1g  F:11g              │    │
│ └──────────────────────────────────┘    │
│ ┌──────────────────────────────────┐    │
│ │ Yến mạch sữa chua    332 kcal   │    │
│ │ P:25g  C:38g  F:7g              │    │
│ └──────────────────────────────────┘    │
│                                          │
│ 🌤️ BỮA TRƯA (510 kcal)            [+] │
│ ┌──────────────────────────────────┐    │
│ │ Ức gà áp chảo        330 kcal   │    │
│ │ P:62g  C:0g  F:4g               │    │
│ └──────────────────────────────────┘    │
│ ┌──────────────────────────────────┐    │
│ │ Bông cải xanh luộc    51 kcal   │    │
│ │ P:5g  C:7g  F:0g                │    │
│ └──────────────────────────────────┘    │
│ ┌──────────────────────────────────┐    │
│ │ Khoai lang luộc      129 kcal   │    │
│ │ P:3g  C:20g  F:0g               │    │
│ └──────────────────────────────────┘    │
│                                          │
│ 🌙 BỮA TỐI (330 kcal)             [+] │
│ ┌──────────────────────────────────┐    │
│ │ Ức gà áp chảo        330 kcal   │    │
│ │ P:62g  C:0g  F:4g               │    │
│ └──────────────────────────────────┘    │
│                                          │
├──────────────────────────────────────────┤
│ [📋 Lên kế hoạch] [📄 Copy] [🤖 AI]    │
│              MealActionBar               │
└──────────────────────────────────────────┘
```

**Thành phần:**

- **MiniNutritionBar:** Thanh tiến trình ngang ở đầu — hiển thị calo đã ăn/mục tiêu + protein
- **3 MealSlot:** Sáng (☀️ Amber), Trưa (🌤️ Sky), Tối (🌙 Indigo)
- Mỗi slot: danh sách card món ăn với tóm tắt dinh dưỡng
- Nút **[+]** trên tiêu đề mỗi bữa → mở MealPlannerModal cho loại bữa đó
- **MealActionBar** ở dưới: "Lên kế hoạch", "Copy", AI gợi ý

### MealPlannerModal

```
┌──────────────────────────────────────────┐
│  ✕  Chọn món — Bữa Trưa                │
├──────────────────────────────────────────┤
│  🔍 Tìm kiếm món...                     │
│                                          │
│  ⚙ Lọc    ↕ Sắp xếp                    │
├──────────────────────────────────────────┤
│  📋 Gần đây                             │
│  ┌────────────────────────────────┐     │
│  │ Ức gà áp chảo  330cal  62g  [+]│    │
│  └────────────────────────────────┘     │
│  ┌────────────────────────────────┐     │
│  │ Khoai lang luộc 129cal  3g  [+]│    │
│  └────────────────────────────────┘     │
│                                          │
│  📚 Tất cả món                           │
│  ... danh sách cuộn ...                  │
│                                          │
├──────────────────────────────────────────┤
│              [Xác nhận]                  │
└──────────────────────────────────────────┘
```

### Sub-tab: Dinh dưỡng (Nutrition)

```
┌──────────────────────────────────────────┐
│                                          │
│  ┌────────────────────────────────┐     │
│  │     EnergyBalanceCard          │     │
│  │  Mục tiêu: 2091 kcal          │     │
│  │  Đã ăn:    1327 kcal          │     │
│  │  Còn lại:   764 kcal          │     │
│  │                                │     │
│  │  BMR: 1704 → TDEE: 2641       │     │
│  │  Offset: −550 kcal            │     │
│  └────────────────────────────────┘     │
│                                          │
│  ┌────────────────────────────────┐     │
│  │     MacroDonutChart (SVG)      │     │
│  │        ┌────────┐              │     │
│  │        │   🍩   │  P: 170g    │     │
│  │        │        │  F: 58g     │     │
│  │        └────────┘  C: 241g    │     │
│  └────────────────────────────────┘     │
│                                          │
│  Thanh tiến trình Macro:                │
│  Protein ▓▓▓▓▓▓▓▓░░  170 / 157g        │
│  Fat     ▓▓▓▓░░░░░░   37 / 58g         │
│  Carbs   ▓▓▓░░░░░░░   95 / 241g        │
│  Fiber   ▓▓░░░░░░░░   12 / 30g         │
│                                          │
│  Gợi ý & Nhận xét:                     │
│  💡 "Mục tiêu: 75kg · 2091 kcal ·      │
│      157g protein"                       │
│  💡 "Protein đã vượt mục tiêu,         │
│      tuyệt vời!"                         │
└──────────────────────────────────────────┘
```

### Sơ đồ luồng — Thêm bữa ăn

```
Calendar (Bữa ăn) ──tap [+]──→ MealPlannerModal
    │                               │
    │                          Chọn món (tap [+] cho mỗi món)
    │                               │
    │                          [Xác nhận]
    │                               │
    ◄────── Cập nhật bữa ăn ───────┘

Calendar (Bữa ăn) ──tap "Copy"──→ CopyPlanModal
    │                                │
    │                           Chọn ngày đích
    │                                │
    ◄────── Kế hoạch đã copy ────────┘
```

---

## CHƯƠNG 7: TAB THƯ VIỆN (LIBRARY)

### Bố cục tổng thể

```
┌──────────────────────────────────────────────┐
│  Thư viện                                    │
├──────────────────────────────────────────────┤
│  [ 🍽 Món ăn ]  [ 🥩 Nguyên liệu ]          │
├──────────────────────────────────────────────┤
│  🔍 Tìm kiếm...        [⚙ Lọc]  [↕ Sắp]   │
├──────────────────────────────────────────────┤
│                                              │
│  Danh sách card (cuộn dọc)                   │
│                                              │
├──────────────────────────────────────────────┤
│              [+ Tạo mới]                     │
└──────────────────────────────────────────────┘
```

### Sub-tab: Món ăn (Dishes)

**DishCard:**

```
┌──────────────────────────────────────────┐
│  🍳 Ức gà áp chảo                  ⭐⭐⭐ │
│  330 kcal | P:62g  F:4g  C:0g           │
│  2 nguyên liệu                          │
│  Tags: [Trưa] [Tối]                     │
│                                          │
│  [✏️ Sửa]  [🗑️ Xóa]  [⚖️ So sánh]    │
└──────────────────────────────────────────┘
```

- Tên món + đánh giá sao (1-5)
- Tóm tắt dinh dưỡng mỗi khẩu phần
- Tag loại bữa (badge màu: Sáng=Amber, Trưa=Sky, Tối=Indigo)
- Nút hành động: Sửa, Xóa, So sánh

**Sắp xếp:** Tên, Calo, Protein, Số nguyên liệu, Đánh giá

### DishEditModal (Tạo/Sửa món) — Multi-step

**Bước 1: Thông tin cơ bản**

```
┌──────────────────────────────────────────┐
│  ✕  Tạo món ăn mới                      │
├──────────────────────────────────────────┤
│  Tên món (Tiếng Việt):                   │
│  [_________________________________]     │
│                                          │
│  Tên món (English — tùy chọn):           │
│  [_________________________________]     │
│                                          │
│  Phù hợp cho bữa:                       │
│  [☀️ Sáng]  [🌤️ Trưa]  [🌙 Tối]       │
│                                          │
│  Mô tả (tùy chọn):                      │
│  [_________________________________]     │
│                                          │
│              [Tiếp theo →]               │
└──────────────────────────────────────────┘
```

**Bước 2: Nguyên liệu**

```
┌──────────────────────────────────────────┐
│  ✕  Nguyên liệu                         │
├──────────────────────────────────────────┤
│  🔍 Tìm nguyên liệu...                 │
│                                          │
│  ┌── Ức gà ──────────────────────┐      │
│  │  Khối lượng: [200] g      [🗑]│      │
│  │  Cal:330 | P:62  F:8  C:0    │      │
│  └───────────────────────────────┘      │
│                                          │
│  [+ Thêm nguyên liệu]                  │
│  [🤖 AI gợi ý nguyên liệu]             │
│                                          │
│  Tổng: 330 kcal | P:62g F:8g C:0g      │
│                                          │
│       [← Quay lại]    [Lưu]             │
└──────────────────────────────────────────┘
```

### Sub-tab: Nguyên liệu (Ingredients)

**IngredientCard:**

```
┌──────────────────────────────────────────┐
│  🥩 Ức gà                                │
│  165 kcal / 100g                         │
│  P:31g | F:4g | C:0g | Fiber:0g         │
│  Đơn vị: gram                            │
└──────────────────────────────────────────┘
```

**IngredientEditModal — Form đơn:**

- Tên (Tiếng Việt — bắt buộc, English — tùy chọn)
- Đơn vị tính (g, ml, unit, v.v.)
- Trên 100g: Calo, Protein, Carbs, Fat, Fiber, Đường, Natri
- Nút [🤖 AI tra cứu] để tự động điền dinh dưỡng
- Nút [Lưu]

### Chế độ So sánh

```
┌───────────────────┬───────────────────┐
│  Món A             │  Món B             │
│  Ức gà áp chảo    │  Trứng ốp la      │
│  330 kcal          │  155 kcal          │
│  P: 62g            │  P: 13g            │
│  F: 4g             │  F: 11g            │
│  C: 0g             │  C: 1g             │
│                    │                    │
│  Tốt hơn về:      │  Tốt hơn về:      │
│  ✅ Protein cao    │  ✅ Calo thấp      │
└───────────────────┴───────────────────┘
```

### Sơ đồ luồng

```
Library ──tap "Tạo mới"──→ DishEditModal
    │                           │
    │                      Bước 1: Thông tin
    │                           │
    │                      Bước 2: Nguyên liệu
    │                      (tìm + thêm + set khẩu phần)
    │                           │
    │                      [Lưu] → Lưu
    │                           │
    ◄──── Món mới trong list ───┘

Library ──tap card──→ Xem chi tiết
    │                     │
    │              tap "Sửa" → DishEditModal (đã điền sẵn)
    │              tap "Xóa" → ConfirmationModal
    │              tap "So sánh" → vào chế độ so sánh
    │                     │
    ◄─────────────────────┘
```

---

## CHƯƠNG 8: TAB PHÂN TÍCH AI (AI ANALYSIS)

### Bố cục tổng thể

```
┌──────────────────────────────────────────────┐
│  Phân tích AI                                │
├──────────────────────────────────────────────┤
│                                              │
│            ┌──────────────────┐              │
│            │                  │              │
│            │   📷 Camera      │              │
│            │    Preview       │              │
│            │                  │              │
│            └──────────────────┘              │
│                                              │
│       [📸 Chụp ảnh]  [🖼 Thư viện]          │
│                                              │
│  ──────── Hoặc ────────                      │
│                                              │
│  [🤖 Gợi ý thực đơn AI]                     │
│  [📊 Tra cứu dinh dưỡng]                    │
│                                              │
└──────────────────────────────────────────────┘
```

### Kết quả phân tích

```
┌──────────────────────────────────────────────┐
│  Kết quả phân tích                           │
├──────────────────────────────────────────────┤
│  📷 [Ảnh preview đã chụp]                   │
│                                              │
│  Món ăn: Phở bò                              │
│  Độ tin cậy: 95%                             │
│                                              │
│  Nguyên liệu phát hiện:                     │
│  ┌──────────────────────────────────┐       │
│  │ Phở (bánh phở) — 200g            │       │
│  │ 320 kcal | P:12g  F:3g  C:62g   │       │
│  ├──────────────────────────────────┤       │
│  │ Thịt bò — 100g                   │       │
│  │ 250 kcal | P:26g  F:15g  C:0g   │       │
│  ├──────────────────────────────────┤       │
│  │ Rau thơm — 20g                   │       │
│  │ 5 kcal | P:0g  F:0g  C:1g       │       │
│  └──────────────────────────────────┘       │
│                                              │
│  TỔNG: 575 kcal | P:38g  F:18g  C:63g      │
│                                              │
│  [💾 Lưu nguyên liệu]  [🍽 Tạo món]        │
└──────────────────────────────────────────────┘
```

### AI Gợi ý thực đơn (AISuggestionPreviewModal)

```
┌──────────────────────────────────────────┐
│  ✕  Gợi ý thực đơn AI                   │
├──────────────────────────────────────────┤
│  Dựa trên mục tiêu: 2091 kcal/ngày     │
│                                          │
│  ☀️ Bữa Sáng (~523 kcal):              │
│  • Yến mạch sữa chua                    │
│  • Trứng ốp la                           │
│                                          │
│  🌤️ Bữa Trưa (~836 kcal):             │
│  • Ức gà áp chảo                         │
│  • Khoai lang luộc                       │
│  • Bông cải xanh luộc                    │
│                                          │
│  🌙 Bữa Tối (~732 kcal):               │
│  • Cá hồi nướng                          │
│  • Gạo lứt                               │
│  • Rau xào                               │
│                                          │
│       [✅ Áp dụng]   [❌ Hủy]            │
└──────────────────────────────────────────┘
```

### Sơ đồ luồng

```
AI Tab ──"Chụp ảnh"──→ Camera capture
    │                       │
    │                  Phân tích ảnh
    │                  (loading: 3-5 giây)
    │                       │
    │                  Hiển thị kết quả
    │                       │
    │              ┌────────┴────────┐
    │        "Lưu NL"           "Tạo món"
    │              │                 │
    │         Lưu nguyên liệu   Tạo món ăn
    │         vào Library        + Nguyên liệu
    │              │                 │
    │         Chuyển sang        Chuyển sang
    │         Library/NL tab     Library/Dishes tab
    │              │                 │
    ◄──────────────┴─────────────────┘

AI Tab ──"Gợi ý thực đơn"──→ AISuggestionPreviewModal
    │                              │
    │                         Xem gợi ý
    │                              │
    │                     "Áp dụng" → Thêm vào Calendar
    │                              │
    ◄──── Chuyển sang Calendar tab ┘
```

> ⚠️ **LƯU Ý:** Tính năng AI CẦN kết nối internet. Hiển thị thông báo phù hợp khi không có mạng.

---

## CHƯƠNG 9: TAB TẬP LUYỆN (FITNESS)

### Bố cục tổng thể

```
┌──────────────────────────────────────────────┐
│  Tập luyện                                   │
├──────────────────────────────────────────────┤
│  [ 📋 Kế hoạch ]  [ 📊 Tiến trình ]  [ 🕐 Lịch sử ] │
├──────────────────────────────────────────────┤
│                                              │
│  Nội dung Sub-tab                            │
│                                              │
└──────────────────────────────────────────────┘
```

### Sub-tab: Kế hoạch (Plan)

```
┌──────────────────────────────────────────┐
│  Kế hoạch: PPL 6 ngày                   │
│  Tuần 3/12 | Trạng thái: Đang hoạt động │
├──────────────────────────────────────────┤
│                                          │
│  T2: Push (Ngực + Vai + Tay sau)        │
│  ┌──────────────────────────────┐       │
│  │ Bench Press        4×8-12   │       │
│  │ OHP                3×8-12   │       │
│  │ Lateral Raise      3×12-15  │       │
│  │ Tricep Pushdown    3×10-12  │       │
│  └──────────────────────────────┘       │
│                                          │
│  T3: Pull (Lưng + Tay trước)           │
│  ┌──────────────────────────────┐       │
│  │ Deadlift           3×5-8    │       │
│  │ Barbell Row        4×8-12   │       │
│  │ ...                          │       │
│  └──────────────────────────────┘       │
│                                          │
│  T4: Legs (Chân + Mông)                │
│  ...                                     │
│                                          │
│  T7: 😴 Nghỉ ngơi                       │
│  CN: 😴 Nghỉ ngơi                       │
│                                          │
├──────────────────────────────────────────┤
│ [✏️ Chỉnh sửa] [📋 Template]           │
│ [🔄 Đổi split] [▶️ Bắt đầu buổi tập]  │
└──────────────────────────────────────────┘
```

**Loại split:**

| Split                | Mô tả                  | Ngày/tuần |
| -------------------- | ---------------------- | --------- |
| Full Body            | Tập toàn thân mỗi buổi | 2-3 ngày  |
| Upper/Lower          | Xen kẽ trên/dưới       | 4 ngày    |
| PPL (Push/Pull/Legs) | Chia 3 nhóm            | 5-6 ngày  |
| Custom               | Tự do                  | Tùy chọn  |

Tap một ngày → mở **PlanDayEditor** (full-screen)

### PlanDayEditor (Full-Screen)

```
┌──────────────────────────────────────────┐
│  ← Quay lại    T2: Push            [💾] │
├──────────────────────────────────────────┤
│                                          │
│  Bench Press                         [⋮]│
│  4 sets × 8-12 reps                     │
│  └─ [+ Thêm set]                       │
│                                          │
│  Overhead Press                      [⋮]│
│  3 sets × 8-12 reps                     │
│  └─ [+ Thêm set]                       │
│                                          │
│  Lateral Raise                       [⋮]│
│  3 sets × 12-15 reps                    │
│  └─ [+ Thêm set]                       │
│                                          │
│  [+ Thêm bài tập]                      │
│                                          │
└──────────────────────────────────────────┘
```

- Menu [⋮]: Sắp xếp lại, Đổi bài tập, Xóa
- "Thêm bài tập" → **ExerciseSelectorSheet** (bottom sheet với tìm kiếm + danh mục)
- Nút ← khi có thay đổi chưa lưu → **UnsavedChangesDialog**:
  - "Lưu & quay lại"
  - "Bỏ thay đổi"
  - "Ở lại chỉnh sửa"

### WorkoutLogger (Full-Screen)

```
┌──────────────────────────────────────────┐
│  ← Quay lại    Ghi buổi tập        [✓] │
├──────────────────────────────────────────┤
│  ⏱ 00:45:30         🔥 ~320 kcal       │
├──────────────────────────────────────────┤
│                                          │
│  Bench Press                             │
│  ┌────────────────────────────────┐     │
│  │ Set 1: [80] kg × [10] reps    │     │
│  │ RPE: [7]    Nghỉ: 90s         │     │
│  ├────────────────────────────────┤     │
│  │ Set 2: [80] kg × [8] reps     │     │
│  │ RPE: [8]    Nghỉ: 90s         │     │
│  ├────────────────────────────────┤     │
│  │ Set 3: [82.5] kg × [7] reps   │     │
│  │ RPE: [9]                       │     │
│  └────────────────────────────────┘     │
│  [+ Thêm set]                           │
│                                          │
│  Overhead Press                          │
│  ...                                     │
│                                          │
│       [💾 Hoàn thành workout]            │
└──────────────────────────────────────────┘
```

**Các field mỗi set:** Weight (kg), Reps, RPE (1-10), Rest timer (giây)

### CardioLogger (Full-Screen)

```
┌──────────────────────────────────────────┐
│  ← Quay lại    Ghi Cardio          [✓] │
├──────────────────────────────────────────┤
│                                          │
│  Loại: [🏃 Chạy bộ ▼]                  │
│                                          │
│  Thời gian:      [30] phút              │
│  Khoảng cách:    [5.0] km               │
│  Nhịp tim TB:    [145] bpm              │
│  Cường độ:       [Vừa phải ▼]          │
│                                          │
│  Ước tính calo:  320 kcal               │
│                                          │
│             [💾 Lưu]                     │
└──────────────────────────────────────────┘
```

### Sub-tab: Tiến trình (Progress)

```
┌──────────────────────────────────────────┐
│                                          │
│  📊 Cân nặng                             │
│  ┌──────────────────────────────┐       │
│  │  Biểu đồ: Weight theo thời gian │   │
│  │  75kg ─────────── 74.5kg     │       │
│  └──────────────────────────────┘       │
│                                          │
│  🏆 Kỷ lục cá nhân (PR)                │
│  Bench Press: 85kg (01/04/2026)         │
│  Squat: 120kg (28/03/2026)              │
│                                          │
│  📈 Volume tuần này                     │
│  12,500 kg (↑ 5% so với tuần trước)    │
│                                          │
│  🔥 Streak: 15 ngày liên tiếp          │
│                                          │
└──────────────────────────────────────────┘
```

### Sub-tab: Lịch sử (History)

Danh sách buổi tập đã hoàn thành:

- Ngày, loại, thời lượng
- Số set, tổng volume
- PR được highlight

### Sơ đồ luồng

```
Fitness (Kế hoạch) ──tap ngày──→ PlanDayEditor
    │                                │
    │                           Sửa bài tập
    │                           Thêm/xóa/sắp xếp
    │                                │
    │                           [Lưu] hoặc ← Quay lại
    │                                │
    ◄──── Kế hoạch cập nhật ─────────┘

Fitness ──"Bắt đầu buổi tập"──→ WorkoutLogger
    │                                │
    │                           Ghi set cho mỗi bài tập
    │                           (weight × reps × RPE)
    │                                │
    │                           [Hoàn thành]
    │                                │
    ◄──── Buổi tập đã lưu ──────────┘

Dashboard ──"Cardio"──→ CardioLogger
    │                        │
    │                   Chọn loại + metrics
    │                        │
    │                   [Lưu]
    │                        │
    ◄──── Cardio đã ghi ────┘
```

---

## CHƯƠNG 10: TAB TỔNG QUAN (DASHBOARD)

### Bố cục tổng thể

```
┌──────────────────────────────────────────────┐
│  Tổng quan                  Hôm nay    [⚙]  │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────┐     │
│  │        CombinedHero Card           │     │
│  │    (gradient: emerald → teal)      │     │
│  │                                    │     │
│  │  Chào Khanh!                       │     │
│  │  Điểm hôm nay: 72/100 (Tốt)     │     │
│  │                                    │     │
│  │  🍽 Dinh dưỡng     💪 Tập luyện  │     │
│  │  ┌──────────┐     ┌──────────┐   │     │
│  │  │  🔵      │     │Đã tập:  │   │     │
│  │  │ 1327/    │     │ 45 phút │   │     │
│  │  │ 2091 cal │     │ 320 cal │   │     │
│  │  └──────────┘     └──────────┘   │     │
│  │                                    │     │
│  │  P: ▓▓▓▓▓▓▓▓░░ 170/157g         │     │
│  │  F: ▓▓▓▓░░░░░░  37/58g          │     │
│  │  C: ▓▓░░░░░░░░  95/241g         │     │
│  └────────────────────────────────────┘     │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │        TodaysPlanCard              │     │
│  │  Kế hoạch hôm nay:                │     │
│  │                                    │     │
│  │  💪 T2: Push (4 bài · 60 phút)   │     │
│  │     [Bắt đầu tập]                 │     │
│  │                                    │     │
│  │  🍽 Bữa ăn: 2/3 đã ghi          │     │
│  │  [Ghi Sáng] [Ghi Trưa] [Ghi Tối]│     │
│  │                                    │     │
│  │  ⚖ Cân nặng: [Ghi cân nặng]     │     │
│  └────────────────────────────────────┘     │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │        QuickActionsBar             │     │
│  │  [⚖ Ghi cân] [📋 Kế hoạch]       │     │
│  │  [🏋 Tập]    [📸 Ảnh AI]         │     │
│  │  [⚙ Cài đặt]                      │     │
│  └────────────────────────────────────┘     │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │        AiInsightCard               │     │
│  │  💡 "Bạn đã ăn đủ protein..."     │     │
│  │  💡 "Còn 764 kcal để đạt mục tiêu"│     │
│  │  💡 "Hôm nay tập Push, sẵn sàng?"│     │
│  └────────────────────────────────────┘     │
│                                              │
└──────────────────────────────────────────────┘
```

### CombinedHero Card

- **Nền gradient:** Emerald → Teal
- **Hai phần:** Dinh dưỡng (trái) + Tập luyện (phải)
- **Dinh dưỡng:** Vòng tròn calo (eaten/target), thanh mini macro
- **Tập luyện:** Tóm tắt buổi tập hôm nay, calo đốt
- **Lời chào ngữ cảnh:**
  - Ngày nghỉ: "Ngày nghỉ phục hồi — bạn đã ăn uống đầy đủ, tuyệt vời!"
  - Ngày tập (chưa tập): "Hôm nay là ngày tập — sẵn sàng vào phòng gym chưa?"
  - Đã tập xong: "Buổi tập tuyệt vời! Nhớ bổ sung dinh dưỡng nhé!"
- **Tap → mở EnergyDetailSheet** (bottom sheet chi tiết năng lượng)

### EnergyDetailSheet

```
┌──────────────────────────────────────────┐
│  ──────── (thanh kéo) ────────           │
│                                          │
│  Chi tiết năng lượng                     │
│                                          │
│  BMR:    1704 kcal                       │
│  (Năng lượng cơ thể cần khi nghỉ ngơi) │
│                                          │
│  TDEE:   2641 kcal                       │
│  (Tổng năng lượng tiêu hao mỗi ngày)   │
│                                          │
│  Target: 2091 kcal                       │
│  (Mục tiêu = TDEE − 550)               │
│                                          │
│  Phân chia theo bữa:                    │
│  ☀️ Sáng:  ~523 kcal (25%)             │
│  🌤️ Trưa:  ~836 kcal (40%)            │
│  🌙 Tối:   ~732 kcal (35%)             │
│                                          │
└──────────────────────────────────────────┘
```

### Quick Actions

| Hành động     | Icon Lucide     | Điều hướng đến                |
| ------------- | --------------- | ----------------------------- |
| Ghi cân nặng  | `Scale`         | WeightQuickLog (bottom sheet) |
| Lên kế hoạch  | `ClipboardList` | Calendar tab (sub-tab Bữa ăn) |
| Bắt đầu tập   | `Dumbbell`      | WorkoutLogger (full-screen)   |
| Phân tích ảnh | `Camera`        | AI Analysis tab               |
| Xem cài đặt   | `Settings`      | Settings (full-screen)        |

### Sơ đồ luồng

```
Dashboard ──tap CombinedHero──→ EnergyDetailSheet
    │
    ├──tap "Ghi Sáng/Trưa/Tối"──→ Calendar tab (Bữa ăn)
    │
    ├──tap "Bắt đầu tập"────────→ WorkoutLogger (full-screen)
    │
    ├──tap "Ghi cân nặng"───────→ WeightQuickLog (bottom sheet)
    │
    ├──tap "Phân tích ảnh"───────→ AI Analysis tab
    │
    └──tap "Lên kế hoạch"───────→ Calendar tab (Bữa ăn)
```

---

## CHƯƠNG 11: CÀI ĐẶT & CÁC OVERLAY (SETTINGS)

Settings mở dạng full-screen page qua page stack (icon ⚙️ ở header bất kỳ tab nào).

### Menu Settings chính

```
┌──────────────────────────────────────────┐
│  ← Đóng          Cài đặt                │
├──────────────────────────────────────────┤
│                                          │
│  🔍 Tìm kiếm cài đặt...               │
│                                          │
│  👤 Hồ sơ sức khỏe                 [→] │
│     BMR: 1704 · TDEE: 2641             │
│                                          │
│  🎯 Mục tiêu cân nặng              [→] │
│     Giảm cân · Vừa phải                │
│                                          │
│  🏋 Hồ sơ tập luyện                [→] │
│     5 ngày/tuần · 60 phút              │
│                                          │
│  ─────────────────────────              │
│                                          │
│  🎨 Giao diện                           │
│  (●) Sáng  (○) Tối                     │
│  (○) Theo hệ thống  (○) Tự động        │
│                                          │
│  ─────────────────────────              │
│                                          │
│  ☁️ Sao lưu dữ liệu                    │
│  [Xuất file backup] [Nhập file backup]  │
│                                          │
│  ☁️ Google Drive                        │
│  [Đồng bộ ngay] [Đăng xuất]            │
│                                          │
│  ─────────────────────────              │
│                                          │
│  ℹ️ Về ứng dụng                         │
│  Phiên bản: 1.0.0                       │
│                                          │
└──────────────────────────────────────────┘
```

### Hồ sơ sức khỏe — Chế độ đọc (Read View)

```
┌──────────────────────────────────────────┐
│  ← Quay lại      Hồ sơ sức khỏe        │
├──────────────────────────────────────────┤
│                                          │
│  Tên:            Khanh                   │
│  Giới tính:      Nam                     │
│  Ngày sinh:      15/05/1996             │
│  Chiều cao:      175 cm                  │
│  Cân nặng:       75 kg                   │
│  Tỉ lệ mỡ:      — (chưa nhập)          │
│  Mức vận động:   Hoạt động vừa phải     │
│                                          │
│  BMR: 1704 kcal                          │
│  TDEE: 2641 kcal                         │
│                                          │
│           [✏️ Chỉnh sửa]                │
│                                          │
└──────────────────────────────────────────┘
```

### Hồ sơ sức khỏe — Chế độ sửa (Edit View)

```
┌──────────────────────────────────────────┐
│  ← Hủy       Chỉnh sửa          [Lưu] │
├──────────────────────────────────────────┤
│                                          │
│  Tên:          [Khanh________]          │
│  Giới tính:    (●) Nam   (○) Nữ        │
│  Ngày sinh:    [1996-05-15]             │
│  Chiều cao:    [175] cm                 │
│  Cân nặng:     [75] kg                  │
│  Tỉ lệ mỡ:    [___] %  (tùy chọn)     │
│                                          │
│  BMR:                                    │
│  (●) Tự động tính  (○) Nhập thủ công   │
│  [________] (hiện khi chọn thủ công)    │
│                                          │
│  Protein ratio:  [2.0] g/kg             │
│                                          │
│  Mức vận động:   [Hoạt động vừa... ▼]  │
│                                          │
│  ─── Preview ───                        │
│  BMR: 1704 | TDEE: 2641                 │
│  P: 150g | F: 73g | C: 344g            │
│                                          │
└──────────────────────────────────────────┘
```

> **Lưu ý quan trọng cho designer:** Form preview hiển thị macro từ **TDEE** (chưa có goal offset). Các nơi khác trong app hiển thị macro từ **Target = TDEE + offset**. Với mục tiêu "Duy trì" (offset=0) thì hai giá trị giống nhau; với "Giảm/Tăng" thì KHÁC nhau.

### Mục tiêu cân nặng (GoalDetailPage)

```
┌──────────────────────────────────────────┐
│  ← Quay lại      Mục tiêu               │
├──────────────────────────────────────────┤
│                                          │
│  Chọn mục tiêu:                         │
│  [Giảm cân]  [Duy trì]  [Tăng cơ]     │
│                                          │
│  Tốc độ (khi chọn Giảm/Tăng):          │
│  [Nhẹ nhàng]  [Vừa phải]  [Mạnh mẽ]   │
│                                          │
│  Offset: −550 kcal/ngày                 │
│  Target: 2091 kcal/ngày                 │
│                                          │
│              [Lưu]                       │
│                                          │
└──────────────────────────────────────────┘
```

### Giao diện (Theme Settings)

4 chế độ radio:

| Giá trị    | Label         | Mô tả                     |
| ---------- | ------------- | ------------------------- |
| `light`    | Sáng          | Luôn chế độ sáng          |
| `dark`     | Tối           | Luôn chế độ tối           |
| `system`   | Theo hệ thống | Theo cài đặt Android      |
| `schedule` | Tự động       | Sáng/tối tự động theo giờ |

### Sao lưu & Đồng bộ

```
┌──────────────────────────────────────────┐
│  Sao lưu dữ liệu                        │
├──────────────────────────────────────────┤
│                                          │
│  📁 Sao lưu local                       │
│  [Xuất file backup]                      │
│  [Nhập file backup]                      │
│                                          │
│  ☁️ Google Drive                         │
│  Trạng thái: Đã đăng nhập              │
│  Lần đồng bộ cuối: 04/04/2026 14:30    │
│  [Đồng bộ ngay]                         │
│  [Đăng xuất]                             │
│                                          │
└──────────────────────────────────────────┘
```

### SyncConflictModal (xung đột Local vs Cloud)

```
┌──────────────────────────────────────────┐
│  ⚠️ Xung đột dữ liệu                   │
├──────────────────────────────────────────┤
│                                          │
│  Local             │  Cloud              │
│  75 kg             │  74 kg              │
│  5 món ăn          │  7 món ăn           │
│  Cập nhật:         │  Cập nhật:          │
│  14:30 hôm nay     │  10:00 hôm nay      │
│                                          │
│       [Giữ Local]    [Giữ Cloud]         │
│                                          │
└──────────────────────────────────────────┘
```

### Chuỗi lan truyền dữ liệu (QUAN TRỌNG cho designer)

Khi người dùng thay đổi hồ sơ sức khỏe, TẤT CẢ giá trị liên quan đều cập nhật đồng thời:

```
Thay đổi Weight/Height/Age/Activity
    │
    ▼
BMR tính lại (công thức Mifflin-St Jeor)
    │
    ▼
TDEE tính lại (BMR × hệ số vận động)
    │
    ▼
Target tính lại (TDEE + goal offset)
    │
    ▼
Macros tính lại (Protein/Fat/Carbs)
    │
    ├──→ Dashboard CombinedHero cập nhật
    ├──→ Dashboard EnergyDetailSheet cập nhật
    ├──→ Calendar sub-tab Dinh dưỡng cập nhật
    ├──→ Calendar MiniNutritionBar cập nhật
    └──→ Fitness bridge cập nhật
```

> **Thiết kế phải đảm bảo:** Mọi nơi hiển thị số calo/macro PHẢI nhất quán. Nếu user đổi cân nặng từ 75→80kg, tất cả các màn hình trên đều phải phản ánh giá trị mới ngay lập tức.

---

## CHƯƠNG 12: BUILD APK & EMULATOR SETUP

### Yêu cầu hệ thống

| Phần mềm       | Phiên bản           |
| -------------- | ------------------- |
| Node.js        | v18+                |
| Android Studio | Phiên bản mới nhất  |
| Android SDK    | API 34 (Android 14) |
| JDK            | 17+                 |
| npm            | Đi kèm Node.js      |

### Bước 1: Cài đặt dependencies

```bash
npm install
```

### Bước 2: Build web assets

```bash
npm run build
```

Tạo thư mục `dist/` chứa web assets tối ưu cho production.

### Bước 3: Đồng bộ sang Android

```bash
npx cap sync android
```

Copy `dist/` vào `android/app/src/main/assets/public/`.

### Bước 4: Build APK

```bash
cd android
./gradlew assembleDebug    # APK debug (để test)
./gradlew assembleRelease  # APK release (để phát hành)
```

**Output:** `android/app/build/outputs/apk/debug/app-debug.apk`

### Bước 5: Thiết lập Android Emulator

1. Mở **Android Studio → Tools → Device Manager**
2. Tạo Virtual Device:
   - Điện thoại: **Pixel 7** (hoặc tương tự)
   - System Image: **API 34** (Android 14)
   - Màn hình: **1080 × 2400 pixels, 420 dpi**
3. Khởi động emulator
4. Kiểm tra: `adb devices` → hiển thị `emulator-5554` hoặc `emulator-5556`

### Bước 6: Cài APK lên Emulator

```bash
adb -s emulator-5556 install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Bước 7: Khởi chạy App

```bash
adb -s emulator-5556 shell am start -n com.mealplaner.app/.MainActivity
```

> **Lưu ý package name:** `com.mealplaner.app` (KHÔNG phải `mealplaning`)

### Bước 8: Debug với Chrome DevTools

1. Mở Chrome → nhập `chrome://inspect`
2. Tìm thiết bị → Click "inspect" trên WebView
3. Sử dụng đầy đủ DevTools để debug

### Lệnh rebuild nhanh sau khi sửa code

```bash
npm run build && npx cap sync android && \
cd android && ./gradlew assembleDebug && cd .. && \
adb -s emulator-5556 install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Xử lý sự cố thường gặp

| Vấn đề             | Giải pháp                                                   |
| ------------------ | ----------------------------------------------------------- |
| Emulator chậm      | Bật hardware acceleration (HAXM hoặc KVM)                   |
| APK không cài được | Chạy `adb kill-server && adb start-server`                  |
| Màn hình trắng     | Kiểm tra `npx cap sync android` đã chạy sau `npm run build` |
| Sai package name   | Luôn dùng `com.mealplaner.app`                              |

---

## PHỤ LỤC A: BẢNG TÓM TẮT MÀU SẮC NHANH

> Copy bảng này vào Figma làm tham chiếu nhanh khi thiết kế.

### Light Mode — Màu chính

| Tên         | OKLCH                | Hex xấp xỉ | Dùng cho     |
| ----------- | -------------------- | ---------- | ------------ |
| Primary     | `0.627 0.194 163.95` | #059669    | CTA, active  |
| Secondary   | `0.696 0.17 162.48`  | #10B981    | Hover, ring  |
| Destructive | `0.637 0.237 25.33`  | #EF4444    | Xóa, lỗi     |
| Accent Warm | `0.606 0.222 22`     | #EA580C    | CTA đặc biệt |
| Violet      | `0.606 0.25 292.72`  | #8B5CF6    | Premium      |
| Background  | `0.985 0.015 163`    | #F0FDF4    | Nền app      |
| Card        | `1 0 0`              | #FFFFFF    | Nền card     |
| Foreground  | `0.208 0.026 264.69` | #0F172A    | Chữ chính    |
| Muted FG    | `0.446 0.043 257.28` | #475569    | Chữ phụ      |

### Macro & Meal Colors

| Tên      | Hex xấp xỉ        | Dùng cho           |
| -------- | ----------------- | ------------------ |
| Protein  | #0284C7 Sky-600   | Badge, chart, text |
| Fat      | #B45309 Amber-700 | Badge, chart, text |
| Carbs    | #2563EB Blue-600  | Badge, chart, text |
| Fiber    | #15803D Green-700 | Badge, chart, text |
| Bữa Sáng | Amber-400         | Tag, icon tint     |
| Bữa Trưa | Sky-500           | Tag, icon tint     |
| Bữa Tối  | Indigo-500        | Tag, icon tint     |

---

## PHỤ LỤC B: CHECKLIST CHO DESIGNER

Trước khi bàn giao mockup Figma, đảm bảo:

- [ ] **Tất cả text** bằng tiếng Việt (trừ thuật ngữ kỹ thuật: BMR, TDEE, RPE)
- [ ] **Viewport** thiết kế ở 412px width (hoặc 360px cho edge case)
- [ ] **Safe area** có padding top 24dp và bottom 48dp
- [ ] **Bottom nav** hiển thị ở tất cả tab view, ẩn ở full-screen page
- [ ] **Màu sắc** sử dụng đúng semantic token (không hard-code)
- [ ] **Font size** theo hệ thống 5 bậc (stat-big → caption)
- [ ] **Spacing** theo lưới 8dp
- [ ] **Bo góc** card=10px, button=5px, modal=14px, badge=full
- [ ] **Dark mode** có mockup riêng cho tất cả màn hình chính
- [ ] **Trạng thái** đầy đủ: default, hover, focus, disabled, loading, error, empty
- [ ] **Propagation** — khi thay đổi 1 giá trị (ví dụ: cân nặng), tất cả màn hình liên quan đều cập nhật
- [ ] **Offline state** cho tính năng AI (hiển thị thông báo không có mạng)
- [ ] **Animation stagger** cho danh sách item (30ms delay mỗi item)
- [ ] **Modal** chỉ 1 cái mở tại 1 thời điểm
- [ ] **UnsavedChangesDialog** xuất hiện khi quay lại từ form có thay đổi chưa lưu
- [ ] **Toast** hiển thị ở vị trí z-80 (trên tất cả modal)

---

> **Tài liệu này là nguồn tham chiếu duy nhất (Single Source of Truth) cho thiết kế UI/UX của Smart Meal Planner. Mọi quyết định thiết kế phải dựa trên tài liệu này. Nếu có thắc mắc chưa được giải đáp, liên hệ team phát triển.**
