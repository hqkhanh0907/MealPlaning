# Management Dish-First UX Redesign Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Redesign the `Quản lý` area so `Món ăn` becomes the primary user flow and `Nguyên liệu` becomes a supporting `Thư viện nguyên liệu`, while preserving the existing ingredient/dish data model and offline-first architecture.

**Architecture:** This is primarily an information-architecture and interaction-flow change. The existing domain remains valid: `ingredient` is the nutrition/unit source of truth, `dish_ingredient.normalized_amount` is resolved through `resolveUnit()`, and dish totals are derived from `dish_with_totals`. The UI should guide users through dish creation first, with contextual ingredient search/quick-create when missing.

**Tech Stack:** Angular 21 standalone components, Ionic 8, Angular Signals, SQLite via Repository/Store layer, existing shared components (`SegmentedControl`, `SearchToolbar`, `EmptyState`, `ConfirmDialog`).

---

## Source of Truth Hierarchy

Use this order when documents conflict:

1. `docs/4-architecture/business-rules.md`
2. `docs/2-requirements/prd.md`
3. `docs/3-design/data-model.md`
4. `docs/3-design/design-system.md`
5. `docs/5-development/phase-1-management.md`
6. Existing mockups under `docs/3-design/mockups/`

Known correction: older docs/mockups that say `Nguyên liệu | Món ăn` as the primary order are now superseded by this plan and the updated docs. New UX contract is:

```text
Quản lý opens Món ăn first.
Segment order: Món ăn | Thư viện nguyên liệu.
Ingredient creation is primarily contextual inside dish creation.
Ingredient library remains available for correction/maintenance.
```

---

## Non-goals

- Do not remove the `ingredient` table or ingredient store/repository.
- Do not persist total macros on `dish`.
- Do not reintroduce manual total dish entry.
- Do not expose technical terms like `factor_to_basis`, `normalized_amount`, or `nutrition_basis_unit` in user-facing copy.
- Do not implement AI lookup/autofill in this slice unless explicitly scoped later.

---

## UX Contract

### Primary flow

```text
Quản lý
→ Món ăn
→ Tạo món ăn
→ Thêm nguyên liệu vào món
→ Search nguyên liệu
   → If found: select ingredient
   → If missing: quick-create ingredient
→ Enter amount + unit
→ Preview row calories/macros and total dish nutrition
→ Save dish
```

### Supporting flow

```text
Quản lý
→ Thư viện nguyên liệu
→ Search/filter ingredients
→ Ingredient detail/read-only
→ Xem dinh dưỡng + đơn vị + món đang dùng
→ Sửa thông tin / Xóa nếu an toàn
```

### Safety rules

- Editing an ingredient used in dishes warns that dish totals can change.
- Deleting an ingredient used in dishes is blocked and shows usage impact.
- V1 uses global ingredient edits; all dishes derive updated totals through `dish_with_totals`.
- Direct edit from ingredient library must be detail-first: card tap opens detail/read-only, then explicit `Sửa thông tin`, then impact warning if referenced.

---

## Task 1: Reframe Management tab order and copy

**Objective:** Make `Món ăn` the default and rename the ingredient segment to `Thư viện nguyên liệu`.

**Files:**
- Modify: `src/app/features/management/management.page.ts`
- Modify: `src/app/features/management/management.page.html`
- Test: `src/app/features/management/management.page.spec.ts` if present

**Steps:**

1. Change `managementTabs` order:

```ts
readonly managementTabs: SegmentedControlOption<ManagementTab>[] = [
  { value: 'dishes', label: 'Món ăn', ariaLabel: 'Tab món ăn' },
  { value: 'ingredients', label: 'Thư viện nguyên liệu', ariaLabel: 'Tab thư viện nguyên liệu' },
];
```

2. Change default tab:

```ts
readonly tab = signal<ManagementTab>('dishes');
```

3. Update segment aria label:

```html
ariaLabel="Chuyển giữa món ăn và thư viện nguyên liệu"
```

4. Update ingredient empty copy from database-first to supporting-library copy:

```text
Chưa có nguyên liệu riêng
Nguyên liệu thường được tạo khi bạn thêm vào món ăn. Bạn vẫn có thể thêm nguyên liệu riêng vào thư viện nếu cần chỉnh dữ liệu dinh dưỡng.
+ Thêm vào thư viện
```

5. Update FAB aria label for ingredient tab to `Thêm vào thư viện`.

**Verification:**

- Run `npm run lint`.
- Run `npm run build`.
- Open `Quản lý`; first visible segment is `Món ăn` active.
- User can switch to `Thư viện nguyên liệu` and list/search still works.

---

## Task 2: Update dish empty/list UX to communicate primary flow

**Objective:** Ensure the dish tab clearly tells users that creating dishes is the main action.

**Files:**
- Modify: `src/app/features/management/management.page.html`
- Modify: `src/app/features/management/management.page.scss` if spacing/copy requires adjustment

**Steps:**

1. Dish empty state copy:

```text
Chưa có món ăn nào
Tạo món đầu tiên để dùng trong lịch ăn và theo dõi dinh dưỡng.
+ Tạo món ăn đầu tiên
```

2. FAB menu labels remain two-option but copy should be user-centered:

```text
Tạo từ nguyên liệu
Tự chọn nguyên liệu, app tính dinh dưỡng

AI tự điền
Nhập tên món để AI gợi ý nguyên liệu và lượng dùng
```

3. Do not show ingredient-first onboarding text anywhere in default management state.

**Verification:**

- Empty DB state shows dish empty state first.
- Existing seeded data state shows dish list first.
- FAB opens dish creation menu, not ingredient creation.

---

## Task 3: Add contextual ingredient quick-create from dish editing

**Objective:** When a user is creating/editing a dish and cannot find an ingredient, allow quick-creating it without losing dish context.

**Files:**
- Modify: `src/app/features/management/dish-edit/dish-edit.page.ts`
- Modify: `src/app/features/management/dish-edit/dish-edit.page.html`
- Reuse/modify: `src/app/features/management/ingredient-edit/ingredient-edit.page.ts` if routed quick-create is chosen
- Or create: shared quick-create sheet/page only if current edit page cannot support return context safely

**Preferred UX:**

```text
Thêm nguyên liệu vào món
→ Search “Trứng cút”
→ Không tìm thấy
→ Tạo nhanh “Trứng cút”
→ Save CTA: Lưu và thêm vào món
→ Return to dish draft with ingredient selected
```

**Implementation options:**

A. **Route-based return context**
- Navigate to `ingredient/new?returnToDish=<dishDraftId>&prefillName=<query>`.
- After save, navigate back to dish edit and add the ingredient draft row.

B. **Inline quick-create sheet**
- Keep user on dish edit page.
- Open a bottom sheet/overlay for quick-create ingredient.
- On save, insert ingredient then immediately add it to the dish draft.

**Recommendation:** Use option B if feasible. It preserves context and matches the UX goal better. Use option A only if page complexity is too high.

**Verification:**

- Search no-result state has `Tạo nhanh nguyên liệu` CTA.
- New ingredient persists in the ingredient library.
- New ingredient is immediately available in the dish draft.
- CTA copy is `Lưu và thêm vào món` when launched from dish context.

---

## Task 4: Add ingredient detail-first library flow

**Objective:** Make the ingredient library safe and explanatory instead of edit-first.

**Files:**
- Create or modify: `src/app/features/management/ingredient-detail/ingredient-detail.page.ts`
- Create or modify: `src/app/features/management/ingredient-detail/ingredient-detail.page.html`
- Create or modify: `src/app/features/management/ingredient-detail/ingredient-detail.page.scss`
- Modify: `src/app/features/management/management.routes.ts`
- Modify: `src/app/features/management/management.page.ts`
- Modify: `src/app/features/management/management.page.html`

**Detail screen content:**

```text
Tên nguyên liệu
Category + source

Dinh dưỡng
100g/100ml = kcal, protein, carb, fat, fiber

Đơn vị thường dùng
1 quả ≈ 60g
1 muỗng = 15ml

Đang dùng trong món
- Cơm trứng
- Salad trứng

[Sửa thông tin]
[Xóa nguyên liệu]
```

**Rules:**

- Tapping an ingredient card opens detail, not edit form directly.
- `Sửa thông tin` opens existing edit page/form.
- If referenced by dishes, show impact warning before editing nutrition/unit fields.
- Delete remains blocked when referenced.

**Verification:**

- Ingredient library card tap opens detail.
- Detail shows dishes using the ingredient.
- Edit and delete routes/actions preserve existing guard behavior.

---

## Task 5: Update warning and deletion copy

**Objective:** Make data-impact rules explicit in user language.

**Files:**
- Modify: `src/app/features/management/ingredient-edit/ingredient-edit.page.html`
- Modify: `src/app/features/management/ingredient-edit/ingredient-edit.page.ts`
- Modify: existing delete dialog copy in `management.page.ts` if still list-level

**Copy:**

When editing referenced ingredient:

```text
Nguyên liệu này đang được dùng trong {n} món.
Nếu bạn sửa dinh dưỡng hoặc đơn vị quy đổi, tổng calories của các món đó có thể thay đổi.
```

When deleting referenced ingredient:

```text
Không thể xóa “{name}”
Nguyên liệu này đang được dùng trong {n} món. Hãy gỡ khỏi các món trước khi xóa.
```

**Verification:**

- Delete confirm waits for reference count before enabling destructive action.
- Referenced ingredients cannot be deleted.
- User sees impact before editing or saving high-impact fields.

---

## Task 6: Update docs and mockups

**Objective:** Keep docs/mockups aligned with the dish-first UX contract.

**Files:**
- Modify: `docs/2-requirements/prd.md`
- Modify: `docs/3-design/design-system.md`
- Modify: `docs/5-development/phase-1-management.md`
- Modify: `docs/5-development/development-plan.md`
- Modify: `docs/1-vision/product-vision.md` if feature table still says manual total entry
- Modify/create mockups in `docs/3-design/mockups/`

**Required doc updates:**

- Add a Management UX principle: `Món ăn` is primary, ingredient library is supporting.
- Replace old segment order `Nguyên liệu | Món ăn` with `Món ăn | Thư viện nguyên liệu`.
- Remove stale manual total entry references from Phase 1 descriptions.
- Add contextual ingredient creation flow to F-02.
- Keep F-01 as a real feature, but describe it as a library/correction surface.

**Verification:**

Run searches:

```bash
rg "Nguyên liệu \| Món ăn|manual total entry|manual total entry|manual total entry" docs
```

Expected: only historical/audit references or explicit notes saying the old flow was replaced.

---

## Task 7: Full verification

**Objective:** Prove the redesign is correct in code and on emulator before claiming implementation done.

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

- Quản lý opens `Món ăn` by default.
- Segment order is `Món ăn | Thư viện nguyên liệu`.
- Dish empty/list/search works.
- Dish FAB menu works.
- Creating dish from ingredients works.
- Missing ingredient can be quick-created from dish context.
- Quick-created ingredient appears in ingredient library.
- Ingredient library detail shows nutrition, units, and dish usage.
- Referenced ingredient edit/delete impact warnings are visible.
- Full-bleed/no-padding layout checked via content insets.

---

## Rollback Strategy

If the contextual quick-create implementation becomes too large, rollback only Task 3 and keep Tasks 1–2 plus docs/mockups. The minimum safe UX improvement is still:

```text
Quản lý opens Món ăn first.
Ingredient tab is renamed to Thư viện nguyên liệu.
```

This gives immediate UX improvement without risking data-layer changes.
