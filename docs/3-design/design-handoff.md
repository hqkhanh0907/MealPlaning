---
title: Hướng dẫn Bàn giao cho Designer
status: Active
version: 1.0
owner: CEO
updated: 2026-04-12
related:
  - docs/1-vision/product-vision.md
  - docs/3-design/brand-identity.md
  - docs/3-design/color-palette.md
  - docs/3-design/ui-rules.md
  - docs/2-requirements/prd.md
---

# Hướng dẫn Bàn giao cho Designer

> Document này dành cho **Designer bên ngoài (freelance)**. Đọc theo đúng thứ tự bên dưới để hiểu sản phẩm, hệ thống thiết kế, và output cần giao.

---

## 1. Tổng quan Dự án

**Smart Meal Planner** là ứng dụng HealthTech cho thị trường Việt Nam, giúp người dùng lập kế hoạch bữa ăn, theo dõi dinh dưỡng, và quản lý tập luyện — tất cả offline, miễn phí.

- **Nền tảng**: Mobile (Android via Capacitor) + Web App
- **Ngôn ngữ giao diện**: Tiếng Việt
- **Chuẩn thiết kế**: Apple HIG / Material Design 3
- **Đối tượng**: 4 persona chính (xem chi tiết trong Product Vision)

---

## 2. Thứ tự Đọc Tài liệu (BẮT BUỘC)

Đọc đúng thứ tự sau — mỗi tài liệu xây dựng trên tài liệu trước:

| Bước | Tài liệu                                        | Mục đích                                                                                | Thời gian |
| ---- | ----------------------------------------------- | --------------------------------------------------------------------------------------- | --------- |
| 1    | [Product Vision](../1-vision/product-vision.md) | Hiểu **TẠI SAO** sản phẩm tồn tại, 4 persona, 9 features Must-Have                      | 15 phút   |
| 2    | [Brand Identity](brand-identity.md)             | Hiểu **TÍNH CÁCH** thương hiệu: Clean · Smart · Motivating, tông giọng, hướng thẩm mỹ   | 20 phút   |
| 3    | [Color Palette](color-palette.md)               | Hiểu **HỆ THỐNG MÀU**: 88 primitive tokens, 80 semantic tokens, OKLCH, dark mode        | 30 phút   |
| 4    | [UI Rules](ui-rules.md)                         | Hiểu **QUY TẮC UI**: typography, spacing, border-radius, shadows, motion, accessibility | 20 phút   |
| 5    | [PRD — Feature Specs](../2-requirements/prd.md) | Hiểu **TÍNH NĂNG** chi tiết: F-01 → F-35 với acceptance criteria                        | 30 phút   |
| 6    | [Use Cases](../2-requirements/use-cases.md)     | Hiểu **LUỒNG TƯƠNG TÁC** người dùng ↔ hệ thống                                          | 20 phút   |

**Tổng thời gian đọc**: ~2.5 giờ

---

## 3. Tóm tắt Hệ thống Thiết kế

### 3.1 Brand Personality

| Thuộc tính       | Giá trị                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| Tính cách 3 từ   | **Clean · Smart · Motivating**                                          |
| Tông giọng       | Thân thiện, khuyến khích, không phán xét                                |
| Cảm xúc mục tiêu | Bình tĩnh, có tổ chức, tự tin về dinh dưỡng                             |
| Hướng thẩm mỹ    | Tối giản, data-dense nhưng không rối, giống Apple Health + MyFitnessPal |

### 3.2 Bảng Màu (Tóm tắt)

- **88 primitive tokens** (OKLCH): Gray, Blue, Emerald, Amber, Rose, Orange, Violet, Sky, Teal
- **80 semantic tokens**: Background, Surface, Border, Text, Status, Energy, Macro (Protein/Fat/Carbs)
- **Dark mode**: Có hỗ trợ đầy đủ
- **Contrast**: WCAG AA bắt buộc (≥4.5:1 text, ≥3:1 UI)
- Chi tiết đầy đủ: [color-palette.md](color-palette.md)

### 3.3 Typography

- **Font chính**: System font stack (SF Pro / Roboto)
- **Scale**: 12px → 30px (7 bậc)
- **Line height**: 1.4–1.6
- Chi tiết: [ui-rules.md](ui-rules.md) §3

### 3.4 Spacing & Layout

- **Base unit**: 4px
- **Grid**: 8px increment
- **Border radius**: Consistent per component type
- **Mobile-first**: 375px minimum, 428px target
- Chi tiết: [ui-rules.md](ui-rules.md) §4–5

---

## 4. Output Cần Giao

### 4.1 Figma Deliverables

| #    | Deliverable                         | Mô tả                                                                        | Ưu tiên    |
| ---- | ----------------------------------- | ---------------------------------------------------------------------------- | ---------- |
| D-01 | **Design Tokens (Figma Variables)** | Import 88 primitive + 80 semantic tokens vào Figma Variables                 | Cao        |
| D-02 | **Component Library**               | Buttons, Inputs, Cards, Modals, Bottom Sheets, Navigation, Charts            | Cao        |
| D-03 | **5 Core Screens**                  | Calendar, Library, AI Analysis, Fitness, Dashboard                           | Cao        |
| D-04 | **Onboarding Flow**                 | 7 bước (Welcome → Health → Activity → Goal → Training → Strategy → Complete) | Cao        |
| D-05 | **Settings & Profile**              | Health profile, Goal settings, Data export/import                            | Trung bình |
| D-06 | **Empty States**                    | Cho mỗi tab khi chưa có data                                                 | Trung bình |
| D-07 | **Error States**                    | Validation errors, Network errors, Permission errors                         | Trung bình |
| D-08 | **Dark Mode Variants**              | Tất cả screens trên với dark mode                                            | Thấp       |
| D-09 | **Responsive Web Variants**         | Tablet (768px) + Desktop (1280px) nếu áp dụng                                | Thấp       |

### 4.2 Design Standards Bắt buộc

- [ ] **Apple HIG** compliance cho iOS-style interactions
- [ ] **Material Design 3** compliance cho Android components
- [ ] **WCAG AA** contrast cho tất cả text + UI elements
- [ ] **Touch target** tối thiểu 44×44pt (Apple) / 48×48dp (Material)
- [ ] **Consistent spacing** theo 8px grid từ [ui-rules.md](ui-rules.md)
- [ ] **Vietnamese text** cho tất cả labels, placeholders, error messages

### 4.3 Naming Convention cho Figma

```
Frame naming:   Screen/[Tab]/[State]
                Ví dụ: Screen/Calendar/Meals-Empty
                       Screen/Onboarding/Step-3-Activity

Component:      Component/[Category]/[Name]/[Variant]
                Ví dụ: Component/Button/Primary/Default
                       Component/Card/Dish/With-Nutrition

Token:          [Type]/[Category]/[Name]
                Ví dụ: Color/Semantic/Background-Primary
                       Spacing/Base/16
```

---

## 5. Persona Chính (Tóm tắt)

> Chi tiết đầy đủ: [product-vision.md](../1-vision/product-vision.md) §3

| #   | Persona                  | Đặc điểm                          | Nhu cầu chính                                   |
| --- | ------------------------ | --------------------------------- | ----------------------------------------------- |
| P1  | **Gym Enthusiast**       | 20-30 tuổi, tập gym 4-5 buổi/tuần | Tracking macros chính xác, meal prep hàng tuần  |
| P2  | **Busy Professional**    | 25-35 tuổi, ít thời gian nấu ăn   | Meal planning nhanh, gợi ý thông minh           |
| P3  | **Health-Conscious Mom** | 30-45 tuổi, nấu cho gia đình      | Cân bằng dinh dưỡng gia đình, danh sách mua sắm |
| P4  | **Beginner Dieter**      | 16-25 tuổi, mới bắt đầu           | Hướng dẫn đơn giản, không overwhelm             |

---

## 6. Features Chính (MoSCoW Must-Have)

> Chi tiết acceptance criteria: [prd.md](../2-requirements/prd.md)

| #    | Feature              | Mô tả ngắn                                                             |
| ---- | -------------------- | ---------------------------------------------------------------------- |
| F-01 | Quản lý Nguyên liệu  | CRUD nguyên liệu với thông tin dinh dưỡng/100g                         |
| F-02 | Quản lý Món ăn       | CRUD món ăn, tính tự động calories/macros từ nguyên liệu               |
| F-03 | Lập Kế hoạch Bữa ăn  | Kéo-thả món vào 3 bữa/ngày, xem calendar tuần                          |
| F-04 | Health Profile       | BMR/TDEE/Target tự động tính từ thông tin cá nhân                      |
| F-05 | Dashboard Dinh dưỡng | Tổng quan calories eaten/remaining, macros, mini charts                |
| F-06 | Phân tích Ảnh AI     | Chụp ảnh thức ăn → AI nhận diện → auto-fill dinh dưỡng                 |
| F-07 | Quản lý Tập luyện    | Training plans, exercise library, workout logging                      |
| F-08 | Onboarding 7 bước    | Gender → Biometrics → Activity → Goal → Training → Strategy → Complete |
| F-09 | Data Export/Import   | Backup/restore qua Google Drive                                        |

---

## 7. Câu hỏi Thường gặp (FAQ)

**Q: Dùng font gì?**
A: System font stack — SF Pro (iOS), Roboto (Android). Không dùng custom font.

**Q: Icon library nào?**
A: Lucide React (open-source). Không dùng emoji trong UI production.

**Q: Có dark mode không?**
A: Có. Color palette đã define tokens cho cả light và dark mode.

**Q: Target device chính?**
A: Android mobile (375-428px). Web responsive là bonus.

**Q: Ngôn ngữ UI?**
A: 100% tiếng Việt. Thuật ngữ kỹ thuật (BMR, TDEE, macros) giữ nguyên tiếng Anh.

**Q: Cần thiết kế animation không?**
A: Có — motion specs trong [ui-rules.md](ui-rules.md) §7. Transitions 200-300ms, easing ease-out.

---

## 8. Liên hệ & Quy trình Review

- **Review cycle**: Designer giao draft → CEO review → Feedback → Iterate (tối đa 3 rounds)
- **Feedback format**: Comment trực tiếp trên Figma
- **Approval**: CEO approve từng screen trước khi chuyển Dev
- **Timeline**: Thỏa thuận riêng với Designer

---

> **Lưu ý**: Nếu có thắc mắc bất kỳ điều gì, hãy hỏi TRƯỚC khi thiết kế. Tốt hơn hỏi thừa 5 câu còn hơn thiết kế sai 1 screen.
