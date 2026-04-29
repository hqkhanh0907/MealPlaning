# Phase 1 Pre-code Readiness, Scope Summary, Mockup Analysis, Implementation Plan

Ngày: 2026-04-26
Trạng thái: Hoàn tất bước đọc hiểu document + phân tích mockup + lập kế hoạch + audit kế hoạch trước khi code

> **Superseded note — 2026-04-29:** Một số phần trong file này phản ánh flow Phase 1 cũ. Source of truth mới cho Management UX là dish-first: `Món ăn | Thư viện nguyên liệu`, ingredient library dùng detail-first trước khi sửa. Xem `docs/plans/2026-04-29-management-dish-first-ux-redesign.md` và `docs/plans/2026-04-29-ingredient-library-detail-first-edit-flow.md`.

## 1. Source of truth hierarchy

Khi tài liệu mâu thuẫn, dùng thứ tự sau:
1. `docs/4-architecture/business-rules.md`
2. `docs/2-requirements/prd.md`
3. `docs/3-design/data-model.md`
4. `docs/3-design/design-system.md`
5. `docs/5-development/phase-1-management.md`
6. `docs/3-design/mockups/README.md`
7. implementation hiện tại trong `src/` để xác định current state, không dùng làm source of truth cho behavior mới nếu đã drift

Lý do:
- `business-rules.md` là rule chính thức mới nhất cho `dish total`, `unit normalization`, provenance.
- `phase-1-management.md` từng có drift trong thời điểm audit này; sau 2026-04-29 cần đối chiếu lại với plan dish-first mới.
- Mockup đã được sync 12 vòng, nên hiện được xem là UI spec đáng tin sau khi đối chiếu lại với docs cốt lõi.

## 2. Phase 1 cần triển khai gì

## In scope chính

### F-01 Quản lý nguyên liệu
- List ingredient
- Search real-time theo tên
- CRUD manual ingredient
- Persist data sau restart
- Ship seed ingredient dataset phục vụ trực tiếp cho 20 món Việt core
- Mỗi ingredient có canonical nutrition theo `100g` hoặc `100ml`
- Mỗi ingredient có danh sách `ingredient_unit[]`
- Có đúng 1 default unit
- Hỗ trợ approximate unit với marker `≈` / `ước lượng`
- Hỗ trợ cross-dimension conversion theo rule:
  - `ingredient_unit.factor_to_basis`
  - fallback `density_g_per_ml`
  - nếu vẫn không có thì reject

### F-02 Quản lý món ăn
- List dish
- Search dish theo tên
- CRUD dish theo flow ingredient-based
- Total nutrition luôn derived từ `dish_with_totals`
- Không có nhập tay total
- Không có Quick Add trong V1 hiện tại
- Món seed 20 món Việt core dưới dạng template `1 serving`
- Dish edit/create phải yêu cầu ít nhất 1 `dish_ingredient`
- UI được phép có preview total trước save nhưng không persist preview

### Data / infra cần có để Phase 1 chạy thật
- Migration runner hoặc migration strategy có versioning rõ ràng
- Schema DB sync với docs mới:
  - `unit`
  - `ingredient_unit`
  - `ingredient.density_g_per_ml`
  - `dish_ingredient.unit_id`
  - `dish_with_totals` view dùng `normalized_amount`
- Seed loader cho fresh install
- Repository + store cho ingredient/dish
- Management UI thật theo mockup

## Out of scope Phase 1
- AI Lookup ingredient
- AI Auto-fill dish
- Calendar / tracking / dashboard behavior hoàn chỉnh
- Offline banner / network-aware AI gating sâu
- E2E suite hoàn chỉnh
- Quick Add

## 3. Các màn hình, flow, component, state cần xử lý

## Màn hình chính Phase 1
1. `management.page.ts`
   - container với segment `Món ăn | Thư viện nguyên liệu` theo plan mới
2. `ingredient-list`
3. `ingredient-edit`
4. `dish-list`
5. `dish-edit-ingredient-based`

## Flow ingredient
- vào tab Quản lý -> tab con Thư viện nguyên liệu
- xem seed + manual items
- search theo tên
- mở form thêm nguyên liệu
- nhập name/category/basis/calories/protein/carbs/fat/fiber
- cấu hình danh sách unit:
  - add unit
  - set default
  - approximate marker
  - optional density
- save
- mở chi tiết ingredient cũ trước, sau đó bấm `Sửa thông tin` để edit
- delete ingredient:
  - nếu không có reference -> confirm delete thường
  - nếu đang được dùng -> blocked delete / RESTRICT-aware dialog

## Flow dish
- vào tab Quản lý -> tab con Món ăn
- xem dish list
- search theo tên
- thêm món từ nguyên liệu
- nhập tên món, servings
- add ingredient bằng bottom sheet picker
- chọn unit hợp lệ cho từng ingredient
- nhập amount
- preview total realtime
- reject unit nếu không resolve được conversion
- save transactionally: `dish` + `dish_ingredient[]`
- edit seed/custom dish
- delete dish với generic confirm

## Component cần tái sử dụng / tạo mới

### Có thể tái sử dụng
- `BottomSheetPickerComponent`
- Ionic header / toolbar / modal / segment primitives
- theme tokens từ `src/theme/variables.scss`

### Cần tạo mới theo Phase 1
- `IngredientRepository`
- `DishRepository`
- `DishIngredientRepository`
- `IngredientStore`
- `DishStore`
- `unit-resolver` helper/service
- `seed-loader` helper/service
- management subcomponents/pages:
  - ingredient list
  - ingredient edit modal/page
  - dish list
  - dish edit modal/page
- shared presentation components nếu cần tối thiểu:
  - confirm dialog
  - empty state
  - search toolbar
  - nutrition badge

## UI states bắt buộc
- loading
- empty list
- search no-result
- invalid form
- save disabled
- delete confirm
- delete blocked
- approximate unit indicator
- reject conversion state
- preview total state
- dark mode

## 4. Rule bắt buộc phải tuân thủ

### Architecture / code
- TypeScript strict, không dùng `any`
- standalone components
- Angular Signals cho state
- snake_case ở DB, camelCase ở TS
- UUID v4 cho PK
- mọi data đi qua repository -> database abstraction
- không persist total nutrition trên `dish`
- không bypass DB layer bằng local object source-of-truth

### Business rules
- `dish_with_totals` là single source of truth cho total dish
- mọi `dish_ingredient` phải được normalize qua resolver thống nhất
- không được silent convert `g <-> ml`
- approximate unit vẫn tính macro, nhưng phải gắn marker rõ
- Quick Add không được quay lại V1

### UI / design
- tiếng Việt only
- dùng design tokens trong `variables.scss`
- buttons min-height 44px
- bottom-sheet select pattern cho N >= 6
- binary choices dùng segment, 3-5 options dùng radio cards
- destructive action phải tách rõ khỏi primary CTA
- copy user-facing, không lộ jargon kỹ thuật nếu không cần

## 5. Điểm chưa rõ / mâu thuẫn / assumption cần theo dõi

1. `RULE-INGREDIENT-PROVENANCE` trong `business-rules.md` đang để TBD cho case user sửa seed ingredient:
   - PRD + data model nói chuyển `db -> manual`
   - business rules ghi `TBD`
   => Tạm thời assumption triển khai sẽ theo PRD/data-model: sửa seed ingredient thì đổi `source = 'manual'`, trừ khi user quyết định khác trước khi hoàn tất flow edit.

2. `phase-1-management.md` còn drift:
   - còn nhắc Quick Add
   - có vài interface/store entry cũ như `addQuick`
   => không dùng làm source of truth cho behavior mới.

3. `phase-1-management.md` đề xuất migration-only và retire `schema.ts`, nhưng implementation hiện vẫn đang bootstrap bằng `SCHEMA_DDL`.
   => cần chọn hướng chuyển đổi có kiểm soát, tránh phá startup hiện tại.

4. current implementation mới có profile domain, chưa có management domain thật.
   => Phase 1 là một đợt build lớn chứ không phải polish nhỏ.

## 6. Phân tích mockup đối chiếu với docs và implementation

## Kết luận mockup
- 4 mockup chính đã được sync và có thể dùng làm UI spec triển khai.
- 2 màn nặng nhất đã được chuẩn hóa theo model mới:
  - `phase-1-ingredient-edit.html`
  - `phase-1-dish-edit-ingredient-based.html`
- 2 màn list đã pass sau 12 vòng review, không còn blocker trực quan lớn.

## Tương quan mockup vs implementation hiện tại
- Mockup mô tả đầy đủ list/edit CRUD thật.
- Implementation hiện tại chỉ có `management.page.ts` placeholder `Coming soon`.
- Không có screen/component nào trong `src/` cho 4 mockup Phase 1.

## Điểm phải giữ đúng khi code theo mockup
- ingredient list: search, filter/sort, dialog delete thường và blocked delete
- ingredient edit: unit list, default marker, approximate marker, density optional, validation thiếu unit/default
- dish list: 2 CTA chính còn lại là ingredient-based và AI auto-fill wording ở mockup, nhưng trong Phase 1 chỉ render flow manual thật; AI CTA cần xử lý đúng scope nếu xuất hiện ở UI roadmap
- dish edit ingredient-based: bottom sheet chọn ingredient, chọn unit hợp lệ, preview total derived, reject conversion state

## Cách xử lý conflict mockup/doc
- behavior và data model: ưu tiên docs chính thức
- spacing/hierarchy/copy user-facing: ưu tiên mockup đã sync nếu không mâu thuẫn business rules

## 7. Kế hoạch triển khai chi tiết

## Giai đoạn A — nền DB và model
1. Thêm migration infrastructure có test:
   - `migration-runner.ts`
   - `migration-runner.spec.ts`
   - `migrations/V1_initial_schema.sql` hoặc migration registry tương đương
2. Chuyển nutrition schema sang model mới:
   - thêm `unit`
   - thêm `ingredient_unit`
   - sửa `ingredient`
   - sửa `dish`
   - sửa `dish_ingredient`
   - giữ `dish_with_totals`
3. Thêm tests cho schema/versioning/migration idempotency
4. Thêm seed loading scaffolding cho fresh install

## Giai đoạn B — domain model + repository + resolver
1. Tạo models:
   - `unit.model.ts`
   - `ingredient.model.ts`
   - `dish.model.ts`
2. Tạo unit resolver + tests:
   - same-dimension conversion
   - ingredient-specific conversion
   - density fallback
   - reject path
   - approximate marker handling
3. Tạo repositories + tests:
   - ingredient
   - dish
   - dish_ingredient
4. Tạo seed loader + tests

## Giai đoạn C — stores
1. `ingredient.store.ts` + spec
2. `dish.store.ts` + spec
3. actions cho load/add/edit/remove/search

## Giai đoạn D — UI shared building blocks
1. `empty-state`
2. `confirm-dialog`
3. `search-toolbar`
4. `nutrition-badge`

## Giai đoạn E — management UI
1. nâng `management.page.ts` từ placeholder thành container thật
2. ingredient list
3. ingredient edit
4. dish list
5. dish edit ingredient-based
6. wiring navigation/modal interactions

## Giai đoạn F — verification
1. lint
2. format check
3. unit tests
4. build web
5. build Android/APK
6. cài emulator-5554
7. launch app
8. manual visual QA theo checklist case-by-case

## 8. Danh sách file/module có khả năng thay đổi

### Database / infra
- `src/app/core/services/database/schema.ts` hoặc thay thế bằng migrations
- `src/app/core/services/database/web-database.service.ts`
- `src/app/core/services/database/native-database.service.ts`
- `src/app/core/services/database/database.provider.ts`
- `src/app/core/services/database/migration-runner.ts` (new)
- `src/app/core/services/database/migrations/*` (new)
- `src/app/core/services/database/*spec.ts`

### Models
- `src/app/core/models/unit.model.ts` (new)
- `src/app/core/models/ingredient.model.ts` (new)
- `src/app/core/models/dish.model.ts` (new)

### Repositories / stores
- `src/app/core/repositories/ingredient.repository.ts` (new)
- `src/app/core/repositories/dish.repository.ts` (new)
- `src/app/core/repositories/dish-ingredient.repository.ts` (new)
- corresponding `*.spec.ts`
- `src/app/core/stores/ingredient.store.ts` (new)
- `src/app/core/stores/dish.store.ts` (new)
- corresponding `*.spec.ts`

### Shared/UI
- `src/app/shared/components/*` cho empty/search/confirm/nutrition badge
- `src/app/features/management/management.page.ts`
- `src/app/features/management/management.routes.ts`
- subcomponents/pages mới dưới `features/management/`
- có thể thêm helper style/theme bindings

### Assets/scripts/docs
- `src/assets/seed/ingredients.json`
- `src/assets/seed/dishes.json`
- `scripts/seed/build-vietnamese-core.ts`
- `docs/6-testing/phase-1-qa.md`
- update `phase-1-management.md` retro nếu hoàn tất phase

## 9. Test cần viết / cập nhật

### Unit / integration
- migration runner
- schema compatibility
- unit resolver
- ingredient repository CRUD/search/delete guard
- dish repository transactional insert/update/delete
- dish_ingredient normalization
- stores signal transitions
- seed loader fresh DB only
- shared component interaction tests tối thiểu nếu component có behavior logic

### Verify kỹ thuật bắt buộc
- `npm run lint`
- `npm run format:check`
- `npx ng test --watch=false --browsers=ChromeHeadless`
- `npm run build`
- Android build / APK build command theo project

## 10. Các case cần verify trên emulator-5554

### Ingredient list
1. mở tab Quản lý -> Nguyên liệu
2. hiển thị seed list
3. search hit
4. search no-result
5. delete ingredient bình thường
6. delete ingredient đang được dùng -> blocked/RESTRICT message
7. dark mode rendering

### Ingredient edit
8. mở form thêm ingredient
9. validation name/category/macros/basis
10. thêm 1 unit hợp lệ và set default
11. thêm approximate unit hiển thị `≈`
12. nhập density optional
13. thiếu default -> bị chặn save
14. lưu thành công -> quay lại list thấy item mới
15. mở lại item đã lưu -> data persist đúng

### Dish list
16. mở tab Món ăn
17. hiển thị seed dishes
18. search hit
19. search no-result
20. delete dish confirm
21. dark mode rendering

### Dish edit ingredient-based
22. mở form tạo dish
23. save dish rỗng -> bị chặn
24. thêm ingredient bằng bottom sheet
25. chọn unit cùng dimension -> preview total đúng
26. chọn ingredient-specific unit như `quả`
27. chọn approximate unit -> UI hiển thị ước lượng
28. chọn cross-dimension có factor -> pass
29. chọn cross-dimension cần density -> pass nếu có density
30. chọn cross-dimension không có factor/density -> reject đúng message
31. save dish -> list update
32. restart app -> data vẫn còn

## 11. Rủi ro kỹ thuật và cách giảm thiểu

1. Rủi ro migration phá startup hiện tại
- giảm thiểu: test-first cho migration runner; giữ startup flow cũ hoạt động cho v1 trước khi chuyển hết sang migration registry

2. Rủi ro schema drift giữa docs và code
- giảm thiểu: implement theo data-model/business-rules mới nhất; không code theo phase plan cũ nếu conflict

3. Rủi ro scope quá lớn khi làm UI sớm
- giảm thiểu: data-first -> repo/store -> shared UI -> screens

4. Rủi ro logic convert unit sai
- giảm thiểu: pure resolver + matrix tests cho same-dimension, density fallback, reject path, approximate

5. Rủi ro seed data làm nhiễu CRUD thủ công
- giảm thiểu: seed only on fresh install; không overwrite DB đã tồn tại

6. Rủi ro visual mismatch với mockup
- giảm thiểu: sau mỗi lát cắt UI quan trọng phải build + chạy emulator + thao tác tay thật

## 12. Audit lại kế hoạch trước khi code

### Kiểm tra bám document
- Có. Kế hoạch bám F-01/F-02, business rules unit normalization và mockup Phase 1.

### Kiểm tra bám mockup
- Có. 4 màn chính đều được đưa vào implementation plan cùng state quan trọng.

### Có bỏ sót state/edge case không?
- Không ở mức chính. Đã đưa vào:
  - empty/search no-result
  - blocked delete
  - reject conversion
  - approximate unit
  - preview total
  - dark mode
  - restart persistence

### Có ảnh hưởng ngoài scope Phase 1 không?
- Kế hoạch đã tránh AI runtime, calendar, dashboard, fitness behavior đầy đủ.
- Tuy nhiên migration runner là infra cross-cutting; đây là prerequisite hợp lệ, không phải scope creep.

### Có vi phạm architecture/convention không?
- Không. Kế hoạch giữ repository/store/database abstraction và standalone Angular.

### Có rủi ro breaking change không?
- Có, lớn nhất ở DB schema.
- Biện pháp: TDD + migration tests + incremental rollout.

### Có cần bổ sung test/verify nào không?
- Có: cần manual QA markdown checklist và Android emulator verification thật, không chỉ browser/mockup.

## 13. Quyết định bắt đầu code

Có thể bắt đầu code vì:
- bước đọc document đã hoàn tất
- mockup đã được phân tích và đối chiếu
- kế hoạch đã được lập
- kế hoạch đã được self-audit

## 14. Thứ tự code ngay sau tài liệu này

1. migration-runner.spec.ts (RED)
2. migration-runner.ts + registry/scaffold (GREEN)
3. schema migration integration tests
4. unit resolver tests
5. repository skeleton tests
6. implementation data layer
7. stores
8. shared components
9. management UI
10. APK + emulator + visual QA
