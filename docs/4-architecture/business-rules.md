# Business Rules — HealthMate AI

**Version:** 1.0
**Date:** 2026-04-25
**Status:** Active

Tài liệu này tập trung các invariant nghiệp vụ mà mọi tầng (UI, store, repository, service, AI) đều phải tuân thủ. Khác với data model (mô tả "shape"), business rules mô tả "behavior must hold". Khi conflict với mockup hoặc tài liệu cũ, **business-rules.md là source of truth**.

---

## RULE-DISH-TOTAL — Total nutrition của dish luôn derived

Áp dụng cho: F-02 (Quản lý món ăn), F-03 (Lịch ăn), F-06 (AI Menu Suggest), F-07 (Daily Insight).

### RULE-DISH-TOTAL-01: Single source of truth = VIEW `dish_with_totals`

- Total nutrition của một dish (`total_calories`, `total_protein`, `total_carbs`, `total_fat`, `total_fiber`) **KHÔNG** được persist trên bảng `dish`.
- Mọi nơi cần đọc total **PHẢI** query từ VIEW SQL `dish_with_totals` (xem `docs/3-design/data-model.md` §4.2b).
- Repository pattern: `DishRepository.findById()` / `findAll()` đọc từ VIEW; `create()` / `update()` chỉ ghi vào bảng `dish` (không bao giờ ghi total_*).

### RULE-DISH-TOTAL-02: Không có cơ chế nhập tay total

- V1 đã loại bỏ "Quick Add" dish. Enum `dish.type` chỉ còn `'ingredient_based' | 'ai_autofill'`.
- Mọi dish **phải** có ít nhất 1 row `dish_ingredient` trước khi cho phép save (validation tầng store + DB).
- AI auto-fill prompt **CHỈ** trả về `ingredients[]`. Nếu response có `total_*`, app **MUST** strip trước khi lưu.

### RULE-DISH-TOTAL-03: Preview UI được phép, persist thì không

- Khi user đang edit form (chưa save), helper TS `computeDishTotalsPreview(ingredients, ingredientLookup)` được dùng để hiển thị realtime.
- Output của helper này **KHÔNG** được persist vào bất kỳ bảng nào, **KHÔNG** được dùng làm authoritative cho downstream service.
- Sau khi save, UI phải re-query dish từ VIEW (qua repository) thay vì giữ lại preview value.

### RULE-DISH-TOTAL-04: Ingredient nutrition thay đổi → dish total auto-cập nhật

- Đây là behavior **mong muốn** (không phải bug). VIEW phản ánh ngay lập tức.
- Snapshot lịch sử (ví dụ "đã ăn ngày 2026-04-10 với calo X") không lưu ở `dish` — phải snapshot ở `planned_dish.calories/...` lúc tạo planned_dish.

---

## RULE-DISH-INGREDIENT-NORMALIZE — Chuẩn hoá đơn vị

Áp dụng cho: F-02 khi insert/update `dish_ingredient`.

### RULE-DI-NORM-01: amount_unit hợp lệ

- `amount_unit ∈ {'g', 'ml', 'piece'}`.
- `'piece'` chỉ hợp lệ khi ingredient có `grams_per_unit` (solid, basis = 'g') hoặc `ml_per_unit` (liquid, basis = 'ml').
- Nếu thiếu metadata → **reject** input ở tầng repository, throw `InvalidDishIngredientUnitError`. UI phải catch và yêu cầu user chuyển sang g/ml.

### RULE-DI-NORM-02: normalized_amount tính lúc insert/update

```
if amount_unit == 'piece':
  normalized_amount = amount_value × (grams_per_unit | ml_per_unit)
else:  # 'g' | 'ml'
  normalized_amount = amount_value
```

- Lưu **cả** `amount_value` + `amount_unit` (user input) **và** `normalized_amount` (basis unit).
- Không lưu macro snapshot trong `dish_ingredient` (đã DROP — tính qua VIEW).

---

## RULE-INGREDIENT-PROVENANCE — Nguồn gốc ingredient

- `source = 'db'`: insert từ seed `ingredients.json`.
- `source = 'manual'`: user tự tạo.
- `source = 'ai'`: AI lookup tạo mới.
- Khi user sửa ingredient `source = 'ai'` → đổi sang `source = 'manual'` (đã trở thành tài sản user).
- Khi user sửa ingredient `source = 'db'` → giữ `source = 'db'` HAY chuyển sang `'manual'`? **TBD** — chưa có quyết định trong audit C-02. Tracker: cần resolve trước Phase 1 milestone "ingredient edit flow".

---

## RULE-DISH-PROVENANCE — Nguồn gốc dish

- `source = 'db'`: seed từ `dishes.json`.
- `source = 'custom'`: user tự tạo (`type = 'ingredient_based'`).
- `source = 'ai'`: AI auto-fill saved (`type = 'ai_autofill'`).
- User sửa seed dish (`source = 'db'`) → record gốc đổi `source = 'custom'`.

---

## Tham chiếu

- Schema chi tiết: `docs/3-design/data-model.md` §4.1 (ingredient), §4.2 (dish), §4.2b (dish_with_totals VIEW), §4.3 (dish_ingredient).
- Feature spec: `docs/2-requirements/prd.md` §F-01, §F-02.
- AI integration: `docs/5-ai/ai-strategy.md` §3.1, §3.2.

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-04-25 | Audit C-02 | Tạo file. Codify RULE-DISH-TOTAL-01..04, RULE-DI-NORM-01..02, RULE-*-PROVENANCE. Sync với commit drop `dish.total_*` + drop `'quick'` từ `dish.type`. |
