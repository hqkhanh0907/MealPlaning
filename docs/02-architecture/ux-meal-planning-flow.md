# Phân tích & Kế hoạch cải thiện UX Mobile — Smart Meal Planner

> **Ngày tạo**: 2026-03-07  
> **Phương pháp**: Chrome DevTools Mobile Emulation (iPhone 14 Pro 393×852, iPhone SE 375×667)  
> **Trạng thái**: Phase 1 hoàn thành, Bug content overlap đã sửa ✅, Phase 2–6 chưa bắt đầu

---

## Mục lục

1. [Tổng quan UX Flow hiện tại](#1-tổng-quan-ux-flow-hiện-tại)
2. [Kết quả nghiên cứu từ Chrome DevTools](#2-kết-quả-nghiên-cứu-từ-chrome-devtools)
3. [Đánh giá chi tiết từng phần](#3-đánh-giá-chi-tiết-từng-phần)
4. [Kế hoạch cải thiện — 6 Phases](#4-kế-hoạch-cải-thiện--6-phases)
5. [Wireframe Before/After](#5-wireframe-beforeafter)
6. [File Appendix](#6-file-appendix)

---

## 1. Tổng quan UX Flow hiện tại

### 1.1 Kiến trúc Navigation

```
Mobile (< 640px):
┌─────────────────────────────┐
│ 🍴 [Tên tab hiện tại]      │ ← Header (sticky top)
├─────────────────────────────┤
│                             │
│        Content Area         │ ← pb-28 (112px clearance cho bottom nav ✅)
│                             │
├─────────────────────────────┤
│ 📅  📖  ✨  🛒  ⚙️          │ ← Bottom Nav (fixed, icon-only ✅)
└─────────────────────────────┘

Desktop (≥ 640px):
┌───────────────────────────────────────────────────┐
│ 🍴 Smart Meal Planner   [Tab1][Tab2][Tab3]...     │ ← Header + DesktopNav
├───────────────────────────────────────────────────┤
│                   Content Area                     │
└───────────────────────────────────────────────────┘
```

### 1.2 Meal Planning Flow

```
User chọn ngày trên DateSelector
        │
        ├─ Click ngày chưa chọn → Chọn ngày
        ├─ Click ngày đã chọn  → Mở MealPlannerModal
        └─ Click "Lên kế hoạch" → openTypeSelection()
                                     │
                                     ▼
                          Tìm slot trống đầu tiên
                          (breakfast → lunch → dinner)
                                     │
                                     ▼
                          MealPlannerModal opens
                          với initialTab = slot trống
                                     │
                          ┌──────────┼──────────┐
                          ▼          ▼          ▼
                       [Sáng]    [Trưa]     [Tối]
                          │
                     Search + Sort dishes
                     Toggle select/deselect
                          │
                          ▼
                     handleConfirm()
                     → Detect changes across ALL 3 tabs
                     → onConfirm(Record<MealType, string[]>)
                     → Close modal + notification
```

### 1.3 Component Tree (Mobile)

| Component | File | Vai trò |
|-----------|------|---------|
| `App.tsx` | `src/App.tsx` | Root orchestrator, header, tab switching |
| `BottomNavBar` | `src/components/navigation/AppNavigation.tsx` | Fixed bottom nav (5 tabs, icon-only) |
| `DesktopNav` | `src/components/navigation/AppNavigation.tsx` | Desktop horizontal nav (hidden on mobile) |
| `CalendarTab` | `src/components/CalendarTab.tsx` | Main calendar view + MealCards |
| `DateSelector` | `src/components/DateSelector.tsx` | Week/month calendar with meal dots |
| `Summary` | `src/components/Summary.tsx` | Daily nutrition progress bars |
| `MealCard` | Inline in `CalendarTab.tsx` L25-65 | Individual meal slot display |
| `MealPlannerModal` | `src/components/modals/MealPlannerModal.tsx` | All-in-one dish selection (3 tabs) |
| `useModalManager` | `src/hooks/useModalManager.ts` | Modal state (ensures 1 modal at a time) |

---

## 2. Kết quả nghiên cứu từ Chrome DevTools

### 2.1 Bottom Navigation (ĐÃ SỬA ✅)

**Trước khi sửa:**

| Tab | Width | % screen (393px) |
|-----|-------|-------------------|
| Lịch trình | 76.9px | 19.6% |
| Thư viện | 71.9px | 18.3% |
| AI Phân tích | 90.9px | **23.1%** |
| Đi chợ | 59.1px | 15.0% |
| Cài đặt | 63.6px | 16.2% |
| **Tổng** | **363px / 377px** | **96%** sử dụng |

**Vấn đề tìm thấy:**
- Text wrapping trên iPhone SE (375px): mọi label xuống 2 dòng
- "AI Phân tích" rộng nhất (91px), "Đi chợ" hẹp nhất (59px) → lệch
- Tên tab lặp ở cả header VÀ bottom nav → dư thừa
- Touch target bị text ép hẹp

**Sau khi sửa:**

| Tab | Width | Height |
|-----|-------|--------|
| Tất cả tabs | 56px (đều nhau) | 48px (chuẩn Material) |
| **Tổng** | **280px / 377px** | **71%** sử dụng |

**Thay đổi code:**
- Xóa `<span className="text-[11px] font-bold">{label}</span>`
- Giữ `aria-label={label}` cho accessibility
- Điều chỉnh padding: `py-2 px-3 gap-0.5 min-h-14` → `py-2.5 px-4 min-h-12`
- Nav height: 67.5px → 57px (giảm 15%)

### 2.2 Header Mobile

**Phát hiện:**
- Header luôn hiển thị `getTabLabels(t)[activeMainTab]` trên mobile
- Bottom nav (icon-only) + Header (text label) = combo hoàn hảo — mỗi phần bổ sung cho nhau
- Subtitle (`{t('header.subtitle', { weight: userProfile.weight })}`) chỉ hiển thị trên desktop

### 2.3 DateSelector

**Phát hiện:**
- Default view trên mobile: week (7 ngày ngang)
- Swipe trái/phải để chuyển tuần (threshold 50px)
- Indicator dots: 3 chấm (amber/blue/indigo) dưới mỗi ngày
- Click ngày đã chọn → mở MealPlanner (smart double-tap)
- Kích thước dot: `w-1 h-1` mobile → `w-1.5 h-1.5` desktop (hơi nhỏ trên mobile)

### 2.4 MealCards Layout

**Phát hiện:**
- Grid: `grid-cols-1 md:grid-cols-3` → xếp dọc trên mobile
- Touch target: `min-h-11 min-w-11` (44px — đạt chuẩn Apple HIG)
- Empty state: icon dashed + "Thêm món ăn" button
- Edit button: chỉ hiện khi có meal, hover → green

### 2.5 Content Area — BUG phát hiện & đã sửa ✅

**Phát hiện:**
- `pb-28 sm:pb-8 pb-safe` — **BUG**: `pb-safe` override hoàn toàn `pb-28` do CSS cascade
- Layout chính: `lg:grid-cols-3` → RecommendationPanel chiếm 1/3 trên desktop, full-width trên mobile
- Summary card dùng progress bars với color transitions (emerald → amber → rose)

**Bug: Bottom Nav che content khi scroll xuống cuối (ALL TABS)**

| Thuộc tính | Giá trị kỳ vọng | Giá trị thực tế | Nguyên nhân |
|------------|-----------------|-----------------|-------------|
| `padding-bottom` (main) | 112px (`pb-28`) | **0px** | `.pb-safe` override |
| Content bị che | 0px | **~57px** (nav height) | Không có bottom padding |

**Root Cause**: CSS cascade — class `.pb-safe` (định nghĩa trong `index.css` L22-24) đặt `padding-bottom: var(--sab)` = `0px` trên web browser (vì `env(safe-area-inset-bottom)` = 0px). Do `.pb-safe` nằm sau Tailwind utilities trong CSS output, nó override hoàn toàn `pb-28` (7rem = 112px).

```css
/* index.css — custom class */
.pb-safe { padding-bottom: var(--sab); } /* = 0px trên web */
```

```html
<!-- App.tsx L311 — TRƯỚC khi sửa -->
<main className="... pb-28 sm:pb-8 pb-safe">
<!-- pb-safe (0px) OVERRIDE pb-28 (112px) → padding-bottom = 0px! -->

<!-- App.tsx L311 — SAU khi sửa ✅ -->
<main className="... pb-28 sm:pb-8">
<!-- BottomNavBar đã tự handle safe-area bằng <div className="pb-safe" /> bên trong -->
```

**Fix**: Xóa `pb-safe` khỏi `<main>` className. BottomNavBar đã có `<div className="pb-safe" />` riêng (AppNavigation.tsx L60) để handle safe-area inset. `pb-28` (112px) đủ clearance cho cả nav height (57px) + safe area (~34px trên iPhone).

---

## 3. Đánh giá chi tiết từng phần

### 3.1 Bottom Navigation — Điểm: 9.2/10 ✅

| Tiêu chí | Điểm | Ghi chú |
|----------|-------|---------|
| Clarity | 9/10 | Icon rõ ràng, aria-label đầy đủ |
| Space efficiency | 9/10 | 71% utilization, plenty breathing room |
| Touch accuracy | 9/10 | 56×48px đều nhau, no more cramping |
| Consistency | 9/10 | Tất cả button cùng kích thước |
| Responsive | 10/10 | Hoạt động perfect trên 375px → 428px |

### 3.2 Header Mobile — Điểm: 7/10

| Tiêu chí | Điểm | Ghi chú |
|----------|-------|---------|
| Clarity | 8/10 | Hiện tên tab, user biết đang ở đâu |
| Space efficiency | 6/10 | Icon 🍴 + text chiếm ~60px vertical |
| Redundancy | 7/10 | Sau khi nav icon-only, header text trở thành essential |
| Information density | 6/10 | Thiếu subtitle/context info trên mobile |

**Cơ hội cải thiện:**
- Có thể hiển thị ngày hiện tại hoặc nutrition progress mini trên header

### 3.3 DateSelector — Điểm: 7.5/10

| Tiêu chí | Điểm | Ghi chú |
|----------|-------|---------|
| Swipe gesture | 9/10 | Smooth, threshold hợp lý |
| Indicator dots | 6/10 | Quá nhỏ (w-1 h-1 = 4px), khó nhìn |
| View toggle | 8/10 | Icon rõ ràng |
| Date text format | 7/10 | "Th 7, 7/3" — ok nhưng có thể rõ hơn |
| Plan interaction | 8/10 | Click selected date → plan là intuitive |

**Cơ hội cải thiện:**
- Indicator dots cần lớn hơn trên mobile (tối thiểu 6px)
- Ngày hiện tại cần highlight mạnh hơn

### 3.4 MealCards — Điểm: 7/10

| Tiêu chí | Điểm | Ghi chú |
|----------|-------|---------|
| Layout | 7/10 | 1 cột ok nhưng 3 cards chiếm nhiều scroll |
| Empty state | 8/10 | CTA rõ ràng |
| Edit access | 6/10 | Button "Sửa" nhỏ, cần prominence hơn |
| Nutrition display | 7/10 | Compact nhưng đầy đủ |

**Cơ hội cải thiện:**
- Accordion collapse cho meal cards khi empty
- Horizontal scroll 3 cards thay vì vertical stack

### 3.5 MealPlannerModal — Điểm: 8/10

| Tiêu chí | Điểm | Ghi chú |
|----------|-------|---------|
| All-in-one design | 9/10 | Excellent — 1 modal thay 2 |
| Save-All feature | 9/10 | Multi-tab save hoạt động tốt |
| Search + Sort | 8/10 | 6 sort options đầy đủ |
| Tab switching | 7/10 | Clear search on switch — có thể confuse |
| Nutrition footer | 8/10 | Day total + tab total informative |

**Cơ hội cải thiện:**
- Clear search trên tab switch nên có animation/feedback
- Dish count badge trên tab nên nổi bật hơn

---

## 4. Kế hoạch cải thiện — 6 Phases

### Phase 1: Bottom Navigation Icon-Only ✅ COMPLETED

**Trạng thái:** Đã hoàn thành và verified trên iPhone 14 Pro + iPhone SE

**Files đã thay đổi:**
- `src/components/navigation/AppNavigation.tsx` — Xóa text label, điều chỉnh padding

**Tests:** 44/44 passed (0 regressions)

---

### Phase 2: Header Mobile Optimization

**Mục tiêu:** Tối ưu header trên mobile — giảm chiều cao, thêm context hữu ích

**Lý do:**
- Sau khi bottom nav chuyển sang icon-only, header là nơi duy nhất hiển thị tên tab → vẫn cần giữ
- Chiều cao header hiện tại (~60px) có thể compact hơn
- Thiếu quick-access info (ngày hiện tại, nutrition mini)

**Tasks:**

| # | Task | File | Story Points |
|---|------|------|-------------|
| 2.1 | Giảm padding header mobile: `py-3` → `py-2` | `src/App.tsx` L292 | 1 SP |
| 2.2 | Giảm icon size: `w-6 h-6` → `w-5 h-5` trên mobile | `src/App.tsx` L296 | 1 SP |
| 2.3 | (Tùy chọn) Thêm ngày hiện tại dưới tên tab | `src/App.tsx` L299-302 | 2 SP |
| 2.4 | Viết unit test cho header render mobile vs desktop | `src/__tests__/` | 2 SP |

**Wireframe:**

```
HIỆN TẠI:                         SAU CẢI THIỆN:
┌─────────────────────┐          ┌─────────────────────┐
│ 🍴  Lịch trình      │ 60px    │ 🍴 Lịch trình       │ 48px
│     (py-3, icon 24px)│          │    Th 7, 7/3         │
└─────────────────────┘          └─────────────────────┘
```

**Tổng: 4–6 SP**

---

### Phase 3: MealCard Compact Layout

**Mục tiêu:** Giảm scroll distance trên mobile, tối ưu information density cho MealCards

**Lý do:**
- 3 meal cards xếp dọc = user phải scroll dài trên mobile
- Empty meal card hiện 1 dòng text + button → lãng phí space
- Edit button nhỏ và ít prominence

**Tasks:**

| # | Task | File | SP |
|---|------|------|----|
| 3.1 | Collapse empty meal cards thành inline chip | `CalendarTab.tsx` L25-65 | 3 SP |
| 3.2 | Horizontal 3-card layout trên mobile (scroll snap) | `CalendarTab.tsx` L260 | 3 SP |
| 3.3 | Swipe để edit trên meal card (optional) | `CalendarTab.tsx` | 3 SP |
| 3.4 | Viết unit test | `src/__tests__/` | 2 SP |

**Wireframe - Phương án A: Horizontal Scroll Snap:**

```
Mobile (hiện tại):              Mobile (cải thiện):
┌─────────────────┐             ┌─────────────────────────────────
│ ☀️ Bữa sáng     │             │ ☀️ Sáng    │ 🌤️ Trưa    │ 🌙 T
│ Món A • 150kcal │             │ Món A      │ [+ Thêm]  │ Món
│ [Sửa]           │             │ 150kcal    │            │ 280
├─────────────────┤             │ [Sửa]      │            │ [Sử
│ 🌤️ Bữa trưa     │             └────────────┘────────────┘────
│ [+ Thêm món ăn]│              ← swipe horizontal →
├─────────────────┤
│ 🌙 Bữa tối      │
│ Món B • 280kcal │
│ [Sửa]           │
└─────────────────┘
Scroll distance: ~3 screens     Scroll distance: ~1.5 screens
```

**Phương án B: Accordion Collapse:**

```
┌─────────────────────────────┐
│ ☀️ Sáng: Món A (150kcal) [▼]│  ← expanded
│   Món A - Cơm gà              │
│   150 kcal • 15g protein       │
│   [Sửa] [Xóa]                 │
├─────────────────────────────┤
│ 🌤️ Trưa: Trống          [▶]│  ← collapsed (1 line)
├─────────────────────────────┤
│ 🌙 Tối: Món B (280kcal) [▶]│  ← collapsed
└─────────────────────────────┘
```

**Tổng: 8–11 SP**

---

### Phase 4: DateSelector Touch Optimization

**Mục tiêu:** Cải thiện indicator dots visibility và touch interaction trên mobile

**Lý do:**
- Indicator dots chỉ w-1 h-1 (4px) — quá nhỏ, gần như invisible trên retina
- Week view ok nhưng calendar view cells hơi chật cho touch
- "Vuốt ngang hoặc dùng mũi tên để chuyển tuần" tip chiếm space

**Tasks:**

| # | Task | File | SP |
|---|------|------|----|
| 4.1 | Tăng indicator dots: `w-1 h-1` → `w-1.5 h-1.5` trên mobile | `DateSelector.tsx` L278-283 | 1 SP |
| 4.2 | Thêm pulse animation cho ngày hôm nay | `DateSelector.tsx` | 2 SP |
| 4.3 | Ẩn instruction text sau lần đầu (localStorage flag) | `DateSelector.tsx` L335-337 | 2 SP |
| 4.4 | Haptick feedback hint khi swipe thành công (CSS only) | `DateSelector.tsx` | 1 SP |
| 4.5 | Viết unit test | `src/__tests__/` | 2 SP |

**Wireframe:**

```
HIỆN TẠI:                           SAU CẢI THIỆN:
┌──┬──┬──┬──┬──┬──┬──┐            ┌──┬──┬──┬──┬──┬──┬──┐
│T2│T3│T4│T5│T6│T7│CN│            │T2│T3│T4│T5│T6│T7│CN│
│2 │3 │4 │5 │6 │7 │8 │            │2 │3 │4 │5 │6 │🔵│8 │ ← pulse today
│..│  │  │..│  │...│  │ ← 4px     │⚫│  │  │⚫│  │⚫⚫⚫│  │ ← 6px dots
└──┴──┴──┴──┴──┴──┴──┘            └──┴──┴──┴──┴──┴──┴──┘
"Vuốt ngang hoặc..."              (ẩn sau lần đầu)
```

**Tổng: 6–8 SP**

---

### Phase 5: MealPlannerModal UX Polish

**Mục tiêu:** Tinh chỉnh modal trải nghiệm trên mobile full-screen

**Lý do:**
- Modal chiếm full screen trên mobile → cần tối ưu cho mobile-first
- Tab switching clear search không có feedback
- Dish card kích thước chưa optimal trên mobile
- Footer nutrition area có thể compact hơn

**Tasks:**

| # | Task | File | SP |
|---|------|------|----|
| 5.1 | Animate tab change (slide transition) | `MealPlannerModal.tsx` | 3 SP |
| 5.2 | Keep search query across tab switches (don't clear) | `MealPlannerModal.tsx` handleTabChange | 1 SP |
| 5.3 | Sticky search bar (không scroll đi khi list dài) | `MealPlannerModal.tsx` | 2 SP |
| 5.4 | Pull-to-close gesture cho modal (mobile) | `MealPlannerModal.tsx` | 3 SP |
| 5.5 | Tab badge: thêm indicator "has changes" rõ hơn | `MealPlannerModal.tsx` | 1 SP |
| 5.6 | Viết unit test | `src/__tests__/` | 3 SP |

**Wireframe:**

```
MealPlannerModal (Mobile Full-Screen):
┌─────────────────────────────┐
│ ← Lên kế hoạch      [×]    │ ← Header fixed
├─────────────────────────────┤
│ [☀️ Sáng(2)] [🌤️ Trưa●] [🌙]│ ← Tab bar fixed
├─────────────────────────────┤
│ 🔍 [Tìm kiếm...   ]  [Sort]│ ← Search bar STICKY
├─────────────────────────────┤
│ ┌───────────────────────── ┐│
│ │ □ Cơm gà                 ││ ← Scrollable dish list
│ │   🔥 150kcal  💪 15g     ││
│ │───────────────────────── ││
│ │ ■ Phở bò            ✓   ││
│ │   🔥 350kcal  💪 25g     ││
│ │───────────────────────── ││
│ │ □ Bún chả                ││
│ │   ...                    ││
│ └───────────────────────── ┘│
├─────────────────────────────┤
│ Tổng ngày: 5 món · 🔥600   │ ← Footer fixed
│ [✅ Lưu tất cả (3 bữa)]    │
└─────────────────────────────┘
```

**Tổng: 10–13 SP**

---

### Phase 6: Dead Code & Config Cleanup

**Mục tiêu:** Dọn dẹp code cũ, tối ưu bundle size

**Lý do:**
- TypeSelectionModal.tsx và PlanningModal.tsx đã bị xóa → confirmed không tồn tại
- `mobileLabelKey` trong NAV_CONFIG không còn dùng (đã xóa text label trên mobile) → có thể simplify
- Một số unused i18n keys có thể tồn tại

**Tasks:**

| # | Task | File | SP |
|---|------|------|----|
| 6.1 | Xóa `mobileLabelKey` khỏi `NavItemConfig` (dùng `labelKey` cho cả hai) | `AppNavigation.tsx` L14-21 | 1 SP |
| 6.2 | Scan unused i18n keys (nav.* keys) | `src/locales/vi.json`, `en.json` | 1 SP |
| 6.3 | Kiểm tra bundle size trước/sau cleanup | CI/build | 1 SP |
| 6.4 | Viết unit test verify no regressions | `src/__tests__/` | 1 SP |

**Tổng: 3–4 SP**

---

## 5. Wireframe Before/After

### 5.1 Tổng thể Mobile Screen

```
TRƯỚC CẢI THIỆN:                    SAU CẢI THIỆN (Phase 1-4):
┌───────────────────────┐           ┌───────────────────────┐
│ 🍴 Lịch trình    60px│           │ 🍴 Lịch trình · 7/3│48px
├───────────────────────┤           ├───────────────────────┤
│ 📅 Chọn ngày          │           │ 📅 Chọn ngày          │
│ ┌──┬──┬──┬──┬──┬──┬──┐│           │ ┌──┬──┬──┬──┬──┬──┬──┐│
│ │2 │3 │4 │5 │6 │7●│8 ││           │ │2 │3 │4 │5 │6 │🔵│8 ││
│ │..│  │  │..│  │..│  ││ 4px dot  │ │⚫│  │  │⚫│  │⚫⚫│  ││ 6px
│ └──┴──┴──┴──┴──┴──┴──┘│           │ └──┴──┴──┴──┴──┴──┴──┘│
│ "Vuốt ngang..."       │           │ (ẩn sau lần đầu)      │
├───────────────────────┤           ├───────────────────────┤
│ 📊 Dinh dưỡng         │           │ 📊 Dinh dưỡng         │
│ 🔥 1456/1500 (97%)    │           │ 🔥 1456/1500 (97%)    │
│ 💪 173/166g  (104%)   │           │ 💪 173/166g  (104%)   │
├───────────────────────┤           ├───────────────────────┤
│ ☀️ Bữa sáng           │           │ ☀️ Sáng  │ 🌤️ Trưa  │ ← 
│ Món A · 150kcal       │           │ Món A   │ [+Thêm]│   horiz
│ [Sửa]                 │           │ 150kcal │        │   scroll
├───────────────────────┤           ├─────────┴────────┤
│ 🌤️ Bữa trưa           │           │ Gợi ý cho bạn    │
│ [+ Thêm món ăn]       │           │ ...               │
├───────────────────────┤           ├───────────────────┤
│ 🌙 Bữa tối            │           │ 📅  📖  ✨  🛒  ⚙️ │ 48px
│ Món B · 280kcal       │           │    ── (active)    │
│ [Sửa]                 │           └───────────────────┘
├───────────────────────┤
│ Gợi ý cho bạn         │
│ ...                    │
├───────────────────────┤
│ 📅    📖    ✨    🛒   ⚙️│ 67px
│Lịch  Thư  AI   Đi  Cài│
│trình viện Phân chợ đặt │
│             tích       │
└───────────────────────┘

Scroll: ~4 screens               Scroll: ~2 screens
```

### 5.2 So sánh Bottom Nav

```
TRƯỚC:                                    SAU (✅ DONE):
┌────────┬───────┬────────┬──────┬──────┐  ┌──────┬──────┬──────┬──────┬──────┐
│  📅    │  📖   │  ✨    │  🛒  │  ⚙️  │  │  📅  │  📖  │  ✨  │  🛒  │  ⚙️  │
│ Lịch   │ Thư   │AI Phân │ Đi   │ Cài  │  │      │      │      │      │      │
│ trình  │ viện  │ tích   │ chợ  │ đặt  │  │ 56px │ 56px │ 56px │ 56px │ 56px │
│ 77px   │ 72px  │ 91px   │ 59px │ 64px │  │  ──  │      │      │      │      │
├────────┴───────┴────────┴──────┴──────┤  ├──────┴──────┴──────┴──────┴──────┤
│ Total: 363px/377px = 96% used   67px │  │ Total: 280px/377px = 71%    57px │
└───────────────────────────────────────┘  └───────────────────────────────────┘
```

---

## 6. File Appendix

### Files đã thay đổi

| File | Thay đổi | Phase |
|------|----------|-------|
| `src/components/navigation/AppNavigation.tsx` | Xóa text label, icon-only, compact padding | Phase 1 ✅ |
| `src/App.tsx` L311 | Xóa `pb-safe` khỏi `<main>` — fix content bị bottom nav che | Bug fix ✅ |

### Files sẽ thay đổi (Phase 2-6)

| File | Thay đổi dự kiến | Phase |
|------|-------------------|-------|
| `src/App.tsx` L292-302 | Header compact, thêm date context | Phase 2 |
| `src/components/CalendarTab.tsx` L25-65, L260 | MealCard layout horizontal/accordion | Phase 3 |
| `src/components/DateSelector.tsx` L278-337 | Dot size, today pulse, hide instruction | Phase 4 |
| `src/components/modals/MealPlannerModal.tsx` | Sticky search, tab transition, pull-to-close | Phase 5 |
| `src/components/navigation/AppNavigation.tsx` L14-21 | Cleanup mobileLabelKey | Phase 6 |
| `src/locales/vi.json`, `en.json` | Cleanup unused keys | Phase 6 |

### Tổng Story Points

| Phase | SP | Trạng thái |
|-------|----|-----------| 
| Phase 1: Bottom Nav Icon-Only | 2 SP | ✅ DONE |
| Phase 2: Header Optimization | 4-6 SP | ⬜ TODO |
| Phase 3: MealCard Layout | 8-11 SP | ⬜ TODO |
| Phase 4: DateSelector Touch | 6-8 SP | ⬜ TODO |
| Phase 5: MealPlannerModal Polish | 10-13 SP | ⬜ TODO |
| Phase 6: Dead Code Cleanup | 3-4 SP | ⬜ TODO |
| **Tổng** | **33-44 SP** | |

### Thứ tự ưu tiên đề xuất

```
Phase 1 ✅ → Phase 2 (quick win) → Phase 4 (visibility fix)
                                  → Phase 3 (major UX lift)
                                  → Phase 5 (polish)
                                  → Phase 6 (cleanup)
```

Phase 2 và Phase 4 là quick wins (< 8 SP mỗi phase), nên làm trước.  
Phase 3 và Phase 5 là major improvements, cần thiết kế kỹ hơn.  
Phase 6 là cleanup, làm cuối cùng.
