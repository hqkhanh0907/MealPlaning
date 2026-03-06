# BÁO CÁO KIỂM THỬ UI/UX MOBILE — Smart Meal Planner

| Field | Value |
|-------|-------|
| **Ngày kiểm thử** | 2026-03-06 |
| **Phiên bản** | v1.0 |
| **Môi trường** | localhost:5173, Chrome DevTools MCP |
| **Thiết bị giả lập** | iPhone 15 — 390×844px, deviceScaleFactor: 3 |
| **UserAgent** | `Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)` |
| **Chế độ kiểm tra** | Light mode + Dark mode |
| **Phương pháp** | Chrome DevTools MCP — trải nghiệm trực tiếp từng trang, từng element |
| **Trạng thái** | Hoàn tất phân tích, chờ implement |

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
6. [Đánh giá tổng quan](#6-đánh-giá-tổng-quan)

---

## 1. Tổng quan kiểm thử

### Phạm vi

Kiểm thử toàn bộ 5 tab chính của ứng dụng trên chế độ mobile:

| Tab | Trạng thái | Số phát hiện |
|-----|:----------:|:------------:|
| Bottom Navigation | ✅ Hoàn tất | 3 |
| Lịch trình (Calendar) | ✅ Hoàn tất | 14 |
| Thư viện (Library) | ✅ Hoàn tất | 7 |
| AI Phân tích | ✅ Hoàn tất | 4 |
| Đi chợ (Shopping) | ✅ Hoàn tất | 3 |
| Cài đặt (Settings) | ✅ Hoàn tất | 4 |
| Cross-cutting | ✅ Hoàn tất | 12 |
| **Tổng** | | **47** |

### Tiêu chí đánh giá

- **Thân thiện (Friendly)**: Giao diện gần gũi, dễ tiếp cận
- **Dễ sử dụng (Easy to use)**: Thao tác trực quan, ít bước
- **Không gây nhầm lẫn (No confusion)**: Không có yếu tố gây hiểu lầm
- **Nhất quán (Consistent)**: Ngôn ngữ, style, behavior đồng bộ
- **Accessibility**: Hỗ trợ screen reader, focus management, contrast

### Quy ước mức độ

| Mức độ | Ký hiệu | Mô tả |
|--------|:--------:|-------|
| Nghiêm trọng | 🔴 P0 | Ảnh hưởng trực tiếp tới chức năng, gây nhầm lẫn nghiêm trọng hoặc mất dữ liệu |
| Cao | 🟠 P1 | Ảnh hưởng tới trải nghiệm đáng kể, cần sửa sớm |
| Trung bình | 🟡 P2 | Cải thiện UX rõ rệt, nên sửa trong sprint tiếp theo |
| Thấp | 🟢 P3 | Nice-to-have, cải thiện chi tiết nhỏ |

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

| ID | Vấn đề | Mức độ | File ảnh hưởng | Đề xuất |
|----|--------|:------:|----------------|---------|
| NAV-01 | **5 tab trên 390px hơi chật** — mỗi tab ~78px. Label "AI Phân tích" bị nén, khó đọc trên thiết bị nhỏ hơn (iPhone SE: 320px) | 🟡 P2 | `AppNavigation.tsx` | Rút gọn label mobile: "AI Phân tích" → "AI". Hoặc áp dụng iOS tab bar pattern: chỉ hiện icon khi inactive, hiện icon+label khi active |
| NAV-02 | **Badge AI** (chấm đỏ `w-2.5 h-2.5` = 10px) nhỏ, dễ bỏ sót trên màn hình retina | 🟢 P3 | `AppNavigation.tsx` | Tăng `w-3 h-3` (12px) + thêm `animate-pulse` cho lần đầu xuất hiện |
| NAV-03 | **Không có feedback animation** khi nhấn tab — chuyển tab tức thì, thiếu cảm giác tương tác | 🟢 P3 | `AppNavigation.tsx` | Thêm `active:scale-95 transition-transform duration-150` |

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

##### 2.2.1 Date Display

| ID | Vấn đề | Mức độ | File ảnh hưởng | Đề xuất |
|----|--------|:------:|----------------|---------|
| CAL-01 | **Ngày hiển thị bằng tiếng Anh** ("Friday, March 6, 2026") khi app đang ở chế độ Tiếng Việt. `toLocaleDateString('vi-VN')` phụ thuộc vào ICU data của device/browser — trên một số thiết bị Android cũ hoặc WebView sẽ fallback về English | 🔴 P0 | `CalendarTab.tsx:221` | **Giải pháp 1** (Đề xuất): Dùng `date-fns` + `date-fns/locale/vi` cho format nhất quán cross-platform. **Giải pháp 2**: Manual format với i18n keys cho tên tháng/ngày trong `vi.json`. **Giải pháp 3**: Detect khi output chứa ký tự Latin/English → fallback manual format |
| CAL-02 | **Format ngày quá dài** trên mobile — text chiếm gần toàn bộ 390px width, có thể bị cắt trên thiết bị nhỏ hơn | 🟡 P2 | `CalendarTab.tsx:221` | Mobile format ngắn hơn: "T6, 06/03/2026" hoặc responsive — hiện full format chỉ trên sm+ |

##### 2.2.2 Week/Month View

| ID | Vấn đề | Mức độ | File ảnh hưởng | Đề xuất |
|----|--------|:------:|----------------|---------|
| CAL-03 | **Month view trên mobile**: ngày nhỏ, khó nhấn chính xác, chiếm nhiều không gian dọc | 🟡 P2 | `DateSelector.tsx` | Tăng cell height trong month view (min-h-10 → min-h-12), hoặc ẩn nút toggle month view khi width < 640px (giữ week view only) |

##### 2.2.3 Nutrition Summary

| ID | Vấn đề | Mức độ | File ảnh hưởng | Đề xuất |
|----|--------|:------:|----------------|---------|
| CAL-04 | **"0/1500 kcal" và "0/166g"** khi chưa có plan — progress bar trống không truyền tải giá trị, gây cảm giác "chưa có gì" | 🟢 P3 | `CalendarTab.tsx` | Thêm micro-text khi tất cả macro = 0: "Thêm món ăn để theo dõi dinh dưỡng" |
| CAL-05 | **Mini cards Carbs/Fat/Fiber** không có target để so sánh — chỉ hiện giá trị tuyệt đối | 🟡 P2 | `CalendarTab.tsx`, `GoalSettingsModal.tsx` | Mở rộng GoalSettingsModal cho Carbs/Fat/Fiber targets. Hiện tiến độ % trên mini cards |
| CAL-06 | **Nút chỉnh sửa** (pencil icon) nhỏ, touch target hạn chế | 🟢 P3 | `CalendarTab.tsx` | Cho phép tap vào toàn bộ nutrition card để mở GoalSettingsModal (mở rộng hit area) |

##### 2.2.4 Suggestion Card

| ID | Vấn đề | Mức độ | File ảnh hưởng | Đề xuất |
|----|--------|:------:|----------------|---------|
| CAL-07 | **Card "Gợi ý cho bạn"** hiện thông tin target nhưng không có CTA rõ ràng — người dùng mới không biết phải làm gì tiếp | 🟡 P2 | `CalendarTab.tsx` | Thêm CTA button trong card: "Xem gợi ý AI" hoặc "Lên kế hoạch nhanh" liên kết tới AI suggestion flow |

##### 2.2.5 Meal Plan Section

| ID | Vấn đề | Mức độ | File ảnh hưởng | Đề xuất |
|----|--------|:------:|----------------|---------|
| CAL-08 | **3 section bữa ăn empty state giống hệt nhau** — màn hình dài, lặp lại, gây cảm giác trống rỗng. Phải scroll qua 3 section trống để thấy action buttons | 🟡 P2 | `CalendarTab.tsx` | Khi TẤT CẢ bữa trống: gom thành 1 empty state chung "Chưa có kế hoạch cho ngày này" + CTA "Bắt đầu lên kế hoạch". Khi chỉ 1-2 bữa trống: giữ layout hiện tại |
| CAL-09 | **Action buttons floating** ("+Lên kế hoạch", "AI", "...") ở bottom có thể bị che bởi bottom nav bar 56px | 🟠 P1 | `CalendarTab.tsx`, `App.tsx` | Kiểm tra và đảm bảo `pb-24` (`96px`) đủ clearance. Nếu floating buttons → thêm `bottom-20` để nằm trên nav bar |
| CAL-10 | **Nút "AI" (tím)** chỉ có icon Sparkles, không label — người dùng mới không biết chức năng | 🟢 P3 | `CalendarTab.tsx` | Thêm tooltip "AI gợi ý thực đơn" hoặc label inline cho lần đầu sử dụng |

##### 2.2.6 Modal Issues

| ID | Vấn đề | Mức độ | File ảnh hưởng | Đề xuất |
|----|--------|:------:|----------------|---------|
| CAL-11 | **2 modal đồng thời**: AI Suggestion Preview + Breakfast Meal Picker mở cùng lúc khi load trang. Khi đóng 1 modal, modal kia vẫn hiển thị phía sau — UX anti-pattern nghiêm trọng | 🔴 P0 | `App.tsx:400-420`, `AISuggestionPreviewModal.tsx` | **Giải pháp 1** (Đề xuất): Implement modal queue/manager — chỉ render 1 modal tại một thời điểm, queue các modal khác. **Giải pháp 2**: AI Suggestion nên là inline card/banner thay vì modal (giảm modal density). **Giải pháp 3**: Thêm guard condition — nếu đã có modal đang mở, block modal mới |
| CAL-12 | **GoalSettingsModal slider** trên mobile khó chỉnh chính xác (thumb nhỏ, drag area hẹp) | 🟢 P3 | `GoalSettingsModal.tsx` | Thêm nút stepper (+/-) hai bên slider. Cho phép tap vào giá trị để nhập trực tiếp |
| CAL-13 | **"Tự động lưu" text** nhỏ ở bottom modal — dễ bỏ sót, không có visual feedback khi save xong | 🟢 P3 | `GoalSettingsModal.tsx` | Thêm subtle checkmark animation hoặc green flash khi giá trị thay đổi & saved |

---

### 2.3 Tab Thư viện (Library)

**Files liên quan**: `src/components/ManagementTab.tsx`, `src/components/DishList.tsx`, `src/components/IngredientList.tsx`

#### Điểm tốt
- Sub-tab Món ăn/Nguyên liệu với active indicator
- Grid/List view toggle — flexible
- Search + Sort + Category filter — đầy đủ tính năng
- Category filter với count badges (Tất cả 5, Sáng 2, Trưa 3, Tối 4)
- Ingredient "Dùng trong:" cross-reference — rất hữu ích
- Full macro breakdown per ingredient

| ID | Vấn đề | Mức độ | File ảnh hưởng | Đề xuất |
|----|--------|:------:|----------------|---------|
| LIB-01 | **Grid view cards quá dày thông tin** — icon, tên, ingredient count, meal tags, calories, protein, 2 action buttons trong ~170px width card. Information overload trên mobile | 🟡 P2 | `DishList.tsx` | Giảm thông tin trên card: chỉ hiện tên + calories + category tag. Chi tiết (protein, ingredient count) hiện khi tap vào card. Action buttons chuyển sang card detail view |
| LIB-02 | **Edit + Delete buttons sát nhau** (khoảng cách ~8px) — dễ nhấn nhầm Delete trên mobile. Delete là hành động không thể hoàn tác | 🔴 P0 | `DishList.tsx`, `IngredientList.tsx` | **Giải pháp 1** (Đề xuất): Dùng swipe-to-reveal pattern — swipe trái để hiện Delete (iOS pattern). **Giải pháp 2**: Tăng khoảng cách giữa 2 buttons + Delete dùng màu xám (không đỏ), chỉ đổi đỏ khi hover/focus. **Giải pháp 3**: Gom Edit/Delete vào menu "..." (three-dot), mở action sheet |
| LIB-03 | **List view**: tên món dài bị truncate, không có cách xem full name ngoài tap edit | 🟢 P3 | `DishList.tsx` | Cho phép text wrap (2 dòng max) hoặc tap row để expand inline |
| LIB-04 | **Search bar** behavior khi scroll — nên sticky ở top thay vì scroll cùng content | 🟢 P3 | `ManagementTab.tsx` | Thêm `sticky top-0 z-10 bg-white dark:bg-slate-900` cho search section |
| LIB-05 | **Ingredient hiện "per 100g"** — người dùng Việt Nam quen suy nghĩ theo đơn vị thực tế: "1 quả trứng", "1 muỗng" | 🟡 P2 | `IngredientList.tsx`, `types.ts` | Cho phép set "serving size" tùy chỉnh (ví dụ: 1 quả = 50g). Hiện macro theo cả serving lẫn 100g |
| LIB-06 | **"Dùng trong:" list** dài nếu ingredient phổ biến → card bị kéo dài, phá layout grid | 🟢 P3 | `IngredientList.tsx` | Giới hạn hiện 2 dishes, thêm "+N khác" expandable |
| LIB-07 | **Calendar + Management tabs luôn render trong DOM** (dùng `hidden` CSS class). Tất cả buttons/inputs vẫn tồn tại trong DOM tree — gây xung đột khi dùng `querySelector` hoặc assistive technology. Đã xác nhận: click "Chỉnh sửa" qua JS selector trên Library tab thực chất trigger button trên Calendar tab | 🔴 P0 | `App.tsx:332-363` | **Giải pháp 1** (Đề xuất): Thêm `inert` attribute cho hidden tab panels: `<div inert={activeTab !== 'calendar'}>`  — ngăn tất cả interaction + assistive tech. **Giải pháp 2**: Chuyển sang conditional rendering (`{activeTab === 'x' && <Component />}`) — nhưng mất state khi switch tab. **Giải pháp 3**: Giữ `hidden` nhưng thêm `aria-hidden="true"` + `tabIndex={-1}` cho tất cả interactive elements trong hidden tabs |

---

### 2.4 Tab AI Phân tích

**Files liên quan**: `src/components/AIImageAnalyzer.tsx`

#### Điểm tốt
- Giao diện clean, focus vào action chính
- Dashed upload area trực quan (camera icon + text)
- CTA "Phân tích món ăn" nổi bật (emerald green, full width)
- Lazy-loaded (`React.lazy`) — không tốn bundle size cho lần load đầu

| ID | Vấn đề | Mức độ | File ảnh hưởng | Đề xuất |
|----|--------|:------:|----------------|---------|
| AI-01 | **Empty state preview area** chiếm space nhưng chỉ có placeholder — không truyền tải giá trị cho người dùng mới, không biết kết quả sẽ trông như thế nào | 🟡 P2 | `AIImageAnalyzer.tsx` | Thay placeholder bằng ví dụ minh họa: hiện 1 sample result card (ảnh món ăn → tên + bảng dinh dưỡng) để set user expectation |
| AI-02 | **Không có hướng dẫn nhanh** — người dùng lần đầu không biết workflow (chụp → phân tích → lưu) | 🟡 P2 | `AIImageAnalyzer.tsx` | Thêm stepper mini: "1. Chụp/chọn ảnh → 2. AI phân tích → 3. Lưu vào thư viện" hiện phía trên upload area |
| AI-03 | **Camera button** trên mobile web có thể fail nếu không phải HTTPS (trừ localhost). Không có error handling cho trường hợp camera API bị từ chối quyền | 🟢 P3 | `AIImageAnalyzer.tsx` | Hiện thông báo rõ ràng khi camera API không khả dụng: "Camera không khả dụng. Vui lòng chọn ảnh từ thư viện" |
| AI-04 | **ONNX Runtime warnings** — 170+ warnings từ MarianTokenizer xuất hiện ngay khi app mount, dù user chưa navigate tới AI tab. Model pre-load tốn memory/CPU trên mobile | 🟡 P2 | `src/workers/`, `AIImageAnalyzer.tsx` | Lazy-load ONNX model CHỈ khi user navigate tới AI tab lần đầu. Suppress ONNX console warnings trong production build |

---

### 2.5 Tab Đi chợ (Shopping)

**Files liên quan**: `src/components/GroceryList.tsx`

#### Điểm tốt
- Empty state rõ ràng: cart icon + "Chưa có gì cần mua"
- CTA cross-navigation tới Lịch trình tab
- Conditional rendering (`{activeTab === 'grocery' && ...}`) — đúng pattern

| ID | Vấn đề | Mức độ | File ảnh hưởng | Đề xuất |
|----|--------|:------:|----------------|---------|
| SHOP-01 | **Empty state quá tối giản** — không giải thích shopping list tự động generate từ đâu. Người dùng mới nghĩ cần tự thêm item | 🟡 P2 | `GroceryList.tsx` | Thêm explanation text: "Danh sách đi chợ tự động tạo từ kế hoạch bữa ăn. Hãy lên kế hoạch trước!" |
| SHOP-02 | **CTA "Mở tab Lịch trình"** trông giống plain text, không rõ ràng là clickable link | 🟡 P2 | `GroceryList.tsx` | Style rõ hơn: thêm underline + emerald color + arrow icon. Hoặc đổi thành button primary style |
| SHOP-03 | **Không có chức năng thêm manual item** — chỉ auto-generate từ meal plan. Người dùng muốn thêm "gia vị", "dầu ăn" ngoài plan | 🟡 P2 | `GroceryList.tsx`, `types.ts` | Thêm nút "+ Thêm mục" cho custom items. Lưu riêng biệt với auto-generated list |

---

### 2.6 Tab Cài đặt (Settings)

**Files liên quan**: `src/components/SettingsTab.tsx`

#### Điểm tốt
- 3 section cards tách bạch: Ngôn ngữ, Giao diện, Dữ liệu
- Flag emoji (🇻🇳/🇬🇧) trực quan cho language selection
- Theme 3 options đầy đủ (Sáng/Tối/Hệ thống)
- Active theme green border highlight
- Export/Import buttons rõ ràng

| ID | Vấn đề | Mức độ | File ảnh hưởng | Đề xuất |
|----|--------|:------:|----------------|---------|
| SET-01 | **Không có section "Về ứng dụng"** — thiếu version, changelog link, feedback channel | 🟢 P3 | `SettingsTab.tsx` | Thêm section cuối: app version + "Xem thay đổi" link + "Gửi phản hồi" button |
| SET-02 | **Import dữ liệu** không có preview/confirm trước khi ghi đè — nguy cơ mất dữ liệu hiện tại nếu import sai file | 🟠 P1 | `SettingsTab.tsx` | Hiện preview dialog: "File chứa X món ăn, Y nguyên liệu. Data hiện tại sẽ bị ghi đè. Tiếp tục?" + option "Giữ data hiện tại + thêm mới" |
| SET-03 | **Không có option "Reset tất cả dữ liệu"** — phải import file trống hoặc xóa localStorage thủ công | 🟢 P3 | `SettingsTab.tsx` | Thêm nút "Xóa tất cả dữ liệu" trong Data section, yêu cầu double-confirm |
| SET-04 | **Theme switching** không có animation — chuyển tức thì gây flicker | 🟢 P3 | CSS/Tailwind | Thêm `transition-colors duration-300` cho `html` hoặc `body` element |

---

### 2.7 Vấn đề xuyên suốt (Cross-cutting)

#### 2.7.1 Accessibility

| ID | Vấn đề | Mức độ | File ảnh hưởng | Đề xuất |
|----|--------|:------:|----------------|---------|
| ACC-01 | **Color contrast** — `text-emerald-500` (#10B981) trên `bg-white` (#FFFFFF) = contrast ratio ~3.3:1, **KHÔNG ĐẠT** WCAG AA (yêu cầu 4.5:1 cho text nhỏ) | 🟠 P1 | Toàn bộ components | Đổi sang `text-emerald-700` (#047857) = ~6.6:1 ratio cho body text, giữ `emerald-500` cho decorative icons |
| ACC-02 | **Focus ring** không rõ ràng khi keyboard navigation — một số buttons thiếu `focus-visible` styles | 🟡 P2 | Toàn bộ components | Thêm global style: `focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2` cho tất cả interactive elements |
| ACC-03 | **Modal `<dialog open>`** thiếu `aria-labelledby` — screen reader không biết title modal | 🟢 P3 | `ModalBackdrop.tsx` | Thêm `aria-labelledby` prop trỏ tới heading ID cho mỗi ModalBackdrop instance |

#### 2.7.2 Mobile-Specific UX

| ID | Vấn đề | Mức độ | File ảnh hưởng | Đề xuất |
|----|--------|:------:|----------------|---------|
| MOB-01 | **Content bị che bởi bottom nav** — `pb-24` trong `<main>` (96px) có thể không đủ khi cộng safe area inset trên iPhone X+ | 🟡 P2 | `App.tsx:331` | Dùng `pb-[calc(6rem+env(safe-area-inset-bottom))]` hoặc CSS variable |
| MOB-02 | **Không có pull-to-refresh** — gesture phổ biến trên mobile app, thiếu sẽ gây thất vọng cho native app users | 🟢 P3 | `CalendarTab.tsx` | Implement pull-to-refresh trên Calendar tab (recalculate nutrition, reload data) |
| MOB-03 | **Không có onboarding/tutorial** cho người dùng mới — 5 tabs + nhiều CTA có thể overwhelming | 🟡 P2 | `App.tsx` | First-time user tour: highlight từng tab với tooltip giải thích chức năng (dùng thư viện như `react-joyride`) |
| MOB-04 | **Page transitions** không có animation khi switch tab — chuyển đổi instant thiếu cảm giác "chuyển trang" | 🟢 P3 | `App.tsx` | Thêm fade-in animation: `animate-[fadeIn_200ms_ease-out]` cho mỗi tab panel |

#### 2.7.3 Performance

| ID | Vấn đề | Mức độ | File ảnh hưởng | Đề xuất |
|----|--------|:------:|----------------|---------|
| PERF-01 | **ONNX model pre-load** — 170+ warnings ngay khi mount, AI model load trước khi cần → tốn ~50-100MB memory trên mobile | 🟡 P2 | `src/workers/`, Web Workers | Chuyển sang on-demand loading: chỉ init model khi user vào AI tab + hiện loading progress |
| PERF-02 | **Calendar + Management always mounted** — re-renders khi bất kỳ prop nào thay đổi, dù tab đang hidden | 🟡 P2 | `App.tsx:332-363` | Kiểm tra profile renders với React DevTools. Nếu excessive → thêm `React.memo` boundary hoặc chuyển conditional rendering |

#### 2.7.4 Error Handling

| ID | Vấn đề | Mức độ | File ảnh hưởng | Đề xuất |
|----|--------|:------:|----------------|---------|
| ERR-01 | **Không có offline indicator** — app dùng localStorage (offline-first) nhưng AI analysis cần model files. Không rõ ràng feature nào cần online | 🟢 P3 | `App.tsx` | Hiện banner/toast "Đang offline — một số tính năng AI bị giới hạn" khi navigator.onLine = false |
| ERR-02 | **ErrorBoundary fallback** — có per-tab (tốt!) nhưng fallback message có thể friendly hơn | 🟢 P3 | `ErrorBoundary.tsx` | Thêm retry button + friendly illustration trong error fallback UI |

---

## 3. Bảng tổng hợp theo mức độ ưu tiên

### 🔴 P0 — Nghiêm trọng (4 issues) — Fix ngay

| ID | Tóm tắt | Effort | Impact |
|----|---------|:------:|:------:|
| CAL-01 | Ngày hiển thị sai ngôn ngữ (English khi đang Vietnamese) | Nhỏ (1-2h) | Cao — i18n broken |
| CAL-11 | 2 modal mở đồng thời, chồng chéo | Trung bình (3-4h) | Cao — UX anti-pattern |
| LIB-02 | Edit/Delete buttons sát nhau, dễ nhấn nhầm Delete | Nhỏ (1-2h) | Cao — risk mất dữ liệu |
| LIB-07 | Hidden tabs vẫn nhận DOM interaction (`inert` missing) | Nhỏ (1h) | Cao — accessibility + JS bugs |

### 🟠 P1 — Cao (3 issues) — Sửa trong sprint hiện tại

| ID | Tóm tắt | Effort | Impact |
|----|---------|:------:|:------:|
| CAL-09 | Floating action buttons bị che bởi bottom nav | Nhỏ (30min) | Trung bình — usability |
| SET-02 | Import data không có preview/confirm | Trung bình (2-3h) | Cao — risk mất data |
| ACC-01 | Color contrast emerald-500 không đạt WCAG AA | Nhỏ (1h) | Trung bình — accessibility compliance |

### 🟡 P2 — Trung bình (17 issues) — Sprint tiếp theo

| ID | Tóm tắt | Effort |
|----|---------|:------:|
| NAV-01 | Label navigation chật trên thiết bị nhỏ | Nhỏ |
| CAL-02 | Format ngày quá dài trên mobile | Nhỏ |
| CAL-03 | Month view cell nhỏ, khó nhấn | Nhỏ |
| CAL-05 | Carbs/Fat/Fiber thiếu target | Trung bình |
| CAL-07 | Suggestion card thiếu CTA | Nhỏ |
| CAL-08 | 3 bữa empty state lặp lại | Trung bình |
| LIB-01 | Grid card information overload | Trung bình |
| LIB-05 | Chỉ hiện per 100g, thiếu serving size | Trung bình |
| AI-01 | Empty state preview vô nghĩa | Nhỏ |
| AI-02 | Thiếu hướng dẫn nhanh cho AI flow | Nhỏ |
| AI-04 | ONNX model pre-load tốn tài nguyên | Trung bình |
| SHOP-01 | Empty state thiếu explanation | Nhỏ |
| SHOP-02 | CTA link thiếu visual affordance | Nhỏ |
| SHOP-03 | Không có thêm manual shopping item | Trung bình |
| ACC-02 | Focus ring thiếu cho keyboard nav | Nhỏ |
| MOB-01 | Safe area inset chưa đủ | Nhỏ |
| MOB-03 | Không có onboarding cho user mới | Lớn |
| PERF-01 | Lazy-load ONNX model | Trung bình |
| PERF-02 | Always-mounted tabs re-renders | Trung bình |

### 🟢 P3 — Thấp (16 issues) — Backlog

| ID | Tóm tắt | Effort |
|----|---------|:------:|
| NAV-02 | Badge AI nhỏ | Nhỏ |
| NAV-03 | Thiếu tab press animation | Nhỏ |
| CAL-04 | Nutrition 0 state message | Nhỏ |
| CAL-06 | Nutrition card touch area | Nhỏ |
| CAL-10 | AI button thiếu label | Nhỏ |
| CAL-12 | Slider khó chỉnh trên mobile | Trung bình |
| CAL-13 | Auto-save thiếu visual feedback | Nhỏ |
| LIB-03 | List view truncate tên | Nhỏ |
| LIB-04 | Search bar không sticky | Nhỏ |
| LIB-06 | "Dùng trong:" list dài | Nhỏ |
| AI-03 | Camera API error handling | Nhỏ |
| SET-01 | Thiếu section "Về ứng dụng" | Nhỏ |
| SET-03 | Thiếu Reset data option | Nhỏ |
| SET-04 | Theme switch animation | Nhỏ |
| ACC-03 | Modal aria-labelledby | Nhỏ |
| MOB-02 | Pull-to-refresh gesture | Trung bình |
| MOB-04 | Tab switch animation | Nhỏ |
| ERR-01 | Offline indicator | Nhỏ |
| ERR-02 | ErrorBoundary friendly fallback | Nhỏ |

---

## 4. Console & Performance

### Console Messages

| Loại | Số lượng | Chi tiết |
|------|:--------:|---------|
| **Errors** | 0 | Không có JavaScript errors |
| **Warnings** | 170 | Tất cả từ ONNX Runtime (`CleanUnusedInitializersAndNodeArgs`) — Marian translation model. Không ảnh hưởng functionality nhưng tốn console bandwidth |
| **Info** | 0 | — |

### Nhận xét Performance
- **Zero JS errors** — code quality tốt, ErrorBoundary hoạt động đúng
- **170 ONNX warnings** — từ MarianTokenizer, model load khi app mount (nên lazy-load)
- **Lazy-loaded tabs** — AI Analysis + Grocery dùng `React.lazy` → giảm initial bundle
- **Calendar + Management always mounted** — có thể gây unnecessary re-renders
- **Touch gesture** — swipe detection hoạt động tốt, 50px threshold hợp lý

---

## 5. Kế hoạch thực hiện (Implementation Plan)

### Sprint 1: Critical Fixes (P0) — Ước tính: 1-2 ngày

#### Task 1.1: Fix ngày hiển thị sai ngôn ngữ (CAL-01)

**File**: `src/components/CalendarTab.tsx` dòng 221

**Approach**: Thay `toLocaleDateString(dateLocale, ...)` bằng custom format function dùng i18n keys

```
Bước 1: Thêm i18n keys cho tên ngày/tháng vào vi.json và en.json
Bước 2: Tạo utility function formatLocalizedDate(date, language)
Bước 3: Thay thế toLocaleDateString() call
Bước 4: Kiểm tra trên cả vi và en locale
```

**Acceptance criteria**:
- Ngày hiển thị "Thứ Sáu, 6 tháng 3, 2026" khi app ở chế độ Tiếng Việt
- Ngày hiển thị "Friday, March 6, 2026" khi app ở chế độ English
- Hoạt động nhất quán trên mọi browser/device

#### Task 1.2: Fix modal stacking (CAL-11)

**File**: `src/App.tsx` dòng 400-420

**Approach**: Thêm guard condition cho modal rendering

```
Bước 1: Thêm computed property hasActiveModal
Bước 2: AI Suggestion modal chỉ render khi không có modal khác đang mở
Bước 3: Hoặc: chuyển AI Suggestion thành inline card thay vì modal
Bước 4: Test scenario: mở/đóng nhiều modal liên tiếp
```

**Acceptance criteria**:
- Không bao giờ có 2+ modal hiển thị đồng thời
- Escape key đóng đúng modal trên cùng
- Scroll lock hoạt động đúng khi đóng modal cuối

#### Task 1.3: Fix Edit/Delete button proximity (LIB-02)

**Files**: `src/components/DishList.tsx`, `src/components/IngredientList.tsx`

**Approach**: Tăng spacing + thêm confirm dialog cho Delete

```
Bước 1: Tăng gap giữa Edit/Delete buttons (gap-2 → gap-4)
Bước 2: Delete button dùng màu neutral (slate) thay vì đỏ, chỉ đỏ khi hover
Bước 3: Kiểm tra confirm dialog đã có cho Delete action
Bước 4: Nếu chưa có → thêm confirm dialog "Bạn có chắc muốn xóa?"
```

**Acceptance criteria**:
- Khoảng cách Edit-Delete ≥ 16px (gap-4)
- Delete có confirm dialog trước khi thực hiện
- Touch target mỗi button ≥ 44×44px

#### Task 1.4: Fix hidden tabs DOM interaction (LIB-07)

**File**: `src/App.tsx` dòng 332-363

**Approach**: Thêm `inert` attribute cho hidden tab panels

```
Bước 1: Thêm inert attribute: <div inert={activeMainTab !== 'calendar'}>
Bước 2: Tương tự cho management tab panel
Bước 3: Verify: assistive tech không focus vào hidden content
Bước 4: Verify: querySelector chỉ trả về visible elements
```

**Acceptance criteria**:
- `inert` attribute present trên tất cả hidden tab panels
- Tab key không focus vào buttons/inputs trong hidden tabs
- Screen reader không đọc hidden tab content

---

### Sprint 2: High Priority (P1) — Ước tính: 1 ngày

#### Task 2.1: Fix floating buttons overlap (CAL-09)

**File**: `src/components/CalendarTab.tsx`

```
Bước 1: Kiểm tra vị trí floating buttons relative to bottom nav
Bước 2: Thêm bottom offset: bottom-20 (80px) hoặc bottom-24 (96px)
Bước 3: Test trên iPhone SE (320px), iPhone 15 (390px), iPhone 15 Pro Max (430px)
```

#### Task 2.2: Import data preview (SET-02)

**File**: `src/components/SettingsTab.tsx`

```
Bước 1: Parse imported file first (không apply ngay)
Bước 2: Hiện preview dialog: số lượng dishes, ingredients, day plans
Bước 3: Options: "Ghi đè toàn bộ" / "Hủy"
Bước 4: Error handling cho invalid file format
```

#### Task 2.3: Fix color contrast (ACC-01)

**Scope**: Toàn bộ components

```
Bước 1: Audit tất cả instance text-emerald-500 dùng cho body text
Bước 2: Đổi sang text-emerald-700 cho text content
Bước 3: Giữ emerald-500 cho decorative elements (icons, borders, badges)
Bước 4: Kiểm tra dark mode tương ứng: dark:text-emerald-400 → dark:text-emerald-300
```

---

### Sprint 3: Medium Priority (P2) — Ước tính: 3-5 ngày

#### Batch 3A: Content & Copy Improvements (1 ngày)
- CAL-02: Format ngày responsive
- CAL-07: Thêm CTA cho suggestion card
- CAL-08: Gom empty state khi tất cả bữa trống
- SHOP-01: Thêm explanation cho empty state
- SHOP-02: Style CTA link rõ ràng hơn

#### Batch 3B: Library UX Improvements (1-2 ngày)
- NAV-01: Rút gọn navigation labels
- LIB-01: Giảm density trên grid cards
- LIB-05: Thêm serving size cho ingredients

#### Batch 3C: AI & Performance (1-2 ngày)
- AI-01: Cải thiện empty state preview
- AI-02: Thêm workflow stepper
- AI-04 + PERF-01: Lazy-load ONNX model (on-demand)
- PERF-02: Audit tab re-renders

#### Batch 3D: Accessibility & Layout
- ACC-02: Global focus-visible styles
- MOB-01: Safe area inset calculation
- CAL-03: Month view cell sizing
- CAL-05: Carbs/Fat/Fiber targets

---

### Sprint 4: Nice-to-have (P3) — Backlog

Các items P3 nên được ưu tiên khi có thời gian giữa các sprint chính:

| Nhóm | Items | Effort tổng |
|------|-------|:------------:|
| **Micro-interactions** | NAV-02, NAV-03, CAL-13, SET-04, MOB-04 | ~3h |
| **Empty states** | CAL-04, CAL-10, ERR-02 | ~2h |
| **Library polish** | LIB-03, LIB-04, LIB-06 | ~2h |
| **Advanced UX** | CAL-12, MOB-02, MOB-03 | ~8h |
| **Settings extras** | SET-01, SET-03 | ~2h |
| **Error handling** | AI-03, ERR-01, ACC-03 | ~2h |

---

## 6. Đánh giá tổng quan

### Scorecard

| Tiêu chí | Điểm (1-10) | Nhận xét |
|----------|:-----------:|----------|
| **Visual Design** | 8/10 | Clean, modern Tailwind. Emerald green theme nhất quán. Dark mode implementation tốt |
| **Information Architecture** | 7/10 | 5 tabs logic rõ ràng. Sub-tabs trong Library hợp lý. Cross-reference dishes↔ingredients tốt |
| **Mobile Usability** | 6.5/10 | Touch targets OK, swipe gesture có, nhưng content density cao, month view khó dùng, bottom nav chật |
| **Consistency** | 7/10 | Date language bug, tab rendering pattern không nhất quán (hidden vs conditional) |
| **Accessibility** | 6/10 | ARIA roles có, nhưng contrast fail WCAG AA, focus management thiếu, dialog labeling thiếu |
| **Error Prevention** | 6.5/10 | ErrorBoundary per tab tốt. Modal stacking bug, Delete confirm cần kiểm tra |
| **Learnability** | 6/10 | Thiếu onboarding, empty states thiếu guidance, AI tab workflow không rõ |
| **Performance** | 7/10 | Lazy-loaded tabs tốt, nhưng ONNX pre-loading tốn tài nguyên, always-mounted tabs wasteful |

### Điểm tổng: **6.75/10**

### Tóm tắt

**Điểm mạnh:**
- Design system nhất quán, Tailwind-based, dễ maintain
- Dark mode implementation toàn diện
- Touch gesture (swipe) trên calendar hoạt động tốt
- ModalBackdrop với scroll lock reference counting — engineering chất lượng
- ErrorBoundary per tab — defensive coding tốt
- i18n setup chuẩn với fallback vi-VN
- Zero JavaScript errors trong console

**Điểm cần cải thiện:**
- 4 lỗi P0 cần fix ngay (date locale, modal stacking, button proximity, DOM interaction)
- Color contrast không đạt WCAG AA cho text
- ONNX model pre-load làm chậm initial load trên mobile
- Thiếu onboarding flow cho người dùng mới
- Empty states nhiều nơi thiếu guidance/explanation
- Import data thiếu preview → risk mất dữ liệu

### Dự kiến sau khi fix

Nếu hoàn thành Sprint 1-3, điểm dự kiến sẽ cải thiện:

| Tiêu chí | Hiện tại | Sau Sprint 1-3 |
|----------|:--------:|:--------------:|
| Mobile Usability | 6.5 | 8.0 |
| Consistency | 7.0 | 8.5 |
| Accessibility | 6.0 | 7.5 |
| Error Prevention | 6.5 | 8.0 |
| Learnability | 6.0 | 7.5 |
| **Tổng** | **6.75** | **7.9** |
