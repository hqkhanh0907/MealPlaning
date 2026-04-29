# Comparison — User Architecture Note vs Ingredient Add/Edit UX Research

Ngày: 2026-04-29  
Scope: So sánh nội dung user cung cấp về kiến trúc/UX/data model/nutrition calculation với file audit/research hiện có:

```text
docs/5-development/ingredient-add-edit-recipe-pantry-ux-research-2026-04-29.md
```

> **Evidence boundary:** Nội dung user cung cấp được xử lý như một architecture proposal đầu vào, chưa được verify độc lập với nguồn bên ngoài. Các claim như sai lệch `200–400 calo`, LogMeal/Gemini Multimodal, FAO/INFOODS, USDA FNDDS portion weights cần source URL hoặc sample data nếu muốn đưa vào tài liệu source-of-truth.

---

## 1. Kết luận nhanh

| Hạng mục | So với file audit hiện có | Kết luận |
|---|---|---|
| UX mental model | Rất đồng hướng | Cả hai đều muốn user nhập bằng ngôn ngữ đời thường, không bắt user nghĩ theo `100g/100ml`. |
| Scope | User note rộng hơn nhiều | File audit hiện tại tập trung Ingredient Add/Edit; user note bao trùm pantry, recipe, meal planning, grocery, food log, AI scan, barcode. |
| Data model | User note giàu hơn audit cũ nhưng còn lệch tên so với Phase 1.5A | Ý tưởng đúng, nhưng entity `IngredientUnitConversion` nên map sang `ingredient_measurement`; cần `ingredient_variant`, `conversion_snapshot_json`, `nutrition_snapshot_json`. |
| Unit conversion | Đồng hướng mạnh | Cả hai chống global conversion cho `piece/cup/serving`; user note bổ sung density, size option, override cá nhân. |
| Gross vs edible | User note mạnh hơn audit hiện có | Nên lấy vào audit/implementation vì Phase 1.5A đã chốt normalized edible amount. |
| Cooking yield / retention | User note nâng cao hơn Phase 1.5A | Có giá trị nhưng nên đưa post-MVP/advanced; Phase 1.5A chưa nên ôm full Yield Factor (hệ số hao hụt khối lượng) + Retention Factor (hệ số bảo lưu vi chất). |
| AI/barcode/visual scan | User note có nhiều ý tốt nhưng dễ scope creep | Nên đánh dấu Phase 1.5B/Phase 2; không nên kéo vào Phase 1.5A MVP. |
| Source-of-truth risk | Cao nếu merge nguyên văn | Nhiều thuật ngữ/cấu trúc chưa khớp docs đã chốt; cần normalize trước khi patch vào audit. |

---

## 2. Phần đồng thuận mạnh nên giữ

### 2.1 User-first, không form-first

File audit hiện có nói:

```text
100g/100ml vẫn đúng về data model, nhưng không nên là mental model chính của user.
```

User note cũng cùng hướng:

```text
Giải quyết sự phức tạp của quy đổi đơn vị mà không gây áp lực lên nhận thức của người dùng.
```

**Kết luận:** Đây là principle cốt lõi nên giữ nguyên.

UX rule nên dùng:

```text
UI hỏi theo đời thực: “Bạn đang có bao nhiêu?”, “Bạn đo bằng gì?”, “Phần này là cả vỏ/xương hay phần ăn được?”
System tự chuẩn hóa sang g/ml + nutrition basis + snapshot.
```

---

### 2.2 Search / scan / manual / database selection

File audit hiện có có Pattern A:

```text
Search nguyên liệu trước → có thì chọn, không có thì tạo mới.
```

User note mở rộng thành 4 input modes:

1. Barcode scan.
2. Text search/fuzzy search.
3. Visual AI scan.
4. Manual input.

**Kết luận:** Nên giữ model 4 entry points nhưng chia phase:

| Entry point | Fit Phase 1.5A | Ghi chú |
|---|---:|---|
| Text search | Có | MVP nên làm. |
| Manual input | Có | MVP cần để unblock. |
| Pick from local DB / seed | Có | Dựa trên ingredient hiện có. |
| Barcode scan | Chưa | Chuẩn bị schema product/barcode, runtime để Phase 2. |
| Visual AI scan | Chưa | Thuộc Phase 1.5B/AI hoặc Phase 2. |
| USDA live search | Cân nhắc | App đang offline-first; live search cần cache/sync strategy. |

---

### 2.3 Preview nutrition trước khi save

File audit hiện có:

```text
Mỗi form nên có card “Xem lại cách app sẽ tính”.
```

User note:

```text
Real-time macro update khi số lượng hoặc trạng thái thay đổi.
```

**Kết luận:** Hai ý này bổ sung cho nhau. Pattern chuẩn nên là:

```text
User nhập amount/unit/state
→ resolver tính normalized edible amount
→ preview kcal/protein/carbs/fat/fiber
→ nếu approximate thì hiển thị ≈ + confidence/source
→ save kèm conversion snapshot
```

---

### 2.4 Không dùng global conversion cho unit phụ thuộc ingredient

File audit hiện có đã nói `1 cup`, `2 eggs`, serving wording không expose conversion factor. User note nói rõ hơn:

```text
1 cup bột mì khác 1 cup nước/sữa.
Đơn vị rời rạc như trái/củ/lát phải map theo từng ingredient.
```

**Kết luận:** Đây là điểm nên merge vào audit dưới dạng rule rõ ràng.

Target Phase 1.5A:

```text
Global conversion chỉ an toàn cho:
- g ↔ kg
- ml ↔ l
- tbsp/tsp/cup → ml nếu chỉ xử lý volume

Ingredient-specific conversion bắt buộc khi:
- piece/quả/trái/củ/tép/lát/pack/bottle/serving
- cup/tbsp/tsp cần đổi sang gram
```

---

## 3. Phần user note bổ sung tốt hơn file audit

### 3.1 Gross vs edible rõ hơn

File audit hiện có gần như chưa đủ phần này. User note bổ sung mạnh qua dưa hấu, khoai tây, trứng.

Nên đưa vào audit/implementation:

```text
Input có thể là gross amount hoặc edible amount.
Nutrition chỉ tính trên edible amount.
Nếu measurement applies_to = gross, resolver phải áp dụng edible_yield_ratio.
```

Mapping đúng với Phase 1.5A:

```text
ingredient_measurement.applies_to = 'gross' | 'edible'
ingredient_measurement.edible_yield_ratio = 0..1
pantry_item.gross_quantity
pantry_item.edible_quantity
recipe line conversion_snapshot_json
```

Ví dụ tốt để giữ:

| Ingredient | User note | Cách map Phase 1.5A |
|---|---|---|
| Dưa hấu | 1 trái 4000g gross, edible 60% | `quantity_per_unit=4000`, `applies_to='gross'`, `edible_yield_ratio=0.6` |
| Trứng | vỏ không ăn được | Có thể model `whole egg shell-on` gross hoặc `egg edible large` edible; cần UX hỏi/seed rõ. |
| Khoai tây | raw/peeled/boiled khác nhau | Dùng `ingredient_variant.state/form`; cooking yield để advanced. |

---

### 3.2 User custom override

User note có điểm tốt:

```text
Nếu user tự cân: “1 cup hành tây = 150g”, lưu override cá nhân và ưu tiên cho user đó.
```

File audit hiện có mới nói conversion preview, chưa nói rõ override cá nhân.

Nên đưa vào Phase 1.5A như MVP-lite:

```text
Missing conversion sheet:
- Chỉ dùng lần này → lưu snapshot only.
- Nhớ cho sau → tạo/update ingredient_measurement với confidence='user_custom'.
```

Nếu cần per-user override thật sự, target schema cần thêm `user_id` nullable vào measurement hoặc bảng override riêng. Docs hiện tại `ingredient_measurement` chưa có `user_id`; vì vậy có 2 hướng:

| Hướng | Ưu | Nhược |
|---|---|---|
| Thêm `user_id` nullable vào `ingredient_measurement` | Đơn giản, query một bảng | Làm lẫn curated/global và personal override |
| Tạo `user_ingredient_measurement_override` | Sạch source/provenance hơn | Thêm bảng và resolver precedence |

Đề xuất ít rủi ro: post-MVP dùng bảng riêng `user_ingredient_measurement_override`; MVP Phase 1.5A có thể lưu `confidence='user_custom'` nếu app single-user/offline-first.

---

### 3.3 Pantry item là stock/lot, không phải ingredient master

User note mô tả Pantry screen theo storage location, expiry, quantity. File audit hiện có chỉ nhắc pantry như pattern evidence.

Phase 1.5A đã chốt `pantry_item`, nên nên đưa rõ hơn vào audit:

```text
Ingredient = cà chua là gì.
Ingredient measurement = 1 quả cà chua vừa khoảng bao nhiêu gram.
Pantry item = hôm nay user có 4 quả cà chua trong tủ lạnh, hạn dùng 2026-05-02.
```

---

### 3.4 Food log / meal history snapshot

User note nhấn mạnh snapshot để không drift khi admin/update source thay đổi conversion. Đây là đúng và nên giữ.

Audit hiện có mới nói preview không persist; cần bổ sung phân biệt:

```text
Preview card không persist.
Nhưng usage record phải persist snapshot.
```

Snapshot nên có:

```text
conversion_snapshot_json:
- measurement_id
- version
- quantity_per_unit
- quantity_unit_id
- applies_to
- edible_yield_ratio
- confidence
- source

nutrition_snapshot_json:
- nutrition_profile_id or ingredient_id
- basis_type
- calories/protein/carbs/fat/fiber at time of logging
- source/confidence
```

---

## 4. Phần cần chỉnh/không nên merge nguyên văn

### 4.1 `IngredientUnitConversion` chưa khớp Phase 1.5A naming

User note dùng entity:

```text
IngredientUnitConversion(id, ingredient_id, unit_id, weight_in_grams, size_modifier, user_id)
```

Phase 1.5A đã chốt target:

```text
ingredient_measurement(
  ingredient_id,
  variant_id,
  unit_id,
  display_label,
  size_option,
  quantity_per_unit,
  quantity_unit_id,
  applies_to,
  edible_yield_ratio,
  confidence,
  data_source_id,
  version
)
```

**Vấn đề nếu merge nguyên văn:** mất `variant_id`, `applies_to`, `quantity_unit_id`, `confidence`, `version`; `weight_in_grams` không xử lý tốt liquid per 100ml.

**Cách normalize:** đổi `IngredientUnitConversion` thành `IngredientMeasurement` hoặc `ingredient_measurement`.

---

### 4.2 Food Density Database không nên là resolver chính trong MVP

User note nói dùng Food Density Database / FAO/INFOODS để volume-to-weight conversion.

Ý tưởng đúng cho advanced, nhưng Phase 1.5A nên ưu tiên:

1. Exact ingredient measurement curated/user custom.
2. Ingredient-specific measurement by variant/form.
3. Density fallback nếu có source/confidence rõ.
4. Category average only as low-confidence estimate, không authoritative.

Rule an toàn:

```text
Không dùng category/base_density_estimate để tính nutrition authoritative nếu không show “ước lượng” và không snapshot confidence.
```

---

### 4.3 Cooking Yield Factor / Retention Factor là advanced, không phải MVP

User note có phần:

```text
Yield Factor (YF) và Retention Factor (RF) để tính món sau nấu.
```

Đây là hướng đúng về khoa học thực phẩm, nhưng vượt Phase 1.5A MVP vì cần:

- Recipe cooking method.
- Nutrient-specific retention table.
- Cooked weight / final yield input.
- Versioned calculation rules.

Nên đưa vào roadmap advanced:

```text
Phase 1.5A: normalized edible amount + recipe line nutrition preview.
Post-MVP: cooked yield, retention factor, final cooked weight per recipe.
```

---

### 4.4 AI scan / LogMeal / Gemini Multimodal dễ làm scope creep

User note đề xuất Visual AI Scan, segmentation, volume estimate.

Product Vision có AI-first, nhưng Phase 1.5A đã tách AI foundation sang Phase 1.5B. Vì vậy:

- Không đưa vào Phase 1.5A acceptance criteria.
- Có thể giữ trong “Future enhancement”.
- Nếu đưa vào audit, phải label rõ `Phase 1.5B/Phase 2`.

---

### 4.5 Swipe-to-decrement và auto grocery cần thận trọng

User note đề xuất swipe-to-action để giảm stock và tự đưa món hết vào Grocery List.

Rủi ro:

- Mobile swipe dễ conflict với Ionic list gestures/accessibility.
- Auto-decrement pantry khi nấu/log món đã được docs Phase 1.5A defer vì cần lot selection.
- Auto grocery có thể gây sai nếu user không muốn mua lại.

Đề xuất:

```text
MVP: explicit “Cập nhật số lượng” / “Đã dùng hết” action.
Advanced: swipe shortcut + grocery suggestion, không auto-add silent.
```

---

### 4.6 Recursion depth for nested recipe là đúng nhưng không thuộc audit hiện tại

User note nói recipe có thể dùng recipe khác như ingredient, cần chống infinite loop.

Đúng về architecture, nhưng file audit hiện tại là Ingredient Add/Edit UX. Nếu đưa vào, chỉ nên nằm ở “Advanced architecture risks”, không phải form UX.

---

## 5. So sánh theo từng flow UX

| Flow | File audit hiện có | User note | Đánh giá |
|---|---|---|---|
| Ingredient library | Search-first, guided create, edit warning | Có manual/search/AI/barcode | Đồng hướng; cần tách AI/barcode future. |
| Pantry management | Mới là evidence pattern SuperCook | Card by storage, expiry, decrement, grocery | User note bổ sung tốt; nên đưa vào Phase 1.5A pantry docs/mockup, không nhét hết vào Ingredient Add/Edit. |
| Recipe builder | Tạo từ món, thêm ingredient line, preview | State bottom sheet, real-time macro | Nên merge state/variant bottom sheet; real-time preview tốt. |
| Meal planning | Audit chỉ nhắc meal-context logging | Weekly planner, drag/drop, pantry cross-reference | Advanced; nên roadmap post-MVP. |
| Missing conversion | Audit có abnormal warning | Fallback sheet, estimate vs manual, save override | User note tốt hơn; nên đưa vào audit với wording an toàn: estimate phải marked low-confidence. |

---

## 6. So sánh data model

| Concept | File audit hiện có | User note | Phase 1.5A normalized target |
|---|---|---|---|
| Ingredient | `ingredient.name/category` | `Ingredient(id, name, category_id, fdc_id)` | OK; thêm alias/fdc_id là advanced. |
| State/form | Ít đề cập | `default_state`, `State enum` | Dùng `ingredient_variant(state, form)`. |
| Unit conversion | `ingredient_unit.factor_to_basis` | `IngredientUnitConversion.weight_in_grams` | Dùng `ingredient_measurement.quantity_per_unit + quantity_unit_id`. |
| Size option | Có ví dụ small/medium/large ít | Có `size_modifier` | Dùng `size_option`. |
| Gross/edible | Thiếu | Có `edible_yield_ratio` | Dùng `applies_to + edible_yield_ratio`; pantry lưu gross/edible. |
| Nutrition profile | Canonical 100g/100ml | Multi-source NutritionProfile | Phase 1 direct columns + Phase 1.5A/2 `nutrition_profile`. |
| Pantry | Chưa model rõ | `PantryItem(normalized_quantity_g)` | Cần support g/ml, gross/edible, storage, expiry, snapshot. |
| Recipe line | `dish_ingredient` resolver | `snap_weight_g`, `snap_nutrition_json` | Dùng input + normalized edible amount + conversion snapshot + nutrition snapshot if log/history. |
| Meal item | Ít đề cập | polymorphic recipe/ingredient | Hợp lý nhưng cần avoid overengineering MVP. |
| Product/barcode | Product card evidence | `BarcodeProduct` | Future; schema optional, runtime scan deferred. |
| Data source | Source chip | `DataSource(trust_level)` | OK; use confidence `verified/estimated/user_custom/ai_estimated`. |

---

## 7. Recommended updates nếu patch file audit

Nếu patch `ingredient-add-edit-recipe-pantry-ux-research-2026-04-29.md`, nên làm theo thứ tự:

1. Giữ sync note đầu file đã thêm.
2. Section 2: cập nhật Source of Truth nội bộ để nhắc PRD F-02.5, data-model, business-rules, ADR Phase 1.5A.
3. Section 4 Pattern C: thay mapping `ingredient_unit.factor_to_basis` bằng `ingredient_measurement`.
4. Section 4 thêm Pattern G: Gross vs edible.
5. Section 4 thêm Pattern H: Missing conversion sheet với `Chỉ lần này` / `Nhớ cho sau`.
6. Section 5: tách flow thành 3 context:
   - Ingredient library add/edit.
   - Pantry add stock.
   - Recipe ingredient line.
7. Section 5.2 form: thêm `state/form`, `applies_to gross/edible`, `edible_yield_ratio`, source/confidence, snapshot note.
8. Section 5.3: sửa “không cần đổi DB lớn” thành “UX flow giữ đơn giản nhưng Phase 1.5A cần schema extension”.
9. Section 6: rewrite mapping sang Phase 1.5A target entities.
10. Section 7: thêm missing conversion, gross/edible, user override, snapshot, và label AI/barcode as future.

---

## 8. Final recommendation

Nội dung user cung cấp có giá trị cao hơn file audit hiện có ở tầng **system architecture** và **measurement/nutrition correctness**, nhưng cần normalize mạnh trước khi nhập vào docs vì:

- Một số entity naming chưa khớp Phase 1.5A.
- Một số feature vượt MVP: AI scan, barcode runtime, grocery automation, cooked yield/retention, recipe recursion.
- Một số claim cần source/evidence nếu muốn dùng làm research fact.

Cách dùng tốt nhất:

```text
Dùng file audit hiện có làm UX rationale.
Dùng user note làm expansion backlog cho Phase 1.5A+.
Patch audit bằng các concept đã chốt: ingredient_measurement, ingredient_variant, gross/edible, missing conversion, snapshot.
Đưa AI/barcode/yield-retention/weekly planner vào advanced roadmap, không kéo vào Phase 1.5A MVP.
```
