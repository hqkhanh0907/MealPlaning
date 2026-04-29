# Phase 1 Mockup Flow + Design Rule Audit — 2026-04-29

## 1. Kết luận nhanh

Khi lập runtime implementation plan `2026-04-29_ingredient-detail-first-runtime-slices-1-2-3.md`, plan đã bám PRD/Product Vision và runtime audit, nhưng **chưa đủ bằng chứng rằng toàn bộ mockup Phase 1 đã được re-audit ngay tại thời điểm lập plan**.

Audit này kiểm tra lại các mockup Phase 1 liên quan đến flow 1→2→3:

1. `Món ăn` first trong tab `Quản lý`.
2. Ingredient library detail-first.
3. Impact warning trước khi sửa/lưu ingredient đang được dùng.
4. Design rule Sage Wellness: warm neutral, Fraunces display heading, coral primary CTA, không blue Material, content có padding, không expose technical term trên UI chính.

## 2. Source of truth hierarchy

1. `docs/1-vision/product-vision.md`
   - AI-first, không form-first.
   - Daily interaction nhanh, beginner-friendly.
2. `docs/2-requirements/prd.md`
   - F-01: ingredient library là supporting/safety/maintenance surface.
   - F-01: tap ingredient mở detail/read-only trước, CTA `Sửa thông tin` mới mở form.
   - F-01: referenced ingredient phải có impact warning.
   - F-02: `Quản lý` mở `Món ăn` trước, segment `Món ăn | Thư viện nguyên liệu`.
3. `docs/3-design/design-system.md`
   - Sage Wellness, warm neutral, tránh Material Blue saturated.
   - Coral CTA chính cho submit/FAB/save.
   - Fraunces display heading/title.
   - Page padding/content inset phải rõ, không full-bleed primary content.
4. `.hermes/plans/2026-04-29_ingredient-detail-first-runtime-slices-1-2-3.md`
   - Runtime implementation plan theo thứ tự 1→2→3.
5. Current Phase 1 mockup HTML files.

## 3. Mockup files audited

| File | Role | Result before patch |
|---|---|---|
| `phase-1-management-dish-first-flow.html` | Canonical end-to-end flow | Flow đúng, nhưng design-rule drift: Fraunces link thiếu italic axis, primary save buttons dùng sage thay vì coral |
| `phase-1-dish-list.html` | Focused dish list mockup | Flow đúng dish-first; spec/CSS còn stale `Blue bg`/Material-blue rgba cho type badge; CTA note còn gold dù override đã force coral |
| `phase-1-ingredient-list.html` | Focused ingredient list/detail mockup | Flow detail-first đúng; một warning background còn render segment trong detail; CSS còn Material-blue rgba cho focus/filter active; CTA note còn gold dù override đã force coral |
| `phase-1-ingredient-edit.html` | Add/edit ingredient form mockup | Entry/detail-first spec đúng; CSS còn Material-blue rgba; warning copy hơi overclaim “sẽ làm thay đổi/tính lại” thay vì “có thể thay đổi” |
| `phase-1-dish-edit-ingredient-based.html` | Dish edit / ingredient search + amount flow | Flow đúng dish-first/contextual ingredient add; CSS còn Material-blue rgba ở outline/selected unit/default unit states |

## 4. Discrepancies found

### Critical / High

- **D1 — Canonical mockup CTA color drift**
  - File: `phase-1-management-dish-first-flow.html`
  - Evidence: `.btn.sage` used for `Lưu món ăn`, `Lưu và thêm vào món`, `Thêm vào món`, `Sửa thông tin`.
  - Conflict: Design System §2.2 says Coral is CTA fill for submit/FAB/save.
  - Required patch: make primary CTA class use coral; sage remains brand/selection color.

- **D2 — Canonical mockup Fraunces italic axis missing**
  - File: `phase-1-management-dish-first-flow.html`
  - Evidence: Google Font URL loads `Fraunces:opsz,wght...` but CSS uses `font-style: italic`.
  - Conflict: Sage Wellness pages should use true Fraunces italic axis, not faux italic.
  - Required patch: update font link to `Fraunces:ital,opsz,wght...`.

- **D3 — Material-blue alpha remains in focused/selected states**
  - Files: `phase-1-dish-list.html`, `phase-1-ingredient-list.html`, `phase-1-ingredient-edit.html`
  - Evidence: `rgba(33,150,243,...)`, `rgba(66,165,245,...)`, and “Blue bg” wording.
  - Conflict: Design System says warm Sage Wellness, avoid Material Blue saturated.
  - Required patch: convert active/focus alpha colors to sage/coral/gold family; update spec notes.

### Medium

- **D4 — Detail warning background includes segment control**
  - File: `phase-1-ingredient-list.html`
  - Evidence: Screen 9 impact warning background includes `Món ăn | Thư viện nguyên liệu` segment inside detail context.
  - Conflict: Detail page should be standalone detail/read-only; segment belongs to list shell, not ingredient detail.
  - Required patch: remove segment from warning background.

- **D5 — Warning copy overclaims deterministic recalc**
  - File: `phase-1-ingredient-edit.html`
  - Evidence: copy says changing nutrition/unit “sẽ làm thay đổi/tính lại”.
  - Conflict: Runtime plan notes `dish_ingredient.normalized_amount` already stores converted amount; macro changes will affect derived totals, but unit conversion policy has nuance.
  - Required patch: use “có thể thay đổi”; spec note should mention caution for unit conversion policy.

### Low / acceptable with note

- `manual total` appears only in spec note as “no manual total entry” → acceptable.
- `per serving` appears only in guardrail/spec note “No Phase 1 nutrition basis like per serving” → acceptable.
- `khẩu phần/bao bì → quy đổi` in quick-create helper → acceptable because UI explicitly says convert to `100g/100ml` before persistence.
- Focused ingredient/dish mockups still include old CSS blocks followed by Sage override blocks. This is acceptable if rendered result is correct, but stale earlier spec rows should be patched where they contradict active design rules.

## 5. Required patches

- [x] Patch `phase-1-management-dish-first-flow.html`
  - [x] True Fraunces italic font URL.
  - [x] Primary CTA class uses coral, not sage.
  - [x] Spec note records Coral CTA rule.
- [x] Patch `phase-1-dish-list.html`
  - [x] Replace Material-blue `rgba(33,150,243,...)` with sage alpha.
  - [x] Replace “Blue bg + blue text” spec copy with sage badge copy.
  - [x] Update CTA spec row from gold to coral.
- [x] Patch `phase-1-ingredient-list.html`
  - [x] Replace Material-blue focus/filter alpha with sage alpha.
  - [x] Remove list segment from detail warning background.
  - [x] Update CTA spec row from gold to coral.
- [x] Patch `phase-1-ingredient-edit.html`
  - [x] Replace Material-blue alpha in default badge, outline button, unit actions.
  - [x] Change impact warning copy to “có thể thay đổi”.
  - [x] Update edit semantics spec note to avoid overclaiming unit conversion recalculation.
- [x] Patch `phase-1-dish-edit-ingredient-based.html`
  - [x] Replace Material-blue alpha in outline button, selected unit, and default unit badge states.
  - [x] Keep `Quick Add`/manual total references only as removed/non-goal spec notes.

## 6. Verification checklist

- [ ] HTML files parse as valid-enough HTML using Python `html.parser`.
- [ ] Keyword checks:
  - `Món ăn | Thư viện nguyên liệu` present.
  - `Chi tiết nguyên liệu` present.
  - `Sửa thông tin` present.
  - `Tiếp tục sửa` present.
  - `100g/100ml` guardrail present.
  - No active UI text saying `Nguyên liệu | Món ăn`.
  - No active UI text saying `Quick Add` except historical/spec note “removed”.
  - No active UI text saying `manual total` except “removed/no manual total”.
- [ ] CSS drift checks:
  - No `rgba(33,150,243` or `rgba(66,165,245` in audited active mockups.
  - Primary CTA/FAB spec references coral, not gold as primary CTA.
- [ ] Visual preview/screenshot if available in environment.

## 7. Verification results

Verified by script on 2026-04-29:

```text
OK: Phase 1 audited mockups pass flow + design-rule verification
phase-1-management-dish-first-flow.html bytes 23769 frames 12
phase-1-dish-list.html bytes 53862 frames 7
phase-1-ingredient-list.html bytes 75044 frames 12
phase-1-ingredient-edit.html bytes 38087 frames 7
phase-1-dish-edit-ingredient-based.html bytes 53964 frames 11
```

Checks passed:

- HTML parser accepted all audited files.
- No `rgba(33,150,243...)` / `rgba(66,165,245...)` Material-blue alpha remains in audited mockups.
- No old literal segment order `Nguyên liệu | Món ăn` remains in audited mockups.
- Canonical management mockup has true Fraunces italic font URL and coral primary CTA.
- Dish list shows `Món ăn` active before `Thư viện nguyên liệu`.
- Ingredient list shows `Món ăn` before `Thư viện nguyên liệu`, with `Thư viện nguyên liệu` active.
- Ingredient list/detail mockup contains `Chi tiết nguyên liệu`, `Sửa thông tin`, `Tiếp tục sửa`, and detail-first interaction spec.
- Ingredient edit mockup keeps canonical `100g/100ml`, detail-first entry rule, and cautious impact copy.
- Dish edit ingredient-based mockup keeps contextual `Thêm nguyên liệu`, `Dinh dưỡng theo 100g/100ml`, `dish_with_totals`, and no manual total entry.

Visual smoke check with Chrome headless + vision:

- `phase-1-management-dish-first-flow.html`: segment `Món ăn` first/active, CTA coral, padded content. Detail-first not visible in first screenshot only because below the fold.
- `phase-1-ingredient-list.html`: segment order correct with `Thư viện nguyên liệu` active, FAB coral, padded content. Vision noted that detail-first is below the first viewport; source/spec verification covers it.
- `phase-1-ingredient-edit.html`: canonical `100g/100ml`, floating-label input wrapper, padded content, no obvious Material-blue. Vision noted toolbar `Lưu` is white text on sage; bottom CTA is coral. This is acceptable as toolbar action is secondary/shortcut while submit CTA uses coral.

## 8. Status

Done. Mockups are now aligned enough to support implementing runtime slices 1→2→3. Runtime code has not been changed in this audit slice.
