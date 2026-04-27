# Development Plan — HealthMate AI

**Version:** 1.0
**Date:** 2026-04-18
**Status:** Active

---

## 1. Mục tiêu tài liệu

Tài liệu này mô tả **kế hoạch phát triển theo giai đoạn** để đưa HealthMate AI từ state hiện tại (scaffold xong) đến release V1 với đủ 13 features.

**Triết lý:**

- Chia thành **7 phases** (1, 1.5, 2, 3, 4, 5, 6) — mỗi phase deliver **end-to-end functional slice** (user dùng được thêm 1 flow hoàn chỉnh sau mỗi phase)
- Không làm từng feature riêng lẻ vì nhiều features chia sẻ chung platform layer (DB repos, services, UI components) → làm chung tránh build-rebuild
- **Chỉ viết chi tiết cho phase tiếp theo** — phase 3-6 sẽ viết khi start (fake precision không có giá trị)

---

## 2. Current State — Phase 0 ✅ Complete

| Hạng mục | Status |
|---------|--------|
| Angular 21 + Ionic 8 + Capacitor 8 scaffold | ✅ |
| DB abstraction (DatabaseService + WebDatabaseService + sql.js) | ✅ |
| Schema DDL (18 tables từ data-model.md) | ✅ |
| Routing (4 tabs + Settings + Onboarding) | ✅ |
| Theme variables (light/dark) | ✅ |
| Onboarding flow (2 steps, BMR/TDEE calculation) | ✅ |
| Android platform added | ✅ |
| Code quality tooling (ESLint, Prettier, Husky, commitlint) | ✅ |

**Blocker hiện tại cho Phase 1:** Thiếu repositories, seed data, mockup màn hình Management.

---

## 3. Key Decisions (từ discussion)

| # | Vấn đề | Quyết định | Impact |
|---|--------|-----------|--------|
| D1 | Seed nutrition data | Curated **20 món Việt core** (6 sáng / 7 trưa / 7 tối) + ingredient set liên quan; external datasets chỉ dùng để bootstrap/discovery | Cần seed pipeline cho `ingredients.json` + `dishes.json`, không seed đồ ăn vặt |
| D2 | Seed exercise data | Scrape ExerciseDB/wger API + translate VN | Cần migration script + translate fields |
| D3 | Gemini API key | Dev key ship trong APK (obfuscated + quota limit trong code) | ADR cần document security trade-off |
| D4 | Photo storage (F-05) | Không lưu — AI analyze xong → discard ảnh | Đơn giản hóa Filesystem usage |
| D5 | Backup/Export | Hoãn V2 — V1 communicate rõ với user | Onboarding + Settings cần disclaimer |
| D6 | Schema migration | Version + sequential migrations (`db_version` field trong `app_config`) | Phase 1 cần setup migration system từ đầu |
| D7 | Testing | Full 4 levels: Unit + Component + E2E + Manual QA | Cần setup Karma (có sẵn) + Cypress/Playwright |
| D8 | Screen mockup | HTML mockup trước mỗi phase → chốt layout → code | Thêm 1 bước mockup trước khi code mỗi phase |

---

## 4. Feature Dependency Graph

```
              ┌─────────────────────────┐
              │   Platform Layer         │
              │   DB, Repos, Services    │
              └────────────┬────────────┘
                           │
    ┌──────────────────────┼───────────────────────┐
    │                      │                       │
    ▼                      ▼                       ▼
F-01 Nguyên liệu       F-08 Training Plan      F-13 Settings
    │                      │                   (semi-independent,
    ▼                      ▼                    notif liên quan F-03)
F-02 Món ăn            F-09 Workout Logger
    │                      │
    ▼                      ▼
F-03 Calendar          F-10 Progress Charts
    │                      │
    ▼                      │
F-04 Tracking             │
    │                      │
    └──────────┬───────────┘
               ▼
         F-12 Dashboard
         (đọc F-04 + F-09 + F-10)

AI features split 2 phases:
  Phase 1.5 (AI Foundation — infra + template F-01/F-02):
    F-01 AI Lookup   ─► Ingredient table (tra cứu dinh dưỡng)
    F-02 AI Autofill ─► Dish table (gợi ý nguyên liệu)

  Phase 2 (dùng lại infra):
    F-03 AI Meal Plan (Day + Week)

  Phase 5 (dùng lại infra + thêm Camera):
    F-05 AI Image    ─► F-02       (tạo món từ ảnh)
    F-06 AI Menu     ─► F-03       (gợi ý món)
    F-07 AI Insight  ─► F-04       (phân tích tracking)
    F-11 AI Training ─► F-08       (lên plan tập)
```

**Insight:**
- **F-01 + F-02** là foundation cho Nutrition cluster (F-03, F-04, F-06, F-07)
- **F-08 + F-09** là foundation cho Fitness cluster (F-10, F-11)
- **Dashboard (F-12)** là consumer — đọc data từ F-04 (nutrition) + F-09 (workout) + F-10 (progress). AI Insight Card render tạm placeholder, chỉ fill data thật sau Phase 5.
- **AI features** phụ thuộc vào data có sẵn → làm sau khi có F-01, F-02, F-03, F-08

---

## 5. 7 Phases Overview

| Phase | Tên | Features | Shared platform built | Deliverable |
|-------|-----|----------|----------------------|-------------|
| **1** | Management (CRUD) | F-01, F-02 (phần non-AI) | IngredientRepo, DishRepo, DishIngredientRepo, stores, migration system, seed data loader | User CRUD nguyên liệu + món ăn (ingredient-based + quick add, chưa có AI) |
| **1.5** | AI Foundation | F-01 AI Lookup + F-02 AI Auto-fill | GeminiService (HTTP, retry, error handling), prompt template executor, AI error UI | F-01/F-02 complete-done với AI; infra sẵn cho các AI features sau |
| **2** | Calendar & Tracking | F-03, F-04 | DayPlanRepo, MealSlotRepo, PlannedDishRepo, daily summary computation, AI Meal Plan templates (day+week, dùng Phase 1.5 infra) | User lên kế hoạch bữa ăn + track macro hàng ngày + AI meal plan |
| **3** | Dashboard | F-12 | Dashboard store, shared macro/progress components | User có màn tổng quan: nutrition + streak + weight |
| **4** | Fitness | F-08, F-09, F-10 | TrainingPlanRepo, WorkoutRepo, ExerciseRepo, chart component | User follow training plan + log workout + xem progress |
| **5** | AI Suite (remaining) | F-05, F-06, F-07, F-11 | Camera service, 5 prompt templates mới (Image, Menu Suggest, Daily Insight, Weekly Review, Training Plan) | 4 AI features còn lại hoạt động (kế thừa infra từ Phase 1.5) |
| **6** | Settings & Polish | F-13 | Notification service, theme service, profile editor | Full Settings + release prep (app icon, splash, Play Store assets) |

---

## 6. Per-phase Details

### Phase 1: Management — CRUD only (F-01 + F-02, non-AI)

**Features:**
- F-01 Quản lý Nguyên liệu: CRUD thủ công + curated ingredient seed liên kết trực tiếp với 20 món Việt core (chưa có AI Lookup)
- F-02 Quản lý Món ăn: CRUD 2/3 cách (ingredient-based + quick add; AI auto-fill để Phase 1.5) + ship sẵn 20 món Việt curated

**Shared platform built trong phase này:**
- Schema migration system (`db_version`, migration scripts)
- Seed data loader (`ingredients.json` + `dishes.json`)
- IngredientRepository, DishRepository, DishIngredientRepository
- IngredientStore, DishStore (Angular Signals)
- Shared components: `<app-nutrition-badge>`, `<app-search-toolbar>`, `<app-empty-state>`, `<app-confirm-dialog>`
- Testing setup: Karma config verify + Cypress/Playwright chọn & setup

**Deliverable:** User mở Management tab → thấy ingredient set gắn với 20 món Việt core (6 sáng / 7 trưa / 7 tối) → CRUD được → tạo/sửa món ăn từ ingredients (thủ công + quick add).

**Detail doc:** `phase-1-management.md` (đã viết, tiếp tục refine trước khi start code)

---

### Phase 1.5: AI Foundation (F-01 AI Lookup + F-02 AI Auto-fill)

**Features:**
- F-01 AI Lookup: Nhập tên nguyên liệu → AI tra cứu dinh dưỡng → user confirm
- F-02 AI Auto-fill: Nhập tên món → AI gợi ý nguyên liệu + khối lượng → user confirm

**Shared platform built trong phase này:**
- **GeminiService (core)**: HTTP client, retry logic, error handling, JSON parsing, `ai_chat_log` integration, internal quota limit (theo D3)
- **NutritionAiService**: 2 methods `lookupIngredient(name)`, `autofillDish(name, dbIngredients)`
- **2 prompt templates**: §3.2 Dish Auto-fill + §3.9 Ingredient Lookup
- AI error UI: `<app-ai-offline-banner>`, toast messages cho các error types (§5.1)
- Obfuscation build step cho dev API key (D3)

**Deliverable:** F-01/F-02 PRD complete-done — user có thể dùng AI để lookup/autofill. Infra sẵn để Phase 2/5 plug templates mới mà không build lại.

**Detail doc:** `phase-1.5-ai-foundation.md` (sẽ viết khi bắt đầu Phase 1.5)

---

### Phase 2: Calendar & Tracking (F-03 + F-04)

**Dependencies:** Phase 1 (dish data cần có trong DB để thêm vào bữa + làm input cho AI Meal Plan templates) + Phase 1.5 (GeminiService infra).

**Features:**
- F-03 Calendar & Meal Planning: Lịch tuần/ngày, thêm món vào bữa, AI lên plan ngày/tuần
- F-04 Nutrition Tracking: Tổng calo/macro hàng ngày

**Shared platform built trong phase này:**
- DayPlanRepository, MealSlotRepository, PlannedDishRepository
- DayPlanStore (reactive signals cho selected date)
- Daily summary computation (SQL aggregate queries)
- **AI Meal Plan templates**: §3.4 Plan Day + §3.5 Plan Week (plug vào NutritionAiService từ Phase 1.5)
- Shared components: `<app-macro-bar>`, `<app-day-selector>`

**Deliverable:** User chọn ngày → thêm món ăn vào bữa sáng/trưa/tối → thấy tổng calo/macro ngày đó vs target → dùng được AI Meal Plan.

---

### Phase 3: Dashboard (F-12)

**Features:**
- F-12 Dashboard: Feed card stack — 5 cards theo PRD F-12:
  1. **AI Insight Card** — placeholder hard-coded tĩnh (data thật sẽ fill ở Phase 5 sau khi có F-07 Daily Insight template — GeminiService đã có từ Phase 1.5)
  2. **Nutrition Card** — data thật từ Phase 2 (calo + protein progress bars)
  3. **Workout Card** — placeholder "Chưa có lịch tập" (data thật fill ở Phase 4)
  4. **Streak + Weight Card** — data thật (streak từ F-04, weight từ weight_log)
  5. **Quick Actions** — 4 nút (2 nút dẫn đến feature đã có, 2 nút dẫn đến placeholder route)

**Shared platform built trong phase này:**
- DashboardStore (aggregate data từ các stores khác)
- WeightLogRepository + StreakLogRepository
- Shared components: `<app-streak-card>`, `<app-weight-card>`, `<app-quick-actions>`

**Deliverable:** Dashboard hiển thị đúng 5 cards với data thật cho Nutrition + Streak+Weight, placeholder cho AI Card và Workout Card.

---

### Phase 4: Fitness (F-08 + F-09 + F-10)

**Features:**
- F-08 Training Plan System (chọn PPL/Upper-Lower/Full Body)
- F-09 Workout Logger (set/rep/weight, guided + free mode)
- F-10 Progress Charts (weight, strength, volume)

**Shared platform built trong phase này:**
- ExerciseRepository (seed từ ExerciseDB/wger)
- TrainingPlanRepository, WorkoutSessionRepository, WorkoutSetRepository
- Chart component (Chart.js hoặc ng2-charts)
- Rest timer component

**Deliverable:** User chọn PPL → xem lịch tập → vào gym log set/rep → xem chart progress.

---

### Phase 5: AI Suite — Remaining (F-05 + F-06 + F-07 + F-11)

**Features:**
- F-05 AI Image Analysis (chụp ảnh → Gemini Vision)
- F-06 AI Menu Suggestions
- F-07 AI Daily Insights
- F-11 AI Training Plan

**Shared platform built trong phase này (kế thừa GeminiService từ Phase 1.5):**
- Camera service wrapper (Capacitor Camera) — mới
- **5 prompt templates mới**: §3.1 Image Analysis, §3.3 Menu Suggest, §3.6 Daily Insight, §3.7 Weekly Review, §3.8 Training Plan
- FitnessAiService, InsightAiService (plug vào GeminiService core)
- AI Insight Card trên Dashboard nay fill data thật (thay placeholder từ Phase 3)

**Deliverable:** 4 AI features còn lại hoạt động online. Tổng cộng 7 features có AI + 9 prompt templates.

---

### Phase 6: Settings & Polish (F-13 + Release)

**Features:**
- F-13 Settings: Profile editor, Goal settings, Notification toggles, Theme picker, About
- Release prep: App icon, splash screen, Play Store assets, Android signing, CI workflow

**Shared platform built trong phase này:**
- NotificationService (Capacitor LocalNotifications)
- Theme toggle persistence (already partial in schema)
- About screen

**Deliverable:** APK signed + upload Play Store internal testing.

---

## 7. Cross-cutting Concerns

### 7.1 Testing (áp dụng mọi phase)

| Level | Tool | Scope | Coverage target |
|-------|------|-------|-----------------|
| Unit | Karma + Jasmine | DatabaseService, repositories, stores, pure utils | ~70% |
| Component | Karma + Jasmine | Page components với mocked stores | Critical paths |
| E2E | Cypress hoặc Playwright | Full flows (onboarding → add dish → calendar) | Happy paths + 1-2 error paths |
| Manual QA | Checklist markdown | Pre-release smoke test | Per phase acceptance |

Mỗi phase start phải extend test suite trước khi ship.

### 7.2 Git workflow

- Branch per phase: `phase-1-management`, `phase-2-calendar`, ...
- Mỗi feature trong phase: sub-branch `phase-1/f-01-ingredient`
- PR review (self-review nếu solo) trước khi merge vào main
- Conventional commits (đã enforce qua commitlint)

### 7.3 Documentation per phase

Trước khi start mỗi phase, viết:
1. `phase-X-<name>.md` — chi tiết thực hiện
2. HTML mockup trong `docs/3-design/mockups/` cho các screen mới
3. Update `development-plan.md` nếu có deviation

Sau khi end phase:
1. Update CLAUDE.md nếu có convention mới
2. Viết ADR nếu có quyết định kiến trúc lớn (`docs/6-decisions/ADR-00X.md`)

### 7.4 Database migration discipline

- Phase 1 sẽ introduce `V1_initial_schema.sql`; sau đó mọi thay đổi schema đều đi qua migration mới
- Mỗi migration = 1 file: `migrations/V{version}_{description}.sql` (theo data-model.md §10)
- Ví dụ: `V1_initial_schema.sql`, `V2_add_fiber_column.sql`
- `db_version` key trong `app_config` table, tăng monotonic

---

## 8. Open Items (chưa chốt, sẽ decide khi cần)

| # | Item | Khi nào cần quyết |
|---|------|-------------------|
| O1 | Chart library (Chart.js vs ng2-charts vs D3) | Phase 4 start |
| O2 | E2E tool (Cypress vs Playwright) | Phase 1 (khi setup testing) |
| O3 | Gemini model version (2.0-flash vs 2.5-pro) | Phase 5 start |
| O4 | App icon + splash screen design | Phase 6 |
| O5 | Play Store listing (mô tả, screenshots, categories) | Phase 6 |
| O6 | Analytics (Firebase, Plausible, không có) | Phase 6 |

---

## 9. Document Map

| Doc | Status | Khi cần |
|-----|:------:|---------|
| `5-development/development-plan.md` (file này) | ✅ Active | — |
| `5-development/phase-1-management.md` | ✅ Active | — |
| `5-development/phase-1.5-ai-foundation.md` | ⏳ Chưa viết | Trước khi start Phase 1.5 |
| `5-development/phase-2-calendar.md` | ⏳ Chưa viết | Trước khi start Phase 2 |
| `5-development/phase-3-dashboard.md` | ⏳ Chưa viết | Trước khi start Phase 3 |
| `5-development/phase-4-fitness.md` | ⏳ Chưa viết | Trước khi start Phase 4 |
| `5-development/phase-5-ai-suite.md` | ⏳ Chưa viết | Trước khi start Phase 5 |
| `5-development/phase-6-settings-polish.md` | ⏳ Chưa viết | Trước khi start Phase 6 |
| `6-testing/testing-strategy.md` | ⏳ Chưa viết | Trước Phase 1 (setup Karma + E2E) |
| `6-decisions/ADR-001-ai-key-strategy.md` | ⏳ Chưa viết | Trước Phase 1.5 (obfuscation setup) |
| `6-decisions/ADR-002-migration-strategy.md` | ⏳ Chưa viết | Phase 1 |
| `3-design/mockups/phase-1-*.html` | ⏳ Chưa viết | Trước Phase 1 code |

**Missing artifacts hiện tại:** `phase-1-management.md` đã tồn tại; các docs ⏳ còn lại sẽ viết khi tới phase tương ứng theo triết lý "only write detail for next phase".

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-18 | Initial development plan — 6 phases, decisions D1-D8 |
| 1.1 | 2026-04-18 | Audit round 1-2 fixes: dependency graph, Phase 3 card spec, migration naming sync với data-model.md, DishIngredientRepo typo, Document Map status tags |
| 1.2 | 2026-04-18 | Audit round 3: **thêm Phase 1.5 "AI Foundation"** — tách GeminiService ra khỏi Phase 5 để F-01/F-02 PRD complete-done. 6 phases → 7 phases. Update Phase 1/2/5 scope accordingly. |
| 1.3 | 2026-04-18 | Audit round 4: Phase 5 template count 4→5 (thêm Weekly Review), ADR-001 gating Phase 1.5 (thay Phase 5), Phase 2 explicit dependency note, Phase 3 Dashboard rationale clarify |
