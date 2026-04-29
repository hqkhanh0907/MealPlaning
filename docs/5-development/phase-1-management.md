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
| **F-01** Thư viện Nguyên liệu | Supporting library: tìm kiếm, xem/sửa/xóa có kiểm soát + curated ingredient seed phục vụ trực tiếp cho flow tạo món |
| **F-02** Quản lý Món ăn | Flow chính của Quản lý: ingredient-based dish CRUD + contextual ingredient quick-create khi thiếu nguyên liệu + ship sẵn 20 món Việt curated (6 sáng / 7 trưa / 7 tối) |

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
| 1 | Tạo món bằng 2 cách (Ingredient-based / AI Auto-fill) | 1/2 (Ingredient-based) | 2/2 (AI Auto-fill) | §5.6 |
| 2 | Dinh dưỡng tự tính đúng từ nguyên liệu × khối lượng | ✅ | — | §5.3 `dish_ingredient` logic |
| 3 | AI Auto-fill lưu dish + dish_ingredient sau khi user confirm (xem RULE-DISH-TOTAL) | — | ✅ | §5.6 AI flow |
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
- [ ] **ADR-002** (migration strategy) viết + commit — xem §4.1
- [x] **Danh sách 20 món Việt core** được chốt (6 sáng / 7 trưa / 7 tối) — xem §5.2
- [x] **Nguồn nutrition authority** cho ingredient canonical values được xác nhận (§5.2) — USDA làm authority chính cho macro ingredient-level

Các hạng mục có thể **defer** sang Phase 1.5/2:

- E2E tool decision (O2) — chỉ cần chốt khi bắt đầu viết E2E tests

---

## 4.0 Management UX Principle

Source-doc guardrails:
- Product Vision: AI-first, không form-first; interaction hằng ngày nên hướng tới <10 giây; beginner thấy đơn giản, pro vẫn có data chi tiết; local-first, chỉ gọi Gemini khi user chủ động dùng AI.
- PRD Core Nutrition: F-01 là supporting ingredient library; F-02 là primary dish flow; ingredient nutrition canonical chỉ theo `100g/100ml`; dish total luôn derived từ `dish_with_totals`; Quick Add/manual total không thuộc V1.

- `Quản lý` phải là **Món ăn-first**: user vào tab này để tạo/sửa món ăn, xem calories/macro món và dùng món trong lịch ăn.
- `Thư viện nguyên liệu` là supporting library/master data. Không xóa bỏ vì ingredient vẫn là source of truth cho nutrition/unit conversion, nhưng không đặt làm entry mặc định.
- Khi tạo/sửa món và thiếu nguyên liệu, UI phải cho tạo nhanh nguyên liệu trong ngữ cảnh món với CTA `Lưu và thêm vào món`.
- Tap nguyên liệu trong thư viện phải đi qua detail/read-only trước khi sửa để user thấy nutrition, unit và món đang dùng. CTA `Sửa thông tin` mới mở form sửa.
- V1 `Sửa nguyên liệu` là sửa global. Nếu ingredient đang được dùng trong món, UI phải cảnh báo impact trước khi sửa/lưu vì `dish_with_totals` derive totals từ ingredient hiện tại.

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
- Mỗi ingredient chỉ có đúng 1 nutrition basis authoritative (`100g` hoặc `100ml`)
- Phase 1 support unit registry với 2 nhóm:
  - Global units: `g`, `kg`, `ml`, `l`, `tbsp`, `tsp`, `cup`
  - Ingredient-specific / cooking units: `piece`, `clove`, `bunch`, `slice`, `pinch`, ...
- Unit ước lượng được phép trong Phase 1 nếu có factor rõ ràng:
  - UI phải hiển thị `≈` hoặc nhãn `ước lượng`
- Nếu unit khác dimension với basis:
  - ưu tiên `ingredient_unit.factor_to_basis`
  - nếu không có thì dùng `density_g_per_ml`
  - nếu vẫn không có thì reject

**Hệ quả cho implementation:**
- Không cho mỗi ingredient có một nutrition basis riêng kiểu `per_egg`, `per_tbsp`, `per_bowl`
- UI có thể cho user nhập nhiều unit thân thiện, nhưng data layer phải normalize sang canonical basis (`g` hoặc `ml`) trước khi tính macro
- Ingredient metadata cần lưu:
  - `category`
  - `nutrition_basis_unit`
  - `nutrition_basis_quantity` (=100)
  - `density_g_per_ml?`
- Unit metadata được tách khỏi ingredient:
  - `unit`
  - `ingredient_unit[]`
  - `is_default`
  - `display_label`
  - `factor_to_basis`

Ví dụ:
- Ức gà: basis `100g`, allowed units `g`, `kg`
- Trứng gà: basis `100g`, default unit `piece/quả`, `factor_to_basis = 50`
- Sữa tươi: basis `100ml`, allowed units `ml`, `l`, `cup`
- Dầu olive: basis có thể là `100ml` hoặc `100g` tùy nguồn authority; nếu user nhập unit khác dimension với basis thì phải có curated factor hoặc `density_g_per_ml`

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

> **Revision history:** v1 (2026-04-18) ship 20 món + USDA. v2 (2026-04-26) **skip USDA**, dùng nguồn VN; tách build pipeline thành 4 step; composite = nested recipe; thêm `seed_artifact` table cho idempotency; seed dishes ship `is_favorite=false`. Quyết định v2 chốt qua discussion 5 câu hỏi với user. Full draft + acceptance criteria: `docs/5-development/_drafts/phase-1-section-5.2-update.md`.

**Seed strategy đã chốt:**
- Ship **20 món Việt curated**
  - `6` món sáng
  - `7` món trưa
  - `7` món tối
- Mỗi dish seed là **template mặc định `1 serving`**, `is_favorite = false`
- Không seed snack dishes
- Ingredient seed = tập nguyên liệu cover 20 món + Vietnamese kitchen staples (nước mắm, muối, đường, dầu ăn, hành tím, hành lá, tỏi, gừng, sả, ớt, tiêu, bột ngọt) — **không giới hạn count**, emerge từ recipes
- Pipeline **fully offline** — không network, không API key, không `.cache/`

**Danh sách 20 món đã chốt:**
- **Sáng (6):** Phở bò, Phở gà, Bún thịt nướng, Bánh mì ốp la, Cháo gà, Miến gà
- **Trưa (7):** Cơm gà luộc, Cơm thịt kho trứng, Cơm cá kho tộ, Cơm bò xào rau củ, Cơm tôm rim, Cơm đậu hũ sốt cà chua, Cơm thịt heo luộc rau luộc
- **Tối (7):** Bún chả, Cơm gà kho gừng, Cơm thịt heo nạc rang sả, Cơm canh chua cá, Cơm bò xào hành tây, Cơm tôm xào rau củ, Cơm đậu hũ thịt bằm

**Nutrition authority đã chốt (v2):**
- Authority chính = **"Bảng thành phần dinh dưỡng thực phẩm Việt Nam"** (Viện Dinh Dưỡng, ấn bản 2017+)
- Fallback = **Wikipedia VI** + manual curation (yêu cầu `notes` giải thích)
- Citations committed vào `scripts/seed/curated/sources/{vien-dinh-duong.md, wikipedia-vi.md}` — mỗi ingredient phải có `source_citation` trỏ tới row/page/URL cụ thể
- USDA FDC, TheMealDB, Open Food Facts **không** dùng trong Phase 1 (deferred)

**Curation rules:**
- Mỗi atomic ingredient trong seed phải xuất hiện trong ≥1 món seeded HOẶC nằm trong staple whitelist
- Composite ingredients (`Nước dùng phở`, `Nước chấm bún chả`, `Base canh chua`, `Nước chấm gỏi cuốn`, ...) = **nested recipe**, macro derived bằng cách sum components × quantity tại build time, lưu vào DB như ingredient thường (`category='composite'`)
- Cấm composite chứa composite (V1 chỉ 1 tầng nesting)
- Tất cả ingredient phải có:
  - `category`
  - canonical nutrition basis (`100g` hoặc `100ml`)
  - ít nhất 1 unit hợp lệ trong `ingredient_unit`
  - đúng 1 default unit
  - factor conversion rõ ràng cho các unit không cùng dimension với basis, hoặc `density_g_per_ml` nếu dùng fallback
  - marker `is_approximate` cho unit ước lượng nếu có
  - `source_citation` non-empty
- Mỗi dish seed phải có:
  - `meal_tag` set (`breakfast`/`lunch`/`dinner`) — V4 column, build script reject nếu null
  - `is_favorite = false` — không default favorite cho seed
  - baseline ingredient list + amount cho `1 serving`
  - user sửa **trực tiếp** record seed gốc (không clone)

**Build pipeline (4 Node scripts, 1 npm command `npm run seed:build`):**
```
scripts/seed/
├── build-ingredients.ts      ← Step 1: emit ingredients.json từ vi-ingredients.ts
├── build-composites.ts       ← Step 2: nested-recipe sum → composites.json
├── build-dishes.ts           ← Step 3: emit dishes.json (20 dishes, 6/7/7)
├── validate-seed.ts          ← Step 4: cross-ref + schema + distribution check
└── curated/
    ├── vi-ingredients.ts     ← atomic (UUID + macro per 100g/ml + citation)
    ├── vi-composites.ts      ← composite recipes (UUID + components[])
    ├── vi-dishes.ts          ← 20 dishes (UUID + meal_tag + ingredients[])
    └── sources/{vien-dinh-duong.md, wikipedia-vi.md}
```
- Output: `src/assets/seed/{ingredients.json, composites.json, dishes.json}`
- Determinism: re-run produces byte-identical JSON; CI runs `git diff --exit-code`
- 15 acceptance criteria (AC1–AC15) liệt kê đầy đủ trong draft v2

**App load logic (SeedLoaderService + V5 migration):**
- V5 thêm table `seed_artifact (artifact_id PK, artifact_type, seed_version, inserted_at, fingerprint_hash)` + index `idx_seed_artifact_type`
- Loader algorithm:
  1. Đọc `ingredients.json` + `composites.json` + `dishes.json`
  2. Mỗi record: nếu `seed_artifact.artifact_id` đã tồn tại → SKIP; ngược lại INSERT vào `ingredient`/`dish` + INSERT tracker (transactional)
  3. **Không UPDATE** record hiện có
- Properties đảm bảo: fresh install → seed đầy đủ; user xóa Phở bò → tracker giữ UUID → loader không re-add; Phase 1.5 ship seed mới → chỉ UUID mới được insert; user sửa Cà chua → loader skip giữ edit; `pm clear` reset hết → behave như fresh install
- Composites flow vào table `ingredient` chung (UI thấy "Nước dùng phở" như 1 ingredient)
- Mỗi UUID v4 frozen trong `vi-*.ts` (không regenerate giữa các build)

**Execution sub-steps (cho §6):**
```
5.2.1  Curated scaffolding (vi-{ingredients,composites,dishes}.ts + sources/)
5.2.2  build-ingredients.ts + AC1–AC5 tests
5.2.3  build-composites.ts (nested-recipe sum) + AC6–AC9 tests
5.2.4  build-dishes.ts + validate-seed.ts + AC10–AC15 tests
5.2.5  V5 migration: seed_artifact table
5.2.6  SeedLoaderService + unit tests (idempotency, fresh, re-run, post-delete)
5.2.7  App bootstrap integration (gọi loader sau migration)
5.2.8  Emulator smoke test: fresh install → Quản lý tab show 20 dish + ingredients
```

**Exit:** App fresh install → Management tab hiển thị ingredient set (atomic + composite) liên quan tới 20 món Việt core, 20 dish seeds usable ngay dưới dạng `1 serving` templates với `meal_tag` đúng phân bố 6/7/7 và `is_favorite=false`. Re-run loader trên DB đã có data → 0 mutation.

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
- **DishIngredient normalization:** `bulkInsert` phải gọi resolver thống nhất để tính `normalized_amount` theo công thức ở `data-model.md §4.3`. Thứ tự ưu tiên: `ingredient_unit.factor_to_basis` → `density_g_per_ml` → reject. Không được silent convert giữa `g` và `ml`. Unit ước lượng vẫn được phép nhưng phải giữ marker hiển thị rõ ở UI

**Unit tests:** CRUD mỗi repo + transactional insert dish.

**Exit:** Unit tests green với sql.js in-memory.

### 5.4 Data Layer — Stores

**Files:**
- `src/app/core/stores/ingredient.store.ts`
- `src/app/core/stores/dish.store.ts`

**Interface:**
- `IngredientStore`: signals `ingredients()`, `loading()`, `searchQuery()`, actions `load()`, `add()`, `edit()`, `remove()`, `search(q)`
- `DishStore`: signals `dishes()`, `loading()`, actions `load()`, `addFromIngredients(data, items)`, `addFromAiAutofill(data, items)`, `edit()`, `remove()` — không có action nhập nhanh/manual total trong V1

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
├── management.page.ts          (container với tabs: Món ăn | Thư viện nguyên liệu)
├── management.routes.ts
├── components/
│   ├── ingredient-list/
│   ├── ingredient-edit-modal/  (form + validation, no AI button visible trong Phase 1)
│   ├── dish-list/
│   └── dish-edit-modal/        (ingredient-based; AI auto-fill entry uses ingredient rows, never manual total)
```

**Behavior:**
- Management page có segment control: "Món ăn" | "Thư viện nguyên liệu"; default active tab là "Món ăn"
- List pages: search + sort; chỉ thêm virtualization nếu thực sự cần sau khi đo performance
- Edit/detail: Thư viện nguyên liệu dùng detail-first; tap card → detail/read-only → `Sửa thông tin` → impact warning nếu đang dùng trong món → edit form → repo → store refresh
- **AI Auto-fill is PRD V1 scope**, but it must still return/confirm `ingredients[]`; do not reintroduce Quick Add/manual total. If a runtime milestone defers Gemini wiring, mark the AI CTA as deferred/disabled explicitly rather than replacing it with manual total entry.

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
- [ ] Ingredient có unit ingredient-specific (VD trứng = `piece/quả`) tính macro đúng qua conversion
- [ ] Unit ước lượng (VD `pinch`) hiển thị `≈` / `ước lượng` đúng và vẫn tính vào macro
- [ ] Cross-dimension conversion dùng đúng thứ tự: curated factor → density → reject
- [ ] Tìm kiếm ingredient real-time
- [ ] Tạo dish ingredient-based → calo/macro tự tính đúng
- [ ] Tạo dish AI auto-fill → user confirms ingredient rows → data persist; no manual total fields
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
   ├─► 5.2.1 curated scaffolding (vi-{ingredients,composites,dishes}.ts + sources/)
   ├─► 5.2.2 build-ingredients.ts                    (AC1–AC5)
   ├─► 5.2.3 build-composites.ts                     (AC6–AC9)
   ├─► 5.2.4 build-dishes.ts + validate-seed.ts      (AC10–AC15)
   ├─► 5.2.5 V5 migration: seed_artifact table
   ├─► 5.2.6 SeedLoaderService + unit tests
   ├─► 5.2.7 App bootstrap integration
   └─► 5.2.8 Emulator smoke test
        Output: src/assets/seed/{ingredients,composites,dishes}.json committed
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
| 1.1 | 2026-04-26 | §5.2 v2: skip USDA, dùng nguồn VN (Viện Dinh Dưỡng + Wikipedia VI); split build pipeline thành 4 step (ingredients/composites/dishes/validate); composite = nested recipe sum tại build time; thêm `seed_artifact` table (V5) + SeedLoaderService idempotency; seed dishes ship `is_favorite=false`; §6 thêm 8 sub-step 5.2.1–5.2.8. Quyết định chốt qua discussion 5 câu hỏi với user. Full draft: `_drafts/phase-1-section-5.2-update.md`. |
