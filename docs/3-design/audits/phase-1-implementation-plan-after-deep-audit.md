# Phase 1 Implementation Plan — Foundation after Onboarding/Database Audit

Ngày: 2026-04-26
Thứ tự yêu cầu user: làm bước 2 trước, rồi bước 1, sau đó bước 3
Diễn giải thực thi:
1. Audit sâu onboarding + database
2. Tạo implementation plan chi tiết
3. Bắt đầu implement lát cắt Phase 1 an toàn nhất

> For Hermes: follow TDD where production code changes behavior. Do not jump straight into management feature UI before stabilizing schema evolution and repository skeleton.

## 1. Kết luận bước 2 (audit sâu) — hoàn tất

### 1.1 Những gì đã xác thực từ implementation
- `onboarding.page.ts` thực hiện tính BMR/TDEE đúng theo PRD.
- `ProfileStore -> UserProfileRepository -> DatabaseService` hoạt động theo boundary tương đối sạch.
- `provideDatabaseService()` có startup order hợp lý: init DB -> migrate legacy native -> load profile.
- `legacy-sqljs-migrator.ts` chỉ import `user_profile`, có tính non-destructive.
- `schema.ts` vẫn đang ở model nutrition cũ (`default_entry_unit`, `grams_per_unit`, `amount_unit`).

### 1.2 Kết luận audit sâu
- Onboarding/database là vùng nền tảng tốt nhất hiện tại.
- Nhưng chưa có migration system thực thụ để chịu được đợt schema redesign lớn cho Phase 1 nutrition.
- `onboarding.page.ts` quá lớn; nên chỉ refactor tối thiểu nếu nó cản trở testability/maintainability.
- Rủi ro lớn nhất khi bắt đầu Phase 1 là sửa schema trực tiếp mà không dựng regression net + migration pattern trước.

## 2. Nguyên tắc triển khai từ đây

1. Không implement full CRUD UI ngay.
2. Phải dựng nền migration + test trước khi đổi schema nutrition.
3. Lát cắt đầu tiên phải nhỏ, an toàn, có thể verify độc lập.
4. Chỉ refactor onboarding/database khi hỗ trợ trực tiếp cho bước mở rộng Phase 1.
5. Tất cả thay đổi production behavior mới phải theo TDD.

## 3. Thứ tự ưu tiên thực hiện

### Priority A — Chuẩn bị nền an toàn cho schema evolution
Mục tiêu: biến database layer từ “DDL bootstrap” thành “có thể tiến hóa có kiểm soát”.

#### Task A1: Thêm test cho schema versioning baseline
**Files:**
- Create: `src/app/core/services/database/schema.spec.ts`
- Read/verify: `src/app/core/services/database/schema.ts`

**Việc làm:**
- Viết test xác nhận `SCHEMA_VERSION` hiện tại.
- Test `SCHEMA_DDL` có chứa các bảng/cấu trúc cốt lõi mong đợi.
- Test có `dish_with_totals` view.

**Lý do:**
- Tạo regression net trước khi đổi schema Phase 1.

#### Task A2: Thêm test cho startup orchestration
**Files:**
- Create: `src/app/core/services/database/database.provider.spec.ts`
- Read: `database.provider.ts`, `profile.store.ts`

**Việc làm:**
- Test `db.initialize()` chạy trước `profileStore.loadProfile()`.
- Test native path có attempt migration.
- Test migration timeout/failure không chặn app startup.

**Lý do:**
- Đây là boundary quan trọng nhưng hiện chưa có coverage.

#### Task A3: Thêm test cho `LegacySqlJsMigrator`
**Files:**
- Create: `src/app/core/services/database/legacy-sqljs-migrator.spec.ts`
- Read: `legacy-sqljs-migrator.ts`

**Việc làm:**
- Test no legacy key.
- Test native already populated.
- Test no profile in legacy.
- Test insert profile success.
- Test parse failure returns structured result.

**Lý do:**
- Giảm rủi ro regression khi sau này thay schema/profile boot logic.

### Priority B — Tách logic thuần khỏi onboarding để dễ mở rộng
Mục tiêu: giữ behavior cũ, tăng testability và chuẩn bị cho future profile-edit.

#### Task B1: Extract onboarding calculation utility
**Files:**
- Create: `src/app/features/onboarding/onboarding-calculation.ts`
- Create: `src/app/features/onboarding/onboarding-calculation.spec.ts`
- Modify: `src/app/features/onboarding/onboarding.page.ts`

**Việc làm:**
- Extract pure functions:
  - calculateBmr
  - calculateTdee
  - calculateTargetCalories
  - calculateTargetProtein
  - deriveFitnessLevelFromGymExperience
- Viết test RED/GREEN cho từng rule theo PRD.

**Lý do:**
- Loại business calculation ra khỏi page >1000 dòng.

#### Task B2: Extract validation utility
**Files:**
- Create: `src/app/features/onboarding/onboarding-validation.ts`
- Create: `src/app/features/onboarding/onboarding-validation.spec.ts`
- Modify: `onboarding.page.ts`

**Việc làm:**
- Tách `validateStep2a`, `validateStep2b` thành pure helpers.
- Giữ nguyên copy error hiện tại.

**Lý do:**
- Dễ test hơn, giảm coupling page ↔ rule.

#### Task B3: Giữ page mỏng hơn nhưng chưa chia component
**Files:**
- Modify: `onboarding.page.ts`

**Việc làm:**
- Chỉ thay call site sang utility mới.
- Không tách template thành subcomponent nếu chưa cần.

**Lý do:**
- Tránh refactor quá rộng trước Phase 1.

### Priority C — Bắt đầu Phase 1 bằng lát cắt an toàn nhất
Mục tiêu: chuẩn bị domain management thật, nhưng bắt đầu từ xương sống data/repository thay vì UI lớn.

#### Task C1: Thiết kế migration strategy cho nutrition schema mới
**Files:**
- Modify: `src/app/core/services/database/schema.ts`
- Possibly create: `src/app/core/services/database/migrations.ts`
- Create tests trước

**Việc làm:**
- Chuyển từ baseline `SCHEMA_VERSION = 1` sang pattern migration rõ ràng.
- Chưa cần hoàn tất full nutrition migration ngay nếu scope lớn.
- Ưu tiên tạo khung migration có thể nâng từ v1 lên v2 an toàn.

**Lý do:**
- Đây là prerequisite cho unit redesign thật.

#### Task C2: Tạo types/model skeleton cho Ingredient + Dish theo spec mới
**Files:**
- Create: `src/app/core/models/ingredient.model.ts`
- Create: `src/app/core/models/unit.model.ts`
- Create: `src/app/core/models/dish.model.ts`
- Create corresponding specs nếu logic kèm theo

**Việc làm:**
- Bám docs mới: `unit`, `ingredient_unit`, `unit_id`, `density_g_per_ml`.
- Chưa cần full UI.

**Lý do:**
- Tạo canonical TypeScript layer trước repository.

#### Task C3: Implement repository đầu tiên cho management
**Files:**
- Create: `src/app/core/repositories/ingredient.repository.ts`
- Create: `src/app/core/repositories/ingredient.repository.spec.ts`

**Scope tối thiểu:**
- list/search ingredients
- get by id
- create ingredient theo schema mới hoặc adapter tạm nếu migration chưa xong

**Lý do:**
- Đây là lát cắt Phase 1 an toàn nhất: data-first, ít UI risk, dễ test.

## 4. Thứ tự thực thi thực tế theo yêu cầu user

Vì user muốn “bắt đầu từ bước 2 đến bước 1 và sau đó là bước 3”, thứ tự thực thi sẽ là:

### Giai đoạn 2 — Audit sâu
- Hoàn tất file audit sâu onboarding/database
- Kết quả đã có đủ bằng chứng để chốt plan

### Giai đoạn 1 — Tạo plan chi tiết
- Tài liệu này chính là output của bước đó

### Giai đoạn 3 — Bắt đầu implement
Lát cắt đầu tiên được khuyến nghị:
1. `schema.spec.ts`
2. `database.provider.spec.ts`
3. `legacy-sqljs-migrator.spec.ts`
4. extract onboarding calculation utility + tests

Chưa bắt đầu bằng management page/UI.

## 5. Quy tắc không được vi phạm khi bắt đầu code

- Không sửa thẳng `schema.ts` sang model mới mà chưa có test/migration strategy.
- Không đụng đồng thời schema + repo + store + page trong một lần change lớn.
- Không code management UI trước khi có model/repository foundation.
- Không refactor onboarding vượt quá mức cần thiết cho testability.
- Không bỏ TDD cho utility/repository/migration behavior mới.

## 6. Recommendation cuối

Bước implement đầu tiên nên là:
- viết test cho `database.provider.ts`
- viết test cho `legacy-sqljs-migrator.ts`
- rồi extract `onboarding-calculation.ts` bằng TDD

Sau khi 3 bước này xanh, mới tiếp tục vào migration strategy và repository đầu tiên của Phase 1.
