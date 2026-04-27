# Audit: Inconsistency style input — Onboarding vs Phase 1 modals

**Ngày:** 2026-04-27
**Scope:** `onboarding.page.ts` (Phase 0 — onboarding) vs `ingredient-edit-modal.component.ts` + `dish-edit-modal.component.ts` (Phase 1 — Quản lý)
**Files theme liên quan:**
- `src/theme/form-field.scss` (canonical input pattern, 134 LOC)
- `src/theme/form-modal.scss` (modal scaffolding, 161 LOC — chỉ Phase 1 dùng)

---

## Tóm tắt nhanh

✅ **Phần CHUNG đã consistent** — cả 3 form đều dùng đúng markup canonical:
```html
<div class="input-wrapper" [class.invalid]="hasError">
  <label class="input-label" [class.invalid]="hasError">…</label>
  <input class="input-native" />
</div>
```
và đúng `.picker-trigger--floating` cho select-like trigger. Border/padding/min-height/floating-label visual của riêng `.input-wrapper` là **identical**.

❌ **Nhưng có 7 điểm DRIFT thực sự gây cảm giác khác** giữa onboarding và Phase 1, nằm ở các CLASS **xung quanh** input chứ không phải bản thân input — và phần lớn do **redefinition trong onboarding inline styles** trong khi Phase 1 dùng theme dùng chung.

---

## Bảng các điểm khác biệt (theo mức độ ảnh hưởng visual)

| # | Điểm | Onboarding | Phase 1 modals | Hệ quả visual |
|---|---|---|---|---|
| 1 | `.field-error` (style **redefined**) | inline @ `onboarding.page.ts:637` → `padding:4px 4px 0; margin-bottom:4px;` (đẩy XUỐNG) | `form-modal.scss:156` → `margin-top:-8px;` (kéo LÊN, bù gap 16px của `.form-content`) | Khoảng cách giữa input và dòng lỗi **khác hẳn**. Onboarding: ~4px gap dưới input. Modal: lỗi gần như dán sát đáy input (-8px). |
| 2 | `.section-label` (redefined) | inline @ `:467` → `margin: 16px 0 8px` | `form-modal.scss:99` → `margin-top: 8px` (không margin-bottom) | Onboarding section-label có **24px tổng spacing** (16 trên + 8 dưới). Modal chỉ 8px trên. Cảm giác section trong modal "chật" hơn. |
| 3 | Wrapper field-level (`.form-field`) | Mỗi field bọc `<div class="form-field">` → margin-bottom 16px (rule global) | Cũng dùng `<div class="form-field">` NHƯNG nằm trong `.form-content { display:flex; gap:16px }` ⇒ rule `.form-content > .form-field { margin-bottom: 0 }` triệt margin. Spacing đến từ **flex gap**. | Tổng spacing tương đương 16px ở cả hai, nhưng cơ chế khác ⇒ khi bạn sửa `.form-field` margin trong tương lai, onboarding sẽ thay đổi còn modals **không**. Đây là **rủi ro drift trong tương lai**. |
| 4 | Field nằm trong **grid** (không bọc `.form-field`) | Onboarding **không có grid input** | `ingredient`: `.nutrition-grid` (4 input nutrition); `dish`: `.ingredient-item__grid` (Số lượng + Đơn vị). Input bọc `.input-wrapper` **trực tiếp**, KHÔNG có `.form-field`. | Trong grid, `.input-wrapper` không hưởng rule margin-bottom-0 từ `.form-content > .form-field` ⇒ đoạn lỗi (`.field-error`) bên dưới grid item bị `margin-top:-8px` đè lên input → **chồng đè trên mobile** khi xảy ra invalid (visual clipping nhỏ). Chỉ xuất hiện ở Phase 1. |
| 5 | `<textarea>` (chỉ dish "Mô tả") | Onboarding không có textarea | `dish:86` `<textarea class="input-native" rows="2" style="resize:none">` đặt trong `.input-wrapper` (min-height 56px, padding-top 20px) | Floating-label được thiết kế cho input 1 dòng. Textarea 2 dòng làm padding-top 20px **ăn vào dòng đầu**, dòng 2 trông gần label → **không cân đối** so với input number/text khác. Đây là pattern đầu tiên có textarea ⇒ cần extension `.input-native--textarea`. |
| 6 | a11y trên invalid | Onboarding **có đầy đủ** `[attr.aria-invalid]`, `[attr.aria-describedby]`, error `id="err-…" role="alert"` (xem `:184, :213, :238`) | Phase 1 modals **không có** `aria-invalid`, không có `aria-describedby`; `.field-error` không có `id` và không có `role="alert"` | Screen-reader user không nghe được lỗi trong Phase 1. **Inconsistency a11y rõ rệt**. |
| 7 | Input `id` naming | Slug có nghĩa: `field-height`, `field-weight`, `field-age` | Số thứ tự máy: `ingr-field-1` … `ingr-field-10`, `dish-field-1` … `dish-field-3` | Không ảnh hưởng visual nhưng test/QA và DevTools đọc khó. Nên đặt `ingr-field-name`, `dish-field-servings` v.v. |

---

## Vì sao có drift dù cả 3 đều "đúng pattern"?

Nguyên nhân gốc: **onboarding redefine 4 class** (`.section-label`, `.segment-*`, `.field-error`, layout typography) bằng inline styles trong `onboarding.page.ts:560-700` thay vì dùng từ `form-modal.scss`. Lý do lịch sử:
- Onboarding **không phải** modal ⇒ không link `form-modal.scss` (chính xác).
- Nhưng `.section-label` và `.field-error` lẽ ra nên ở 1 file **dùng chung hơn** (ví dụ `form-field.scss` hoặc tách `form-typography.scss`) để onboarding **không cần redefine**.

Đó là lý do `.field-error` margin-top âm trong modal và margin-bottom dương trong onboarding — **2 file khác nhau, người viết khác thời điểm**.

---

## Đề xuất fix (sorted theo ROI)

### Mức 1 — Hợp nhất `.field-error` & `.section-label` (HIGH ROI, low risk)
1. Move `.field-error` và `.section-label` từ `form-modal.scss` (lines 99-112, 156-161) sang `form-field.scss` để dùng chung **toàn app**.
2. Dùng version onboarding (`padding:4px 4px 0; margin-bottom:4px`) làm canonical — vì nó **không phụ thuộc** vào `.form-content` flex-gap, hoạt động đúng trong **cả** layout (grid + non-grid + modal + onboarding).
3. Xóa redefinition trong `onboarding.page.ts:637-642` và `onboarding.page.ts:467-471`.
4. Verify modal: do bỏ `margin-top:-8px`, gap modal sẽ tăng từ ~8px → ~12px khi có lỗi. Đây là **đúng** spacing — version âm trước đây chỉ là hack chống flex-gap.

### Mức 2 — Fix grid input (MEDIUM ROI)
- Trong `.nutrition-grid` (ingredient) và `.ingredient-item__grid` (dish), nên bọc mỗi item bằng `<div class="form-field">` cho **đồng nhất** với layout ngoài grid; nếu vướng grid spacing thì thêm rule:
  ```scss
  .nutrition-grid > .form-field,
  .ingredient-item__grid > .form-field { margin-bottom: 0; }
  ```

### Mức 3 — Thêm pattern textarea (LOW-MEDIUM ROI)
- Thêm modifier `.input-native--textarea` vào `form-field.scss`:
  ```scss
  textarea.input-native { padding-top: 4px; min-height: 64px; line-height: 1.5; }
  .input-wrapper:has(textarea.input-native) { min-height: auto; padding-top: 24px; padding-bottom: 12px; }
  ```
- Áp vào `dish-field-2` (Mô tả).

### Mức 4 — Đồng nhất a11y (HIGH a11y ROI, mechanical)
- Thêm cho **mọi** field trong `ingredient-edit-modal` và `dish-edit-modal`:
  - `[attr.aria-invalid]="showErrors && hasError ? 'true' : null"`
  - `[attr.aria-describedby]="showErrors && hasError ? 'err-<field>' : null"`
  - `<div id="err-<field>" class="field-error" role="alert">…</div>`
- Dùng pattern `<field>-error` cho `id` để dễ test.

### Mức 5 — Đặt lại `id` field (LOW ROI cosmetic)
- `ingr-field-1` → `ingr-field-name`, `ingr-field-2` → `ingr-field-calories`, v.v.
- Áp tương tự cho dish.

---

## Kết luận ngắn gọn

> Cảm giác "không consistent" của bạn **đúng và có cơ sở**: chính xác là **2 điểm**: (a) khoảng cách giữa input và **error message** khác nhau (margin-top âm trong modal vs margin-bottom dương trong onboarding); và (b) `.section-label` modal "dính" hơn so với onboarding.
> Phần input core (border, label nổi, focus ring, dark-mode, picker-trigger) thì **giống nhau hoàn toàn** vì cùng dùng `form-field.scss`.

Sau khi áp Mức 1 + Mức 4, 90% inconsistency biến mất. Mức 2-3-5 là tinh chỉnh.

---

## Phụ lục — locations cụ thể

- Onboarding `.field-error`: `src/app/features/onboarding/onboarding.page.ts:637-642`
- Modal `.field-error`: `src/theme/form-modal.scss:156-161`
- Onboarding `.section-label`: `src/app/features/onboarding/onboarding.page.ts:467-471`
- Modal `.section-label`: `src/theme/form-modal.scss:99-112`
- Canonical pattern docstring: `src/theme/form-field.scss:1-23` (đồng bộ với CLAUDE.md "Form Inputs" section và `docs/3-design/design-system.md §8.6`)
- Grid không bọc `.form-field`:
  - `src/app/shared/components/ingredient-edit-modal/ingredient-edit-modal.component.ts:165-218` (4 nutrition inputs)
  - `src/app/shared/components/dish-edit-modal/dish-edit-modal.component.ts:151-189` (Số lượng + Đơn vị)
- Textarea: `src/app/shared/components/dish-edit-modal/dish-edit-modal.component.ts:84-93`
- a11y có ở onboarding: `:183-184, :212-213, :238-239`
- a11y thiếu ở modal: ingredient lines `83, 98, 141`; dish lines `69, 97, 153`
