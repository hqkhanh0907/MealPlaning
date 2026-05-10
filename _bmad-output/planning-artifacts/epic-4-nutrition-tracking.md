---
stepsCompleted: ['epic-4-drafted-2026-05-10']
inputDocuments:
  - docs/2-requirements/prd.md (F-04 §F-04 lines 316-347)
  - _bmad-output/planning-artifacts/ux-spec/f-04-nutrition-tracking-ux-spec-2026-05-09.md (17 sections, 60 AC)
  - _bmad-output/planning-artifacts/architecture/calendar-tracking-2026-05-09.md (DEC-02..06, R-A4, §10.2/10.4 components)
  - docs/4-architecture/business-rules.md (RULE-PLANNED-DISH-HYBRID, SNAP-03/04/05)
  - _bmad-output/planning-artifacts/epic-3-calendar.md (Story 3.1-3.4 foundation cần Done trước)
  - src/app/core/services/database/schema.ts (SCHEMA_VERSION=2 + dish.is_favorite + indexes ready)
epic: 4
phase: 3
status: draft
ownerLanguage: vi
revision: 1
revisionNote: |
  Rev 1 (2026-05-10): Draft sau Epic 3. Slice gồm: foundation (NutritionStore +
  NutritionQueryService + 3 shared components MacroRow/RecipeChangedBanner/TrendBarChart),
  4 surface F-04 (S1 Dashboard / S2 DaySummary content fill / S3 Week color logic
  in DayRow / S4 Trend View dedicated), 2 modal (M1 Logging / M2 Edit). Tab "Đã lưu"
  Phase 3 wire ngay (DEC-08). Performance variant Smart Key Metric defer Phase 4.
  AI tabs (📷/🤖) defer Phase 5+.
---

# HealthMate AI — Epic 4: Nutrition Tracking & Display (F-04)

> **Phase 3 — partition 2.** Epic này build TOÀN BỘ surface dinh dưỡng cross-feature + 2 modal logging/edit + Hybrid policy edge case microcopy. Ride trên foundation Epic 3 (CalendarStore + repo + 4 shared component). KHÔNG sửa schema, KHÔNG sửa repo (chỉ thêm `NutritionQueryService` cho aggregate query phức tạp).

---

## Overview

F-04 không phải 1 màn hình đơn lẻ — là **hệ thống hiển thị dinh dưỡng cross-feature** (4 surface) + **2 modal nhập liệu**. Phải đúng Hybrid policy: realtime cho planned, snapshot cho logged, banner cảnh báo khi recipe đổi sau snapshot.

Phase 3 ship 6 layer:
1. **NutritionStore + Query foundation** (Story 4.0) — store + service + 4 SQL pattern (daily/week/trend/listRecentLogged sẵn ở repo)
2. **Shared components còn lại** (Story 4.1) — MacroRow + RecipeChangedBanner + TrendBarChart (3 còn lại của 7 shared)
3. **S1 Dashboard Nutrition Card** (Story 4.2) — 4 variant theo level/goal + Smart Key Metric router
4. **S2 + S3 fill content** (Story 4.3) — DaySummaryCard fill (placeholder Story 3.5 đã stub) + DayRow color logic (Story 3.6 đã layout)
5. **S4 Trend View** (Story 4.4) — dedicated push page, tuần/tháng selector, 4 metric tab
6. **M1 Logging Modal** (Story 4.5) — 5 tab (Search/Recent/Favorites active; Photo/AI defer Phase 5)
7. **M2 Edit Dish Modal** (Story 4.6) — 2 variant planned/logged + RecipeChangedBanner + Hybrid microcopy

Sau Epic 4, F-03 + F-04 fully functional. Phase 3 đóng. User journey end-to-end: mở Dashboard → thấy ring calo today → tap → Trend View 7 ngày → quay lại tab Lịch ăn → tap [+] meal slot → Modal Search dish → add → mark "Đã ăn" → snapshot → sửa recipe ở F-02 → quay về Calendar thấy planned dish update realtime, logged dish KHÔNG đổi (banner ⚠️ trong M2 nếu mở edit).

---

## Requirements Inventory

### Functional Requirements (PRD F-04 lines 316-347)

| FR | Mô tả | Trạng thái |
|---|---|---|
| F-04.1 | 4 surface hiển thị: Dashboard card / Day Summary / Week color / Trend | ⏳ 0% Epic 4 |
| F-04.2 | Level-adaptive display (Beginner/Intermediate Lose|Gain/Advanced) | ⏳ 0% |
| F-04.3 | Smart Key Metric routing (goal → highlight ring) | ⏳ 0% |
| F-04.4 | Logging Modal với Search + Recent + Favorites + Copy-from-date | ⏳ 0% |
| F-04.5 | Edit Modal với Hybrid edge case (recipe-changed banner) | ⏳ 0% |
| F-04.6 | Color band universal (xanh ≥80% ≤110%, vàng 50-79% / 110-120%, đỏ <50% / >120%) | ⏳ 0% |

### Non-Functional Requirements

- **NFR-PERF-01**: S1 + S2 render < 100ms (DB query cached qua NutritionStore)
- **NFR-PERF-02**: M1 search debounce 200ms, render < 50ms (LIMIT 50)
- **NFR-PERF-03**: S4 bar chart render < 200ms cho 7 ngày, < 500ms cho 30 ngày
- **NFR-A11Y-01**: Touch target ≥44dp, ring có aria-label "{Variant} {value} trên {target}, {pct phần trăm}"
- **NFR-A11Y-02**: M1/M2 trap focus trong modal khi mở
- **NFR-RELIABILITY-01**: Hybrid policy enforcement: edit recipe ở F-02 → planned update realtime, logged giữ snapshot (verify cross-store invalidation)

### UX Design Requirements

- 4 variant Dashboard card theo `profile.level + profile.goal` (F-04 §2 Layouts)
- M1 full-bleed bottom sheet ~85% screen height, drag handle, drag-down close
- M2 status pill 📌 planned / 🔒 logged + completed_at HH:mm
- Recipe-changed banner threshold `diff_pct > 2%` (avoid floating-point noise)
- FAQ entry "Tại sao số liệu khi ăn khác recipe hiện tại?" (F-04 §10.1)
- 21 microcopy entries §10.2 phải khớp

### Architecture Decisions (must follow)

- **DEC-02**: Effective nutrition tính ở SQL (`CASE WHEN is_completed=1 THEN snapshot ELSE current * servings END`). KHÔNG tạo Angular pipe.
- **DEC-03**: Thêm `NutritionQueryService` (Epic 4 ownership) cho aggregate (daily/week/trend) — KHÔNG mở rộng `PlannedDishRepository` thêm method aggregate.
- **DEC-04**: `NutritionStore` listen `CalendarStore.invalidationTick` (one-way wire).
- **DEC-05**: Trend cache TTL 5 phút + clear on invalidation.
- **DEC-06**: 3 SQL query pattern (daily / week / trend) với COALESCE + CTE — assert EXPLAIN dùng partial index.
- **DEC-08**: Tab "Đã lưu" wire Phase 3 (cột `is_favorite` đã có v1, partial index DEC-11 ship).
- **DEC-09 §10.2/10.4**: MacroRow + RecipeChangedBanner contracts.

### Risks Inventory (từ arch §12 + F-04 §14)

| Risk | Story owner | Mitigation |
|---|---|---|
| R-A4 Trend 365-day query slow Android low-tier | 4.0/4.4 | Partial index + 90-day cap; cache TTL 5min; aggregate snapshot defer Phase 4 |
| R1 Hybrid microcopy confuse user | 4.6 | 3-tier: status pill + snapshot label BOLD + banner conditional only diff>2% |
| R2 Banner noise floating-point | 4.6 | Threshold > 2% explicit |
| R3 S1 hiển thị "kế hoạch + đã ăn" gộp gây sai mental model | 4.2 | F-03 visual phân biệt clearly + FAQ §10.1 |
| R4 Smart Key Metric phức tạp UI | 4.0 (router) + 4.2 | Pure function `key-metric-router.ts`, 4 variant Phase 3, Performance defer Phase 4 |
| R-S2 Trend View tuần T2 chỉ 1 cột | 4.4 | "So sánh tuần trước" CTA prominent đầu page |

### FR Coverage Map

| FR / Decision | Story | Verification |
|---|---|---|
| Foundation NutritionStore + Service + Router (DEC-03/04/05/06) | 4.0 | Service spec với EXPLAIN assert; store spec invalidation tick listen |
| Shared MacroRow/Banner/TrendChart (DEC-09 §10.2/10.4) | 4.1 | Component spec contracts + visual QA |
| F-04.1/2/3 S1 Dashboard 4 variant (PRD §F-04) | 4.2 | Manual QA: switch profile (4 combo level×goal) → Dashboard render đúng variant |
| F-04.1 S2 + S3 content (đã layout Epic 3) | 4.3 | F-03 Day View có summary card live data; Week color đúng 6 case theo F-04 §4 |
| F-04.1 S4 Trend View (push page) | 4.4 | Manual: tap ring Dashboard → Trend → 4 metric tab + Tuần/Tháng selector + So sánh tuần trước |
| F-04.4 M1 Logging Modal | 4.5 | Manual: tap [+] Bữa sáng → Search "phở" → result → tap [+ Thêm] → Day View update; Recent tab show 30 dish; Favorites tab toggle ⭐ |
| F-04.5 M2 Edit Modal + Hybrid edge | 4.6 | Manual: edit servings logged dish → snapshot recompute (KHÔNG ratio scale); edit recipe F-02 → quay M2 logged → banner ⚠️ hiện diff |

---

## Epic List

- **Epic 4: Nutrition Tracking & Display** — 7 stories, ước lượng **10–14 ngày dev** (4.0=1.5d + 4.1=1.5d + 4.2=2d + 4.3=1d + 4.4=2d + 4.5=2.5d + 4.6=2d)

---

## Epic 4: Nutrition Tracking & Display

**Goal:** F-04 production-ready với 4 surface + 2 modal + Hybrid edge case xử lý đầy đủ. Phase 3 đóng — Smart Key Metric routing + level-adaptive UI hoạt động cho 4 user variant.

**Done criteria (Epic-level):**
- [ ] 7 story đạt acceptance criteria
- [ ] `npm run check:guards` (5 guards) + `ng test` (≥520 test pass) + `ionic build --prod` pass
- [ ] APK install + manual QA pass cho 6 user journey: dashboard ring, trend view, log via modal, mark eaten, edit recipe → banner, edit servings logged → recompute
- [ ] FAQ entry "Tại sao snapshot khác recipe?" trong Settings → Help (hoặc inline trong M2 modal)
- [ ] Hybrid cross-feature integrity test: edit ingredient.calories ở F-02 → planned dish nutrition update realtime; logged dish snapshot KHÔNG đổi (verified qua manual QA + integration spec)

---

### Story 4.0: NutritionStore + NutritionQueryService + KeyMetricRouter foundation

**As a** dev,
**I want** signal store + aggregate query service + Smart Key Metric router pure function,
**So that** F-04 surfaces (S1-S4) consume từ store, không inline SQL ở component.

**Acceptance Criteria:**

**AC-1 (NutritionQueryService — `src/app/core/services/nutrition/nutrition-query.service.ts`).** 3 method + spec:

```ts
class NutritionQueryService {
  async dailyTotals(date: string): Promise<NutritionTotals>;
  async weekTotals(weekStart: string): Promise<DayTotals[]>;  // 7 entry, Mon-Sun
  async trend(start: string, end: string, metric: KeyMetric): Promise<TrendPoint[]>;
}
```

SQL pattern theo arch §10.2 / DEC-06:
- `dailyTotals`: SUM(effective_calories/protein/carbs/fat) WHERE day_plan.date = ? — INCLUDE planned (chưa ăn) + logged (theo F-04 §2.7 Sally rationale: Dashboard show "ngày sẽ thế nào")
- `weekTotals`: GROUP BY date, SUM(effective_*) — CHỈ logged (F-04 §4 — Week View là review nhật ký)
- `trend`: CTE pattern §arch DEC-06.3, return `[{date, value}]`

**AC-2 (EXPLAIN spec).** 3 spec test bằng `EXPLAIN QUERY PLAN`:
- weekTotals → uses `idx_planned_dish_completed`
- trend → uses `idx_planned_dish_completed_at` cho ORDER BY
- dailyTotals → uses `idx_day_plan_date` cho WHERE date

**AC-3 (NutritionStore — `src/app/core/stores/nutrition.store.ts`).** Theo DEC-04/05:
- Signals: `today = signal<NutritionTotals|null>(null)`, `targetCalories/Protein/Carbs/Fat = computed(() => profileStore.profile()?.target_*)`, `keyMetric = computed(() => routeKeyMetric(profile.level, profile.goal))`
- `effect()` listen `CalendarStore.invalidationTick` + `CalendarStore.currentDate` → call `nutritionQueryService.dailyTotals(date)` → set `today`
- Method `loadTrend(start, end, metric): Promise<TrendPoint[]>` với in-memory cache TTL 5 phút (Map keyed `${start}_${end}_${metric}`), cleared on `invalidationTick` change
- `providedIn: 'root'`, inject() pattern

**AC-4 (KeyMetricRouter — `src/app/core/utils/key-metric-router.ts`).** Pure function per F-04 §2.5:
```ts
export type KeyMetric = 'calories'|'protein'|'carbs'|'fat';
export type KeyMetricVariant = 'beginner'|'lose'|'gain'|'maintain'|'advanced';

export function routeKeyMetric(level: ProfileLevel, goal: ProfileGoal): KeyMetricVariant;
export function visibleMetrics(variant: KeyMetricVariant): KeyMetric[];
export function pickKeyMetric(profile: UserProfile): [primary: KeyMetric, secondary: KeyMetric];
```

Mapping per F-04 §2.5:
- beginner → ['calories'], chỉ key
- lose_weight → ['calories', 'protein']
- gain_muscle → ['protein', 'calories']
- maintain → ['calories', 'protein']
- performance → fallback ['protein', 'calories'] (defer dual-equal Phase 4)
- advanced → ['calories', 'protein', 'carbs', 'fat']

**AC-5 (spec coverage).**
- `nutrition-query.service.spec.ts`: 3 method × 2 case (with data / empty) + EXPLAIN assertions
- `nutrition.store.spec.ts`: invalidationTick listen → today reload; trend cache hit/miss/clear-on-tick
- `key-metric-router.spec.ts`: 5 variant × 4 goal = 20 combination matrix + edge case (null profile → default 'beginner')

**AC-6 (file structure Style 2025).** No `.service.ts` suffix at filename, no `Service` class suffix → file `nutrition-query.ts` class `NutritionQueryService`? **CONFLICT** — verify với `coding-conventions.md §1`. Project memory note: domain term suffix `Repository`/`Store` allowed (existing `dish.store.ts`/`profile.store.ts`), `Service` còn tồn tại dạng nào? Grep `src/app/core/services` → file pattern: `local-notifications.ts`, `theme-service.ts` (mixed). **Decision for story:** Theo CI guard `check:style-2025`, drop `Service` từ class name → class `NutritionQuery` ở `nutrition-query.ts`. Nếu CI fail run sau implement, story dev review lại.

**Technical notes:**
- `effective_*` computed columns đã có ở repo SELECT (Story 3.2 AC-5). NutritionQueryService chỉ SUM/aggregate, KHÔNG re-compute.
- COALESCE(SUM(...), 0) để empty day trả 0 thay NULL.
- Trend metric: nếu metric != 'calories', SUM cột tương ứng (effective_protein/carbs/fat).

**Pitfalls:**
- **Disaster C — schema field naming:** `target_calories`/`target_protein`/`target_carbs`/`target_fat` (KHÔNG `_g` suffix). Verify trước khi viết store computed.
- Cache invalidation race: nếu user mutation trong khi trend đang fetch → cache sẽ stale. Mitigation: clear cache TRƯỚC khi resolve fetch promise (effect order).

**Estimate:** 1.5 ngày

---

### Story 4.1: Shared components — MacroRow + RecipeChangedBanner + TrendBarChart

**As a** dev,
**I want** 3 shared component còn lại (sau Story 3.4) theo DEC-09 §10.2/10.4 + new TrendBarChart,
**So that** S1/S2/S4 surface có building block đầy đủ.

**Acceptance Criteria:**

**AC-1 (MacroRow — `shared/components/macro-row/`).** Theo DEC-09 §10.2:
```ts
type MacroRowMode = 'compact' | 'expanded';
class MacroRow {
  mode = input<MacroRowMode>('compact');
  protein = input.required<{value: number; target: number}>();
  carbs = input.required<{value: number; target: number}>();
  fat = input.required<{value: number; target: number}>();
  fiber = input<{value: number; target: number} | null>(null);
  highlightedMetric = input<KeyMetric | null>(null);
}
```
- `compact`: 3 column ngang (P → C → F), mỗi column = mini ring 32px + label + value/target (S2 layout)
- `expanded`: 3 row, mỗi row = bar chart full width + label + value/target (S1 Intermediate layout)
- Order **Protein → Carbs → Fat** fixed (Sally O-F04-3 resolution F-04 §3.2)
- highlightedMetric: variant tương ứng có border highlight `var(--ion-color-primary)`
- Color theo `bandColor()` util (Story 3.4 AC-5)

**AC-2 (RecipeChangedBanner — `shared/components/recipe-changed-banner/`).** Theo DEC-09 §10.4:
```ts
class RecipeChangedBanner {
  snapshotCalories = input.required<number>();
  currentCalories = input.required<number>();
  diffPct = input.required<number>();  // pre-computed by caller
  faqLinkClicked = output<void>();
}
```
- Visual: bg `var(--ion-color-warning-tint)`, ⚠️ icon, BOLD snapshot value, italic recipe-current value, delta line
- "ℹ️ Tại sao?" link → emit `faqLinkClicked`
- Caller responsibility: chỉ render khi `diffPct > 2` (banner trust input, không compute)

**AC-3 (TrendBarChart — `shared/components/trend-bar-chart/`).** Theo F-04 §5.5:
```ts
class TrendBarChart {
  bars = input.required<TrendPoint[]>();
  targetLine = input<number | null>(null);
  metric = input.required<KeyMetric>();
  height = input<number>(180);  // px
  compareWith = input<TrendPoint[] | null>(null);  // overlay tuần trước
}
```
- SVG-based (NOT canvas), animation 400ms khi switch tab/period
- Bar color = `bandColor(value/target, metric)` per bar
- Target line dashed, color `var(--ion-color-medium)`
- X-axis label: T2..CN cho week, hoặc 1/5/10/15/20/25/30 cho month
- Empty bar (no data) height 0 + label "─" dưới
- compareWith overlay: bars tuần trước render với opacity 0.5, sau bars chính

**AC-4 (PC-1 + Style 2025 + tokens).** 3 component × 3 file. CI guards pass.

**AC-5 (spec).** Component spec basic: render với input variant; emit output trên user action; aria-label phù hợp.

**Estimate:** 1.5 ngày

---

### Story 4.2: S1 Dashboard Nutrition Card — 4 variant + Smart Key Metric routing

**As a** user,
**I want** Tab "Tổng quan" hiển thị calorie ring (hoặc protein ring nếu Tăng cơ) + macro overview phù hợp level,
**So that** thấy ngay "hôm nay đang ăn thế nào" không cần mở Lịch ăn.

**Acceptance Criteria:**

**AC-1 (NutritionDashboardCard — `features/dashboard/components/nutrition-dashboard-card/`).** 4 variant render (per F-04 §2):
- Beginner: chỉ progress bar 12px Calo + microcopy supportive ("Anh đang ăn đủ năng lượng 👍")
- Intermediate Lose: CalorieRing 64px (key) + Protein mini bar
- Intermediate Gain: ProteinRing 64px (key) + Calo mini bar
- Advanced: 4 ring (Calo 64px + 3 macro 32px) + Fiber row dưới

Variant chọn qua `routeKeyMetric(profile.level, profile.goal)`.

**AC-2 (data binding).** Inject `NutritionStore`, render từ `today()` signal + `targetCalories/Protein/Carbs/Fat` computed. Empty state nếu `today()?.calories === 0`: "Chưa ghi món nào hôm nay" + CTA "[➕ Thêm món đầu tiên]" → emit openLogModal (Story 4.5).

**AC-3 (no-target empty state).** Nếu `profile?.target_calories == null`: "⚙️ Chưa đặt mục tiêu dinh dưỡng" + CTA "[Đi đến Cài đặt]".

**AC-4 ("Xem chi tiết" toggle).** Inline expand (KHÔNG modal mới), persist trong `sessionStorage` keyed `dashboard.detailExpanded`. Expanded show full P/C/F (Beginner) hoặc + Fiber + macro % breakdown.

**AC-5 (CTA "Xem trong Lịch ăn").** Tap → switch tab Lịch ăn (qua `Router.navigate(['/tabs/calendar'])`) + `CalendarStore.setDate(today)`.

**AC-6 (Tap key ring → Trend View).** Tap ring 64px → push navigate `Router.navigate(['/dashboard/trend'], {queryParams: {metric: 'calories'}})` (route mới Story 4.4).

**AC-7 (microcopy F-04 §10.2).** Implement đúng 5 microcopy entries cho S1: empty no-dishes, empty no-target, supportive in-target, supportive under, supportive over.

**AC-8 (dashboard.page.ts wire).** Extend existing dashboard.page.ts: inject NutritionStore + NutritionDashboardCard. Layout: title row + NutritionCard + (existing dashboard content còn lại nếu có).

**AC-9 (manual QA emulator).**
- Tạo profile level=intermediate goal=lose_weight → Dashboard show CalorieRing 64px + Protein mini bar
- Đổi goal=gain_muscle (Settings) → reload → ProteinRing 64px + Calo mini bar
- Đổi level=beginner → progress bar 12px only + microcopy
- Đổi level=advanced → 4 ring layout
- Calo today = 1850, target = 2000 → ring xanh 92%
- Calo today = 2500, target = 2000 → ring đỏ 125%
- Calo today = 0 → empty state CTA visible

**Estimate:** 2 ngày

---

### Story 4.3: S2 DaySummaryCard content fill + S3 DayRow color logic

**As a** user,
**I want** F-03 Day View top hiển thị calorie ring + macro row, F-03 Week View 7 day row có màu đúng theo % target,
**So that** thấy nutrition overview ngay trong tab Lịch ăn không phải mở Dashboard.

**Note:** DaySummaryCard placeholder + DayRow layout đã ship Epic 3 (Story 3.5/3.6). Story này FILL CONTENT.

**Acceptance Criteria:**

**AC-1 (DaySummaryCard fill — `features/calendar/components/day-summary-card/`).** Theo F-04 §3:
- 3 variant theo level (Beginner/Intermediate/Advanced) — nhưng KHÔNG có "Xem chi tiết" toggle (S2 vs S1 difference)
- Intermediate default: Ring 48px (KEY metric) + label "Calo: X / Y  Z%  {emoji}" + MacroRow mode=compact
- Beginner: progress bar + "[▼ Xem Protein, Carbs, Fat]"
- Advanced: 4 ring (Calo 48 + 3 macro 32) + Fiber row
- Status emoji map: ✅ in 80-110%, 🟡 50-79%, ⚠️ 110-150%, ⛔ <50% or >150%

**AC-2 (data source).** Inject `NutritionStore`, derive từ `today()` + `keyMetric()` + `profileLevel`. Cùng pattern Story 4.2 nhưng compact layout.

**AC-3 (Tap card → S4 Trend View).** F-04 §3.3: tap whole card → push Trend View (NOT inline expand — different vs S1). `Router.navigate(['/dashboard/trend'], {queryParams: {metric: keyMetric()}})`.

**AC-4 (DayRow color logic — `features/calendar/components/day-row/`).** Story 3.6 đã ship layout + status icon mapping basic. Story 4.3 confirm/refine logic per F-04 §4 chi tiết:
- Chưa plan → neutral gray, status_icon = none, label "─── (chưa plan)"
- Future planned (date > today) → neutral gray, icon "📋", label "{plan_total} kcal · kế hoạch"
- Today đang ghi → orange-warning, icon "⏳", label "{logged}/{target} · đang ghi"
- Past có data → màu theo logged_total/target band (5-band universal)

**AC-5 (week_view_calorie_total query).** Đảm bảo Week query CHỈ SUM `is_completed=1` (NutritionQueryService.weekTotals đã đúng từ Story 4.0). Refactor DayRow nhận `weekDay: WeekDayTotal` từ store, không inline compute.

**AC-6 (dot color refinement — F-04 §4).** Số dot = số bữa (đã có Story 3.6); MÀU dot = average của các slot trong ngày (mới): "4 slot, 3 slot ăn đủ + 1 trống → 3 dot xanh + 1 dot xám".

**AC-7 (manual QA).**
- F-03 Day View: top card hiển thị CalorieRing 48px với data live từ NutritionStore.today
- Edit servings 1 dish trong slot → Day View summary tự update (qua invalidationTick wire)
- F-03 Week View: 7 ngày màu đúng (today orange ⏳, past xanh/vàng/đỏ, future neutral)
- Add planned dish ngày mai → week row ngày mai hiển thị "📋 800 kcal · kế hoạch"

**Estimate:** 1 ngày

---

### Story 4.4: S4 Trend View — dedicated push page với 4 metric tab + Tuần/Tháng selector + So sánh tuần trước

**As a** user,
**I want** xem xu hướng calo/protein/carbs/fat 7 ngày hoặc 30 ngày với bar chart + so sánh tuần trước,
**So that** nhận diện pattern ăn uống và điều chỉnh.

**Acceptance Criteria:**

**AC-1 (route + page — `features/dashboard/trend-view/`).** Push route `/dashboard/trend?metric=calories&period=week`. Lazy loaded.

**AC-2 (layout F-04 §5).**
- Header: [← Quay lại] + "Xu hướng dinh dưỡng"
- Metric tabs (IonSegment): Calo | Protein | Carbs | Fat (Fiber chỉ Advanced level — hidden by default, computed visibility)
- Date range row: "Tuần dd-dd/mm/yy" + selector dropdown "Tuần / Tháng"
- Statistics row: "TB: X / Y (Z%)" + "Range: min - max" + suffix "TB 7 ngày" cho week
- TrendBarChart (Story 4.1)
- Summary text: "{X}/{N} ngày trong mục tiêu" + "Xu hướng: ổn định/tăng X%/giảm X%"
- Compare button: "📋 So sánh tuần trước" → toggle overlay

**AC-3 (data fetch).** Inject `NutritionStore`. Call `loadTrend(start, end, metric)` qua effect khi metric/period change. Default metric = `keyMetric()` (Smart routing).

**AC-4 (Period selector).**
- "Tuần" = week-aligned Mon-Sun chứa today (F-04 §5.3 O-F04-4 resolution)
- "Tháng" = 30 days rolling (today-29 → today)
- Dropdown UI dùng `IonSelect` hoặc bottom sheet picker

**AC-5 (xu hướng compute).** Slope so với period trước:
```
delta_pct = (current_avg - previous_avg) / previous_avg * 100
abs(delta) < 5 → "ổn định"
delta > 5 → "tăng X%"
delta < -5 → "giảm X%"
```

**AC-6 (Compare overlay).** Tap "So sánh tuần trước" → fetch additional `loadTrend(prevWeekStart, prevWeekEnd, metric)` → pass vào TrendBarChart `compareWith` input → overlay opacity 0.5. Toggle off khi tap lại.

**AC-7 (NO streak counter — anti-pattern).** Verify code KHÔNG implement streak (research Q4 anti-pattern). Add comment trong page header.

**AC-8 (Empty state).** Nếu period không có data nào: "Chưa có dữ liệu cho {period}" + CTA "[Bắt đầu ghi món]" → push Calendar tab.

**AC-9 (T2 hôm nay 1 cột — R-S2 mitigation).** Nếu `weekData.filter(d => d.value > 0).length === 1` → hiển thị "So sánh tuần trước" CTA prominent đầu page (above chart) thay default ở dưới.

**AC-10 (manual QA).**
- Seed data 14 ngày → Trend View "Tuần" → 7 cột với bar
- Switch tab "Protein" → animation 400ms → bar update
- Switch period "Tháng" → 30 cột
- Tap "So sánh tuần trước" → overlay opacity 0.5 hiện tuần trước
- Profile level=advanced → tab Fiber visible
- Profile level=intermediate → tab Fiber hidden

**Pitfalls:**
- TrendBarChart performance < 200ms cho 7 ngày, < 500ms cho 30 ngày — verify trên emulator-5554 với log.
- IonSegment touch target ≥44dp cho 4 tab.

**Estimate:** 2 ngày

---

### Story 4.5: M1 Logging Modal — Search + Recent + Favorites + Sub-modal servings

**As a** user,
**I want** modal full-bleed bottom sheet để tìm/chọn món thêm vào meal slot, với tab Recent + Favorites + Sao chép từ ngày khác,
**So that** add dish nhanh không cần navigate đa màn.

**Acceptance Criteria:**

**AC-1 (LoggingModal — `features/calendar/components/logging-modal/`).** Modal full-bleed bottom sheet ~85% screen height, drag handle, drag-down close (>50% screen → cancel). Context input: `{date, mealType, defaultIsCompleted: 0}`.

**AC-2 (header).** "Thêm món vào {Bữa X} · {Thứ}, {dd/mm}" + [✕] button.

**AC-3 (5 tabs — IonSegment).** Tabs: [Tìm kiếm] [Gần đây] [Đã lưu] [📷 disabled] [🤖 disabled].
- Tab Photo + AI: render với class `disabled` + coming-soon badge "Phase 5"; tap → toast "Tính năng AI sẽ ra mắt Phase 5".

**AC-4 (Tab "Tìm kiếm" — default).**
- Search input (`.input-wrapper` floating-label, auto-focus on open) — debounce 200ms
- Query: `SELECT * FROM dish WHERE name LIKE '%${q}%' OR name_normalized LIKE '%${q_norm}%' LIMIT 50` — escape SQL wildcards `%` `_`
- Quick action top: "📋 Sao chép từ ngày khác" → date picker → preview list dishes → multi-select → batch insert
- Result row: tên + "100g · {calo} cal · {protein}g protein" + button [+ Thêm] (quick-add 1 serving, modal stays open)
- Tap row body (NOT [+]) → open sub-modal DishDetailSheet (AC-7)
- Empty state (chưa search): "Tìm món để thêm vào {Bữa X}" + suggestion chips top 8 dishes (query top 8 by `count` từ `planned_dish` last 30 days)
- Empty result (search 0 hit): "Không tìm thấy '{q}'. [➕ Tạo món mới]" → navigate F-02 dish-edit prefill name

**AC-5 (Tab "Gần đây").** Query: `repo.listRecentLogged(30)` (đã có Story 3.2). Show last 30 distinct dishes user đã thêm. Same row format.

**AC-6 (Tab "Đã lưu" — DEC-08).** Query: `SELECT * FROM dish WHERE is_favorite = 1 ORDER BY name`. Empty: "Chưa có món yêu thích. Bấm ⭐ trên món bất kỳ để thêm." Tap row → sub-modal. Toggle ⭐ in F-02 dish detail (out-of-scope F-04 — hint text only).

**AC-7 (DishDetailSheet sub-modal — `features/calendar/components/logging-modal/dish-detail-sheet/`).** Mở khi tap row (NOT [+]):
- Header: "[← Quay lại] {dish name} [✕]"
- ServingsStepper (Story 3.4) value=1.0 default, step 0.1, range 0.1-20
- Direct numeric input `.input-wrapper`
- Nutrition preview realtime: "Dinh dưỡng cho {value} khẩu phần ({servingSize}g): Calo: X · Protein: Yg · Carbs: Zg · Fat: Wg" — compute từ `dish_with_totals × servings`
- CTA "[Thêm vào {Bữa X}]" → call `CalendarStore.addDish(slotId, dishId, servings)` (Story 3.3) → close sub-modal → close M1 → toast "Đã thêm '{name}' vào {Bữa X}" [Xem trong Lịch ăn]
- Cancel: tap [✕] hoặc back arrow → return M1 search results

**AC-8 (suggestion chips query).**
```sql
SELECT d.id, d.name, COUNT(*) as cnt
FROM planned_dish pd
JOIN dish d ON d.id = pd.dish_id
JOIN meal_slot ms ON pd.meal_slot_id = ms.id
JOIN day_plan dp ON ms.day_plan_id = dp.id
WHERE dp.date >= date('now', '-30 days')
GROUP BY d.id ORDER BY cnt DESC LIMIT 8
```

**AC-9 (sao chép từ ngày khác flow).**
1. Tap quick action → date picker (default = hôm qua)
2. Show preview: list dishes của ngày đó, filter by mealType (nếu match) hoặc all (toggle)
3. Multi-select checkbox → button "[Sao chép {n} món]"
4. Confirm → batch insert qua `repo.copyToDate(ids, currentDate, mealType)` → close modal → toast "Đã sao chép {n} món" [Xem]

**AC-10 (no-overlap với Add via long-press copy).** Story 3.7 đã có "Sao chép sang ngày khác" cho 1 dish (long-press context). Story 4.5 quick action LÀ ngược lại (sao chép TỪ ngày khác VÀO current). Verify wording không confusing.

**AC-11 (manual QA).**
- F-03 tap [+] Bữa trưa → M1 mở
- Search "phở" → 200ms debounce → result hiện
- Tap row Phở bò → sub-modal → stepper 1.5 → preview update → tap [Thêm vào Bữa trưa] → modal close → Day View Bữa trưa có Phở bò 1.5 phần
- Tab "Gần đây" → 30 dish gần nhất hiện
- Tab "Đã lưu" → empty state đầu (chưa favorite món nào)
- F-02 toggle ⭐ Phở bò → quay M1 tab "Đã lưu" → Phở bò xuất hiện

**Pitfalls:**
- **Disaster B — capacitor.config.ts:** Nếu modal dùng status bar style, verify config không reference asset thiếu.
- Search SQL injection: dùng `?` placeholder (existing repo pattern), KHÔNG string concat user input.
- Drag-down gesture conflict với scroll: Modal scroll inside body; drag handle là phần trên cùng modal có gesture handler.

**Estimate:** 2.5 ngày

---

### Story 4.6: M2 Edit Dish Modal — 2 variant planned/logged + RecipeChangedBanner + Hybrid microcopy

**As a** user,
**I want** modal sửa servings hoặc xoá món với rõ ràng đây là planned hay logged, kèm cảnh báo nếu recipe đã đổi sau khi snapshot,
**So that** không hoang mang vì số liệu khác recipe hiện tại.

**Acceptance Criteria:**

**AC-1 (EditDishModal — `features/calendar/components/edit-dish-modal/`).** Modal full-bleed bottom sheet ~70% screen, drag handle. Context input: `{plannedDishId}`. Load qua `repo` get full record + dish_with_totals current.

**AC-2 (header).** "Sửa món · {Bữa X} · {Thứ}, {dd/mm}" + StatusPill (Story 3.4) status=`is_completed ? 'logged' : 'planned'` + completedAt + [✕] right.

**AC-3 (Variant Planned: `is_completed=0`).**
- Block 1: dish info (name + thumbnail nếu có)
- Block 2: ServingsStepper với `[value]=current_servings`, output realtime preview "Sẽ thành: Calo X · Protein Yg" (từ `dish_with_totals × newServings`)
- Block 3 actions:
  - [💾 Lưu thay đổi] primary → `CalendarStore.editServings(id, newServings)` → toast "Đã cập nhật" → close
  - [🗑 Xoá khỏi {Bữa X}] danger outline → confirm → `CalendarStore.deleteDish(id)` → close → undo toast (Story 3.7 mechanism)
  - [📋 Sao chép sang ngày khác] secondary → mở date picker (reuse Story 3.7 flow)
  - [↔️ Di chuyển sang bữa khác] secondary → meal-slot picker (4 option)
- KHÔNG hiển thị RecipeChangedBanner cho variant planned (snapshot không apply).

**AC-4 (Variant Logged: `is_completed=1`).**
- Block 1: dish info + StatusPill 🔒 "Đã ăn lúc HH:mm dd/mm/yy"
- Block 2 (NEW snapshot block): "Số liệu đã ăn (cố định):" BOLD nutrition values từ snapshot cols (`pd.calories`, `pd.protein`, `pd.carbs`, `pd.fat`)
- Block 3 (RecipeChangedBanner conditional): Compute `diff_pct = abs(snapshot.calories - current_calories_for_servings) / snapshot.calories × 100`. Nếu `diff_pct > 2`:
  - Render `<app-recipe-changed-banner [snapshotCalories]="snapshot.calories" [currentCalories]="current.calories * servings" [diffPct]="diff_pct" (faqLinkClicked)="openFAQ()">`
- Block 4: ServingsStepper — output realtime preview "Snapshot mới sẽ là: Calo {snapshot_per_serving × new_servings} ..."
  - Note: `snapshot_per_serving = pd.calories / pd.servings` (preserve OLD recipe ratio per SNAP-04 `editServings` for logged)
  - **CHỜ:** Đây là decision spec đã chọn cho Story 3.2 AC-2: `editServings` cho logged = "recompute snapshot từ recipe HIỆN TẠI × newServings". Story 4.6 phải align — DON'T diverge. Microcopy update để rõ:
  - Preview text khi Logged + edit servings: "Snapshot sẽ recompute theo recipe hiện tại × {new_servings} khẩu phần: Calo X · ..."
  - Bổ sung notice nhỏ: "ℹ️ Snapshot sẽ cập nhật theo recipe hiện tại (vì đang sửa số khẩu phần)."
- Block 5 actions:
  - [💾 Lưu thay đổi] → `CalendarStore.editServings(id, newServings)` (recompute snapshot per SNAP-04)
  - [🗑 Xoá khỏi nhật ký] danger
  - [⏪ Bỏ đánh dấu Đã ăn] secondary → confirm modal "Bỏ đánh dấu sẽ xoá snapshot và quay về realtime" → `CalendarStore.unmarkEaten(id)` (SNAP-05)
  - KHÔNG hiển thị copy/move (chỉ planned mới move/copy được — F-04 §7 design choice).

**AC-5 (RecipeChangedBanner threshold).** `diff_pct > 2` (NOT >= 0). Tránh floating-point noise, ví dụ 1500.0 vs 1500.001. Spec test với 3 case: diff=0%, diff=1%, diff=5%.

**AC-6 (FAQ link).** Tap "ℹ️ Tại sao?" → mở bottom sheet inline (KHÔNG navigate) với content theo F-04 §10.1:
> "Khi anh đánh dấu món 'Đã ăn', số liệu được khoá lại theo recipe lúc đó. Sau này nếu anh sửa recipe (vd thêm dầu, đổi nguyên liệu), món đã ăn KHÔNG đổi — vì anh đã ăn rồi không sửa được. Số liệu hiển thị ở đây là 'lúc anh ăn'. Nếu cần chỉnh, hãy bỏ đánh dấu rồi đánh dấu lại."
- Có 2 button: "[Đã hiểu]" (close) + "[Bỏ đánh dấu món này]" (call unmarkEaten).

**AC-7 (open trigger từ F-03).** F-03 Day View MealSlotCard (Story 3.5):
- Tap dish row body (NOT [Đã ăn] button) → emit `openEditModal({plannedDishId})` → calendar.page mở M2
- HOẶC long-press menu "Sửa" (Story 3.7 context menu) → cùng emit

Story 4.6 chỉ wire modal handler ở `calendar.page.ts`, MealSlotCard emit đã có Story 3.5/3.7.

**AC-8 (microcopy F-04 §10.2 entries cho M2).** 7 microcopy:
- Title planned: "Sửa món kế hoạch"
- Title logged: "Sửa món đã ăn"
- Snapshot block label: "Số liệu đã ăn (cố định):"
- Edit servings note logged: "ℹ️ Snapshot sẽ cập nhật theo recipe hiện tại."
- Unmark confirm: "Bỏ đánh dấu sẽ xoá snapshot và quay về realtime theo recipe."
- Delete planned confirm: "Xoá '{name}' khỏi {Bữa X}?"
- Delete logged confirm: "Xoá '{name}' khỏi nhật ký? Snapshot sẽ mất và không thể khôi phục sau 8 giây."

**AC-9 (manual QA — 6 case).**
1. Add planned dish Phở bò 1 phần → tap row → M2 variant Planned → stepper → 2 phần → Lưu → Day View calo update
2. Mark eaten → tap row → M2 variant Logged → snapshot block hiện đúng số ăn lúc 1 phần
3. F-02 sửa Phở bò ingredients +50% calo → quay Calendar → tap logged dish → M2 → RecipeChangedBanner ⚠️ hiện diff
4. M2 Logged → "Bỏ đánh dấu" → confirm → DB: `is_completed=0`, snapshot cols NULL → reload Day View dish faded planned
5. M2 Planned → "Xoá" → close → undo toast 8s → tap [Hoàn tác] → restored
6. M2 Logged → tap "ℹ️ Tại sao?" → FAQ sheet → tap [Bỏ đánh dấu] → flow case 4

**Pitfalls:**
- **Disaster A — `@capacitor/share`:** KHÔNG dùng share API trong M2. Defer Phase 5+.
- Recompute snapshot per SNAP-04 trong `editServings(logged)` — verify Story 3.2 implement correctly.
- Banner trigger với `diff_pct == NaN` (vd snapshot.calories = 0): early return, KHÔNG render banner.

**Estimate:** 2 ngày

---

## Phase 3 Exit Checklist (Epic 4 contribution)

- [ ] NutritionStore + NutritionQueryService + KeyMetricRouter ship + spec coverage (Story 4.0)
- [ ] 3 shared component (MacroRow + RecipeChangedBanner + TrendBarChart) ship + CI guards pass (Story 4.1)
- [ ] S1 Dashboard 4 variant render đúng level/goal (Story 4.2)
- [ ] S2 DaySummary content fill + S3 DayRow color logic 4 case (Story 4.3)
- [ ] S4 Trend View 4 metric tab + Tuần/Tháng + So sánh tuần trước (Story 4.4)
- [ ] M1 Logging Modal Search + Recent + Favorites + Sao chép từ ngày khác (Story 4.5)
- [ ] M2 Edit Modal Planned/Logged variant + RecipeChangedBanner + FAQ + 7 microcopy (Story 4.6)
- [ ] Cross-feature Hybrid integrity test pass: F-02 edit recipe → planned realtime update, logged snapshot unchanged
- [ ] APK build + install emulator-5554 + 6 manual QA case Story 4.6 + 7 user journey end-to-end pass

## Out-of-Scope (defer Phase 4 hoặc Phase 5+)

1. Performance variant Smart Key Metric (PRD F-04.2 advanced level=performance) — fallback Tăng cơ Phase 3, dual-equal layout Phase 4
2. Aggregate snapshot table cho trend > 90 days (R-A4) — Phase 4 sau perf measurement
3. Gamification streak counter — anti-pattern, defer indefinitely
4. Photo logging tab M1 (📷) — Phase 5+ F-05
5. AI gợi ý tab M1 (🤖) — Phase 5+ F-06
6. Share snapshot externally — Phase 5+
7. Aggregated month view (S4 period > "Tháng" 30 ngày) — Phase 4
8. Per-meal nutrition target (Bữa sáng có target riêng) — Phase 4+
9. Time-of-day distribution analytics (sáng vs tối calo %) — Phase 4+
10. Custom favorites tagging (chia đa nhóm) — Phase 5+

## Dependencies

- **Epic 3** ✅ DONE prerequisite — đặc biệt Story 3.1/3.2/3.3 (data layer) + 3.4 (4 shared component CalorieRing/ServingsStepper/StatusPill/ConfirmEatModal/bandColor)
- **Internal Epic 4:** 4.0 (foundation) → 4.1 (shared) parallel; 4.2/4.3 cần 4.0+4.1; 4.4 cần 4.0+4.1; 4.5 cần 3.2+3.3+3.4 (KHÔNG cần 4.0); 4.6 cần 3.2+3.3+3.4+4.1 (RecipeChangedBanner)

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Hybrid mental model confuse user | High | M2 microcopy 7 entries + FAQ inline + status pill prominent (Story 4.6 AC-6 + AC-8) |
| Trend 365-day query slow Android low-tier (R-A4) | Medium | 90-day cap UI; cache TTL 5 phút (DEC-05); aggregate snapshot defer Phase 4 |
| Smart Key Metric router 5 variant × 4 goal = 20 combo edge case | Medium | Pure function spec coverage 20 case (Story 4.0 AC-5) |
| Performance variant fallback gây user Tăng cơ thấy "thiếu" | Low | Defer notice trong Settings: "Performance variant sẽ ra mắt Phase 4" |
| RecipeChangedBanner false positive floating-point | Low | Threshold > 2% explicit + spec test (Story 4.6 AC-5) |

---

_Cập nhật: 2026-05-10 — Bob (PM, BMAD) drafted via D9 pipeline._
