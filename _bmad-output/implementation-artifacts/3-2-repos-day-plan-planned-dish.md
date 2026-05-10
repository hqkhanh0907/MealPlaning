# Story 3.2: Repository layer — DayPlanRepository + PlannedDishRepository

Status: ready-for-dev

<!-- Source: _bmad-output/planning-artifacts/epic-3-calendar.md (rev 1, 2026-05-10) -->

## Story

As a **dev của HealthMate AI**,
I want **2 repository class (DayPlanRepository 3-method + PlannedDishRepository 8-method) atomic transaction + spec coverage 4 truth-table CHECK + 8 mutation path**,
so that **CalendarStore Story 3.3 và modal Epic 4 có data layer ổn định, KHÔNG cần inline SQL ở component, schema CHECK contract được verify ở repo layer chứ không chỉ DB layer**.

## Acceptance Criteria

1. **AC-1 — DayPlanRepository (3 method).** Tạo `src/app/core/repositories/day-plan.repository.ts` export class `DayPlanRepository`:
   - `getOrCreateForDate(date: string): Promise<DayPlan>` — INSERT IF NOT EXISTS + 4 meal_slot rows (`breakfast`/`lunch`/`dinner`/`snack`) trong 1 transaction (`db.withTransaction`). Idempotent: gọi 2 lần cùng date → 1 day_plan + 4 meal_slot, không double.
   - `findByDate(date: string): Promise<DayPlanWithSlots | null>` — JOIN day_plan + meal_slot + planned_dish + dish_with_totals, return nested structure. NULL nếu không có day_plan.
   - `findByDateRange(start: string, end: string): Promise<DayPlanWithSlots[]>` — for Week View Story 3.6. Sort ASC by date.

2. **AC-2 — PlannedDishRepository (8 method).** Tạo `src/app/core/repositories/planned-dish.repository.ts` export class `PlannedDishRepository`:
   - `addToSlot(slotId: string, dishId: string, servings: number): Promise<PlannedDish>` — INSERT với `is_completed=0`, 4 cột nutrition NULL, completed_at NULL. Sort_order = MAX(sort_order)+1 trong slot.
   - `markCompleted(plannedDishId: string): Promise<void>` — trong 1 tx: SELECT `dish_with_totals × servings` snapshot, UPDATE `is_completed=1`, set `calories/protein/carbs/fat` + `completed_at = datetime('now')`. SQL `datetime('now')` (NOT `Date.now()` — Disaster A).
   - `unmarkCompleted(plannedDishId: string): Promise<void>` — set `is_completed=0`, 4 cột nutrition NULL, `completed_at NULL` (SNAP-05 reset). 1 tx.
   - `editServings(plannedDishId: string, newServings: number): Promise<void>` — branch:
     - nếu `is_completed=0`: chỉ UPDATE servings.
     - nếu `is_completed=1`: re-query `dish_with_totals` HIỆN TẠI × newServings → UPDATE servings + 4 cột nutrition snapshot (SNAP-04 — KHÔNG ratio scale từ snapshot cũ).
   - `delete(plannedDishId: string): Promise<void>` — hard delete (no soft, undo handled ở UI Story 3.7).
   - `moveToSlot(plannedDishId: string, newSlotId: string): Promise<void>` — UPDATE meal_slot_id. Sort_order recompute = MAX(sort_order)+1 trong newSlot.
   - `copyToDate(plannedDishId: string, targetDate: string, targetMealType: MealType): Promise<PlannedDish>` — call `getOrCreateForDate(targetDate)` → resolve target slotId by mealType → call `addToSlot` (Hybrid: copy luôn = `is_completed=0`).
   - `listRecentLogged(limit: number = 30): Promise<DishListItem[]>` — DISTINCT `dish_id`, ORDER BY MAX(`completed_at`) DESC. Dùng cho Epic 4 Modal "Gần đây".

3. **AC-3 — Transaction atomicity verified.** Mỗi mutation method (`getOrCreateForDate`, `addToSlot`, `markCompleted`, `unmarkCompleted`, `editServings`, `delete`, `moveToSlot`, `copyToDate`) dùng `database.withTransaction(async () => …)`. Spec test: inject sql throw giữa tx (mock `db.execute` reject ở call thứ N) → assert `expect(db.withTransaction).toHaveBeenCalled()` + assert state DB không đổi (rollback).

4. **AC-4 — CHECK constraint catch.** Spec test `markCompleted` với mock `dish_with_totals` row có 1 cột NULL (vd `total_protein=null`) → `expectAsync(repo.markCompleted(id)).toBeRejected()` — CHECK reject NOT NULL violation. DB state: row vẫn `is_completed=0`.

5. **AC-5 — `effective_*` columns trong SELECT.** Mọi SELECT trả `planned_dish` (`findByDate`, `findByDateRange`) phải include 4 computed columns:
   ```sql
   CASE WHEN pd.is_completed = 1 THEN pd.calories  ELSE dwt.total_calories * pd.servings END AS effective_calories
   CASE WHEN pd.is_completed = 1 THEN pd.protein   ELSE dwt.total_protein  * pd.servings END AS effective_protein
   CASE WHEN pd.is_completed = 1 THEN pd.carbs     ELSE dwt.total_carbs    * pd.servings END AS effective_carbs
   CASE WHEN pd.is_completed = 1 THEN pd.fat       ELSE dwt.total_fat      * pd.servings END AS effective_fat
   ```
   Repo trả sẵn → component / store / pipe KHÔNG re-compute (DEC-02).

6. **AC-6 — File structure (Style 2025 exception cho repository).** Files:
   - `src/app/core/repositories/day-plan.repository.ts` + `day-plan.repository.spec.ts`
   - `src/app/core/repositories/planned-dish.repository.ts` + `planned-dish.repository.spec.ts`
   - Class export tên `DayPlanRepository` / `PlannedDishRepository`. **Note:** kebab-case file + suffix `.repository.ts` + class suffix `Repository` là exception đã thiết lập (precedent: `dish.repository.ts` / `ingredient.repository.ts` / `user-profile.repository.ts` đều ship vậy). KHÔNG migrate batch trong story này.

7. **AC-7 — Model types extend.** Tạo file mới `src/app/core/models/meal-plan.types.ts`:
   ```ts
   export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
   export interface DayPlan { id; date; target_calories; target_protein; created_at; updated_at; }
   export interface MealSlot { id; day_plan_id; meal_type: MealType; position; created_at; }
   export interface PlannedDish { id; meal_slot_id; dish_id; servings; sort_order; is_completed; completed_at; calories; protein; carbs; fat; created_at; }
   export interface PlannedDishWithEffective extends PlannedDish {
     dish_name: string; effective_calories: number; effective_protein: number; effective_carbs: number; effective_fat: number;
   }
   export interface MealSlotWithDishes extends MealSlot { planned_dishes: PlannedDishWithEffective[]; }
   export interface DayPlanWithSlots extends DayPlan { meal_slots: MealSlotWithDishes[]; }
   ```

8. **AC-8 — Spec coverage.** 2 spec file cover:
   - `day-plan.repository.spec.ts`: ≥ 8 tests (3 method × 2 happy + 1 idempotency for getOrCreateForDate + 1 empty range for findByDateRange).
   - `planned-dish.repository.spec.ts`: ≥ 16 tests (8 method × 2 minimum: 1 happy + 1 edge/transaction). Bắt buộc cover:
     - `markCompleted` snapshot từ `dish_with_totals`
     - `editServings` 2 branch (is_completed=0 chỉ update servings vs is_completed=1 re-query)
     - `unmarkCompleted` reset 4 cột về NULL
     - `copyToDate` chain `getOrCreateForDate` + `addToSlot`
   - Pattern follow `dish.repository.spec.ts`: `db = jasmine.createSpyObj<Database>('Database', ['execute', 'query', 'getOne', 'withTransaction'])` + `db.withTransaction.and.callFake(async cb => cb())`.

9. **AC-9 — Toàn bộ test suite không regress.** `ng test` ≥ baseline 446 + spec mới (target 446 + 24 = ≥ 470 pass). 0 fail.

10. **AC-10 — CI guards 5/5 PASS.** `npm run check:guards` → pass cả 5.

11. **AC-11 — Build pass.** `npm run build` no error. APK debug build sanity (test-only changes nhưng repo TS file mới phải compile clean).

12. **AC-12 — Sprint status update.** `sprint-status.yaml`: `3-2-repos-day-plan-planned-dish: done`, `last_updated`, bump rev note.

## Tasks / Subtasks

- [ ] **Task 1 — Model types** (AC-7)
  - [ ] Tạo `src/app/core/models/meal-plan.types.ts` với 6 interface + `MealType`
  - [ ] Verify `npx tsc --noEmit` không lỗi types

- [ ] **Task 2 — DayPlanRepository** (AC-1, AC-3, AC-5, AC-6)
  - [ ] Tạo `day-plan.repository.ts` export class `DayPlanRepository` với constructor `inject(DatabaseService)` (xem pattern `dish.repository.ts`)
  - [ ] Implement 3 method với JOIN + effective_* computed columns
  - [ ] `getOrCreateForDate` dùng `withTransaction`: SELECT existing → if null INSERT day_plan + INSERT 4 meal_slot rows
  - [ ] Verify SELECT đúng schema field name (`calories/protein/carbs/fat` không suffix `_g`) — Disaster C

- [ ] **Task 3 — PlannedDishRepository** (AC-2, AC-3, AC-4, AC-5)
  - [ ] Tạo `planned-dish.repository.ts` export class
  - [ ] Implement 8 method
  - [ ] `markCompleted`: snapshot từ `dish_with_totals` × servings, set `completed_at = datetime('now')` (SQL, không `Date.now()`)
  - [ ] `editServings` branching: is_completed=0 simple UPDATE; is_completed=1 re-query `dish_with_totals` HIỆN TẠI (KHÔNG ratio scale)
  - [ ] `copyToDate` reuse `DayPlanRepository.getOrCreateForDate` (constructor inject)

- [ ] **Task 4 — Spec day-plan.repository.spec.ts** (AC-8)
  - [ ] ≥ 8 test: 3 happy + idempotency + empty range + transaction wrap (`db.withTransaction` called)
  - [ ] Pattern `jasmine.createSpyObj<Database>` từ `dish.repository.spec.ts`

- [ ] **Task 5 — Spec planned-dish.repository.spec.ts** (AC-8, AC-4)
  - [ ] ≥ 16 test: 8 method × 2 (happy + edge/transaction)
  - [ ] CHECK rejection test: mock `dish_with_totals` returning row với 1 cột NULL → `markCompleted` rejects
  - [ ] `editServings` 2 branch test rõ ràng
  - [ ] Verify mỗi mutation `expect(db.withTransaction).toHaveBeenCalled()`

- [ ] **Task 6 — Run full test + guards + build** (AC-9, AC-10, AC-11)
  - [ ] `ng test --watch=false` → ≥ 470 pass
  - [ ] `npm run check:guards` → 5/5 PASS
  - [ ] `npm run build` → no error
  - [ ] `cd android && JAVA_HOME=$(/usr/libexec/java_home -v 21) ./gradlew assembleDebug` → BUILD SUCCESSFUL

- [ ] **Task 7 — Sprint status update** (AC-12)
  - [ ] Add key `3-2-repos-day-plan-planned-dish: done` trong sprint-status.yaml
  - [ ] `last_updated: 2026-05-10`, bump rev (rev 7+ tùy thứ tự)
  - [ ] Verify `check:story-scope-stability` PASS

- [ ] **Task 8 — Commit (Conventional)**
  - [ ] `git add src/app/core/{repositories,models}/ _bmad-output/implementation-artifacts/`
  - [ ] Message: `feat(repos): DayPlanRepository + PlannedDishRepository (Story 3.2)`
  - [ ] Body: list method count + AC pass + test count delta
  - [ ] `git -c commit.gpgsign=false commit -F <msg>` (no `--no-verify`)

## Dev Notes

### Hiện trạng đã ship — KHÔNG reinvent

- **Schema v2 đã enforce** (Story 3.1): planned_dish CHECK Hybrid bidirectional, servings BETWEEN 0.1 AND 20, 4 partial index. Repo KHÔNG cần re-validate ở app layer.
- **`dish_with_totals` VIEW** (schema.ts line 134): single source of truth cho dish macro. KHÔNG re-aggregate raw `dish_ingredient`.
- **Database abstraction** (`database.ts:26`): `withTransaction<T>(callback): Promise<T>` đã có. Web (`web-database.ts`) wrap `BEGIN/COMMIT/ROLLBACK` quanh callback.
- **Repository pattern precedent** (`dish.repository.ts`): constructor `inject(DatabaseService)`, expose method `Promise<X>`, KHÔNG try/catch (let errors bubble — store/component handle UX).
- **Spec test pattern** (`dish.repository.spec.ts`): SpyObj 4 method, `withTransaction.and.callFake(async cb => cb())`, assert SQL string with `toContain`, params with `toEqual`.

### Disasters (must guard against)

- **Disaster A — `Date.now()` ở app layer.** SAI. Dùng SQL `datetime('now')` để consistent với DB timezone (UTC). Verify spec assertion: SQL string contains `datetime('now')`, không có `?` placeholder cho completed_at.
- **Disaster B — ratio scale snapshot khi editServings logged.** SAI. Recipe có thể đã đổi từ lúc log → ratio sai. Phải re-query `dish_with_totals` HIỆN TẠI × newServings (SNAP-04). Spec test: mock `dish_with_totals` đổi giữa lần log và lần edit → assert nutrition mới = current_dwt × new_servings, không phải old_snap × (new/old_servings).
- **Disaster C — Schema field naming.** Cột thực: `calories/protein/carbs/fat` (no `_g` suffix). User_profile: `target_calories/target_protein/target_carbs/target_fat`. Verify `grep -nE 'calories|protein|carbs|fat' src/app/core/services/database/schema.ts` trước khi viết SQL.
- **Disaster D — `is_completed=1` insert path.** `addToSlot` LUÔN insert `is_completed=0`. KHÔNG accept param `isCompleted`. Mark completed là step riêng (`markCompleted`) để guarantee snapshot logic chạy.

### File structure

```
src/app/core/
├── models/
│   └── meal-plan.types.ts                          ← NEW
└── repositories/
    ├── day-plan.repository.ts                       ← NEW
    ├── day-plan.repository.spec.ts                  ← NEW
    ├── planned-dish.repository.ts                   ← NEW
    └── planned-dish.repository.spec.ts              ← NEW
```

### Reference

- Epic source: `_bmad-output/planning-artifacts/epic-3-calendar.md` Story 3.2 (line 169-220)
- Schema v2: `src/app/core/services/database/schema.ts` line 410-477 (HYBRID_POLICY_DDL)
- Story 3.1 closure: commit `6e8fd80`
- Existing repos: `src/app/core/repositories/dish.repository.ts` (~180 lines, follow pattern)
- Data model: `docs/2-data-model/data-model.md` §4.4–4.6 (planned_dish), §5 (dish_with_totals VIEW)

## Definition of Done

- [ ] 2 repository class với 11 method tổng (3 + 8) implement xong
- [ ] ≥ 24 test mới pass (8 day-plan + 16 planned-dish minimum)
- [ ] `ng test`: ≥ 470 / 470 pass (446 baseline + 24)
- [ ] `npm run check:guards` 5/5 PASS
- [ ] `npm run build` no error
- [ ] APK build pass (sanity)
- [ ] Sprint status updated
- [ ] Commit message follows Conventional
- [ ] Code review pass (BMAD `code-review` skill)

## Change Log

| Date       | Change                                            |
|------------|---------------------------------------------------|
| 2026-05-10 | Story created (`ready-for-dev`).                  |
