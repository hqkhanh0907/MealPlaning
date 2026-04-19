# Phase 1: Management — CRUD + Vietnamese Core Seed (F-01 + F-02, non-AI)

**Phase:** 1
**Version:** 1.0
**Date:** 2026-04-18
**Status:** Draft — Not started

> **Doc map:** Implementation contract cho Phase 1. Xem [`development-plan.md`](./development-plan.md) cho tổng thể 7 phases. Acceptance criteria reference [`prd.md`](../2-requirements/prd.md) §2.

---

## 1. Scope

### In scope

| Feature | Phần in scope Phase 1 |
|---------|----------------------|
| **F-01** Quản lý Nguyên liệu | CRUD thủ công + tìm kiếm + sắp xếp + curated ingredient seed phục vụ trực tiếp cho 20 món Việt core |
| **F-02** Quản lý Món ăn | CRUD **2/3 cách**: (1) Ingredient-based, (2) Quick add, + ship sẵn 20 món Việt curated (6 sáng / 7 trưa / 7 tối) |

### Out of scope → Phase 1.5

| Item | Lý do defer |
|------|-------------|
| **F-01** 🤖 AI Lookup | Cần GeminiService — Phase 1.5 |
| **F-02** 🤖 AI Auto-fill (cách thứ 3) | Cần GeminiService + `ingredient_lookup` để tạo nguyên liệu mới — Phase 1.5 |
| Mở rộng dataset ngoài 20 món Việt core | Để V1.x/V2 sau khi Phase 1 foundation ổn định |
| Đồ ăn vặt / snack dishes | Chủ động loại khỏi scope seed Phase 1 |

### Out of scope → Phase khác

- F-03 Calendar / F-04 Tracking (Phase 2)
- F-12 Dashboard (Phase 3)

---

## 2. PRD Acceptance Matrix

### F-01 (prd.md:67-72)

| # | Acceptance criterion | Phase 1 | Phase 1.5 | Task ref |
|---|----------------------|:-------:|:---------:|----------|
| 1 | CRUD hoạt động đúng, data persist sau restart | ✅ | — | §5.3, §5.4 |
| 2 | Tìm kiếm real-time theo tên | ✅ | — | §5.6 list page |
| 3 | AI lookup trả về kết quả và user có thể sửa trước khi lưu | — | Phase 1.5 | — |
| 4 | Core Vietnamese seed dataset hỗ trợ 20 món Việt curated (không gồm snack) | ✅ | Mở rộng ở V1.x | §5.2 seed |

### F-02 (prd.md — acceptance tại cuối F-02 section)

| # | Acceptance criterion | Phase 1 | Phase 1.5 | Task ref |
|---|----------------------|:-------:|:---------:|----------|
| 1 | Tạo món bằng 3 cách (Ingredient / Quick Add / AI) | 2/3 (Ingredient + Quick Add) | 3/3 (AI Auto-fill) | §5.6 |
| 2 | Dinh dưỡng tự tính đúng từ nguyên liệu × khối lượng | ✅ | — | §5.3 `dish_ingredient` logic |
| 3 | Quick Add lưu dinh dưỡng trực tiếp | ✅ | — | §5.6 edit modal |
| 4 | Xóa món: confirm dialog nếu đang dùng trong kế hoạch ăn | ⚠️ Partial* | — | §5.5 `<app-confirm-dialog>` |

> *Partial*: Phase 1 chưa có Calendar flow nên `planned_dish` chưa được user tạo thực tế. Phase 1 chỉ implement generic confirm + repository/DB guard khi phù hợp. Full planned_dish-aware UX/message sẽ hoàn tất ở Phase 2.

---

## 3. Pre-flight Checklist

Các hạng mục phải **done** trước khi start code Phase 1:

- [ ] **Mockups HTML** trong `docs/3-design/mockups/` (theo D8):
    - [ ] `phase-1-ingredient-list.html`
    - [ ] `phase-1-ingredient-edit.html`
    - [ ] `phase-1-dish-list.html`
    - [ ] `phase-1-dish-edit-ingredient-based.html`
    - [ ] `phase-1-dish-edit-quick-add.html`
- [ ] **ADR-002** (migration strategy) viết + commit — xem §4.1
- [x] **Danh sách 20 món Việt core** được chốt (6 sáng / 7 trưa / 7 tối) — xem §5.2
- [x] **Nguồn nutrition authority** cho ingredient canonical values được xác nhận (§5.2) — USDA làm authority chính cho macro ingredient-level

Các hạng mục có thể **defer** sang Phase 1.5/2:

- E2E tool decision (O2) — chỉ cần chốt khi bắt đầu viết E2E tests

---

## 4. Architecture Decisions cho Phase 1

### 4.1 Migration Runner Strategy (DECIDED: **Option B — migrations-only**)

**Vấn đề:** Hiện `schema.ts` chứa `SCHEMA_DDL[]` với `CREATE TABLE IF NOT EXISTS`, chạy mỗi boot. Chưa có migration runner. D6 đã chốt "version + sequential migrations" — cần implement.

**Options:**
- **A.** Giữ `schema.ts` như V1 bootstrap + migrations V2, V3, ... chạy sau DDL
- **B.** Xoá `schema.ts`, move DDL vào `migrations/V1_initial_schema.sql`, migration runner luôn chạy all pending migrations

**Decision: B** — single source of truth, không drift giữa schema.ts và migration state.

**Implementation** (§5.1):
```
src/app/core/services/database/
  migrations/
    V1_initial_schema.sql     (move toàn bộ DDL từ schema.ts)
    index.ts                  (export MIGRATION_REGISTRY)
  migration-runner.ts         (đọc db_version, chạy pending, update db_version)
  database.service.ts         (abstract: unchanged)
  web-database.service.ts     (replace SCHEMA_DDL loop bằng MigrationRunner.run())
  schema.ts                   (retire sau khi V1 migration được tạo)
```

Migration runner pseudocode:
```
async run() {
  const current = await readDbVersionOrZero();  // 0 nếu app_config chưa tồn tại
  const pending = MIGRATION_REGISTRY
    .filter(m => m.version > current)
    .sort(by version);
  for (const m of pending) {
    await executeInTransaction(m.sql);
    await writeDbVersion(m.version);
  }
}
```

**Bootstrap rule:**
- Empty DB: `readDbVersionOrZero()` trả `0` nếu `app_config` chưa tồn tại
- `V1_initial_schema.sql` chịu trách nhiệm tạo toàn bộ schema + `app_config` + seed `db_version = 1`
- Seed data loader chạy **sau migration runner**, không nhét ingredient/dish seed vào SQL migration

### 4.2 Testing Scope Realistic

Dev-plan Q7 chọn "full 4 levels" cho V1 — nhưng đó là roadmap-level. **Phase 1 cụ thể:**

| Level | Phase 1 | Phase 1.5+ |
|-------|:-------:|:----------:|
| Unit (Karma + Jasmine) | ✅ repos + stores + migration-runner | tiếp tục |
| Component (Karma, mocked stores) | Skip (quá sớm) | Phase 2 trở đi |
| E2E (Cypress/Playwright) | Defer — chỉ setup tool, chưa viết suite | Phase 1.5 viết E2E đầu tiên |
| Manual QA checklist | ✅ viết checklist, chạy trước khi Phase 1 kết thúc | tiếp tục |

**Lý do defer E2E suite:** Setup Cypress/Playwright trên Ionic+Capacitor là 1-2 day task. Phase 1 focus foundation data layer + UI.

### 4.3 Nutrition Canonical Model + Unit Policy

**Canonical rule đã chốt:**
- Macro fields dùng tên ngắn: `calories`, `protein`, `carbs`, `fat`, `fiber`
- Canonical nutrition basis chỉ có:
  - `100g` cho nguyên liệu rắn
  - `100ml` cho nguyên liệu lỏng
- Phase 1 chỉ support entry units:
  - `g`
  - `ml`
  - `piece`
- `piece` chỉ hợp lệ nếu có conversion rõ ràng:
  - `grams_per_unit`
  - hoặc `ml_per_unit`

**Hệ quả cho implementation:**
- Không cho mỗi ingredient có một nutrition basis riêng kiểu `per_egg`, `per_tbsp`, `per_bowl`
- UI có thể cho user nhập `piece`, nhưng data layer phải normalize sang canonical basis (`g` hoặc `ml`) trước khi tính macro
- Ingredient metadata cần lưu:
  - `category`
  - `nutrition_basis_unit`
  - `nutrition_basis_quantity` (=100)
  - `default_entry_unit`
  - `grams_per_unit?`
  - `ml_per_unit?`

Ví dụ:
- Ức gà: basis `100g`, default entry `g`
- Trứng gà: basis `100g`, default entry `piece`, `grams_per_unit = 50`
- Sữa tươi: basis `100ml`, default entry `ml`

### 4.4 Seed Data là One-time Build, không Runtime

Seed data sinh **tại build time** (script), KHÔNG gọi external nutrition APIs/runtime.
- Script: `scripts/seed/build-vietnamese-core.ts` (Node, chạy manual khi cần refresh)
- Output:
  - `src/assets/seed/ingredients.json`
  - `src/assets/seed/dishes.json`
- App load: parse JSON khi DB fresh sau khi migration V1 hoàn tất

---

## 5. Task Breakdown

### 5.1 Migration Runner + V1 initial schema

**Files:**
- `src/app/core/services/database/migrations/V1_initial_schema.sql` — toàn bộ DDL từ `schema.ts`
- `src/app/core/services/database/migrations/index.ts` — `MIGRATION_REGISTRY: Migration[]`
- `src/app/core/services/database/migration-runner.ts` — runner class với `run(db)` method
- `src/app/core/services/database/web-database.service.ts` — update `initialize()` dùng MigrationRunner
- Retire `src/app/core/services/database/schema.ts` sau khi V1 migration được generate

**Unit tests:**
- `migration-runner.spec.ts`: fresh DB → V1 applied, db_version = 1; re-run → idempotent
- Integration (sql.js in-memory): run V1, verify 18 tables tồn tại

**Exit:** Fresh install → 18 tables created + `app_config.db_version = 1`. Re-run ionic serve → no duplicate errors. Seed loader chỉ chạy sau migration xong.

### 5.2 Vietnamese Core Seed Pipeline

**Seed strategy đã chốt:**
- Ship **20 món Việt curated**
  - `6` món sáng
  - `7` món trưa
  - `7` món tối
- Mỗi dish seed là **template mặc định `1 serving`**
- Không seed snack dishes
- Ingredient seed = tập nguyên liệu liên quan trực tiếp tới 20 món này
- External datasets chỉ dùng để **bootstrap/discovery**, không phải authority cuối cùng

**Danh sách 20 món đã chốt:**
- **Sáng (6):** Phở bò, Phở gà, Bún thịt nướng, Bánh mì ốp la, Cháo gà, Miến gà
- **Trưa (7):** Cơm gà luộc, Cơm thịt kho trứng, Cơm cá kho tộ, Cơm bò xào rau củ, Cơm tôm rim, Cơm đậu hũ sốt cà chua, Cơm thịt heo luộc rau luộc
- **Tối (7):** Bún chả, Cơm gà kho gừng, Cơm thịt heo nạc rang sả, Cơm canh chua cá, Cơm bò xào hành tây, Cơm tôm xào rau củ, Cơm đậu hũ thịt bằm

**Bootstrap references (tham khảo ban đầu):**
- TheMealDB: recipe/dish discovery + ingredient list gợi ý
- Open Food Facts: packaged-food aliases khi cần

**Nutrition authority đã chốt:**
- **USDA FoodData Central** là authority chính cho canonical macro ingredient-level
- Tên tiếng Việt, alias, meal grouping, và dish composition được curate thủ công ở local seed
- Khi USDA thiếu coverage/không match tốt với ingredient Việt, chỉ cho phép dùng nguồn phụ sau khi review thủ công và normalize về canonical rule ở §4.3
- TheMealDB và Open Food Facts không phải macro authority cuối cùng của Phase 1

**Curation rules:**
- Mỗi ingredient trong seed phải xuất hiện trong ít nhất 1 món seeded
- Chỉ cho phép orphan ingredient nếu là staple bắt buộc (ví dụ: nước mắm, muối, đường, dầu ăn, hành, tỏi)
- Ưu tiên bộ món chia sẻ ingredient nền để dataset gọn và usable ngay
- Với món có phần phức tạp như nước dùng / nước chấm / base canh, Phase 1 cho phép dùng **composite ingredient** đã curate sẵn (VD `Nước dùng phở`, `Nước chấm bún chả`, `Base canh chua`)
- Tất cả ingredient phải có:
  - `category`
  - canonical nutrition basis (`100g` hoặc `100ml`)
  - default entry unit (`g` / `ml` / `piece`)
  - conversion data nếu default unit là `piece`
- Mỗi dish seed phải có baseline ingredient list + amount cho `1 serving`; user sửa **trực tiếp** record seed gốc, không tạo bản copy ở Phase 1
- Composite ingredient vẫn phải tuân thủ canonical nutrition rule ở §4.3 và được quản lý như một ingredient bình thường trong DB

**Script:** `scripts/seed/build-vietnamese-core.ts`
- Input:
  - curated local source cho 20 món
  - curated local source cho ingredient nutrition + unit metadata, trong đó macro lấy USDA làm nguồn authority chính
- Output:
  - `src/assets/seed/ingredients.json`
  - `src/assets/seed/dishes.json`

**App load logic:**
- Sau migration V1: check `ingredient` và `dish`
- Nếu DB fresh:
  - load `ingredients.json` → bulk insert ingredients
  - load `dishes.json` → insert dishes (`servings = 1`) + dish_ingredient
- Nếu DB đã tồn tại:
  - **không overwrite** ingredient/dish seed mà user đã sửa
  - **không tự thêm lại** seed đã bị xóa hoặc seed mới phát sinh ở version sau
  - seed loader Phase 1 không được mutate record hiện có chỉ để đồng bộ lại seed artifact
- Mỗi ingredient/dish có UUID v4 ổn định trong seed artifact hoặc generate tại build step

**Exit:** App fresh install → Management tab hiển thị ingredient set liên quan tới 20 món Việt core và 20 dish seeds usable ngay dưới dạng `1 serving` templates.

### 5.3 Data Layer — Repositories

**Files:**
- `src/app/core/repositories/ingredient.repository.ts`
- `src/app/core/repositories/dish.repository.ts`
- `src/app/core/repositories/dish-ingredient.repository.ts`

**Interface mỗi repo:**
- `IngredientRepository`: `list(filter?)`, `getById(id)`, `insert(data)`, `update(id, data)`, `delete(id)`, `searchByName(q)`
- `DishRepository`: `list(filter?)`, `getById(id)`, `insert(data, ingredients[])` (transactional), `update(id, data, ingredients[])`, `delete(id)`, `countReferences(id)` (cho confirm dialog)
- `DishIngredientRepository`: `listByDish(dishId)`, `bulkInsert(dishId, items[])`, `deleteByDish(dishId)`

Note:
- Ingredient seed load từ artifact phải insert với `source = 'db'`
- Nếu `IngredientRepository.update` sửa một seeded ingredient hiện có (`source = 'db'`) thì record đó phải flip sang `source = 'manual'`
- Nếu `IngredientRepository.update` sửa một AI-lookup ingredient (`source = 'ai'`) thì record đó phải flip sang `source = 'manual'`
- `DishRepository.insert` phải transactional (dish + dish_ingredient cùng commit)
- Dish seed load từ artifact phải insert với `source = 'db'`
- Nếu `DishRepository.update` sửa một seeded dish hiện có (`source = 'db'`) thì record đó phải flip sang `source = 'custom'`
- `countReferences(dishId)` ở Phase 1 chủ yếu để support generic confirm + future-proof cho Phase 2
- **DishIngredient normalization:** `bulkInsert` phải tính `normalized_amount` + macro theo công thức ở `data-model.md §4.3`. REJECT input nếu `amount_unit = 'piece'` mà ingredient thiếu `grams_per_unit`/`ml_per_unit`

**Unit tests:** CRUD mỗi repo + transactional insert dish.

**Exit:** Unit tests green với sql.js in-memory.

### 5.4 Data Layer — Stores

**Files:**
- `src/app/core/stores/ingredient.store.ts`
- `src/app/core/stores/dish.store.ts`

**Interface:**
- `IngredientStore`: signals `ingredients()`, `loading()`, `searchQuery()`, actions `load()`, `add()`, `edit()`, `remove()`, `search(q)`
- `DishStore`: signals `dishes()`, `loading()`, actions `load()`, `addFromIngredients(data, items)`, `addQuick(data)`, `edit()`, `remove()`

Stores chỉ giữ list hiện tại + UI state. Source of truth = DB qua repos.

**Unit tests:** Mock repo, verify signal updates.

### 5.5 Shared Components

**Files:** `src/app/shared/components/`

| Component | Purpose | Used by Phase 1 |
|-----------|---------|-----------------|
| `<app-empty-state>` | Empty list placeholder | Ingredient list, Dish list |
| `<app-confirm-dialog>` | Generic confirm | Delete ingredient/dish |
| `<app-search-toolbar>` | Search input + filter chip | Ingredient list |
| `<app-nutrition-badge>` | Hiển thị calo + macro compact | Ingredient item, Dish item, edit preview |

Skip ở Phase 1 (để Phase 2+):
- `<app-macro-bar>` (bars lớn cho calendar/dashboard)
- `<app-offline-banner>` (cần network service, Phase 1.5)

### 5.6 UI Pages

**Files:** `src/app/features/management/`

```
management/
├── management.page.ts          (container với tabs: Nguyên liệu | Món ăn)
├── management.routes.ts
├── components/
│   ├── ingredient-list/
│   ├── ingredient-edit-modal/  (form + validation, no AI button visible trong Phase 1)
│   ├── dish-list/
│   └── dish-edit-modal/        (2 modes: ingredient-based | quick-add; no 🤖 button)
```

**Behavior:**
- Management page có segment control: "Nguyên liệu" | "Món ăn"
- List pages: search + sort; chỉ thêm virtualization nếu thực sự cần sau khi đo performance
- Edit modals: Ionic modal, submit → repo → store refresh
- **AI buttons (🤖) KHÔNG render trong Phase 1** (feature flag không cần, chỉ conditional rendering / TODO comment)

### 5.7 Tests

**Unit (Karma):**
- `migration-runner.spec.ts`
- `ingredient.repository.spec.ts`, `dish.repository.spec.ts`, `dish-ingredient.repository.spec.ts`
- `ingredient.store.spec.ts`, `dish.store.spec.ts`

**Manual QA checklist** (`docs/6-testing/phase-1-qa.md` — viết khi kết thúc Phase 1):
- [ ] Fresh install → ingredient seed + 20 dish seeds hiển thị đúng
- [ ] Thêm ingredient thủ công → list update
- [ ] Sửa ingredient → persist sau reload
- [ ] Xóa ingredient không dùng trong món → OK
- [ ] Xóa ingredient đang dùng trong món → confirm dialog hoặc RESTRICT error
- [ ] Ingredient có default unit `piece` (VD trứng) tính macro đúng qua conversion
- [ ] Tìm kiếm ingredient real-time
- [ ] Tạo dish ingredient-based → calo/macro tự tính đúng
- [ ] Tạo dish quick-add → data persist
- [ ] Sửa dish → ingredients update transactional
- [ ] Xóa dish → generic confirm dialog + không claim full planned_dish-aware UX
- [ ] Dark mode toggle → UI OK
- [ ] Restart app → data intact

---

## 6. Execution Order

```
1. Migration runner + V1 migration     (§5.1)  ← load-bearing, blocks §5.3+
   └─► Tests: migration-runner.spec.ts
2. Vietnamese core seed pipeline       (§5.2)  ← parallel with #3 sau khi #1 xong
   └─► ingredients.json + dishes.json committed
3. Repositories                        (§5.3)
   └─► Tests: *.repository.spec.ts
4. Stores                              (§5.4)
   └─► Tests: *.store.spec.ts
5. Shared components                   (§5.5)
6. Management page + list pages        (§5.6 - read only trước)
   └─► Verify seed data hiển thị
7. Edit modals (ingredient + dish)     (§5.6)
8. Manual QA checklist                 (§5.7)
9. Exit review
```

Commit discipline:
- Mỗi step = 1 PR/commit (conventional commits).
- Tests viết cùng code, không dồn cuối.

---

## 7. Exit Criteria

Phase 1 **DONE** khi **tất cả** items sau pass:

### Code
- [ ] Migration runner hoạt động (fresh install + re-run idempotent)
- [ ] V1 migration SQL match data-model.md §3-§7 (18 tables)
- [ ] 3 repositories implement đầy đủ interface §5.3
- [ ] 2 stores implement đầy đủ interface §5.4
- [ ] 4 shared components render + dark mode OK
- [ ] Management page + list + edit modals hoạt động

### Data
- [ ] `src/assets/seed/ingredients.json` + `src/assets/seed/dishes.json` committed
- [ ] Seed dataset có đúng 20 món Việt core (6 sáng / 7 trưa / 7 tối), không có snack
- [ ] Mọi seeded dish chỉ dùng ingredients đã tồn tại trong ingredient seed
- [ ] Ingredient canonical nutrition dùng `100g` hoặc `100ml`; `piece` chỉ là conversion unit
- [ ] Fresh install load seed thành công

### Tests
- [ ] Unit tests pass (`ng test --watch=false`): ≥60% coverage repos + stores
- [ ] Manual QA checklist (§5.7) pass 100%

### PRD acceptance
- [ ] F-01 acceptance 1, 2, 4 ✅ cho scope Phase 1 (item 3 AI Lookup → Phase 1.5)
- [ ] F-02 acceptance 1 (2/3 cách), 2, 3 ✅ cho scope Phase 1
- [ ] F-02 delete case chỉ đạt **partial** ở Phase 1; full planned_dish-aware behavior hoàn tất ở Phase 2

### Documentation
- [ ] `phase-1-management.md` (file này) updated với lessons learned (section mới "§8 Retro")
- [ ] ADR-002 migration strategy committed
- [ ] `docs/6-testing/phase-1-qa.md` QA checklist committed

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-18 | Initial Phase 1 plan — scope, PRD matrix, 7-task breakdown, exit criteria |
