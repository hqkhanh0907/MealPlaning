+# Phase 1 Mockups — Tab Quản lý

**17 màn HTML** standalone cho tab Quản lý của HealthMate AI (Phase 1).

> **Gram-only revision (2026-04-30).** Từ phiên bản này, app bỏ hoàn toàn lớp đơn vị / quy đổi / density / size / modifier / edible yield / pantry / snapshot. Mọi nutrition đều canonical `per 100g`, mọi input/output ở UI đều ở dạng **gram**. 5 màn cũ (07, 08, 17, 21, 22) đã bị xoá vì không còn use case.

## Cách xem
Mở `index.html` trong browser. Mỗi card link tới 1 màn full-screen với phone frame 390×844 (iPhone 13).

## Structure

| Group | Files | Mục đích |
|-------|-------|----------|
| A · Landing | 01–02 | Tab overview + empty state |
| B · Ingredient | 03–06, 09–10 | List, detail, add/edit, soft delete, search empty |
| C · Recipe | 11–16 | List, detail, add/edit, add ingredient to recipe, empty |
| D · Edge case | 18–20 | Validation errors, USDA auto-fill, category-driven defaults |

## Design DNA
**Lifesum / Sage Wellness** — direction 03 trong `docs/3-design/explorations/2026-color-directions/`. Token sync với `03-sage-suite/_tokens.css`.

- Primary: `#6B8E6F` sage emerald
- Accent (CTA/FAB): `#E07856` coral
- AI accent: `#B89968` warm gold
- Surface: `#F7F2EA` warm cream
- Display: `Fraunces` italic, body: `Inter`

## Nguyên tắc UX áp dụng (gram-only)

- **Gram canonical** — mọi nutrition lưu ở dạng `kcal / 100g`, mọi input ở UI bằng `g`. Không quy đổi đơn vị.
- **Floating-label form** — theo `docs/3-design/design-system.md` §8.6 và `scripts/check-form-input-pattern.mjs`.
- **Realtime nutrition** — recipe total và meal nutrition tính realtime từ ingredient (qua VIEW `dish_with_totals`). Không snapshot.
- **Soft delete với usage block** — khi nguyên liệu được dùng trong dish/log, không cho xoá; user phải sửa món trước.
- **Edge cases visible** — validation errors (calo âm, macro tổng > 100g), USDA auto-fill 5 macro, category-driven seed nutrition.

## Refs

- PRD: `docs/2-requirements/prd.md` v1.1 (gram-only)
- Data model: `docs/3-design/data-model.md` v1.1 (gram-only) — schema 4 bảng chính (ingredient, dish, dish_ingredient, meal_log_item)
- Business rules: `docs/4-architecture/business-rules.md` v1.1 (gram-only)
- Roadmap: `docs/5-development/development-plan.md` v1.1 — Phase 1.5A đã loại bỏ
- AI prompts: `docs/5-ai/ai-strategy.md` v1.1 — 3 prompt template gram-only
- Phase 0 mockup: `../phase-0-onboarding.html`

## Files

```
phase-1/
├── _tokens.css                       (DNA tokens, sync 03-sage-suite)
├── _shared.json                      (placeholder)
├── index.html                        (gallery, 17 cards)
├── 01-management-overview.html
├── 02-management-empty.html
├── 03-ingredient-list.html
├── 04-ingredient-detail.html
├── 05-ingredient-add.html
├── 06-ingredient-edit.html
├── 09-soft-delete.html
├── 10-ingredient-search-empty.html
├── 11-recipe-list.html
├── 12-recipe-detail.html
├── 13-recipe-add.html
├── 14-recipe-edit.html
├── 15-recipe-add-ingredient.html
├── 16-recipe-empty.html
├── 18-form-validation.html
├── 19-usda-autofill.html
└── 20-category-suggest.html
```

## Removed in gram-only revision (2026-04-30)

- `07-measurement-add.html` — không còn measurement layer
- `08-measurement-edit.html` — không còn measurement layer
- `17-missing-conversion.html` — không có quy đổi nên không có "missing conversion"
- `21-size-picker.html` — không có size S/M/L
- `22-modifier-picker.html` — không có modifier raw/cooked

## Changelog

- **2026-04-30 — v1.1 (gram-only revision)**: xoá 5 màn (07, 08, 17, 21, 22), update 13 màn còn lại, README + index.html cập nhật count 22→17.
- **2026-04-28 — v1.0**: ship 22 màn ban đầu, batch 5 lần.
