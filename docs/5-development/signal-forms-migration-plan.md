# Signal Forms Migration — Reflective Record

**Status:** ✅ DONE — toàn bộ 3 form đã migrate sang Signal Forms (`@angular/forms/signals`).
**Author:** Khanh Huynh (solo)
**Created:** 2026-04-27 (Angular 21.2 vừa upgrade)
**Last updated:** 2026-04-28 (Phase D — schema-driven errors)
**Owner branch:** `main` (đã merge từ `chore/angular-21`)

> Tài liệu này được rewrite ở dạng **reflective record** sau khi migration đã
> complete. Nó mô tả pattern canonical đã chốt (cho contributor mới đọc) và
> quá trình đã đi (cho lessons-learned). Không còn là kế hoạch tương lai.

---

## 0. Tóm tắt 1 phút

Angular 21.2 ship `@angular/forms/signals` ở dạng `@experimental`. HealthMate AI
đã migrate **toàn bộ 3 form** sang Signal Forms với pattern thống nhất:

| # | Form | Schema | Live-validation | Status |
|---|------|--------|-----------------|--------|
| 1 | `onboarding.page.ts` step 2a | `onboarding-step2a-form.schema.ts` | `showStep2aErrors` signal + FieldTree | ✅ |
| 2 | `ingredient-edit-modal` | `ingredient-form.schema.ts` | `showErrors` signal + FieldTree | ✅ |
| 3 | `dish-edit-modal` | `dish-form.schema.ts` | `showErrors` signal + FieldTree | ✅ |

**Quyết định OVERRIDE 2026-04-27:** chấp nhận `@experimental` flag để chốt
pattern sớm. Risk mitigation = pin Angular minor + mapper layer + commit per-phase
rollback-able.

---

## 1. Pattern canonical (MANDATORY cho mọi form mới)

### 1.1 Schema-first

Mỗi form có 1 file `*-form.schema.ts` export:

```ts
// dish-form.schema.ts
import { schema } from '@angular/forms/signals';

export interface DishEditFormValue { /* ... */ }
export interface DishIngredientFormItem { /* ... */ }

export const DISH_FORM_SCHEMA = schema<DishEditFormValue>((path) => {
  required(path.name, { message: 'Vui lòng nhập tên món ăn' });
  validate(path.servings, ({ value }) => {
    const v = value();
    if (v == null || v < 0.5 || v > 20) {
      return { kind: 'range', message: 'Số phần ăn cần nằm trong khoảng 0.5 đến 20.' };
    }
    return null;
  });
  // ...
});
```

**Rule:**
- Mỗi validator return `{ kind, message }` hoặc `null`.
- `message` viết tiếng Việt, dùng nguyên text trong UI (không i18n key).
- Schema KHÔNG biết về Angular component — pure data.

### 1.2 Form instance trong component

```ts
// dish-edit-modal.ts
private readonly formValue = signal<DishEditFormValue>(INITIAL_DISH_FORM_VALUE);
protected readonly form = form(this.formValue, DISH_FORM_SCHEMA);
protected readonly showErrors = signal(false);
```

**Rule:**
- `form` là `protected` (template truy cập được, ngoài component thì không).
- `showErrors` là `signal<boolean>(false)`, flip thành `true` khi user submit lần đầu.
- Spec test cần bypass `protected` thì dùng helper:
  ```ts
  const showErrorsOf = (c: DishEditModal) =>
    (c as { showErrors: ReturnType<typeof signal<boolean>> }).showErrors();
  ```

### 1.3 Submit handler

```ts
async save(): Promise<void> {
  this.showErrors.set(true);
  if (!this.form().valid()) {
    this.focusFirstInvalidField();
    return;
  }
  // ... persist
}
```

**Rule:**
- KHÔNG còn `canSave()` computed riêng. Dùng `form().valid()` trực tiếp.
- KHÔNG còn function `validateXxx()` viết tay. FieldTree đã chứa errors.

### 1.4 Template — consume errors qua `<app-form-field>` wrapper

Markup canonical (dùng wrapper `AppFormField` ở `src/app/shared/forms/form-field/`):

```html
<app-form-field
  label="Tên món ăn"
  inputId="dish-field-name"
  [invalid]="showErrors() && fieldError('name') !== null"
  [errorMessage]="fieldError('name') ?? ''"
>
  <input id="dish-field-name" class="input-native" [field]="form.name" />
</app-form-field>
```

Component cung cấp helper `fieldError()` đọc từ FieldTree:

```ts
protected fieldError(name: keyof DishEditFormValue): string | null {
  const errs = this.form[name]().errors();
  return errs.length > 0 ? errs[0].message : null;
}
```

**Rule:**
- DÙNG `<app-form-field>` wrapper cho mọi text/number input — single source
  of truth cho `.input-wrapper` + `.input-label` + error display markup.
- `[field]="form.<name>"` ở `<input>` projected — 2-way bind native vào
  underlying signal qua `FormField` directive từ `@angular/forms/signals`.
- KHÔNG sync state ngược từ template về `formValue` qua `(input)` handler —
  `[field]` directive đã handle.
- KHÔNG dùng raw `.input-wrapper` ở feature code (form-input-pattern guard
  enforce). Chỉ `app-form-field` template được dùng raw markup.

### 1.5 Array fields (`applyEach`)

```ts
// dish-form.schema.ts
applyEach(path.ingredients, (itemPath) => {
  required(itemPath.ingredientId, { message: 'Chọn nguyên liệu' });
  validate(itemPath.amount, ({ value }) => {
    const v = value();
    if (v == null || v <= 0) return { kind: 'positive', message: 'Khối lượng phải > 0' };
    return null;
  });
});
```

Template:

```html
@for (item of form.ingredients; track $index) {
  <app-ingredient-line [field]="item" />
}
```

### 1.6 Non-input controls (segment, picker)

Gender segment, group radio cards, bottom-sheet picker KHÔNG phải native
`<input>` → KHÔNG dùng `[field]`. Thay vào đó update underlying signal:

```ts
selectGender(g: Gender): void {
  this.formValue.update((v) => ({ ...v, gender: g }));
}
```

FieldTree vẫn tự re-validate vì source signal đổi.

---

## 2. Cấu trúc thư mục

```
src/app/
├── features/<feature>/
│   ├── <name>.ts            # component
│   ├── <name>.html
│   └── <name>.scss
├── shared/components/<modal>/   # cross-feature modals (dish, ingredient)
│   ├── <name>.ts
│   ├── <name>.html
│   ├── <name>.scss
│   └── <name>.spec.ts
└── shared/forms/
    ├── form-field/              # AppFormField wrapper (canonical markup)
    │   ├── form-field.ts
    │   ├── form-field.html
    │   └── form-field.spec.ts
    ├── schemas/                 # ⭐ tất cả form schemas + specs
    │   ├── ingredient-form.schema.ts
    │   ├── ingredient-form.schema.spec.ts
    │   ├── dish-form.schema.ts
    │   ├── dish-form.schema.spec.ts
    │   ├── onboarding-step2a-form.schema.ts
    │   └── onboarding-step2a-form.schema.spec.ts
    ├── types.ts                 # FormError + alias types
    └── index.ts                 # barrel export AppFormField
```

Form-field styling ở `src/theme/form-field.scss` — single source of truth cho
`.input-wrapper`, `.input-label`, `.input-native`, `.field-error`. KHÔNG inline
trong component `.scss`.

---

## 3. Phases đã thực hiện

| Phase | Mô tả | Done |
|-------|-------|------|
| **B0** | Scaffold types + folder convention | 2026-04-27 |
| **B1** | Adopt `[field]` directive thay `[(ngModel)]` ở 3 form | 2026-04-27 |
| **B2** | Pilot ingredient-edit-modal — schema + mapper + 25 unit tests pass | 2026-04-27 |
| **B3** | Migrate dish-edit-modal | 2026-04-27 |
| **B4** | Migrate onboarding step 2a | 2026-04-27 |
| **B5** | Cleanup `FormsModule`/`ReactiveFormsModule` imports | 2026-04-27 |
| **D**  | Schema-driven errors — bỏ `validateXxx()` viết tay, consume `FieldTree.errors()` trực tiếp; `form().valid()` ở submit | 2026-04-28 |

**Phase D verification (2026-04-28):**
- Lint: PASS
- Tests: 162/162 PASS (added `dish-form.schema.spec.ts` + `onboarding-step2a-form.schema.spec.ts`, +17 từ baseline 145)
- Prod build: PASS
- APK install + emulator QA: live-validation 3 errors ở dish-edit-modal hiển thị đúng (border đỏ + text đỏ), errors biến mất real-time khi user nhập (verified ở ingredient-edit-modal).

---

## 4. Lessons learned

1. **Wrapper component (`<app-form-field>`) không cần thiết.** Schema + helper
   `fieldError()` đã đủ DRY. Wrapper thêm 1 lớp DI + projection không tăng
   giá trị. Bỏ ở Phase D.
2. **`@experimental` không phải blocker.** Pin Angular minor (`21.2.x`) + có
   suite 162 test làm safety net = đủ tự tin migrate sớm.
3. **Spec với `protected` field:** không nới quyền truy cập production code,
   dùng helper cast trong spec để bypass.
4. **Live-validation pattern thống nhất:** `showErrors` signal flip on first
   submit → FieldTree.errors() reactive tự update sau đó. KHÔNG cần `effect()`
   re-run validator.
5. **`validateStep2a()` legacy là dead code.** Phase D đã dọn (boy-scout) cùng
   `EMPTY_2A`, `Step2aErrors` type alias.
6. **Naming:** Phase C 2025-style (no `.component.ts` suffix) áp dụng cho
   tất cả file mới gồm schema + spec.

---

## 5. Architecture guards liên quan

| Guard | Mục đích | File |
|-------|----------|------|
| `check-form-input-pattern.mjs` | Floating-label markup, no inline `.input-wrapper` ngoài form-field.scss | `scripts/` |
| `check-pc1-external-templates.mjs` | PC-1 binary — `templateUrl` + `styleUrl` only | `scripts/` |
| `check-style-2025-naming.mjs` | No `.component.ts` / `Component` class suffix | `scripts/` |

Form mới phải pass cả 3 (chạy ở `npm run build`, pre-commit, CI).

---

## 6. References

- Angular 21 release notes: <https://blog.angular.dev/angular-v21/>
- Signal Forms API: `node_modules/@angular/forms/types/signals.d.ts`
- Design system §8.6: `docs/3-design/design-system.md`
- Coding conventions §1, §2.2: `docs/4-architecture/coding-conventions.md`
- Pilot reference impl: `src/app/features/management/components/ingredient-edit-modal/`

---

## 7. Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-27 | Upgrade Angular 20 → 21 (`chore/angular-21`) | Mở khóa Signal Forms |
| 2026-04-27 | OVERRIDE: migrate liền dù `@experimental` | Pin minor + safety net 145 tests |
| 2026-04-27 | Pilot = ingredient-edit-modal | Đủ phức tạp, độc lập, có 25 unit tests |
| 2026-04-27 | Mapper convention thay vì share entity type | Tách concern UI ↔ DB |
| 2026-04-28 | Bỏ wrapper `<app-form-field>` | Không tăng giá trị, schema + helper đã đủ |
| 2026-04-28 | Schema-driven errors trực tiếp (không `validateXxx()`) | Single source of truth, ít boilerplate |
| 2026-04-28 | `showErrors` thành `protected signal<boolean>` | Encapsulate, spec bypass qua cast helper |
| 2026-04-28 | Submit dùng `form().valid()` thay `canSave()` computed | Consistent với FieldTree API |
