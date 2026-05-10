---
stepsCompleted: ['epic-3-drafted-2026-05-10']
inputDocuments:
  - docs/2-requirements/prd.md (F-03 §F-03 lines 228-313)
  - _bmad-output/planning-artifacts/ux-spec/f-03-calendar-plan-ux-spec-2026-05-09.md
  - _bmad-output/planning-artifacts/architecture/calendar-tracking-2026-05-09.md (DEC-01..11, R-A1..7)
  - docs/4-architecture/business-rules.md (RULE-PLANNED-DISH-HYBRID, RT-01..02, SNAP-01..05)
  - docs/3-design/data-model.md §4.4-4.6 (day_plan, meal_slot, planned_dish)
  - src/app/core/services/database/schema.ts (SCHEMA_VERSION=2, đã ship Hybrid CHECK)
  - src/app/core/services/notifications/local-notifications.ts (Phase 2 NotificationService — reuse)
  - _bmad-output/planning-artifacts/epic-2-settings-polish.md (template format)
epic: 3
phase: 3
status: draft
ownerLanguage: vi
revision: 1
revisionNote: |
  Rev 1 (2026-05-10): Draft đầu tiên sau readiness audit pass (0 critical gap).
  Slice theo dependency graph trong arch §15: foundation (schema/repo/store) →
  shared components reusable cả Epic 3 + 4 → Calendar pages F-03. Epic 4 sẽ
  cover Dashboard/Trend/Modals. NotificationService Phase 2 reuse (rev 2 commit
  c49f4b5) cho meal-time reminders ở story cuối epic.
---

# HealthMate AI — Epic 3: Calendar Foundation & Meal Planning (F-03)

> **Phase 3 — partition 1.** Epic này đặt nền móng schema/repo/store cho cả Phase 3, và build F-03 surface đầu tiên user nhìn thấy. Epic 4 (Nutrition Tracking) sẽ ride trên foundation này. Schema đã ship v2 (commit DEC-11) — chỉ cần spec coverage. Calendar tab hiện chỉ có placeholder page.

---

## Overview

Phase 3 partition 1 build entry point chính cho user "plan trước" và "log thực tế" bữa ăn. Theo Hybrid policy (`RULE-PLANNED-DISH-HYBRID`): planned dish realtime, logged dish snapshot bất biến. Epic này:

1. **Foundation lock-in** (3 story) — schema CHECK constraint coverage spec, 2 repository layer (DayPlan + PlannedDish) atomic transactions, CalendarStore signals + invalidation bus.
2. **Shared primitives reusable** (1 story) — CalorieRing/ServingsStepper/StatusPill/ConfirmEatModal — Epic 4 cũng dùng.
3. **F-03 Calendar pages** (3 story) — Day View (mặc định), Week View (toggle), Date Picker Modal + Empty State + undo toast wiring.
4. **Notification reuse** (1 story) — wire NotificationService Phase 2 cho meal-time reminders dynamic theo plan.

Sau Epic 3, user mở tab "Lịch ăn" có thể: thêm món vào 4 meal slot, đánh dấu Đã ăn (snapshot), sửa servings, xoá có undo, swipe ngày, xem tuần với color status, sao chép tuần trước. Epic 4 fill Dashboard + Trend + Modal logging UX chi tiết.

---

## Requirements Inventory

### Functional Requirements (PRD F-03 lines 228-313)

| FR | Mô tả | Trạng thái |
|---|---|---|
| F-03.1 | Day View: 4 meal slot (sáng/trưa/tối/phụ) + danh sách món + tổng nutrition | ⏳ 5% — `calendar.page.ts` placeholder, chưa có content |
| F-03.2 | Week View: 7 ngày với color indicator (xanh/vàng/đỏ theo % target) | ⏳ 0% — chưa code |
| F-03.3 | Add/edit/delete dish vào meal slot | ⏳ 0% — phụ thuộc Epic 4 modal M1/M2 cho Add/Edit; Delete + Undo cover trong Epic 3 |
| F-03.4 | Mark "Đã ăn" với confirm ≤3s | ⏳ 0% — ConfirmEatModal trong Epic 3 |
| F-03.5 | Tổng calo/protein cập nhật real-time khi thêm/xoá món | ⏳ 0% — phụ thuộc CalendarStore + DaySummaryCard (placeholder Epic 3, content Epic 4) |
| F-03.6 | AI plan 1 ngày / cả tuần | 🟡 Phase 5+ — Epic 3 ship UI button + redirect "Phase 5" |

### Non-Functional Requirements

- **NFR-PERF-01**: Day View render < 100ms (DB query cached)
- **NFR-PERF-02**: Week query (7 ngày) < 150ms với partial index `idx_planned_dish_completed`
- **NFR-RELIABILITY-01**: Mọi mutation atomic `withTransaction` — rollback nếu fail (Hybrid CHECK constraint catch)
- **NFR-A11Y-01**: Touch target ≥44×44dp cho stepper, [+] FAB, status pill, day row

### UX Design Requirements (F-03 spec)

- 3 sub-views: Day View / Week View / Date Picker Modal
- Visual phân biệt planned (faded + dashed) vs logged (solid) trong meal slot
- Undo toast 8s khi delete (research differentiator — 0/8 apps competitive surveyed có)
- Swipe left/right body → previous/next day
- Color band: ≥80% xanh, 50-79% vàng, <50% đỏ, 110-120% vàng, >120% đỏ (universal §2.2)

### Architecture Decisions (must follow)

- **DEC-01/07/11**: Schema v2 (đã ship) — không thay đổi schema.ts trừ khi audit phát hiện gap
- **DEC-03**: 2 repository (`DayPlanRepository`, `PlannedDishRepository`) + 1 query service (`NutritionQueryService` ở Epic 4)
- **DEC-04**: 2 store separate — `CalendarStore` (Epic 3) + `NutritionStore` (Epic 4); cross-store one-way: NutritionStore listen CalendarStore.invalidationTick
- **DEC-09**: Component contracts §10 (input/output signatures fixed)
- **DEC-10**: File structure Style 2025 align (xem arch §11)

### Risks Inventory (từ arch §12)

| Risk | Story owner | Mitigation |
|---|---|---|
| R-A1 CHECK constraint reject insert thiếu snapshot | 3.2 | `markCompleted` luôn snapshot trước UPDATE; spec test 4 truth-table |
| R-A2 Stale cache khi F-02 edit recipe | 3.3 | F-02 dish edit emit signal → CalendarStore bumpInvalidationTick |
| R-A3 Race optimistic vs tx fail | 3.2 | Pattern: tx FIRST, signal LAST (~50ms response loss = correctness gain) |
| R-A4 Trend 365-day query slow | (Epic 4 — 4.1) | Partial index + 90-day cap; aggregate snapshot defer Phase 4 |
| R-A6 SQL CASE syntax khác sql.js vs Capacitor | 3.2 + 3.5 | E2E test trên emulator (mobile-qa-toolkit), không chỉ Karma |

### FR Coverage Map

| FR / Decision | Story | Verification |
|---|---|---|
| Schema v2 CHECK + indexes (DEC-01/07/11) | 3.1 | `schema.spec.ts` 4 truth-table case + EXPLAIN QUERY PLAN assert index hit |
| F-03.3/4/5 mutations atomic (DEC-03) | 3.2 | repo `.spec.ts` cover 8 method × 2 path (success/CHECK fail rollback) |
| CalendarStore signals + invalidation (DEC-04) | 3.3 | store spec test mutation → signal updates → invalidationTick bumps |
| Shared primitives (DEC-09 §10.1, 10.3, 10.5) | 3.4 | component spec với test ID + manual visual QA emulator |
| F-03.1 Day View | 3.5 | Manual emulator: add 3 món × 4 slot → tổng calo đúng → swipe day works |
| F-03.2 Week View | 3.6 | Manual: 7 ngày color đúng theo % target; tap row → Day View |
| F-03 swipe/empty/undo/datepicker | 3.7 | Manual: delete dish → toast 8s [Hoàn tác] → restore; swipe boundary 365 |
| F-03 meal reminder | 3.8 | Toggle reminder ON ở Settings → notification fire đúng giờ Bữa sáng/trưa/tối |

---

## Epic List

- **Epic 3: Calendar Foundation & Meal Planning** — 8 stories, ước lượng **9–13 ngày dev** (3.1=0.5d + 3.2=2d + 3.3=1.5d + 3.4=1.5d + 3.5=2d + 3.6=1.5d + 3.7=1d + 3.8=1d)

---

## Epic 3: Calendar Foundation & Meal Planning

**Goal:** F-03 surface production-ready với Hybrid policy enforced ở DB layer + repo layer + UI layer. Foundation (schema/repo/store) đủ chắc để Epic 4 ride trên không phải sửa lại.

**Done criteria (Epic-level):**
- [ ] 8 story đạt acceptance criteria
- [ ] `npm run check:guards` (5 guards) + `ng test` (≥450 test pass) + `ionic build --prod` pass
- [ ] APK install + manual QA pass trên emulator-5554 cho 7 user journey: add dish, mark eaten, edit servings, delete + undo, swipe day, week view color, copy-from-last-week
- [ ] Notification fire đúng giờ cho Bữa sáng/trưa/tối khi user đặt plan + bật reminder
- [ ] Schema spec assert 4 CHECK truth-table + EXPLAIN partial index usage
- [ ] Cross-store wiring: F-02 edit recipe → CalendarStore reload → planned dish nutrition update realtime; logged dish KHÔNG đổi

---

### Story 3.1: Schema spec coverage — Hybrid CHECK truth-table + partial index assertions

**As a** dev,
**I want** schema.ts có spec test cover đầy đủ CHECK constraint Hybrid + partial index usage,
**So that** mọi regression schema (vd ai đó đổi CHECK) catch ngay ở CI; future story tin DB layer là source of truth, không re-implement check ở app layer.

**Note:** Schema đã ship v2 (commit DEC-11). Story này KHÔNG sửa schema.ts mà bổ sung spec coverage còn thiếu (acceptance criteria DEC-01 chưa fully verified).

**Acceptance Criteria:**

**AC-1 (CHECK truth-table 4 case).** Tạo `src/app/core/services/database/schema.spec.ts` (hoặc extend nếu đã có) với 4 test:
1. `is_completed=0 + 4 cột nutrition NULL + completed_at NULL` → INSERT pass
2. `is_completed=0 + bất kỳ cột nutrition NOT NULL` → INSERT REJECT (CHECK fail)
3. `is_completed=1 + 4 cột nutrition NOT NULL + completed_at NOT NULL` → INSERT pass
4. `is_completed=1 + bất kỳ cột nutrition NULL OR completed_at NULL` → INSERT REJECT

**AC-2 (servings boundary).** Test `servings BETWEEN 0.1 AND 20`:
- `servings = 0` → REJECT
- `servings = 0.1` → pass
- `servings = 20` → pass
- `servings = 20.01` → REJECT
- `servings = -1` → REJECT

**AC-3 (partial index hit).** Spec dùng `EXPLAIN QUERY PLAN` assert:
- Query `SELECT … WHERE is_completed = 1 AND meal_slot_id = ?` → uses `idx_planned_dish_completed`
- Query `SELECT … WHERE is_completed = 1 ORDER BY completed_at DESC LIMIT N` → uses `idx_planned_dish_completed_at`
- Query `SELECT … FROM dish WHERE is_favorite = 1` → uses `idx_dish_favorite`

**AC-4 (migration replay idempotent).** Extend `migration-runner.spec.ts`:
- Clean DB (`user_version=0`) → run registry → `user_version=2` + tables match v2 final state
- DB at `user_version=1` (simulated old dev DB) → run registry → only v2 executes → final state identical
- Run registry twice → no-op second time

**AC-5 (registry contract).** `migrations.spec.ts` assert `MIGRATION_REGISTRY.length === 2 && last.version === SCHEMA_VERSION === 2`.

**Technical notes:**
- Test target: sql.js (Karma) cover AC-1/2/4/5; Capacitor SQLite native parity verify trong Story 3.5/3.6 manual QA (R-A6 mitigation).
- Reuse helper `createTestDatabase()` nếu đã có; else inline `new WebDatabaseService()` per spec.
- AC-3 EXPLAIN syntax: `db.exec('EXPLAIN QUERY PLAN SELECT …')` — assert result row có substring `idx_planned_dish_completed`.

**Estimate:** 0.5 ngày

---

### Story 3.2: Repository layer — DayPlanRepository + PlannedDishRepository

**As a** dev,
**I want** 2 repository class với 11 method tổng (3 + 8) atomic transaction + spec coverage 4 truth-table CHECK + 8 mutation path,
**So that** Calendar store ở Story 3.3 và modal Epic 4 có data layer ổn định, KHÔNG cần inline SQL ở component.

**Acceptance Criteria:**

**AC-1 (DayPlanRepository — 3 method).**
- `getOrCreateForDate(date: string): Promise<DayPlan>` — INSERT IF NOT EXISTS + 4 meal_slot rows (breakfast/lunch/dinner/snack) trong 1 transaction.
- `findByDate(date: string): Promise<DayPlanWithSlots | null>` — JOIN day_plan + meal_slot + planned_dish + dish, return nested structure.
- `findByDateRange(start: string, end: string): Promise<DayPlanWithSlots[]>` — for Week View Story 3.6.

**AC-2 (PlannedDishRepository — 8 method).**
- `addToSlot(slotId, dishId, servings)` → INSERT với `is_completed=0`, 4 cột nutrition NULL.
- `markCompleted(plannedDishId)` → trong 1 tx: SELECT `dish_with_totals × servings` snapshot, UPDATE `is_completed=1`, set 4 cột nutrition + `completed_at=datetime('now')`.
- `unmarkCompleted(plannedDishId)` → set `is_completed=0`, 4 cột nutrition NULL, `completed_at NULL` (SNAP-05).
- `editServings(plannedDishId, newServings)` → branch: nếu `is_completed=0` chỉ UPDATE servings; nếu `=1` recompute snapshot từ recipe HIỆN TẠI × newServings (SNAP-04).
- `delete(plannedDishId)` → hard delete (no soft, undo handled ở UI Story 3.7).
- `moveToSlot(plannedDishId, newSlotId)` → UPDATE meal_slot_id.
- `copyToDate(plannedDishId, targetDate, targetMealType)` → call `getOrCreateForDate` + `addToSlot` (Hybrid: copy luôn = `is_completed=0`).
- `listRecentLogged(limit=30)` → DISTINCT `dish_id`, ORDER BY MAX(`completed_at`) DESC. Dùng cho Epic 4 Modal "Gần đây".

**AC-3 (transaction atomicity).** Mỗi mutation method dùng `database.withTransaction(async (tx) => …)`. Spec test bằng cách inject sql throw giữa tx → assert state DB không đổi (rollback).

**AC-4 (CHECK constraint catch).** Spec test `markCompleted` với mock dish_with_totals trả NULL → tx fail vì CHECK reject NOT NULL violation → method throws + DB state unchanged.

**AC-5 (effective_* columns trong SELECT).** Mọi SELECT trả planned_dish phải include computed columns:
```sql
CASE WHEN pd.is_completed=1 THEN pd.calories ELSE dwt.total_calories * pd.servings END AS effective_calories
```
(và protein/carbs/fat tương tự). Repo trả sẵn — không pipe Angular (DEC-02).

**AC-6 (file structure Style 2025).** Tạo file:
- `src/app/core/repositories/day-plan.repository.ts` + `.spec.ts`
- `src/app/core/repositories/planned-dish.repository.ts` + `.spec.ts`
- Class names KHÔNG có suffix `Repository` ở filename nhưng class export tên `DayPlanRepository` / `PlannedDishRepository` (theo project Style 2025: file kebab-case ok với suffix domain term, nhưng kiểm `coding-conventions.md §1` exception cho repository).

**AC-7 (model types extend).** `src/app/core/models/management.types.ts` (hoặc tạo `meal-plan.types.ts` nếu cleaner) thêm:
- `MealType = 'breakfast'|'lunch'|'dinner'|'snack'`
- `DayPlanWithSlots` (nested type), `MealSlotWithDishes`, `PlannedDishWithEffective`

**Technical notes:**
- snapshot logic ở `markCompleted`: query `dish_with_totals` (existing VIEW) × servings, KHÔNG re-aggregate raw `dish_ingredient`.
- `editServings` for logged: ratio scale là sai (recipe có thể đã đổi). Phải re-query `dish_with_totals` HIỆN TẠI × newServings (SNAP-04).
- Reuse pattern từ `dish.repository.ts` cho test setup.

**Pitfalls (must add to spec):**
- **Disaster A:** Đừng dùng `Date.now()` cho `completed_at` ở app layer — dùng SQL `datetime('now')` để consistent với DB timezone.
- **Disaster C — Schema field naming:** Cột thực trong schema.ts là `calories/protein/carbs/fat` (không suffix `_g`), `target_calories/target_protein/target_carbs/target_fat` ở user_profile (không suffix `_g`). Verify bằng `grep -nE 'calories|protein|carbs|fat' src/app/core/services/database/schema.ts` trước khi viết SELECT.

**Estimate:** 2 ngày

---

### Story 3.3: CalendarStore — signals + invalidation bus + cross-store wiring

**As a** dev,
**I want** `CalendarStore` expose signals (currentDate, currentView, dayPlan, weekRange) + 6 mutation method + invalidationTick bus,
**So that** Calendar pages chỉ render từ signals; mutations đi qua store; F-02 edit recipe trigger reload tự động.

**Acceptance Criteria:**

**AC-1 (signals).** Expose:
- `currentDate = signal<string>(today)` — ISO yyyy-mm-dd
- `currentView = signal<'day'|'week'>('day')`
- `dayPlan = computed(() => …)` — async-derived từ `currentDate` qua `effect()` write-through cache
- `weekDays = computed(() => …)` — Mon-Sun của tuần chứa `currentDate`
- `invalidationTick = signal(0)` — bump sau mỗi mutation commit

**AC-2 (mutations — 6 method).**
- `setDate(date)` / `setView(view)` — pure signal update
- `addDish(slotKey, dishId, servings)` → call repo → bump tick
- `markEaten(plannedDishId)` → call repo `markCompleted` → bump tick
- `unmarkEaten(plannedDishId)` → call repo `unmarkCompleted` → bump tick
- `editServings(plannedDishId, newServings)` → call repo → bump tick
- `deleteDish(plannedDishId)` → call repo → bump tick
- `copyToDate(plannedDishId, targetDate, targetMeal)` → call repo → bump tick

**AC-3 (one-way wiring).** `NutritionStore` (sẽ tạo Epic 4) listen `CalendarStore.invalidationTick` qua `effect()`. Story 3.3 chỉ cung cấp signal exposure — không có circular ref.

**AC-4 (cross-feature invalidation).** Inject `DishStore` (existing) vào `CalendarStore`; khi `DishStore` emit `dishChanged` (sau F-02 edit recipe), CalendarStore bump invalidationTick. Test bằng cách trigger DishStore mock event → assert tick++.

**AC-5 (file).** `src/app/core/stores/calendar.store.ts` + `.spec.ts`. `providedIn: 'root'`. Inject() pattern, không constructor DI.

**AC-6 (no optimistic).** Pattern: tx FIRST (await repo), signal update LAST (R-A3 mitigation). Spec test: inject repo throw → store signal không đổi.

**Technical notes:**
- `currentDate` boundary clamp [today-365, today+365] (F-03 §2.D2) — clamp ở store, page chỉ tap.
- `effect()` để derive `dayPlan` từ `currentDate + invalidationTick` — write to `dayPlanSignal = signal()` rồi `dayPlan = computed(dayPlanSignal)`.
- Reuse `withTransaction` qua repo, store không trực tiếp gọi DB.

**Estimate:** 1.5 ngày

---

### Story 3.4: Shared primitives — CalorieRing + ServingsStepper + StatusPill + ConfirmEatModal + band-color util

**As a** dev,
**I want** 4 shared component + 1 utility theo contract DEC-09 §10.1/10.3/10.5,
**So that** F-03 pages (Story 3.5/3.6/3.7) và Epic 4 surfaces consume cùng primitive — không drift visual.

**Acceptance Criteria:**

**AC-1 (CalorieRing — `shared/components/calorie-ring/`).** Theo DEC-09 §10.1:
- Inputs: `value`, `target`, `size: 32|48|64`, `strokeWidth=8`, `showCenterLabel=true`, `variant: 'calories'|'protein'|'carbs'|'fat'`
- Computed `pct` clamped [0, 200]
- Computed `colorClass` từ pure helper `bandColor(pct, variant)` (5-band per arch §10.1 table)
- SVG-based (KHÔNG canvas), animation 600ms ease-out khi value đổi
- aria-label: "{Variant Vietnamese} {value} trên {target}, {pct phần trăm}"

**AC-2 (ServingsStepper — `shared/components/servings-stepper/`).** Theo DEC-09 §10.3:
- `value = model.required<number>()` — 2-way binding
- Inputs: `min=0.1`, `max=20`, `step=0.1`, `disabled=false`
- Output `committed = output<number>()` emit on blur direct input
- [─] [+] tap-and-hold accelerate (50ms interval sau 500ms hold)
- Direct numeric input dùng `.input-wrapper` floating-label pattern (CI guard `check:form-pattern` PASS)
- Clamp value vào [min, max] cả ở stepper và direct input

**AC-3 (StatusPill — `shared/components/status-pill/`).** Theo DEC-09 §10.5:
- Inputs: `status: 'planned'|'logged'`, `completedAt: string|null`
- Variant `planned`: 📌 + "Kế hoạch" + bg `var(--sage-50)` opacity 0.6
- Variant `logged`: 🔒 + "Đã ăn lúc {HH:mm}" (parse `completedAt` qua Intl.DateTimeFormat 'vi-VN') + bg `var(--sage-200)` solid

**AC-4 (ConfirmEatModal — `shared/components/confirm-eat-modal/`).** Theo F-03 §6.2:
- Inputs: `dishName`, `mode: 'mark'|'unmark'`
- mode=mark: title "Đánh dấu '{dishName}' đã ăn?", body "Số liệu sẽ được lưu cố định." + microcopy explain Hybrid (link ℹ️)
- mode=unmark: title "Bỏ đánh dấu '{dishName}'?", body "Số liệu hiện tại sẽ bị xoá và quay về realtime theo recipe."
- Output `confirmed = output<boolean>()`
- Touch target ≥44dp cho 2 button [Hủy] [Xác nhận]

**AC-5 (band-color util — `core/utils/band-color.ts`).** Pure function:
```ts
export function bandColor(pct: number, variant: KeyMetric): 'low'|'medium'|'good'|'high'
```
Per arch §10.1 5-band table. Spec test cover 5 boundary case + 1 null.

**AC-6 (PC-1 binary + Style 2025).** Mỗi component 3 file (`.ts` + `.html` + `.scss`), KHÔNG inline template/style. KHÔNG suffix `.component.ts` / class `Component`. CI guards `check:pc1` + `check:style-2025` pass.

**AC-7 (design tokens).** Mọi color/font-size dùng `var(--*)`. CI guard `check:design-tokens` pass.

**Technical notes:**
- Reuse `IonIcon` + `addIcons()` pattern existing.
- ConfirmEatModal có thể là `IonModal` wrapped — verify với `nutrition-badge` component pattern existing.
- ServingsStepper: tap-and-hold dùng `pointerdown`/`pointerup` events (touch + mouse), KHÔNG `mousedown`.

**Estimate:** 1.5 ngày

---

### Story 3.5: F-03 Day View — meal slot list + per-dish actions + DaySummaryCard placeholder

**As a** user,
**I want** mở tab "Lịch ăn" thấy 4 meal slot với danh sách món, có thể tap [+] thêm món, tap [Đã ăn] mark eaten, swipe ngày,
**So that** quản lý kế hoạch + log thực tế hàng ngày.

**Acceptance Criteria:**

**AC-1 (layout per F-03 §2).** `calendar.page.html` render:
- Sticky header: chip "Hôm nay ▼" + center text "{Thứ}, {dd/mm/yy}" (VN format) + icon 📅 right (toggle Week View, defer Story 3.6)
- DaySummaryCard placeholder section (empty Epic 3, content fill Epic 4 — chỉ stub `<app-day-summary-card>` với input `date`)
- 4 MealSlotCard: 🍳 Bữa sáng / 🍱 Bữa trưa / 🍲 Bữa chiều / 🍪 Bữa phụ (Vietnamese label fixed, NO rename)
- AI CTA cuối screen "🤖 AI chọn món hôm nay" → toast "Tính năng sẽ ra mắt Phase 5"

**AC-2 (MealSlotCard — `features/calendar/components/meal-slot-card/`).** Theo F-03 §2.3:
- Inputs: `slot: MealSlotWithDishes`, `mealType: MealType`
- Header: emoji + label + tổng calo (auto-sum effective) + nút [+] FAB
- Body: list dish row với visual distinction:
  - `is_completed=1` (logged): text solid, `<app-status-pill status="logged">` next to name
  - `is_completed=0` (planned): text opacity 0.6, dashed border bottom, calo placeholder "░░░"
- Per-dish action button "[Đã ăn]" chỉ hiện khi `is_completed=0` → emit `markEaten(plannedDishId)`
- Long-press dish → emit `openContextMenu({plannedDishId, action})` (action menu Story 3.7)
- Tap [+] → emit `openLogModal({mealType})` — Modal M1 sẽ build Epic 4, Story 3.5 chỉ wire emit

**AC-3 (mark eaten flow F-03.D.4).** Tap [Đã ăn] → CalendarStore emit confirm modal (ConfirmEatModal mode=mark) → user confirm → `CalendarStore.markEaten(id)` → tx atomic snapshot → UI flip faded → solid (animation 300ms fade).

**AC-4 (empty state F-03 §5).** Nếu `dayPlan().slots.every(s => s.dishes.length === 0)`:
- Render EmptyDayState component (`features/calendar/components/empty-day-state/`) với 3 CTA: [Lên kế hoạch] (call openLogModal breakfast), [Sao chép từ hôm qua] (chỉ enable nếu hôm qua có dishes — call CalendarStore.copyFromYesterday), [🤖 AI Phase 5] disabled toast.

**AC-5 (header date chip).** Tap chip "Hôm nay ▼" → mở Date Picker Modal (Story 3.7). Hiển thị relative label ("Hôm qua"/"Ngày mai"/"Thứ 4 tuần sau") khi không phải hôm nay; có nút "↩ Hôm nay" cạnh.

**AC-6 (swipe gesture F-03.D.2).** Body content swipe left → `setDate(currentDate + 1d)`; right → `currentDate - 1d`. Boundary clamp ở store. Animation slide 200ms.

**AC-7 (AI button — defer Phase 5).** Tap → `IonToast` "Tính năng AI sẽ ra mắt Phase 5". KHÔNG redirect, KHÔNG modal.

**AC-8 (file structure).**
- `features/calendar/calendar.page.ts` extend hiện tại (signal-driven, inject CalendarStore)
- `features/calendar/components/meal-slot-card/` — 3 file PC-1
- `features/calendar/components/empty-day-state/` — 3 file PC-1
- `features/calendar/components/day-summary-card/` — 3 file PC-1 (stub Epic 3, content Epic 4)

**AC-9 (manual QA emulator-5554).**
- Add 2 dish vào Bữa sáng (call modal stub: pre-seed via repo từ devtool, vì Epic 4 chưa có UI add) → render đúng
- Tap [Đã ăn] dish 1 → confirm modal → confirm → dish 1 chuyển solid
- Swipe left → ngày mai (empty state) → CTA [Lên kế hoạch] visible
- Swipe right 2 lần → hôm qua (empty) → [Sao chép từ hôm qua] disabled vì hôm qua trống

**Pitfalls:**
- **Disaster A — Capacitor plugin:** Tránh dùng `@capacitor/haptics` nếu chưa có in package.json (long-press feedback). Nếu muốn, install + verify version trước khi viết AC.
- **Style 2025:** KHÔNG suffix `.component.ts` / class `Component`. File `meal-slot-card.ts`, class `MealSlotCard`.

**Estimate:** 2 ngày

---

### Story 3.6: F-03 Week View — toggle from Day View + 7-row vertical layout + color logic + Sao chép tuần trước

**As a** user,
**I want** toggle sang Week View thấy 7 ngày với màu chỉ thị in-target / under / over,
**So that** review pattern ăn uống cả tuần và quick-jump vào ngày bất kỳ.

**Acceptance Criteria:**

**AC-1 (layout F-03 §3).** Render 7 row vertical (KHÔNG 7-col grid — F-03 §3.3 resolution):
- Header sticky: ◄ "Tuần dd-dd/mm/yy" ► + icon 📋 (toggle về Day View)
- "↩ Tuần này" button khi không phải tuần hiện tại
- Week summary row: "Mục tiêu: {target} cal/ngày · Tổng {target*7}" + "Đã ăn: {logged_sum} cal ({pct}% target)"
- 7 day row: "{T2..CN} ⚪x{n} {logged}/{target} {pct}% {emoji}"

**AC-2 (DayRow component — `features/calendar/components/day-row/`).** Theo F-03 §3.3:
- Inputs: `weekDay: WeekDayTotal` (label, dotCount, loggedCal, targetCal, status)
- Status emoji map: ✅ in 80-110%, 🟡 50-79%, ⚠️ 110-150%, ⛔ <50% or >150%
- Future ngày chưa plan: "─── (chưa plan)" thay số
- Past ngày: bg opacity 0.85
- Tap row → `CalendarStore.setView('day') + setDate(date)`

**AC-3 (color logic F-04 §4 — đã spec).** Áp dụng đúng:
- Chưa plan → neutral gray
- Future planned → neutral gray + label "{plan_total} kcal · kế hoạch"
- Today đang ghi → orange-warning + "{logged}/{target} · đang ghi"
- Past có data → màu theo % target (CHỈ tính `is_completed=1`)

**AC-4 (week query).** `CalendarStore.weekData = computed(...)` query qua `DayPlanRepository.findByDateRange(weekStart, weekEnd)`. EXPLAIN assert dùng `idx_day_plan_date` + `idx_planned_dish_completed`.

**AC-5 (week navigation).** Tap ◄/► → `setDate(currentDate ± 7d)`. Boundary 52 tuần.

**AC-6 (Sao chép tuần trước CTA).** Theo F-03 §3.4:
- Tap "📋 Sao chép tuần trước" → confirm modal với warning "Sẽ ghi đè nếu có món hiện tại"
- Confirm → `CalendarStore.copyPreviousWeek()` → batch insert PlannedDish 7 ngày, `is_completed=0`
- Toast "Đã sao chép {n} món từ tuần trước" [Xem]

**AC-7 (AI plan tuần CTA — defer Phase 5).** Tap → toast "Phase 5".

**AC-8 (manual QA).**
- Toggle Day → Week → đúng layout 7 row
- Tap T3 (có data) → Day View ngày T3 đúng
- Sao chép tuần trước (sau khi seed tuần trước có dishes) → 7 ngày tuần này có dishes faded (planned)

**Pitfalls:**
- Cross-month week (vd 28/04-04/05) → header "Tuần 28/04-04/05/26" — verify date util không break.
- Cross-year week (28/12-03/01) → "Tuần 28/12/25-03/01/26".

**Estimate:** 1.5 ngày

---

### Story 3.7: Date Picker Modal + Empty State + Long-press context menu + Undo toast

**As a** user,
**I want** chuyển ngày qua date picker, undo khi xoá nhầm, sao chép/move dish qua context menu,
**So that** không lo mất data và navigation linh hoạt.

**Acceptance Criteria:**

**AC-1 (Date Picker Modal F-03 §4).**
- Reuse `ion-datetime` standard với preset locale `vi-VN`
- Quick action "↩ Hôm nay" jump to today
- Days với planned/logged dishes có small dot dưới số (query `findByDateRange` toàn tháng hiển thị)
- Selected date highlight với primary color
- Cancel: tap [✕] hoặc tap outside

**AC-2 (Empty State F-03 §5).** EmptyDayState component (đã stub Story 3.5) hoàn thiện:
- Illustration SVG đơn giản (không raster)
- Headline adaptive: "Hôm nay/Hôm qua/Thứ N anh ăn gì?"
- 3 CTA per F-03 §5: [📅 Lên kế hoạch] primary, [📋 Sao chép từ hôm qua] secondary (disabled nếu hôm qua trống), [🤖 AI Phase 5] tertiary disabled

**AC-3 (Context menu long-press F-03 §2.3).** Long-press 1 dish trong MealSlotCard → bottom sheet với 3 action:
- "Sao chép sang ngày khác" → date picker → preview "Sao chép '{name}' vào {meal} ngày {date}?" → confirm → repo `copyToDate` → toast "Đã sao chép sang {label}" [Xem ngày đó]
- "Di chuyển sang bữa khác" → meal-slot picker (4 option) → confirm → repo `moveToSlot` → toast
- "Xoá" → optimistic UI delete + undo toast

**AC-4 (Undo toast F-03.D.6).** Khi xoá:
- UI dish disappear ngay (optimistic)
- Bottom toast "Đã xoá '{name}'  [Hoàn tác]" với progress bar countdown 8 giây
- Tap [Hoàn tác] trong 8s → restore dish (reinsert qua repo) + toast dismiss
- Sau 8s không tap → hard delete commit (đã commit ở AC-3 step "Xoá" gọi repo.delete) — tức là DB đã xoá, undo phải re-insert với original snapshot data

**AC-5 (undo data preservation).** Trước khi gọi `repo.delete`, store cache full PlannedDish record vào `pendingUndo = signal()`. Tap undo → re-insert (Hybrid: nếu record có `is_completed=1` thì dùng `addToSlot` + `markCompleted` với snapshot cached; nếu `=0` thì chỉ `addToSlot`).

**AC-6 (boundary clamp).** Date picker block chọn ngày > today+365 hoặc < today-365 → toast "Chỉ xem được trong vòng 1 năm".

**AC-7 (manual QA).**
- Tap chip date → date picker → chọn ngày 15/06 → Day View load đúng
- Long-press dish → menu → "Sao chép" → ngày mai → toast → swipe ngày mai → có dish copy
- Long-press dish → "Xoá" → toast countdown → tap [Hoàn tác] trước 8s → dish restored
- Long-press dish → "Xoá" → đợi 8s → reload page → dish vẫn không còn (DB committed)

**Pitfalls:**
- Optimistic delete + undo có race: nếu user delete 2 dish liên tiếp trong 8s, mỗi toast riêng (queue), không overlap.
- `pendingUndo` queue: array, FIFO, mỗi entry timer riêng.

**Estimate:** 1 ngày

---

### Story 3.8: Meal-time reminders — wire NotificationService Phase 2 cho Calendar

**As a** user,
**I want** nhận notification nhắc ăn đúng giờ Bữa sáng/trưa/tối khi đã plan dish,
**So that** không quên log + có cue ăn theo plan.

**Note:** NotificationService đã ship Phase 2 (commit c49f4b5, Story 2.2). Story này chỉ wire vào Calendar context — không sửa service.

**Acceptance Criteria:**

**AC-1 (config trong Settings).** Settings → Reminders section (đã có UI từ Phase 2 nhưng chưa wire calendar context):
- Toggle "Nhắc Bữa sáng" + time picker (default 07:00)
- Toggle "Nhắc Bữa trưa" + time picker (default 12:00)
- Toggle "Nhắc Bữa tối" + time picker (default 18:30)
- Toggle "Nhắc Bữa phụ" + time picker (default 15:00) — optional

**AC-2 (CalendarStore subscribe).** `effect()` listen `currentDate + invalidationTick + reminderConfig (from ProfileStore)` → call `NotificationService.scheduleMealReminders(date, config, dayPlan)`:
- Nếu slot có dish (planned hoặc logged) → schedule notification với body "Đến giờ {Bữa X}: {dish names}"
- Nếu slot trống + toggle ON → notification body "Đến giờ {Bữa X} — chưa có món"
- Nếu toggle OFF cho slot → cancel notification cho slot đó

**AC-3 (schedule API).** Add method vào `NotificationService` (extend, không phá Phase 2 API):
```ts
async scheduleMealReminders(date: string, config: ReminderConfig, dayPlan: DayPlanWithSlots): Promise<void>
```
Cancel + reschedule từ scratch mỗi lần gọi (idempotent).

**AC-4 (next-day prefetch).** Khi user mở app sau midnight, store auto-schedule reminder cho hôm nay luôn (effect trigger qua `currentDate` change).

**AC-5 (capacitor.config.ts asset verify — Disaster B).** Verify `LocalNotifications.smallIcon` config đã point đúng asset có tồn tại trong `android/app/src/main/res/drawable*/`. Nếu chưa, fallback `ic_launcher_round` + log warning (defer asset proper Phase 4 release-prep).

**AC-6 (manual QA emulator).**
- Settings: bật toggle Bữa sáng 07:00
- Calendar: add dish vào Bữa sáng hôm nay
- Wait đến 07:00 (hoặc set device time) → notification fire với dish name
- Tap notification → app open ở Calendar tab Day View today

**Pitfalls:**
- **Disaster A:** `@capacitor/local-notifications` API check trước. Verify `schedule()` accept `at: Date` + `id: number`. Reuse pattern từ Phase 2 Story 2.2.
- Notification ID conflict: dùng deterministic ID `hash(date + mealType)` để cancel/reschedule không miss.

**Estimate:** 1 ngày

---

## Phase 3 Exit Checklist (Epic 3 contribution)

- [ ] Schema spec coverage 100% (Story 3.1)
- [ ] 11 repo method tested + atomic (Story 3.2)
- [ ] CalendarStore signals + cross-store wiring works (Story 3.3)
- [ ] 4 shared component + band-color util ship + CI guards pass (Story 3.4)
- [ ] F-03 Day View + Week View + DatePicker + EmptyState + Undo + ContextMenu UX functional (Story 3.5/3.6/3.7)
- [ ] Meal-time reminders fire on emulator (Story 3.8)
- [ ] APK build success + install emulator-5554 + 7-journey manual QA pass

## Out-of-Scope (defer Epic 4 hoặc Phase 4+)

1. F-04 Dashboard Nutrition Card (Epic 4 Story 4.1)
2. F-04 Trend View (Epic 4 Story 4.2)
3. M1 Logging Modal full UI (Epic 4 Story 4.3-4.4) — Story 3.5 chỉ stub `openLogModal` emit, modal sẽ build Epic 4
4. M2 Edit Dish Modal full UI (Epic 4 Story 4.5)
5. NutritionStore + NutritionQueryService (Epic 4 Story 4.0 — foundation cho Epic 4)
6. AI Plan 1 ngày / cả tuần (Phase 5+ — Epic 3 chỉ ship UI button + redirect toast)
7. F-05 Photo logging tab trong Modal (Phase 5+)
8. F-06 AI gợi ý tab trong Modal (Phase 5+)
9. Performance variant Smart Key Metric (Phase 4 redesign, fallback Tăng cơ pattern)
10. Aggregate snapshot table cho trend (Phase 4 sau perf measurement R-A4)

## Dependencies

- **Epic 2** ✅ DONE — NotificationService stable cho Story 3.8 reuse
- **Epic 3 → Epic 4:** Story 3.1/3.2/3.3 phải DONE trước khi Epic 4 Story 4.0 (NutritionStore depend CalendarStore.invalidationTick); Story 3.4 phải DONE trước Epic 4 Stories component (CalorieRing/Stepper/Pill reuse)
- **Internal Epic 3:** 3.1 → 3.2 → 3.3 (data layer chain); 3.4 parallel với 3.1-3.3; 3.5/3.6/3.7 cần 3.2+3.3+3.4 done; 3.8 cần 3.3 (CalendarStore signals) done

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Repo spec test với Capacitor SQLite native parity (R-A6) | Medium | Manual QA Story 3.5/3.6 emulator cover; Phase 4 add CI cross-DB guard |
| Long-press gesture conflict với swipe day | Medium | Hammer.js direction discrimination; test trên real device Story 3.7 |
| Notification permission denial path | Low | Phase 2 đã handle D1 permission flow — story 3.8 graceful nếu denied (toast → Settings) |
| Date timezone bugs (24h boundary, DST) | Low | App Vietnamese, no DST; dùng `date-fns` hoặc native `Intl.DateTimeFormat('vi-VN')` consistent |

---

_Cập nhật: 2026-05-10 — Bob (PM, BMAD) drafted via D9 pipeline._
