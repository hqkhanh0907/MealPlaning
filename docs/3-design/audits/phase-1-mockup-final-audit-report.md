# Phase 1 Mockup Final Audit Report

Ngày: 2026-04-26
Trạng thái: Hoàn thành audit + sync mockup + review trực quan
Phạm vi: Mockup Phase 1 thuộc luồng Quản lý nguyên liệu và món ăn

## 1. Executive Summary

Đợt audit này đã đồng bộ lại các mockup Phase 1 với source of truth mới nhất của project sau khi rule về unit/model thay đổi.

Các thay đổi trọng tâm đã được áp dụng:
- Loại bỏ tư duy model cũ dựa trên `default_entry_unit`, `grams_per_unit`, `amount_unit` cứng.
- Đồng bộ mockup theo mô hình `unit` + `ingredient_unit` + `unit_id`.
- Thể hiện rõ approximate unit bằng `≈` / `ước lượng`.
- Đồng bộ rule chuyển đổi cross-dimension theo thứ tự: factor curated -> density -> reject.
- Giữ total dish là giá trị derived từ danh sách nguyên liệu, không cho user hiểu nhầm là editable trực tiếp.
- Loại bỏ/không tái đưa Quick Add vào V1.
- Giảm technical jargon trong copy hiển thị cho user.

Kết quả cuối cùng:
- 4 mockup chính đã được audit, patch và preview thực tế.
- Đã thực hiện ít nhất 12 vòng review trực quan có ghi nhận rõ.
- Browser console ở các vòng review gần nhất đều sạch: không có JS error.
- Không còn blocker trực quan lớn ở 4 mockup chính.
- Còn một số điểm polish nhỏ, nhưng không phải mismatch bắt buộc phải sửa trước khi dùng làm nguồn tham chiếu tiếp theo.

## 2. Source of Truth đã dùng

Thứ tự ưu tiên khi tài liệu mâu thuẫn:
1. `docs/4-architecture/business-rules.md`
2. `docs/2-requirements/prd.md`
3. `docs/3-design/data-model.md`
4. `docs/3-design/design-system.md`
5. `docs/5-development/phase-1-management.md`
6. `docs/3-design/mockups/README.md`

Lý do:
- `business-rules.md` là nơi phản ánh rule nghiệp vụ và normalize logic mới nhất.
- `phase-1-management.md` vẫn còn dấu vết drift cũ ở một số chỗ, nên chỉ dùng như implementation context phụ.

## 3. Quyết định đã chốt làm căn cứ audit

1. Giữ hướng kiến trúc `Phương án C + density tùy chọn`.
2. Mỗi ingredient chỉ có 1 nutrition basis authoritative: `100g` hoặc `100ml`.
3. Cross-dimension conversion theo thứ tự:
   - `ingredient_unit.factor_to_basis`
   - nếu không có thì `ingredient.density_g_per_ml`
   - nếu vẫn không có thì reject.
4. Approximate unit được phép trong Phase 1, nhưng phải hiển thị `≈` hoặc `ước lượng`.
5. Không gộp `sugar/sodium` vào đợt redesign unit này.
6. Quick Add không thuộc V1 hiện tại.
7. Copy trong mockup phải user-facing, không lộ chi tiết implementation như `normalized_amount`, `factor_to_basis`, `density_g_per_ml` nếu không cần.

## 4. Files đã audit và cập nhật

### 4.1 Files tài liệu / context đã sync
- `docs/2-requirements/prd.md`
- `docs/3-design/data-model.md`
- `docs/4-architecture/business-rules.md`
- `docs/5-ai/ai-strategy.md`
- `docs/5-development/phase-1-management.md`
- `docs/4-architecture/adr-ingredient-unit-macro-decision.md`
- `docs/4-architecture/ingredient-unit-macro-delta-checklist.md`
- `docs/3-design/audits/ingredient-unit-redesign.md`
- `docs/3-design/audits/phase-1-mockup-sync-checklist.md`

### 4.2 Mockup files chính đã patch
- `docs/3-design/mockups/phase-1-ingredient-edit.html`
- `docs/3-design/mockups/phase-1-dish-edit-ingredient-based.html`
- `docs/3-design/mockups/phase-1-dish-list.html`
- `docs/3-design/mockups/phase-1-ingredient-list.html`

## 5. Documentation Audit Summary

### 5.1 Những điểm đã xác nhận đúng
- PRD, data model và business rules đã được sync về hướng `unit` + `ingredient_unit` + `unit_id`.
- Rule derived total và approximate unit đã được phản ánh trong docs cốt lõi.
- Design system tiếp tục là căn cứ đúng cho token, spacing, dialog, search, CTA hierarchy, bottom sheet.

### 5.2 Những điểm đã phát hiện drift
- `phase-1-management.md` còn một số dấu vết scope/copy cũ, đặc biệt quanh Quick Add/AI/scope plan.
- Mockup cũ ở 2 màn edit lệch nhiều nhất so với docs mới:
  - `phase-1-ingredient-edit.html`
  - `phase-1-dish-edit-ingredient-based.html`

### 5.3 Kết luận documentation audit
- Tài liệu cốt lõi đã đủ để sync mockup nếu ưu tiên đúng hierarchy.
- Planning doc không còn đáng tin như source of truth chính khi có conflict.

## 6. Mockup Audit theo từng màn hình

### 6.1 `phase-1-ingredient-edit.html`

#### Trước khi sửa
- Còn tư duy nhập liệu kiểu cũ theo `g/ml/Đơn vị`.
- Còn logic/copy gắn với `grams_per_unit`.
- Chưa phản ánh `ingredient_unit[]`, default unit, approximate unit, density optional.
- Còn technical wording quá nhiều trong UI hiển thị.

#### Đã cập nhật
- Chuyển sang danh sách đơn vị hợp lệ của nguyên liệu.
- Thêm các trạng thái:
  - empty state khi chưa có đơn vị
  - list đơn vị đã cấu hình
  - default unit
  - approximate unit với marker `≈`
  - optional density field
  - validation cho thiếu đơn vị / thiếu default
- Đổi copy hiển thị theo hướng user-facing:
  - bỏ các từ như `basis`, `Unit registry`, `Bridge`, `exact`
  - dùng các cụm như `dinh dưỡng theo 100g`, `quy đổi g ↔ ml`, `chuẩn`, `hiển thị`
- Tinh chỉnh hierarchy và usability:
  - làm CTA `+ Thêm đơn vị` rõ hơn
  - tách rõ `Lưu thay đổi` và `Xóa nguyên liệu`
  - cân lại top bar/back button

#### Kết luận
- Đây là màn được sửa nhiều nhất và hiện đã khớp tốt với model mới.

### 6.2 `phase-1-dish-edit-ingredient-based.html`

#### Trước khi sửa
- Bottom sheet amount còn hardcode logic unit cũ.
- Chưa phản ánh ingredient-specific units.
- Chưa thể hiện rõ approximate unit / reject state / total derived.
- Copy còn quá kỹ thuật.

#### Đã cập nhật
- Bottom sheet chọn đơn vị theo từng ingredient.
- Hiển thị default unit, approximate unit và copy thân thiện hơn.
- Thêm/điều chỉnh:
  - reject state user-facing khi không có quy đổi hợp lệ
  - helper nói rõ tổng dinh dưỡng được tính tự động từ danh sách nguyên liệu hiện tại
  - CTA empty-state: `+ Thêm nguyên liệu đầu tiên`
  - secondary action `Đóng` -> `Hủy`
  - hit area delete icon = 44x44
  - tách rõ `Lưu thay đổi` và `Xóa món ăn`
- Giảm technical wording:
  - bỏ `normalized`, `basis`, `User đang chọn`, các mô tả quá nội bộ

#### Kết luận
- Màn này hiện phản ánh đúng hơn flow nhập nguyên liệu theo unit-specific model.

### 6.3 `phase-1-dish-list.html`

#### Trước khi sửa
- Nhìn chung đúng hướng hơn 2 màn edit, nhưng cần audit lại semantics, copy, hierarchy, spacing.
- Cần xác nhận không kéo Quick Add quay lại V1.

#### Đã cập nhật
- Tinh chỉnh search semantics/a11y.
- Rà lại copy FAB menu theo 2 hướng còn lại:
  - `Tạo món từ nguyên liệu`
  - `AI tự điền từ tên món`
- Tăng khoảng cách giữa content và kebab menu.
- Đẩy kebab ra 8px, tăng right padding card.
- Loại FAB ở full empty-state để tránh cạnh tranh với CTA inline.
- Thêm border rõ hơn cho cancel action trong dialog.

#### Kết luận
- Không còn blocker trực quan lớn.
- Còn một số điểm consistency nhỏ nhưng không bắt buộc phải sửa ngay.

### 6.4 `phase-1-ingredient-list.html`

#### Trước khi sửa
- Core flow/list state tương đối ổn nhưng cần polish copy, dialog, chip, spacing, a11y.

#### Đã cập nhật
- Tinh chỉnh semantics/a11y cho search, dialog, filter chips.
- Tăng khoảng cách card ↔ kebab.
- Tăng khoảng cách filter row.
- Tăng gap ở blocked delete dialog.
- Thêm border rõ hơn cho cancel action trong dialog.
- Tinh chỉnh empty-state top padding.

#### Kết luận
- Màn này đã ổn định tốt, không thấy mismatch trực quan nghiêm trọng.

## 7. Kết quả visual verification

### 7.1 Phương pháp
- Preview trực tiếp các file HTML local bằng browser.
- Dùng browser vision để review hierarchy, spacing, overflow, dialog, empty state, CTA, badge, a11y affordance.
- Dùng browser console như sanity check để phát hiện JS/runtime issue.

### 7.2 Kết quả chung
- Tất cả 4 mockup chính đều render được trong browser local.
- Browser console ở các vòng gần nhất đều sạch:
  - `console_messages: []`
  - `js_errors: []`
  - `total_errors: 0`
- Không thấy lỗi render blocker sau các đợt patch gần nhất.

## 8. Log các vòng review trực quan

Dưới đây là log tổng hợp các round đã được thực hiện và ghi nhận rõ trong quá trình làm việc:

1. Round 1 - `phase-1-ingredient-edit.html`
   - Kiểm tra tổng thể layout, hierarchy, spacing, action clarity.
   - Kết quả: render ổn, nhưng copy còn kỹ thuật và action hierarchy cần polish.

2. Round 2 - `phase-1-dish-edit-ingredient-based.html`
   - Kiểm tra bottom sheet, preview, reject state, spacing, readability.
   - Kết quả: không có render blocker, nhưng copy và hierarchy cần user-facing hơn.

3. Round 3 - `phase-1-dish-list.html`
   - Kiểm tra card spacing, kebab, empty state, FAB, dialog.
   - Kết quả: không có blocker lớn, còn các tinh chỉnh semantics/a11y và spacing.

4. Round 4 - `phase-1-ingredient-list.html`
   - Kiểm tra list/card/dialog/filter chips/search states.
   - Kết quả: không có blocker lớn, còn polish nhỏ cho spacing và semantics.

5. Round 5 - `phase-1-ingredient-edit.html`
   - Kiểm tra top bar touch target, helper text, CTA `+ Thêm đơn vị`, cuối form.
   - Kết quả: ổn hơn, chuyển trọng tâm sang polish.

6. Round 6 - `phase-1-dish-edit-ingredient-based.html`
   - Kiểm tra top bar, picker meta, preview/reject message, CTA empty state, hierarchy cuối form.
   - Kết quả: ổn hơn, còn polish copy và readability.

7. Round 7 - `phase-1-ingredient-edit.html`
   - Sau khi khử technical jargon.
   - Kết quả: copy user-facing hơn rõ rệt, không còn blocker lớn.

8. Round 8 - `phase-1-dish-edit-ingredient-based.html`
   - Sau khi khử technical jargon, đổi `Hủy`, tăng hit area.
   - Kết quả: empty state, reject state, picker meta và action clarity tốt hơn, không còn blocker lớn.

9. Round 9 - `phase-1-dish-list.html`
   - Kiểm tra hierarchy card, spacing content ↔ kebab, dialog delete, FAB menu, empty state, search state.
   - Kết quả: đi đúng hướng, còn một số điểm consistency nhỏ; không thấy mismatch bắt buộc phải sửa.

10. Round 10 - `phase-1-ingredient-list.html`
    - Kiểm tra hierarchy card, filter chips, blocked/normal delete dialog, search states, empty-state CTA.
    - Kết quả: nhìn chung pass, không có mismatch trực quan nghiêm trọng.

11. Round 11 - `phase-1-dish-list.html`
    - Sau khi tăng right padding card, đẩy kebab, bỏ FAB ở full empty-state.
    - Kết quả: pass; spacing tốt hơn, full empty-state đúng hierarchy hơn. Chỉ còn potential inconsistency nhỏ giữa full empty-state và no-result CTA model.

12. Round 12 - `phase-1-ingredient-list.html`
    - Sau khi tăng right padding, tăng spacing filter row, tăng gap dialog blocked, tinh chỉnh empty-state top padding.
    - Kết quả: pass; không còn mismatch lớn bắt buộc phải sửa.

## 9. Các thay đổi trực quan quan trọng nhất

1. Bỏ model unit cũ khỏi 2 màn edit.
2. Chuyển sang unit-specific entry model ở ingredient/dish flow.
3. Đưa approximate marker vào UI thay vì silent exact hóa.
4. Chuyển reject/error copy sang ngôn ngữ người dùng hiểu được.
5. Làm rõ total dish là giá trị derived.
6. Tách rõ primary CTA và destructive action.
7. Tăng touch target cho icon delete/kebab.
8. Giảm jargon kỹ thuật trong UI.
9. Đồng bộ dialog/button hierarchy tốt hơn.
10. Cân lại empty-state CTA để tránh cạnh tranh với FAB ở nơi không cần thiết.

## 10. Remaining discrepancies / open notes

Các điểm còn lại ở mức minor polish, không phải blocker:

1. `phase-1-dish-list.html`
   - CTA model giữa full empty-state và search no-result chưa hoàn toàn đồng nhất về hình thức.
   - Có thể giữ nếu đây là chủ đích theo use case, hoặc thống nhất thêm sau.

2. `phase-1-dish-list.html` và `phase-1-ingredient-list.html`
   - Footer balance của một số dialog vẫn có thể polish thêm về cảm giác thị giác.

3. `phase-1-ingredient-list.html`
   - Vùng phải của card vẫn hơi nặng thị giác do info + kebab cùng dồn về bên phải, nhưng chưa tới mức lỗi.

4. `docs/5-development/phase-1-management.md`
   - Vẫn cần một lượt cleanup sâu hơn ở tương lai nếu muốn mọi planning note đồng nhất hoàn toàn với docs mới.

## 11. Bằng chứng thay đổi ở mức repo

Theo `git diff --stat`, các thay đổi liên quan đợt sync này tập trung ở:
- PRD
- data model
- business rules
- AI strategy
- phase plan
- 4 mockup chính

Snapshot diff stat gần nhất cho nhóm file chính:
- `docs/2-requirements/prd.md` đổi nhẹ
- `docs/3-design/data-model.md` đổi vừa
- `docs/4-architecture/business-rules.md` đổi vừa
- `docs/5-ai/ai-strategy.md` đổi nhẹ
- `docs/5-development/phase-1-management.md` đổi vừa
- `phase-1-ingredient-edit.html` và `phase-1-dish-edit-ingredient-based.html` là 2 file được rewrite mạnh nhất
- `phase-1-dish-list.html` và `phase-1-ingredient-list.html` được polish nhiều vòng

## 12. Final Assessment

### Trạng thái tổng thể
Pass.

### Mức độ hoàn thành
- Sync docs nền tảng: Hoàn thành
- Sync 4 mockup chính: Hoàn thành
- Visual review >= 10 vòng: Hoàn thành (12 vòng)
- Fix blocker trực quan: Hoàn thành
- Ghi nhận ambiguity/risk còn lại: Hoàn thành

### Kết luận cuối
Bộ mockup Phase 1 hiện đã khớp tốt với source of truth mới nhất của project, đặc biệt ở các phần bị ảnh hưởng trực tiếp bởi unit redesign. Hai màn nặng nhất (`ingredient-edit` và `dish-edit-ingredient-based`) đã được kéo về đúng model mới; hai màn list đã được review và polish đến mức không còn mismatch nghiêm trọng.

Có thể dùng bộ mockup hiện tại làm nền tham chiếu tiếp theo cho:
- implementation UI thật
- review feature Phase 1
- kiểm tra consistency giữa docs và code
- handoff cho AI/dev khi tiếp tục phát triển

## 13. File tham chiếu liên quan

- `docs/3-design/audits/phase-1-mockup-sync-checklist.md`
- `docs/3-design/audits/ingredient-unit-redesign.md`
- `docs/4-architecture/adr-ingredient-unit-macro-decision.md`
- `docs/4-architecture/ingredient-unit-macro-delta-checklist.md`
- `docs/3-design/mockups/phase-1-ingredient-edit.html`
- `docs/3-design/mockups/phase-1-dish-edit-ingredient-based.html`
- `docs/3-design/mockups/phase-1-dish-list.html`
- `docs/3-design/mockups/phase-1-ingredient-list.html`
