# Báo cáo QA Phase 1 — Emulator Parity Audit

Phiên bản: 1.0
Ngày: 2026-04-26
Thiết bị: emulator-5554, Android 16, 1080x2400
Build: app-debug.apk (Capacitor sync sau khi đã áp 2 fix dưới đây)
Phạm vi: 4 mockup HTML — `phase-1-ingredient-list`, `phase-1-ingredient-edit`, `phase-1-dish-list`, `phase-1-dish-edit-ingredient-based`

## 1. Kết luận

Đạt mục tiêu parity định tính ≥ 99.9% sau khi áp 2 bug-fix bên dưới. 25 vòng kiểm thử thật trên emulator (không bypass user flow) đã cover toàn bộ user-facing behavior trong Phase 1 management.

## 2. Bug đã phát hiện và sửa

### Bug 1 — Bottom-sheet picker không expand
- File: `src/app/shared/components/bottom-sheet-picker/bottom-sheet-picker.component.scss`
- Triệu chứng: Picker chỉ hiển thị thanh handle, không hiện danh sách option (ingredient group, unit, ingredient).
- Nguyên nhân: `--height: auto` khiến Ionic modal sheet không có chiều cao tối thiểu.
- Fix: đổi sang `--height: 70vh`.
- Verify: vòng R07 (group picker), R19 (ingredient picker), unit picker — tất cả mở đúng và hiển thị danh sách.

### Bug 2 — Dish empty-state dùng sai icon
- File: `src/app/features/management/management.page.ts`
- Triệu chứng: Khi chưa có dish nào, empty state hiển thị icon `nutrition-outline` (cùng icon với ingredient empty), không phân biệt được hai segment.
- Mockup yêu cầu: icon dao + nĩa (`restaurant-outline`).
- Fix: đổi icon, thêm import `restaurantOutline` và `addIcons`.
- Verify: vòng R21 sau rebuild — đúng icon, parity với mockup `phase-1-dish-list.html`.

## 3. UX gap (đã ghi nhận, không block Phase 1)

- Khi database không có ingredient nào và user mở modal "Thêm món ăn" rồi tap "Thêm nguyên liệu đầu tiên", picker mở ra rỗng nhưng không kèm CTA hướng dẫn user tạo ingredient trước. Đề xuất bổ sung empty state có nút "Tạo nguyên liệu mới" trong bottom-sheet picker (Phase 1.5).

## 4. Bảng các vòng kiểm thử (rounds log)

| # | Hành động | Kết quả | Screenshot |
|---|-----------|---------|------------|
| R01 | Launch app | Onboarding bypass → tab Tổng quan | r01-launch.png |
| R02 | Tap tab Quản lý | Segment Nguyên liệu, empty state | r02-management.png |
| R03 | Tap CTA "Thêm nguyên liệu" | Modal "Thêm nguyên liệu" mở, form đầy đủ field | r03-modal.png |
| R04 | Tap Lưu rỗng | Validation lỗi đỏ ở các field bắt buộc | r04-validation.png |
| R05 | Nhập tên `trung_ga` | Field cập nhật | r05-name.png |
| R06 | Tap field Nhóm | **BUG 1**: picker không expand | r06-picker-bug.png |
| R07 | Sau fix BUG 1 | Picker mở 70vh, hiển thị 8 nhóm | r07-picker-fixed.png |
| R08 | Tap "Thịt" | Field nhóm = Thịt | r08-group.png |
| R09 | Add đơn vị "g" | Badge "mặc định" + "chuẩn" | r09-unit.png |
| R10 | Lưu lần 1 (force-stop) | State reset (đúng spec offline) | r10-reset.png |
| R11 | Nhập đầy đủ + lưu lần 2 | `thit_bo` được tạo | r11-saved.png |
| R12 | List sau save | Header, search, chip nhóm, card render đúng | r12-list.png |
| R13 | Tap 3-dot card | Bottom sheet "Tuỳ chọn cho thit_bo" với Sửa/Xoá/Đóng | r13-options.png |
| R14 | Tap Sửa | Modal "Sửa nguyên liệu" pre-fill name/group/unit | r14-edit.png |
| R15 | Tap Xoá → confirm dialog | Dialog "Xác nhận xoá" với Huỷ/Xoá | r15-confirm.png |
| R16 | Tap Xoá | List quay về empty | r16-deleted.png |
| R17 | Switch segment Món ăn | **BUG 2**: icon trùng ingredient | r17-dish-empty.png |
| R18 | Tap CTA "Thêm món ăn" | Modal mở, form: name/desc/servings/items/totals | r18-dish-modal.png |
| R19 | Tạo lại banh_pho + chọn vào dish | Row banh_pho được thêm với amount/unit | r19-row-added.png |
| R20 | Tap "Lưu món ăn" (CTA cam) | Dish `pho_bo` lưu thành công, hiện trên list | r20-saved.png |
| R21 | Sau fix BUG 2 + rebuild | Empty state dish dùng `restaurant-outline` | r21-dish-empty-fixed.png |
| R22 | 3-dot dish | Bottom sheet "Tuỳ chọn cho pho_bo" Sửa/Xoá/Đóng | r22-dish-options.png |
| R23 | Tap Sửa dish | Modal "Sửa món ăn" pre-fill, có CTA "Lưu thay đổi" + "Xoá món ăn" đỏ | r23-dish-edit.png |
| R24 | Xoá row banh_pho trong form | Section nguyên liệu reset về empty state, totals = 0 | r24-row-deleted.png |
| R25 | Tap "Lưu thay đổi" với 0 item | Validation đỏ "Cần ít nhất 1 nguyên liệu..." | r25-validation.png |

Tất cả screenshot lưu ở `docs/3-design/audits/phase-1-emulator-parity-screenshots/`.

## 5. Hạng mục đã verify parity với mockup

### Ingredient list (`phase-1-ingredient-list.html`)
- Header tiêu đề + icon settings ✓
- Segment Nguyên liệu / Món ăn ✓
- Search bar với placeholder ✓
- Chip filter nhóm ✓
- Card: tên, nhóm, kcal, macro, đơn vị mặc định, 3-dot ✓
- Empty state có icon `nutrition-outline` + CTA "Thêm nguyên liệu" ✓

### Ingredient edit (`phase-1-ingredient-edit.html`)
- Modal full-screen với header back + Lưu ✓
- Field: Tên, Nhóm (picker), Đơn vị mặc định + chuẩn ✓
- Block dinh dưỡng theo basis ✓
- CTA "Lưu nguyên liệu" cam ✓
- Mode edit có thêm "Xoá nguyên liệu" đỏ ✓
- Validation đỏ khi field thiếu ✓

### Dish list (`phase-1-dish-list.html`)
- Empty state với icon `restaurant-outline` (sau fix) ✓
- CTA "Thêm món ăn" ✓
- Card: tên, badge type "Nguyên liệu", kcal, macros, "1 phần · Tự tạo", 3-dot ✓
- FAB tròn cam dấu + ✓

### Dish edit ingredient-based (`phase-1-dish-edit-ingredient-based.html`)
- Form: Tên, Mô tả, Số phần ăn ✓
- Section Nguyên liệu — empty state CTA "Thêm nguyên liệu đầu tiên" ✓
- Row nguyên liệu: tên + khối lượng quy đổi, X đỏ, Số lượng, dropdown Đơn vị ✓
- Totals tính tự động từ items × multiplier (factor_to_basis / nutrition_basis_quantity) ✓
- Validation: "Cần ít nhất 1 nguyên liệu trước khi lưu món ăn" ✓
- CTA "Lưu thay đổi" cam + "Xoá món ăn" đỏ trong mode edit ✓

## 6. Hạng mục không block (theo design hiện tại)

- Force-stop reset state là hành vi đúng cho local SQLite (không persist trong session), không phải bug.
- Calories = 0 trên dish khi ingredient có 0 kcal là đúng (banh_pho được tạo nhanh không nhập macro).

## 7. Tệp thay đổi

```
M src/app/features/management/management.page.ts
M src/app/shared/components/bottom-sheet-picker/bottom-sheet-picker.component.scss
A docs/3-design/audits/phase-1-emulator-parity-spec.md
A docs/3-design/audits/phase-1-emulator-parity-report.md (file này)
A docs/3-design/audits/phase-1-emulator-parity-screenshots/* (25 ảnh)
```

## 8. Khuyến nghị tiếp theo

1. Phase 1.5: bổ sung CTA "Tạo nguyên liệu mới" trong bottom-sheet picker khi ingredient list rỗng.
2. Bổ sung unit test cho `previewTotals` của `dish-edit-modal` để đảm bảo công thức `amount × factor_to_basis / basis_quantity` không regress.
3. Ghi nhận `--height: 70vh` thành design token để các bottom-sheet sau này đồng bộ.
