# Current Implementation Audit vs Docs/Mockups

Ngày audit: 2026-04-26
Người thực hiện: Principal Software Architect / Technical Auditor (AI)
Phạm vi: `src/`, config build/test/lint, CI, database layer, onboarding flow, feature shells
Branch: `main`
Thời gian xác thực: Sun Apr 26 08:33:15 +07 2026

## 1. Executive Summary

Implementation hiện tại mới hoàn thành tốt phần nền tảng kỹ thuật của app, chưa bám được phần lớn phạm vi chức năng đã mô tả trong docs và mockup Phase 1.

Những gì đã được triển khai thật và có bằng chứng rõ ràng:
- App shell Angular 20 + Ionic 8 + Capacitor bootstrap ổn định.
- Routing tổng thể + tab shell đã có.
- Onboarding flow khá hoàn chỉnh, có validation, tính toán chỉ số và lưu profile.
- Database abstraction đa nền tảng đã có:
  - `WebDatabaseService` dùng sql.js
  - `NativeDatabaseService` dùng `@capacitor-community/sqlite`
- Có migration một chiều từ legacy sql.js localStorage sang native SQLite cho `user_profile`.
- Test unit hiện có đều pass.
- Build và lint chạy được; format check đang fail.

Những gì chưa được triển khai tương xứng với docs/mockup:
- Toàn bộ domain nutrition Phase 1 gần như mới dừng ở schema, chưa có repository/store/service/UI tương ứng.
- Các module list/edit ingredient/dish trong mockup chưa tồn tại trong `src/app/features/management`.
- Các domain calendar, dashboard, fitness, settings hiện chủ yếu là placeholder “Coming soon”.
- Schema implementation đang drift đáng kể so với docs mới nhất về unit redesign.

Kết luận ngắn:
- Project hiện là một scaffold có nền tảng data/app shell tốt cho Phase 0 + onboarding.
- Chưa thể xem là implementation của Phase 1 CRUD Management theo docs hiện tại.
- Rủi ro lớn nhất là docs/mockup/spec đã đi trước code khá xa, đặc biệt ở layer nutrition/unit model.

## 2. Phương pháp audit và evidence

Audit này dựa trên:
- Đọc trực tiếp config, source code và file test trong repo.
- Chạy lệnh thật để xác minh workflow:
  - `npm run lint`
  - `npm run format:check`
  - `npm run build`
  - `npx ng test --watch=false --browsers=ChromeHeadless`
- Đối chiếu implementation với:
  - `CLAUDE.md`
  - `docs/2-requirements/prd.md`
  - `docs/3-design/data-model.md`
  - `docs/4-architecture/business-rules.md`
  - mockup Phase 1 đã sync

Nguyên tắc kết luận:
- Ưu tiên implementation thực tế khi nói về current state.
- Nếu docs và code mâu thuẫn, ghi rõ drift thay vì suy đoán.

## 3. Project Understanding từ implementation thực tế

### 3.1 Những module đang thực sự tồn tại
Từ `src/app`, code hiện có 30 file TypeScript chính, tập trung vào 4 cụm:

1. App shell
- `app.component.ts`
- `app.routes.ts`
- `tabs/tabs.page.ts`
- `tabs/tabs.routes.ts`

2. Database core
- `database.service.ts`
- `database.provider.ts`
- `web-database.service.ts`
- `native-database.service.ts`
- `legacy-sqljs-migrator.ts`
- `schema.ts`

3. User profile / onboarding
- `user-profile.model.ts`
- `user-profile.repository.ts`
- `profile.store.ts`
- `onboarding.guard.ts`
- `features/onboarding/onboarding.page.ts`

4. Shared component nền móng
- `shared/components/bottom-sheet-picker/*`

### 3.2 Những module đang chỉ là shell/placeholder
- `features/dashboard/dashboard.page.ts`
- `features/calendar/calendar.page.ts`
- `features/management/management.page.ts`
- `features/fitness/fitness.page.ts`
- `features/settings/settings.page.ts`

Tất cả các màn trên đều đang hiển thị nội dung kiểu:
- `Dashboard — Coming soon`
- `Calendar — Coming soon`
- `Management — Coming soon`
- `Fitness — Coming soon`
- `Settings — Coming soon`

### 3.3 Kết luận domain hiện thực
Nếu chỉ nhìn implementation, app hiện tại thực chất là:
- onboarding + persistence profile
- app shell có 4 tab + settings route
- database schema tương đối đầy nhưng chưa có domain behavior tương ứng

Nó chưa phải là một app nutrition/meal-planning có CRUD management hoạt động thật ở UI layer.

## 4. Architecture Audit

### 4.1 Pattern đang dùng
Kiến trúc thực tế đang theo hướng:
- Standalone Angular component
- Lazy-loaded routes
- Database abstraction per platform
- Repository + Store cho profile domain
- Signal-based local state

Đây là hướng phù hợp với `CLAUDE.md` và khá sạch cho giai đoạn bootstrap.

### 4.2 Boundary hiện có
Boundary hiện rõ nhất ở profile domain:
- UI: `onboarding.page.ts`
- Store: `profile.store.ts`
- Repository: `user-profile.repository.ts`
- Persistence abstraction: `DatabaseService`
- Platform implementation: `WebDatabaseService` / `NativeDatabaseService`

Boundary này hợp lý và có thể tái sử dụng cho các domain khác.

### 4.3 Boundary còn thiếu
Đa số domain còn lại mới chỉ có schema nhưng chưa có boundary tương ứng:
- Không có `IngredientRepository`
- Không có `DishRepository`
- Không có `DayPlanRepository`
- Không có `ExerciseRepository`
- Không có nutrition stores / management stores
- Không có form/view-model/service cho ingredient/dish flow

Hệ quả:
- Architecture docs mô tả một hệ nhiều lớp khá hoàn chỉnh.
- Implementation hiện mới hiện thực boundary cho đúng 1 domain thật sự: user profile.

### 4.4 Điểm coupling / risk kiến trúc
1. `schema.ts` đi rất xa so với code gọi nó
- Schema khai báo 18 bảng + 1 view lớn.
- Nhưng gần như không có repository/query layer tiêu thụ các bảng này.
- Đây là kiểu “schema-first without behavior”, dễ tạo ảo giác là feature đã gần xong trong khi thực tế chưa bắt đầu.

2. `onboarding.page.ts` khá lớn
- File này hơn 1000 dòng, chứa nhiều UI + validation + business calculation + navigation logic cùng chỗ.
- Với current scale thì còn chấp nhận được, nhưng đây là điểm sẽ phình nhanh nếu không tách sớm.

3. Shared component có trước use case thật
- `BottomSheetPickerComponent` đã có và test tốt.
- Nhưng chưa có consumer thật trong feature management.
- Nghĩa là design-system building block có trước, nhưng product flow chưa gắn vào.

### 4.5 Kết luận kiến trúc
- Nền kiến trúc chọn đúng hướng.
- Nhưng current implementation chưa đủ density để chứng minh kiến trúc đó đang hoạt động toàn cục.
- Hiện tại mới là “good skeleton, low domain completion”.

## 5. Implementation Audit

### 5.1 Điểm mạnh

#### a. Strict TypeScript được bật thật
Bằng chứng từ `tsconfig.json`:
- `strict: true`
- `noImplicitOverride: true`
- `noPropertyAccessFromIndexSignature: true`
- `noImplicitReturns: true`
- `strictTemplates: true`

#### b. ESLint có cấm `any`
Bằng chứng từ `eslint.config.js`:
- `@typescript-eslint/no-explicit-any: 'error'`

#### c. Repository/profile layer khá gọn
- `UserProfileRepository` có singleton semantics rõ ràng.
- Có test idempotent insert để tránh duplicate profile row.

#### d. Database init flow khá tốt
`database.provider.ts` có thứ tự khởi tạo rõ:
1. initialize DB
2. migrate legacy profile nếu native
3. load profile vào signal store

#### e. Native DB init có quan tâm tính idempotent
- Cache `initPromise`
- Reuse connection nếu đã có
- Bật foreign key
- Cố gắng bật WAL nhưng non-fatal nếu fail

### 5.2 Điểm yếu / drift / technical debt

#### a. Schema implementation đang cũ so với docs unit redesign
Đây là drift lớn nhất.

Bằng chứng trong `schema.ts`:
- `ingredient.default_entry_unit`
- `ingredient.grams_per_unit`
- `ingredient.ml_per_unit`
- `dish_ingredient.amount_unit`
- hardcoded enum `('g', 'ml', 'piece')`

Trong khi docs mới đã chốt:
- `unit`
- `ingredient_unit`
- `dish_ingredient.unit_id`
- `density_g_per_ml`
- approximate unit marker
- unit-specific resolver

=> Kết luận: source code schema chưa sync với docs mới nhất.

#### b. Docs nói Repository layer cho nhiều domain, nhưng code chỉ có 1 repository thật
Hiện repository files chỉ có:
- `user-profile.repository.ts`
- `user-profile.repository.spec.ts`

Không có repository cho nutrition / fitness / planning.

=> Implementation chưa phản ánh đúng kiến trúc được mô tả trong docs.

#### c. Nhiều feature page mới là placeholder
Các tab chính đều chưa có behavior thật.

=> Mức độ hoàn thiện product thấp hơn nhiều so với tài liệu product/design hiện tại.

#### d. Onboarding page quá lớn
`onboarding.page.ts` đang ôm:
- step logic
- UI template lớn
- validation state
- nutrition calculation
- focus/navigation behavior

Đây là điểm technical debt sớm. Chưa thành anti-pattern nghiêm trọng, nhưng nên tách trước khi mở rộng feature.

#### e. Logging chưa có strategy rõ ràng
Có `console.warn`, `console.error`, `console.info` rải trong:
- `database.provider.ts`
- `web-database.service.ts`
- `native-database.service.ts`
- `legacy-sqljs-migrator.ts`
- `user-profile.repository.ts`

Hiện tại hợp lý cho bootstrap/debug, nhưng chưa có logging policy rõ ràng cho production/native.

#### f. Format discipline chưa sạch
`npm run format:check` fail với 4 file:
- `src/app/core/repositories/user-profile.repository.spec.ts`
- `src/app/core/services/database/database.provider.ts`
- `src/app/core/services/database/legacy-sqljs-migrator.ts`
- `src/app/core/services/database/native-database.service.ts`

=> Workflow chất lượng chưa hoàn toàn “green”.

#### g. Build/doc prerequisite drift
`CLAUDE.md` ghi Node.js 22 LTS là prerequisite.
Nhưng thực tế máy đang dùng:
- `node -v` -> `v24.10.0`

CI file `.github/workflows/e2e.yml` còn split version:
- test-and-build dùng Node 20
- e2e dùng Node 22

=> Runtime matrix chưa thống nhất.

### 5.3 Anti-pattern / risk chưa thành bug nhưng đáng lưu ý
1. Schema rất rộng nhưng chưa có migration plan thật cho các delta tương lai ngoài `PRAGMA user_version` baseline.
2. `legacy-sqljs-migrator.ts` cast từ legacy row sang `UserProfile` khá lỏng (`obj as unknown as UserProfile`).
3. `BottomSheetPickerComponent` tạo `titleId` bằng `Math.random()` trong instance; ổn cho mock/simple usage, nhưng không phải pattern deterministic tốt nhất nếu sau này SSR/hydration là concern.
4. CI workflow tên `e2e.yml` nhưng không có thư mục `e2e/` hiện diện trong repo hiện tại; workflow đang tham chiếu tới `e2e/wdio.conf.ts` mà path này chưa tồn tại trong audit hiện tại.

## 6. Workflow Audit

### 6.1 Command đã chạy và kết quả

#### `npm run lint`
Kết quả: PASS với warning
- 1 warning ở `src/app/core/stores/profile.store.ts`
- Missing return type on function

#### `npm run format:check`
Kết quả: FAIL
- 4 file chưa đúng format Prettier

#### `npm run build`
Kết quả: PASS
- Build thành công
- Có 1 warning budget:
  - `src/app/features/onboarding/onboarding.page.ts` vượt anyComponentStyle budget 4kb lên ~4.52kb

#### `npx ng test --watch=false --browsers=ChromeHeadless`
Kết quả: PASS
- 17 tests success
- Có warning log từ repository insert idempotent, nhưng không fail test

### 6.2 Workflow hook hiện có
- `.husky/pre-commit` chạy `npx lint-staged`
- `.husky/commit-msg` chạy `commitlint`
- `lint-staged` chỉ áp lên file dưới `src/`

### 6.3 Workflow/CI mismatch
1. CI chính chưa chạy lint và format check.
   - Workflow hiện chỉ chạy unit test + build.
   - Điều này cho phép code style drift lọt vào main nếu local hook bị bypass.

2. CI test/build dùng Node 20, trong khi docs nói Node 22 là prerequisite.

3. Workflow E2E đang tồn tại nhưng repo hiện không có thư mục `e2e/` trong audit này.
   - Đây là dấu hiệu workflow drift hoặc file test chưa được commit/đã bị loại bỏ.

## 7. Compare Docs/Mockups vs Current Code

### 7.1 Những gì docs/mockup đã có nhưng code chưa có
- Ingredient list/edit
- Dish list/edit
- Unit registry model mới
- approximate unit UI
- cross-dimension conversion rule mới
- nutrition CRUD flow
- derived dish total hiển thị ở UI management
- management module thật sự
- dashboard/calendar/fitness thật sự

### 7.2 Những gì code đã có nhưng docs dễ làm người đọc đánh giá thấp
- Legacy migration từ sql.js sang native SQLite cho profile
- Database bootstrap order tương đối chặt
- Bottom sheet picker component + tests
- Idempotent profile insert semantics

### 7.3 Kết luận độ khớp hiện tại
- App shell + onboarding: khớp tương đối tốt với định hướng nền tảng.
- Nutrition/management implementation: chưa khớp.
- Docs và mockup đang đi trước code ít nhất 1 phase lớn.

## 8. Security / Config / Environment Audit

### 8.1 Điểm ổn
- `geminiApiKey` đang để rỗng trong env files, không lộ secret thật.
- Không thấy hardcoded API key trong source đã đọc.

### 8.2 Điểm cần chú ý
1. `geminiApiKey` đặt trong client environment file là pattern nhạy cảm.
   - Dù hiện đang rỗng, nếu sau này điền key thật vào đây thì sẽ thành client-exposed secret.

2. SQLite native hiện `androidIsEncryption: false`.
   - Có thể chấp nhận cho giai đoạn đầu, nhưng cần được coi là explicit product/security decision, không phải default vô tình.

3. Web sql.js dùng localStorage để persist dev DB.
   - Hợp lý cho dev/web preview.
   - Không nên bị hiểu nhầm là persistence strategy production.

## 9. Recommended Improvements

### Critical
1. Sync lại `src/app/core/services/database/schema.ts` với docs unit redesign mới.
2. Bắt đầu hiện thực repository/service/store cho `ingredient` và `dish` trước khi docs drift thêm.
3. Tạo management feature thật thay cho placeholder nếu Phase 1 là current priority.
4. Xác minh và sửa workflow E2E đang tham chiếu path không tồn tại (`e2e/wdio.conf.ts`).

### High
1. Thêm lint + format check vào CI chính.
2. Thống nhất version Node giữa docs, local expectation, và CI.
3. Tách `onboarding.page.ts` thành các phần nhỏ hơn:
   - step subcomponents hoặc section presenters
   - validation/calculation utilities
4. Viết test cho `database.provider.ts` và `legacy-sqljs-migrator.ts` logic quan trọng.

### Medium
1. Tạo logging policy rõ ràng cho warn/error/info ở app runtime.
2. Tạo repository/store skeleton cho calendar/fitness/nutrition để kiến trúc docs và code bớt lệch.
3. Ghi rõ trong docs phần nào là implemented, phần nào là planned.
4. Rà lại build budget của onboarding styles.

### Low
1. Chuẩn hóa return type warnings còn lại để lint sạch hoàn toàn.
2. Làm deterministic hơn cho generated IDs như `titleId` nếu component shared được dùng rộng.
3. Thêm inventory/codebase map ngắn trong docs cho dev mới.

## 10. AI Working Instructions cho current implementation

### Trước khi sửa code
- Luôn kiểm tra current implementation trong `src/` trước, không suy ra từ docs/mockup.
- Nếu sửa domain nutrition/management, phải kiểm tra drift giữa docs mới và `schema.ts` hiện tại.
- Chạy ít nhất các command liên quan sau khi sửa:
  - `npm run lint`
  - `npm run format:check`
  - `npm run build`
  - test liên quan hoặc `npx ng test --watch=false --browsers=ChromeHeadless`

### Không được làm
- Không giả định feature management đã tồn tại chỉ vì docs/mockup đã có.
- Không thêm code mới trực tiếp phụ thuộc vào schema docs mới nếu chưa sync schema implementation trước.
- Không đưa Gemini API key thật vào `src/environments/*.ts`.
- Không bypass repository/database abstraction bằng cách thao tác persistence ad-hoc trong page component.

### Khi thêm file mới
- Đặt đúng layer: feature / store / repository / service / model.
- Với domain mới, cố giữ chuỗi: UI -> store -> repository -> DatabaseService.
- Ưu tiên standalone component và lazy route nhất quán với hiện trạng.

### Khi sửa logic hiện có
- Tôn trọng singleton semantics của `user_profile`.
- Không phá startup order trong `database.provider.ts`.
- Nếu đổi schema, phải cập nhật migration/versioning strategy thay vì chỉ sửa DDL.

### Khi refactor
- Ưu tiên refactor `onboarding.page.ts` theo hướng tách nhỏ mà không đổi behavior.
- Không refactor rộng các feature placeholder nếu chưa có yêu cầu product rõ.
- Refactor schema/domain layer phải bám docs source-of-truth mới nhất.

### Khi viết test
- Thêm test cho repository/store/service trước UI phức tạp nếu domain logic quan trọng.
- Với database changes, cần test cả happy path lẫn initialize/not-initialized path.
- Không để warning/log không chủ đích trôi qua mà không hiểu nguyên nhân.

### Khi cập nhật document
- Nếu code chưa theo docs, ghi rõ `planned` vs `implemented`.
- Không mô tả management CRUD như tính năng đã hoàn thành ở current state.
- Khi sync schema docs, phải sync cả `schema.ts` hoặc ghi rõ code chưa theo.

### Với error/logging/config/security
- `console.warn/error/info` chỉ nên dùng có chủ đích và có message rõ nghĩa.
- API key/client secret không được commit vào environment files client-side.
- Mọi thay đổi schema cần xem xét data migration native/web hiện có.

### Khi thiếu context
- Ưu tiên đọc file thật và chạy command thật.
- Nếu docs và code mâu thuẫn, nói rõ đâu là current state và đâu là target state.
- Không suy đoán rằng placeholder page có logic ẩn phía sau nếu chưa thấy trong code.

## 11. Final Verdict

Current codebase là một nền tảng tốt cho Phase 0/early Phase 1, nhưng chưa phải implementation tương xứng với độ chi tiết của docs và mockup hiện tại.

Đánh giá cuối:
- Foundation quality: tốt
- Architecture direction: đúng
- Current feature completeness: thấp so với docs
- Main technical risk: spec/code drift, đặc biệt ở nutrition unit model
- Main next step: sync schema + build domain repositories/UI cho management flow thật

## 12. Verified Command Results

- `pwd && git ... && node -v && npm -v`
  - repo: `/Users/khanhhuynh/person_project/MealPlaning`
  - branch: `main`
  - node: `v24.10.0`
  - npm: `11.6.0`

- `npm run lint`
  - pass với 1 warning

- `npm run format:check`
  - fail

- `npm run build`
  - pass với 1 style budget warning ở onboarding

- `npx ng test --watch=false --browsers=ChromeHeadless`
  - pass, 17/17 tests success
