---
feature_id: F-03
feature_name: Calendar & Meal Planning
spec_type: ux-design
spec_format: wireflow-text-based
author: Sally (UX Designer, BMAD)
date: 2026-05-09
status: draft
inputs:
  - docs/2-requirements/prd.md (F-03 section, lines 228-313)
  - _bmad-output/planning-artifacts/research/domain-meal-planning-tracking-ux-research-2026-05-09.md
  - docs/3-design/design-system.md
  - docs/3-design/business-rules.md (RULE-PLANNED-DISH-HYBRID)
  - docs/3-design/data-model.md
related_specs:
  - F-04 (Nutrition Tracking & Display) — sẽ viết sau
  - F-05 (AI Image Analysis) — Phase 5+
  - F-06 (AI Menu Suggestions) — Phase 5+
---

# F-03 Calendar & Meal Planning — UX Specification

> 🎨 **Sally's note:** Spec này theo wireflow text-based (ASCII layout overview + text mô tả interaction + state). KHÔNG có pixel mockup. Dev đọc spec này để implement trực tiếp. Mọi quyết định đều có rationale gắn với research findings từ Mary (D0a) hoặc PRD existing.

---

## 1. Overview

**Mục đích:** F-03 là entry point chính cho user "plan trước" và "log thực tế" bữa ăn. Là 1 trong 4 tab chính.

**3 sub-views:**
1. **Day View** (mặc định) — chi tiết 1 ngày, 4 meal-slot, list món
2. **Week View** (toggle) — overview 7 ngày, color indicator + tổng calo
3. **Date Picker Modal** — chuyển ngày nhanh

**2 trạng thái nutrition (Hybrid policy — `RULE-PLANNED-DISH-HYBRID`):**
- `is_completed=0` (chưa ăn) → realtime nutrition
- `is_completed=1` (đã ăn) → snapshot bất biến

**Differentiators (theo research):**
- Free week-view (vs MFP/LoseIt giấu sau paywall)
- Plan vs Log visual distinction (vs hầu hết apps không phân biệt)
- Undo toast khi delete (vs 0/8 apps competitive surveyed)
- KHÔNG có streak, KHÔNG có traffic-light food

---

## 2. Screen 1: Day View (mặc định)

### Layout

```
┌─────────────────────────────────────────┐
│  [Hôm nay ▼]    Thứ 2, 09/05/26    [📅]│  ← Header (sticky top)
│  ◄                                    ► │  ← Swipe hint (optional)
├─────────────────────────────────────────┤
│  ⚪ Calo: 1850 / 2000   ▓▓▓▓▓▓▓░░ 92%  │  ← Daily summary card
│  🥩 Protein 95g  🍞 Carbs 220g  🥑 Fat 60g
├─────────────────────────────────────────┤
│  🍳 Bữa sáng           420 cal    [+]  │  ← Meal slot card (collapsed)
│  ───────────────────────────────────── │
│  • Phở bò (300g)              300 cal  │  ← Logged dish (solid)
│  • Cà phê sữa (1 ly)          120 cal  │
│  ░ [Bánh mì trứng (150g)]     ░░░ cal  │  ← Planned dish (faded + dashed)
│                                  [Đã ăn]│
├─────────────────────────────────────────┤
│  🍱 Bữa trưa           650 cal    [+]  │
│  ───────────────────────────────────── │
│  • Cơm tấm sườn (400g)        650 cal  │
│                                         │
├─────────────────────────────────────────┤
│  🍲 Bữa chiều          (Chưa có)  [+]  │  ← Empty meal slot
├─────────────────────────────────────────┤
│  🍪 Bữa phụ            (Chưa có)  [+]  │
├─────────────────────────────────────────┤
│  [🤖 AI chọn món hôm nay]               │  ← AI CTA (PRD requirement)
└─────────────────────────────────────────┘
[ Tab: Tổng quan | LỊCH ĂN | Quản lý | Tập ]
```

### Components breakdown

#### 2.1. Header (sticky top, full width)

- **Left chip:** "Hôm nay ▼" — tap → date picker modal mở (xem Screen 3)
  - Nếu ngày khác hôm nay → hiện tên relative ("Hôm qua", "Ngày mai", "Thứ 4 tuần sau") + "↩ Hôm nay" button bên cạnh
- **Center text:** Thứ + ngày tháng năm format VN ("Thứ 2, 09/05/26")
- **Right icon:** 📅 → chuyển sang Week View (toggle)
- **Background:** sticky, border-bottom 1px (ds token `--ion-border-color`)
- **Swipe gesture:** body content swipe left/right → previous/next day, KHÔNG phải header

#### 2.2. Daily Summary Card

- **Top row:** Calorie ring (lớn, 64px) — match Apple Activity standard
  - Icon ⚪ thay bằng ring SVG thật khi implement
  - Text: "Calo: X / Y" với progress bar text bên cạnh
  - Color logic (theo PRD F-04 line 346): xanh ≥80%, vàng 50-79%, đỏ <50% hoặc >120%
- **Bottom row:** 3 macro mini-rings (32px) — Protein / Carbs / Fat
  - Theo research Q4: 4 macro rings adopted (P/C/F/Fiber)
  - Phase 3 ship 3 (P/C/F) trước, Fiber defer Phase 4 (theo PRD F-04 advanced level)
  - Tap card → mở F-04 detail view (chuyển tab logic — defer định nghĩa cụ thể D5 F-04 spec)
- **Empty state:** Nếu chưa có món nào → "Chưa có món nào hôm nay" + CTA "Bắt đầu plan"

#### 2.3. Meal Slot Card (lặp 4 lần: Bữa sáng / Trưa / Chiều / Phụ)

**Header row của mỗi slot:**
- Icon emoji + label tiếng Việt cố định (KHÔNG cho rename Phase 3)
  - 🍳 Bữa sáng / 🍱 Bữa trưa / 🍲 Bữa chiều / 🍪 Bữa phụ
- Tổng calo của slot (right-align) — auto-sum
- Nút **[+]** — tap → mở F-04 Logging Modal với context `meal=breakfast/lunch/dinner/snack`

**Body row (list dishes trong slot):**
- Mỗi dish 1 row: tên + khối lượng + calo
- **Visual distinction theo `is_completed`:**

| State | `is_completed` | Visual | Tap behavior |
|---|---|---|---|
| **Đã ăn (logged)** | `1` | Text solid, border solid, calo có giá trị | Tap → F-04 Edit Modal (chỉ sửa servings, KHÔNG sửa nutrition snapshot) |
| **Đã plan, chưa ăn** | `0` | Text faded (opacity 0.6), border dashed, calo "░░░" placeholder | Tap → F-04 Edit Modal (sửa được servings, recipe vẫn realtime) |

- **Long-press 1 dish** → context menu (theo research: undo toast adopted):
  - "Sao chép sang ngày khác" → date picker modal
  - "Di chuyển sang bữa khác" → meal-slot picker
  - "Xóa" → soft delete + undo toast (5-10s, theo research Q5 differentiator)

**Per-dish "Đã ăn" toggle:**
- Nếu có dish `is_completed=0` → hiển thị nút "[Đã ăn]" cuối row dish
- Tap → confirm modal "Đánh dấu '{tên món}' đã ăn? Số liệu sẽ được lưu cố định." [Hủy] [Xác nhận]
  - Lý do confirm: snapshot bất biến — cần user hiểu hệ quả (microcopy theo research R1 risk)
- Sau confirm: flip `is_completed=1` → snapshot nutrition columns → visual chuyển sang solid

**Empty meal slot:**
- Hiển thị "(Chưa có)" italic, opacity 0.5 + nút [+] vẫn nổi bật
- KHÔNG hiển thị "+ Sao chép từ hôm qua" inline (đỡ rối) → đặt ở footer slot empty (xem dưới)

#### 2.4. AI CTA (cuối screen, trên tab bar)

- Theo PRD F-03 line 244: "🤖 AI chọn món hôm nay"
- Phase 3 ship UI button + redirect "Tính năng sẽ ra mắt Phase 5" (defer behavior)
- Phase 5+ implement actual Gemini call (theo Mary tech trends Step 5 Section E)

#### 2.5. Bottom tab bar

- Tab "LỊCH ĂN" highlighted (active state)
- Standard ion-tab-bar pattern (đã implement project-wide)

---

### Day View — Interaction flows

**F-03.D.1 — Mở app, lần đầu hôm nay:**
1. App load → Day View với date = today
2. DB query DayPlan + dishes cho today
3. Nếu DB rỗng → show empty state "Hôm nay anh ăn gì?" với 2 CTA [Lên kế hoạch] [Sao chép từ ngày khác]
4. Nếu có dishes → render layout như mockup trên

**F-03.D.2 — Chuyển ngày:**
- **Cách 1:** Tap chip "Hôm nay ▼" → date picker modal → chọn ngày → close → reload
- **Cách 2:** Swipe left/right ở body → ngày liền kề (animated transition slide)
- **Cách 3:** Toggle Week View → tap ngày → quay lại Day View với ngày đó
- **Edge:** Vượt quá 365 ngày tương lai hoặc 365 ngày quá khứ → block + toast "Chỉ xem được trong vòng 1 năm"

**F-03.D.3 — Thêm dish vào meal slot:**
1. Tap [+] ở slot bất kỳ → F-04 Logging Modal mở (full-bleed bottom sheet)
2. User search/select dish → confirm
3. Modal close → Day View refresh slot → dish mới hiển thị faded (planned, `is_completed=0`)

**F-03.D.4 — Đánh dấu "Đã ăn":**
1. Tap nút [Đã ăn] cạnh dish faded → confirm modal
2. Confirm → DB transaction:
   - SET `is_completed=1`
   - SNAPSHOT `calories/protein/carbs/fat` từ recipe hiện tại × servings
3. UI: dish chuyển từ faded → solid (animated, ~300ms fade transition)
4. Daily summary card recalculate (animated number tick)

**F-03.D.5 — Sửa dish:**
- Tap dish (single tap) → F-04 Edit Modal
- Sửa servings → save → recompute nutrition (logic khác nhau giữa logged và planned theo Hybrid)
- Sửa servings của logged dish → snapshot ratio scaled (vd: 200g→300g thì calo ×1.5)

**F-03.D.6 — Xóa dish:**
1. Long-press → context menu → "Xóa"
2. Optimistic UI: dish disappear ngay
3. Toast bottom: "Đã xóa '{tên món}'  [Hoàn tác]" với progress bar countdown 8 giây
4. Trong 8s: tap [Hoàn tác] → restore dish + toast dismiss
5. Sau 8s: hard delete từ DB, toast auto-dismiss

**F-03.D.7 — Sao chép sang ngày khác:**
1. Long-press → context menu → "Sao chép sang ngày khác"
2. Date picker modal → chọn ngày đích (default = ngày mai)
3. Hiện preview "Sao chép '{tên món}' vào Bữa sáng ngày Thứ 3, 10/05/26?" [Hủy] [Sao chép]
4. Confirm → tạo PlannedDish mới ở ngày đích, `is_completed=0`
5. Toast: "Đã sao chép sang Thứ 3" [Xem ngày đó]

---

### Day View — Edge cases

| Tình huống | Hành vi |
|---|---|
| User edit recipe của dish đã planned (chưa ăn) | Day View tự refresh (realtime) → calo dish update theo recipe mới |
| User edit recipe của dish đã ăn (đã snapshot) | Day View KHÔNG đổi → snapshot bất biến. Tooltip ℹ️ "Số liệu khi đã ăn: 300 cal (recipe hiện tại: 320 cal)" |
| User xóa recipe đang được dùng trong planned dish | Block delete + dialog "Recipe này đang dùng ở 3 bữa kế hoạch. Xóa sẽ làm các kế hoạch không còn dữ liệu. Vẫn xóa?" |
| User xóa recipe đang được dùng trong logged dish | Cho xóa (snapshot bất biến nên không ảnh hưởng) + warning "Recipe sẽ bị xóa nhưng nhật ký quá khứ vẫn giữ" |
| Network offline (cho future Phase 5+ AI) | AI CTA disabled + tooltip "Cần mạng để dùng AI" |
| Storage full (>10 năm data, rare) | Toast "Bộ nhớ gần đầy. Xem Cài đặt để xóa dữ liệu cũ" |



---

## 3. Screen 2: Week View (toggle from Day View)

### Layout

```
┌─────────────────────────────────────────┐
│  ◄  Tuần 09-15/05/26   ►        [📋]   │  ← Header (week range + toggle to Day)
│              [↩ Tuần này]                │  ← Visible khi không phải tuần hiện tại
├─────────────────────────────────────────┤
│  Mục tiêu: 2000 cal/ngày · Tổng 14000  │  ← Week summary
│  Đã ăn: 11800 cal (84% target)          │
├─────────────────────────────────────────┤
│ T2 ⚪⚪⚪  1850/2000  92% ✅              │  ← Day row (vertical list, NOT 7-col grid)
│ T3 ⚪⚪░  1450/2000  72% 🟡              │
│ T4 ░░░  ─── (chưa plan)                 │  ← Empty day
│ T5 ⚪⚪⚪  2100/2000  105% ✅            │
│ T6 ⚪⚪⚪⚪ 2400/2000 120% ⚠️           │
│ T7 ░░░  ─── (chưa plan)                 │
│ CN ░░░  ─── (chưa plan)                 │
├─────────────────────────────────────────┤
│  [🤖 AI lên plan cả tuần này]           │  ← AI CTA (PRD requirement, defer Phase 5)
│  [📋 Sao chép tuần trước]                │  ← Quick action
└─────────────────────────────────────────┘
```

### Components breakdown

#### 3.1. Header (sticky top)

- **Left/Right arrows ◄ ►:** chuyển tuần trước/sau
- **Center text:** "Tuần dd-dd/mm/yy" hoặc "Tuần dd/mm-dd/mm/yy" nếu cross-month
- **Right icon 📋:** toggle về Day View (lưu lại ngày hiện tại từ context)
- **"↩ Tuần này" button:** chỉ hiện khi đang xem tuần khác — quick jump to current week

#### 3.2. Week Summary

- "Mục tiêu: X cal/ngày · Tổng Y" — derive từ user profile
- "Đã ăn: Z cal (P% target)" — sum của dishes có `is_completed=1` trong tuần
- KHÔNG hiện total cho planned dishes (khác semantics)

#### 3.3. Day Row (lặp 7 lần — Mon to Sun)

> **Open question O-F03-1 RESOLVED:** Vertical list 7 rows, KHÔNG phải 7-column horizontal grid. Lý do:
> - Mobile screen 360-414px wide → 7 cột = mỗi cột ~50px → quá hẹp cho text Việt
> - Vertical scroll = mobile-native pattern
> - Trade-off: mất "1 glance overview" nhưng được readability

**Mỗi row:**
- **Label:** "T2 / T3 / T4 / T5 / T6 / T7 / CN" (viết tắt thứ tiếng Việt)
- **Dot indicator:** ⚪ (filled circles) hoặc ░ (empty) — số dot = số bữa đã plan/log
  - 4 dot = tất cả 4 bữa có ít nhất 1 dish
  - 0 dot = ngày chưa plan gì
- **Tổng calo:** "X / Y" — X = đã ăn (logged), Y = mục tiêu
- **Percentage:** "Z%"
- **Status icon:** ✅ (in target ±10%), 🟡 (under <80%), ⚠️ (over >110%), ⛔ (>150%)

**Tap row → chuyển sang Day View** với date = ngày đó (animated slide transition)

**Visual cho ngày trong quá khứ:**
- Background hơi xám (opacity 0.85) để phân biệt past vs future
- Vẫn tap được để xem chi tiết

**Visual cho ngày tương lai chưa plan:**
- "─── (chưa plan)" thay cho số calo
- Status icon = không có
- Tap → Day View → empty state với CTA

#### 3.4. AI CTA + Quick action

- **"🤖 AI lên plan cả tuần này"** — Phase 3 ship UI button + redirect "Phase 5"
- **"📋 Sao chép tuần trước"** — Phase 3 implement luôn:
  1. Tap → confirm modal "Sao chép tất cả món từ tuần 02-08/05/26 vào tuần 09-15/05/26?" + warning "Sẽ ghi đè nếu có món hiện tại"
  2. Confirm → batch insert PlannedDish cho 7 ngày, `is_completed=0`
  3. Toast "Đã sao chép 24 món từ tuần trước" [Xem]

### Week View — Interaction flows

**F-03.W.1 — Vào Week View:**
- Từ Day View tap 📅 → slide animation → Week View với current week
- DB query: `SELECT * FROM day_plan WHERE date BETWEEN week_start AND week_end`

**F-03.W.2 — Chuyển tuần:**
- Tap ◄/► → slide animation
- Vượt quá 52 tuần tương lai/quá khứ → block

**F-03.W.3 — Quick navigate to specific day:**
- Tap row → Day View của ngày đó

### Week View — Edge cases

| Tình huống | Hành vi |
|---|---|
| User profile chưa setup target_calories | Show "Chưa đặt mục tiêu" + CTA "Đi đến cài đặt" → Settings page |
| Cross-month week (vd: 28/04 - 04/05) | Header "Tuần 28/04-04/05/26" |
| Cross-year week (rare, week chứa 31/12-01/01) | Header "Tuần 28/12/25-03/01/26" |
| Tất cả 7 ngày empty | Show empty state center: "Chưa có kế hoạch tuần này" + CTA "Sao chép tuần trước" / "Lên plan thủ công" |

---

## 4. Screen 3: Date Picker Modal

### Layout

```
┌─────────────────────────────────────────┐
│  Chọn ngày                       [✕]    │
├─────────────────────────────────────────┤
│  ◄  Tháng 5, 2026  ►                    │
│                                         │
│  T2  T3  T4  T5  T6  T7  CN             │
│              1   2   3   4              │
│   5   6   7   8 [9]  10  11             │  ← Today highlighted
│  12  13  14  15  16  17  18             │
│  19  20  21  22  23  24  25             │
│  26  27  28  29  30  31                 │
│                                         │
├─────────────────────────────────────────┤
│  [↩ Hôm nay]              [Xác nhận]    │
└─────────────────────────────────────────┘
```

### Components

- **Standard Ionic ion-datetime** với preset Vietnamese localization
- **Quick action "↩ Hôm nay"** — jump to today
- **Selected date** highlighted với primary color + bold
- **Days với planned/logged dishes** có small dot dưới số → user thấy ngày nào đã có data
- **Cancel:** tap [✕] hoặc tap outside modal

### Interaction

1. User tap chip "Hôm nay ▼" ở Day View header
2. Modal slide up từ bottom (~300ms)
3. User chọn ngày → tap "Xác nhận"
4. Modal close → Day View reload với ngày mới

---

## 5. Empty State (toàn ngày chưa có món)

### Layout

```
┌─────────────────────────────────────────┐
│  [Hôm nay ▼]    Thứ 2, 09/05/26    [📅]│
├─────────────────────────────────────────┤
│                                         │
│              🍽️                         │  ← Illustration nhẹ (centered)
│                                         │
│      Hôm nay anh ăn gì?                 │
│  Lên kế hoạch hoặc sao chép từ          │
│         ngày khác                        │
│                                         │
│       [📅 Lên kế hoạch]                 │  ← Primary CTA
│       [📋 Sao chép từ hôm qua]          │  ← Secondary CTA
│       [🤖 AI chọn món hôm nay]           │  ← Tertiary CTA (Phase 5)
│                                         │
└─────────────────────────────────────────┘
```

### Components

- **Illustration:** SVG đơn giản từ ds tokens (KHÔNG dùng raster image — performance)
- **Headline:** "Hôm nay anh ăn gì?" / "Hôm qua anh ăn gì?" / "Thứ 4 anh định ăn gì?" — copywriting adaptive theo relative date
- **3 CTAs vertical:**
  1. Primary: "Lên kế hoạch" → mở F-04 Logging Modal với context = breakfast slot (mặc định bữa sáng vì đầu tiên)
  2. Secondary: "Sao chép từ hôm qua" — chỉ hiện nếu có data hôm qua
  3. Tertiary (Phase 5+): AI CTA

> **Open question O-F03-4 RESOLVED:** Copywriting "Hôm nay anh ăn gì?" — chọn vì:
> - Adaptive theo relative date (hôm qua / hôm nay / mai / cuối tuần này)
> - Câu hỏi engaging hơn statement
> - Tránh negative framing "Chưa có món nào"



---

## 6. Hybrid Policy — UX Microcopy & Tooltips (CRITICAL)

> 🎨 **Sally's note:** Đây là risk R1 từ Mary — Hybrid policy có thể confuse user. Section này define toàn bộ microcopy + tooltip cụ thể.

### 6.1. Tooltip lần đầu user thấy planned dish (faded)

**Trigger:** Lần đầu user mở Day View thấy dish faded với border dashed
**Hiển thị:** Coachmark overlay trên dish faded
**Copy:**
> 📌 **Đây là kế hoạch — chưa ăn**
> Số liệu sẽ cập nhật theo recipe mới nhất khi anh sửa.
> Tap [Đã ăn] khi anh thực sự ăn món này để chốt số liệu.
> [Đã hiểu]

**Logic:** Show 1 lần duy nhất, lưu flag `coach_planned_dish_seen=true` trong Settings/local storage.

### 6.2. Confirm modal khi đánh dấu "Đã ăn"

**Trigger:** Tap nút [Đã ăn]
**Modal:**
> **Đánh dấu '{tên món}' đã ăn?**
>
> Số liệu dinh dưỡng sẽ được lưu cố định:
> - Calo: 300
> - Protein: 25g · Carbs: 40g · Fat: 8g
>
> Sau này nếu anh sửa recipe, số liệu này không đổi.
>
> [Hủy]    [Xác nhận]

**Logic:** Confirm modal mặc định show. User có thể tick "Không hỏi lại" (lưu flag) — sau đó skip confirm cho lần sau.

### 6.3. Tooltip khi user edit recipe đang được dùng

**Trigger:** User vào F-02 (Quản lý món) edit recipe có ≥1 entry trong calendar
**Hiển thị:** Banner top của edit recipe page
**Copy:**
> ℹ️ Recipe này đang dùng ở:
> - 3 bữa kế hoạch chưa ăn → sẽ cập nhật theo recipe mới
> - 5 bữa đã ăn → giữ nguyên số liệu cũ (snapshot)

### 6.4. Inline tooltip trên logged dish khi recipe đã đổi

**Trigger:** Logged dish có snapshot khác recipe hiện tại (so sánh diff)
**Hiển thị:** Icon ℹ️ nhỏ cạnh tên dish, tap → tooltip
**Copy:**
> 📊 **Số liệu khi anh ăn:** 300 cal
> Recipe hiện tại: 320 cal
> (Số liệu cũ được giữ để báo cáo chính xác)

### 6.5. FAQ entry trong Settings

Thêm 1 entry "Tại sao số liệu kế hoạch và đã ăn khác nhau?" → mở modal/page với explanation đầy đủ.

> **Open question O-F04-1 (sẽ defer cho F-04 spec — D5)** — Hybrid microcopy chi tiết hơn ở F-04 Edit Modal khi user sửa servings của logged dish.

---

## 7. Open Questions Resolution

| ID | Question | Resolution | Rationale |
|---|---|---|---|
| **O-F03-1** | Week-view layout 7 cột vertical hay horizontal? | **Vertical 7 rows** | Mobile screen 360-414px → 7 cột quá hẹp cho text Việt. Vertical = mobile-native pattern. Trade-off mất "1 glance" nhưng được readability. |
| **O-F03-2** | Bữa phụ (snack) — fixed slot hay flexible? | **Fixed slot Phase 3, defer flexible Phase 4** | Phase 3 ship 4 fixed slots (đơn giản, đủ cho 80% user). Flexible multi-snack defer dựa trên user feedback Phase 4 beta. |
| **O-F03-3** | Cross-day drag-drop dish — Phase 3 hay defer? | **Defer Phase 4** | Theo research, drag-drop trên mobile complex, hầu hết apps không có. Phase 3 dùng "Sao chép sang ngày khác" qua context menu thay thế. |
| **O-F03-4** | Empty state copywriting | **"Hôm nay anh ăn gì?" (adaptive theo date)** | Engaging hơn negative framing. Adaptive theo relative date. |

---

## 8. Component Inventory (cho dev)

### Existing components (reuse từ design-system)

| Component | Source | Usage |
|---|---|---|
| `ion-content` | Ionic standard | Day View / Week View body |
| `ion-tabs` | Ionic standard | Bottom tab bar |
| `ion-modal` | Ionic standard | Date picker, Confirm dialog |
| `ion-toast` | Ionic standard | Undo toast, success toast |
| `.input-wrapper` (floating-label) | `src/theme/form-field.scss` | Servings input trong Edit Modal (defer F-04) |
| Design tokens (--ion-color-primary, etc.) | `src/theme/variables.scss` | All styling |

### New components cần tạo (Phase 3)

| Component name | File path (đề xuất) | Purpose |
|---|---|---|
| `app-day-view-page` | `features/calendar/day-view/day-view.html` (per project Style 2025) | Day View screen container |
| `app-week-view-page` | `features/calendar/week-view/week-view.html` | Week View screen container |
| `app-meal-slot-card` | `features/calendar/components/meal-slot-card/` | Meal slot card (lặp 4 lần Day View) |
| `app-day-summary-card` | `features/calendar/components/day-summary-card/` | Calorie + macro rings card |
| `app-day-row` | `features/calendar/components/day-row/` | Row trong Week View |
| `app-empty-day-state` | `features/calendar/components/empty-day-state/` | Empty state full screen |
| `app-confirm-eat-modal` | `shared/components/confirm-eat-modal/` | Confirm "Đã ăn" modal |
| `app-undo-toast` | (use ion-toast với custom duration + button) | KHÔNG tạo component riêng — extend ion-toast |

### Data services (defer cho D8 Architect)

- `CalendarRepository` — query DayPlan + dishes
- `PlannedDishRepository` — CRUD PlannedDish với Hybrid policy logic
- `DishService` — đã có existing (reuse)

---

## 9. Acceptance Criteria (cho D11 James/dev)

### Functional

- [ ] Day View load default = today, render 4 meal slots + summary card
- [ ] Week View toggle từ Day View, hiện 7 day rows với indicators
- [ ] Date picker modal cho phép chọn ngày trong ±365 ngày
- [ ] Swipe left/right ở Day View body → chuyển ngày liền kề
- [ ] Tap [+] meal slot → mở F-04 Logging Modal với meal context
- [ ] Long-press dish → context menu (Sao chép / Di chuyển / Xóa)
- [ ] Tap [Đã ăn] → confirm modal → flip is_completed → snapshot nutrition
- [ ] Xóa dish → optimistic UI + undo toast 8s
- [ ] Sao chép tuần trước → batch insert 7 ngày
- [ ] Empty state với 3 CTAs khi day rỗng
- [ ] AI CTAs Phase 3 = redirect "Phase 5"

### Visual

- [ ] Planned dish: opacity 0.6, border 1px dashed
- [ ] Logged dish: opacity 1.0, border 1px solid
- [ ] Calo color: xanh ≥80%, vàng 50-79%, đỏ <50% hoặc >120% (theo PRD F-04)
- [ ] Sticky header + footer hoạt động đúng khi scroll
- [ ] Animations: slide transition giữa days (~300ms ease)
- [ ] All text VN, dùng font + size theo design-system §6

### Hybrid policy

- [ ] Dish faded = realtime nutrition (sửa recipe → calo update ngay)
- [ ] Dish solid = snapshot bất biến (sửa recipe → calo không đổi)
- [ ] Coachmark "Đây là kế hoạch" hiện 1 lần duy nhất
- [ ] Confirm modal "Đã ăn" hiển thị nutrition trước khi snapshot
- [ ] Banner trong F-02 edit recipe khi recipe đang được dùng

### Edge cases

- [ ] Vượt ±365 ngày → block + toast
- [ ] Network offline → AI CTAs disabled
- [ ] DB query rỗng → empty state đúng
- [ ] Long press không trigger nếu user scroll

### Accessibility

- [ ] Touch target ≥44x44px (per Apple/Google guidelines)
- [ ] Color contrast ≥4.5:1 cho body text
- [ ] Screen reader: meal slot label + tổng calo readable
- [ ] Focus order logical từ trên xuống

---

## 10. Risks & Mitigations

| Risk | Source | Mitigation |
|---|---|---|
| **R1: Hybrid policy confuse user** | Mary research | Section 6 microcopy/tooltips comprehensive |
| **R-S1: Vertical 7-row Week View thiếu "1 glance"** | Sally analysis | Phase 4 user test; có thể add horizontal mini-strip nếu cần |
| **R-S2: Undo toast 8s có thể quá ngắn** | Industry pattern | Phase 4 measure analytics; tunable parameter |
| **R-S3: Confirm modal "Đã ăn" gây friction** | Phase 3 design | Cho user tick "Không hỏi lại"; default ON cho safety |

---

## 11. Handoff to D5 (F-04 Tracking spec)

**F-03 dependencies cho F-04:**
- F-04 Logging Modal (search/recent/favorites tabs) — F-03 Section 2.6 reference
- F-04 Edit Modal (sửa servings) — F-03 Section 2.5 reference
- F-04 Tracking Display (calorie + macro rings) — F-03 Day Summary Card uses this component

**Open questions defer cho F-04 spec (D5):**
- O-F04-1: Hybrid microcopy ở Edit Modal khi sửa servings của logged dish
- O-F04-2: Edit-past-meal flow — show snapshot vs current recipe diff thế nào
- O-F04-3: Macro ring order (Protein vs Carbs first cho VN diet rice-heavy)
- O-F04-4: Trend baseline 7 days rolling vs week-aligned

---

## 12. Sally signing off

F-03 UX spec hoàn tất. Format wireflow text-based. Đã resolve 4 open questions từ Mary research. Đã define microcopy đầy đủ cho Hybrid policy (R1 mitigation). Sẵn sàng handoff cho:

- **D5:** Tiếp tục F-04 spec (Sally tiếp tục)
- **D8:** Winston (Architect) — design data flow + repository pattern + signals
- **D11:** James (Dev) — implement theo acceptance criteria

_Cập nhật cuối: 2026-05-09 — Sally (UX Designer, BMAD)_
