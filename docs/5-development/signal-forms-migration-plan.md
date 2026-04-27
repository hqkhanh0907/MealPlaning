# Signal Forms Migration Plan

**Status:** DRAFT — kế hoạch dài hạn, chưa chạy migration
**Author:** Khanh Huynh (solo)
**Created:** 2026-04-27 (Angular 21.2 vừa upgrade xong)
**Owner branch:** `chore/angular-21` (đã merge vào `main`)

---

## 0. Tóm tắt 1 phút

Angular 21 release **Signal Forms** dưới dạng `experimental` API ở entry point
`@angular/forms/signals`. Tài liệu, ví dụ, peer compat đã verified.

V1 HealthMate AI đang có 3 form quy mô khác nhau:

| # | Form                            | Dòng | Pattern hiện tại            | Độ phức tạp                          |
|---|---------------------------------|------|-----------------------------|--------------------------------------|
| 1 | `onboarding.page.ts`            | 908  | signals-native + template `ngModel` | step-wizard, 6 field flat            |
| 2 | `ingredient-edit-modal`         | 818  | signal state + `[(ngModel)]` 2-way | nested array (units), conditional nutrition |
| 3 | `dish-edit-modal`               | 646  | signal state + `[(ngModel)]` 2-way | array of ingredient lines (`applyEach`) |

Mục tiêu kế hoạch:

1. **Không** migrate ngay. Đợi API bỏ `@experimental` (Angular 22 dự kiến).
2. **Nhưng** xây sẵn base infrastructure trong main branch để khi API stable
   thì migration là cơ học, không design thêm.
3. Pilot khi sẵn sàng: **ingredient-edit-modal** (vừa đủ phức tạp, độc lập, có
   sẵn 25 unit tests làm safety net).

---

## 1. Lý do migrate

### 1.1 Vấn đề hiện tại (đã đo)

- **Inconsistency:** onboarding dùng signal-only; modal dùng `ngModel` two-way.
  Người dùng (Khanh) đã phản ánh "style của input trong phase 1 không
  consistency với phase onboarding". Root cause: hai pattern khác nhau cho
  cùng một need (collect typed value với validation).
- **Boilerplate:** mỗi field cần `[ngModel]` + `(ngModelChange)` + handler
  riêng để parse number/null. Xem `onNutritionChange()` x5 trong ingredient
  modal.
- **Validation rời rạc:** logic `canSave()` viết tay bằng `computed()`,
  không tái sử dụng được giữa các form.
- **Submit state:** không có `submitting`/`disabled`/`pristine`/`dirty` thống
  nhất. Mỗi form tự manage.

### 1.2 Signal Forms giải quyết

| Pain                       | Signal Forms API              |
|----------------------------|-------------------------------|
| boilerplate `(ngModelChange)` | `[control]="field.name"` 1-binding |
| validation rời rạc         | `schema()` + `validate()` co-located với type |
| submit state               | `field().submitting()`, `field().errors()`, `submit()` helper |
| nested array (dish lines)  | `applyEach()`                 |
| conditional logic          | `disabled()`, `hidden()`, `readonly()` reactive |
| typed value                | giữ nguyên TS strict, không cần `FormGroup<...>` |

### 1.3 Lý do KHÔNG migrate ngay (decision)

- API status: `@experimental 21.0.0` — có thể có breaking changes ở 21.x
  point releases. Confirm bằng cách đọc file `.d.ts`: mọi public symbol đều
  annotate `@experimental 21.0.0`.
- Solo dev, V1 chưa ship → ưu tiên feature mới (Phase 2-6) hơn là refactor.
- Cost/benefit: 3 form, ~2400 LOC; migration = 1-2 tuần effort. Đợi stable
  rẻ hơn vì khỏi rework migration code khi API đổi.

→ Hành động đúng đắn: **scaffold base infra ngay (rẻ, không invasive)**, plan
sẵn pilot, chờ Angular 22 hoặc thông báo "Signal Forms graduated to stable".

---

## 2. Kiến trúc đề xuất

### 2.1 Layer architecture

```
┌────────────────────────────────────────────────────────────────┐
│ Component (smart)                                              │
│  - inject() services                                           │
│  - viewModel = signal<FormShape>(initial)                      │
│  - schema = formSchema(viewModel)                              │
│  - field = form(viewModel, schema)                             │
│  - onSubmit() → mapper.toEntity(viewModel()) → repo.save()     │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ shared/forms/                                                  │
│  ├ types.ts        — FormShape<T>, FieldKind, FormError        │
│  ├ schemas/        — reusable validators (vnRequired, posNum…) │
│  ├ mappers/        — viewModel ⇄ entity convention             │
│  ├ form-field/     — <app-form-field> wraps .input-wrapper +   │
│  │                   floating label + error message            │
│  └ value-controls/ — primitive FormValueControl directives     │
│      ├ NumericFieldDirective                                   │
│      ├ NullableInputDirective                                  │
│      └ SegmentedFieldDirective (cho segmented-control)         │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────┐
│ Repository layer (giữ nguyên, không đổi)                       │
└────────────────────────────────────────────────────────────────┘
```

### 2.2 Convention cho FormShape vs Entity

Vấn đề: entity DB dùng `null` cho optional, snake_case; UI cần `undefined`,
camelCase, một số field convert (number → string trong input để show empty).

→ **Không hợp nhất**. Mỗi feature có 2 type:

```ts
// core/models/ingredient.model.ts        — entity (DB row, snake_case)
export interface Ingredient {
  id: string;
  name: string;
  basis_type: 'gram' | 'milliliter';
  density_g_per_ml: number | null;
  // ...
}

// shared/forms/ingredient-form.model.ts  — UI shape (form, camelCase)
export interface IngredientFormShape {
  name: string;
  basisType: 'gram' | 'milliliter';
  densityGPerMl: number | null;
  units: IngredientUnitFormShape[];
  // ...
}

// shared/forms/mappers/ingredient-form.mapper.ts
export const toEntity = (s: IngredientFormShape): Ingredient => ({...});
export const fromEntity = (e: Ingredient): IngredientFormShape => ({...});
```

Mapper layer đảm bảo:
- Form không leak DB shape vào template.
- Có chỗ tập trung để xử lý `null ↔ undefined`, parse number, default value.
- Test mapper riêng (pure function, dễ unit test).

### 2.3 Reusable schema validators

```ts
// shared/forms/schemas/common.ts
import { schema, validate, requiredError } from '@angular/forms/signals';

export const vnNameSchema = schema<string>((path) => {
  validate(path, ({ value }) => {
    const trimmed = value().trim();
    if (!trimmed) return requiredError({ message: 'Bắt buộc nhập' });
    if (trimmed.length > 100) return { kind: 'maxLength',
      message: 'Tối đa 100 ký tự' };
    return null;
  });
});

export const positiveNumberSchema = schema<number | null>((path) => {
  validate(path, ({ value }) => {
    const v = value();
    if (v === null) return null;
    if (v < 0) return { kind: 'negative', message: 'Phải >= 0' };
    return null;
  });
});
```

### 2.4 `<app-form-field>` wrapper component

Mục tiêu: thống nhất rendering của `.input-wrapper > label + input` ở
`form-field.scss` thành 1 component dùng chung. Áp dụng cho cả Reactive Forms
hiện tại VÀ Signal Forms tương lai (forward-compatible).

```html
<!-- Phase 1 (now): wrap ngModel/Reactive -->
<app-form-field label="Tên" [error]="errors.name()">
  <input class="input-native" [(ngModel)]="form.name" />
</app-form-field>

<!-- Phase 2 (post-migration): wrap [control] -->
<app-form-field label="Tên" [field]="ingredientForm.name">
  <input class="input-native" [control]="ingredientForm.name" />
</app-form-field>
```

Component implementation:
- `@Input() label: string`
- `@Input() error: string | null = null` (manual mode)
- `@Input() field: FieldTree<unknown> | null = null` (signal-forms mode)
- `<ng-content>` projection cho input element
- Internal: render `.input-wrapper` + `.input-label` + error message hint

→ Khi migrate, chỉ đổi binding, KHÔNG đổi cấu trúc HTML/CSS.

---

## 3. Phased migration plan

### Phase B0 — Scaffold (NOW, this commit)

- [x] Tạo `docs/5-development/signal-forms-migration-plan.md` (file này)
- [ ] Tạo `src/app/shared/forms/` skeleton:
  - `types.ts` — re-export Signal Forms types behind v1-friendly aliases
  - `schemas/common.ts` — stub validators (signal-forms style nhưng chưa
    dùng API thật, đợi stable)
  - `mappers/README.md` — convention doc
  - `form-field/form-field.component.ts` — wrapper component (manual error mode)
- [ ] Update `design-system.md §8.6` thêm note về `<app-form-field>` là
  preferred wrapper từ giờ về sau.
- [ ] **KHÔNG** import `@angular/forms/signals` trong production code (vẫn
  experimental). Chỉ ở scratch/spike file gắn `// @ts-expect-error` đi kèm.

**Verification:** lint + test + build pass, không thêm dependency, không thay
đổi behavior runtime.

### Phase B1 — Adopt wrapper (1 sprint, after Phase 1 ship)

- Refactor 3 form hiện tại để dùng `<app-form-field>` thay cho raw `.input-
  wrapper`. Vẫn giữ `ngModel`.
- Tạo unit test cho `<app-form-field>` (label, error display, projection).
- Output: codebase consistent ở mức markup, error display đồng nhất.

**Acceptance:** form-pattern guard pass, không có raw `.input-wrapper` ngoài
`form-field.component.ts`.

### Phase B2 — Pilot Signal Forms trên ingredient-edit-modal (khi API stable)

Trigger: Angular release notes nói "Signal Forms graduated to stable" HOẶC
team đánh giá API ổn định ở Angular 22.

Steps:
1. Tạo `ingredient-form.model.ts` + mapper (TDD: viết test mapper trước).
2. Convert template: `[(ngModel)]` → `[control]="field.name"`.
3. Move validation từ `computed canSave()` sang `schema()`.
4. Refactor nested `units` thành `applyEach()`.
5. Run 25 unit tests + emulator QA — không regression.
6. Commit single PR.

**Rollback plan:** revert single commit. Vì mapper + form-field wrapper đã có
sẵn từ B0, rollback chỉ là đổi 1 file template + 1 file logic.

### Phase B3 — Migrate dish-edit-modal

Same as B2 nhưng nested ingredient lines.

### Phase B4 — Migrate onboarding

Lớn nhất nhưng đơn giản (flat fields, multi-step). Wizard state vẫn ở
component, chỉ value+validation vào Signal Forms.

### Phase B5 — Cleanup

- Xóa `FormsModule`/`ReactiveFormsModule` imports.
- Update `copilot-instructions.md` + `architecture.md` §9 đổi "signals-native
  template-driven" → "Signal Forms".
- Xóa convention cũ trong `form-field.scss` (giữ lại CSS, chỉ xóa doc note
  về 2 patterns).

---

## 4. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| API breaking change ở 21.x | KHÔNG dùng `@angular/forms/signals` trong production trước khi stable |
| Pilot regression | 25 unit tests + emulator QA, single-PR revert |
| Mapper boilerplate | Code-gen script (out of scope V1, V2 cân nhắc) |
| Field control directive cho `<app-segmented-control>` | Cần custom `FormValueControl` directive — viết stub ở B0, hoàn thiện ở B2 |
| Bottom-sheet picker không phải `<input>` | Wrap bằng custom `FormUiControl` directive (đã có precedent từ Angular Material) |
| `null` vs `undefined` mismatch DB ↔ form | Mapper layer enforce; thêm test boundary |

---

## 5. Out of scope

- Migrate đến `@standard-schema/spec` validators (Zod, Valibot). Cân nhắc V2.
- Replace toàn bộ `confirm-dialog`, `bottom-sheet-picker` bằng Signal Forms
  API. Giữ nguyên — chúng không phải form fields.
- Async validators (HTTP). V1 offline-first nên không cần.

---

## 6. References

- Angular 21 release notes: <https://blog.angular.dev/angular-v21/>
- Signal Forms API: `node_modules/@angular/forms/types/signals.d.ts`
- Internal: `src/theme/form-field.scss` §8.6 in design-system.md
- Pilot reference impl: `src/app/features/onboarding/onboarding.page.ts`
  (signals-native pattern, gần Signal Forms nhất)

---

## 7. Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-27 | Upgrade Angular 20 → 21 trên branch `chore/angular-21` | Mở khóa Signal Forms khi stable |
| 2026-04-27 | Scaffold infra NHƯNG không migrate | API còn experimental |
| 2026-04-27 | Pilot = ingredient-edit-modal | Đủ phức tạp + có safety net 25 tests + standalone scope |
| 2026-04-27 | Mapper convention thay vì share entity type | Tách concern UI ↔ DB rõ ràng |
| 2026-04-27 | `<app-form-field>` introduced ngay (forward-compat) | Cost thấp, lợi cho Phase B1 và B2+ |
| 2026-04-27 | **OVERRIDE**: thực hiện liền B1→B5 trên Angular 21.2.10 dù API còn `@experimental` | User direction; chấp nhận risk breaking change nội bộ 21.x. Pin Angular minor + giữ rollback path qua mappers + form-field wrapper |
