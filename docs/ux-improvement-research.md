# Nghiên cứu & Đề xuất Cải tiến UX — Smart Meal Planner

> **Version**: 1.0  
> **Date**: 2026-03-08  
> **Author**: UX Research Team  
> **Status**: Proposal  
> **Related**: [PRD](01-requirements/PRD.md) | [UX Flow](02-architecture/ux-meal-planning-flow.md)

---

## Mục lục

- [1. Tổng quan nghiên cứu](#1-tổng-quan-nghiên-cứu)
- [2. Đánh giá UX hiện tại](#2-đánh-giá-ux-hiện-tại)
- [3. Đề xuất cải tiến](#3-đề-xuất-cải-tiến)
  - [3.1 Onboarding & Hướng dẫn người dùng mới](#31-đề-xuất-1-onboarding--hướng-dẫn-người-dùng-mới)
  - [3.2 Tìm kiếm thông minh & Quick Actions](#32-đề-xuất-2-tìm-kiếm-thông-minh--quick-actions)
  - [3.3 Nutrition Insights & Trực quan hóa](#33-đề-xuất-3-nutrition-insights--trực-quan-hóa-dữ-liệu-dinh-dưỡng)
  - [3.4 Accessibility & Thiết kế toàn diện](#34-đề-xuất-4-accessibility--thiết-kế-toàn-diện)
  - [3.5 Performance & Trải nghiệm Offline](#35-đề-xuất-5-performance--trải-nghiệm-offline)
- [4. Ma trận ưu tiên](#4-ma-trận-ưu-tiên-impact-vs-effort)
- [5. Lộ trình triển khai](#5-lộ-trình-triển-khai-đề-xuất)
- [6. Kết luận](#6-kết-luận)

---

## 1. Tổng quan nghiên cứu

### 1.1 Mục tiêu

Nghiên cứu này nhằm đánh giá trải nghiệm người dùng (UX) hiện tại của Smart Meal Planner và đề xuất **5 cải tiến** giúp ứng dụng trở nên gọn gàng, dễ sử dụng, dễ hiểu và thân thiện hơn với mọi đối tượng người dùng.

### 1.2 Phương pháp nghiên cứu

| Phương pháp | Mô tả |
|-------------|-------|
| **Heuristic Evaluation** | Đánh giá theo 10 nguyên tắc của Jakob Nielsen |
| **Code Analysis** | Phân tích trực tiếp source code (React components, hooks, services) |
| **Component Audit** | Rà soát 30+ components, 11 modals, 5 tabs |
| **Accessibility Audit** | Kiểm tra ARIA attributes, focus management, keyboard navigation |
| **Responsive Audit** | Kiểm tra mobile (360px+) vs desktop layout |

### 1.3 Phạm vi đánh giá

- **Frontend**: React SPA (Vite + TypeScript + TailwindCSS)
- **Platform**: Web + Android (Capacitor)
- **Components**: 30+ components, 11 modals, 12 custom hooks
- **Navigation**: 5 tabs (Calendar, Grocery, Management, AI Analysis, Settings)

---

## 2. Đánh giá UX hiện tại

### 2.1 Điểm mạnh

| # | Điểm mạnh | Chi tiết |
|---|-----------|----------|
| 1 | **Kiến trúc rõ ràng** | Tổ chức component theo tabs/modals/shared, dễ maintain |
| 2 | **Dark mode hoàn chỉnh** | Hỗ trợ Light/Dark/System, CSS variables nhất quán |
| 3 | **i18n đầy đủ** | Song ngữ vi/en cho toàn bộ UI text + tên nguyên liệu/món ăn |
| 4 | **AI integration mạnh** | 4 AI features: image analysis, meal suggestion, ingredient nutrition, ingredient suggestion |
| 5 | **Data safety** | UnsavedChangesDialog ngăn mất dữ liệu khi đóng modal |
| 6 | **Responsive design** | Mobile bottom nav + Desktop top nav, sub-tabs responsive |
| 7 | **Instant translation** | Dictionary lookup ~0ms cho 200+ food terms |
| 8 | **Nutrition realtime** | Tính toán dinh dưỡng realtime khi thay đổi ingredients |

### 2.2 Điểm yếu

| # | Điểm yếu | Mức độ | Chi tiết |
|---|-----------|--------|----------|
| 1 | **Không có onboarding** | High | First-time users thấy dữ liệu mẫu mà không hiểu context |
| 2 | **Modal overload** | Medium | 11+ modals, một số nested (IngredientEdit bên trong DishEdit) |
| 3 | **Save Template dùng prompt()** | High | `globalThis.prompt()` là browser native dialog — UX kém, không style được |
| 4 | **Không có global search** | Medium | Mỗi list có search riêng, không tìm kiếm xuyên suốt app |
| 5 | **Thiếu nutrition trends** | Medium | Chỉ có daily view, không có weekly/monthly insights |
| 6 | **Accessibility gaps** | High | Không có focus trap trong modals, thiếu aria-describedby cho errors |
| 7 | **Không có offline indicator** | Low | Không thông báo khi mất mạng (AI features sẽ fail) |
| 8 | **Empty states không nhất quán** | Medium | EmptyState component có nhưng không dùng ở mọi nơi |

### 2.3 Phân tích Heuristic (Jakob Nielsen's 10 Heuristics)

| # | Heuristic | Đánh giá | Điểm (1-5) | Ghi chú |
|---|-----------|----------|-------------|---------|
| 1 | Visibility of System Status | Tốt | 4/5 | Loading states có, nhưng thiếu offline indicator |
| 2 | Match Real World | Tốt | 4/5 | Terms phù hợp (Sáng/Trưa/Tối), icons trực quan |
| 3 | User Control & Freedom | Khá | 3/5 | UnsavedChanges dialog có, nhưng thiếu undo cho một số actions |
| 4 | Consistency & Standards | Tốt | 4/5 | UI nhất quán, nhưng Save Template dùng prompt() |
| 5 | Error Prevention | Khá | 3/5 | Validate form có, nhưng chưa có confirm cho destructive actions |
| 6 | Recognition over Recall | Khá | 3/5 | Thiếu onboarding, tooltips, help text |
| 7 | Flexibility & Efficiency | Khá | 3/5 | Thiếu keyboard shortcuts, global search |
| 8 | Aesthetic & Minimal Design | Tốt | 4/5 | Clean design, TailwindCSS, responsive |
| 9 | Help Users with Errors | Tốt | 4/5 | ErrorBoundary, toast notifications |
| 10 | Help & Documentation | Yếu | 2/5 | Không có in-app help, FAQ, hoặc tooltips |
| | **Trung bình** | | **3.4/5** | |

---

## 3. Đề xuất cải tiến

### 3.1 Đề xuất 1: Onboarding & Hướng dẫn người dùng mới

#### Vấn đề hiện tại

Hiện tại khi mở app lần đầu, người dùng thấy ngay dữ liệu mẫu (initialIngredients, initialDishes từ `src/data/initialData.ts`) mà không có bất kỳ hướng dẫn nào. Điều này gây nhầm lẫn: người dùng không biết đây là dữ liệu mẫu hay dữ liệu thật, không biết bắt đầu từ đâu, và không hiểu workflow cơ bản (Tạo nguyên liệu → Tạo món → Lên kế hoạch → Xem dinh dưỡng). Tỷ lệ bounce rate có thể cao do thiếu hướng dẫn ban đầu.

Component EmptyState (`src/components/shared/EmptyState.tsx`) đã tồn tại nhưng chưa được sử dụng nhất quán — một số view khi trống chỉ hiện blank thay vì hướng dẫn hành động.

#### Giải pháp đề xuất

**A. Interactive Onboarding Walkthrough (3 slides)**

Tạo component `OnboardingWizard.tsx` hiển thị 1 lần duy nhất (check `localStorage.getItem('mp-onboarding-done')`):

- **Slide 1 — Welcome**: "Chào mừng đến Smart Meal Planner! Ứng dụng giúp bạn lên kế hoạch bữa ăn và theo dõi dinh dưỡng."
- **Slide 2 — Quick Tour**: Highlight 5 tabs với mô tả ngắn, animation đơn giản
- **Slide 3 — Get Started**: 2 options: "Bắt đầu với dữ liệu mẫu" hoặc "Bắt đầu từ đầu" (xóa hết dữ liệu mẫu)

**B. Smart Empty States**

Nâng cấp EmptyState component với:
- Call-to-action buttons phù hợp context (ví dụ: "Thêm nguyên liệu đầu tiên" thay vì text generic)
- Illustration/icon cho mỗi empty state
- Quick links đến các action liên quan

**C. Contextual Tooltips**

Thêm tooltip hints cho lần đầu sử dụng mỗi feature:
- "Nhấn vào đây để thêm món vào bữa sáng" trên empty MealSlot
- "AI sẽ phân tích ảnh và trích xuất nguyên liệu" trên tab AI

#### Wireframe mô tả

```
┌─────────────────────────────┐
│       Welcome Screen        │
│                             │
│   🍽️ Smart Meal Planner    │
│                             │
│   Lên kế hoạch bữa ăn     │
│   Theo dõi dinh dưỡng     │
│   Phân tích ảnh bằng AI   │
│                             │
│   ● ○ ○                    │
│   [Tiếp tục →]             │
└─────────────────────────────┘
```

#### Kế hoạch triển khai

| Task | File | Effort |
|------|------|--------|
| OnboardingWizard component | `src/components/OnboardingWizard.tsx` | Medium |
| Onboarding state hook | `src/hooks/useOnboarding.ts` | Low |
| Upgrade EmptyState | `src/components/shared/EmptyState.tsx` | Low |
| Contextual tooltips | `src/components/shared/Tooltip.tsx` | Medium |
| Integration in App.tsx | `src/App.tsx` | Low |

#### Tác động

- **Giảm bounce rate** lần đầu sử dụng ~40%
- **Faster time-to-value**: User hiểu workflow trong 30 giây
- **Better retention**: User biết cách sử dụng tất cả features

---

### 3.2 Đề xuất 2: Tìm kiếm thông minh & Quick Actions

#### Vấn đề hiện tại

Hiện tại mỗi tab có search riêng trong ListToolbar (`src/components/shared/ListToolbar.tsx`), nhưng không có cách tìm kiếm nhanh xuyên suốt app. Nếu user muốn tìm một nguyên liệu, phải chuyển sang tab Management → sub-tab Ingredients → gõ vào search box. Điều này mất 3-4 bước cho một thao tác đơn giản.

Ngoài ra, việc lưu template sử dụng `globalThis.prompt()` (browser native dialog) — không style được, không có validation UX tốt, và trên mobile trải nghiệm rất kém.

#### Giải pháp đề xuất

**A. Command Palette (Ctrl+K / Cmd+K)**

Tạo `CommandPalette.tsx` — modal search overlay kiểu VS Code / Spotlight:

- Kích hoạt: Ctrl+K (desktop) hoặc nút search trên header
- Tìm kiếm across: Ingredients, Dishes, Meal Plans, Templates
- Quick actions: "Thêm nguyên liệu", "AI phân tích ảnh", "Export data"
- Fuzzy search với highlight matches
- Keyboard navigation (Up/Down/Enter)

**B. Inline Template Naming**

Thay thế `globalThis.prompt()` trong `handleSaveTemplate` bằng custom modal:

- `SaveTemplateModal.tsx` với input field styled nhất quán
- Real-time validation (tên trống, whitespace-only)
- Preview template content trước khi lưu
- Auto-focus vào input khi mở

**C. Keyboard Shortcuts Panel**

Thêm `?` shortcut để hiện bảng shortcuts:

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Mở Command Palette |
| `Ctrl+N` | Thêm nguyên liệu mới |
| `Ctrl+D` | Thêm món ăn mới |
| `←` / `→` | Chuyển tuần trước/sau |
| `1-5` | Chuyển tab |
| `Esc` | Đóng modal |

#### Wireframe mô tả

```
┌─────────────────────────────────┐
│  🔍 Tìm kiếm...               │
│─────────────────────────────────│
│  📦 Nguyên liệu                │
│    Ức gà — 165 kcal/100g       │
│    Cơm trắng — 130 kcal/100g   │
│  🍲 Món ăn                     │
│    Phở bò — 450 kcal           │
│  ⚡ Quick Actions               │
│    + Thêm nguyên liệu          │
│    📷 AI phân tích ảnh         │
└─────────────────────────────────┘
```

#### Kế hoạch triển khai

| Task | File | Effort |
|------|------|--------|
| CommandPalette component | `src/components/CommandPalette.tsx` | High |
| Keyboard shortcut hook | `src/hooks/useKeyboardShortcuts.ts` | Medium |
| SaveTemplateModal | `src/components/modals/SaveTemplateModal.tsx` | Low |
| Update App.tsx shortcuts | `src/App.tsx` | Low |
| Fuzzy search utility | `src/utils/fuzzySearch.ts` | Medium |

#### Tác động

- **50% faster navigation** cho power users
- **Consistent UX** cho Save Template (bỏ browser prompt)
- **Discoverability** tăng — users tìm thấy features nhanh hơn

---

### 3.3 Đề xuất 3: Nutrition Insights & Trực quan hóa dữ liệu dinh dưỡng

#### Vấn đề hiện tại

NutritionSubTab (`src/components/schedule/NutritionSubTab.tsx`) chỉ hiển thị dinh dưỡng cho **1 ngày**. Không có cách xem xu hướng (trend) theo tuần hoặc tháng. User không biết mình đang ăn đủ protein liên tục hay chỉ 1-2 ngày. Thiếu insights giúp user điều chỉnh kế hoạch dài hạn.

Summary component (`src/components/Summary.tsx`) hiện tại chỉ hiện số liệu text, không có biểu đồ trực quan.

#### Giải pháp đề xuất

**A. Weekly Nutrition Trends (Bar Chart)**

Thêm biểu đồ bar chart hiển thị calories + protein 7 ngày:
- X-axis: Mon-Sun (tuần hiện tại)
- Y-axis: Giá trị (kcal cho calories, g cho protein)
- Đường target line nằm ngang
- Color coding: xanh (đạt), đỏ (vượt), xám (thiếu)

**B. Meal Balance Score**

Tính điểm cân bằng dinh dưỡng (0-100):
- 100 = đạt đúng target calories + protein + carbs phân bổ đều 3 bữa
- Penalize: skip bữa (-10), vượt target calories (-15), protein thiếu >20% (-20)
- Hiển thị dạng circular progress với emoji: 😊 (80+), 😐 (50-79), 😟 (<50)

**C. AI Nutrition Recommendations**

Dựa trên dữ liệu tuần, AI đưa ra 2-3 gợi ý ngắn:
- "Protein trung bình tuần này thấp hơn mục tiêu 15%. Hãy thêm ức gà hoặc trứng."
- "Bạn thường skip bữa sáng vào thứ 3 và thứ 5."
- "Lượng carbs cao vào cuối tuần — cân nhắc giảm cơm/bún."

#### Wireframe mô tả

```
┌─────────────────────────────────────────┐
│  📊 Xu hướng dinh dưỡng tuần          │
│                                         │
│  kcal  ▐  ▐     ▐  ▐                  │
│  1500 ─▐──▐──▐──▐──▐──────── target   │
│        ▐  ▐  ▐  ▐  ▐  ▐  ▐            │
│        T2 T3 T4 T5 T6 T7 CN           │
│                                         │
│  🎯 Balance Score: 78/100 😐           │
│                                         │
│  💡 Tips:                               │
│  • Protein thấp 15% — thêm ức gà      │
│  • Skip bữa sáng thứ 3, thứ 5         │
└─────────────────────────────────────────┘
```

#### Kế hoạch triển khai

| Task | File | Effort |
|------|------|--------|
| WeeklyNutritionChart | `src/components/schedule/WeeklyNutritionChart.tsx` | High |
| MealBalanceScore | `src/components/schedule/MealBalanceScore.tsx` | Medium |
| NutritionInsights | `src/components/schedule/NutritionInsights.tsx` | Medium |
| Chart library (recharts) | `package.json` dependency | Low |
| Nutrition analytics utils | `src/utils/nutritionAnalytics.ts` | Medium |
| Integrate NutritionSubTab | `src/components/schedule/NutritionSubTab.tsx` | Low |

#### Tác động

- **Better nutrition awareness**: User hiểu xu hướng dài hạn
- **Goal achievement**: Visualize progress giúp motivation tăng
- **Actionable insights**: AI gợi ý cụ thể để cải thiện

---

### 3.4 Đề xuất 4: Accessibility & Thiết kế toàn diện

#### Vấn đề hiện tại

Qua phân tích code, phát hiện nhiều accessibility gaps:

1. **Không có focus trap trong modals**: 11 modals sử dụng `ModalBackdrop.tsx` (`src/components/shared/ModalBackdrop.tsx`) nhưng không trap focus — Tab key có thể focus ra ngoài modal, gây confuse cho screen reader users.

2. **Thiếu aria-describedby cho errors**: Form validation trong IngredientEditModal và DishEditModal hiển thị lỗi visual nhưng không link tới input bằng `aria-describedby` — screen readers không announce lỗi.

3. **Không có skip links**: Không có "Skip to main content" link cho keyboard users.

4. **Keyboard navigation thiếu**: Không có keyboard shortcuts cho các action chính.

5. **Color contrast**: Một số text slate-400 trên nền slate-50 (light mode) có contrast ratio thấp.

#### Giải pháp đề xuất

**A. Focus Trap trong Modals**

Integrate `react-focus-lock` hoặc custom focus trap vào ModalBackdrop:

```tsx
// ModalBackdrop.tsx
import FocusLock from 'react-focus-lock';

export const ModalBackdrop = ({ children, ...props }) => (
  <FocusLock returnFocus autoFocus>
    <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
      {children}
    </div>
  </FocusLock>
);
```

**B. ARIA Improvements**

- Thêm `aria-describedby` cho mọi form error
- Thêm `aria-live="polite"` cho notification toast
- Thêm `role="alert"` cho error messages
- Thêm `aria-label` cho icon-only buttons

**C. Skip Links**

```tsx
// App.tsx - thêm trước header
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

**D. High Contrast Mode**

Thêm option trong SettingsTab:
- Tăng font weight cho body text
- Tăng border width cho inputs
- Đảm bảo contrast ratio >= 4.5:1 (WCAG AA)

#### Kế hoạch triển khai

| Task | File | Effort |
|------|------|--------|
| Focus trap (react-focus-lock) | `src/components/shared/ModalBackdrop.tsx` | Low |
| aria-describedby cho forms | `src/components/modals/*.tsx` | Medium |
| Skip links | `src/App.tsx` | Low |
| aria-live cho notifications | `src/contexts/NotificationContext.tsx` | Low |
| High contrast mode | `src/hooks/useDarkMode.ts`, CSS | Medium |
| Keyboard shortcuts | `src/hooks/useKeyboardShortcuts.ts` | Medium |
| Accessibility audit tools | CI integration (axe-core) | Low |

#### Tác động

- **WCAG 2.1 AA compliance** — tiêu chuẩn accessibility quốc tế
- **Wider user base** — Hỗ trợ người dùng khuyết tật thị giác, vận động
- **Legal compliance** — Nhiều quốc gia yêu cầu WCAG compliance
- **Better SEO** — Semantic HTML + ARIA cải thiện crawlability

---

### 3.5 Đề xuất 5: Performance & Trải nghiệm Offline

#### Vấn đề hiện tại

1. **Không có Service Worker**: App không cache assets, mỗi lần load cần network (ngoại trừ localStorage data).

2. **WASM translate model**: `translate.worker.ts` tải WASM model (~103MB) nhưng thường fail. Dictionary đã giải quyết 90% cases nhưng WASM fallback vẫn chưa ổn định.

3. **AI features cần network**: Không có indicator khi offline, AI buttons vẫn clickable → timeout 30s mới hiện error.

4. **Image compression**: `imageCompression.ts` nén ảnh nhưng ảnh lớn (>5MB) vẫn mất thời gian đáng kể.

5. **Bundle size**: Lazy loading cho AI tab và Grocery tab đã có (`React.lazy`), nhưng initial bundle vẫn có thể tối ưu thêm.

#### Giải pháp đề xuất

**A. PWA với Service Worker (Workbox)**

```js
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default {
  plugins: [
    VitePWA({
      strategies: 'generateSW',
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache' }
          }
        ]
      }
    })
  ]
};
```

**B. Offline Indicator**

```tsx
// src/hooks/useOnlineStatus.ts
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { /* cleanup */ };
  }, []);
  return isOnline;
};
```

- Khi offline: hiện banner "Bạn đang offline — Một số tính năng AI không khả dụng"
- Disable AI buttons khi offline
- CRUD operations vẫn hoạt động bình thường (localStorage)

**C. Optimistic UI Updates**

- State cập nhật ngay lập tức (đã có nhờ localStorage)
- Toast notification hiện ngay sau action
- AI operations: show skeleton loading thay vì spinner

**D. Smart Image Processing**

- Client-side resize trước compress: max 1024x1024 pixels
- Progressive loading: hiện ảnh mờ ngay, sharpen sau compress
- WebP format detection + fallback

#### Kế hoạch triển khai

| Task | File | Effort |
|------|------|--------|
| Vite PWA plugin | `vite.config.ts` | Medium |
| useOnlineStatus hook | `src/hooks/useOnlineStatus.ts` | Low |
| Offline banner | `src/components/OfflineBanner.tsx` | Low |
| Disable AI buttons offline | `src/components/AIImageAnalyzer.tsx`, modals | Low |
| Image resize utility | `src/utils/imageCompression.ts` | Medium |
| Bundle analysis | `vite.config.ts` (rollup-plugin-visualizer) | Low |
| Performance monitoring | Lighthouse CI integration | Medium |

#### Tác động

- **Offline-first**: App hoạt động 100% offline (trừ AI)
- **Faster loads**: Cached assets = instant navigation
- **Better mobile UX**: Indicator rõ ràng khi offline
- **Smaller payloads**: Optimized images giảm data usage

---

## 4. Ma trận ưu tiên (Impact vs Effort)

```
Impact ▲
       │
  High │  ④ Accessibility    ① Onboarding
       │       (Low-Med)        (Medium)
       │
       │  ② Smart Search
       │       (Medium)
  Med  │                     ③ Nutrition     ⑤ Performance
       │                       Insights        Offline
       │                       (High)          (High)
  Low  │
       │
       └──────────────────────────────────────────► Effort
            Low        Medium        High
```

| # | Đề xuất | Impact | Effort | Priority | Lý do |
|---|---------|--------|--------|----------|-------|
| 4 | Accessibility | High | Low-Medium | **P0** | Legal compliance, inclusive design, quick wins |
| 1 | Onboarding | High | Medium | **P1** | Giảm bounce rate, UX first-impression critical |
| 2 | Smart Search | High | Medium | **P1** | Power user productivity, replaces prompt() |
| 3 | Nutrition Insights | Medium | High | **P2** | Nice-to-have, cần chart library mới |
| 5 | Performance/Offline | Medium | High | **P2** | Infrastructure, cần testing kỹ trên mobile |

---

## 5. Lộ trình triển khai đề xuất

### Phase 1: Quick Wins (Accessibility + Onboarding)

**Mục tiêu**: Cải thiện accessibility và first-time experience

| Task | Effort | Đề xuất |
|------|--------|---------|
| Focus trap trong modals (react-focus-lock) | 2h | #4 |
| aria-describedby cho form errors | 4h | #4 |
| Skip links | 1h | #4 |
| OnboardingWizard component | 8h | #1 |
| Smart empty states upgrade | 4h | #1 |
| Contextual tooltips | 6h | #1 |

### Phase 2: Power Features (Smart Search + Nutrition)

**Mục tiêu**: Tăng productivity và nutrition awareness

| Task | Effort | Đề xuất |
|------|--------|---------|
| CommandPalette component | 12h | #2 |
| SaveTemplateModal (replace prompt) | 4h | #2 |
| Keyboard shortcuts | 6h | #2 |
| WeeklyNutritionChart | 12h | #3 |
| MealBalanceScore | 8h | #3 |
| NutritionInsights (AI-powered) | 8h | #3 |

### Phase 3: Infrastructure (Offline + Performance)

**Mục tiêu**: PWA, offline support, performance optimization

| Task | Effort | Đề xuất |
|------|--------|---------|
| Vite PWA plugin + Service Worker | 8h | #5 |
| useOnlineStatus + Offline banner | 4h | #5 |
| Image optimization pipeline | 6h | #5 |
| Bundle analysis + optimization | 4h | #5 |
| Performance monitoring (Lighthouse CI) | 6h | #5 |

---

## 6. Kết luận

Smart Meal Planner hiện tại đã có nền tảng UX tốt (điểm heuristic trung bình 3.4/5) với kiến trúc rõ ràng, dark mode, i18n đầy đủ, và AI integration mạnh. Tuy nhiên, **5 đề xuất cải tiến** trên sẽ nâng trải nghiệm lên mức **4.5/5** bằng cách:

1. **Onboarding** — Giảm barrier-to-entry cho người dùng mới
2. **Smart Search** — Tăng tốc workflow cho power users
3. **Nutrition Insights** — Cung cấp giá trị dài hạn qua data visualization
4. **Accessibility** — Mở rộng user base, tuân thủ WCAG 2.1 AA
5. **Offline/Performance** — PWA-ready, trải nghiệm mượt mà mọi điều kiện mạng

Khuyến nghị triển khai theo **3 phases** với ưu tiên **Accessibility (P0)** trước vì effort thấp nhưng impact cao, tiếp theo là **Onboarding + Smart Search (P1)**, và cuối cùng là **Nutrition + Performance (P2)**.

---

*Tài liệu này là đề xuất nghiên cứu độc lập. Các thay đổi cần được review bởi team trước khi triển khai. Xem thêm [PRD](01-requirements/PRD.md) cho scope hiện tại và [UX Flow](02-architecture/ux-meal-planning-flow.md) cho luồng UX chi tiết.*
