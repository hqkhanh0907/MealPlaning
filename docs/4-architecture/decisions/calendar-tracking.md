# Architecture Decisions — Calendar (F-03) + Nutrition Tracking (F-04)

**Persona:** Winston 🏗️ (Architect, BMAD)
**D-step:** D8 (architecture)
**Inputs consumed:**
- `docs/3-design/ux-specs/f-03-calendar-plan.md` (D2 Sally, ~29KB)
- `docs/3-design/ux-specs/f-04-nutrition-tracking.md` (D5 Sally, ~62KB)
- `_bmad-output/planning-artifacts/research/domain-meal-planning-tracking-ux-research-2026-05-09.md` (D0a Mary)
- `docs/4-architecture/business-rules.md` (RULE-PLANNED-DISH-HYBRID, RT-01..02, SNAP-01..05)
- `docs/4-architecture/architecture.md` rev 1.1 (gram-only)
- `docs/3-design/data-model.md` §4.5–4.6 (meal_slot, planned_dish)
- `src/app/core/services/database/schema.ts` (current schema)
- `src/app/core/repositories/dish.repository.ts` + `core/stores/dish.store.ts` (pattern reference)

**Output:** Architecture decisions cho dev (D11 James) thực thi, gồm: schema fix, repository design, signal store layout, query patterns, caching, component contracts, file structure.

**Status:** Active — supersedes any pre-D8 assumption trong F-03/F-04 spec về `NutritionTrackingService` / `DishSearchService` / pipe-vs-SQL.

---

## 1. Tổng quan kiến trúc cho Calendar + Tracking

```
┌─────────────────────────────────────────────────────────────────┐
│  features/dashboard         features/calendar                    │
│  ┌─────────────────┐        ┌───────────────────────────────┐   │
│  │ DashboardPage   │        │ CalendarPage (Day/Week toggle)│   │
│  │ + NutriCard S1  │        │ + DaySummaryCard S2 (trên top)│   │
│  │ + TrendView S4  │        │ + MealSlotCard ×4             │   │
│  └────────┬────────┘        │ + LoggingModal M1             │   │
│           │                 │ + EditDishModal M2            │   │
│           │                 │ + WeekView (DayRow ×7) S3     │   │
│           │                 └────────────┬──────────────────┘   │
│           ▼                              ▼                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           Signal Stores (core/stores/)                   │    │
│  │  CalendarStore           NutritionStore                  │    │
│  │  - currentDate           - today (calories/P/C/F + tgt)  │    │
│  │  - dayPlan(date)         - week(monday)                  │    │
│  │  - mutations + reload    - trend(period)                 │    │
│  │  - emits invalidation    - subscribes to CalendarStore   │    │
│  └────────────────────┬────────────────────────────────────┘    │
│                       ▼                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │         Repository Layer (core/repositories/)            │    │
│  │  DayPlanRepository    PlannedDishRepository              │    │
│  │  - upsertForDate      - addDish (insert is_completed=0)  │    │
│  │  - listByDateRange    - markCompleted (RT-02→SNAP-01)    │    │
│  │  - listMealSlots      - unmarkCompleted (SNAP-05)        │    │
│  │                       - editServings (cond. recompute)   │    │
│  │                       - delete (hard)                    │    │
│  │                       - listByDate / listRecent          │    │
│  │  NutritionQueryService (read-only aggregates)            │    │
│  │  - dailyTotals(date)  - weekTotals(monday)               │    │
│  │  - trend(period)      - effective(plannedDishId)         │    │
│  └────────────────────┬────────────────────────────────────┘    │
│                       ▼                                          │
│            Database (sql.js / @capacitor-community/sqlite)       │
│            VIEW dish_with_totals (existing) ← single SoT         │
└─────────────────────────────────────────────────────────────────┘
```

**Key principles:**
- **Repository pattern strict** (D-TECH-1 từ Mary research, confirm YES). Không inject `Database` trực tiếp vào component/page/store; mọi truy vấn đi qua repo.
- **Effective nutrition computed in SQL** (không phải Angular pipe). Lý do trong §3.
- **`dish_with_totals` là single source of truth cho dish macros realtime**. Không cache nutrition trên `dish` table.
- **`planned_dish` snapshot columns = single source of truth cho logged macros**. Không re-derive snapshot từ recipe khi đã `is_completed=1`.

---

## 2. Decision DEC-01 — Schema fix (Hybrid policy enforcement)

**Context:** Schema hiện tại (`src/app/core/services/database/schema.ts:187-190`):
```sql
calories  REAL NOT NULL,
protein   REAL NOT NULL DEFAULT 0,
carbs     REAL NOT NULL DEFAULT 0,
fat       REAL NOT NULL DEFAULT 0,
```

UX spec F-04 §13 acceptance criterion + business-rules RULE-PLANNED-DISH-HYBRID + data-model §4.6 đều yêu cầu:
- `is_completed = 0` → 4 cột nutrition phải `NULL` (no snapshot tồn tại)
- `is_completed = 1` → 4 cột nutrition phải `NOT NULL` (snapshot frozen)

Schema hiện không enforce constraint này, và `NOT NULL` ngăn không cho insert dish kế hoạch (`is_completed=0`).

### Quyết định

Fix schema theo **pre-release collapse rule** (đang ở v1 init, chưa ship Play Store → không bump `SCHEMA_VERSION`, sửa trực tiếp `buildInitialSchemaMigration()`):

```sql
CREATE TABLE IF NOT EXISTS planned_dish (
  id              TEXT PRIMARY KEY,
  meal_slot_id    TEXT NOT NULL REFERENCES meal_slot(id) ON DELETE CASCADE,
  dish_id         TEXT NOT NULL REFERENCES dish(id)      ON DELETE RESTRICT,
  servings        REAL NOT NULL DEFAULT 1 CHECK (servings > 0),
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_completed    INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0, 1)),
  completed_at    TEXT,
  -- Snapshot columns: NULL khi chưa log, NOT NULL khi đã log
  calories        REAL,
  protein         REAL,
  carbs           REAL,
  fat             REAL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  -- Hybrid policy enforcement (RULE-PLANNED-DISH-HYBRID + SNAP-01..05)
  CHECK (
    (is_completed = 0
       AND calories IS NULL AND protein IS NULL AND carbs IS NULL AND fat IS NULL
       AND completed_at IS NULL)
    OR
    (is_completed = 1
       AND calories IS NOT NULL AND protein IS NOT NULL
       AND carbs IS NOT NULL AND fat IS NOT NULL
       AND completed_at IS NOT NULL)
  )
);

-- Indexes (existing + new)
CREATE INDEX IF NOT EXISTS idx_planned_dish_slot
  ON planned_dish(meal_slot_id);

-- New: tăng tốc S3 Week + S4 Trend (filter is_completed=1 + range scan dp.date)
CREATE INDEX IF NOT EXISTS idx_planned_dish_completed
  ON planned_dish(is_completed, meal_slot_id)
  WHERE is_completed = 1;

-- New: tăng tốc M1 Tab "Gần đây" (ORDER BY completed_at DESC LIMIT 30)
CREATE INDEX IF NOT EXISTS idx_planned_dish_completed_at
  ON planned_dish(completed_at DESC)
  WHERE is_completed = 1;
```

**Lý do partial index `WHERE is_completed = 1`:**
- Most queries chỉ quan tâm logged dishes (S3 Week color, S4 Trend, M1 Recent).
- Partial index giảm size đáng kể (tỷ lệ logged/planned thường ~20-50%).
- SQLite hỗ trợ partial index từ v3.8.0; Capacitor SQLite + sql.js đều OK.

**`servings > 0` CHECK:** không phải mới (đã align với data-model §4.6) — chốt thêm vào schema để tránh negative servings từ bug client-side.

### Migration impact

Pre-release → sửa trong `buildInitialSchemaMigration()`. KHÔNG tạo migration v2. Người dev nuốt schema mới qua dev DB reset. Test:
- `schema.spec.ts` — assert CHECK constraint với 4 trường hợp (0+null OK, 0+notnull FAIL, 1+null FAIL, 1+notnull OK).
- `migrations.spec.ts` — vẫn 1 migration version 1.

---

## 3. Decision DEC-02 — Effective nutrition: SQL CASE (KHÔNG dùng Angular pipe)

**Context:** F-04 §16 Sally đề xuất "ưu tiên SQL"; F-04 §12 mặt khác list `app-effective-nutrition-pipe` như component cần tạo. Hai cách mâu thuẫn.

### Quyết định

**Effective nutrition tính trong SQL CASE expression**, repo trả `effective_*` columns sẵn cho store/component. Pipe **không cần tạo**.

```sql
SELECT
  pd.id,
  pd.is_completed,
  pd.servings,
  CASE WHEN pd.is_completed = 1 THEN pd.calories
       ELSE dwt.total_calories * pd.servings END  AS effective_calories,
  CASE WHEN pd.is_completed = 1 THEN pd.protein
       ELSE dwt.total_protein  * pd.servings END  AS effective_protein,
  CASE WHEN pd.is_completed = 1 THEN pd.carbs
       ELSE dwt.total_carbs    * pd.servings END  AS effective_carbs,
  CASE WHEN pd.is_completed = 1 THEN pd.fat
       ELSE dwt.total_fat      * pd.servings END  AS effective_fat,
  -- Recipe-changed banner detection (M2)
  CASE WHEN pd.is_completed = 1 AND pd.calories > 0
       THEN ABS(pd.calories - dwt.total_calories * pd.servings)
            / pd.calories * 100.0
       ELSE 0
  END AS recipe_diff_pct
FROM planned_dish pd
JOIN dish_with_totals dwt ON pd.dish_id = dwt.id
WHERE pd.id = ?;
```

### Lý do

| Tiêu chí | SQL CASE | Angular pipe |
|---|---|---|
| Single source of truth | ✅ | ❌ (logic ở 2 chỗ: pipe + bất kỳ aggregate query nào) |
| Aggregate (S1/S3/S4 SUM/AVG) | ✅ trực tiếp `SUM(CASE WHEN…)` | ❌ phải fetch raw rồi map JS |
| Type safety | ✅ trả `number` qua repo interface | ⚠️ pipe trả `string \| number` |
| Test | ✅ test repo 1 lần | ❌ test pipe + test repo + integration |
| Performance | ✅ 1 query trả full row | ⚠️ N+1 nếu pipe gọi getter |

**Trade-off:** template phải dùng tên `effective_calories` thay vì `dish.calories \| effectiveNutrition` — không vấn đề, naming rõ hơn.

**Side effect:** xoá hàng `app-effective-nutrition-pipe` khỏi F-04 §12 component inventory. Update spec sau khi D8 sign-off.

---

## 4. Decision DEC-03 — Repository design (2 new repos + 1 query service)

**Context:** F-03 §8 + F-04 §12 đề xuất `CalendarRepository`, `PlannedDishRepository`, `NutritionTrackingService`, `DishSearchService`, `TrendComputeService`. Cần consolidate.

### Quyết định

**Tạo 3 module mới** trong `core/repositories/`:

#### 4.1. `DayPlanRepository`

File: `src/app/core/repositories/day-plan.repository.ts` (+ `.spec.ts`)

```typescript
@Injectable({ providedIn: 'root' })
export class DayPlanRepository {
  private readonly db = inject(Database);

  /** Lấy hoặc tạo day_plan + 4 meal_slot mặc định (breakfast/lunch/dinner/snack) cho 1 ngày. */
  async getOrCreateForDate(date: string, target: NutritionTarget): Promise<DayPlan> {…}

  /** S3 Week View: lấy 7 day_plan + meal_slots cho range [monday, monday+6]. */
  async listByDateRange(startDate: string, endDate: string): Promise<DayPlanRow[]> {…}

  /** Re-fetch sau khi mutation (planned_dish insert/update/delete). */
  async getByDate(date: string): Promise<DayPlan | null> {…}
}

interface NutritionTarget {
  target_calories: number;
  target_protein: number;
}
```

- **Lazy create:** `getOrCreateForDate` chỉ insert `day_plan` + 4 `meal_slot` row khi user thực sự mở ngày đó. Tránh bloat DB với 365 row trống.
- `target_calories/protein` lấy từ `user_profile` tại thời điểm tạo (snapshot — RT-02 áp dụng cho day_plan target rule).
- KHÔNG expose `meal_slot.total_*` (4 cột này TRÙNG LẶP với SQL aggregate, sẽ deprecate ở DEC-07).

#### 4.2. `PlannedDishRepository`

File: `src/app/core/repositories/planned-dish.repository.ts` (+ `.spec.ts`)

```typescript
@Injectable({ providedIn: 'root' })
export class PlannedDishRepository {
  private readonly db = inject(Database);

  /** Insert: is_completed=0, snapshot 4 cột = NULL (CHECK constraint enforce). */
  async addDish(slotId: string, dishId: string, servings: number): Promise<PlannedDishRow> {…}

  /** RT-02 → SNAP-01: flip 0→1, snapshot recipe HIỆN TẠI × servings, completed_at=now. */
  async markCompleted(plannedDishId: string): Promise<void> {…}

  /** SNAP-05: flip 1→0, clear 4 cột nutrition + completed_at. */
  async unmarkCompleted(plannedDishId: string): Promise<void> {…}

  /**
   * Edit servings — conditional:
   * - is_completed=0 → chỉ update servings (nutrition realtime qua dish_with_totals)
   * - is_completed=1 → SNAP-04: update servings + recompute snapshot từ recipe HIỆN TẠI × newServings
   */
  async editServings(plannedDishId: string, newServings: number): Promise<void> {…}

  /** Hard delete (no soft-delete trong v1). Undo handled UI-side via toast 8s buffer. */
  async delete(plannedDishId: string): Promise<void> {…}

  /** Detail page / M2 Edit Modal load. Trả effective + diff_pct sẵn (DEC-02 SQL CASE). */
  async getById(plannedDishId: string): Promise<PlannedDishDetail | null> {…}

  /** Day View: list theo meal_slot_id, ORDER BY sort_order ASC. */
  async listByMealSlot(slotId: string): Promise<PlannedDishRow[]> {…}

  /** M1 Tab "Gần đây": top 30 logged distinct-by-dish, ORDER BY completed_at DESC. */
  async listRecentLogged(limit: number): Promise<RecentDishRow[]> {…}
}

interface PlannedDishRow {
  id: string;
  dish_id: string;
  dish_name: string;
  servings: number;
  is_completed: 0 | 1;
  completed_at: string | null;
  effective_calories: number;
  effective_protein: number;
  effective_carbs: number;
  effective_fat: number;
}

interface PlannedDishDetail extends PlannedDishRow {
  recipe_diff_pct: number;        // M2 banner trigger (>2%)
  snapshot_calories: number | null; // pd.calories (NULL nếu planned)
  current_calories: number;        // dwt.total_calories × servings
  // (cùng pattern cho 3 macro còn lại)
}
```

**Atomic mutations:** mọi mutation chạy trong `db.withTransaction(...)`. Pattern reference: `dish.repository.ts` lines 93-99.

```typescript
async markCompleted(plannedDishId: string) {
  await this.db.withTransaction(async () => {
    // 1. Read current snapshot từ dish_with_totals × servings
    const snap = await this.db.getOne(`
      SELECT
        dwt.total_calories * pd.servings AS calories,
        dwt.total_protein  * pd.servings AS protein,
        dwt.total_carbs    * pd.servings AS carbs,
        dwt.total_fat      * pd.servings AS fat
      FROM planned_dish pd
      JOIN dish_with_totals dwt ON pd.dish_id = dwt.id
      WHERE pd.id = ?
    `, [plannedDishId]);
    if (!snap) throw new PlannedDishNotFoundError(plannedDishId);

    // 2. Update với CHECK constraint guard
    await this.db.execute(`
      UPDATE planned_dish
      SET is_completed = 1,
          completed_at = datetime('now'),
          calories = ?, protein = ?, carbs = ?, fat = ?
      WHERE id = ? AND is_completed = 0
    `, [snap.calories, snap.protein, snap.carbs, snap.fat, plannedDishId]);
  });
}
```

#### 4.3. `NutritionQueryService` (read-only)

File: `src/app/core/services/nutrition/nutrition-query.service.ts` (+ `.spec.ts`)

KHÔNG đặt `core/repositories/` vì đây là **service-layer aggregate query** (đa-bảng JOIN, không CRUD entity). Convention align với `core/services/profile/recalc-targets.ts`.

```typescript
@Injectable({ providedIn: 'root' })
export class NutritionQueryService {
  private readonly db = inject(Database);

  /** S1 Dashboard + S2 Day Summary header. */
  async dailyTotals(date: string): Promise<DailyTotals> {…}

  /** S3 Week color row — 7 ngày, chỉ logged. */
  async weekTotals(mondayDate: string): Promise<WeekDayTotal[]> {…}

  /** S4 Trend View — period = 'week-current' | 'week-prev' | 'month-30d'. */
  async trend(period: TrendPeriod, anchor: string): Promise<TrendResult> {…}
}

interface DailyTotals {
  date: string;
  target_calories: number;
  target_protein: number;
  effective_calories: number;  // SUM(CASE WHEN…) — gộp planned + logged
  effective_protein: number;
  effective_carbs: number;
  effective_fat: number;
  logged_calories: number;      // chỉ is_completed=1
  planned_calories: number;     // chỉ is_completed=0
  pct_calories: number;         // effective / target × 100
}

interface WeekDayTotal {
  date: string;
  logged_calories: number;
  pct_calories: number;
  has_planned: boolean;
}

type TrendPeriod = 'week' | 'month';

interface TrendResult {
  metric: 'calories' | 'protein' | 'carbs' | 'fat';
  bars: Array<{ label: string; value: number; target: number; }>;
  avg_daily: number;
  min_daily: number;
  max_daily: number;
  days_with_data: number;
}
```

### Lý do KHÔNG tách `DishSearchService` / `TrendComputeService`

- **DishSearchService:** `DishRepository.searchByName()` ĐÃ tồn tại (line 44-49) và đủ cho M1 Tab Tìm kiếm. Không tạo wrapper.
- **TrendComputeService:** logic aggregate là pure SQL — không cần class riêng, gộp vào `NutritionQueryService.trend()`.

---

## 5. Decision DEC-04 — Signal store layout (2 stores, không gộp)

**Context:** F-04 §16 Sally hỏi caching strategy: signal store vs computed-each-time. Câu trả lời: **signal store** cho UI surface, **computed-each-time** cho aggregate queries.

### Quyết định

Tạo **2 store mới** trong `core/stores/`:

#### 5.1. `CalendarStore`

File: `src/app/core/stores/calendar.store.ts` (+ `.spec.ts`)

```typescript
@Injectable({ providedIn: 'root' })
export class CalendarStore {
  private readonly dayPlanRepo = inject(DayPlanRepository);
  private readonly plannedDishRepo = inject(PlannedDishRepository);
  private readonly profileStore = inject(ProfileStore);

  // Day View state
  readonly currentDate = signal<string>(toISODate(new Date()));
  readonly dayPlan = signal<DayPlanWithSlots | null>(null);
  readonly dayLoading = signal(false);

  // Week View state
  readonly weekAnchor = signal<string>(getMonday(new Date()));
  readonly weekRows = signal<WeekDayTotal[]>([]);
  readonly weekLoading = signal(false);

  // View toggle
  readonly viewMode = signal<'day' | 'week'>('day');

  /** Mutation event bus — NutritionStore subscribes để invalidate cache. */
  readonly invalidationTick = signal(0);
  private bumpInvalidation() { this.invalidationTick.update(n => n + 1); }

  async loadDay(date: string): Promise<void> {…}
  async loadWeek(monday: string): Promise<void> {…}

  // Mutations — đều bumpInvalidation() sau khi tx commit
  async addDish(slotId: string, dishId: string, servings: number): Promise<void> {…}
  async markCompleted(plannedDishId: string): Promise<void> {…}
  async unmarkCompleted(plannedDishId: string): Promise<void> {…}
  async editServings(plannedDishId: string, newServings: number): Promise<void> {…}
  async deleteDish(plannedDishId: string): Promise<void> {…}
  async copyFromDate(fromDate: string, toDate: string, slots: MealType[]): Promise<void> {…}
}
```

**Pattern align** với `dish.store.ts`:
- `signal()` cho mutable state, `computed()` cho derived (vd `currentDayCalories = computed(() => …)`).
- Mutation method: call repo (atomic tx) → update local signal optimistic → re-fetch nếu cần → bumpInvalidation.
- KHÔNG dùng RxJS Subject. Project standard = pure Signals (architecture.md §1).

#### 5.2. `NutritionStore`

File: `src/app/core/stores/nutrition.store.ts` (+ `.spec.ts`)

```typescript
@Injectable({ providedIn: 'root' })
export class NutritionStore {
  private readonly nutritionQuery = inject(NutritionQueryService);
  private readonly calendarStore = inject(CalendarStore);
  private readonly profileStore = inject(ProfileStore);

  // S1 Dashboard / S2 Day Summary state
  readonly today = signal<DailyTotals | null>(null);
  readonly todayLoading = signal(false);

  // S4 Trend state
  readonly trendPeriod = signal<TrendPeriod>('week');
  readonly trendMetric = signal<'calories' | 'protein' | 'carbs' | 'fat'>('calories');
  readonly trend = signal<TrendResult | null>(null);
  readonly trendLoading = signal(false);

  // Smart Key Metric routing — pure derived
  readonly keyMetric = computed<KeyMetricVariant>(() => {
    const profile = this.profileStore.profile();
    return routeKeyMetric(profile?.level ?? 'beginner', profile?.goal ?? 'maintain');
  });

  constructor() {
    // Auto-invalidate today when CalendarStore mutates
    effect(() => {
      this.calendarStore.invalidationTick();
      const date = this.calendarStore.currentDate();
      this.refreshToday(date);
    }, { allowSignalWrites: true });
  }

  async refreshToday(date: string): Promise<void> {…}
  async loadTrend(period: TrendPeriod, metric: KeyMetric, anchor: string): Promise<void> {…}
}
```

**Cross-store dependency rule:** `NutritionStore` depends on `CalendarStore` (one direction). KHÔNG circular. CalendarStore mutation → bumps invalidationTick → NutritionStore effect refetch.

### Lý do KHÔNG gộp 2 store

- **Single Responsibility:** CalendarStore quản lý structural state (date, plan, slots, dishes). NutritionStore quản lý analytics state (totals, trends, key metric).
- **Re-render isolation:** Component S1 chỉ subscribe NutritionStore — không re-render khi user toggle Day/Week trong CalendarStore.
- **Test isolation:** mock NutritionQueryService chỉ ảnh hưởng NutritionStore tests.

---

## 6. Decision DEC-05 — Caching strategy

### Quyết định

| Surface | Strategy | Lý do |
|---|---|---|
| S1 Dashboard | Effect-driven (NutritionStore.today auto-refresh on invalidation) | User mong đợi update ngay sau khi log meal; cost = 1 SQL query/mutation |
| S2 Day Summary | Same signal `today` từ NutritionStore — share state với S1 | Avoid double fetch; same date = same data |
| S3 Week View | Re-query khi `weekAnchor` đổi HOẶC invalidationTick bump trong tuần đang xem | Logic trong CalendarStore.loadWeek + effect check |
| S4 Trend View | Cache theo `(period, metric, anchor)` key trong NutritionStore — TTL 5 phút HOẶC cho tới invalidation | User switch metric tab thường xuyên; re-query mỗi tab tốn DB |
| M1 Tab "Gần đây" | Re-query mỗi lần mở M1 (không cache) | Recent list nhỏ (30 row), query nhanh; user expect fresh |
| M1 Tab "Tìm kiếm" | Debounce 200ms (Sally spec §6); KHÔNG cache | Standard pattern |
| dish_with_totals | DB-side VIEW (auto recompute mỗi query) | Đã có sẵn, không cần app-layer cache |

**TTL implementation cho S4 Trend:**
```typescript
private trendCache = new Map<string, { result: TrendResult; ts: number }>();
private readonly TTL_MS = 5 * 60 * 1000;

async loadTrend(period, metric, anchor) {
  const key = `${period}:${metric}:${anchor}`;
  const cached = this.trendCache.get(key);
  if (cached && Date.now() - cached.ts < this.TTL_MS) {
    this.trend.set(cached.result);
    return;
  }
  const fresh = await this.nutritionQuery.trend(period, metric, anchor);
  this.trendCache.set(key, { result: fresh, ts: Date.now() });
  this.trend.set(fresh);
}

// On invalidation: clear all
effect(() => {
  this.calendarStore.invalidationTick();
  this.trendCache.clear();
});
```

---

## 7. Decision DEC-06 — Query patterns + index validation

### 7.1. Daily totals query (S1 + S2)

```sql
SELECT
  dp.date,
  dp.target_calories,
  dp.target_protein,
  COALESCE(SUM(CASE WHEN pd.is_completed = 1 THEN pd.calories
                    ELSE dwt.total_calories * pd.servings END), 0) AS effective_calories,
  COALESCE(SUM(CASE WHEN pd.is_completed = 1 THEN pd.protein
                    ELSE dwt.total_protein  * pd.servings END), 0) AS effective_protein,
  COALESCE(SUM(CASE WHEN pd.is_completed = 1 THEN pd.carbs
                    ELSE dwt.total_carbs    * pd.servings END), 0) AS effective_carbs,
  COALESCE(SUM(CASE WHEN pd.is_completed = 1 THEN pd.fat
                    ELSE dwt.total_fat      * pd.servings END), 0) AS effective_fat,
  COALESCE(SUM(CASE WHEN pd.is_completed = 1 THEN pd.calories ELSE 0 END), 0) AS logged_calories,
  COALESCE(SUM(CASE WHEN pd.is_completed = 0 THEN dwt.total_calories * pd.servings ELSE 0 END), 0) AS planned_calories
FROM day_plan dp
LEFT JOIN meal_slot ms ON ms.day_plan_id = dp.id
LEFT JOIN planned_dish pd ON pd.meal_slot_id = ms.id
LEFT JOIN dish_with_totals dwt ON dwt.id = pd.dish_id
WHERE dp.date = ?
GROUP BY dp.id;
```

**Index plan:**
- `day_plan(date)` — existing `idx_day_plan_date` ✓ (UNIQUE)
- `meal_slot(day_plan_id)` — existing `idx_meal_slot_day` ✓
- `planned_dish(meal_slot_id)` — existing `idx_planned_dish_slot` ✓
- `dish_with_totals` — VIEW dùng GROUP BY trên `d.id` (PRIMARY KEY) ✓

**Estimated rows scanned cho 1 day:** 1 day_plan × 4 meal_slot × ~3 planned_dish/slot = ~12 row JOIN. Đệ quy cho dish_with_totals: 12 × ~5 ingredient/dish = 60 row. Tổng <100 row. Negligible cost trên SQLite.

### 7.2. Week totals query (S3)

```sql
SELECT
  dp.date,
  COALESCE(SUM(CASE WHEN pd.is_completed = 1 THEN pd.calories ELSE 0 END), 0) AS logged_calories,
  dp.target_calories,
  CASE WHEN dp.target_calories > 0
       THEN COALESCE(SUM(CASE WHEN pd.is_completed = 1 THEN pd.calories ELSE 0 END), 0)
            / dp.target_calories * 100.0
       ELSE 0
  END AS pct_calories,
  EXISTS(
    SELECT 1 FROM meal_slot ms2
    JOIN planned_dish pd2 ON pd2.meal_slot_id = ms2.id
    WHERE ms2.day_plan_id = dp.id AND pd2.is_completed = 0
  ) AS has_planned
FROM day_plan dp
LEFT JOIN meal_slot ms ON ms.day_plan_id = dp.id
LEFT JOIN planned_dish pd ON pd.meal_slot_id = ms.id AND pd.is_completed = 1
WHERE dp.date BETWEEN ? AND ?
GROUP BY dp.id, dp.date, dp.target_calories
ORDER BY dp.date ASC;
```

**Index plan:**
- `idx_day_plan_date` covers range scan `BETWEEN ?, ?`
- `idx_planned_dish_completed` (NEW partial) speeds up `is_completed = 1` filter trong JOIN

**Performance check:** 7 ngày × 4 slot × ~3 dish = 84 row, target <50ms trên Android mid-tier (Snapdragon 6-class).

### 7.3. Trend query (S4)

```sql
WITH daily_totals AS (
  SELECT
    dp.date,
    SUM(pd.calories) AS day_total
  FROM day_plan dp
  JOIN meal_slot ms ON ms.day_plan_id = dp.id
  JOIN planned_dish pd ON pd.meal_slot_id = ms.id AND pd.is_completed = 1
  WHERE dp.date BETWEEN ? AND ?
  GROUP BY dp.date
)
SELECT
  date,
  COALESCE(day_total, 0) AS day_total
FROM daily_totals
ORDER BY date ASC;

-- Aggregate cho header (avg/min/max):
SELECT
  AVG(day_total) AS avg_daily,
  MIN(day_total) AS min_daily,
  MAX(day_total) AS max_daily,
  COUNT(*)       AS days_with_data
FROM (...same CTE...);
```

**2 query thay vì 1:** dùng CTE thì SQLite không cache CTE giữa 2 SELECT — chấp nhận 2 query nhỏ thay vì window function (Capacitor SQLite v5+ support window function, nhưng giữ portability với sql.js).

**Estimated rows:** 30-day month × 4 slot × ~3 dish × filter logged ~50% = ~180 row. <100ms.

### 7.4. M1 Tab "Gần đây" query

```sql
SELECT
  pd.dish_id,
  d.name AS dish_name,
  d.image_url,
  pd.calories,    -- snapshot logged
  pd.servings,
  MAX(pd.completed_at) AS last_logged_at
FROM planned_dish pd
JOIN dish d ON d.id = pd.dish_id
WHERE pd.is_completed = 1
GROUP BY pd.dish_id  -- distinct by dish, latest log
ORDER BY last_logged_at DESC
LIMIT 30;
```

**Index plan:** `idx_planned_dish_completed_at` (NEW partial DESC) covers ORDER BY + LIMIT.

---

## 8. Decision DEC-07 — Deprecate `meal_slot.total_*` and `day_plan.total_*` columns

**Context:** Schema (line 155-158, 170-173) có 4 cột `total_calories/protein/carbs/fat` trên `day_plan` VÀ 4 cột tương tự trên `meal_slot`. Đây là cached aggregates.

### Quyết định

**Deprecate cả 8 cột này trong v1**, không dùng trong app code. Mọi aggregate đi qua `NutritionQueryService` (DEC-03).

**Lý do:**
1. **Stale cache risk:** mỗi mutation (add/edit/delete/markCompleted/unmark/editServings) phải UPDATE 8 cột này → bug magnet.
2. **Recipe edit invalidation:** F-02 sửa recipe → realtime nutrition đổi cho planned dishes → cần update `day_plan.total_*`/`meal_slot.total_*` của EVERY day_plan có planned_dish → cascade nightmare.
3. **Performance không cần:** query SUM trên ~12 row/day là negligible (DEC-06.1).
4. **dish_with_totals VIEW pattern** đã chứng minh approach "compute-on-read" hoạt động tốt cho dish — extend cho day_plan/meal_slot logic-wise.

**Migration:** vẫn để cột trong schema (pre-release nhưng không đáng risk schema reset chỉ để xoá cột không dùng). Code KHÔNG đọc/ghi 8 cột này. Comment trong `schema.ts`:

```typescript
// DEPRECATED v1 (DEC-07): aggregates computed via NutritionQueryService.
// Columns retained for now to avoid schema reset; will be dropped in v1.x cleanup.
total_calories REAL NOT NULL DEFAULT 0,
total_protein  REAL NOT NULL DEFAULT 0,
total_carbs    REAL NOT NULL DEFAULT 0,
total_fat      REAL NOT NULL DEFAULT 0,
```

**Lint guard (Phase 4):** add `check:deprecated-columns` CI script kiểm tra `INSERT INTO day_plan` / `UPDATE day_plan SET total_*` không tồn tại trong code base. Defer khi có capacity.

---

## 9. Decision DEC-08 — `dish.is_favorite` resolution (O-F04-5)

**Context:** F-04 §11 list O-F04-5 là "schema add Phase 3 hay Phase 4?". Sally giả định cần migration.

### Quyết định

**Schema ĐÃ có cột `dish.is_favorite INTEGER NOT NULL DEFAULT 0`** (`schema.ts:104`). Không cần migration.

**Phase 3 wire luôn UI:**
- M1 Tab "Đã lưu" thay vì empty placeholder → query `SELECT * FROM dish WHERE is_favorite = 1`.
- Add toggle ⭐ trong M1 Tab "Tìm kiếm" + DishDetail → flip `is_favorite`.
- Update F-04 spec §15 và §11 (xoá O-F04-5 khỏi defer list, chuyển vào Phase 3 ✅).

**Index cần thêm:**
```sql
CREATE INDEX IF NOT EXISTS idx_dish_favorite
  ON dish(is_favorite)
  WHERE is_favorite = 1;
```

---

## 10. Decision DEC-09 — Component contracts (input/output/state)

Bám F-04 §12 component inventory + Style 2025 naming. Liệt kê signature từng component để D11 James implement đúng contract.

### 10.1. `CalorieRing` (`shared/components/calorie-ring/`)

```typescript
@Component({ selector: 'app-calorie-ring', standalone: true, … })
export class CalorieRing {
  // Inputs (signal-based)
  readonly value = input.required<number>();      // current calories
  readonly target = input.required<number>();     // target calories
  readonly size = input<32 | 48 | 64>(48);        // diameter px
  readonly strokeWidth = input<number>(8);
  readonly showCenterLabel = input<boolean>(true);
  readonly variant = input<'calories' | 'protein' | 'carbs' | 'fat'>('calories');

  // Computed
  readonly pct = computed(() => {
    const t = this.target();
    return t > 0 ? Math.min((this.value() / t) * 100, 200) : 0;
  });
  readonly colorClass = computed(() => bandColor(this.pct(), this.variant()));
}
```

**Color logic (band table — F-04 §2 universal):**

| Pct band | Class | Token |
|---|---|---|
| 0-49% | `ring--low` | `--ion-color-danger` |
| 50-79% | `ring--medium` | `--ion-color-warning` |
| 80-110% | `ring--good` | `--ion-color-success` |
| 111-120% | `ring--medium` | `--ion-color-warning` |
| >120% | `ring--high` | `--ion-color-danger` |

`bandColor()` is pure helper trong `core/utils/band-color.ts`.

### 10.2. `MacroRow` (`shared/components/macro-row/`)

```typescript
type MacroRowMode = 'compact' | 'expanded';

@Component({…})
export class MacroRow {
  readonly mode = input<MacroRowMode>('compact');
  readonly protein = input.required<{ value: number; target: number }>();
  readonly carbs = input.required<{ value: number; target: number }>();
  readonly fat = input.required<{ value: number; target: number }>();
  readonly fiber = input<{ value: number; target: number } | null>(null);
  readonly highlightedMetric = input<KeyMetric | null>(null);
}
```

**Compact:** 3 column ngang, mỗi column = ring 32px + label + value (S2).
**Expanded:** 3 row, mỗi row = bar chart full width + label + value/target (S1 Intermediate).
Order **Protein → Carbs → Fat** (Sally O-F04-3 resolution).

### 10.3. `ServingsStepper` (`shared/components/servings-stepper/`)

```typescript
@Component({…})
export class ServingsStepper {
  readonly value = model.required<number>();           // 2-way binding
  readonly min = input<number>(0.1);
  readonly max = input<number>(20);
  readonly step = input<number>(0.1);
  readonly disabled = input<boolean>(false);

  // Output: emit khi user blur input direct (cho parent debounce save)
  readonly committed = output<number>();
}
```

Pattern align floating-label `.input-wrapper` (CI guard `check:form-pattern`).

### 10.4. `RecipeChangedBanner` (`shared/components/recipe-changed-banner/`)

```typescript
@Component({…})
export class RecipeChangedBanner {
  readonly snapshotCalories = input.required<number>();
  readonly currentCalories = input.required<number>();
  readonly diffPct = input.required<number>();   // already computed by repo

  // Only renders if diffPct > 2 (caller responsibility — banner trusts input)
  readonly faqLinkClicked = output<void>();
}
```

Visual: warning bg (`--ion-color-warning-tint`), ⚠️ icon, BOLD snapshot, italic recipe-current, delta line, "ℹ️ Tại sao?" link → emit `faqLinkClicked` → parent navigate Settings → FAQ.

### 10.5. `StatusPill` (`shared/components/status-pill/`)

```typescript
@Component({…})
export class StatusPill {
  readonly status = input.required<'planned' | 'logged'>();
  readonly completedAt = input<string | null>(null);  // logged only
}
```

Variant:
- `planned` → 📌 + "Kế hoạch" + sage-200 bg, opacity 0.6
- `logged` → 🔒 + "Đã ăn" + completedAt formatted (`HH:mm`) + sage-500 bg solid

### 10.6. Pages + smart components

| Component | File | Dependencies |
|---|---|---|
| `Dashboard` | `features/dashboard/dashboard.ts` | `NutritionStore`, `CalorieRing`, `MacroRow`, `NutritionDashboardCard` |
| `NutritionDashboardCard` | `features/dashboard/components/nutrition-dashboard-card/` | input variant; renders S1 layout |
| `TrendView` | `features/dashboard/trend-view/trend-view.ts` | `NutritionStore`, `TrendBarChart`, `IonSegment` |
| `TrendBarChart` | `shared/components/trend-bar-chart/` | input bars[], target line, target lineHeight px |
| `Calendar` | `features/calendar/calendar.ts` | `CalendarStore`, `MealSlotCard`, `DaySummaryCard`, `DayRow` |
| `DaySummaryCard` | `features/calendar/components/day-summary-card/` | `NutritionStore.today` shared |
| `MealSlotCard` | `features/calendar/components/meal-slot-card/` | input slot, list của planned_dish; FAB [+] → emit openLogModal |
| `DayRow` | `features/calendar/components/day-row/` | input WeekDayTotal; tap → CalendarStore.setView('day') + setDate |
| `LoggingModal` | `features/calendar/components/logging-modal/` | `DishStore`, `PlannedDishRepository.listRecentLogged` |
| `EditDishModal` | `features/calendar/components/edit-dish-modal/` | `PlannedDishRepository.getById` (load detail), mutations qua CalendarStore |
| `RecipeChangedBanner` | (shared, 10.4) | rendered conditionally trong EditDishModal |
| `ConfirmEatModal` | `shared/components/confirm-eat-modal/` (F-03 §6.2) | reuse cho mark/unmark |

**Smart Key Metric router** = pure utility, KHÔNG component (xác nhận F-04 §12 placement đúng):

File: `src/app/core/utils/key-metric-router.ts`
```typescript
export type KeyMetric = 'calories' | 'protein' | 'carbs' | 'fat';
export type KeyMetricVariant = 'beginner' | 'lose' | 'gain' | 'maintain' | 'advanced';

export function routeKeyMetric(level: ProfileLevel, goal: ProfileGoal): KeyMetricVariant {…}
export function visibleMetrics(variant: KeyMetricVariant): KeyMetric[] {…}
```

---

## 11. Decision DEC-10 — File structure (Style 2025 align)

```
src/app/
├── core/
│   ├── repositories/
│   │   ├── day-plan.repository.ts          (NEW)
│   │   ├── day-plan.repository.spec.ts     (NEW)
│   │   ├── planned-dish.repository.ts      (NEW)
│   │   ├── planned-dish.repository.spec.ts (NEW)
│   │   └── (existing: dish, ingredient, dish-ingredient, user-profile)
│   ├── services/
│   │   └── nutrition/
│   │       ├── nutrition-query.service.ts       (NEW)
│   │       └── nutrition-query.service.spec.ts  (NEW)
│   ├── stores/
│   │   ├── calendar.store.ts                (NEW)
│   │   ├── calendar.store.spec.ts           (NEW)
│   │   ├── nutrition.store.ts               (NEW)
│   │   ├── nutrition.store.spec.ts          (NEW)
│   │   └── (existing: dish, ingredient, profile, network)
│   ├── utils/
│   │   ├── key-metric-router.ts             (NEW)
│   │   ├── key-metric-router.spec.ts        (NEW)
│   │   ├── band-color.ts                    (NEW)
│   │   └── band-color.spec.ts               (NEW)
│   └── models/
│       └── (extend management.types if needed: MealType, KeyMetric, DayPlanWithSlots)
│
├── shared/
│   └── components/
│       ├── calorie-ring/                    (NEW)
│       ├── macro-row/                       (NEW)
│       ├── servings-stepper/                (NEW)
│       ├── recipe-changed-banner/           (NEW)
│       ├── status-pill/                     (NEW)
│       ├── trend-bar-chart/                 (NEW)
│       └── confirm-eat-modal/               (NEW — F-03 §6.2)
│
└── features/
    ├── dashboard/
    │   ├── dashboard.ts                     (extend existing)
    │   ├── dashboard.routes.ts
    │   ├── components/
    │   │   └── nutrition-dashboard-card/    (NEW)
    │   └── trend-view/
    │       ├── trend-view.ts                (NEW push page)
    │       └── trend-view.routes.ts
    │
    └── calendar/
        ├── calendar.ts                      (extend existing)
        ├── calendar.routes.ts
        └── components/
            ├── meal-slot-card/               (NEW)
            ├── day-summary-card/             (NEW)
            ├── day-row/                      (NEW)
            ├── empty-day-state/              (NEW — F-03 §5)
            ├── logging-modal/                (NEW)
            │   └── dish-detail-sheet/
            └── edit-dish-modal/              (NEW)
```

**Tổng new files Phase 3:** ~38 file (component PC-1 = 3 file/component × 13 component + 4 utils + 2 repo × 2 + 1 service + 2 store × 2 + 1 page).

---

## 12. Risks & Mitigations (architectural)

| Risk | Impact | Mitigation |
|---|---|---|
| **R-A1 CHECK constraint reject insert** khi app bug ghi nhầm `is_completed=1` mà thiếu snapshot | DB write fail → user thấy error toast, dish không lưu | Repo method `markCompleted` luôn snapshot trước UPDATE; spec test với 4 case CHECK truth table |
| **R-A2 Stale cache** khi user edit recipe ở F-02 mà đang xem F-03 | UI hiển thị calo cũ | F-02 dish edit → emit signal → CalendarStore listen → bumpInvalidation; nếu skip wiring sẽ stale (verify trong story F-04.S1) |
| **R-A3 Race condition** giữa optimistic update và tx fail | UI show success rồi rollback gây flicker | Pattern: tx FIRST, signal update LAST (không optimistic cho mutation can fail). Loss = ~50ms response, gain = correctness. |
| **R-A4 Trend 365-day query slow** trên Android low-tier | F-04 §16 PRD performance check | Partial index `idx_planned_dish_completed`; KHÔNG query >90 day cùng lúc; Phase 4 add aggregate snapshot table nếu cần |
| **R-A5 dish_with_totals VIEW recompute mỗi query** | Repeat compute trên 1 dish 5 ingredient | Negligible (~5 row/dish). Materialize chỉ khi profiling thấy bottleneck. |
| **R-A6 SQL CASE syntax khác nhau** giữa sql.js và Capacitor SQLite | Spec test pass web fail native | Test full E2E trên emulator (mobile-qa-toolkit), ko chỉ Karma. CI guard add cross-DB schema test (Phase 4). |
| **R-A7 Migration replay cho existing dev DBs** | Sửa init migration in-place không trigger rerun → dev local DB inconsistent | Pre-release rule: dev wipe DB. Tài liệu hoá trong dev README + post-DEC-01 commit message. |

---

## 13. Acceptance Criteria (cho D9 Bob breakdown stories + D11 James implement)

### Schema (DEC-01, DEC-08, DEC-09)

- [ ] `planned_dish` schema sửa: 4 cột nutrition nullable + CHECK constraint Hybrid + `servings > 0` CHECK
- [ ] 2 partial index mới: `idx_planned_dish_completed`, `idx_planned_dish_completed_at`
- [ ] 1 partial index mới: `idx_dish_favorite`
- [ ] `schema.spec.ts` cover 4 truth-table case của CHECK Hybrid
- [ ] `meal_slot.total_*` + `day_plan.total_*` đánh comment DEPRECATED, app code KHÔNG đọc/ghi
- [ ] Dev DB wipe noted trong commit message + dev README

### Repositories (DEC-03)

- [ ] `DayPlanRepository` 3 method với spec
- [ ] `PlannedDishRepository` 8 method với spec; mỗi mutation atomic `withTransaction`
- [ ] `markCompleted` snapshot từ `dish_with_totals × servings` (KHÔNG re-compute từ raw ingredient)
- [ ] `unmarkCompleted` set 4 cột nutrition + completed_at = NULL (CHECK pass)
- [ ] `editServings` nhánh `is_completed=1` recompute snapshot
- [ ] `delete` hard delete (no soft) — undo ở UI layer
- [ ] `listRecentLogged` distinct by dish_id, ORDER BY MAX(completed_at) DESC

### Service (DEC-03)

- [ ] `NutritionQueryService.dailyTotals` query DEC-06.1 với COALESCE và LEFT JOIN
- [ ] `weekTotals` DEC-06.2 với partial index hint verify (EXPLAIN QUERY PLAN spec)
- [ ] `trend` DEC-06.3 với CTE pattern, 2 query

### Stores (DEC-04, DEC-05)

- [ ] `CalendarStore` exposes signals + 6 mutation; bumps invalidationTick sau commit
- [ ] `NutritionStore` effect listens invalidationTick → refreshToday
- [ ] `keyMetric` computed từ `ProfileStore.profile()`
- [ ] Trend cache TTL 5 phút + clear on invalidation
- [ ] Cross-store: NutritionStore → CalendarStore one-way (no circular)

### Components (DEC-09)

- [ ] 7 shared component đúng contract input/output
- [ ] CalorieRing 5-band color logic + `bandColor()` util test
- [ ] MacroRow 2 mode (compact/expanded) + order P→C→F
- [ ] ServingsStepper với `model.required` + `committed` output
- [ ] RecipeChangedBanner emit `faqLinkClicked`
- [ ] `routeKeyMetric` 5 variant + `visibleMetrics` test cover 5 case

### Pipe (DEC-02)

- [ ] KHÔNG tạo `app-effective-nutrition-pipe` (xoá khỏi F-04 §12)
- [ ] Repo trả `effective_*` columns sẵn

### Performance (R-A4)

- [ ] EXPLAIN QUERY PLAN cho weekTotals + trend xác nhận index usage (spec assertion)
- [ ] Manual perf test: log 90 ngày × 4 slot × 3 dish = 1080 row → trend query <200ms trên emulator

---

## 14. Open issues defer (cho Phase 4+ hoặc D9 PM)

| ID | Topic | Defer to |
|---|---|---|
| O-A1 | Aggregate snapshot table nếu trend slow trên Android low-tier | Phase 4 sau perf measurement |
| O-A2 | Drop `meal_slot.total_*` + `day_plan.total_*` columns hard | v1.x cleanup migration v2 |
| O-A3 | Window function (LEAD/LAG) cho trend slope khi Capacitor SQLite v6 default | Phase 4+ |
| O-A4 | Lint guard `check:deprecated-columns` | Phase 4 capacity |
| O-A5 | Cross-DB schema parity test (sql.js vs Capacitor SQLite) | Phase 4 CI hardening |
| O-A6 | Tab "Đã lưu" UX khi favorite list >50 — pagination? | Phase 4 nếu user analytics show |

---

## 15. Handoff to D9 (Bob — Epic + Stories)

**D9 inputs từ doc này:**
- §13 Acceptance Criteria → break thành **6-7 epic** Phase 3:
  1. **EP-CT-1 Schema & DB foundation** (DEC-01, partial indexes, schema spec)
  2. **EP-CT-2 Repository layer** (DEC-03 — DayPlan + PlannedDish + NutritionQuery)
  3. **EP-CT-3 Signal stores** (DEC-04 — Calendar + Nutrition store với invalidation bus)
  4. **EP-CT-4 Shared components** (DEC-09 §10.1-10.5 — 7 component reusable)
  5. **EP-CT-5 F-03 Calendar pages** (DayView + WeekView + DateModal + ConfirmEat + EmptyState)
  6. **EP-CT-6 F-04 Tracking surfaces** (Dashboard NutriCard + DaySummary + TrendView)
  7. **EP-CT-7 F-04 Modals** (LoggingModal M1 + EditDishModal M2 với banner)
- §10 component contracts → mỗi component ≈ 1 story trong epic tương ứng.
- §12 R-A1..R-A7 risks → mỗi risk có acceptance test cụ thể, Bob link vào story.

**Story dependency graph:**
```
EP-CT-1 (schema) ─┬─→ EP-CT-2 (repo) ─→ EP-CT-3 (store) ─┬─→ EP-CT-5 (calendar pages)
                   │                                       ├─→ EP-CT-6 (dashboard)
                   └─→ EP-CT-4 (shared components) ────────┴─→ EP-CT-7 (modals)
```

EP-CT-1 + EP-CT-4 có thể parallel. EP-CT-5/6/7 yêu cầu EP-CT-2 + EP-CT-3 + EP-CT-4 done.

**Phase 3 estimate:** ~38 file mới, ~25 story (component-level), 3-4 sprint với 1 dev solo.

**Decisions Bob KHÔNG cần re-debate** (đã chốt ở doc này):
- Schema fix in-place (không bump SCHEMA_VERSION)
- SQL CASE thay vì pipe
- 2 store separate (Calendar + Nutrition)
- Repository pattern strict (D-TECH-1 confirm YES)
- `dish.is_favorite` Phase 3 wire UI (DEC-08)

---

## 16. Winston signing off

D8 architecture decisions hoàn tất. **10 decisions chốt** (DEC-01..10), **7 risks** (R-A1..7), **6 open issues** defer (O-A1..6).

**Tổng output:**
- Schema fix + 3 partial indexes mới
- 2 repository + 1 query service + 2 store + 7 shared component + 4 utility/router → ~38 file mới
- 7 epic structure cho D9 với dependency graph rõ
- Acceptance criteria 7 nhóm cho D11 dev

**3 critical paths đã decide:**
1. **Hybrid policy enforcement** = SQL CHECK constraint (database guarantee, không phụ thuộc app code)
2. **Effective nutrition** = SQL CASE (single source of truth, repo trả sẵn `effective_*`)
3. **Cache invalidation** = signal `invalidationTick` bus (CalendarStore emit → NutritionStore listen)

**Resolved 4 open question từ F-04 §16 + 1 Sally placement (`is_favorite`).**

**Sẵn sàng handoff cho:**
- **D9 Bob (PM):** §15 epic structure đã sẵn, breakdown thành stories
- **D11 James (Dev):** §13 acceptance criteria + §10 component contracts đủ chi tiết để code thẳng

_Cập nhật cuối: 2026-05-09 — Winston (Architect, BMAD)_
