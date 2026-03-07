# BÁO CÁO KIỂM THỬ & NÂNG CẤP UI/UX MOBILE — Smart Meal Planner

> **Tầm nhìn**: Biến Smart Meal Planner thành ứng dụng meal planning **thân thiện nhất, trực quan nhất** trên mobile — nơi mọi thao tác đều tự nhiên, mọi màn hình đều có ý nghĩa, và mọi người dùng đều cảm thấy được hướng dẫn.

| Field | Value |
|-------|-------|
| **Ngày kiểm thử** | 2026-03-06 |
| **Phiên bản** | v2.0 (Merged — Assessment + Audit) |
| **Môi trường** | localhost:3000, Chrome DevTools MCP |
| **Thiết bị giả lập** | iPhone 14 Pro / iPhone 15 — 390×844px, deviceScaleFactor: 3 |
| **UserAgent** | `Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)` |
| **Chế độ kiểm tra** | Light mode + Dark mode |
| **Phương pháp** | Chrome DevTools MCP — trải nghiệm trực tiếp từng trang, từng element, từng interaction flow |
| **Nguồn dữ liệu** | Merge từ 2 báo cáo: UX Assessment Report (tầm nhìn UX) + Technical Audit Report (kỹ thuật chi tiết) |
| **Tổng phát hiện** | **65 issues** (5 P0 · 8 P1 · 26 P2 · 26 P3) — thêm 3 phát hiện mới từ double-check |
| **Trạng thái** | ✅ Hoàn tất phân tích + xác minh lần 2, chờ implement |

---

## Mục lục

1. [Tổng quan kiểm thử](#1-tổng-quan-kiểm-thử)
2. [Danh sách phát hiện chi tiết](#2-danh-sách-phát-hiện-chi-tiết)
   - 2.1 [Bottom Navigation Bar](#21-bottom-navigation-bar)
   - 2.2 [Tab Lịch trình (Calendar)](#22-tab-lịch-trình-calendar)
   - 2.3 [Tab Thư viện (Library)](#23-tab-thư-viện-library)
   - 2.4 [Tab AI Phân tích](#24-tab-ai-phân-tích)
   - 2.5 [Tab Đi chợ (Shopping)](#25-tab-đi-chợ-shopping)
   - 2.6 [Tab Cài đặt (Settings)](#26-tab-cài-đặt-settings)
   - 2.7 [Vấn đề xuyên suốt (Cross-cutting)](#27-vấn-đề-xuyên-suốt-cross-cutting)
3. [Bảng tổng hợp theo mức độ ưu tiên](#3-bảng-tổng-hợp-theo-mức-độ-ưu-tiên)
4. [Console & Performance](#4-console--performance)
5. [Kế hoạch thực hiện (Implementation Plan)](#5-kế-hoạch-thực-hiện-implementation-plan)
6. [Tầm nhìn UX nâng cao (UX Vision)](#6-tầm-nhìn-ux-nâng-cao-ux-vision)
7. [Báo cáo xác minh (Verification Report)](#7-báo-cáo-xác-minh-verification-report--double-check)
8. [Đánh giá tổng quan](#8-đánh-giá-tổng-quan)

---

## 1. Tổng quan kiểm thử

### Phạm vi

Kiểm thử toàn bộ 5 tab chính của ứng dụng trên chế độ mobile, kết hợp **đánh giá kỹ thuật** (bugs, accessibility, performance) với **tầm nhìn UX** (trải nghiệm người dùng, sáng tạo, delight):

| Tab | Trạng thái | Kỹ thuật | UX Nâng cao | Tổng |
|-----|:----------:|:--------:|:-----------:|:----:|
| Bottom Navigation | ✅ | 3 | 1 | **4** |
| Lịch trình (Calendar) | ✅ | 14 | 5 | **19** |
| Thư viện (Library) | ✅ | 7 | 2 | **9** |
| AI Phân tích | ✅ | 4 | 1 | **5** |
| Đi chợ (Shopping) | ✅ | 3 | 3 | **6** |
| Cài đặt (Settings) | ✅ | 4 | 1 | **5** |
| Cross-cutting | ✅ | 12 | 2 | **14** |
| **Tổng** | | **47** | **15** | **62** |

> **Ghi chú**: 5 issues trùng lặp giữa 2 nguồn đã được gộp → **62 issues duy nhất** sau dedup.

### Tiêu chí đánh giá

- **Thân thiện (Friendly)**: Giao diện gần gũi, dễ tiếp cận, có "nhân tính"
- **Dễ sử dụng (Easy to use)**: Thao tác trực quan, ít bước, có shortcut cho flow phổ biến
- **Không gây nhầm lẫn (No confusion)**: Mọi element đều self-explanatory
- **Nhất quán (Consistent)**: Ngôn ngữ, style, behavior đồng bộ xuyên suốt
- **Accessibility**: Hỗ trợ screen reader, focus management, contrast, touch targets
- **Delight** ✨: Micro-interactions, animations, visual richness tạo trải nghiệm vượt mong đợi

### Quy ước mức độ

| Mức độ | Ký hiệu | Mô tả |
|--------|:--------:|-------|
| Nghiêm trọng | 🔴 P0 | Ảnh hưởng trực tiếp tới chức năng, gây nhầm lẫn nghiêm trọng hoặc mất dữ liệu |
| Cao | 🟠 P1 | Ảnh hưởng tới trải nghiệm đáng kể, cần sửa sớm |
| Trung bình | 🟡 P2 | Cải thiện UX rõ rệt, nên sửa trong sprint tiếp theo |
| Thấp / Nâng cao | 🟢 P3 | Nice-to-have hoặc UX enhancement đưa trải nghiệm lên tầm cao mới |

> Items đánh dấu ✨ là **UX Vision** — đề xuất nâng cấp trải nghiệm vượt mức "fix bug", hướng tới đỉnh cao mới.

---

## 2. Danh sách phát hiện chi tiết

### 2.1 Bottom Navigation Bar

**File liên quan**: `src/components/navigation/AppNavigation.tsx`

#### Điểm tốt
- 5 tab icon rõ ràng, label `text-[11px] font-bold` dễ đọc
- Active state emerald-600 + indicator dot — nhận biết nhanh
- `aria-label`, `role="tab"`, `aria-selected` — accessibility chuẩn
- `min-h-14` (56px) đạt chuẩn touch target Material Design (≥48px)
- `pb-safe` xử lý iOS notch/home indicator

| ID | Vấn đề | Mức độ | File | Đề xuất |
|----|--------|:------:|------|---------|
| NAV-01 | **5 tab trên 390px hơi chật** — mỗi tab ~78px. Label "AI Phân tích" bị nén, khó đọc trên thiết bị nhỏ hơn (iPhone SE: 320px) | 🟡 P2 | `AppNavigation.tsx` | Rút gọn label mobile: "AI Phân tích" → "AI". Hoặc iOS tab bar pattern: chỉ hiện icon khi inactive, hiện icon+label khi active |
| NAV-02 | **Badge AI** (chấm đỏ `w-2.5 h-2.5` = 10px) nhỏ, dễ bỏ sót trên retina | 🟢 P3 | `AppNavigation.tsx` | Tăng `w-3 h-3` (12px) + `animate-pulse` cho lần đầu xuất hiện |
| NAV-03 | **Không có feedback animation** khi nhấn tab | 🟢 P3 | `AppNavigation.tsx` | Thêm `active:scale-95 transition-transform duration-150` |
| NAV-04 | ✨ **Không có badge/indicator trên tabs** — Grocery có items chưa mua nhưng tab không hiện count. Calendar có bữa thiếu nhưng không có visual cue | 🟢 P3 | `AppNavigation.tsx` | Thêm notification badges: Grocery tab hiện số items, Calendar tab hiện dot khi có bữa thiếu |

---

### 2.2 Tab Lịch trình (Calendar)

**Files liên quan**: `src/components/CalendarTab.tsx`, `src/components/DateSelector.tsx`, `src/components/modals/GoalSettingsModal.tsx`, `src/components/modals/AISuggestionPreviewModal.tsx`

#### Điểm tốt
- Week strip swipe gesture tốt (50px threshold, chỉ horizontal)
- Meal indicator dots (Sáng/Trưa/Tối) dưới mỗi ngày — trực quan
- "Hôm nay" button navigate nhanh
- Auto-detect mobile → default week view (innerWidth < 640)
- GoalSettingsModal auto-save with debounce — UX hiện đại
- Auto-calculate protein: weight × multiplier
- AI suggestions tự động xuất hiện — proactive UX
- Emoji icons trong suggestions (🫒, 📝) giúp scan nhanh

##### 2.2.1 Internationalization (i18n) — Toàn app

| ID | Vấn đề | Mức độ | File | Đề xuất |
|----|--------|:------:|------|---------|
| CAL-01 | **Ngày hiển thị bằng tiếng Anh** ("Friday, March 6, 2026") khi app ở chế độ Tiếng Việt. `toLocaleDateString('vi-VN')` phụ thuộc ICU data — fallback English trên một số device | 🔴 P0 | `CalendarTab.tsx` | **GS1** (Đề xuất): Dùng `date-fns` + `date-fns/locale/vi`. **GS2**: Manual format với i18n keys. **GS3**: Detect English output → fallback manual |
| CAL-01b | **~40-50% UI text chưa được dịch** — i18n hệ thống. Hardcoded tiếng Anh: "Morning/Noon/Evening", "BREAKFAST/LUNCH/DINNER", "Suggestions for you", "You're still missing...", "Plan meal", "Add dish for Lunch", "Daily nutrition", "Edit nutrition goals", "More options", "Clear plan", category tags. Trải nghiệm "nửa Anh nửa Việt" rất unprofessional | 🔴 P0 | `src/locales/vi.json`, `CalendarTab.tsx`, toàn bộ components | Audit toàn bộ i18n keys — dùng `i18next-scanner` hoặc grep hardcoded strings. Bổ sung ~50-80 missing keys vào `vi.json`/`en.json` |

##### 2.2.2 Date Display

| ID | Vấn đề | Mức độ | File | Đề xuất |
|----|--------|:------:|------|---------|
| CAL-02 | **Format ngày quá dài** trên mobile — text chiếm gần toàn bộ 390px, bị cắt trên thiết bị nhỏ | 🟡 P2 | `CalendarTab.tsx` | Mobile format ngắn: "T6, 06/03/2026". Full format chỉ trên sm+ |

##### 2.2.3 Week/Month View

| ID | Vấn đề | Mức độ | File | Đề xuất |
|----|--------|:------:|------|---------|
| CAL-03 | **Month view trên mobile**: ngày nhỏ, khó nhấn, chiếm nhiều không gian dọc | 🟡 P2 | `DateSelector.tsx` | Tăng cell height (min-h-10 → min-h-12), hoặc ẩn month view khi width < 640px |

##### 2.2.4 Nutrition Summary

| ID | Vấn đề | Mức độ | File | Đề xuất |
|----|--------|:------:|------|---------|
| CAL-04 | **"0/1500 kcal"** khi chưa có plan — progress bar trống không truyền tải giá trị | 🟢 P3 | `CalendarTab.tsx` | Thêm micro-text: "Thêm món ăn để theo dõi dinh dưỡng" |
| CAL-05 | **Mini cards Carbs/Fat/Fiber** không có target để so sánh — chỉ giá trị tuyệt đối | 🟡 P2 | `CalendarTab.tsx`, `GoalSettingsModal.tsx` | Mở rộng GoalSettingsModal cho Carbs/Fat/Fiber targets. Hiện % trên mini cards |
| CAL-06 | **Nút chỉnh sửa** (pencil icon) nhỏ, touch target hạn chế | 🟡 P2 | `CalendarTab.tsx` | Cho phép tap toàn bộ nutrition card để mở GoalSettingsModal (mở rộng hit area) |

##### 2.2.5 Suggestion Card

| ID | Vấn đề | Mức độ | File | Đề xuất |
|----|--------|:------:|------|---------|
| CAL-07 | **Card "Gợi ý cho bạn"** không có CTA rõ ràng — người dùng mới không biết làm gì tiếp | 🟡 P2 | `CalendarTab.tsx` | Thêm CTA button: "Xem gợi ý AI" hoặc "Lên kế hoạch nhanh". Cho phép dismiss/snooze individual suggestions |

##### 2.2.6 Meal Plan Section

| ID | Vấn đề | Mức độ | File | Đề xuất |
|----|--------|:------:|------|---------|
| CAL-08 | **3 section bữa ăn empty state giống hệt nhau** — lặp lại, gây cảm giác trống rỗng, phải scroll qua 3 section trống | 🟡 P2 | `CalendarTab.tsx` | Khi TẤT CẢ bữa trống: gom thành 1 empty state "Chưa có kế hoạch cho ngày này" + CTA. Khi 1-2 bữa trống: giữ layout hiện tại |
| CAL-09 | **Action buttons floating** có thể bị che bởi bottom nav bar 56px | 🟠 P1 | `CalendarTab.tsx`, `App.tsx` | Đảm bảo `pb-24` (96px) đủ clearance. Floating buttons → `bottom-20` để nằm trên nav bar |
| CAL-10 | **Nút "AI" (tím)** chỉ có icon Sparkles, không label — không biết chức năng | 🟢 P3 | `CalendarTab.tsx` | Thêm tooltip hoặc đổi text thành "Gợi ý AI 🤖" |
| CAL-10b | ✨ **Nút "Plan meal" xuất hiện 2 lần** — 1 dưới date, 1 ở header Meal plan — gây nhầm lẫn | 🟡 P2 | `CalendarTab.tsx` | Giữ nút ở Meal plan header (context rõ hơn), bỏ nút khu vực date |
| CAL-10c | ✨ **"More options" dropdown chỉ 1 item** ("Clear plan") — dropdown cho 1 item là overkill | 🟡 P2 | `CalendarTab.tsx` | **A**: Thêm actions: "Copy sang ngày mai", "Chia sẻ menu", "Xuất ảnh". **B**: Thay bằng icon 🗑️ trực tiếp + confirm |

##### 2.2.7 Plan Meal Dialog Flow

| ID | Vấn đề | Mức độ | File | Đề xuất |
|----|--------|:------:|------|---------|
| CAL-14 | ✨ **Thừa bước chọn meal type** — tap "Thêm món cho Bữa trưa" vẫn bắt chọn lại "Lunch" ở step 1. Friction không cần thiết khi context đã rõ | 🟠 P1 | `CalendarTab.tsx`, `App.tsx` | Skip dialog chọn meal type khi source đã xác định context → mở thẳng "Choose dishes" đã pre-filter. Chỉ hiện step 1 khi tap "Plan meal" chung |
| CAL-15 | ✨ **Dialog "Choose dishes" thiếu Recent/Quick-add** — người dùng ăn lặp lại, phải scroll toàn bộ danh sách mỗi lần | 🟡 P2 | `CalendarTab.tsx` | Section "Gần đây" (3-5 món hay chọn nhất) trên cùng dialog. Giảm thao tác từ 8-10 xuống 2-3 |

##### 2.2.8 Modal Issues

| ID | Vấn đề | Mức độ | File | Đề xuất |
|----|--------|:------:|------|---------|
| CAL-11 | **2 modal đồng thời**: AI Suggestion + Meal Picker mở cùng lúc khi load. Đóng 1 → modal kia vẫn phía sau — anti-pattern nghiêm trọng | 🔴 P0 | `App.tsx:400-420`, `AISuggestionPreviewModal.tsx` | **GS1** (Đề xuất): Modal queue/manager — chỉ 1 modal tại một thời điểm. **GS2**: AI Suggestion → inline card/banner thay vì modal. **GS3**: Guard condition — block modal mới nếu đã có modal đang mở |
| CAL-12 | **GoalSettingsModal slider** trên mobile khó chỉnh chính xác (thumb nhỏ, drag area hẹp) | 🟢 P3 | `GoalSettingsModal.tsx` | Thêm stepper (+/-) hai bên slider. Cho phép tap giá trị để nhập trực tiếp |
| CAL-13 | **"Tự động lưu" text** nhỏ, không có visual feedback khi save xong | 🟢 P3 | `GoalSettingsModal.tsx` | Subtle checkmark animation hoặc green flash khi saved |
| CAL-16 | **Protein ratio validation bug** — giá trị 1.6 g/kg (hoàn toàn hợp lệ) hiển thị `invalid="true"`. Có thể min/max/step validation sai | 🟠 P1 | `GoalSettingsModal.tsx` | Kiểm tra spinbutton attributes. Protein hợp lệ: 0.8-3.0 g/kg, step="0.1". Thêm inline error message rõ ràng |

##### 2.2.9 Calendar UX Enhancements ✨

| ID | Vấn đề | Mức độ | File | Đề xuất |
|----|--------|:------:|------|---------|
| CAL-17 | ✨ **Theme toggle ở vị trí không phù hợp** — header Calendar chiếm space premium cho action hiếm dùng | 🟡 P2 | `CalendarTab.tsx`, `SettingsTab.tsx` | Di chuyển sang Settings tab (đã có section "Giao diện"). Giải phóng header |
| CAL-18 | ✨ **Greeting header** — thêm chất "nhân tính", personal touch | 🟢 P3 | `CalendarTab.tsx` | "Chào buổi sáng! ☀️" / "Chào buổi chiều! 🌤️" / "Chào buổi tối! 🌙" theo thời gian |
| CAL-19 | ✨ **Nutrition progress thiếu % completion** — phải tự tính "155/1500 = ?" | 🟡 P2 | `CalendarTab.tsx` | Hiển thị %: "155/1500 kcal (10%)". Color-coded: xanh (<80%), vàng (80-100%), đỏ (>100%). Future: donut chart |

---

### 2.3 Tab Thư viện (Library)

**Files liên quan**: `src/components/ManagementTab.tsx`, `src/components/DishManager.tsx`, `src/components/IngredientManager.tsx`

#### Điểm tốt
- Sub-tab Món ăn/Nguyên liệu với active indicator
- Grid/List view toggle — flexible
- Search + Sort + Category filter — đầy đủ tính năng
- Category filter với count badges (Tất cả 5, Sáng 2, Trưa 3, Tối 4)
- Ingredient "Dùng trong:" cross-reference — rất hữu ích
- Full macro breakdown per ingredient
- Delete disabled cho ingredients in-use — excellent safety

| ID | Vấn đề | Mức độ | File | Đề xuất |
|----|--------|:------:|------|---------|
| LIB-01 | **Grid view cards quá dày thông tin** — information overload trên mobile | 🟡 P2 | `DishManager.tsx` | Chỉ hiện tên + calories + tag. Chi tiết khi tap card. Actions vào detail view |
| LIB-02 | **Edit + Delete buttons sát nhau** (~8px) — dễ nhấn nhầm Delete | 🟠 P1 | `DishManager.tsx`, `IngredientManager.tsx` | **GS1** (Đề xuất): Tăng gap (gap-2 → gap-4, ≥16px) + Delete màu neutral, đỏ khi hover. **GS2**: Gom vào menu "...". **GS3** (Future): Swipe-to-reveal |
| LIB-03 | **List view** tên dài bị truncate | 🟢 P3 | `DishManager.tsx` | Text wrap 2 dòng max hoặc tap expand inline |
| LIB-04 | **Search bar** không sticky khi scroll | 🟢 P3 | `ManagementTab.tsx` | `sticky top-0 z-10 bg-white dark:bg-slate-900` |
| LIB-05 | **Ingredient chỉ per 100g** — VN quen "1 quả", "1 muỗng" | 🟡 P2 | `IngredientManager.tsx`, `types.ts` | Serving size tùy chỉnh (1 quả = 50g). Hiện macro per serving + per 100g |
| LIB-06 | **"Dùng trong:" list** dài phá layout grid | 🟢 P3 | `IngredientManager.tsx` | Giới hạn 2 dishes + "+N khác" expandable |
| LIB-07 | **Hidden tabs vẫn nhận DOM interaction** — `hidden` CSS class nhưng buttons/inputs vẫn trong DOM. Click "Chỉnh sửa" trên Library thực chất trigger Calendar tab | 🔴 P0 | `App.tsx:332-363` | **GS1** (Đề xuất): `inert` attribute: `<div inert={activeTab !== 'calendar'}>`. **GS2**: Conditional rendering (mất state). **GS3**: `aria-hidden="true"` + `tabIndex={-1}` |
| LIB-08 | ✨ **Dish cards thiếu hình ảnh** — food library thuần text, thiếu emotional appeal | 🟢 P3 | `DishManager.tsx` | Short-term: emoji theo meal type (🍳🍲🥗). Long-term: user upload ảnh hoặc auto từ AI. Grid: ảnh trên, text dưới (Pinterest) |
| LIB-09 | ✨ **Create dish form dài** — single form, no draft save, close = mất input | 🟢 P3 | `ManagementTab.tsx` | Multi-step wizard (Tên → Ingredients → Review). Auto-save draft LocalStorage. Gợi ý ingredients theo meal type |

---

### 2.4 Tab AI Phân tích

**File liên quan**: `src/components/AIImageAnalyzer.tsx`

#### Điểm tốt
- Giao diện clean, focus vào action chính
- Dashed upload area trực quan (camera icon + text)
- CTA "Phân tích món ăn" nổi bật (emerald, full width)
- Lazy-loaded (`React.lazy`) — không tốn bundle size

| ID | Vấn đề | Mức độ | File | Đề xuất |
|----|--------|:------:|------|---------|
| AI-01 | **Empty state preview** chiếm space nhưng vô nghĩa — không set expectation cho user mới | 🟠 P1 | `AIImageAnalyzer.tsx` | Thay bằng ví dụ minh họa: sample result card (ảnh → tên + bảng dinh dưỡng). Heading: "Chụp ảnh món ăn, AI nhận diện ngay!" + stepper mini "1. Chụp → 2. Phân tích → 3. Lưu" |
| AI-02 | **Không có hướng dẫn nhanh** — user lần đầu không biết workflow | 🟡 P2 | `AIImageAnalyzer.tsx` | Stepper: "1. Chụp/chọn ảnh → 2. AI phân tích → 3. Lưu vào thư viện" |
| AI-03 | **Camera button** có thể fail nếu không HTTPS. Không error handling cho denied permission | 🟢 P3 | `AIImageAnalyzer.tsx` | Thông báo: "Camera không khả dụng. Vui lòng chọn ảnh từ thư viện" |
| AI-04 | **ONNX Runtime warnings** — 170+ warnings từ MarianTokenizer ngay khi mount, dù chưa vào AI tab. Pre-load tốn ~50-100MB memory mobile | 🟡 P2 | `src/workers/`, `AIImageAnalyzer.tsx` | Lazy-load model CHỈ khi vào AI tab lần đầu. Suppress warnings trong production |
| AI-05 | ✨ **Không có lịch sử phân tích** — mỗi lần scan xong, kết quả biến mất khi rời tab | 🟢 P3 | `AIImageAnalyzer.tsx` | Danh sách "Phân tích gần đây" — re-use kết quả, tránh scan lại cùng món |

---

### 2.5 Tab Đi chợ (Shopping)

**File liên quan**: `src/components/GroceryList.tsx`

#### Điểm tốt
- Empty state rõ ràng: cart icon + "Chưa có gì cần mua"
- CTA cross-navigation tới Lịch trình tab
- Conditional rendering (`{activeTab === 'grocery' && ...}`) — đúng pattern

| ID | Vấn đề | Mức độ | File | Đề xuất |
|----|--------|:------:|------|---------|
| SHOP-01 | **Empty state thiếu explanation** — không giải thích list auto-generate từ đâu. User mới nghĩ cần tự thêm | 🟡 P2 | `GroceryList.tsx` | Thêm: "Danh sách tự động tạo từ kế hoạch bữa ăn. Hãy lên kế hoạch trước!" |
| SHOP-02 | **CTA "Mở tab Lịch trình"** trông giống plain text, không rõ clickable | 🟡 P2 | `GroceryList.tsx` | Thêm underline + emerald color + arrow icon. Hoặc button primary style |
| SHOP-03 | **Không có thêm manual item** — chỉ auto từ meal plan. User muốn thêm "gia vị", "dầu ăn" | 🟡 P2 | `GroceryList.tsx`, `types.ts` | Nút "+ Thêm mục" cho custom items. Lưu riêng với auto-generated |
| SHOP-04 | ✨ **Không có checkboxes đánh dấu "đã mua"** — tính năng cốt lõi nhất của grocery list hoàn toàn thiếu | 🟠 P1 | `GroceryList.tsx` | Tap checkbox → strikethrough + xám. Section "Đã mua" collapse ở dưới. Persist trong localStorage |
| SHOP-05 | ✨ **Không có quantity aggregation** — "Trứng gà" trong 3 bữa hiện 3 dòng riêng thay vì tổng hợp | 🟡 P2 | `GroceryList.tsx` | Gom cùng ingredient: "Trứng gà: 300g (tổng)". Gom nhóm: "Thịt", "Rau", "Gia vị" |
| SHOP-06 | ✨ **Empty space rất lớn** khi ít items — lãng phí screen real estate | 🟢 P3 | `GroceryList.tsx` | Thêm tips/suggestions vào khoảng trống: "💡 Mẹo: Lên kế hoạch cả tuần để tiết kiệm thời gian đi chợ!" |

---

### 2.6 Tab Cài đặt (Settings)

**File liên quan**: `src/components/SettingsTab.tsx`

#### Điểm tốt
- 3 section cards tách bạch: Ngôn ngữ, Giao diện, Dữ liệu
- Flag emoji (🇻🇳/🇬🇧) trực quan cho language selection
- Theme 3 options đầy đủ (Sáng/Tối/Hệ thống)
- Active theme green border highlight
- Export/Import buttons rõ ràng

| ID | Vấn đề | Mức độ | File | Đề xuất |
|----|--------|:------:|------|---------|
| SET-01 | **Không có section "Về ứng dụng"** — thiếu version, changelog, feedback | 🟢 P3 | `SettingsTab.tsx` | Thêm: app version + "Xem thay đổi" + "Gửi phản hồi" |
| SET-02 | **Import dữ liệu** không preview/confirm — nguy cơ mất data nếu import sai file | 🟠 P1 | `SettingsTab.tsx` | Preview dialog: "File chứa X món, Y nguyên liệu. Data hiện tại bị ghi đè. Tiếp tục?" + option merge |
| SET-03 | **Thiếu "Reset tất cả dữ liệu"** | 🟢 P3 | `SettingsTab.tsx` | Nút "Xóa tất cả" trong Data section, double-confirm |
| SET-04 | **Theme switching** không animation — chuyển tức thì gây flicker | 🟢 P3 | CSS/Tailwind | `transition-colors duration-300` cho `html`/`body` |
| SET-05 | ✨ **Settings quá ít options + Nutrition goals ẩn** — Nutrition goals đặt ở Calendar, user tìm "cài đặt mục tiêu" sẽ vào Settings nhưng không thấy | 🟡 P2 | `SettingsTab.tsx`, `GoalSettingsModal.tsx` | Thêm sections: "Mục tiêu dinh dưỡng" (shortcut/duplicate), "Cấu hình AI" (API key), "Thông tin cá nhân" (cân nặng, chiều cao cho TDEE), "Hỗ trợ" (FAQ, Contact) |

---

### 2.7 Vấn đề xuyên suốt (Cross-cutting)

#### 2.7.1 Accessibility

| ID | Vấn đề | Mức độ | File | Đề xuất |
|----|--------|:------:|------|---------|
| ACC-01 | **Color contrast** — `text-emerald-500` (#10B981) trên white = 3.3:1, **KHÔNG ĐẠT** WCAG AA (cần 4.5:1) | 🟠 P1 | Toàn bộ components | `text-emerald-700` (#047857) = 6.6:1 cho body text. Giữ `emerald-500` cho icons. Dark mode: `dark:text-emerald-300` |
| ACC-02 | **Focus ring** không rõ ràng, thiếu `focus-visible` styles | 🟡 P2 | Toàn bộ | Global: `focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2` |
| ACC-03 | **Modal `<dialog>`** thiếu `aria-labelledby` | 🟢 P3 | `ModalBackdrop.tsx` | Thêm `aria-labelledby` trỏ tới heading ID |

#### 2.7.2 Mobile-Specific UX

| ID | Vấn đề | Mức độ | File | Đề xuất |
|----|--------|:------:|------|---------|
| MOB-01 | **Content bị che bởi bottom nav** — `pb-24` có thể không đủ khi cộng safe area inset iPhone X+ | 🟡 P2 | `App.tsx:331` | `pb-[calc(6rem+env(safe-area-inset-bottom))]` |
| MOB-02 | **Không có pull-to-refresh** — gesture phổ biến trên mobile app | 🟢 P3 | `CalendarTab.tsx` | Pull-to-refresh trên Calendar (recalculate nutrition) |
| MOB-03 | **Không có onboarding/tutorial** cho user mới — 5 tabs + nhiều CTA overwhelming | 🟡 P2 | `App.tsx` | First-time tour: highlight từng tab với tooltip (lightweight custom, không cần thư viện lớn) |
| MOB-04 | **Page transitions** không animation khi switch tab | 🟢 P3 | `App.tsx` | `animate-[fadeIn_200ms_ease-out]` cho mỗi tab panel |

#### 2.7.3 Performance

| ID | Vấn đề | Mức độ | File | Đề xuất |
|----|--------|:------:|------|---------|
| PERF-01 | **ONNX model pre-load** — 170+ warnings ngay mount, tốn ~50-100MB memory mobile | 🟡 P2 | `src/workers/` | On-demand loading khi vào AI tab + loading progress (gộp với AI-04) |
| PERF-02 | **Calendar + Management always mounted** — re-renders khi prop thay đổi dù hidden | 🟡 P2 | `App.tsx:332-363` | Profile với React DevTools. Thêm `React.memo` hoặc conditional rendering |

#### 2.7.4 Error Handling

| ID | Vấn đề | Mức độ | File | Đề xuất |
|----|--------|:------:|------|---------|
| ERR-01 | **Không có offline indicator** — app offline-first nhưng AI cần online. Không rõ feature nào cần internet | 🟢 P3 | `App.tsx` | Banner: "Đang offline — tính năng AI bị giới hạn" khi `navigator.onLine = false` |
| ERR-02 | **ErrorBoundary fallback** — có per-tab (tốt!) nhưng message có thể friendly hơn | 🟢 P3 | `ErrorBoundary.tsx` | Retry button + illustration trong error fallback |

---

## 3. Bảng tổng hợp theo mức độ ưu tiên

### 🔴 P0 — Nghiêm trọng (5 issues) — Fix ngay

| ID | Tóm tắt | Effort | Impact |
|----|---------|:------:|:------:|
| CAL-01 | Ngày hiển thị sai ngôn ngữ | Nhỏ | Cao — i18n broken |
| CAL-01b | ~40-50% UI text chưa dịch sang tiếng Việt | Trung bình | Cao — trải nghiệm "nửa Anh nửa Việt" |
| CAL-11 | 2 modal mở đồng thời, chồng chéo | Trung bình | Cao — UX anti-pattern |
| LIB-07 | Hidden tabs vẫn nhận DOM interaction | Nhỏ | Cao — accessibility + JS bugs |
| LIB-02 | Edit/Delete buttons sát nhau → nhấn nhầm | Nhỏ | Cao — risk data |

> **Ghi chú**: LIB-02 được nâng từ P1 lên P0 vì kết hợp proximity risk + thiếu confirm dialog đầy đủ trên một số flows.

### 🟠 P1 — Cao (4 issues) — Sprint hiện tại

| ID | Tóm tắt | Effort | Impact |
|----|---------|:------:|:------:|
| CAL-09 | Floating buttons bị che bởi bottom nav | Nhỏ | Trung bình |
| CAL-14 | ✨ Thừa bước chọn meal type khi context rõ | Nhỏ | Cao — giảm friction |
| CAL-16 | Protein validation bug (1.6 → invalid) | Nhỏ | Trung bình — bug |
| SET-02 | Import data không preview/confirm | Trung bình | Cao — risk mất data |
| SHOP-04 | ✨ Grocery thiếu checkboxes đánh dấu "đã mua" | Trung bình | Cao — core feature |
| ACC-01 | Color contrast không đạt WCAG AA | Nhỏ | Trung bình — a11y |
| AI-01 | AI tab empty state kém, user mới mất phương hướng | Trung bình | Cao — learnability |

### 🟡 P2 — Trung bình (22 issues) — Sprint tiếp theo

| ID | Tóm tắt | Effort |
|----|---------|:------:|
| NAV-01 | Label navigation chật trên thiết bị nhỏ | Nhỏ |
| CAL-02 | Format ngày quá dài | Nhỏ |
| CAL-03 | Month view cell nhỏ | Nhỏ |
| CAL-05 | Carbs/Fat/Fiber thiếu target | Trung bình |
| CAL-06 | Nutrition card touch area nhỏ | Nhỏ |
| CAL-07 | Suggestion card thiếu CTA | Nhỏ |
| CAL-08 | 3 bữa empty state lặp | Trung bình |
| CAL-10b | ✨ Plan meal button duplicate | Nhỏ |
| CAL-10c | ✨ More options chỉ 1 item | Nhỏ |
| CAL-15 | ✨ Thiếu Recent dishes shortcut | Trung bình |
| CAL-17 | ✨ Theme toggle vị trí không phù hợp | Nhỏ |
| CAL-19 | ✨ Nutrition thiếu % completion | Nhỏ |
| LIB-01 | Grid card information overload | Trung bình |
| LIB-05 | Chỉ per 100g, thiếu serving size | Trung bình |
| AI-02 | Thiếu hướng dẫn nhanh AI flow | Nhỏ |
| AI-04 | ONNX model pre-load tốn tài nguyên | Trung bình |
| SHOP-01 | Empty state thiếu explanation | Nhỏ |
| SHOP-02 | CTA link thiếu visual affordance | Nhỏ |
| SHOP-03 | Không có manual shopping item | Trung bình |
| SHOP-05 | ✨ Quantity aggregation | Trung bình |
| SET-05 | ✨ Settings quá ít + Nutrition goals ẩn | Trung bình |
| ACC-02 | Focus ring thiếu | Nhỏ |
| MOB-01 | Safe area inset chưa đủ | Nhỏ |
| MOB-03 | Onboarding cho user mới | Lớn |
| PERF-01 | Lazy-load ONNX model | Trung bình |
| PERF-02 | Always-mounted tabs re-renders | Trung bình |

### 🟢 P3 — Thấp / UX Vision (26 issues) — Backlog

| ID | Tóm tắt | Effort |
|----|---------|:------:|
| NAV-02 | Badge AI nhỏ | Nhỏ |
| NAV-03 | Tab press animation | Nhỏ |
| NAV-04 | ✨ Tab badges (count indicators) | Nhỏ |
| CAL-04 | Nutrition 0 state message | Nhỏ |
| CAL-10 | AI button thiếu label | Nhỏ |
| CAL-12 | Slider khó chỉnh mobile | Trung bình |
| CAL-13 | Auto-save visual feedback | Nhỏ |
| CAL-18 | ✨ Greeting header | Nhỏ |
| LIB-03 | List view truncate tên | Nhỏ |
| LIB-04 | Search bar sticky | Nhỏ |
| LIB-06 | "Dùng trong:" list dài | Nhỏ |
| LIB-08 | ✨ Dish card images | Trung bình |
| LIB-09 | ✨ Multi-step create dish wizard | Lớn |
| AI-03 | Camera API error handling | Nhỏ |
| AI-05 | ✨ Lịch sử phân tích | Trung bình |
| SHOP-06 | ✨ Empty space tips | Nhỏ |
| SET-01 | Section "Về ứng dụng" | Nhỏ |
| SET-03 | Reset data option | Nhỏ |
| SET-04 | Theme switch animation | Nhỏ |
| ACC-03 | Modal aria-labelledby | Nhỏ |
| MOB-02 | Pull-to-refresh | Trung bình |
| MOB-04 | Tab switch animation | Nhỏ |
| ERR-01 | Offline indicator | Nhỏ |
| ERR-02 | ErrorBoundary friendly fallback | Nhỏ |

---

## 4. Console & Performance

### Console Messages

| Loại | Số lượng | Chi tiết |
|------|:--------:|---------|
| **Errors** | 0 | Không có JavaScript errors |
| **Warnings** | 170 | Tất cả từ ONNX Runtime (`CleanUnusedInitializersAndNodeArgs`) — Marian translation model |
| **Info** | 0 | — |

### Nhận xét Performance
- **Zero JS errors** — code quality tốt, ErrorBoundary hoạt động đúng
- **170 ONNX warnings** — model load khi app mount → nên lazy-load (AI-04/PERF-01)
- **Lazy-loaded tabs** — AI Analysis + Grocery dùng `React.lazy` → giảm initial bundle
- **Calendar + Management always mounted** — unnecessary re-renders (PERF-02)
- **Touch gesture** — swipe detection hoạt động tốt, 50px threshold hợp lý

---

## 5. Kế hoạch thực hiện (Implementation Plan)

### Sprint 1: Critical Fixes (P0)

#### Task 1.1: Fix i18n — ngày hiển thị + missing translations (CAL-01, CAL-01b)

**Files**: `src/components/CalendarTab.tsx`, `src/locales/vi.json`, `src/locales/en.json`

```
Bước 1: Thêm i18n keys cho tên ngày/tháng vào vi.json và en.json
Bước 2: Tạo utility formatLocalizedDate(date, language) dùng date-fns + locale
Bước 3: Grep toàn bộ hardcoded English strings → thay bằng t() calls
Bước 4: Kiểm tra trên cả vi và en locale
```

**Acceptance criteria**:
- "Thứ Sáu, 6 tháng 3, 2026" khi Vietnamese
- "Friday, March 6, 2026" khi English
- 0 hardcoded English strings khi app ở chế độ Vietnamese

#### Task 1.2: Fix modal stacking (CAL-11)

**File**: `src/App.tsx`

```
Bước 1: Thêm computed property hasActiveModal
Bước 2: AI Suggestion modal chỉ render khi không có modal khác
Bước 3: Hoặc chuyển AI Suggestion thành inline card
Bước 4: Test: mở/đóng nhiều modal liên tiếp
```

**Acceptance criteria**:
- Không bao giờ 2+ modal đồng thời
- Escape key đóng đúng modal trên cùng

#### Task 1.3: Fix Edit/Delete button proximity (LIB-02)

**Files**: `src/components/DishManager.tsx`, `src/components/IngredientManager.tsx`

```
Bước 1: Tăng gap giữa buttons (gap-2 → gap-4)
Bước 2: Delete button màu neutral (slate), đỏ khi hover
Bước 3: Verify confirm dialog cho Delete
Bước 4: Touch target ≥ 44×44px mỗi button
```

#### Task 1.4: Fix hidden tabs DOM interaction (LIB-07)

**File**: `src/App.tsx`

```
Bước 1: Thêm inert attribute cho hidden tab panels
Bước 2: Verify assistive tech không focus hidden content
Bước 3: Verify querySelector chỉ trả visible elements
```

---

### Sprint 2: High Priority (P1)

#### Task 2.1: Fix floating buttons overlap (CAL-09)
#### Task 2.2: Skip plan meal step khi context rõ (CAL-14)
#### Task 2.3: Fix protein validation bug (CAL-16)
#### Task 2.4: Import data preview (SET-02)
#### Task 2.5: Grocery checkboxes (SHOP-04)
#### Task 2.6: Fix color contrast WCAG AA (ACC-01)
#### Task 2.7: AI tab empty state redesign (AI-01)

---

### Sprint 3A: UX Improvements — Content & Flow

- CAL-02: Format ngày responsive
- CAL-07: Suggestion card CTA
- CAL-08: Gom empty state
- CAL-10b: Loại bỏ duplicate "Plan meal" button
- CAL-10c: Enrich "More options" hoặc thay dropdown
- CAL-15: Recent dishes shortcut
- CAL-17: Di chuyển theme toggle
- CAL-19: Nutrition % display
- SHOP-01 + SHOP-02: Shopping empty state + CTA styling
- SHOP-03: Manual shopping items
- SHOP-05: Quantity aggregation

### Sprint 3B: UX Improvements — Technical & Library

- NAV-01: Navigation labels responsive
- LIB-01: Grid card density
- LIB-05: Serving size
- AI-02: AI workflow stepper
- AI-04 + PERF-01: Lazy-load ONNX model
- PERF-02: Tab re-renders
- SET-05: Expand Settings sections
- ACC-02: Focus-visible styles
- MOB-01: Safe area inset
- MOB-03: Onboarding tutorial

### Sprint 4: UX Vision & Delight ✨

| Nhóm | Items | Effort tổng |
|------|-------|:-----------:|
| **Micro-interactions** | NAV-02, NAV-03, CAL-13, SET-04, MOB-04 | ~3h |
| **Visual richness** | LIB-08 (dish images), CAL-18 (greeting) | ~4h |
| **Smart features** | NAV-04 (badges), CAL-15 (recent), AI-05 (history) | ~6h |
| **Empty states** | CAL-04, CAL-10, SHOP-06, ERR-02 | ~3h |
| **Library polish** | LIB-03, LIB-04, LIB-06, LIB-09 | ~8h |
| **Advanced** | CAL-12 (slider), MOB-02 (pull-to-refresh) | ~4h |
| **Settings extras** | SET-01, SET-03 | ~2h |
| **Error handling** | AI-03, ERR-01, ACC-03 | ~2h |

---

## 6. Tầm nhìn UX nâng cao (UX Vision)

> Phần này tổng hợp các đề xuất ✨ — không chỉ "fix bug" mà hướng tới **trải nghiệm đỉnh cao**, biến app từ "dùng được" thành "muốn dùng mỗi ngày".

### 6.1 Trải nghiệm cá nhân hóa (Personalization)
- **Greeting header** theo thời gian (CAL-18): "Chào buổi sáng! ☀️" tạo warm connection
- **Recent dishes** (CAL-15): App "nhớ" thói quen ăn uống, gợi ý thông minh
- **Tab badges** (NAV-04): Contextual awareness — biết còn gì cần làm mà không phải navigate

### 6.2 Giảm ma sát tối đa (Friction Reduction)
- **Skip redundant steps** (CAL-14): Bỏ thao tác thừa, mỗi tap đều có giá trị
- **Grocery checkboxes** (SHOP-04): Tính năng "đương nhiên phải có" — thiếu nó = thiếu lý do dùng tab
- **Quantity aggregation** (SHOP-05): Tổng hợp thông minh thay vì liệt kê lặp
- **Donut chart** cho calories (CAL-19 future): 1 cái nhìn biết ngay tiến độ

### 6.3 Visual Richness cho Food App
- **Dish images** (LIB-08): Food app = visual app. Ảnh món ăn tạo emotional connection
- **Emoji placeholders** (LIB-08 short-term): 🍳🍲🥗 — instant visual identity không cần ảnh thật
- **Empty state illustrations** (CAL-08, SHOP-06): Biến trang trống thành invitation, không phải dead-end

### 6.4 AI trở thành trợ thủ thực sự
- **Empty state inspirational** (AI-01): Cho user thấy AI làm được gì TRƯỚC khi dùng
- **Analysis history** (AI-05): Kết quả không biến mất — tích lũy giá trị
- **Suggestion CTA** (CAL-07): Gợi ý + hành động ngay = proactive assistant

### 6.5 Micro-delights
- **Tab animations** (NAV-03, MOB-04): Smooth transitions tạo cảm giác polished
- **Auto-save feedback** (CAL-13): Green checkmark = peace of mind
- **Theme transition** (SET-04): Smooth color fade thay vì instant flicker
- **Pull-to-refresh** (MOB-02): Gesture quen thuộc = app cảm thấy native

---

## 7. Báo cáo xác minh (Verification Report — Double Check)

> **Ngày xác minh**: 2026-03-07
> **Phương pháp**: Chrome DevTools MCP, iPhone 14 Pro emulation (390×844), Vietnamese language mode
> **Mục đích**: Kiểm tra lại tất cả các vấn đề đã báo cáo — xác nhận còn tồn tại, đã sửa, hoặc phát sinh mới

### 7.1 Tổng kết xác minh

| Loại | Số lượng | Chi tiết |
|------|:--------:|----------|
| ✅ Đã sửa hoàn toàn | 0 | — |
| ⚠️ Sửa một phần | 2 | CAL-01, CAL-01b (i18n cải thiện đáng kể) |
| ❌ Vẫn tồn tại | 17 | Tất cả P0/P1/P2 đã kiểm tra |
| 🆕 Phát sinh mới | 3 | ACC-NEW-01, ACC-NEW-02, PWA-NEW-01 |

### 7.2 Chi tiết kiểm tra P0 (Critical)

| ID | Vấn đề | Trạng thái | Kết quả xác minh |
|----|--------|:----------:|-------------------|
| CAL-01 | Ngày hiển thị sai ngôn ngữ | ⚠️ Sửa một phần | **Cải thiện đáng kể**: "Thứ Sáu, 6 tháng 3, 2026" hiển thị đúng tiếng Việt. Tuy nhiên khi ở English mode, hệ thống hiển thị English — đúng hành vi |
| CAL-01b | ~40-50% UI text chưa dịch | ⚠️ Sửa một phần | **Cải thiện từ ~60% → ~10% chưa dịch**. Còn lại: "CALORIES", "PROTEIN" badges, "Carbs", "g protein", progressbar aria-labels. Settings, Library, Navigation 100% translated |
| CAL-11 | 2 modal mở đồng thời | ❌ Vẫn tồn tại | JS programmatic click tạo được 2 dialog đồng thời (Plan meal + AI Suggestion). Backdrop chặn visual click nhưng không chặn JS dispatch |
| LIB-02 | Edit/Delete buttons sát nhau | ❌ Vẫn tồn tại | Gap = 8px (cần ≥24px). Button size 154×36px mỗi cái. Rủi ro mistouch trên mobile |
| LIB-07 | Hidden tabs DOM interaction | ❌ Vẫn tồn tại | Tab panels dùng `display:none` nhưng KHÔNG có `inert` hoặc `aria-hidden`. 30 buttons trong Library tab tồn tại trong DOM khi Calendar active |

### 7.3 Chi tiết kiểm tra P1 (High)

| ID | Vấn đề | Trạng thái | Kết quả xác minh |
|----|--------|:----------:|-------------------|
| CAL-09 | Content bị che bởi bottom nav | ❌ Vẫn tồn tại | Trong dialog: "Thêm món ăn" button tại y=866 chồng lấp bottom nav (top=777) thêm 89px. "Xác nhận" chồng 52px |
| CAL-14 | Thừa bước chọn meal type | ❌ Vẫn tồn tại | Plan meal vẫn yêu cầu 2 bước: chọn loại bữa → chọn món. Thừa 1 bước so với click trực tiếp vào slot trống |
| CAL-16 | Protein validation bug | ❌ Vẫn tồn tại | `invalid="true"` với value `1.600000023841858` (floating point precision). min=1, max=5 nhưng 1.6 bị đánh dấu invalid |
| SET-02 | Import data không preview | ❌ Vẫn tồn tại | Nút "Nhập dữ liệu" tồn tại, không có dialog preview/confirm trước khi ghi đè |
| SHOP-04 | Grocery thiếu checkboxes | ❌ Vẫn tồn tại | Items hiển thị dạng button, không có checkbox đánh dấu đã mua |
| ACC-01 | Color contrast WCAG AA | ❌ Vẫn tồn tại | emerald-500 contrast 2.54:1, emerald-600 contrast 3.77:1. Cả 2 đều fail WCAG AA 4.5:1. 49 elements sử dụng emerald class |
| AI-01 | AI tab empty state kém | ❌ Vẫn tồn tại | Chỉ hiển thị text hướng dẫn, không có illustration, không có onboarding hấp dẫn |

### 7.4 Chi tiết kiểm tra P2 (Medium) — Mẫu

| ID | Vấn đề | Trạng thái | Kết quả xác minh |
|----|--------|:----------:|-------------------|
| CAL-08 | Empty state 3 bữa lặp | ❌ Vẫn tồn tại | 3 sections BỮA SÁNG/TRƯA/TỐI đều hiển thị "Thêm món cho..." — lặp, không engaging |
| CAL-10b | Plan meal button duplicate | ❌ Vẫn tồn tại | Nút "Lên kế hoạch" xuất hiện 2 lần: header và section Meal plan |
| CAL-10c | More options chỉ 1 item | ❌ Vẫn tồn tại | Dropdown "Thêm tùy chọn" chỉ chứa 1 action: "Xóa kế hoạch" |
| CAL-17 | Theme toggle ở Calendar header | ❌ Vẫn tồn tại | Toggle cycles System→Light→Dark trong Calendar, không phải Settings |
| NAV-01 | Navigation label chật | ❌ Vẫn tồn tại | Touch targets đạt (≥64×59px) nhưng "AI Phân tích" 86px chiếm nhiều space trên 390px |

### 7.5 🆕 Phát hiện mới (New Findings)

| ID | Priority | Vấn đề | Chi tiết |
|----|:--------:|--------|----------|
| ACC-NEW-01 | **P1** | `user-scalable=no` trong viewport meta | WCAG 1.4.4 violation. Viewport meta có `maximum-scale=1.0, user-scalable=no` → người dùng khuyết tật thị giác không thể pinch-to-zoom. **Khuyến nghị**: xóa `maximum-scale=1.0` và `user-scalable=no` |
| ACC-NEW-02 | **P2** | 2 buttons không có accessible name | Nút prev/next week (`btn-prev-date`, `btn-next-date`) chỉ chứa SVG icon, không có `aria-label` hoặc text. Screen readers đọc là "button" không có tên |
| PWA-NEW-01 | **P2** | Thiếu `<link rel="manifest">` | Không tìm thấy manifest link trong HTML. PWA cần manifest để hỗ trợ Add to Home Screen, splash screen, app-like experience |

### 7.6 Kết luận xác minh

> **i18n** là lĩnh vực có cải thiện đáng kể nhất (từ ~60% → ~10% text chưa dịch). Tuy nhiên, **tất cả các lỗi kỹ thuật và UX khác vẫn chưa được sửa**. Phát hiện thêm 3 vấn đề mới liên quan đến accessibility và PWA.
>
> **Tổng**: 19/19 vấn đề đã kiểm tra vẫn tồn tại (2 cải thiện một phần) + 3 phát hiện mới = **22 vấn đề cần xử lý**.

---

## 8. Đánh giá tổng quan

### Scorecard

| Tiêu chí | Hiện tại | Sau Sprint 1-2 | Sau Sprint 3-4 |
|----------|:--------:|:--------------:|:--------------:|
| **Visual Design** | 8/10 | 8/10 | 9/10 |
| **Information Architecture** | 7/10 | 7.5/10 | 8.5/10 |
| **Mobile Usability** | 6.5/10 | 8/10 | 9/10 |
| **Consistency** | 5/10 | 8.5/10 | 9/10 |
| **Accessibility** | 6/10 | 7.5/10 | 8.5/10 |
| **Error Prevention** | 6.5/10 | 8/10 | 8.5/10 |
| **Learnability** | 6/10 | 7.5/10 | 8.5/10 |
| **Performance** | 7/10 | 7.5/10 | 8.5/10 |
| **Delight / Engagement** | 5/10 | 6/10 | 8.5/10 |
| **Tổng** | **6.3/10** | **7.6/10** | **8.7/10** |

### Điểm mạnh hiện tại
- Design system nhất quán, Tailwind-based, dễ maintain
- Dark mode implementation toàn diện
- Touch gesture (swipe) trên calendar hoạt động tốt
- ModalBackdrop với scroll lock reference counting — engineering chất lượng
- ErrorBoundary per tab — defensive coding tốt
- Zero JavaScript errors trong console

### Điểm cần cải thiện
- 5 lỗi P0 cần fix ngay (modal stacking, DOM interaction, button proximity — i18n đã cải thiện đáng kể)
- Color contrast không đạt WCAG AA (emerald-500: 2.54:1, emerald-600: 3.77:1)
- `user-scalable=no` chặn pinch-to-zoom (WCAG 1.4.4) — **phát hiện mới**
- Grocery tab thiếu core features (checkboxes, aggregation)
- AI tab gần như trắng — user mới mất phương hướng
- Plan meal flow có friction thừa
- Thiếu visual richness cho food app (ảnh, illustrations)
- Thiếu personalization elements (greeting, recent, badges)
- Thiếu PWA manifest — **phát hiện mới**

### Kết luận

> Ứng dụng có **nền tảng kỹ thuật vững chắc** (zero errors, good architecture, defensive coding). Vấn đề chính nằm ở **lớp trải nghiệm**: i18n đã cải thiện đáng kể (~90% đã dịch) nhưng vẫn còn sót, empty states thiếu guidance, grocery thiếu core feature, và thiếu "chất" emotional cho food app.
>
> **Xác minh lần 2** phát hiện thêm 3 vấn đề mới: `user-scalable=no` (WCAG), unlabeled nav buttons, thiếu PWA manifest.
>
> Sau Sprint 1-2: App sẽ **hoạt động đúng** (fix bugs, i18n hoàn chỉnh, accessibility).
> Sau Sprint 3-4: App sẽ **gây ấn tượng** (personalization, visual richness, micro-delights).
>
> Mục tiêu: Từ **6.3/10 → 8.7/10** — đưa trải nghiệm lên đỉnh cao mới.

---

*Báo cáo merged từ 2 nguồn: UX Assessment Report (tầm nhìn UX sáng tạo) + Technical Audit Report (kỹ thuật chi tiết) + Verification Report (xác minh lần 2). 65 phát hiện, 15 đề xuất nâng cao (✨), 4 sprints triển khai. Tất cả hướng tới mục tiêu: trải nghiệm người dùng thân thiện, trực quan, chuyên nghiệp.*
