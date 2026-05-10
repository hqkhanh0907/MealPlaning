# Story 3.1: Schema spec coverage — Hybrid CHECK truth-table + partial index EXPLAIN

Status: ready-for-dev

<!-- Source: _bmad-output/planning-artifacts/epic-3-calendar.md (rev 1, 2026-05-10) -->

## Story

As a **dev maintaining HealthMate AI's Hybrid nutrition policy**,
I want **schema có spec test runtime cover đầy đủ CHECK truth-table + partial index usage**,
so that **mọi regression schema (vd dev khác đổi CHECK, drop index) bị catch ngay ở `ng test`; future story (3.2 repos) tin DB layer là source of truth, không re-implement CHECK ở app layer**.

**Note:** Schema đã ship v2 (commit DEC-11 trong Phase 2). Story này KHÔNG sửa `schema.ts` mà bổ sung **runtime spec coverage** còn thiếu. Hiện tại `schema.spec.ts` (182 lines) chỉ test DDL string-matching — KHÔNG run thật DDL trên sql.js để verify CHECK constraint reject INSERT đúng theo Hybrid truth-table. Story 3.1 fill gap này.

## Acceptance Criteria

1. **AC1 — Test infra mới: `createTestDatabase()` helper.** Tạo file `src/app/core/services/database/__test__/create-test-database.ts` (hoặc inline trong spec đầu tiên dùng) export async helper trả về `WebDatabaseService` đã `initialize()` xong (sql.js WASM loaded, SCHEMA_DDL applied + MIGRATION_REGISTRY run → `user_version=2`). Helper teardown: close db trong `afterEach`. Reuse `WebDatabaseService` import từ `web-database.ts` — KHÔNG mock.

2. **AC2 — Hybrid CHECK truth-table 4-case (planned).** Trong `schema.spec.ts` (extend file hiện tại) thêm `describe('Hybrid CHECK truth-table — runtime', () => { … })` với 4 test:
   - **Case 1:** INSERT `is_completed=0` + 4 cột nutrition NULL + `completed_at NULL` → resolves (no throw). Verify bằng `db.query('SELECT id FROM planned_dish WHERE id = ?', [insertedId])` trả 1 row.
   - **Case 2:** INSERT `is_completed=0` + `calories=500` (non-NULL) + protein/carbs/fat/completed_at NULL → REJECT (throw từ sql.js với message chứa `CHECK constraint failed`). Verify DB state: `SELECT COUNT(*) FROM planned_dish` = 0.
   - **Case 3:** INSERT `is_completed=1` + 4 cột nutrition non-NULL + `completed_at='2026-05-10 12:00:00'` → resolves.
   - **Case 4:** INSERT `is_completed=1` + `calories=500` + `protein=NULL` + carbs/fat/completed_at non-NULL → REJECT (CHECK fail vì protein NULL khi is_completed=1).

3. **AC3 — Servings BETWEEN 0.1 AND 20 boundary.** Thêm `describe('servings boundary — runtime')`, 5 test:
   - `servings=0` → REJECT
   - `servings=0.1` → pass
   - `servings=20` → pass
   - `servings=20.01` → REJECT
   - `servings=-1` → REJECT
   Mỗi test cần valid `is_completed=0` (4 nutrition NULL) để CHECK Hybrid không trigger trước.

4. **AC4 — Partial index EXPLAIN QUERY PLAN.** Thêm `describe('partial index hit — EXPLAIN QUERY PLAN')`, 3 test. Mỗi test: insert seed data tối thiểu (1 day_plan + 1 meal_slot + ≥2 planned_dish) → run `EXPLAIN QUERY PLAN <query>` → assert kết quả có substring index name:
   - Query A: `SELECT * FROM planned_dish WHERE is_completed = 1 AND meal_slot_id = ?` → uses `idx_planned_dish_completed`
   - Query B: `SELECT * FROM planned_dish WHERE is_completed = 1 ORDER BY completed_at DESC LIMIT 30` → uses `idx_planned_dish_completed_at`
   - Query C: `SELECT * FROM dish WHERE is_favorite = 1` → uses `idx_dish_favorite`

5. **AC5 — Migration registry contract verified.** Extend `migrations.spec.ts` (file hiện tại) thêm 1 test:
   - `MIGRATION_REGISTRY[MIGRATION_REGISTRY.length - 1].version === SCHEMA_VERSION === 2`
   (Test hiện tại line 9-14 đã cover length===2 và version match — verify giữ nguyên + thêm assertion trên `SCHEMA_VERSION` import trực tiếp).

6. **AC6 — Migration replay idempotent (extend existing).** Trong `migration-runner.spec.ts` thêm test mới `'is idempotent when run twice'`:
   - Setup: `createTestDatabase()` (đã `user_version=2`).
   - Action: run `new MigrationRunner(db, MIGRATION_REGISTRY).run()` lần thứ 2.
   - Assert: `user_version === 2` không đổi; query `SELECT COUNT(*) FROM sqlite_master WHERE type='table'` trả số table đúng (= số table v2 final state, KHÔNG double).

7. **AC7 — Existing 14 spec test trong `schema.spec.ts` + 3 spec trong `migrations.spec.ts` còn pass.** Chạy `ng test --include='**/schema.spec.ts' --include='**/migrations.spec.ts' --include='**/migration-runner.spec.ts'` → tất cả pass (cũ + mới).

8. **AC8 — Toàn bộ test suite `ng test` không regress.** Tổng số test trước story = ~418 (Phase 2 closure). Sau story phải ≥ 418 + 12 (new) = **≥430 test pass**, 0 fail.

9. **AC9 — CI guards 5/5 PASS.** `npm run check:guards` → pass cả 5 (`macro-naming`, `version-sync`, `status-ssot`, `no-dark-mode`, `story-scope-stability`).

10. **AC10 — Sprint status update.** Sau khi commit, update `_bmad-output/implementation-artifacts/sprint-status.yaml`:
    - Add line `3-1-schema-spec-coverage-hybrid-check-truth-table: done` trong block Phase 3 (sau comment block JIT).
    - Update `last_updated: 2026-05-10`.
    - Bump revision note (rev 5).

## Tasks / Subtasks

- [ ] **Task 1 — Tạo test helper `createTestDatabase()`** (AC: 1)
  - [ ] Tạo `src/app/core/services/database/__test__/` dir nếu chưa có
  - [ ] Tạo file `create-test-database.ts` export `async function createTestDatabase(): Promise<WebDatabase>`
  - [ ] Inside: `const db = new WebDatabase(); await db.initialize(); return db;` (đảm bảo migration runner đã chạy auto trong initialize)
  - [ ] Verify: viết 1 sanity test `it('boots clean DB at user_version=2')` trong `create-test-database.spec.ts` → `db.query('PRAGMA user_version')` returns `[{user_version: 2}]`
  - [ ] **Pitfall C verify:** Đọc `web-database.ts` confirm class export name là `WebDatabaseService` hay `WebDatabase` — match đúng (style 2025 có thể đã drop suffix). Grep `export class.*Web.*Database` trước.

- [ ] **Task 2 — Hybrid CHECK truth-table 4-case** (AC: 2)
  - [ ] Mở `src/app/core/services/database/schema.spec.ts`
  - [ ] Add new top-level `describe('Hybrid CHECK truth-table — runtime')` AFTER existing describe block (giữ existing tests intact)
  - [ ] Inside: `let db: WebDatabase;` + `beforeEach(async () => { db = await createTestDatabase(); })` + `afterEach(async () => { await db.close?.(); })`
  - [ ] Setup helper inside describe: `async function seedDayPlanSlot(db) { … }` insert 1 row day_plan + 1 row meal_slot, return `slotId`. Reuse `db.execute` + `db.query`.
  - [ ] Viết 4 it() như AC2 case 1-4. Pattern reject: `await expectAsync(db.execute(sql, params)).toBeRejectedWithError(/CHECK constraint failed/)`.
  - [ ] **Pitfall A:** sql.js error message từ CHECK fail có thể khác native. Verify message format trên emulator-5554 hoặc đọc `sql.js` types/source. Nếu khác, dùng `toBeRejected()` plain + assert error message contain `CHECK` case-insensitive.

- [ ] **Task 3 — Servings boundary 5-case** (AC: 3)
  - [ ] Add `describe('servings boundary — runtime')` cùng pattern Task 2
  - [ ] 5 it() case như AC3
  - [ ] Helper `insertPlannedDishWithServings(db, slotId, servings)` để DRY

- [ ] **Task 4 — Partial index EXPLAIN QUERY PLAN** (AC: 4)
  - [ ] Add `describe('partial index hit — EXPLAIN QUERY PLAN')`
  - [ ] Setup: tạo `dish` row + 2 `planned_dish` rows (1 completed + 1 not), 1 favorite dish
  - [ ] 3 it() case Query A/B/C
  - [ ] Pattern: `const plan = await db.query('EXPLAIN QUERY PLAN ' + sql, params); expect(plan.some(row => JSON.stringify(row).includes('idx_planned_dish_completed'))).toBeTrue();`
  - [ ] **Pitfall D:** sql.js EXPLAIN QUERY PLAN output schema khác Capacitor SQLite native. Verify columns trả về (thường có `detail` column chứa "USING INDEX <name>"). Adjust assertion tương ứng.

- [ ] **Task 5 — Migration registry + idempotency** (AC: 5, 6)
  - [ ] Mở `src/app/core/services/database/migrations.spec.ts` line 9 — add 1 line `expect(SCHEMA_VERSION).toBe(2)` để lock version explicit
  - [ ] Mở `src/app/core/services/database/migration-runner.spec.ts` (existing) — add new describe "idempotency"
  - [ ] Test: run runner 2 lần, assert user_version=2 sau cả 2 lần + table count không đổi

- [ ] **Task 6 — Run full test + CI guards** (AC: 7, 8, 9)
  - [ ] `ng test --watch=false` → tất cả pass, count ≥ 430
  - [ ] Lưu count vào commit message (vd "test count: 432 / 432 pass")
  - [ ] `npm run check:guards` → 5/5 PASS
  - [ ] `ionic build` → no error (sanity check schema.ts không broken)
  - [ ] `cd android && JAVA_HOME=$(/usr/libexec/java_home -v 21) ./gradlew assembleDebug` → APK build pass (sanity)

- [ ] **Task 7 — Sprint status update** (AC: 10)
  - [ ] Edit `_bmad-output/implementation-artifacts/sprint-status.yaml`:
    - Add line `3-1-schema-spec-coverage-hybrid-check-truth-table: done` trong Phase 3 block (above `epic-3-retrospective`)
    - `last_updated: 2026-05-10`
    - Add comment `# Rev 5 (2026-05-10): Story 3.1 done — runtime CHECK + EXPLAIN coverage.`
  - [ ] Verify guard `check:story-scope-stability` PASS sau update (story file path khớp key).

- [ ] **Task 8 — Commit (Conventional)**
  - [ ] Stage files: `git add src/app/core/services/database/ _bmad-output/implementation-artifacts/`
  - [ ] Message: `test(schema): runtime Hybrid CHECK + servings + EXPLAIN coverage (Story 3.1)`
  - [ ] Body: liệt kê AC pass + test count delta + reference epic-3 story 3.1
  - [ ] `git -c commit.gpgsign=false commit -F <msg-file>` (no `--no-verify` — guards đã verify)

## Dev Notes

### Hiện trạng đã ship — KHÔNG reinvent

- **`src/app/core/services/database/schema.ts`** (verified line 31): `SCHEMA_VERSION = 2`. Builder `buildInitialSchemaMigration()` v1 + `buildHybridPolicySchemaMigration()` v2 (DEC-11 ship Phase 2).
- **`schema.spec.ts`** (182 lines, 14 test): Cover DDL **string-matching**: CHECK constraint declared, partial index names, drop legacy. **Không cover runtime behavior**.
- **`migrations.spec.ts`** (75 lines): Cover registry length=2, version order, builder match.
- **`migration-runner.spec.ts`**: Cover migration runner execute statements correctly.
- **`web-database.ts`**: Class implements `Database` abstract. `initialize()` → `applySchema()` (SCHEMA_DDL all in 1 batch) + `MigrationRunner(this, MIGRATION_REGISTRY).run()`. `withTransaction(callback)` available.
- **Verified naming:** Class `WebDatabase` (KHÔNG suffix `Service` per Style 2025 — verify trong Task 1). File `web-database.ts` (KHÔNG `.service.ts`).

### sql.js test infra — đã có

- sql.js WASM loaded từ `assets/sql.js/` qua `locateFile` config (line 21 web-database.ts).
- Karma test runner đã serve `assets/sql.js/` — verify trong `angular.json` test target nếu lỗi load WASM.
- `db.execute(sql, params)`: returns Promise<void>, throws on error.
- `db.query(sql, params)`: returns Promise<Row[]>.
- `db.withTransaction(cb)`: rollback on throw.

### Hybrid CHECK constraint (đọc từ schema.ts trước khi viết spec)

```sql
-- planned_dish table
CHECK (
  (is_completed = 0
    AND calories IS NULL AND protein IS NULL AND carbs IS NULL AND fat IS NULL
    AND completed_at IS NULL)
  OR
  (is_completed = 1
    AND calories IS NOT NULL AND protein IS NOT NULL AND carbs IS NOT NULL AND fat IS NOT NULL
    AND completed_at IS NOT NULL)
)
CHECK (servings BETWEEN 0.1 AND 20)
```

### Partial indexes (đọc từ schema.ts)

- `CREATE INDEX idx_planned_dish_completed ON planned_dish(meal_slot_id, completed_at) WHERE is_completed = 1`
- `CREATE INDEX idx_planned_dish_completed_at ON planned_dish(completed_at) WHERE is_completed = 1`
- `CREATE INDEX idx_dish_favorite ON dish(name) WHERE is_favorite = 1`

### Pitfalls đã ghi sẵn

- **A — sql.js CHECK error message format khác native.** Mitigation: dùng `toBeRejected()` + assert message contains `CHECK` case-insensitive (regex `/check/i`).
- **B — sql.js EXPLAIN output schema.** Native SQLite EXPLAIN QUERY PLAN trả 4 cols `id, parent, notused, detail`. sql.js có thể wrap khác. Test bằng `console.log(plan)` của 1 query trước khi assert.
- **C — class name verify.** `web-database.ts` export class tên gì? `WebDatabase` hay `WebDatabaseService`? Grep verify trước Task 1.
- **D — Migration runner idempotency thực sự?** Đọc `migration-runner.ts` — nếu nó skip migrations với `version <= user_version` thì idempotent. Nếu không, AC6 sẽ fail và phải patch migration runner (out-of-scope story 3.1 → fail loud, escalate).
- **E — Test data cleanup giữa it().** `createTestDatabase()` mỗi `beforeEach` tạo DB mới. Đảm bảo `afterEach` close. Nếu db không close properly → memory leak Karma slow.

### Manual verification

Sau khi spec pass, verify trên emulator-5554 (sanity cross-DB):
1. APK install
2. Add 1 dish vào meal slot via dev tool (hoặc seed data)
3. ADB run sqlite3 trên DB file, run cùng EXPLAIN query → assert index hit (Capacitor SQLite native)
4. Story 3.5 sẽ cover comprehensive emulator QA — story 3.1 chỉ smoke test 1 query.

### Test count baseline

Phase 2 closure (commit fcc7dd4): 418 test pass. Story 3.1 thêm:
- 1 sanity test (createTestDatabase boot)
- 4 Hybrid truth-table
- 5 servings boundary
- 3 EXPLAIN partial index
- 1 idempotency
- 1 SCHEMA_VERSION lock (extend existing)
= **+12 test mới**, expected total ≥ 430.

### Out-of-scope

- Capacitor native SQLite spec test (R-A6 mitigation): defer Phase 4 CI cross-DB guard. Story 3.5/3.6 manual emulator QA cover.
- Per-table CHECK constraint trên `meal_slot` / `day_plan`: schema không có CHECK ngoài `planned_dish` → không cần test.
- Migration v3+: chưa có. Story 3.1 only locks v1+v2.

## Definition of Done

- [ ] 12 test mới + 14 test cũ đều pass (`ng test`)
- [ ] `npm run check:guards` 5/5 PASS
- [ ] `ionic build` no error
- [ ] APK build pass (sanity)
- [ ] Sprint status updated với key `3-1-...: done`
- [ ] Commit message rõ + follow Conventional
- [ ] Code review pass (BMAD `code-review` skill optional)
