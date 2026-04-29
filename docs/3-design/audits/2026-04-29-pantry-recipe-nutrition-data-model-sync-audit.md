# Audit docs/data model sync — Pantry + Recipe + Ingredient Measurement + Nutrition

Ngày: 2026-04-29  
Scope: audit tài liệu hiện tại sau report `meal-recipe-pantry-nutrition-ux-data-model-research-2026-04-29.md`; xác định drift và việc cần cập nhật trước khi implement hoặc sync mockup.  
Runtime code: **không sửa** trong audit này.

---

## 1. Source-of-truth hierarchy

| Priority | Source | Lý do |
|---:|---|---|
| 1 | `docs/4-architecture/business-rules.md` | Invariant bắt buộc cho tính nutrition/dish total/unit resolver. |
| 2 | `docs/2-requirements/prd.md` | Requirement V1 đang active. |
| 3 | `docs/3-design/data-model.md` | Schema hiện tại, nhưng chỉ phản ánh Phase 1. |
| 4 | `docs/5-development/phase-1-management.md` | Plan implementation Phase 1; có thể thấp hơn business rules/PRD nếu drift. |
| 5 | `docs/5-development/meal-recipe-pantry-nutrition-ux-data-model-research-2026-04-29.md` | Research mở rộng cho pantry/recipe/nutrition model; dùng để đề xuất Phase 1.5A/2, chưa phải PRD active. |
| 6 | `docs/3-design/mockups/*.html` | Mockup spec; phải sync theo docs, không ngược lại. |

---

## 2. Audit summary

### 2.1 Điều đang đúng / đã aligned

| Area | Evidence | Status |
|---|---|---|
| Ingredient canonical nutrition | PRD F-01, data-model §4.1, business rules | Aligned: per `100g/100ml` là source of truth Phase 1. |
| Dish total derived | `business-rules.md` RULE-DISH-TOTAL; `data-model.md` view `dish_with_totals` | Aligned: không persist total trên dish. |
| Unit resolver | `business-rules.md` RULE-DI-NORM; `data-model.md` §4.3 | Aligned ở mức Phase 1: resolver normalize `dish_ingredient`. |
| Search/context quick-create | PRD F-01/F-02 + mockup `phase-1-management-dish-first-flow.html` | Aligned: ingredient là supporting library, món là flow chính. |
| Preview wording | `phase-1-ingredient-edit.html`, `phase-1-dish-edit-ingredient-based.html` | Aligned một phần: có preview kcal/macro, không expose technical names trên UI chính. |

### 2.2 Drift / missing so với research mới

| ID | Priority | Drift | Current docs/mockup | Impact | Recommendation |
|---|---|---|---|---|---|
| D1 | Critical | Chưa có **pantry/stock** model trong PRD/data-model | PRD F-01 là thư viện nguyên liệu, chưa có “nhà đang có gì”; data-model không có `pantry_item`, `storage_location` | Không đáp ứng mục tiêu quản lý nguyên liệu hằng ngày, hạn dùng, vị trí lưu trữ | Thêm feature doc F-02.5 / Phase 1.5A “Kho nguyên liệu”; schema `storage_location`, `pantry_item/stock_lot`. |
| D2 | Critical | `ingredient_unit` hiện quá mỏng cho count/cup/serving/gross/edible | Chỉ có `factor_to_basis`, `is_default`, `display_label`; không có `size_option`, `applies_to`, `edible_yield_ratio`, `confidence`, `version` | Không xử lý đúng cà chua/quả, dưa hấu/gross, khoai tây hao hụt, cup bột mì | Đổi/mở rộng thành `ingredient_measurement`; giữ compatibility mapping với `ingredient_unit` hiện tại. |
| D3 | High | Chưa có `ingredient_variant/state` | PRD có category/nutrition basis, chưa có raw/cooked/peeled/chopped/canned/dried ở schema chính | Raw/cooked/dried/canned có nutrition/conversion khác nhau, dễ sai dữ liệu | Thêm `ingredient_variant` hoặc ít nhất `state/form` với migration path. |
| D4 | High | Chưa có `nutrition_profile` multi-basis | Current `ingredient` lưu calories/protein/carbs/fat/fiber trực tiếp per `100g/100ml` | Không trace được source per serving/per piece từ product/barcode/USDA portion | Phase 1 giữ canonical field; Phase 1.5A/2 thêm `nutrition_profile` để lưu source + normalized. |
| D5 | High | Chưa có conversion snapshot | `dish_ingredient` lưu `amount_value`, `unit_id`, `normalized_amount`; không lưu factor/version đã dùng | Nếu conversion master đổi, không biết dòng cũ dùng factor nào; food log lịch sử dễ drift | Thêm `conversion_snapshot_json` cho recipe/dish line, pantry item, meal log. |
| D6 | High | Food log lịch sử chưa rõ snapshot policy | `planned_dish` có snapshot calories/protein/carbs/fat; recipe line không có | Calendar/log cũ có thể sai nếu ingredient/recipe đổi mà không snapshot đúng tầng | Codify: active recipe/dish derive live; meal/food log historical snapshot. |
| D7 | Medium | Product/barcode chưa model hóa | PRD có AI Lookup, chưa có barcode/product | Scan barcode/package nutrition không có chỗ lưu serving/package | Add `product`, `barcode`, `data_source` sau pantry MVP. |
| D8 | Medium | Mockup ingredient edit vẫn chỉ minh họa `ingredient_unit.factor_to_basis` | Spec notes map “1 quả = ?g” sang `ingredient_unit.factor_to_basis` | Không đủ biểu diễn gross/edible/size/state | Tạo mockup/wireflow mới canonical cho ingredient measurement + pantry + missing conversion. |
| D9 | Medium | Mockup dish edit chưa thể hiện missing conversion hỏi một câu | Có reject state/cross-dimension note; chưa có guided “1 quả/cup bằng bao nhiêu?” | User không biết cách sửa khi thiếu conversion | Add wireflow state: missing conversion sheet with small/medium/large/custom. |
| D10 | Low | Terminology chưa nhất quán: `dish` vs `recipe` | Project hiện dùng `dish`; research dùng recipe/dish | Có thể gây lệch khi làm pantry/recipe import sau này | Trong docs hiện tại giữ `dish` cho app V1; dùng “recipe/công thức” như capability nâng cao hoặc alias. |

---

## 3. Required doc changes đề xuất

### 3.1 `docs/2-requirements/prd.md`

| Section | Change đề xuất | Phase |
|---|---|---|
| F-01 Thư viện Nguyên liệu | Bổ sung note: `ingredient_unit` hiện là measurement layer; các unit count/cup/serving phải ingredient-specific, không global | Phase 1 patch nhỏ |
| F-01 Validation | Thêm optional future fields: state/form, measurement confidence, approximate marker | Phase 1.5A |
| F-02 Quản lý Món ăn | Thêm behavior khi thiếu conversion: hỏi weight/size, không silent convert, không save authoritative nếu unresolved | Phase 1 patch nhỏ |
| New F-02.5 / Phase 1.5A | Thêm “Kho nguyên liệu/Pantry”: quantity, unit, location, expiry, stock lot, pantry alerts | Phase 1.5A |
| Food Log / Calendar | Codify snapshot policy: meal log giữ nutrition snapshot; dish/recipe active derive live | Phase 1.5A/2 |

### 3.2 `docs/3-design/data-model.md`

| Section | Change đề xuất | Phase |
|---|---|---|
| `unit` | Bổ sung `requires_food_specific_conversion`; phân biệt cooking volume vs count/package/serving | Phase 1.5A |
| `ingredient_unit` | Add `ingredient_measurement` cạnh bảng cũ trước, không rename runtime trong MVP | Phase 1.5A |
| `ingredient` | Giữ canonical + add future profile table khi cần product/serving provenance | Phase 1.5A/2 |
| New `ingredient_variant` | State/form raw/cooked/peeled/chopped/canned/dried | Phase 1.5A |
| `dish_ingredient` | Add `conversion_snapshot_json`; optional `measurement_id`, `size_option` | Phase 1.5A |
| New `storage_location`, `pantry_item` | Pantry stock, expiry, gross/edible quantity, conversion snapshot | Phase 1.5A |
| New `product`, `barcode`, `data_source` | Product/package/barcode/source trace | Phase 2 |

### 3.3 `docs/4-architecture/business-rules.md`

Add rules:

```text
RULE-MEASUREMENT-SPECIFICITY
- Global conversion chỉ an toàn cho true mass/volume unit.
- Count/package/serving/cup-to-gram conversion phải ingredient/product/state-specific.

RULE-GROSS-EDIBLE-YIELD
- Nutrition luôn tính trên edible amount.
- Nếu input là gross, phải nhân edible_yield_ratio hoặc hỏi user.

RULE-CONVERSION-SNAPSHOT
- Mỗi saved usage line phải lưu input gốc + normalized amount + conversion snapshot.
- Food log lịch sử phải lưu nutrition snapshot.

RULE-MISSING-CONVERSION-UX
- Nếu thiếu conversion, UI hỏi một câu cụ thể; không silent convert, không fallback 1g = 1ml.
```

### 3.4 Mockup/spec files

| File | Status hiện tại | Required action |
|---|---|---|
| `phase-1-ingredient-edit.html` | Good for guided nutrition create; chưa đủ pantry/gross/edible/state | Giữ, không patch ngay; tạo mockup mới cho advanced measurement/pantry. |
| `phase-1-dish-edit-ingredient-based.html` | Có ingredient amount preview; missing conversion chưa đủ guided | Add/replace later with missing conversion sheet state. |
| `phase-1-management-dish-first-flow.html` | Good dish-first canonical | Add link/spec note tới pantry/measurement wireflow sau khi mockup mới tạo. |
| New `phase-1-5-pantry-recipe-nutrition-wireflow.html` | Chưa có | Create canonical wireflow for Pantry + Measurement + Recipe nutrition. |
| `mockups/README.md` | Chưa liệt kê mockup mới | Update sau khi tạo/verify mockup mới. |

---

## 4. Proposed target scope split

### Phase 1 — giữ ổn định

- Dish-first management.
- Ingredient library support.
- Canonical nutrition per `100g/100ml`.
- Basic `ingredient_unit.factor_to_basis` resolver.
- Preview kcal/macro.

### Phase 1.5A — Pantry & Measurement, mở rộng đúng bài toán user nêu

- `ingredient_measurement` richer model.
- `ingredient_variant/state`.
- Missing conversion guided sheet.
- Pantry stock/location/expiry.
- Conversion snapshot.
- Gross vs edible yield basic.

### Phase 2 — packaged food + external data

- Barcode scan.
- Product/package model.
- Open Food Facts/USDA import/cache.
- Nutrition profile multi-source/per serving/per piece provenance.
- Food log nutrition snapshot full policy.

---

## 5. Audit checklist for next execution

- [x] Read active PRD/core nutrition sections.
- [x] Read active data model unit/ingredient/dish sections.
- [x] Read business rules for dish total and unit normalization.
- [x] Read new research report.
- [x] Search mockups for old/new unit terms.
- [x] Identify missing pantry and richer measurement model.
- [x] Create canonical wireflow/mockup for Pantry + Ingredient Measurement + Recipe nutrition.
- [x] Verify static mockup layout and full-bleed/content inset rule.
- [x] Patch PRD/data-model/business-rules/development-plan with Phase 1.5A scope.
- [x] Ask user via discuss/clarify whether to patch docs or implement plan next.

---

## 6. Risks / ambiguous decisions

| Decision | Why it matters | Suggested discuss later |
|---|---|---|
| Keep `dish` naming or introduce `recipe` entity? | App currently uses `dish`; research uses recipe/công thức | Prefer keep `dish` in runtime, use “công thức” as UX copy only until Phase 2. |
| Replace `ingredient_unit` or add `ingredient_measurement` alongside it? | Migration complexity vs clean model | Prefer add `ingredient_measurement` in Phase 1.5A then deprecate `ingredient_unit` later. |
| Recipe active live totals vs snapshot? | Data consistency vs historical correctness | Active dish/recipe derive live; meal/food log snapshot. |
| Pantry decrement by gross or edible? | Stock UX affects remaining quantity | MVP: store both if known; display user input unit and normalized edible. |
| Barcode/product scope | Can explode implementation scope | Keep as Phase 2 after pantry manual flow works. |

---

## 7. Final audit status

**Status:** Docs hiện tại đúng cho Phase 1 dish-first ingredient library, nhưng chưa đủ cho mục tiêu pantry/recipe/nutrition/unit conversion toàn diện mà user vừa yêu cầu.

**Required before code implementation:** tạo wireflow/mockup mới để chốt UX cho:

1. Pantry stock add/list.
2. Ingredient measurement with size/gross/edible/confidence.
3. Missing conversion handling.
4. Recipe line nutrition preview using conversion snapshot.

Mockup và source docs đã được patched theo scope Phase 1.5A; bước còn lại trước runtime code là visual screenshot review nếu cần hoặc bắt đầu implementation plan.
