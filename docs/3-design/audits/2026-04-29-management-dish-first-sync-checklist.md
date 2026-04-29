# Management Dish-first Mockup Sync Checklist

**Date:** 2026-04-29  
**Scope:** Update management UX docs/mockups from `Nguyên liệu-first` to `Món ăn-first`.

---

## Source of truth hierarchy

1. `docs/4-architecture/business-rules.md`
2. `docs/2-requirements/prd.md`
3. `docs/3-design/data-model.md`
4. `docs/3-design/design-system.md`
5. `docs/5-development/phase-1-management.md`
6. Existing mockups

---

## New UX contract

```text
Quản lý opens Món ăn first.
Segment order: Món ăn | Thư viện nguyên liệu.
Ingredient creation is primarily contextual inside dish creation.
Ingredient library remains available for correction/maintenance.
```

---

## Files updated

| File | Change |
|---|---|
| `docs/plans/2026-04-29-management-dish-first-ux-redesign.md` | New implementation plan. |
| `docs/3-design/mockups/phase-1-management-dish-first-flow.html` | New end-to-end UX mockup with 9 screens. |
| `docs/3-design/mockups/phase-1-dish-list.html` | Updated segment order/copy note to dish-first. |
| `docs/3-design/mockups/phase-1-ingredient-list.html` | Renamed to supporting `Thư viện nguyên liệu`; updated segment order and empty copy. |
| `docs/2-requirements/prd.md` | F-01 reframed as library; F-02 as primary flow with contextual ingredient creation. |
| `docs/3-design/design-system.md` | Segment spec updated to `Món ăn | Thư viện nguyên liệu`. |
| `docs/5-development/phase-1-management.md` | Scope and architecture note updated; removed quick-add mockup pre-flight item. |
| `docs/5-development/development-plan.md` | Phase 1 deliverable updated to dish-first. |
| `docs/1-vision/product-vision.md` | Feature table updated to avoid manual total entry and ingredient-first wording. |

---

## Required follow-up when implementing code

- `management.page.ts`: default `tab` should become `'dishes'`.
- `managementTabs`: order should become `Món ăn`, `Thư viện nguyên liệu`.
- Dish flow should support quick-create ingredient from ingredient search no-result state.
- Ingredient library should become detail-first before edit.
- Full verification must include emulator UI checks and full-bleed/no-padding layout review.

---

## Ambiguities / deferred decisions

1. Whether contextual ingredient quick-create is implemented as an inline bottom sheet or routed page with return context. Recommendation in the plan: inline sheet if feasible.
2. Whether ingredient detail is a new routed page or modal/sheet. Recommendation: routed/detail page for clarity and unsaved guard consistency.
3. Whether V1 supports “copy ingredient for this dish only”. Recommendation: no; V1 uses global edit semantics and warns impact.


## 2026-04-29 update — Ingredient library detail-first edit

### Decision

- `Thư viện nguyên liệu` still exists, but tap ingredient opens detail/read-only first.
- `Sửa thông tin` is explicit and V1 applies global changes.
- If ingredient is referenced by dishes, UI must show an impact warning because `dish_with_totals` recalculates from current ingredient data.
- Delete remains blocked while referenced.

### Files synced

- `docs/plans/2026-04-29-ingredient-library-detail-first-edit-flow.md`
- `docs/3-design/mockups/phase-1-ingredient-list.html`
- `docs/3-design/mockups/phase-1-ingredient-edit.html`
- `docs/3-design/mockups/phase-1-management-dish-first-flow.html`
- `docs/2-requirements/prd.md`
- `docs/3-design/design-system.md`
- `docs/5-development/phase-1-management.md`
- `docs/5-development/management-ux-flow-redesign-proposal.md`
- `docs/plans/2026-04-29-management-dish-first-ux-redesign.md`

---

## 2026-04-29 source-doc re-check — PRD/Product Vision

### User callout addressed

Earlier notes over-indexed on the latest UX discussion. Re-check completed against:
- `docs/1-vision/product-vision.md`
- `docs/2-requirements/prd.md` §Core Nutrition F-01/F-02
- `docs/4-architecture/business-rules.md`
- `docs/3-design/data-model.md`
- `docs/5-development/phase-1-management.md`

### Confirmed constraints

- Ingredient nutrition basis remains canonical `100g/100ml`; unit/serving wording is only an input/helper layer.
- `Món ăn` remains the primary user flow; `Thư viện nguyên liệu` is supporting master data.
- Dish total remains derived via `dish_with_totals`; Quick Add/manual total stays out of V1.
- Product Vision requires AI-first, fast, beginner-friendly UX; ingredient detail-first must remain a safety/maintenance flow, not the main workflow.

### Additional files patched in this re-check

- `docs/plans/2026-04-29-ingredient-library-detail-first-edit-flow.md` — added Product Vision/PRD re-check and source-doc audit requirement before coding.
- `docs/5-development/management-ux-flow-redesign-proposal.md` — clarified Product Vision and canonical nutrition constraints; changed “1 khẩu phần” from persisted basis to helper that must convert to `100g/100ml`.
- `docs/5-development/phase-1-management.md` — removed active Quick Add/addQuick remnants and aligned AI Auto-fill wording with PRD V1 while preserving no-manual-total rule.

