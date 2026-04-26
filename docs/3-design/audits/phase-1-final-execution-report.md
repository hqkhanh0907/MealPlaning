# Phase 1 Final Execution Report (Current Cut)

## 1. Executive Summary
- Đã hoàn thành một lát cắt chạy được trên app thật cho Phase 1 Management.
- App Android debug build cài và launch thành công trên `emulator-5554`.
- Onboarding hoàn tất được trên emulator.
- Tab `Quản lý` render đúng trên app thật.
- Flow `Thêm nguyên liệu` tối thiểu đã chạy end-to-end: mở modal -> nhập tên bằng keyevent -> lưu -> modal đóng -> item mới xuất hiện trong danh sách.
- Tab `Món ăn` render đúng empty state của scope hiện tại.
- Tuy nhiên `p6p` chưa hoàn tất hoàn toàn: schema runtime hiện đang ở trạng thái hybrid/backward-compatible, chưa migrate dứt điểm sang runtime-only `unit/ingredient_unit/unit_id` như spec cuối cùng.

## 2. Phạm vi đã thực thi thật
### Code foundation
- Stores:
  - `src/app/core/stores/ingredient.store.ts`
  - `src/app/core/stores/dish.store.ts`
- Shared components:
  - `empty-state`
  - `nutrition-badge`
  - `search-toolbar`
  - `confirm-dialog`
  - `ingredient-edit-modal`
- Management page thật:
  - `src/app/features/management/management.page.ts`
- Repository/support:
  - `ingredient.repository.ts`
  - `unit.repository.ts`
  - database migration/compatibility helpers

### App/device verification
- `npx cap sync android` pass
- `./gradlew assembleDebug` pass
- APK debug install thành công lên `emulator-5554`
- `com.healthmate.ai/.MainActivity` launch thành công

## 3. QA bằng thao tác người dùng thật trên emulator
### Case A — Launch app
Kết quả:
- App mở được.
- Không còn stuck splash ở build mới sau khi thêm guard/reset tương thích schema native.

### Case B — Onboarding
Kết quả:
- Đi qua onboarding thành công bằng thao tác tap thực trên emulator.
- Sau khi hoàn tất onboarding, app vào shell chính.

### Case C — Vào tab Quản lý > Nguyên liệu
Kết quả:
- Tab `Quản lý` render đúng.
- Segment `NGUYÊN LIỆU | MÓN ĂN` render đúng.
- Danh sách nguyên liệu thật render được.

### Case D — Mở modal Thêm nguyên liệu
Kết quả:
- FAB mở được modal `Thêm nguyên liệu` trên app thật.
- Form render đúng các field cơ bản.

### Case E — Lưu nguyên liệu tối thiểu
Tình trạng ban đầu:
- Save fail do runtime schema cũ còn yêu cầu `ingredient.default_entry_unit`.
- Log thực tế ghi nhận:
  - `NOT NULL constraint failed: ingredient.default_entry_unit`

Fix đã áp dụng:
- `IngredientRepository.insert()` được sửa để ghi tương thích với schema runtime hiện tại:
  - thêm `default_entry_unit`
  - thêm `grams_per_unit`
  - thêm `ml_per_unit`
- Test repository được cập nhật và pass lại.

Kết quả sau fix:
- Dùng thao tác thật trên emulator:
  - mở modal
  - focus ô tên
  - nhập `abc` bằng `adb input keyevent A B C`
  - bấm `Lưu nguyên liệu`
- Kết quả UI thật:
  - modal đóng
  - item mới `abc` xuất hiện trong list
  - hiển thị `Thịt · 100g`
  - badge `MANUAL`
  - badge nutrition `0 kcal`, `0g protein`
- Không thấy toast thành công riêng, nhưng state UI xác nhận save thành công.

### Case F — Search ingredient
Kết quả:
- Sau khi focus ô tìm kiếm và nhập `abc`, list còn item `abc`.
- Search behavior tối thiểu hoạt động theo UI hiện thấy.

### Case G — Tab Món ăn
Kết quả:
- Sau khi tap đúng bounds của segment `MÓN ĂN`, tab active đổi đúng.
- Màn `Thư viện món ăn` render đúng empty state:
  - `Chưa có món ăn nào`
  - CTA `Tải lại`
- Điều này xác nhận tab `Món ăn` không còn placeholder cũ kiểu `Coming soon`.

## 4. Vấn đề phát hiện trong quá trình QA và cách xử lý
### Vấn đề 1 — App từng kẹt splash / không vào shell ổn định
- Nguyên nhân gần đúng: xung đột shape schema management cũ trong native DB.
- Đã xử lý bằng compatibility guard/reset trước khi apply baseline schema/migration.

### Vấn đề 2 — Nhập text vào modal bị overlay stylus/Gboard gây nhiễu
- `adb input text` không ổn định vì overlay stylus can thiệp.
- Chuyển sang `adb input keyevent A B C` để nhập ký tự kiểu người dùng thật ở mức thiết bị.
- Cách này đã chứng minh được flow save tối thiểu.

### Vấn đề 3 — Save ingredient fail trên thiết bị thật
- Log thực tế:
  - `NOT NULL constraint failed: ingredient.default_entry_unit`
- Root cause:
  - runtime schema vẫn còn cột legacy bắt buộc
  - repository mới insert theo shape mới chưa đủ backward-compatible
- Fix:
  - thêm cột legacy-compatible vào insert path
- Sau fix:
  - save thật thành công trên emulator

## 5. Kết quả kiểm chứng kỹ thuật
- `npm run lint` ✅
- `npm run build` ✅
- Focused regression suites ✅
- `npx cap sync android` ✅
- `./gradlew assembleDebug` ✅
- APK install + launch trên emulator ✅

Ghi chú warning còn lại:
- build vẫn có warning style budget cũ ở `onboarding.page.ts`
- đây là warning đã biết, không chặn flow hiện tại

## 6. Đánh giá completion theo task
### Hoàn thành
- `p8` Build APK, cài emulator, launch app
- phần lớn `p9` cho lát cắt đã implement
- `p6o` ở mức tối thiểu đầu tiên: create ingredient flow đã có case QA thật và pass

### Chưa hoàn tất hoàn toàn
- `p6p` chưa hoàn tất dứt điểm
  - runtime schema vẫn là hybrid/backward-compatible
  - chưa chuyển hẳn toàn bộ runtime sang shape cuối: `unit`, `ingredient_unit`, `unit_id` mà không phụ thuộc cột legacy
- `Món ăn` mới chỉ có list/empty-state, chưa có create/edit flow thật
- delete/edit ingredient chưa được QA đầy đủ trên emulator trong đợt này

## 7. Kết luận thực tế
Trên app thật, lát cắt Phase 1 hiện đã đạt mức sau:
- management page thật đã chạy
- ingredient list thật đã chạy
- ingredient create modal thật đã chạy
- ingredient save tối thiểu thật đã chạy end-to-end
- dish tab thật đã render đúng empty state

Nhưng chưa thể coi toàn bộ Phase 1 hoàn tất vì:
- schema runtime chưa migrate hoàn toàn theo spec mới
- dish flow chưa hoàn chỉnh
- QA full matrix CRUD/chuyển tab/search/delete/edit chưa hoàn tất

## 8. Khuyến nghị bước tiếp theo
1. Hoàn tất `p6p`
   - migrate runtime schema dứt điểm khỏi `default_entry_unit / grams_per_unit / ml_per_unit / amount_unit`
   - update repository/query/view để chỉ dùng shape mới
2. Hoàn tất edit/delete ingredient và QA lại trên emulator
3. Mở create/list dish flow tối thiểu và QA lại trên emulator
4. Sau đó mới chốt final completion report toàn Phase 1

## 9. Evidence files
- `docs/3-design/audits/phase-1-emulator-qa-progress.md`
- `docs/3-design/audits/phase-1-final-execution-report.md`
- screenshots/tmp files trong root project session phục vụ QA emulator
