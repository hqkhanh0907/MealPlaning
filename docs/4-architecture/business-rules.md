# Business Rules — HealthMate AI

**Version:** 1.1 (gram-only revision)
**Date:** 2026-04-30
**Status:** Active

> **Revision 1.1 (2026-04-30) — Gram-only absolute.** Sáu rule liên quan unit/measurement/gross-edible/snapshot/missing-conversion/pantry đã bị **xoá hẳn** vì không còn áp dụng. Rule `RULE-DISH-INGREDIENT-NORMALIZE` được thay bằng `RULE-DISH-INGREDIENT-GRAM`. Xem PRD §F-01 và §"Triết lý gram-only" để biết lý do.

Tài liệu này tập trung các invariant nghiệp vụ mà mọi tầng (UI, store, repository, service, AI) đều phải tuân thủ. Khác với data model (mô tả "shape"), business rules mô tả "behavior must hold". Khi conflict với mockup hoặc tài liệu cũ, **business-rules.md là source of truth**.

---

## RULE-DISH-TOTAL — Total nutrition của dish luôn derived

Áp dụng cho mọi dish (`type = 'ingredient_based'` hoặc `'ai_autofill'`).

### RULE-DISH-TOTAL-01: Single source of truth = VIEW `dish_with_totals`

- Mọi tầng phải đọc `total_calories/protein/carbs/fat/fiber` từ VIEW `dish_with_totals`.
- VIEW tính realtime từ `SUM(dish_ingredient.gram_weight × ingredient.calories / 100)`.
- Schema bảng `dish` **không có** cột `total_*`. Bất kỳ migration/code nào cố thêm lại đều vi phạm rule này.

### RULE-DISH-TOTAL-02: Không có cơ chế nhập tay total

- Phase 1 không hỗ trợ Quick Add (món không có ingredient với calo nhập tay). Mọi dish phải có ≥ 1 dish_ingredient.
- AI auto-fill (`type = 'ai_autofill'`) không cấp đường tắt: AI vẫn phải sinh danh sách ingredient + gram_weight, sau đó tính total qua VIEW như mọi dish khác.

### RULE-DISH-TOTAL-03: Preview UI được phép, persist thì không

- Trong form edit dish, UI có thể hiển thị "tổng tạm tính" theo state ngay trong form (chưa save).
- Sau khi save, UI **chỉ được** đọc số từ VIEW. Cấm cache total trên dish object ở store.

### RULE-DISH-TOTAL-04: Ingredient nutrition thay đổi → dish total auto-cập nhật

- User sửa `ingredient.calories` → mọi dish dùng ingredient đó tự cập nhật total khi query VIEW. Không cần migration.
- Trade-off: meal_log lịch sử cũng cập nhật theo. Phase 1 chấp nhận hiện tượng này (xem RULE-DISH-INGREDIENT-GRAM-04).

---

## RULE-DISH-INGREDIENT-GRAM — Gram-only absolute

Đây là rule lõi của gram-only revision (2026-04-30). Thay thế hoàn toàn `RULE-DISH-INGREDIENT-NORMALIZE` cũ.

### RULE-DI-GRAM-01: `gram_weight` là trường định lượng duy nhất

- `dish_ingredient.gram_weight` là trường lưu lượng nguyên liệu duy nhất. Không có `unit_id`, `amount_value`, `amount_unit`, `normalized_amount`, `normalized_unit`.
- Phạm vi: `0.1 → 10000`, đơn vị gram (g). 1 chữ số thập phân ở UI.
- Liquid (sữa/dầu/nước chấm) cũng nhập gram. Quy ước cho người dùng: nước → 1 ml ≈ 1 g; với dầu/sữa user tự cân.

### RULE-DI-GRAM-02: Cấm thêm bất kỳ đơn vị nào ở schema

- Mọi PR cố thêm cột unit/measurement/density/conversion/snapshot vào `ingredient` hoặc `dish_ingredient` đều vi phạm rule này.
- Helper text "đo lường gợi ý" (vd: "1 quả cà chua ≈ 100g") chỉ được phép tồn tại dưới dạng **static UI hint**, không lưu DB, không tham gia tính toán.

### RULE-DI-GRAM-03: Không modifier, không edible yield, không snapshot

- Không lưu trạng thái nguyên liệu (raw/cooked/peeled) như entity riêng. 1 ingredient = 1 bộ nutrition/100g.
- Không lưu `edible_yield_ratio`. User tự cân phần ăn được.
- Không snapshot nutrition tại thời điểm log meal hoặc add ingredient vào recipe. Mọi thứ tính realtime.

### RULE-DI-GRAM-04: Trade-off realtime được chấp nhận

- Khi user sửa `ingredient.calories`, mọi `planned_dish` lịch sử cập nhật theo (vì tính qua VIEW × `planned_dish.servings`).
- Phase 1 chấp nhận hành vi này. Sửa nutrition được coi là hành động hiếm; nếu cần "khoá lịch sử" sẽ là Phase 2 (snapshot tuỳ chọn).

### RULE-DI-GRAM-05: Liquid không có exception

- Sữa, dầu, nước chấm: nutrition vẫn theo per 100g (không có 100ml). Lý do: schema phẳng tuyệt đối.
- Nếu user có dữ liệu nguồn theo ml, app yêu cầu họ tự quy đổi (nước: 1ml=1g; sữa: ~1.03g/ml; dầu: ~0.92g/ml). UI không quy đổi tự động.

---

## RULE-INGREDIENT-DELETE — Xoá nguyên liệu phải mềm

### RULE-ID-DEL-01: Soft-delete bằng `deleted_at`

- Hard-delete bị chặn ở DB layer (`ON DELETE RESTRICT` từ `dish_ingredient`).
- Repository phải set `deleted_at = datetime('now')` thay vì DELETE.
- VIEW `dish_with_totals` filter `ingredient.deleted_at IS NULL` để dish dùng ingredient đã xoá vẫn render được nhưng tính total = 0 cho phần đó.

### RULE-ID-DEL-02: Xoá ingredient có usage phải confirm

- UI phải đếm số dish dùng ingredient và hiển thị trong dialog confirm: "Nguyên liệu này đang dùng trong N món. Soft-delete sẽ làm những món đó tính thiếu calo của thành phần này."
- Không tự cascade.

---

## RULE-INGREDIENT-PROVENANCE — Nguồn gốc ingredient

- `source = 'db'`: seed từ `ingredients.json`.
- `source = 'manual'`: user tự tạo hoặc sửa.
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

- Schema chi tiết: `docs/3-design/data-model.md` §4.1–4.6 (ingredient · dish · dish_with_totals VIEW · dish_ingredient · day_plan · meal_slot · planned_dish).
- Feature spec: `docs/2-requirements/prd.md` §F-01, §F-02 (gram-only revision).
- AI integration: `docs/5-ai/ai-strategy.md` §3.1, §3.2.

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-04-25 | Audit C-02 | Tạo file. Codify RULE-DISH-TOTAL-01..04, RULE-DI-NORM-01..02, RULE-*-PROVENANCE. Sync với commit drop `dish.total_*` + drop `'quick'` từ `dish.type`. |
| 2026-04-29 | Pantry/measurement audit | Thêm rules Phase 1.5A cho measurement specificity, gross/edible yield, conversion snapshot, missing conversion UX và pantry stock. |
| 2026-04-30 | Gram-only revision | **Xoá hẳn** 6 rule: `RULE-DISH-INGREDIENT-NORMALIZE`, `RULE-MEASUREMENT-SPECIFICITY`, `RULE-GROSS-EDIBLE-YIELD`, `RULE-CONVERSION-SNAPSHOT`, `RULE-MISSING-CONVERSION-UX`, `RULE-PANTRY-STOCK`. **Thay** bằng `RULE-DISH-INGREDIENT-GRAM` (5 sub-rule). Thêm `RULE-INGREDIENT-DELETE`. |
