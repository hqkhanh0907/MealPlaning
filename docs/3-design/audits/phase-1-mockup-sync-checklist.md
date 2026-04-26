# Phase 1 Mockup Sync Checklist

Status: In progress
Date: 2026-04-25
Owner: UX/UI Audit

## 1. Source of truth ưu tiên

1. `docs/4-architecture/business-rules.md`
   - Source of truth cao nhất khi mockup/doc cũ mâu thuẫn.
   - Xác nhận:
     - Quick Add đã bị loại bỏ khỏi V1.
     - Dish total luôn derived từ `dish_with_totals`.
     - `dish_ingredient` dùng `unit_id` + `normalized_amount`.
     - Approximate unit được phép nhưng phải hiển thị `≈` / `ước lượng`.

2. `docs/2-requirements/prd.md`
   - Xác nhận shape mới của Ingredient / Dish / DishIngredient.
   - Ingredient form phải phản ánh `ingredient_unit[]`, `is_default`, `factor_to_basis`, `density_g_per_ml` optional.
   - Dish form phải nhập theo unit hợp lệ của từng ingredient, không còn `amount_unit` cố định kiểu cũ.

3. `docs/3-design/data-model.md`
   - Xác nhận schema mới: `unit`, `ingredient_unit`, `dish_ingredient.unit_id`.
   - Xác nhận display label, approximate marker, density fallback.

4. `docs/3-design/design-system.md`
   - Xác nhận token, hierarchy, button/dialog/bottom-sheet/search/select patterns.
   - Rule quan trọng:
     - `N >= 6` options => BottomSheetPicker.
     - Form save luôn active, invalid thì scroll tới lỗi đầu tiên.
     - Confirm dialog dùng secondary label kiểu “Giữ lại”.

5. `docs/5-development/phase-1-management.md`
   - Dùng làm implementation context của Phase 1.
   - Có một số nội dung chưa sync với docs mới hơn; chỉ dùng khi không mâu thuẫn với 4 tài liệu trên.

6. `docs/3-design/mockups/README.md`
   - Nhắc rằng mockup phải sync với schema/code/docs mới nhất.

## 2. Discrepancy lớn đã phát hiện trước khi sửa

### A. `phase-1-ingredient-edit.html`
Priority: Critical
- Vẫn dùng model cũ “Khi thêm vào món, bạn muốn nhập bằng: g / ml / Đơn vị”.
- Vẫn có flow conditional `grams_per_unit` cho `piece`.
- Chưa phản ánh `ingredient_unit[]`, `is_default`, `display_label`, `factor_to_basis`, `density_g_per_ml`.
- Design spec notes cuối file vẫn nhắc `grams_per_unit`.

### B. `phase-1-dish-edit-ingredient-based.html`
Priority: Critical
- Amount sheet vẫn hardcode unit cũ `g` + `piece`.
- Chưa phản ánh ingredient-specific labels (`quả`, `tép`, `muỗng canh`...) và approximate marker.
- Spec notes cuối file chưa mô tả unit resolver / display label / `≈` state.

### C. `phase-1-dish-list.html`
Priority: Medium
- Đã sync Quick Add -> AI ở list level, nhưng wording FAB/AI cần audit lại vì `phase-1-management.md` còn lệch scope.
- Cần giữ note discrepancy giữa phase plan và docs mới hơn, không tự suy diễn thêm flow ngoài evidence.

### D. `phase-1-ingredient-list.html`
Priority: Medium
- Core list states nhìn chung đúng.
- Cần audit copy, dialog actions, category/source badge, unit-related metadata exposure.
- Nếu không có requirement bắt buộc hiển thị unit ở list, không thêm mới ngoài doc.

## 3. Kế hoạch cập nhật theo file

### 3.1 `phase-1-ingredient-edit.html`
- Đổi section unit từ radio cũ sang danh sách unit hợp lệ.
- Thêm trạng thái:
  - empty unit state
  - filled unit list
  - ingredient-specific/default unit
  - approximate unit badge
  - optional density field
  - validation cho “ít nhất 1 unit” / “chọn 1 default unit”
- Update spec notes tương ứng.

### 3.2 `phase-1-dish-edit-ingredient-based.html`
- Đổi amount sheet để hiển thị unit theo ingredient:
  - unit label thân thiện
  - default unit
  - exact vs approximate
- Update preview copy để phản ánh conversion layer mới.
- Update spec notes về `unit_id`, display label, approximate unit.

### 3.3 `phase-1-dish-list.html`
- Giữ các state list/search/dialog đang đúng.
- Chỉ sửa những phần mâu thuẫn rõ ràng với docs mới hơn.
- Ghi nhận conflict về AI scope trong final report nếu không đủ evidence để unify hoàn toàn.

### 3.4 `phase-1-ingredient-list.html`
- Giữ list/search/empty/dialog nếu đã khớp.
- Chỉ sửa copy/action label nếu lệch với design-system/business rules.

## 4. Rủi ro / điểm cần chú ý

1. `phase-1-management.md` hiện còn dấu vết Quick Add và AI scope cũ.
2. Mockup README có dấu hiệu đã sync một phần theo C-02 nhưng chưa sync toàn bộ.
3. Cần tránh “thiết kế lại” flow ngoài phạm vi unit redesign và rule mới.
4. Mọi thay đổi phải được preview bằng browser/visual review, không chỉ sửa text.

## 5. Tiêu chí accept cho đợt sync này

- Không còn `grams_per_unit`, `default_entry_unit`, `amount_unit`, `piece` hardcoded theo model cũ ở các mockup Phase 1 chính.
- Ingredient form phản ánh rõ `ingredient_unit[]` + default unit + approximate marker + density optional.
- Dish ingredient entry phản ánh unit per ingredient thay vì enum cứng.
- Mockup vẫn tuân thủ token, spacing, dialog, bottom sheet, search, CTA rules trong design system.
- Mọi khác biệt còn lại giữa docs được ghi rõ trong final audit report.