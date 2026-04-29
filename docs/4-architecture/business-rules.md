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

### RULE-DI-NORM-01: `unit_id` phải hợp lệ và được resolve về canonical basis

- `dish_ingredient` không còn dùng `amount_unit`; thay bằng `unit_id` tham chiếu `unit(id)`.
- Mọi insert/update `dish_ingredient` **PHẢI** đi qua một resolver thống nhất: `resolveUnit(ingredient, unit, amountValue, ingredientUnit?)`.
- Output của resolver là `normalized_amount` cùng dimension với `ingredient.nutrition_basis_unit`.

### RULE-DI-NORM-02: Thứ tự ưu tiên khi resolve conversion

1. Nếu unit cùng dimension với basis:
   - dùng global factor (`g`, `kg`, `ml`, `l`, `tbsp`, `tsp`, `cup`) hoặc curated `ingredient_unit.factor_to_basis` phù hợp.
2. Nếu unit là ingredient-specific (`piece`, `clove`, `bunch`, `slice`, `pinch`, ...):
   - bắt buộc dùng `ingredient_unit.factor_to_basis`.
3. Nếu unit khác dimension với basis:
   - ưu tiên `ingredient_unit.factor_to_basis`
   - nếu không có thì dùng `ingredient.density_g_per_ml`
   - nếu vẫn không có → **reject** input ở tầng repository với `InvalidDishIngredientUnitError`.

### RULE-DI-NORM-03: Không silent convert giữa `g` và `ml`

- Không được tự suy đoán mass ↔ volume khi thiếu curated factor hoặc `density_g_per_ml` đáng tin.
- Không được fallback sang 1:1 giữa `g` và `ml`.

### RULE-DI-NORM-04: Approximate unit được phép nhưng phải gắn cờ rõ

- Unit có `unit.is_approximate = 1` (VD `pinch`) được phép dùng trong Phase 1.
- UI phải hiển thị dấu `≈` hoặc nhãn `ước lượng`.
- Approximate unit vẫn phải resolve ra `normalized_amount`; không được bỏ qua khỏi phép tính macro.

### RULE-DI-NORM-05: Dual-write giữ nguyên, macro snapshot vẫn cấm

- Lưu **cả** `amount_value` + `unit_id` (user input) **và** `normalized_amount` (basis unit).
- Không lưu macro snapshot trong `dish_ingredient` (đã DROP — tính qua VIEW).
- `normalized_amount` là input duy nhất cho `dish_with_totals` VIEW.

---

## RULE-MEASUREMENT-SPECIFICITY — Conversion theo từng nguyên liệu/product

Áp dụng cho: F-01, F-02, Phase 1.5A pantry/measurement, future product/barcode.

### RULE-MS-01: Global conversion chỉ dùng cho true mass/volume

- `g`, `kg` có thể global-convert về `g`.
- `ml`, `l` có thể global-convert về `ml`.
- `tbsp`, `tsp`, `cup` có thể global-convert về `ml` khi nutrition basis là volume.
- Không được tự quy đổi `cup/tbsp/tsp` sang `g` nếu thiếu ingredient-specific measurement hoặc density đáng tin.

### RULE-MS-02: Count/package/serving unit không được global-convert

- `piece/quả/trái/củ/tép`, `slice`, `bunch`, `pack`, `bottle`, `serving` phải có conversion theo ingredient/product/state/size.
- Ví dụ: `1 quả cà chua`, `1 trái dưa hấu`, `1 quả trứng`, `1 củ khoai tây` là các measurement khác nhau.
- Nếu thiếu measurement, resolver phải trả unresolved state để UI hỏi user; không được tự đoán.

---

## RULE-GROSS-EDIBLE-YIELD — Nutrition tính trên phần ăn được

Áp dụng cho: pantry item, recipe/dish ingredient line, meal/food log.

### RULE-GEY-01: Phân biệt gross và edible amount

- `gross_amount` là lượng user mua/cầm/nắm, có thể gồm vỏ/xương/phần bỏ đi.
- `edible_amount` là lượng dùng để tính nutrition.
- Nutrition calculation luôn dùng `edible_amount`.

### RULE-GEY-02: Khi input là gross phải có yield

- Nếu measurement `applies_to = 'gross'`, phải có `edible_yield_ratio` hoặc hỏi user.
- Formula: `edible_amount = gross_amount × edible_yield_ratio`.
- Ví dụ: 1 trái dưa hấu 5kg gross × 60% = 3kg edible.

---

## RULE-CONVERSION-SNAPSHOT — Lưu snapshot conversion đã dùng

Áp dụng cho: pantry item, recipe/dish ingredient line, meal/food log.

### RULE-CS-01: Saved usage phải trace được conversion

- Khi user lưu pantry item hoặc ingredient line, app phải lưu input gốc và normalized amount.
- Phase 1.5A target thêm `conversion_snapshot_json` gồm: `measurement_id`, `measurement_version`, `quantity_per_unit`, `quantity_unit_id`, `applies_to`, `edible_yield_ratio`, `confidence`, `is_approximate`, `normalized_edible_amount`.

### RULE-CS-02: Historical log phải snapshot nutrition

- Active dish/recipe có thể derive live từ ingredient để tránh drift trong master data.
- Meal/food log lịch sử phải lưu `nutrition_snapshot_json` hoặc equivalent columns tại thời điểm log.
- Không dùng current ingredient nutrition để rewrite lịch sử ăn cũ một cách silent.

---

## RULE-MISSING-CONVERSION-UX — Thiếu conversion thì hỏi, không đoán

Áp dụng cho: mọi form nhập amount/unit.

- Nếu resolver không thể convert amount/unit về `g/ml` authoritative, UI phải hỏi một câu cụ thể bằng ngôn ngữ đời thực.
- Ví dụ: “1 quả cà chua của bạn khoảng bao nhiêu gram?” hoặc “1 cup bột mì này khoảng bao nhiêu gram?”.
- UI nên cho lựa chọn nhanh `Nhỏ / Vừa / Lớn / Tự nhập` nếu phù hợp.
- User có 2 lựa chọn lưu: “Chỉ lần này” (snapshot only) hoặc “Nhớ cho sau” (tạo/update measurement).
- Không được fallback `1g = 1ml`, không được bỏ qua khỏi phép tính macro, không được lưu authoritative line nếu vẫn unresolved.

---

## RULE-PANTRY-STOCK — Pantry là stock/lot, không phải ingredient master

Áp dụng cho: Phase 1.5A pantry.

- `ingredient` lưu identity + nutrition + measurement; không lưu hạn dùng/vị trí nhà user.
- `pantry_item` lưu quantity, location, expiry, opened date, remaining amount và conversion snapshot.
- Nhiều lot cùng ingredient nhưng khác expiry/location phải được lưu riêng để cảnh báo hết hạn chính xác.
- Pantry display phải hiển thị input đời thực của user và normalized edible amount khi có thể, ví dụ `4 quả ≈ 480g`.

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

- Schema chi tiết: `docs/3-design/data-model.md` §4.0 (unit/measurement), §4.1 (ingredient/nutrition profile), §4.2 (dish), §4.2b (dish_with_totals VIEW), §4.3 (dish_ingredient), §4.7–4.9 (Phase 1.5A pantry/product targets).
- Feature spec: `docs/2-requirements/prd.md` §F-01, §F-02, §F-02.5.
- AI integration: `docs/5-ai/ai-strategy.md` §3.1, §3.2.

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-04-25 | Audit C-02 | Tạo file. Codify RULE-DISH-TOTAL-01..04, RULE-DI-NORM-01..02, RULE-*-PROVENANCE. Sync với commit drop `dish.total_*` + drop `'quick'` từ `dish.type`. |
| 2026-04-29 | Pantry/measurement audit | Thêm rules Phase 1.5A cho measurement specificity, gross/edible yield, conversion snapshot, missing conversion UX và pantry stock. |
