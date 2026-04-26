# Progress Update — Step order: 2 → 1 → 3

Ngày: 2026-04-26
Trạng thái: đã xong bước 2 và bước 1, đã bắt đầu bước 3

## Đã hoàn tất

### Bước 2 — Audit sâu onboarding + database
File:
- `/Users/khanhhuynh/person_project/MealPlaning/docs/3-design/audits/onboarding-database-deep-audit.md`

Kết luận chính:
- onboarding + database là vùng nền tốt nhất hiện tại
- cần tăng regression net trước khi đụng schema nutrition lớn
- `onboarding.page.ts` quá lớn, nên tách pure logic trước

### Bước 1 — Implementation plan chi tiết
File:
- `/Users/khanhhuynh/person_project/MealPlaning/docs/3-design/audits/phase-1-implementation-plan-after-deep-audit.md`

Kết luận chính:
- lát cắt Phase 1 an toàn nhất không phải UI CRUD, mà là test + startup orchestration + pure onboarding calculation

## Đã bắt đầu bước 3

### Những gì đã implement
1. Thêm test cho startup orchestration:
- `src/app/core/services/database/database.provider.spec.ts`

2. Thêm test cho legacy migration:
- `src/app/core/services/database/legacy-sqljs-migrator.spec.ts`

3. Thêm pure utility đầu tiên cho onboarding:
- `src/app/features/onboarding/onboarding-calculation.ts`
- `src/app/features/onboarding/onboarding-calculation.spec.ts`
- shared types:
  - `src/app/core/models/user-profile.types.ts`

## Kết quả verify

### Targeted tests
- `database.provider.spec.ts`: pass
- `legacy-sqljs-migrator.spec.ts`: pass
- `onboarding-calculation.spec.ts`: pass
- combined targeted run: 11 tests pass

### Lint
- `npm run lint`: pass với 1 warning cũ ở `profile.store.ts`

### Build
- `npm run build`: pass
- vẫn còn 1 style budget warning ở onboarding page

## Ý nghĩa của bước 3 hiện tại

Mình chưa nhảy vào CRUD management ngay, mà đã bắt đầu bằng phần nền an toàn đúng theo plan:
- tăng test coverage ở boundary startup/migration
- tách domain calculation đầu tiên ra khỏi page lớn
- tạo chỗ bám để refactor onboarding tiếp hoặc reuse logic trong profile/settings sau này

## Bước tiếp theo hợp lý nhất trong bước 3

1. nối `onboarding.page.ts` sang dùng `onboarding-calculation.ts`
2. thêm `onboarding-validation.ts` + tests
3. sau đó mới chuyển sang migration strategy cho schema nutrition Phase 1
