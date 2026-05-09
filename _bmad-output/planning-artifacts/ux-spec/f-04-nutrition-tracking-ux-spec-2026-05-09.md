---
feature_id: F-04
feature_name: Nutrition Tracking & Display
spec_type: ux-design
spec_format: wireflow-text-based
author: Sally (UX Designer, BMAD)
date: 2026-05-09
status: draft
inputs:
  - docs/2-requirements/prd.md (F-04 section, lines 316-347)
  - docs/3-design/ux-specs/f-03-calendar-plan.md (handoff section 11)
  - docs/4-architecture/business-rules.md (RULE-PLANNED-DISH-HYBRID, RULE-DISH-TOTAL)
  - docs/3-design/data-model.md §4.5 meal_slot, §4.6 planned_dish
  - docs/3-design/design-system.md
  - _bmad-output/planning-artifacts/research/domain-meal-planning-tracking-ux-research-2026-05-09.md (Section 5 F-04 recs, Q3/Q4/Q5 patterns)
related_specs:
  - F-03 (Calendar & Meal Planning) — đã ship D2, F-04 component reuse từ Day Summary Card
  - F-05 (AI Image Analysis) — Phase 5+, logging-modal "📷 Chụp ảnh" tab defer
  - F-06 (AI Menu Suggestions) — Phase 5+, logging-modal "🤖 AI gợi ý" tab defer
  - F-07 (AI Daily Insights) — Phase 5+, dashboard insight card defer
---

# F-04 Nutrition Tracking & Display — UX Specification

> 🎨 **Sally's note:** F-04 không phải 1 màn hình đơn lẻ — nó là **hệ thống hiển thị dinh dưỡng cross-feature** + **các modal logging/edit** mà F-03 (và sau này F-05/F-06/F-07) gọi đến. Spec này cover:
> - 4 surface hiển thị (Dashboard card, Day Summary Card, Week color row, Trend View)
> - 2 modal nhập liệu (Logging Modal, Edit Modal)
> - Logic Smart Key Metric + level-adaptive display
> - Hybrid policy edge cases khi user edit servings/recipe (mở rộng từ F-03 §6)
>
> Format wireflow text-based — KHÔNG có pixel mockup, dev đọc trực tiếp implement.

---

## 1. Overview

**Mục đích:** Hiển thị **bao nhiêu / mục tiêu** một cách **không-overwhelm beginner, đủ-sâu cho advanced**, đồng thời cung cấp các surface để user **log thực tế** và **edit số liệu**.

**Phạm vi spec này:**
| # | Surface | Trigger | Component reuse |
|---|---|---|---|
| S1 | **Dashboard Nutrition Card** | Tab "Tổng quan" | New (`app-nutrition-dashboard-card`) |
| S2 | **Day Summary Card** | F-03 Day View top | `app-day-summary-card` (đã liệt kê F-03 §8) — F-04 spec định nghĩa nội dung |
| S3 | **Week Color Row** | F-03 Week View | `app-day-row` (đã có F-03) — F-04 chỉ define color logic |
| S4 | **Trend View** | Tap Calorie ring ở Dashboard hoặc Day Summary | New (`app-nutrition-trend-view`) |
| M1 | **Logging Modal** | F-03 [+] meal slot, F-03 empty state CTA | New (`app-logging-modal`) |
| M2 | **Edit Modal** | F-03 tap dish (single tap) | New (`app-edit-dish-modal`) |

**Differentiators (theo research Section 5):**
- Calorie ring + 4 macro ring — match Apple Activity standard, từ Cronometer/Carb Manager pattern
- Weekly bar trend (week-aligned Mon-Sun) — pattern detection, không streak
- Search + Recent + Favorites tabs trong Logging Modal — table stakes
- Copy-from-date button (default = hôm qua) — high utility (research Q3)
- Undo toast 8s khi delete — **0/8 apps competitive surveyed có** (research Q5 differentiator)
- **NO** streak counter, **NO** traffic-light food coloring (Noom anti-pattern), **NO** daily weigh-in pressure

**Nguyên tắc level-adaptive (PRD F-04 lines 320-327):**
| Level / Goal | Surface S1/S2 mặc định | "Xem chi tiết" mở rộng |
|---|---|---|
| Beginner | Calo (progress bar, KHÔNG ring) | + Protein, Carbs, Fat |
| Intermediate (Giảm cân) | Calo (ring) + Protein (mini) | + Carbs, Fat, Fiber |
| Intermediate (Tăng cơ) | Calo (mini) + Protein (ring) | + Carbs, Fat, Fiber |
| Advanced | Calo + 3 macro rings (P/C/F) | + Fiber + macro % chi tiết |

**Smart Key Metric (PRD F-04 lines 329-333):**
- Giảm cân → highlight **Calo** (deficit là ưu tiên)
- Tăng cơ → highlight **Protein** (đủ protein là ưu tiên)
- Duy trì → highlight **Calo**
- Performance → highlight **Protein + Calo** (cả hai cùng mức)

→ "Highlight" = ring lớn (64px) ở vị trí dominant, các ring khác mini (32px). Logic này quyết định layout S1/S2.

---

## 2. Surface S1: Dashboard Nutrition Card (Tab "Tổng quan")

### Layout — variant Intermediate Giảm cân (mặc định, ví dụ chính)

```
┌─────────────────────────────────────────┐
│  Hôm nay · Thứ 2, 09/05/26              │  ← Title row (full width)
│                                         │
│         ╭───────────╮                   │
│         │   1850    │  92%              │  ← Calorie ring (64px) — KEY METRIC
│         │  / 2000   │  (xanh)           │
│         ╰───────────╯                   │
│                                         │
│  🥩 Protein              95 / 120g       │
│   ▓▓▓▓▓▓▓░░░ 79% (vàng)                 │  ← Mini bar (đủ chi tiết, không ring)
│                                         │
│  [▼ Xem chi tiết]                       │  ← Toggle expand
│                                         │
│  (collapsed) ───────────────────────    │
│                                         │
│  [📅 Xem trong Lịch ăn]                  │  ← CTA → mở F-03 Day View
└─────────────────────────────────────────┘
```

### Layout — variant Intermediate Tăng cơ (Protein highlight)

```
┌─────────────────────────────────────────┐
│  Hôm nay · Thứ 2, 09/05/26              │
│                                         │
│         ╭───────────╮                   │
│         │   95g     │  79%              │  ← Protein ring (64px) — KEY METRIC
│         │  / 120g   │  (vàng)           │
│         ╰───────────╯                   │
│                                         │
│  🔥 Calo                 1850 / 2000     │
│   ▓▓▓▓▓▓▓▓░ 92% (xanh)                  │
│                                         │
│  [▼ Xem chi tiết]                       │
│  [📅 Xem trong Lịch ăn]                  │
└─────────────────────────────────────────┘
```

### Layout — variant Advanced (Calo + 3 macro rings)

```
┌─────────────────────────────────────────┐
│  Hôm nay · Thứ 2, 09/05/26              │
│                                         │
│   ╭─────╮  ╭───╮ ╭───╮ ╭───╮            │
│   │1850 │  │ P │ │ C │ │ F │            │  ← Calo 64px + 3 macro 32px
│   │/2000│  │95 │ │220│ │ 60│            │
│   │ 92% │  │/120│ │/250││/65 │           │
│   ╰─────╯  ╰───╯ ╰───╯ ╰───╯            │
│                                         │
│  [▼ Xem chi tiết]  Fiber 18 / 25g       │
│  [📅 Xem trong Lịch ăn]                  │
└─────────────────────────────────────────┘
```

### Layout — variant Beginner (KHÔNG ring, chỉ progress bar)

```
┌─────────────────────────────────────────┐
│  Hôm nay · Thứ 2, 09/05/26              │
│                                         │
│  🔥 Calo hôm nay                         │
│   1850 / 2000 kcal                      │
│   ▓▓▓▓▓▓▓▓░ 92%                         │  ← Bar 12px height, color xanh
│   "Anh đang ăn đủ năng lượng 👍"        │  ← Microcopy supportive
│                                         │
│  [▼ Xem chi tiết: Protein, Carbs, Fat]  │
│  [📅 Xem trong Lịch ăn]                  │
└─────────────────────────────────────────┘
```

### Components breakdown

#### 2.1. Title row
- **Format:** "Hôm nay · {Thứ}, {dd/mm/yy}" — VN format
- **No tap** — pure label

#### 2.2. Key metric ring (64px) hoặc bar (Beginner)
- **Vị trí:** Center hoặc left tuỳ variant
- **Ring SVG:** stroke-width 8px, gap 0, animation 600ms ease-out khi value đổi
- **Color logic (universal — apply mọi surface S1/S2/S3):**

| % target đạt | Color token | Ring fill | Ý nghĩa |
|---|---|---|---|
| ≥80% và ≤110% | `--ion-color-success` (xanh sage) | Solid fill | In target |
| 50-79% | `--ion-color-warning` (vàng) | Solid fill | Under-target |
| <50% | `--ion-color-danger` (đỏ) | Solid fill | Critical under |
| 110-120% | `--ion-color-warning` (vàng) | Solid fill | Slight over |
| >120% | `--ion-color-danger` (đỏ) | Solid fill | Over-target |
| `null` (chưa target setup) | `--ion-color-medium` (xám) | Empty stroke | "Chưa đặt mục tiêu" |

> **Note:** Color logic align PRD F-04 line 346 (xanh ≥80%, vàng 50-79%, đỏ <50% hoặc >120%). Em add band 110-120% vàng để soft-warn tăng cơ user (cho phép vượt nhẹ). >120% đỏ giữ nguyên PRD.

- **Center text:** {value}{unit} / {target}{unit} + percentage bên cạnh
- **Tap ring → S4 Trend View** (xem §5)

#### 2.3. Secondary metric (mini bar)
- Variant Intermediate: 1 bar (metric không-key)
- Variant Advanced: 3 mini ring 32px (nguyên P/C/F)
- Variant Beginner: chỉ key metric, KHÔNG secondary mặc định
- Tap secondary → **không tap** ở S1 (giữ surface đơn giản); ở S2 mới tap được

#### 2.4. "▼ Xem chi tiết" toggle
- Tap → expand inline (KHÔNG mở modal mới — tránh navigation overhead)
- Expanded show: full P/C/F (Beginner) hoặc + Fiber (Intermediate/Advanced) + macro % breakdown
- Persistent: lưu state expanded/collapsed trong session storage (KHÔNG persist DB)

#### 2.5. CTA "📅 Xem trong Lịch ăn"
- Tap → switch tab sang "Lịch ăn" (F-03), Day View với date = today
- Lý do CTA: Dashboard là overview only, drill-down vào F-03 để xem món

### Empty state — chưa có món nào hôm nay

```
┌─────────────────────────────────────────┐
│  Hôm nay · Thứ 2, 09/05/26              │
│                                         │
│         ╭───────────╮                   │
│         │     0     │  0%               │
│         │  / 2000   │  (xám)            │
│         ╰───────────╯                   │
│                                         │
│  Chưa ghi món nào hôm nay               │
│  [➕ Thêm món đầu tiên]                  │  ← Mở M1 Logging Modal trực tiếp
└─────────────────────────────────────────┘
```

### Empty state — chưa setup target

```
┌─────────────────────────────────────────┐
│  Hôm nay · Thứ 2, 09/05/26              │
│                                         │
│  ⚙️  Chưa đặt mục tiêu dinh dưỡng        │
│  Cần biết mục tiêu để hiển thị %        │
│  [Đi đến Cài đặt]                       │
└─────────────────────────────────────────┘
```

### Logic computation

- **Calo today** = `SUM(effective_nutrition.calories)` cho mọi `planned_dish` thuộc các `meal_slot` của `day_plan(date=today)`
- **effective_nutrition** dùng pattern từ business-rules RT-01:
  ```sql
  CASE WHEN pd.is_completed = 1 THEN pd.calories
       ELSE dwt.total_calories * pd.servings
  END
  ```
- → Bao gồm CẢ planned (chưa ăn) lẫn logged (đã ăn). Lý do: Dashboard là "ngày sẽ thế nào", không phân biệt ăn-rồi-hay-chưa. **Khác Week View (S3): Week chỉ tính logged.** (Quyết định nhất quán với F-03 §3.2.)

> **Sally's note:** Có thể tranh luận Dashboard nên chỉ show "đã ăn". Em chọn show CẢ vì Dashboard là entry point sáng — user mở app lúc 7h sáng, đã plan bữa sáng+trưa+tối nhưng chưa ăn — họ muốn thấy "ngày hôm nay sẽ ăn 1850 cal" để biết có cần điều chỉnh không. Nếu chỉ show "đã ăn" → ring 0% buổi sáng → useless. Trade-off: số có thể "lừa" user nếu họ skip bữa thực tế. Mitigation: F-03 phân biệt visual planned vs logged rõ ràng (đã có F-03 §2.3) → user drill-down để verify.

### Smart Key Metric routing logic

```
function pickKeyMetric(profile):
  if profile.goal == 'lose_weight'    → ['calories', 'protein']   # Calo lớn, Protein mini
  if profile.goal == 'gain_muscle'    → ['protein', 'calories']   # Protein lớn, Calo mini
  if profile.goal == 'maintain'       → ['calories', 'protein']
  if profile.goal == 'performance'    → ['calories', 'protein']   # 2 ring 48px equal weight (variant đặc biệt)
  default                              → ['calories', 'protein']
```

→ Performance variant đặc biệt: 2 ring 48px side-by-side, không có "key" duy nhất. Defer Phase 4 (Phase 3 fall back về Intermediate Tăng cơ pattern).

---

## 3. Surface S2: Day Summary Card (F-03 Day View top)

### Layout — variant Intermediate Giảm cân (default)

```
┌─────────────────────────────────────────┐
│  ╭─────╮                                │
│  │1850 │  Calo: 1850 / 2000  92% ✅    │  ← Ring 48px (nhỏ hơn S1) + label inline
│  │/2000│                                │
│  ╰─────╯                                │
│  ┌──────────────┬──────────────┬───────┐│
│  │🥩 Protein    │🍞 Carbs       │🥑 Fat ││  ← 3 macro mini-bars stacked horizontal
│  │ 95/120g  79% │ 220/250g 88%  │60/65g ││
│  │ ▓▓▓▓▓▓▓░░    │ ▓▓▓▓▓▓▓▓░    │92% ▓▓ ││
│  └──────────────┴──────────────┴───────┘│
└─────────────────────────────────────────┘
```

### Layout — variant Beginner

```
┌─────────────────────────────────────────┐
│  🔥 Calo hôm nay: 1850 / 2000           │
│   ▓▓▓▓▓▓▓▓░ 92%                         │
│  [▼ Xem Protein, Carbs, Fat]            │
└─────────────────────────────────────────┘
```

### Layout — variant Advanced

```
┌─────────────────────────────────────────┐
│  ╭─────╮ ╭───╮ ╭───╮ ╭───╮              │
│  │ Calo│ │ P │ │ C │ │ F │              │  ← 4 ring (Calo 48 + 3 macro 32)
│  │92% ✅│ │79%│ │88%│ │92%│              │
│  ╰─────╯ ╰───╯ ╰───╯ ╰───╯              │
│  Fiber: 18 / 25g  72%                    │
└─────────────────────────────────────────┘
```

### Differences vs S1 Dashboard

| Aspect | S1 Dashboard | S2 Day Summary |
|---|---|---|
| Ring size | 64px key + 32px secondary | 48px key + bars/mini-rings |
| Position | Standalone screen entry | Inside F-03 Day View, above meal slots |
| Tap behavior | Tap ring → S4 Trend | Tap card → expand inline OR mở S4 (open question O-F04-3 RESOLVED below) |
| Empty state | Full empty card | Compact: chỉ ring xám + "Chưa có món" |
| "Xem chi tiết" | Inline expand | KHÔNG có (tất cả đã visible nếu Intermediate+) |

### Components

#### 3.1. Compact ring + label
- 48px ring (giảm so với S1 64px vì Day View cần room cho meal slots bên dưới)
- Label inline bên phải: "Calo: X / Y  Z%  {status emoji}"
- Status emoji: ✅ (in target), 🟡 (under), ⚠️ (over slight), ⛔ (over critical) — match F-03 §3.3 status icons

#### 3.2. Macro row (Intermediate)
- 3 column equal width
- Mỗi column: emoji + label + "X/Yg" + bar 6px height
- Color theo macro target % (cùng logic 2.2 universal color)
- **Order:** Protein → Carbs → Fat
  - **Open question O-F04-3 RESOLVED:** Protein hiện đầu, KHÔNG phải Carbs. Lý do:
    - PRD F-04 line 322-327: mọi level Intermediate đều list Protein trước Carbs ở "Xem chi tiết"
    - Smart Key Metric: Tăng cơ → Protein là key → highlight Protein đầu = consistent
    - VN diet rice-heavy → Carbs thường over-target → để Carbs đầu sẽ làm user thấy "đỏ" trước, demoralizing
    - Convention quốc tế (MFP, Cronometer, Lifesum): Protein đầu

#### 3.3. Tap behavior
- **Open question (mới phát sinh, không phải O-F04-N) RESOLVED:** Tap S2 card → mở S4 Trend View (KHÔNG inline expand)
  - Lý do: F-03 Day View đã có nhiều info (4 meal slots + dishes) → inline expand sẽ làm scroll dài
  - S4 Trend View là dedicated surface, có space cho 7-day bar trend → tốt hơn cho user nghiên cứu pattern
  - Trade-off: thêm 1 navigation hop. Acceptable vì 80% user mở Day View để xem/edit món, không phải nghiên cứu trend.

---

## 4. Surface S3: Week Color Row (F-03 Week View)

> Component đã được F-03 §3.3 define visual layout. F-04 spec **chỉ define color logic** vì đó là nutrition concern.

### Color rules cho mỗi day row

```
status_color(day) = pick by:
  - week_view_calorie_total = SUM(eff_calories) WHERE is_completed=1 AND date=day
    (CHỈ tính dishes đã ăn — khác S1/S2 — vì Week View là "review nhật ký")
  - target_calories = profile.daily_calorie_target
  - pct = total / target * 100

  if day không có dish nào (planned hoặc logged):
    → color = neutral gray, status_icon = none, label = "─── (chưa plan)"
  elif day là tương lai (date > today):
    → color = neutral gray, status_icon = "📋" (planned), label = "{plan_total} kcal · kế hoạch"
  elif day là hôm nay và chưa hết:
    → color = orange-warning, status_icon = "⏳", label = "{logged}/{target} · đang ghi"
  elif day là quá khứ + có data logged:
    → màu theo % target:
      - 80-110% → xanh ✅
      - 50-79%  → vàng 🟡
      - <50%    → đỏ ⛔
      - 110-150% → vàng ⚠️
      - >150%   → đỏ ⛔
```

### Edge case: ngày có cả planned + logged
- Color theo logged total only (semantics "đã ăn được bao nhiêu so với target")
- Tooltip on long-press: "Đã ăn 1450, kế hoạch còn 600 cal"

### Dot indicator (F-03 §3.3 đã define số dot = số bữa)
- F-04 thêm rule: dot color = average của các slot trong ngày
  - Ví dụ: 4 slot, 3 slot ăn đủ + 1 slot trống → 3 dot xanh + 1 dot xám

---

## 5. Surface S4: Trend View (Dedicated screen, push from Dashboard/Day Summary)

### Layout

```
┌─────────────────────────────────────────┐
│  [← Quay lại]  Xu hướng dinh dưỡng      │  ← Header
├─────────────────────────────────────────┤
│  [Calo] [Protein] [Carbs] [Fat]         │  ← Metric tabs (segment control)
├─────────────────────────────────────────┤
│  Tuần 03-09/05/26          [Tuần ▼]     │  ← Date range + selector (Tuần / Tháng)
│                                         │
│  Calo trung bình: 1820 / 2000 (91%)     │
│  Range: 1450 - 2400  ·  TB 7 ngày       │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │      ▓                            │  │  ← Bar chart
│  │      ▓     ▓                      │  │
│  │  ▓   ▓     ▓   ▓                  │  │
│  │  ▓   ▓  ▓  ▓   ▓   ─ target line  │  │
│  │  ▓   ▓  ▓  ▓   ▓   ▓              │  │
│  │ T2  T3 T4 T5  T6  T7  CN          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Tuần này: 4/7 ngày trong mục tiêu      │  ← Summary
│  Xu hướng: ổn định (so với tuần trước)  │
│                                         │
│  [📋 So sánh tuần trước]                 │
└─────────────────────────────────────────┘
```

### Components

#### 5.1. Header
- Standard back arrow + title
- KHÔNG có right action (giữ đơn giản)

#### 5.2. Metric tabs
- 4 segment: Calo | Protein | Carbs | Fat (Fiber chỉ Advanced level → hidden cho Beginner/Intermediate)
- Switching tab: re-fetch data + animate bar chart (~400ms)
- Default tab: theo Smart Key Metric (Giảm cân→Calo, Tăng cơ→Protein…)

#### 5.3. Date range
- Default: tuần hiện tại (Mon-Sun, week-aligned)
- Selector dropdown: Tuần / Tháng (30 ngày rolling)
  - **Open question O-F04-4 RESOLVED:** Tuần = week-aligned (Mon-Sun), KHÔNG phải 7-days rolling. Lý do:
    - Đồng bộ với F-03 Week View (cũng Mon-Sun)
    - VN context: tuần làm việc T2-CN là mental model phổ biến (T2 = Mon là đầu tuần)
    - Trade-off: T2 hôm nay sẽ chỉ thấy 1 cột → cần "So sánh tuần trước" button (đã có)
    - Tháng = 30 ngày rolling → đỡ tốn UI cho calendar-month picker

#### 5.4. Statistics row
- "TB: X / Y  (Z%)" — average over period
- "Range: min - max" — variability indicator
- "TB 7 ngày" suffix khi period = tuần

#### 5.5. Bar chart
- SVG-based, NOT canvas (consistent với rings)
- Bar color = same color rule như S3 (xanh/vàng/đỏ theo %)
- Target line = horizontal dashed line, color `--ion-color-medium`
- X-axis: T2 T3 ... CN (week) hoặc 1 5 10 15 20 25 30 (month)
- Y-axis: implicit (no axis labels), bar height proportional
- Empty days: bar height 0 + label "─" dưới

#### 5.6. Summary text
- "X/N ngày trong mục tiêu" — count days với % in 80-110%
- "Xu hướng: {giảm/tăng/ổn định}" — derived từ slope so với period trước:
  - |delta| <5% → "ổn định"
  - delta >5% → "tăng"
  - delta <-5% → "giảm"
- KHÔNG có streak counter (research anti-pattern Q4)

#### 5.7. Compare button
- Tap → bar chart split: 2 dataset overlay (tuần này vs tuần trước, color bar tuần trước = 50% opacity)
- Toggle off khi tap lại

---

## 6. Modal M1: Logging Modal

> Trigger: F-03 [+] meal slot, F-03 empty state CTA "Lên kế hoạch", S1 Dashboard "Thêm món đầu tiên".
> Context truyền vào: `{date, mealType, defaultIsCompleted}` — `defaultIsCompleted=0` (planning) khi vào từ tương lai/hiện tại; `=1` (logging) khi vào từ "Đã ăn" path (defer Phase 4).

### Layout — full-bleed bottom sheet, ~85% screen height

```
┌─────────────────────────────────────────┐
│  ▬                                      │  ← Drag handle (close gesture)
│  Thêm món vào Bữa trưa · Thứ 2 09/05   │  ← Context header
│  [✕]                                    │
├─────────────────────────────────────────┤
│  ┌────────────────────────────────────┐ │
│  │ 🔍 Tìm món...                      │ │  ← Search input (focused on open)
│  └────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│  [Tìm kiếm] [Gần đây] [Đã lưu] [📷] [🤖]│  ← Tabs (5 tabs, last 2 defer Phase 5)
├─────────────────────────────────────────┤
│  Tab "Tìm kiếm" (default):              │
│                                         │
│  📋 Sao chép từ ngày khác               │  ← Quick action top
│  ─────────────────────────────────────  │
│                                         │
│  Kết quả ({n} món):                     │
│  ┌────────────────────────────────────┐ │
│  │ Phở bò                              │ │
│  │ 100g · 120 cal · 8g protein         │ │  ← Match preview line
│  │                          [+ Thêm]   │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ Cơm tấm sườn nướng                  │ │
│  │ 100g · 165 cal · 9g protein         │ │
│  │                          [+ Thêm]   │ │
│  └────────────────────────────────────┘ │
│                                         │
│  Empty state nếu chưa search:           │
│  "Tìm món để thêm vào bữa trưa"         │
│  + suggestion chips ("Phở", "Cơm",      │
│   "Bún", "Salad", ...) — top 8 tags    │
└─────────────────────────────────────────┘
```

### Tabs breakdown

#### 6.1. Tab "Tìm kiếm" (default)
- **Search input:** real-time filter (debounce 200ms)
- **Query:** `SELECT * FROM dish WHERE name LIKE '%{q}%' OR name_normalized LIKE '%{q_norm}%' LIMIT 50`
  - `name_normalized` = unaccented lowercase (existing utility, reuse)
- **Result row:** Tên + serving info + nutrition preview (calo + protein only, gọn)
  - Tap row → open detail modal (sub-modal) với servings stepper
  - Tap [+ Thêm] → quick-add 1 serving, modal stays open (cho phép thêm nhiều món liên tiếp)
- **Quick action "📋 Sao chép từ ngày khác":**
  - Tap → date picker → chọn ngày đích → preview list dishes của ngày đó (filter by mealType nếu có) → multi-select → Confirm → batch insert vào current meal_slot, `is_completed=0`
- **Suggestion chips (empty state):** top 8 dishes by usage count (count = occurrences in `planned_dish` last 30 days)

#### 6.2. Tab "Gần đây"
- Query: `SELECT DISTINCT dish_id, MAX(created_at) FROM planned_dish ORDER BY MAX(created_at) DESC LIMIT 30`
- Show last 30 dishes user đã thêm (any meal type, any date)
- Same row format như Tab 1
- Empty state: "Chưa có món nào gần đây. Bắt đầu thêm món để tạo lịch sử."

#### 6.3. Tab "Đã lưu" (Favorites)
- **Phase 3 implementation note:** Hiện tại data-model chưa có `dish.is_favorite` flag. **Defer favoriting feature Phase 4.** Phase 3 ship tab này với empty state placeholder + CTA "Sẽ ra mắt Phase 4".
- **Open issue cho D8 Architect:** Có cần thêm `dish.is_favorite INTEGER DEFAULT 0` vào schema không? Phase 3 không, defer Phase 4 nếu user feedback yêu cầu.

#### 6.4. Tab "📷 Chụp ảnh" (F-05, defer Phase 5+)
- Phase 3 ship tab + redirect "Tính năng AI sẽ ra mắt Phase 5"
- Phase 5+ implement camera + Gemini Vision

#### 6.5. Tab "🤖 AI gợi ý" (F-06, defer Phase 5+)
- Phase 3 ship tab + redirect "Tính năng AI sẽ ra mắt Phase 5"

### Sub-modal: Dish detail + servings

```
┌─────────────────────────────────────────┐
│  [← Quay lại]   Phở bò             [✕]  │
├─────────────────────────────────────────┤
│  Khẩu phần                              │
│  ┌────────────────────────────────────┐ │
│  │  [─]    1.0     [+]                 │ │  ← Stepper (0.1 step, range 0.1-20)
│  │     × 100g                           │ │
│  └────────────────────────────────────┘ │
│                                         │
│  Hoặc nhập trực tiếp:                   │
│  ┌────────────────────────────────────┐ │
│  │  Khẩu phần: [1.0]                   │ │  ← input-wrapper (project convention)
│  └────────────────────────────────────┘ │
│                                         │
│  Dinh dưỡng cho 1.0 khẩu phần (100g):   │
│  • Calo: 120                            │
│  • Protein: 8g · Carbs: 18g · Fat: 2g   │
│                                         │
│  [Thêm vào Bữa trưa]                    │  ← Primary CTA
└─────────────────────────────────────────┘
```

- Stepper [─] [+]: step 0.1, range 0.1-20 (CHECK constraint), tap-and-hold accelerate
- Direct input: numeric, validate on blur, clamp to [0.1, 20]
- Nutrition preview updates realtime khi servings change (compute từ `dish_with_totals × servings`)
- Tap "Thêm vào Bữa trưa" → INSERT `planned_dish` với `is_completed=0`, nutrition = NULL → close sub-modal → close M1 → F-03 refresh
- Cancel: tap [✕] hoặc back arrow → return to M1 search results, KHÔNG insert

### M1 Edge cases

| Tình huống | Hành vi |
|---|---|
| User search nhưng 0 result | "Không tìm thấy '{q}'. [➕ Tạo món mới]" → mở F-02 dish-edit page với prefill name |
| Modal mở khi `mealType` không hợp lệ | Default về `breakfast` + log warning |
| User thêm > 20 món vào 1 slot | Không cap (trade-off: cho user freedom; Phase 4 nếu thấy abuse mới cap) |
| Date >365 ngày tương lai/quá khứ | Không xảy ra (F-03 đã block ở caller level) |
| Search query có ký tự đặc biệt (%, _) | Escape SQL LIKE wildcards |
| Drag-down quá nửa screen | Close modal (cancel) |

---

## 7. Modal M2: Edit Dish Modal

> Trigger: F-03 single tap dish (đã planned hoặc đã logged).
> Context truyền vào: `{plannedDishId}` — load full record + dish info.

### Layout — variant Planned (`is_completed=0`)

```
┌─────────────────────────────────────────┐
│  Sửa món · Bữa trưa Thứ 2 09/05   [✕]   │
├─────────────────────────────────────────┤
│  📌 Đây là kế hoạch — chưa ăn           │  ← Status pill (faded sage bg)
│                                         │
│  Phở bò                                  │
│                                         │
│  Khẩu phần                              │
│  ┌────────────────────────────────────┐ │
│  │  [─]    1.5     [+]                 │ │
│  │     × 100g = 150g                    │ │
│  └────────────────────────────────────┘ │
│                                         │
│  Dinh dưỡng (cập nhật theo recipe mới): │
│  • Calo: 180                            │
│  • Protein: 12g · Carbs: 27g · Fat: 3g  │
│                                         │
│  [✓ Đã ăn món này]                      │  ← Quick mark "ate it"
│  [Lưu thay đổi]                         │
│  [🗑 Xoá món]                            │  ← Tertiary, color danger
└─────────────────────────────────────────┘
```

### Layout — variant Logged (`is_completed=1`)

```
┌─────────────────────────────────────────┐
│  Sửa món · Bữa trưa Thứ 2 09/05   [✕]   │
├─────────────────────────────────────────┤
│  🔒 Đã ăn lúc 12:45                     │  ← Status pill (solid sage bg)
│                                         │
│  Phở bò                                  │
│                                         │
│  Khẩu phần                              │
│  ┌────────────────────────────────────┐ │
│  │  [─]    1.0     [+]                 │ │
│  │     × 100g                           │ │
│  └────────────────────────────────────┘ │
│                                         │
│  Số liệu khi ăn (snapshot):             │  ← Show snapshot nutrition (BOLD)
│  • Calo: 120                            │
│  • Protein: 8g · Carbs: 18g · Fat: 2g   │
│                                         │
│  ⚠️ Recipe đã đổi sau khi ăn:           │  ← Conditional banner (xem 7.3 below)
│  Recipe hiện tại cho 1.0 khẩu phần:     │
│  • Calo: 135 (+15)                      │
│  • Protein: 9g · Carbs: 20g · Fat: 2g   │
│  Nếu sửa khẩu phần, số liệu sẽ tính     │
│  lại theo recipe HIỆN TẠI (không phải   │
│  recipe gốc khi ăn). Xem chi tiết.      │
│  [ℹ️ Tại sao?]                          │
│                                         │
│  [↶ Bỏ đánh dấu đã ăn]                  │  ← Undo log (flip 1→0)
│  [Lưu thay đổi]                         │
│  [🗑 Xoá món]                            │
└─────────────────────────────────────────┘
```

### Components

#### 7.1. Status pill
- Planned: 📌 + label "Đây là kế hoạch — chưa ăn", bg `--sage-50` (faded)
- Logged: 🔒 + label "Đã ăn lúc {HH:mm}" (parse `completed_at`), bg `--sage-200` (solid)
- Tap pill → expand inline tooltip explain Hybrid policy (reuse F-03 §6.5 FAQ link)

#### 7.2. Servings stepper
- Same pattern như M1 sub-modal
- **Logic khác nhau theo state:**

| State | Edit servings → |
|---|---|
| Planned (`is_completed=0`) | Chỉ update `servings` field. Nutrition vẫn realtime (computed). |
| Logged (`is_completed=1`) | Update `servings` + **recompute snapshot** từ `dish_with_totals × new_servings` (theo SNAP-04). 4 cột nutrition cập nhật. |

#### 7.3. Recipe-changed banner (CRITICAL — Hybrid edge case)

> 🎨 **Sally's note:** Đây là điểm tinh tế nhất của Hybrid policy mà F-03 spec đã defer ra "O-F04-1, O-F04-2 sẽ làm ở F-04". Em resolve cả 2 ở đây.

**Trigger:** Logged dish (`is_completed=1`) có snapshot nutrition khác recipe hiện tại (so sánh `pd.calories` vs `dwt.total_calories × pd.servings`)

**Logic compute "đã đổi":**
```
diff_pct = abs(pd.calories - dwt.total_calories * pd.servings) / pd.calories * 100
show_banner = diff_pct > 2%   # threshold để tránh noise từ floating-point
```

**Banner display:**
- Background `--ion-color-warning-tint`
- Icon ⚠️ + heading "Recipe đã đổi sau khi ăn:"
- 2 block nutrition side-by-side (snapshot in BOLD, recipe hiện tại normal + delta)
- Microcopy explain trade-off + link "ℹ️ Tại sao?" → mở FAQ (xem §10)

**Open question O-F04-1 RESOLVED:** Microcopy ở Edit Modal khi sửa servings của logged dish.
- Resolution: 3-tier microcopy
  1. **Status pill** ("🔒 Đã ăn lúc 12:45") — luôn hiển thị, ngắn
  2. **Snapshot label** ("Số liệu khi ăn (snapshot):") — luôn hiển thị, BOLD nutrition values để emphasize đây là frozen
  3. **Recipe-changed banner** — chỉ khi diff >2%, explain rõ behavior nếu sửa servings
- Lý do: tránh overwhelm user với info họ không cần (banner chỉ show khi relevant)

**Open question O-F04-2 RESOLVED:** Edit-past-meal flow — show snapshot vs current recipe.
- Resolution: HIỂN THỊ CẢ HAI khi diff >2%, snapshot là primary (BOLD), recipe hiện tại là secondary (cho context)
- Lý do: User cần biết số sẽ thay đổi nếu sửa servings (SNAP-04 behavior). Hiding recipe hiện tại = user surprise khi save → bad UX.

#### 7.4. "✓ Đã ăn món này" button (planned only)
- Reuse F-03 §6.2 confirm modal flow (đã spec)
- Show preview nutrition trước khi confirm
- Confirm → flip `is_completed=1` + snapshot
- Modal close → F-03 refresh

#### 7.5. "↶ Bỏ đánh dấu đã ăn" button (logged only)
- Tap → confirm modal: "Bỏ đánh dấu '{tên món}' đã ăn? Số liệu hiện tại (300 cal) sẽ bị xoá và quay về realtime theo recipe."
- Confirm → flip `is_completed=0` + clear nutrition columns to NULL (theo SNAP-05)
- Modal close → F-03 refresh, dish chuyển từ solid → faded

#### 7.6. "🗑 Xoá món" button
- Reuse F-03 §2.3 long-press delete flow (optimistic UI + undo toast 8s)
- Modal close ngay → toast hiển thị ở F-03

### M2 Edge cases

| Tình huống | Hành vi |
|---|---|
| `dish` đã bị xoá trong khi M2 mở | Show error state "Món này không còn tồn tại" + close button |
| Servings = 0 (user typed) | Validate clamp về 0.1, không cho save |
| Servings > 20 | Validate clamp về 20 |
| Logged dish, recipe deleted (logged dish vẫn có snapshot độc lập) | Banner: "Recipe gốc đã bị xoá. Số liệu này được giữ làm bằng chứng đã ăn." → ẩn recipe-changed comparison |
| Save thất bại (DB error) | Toast error + giữ modal mở |

---

## 8. Interaction flows (cross-surface)

### F-04.I.1 — User mở app sáng, chưa ăn gì hôm nay
1. App load → Dashboard tab default → S1 Nutrition Card empty state
2. User tap "[➕ Thêm món đầu tiên]"
3. M1 Logging Modal mở với context `{date: today, mealType: 'breakfast'}` (mặc định bữa sáng)
4. User search "Phở" → tap result → sub-modal → set 1.0 serving → "Thêm vào Bữa sáng"
5. Modal close → S1 refresh: ring 0%→6% (120/2000), animation
6. Toast: "Đã thêm 'Phở bò' vào Bữa sáng" [Xem trong Lịch ăn]

### F-04.I.2 — User log thực tế khi ăn xong
1. User đã plan từ tối hôm qua → mở app trưa → F-03 Day View
2. Thấy planned dish faded ở Bữa trưa
3. Tap [✓ Đã ăn] cuối row dish (F-03 §2.3) → confirm modal preview nutrition
4. Confirm → DB transaction: SET is_completed=1, SNAP nutrition, SET completed_at=now
5. F-03: dish chuyển faded → solid (animation 300ms)
6. S2 Day Summary card: ring update (animation), Calo +300
7. Quay lại Dashboard → S1 cũng update

### F-04.I.3 — User edit recipe (F-02), check Day View hôm nay
1. User vào F-02 Quản lý món → edit "Phở bò" → tăng calories per 100g từ 120→135
2. Save → F-02 close
3. Quay sang F-03 Day View hôm nay:
   - Planned "Phở bò" Bữa sáng (chưa ăn) → calo update 120→135 (realtime)
   - Logged "Phở bò" Bữa trưa (đã ăn) → calo VẪN 120 (snapshot)
4. Tap logged dish → M2 Edit Modal → banner ⚠️ "Recipe đã đổi sau khi ăn" + comparison
5. User hiểu → đóng modal, không cần action

### F-04.I.4 — User edit servings của logged dish
1. User tap logged dish (1.0 serving, 120 cal snapshot) → M2 Edit Modal
2. Stepper [+] → 1.5 servings
3. Realtime preview: "Snapshot mới sẽ là 1.5 × 135 (recipe hiện tại) = 202 cal"
4. Banner ⚠️ "Recipe đã đổi sau khi ăn" — hiển thị cảnh báo
5. User tap "Lưu thay đổi" → DB: UPDATE servings=1.5, calories=202, protein/carbs/fat = recipe_now × 1.5
6. F-03 + S1 + S2 refresh

### F-04.I.5 — User xem trend tuần này
1. User tap ring trên S1 Dashboard → S4 Trend View push
2. Default tab = "Calo" (Smart Key Metric Giảm cân)
3. Bar chart 7 ngày Mon-Sun, target line dashed
4. User tap segment "Protein" → re-fetch + animate
5. Tap "📋 So sánh tuần trước" → bar chart split 2 dataset
6. Tap back → quay về Dashboard

### F-04.I.6 — User xoá logged dish (F-03 long-press → Xoá)
1. F-03 §2.3 flow: optimistic remove + undo toast 8s
2. Trong 8s: F-03 + S2 update tức thì (giả sử đã xoá)
3. S1 Dashboard CŨNG update (giả sử)
4. Sau 8s: hard DELETE từ DB. Persisted.
5. Nếu user tap [Hoàn tác] trước 8s: restore record + toast dismiss + UI revert

---

## 9. Logic computation summary (cho D8 Architect)

### Effective nutrition pattern (universal)
```sql
CASE WHEN pd.is_completed = 1
     THEN pd.calories
     ELSE dwt.total_calories * pd.servings
END AS effective_calories
-- (same pattern cho protein, carbs, fat)
```

### Daily total (S1 + S2)
```sql
SELECT
  SUM(CASE WHEN pd.is_completed=1 THEN pd.calories
           ELSE dwt.total_calories * pd.servings END) AS daily_calories,
  -- ... (same for P/C/F)
FROM planned_dish pd
JOIN meal_slot ms      ON pd.meal_slot_id = ms.id
JOIN day_plan dp       ON ms.day_plan_id = dp.id
JOIN dish_with_totals dwt ON pd.dish_id = dwt.id
WHERE dp.date = ?;
```

### Week totals (S3) — chỉ logged
```sql
SELECT
  dp.date,
  SUM(pd.calories) AS logged_calories  -- pd.calories chỉ NOT NULL khi is_completed=1
FROM planned_dish pd
JOIN meal_slot ms ON pd.meal_slot_id = ms.id
JOIN day_plan dp  ON ms.day_plan_id = dp.id
WHERE dp.date BETWEEN ? AND ?
  AND pd.is_completed = 1
GROUP BY dp.date;
```

### Trend (S4) — average + range over period
```sql
WITH daily_totals AS (
  SELECT dp.date, SUM(pd.calories) AS day_total
  FROM planned_dish pd
  JOIN meal_slot ms ON pd.meal_slot_id = ms.id
  JOIN day_plan dp  ON ms.day_plan_id = dp.id
  WHERE dp.date BETWEEN ? AND ?
    AND pd.is_completed = 1
  GROUP BY dp.date
)
SELECT
  AVG(day_total)  AS avg_daily,
  MIN(day_total)  AS min_daily,
  MAX(day_total)  AS max_daily,
  COUNT(*)        AS days_with_data
FROM daily_totals;
```

### Smart Key Metric routing
- Pure UI logic (không cần DB column mới)
- Read `user_profile.goal` (existing) → switch case như §2.5

### Recipe-changed banner trigger
- M2 mở → load `pd.calories` (snapshot) + JOIN `dish_with_totals.total_calories × pd.servings` (current)
- Compute `diff_pct = abs(snapshot - current) / snapshot * 100`
- Show banner if `diff_pct > 2`

---

## 10. Microcopy & FAQ (extension of F-03 §6)

### 10.1. FAQ entry "Tại sao số liệu khi ăn khác với recipe hiện tại?"

**Trigger:** Tap "ℹ️ Tại sao?" link trong M2 banner, hoặc Settings → FAQ → click entry.

**Modal/Page content:**
> **Số liệu khi đã ăn được "đóng băng"**
>
> Khi anh đánh dấu "Đã ăn" cho 1 món, app lưu lại số liệu dinh dưỡng tại thời điểm đó:
> - Calo
> - Protein, Carbs, Fat
>
> Nếu sau này anh sửa recipe (ví dụ tăng calories vì thêm dầu), số liệu món **đã ăn** vẫn giữ nguyên — vì anh đã ăn theo recipe cũ.
>
> **Tại sao quan trọng?**
> Báo cáo tuần/tháng phải đúng với những gì anh ăn thực tế. Nếu số liệu thay đổi mỗi lần sửa recipe → lịch sử không đáng tin.
>
> **Khi nào số liệu sẽ thay đổi?**
> Chỉ khi anh **sửa khẩu phần** trên món đã ăn (vì khi đó cần tính lại). Lúc đó app sẽ dùng recipe HIỆN TẠI × khẩu phần mới.
>
> **Khi nào KHÔNG thay đổi?**
> Khi anh sửa recipe (calories per 100g, ingredients) — số liệu món đã ăn vẫn giữ.
>
> **Còn món chưa ăn (kế hoạch)?**
> Số liệu cập nhật ngay theo recipe mới. Vì kế hoạch là "sẽ ăn", phải dùng recipe mới nhất.

### 10.2. Microcopy library (cho dev copy-paste)

| Context | Vietnamese copy |
|---|---|
| S1 empty (no dishes) | "Chưa ghi món nào hôm nay" |
| S1 empty (no target) | "Chưa đặt mục tiêu dinh dưỡng" |
| S1 supportive (Beginner, in target) | "Anh đang ăn đủ năng lượng 👍" |
| S1 supportive (Beginner, under) | "Còn {N} kcal nữa để đạt mục tiêu" |
| S1 supportive (Beginner, over) | "Đã vượt mục tiêu, để ý bữa cuối nha" |
| S2 status emoji | ✅ ⏳ 🟡 ⚠️ ⛔ (theo % target band) |
| S3 chưa plan | "─── (chưa plan)" |
| S3 hôm nay đang ghi | "{logged}/{target} · đang ghi" |
| S3 future planned | "{plan_total} kcal · kế hoạch" |
| S4 xu hướng | "ổn định" / "tăng X%" / "giảm X%" |
| M1 search empty | "Không tìm thấy '{q}'. [➕ Tạo món mới]" |
| M1 result count | "Kết quả ({n} món):" |
| M1 quick action | "📋 Sao chép từ ngày khác" |
| M2 status pill (planned) | "📌 Đây là kế hoạch — chưa ăn" |
| M2 status pill (logged) | "🔒 Đã ăn lúc {HH:mm}" |
| M2 banner heading | "⚠️ Recipe đã đổi sau khi ăn:" |
| M2 banner explain | "Nếu sửa khẩu phần, số liệu sẽ tính lại theo recipe HIỆN TẠI (không phải recipe gốc khi ăn)" |
| M2 confirm "Bỏ đã ăn" | "Bỏ đánh dấu '{tên món}' đã ăn? Số liệu hiện tại ({calo} cal) sẽ bị xoá và quay về realtime theo recipe." |
| Toast added | "Đã thêm '{tên món}' vào {Bữa X}" [Xem trong Lịch ăn] |
| Toast deleted | "Đã xoá '{tên món}'" [Hoàn tác] (8s countdown) |

---

## 11. Open Questions Resolution

| ID | Question | Resolution | Rationale |
|---|---|---|---|
| **O-F04-1** | Hybrid microcopy ở Edit Modal khi sửa servings của logged dish | 3-tier: status pill + snapshot label BOLD + conditional warning banner (chỉ khi diff>2%) | Tránh overwhelm; show info chỉ khi relevant. Detail §7.3. |
| **O-F04-2** | Edit-past-meal flow — show snapshot vs current recipe diff thế nào | Hiển thị CẢ HAI khi diff>2%; snapshot primary BOLD, recipe current secondary với delta | User cần biết số sẽ đổi nếu sửa servings (SNAP-04). Hiding = surprise UX bad. |
| **O-F04-3** | Macro ring/bar order — Protein vs Carbs đầu | Protein đầu, sau Carbs, sau Fat | Consistent PRD F-04 ordering; align Smart Key Metric Tăng cơ; VN diet rice-heavy → Carbs hay over → demoralizing nếu đầu; convention quốc tế Protein đầu. §3.2. |
| **O-F04-4** | Trend baseline — 7 days rolling vs week-aligned | Week-aligned (Mon-Sun) cho default Tuần view; 30-days rolling cho Tháng view | Đồng bộ F-03 Week View; VN tuần làm việc T2-CN mental model. Trade-off thứ 2 chỉ thấy 1 cột → mitigated bằng "So sánh tuần trước". §5.3. |

### Newly identified open questions (defer to later sessions / next D-step)

| ID | Question | Defer to | Why defer |
|---|---|---|---|
| **O-F04-5** | `dish.is_favorite` flag cho Tab "Đã lưu" — add Phase 3 hay Phase 4? | D8 Architect / Phase 4 user feedback | Phase 3 ship empty placeholder; nếu user yêu cầu favoriting Phase 4 mới schema migration |
| **O-F04-6** | Performance variant Smart Key Metric (2 ring 48px equal weight) — design pattern? | Phase 4 redesign | Phase 3 fall back về Tăng cơ pattern; số user "performance" goal rất ít, defer |
| **O-F04-7** | Trend View export/share (PDF, image)? | Phase 5+ | Phase 3 view-only |
| **O-F04-8** | Macro % donut breakdown (cho Advanced) — implement Phase 3? | Phase 4 polish | Phase 3 chỉ show 4 ring + Fiber row. Donut breakdown defer. |

---

## 12. Component Inventory (cho dev / D8 Architect)

### Existing components (reuse từ design-system + F-03)

| Component | Source | Usage |
|---|---|---|
| `ion-content` / `ion-modal` / `ion-toast` | Ionic standard | M1 / M2 / undo toast |
| `ion-segment` | Ionic standard | S4 metric tabs (Calo/P/C/F) |
| `ion-datetime` | Ionic standard | M1 "Sao chép từ ngày khác" date picker (reuse F-03 §4) |
| `.input-wrapper` (floating-label) | `src/theme/form-field.scss` | M2 servings direct input, search input M1 |
| `app-day-summary-card` | F-03 §8 (component placeholder, F-04 spec define content) | S2 surface |
| `app-day-row` | F-03 §8 (color logic only define ở F-04 §4) | S3 surface |
| Design tokens (`--ion-color-success/warning/danger/medium`, `--sage-50/200`) | `src/theme/variables.scss` | All color logic |

### New components cần tạo (Phase 3)

| Component name | File path (Style 2025) | Purpose |
|---|---|---|
| `app-nutrition-dashboard-card` | `features/dashboard/components/nutrition-dashboard-card/` | S1 surface — variant Beginner/Intermediate/Advanced |
| `app-nutrition-trend-view` | `features/dashboard/trend-view/` (push page) | S4 dedicated screen |
| `app-trend-bar-chart` | `shared/components/trend-bar-chart/` | S4 SVG bar chart (reusable: weekly + monthly) |
| `app-calorie-ring` | `shared/components/calorie-ring/` | Generic ring SVG (props: size, value, target, color) — reuse S1/S2/S4 |
| `app-macro-row` | `shared/components/macro-row/` | 3-column P/C/F bars/rings — variant compact (S2) / expanded (S1) |
| `app-logging-modal` | `features/calendar/components/logging-modal/` | M1 — full bottom sheet với 5 tabs |
| `app-dish-detail-sheet` | `features/calendar/components/logging-modal/dish-detail-sheet/` | M1 sub-modal (servings stepper) |
| `app-edit-dish-modal` | `features/calendar/components/edit-dish-modal/` | M2 — variant planned/logged |
| `app-recipe-changed-banner` | `shared/components/recipe-changed-banner/` | M2 §7.3 conditional banner |
| `app-status-pill` | `shared/components/status-pill/` | M2 status pill (planned/logged variants) |
| `app-servings-stepper` | `shared/components/servings-stepper/` | M2 + M1 sub-modal stepper |
| `app-key-metric-router` | (utility, not component) `core/utils/key-metric-router.ts` | Smart Key Metric pure function |
| `app-effective-nutrition-pipe` | `shared/pipes/effective-nutrition.pipe.ts` | Pipe để compute effective_nutrition trong template |

### Data services / repository (defer cho D8 Architect)

- `NutritionTrackingService` — query daily/week/trend totals (cache layer)
- `PlannedDishRepository` — extend từ F-03 với:
  - `addDish(slot, dish, servings) → planned_dish` (insert)
  - `markCompleted(plannedDishId) → snapshot trigger`
  - `unmarkCompleted(plannedDishId) → clear snapshot`
  - `editServings(plannedDishId, newServings) → conditional recompute`
  - `delete(plannedDishId)` (hard)
- `DishSearchService` — full-text + recent + favorites query
- `TrendComputeService` — average/min/max/slope over period

---

## 13. Acceptance Criteria (cho D11 James/dev)

### Functional — Surfaces

- [ ] S1 Dashboard renders correct variant theo `profile.level + profile.goal`
- [ ] S1 Calorie ring color theo % band (xanh/vàng/đỏ — universal table §2.2)
- [ ] S1 "Xem chi tiết" toggle expand inline, persist trong session storage
- [ ] S1 CTA "Xem trong Lịch ăn" switch tab → F-03 Day View today
- [ ] S1 empty states: no-dishes + no-target render đúng
- [ ] S2 Day Summary Card render trong F-03 Day View top, variant theo level
- [ ] S2 tap card → push S4 Trend View
- [ ] S3 Week color row dùng logic §4 (chỉ tính logged, future = "kế hoạch")
- [ ] S4 Trend View bar chart 7 ngày Mon-Sun với target line
- [ ] S4 metric tabs switch animate (~400ms)
- [ ] S4 "So sánh tuần trước" overlay hoạt động

### Functional — Modals

- [ ] M1 Logging Modal mở từ F-03 [+] với context `mealType`
- [ ] M1 Tab Tìm kiếm: search debounce 200ms, query đúng, suggestion chips top 8
- [ ] M1 Tab Gần đây: 30 dishes mới nhất từ planned_dish
- [ ] M1 Tab Đã lưu: empty placeholder + Phase 4 message
- [ ] M1 Sub-modal: stepper [─][+] 0.1 step, range 0.1-20, direct input clamp
- [ ] M1 Quick action "Sao chép từ ngày khác" — date picker → multi-select → batch insert
- [ ] M1 Empty search "Không tìm thấy" với CTA "Tạo món mới" → F-02 prefill
- [ ] M2 Edit Modal load planned_dish + dish info đúng
- [ ] M2 Status pill hiển thị đúng variant (📌 planned vs 🔒 logged + completed_at time)
- [ ] M2 Edit servings của planned: chỉ update servings, nutrition realtime
- [ ] M2 Edit servings của logged: update servings + recompute snapshot từ recipe HIỆN TẠI
- [ ] M2 Recipe-changed banner chỉ show khi diff_pct > 2%
- [ ] M2 banner hiển thị snapshot BOLD + recipe current + delta
- [ ] M2 "Đã ăn món này" reuse F-03 §6.2 confirm → flip 0→1 + snapshot
- [ ] M2 "Bỏ đánh dấu đã ăn" → confirm + flip 1→0 + clear nutrition NULL (SNAP-05)
- [ ] M2 "Xoá món" reuse F-03 long-press undo toast 8s

### Visual

- [ ] Calorie ring 64px (S1 key) / 48px (S2) / 32px (S2 secondary, S1 Advanced)
- [ ] Stroke-width 8px, animation 600ms ease-out khi value đổi
- [ ] Color tokens dùng `--ion-color-*` (CI guard `check:design-tokens` pass)
- [ ] Macro names: full English Protein/Carbs/Fat/Fiber (CI guard `check:macro-naming` pass)
- [ ] M1 modal full-bleed bottom sheet, drag handle visible, drag-down close
- [ ] M2 status pill: faded sage bg (planned) vs solid sage bg (logged)
- [ ] M2 banner: warning bg với icon ⚠️
- [ ] All input use `.input-wrapper` floating-label (CI guard `check:form-pattern` pass)

### Hybrid policy correctness

- [ ] Effective nutrition pipe dùng pattern `CASE WHEN is_completed=1 THEN snapshot ELSE current * servings END`
- [ ] Mark "Đã ăn" → DB transaction: SET is_completed=1, calories/protein/carbs/fat = current snapshot, completed_at = now (RT-02 → SNAP-01)
- [ ] Unmark "Đã ăn" → 4 cột nutrition = NULL, completed_at = NULL (SNAP-05)
- [ ] Edit servings logged → recompute snapshot từ dwt × new_servings (SNAP-04)
- [ ] Edit recipe (F-02) → planned dishes update realtime, logged dishes giữ snapshot (RT-01 + SNAP-03)
- [ ] DB CHECK constraint enforce: is_completed=0 → 4 cột NULL; is_completed=1 → 4 cột NOT NULL

### Smart Key Metric

- [ ] `key-metric-router.ts` pure function map goal → [primary, secondary]
- [ ] Lose weight → Calo primary, Protein secondary
- [ ] Gain muscle → Protein primary, Calo secondary
- [ ] Maintain → Calo primary, Protein secondary
- [ ] Performance → fall back về Gain muscle Phase 3 (defer dual-equal Phase 4)

### Edge cases

- [ ] M2 dish bị xoá khi modal mở → error state graceful
- [ ] M2 logged dish + recipe deleted → banner adapt "Recipe gốc đã bị xoá"
- [ ] M1 search 0 results → CTA tạo món mới
- [ ] S4 tuần T2 hôm nay → bar chart 1 cột + "So sánh tuần trước" CTA prominent
- [ ] S4 tab Fiber chỉ visible cho Advanced level
- [ ] Servings clamp [0.1, 20] cả ở stepper và direct input

### Accessibility

- [ ] Touch target ≥44x44px cho stepper, status pill, ring tap area
- [ ] Color contrast ≥4.5:1 cho body text (color tokens đã đảm bảo)
- [ ] Screen reader: ring có aria-label "Calo {X} trên {Y}, {Z phần trăm}"
- [ ] M1/M2 trap focus trong modal khi mở
- [ ] M1 search input auto-focus + screen-reader announce "Tìm món, {n} kết quả"

### Performance

- [ ] S1 + S2 render < 100ms (DB query cached)
- [ ] M1 search debounce 200ms, results render < 50ms (LIMIT 50)
- [ ] S4 bar chart render < 200ms cho 7 days; < 500ms cho 30 days

---

## 14. Risks & Mitigations

| Risk | Source | Mitigation |
|---|---|---|
| **R1 (Hybrid policy confuse)** | Mary research, F-03 §10 carry over | F-04 §10 FAQ + §7.3 banner + §10.2 microcopy library extend F-03 §6 |
| **R2 (Recipe-changed banner noise)** | Sally analysis | Threshold diff>2% để skip floating-point noise; only show khi user mở M2 (không proactive notification) |
| **R3 (S1 hiển thị "kế hoạch + đã ăn" gộp gây sai số mental model)** | Sally trade-off §2.7 | Mitigation: F-03 phân biệt visual rõ; user drill-down để verify; document trong FAQ |
| **R4 (Smart Key Metric phức tạp UI cho dev)** | Implementation complexity | Pure function `key-metric-router.ts`; chỉ 4 variant Phase 3 (Lose/Gain/Maintain/Performance→Gain); Performance defer Phase 4 |
| **R5 (Tab "Đã lưu" empty placeholder gây disappointment)** | Sally analysis | Microcopy explain "Sẽ ra mắt Phase 4" + link sang F-02 "Tạo món mới" làm action thay thế |
| **R-S1 (Logging Modal 5 tabs có 2 defer = visual clutter)** | Sally analysis | 2 tab AI hiển thị disabled state với coming-soon badge; vẫn giữ slot để user expect feature; Phase 5 unlock |
| **R-S2 (Trend View tuần T2 chỉ 1 cột)** | Sally analysis | Default "So sánh tuần trước" CTA prominent ngay đầu; user tap → có ngay 14 cột data |
| **R-S3 (Recompute snapshot SNAP-04 confuse user)** | Hybrid policy edge | M2 §7.3 banner explain rõ "sửa khẩu phần = recipe HIỆN TẠI"; FAQ §10.1 dedicated section |

---

## 15. Phase 3 vs Phase 4+ scope split

**Phase 3 (ship trong sprint hiện tại):**
- ✅ S1 Dashboard Card (4 variants level/goal)
- ✅ S2 Day Summary Card (compact variant in F-03)
- ✅ S3 Week color row (logic only, F-03 component)
- ✅ S4 Trend View (Tuần + Tháng selector, 4 metric tabs)
- ✅ M1 Logging Modal (Tabs Tìm kiếm + Gần đây ACTIVE; Đã lưu placeholder; AI tabs disabled)
- ✅ M2 Edit Modal (full functionality, banner, both variants)
- ✅ Hybrid policy enforcement (CHECK constraints already in schema, repo logic)
- ✅ Smart Key Metric router
- ✅ FAQ §10.1 entry
- ✅ All microcopy §10.2

**Defer Phase 4:**
- Tab "Đã lưu" actual favoriting (`dish.is_favorite` schema migration)
- Performance variant dual-equal-ring layout
- S4 export/share PDF/image
- Macro % donut breakdown (Advanced)
- F-04 photo logging (F-05) and AI suggestions (F-06) — Phase 5+

---

## 16. Handoff to D8 (Winston Architect)

**F-04 dependencies cho D8:**
- `NutritionTrackingService` design (caching strategy: signal store vs computed-each-time?)
- `PlannedDishRepository` extension methods (5 mutations §12)
- `DishSearchService` (full-text index, debounce, ranking)
- `TrendComputeService` (window functions vs in-memory aggregation?)
- Effective nutrition pipe vs SQL CASE expression — ưu tiên SQL (single source of truth)
- DB query patterns §9 — verify performance với realistic data (~365 days × 4 slots × 3 dishes = 4380 records)
- New shared components 12 (ring, macro-row, stepper, banner, status-pill) — design system token usage

**Open issues for D8 review:**
- O-F04-5: `dish.is_favorite` schema decision (Phase 3 NO; Phase 4 if user feedback)
- D-TECH-1 (from research): Repository pattern strict? Mary recommended YES; Winston confirm
- Effective nutrition: SQL CASE (single query) vs computed-pipe (template-side) — recommend SQL

**D8 acceptance criteria:**
- [ ] Architect review §9 SQL patterns (correctness + index usage)
- [ ] Component design §12 split (which is signal store vs pure component)
- [ ] Caching strategy for S1/S2 (re-query each tick vs effect-driven)
- [ ] Migration: `dish.is_favorite` confirm DEFER hay add now (collapse vào v1 init schema theo pre-release rule)

---

## 17. Sally signing off

F-04 UX spec hoàn tất. Format wireflow text-based (~60KB, 17 sections). Đã resolve **4 open questions O-F04-1..4** từ Mary research (D0a) + identify thêm **4 open questions O-F04-5..8** defer cho D8/Phase 4.

**Tổng output Phase 3 D5:**
- 4 surface (S1 Dashboard, S2 Day Summary, S3 Week color, S4 Trend)
- 2 modal (M1 Logging, M2 Edit)
- 6 interaction flows cross-surface
- Logic computation SQL patterns cho D8 (§9)
- Microcopy library §10.2
- 13 new components Phase 3 (§12)
- Acceptance criteria 7 nhóm (§13)
- Risk register 5 carry + 3 mới identified

**Hybrid policy critical path (R1):**
- F-03 §6 đã cover phần planning surface (coachmark, confirm, banner F-02)
- F-04 §7.3 + §10 cover phần logged-edit surface (banner trong M2, FAQ entry, snapshot SNAP-04 explanation)
- **Hai spec hợp lại = đủ microcopy cho toàn bộ user journey Hybrid**

**Sẵn sàng handoff cho:**
- **D8 Winston (Architect):** consume §9 SQL patterns + §12 component inventory + §16 open issues
- **D9 Bob (PM):** epic split Phase 3 / Phase 4 đã sẵn ở §15 — chỉ cần cắt thành stories
- **D11 James (Dev):** acceptance criteria §13 đủ chi tiết để implement

_Cập nhật cuối: 2026-05-09 — Sally (UX Designer, BMAD)_
