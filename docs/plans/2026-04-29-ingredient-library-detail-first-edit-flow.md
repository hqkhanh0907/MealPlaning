# Ingredient Library Detail-first Edit Flow Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Redesign direct ingredient editing from `Thư viện nguyên liệu` so tapping an ingredient opens a read-only detail/impact screen first, and editing becomes an explicit action with warning when the ingredient is used by dishes.

**Architecture:** This extends the dish-first management model. `ingredient` remains editable master data and remains the source of truth for nutrition/unit conversion. V1 uses global edit semantics: when an ingredient is edited, any dish that references it derives updated totals through `dish_with_totals`. Therefore, the UI must show usage impact before edit/delete.

**Tech Stack:** Angular 21 standalone components, Ionic 8, Angular Signals, existing `IngredientStore`, `DishStore`, `IngredientRepository`, `DishesUsingSheet`, `ConfirmDialog`, routed management edit pages.

---

## Source of Truth Hierarchy

1. `docs/4-architecture/business-rules.md` — invariant kỹ thuật: dish total derived, normalize unit, provenance.
2. `docs/2-requirements/prd.md` — functional scope Core Nutrition F-01/F-02.
3. `docs/3-design/data-model.md` — schema/entity relationship, canonical nutrition model.
4. `docs/1-vision/product-vision.md` — product intent/UX guardrails: AI-first, <10 giây, beginner-friendly, local-first.
5. `docs/3-design/design-system.md`
6. `docs/5-development/phase-1-management.md` — planning context only; may drift and must not override items above.
7. Existing mockups

### Source-doc re-check — 2026-04-29

User callout: this plan must be grounded in PRD Core Nutrition and Product Vision, not only the latest UX discussion.

Confirmed from PRD F-01/F-02:
- `Ingredient` nutrition is canonical per `100g` or `100ml`; unit choices are conversion/input helpers, not nutrition source of truth.
- `IngredientUnit` stores `factor_to_basis`; every ingredient needs at least one valid unit and exactly one default unit.
- `Dish` total nutrition is derived from `dish_with_totals`; Quick Add/manual total entry is removed from V1.
- `Thư viện nguyên liệu` is supporting library; `Món ăn` is the primary management flow.

Confirmed from Product Vision:
- The app should feel like an AI coach, not a database manager: AI-first, not form-first.
- Daily interactions target <10 seconds where possible.
- Beginner users need simple copy; advanced users can still inspect detailed nutrition/unit data.
- Local-first remains the default; Gemini/API is used only when the user actively invokes AI flows.

Implication for this plan: ingredient detail-first is valid only if it reduces accidental global edits and keeps the normal path dish-first/fast. It must not turn `Thư viện nguyên liệu` into the primary workflow.

---

## UX Contract

### Direct ingredient flow from library

```text
Quản lý
→ Thư viện nguyên liệu
→ Tap ingredient card
→ Ingredient detail/read-only
   → Nutrition basis summary
   → Common units summary
   → Dishes using this ingredient
   → Actions: Sửa thông tin, Xóa nguyên liệu
→ Tap Sửa thông tin
→ If used in dishes: impact warning
→ Ingredient edit form
→ Save global changes
→ Dish totals update through dish_with_totals
```

### What changes from old behavior

Old behavior:

```text
Tap ingredient card → edit form immediately
```

New behavior:

```text
Tap ingredient card → detail first → explicit Sửa thông tin → warning if needed → edit form
```

---

## Product rules

1. **Editing is allowed.** Users must be able to fix wrong calories/macros/unit conversion.
2. **Editing is global in V1.** Do not add per-dish ingredient copies or versioning yet.
3. **Referenced ingredient edit must warn.** If `countDishReferences(id) > 0`, show an impact warning before edit or before save.
4. **Deleting referenced ingredient remains blocked.** Show the number/list of dishes using it and ask the user to remove it from dishes first.
5. **Detail screen is read-only.** It is for understanding impact before editing.
6. **No technical terms in UI.** Use “1 quả ≈ 60g”, not `factor_to_basis`; use “dữ liệu theo 100g”, not `nutrition_basis_unit`.
7. **Respect Product Vision.** Keep the common path fast and dish-first; this is a safety/maintenance flow, not the main user journey.
8. **Respect PRD canonical nutrition.** UI may ask user-friendly questions, but persisted nutrition basis remains only `100g` or `100ml` in Phase 1.

---

## Implementation Breakdown — Small Runtime Slices

> Scope: this breakdown is for future code implementation. No runtime code is changed by this document update. Each slice should end with targeted verification before moving on.

### Slice 0: Pre-code reality audit

**Goal:** Confirm the plan matches the live code and source docs before editing.

**Read first — docs:**
- `docs/4-architecture/business-rules.md` — RULE-DISH-TOTAL, RULE-DISH-INGREDIENT-NORMALIZE, provenance.
- `docs/2-requirements/prd.md` — Core Nutrition F-01/F-02.
- `docs/3-design/data-model.md` — `ingredient`, `ingredient_unit`, `dish`, `dish_ingredient`, `dish_with_totals`.
- `docs/1-vision/product-vision.md` — AI-first, <10 giây, beginner-friendly, local-first product principles.

**Read first — code:**
- `src/app/features/management/management.routes.ts`
- `src/app/features/management/management.page.ts`
- `src/app/features/management/management.page.html`
- `src/app/features/management/ingredient-edit/ingredient-edit.page.ts`
- `src/app/core/stores/ingredient.store.ts`
- `src/app/core/stores/dish.store.ts`
- `src/app/shared/components/dishes-using-sheet/dishes-using-sheet.ts`

**Done when:**
- Current card tap behavior is confirmed.
- Existing delete/reference-count APIs are identified.
- Existing confirm dialog pattern is confirmed.
- Any drift against PRD/Product Vision is recorded before code changes.

### Slice 1: Route + empty shell for ingredient detail

**Goal:** Add the route/page without changing list behavior yet.

**Files:**
- Create `src/app/features/management/ingredient-detail/ingredient-detail.page.ts`
- Create `src/app/features/management/ingredient-detail/ingredient-detail.page.html`
- Create `src/app/features/management/ingredient-detail/ingredient-detail.page.scss`
- Modify `src/app/features/management/management.routes.ts`

**Acceptance:**
- `/tabs/management/ingredient/:id` loads without Angular errors.
- Missing/unknown id shows a friendly not-found state.

### Slice 2: Detail data rendering

**Goal:** Render ingredient nutrition, common units, source/category, and usage count.

**Files:**
- Modify `ingredient-detail.page.ts/html/scss`

**Acceptance:**
- Existing ingredient shows name, category, source, calories/macros, basis `100g/100ml`, unit rows.
- Referenced ingredient shows `Đang dùng trong N món`.
- Unreferenced ingredient shows `Chưa dùng trong món nào`.

### Slice 3: Change card tap from edit-first to detail-first

**Goal:** Update `Thư viện nguyên liệu` list interaction.

**Files:**
- Modify `management.page.ts`
- Modify `management.page.html`

**Acceptance:**
- Tap ingredient card opens detail page.
- The list no longer opens edit form directly from card tap.
- Overflow menu keeps safe secondary actions; direct `Sửa` is removed or routed through detail.

### Slice 4: Edit impact warning from detail

**Goal:** Make `Sửa thông tin` explicit and safe.

**Files:**
- Modify `ingredient-detail.page.ts/html/scss`
- Reuse shared confirm dialog/pattern

**Acceptance:**
- If reference count is `0`, `Sửa thông tin` opens edit route directly.
- If reference count is `>0`, user sees warning and must choose `Tiếp tục sửa`.
- Warning copy explains global effect in plain language.

### Slice 5: Delete behavior from detail

**Goal:** Preserve current safe delete semantics from the detail page.

**Files:**
- Modify `ingredient-detail.page.ts/html/scss`
- Reuse `DishesUsingSheet` or existing blocked-delete dialog

**Acceptance:**
- Unreferenced ingredient: confirm delete, then return to library.
- Referenced ingredient: delete blocked, show `Xem món đang dùng`.

### Slice 6: Edit page impact context

**Goal:** Keep the impact visible after user proceeds to the edit form.

**Files:**
- Modify `src/app/features/management/ingredient-edit/ingredient-edit.page.ts`
- Modify `src/app/features/management/ingredient-edit/ingredient-edit.page.html`
- Modify `src/app/features/management/ingredient-edit/ingredient-edit.page.scss`

**Acceptance:**
- Edit mode for referenced ingredient shows impact card near the top.
- Create mode does not show impact card.
- Save remains global and uses existing repository/store semantics.

### Slice 7: Verification and emulator QA

**Commands:**

```bash
npm run lint
npm run build
npx ng test --watch=false --browsers=ChromeHeadless
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
npx cap sync android
cd android && ./gradlew assembleDebug
adb -s emulator-5554 install -r app/build/outputs/apk/debug/app-debug.apk
adb -s emulator-5554 shell monkey -p com.healthmate.ai -c android.intent.category.LAUNCHER 1
```

**Manual QA:**
- `Quản lý` opens `Món ăn` first.
- Switch to `Thư viện nguyên liệu`.
- Tap card → detail.
- Referenced ingredient → warning before edit.
- Unreferenced ingredient → edit/delete without impact warning, with delete confirm.
- Referenced delete remains blocked.
- Check full-bleed/no-padding layout via content insets.


---

## Task 1: Add ingredient detail route/screen

**Objective:** Create a read-only detail page for ingredients in the library.

**Files:**
- Create: `src/app/features/management/ingredient-detail/ingredient-detail.page.ts`
- Create: `src/app/features/management/ingredient-detail/ingredient-detail.page.html`
- Create: `src/app/features/management/ingredient-detail/ingredient-detail.page.scss`
- Modify: `src/app/features/management/management.routes.ts`

**Route:**

```ts
{
  path: 'ingredient/:id',
  loadComponent: () => import('./ingredient-detail/ingredient-detail.page'),
}
```

Keep existing edit route:

```ts
ingredient/edit/:id
```

**Detail content:**

```text
Trứng gà
Trứng & Sữa · Có sẵn / Tự tạo / AI

Dinh dưỡng
Theo 100g
155 kcal · Protein 13g · Carb 1.1g · Fat 11g

Đơn vị thường dùng
1 quả ≈ 60g
1 g = 1g

Đang dùng trong món
Cơm trứng · 2 quả
Salad trứng · 1 quả

[Sửa thông tin]
[Xóa nguyên liệu]
```

**Verification:**

- Loading an existing ingredient id shows detail data.
- Missing id shows clear error and a way back to library.
- Back returns to `Thư viện nguyên liệu`.

---

## Task 2: Change library card tap from edit to detail

**Objective:** Make ingredient cards open detail instead of edit.

**Files:**
- Modify: `src/app/features/management/management.page.ts`
- Modify: `src/app/features/management/management.page.html`

**Change:**

```ts
openIngredientDetail(id: string): void {
  void this.router.navigate(['/tabs/management/ingredient', id]);
}
```

Update card action:

```html
(click)="openIngredientDetail(ingredient.id)"
[attr.aria-label]="'Xem chi tiết nguyên liệu ' + ingredient.name"
```

**Overflow menu:**

- Kebab remains for secondary/destructive actions.
- Prefer `Xem chi tiết` + `Xóa` only.
- Avoid duplicate `Sửa` unless required for discoverability. If kept, route through detail/warning first.

**Verification:**

- Tap card opens detail page.
- Kebab delete still works and remains guarded.

---

## Task 3: Add impact warning before edit

**Objective:** Warn users before they edit an ingredient used in dishes.

**Files:**
- Modify: `src/app/features/management/ingredient-detail/ingredient-detail.page.ts`
- Modify: `src/app/features/management/ingredient-detail/ingredient-detail.page.html`
- Reuse: `src/app/shared/components/confirm-dialog/confirm-dialog`

**Behavior:**

```text
If referenceCount === 0:
  Sửa thông tin → navigate ingredient/edit/:id

If referenceCount > 0:
  Sửa thông tin → show impact dialog
  Confirm → navigate ingredient/edit/:id
```

**Dialog copy:**

```text
Nguyên liệu này đang được dùng trong {n} món.
Nếu bạn sửa dinh dưỡng hoặc đơn vị quy đổi, tổng calories của các món đó có thể thay đổi.
```

Buttons:

```text
Hủy
Tiếp tục sửa
```

**Verification:**

- Referenced ingredient shows warning before edit.
- Unreferenced ingredient opens edit directly.

---

## Task 4: Add impact context inside edit page

**Objective:** Keep impact visible on the edit form itself.

**Files:**
- Modify: `src/app/features/management/ingredient-edit/ingredient-edit.page.ts`
- Modify: `src/app/features/management/ingredient-edit/ingredient-edit.page.html`
- Modify: `src/app/features/management/ingredient-edit/ingredient-edit.page.scss`

**UI block:**

Show near the top for edit mode when referenced:

```text
Đang dùng trong {n} món
Thay đổi dinh dưỡng hoặc đơn vị quy đổi sẽ làm thay đổi tổng calories của các món này.
[Xem món đang dùng]
```

**Verification:**

- Edit referenced ingredient shows the warning block.
- Create ingredient does not show the warning block.

---

## Task 5: Keep delete blocked, but route from detail

**Objective:** Delete behavior remains safe from both list and detail.

**Files:**
- Modify: `src/app/features/management/ingredient-detail/ingredient-detail.page.ts`
- Modify: `src/app/features/management/ingredient-detail/ingredient-detail.page.html`
- Reuse: `DishesUsingSheet` or existing blocked delete dialog

**Rules:**

```text
referenceCount === 0 → show confirm delete → delete → back to library
referenceCount > 0 → show blocked delete → list/show dishes using ingredient
```

**Blocked copy:**

```text
Không thể xóa “{name}”
Nguyên liệu này đang được dùng trong {n} món. Hãy gỡ khỏi các món trước khi xóa.
```

**Verification:**

- Referenced ingredient cannot be deleted from detail.
- Unreferenced ingredient can be deleted and returns to library.

---

## Task 6: Update mockups/docs

**Objective:** Keep Phase 1 mockups and docs aligned with the new detail-first ingredient edit flow.

**Files:**
- Modify: `docs/3-design/mockups/phase-1-ingredient-list.html`
- Modify: `docs/3-design/mockups/phase-1-ingredient-edit.html`
- Modify: `docs/3-design/mockups/phase-1-management-dish-first-flow.html`
- Modify: `docs/2-requirements/prd.md`
- Modify: `docs/5-development/phase-1-management.md`
- Modify: `docs/3-design/design-system.md` if interaction note is needed
- Modify: `docs/plans/2026-04-29-management-dish-first-ux-redesign.md`

**Required docs text:**

```text
Tap ingredient in Thư viện nguyên liệu opens detail/read-only first.
Sửa thông tin is explicit.
V1 ingredient edit is global and updates related dish totals via derived view.
Referenced ingredient edit must show impact warning.
```

---

## Task 7: Full verification

**Commands:**

```bash
npm run lint
npm run build
npm run check:guards
npx ng test --watch=false --browsers=ChromeHeadless
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
npx cap sync android
cd android && ./gradlew assembleDebug
adb -s emulator-5554 install -r app/build/outputs/apk/debug/app-debug.apk
adb -s emulator-5554 shell monkey -p com.healthmate.ai -c android.intent.category.LAUNCHER 1
```

**Manual QA checklist:**

- `Quản lý` opens `Món ăn` first.
- Switch to `Thư viện nguyên liệu`.
- Tap ingredient card → detail screen, not edit form.
- Detail shows nutrition, common units, and usage impact.
- `Sửa thông tin` warns when referenced.
- Edit form shows impact warning for referenced ingredient.
- Delete is blocked when referenced.
- Full-bleed/no-padding layout checked via content insets.

---

## Rollback strategy

If the detail page implementation is too large for the slice, keep the existing edit route but insert a warning screen/dialog before navigating to edit. Do not silently keep direct edit without impact warning.
