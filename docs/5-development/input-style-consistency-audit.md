# Input Style Consistency Audit — Onboarding vs Phase 1 Modals

Ngày: 2026-04-27
Sau commit: `fc1e3e4` (B1: adopt `<app-form-field>` wrapper)
Cập nhật 2026-04-27 (B5 DONE): tất cả 3 form (`onboarding step 2a`, `ingredient-edit-modal`, `dish-edit-modal`) đã migrate sang **Signal Forms**. `errorMessage` literal vẫn còn trong modal (xem §7) — sẽ chuyển sang `schema()` `*Error({ message })` ở vòng cleanup tiếp theo (không nằm trong B1-B5 core).
Phạm vi: `src/app/features/onboarding/onboarding.page.ts` vs `src/app/shared/components/{ingredient,dish}-edit-modal/*.component.ts`
Tham chiếu CSS: `src/theme/form-field.scss` (canonical), `src/theme/form-modal.scss` (modal-only)

---

## TL;DR

Sau B1, **markup `<input>` đã giống nhau 100%**: cả 3 form đều render
`<app-form-field>` → `.input-wrapper > .input-label + .input-native` cùng từ
`form-field.scss`. Floating label, viền, focus, invalid → identical.

8 điểm còn khác biệt chia làm 3 nhóm:

- **Nhóm 1 — Cosmetic, by design** (3 điểm): khác là đúng vì khác context
  (page vs modal) — KHÔNG cần fix.
- **Nhóm 2 — Inconsistency thật** (4 điểm): nên align trong B2-B5 hoặc patch
  riêng.
- **Nhóm 3 — Field non-input ở onboarding** (1 điểm): segment-control,
  radio-card, slider — không phải input text → ngoài scope §8.6, có visual
  language riêng.

---

## Nhóm 1 — Cosmetic, by design (KHÔNG cần fix)

### 1. Container background

| | Onboarding | Modal |
|--|--|--|
| Parent | `ion-content` (page bg, `--ion-background-color`) | `.modal` panel (`--bg-card`) |
| `.input-wrapper` bg | `--bg-card` | `--bg-card` |

→ Input wrapper luôn `--bg-card`, nhưng:
- Trên onboarding: page bg ≈ card bg → wrapper "phẳng" với background.
- Trên modal: modal panel có shadow/elevation tách khỏi overlay → input nổi
  rõ hơn về depth.

**Đánh giá**: by design — modal phải có affordance "đây là form bên trong
panel". Không fix.

### 2. Action button placement

| | Onboarding | Modal |
|--|--|--|
| Primary action | `Tiếp` / `Hoàn thành` ở bottom (full width) | `Lưu` ở toolbar top-right + `btn-cta` bottom |

→ Modal có 2 entry-point save (toolbar + bottom CTA), onboarding chỉ có 1
nút bottom.

**Đánh giá**: by design — modal stick toolbar cho UX nhanh, onboarding
wizard cần bottom CTA cho thumb reach. Không fix.

### 3. Header style

| | Onboarding | Modal |
|--|--|--|
| Title element | `.step-title` (22px/700, page) | `<h2 id="...-modal-title">` trong `.modal-toolbar` |
| Subtitle | `.step-subtitle` (16px/500, tertiary) | (không có) |

**Đánh giá**: by design. Không fix.

---

## Nhóm 2 — Inconsistency thật (cần xem xét)

### 4. Spacing giữa field — về số đều ra 16px nhưng cơ chế khác

`form-field.scss`:
```scss
.form-field { margin-bottom: 16px; }                         // default

.form-content > .form-field { margin-bottom: 0; }            // modal: gap 16
:where(.nutrition-grid, .unit-grid, ...) > .form-field {
  margin-bottom: 0;                                          // grid: gap 12
}
```

`form-modal.scss`:
```scss
.form-content { display: flex; gap: 16px; }
```

Onboarding `.step-content`: **không có** `display: flex` hay `gap`. Mỗi field
có margin-bottom 16px (default).

**Hệ quả**:
- Modal: parent flex + override → 16px nhất quán giữa MỌI direct child (field,
  section-label, info-card, button…).
- Onboarding: 16px chỉ áp dụng cho `.form-field`. Section-label có
  `margin: 16px 0 8px` → tổng cộng giữa input cuối cùng và section-label kế
  tiếp = `16 (field mb) + 16 (label mt) = 32px` (modal cũng vậy do flex gap
  reset margin nhưng section-label sống chung gap 16). Cần đo lại bằng tay.

**Risk**: drift khi thêm field-non-input vào onboarding (segment-control,
radio-card) — chúng không có `.form-field` margin → spacing rỗng.

**Khuyến nghị**: B5 thêm `.step-content { display: flex; flex-direction:
column; gap: 16px; }` (như `.form-content`) + override
`.step-content > .form-field { margin-bottom: 0; }`. Hai nơi cùng cơ chế →
hết drift.

### 5. `.form-field` raw vs `<app-form-field>` ở onboarding — RESOLVED

~~Pattern cũ~~: onboarding bao segment "Giới tính" bằng `<div class="form-field">` thừa.
**Đã unwrap** (commit fix #5): label + control + error là siblings direct
của `.step-content`, giống hệt modal segment `nutrition_basis_unit`. Pattern
non-input control giờ thống nhất 2 nơi.

`onboarding.page.ts:232` còn 1 chỗ dùng `<div class="form-field">` raw bao
quanh segment-control "Giới tính":

```html
<div class="form-field">
  <span class="section-label segment-label" [class.invalid]="...">Giới tính</span>
  <div class="segment-control" ...>
    <!-- 2 button Nam/Nữ -->
  </div>
  @if (step2aErrors().gender) {
    <div class="field-error">...</div>
  }
</div>
```

→ Class `.form-field` (đếm spacing) dùng chung với input text, nhưng nội dung
bên trong KHÔNG phải canonical pattern. Pattern guard hiện cho phép vì wrapper
tag là `div.form-field`, không phải `.input-wrapper`.

**Đánh giá**: chấp nhận được vì segment-control là field non-input. Nhưng
inconsistent với modal nơi mỗi field text → `<app-form-field>`, mỗi field
non-input (segmented `nutrition_basis_unit` ở ingredient modal) → KHÔNG bao
bằng `.form-field` mà chỉ có `.section-label` + `.segmented`.

**Khuyến nghị**: B5 quyết định 1 trong 2:
- (a) Bỏ `.form-field` wrapper ở onboarding gender → giống modal (chỉ
  `.section-label` + control).
- (b) Thêm `.form-field` wrapper ở modal nutrition_basis_unit → giống
  onboarding.

Em đề xuất (a) — segment đứng độc lập ngoài form-field, để `<app-form-field>`
chỉ dành cho field có `<input>`/`<button.picker-trigger>`.

### 6. Số character allowed trên input width — RESOLVED (false alarm)

**Verified 360dp**: label dài nhất trong `.nutrition-grid` là "Chất xơ (g)" = 63px tại 12px floating size. Cell width @ 360dp ≈ 158px → margin còn ~95px. Không wrap, không truncate. Emulator QA xác nhận. **No code change needed.**

### 6-original. Số character allowed trên input width (concern raised)

Cả 2 đều dùng `.input-native { width: 100% }`. Modal có `.nutrition-grid`
2-column (mỗi cell `1fr`); onboarding height/weight/age full-width.

**Hệ quả**: chữ "Calories (kcal)" 14 ký tự lọt 1-column nhưng trong
2-column grid trên màn 360px (Galaxy A50, min spec) sẽ bị truncate hoặc
wrap label. Test tại width=360: nutrition-grid cell ≈ 156px → label "Calories
(kcal)" wrap 2 dòng → đẩy `padding-top` của input.

**Khuyến nghị**: kiểm tra trên emulator 360dp (Pixel 4a portrait) — nếu
label wrap, `.input-wrapper` cần `min-height: auto` hoặc tăng padding-top.
Đây là issue tiềm ẩn, không phải khác biệt direct với onboarding (onboarding
luôn 1-column nên không gặp).

### 7. `errorMessage` source

| | Onboarding | Ingredient modal | Dish modal |
|--|--|--|--|
| Cơ chế | `[errorMessage]="step2aErrors().heightCm"` (signal-derived string) | `errorMessage="Vui lòng nhập tên..."` (hard-coded literal) + `[invalid]="showErrors && !form.name.trim()"` | tương tự ingredient |

→ Onboarding đã lưu message ở 1 chỗ (`step2aErrors`), modal mỗi field một
literal. Khi text validation thay đổi (ví dụ "Vui lòng nhập" → "Bắt buộc nhập"
), modal phải sửa nhiều chỗ.

**Khuyến nghị**: B2 (Signal Forms migration) sẽ giải quyết — schema sẽ
return `requiredError({ message: 'Bắt buộc nhập' })` từ
`shared/forms/schemas/common.ts`, không còn literal trong template. Sau B2-B4,
3 form sẽ cùng nguồn message.

---

## Nhóm 3 — Field non-input (visual language khác — by design)

### 8. Onboarding có field types không tồn tại ở modal

Step 1: 4 radio-card (mục tiêu giảm cân/tăng cân/v.v.).
Step 2a: segment-control (Nam/Nữ), segment-control activity.
Step 2b: slider hoặc spinner (target weight) — TBD.
Step 3: confirmation summary card.

→ Modal không có những field này. So sánh "input style" giữa 2 nơi với
những field này là không apple-to-apple. Tuy nhiên:

- Radio-card border, padding, radius **nên** match `.input-wrapper`
  (radius `--radius-sm`, border `--input-border-color`).
- Segment-control track-style **nên** match modal `.segmented` (đã giống
  rồi).

**Khuyến nghị**: tách thành audit riêng "Onboarding non-input fields vs
design system §8.7" — out of scope của B1-B5 Signal Forms migration.

---

## Hành động đề xuất

| # | Điểm | Hành động | Thời điểm |
|--|--|--|--|
| 1 | Container bg | Không fix | — |
| 2 | Action placement | Không fix | — |
| 3 | Header | Không fix | — |
| 4 | Step-content spacing cơ chế | Thêm `display:flex; gap:16px` | B5 hoặc patch riêng |
| 5 | `.form-field` raw bao segment | Bỏ wrapper, dùng `.section-label` + control trực tiếp | B5 |
| 6 | nutrition-grid trên 360dp | QA emulator + tune `min-height` | B5 (emulator QA) |
| 7 | errorMessage literal | Schema-based message | B2-B4 |
| 8 | Radio/slider style | Audit §8.7 riêng | Out of scope |

---

## Verification

- Build prod: PASS (`ng build --configuration=production`)
- Tests: 132/132 PASS
- Lint: clean
- Pattern guard: PASS (no raw `.input-wrapper` ngoài `form-field.component.ts`)

→ Nếu anh thấy điểm khác biệt cụ thể nào em chưa list (ví dụ "label nhỏ
hơn", "viền dày hơn", "khoảng cách label-input lệch"), chỉ em element cụ
thể (screenshot hoặc tên field) — em sẽ trace CSS exact ra nguyên nhân.
