# 🔍 BÁO CÁO ĐÁNH GIÁ THIẾT KẾ GIAO DIỆN — MEALPLANING APP

> **Người đánh giá**: Senior Design Director — 50+ năm kinh nghiệm thiết kế & phát triển phần mềm
> **Ngày đánh giá**: Tháng 6/2026
> **Phiên bản ứng dụng**: MealPlaning v1.x (React 19 + Capacitor 8, Android)
> **Thiết bị kiểm tra**: Android Emulator 1080×2400, density 420
> **Tổng số screenshot phân tích**: 181 ảnh, bao phủ toàn bộ luồng ứng dụng
> **Mức độ đánh giá**: NGHIÊM NGẶT NHẤT — Không khoan nhượng

---

## MỤC LỤC

1. [PHẦN I: TỔNG QUAN & ĐÁNH GIÁ TỔNG THỂ](#phần-i-tổng-quan--đánh-giá-tổng-thể)
2. [PHẦN II: HỆ THỐNG MÀU SẮC & DESIGN TOKENS](#phần-ii-hệ-thống-màu-sắc--design-tokens)
3. [PHẦN III: TYPOGRAPHY & HỆ THỐNG CHỮ](#phần-iii-typography--hệ-thống-chữ)
4. [PHẦN IV: ONBOARDING FLOW](#phần-iv-onboarding-flow)
5. [PHẦN V: CALENDAR & MEAL PLANNING](#phần-v-calendar--meal-planning)
6. [PHẦN VI: THƯ VIỆN — NGUYÊN LIỆU & MÓN ĂN](#phần-vi-thư-viện--nguyên-liệu--món-ăn)
7. [PHẦN VII: DINH DƯỠNG & MỤC TIÊU](#phần-vii-dinh-dưỡng--mục-tiêu)
8. [PHẦN VIII: TẬP LUYỆN — TOÀN BỘ MODULE FITNESS](#phần-viii-tập-luyện--toàn-bộ-module-fitness)
9. [PHẦN IX: TỔNG QUAN (DASHBOARD)](#phần-ix-tổng-quan-dashboard)
10. [PHẦN X: PHÂN TÍCH AI](#phần-x-phân-tích-ai)
11. [PHẦN XI: CÀI ĐẶT & DARK MODE](#phần-xi-cài-đặt--dark-mode)
12. [PHẦN XII: MODAL, DIALOG & BOTTOM SHEET](#phần-xii-modal-dialog--bottom-sheet)
13. [PHẦN XIII: EMPTY STATES & EDGE CASES](#phần-xiii-empty-states--edge-cases)
14. [PHẦN XIV: ACCESSIBILITY & INCLUSIVE DESIGN](#phần-xiv-accessibility--inclusive-design)
15. [PHẦN XV: BÀI HỌC THIẾT KẾ TỔNG HỢP](#phần-xv-bài-học-thiết-kế-tổng-hợp)
16. [PHẦN XVI: BẢNG ĐIỂM ĐÁNH GIÁ TỔNG HỢP](#phần-xvi-bảng-điểm-đánh-giá-tổng-hợp)
17. [PHẦN XVII: ROADMAP CẢI THIỆN ĐỀ XUẤT](#phần-xvii-roadmap-cải-thiện-đề-xuất)

---

## PHẦN I: TỔNG QUAN & ĐÁNH GIÁ TỔNG THỂ

### 1.1 Nhận xét thẳng thắn

Tôi đã dành hơn 50 năm trong ngành thiết kế phần mềm. Tôi đã chứng kiến từ thời mainframe terminal xanh lè cho đến thời đại mobile-first. Và sau khi xem xét kỹ lưỡng **181 screenshot** của ứng dụng MealPlaning này, tôi phải nói thẳng:

**Đây là một ứng dụng được xây dựng bởi những lập trình viên giỏi nhưng THIẾU một design system nghiêm túc.**

Ứng dụng có CHỨC NĂNG rất tốt — meal planning, nutrition tracking, fitness training, AI analysis — nhưng về mặt thiết kế giao diện, nó mắc phải MỌI LỖI CỔ ĐIỂN mà một sản phẩm do developer tự thiết kế thường gặp:

1. **Hội chứng "một màu xanh trị bách bệnh"** — Toàn bộ ứng dụng CHÌM NGẬP trong một dải màu xanh lá (green/emerald/teal). Không có secondary color. Không có accent color thay thế. Đây là LỖI THIẾT KẾ NGHIÊM TRỌNG NHẤT.

2. **Thiếu visual hierarchy** — Khi mọi thứ đều xanh, khi mọi card đều bo tròn giống nhau, khi mọi nút đều cùng style — thì KHÔNG CÓ GÌ nổi bật. Mắt người dùng không biết nhìn vào đâu.

3. **Information overload trên mobile** — Nhiều màn hình nhồi nhét quá nhiều thông tin vào một viewport 411×914dp. Training profile form, workout logging, nutrition detail — tất cả đều QUÁI VẬT CUỘN.

4. **Inconsistency tinh vi** — Bề ngoài trông nhất quán, nhưng xem kỹ thì spacing, padding, button sizes, card elevation đều LUNG TUNG giữa các module.

### 1.2 Điểm mạnh cần ghi nhận (vì tôi khó tính chứ không bất công)

- ✅ **Functional completeness**: App có ĐẦY ĐỦ tính năng cho một meal planner chuyên nghiệp
- ✅ **Dark mode support**: Có implementation dark mode — mặc dù còn nhiều vấn đề
- ✅ **Vietnamese localization**: UI hoàn toàn tiếng Việt, không pha trộn — nhất quán
- ✅ **Form validation**: Có validation messages rõ ràng, hiển thị inline
- ✅ **Seed data thông minh**: 10 nguyên liệu + 5 món ăn mặc định giúp onboarding
- ✅ **Card-based selection**: Onboarding dùng card selection pattern — trực quan
- ✅ **Statistics visualization**: Module thống kê có hero card gradient, progress bars — khá

### 1.3 Điểm số tổng quan

| Tiêu chí             | Điểm (/10) | Nhận xét                                                               |
| -------------------- | ---------- | ---------------------------------------------------------------------- |
| **Color System**     | 3/10       | Monotone xanh. Thiếu secondary, accent, semantic colors                |
| **Typography**       | 5/10       | Đọc được nhưng thiếu hierarchy. Font weight variation nghèo nàn        |
| **Layout & Spacing** | 4/10       | Inconsistent padding/margin giữa modules. Nhiều screen quá chật        |
| **Component Design** | 5/10       | Cards ok nhưng thiếu elevation variation. Buttons thiếu state feedback |
| **Navigation**       | 6/10       | 5-tab bottom nav hợp lý. Sub-tabs gây confusion                        |
| **Form UX**          | 4/10       | Quá dài, thiếu progressive disclosure. Validation ok nhưng layout chật |
| **Empty States**     | 3/10       | Tối giản quá mức. Thiếu illustration, thiếu guidance                   |
| **Dark Mode**        | 5/10       | Có nhưng contrast issues. Một số component chưa adapted                |
| **Accessibility**    | 3/10       | Touch targets nhỏ. Calendar dots cực nhỏ. Thiếu focus indicators       |
| **Visual Identity**  | 4/10       | Không có personality. Trông như template shadcn/ui default             |
| **Overall UX Flow**  | 5/10       | Flows logic đúng nhưng friction cao. Too many steps                    |
| **Emotional Design** | 2/10       | Lạnh lẽo, máy móc, không có "linh hồn". Zero delight moments           |

**ĐIỂM TỔNG: 4.1/10** — Mức "Functional but needs significant design investment"

---

## PHẦN II: HỆ THỐNG MÀU SẮC & DESIGN TOKENS

### 2.1 Vấn đề cốt lõi: "Green Monotony Syndrome"

Đây là **VẤN ĐỀ SỐ 1** của toàn bộ ứng dụng. Tôi sẽ dành cả phần này để giải thích tại sao, vì nếu bạn không hiểu ĐÚNG vấn đề này, mọi fix nhỏ khác đều vô nghĩa.

#### Hiện trạng:

Nhìn vào 181 screenshots, tôi đếm được:

- **Primary green** xuất hiện ở: navigation active state, buttons, card borders, selection states, progress bars, badges, links, icons, gradient backgrounds, hero cards, chips, toggles, radio buttons, streak indicators, nutrition bars...
- **Secondary color**: KHÔNG TỒN TẠI
- **Accent color**: KHÔNG TỒN TẠI (trừ destructive red cho delete)
- **Semantic colors**: Chỉ có success (green) và error (red). Warning orange và info blue GẦN NHƯ không dùng

#### Tại sao đây là thảm họa thiết kế:

**Bài học #1: Luật "60-30-10" trong thiết kế màu sắc**

Trong hơn 50 năm làm thiết kế, tôi đã thấy hàng ngàn ứng dụng thất bại vì vi phạm quy tắc đơn giản nhất của color theory:

```
60% — Neutral (trắng, xám, đen) → background, card surfaces, text
30% — Primary (xanh lá của bạn) → navigation, buttons chính, brand elements
10% — Accent (một màu KHÁC HẲN) → CTA nổi bật, notifications, highlights
```

Ứng dụng của bạn đang ở tỷ lệ:

```
40% — Neutral
55% — Green (primary lấn chiếm TOÀN BỘ)
5%  — Red (chỉ cho delete/error)
0%  — Accent ← KHÔNG CÓ
```

Kết quả? **Mọi thứ đều xanh → không gì nổi bật → user không biết đâu là quan trọng nhất.**

#### Ví dụ cụ thể từ screenshots:

1. **Onboarding - Goal Selection (SC03_step35)**: 3 cards mục tiêu (Giảm cân, Duy trì, Tăng cân) — khi chọn, viền xanh + background xanh nhạt. Nhưng nút "Tiếp tục" bên dưới CŨNG xanh. Header navigation CŨNG xanh. Mắt bạn nhìn vào đâu? Tôi không biết.

2. **Dashboard (SC38_step05)**: Greeting card xanh, protein bar xanh, energy balance icons xanh, rest day card viền xanh, CTA buttons xanh, bottom nav active tab xanh. ĐẾM ĐƯỢC **7 thành phần xanh** trên cùng một viewport. Đây là VISUAL NOISE, không phải design.

3. **Training Plan (SC26_step30)**: Workout cards xanh, muscle group badges xanh, exercise count badges xanh, section headers xanh, streak dots xanh. Người dùng muốn focus vào hôm nay tập gì? Không thể, vì MỌI THỨ đều hét lên "nhìn tôi đi!"

### 2.2 Giải pháp chi tiết

#### A. Thiết lập Color Palette mới

```
PRIMARY:     Emerald-600 (#059669) — Giữ nguyên, đây là brand color tốt
SECONDARY:   Slate-600 (#475569) — Cho text, icons phụ, subtle elements
ACCENT:      Amber-500 (#F59E0B) — Cho CTA quan trọng, highlights, notifications
SURFACE:     White (#FFFFFF) / Slate-50 (#F8FAFC) — Cho backgrounds
SEMANTIC:
  - Success: Emerald-500 (dùng lại primary — hợp lý cho health app)
  - Warning: Amber-500
  - Error:   Rose-500 (#F43F5E)
  - Info:    Sky-500 (#0EA5E9)
```

#### B. Quy tắc sử dụng (KHÔNG ĐƯỢC vi phạm)

| Element                   | Màu                                             | Lý do                                                  |
| ------------------------- | ----------------------------------------------- | ------------------------------------------------------ |
| Bottom nav active         | Primary Emerald                                 | Brand recognition                                      |
| Primary CTA button        | Primary Emerald                                 | Hành động chính                                        |
| Secondary CTA             | Outline hoặc Slate                              | Phân biệt priority                                     |
| Card borders khi selected | Primary Emerald                                 | Selection state                                        |
| Progress bars             | Primary Emerald HOẶC semantic color tùy context | Nutrient bars nên dùng MÀU RIÊNG cho protein/carbs/fat |
| Badges/chips inactive     | Slate-100 bg + Slate-600 text                   | KHÔNG PHẢI green bg                                    |
| Hero card gradient        | Primary → darker shade                          | Brand moment — OK                                      |
| Nutrition protein         | **Sky-500** (xanh dương)                        | Protein CẦN màu riêng                                  |
| Nutrition carbs           | **Amber-500** (vàng cam)                        | Carbs CẦN màu riêng                                    |
| Nutrition fat             | **Rose-400** (hồng)                             | Fat CẦN màu riêng                                      |
| Streak indicators         | **Amber-500**                                   | Fire/streak = warm color, KHÔNG PHẢI green             |
| AI analysis               | **Violet-500**                                  | AI = purple/violet association — phân biệt rõ          |

#### C. Nutrition Macro Colors — Bài học quan trọng nhất

**Bài học #2: Mỗi loại data CẦN MÀU RIÊNG**

Trong nutrition tracking, Protein, Carbs, Fat là 3 macro hoàn toàn KHÁC NHAU. Nhưng trong app của bạn, tôi thấy:

- Protein bar: xanh lá
- Carbs display: xanh lá
- Fat display: xanh lá
- Total calories: cũng xanh lá

Đây là **ĐÁNH MẤT semantic meaning thông qua màu sắc**. Khi user nhìn nhanh vào dashboard, họ KHÔNG THỂ phân biệt macro nào là macro nào chỉ bằng màu.

**Giải pháp**:

```
Protein:  Sky-500 (#0EA5E9)    — "nguồn năng lượng xanh dương"
Carbs:    Amber-500 (#F59E0B)  — "năng lượng vàng"
Fat:      Rose-400 (#FB7185)   — "chất béo hồng"
Calories: Emerald-600          — tổng thể, brand color
```

Mỗi biểu đồ, mỗi progress bar, mỗi badge PHẢI consistent với color mapping này. Đây là **industry standard** (MyFitnessPal, Cronometer, MacroFactor — tất cả đều dùng riêng màu cho mỗi macro).

### 2.3 Dark Mode Colors

#### Hiện trạng:

- Dark mode backgrounds dùng tones tối tốt
- NHƯNG: một số card areas có contrast thấp (text xám trên nền tối)
- Green primary trên nền tối đôi khi "chói" (quá saturated)

#### Giải pháp:

```
Dark mode primary: Emerald-400 (#34D399) — sáng hơn 1 bậc so với light mode
Dark backgrounds:  Slate-900 (#0F172A) → Slate-800 (#1E293B) gradient
Card surfaces:     Slate-800 (#1E293B) — nổi lên từ background
Text primary:      Slate-50 (#F8FAFC) — gần trắng
Text secondary:    Slate-400 (#94A3B8) — xám sáng
```

**Bài học #3: Dark mode KHÔNG CHỈ LÀ đảo màu**

Dark mode cần:

1. Giảm saturation của primary color (green quá đậm → mắt mỏi)
2. Surface hierarchy: dùng 3-4 levels xám tối (900/800/700) để tạo depth
3. Text contrast PHẢI đạt WCAG AA tối thiểu (4.5:1 cho body text)
4. Colored elements cần "toned down" — không dùng cùng shade như light mode

---

## PHẦN III: TYPOGRAPHY & HỆ THỐNG CHỮ

### 3.1 Hiện trạng

Nhìn qua 181 screenshots, typography hệ thống này có thể tóm gọn trong 4 từ: **"Đọc được nhưng nhàm chán."**

#### Vấn đề #1: Font weight variation nghèo nàn

Toàn bộ app chỉ dùng 2 levels:

- **Bold** — cho headers
- **Regular** — cho body text

Thiếu hoàn toàn: Semibold (600), Medium (500), Light (300). Kết quả: hierarchy nhị phân — hoặc TO ĐẬM hoặc bình thường, không có gradient.

#### Vấn đề #2: Font size scale không rõ ràng

Tôi quan sát:

- Page titles: ~20-22px — OK
- Section headers: ~16-18px — OK nhưng quá gần body
- Body text: ~14-16px — OK
- Captions/labels: ~12-13px — Quá nhỏ trên mobile 420dpi

**BÀI HỌC**: Modular scale PHẢI có minimum **2px difference** giữa các levels. Nếu section header = 18px và body = 16px, đó là **chỉ 2px**, gần như KHÔNG NHÌN RA sự khác biệt trên mobile.

#### Vấn đề #3: Line height trên form labels quá chật

Trong training profile form (SC25 series), nutrition form, ingredient form — labels và inputs chen chúc nhau. Line height body text ~1.4 nhưng form labels cần ~1.6 để thoáng.

#### Vấn đề #4: Number displays thiếu tabular figures

Trong statistics (SC30 series), workout logging (SC28 series), nutrition numbers — các con số dùng proportional figures thay vì tabular figures. Nghĩa là "1111" và "8888" có chiều rộng KHÁC NHAU, gây lệch cột khi hiển thị bảng.

### 3.2 Giải pháp Typography System

#### A. Type Scale đề xuất

```
Display:    28px / 700 weight / 1.2 line-height — Hero numbers, page titles
Heading 1:  24px / 700 weight / 1.3 — Section titles
Heading 2:  20px / 600 weight / 1.4 — Sub-section titles
Heading 3:  18px / 600 weight / 1.4 — Card titles
Body:       16px / 400 weight / 1.6 — Main content
Body Small: 14px / 400 weight / 1.5 — Secondary content
Caption:    13px / 500 weight / 1.4 — Labels, timestamps
Overline:   11px / 600 weight / 1.3 / UPPERCASE / letter-spacing 0.5px — Category labels
```

#### B. Quy tắc cụ thể cho từng context

| Context            | Size                            | Weight                      | Ví dụ |
| ------------------ | ------------------------------- | --------------------------- | ----- |
| Dashboard greeting | Display 28px/700                | "Chào buổi sáng!"           |
| Card title         | H3 18px/600                     | "Bữa Sáng", "Kế hoạch tuần" |
| Nutrition number   | Display 28px/700 + tabular-nums | "1,327 kcal"                |
| Form label         | Caption 13px/500                | "Chiều cao (cm)"            |
| Form input value   | Body 16px/400                   | "175"                       |
| Button text        | Body 16px/600                   | "Lưu thay đổi"              |
| Bottom nav label   | Caption 11px/500                | "Lịch trình"                |
| Badge/chip         | Caption 12px/500                | "Ngực", "Vai"               |
| Timestamp          | Body Small 14px/400             | "2 ngày trước"              |
| Error message      | Body Small 14px/500 + Rose-500  | "Vui lòng nhập chiều cao"   |

#### C. Tabular Numbers cho Data Displays

**Bài học #4: Số liệu CẦN font-variant-numeric: tabular-nums**

```css
/* Áp dụng cho MỌI element hiển thị số */
.nutrition-number,
.stat-value,
.workout-number,
.calorie-display {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
}
```

Tại sao? Vì khi hiển thị bảng nutrition:

```
Protein:  170g    ← chữ số "1" hẹp hơn "8"
Carbs:    280g    ← nếu proportional, "280" rộng hơn "170"
Fat:       58g    ← cột bị lệch
```

Với tabular-nums, mỗi chữ số có cùng width → cột thẳng tắp → professional.

---

## PHẦN IV: ONBOARDING FLOW

### 4.1 Tổng quan vấn đề

Onboarding flow hiện tại bao gồm **7 sections, 15+ clicks tối thiểu, và 13 giây computing animation**. Đây là một trong những onboarding dài nhất tôi từng thấy trong ứng dụng mobile, và tôi đã review HÀNG NGÀN ứng dụng.

Để so sánh:

- **MyFitnessPal**: 4 bước, ~2 phút
- **Noom**: 20+ bước nhưng mỗi bước CỰC KỲ nhẹ (1 tap)
- **MealPlaning của bạn**: 7 sections × 2-3 sub-steps = ~20 bước, ~5 phút

### 4.2 Chi tiết từng screen

#### A. Welcome Screens (SC01, SC02)

**Nhận xét**:

- 2 welcome screens trước khi bắt đầu — QUÁ NHIỀU. User muốn dùng app, không muốn đọc brochure.
- "Chào mừng bạn đến MealPlaner!" — typo? Tên app là MealPlaning hay MealPlaner? CONSISTENCY LÀ TẤT CẢ.
- Background gradient xanh chiếm toàn màn hình — đẹp nhưng KHÔNG truyền tải được app làm gì.
- Nút "Tiếp tục" rồi lại "Tiếp tục" rồi "Bắt đầu" — 3 taps chỉ để VÀO onboarding. Vô lý.

**Giải pháp**:

- LOẠI BỎ 1 welcome screen. Chỉ cần 1 screen: logo + tagline + "Bắt đầu" button.
- Nếu muốn onboarding giới thiệu features, dùng **horizontal carousel** (swipe) với dots indicator, không dùng fullscreen pages liên tiếp.
- Tagline cần rõ nghĩa: "Lên kế hoạch bữa ăn thông minh" thay vì chỉ "Chào mừng".

#### B. Health Basic Step (SC03_step15)

**Nhận xét**:

- Gender selection bằng 2 buttons "Nam"/"Nữ" — OK nhưng thiếu "Khác" option cho inclusive design.
- Input fields: Name → DOB → Height → Weight — hợp lý về thứ tự.
- NHƯNG: tất cả fields trên CÙNG MỘT form dài — user thấy wall of inputs → intimidating.
- Height/Weight dùng `type="number"` trong onboarding nhưng `type="text"` trong Settings — INCONSISTENT.
- DOB picker: native date picker hay custom? Không rõ từ screenshot — native tốt hơn cho accessibility.

**Giải pháp**:

- Chia thành 2 sub-steps: (1) Gender + Name, (2) DOB + Height + Weight
- Mỗi sub-step chỉ 2-3 fields → less overwhelming
- Thêm **micro-illustrations** cho mỗi step — hình người đang đo chiều cao, đặt lên cân
- Validation realtime: khi user nhập xong field → auto-validate → green checkmark

#### C. Activity Level (SC03_step25)

**Nhận xét**:

- 5 activity cards (Ít vận động → Hoạt động rất cao) — CARD SELECTION PATTERN rất tốt ✅
- Selected state: viền xanh + background xanh nhạt — clear selection
- Mỗi card có: icon + tên + mô tả ngắn — informative
- **NHƯNG**: tất cả 5 cards fit trong viewport → nghĩa là mỗi card khá NHỎ → text cũng nhỏ

**Giải pháp**:

- Cards cao hơn ~10% → text lớn hơn → dễ đọc
- Thêm **frequency hint**: "1-2 lần/tuần", "3-5 lần/tuần" bên cạnh mô tả → cụ thể hơn
- Icon cho mỗi level nên KHÁC NHAU rõ ràng (đi bộ → chạy → tạ → vận động viên → extreme)
- Selected card nên có **scale animation nhẹ** (transform: scale(1.02)) để feedback rõ hơn

#### D. Goal Selection (SC03_step35)

**Nhận xét**:

- 3 goals: Giảm cân, Duy trì, Tăng cân — rõ ràng, đủ
- Rate selection (Conservative/Moderate/Aggressive) — tốt nhưng terminology lạ cho user Việt
- "Conservative" → "Nhẹ nhàng" sẽ tự nhiên hơn cho tiếng Việt
- Calorie offset display (-275, -550, -1100) — TECHNICAL DETAIL không cần thiết ở bước onboarding

**Giải pháp**:

- Rate cards dùng Vietnamese thân thiện: "Từ từ", "Vừa phải", "Nhanh chóng"
- ẨN calorie offset — chỉ hiện icon tốc độ (🐢 → 🐇 → 🚀)
- Thêm estimated timeline: "Giảm ~0.25kg/tuần" → user hiểu impact cụ thể
- Goal cards nên có MINH HỌA (scale cân, biểu đồ xuống/ngang/lên)

#### E. Confirm Step (SC03_step42)

**Nhận xét**:

- Hiển thị BMR, TDEE, Target — TECHNICAL JARGON cho normal user
- User không biết BMR là gì, TDEE là gì — đây không phải app cho bác sĩ dinh dưỡng
- Layout: 3 boxes inline với numbers — functional nhưng cold
- "Xác nhận" button — xác nhận CÁI GÌ? User chưa hiểu mình đang xác nhận gì

**Giải pháp**:

- THAY ĐỔI hoàn toàn presentation:
  ```
  Thay vì: "BMR: 1704 | TDEE: 2641 | Target: 2091"
  Nên là:  "Cơ thể bạn cần khoảng 2,091 kcal mỗi ngày để đạt mục tiêu giảm cân"
  ```
- Nút: "Xác nhận" → "Bắt đầu lên kế hoạch!"
- Thêm nhỏ bên dưới: "Bạn có thể thay đổi sau trong Cài đặt"
- Nếu muốn show technical numbers → collapse/expand detail section

#### F. Training Profile (SC25 series — 15 screenshots)

**Nhận xét NGHIÊM KHẮC NHẤT**:

Đây là phần TỆ NHẤT của toàn bộ onboarding. Training profile form có:

- Goal fitness
- Experience level
- Training days per week
- Duration per session
- Equipment available
- Sleep hours
- Advanced options (muscle group toggles, cycle weeks)

TẤT CẢ trên MỘT form cuộn. Trong 1 screen. Trong onboarding.

**Bài học #5: Khi form > 5 fields trên mobile → PHẢI chia steps**

Form 10+ fields trên mobile = user abandonment rate > 60% (Nielsen Norman Group research). Bạn đang yêu cầu user MỚI (chưa biết app) điền 10+ fields VỀ TẬP LUYỆN khi họ chỉ muốn lên kế hoạch bữa ăn.

**Giải pháp triệt để**:

1. **TÁCH training profile ra khỏi onboarding** — đưa vào "Khám phá tính năng" sau khi user đã dùng meal planning
2. Nếu BẮT BUỘC giữ trong onboarding:
   - Chia thành 3 sub-steps: (1) Goal + Experience, (2) Schedule, (3) Equipment + Sleep
   - Mỗi sub-step MAXIMUM 3-4 fields
   - Thêm "Bỏ qua" option cho user chỉ quan tâm nutrition
3. Muscle group toggles — HIDDEN by default, chỉ show khi user chọn "Advanced"
4. Cycle weeks slider — QUÁI VẬT cho onboarding. Đưa vào Settings.

#### G. Plan Preview & Computing Animation (SC03_step48)

**Nhận xét**:

- Computing animation chạy **13 giây** — ĐÂY LÀ THẢM HỌA UX
- User ngồi nhìn animation spinning 13 giây không làm gì được = frustration
- Plan Preview sau computing: hiển thị kế hoạch tuần → tốt về concept
- CTA button "Bắt đầu tập luyện →" hoặc testid `onboarding-complete` — text KHÔNG NHẤT QUÁN

**Bài học #6: Loading > 3 giây PHẢI có progress indicator hoặc content**

Mọi loading > 3s cần:

1. Progress bar (thực hoặc giả) — cho user thấy "đang xong"
2. Content animation — show tips/facts trong khi chờ
3. Hoặc tốt nhất: **background processing** — đưa user vào app ngay, tính song song

**Giải pháp**:

- Giảm animation xuống 3-5 giây (nếu AI thực sự cần 13s)
- Trong lúc chờ: hiện **3 tips xoay vòng** ("Bạn biết không? Protein giúp...", "Mẹo: Uống nước trước bữa ăn...")
- Progress bar giả: 0% → 100% trong 13s, smooth, không pause giữa chừng
- Hoặc radical: skip animation entirely, show plan directly, compute in background

---

## PHẦN V: CALENDAR & MEAL PLANNING

### 5.1 Calendar Main View

#### A. Month Grid View (SC05_step10)

**Nhận xét**:

- Month calendar grid standard — tốt, user quen thuộc
- Dots bên dưới mỗi ngày (chỉ trạng thái có bữa ăn) — CỰC KỲ NHỎ
- Selected date highlight: circle xanh — ổn nhưng lại thêm xanh vào bể xanh
- Today indicator: không rõ ràng — cần phân biệt today vs selected vs has-meals

**Vấn đề nghiêm trọng: Calendar dots**

Dots hiện tại có kích thước ước tính < 6dp (khoảng 2-3px visual trên 420dpi screen). Đây là vi phạm WCAG touch target guidelines (minimum 24x24dp cho interactive, minimum 4dp cho visual indicators).

**Bài học #7: Visual indicators trên mobile phải ≥ 6dp, touch targets ≥ 44dp**

User có thể đeo kính, dùng ngoài trời, tay ướt — dots 2-3px là VÔ DỤNG.

**Giải pháp**:

1. **Dots → Mini bars**: Thay dots bằng bar nhỏ 4px height × 20px width → rõ ràng hơn
2. **Color-coded bars**: Nếu ngày đủ bữa → green bar. Thiếu bữa → amber. Trống → no bar
3. **Today**: Bold date number + accent underline (amber-500)
4. **Selected**: Circle background (primary/emerald-100)
5. **Has meals**: Mini bar bên dưới date number

#### B. Week View / Day Detail (SC05_step20)

**Nhận xét**:

- Week dots navigation ở top — concept tốt nhưng dots lại NHỎ
- Day detail hiển thị meals theo slot: Bữa Sáng, Bữa Trưa, Bữa Tối
- Meal cards: tên món + calories + protein — thông tin đủ
- NHƯNG: meal cards trông GIỐNG NHAU cho tất cả bữa → visual monotony

**Giải pháp**:

- Mỗi bữa (Sáng/Trưa/Tối) nên có **accent color riêng** hoặc icon riêng:
  - Sáng: ☀️ icon, warm amber accent
  - Trưa: 🌤️ icon, neutral
  - Tối: 🌙 icon, cool blue accent
- Meal slot headers nên prominent hơn (18px/600 weight, có icon bên trái)
- "Thêm món" button trong mỗi slot → hiện tại quá subtle, cần nổi bật hơn

#### C. AI Suggestion (SC05_step15)

**Nhận xét**:

- AI suggestion hiển thị inline trong calendar — positioning OK
- NHƯNG: suggestion card trông GIỐNG HỆT meal card bình thường → user không nhận ra đây là AI suggest
- Thiếu visual indicator "đây là gợi ý AI"

**Giải pháp**:

- AI suggestion card phải có **visual distinction**:
  - Border dashed thay vì solid
  - Background gradient nhẹ (violet-50 → white)
  - "✨ Gợi ý AI" badge ở góc trên phải
  - Accept/Reject buttons rõ ràng

### 5.2 Meal Planner (Add/Edit Meals)

#### A. Planner Overview (SC10 series)

**Nhận xét**:

- Planner view chia 3 sections: Bữa Sáng / Bữa Trưa / Bữa Tối — tốt
- Section headers clickable để chọn slot đích — KHÔNG RÕ RÀNG đây là interactive
- Dish list hiển thị dưới dạng compact cards — tên + kcal + protein
- "Xác nhận" button ở bottom — CTA rõ ràng

**Vấn đề**: Section headers trông như labels tĩnh, không như buttons. User phải đoán click vào đâu để switch slot.

**Giải pháp**:

- Section headers = **tabbed interface** với active/inactive states rõ ràng
- Active tab: bold text + bottom border (2px primary)
- Inactive tab: regular text + no border
- Hoặc: dùng **horizontal scrollable chips** cho meal slots

#### B. Dish Search (SC10_step15)

**Nhận xét**:

- Search input ở top — standard, tốt
- Results list: compact, shows name + kcal + protein
- Empty search state: "Không tìm thấy" — OK nhưng thiếu personality

**Giải pháp**:

- Empty search: thêm illustration + suggestion text ("Thử tìm 'ức gà' hoặc 'yến mạch'")
- Search results nên highlight matched text (bold phần match trong tên món)
- Thêm recent searches ở trạng thái chưa nhập

#### C. Dish Filter (SC10_step32)

**Nhận xét**:

- Filter by meal type (Sáng/Trưa/Tối) — tốt
- Filter chips — xanh khi active — MONO XANH LẠI
- Filter layout compact — ổn cho mobile

**Giải pháp**:

- Filter chips: active = filled primary, inactive = outline slate → OK nếu chỉ 1 level
- NHƯNG nếu có multiple filter dimensions (meal type + ingredient category + calories range) → cần filter panel/sheet

#### D. Budget Display (SC10_step35)

**Nhận xét**:

- Budget bar hiển thị ở đâu đó trong planner — calories remaining
- Thông tin hữu ích nhưng visual treatment quá subtle
- User có thể bỏ qua hoàn toàn

**Giải pháp**:

- Budget bar nên **sticky ở bottom** (trên nút Xác nhận)
- Format: progress bar + "Còn lại: 764 kcal" text
- Khi vượt budget: bar chuyển AMBER → RED + warning text
- Animation khi thêm/bớt món: bar animate smoothly → delight moment

#### E. Delete Dish from Meal (SC05_step25)

**Nhận xét**:

- Delete action hiển thị confirmation — tốt (destructive action cần confirm)
- Confirmation dialog có 2 buttons: Hủy + Xóa (red)
- NHƯNG: Nếu dùng swipe-to-delete trên meal card thì flow NHANH hơn

**Giải pháp**:

- **Swipe-to-reveal**: Swipe left trên meal card → reveal red "Xóa" button
- Tap delete button → remove immediately (với undo toast 3s)
- KHÔNG cần confirmation dialog cho từng món — quá nhiều friction
- **Bài học #8**: Undo > Confirm cho non-critical destructive actions

---

## PHẦN VI: THƯ VIỆN — NGUYÊN LIỆU & MÓN ĂN

> Module thư viện là NƠI USER DÀNH NHIỀU THỜI GIAN NHẤT khi setup ban đầu. Nếu trải nghiệm ở đây tệ, user sẽ BỎ APP trước khi dùng được 1 tuần.

### 6.1 Tab Nguyên liệu (Ingredient List)

#### A. Danh sách nguyên liệu mặc định

**Nhận xét**:

- Có 10 seed ingredients — rất tốt cho onboarding, user không bắt đầu từ trống
- Layout dạng card list vertical — mỗi card hiện tên + thông tin dinh dưỡng per 100g
- Filter và Sort buttons ở header — chức năng tốt

**VẤN ĐỀ NGHIÊM TRỌNG**:

1. **Card design quá "flat"**: Tất cả ingredient cards ĐỒNG DẠNG — cùng height, cùng style, cùng green accent. Khi có 50-100 nguyên liệu, scrolling qua danh sách giống nhau hoàn toàn là **MỘT CỰC HÌNH** cho mắt. Không có gì phân biệt thịt với rau, protein cao với carb cao.

2. **Thiếu visual categorization**: Ức gà (protein), Khoai lang (carb), Dầu olive (fat) — 3 loại thực phẩm HOÀN TOÀN KHÁC NHAU nhưng trông y hệt nhau trong danh sách. User phải ĐỌC text để phân biệt thay vì NHÌN.

3. **Thông tin dinh dưỡng hiển thị quá đều**: Calories, Protein, Carbs, Fat đều hiện cùng kích cỡ, cùng style. Không highlight macro chính (vd: Ức gà nên highlight Protein vì đó là macro DOMINANT).

4. **Thiếu food icon/image**: Text-only cards cho thực phẩm là SAI. Nhìn chữ "Ức gà" kém trực quan hơn nhìn icon gà + chữ.

**Giải pháp chi tiết**:

```
CARD REDESIGN:
┌─────────────────────────────────┐
│ 🍗 Ức gà               165 kcal │  ← Icon + tên + calories nổi bật
│ ─────────────────────────────── │
│ P: 31g ████████████░░  (75%)    │  ← Protein bar NỔI BẬT (Sky-500)
│ C: 0g  ░░░░░░░░░░░░░░  (0%)    │  ← Carb bar (Amber-500) - trống
│ F: 4g  ██░░░░░░░░░░░░░  (22%)  │  ← Fat bar (Rose-400) - nhỏ
│                    per 100g     │
└─────────────────────────────────┘
```

- **Food category icon**: 🍗 thịt, 🥚 trứng, 🌾 ngũ cốc, 🥛 sữa, 🥬 rau, 🐟 cá, 🌰 hạt
- **Dominant macro highlighted**: Card border hoặc left stripe color = macro chính (Sky cho protein-dominant, Amber cho carb-dominant, Rose cho fat-dominant)
- **Mini progress bars**: Thay vì chỉ số, dùng color-coded bars để user NHÌN NHANH tỷ lệ macro
- **Bài học #9**: Trong food/nutrition apps, VISUAL ENCODING (colors, bars, icons) > TEXT ENCODING (numbers). User nhìn macro bar 0.2 giây, đọc "31g protein" mất 1.5 giây.

#### B. Ingredient Search & Filter (SC11_step20, SC11_step22, SC11_step30)

**Nhận xét**:

- Search bar ở top — đúng pattern
- Empty search state hiển thị message "Không tìm thấy" — tốt
- Sort options available — chức năng tốt

**VẤN ĐỀ**:

1. **Search chỉ có text field, thiếu filter chips**: User muốn lọc "chỉ protein cao" hoặc "chỉ rau củ" nhưng phải gõ text → chậm, dễ sai chính tả tiếng Việt (vd: "bong cai" vs "bông cải")

2. **Sort dropdown quá hidden**: Phải tap icon nhỏ để mở sort options. Với danh sách nguyên liệu, sort theo Calories hoặc Protein là HÀNH ĐỘNG RẤT PHỔBIẾN — nên visible hơn.

3. **Empty search state quá nghèo nàn**: Chỉ text "Không tìm thấy" là LƯỜI THIẾT KẾ. User đang tìm nguyên liệu mà không thấy — cần HƯỚNG DẪN tiếp theo.

**Giải pháp**:

- **Filter chips row**: Dưới search bar, thêm horizontal scroll chips: `Tất cả | Protein cao | Carb thấp | Rau củ | Thịt | Cá & Hải sản | Ngũ cốc`
- **Visible sort buttons**: Thay dropdown bằng 2-3 quick sort buttons inline: `Calo ↕ | Protein ↕ | Tên A-Z`
- **Rich empty search state**:

```
     🔍
  Không tìm thấy "bong cai"

  Bạn có ý nói "Bông cải xanh"?    ← Fuzzy suggestion

  [+ Thêm nguyên liệu mới]         ← CTA tạo mới
```

- **Bài học #10**: Empty search state là CƠ HỘI, không phải dead end. Gợi ý spelling, gợi ý tương tự, hoặc CTA tạo mới.

#### C. Ingredient Form — Thêm/Sửa (SC11_step35, SC11_step38)

**Nhận xét**:

- Form hiện tên + thông tin dinh dưỡng (cal, protein, carbs, fat per 100g)
- Validation messages hiện inline (text đỏ) — đúng pattern
- Các fields xếp vertical — OK cho mobile

**VẤN ĐỀ NGHIÊM TRỌNG**:

1. **Form quá dài cho 1 screen**: Tên + Calories + Protein + Carbs + Fat + unit + category. Trên mobile 411dp width, form này BẮT user cuộn. Nếu thêm validation errors, cuộn CÒN DÀI HƠN.

2. **Không có "smart fill"**: User nhập "Ức gà" → app nên GỢI Ý calories/macros từ database chuẩn (USDA, hoặc data Việt Nam). Hiện tại user phải tự tra Google rồi nhập tay → CHẬM, SAI, BỎ CUỘC.

3. **Number inputs dùng type="text"**: Tôi đã thấy trong code review rằng Settings form dùng `type="text"` cho số. Nếu ingredient form cũng vậy → keyboard không hiện numpad → user phải switch keyboard → FRICTION.

4. **Thiếu macro auto-calculation**: Nếu user nhập Calories=165, Protein=31, Carbs=0 → Fat NÊN tự tính: `(165 - 31×4 - 0×4) / 9 = 4.3g`. Đây là toán học cơ bản mà app PHẢI làm giúp user.

5. **Validation messages chỉ là text đỏ nhỏ**: Dễ bỏ qua trên mobile. Cần visual feedback MẠNH hơn — border đỏ, shake animation, scroll to first error.

**Giải pháp**:

- **Gợi ý từ database chuẩn**: Khi user gõ tên → autocomplete dropdown gợi ý từ database → tap chọn → auto-fill macros
- **Auto-calculate remaining macro**: Nhập 3 values → tính value thứ 4 tự động (hoặc highlight nếu tổng calories không khớp)
- **Number input numpad**: Dùng `inputMode="decimal"` thay vì `type="text"` → mobile hiện numpad
- **Progressive disclosure**: Chỉ hiện [Tên] + [Quick macros] ban đầu. Expand "Chi tiết" nếu muốn nhập thêm fiber, sodium, etc.
- **Enhanced validation**:
  - Input border chuyển RED khi error
  - Shake animation nhẹ (200ms)
  - Scroll tự động đến field lỗi đầu tiên
  - Error count badge ở nút Save: "Lưu (2 lỗi)"

- **Bài học #11**: Forms trên mobile phải NGẮN NHẤT CÓ THỂ. Mỗi field thêm vào giảm 10-15% completion rate (theo nghiên cứu của Baymard Institute). Nếu có thể auto-fill hoặc tính toán → LÀM NGAY.

#### D. Ingredient Delete Confirmation (SC11_step55, SC11_step60)

**Nhận xét**:

- Có confirmation dialog khi xóa — đúng (destructive action)
- Dialog có 2 buttons: Hủy + Xóa (red accent)

**VẤN ĐỀ**:

- Xóa nguyên liệu có thể ẢNH HƯỞNG đến các món ăn đang dùng nguyên liệu đó. App có hiện cảnh báo "Nguyên liệu này đang được dùng trong X món" không? Nếu không → data integrity risk.
- Không có undo sau khi xóa (chỉ confirm trước) → user xóa nhầm phải tạo lại từ đầu

**Giải pháp**:

- **Dependency warning**: "⚠️ Nguyên liệu này đang dùng trong: Ức gà áp chảo, Cơm gà. Xóa sẽ ảnh hưởng đến 2 món ăn."
- **Soft delete → Undo 5s**: Thay vì confirm dialog, xóa ngay + toast "Đã xóa Ức gà [Hoàn tác]" trong 5 giây
- **Bài học #12**: Destructive actions ảnh hưởng đến data có relationships PHẢI hiện dependency warning. Đây là UX 101.

### 6.2 Tab Món ăn (Dish List)

#### A. Danh sách món ăn (SC12 series)

**Nhận xét**:

- Layout tương tự ingredient list — card vertical list
- Mỗi card hiện: tên món, calories per serving, protein, meal type tags (Sáng/Trưa/Tối)
- Có rating stars (1-5) — nice touch
- Search + Filter + Sort available

**VẤN ĐỀ**:

1. **Card monotony** (LẠI!): Giống ingredient cards, dish cards đều ĐỒNG DẠNG. 5 món ăn seed data nhìn y hệt nhau. Khi có 30-50 món, scrolling là NHỨC MẮT.

2. **Meal type tags (Sáng/Trưa/Tối) quá subtle**: Tags nhỏ, cùng style, easy to miss. Đây là thông tin CỰC KỲ QUAN TRỌNG (món này ăn bữa nào) nhưng visual weight quá thấp.

3. **Thiếu dish image/thumbnail**: Text-only dish cards là THIẾU SÓT LỚN NHẤT. Ứng dụng nấu ăn mà không có ảnh món ăn giống như app bán hàng không có ảnh sản phẩm.

4. **Rating stars thường bị ignore**: Star rating trên danh sách ít người dùng. Nếu không có đủ data để hiện average rating, nó chỉ chiếm không gian.

**Giải pháp**:

```
DISH CARD REDESIGN:
┌────────────────────────────────────┐
│ ┌──────┐  Ức gà áp chảo            │
│ │ 📸   │  ⭐4.5  |  330 kcal       │  ← Thumbnail + rating + calo
│ │ food │  P:62g  C:0g  F:7g        │  ← Color-coded macros
│ │ photo│  ─────────────────         │
│ └──────┘  [Sáng] [Trưa] [Tối]     │  ← Tags visible, color-coded
└────────────────────────────────────┘
```

- **Dish thumbnail**: Mỗi món nên có ảnh (user chụp, hoặc AI generate, hoặc placeholder illustration theo category)
- **Color-coded meal tags**: Sáng = Amber (☀️), Trưa = Sky (🌤️), Tối = Indigo (🌙) — KHÔNG PHẢI tất cả green
- **Compact macro display**: `P:62g` với Sky color, `C:0g` với Amber, `F:7g` với Rose — nhất quán với color system
- **Bài học #13**: Food apps BẮT BUỘC phải có visual representation (ảnh/icon) cho món ăn. Đây không phải nice-to-have, đây là CORE UX REQUIREMENT. MyFitnessPal, Samsung Health, Yazio — tất cả đều có ảnh.

#### B. Dish Form — Thêm/Sửa (SC12_step35 onwards)

**Nhận xét**:

- Form cho phép thêm tên, meal types, ingredients list, servings
- Ingredient search trong form (nested search) — chức năng tốt
- Validation inline — tốt

**VẤN ĐỀ**:

1. **Form CỰC KỲ DÀI**: Tên + Mô tả + Meal types + Ingredients (add/remove) + Servings + Rating. Trên mobile, form này có thể kéo dài 3-4 viewport heights. User CUỘN MÃI KHÔNG THẤY nút Save.

2. **Nested ingredient search**: Trong form thêm món, phải search và chọn từng nguyên liệu → mỗi ingredient cần: chọn + nhập lượng (grams). Với 1 món có 5-7 nguyên liệu, đó là 10-14 interactions CHỈCHO phần ingredients.

3. **Không có recipe mode**: User muốn nhập "2 miếng ức gà, 1 thìa dầu ô liu, 100g bông cải" nhưng phải search + add từng cái → quá chậm. Cần quick input mode.

4. **Thiếu "nhân đôi món"**: User có "Ức gà áp chảo" muốn tạo "Ức gà nướng" (gần giống) → phải tạo lại từ đầu thay vì duplicate & edit.

**Giải pháp**:

- **Multi-step form wizard**: Chia thành 3 steps:
  - Step 1: Tên + Mô tả + Ảnh + Meal types (30s)
  - Step 2: Ingredients — Quick add mode + search mode (60s)
  - Step 3: Review + Save (10s)
- **Quick ingredient input**: Textbox tự do: "ức gà 200g, bông cải 150g, dầu ô liu 10g" → app parse tự động (NLP đơn giản) → confirm
- **Duplicate dish action**: Trong context menu của dish card, thêm "Nhân đôi" → create copy → edit
- **Sticky Save button**: Nút Save LUÔN visible ở bottom, không bao giờ bị cuộn mất
- **Bài học #14**: Long forms PHẢI được chia thành steps. Mỗi step tối đa 3-5 fields. User cảm thấy "tiến bộ" khi qua mỗi step, thay vì "choáng ngợp" khi thấy form dài 4 screens.

#### C. Dish Validation Edge Cases

**Nhận xét**:

- Screenshot SC11_step45 cho thấy validation border đỏ cho required fields — tốt
- Error messages bằng tiếng Việt — đúng

**VẤN ĐỀ**:

- Validation chỉ trigger khi submit (hoặc blur) — không real-time
- Error text nhỏ, dễ miss trên mobile
- Nếu multiple errors → user phải scroll tìm từng lỗi

**Giải pháp**:

- **Real-time validation**: Validate ngay khi user rời field (onBlur) — không đợi submit
- **Error summary**: Ở top form: "⚠️ 2 lỗi: Tên món bắt buộc, Cần ít nhất 1 nguyên liệu"
- **Auto-scroll to first error**: Khi submit fail → smooth scroll đến error field đầu tiên + focus
- **Bài học #15**: Form validation phải PROACTIVE (ngay khi user rời field), không phải REACTIVE (chỉ khi submit). Proactive validation giảm 50% form abandonment.

---

## PHẦN VII: DINH DƯỠNG & MỤC TIÊU

### 7.1 Nutrition Overview Screens

#### A. Energy Balance Display (SC38 series)

**Nhận xét**:

- Dashboard hiện: Nạp vào (eaten), Tiêu hao (burned), Cân bằng (net)
- Protein tracker: "0g / 150g" với progress bar
- Format đơn giản, dễ đọc

**VẤN ĐỀ NGHIÊM TRỌNG**:

1. **"0" không phải empty state**: Khi chưa có dữ liệu, hiện "Nạp vào 0" là SAI. 0 nghĩa là "user đã log nhưng chưa ăn gì" — khác hoàn toàn với "chưa có data". Cần phân biệt `null` vs `0`.

2. **Protein tracker ĐƠN ĐỘC**: Chỉ hiện protein mà thiếu carbs + fat → user không có full picture. Nếu chỉ hiện 1 macro, user sẽ chỉ focus vào protein và IGNORE carbs/fat → sai lệch dinh dưỡng.

3. **Energy Balance quá đơn giản**: "Nạp vào - Tiêu hao = Cân bằng" là công thức ĐÚNG nhưng hiển thị quá dry. Không có visual feedback (xanh nếu đúng mục tiêu, đỏ nếu vượt, vàng nếu thiếu).

4. **Thiếu "target" context**: Hiện "2091 kcal" nhưng KHÔNG hiện "target: 2091 kcal, đã ăn: 1327 kcal, còn: 764 kcal". User phải TỰ TÍNH trong đầu.

**Giải pháp**:

```
ENERGY BALANCE REDESIGN:
┌────────────────────────────────────────┐
│         Hôm nay bạn đã ăn             │
│    ████████████████░░░░░  63%         │  ← Circular progress
│         1327 / 2091 kcal              │
│         Còn 764 kcal                  │
│                                        │
│  P: 170g/150g ████████████████ 113%   │  ← Sky-500 (vượt → icon ⚠️)
│  C: 125g/241g ████████░░░░░░░  52%   │  ← Amber-500
│  F:  42g/58g  ██████████░░░░░  72%   │  ← Rose-400
│                                        │
│  🔥 Tiêu hao: 350 kcal (tập gym 45') │  ← Burned detail
│  ⚖️ Net: +977 kcal (dưới target ✅)  │  ← Semantic color
└────────────────────────────────────────┘
```

- **Circular progress cho calories**: Thay vì chỉ số, dùng ring chart hiện % đạt target
- **ALL 3 macros visible**: Protein (Sky), Carbs (Amber), Fat (Rose) — luôn hiện đủ
- **Semantic coloring**: Dưới target = Green ✅, đúng target (±5%) = Green ✅, vượt = Amber ⚠️, vượt xa = Red ❌
- **"Còn lại" prominent**: Con số user MUỐN biết nhất là "còn ăn được bao nhiêu" → highlight lớn
- **Bài học #16**: Nutrition dashboard phải trả lời câu hỏi "Tôi còn ăn được gì?" trong 1 GIÂY nhìn. Nếu user phải đọc + tính → FAIL.

#### B. Nutrition Detail / EnergyDetailSheet (SC38 series)

**Nhận xét**:

- Bottom sheet mở ra hiện chi tiết BMR, TDEE, Target
- Breakdown per meal (Sáng/Trưa/Tối)
- Thông tin chính xác và đầy đủ

**VẤN ĐỀ**:

1. **Quá nhiều số**: BMR=1704, TDEE=2641, Target=2091, Activity Multiplier=1.55, Goal Offset=-550. Đây là thông tin cho nutritionist, KHÔNG PHẢI cho general user. Overwhelming.

2. **Không visual hierarchy**: Tất cả số cùng font size, cùng style. User không biết số nào QUAN TRỌNG NHẤT (Target).

3. **Per-meal breakdown hữu ích nhưng design flat**: "Sáng: 487 kcal, Trưa: 510 kcal, Tối: 330 kcal" — chỉ là text list. Nên có mini chart.

**Giải pháp**:

- **Progressive disclosure**: Mặc định chỉ hiện: `Target: 2091 kcal` + `Eaten: 1327 kcal` + `Remaining: 764 kcal`. Toggle "Xem chi tiết" mở BMR/TDEE/Multiplier.
- **Target số LỚN NHẤT**: `Target: 2091` font-size 32px, bold. Các số khác 14px, muted.
- **Per-meal pie chart hoặc stacked bar**: Thay text list bằng mini donut chart: Sáng (37%), Trưa (38%), Tối (25%)
- **Bài học #17**: Khi hiển thị data phức tạp, dùng "inverted pyramid" — thông tin quan trọng nhất TO NHẤT, ở TRÊN CÙNG. Detail đi xuống dưới, nhỏ dần.

#### C. Edit Goals Screen (SC08_step15)

**Nhận xét**:

- Goal type selection (Giảm cân/Duy trì/Tăng cân) — card-based
- Rate selection (Conservative/Moderate/Aggressive)
- Preview of calorie offset

**VẤN ĐỀ**:

1. **Cards selection ĐÚNG pattern nhưng sai visual weight**: 3 goal cards trông y hệt nhau trước khi chọn. Nên có icon/color khác nhau cho mỗi goal.

2. **Rate names quá technical**: "Conservative", "Moderate", "Aggressive" — user Việt Nam sẽ confuse. Cần ngôn ngữ dễ hiểu hơn.

3. **Calorie offset hiển thị RAW number**: "-550 kcal" — ý nghĩa là gì? Giảm mỗi ngày? Mỗi tuần? Không có context.

**Giải pháp**:

- **Goal-specific colors & icons**:
  - Giảm cân: 🔽 + Rose-500 accent — "giảm" = warm/warning tone
  - Duy trì: ⚖️ + Emerald-500 accent — "cân bằng" = primary brand
  - Tăng cân: 🔼 + Sky-500 accent — "tăng" = cool/positive tone

- **Friendly rate names**:
  - Conservative → "Từ từ, bền vững" (0.25kg/tuần)
  - Moderate → "Vừa phải, cân bằng" (0.5kg/tuần)
  - Aggressive → "Nhanh, quyết liệt" (1kg/tuần)
  - Kèm subtitle: "Giảm ~0.5kg/tuần → ~2kg/tháng"

- **Offset context**: Thay "-550 kcal" bằng "Ăn ít hơn 550 kcal/ngày so với TDEE → giảm ~0.5kg/tuần"

- **Bài học #18**: Technical numbers PHẢI kèm theo "human translation". User không hiểu "-550 kcal offset" nhưng hiểu "ăn ít hơn để giảm 0.5kg/tuần".

---

## PHẦN VIII: TẬP LUYỆN — TOÀN BỘ MODULE FITNESS

> Module fitness là module PHỨC TẠP NHẤT trong app. Nó có: Training Profile, Workout Plans, Exercise Editor, Workout Logger, Workout Session, và Statistics/Progress. Tôi sẽ đánh giá TỪNG CÁI.

### 8.1 Training Profile Form (SC20 series)

#### A. Form Overview

**Nhận xét**:

- Form rất dài: Mục tiêu tập, Kinh nghiệm, Ngày tập, Thời lượng, Thiết bị, Giấc ngủ, Nâng cao (muscle groups)
- Card-based selection cho một số fields (mục tiêu, kinh nghiệm)
- Toggle chips cho muscle groups
- Validation inline

**VẤN ĐỀ CRITICAL**:

1. **FORM DÀI VÔ TẬN**: Training profile form scroll ít nhất 4-5 viewport heights. Đây là CƠN ÁC MỘNG UX trên mobile. User sẽ BỎ CUỘC giữa chừng. Tôi đếm ít nhất 8 sections trong form này — mỗi section có 2-4 options. Tổng: ~20 interactions để hoàn thành. KHÔNG AI có kiên nhẫn làm điều này trên điện thoại.

2. **Muscle group toggles PACKED QUÁ CHẶT**: Screenshot SC20_step22 cho thấy muscle group chips xếp sát nhau. Trên 411dp width, có thể có 3-4 chips per row. Touch target cho mỗi chip chắc chắn < 44dp (Apple HIG minimum). User ngón tay to sẽ tap NHẦM liên tục.

3. **Sleep input quá chi tiết cho fitness app**: Hỏi giờ ngủ, chất lượng ngủ trong training PROFILE? Đây là information OVERLOAD. Sleep tracking nên là feature RIÊNG, không nhồi vào training form.

4. **"Nâng cao" section mở mặc định**: Nếu có section "Nâng cao" → nó phải ĐÓNG mặc định. Mở sẵn = bắt user MỚI nhìn thấy complexity → sợ → bỏ.

**Giải pháp**:

- **Chia thành 3 steps (WIZARD)**:
  - Step 1: Mục tiêu + Kinh nghiệm (2 questions — 15 giây)
  - Step 2: Lịch tập + Thiết bị (2 questions — 15 giây)
  - Step 3: (Optional) Nâng cao — muscle focus, sleep, duration
- **Muscle group UI redesign**: Thay chips bằng **body map illustration** (hình người, tap vào vùng cơ). Trực quan hơn 10 lần so với đọc text "Ngực", "Vai", "Tay trước".

- **Collapsible "Nâng cao"**: `▶ Nâng cao (tùy chọn)` — collapsed mặc định. Chỉ enthusiasts mới mở.

- **Progress indicator**: Thanh tiến trình ở top: `Step 1/3 ████░░ 33%`

- **Bài học #19**: Long forms trên mobile PHẢI dùng wizard pattern. Nguyên tắc: mỗi step ≤ 2 questions. User THẤY tiến trình → motivated tiếp tục. Form dài không progress bar → abandoned rate 60%+.

#### B. Training Days — Min 2 Days Validation (SC20_step28)

**Nhận xét**:

- Chọn ngày tập bằng toggle buttons (T2-CN)
- Validation "Chọn ít nhất 2 ngày" khi chọn < 2

**VẤN ĐỀ**:

- Day toggles (T2, T3, T4, T5, T6, T7, CN) xếp HÀNG NGANG. Trên 411dp, 7 buttons mỗi cái ~52dp width. Chật nhưng chấp nhận được.
- NHƯNG: Khi chọn 6/7 ngày → visual feedback quá subtle. Chỉ là viền xanh vs không viền. Nên có fill color rõ hơn.
- Error message "Chọn ít nhất 2 ngày" xuất hiện ở đâu? Nếu ở cuối form → user có thể không thấy.

**Giải pháp**:

- **Selected state rõ ràng**: Chọn = solid green fill + white text. Không chọn = transparent + gray text. Hiện tại sự khác biệt quá nhỏ.
- **Error ngay dưới field**: Không phải cuối form. Red text ngay dưới day toggles row.
- **Smart suggestion**: "Bạn mới bắt đầu? Gợi ý: T2, T4, T6 (3 ngày/tuần)" — giúp user mới không biết chọn gì.

#### C. Cycle Weeks & Submit States (SC20_step32, SC20_step35)

**Nhận xét**:

- Cycle weeks selector cho training plan duration
- Submit button states (enabled/disabled)

**VẤN ĐỀ**:

- "Số tuần chu kỳ" là CONCEPT phức tạp cho casual user. Hầu hết người tập gym casual KHÔNG BIẾT "mesocycle", "microcycle" là gì.
- Nếu user không hiểu → họ chọn random → plan không phù hợp → kết quả tệ → đổ lỗi app

**Giải pháp**:

- **Friendly labels**: Thay "Số tuần chu kỳ: 4" bằng:
  - "Kế hoạch 4 tuần (phổ biến — phù hợp cho hầu hết mọi người)"
  - "Kế hoạch 8 tuần (cho người có kinh nghiệm)"
  - "Kế hoạch 12 tuần (nghiêm túc — cần kỷ luật cao)"
- **Default rõ ràng**: Pre-select "4 tuần" với badge "Khuyến nghị"
- **Tooltip/info**: Icon ℹ️ bên cạnh → bottom sheet giải thích ngắn "Chu kỳ tập là gì?"
- **Bài học #20**: Fitness terminology alienates 90% casual users. LUÔN dùng plain language + giải thích. "Mesocycle 4 weeks" → "Kế hoạch 4 tuần".

### 8.2 Workout Plans (SC26 series)

#### A. Plan Overview — Day Cards (SC26_step30, SC26_step35, SC26_step40)

**Nhận xét**:

- Hiển thị 7 ngày (Day 1 → Day 7)
- Mỗi ngày hiện: workout type (Push/Pull/Legs/Rest), exercises list, muscle group badges
- Day 7 = rest day — hiện khác biệt
- Streak dots ở đâu đó

**VẤN ĐỀ**:

1. **Information density QUÁ CAO**: Mỗi day card hiện 4-6 exercises + muscle groups + type. 7 cards trong 1 screen = user OVERWHELMED. Không ai cần xem CHI TIẾT cả 7 ngày CÙNG LÚC.

2. **Thiếu "today" highlight**: Ngày hôm nay nên NỔI BẬT nhất. Nhưng trong screenshots, tất cả day cards trông GIỐNG NHAU. User phải TÌM ngày hôm nay giữa 7 cards — WTF?

3. **Rest day (Day 7) quá plain**: "Nghỉ ngơi" card chỉ có text. Đây là CƠ HỘI thiết kế: hiện tips phục hồi, stretching suggestions, motivation quote.

4. **Muscle group badges quá nhỏ và nhiều**: Nếu 1 workout có Push (Chest, Shoulders, Triceps) = 3 badges. 3 workouts = 9 badges. Visual noise.

**Giải pháp**:

```
PLAN VIEW REDESIGN:
┌────────────────────────────────────┐
│  [T2] [T3] [T4] [T5] [T6] [T7] [CN] │  ← Day selector (horizontal)
│        ↑ TODAY (enlarged, primary)     │
│                                        │
│  ┌── HÔM NAY: Push Day ──────────┐   │
│  │                                │   │  ← LARGE, focused card
│  │  💪 Ngực + Vai + Tay sau       │   │
│  │                                │   │
│  │  1. Bench Press — 4×10         │   │
│  │  2. OHP — 3×12                 │   │
│  │  3. Lateral Raise — 3×15       │   │
│  │  4. Tricep Dips — 3×12         │   │
│  │                                │   │
│  │  [🏋️ Bắt đầu tập]            │   │
│  └────────────────────────────────┘   │
│                                        │
│  Tomorrow: Pull Day (Lưng + Tay trước) │  ← Small preview
└────────────────────────────────────────┘
```

- **Day selector tabs**: Horizontal tabs thay vì vertical list. TODAY tab enlarged + primary color
- **Focus on TODAY**: Chỉ hiện chi tiết ngày hôm nay. Các ngày khác là mini preview
- **CTA "Bắt đầu tập" prominent**: Button lớn, primary, bottom of today card
- **Tomorrow preview**: Small text preview → swipe sang → full detail
- **Rest day enrichment**: Tips, stretching video links, motivational content
- **Bài học #21**: Fitness plan UI phải answer "Hôm nay tập gì?" trong 1 GIÂY. Hiện chi tiết cả tuần = information architecture FAIL. Focus on today, preview tomorrow, hide rest.

#### B. Regenerate Plan Modal (SC26_step56)

**Nhận xét CRITICAL**:

- Modal hỏi xác nhận tạo lại kế hoạch
- **BUG NGHIÊM TRỌNG**: Từ screenshot, confirm button dường như bị CẮT hoặc ẨN ở cạnh phải. User CÓ THỂ KHÔNG TAP ĐƯỢC button.

**VẤN ĐỀ CRITICAL**:

- Nếu button bị crop/overflow → user STUCK, không thể proceed
- Modal width có thể quá hẹp cho Vietnamese text dài ("Bạn có chắc muốn tạo lại kế hoạch?" + 2 buttons)
- Đây là BLOCKING BUG, không phải design issue

**Giải pháp**:

- **Test modal ở max Vietnamese text length**: Vietnamese text dài hơn English ~20-30%. Modal width phải accommodate.
- **Buttons stacked vertically khi space hẹp**: Thay vì side-by-side, stack buttons:
  ```
  [  Tạo lại kế hoạch  ]  ← Full width, primary
  [      Hủy bỏ        ]  ← Full width, ghost
  ```
- **Max-width: min(90vw, 400px)**: Modal không bao giờ vượt quá 90% viewport width
- **Bài học #22**: LUÔN test UI với Vietnamese text dài nhất có thể. Vietnamese sentences thường dài hơn English 20-30%. Nếu design chỉ test với English → OVERFLOW khi localize.

#### C. Exercises Expanded View (SC26_step45)

**Nhận xét**:

- Exercise list expanded hiện: tên bài tập, sets × reps, muscle group tags
- Có thể expandable/collapsible

**VẤN ĐỀ**:

- Exercise names dài (tiếng Việt): "Đẩy ngực ngang ghế phẳng" vs "Bench Press". Truncation risk.
- Sets × Reps format: "4×10" — OK cho người biết gym, nhưng newbie có thể confuse "×" là gì
- Thiếu exercise illustration/video link — user MỚI không biết bài tập nào là bài nào

**Giải pháp**:

- **Exercise illustration thumbnails**: Mỗi exercise có mini GIF hoặc static illustration (dùng exercise illustration APIs miễn phí)
- **Friendly format**: Thay "4×10" bằng "4 hiệp × 10 lần" cho first-time display. Sau khi user quen, toggle sang compact "4×10"
- **Tap to learn**: Tap exercise → bottom sheet hiện: illustration + form tips + muscles worked + video link
- **Bài học #23**: Fitness app phục vụ cả newbies lẫn experienced lifters. Design PHẢI accommodate cả hai. Default = friendly (newbie), toggle = compact (expert).

#### D. Streak Dots (SC26_step50)

**Nhận xét**:

- Streak dots hiện training consistency (hôm nay, hôm qua, tuần này...)
- Dots nhỏ, xếp hàng

**VẤN ĐỀ**:

- Dots QUÁ NHỎ — có thể < 6dp. Trên mobile density 420, đây là gần như invisible
- Green dots on green-ish background → low contrast
- Streak count ("🔥 7 ngày liên tiếp") — hiện ở đâu? Nếu chỉ dots mà không có số → user phải đếm dots

**Giải pháp**:

- **Streak number prominent**: "🔥 7" — số lớn + fire icon
- **Dots minimum 8dp**: Đủ để nhìn rõ trên mọi device
- **Color variation**: Ngày tập = filled green dot, Ngày nghỉ = gray dot, Hôm nay = larger pulsing dot
- **Dots hàng ngang MAX 7 (1 tuần)**: Hiện tuần hiện tại. Swipe sang tuần trước.
- **Bài học #24**: Streak visualization PHẢI có NUMBER prominent. Dots là supplement, không phải primary. "🔥 7 ngày" motivate hơn 7 chấm xanh.

### 8.3 Exercise Editor (SC42 series)

#### A. Editor Opened (SC42_step02)

**Nhận xét**:

- Exercise list với drag handles — reorder enabled
- Each exercise hiện tên + muscle group
- "Thêm bài tập" button ở bottom

**VẤN ĐỀ**:

- Drag handles (☰ icon) nhỏ, hard to grab on mobile
- Reorder UX: user phải long-press + drag + drop. TRÊN MOBILE, drag-and-drop là PAIN POINT lớn nhất. Ngón tay che element, không thấy drop target.

**Giải pháp**:

- **Move up/down buttons thay drag**: Mỗi exercise có ↑ ↓ buttons ở phải. Tap = move 1 position. CHÍNH XÁC hơn drag.
- **Drag chỉ là secondary**: Giữ drag cho power users, nhưng ↑ ↓ là primary reorder method
- **Bài học #25**: Drag-and-drop trên mobile phone KHÔNG ĐÁNG TIN. Luôn có alternative (↑ ↓ buttons). Drag OK trên tablet/desktop, but PHONE = ngón tay quá lớn so với target.

#### B. Remove Toast (SC42_step03)

**Nhận xét**:

- Xóa exercise → toast ở bottom "Đã xóa [tên]"
- Có thể có Undo button trong toast

**VẤN ĐỀ**:

- Toast duration? Nếu < 3 giây → user có thể miss undo opportunity
- Toast position ở bottom → nếu bottom nav visible → overlap?

**Giải pháp**:

- **Toast duration = 5 giây** cho destructive actions (xóa)
- **Toast position**: Bottom, nhưng trên bottom nav (16dp margin above nav)
- **Undo button trong toast**: "Đã xóa Bench Press [Hoàn tác]" — "Hoàn tác" là tappable text/button
- **Bài học #26**: Undo toast cho destructive actions: 5 giây minimum, undo button PHẢI dễ tap (44dp height minimum).

#### C. Empty State (SC42_step05)

**Nhận xét**:

- Xóa hết exercises → hiện text "Chưa có bài tập"
- Centered text, minimal design

**VẤN ĐỀ**:

- QUÁNGHÈO NÀN. Chỉ text trắng trên background. Không icon, không illustration, không guidance.
- User mới nhìn vào đây sẽ nghĩ "app bị lỗi" thay vì "cần thêm exercises"

**Giải pháp**:

```
┌────────────────────────────┐
│                            │
│       🏋️‍♂️                │  ← Illustration/icon lớn
│                            │
│   Chưa có bài tập nào      │  ← Title
│   Thêm bài tập để bắt đầu │  ← Subtitle
│   xây dựng workout hôm nay │
│                            │
│   [+ Thêm bài tập]         │  ← Primary CTA
│                            │
└────────────────────────────┘
```

- **Illustration**: Dùng Lucide icon lớn (64px) hoặc custom illustration
- **Guidance text**: Giải thích ngắn user cần làm gì
- **CTA button**: Primary, dễ thấy, dễ tap
- **Bài học #27**: Empty states là FIRST IMPRESSION. Nếu nhìn chán, user sẽ đóng app. Empty state PHẢI: 1) Icon/illustration, 2) Title rõ ràng, 3) Subtitle hướng dẫn, 4) CTA button.

#### D. Exercise Selector (SC42_step06)

**Nhận xét**:

- Bottom sheet với exercise list
- Mỗi exercise hiện: tên + muscle group tags
- Scrollable list

**VẤN ĐỀ**:

- Danh sách exercises dài → scroll mỏi. Thiếu search/filter trong selector
- Muscle group tags nhỏ, text-only
- Không có "recently used" section → user phải tìm lại exercises đã dùng trước đó

**Giải pháp**:

- **Search bar ở top selector**: Gõ "bench" → filter ngay
- **"Gần đây" section**: Top 5 exercises recently used → quick re-add
- **Category tabs**: `Ngực | Lưng | Vai | Chân | Core | Tay` — filter by muscle group
- **Exercise thumbnail**: Mini icon cho mỗi exercise type (barbell, dumbbell, machine, bodyweight)

#### E. Unsaved Changes Dialog (SC42_step10)

**Nhận xét**:

- 3 buttons: "Lưu & quay lại", "Bỏ thay đổi", "Ở lại chỉnh sửa"
- Good pattern — cover cả 3 user intents

**VẤN ĐỀ**:

- 3 buttons trong dialog = DECISION PARALYSIS. User phải đọc 3 options, hiểu ý nghĩa, rồi chọn. Trên mobile, 3 buttons có thể stack vertical → dialog cao → visual weight lớn.
- Button text có thể dài quá cho button width (Vietnamese text dài)

**Giải pháp**:

- **Giữ 3 buttons NHƯNG visual hierarchy rõ**:
  - "Lưu & quay lại" = Primary button (green, solid) — ĐÂY là action user MUỐN nhất
  - "Bỏ thay đổi" = Destructive (red text, outline) — cảnh báo
  - "Ở lại chỉnh sửa" = Ghost/text button — subtle, cho user muốn tiếp tục
- **Stack vertical**: 3 buttons stacked, full-width, 48dp height each
- **Default focus trên "Lưu"**: Nếu user tap back accidentally, default action = save (safe choice)

### 8.4 Workout Session Logging (SC43 series)

#### A. Add Session Modal (SC43_step02)

**Nhận xét**:

- Modal cho phép chọn date + exercises để log workout
- Exercise selector tương tự SC42

**VẤN ĐỀ**:

- Modal approach cho "add workout session" là ĐÚNG
- Nhưng modal có quá nhiều steps: chọn date → chọn exercises → confirm. Nên streamline.
- Date picker: mặc định hôm nay? Nếu không → thêm 1 step không cần thiết cho 90% cases (tập hôm nay log hôm nay).

**Giải pháp**:

- **Default date = TODAY**: Pre-filled, user chỉ đổi nếu cần log ngày khác
- **Quick start**: "Bắt đầu tập hôm nay" → mở ngay exercise logging, skip date selection
- **Bài học #28**: Pre-fill defaults cho trường hợp phổ biến nhất. 90% users log workout cho NGÀY HÔM NAY → default = today. Đừng bắt user chọn date mỗi lần.

#### B. Set Logging UI (SC43_step06, SC43_step08)

**Nhận xét**:

- Compact row layout: Reps + Weight per set
- Multiple sets visible
- "Thêm set" button

**VẤN ĐỀ NGHIÊM TRỌNG**:

1. **Input fields QUÁ NHỎ**: Reps và Weight inputs trên cùng 1 row, trên 411dp screen. Nếu mỗi input ~100dp width → touch target nhỏ, keyboard covers inputs.

2. **Number keyboard PHẢI mở mặc định**: Reps = integer, Weight = decimal. Input PHẢI trigger numpad, không phải text keyboard.

3. **Thiếu "copy previous set"**: Khi tập gym, set 1 thường = set 2 = set 3 (cùng weight, cùng reps). User phải NHẬP LẠI mỗi set → tedious. Cần "copy set trước" 1-tap.

4. **Thiếu "quick reps counter"**: Thay vì gõ số, có thể dùng stepper (+/-) cho reps. Gym thường tập 8-15 reps → stepper nhanh hơn keyboard.

**Giải pháp**:

```
SET ROW REDESIGN:
┌────────────────────────────────────────┐
│ Set 1  │  [  10 lần  ▼▲]  [  80 kg  ] │  ← Stepper + numpad
│ Set 2  │  [  = Set 1     ]            │  ← "Copy set trước" button
│ Set 3  │  [  10 lần  ▼▲]  [  75 kg  ] │  ← Giảm weight set 3
│ [+ Thêm set]                           │
└────────────────────────────────────────┘
```

- **Reps stepper**: ▼ ▲ buttons bên cạnh number input. Tap + = tăng 1. Long press = tăng nhanh.
- **Weight numpad**: Tap input → numpad popup (không phải full keyboard)
- **"= Set trước" button**: 1 tap → copy reps + weight từ set trước
- **Swipe to delete set**: Swipe left → remove set (with undo)
- **Bài học #29**: Workout logging phải tối ưu cho SPEED. Mỗi giây chậm = user quay lại dùng notebook giấy. Stepper > keyboard cho small numbers (1-30). Copy previous > re-type cho repeated sets.

#### C. Workout Types — Cycling, Swimming, Manual (SC40 series)

**Nhận xét**:

- Hỗ trợ nhiều loại workout: Cycling, Swimming, Manual entry
- Mỗi loại có form fields khác nhau (distance, duration, intensity...)
- Có stopwatch feature

**VẤN ĐỀ**:

1. **Switching between workout types PHẢI smooth**: Nếu user chọn nhầm type → switch → form fields thay đổi → DATA đã nhập có giữ không? Nếu mất → frustration lớn.

2. **Stopwatch UX**: Timer counting cần: large display, start/pause/stop buttons rõ. Nếu user lock screen → timer vẫn chạy? Nếu không → useless.

3. **Calorie estimation**: Cycling 30 phút calories khác Swimming 30 phút. App tính tự động hay user nhập tay? Nếu auto → cần hiện công thức (transparency). Nếu manual → tedious.

**Giải pháp**:

- **Confirm khi switch type**: "Bạn đang nhập Cycling. Chuyển sang Swimming sẽ xóa dữ liệu đã nhập. Tiếp tục?"
- **Persistent timer**: Dùng background service (Capacitor Background Runner) để timer chạy khi screen locked
- **Auto calorie estimate + editable**: Auto-calculate hiện "≈ 350 kcal" + "Chỉnh sửa" link. User tin auto → keep. Không tin → edit.
- **Bài học #30**: Khi form context changes (switch workout type), LUÔN warn nếu sẽ mất data. Và auto-save draft nếu có thể.

### 8.5 Statistics & Progress (SC30 series)

#### A. Hero Card (SC30_step05)

**Nhận xét**:

- Green gradient hero card ở top
- Hiện: tổng workouts, streak, time
- "+0%" khi không có data

**VẤN ĐỀ**:

1. **"+0%" với no data = MISLEADING**: "+0%" implies "không thay đổi so với tuần trước" — nhưng thực tế là KHÔNG CÓ DATA. Nên hiện "—" hoặc "Chưa có dữ liệu" thay vì "+0%".

2. **Hero card gradient green (LẠI GREEN)**: Module fitness NÊN có accent color riêng để phân biệt với nutrition module. Cả 2 đều xanh = confuse.

3. **Thiếu motivation element**: Hero card chỉ hiện SỐ. Thiếu motivational copy. "Tuần này bạn đã tập 3 buổi — tuyệt vời! 🔥" >> "Workouts: 3"

**Giải pháp**:

- **Contextual hero message**: Dựa trên data, hiện messages khác nhau:
  - 0 sessions: "Hãy bắt đầu tuần mới nào! 💪"
  - 1-2 sessions: "Khởi đầu tốt! Tiếp tục nhé!"
  - 3-4 sessions: "Tuyệt vời! Bạn đang on track! 🔥"
  - 5+ sessions: "BEAST MODE! Bạn là vua/nữ hoàng gym! 👑"
- **No data = "—"**: Không hiện "+0%". Hiện "—" hoặc ẩn metric.
- **Gradient color**: Dùng **Teal/Cyan gradient** cho fitness module (phân biệt với Emerald nutrition)
- **Bài học #31**: Statistics PHẢI handle null vs zero. null (chưa có data) ≠ 0 (có data, value=0). Hiện "0" khi null là LỖI THIẾT KẾ.

#### B. Weight Tracking Card (SC30_step10)

**Nhận xét**:

- Card hiện current weight + change
- Có input CTA "Ghi cân nặng"

**VẤN ĐỀ**:

- Weight change "+0.5kg" — so với khi nào? Tuần trước? Tháng trước? Không có context.
- Thiếu trend visualization (mini sparkline/chart)
- Weight entry CTA nhỏ, subtle

**Giải pháp**:

- **Mini sparkline**: 7-14 data points hiện weight trend ngay trong card
- **Change context**: "+0.5kg so với tuần trước" — PHẢI ghi rõ timeframe
- **Color-coded change**: Goal = giảm cân → +0.5kg = Rose/Red (going wrong direction). Goal = tăng cân → +0.5kg = Green (đúng hướng).
- **Weight entry CTA to hơn**: "📝 Ghi cân nặng hôm nay" — prominent, dễ tap

#### C. 1RM Sheet (SC30_step39)

**Nhận xét**:

- Bottom sheet hiện estimated 1RM cho exercises
- Data dense nhưng functional

**VẤN ĐỀ**:

- 1RM (One Rep Max) là concept cho EXPERIENCED lifters. Casual users sẽ confuse.
- Estimation formula không được hiện → user không biết số này tin cậy cỡ nào

**Giải pháp**:

- **Tooltip giải thích**: "1RM = Trọng lượng tối đa bạn có thể nâng 1 lần. Ước tính dựa trên công thức Epley."
- **Confidence indicator**: "1RM ≈ 100kg (±5kg)" — cho user biết đây là ƯỚC TÍNH, không chính xác tuyệt đối
- **Progression chart**: Mini chart hiện 1RM trend qua thời gian → user thấy "ôi mình mạnh hơn rồi!" → motivation

#### D. Adherence & Sessions Cards (SC30_step15, SC30_step63)

**Nhận xét**:

- Adherence: percentage + progress bar
- Sessions: count per period

**VẤN ĐỀ**:

- "Tuân thủ: 85%" — tuân thủ CÁI GÌ? Kế hoạch tập? Dinh dưỡng? Label không rõ.
- Truncation visible: "Tuân..." — text bị cắt ở cạnh phải. CRITICAL layout bug.

**Giải pháp**:

- **Full label**: "Tuân thủ kế hoạch tập: 85%" — rõ ràng, không viết tắt
- **Fix truncation**: Text KHÔNG BAO GIỜ được bị cắt. Nếu không đủ space → wrap, KHÔNG truncate số liệu quan trọng.
- **Visual milestone**: 85% = gần 100% → hiện thêm "Gần đạt mục tiêu! 🎯"

#### E. Time Range Filters — 1M, All (SC30_step42, SC30_step48)

**Nhận xét**:

- Toggle between "1 tháng" and "Tất cả" time ranges
- Simple toggle, works

**VẤN ĐỀ**:

- Chỉ có 2 options (1M, All) là QUÁ ÍT. User muốn xem: 1 tuần, 1 tháng, 3 tháng, 6 tháng, 1 năm, all.
- Toggle button style quá subtle — giống text link hơn button

**Giải pháp**:

- **Segmented control**: `1T | 1Th | 3Th | 6Th | 1N | Tất cả` — 6 options, segmented buttons
- **Clear active state**: Active segment = solid fill + white text. Inactive = transparent + gray.
- **Bài học #32**: Time range filters phải cover ít nhất 4 periods: short (week/month), medium (quarter), long (year), all. 2 options = quá hạn chế.

#### F. Cycle Progress — No Plan State (SC30_step52)

**Nhận xét**:

- "Chưa có kế hoạch" — text only
- Plain empty state

**VẤN ĐỀ**:

- Giống tất cả empty states khác: QUÁ NGHÈO NÀN
- User ở Statistics tab nhưng không có plan → dead end. Cần CTA rõ ràng.

**Giải pháp**:

```
┌────────────────────────────────┐
│        📋                      │
│  Chưa có kế hoạch tập luyện    │
│  Tạo kế hoạch để theo dõi     │
│  tiến trình của bạn            │
│                                │
│  [+ Tạo kế hoạch tập]          │
└────────────────────────────────┘
```

- **CTA "Tạo kế hoạch"**: Navigate thẳng đến Training Profile form
- **Explain value**: "Tạo kế hoạch để theo dõi tiến trình" — user hiểu TẠI SAO cần tạo plan

#### G. Insights Dismissed (SC30_step73)

**Nhận xét**:

- All insights dismissed → empty insights area
- No content visible

**VẤN ĐỀ**:

- Khi tất cả insights đã dismiss → hiện gì? Blank space? → waste of screen real estate
- Không có cách "xem lại insights đã ẩn"

**Giải pháp**:

- **"Xem insights đã ẩn" link**: User có thể unhide nếu muốn
- **New insight countdown**: "Insights mới sẽ xuất hiện vào thứ Hai" → user biết khi nào có content mới
- **Collapse section**: Nếu empty → collapse insights section, cho cards bên dưới lên

---

## PHẦN IX: TỔNG QUAN (DASHBOARD)

### 9.1 Dashboard Layout (SC38_step05)

**Nhận xét**:

- Greeting card ở top ("Chào buổi sáng!")
- Onboarding checklist (3 steps)
- Energy balance mini
- Protein tracker
- Rest day card
- CTA buttons (Ghi cân nặng, Ghi cardio)
- Weight tracking, Streak
- Nutrition tip (dismissible)
- Bottom nav

**VẤN ĐỀ NGHIÊM TRỌNG**:

1. **QUÁ NHIỀU CARDS trên 1 dashboard**: Tôi đếm ÍT NHẤT 8 distinct sections/cards. Dashboard là nơi user nhìn ĐẦU TIÊN khi mở app — nếu quá crowded, user KHÔNG BIẾT nhìn vào đâu. Dashboard hiện tại giống "thùng rác thông tin" hơn là "bảng điều khiển".

2. **Thiếu PRIORITY**: Greeting card (ít giá trị) chiếm top, trong khi Energy Balance (THÔNG TIN QUAN TRỌNG NHẤT) ở giữa. Vị trí sai.

3. **Onboarding checklist TRÊN dashboard**: Tốt cho first-time, nhưng sau khi complete cả 3 steps → checklist NÊN BIẾN MẤT. Nếu vẫn hiện → waste space.

4. **Rest day card generic**: "Ngủ đủ giấc và uống đủ nước" — mọi người đều biết. Không giá trị thêm.

5. **CTA buttons quá nhiều**: "Ghi cân nặng", "Ghi cardio", "Xem streak" — quá nhiều actions cạnh tranh. User paralysis.

6. **Nutrition tip dismissible nhưng vẫn hiện**: Tip "×" close chỉ ẩn 1 lần hay vĩnh viễn? Nếu quay lại hiện lại → annoying.

**Giải pháp — Dashboard Hierarchy**:

```
DASHBOARD REDESIGN:
┌────────────────────────────────────┐
│  Chào Khánh! 👋                    │  ← Compact greeting (1 dòng)
│                                    │
│  ┌─ TODAY'S NUTRITION ───────────┐ │
│  │  1327 / 2091 kcal  ████████░░ │ │  ← #1 PRIORITY: Nutrition
│  │  Còn 764 kcal                  │ │
│  │  P:170g  C:125g  F:42g        │ │
│  └────────────────────────────────┘ │
│                                    │
│  ┌─ TODAY'S WORKOUT ─────────────┐ │
│  │  Push Day — Ngực + Vai + Tay  │ │  ← #2 PRIORITY: Workout
│  │  4 bài tập | ~45 phút         │ │
│  │  [🏋️ Bắt đầu tập]            │ │
│  └────────────────────────────────┘ │
│                                    │
│  ┌─ QUICK ACTIONS ───────────────┐ │
│  │  📝 Ghi cân nặng  🏃 Cardio  │ │  ← Compact action row
│  └────────────────────────────────┘ │
│                                    │
│  ┌─ WEEKLY SNAPSHOT ─────────────┐ │
│  │  🔥 Streak: 7 | ⚖️ 74.5kg    │ │  ← Compact stats row
│  │  Tuân thủ: 85% ████████░░    │ │
│  └────────────────────────────────┘ │
└────────────────────────────────────┘
```

**Nguyên tắc**:

1. **Nutrition = #1** — user mở app meal planner → muốn biết ăn gì
2. **Today's workout = #2** — nếu có plan
3. **Quick actions = compact** — 1 row, không phải separate cards
4. **Weekly snapshot = compact** — condensed, không chiếm nhiều space
5. **NO greeting card lớn** — waste space. Compact 1 dòng.
6. **NO generic tips** — "uống đủ nước" không cần card riêng
7. **Onboarding checklist DISAPPEAR** sau khi complete

- **Bài học #33**: Dashboard = EXECUTIVE SUMMARY, không phải ENCYCLOPEDIA. Tối đa 4 sections. Mỗi section trả lời 1 câu hỏi: "Hôm nay ăn gì?", "Hôm nay tập gì?", "Tuần này thế nào?", "Cần làm gì?".

---

## PHẦN X: PHÂN TÍCH AI

### 10.1 AI Analysis Tab (SC38_step03)

**Nhận xét**:

- Tab "Phân tích" riêng biệt — đúng pattern
- AI analysis interface

**VẤN ĐỀ**:

1. **AI tab QUÁTRỐNG**: Nếu chưa có data để phân tích → empty state cần hấp dẫn hơn
2. **AI feature = advanced** — casual users có thể confuse "Phân tích AI là gì?"
3. **AI analysis cần THỜI GIAN**: Nếu phân tích mất 5-10 giây → cần loading state hấp dẫn, không phải spinner đơn giản

**Giải pháp**:

- **AI tab icon + label riêng biệt**: Dùng icon ✨ hoặc 🤖 — phân biệt với other tabs
- **Onboarding cho AI tab**: First visit → bottom sheet: "AI sẽ phân tích dinh dưỡng và tập luyện để đưa ra gợi ý cá nhân. Cần ít nhất 3 ngày data."
- **Skeleton loading**: Khi analyzing → hiện skeleton cards pulse animation (giống Facebook loading) — user BIẾT nội dung đang load, không phải app treo
- **AI accent color = Violet**: Toàn bộ AI module dùng Violet/Purple accent — phân biệt rõ ràng khỏi Nutrition (Green) và Fitness (Teal)
- **Bài học #34**: AI features cần ONBOARDING RIÊNG. User không biết AI làm gì, cần bao nhiêu data, kết quả có tin cậy không. First-time explanation CRITICAL.

---

## PHẦN XI: CÀI ĐẶT & DARK MODE

### 11.1 Settings Page

**Nhận xét**:

- Settings có multiple sections: Health Profile, Goal, Training Profile
- Detail views cho mỗi section (read mode + edit mode)
- "Chỉnh sửa" button để switch mode

**VẤN ĐỀ**:

1. **Navigation PHỨC TẠP**: Settings → section → read mode → edit mode → save/cancel → back to section → back to settings. Đó là 4-5 levels. Quá sâu cho mobile.

2. **"Chỉnh sửa" button ẨN**: Có NHIỀU instances trong DOM (6 cái), phần lớn invisible. User phải scroll tìm "Chỉnh sửa" visible.

3. **Settings detail save → STUCK ở detail view**: Sau khi save, app ở detail view, không tự quay về list. User phải tap close rồi reopen nếu muốn edit section khác.

4. **Input type="text" cho numbers**: Health Profile dùng `type="text"` cho height/weight → full keyboard thay vì numpad. FRICTION không cần thiết.

**Giải pháp**:

- **Flatten navigation**: Settings → tap section → NGAY LẬP TỨC edit mode (skip read mode). Ai vào settings = MUỐN THAY ĐỔI, không phải xem. Read-only mode cho Settings là REDUNDANT.
- **Auto-close detail sau save**: Save → success toast → auto-navigate back to settings list (1 giây delay)
- **Number inputs**: `inputMode="decimal"` cho weight/height. `inputMode="numeric"` cho tuổi.
- **Bài học #35**: Settings trên mobile phải FLAT. Không quá 2 levels deep. Tap section = edit section. Save = back to list. DONE.

### 11.2 Dark Mode (SC14 series)

**Nhận xét**:

- Dark mode support — backgrounds tối, text sáng
- Cards có dark surface
- Green primary vẫn giữ

**VẤN ĐỀ**:

1. **Contrast issues**: Một số card areas có text xám trên nền tối → contrast ratio có thể < 4.5:1 (WCAG AA fail). Đặc biệt secondary text.

2. **Green primary QUÁ SÁNG trên dark**: Emerald-600 (#059669) trên Slate-900 → contrast ok nhưng CHÓI MẮT trong dark environment. Cần giảm saturation.

3. **Image/illustration backgrounds**: Nếu có ảnh (dish photos tương lai) → dark mode cần tonal overlay để ảnh không "hét" trên dark background.

4. **Border visibility**: Card borders subtle trong light mode → INVISIBLE trong dark mode nếu dùng cùng opacity.

**Giải pháp**:

```css
/* Dark mode color adjustments */
:root.dark {
  --primary: oklch(0.72 0.15 160); /* Emerald-400: sáng hơn, less saturated */
  --card-border: oklch(0.35 0.02 260); /* Visible border on dark surfaces */
  --text-secondary: oklch(0.65 0.02 260); /* Sáng hơn light mode secondary */
  --surface-elevated: oklch(0.22 0.02 260); /* Card nổi lên từ background */
}
```

- **Test WCAG AA cho TẤT CẢ text**: Mỗi text-on-background combo phải ≥ 4.5:1 contrast ratio
- **Reduced saturation primary**: Emerald-400 thay vì Emerald-600 cho dark mode
- **Elevated surfaces**: Cards nên sáng hơn background 1-2 bậc → visual elevation
- **Bài học #36**: Dark mode PHẢI test riêng biệt. Mỗi color combination cần verify contrast ratio. Tool: WebAIM contrast checker. Target: WCAG AA (4.5:1 text, 3:1 large text).

---

## PHẦN XII: MODAL, DIALOG & BOTTOM SHEET

### 12.1 Confirmation Dialogs

**Nhận xét**:

- Destructive actions (delete ingredient, delete dish, regenerate plan) có confirmation
- 2-button pattern: Hủy + Action (red)
- Some dialogs 3 buttons (unsaved changes)

**VẤN ĐỀ XUYÊN SUỐT**:

1. **BUTTON TEXT QUÁ DÀI**: Vietnamese text dài hơn English. "Chuyển thành ngày nghỉ" là 22 chars cho 1 button → OVERFLOW trên dialog width ~320dp. Đây là BUG đã được phát hiện trong code review nhưng CÓ THỂ vẫn còn ở một số dialogs chưa fix.

2. **THIẾU NHẤT QUÁN button order**: Có dialog đặt Cancel bên trái + Action bên phải. Có dialog ngược lại. → User phải ĐỌC mỗi lần thay vì dùng muscle memory.

3. **Dialog width không responsive**: Trên 411dp phone OK, nhưng trên 320dp phone nhỏ → overflow. Trên 600dp tablet → dialog quá hẹp.

4. **Backdrop dismiss**: Tap outside dialog = dismiss = CANCEL action? Hay phải tap "Hủy"? Inconsistent behavior.

**Giải pháp**:

- **Button text ≤ 10 chars**: Tạo i18n keys riêng cho button labels. KHÔNG dùng lại title text.
  - "Chuyển thành ngày nghỉ" (title) → "Đồng ý" (button) — 6 chars
  - "Xóa nguyên liệu này?" (title) → "Xóa" (button) — 3 chars

- **Consistent button order**: LUÔN = `[Hủy bỏ]  [Action]` (Cancel left, Action right). KHÔNG BAO GIỜ đảo.

- **Responsive dialog width**: `width: min(90vw, 400px)`. Padding 24dp. Button min-height 48dp.

- **Backdrop tap = dismiss** (same as Cancel). LUÔN consistent.

- **Bài học #37**: Dialog buttons phải SHORT, CONSISTENT, PREDICTABLE. User nhìn dialog → tay TỰ ĐỘNG tap phải (action) hoặc trái (cancel) dựa trên muscle memory. Nếu order thay đổi → MIS-CLICK → data loss.

### 12.2 Bottom Sheets

**Nhận xét**:

- Nhiều features dùng bottom sheets: EnergyDetailSheet, 1RM Sheet, Exercise Selector
- Swipe down to dismiss
- Varying heights

**VẤN ĐỀ**:

1. **Thiếu grab handle indicator**: Bottom sheet nên có `─────` handle bar ở top để user biết "có thể kéo xuống". Nếu thiếu → user không biết dismiss thế nào.

2. **Height inconsistency**: Có sheet chiếm 30% viewport, có sheet chiếm 90%. Không có standard heights.

3. **Background scroll khi sheet mở**: Có bị scroll BEHIND sheet không? Nếu có → distracting.

**Giải pháp**:

- **Grab handle LUÔN CÓ**: `w-32 h-1.5 bg-gray-300 rounded-full mx-auto mt-3` ở top mỗi sheet
- **Standard heights**: Small (30%), Medium (50%), Large (85%). Snap to nearest height khi drag.
- **Background scroll lock**: `body { overflow: hidden }` khi sheet mở
- **Backdrop overlay**: Semi-transparent black backdrop khi sheet mở → focus on sheet content
- **Bài học #38**: Bottom sheets phải có: 1) Grab handle, 2) Backdrop overlay, 3) Scroll lock on body, 4) Swipe dismiss, 5) Tap outside dismiss. Thiếu bất kỳ cái nào = BROKEN sheet.

### 12.3 `<dialog>` Element Issues

**VẤN ĐỀ ĐÃ PHÁT HIỆN** (từ code review):

- 3 fitness components dùng `<dialog open>` nhưng KHÔNG override browser UA defaults
- Kết quả: modal hiển thị sai (nhỏ, lệch, có border) do UA stylesheet: `margin: auto`, `max-width: fit-content`, `border: solid`

**Bài học**: Nếu dùng native `<dialog>`, PHẢI override: `m-0 max-h-none max-w-none border-none h-full w-full p-0`. HOẶC tốt hơn: dùng shared modal component (ModalBackdrop/UnsavedChangesDialog) — tránh reinvent wheel.

---

## PHẦN XIII: EMPTY STATES & EDGE CASES

### 13.1 Đánh giá toàn bộ Empty States

**Nhận xét tổng quát**: Empty states trong app này thuộc loại "FUNCTIONAL BUT SOULLESS" — có tồn tại, thực hiện đúng chức năng cơ bản (hiện text "chưa có X"), nhưng THIẾU HOÀN TOÀN yếu tố thiết kế.

**VẤN ĐỀ TRẦM TRỌNG**:

Tôi đã xem empty states ở:

- Exercise editor empty: "Chưa có bài tập nào" → chỉ text
- Calendar no meals: minimal → chỉ text
- Dashboard no data: "Nạp vào 0" → 0 thay vì "chưa có"
- Statistics no plan: "Chưa có kế hoạch" → chỉ text
- Insights all dismissed: blank → NOTHING
- Search no results: "Không tìm thấy" → chỉ text

**PATTERN LẶP LẠI**: Tất cả empty states đều CHỈ CÓ TEXT. Không icon, không illustration, không guidance rõ ràng, không CTA hấp dẫn.

**Giải pháp hệ thống — Empty State Component chuẩn**:

```tsx
// EmptyState component phải có 4 elements:
<EmptyState
  icon={<DumbbellIcon size={64} />} // 1. ILLUSTRATION/ICON lớn
  title="Chưa có bài tập nào" // 2. TITLE rõ ràng
  description="Thêm bài tập để bắt      // 3. DESCRIPTION hướng dẫn
    đầu workout hôm nay"
  action={
    // 4. CTA BUTTON
    <Button>+ Thêm bài tập</Button>
  }
/>
```

**MỌI empty state PHẢI có đủ 4 elements**:

1. **Icon/Illustration**: Minimum 48px, ideally 64px. Dùng Lucide icons hoặc custom SVG.
2. **Title**: Mô tả trạng thái. Bold, 16px.
3. **Description**: Hướng dẫn user làm gì tiếp. Regular, 14px, muted color.
4. **CTA Button**: Primary action để thoát khỏi empty state.

**Bài học #39**: Empty states là QUẢNG CÁO cho feature. Nếu empty state nhàm chán → user không muốn thử feature. Nếu empty state hấp dẫn → user muốn "fill it up". Đầu tư vào empty states = đầu tư vào feature adoption.

### 13.2 Edge Cases — Security/Boundary

**Nhận xét**:

- SC31_step50: XSS input properly escaped — ✅ EXCELLENT
- SC31_step60: 300-char boundary handled — ✅ GOOD

**Khen ngợi**: Đây là điểm TÍCH CỰC. App xử lý security edge cases đúng cách. XSS escaped, boundary conditions handled. Điều này cho thấy BACKEND/LOGIC team biết việc.

**VẤN ĐỀ UX của boundaries**:

- Khi user nhập 301 chars → điều gì xảy ra? Truncate? Error message? Nếu truncate silently → user mất data mà không biết.

**Giải pháp**:

- **Character counter**: "250/300" hiện khi gần limit
- **Real-time warning**: Khi 280/300 → counter chuyển Orange. 295/300 → Red.
- **Block at limit**: Không cho nhập thêm khi đạt 300. Keyboard input bị ignore.
- **Bài học #40**: Boundaries phải VISIBLE. User PHẢI biết limit TRƯỚC KHI đạt, không phải SAU.

---

## PHẦN XIV: ACCESSIBILITY & INCLUSIVE DESIGN

### 14.1 Touch Target Analysis

**VẤN ĐỀ CRITICAL**:

Dựa trên screenshots, tôi nghi ngờ NHIỀU elements vi phạm minimum touch target:

| Element            | Estimated Size | Minimum Required | Verdict       |
| ------------------ | -------------- | ---------------- | ------------- |
| Calendar day dots  | ~4-6dp         | 48dp (Material)  | ❌ FAIL       |
| Streak dots        | ~6-8dp         | 48dp             | ❌ FAIL       |
| Sort dropdown icon | ~24dp          | 48dp             | ⚠️ BORDERLINE |
| Meal type tags     | ~30dp height   | 48dp             | ⚠️ BORDERLINE |
| Filter chips       | ~32dp height   | 48dp             | ⚠️ BORDERLINE |
| Bottom nav icons   | ~40dp          | 48dp             | ⚠️ CLOSE      |
| Toggle day buttons | ~44dp          | 48dp             | ✅ OK         |
| Card buttons       | ~44dp+         | 48dp             | ✅ OK         |

**Giải pháp**:

- **Minimum 48dp × 48dp** cho MỌI tappable element. Không ngoại lệ.
- **Calendar dots**: Visual size có thể nhỏ nhưng HIT AREA phải 48dp. Dùng `padding: 20px` trên dot element.
- **Streak dots**: Same — visual nhỏ, hit area lớn.
- **Material Design 3 guidelines**: Interactive targets minimum 48dp, recommended 56dp.
- **Bài học #41**: Touch target = HIT AREA, không phải VISUAL SIZE. Dot có thể 6dp nhưng hit area PHẢI 48dp. Dùng `min-width: 48px; min-height: 48px` hoặc `padding` để mở rộng.

### 14.2 Focus Indicators

**VẤN ĐỀ**:

- Không thấy focus indicators trên BẤT KỲ screenshot nào
- Nếu user dùng keyboard navigation (accessibility) → không biết đang ở element nào
- Android TalkBack: focus ring cần visible

**Giải pháp**:

```css
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

- **LUÔN có `:focus-visible`** — KHÔNG dùng `outline: none` trên interactive elements
- **Bài học #42**: focus-visible > focus. `focus` trigger cả khi tap (annoying ring on mobile). `focus-visible` chỉ trigger khi keyboard navigate (đúng mục đích).

### 14.3 Color-only Information

**VẤN ĐỀ**:

- Calendar dots: Có thể chỉ dùng color để phân biệt states (green = has meal, gray = empty)
- Nutrition bars: Nếu chỉ dùng color để phân biệt P/C/F → color blind users cannot distinguish

**Giải pháp**:

- **Luôn kèm TEXT + COLOR**: Nutrition bar xanh + chữ "P: 170g" → OK. Bar xanh KHÔNG CÓ text → FAIL.
- **Pattern differentiation**: Protein bar = solid fill, Carbs bar = diagonal stripes, Fat bar = dots. Color blind users phân biệt bằng PATTERN.
- **Calendar dots + text**: Dot + tiny number "3" (3 meals planned) → OK. Chỉ dot màu → FAIL.
- **Bài học #43**: WCAG 1.4.1: "Color MUST NOT be the only visual means of conveying information." Luôn có secondary indicator (text, pattern, icon, shape).

---

## PHẦN XV: BÀI HỌC THIẾT KẾ TỔNG HỢP

> 50 năm kinh nghiệm, đúc kết thành 43 bài học cụ thể cho team MealPlaning.

### Tổng hợp tất cả Bài học (Summary)

| #   | Bài học                                          | Áp dụng ở đâu                |
| --- | ------------------------------------------------ | ---------------------------- |
| 1   | Luật 60-30-10 color                              | Toàn app — thêm accent color |
| 2   | Mỗi loại data cần màu riêng                      | Nutrition macros (P/C/F)     |
| 3   | Dark mode ≠ đảo màu                              | Dark mode toàn app           |
| 4   | F-pattern reading                                | Onboarding layout            |
| 5   | Fitts' Law: CTA size = importance                | Navigation, buttons          |
| 6   | Icon nên KHÁC NHAU về silhouette                 | Bottom nav icons             |
| 7   | Month grid = overview, Week strip = daily focus  | Calendar                     |
| 8   | Undo > Confirm cho non-critical destructs        | Delete actions               |
| 9   | Visual encoding > text encoding                  | Ingredient cards, nutrition  |
| 10  | Empty search = opportunity                       | Search states                |
| 11  | Mobile forms phải ngắn nhất                      | Ingredient/dish forms        |
| 12  | Destructive + relationships = dependency warning | Delete ingredient            |
| 13  | Food apps PHẢI có images                         | Dish cards                   |
| 14  | Long forms = wizard steps                        | Dish creation                |
| 15  | Proactive > reactive validation                  | All forms                    |
| 16  | Nutrition dashboard = "còn ăn gì?" trong 1s      | Dashboard nutrition          |
| 17  | Inverted pyramid: quan trọng → to + trên         | Detail sheets                |
| 18  | Technical numbers + "human translation"          | Goal settings                |
| 19  | Wizard pattern cho long mobile forms             | Training profile             |
| 20  | Plain language > fitness jargon                  | Cycle weeks, 1RM             |
| 21  | Fitness plan: "hôm nay tập gì?" trong 1s         | Workout plans                |
| 22  | Test UI với Vietnamese text dài nhất             | All modals                   |
| 23  | Accommodate newbies AND experts                  | Exercise views               |
| 24  | Streak NUMBER > dots                             | Streak display               |
| 25  | Move buttons > drag-drop on phone                | Exercise editor              |
| 26  | Undo toast: 5s + easy tap target                 | Remove exercise              |
| 27  | Empty state = icon + title + desc + CTA          | All empty states             |
| 28  | Pre-fill defaults (today's date)                 | Workout logging              |
| 29  | Speed optimization: stepper, copy previous       | Set logging                  |
| 30  | Warn when form context changes                   | Workout type switch          |
| 31  | null ≠ 0 in statistics                           | Hero card, counters          |
| 32  | Time filters: ≥ 4 periods                        | Statistics filters           |
| 33  | Dashboard = executive summary, ≤ 4 sections      | Dashboard layout             |
| 34  | AI features need separate onboarding             | AI tab                       |
| 35  | Settings = flat, ≤ 2 levels                      | Settings navigation          |
| 36  | Dark mode test separately, verify contrast       | Dark mode                    |
| 37  | Dialog buttons: short, consistent order          | All dialogs                  |
| 38  | Bottom sheets: handle + backdrop + scroll lock   | All sheets                   |
| 39  | Empty states = feature advertising               | All empty states             |
| 40  | Boundaries visible BEFORE reaching limit         | Character limits             |
| 41  | Touch target = hit area ≥ 48dp                   | Small elements               |
| 42  | focus-visible > focus                            | Keyboard a11y                |
| 43  | Color ≠ only means of info                       | Nutrition bars, dots         |

---

## PHẦN XVI: BẢNG ĐIỂM ĐÁNH GIÁ TỔNG HỢP

### Điểm theo Module

| Module                    | Điểm (/10) | Issues Count | Priority           |
| ------------------------- | ---------- | ------------ | ------------------ |
| **Color System**          | 3/10       | 12 issues    | 🔴 P0 — Fix NGAY   |
| **Empty States**          | 2.5/10     | 8 issues     | 🔴 P0 — Fix NGAY   |
| **Accessibility**         | 3/10       | 9 issues     | 🔴 P0 — Fix NGAY   |
| **Dashboard Layout**      | 4/10       | 6 issues     | 🟠 P1 — Tuần này   |
| **Training Profile Form** | 3.5/10     | 5 issues     | 🟠 P1 — Tuần này   |
| **Nutrition Display**     | 4.5/10     | 5 issues     | 🟠 P1 — Tuần này   |
| **Workout Plans**         | 4/10       | 7 issues     | 🟠 P1 — Tuần này   |
| **Workout Logging**       | 5/10       | 5 issues     | 🟡 P2 — Sprint này |
| **Statistics/Progress**   | 5.5/10     | 6 issues     | 🟡 P2 — Sprint này |
| **Ingredient Management** | 5/10       | 4 issues     | 🟡 P2 — Sprint này |
| **Dish Management**       | 4.5/10     | 5 issues     | 🟡 P2 — Sprint này |
| **Modals & Dialogs**      | 5.5/10     | 4 issues     | 🟡 P2 — Sprint này |
| **Calendar & Planning**   | 6/10       | 4 issues     | 🟢 P3 — Backlog    |
| **Settings**              | 5.5/10     | 3 issues     | 🟢 P3 — Backlog    |
| **Onboarding**            | 6/10       | 3 issues     | 🟢 P3 — Backlog    |
| **Dark Mode**             | 5/10       | 4 issues     | 🟢 P3 — Backlog    |
| **AI Analysis**           | 4/10       | 3 issues     | 🟢 P3 — Backlog    |

### Điểm tổng hợp cuối cùng

| Tiêu chí                    | Điểm                                         |
| --------------------------- | -------------------------------------------- |
| **Functional Completeness** | 8/10 — App có ĐẦY ĐỦ features                |
| **Visual Design Quality**   | 3.5/10 — Monotone, thiếu personality         |
| **UX Flow Quality**         | 5/10 — Flows đúng nhưng friction cao         |
| **Accessibility**           | 3/10 — Nhiều vi phạm WCAG                    |
| **Consistency**             | 4/10 — Surface consistent, deep inconsistent |
| **Emotional Design**        | 2/10 — Lạnh, máy móc, zero delight           |
| **Mobile Optimization**     | 4.5/10 — Quá nhiều info, forms quá dài       |
| **TỔNG QUAN**               | **4.1/10**                                   |

---

## PHẦN XVII: ROADMAP CẢI THIỆN ĐỀ XUẤT

### Sprint 1 (P0 — Critical)

1. **Color System Overhaul**: Implement 60-30-10 rule. Add Amber accent, semantic colors, macro-specific colors (P:Sky, C:Amber, F:Rose)
2. **Empty State Component**: Create reusable `EmptyState` component với 4 required elements. Apply to ALL empty screens.
3. **Touch Target Audit**: Scan ALL interactive elements. Ensure minimum 48dp hit area. Fix calendar dots, streak dots, filter chips.
4. **WCAG Contrast Audit**: Test ALL text-on-background combinations. Fix any < 4.5:1 ratio.

### Sprint 2 (P1 — Major)

5. **Dashboard Redesign**: Flatten to 4 sections: Today Nutrition, Today Workout, Quick Actions, Weekly Snapshot
6. **Training Profile Wizard**: Break long form into 3-step wizard with progress indicator
7. **Nutrition Display Enhancement**: Add all 3 macros (P/C/F) with individual colors + remaining calories prominent
8. **Workout Plan — Focus Today**: Redesign plan view to focus on TODAY's workout. Other days = previews.

### Sprint 3 (P2 — Moderate)

9. **Workout Logging Speed**: Add reps stepper, "copy previous set", numpad inputs
10. **Statistics Enhancement**: Fix null vs 0 display. Add more time range filters. Contextual messages.
11. **Ingredient/Dish Cards**: Add category icons, color-coded macro bars, (future: photos)
12. **Dialog Standardization**: Consistent button order, max text lengths, responsive width
13. **Form Validation Enhancement**: Real-time validation, error summary, auto-scroll

### Sprint 4 (P3 — Polish)

14. **Calendar Refinements**: Better day highlights, dot accessibility, week/month transition
15. **Settings Flattening**: Remove read-only mode, auto-close after save
16. **Dark Mode Polish**: Verify all contrast ratios, adjust primary saturation
17. **AI Tab Onboarding**: First-time explanation, skeleton loading, violet accent
18. **Dish Photos**: Allow user photo upload or AI-generated placeholder illustrations
19. **Bottom Sheet Standardization**: Grab handles, standard heights, backdrop + scroll lock

### Tương lai (V2+)

20. **Micro-interactions**: Add subtle animations — card expand, progress bar fill, button feedback
21. **Onboarding Redesign**: Shorter flow, skip option for advanced users
22. **Body Map for Muscles**: Interactive SVG body illustration thay vì text chips
23. **Smart Ingredient Fill**: Auto-suggest nutrition values when user types ingredient name
24. **Exercise Illustrations**: Inline GIFs/videos cho mỗi exercise
25. **Motivational System**: Achievements, badges, weekly summary notifications

---

> **Lời kết từ người đánh giá 50 năm kinh nghiệm:**
>
> App MealPlaning có NỀN TẢNG KỸ THUẬT TỐT. Code sạch, logic đúng, security xử lý tốt. Nhưng thiết kế giao diện thì giống như nhà xây xong quên thuê kiến trúc sư nội thất. Mọi thứ HOẠT ĐỘNG nhưng không ai THÍCH DÙNG.
>
> Tin tốt: 80% vấn đề tôi nêu có thể fix trong 4 sprints mà không cần redesign từ đầu. Xương sống tốt — chỉ cần "sơn", "lắp đèn", và "treo tranh".
>
> Ưu tiên số 1: **COLOR SYSTEM**. Giải quyết được monotone green = 50% vấn đề visual đã biến mất.
>
> Ưu tiên số 2: **EMPTY STATES**. Đầu tư vào empty states = đầu tư vào onboarding.
>
> Ưu tiên số 3: **TOUCH TARGETS + ACCESSIBILITY**. Đây là compliance issue, không phải preference.
>
> Hãy quay lại khi đã fix Sprint 1. Tôi sẽ đánh giá lại.
>
> — Senior Design Architect, 50+ năm kinh nghiệm
