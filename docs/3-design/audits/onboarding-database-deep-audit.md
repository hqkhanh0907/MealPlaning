# Onboarding + Database Deep Audit

Ngày: 2026-04-26
Phạm vi: `features/onboarding`, `core/services/database`, `core/repositories/user-profile`, `core/stores/profile`

## 1. Kết luận nhanh

Phần onboarding + database là phần mature nhất của codebase hiện tại. Tuy nhiên nó vẫn có 4 vấn đề chính:

1. `onboarding.page.ts` đang quá lớn và ôm quá nhiều trách nhiệm.
2. Test coverage tốt ở profile singleton semantics, nhưng còn mỏng ở startup orchestration và migration paths.
3. Database layer có chất lượng nền tảng tốt, nhưng migration/versioning mới chỉ ở mức baseline.
4. Một số rule/docs đã thay đổi mạnh ở nutrition domain, nhưng onboarding/database hiện chưa được tổ chức theo kiểu dễ mở rộng sang Phase 1 management.

## 2. Những gì đã verify là tốt

### 2.1 Onboarding flow
- Có 3 bước rõ ràng:
  - mục tiêu
  - thông tin cơ thể
  - mức hoạt động
- Có validation từng bước.
- Có focus/scroll handling cho accessibility.
- Có tính toán:
  - BMR theo Mifflin-St Jeor
  - TDEE từ `activity_factor`
  - `target_calories`
  - `target_protein`
- Có lưu profile thông qua `ProfileStore -> UserProfileRepository -> DatabaseService`.

### 2.2 Database startup flow
- `provideDatabaseService()` đã tổ chức startup theo thứ tự hợp lý:
  1. initialize database
  2. native-only legacy migration
  3. load profile into store
- Native DB init có anti-double-init thông qua `initPromise`.
- Có `PRAGMA foreign_keys = ON` ở cả web/native.
- Native cố gắng bật WAL, fail thì degrade gracefully.

### 2.3 Repository/store boundary
- `UserProfileRepository` có semantics singleton rõ.
- `ProfileStore` đơn giản, dễ hiểu và phù hợp current scope.
- Có test idempotent insert để tránh duplicate row khi onboarding bị re-run.

## 3. Root cause analysis cho các vấn đề đáng chú ý

### Vấn đề A — `onboarding.page.ts` quá lớn

#### Evidence
- File hơn 1000 dòng.
- Chứa cùng lúc:
  - template lớn
  - inline styles lớn
  - validation
  - BMR/TDEE calculation
  - navigation/focus management
  - save orchestration

#### Root cause
- Giai đoạn bootstrap ưu tiên ship nhanh mockup/UX flow trong 1 file.
- Chưa tách presentation logic khỏi domain calculation và persistence orchestration.

#### Risk
- Khó maintain khi onboarding cần thêm fields/override rules.
- Khó test logic tính toán độc lập.
- Build style budget đã vượt warning threshold.

### Vấn đề B — startup/migration orchestration test còn mỏng

#### Evidence
- Có test cho `UserProfileRepository` và `NativeDatabaseService`.
- Chưa thấy test cho:
  - `database.provider.ts`
  - timeout behavior của migration
  - migrate success/failure/no-legacy-key paths
  - web restore path từ localStorage

#### Root cause
- Test hiện tập trung vào unit rủi ro thấy ngay (singleton semantics, not-initialized error).
- Chưa đầu tư test cho orchestration boundary.

#### Risk
- Khi refactor startup order hoặc thêm domain bootstrapping mới, regression khó phát hiện sớm.

### Vấn đề C — schema versioning mới là baseline, chưa sẵn sàng cho nutrition delta lớn

#### Evidence
- `SCHEMA_VERSION = 1`
- `applyMigrations()` hiện chỉ stamp `PRAGMA user_version = 1`
- Chưa có migration branch thật cho schema delta tương lai.

#### Root cause
- Schema được dựng sớm để bootstrap app shell.
- Chưa đến lúc thực hiện evolution thật của DB structure.

#### Risk
- Khi sync schema mới cho unit redesign, migration complexity sẽ nhảy vọt.
- Nếu sửa thẳng DDL mà không làm migration strategy trước, native/web state dễ drift.

### Vấn đề D — onboarding tính đúng cho current profile scope nhưng chưa sẵn sàng cho override/use-case mở rộng

#### Evidence
- `target_carbs` và `target_fat` đang set `null` khi complete onboarding.
- Tính toán hiện nằm trực tiếp trong page component.
- PRD có nói user có thể override một số target.

#### Root cause
- Implementation mới tập trung vào initial-save path, chưa có edit/recalculate policy hoàn chỉnh.

#### Risk
- Sau này khi thêm settings/edit profile, logic tính lại mục tiêu dễ bị copy-paste hoặc drift.

## 4. So với docs hiện tại

### Phần khớp tốt
- Data model `user_profile` hiện tại nhìn chung khớp với docs onboarding/profile.
- BMR/TDEE formula khớp PRD.
- Activity factor mapping khớp docs.
- `fitness_level` được derive từ kinh nghiệm tập, hợp current design.

### Phần chưa hoàn toàn sẵn sàng cho tương lai
- Docs hiện mô tả product sâu hơn nhiều so với current implementation ở nutrition/management.
- Onboarding/database hiện chưa có abstraction utility đủ tốt để mở rộng an toàn sang các flow chỉnh mục tiêu sau này.

## 5. Đề xuất ưu tiên cho bước tiếp theo

### Ưu tiên 1 — không đổi behavior, tăng khả năng maintain
Tách onboarding theo 3 lớp:
1. presentation sections / subcomponents
2. pure calculation + validation helpers
3. save orchestration giữ ở page/store level

### Ưu tiên 2 — tăng test coverage tại boundary đúng chỗ
Thêm test cho:
- `database.provider.ts`
- `legacy-sqljs-migrator.ts`
- onboarding calculation helpers sau khi extract

### Ưu tiên 3 — chuẩn bị đất cho schema redesign lớn
Trước khi đụng nutrition schema Phase 1:
- chốt migration strategy pattern
- thêm test cho migration/versioning
- tránh sửa DDL kiểu one-shot không có regression net

## 6. Kết luận

Nếu phải chọn một khu vực đủ ổn để làm nền mở rộng tiếp, thì onboarding + database là khu vực đó.

Nhưng nếu bắt đầu implement Phase 1 mà bỏ qua việc chuẩn hóa một phần nhỏ ở đây, project sẽ nhanh chóng rơi vào:
- page components quá to
- domain logic bị copy-paste
- migration risk tăng mạnh khi schema nutrition đổi lớn

Vì vậy thứ tự hợp lý là:
1. audit sâu khu vực này
2. chốt plan thực hiện chi tiết
3. implement lát cắt Phase 1 đầu tiên theo TDD trên nền đã chuẩn hóa vừa đủ
